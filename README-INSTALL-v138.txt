Full Stack Academy LMS — Public Course Editor v138

WHAT CHANGED
- Physical, Recorded, Live public-page editors now show only real public course elements: identity, format-specific image/price, overview/outcomes/requirements/audience, and module/lesson syllabus.
- Removed Projects, Course Reviews and per-course FAQ editors from the course popup, and removed their corresponding course-detail sections. These saved fields are PRESERVED in the database, not deleted.
- Course curriculum editor now uses inline module cards with Add Lesson, Remove, Move Up/Down and Add Module. A draft Module 01 with Lesson 01 appears for formats with no saved public syllabus.
- Each delivery format keeps its own public modules. Existing private lessons remain separate and are never used as public curriculum fallback.
- Global Courses listing reviews/Help FAQ functionality is not changed.

INSTALL
1. BACK UP website files and database first.
2. Extract this ZIP into your running LMS project preserving folders. Replace admin/index.html, admin/js/admin.js, js/app.js and add admin/css/public-modules.css.
3. Restart PHP/XAMPP if needed and use Ctrl+Shift+R.
4. Check Courses > Physical / Recorded / Live > Edit Public Page; test a module and save. Check its corresponding frontend public page.

NO DATABASE MIGRATION. Existing stored project, review and FAQ values remain in the database but are not shown on the course detail page/editor.
IMPORTANT: The empty starter module is only in the editor until Save; existing published content is not overwritten just by opening the editor.
TESTING LIMITATIONS: Syntax and local simulated browser tests only; verify with your actual PHP+MariaDB instance before production.
