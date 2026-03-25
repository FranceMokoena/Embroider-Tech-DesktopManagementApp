import jsPDF from 'jspdf';

const baseHeader = (pdf) => {
  pdf.setFillColor(52, 152, 219);
  pdf.rect(0, 0, 210, 30, 'F');
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Amrod Digital Asset Tracking Management System', 105, 15, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('Sessions Report', 105, 25, { align: 'center' });
};

const drawFooter = (pdf) => {
  pdf.setFillColor(44, 62, 80);
  pdf.rect(20, 270, 170, 25, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Compiled by Amrod Digital Asset Tracking Management System', 105, 280, { align: 'center' });
};

export const generateAllSessionsReport = (sessions, filters = {}) => {
  const pdf = new jsPDF();
  baseHeader(pdf);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(127, 140, 141);
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });

  const startY = 60;
  let y = startY;
  sessions.forEach((session, index) => {
    if (y > 250) {
      pdf.addPage();
      y = 30;
    }
    pdf.setFontSize(11);
    pdf.text(`Session ${index + 1}: ${session._id?.slice(-8) || 'Unknown'}`, 20, y);
    pdf.setFontSize(10);
    y += 6;
    pdf.text(`Tech: ${session.technician || 'Unknown'}`, 25, y);
    y += 5;
    pdf.text(`Dept: ${session.department || 'Unknown'}`, 25, y);
    y += 5;
    pdf.text(`Scans: ${session.scanCount || 0}`, 25, y);
    y += 5;
    pdf.text(`Start: ${session.startTime ? new Date(session.startTime).toLocaleString() : 'N/A'}`, 25, y);
    y += 5;
    pdf.text(`Status: ${session.endTime ? 'Completed' : 'Active'}`, 25, y);
    y += 10;
  });

  drawFooter(pdf);
  const filename = `Sessions_Report_${filters.technician || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
};
