-- Full Stack Academy LMS | Physical / Offline private page storage
-- v128 | NON-DESTRUCTIVE: never drops, truncates, or updates existing data.
-- Select your EXISTING LMS database in phpMyAdmin before running this SQL.
-- If either table already exists, CREATE TABLE IF NOT EXISTS leaves it alone.
-- The standard project schema uses BIGINT UNSIGNED for courses.id/users.id.

CREATE TABLE IF NOT EXISTS `physical_course_pages` (
  `course_id` BIGINT UNSIGNED NOT NULL,
  `sections_json` LONGTEXT NOT NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_id`),
  CONSTRAINT `fk_physical_page_course` FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `physical_course_submissions` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `block_id` VARCHAR(64) NOT NULL,
  `content_hash` CHAR(64) NOT NULL,
  `answer_text` TEXT NOT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `course_id`, `block_id`),
  INDEX `idx_physical_submission_course` (`course_id`),
  CONSTRAINT `fk_physical_submit_course` FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_physical_submit_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Confirm that both tables exist; phpMyAdmin should show both rows.
SHOW TABLES LIKE 'physical_course_pages';
SHOW TABLES LIKE 'physical_course_submissions';
