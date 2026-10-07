<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$configFile = $root . '/api/config/database.php';
$lockFile = $root . '/api/config/install.lock';
$errors = [];
$success = false;

function e(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function post(string $key, string $default = ''): string { return trim((string)($_POST[$key] ?? $default)); }
function splitSql(string $sql): array
{
    $statements = [];
    $buffer = '';
    foreach (preg_split('/\R/', $sql) ?: [] as $line) {
        $trim = trim($line);
        if ($trim === '' || str_starts_with($trim, '--') || str_starts_with($trim, '#')) continue;
        $buffer .= $line . "\n";
        if (str_ends_with(rtrim($line), ';')) {
            $statements[] = trim($buffer);
            $buffer = '';
        }
    }
    if (trim($buffer) !== '') $statements[] = trim($buffer);
    return $statements;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !is_file($lockFile)) {
    if (!extension_loaded('pdo_mysql')) $errors[] = 'The PDO MySQL PHP extension is not enabled. In XAMPP, enable extension=pdo_mysql in php.ini and restart PHP.';
    $host = post('host', '127.0.0.1');
    $port = max(1, (int)post('port', '3306'));
    $database = post('database', 'full_stack_academy');
    $username = post('username', 'root');
    $password = (string)($_POST['password'] ?? '');
    $adminName = post('admin_name', 'Academy Administrator');
    $adminEmail = strtolower(post('admin_email', 'admin@fullstackacademy.in'));
    $adminPassword = (string)($_POST['admin_password'] ?? '');

    if (!preg_match('/^[A-Za-z0-9_]+$/', $database)) $errors[] = 'Database name may contain only letters, numbers and underscores.';
    if ($adminName === '') $errors[] = 'Enter the administrator name.';
    if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid administrator email.';
    if (strlen($adminPassword) < 8) $errors[] = 'Administrator password must contain at least 8 characters.';
    if (!is_writable($root . '/api/config')) $errors[] = 'The api/config folder is not writable.';

    if (!$errors) {
        try {
            $serverDsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $server = new PDO($serverDsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            try {
                $server->exec('CREATE DATABASE IF NOT EXISTS `' . $database . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            } catch (Throwable $createError) {
                // Shared hosting often disallows CREATE DATABASE. Continue and connect to the database created in the hosting panel.
            }

            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            $schema = file_get_contents($root . '/database/schema.sql');
            if ($schema === false) throw new RuntimeException('Unable to read database/schema.sql.');
            foreach (splitSql($schema) as $statement) $pdo->exec($statement);

            $pdo->beginTransaction();
            try {
                $adminStmt = $pdo->prepare("INSERT INTO users (name,email,phone,password_hash,role,status,headline,country,must_change_password) VALUES (?,?,?,?, 'admin','active','System Administrator','India',1) ON DUPLICATE KEY UPDATE role='admin', status='active'");
                $adminStmt->execute([$adminName, $adminEmail, '', password_hash($adminPassword, PASSWORD_DEFAULT)]);

                $seed = json_decode((string)file_get_contents($root . '/database/seed-data.json'), true, 512, JSON_THROW_ON_ERROR);
                $courseStmt = $pdo->prepare("INSERT INTO courses (id,slug,title,category,badge,featured,image,short_description,description,price,original_price,duration,hours,lessons_count,projects,rating,reviews_count,students_count,level,language,updated_label,instructor,instructor_role,skills_json,requirements_json,audience_json,modules_json,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'published') ON DUPLICATE KEY UPDATE id=id");
                foreach (($seed['courses'] ?? []) as $course) {
                    $courseStmt->execute([
                        $course['id'] ?? null, $course['slug'], $course['title'], $course['category'], $course['badge'] ?? '', !empty($course['featured']) ? 1 : 0,
                        $course['image'] ?? '', $course['short'] ?? '', $course['description'] ?? '', $course['price'] ?? 0, $course['originalPrice'] ?? 0,
                        $course['duration'] ?? '', $course['hours'] ?? 0, $course['lessons'] ?? 0, $course['projects'] ?? 0, $course['rating'] ?? 0,
                        $course['reviews'] ?? 0, $course['students'] ?? 0, $course['level'] ?? '', $course['language'] ?? '', $course['updated'] ?? '',
                        $course['instructor'] ?? 'FSA Faculty', $course['instructorRole'] ?? '', json_encode($course['skills'] ?? [], JSON_UNESCAPED_UNICODE),
                        json_encode($course['requirements'] ?? [], JSON_UNESCAPED_UNICODE), json_encode($course['audience'] ?? [], JSON_UNESCAPED_UNICODE),
                        json_encode($course['modules'] ?? [], JSON_UNESCAPED_UNICODE),
                    ]);
                }

                $planStmt = $pdo->prepare("INSERT INTO plans (id,name,description,monthly_price,yearly_price,period,popular,features_json,status) VALUES (?,?,?,?,?,?,?,?,'published') ON DUPLICATE KEY UPDATE id=id");
                foreach (($seed['plans'] ?? []) as $plan) {
                    $planStmt->execute([$plan['id'], $plan['name'], $plan['description'] ?? '', $plan['monthly'] ?? 0, $plan['yearly'] ?? 0, $plan['period'] ?? 'subscription', !empty($plan['popular']) ? 1 : 0, json_encode($plan['features'] ?? [], JSON_UNESCAPED_UNICODE)]);
                }

                $settings = [
                    'site' => [
                        'academy_name' => 'Full Stack Academy',
                        'academy_tagline' => 'Learning Platform',
                        'footer_text' => 'Career-focused technology learning with practical projects, structured pathways and expert guidance.',
                        'announcement_text' => 'New AI and Web Development batches are now open.',
                        'site_url' => '',
                        'support_email' => 'info@fullstackacademy.in',
                        'support_phone' => '+91 9015 236 236',
                        'currency_symbol' => '₹',
                        'locale' => 'en-IN',
                        'timezone' => 'Asia/Kolkata',
                        'registration_enabled' => true,
                        'email_notifications' => true,
                    ],
                    'smtp' => [
                        'enabled' => false, 'host' => '', 'port' => 587, 'encryption' => 'tls', 'username' => '',
                        'password_encrypted' => '', 'from_email' => 'info@fullstackacademy.in', 'from_name' => 'Full Stack Academy', 'timeout' => 15,
                    ],
                ];
                $settingStmt = $pdo->prepare("INSERT INTO settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_key=setting_key");
                foreach ($settings as $key => $value) $settingStmt->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);

                $templates = [
                    ['welcome','Welcome Email','Welcome to Full Stack Academy','<p>Hello <strong>{{name}}</strong>,</p><p>Your learner account has been created successfully. You can now sign in and manage your courses from the student dashboard.</p>'],
                    ['password_reset','Password Reset','Reset your Full Stack Academy password','<p>Hello <strong>{{name}}</strong>,</p><p><a href="{{reset_link}}">Reset your password</a>. This link expires in 60 minutes.</p>'],
                    ['order_received','Order Received','We received your course order','<p>Hello <strong>{{name}}</strong>,</p><p>Your order <strong>{{order}}</strong> for <strong>{{course}}</strong> has been received. We will confirm payment and activate your course.</p>'],
                    ['enrollment_active','Enrollment Active','Your course is now active','<p>Hello <strong>{{name}}</strong>,</p><p>Your enrollment in <strong>{{course}}</strong> is active. Sign in to your student dashboard to begin learning.</p>'],
                    ['contact_ack','Contact Acknowledgement','Your message has been received','<p>Hello <strong>{{name}}</strong>,</p><p>Thank you for contacting Full Stack Academy. Our team will respond as soon as possible.</p>'],
                ];
                $templateStmt = $pdo->prepare("INSERT INTO email_templates (template_key,name,subject,body,enabled) VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE template_key=template_key");
                foreach ($templates as $template) $templateStmt->execute($template);

                $pdo->commit();
            } catch (Throwable $transactionError) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                throw $transactionError;
            }

            $config = "<?php\nreturn " . var_export([
                'host' => $host, 'port' => $port, 'database' => $database, 'username' => $username,
                'password' => $password, 'charset' => 'utf8mb4',
            ], true) . ";\n";
            if (file_put_contents($configFile, $config, LOCK_EX) === false) throw new RuntimeException('Unable to write api/config/database.php.');
            $keyFile = $root . '/api/config/app-key.php';
            if (!is_file($keyFile)) {
                $keyContent = "<?php\nreturn '" . bin2hex(random_bytes(32)) . "';\n";
                if (file_put_contents($keyFile, $keyContent, LOCK_EX) === false) throw new RuntimeException('Unable to create the application encryption key.');
            }
            if (file_put_contents($lockFile, 'Installed ' . date('c') . PHP_EOL, LOCK_EX) === false) throw new RuntimeException('Unable to create installation lock.');
            $success = true;
        } catch (Throwable $error) {
            $errors[] = $error->getMessage();
        }
    }
}

$alreadyInstalled = is_file($configFile) && is_file($lockFile);
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Install Full Stack Academy</title>
<style>
:root{font-family:Inter,Arial,sans-serif;color:#28181b;background:#f8f3f4}*{box-sizing:border-box}body{margin:0;padding:32px}.wrap{max-width:900px;margin:auto}.card{background:#fff;border:1px solid #eadbde;border-radius:22px;padding:30px;box-shadow:0 20px 55px rgba(70,20,28,.08)}h1{font-size:34px;margin:0 0 8px}p{color:#735e62;line-height:1.6}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}label{font-weight:700;font-size:14px;display:grid;gap:7px}input{width:100%;padding:13px 14px;border:1px solid #d9c7ca;border-radius:10px;font:inherit}.full{grid-column:1/-1}.button{border:0;background:#7e1721;color:#fff;padding:14px 20px;border-radius:10px;font-weight:800;cursor:pointer}.notice{padding:15px 17px;border-radius:12px;margin:18px 0;background:#fff4d8;color:#694b00}.error{background:#fff0f1;color:#8b1924}.success{background:#eaf8ed;color:#155c2a}.links{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.links a{color:#7e1721;font-weight:800}@media(max-width:650px){body{padding:15px}.grid{grid-template-columns:1fr}.full{grid-column:auto}}
</style></head><body><main class="wrap"><section class="card"><p><strong>Full Stack Academy LMS</strong></p><h1>MySQL Installation</h1><p>This installer creates the database tables, imports the course catalogue and creates the first administrator account.</p>
<?php if ($success): ?><div class="notice success"><strong>Installation completed.</strong><br>The MySQL database, courses and administrator account are ready.</div><div class="links"><a href="../">Open Website</a><a href="../admin/">Open Admin Dashboard</a></div>
<?php elseif ($alreadyInstalled): ?><div class="notice success"><strong>The website is already installed.</strong><br>To reinstall, delete <code>api/config/install.lock</code> and <code>api/config/database.php</code> first.</div><div class="links"><a href="../">Open Website</a><a href="../admin/">Open Admin Dashboard</a></div>
<?php else: ?>
<?php foreach ($errors as $error): ?><div class="notice error"><?= e($error) ?></div><?php endforeach; ?>
<form method="post" class="grid" autocomplete="off">
<label>Database host<input name="host" value="<?= e(post('host','127.0.0.1')) ?>" required></label><label>Port<input name="port" type="number" value="<?= e(post('port','3306')) ?>" required></label>
<label>Database name<input name="database" value="<?= e(post('database','full_stack_academy')) ?>" required></label><label>Database username<input name="username" value="<?= e(post('username','root')) ?>" required></label>
<label class="full">Database password<input name="password" type="password" value=""></label>
<label>Administrator name<input name="admin_name" value="<?= e(post('admin_name','Academy Administrator')) ?>" required></label><label>Administrator email<input name="admin_email" type="email" value="<?= e(post('admin_email','admin@fullstackacademy.in')) ?>" required></label>
<label class="full">Administrator password<input name="admin_password" type="password" minlength="8" value="<?= e(post('admin_password','FSAadmin@2026')) ?>" required></label>
<div class="full notice"><strong>XAMPP defaults:</strong> host 127.0.0.1, database full_stack_academy, username root, blank database password.<br><strong>Hostinger:</strong> first create a MySQL database in hPanel, then enter its host, database name, username and password here.</div>
<div class="full"><button class="button" type="submit">Install MySQL Database</button></div>
</form><?php endif; ?></section></main></body></html>
