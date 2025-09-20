-- Insert default settings
INSERT INTO "Settings" ("key", "value", "description") VALUES
('voting_enabled', 'true', 'Enable or disable voting system'),
('registration_enabled', 'true', 'Enable or disable user registration'),
('voting_start_date', '2024-03-01T00:00:00Z', 'Voting start date and time'),
('voting_end_date', '2024-03-31T23:59:59Z', 'Voting end date and time'),
('qr_expiry_minutes', '15', 'QR code expiry time in minutes'),
('max_votes_per_user', '1', 'Maximum votes allowed per user');

-- Insert sample candidates
INSERT INTO "Candidate" ("name", "nim", "prodi", "visi", "misi", "photo") VALUES
('Ahmad Rizki Pratama', '121450001', 'Teknik Informatika', 
 'Mewujudkan ITERA yang lebih maju, inovatif, dan berprestasi dengan mengedepankan kolaborasi antar mahasiswa dari berbagai fakultas.',
 'Meningkatkan fasilitas kampus, mengoptimalkan program kemahasiswaan, dan memperkuat hubungan dengan industri untuk mempersiapkan mahasiswa menghadapi dunia kerja.',
 '/placeholder.svg?height=400&width=400'),

('Sari Indah Permata', '121450002', 'Teknik Sipil',
 'Membangun ITERA yang inklusif, berkelanjutan, dan berdaya saing tinggi melalui pemberdayaan potensi mahasiswa di segala bidang.',
 'Mengembangkan program kewirausahaan mahasiswa, meningkatkan kualitas organisasi kemahasiswaan, dan memperkuat jaringan alumni untuk mendukung karir mahasiswa.',
 '/placeholder.svg?height=400&width=400'),

('Muhammad Fajar Sidiq', '121450003', 'Teknik Elektro',
 'Menciptakan ekosistem kampus yang mendukung inovasi, kreativitas, dan pengembangan soft skills mahasiswa untuk menghadapi era digital.',
 'Digitalisasi layanan kemahasiswaan, pengembangan program magang dan pertukaran mahasiswa, serta peningkatan kualitas kegiatan ekstrakurikuler.',
 '/placeholder.svg?height=400&width=400');

-- Insert sample users (admin and super admin) with passwords
-- Passwords: superadmin123, admin123, admin123
INSERT INTO "User" ("email", "nim", "name", "prodi", "gender", "phone", "role", "password") VALUES
('superadmin@itera.ac.id', '999999999', 'Super Administrator', 'Sistem Informasi', 'L', '081234567890', 'SUPER_ADMIN', 'superadmin123'),
('admin1@itera.ac.id', '888888888', 'Admin Panitia 1', 'Teknik Informatika', 'P', '081234567891', 'ADMIN', 'admin123'),
('admin2@itera.ac.id', '777777777', 'Admin Panitia 2', 'Teknik Sipil', 'L', '081234567892', 'ADMIN', 'admin123');

-- Insert sample voters for testing with password information
-- Passwords: mahasiswa123 for all student accounts
INSERT INTO "User" ("email", "nim", "name", "prodi", "gender", "phone", "role", "password") VALUES
('mahasiswa1@student.itera.ac.id', '121450100', 'Budi Santoso', 'Teknik Informatika', 'L', '081234567893', 'VOTER', 'mahasiswa123'),
('mahasiswa2@student.itera.ac.id', '121450101', 'Siti Nurhaliza', 'Teknik Sipil', 'P', '081234567894', 'VOTER', 'mahasiswa123'),
('mahasiswa3@student.itera.ac.id', '121450102', 'Andi Wijaya', 'Teknik Elektro', 'L', '081234567895', 'VOTER', 'mahasiswa123'),
('mahasiswa4@student.itera.ac.id', '121450103', 'Maya Sari', 'Teknik Kimia', 'P', '081234567896', 'VOTER', 'mahasiswa123'),
('mahasiswa5@student.itera.ac.id', '121450104', 'Reza Pratama', 'Teknik Mesin', 'L', '081234567897', 'VOTER', 'mahasiswa123');

-- TEST ACCOUNTS AND PASSWORDS:

-- SUPER ADMIN:
-- - Email: superadmin@itera.ac.id
-- - Password: superadmin123

-- ADMIN ACCOUNTS:
-- - Email: admin1@itera.ac.id, Password: admin123
-- - Email: admin2@itera.ac.id, Password: admin123

-- STUDENT ACCOUNTS:
-- - Email: mahasiswa1@student.itera.ac.id, Password: mahasiswa123
-- - Email: mahasiswa2@student.itera.ac.id, Password: mahasiswa123
-- - Email: mahasiswa3@student.itera.ac.id, Password: mahasiswa123
-- - Email: mahasiswa4@student.itera.ac.id, Password: mahasiswa123
-- - Email: mahasiswa5@student.itera.ac.id, Password: mahasiswa123
