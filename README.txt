INSTALL - Physical Lesson Rich Editor

Back up all four existing files first.
Replace admin/index.html, admin/js/admin.js, js/app.js, api/lib/PhysicalCourses.php.
Add admin/css/physical-rich-editor.css.
Keep other files intact.

Features:
- Text widget toolbar: headings, bold, italic, lists, links and inline/fenced code (Markdown-based editing with live preview).
- Separate Code Block widget: paste original source and select language; student page renders monospaced dark code panel.
- Existing private lesson save and enrollment permissions retained. No schema migration.
- Only Text and Code widgets changed. Other widgets continue as before.

IMPORTANT: this is a Markdown toolbar with a live preview, not a full visual WYSIWYG/Monaco editor. Code blocks use basic token-level highlighting for common keywords, strings, comments and numbers (not a full language parser). This avoids unsafe rendering of pasted HTML.
Test save + reload + student view before deploying. Local database/browser integration was not tested.
