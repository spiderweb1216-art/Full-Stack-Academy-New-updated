PAGE ENTRY FILES
================

The website keeps one shared header, footer, cart, account state and router in
the root index.html. This folder provides clean, direct entry files for each
public page without duplicating the website layout or business logic.

Each file forwards visitors to the matching route in index.html:

  home.html        Home
  courses.html     Course catalogue and batches
  membership.html  Membership plans
  branches.html    Branch directory
  about.html       About Full Stack Academy
  contact.html     Contact page
  login.html       Student sign in
  register.html    Student registration
  help.html        Help centre
  terms.html       Terms and conditions
  privacy.html     Privacy policy
  refund.html      Refund policy

Individual course pages continue to use /index.html#/course/course-slug so the
same course data and admin updates remain authoritative across the website.

