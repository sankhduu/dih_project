import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getMockTraderById, updateMockTrader } from '@/lib/mock-traders';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();

    if (supabase) {
      try {
        let result = await supabase
          .from('traders_list')
          .select('*')
          .eq('license_number', decodedId)
          .maybeSingle();

        if (!result.data && !result.error) {
          result = await supabase
            .from('traders')
            .select('*')
            .eq('license_number', decodedId)
            .maybeSingle();
        }

        if (!result.data && !result.error) {
          result = await supabase
            .from('lmo_mock_traders')
            .select('*')
            .eq('license_number', decodedId)
            .maybeSingle();
        }

        if (result.data) {
          return NextResponse.json({ success: true, data: result.data });
        }
      } catch {
        // Fallback
      }
    }

    const mock = getMockTraderById(decodedId);
    if (mock) {
      return NextResponse.json({ success: true, data: mock, fallback: true });
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

    const targetStatus = status || inspection_status;
    const updates: { assigned_officer?: string; inspection_status?: string; status?: string } = {};
    if (assigned_officer !== undefined) updates.assigned_officer = assigned_officer;
    if (inspection_status !== undefined) updates.inspection_status = inspection_status;
    if (status !== undefined) updates.status = status;

    if (supabase) {
      try {
        if (targetStatus) {
          const { data, error } = await supabase
            .from('traders_list')
            .update({ status: targetStatus })
            .eq('license_number', decodedId)
            .select()
            .maybeSingle();

          if (!error && data) {
            return NextResponse.json({
              success: true,
              message: 'Updated trader successfully in traders_list',
              data,
            });
          }
        }

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
            message: 'Updated trader successfully',
            data,
          });
        }
      } catch {
        // Fallback
      }
    }

    const updated = updateMockTrader(decodedId, updates);
    return NextResponse.json({
      success: true,
      message: 'Updated trader record (local cache)',
      data: updated || { license_number: decodedId, ...updates },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
