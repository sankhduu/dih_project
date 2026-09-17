import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getMockTradersList, updateMockTrader } from '@/lib/mock-traders';
import { enrichTraderWithRisk } from '@/lib/risk-engine';

const OFFICER_POOL = [
  'Inspector Rajesh Varma (Zone-1)',
  'Inspector Anita Desai (Zone-2)',
  'Inspector Sandeep Phogat (Flying Squad)',
  'Inspector Vikram Rathore (Rapid Response)',
];

export async function POST(req: NextRequest) {
  try {
    let district = '';
    try {
      const body = await req.json();
      district = body.district || '';
    } catch {
      // Body may be empty
    }

    const { searchParams } = new URL(req.url);
    if (!district) {
      district = searchParams.get('district') || '';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let candidates: any[] = [];

    if (supabase) {
      try {
        const query = supabase.from('traders').select('*').eq('inspection_status', 'Pending');
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          candidates = data;
        }
      } catch (sbErr) {
        console.warn('Supabase auto-assign fetch notice:', sbErr);
      }
    }

    if (candidates.length === 0) {
      candidates = getMockTradersList(50, 'Pending');
    }

    if (district && district !== 'All') {
      candidates = candidates.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => (t.district || 'Hisar').toLowerCase() === district.toLowerCase()
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scored = candidates.map((t: any) => enrichTraderWithRisk(t));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scored.sort((a: any, b: any) => (b.risk_score || 0) - (a.risk_score || 0));

    const assignments = [];
    let officerIdx = 0;

    for (const trader of scored) {
      const assigned = OFFICER_POOL[officerIdx % OFFICER_POOL.length];
      officerIdx++;

      if (supabase && trader.id) {
        try {
          await supabase
            .from('traders')
            .update({ assigned_officer: assigned, updated_at: new Date().toISOString() })
            .eq('id', trader.id);
        } catch (_) {}
      }

      updateMockTrader(trader.license_number, { assigned_officer: assigned });

      assignments.push({
        license_number: trader.license_number,
        trader_name: trader.trader_name,
        risk_score: trader.risk_score,
        risk_tier: trader.risk_tier,
        assigned_officer: assigned,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully prioritized and auto-assigned ${assignments.length} establishments based on Statutory Risk Index.`,
      count: assignments.length,
      assignments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
