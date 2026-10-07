FULL STACK ACADEMY LMS — v97 YouTube Recorded Lecture Test Data
===============================================================

What changed
------------
This build adds four published YouTube-based DEMO lectures to the existing
Recorded Lectures system for testing.

The seed does NOT change any access rules:
- It only selects a published course that is already assigned to an instructor.
- It prefers the Business Analyst course when available.
- The existing instructor course ownership rules remain unchanged.
- Students still need an active/completed enrollment in that course.
- Super Admin keeps global access through the existing admin rules.
- No new user, enrollment, course ownership, or permission is created.

Demo lectures
-------------
1. Demo 01 — SQL Foundations
2. Demo 02 — SQL Practice & Interview Questions
3. Demo 03 — Python Data Analysis for Excel Users
4. Demo 04 — Pandas Data Analysis Projects

They use normal YouTube watch URLs. The current recorded lecture player converts
YouTube links into embedded players automatically.

How it seeds
------------
The API performs a one-time seed on the first normal request after replacement.
If no course is assigned to an instructor yet, it does nothing and will try again
on a later request after a course is assigned.

Only file changed from v96
--------------------------
api/index.php

No manual SQL import is required.
