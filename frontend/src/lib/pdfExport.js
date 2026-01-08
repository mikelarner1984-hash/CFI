import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToPDF = (entries, datasetTitle = 'Work Tracker') => {
  try {
    console.log('Starting PDF export...', entries.length, 'entries');
    
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(datasetTitle, 14, 22);

    // Add generation date
    doc.setFontSize(11);
    doc.setTextColor(100);
    const today = new Date();
    doc.text(`Generated on ${format(today, 'MMMM dd, yyyy')}`, 14, 30);

    // Prepare table data
    const tableData = entries.map(entry => {
      try {
        return [
          format(new Date(entry.date), 'MM/dd/yyyy'),
          entry.client || '-',
          entry.startTime || '-',
          entry.finishTime || '-',
          (entry.totalHours || 0).toFixed(2),
          (entry.clientMiles || 0).toFixed(1),
          (entry.commuteMiles || 0).toFixed(1),
          entry.worked !== false ? 'Yes' : 'No',
        ];
      } catch (err) {
        console.error('Error formatting entry:', entry, err);
        return ['-', '-', '-', '-', '0.00', '0.0', '0.0', 'No'];
      }
    });

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => {
        // Only include entries where worked is true
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

    console.log('Table data prepared, adding to PDF...');

    // Add table to PDF
    doc.autoTable({
      head: [['Date', 'Client', 'Start Time', 'Finish Time', 'Total Hours', 'Client Miles', 'Commute Miles', 'CH Submitted']],
      body: tableData,
      foot: [['', '', '', 'Totals (CH Submitted):', totals.totalHours.toFixed(2), totals.clientMiles.toFixed(1), totals.commuteMiles.toFixed(1), '']],
      startY: 38,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        fontSize: 10,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 18 },
      },
    });

    // Save the PDF
    const filename = `work-tracker-${format(today, 'yyyy-MM-dd')}.pdf`;
    console.log('Saving PDF as:', filename);
    doc.save(filename);
    
    console.log('PDF export completed successfully');
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};
