<?php
declare(strict_types=1);

$liveId = isset($_GET['live_id']) ? (int)$_GET['live_id'] : 0;
$mode = (string)($_GET['mode'] ?? 'student');
if ($liveId < 1 || !in_array($mode, ['student','host'], true)) {
    http_response_code(400);
    echo 'Invalid live classroom request.';
    exit;
}
$back = $mode === 'host' ? 'index.html#/instructor-live' : 'index.html#/live-classes';
$title = $mode === 'host' ? 'Instructor Live Classroom' : 'Live Classroom';
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($title, ENT_QUOTES) ?> | Full Stack Academy</title>
<style>
:root{--brand:#93283a;--ink:#26372f;--soft:#fff8f7;--line:#ecd7dc}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#f8f4f4;font-family:Arial,sans-serif;color:var(--ink)}
.classroom-shell{height:100vh;display:grid;grid-template-rows:auto 1fr}
.classroom-bar{min-height:72px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 22px;position:relative;z-index:2}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;color:var(--brand);letter-spacing:.02em}
.brand-mark{width:38px;height:38px;border-radius:12px;background:var(--brand);color:#fff;display:grid;place-items:center;font-weight:900}
.meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.mode{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--brand);background:#fff0f2;border:1px solid #f1d2d8;padding:7px 10px;border-radius:999px}
.back{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--ink);font-weight:700;background:#fff}
.room-wrap{min-height:0;padding:14px}
.room-card{height:100%;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(55,25,31,.08)}
iframe{display:block;width:100%;height:100%;border:0;background:#111}
@media(max-width:700px){.classroom-bar{padding:10px 12px;min-height:62px}.brand span:last-child{display:none}.room-wrap{padding:0}.room-card{border-radius:0;border-left:0;border-right:0}.mode{font-size:10px}}
</style>
</head>
<body>
<div class="classroom-shell">
  <header class="classroom-bar">
    <div class="brand"><span class="brand-mark">FSA</span><span>Full Stack Academy Live Classroom</span></div>
    <div class="meta">
      <span class="mode"><?= $mode === 'host' ? 'Instructor / Host' : 'Student' ?></span>
      <a class="back" href="<?= htmlspecialchars($back, ENT_QUOTES) ?>">Back to LMS</a>
    </div>
  </header>
  <main class="room-wrap">
    <section class="room-card">
      <iframe
        src="zoom-room.php?live_id=<?= $liveId ?>&amp;mode=<?= htmlspecialchars($mode, ENT_QUOTES) ?>&amp;v=90"
        allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-read; clipboard-write"
        allowfullscreen
        referrerpolicy="same-origin"
        title="Zoom Live Classroom"></iframe>
    </section>
  </main>
</div>
</body>
</html>
