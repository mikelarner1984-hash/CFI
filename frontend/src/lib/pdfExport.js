import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToPDF = (entries) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Work Tracker Report', 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, 14, 30);

  const tableData = entries.map(entry => [
    format(new Date(entry.date), 'MM/dd/yyyy'),
    entry.client || '-',
    entry.startTime,
    entry.finishTime,
    entry.totalHours.toFixed(2),
    entry.clientMiles.toFixed(1),
    entry.commuteMiles.toFixed(1),
    entry.worked !== false ? 'Yes' : 'No',
  ]);

  const totals = entries.reduce(
    (acc, entry) => {
      // Only include entries where worked is true
      if (entry.worked !== false) {
        return {
          totalHours: acc.totalHours + entry.totalHours,
          clientMiles: acc.clientMiles + entry.clientMiles,
          commuteMiles: acc.commuteMiles + entry.commuteMiles,
        };
      }
      return acc;
    },
    { totalHours: 0, clientMiles: 0, commuteMiles: 0 }
  );

  doc.autoTable({
    head: [['Date', 'Client', 'Start Time', 'Finish Time', 'Total Hours', 'Client Miles', 'Commute Miles', 'Worked']],
    body: tableData,
    foot: [['', '', '', '', totals.totalHours.toFixed(2), totals.clientMiles.toFixed(1), totals.commuteMiles.toFixed(1), 'Totals (Worked Only)']],
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

  doc.save(`work-tracker-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
