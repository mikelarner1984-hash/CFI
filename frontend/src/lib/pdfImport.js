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
  const lines = text.split('\n');
  
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;
  const timeRegex = /\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/g;
  const numberRegex = /\b(\d+\.?\d*)\b/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const timeMatches = [...line.matchAll(timeRegex)];
    if (timeMatches.length < 2) continue;

    const date = parseDateString(dateMatch[1]);
    if (!date) continue;

    const startTime = formatTimeFromMatch(timeMatches[0]);
    const finishTime = formatTimeFromMatch(timeMatches[1]);

    const remainingText = line.substring(timeMatches[1].index + timeMatches[1][0].length);
    const numbers = [...remainingText.matchAll(numberRegex)].map(m => parseFloat(m[1]));

    if (numbers.length >= 2) {
      const totalHours = calculateHours(startTime, finishTime);
      
      entries.push({
        id: Date.now() + Math.random(),
        date: date,
        startTime: startTime,
        finishTime: finishTime,
        totalHours: totalHours,
        clientMiles: numbers[0] || 0,
        commuteMiles: numbers[1] || 0,
      });
    }
  }

  return entries;
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
