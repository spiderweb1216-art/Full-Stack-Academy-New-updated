Full Stack Academy LMS v93 — Classroom Popup + Recording Parity Fix

Changes:
- Rebuilt Instructor/Student classroom modal shell with fixed premium header, dedicated scroll body and sticky action footer.
- Responsive assignment/quiz popups with controlled max height; page behind modal is locked.
- Added clean custom file upload fields and selected filename display.
- Improved assignment brief, attachment, previous submission and grading presentation.
- ESC and backdrop close classroom modals safely.
- Student recording feed now uses the same course_recordings inventory as the instructor side for entitled courses.
- Processing recordings are shown to students (not silently removed) and become playable when their URL/status becomes ready.
- Enrollment access rules are still enforced before any recording row is returned to a student.
- Cache version updated to 93.0.
