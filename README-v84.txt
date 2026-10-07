FSA Student My Courses Complete v84

STUDENT > MY COURSES
====================
This version turns My Courses into a complete purchased-course library for students
who own multiple Live / Recorded / Physical courses.

Everything on this page is based on existing backend data:
- Active/completed MySQL enrollments
- Course data
- live_sessions
- course_recordings
- Course progress / lessons

TOP SUMMARY
===========
- Purchased Courses
- Live Courses
- Published Recordings
- Upcoming Classes

FILTERS
=======
- All Courses
- Live Courses
- Recorded
- In Progress
- Completed

EACH PURCHASED COURSE
=====================
Every course has its own equal responsive card:
- Proper 16:9 image
- Category
- Course title
- Instructor
- Live / Recorded / Physical badges
- LIVE NOW badge when that course is active
- Current Live lecture OR next scheduled lecture
- Real countdown to next Live lecture
- Recording count
- Upcoming-class count
- Lesson count
- Progress
- Open Workspace
- Continue Learning / Review Learning

If a student buys 3 Live courses, all 3 appear as separate equal cards and every card
shows its OWN Live status, next schedule, recordings and progress.

OPEN WORKSPACE
==============
The existing backend-driven route is preserved:
#/my-course/<course-slug>

That page contains the selected course's:
- Learning progress
- Live / next class notification
- Published recordings
- Upcoming schedule

STUDENT DASHBOARD
=================
The My Purchased Courses area also uses these same backend-driven cards in compact form.

PRESERVED
=========
- v83 layout fixes
- v82 YouTube-style Live / recording player
- Zoom
- Instructor pages
- Sticky sidebar
- Existing PHP/API backend

REPLACE ONLY
============
index.html
js/app.js

CACHE
=====
js/app.js?v=84.0

After replacing:
1. Close the old localhost tab.
2. Reopen the LMS.
3. Press Ctrl+F5 once.
4. Student > My Courses.
