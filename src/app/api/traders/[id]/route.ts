import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getMockTraderById, updateMockTrader } from '@/lib/mock-traders';
import { enrichTraderWithRisk } from '@/lib/risk-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();

    if (supabase) {
      try {
        const isNumeric = !isNaN(Number(decodedId));
        let result;
        if (isNumeric) {
          result = await supabase
            .from('traders')
            .select('*')
            .eq('id', Number(decodedId))
            .maybeSingle();
        }

        if (!result?.data) {
          result = await supabase
            .from('traders')
            .select('*')
            .eq('license_number', decodedId)
            .maybeSingle();
        }

        if (result?.data) {
          return NextResponse.json({
            success: true,
            data: enrichTraderWithRisk({
              ...result.data,
              status: result.data.inspection_status || 'Pending',
            }),
          });
        }
      } catch (sbErr) {
        console.warn('Supabase fetch exception on /api/traders/[id]:', sbErr);
      }
    }

    const mock = getMockTraderById(decodedId);
    if (mock) {
      return NextResponse.json({
        success: true,
        data: enrichTraderWithRisk(mock),
        fallback: true,
      });
    }

    return NextResponse.json(
      { success: false, error: `Trader ${decodedId} not found` },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();
    const body = await req.json();
    const { assigned_officer, inspection_status, status } = body;

    let targetStatus = inspection_status || status;
    if (targetStatus) {
      const lower = targetStatus.toLowerCase();
      if (lower.includes('pass') || lower.includes('verif') || lower.includes('appr')) {
        targetStatus = 'Passed';
      } else if (lower.includes('fail') || lower.includes('rej')) {
        targetStatus = 'Failed';
      } else {
        targetStatus = 'Pending';
      }
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (assigned_officer !== undefined) updates.assigned_officer = assigned_officer;
    if (targetStatus !== undefined) updates.inspection_status = targetStatus;

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
            message: 'Updated trader successfully in traders table',
            data: enrichTraderWithRisk(data),
          });
        }
      } catch (sbErr) {
        console.warn('Supabase update exception on /api/traders/[id]:', sbErr);
      }
    }

    // Fallback: update in-memory mock traders
    const mockUpdated = updateMockTrader(decodedId, {
      assigned_officer,
      inspection_status: targetStatus,
    });

    return NextResponse.json({
      success: true,
      message: 'Updated trader record (local cache)',
      data: enrichTraderWithRisk(mockUpdated || { license_number: decodedId, ...updates }),
      fallback: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
