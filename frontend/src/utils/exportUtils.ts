// frontend/src/utils/exportUtils.ts
// ─────────────────────────────────────────────────────────────────
//  Excel (XLSX) and PDF export helpers
//  - Excel: auto-sized columns (+2 padding), centered/bold headers
//  - PDF:   Roboto font for Vietnamese, light enterprise theme,
//           NexusBridge header/footer branding
// ─────────────────────────────────────────────────────────────────
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns (+2 spaces padding)
  const keys = Object.keys(data[0]);
  const cols = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => (row[key] ? String(row[key]).length : 0))
    );
    return { wch: Math.min(maxLen + 2, 50) }; // Reduced padding to +2
  });
  ws['!cols'] = cols;

  // Attempt to apply basic centering and bold headers
  // (Note: Free version of 'xlsx' might strip this, but structure is ready for 'xlsx-js-style')
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        alignment: { horizontal: "center", vertical: "center" }
      };
      // Bold header row
      if (R === 0) {
        ws[cellAddress].s.font = { bold: true };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
};

export const exportToPDF = async (data: any[], title: string, filename: string) => {
  if (!data || data.length === 0) return;
  const doc = new jsPDF();

  // 1. Fetch Roboto font for Vietnamese Support
  try {
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf';
    const response = await fetch(fontUrl);
    if (response.ok) {
      const fontBuffer = await response.arrayBuffer();
      const fontUint8Array = new Uint8Array(fontBuffer);
      let binary = '';
      for (let i = 0; i < fontUint8Array.byteLength; i++) {
        binary += String.fromCharCode(fontUint8Array[i]);
      }
      const fontBase64 = window.btoa(binary);

      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
    }
  } catch (err) {
    console.error("Font loading error:", err);
  }

  // 2. Prepare Data & Formatting
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => Object.values(obj).map(val => (val !== null && val !== undefined ? String(val) : '—')));

  const now = new Date();
  const dateStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 3. Draw Enterprise Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 50,
    theme: 'striped',
    styles: {
      font: 'Roboto',
      fontSize: 10,
      textColor: [40, 40, 40],
      halign: 'center', // Center align text
      cellPadding: 4
    },
    headStyles: {
      fillColor: [15, 23, 42], // NexusBridge Dark Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Very light blue/gray
    },
    didDrawPage: (hookData) => {
      // --- HEADER ---
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 150, 255); // Professional Blue
      doc.text("NexusBridge", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('Roboto', 'normal');
      doc.text("HR & PAYROLL MIDDLEWARE PLATFORM", 14, 26);

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('Roboto', 'bold');
      doc.text(title, 14, 38);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('Roboto', 'normal');
      doc.text(`Generated: ${dateStr}`, 14, 44);
      doc.text(`TOTAL RECORDS: ${rows.length}`, pageWidth - 14, 44, { align: 'right' });

      // --- FOOTER ---
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`NexusBridge Enterprise Reporting. Page ${hookData.pageNumber}`, 14, pageHeight - 10);
    },
    margin: { top: 50, bottom: 20 }
  });

  doc.save(filename);
};
