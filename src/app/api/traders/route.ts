import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getMockTradersList } from '@/lib/mock-traders';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const rawStatus = searchParams.get('status');
    const district = searchParams.get('district');

    // Standardize status: 'Pending', 'Pending_Inspection', or 'Pending_LMO' -> 'Pending_LMO'
    let targetStatus = rawStatus;
    if (rawStatus) {
      const lower = rawStatus.toLowerCase();
      if (lower === 'pending' || lower === 'pending_inspection' || lower === 'pending_lmo') {
        targetStatus = 'Pending_LMO';
      }
    }

    // 1. Primary: Fetch from Supabase traders_list
    if (supabase) {
      try {
        let listQuery = supabase.from('traders_list').select('*').limit(limit);

        if (targetStatus && targetStatus !== 'All') {
          listQuery = listQuery.eq('status', targetStatus);
        }
        if (district && district !== 'All') {
          listQuery = listQuery.ilike('district', `%${district}%`);
        }

        const { data: listData, error: listError } = await listQuery;

        if (!listError && listData && listData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows = listData.map((t: any) => ({
            id: t.license_number,
            trader_name: t.trader_name || t.shop_name || 'Registered Trader',
            owner_name: t.owner_name || '',
            license_number: t.license_number,
            latitude: t.latitude ? parseFloat(t.latitude) : 28.8955,
            longitude: t.longitude ? parseFloat(t.longitude) : 76.6066,
            district: t.district || 'Hisar',
            status: t.status || 'Pending_LMO',
            inspection_status: t.status || 'Pending_LMO',
            instrument_type: t.instrument_type || 'Class III Electronic Weighing Scale',
            trader_email: t.trader_email || '',
          }));

          return NextResponse.json({
            success: true,
            count: rows.length,
            data: rows,
          });
        }

        // 2. Secondary fallback to 'traders' or 'lmo_mock_traders'
        let query = supabase.from('traders').select('*').limit(limit);
        if (district && district !== 'All') {
          query = query.ilike('district', `%${district}%`);
        }
        if (targetStatus && targetStatus !== 'All') {
          query = query.or(`inspection_status.eq.${targetStatus},status.eq.${targetStatus}`);
        }
        let { data, error } = await query;

        if (error && error.message?.includes('Could not find the table')) {
          let fallbackQ = supabase.from('lmo_mock_traders').select('*').limit(limit);
          if (targetStatus && targetStatus !== 'All') {
            fallbackQ = fallbackQ.eq('inspection_status', targetStatus);
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
    let fallbackList = getMockTradersList(limit, status);
    if (district) {
      const match = fallbackList.filter((t) =>
        (t.district || '').toLowerCase() === district.toLowerCase()
      );
      if (match.length > 0) {
        fallbackList = match;
      } else {
        const code = district.substring(0, 3).toUpperCase();
        fallbackList = [
          {
            id: 101,
            trader_name: `${district} General Provision Store`,
            shop_name: `${district} General Provision Store`,
            owner_name: 'Rajesh Kumar',
            license_number: `HR-LMO-${code}-2026-101`,
            district: district,
            inspection_status: 'Pending',
            status: 'Pending_Inspection',
            instrument_type: 'Electronic Counter Scale',
          },
          {
            id: 102,
            trader_name: `${district} Wholesale Agro Mandi`,
            shop_name: `${district} Wholesale Agro Mandi`,
            owner_name: 'Suresh Verma',
            license_number: `HR-LMO-${code}-2026-102`,
            district: district,
            inspection_status: 'Pending',
            status: 'Scheduled',
            instrument_type: 'Platform Scale (500 kg)',
          },
          {
            id: 103,
            trader_name: `${district} Jewelers & Precious Metals`,
            shop_name: `${district} Jewelers & Precious Metals`,
            owner_name: 'Vikram Soni',
            license_number: `HR-LMO-${code}-2026-103`,
            district: district,
            inspection_status: 'Passed',
            status: 'Verified',
            instrument_type: 'High Precision Balance',
          },
          {
            id: 104,
            trader_name: `${district} Petroleum & Logistics Depot`,
            shop_name: `${district} Petroleum & Logistics Depot`,
            owner_name: 'Dr. Priya Sharma',
            license_number: `HR-LMO-${code}-2026-104`,
            district: district,
            inspection_status: 'Passed',
            status: 'Approved',
            instrument_type: 'Fuel Dispenser Meter',
          },
        ];
        if (status && status !== 'All') {
          fallbackList = fallbackList.filter((t) => (t.inspection_status || '').toLowerCase() === status.toLowerCase());
        }
      }
    }
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
      status,
      district,
      trader_email,
    } = body;

    if (!trader_name || !owner_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: trader_name and owner_name' },
        { status: 400 }
      );
    }

    const dist = district || 'Hisar';
    const distPrefix = dist.toUpperCase().substring(0, 3);
    const generatedLicense =
      license_number || `HR-LMO-${distPrefix}-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // Standardize status strictly to 'Pending_LMO'
    const targetStatus = status || inspection_status || 'Pending_LMO';
    const finalStatus =
      targetStatus === 'Pending' || targetStatus === 'Pending_Inspection'
        ? 'Pending_LMO'
        : targetStatus;

    const newRecord = {
      shop_name: trader_name.trim(),
      trader_name: trader_name.trim(),
      owner_name: owner_name.trim(),
      license_number: generatedLicense.trim(),
      latitude: latitude ? parseFloat(latitude) : 28.8955,
      longitude: longitude ? parseFloat(longitude) : 76.6066,
      instrument_type: instrument_type || 'Class III Electronic Weighing Scale',
      status: finalStatus,
      district: dist,
      trader_email: trader_email || 'trader@demo.com',
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('traders_list')
          .insert([newRecord])
          .select()
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ success: true, data }, { status: 201 });
        } else if (error) {
          console.warn('Supabase traders_list insert note:', error.message);
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
