FSA Zoom Native Client View Fix v90
===================================

WHY THE SCREEN WAS STUCK
------------------------
The previous embedded room kept a full-screen custom loading layer above Zoom until
ZoomMtg.join() returned success. Zoom Client View can render native pre-join,
permission, waiting-room and meeting UI before that success callback settles.
That meant Zoom could be running underneath while the LMS kept showing the black
"Starting Zoom meeting..." layer on top.

V90 FIXES
---------
1. The LMS loading layer is removed immediately after ZoomMtg.init() succeeds and
   BEFORE ZoomMtg.join() starts. Native Zoom UI is never covered during join.
2. Zoom meeting status events are listened to (connecting / connected /
   reconnecting / disconnected) so the LMS does not depend only on one callback.
3. Waiting-room UI remains visible instead of being mistaken for a failed join.
4. Current Zoom 6.x join options no longer send the deprecated sdkKey property;
   the signed Meeting SDK JWT remains the authentication source.
5. Init and join have guarded timeouts and visible errors instead of an endless
   black screen.
6. Zoom/PHP responses use no-cache headers and iframe URLs include v=90 so old
   zoom-room.php output is not reused by the browser.
7. Existing v89 host signature/ZAK preflight, student access checks, no-reconnect
   protection, tall native Zoom viewport, and recording rail are preserved.
8. The standalone live-class.php page gets the same v90 room and browser permissions.

REPLACEMENT FILES
-----------------
index.html
js/app.js
api/index.php
zoom-room.php
live-class.php

HOW TO TEST
-----------
1. Replace the files, preserving folders (js/app.js and api/index.php).
2. Close ALL old LMS/Zoom localhost browser tabs.
3. Reopen the LMS and press Ctrl+F5 once.
4. Instructor -> Live Classes -> Start Live Class.
5. The temporary LMS loading text may appear while credentials/CDN load, but once
   Zoom initializes, Zoom's OWN native UI should take over. The old permanent
   "Starting Zoom meeting..." cover should not remain.
6. If Zoom itself rejects the meeting, v90 now shows the actual SDK error instead
   of staying black.
7. Test student join in Incognito/another browser after the host starts.

ZOOM CONFIG STILL REQUIRED
--------------------------
Admin -> Zoom Live must contain BOTH sets of credentials:
- Server-to-Server OAuth: Account ID, REST Client ID, REST Client Secret, host user
- Meeting SDK: Meeting SDK Client ID and Meeting SDK Client Secret

The configured host user must own/host the created meetings. Starting a meeting in
Meeting SDK requires a role-1 Meeting SDK signature plus the host ZAK token.
