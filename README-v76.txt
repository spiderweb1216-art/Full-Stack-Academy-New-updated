FSA Live Classes Complete Fix v76

This is the complete fix for the Student Live Classes problem.

ROOT CAUSES FOUND
-----------------
1. Some database rows were still status='live' even though their scheduled time was
   hours/days in the future.
2. The frontend trusted status='live' without validating starts_at / ends_at.
3. The main index.html was still loading:
      js/app.js?v=38.0
   so browsers could continue using an older cached app.js after replacement.

WHAT v76 DOES
-------------
BACKEND / MYSQL
- Future rows incorrectly marked live are automatically returned to scheduled.
- Expired live/scheduled rows automatically become ended.
- If ends_at is missing, a 3-hour safety window is used.
- Starting a new instructor classroom ends any other currently-live classroom for
  that same instructor.
- Student join still requires the backend class status to be truly live.

STUDENT LIVE CLASSES — COURSERA-STYLE
1. LIVE NOW
   - ONLY classes the instructor actually started.
   - Future classes never get a Join button.
2. BIG ZOOM CLASSROOM
   - only belongs to a genuinely live class.
3. UPCOMING
   - scheduled classes shown separately in a compact schedule.
   - no Join Live button until instructor starts the class.
4. PREVIOUS & RECORDED
   - ended sessions / recordings are separate from Live Now.
5. Duplicate schedule cards with the same course + title + start time are hidden.

STUDENT DASHBOARD
- "Live now" uses the same time-aware logic.

CACHE FIX
---------
index.html now loads:
  js/app.js?v=76.0

This forces the browser to load the new JavaScript instead of the old cached build.

REPLACE THESE 3 FILES
---------------------
index.html
js/app.js
api/index.php

IMPORTANT
---------
Replace all 3 together, then open:
http://localhost/full-stack-academy/

Press Ctrl+F5 once.

You do NOT need to change zoom-room.php for this fix.
Your current embedded Zoom files remain untouched.
