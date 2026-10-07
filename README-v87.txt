FSA Zoom Full Client View v87

WHY V86 STILL LOOKED WRONG
==========================
The meeting was working, but zoom-room.php was using ZoomMtgEmbedded
(Component View).

Component View is a modular/widget Zoom layout. During screen sharing it can
choose its own internal speaker/gallery/ribbon geometry, which is why the shared
screen occupied only part of the black box and participant tiles occupied another
part.

Zoom's official documentation describes Client View as the familiar full Zoom
web-client experience. v87 switches the LMS classroom to Client View INSIDE the
existing iframe.

NEW STRUCTURE
=============
LMS still remains:
LEFT  = big Zoom / recording player
RIGHT = Live + recordings playlist

But inside the LEFT Zoom iframe:
- Zoom owns the complete iframe viewport.
- No LMS code resizes Zoom's participant/video components.
- No artificial component-view ribbon.
- No draggable component widgets.
- Screen Share uses Zoom Client View's native layout.
- Toolbar/chat/participants/settings use the normal Zoom web-client interface.
- Camera/gallery/speaker behavior is handled by Zoom itself.
- Fullscreen capability is allowed by the parent iframe.

NO RECONNECT REGRESSION
=======================
v86's lifecycle protection is preserved:
- While Zoom iframe is mounted, Live-page auto-refresh does NOT rebuild the page.
- Scheduled unlock timers do not destroy the iframe.
- Zoom reports loading / joining / joined state to the LMS.

SCREEN SHARE
============
When somebody shares:
- Zoom Client View decides the screen-share layout exactly as the Zoom web client.
- LMS does not crop the shared screen.
- The iframe itself stays 16:9 in the YouTube-style LMS player.
- If the shared monitor has a different aspect ratio, Zoom may letterbox it with
  black space instead of cropping it. That is correct behavior.

BROWSER SHARE BAR
=================
Chrome/Edge may show its own "you are sharing your screen" bar outside the Zoom
iframe. That is controlled by the browser and cannot/should not be hidden by the LMS.

REPLACE ALL 4 FILES
===================
index.html
js/app.js
api/index.php
zoom-room.php

CACHE
=====
js/app.js?v=87.0

TEST
====
1. Replace all 4 files.
2. Close old localhost tabs.
3. Reopen localhost and Ctrl+F5.
4. Instructor starts/opens Live class.
5. Student joins in another browser/incognito.
6. Instructor shares Entire Screen.
7. Student should see the normal Zoom Client View share layout filling the left
   player without the old Component View split/crop.
8. Leave both open for 60+ seconds to confirm no reconnect loop.
