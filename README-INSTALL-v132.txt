FULL STACK ACADEMY LMS — PHYSICAL COURSE MODULE BUILDER v132
========================================================
PURPOSE
-------
A module-first builder inside the EXISTING Physical Courses > Build Page.
No standalone pages or new colours. The Public Page editors for Physical,
Recorded and Live from v131 remain intact. Private Recorded and Live pages
remain instructor-managed/admin view-only.

WHAT THE USER SEES
------------------
LEFT — COURSE STRUCTURE (top) and WIDGET PICKER (below)
* An empty physical private page starts with Add Module 01.
* Clicking it automatically creates Module 01 with Lesson 01 selected.
* Type a module heading inline. Each module has its own + Lesson, + Quiz,
  + Assignment controls; add any number of each up to existing backend limits.
* Each new module added at the very bottom starts with Lesson 01; the button
  advances to Add Module 02, 03, etc. based on the course's module count.
* Select lessons; move lessons within module via arrows or drag to another
  module. Use module arrows to reorder entire modules; duplicate/delete
  individual items. Last item inside a module cannot be deleted or dragged
  out without adding a replacement first.
* The widget palette stays on the left. Search or drag any widget into the
  active lesson, quiz or assignment, and reorder widgets with drag / arrows.
RIGHT — SELECTED ITEM EDITOR
* Edit the lesson/quiz/assignment title, optional intro and its widgets.
* Quiz and assignment items create their relevant widget automatically.
* Quiz and assignment widget retains optional Required Submission gate.
* Save works for a blank Lesson 01 scaffold (no widget yet), so editors can
  outline their course before adding lesson content.
* Existing saved sections are loaded as groups from their module strings;
  previously saved lessons, images and assessments are not discarded.

INSTALLATION (v132 OVER v131)
-----------------------------
1. BACK UP your running project and export your MySQL database first.
2. Extract the ZIP. Copy JUST the following 4 files to the corresponding
   locations in your ACTUAL RUNNING LMS PROJECT, choosing Replace:

      admin/index.html
      admin/js/admin.js
      admin/css/physical-pages.css
      api/index.php

   Keep your existing api/lib/PhysicalCourses.php from the earlier v129/v130
   update: this package does not replace that file.
3. Restart your PHP localhost launcher and press Ctrl+Shift+R in admin.
4. Open Courses > Physical Courses > Build page / Edit content.
5. For a new private page: Add Module 01 -> type Lesson title -> Save.
6. Add a second module and verify it automatically includes Lesson 01.
7. Add a quiz and assignment inside the desired module. Set their questions/
   instructions and optional Required Submission, then Save.
8. Verify the private-page preview and test lesson progression as an
   enrolled physical-course learner.

DATA & PERMISSIONS
------------------
No database import and no database reset. The backend still uses the existing
physical_course_pages JSON format, including page_json / sections_json
compatibility supplied by v129/v130. Module title, type, and intro are
section JSON properties. The included api/index.php is based on v131, with
only a physical course save validation adjustment to allow empty lesson
scaffolds. Existing role checks remain in place.

LIMITATIONS / NOTES
-------------------
* At least one module and one item are required to save. The last module
  cannot be deleted from the editor (replace/rename its contents instead).
* A quiz containing a question widget must have a question and at least two
  non-empty answer options to be saved. Empty lesson scaffolds are allowed.
* Individual assessment widgets are multiple-choice (single correct answer)
  or text assignment; instructor grading is NOT included here.
* Drag & drop is optimized for desktop; arrows and buttons also work on mobile.
* Browser tests used simulated API responses. Live PHP/MySQL integration on
  your local XAMPP installation has not been verified. If a PHP error occurs,
  see localhost PHP server output / XAMPP logs.
* Any unsaved changes must be saved before leaving the builder. Preview
  shows the last SAVED version.

This patch changes NO other pages, site colours, existing course data,
public course editor fields, or Recorded / Live private management.
