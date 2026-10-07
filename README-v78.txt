FSA Dashboard Sidebar Root Fix v78

ROOT CAUSE FOUND
----------------
The global stylesheet contains:

  #app > * { animation: page-enter ... }
  @keyframes page-enter {
    from { transform: translateY(10px); }
    to   { transform: none; }
  }

That animation/transform is applied to .dashboard-shell.
A transformed ancestor changes the containing block for position:fixed children,
so the dashboard sidebar can scroll with the document instead of staying fixed.

v78 fixes this at the root.

FIXES
-----
- Disables the global page-enter animation on dashboard-shell.
- Forces #app and dashboard-shell to transform:none / overflow:visible.
- Removes transform/perspective/filter/contain properties that can break fixed positioning.
- After EVERY Student or Instructor dashboard render, JavaScript force-applies:
    sidebar position: fixed !important
    top: 0
    bottom: 0
    height: 100dvh
    width: 272px
    main margin-left: 272px
- Re-applies the geometry after render and browser resize.
- Mobile still uses a 280px slide-in dashboard drawer.
- Sidebar menu scrolls independently; the whole sidebar does not move.

PRESERVED
---------
- v76 Live Now / Upcoming / Previous logic
- Zoom integration
- Student dashboard
- Instructor dashboard
- Backend logic

REPLACE
-------
index.html
js/app.js

index.html loads js/app.js?v=78.0.

After replacing:
1. Close the old dashboard tab.
2. Open http://localhost/full-stack-academy/ again.
3. Ctrl+F5 once.
4. Open Instructor Profile and scroll the page.
5. The left sidebar must remain fixed from top to bottom.
