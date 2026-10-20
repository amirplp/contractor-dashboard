import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Safe constructor resolver for jsPDF across ESM / CJS / Vite bundling
const createPdfDoc = (options) => {
  const Constructor = typeof jsPDF === 'function' ? jsPDF : (jsPDF.jsPDF || jsPDF.default);
  return new Constructor(options);
};

// Safe runner for autoTable
const runAutoTable = (doc, options) => {
  const tableFn = typeof autoTable === 'function' ? autoTable : (autoTable.default || autoTable.autoTable);
  return tableFn(doc, options);
};

// Safe ASCII currency formatter for standard PDF fonts (no UTF-8 corruption)
const formatPKR = (amount) => {
  const num = Math.round(Number(amount) || 0);
  if (num < 0) {
    return `-Rs. ${Math.abs(num).toLocaleString('en-US')}`;
  }
  return `Rs. ${num.toLocaleString('en-US')}`;
};

// Safe date formatter
const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-PK');
};

export const generatePDFReport = ({
  items = [],
  payments = [],
  attachments = [],
  filterInfo = null,
  totalCount = null
}) => {
  const doc = createPdfDoc({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins
  const contentWidth = pageWidth - margin * 2; // ~523.28 pt

  // Calculate project totals
  const totals = items.reduce(
    (acc, item) => {
      acc.material += Number(item.material_cost) || 0;
      acc.materialPaid += Number(item.amount_paid) || 0;
      acc.labor += Number(item.labor_cost) || 0;
      acc.laborPaid += Number(item.labor_paid) || 0;
      acc.workProgressSum += Number(item.work_progress !== undefined ? item.work_progress : item.progress) || 0;
      return acc;
    },
    { material: 0, materialPaid: 0, labor: 0, laborPaid: 0, workProgressSum: 0 }
  );

  const totalCost = totals.material + totals.labor;
  const totalPaid = totals.materialPaid + totals.laborPaid;
  const balance = totalCost - totalPaid;
  const avgWorkDone = items.length > 0 ? Math.round(totals.workProgressSum / items.length) : 0;
  const overallPaidPct = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;
  const dateStr = new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let currentY = margin;

  // Helper to ensure vertical room before rendering a block
  const ensureRoom = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - 45) {
      doc.addPage();
      currentY = margin + 18; // space below running header
      return true;
    }
    return false;
  };

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.roundedRect(margin, currentY, contentWidth, 75, 6, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PROJECT PROGRESS & FINANCIAL AUDIT REPORT', margin + 16, currentY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`Contractor: Nasir Shakeel   |   Report Date: ${dateStr}`, margin + 16, currentY + 46);

  const scopeText = filterInfo
    ? `Scope: ${items.length} Items (${filterInfo}) of ${totalCount || items.length} Total   |   Work Done: ${avgWorkDone}%   |   Paid: ${overallPaidPct}%`
    : `Total Scope: ${items.length} Work Items   |   Work Done: ${avgWorkDone}% Complete   |   Payments: ${overallPaidPct}% Paid`;
  doc.text(scopeText, margin + 16, currentY + 60);

  currentY += 88;

  // 2. Summary KPI Cards
  const cardW = (contentWidth - 12) / 3;
  const cardH = 50;

  // Total Budget Card
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, cardW, cardH, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PROJECT BUDGET', margin + 10, currentY + 16);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPKR(totalCost), margin + 10, currentY + 36);

  // Total Paid Card
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + cardW + 6, currentY, cardW, cardH, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL PAID (MAT. + LABOR)', margin + cardW + 16, currentY + 16);
  doc.setFontSize(13);
  doc.setTextColor(21, 128, 61);
  doc.text(formatPKR(totalPaid), margin + cardW + 16, currentY + 36);

  // Balance Remaining Card
  const isPendingBalance = balance > 0;
  doc.setFillColor(isPendingBalance ? 254 : 240, isPendingBalance ? 242 : 253, isPendingBalance ? 242 : 244);
  doc.setDrawColor(isPendingBalance ? 254 : 187, isPendingBalance ? 202 : 247, isPendingBalance ? 202 : 208);
  doc.roundedRect(margin + (cardW + 6) * 2, currentY, cardW, cardH, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(isPendingBalance ? 185 : 22, isPendingBalance ? 28 : 101, isPendingBalance ? 28 : 52);
  doc.text('REMAINING BALANCE DUE', margin + (cardW + 6) * 2 + 10, currentY + 16);
  doc.setFontSize(13);
  doc.setTextColor(isPendingBalance ? 220 : 21, isPendingBalance ? 38 : 128, isPendingBalance ? 38 : 61);
  doc.text(formatPKR(balance), margin + (cardW + 6) * 2 + 10, currentY + 36);

  currentY += cardH + 16;

  // 3. Financial Breakdown Table (Materials vs Labor)
  runAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 40 },
    head: [['EXPENSE CATEGORY', 'ESTIMATED COST', 'AMOUNT PAID TO DATE', 'REMAINING BALANCE']],
    body: [
      ['Materials & Supplies', formatPKR(totals.material), formatPKR(totals.materialPaid), formatPKR(totals.material - totals.materialPaid)],
      ['Labor & Contractor Charges', formatPKR(totals.labor), formatPKR(totals.laborPaid), formatPKR(totals.labor - totals.laborPaid)],
      ['TOTAL PROJECT STATEMENT', formatPKR(totalCost), formatPKR(totalPaid), formatPKR(balance)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 18;

  // 4. Section Title: Detailed Item-By-Item Breakdown
  ensureRoom(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPREHENSIVE WORK ITEMS BREAKDOWN & AUDIT', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Detailed audit of materials, vendor, labor expenses, installments paid, and current status', margin, currentY + 11);

  currentY += 18;

  if (items.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No work items recorded in this project scope.', margin, currentY + 15);
  } else {
    // Itemized breakdown table
    const itemRows = items.map((item, idx) => {
      const itemTotal = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
      const itemPaid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
      const itemBalance = itemTotal - itemPaid;
      const paymentPct = itemTotal > 0 ? Math.min(100, Math.round((itemPaid / itemTotal) * 100)) : (itemPaid > 0 ? 100 : 0);
      const workDone = item.work_progress !== undefined ? item.work_progress : (item.progress || 0);
      return [
        `#${idx + 1}`,
        `${item.item || 'Item'}\n(${item.company || 'N/A'})`,
        formatPKR(item.material_cost),
        formatPKR(item.amount_paid),
        `${item.labor_name || 'N/A'}\n${formatPKR(item.labor_cost)}`,
        formatPKR(item.labor_paid || 0),
        formatPKR(itemBalance),
        `${paymentPct}%`,
        `${workDone}%`
      ];
    });

    // Add summary total row to table
    const tableBodyWithTotal = [
      ...itemRows,
      [
        'TOTAL',
        `${items.length} Work Items`,
        formatPKR(totals.material),
        formatPKR(totals.materialPaid),
        formatPKR(totals.labor),
        formatPKR(totals.laborPaid),
        formatPKR(balance),
        `${overallPaidPct}%`,
        `${avgWorkDone}%`
      ]
    ];

    runAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 40 },
      head: [['SR.', 'ITEM & VENDOR', 'MAT. COST', 'MAT. PAID', 'LABOR & COST', 'LABOR PAID', 'BALANCE', 'PAID %', 'WORK DONE']],
      body: tableBodyWithTotal,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        1: { fontStyle: 'bold' },
        2: { halign: 'right', cellWidth: 54 },
        3: { halign: 'right', cellWidth: 54 },
        4: { halign: 'right', cellWidth: 64 },
        5: { halign: 'right', cellWidth: 54 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 60 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 44 },
        8: { halign: 'center', fontStyle: 'bold', cellWidth: 48 }
      },
      didParseCell: (data) => {
        // Highlight total row at the bottom
        if (data.row.index === itemRows.length) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    });

    // 5. Minute Details Section for Each Item (Notes, Payment Installments, Proofs)
    doc.addPage();
    currentY = margin + 18;

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, currentY, contentWidth, 34, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text('MINUTE DETAILS: NOTES, PAYMENT LOGS & PROOF AUDIT', margin + 14, currentY + 21);

    currentY += 46;

    items.forEach((item, idx) => {
      const itemPayments = payments.filter(p => p.work_item_id === item.id);
      const itemAttachments = attachments.filter(a => a.workItemId === item.id || a.work_item_id === item.id);
      const itemTotal = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
      const itemPaid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
      const itemBalance = itemTotal - itemPaid;
      const paymentPct = itemTotal > 0 ? Math.min(100, Math.round((itemPaid / itemTotal) * 100)) : (itemPaid > 0 ? 100 : 0);
      const workDone = item.work_progress !== undefined ? item.work_progress : (item.progress || 0);

      // Check space before starting an item (avoid orphaned header cards)
      ensureRoom(120);

      // Item Header Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const itemTitle = `#${idx + 1} - ${(item.item || 'Item').toUpperCase()} (Vendor: ${item.company || 'N/A'})`;
      doc.text(itemTitle, margin + 8, currentY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const summaryRight = `Work Done: ${workDone}%   |   Paid: ${paymentPct}%   |   Balance: ${formatPKR(itemBalance)}`;
      doc.text(summaryRight, pageWidth - margin - 8 - doc.getTextWidth(summaryRight), currentY + 16);

      currentY += 30;

      // Notes & Remarks
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Notes & Remarks:', margin + 8, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const noteText = item.notes?.trim() || 'No specific notes recorded for this item.';
      const splitNotes = doc.splitTextToSize(noteText, contentWidth - 20);

      ensureRoom(splitNotes.length * 11 + 15);
      doc.text(splitNotes, margin + 8, currentY + 12);
      currentY += 14 + splitNotes.length * 10;

      // Payments Breakdown Table
      if (itemPayments.length > 0) {
        ensureRoom(65);
        const payRows = itemPayments.map((p, pIdx) => [
          `Installment #${pIdx + 1}`,
          formatDate(p.date),
          p.note || 'Cash / Transfer',
          formatPKR(p.amount)
        ]);

        const totalItemInstallments = itemPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const payRowsWithSubtotal = [
          ...payRows,
          ['SUBTOTAL', '', `${itemPayments.length} recorded installment(s)`, formatPKR(totalItemInstallments)]
        ];

        runAutoTable(doc, {
          startY: currentY,
          margin: { left: margin + 8, right: margin + 8, bottom: 40 },
          head: [['INSTALLMENT', 'DATE', 'PAYMENT NOTE / DETAILS', 'AMOUNT PAID']],
          body: payRowsWithSubtotal,
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 70 },
            2: {},
            3: { halign: 'right', fontStyle: 'bold', cellWidth: 92 }
          },
          didParseCell: (data) => {
            if (data.row.index === payRows.length) {
              data.cell.styles.fillColor = [241, 245, 249];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });

        currentY = doc.lastAutoTable.finalY + 10;
      } else {
        ensureRoom(20);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Payment Log: No payment installments recorded.', margin + 8, currentY);
        currentY += 14;
      }

      // Attachments / Proofs summary
      if (itemAttachments.length > 0) {
        ensureRoom(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Attached Proofs & Receipts (${itemAttachments.length} file(s)):`, margin + 8, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);

        const attList = itemAttachments
          .map(a => `${a.name || 'Receipt'} (${a.size ? Math.round(a.size / 1024) + ' KB' : 'File'}, ${formatDate(a.date)})`)
          .join('   |   ');
        const splitAtt = doc.splitTextToSize(attList, contentWidth - 20);
        doc.text(splitAtt, margin + 8, currentY + 10);
        currentY += 12 + splitAtt.length * 9;
      }

      // Divider line between items
      ensureRoom(16);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 14;
    });
  }

  // 6. Running Header on Pages 2+ and Running Footer on All Pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running header on page 2 and beyond
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('PROJECT PROGRESS & FINANCIAL AUDIT REPORT   |   CONTRACTOR: NASIR SHAKEEL', margin, 22);
      doc.text(`Report Date: ${dateStr}`, pageWidth - margin, 22, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 26, pageWidth - margin, 26);
    }

    // Running footer on all pages
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Shakeel Contractor Dashboard   |   Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Shakeel_Project_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
