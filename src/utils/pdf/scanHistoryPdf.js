import jsPDF from 'jspdf';

const drawHeader = (pdf) => {
  pdf.setFillColor(52, 152, 219);
  pdf.rect(0, 0, 210, 30, 'F');
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text('EmbroideryTech', 105, 15, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('Scan History Report', 105, 25, { align: 'center' });
};

const drawFooter = (pdf) => {
  pdf.setFillColor(44, 62, 80);
  pdf.rect(20, 270, 170, 25, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Data sourced from EmbroideryTech Mobile App', 105, 280, { align: 'center' });
};

export const generateScanHistoryReport = (scans, filters = {}) => {
  const pdf = new jsPDF();
  drawHeader(pdf);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(127, 140, 141);
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });

  let y = 60;
  scans.forEach((scan, index) => {
    if (y > 250) {
      pdf.addPage();
      y = 30;
    }
    pdf.setFontSize(11);
    pdf.text(`Scan ${index + 1}: ${scan.barcode || 'Unknown'}`, 20, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.text(`Technician: ${scan.technician || 'Unknown'}`, 25, y);
    y += 5;
    pdf.text(`Department: ${scan.department || 'Unknown'}`, 25, y);
    y += 5;
    pdf.text(`Status: ${scan.status || 'Unknown'}`, 25, y);
    y += 5;
    pdf.text(`Time: ${scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Unknown'}`, 25, y);
    y += 10;
  });

  drawFooter(pdf);
  const filename = `Scan_History_${filters.status || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
};
