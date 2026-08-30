import jsPDF from 'jspdf';
import { Certificate, DeficiencyMemo } from '@/types/metrology';

export function exportCertificatePDF(cert: Certificate) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page Dimensions & Styling
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Decorative Government Border
  doc.setDrawColor(0, 43, 73); // Deep DoCA Navy
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, 281);
  doc.setLineWidth(0.5);
  doc.setDrawColor(212, 118, 38); // Saffron accent
  doc.rect(10, 10, pageWidth - 20, 277);

  // Government Emblem & Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 43, 73);
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', pageWidth / 2, 28, { align: 'center' });
  doc.text('DEPARTMENT OF CONSUMER AFFAIRS — LEGAL METROLOGY DIVISION', pageWidth / 2, 33, { align: 'center' });

  // Certificate Title & Statutory Rule
  doc.setFillColor(240, 244, 248);
  doc.rect(14, 38, pageWidth - 28, 14, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 73);
  doc.text('CERTIFICATE OF VERIFICATION', pageWidth / 2, 45, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('[Under Section 24 of Legal Metrology Act, 2009 & Rule 14, Schedule IX (Form V) of General Rules, 2011]', pageWidth / 2, 50, { align: 'center' });

  // Certificate Metadata Box
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.line(14, 56, pageWidth - 14, 56);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 73);
  doc.text(`Certificate No: ${cert.certificateNumber}`, 16, 62);
  doc.text(`Issue Date: ${cert.issueDate}`, pageWidth - 16, 62, { align: 'right' });
  doc.text(`Valid Until: ${cert.validUntil}`, pageWidth - 16, 67, { align: 'right' });
  doc.text(`Application Ref: ${cert.applicationNumber}`, 16, 67);

  doc.line(14, 71, pageWidth - 14, 71);

  // Body Content
  let y = 80;
  const lineSpacing = 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  const textLines = [
    `This is to certify that the weighing / measuring instrument described below has been inspected, tested, and`,
    `verified by the authorized Legal Metrology Officer in accordance with the standards and tolerances prescribed`,
    `under the Legal Metrology (General) Rules, 2011.`,
  ];
  textLines.forEach((tl) => {
    doc.text(tl, 16, y);
    y += 5;
  });

  y += 5;

  // Table of Instrument Details
  const drawRow = (label: string, value: string, currentY: number) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(16, currentY - 4, 60, lineSpacing, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 50, 70);
    doc.text(label, 18, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(value, 80, currentY);
    
    doc.setDrawColor(230, 235, 240);
    doc.line(16, currentY + 3, pageWidth - 16, currentY + 3);
  };

  drawRow('Owner / Business Name:', cert.businessName, y); y += lineSpacing;
  drawRow('Applicant / Trader Name:', cert.ownerName, y); y += lineSpacing;
  drawRow('Instrument Category:', cert.instrument.categoryName, y); y += lineSpacing;
  drawRow('Accuracy Class:', cert.instrument.accuracyClass, y); y += lineSpacing;
  drawRow('Make & Model:', `${cert.instrument.make} - ${cert.instrument.model}`, y); y += lineSpacing;
  drawRow('Serial Number:', cert.instrument.serialNumber, y); y += lineSpacing;
  drawRow('Max Capacity:', cert.instrument.maxCapacity, y); y += lineSpacing;
  drawRow('Verification Interval (e):', cert.instrument.verificationScaleInterval, y); y += lineSpacing;
  drawRow('Physical Security Seal No:', cert.physicalSealNumber, y); y += lineSpacing;
  drawRow('Installation Location:', `${cert.instrument.installationAddress}, ${cert.instrument.district} - ${cert.instrument.pinCode}`, y); y += lineSpacing;

  y += 8;

  // Cryptographic & Authenticity Block
  doc.setFillColor(243, 247, 252);
  doc.setDrawColor(180, 205, 230);
  doc.rect(16, y, pageWidth - 32, 28, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 43, 73);
  doc.text('DIGITAL VERIFICATION & CRYPTOGRAPHIC TAMPER SEAL', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Digital Signature Digest: ${cert.digitalSignatureHash}`, 20, y + 12);
  doc.text(`Instant Public Lookup URL: https://doca.gov.in/verify/${cert.certificateNumber}`, 20, y + 17);
  doc.text('Scan the embedded QR code with any smartphone camera to authenticate real-time against central registry.', 20, y + 22);

  y += 38;

  // Signatures & Stamps
  doc.setDrawColor(180, 180, 180);
  doc.line(16, y + 20, 80, y + 20);
  doc.line(pageWidth - 80, y + 20, pageWidth - 16, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 43, 73);
  doc.text('Verified & Sealed by:', 16, y + 25);
  doc.text(cert.issuedByOfficerName, 16, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(cert.issuingAuthority, 16, y + 34, { maxWidth: 85 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 43, 73);
  doc.text('Authorized Seal / Signature', pageWidth - 80, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('State Legal Metrology Directorate', pageWidth - 80, y + 30);
  doc.text('Government of India', pageWidth - 80, y + 34);

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Note: This is a system-generated, digitally verifiable certificate. Any tampering or alteration is punishable under Section 30 of the Legal Metrology Act, 2009.', pageWidth / 2, 280, { align: 'center' });

  // Save the PDF
  doc.save(`Legal_Metrology_Certificate_${cert.certificateNumber}.pdf`);
}

export function exportDeficiencyMemoPDF(memo: DeficiencyMemo) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Red/Amber Alert Border
  doc.setDrawColor(185, 28, 28); // Crimson Red
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, 281);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28);
  doc.text('GOVERNMENT OF INDIA — DEPARTMENT OF CONSUMER AFFAIRS', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('OFFICE OF THE CONTROLLER / INSPECTOR OF LEGAL METROLOGY', pageWidth / 2, 28, { align: 'center' });

  // Memo Title
  doc.setFillColor(254, 242, 242);
  doc.rect(14, 34, pageWidth - 28, 14, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('NOTICE OF DEFICIENCY & REJECTION (FORM VI)', pageWidth / 2, 42, { align: 'center' });

  // Metadata
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`Memo Reference: ${memo.memoNumber}`, 16, 56);
  doc.text(`Issue Date: ${memo.issuedDate}`, pageWidth - 16, 56, { align: 'right' });
  doc.text(`Cure Deadline: ${memo.cureDeadline} (14 Days)`, pageWidth - 16, 62, { align: 'right' });
  doc.text(`Application Ref: ${memo.applicationNumber}`, 16, 62);

  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 66, pageWidth - 14, 66);

  // Notice Body
  let y = 74;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);

  doc.text(`To,`, 16, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`${memo.ownerName} (${memo.businessName})`, 16, y); y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Sir/Madam,\nDuring inspection of your weighing/measuring instrument (${memo.instrumentName}), the following deficiencies and statutory non-compliances were observed under the Legal Metrology (General) Rules, 2011:`,
    16,
    y
  );
  y += 16;

  // Reasons List
  memo.reasons.forEach((r, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`[${idx + 1}]`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(r, 26, y, { maxWidth: pageWidth - 46 });
    y += 10;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Observed Discrepancy & Technical Report:', 16, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(memo.observedDiscrepancy, 16, y, { maxWidth: pageWidth - 32 }); y += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('Required Rectification Action:', 16, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(memo.requiredRectification, 16, y, { maxWidth: pageWidth - 32 }); y += 20;

  // Warning Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.rect(16, y, pageWidth - 32, 22, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text('STATUTORY WARNING:', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 20, 20);
  doc.text(`Use of unverified/rejected weighing instruments in commercial transactions is a non-compoundable offense under Section 24 & 30 of the Legal Metrology Act, 2009. Complete rectification and re-verification before ${memo.cureDeadline}.`, 20, y + 11, { maxWidth: pageWidth - 42 });

  y += 40;

  // Officer Sign
  doc.line(pageWidth - 80, y + 10, pageWidth - 16, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 43, 73);
  doc.text(memo.officerName, pageWidth - 80, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Legal Metrology Officer / Inspector', pageWidth - 80, y + 21);

  doc.save(`Deficiency_Notice_${memo.memoNumber}.pdf`);
}
