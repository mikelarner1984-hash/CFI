import * as pdfjsLib from 'pdfjs-dist';
import { calculateHours } from './timeUtils';

// Use local worker instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export const importFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      allText += pageText + '\n';
    }

    const entries = parseTextToEntries(allText);
    return entries;
  } catch (error) {
    console.error('PDF import error:', error);
    throw new Error('Failed to parse PDF. Please ensure it contains a valid table.');
  }
};

const parseTextToEntries = (text) => {
  const entries = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Pattern to match date formats like "Fri 2/1", "Mon 12/1", etc.
  const datePattern = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\/(\d{1,2})/i;
  
  // Pattern to match time ranges like "09:00-11:00", "23:00-07:00"
  const timePattern = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
  
  // Keywords that indicate we're in the data section
  const dataStartKeywords = ['Date', 'Time', 'Staff', 'Client'];
  let inDataSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we've reached the data section
    if (!inDataSection && dataStartKeywords.some(keyword => line.includes(keyword))) {
      inDataSection = true;
      continue;
    }
    
    if (!inDataSection) continue;
    
    // Skip summary lines or page indicators
    if (line.includes('Staff providing care') || 
        line.includes('Page ') || 
        line.includes('Total') ||
        line.includes('Visits')) {
      continue;
    }
    
    // Try to find date and time in the line
    const dateMatch = line.match(datePattern);
    const timeMatch = line.match(timePattern);
    
    if (dateMatch && timeMatch) {
      const dayOfWeek = dateMatch[1];
      const day = parseInt(dateMatch[2]);
      const month = parseInt(dateMatch[3]);
      
      // Assume current year or next year if month is in the future
      const currentDate = new Date();
      let year = currentDate.getFullYear();
      
      // If the month is less than current month, it might be next year
      if (month < currentDate.getMonth() + 1 && currentDate.getMonth() > 6) {
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
      
      // Extract client name - look for names after the time
      // Common pattern: "Larner, M" followed by client name
      const afterTime = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length);
      const parts = afterTime.split(/\s{2,}/).filter(p => p.trim());
      
      // Usually: [Duration, Staff, Client, Activity]
      // We want the Client which is typically the 3rd or 4th element
      let client = '';
      for (let part of parts) {
        // Look for names with pattern "LastName, Initial" or just names
        if (part.includes(',') || /[A-Z][a-z]+/.test(part)) {
          // Skip if it's duration format (HH:MM)
          if (!/^\d{1,2}:\d{2}$/.test(part) && !part.includes('Larner')) {
            client = part;
            break;
          }
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
  
  return entries;
};

