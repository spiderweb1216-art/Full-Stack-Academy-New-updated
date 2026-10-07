FSA YouTube Player + Live Rail v82

REPLACE THESE 4 FILES TOGETHER
------------------------------
index.html
js/app.js
api/index.php
zoom-room.php

NEW YOUTUBE-STYLE BEHAVIOR — STUDENT + INSTRUCTOR
==================================================

LEFT SIDE = ONE BIG 16:9 PLAYER
- Exact responsive 16:9 ratio.
- No artificial 620-760px height.
- Zoom iframe fills the real player box.
- Zoom's internal SDK uses the REAL iframe dimensions.
- Space is reserved inside Zoom for its toolbar/panels so controls are not pushed outside.
- No object cropping; video uses contain behavior.

RIGHT SIDE = LIVE + RECORDINGS PLAYLIST
- LIVE NOW is always the first item when a class is live.
- All DB recordings follow below it, newest first.
- Right list has its own scrollbar.
- Right rail height automatically matches the complete left player/card on desktop.

CLICK A RECORDING
-----------------
- Recording plays in the large LEFT player.
- Current Live class moves/remains at the TOP of the right playlist.
- Clicking the LIVE item returns the large left player to Zoom.
- Selected recording is highlighted in the right list.

SUPPORTED RECORDING PLAYERS
---------------------------
- Direct MP4 / WebM / OGG / M4V / MOV -> HTML5 video player.
- YouTube -> embedded YouTube player.
- Vimeo -> embedded Vimeo player.
- Zoom play URLs / other web players -> embedded iframe attempt.
- "Open Source" remains available under the player as a fallback.

NO LIVE CLASS
-------------
- Left player shows the next upcoming class and a second-by-second countdown.
- Instructor gets Start Live Class when the start window opens.
- Student waits until the instructor actually starts it.

ZOOM RECORDING SYNC
-------------------
The backend now prefers Zoom recording_files[].play_url (especially completed MP4
recordings) before Zoom share_url. This is better suited to playing a recording from
inside the LMS.

COURSE FILTER
-------------
Changing course clears the previous player selection and loads only that course's:
- Live class
- recordings
- upcoming schedule

CACHE
-----
index.html loads:
js/app.js?v=82.0

After replacing:
1. Close the old LMS tab.
2. Open localhost again.
3. Ctrl+F5 once.
4. Test Student > Live Classes.
5. Test Instructor > Live Classes.
6. Click a recording -> it should replace the left player.
7. If a class is live, click LIVE at top-right -> Zoom returns to the left player.
