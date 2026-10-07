<?php
declare(strict_types=1);

// SECURITY: this repair utility can run only from PHP CLI, never through a browser.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("This utility may only be run from the command line.\n");
}

$configFile = __DIR__ . '/api/config/database.php';
if (!is_file($configFile)) {
    fwrite(STDERR, "ERROR: api/config/database.php was not found.\n");
    exit(1);
}

$config = require $configFile;
if (!is_array($config)) {
    fwrite(STDERR, "ERROR: database.php is invalid.\n");
    exit(1);
}

$host = (string)($config['host'] ?? '127.0.0.1');
$port = (int)($config['port'] ?? 3306);
$db = (string)($config['database'] ?? 'full_stack_academy');
$dbUser = (string)($config['username'] ?? 'root');
$dbPass = (string)($config['password'] ?? '');
$charset = (string)($config['charset'] ?? 'utf8mb4');

$preferredEmail = 'admin@fullstackacademy.in';
$fallbackEmail = 'admin.local@fullstackacademy.in';
$newPassword = 'FSAadmin@2026';
$adminName = 'Academy Administrator';

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$db};charset={$charset}",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $pdo->query('SELECT 1 FROM users LIMIT 1');
    $hasMustChange = (bool)$pdo->query("SHOW COLUMNS FROM users LIKE 'must_change_password'")->fetch();
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

    $findByEmail = $pdo->prepare('SELECT id,email,role FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1');
    $findByEmail->execute([$preferredEmail]);
    $preferredAccount = $findByEmail->fetch() ?: null;
    $existingAdmin = $pdo->query("SELECT id,email,role FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1")->fetch() ?: null;

    $pdo->beginTransaction();
    try {
        $loginEmail = $preferredEmail;
        $adminId = 0;

        if ($preferredAccount && ($preferredAccount['role'] ?? '') === 'admin') {
            // Best case: the expected administrator already exists.
            $adminId = (int)$preferredAccount['id'];
        } elseif ($existingAdmin) {
            // Preserve the existing administrator. Only move it to the preferred email
            // when that email is not already owned by another user.
            $adminId = (int)$existingAdmin['id'];
            if (!$preferredAccount) {
                $pdo->prepare('UPDATE users SET email=? WHERE id=?')->execute([$preferredEmail, $adminId]);
                $loginEmail = $preferredEmail;
            } else {
                $loginEmail = (string)$existingAdmin['email'];
            }
        } else {
            // No administrator exists. Never convert a student/instructor into admin.
            // If the preferred email is occupied, use a dedicated fallback admin email.
            $loginEmail = $preferredAccount ? $fallbackEmail : $preferredEmail;
            $fallbackCheck = $pdo->prepare('SELECT id FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1');
            $fallbackCheck->execute([$loginEmail]);
            if ($fallbackCheck->fetchColumn()) {
                throw new RuntimeException('No safe unused email is available for the repair administrator.');
            }
            if ($hasMustChange) {
                $stmt = $pdo->prepare("INSERT INTO users (name,email,phone,password_hash,role,status,headline,country,must_change_password) VALUES (?,?,?,?,'admin','active','System Administrator','India',0)");
            } else {
                $stmt = $pdo->prepare("INSERT INTO users (name,email,phone,password_hash,role,status,headline,country) VALUES (?,?,?,?,'admin','active','System Administrator','India')");
            }
            $stmt->execute([$adminName, $loginEmail, '', $hash]);
            $adminId = (int)$pdo->lastInsertId();
        }

        if ($adminId > 0 && !(!$existingAdmin && (!$preferredAccount || ($preferredAccount['role'] ?? '') !== 'admin'))) {
            $sql = "UPDATE users SET password_hash=?, role='admin', status='active'";
            if ($hasMustChange) $sql .= ', must_change_password=0';
            $sql .= ' WHERE id=?';
            $pdo->prepare($sql)->execute([$hash, $adminId]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    echo "\nADMIN LOGIN REPAIRED SUCCESSFULLY\n";
    echo "---------------------------------\n";
    echo "Email:    {$loginEmail}\n";
    echo "Password: {$newPassword}\n";
    echo "Status:   active\n";
    echo "Role:     admin\n\n";
    echo "Open: http://127.0.0.1:8000/admin/\n\n";
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "\nADMIN LOGIN REPAIR FAILED\n");
    fwrite(STDERR, "Reason: " . $e->getMessage() . "\n\n");
    fwrite(STDERR, "Make sure XAMPP MySQL is running and api/config/database.php matches your database.\n");
    exit(1);
}
