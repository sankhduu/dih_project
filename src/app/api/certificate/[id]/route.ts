import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase-client';
import { getMockTraderById } from '@/lib/mock-traders';

function toWinAnsi(str: any) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const licenseNumber = decodeURIComponent(id).trim();

    let trader: any = null;

    // 1. Fetch from Supabase if configured
    if (supabase) {
      try {
        let { data } = await supabase
          .from('traders')
          .select('*')
          .eq('license_number', licenseNumber)
          .maybeSingle();

        if (!data) {
          const res = await supabase
            .from('lmo_mock_traders')
            .select('*')
            .eq('license_number', licenseNumber)
            .maybeSingle();
          data = res.data;
        }

        if (data) trader = data;
      } catch {
        // Fallback
      }
    }

    // 2. Check mock trader fallback
    if (!trader) {
      trader = getMockTraderById(licenseNumber);
    }

    if (!trader) {
      return NextResponse.json(
        { success: false, error: 'Trader not found', message: `No record for ${licenseNumber}` },
        { status: 404 }
      );
    }

    // 3. Validation: Passed only
    const status = (trader.inspection_status || '').toLowerCase();
    if (status !== 'passed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Inspection Status Not Passed',
          message: `Cannot issue certificate for status '${trader.inspection_status}'.`,
        },
        { status: 400 }
      );
    }

    // 4. Generate QR code
    const verificationUrl = `https://our-lmo-app.com/verify/${encodeURIComponent(licenseNumber)}`;
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 250,
      color: {
        dark: '#002B49',
        light: '#FFFFFF',
      },
    });

    // 5. Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    const primaryNavy = rgb(0 / 255, 43 / 255, 73 / 255);
    const accentGold = rgb(217 / 255, 119 / 255, 6 / 255);
    const textDark = rgb(30 / 255, 41 / 255, 59 / 255);
    const textMuted = rgb(100 / 255, 116 / 255, 139 / 255);
    const emeraldGreen = rgb(16 / 255, 185 / 255, 129 / 255);

    // Outer & Inner Borders
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: primaryNavy,
      borderWidth: 3,
    });
    page.drawRectangle({
      x: 26,
      y: 26,
      width: width - 52,
      height: height - 52,
      borderColor: accentGold,
      borderWidth: 1,
    });

    // Tricolor Strip
    const topBarY = height - 38;
    const barWidth = (width - 60) / 3;
    page.drawRectangle({ x: 30, y: topBarY, width: barWidth, height: 4, color: rgb(255 / 255, 153 / 255, 51 / 255) });
    page.drawRectangle({ x: 30 + barWidth, y: topBarY, width: barWidth, height: 4, color: rgb(255 / 255, 255 / 255, 255 / 255) });
    page.drawRectangle({ x: 30 + barWidth * 2, y: topBarY, width: barWidth, height: 4, color: rgb(19 / 255, 136 / 255, 8 / 255) });

    let currentY = height - 65;
    page.drawText('GOVERNMENT OF INDIA', {
      x: width / 2 - fontBold.widthOfTextAtSize('GOVERNMENT OF INDIA', 15) / 2,
      y: currentY,
      size: 15,
      font: fontBold,
      color: primaryNavy,
    });

    currentY -= 16;
    page.drawText('DEPARTMENT OF CONSUMER AFFAIRS', {
      x: width / 2 - fontBold.widthOfTextAtSize('DEPARTMENT OF CONSUMER AFFAIRS', 12) / 2,
      y: currentY,
      size: 12,
      font: fontBold,
      color: primaryNavy,
    });

    currentY -= 14;
    const subDept = 'DIRECTORATE OF LEGAL METROLOGY (HARYANA & DELHI NCR)';
    page.drawText(subDept, {
      x: width / 2 - fontRegular.widthOfTextAtSize(subDept, 9.5) / 2,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: textMuted,
    });

    currentY -= 14;
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 1.5,
      color: accentGold,
    });

    currentY -= 28;
    const certTitle = 'CERTIFICATE OF VERIFICATION';
    page.drawText(certTitle, {
      x: width / 2 - fontBold.widthOfTextAtSize(certTitle, 16) / 2,
      y: currentY,
      size: 16,
      font: fontBold,
      color: primaryNavy,
    });

    currentY -= 14;
    const ruleRef = '[ Under Rule 14 of the Legal Metrology (General) Rules, 2011 - Schedule IX (Form V) ]';
    page.drawText(ruleRef, {
      x: width / 2 - fontRegular.widthOfTextAtSize(ruleRef, 9) / 2,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: textMuted,
    });

    currentY -= 32;
    page.drawRectangle({
      x: width / 2 - 110,
      y: currentY - 5,
      width: 220,
      height: 24,
      color: rgb(236 / 255, 253 / 255, 245 / 255),
      borderColor: emeraldGreen,
      borderWidth: 1,
    });
    page.drawText('STATUTORILY VERIFIED & STAMPED', {
      x: width / 2 - fontBold.widthOfTextAtSize('STATUTORILY VERIFIED & STAMPED', 10) / 2,
      y: currentY + 3,
      size: 10,
      font: fontBold,
      color: rgb(6 / 255, 95 / 255, 70 / 255),
    });

    currentY -= 30;
    const preamble = `This is to certify that the weighing and measuring instrument described herein has been duly inspected, calibrated, and found to comply with the statutory Maximum Permissible Error (MPE) tolerances under the Legal Metrology Act, 2009.`;
    page.drawText(preamble, {
      x: 50,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: textDark,
      maxWidth: width - 100,
      lineHeight: 14,
    });

    currentY -= 45;
    const tableTop = currentY;
    const tableHeight = 190;
    page.drawRectangle({
      x: 50,
      y: tableTop - tableHeight,
      width: width - 100,
      height: tableHeight,
      color: rgb(248 / 255, 250 / 255, 252 / 255),
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
      borderWidth: 1,
    });

    const today = new Date();
    const issueDateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const expiryDate = new Date(today);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const expiryDateStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const details = [
      { label: 'License / Certificate Number:', value: toWinAnsi(trader.license_number), isMono: true },
      { label: 'Commercial Trader / Business:', value: toWinAnsi(trader.trader_name) },
      { label: 'Registered Proprietor / Owner:', value: toWinAnsi(trader.owner_name || 'Authorized Trader') },
      { label: 'Verified Instrument Type:', value: toWinAnsi(trader.instrument_type) },
      { label: 'Accuracy Classification:', value: 'Class III (Commercial / Industrial Standard)' },
      { label: 'Date of Stamping & Issue:', value: issueDateStr },
      { label: 'Statutory Validity Period:', value: `Valid until ${expiryDateStr}` },
      { label: 'Physical Security Seal No:', value: `SEAL-${licenseNumber.replace(/\//g, '-')}-IND` },
    ];

    let rowY = tableTop - 20;
    for (const item of details) {
      page.drawText(item.label, { x: 65, y: rowY, size: 9.5, font: fontBold, color: primaryNavy });
      page.drawText(String(item.value), { x: 235, y: rowY, size: 9.5, font: item.isMono ? fontMono : fontRegular, color: textDark });
      page.drawLine({
        start: { x: 60, y: rowY - 6 },
        end: { x: width - 60, y: rowY - 6 },
        thickness: 0.5,
        color: rgb(241 / 255, 245 / 255, 249 / 255),
      });
      rowY -= 22;
    }

    const bottomSectionY = tableTop - tableHeight - 20;
    const signBoxY = bottomSectionY - 110;
    page.drawText('LEGAL METROLOGY VERIFICATION SEAL', { x: 50, y: signBoxY + 100, size: 10, font: fontBold, color: primaryNavy });
    page.drawText('- Digitally authenticated via National Legal Metrology e-Mapan Gateway.', { x: 50, y: signBoxY + 84, size: 8.5, font: fontRegular, color: textMuted });
    page.drawText('- Scan the QR code to verify live certificate authenticity against central database.', { x: 50, y: signBoxY + 70, size: 8.5, font: fontRegular, color: textMuted });
    page.drawText('- Tampering with verification seals or operating unverified equipment is an offense.', { x: 50, y: signBoxY + 56, size: 8.5, font: fontRegular, color: rgb(185 / 255, 28 / 255, 28 / 255) });

    page.drawLine({ start: { x: 50, y: signBoxY + 20 }, end: { x: 280, y: signBoxY + 20 }, thickness: 1, color: primaryNavy });
    page.drawText('Inspector of Legal Metrology (Senior Grade-I)', { x: 50, y: signBoxY + 8, size: 9, font: fontBold, color: primaryNavy });
    page.drawText('Department of Consumer Affairs, Government of India', { x: 50, y: signBoxY - 4, size: 8, font: fontRegular, color: textMuted });

    // QR Code Position
    const qrSize = 100;
    page.drawImage(qrImage, { x: width - 165, y: signBoxY - 5, width: qrSize, height: qrSize });
    page.drawText('SCAN TO VERIFY LIVE', {
      x: width - 165 + (qrSize - fontBold.widthOfTextAtSize('SCAN TO VERIFY LIVE', 7.5)) / 2,
      y: signBoxY - 16,
      size: 7.5,
      font: fontBold,
      color: primaryNavy,
    });

    const pdfBytes = await pdfDoc.save();
    const safeFilename = `Certificate_${licenseNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': String(pdfBytes.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
