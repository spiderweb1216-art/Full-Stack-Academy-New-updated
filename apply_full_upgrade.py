from pathlib import Path
import re

root=Path('/mnt/data/fsa_full_upgrade')

# ---------------- Main index ----------------
p=root/'index.html'
s=p.read_text(encoding='utf-8')
# CSS
if 'css/premium-ui.css' not in s:
    s=s.replace('<link rel="stylesheet" href="css/super40.css?v=25.0">','<link rel="stylesheet" href="css/super40.css?v=25.0">\n  <link rel="stylesheet" href="css/premium-ui.css?v=26.0">')
else:
    s=re.sub(r'css/premium-ui\.css\?v=[^"\']+', 'css/premium-ui.css?v=26.0', s)
# Announcement wording
s=s.replace('Admissions open for classroom, live-online and LMS-supported technology programs.','Admissions open for Live Streamed, Recorded and Offline Classroom technology programs.')

course_mega='''<div class="nav-mega nav-mega-courses">
          <a class="nav-mega-trigger" href="#/courses" data-nav="courses" aria-haspopup="true">Courses <span aria-hidden="true">+</span></a>
          <div class="course-mega-menu" aria-label="Technology courses and learning modes">
            <div class="course-mega-panel">
              <div class="course-mega-main">
                <div class="course-mega-head"><div><span class="course-mega-kicker">Career Technology Tracks</span><h3>Choose what you want to master.</h3></div><a href="#/courses">View all courses →</a></div>
                <div class="course-mega-grid">
                  <a class="course-mega-item" href="#/courses?q=Artificial%20Intelligence"><span class="mega-icon" data-premium-icon="ai"></span><span><strong>AI &amp; Machine Learning</strong><small>AI Specialist · ML · Generative AI</small></span></a>
                  <a class="course-mega-item" href="#/courses?q=Data"><span class="mega-icon" data-premium-icon="chart"></span><span><strong>Data &amp; Analytics</strong><small>Data Science · Analyst · Azure Data</small></span></a>
                  <a class="course-mega-item" href="#/courses?q=Web"><span class="mega-icon" data-premium-icon="code"></span><span><strong>Web &amp; App Development</strong><small>MERN · ASP.NET · React Native</small></span></a>
                  <a class="course-mega-item" href="#/courses?q=AWS"><span class="mega-icon" data-premium-icon="cloud"></span><span><strong>Cloud &amp; DevOps</strong><small>AWS · DevOps · Cloud engineering</small></span></a>
                  <a class="course-mega-item" href="#/courses?q=SOC"><span class="mega-icon" data-premium-icon="shield"></span><span><strong>Cybersecurity &amp; Testing</strong><small>SOC Analysis · Software Testing</small></span></a>
                  <a class="course-mega-item" href="#/courses?q=Digital%20Marketing"><span class="mega-icon" data-premium-icon="megaphone"></span><span><strong>Digital &amp; Business</strong><small>Digital Marketing · Business Analyst</small></span></a>
                </div>
              </div>
              <div class="course-mega-modes">
                <span>Learn Your Way</span>
                <a class="course-mega-mode" href="#/courses?mode=live"><span class="mega-icon" data-premium-icon="radio"></span><span><b>Live Streamed</b><small>Instructor-led online</small></span></a>
                <a class="course-mega-mode" href="#/courses?mode=recorded"><span class="mega-icon" data-premium-icon="play"></span><span><b>Recorded</b><small>Flexible self-paced access</small></span></a>
                <a class="course-mega-mode" href="#/courses?mode=classroom"><span class="mega-icon" data-premium-icon="classroom"></span><span><b>Offline Classroom</b><small>Learn at an FSA branch</small></span></a>
              </div>
              <aside class="course-mega-quick">
                <span>Quick Access</span>
                <a href="#/batches"><span class="mega-icon" data-premium-icon="calendar"></span>Upcoming Batches</a>
                <a href="#/courses?mode=recorded"><span class="mega-icon" data-premium-icon="play"></span>Recorded Courses</a>
                <a href="#/contact"><span class="mega-icon" data-premium-icon="help"></span>Course Guidance</a>
                <p>Compare schedules, learning modes and career-focused programs without leaving the academy website.</p>
              </aside>
            </div>
          </div>
        </div>'''
