-- ==============================================================================
-- e-Mapan 2.0: Legal Metrology Officer (LMO) - traders_list Schema & Seed Data
-- Run this in your Supabase Project > SQL Editor
-- ==============================================================================

-- 1. Create traders_list table
CREATE TABLE IF NOT EXISTS public.traders_list (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    district TEXT NOT NULL, -- e.g. 'Rohtak', 'Hisar'
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    address TEXT,
    instrument_type TEXT DEFAULT 'Counter Scale Class III',
    capacity TEXT,
    make_model TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) & Public / Authenticated Access Policies
ALTER TABLE public.traders_list ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated officers & public
CREATE POLICY "Allow read access to all users" ON public.traders_list
    FOR SELECT USING (true);

-- Allow updates (e.g. status changes to 'Approved')
CREATE POLICY "Allow update access to all users" ON public.traders_list
    FOR UPDATE USING (true) WITH CHECK (true);

-- Allow insert
CREATE POLICY "Allow insert access to all users" ON public.traders_list
    FOR INSERT WITH CHECK (true);

-- 3. Seed Hackathon Demo Traders for Rohtak & Hisar Districts
INSERT INTO public.traders_list (id, shop_name, owner_name, license_number, district, status, address, instrument_type, capacity, make_model)
VALUES
    -- Rohtak LMO Queue (status = 'Pending')
    ('ROH-TR-001', 'Sharma Kirana & General Store', 'Ramesh Kumar Sharma', 'HR-LMO-ROH-2026-042', 'Rohtak', 'Pending', 'Booth 12, Main Market, Model Town, Rohtak - 124001', 'Electronic Tabletop Scale (30 kg Class III)', '30 kg / e=2g', 'Essae DS-852 Tabletop'),
    ('ROH-TR-002', 'Haryana Gold & Diamond Jewelers', 'Vikram Soni', 'HR-LMO-ROH-2026-057', 'Rohtak', 'Pending', 'Sarafa Bazar, Near Quilla Mohalla, Rohtak - 124001', 'High Precision Gold Balance (Class II)', '600 g / e=0.01g', 'Sartorius Gold Series GS-600'),
    ('ROH-TR-003', 'Kisan Krishi Agro Mandi Depot', 'Dharmender Hooda', 'HR-LMO-ROH-2026-093', 'Rohtak', 'Pending', 'Shed No. 7, New Grain Market, Rohtak - 124001', 'Mechanical & Digital Steelyard Platform Scale', '300 kg / e=50g', 'Crown Weighing CW-300'),
    ('ROH-TR-004', 'Delhi Bypass Fuel Station', 'Baljeet Singh', 'HR-LMO-ROH-2026-112', 'Rohtak', 'Pending', 'NH-9 Delhi Road, Rohtak - 124021', 'Fuel Dispensing Unit (Flow Meter)', '50 L/min standard flow', 'Tokheim Quantium 510'),

    -- Hisar LMO Queue (status = 'Pending')
    ('HIS-TR-101', 'Hisar Agro Mill & Grain Store', 'Suresh Chand Bishnoi', 'HR-LMO-HIS-2026-081', 'Hisar', 'Pending', 'Shop 14, Anaj Mandi, Hisar, Haryana - 125001', 'Platform Weighing Scale (500 kg)', '500 kg / e=50g', 'Avery Weight-Tronix AV-500'),
    ('HIS-TR-102', 'Rajdhani Sweets & Dairy', 'Sunil Kumar', 'HR-LMO-HIS-2026-119', 'Hisar', 'Pending', 'Plot 4, Urban Estate II, Hisar - 125005', 'Electronic Retail Counter Scale (30 kg)', '30 kg / e=2g', 'Essae Teraoka DS-215'),
    ('HIS-TR-103', 'Jindal Steel Hardware & Fasteners', 'Praveen Jindal', 'HR-LMO-HIS-2026-144', 'Hisar', 'Pending', 'G.T. Road, Near Model Town, Hisar - 125001', 'Heavy Duty Platform Scale (1000 kg)', '1000 kg / e=100g', 'Citizen Scales HD-1T')
ON CONFLICT (license_number) DO NOTHING;

