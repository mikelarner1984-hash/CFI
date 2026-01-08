import * as pdfjsLib from 'pdfjs-dist';
import { calculateHours } from './timeUtils';

// Use local worker from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const importFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allText = '';
    let allItems = [];
    
    // Extract text with positioning information
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Get text items with their positions
      textContent.items.forEach(item => {
        allItems.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5]
        });
      });
      
      // Also keep simple text for pattern matching
      const pageText = textContent.items.map(item => item.str).join(' ');
      allText += pageText + '\n';
    }

    console.log('PDF Text Extracted:', allText.substring(0, 500)); // Debug log
    
    const entries = parseTextToEntries(allText, allItems);
    
    if (entries.length === 0) {
      console.error('No entries parsed from text');
      throw new Error('No valid entries found in PDF');
    }
    
    console.log(`Parsed ${entries.length} entries from PDF`);
    return entries;
  } catch (error) {
    console.error('PDF import error:', error);
    throw new Error('Failed to parse PDF. Please ensure it contains a valid table with Date, Time, and Client columns.');
  }
};

const parseTextToEntries = (text, items) => {
  const entries = [];
  
  // More flexible patterns
  // Date pattern: "Fri 2/1", "Mon 12/1", etc.
  const datePattern = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*(\d{1,2})\s*\/\s*(\d{1,2})/gi;
  
  // Time pattern: "09:00-11:00", "9:00 - 11:00", etc.
  const timePattern = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and headers
    if (!line.trim() || 
        line.includes('Care Horizons') || 
        line.includes('Staff Work Schedule') ||
        line.includes('Coordinator') ||
        line.includes('Date Time Dur') ||
        line.includes('Staff providing care') ||
        line.includes('Page ') ||
        line.includes('Visits')) {
      continue;
    }
    
    // Reset regex indices
    datePattern.lastIndex = 0;
    timePattern.lastIndex = 0;
    
    const dateMatch = datePattern.exec(line);
    const timeMatch = timePattern.exec(line);
    
    if (dateMatch && timeMatch) {
      const dayOfWeek = dateMatch[1];
      const day = parseInt(dateMatch[2]);
      const month = parseInt(dateMatch[3]);
      
      // Determine year - assume current or next year
      const currentDate = new Date();
      let year = currentDate.getFullYear();
      
      // If month is January and we're in December, it's next year
      if (month === 1 && currentDate.getMonth() === 11) {
        year += 1;
      }
      // If month seems in the past by more than 6 months, assume next year
      else if (month < currentDate.getMonth() - 5) {
        year += 1;
      }
      
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) continue;
      
      const startHour = parseInt(timeMatch[1]);
      const startMin = timeMatch[2];
      const endHour = parseInt(timeMatch[3]);
      const endMin = timeMatch[4];
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;
      
      // Try to extract client name
      // Look for text between time and common staff indicators
      const afterTimeIndex = line.indexOf(timeMatch[0]) + timeMatch[0].length;
      const afterTime = line.substring(afterTimeIndex);
      
      // Split by multiple spaces or tabs
      const parts = afterTime.split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p);
      
      // Look for client name - typically in format "LastName, Initial"
      let client = '';
      for (let part of parts) {
        // Skip duration (HH:MM format)
        if (/^\d{1,2}:\d{2}$/.test(part)) continue;
        
        // Skip staff name containing "Larner"
        if (part.includes('Larner')) continue;
        
        // If it looks like a name (has comma or capital letters)
        if (part.includes(',') || /[A-Z]/.test(part)) {
          // Skip activity names
          if (!part.includes('Day Support') && 
              !part.includes('Supported Living') && 
              !part.includes('Sleep In')) {
            client = part;
            break;
          }
        }
      }
      
      // Fallback: try to find pattern like "Argo, B" or "Preece, D"
      if (!client) {
        const nameMatch = line.match(/([A-Z][a-z]+,\s*[A-Z]+)/);
        if (nameMatch && !nameMatch[1].includes('Larner')) {
          client = nameMatch[1];
        }
      }
      
      const totalHours = calculateHours(startTime, endTime);
      
      entries.push({
        id: Date.now() + Math.random() + i,
        date: date.toISOString().split('T')[0],
        client: client || '',
        startTime: startTime,
        finishTime: endTime,
        totalHours: totalHours,
        clientMiles: 0,
        commuteMiles: 0,
        worked: true,
      });
    }
  }
  
  console.log('Entries found:', entries.length);
  return entries;
};

