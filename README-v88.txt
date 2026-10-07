FSA Zoom Native Client View v88

ROOT CAUSE OF v87 ERROR
=======================
v87 used:
https://source.zoom.us/zoom-meeting-6.5.0.min.js

Zoom's official Client View CDN sample uses the VERSIONED bundle path:
https://source.zoom.us/6.5.0/zoom-meeting-6.5.0.min.js

v87 also omitted:
react-redux.min.js

That is why the page could reach source.zoom.us for Component View earlier but
window.ZoomMtg was not available in v87 Client View.

V88 FIX
=======
zoom-room.php now:

1. Calls the LMS API first.
2. Reads the configured Meeting SDK version from the backend.
3. Loads the official Client View dependencies in order:
   react.min.js
   react-dom.min.js
   react-redux.min.js
   redux.min.js
   redux-thunk.min.js
   lodash.min.js
   zoom-meeting-{VERSION}.min.js

4. Uses VERSIONED Zoom CDN paths:
   https://source.zoom.us/{VERSION}/...

5. Calls:
   ZoomMtg.setZoomJSLib(...)
   ZoomMtg.preLoadWasm()
   ZoomMtg.prepareWebSDK()
   ZoomMtg.init(...)
   ZoomMtg.join(...)

NO CUSTOM ZOOM LAYOUT
=====================
v88 removes the custom Zoom Client View styling helper.

Inside the meeting iframe:
- Zoom owns the complete viewport.
- No custom speaker/gallery layout.
- No custom participant sizing.
- No custom screen-share sizing.
- No custom Zoom toolbar layout.
- No custom chat/participants/settings positioning.
- No forced component-view ribbon.
- No custom virtual-background behavior.

The only CSS left in zoom-room.php:
- makes html/body/#zmmtg-root fill the iframe
- shows a plain loading/error layer BEFORE Zoom opens

Once joined, that layer disappears and the user sees Zoom's own Client View.

OUTER LMS
=========
The LMS still keeps:
- course selector
- big left player
- Live + recordings list on right
- recording playback
- upcoming schedule

But the actual Zoom meeting area is native Zoom Client View.

NO-RECONNECT FIX PRESERVED
==========================
The v86 lifecycle protection is preserved:
the LMS does not auto-rerender/destroy the Zoom iframe while a meeting is open.

REPLACE ALL 4 FILES
===================
index.html
js/app.js
api/index.php
zoom-room.php

CACHE
=====
js/app.js?v=88.0

TEST
====
1. Replace all 4 files.
2. Close ALL old localhost tabs.
3. Reopen localhost.
4. Ctrl+F5.
5. Instructor opens Live class.
6. Student joins in Incognito / another browser.
7. Share Entire Screen.
8. Zoom should use its own normal Client View UI.
9. Keep both open 60+ seconds to verify no reconnect loop.