s=s.replace('        <a href="#/courses" data-nav="courses">Courses</a>', '        '+course_mega, 1)
# Placement indexes -> premium icons
s=s.replace('<span class="placement-nav-index">01</span>', '<span class="placement-nav-icon" data-premium-icon="building"></span>',1)
s=s.replace('<span class="placement-nav-index">02</span>', '<span class="placement-nav-icon" data-premium-icon="award"></span>',1)
s=s.replace('<span class="placement-nav-index">03</span>', '<span class="placement-nav-icon" data-premium-icon="users"></span>',1)
# Header Get a Call button
s=s.replace('<a class="button button-primary header-cta" href="#/contact">Get A Call</a>','<button class="button button-primary header-cta header-call-trigger" type="button" data-action="open-call-popup">Get A Call</button>',1)
# Footer pages: Events -> Batches
s=s.replace('<a href="https://fullstackacademy.in/events/" target="_blank" rel="noopener">Events</a>','<a href="#/batches">Batches</a>')
# Footer phone/email unicode => premium icons
s=s.replace('<a href="tel:+919015236236" data-site-phone-link><span aria-hidden="true">☎</span><span data-site-phone>+91 9015 236 236</span></a>', '<a href="tel:+919015236236" data-site-phone-link><span data-premium-icon="phone"></span><span data-site-phone>+91 9015 236 236</span></a>')
s=s.replace('<a href="mailto:info@fullstackacademy.in" data-site-email-link><span aria-hidden="true">✉</span><span data-site-email>info@fullstackacademy.in</span></a>', '<a href="mailto:info@fullstackacademy.in" data-site-email-link><span data-premium-icon="mail"></span><span data-site-email>info@fullstackacademy.in</span></a>')
# Footer call button popup
s=s.replace('<a class="footer-call-button" href="#/contact">Talk To Our Team <span aria-hidden="true">→</span></a>', '<button class="footer-call-button" type="button" data-action="open-call-popup"><span data-premium-icon="phone"></span> Talk To Our Team</button>')

# Mobile Courses group
mobile_course='''<div class="mobile-course-group">
          <a class="mobile-course-main" href="#/courses">Courses <span>3 Learning Modes</span></a>
          <div class="mobile-course-links">
            <a href="#/courses?mode=live"><span data-premium-icon="radio"></span><b>Live Streamed</b></a>
            <a href="#/courses?mode=recorded"><span data-premium-icon="play"></span><b>Recorded</b></a>
            <a href="#/courses?mode=classroom"><span data-premium-icon="classroom"></span><b>Offline Classroom</b></a>
            <a href="#/batches"><span data-premium-icon="calendar"></span><b>All Batches</b></a>
          </div>
        </div>'''
# only inside mobile nav, second occurrence remaining exact link
idx=s.find('      <nav class="mobile-nav">')
if idx!=-1:
    after=s[idx:]
    after=after.replace('        <a href="#/courses">Courses</a>', '        '+mobile_course,1)
    s=s[:idx]+after
# mobile placement indexes
s=s.replace('<a href="#/companies"><b>01</b> Companies</a>','<a href="#/companies"><span data-premium-icon="building"></span><b>Companies</b></a>')
s=s.replace('<a href="#/alumni"><b>02</b> Successfully Placed</a>','<a href="#/alumni"><span data-premium-icon="award"></span><b>Successfully Placed</b></a>')
s=s.replace('<a href="#/candidates"><b>03</b> Available Candidates</a>','<a href="#/candidates"><span data-premium-icon="users"></span><b>Available Candidates</b></a>')
# mobile get call
s=s.replace('<div class="drawer-footer"><a class="button button-primary button-block" href="#/contact">Get A Call</a><span id="mobileAuthAction">', '<div class="drawer-footer"><button class="button button-primary button-block" type="button" data-action="open-call-popup">Get A Call</button><span id="mobileAuthAction">')
# scripts: add premium before feature modules/app
script_marker='  <script src="js/data.js"></script>\n'
if 'js/premium-ui.js' not in s:
    s=s.replace(script_marker, script_marker+'  <script src="js/premium-ui.js?v=26.0"></script>\n')
else:
    s=re.sub(r'js/premium-ui\.js\?v=[^"\']+', 'js/premium-ui.js?v=26.0', s)
