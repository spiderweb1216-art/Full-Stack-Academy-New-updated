FSA Zoom Complete Stability + Layout Fix v89

FILES TO REPLACE
================
index.html
js/app.js
api/index.php
zoom-room.php

WHAT WAS FIXED
==============
1. Instructor Live Classes now loads the same v82/v83 layout fixes as Student Live Classes.
2. Native Zoom Client View is no longer forced into the normal 16:9 recording player.
   Active Zoom gets a tall meeting viewport so toolbar, gallery, chat, participants and screen share can fit.
3. Recordings remain 16:9. Only the active Zoom room uses the taller viewport.
4. Start Live Class now performs a Meeting SDK signature + host ZAK preflight BEFORE
   marking the class live. If Zoom credentials/scopes are wrong, students are not shown a false Live state.
5. Failed Start restores the button instead of leaving it stuck on “Starting…”.
6. Zoom Client View CDN loading now supports both version-scoped and root bundle paths.
7. Zoom language resources are loaded before init for a more reliable Client View boot.
8. MySQL NOW() is aligned with the LMS configured timezone to prevent scheduled classes
   unlocking hours early/late when PHP and MySQL server timezones differ.
9. v86 no-reconnect protection is preserved: the LMS does not rebuild the Zoom iframe
   during its normal 15-second Live-page refresh.
10. Cache version bumped to js/app.js?v=89.0.

IMPORTANT ZOOM SETTINGS
=======================
Admin -> Zoom Live must still contain:
- Server-to-Server OAuth Account ID / Client ID / Client Secret
- Default Zoom host user/email
- Meeting SDK Client ID / Client Secret
- Meeting SDK version (6.5.0 is current for this package)

The Server-to-Server OAuth app needs permission to create/manage meetings and to
read the host user token/ZAK. The default host must be the Zoom user who owns the meetings.

TEST
====
1. Replace the four files above.
2. Close old localhost/site tabs and reopen.
3. Hard refresh (Ctrl+F5).
4. Instructor -> Live Classes -> Start Live Class.
5. The button should first say “Checking Zoom…”. If credentials/scopes are invalid,
   the class stays scheduled and the real Zoom error is shown.
6. When ready, native Zoom Client View opens in the large left meeting area.
7. Join as a student in Incognito/another browser.
8. Test camera, mic, chat/participants and Entire Screen sharing.
9. Keep both sides open at least 60 seconds; the iframe should not reconnect itself.
