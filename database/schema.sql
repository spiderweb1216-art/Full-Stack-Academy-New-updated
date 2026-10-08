SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(40) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','super_admin','admin_staff','branch_head','branch_admin','instructor','student') NOT NULL DEFAULT 'student',
  status ENUM('active','pending','blocked') NOT NULL DEFAULT 'active',
  headline VARCHAR(160) DEFAULT 'Full Stack Academy Learner',
  bio TEXT NULL,
  city VARCHAR(100) DEFAULT '',
  country VARCHAR(100) DEFAULT 'India',
  avatar_url TEXT NULL,
  weekly_goal TINYINT UNSIGNED NOT NULL DEFAULT 5,
  notifications TINYINT(1) NOT NULL DEFAULT 1,
  student_code VARCHAR(40) NULL UNIQUE,
  branch VARCHAR(120) DEFAULT '',
  public_slug VARCHAR(190) NULL UNIQUE,
  profile_public TINYINT(1) NOT NULL DEFAULT 1,
  skills_json JSON NULL,
  instructor_id BIGINT UNSIGNED NULL,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  reset_token_hash CHAR(64) NULL,
  reset_expires_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status (role, status),
  INDEX idx_users_instructor (instructor_id),
  INDEX idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_migrations (
  migration_key VARCHAR(120) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_code_sequences (
  sequence_key VARCHAR(40) PRIMARY KEY,
  current_value BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  issuer VARCHAR(190) DEFAULT 'Full Stack Academy',
  credential_id VARCHAR(100) DEFAULT '',
  issued_on DATE NULL,
  expires_on DATE NULL,
  certificate_url TEXT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  submitted_by BIGINT UNSIGNED NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  review_note VARCHAR(500) DEFAULT '',
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cert_submitter FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cert_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_cert_user_status (user_id,status),
  INDEX idx_cert_status_created (status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profile_change_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  instructor_id BIGINT UNSIGNED NOT NULL,
  payload_json JSON NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  review_note VARCHAR(500) DEFAULT '',
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_request_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_profile_request_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_profile_request_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_profile_request_status (status,created_at),
  INDEX idx_profile_request_instructor (instructor_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS branches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  short_name VARCHAR(120) NOT NULL DEFAULT '',
  location VARCHAR(190) NOT NULL DEFAULT '',
  address VARCHAR(500) NOT NULL DEFAULT '',
  phone VARCHAR(60) NOT NULL DEFAULT '',
  extension VARCHAR(80) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL DEFAULT '',
  hours VARCHAR(190) NOT NULL DEFAULT '',
  description TEXT NULL,
  image TEXT NULL,
  hero_image TEXT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  gallery_json JSON NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_branches_status_sort (status,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  title VARCHAR(190) NOT NULL,
  category VARCHAR(120) NOT NULL,
  badge VARCHAR(60) DEFAULT '',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  image TEXT NULL,
  short_description TEXT NULL,
  description MEDIUMTEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  duration VARCHAR(80) DEFAULT '',
  hours INT UNSIGNED NOT NULL DEFAULT 0,
  lessons_count INT UNSIGNED NOT NULL DEFAULT 0,
  projects INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  reviews_count INT UNSIGNED NOT NULL DEFAULT 0,
  students_count INT UNSIGNED NOT NULL DEFAULT 0,
  level VARCHAR(100) DEFAULT 'Beginner',
  language VARCHAR(100) DEFAULT 'English',
  updated_label VARCHAR(80) DEFAULT '',
  instructor VARCHAR(150) DEFAULT 'FSA Faculty',
  instructor_role VARCHAR(180) DEFAULT '',
  instructor_user_id BIGINT UNSIGNED NULL,
  visibility ENUM('public','private') NOT NULL DEFAULT 'public',
  skills_json JSON NULL,
  requirements_json JSON NULL,
  audience_json JSON NULL,
  modules_json JSON NULL,
  projects_json JSON NULL,
  course_reviews_json JSON NULL,
  delivery_mode ENUM('offline','live','recorded') NOT NULL DEFAULT 'offline',
  delivery_modes_json LONGTEXT NULL,
  mode_contents_json LONGTEXT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_status_featured (status, featured),
  INDEX idx_courses_category (category),
  INDEX idx_courses_instructor (instructor_user_id),
  INDEX idx_courses_visibility_status (visibility,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NULL,
  course_name VARCHAR(190) NOT NULL,
  course_slug VARCHAR(190) NOT NULL DEFAULT '',
  image TEXT NULL,
  branch_slug VARCHAR(120) NOT NULL DEFAULT 'online',
  branch_name VARCHAR(120) NOT NULL DEFAULT 'Online',
  instructor_id BIGINT UNSIGNED NULL,
  instructor_name VARCHAR(120) NOT NULL DEFAULT '',
  mode ENUM('live-streamed','recorded','offline-classroom') NOT NULL DEFAULT 'live-streamed',
  shift ENUM('morning','afternoon','evening','anytime') NOT NULL DEFAULT 'morning',
  start_date DATE NULL,
  end_date DATE NULL,
  start_label VARCHAR(80) NOT NULL DEFAULT '',
  time_label VARCHAR(120) NOT NULL DEFAULT '',
  days_label VARCHAR(120) NOT NULL DEFAULT '',
  seats_total INT UNSIGNED NULL,
  seats_available INT UNSIGNED NULL,
  fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  classroom VARCHAR(190) NOT NULL DEFAULT '',
  meeting_url TEXT NULL,
  description TEXT NULL,
  status ENUM('published','draft','closed') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_batches_public (status,sort_order,start_date),
  INDEX idx_batches_branch (branch_slug,status),
  INDEX idx_batches_course (course_slug,status),
  CONSTRAINT fk_batches_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_batches_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  monthly_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  yearly_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  period VARCHAR(40) NOT NULL DEFAULT 'subscription',
  popular TINYINT(1) NOT NULL DEFAULT 0,
  features_json JSON NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(40) DEFAULT '',
  country VARCHAR(100) DEFAULT '',
  state VARCHAR(100) DEFAULT '',
  address VARCHAR(255) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  postal VARCHAR(30) DEFAULT '',
  payment_method VARCHAR(50) DEFAULT 'bank',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(40) DEFAULT NULL,
  status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('course','plan') NOT NULL DEFAULT 'course',
  course_id BIGINT UNSIGNED NULL,
  delivery_mode ENUM('offline','live','recorded') NOT NULL DEFAULT 'offline',
  plan_code VARCHAR(80) NULL,
  item_name VARCHAR(190) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  item_meta_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  delivery_mode ENUM('offline','live','recorded') NULL,
  status ENUM('pending','active','completed','cancelled') NOT NULL DEFAULT 'pending',
  access_starts_at DATETIME NULL,
  access_expires_at DATETIME NULL,
  ip_lock_enabled TINYINT(1) NOT NULL DEFAULT 0,
  allowed_ip VARCHAR(45) NOT NULL DEFAULT '',
  last_access_ip VARCHAR(45) NOT NULL DEFAULT '',
  last_access_at DATETIME NULL,
  enrolled_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY uq_enrollment_user_course_mode (user_id, course_id, delivery_mode),
  INDEX idx_enrollments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  lesson_key VARCHAR(40) NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 1,
  completed_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_progress (user_id, course_id, lesson_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS lesson_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  lesson_key VARCHAR(40) NOT NULL,
  note_text MEDIUMTEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_lesson_note (user_id, course_id, lesson_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(50) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  type ENUM('contact','enrollment') NOT NULL DEFAULT 'contact',
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) DEFAULT '',
  subject VARCHAR(190) DEFAULT '',
  course VARCHAR(255) DEFAULT '',
  message TEXT NULL,
  status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inquiries_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  width INT UNSIGNED NOT NULL DEFAULT 0,
  height INT UNSIGNED NOT NULL DEFAULT 0,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_media_file_name (file_name),
  INDEX idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  instructor_id BIGINT UNSIGNED NOT NULL,
  lesson_key VARCHAR(40) NOT NULL DEFAULT '',
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  meeting_id VARCHAR(120) DEFAULT '',
  passcode VARCHAR(120) DEFAULT '',
  join_url TEXT NULL,
  start_url TEXT NULL,
  recording_url TEXT NULL,
  status ENUM('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_live_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_live_course_start (course_id,starts_at),
  INDEX idx_live_instructor (instructor_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_quizzes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  instructor_id BIGINT UNSIGNED NOT NULL,
  lesson_key VARCHAR(40) NOT NULL DEFAULT '',
  sequence_order DECIMAL(10,2) NOT NULL DEFAULT 999.00,
  quiz_type ENUM('checkpoint','final') NOT NULL DEFAULT 'checkpoint',
  can_skip TINYINT(1) NOT NULL DEFAULT 0,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  due_at DATETIME NULL,
  attempts_allowed TINYINT UNSIGNED NOT NULL DEFAULT 1,
  questions_json LONGTEXT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quiz_course_status (course_id,status),
  INDEX idx_quiz_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  answers_json LONGTEXT NULL,
  score DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES course_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_attempt_quiz_user (quiz_id,user_id),
  INDEX idx_attempt_user (user_id,submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT UNSIGNED NOT NULL,
  instructor_id BIGINT UNSIGNED NOT NULL,
  lesson_key VARCHAR(40) NOT NULL DEFAULT '',
  sequence_order DECIMAL(10,2) NOT NULL DEFAULT 999.00,
  title VARCHAR(190) NOT NULL,
  instructions MEDIUMTEXT NULL,
  attachment_url TEXT NULL,
  due_at DATETIME NULL,
  points DECIMAL(10,2) NOT NULL DEFAULT 100,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assignment_course_status (course_id,status),
  INDEX idx_assignment_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assignment_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  submission_text MEDIUMTEXT NULL,
  file_url TEXT NULL,
  status ENUM('submitted','graded') NOT NULL DEFAULT 'submitted',
  grade DECIMAL(10,2) NULL,
  feedback TEXT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  graded_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES course_assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_assignment_student (assignment_id,user_id),
  INDEX idx_submission_user (user_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value LONGTEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS cms_pages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_rule VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  page_title VARCHAR(190) NOT NULL DEFAULT '',
  render_mode ENUM('native','replace') NOT NULL DEFAULT 'native',
  html_code LONGTEXT NULL,
  before_html LONGTEXT NULL,
  after_html LONGTEXT NULL,
  css_code LONGTEXT NULL,
  js_code LONGTEXT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_pages_status (status),
  CONSTRAINT fk_cms_pages_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_snippets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  description TEXT NULL,
  placement ENUM('head','page_before','page_after','body_end') NOT NULL DEFAULT 'page_after',
  route_rules TEXT NULL,
  html_code LONGTEXT NULL,
  css_code LONGTEXT NULL,
  js_code LONGTEXT NULL,
  priority INT NOT NULL DEFAULT 100,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_snippets_enabled_priority (enabled, priority),
  CONSTRAINT fk_cms_snippets_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO cms_pages (route_rule,name,page_title,render_mode,status) VALUES
('/','Home','','native','published'),
('/courses','Courses','','native','published'),
('/course/*','Course Detail','','native','published'),
('/super40-bba','Super40 BBA','','native','published'),
('/batches','Batches','','native','published'),
('/about','About','','native','published'),
('/contact','Contact','','native','published'),
('/branches','Branches','','native','published'),
('/events','Events','','native','published'),
('/event/*','Event Detail','','native','published'),
('/companies','Companies','','native','published'),
('/alumni','Successfully Placed','','native','published'),
('/candidates','Available Candidates','','native','published'),
('/help','Help','','native','published'),
('/terms','Terms','','native','published'),
('/privacy','Privacy','','native','published'),
('/refund','Refund','','native','published');

CREATE TABLE IF NOT EXISTS email_templates (
  template_key VARCHAR(80) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body MEDIUMTEXT NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient VARCHAR(190) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  email_type VARCHAR(80) DEFAULT 'transactional',
  status ENUM('sent','failed','skipped') NOT NULL,
  message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_logs_created (created_at),
  INDEX idx_email_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_auth_token_hash (token_hash),
  INDEX idx_auth_token_user (user_id),
  INDEX idx_auth_token_expiry (expires_at),
  CONSTRAINT fk_auth_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Hiring companies managed from the admin dashboard
CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  logo TEXT NULL, website TEXT NULL, location VARCHAR(190) NOT NULL DEFAULT '', sector VARCHAR(160) NOT NULL DEFAULT '',
  description TEXT NULL, hiring_status VARCHAR(100) NOT NULL DEFAULT 'Hiring Partner', placement_count INT UNSIGNED NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0, status ENUM('published','draft') NOT NULL DEFAULT 'published', sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_status_sort (status,featured,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS alumni (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  image TEXT NULL,
  course VARCHAR(190) NOT NULL DEFAULT '',
  role_title VARCHAR(190) NOT NULL DEFAULT '',
  company VARCHAR(190) NOT NULL DEFAULT '',
  salary VARCHAR(80) NOT NULL DEFAULT '',
  location VARCHAR(190) NOT NULL DEFAULT '',
  graduation_year VARCHAR(20) NOT NULL DEFAULT '',
  quote TEXT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_seekers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  image TEXT NULL,
  course VARCHAR(190) NOT NULL DEFAULT '',
  skills_json JSON NULL,
  experience VARCHAR(120) NOT NULL DEFAULT 'Fresher',
  location VARCHAR(190) NOT NULL DEFAULT 'Hyderabad',
  availability VARCHAR(120) NOT NULL DEFAULT 'Available',
  email VARCHAR(190) NOT NULL DEFAULT '',
  phone VARCHAR(60) NOT NULL DEFAULT '',
  summary TEXT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Public events managed from Admin -> Events
CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'Academy Event',
  event_date DATE NULL,
  end_date DATE NULL,
  time_label VARCHAR(160) NOT NULL DEFAULT '',
  location VARCHAR(190) NOT NULL DEFAULT '',
  address VARCHAR(500) NOT NULL DEFAULT '',
  image TEXT NULL,
  description TEXT NULL,
  registration_url TEXT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  tags_json JSON NULL,
  media_json JSON NULL,
  agenda_json JSON NULL,
  highlights_json JSON NULL,
  organiser_json JSON NULL,
  sponsors_json JSON NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_public (status,featured,sort_order,event_date),
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Public written and video reviews managed from Admin -> Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_type ENUM('written','video') NOT NULL DEFAULT 'written',
  name VARCHAR(190) NOT NULL,
  avatar TEXT NULL,
  course_label VARCHAR(190) NOT NULL DEFAULT '',
  role_label VARCHAR(190) NOT NULL DEFAULT '',
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  review_text TEXT NULL,
  video_url TEXT NULL,
  thumbnail TEXT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reviews_public (status,review_type,featured,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- V43 unified student management
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  father_name VARCHAR(190) NOT NULL DEFAULT '',
  dob DATE NULL,
  cnic VARCHAR(40) NOT NULL DEFAULT '',
  image TEXT NULL,
  course_id BIGINT UNSIGNED NULL,
  batch_id BIGINT UNSIGNED NULL,
  fee_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  fee_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  academic_status ENUM('studying','completed','on_hold','inactive') NOT NULL DEFAULT 'studying',
  is_alumni TINYINT(1) NOT NULL DEFAULT 0,
  is_job_seeker TINYINT(1) NOT NULL DEFAULT 0,
  alumni_role VARCHAR(190) NOT NULL DEFAULT '',
  alumni_company VARCHAR(190) NOT NULL DEFAULT '',
  alumni_salary VARCHAR(80) NOT NULL DEFAULT '',
  alumni_location VARCHAR(190) NOT NULL DEFAULT '',
  alumni_graduation_year VARCHAR(20) NOT NULL DEFAULT '',
  alumni_quote TEXT NULL,
  job_skills_json LONGTEXT NULL,
  job_experience VARCHAR(120) NOT NULL DEFAULT 'Fresher',
  job_location VARCHAR(190) NOT NULL DEFAULT 'Hyderabad',
  job_availability VARCHAR(120) NOT NULL DEFAULT 'Available',
  job_summary TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