s=re.sub(r'js/candidates\.js\?v=[^"\']+', 'js/candidates.js?v=26.0', s)
s=re.sub(r'js/placements\.js\?v=[^"\']+', 'js/placements.js?v=26.0', s)
s=re.sub(r'js/super40\.js\?v=[^"\']+', 'js/super40.js?v=26.0', s)
s=re.sub(r'js/app\.js\?v=[^"\']+', 'js/app.js?v=26.0', s)
p.write_text(s,encoding='utf-8')

# ---------------- Premium UI JS enhancements ----------------
p=root/'js/premium-ui.js'; s=p.read_text(encoding='utf-8')
# Add extra premium icons once
needle="    briefcase:'<path d=\"M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2\'/>'"
# Use safer replace around briefcase closing actual text
old="    briefcase:'<path d=\"M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2\'/>'"
# actual has "/>" not escaped; insert before final briefcase line if icons missing
if "    filter:'" not in s:
    s=s.replace("    briefcase:'<path d=\"M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2\"/>'", "    briefcase:'<path d=\"M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2\"/>',\n    filter:'<path d=\"M4 5h16l-6 7v6l-4 2v-8L4 5Z\"/>',\n    chevron:'<path d=\"m8 10 4 4 4-4\"/>',\n    trend:'<path d=\"m3 17 6-6 4 4 8-9\"/><path d=\"M15 6h6v6\"/>',\n    clock:'<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>',\n    video:'<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"m10 9 5 3-5 3V9Z\"/>',\n    layers:'<path d=\"m12 2 9 5-9 5-9-5 9-5Z\"/><path d=\"m3 12 9 5 9-5M3 17l9 5 9-5\"/>'")
# If insertion failed because exact line mismatch, detect and insert before closing object using award fallback area
if "    filter:'" not in s:
    s=s.replace("    briefcase:'<path d=\"M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2\"/>'\n  };", "    briefcase:'<path d=\"M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2\"/>',\n    filter:'<path d=\"M4 5h16l-6 7v6l-4 2v-8L4 5Z\"/>',\n    chevron:'<path d=\"m8 10 4 4 4-4\"/>',\n    trend:'<path d=\"m3 17 6-6 4 4 8-9\"/><path d=\"M15 6h6v6\"/>',\n    clock:'<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>',\n    video:'<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"m10 9 5 3-5 3V9Z\"/>',\n    layers:'<path d=\"m12 2 9 5-9 5-9-5 9-5Z\"/><path d=\"m3 12 9 5 9-5M3 17l9 5 9-5\"/>'\n  };")
# extend scroll selectors
s=s.replace("const scrollSelectors='.fsa-course-mode-tabs,.fsa-batch-shift-tabs,.fsa-batch-filters>div,.fsa-batches-filter-scroll,.candidate-active-filters,.company-track-tags,.candidate-skills,.s40-chip-list';", "const scrollSelectors='.fsa-course-mode-tabs,.fsa-batch-shift-tabs,.fsa-batch-filters>div,.fsa-batches-filter-scroll,.candidate-active-filters,.company-track-tags,.candidate-skills,.s40-chip-list,.batch-filters,.mobile-course-links';")
p.write_text(s,encoding='utf-8')

