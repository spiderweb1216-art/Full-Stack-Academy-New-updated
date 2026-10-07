FSA Zoom Stuck Complete Fix v73

WHY v72 STAYED ON "CONNECTING TO ZOOM"
--------------------------------------
The problem was not your Zoom credentials.

v72 accidentally had an orphaned JavaScript block after:
  setTimeout(syncZoomVideoSize,250)
  setTimeout(syncZoomVideoSize,900)
  setTimeout(syncZoomVideoSize,2200)

That made the main inline JavaScript invalid. Because it could not execute:
- the API call never started
- Zoom initialization never started
- the 30-second error timer never started
- the page remained permanently on the initial connecting screen

FIXES IN v73
------------
1. Removes the broken orphaned catch/braces.
2. Adds an early "Loading Zoom Meeting SDK..." stage before external Zoom scripts.
3. Keeps the v72 larger LMS box.
4. Reserves even more vertical space for Zoom's native bottom controls.
5. Keeps ResizeObserver + post-join resizing.
6. Keeps v71 Admin-style Student/Instructor dashboard layout.

REPLACE
-------
js/app.js
zoom-room.php

TEST
----
1. Replace both files.
2. Ctrl+F5.
3. Instructor > Live Classes > Open the classroom.
4. You should first see "Loading Zoom Meeting SDK..."
5. Then "Preparing secure classroom..."
6. Then Zoom should initialize/join.
7. Once joined, move the mouse over the bottom of the Zoom area; controls should remain visible.

If something else fails after v73, the page will now advance far enough to show the real
API / SDK error instead of freezing forever.
