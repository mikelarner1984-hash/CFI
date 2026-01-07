import * as pdfjsLib from 'pdfjs-dist';
import { calculateHours } from './timeUtils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  
  // Look for table headers to identify the structure
  let headerIndex = -1;
  let dateColIndex = -1;
  let timeColIndex = -1;
  let clientColIndex = -1;
  
  // Find header row and column positions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('date') && (line.includes('time') || line.includes('client'))) {
      headerIndex = i;
      
      // Split the header line to find column positions
      const headerParts = lines[i].split(/\s{2,}|\t/); // Split by multiple spaces or tabs
      
      for (let j = 0; j < headerParts.length; j++) {
        const header = headerParts[j].toLowerCase().trim();
        if (header.includes('date')) {
          dateColIndex = j;
        } else if (header.includes('time')) {
          timeColIndex = j;
        } else if (header.includes('client') || header.includes('staff')) {
          clientColIndex = j;
        }
      }
      break;
    }
  }
  
  // If we found headers, parse the data rows
  if (headerIndex >= 0) {
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Split the data line using the same method as headers
      const dataParts = line.split(/\s{2,}|\t/).map(part => part.trim());
      
      if (dataParts.length < Math.max(dateColIndex, timeColIndex, clientColIndex) + 1) {
        continue; // Skip if not enough columns
      }
      
      // Extract date
      const dateStr = dataParts[dateColIndex] || '';
      const date = parseDateString(dateStr);
      if (!date) continue;
      
      // Extract and split time (format: "start-finish")
      const timeStr = dataParts[timeColIndex] || '';
      const timeRange = parseTimeRange(timeStr);
      if (!timeRange) continue;
      
      // Extract client
      const client = dataParts[clientColIndex] || '';
      
      // Calculate total hours
      const totalHours = calculateHours(timeRange.startTime, timeRange.finishTime);
      
      entries.push({
        id: Date.now() + Math.random() + i,
        date: date,
        client: client,
        startTime: timeRange.startTime,
        finishTime: timeRange.finishTime,
        totalHours: totalHours,
        clientMiles: 0, // Default values since not specified in the new format
        commuteMiles: 0,
        worked: true, // Default to worked
      });
    }
  } else {
    // Fallback: try to parse each line individually
    const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;
    const timeRangeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const dateMatch = line.match(dateRegex);
      const timeRangeMatch = line.match(timeRangeRegex);
      
      if (!dateMatch || !timeRangeMatch) continue;
      
      const date = parseDateString(dateMatch[1]);
      if (!date) continue;
      
      const startTime = formatTimeFromMatch([
        timeRangeMatch[0],
        timeRangeMatch[1],
        timeRangeMatch[2],
        timeRangeMatch[3]
      ]);
      
      const finishTime = formatTimeFromMatch([
        timeRangeMatch[0],
        timeRangeMatch[4],
        timeRangeMatch[5],
        timeRangeMatch[6]
      ]);
      
      // Try to extract client name (text that's not date or time)
      let client = line
        .replace(dateMatch[0], '')
        .replace(timeRangeMatch[0], '')
        .replace(/\d+\.?\d*/g, '') // Remove numbers
        .trim();
      
      const totalHours = calculateHours(startTime, finishTime);
      
      entries.push({
        id: Date.now() + Math.random() + i,
        date: date,
        client: client,
        startTime: startTime,
        finishTime: finishTime,
        totalHours: totalHours,
        clientMiles: 0,
        commuteMiles: 0,
        worked: true,
      });
    }
  }
  
  return entries;
};

// New function to parse time ranges in format "start-finish"
const parseTimeRange = (timeStr) => {
  if (!timeStr) return null;
  
  // Match patterns like "9:00-17:00", "9:00 AM - 5:00 PM", etc.
  const timeRangeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i;
  const match = timeStr.match(timeRangeRegex);
  
  if (!match) return null;
  
  const startTime = formatTimeFromMatch([
    match[0],
    match[1],
    match[2],
    match[3]
  ]);
  
  const finishTime = formatTimeFromMatch([
    match[0],
    match[4],
    match[5],
    match[6]
  ]);
  
  return { startTime, finishTime };
};

const parseDateString = (dateStr) => {
  const cleaned = dateStr.replace(/[\.]/g, '/');
  const parts = cleaned.split(/[\/\-]/);
  
  if (parts.length !== 3) return null;

  let month, day, year;
  
  if (parts[2].length === 4) {
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
    year = parseInt(parts[2]);
  } else {
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
    year = parseInt(parts[2]);
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split('T')[0];
};

const formatTimeFromMatch = (match) => {
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};
