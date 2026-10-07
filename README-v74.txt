FSA Student Dashboard Clean Admin Layout v74

This fixes the Student dashboard shown in your screenshot.

Changes
-------
- Dashboard colors now come from backend Theme Colors instead of hard-coded maroon.
- Sidebar uses backend --brand-deep / --brand.
- Topbar, cards, text, borders, pink surfaces and success color use backend theme variables.
- Removes duplicate "Welcome back" from the sticky topbar; topbar now says Overview.
- Keeps the main Welcome heading only in the page content.
- Fixes huge Browse Courses and Sign Out icons in the left sidebar.
- Hides the public Accessibility and Language floating widgets while inside dashboards,
  matching the Admin dashboard.
- Uses the Admin dashboard logo first when one is configured.
- Student initials/avatar are visible correctly.
- Replaces the oversized Live Classes block on the Overview page with a compact admin-style panel.
- Overview layout is now:
    4 metrics
    Continue Learning | Live Classes
    Recent Orders     | Learning Summary
    Recommendations
- Full Live class list remains in the dedicated Live Classes page.

Replace only
------------
js/app.js

Zoom files remain unchanged.
Press Ctrl+F5 after replacing.
