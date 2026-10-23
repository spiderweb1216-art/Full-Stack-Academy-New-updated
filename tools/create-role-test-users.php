<?php
declare(strict_types=1);
/** Local development utility. CLI-only. Creates one test user per LMS role; never updates existing users. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if (!in_array('--confirm-local', $argv, true)) {
    fwrite(STDERR, "Usage: php tools/create-role-test-users.php --confirm-local [--branch=existing-branch-name]\nOnly use on a LOCAL/TEST database. Creates six active accounts.\n");
    exit(2);
}
$root = dirname(__DIR__);
require_once $root . '/api/lib/Database.php';
try {
    $pdo = (new Database($root . '/api/config/database.php'))->pdo();
    $pdo->query('SELECT 1 FROM users LIMIT 1');
    $dbHost = (string)($pdo->query('SELECT @@hostname')->fetchColumn() ?: '');
    $config = require $root . '/api/config/database.php';
    $host = strtolower((string)($config['host'] ?? ''));
    if (!in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
        throw new RuntimeException('Refusing remote database host. This utility is intended for a LOCAL database only.');
    }
    $branchArg = null;
    foreach ($argv as $arg) if (str_starts_with($arg, '--branch=')) $branchArg = trim(substr($arg, 9));
    $branches = $pdo->query("SELECT name FROM branches WHERE status='published' ORDER BY id ASC")->fetchAll(PDO::FETCH_COLUMN);
    if (!$branches) throw new RuntimeException('No published branch exists. Add a branch through the admin dashboard before creating test users.');
    if ($branchArg !== null && $branchArg !== '') {
        $found = false;
        foreach ($branches as $b) if (strcasecmp($b, $branchArg) === 0) { $branch = $b; $found = true; break; }
        if (!$found) throw new RuntimeException('Specified branch not found among published branches.');
    } else $branch = $branches[0];
    $cols = $pdo->query('SHOW COLUMNS FROM users')->fetchAll(PDO::FETCH_COLUMN);
    foreach (['name','email','password_hash','role','status','branch'] as $required) if (!in_array($required,$cols,true)) throw new RuntimeException('Missing required column '.$required);
    $runId = substr(bin2hex(random_bytes(5)),0,10);
    $roles = [
        'super_admin'=>'Super Admin',
        'admin_staff'=>'Admin Staff',
        'branch_head'=>'Branch Head',
        'branch_admin'=>'Branch Admin',
        'instructor'=>'Instructor',
        'student'=>'Student',
    ];
    $results = [];
    $pdo->beginTransaction();
    foreach ($roles as $role=>$label) {
        $pass = bin2hex(random_bytes(12)) . 'Aa!';
        $email = 'test.' . str_replace('_','.', $role) . '.' . $runId . '@example.test';
        $data = [
            'name'=> 'TEST ' . $label,
            'email'=>$email,
            'password_hash'=>password_hash($pass,PASSWORD_DEFAULT),
            'role'=>$role,
            'status'=>'active',
            'branch'=>in_array($role,['super_admin','admin_staff'],true) ? '' : $branch,
        ];
        if (in_array('phone',$cols,true)) $data['phone']='';
        if (in_array('must_change_password',$cols,true)) $data['must_change_password']=0;
        if (in_array('can_record_lectures',$cols,true)) $data['can_record_lectures']=0;
        if ($role==='student') {
            if (in_array('student_code',$cols,true)) $data['student_code']='TEST-'. strtoupper($runId);
            if (in_array('profile_public',$cols,true)) $data['profile_public']=0;
        }
        $keys = array_keys($data);
        $query='INSERT INTO users (`'.implode('`,`',$keys).'`) VALUES ('.implode(',',array_fill(0,count($keys),'?')).')';
        $stmt=$pdo->prepare($query);
        $stmt->execute(array_values($data));
        $results[]=['role'=>$role,'email'=>$email,'password'=>$pass,'branch'=>$data['branch'],'id'=>$pdo->lastInsertId()];
    }
    $pdo->commit();
    echo "\nCREATED SIX LOCAL TEST ACCOUNTS — SAVE THIS OUTPUT SECURELY\n";
    echo "Assigned branch for branch roles: {$branch}\n\n";
    foreach ($results as $r) echo strtoupper($r['role'])."\n  Email: {$r['email']}\n  Password: {$r['password']}\n  DB User ID: {$r['id']}\n\n";
    echo "IMPORTANT: Test only, never publish these credentials. Delete test accounts when done.\n";
} catch(Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "ERROR: ".$e->getMessage()."\n");
    exit(1);
}
