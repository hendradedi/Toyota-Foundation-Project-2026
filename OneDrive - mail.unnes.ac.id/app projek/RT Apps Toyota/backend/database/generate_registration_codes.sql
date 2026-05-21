-- Script untuk generate registration code untuk RT yang sudah ada
-- Jalankan script ini di PostgreSQL untuk menambahkan kode pendaftaran ke RT yang sudah ada

-- Update semua RT yang belum punya registration code
UPDATE neighborhoods 
SET 
  registration_code = 'RT' || (
    SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (random() * 36)::int + 1, 1), '')
    FROM generate_series(1, 6)
  ),
  registration_code_generated_at = NOW()
WHERE registration_code IS NULL 
  AND is_active = true;

-- Verifikasi hasil
SELECT 
  id,
  name,
  type,
  registration_code,
  registration_code_generated_at,
  is_active
FROM neighborhoods
WHERE registration_code IS NOT NULL
ORDER BY created_at DESC;

-- Hitung total RT dengan registration code
SELECT 
  COUNT(*) as total_with_code,
  COUNT(*) FILTER (WHERE registration_code IS NOT NULL) as with_code,
  COUNT(*) FILTER (WHERE registration_code IS NULL) as without_code
FROM neighborhoods;
