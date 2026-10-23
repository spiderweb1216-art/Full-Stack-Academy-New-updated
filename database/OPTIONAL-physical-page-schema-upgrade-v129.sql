-- OPTIONAL upgrade of the existing physical_course_pages table from your uploaded SQL dump.
-- It has page_json and is missing sections_json.
-- This is NOT REQUIRED if you install both v129 PHP replacement files.
-- Back up your database before running. Select full_stack_academy in phpMyAdmin.
-- Nothing is deleted. All legacy page_json, published and revision data remain.

ALTER TABLE `physical_course_pages`
  ADD COLUMN IF NOT EXISTS `sections_json` LONGTEXT NULL;

-- Copy the existing page sections into the new field only when that field is empty.
-- Older widgets are converted on read by the v129 PHP compatibility layer.
UPDATE `physical_course_pages`
SET `sections_json` = JSON_EXTRACT(`page_json`, '$.sections')
WHERE (`sections_json` IS NULL OR `sections_json` = '')
  AND JSON_VALID(`page_json`) = 1
  AND JSON_TYPE(JSON_EXTRACT(`page_json`, '$.sections')) = 'ARRAY';

SELECT `course_id`,
       IF(`sections_json` IS NULL, 'not migrated', 'sections available') AS migration_status,
       LENGTH(`sections_json`) AS sections_bytes
FROM `physical_course_pages`;
