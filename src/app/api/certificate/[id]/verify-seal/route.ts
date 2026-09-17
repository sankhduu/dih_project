import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalSealInfo } from '@/lib/risk-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const licenseNumber = decodeURIComponent(id).trim();
    const body = await req.json();
    const { seal_number } = body;

    if (!seal_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing seal_number',
          message: 'Physical seal number stamped on the instrument is required.',
        },
        { status: 400 }
      );
    }

    const { canonicalSeal, sealHash } = getCanonicalSealInfo(licenseNumber);
    const cleanedEntered = seal_number.trim().toUpperCase();
    const isAuthentic = cleanedEntered === canonicalSeal.toUpperCase();

    const result = {
      success: true,
      status: isAuthentic ? 'SEAL_AUTHENTIC' : 'TAMPER_SUSPECTED',
      is_authentic: isAuthentic,
      license_number: licenseNumber,
      entered_seal: seal_number,
      expected_seal_format: canonicalSeal,
      cryptographic_seal_hash: sealHash,
      message: isAuthentic
        ? 'Physical lead seal verified against National Legal Metrology Stamping Register. No tampering detected.'
        : 'CRITICAL ALERT: Physical seal mismatch detected! Entered seal does not match the official statutory record. Instrument may have been unsealed or altered post-verification.',
      verified_at: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
