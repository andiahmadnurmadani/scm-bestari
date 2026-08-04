-- ============================================================
--  Sorgum SCM - Inisialisasi Database MySQL
--  Database : sorgum_scm
--  Catatan  : Server backend akan auto-create database & tabel
--             ini saat pertama kali dijalankan (src/config/db.js).
--             Skrip ini hanya dokumentasi / fallback manual.
-- ============================================================

CREATE DATABASE IF NOT EXISTS sorgum_scm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sorgum_scm;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Anggota KWT',
  avatar VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS harvests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kode_panen VARCHAR(50) NOT NULL UNIQUE,
  nama_lahan VARCHAR(200) NOT NULL,
  varietas VARCHAR(100) NOT NULL,
  tanggal_panen DATE NOT NULL,
  jumlah_hasil_kg DECIMAL(12,2) NOT NULL DEFAULT 0,
  kualitas_grade ENUM('Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)') NOT NULL DEFAULT 'Grade A (Premium)',
  petani_penanggung_jawab VARCHAR(200) NOT NULL,
  status ENUM('Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang') NOT NULL DEFAULT 'Selesai',
  catatan TEXT NULL,
  foto_url LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
