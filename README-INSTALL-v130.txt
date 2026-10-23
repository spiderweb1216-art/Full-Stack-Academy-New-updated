Full Stack Academy LMS — v130 Physical Course Lesson Builder
=========================================================

WHAT THIS REPLACES
------------------
An Elementor-inspired private-page builder for physical/offline courses inside
your existing admin UI. The LEFT sidebar provides a draggable widget picker,
search and module/lesson outline. The RIGHT area edits the selected lesson.
The enrolled student's private page displays the selected lesson on the left
and a Coursera-style MODULE / LESSON table of contents on the right.

This update preserves the existing burgundy/cream template. No new standalone
pages, new colour palette, or database reset are required.

INSTALL — IMPORTANT
-------------------
1) BACK UP your working project and export your MySQL database.
2) This package supersedes v127 UI and v129 PHP compatibility fixes.
   You do NOT need to reinstall v123-v129 one by one.
3) Extract the ZIP. Copy each of these 8 files into your ACTUAL, RUNNING LMS
   project root, preserving the folder names, then allow file replacement:

   admin/index.html
   admin/js/admin.js
   admin/css/physical-pages.css
   index.html
   js/app.js
   css/physical-pages.css
   api/index.php
   api/lib/PhysicalCourses.php

   Do NOT place the entire extracted top-level folder into your project.
   Do NOT replace the MySQL database or api/config/database.php.
4) Restart the local PHP server. Open the admin and press Ctrl+Shift+R.
5) Courses > Physical Courses > Build page / Edit content.
6) Select an existing lesson, add a widget, save, reopen and verify it persists.
7) In Preview, check module headings and lesson links. Test as an ENROLLED
   physical-course learner to verify required quiz and assignment gates.

WHAT'S NEW
----------
* Left: searchable 10-widget palette with drag/drop and click-to-add:
  banner, heading, text, highlight, divider, image, gallery,
  link/download, quiz, assignment.
* Left: grouped course structure; new/rename modules; add lesson/quiz/
  assignment; move, select and reorder lessons.
* Right: per-lesson title, module heading, lesson/quiz/assignment type,
  description, draggable widgets, edit/duplicate/delete lesson, save.
* New quiz/assignment lessons include their matching widget automatically.
* Each quiz/assignment block supports the OPTIONAL required-submission
  setting. The backend enforces these locks; frontend shows progress.
* Learner TOC uses module headings and lesson/quiz/assignment titles;
  a future empty lesson cannot bypass an earlier required checkpoint.
* Admin preview preserves the course page content LEFT and TOC RIGHT.
* Physical private pages remain admin-managed. Recorded and Live course
  private content remains instructor-managed, admin preview-only.

DATA COMPATIBILITY
------------------
* Supports your older physical_course_pages.page_json column and v128-style
  sections_json column, using the v129 detection and save logic.
* All existing pages remain stored in physical_course_pages.
* New module, kind and description fields are added INSIDE each JSON section;
  this requires NO MySQL ALTER TABLE.
* Old sections without module/kind become Course introduction lessons; a
  legacy quiz-only or assignment-only section receives the corresponding type.
* Existing attachments/quiz answers remain preserved by the normalizer.
* No sample course data is overwritten. New blank page still uses the existing
  single demonstration page behaviour from v127.

TESTS PERFORMED
---------------
PASS: php -l on both PHP files; node --check on both JS files.
PASS: Browser mock tests: widget search, lesson selection, quiz editing,
      new lesson, new assignment, gallery drag/drop, required checkbox,
      Save API, grouped preview and responsive layout.
PASS: Student browser mock: module/lesson navigation, required quiz unlock,
      empty-lesson protection, assignment submission and completion.
PASS: 21 PHP schema/normalization tests with a fake PDO, including legacy
      JSON exported from the user's SQL and modern/mixed columns.
NOT TESTED: Real MySQL integration on your XAMPP setup or live user sessions.
If a backend error persists, check the local PHP error log and ensure
that the replacement files are in the project your PHP launcher runs.

LIMITATIONS
-----------
* Gallery and image media references are URLs / Media Library selections.
* Drag-and-drop is primarily for desktop; ↑/↓ controls are keyboard/mobile
  alternatives. Individual quizzes are single-correct-answer and written
  assignments require 10+ characters. Instructor grading is not included
  in this physical page widget system.
