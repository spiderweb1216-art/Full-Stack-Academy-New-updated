LMS ROLE DASHBOARD TEST ACCOUNTS — LOCAL ONLY

This package creates 6 NEW role-specific users in the LOCAL LMS MySQL database:
Super Admin, Admin Staff, Branch Head, Branch Admin, Instructor, Student.
It does not overwrite your existing accounts, alter role permissions, or add sample classes.

1. Back up your local MySQL database.
2. Copy tools/create-role-test-users.php into your CURRENT project at tools/create-role-test-users.php.
3. Ensure XAMPP Apache/MySQL are running, your project database is installed, and at least one published Branch exists.
4. Open terminal from the project root (where api/ and tools/ reside).
5. Run using your XAMPP PHP executable, e.g. on Windows:
   C:\xampp\php\php.exe tools\create-role-test-users.php --confirm-local
   To select an existing branch by name:
   C:\xampp\php\php.exe tools\create-role-test-users.php --confirm-local "--branch=Your Branch Name"
6. Terminal prints six random passwords once. Save them privately (not in Git).
7. For Super Admin, Admin Staff, Branch Head, and Branch Admin, use Administrator Login.
   For Instructor, use Instructor Profile login; for Student, use Student Profile login.
8. When done, remove test accounts via the appropriate admin screen or your local DB.

SAFETY:
- CLI-only; cannot be called through a browser.
- Rejects remote DB host values. Only localhost/127.0.0.1/::1 supported.
- Does not embed usernames/passwords in ZIP.
- Do NOT commit the test-user script or generated credentials to Git/deploy it.
- Any role page needing real assigned courses, batches, or students may look empty until related data is added.
- This script has not been run against your localhost database from this chat.
