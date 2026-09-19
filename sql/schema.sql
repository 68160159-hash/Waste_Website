-- sql/schema.sql
-- Database Schema for Bangsaen Waste Management System
-- Compatible with MariaDB 10.4+

CREATE DATABASE IF NOT EXISTS bangsaen_waste
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE bangsaen_waste;

-- Table: waste_stats
-- Stores historical waste management statistics from open data (waste_chonburi.csv)
CREATE TABLE waste_stats (
    year INT NOT NULL,
    district VARCHAR(100) NOT NULL,
    local_gov VARCHAR(100) NOT NULL,
    generated_tpd DECIMAL(10,2) NULL,
    collected_tpd DECIMAL(10,2) NULL,
    utilized_tpd DECIMAL(10,2) NULL,
    proper_tpd DECIMAL(10,2) NULL,
    improper_tpd DECIMAL(10,2) NULL,
    PRIMARY KEY (year, district, local_gov)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reports
-- Stores user-generated waste issue reports
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    waste_type ENUM('general', 'recyclable', 'hazardous', 'organic') NOT NULL,
    amount_kg INT NOT NULL,
    detail VARCHAR(500),
    status ENUM('new', 'in_progress', 'done') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data for reports table (Bangsaen area locations)
INSERT INTO reports (location, waste_type, amount_kg, detail, status) VALUES
('หาดบางแสน บริเวณวงเวียนปลาโลมา', 'general', 15, 'ขยะพลาสติกและโฟมตกค้างบริเวณจุดชมวิวหลังน้ำลง', 'new'),
('ถนนคนเดินบางแสน ซอย 3', 'recyclable', 8, 'ขวดแก้วและกระป๋องเครื่องดื่มสะสมข้างถังขยะล้น', 'in_progress'),
('ท่าเรืออ่างศิลา-เกาะสีชัง (ฝั่งบางแสน)', 'hazardous', 3, 'พบซากแบตเตอรี่และอุปกรณ์อิเล็กทรอนิกส์ถูกทิ้งปะปนขยะทั่วไป', 'done');