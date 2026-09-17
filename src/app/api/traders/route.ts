import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getMockTradersList } from '@/lib/mock-traders';
import { enrichTraderWithRisk } from '@/lib/risk-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const rawStatus = searchParams.get('status') || searchParams.get('inspection_status');
    const district = searchParams.get('district');
    const sortBy = (searchParams.get('sortBy') || searchParams.get('sort') || '').toLowerCase();

    // Standardize status: 'Pending', 'Pending_Inspection', or 'Pending_LMO' -> 'Pending'
    let targetStatus = rawStatus;
    if (rawStatus && rawStatus !== 'All') {
      const lower = rawStatus.toLowerCase();
      if (lower === 'pending' || lower === 'pending_inspection' || lower === 'pending_lmo') {
        targetStatus = 'Pending';
      } else if (lower === 'passed' || lower === 'verified' || lower === 'approved') {
        targetStatus = 'Passed';
      } else if (lower === 'failed' || lower === 'rejected') {
        targetStatus = 'Failed';
      }
    }

    // 1. Primary: Fetch from Supabase traders table
    if (supabase) {
      try {
        let query = supabase.from('traders').select('*').limit(limit);

        if (targetStatus && targetStatus !== 'All') {
          query = query.or(`inspection_status.eq.${targetStatus},inspection_status.eq.Pending_LMO,status.eq.${targetStatus}`);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let rows = data.map((t: any) =>
            enrichTraderWithRisk({
              id: t.id,
              trader_name: t.trader_name || t.shop_name || 'Registered Trader',
              owner_name: t.owner_name || '',
              license_number: t.license_number,
              latitude: t.latitude ? parseFloat(t.latitude) : 28.8955,
              longitude: t.longitude ? parseFloat(t.longitude) : 76.6066,
              instrument_type: t.instrument_type || 'Class III Electronic Weighing Scale',
              inspection_status: t.inspection_status || t.status || 'Pending',
              status: t.inspection_status || t.status || 'Pending',
              assigned_officer: t.assigned_officer || null,
              inspection_image_url: t.inspection_image_url || null,
              district: t.district || 'Hisar',
              created_at: t.created_at,
              updated_at: t.updated_at,
            })
          );

          if (district && district !== 'All') {
            rows = rows.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (t: any) => (t.district || 'Hisar').toLowerCase() === district.toLowerCase()
            );
          }

          if (sortBy === 'risk') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rows.sort((a: any, b: any) => (b.risk_score || 0) - (a.risk_score || 0));
          }

          return NextResponse.json({
            success: true,
            count: rows.length,
            data: rows,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase traders query exception, serving fallback:', sbErr);
      }
    }

    // Fallback to in-memory mock traders
    let fallbackList = getMockTradersList(limit, targetStatus || undefined);
    if (district && district !== 'All') {
      const match = fallbackList.filter(
        (t) => (t.district || '').toLowerCase() === district.toLowerCase()
      );
      if (match.length > 0) {
        fallbackList = match;
      }
    }

    let enrichedFallback = fallbackList.map((t) => enrichTraderWithRisk(t));
    if (sortBy === 'risk') {
      enrichedFallback.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
    }

    return NextResponse.json({
      success: true,
      count: enrichedFallback.length,
      data: enrichedFallback,
      fallback: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trader_name,
      owner_name,
      license_number,
      latitude,
      longitude,
      instrument_type,
      assigned_officer,
    } = body;

    if (!trader_name || !owner_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: trader_name and owner_name' },
        { status: 400 }
      );
    }

    const generatedLicense =
      license_number || `HR-LMO-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRecord = {
      trader_name: trader_name.trim(),
      owner_name: owner_name.trim(),
      license_number: generatedLicense.trim(),
      latitude: latitude ? parseFloat(latitude) : 28.8955,
      longitude: longitude ? parseFloat(longitude) : 76.6066,
      instrument_type: instrument_type || 'Class III Electronic Weighing Scale',
      inspection_status: 'Pending',
      assigned_officer: assigned_officer || null,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('traders')
          .insert([newRecord])
          .select()
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ success: true, data }, { status: 201 });
        } else if (error) {
          console.warn('Supabase traders insert note:', error.message);
        }
      } catch (sbErr) {
        console.warn('Supabase insert exception:', sbErr);
      }
    }

    return NextResponse.json(
      { success: true, data: newRecord, fallback: true },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
