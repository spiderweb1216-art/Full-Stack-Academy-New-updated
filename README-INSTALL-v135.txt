FSA LMS v135 — ONE COURSE, SEPARATE PHYSICAL / RECORDED / LIVE OFFERINGS

INSTALL ON TOP OF v134 + v133
1. Back up website files and MySQL database.
2. Copy and replace these four existing files in your running project:
   js/app.js
   css/returning-checkout.css
   admin/js/admin.js
   admin/css/physical-pages.css
3. Restart local PHP server if needed. Press Ctrl+Shift+R on frontend/admin.

USAGE:
- Admin > Physical Courses > Add Physical Course creates a new course record.
- Admin > Recorded Courses > "Already offer this subject in another format?" > choose an existing Physical course > Offer as Recorded. Edit recorded public information and Save Public Page.
- Both admin category lists then contain the course ID; each one edits its own mode-specific public content.
- The public catalog shows separate cards for Physical / Recorded / Live with their own images, descriptions, durations and prices.
- Frontend card links include #/course/{slug}?mode=classroom|recorded|live, so the selected public format is opened immediately and remains selected on refresh.
- Student purchases/enrollments are keyed by course ID AND delivery mode; they are not merged.
- Recorded/Live private content stays instructor-managed; Physical private content stays admin-managed.
- This adds no new standalone pages, no database migrations and no change to your color palette.

IMPORTANT: Enable a second format using the shortcut instead of creating a duplicate named course. Newly enabled modes need their own public page content authored before publishing to learners.
If your formats are intentionally completely unrelated products, creating a separate course with a unique slug is still possible.

VERIFICATION: JavaScript parsing and mocked browser navigation checks can be run in QA; actual XAMPP/MySQL integration not available in this environment.
