import mammoth from 'mammoth';
import { calculateHours } from './timeUtils';

// Helper function to recalculate hours
const calculateHours = (startTime, finishTime) => {
  if (!startTime || !finishTime) return 0;

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [finishHour, finishMinute] = finishTime.split(':').map(Number);

  let startMinutes = startHour * 60 + startMinute;
  let finishMinutes = finishHour * 60 + finishMinute;

  if (finishMinutes < startMinutes) {
    finishMinutes += 24 * 60;
  }

  const diffMinutes = finishMinutes - startMinutes;
  return diffMinutes / 60;
};

export const importFromWord = async (file) => {
  try {
    console.log('Starting Word document import...', file.name);
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength);
    
    // Extract text from Word document
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    console.log('Extracted text length:', text.length);
    console.log('First 2000 chars:', text.substring(0, 2000));
    console.log('Full text preview:', text.substring(0, 5000));
    
    const entries = parseTextToEntries(text);
    
    console.log('Parsed entries:', entries.length);
    
    if (entries.length === 0) {
      console.error('No entries parsed.');
      console.log('Full extracted text:', text);
      
      // Show helpful error with actual text preview
      const preview = text.substring(0, 500);
      throw new Error(
        `No valid entries found in document.\n\n` +
        `Text extracted preview:\n"${preview}..."\n\n` +
        `Expected format:\n` +
        `- Date like "Fri 2/1" or "Mon 5/1"\n` +
        `- Time like "09:00-11:00"\n` +
        `- Client names after the time\n\n` +
        `Please check the document format or try manually adding entries.`
      );
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
  
  console.log('Full text length:', text.length);
  console.log('First 1000 chars:', text.substring(0, 1000));
  
  // The text might be all on one line - split by day of week patterns
  // Pattern: (Day name) followed by (number/number)
  const entrySplitPattern = /(?=(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}-\d{1,2}:\d{2})/gi;
  
  // Split the text into entries
  let entryStrings = text.split(entrySplitPattern).filter(s => s && s.trim().length > 20);
  
  // Remove the day name capture groups
  entryStrings = entryStrings.filter(s => !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i.test(s.trim()));
  
  console.log('Split into', entryStrings.length, 'potential entries');
  console.log('First 5 entry strings:', entryStrings.slice(0, 5));
  
  // Date pattern: "Fri 2/1"
  const datePattern = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\/(\d{1,2})/i;
  
  // Time pattern: "09:00-11:00"
  const timePattern = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
  
  for (let i = 0; i < entryStrings.length; i++) {
    const entryText = entryStrings[i].trim();
    
    if (entryText.length < 20) continue;
    
    console.log(`\n--- Processing entry ${i} ---`);
    console.log('Entry text:', entryText.substring(0, 150));
    
    // Match date
    const dateMatch = entryText.match(datePattern);
    if (!dateMatch) {
      console.log('No date match');
      continue;
    }
    console.log('✓ Date matched:', dateMatch[0]);
    
    // Match time
    const timeMatch = entryText.match(timePattern);
    if (!timeMatch) {
      console.log('No time match');
      continue;
    }
    console.log('✓ Time matched:', timeMatch[0]);
    
    // Parse date
    const day = parseInt(dateMatch[2]);
    const month = parseInt(dateMatch[3]);
    const now = new Date();
    let year = now.getFullYear();
    
    if (month === 1 && now.getMonth() >= 11) {
      year += 1;
    }
    
    let date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      console.log('Invalid date');
      continue;
    }
    
    // Parse times
    let startHour = parseInt(timeMatch[1]);
    const startMin = timeMatch[2];
    const endHour = parseInt(timeMatch[3]);
    const endMin = timeMatch[4];
    
    let startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
    let endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;
    
    // If start time is 23:00, adjust to 00:00 and move date forward 1 day
    if (startTime === '23:00') {
      console.log('Adjusting 23:00 start time to next day');
      startTime = '00:00';
      date.setDate(date.getDate() + 1);
      console.log('New date:', date.toISOString().split('T')[0]);
      console.log('New start time:', startTime);
    }
    
    // If finish time is 07:00, adjust to 08:00
    if (endTime === '07:00') {
      console.log('Adjusting 07:00 finish time to 08:00');
      endTime = '08:00';
      console.log('New finish time:', endTime);
    }
    
    console.log('Times:', startTime, '-', endTime);
    
    // Extract client name
    // Pattern in text: "Fri 2/1 09:00-11:00 02:00 Larner, M Argo, B Day Support"
    // After time: " 02:00 Larner, M Argo, B Day Support"
    
    let client = '';
    
    // Get text after the time match
    const timeIndex = entryText.indexOf(timeMatch[0]);
    const afterTime = entryText.substring(timeIndex + timeMatch[0].length).trim();
    console.log('After time:', afterTime);
    
    // Split by spaces (keeping multiple spaces as separator)
    const parts = afterTime.split(/\s+/);
    console.log('Parts:', parts.slice(0, 10));
    
    // Skip: duration (XX:XX), then staff name (contains "Larner"), then get client name
    let skipCount = 0;
    let foundLarner = false;
    
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      
      // Skip duration (format HH:MM)
      if (/^\d{1,2}:\d{2}$/.test(part)) {
        console.log('Skipping duration:', part);
        skipCount++;
        continue;
      }
      
      // Check if this contains "Larner" - this is the staff
      if (/larner/i.test(part)) {
        console.log('Found staff:', part);
        foundLarner = true;
        skipCount++;
        // Also skip next part if it's just a letter (the initial)
        if (j + 1 < parts.length && parts[j + 1].length <= 2) {
          j++; // Skip the initial
          skipCount++;
        }
        continue;
      }
      
      // After Larner, the next name is the client
      if (foundLarner && skipCount > 0) {
        // This should be the client name
        client = part;
        console.log('Client part 1:', client);
        
        // If next part looks like initial or continuation, add it
        if (j + 1 < parts.length) {
          const nextPart = parts[j + 1];
          // Add if it's a single letter/initial or has comma
          if (nextPart.length <= 3 || nextPart.includes(',')) {
            client += ' ' + nextPart;
            console.log('Client complete:', client);
          }
        }
        break;
      }
    }
    
    // Clean up client name (remove trailing commas)
    client = client.replace(/,\s*$/, '').replace(/\s+/g, ' ').trim();
    
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
    
    console.log('✅ ENTRY CREATED:', JSON.stringify(entry));
    entries.push(entry);
  }
  
  console.log(`\n✅✅✅ Total entries created: ${entries.length} ✅✅✅`);
  
  // Post-process: Check each entry and if the next entry has start time 07:00, adjust it to 08:00
  for (let i = 0; i < entries.length - 1; i++) {
    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];
    
    if (nextEntry.startTime === '07:00') {
      console.log(`\n--- Post-processing: Adjusting next entry's start time ---`);
      console.log(`Current entry ${i}: ${currentEntry.date} ${currentEntry.startTime}-${currentEntry.finishTime}`);
      console.log(`Next entry ${i + 1}: ${nextEntry.date} ${nextEntry.startTime}-${nextEntry.finishTime}`);
      console.log(`Adjusting next entry's start time from 07:00 to 08:00`);
      
      nextEntry.startTime = '08:00';
      // Recalculate total hours with new start time
      nextEntry.totalHours = calculateHours(nextEntry.startTime, nextEntry.finishTime);
      
      console.log(`Next entry updated: ${nextEntry.date} ${nextEntry.startTime}-${nextEntry.finishTime}, Total Hours: ${nextEntry.totalHours}`);
    }
  }
  
  console.log(`\n✅ Post-processing complete. Final entry count: ${entries.length}`);
  return entries;
};