# ---------------- Premium CSS additions ----------------
p=root/'css/premium-ui.css'; s=p.read_text(encoding='utf-8')
append='''\n\n/* v26 — unified mobile course nav, independently scrollable filter panels, premium branch footer */
.mobile-course-group{display:grid;gap:7px}.mobile-course-main{display:flex!important;align-items:center!important;justify-content:space-between!important}.mobile-course-main span{color:#9c7f85;font:700 8px Inter,sans-serif;text-transform:uppercase;letter-spacing:.08em}.mobile-course-links{display:flex;gap:7px;overflow-x:auto;padding:0 1px 4px;scrollbar-width:none}.mobile-course-links::-webkit-scrollbar{display:none}.mobile-course-links a{flex:0 0 auto;display:flex!important;align-items:center!important;gap:7px!important;padding:8px 10px!important;border:1px solid #ecdee1!important;border-radius:11px!important;background:#fbf7f8!important;color:#5c444a!important}.mobile-course-links a>span{width:28px;height:28px;border-radius:8px;background:#f1e2e6;color:var(--fsa-brand)}.mobile-course-links a b{font:600 9px Poppins,sans-serif}
.mobile-placement-links a{display:flex!important;align-items:center!important;gap:8px!important}.mobile-placement-links a>[data-premium-icon]{width:29px;height:29px;border-radius:9px;background:#f4e8eb;color:var(--fsa-brand)}
.candidate-sidebar .candidate-check-list,.candidate-filter-panel .candidate-check-list,.placement-filter-panel .candidate-check-list,.candidate-filter-options{max-height:290px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none;padding-right:2px}.candidate-sidebar .candidate-check-list::-webkit-scrollbar,.candidate-filter-panel .candidate-check-list::-webkit-scrollbar,.placement-filter-panel .candidate-check-list::-webkit-scrollbar,.candidate-filter-options::-webkit-scrollbar{display:none;width:0}
.branch-footer .premium-branch-footer-grid{display:grid;grid-template-columns:1.35fr .72fr .72fr .9fr;gap:36px;padding:45px 0}.branch-footer .premium-branch-footer-top{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:20px 0;border-bottom:1px solid rgba(255,255,255,.1)}.branch-footer .premium-branch-footer-top>div{display:flex;flex-wrap:wrap;gap:8px}.branch-footer .footer-mode-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(255,255,255,.06);color:#f0dce0;font:600 8px Inter,sans-serif}.branch-footer .footer-mode-chip [data-premium-icon]{width:17px}.branch-footer .footer-about .footer-call{border:0!important;cursor:pointer;font:600 10px Poppins,sans-serif}.branch-footer .footer-bottom .site-shell{display:flex;justify-content:space-between;align-items:center;gap:18px}.branch-footer .footer-policy-inline a{display:inline-flex;align-items:center;gap:5px}.branch-footer .footer-grid h3{margin-bottom:13px}.branch-footer .footer-grid>div>a{margin:6px 0}.branch-footer .footer-contact-premium a{display:flex!important;align-items:center!important;gap:8px!important}
.site-footer .footer-call-button{cursor:pointer;font:600 10px Poppins,sans-serif}.site-footer .footer-contact-chips [data-premium-icon]{width:16px;height:16px}.site-footer .brand-logo,.branch-footer img{image-rendering:auto}
/* keep desktop header elegant with one unified icon system */
.desktop-nav .course-mega-menu svg,.desktop-nav .placement-nav-menu svg{stroke-width:1.65}.desktop-nav .nav-mega-trigger>span{font-size:13px}.header-actions .header-call-trigger{white-space:nowrap}
@media(max-width:980px){.branch-footer .premium-branch-footer-grid{grid-template-columns:1fr 1fr}.branch-footer .premium-branch-footer-top{align-items:flex-start;flex-direction:column}}
@media(max-width:620px){.branch-footer .premium-branch-footer-grid{grid-template-columns:1fr;padding:34px 0}.branch-footer .footer-bottom .site-shell{align-items:flex-start;flex-direction:column}.branch-footer .premium-branch-footer-top>div{width:100%;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}.branch-footer .footer-mode-chip{flex:0 0 auto}}
'''
if 'v26 — unified mobile course nav' not in s: s += append
p.write_text(s,encoding='utf-8')

# ---------------- JS feature files ----------------
# candidates: premium icon global + source link local
p=root/'js/candidates.js'; s=p.read_text(encoding='utf-8')
s=s.replace("  function icon(name) {\n    const paths = {", "  function icon(name) {\n    const premiumMap={close:'x',external:'award'};\n    if(window.FSA_UI?.icon)return window.FSA_UI.icon(premiumMap[name]||name,'candidate-premium-icon');\n    const paths = {")
s=s.replace('        <a class="candidate-source-link" href="${SOURCE_URL}" target="_blank" rel="noopener" title="Open the original FSA placement listing">Source ${icon(\'external\')}</a>', '        <a class="candidate-source-link" href="#/companies" title="Explore Full Stack Academy placement network">Placement Network ${icon(\'arrow\')}</a>')
p.write_text(s,encoding='utf-8')

# placements premium icon global
p=root/'js/placements.js'; s=p.read_text(encoding='utf-8')
s=s.replace("  function icon(name) {\n    const paths = {", "  function icon(name) {\n    const premiumMap={close:'x',trend:'trend'};\n    if(window.FSA_UI?.icon)return window.FSA_UI.icon(premiumMap[name]||name,'placement-premium-icon');\n    const paths = {")
p.write_text(s,encoding='utf-8')

