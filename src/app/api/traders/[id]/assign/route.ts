import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { updateMockTrader } from '@/lib/mock-traders';
import { enrichTraderWithRisk } from '@/lib/risk-engine';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();
    const body = await req.json();
    const { assigned_officer, inspection_status, status } = body;

    const targetOfficer = assigned_officer || 'Inspector Rajesh Varma';
    const targetStatus = inspection_status || status || 'Pending';

    const updates: Record<string, unknown> = {
      assigned_officer: targetOfficer,
      inspection_status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const isNumeric = !isNaN(Number(decodedId));
        let query = supabase.from('traders').update(updates);
        if (isNumeric) {
          query = query.eq('id', Number(decodedId));
        } else {
          query = query.eq('license_number', decodedId);
        }

        const { data, error } = await query.select().maybeSingle();

        if (!error && data) {
          return NextResponse.json({
            success: true,
            message: 'Assigned officer successfully in traders table',
            data: enrichTraderWithRisk(data),
          });
        }
      } catch (sbErr) {
        console.warn('Supabase officer assign exception:', sbErr);
      }
    }

    const mockUpdated = updateMockTrader(decodedId, {
      assigned_officer: targetOfficer,
      inspection_status: targetStatus,
    });

    return NextResponse.json({
      success: true,
      message: 'Assigned officer (local cache)',
      data: enrichTraderWithRisk(mockUpdated || { license_number: decodedId, ...updates }),
      fallback: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
