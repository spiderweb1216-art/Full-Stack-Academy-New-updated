FSA Live Learning Layout v79

NEW LIVE CLASSES STRUCTURE — BOTH STUDENT AND INSTRUCTOR

1. RECORDED COURSES — TOP
   - Proper responsive course-card grid.
   - Course title.
   - Category.
   - Short description.
   - Number of recorded lectures.
   - Uses real recording/course data when available.
   - Until real recordings exist, 4 polished sample cards are shown:
       Business Analyst with Data Analytics
       AWS Cloud Engineer
       Full Stack Development
       Data Science & AI

2. LIVE NOW — MIDDLE
   STUDENT
   - Only an actually-live class appears.
   - Join Live Class opens Zoom inside LMS.
   - If no instructor has started a class: clean empty state.

   INSTRUCTOR
   - Active class shows Open Zoom Studio + End Class.
   - If a scheduled class enters the 15-minute start window, it appears as
     Ready to Teach with Start Live Class.
   - No fake Live cards.

3. ZOOM CLASSROOM
   - Appears immediately below Live Now / Ready to Teach.
   - Student: only when a class is genuinely live.
   - Instructor: when a class is live or currently ready to start.
   - Existing embedded Zoom behavior is preserved.

4. UPCOMING SCHEDULED LECTURES — BOTTOM
   - Proper responsive card grid.
   - Date block.
   - Lecture title.
   - Course title.
   - Full date/time.
   - Starts-in timing.
   - Student: Scheduled state only.
   - Instructor: Start when allowed, Edit and Delete controls.

PRESERVED
---------
- v78 fixed/sticky dashboard sidebar.
- v76 time-aware Live status logic.
- Zoom integration.
- Monthly class scheduler.
- Student enrollment checks.
- Instructor role permissions.

REPLACE
-------
index.html
js/app.js

index.html loads js/app.js?v=79.0 so the previous layout cannot remain cached.

After replacing:
1. Close the current dashboard tab.
2. Open localhost again.
3. Press Ctrl+F5 once.
4. Check Instructor > Live Classes.
5. Check Student > Live Classes.
