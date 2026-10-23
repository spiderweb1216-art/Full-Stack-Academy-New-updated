FSA LMS v134 — RETURNING LEARNER PURCHASE & ENROLLMENT EXPERIENCE

INSTALL OVER v133 + v131 PUBLIC SITE
Back up your site and database before replacing files. Copy these paths into your *running* LMS folder:
  index.html
  js/app.js
  css/returning-checkout.css (new stylesheet in existing css folder)
  api/index.php

Important: API index.php includes v133 physical quiz features and the v131 public course backend changes already present in the v133 API. Keep your existing api/lib/PhysicalCourses.php from v133.

BEHAVIOUR
- Public course page checks the signed-in learner's current enrollment by course ID AND delivery mode.
- Active and completed → Open My Course; restricted → Manage My Access; pending → View Order; otherwise Add Course.
- Course listings show View Course rather than Add when any format has a purchased/pending enrollment, letting the learner choose formats on details.
- Old cart selections already owned/pending are removed on the next student sync, and checkout endpoint continues to reject duplicates.
- Returning buyer after any previous order: stored billing is displayed, editable on demand; otherwise first checkout collects billing.
- Checkout is a *payment request* using UPI/bank/branch; it does NOT charge money directly.
- The backend reuses previous billing only when the request comes from that same signed-in student, looked up using their user ID.
- No new standalone pages. No database migration. Same website branding.

TEST LOCALLY
1. Student owns Physical only: Physical detail shows Open My Course, Recorded is still purchasable.
2. Student pending Recorded: Recorded displays View Order, no duplicate allowed.
3. Student with an earlier order: checkout shows saved details and payment choices; edit details works.
4. New student without an order: checkout asks for contact/address and payment.
5. Log out: no private ownership information appears.
6. Admin activates/approves enrollment: revisit course detail and confirm correct CTA.

LIMITATIONS
Only frontend + PHP syntax were checked here. The actual MySQL server and live payment/approval integrations could not be exercised in this environment.
