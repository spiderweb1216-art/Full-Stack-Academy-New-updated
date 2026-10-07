<?php
declare(strict_types=1);

require_once __DIR__ . '/api/lib/Database.php';

function e(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function media_url(string $value): string {
    $value = trim($value);
    if ($value === '') return '';
    if (preg_match('~^(?:https?:)?//~i', $value)) return $value;
    return '/' . ltrim($value, '/');
}
function month_year(?string $date): string {
    if (!$date) return '';
    $ts = strtotime($date);
    return $ts ? date('F Y', $ts) : '';
}

$studentCode = strtoupper(trim((string)($_GET['student'] ?? '')));
$studentCode = preg_replace('/[^A-Z0-9_-]/', '', $studentCode) ?? '';
if ($studentCode === '') {
    http_response_code(404);
    echo '<!doctype html><meta charset="utf-8"><title>Certificate not found</title><style>body{font-family:Arial,sans-serif;padding:40px;background:#f7f5f5;color:#26372f}.box{max-width:680px;margin:auto;background:#fff;border:1px solid #ead8dc;border-radius:18px;padding:28px}</style><div class="box"><h1>Certificate not found</h1><p>A valid Student ID is required.</p></div>';
    exit;
}

try {
    $db = new Database(__DIR__ . '/api/config/database.php');
    $pdo = $db->pdo();
    $stmt = $pdo->prepare("SELECT sc.*,u.student_code,u.name AS student_name,u.branch,u.status AS student_status
                           FROM student_course_certificates sc
                           JOIN users u ON u.id=sc.student_id
                           WHERE UPPER(u.student_code)=UPPER(?) AND u.role='student'
                           LIMIT 1");
    $stmt->execute([$studentCode]);
    $cert = $stmt->fetch();
    if (!$cert) {
        http_response_code(404);
        echo '<!doctype html><meta charset="utf-8"><title>Certificate not found</title><style>body{font-family:Arial,sans-serif;padding:40px;background:#f7f5f5;color:#26372f}.box{max-width:680px;margin:auto;background:#fff;border:1px solid #ead8dc;border-radius:18px;padding:28px}</style><div class="box"><h1>Certificate not found</h1><p>No generated certificate exists for Student ID <strong>'.e($studentCode).'</strong>.</p></div>';
        exit;
    }

    $site = [];
    try {
        $s = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key='site' LIMIT 1");
        $s->execute();
        $raw = $s->fetchColumn();
        $decoded = $raw ? json_decode((string)$raw, true) : null;
        if (is_array($decoded)) $site = $decoded;
    } catch (Throwable $ignored) {}
} catch (Throwable $error) {
    http_response_code(503);
    echo '<!doctype html><meta charset="utf-8"><title>Certificate unavailable</title><style>body{font-family:Arial,sans-serif;padding:40px;background:#f7f5f5;color:#26372f}.box{max-width:680px;margin:auto;background:#fff;border:1px solid #ead8dc;border-radius:18px;padding:28px}</style><div class="box"><h1>Certificate temporarily unavailable</h1><p>Please try again later.</p></div>';
    exit;
}

$academy = trim((string)($site['academy_name'] ?? 'Full Stack Academy')) ?: 'Full Stack Academy';
$student = (string)$cert['student_name'];
$course = (string)$cert['course_name'];
$signingName = (string)$cert['signing_name'];
$signingTitle = (string)$cert['signing_title'];
$signatureUrl = media_url((string)$cert['signature_url']);
$fromMY = month_year($cert['from_date'] ?? null);
$toMY = month_year($cert['to_date'] ?? null);
$dateText = ($fromMY && $toMY) ? 'From the Month of ' . $fromMY . ' to ' . $toMY : (($toMY ?: $fromMY) ? 'Completed in ' . ($toMY ?: $fromMY) : 'Course completion verified by Full Stack Academy');

$baseSite = rtrim((string)($site['site_url'] ?? ''), '/');
if ($baseSite !== '') {
    $publicUrl = $baseSite . '/certificate.php?student=' . rawurlencode($studentCode);
} else {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = (string)($_SERVER['HTTP_HOST'] ?? 'localhost');
    $path = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/certificate.php'))), '/');
    $publicUrl = $scheme . '://' . $host . ($path ? $path : '') . '/certificate.php?student=' . rawurlencode($studentCode);
}

$qr = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' . rawurlencode($publicUrl);
$bg = media_url('uploads/media/2026/10/fsa-certificate-for-website-fdce03d80158.svg');
$topLogo = media_url('uploads/media/2026/10/logo-20f3850ac075.svg');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificate - <?= e($studentCode) ?></title>
<style>
@import url('https://fonts.cdnfonts.com/css/glacial-indifference');
*{box-sizing:border-box}body{margin:0;padding:0;background:#ececec;font-family:'Glacial Indifference',Arial,sans-serif;color:#26372f;-webkit-print-color-adjust:exact!important}.page-shell{min-height:100vh;padding:0}.certificate{width:1000px;height:707px;background:url('<?= e($bg) ?>') no-repeat center center!important;background-size:100% 100%!important;position:relative;margin:20px auto;overflow:hidden;background-color:#fff;box-shadow:0 18px 60px rgba(31,48,39,.16)}.center-align{position:absolute;left:0;width:100%;text-align:center}.top-logo-wrap{position:absolute;top:45px;left:0;width:100%;text-align:center}.top-logo-img{height:100px;width:auto}.academy-url{top:165px;font-size:12.5px;color:#345130;font-weight:400}.cert-title{top:205px;font-size:27.5px;color:#545454;text-transform:uppercase;letter-spacing:1px}.awarded-to{top:260px;font-size:14.2px;color:#333;text-transform:uppercase}.student-name{top:305px;font-size:36px;color:#c6a423;text-transform:uppercase;font-weight:400}.recognition-text{top:370px;font-size:17.5px;color:#345130}.course-name{top:410px;font-size:17.5px;font-weight:bold;color:#8B1925;text-transform:uppercase;padding:0 150px}.date-text{top:445px;font-size:16px;color:#345130}.qr-box{position:absolute;top:40px;right:90px;padding:5px;background:#fff;border:1px solid #eee}.qr-img{width:80px;height:80px}.signature-image-wrap{position:absolute;bottom:110px;left:0;width:100%;text-align:center}.sig-img{height:85px;width:auto;mix-blend-mode:multiply}.director-name-wrap{position:absolute;bottom:90px;left:0;width:100%;text-align:center;font-size:14px;font-weight:bold;color:#772202;text-transform:uppercase}.designation-wrap{position:absolute;bottom:70px;left:0;width:100%;text-align:center;font-size:12.6px;color:#345130;text-transform:capitalize}.actions{max-width:1000px;margin:14px auto 0;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}.actions button,.actions a{border:0;border-radius:9px;padding:11px 16px;font:700 14px Arial,sans-serif;cursor:pointer;text-decoration:none}.primary{background:#8b2537;color:#fff}.secondary{background:#fff;color:#26372f;border:1px solid #d8c9cd!important}.verification{max-width:1000px;margin:12px auto 0;background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px 14px;font:13px/1.5 Arial,sans-serif;color:#4d5b54}.verification strong{color:#26372f}.verification code{word-break:break-all}
@media(max-width:1040px){.page-shell{overflow-x:auto}.certificate,.actions,.verification{min-width:1000px}}
@media print{body{background:none}.page-shell{padding:0}.certificate{margin:0;box-shadow:none;width:1000px;height:707px}.actions,.verification{display:none!important}}
</style>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script>
async function downloadCertificate(){
  const btn=document.getElementById('downloadBtn'),original=btn.textContent;btn.disabled=true;btn.textContent='Generating...';
  try{
    const canvas=await html2canvas(document.querySelector('.certificate'),{scale:4,useCORS:true,backgroundColor:'#ffffff'});
    const a=document.createElement('a');a.href=canvas.toDataURL('image/jpeg',0.98);a.download='certificate-<?= e($studentCode) ?>.jpg';a.click();
  }catch(e){alert('Could not generate the JPG. You can still use Print / Save as PDF.');}
  btn.disabled=false;btn.textContent=original;
}
</script>
</head>
<body>
<div class="page-shell">
  <div class="certificate">
    <div class="top-logo-wrap"><img crossorigin="anonymous" src="<?= e($topLogo) ?>" class="top-logo-img" alt="<?= e($academy) ?>"></div>
    <div class="center-align academy-url">fullstackacademy.in</div>
    <div class="center-align cert-title">Certificate of Excellence</div>
    <div class="center-align awarded-to">Awarded to</div>
    <div class="center-align student-name"><?= e($student) ?></div>
    <div class="center-align recognition-text">In recognition of completion of the course</div>
    <div class="center-align course-name"><?= e($course) ?></div>
    <div class="center-align date-text"><?= e($dateText) ?></div>
    <?php if ($signatureUrl !== ''): ?><div class="signature-image-wrap"><img crossorigin="anonymous" src="<?= e($signatureUrl) ?>" class="sig-img" alt="Signature"></div><?php endif; ?>
    <?php if ($signingName !== ''): ?><div class="director-name-wrap"><?= e($signingName) ?></div><?php endif; ?>
    <?php if ($signingTitle !== ''): ?><div class="designation-wrap"><?= e($signingTitle) ?></div><?php endif; ?>
    <div class="qr-box"><img crossorigin="anonymous" src="<?= e($qr) ?>" class="qr-img" alt="Verify certificate"></div>
  </div>
  <div class="actions">
    <button id="downloadBtn" class="primary" type="button" onclick="downloadCertificate()">Download Full HD JPG</button>
    <button class="secondary" type="button" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="verification"><strong>Certificate verification link:</strong> <code><?= e($publicUrl) ?></code></div>
</div>
</body>
</html>
