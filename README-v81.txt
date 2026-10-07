FSA YouTube-Style Live Course Hub v81

REPLACE THESE 4 FILES TOGETHER
------------------------------
index.html
js/app.js
api/index.php
zoom-room.php

WHAT CHANGED
============

1. LIVE CLASSES — STUDENT + INSTRUCTOR
---------------------------------------
Both sides now use the same YouTube-style layout:

LEFT:
- Large Live Zoom classroom.
- No fake crop/minimized layout.
- If no class is Live, the nearest upcoming class is shown with a second-by-second countdown.
- Student gets Join Live Class only when instructor has actually started the class.
- Instructor gets Start Live Class when the class enters the start window.

RIGHT:
- Previous recorded lectures.
- Real MySQL recording data only.
- Newest recording first.
- Independent scrollbar.
- Each recording shows title, course, date and playback URL when published.

BELOW:
- Proper upcoming lecture grid loaded from live_sessions in MySQL.

2. COURSE SELECTOR
------------------
Live Classes has a course selector.
Student selector uses active purchased/enrolled courses.
Instructor selector uses assigned courses.

Changing the course filters:
- Live classroom
- Recording playlist
- Upcoming timetable

3. INSTRUCTOR RECORDINGS
------------------------
Recorded Classes remains a separate Instructor menu item.
It supports:
- Course filter
- Add recording URL
- Edit
- Delete
- Sync Zoom recordings
- Latest first

4. END CLASS -> FINALIZE RECORDING POPUP
-----------------------------------------
Clicking End & Finalize Recording now opens a form with:
- Course
- Recording title
- Short description
- Video / recording URL

URL is optional:
- If provided, recording publishes immediately.
- If blank, LMS creates a Processing recording and attempts Zoom Cloud Recording sync.
- The recording is stored in course_recordings MySQL table.

5. STUDENT PURCHASED COURSES
----------------------------
Student Dashboard now includes "My purchased courses".
These are loaded from active backend enrollments.

Click "Open Course" to open a dedicated purchased-course hub containing:
- Course progress
- Continue Learning
- Live / next class banner
- All published recordings for that course
- Upcoming Live schedule

Route:
#/my-course/<course-slug>

6. STUDENT DASHBOARD LIVE NOTIFICATION
---------------------------------------
If one of the student's purchased courses is Live:
- Small Live banner appears on main Dashboard.
- Course name, class title and time are shown.
- Join Live opens the correct course/class.

If no class is Live but one is upcoming:
- Next class notification + countdown appears.

7. RECORDING ACCESS
-------------------
Published course recordings are now returned for any active/completed purchased
course enrollment, not only delivery_mode='live'.

8. ZOOM CROPPING FIX
--------------------
zoom-room.php now sizes Zoom from the REAL iframe width/height.
It no longer pretends the SDK root is larger than the iframe.
This prevents the video canvas / toolbar from being pushed outside the visible area.

The outer LMS player is tall enough for Zoom controls and uses a YouTube-style
left player + right playlist layout.

9. CACHE
--------
index.html loads:
js/app.js?v=81.0

After replacing:
1. Close the old LMS browser tab.
2. Open localhost again.
3. Press Ctrl+F5 once.
4. Test Instructor > Live Classes.
5. Test Student > Dashboard, My Courses and Live Classes.

ZOOM CLOUD RECORDING NOTE
-------------------------
Automatic Zoom recording URL retrieval only works when Zoom Cloud Recording exists
for the meeting and the OAuth app/account has access to it.

If Zoom Cloud Recording is unavailable (for example due to account plan/settings),
the LMS still creates the recording entry automatically when the instructor ends class.
The instructor can paste the recording URL from Recorded Classes.
