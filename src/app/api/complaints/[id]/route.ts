import { NextRequest, NextResponse } from 'next/server';
import { getComplaintsForLicense } from '@/lib/risk-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanLic = decodeURIComponent(id).trim();
    const list = getComplaintsForLicense(cleanLic);

    return NextResponse.json({
      success: true,
      license_number: cleanLic,
      count: list.length,
      data: list,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
