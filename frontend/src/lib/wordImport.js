import mammoth from 'mammoth';
import { calculateHours } from './timeUtils';

export const importFromWord = async (file) => {
  try {
    console.log('Starting Word document import...', file.name);
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength);
    
    // Extract text from Word document
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    console.log('Extracted text length:', text.length);
    console.log('First 1000 chars:', text.substring(0, 1000));
    
    const entries = parseTextToEntries(text);
    
    console.log('Parsed entries:', entries.length);
    
    if (entries.length === 0) {
      console.error('No entries parsed. Full text:', text.substring(0, 2000));
      throw new Error('No valid entries found in document. Please check the document format matches: Date (e.g. "Fri 2/1"), Time (e.g. "09:00-11:00"), Client names.');
    }
    
    return entries;
  } catch (error) {
    console.error('Word document import error:', error);
    if (error.message.includes('No valid entries')) {
      throw error;
    }
    throw new Error(`Failed to parse document: ${error.message}`);
  }
};

const parseTextToEntries = (text) => {
  const entries = [];
  
  // Split into lines and clean
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  console.log('Total lines:', lines.length);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty or header lines
    if (!line || 
        line.includes('Care Horizons') || 
        line.includes('Staff Work Schedule') ||
        line.includes('Coordinator') ||
        line.includes('Status Selection') ||
        line.includes('Staff providing care') ||
        line.includes('Visits') ||
        line.toLowerCase().includes('date') && line.toLowerCase().includes('time')) {
      continue;
    }
    
    // Look for date pattern: Day name followed by day/month
    // Examples: "Fri 2/1", "Mon 5/1", "Tue 6/1"
    const dateMatch = line.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*(\d{1,2})\s*[\/\-]\s*(\d{1,2})/i);
    
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
      
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${day}/${month}/${year}`);
        continue;
      }
      
      // Parse times
      const startHour = parseInt(timeMatch[1]);
      const startMin = timeMatch[2];
      const endHour = parseInt(timeMatch[3]);
      const endMin = timeMatch[4];
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;
      
      // Try to extract client name
      let client = '';
      
      // Remove everything before and including the time
      const afterTime = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length);
      
      // Split by whitespace
      const parts = afterTime.split(/\s+/).filter(p => p.trim());
      
      // Look for client name patterns
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        
        // Skip durations (format: XX:XX)
        if (/^\d{1,2}:\d{2}$/.test(part)) continue;
        
        // Skip staff name
        if (part.toLowerCase().includes('larner')) continue;
        
        // Look for name with comma (e.g., "Argo,", "Preece,", "Stanton,")
        if (part.includes(',')) {
          // Get this word and potentially the next one (initial)
          client = part;
          if (j + 1 < parts.length && parts[j + 1].length <= 3) {
            client += ' ' + parts[j + 1];
          }
          break;
        }
        
        // Look for capitalized words that could be names
        if (/^[A-Z][a-z]+$/.test(part) && j < parts.length - 1) {
          // Check if next part could be an initial or last name
          const nextPart = parts[j + 1];
          if (nextPart.includes(',') || /^[A-Z]\.?$/.test(nextPart)) {
            client = part + ' ' + nextPart;
            break;
          }
        }
      }
      
      // Clean up client name
      client = client.replace(/,\s*$/, '').trim();
      
      const totalHours = calculateHours(startTime, endTime);
      
      const entry = {
        id: Date.now() + Math.random() + i,
        date: date.toISOString().split('T')[0],
        client: client,
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
