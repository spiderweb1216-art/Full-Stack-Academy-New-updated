FSA Student Live Classes Coursera-Style v75

Problem fixed
-------------
The Student Live Classes page was trusting database status='live'.
That caused old and FUTURE classes to all appear as LIVE NOW.

v75 derives the real display state from BOTH:
- backend status
- scheduled starts_at / ends_at time

Behavior
--------
LIVE NOW
- Requires backend status = live
- AND current time must be within the class time window
- Future classes can no longer appear Live Now
- Old stale rows can no longer remain Live forever

UPCOMING
- Future scheduled classes appear separately
- They do NOT show a Join Live button
- They show View Schedule / available-at-scheduled-time behavior

PAST / RECORDINGS
- Completed classes and published recordings are moved into their own section
- Recording button appears only when recording_url exists

BIG ZOOM PLAYER
- Automatically selects ONLY an actually-live class
- Future classes cannot automatically open the Zoom player
- If nothing is live, it clearly says the instructor has not started a class

STUDENT DASHBOARD
- Live Now widget now uses the same time-aware logic
- It no longer says future classes are live

Fallback duration
-----------------
If ends_at is missing, the frontend uses duration_minutes/duration when available.
Otherwise it uses a 120-minute safety window so stale status='live' rows do not remain
live for days.

Replace only
------------
js/app.js

This is based on v74, so the clean Admin-style Student dashboard layout is preserved.
Your current Zoom PHP files remain unchanged.

After replacing
---------------
Press Ctrl+F5.
