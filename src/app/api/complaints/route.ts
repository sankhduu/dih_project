import { NextRequest, NextResponse } from 'next/server';
import { addComplaint, calculateTraderRiskScore } from '@/lib/risk-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      license_number,
      complaint_category,
      description,
      observed_discrepancy,
      contact_number,
      email,
    } = body;

    if (!license_number || !complaint_category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'license_number and complaint_category are required.',
        },
        { status: 400 }
      );
    }

    const cleanLic = decodeURIComponent(license_number).trim();
    const complaintId = `DOCA-CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComplaint = {
      id: complaintId,
      license_number: cleanLic,
      complaint_category: complaint_category.trim(),
      description: description ? description.trim() : 'Suspected accuracy or seal tampering issue reported by consumer.',
      observed_discrepancy: observed_discrepancy || 'Not specified',
      contact_number: contact_number || 'Confidential',
      email: email || '',
      status: 'ACTIVE',
      reported_at: new Date().toISOString(),
    };

    addComplaint(newComplaint);

    const updatedRisk = calculateTraderRiskScore({
      license_number: cleanLic,
      inspection_status: 'Pending',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Consumer complaint lodged successfully under Rule 27 citizen grievance protocol. Priority inspection queue updated.',
        complaint_id: complaintId,
        reference_number: complaintId,
        license_number: cleanLic,
        updated_risk_score: updatedRisk.score,
        updated_risk_tier: updatedRisk.tier,
        complaint: newComplaint,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
