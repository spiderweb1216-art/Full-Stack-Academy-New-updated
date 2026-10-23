CREATE TABLE IF NOT EXISTS social_identities (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL,
 provider VARCHAR(32) NOT NULL,
 provider_subject VARCHAR(255) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY unique_social_provider_subject (provider, provider_subject),
 UNIQUE KEY unique_student_provider (user_id, provider),
 INDEX idx_social_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
