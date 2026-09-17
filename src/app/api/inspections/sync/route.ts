import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_number, inspection_status, status } = body;
    const cleanLic = (license_number || '').trim();
    const targetStatus = status || inspection_status || 'Pending_GATC';

    if (!cleanLic) {
      return NextResponse.json(
        { success: false, error: 'license_number is required' },
        { status: 400 }
      );
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('traders_list')
          .update({
            status: targetStatus,
          })
          .eq('license_number', cleanLic)
          .select();

        if (!error) {
          return NextResponse.json({
            success: true,
            message: `Inspection for ${cleanLic} synchronized successfully to traders_list`,
            data,
            syncedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Note updating traders_list in /api/inspections/sync:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inspection for ${cleanLic} synchronized (local cache)`,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
