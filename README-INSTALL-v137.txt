FSA Course Types v137 — installation (over v136)

Adds Courses → Course Types as a separate settings screen with one row per course.
Checking Physical / Recorded / Live activates that offering; unchecking deactivates
its listing and prevents new purchases. All three can be unchecked (Deactivated).
No pages, lessons, student enrollments, orders, or payment records are deleted.
Enrolled learners keep access through their existing entitlement.

Back up your database and current files. Replace these files in the actual
LMS project folder serving localhost:
  admin/index.html
  admin/js/admin.js
  admin/css/physical-pages.css
  api/index.php
  api/lib/PhysicalCourses.php
  js/app.js
Restart PHP/localhost, hard-refresh Ctrl+Shift+R, then open Admin → Courses → Course Types.

No SQL import is needed. The existing courses.delivery_modes_json column stores
an explicit disabled marker ["disabled"] when all formats are off. Older legacy
rows with [] continue falling back to their previous primary delivery mode.

Known limitations:
* Actual Windows/XAMPP/MySQL integration has not been run in this workspace.
* Deactivated formats remain visible in historical learner purchase/lesson data.
* Other independently published CMS pages are unaffected.
