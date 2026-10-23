CREATE TABLE IF NOT EXISTS student_auth_limits (
 identity_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
 first_attempt_at DATETIME NOT NULL,
 locked_until DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
