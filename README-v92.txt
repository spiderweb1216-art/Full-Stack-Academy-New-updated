FULL STACK ACADEMY LMS — v92 BACKEND LINKED DASHBOARDS
======================================================

This update sits on top of v91 and keeps the Zoom, assignments, quizzes and premium dashboard work.

MAIN FIX
--------
Instructor -> Students no longer relies only on users.instructor_id.
A student now appears when:
1. the student is directly assigned to the instructor, OR
2. the student is enrolled in any course whose instructor_user_id is this instructor.

This fixes the case where Admin has enrolled a student into an instructor's course but Instructor -> Students was empty.

INSTRUCTOR STUDENT VIEW
-----------------------
Click any student card to open a backend-linked learner record showing:
- Student ID, email, phone, branch and academic status
- Primary backend course and batch
- Fee status (read-only)
- Every enrollment for courses assigned to that instructor
- Lesson progress for those courses
- Quiz attempts, average and best score
- Assignment submissions and grades

BACKEND ACCESS ALIGNMENT
------------------------
Profile/certificate request permission checks now use the same instructor/student relationship rule, so an instructor can work with a student enrolled in the instructor's course even when users.instructor_id is empty.

Student dashboard remains PHP/MySQL-backed for:
- Enrollments
- Course access
- Progress
- Orders
- Notes
- Wishlist
- Certificates
- Live classes and recordings
- Quizzes and quiz scores
- Assignments and submissions

The frontend production flag remains FRONTEND_DEMO_MODE=false.

REPLACE THESE FILES
-------------------
index.html
js/app.js
css/styles.css
api/index.php

After replacement, close old LMS tabs and use Ctrl+F5 once. CSS/JS cache version is v92.0.
