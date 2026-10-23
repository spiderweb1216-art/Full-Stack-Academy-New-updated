FSA LMS — PUBLIC COURSE PAGE / BACKEND SYNC v131
=================================================

APPLIES OVER: Full Stack Academy LMS with v130 Physical Lesson Builder installed.
NO RESET: Do NOT re-import your complete database. Do NOT delete course tables.
NO NEW SQL MIGRATION: Public modules and FAQs are saved to the existing
courses.mode_contents_json field for each delivery mode.

BEFORE INSTALLING
- Back up the entire project and export your current MySQL database.
- Make sure you are modifying the *running* project folder used by START-LOCALHOST.bat
  or your XAMPP/Hostinger document root, NOT another extracted project copy.

REPLACE THESE FIVE FILES IN MATCHING LOCATIONS:
  index.html
  js/app.js
  admin/index.html
  admin/js/admin.js
  api/index.php

Keep ALL other files from v130, especially api/lib/PhysicalCourses.php,
css/styles.css, css/physical-pages.css, and admin/css/physical-pages.css.

AFTER INSTALLING
1. Restart PHP if you use the local START-LOCALHOST script.
2. Hard-refresh (Ctrl+Shift+R) or open your page in a private browser window.
3. Go to Admin > Courses > Physical Courses > Edit (Public Page).
4. Edit overview and image, add a public syllabus module and FAQ, then Save Public Page.
5. Open View (Public Page), select Physical/Offline and confirm that data appears.
6. Repeat on Recorded Courses and Live Courses, using each category's own Edit action.

WHAT CHANGED
- Public page values now come from the saved Physical/Recorded/Live per-mode data.
- Added per-mode PUBLIC curriculum (module headings, lesson titles and durations).
  This is separate from protected Private Lessons / the Physical lesson builder.
- Added per-mode FAQ editor (question and answer). Empty FAQ sections are hidden.
- Project details now render publicly; project count reflects authored projects.
- Requirements, audience, learning hours, level and language now render publicly
  when they have values.
- Removed non-editable generic recorded-course pitch, fake learner-space preview,
  hard-coded certificate badges/checklists, hard-coded FAQs, and placeholder claims.
- Empty public sections remain hidden.
- Removed outdated / redundant public editor fields: old Private lessons display,
  Updated label, Instructor role, manual Reviews count and manual Projects count.
- Existing HTML/CSS colours, page routes, menus, enrolled-student pages and
  instructor-managed private pages are unchanged.

LEGACY CURRICULUM
Older installations displayed private-lesson titles as a public syllabus preview.
When you first edit a mode, those titles are offered as editable Public Curriculum
entries. Saving writes an independent public copy (titles and durations only).
Thereafter clearing that public curriculum hides the public syllabus without
changing the protected private lessons.

CONTENT THAT IS NOT PER-COURSE EDITABLE
Navigation labels, common CTAs, site branding, batch records, related-course
recommendations and catalogue labels are template/system features. Batch entries
and related courses already come from backend data. Website-wide copy is managed
in website settings/CMS, not the public course editor.

TESTED
- PHP and JavaScript syntax: passed.
- PHP public curriculum + FAQ normalization: passed.
- Admin edit/save for Recorded, Live with independent Physical data: browser passed.
- Public page switching Physical / Live / Recorded and hiding empty widgets: passed.
- Tests used mocked network/database payloads; LIVE MySQL on your Windows server
  could not be exercised here. Back up before installing.
