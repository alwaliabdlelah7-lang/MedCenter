-- HIS Supabase Schema
-- Run this in Supabase SQL Editor

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_number TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  gender TEXT,
  birth_date DATE,
  national_id TEXT,
  address TEXT,
  blood_group TEXT,
  allergies TEXT[],
  chronic_diseases TEXT[],
  medical_history TEXT,
  dynamic_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Clinics
CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department_id TEXT,
  status TEXT DEFAULT 'active'
);

-- Table: Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  clinic_id TEXT,
  phone TEXT,
  email TEXT,
  commission_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- Table: Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  doctor_id TEXT REFERENCES doctors(id),
  clinic_id TEXT REFERENCES clinics(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  type TEXT DEFAULT 'consultation',
  notes TEXT
);

-- Table: Pharmacy Items (Inventory)
CREATE TABLE IF NOT EXISTS pharmacy_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  category TEXT,
  unit TEXT,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  expiry_date DATE,
  price NUMERIC NOT NULL,
  batch_number TEXT,
  location TEXT
);

-- Table: Lab Tests (Orders/Results)
CREATE TABLE IF NOT EXISTS lab_tests (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  doctor_id TEXT REFERENCES doctors(id),
  test_type_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, sampling, processing, completed
  results TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Clinical Visits (EMR)
CREATE TABLE IF NOT EXISTS clinical_visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  doctor_id TEXT REFERENCES doctors(id),
  clinic_id TEXT REFERENCES clinics(id),
  chief_complaint TEXT,
  diagnosis TEXT,
  notes TEXT,
  vitals JSONB DEFAULT '{}',
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  visit_id TEXT REFERENCES clinical_visits(id),
  patient_id TEXT REFERENCES patients(id),
  doctor_id TEXT REFERENCES doctors(id),
  medicines JSONB NOT NULL DEFAULT '[]', -- [{id, name, dose, frequency, duration}]
  status TEXT DEFAULT 'pending', -- pending, dispensed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all tables (Basic security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_items ENABLE ROW LEVEL SECURITY;

-- Simple Policy (Allow all for now - Harden this later)
CREATE POLICY "Allow authenticated full access" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON patients FOR ALL TO authenticated USING (true);
-- ... similar policies for other tables
