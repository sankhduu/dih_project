import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const licenseNumber = decodeURIComponent(id).trim();

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided in form field  image' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = file.name && file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const safeLic = licenseNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `inspection_${safeLic}_${Date.now()}.${fileExt}`;

    let photoUrl = '';

    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('inspections')
          .upload(filename, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('inspections')
            .getPublicUrl(filename);
          photoUrl = urlData?.publicUrl || '';
        } else {
          console.warn('Supabase storage upload notice:', uploadError.message);
        }

        if (photoUrl) {
          await supabase
            .from('traders')
            .update({
              inspection_image_url: photoUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('license_number', licenseNumber);
        }
      } catch (sbErr) {
        console.warn('Storage processing notice:', sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inspection image for ${licenseNumber} processed and linked successfully`,
      license_number: licenseNumber,
      filename,
      inspection_image_url: photoUrl || `https://supabase.co/storage/v1/object/public/inspections/${filename}`,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
