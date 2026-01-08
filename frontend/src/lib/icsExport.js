import { format } from 'date-fns';

export const exportToICS = (entries, datasetTitle = 'Work Tracker') => {
  try {
    console.log('Starting ICS export...', entries.length, 'entries');
    
    // Filter only entries marked as CH Submitted
    const submittedEntries = entries.filter(entry => entry.worked !== false);
    
    console.log('Exporting', submittedEntries.length, 'submitted entries to calendar');
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CFI Group//Work Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${datasetTitle}`,
      'X-WR-TIMEZONE:UTC',
    ].join('\r\n');

    submittedEntries.forEach(entry => {
      const eventDate = entry.date.replace(/-/g, ''); // Format: YYYYMMDD
      const startTime = entry.startTime.replace(':', ''); // Format: HHMM
      const endTime = entry.finishTime.replace(':', ''); // Format: HHMM
      
      // Create unique ID for this event
      const uid = `${entry.id || Date.now()}-${entry.date}@worktracker.cfigroup.com`;
      
      // Format datetime strings (YYYYMMDDTHHMMSS)
      const dtStart = `${eventDate}T${startTime}00`;
      const dtEnd = `${eventDate}T${endTime}00`;
      
      // Create timestamp for when event was created
      const now = new Date();
      const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
      
      // Create event summary (title)
      const summary = entry.client ? `Work - ${entry.client}` : 'Work Entry';
      
      // Create event description with details
      const description = [
        `Client: ${entry.client || 'N/A'}`,
        `Hours: ${entry.totalHours.toFixed(2)}`,
        `Client Miles: ${entry.clientMiles.toFixed(1)}`,
        `Commute Miles: ${entry.commuteMiles.toFixed(1)}`,
      ].join('\\n');
      
      // Add event to calendar
      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${datasetTitle.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('ICS export completed successfully');
    return true;
  } catch (error) {
    console.error('ICS Export Error:', error);
    throw new Error(`Failed to export calendar: ${error.message}`);
  }
};
