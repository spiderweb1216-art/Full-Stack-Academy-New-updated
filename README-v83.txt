FSA Live Layout Polish v83

This version fixes the layout problems visible in the supplied Instructor Live Classes screenshot.

FIXED
=====
1. TOP ACTION BUTTONS
- Recorded Classes and Schedule Class / Month now stay side-by-side on desktop.
- Same 44px height.
- No forced giant widths.
- No vertical stacking unless the viewport is genuinely narrow.
- On mobile they become clean full-width stacked actions.

2. SELECT COURSE BAR
- Uses a real two-column layout.
- Description stays on the left.
- Course dropdown stays a controlled 320–420px width on desktop.
- No detached dropdown arrow at the far right.
- Native select arrow stays inside the input.
- On smaller screens it becomes one full-width row.

3. RIGHT "UP NEXT" HEADER
- Recording count is forced back to a small circular badge.
- It can no longer stretch into a long pink bar.

4. YOUTUBE PLAYER / PLAYLIST
- Player remains responsive 16:9.
- Right playlist stays a controlled 300–360px column.
- Both columns are min-width safe and cannot force horizontal page overflow.

5. DASHBOARD WIDTH SAFETY
- Dashboard content clips accidental horizontal overflow.
- Desktop sidebar is pinned to left:0 and cannot be shifted by this Live page's wide content.

PRESERVED
=========
- v82 recording click -> plays in large left player.
- Live class stays at top of right playlist.
- Click Live -> returns Zoom to left player.
- Zoom sizing/cropping fix.
- MySQL-backed recordings.
- Course filter.
- Countdown.
- Upcoming schedule.
- Instructor/Student DB logic.
- v78 sticky dashboard behavior.

REPLACE THESE 4 FILES TOGETHER
==============================
index.html
js/app.js
api/index.php
zoom-room.php

CACHE
=====
index.html now loads:
js/app.js?v=83.0

After replacing:
1. Close the current localhost tab completely.
2. Reopen the LMS.
3. Press Ctrl+F5 once.
4. Open Instructor > Live Classes.
