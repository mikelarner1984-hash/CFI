import * as pdfjsLib from 'pdfjs-dist';
import { calculateHours } from './timeUtils';

// Use local worker from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const importFromPDF = async (file) => {
  try {
    console.log('Starting PDF import...', file.name);
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let allText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      allText += pageText + '\n';
    }

    console.log('Extracted text length:', allText.length);
    console.log('First 1000 chars:', allText.substring(0, 1000));
    
    const entries = parseTextToEntries(allText);
    
    console.log('Parsed entries:', entries.length);
    
    if (entries.length === 0) {
      console.error('No entries parsed. Full text:', allText);
      throw new Error('No valid entries found in PDF. Please check the PDF format matches: Date (e.g. "Fri 2/1"), Time (e.g. "09:00-11:00"), Client names.');
    }
    
    return entries;
  } catch (error) {
    console.error('PDF import error:', error);
    if (error.message.includes('No valid entries')) {
      throw error;
    }
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

const parseTextToEntries = (text) => {
  const entries = [];
  
  // Split into lines and clean
  const lines = text.split('\n');
  
  console.log('Total lines:', lines.length);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty or header lines
    if (!line.trim() || 
        line.includes('Care Horizons') || 
        line.includes('Staff Work Schedule') ||
        line.includes('Coordinator') ||
        line.includes('Status Selection') ||
        line.includes('Staff providing care') ||
        line.includes('Visits') ||
        line.toLowerCase().includes('date time dur')) {
      continue;
    }
    
    // Look for date pattern: Day name followed by day/month
    // Examples: "Fri 2/1", "Mon 5/1", "Tue 6/1"
    const dateMatch = line.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*(\d{1,2})\s*\/\s*(\d{1,2})/i);
    
    // Look for time pattern: HH:MM-HH:MM
    // Examples: "09:00-11:00", "11:30-22:59", "23:00-07:00"
    const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    
    if (dateMatch && timeMatch) {
      console.log(`Found match on line ${i}: ${line.substring(0, 100)}`);
      
      const day = parseInt(dateMatch[2]);
      const month = parseInt(dateMatch[3]);
      
      // Determine year
      const now = new Date();
      let year = now.getFullYear();
      
      // If January and we're in December or later, it's next year
      if (month === 1 && now.getMonth() >= 11) {
        year += 1;
      }
      // If month is 1 (January) and current month is less than 6, stay in current year
      else if (month === 1 && now.getMonth() < 6) {
        year = now.getFullYear();
      }
      
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${day}/${month}/${year}`);
        continue;
      }
      
      // Parse times
      let startHour = parseInt(timeMatch[1]);
      const startMin = timeMatch[2];
      let endHour = parseInt(timeMatch[3]);
      const endMin = timeMatch[4];
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;
      
      // Try to extract client name
      // Look for text after the time but before activity keywords
      let client = '';
      
      // Remove everything before and including the time
      const afterTime = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length);
      
      // Split by whitespace (multiple spaces)
      const parts = afterTime.split(/\s+/).filter(p => p.trim());
      
      // Look for client name patterns
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        
        // Skip durations (format: XX:XX)
        if (/^\d{1,2}:\d{2}$/.test(part)) continue;
        
        // Skip staff name
        if (part.includes('Larner')) continue;
        
        // Look for name with comma (e.g., "Argo,", "Preece,", "Stanton,")
        if (part.includes(',')) {
          // Get this word and potentially the next one (initial)
          client = part;
          if (j + 1 < parts.length && parts[j + 1].length <= 2) {
            client += ' ' + parts[j + 1];
          }
          break;
        }
      }
      
      // Alternative: look for pattern in original line
      if (!client) {
        const namePattern = /(?:Argo|Preece|Stanton)[,\s]+[A-Z]+/i;
        const nameMatch = line.match(namePattern);
        if (nameMatch) {
          client = nameMatch[0];
        }
      }
      
      const totalHours = calculateHours(startTime, endTime);
      
      const entry = {
        id: Date.now() + Math.random() + i,
        date: date.toISOString().split('T')[0],
        client: client.trim(),
        startTime: startTime,
        finishTime: endTime,
        totalHours: totalHours,
        clientMiles: 0,
        commuteMiles: 0,
        worked: true,
      };
      
      console.log('Created entry:', entry);
      entries.push(entry);
    }
  }
  
  console.log(`Total entries created: ${entries.length}`);
  return entries;
};

