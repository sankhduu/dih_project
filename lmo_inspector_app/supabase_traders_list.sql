-- ==============================================================================
-- e-Mapan 2.0: 3-Tier Verification & Certification Lifecycle
-- Trader (Applies) -> LMO (Inspects) -> GATC (Signs) -> Trader (Downloads QR)
-- Run this in your Supabase Project > SQL Editor
-- ==============================================================================

-- 1. Create traders_list table with complete 3-tier lifecycle columns
CREATE TABLE IF NOT EXISTS public.traders_list (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    district TEXT NOT NULL, -- e.g. 'Rohtak', 'Hisar'
    status TEXT NOT NULL DEFAULT 'Pending_Inspection', -- 'Pending_Inspection', 'Under_Review', 'Approved', 'Rejected'
    address TEXT,
    instrument_type TEXT DEFAULT 'Counter Scale Class III',
    capacity TEXT,
    make_model TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    photo_url TEXT,
    checklist_confirmed BOOLEAN DEFAULT false,
    lmo_id TEXT,
    digital_signature TEXT,
    signed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure any existing columns are present if the table was created earlier
ALTER TABLE public.traders_list ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.traders_list ADD COLUMN IF NOT EXISTS checklist_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.traders_list ADD COLUMN IF NOT EXISTS lmo_id TEXT;
ALTER TABLE public.traders_list ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE public.traders_list ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE public.traders_list ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Enable Row Level Security (RLS) & Public / Authenticated Access Policies
ALTER TABLE public.traders_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users" ON public.traders_list;
CREATE POLICY "Allow read access to all users" ON public.traders_list
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update access to all users" ON public.traders_list;
CREATE POLICY "Allow update access to all users" ON public.traders_list
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert access to all users" ON public.traders_list;
CREATE POLICY "Allow insert access to all users" ON public.traders_list
    FOR INSERT WITH CHECK (true);

-- 3. Enable Realtime Replication for traders_list
ALTER PUBLICATION supabase_realtime ADD TABLE public.traders_list;

-- 4. Seed Hackathon Demo Traders covering all 4 lifecycle states
INSERT INTO public.traders_list (
    id, shop_name, owner_name, license_number, district, status, address, 
    instrument_type, capacity, make_model, latitude, longitude, 
    photo_url, checklist_confirmed, lmo_id, digital_signature, signed_at, rejection_reason
)
VALUES
    -- 1. Pending_Inspection (Initial state after Trader applies)
    (
        'ROH-TR-001', 
        'Sharma Kirana & General Store', 
        'Ramesh Kumar Sharma', 
        'HR-LMO-ROH-2026-042', 
        'Rohtak', 
        'Pending_Inspection', 
        'Booth 12, Main Market, Model Town, Rohtak - 124001', 
        'Electronic Tabletop Scale (30 kg Class III)', 
        '30 kg / e=2g', 
        'Essae DS-852 Tabletop',
        NULL,
        NULL,
        NULL,
        false,
        NULL,
        NULL,
        NULL,
        NULL
    ),

    -- 2. Under_Review (LMO has submitted field inspection: photo, GPS, checklist)
    (
        'ROH-TR-002', 
        'Haryana Gold & Diamond Jewelers', 
        'Vikram Soni', 
        'HR-LMO-ROH-2026-057', 
        'Rohtak', 
        'Under_Review', 
        'Sarafa Bazar, Near Quilla Mohalla, Rohtak - 124001', 
        'High Precision Gold Balance (Class II)', 
        '600 g / e=0.01g', 
        'Sartorius Gold Series GS-600',
        28.8955,
        76.6066,
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
        true,
        'officer.rohtak@gov.in',
        NULL,
        NULL,
        NULL
    ),

    -- 3. Approved (GATC has reviewed and digitally signed certificate)
    (
        'ROH-TR-003', 
        'Kisan Krishi Agro Mandi Depot', 
        'Dharmender Hooda', 
        'HR-LMO-ROH-2026-093', 
        'Rohtak', 
        'Approved', 
        'Shed No. 7, New Grain Market, Rohtak - 124001', 
        'Mechanical & Digital Steelyard Platform Scale', 
        '300 kg / e=50g', 
        'Crown Weighing CW-300',
        28.9012,
        76.6124,
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
        true,
        'officer.rohtak@gov.in',
        'GATC-SIG-8F92A9C4D2E1F083-B745E69A',
        NOW(),
        NULL
    ),

    -- 4. Rejected (GATC rejected with a deficiency reason)
    (
        'ROH-TR-004', 
        'Delhi Bypass Petrol & Diesel Fuel Station', 
        'Baljeet Singh', 
        'HR-LMO-ROH-2026-112', 
        'Rohtak', 
        'Rejected', 
        'NH-9 Delhi Road, Rohtak - 124021', 
        'Fuel Dispensing Unit (Flow Meter)', 
        '50 L/min standard flow', 
        'Tokheim Quantium 510',
        28.8821,
        76.6255,
        'https://images.unsplash.com/photo-1527018607619-a508a2be00bf?w=500&auto=format&fit=crop&q=60',
        true,
        'officer.rohtak@gov.in',
        NULL,
        NULL,
        'Lead security seal mismatch and calibration drift exceeded +/- 0.5% MPE tolerance limit.'
    ),

    -- Hisar Queue Demo Records
    (
        'HIS-TR-101', 
        'Hisar Agro Mill & Grain Store', 
        'Suresh Chand Bishnoi', 
        'HR-LMO-HIS-2026-081', 
        'Hisar', 
        'Pending_Inspection', 
        'Shop 14, Anaj Mandi, Hisar, Haryana - 125001', 
        'Platform Weighing Scale (500 kg)', 
        '500 kg / e=50g', 
        'Avery Weight-Tronix AV-500',
        NULL,
        NULL,
        NULL,
        false,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        'HIS-TR-102', 
        'Rajdhani Sweets & Dairy', 
        'Sunil Kumar', 
        'HR-LMO-HIS-2026-119', 
        'Hisar', 
        'Under_Review', 
        'Plot 4, Urban Estate II, Hisar - 125005', 
        'Electronic Retail Counter Scale (30 kg)', 
        '30 kg / e=2g', 
        'Essae Teraoka DS-215',
        29.1539,
        75.7114,
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
        true,
        'officer.hisar@gov.in',
        NULL,
        NULL,
        NULL
    ),
    (
        'HIS-TR-103', 
        'Jindal Steel Hardware & Fasteners', 
        'Praveen Jindal', 
        'HR-LMO-HIS-2026-144', 
        'Hisar', 
        'Approved', 
        'G.T. Road, Near Model Town, Hisar - 125001', 
        'Heavy Duty Platform Scale (1000 kg)', 
        '1000 kg / e=100g', 
        'Citizen Scales HD-1T',
        29.1482,
        75.7205,
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
        true,
        'officer.hisar@gov.in',
        'GATC-SIG-7E43B1A9D4E2F162-C836D57B',
        NOW(),
        NULL
    )
ON CONFLICT (license_number) DO UPDATE SET
    status = EXCLUDED.status,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    photo_url = EXCLUDED.photo_url,
    checklist_confirmed = EXCLUDED.checklist_confirmed,
    lmo_id = EXCLUDED.lmo_id,
    digital_signature = EXCLUDED.digital_signature,
    signed_at = EXCLUDED.signed_at,
    rejection_reason = EXCLUDED.rejection_reason,
    updated_at = NOW();