# super40 external actions => local popup/contact
p=root/'js/super40.js'; s=p.read_text(encoding='utf-8')
s=s.replace('<a class="button button-primary button-lg" href="https://fullstackacademy.in/super40-bba-admission-enquiry-form/" target="_blank" rel="noopener">Apply / Book Now</a><a class="button button-secondary button-lg" href="https://fullstackacademy.in/wp-content/uploads/2026/07/Full-Stack-BBA-College-01.pdf" target="_blank" rel="noopener">View Official Brochure</a>', '<button class="button button-primary button-lg" type="button" data-action="open-call-popup">Apply / Book Now</button><a class="button button-secondary button-lg" href="#/contact">Request Program Brochure</a>')
s=s.replace('<a class="button button-primary" href="https://fullstackacademy.in/super40-bba-admission-enquiry-form/" target="_blank" rel="noopener">Start Admission Enquiry</a>', '<button class="button button-primary" type="button" data-action="open-call-popup">Start Admission Enquiry</button>')
s=s.replace('<a class="button button-primary button-lg" href="https://fullstackacademy.in/super40-bba-admission-enquiry-form/" target="_blank" rel="noopener">Apply Now</a>', '<button class="button button-primary button-lg" type="button" data-action="open-call-popup">Apply Now</button>')
p.write_text(s,encoding='utf-8')

# app: course mode query + local branch links/maps + resource local links + no map attribution anchors
p=root/'js/app.js'; s=p.read_text(encoding='utf-8')
s=s.replace("    if(queryParams.get('q'))state.courseFilters.query=queryParams.get('q');\n    const list=filteredCatalogCourses();", "    if(queryParams.get('q'))state.courseFilters.query=queryParams.get('q');\n    const requestedMode=queryParams.get('mode');\n    if(['all','live','recorded','classroom'].includes(requestedMode))state.courseMode=requestedMode;\n    const list=filteredCatalogCourses();")
# home branch card maps local
s=s.replace("    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address || branch.location)}`;", "    const maps = BRANCH_ROUTE_META[branch.id]?.page || `#/branches?branch=${encodeURIComponent(branch.id)}`;")
s=s.replace('href="${maps}" target="_blank" rel="noopener" aria-label="View ${escapeHtml(branch.name)} on Google Maps"', 'href="${maps}" aria-label="View ${escapeHtml(branch.name)} branch details"')
s=s.replace('href="${maps}" target="_blank" rel="noopener">Directions ${icon(\'arrow\')}</a>', 'href="${maps}">Branch Details ${icon(\'arrow\')}</a>')
# branchMapsUrl return local page/branch route
s=re.sub(r"  function branchMapsUrl\(branch, includeOrigin = false\) \{.*?\n  \}", "  function branchMapsUrl(branch, includeOrigin = false) {\n    const page = BRANCH_ROUTE_META[branch.id]?.page;\n    return page ? `${page}#location` : `#/branches?branch=${encodeURIComponent(branch.id)}`;\n  }", s, count=1, flags=re.S)
# remove new tab from local branch directory and adjust labels
s=s.replace('href="${maps}" target="_blank" rel="noopener" aria-label="Open directions to ${escapeHtml(branch.name)}"', 'href="${maps}" aria-label="Open ${escapeHtml(branch.name)} branch location"')
s=s.replace('href="${livePage}" target="_blank" rel="noopener">Visit Our Academy', 'href="${livePage}">Visit Our Academy')
s=s.replace('href="${maps}" target="_blank" rel="noopener">Locate Us Here', 'href="${maps}">View Branch Location')
s=s.replace('href="${selectedMaps}" target="_blank" rel="noopener">Open Directions', 'href="${selectedMaps}">Open Branch Location')
s=s.replace('href="${selectedMaps}" target="_blank" rel="noopener">Open Directions</a>', 'href="${selectedMaps}">Open Branch Location</a>')
s=s.replace('You can still open directions for the selected branch in your maps app.', 'You can still open the selected branch location page.')
# Course lesson resource no external click
old='''<a class="button button-secondary button-sm" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener">${icon('download')} Open</a>'''
new='''<a class="button button-secondary button-sm" href="${escapeHtml(/^https?:\\/\\//i.test(resource.url||'')?'#/contact':(resource.url||'#/contact'))}">${icon('download')} Open</a>'''
s=s.replace(old,new)
# disable Leaflet attribution clickable links on main branch finder
s=s.replace("window.L.map(mapNode,{zoomControl:true,scrollWheelZoom:false,attributionControl:true})", "window.L.map(mapNode,{zoomControl:true,scrollWheelZoom:false,attributionControl:false})")
s=s.replace("{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}", "{maxZoom:19}")
p.write_text(s,encoding='utf-8')

