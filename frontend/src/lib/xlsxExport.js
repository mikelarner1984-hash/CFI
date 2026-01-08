import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToXLSX = (entries, datasetTitle = 'Care Work') => {
  try {
    console.log('Starting XLSX export...', entries.length, 'entries');
    
    // Prepare the data rows
    const data = entries.map(entry => {
      const date = new Date(entry.date);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      return {
        'CH Submitted': entry.worked !== false ? 'Yes' : 'No',
        'Date': format(date, 'dd MMM'),
        'Weekend': isWeekend ? 'Yes' : 'No',
        'Client': entry.client || '-',
        'Start Time': entry.startTime || '-',
        'Finish Time': entry.finishTime || '-',
        'Total Hours': (entry.totalHours || 0).toFixed(2),
        'Client Miles': (entry.clientMiles || 0).toFixed(1),
        'Commute Miles': (entry.commuteMiles || 0).toFixed(1),
      };
    });

    // Calculate totals (only for CH Submitted = Yes)
    const totals = entries.reduce(
      (acc, entry) => {
        if (entry.worked !== false) {
          return {
            totalHours: acc.totalHours + (entry.totalHours || 0),
            clientMiles: acc.clientMiles + (entry.clientMiles || 0),
            commuteMiles: acc.commuteMiles + (entry.commuteMiles || 0),
          };
        }
        return acc;
      },
      { totalHours: 0, clientMiles: 0, commuteMiles: 0 }
    );

    // Add totals row
    data.push({
      'CH Submitted': '',
      'Date': '',
      'Weekend': '',
      'Client': '',
      'Start Time': 'Totals (CH Submitted):',
      'Finish Time': '',
      'Total Hours': totals.totalHours.toFixed(2),
      'Client Miles': totals.clientMiles.toFixed(1),
      'Commute Miles': totals.commuteMiles.toFixed(1),
    });

    console.log('Data prepared:', data.length, 'rows');

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 14 },  // CH Submitted
      { wch: 12 },  // Date
      { wch: 10 },  // Weekend
      { wch: 20 },  // Client
      { wch: 12 },  // Start Time
      { wch: 12 },  // Finish Time
      { wch: 12 },  // Total Hours
      { wch: 14 },  // Client Miles
      { wch: 14 },  // Commute Miles
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Entries');

    // Generate filename
    const filename = `${datasetTitle.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    console.log('Saving XLSX as:', filename);

    // Save file
    XLSX.writeFile(workbook, filename);

    console.log('XLSX export completed successfully');
    return true;
  } catch (error) {
    console.error('XLSX Export Error:', error);
    throw new Error(`Failed to export XLSX: ${error.message}`);
  }
};
