import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatPKR = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const generatePDFReport = ({ items = [], payments = [], attachments = [] }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins
  const contentWidth = pageWidth - margin * 2;

  // Calculate project totals
  const totals = items.reduce(
    (acc, item) => {
      acc.material += Number(item.material_cost) || 0;
      acc.materialPaid += Number(item.amount_paid) || 0;
      acc.labor += Number(item.labor_cost) || 0;
      acc.laborPaid += Number(item.labor_paid) || 0;
      acc.progressSum += Number(item.progress) || 0;
      return acc;
    },
    { material: 0, materialPaid: 0, labor: 0, laborPaid: 0, progressSum: 0 }
  );

  const totalCost = totals.material + totals.labor;
  const totalPaid = totals.materialPaid + totals.laborPaid;
  const balance = totalCost - totalPaid;
  const avgProgress = items.length > 0 ? Math.round(totals.progressSum / items.length) : 0;
  const dateStr = new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let currentY = margin;

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.roundedRect(margin, currentY, contentWidth, 75, 6, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('PROJECT PROGRESS & FINANCIAL AUDIT REPORT', margin + 16, currentY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`Contractor: Shakeel (nasirshakeel333@gmail.com)  •  Report Date: ${dateStr}`, margin + 16, currentY + 46);
  doc.text(`Total Scope: ${items.length} Work Items  •  Overall Progress: ${avgProgress}% Complete`, margin + 16, currentY + 60);

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
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
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

  currentY = doc.lastAutoTable.finalY + 20;

  // 4. Section Title: Detailed Item-By-Item Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPREHENSIVE WORK ITEMS BREAKDOWN & AUDIT', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Includes priority, materials, labor, installment payment history, notes & attached proofs', margin, currentY + 11);

  currentY += 18;

  // Itemized breakdown table
  const itemRows = items.map((item, idx) => {
    const itemTotal = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
    const itemPaid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
    const itemBalance = itemTotal - itemPaid;
    return [
      `#${idx + 1}`,
      `${item.item}\n(${item.company || 'N/A'})`,
      formatPKR(item.material_cost),
      formatPKR(item.amount_paid),
      `${item.labor_name || 'N/A'}\n${formatPKR(item.labor_cost)}`,
      formatPKR(item.labor_paid || 0),
      formatPKR(itemBalance),
      `${item.progress || 0}%`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['PRIORITY', 'ITEM & VENDOR', 'MAT. COST', 'MAT. PAID', 'LABOR & COST', 'LABOR PAID', 'BALANCE', 'PROGRESS']],
    body: itemRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 42 },
      1: { fontStyle: 'bold', cellWidth: 105 },
      2: { halign: 'right', cellWidth: 62 },
      3: { halign: 'right', cellWidth: 62 },
      4: { halign: 'right', cellWidth: 70 },
      5: { halign: 'right', cellWidth: 60 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 65 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 55 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 24;

  // 5. Minute Details Section for Each Item (Notes, Payment Installments, Proofs)
  doc.addPage();
  currentY = margin;

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, currentY, contentWidth, 36, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MINUTE DETAILS: NOTES, PAYMENT LOGS & PROOF AUDIT', margin + 14, currentY + 22);

  currentY += 48;

  items.forEach((item, idx) => {
    const itemPayments = payments.filter(p => p.work_item_id === item.id);
    const itemAttachments = attachments.filter(a => a.workItemId === item.id);
    const itemTotal = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
    const itemPaid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
    const itemBalance = itemTotal - itemPaid;

    // Check if we need a new page
    if (currentY > pageHeight - 140) {
      doc.addPage();
      currentY = margin;
    }

    // Item Header Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`#${idx + 1} — ${item.item.toUpperCase()} (Vendor: ${item.company})`, margin + 8, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const summaryRight = `Progress: ${item.progress}%  |  Balance: ${formatPKR(itemBalance)}`;
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
    doc.text(splitNotes, margin + 8, currentY + 12);
    currentY += 14 + splitNotes.length * 10;

    // Payments Breakdown Table
    if (itemPayments.length > 0) {
      const payRows = itemPayments.map((p, pIdx) => [
        `Installment #${pIdx + 1}`,
        new Date(p.date).toLocaleDateString('en-PK'),
        p.note || 'Cash / Transfer',
        formatPKR(p.amount)
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin + 8, right: margin + 8 },
        head: [['INSTALLMENT', 'DATE', 'PAYMENT NOTE / DETAILS', 'AMOUNT PAID']],
        body: payRows,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 70 },
          2: { cellWidth: 240 },
          3: { halign: 'right', fontStyle: 'bold', cellWidth: 90 }
        }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Payment Log: No payment installments recorded.', margin + 8, currentY);
      currentY += 14;
    }

    // Attachments / Proofs summary
    if (itemAttachments.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Attached Proofs & Receipts (${itemAttachments.length} files):`, margin + 8, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);

      const attList = itemAttachments.map(a => `${a.name} (${a.size ? Math.round(a.size / 1024) + ' KB' : 'File'}, ${new Date(a.date).toLocaleDateString('en-PK')})`).join('  •  ');
      const splitAtt = doc.splitTextToSize(attList, contentWidth - 20);
      doc.text(splitAtt, margin + 8, currentY + 10);
      currentY += 12 + splitAtt.length * 9;
    }

    // Divider line between items
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 14;
  });

  // 6. Page Numbers on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Shakeel Contractor Dashboard • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Shakeel_Project_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
