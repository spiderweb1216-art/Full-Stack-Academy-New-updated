FSA Zoom Stable No-Reconnect v86

ROOT CAUSE FOUND
================
The Live Classes page had an automatic data refresh every 15 seconds.

That refresh called renderStudentLiveClasses() / renderInstructorLive().
Those functions rebuild the dashboard HTML, including the Zoom iframe.

Result:
Zoom iframe destroyed -> recreated -> "Connecting to Zoom..." -> joins again.

That is why Zoom appeared to reconnect again and again.

V86 FIX
=======
1. Once the Zoom iframe is mounted, ALL automatic Live-page rerenders stop.
2. The 15-second backend refresh is cancelled while Zoom is open.
3. Instructor scheduled-class unlock timers are also paused while teaching.
4. A pending timer checks again before rendering, so it cannot race with Join Zoom.
5. zoom-room.php reports loading/joining/joined state to the parent LMS.
6. Ordinary browser resize never rerenders the Live page.

ZOOM UI STABILITY
=================
- Uses Zoom Component View inside its own iframe.
- Zoom video panel is no longer user-resizable inside the LMS.
- Zoom poppers (chat / participants / settings / video) are not draggable.
- LMS owns the 16:9 player geometry.
- Resize updates are deduplicated to avoid layout feedback loops.
- The iframe uses the actual visible dimensions.
- No LMS code turns on virtual backgrounds, blur, or background removal.

IMPORTANT ABOUT VIDEO BACKGROUND EFFECTS
========================================
Zoom Meeting SDK supports virtual backgrounds as a Zoom feature. The LMS does not
enable one in v86. If a Zoom/browser user has previously selected Blur or a Virtual
Background, Zoom may remember that user preference. Select "None" once in Zoom's
Video/Background settings. There is no documented Component View setting that safely
forces all users' personal Zoom background preference off from the LMS.

PRESERVED
=========
- v85 Upcoming -> Start Live Class functionality.
- v84 Student multiple purchased courses.
- v83 layout fixes.
- v82 YouTube-style Live/recording player.
- MySQL and recording functionality.
- Sticky sidebar.

REPLACE ALL 4 FILES
===================
index.html
js/app.js
api/index.php
zoom-room.php

Do not keep the previous zoom-room.php with v86.

CACHE
=====
js/app.js?v=86.0

TEST
====
1. Replace all 4 files.
2. Close every old localhost LMS tab.
3. Reopen localhost.
4. Ctrl+F5 once.
5. Instructor -> Live Classes -> Start/Open Zoom.
6. Leave it open for at least 60 seconds.
7. It must NOT show "Connecting to Zoom..." again by itself.
8. Open Student in another browser/incognito and Join.
9. Both sessions should remain mounted until the user intentionally leaves,
   changes player content, ends the class, or navigates away.