# ---------------- Branch detail JS local map action ----------------
p=root/'js/branch-detail.js'; s=p.read_text(encoding='utf-8')
s=re.sub(r"  const gmaps=\(origin=null\)=>\{.*?\n  \};\n  if\(directions\)directions\.href=gmaps\(\);", "  const gmaps=(origin=null)=>'#location';\n  if(directions){directions.href='#location';directions.removeAttribute('target');directions.removeAttribute('rel');}", s, count=1, flags=re.S)
s=s.replace("map=L.map(mapEl,{scrollWheelZoom:false}).setView", "map=L.map(mapEl,{scrollWheelZoom:false,attributionControl:false}).setView")
s=s.replace("{maxZoom:19,attribution:'© OpenStreetMap'}", "{maxZoom:19}")
s=s.replace("    if(directions)directions.href=gmaps(origin);", "    if(directions)directions.href='#location';")
s=s.replace("use Open Directions for navigation.", "use the branch contact details for navigation.")
s=s.replace("You can still use Open Directions.", "You can still use the branch location shown here.")
p.write_text(s,encoding='utf-8')

# ---------------- Branch pages ----------------
branches=['charminar','ameerpet','gachibowli','tolichowki']
for bid in branches:
    p=root/f'branches/fsa-{bid}/index.html'; s=p.read_text(encoding='utf-8')
    # Fonts weights / css
    s=s.replace('family=Inter:wght@400;500;600&family=Poppins:wght@500;600&display=swap','family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap')
    if '../../css/premium-ui.css' not in s:
        s=s.replace('<link rel="stylesheet" href="../../css/shared-header.css?v=25.0">','<link rel="stylesheet" href="../../css/shared-header.css?v=25.0">\n  <link rel="stylesheet" href="../../css/premium-ui.css?v=26.0">')
    else:
        s=re.sub(r'../../css/premium-ui\.css\?v=[^"\']+', '../../css/premium-ui.css?v=26.0', s)
    s=s.replace('Admissions open for classroom, live-online and LMS-supported technology programs.','Admissions open for Live Streamed, Recorded and Offline Classroom technology programs.')
    # desktop simple Courses -> mega
    branch_course=course_mega.replace('#/','../../index.html#/')
    # avoid converting branch internal href paths if any; course_mega contains only #/ routes.
    s=s.replace('          <a href="../../index.html#/courses">Courses</a>', '          '+branch_course,1)
    # Placement icon replacements first three in header
    s=s.replace('<span class="placement-nav-index">01</span>', '<span class="placement-nav-icon" data-premium-icon="building"></span>',1)
    s=s.replace('<span class="placement-nav-index">02</span>', '<span class="placement-nav-icon" data-premium-icon="award"></span>',1)
    s=s.replace('<span class="placement-nav-index">03</span>', '<span class="placement-nav-icon" data-premium-icon="users"></span>',1)
    # header call button
    s=s.replace('<a class="header-cta" href="../../index.html#/contact">Get A Call</a>', '<button class="header-cta header-call-trigger" type="button" data-action="open-call-popup">Get A Call</button>',1)
    # mobile course link
    mobile_branch_course=mobile_course.replace('#/','../../index.html#/')
    mobile_idx=s.find('<nav class="mobile-nav">')
    if mobile_idx!=-1:
        a=s[mobile_idx:]
        a=a.replace('<a href="../../index.html#/courses">Courses</a>', mobile_branch_course,1)
        s=s[:mobile_idx]+a
    # mobile placement indexes
    s=s.replace('<a href="../../index.html#/companies"><b>01</b> Companies</a>','<a href="../../index.html#/companies"><span data-premium-icon="building"></span><b>Companies</b></a>')
    s=s.replace('<a href="../../index.html#/alumni"><b>02</b> Successfully Placed</a>','<a href="../../index.html#/alumni"><span data-premium-icon="award"></span><b>Successfully Placed</b></a>')
    s=s.replace('<a href="../../index.html#/candidates"><b>03</b> Available Candidates</a>','<a href="../../index.html#/candidates"><span data-premium-icon="users"></span><b>Available Candidates</b></a>')
    s=s.replace('<div class="drawer-footer"><a class="button button-primary button-block" href="../../index.html#/contact">Get A Call</a>', '<div class="drawer-footer"><button class="button button-primary button-block" type="button" data-action="open-call-popup">Get A Call</button>')
    # location open directions local and non-target
    s=s.replace('<a class="ghost-btn" data-open-directions target="_blank" rel="noopener">Open Directions</a>', '<a class="ghost-btn" data-open-directions href="#location">Branch Location</a>')
    # Premium branch footer replace entire footer block
    footer='''<footer class="branch-footer">
    <div class="site-shell">
      <div class="premium-branch-footer-top"><a href="../../index.html#/" aria-label="Full Stack Academy home"><img src="../../assets/images/fsa-home/logo.svg" alt="Full Stack Academy" style="width:205px;height:auto"></a><div><span class="footer-mode-chip"><span data-premium-icon="radio"></span>Live Streamed</span><span class="footer-mode-chip"><span data-premium-icon="play"></span>Recorded</span><span class="footer-mode-chip"><span data-premium-icon="classroom"></span>Offline Classroom</span></div></div>
      <div class="premium-branch-footer-grid footer-grid">
        <div class="footer-about"><img src="../../assets/images/fsa-home/logo.svg" alt="Full Stack Academy"><p>Founded by industry veterans, Full Stack Academy connects practical technology learning with career preparation, flexible delivery modes and industry-focused training.</p><button class="footer-call" type="button" data-action="open-call-popup"><span data-premium-icon="phone"></span> Get A Call</button></div>
        <div><h3>Explore</h3><a href="../../index.html#/courses">Courses</a><a href="../../index.html#/batches">Batches</a><a href="../../index.html#/super40-bba">Super40 BBA</a><a href="../../index.html#/branches">All Branches</a></div>
        <div><h3>Placements</h3><a href="../../index.html#/companies">Companies</a><a href="../../index.html#/alumni">Successfully Placed</a><a href="../../index.html#/candidates">Available Candidates</a><a href="../../index.html#/about">About FSA</a><a href="../../index.html#/contact">Contact</a></div>
        <div class="footer-contact-premium"><h3>Contact Us</h3><a href="tel:+919015236236"><span data-premium-icon="phone"></span>+91 9015 236 236</a><a href="mailto:info@fullstackacademy.in"><span data-premium-icon="mail"></span>info@fullstackacademy.in</a><a href="../fsa-charminar/index.html"><span data-premium-icon="map"></span>FSA – Charminar</a><a href="../fsa-ameerpet/index.html"><span data-premium-icon="map"></span>FSA – Ameerpet</a><a href="../fsa-gachibowli/index.html"><span data-premium-icon="map"></span>FSA – Gachibowli</a><a href="../fsa-tolichowki/index.html"><span data-premium-icon="map"></span>FSA – Tolichowki</a></div>
      </div>
    </div>
    <div class="footer-bottom"><div class="site-shell"><span>© 2026 Full Stack Academy. All Rights Reserved.</span><span class="footer-policy-inline"><a href="../../index.html#/terms">Terms and Conditions</a><a href="../../index.html#/privacy">Privacy Policy</a><a href="../../index.html#/refund">Refund Policy</a></span></div></div>
  </footer>'''
    s=re.sub(r'<footer class="branch-footer">.*?</footer>', footer, s, count=1, flags=re.S)
    # scripts premium before branch detail to expose icon language early
    if '../../js/premium-ui.js' not in s:
        s=s.replace('  <script src="../../js/branch-detail.js?v=25.0"></script>', '  <script src="../../js/premium-ui.js?v=26.0"></script>\n  <script src="../../js/branch-detail.js?v=26.0"></script>')
    else:
        s=re.sub(r'../../js/premium-ui\.js\?v=[^"\']+', '../../js/premium-ui.js?v=26.0', s)
        s=re.sub(r'../../js/branch-detail\.js\?v=[^"\']+', '../../js/branch-detail.js?v=26.0', s)
    p.write_text(s,encoding='utf-8')

print('Applied v26 full-site upgrade patches.')
