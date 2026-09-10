import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getMockTradersList } from '@/lib/mock-traders';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const status = searchParams.get('status');

    // Attempt Supabase fetch
    if (supabase) {
      try {
        let query = supabase.from('traders').select('*').limit(limit);
        if (status && status !== 'All') {
          query = query.eq('inspection_status', status);
        }
        let { data, error } = await query;

        // Try fallback table name 'lmo_mock_traders' if 'traders' is missing
        if (error && error.message?.includes('Could not find the table')) {
          let fallbackQ = supabase.from('lmo_mock_traders').select('*').limit(limit);
          if (status && status !== 'All') {
            fallbackQ = fallbackQ.eq('inspection_status', status);
          }
          const res = await fallbackQ;
          data = res.data;
          error = res.error;
        }

        if (!error && data && data.length > 0) {
          return NextResponse.json({
            success: true,
            count: data.length,
            data,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase query exception, serving fallback:', sbErr);
      }
    }

    // Fallback to in-memory mock traders
    const fallbackList = getMockTradersList(limit, status);
    return NextResponse.json({
      success: true,
      count: fallbackList.length,
      data: fallbackList,
      fallback: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
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
      inspection_status,
    } = body;

    if (!trader_name || !owner_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: trader_name and owner_name' },
        { status: 400 }
      );
    }

    const generatedLicense =
      license_number || `LMO/2026/${Math.floor(10000 + Math.random() * 90000)}`;

    const newRecord = {
      trader_name: trader_name.trim(),
      owner_name: owner_name.trim(),
      license_number: generatedLicense.trim(),
      latitude: latitude ? parseFloat(latitude) : 28.6139,
      longitude: longitude ? parseFloat(longitude) : 77.209,
      instrument_type: instrument_type || 'Electronic Weighing Scale',
      inspection_status: inspection_status || 'Pending',
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
        }
      } catch {
        // Fallback
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
