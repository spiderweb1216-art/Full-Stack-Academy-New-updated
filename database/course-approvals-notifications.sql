-- MySQL / MariaDB idempotent LMS migration. Run this before replacing the PHP files.
-- Back up the courses table and database before importing.
SET @missing := (SELECT COUNT(*)=0 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='courses' AND COLUMN_NAME='public_approval_status');
SET @ddl := IF(@missing, "ALTER TABLE courses ADD COLUMN public_approval_status ENUM('approved','pending','rejected') NOT NULL DEFAULT 'approved'", "SELECT 1");
PREPARE lms_stmt FROM @ddl;
EXECUTE lms_stmt;
DEALLOCATE PREPARE lms_stmt;

SET @missing := (SELECT COUNT(*)=0 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='courses' AND COLUMN_NAME='public_approval_note');
SET @ddl := IF(@missing, "ALTER TABLE courses ADD COLUMN public_approval_note TEXT NULL", "SELECT 1");
PREPARE lms_stmt FROM @ddl;
EXECUTE lms_stmt;
DEALLOCATE PREPARE lms_stmt;

SET @missing := (SELECT COUNT(*)=0 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='courses' AND COLUMN_NAME='public_submitted_at');
SET @ddl := IF(@missing, "ALTER TABLE courses ADD COLUMN public_submitted_at DATETIME NULL", "SELECT 1");
PREPARE lms_stmt FROM @ddl;
EXECUTE lms_stmt;
DEALLOCATE PREPARE lms_stmt;

CREATE TABLE IF NOT EXISTS admin_notification_reads (
 user_id BIGINT UNSIGNED NOT NULL,
 notification_key VARCHAR(100) NOT NULL,
 read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (user_id,notification_key),
 CONSTRAINT fk_anr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
