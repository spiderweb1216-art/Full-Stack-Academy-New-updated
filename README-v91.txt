FULL STACK ACADEMY LMS — v9.1 COURSEWORK + PREMIUM DASHBOARD
============================================================

This package is based on the v90 Zoom-fixed build. The v90 Zoom files and behavior are preserved.

WHAT IS NEW
-----------
1. Course Assignments
   - Every instructor-assigned course can have assignments.
   - Course card now has a direct "Add Assignment" action.
   - Assignment can be attached to the whole course or a lesson.
   - Supports title, instructions, due date, points, status and instructor attachment.
   - Students can submit a written answer, a file, or both.
   - Students can resubmit.
   - Instructor sees submissions and can grade them with feedback.
   - Student sees submitted/graded state and grade/feedback.

2. Multi-step Quizzes
   - Every instructor-assigned course can have quizzes.
   - Course card now has a direct "Add Quiz" action.
   - Supports MCQ and True/False questions, points, due date and attempt limit.
   - Student quiz UI is now question-by-question (multi-step), with Previous/Next controls and progress.
   - Student cannot continue without answering the current question.
   - Final score is calculated on the server automatically.
   - Result screen shows total percentage and per-question correct/wrong review.
   - Attempt limits are enforced on the server.
   - Instructor quiz list now shows students, attempts, average score and best score analytics.
   - Instructor also gets a student-results table with each automatic score and submission time.

3. Student Coursework Dashboard
   - New "My Quizzes" page.
   - New "My Assignments" page.
   - Student dashboard shows open coursework and deadlines.
   - Course-specific quiz/assignment links open the correct private classroom item directly.
   - Best quiz score, attempt usage, assignment submission state and grades are shown from MySQL data.

4. Premium Internal Dashboard Refresh
   - Existing Full Stack Academy burgundy/cream styling is preserved.
   - Student dashboard reorganized into hero, live-class notice, metrics, continue-learning, coursework, progress and achievements.
   - Instructor dashboard reorganized into a premium teaching workspace with metrics, quick actions, recent coursework, classroom status and upcoming live classes.
   - Dashboard cards, navigation, spacing, mobile responsiveness and visual hierarchy improved.
   - Existing Live Classes / Zoom workflow remains available.

FILES CHANGED
-------------
index.html
js/app.js
css/styles.css
api/index.php
README-v91.txt

DATABASE
--------
No manual SQL import is required for the coursework feature on an existing v90 installation. api/index.php already creates the quiz, quiz-attempt, assignment and assignment-submission tables when missing.

REPLACE / INSTALL
-----------------
1. Back up the current project.
2. Replace the files above while preserving their folders.
3. Close old LMS tabs.
4. Reopen the site and press Ctrl+F5 once.
5. Sign in as an instructor and open My Courses.
6. Use "Add Quiz" or "Add Assignment" on a course.
7. Sign in as an enrolled student to test My Quizzes / My Assignments.

VALIDATION PERFORMED
--------------------
- js/app.js: Node JavaScript syntax check passed.
- api/index.php: PHP syntax check passed.
- zoom-room.php: PHP syntax check passed.
- live-class.php: PHP syntax check passed.
- index.html cache versions bumped to v91.0 for CSS and JavaScript.

NOTE
----
A real end-to-end browser test using your MySQL student/instructor accounts still needs to be performed on your local/server environment, because those private database accounts are not available inside this build environment.
