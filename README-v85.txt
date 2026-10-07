FSA Instructor Upcoming Start v85

Instructor can start an Upcoming class directly when its start window arrives.

Current rule:
- Start button unlocks 15 minutes before the scheduled time.
- It remains available at the exact scheduled time and afterward.
- Backend PHP enforces the same rule.

Automatic behavior:
- No manual refresh needed.
- LMS schedules an exact unlock timer for the earliest Upcoming class.
- At unlock time the card becomes "Start Live Class".
- A 15-second safety refresh also remains active.

When Start Live Class is clicked:
- MySQL status changes scheduled -> live
- Students can join immediately
- Session moves from Upcoming to Live Now
- Zoom becomes the active classroom
- Instructor is scrolled to the player

API session rows now expose:
- start_available_at
- can_start
- server_now

Preserved:
- v84 Student multi-course My Courses setup
- v83 layout fixes
- v82 YouTube-style Zoom / recording layout
- Recording flow and sticky dashboard

Replace:
index.html
js/app.js
api/index.php

Cache:
js/app.js?v=85.0
