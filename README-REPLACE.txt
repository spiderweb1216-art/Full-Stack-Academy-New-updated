FSA EVENTS BACKEND V10 — REPLACEMENT PACK

Replace these files using the same folder structure in your existing project.

What this update adds:
- Admin -> Events management
- Public Events archive loads published records from MySQL
- Event detail pages load every event-specific field from MySQL
- Featured event, filters, calendar, cards, related events and event navigation use backend event records
- Event title, slug, category, dates, time, location, address, image, description, registration URL, tags, gallery/media, agenda, highlights, organiser, sponsors, featured status, publish status and sort order are editable in Admin
- Four demo events are inserted automatically once
- Existing frontend Events design is retained
- Legacy js/events-data.js is no longer used by index.html

After replacement:
1. Open api/index.php?action=health once so the events table and dummy records are created.
2. Open Admin -> Events and confirm the demo events are listed.
3. Open #/events and hard refresh (Ctrl+F5).

No database reinstall is required.


V11 EVENTS FIX
- Events archive refreshes directly from public_events whenever #/events opens.
- Featured event is used for the top hero when selected; otherwise the latest dated event is used.
- Archive cards are ordered newest/latest first.
- Single event pages refresh directly from the backend via public_event?slug=... plus public_events for related/previous/next data.
- All event-specific detail content remains backend driven.


V14 EVENTS FEATURED FIX
- Exactly one manually featured event is allowed. Selecting Featured in Admin clears the previous featured event.
- Existing databases with multiple featured events are normalized automatically; the newest featured event is kept.
- If no event is featured, the latest dated published event is shown at the top and labeled Latest Event.
- The top event is excluded from the archive below by stable event identity, so it cannot duplicate.
- All remaining events stay newest-first.
