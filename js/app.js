window.FSA_BUILD='v134-returning-learner';
/* FSA Branches V21 — branch mega-menu markup/CSS refresh; existing routing logic preserved. */
(() => {
  'use strict';

  const D = window.FSA_DATA;
  const app = document.getElementById('app');
  const footer = document.getElementById('siteFooter');
  const header = document.getElementById('siteHeader');
  const announcement = document.getElementById('announcement');
  const mobileMenu = document.getElementById('mobileMenu');
  const cartDrawer = document.getElementById('cartDrawer');
  const searchModal = document.getElementById('searchModal');
  const toastStack = document.getElementById('toastStack');
  const scrollTopButton = document.getElementById('scrollTop');

  const LS = {
    cart: 'fsa_cart_v3',
    wishlist: 'fsa_wishlist_v3',
    user: 'fsa_user_v3',
    loggedIn: 'fsa_logged_in_v3',
    enrollments: 'fsa_enrollments_v3',
    progress: 'fsa_progress_v3',
    orders: 'fsa_orders_v3',
    notes: 'fsa_notes_v3',
    playerSelection: 'fsa_player_selection_v3',
    lectureSelection: 'fsa_lecture_selection_v5',
    announcement: 'fsa_announcement_closed_v4',
    initialized: 'fsa_initialized_v3',
    lastOrder: 'fsa_last_order_v3',
    cartModes: 'fsa_cart_modes_v1'
  };

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  // PRODUCTION MODE: authentication and academy data always use PHP/MySQL.
  const FRONTEND_DEMO_MODE = false;
  const DEMO_ACCOUNTS_KEY = 'fsa_demo_accounts_v1';
  const DEMO_SESSION_KEY = 'fsa_demo_session_v1';
  const DEMO_ENROLLMENTS_KEY = 'fsa_demo_enrollments_v1';
  const DEMO_PROGRESS_KEY = 'fsa_demo_progress_v1';
  const DEMO_ORDERS_KEY = 'fsa_demo_orders_v1';
  const DEMO_NOTES_KEY = 'fsa_demo_notes_v1';
  const DEMO_WISHLIST_KEY = 'fsa_demo_wishlist_v1';
  const API_URL = 'api/index.php';
  // Always use the local HTTP server for Admin when the public site was accidentally opened with file://.
  // Relative admin/ remains unchanged on localhost/hosting.
  const ADMIN_URL = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000/admin/index.html' : 'admin/';
  let csrfToken = '';
  let siteSettings = { academy_name:'Full Stack Academy', academy_tagline:'Learning Platform', footer_text:'', announcement_text:'', support_email:'info@fullstackacademy.in', support_phone:'+91 9015 236 236', currency_symbol:'₹', locale:'en-IN', header_logo:'', footer_logo:'', mobile_logo:'', favicon_url:'assets/favicon.svg', header_logo_width:180, footer_logo_width:190, mobile_logo_width:160, registration_enabled:true };

  const demoJsonRead = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (_) { return fallback; }
  };
  const demoJsonWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };
  const demoNow = () => new Date().toISOString();
  const demoNormalize = value => String(value || '').trim().toLowerCase();
  function demoSeedAccounts() {
    const existing = demoJsonRead(DEMO_ACCOUNTS_KEY, null);
    if (Array.isArray(existing) && existing.length) return existing;
    const seeded = [
      {
        id: 1001, role: 'student', account_type: 'student', status: 'active',
        name: 'Demo Student', email: 'student@demo.com', phone: '+91 90000 00001',
        password: 'Demo@12345', student_code: 'FSA-26-DEMO01',
        headline: 'Full Stack Academy Learner', bio: 'Frontend demo learner account.',
        city: 'Hyderabad', country: 'India', branch: 'Ameerpet', avatar: '',
        created_at: demoNow()
      },
      {
        id: 1002, role: 'instructor', account_type: 'instructor', status: 'active',
        name: 'Demo Instructor', email: 'instructor@demo.com', phone: '+91 90000 00002',
        password: 'Demo@12345', instructor_code: 'FSA-INST-DEMO01',
        headline: 'Full Stack Academy Instructor', bio: 'Frontend demo instructor account.',
        city: 'Hyderabad', country: 'India', branch: 'Ameerpet', avatar: '',
        created_at: demoNow()
      }
    ];
    demoJsonWrite(DEMO_ACCOUNTS_KEY, seeded);
    demoJsonWrite(DEMO_ENROLLMENTS_KEY, {
      'student@demo.com': [
        { course_id: 1, status: 'active', access_allowed: true },
        { course_id: 2, status: 'active', access_allowed: true }
      ]
    });
    demoJsonWrite(DEMO_PROGRESS_KEY, { 'student@demo.com': { '1': ['0-0'], '2': [] } });
    demoJsonWrite(DEMO_ORDERS_KEY, { 'student@demo.com': [] });
    demoJsonWrite(DEMO_NOTES_KEY, { 'student@demo.com': {} });
    demoJsonWrite(DEMO_WISHLIST_KEY, { 'student@demo.com': [3] });
    return seeded;
  }
  function demoSafeUser(account) {
    if (!account) return null;
    const { password, ...user } = account;
    return user;
  }
  function demoCurrentAccount() {
    const session = demoJsonRead(DEMO_SESSION_KEY, null);
    if (!session?.email) return null;
    return demoSeedAccounts().find(a => demoNormalize(a.email) === demoNormalize(session.email)) || null;
  }
  function demoCourseById(id) {
    return (window.FSA_DATA?.courses || []).find(course => Number(course.id) === Number(id)) || null;
  }
  async function demoApiRequest(action, { method = 'GET', body } = {}) {
    const payload = body instanceof FormData ? Object.fromEntries(body.entries()) : (body || {});
    const accounts = demoSeedAccounts();

    if (action === 'catalog') {
      return { success: true, site: siteSettings, courses: window.FSA_DATA?.courses || [], plans: window.FSA_DATA?.plans || [] };
    }
    if (action === 'auth_me') {
      const account = demoCurrentAccount();
      return { success: true, authenticated: !!account, user: demoSafeUser(account) };
    }
    if (action === 'auth_register') {
      const email = demoNormalize(payload.email);
      if (!email || !String(payload.password || '').trim()) throw new Error('Email and password are required.');
      if (String(payload.password || '').length < 8) throw new Error('Password must be at least 8 characters.');
      if (accounts.some(a => demoNormalize(a.email) === email)) throw new Error('An account with this email already exists.');
      if (payload.account_type && payload.account_type !== 'student') throw new Error('Instructor accounts must be created by an academy administrator.');
      const role = 'student';
      const account = {
        id: Date.now(), role, account_type: role, status: 'active',
        name: String(payload.name || 'Academy Member').trim(), email,
        phone: String(payload.phone || '').trim(), password: String(payload.password || ''),
        headline: role === 'instructor' ? 'Full Stack Academy Instructor' : 'Full Stack Academy Learner',
        bio: String(payload.bio || '').trim() || (role === 'instructor' ? 'Instructor profile.' : 'Learner profile.'),
        city: 'Hyderabad', country: 'India', branch: String(payload.branch || '').trim(), avatar: '',
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        student_code: role === 'student' ? `FSA-26-${String(Date.now()).slice(-6)}` : '',
        instructor_code: role === 'instructor' ? `FSA-INST-${String(Date.now()).slice(-6)}` : '',
        created_at: demoNow()
      };
      accounts.push(account);
      demoJsonWrite(DEMO_ACCOUNTS_KEY, accounts);
      const enrollments = demoJsonRead(DEMO_ENROLLMENTS_KEY, {}); enrollments[email] = []; demoJsonWrite(DEMO_ENROLLMENTS_KEY, enrollments);
      const progress = demoJsonRead(DEMO_PROGRESS_KEY, {}); progress[email] = {}; demoJsonWrite(DEMO_PROGRESS_KEY, progress);
      const orders = demoJsonRead(DEMO_ORDERS_KEY, {}); orders[email] = []; demoJsonWrite(DEMO_ORDERS_KEY, orders);
      const notes = demoJsonRead(DEMO_NOTES_KEY, {}); notes[email] = {}; demoJsonWrite(DEMO_NOTES_KEY, notes);
      const wish = demoJsonRead(DEMO_WISHLIST_KEY, {}); wish[email] = []; demoJsonWrite(DEMO_WISHLIST_KEY, wish);
      if (role === 'student') demoJsonWrite(DEMO_SESSION_KEY, { email });
      return { success: true, user: demoSafeUser(account), message: role === 'instructor' ? 'Instructor profile created. You can sign in now with your new demo account.' : 'Student account created successfully.' };
    }
    if (action === 'auth_login') {
      const identifier = demoNormalize(payload.identifier);
      const requestedRole = payload.account_type === 'instructor' ? 'instructor' : 'student';
      const account = accounts.find(a => a.role === requestedRole && [a.email, a.student_code, a.instructor_code].some(v => demoNormalize(v) === identifier));
      if (!account || String(account.password) !== String(payload.password || '')) throw new Error('Invalid email/academy ID or password.');
      demoJsonWrite(DEMO_SESSION_KEY, { email: account.email });
      return { success: true, user: demoSafeUser(account), message: 'Signed in successfully.' };
    }
    if (action === 'auth_logout') {
      try { localStorage.removeItem(DEMO_SESSION_KEY); } catch (_) {}
      return { success: true, message: 'Signed out successfully.' };
    }
    if (action === 'student_data') {
      const account = demoCurrentAccount();
      if (!account || account.role !== 'student') throw new Error('Student sign in required.');
      const key = demoNormalize(account.email);
      return {
        success: true, user: demoSafeUser(account),
        enrollments: demoJsonRead(DEMO_ENROLLMENTS_KEY, {})[key] || [],
        progress: demoJsonRead(DEMO_PROGRESS_KEY, {})[key] || {},
        orders: demoJsonRead(DEMO_ORDERS_KEY, {})[key] || [],
        notes: demoJsonRead(DEMO_NOTES_KEY, {})[key] || {},
        wishlist: demoJsonRead(DEMO_WISHLIST_KEY, {})[key] || [],
        certifications: [], assigned_courses: []
      };
    }
    if (action === 'instructor_data') {
      const account = demoCurrentAccount();
      if (!account || account.role !== 'instructor') throw new Error('Instructor sign in required.');
      return { success: true, user: demoSafeUser(account), students: [], profile_requests: [], certificate_requests: [], certifications: [], courses: [], live_sessions: [], quizzes: [], assignments: [], submissions: [] };
    }
    if (action === 'course_player') {
      const account = demoCurrentAccount();
      if (!account || account.role !== 'student') throw new Error('Student sign in required.');
      const course = demoCourseById(payload.course_id);
      if (!course) throw new Error('Course not found.');
      const rows = demoJsonRead(DEMO_ENROLLMENTS_KEY, {})[demoNormalize(account.email)] || [];
      if (!rows.some(row => Number(row.course_id) === Number(course.id) && ['active','completed'].includes(row.status))) throw new Error('This course is not active in your demo account.');
      return { success: true, course, classroom: { live_sessions: [], quizzes: [], assignments: [], quiz_attempts: {}, assignment_submissions: {} }, access: { allowed: true } };
    }
    if (action === 'profile_update') {
      const account = demoCurrentAccount();
      if (!account) throw new Error('Please sign in first.');
      ['name','phone','headline','bio','city','country','branch'].forEach(k => { if (payload[k] !== undefined) account[k] = String(payload[k] || '').trim(); });
      if (Array.isArray(payload.skills)) account.skills = payload.skills;
      demoJsonWrite(DEMO_ACCOUNTS_KEY, accounts);
      return { success: true, user: demoSafeUser(account), message: 'Profile updated in this browser.' };
    }
    if(action==='profile_email_request'||action==='profile_email_confirm')throw new Error('Verified email changes require the PHP backend with SMTP enabled.');
    if (action === 'profile_password') {
      const account = demoCurrentAccount();
      if (!account) throw new Error('Please sign in first.');
      if (payload.current_password && String(payload.current_password) !== String(account.password)) throw new Error('Current password is incorrect.');
      const next = String(payload.password || payload.new_password || '');
      if (next.length < 8) throw new Error('New password must be at least 8 characters.');
      account.password = next; demoJsonWrite(DEMO_ACCOUNTS_KEY, accounts);
      return { success: true, message: 'Password updated for this frontend demo account.' };
    }
    if (action === 'profile_preferences') return { success: true, message: 'Preferences saved in this browser.' };
    if (action === 'wishlist_toggle') {
      const account = demoCurrentAccount(); if (!account) throw new Error('Please sign in first.');
      const all = demoJsonRead(DEMO_WISHLIST_KEY, {}), key = demoNormalize(account.email), list = (all[key] || []).map(Number), id = Number(payload.course_id);
      const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id]; all[key] = next; demoJsonWrite(DEMO_WISHLIST_KEY, all);
      return { success: true, wishlist: next, message: list.includes(id) ? 'Removed from wishlist.' : 'Added to wishlist.' };
    }
    if (action === 'student_note_save') {
      const account = demoCurrentAccount(); if (!account) throw new Error('Please sign in first.');
      const all = demoJsonRead(DEMO_NOTES_KEY, {}), key = demoNormalize(account.email), notes = all[key] || {};
      const noteKey = String(payload.note_key || `${payload.course_id}:${payload.lesson_key || ''}`); notes[noteKey] = String(payload.note || payload.content || ''); all[key] = notes; demoJsonWrite(DEMO_NOTES_KEY, all);
      return { success: true, notes, message: 'Note saved in this browser.' };
    }
    if (action === 'student_progress_toggle') {
      const account = demoCurrentAccount(); if (!account) throw new Error('Please sign in first.');
      const all = demoJsonRead(DEMO_PROGRESS_KEY, {}), key = demoNormalize(account.email), progress = all[key] || {}, cid = String(payload.course_id), lesson = String(payload.lesson_key || payload.key || '');
      const done = new Set(progress[cid] || []); if (done.has(lesson)) done.delete(lesson); else done.add(lesson); progress[cid] = [...done]; all[key] = progress; demoJsonWrite(DEMO_PROGRESS_KEY, all);
      return { success: true, progress, message: 'Progress updated.' };
    }
    if (action === 'contact_submit') return { success: true, message: 'Demo message submitted locally. No email was sent.' };
    if (action === 'auth_forgot_password') return { success: true, message: 'Frontend demo: password-reset email is disabled. Use a demo account or create a new account.' };
    if (action === 'auth_reset_password') return { success: true, message: 'Frontend demo reset completed.' };
    if (action === 'checkout_create') {
      const account = demoCurrentAccount(); if (!account) throw new Error('Please sign in first.');
      return { success: true, message: 'Demo order created locally.', order: { id: `DEMO-${Date.now()}`, created_at: demoNow() } };
    }
    throw new Error('This action needs the real PHP/MySQL backend and is disabled in the frontend-only demo.');
  }

  async function apiRequest(action, options = {}) {
    if (FRONTEND_DEMO_MODE) return demoApiRequest(action, options);
    const { method = 'GET', body, keepalive = false, query = {} } = options;
    const requestOptions = { method, credentials: 'same-origin', headers: {}, keepalive: Boolean(keepalive) };
    if (body !== undefined) {
      if (csrfToken) requestOptions.headers['X-CSRF-Token'] = csrfToken;
      if (body instanceof FormData) requestOptions.body = body;
      else { requestOptions.headers['Content-Type'] = 'application/json'; requestOptions.body = JSON.stringify(body); }
    }
    const queryString = new URLSearchParams({ action });
    Object.entries(query || {}).forEach(([key,value]) => { if (value !== undefined && value !== null && value !== '') queryString.set(key,String(value)); });
    let response;
    try { response = await fetch(`${API_URL}?${queryString.toString()}`, requestOptions); }
    catch (_) { throw new Error('The website could not reach the backend. Check the domain, PHP and database connection.'); }
    let payload;
    try { payload = await response.json(); }
    catch (_) { throw new Error(`The website backend returned an invalid response (${response.status}).`); }
    if (payload.csrf_token) csrfToken = payload.csrf_token;
    if (!response.ok || payload.success === false) throw new Error(payload.message || 'The request could not be completed.');
    return payload;
  }

  const defaultUser = {
    name: 'Academy Learner',
    email: '',
    phone: '',
    headline: 'Full Stack Academy Learner',
    bio: 'Add a short introduction about your learning goals and professional interests.',
    city: 'Hyderabad',
    country: 'India',
    joined: new Date().toLocaleDateString(siteSettings.locale || 'en-IN', { month: 'long', year: 'numeric' }),
    avatar: '',
    weeklyGoal: 5,
    notifications: true
  };

  function allLessonKeys(course) {
    const keys = [];
    (Array.isArray(course.modules)?course.modules:[]).forEach((module, mi) => (Array.isArray(module.lessons)?module.lessons:[]).forEach((lesson, li) => keys.push(`${mi}-${li}`)));
    return keys;
  }

  if (!read(LS.initialized, false)) {
    write(LS.cart, []);
    write(LS.initialized, true);
  }

  const state = {
    cart: read(LS.cart, []),
    cartModes: read(LS.cartModes, {}),
    wishlist: [],
    user: { ...defaultUser },
    loggedIn: false,
    enrollments: [],
    studentEnrollmentRows: [],
    allEnrollmentRows: [],
    checkoutProfile: null,
    pendingEnrollments: [],
    progress: {},
    orders: [],
    notes: {},
    playerSelection: read(LS.playerSelection, {}),
    lectureSelection: read(LS.lectureSelection, {}),
    playerCourses: {},
    assignedCourses: [],
    courseView: 'grid',
    courseFilters: { query: '', categories: [], levels: [], price: [], rating: 0, sort: 'popular' },
    courseTab: 'overview',
    learnerTab: 'all',
    profileTab: 'personal',
    lessonTab: 'overview',
    recordedLessonTab: 'overview',
    coupon: null,
    currentPath: '/',
    courseMode: 'all',
    batchShift: 'all',
    batchBranch: 'all',
    batchMode: 'all',
    batchQuery: '',
    detailDeliveryMode: 'classroom'
    ,certifications: [], studentCoursework: [], studentLiveSessions: [], studentRecordings: [], studentRecordedLectures: [], selectedStudentLiveId: null, selectedInstructorLiveId: null, selectedStudentRecordingId: null, selectedInstructorRecordingId: null, liveRefreshTimer: null, instructorStartUnlockTimer: null, zoomEmbedState: 'idle', zoomEmbedLiveId: null, zoomEmbedMode: null, instructorData: {students:[],profile_requests:[],certificate_requests:[],certifications:[],courses:[],live_sessions:[],recordings:[],recorded_lectures:[],recorded_lecture_progress:[],quizzes:[],quiz_attempts:[],assignments:[],submissions:[]}
  };


  async function syncStudentData() {
    if (!state.loggedIn) {
      state.enrollments = [];
      state.studentEnrollmentRows = [];
      state.allEnrollmentRows = [];
      state.checkoutProfile = null;
      state.pendingEnrollments = [];
      state.progress = {};
      state.orders = [];
      state.assignedCourses = [];
      state.studentCoursework = [];
      state.studentLiveSessions = [];
      state.studentRecordings = [];
      state.studentRecordedLectures = [];
      return;
    }
    const result = await apiRequest('student_data');
    state.user = { ...state.user, ...(result.user || {}) };
    const enrollmentRows = result.enrollments || [];
    state.allEnrollmentRows = enrollmentRows;
    state.checkoutProfile = result.checkout_profile || null;
    state.studentEnrollmentRows = enrollmentRows.filter(item => ['active','completed'].includes(item.status) && item.access_allowed !== false);
    state.enrollments = [...new Set(state.studentEnrollmentRows.map(item => Number(item.course_id)).filter(Boolean))];
    state.pendingEnrollments = enrollmentRows.filter(item => item.status === 'pending').map(item => Number(item.course_id));
    state.progress = result.progress || {};
    state.orders = result.orders || [];
    state.notes = result.notes || {};
    state.wishlist = (result.wishlist || []).map(Number);
    state.certifications = result.certifications || [];
    state.assignedCourses = Array.isArray(result.assigned_courses) ? result.assigned_courses : [];
    state.studentCoursework = Array.isArray(result.coursework) ? result.coursework : [];
    state.studentLiveSessions = Array.isArray(result.live_sessions) ? result.live_sessions : [];
    state.studentRecordings = Array.isArray(result.recordings) ? result.recordings : [];
    state.studentRecordedLectures = Array.isArray(result.recorded_lectures) ? result.recorded_lectures : [];
    if(state.user.role==='student'){try{const extra=await apiRequest('student_profile_details');state.studentAdminProfile=extra.profile||{};}catch(error){console.warn('Student profile details unavailable',error);}}
    // PHP/MySQL is the source of truth for profile, enrollments, progress, orders, live classes and wishlist.
  }

  async function syncInstructorData() {
    if (!state.loggedIn || state.user.role !== 'instructor') return;
    state.assignedCourses = [];
    state.playerCourses = {};
    const result = await apiRequest('instructor_data');
    state.user = { ...state.user, ...(result.user || {}) };
    state.instructorData = {students:result.students||[],profile_requests:result.profile_requests||[],certificate_requests:result.certificate_requests||[],certifications:result.certifications||result.certificate_requests||[],courses:result.courses||[],live_sessions:result.live_sessions||[],recordings:result.recordings||[],recorded_lectures:result.recorded_lectures||[],recorded_lecture_progress:result.recorded_lecture_progress||[],quizzes:result.quizzes||[],quiz_attempts:result.quiz_attempts||[],assignments:result.assignments||[],submissions:result.submissions||[]};
    // Instructor identity and classroom data are loaded from PHP/MySQL.
  }

  const ICONS = {
    search: '<path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="7.5"/>',
    cart: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5m6 6-6-6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    play: '<path d="m9 6 9 6-9 6V6Z"/>',
    pause: '<path d="M9 6v12M15 6v12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3V5Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3V5Z"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    star: '<path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.7Z"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    project: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/>',
    sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14Z"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    cloud: '<path d="M17.5 19H7a5 5 0 1 1 1.3-9.8A6.5 6.5 0 0 1 21 11.5 3.5 3.5 0 0 1 17.5 19Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
    megaphone: '<path d="m3 11 15-6v14L3 13v-2Z"/><path d="m7 15 1 5h4l-1.5-4"/>',
    map: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>',
    mail: '<path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/>',
    grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    dashboard: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>',
    certificate: '<path d="M7 3h10v13H7z"/><path d="m9 16-1 6 4-2 4 2-1-6"/><path d="M10 7h4M10 10h4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    note: '<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',
    discussion: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    fullscreen: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    video: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/>',
    camera: '<path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<path d="M5 3v3M19 3v3M4 7h16v14H4zM4 10h16"/>',
    briefcase: '<path d="M4 7h16v13H4zM9 7V4h6v3M4 12h16"/>'
  };

  function icon(name, className = '', filled = false) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkles}</svg>`;
  }

  function money(value) { return `${siteSettings.currency_symbol || '₹'}${Number(value || 0).toLocaleString(siteSettings.locale || 'en-IN')}`; }
  function siteAssetUrl(value='') {
    const url=String(value||'').trim();
    if(!url) return '';
    if(/^(?:https?:|data:|blob:|\/\/)/i.test(url)) return url;
    return url.replace(/^\.?\//,'');
  }
  function applyBrandLogo(role,url,width,name){
    document.querySelectorAll(`[data-brand-role="${role}"]`).forEach(brand=>{
      const image=brand.querySelector(`[data-site-logo="${role}"]`);
      if(!image)return;
      brand.setAttribute('aria-label',`${name} home`);
      if(url){image.src=siteAssetUrl(url);image.alt=name;image.style.width=`${Math.max(48,Math.min(420,Number(width||180)))}px`;image.hidden=false;brand.classList.add('has-logo');}
      else{image.removeAttribute('src');image.hidden=true;brand.classList.remove('has-logo');}
    });
  }
  function applySiteSettings(site = {}) {
    siteSettings = { ...siteSettings, ...site };
    const name = siteSettings.academy_name || 'Full Stack Academy';
    const tagline = siteSettings.academy_tagline ?? 'Learning Platform';
    const email = siteSettings.support_email || 'info@fullstackacademy.in';
    const phone = siteSettings.support_phone || '+91 9015 236 236';
    document.querySelectorAll('[data-site-name]').forEach(node => { node.textContent = name; });
    document.querySelectorAll('[data-site-tagline]').forEach(node => { node.textContent = tagline; });
    const headerLogo=siteSettings.header_logo || 'assets/images/fsa-home/logo.svg';
    const footerLogo=siteSettings.footer_logo || headerLogo;
    const mobileLogo=siteSettings.mobile_logo || headerLogo;
    applyBrandLogo('header',headerLogo,Math.max(48,Number(siteSettings.header_logo_width||180)),name);
    applyBrandLogo('footer',footerLogo,Math.max(48,Number(siteSettings.footer_logo_width||190)),name);
    applyBrandLogo('mobile',mobileLogo,Math.max(48,Number(siteSettings.mobile_logo_width||160)),name);
    if(siteSettings.theme && window.FSA_CMS?.applyTheme) window.FSA_CMS.applyTheme(siteSettings.theme);
    const favicon=document.getElementById('siteFavicon');
    if(favicon)favicon.href=siteAssetUrl(siteSettings.favicon_url||'assets/favicon.svg')||'assets/favicon.svg';
    const footerText = siteSettings.footer_text ?? 'Career-focused technology learning with practical projects, structured pathways and expert guidance.';
    document.querySelectorAll('[data-site-footer-text]').forEach(node => { node.textContent = footerText; node.hidden = footerText.trim() === ''; });
    const announcementText = String(siteSettings.announcement_text || '').trim() || 'Admissions open for Live Streamed, Recorded and Offline Classroom technology programs.';
    document.querySelectorAll('[data-site-announcement]').forEach(node => { node.textContent = announcementText; });
    announcement.dataset.disabled = 'false';
    announcement.hidden = false;
    document.querySelectorAll('[data-site-email]').forEach(node => { node.textContent = email; });
    document.querySelectorAll('[data-site-phone]').forEach(node => { node.textContent = phone; });
    document.querySelectorAll('[data-site-email-link]').forEach(node => { node.href = `mailto:${email}`; node.setAttribute('aria-label', `Email ${name}`); });
    const phoneHref = phone.replace(/[^+\d]/g,'');
    document.querySelectorAll('[data-site-phone-link]').forEach(node => { node.href = `tel:${phoneHref}`; });
    document.title = `${name} — ${tagline}`;
  }

  function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(n => n[0]).join('').toUpperCase() || 'FS'; }
  function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char])); }
  const FSA_EXTRA_COURSES = [
    { id:101, slug:'aspnet-core', title:'ASP.NET Core', category:'Web Development', badge:'Certified', featured:false, image:'assets/images/course-v16/aspnet-core.svg', short:'Build modern, fast and secure web applications using ASP.NET Core and C#.', description:'A practical .NET web development program covering C#, ASP.NET Core MVC, Web API, Entity Framework Core, SQL Server, authentication and deployment.', price:9999, originalPrice:12999, duration:'4 Months', hours:82, lessons:40, projects:1, rating:4.6, reviews:84, students:310, level:'Intermediate', instructor:'FSA .NET Faculty', instructorRole:'Application Development Mentors', skills:['C#','ASP.NET Core','MVC','Web API','Entity Framework Core','SQL Server','Authentication','Deployment'] },
    { id:102, slug:'tech-trek', title:'TECH TREK', category:'Career Foundation', badge:'Certified', featured:false, image:'assets/images/course-v16/tech-trek.svg', short:'A compact technology foundation covering app development, Python, SEO, digital tools and career skills.', description:'TECH TREK is designed for learners who want broad exposure before choosing a specialization. It combines practical digital skills, programming foundations and guided mini projects.', price:6999, originalPrice:8999, duration:'1.5 Months', hours:48, lessons:28, projects:2, rating:4.5, reviews:71, students:260, level:'Beginner', instructor:'FSA Career Faculty', instructorRole:'Foundation Program Mentors', skills:['Python Basics','Web Basics','SEO','Digital Tools','App Concepts','Career Readiness'] },
    { id:103, slug:'react-native', title:'React Native', category:'Mobile Development', badge:'Certified', featured:false, image:'assets/images/course-v16/react-native.svg', short:'Build fast and seamless mobile applications with JavaScript, React and React Native.', description:'Learn mobile application development through components, navigation, APIs, state management, device features and deployment workflows for Android and iOS.', price:8999, originalPrice:11999, duration:'3 Months', hours:72, lessons:34, projects:3, rating:4.3, reviews:92, students:340, level:'Intermediate', instructor:'FSA Mobile Faculty', instructorRole:'Mobile Application Mentors', skills:['JavaScript','React','React Native','Navigation','REST APIs','State Management','Mobile UI','Deployment'] },
    { id:104, slug:'artificial-intelligence-machine-learning', title:'Artificial Intelligence with Machine Learning', category:'Artificial Intelligence', badge:'Certified', featured:false, image:'assets/images/course-v16/ai-machine-learning.svg', short:'Develop machine learning and AI skills for practical automation, prediction and intelligent applications.', description:'A long-form AI and machine learning track covering Python, data preparation, classical machine learning, deep learning and applied intelligent systems.', price:14999, originalPrice:18999, duration:'6 Months', hours:140, lessons:56, projects:6, rating:4.8, reviews:126, students:440, level:'Intermediate', instructor:'FSA AI Faculty', instructorRole:'AI & Machine Learning Mentors', skills:['Python','Statistics','Machine Learning','Deep Learning','TensorFlow','NLP','Computer Vision','Model Deployment'] },
    { id:105, slug:'azure-data-engineer', title:'Azure Data Engineer', category:'Cloud and DevOps', badge:'Certified', featured:false, image:'assets/images/course-v16/azure-data-engineer.svg', short:'Design, build and manage reliable data pipelines and analytics systems on Microsoft Azure.', description:'A focused Azure data engineering program covering data lakes, pipelines, orchestration, transformation and cloud analytics workflows.', price:10999, originalPrice:13999, duration:'2 Months', hours:64, lessons:30, projects:5, rating:4.7, reviews:88, students:295, level:'Intermediate', instructor:'FSA Cloud Faculty', instructorRole:'Azure Data Mentors', skills:['Azure','Data Factory','Data Lake','Synapse','SQL','ETL','Pipelines','Cloud Analytics'] },
    { id:106, slug:'software-testing', title:'Software Testing', category:'Software Quality', badge:'Certified', featured:false, image:'assets/images/course-v16/software-testing.svg', short:'Build software quality skills through manual testing, API testing and automation foundations.', description:'Learn the software testing lifecycle, test design, defect reporting, API validation and automation fundamentals through guided practice.', price:6999, originalPrice:8999, duration:'1 Month', hours:42, lessons:24, projects:4, rating:4.6, reviews:75, students:330, level:'Beginner', instructor:'FSA QA Faculty', instructorRole:'Software Quality Mentors', skills:['Manual Testing','STLC','Test Cases','Bug Reporting','API Testing','Selenium Basics','Agile QA'] },
    { id:107, slug:'generative-ai-for-analytics', title:'Generative AI for Analytics', category:'Data and Analytics', badge:'Certified', featured:false, image:'assets/images/course-v16/generative-ai-analytics.svg', short:'Use generative AI to accelerate analysis, reporting, data storytelling and business decision workflows.', description:'A short applied program that combines analytics thinking with generative AI tools for research, data preparation, insight generation and reporting.', price:7499, originalPrice:9999, duration:'1.5 Months', hours:44, lessons:26, projects:4, rating:4.8, reviews:68, students:245, level:'Beginner to Intermediate', instructor:'FSA Analytics Faculty', instructorRole:'Generative AI Mentors', skills:['Prompt Engineering','Analytics','AI-assisted SQL','Data Storytelling','Reporting','Automation'] },
    { id:108, slug:'business-analyst', title:'Business Analyst', category:'Data and Analytics', badge:'Certified', featured:false, image:'assets/images/course-v16/business-analyst.svg', short:'Master business analysis and data analytics with practical tools, documentation and stakeholder workflows.', description:'Learn requirements gathering, process analysis, documentation, SQL, dashboards and practical business problem solving.', price:8999, originalPrice:11999, duration:'3 Months', hours:70, lessons:32, projects:1, rating:4.9, reviews:112, students:370, level:'Beginner to Intermediate', instructor:'FSA Business Faculty', instructorRole:'Business Analysis Mentors', skills:['Requirements','BRD','FRD','Process Mapping','SQL','Excel','Power BI','Stakeholder Management'] }
  ];

  const FSA_ARCHIVED_COURSES = [
    { title:'Java Enterprise Foundations', note:'Previous classroom curriculum — available on request.' },
    { title:'PHP & MySQL Development', note:'Archived pathway retained for alumni reference.' },
    { title:'Classic Angular Development', note:'Replaced by newer frontend learning paths.' },
    { title:'Linux System Administration', note:'Content now integrated into cloud programs.' }
  ];

  const FSA_REVIEW_POOL = [
    { name:'Areeba Atif', role:'Technology learner', avatar:'assets/images/fsa-home/student-4.png', rating:5, text:'The course structure made difficult concepts easier to understand, and the practical work helped me build confidence.' },
    { name:'Mirza Faizan Baig', role:'FSA learner', avatar:'assets/images/fsa-home/student-2.png', rating:5, text:'The instructors explain concepts clearly and the mix of live guidance and practice keeps learning focused.' },
    { name:'Roshan Ara Khanam', role:'Online learner', avatar:'assets/images/fsa-home/student-5.png', rating:5, text:'I liked being able to attend the live sessions and continue through the online learning material after class.' },
    { name:'Burhan Ashraf', role:'FSA alumnus', avatar:'assets/images/fsa-home/student-1.png', rating:5, text:'The learning environment, support and project practice were useful for building job-ready technical skills.' },
    { name:'Jaseem Ansari', role:'Technology learner', avatar:'assets/images/fsa-home/student-6.png', rating:5, text:'The faculty is supportive and the curriculum stays practical instead of being only theory.' },
    { name:'Imtiaz Shaik', role:'FSA learner', avatar:'assets/images/fsa-home/student-3.png', rating:5, text:'The academy focuses on the gap between what students learn and what the software industry expects.' }
  ];

  function catalogCourses() { return Array.isArray(D.courses) ? D.courses : []; }

  function courseDelivery(course) {
    const source=Array.isArray(course?.deliveryModes)&&course.deliveryModes.length?course.deliveryModes:course?.delivery_modes;
    const raw = Array.isArray(source) ? source : String(source || '').split(/[|,]/).filter(Boolean);
    const modes = new Set(raw.map(x => String(x).trim().toLowerCase().replace(/[_\s]+/g,'-')));
    const configured = modes.size > 0;
    if(modes.has('disabled')) return {classroom:false,live:false,recorded:false,online:false,branches:[]};
    const classroom = configured ? (modes.has('classroom') || modes.has('offline-classroom') || modes.has('offline')) : course?.offline_classroom !== false;
    const live = configured ? (modes.has('live') || modes.has('live-streamed') || modes.has('live-online') || modes.has('online-live')) : course?.live_streamed !== false;
    const recorded = configured ? (modes.has('recorded') || modes.has('self-paced') || modes.has('on-demand')) : course?.recorded !== false;
    return {
      classroom,
      live,
      recorded,
      online: live,
      branches: (Array.isArray(D.branches)?D.branches:[]).map(branch=>branch.shortName||String(branch.name||'').replace(/^FSA\s*[—-]\s*/,'')).filter(Boolean)
    };
  }



  function courseContentForMode(course,uiMode){
    if(!course)return course;
    const key=uiMode==='classroom'?'offline':uiMode==='recorded'?'recorded':'live';
    const modes=(course.contentModes&&typeof course.contentModes==='object')?course.contentModes:
      ((course.contentByMode&&typeof course.contentByMode==='object')?course.contentByMode:{});
    const hasBackendModes=Object.keys(modes).length>0;
    // Backend courses must never borrow public content from another delivery type.
    // Every mode gets its own normalized values; shared identity fields remain shared.
    const empty={badge:'',image:'',short:'',contentHeading:'',description:'',price:0,originalPrice:0,duration:'',hours:0,projects:0,rating:0,reviews:0,students:0,level:'',language:'',updated:'',instructor:'',instructorRole:'',skills:[],requirements:[],audience:[],projectItems:[],courseReviews:[],publicModules:[],publicModulesManaged:false,publicFaqs:[]};
    const content=hasBackendModes?{...empty,...(modes[key]&&typeof modes[key]==='object'?modes[key]:{})}:course;
    return {...course,...content,deliveryMode:key,selectedDeliveryMode:key,contentModes:modes,contentByMode:modes};
  }


  function deliveryPills(delivery) {
    return `${delivery.live?'<span class="mode-pill live">Live Streamed</span>':''}${delivery.recorded?'<span class="mode-pill recorded">Recorded</span>':''}${delivery.classroom?'<span class="mode-pill classroom">Offline Classroom</span>':''}`;
  }

  function courseModules(course) {
    // For persisted per-format courses, public modules are the only public curriculum source.
    // Never use protected classroom or instructor lesson metadata as a public fallback.
    if (course?.contentModes && Object.keys(course.contentModes).length) return Array.isArray(course.publicModules)?course.publicModules:[];
    if (course?.publicModulesManaged) return Array.isArray(course.publicModules)?course.publicModules:[];
    return Array.isArray(course?.modules)?course.modules:[];
  }

  // Public FAQ answers are authored separately for every delivery version in the admin.
  // There is deliberately no global hard-coded fallback or invented course information.
  function courseFaqs(course={}) {
    return (Array.isArray(course?.publicFaqs)?course.publicFaqs:[]).filter(row=>row&&String(row.q||'').trim()&&String(row.a||'').trim());
  }

  function courseReviews(course,limit=6) {
    const own=Array.isArray(course?.courseReviews)?course.courseReviews:[];
    return own.filter(r=>r&&r.name).slice(0,limit).map(r=>({...r,rating:Number(r.rating||0)}));
  }
  function globalWrittenReviews(limit=0) {
    const rows=(D.reviews||[]).filter(r=>r.type==='written').map(r=>({...r,comment:r.text,role:r.role||r.course}));
    return limit>0?rows.slice(0,limit):rows;
  }


  function batchRows(course=null) {
    const rows=Array.isArray(D.batches)?D.batches:[];
    if(!course)return rows;
    const courseId=Number(course.id||0);
    const slug=String(course.slug||'');
    return rows.filter(row=>{
      const rowCourseId=Number(row.courseId||0);
      // Prefer the database foreign-key relation. Slug is only a legacy fallback
      // for older rows that pre-date course_id backfilling.
      return courseId>0 ? (rowCourseId===courseId || (rowCourseId===0 && String(row.slug||'')===slug)) : String(row.slug||'')===slug;
    });
  }


  function courseTabs(course) {
    const skills=Array.isArray(course.skills)?course.skills.filter(Boolean):[];
    const requirements=Array.isArray(course.requirements)?course.requirements.filter(Boolean):[];
    const audience=Array.isArray(course.audience)?course.audience.filter(Boolean):[];
    const modules=Array.isArray(course.modules)?course.modules.filter(module=>module&&(module.title||(Array.isArray(module.lessons)&&module.lessons.length))):[];
    const projects=Array.isArray(course.projectItems)?course.projectItems.filter(project=>project&&(project.title||project.description)):[];
    const reviews=Array.isArray(course.courseReviews)?course.courseReviews.filter(review=>review&&(review.name||review.text)):[];
    const tabs=[];
    if(skills.length||String(course.description||'').trim()||requirements.length||audience.length)tabs.push(['overview','Overview']);
    if(modules.length)tabs.push(['curriculum','Curriculum']);
    if(projects.length)tabs.push(['projects','Projects']);
    if(reviews.length||Number(course.rating||0)>0||Number(course.reviews||0)>0)tabs.push(['reviews','Reviews']);
    return tabs;
  }
  function textHtml(value='') { return escapeHtml(String(value||'')).replace(/\r?\n/g,'<br>'); }
  function accessibleCourses() {
    const byId = new Map(catalogCourses().map(course => [Number(course.id), course]));
    (Array.isArray(state.assignedCourses) ? state.assignedCourses : []).forEach(course => {
      const id = Number(course.id);
      byId.set(id, { ...(byId.get(id) || {}), ...course });
    });
    return [...byId.values()];
  }
  function courseById(id) { return accessibleCourses().find(c => c.id === Number(id)); }
  function courseBySlug(slug) { return accessibleCourses().find(c => c.slug === slug); }
  function routeTo(path) { location.hash = `#${path}`; }

  function contactDetails() {
    const email = String(siteSettings.support_email || 'info@fullstackacademy.in').trim();
    const phone = String(siteSettings.support_phone || '+91 9015 236 236').trim();
    return {
      email,
      phone,
      phoneHref: phone.replace(/[^+\d]/g,'') || '+919015236236'
    };
  }

  function selectShowcaseCourses(limit = 3) {
    return [...(Array.isArray(D.courses) ? D.courses : [])]
      .sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(b.students || 0) - Number(a.students || 0) || Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, limit);
  }

  function dynamicCourseSection({ eyebrow='Featured Courses', title='Explore practical learning paths.', text='Browse courses published from the academy dashboard.', limit=3, tone='surface' } = {}) {
    const courses = selectShowcaseCourses(limit);
    if (!courses.length) return '';
    const sectionClass = tone === 'pink' ? 'section section-pink' : tone === 'plain' ? 'section' : 'section section-surface';
    return `<section class="${sectionClass}"><div class="container"><div class="section-heading"><span class="eyebrow">${escapeHtml(eyebrow)}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p></div><div class="card-grid">${courses.map((course,index)=>courseCard(course,index%4)).join('')}</div><div class="cta-actions" style="margin-top:34px"><a class="button button-outline" href="#/courses">View All Courses ${icon('arrow')}</a></div></div></section>`;
  }

  function dynamicAcademyStats() {
    const courses = Array.isArray(D.courses) ? D.courses : [];
    const uniqueCategories = new Set(courses.map(course => String(course.category || '').trim()).filter(Boolean)).size;
    const sum = key => courses.reduce((total,course) => total + Math.max(0,Number(course[key] || 0)), 0);
    return [
      { value: courses.length, label: 'Published Courses' },
      { value: uniqueCategories, label: 'Skill Categories' },
      { value: sum('hours'), suffix: '+', label: 'Learning Hours' },
      { value: sum('lessons'), suffix: '+', label: 'Lessons' },
      { value: sum('projects'), suffix: '+', label: 'Practical Projects' }
    ];
  }

  function updateDocumentTitle() {
    const academy = siteSettings.academy_name || 'Full Stack Academy';
    const routeTitle = state.currentPath.startsWith('/course/') ? courseBySlug(state.currentPath.split('/')[2])?.title :
      state.currentPath.startsWith('/my-course/') ? enrolledCourses().find(c=>String(c.slug)===String(state.currentPath.split('/')[2]))?.title :
      state.currentPath.startsWith('/event/') ? eventBySlug(state.currentPath.split('/')[2])?.title :
      ({
        '/':'Home',
        '/courses':'Courses',
        '/super40-bba':'SUPER40 BBA',
        '/batches':'Batches',
        '/events':'Events',
        '/about':'About Us',
        '/contact':'Contact Us',
        '/branches':'Branches',
        '/companies':'Companies & Hiring Partners',
        '/alumni':'Successfully Placed Alumni',
        '/candidates':'Available Candidates',
        '/help':'Help Centre',
        '/terms':'Terms and Conditions',
        '/privacy':'Privacy Policy',
        '/refund':'Refund Policy',
        '/login':'Sign In',
        '/register':'Create Account',
        '/dashboard':'Student Dashboard',
        '/my-courses':'My Courses',
        '/my-quizzes':'My Quizzes',
        '/my-assignments':'My Assignments',
        '/live-classes':'Live Classes',
        '/wishlist':'Wishlist',
        '/profile':'Profile'
      })[state.currentPath];
    document.title = routeTitle && routeTitle !== 'Home' ? `${routeTitle} | ${academy}` : `${academy} — ${siteSettings.academy_tagline || 'Learning Platform'}`;
  }
  function discountPercent(course) { const original=Number(course.originalPrice||0);const price=Number(course.price||0);return original>price&&original>0?Math.round((1-price/original)*100):0; }
  function stars(count = 5) { return `<span class="stars">${Array.from({length: count}, () => icon('star','',true)).join('')}</span>`; }
  function imageMarkup(src, alt, fallback = 'FS', className = '') {
    const safeSrc = escapeHtml(src || '');
    return `<span class="image-fallback" aria-hidden="true">${escapeHtml(fallback)}</span><img class="content-image ${className}" src="${safeSrc}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.classList.add('image-loaded');const fallback=this.previousElementSibling;if(fallback)fallback.hidden=true" onerror="this.classList.add('image-error');this.style.display='none'">`;
  }
  function progressPercent(courseId) {
    const course = courseById(courseId);
    if (!course) return 0;
    const all = allLessonKeys(course);
    const complete = new Set(state.progress[courseId] || []);
    return all.length ? Math.round(all.filter(k => complete.has(k)).length / all.length * 100) : 0;
  }
  function completedLessons(courseId) { return (state.progress[courseId] || []).length; }
  function setChrome(mode = 'public') {
    const publicMode = mode === 'public';
    if(state.liveRefreshTimer){clearTimeout(state.liveRefreshTimer);state.liveRefreshTimer=null;}
    footer.style.display = publicMode ? '' : 'none';
    announcement.style.display = publicMode && announcement.dataset.disabled !== 'true' && !read(LS.announcement, false) ? '' : 'none';
    document.body.dataset.mode = mode;
  }

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `${icon(type === 'error' ? 'info' : 'check')}<span>${escapeHtml(message)}</span>`;
    toastStack.appendChild(node);
    setTimeout(() => { node.style.opacity = '0'; node.style.transform = 'translateY(10px)'; }, 2600);
    setTimeout(() => node.remove(), 3000);
  }

  function closeOverlays() {
    [mobileMenu, cartDrawer, searchModal].forEach(el => { el.classList.remove('open'); el.setAttribute('aria-hidden','true'); });
    document.body.classList.remove('locked');
  }

  function openOverlay(el) {
    closeOverlays();
    el.classList.add('open');
    el.setAttribute('aria-hidden','false');
    document.body.classList.add('locked');
  }

  function courseCard(course, delay = 0) {
    const active = state.wishlist.includes(course.id);
    const delivery = courseDelivery(course);
    const meta=[];
    if(Number(course.rating||0)>0)meta.push(`<span>${icon('star','',true)} <b class="rating">${escapeHtml(course.rating)}</b></span>`);
    if(String(course.duration||'').trim())meta.push(`<span>${icon('clock')} ${escapeHtml(course.duration)}</span>`);
    if(Number(course.projects||0)>0)meta.push(`<span>${icon('project')} ${Number(course.projects)} project${Number(course.projects)===1?'':'s'}</span>`);
    const hasOriginal=Number(course.originalPrice||0)>Number(course.price||0)&&Number(course.originalPrice||0)>0;
    return `<article class="course-card reveal reveal-delay-${Math.min(delay,3)}" data-course-id="${course.id}">
      <div class="course-image">${imageMarkup(course.image, `${course.title} course`, initials(course.title))}<span class="course-card-mode-badges">${deliveryPills(delivery)}</span><button class="wishlist-button ${active?'active':''}" data-action="toggle-wishlist" data-id="${course.id}" aria-label="${active?'Remove from':'Add to'} wishlist">${icon('heart','',active)}</button></div>
      <div class="course-card-body">${String(course.category||'').trim()?`<span class="course-category">${escapeHtml(course.category)}</span>`:''}<h3><a href="#/course/${encodeURIComponent(course.slug)}">${escapeHtml(course.title)}</a></h3>${String(course.short||'').trim()?`<p class="course-card-description">${textHtml(course.short)}</p>`:''}${meta.length?`<div class="course-meta">${meta.join('')}</div>`:''}<div class="course-card-footer"><span class="course-price"><strong>${money(course.price)}</strong>${hasOriginal?`<del>${money(course.originalPrice)}</del>`:''}</span><span class="course-actions-inline"><a class="button button-secondary button-sm" href="#/course/${encodeURIComponent(course.slug)}" aria-label="View ${escapeHtml(course.title)}">${icon('eye')}</a>${state.loggedIn&&(state.allEnrollmentRows||[]).some(row=>Number(row.course_id)===Number(course.id)&&['active','completed','pending'].includes(row.status))?`<a class="button button-primary button-sm" href="#/course/${encodeURIComponent(course.slug)}">View Course</a>`:`<button class="button button-primary button-sm" data-action="add-cart" data-id="${course.id}">Add</button>`}</span></div></div>
    </article>`;
  }

  function categoryCard(category, delay = 0) {
    return `<a class="category-card reveal reveal-delay-${Math.min(delay,3)}" href="#/courses?category=${encodeURIComponent(category.name)}">
      <div class="category-card-top"><span class="category-icon">${icon(category.icon)}</span><span class="category-arrow">${icon('external')}</span></div>
      <h3>${category.name}</h3><p>${category.description}</p><strong>${category.count} ${category.count === 1 ? 'course' : 'courses'}</strong>
    </a>`;
  }


  function testimonialCard(item, delay = 0) {
    return `<article class="testimonial-card reveal reveal-delay-${Math.min(delay,3)}">
      <div class="testimonial-head"><span class="avatar">${imageMarkup(item.avatar, item.name, initials(item.name))}</span><span><span class="testimonial-name">${item.name}</span><span class="testimonial-course">${item.course}</span></span></div>
      ${stars(item.rating)}<p>${item.comment}</p>
    </article>`;
  }

  function branchCard(branch, delay = 0) {
    return `<article class="branch-card reveal reveal-delay-${Math.min(delay,3)}"><div class="branch-image">${imageMarkup(branch.image, `${branch.name} learning centre`, 'FSA')}<span class="branch-pin">${icon('map')}</span></div><div class="branch-body"><h3>${branch.name}</h3><p>${branch.address}</p><div class="branch-contact"><span>${icon('phone')} ${branch.phone}${branch.extension?` · ${branch.extension}`:''}</span><span>${icon('mail')} ${branch.email}</span><span>${icon('clock')} ${branch.hours}</span></div><div class="branch-actions"><a class="button button-primary button-sm" href="tel:${branch.phone.replace(/\s/g,'')}">Call</a><a class="button button-secondary button-sm" href="#/branches?branch=${encodeURIComponent(branch.id)}">View Location</a></div></div></article>`;
  }

  function faqList(items = D.faqs) {
    return `<div class="faq-list">${items.map((item, i) => `<article class="faq-item ${i===0 ? 'open' : ''}"><button class="faq-question" data-action="toggle-faq"><span>${item.q}</span>${icon('plus')}</button><div class="faq-answer"><p>${item.a}</p></div></article>`).join('')}</div>`;
  }

  function breadcrumbs(items) {
    return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item,i) => i === items.length-1 ? `<span>${item.label}</span>` : `<a href="${item.href}">${item.label}</a><b>/</b>`).join('')}</nav>`;
  }

  function pageHero({ eyebrow, title, text, image, imageAlt = '', center = false }) {
    return `<section class="page-hero"><div class="container ${image ? 'page-hero-grid' : ''}"><div class="page-heading ${center ? 'center' : ''}"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${text}</p></div>${image ? `<div class="page-hero-image reveal">${imageMarkup(image,imageAlt,'FSA')}</div>` : ''}</div></section>`;
  }

  function academyEvents() { return Array.isArray(D.events) ? D.events : []; }

  function eventBySlug(slug) {
    return academyEvents().find(event => event.slug === slug);
  }

  function eventDateValue(event) {
    if (!event?.date) return null;
    const value = new Date(`${event.date}T12:00:00`);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  function eventDateParts(event) {
    const value = eventDateValue(event);
    if (!value) return { day:'--', month:'Date', year:'TBA', full:event.time || 'Date to be confirmed' };
    return {
      day: value.toLocaleDateString('en-IN',{day:'2-digit'}),
      month: value.toLocaleDateString('en-IN',{month:'short'}).toUpperCase(),
      year: value.getFullYear(),
      full: value.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    };
  }

  function eventStatus(event) {
    const date = eventDateValue(event);
    if (!date) return 'Archive';
    const today = new Date(); today.setHours(0,0,0,0);
    return date >= today ? 'Upcoming' : 'Past Event';
  }

  function eventArchiveParams() {
    const raw = decodeURIComponent((location.hash || '#/events').slice(1));
    const query = raw.split('?')[1] || '';
    return new URLSearchParams(query);
  }

  function updateEventArchiveQuery(changes = {}) {
    const params = eventArchiveParams();
    const active = document.activeElement;
    const restoreSearch = active?.id === 'eventSearchInput';
    const selectionStart = restoreSearch ? active.selectionStart : null;
    const scrollY = window.scrollY;
    Object.entries(changes).forEach(([key,value]) => {
      const clean = String(value ?? '').trim();
      if (!clean || clean === 'all' || (key === 'view' && clean === 'grid')) params.delete(key);
      else params.set(key, clean);
    });
    if (!('page' in changes)) params.delete('page');
    params.delete('view');
    const hash = `#/events${params.toString() ? `?${params.toString()}` : ''}`;
    history.replaceState(null,'',hash);
    state.currentPath = '/events';
    renderEvents(params.toString());
    initPage();
    window.scrollTo(0,scrollY);
    if (restoreSearch) {
      const next = document.getElementById('eventSearchInput');
      next?.focus({preventScroll:true});
      if (next && selectionStart !== null) next.setSelectionRange(selectionStart,selectionStart);
    }
  }

  function eventCard(event, index = 0) {
    const date = eventDateParts(event);
    return `<article class="fsa-event-card reveal reveal-delay-${Math.min(index % 3,3)}">
      <a class="fsa-event-card-media" href="#/event/${encodeURIComponent(event.slug)}" aria-label="View ${escapeHtml(event.title)}">
        ${imageMarkup(event.image,event.title,'FSA')}
        <span class="fsa-event-date-tile"><b>${date.day}</b><small>${date.month}</small></span>
        <span class="fsa-event-location">${icon('map')} ${escapeHtml(event.location || 'Full Stack Academy')}</span>
      </a>
      <div class="fsa-event-card-body">
        <div class="fsa-event-card-kickers"><span class="fsa-event-kicker">${escapeHtml(event.category || 'Academy Event')}</span><span class="fsa-event-status">${eventStatus(event)}</span></div>
        <h3><a href="#/event/${encodeURIComponent(event.slug)}">${escapeHtml(event.title)}</a></h3>
        <p>${escapeHtml(event.description || '')}</p>
        <div class="fsa-event-card-footer">
          <span class="fsa-event-time">${icon('clock')} ${escapeHtml(event.time || date.full)}</span>
          <a class="fsa-event-read" href="#/event/${encodeURIComponent(event.slug)}">View Event ${icon('arrow')}</a>
        </div>
      </div>
    </article>`;
  }

  function eventCalendar(events, monthValue) {
    const valid = events.filter(event => eventDateValue(event));
    let base;
    if (/^\d{4}-\d{2}$/.test(monthValue || '')) base = new Date(`${monthValue}-01T12:00:00`);
    else base = valid.length ? new Date(Math.max(...valid.map(event => eventDateValue(event).getTime()))) : new Date();
    const year = base.getFullYear(), month = base.getMonth();
    const first = new Date(year,month,1,12), last = new Date(year,month+1,0,12);
    const startOffset = (first.getDay()+6)%7;
    const cells = [];
    for (let i=0;i<startOffset;i++) cells.push(null);
    for (let day=1;day<=last.getDate();day++) cells.push(new Date(year,month,day,12));
    while (cells.length % 7) cells.push(null);
    const byDay = new Map();
    valid.forEach(event => {
      const d=eventDateValue(event);
      if (d.getFullYear()===year && d.getMonth()===month) {
        const key=d.getDate(); if(!byDay.has(key))byDay.set(key,[]); byDay.get(key).push(event);
      }
    });
    const previous = new Date(year,month-1,1,12).toISOString().slice(0,7);
    const next = new Date(year,month+1,1,12).toISOString().slice(0,7);
    const title = base.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
    return `<section class="fsa-events-calendar-wrap" aria-label="Events calendar">
      <div class="fsa-calendar-head"><div><span class="eyebrow">Events Calendar</span><h3>${escapeHtml(title)}</h3></div><div class="fsa-calendar-nav"><button type="button" data-action="event-calendar-month" data-month="${previous}" aria-label="Previous month">${icon('arrowLeft')}</button><button type="button" data-action="event-calendar-month" data-month="${next}" aria-label="Next month">${icon('arrow')}</button></div></div>
      <div class="fsa-calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<span>${day}</span>`).join('')}</div>
      <div class="fsa-calendar-grid">${cells.map(date=>{
        if(!date)return '<div class="fsa-calendar-cell empty" aria-hidden="true"></div>';
        const dayEvents=byDay.get(date.getDate())||[];
        return `<div class="fsa-calendar-cell ${dayEvents.length?'has-event':''}"><span class="fsa-calendar-day">${date.getDate()}</span><div class="fsa-calendar-events">${dayEvents.slice(0,2).map(event=>`<a href="#/event/${encodeURIComponent(event.slug)}"><b>${escapeHtml(event.category || 'Event')}</b><span>${escapeHtml(event.title)}</span></a>`).join('')}${dayEvents.length>2?`<small>+${dayEvents.length-2} more</small>`:''}</div></div>`;
      }).join('')}</div>
      <div class="fsa-calendar-mobile-list">${[...byDay.entries()].sort((a,b)=>a[0]-b[0]).map(([day,items])=>`<article><time>${String(day).padStart(2,'0')} ${base.toLocaleDateString('en-IN',{month:'short'})}</time><div>${items.map(event=>`<a href="#/event/${encodeURIComponent(event.slug)}">${escapeHtml(event.title)}</a>`).join('')}</div></article>`).join('') || '<p>No dated events in this month.</p>'}</div>
    </section>`;
  }

  function renderEvents(query = '') {
    setChrome('public');
    const events = academyEvents();
    const featured = events.find(event => event.featured) || events[0];
    if (!featured) {
      app.innerHTML = `${pageHero({eyebrow:'Full Stack Academy Events',title:'Academy events',text:'Explore current academy events, workshops and community activities.',center:true})}<section class="page-section section-surface"><div class="container"><div class="empty-state"><h3>No published events available</h3><p>New events will appear here when they are published by the academy.</p><a class="button button-primary" href="#/contact">Contact the academy</a></div></div></section>`;
      return;
    }
    const params = new URLSearchParams(query);
    const q = String(params.get('q') || '').trim().toLowerCase();
    const category = params.get('category') || 'all';
    const location = params.get('location') || 'all';
    const year = params.get('year') || 'all';
    const month = params.get('month') || '';
    const categories = [...new Set(events.map(event=>event.category).filter(Boolean))].sort();
    const locations = [...new Set(events.map(event=>event.location).filter(Boolean))].sort();
    const years = [...new Set(events.map(event=>eventDateValue(event)?.getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
    const filtered = events.filter(event => {
      const haystack = `${event.title} ${event.description} ${event.location} ${event.category}`.toLowerCase();
      const eventYear = eventDateValue(event)?.getFullYear();
      return (!q || haystack.includes(q)) && (category==='all' || event.category===category) && (location==='all' || event.location===location) && (year==='all' || String(eventYear)===year);
    });
    const perPage = 9;
    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    const requestedPage = Number(params.get('page') || 1);
    const page = Math.min(pages, Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1));
    const pageEvents = filtered.slice((page - 1) * perPage, page * perPage);
    const baseParams = new URLSearchParams(params); baseParams.delete('page'); baseParams.delete('view');
    const pageHref = number => { const p=new URLSearchParams(baseParams); if(number>1)p.set('page',number); return `#/events${p.toString()?`?${p}`:''}`; };
    const pagination = pages > 1 ? `<nav class="fsa-event-pagination" aria-label="Events pages">
      ${page > 1 ? `<a class="wide" href="${pageHref(page-1)}">${icon('arrowLeft')} Previous</a>` : ''}
      ${Array.from({length:pages},(_,i)=>i+1).map(number=>`<a class="${number===page?'active':''}" href="${pageHref(number)}" ${number===page?'aria-current="page"':''}>${number}</a>`).join('')}
      ${page < pages ? `<a class="wide" href="${pageHref(page+1)}">Next ${icon('arrow')}</a>` : ''}
    </nav>` : '';
    const activeFilters = [q,category!=='all'?category:'',location!=='all'?location:'',year!=='all'?year:''].filter(Boolean).length;
    const filterSummary = [
      q ? `Search: “${escapeHtml(params.get('q') || '')}”` : '',
      category!=='all' ? escapeHtml(category) : '',
      location!=='all' ? escapeHtml(location) : '',
      year!=='all' ? escapeHtml(year) : ''
    ].filter(Boolean);

    app.innerHTML = `<section class="fsa-events-hero">
      <div class="container fsa-events-hero-grid">
        <div class="fsa-events-hero-copy reveal">
          <span class="eyebrow">Full Stack Academy Events</span>
          <h1>Technology events built for <em>learning, careers and community.</em></h1>
          <p>Explore workshops, expert talks, hackathons, boot camps, award ceremonies and academy community events across Hyderabad.</p>
          <div class="fsa-events-hero-actions"><button class="button button-primary" type="button" data-action="scroll-events">Explore Archive ${icon('arrow')}</button><button class="button button-secondary" type="button" data-action="scroll-events-calendar">View Events Calendar ${icon('calendar')}</button></div>
          <div class="fsa-events-hero-points"><span>${icon('building')} Hyderabad branches</span><span>${icon('users')} Industry experts</span><span>${icon('award')} Student achievements</span></div>
        </div>
        <a class="fsa-event-featured reveal reveal-scale" href="#/event/${encodeURIComponent(featured.slug)}">
          ${imageMarkup(featured.image,featured.title,'FSA')}
          <div class="fsa-event-featured-copy"><span>${icon('sparkles')} Featured Event</span><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.location || '')}${featured.time ? ` · ${escapeHtml(featured.time)}` : ''}</p></div>
        </a>
      </div>
    </section>
    <section class="fsa-events-archive" id="event-list"><div class="container">
      <div class="fsa-events-heading"><div><span class="eyebrow">Events Archive</span><h2>Discover FSA events</h2></div><p>Search the academy archive by topic, event type, branch or year.</p></div>
      <div class="fsa-event-filter-panel">
        <div class="fsa-event-filter-head">
          <div><span class="eyebrow">Find An Event</span><h3>Explore the archive</h3><p>Use one or more filters to quickly narrow the event collection.</p></div>
          <div class="fsa-event-results-count"><strong>${filtered.length}</strong><span>event${filtered.length===1?'':'s'} found</span></div>
        </div>
        <div class="fsa-event-filter-controls">
          <label class="fsa-event-search"><span class="fsa-event-filter-icon">${icon('search')}</span><span class="fsa-event-field-copy"><small>Search</small><input id="eventSearchInput" type="search" value="${escapeHtml(params.get('q') || '')}" placeholder="Event name, topic or location"></span></label>
          <label class="fsa-event-select-field"><span class="fsa-event-filter-icon">${icon('briefcase')}</span><span class="fsa-event-field-copy"><small>Event type</small><select id="eventCategoryFilter"><option value="all">All event types</option>${categories.map(value=>`<option value="${escapeHtml(value)}" ${value===category?'selected':''}>${escapeHtml(value)}</option>`).join('')}</select></span></label>
          <label class="fsa-event-select-field"><span class="fsa-event-filter-icon">${icon('map')}</span><span class="fsa-event-field-copy"><small>Location</small><select id="eventLocationFilter"><option value="all">All locations</option>${locations.map(value=>`<option value="${escapeHtml(value)}" ${value===location?'selected':''}>${escapeHtml(value)}</option>`).join('')}</select></span></label>
          <label class="fsa-event-select-field"><span class="fsa-event-filter-icon">${icon('calendar')}</span><span class="fsa-event-field-copy"><small>Year</small><select id="eventYearFilter"><option value="all">All years</option>${years.map(value=>`<option value="${value}" ${String(value)===year?'selected':''}>${value}</option>`).join('')}</select></span></label>
        </div>
        <div class="fsa-event-filter-foot">
          <div class="fsa-event-active-filters">${filterSummary.length ? filterSummary.map(item=>`<span>${item}</span>`).join('') : '<span class="is-muted">Showing the complete event archive</span>'}</div>
          ${activeFilters ? `<button class="fsa-event-clear" type="button" data-action="event-clear-filters">${icon('x')} Clear filters</button>` : ''}
        </div>
      </div>
      ${pageEvents.length ? `<div class="fsa-events-grid">${pageEvents.map(eventCard).join('')}</div>${pagination}` : `<div class="fsa-events-empty">${icon('calendar')}<h3>No events match these filters.</h3><p>Try another event type, location, year or keyword.</p><button class="button button-primary" data-action="event-clear-filters">Show all events</button></div>`}
      <section class="fsa-events-calendar-section" id="events-calendar">
        <div class="fsa-events-calendar-heading"><div><span class="eyebrow">Plan & Browse</span><h2>Events calendar</h2><p>Browse the archive month by month. The calendar follows the filters selected above.</p></div><div class="fsa-events-calendar-stat">${icon('calendar')} <span><strong>${filtered.length}</strong> filtered events</span></div></div>
        ${eventCalendar(filtered,month)}
      </section>
    </div></section>
    <section class="fsa-events-cta"><div class="container"><div class="fsa-events-cta-panel reveal"><div><span class="eyebrow">Join The Community</span><h2>Want to attend the next FSA event?</h2><p>Speak with our team about future workshops, branch events, boot camps and expert sessions.</p></div><div class="fsa-events-cta-actions"><button class="button button-secondary" type="button" data-action="open-call-popup">Get A Call</button><a class="button button-ghost-light" href="#/contact">Contact Us</a></div></div></div></section>`;
  }

  function eventMediaSlides(event) {
    const media = Array.isArray(event.media) && event.media.length ? event.media : [{type:'image',src:event.image,caption:event.title}];
    return { media, slides:media.map((item,index)=>`<figure class="fsa-event-media-slide ${index===0?'active':''}" data-event-media-slide="${index}">${item.type==='video'?`<video controls playsinline preload="metadata" poster="${escapeHtml(item.poster || event.image)}"><source src="${escapeHtml(item.src)}" type="video/mp4">Your browser does not support embedded video.</video>`:`${imageMarkup(item.src,item.caption || event.title,'FSA')}`}<figcaption><span>${item.type==='video'?icon('video'):icon('camera')}</span>${escapeHtml(item.caption || (item.type==='video'?'Event video':'Event gallery'))}</figcaption></figure>`).join(''), thumbs:media.map((item,index)=>`<button class="fsa-event-media-thumb ${index===0?'active':''}" type="button" data-action="event-media-thumb" data-index="${index}" aria-label="Open media ${index+1}">${item.type==='video'?`<span class="fsa-event-thumb-video">${icon('play','',true)}</span><img src="${escapeHtml(item.poster || event.image)}" alt="">`:`<img src="${escapeHtml(item.src)}" alt="">`}</button>`).join('') };
  }

  function eventSponsorSection(event) {
    const sponsors = Array.isArray(event.sponsors) ? event.sponsors : [];
    if (sponsors.length) return `<div class="fsa-event-sponsor-grid">${sponsors.map(item=>`<article><div class="fsa-sponsor-logo">${item.logo?`<img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.name)}">`:`<span>${escapeHtml(initials(item.name))}</span>`}</div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.role || 'Event Partner')}</small></article>`).join('')}</div>`;
    return `<div class="fsa-event-sponsor-grid placeholders"><article><div class="fsa-sponsor-logo">Partner</div><strong>Sponsor Logo</strong><small>Placeholder for official sponsor</small></article><article><div class="fsa-sponsor-logo">Tech</div><strong>Technology Partner</strong><small>Placeholder for partner logo</small></article><article><div class="fsa-sponsor-logo">Community</div><strong>Community Partner</strong><small>Placeholder for partner logo</small></article></div>`;
  }

  function updateEventMedia(index) {
    const root=document.querySelector('[data-event-media-root]');
    if(!root)return;
    const slides=[...root.querySelectorAll('[data-event-media-slide]')];
    if(!slides.length)return;
    const next=(Number(index)+slides.length)%slides.length;
    root.dataset.current=String(next);
    slides.forEach((slide,i)=>{slide.classList.toggle('active',i===next); if(i!==next)slide.querySelector('video')?.pause();});
    root.querySelectorAll('.fsa-event-media-thumb').forEach((thumb,i)=>thumb.classList.toggle('active',i===next));
  }

  function downloadEventCalendar(event) {
    const date = eventDateValue(event) || new Date();
    const y=String(date.getFullYear()),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    const day=`${y}${m}${d}`;
    const safe=value=>String(value||'').replace(/([,;])/g,'\\$1').replace(/\n/g,'\\n');
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Full Stack Academy//Events//EN','BEGIN:VEVENT',`UID:${event.slug}@fullstackacademy.in`,`DTSTART;VALUE=DATE:${day}`,`DTEND;VALUE=DATE:${day}`,`SUMMARY:${safe(event.title)}`,`LOCATION:${safe(event.location)}`,`DESCRIPTION:${safe(event.description)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`${event.slug}.ics`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  function renderEventDetail(slug) {
    setChrome('public');
    const events = academyEvents();
    const event = eventBySlug(slug);
    if (!event) return renderNotFound();
    const date=eventDateParts(event), media=eventMediaSlides(event), organiser=event.organiser || {};
    const index = events.findIndex(item => item.slug === event.slug);
    const related = events.filter(item=>item.slug!==event.slug && (item.category===event.category || item.location===event.location)).slice(0,3);
    const previous = index > 0 ? events[index-1] : null;
    const next = index >= 0 && index < events.length-1 ? events[index+1] : null;
    const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || 'Full Stack Academy Hyderabad')}`;
    app.innerHTML = `${pageHero({eyebrow:`${escapeHtml(event.category || 'Academy Event')} · ${escapeHtml(eventStatus(event))}`,title:escapeHtml(event.title),text:escapeHtml(event.description || ''),image:event.image,imageAlt:event.title})}
    <section class="fsa-event-page-body"><div class="container fsa-event-page-layout">
      <main class="fsa-event-main">
        <section class="fsa-event-media-card" data-event-media-root data-current="0"><div class="fsa-event-media-stage">${media.slides}<div class="fsa-event-media-controls"><button type="button" data-action="event-media-prev" aria-label="Previous media">${icon('arrowLeft')}</button><span><b>Gallery</b> · images & video</span><button type="button" data-action="event-media-next" aria-label="Next media">${icon('arrow')}</button></div></div><div class="fsa-event-media-thumbs">${media.thumbs}</div><p class="fsa-event-stock-note">Temporary stock visuals/video are used where the source event does not provide complete media. Replace them later with final event assets.</p></section>
        <section class="fsa-event-content-card"><span class="eyebrow">About This Event</span><h2>${escapeHtml(event.title)}</h2><p>${escapeHtml(event.description || '')}</p>${event.slug==='fsa-charminar-4th-branch-inaugration'?`<p>The Charminar branch opening brought together academy leadership, trainers, alumni, guests, media and community members. The programme included the branch inauguration, alumni recognition, academy vision, networking and a closing gathering.</p>`:''}<div class="fsa-event-highlights"><article>${icon('users')}<div><strong>Connect with the community</strong><p>Meet trainers, learners, alumni and guests around practical technology learning.</p></div></article><article>${icon('sparkles')}<div><strong>Industry-focused experience</strong><p>Sessions are built around real careers, skills, technology and learner outcomes.</p></div></article><article>${icon('award')}<div><strong>Celebrate progress</strong><p>Many academy events recognise achievement, collaboration and student milestones.</p></div></article></div></section>
        <section class="fsa-event-content-card"><div class="fsa-event-section-head"><div><span class="eyebrow">Event Flow</span><h2>What the experience includes</h2></div><span class="fsa-event-sample-label">Structured event format</span></div><div class="fsa-event-agenda"><article><time>01</time><div><strong>Welcome & check-in</strong><p>Guest arrival, introductions and event orientation.</p></div></article><article><time>02</time><div><strong>Main programme</strong><p>Workshop, talk, ceremony or featured academy activity.</p></div></article><article><time>03</time><div><strong>Interaction & Q&A</strong><p>Questions, discussion and practical takeaways with the event team.</p></div></article><article><time>04</time><div><strong>Networking & close</strong><p>Community interaction, photos and next-step guidance.</p></div></article></div></section>
        <section class="fsa-event-content-card"><span class="eyebrow">Organised By</span><h2>Meet the event organiser</h2><article class="fsa-event-organiser"><div class="fsa-event-organiser-mark">FSA</div><div><h3>${escapeHtml(organiser.name || 'Full Stack Academy')}</h3><span>${escapeHtml(organiser.role || 'Event Organiser')}</span><p>${escapeHtml(organiser.description || '')}</p><div class="fsa-event-organiser-links"><a href="mailto:${escapeHtml(organiser.email || 'info@fullstackacademy.in')}">${icon('mail')} ${escapeHtml(organiser.email || 'info@fullstackacademy.in')}</a><a href="tel:${String(organiser.phone || '+919015236236').replace(/[^+\d]/g,'')}">${icon('phone')} ${escapeHtml(organiser.phone || '+91 9015 236 236')}</a></div></div></article></section>
        <section class="fsa-event-content-card"><div class="fsa-event-section-head"><div><span class="eyebrow">Sponsors & Partners</span><h2>Event partners</h2></div><span class="fsa-event-sample-label">Placeholders ready</span></div>${eventSponsorSection(event)}</section>
        ${related.length?`<section class="fsa-event-related"><div class="fsa-event-section-head"><div><span class="eyebrow">More Events</span><h2>You may also like</h2></div><a href="#/events">View all events ${icon('arrow')}</a></div><div class="fsa-events-grid">${related.map(eventCard).join('')}</div></section>`:''}
      </main>
      <aside class="fsa-event-sidebar"><div class="fsa-event-booking-card"><span class="eyebrow">Event Details</span><div class="fsa-event-booking-meta"><article><span>${icon('calendar')}</span><div><small>Date</small><strong>${escapeHtml(date.full)}</strong></div></article><article><span>${icon('clock')}</span><div><small>Time</small><strong>${escapeHtml(event.time || 'See event schedule')}</strong></div></article><article><span>${icon('map')}</span><div><small>Location</small><strong>${escapeHtml(event.location || 'Full Stack Academy')}</strong></div></article><article><span>${icon('briefcase')}</span><div><small>Type</small><strong>${escapeHtml(event.category || 'Academy Event')}</strong></div></article></div><div class="fsa-event-sidebar-actions"><button class="button button-primary" type="button" data-action="open-call-popup">Book / Enquire</button><button class="button button-secondary" type="button" data-action="event-add-calendar" data-slug="${escapeHtml(event.slug)}">${icon('calendar')} Add to Calendar</button><a class="button button-secondary" href="${mapsUrl}" target="_blank" rel="noopener">${icon('map')} View Location</a></div><div class="fsa-event-share"><span>Event tags</span><div>${(event.tags||[]).map(tag=>`<b>${escapeHtml(tag)}</b>`).join('')}</div></div></div></aside>
    </div><div class="container">${(previous || next) ? `<nav class="fsa-event-detail-nav" aria-label="Event navigation">${previous?`<a href="#/event/${encodeURIComponent(previous.slug)}">${icon('arrowLeft')}<span><small>Previous event</small>${escapeHtml(previous.title)}</span></a>`:''}${next?`<a href="#/event/${encodeURIComponent(next.slug)}"><span><small>Next event</small>${escapeHtml(next.title)}</span>${icon('arrow')}</a>`:''}</nav>`:''}</div></section>`;
  }

  function homeCourseCard(course, delay = 0) {
    const hasOriginal = Number(course.originalPrice || 0) > Number(course.price || 0) && Number(course.originalPrice || 0) > 0;
    const projects = Number(course.projects || 0);
    const delivery = courseDelivery(course);
    return `<article class="fsa-home-course reveal reveal-delay-${Math.min(delay,3)}"><a class="fsa-home-course-media" href="#/course/${encodeURIComponent(course.slug)}">${imageMarkup(course.image, `${course.title} course`, initials(course.title))}<span class="course-card-mode-badges">${deliveryPills(delivery)}</span></a><div class="fsa-home-course-body"><span class="fsa-home-kicker">${escapeHtml(course.category || 'Technology')}</span><h3><a href="#/course/${encodeURIComponent(course.slug)}">${escapeHtml(course.title)}</a></h3><p>${textHtml(course.short || '')}</p><div class="fsa-home-course-meta"><span>${icon('clock')} ${escapeHtml(course.duration || 'Flexible')}</span>${projects?`<span>${icon('project')} ${projects} project${projects===1?'':'s'}</span>`:''}${Number(course.rating||0)?`<span>${icon('star','',true)} ${escapeHtml(course.rating)}/5</span>`:''}</div><div class="fsa-home-course-footer"><span class="fsa-home-course-price"><strong>${money(course.price)}</strong>${hasOriginal?`<del>${money(course.originalPrice)}</del>`:''}</span><span class="fsa-home-course-buttons"><a class="fsa-mini-link" href="#/course/${encodeURIComponent(course.slug)}">Details</a><button class="button button-primary button-sm" data-action="add-cart" data-id="${course.id}">Enroll</button></span></div></div></article>`;
  }

  const HOME_BRANCH_IMAGES = {
    tolichowki: 'assets/images/fsa-home/branch-tolichowki.webp',
    gachibowli: 'assets/images/fsa-home/branch-gachibowli.jpg',
    ameerpet: 'assets/images/fsa-home/branch-ameerpet.jpg',
    charminar: 'assets/images/fsa-home/branch-charminar.jpg'
  };

  const HOME_BRANCH_COPY = {
    tolichowki: 'Accessible, inclusive technology learning with experienced instructors and a practical curriculum.',
    gachibowli: 'A modern learning environment with expert instructors, hands-on training and real-world projects.',
    ameerpet: 'Industry-led training in a central Hyderabad learning hub focused on practical career outcomes.',
    charminar: 'Hands-on technology training, mentoring and career-focused learning in the heart of Hyderabad.'
  };

  function homeBranchCard(branch, delay = 0) {
    const maps = branchDetailUrl(branch);
    const localImage = branch.image || ''; 
    const copy = branch.description || '';
    const branchNo = String(delay + 1).padStart(2, '0');
    return `<article class="fsa-branch-showcase reveal reveal-delay-${Math.min(delay,3)}">
      <a class="fsa-branch-showcase-media" href="${maps}" aria-label="View ${escapeHtml(branch.name)} branch details">
        ${imageMarkup(localImage, `${branch.name} learning centre`, 'FSA')}
        <span class="fsa-branch-number">${branchNo}</span>
        <span class="fsa-branch-location-pill">${icon('map')} ${escapeHtml(branch.location)}</span>
      </a>
      <div class="fsa-branch-showcase-body">
        <h3>${escapeHtml(branch.name)}</h3>
        <p>${escapeHtml(copy)}</p>
        <div class="fsa-branch-showcase-address">${icon('map')}<span>${escapeHtml(branch.address || branch.location)}</span></div>
        <div class="fsa-branch-showcase-meta">
          <a href="tel:${branch.phone.replace(/\s/g,'')}">${icon('phone')}<span>${escapeHtml(branch.phone)}${branch.extension ? ` · ${escapeHtml(branch.extension)}` : ''}</span></a>
          <span>${icon('clock')}<span>${escapeHtml(branch.hours)}</span></span>
        </div>
        <div class="fsa-branch-showcase-actions">
          <a class="button button-primary button-sm" href="tel:${branch.phone.replace(/\s/g,'')}">Call Branch</a>
          <a class="fsa-branch-direction-link" href="${maps}">Branch Details ${icon('arrow')}</a>
        </div>
      </div>
    </article>`;
  }

  function placementCard(student, delay = 0) {
    const photo = student.image
      ? imageMarkup(student.image, student.name, initials(student.name))
      : `<span class="fsa-placement-photo-placeholder" aria-hidden="true">${escapeHtml(initials(student.name))}</span>`;
    return `<article class="fsa-placement-card reveal reveal-delay-${Math.min(delay,3)}">
      <div class="fsa-placement-photo">${photo}<span class="fsa-placement-badge">Placed</span></div>
      <div class="fsa-placement-copy">
        <h3>${escapeHtml(student.name)}</h3>
        <p>${escapeHtml(student.role)}</p>
        <small>${escapeHtml(student.company || 'Full Stack Academy Alumni')}</small>
      </div>
    </article>`;
  }

  function homeTestimonialCard(item, delay = 0) {
    const avatar = item.avatar
      ? `<span class="avatar">${imageMarkup(item.avatar,item.name,initials(item.name))}</span>`
      : `<span class="avatar fsa-initial-avatar" aria-hidden="true">${escapeHtml(initials(item.name))}</span>`;
    return `<article class="fsa-home-testimonial reveal reveal-delay-${Math.min(delay,3)}">
      <div class="fsa-home-testimonial-top"><span class="fsa-quote-mark">“</span><div class="fsa-home-testimonial-stars">${stars(item.rating || 5)}</div></div>
      <p>${escapeHtml(item.comment)}</p>
      <div class="fsa-home-testimonial-user">${avatar}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.course)}</small></span></div>
    </article>`;
  }

  let homeInteractionCleanups = [];

  function cleanupHomeInteractions() {
    homeInteractionCleanups.forEach(fn => { try { fn(); } catch (_) {} });
    homeInteractionCleanups = [];
  }

  function initHeroImageSlider() {
    const root = document.querySelector('[data-home-hero-slider]');
    if (!root) return;
    const track = root.querySelector('.fsa-main-slider-track');
    const slides = [...root.querySelectorAll('.fsa-main-slide')];
    const dots = [...root.querySelectorAll('[data-hero-dot]')];
    const cta = root.querySelector('[data-hero-details]');
    const prev = root.querySelector('[data-hero-prev]');
    const next = root.querySelector('[data-hero-next]');
    let index = 0;
    let timer = 0;

    const go = nextIndex => {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%,0,0)`;
      slides.forEach((slide,i) => slide.setAttribute('aria-hidden', i === index ? 'false' : 'true'));
      dots.forEach((dot,i) => {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      if (cta) cta.href = slides[index].dataset.href || '#/courses';
    };
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => go(index + 1), 5200);
    };
    const stop = () => window.clearInterval(timer);
    const onPrev = () => { go(index - 1); start(); };
    const onNext = () => { go(index + 1); start(); };
    const onDot = event => { go(Number(event.currentTarget.dataset.heroDot || 0)); start(); };
    const onEnter = () => stop();
    const onLeave = () => start();

    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);
    dots.forEach(dot => dot.addEventListener('click', onDot));
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('focusin', onEnter);
    root.addEventListener('focusout', onLeave);
    go(0);
    start();

    homeInteractionCleanups.push(() => {
      stop();
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      dots.forEach(dot => dot.removeEventListener('click', onDot));
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('focusin', onEnter);
      root.removeEventListener('focusout', onLeave);
    });
  }

  function initScrollableHomeCarousel(selector, { auto = false, interval = 4800 } = {}) {
    const root = document.querySelector(selector);
    if (!root) return;
    const scope = root.closest('section') || root;
    const track = root.querySelector('[data-carousel-track]') || scope.querySelector('[data-carousel-track]');
    if (!track) return;
    const cards = [...track.querySelectorAll('[data-carousel-card]')];
    const prev = scope.querySelector('[data-carousel-prev]');
    const next = scope.querySelector('[data-carousel-next]');
    const current = scope.querySelector('[data-carousel-current]');
    const total = scope.querySelector('[data-carousel-total]');
    if (!cards.length) return;
    if (total) total.textContent = String(cards.length).padStart(2,'0');
    let timer = 0;
    let scrollFrame = 0;

    const currentIndex = () => {
      const left = track.scrollLeft;
      let best = 0;
      let bestDistance = Infinity;
      cards.forEach((card,i) => {
        const distance = Math.abs((card.offsetLeft - track.offsetLeft) - left);
        if (distance < bestDistance) { bestDistance = distance; best = i; }
      });
      return best;
    };

    const update = () => {
      const i = currentIndex();
      if (current) current.textContent = String(i + 1).padStart(2,'0');
      const disabled = cards.length <= 1;
      if (prev) prev.disabled = disabled;
      if (next) next.disabled = disabled;
    };

    const go = index => {
      if (cards.length <= 1) return;
      const normalized = (index + cards.length) % cards.length;
      const target = cards[normalized];
      track.scrollTo({ left: Math.max(0, target.offsetLeft - track.offsetLeft), behavior:'smooth' });
      window.setTimeout(update, 420);
    };

    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      if (auto && cards.length > 1) timer = window.setInterval(() => go(currentIndex() + 1), interval);
    };
    const restart = () => { stop(); start(); };
    const onPrev = () => { go(currentIndex() - 1); restart(); };
    const onNext = () => { go(currentIndex() + 1); restart(); };
    const onScroll = () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(update);
    };
    const onEnter = () => stop();
    const onLeave = () => start();

    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);
    track.addEventListener('scroll', onScroll, { passive:true });
    scope.addEventListener('mouseenter', onEnter);
    scope.addEventListener('mouseleave', onLeave);
    scope.addEventListener('focusin', onEnter);
    scope.addEventListener('focusout', onLeave);
    update();
    start();

    homeInteractionCleanups.push(() => {
      stop();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
      track.removeEventListener('scroll', onScroll);
      scope.removeEventListener('mouseenter', onEnter);
      scope.removeEventListener('mouseleave', onLeave);
      scope.removeEventListener('focusin', onEnter);
      scope.removeEventListener('focusout', onLeave);
    });
  }

  function initHomeInteractions() {
    cleanupHomeInteractions();
    if (state.currentPath !== '/') return;
    initHeroImageSlider();
    initScrollableHomeCarousel('[data-home-placement-carousel]');
    initScrollableHomeCarousel('[data-home-testimonial-carousel]', { auto:true, interval:5000 });
  }

  function renderHome() {
    setChrome('public');
    const placements=(D.alumni||[]).map(r=>({name:r.name,role:r.role,company:r.company,image:r.image}));
    const placementPages=Array.from({length:Math.ceil(placements.length/10)},(_,i)=>placements.slice(i*10,(i+1)*10));
    const hiringCompanies=(D.companies||[]).filter(r=>r&&r.name);
    const companyRows=hiringCompanies.length?[0,4,8,12].map(offset=>hiringCompanies.map((_,i)=>hiringCompanies[(i+offset)%hiringCompanies.length])):[];
    const onlineCourses=(D.courses||[]).slice(0,8);
    const heroSlides=(D.content?.heroSlides||[]).filter(r=>r&&r.image);
    app.innerHTML = `
      <div class="fsa-homepage">
        <section class="fsa-home-slider-section">
          <div class="fsa-main-slider reveal" data-home-hero-slider>
            <div class="fsa-main-slider-track">
              ${heroSlides.map((slide,i)=>`<a class="fsa-main-slide" href="${slide.href}" data-href="${slide.href}" aria-hidden="${i===0?'false':'true'}"><img src="${slide.image}" alt="${escapeHtml(slide.alt)}" ${i===0?'fetchpriority="high"':'loading="lazy"'}></a>`).join('')}
            </div>
            <button class="fsa-slider-arrow fsa-slider-arrow-prev" type="button" data-hero-prev aria-label="Previous slide">${icon('arrowLeft')}</button>
            <button class="fsa-slider-arrow fsa-slider-arrow-next" type="button" data-hero-next aria-label="Next slide">${icon('arrow')}</button>
            <div class="fsa-main-slider-overlay-controls">
              <div class="fsa-main-slider-dots" aria-label="Slider navigation">
                ${heroSlides.map((_,i)=>`<button type="button" class="${i===0?'active':''}" data-hero-dot="${i}" aria-label="Go to slide ${i+1}" ${i===0?'aria-current="true"':''}></button>`).join('')}
              </div>
              <a class="button button-primary fsa-slider-details" data-hero-details href="${heroSlides[0]?.href||'#/courses'}">See Details ${icon('arrow')}</a>
            </div>
          </div>
        </section>

        <section class="fsa-home-stats">
          <div class="container">
            <p>We have helped hundreds of students land their <strong>dream jobs.</strong></p>
            <div class="fsa-home-stats-grid">
              ${D.stats.map((s,i)=>`<article><span class="fsa-stat-icon">${[icon('users'),icon('award'),icon('briefcase'),icon('certificate'),icon('star','',true)][i]||icon('check')}</span><span><strong>${escapeHtml(s.value)}${escapeHtml(s.suffix||'')}</strong><small>${escapeHtml(s.label)}</small></span></article>`).join('')}
            </div>
          </div>
        </section>

        <section class="fsa-home-section fsa-home-courses-section">
          <div class="container">
            <div class="fsa-home-heading"><span>Learn Anywhere</span><h2>Our Industry-Leading <em>Online Courses</em></h2><p>Choose a job-focused program and learn through structured lessons, projects and progress tracking inside the FSA learning platform.</p></div>
            <div class="fsa-home-course-grid">${onlineCourses.map((c,i)=>homeCourseCard(c,i%4)).join('')}</div>
            <div class="fsa-home-center"><a class="button button-primary" href="#/courses">View All Courses ${icon('arrow')}</a></div>
          </div>
        </section>

        <section class="fsa-home-section fsa-home-branches-section">
          <div class="container">
            <div class="fsa-home-heading"><span>Four Hyderabad Centres</span><h2>Visit Our <em>Branches</em></h2><p>Four branches, one learning community. Choose the centre closest to you for classroom training, mentoring and career support.</p></div>
            <div class="fsa-home-branch-grid">${D.branches.map((b,i)=>homeBranchCard(b,i)).join('')}</div>
          </div>
        </section>

        <section class="fsa-home-help">
          <div class="container">
            <div class="fsa-home-heading"><span>Our Services</span><h2>How Can We <em>Help You?</em></h2></div>
            <div class="fsa-home-help-grid">
              ${[
                ['01','phone','Talk To Our Counselor','Discuss your career goals with our expert counselors and create a personalized learning plan.'],
                ['02','book','Get Enrolled In A Course','Enroll in our comprehensive technology courses and gain industry-relevant skills.'],
                ['03','code','Master The Technology','Upskill or reskill with our expert-led courses and become a master in technology.'],
                ['04','award','Land Your Dream Job','Launch your dream career in technology with our career-focused courses and support.']
              ].map((x,i)=>`<article class="fsa-home-help-card reveal reveal-delay-${i%4}"><span class="fsa-home-help-icon">${icon(x[1])}</span><strong>${x[0]}</strong><h3>${x[2]}</h3><p>${x[3]}</p></article>`).join('')}
            </div>
            <div class="fsa-home-center"><a class="button button-primary" href="#/contact">Book Your Demo Now</a></div>
          </div>
        </section>

        <section class="fsa-home-award"><div class="container"><img class="reveal" src="assets/images/fsa-home/award.jpg" alt="Full Stack Academy Ed-Tech Skill Development Academy of the Year award" loading="lazy"></div></section>

        <section class="fsa-home-section fsa-home-mission">
          <div class="container">
            <div class="fsa-home-mission-top">
              <div class="reveal">
                <span class="fsa-home-kicker">About Full Stack Academy</span>
                <h2>We Are On A <em>Mission</em></h2>
                <p>Full Stack Academy is committed to bridging the gap between tech education and industry demands. We equip learners with cutting-edge skills, hands-on training, and expert mentorship to ensure they stay ahead in the evolving tech landscape. Our mission is to empower students with real-world knowledge, foster industry connections, and create opportunities for successful careers. Through innovative courses and career-focused support, we prepare individuals to thrive in the competitive job market and achieve their professional aspirations.</p>
                <a class="fsa-text-link" href="#/about">Know More About FSA ${icon('arrow')}</a>
              </div>
              <div class="fsa-home-mission-photo reveal reveal-delay-2"><img src="assets/images/fsa-home/mission.jpg" alt="Full Stack Academy team at Hyderabad Business Expo" loading="lazy"></div>
            </div>
            <div class="fsa-home-feature-grid">
              ${[
                ['users','Learn From Industry-Experienced Instructors','Full Stack Academy prides itself on having industry professionals as instructors. This means that students are learning from individuals who have real-world experience and up-to-date knowledge of the technologies and practices used in the field. This hands-on experience can greatly enhance the quality of education and preparation for students’ future careers.'],
                ['briefcase','Strong Industry Partnerships And Placement Support','Full Stack Academy has established strategic partnerships with leading companies in the IT industry. These partnerships can lead to valuable networking opportunities, internships, and even job placements for graduates.'],
                ['book','Industry-Relevant Curriculum','Full Stack Academy’s curriculum is designed to match current industry trends and demands. By staying up to date with the latest technologies and best practices, the institute ensures that students are learning skills that are directly applicable to the job market. This can give graduates a competitive edge when seeking employment after completing their training.'],
                ['sparkles','Comprehensive Training Portfolio','Full Stack Academy offers a diverse range of training programs, covering a variety of IT technologies such as AWS DevOps, MERN stack, and Data Science. This comprehensive portfolio allows students to choose the specialization that aligns with their interests.']
              ].map((x,i)=>`<article class="fsa-home-feature reveal reveal-delay-${i%4}"><span>${icon(x[0])}</span><div><h3>${x[1]}</h3><p>${x[2]}</p></div></article>`).join('')}
            </div>
          </div>
        </section>

        <section class="fsa-home-section fsa-home-placements" data-home-placement-carousel>
          <div class="container">
            <div class="fsa-carousel-heading-row">
              <div class="fsa-home-heading fsa-home-heading-left"><span>Career Outcomes</span><h2>Successfully <em>Placed Students</em></h2><p>Meet some of the Full Stack Academy learners who moved into software, cloud and technical roles.</p></div>
              <div class="fsa-carousel-nav" aria-label="Placement slider controls"><button type="button" data-carousel-prev aria-label="Previous placement page">${icon('arrowLeft')}</button><span><b data-carousel-current>01</b> / <span data-carousel-total>${String(placementPages.length).padStart(2,'0')}</span></span><button type="button" data-carousel-next aria-label="Next placement page">${icon('arrow')}</button></div>
            </div>
            <div class="fsa-placement-carousel">
              <div class="fsa-placement-track" data-carousel-track>
                ${placementPages.map((page,pageIndex)=>`<div class="fsa-placement-page" data-carousel-card><div class="fsa-placement-grid">${page.map((x,i)=>placementCard(x,(pageIndex*10)+i)).join('')}</div></div>`).join('')}
              </div>
            </div>
            <div class="fsa-home-center"><a class="button button-secondary" href="#/alumni">View All Placed Students ${icon('arrow')}</a></div>
          </div>
        </section>

        <section class="fsa-home-section fsa-home-companies">
          <div class="container">
            <div class="fsa-home-heading"><span>Industry Network</span><h2>Companies That Hired Our <em>Students</em></h2></div>
            <div class="fsa-company-marquees" aria-label="Companies that hired Full Stack Academy students">
              ${companyRows.map((row,rowIndex)=>`<div class="fsa-company-marquee-row ${rowIndex % 2 ? 'is-reverse' : ''}"><div class="fsa-company-marquee-track"><div class="fsa-company-marquee-group">${row.map(x=>`<div class="fsa-company-logo"><span class="fsa-company-logo-mark">${x.logo?`<img src="${escapeHtml(x.logo)}" alt="${escapeHtml(x.name)}" loading="lazy">`:escapeHtml(initials(x.name))}</span><span class="fsa-company-logo-name">${escapeHtml(x.name)}</span></div>`).join('')}</div><div class="fsa-company-marquee-group" aria-hidden="true">${row.map(x=>`<div class="fsa-company-logo"><span class="fsa-company-logo-mark">${x.logo?`<img src="${escapeHtml(x.logo)}" alt="${escapeHtml(x.name)}" loading="lazy">`:escapeHtml(initials(x.name))}</span><span class="fsa-company-logo-name">${escapeHtml(x.name)}</span></div>`).join('')}</div></div></div>`).join('')}
            </div>
          </div>
        </section>

        <div data-review-experience-anchor></div>

        <section class="fsa-home-learning-choice">
          <div class="container">
            <div class="fsa-learning-choice-panel reveal">
              <div class="fsa-learning-choice-copy"><span>Have Questions?</span><h2>Learn online or visit an FSA branch.</h2><p>Choose the format that works best for you. Learn from anywhere through the FSA LMS, or visit one of our Hyderabad branches for classroom guidance.</p></div>
              <div class="fsa-learning-choice-options">
                <a class="fsa-learning-choice-card" href="#/courses"><span class="fsa-learning-choice-icon">${icon('play','',true)}</span><span><small>FSA ONLINE</small><strong>Learn Online</strong><em>Explore online courses and start learning from any screen.</em><b>Explore Courses ${icon('arrow')}</b></span></a>
                <a class="fsa-learning-choice-card" href="#/branches"><span class="fsa-learning-choice-icon">${icon('map')}</span><span><small>HYDERABAD CENTRES</small><strong>Visit An FSA Branch</strong><em>Ameerpet, Gachibowli, Tolichowki and Charminar.</em><b>View Branches ${icon('arrow')}</b></span></a>
              </div>
            </div>
          </div>
        </section>
      </div>`;
  }

  function filteredCourses() {
    let list = [...D.courses];
    const f = state.courseFilters;
    const q = f.query.trim().toLowerCase();
    if (q) list = list.filter(c => `${c.title} ${c.category} ${c.short} ${c.skills.join(' ')}`.toLowerCase().includes(q));
    if (f.categories.length) list = list.filter(c => f.categories.includes(c.category));
    if (f.levels.length) list = list.filter(c => f.levels.some(level => c.level.toLowerCase().includes(level.toLowerCase())));
    if (f.price.length) list = list.filter(c => f.price.includes('paid'));
    if (f.rating) list = list.filter(c => c.rating >= f.rating);
    if (f.sort === 'rating') list.sort((a,b)=>b.rating-a.rating);
    if (f.sort === 'newest') list.sort((a,b)=>b.id-a.id);
    if (f.sort === 'low') list.sort((a,b)=>a.price-b.price);
    if (f.sort === 'high') list.sort((a,b)=>b.price-a.price);
    if (f.sort === 'popular') list.sort((a,b)=>b.students-a.students);
    return list;
  }

  function filterSidebar() {
    return `<aside class="filter-sidebar" id="courseFilters"><div class="filter-sidebar-head"><h3>Filters</h3><button class="clear-button" data-action="clear-filters">Clear all</button></div>
      <div class="filter-group"><h4>Category</h4><div class="check-list">${D.categories.map(c=>`<label class="check-option"><input type="checkbox" name="course-category" value="${c.name}" ${state.courseFilters.categories.includes(c.name)?'checked':''}> <span>${c.name} (${c.count})</span></label>`).join('')}</div></div>
      <div class="filter-group"><h4>Learning level</h4><div class="check-list">${['Beginner','Intermediate','Advanced'].map(level=>`<label class="check-option"><input type="checkbox" name="course-level" value="${level}" ${state.courseFilters.levels.includes(level)?'checked':''}> <span>${level}</span></label>`).join('')}</div></div>
      <div class="filter-group"><h4>Rating</h4><div class="check-list">${[4.8,4.5,4.0].map(r=>`<label class="check-option"><input type="radio" name="course-rating" value="${r}" ${state.courseFilters.rating===r?'checked':''}> <span>${r}+ rating</span></label>`).join('')}<label class="check-option"><input type="radio" name="course-rating" value="0" ${!state.courseFilters.rating?'checked':''}> <span>Any rating</span></label></div></div>
      <div class="filter-group"><h4>Price type</h4><div class="check-list"><label class="check-option"><input type="checkbox" name="course-price" value="paid" ${state.courseFilters.price.includes('paid')?'checked':''}> <span>One-time purchase</span></label></div></div>
    </aside>`;
  }

  function activeFilterPills() {
    const all = [...state.courseFilters.categories, ...state.courseFilters.levels];
    if (state.courseFilters.rating) all.push(`${state.courseFilters.rating}+ rating`);
    if (state.courseFilters.query) all.push(`Search: ${state.courseFilters.query}`);
    return all.length ? `<div class="active-filters">${all.map(v=>`<span class="filter-pill">${escapeHtml(v)}<button data-action="remove-filter" data-value="${escapeHtml(v)}">×</button></span>`).join('')}</div>` : '';
  }

  const COURSE_CATALOG_FORMATS=[
    {ui:'classroom',api:'offline',label:'Physical / Offline',icon:'classroom',tone:'classroom'},
    {ui:'recorded',api:'recorded',label:'Recorded',icon:'video',tone:'recorded'},
    {ui:'live',api:'live',label:'Live Streamed',icon:'radio',tone:'live'}
  ];
  function formatForCourseCard(course){
    const explicit=COURSE_CATALOG_FORMATS.find(format=>format.ui===course?._catalogMode);
    if(explicit)return explicit;
    const delivery=courseDelivery(course);
    return COURSE_CATALOG_FORMATS.find(format=>delivery[format.ui])||COURSE_CATALOG_FORMATS[0];
  }
  // One database course produces exactly one public catalogue card.
  // Only formats enabled in MySQL are offered as separate selectable links.
  function catalogCourseCard(course,index=0){
    const enabled=COURSE_CATALOG_FORMATS.filter(format=>courseDelivery(course)[format.ui]);
    if(!enabled.length)return '';
    const selected=enabled.find(format=>format.ui===state.courseMode)||enabled[0];
    const item=courseContentForMode(course,selected.ui);
    const title=String(course.title||'Course');
    const link=`#/course/${encodeURIComponent(course.slug)}?mode=${encodeURIComponent(selected.ui)}`;
    const image=item.image||course.image||'';
    const summary=String(item.short||item.description||course.short||'').trim();
    const amount=Number(item.price||0),original=Number(item.originalPrice||0);
    const originalMarkup=original>amount?`<del>${money(original)}</del>`:'';
    const formatOptions=enabled.map(format=>{
      const label=String(D.content?.coursesPage?.formatLabels?.[format.ui]||format.label);
      const target=`#/course/${encodeURIComponent(course.slug)}?mode=${encodeURIComponent(format.ui)}`;
      return `<a class="mode-pill ${format.tone} fsa-catalog-offering" href="${target}" title="View ${escapeHtml(label)} course" aria-label="${escapeHtml(title)}: ${escapeHtml(label)}"><span class="fsa-catalog-badge-icon" aria-hidden="true">${icon(format.icon)}</span><span class="fsa-catalog-badge-label">${escapeHtml(label)}</span></a>`;
    }).join('');
    const cardState=purchaseState(course.id,selected.api);
    const badge=cardState.kind==='owned'?'Enrolled':cardState.kind==='pending'?'Approval pending':cardState.kind==='restricted'?'Manage access':'';
    return `<article class="fsa-catalog-course fsa-format-course reveal reveal-delay-${Math.min(index%4,3)}" data-mode="${enabled.map(f=>f.ui).join(' ')}" data-title="${escapeHtml(`${title} ${course.category||''}`.toLowerCase())}">
      <a class="fsa-catalog-media" href="${link}">${imageMarkup(image,title,initials(title))}${item.badge?`<span class="fsa-catalog-certified">${escapeHtml(item.badge)}</span>`:''}<span class="fsa-catalog-media-arrow">${icon('arrow')}</span></a>
      <div class="fsa-catalog-body"><div class="fsa-catalog-mode-row fsa-catalog-offerings" aria-label="Available learning formats">${formatOptions}${badge?`<span class="fsa-format-ownership">${escapeHtml(badge)}</span>`:''}</div>
        <h3><a href="${link}">${escapeHtml(title)}</a></h3>
        ${summary?`<p>${textHtml(summary)}</p>`:''}
        <div class="fsa-catalog-meta">${item.duration?`<span>${icon('clock')} ${escapeHtml(item.duration)}</span>`:''}${Number(item.projects)>0?`<span>${icon('project')} ${Number(item.projects)} project${Number(item.projects)===1?'':'s'}</span>`:''}${Number(item.rating)>0?`<span>${icon('star','',true)} ${escapeHtml(item.rating)}/5</span>`:''}</div>
        <div class="fsa-catalog-location">${icon('layers')}<span><strong>${enabled.length} available learning format${enabled.length===1?'':'s'}</strong><small>Choose Physical, Live or Recorded above to view its own details and price.</small></span></div>
        <div class="fsa-catalog-footer"><span class="fsa-catalog-price"><strong>${money(amount)}</strong>${originalMarkup}${enabled.length>1?'<small class="fsa-catalog-price-note"> Starting format shown</small>':''}</span><a class="button button-outline button-sm" href="${link}">View Course ${icon('arrow')}</a></div>
      </div>
    </article>`;
  }
  function filteredCatalogCourses(){
    const query=String(state.courseFilters.query||'').trim().toLowerCase();
    return [...catalogCourses()].sort((a,b)=>{
      const stamp=r=>{const t=Date.parse(r.created_at||r.createdAt||r.created||'');return Number.isFinite(t)?t:0;};
      return stamp(b)-stamp(a)||(Number(b.id)||0)-(Number(a.id)||0);
    }).filter(course=>{
      const enabled=COURSE_CATALOG_FORMATS.filter(format=>courseDelivery(course)[format.ui] && (state.courseMode==='all'||state.courseMode===format.ui));
      if(!enabled.length)return false;
      if(!query)return true;
      const searchable=[course.title,course.category,course.short,course.description,course.skills?.join(' '),
        ...enabled.flatMap(format=>{const item=courseContentForMode(course,format.ui);return [format.label,item.short,item.description,(item.skills||[]).join(' ')];})].join(' ').toLowerCase();
      return query.split(/\s+/).every(word=>searchable.includes(word));
    });
  }
  function courseCatalogueCountLabel(list){
    return `${list.length} course${list.length===1?'':'s'}`;
  }
  function courseCatalogueMarkup(list){
    return list.length?list.map((course,index)=>catalogCourseCard(course,index)).join(''):
      `<div class="fsa-catalog-empty"><span>${icon('search')}</span><h3>No course found</h3><p>Try another keyword or learning mode.</p><button class="button button-primary" data-action="course-mode" data-mode="all">Show all courses</button></div>`;
  }

  function updateCoursesResults() {
    const list=filteredCatalogCourses();
    const grid=document.getElementById('fsaCourseCatalogGrid');
    const count=document.getElementById('courseResultCount');
    if(!grid||!count)return;
    count.textContent=courseCatalogueCountLabel(list);
    grid.innerHTML=courseCatalogueMarkup(list);
    initReveal();
  }

  function batchCard(row,index=0) {
    const modeClass=row.mode==='Offline Classroom'?'classroom':row.mode==='Recorded'?'recorded':'live';
    const date=row.start==='Start Anytime'?['START','ANYTIME']:row.start.split(' ');
    const seatText=row.seats?`${row.seats} seats open`:'Flexible access';
    const placeIcon=row.mode==='Offline Classroom'?'map':row.mode==='Live Streamed'?'radio':'video';
    return `<article class="fsa-batch-card reveal reveal-delay-${Math.min(index%4,3)}"><div class="fsa-batch-top"><span class="fsa-batch-date"><strong>${escapeHtml(date[0])}</strong><small>${escapeHtml(date[1]||'')}</small></span><span class="mode-pill ${modeClass}">${escapeHtml(row.mode)}</span></div><h3>${escapeHtml(row.course)}</h3><div class="fsa-batch-details"><span>${icon('clock')}<b>${escapeHtml(row.time)}</b></span><span>${icon(placeIcon)}<b>${escapeHtml(row.branch)}</b></span><span>${icon(row.seats?'users':'check')}<b>${seatText}</b></span></div><a class="fsa-batch-link" href="#/course/${encodeURIComponent(row.slug)}">View course ${icon('arrow')}</a></article>`;
  }

  function publicBatchBranches() {
    const names = new Map();
    for (const b of Array.isArray(D.branches) ? D.branches : []) {
      const label = String(b.shortName || b.name || '').replace(/^FSA\s*[—-]\s*/i,'').trim();
      if (label) names.set(label.toLowerCase(),label);
    }
    for (const b of batchRows()) {
      const label=String(b.branch||'').trim();
      if (label && !/^(online|remote|start anytime)$/i.test(label)) names.set(label.toLowerCase(),label);
    }
    return [['all','All Locations'],['online','Online'], ...[...names].sort((a,b)=>a[1].localeCompare(b[1])).map(([key,label])=>[key,label])];
  }

  function batchFilterSelect(type,value,compact=false) {
    const filters={
      shift:{label:'Time',hint:'Choose schedule',iconName:'clock',options:[['all','All Times'],['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['anytime','Start Anytime']]},
      mode:{label:'Mode',hint:'Choose learning mode',iconName:'layers',options:[['all','All Modes'],['live-streamed','Live Streamed'],['recorded','Recorded'],['offline-classroom','Offline Classroom']]},
      branch:{label:'Branch',hint:'Choose location',iconName:'map',options:publicBatchBranches()}
    };
    const filter=filters[type];
    return `<label class="fsa-batch-dropdown ${compact?'compact':''}"><span class="fsa-batch-dropdown-icon">${icon(filter.iconName)}</span><span class="fsa-batch-dropdown-copy"><small>${filter.label}</small><strong>${filter.hint}</strong></span><select data-batch-filter-select="${type}" aria-label="${filter.label} filter">${filter.options.map(([key,label])=>`<option value="${key}" ${key===value?'selected':''}>${label}</option>`).join('')}</select></label>`;
  }

  function upgradeBatchDropdowns() {
    const full=document.querySelector('.fsa-batches-filter-stack');
    if(full){
      full.outerHTML=`<div class="fsa-batch-dropdown-grid">${batchFilterSelect('shift',state.batchShift)}${batchFilterSelect('mode',state.batchMode)}${batchFilterSelect('branch',state.batchBranch)}</div>`;
      const note=document.querySelector('.fsa-batches-directory-head p');
      if(note)note.textContent='Use the three premium dropdowns to quickly narrow the complete schedule.';
    }
    const detail=document.querySelector('.fsa-batch-filters.detail');
    if(detail)detail.outerHTML=`<div class="fsa-batch-dropdown-grid detail">${batchFilterSelect('shift',state.batchShift,true)}${batchFilterSelect('mode',state.batchMode,true)}</div>`;
    window.FSA_UI?.enhanceSelects?.(app);
  }

  function updateBatchResults(course=null) {
    const wrap=document.getElementById('fsaBatchGrid');
    const count=document.getElementById('batchResultCount');
    if(!wrap)return;
    const q=String(state.batchQuery||'').trim().toLowerCase();
    const rows=batchRows(course).filter(row=>{
      const shiftOk=state.batchShift==='all'||row.shift.toLowerCase()===state.batchShift||(row.shift==='Anytime'&&state.batchShift==='anytime');
      const branchOk=state.batchBranch==='all'||String(row.branch||'').trim().toLowerCase()===state.batchBranch;
      const modeKey=row.mode.toLowerCase().replace(/\s+/g,'-');
      const modeOk=state.batchMode==='all'||modeKey===state.batchMode;
      const queryOk=!q||`${row.course} ${row.mode} ${row.branch} ${row.shift} ${row.time}`.toLowerCase().includes(q);
      return shiftOk&&branchOk&&modeOk&&queryOk;
    });
    if(count)count.innerHTML=`<strong>${rows.length}</strong> ${rows.length===1?'option':'options'} found`;
    const limit=state.currentPath==='/batches'?rows.length:12;
    wrap.innerHTML=rows.length?rows.slice(0,limit).map(batchCard).join(''):`<div class="${state.currentPath==='/batches'?'fsa-batches-page-empty':'fsa-catalog-empty'}"><span>${icon('calendar')}</span><h3>No learning option matches these filters</h3><p>Try another course, time, branch or delivery mode.</p></div>`;
    initReveal();
  }

  function reviewCard(review,courseTitle='') {
    return `<article class="fsa-course-review"><div class="fsa-course-review-head"><span class="fsa-course-review-avatar">${imageMarkup(review.avatar,review.name,initials(review.name))}</span><span><strong>${escapeHtml(review.name)}</strong><small>${escapeHtml(review.role||`${courseTitle} learner`)}</small></span></div>${stars(Math.round(review.rating||5))}<p>“${escapeHtml(review.text)}”</p></article>`;
  }

  function faqMarkup(items) {
    return `<div class="fsa-course-faq-list">${items.map((item,index)=>`<article class="fsa-course-faq ${index===0?'open':''}"><button type="button" data-action="toggle-faq"><span>${escapeHtml(item.q)}</span>${icon('plus')}</button><div><p>${escapeHtml(item.a)}</p></div></article>`).join('')}</div>`;
  }

  function courseModePanel() {
    return `<div class="fsa-learning-mode-cards"><article><span class="fsa-mode-icon">${icon('radio')}</span><div><strong>Live Streamed</strong><p>Instructor-led online classes on a fixed batch schedule, delivered live so learners can join remotely in real time.</p></div></article><article><span class="fsa-mode-icon">${icon('video')}</span><div><strong>Recorded</strong><p>Flexible self-paced access to recorded lessons, notes, resources, projects, progress and certificates inside the learner area.</p></div></article><article><span class="fsa-mode-icon">${icon('classroom')}</span><div><strong>Offline Classroom</strong><p>In-person instructor-led training at Ameerpet, Gachibowli, Tolichowki or Charminar with branch batch schedules.</p></div></article></div>`;
  }

  function renderCourses() {
    if(!document.getElementById('fsaSingleCardCourseStyle')){ const css=document.createElement('style');css.id='fsaSingleCardCourseStyle';css.textContent='/* One course card, compact clickable backend-enabled formats. */\n.fsa-catalog-offerings{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}\n.fsa-catalog-offerings .fsa-catalog-offering{display:inline-flex;gap:5px;align-items:center;white-space:nowrap;text-decoration:none;cursor:pointer;line-height:1.2;padding:6px 9px;height:auto;min-height:27px;}\n.fsa-catalog-offering .fsa-catalog-badge-icon,.fsa-catalog-offering .fsa-catalog-badge-icon svg{width:13px;height:13px;flex:none;}\n.fsa-catalog-offering .fsa-catalog-badge-label{white-space:nowrap;}\n.fsa-catalog-offering:hover,.fsa-catalog-offering:focus-visible{filter:brightness(.94);outline-offset:2px;}\n.fsa-catalog-price-note{display:block;font-size:10px;color:#85777b;font-weight:400;}\n@media(max-width:640px){.fsa-catalog-offerings{gap:5px}.fsa-catalog-offerings .fsa-catalog-offering{padding:5px 7px;font-size:10px;}}\n';document.head.appendChild(css);}
    setChrome('public');
    const queryParams=new URLSearchParams(state.currentPath.split('?')[1]||'');
    if(queryParams.get('q'))state.courseFilters.query=queryParams.get('q');
    const requestedMode=queryParams.get('mode');
    if(['all','live','recorded','classroom'].includes(requestedMode))state.courseMode=requestedMode;
    const list=filteredCatalogCourses();
    const reviews=globalWrittenReviews();
    app.innerHTML=`<section class="fsa-courses-hero"><div class="container fsa-courses-hero-grid"><div class="fsa-courses-hero-copy reveal"><span class="eyebrow">Technology Courses</span><h1>Choose the learning format that <em>fits you.</em></h1><p>Full Stack Academy courses now use three clear delivery types across the website: Live Streamed, Recorded and Offline Classroom.</p><div class="fsa-course-hero-actions"><a class="button button-primary" href="#course-catalog">Explore Courses ${icon('arrow')}</a><a class="button button-secondary" href="#/batches">View All Batches</a></div><div class="fsa-course-hero-points"><span>${icon('radio')} Live Streamed</span><span>${icon('video')} Recorded</span><span>${icon('classroom')} Offline Classroom</span></div></div><div class="fsa-courses-hero-art reveal reveal-scale"><div class="fsa-courses-hero-main">${imageMarkup(D.academyImages?.learning||catalogCourses()[0]?.image,'Students learning technology at Full Stack Academy','FSA')}</div><div class="fsa-course-hero-badge"><span>${icon('layers')}</span><div><small>3 LEARNING FORMATS</small><strong>One catalogue. Clear delivery choices.</strong></div></div></div></div></section>
      <section class="fsa-mode-strip"><div class="container"><div class="fsa-mode-strip-head"><span class="eyebrow">Choose Your Learning Mode</span><p>Filter the catalogue by the way you want to learn.</p></div>${courseModePanel()}</div></section>
      <section class="fsa-courses-section" id="course-catalog"><div class="container"><div class="fsa-course-section-head"><div><span class="eyebrow">Current Admissions</span><h2>Our Industry-Leading <em>Courses</em></h2><p>Search the catalogue, then swipe or scroll the mode filter independently without moving the page.</p></div><div class="fsa-course-search-box">${icon('search')}<input id="courseSearchInput" type="search" value="${escapeHtml(state.courseFilters.query)}" placeholder="Search course, skill or technology..."></div></div><div class="fsa-course-filterbar"><div class="fsa-course-mode-tabs"><button class="${state.courseMode==='all'?'active':''}" data-action="course-mode" data-mode="all">All Courses</button><button class="${state.courseMode==='live'?'active':''}" data-action="course-mode" data-mode="live">Live Streamed</button><button class="${state.courseMode==='recorded'?'active':''}" data-action="course-mode" data-mode="recorded">Recorded</button><button class="${state.courseMode==='classroom'?'active':''}" data-action="course-mode" data-mode="classroom">Offline Classroom</button></div><span id="courseResultCount">${courseCatalogueCountLabel(list)}</span></div><div class="fsa-course-catalog-grid" id="fsaCourseCatalogGrid">${courseCatalogueMarkup(list)}</div></div></section>
      <section class="fsa-batches-section" id="upcoming-batches"><div class="container"><div class="fsa-batches-title"><span class="eyebrow">Admissions Schedule</span><h2>Upcoming <em>Learning Options</em></h2><p>Live Streamed and Offline Classroom options follow scheduled batches. Recorded courses can start anytime.</p></div><div class="fsa-batch-dropdown-grid compact">${batchFilterSelect('shift',state.batchShift,true)}${batchFilterSelect('mode',state.batchMode,true)}${batchFilterSelect('branch',state.batchBranch,true)}</div><div class="fsa-batch-grid" id="fsaBatchGrid">${batchRows().slice(0,12).map(batchCard).join('')}</div><div class="fsa-batch-bottom"><span class="fsa-batch-count" id="batchResultCount"></span><a class="button button-secondary button-sm" href="#/batches">Open Full Batches Page ${icon('arrow')}</a></div></div></section>
      <section class="fsa-course-reviews-section"><div class="container"><div class="fsa-carousel-heading-row"><div class="fsa-course-section-head compact"><div><span class="eyebrow">Student Experience</span><h2>What our <em>students say.</em></h2><p>Feedback from learners across Full Stack Academy programs.</p></div></div><div class="fsa-carousel-nav"><button class="fsa-carousel-button" data-action="course-review-prev" aria-label="Previous reviews">${icon('arrowLeft')}</button><span class="fsa-review-counter"><b data-review-current>01</b> / <span data-review-total>${String(reviews.length).padStart(2,'0')}</span></span><button class="fsa-carousel-button" data-action="course-review-next" aria-label="Next reviews">${icon('arrow')}</button></div></div><div class="fsa-course-review-viewport"><div class="fsa-course-review-track" data-course-review-track>${reviews.map(r=>reviewCard(r)).join('')}</div></div></div></section>
      <section class="fsa-course-help-section"><div class="container"><div class="fsa-course-help-panel reveal"><div><span class="eyebrow light">Need Help Choosing?</span><h2>Tell us your goal and preferred learning mode.</h2><p>Our team can help you compare Live Streamed, Recorded and Offline Classroom options and select the right batch.</p></div><div class="fsa-course-help-actions"><button class="button button-light" data-action="open-call-popup">Get A Call</button><a class="button button-ghost-light" href="#/batches">See Batches</a></div></div></div></section>
      <section class="fsa-courses-faq-section"><div class="container fsa-faq-layout"><div><span class="eyebrow">Courses FAQ</span><h2>Questions before you <em>enroll.</em></h2><p>Understand the three delivery modes, batches, projects and certificates before choosing.</p><button class="button button-primary" data-action="open-call-popup">Talk To A Counselor</button></div>${faqMarkup(courseFaqs(catalogCourses()[0]).slice(0,7))}</div></section>`;
    requestAnimationFrame(()=>updateBatchResults());
  }

  function courseDetailReviewSection(course) {
    const reviews=courseReviews(course);
    if(!reviews.length)return '';
    return `<section class="fsa-course-detail-reviews"><div class="container"><div class="fsa-carousel-heading-row"><div><span class="eyebrow">Course Reviews</span><h2>Student reviews for <em>${escapeHtml(course.title)}.</em></h2></div>${reviews.length>1?`<div class="fsa-carousel-nav"><button class="fsa-carousel-button" data-action="course-review-prev" aria-label="Previous reviews">${icon('arrowLeft')}</button><span class="fsa-review-counter"><b data-review-current>01</b> / <span data-review-total>${String(reviews.length).padStart(2,'0')}</span></span><button class="fsa-carousel-button" data-action="course-review-next" aria-label="Next reviews">${icon('arrow')}</button></div>`:''}</div><div class="fsa-course-review-viewport"><div class="fsa-course-review-track" data-course-review-track>${reviews.map(r=>reviewCard(r,course.title)).join('')}</div></div></div></section>`;
  }

  function renderCourseDetail(slug,requestedMode="") {
    let course=courseBySlug(slug);
    if(!course)return renderNotFound();
    setChrome('public');
    const delivery=courseDelivery(course);
    const requested=requestedMode || '';
    const available={live:delivery.live,recorded:delivery.recorded,classroom:delivery.classroom};
    state.detailDeliveryMode=available[requested]?requested:(course.deliveryMode==='offline'&&delivery.classroom?'classroom':course.deliveryMode==='recorded'&&delivery.recorded?'recorded':course.deliveryMode==='live'&&delivery.live?'live':delivery.live?'live':delivery.recorded?'recorded':'classroom');
    state.batchShift='all';state.batchBranch='all';state.batchMode='all';
    course=courseContentForMode(course,state.detailDeliveryMode);
    const modules=courseModules(course).filter(m=>m&&m.title);
    // Per-course FAQ, review, and project sections are no longer shown in public course pages.
    const skills=Array.isArray(course.skills)?course.skills.filter(Boolean):[];
    const requirements=Array.isArray(course.requirements)?course.requirements.filter(Boolean):[];
    const audience=Array.isArray(course.audience)?course.audience.filter(Boolean):[];
    const summary=[
      course.duration?{icon:'clock',label:'Duration',value:course.duration}:null,
      Number(course.hours)>0?{icon:'book',label:'Learning hours',value:String(Number(course.hours))}:null,
      course.level?{icon:'award',label:'Level',value:course.level}:null,
      course.language?{icon:'users',label:'Language',value:course.language}:null
    ].filter(Boolean);
    const related=catalogCourses().filter(c=>c.id!==course.id).sort((a,b)=>Number(b.category===course.category)-Number(a.category===course.category)).slice(0,3);
    const batches=batchRows(course);
    const modeButtons=`${delivery.live?`<button class="${state.detailDeliveryMode==='live'?'active':''}" data-action="detail-mode" data-mode="live" aria-label="Live Streamed" title="Live Streamed">${icon('radio')}</button>`:''}${delivery.recorded?`<button class="${state.detailDeliveryMode==='recorded'?'active':''}" data-action="detail-mode" data-mode="recorded" aria-label="Recorded" title="Recorded">${icon('video')}</button>`:''}${delivery.classroom?`<button class="${state.detailDeliveryMode==='classroom'?'active':''}" data-action="detail-mode" data-mode="classroom" aria-label="Physical / Offline" title="Physical / Offline">${icon('classroom')}</button>`:''}`;
    const detailMode=state.detailDeliveryMode==='classroom'?'offline':state.detailDeliveryMode;
    const detailStatus=purchaseState(course.id,detailMode);
    const modeName=state.detailDeliveryMode==='classroom'?'Physical / Offline':state.detailDeliveryMode==='recorded'?'Recorded':'Live';
    const modeIcon=state.detailDeliveryMode==='classroom'?'classroom':state.detailDeliveryMode==='recorded'?'video':'radio';
    const modeCopy=`<span>${icon(modeIcon)}</span><div><strong>${modeName}</strong>${course.short?`<p>${textHtml(course.short)}</p>`:''}</div>`;
    const curriculumSection=modules.length?`<section class="fsa-detail-block"><div class="fsa-detail-heading-inline"><div><span class="eyebrow">Curriculum</span><h2>What you will <em>learn.</em></h2></div><span>${modules.length} module${modules.length===1?'':'s'}</span></div><div class="fsa-detail-curriculum">${modules.map((m,mi)=>`<article class="fsa-detail-module ${mi===0?'open':''}"><button data-action="toggle-module"><span><small>MODULE ${String(mi+1).padStart(2,'0')}</small><strong>${escapeHtml(m.title)}</strong></span><span>${escapeHtml(m.duration||'')} ${icon('chevronDown')}</span></button><div><ul>${(m.lessons||[]).filter(l=>l.title).map(l=>`<li><span>${icon('book')}</span><b>${escapeHtml(l.title)}</b><small>${escapeHtml(l.duration||'')}</small></li>`).join('')}</ul></div></article>`).join('')}</div></section>`:'';
    const overviewParts=[];
    if(course.description)overviewParts.push(`<p>${textHtml(course.description)}</p>`);
    if(skills.length)overviewParts.push(`<div class="fsa-skill-grid">${skills.map(skill=>`<span>${icon('check')} ${escapeHtml(skill)}</span>`).join('')}</div>`);
    if(requirements.length||audience.length)overviewParts.push(`<div class="mission-grid" style="margin-top:22px">${requirements.length?`<div class="form-section"><h3>Requirements</h3><ul class="simple-list">${requirements.map(r=>`<li>${icon('check')} ${escapeHtml(r)}</li>`).join('')}</ul></div>`:''}${audience.length?`<div class="form-section"><h3>Who this course is for</h3><ul class="simple-list">${audience.map(a=>`<li>${icon('check')} ${escapeHtml(a)}</li>`).join('')}</ul></div>`:''}</div>`);
    const overviewSection=(course.contentHeading||overviewParts.length)?`<section class="fsa-detail-block"><span class="eyebrow">Course Overview</span>${course.contentHeading?`<h2>${escapeHtml(course.contentHeading)}</h2>`:''}${overviewParts.join('')}</section>`:'';
    const batchSection=batches.length?`<section class="fsa-detail-block" id="course-batches"><div class="fsa-detail-heading-inline"><div><span class="eyebrow">Learning schedule</span><h2>Available <em>batches.</em></h2></div><span id="batchResultCount"></span></div><div class="fsa-batch-filters detail"><div><small>Time</small>${['all','morning','afternoon','evening','anytime'].map(v=>`<button class="${state.batchShift===v?'active':''}" data-action="batch-shift" data-value="${v}">${v==='all'?'All':v==='anytime'?'Anytime':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div><div><small>Mode</small>${[['all','All'],['live-streamed','Live'],['recorded','Recorded'],['offline-classroom','Classroom']].map(([v,l])=>`<button class="${state.batchMode===v?'active':''}" data-action="batch-mode" data-value="${v}">${l}</button>`).join('')}</div></div><div class="fsa-batch-grid detail" id="fsaBatchGrid">${batches.map(batchCard).join('')}</div></section>`:'';
    const sideDetails=[course.instructor?`<span>${icon('users')} ${escapeHtml(course.instructor)}</span>`:'',...skills.slice(0,3).map(s=>`<span>${icon('check')} ${escapeHtml(s)}</span>`)].filter(Boolean);
    const contactCard=`<aside class="fsa-detail-enroll-card reveal">${detailStatus.kind!=='available'?`<div class="fsa-enrollment-state">${detailStatus.kind==='owned'?'✓ You are enrolled in this learning format':detailStatus.kind==='pending'?'⏳ Enrollment request pending':'Your enrollment is on your account'}</div>`:''}<div class="fsa-detail-enroll-head"><small>Choose learning mode</small><div class="fsa-detail-mode-switch">${modeButtons}</div></div><div class="fsa-detail-mode-copy" id="detailModeCopy">${modeCopy}</div><div class="fsa-detail-price"><small>Course fee</small><strong>${money(course.price||0)}</strong>${Number(course.originalPrice||0)>Number(course.price||0)?`<del>${money(course.originalPrice)}</del>`:''}</div>${sideDetails.length?`<div class="fsa-detail-enroll-list">${sideDetails.join('')}</div>`:''}${purchaseActionMarkup(course,state.detailDeliveryMode==='classroom'?'offline':state.detailDeliveryMode)}<button class="button button-secondary button-block" data-action="open-call-popup">Ask About This Course</button></aside>`;
    app.innerHTML=`<style id="fsa-course-detail-polish">
.fsa-course-detail-hero{background:linear-gradient(130deg,#fff 0%,#fff 65%,#fcf1f3 100%);padding:28px 0 48px}
.fsa-course-detail-hero .breadcrumbs{margin-bottom:25px}
.fsa-course-detail-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(24px,4vw,60px);align-items:center}
.fsa-course-detail-copy{min-width:0}
.fsa-course-detail-copy h1{font-size:clamp(32px,3.25vw,52px);line-height:1.16;letter-spacing:-.035em;margin:15px 0 18px;overflow-wrap:break-word}
.fsa-course-detail-copy>p{font-size:clamp(14px,1.1vw,17px);line-height:1.75;max-width:680px;margin-bottom:24px}
.fsa-course-detail-visual{aspect-ratio:16/10;border-radius:18px;box-shadow:0 16px 35px rgba(53,30,38,.1)}
.fsa-course-detail-visual img{object-fit:contain;background:#fbf7f8}
.fsa-course-detail-actions{display:flex;align-items:stretch;flex-wrap:wrap;gap:12px}
.fsa-course-detail-actions>.button{width:auto;min-width:190px;min-height:46px;padding:12px 22px;display:inline-flex;align-items:center;justify-content:center;gap:9px;line-height:1.2;white-space:nowrap;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;box-sizing:border-box;text-align:center}
.fsa-course-detail-actions>.button svg{width:16px;height:16px;flex-shrink:0}
.fsa-course-detail-actions>.button:disabled{opacity:.55;cursor:not-allowed}
#course-batches{scroll-margin-top:120px}
@media(max-width:950px){.fsa-course-detail-grid{grid-template-columns:1fr;gap:28px}.fsa-course-detail-visual{max-width:750px;width:100%}}
@media(max-width:600px){.fsa-course-detail-copy h1{font-size:clamp(29px,8vw,39px)}.fsa-course-detail-actions{display:grid;grid-template-columns:1fr}.fsa-course-detail-actions>.button{width:100%;min-width:0}.fsa-course-detail-visual{aspect-ratio:16/10}}
</style><section class="fsa-course-detail-hero"><div class="container">${breadcrumbs([{label:'Home',href:'#/'},{label:'Courses',href:'#/courses'},{label:course.title}])}<div class="fsa-course-detail-grid"><div class="fsa-course-detail-copy reveal"><div class="fsa-catalog-mode-row">${deliveryPills(delivery)}</div><h1>${escapeHtml(course.title)}</h1>${(course.short||course.description)?`<p>${textHtml(course.short||course.description)}</p>`:''}<div class="fsa-course-detail-actions"><button type="button" class="button button-primary" data-action="course-scroll-batches" ${batches.length?'':'disabled aria-disabled="true" title="No scheduled batches currently available"'}>${icon('calendar')} ${batches.length?'View Available Batches':'No Batches Available'}</button><button type="button" class="button button-secondary" data-action="open-call-popup">${icon('phone')} Get A Call</button></div></div><div class="fsa-course-detail-visual reveal reveal-scale">${imageMarkup(course.image,course.title,initials(course.title))}</div></div></div></section>
      ${summary.length?`<section class="fsa-course-summary-band"><div class="container fsa-course-summary-grid">${summary.map(x=>`<article><span>${icon(x.icon)}</span><div><small>${escapeHtml(x.label)}</small><strong>${escapeHtml(x.value)}</strong></div></article>`).join('')}</div></section>`:''}
      <section class="fsa-detail-main-section"><div class="container fsa-detail-main-layout"><div class="fsa-detail-content">${overviewSection}${curriculumSection}${batchSection}</div>${contactCard}</div></section>
      ${related.length?`<section class="fsa-related-section"><div class="container"><div class="fsa-course-section-head"><div><span class="eyebrow">Continue Exploring</span><h2>Related <em>courses.</em></h2></div><a class="button button-outline" href="#/courses">View All Courses ${icon('arrow')}</a></div><div class="fsa-course-catalog-grid related">${related.map(catalogCourseCard).join('')}</div></div></section>`:''}`;
    if(batches.length)requestAnimationFrame(()=>updateBatchResults(course));
  }

  function courseTabContent(course, tab) {
    const skills=Array.isArray(course.skills)?course.skills.filter(Boolean):[];
    const requirements=Array.isArray(course.requirements)?course.requirements.filter(Boolean):[];
    const audience=Array.isArray(course.audience)?course.audience.filter(Boolean):[];
    const modules=Array.isArray(course.modules)?course.modules.filter(module=>module&&(module.title||(Array.isArray(module.lessons)&&module.lessons.length))):[];
    const projects=Array.isArray(course.projectItems)?course.projectItems.filter(project=>project&&(project.title||project.description)):[];
    const reviews=Array.isArray(course.courseReviews)?course.courseReviews.filter(review=>review&&(review.name||review.text)):[];
    if (tab === 'curriculum' && modules.length) {
      const lessonTotal=modules.reduce((total,module)=>total+(Array.isArray(module.lessons)?module.lessons.filter(lesson=>lesson&&lesson.title).length:0),0);
      const summary=[`${modules.length} module${modules.length===1?'':'s'}`,lessonTotal?`${lessonTotal} lesson${lessonTotal===1?'':'s'}`:'',Number(course.hours||0)>0?`${Number(course.hours)} learning hours`:''].filter(Boolean).join(' · ');
      return `<div class="tab-panel"><h2>Course curriculum</h2>${summary?`<p class="muted">${summary}</p>`:''}<div class="curriculum-list">${modules.map((module,mi)=>{const lessons=Array.isArray(module.lessons)?module.lessons.filter(lesson=>lesson&&lesson.title):[];const moduleMeta=[lessons.length?`${lessons.length} lesson${lessons.length===1?'':'s'}`:'',module.duration||''].filter(Boolean).join(' · ');return `<article class="module ${mi===0?'open':''}"><button class="module-head" data-action="toggle-module"><span><strong>${mi+1}. ${escapeHtml(module.title||`Module ${mi+1}`)}</strong>${moduleMeta?`<span>${escapeHtml(moduleMeta)}</span>`:''}</span>${icon('chevronDown')}</button><div class="module-lessons">${lessons.map(lesson=>`<div class="lesson-row"><span class="lesson-row-left">${icon('play')} ${escapeHtml(lesson.title)} ${lesson.preview?'<span class="preview-label">Preview</span>':''}</span>${lesson.duration?`<span>${escapeHtml(lesson.duration)}</span>`:''}</div>`).join('')}</div></article>`}).join('')}</div></div>`;
    }
    if (tab === 'projects' && projects.length) return `<div class="tab-panel"><h2>Practical projects</h2><div class="value-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${projects.map((project,index)=>`<article class="value-card"><span class="value-icon">${icon(index===projects.length-1?'briefcase':'project')}</span>${project.title?`<h3>${escapeHtml(project.title)}</h3>`:''}${project.description?`<p>${textHtml(project.description)}</p>`:''}</article>`).join('')}</div></div>`;
    if (tab === 'reviews' && (reviews.length||Number(course.rating||0)>0||Number(course.reviews||0)>0)) {
      const summary=(Number(course.rating||0)>0||Number(course.reviews||0)>0)?`<div class="rating-summary single"><div class="rating-score">${Number(course.rating||0)>0?`<strong>${escapeHtml(course.rating)}</strong>${stars(Math.max(1,Math.round(Number(course.rating||0))))}`:''}${Number(course.reviews||0)>0?`<span>${Number(course.reviews).toLocaleString(siteSettings.locale||'en-IN')} review${Number(course.reviews)===1?'':'s'}</span>`:''}</div></div>`:'';
      const cards=reviews.length?`<div class="testimonial-grid" style="margin-top:22px">${reviews.map((review,index)=>`<article class="testimonial-card reveal reveal-delay-${Math.min(index,3)}"><div class="testimonial-head"><span class="avatar" style="display:grid;place-items:center;font-weight:800;color:var(--brand)">${initials(review.name||'Student')}</span><span><span class="testimonial-name">${escapeHtml(review.name||'Student')}</span>${review.role?`<span class="testimonial-course">${escapeHtml(review.role)}</span>`:''}</span></div>${stars(Math.max(1,Math.min(5,Number(review.rating||5))))}${review.text?`<p>${textHtml(review.text)}</p>`:''}</article>`).join('')}</div>`:'';
      return `<div class="tab-panel"><h2>Student reviews</h2>${summary}${cards}</div>`;
    }
    const sections=[];
    if(skills.length)sections.push(`<h2>What you will learn</h2><ul class="learn-list">${skills.map(item=>`<li>${icon('check')}<span>${escapeHtml(item)}</span></li>`).join('')}</ul>`);
    if(String(course.description||'').trim())sections.push(`<h2 style="margin-top:${sections.length?'35px':'0'}">About this course</h2><p>${textHtml(course.description)}</p>`);
    const audienceSections=[];
    if(requirements.length)audienceSections.push(`<div class="form-section"><h3>Requirements</h3><ul class="simple-list">${requirements.map(item=>`<li>${icon('check')}<span>${escapeHtml(item)}</span></li>`).join('')}</ul></div>`);
    if(audience.length)audienceSections.push(`<div class="form-section"><h3>Who this is for</h3><ul class="simple-list">${audience.map(item=>`<li>${icon('users')}<span>${escapeHtml(item)}</span></li>`).join('')}</ul></div>`);
    if(audienceSections.length)sections.push(`<div class="mission-grid" style="margin-top:30px">${audienceSections.join('')}</div>`);
    return sections.length?`<div class="tab-panel">${sections.join('')}</div>`:'';
  }

  function renderBatches() {
    setChrome('public');
    const rows=batchRows();
    app.innerHTML=`<section class="fsa-batches-page-hero"><div class="container fsa-batches-page-grid"><div class="fsa-batches-page-copy reveal"><span class="eyebrow">Admissions & Learning Access</span><h1>Find the right <em>batch or learning mode.</em></h1><p>Compare scheduled Live Streamed classes, branch-based Offline Classroom batches and Recorded courses that can start anytime. The same three-mode structure is now used across the course catalogue.</p><div class="fsa-batches-hero-modes"><span><i>${icon('radio')}</i>Live Streamed</span><span><i>${icon('video')}</i>Recorded</span><span><i>${icon('classroom')}</i>Offline Classroom</span></div></div><aside class="fsa-batches-page-panel reveal reveal-delay-2"><small>How it works</small><h3>Filter your learning options</h3><ul><li>${icon('search')} Search by course or technology</li><li>${icon('clock')} Choose morning, afternoon, evening or anytime</li><li>${icon('map')} Filter online or a Hyderabad branch</li><li>${icon('layers')} Select your preferred learning mode</li></ul><button class="button button-primary button-block" data-action="open-call-popup" style="margin-top:17px">Need Help? Get A Call</button></aside></div></section><section class="fsa-batches-directory"><div class="container"><div class="fsa-batches-directory-head"><div><span class="eyebrow">All Learning Options</span><h2>Upcoming batches & recorded access</h2><p>Every filter row scrolls independently and hides its scrollbar.</p></div><label class="fsa-batches-search">${icon('search')}<input id="batchesSearchInput" type="search" value="${escapeHtml(state.batchQuery||'')}" placeholder="Search course, branch or mode..."></label></div><div class="fsa-batches-filter-stack"><div class="fsa-batches-filter-row"><strong>Time</strong><div class="fsa-batches-filter-scroll">${['all','morning','afternoon','evening','anytime'].map(v=>`<button class="${state.batchShift===v?'active':''}" data-action="batch-shift" data-value="${v}">${v==='all'?'All':v==='anytime'?'Start Anytime':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div></div><div class="fsa-batches-filter-row"><strong>Mode</strong><div class="fsa-batches-filter-scroll">${[['all','All Modes'],['live-streamed','Live Streamed'],['recorded','Recorded'],['offline-classroom','Offline Classroom']].map(([v,l])=>`<button class="${state.batchMode===v?'active':''}" data-action="batch-mode" data-value="${v}">${l}</button>`).join('')}</div></div><div class="fsa-batches-filter-row"><strong>Branch</strong><div class="fsa-batches-filter-scroll">${publicBatchBranches().map(([v,l])=>`<button class="${state.batchBranch===v?'active':''}" data-action="batch-branch" data-value="${v}">${l}</button>`).join('')}</div></div></div><div class="fsa-batches-results-line"><span id="batchResultCount"><strong>${rows.length}</strong> options found</span><button class="clear-button" data-action="batch-reset">Reset filters</button></div><div class="fsa-batches-page-grid-list" id="fsaBatchGrid">${rows.map(batchCard).join('')}</div></div></section><section class="section-sm section-surface"><div class="container"><div class="cta-panel"><span class="eyebrow">Course Guidance</span><h2>Not sure which format fits your schedule?</h2><p>Share your course interest and preferred learning mode. The academy team can help you choose the best available option.</p><div class="cta-actions"><button class="button button-primary" data-action="open-call-popup">Get A Call</button><a class="button button-secondary" href="#/courses">Browse Courses</a></div></div></div></section>`;
    requestAnimationFrame(()=>updateBatchResults());
  }

  function renderAbout() {
    setChrome('public');
    const academyName = escapeHtml(siteSettings.academy_name || 'Full Stack Academy');
    const stats = dynamicAcademyStats();
    app.innerHTML = `${pageHero({eyebrow:`About ${academyName}`,title:'Practical technology education built for real progress.',text:`${academyName} helps learners build useful digital skills through structured courses, guided practice and project-based learning.`,image:D.academyImages.about,imageAlt:'Technology learners and instructors working together'})}
      <section class="section"><div class="container about-story"><div class="about-image-stack reveal"><div class="about-image-main">${imageMarkup(D.academyImages.learning,'Students collaborating on practical technology projects','FSA')}</div><div class="about-image-small">${imageMarkup(D.academyImages.mentor,'Mentors supporting technology learners','FSA')}</div></div><div class="reveal reveal-delay-2"><span class="eyebrow">Who We Are</span><div class="section-heading align-left" style="margin-top:14px"><h2>A focused academy for modern technology careers.</h2><p>We make technical learning clear, practical and connected to the skills learners need for employment, freelancing and business growth.</p></div><p class="about-lead">Every learning path combines understandable lessons, guided practice, practical projects and flexible access. Courses published by the academy automatically appear across the website, so learners always see the current catalogue.</p><div class="about-check-list">${['Structured learning paths instead of disconnected tutorials','Hands-on projects that turn concepts into usable skills','Flexible access for students and working professionals','Clear progress tracking through the learner dashboard'].map(item=>`<div>${icon('check')}<span>${item}</span></div>`).join('')}</div><div class="cta-actions"><a class="button button-primary" href="#/courses">Explore Courses ${icon('arrow')}</a><a class="button button-secondary" href="#/contact">Contact Our Team</a></div></div></div></section>
      <section class="section section-pink"><div class="container"><div class="section-heading"><span class="eyebrow">Why Learn With Us</span><h2>Everything is designed around practical outcomes.</h2><p>From the course structure to the learner dashboard, each part of the academy supports consistent progress.</p></div><div class="value-grid">${[['Industry-relevant curriculum','Course content focuses on current tools, workflows and role-based skills.','briefcase'],['Experienced guidance','Clear explanations and practical support help learners move forward confidently.','users'],['Project-based learning','Learners apply major concepts through portfolio-ready practical work.','project'],['Flexible learner access','Study on your schedule and continue learning across supported devices.','clock']].map((value,index)=>`<article class="value-card reveal reveal-delay-${index}"><span class="value-icon">${icon(value[2])}</span><h3>${value[0]}</h3><p>${value[1]}</p></article>`).join('')}</div></div></section>
      <section class="section"><div class="container mission-grid"><article class="mission-card reveal"><span class="eyebrow light">Our Mission</span><h2>Make useful technology education accessible.</h2><p>We help learners gain practical confidence through clear teaching, purposeful projects and structured skill development.</p></article><article class="mission-card reveal reveal-delay-2"><span class="eyebrow">Our Vision</span><h2>Build a trusted path into digital careers.</h2><p>We aim to become a dependable learning destination for people developing skills in software, data, AI and emerging technologies.</p></article></div></section>
      <section class="stats-band"><div class="container stats-grid">${stats.map(stat=>`<div class="stat"><div class="metric-number"><span data-count="${stat.value}" data-suffix="${stat.suffix||''}">0</span></div><div class="metric-label">${stat.label}</div></div>`).join('')}</div></section>
      ${dynamicCourseSection({eyebrow:'Current Course Catalogue',title:'Learn from courses published by the academy.',text:'These courses are loaded directly from the live database and update automatically when the administrator publishes or edits a course.',limit:3,tone:'plain'})}
      <section class="section-sm"><div class="container"><div class="cta-panel"><span class="eyebrow">Start Your Journey</span><h2>Turn your learning goal into a clear plan.</h2><p>Explore current courses, compare course formats or speak with the academy team for guidance.</p><div class="cta-actions"><a class="button button-primary" href="#/courses">Browse All Courses</a><a class="button button-secondary" href="#/contact">Contact Us</a></div></div></div></section>`;
  }

  function renderContact() {
    setChrome('public');
    const details = contactDetails();
    const learnerName = state.user.name === 'Academy Learner' ? '' : state.user.name;
    app.innerHTML = `${pageHero({eyebrow:'Contact Us',title:'Speak with the academy team.',text:'Ask about courses, learning formats, enrollment, learner accounts or branch information. We will guide you to the right next step.',image:D.academyImages.mentor,imageAlt:'Academy support team helping a technology learner'})}
      <section class="page-section"><div class="container contact-page-grid"><div class="contact-copy reveal"><span class="eyebrow">Get In Touch</span><div class="section-heading align-left" style="margin-top:14px"><h2>How can we help you?</h2><p>Send a message using the form or contact the academy directly. Messages submitted here are saved in the admin dashboard under inquiries.</p></div><div class="contact-info-stack"><a class="contact-info-card" href="mailto:${escapeHtml(details.email)}"><span class="contact-info-icon">${icon('mail')}</span><span><small>Email Support</small><strong>${escapeHtml(details.email)}</strong><em>Course, account and enrollment questions</em></span>${icon('arrow')}</a><a class="contact-info-card" href="tel:${escapeHtml(details.phoneHref)}"><span class="contact-info-icon">${icon('phone')}</span><span><small>Call the Academy</small><strong>${escapeHtml(details.phone)}</strong><em>Speak directly with the support team</em></span>${icon('arrow')}</a><a class="contact-info-card" href="#/branches"><span class="contact-info-icon">${icon('map')}</span><span><small>Visit a Branch</small><strong>View academy locations</strong><em>Addresses, timings and contact information</em></span>${icon('arrow')}</a></div><div class="contact-assurance">${icon('clock')}<span><strong>Response time</strong> Most messages receive a reply within one working day.</span></div></div><article class="contact-form-card reveal reveal-delay-2"><span class="eyebrow">Send A Message</span><h2>Tell us what you need</h2><p>Complete the required fields. Your inquiry reference will be created automatically.</p><form id="contactForm" novalidate><div class="form-grid"><div class="form-group"><label>Full name</label><input class="form-control" name="name" required autocomplete="name" value="${escapeHtml(learnerName)}"></div><div class="form-group"><label>Email address</label><input class="form-control" name="email" type="email" required autocomplete="email" value="${escapeHtml(state.user.email)}"></div><div class="form-group"><label>Phone number</label><input class="form-control" name="phone" autocomplete="tel" value="${escapeHtml(state.user.phone)}"></div><div class="form-group"><label>Subject</label><select class="form-control" name="subject" required><option value="">Select a subject</option><option>Course guidance</option><option>Enrollment and payment</option><option>Student account support</option><option>Corporate or team training</option><option>Branch information</option><option>Other inquiry</option></select></div><div class="form-group full"><label>Message</label><textarea class="form-control contact-message" name="message" required placeholder="Write your question or explain the support you need..."></textarea></div></div><button class="button button-primary button-block" type="submit">Send Message ${icon('arrow')}</button><p class="contact-privacy">By submitting this form, you agree that the academy may contact you about this inquiry.</p></form></article></div></section>
      ${dynamicCourseSection({eyebrow:'Popular Learning Paths',title:'Explore courses while our team gets back to you.',text:'The courses below are selected automatically from the current live catalogue.',limit:3,tone:'surface'})}
      <section class="section-sm"><div class="container"><div class="cta-panel"><span class="eyebrow">Need Quick Guidance?</span><h2>Not sure which course fits your goal?</h2><p>Browse all published courses or call the academy for direct guidance.</p><div class="cta-actions"><a class="button button-primary" href="#/courses">Explore All Courses</a><a class="button button-secondary" href="tel:${escapeHtml(details.phoneHref)}">Call ${escapeHtml(details.phone)}</a></div></div></div></section>`;
  }

  const BRANCH_ROUTE_META = {
    charminar: {
      lat: 17.3609879,
      lng: 78.4714386,
      page: 'branches/fsa-charminar/index.html'
    },
    ameerpet: {
      lat: 17.4371237,
      lng: 78.4451396,
      page: 'branches/fsa-ameerpet/index.html'
    },
    gachibowli: {
      lat: 17.4262563,
      lng: 78.3769114,
      page: 'branches/fsa-gachibowli/index.html'
    },
    tolichowki: {
      lat: 17.4030307,
      lng: 78.4093241,
      page: 'branches/fsa-tolichowki/index.html'
    }
  };

  const branchMapState = {
    selectedId: 'charminar',
    user: null,
    map: null,
    routeLayer: null,
    userMarker: null,
    branchMarkers: new Map(),
    routeRequestId: 0
  };

  function branchMapsUrl(branch, includeOrigin = false) {
    const page = BRANCH_ROUTE_META[branch.id]?.page;
    return page ? `${page}#location` : `#/branches?branch=${encodeURIComponent(branch.id)}`;
  }

  function branchDirectoryRow(branch, index = 0) {
    const localImage = branch.image || ''; 
    const maps = branchMapsUrl(branch);
    const livePage = BRANCH_ROUTE_META[branch.id]?.page || maps;
    return `<article class="branch-directory-row reveal reveal-delay-${Math.min(index,3)}" id="branch-${escapeHtml(branch.id)}">
      <a class="branch-directory-media" href="${maps}" aria-label="Open ${escapeHtml(branch.name)} branch location">
        ${imageMarkup(localImage, `${branch.name} Full Stack Academy branch`, 'FSA')}
      </a>
      <div class="branch-directory-copy">
        <span class="branch-directory-location">${escapeHtml(branch.location)}</span>
        <h3>${escapeHtml(branch.name)}</h3>
        <div class="branch-contact-list">
          <div class="branch-contact-item"><span class="branch-contact-icon">${icon('map')}</span><span><small>Location</small><strong>${escapeHtml(branch.address || branch.location)}</strong></span></div>
          <div class="branch-contact-item"><span class="branch-contact-icon">${icon('mail')}</span><span><small>Drop Us</small><a href="mailto:${escapeHtml(branch.email)}">${escapeHtml(branch.email)}</a></span></div>
          <div class="branch-contact-item"><span class="branch-contact-icon">${icon('phone')}</span><span><small>Contact Us</small><a href="tel:${branch.phone.replace(/\s/g,'')}">${escapeHtml(branch.phone)}${branch.extension ? ` (${escapeHtml(branch.extension)})` : ''}</a></span></div>
        </div>
        <div class="branch-directory-actions">
          <a class="button button-primary" href="${livePage}">Visit Our Academy ${icon('arrow')}</a>
          <a class="button branch-outline" href="${maps}">View Branch Location ${icon('map')}</a>
        </div>
      </div>
    </article>`;
  }

  function branchPicker(branch, index = 0) {
    return `<button class="branch-picker-card ${branch.id === branchMapState.selectedId ? 'active' : ''}" type="button" data-action="branch-select" data-id="${escapeHtml(branch.id)}" aria-pressed="${branch.id === branchMapState.selectedId ? 'true' : 'false'}">
      <span class="branch-picker-number">${String(index + 1).padStart(2,'0')}</span>
      <span class="branch-picker-copy"><strong>${escapeHtml(branch.name.replace('FSA — ',''))}</strong><span>${escapeHtml(branch.address || branch.location)}</span></span>
      <span class="branch-picker-distance" data-branch-distance="${escapeHtml(branch.id)}">—</span>
    </button>`;
  }

  function renderBranches(preferredBranchId = '') {
    setChrome('public');
    destroyBranchMap();
    if(!D.branches.length){app.innerHTML='<section class="page-section"><div class="container"></div></section>';return;}
    const firstBranchId = D.branches[0]?.id;
    const requestedId = D.branches.some(branch => branch.id === preferredBranchId) ? preferredBranchId : firstBranchId;
    branchMapState.selectedId = requestedId;
    const selected = D.branches.find(branch => branch.id === requestedId) || D.branches[0];
    const selectedMaps = selected ? branchMapsUrl(selected) : '#';
    app.innerHTML = `<div class="branches-page">
      <section class="branch-page-hero">
        <div class="container branch-page-hero-grid">
          <div class="branch-page-hero-copy reveal">
            <span class="branch-page-kicker">Hyderabad Learning Centres</span>
            <h1>Full Stack Academy <em>Branches</em></h1>
            <p>Full Stack Academy has four branches across Hyderabad — Charminar, Ameerpet, Gachibowli and Tolichowki. Choose the location that suits you for classroom learning, practical labs, instructor guidance and career-focused support.</p>
            <div class="branch-page-hero-actions"><button class="button button-primary" type="button" data-action="branch-scroll" data-target="branch-directory">Explore Branches</button><button class="button button-secondary" type="button" data-action="branch-scroll" data-target="branch-finder">Find Nearest Branch</button></div>
          </div>
          <div class="branch-page-hero-art reveal reveal-delay-2" aria-hidden="true">
            <img class="branch-page-hero-logo" src="assets/images/fsa-home/logo.svg" alt="">
            <span class="branch-page-hero-mini"><strong>04</strong><span>FSA learning centres across Hyderabad</span></span>
          </div>
        </div>
      </section>

      <section class="branch-directory-section" id="branch-directory">
        <div class="container">
          <div class="branch-section-heading reveal"><span>Our Centres</span><h2>Visit a Full Stack Academy <em>branch</em></h2><p>Explore all four Hyderabad centres, compare their locations and choose the classroom that works best for your learning schedule.</p></div>
          <div class="branch-directory">${D.branches.map((branch,index)=>branchDirectoryRow(branch,index)).join('')}</div>
        </div>
      </section>

      <section class="branch-finder-section" id="branch-finder">
        <div class="container">
          <div class="branch-section-heading center reveal"><span>Route Planner</span><h2>Find your <em>nearest FSA branch</em></h2><p>The first branch is shown on the map by default. Select another centre at left, or allow location access to draw the route and calculate driving distance from your current location.</p></div>
          <div class="branch-finder-grid">
            <aside class="branch-finder-panel reveal">
              <div class="branch-finder-panel-head"><small>Select Branch</small><h3>Four locations. One academy.</h3><p>Charminar is selected first. Tap any branch to update the map on the right.</p></div>
              <div class="branch-picker-list">${D.branches.map((branch,index)=>branchPicker(branch,index)).join('')}</div>
              <div class="branch-location-consent">
                <h4>Route from your location</h4>
                <p>Allow browser location access to see the road route, distance and estimated driving time to the selected branch.</p>
                <button class="branch-location-button" type="button" data-action="branch-location">${icon('map')} Use My Location</button>
                <span class="branch-location-status" id="branchLocationStatus">Showing ${escapeHtml(selected?.name.replace('FSA — ','') || 'Charminar')} branch. Location not shared yet.</span>
              </div>
            </aside>
            <div class="branch-map-shell reveal reveal-delay-2">
              <div id="branchRouteMap" role="application" aria-label="Interactive map showing Full Stack Academy branches and route from your location"></div>
              <div class="branch-map-topbar">
                <div class="branch-map-title"><small>Selected Branch</small><strong id="branchMapName">${escapeHtml(selected?.name || 'FSA — Charminar')}</strong><span id="branchMapAddress">${escapeHtml(selected?.address || selected?.location || '')}</span></div>
                <div class="branch-route-metrics"><span class="branch-route-metric"><small>Distance</small><strong id="branchRouteDistance">—</strong></span><span class="branch-route-metric"><small>Drive</small><strong id="branchRouteTime">—</strong></span></div>
              </div>
              <div class="branch-route-note"><span class="branch-route-note-copy"><strong id="branchRouteLabel">${escapeHtml(selected?.name.replace('FSA — ','') || 'Charminar')} branch is shown.</strong><span id="branchRouteDetail">Use My Location to draw the driving route from you to this branch.</span></span><a id="branchDirectionsLink" href="${selectedMaps}">Open Branch Location ${icon('arrow')}</a></div>
              <div class="branch-map-fallback" id="branchMapFallback"><div><h3>Map could not load.</h3><p>You can still open the selected branch location page.</p><a class="button button-primary" id="branchFallbackLink" href="${selectedMaps}">Open Branch Location</a></div></div>
            </div>
          </div>
        </div>
      </section>

      <section class="branch-benefits-section">
        <div class="container">
          <div class="branch-section-heading center reveal"><span>Classroom Experience</span><h2>What you get at an <em>FSA branch</em></h2><p>Every centre is designed around practical learning, instructor access and career preparation.</p></div>
          <div class="branch-benefit-grid">
            <article class="branch-benefit-card reveal"><span>${icon('briefcase')}</span><h3>Industry-Led Training</h3><p>Learn with practical examples, guided exercises and career-focused technology training.</p></article>
            <article class="branch-benefit-card reveal reveal-delay-1"><span>${icon('project')}</span><h3>Hands-On Labs</h3><p>Practice concepts through assignments, labs and portfolio-oriented project work.</p></article>
            <article class="branch-benefit-card reveal reveal-delay-2"><span>${icon('users')}</span><h3>Instructor Support</h3><p>Get direct classroom guidance when you need help with concepts, projects or next steps.</p></article>
            <article class="branch-benefit-card reveal reveal-delay-3"><span>${icon('award')}</span><h3>Career Guidance</h3><p>Build job-ready skills with structured learning and placement-oriented support.</p></article>
          </div>
        </div>
      </section>

      <section class="branch-final-cta">
        <div class="container"><div class="branch-final-cta-box reveal"><div><h2>Not sure which branch is best for you?</h2><p>Use the route planner above or speak with the academy team for course, batch and branch guidance.</p></div><div class="branch-final-cta-actions"><a href="tel:+919015236236">Get A Call</a><a href="#/courses">Explore Courses</a></div></div></div>
      </section>
    </div>`;
  }

  function destroyBranchMap() {
    if (branchMapState.map) {
      try { branchMapState.map.remove(); } catch (_) {}
    }
    branchMapState.map = null;
    branchMapState.routeLayer = null;
    branchMapState.userMarker = null;
    branchMapState.branchMarkers = new Map();
  }

  function branchDistanceKm(from, to) {
    const toRad = value => value * Math.PI / 180;
    const earth = 6371;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) ** 2;
    return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function formatDriveTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }

  function updateBranchDistanceLabels() {
    document.querySelectorAll('[data-branch-distance]').forEach(node => {
      const meta = BRANCH_ROUTE_META[node.dataset.branchDistance];
      if (!branchMapState.user || !meta) { node.textContent = '—'; return; }
      const km = branchDistanceKm(branchMapState.user, meta);
      node.textContent = `${km.toFixed(km < 10 ? 1 : 0)} km`;
    });
  }

  function updateBranchMapCopy(branch) {
    if (!branch) return;
    const name = document.getElementById('branchMapName');
    const address = document.getElementById('branchMapAddress');
    const directions = document.getElementById('branchDirectionsLink');
    const fallback = document.getElementById('branchFallbackLink');
    if (name) name.textContent = branch.name;
    if (address) address.textContent = branch.address || branch.location;
    const url = branchMapsUrl(branch, Boolean(branchMapState.user));
    if (directions) directions.href = url;
    if (fallback) fallback.href = url;
  }

  function setBranchRouteStatus(distance = '—', drive = '—', label = 'Select a branch, then use your location.', detail = 'The map will draw the driving path after location permission is granted.') {
    const distanceNode = document.getElementById('branchRouteDistance');
    const timeNode = document.getElementById('branchRouteTime');
    const labelNode = document.getElementById('branchRouteLabel');
    const detailNode = document.getElementById('branchRouteDetail');
    if (distanceNode) distanceNode.textContent = distance;
    if (timeNode) timeNode.textContent = drive;
    if (labelNode) labelNode.textContent = label;
    if (detailNode) detailNode.textContent = detail;
  }

  function setBranchMarkerSelection() {
    branchMapState.branchMarkers.forEach((marker,id) => {
      const iconHtml = `<span class="fsa-map-pin ${id === branchMapState.selectedId ? 'is-selected' : ''}"></span>`;
      marker.setIcon(window.L.divIcon({className:'fsa-map-pin-wrap',html:iconHtml,iconSize:id === branchMapState.selectedId ? [40,40] : [34,34],iconAnchor:id === branchMapState.selectedId ? [20,36] : [17,31]}));
    });
  }

  async function drawBranchRoute() {
    if (!branchMapState.map || !branchMapState.user) return;
    const branch = D.branches.find(item => item.id === branchMapState.selectedId);
    const meta = BRANCH_ROUTE_META[branchMapState.selectedId];
    if (!branch || !meta) return;
    const requestId = ++branchMapState.routeRequestId;
    if (branchMapState.routeLayer) {
      try { branchMapState.map.removeLayer(branchMapState.routeLayer); } catch (_) {}
      branchMapState.routeLayer = null;
    }
    setBranchRouteStatus('…','…',`Calculating route to ${branch.name.replace('FSA — ','')}…`,'Using the selected branch and your current location.');
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${branchMapState.user.lng},${branchMapState.user.lat};${meta.lng},${meta.lat}?overview=full&geometries=geojson&steps=false`;
      const response = await fetch(url, {headers:{'Accept':'application/json'}});
      if (!response.ok) throw new Error('Route service unavailable');
      const result = await response.json();
      if (requestId !== branchMapState.routeRequestId) return;
      const route = result?.routes?.[0];
      if (!route?.geometry) throw new Error('No driving route returned');
      branchMapState.routeLayer = window.L.geoJSON(route.geometry, {style:{color:'#852937',weight:6,opacity:.88,lineCap:'round',lineJoin:'round'}}).addTo(branchMapState.map);
      const bounds = branchMapState.routeLayer.getBounds();
      if (bounds.isValid()) branchMapState.map.fitBounds(bounds.pad(.12), {paddingTopLeft:[28,100],paddingBottomRight:[28,92]});
      const km = route.distance / 1000;
      setBranchRouteStatus(`${km.toFixed(km < 10 ? 1 : 0)} km`, formatDriveTime(route.duration), `Driving route to ${branch.name.replace('FSA — ','')}`, 'Route shown from your current location to the selected FSA branch.');
    } catch (_) {
      if (requestId !== branchMapState.routeRequestId) return;
      const km = branchDistanceKm(branchMapState.user, meta);
      branchMapState.routeLayer = window.L.polyline([[branchMapState.user.lat,branchMapState.user.lng],[meta.lat,meta.lng]], {color:'#852937',weight:4,opacity:.7,dashArray:'9 9'}).addTo(branchMapState.map);
      branchMapState.map.fitBounds(branchMapState.routeLayer.getBounds().pad(.18));
      setBranchRouteStatus(`~${km.toFixed(km < 10 ? 1 : 0)} km`,'—',`Approximate distance to ${branch.name.replace('FSA — ','')}`,'Live road routing was unavailable, so a straight-line fallback is shown.');
    }
  }

  function selectBranchRoute(id, {pan = true} = {}) {
    const branch = D.branches.find(item => item.id === id);
    const meta = BRANCH_ROUTE_META[id];
    if (!branch || !meta) return;
    branchMapState.selectedId = id;
    document.querySelectorAll('[data-action="branch-select"]').forEach(button => {
      const active = button.dataset.id === id;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active ? 'true' : 'false');
    });
    updateBranchMapCopy(branch);
    setBranchMarkerSelection();
    if (branchMapState.user) drawBranchRoute();
    else {
      setBranchRouteStatus('—','—',`${branch.name.replace('FSA — ','')} selected.`,'Use My Location to draw the route and calculate driving distance.');
      if (pan && branchMapState.map) branchMapState.map.flyTo([meta.lat,meta.lng],14,{duration:.7});
    }
  }

  function requestBranchLocation() {
    const status = document.getElementById('branchLocationStatus');
    const button = document.querySelector('[data-action="branch-location"]');
    if (!navigator.geolocation) {
      if (status) status.textContent = 'Location is not supported by this browser.';
      toast('Your browser does not support location access.','error');
      return;
    }
    if (status) status.textContent = 'Waiting for location permission…';
    if (button) { button.disabled = true; button.textContent = 'Finding your location…'; }
    navigator.geolocation.getCurrentPosition(position => {
      branchMapState.user = {lat:position.coords.latitude,lng:position.coords.longitude};
      if (status) status.textContent = 'Location found. Route updated for the selected branch.';
      if (button) { button.disabled = false; button.innerHTML = `${icon('map')} Refresh My Location`; }
      if (branchMapState.map) {
        if (branchMapState.userMarker) branchMapState.userMarker.setLatLng([branchMapState.user.lat,branchMapState.user.lng]);
        else branchMapState.userMarker = window.L.marker([branchMapState.user.lat,branchMapState.user.lng], {icon:window.L.divIcon({className:'fsa-user-pin-wrap',html:'<span class="fsa-user-pin"></span>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(branchMapState.map).bindTooltip('Your location',{direction:'top'});
      }
      updateBranchDistanceLabels();
      const branch = D.branches.find(item => item.id === branchMapState.selectedId);
      if (branch) updateBranchMapCopy(branch);
      drawBranchRoute();
    }, error => {
      if (button) { button.disabled = false; button.innerHTML = `${icon('map')} Try Location Again`; }
      const message = error.code === 1 ? 'Location permission was not granted.' : 'Could not get your current location.';
      if (status) status.textContent = message;
      toast(message,'error');
    }, {enableHighAccuracy:false,timeout:12000,maximumAge:120000});
  }

  function initBranchMap() {
    if (state.currentPath !== '/branches') return;
    const mapNode = document.getElementById('branchRouteMap');
    if (!mapNode) return;
    if (!window.L) {
      document.getElementById('branchMapFallback')?.classList.add('show');
      return;
    }
    destroyBranchMap();
    const selected = D.branches.find(branch => branch.id === branchMapState.selectedId) || D.branches[0];
    const selectedMeta = BRANCH_ROUTE_META[selected?.id] || BRANCH_ROUTE_META.charminar;
    branchMapState.map = window.L.map(mapNode,{zoomControl:true,scrollWheelZoom:false,attributionControl:false}).setView([selectedMeta.lat,selectedMeta.lng],branchMapState.user ? 12 : 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(branchMapState.map);
    D.branches.forEach(branch => {
      const meta = BRANCH_ROUTE_META[branch.id];
      if (!meta) return;
      const marker = window.L.marker([meta.lat,meta.lng], {icon:window.L.divIcon({className:'fsa-map-pin-wrap',html:`<span class="fsa-map-pin ${branch.id === branchMapState.selectedId ? 'is-selected' : ''}"></span>`,iconSize:branch.id === branchMapState.selectedId ? [40,40] : [34,34],iconAnchor:branch.id === branchMapState.selectedId ? [20,36] : [17,31]})}).addTo(branchMapState.map);
      marker.bindTooltip(branch.name.replace('FSA — ',''),{direction:'top',offset:[0,-24]});
      marker.on('click',()=>selectBranchRoute(branch.id,{pan:true}));
      branchMapState.branchMarkers.set(branch.id,marker);
    });
    if (branchMapState.user) {
      branchMapState.userMarker = window.L.marker([branchMapState.user.lat,branchMapState.user.lng], {icon:window.L.divIcon({className:'fsa-user-pin-wrap',html:'<span class="fsa-user-pin"></span>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(branchMapState.map).bindTooltip('Your location',{direction:'top'});
      updateBranchDistanceLabels();
      drawBranchRoute();
    } else {
      selectBranchRoute(branchMapState.selectedId,{pan:false});
    }
    setTimeout(()=>branchMapState.map?.invalidateSize(),120);
  }


  function normalizePurchaseMode(value='') {
    const raw=String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
    if(['recorded','self-paced','on-demand'].includes(raw)) return 'recorded';
    if(['live','live-streamed','live-online','online-live'].includes(raw)) return 'live';
    if(['offline','classroom','offline-classroom','physical'].includes(raw)) return 'offline';
    return '';
  }
  function defaultCoursePurchaseMode(course){
    const configured=Array.isArray(course?.deliveryModes)&&course.deliveryModes.length?course.deliveryModes:(Array.isArray(course?.delivery_modes)?course.delivery_modes:[]);
    const first=normalizePurchaseMode(configured[0]||course?.deliveryMode||'');
    if(first) return first;
    const d=courseDelivery(course||{});
    return d.classroom?'offline':d.live?'live':d.recorded?'recorded':'offline';
  }
  function coursePurchaseMode(course){
    return normalizePurchaseMode(state.cartModes?.[course?.id]) || defaultCoursePurchaseMode(course);
  }
  function courseForCart(course){
    if(!course) return null;
    const mode=coursePurchaseMode(course);
    const pricing=course?.pricingByMode?.[mode] || course?.pricing_by_mode?.[mode] || null;
    return {
      ...course,
      cartMode:mode,
      price:pricing && pricing.enabled!==false ? Number(pricing.price||0) : Number(course.price||0),
      originalPrice:pricing && pricing.enabled!==false ? Number(pricing.originalPrice||pricing.original_price||0) : Number(course.originalPrice||0),
      duration:pricing && pricing.enabled!==false && pricing.duration ? pricing.duration : course.duration
    };
  }
  function purchaseModeLabel(mode){ return mode==='recorded'?'Recorded':mode==='live'?'Live Streamed':'Offline / Physical'; }

  // The current signed-in learner's database enrollment is authoritative.
  // All statuses are per course AND learning mode; expired access is not a new purchase.
  function purchaseState(courseId,mode){
    if(!state.loggedIn||state.user?.role!=='student')return {kind:'available'};
    const normalized=normalizePurchaseMode(mode);
    const matches=(state.allEnrollmentRows||[]).filter(row=>Number(row.course_id)===Number(courseId)&&normalizePurchaseMode(row.delivery_mode)===normalized);
    const owned=matches.find(row=>['active','completed'].includes(String(row.status||'')));
    if(owned)return {kind:owned.access_allowed===false?'restricted':'owned',row:owned};
    const pending=matches.find(row=>String(row.status)==='pending'&&(!row.order_id||['pending','paid'].includes(String(row.order_status||'pending'))));
    if(pending)return {kind:'pending',row:pending};
    return {kind:'available'};
  }
  function courseOpenLink(course,mode){
    const id=Number(course?.id||course||0),slug=String(course?.slug||courseById(id)?.slug||'');
    return mode==='recorded'?studentRecordedCourseEntry(id):mode==='live'?'#/live-classes':(slug?'#/learn/'+encodeURIComponent(slug):'#/my-courses');
  }
  function purchaseActionMarkup(course,mode,classes='button button-primary button-block'){
    const status=purchaseState(course.id,mode);
    if(status.kind==='owned')return `<a class="${classes}" href="${courseOpenLink(course,mode)}">${icon('book')} Open My Course ${icon('arrow')}</a>`;
    if(status.kind==='pending')return `<a class="${classes} fsa-owned-course-cta" href="#/purchase-history">${icon('clock')} Enrollment Requested — View Order</a>`;
    if(status.kind==='restricted')return `<a class="${classes} fsa-owned-course-cta" href="#/my-courses">${icon('lock')} Manage My Access</a>`;
    return `<button class="${classes}" data-action="add-cart" data-id="${course.id}" data-mode="${mode}">Add Course ${icon('arrow')}</button>`;
  }
  function prunePurchasedCart(showMessage=false){
    let changed=false;
    state.cart=[...new Set(state.cart.map(Number))].filter(id=>{
      const course=courseById(id);if(!course)return false;
      const mode=coursePurchaseMode(course);
      if(purchaseState(id,mode).kind==='available')return true;
      delete state.cartModes[id];changed=true;return false;
    });
    if(changed){write(LS.cart,state.cart);write(LS.cartModes,state.cartModes);if(showMessage)toast('Courses already owned or awaiting approval were removed from the cart.');}
    return changed;
  }

  function cartTotals() {
    const courseItems = state.cart.map(courseById).filter(Boolean).map(courseForCart).filter(Boolean);
    const subtotal = courseItems.reduce((sum,c)=>sum+Number(c.price||0),0);
    const discount = state.coupon === 'FSA10' ? Math.round(subtotal * .10) : 0;
    return { courseItems, subtotal, discount, total: subtotal-discount };
  }

  function renderCart() {
    prunePurchasedCart();
    setChrome('public');
    const t = cartTotals();
    app.innerHTML = `${pageHero({eyebrow:'Your Cart',title:'Review your course selection.',text:'Check your selected courses before submitting your enrollment request.',center:true})}<section class="page-section"><div class="container cart-page-grid"><div>${t.courseItems.length ? `<div class="cart-list">${t.courseItems.map(c=>`<article class="cart-item"><div class="cart-item-image">${imageMarkup(c.image,c.title,initials(c.title))}</div><div><span class="course-category">${c.category}</span><h3>${c.title}</h3><p>${purchaseModeLabel(c.cartMode)} · ${c.duration} · ${c.projects} projects · ${c.instructor}</p><div class="item-actions"><button class="link-button" data-action="move-wishlist" data-id="${c.id}">Move to wishlist</button><button class="link-button" data-action="remove-cart" data-id="${c.id}">Remove</button></div></div><div class="cart-item-price"><strong>${money(c.price)}</strong><del>${money(c.originalPrice)}</del></div></article>`).join('')}</div>` : `<div class="empty-state"><span class="empty-icon">${icon('cart')}</span><h3>Your cart is empty</h3><p>Explore courses and add the learning path you want to join.</p><a class="button button-primary" href="#/courses">Explore Courses</a></div>`}</div><aside class="summary-card"><h3>Enrollment summary</h3><div class="coupon-row"><input class="form-control" id="couponInput" value="${state.coupon||''}" placeholder="Promotional code"><button class="button button-secondary button-sm" data-action="apply-coupon">Apply</button></div><div class="form-help">Enter a valid academy promotional code.</div><div class="summary-lines"><div class="summary-line"><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div><div class="summary-line"><span>Discount</span><strong>−${money(t.discount)}</strong></div><div class="summary-line"><span>Final fee</span><strong>Confirmed by academy</strong></div><div class="summary-line total"><span>Estimated total</span><strong>${money(t.total)}</strong></div></div><a class="button button-primary button-block ${t.subtotal===0?'disabled':''}" href="${t.courseItems.length?'#/checkout':'#/courses'}">Continue to Enrollment ${icon('arrow')}</a><div class="demo-notice" style="margin-top:14px">${icon('shield')} Your enrollment details are sent securely to the academy administration team.</div></aside></div></section>`;
  }
  function renderCheckout() {
    if(!state.loggedIn){sessionStorage.setItem('fsa_after_auth_path','/checkout');toast('Create a student account or sign in to continue checkout.','error');routeTo('/register');return;}
    prunePurchasedCart(true);
    setChrome('public');
    const t=cartTotals();
    if(!t.courseItems.length){renderCart();toast('You already own these courses or have an outstanding order.','error');return;}
    const previous=state.checkoutProfile;
    const returning=!!(state.user && state.user.name && state.user.email && state.user.phone);
    const displayName=previous?.name||state.user.name||'';
    const displayEmail=previous?.email||state.user.email||'';
    const displayPhone=previous?.phone||state.user.phone||'';
    const country=previous?.country||state.user.country||'India';
    const province=previous?.state||'Telangana';
    const city=previous?.city||state.user.city||'';
    const address=previous?.address||'';
    const postal=previous?.postal||'';
    const billingFields=`<div class="form-grid"><div class="form-group"><label>Full name<input class="form-control" name="name" autocomplete="name" required value="${escapeHtml(displayName==='Academy Learner'?'':displayName)}"></label></div><div class="form-group"><label>Email address<input class="form-control" name="email" type="email" autocomplete="email" required value="${escapeHtml(displayEmail)}"></label></div><div class="form-group full"><label>Phone number<input class="form-control" name="phone" autocomplete="tel" required value="${escapeHtml(displayPhone)}"></label></div><div class="form-group"><label>Country<select class="form-control" name="country" required>${['India','Pakistan','United Arab Emirates','Other'].map(x=>`<option value="${x}" ${country===x?'selected':''}>${x}</option>`).join('')}</select></label></div><div class="form-group"><label>State / province<input class="form-control" name="state" required value="${escapeHtml(province)}"></label></div><div class="form-group full"><label>Address<input class="form-control" name="address" required value="${escapeHtml(address)}"></label></div><div class="form-group"><label>City<input class="form-control" name="city" required value="${escapeHtml(city)}"></label></div><div class="form-group"><label>Postal code<input class="form-control" name="postal" required value="${escapeHtml(postal)}"></label></div></div>`;
    app.innerHTML=`${pageHero({eyebrow:'Secure course enrollment',title:returning?'Welcome back — confirm payment.':'Complete your first course order.',text:returning?'Your student account details are ready. Choose a payment method; adding the rest of your profile is optional.':'Add your billing details once, then choose your payment method.',center:true})}<section class="page-section"><div class="container checkout-grid"><form id="checkoutForm" data-returning="${returning?'yes':'no'}" novalidate>
      ${returning?`<section class="form-section fsa-return-checkout"><span class="eyebrow">Returning learner</span><h2>Your account is ready</h2><p class="fsa-checkout-profile-summary"><strong>${escapeHtml(displayName)}</strong><span>${escapeHtml(displayEmail)} · ${escapeHtml(displayPhone)}</span>${[address,city,province,country].filter(Boolean).length?`<small>${escapeHtml([address,city,province,country].filter(Boolean).join(', '))}</small>`:''}</p><button class="button button-secondary button-sm" type="button" data-action="checkout-edit-billing" aria-controls="checkoutBillingEditor" aria-expanded="false">Edit saved details</button><div id="checkoutBillingEditor" class="fsa-checkout-billing-editor" hidden>${billingFields.replace(/<(input|select)\b/g,'$& disabled')}</div></section>`:`<section class="form-section"><h2>Your contact and billing details</h2><p>These details are saved with the order and can be reused at your next checkout.</p>${billingFields}</section>`}
      <section class="form-section"><span class="eyebrow">Final step</span><h2>Choose a payment request method</h2><div class="payment-options"><label class="payment-option"><input type="radio" name="payment" value="upi" checked><span class="payment-icon">${icon('phone')}</span><span><strong>UPI</strong><small>Academy will share payment instructions</small></span></label><label class="payment-option"><input type="radio" name="payment" value="bank"><span class="payment-icon">${icon('briefcase')}</span><span><strong>Bank transfer</strong><small>Pay using academy bank details after order confirmation</small></span></label><label class="payment-option"><input type="radio" name="payment" value="branch"><span class="payment-icon">${icon('map')}</span><span><strong>Pay at branch</strong><small>Complete payment at your chosen branch</small></span></label></div><div class="form-group" style="margin-top:15px"><label>Note to the academy (optional)<textarea class="form-control" name="message" placeholder="Batch or payment questions"></textarea></label></div></section>
      <button class="button button-primary button-lg button-block" type="submit">Submit Payment Request ${icon('check')}</button><p class="fsa-checkout-explainer">No payment is charged on this page. Your enrollment activates after the academy confirms payment.</p></form>
      <aside class="summary-card"><h3>Order summary</h3><div class="summary-lines">${t.courseItems.map(c=>`<div class="summary-line"><span>${escapeHtml(c.title)}<small style="display:block;color:var(--muted);margin-top:3px">${purchaseModeLabel(c.cartMode)}</small></span><strong>${money(c.price)}</strong></div>`).join('')}<div class="summary-line"><span>Discount</span><strong>−${money(t.discount)}</strong></div><div class="summary-line total"><span>Estimated total</span><strong>${money(t.total)}</strong></div></div><div class="demo-notice">${icon('shield')} This is a payment request, not an instant card charge. Track its status in Purchase History.</div></aside></div></section>`;
  }
  function renderCheckoutSuccess() {
    setChrome('public');
    const order = read(LS.lastOrder, null);
    app.innerHTML = `<section class="page-section section-surface" style="min-height:70vh;display:grid;align-items:center"><div class="container"><article class="success-card reveal"><span class="success-icon">${icon('check')}</span><span class="eyebrow">Order Received</span><h1>Your course order is now in your dashboard.</h1><p>${order ? `We received your request for <strong>${escapeHtml(order.item)}</strong>. Your order is pending payment confirmation. Course access will activate after an administrator marks the order as paid.` : 'Your order is pending payment confirmation. Course access will activate after an administrator marks the order as paid.'}</p><span class="order-chip">Reference ${order?.id || 'FSA-ENROLLMENT'}</span><div class="cta-actions"><a class="button button-primary" href="#/dashboard">Go to Dashboard</a><a class="button button-secondary" href="#/courses">Explore More Courses</a></div></article></div></section>`;
  }
  function authVisual() {
    return `<div class="auth-visual">${imageMarkup(D.academyImages.hero,'Technology students learning together','FSA')}<div class="auth-message"><span class="eyebrow light">Full Stack Academy LMS</span><h2>Keep learning, building and moving forward.</h2><p>Track courses, complete lessons, save notes and access certificates through one focused learner experience.</p></div></div>`;
  }

  function renderLogin() {
    setChrome('auth');
    app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card"><span class="eyebrow">Welcome Back</span><h1>Choose your profile</h1><p>Students and instructors sign in to their own dedicated dashboard.</p><form class="auth-form" id="loginForm" novalidate><div class="profile-type-picker"><label><input type="radio" name="account_type" value="student" checked><span><i class="profile-type-icon">${icon('book')}</i><b><strong>Student Profile</strong><small>Learn, track courses and publish achievements</small></b></span></label><label><input type="radio" name="account_type" value="instructor"><span><i class="profile-type-icon">${icon('users')}</i><b><strong>Instructor Profile</strong><small>Manage assigned students after admin approval</small></b></span></label></div><div class="form-group"><label>Email or academy ID</label><input class="form-control" name="identifier" required autocomplete="username" value="${escapeHtml(state.user.email||state.user.student_code||'')}" placeholder="Email or FSA-26-XXXXXX"></div><div class="form-group"><label>Password</label><div class="password-wrap"><input class="form-control" name="password" type="password" required minlength="8" autocomplete="current-password"><button class="password-toggle" type="button" data-action="toggle-password">${icon('eye')}</button></div></div><div class="checkbox-line"><label><input type="checkbox" name="remember" checked> Keep me signed in</label><a href="#/forgot-password">Forgot password?</a></div><button class="button button-primary button-block" type="submit">Open Dashboard</button></form><p class="auth-switch">Need an account? <a href="#/register">Create student profile</a></p><p class="auth-switch"><a href="${ADMIN_URL}">Administrator login</a></p></article></div></section>`;
  }
  function renderRegister() {
    setChrome('auth');
    const registrationOpen = siteSettings.registration_enabled !== false;
    if (!registrationOpen) {
      const contact = contactDetails();
      app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card"><span class="eyebrow">Registration Paused</span><h1>New account registration is currently closed.</h1><p>The academy has temporarily disabled student signup. Contact the support team for assistance.</p><div class="cta-actions"><a class="button button-primary" href="mailto:${escapeHtml(contact.email)}">Email Support</a><a class="button button-secondary" href="#/login">Return to Sign In</a></div></article></div></section>`;
      return;
    }
    app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card auth-card-wide"><span class="eyebrow">Create Account</span><h1>Create your student account</h1><p>Students can create an account here. Instructor accounts are created by authorized academy administrators.</p><form class="auth-form" id="registerForm" novalidate><input type="hidden" name="account_type" value="student"><div class="form-grid"><div class="form-group full"><label>Full name</label><input class="form-control" name="name" required maxlength="120" autocomplete="name"></div><div class="form-group"><label>Email</label><input class="form-control" name="email" type="email" required maxlength="190" autocomplete="email"></div><div class="form-group"><label>Phone</label><input class="form-control" name="phone" type="tel" required maxlength="40" autocomplete="tel"></div><div class="form-group"><label>Password</label><div class="password-wrap"><input class="form-control" name="password" type="password" minlength="8" maxlength="4096" required autocomplete="new-password"><button class="password-toggle" type="button" data-action="toggle-password">${icon('eye')}</button></div></div><div class="form-group"><label>Confirm password</label><input class="form-control" name="confirm" type="password" minlength="8" maxlength="4096" required autocomplete="new-password"></div></div><label class="checkbox-line" style="justify-content:flex-start"><input type="checkbox" name="terms" required> I agree to the <a href="#/terms">terms</a> and <a href="#/privacy">privacy policy</a>.</label><button class="button button-primary button-block" type="submit" id="registerSubmitButton">Create Student Account</button></form><p class="auth-switch">Already registered? <a href="#/login">Sign in</a></p></article></div></section>`;
  }

  function renderForgotPassword() {
    setChrome('auth');
    app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card"><span class="eyebrow">Account Recovery</span><h1>Reset your password</h1><p>Enter your registered email address. We will send a secure password reset link when SMTP is configured.</p><form class="auth-form" id="forgotPasswordForm" novalidate><div class="form-group"><label>Email address</label><input class="form-control" name="email" type="email" required autocomplete="email"></div><button class="button button-primary button-block" type="submit">Send Reset Link</button></form><p class="auth-switch"><a href="#/login">Return to sign in</a></p></article></div></section>`;
  }

  function renderResetPassword(query = '') {
    setChrome('auth');
    const params = new URLSearchParams(query);
    const email = params.get('email') || '';
    const token = params.get('token') || '';
    app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card"><span class="eyebrow">Choose New Password</span><h1>Secure your account</h1><p>Create a new password with at least eight characters.</p><form class="auth-form" id="resetPasswordForm" novalidate><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="token" value="${escapeHtml(token)}"><div class="form-group"><label>New password</label><input class="form-control" name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="form-group"><label>Confirm password</label><input class="form-control" name="confirm" type="password" minlength="8" required autocomplete="new-password"></div><button class="button button-primary button-block" type="submit">Update Password</button></form><p class="auth-switch"><a href="#/login">Return to sign in</a></p></article></div></section>`;
  }

  function ensureUnifiedDashboardLayoutStyles(){
    const theme=(siteSettings&&siteSettings.theme)||{};
    const dashTheme={
      '--dash-brand':theme.brand||'#852937',
      '--dash-brand-hover':theme.brand_hover||theme.brand||'#982b3c',
      '--dash-brand-dark':theme.brand_dark||theme.brand||'#671820',
      '--dash-brand-deep':theme.brand_deep||theme.brand_dark||theme.brand||'#431016',
      '--dash-ink':theme.ink||'#2d1519',
      '--dash-ink-soft':theme.ink_soft||'#765f64',
      '--dash-muted':theme.muted||theme.ink_soft||'#765f64',
      '--dash-soft':theme.pink||'#fff2f2',
      '--dash-soft-2':theme.pink_2||theme.surface_2||'#f8f4f5',
      '--dash-surface':theme.surface||'#ffffff',
      '--dash-surface-2':theme.surface_2||'#f8f4f5',
      '--dash-border':theme.border||'#ead9dc',
      '--dash-border-strong':theme.border_strong||theme.border||'#ddc4c9',
      '--dash-success':theme.success||'#287a52',
      '--dash-warning':theme.warning||'#9a6518',
      '--dash-danger':theme.danger||'#b4233c'
    };
    Object.entries(dashTheme).forEach(([key,value])=>document.documentElement.style.setProperty(key,String(value||'')));
    if(document.getElementById('fsaUnifiedDashboardLayout')) return;
    const style=document.createElement('style');
    style.id='fsaUnifiedDashboardLayout';
    style.textContent=`
      html:has(body[data-mode="dashboard"]),
      body[data-mode="dashboard"]{
        min-height:100%;
        background:var(--dash-surface-2);
        overflow-x:hidden!important;
      }
      body[data-mode="dashboard"]{
        margin:0!important;
      }
      body[data-mode="dashboard"] #app{
        position:static!important;
        overflow:visible!important;
        transform:none!important;
        perspective:none!important;
        filter:none!important;
        contain:none!important;
      }
      body[data-mode="dashboard"] #app > .dashboard-shell{
        animation:none!important;
        transform:none!important;
        perspective:none!important;
        filter:none!important;
        contain:none!important;
        overflow:visible!important;
      }
      body[data-mode="dashboard"] .site-header{
        display:none!important;
      }
      body[data-mode="dashboard"] .site-footer,
      body[data-mode="dashboard"] .announcement,
      body[data-mode="dashboard"] .fsa-accessibility,
      body[data-mode="dashboard"] .fsa-language-switch{
        display:none!important;
      }

      body[data-mode="dashboard"] .dashboard-shell{
        --dash-sidebar:272px;
        min-height:100vh;
        display:block;
        padding:0!important;
        background:var(--dash-surface-2);
      }

      body[data-mode="dashboard"] .dashboard-sidebar{
        position:fixed!important;
        top:0!important;
        left:0!important;
        right:auto!important;
        bottom:0!important;
        z-index:100!important;
        width:var(--dash-sidebar)!important;
        height:100vh!important;
        height:100dvh!important;
        min-height:100vh!important;
        padding:18px 14px 14px!important;
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
        border:0!important;
        border-right:1px solid rgba(255,255,255,.08)!important;
        background:var(--dash-brand-deep)!important;
        color:#fff!important;
        box-shadow:8px 0 28px rgba(35,10,15,.08)!important;
        transform:none!important;
        isolation:isolate;
      }

      .dashboard-admin-brand-row{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        min-height:58px;
        padding:0 6px 14px;
        border-bottom:1px solid rgba(255,255,255,.10);
      }
      .dashboard-admin-brand{
        min-width:0;
        flex:1 1 auto;
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        justify-content:center;
        gap:5px;
        color:#fff;
        text-decoration:none;
      }
      .dashboard-admin-brand-mark{
        width:min(190px,100%);
        height:42px;
        flex:0 0 42px;
        display:flex;
        align-items:center;
        overflow:visible;
        border-radius:0;
        background:transparent;
        color:#fff;
        box-shadow:none;
      }
      .dashboard-admin-brand-mark img{
        display:block;
        width:100%;
        height:100%;
        object-fit:contain;
        object-position:left center;
        padding:0;
      }
      .dashboard-admin-brand-copy{
        min-width:0;
      }
      .dashboard-admin-brand-copy strong,
      .dashboard-admin-brand-copy small{
        display:block;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .dashboard-admin-brand-copy strong{
        font-family:Poppins,Inter,sans-serif;
        font-size:13px;
        font-weight:800;
      }
      .dashboard-admin-brand-copy small{
        margin-top:0;
        color:rgba(255,255,255,.62);
        font-size:7.5px;
        font-weight:800;
        letter-spacing:.13em;
        text-transform:uppercase;
      }
      .dashboard-admin-role-copy{padding-left:2px;line-height:1}

      .dashboard-sidebar-close{
        display:none!important;
        width:34px;
        height:34px;
        flex:0 0 34px;
        border:1px solid rgba(255,255,255,.14)!important;
        border-radius:10px!important;
        background:rgba(255,255,255,.07)!important;
        color:#fff!important;
      }

      body[data-mode="dashboard"] .dashboard-profile-mini{
        flex:0 0 auto;
        min-width:0;
        margin:14px 4px 6px;
        padding:10px;
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        border:1px solid rgba(255,255,255,.10);
        border-radius:13px;
        background:rgba(255,255,255,.07);
        color:#fff;
      }
      body[data-mode="dashboard"] .dashboard-profile-mini>span:last-child{
        min-width:0;
        flex:1 1 auto;
      }
      body[data-mode="dashboard"] .dashboard-profile-mini .avatar{
        width:39px;
        height:39px;
        flex:0 0 39px;
        border:1px solid rgba(255,255,255,.18);
        background:var(--dash-surface);
        color:var(--dash-brand);
      }
      body[data-mode="dashboard"] .dashboard-profile-mini .avatar img{
        width:100%;
        height:100%;
        object-fit:cover;
      }
      body[data-mode="dashboard"] .dashboard-profile-mini strong{
        color:#fff;
        font-size:10px;
      }
      body[data-mode="dashboard"] .dashboard-profile-mini span{
        color:rgba(255,255,255,.68);
        font-size:8px;
      }

      body[data-mode="dashboard"] .dashboard-nav{
        flex:1 1 auto!important;
        min-height:0!important;
        display:block!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        overscroll-behavior:contain;
        margin:8px 0 8px!important;
        padding:4px 3px 8px 0!important;
        scrollbar-width:thin;
        scrollbar-color:rgba(255,255,255,.22) transparent;
      }
      body[data-mode="dashboard"] .dashboard-nav::-webkit-scrollbar{
        width:5px;
      }
      body[data-mode="dashboard"] .dashboard-nav::-webkit-scrollbar-track{
        background:transparent;
      }
      body[data-mode="dashboard"] .dashboard-nav::-webkit-scrollbar-thumb{
        border-radius:999px;
        background:rgba(255,255,255,.20);
      }
      .dashboard-nav-label{
        display:block;
        margin:18px 13px 7px;
        color:rgba(255,255,255,.60);
        font-size:8px;
        font-weight:800;
        letter-spacing:.14em;
        text-transform:uppercase;
      }
      body[data-mode="dashboard"] .dashboard-nav a,
      body[data-mode="dashboard"] .dashboard-nav button{
        width:100%;
        min-height:43px;
        margin:2px 0;
        padding:0 13px;
        display:flex;
        align-items:center;
        gap:12px;
        border:0;
        border-radius:11px;
        background:transparent;
        color:rgba(255,255,255,.86);
        font-family:Poppins,Inter,sans-serif;
        font-size:11px;
        font-weight:700;
        text-align:left;
        text-decoration:none;
        cursor:pointer;
        transition:.2s ease;
      }
      body[data-mode="dashboard"] .dashboard-nav a:hover,
      body[data-mode="dashboard"] .dashboard-nav a.active,
      body[data-mode="dashboard"] .dashboard-nav button:hover{
        background:rgba(255,255,255,.11);
        color:#fff;
      }
      body[data-mode="dashboard"] .dashboard-nav svg{
        width:17px;
        height:17px;
        flex:0 0 17px;
      }
      body[data-mode="dashboard"] .dashboard-nav .nav-divider{
        display:none;
      }
      body[data-mode="dashboard"] .dashboard-nav-label{
        margin:14px 11px 6px!important;
      }
      body[data-mode="dashboard"] .dashboard-nav a.active{
        box-shadow:inset 3px 0 0 rgba(255,255,255,.92);
      }
      body[data-mode="dashboard"] .dashboard-nav a span{
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      /* v110 — Admin-style nested Instructor navigation. */
      body[data-mode="dashboard"] .dashboard-nav-group{
        display:grid;
        gap:2px;
        margin:0;
      }
      body[data-mode="dashboard"] .dashboard-nav-parent{
        position:relative;
      }
      body[data-mode="dashboard"] .dashboard-nav-parent b{
        width:17px;
        height:17px;
        margin-left:auto;
        display:grid;
        place-items:center;
        opacity:.72;
        transition:transform .18s ease,opacity .18s ease;
      }
      body[data-mode="dashboard"] .dashboard-nav-parent b svg{
        width:14px;
        height:14px;
      }
      body[data-mode="dashboard"] .dashboard-nav-group.is-open .dashboard-nav-parent b{
        transform:rotate(180deg);
        opacity:1;
      }
      body[data-mode="dashboard"] .dashboard-nav-submenu{
        display:none;
        gap:2px;
        margin:0 0 5px 24px;
        padding:3px 0 3px 13px;
        border-left:1px solid rgba(255,255,255,.22);
      }
      body[data-mode="dashboard"] .dashboard-nav-group.is-open .dashboard-nav-submenu,
      body[data-mode="dashboard"] .dashboard-nav-group.is-active .dashboard-nav-submenu{
        display:grid;
      }
      body[data-mode="dashboard"] .dashboard-nav-submenu a{
        position:relative;
        min-height:34px!important;
        margin:0!important;
        padding:0 10px 0 17px!important;
        gap:8px!important;
        border-radius:9px!important;
        background:transparent!important;
        box-shadow:none!important;
        color:rgba(255,255,255,.73)!important;
        font-size:10px!important;
        font-weight:650!important;
      }
      body[data-mode="dashboard"] .dashboard-nav-submenu a::before{
        content:'';
        position:absolute;
        left:4px;
        top:50%;
        width:5px;
        height:5px;
        margin-top:-2.5px;
        border-radius:50%;
        background:rgba(255,255,255,.35);
      }
      body[data-mode="dashboard"] .dashboard-nav-submenu a:hover{
        background:rgba(255,255,255,.08)!important;
        color:#fff!important;
      }
      body[data-mode="dashboard"] .dashboard-nav-submenu a.active{
        background:rgba(255,255,255,.13)!important;
        color:#fff!important;
        box-shadow:none!important;
      }
      body[data-mode="dashboard"] .dashboard-nav-submenu a.active::before{
        background:#fff;
        box-shadow:0 0 0 3px rgba(255,255,255,.12);
      }

      .dashboard-sidebar-footer{
        flex:0 0 auto!important;
        display:grid!important;
        gap:4px!important;
        margin-top:auto!important;
        padding:12px 4px 0!important;
        border-top:1px solid rgba(255,255,255,.10);
        background:var(--dash-brand-deep);
      }
      .dashboard-sidebar-footer a,
      .dashboard-sidebar-footer button{
        min-height:39px;
        padding:0 11px;
        display:flex;
        align-items:center;
        gap:10px;
        border:0;
        border-radius:10px;
        background:transparent;
        color:rgba(255,255,255,.78);
        font-size:10px;
        font-weight:700;
        text-align:left;
        cursor:pointer;
      }
      .dashboard-sidebar-footer a:hover,
      .dashboard-sidebar-footer button:hover{
        background:rgba(255,255,255,.08);
        color:#fff;
      }
      .dashboard-sidebar-footer svg{
        width:17px!important;
        height:17px!important;
        flex:0 0 17px!important;
      }

      body[data-mode="dashboard"] .dashboard-main{
        width:calc(100% - var(--dash-sidebar))!important;
        min-width:0;
        min-height:100vh;
        margin-left:var(--dash-sidebar)!important;
        padding:0!important;
        background:var(--dash-surface-2);
      }

      .dashboard-admin-topbar{
        position:sticky!important;
        top:0!important;
        z-index:80!important;
        min-height:72px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:18px;
        padding:0 28px;
        border-bottom:1px solid var(--dash-border);
        background:rgba(255,255,255,.94);
        backdrop-filter:blur(16px);
      }
      .dashboard-admin-topbar-left,
      .dashboard-admin-topbar-right{
        min-width:0;
        display:flex;
        align-items:center;
        gap:13px;
      }
      .dashboard-admin-topbar-copy{
        min-width:0;
      }
      .dashboard-admin-topbar-copy span,
      .dashboard-admin-topbar-copy strong{
        display:block;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .dashboard-admin-topbar-copy span{
        color:var(--dash-muted);
        font-size:9px;
        font-weight:700;
      }
      .dashboard-admin-topbar-copy strong{
        margin-top:2px;
        color:var(--dash-ink);
        font-family:Poppins,Inter,sans-serif;
        font-size:17px;
      }
      .dashboard-system-status{
        display:flex;
        align-items:center;
        gap:7px;
        padding:8px 11px;
        border:1px solid color-mix(in srgb,var(--dash-success) 25%,white);
        border-radius:999px;
        background:color-mix(in srgb,var(--dash-success) 8%,white);
        color:var(--dash-success);
        font-size:9px;
        font-weight:800;
        white-space:nowrap;
      }
      .dashboard-system-status i{
        width:7px;
        height:7px;
        border-radius:50%;
        background:#287a52;
        box-shadow:0 0 0 4px rgba(40,122,82,.10);
      }
      .dashboard-admin-profile-chip{
        min-width:0;
        display:flex;
        align-items:center;
        gap:9px;
        padding:6px 9px 6px 6px;
        border:1px solid var(--dash-border);
        border-radius:12px;
        background:var(--dash-surface);
        color:var(--dash-ink);
        text-decoration:none;
      }
      .dashboard-admin-profile-chip .avatar{
        width:35px;
        height:35px;
        flex:0 0 35px;
        border-radius:10px;
        display:grid;
        place-items:center;
        overflow:hidden;
        background:var(--dash-soft);
        color:var(--dash-brand);
        font-size:10px;
        font-weight:900;
      }
      .dashboard-admin-profile-chip .avatar img{
        width:100%;
        height:100%;
        object-fit:cover;
      }
      .dashboard-admin-profile-chip strong,
      .dashboard-admin-profile-chip small{
        display:block;
        max-width:160px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        text-align:left;
      }
      .dashboard-admin-profile-chip strong{
        font-size:10px;
      }
      .dashboard-admin-profile-chip small{
        margin-top:2px;
        color:var(--dash-muted);
        font-size:8px;
      }

      .dashboard-content{
        padding:28px;
        animation:fsaDashContentIn .32s ease both;
      }
      @keyframes fsaDashContentIn{
        from{opacity:0;transform:translateY(7px)}
        to{opacity:1;transform:none}
      }
      .dashboard-page-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:20px;
        margin-bottom:24px;
      }
      .dashboard-page-head h1{
        margin:0 0 6px;
        color:var(--dash-ink);
        font-family:Poppins,Inter,sans-serif;
        font-size:30px;
        line-height:1.16;
        letter-spacing:-.025em;
      }
      .dashboard-page-head p{
        max-width:720px;
        margin:0;
        color:var(--dash-muted);
        font-size:12px;
        line-height:1.65;
      }
      .dashboard-page-actions{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        gap:8px;
      }

      body[data-mode="dashboard"] .dashboard-topbar{
        display:none!important;
      }
      body[data-mode="dashboard"] .dashboard-metrics{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
        gap:15px;
      }
      body[data-mode="dashboard"] .metric-card{
        position:relative;
        overflow:hidden;
        min-height:132px;
        padding:19px;
        border:1px solid var(--dash-border);
        border-radius:16px;
        background:var(--dash-surface);
        box-shadow:0 7px 24px color-mix(in srgb,var(--dash-brand-deep) 5%,transparent);
      }
      body[data-mode="dashboard"] .metric-card::after{
        content:"";
        position:absolute;
        width:90px;
        height:90px;
        right:-38px;
        bottom:-45px;
        border-radius:50%;
        background:var(--dash-soft);
        pointer-events:none;
      }
      body[data-mode="dashboard"] .metric-card-top{
        position:relative;
        z-index:1;
      }
      body[data-mode="dashboard"] .metric-card-top>span{
        color:var(--dash-muted);
        font-size:9px;
        font-weight:800;
        letter-spacing:.08em;
        text-transform:uppercase;
      }
      body[data-mode="dashboard"] .metric-card-icon{
        width:38px;
        height:38px;
        border-radius:12px;
      }
      body[data-mode="dashboard"] .metric-card>strong{
        position:relative;
        z-index:1;
        margin-top:11px;
        color:var(--dash-ink);
        font-family:Poppins,Inter,sans-serif;
        font-size:29px;
      }
      body[data-mode="dashboard"] .metric-card>span{
        position:relative;
        z-index:1;
        color:var(--dash-success);
        font-size:9px;
        font-weight:700;
      }
      body[data-mode="dashboard"] .dashboard-grid{
        grid-template-columns:minmax(0,1.45fr) minmax(310px,.55fr);
        gap:18px;
        margin-top:18px;
      }
      body[data-mode="dashboard"] .panel{
        border:1px solid var(--dash-border);
        border-radius:17px;
        background:var(--dash-surface);
        box-shadow:0 7px 24px color-mix(in srgb,var(--dash-brand-deep) 5%,transparent);
      }
      body[data-mode="dashboard"] .panel-head h2{
        font-size:17px;
      }
      body[data-mode="dashboard"] .instructor-page-actions{
        padding:18px 20px;
        border-radius:16px;
        box-shadow:0 7px 24px color-mix(in srgb,var(--dash-brand-deep) 4%,transparent);
      }

      @media(max-width:1100px){
        .dashboard-system-status{display:none}
        .dashboard-admin-profile-chip strong,
        .dashboard-admin-profile-chip small{max-width:110px}
      }

      @media(max-width:900px){
        body[data-mode="dashboard"] .dashboard-shell{
          padding:0!important;
        }
        body[data-mode="dashboard"] .dashboard-main{
          width:100%!important;
          margin-left:0!important;
        }
        body[data-mode="dashboard"] .dashboard-sidebar{
          width:280px!important;
          transform:translateX(-105%)!important;
          transition:transform .25s ease!important;
          box-shadow:0 20px 60px rgba(35,10,15,.28)!important;
        }
        body[data-mode="dashboard"] .dashboard-sidebar.open{
          transform:translateX(0)!important;
        }
        .dashboard-sidebar-close{
          display:grid!important;
          place-items:center;
        }
        body[data-mode="dashboard"] .dashboard-mobile-nav{
          display:grid!important;
          place-items:center;
        }
        .dashboard-admin-topbar{
          padding:0 18px;
        }
        .dashboard-content{
          padding:24px 18px;
        }
        body[data-mode="dashboard"] .dashboard-grid{
          grid-template-columns:1fr;
        }
      }

      @media(max-width:620px){
        .dashboard-admin-topbar{
          min-height:64px;
          padding:0 12px;
        }
        .dashboard-admin-topbar-copy span{
          display:none;
        }
        .dashboard-admin-topbar-copy strong{
          max-width:170px;
          font-size:14px;
        }
        .dashboard-admin-profile-chip>span:last-child{
          display:none;
        }
        .dashboard-admin-profile-chip{
          padding-right:6px;
        }
        .dashboard-content{
          padding:20px 12px;
        }
        .dashboard-page-head{
          align-items:stretch;
          flex-direction:column;
          margin-bottom:18px;
        }
        .dashboard-page-head h1{
          font-size:25px;
        }
        .dashboard-page-actions .button span{
          display:none;
        }
        body[data-mode="dashboard"] .dashboard-metrics{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function dashboardBrand(roleLabel){
    // The dashboard sidebar is intentionally dark, so use the white academy
    // wordmark instead of putting a white/transparent logo inside a white tile.
    // This keeps the logo readable even when the public header uses a dark logo.
    const logo='assets/images/logo-white-text.svg';
    return `<div class="dashboard-admin-brand-row">
      <a class="dashboard-admin-brand" href="#/" aria-label="${escapeHtml(siteSettings.academy_name||'Full Stack Academy')} home">
        <span class="dashboard-admin-brand-mark dashboard-admin-brand-wordmark"><img src="${logo}" alt="${escapeHtml(siteSettings.academy_name||'Full Stack Academy')}"></span>
        <span class="dashboard-admin-brand-copy dashboard-admin-role-copy">
          <small>${escapeHtml(roleLabel)}</small>
        </span>
      </a>
      <button class="dashboard-sidebar-close" type="button" data-action="toggle-dashboard-nav" aria-label="Close dashboard navigation">×</button>
    </div>`;
  }

  function dashboardTop(title, subtitle) {
    const avatar=state.user.avatar?`<img src="${escapeHtml(state.user.avatar)}" alt="">`:initials(state.user.name);
    const roleLabel=state.user.role==='instructor'?'Instructor':'Student';
    return `<header class="dashboard-admin-topbar">
      <div class="dashboard-admin-topbar-left">
        <button class="icon-button dashboard-mobile-nav" type="button" data-action="toggle-dashboard-nav" aria-label="Open dashboard navigation">${icon('menu')}</button>
        <div class="dashboard-admin-topbar-copy">
          <span>${escapeHtml(siteSettings.academy_name||'Full Stack Academy')}</span>
          <strong>${title}</strong>
        </div>
      </div>
      <div class="dashboard-admin-topbar-right">
        <span class="dashboard-system-status"><i></i> System Online</span>
        <a class="dashboard-admin-profile-chip" href="#/profile">
          <span class="avatar">${avatar}</span>
          <span><strong>${escapeHtml(state.user.name)}</strong><small>${roleLabel}</small></span>
        </a>
      </div>
    </header>`;
  }

  function enforceDashboardFixedSidebar(){
    const shell=app.querySelector('.dashboard-shell');
    const sidebar=app.querySelector('.dashboard-sidebar');
    const main=app.querySelector('.dashboard-main');
    if(!shell||!sidebar||!main) return;

    // The global "#app > *" page-enter animation contains a transform.
    // A transformed ancestor becomes the containing block for position:fixed.
    // Remove every property that can create that containing block.
    [
      ['position','static'],['overflow','visible'],['transform','none'],
      ['perspective','none'],['filter','none'],['contain','none']
    ].forEach(([key,val])=>app.style.setProperty(key,val,'important'));

    [
      ['animation','none'],['transform','none'],['perspective','none'],
      ['filter','none'],['contain','none'],['overflow','visible'],
      ['padding','0'],['min-height','100vh']
    ].forEach(([key,val])=>shell.style.setProperty(key,val,'important'));

    const mobile=window.matchMedia('(max-width: 900px)').matches;

    if(!mobile){
      const width='272px';
      [
        ['position','fixed'],['top','0'],['left','0'],['right','auto'],['bottom','0'],
        ['width',width],['height','100dvh'],['min-height','100vh'],
        ['display','flex'],['flex-direction','column'],['overflow','hidden'],
        ['z-index','100'],['transform','none']
      ].forEach(([key,val])=>sidebar.style.setProperty(key,val,'important'));

      main.style.setProperty('width',`calc(100% - ${width})`,'important');
      main.style.setProperty('margin-left',width,'important');
    }else{
      sidebar.style.setProperty('position','fixed','important');
      sidebar.style.setProperty('top','0','important');
      sidebar.style.setProperty('bottom','0','important');
      sidebar.style.setProperty('left','0','important');
      sidebar.style.setProperty('width','280px','important');
      sidebar.style.setProperty('height','100dvh','important');
      main.style.setProperty('width','100%','important');
      main.style.setProperty('margin-left','0','important');
    }
  }

  function scheduleDashboardFixedSidebar(){
    enforceDashboardFixedSidebar();
    requestAnimationFrame(enforceDashboardFixedSidebar);
    setTimeout(enforceDashboardFixedSidebar,80);
    setTimeout(enforceDashboardFixedSidebar,350);
  }

  function dashboardPageHead(title,subtitle,showBrowse=true){
    return `<div class="dashboard-page-head">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="dashboard-page-actions">
        ${showBrowse?`<a class="button button-secondary button-sm" href="#/courses">${icon('search')}<span>Browse Courses</span></a>`:''}
      </div>
    </div>`;
  }

  function dashboardSidebar(active = 'dashboard') {
    const avatar = state.user.avatar ? `<img src="${escapeHtml(state.user.avatar)}" alt="${escapeHtml(state.user.name)}">` : initials(state.user.name);
    const learning = [
      ['dashboard','Dashboard','dashboard','#/dashboard'],
      ['my-courses','My Courses','book','#/my-courses'],
      ['live-classes','Live Classes','radio','#/live-classes'],
      ['recorded-lectures','Recorded Lectures','play','#/recorded-lectures']
    ];
    const account = [
      ['wishlist','Wishlist','heart','#/wishlist'],
      ['certificates','Certificates','certificate','#/certificates'],
      ['purchase-history','Purchase History','history','#/purchase-history'],
      ['profile','My Profile','user','#/profile']
    ];
    const renderLinks=links=>links.map(l=>`<a class="${active===l[0]?'active':''}" href="${l[3]}" data-action="dashboard-route" data-route="${l[3].replace(/^#/, '')}">${icon(l[2])}<span>${l[1]}</span></a>`).join('');
    return `<aside class="dashboard-sidebar" id="dashboardSidebar">
      ${dashboardBrand('Student Dashboard')}
      <div class="dashboard-profile-mini">
        <span class="avatar">${avatar}</span>
        <span><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.headline||'Full Stack Academy Learner')}</span></span>
      </div>
      <nav class="dashboard-nav">
        <span class="dashboard-nav-label">Learning</span>
        ${renderLinks(learning)}
        <span class="dashboard-nav-label">Account</span>
        ${renderLinks(account)}
      </nav>
      <div class="dashboard-sidebar-footer">
        <a href="#/courses">${icon('search')}<span>Browse Courses</span></a>
        <button type="button" data-action="logout">${icon('logout')}<span>Sign Out</span></button>
      </div>
    </aside>`;
  }

  function dashboardShell(active, content, title, subtitle) {
    if (!state.loggedIn) { routeTo('/login'); return; }
    if (state.user.role === 'instructor') { routeTo('/instructor-dashboard'); return; }
    setChrome('dashboard');
    ensureUnifiedDashboardLayoutStyles();
    ensureDashboardV94Styles();
    app.innerHTML = `<section class="dashboard-shell">
      ${dashboardSidebar(active)}
      <main class="dashboard-main">
        ${dashboardTop(title,subtitle)}
        <section class="dashboard-content">
          ${dashboardPageHead(title,subtitle,true)}
          ${content}
        </section>
      </main>
    </section>`;
    scheduleDashboardFixedSidebar();
  }

  function enrolledCourses() { return state.enrollments.map(courseById).filter(Boolean); }



  function inlineZoomFrameMarkup(liveId, mode) {
    const id=Number(liveId||0);
    if(!id) return '';
    return `<div class="inline-zoom-frame-shell" style="height:clamp(680px,calc(100vh - 150px),860px);min-height:680px;background:#111;border-radius:18px;overflow:hidden;border:1px solid var(--dash-border)">
      <iframe
        src="zoom-room.php?live_id=${encodeURIComponent(id)}&mode=${encodeURIComponent(mode)}&v=90"
        title="Full Stack Academy Zoom Classroom"
        style="display:block;width:100%;height:100%;border:0;background:#111"
        allow="camera; microphone; display-capture; fullscreen; autoplay"
        allowfullscreen
        referrerpolicy="same-origin"></iframe>
    </div>`;
  }


  function ensureLiveLearningLayoutStyles(){
    if(document.getElementById('fsaLiveLearningLayoutStyles')) return;
    const style=document.createElement('style');
    style.id='fsaLiveLearningLayoutStyles';
    style.textContent=`
      .live-learning-stack{display:grid;gap:20px}
      .live-learning-section{
        overflow:hidden;
        padding:0!important;
        border:1px solid var(--dash-border)!important;
        border-radius:18px!important;
        background:var(--dash-surface)!important;
        box-shadow:0 8px 26px rgba(36,25,28,.04)!important;
      }
      .live-learning-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        padding:22px 24px;
        border-bottom:1px solid var(--dash-border);
      }
      .live-learning-head h2{
        margin:5px 0 4px;
        color:var(--dash-ink);
        font-size:20px;
        line-height:1.25;
      }
      .live-learning-head p{
        max-width:760px;
        margin:0;
        color:var(--dash-muted);
        font-size:11px;
        line-height:1.6;
      }
      .live-learning-count{
        min-width:32px;
        height:32px;
        display:grid;
        place-items:center;
        border-radius:999px;
        background:var(--dash-soft);
        color:var(--dash-brand);
        font-size:11px;
        font-weight:900;
      }

      .recorded-course-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:15px;
        padding:18px;
      }
      .recorded-course-card{
        min-width:0;
        overflow:hidden;
        border:1px solid var(--dash-border);
        border-radius:16px;
        background:var(--dash-surface);
        transition:transform .18s ease,box-shadow .18s ease;
      }
      .recorded-course-card:hover{
        transform:translateY(-3px);
        box-shadow:0 14px 34px rgba(33,22,25,.08);
      }
      .recorded-course-cover{
        position:relative;
        height:130px;
        overflow:hidden;
        background:linear-gradient(135deg,var(--dash-brand),var(--dash-brand-deep));
      }
      .recorded-course-cover img{
        width:100%;
        height:100%;
        object-fit:cover;
      }
      .recorded-course-cover::after{
        content:"";
        position:absolute;
        inset:0;
        background:linear-gradient(to top,rgba(25,13,17,.55),rgba(25,13,17,.02) 58%);
        pointer-events:none;
      }
      .recorded-course-cover-fallback{
        width:100%;
        height:100%;
        display:grid;
        place-items:center;
        color:#fff;
      }
      .recorded-course-cover-fallback svg{
        width:36px;
        height:36px;
        opacity:.94;
      }
      .recorded-course-badge{
        position:absolute;
        z-index:2;
        top:12px;
        left:12px;
        padding:6px 9px;
        border-radius:999px;
        background:rgba(255,255,255,.92);
        color:var(--dash-brand);
        font-size:8px;
        font-weight:900;
        letter-spacing:.09em;
        text-transform:uppercase;
      }
      .recorded-course-body{
        padding:15px;
      }
      .recorded-course-body h3{
        min-height:44px;
        margin:6px 0 7px;
        color:var(--dash-ink);
        font-size:15px;
        line-height:1.38;
      }
      .recorded-course-body p{
        min-height:43px;
        margin:0 0 12px;
        overflow:hidden;
        color:var(--dash-muted);
        font-size:9px;
        line-height:1.55;
        display:-webkit-box;
        -webkit-line-clamp:3;
        -webkit-box-orient:vertical;
      }
      .recorded-course-meta{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-bottom:12px;
        color:var(--dash-muted);
        font-size:8px;
        font-weight:700;
      }
      .recorded-course-meta span{
        display:flex;
        align-items:center;
        gap:5px;
      }
      .recorded-course-meta svg{width:13px;height:13px}
      .recorded-course-body .button{width:100%;justify-content:center}

      .live-now-wrap{padding:18px}
      .live-now-card{
        position:relative;
        overflow:hidden;
        display:grid;
        grid-template-columns:64px minmax(0,1fr) auto;
        gap:16px;
        align-items:center;
        padding:20px;
        border:1px solid color-mix(in srgb,var(--dash-success) 30%,var(--dash-border));
        border-radius:16px;
        background:linear-gradient(135deg,color-mix(in srgb,var(--dash-success) 8%,var(--dash-surface)),var(--dash-surface));
      }
      .live-now-pulse{
        width:64px;
        height:64px;
        display:grid;
        place-items:center;
        border-radius:18px;
        background:var(--dash-brand);
        color:#fff;
        box-shadow:0 0 0 7px color-mix(in srgb,var(--dash-brand) 10%,transparent);
      }
      .live-now-pulse svg{width:25px;height:25px}
      .live-now-copy{min-width:0}
      .live-now-copy h3{
        margin:4px 0 5px;
        color:var(--dash-ink);
        font-size:18px;
      }
      .live-now-copy p{
        margin:0;
        color:var(--dash-muted);
        font-size:10px;
        line-height:1.55;
      }
      .live-now-actions{
        display:flex;
        align-items:center;
        justify-content:flex-end;
        flex-wrap:wrap;
        gap:8px;
      }

      .upcoming-lecture-grid{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:14px;
        padding:18px;
      }
      .upcoming-lecture-card{
        min-width:0;
        padding:16px;
        border:1px solid var(--dash-border);
        border-radius:15px;
        background:var(--dash-surface);
      }
      .upcoming-card-top{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
      }
      .upcoming-date-box{
        width:48px;
        height:52px;
        flex:0 0 48px;
        display:grid;
        place-items:center;
        align-content:center;
        border-radius:12px;
        background:var(--dash-soft);
        color:var(--dash-brand);
        line-height:1;
      }
      .upcoming-date-box strong{font-size:18px}
      .upcoming-date-box span{
        margin-top:3px;
        font-size:8px;
        font-weight:900;
        text-transform:uppercase;
      }
      .upcoming-lecture-card h3{
        margin:12px 0 4px;
        color:var(--dash-ink);
        font-size:15px;
        line-height:1.35;
      }
      .upcoming-course-name{
        min-height:30px;
        margin:0;
        color:var(--dash-muted);
        font-size:9px;
        line-height:1.5;
      }
      .upcoming-time-row{
        display:flex;
        align-items:center;
        gap:6px;
        margin:12px 0;
        padding:9px 10px;
        border-radius:10px;
        background:var(--dash-surface-2);
        color:var(--dash-muted);
        font-size:8px;
        font-weight:700;
      }
      .upcoming-time-row svg{width:13px;height:13px}
      .upcoming-actions{
        display:flex;
        align-items:center;
        flex-wrap:wrap;
        gap:7px;
      }
      .upcoming-actions .button{min-height:34px;font-size:9px}

      .live-learning-empty{
        padding:42px 24px;
        text-align:center;
      }
      .live-learning-empty .empty-icon{
        width:48px;
        height:48px;
        margin:0 auto 12px;
      }
      .live-learning-empty h3{
        margin:0 0 6px;
        color:var(--dash-ink);
        font-size:15px;
      }
      .live-learning-empty p{
        max-width:560px;
        margin:0 auto;
        color:var(--dash-muted);
        font-size:10px;
        line-height:1.6;
      }

      @media(max-width:1250px){
        .recorded-course-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
      @media(max-width:1050px){
        .recorded-course-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .upcoming-lecture-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:720px){
        .recorded-course-grid,.upcoming-lecture-grid{grid-template-columns:1fr}
        .live-now-card{grid-template-columns:52px minmax(0,1fr)}
        .live-now-pulse{width:52px;height:52px;border-radius:14px}
        .live-now-actions{grid-column:1/-1;justify-content:flex-start}
      }
      @media(max-width:520px){
        .live-learning-head{padding:18px 15px}
        .recorded-course-grid,.upcoming-lecture-grid,.live-now-wrap{padding:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLiveV80Styles(){
    if(document.getElementById('fsaLiveV80Styles'))return;
    const style=document.createElement('style');
    style.id='fsaLiveV80Styles';
    style.textContent=`
      .live-course-filterbar{
        display:flex;align-items:center;justify-content:space-between;gap:18px;
        padding:18px 20px;border:1px solid var(--dash-border);border-radius:16px;
        background:var(--dash-surface);box-shadow:0 7px 24px rgba(40,22,26,.035)
      }
      .live-course-filterbar>div:first-child{min-width:0}
      .live-course-filterbar h3{margin:0 0 4px;color:var(--dash-ink);font-size:14px}
      .live-course-filterbar p{margin:0;color:var(--dash-muted);font-size:9px}
      .live-course-filterbar select{min-width:290px;max-width:420px}
      .next-class-card{
        margin:18px;display:grid;grid-template-columns:64px minmax(0,1fr) auto;
        align-items:center;gap:16px;padding:20px;border:1px solid var(--dash-border);
        border-radius:16px;background:linear-gradient(135deg,var(--dash-soft),var(--dash-surface))
      }
      .next-class-icon{width:64px;height:64px;display:grid;place-items:center;border-radius:17px;background:var(--dash-brand);color:#fff}
      .next-class-icon svg{width:24px;height:24px}
      .next-class-card h3{margin:4px 0;color:var(--dash-ink);font-size:17px}
      .next-class-card p{margin:0;color:var(--dash-muted);font-size:9px;line-height:1.55}
      .next-class-countdown{min-width:150px;text-align:right}
      .next-class-countdown strong{display:block;color:var(--dash-brand);font-size:21px;line-height:1.15}
      .next-class-countdown span{display:block;margin-top:4px;color:var(--dash-muted);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .recording-admin-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
      .recording-admin-card{overflow:hidden;padding:0!important}
      .recording-admin-card .recorded-course-cover{height:118px}
      .recording-source-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
      .recording-processing{color:#9a6a18;font-size:9px;font-weight:800}
      .recording-published{color:var(--dash-success);font-size:9px;font-weight:800}
      .recording-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
      .recording-toolbar .form-control{min-width:250px}
      .student-next-live-notice{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;padding:15px;border:1px solid var(--dash-border);border-radius:13px;background:var(--dash-soft)}
      .student-next-live-notice .classroom-row-icon{margin:0}
      @media(max-width:900px){.recording-admin-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){.live-course-filterbar{align-items:stretch;flex-direction:column}.live-course-filterbar select{min-width:0;max-width:none;width:100%}.next-class-card{grid-template-columns:52px minmax(0,1fr)}.next-class-icon{width:52px;height:52px}.next-class-countdown{grid-column:1/-1;text-align:left}.recording-admin-grid{grid-template-columns:1fr}.student-next-live-notice{grid-template-columns:40px minmax(0,1fr)}.student-next-live-notice>a{grid-column:2;width:max-content}}
    `;
    document.head.appendChild(style);
  }


  function ensureDashboardV94Styles(){
    if(document.getElementById('fsaDashboardV94Styles'))return;
    const style=document.createElement('style');
    style.id='fsaDashboardV94Styles';
    style.textContent=`
      /* v94 — consistent premium dashboard controls and recording library */
      body[data-mode="dashboard"] .button{
        min-height:40px!important;
        height:40px;
        padding:0 15px!important;
        border-radius:10px!important;
        gap:7px!important;
        font-size:10px!important;
        font-weight:800!important;
        letter-spacing:0!important;
        box-shadow:none!important;
        transform:none!important;
      }
      body[data-mode="dashboard"] .button:hover{transform:translateY(-1px)!important}
      body[data-mode="dashboard"] .button::after{display:none!important}
      body[data-mode="dashboard"] .button.button-sm{
        min-height:36px!important;
        height:36px!important;
        padding:0 12px!important;
        border-radius:9px!important;
        font-size:9px!important;
      }
      body[data-mode="dashboard"] .button svg{width:14px!important;height:14px!important;flex:0 0 14px!important}
      body[data-mode="dashboard"] .button-primary{
        background:var(--dash-brand)!important;
        border-color:var(--dash-brand)!important;
        color:#fff!important;
      }
      body[data-mode="dashboard"] .button-primary:hover{background:var(--dash-brand-hover)!important;border-color:var(--dash-brand-hover)!important}
      body[data-mode="dashboard"] .button-secondary{
        background:#fff!important;
        color:var(--dash-brand)!important;
        border-color:var(--dash-border-strong)!important;
      }
      body[data-mode="dashboard"] .button-secondary:hover{background:var(--dash-soft)!important;border-color:color-mix(in srgb,var(--dash-brand) 35%,var(--dash-border))!important}
      body[data-mode="dashboard"] .button-ghost{
        background:var(--dash-soft)!important;
        color:var(--dash-brand)!important;
        border-color:transparent!important;
      }
      body[data-mode="dashboard"] .button-danger{background:var(--dash-danger)!important;border-color:var(--dash-danger)!important}
      body[data-mode="dashboard"] .row-actions{gap:8px!important}

      .dashboard-admin-brand-row{min-height:72px!important;padding:2px 6px 14px!important}
      .dashboard-admin-brand-wordmark{width:192px!important;max-width:100%!important;height:42px!important}
      .dashboard-admin-role-copy{display:block!important}

      .recording-library-hero{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:22px;
        margin-bottom:14px;
      }
      .recording-library-copy{min-width:0;max-width:760px}
      .recording-library-copy h2{margin:5px 0 4px;color:var(--dash-ink);font-size:24px;line-height:1.18;letter-spacing:-.025em}
      .recording-library-copy p{margin:0;color:var(--dash-muted);font-size:10px;line-height:1.6}
      .recording-library-actions{display:flex;align-items:center;gap:9px;flex:0 0 auto}
      .dashboard-action-button{min-width:0!important;white-space:nowrap!important}

      .recording-library-stats{
        display:flex;
        align-items:center;
        gap:10px;
        margin:0 0 14px;
      }
      .recording-library-stats>span{
        min-width:98px;
        display:flex;
        align-items:baseline;
        gap:6px;
        padding:8px 11px;
        border:1px solid var(--dash-border);
        border-radius:10px;
        background:var(--dash-surface);
      }
      .recording-library-stats strong{color:var(--dash-ink);font-size:15px;line-height:1}
      .recording-library-stats small{color:var(--dash-muted);font-size:7.5px;font-weight:800}

      .live-course-filterbar{
        grid-template-columns:minmax(0,1fr) minmax(260px,370px)!important;
        gap:16px!important;
        padding:13px 15px!important;
        border-radius:14px!important;
        box-shadow:none!important;
      }
      .live-course-filterbar h3{font-size:12px!important;margin-bottom:3px!important}
      .live-course-filterbar p{font-size:8px!important}
      .live-course-filterbar select.form-control{
        height:42px!important;
        border-radius:10px!important;
        padding-left:12px!important;
        font-size:9px!important;
      }

      .recording-admin-grid-premium{
        margin-top:14px!important;
        gap:14px!important;
        align-items:stretch;
      }
      .recording-admin-card-premium{
        min-width:0;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        border-radius:16px!important;
        border-color:var(--dash-border)!important;
        box-shadow:0 8px 24px rgba(49,27,32,.045)!important;
        transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
      }
      .recording-admin-card-premium:hover{
        transform:translateY(-2px);
        border-color:color-mix(in srgb,var(--dash-brand) 22%,var(--dash-border))!important;
        box-shadow:0 14px 32px rgba(49,27,32,.075)!important;
      }
      .recording-admin-card-premium .recorded-course-cover{height:126px!important}
      .recording-cover-status{
        position:absolute;
        z-index:3;
        right:11px;
        top:11px;
        padding:5px 8px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.28);
        backdrop-filter:blur(8px);
        font-size:7.5px;
        font-weight:900;
        letter-spacing:.04em;
        text-transform:uppercase;
      }
      .recording-cover-status.is-ready{background:rgba(38,122,82,.88);color:#fff}
      .recording-cover-status.is-processing{background:rgba(120,82,20,.88);color:#fff}
      .recording-admin-card-premium .recorded-course-badge{
        top:11px;left:11px;padding:5px 8px;font-size:7px;
      }
      .recording-admin-card-premium .recorded-course-body{
        flex:1 1 auto;
        display:flex;
        flex-direction:column;
        padding:14px!important;
      }
      .recording-admin-card-premium .course-category{
        display:block;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:var(--dash-brand);
        font-size:7.5px;
        font-weight:900;
        letter-spacing:.08em;
        text-transform:uppercase;
      }
      .recording-admin-card-premium .recorded-course-body h3{
        min-height:0!important;
        margin:6px 0 6px!important;
        font-size:14px!important;
        line-height:1.35!important;
      }
      .recording-admin-card-premium .recorded-course-body p{
        min-height:31px!important;
        margin:0 0 10px!important;
        -webkit-line-clamp:2!important;
        font-size:8.5px!important;
        line-height:1.5!important;
      }
      .recording-admin-card-premium .recorded-course-meta{
        margin-top:auto!important;
        margin-bottom:11px!important;
        padding-top:9px;
        border-top:1px solid var(--dash-border);
        font-size:7.5px!important;
      }
      .recording-card-actions{
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,.75fr) 36px;
        gap:7px;
        align-items:center;
      }
      .recording-admin-card-premium .recorded-course-body .button{width:auto!important;min-width:0!important;justify-content:center!important}
      .recording-delete-button{width:36px!important;min-width:36px!important;padding:0!important;color:var(--dash-danger)!important;background:#fff3f5!important}
      .recording-delete-button:hover{background:#ffe7eb!important}

      .instructor-page-actions{
        gap:18px!important;
        padding:16px 18px!important;
        border:1px solid var(--dash-border)!important;
        border-radius:15px!important;
        background:var(--dash-surface)!important;
        box-shadow:none!important;
      }
      .instructor-page-actions>div p{font-size:9px!important;line-height:1.6!important}
      .classroom-manage-card .row-actions{margin-top:12px!important}

      @media(max-width:1080px){
        .recording-library-hero{align-items:flex-start;flex-direction:column}
        .recording-library-actions{width:100%;justify-content:flex-start}
      }
      @media(max-width:930px){
        .live-course-filterbar{grid-template-columns:1fr!important}
        .recording-library-stats{flex-wrap:wrap}
      }
      @media(max-width:620px){
        .recording-library-actions{display:grid;grid-template-columns:1fr 1fr}
        .recording-library-actions .button{width:100%!important}
        .recording-library-stats>span{flex:1 1 calc(50% - 5px)}
        .recording-card-actions{grid-template-columns:1fr 1fr 36px}
        .dashboard-admin-brand-wordmark{width:180px!important}
      }
      @media(max-width:390px){
        .recording-library-actions{grid-template-columns:1fr}
        .recording-library-stats>span{flex-basis:100%}
      }
    `;
    document.head.appendChild(style);
  }


  function ensureLiveV81Styles(){
    if(document.getElementById('fsaLiveV81Styles'))return;
    const style=document.createElement('style');
    style.id='fsaLiveV81Styles';
    style.textContent=`
      .yt-live-layout{
        display:grid;
        grid-template-columns:minmax(0,1fr) 360px;
        gap:16px;
        align-items:stretch;
      }
      .yt-live-stage{
        min-width:0;
        border:1px solid var(--dash-border);
        border-radius:18px;
        background:var(--dash-surface);
        box-shadow:0 8px 28px rgba(35,20,24,.05);
      }
      .yt-stage-media{
        position:relative;
        min-height:620px;
        height:clamp(620px,68vh,760px);
        padding:0;
        border-radius:16px 16px 0 0;
        background:#111;
        overflow:visible;
      }
      .yt-stage-media iframe{
        display:block;
        width:100%;
        height:100%;
        min-height:620px;
        border:0;
        border-radius:14px;
        background:#111;
      }
      .yt-stage-placeholder{
        position:absolute;
        inset:0;
        display:grid;
        place-items:center;
        padding:32px;
        border-radius:16px 16px 0 0;
        background:
          radial-gradient(circle at 50% 38%,rgba(133,41,55,.22),transparent 32%),
          linear-gradient(150deg,#181818,#0e0e0e);
        color:#fff;
        text-align:center;
      }
      .yt-stage-placeholder-inner{max-width:640px}
      .yt-stage-live-dot{
        width:74px;height:74px;margin:0 auto 18px;display:grid;place-items:center;
        border-radius:22px;background:var(--dash-brand);color:#fff;
        box-shadow:0 0 0 10px rgba(255,255,255,.06);
      }
      .yt-stage-live-dot svg{width:30px;height:30px}
      .yt-stage-placeholder .eyebrow{color:#f4cbd1}
      .yt-stage-placeholder h2{margin:8px 0;color:#fff;font-size:26px}
      .yt-stage-placeholder p{margin:0 auto 18px;max-width:590px;color:#cfcfcf;font-size:11px;line-height:1.65}
      .yt-countdown{
        display:flex;align-items:center;justify-content:center;gap:8px;
        margin:18px auto 20px;
      }
      .yt-countdown strong{
        min-width:210px;padding:13px 18px;border-radius:13px;
        background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
        color:#fff;font-size:27px;letter-spacing:.02em
      }
      .yt-stage-caption{
        display:flex;align-items:center;justify-content:space-between;gap:14px;
        padding:16px 18px;
        border-top:1px solid var(--dash-border);
      }
      .yt-stage-caption>div:first-child{min-width:0}
      .yt-stage-caption strong{display:block;color:var(--dash-ink);font-size:14px}
      .yt-stage-caption small{
        display:block;margin-top:4px;color:var(--dash-muted);font-size:9px;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap
      }
      .yt-stage-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}

      .yt-recording-side{
        min-width:0;
        display:flex;
        flex-direction:column;
        height:clamp(620px,68vh,760px);
        border:1px solid var(--dash-border);
        border-radius:18px;
        background:var(--dash-surface);
        box-shadow:0 8px 28px rgba(35,20,24,.05);
        overflow:hidden;
      }
      .yt-playlist-head{
        flex:0 0 auto;
        padding:16px 16px 13px;
        border-bottom:1px solid var(--dash-border);
      }
      .yt-playlist-head h3{margin:4px 0 0;color:var(--dash-ink);font-size:15px}
      .yt-playlist-head p{margin:4px 0 0;color:var(--dash-muted);font-size:8px;line-height:1.45}
      .yt-recording-list{
        flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;
        padding:8px;scrollbar-width:thin;scrollbar-color:var(--dash-border) transparent
      }
      .yt-recording-list::-webkit-scrollbar{width:7px}
      .yt-recording-list::-webkit-scrollbar-track{background:transparent}
      .yt-recording-list::-webkit-scrollbar-thumb{background:var(--dash-border);border-radius:99px}
      .yt-recording-item{
        display:grid;grid-template-columns:94px minmax(0,1fr);gap:10px;
        padding:9px;border-radius:12px;text-decoration:none;color:inherit;
        transition:background .16s ease;
      }
      .yt-recording-item:hover{background:var(--dash-soft)}
      .yt-recording-thumb{
        position:relative;height:58px;border-radius:9px;overflow:hidden;
        background:linear-gradient(135deg,var(--dash-brand),var(--dash-brand-deep));
      }
      .yt-recording-thumb img{width:100%;height:100%;object-fit:cover}
      .yt-recording-thumb-fallback{width:100%;height:100%;display:grid;place-items:center;color:#fff}
      .yt-recording-thumb-fallback svg{width:22px;height:22px}
      .yt-recording-item strong{
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
        overflow:hidden;color:var(--dash-ink);font-size:10px;line-height:1.35
      }
      .yt-recording-item small{
        display:block;margin-top:4px;color:var(--dash-muted);font-size:7px;line-height:1.35
      }
      .yt-recording-empty{padding:28px 16px;text-align:center;color:var(--dash-muted);font-size:9px;line-height:1.6}

      .purchased-course-grid{
        display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px
      }
      .purchased-course-card{
        overflow:hidden;border:1px solid var(--dash-border);border-radius:16px;background:var(--dash-surface)
      }
      .purchased-course-image{height:128px;position:relative;overflow:hidden;background:var(--dash-soft)}
      .purchased-course-image img{width:100%;height:100%;object-fit:cover}
      .purchased-course-body{padding:15px}
      .purchased-course-body h3{margin:5px 0 7px;color:var(--dash-ink);font-size:15px;line-height:1.35}
      .purchased-course-body p{margin:0 0 12px;color:var(--dash-muted);font-size:9px;line-height:1.5}
      .purchased-course-actions{display:flex;gap:8px;flex-wrap:wrap}
      .purchased-course-actions .button{flex:1 1 auto;justify-content:center}

      .course-hub-hero{
        display:grid;grid-template-columns:180px minmax(0,1fr) auto;gap:18px;align-items:center;
        padding:20px;border:1px solid var(--dash-border);border-radius:18px;background:var(--dash-surface)
      }
      .course-hub-image{height:112px;border-radius:13px;overflow:hidden;background:var(--dash-soft)}
      .course-hub-image img{width:100%;height:100%;object-fit:cover}
      .course-hub-copy h2{margin:4px 0 7px;color:var(--dash-ink);font-size:21px}
      .course-hub-copy p{margin:0;color:var(--dash-muted);font-size:10px;line-height:1.6}
      .course-hub-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}

      .course-hub-live-banner{
        margin-top:16px;padding:14px 16px;display:grid;
        grid-template-columns:42px minmax(0,1fr) auto;gap:12px;align-items:center;
        border:1px solid var(--dash-border);border-radius:14px;background:var(--dash-soft)
      }
      .course-hub-live-banner .classroom-row-icon{margin:0}
      .course-hub-live-banner strong{display:block;color:var(--dash-ink);font-size:11px}
      .course-hub-live-banner small{display:block;margin-top:3px;color:var(--dash-muted);font-size:8px}
      .course-hub-section{margin-top:18px}

      @media(max-width:1180px){
        .yt-live-layout{grid-template-columns:minmax(0,1fr) 310px}
        .purchased-course-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:930px){
        .yt-live-layout{grid-template-columns:1fr}
        .yt-recording-side{height:360px}
        .yt-stage-media,.yt-stage-media iframe{min-height:600px;height:600px}
        .course-hub-hero{grid-template-columns:130px minmax(0,1fr)}
        .course-hub-actions{grid-column:1/-1;justify-content:flex-start}
      }
      @media(max-width:620px){
        .yt-stage-media,.yt-stage-media iframe{min-height:560px;height:560px}
        .yt-stage-placeholder{padding:22px 16px}
        .yt-stage-placeholder h2{font-size:22px}
        .yt-stage-caption{align-items:flex-start;flex-direction:column}
        .yt-stage-actions{justify-content:flex-start}
        .purchased-course-grid{grid-template-columns:1fr}
        .course-hub-hero{grid-template-columns:1fr}
        .course-hub-image{height:170px}
        .course-hub-live-banner{grid-template-columns:38px minmax(0,1fr)}
        .course-hub-live-banner .button{grid-column:2;width:max-content}
      }
    `;
    document.head.appendChild(style);
  }


  function ensureLiveV82Styles(){
    if(document.getElementById('fsaLiveV82Styles'))return;
    const style=document.createElement('style');
    style.id='fsaLiveV82Styles';
    style.textContent=`
      /* YouTube-style theater: exact 16:9 player + independently scrolling rail */
      .yt-live-layout{
        grid-template-columns:minmax(0,1fr) 370px!important;
        align-items:start!important;
        gap:16px!important;
      }
      .yt-live-stage{overflow:hidden!important}
      .yt-stage-media{
        width:100%!important;
        aspect-ratio:16/9!important;
        height:auto!important;
        min-height:0!important;
        max-height:none!important;
        overflow:hidden!important;
        border-radius:16px 16px 0 0!important;
        background:#0b0b0b!important;
      }
      .yt-stage-media>iframe,
      .yt-stage-media>video,
      .yt-recording-embed{
        display:block!important;
        width:100%!important;
        height:100%!important;
        min-height:0!important;
        max-height:none!important;
        border:0!important;
        border-radius:0!important;
        background:#000!important;
        object-fit:contain!important;
      }
      .yt-stage-placeholder{border-radius:0!important}
      .yt-recording-side{
        height:560px;
        min-height:0!important;
        max-height:none!important;
      }
      .yt-recording-list{padding:7px!important}
      button.yt-recording-item{
        width:100%;
        border:0;
        font:inherit;
        text-align:left;
        cursor:pointer;
        background:transparent;
      }
      .yt-recording-item.is-active{
        background:var(--dash-soft)!important;
        box-shadow:inset 3px 0 0 var(--dash-brand);
      }
      .yt-live-rail-item{
        position:relative;
        margin-bottom:5px;
        border-bottom:1px solid var(--dash-border)!important;
        border-radius:11px!important;
      }
      .yt-live-rail-item .yt-recording-thumb{
        display:grid;
        place-items:center;
        background:linear-gradient(135deg,#c91d3a,var(--dash-brand-deep));
        color:#fff;
      }
      .yt-live-rail-badge{
        position:absolute;
        left:5px;
        bottom:5px;
        z-index:3;
        padding:3px 5px;
        border-radius:4px;
        background:#e11937;
        color:#fff;
        font-size:6px;
        font-weight:900;
        letter-spacing:.08em;
      }
      .yt-recording-thumb .yt-duration-badge{
        position:absolute;
        right:5px;
        bottom:5px;
        z-index:3;
        padding:3px 5px;
        border-radius:4px;
        background:rgba(0,0,0,.78);
        color:#fff;
        font-size:6px;
        font-weight:800;
      }
      .yt-playlist-head{
        padding:13px 14px 11px!important;
      }
      .yt-playlist-head-row{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:8px;
      }
      .yt-stage-caption{
        min-height:68px;
        padding:12px 15px!important;
      }
      .yt-stage-caption .status-pill{margin-left:6px}
      .yt-recording-player-note{
        position:absolute;
        left:14px;
        bottom:14px;
        z-index:5;
        max-width:calc(100% - 28px);
        padding:7px 10px;
        border-radius:8px;
        background:rgba(0,0,0,.72);
        color:#fff;
        font-size:8px;
        pointer-events:none;
      }

      @media(max-width:1180px){
        .yt-live-layout{grid-template-columns:minmax(0,1fr) 320px!important}
      }
      @media(max-width:930px){
        .yt-live-layout{grid-template-columns:1fr!important}
        .yt-stage-media{aspect-ratio:16/9!important;height:auto!important;min-height:0!important}
        .yt-stage-media>iframe,.yt-stage-media>video{height:100%!important;min-height:0!important}
        .yt-recording-side{height:360px!important}
      }
      @media(max-width:620px){
        .yt-stage-media{aspect-ratio:16/9!important;height:auto!important;min-height:0!important}
        .yt-stage-media>iframe,.yt-stage-media>video{height:100%!important;min-height:0!important}
        .yt-recording-side{height:330px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function syncLiveTheaterRailHeight(){
    const mobile=window.matchMedia('(max-width: 930px)').matches;
    document.querySelectorAll('.yt-live-layout').forEach(layout=>{
      const stage=layout.querySelector('.yt-live-stage');
      const rail=layout.querySelector('.yt-recording-side');
      if(!stage||!rail)return;
      if(mobile){
        rail.style.removeProperty('height');
        return;
      }
      const height=Math.max(320,Math.round(stage.getBoundingClientRect().height));
      rail.style.setProperty('height',`${height}px`,'important');
    });
  }

  function scheduleLiveTheaterRailSync(){
    syncLiveTheaterRailHeight();
    requestAnimationFrame(syncLiveTheaterRailHeight);
    setTimeout(syncLiveTheaterRailHeight,80);
    setTimeout(syncLiveTheaterRailHeight,350);
  }

  function selectedTheaterRecordingId(mode){
    return mode==='host'
      ? Number(state.selectedInstructorRecordingId||0)
      : Number(state.selectedStudentRecordingId||0);
  }

  function recordingEmbedInfo(url){
    const raw=String(url||'').trim();
    if(!raw)return {kind:'none',url:''};

    try{
      const parsed=new URL(raw,location.href);
      const host=parsed.hostname.toLowerCase();

      if(host.includes('youtube.com')){
        const id=parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
        if(id)return {kind:'iframe',url:`https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&autoplay=1`};
      }
      if(host==='youtu.be'||host.endsWith('.youtu.be')){
        const id=parsed.pathname.split('/').filter(Boolean)[0];
        if(id)return {kind:'iframe',url:`https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&autoplay=1`};
      }
      if(host.includes('vimeo.com')){
        const id=parsed.pathname.split('/').filter(Boolean).find(x=>/^\d+$/.test(x));
        if(id)return {kind:'iframe',url:`https://player.vimeo.com/video/${id}?autoplay=1`};
      }

      const path=parsed.pathname.toLowerCase();
      if(/\.(mp4|webm|ogg|m4v|mov)$/.test(path)){
        return {kind:'video',url:parsed.href};
      }

      // Zoom play_url/share_url and other hosted players are attempted in an iframe.
      return {kind:'iframe',url:parsed.href};
    }catch(e){
      return {kind:'iframe',url:raw};
    }
  }

  function recordingStageMediaMarkup(recording){
    const info=recordingEmbedInfo(recording?.recording_url);
    if(info.kind==='video'){
      return `<div class="yt-stage-media" id="inlineLiveStage">
        <video controls autoplay playsinline preload="metadata" src="${escapeHtml(info.url)}"></video>
      </div>`;
    }
    if(info.kind==='iframe'){
      return `<div class="yt-stage-media" id="inlineLiveStage">
        <iframe class="yt-recording-embed" src="${escapeHtml(info.url)}" title="${escapeHtml(recording?.title||'Recorded lecture')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>`;
    }
    return `<div class="yt-stage-media" id="inlineLiveStage"><div class="yt-stage-placeholder"><div class="yt-stage-placeholder-inner">
      <span class="yt-stage-live-dot">${icon('play')}</span><span class="eyebrow">RECORDED CLASS</span>
      <h2>${escapeHtml(recording?.title||'Recording')}</h2><p>The recording is still processing.</p>
    </div></div></div>`;
  }



  function ensureLiveV83Styles(){
    if(document.getElementById('fsaLiveV83Styles'))return;
    const style=document.createElement('style');
    style.id='fsaLiveV83Styles';
    style.textContent=`
      /* -------------------------------------------------------------
         v83: final alignment pass for Live Classes.
         These rules intentionally use their own classes + !important
         so older/global theme CSS cannot stretch the controls.
         ------------------------------------------------------------- */

      body[data-mode="dashboard"] .dashboard-content{
        min-width:0!important;
        overflow-x:clip!important;
      }
      body[data-mode="dashboard"] .live-learning-stack{
        min-width:0!important;
        width:100%!important;
      }

      /* Instructor top workspace */
      .live-workspace-toolbar{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) auto!important;
        align-items:center!important;
        gap:24px!important;
        width:100%!important;
        min-width:0!important;
        padding:20px 22px!important;
        border:1px solid var(--dash-border)!important;
        border-radius:17px!important;
        background:var(--dash-surface)!important;
        box-shadow:0 8px 28px rgba(35,20,24,.04)!important;
      }
      .live-workspace-copy{
        min-width:0!important;
      }
      .live-workspace-copy p{
        max-width:760px!important;
        margin:7px 0 0!important;
        color:var(--dash-muted)!important;
        font-size:10px!important;
        line-height:1.6!important;
      }
      .live-workspace-actions{
        display:flex!important;
        flex-direction:row!important;
        align-items:center!important;
        justify-content:flex-end!important;
        flex-wrap:nowrap!important;
        gap:10px!important;
        width:auto!important;
        min-width:max-content!important;
      }
      .live-workspace-actions .button{
        width:auto!important;
        min-width:0!important;
        max-width:none!important;
        min-height:44px!important;
        height:44px!important;
        margin:0!important;
        padding:0 18px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 auto!important;
        white-space:nowrap!important;
        line-height:1!important;
      }
      .live-workspace-actions .button svg{
        width:15px!important;
        height:15px!important;
        flex:0 0 15px!important;
      }

      /* Course filter: no detached arrow / no giant empty flex area */
      .live-course-filterbar{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(320px,420px)!important;
        align-items:center!important;
        justify-content:stretch!important;
        gap:22px!important;
        width:100%!important;
        min-width:0!important;
        padding:18px 22px!important;
      }
      .live-course-filterbar>div:first-child{
        min-width:0!important;
        max-width:620px!important;
      }
      .live-course-filterbar h3{
        margin:0 0 5px!important;
        font-size:15px!important;
      }
      .live-course-filterbar p{
        margin:0!important;
        font-size:9px!important;
        line-height:1.55!important;
      }
      .live-course-select-wrap{
        position:relative!important;
        width:100%!important;
        min-width:0!important;
        max-width:420px!important;
        justify-self:end!important;
      }
      .live-course-select-wrap select.form-control{
        box-sizing:border-box!important;
        display:block!important;
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        height:48px!important;
        margin:0!important;
        padding:0 40px 0 14px!important;
        border-radius:12px!important;
        background-color:var(--dash-surface)!important;
        background-image:none!important;
        appearance:auto!important;
        -webkit-appearance:auto!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }

      /* YouTube player / right rail */
      .yt-live-layout{
        width:100%!important;
        min-width:0!important;
        grid-template-columns:minmax(0,1fr) minmax(300px,360px)!important;
        gap:16px!important;
      }
      .yt-live-stage,
      .yt-recording-side{
        min-width:0!important;
      }
      .yt-stage-media{
        width:100%!important;
        aspect-ratio:16/9!important;
        height:auto!important;
        min-height:0!important;
        max-height:none!important;
      }
      .yt-stage-media iframe,
      .yt-stage-media video{
        width:100%!important;
        height:100%!important;
        min-height:0!important;
        max-height:none!important;
      }

      /* Header badge on right must stay a small circle, never a full row */
      .yt-playlist-head-row{
        display:flex!important;
        flex-direction:row!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        gap:10px!important;
      }
      .yt-playlist-head-row>div:first-child{
        min-width:0!important;
        flex:1 1 auto!important;
      }
      .yt-playlist-head .live-learning-count{
        width:28px!important;
        min-width:28px!important;
        max-width:28px!important;
        height:28px!important;
        min-height:28px!important;
        flex:0 0 28px!important;
        margin:0!important;
        padding:0!important;
        border-radius:50%!important;
        display:grid!important;
        place-items:center!important;
      }

      .yt-recording-item{
        width:100%!important;
        min-width:0!important;
      }

      /* Keep desktop sidebar/main from being shifted by horizontal overflow */
      @media(min-width:901px){
        body[data-mode="dashboard"] .dashboard-sidebar{
          left:0!important;
          transform:none!important;
        }
        body[data-mode="dashboard"] .dashboard-main{
          overflow-x:clip!important;
        }
      }

      @media(max-width:1180px){
        .live-workspace-toolbar{
          grid-template-columns:minmax(0,1fr)!important;
          align-items:start!important;
        }
        .live-workspace-actions{
          justify-content:flex-start!important;
          min-width:0!important;
          flex-wrap:wrap!important;
        }
        .yt-live-layout{
          grid-template-columns:minmax(0,1fr) 310px!important;
        }
      }

      @media(max-width:930px){
        .live-course-filterbar{
          grid-template-columns:1fr!important;
          gap:14px!important;
        }
        .live-course-select-wrap{
          max-width:none!important;
          justify-self:stretch!important;
        }
        .yt-live-layout{
          grid-template-columns:1fr!important;
        }
      }

      @media(max-width:620px){
        .live-workspace-toolbar{
          padding:16px!important;
        }
        .live-workspace-actions{
          display:grid!important;
          grid-template-columns:1fr!important;
          width:100%!important;
        }
        .live-workspace-actions .button{
          width:100%!important;
        }
        .live-course-filterbar{
          padding:16px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }



  function ensureLiveV89Styles(){
    if(document.getElementById('fsaLiveV89Styles'))return;
    const style=document.createElement('style');
    style.id='fsaLiveV89Styles';
    style.textContent=`
      /* v89: let native Zoom Client View use a real meeting-sized viewport.
         Recordings stay 16:9; only an active Zoom room becomes tall. */
      .yt-live-layout.has-zoom-room{
        align-items:start!important;
      }
      .yt-stage-media.is-zoom-room{
        aspect-ratio:auto!important;
        height:clamp(620px,calc(100dvh - 165px),860px)!important;
        min-height:620px!important;
        max-height:860px!important;
        overflow:hidden!important;
        border-radius:16px 16px 0 0!important;
        background:#000!important;
      }
      .yt-stage-media.is-zoom-room>iframe{
        display:block!important;
        width:100%!important;
        height:100%!important;
        min-height:100%!important;
        max-height:none!important;
        border:0!important;
        border-radius:0!important;
        background:#000!important;
      }
      .yt-live-layout.has-zoom-room .yt-recording-side{
        min-height:620px!important;
      }
      @media(max-width:930px){
        .yt-stage-media.is-zoom-room{
          height:clamp(620px,82dvh,820px)!important;
          min-height:620px!important;
        }
        .yt-live-layout.has-zoom-room .yt-recording-side{
          min-height:0!important;
          height:360px!important;
        }
      }
      @media(max-width:620px){
        .yt-stage-media.is-zoom-room{
          height:max(620px,82dvh)!important;
          min-height:620px!important;
          border-radius:12px 12px 0 0!important;
        }
        .yt-live-layout.has-zoom-room .yt-recording-side{
          height:330px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function dbRecordingPlaylistMarkup(recordings, mode='student', liveItem=null, selectedRecordingId=0, selectedLiveId=0){
    const list=[...(recordings||[])].sort((a,b)=>new Date(b.recorded_at||b.created_at||0)-new Date(a.recorded_at||a.created_at||0));
    const host=mode==='host';
    const head=`<div class="yt-playlist-head"><div class="yt-playlist-head-row"><div><span class="eyebrow">Up next</span><h3>Live & recordings</h3><p>Live stays on top · newest recording first</p></div><span class="live-learning-count">${list.length+(liveItem?1:0)}</span></div></div>`;

    const liveRow=liveItem && liveStatus(liveItem)==='live'
      ? `<button class="yt-recording-item yt-live-rail-item ${Number(selectedLiveId||0)===Number(liveItem.id)&&!selectedRecordingId?'is-active':''}" type="button" data-action="live-theater-live" data-mode="${host?'host':'student'}" data-id="${liveItem.id}">
          <span class="yt-recording-thumb">${icon('radio')}<span class="yt-live-rail-badge">LIVE</span></span>
          <span><strong>${escapeHtml(liveItem.title||'Live Class')}</strong><small>${escapeHtml(liveItem.course_title||'Course')}<br>${host?'Open Zoom studio':'Join Live classroom'}</small></span>
        </button>`
      : '';

    const rows=list.map(item=>{
      const url=String(item.recording_url||'').trim();
      const active=Number(selectedRecordingId||0)===Number(item.id||0);
      const thumb=item.course_image
        ? imageMarkup(item.course_image,item.title||'Recorded lecture',initials(item.title||'RL'))
        : `<span class="yt-recording-thumb-fallback">${icon('play')}</span>`;
      const body=`<span class="yt-recording-thumb">${thumb}<span class="yt-duration-badge">REC</span></span><span><strong>${escapeHtml(item.title||'Recorded Class')}</strong><small>${escapeHtml(item.course_title||'Course')}<br>${item.recorded_at?classroomDate(item.recorded_at):'Recording processing'}</small></span>`;
      return url
        ? `<button class="yt-recording-item ${active?'is-active':''}" type="button" data-action="live-theater-recording" data-mode="${host?'host':'student'}" data-id="${item.id}">${body}</button>`
        : `<div class="yt-recording-item" title="Recording is processing">${body}</div>`;
    }).join('');

    const empty=!liveRow&&!rows
      ? `<div class="yt-recording-empty">${host?'Ended classes will appear here automatically after recording processing.':'Every course recording appears here; processing items become playable automatically when ready.'}</div>`
      : '';

    return `<aside class="yt-recording-side">${head}<div class="yt-recording-list">${liveRow}${rows}${empty}</div></aside>`;
  }

  function liveTheaterMarkup({liveItem=null,nextItem=null,mode='student',recordings=[],selectedId=0,selectedRecordingId=0}={}){
    const host=mode==='host';
    const isLive=!!liveItem && liveStatus(liveItem)==='live';
    const selectedRecording=(recordings||[]).find(r=>Number(r.id)===Number(selectedRecordingId||0) && String(r.recording_url||'').trim())||null;
    const selectedLive=isLive && Number(selectedId||0)===Number(liveItem.id);
    const candidate=isLive?liveItem:nextItem;
    const timing=candidate?liveTiming(candidate):null;
    let media='';
    let caption='';

    if(selectedRecording){
      media=recordingStageMediaMarkup(selectedRecording);
      caption=`<div class="yt-stage-caption">
        <div><strong>${escapeHtml(selectedRecording.title||'Recorded Class')} <span class="status-pill">RECORDED</span></strong><small>${escapeHtml(selectedRecording.course_title||'Course')} · ${selectedRecording.recorded_at?classroomDate(selectedRecording.recorded_at):'Recorded lecture'}</small></div>
        <div class="yt-stage-actions">
          ${isLive?`<button class="button button-primary button-sm" type="button" data-action="live-theater-live" data-mode="${host?'host':'student'}" data-id="${liveItem.id}">${icon('radio')} ${host?'Return to Live Studio':'Return to Live'}</button>`:''}
          <a class="button button-secondary button-sm" href="${escapeHtml(selectedRecording.recording_url)}" target="_blank" rel="noopener noreferrer">Open Source</a>
        </div>
      </div>`;
    }else{
      if(isLive && selectedLive){
        media=`<div class="yt-stage-media is-zoom-room" id="inlineLiveStage">
          <iframe src="zoom-room.php?live_id=${encodeURIComponent(liveItem.id)}&mode=${host?'host':'student'}&v=90" title="Full Stack Academy Zoom Classroom" allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-read; clipboard-write" allowfullscreen loading="eager" referrerpolicy="same-origin"></iframe>
        </div>`;
      }else if(isLive){
        media=`<div class="yt-stage-media" id="inlineLiveStage"><div class="yt-stage-placeholder"><div class="yt-stage-placeholder-inner">
          <span class="yt-stage-live-dot">${icon('radio')}</span><span class="eyebrow">LIVE NOW</span>
          <h2>${escapeHtml(liveItem.title||'Live Class')}</h2>
          <p>${escapeHtml(liveItem.course_title||'Course')} · ${classroomDate(liveItem.starts_at)}${liveItem.instructor_name?` · ${escapeHtml(liveItem.instructor_name)}`:''}</p>
          <button class="button button-primary" type="button" data-action="${host?'instructor-inline-class':'student-inline-class'}" data-id="${liveItem.id}">${icon('video')} ${host?'Open Zoom Studio':'Join Live Class'}</button>
        </div></div></div>`;
      }else if(candidate){
        const canStart=host && timing?.canStart;
        media=`<div class="yt-stage-media" id="inlineLiveStage"><div class="yt-stage-placeholder"><div class="yt-stage-placeholder-inner">
          <span class="yt-stage-live-dot">${icon(canStart?'video':'clock')}</span><span class="eyebrow">${canStart?'READY TO START':'NEXT LIVE CLASS'}</span>
          <h2>${escapeHtml(candidate.title||'Upcoming Live Class')}</h2>
          <p>${escapeHtml(candidate.course_title||'Course')} · ${classroomDate(candidate.starts_at)}</p>
          ${canStart
            ? `<button class="button button-primary" type="button" data-action="instructor-live-start" data-id="${candidate.id}">${icon('video')} Start Live Class</button>`
            : `<div class="yt-countdown"><strong data-live-countdown="${escapeHtml(candidate.starts_at||'')}">${countdownText(candidate.starts_at)}</strong></div><p style="margin-top:-8px">until the scheduled class starts</p>`}
        </div></div></div>`;
      }else{
        media=`<div class="yt-stage-media" id="inlineLiveStage"><div class="yt-stage-placeholder"><div class="yt-stage-placeholder-inner">
          <span class="yt-stage-live-dot">${icon('calendar')}</span><span class="eyebrow">LIVE CLASSROOM</span>
          <h2>No class scheduled yet</h2><p>${host?'Use Schedule Class / Month to create your next Live lecture.':'Your instructor has not scheduled another Live class yet.'}</p>
        </div></div></div>`;
      }

      const captionItem=liveItem||nextItem;
      caption=captionItem?`<div class="yt-stage-caption"><div><strong>${escapeHtml(captionItem.title||'Live Class')}</strong><small>${escapeHtml(captionItem.course_title||'Course')} · ${classroomDate(captionItem.starts_at)}</small></div><div class="yt-stage-actions">
        ${host&&isLive?`<button class="button button-secondary button-sm" type="button" data-action="instructor-live-finalize" data-id="${liveItem.id}">End & Finalize Recording</button>`:''}
        ${host&&captionItem&&!isLive?`<button class="button button-secondary button-sm" type="button" data-action="instructor-live-edit" data-id="${captionItem.id}">Edit Schedule</button>`:''}
      </div></div>`:'';
    }

    const zoomMounted=!!(isLive && selectedLive && !selectedRecording);
    return `<div class="yt-live-layout ${zoomMounted?'has-zoom-room':''}"><section class="yt-live-stage">${media}${caption}</section>${dbRecordingPlaylistMarkup(recordings,host?'host':'student',liveItem,selectedRecording?.id||0,selectedLive?liveItem?.id||0:0)}</div>`;
  }


  function ensureStudentCoursesV84Styles(){
    if(document.getElementById('fsaStudentCoursesV95Styles'))return;
    const style=document.createElement('style');
    style.id='fsaStudentCoursesV95Styles';
    style.textContent=`
      /* v95 — student course library. These styles/functions were referenced by
         the v84+ dashboard but were missing from the bundle, which caused the
         My Courses route to stop before rendering. */
      .student-courses-overview{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:12px;
        margin-bottom:16px;
      }
      .student-courses-stat{
        min-width:0;
        padding:15px 16px;
        border:1px solid var(--dash-border);
        border-radius:14px;
        background:var(--dash-surface);
        box-shadow:0 8px 24px rgba(49,27,32,.035);
      }
      .student-courses-stat>span,
      .student-courses-stat>small{display:block;color:var(--dash-muted);font-size:8px;font-weight:700}
      .student-courses-stat>strong{display:block;margin:5px 0 3px;color:var(--dash-ink);font-size:24px;line-height:1}
      .student-course-toolbar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
        margin-bottom:15px;
        padding:10px;
        border:1px solid var(--dash-border);
        border-radius:14px;
        background:var(--dash-surface);
      }
      .student-course-toolbar .segmented-tabs{min-width:0;overflow-x:auto;scrollbar-width:none}
      .student-course-toolbar .segmented-tabs::-webkit-scrollbar{display:none}
      .student-course-toolbar .segmented-tabs button{white-space:nowrap}
      .student-course-count{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:var(--dash-soft);color:var(--dash-brand);font-size:8px;font-weight:900}
      .student-course-library-grid{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:15px;
      }
      .student-purchased-course-card{
        min-width:0;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        border:1px solid var(--dash-border);
        border-radius:16px;
        background:var(--dash-surface);
        box-shadow:0 10px 28px rgba(49,27,32,.045);
        transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
      }
      .student-purchased-course-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--dash-brand) 22%,var(--dash-border));box-shadow:0 15px 34px rgba(49,27,32,.075)}
      .student-purchased-course-media{position:relative;height:146px;overflow:hidden;background:var(--dash-soft-2)}
      .student-purchased-course-media img{width:100%;height:100%;object-fit:cover;display:block}
      .student-purchased-course-media .avatar{width:100%;height:100%;display:grid;place-items:center;border-radius:0;font-size:30px}
      .student-course-status-badge{position:absolute;left:11px;top:11px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.94);color:var(--dash-brand);font-size:7px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;box-shadow:0 4px 12px rgba(0,0,0,.08)}
      .student-course-status-badge.live{background:var(--dash-brand);color:#fff}
      .student-purchased-course-body{flex:1 1 auto;display:flex;flex-direction:column;padding:15px}
      .student-purchased-course-body h3{margin:5px 0 6px;color:var(--dash-ink);font-size:15px;line-height:1.35}
      .student-purchased-course-body>p{min-height:34px;margin:0 0 11px;color:var(--dash-muted);font-size:8.5px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .student-course-mode-row{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
      .student-course-mode-row span{padding:5px 7px;border-radius:999px;background:var(--dash-soft);color:var(--dash-brand);font-size:7px;font-weight:900}
      .student-course-progress-line{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:3px 0 7px;color:var(--dash-muted);font-size:8px;font-weight:800}
      .student-course-progress-line strong{color:var(--dash-ink);font-size:9px}
      .student-course-meta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:11px 0}
      .student-course-meta-grid span{display:flex;align-items:center;gap:6px;min-width:0;padding:8px;border-radius:10px;background:var(--dash-soft-2);color:var(--dash-muted);font-size:7.5px;font-weight:750}
      .student-course-meta-grid svg{width:12px;height:12px;flex:0 0 12px;color:var(--dash-brand)}
      .student-course-card-actions{display:flex;gap:7px;margin-top:auto;padding-top:3px}
      .student-course-card-actions .button{flex:1 1 auto;min-width:0!important;justify-content:center!important}
      .student-purchased-course-card.is-compact .student-purchased-course-media{height:112px}
      .student-purchased-course-card.is-compact .student-purchased-course-body{padding:12px}
      .student-purchased-course-card.is-compact .student-purchased-course-body>p{display:none}
      .student-courses-empty{padding:42px 18px;text-align:center;border:1px dashed var(--dash-border-strong);border-radius:16px;background:var(--dash-surface)}
      .student-courses-empty h3{margin:10px 0 5px;color:var(--dash-ink)}
      .student-courses-empty p{margin:0 auto 15px;max-width:520px;color:var(--dash-muted);font-size:9px;line-height:1.6}
      @media(max-width:1180px){.student-courses-overview{grid-template-columns:repeat(2,minmax(0,1fr))}.student-course-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){.student-course-toolbar{align-items:stretch;flex-direction:column}.student-course-count{align-self:flex-start}.student-course-library-grid{grid-template-columns:1fr}}
      @media(max-width:480px){.student-courses-overview{grid-template-columns:1fr 1fr}.student-courses-stat{padding:12px}.student-courses-stat>strong{font-size:20px}}
    `;
    document.head.appendChild(style);
  }

  function studentEnrollmentForCourse(courseId,preferredMode=''){
    const id=Number(courseId||0),mode=String(preferredMode||'').toLowerCase();
    const rows=(state.studentEnrollmentRows||[]).filter(e=>Number(e.course_id)===id&&['active','completed'].includes(String(e.status||''))&&e.access_allowed!==false);
    if(mode){const exact=rows.find(e=>String(e.delivery_mode||'').toLowerCase()===mode);if(exact)return exact;}
    return rows[0]||null;
  }

  function studentRecordedCourseEntry(courseId){
    const rows=(state.studentRecordedLectures||[]).filter(x=>Number(x.course_id)===Number(courseId)).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||Number(a.id)-Number(b.id));
    const next=nextRecordedLecture(rows)||rows[0]||null;
    return `#/recorded-lectures/${Number(courseId)}/${Number(next?.id||0)}`;
  }

  function studentCourseWorkspaceData(course,enrollmentOverride=null){
    const courseId=Number(course?.id||0);
    const delivery=courseDelivery(course||{});
    const enrollment=enrollmentOverride||studentEnrollmentForCourse(courseId);
    const purchasedMode=String(enrollment?.delivery_mode||'');
    const liveRows=uniqueStudentLiveRows(studentLiveRows()).filter(item=>Number(item?.course_id||0)===courseId);
    const recordings=(Array.isArray(state.studentRecordings)?state.studentRecordings:[]).filter(item=>Number(item?.course_id||0)===courseId);
    const recordedLectures=(state.studentRecordedLectures||[]).filter(item=>Number(item?.course_id||0)===courseId);
    const live=liveRows.filter(item=>liveStatus(item)==='live').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0))[0]||null;
    const upcoming=liveRows.filter(item=>liveStatus(item)==='scheduled').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0));
    const ended=liveRows.filter(item=>liveStatus(item)==='ended');
    const percent=purchasedMode==='recorded'?recordedCourseProgress(recordedLectures):progressPercent(courseId);
    return {
      delivery,enrollment,purchasedMode,recordedLectures,liveRows,recordings,live,upcoming,ended,percent,
      isLiveCourse:purchasedMode==='live',
      isRecordedCourse:purchasedMode==='recorded',
      isOfflineCourse:purchasedMode==='offline',
      completed:percent>=100
    };
  }

  function studentPurchasedCourseCardMarkup(course,{compact=false,enrollment=null}={}){
    const data=studentCourseWorkspaceData(course,enrollment);
    const slug=String(course?.slug||'').trim();
    const courseId=Number(course?.id||0);
    const progress=Math.max(0,Math.min(100,Number(data.percent||0)));
    const readyRecordings=data.recordings.filter(item=>String(item?.recording_url||'').trim()).length;
    const processingRecordings=Math.max(0,data.recordings.length-readyRecordings);
    const lessonCount=allLessonKeys(course||{}).length;
    const doneCount=completedLessons(courseId);
    const taskCount=(state.studentCoursework||[]).filter(item=>Number(item?.course_id||0)===courseId).length;
    const recordedDone=data.recordedLectures.filter(x=>x.completed).length;
    const modeLabel=data.isRecordedCourse?'Recorded':data.isLiveCourse?'Live':'Offline / Physical';
    const badge=data.live?'Live now':data.completed?'Completed':progress>0?'In progress':'Active';
    const next=data.upcoming[0]||null;
    const openHref=data.isRecordedCourse
      ? studentRecordedCourseEntry(courseId)
      : data.isLiveCourse
        ? '#/live-classes'
        : (slug?`#/learn/${encodeURIComponent(slug)}`:'#/my-courses');
    const openLabel=data.isRecordedCourse?'Open Recorded Course':data.isLiveCourse?'Open Live Course':'Open Physical Course';
    let metaItems='';
    if(data.isRecordedCourse){
      metaItems=`<span>${icon('play')} ${data.recordedLectures.length} lecture${data.recordedLectures.length===1?'':'s'}</span><span>${icon('check')} ${recordedDone} completed</span><span>${icon('note')} ${taskCount} task${taskCount===1?'':'s'}</span><span>${icon('book')} Recorded access</span>`;
    }else if(data.isLiveCourse){
      metaItems=`<span>${icon('radio')} ${data.liveRows.length} class${data.liveRows.length===1?'':'es'}</span><span>${icon('play')} ${readyRecordings} recording${readyRecordings===1?'':'s'}${processingRecordings?` · ${processingRecordings} processing`:''}</span>${next?`<span>${icon('calendar')} ${escapeHtml(classroomDate(next.starts_at))}</span>`:`<span>${icon('calendar')} No upcoming class</span>`}<span>${icon('note')} ${taskCount} task${taskCount===1?'':'s'}</span>`;
    }else{
      metaItems=`<span>${icon('book')} ${doneCount}${lessonCount?` / ${lessonCount}`:''} lessons</span><span>${icon('check')} ${progress}% complete</span><span>${icon('note')} ${taskCount} task${taskCount===1?'':'s'}</span><span>${icon('users')} Physical classroom</span>`;
    }
    return `<article class="student-purchased-course-card ${compact?'is-compact':''}">
      <div class="student-purchased-course-media">
        ${imageMarkup(course?.image,`${course?.title||'Course'} course`,initials(course?.title||'Course'))}
        <span class="student-course-status-badge ${data.live?'live':''}">${escapeHtml(badge)}</span>
      </div>
      <div class="student-purchased-course-body">
        <div class="student-course-card-heading"><span class="course-category">${escapeHtml(course?.category||'Full Stack Academy')}</span><span class="student-purchase-mode mode-${escapeHtml(String(data.purchasedMode||'offline'))}">${escapeHtml(modeLabel)}</span></div>
        <h3>${escapeHtml(course?.title||'Course')}</h3>
        <p>${escapeHtml(course?.short||course?.description||'Your private learning workspace with course content and assessments.')}</p>
        <div class="student-course-progress-line"><span>${escapeHtml(modeLabel)} progress</span><strong>${progress}%</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div class="student-course-meta-grid">${metaItems}</div>
        <div class="student-course-card-actions"><a class="button button-primary button-sm" href="${openHref}">${icon(data.isRecordedCourse?'play':data.isLiveCourse?'radio':'book')} ${openLabel}</a></div>
      </div>
    </article>`;
  }

  function purchasedCourseGridMarkup(courses){
    ensureStudentCoursesV84Styles();
    const list=(courses||[]).filter(Boolean);
    if(!list.length)return `<div class="live-learning-empty"><span class="empty-icon">${icon('book')}</span><h3>No active purchased courses</h3><p>Your activated course purchases will appear here automatically from the backend.</p></div>`;
    return `<div class="student-course-library-grid">${list.map(course=>studentPurchasedCourseCardMarkup(course,{compact:true})).join('')}</div>`;
  }

  function openInstructorLiveFinalizeForm(item){
    if(!item)return;
    const existing=(state.instructorData.recordings||[]).find(r=>Number(r.live_session_id)===Number(item.id));
    openClassroomModal(
      'End class & finalize recording',
      'Confirm the lecture details. If Zoom Cloud Recording is available, the LMS will try to sync it automatically. You can also paste a video URL now.',
      `<form id="instructorLiveFinalizeForm" class="auth-form">
        <input type="hidden" name="id" value="${Number(item.id)}">
        <div class="form-grid">
          <div class="form-group full"><label>Course</label><input class="form-control" value="${escapeHtml(item.course_title||'Course')}" readonly></div>
          <div class="form-group full"><label>Recorded lecture title</label><input class="form-control" name="title" required value="${escapeHtml(existing?.title||item.title||'Recorded Live Class')}"></div>
          <div class="form-group full"><label>Short description</label><textarea class="form-control" name="description" rows="4" placeholder="What was covered in this lecture?">${escapeHtml(existing?.description||item.description||'')}</textarea></div>
          <div class="form-group full"><label>Video / recording URL <small>Optional if Zoom Cloud Recording will sync automatically.</small></label><input class="form-control" type="url" name="recording_url" value="${escapeHtml(existing?.recording_url||item.recording_url||'')}" placeholder="https://..."></div>
          <div class="form-group full"><div class="alert-card"><strong>What happens next?</strong><p>The class is marked ended, this recording is saved to MySQL, and the newest recording appears first for students who own this course. If URL is blank, Zoom sync stays in Processing until a cloud recording is available.</p></div></div>
        </div>
        <button class="button button-primary button-block" type="submit">End Class & Save Recording</button>
      </form>`
    );
  }

  function liveCourseFilterValue(mode){
    if(!state.liveCourseFilters)state.liveCourseFilters={student:'all',instructor:'all',recordings:'all'};
    return String(state.liveCourseFilters[mode]??'all');
  }

  function liveCourseOptions(mode, rows=[], recordings=[]){
    const map=new Map();
    if(mode==='instructor'){
      instructorCourses().forEach(c=>map.set(Number(c.id),c.title));
    }else{
      enrolledCourses().forEach(c=>{if(Number(c.id))map.set(Number(c.id),c.title)});
      (rows||[]).forEach(x=>{if(Number(x.course_id))map.set(Number(x.course_id),x.course_title||`Course ${x.course_id}`)});
      (recordings||[]).forEach(x=>{if(Number(x.course_id))map.set(Number(x.course_id),x.course_title||`Course ${x.course_id}`)});
    }
    return [...map.entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1])));
  }

  function liveCourseFilterMarkup(mode, rows=[], recordings=[]){
    const value=liveCourseFilterValue(mode);
    const options=liveCourseOptions(mode,rows,recordings);
    return `<div class="live-course-filterbar">
      <div><h3>Select course</h3><p>Choose one course to see its Live classroom, recordings and upcoming schedule.</p></div>
      <div class="live-course-select-wrap">
        <select class="form-control" data-role="live-course-filter" data-mode="${mode}" aria-label="Select Live course">
          <option value="all" ${value==='all'?'selected':''}>All ${mode==='instructor'||mode==='recordings'?'assigned':'enrolled'} courses</option>
          ${options.map(([id,title])=>`<option value="${id}" ${String(id)===value?'selected':''}>${escapeHtml(title)}</option>`).join('')}
        </select>
      </div>
    </div>`;
  }

  function filterLiveCourse(items, mode){
    const value=liveCourseFilterValue(mode);
    if(value==='all')return [...(items||[])];
    return (items||[]).filter(x=>Number(x.course_id)===Number(value));
  }

  function countdownText(target){
    const d=target?new Date(target):null;
    if(!d||Number.isNaN(d.getTime()))return 'Time to be announced';
    let seconds=Math.max(0,Math.floor((d.getTime()-Date.now())/1000));
    const days=Math.floor(seconds/86400);seconds%=86400;
    const hours=Math.floor(seconds/3600);seconds%=3600;
    const minutes=Math.floor(seconds/60);const secs=seconds%60;
    if(days>0)return `${days}d ${hours}h ${minutes}m`;
    if(hours>0)return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  }

  function initLiveCountdowns(){
    if(state.liveCountdownTimer){clearInterval(state.liveCountdownTimer);state.liveCountdownTimer=null;}
    const update=()=>document.querySelectorAll('[data-live-countdown]').forEach(el=>{el.textContent=countdownText(el.dataset.liveCountdown)});
    update();
    if(document.querySelector('[data-live-countdown]'))state.liveCountdownTimer=setInterval(update,1000);
  }

  function nextUpcomingHeroMarkup(item, mode){
    if(!item)return `<div class="live-learning-empty"><span class="empty-icon">${icon('calendar')}</span><h3>No Live or upcoming class</h3><p>${mode==='instructor'?'Schedule your next lecture to make it appear here.':'Your next Live class will appear here when the instructor schedules it.'}</p></div>`;
    const timing=liveTiming(item);
    const host=mode==='instructor';
    const action=host && timing.canStart
      ? `<button class="button button-primary" type="button" data-action="instructor-live-start" data-id="${item.id}">${icon('video')} Start Live Class</button>`
      : `<a class="button button-secondary" href="${host?'#/instructor-live':'#/live-classes'}">${icon('calendar')} View Schedule</a>`;
    return `<article class="next-class-card">
      <span class="next-class-icon">${icon('clock')}</span>
      <div><span class="course-category">NEXT LIVE CLASS</span><h3>${escapeHtml(item.title||'Live Class')}</h3><p>${escapeHtml(item.course_title||'Course')} · ${classroomDate(item.starts_at)}</p></div>
      <div class="next-class-countdown"><strong data-live-countdown="${escapeHtml(item.starts_at||'')}">${countdownText(item.starts_at)}</strong><span>until class starts</span><div style="margin-top:10px">${action}</div></div>
    </article>`;
  }

  function recordingLibraryGridMarkup(recordings, mode){
    const list=[...(recordings||[])].sort((a,b)=>new Date(b.recorded_at||b.created_at||0)-new Date(a.recorded_at||a.created_at||0));
    if(!list.length)return `<div class="live-learning-empty"><span class="empty-icon">${icon('play')}</span><h3>No recorded classes yet</h3><p>${mode==='instructor'?'End a Live class to create its recording entry automatically, or add a recording URL from Recorded Classes.':'Every recording for your active course appears here. Processing recordings become playable automatically when ready.'}</p></div>`;
    return `<div class="recorded-course-grid">${list.slice(0,12).map(item=>{
      const hasUrl=!!String(item.recording_url||'').trim();
      const cover=item.course_image?imageMarkup(item.course_image,`${item.course_title||item.title} recording`,initials(item.course_title||item.title)):`<div class="recorded-course-cover-fallback">${icon('play')}</div>`;
      return `<article class="recorded-course-card">
        <div class="recorded-course-cover">${cover}<span class="recorded-course-badge">${item.source==='zoom'?'Zoom':'Recorded'}</span></div>
        <div class="recorded-course-body"><span class="course-category">${escapeHtml(item.course_title||'Recorded Course')}</span><h3>${escapeHtml(item.title||'Recorded Class')}</h3><p>${escapeHtml(item.description||'Recorded Live-class session available for review.')}</p>
          <div class="recorded-course-meta"><span>${icon('clock')} ${item.recorded_at?classroomDate(item.recorded_at):'Latest recording'}</span><span>${hasUrl?'Ready':'Processing'}</span></div>
          ${hasUrl?`<a class="button button-primary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener noreferrer">${icon('play')} Watch Recording</a>`:`<button class="button button-secondary button-sm" type="button" disabled>${icon('clock')} Recording Processing</button>`}
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  function recordedCourseLibraryMarkup(rows, mode){
    const source=(rows||[]).filter(Boolean);
    const groups=new Map();

    source.forEach(item=>{
      const key=String(item.course_id||item.course_title||'course');
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(item);
    });

    const real=[...groups.entries()].map(([key,items])=>{
      const first=items[0]||{};
      const courseId=Number(first.course_id||0);
      const course=(D.courses||[]).find(c=>Number(c.id)===courseId)
        || (mode==='host' ? instructorCourses().find(c=>Number(c.id)===courseId) : null)
        || {};
      const latest=[...items].sort((a,b)=>new Date(b.starts_at||0)-new Date(a.starts_at||0))[0]||first;
      const recording=items.find(x=>x.recording_url)||latest;
      return {
        title:first.course_title||course.title||'Recorded Course',
        category:course.category||'Recorded Learning',
        desc:course.short||course.description||'Review previous classes, revisit key concepts and continue learning at your own pace.',
        image:course.image||'',
        count:items.length,
        recording_url:recording.recording_url||'',
        sample:false
      };
    }).slice(0,8);

    const dummy=[
      {title:'Business Analyst with Data Analytics',category:'Business & Analytics',desc:'Replay guided analytics lessons, practical examples and previous classroom discussions.',count:12},
      {title:'AWS Cloud Engineer',category:'Cloud & DevOps',desc:'Recorded cloud classes covering AWS foundations, deployment workflows and hands-on demos.',count:9},
      {title:'Full Stack Development',category:'Development',desc:'Review frontend, backend and project-building sessions from your recorded learning library.',count:15},
      {title:'Data Science & AI',category:'Artificial Intelligence',desc:'Revisit data science, machine learning and AI classroom sessions whenever you need them.',count:11}
    ].map(x=>({...x,image:'',recording_url:'',sample:true}));

    const cards=real.length?real:dummy;

    return `<div class="recorded-course-grid">
      ${cards.map(item=>{
        const cover=item.image
          ? `${imageMarkup(item.image,`${item.title} recorded course`,initials(item.title))}`
          : `<div class="recorded-course-cover-fallback">${icon('play')}</div>`;
        return `<article class="recorded-course-card">
          <div class="recorded-course-cover">
            ${cover}
            <span class="recorded-course-badge">${item.sample?'Sample':'Recorded'}</span>
          </div>
          <div class="recorded-course-body">
            <span class="course-category">${escapeHtml(item.category||'Recorded Course')}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(String(item.desc||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim())}</p>
            <div class="recorded-course-meta">
              <span>${icon('play')} ${Number(item.count||0)} recorded lecture${Number(item.count||0)===1?'':'s'}</span>
              <span>${item.sample?'Demo':'Available'}</span>
            </div>
            ${item.recording_url
              ? `<a class="button button-secondary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener noreferrer">${icon('play')} Watch Recording</a>`
              : `<button class="button button-secondary button-sm" type="button" disabled>${icon('play')} ${item.sample?'Recorded Course Preview':'Recording Pending'}</button>`}
          </div>
        </article>`;
      }).join('')}
    </div>`;
  }

  function liveNowLearningMarkup(liveRows, mode, readyRows=[]){
    const isHost=mode==='host';
    const live=(liveRows||[]).filter(Boolean);
    const ready=(readyRows||[]).filter(Boolean);

    const items=live.length ? live : (isHost ? ready.slice(0,1) : []);
    if(!items.length){
      return `<div class="live-learning-empty">
        <span class="empty-icon">${icon('radio')}</span>
        <h3>No Live class right now</h3>
        <p>${isHost?'When a scheduled lecture reaches its start window, you can start it here and open the Zoom classroom.':'As soon as your instructor starts a scheduled class, the Join Live Class option will appear here automatically.'}</p>
      </div>`;
    }

    return `<div class="live-now-wrap">
      ${items.map(item=>{
        const status=liveStatus(item);
        const isLive=status==='live';
        const actions=isHost
          ? (isLive
              ? `<button class="button button-primary" type="button" data-action="instructor-inline-class" data-id="${item.id}">${icon('video')} Open Zoom Studio</button>
                 <button class="button button-secondary" type="button" data-action="instructor-live-end" data-id="${item.id}">End Class</button>`
              : `<button class="button button-primary" type="button" data-action="instructor-live-start" data-id="${item.id}">${icon('video')} Start Live Class</button>`)
          : `<button class="button button-primary" type="button" data-action="student-inline-class" data-id="${item.id}">${icon('video')} Join Live Class</button>`;

        return `<article class="live-now-card">
          <span class="live-now-pulse">${icon(isLive?'radio':'video')}</span>
          <div class="live-now-copy">
            <span class="course-category">${escapeHtml(item.course_title||'Live Course')}</span>
            <h3>${escapeHtml(item.title||'Live Class')}</h3>
            <p>${classroomDate(item.starts_at)}${item.instructor_name?` · ${escapeHtml(item.instructor_name)}`:''}${!isLive?' · Ready to start':''}</p>
          </div>
          <div class="live-now-actions">${actions}</div>
        </article>`;
      }).join('')}
    </div>`;
  }

  function upcomingLectureGridMarkup(rows, mode){
    const isHost=mode==='host';
    const list=(rows||[]).filter(Boolean).slice(0,12);

    if(!list.length){
      return `<div class="live-learning-empty">
        <span class="empty-icon">${icon('calendar')}</span>
        <h3>No upcoming lectures</h3>
        <p>${isHost?'Use Schedule Class / Month to build your teaching timetable.':'Your next scheduled Live lectures will appear here automatically.'}</p>
      </div>`;
    }

    return `<div class="upcoming-lecture-grid">
      ${list.map(item=>{
        const d=item.starts_at?new Date(item.starts_at):null;
        const day=d&&!Number.isNaN(d.getTime())?d.toLocaleDateString(siteSettings.locale||'en-IN',{day:'2-digit'}):'--';
        const month=d&&!Number.isNaN(d.getTime())?d.toLocaleDateString(siteSettings.locale||'en-IN',{month:'short'}):'TBD';
        const timing=liveTiming(item);
        const actions=isHost
          ? `${timing.canStart
              ? `<button class="button button-primary button-sm" type="button" data-action="instructor-live-start" data-id="${item.id}">${icon('video')} Start Live Class</button>`
              : `<button class="button button-secondary button-sm" type="button" disabled>${icon('clock')} ${escapeHtml(liveWaitLabel(item))}</button>`}
             <button class="button button-secondary button-sm" type="button" data-action="instructor-live-edit" data-id="${item.id}">Edit</button>
             <button class="button button-ghost button-sm" type="button" data-action="instructor-live-delete" data-id="${item.id}">${icon('trash')}</button>`
          : `<button class="button button-secondary button-sm" type="button" disabled>${icon('clock')} Scheduled</button>`;

        return `<article class="upcoming-lecture-card">
          <div class="upcoming-card-top">
            <div class="upcoming-date-box"><strong>${escapeHtml(day)}</strong><span>${escapeHtml(month)}</span></div>
            <span class="status-pill status-scheduled">UPCOMING</span>
          </div>
          <h3>${escapeHtml(item.title||'Live Lecture')}</h3>
          <p class="upcoming-course-name">${escapeHtml(item.course_title||'Course')}</p>
          <div class="upcoming-time-row">${icon('clock')} <span>${classroomDate(item.starts_at)} · ${escapeHtml(liveWaitLabel(item))}</span></div>
          <div class="upcoming-actions">${actions}</div>
        </article>`;
      }).join('')}
    </div>`;
  }

  function recentLiveGridMarkup(rows, mode) {
    const list=(rows||[]).filter(Boolean).slice(0,8);
    if(!list.length) return `<div class="empty-state" style="padding:30px"><h3>No recent classes yet</h3><p>Your recent Zoom classes and recordings will appear here.</p></div>`;
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:14px">
      ${list.map(item=>{
        const status=mode==='student'?liveStatus(item):String(item.status||'scheduled').toLowerCase();
        const hasRecording=!!item.recording_url;
        const action=mode==='host'?'instructor-inline-class':'student-inline-class';
        const label=status==='live'?(mode==='host'?'Open Live Studio':'Join Live Class'):(hasRecording?'Open Class':'View / Join');
        return `<article class="panel" style="padding:0;overflow:hidden;border-radius:16px">
          <div style="height:108px;background:linear-gradient(135deg,var(--dash-brand),var(--dash-brand-deep));padding:16px;color:#fff;display:flex;flex-direction:column;justify-content:space-between">
            <span style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(item.course_title||'Live Course')}</span>
            <div><strong style="display:block;font-size:18px">${escapeHtml(item.title||'Live Class')}</strong><small>${classroomDate(item.starts_at)}</small></div>
          </div>
          <div style="padding:14px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">
              <span class="status-pill status-${escapeHtml(status)}">${escapeHtml(status)}</span>
              ${hasRecording?'<span style="font-size:11px;font-weight:800;color:var(--dash-brand)">RECORDING</span>':''}
            </div>
            <div class="row-actions">
              <button class="button button-primary button-sm" type="button" data-action="${action}" data-id="${item.id}">${label}</button>
              ${hasRecording?`<a class="button button-secondary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener noreferrer">Recording</a>`:''}
            </div>
          </div>
        </article>`;
      }).join('')}
    </div>`;
  }


  function instructorPreviousSliderMarkup(rows) {
    const list=(rows||[]).filter(Boolean).slice(0,12);
    if(!list.length) {
      return `<div class="empty-state" style="padding:34px 18px"><h3>No previous classes yet</h3><p>Finished classes and their recordings will appear here automatically.</p></div>`;
    }
    const sliderId='instructorPreviousLiveSlider';
    return `<div style="position:relative">
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;margin:0 0 12px">
        <button class="button button-secondary button-sm" type="button" data-action="live-slider-prev" data-slider="${sliderId}" aria-label="Previous classes">‹</button>
        <button class="button button-secondary button-sm" type="button" data-action="live-slider-next" data-slider="${sliderId}" aria-label="Next classes">›</button>
      </div>
      <div id="${sliderId}" style="display:grid;grid-auto-flow:column;grid-auto-columns:minmax(255px,300px);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 12px;scrollbar-width:thin">
        ${list.map(item=>{
          const status=String(item.status||'ended').toLowerCase();
          const hasRecording=!!item.recording_url;
          return `<article class="panel" style="padding:0;overflow:hidden;border-radius:16px;scroll-snap-align:start;min-height:250px">
            <div style="height:116px;background:linear-gradient(135deg,var(--dash-brand),var(--dash-brand-deep));padding:16px;color:#fff;display:flex;flex-direction:column;justify-content:space-between">
              <span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.9">${escapeHtml(item.course_title||'Live Course')}</span>
              <div>
                <strong style="display:block;font-size:18px;line-height:1.2">${escapeHtml(item.title||'Live Class')}</strong>
                <small style="opacity:.9">${classroomDate(item.starts_at)}</small>
              </div>
            </div>
            <div style="padding:14px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">
                <span class="status-pill status-${escapeHtml(status)}">${hasRecording?'recorded':escapeHtml(status)}</span>
                ${item.meeting_id?`<small style="color:#6d6d6d">#${escapeHtml(item.meeting_id)}</small>`:''}
              </div>
              <div class="row-actions">
                ${hasRecording?`<a class="button button-primary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener noreferrer">${icon('play')} Watch Recording</a>`:`<button class="button button-secondary button-sm" type="button" disabled>No recording</button>`}
                <button class="button button-secondary button-sm" type="button" data-action="instructor-live-edit" data-id="${item.id}">Edit</button>
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </div>`;
  }

  function inlineLiveStageMarkup(item, mode, selectedId) {
    const isHost=mode==='host';
    if(!item) {
      return `<section class="panel" style="margin-top:20px;padding:0;overflow:hidden">
        <div style="padding:24px 26px;border-bottom:1px solid var(--dash-border)"><span class="eyebrow">Live classroom</span><h2 style="margin:6px 0 0">No active Live class</h2></div>
        <div class="empty-state" style="padding:60px 24px"><h3>${isHost?'Schedule your next class':'Your instructor has not started a class yet'}</h3><p>${isHost?'Create a single class or a repeating monthly schedule from Live Classes.':'Upcoming classes will stay visible here, and the room opens after the instructor starts the class.'}</p></div>
      </section>`;
    }
    const timing=liveTiming(item),status=timing.status;
    const selected=Number(selectedId||0)===Number(item.id||0);
    const embedNow=selected && status==='live';
    let primaryAction='';
    if(isHost){
      if(status==='live') primaryAction=`<button class="button button-primary" type="button" data-action="instructor-inline-class" data-id="${item.id}">${icon('video')} Open Live Studio</button><button class="button button-secondary" type="button" data-action="instructor-live-end" data-id="${item.id}">End Class</button>`;
      else if(status==='scheduled' && timing.canStart) primaryAction=`<button class="button button-primary" type="button" data-action="instructor-live-start" data-id="${item.id}">${icon('video')} Start Class</button>`;
      else if(status==='scheduled') primaryAction=`<button class="button button-secondary" type="button" disabled>${icon('clock')} ${escapeHtml(liveWaitLabel(item))}</button>`;
    }else{
      if(status==='live') primaryAction=`<button class="button button-primary" type="button" data-action="student-inline-class" data-id="${item.id}">${icon('video')} Join Live Classroom</button>`;
      else if(status==='scheduled') primaryAction=`<button class="button button-secondary" type="button" disabled>${icon('clock')} Waiting for instructor</button>`;
    }
    return `<section class="panel" id="inlineLiveStage" style="margin-top:20px;padding:0;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid var(--dash-border);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <span class="eyebrow">${status==='live'?'Live now':status==='scheduled'?'Scheduled class':'Classroom'}</span>
          <h2 style="margin:6px 0 4px">${escapeHtml(item.title||'Live Class')}</h2>
          <p class="muted" style="margin:0">${escapeHtml(item.course_title||'Course')} · ${classroomDate(item.starts_at)}${status==='scheduled'?` · ${escapeHtml(liveWaitLabel(item))}`:''}</p>
        </div>
        <div class="row-actions">
          ${embedNow?'':primaryAction}
          ${item.recording_url?`<a class="button button-secondary" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener noreferrer">Watch Recording</a>`:''}
        </div>
      </div>
      <div style="padding:16px;background:var(--dash-surface-2)">
        ${embedNow ? inlineZoomFrameMarkup(item.id,mode) : `<div style="height:clamp(520px,calc(100vh - 250px),700px);min-height:520px;background:#141414;border-radius:18px;display:grid;place-items:center;color:#fff;text-align:center;padding:30px"><div><span style="display:inline-grid;place-items:center;width:58px;height:58px;border-radius:50%;background:var(--dash-brand);margin-bottom:16px">${icon(status==='scheduled'?'clock':'video')}</span><h2 style="color:#fff;margin:0 0 8px">${status==='live'?'Class is live':status==='scheduled'?'Class is scheduled':'Classroom'}</h2><p style="max-width:590px;color:#d7d7d7;margin:0 auto 18px">${isHost?(status==='scheduled'?(timing.canStart?'The scheduled time is ready. Start the class to open Zoom and make it Live for students.':`This class is scheduled for ${classroomDate(item.starts_at)}. The Start Class button becomes available 15 minutes before class.`):'Open the embedded Zoom studio here without leaving the LMS.'):(status==='scheduled'?'This class is on your Live course schedule. You can join here as soon as your instructor starts it.':'Join the embedded Zoom classroom here without leaving Full Stack Academy.')}</p>${primaryAction}</div></div>`}
      </div>
    </section>`;
  }

  function studentLiveRows() {
    return Array.isArray(state.studentLiveSessions) ? state.studentLiveSessions : [];
  }


  function uniqueStudentLiveRows(rows){
    const seen=new Set();
    return (rows||[]).filter(item=>{
      const key=[
        Number(item?.course_id||0),
        String(item?.title||'').trim().toLowerCase(),
        String(item?.starts_at||'')
      ].join('|');
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function studentLiveClassMarkup(item, compact = false) {
    const timing=liveTiming(item),status=timing.status;
    const isLive=status==='live',isEnded=status==='ended';
    const badge=isLive?'LIVE NOW':(isEnded?'ENDED':status.toUpperCase());
    const course=item.course_title||'Live Course';
    const instructor=item.instructor_name||'Full Stack Academy Instructor';
    const meetingInfo=item.meeting_id?`<span><strong>Meeting ID</strong> ${escapeHtml(item.meeting_id)}</span>${item.passcode?`<span><strong>Passcode</strong> ${escapeHtml(item.passcode)}</span>`:''}`:'';
    const action=isLive
      ? `<button class="button button-primary button-sm" type="button" data-action="student-inline-class" data-id="${item.id}">${icon('video')} Join Live Classroom</button>`
      : status==='scheduled'
        ? `<button class="button button-secondary button-sm" type="button" disabled>${icon('clock')} ${escapeHtml(liveWaitLabel(item))}</button>`
        : '';
    return `<article class="${compact?'classroom-row student':'panel classroom-manage-card'}">
      ${compact?`<span class="classroom-row-icon">${icon(isLive?'radio':'calendar')}</span><div><strong>${escapeHtml(item.title||course)}</strong><small>${escapeHtml(course)} · ${classroomDate(item.starts_at)}</small>${isLive?'<p><strong>Instructor is live now.</strong></p>':status==='scheduled'?`<p>${escapeHtml(liveWaitLabel(item))}</p>`:''}</div>`:
      `<div class="classroom-manage-head"><span class="classroom-row-icon">${icon(isLive?'radio':'calendar')}</span><div><span class="course-category">${escapeHtml(course)}</span><h3>${escapeHtml(item.title||course)}</h3><p>${classroomDate(item.starts_at)} · ${escapeHtml(instructor)}</p></div><span class="status-pill status-${escapeHtml(status)}">${badge}</span></div><div class="classroom-link-strip">${status==='live'?(meetingInfo||'<span>Zoom meeting ready</span>'):`<span>${escapeHtml(liveWaitLabel(item))}</span>`}</div>`}
      <div class="${compact?'classroom-row-actions':'row-actions'}">
        ${action}
        ${item.recording_url?`<a class="button button-secondary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener noreferrer">${icon('play')} Watch Recording</a>`:''}
        ${item.course_slug?`<a class="button button-secondary button-sm" href="#/learn/${encodeURIComponent(item.course_slug)}">Open Course</a>`:''}
      </div>
    </article>`;
  }

  function renderStudentLiveClasses() {
    ensureLiveLearningLayoutStyles();ensureLiveV80Styles();ensureLiveV81Styles();ensureLiveV82Styles();ensureLiveV83Styles();ensureLiveV89Styles();
    const allRows=uniqueStudentLiveRows(studentLiveRows());
    const allRecordings=Array.isArray(state.studentRecordings)?state.studentRecordings:[];
    const rows=filterLiveCourse(allRows,'student');
    const recordings=filterLiveCourse(allRecordings,'student');
    const live=rows.filter(item=>liveStatus(item)==='live').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0));
    const scheduled=rows.filter(item=>liveStatus(item)==='scheduled').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0));
    const liveItem=live[0]||null;
    const next=scheduled[0]||null;

    if(state.selectedStudentLiveId && !live.some(item=>Number(item.id)===Number(state.selectedStudentLiveId))){
      state.selectedStudentLiveId=null;
    }

    const content=`<div class="live-learning-stack">
      ${liveCourseFilterMarkup('student',allRows,allRecordings)}
      ${liveTheaterMarkup({liveItem,nextItem:next,mode:'student',recordings,selectedId:state.selectedStudentLiveId,selectedRecordingId:state.selectedStudentRecordingId})}
      <section class="panel live-learning-section">
        <div class="live-learning-head">
          <div><span class="eyebrow">Schedule</span><h2>Upcoming scheduled lectures</h2><p>Future lectures for the selected purchased course are loaded directly from the academy database.</p></div>
          <span class="live-learning-count">${scheduled.length}</span>
        </div>
        ${upcomingLectureGridMarkup(scheduled,'student')}
      </section>
    </div>`;
    dashboardShell('live-classes',content,'Live Classes','Choose a purchased course, join Live Zoom, review previous recordings and see the upcoming timetable.');
    scheduleLivePageRefresh('student');initLiveCountdowns();scheduleLiveTheaterRailSync();
  }

  function studentCoursework(type='all') {
    const rows=Array.isArray(state.studentCoursework)?state.studentCoursework:[];
    return type==='all'?rows:rows.filter(item=>item.type===type);
  }

  function courseworkDueLabel(item){
    if(!item?.due_at)return 'No deadline';
    const due=new Date(item.due_at),now=new Date(),diff=due.getTime()-now.getTime(),days=Math.ceil(diff/86400000);
    if(diff<0)return 'Past due';
    if(days===0)return 'Due today';
    if(days===1)return 'Due tomorrow';
    return `Due ${classroomDate(item.due_at)}`;
  }

  function courseworkState(item){
    if(item.type==='quiz'){
      const used=Number(item.attempts_used||0),allowed=Math.max(1,Number(item.attempts_allowed||1));
      if(used>=allowed&&used>0)return {label:item.best_score!==null&&item.max_score?`Complete · ${Math.round((Number(item.best_score)/Number(item.max_score))*100)}%`:'Attempts complete',tone:'done'};
      if(used>0)return {label:item.best_score!==null&&item.max_score?`Best ${Math.round((Number(item.best_score)/Number(item.max_score))*100)}%`:'Attempted',tone:'pending'};
      return {label:'Ready to start',tone:'todo'};
    }
    if(item.submission_status==='graded')return {label:`Graded ${item.grade??0}/${item.points??100}`,tone:'done'};
    if(item.submission_status==='submitted')return {label:'Submitted',tone:'pending'};
    return {label:'Not submitted',tone:'todo'};
  }

  function dashboardCourseworkCard(item){
    const meta=courseworkState(item),enrollment=(state.studentEnrollmentRows||[]).find(e=>Number(e.course_id)===Number(item.course_id)&&['active','completed'].includes(String(e.status||''))),mode=String(enrollment?.delivery_mode||'offline').toLowerCase();
    const href=mode==='recorded'?studentRecordedCourseEntry(item.course_id):mode==='live'?'#/live-classes':`#/learn/${encodeURIComponent(item.course_slug||'')}`;
    return `<article class="premium-task-card"><span class="premium-task-icon ${item.type}">${icon(item.type==='quiz'?'note':'project')}</span><div><span class="course-category">${escapeHtml(item.course_title||'Course')}</span><h3>${escapeHtml(item.title||'Coursework')}</h3><p>${escapeHtml(courseworkDueLabel(item))} · <span class="coursework-state ${meta.tone}">${escapeHtml(meta.label)}</span></p></div><a class="button button-secondary button-sm" href="${href}">Open Course</a></article>`;
  }

  function renderDashboard() {
    ensureLiveV80Styles();ensureLiveV81Styles();ensureStudentCoursesV84Styles();
    const enrollmentEntries=(state.studentEnrollmentRows||[]).filter(e=>['active','completed'].includes(String(e.status||''))&&e.access_allowed!==false).map(enrollment=>({course:courseById(Number(enrollment.course_id)),enrollment})).filter(x=>x.course);
    const enrolled=enrollmentEntries.map(x=>x.course),liveRows=studentLiveRows(),liveNowRows=uniqueStudentLiveRows(liveRows).filter(item=>liveStatus(item)==='live'),upcomingLiveRows=uniqueStudentLiveRows(liveRows).filter(item=>['live','scheduled'].includes(liveStatus(item)));
    const dashboardEntries=enrollmentEntries.map(x=>({...x,workspace:studentCourseWorkspaceData(x.course,x.enrollment)}));
    const completed=dashboardEntries.filter(x=>x.workspace.percent===100),inProgress=dashboardEntries.filter(x=>x.workspace.percent>0&&x.workspace.percent<100),continueEntry=inProgress[0]||dashboardEntries[0]||null;
    const quizzes=studentCoursework('quiz'),assignments=studentCoursework('assignment'),pendingWork=studentCoursework().filter(item=>!item.completed).slice(0,5);
    const continuePanel=continueEntry?(()=>{const continueCourse=continueEntry.course,workspace=continueEntry.workspace,percent=Math.max(0,Math.min(100,Number(workspace.percent||0))),href=workspace.isRecordedCourse?studentRecordedCourseEntry(continueCourse.id):workspace.isLiveCourse?'#/live-classes':`#/learn/${continueCourse.slug}`,progressCopy=workspace.isRecordedCourse?`${workspace.recordedLectures.filter(x=>x.completed).length} of ${workspace.recordedLectures.length} lectures completed.`:workspace.isLiveCourse?'Continue with your Live classroom and schedule.':`${completedLessons(continueCourse.id)} of ${allLessonKeys(continueCourse).length} lessons completed.`;return `<article class="premium-resume-card"><div class="premium-resume-media">${imageMarkup(continueCourse.image,continueCourse.title,initials(continueCourse.title))}<span>${percent}% complete</span></div><div class="premium-resume-copy"><span class="eyebrow">Continue learning</span><h2>${escapeHtml(continueCourse.title)}</h2><p>${progressCopy} Continue exactly where you stopped.</p><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="premium-resume-actions"><a class="button button-primary" href="${href}">${percent===100?'Review course':'Resume course'} ${icon('arrow')}</a><a class="button button-secondary" href="#/my-courses">All courses</a></div></div></article>`})():`<div class="empty-state premium-empty"><span class="empty-icon">${icon('book')}</span><h3>Your learning workspace is ready</h3><p>${state.pendingEnrollments.length?'A course order is waiting for activation.':'Enroll in a course to unlock lessons, quizzes and assignments.'}</p><a class="button button-primary" href="${state.pendingEnrollments.length?'#/purchase-history':'#/courses'}">${state.pendingEnrollments.length?'View orders':'Browse courses'}</a></div>`;
    const liveNotice=upcomingLiveRows.length?(()=>{const item=liveNowRows[0]||upcomingLiveRows.filter(x=>liveStatus(x)==='scheduled').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0))[0],isLive=item&&liveStatus(item)==='live';return `<div class="premium-live-banner"><span class="live-dot"></span><div><small>${isLive?'LIVE NOW':'NEXT LIVE CLASS'}</small><strong>${escapeHtml(item?.title||'Live Class')}</strong><span>${escapeHtml(item?.course_title||'Course')} · ${classroomDate(item?.starts_at)}</span></div><button class="button ${isLive?'button-primary':'button-secondary'} button-sm" type="button" data-action="student-course-live-open" data-course-id="${item?.course_id||''}" data-live-id="${isLive?item?.id||'':''}">${isLive?'Join Live':'View Schedule'}</button></div>`;})():'';
    const content=`<section class="premium-dashboard-hero"><div><span class="eyebrow light">Student Workspace</span><h2>Good to see you, ${escapeHtml(state.user.name.split(' ')[0])}.</h2><p>Courses, Live classes, quizzes, assignments and certificates — all from one clean workspace.</p></div><div class="premium-hero-actions"><a href="#/my-courses" class="button button-primary">My Courses</a></div></section>
      ${studentProfileReminder()}
      ${liveNotice}
      <div class="dashboard-metrics premium-metrics">${[[enrolled.length,'Active courses','book','Learning now'],[pendingWork.length,'Open tasks','clock','Needs attention'],[quizzes.filter(x=>x.completed).length,'Quizzes taken','note','Auto-scored'],[assignments.filter(x=>x.completed).length,'Assignments sent','project','Submitted']].map(m=>`<article class="metric-card"><div class="metric-card-top"><span>${m[1]}</span><i class="metric-card-icon">${icon(m[2])}</i></div><strong>${m[0]}</strong><small>${m[3]}</small></article>`).join('')}</div>
      <div class="premium-dashboard-grid"><section>${continuePanel}</section><aside class="panel premium-deadlines"><div class="panel-head"><div><span class="eyebrow">Next up</span><h2>Coursework</h2></div><a href="#/my-courses">Open courses</a></div>${pendingWork.length?`<div class="premium-task-list">${pendingWork.map(dashboardCourseworkCard).join('')}</div>`:`<div class="empty-state compact"><p>No open coursework right now.</p></div>`}</aside></div>
      <div class="premium-dashboard-grid lower"><section class="panel"><div class="panel-head"><div><span class="eyebrow">Progress</span><h2>Your courses</h2></div><a href="#/my-courses">Manage</a></div>${dashboardEntries.length?`<div class="premium-course-progress">${dashboardEntries.slice(0,4).map(({course:c,workspace:ws})=>{const href=ws.isRecordedCourse?studentRecordedCourseEntry(c.id):ws.isLiveCourse?'#/live-classes':`#/learn/${c.slug}`,pct=ws.percent,mode=ws.isRecordedCourse?'Recorded':ws.isLiveCourse?'Live':'Physical',copy=ws.isRecordedCourse?`${ws.recordedLectures.filter(x=>x.completed).length} recorded lectures complete`:ws.isLiveCourse?'Live classroom access':`${completedLessons(c.id)} lessons complete`;return `<a href="${href}"><span><strong>${escapeHtml(c.title)} · ${mode}</strong><small>${copy}</small></span><span class="course-progress-number">${pct}%</span><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></a>`}).join('')}</div>`:'<p class="muted">No active courses yet.</p>'}</section><aside class="panel premium-achievement"><span class="eyebrow">Achievement</span><span class="premium-achievement-icon">${icon('award')}</span><strong>${completed.length}</strong><h3>Course${completed.length===1?'':'s'} completed</h3><p>Keep progressing to unlock more certificates.</p><a href="#/certificates">View certificates ${icon('arrow')}</a></aside></div>`;
    dashboardShell('dashboard',content,'Learning Dashboard','A premium overview of everything that needs your attention.');
    initLiveCountdowns();
  }

  function renderMyCourses() {
    ensureStudentCoursesV84Styles();

    const activeRows=(state.studentEnrollmentRows||[]).filter(item=>['active','completed'].includes(String(item.status||''))&&item.access_allowed!==false);
    const allData=activeRows.length
      ? activeRows.map(enrollment=>({course:courseById(Number(enrollment.course_id)),enrollment})).filter(x=>x.course).map(x=>({...x,data:studentCourseWorkspaceData(x.course,x.enrollment)}))
      : enrolledCourses().map(course=>({course,enrollment:null,data:studentCourseWorkspaceData(course)}));
    const all=allData.map(x=>x.course);

    const totalLiveCourses=allData.filter(x=>x.data.isLiveCourse).length;
    const totalRecordings=allData.reduce((sum,x)=>sum+x.data.recordings.length,0);
    const totalUpcoming=allData.reduce((sum,x)=>sum+x.data.upcoming.length,0);
    const activeLiveClasses=allData.filter(x=>!!x.data.live).length;

    const tab=state.learnerTab||'all';
    const filtered=allData.filter(({data})=>{
      if(tab==='all')return true;
      if(tab==='live')return data.isLiveCourse;
      if(tab==='recorded')return data.isRecordedCourse;
      if(tab==='progress')return data.percent>0 && data.percent<100;
      if(tab==='complete')return data.percent===100;
      return true;
    });

    const tabs=[
      ['all','All Courses'],
      ['live','Live Courses'],
      ['recorded','Recorded'],
      ['progress','In Progress'],
      ['complete','Completed']
    ];

    const overview=`<div class="student-courses-overview">
      <article class="student-courses-stat"><span>Purchased courses</span><strong>${all.length}</strong><small>Active backend enrollments</small></article>
      <article class="student-courses-stat"><span>Live courses</span><strong>${totalLiveCourses}</strong><small>${activeLiveClasses?`${activeLiveClasses} Live right now`:'Instructor-led courses'}</small></article>
      <article class="student-courses-stat"><span>Recordings</span><strong>${totalRecordings}</strong><small>Published classes available</small></article>
      <article class="student-courses-stat"><span>Upcoming classes</span><strong>${totalUpcoming}</strong><small>Across purchased courses</small></article>
    </div>`;

    const toolbar=`<div class="student-course-toolbar">
      <div class="segmented-tabs">
        ${tabs.map(([key,label])=>`<button class="${tab===key?'active':''}" type="button" data-action="learner-tab" data-tab="${key}">${label}</button>`).join('')}
      </div>
      <span class="student-course-count">${filtered.length} course${filtered.length===1?'':'s'}</span>
    </div>`;

    const body=filtered.length
      ? `<div class="student-course-library-grid">${filtered.map(({course,enrollment})=>studentPurchasedCourseCardMarkup(course,{enrollment})).join('')}</div>`
      : `<div class="student-courses-empty">
          <span class="empty-icon">${icon('book')}</span>
          <h3>No courses in this view</h3>
          <p>Your activated purchases are loaded directly from MySQL. Choose another filter or browse more courses.</p>
          <a class="button button-primary" href="#/courses">Browse Courses</a>
        </div>`;

    dashboardShell(
      'my-courses',
      overview+toolbar+body,
      'My Courses',
      'Your complete purchased-course library. Open each course to access its recordings, Live classroom, schedule and learning content.'
    );
    initLiveCountdowns();
  }

  function renderStudentCoursework(type){
    const rows=studentCoursework(type),isQuiz=type==='quiz';
    const cards=rows.map(item=>{const meta=courseworkState(item),percent=item.type==='quiz'&&item.best_score!==null&&item.max_score?Math.round((Number(item.best_score)/Number(item.max_score))*100):null,attemptsLeft=isQuiz?Math.max(0,Number(item.attempts_allowed||1)-Number(item.attempts_used||0)):0;return `<article class="student-coursework-card"><div class="student-coursework-head"><span class="premium-task-icon ${item.type}">${icon(isQuiz?'note':'project')}</span><div><span class="course-category">${escapeHtml(item.course_title||'Course')}</span><h3>${escapeHtml(item.title)}</h3></div><span class="coursework-state ${meta.tone}">${escapeHtml(meta.label)}</span></div><div class="student-coursework-meta"><span>${icon('clock')} ${escapeHtml(courseworkDueLabel(item))}</span>${isQuiz?`<span>${icon('note')} ${item.questions_count||0} questions</span><span>${icon('history')} ${attemptsLeft} attempt${attemptsLeft===1?'':'s'} left</span>`:`<span>${icon('award')} ${item.points||100} points</span>`}</div>${percent!==null?`<div class="coursework-score-bar"><span>Best score</span><strong>${percent}%</strong><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div>`:''}<div class="student-coursework-actions">${isQuiz&&attemptsLeft<1?`<button class="button button-secondary button-sm" type="button" disabled>Attempts Complete</button>`:`<a class="button button-primary button-sm" href="#/learn/${encodeURIComponent(item.course_slug||'')}?classroom=${encodeURIComponent(item.type+':'+item.id)}">${isQuiz?(item.completed?'Retake Quiz':'Start Quiz'):(item.completed?'View / Resubmit':'Open Assignment')}</a>`}</div></article>`}).join('');
    dashboardShell(isQuiz?'my-quizzes':'my-assignments',rows.length?`<div class="student-coursework-grid">${cards}</div>`:`<div class="empty-state"><span class="empty-icon">${icon(isQuiz?'note':'project')}</span><h3>No ${isQuiz?'quizzes':'assignments'} yet</h3><p>Your instructor's published ${isQuiz?'quizzes':'assignments'} will appear here automatically for every enrolled course.</p></div>`,isQuiz?'My Quizzes':'My Assignments',isQuiz?'Multi-step assessments with automatic scoring and attempt tracking.':'Submit coursework, attachments and review instructor grades/feedback.');
  }
  function renderMyQuizzes(){renderStudentCoursework('quiz');}
  function renderMyAssignments(){renderStudentCoursework('assignment');}

  function renderWishlist() {
    const list = state.wishlist.map(courseById).filter(Boolean);
    const content = list.length ? `<div class="card-grid">${list.map((c,i)=>courseCard(c,i)).join('')}</div>` : `<div class="empty-state"><span class="empty-icon">${icon('heart')}</span><h3>Your wishlist is empty</h3><p>Save interesting courses while comparing learning paths.</p><a class="button button-primary" href="#/courses">Explore Courses</a></div>`;
    dashboardShell('wishlist',content,'Wishlist','Courses you saved for later comparison.');
  }

  function renderCertificates() {
    const completed = enrolledCourses().filter(c => progressPercent(c.id) === 100);
    const records=state.certifications||[];
    const content = `<div class="certificate-layout"><section><div class="panel-head"><h2>Academy & external certificates</h2><span>${records.length+completed.length} total</span></div>${completed.length||records.length?`<div class="certificate-grid">${completed.map(c=>`<article class="certificate-card"><span class="eyebrow">Course Completion</span><h3>${escapeHtml(c.title)}</h3><p>Awarded to <strong>${escapeHtml(state.user.name)}</strong>.</p><div class="certificate-meta"><span>Status: Approved</span><span>FSA course certificate</span></div><button class="button button-primary button-sm" data-action="print-certificate" data-id="${c.id}">${icon('download')} Print</button></article>`).join('')}${records.map(c=>`<article class="certificate-card"><span class="eyebrow">${escapeHtml(c.status)}</span><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.issuer)}${c.credential_id?` · ${escapeHtml(c.credential_id)}`:''}</p><div class="certificate-meta"><span>${c.issued_on||'Issue date not set'}</span><span>${c.status==='approved'?'Visible publicly':c.status==='rejected'?(c.review_note||'Needs changes'):'Waiting for admin approval'}</span></div>${c.certificate_url?`<a class="button button-secondary button-sm" href="${escapeHtml(c.certificate_url)}" target="_blank" rel="noopener">View credential</a>`:''}</article>`).join('')}</div>`:`<div class="empty-state"><span class="empty-icon">${icon('certificate')}</span><h3>No certificates yet</h3><p>Complete a course or submit an existing certification.</p></div>`}</section><aside class="panel certificate-submit-card"><h2>Add certification</h2><p class="muted">Your entry becomes public only after administrator approval.</p><form id="studentCertificateForm" class="auth-form"><div class="form-group"><label>Certificate title</label><input class="form-control" name="title" required></div><div class="form-group"><label>Issuer</label><input class="form-control" name="issuer" required></div><div class="form-group"><label>Credential ID</label><input class="form-control" name="credential_id"></div><div class="form-group"><label>Issued on</label><input class="form-control" name="issued_on" type="date"></div><div class="form-group"><label>Credential URL</label><input class="form-control" name="certificate_url" type="url"></div><button class="button button-primary button-block" type="submit">Submit for Approval</button></form></aside></div>`;
    dashboardShell('certificates', content, 'Certificates', 'View and print certificates for completed learning paths.');
  }

  function renderPurchaseHistory() {
    const content = state.orders.length ? `<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Order</th><th>Date</th><th>Item</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>${state.orders.map(o=>`<tr><td>${o.id}</td><td>${o.date}</td><td>${o.item}</td><td>${o.type}</td><td>${money(o.amount)}</td><td><span class="status-pill">${o.status}</span></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><span class="empty-icon">${icon('history')}</span><h3>No purchases yet</h3><p>Your submitted course orders will appear here.</p></div>`;
    dashboardShell('purchase-history',content,'Purchase History','Review course orders stored securely in your account.');
  }

  function studentProfileCompletion(){
    const u=state.user||{};
    const p=state.studentAdminProfile||{};
    const fields=[['Full name',u.name],['Email address',u.email],['Phone number',u.phone],['Father name',p.fatherName],['Date of birth',p.dob],['National ID',p.cnic],['City',u.city],['Country',u.country],['About me',u.bio],['Skills',Array.isArray(u.skills)?u.skills.join(','):u.skills],['Profile headline',u.headline&&u.headline!=='Full Stack Academy Learner'?u.headline:'']];
    const done=fields.filter(([label,value])=>String(value||'').trim()).length;
    return {percent:Math.round(done/fields.length*100),missing:fields.filter(([label,value])=>!String(value||'').trim()).map(([label])=>label)};
  }
  function studentProfileReminder(){
    if(!state.loggedIn||state.user.role!=='student')return '';
    const info=studentProfileCompletion();
    return `<section class="panel fsa-profile-progress-card" style="margin-bottom:20px;padding:22px;border-radius:16px"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap"><div><span class="eyebrow">Your student profile</span><h3 style="margin:6px 0">${info.percent}% complete</h3><p style="margin:0">${info.percent===100?'Your student profile is complete.':'Add your details at your own pace. Profile completion is optional and never blocks course checkout.'}</p>${info.missing.length?`<small>Suggested next: ${escapeHtml(info.missing.slice(0,3).join(', '))}</small>`:''}</div><a class="button button-secondary button-sm" href="#/profile">${info.percent===100?'View profile':'Complete profile'}</a></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${info.percent}" aria-label="Student profile completeness" style="margin-top:16px"><div class="progress-fill" style="width:${info.percent}%"></div></div></section>`;
  }
  function renderProfile() {
    const avatar = state.user.avatar ? `<img src="${escapeHtml(state.user.avatar)}" alt="">` : initials(state.user.name);
    const isStudent=state.user.role==='student';
    const tabs=[['personal','Personal details'],['learning','Learning preferences'],['security','Password & security'],...(isStudent?[['email','Email verification']]:[])];
    const content=`<div class="fsa-profile-premium"><header class="fsa-profile-hero"><a href="#/dashboard" class="fsa-profile-back">← Back to dashboard</a><div class="fsa-profile-hero-inner"><div class="fsa-profile-avatar" id="profileAvatar">${avatar}<label for="avatarInput" title="Change photo">${icon('camera')}</label><input id="avatarInput" type="file" accept="image/*" class="sr-only"></div><div><span class="fsa-profile-eyebrow">MY ACCOUNT</span><h1>${escapeHtml(state.user.name)}</h1><p>Keep your information up to date and your account secure.</p></div></div></header>${isStudent?studentProfileReminder():''}<section class="fsa-profile-editor"><nav class="fsa-profile-tabs" aria-label="Profile settings">${tabs.map(t=>`<button type="button" class="${state.profileTab===t[0]?'active':''}" data-action="profile-tab" data-tab="${t[0]}">${escapeHtml(t[1])}</button>`).join('')}</nav><div id="profileTabPanel" class="fsa-profile-panel">${profileTabContent(state.profileTab)}</div></section></div>`;
    if(state.user.role==='instructor') instructorShell('profile',content,'Instructor Profile','Manage your account details.');
    else { setChrome('dashboard'); app.innerHTML=`<main class="fsa-profile-standalone">${content}</main>`; }
  }

  function profileTabContent(tab) {
    if (tab === 'learning') return `<form id="learningPreferencesForm"><div class="form-grid"><div class="form-group"><label>Weekly learning goal (hours)</label><input class="form-control" name="weeklyGoal" type="number" min="1" max="40" value="${state.user.weeklyGoal}"></div><div class="form-group"><label>Preferred language</label><select class="form-control" name="language"><option>English / Hindi</option><option>English</option><option>Hindi</option></select></div><div class="form-group full"><label class="checkbox-line" style="justify-content:flex-start"><input type="checkbox" name="notifications" ${state.user.notifications?'checked':''}> Receive learning reminders and academy updates.</label></div></div><button class="button button-primary" type="submit" style="margin-top:18px">Save Preferences</button></form>`;
    if(tab==='email') return `<div class="fsa-email-settings"><div class="fsa-info-row"><strong>Current email</strong><span>${escapeHtml(state.user.email)}</span></div><p>To change your sign-in email, verify the new address using a six-digit code. A valid email delivery configuration is required.</p><form id="emailOtpRequestForm" class="fsa-email-request"><label>New email address</label><div class="fsa-inline-field"><input class="form-control" type="email" name="newEmail" autocomplete="email" placeholder="name@example.com" required><button class="button button-primary" type="submit">Send code</button></div></form><form id="emailOtpConfirmForm"><label>Verification code</label><div class="fsa-inline-field"><input class="form-control" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="6-digit code" required><button class="button button-secondary" type="submit">Verify & change email</button></div><small>Code expires after 10 minutes. If you didn't receive it, confirm the address and request a new code.</small></form></div>`;
    if (tab === 'security') return `<div class="fsa-security-intro"><h2>Change password</h2><p>Use a strong unique password. Your current password is required to save changes.</p></div><form id="securityForm"><div class="form-grid">${[['Current password','currentPassword','current-password'],['New password','newPassword','new-password'],['Confirm new password','confirmPassword','new-password']].map(([label,name,autocomplete])=>`<div class="form-group ${name==='confirmPassword'?'full':''}"><label>${label}</label><div class="fsa-password-field"><input class="form-control" name="${name}" type="password" minlength="${name==='currentPassword'?1:8}" autocomplete="${autocomplete}" required><button type="button" class="fsa-password-eye" data-action="toggle-password" aria-label="Show or hide ${label.toLowerCase()}">${icon('eye')}</button></div></div>`).join('')}</div><p class="fsa-hint">Minimum 8 characters. Consider using letters, numbers and symbols.</p><button class="button button-primary" type="submit">Update password</button></form>`;
    const x=state.studentAdminProfile||{};
    const field=(label,name,value,type='text',extra='')=>`<div class="form-group"><label>${label}</label><input class="form-control" name="${name}" type="${type}" value="${escapeHtml(String(value||''))}" ${extra}></div>`;
    const career=x.isAlumni?`<h3 class="full">Alumni details</h3>${field('Placed role','alumniRole',x.alumniRole)}${field('Company','alumniCompany',x.alumniCompany)}${field('Package / salary','alumniSalary',x.alumniSalary)}${field('Location','alumniLocation',x.alumniLocation)}${field('Graduation year','alumniGraduationYear',x.alumniGraduationYear)}<div class="form-group full"><label>Alumni quote</label><textarea class="form-control" name="alumniQuote">${escapeHtml(x.alumniQuote||'')}</textarea></div>`:'';
    const job=x.isJobSeeker?`<h3 class="full">Job seeker details</h3>${field('Experience','jobExperience',x.jobExperience)}${field('Location','jobLocation',x.jobLocation)}${field('Availability','jobAvailability',x.jobAvailability)}<div class="form-group full"><label>Job skills (one per line)</label><textarea class="form-control" name="jobSkills">${escapeHtml((x.jobSkills||[]).join('\n'))}</textarea></div><div class="form-group full"><label>Job seeker summary</label><textarea class="form-control" name="jobSummary">${escapeHtml(x.jobSummary||'')}</textarea></div>`:'';
    const extraStudent=state.user.role==='student'?`<h3 class="full">Student identity</h3>${field('Father name','fatherName',x.fatherName)}${field('Date of birth','dob',x.dob,'date')}${field('CNIC / National ID','cnic',x.cnic)}${career}${job}`:'';
    return `<form id="profileForm"><div class="form-grid"><div class="form-group"><label>Full name</label><input class="form-control" name="name" required value="${escapeHtml(state.user.name)}"></div><div class="form-group"><label>Email address</label><input class="form-control" name="email" type="email" required value="${escapeHtml(state.user.email)}" readonly></div><div class="form-group"><label>Academy ID</label><input class="form-control" value="${escapeHtml(state.user.student_code||'Assigned by administrator')}" readonly></div><div class="form-group"><label>Phone number</label><input class="form-control" name="phone" value="${escapeHtml(state.user.phone)}"></div><div class="form-group"><label>Headline</label><input class="form-control" name="headline" value="${escapeHtml(state.user.headline)}"></div>${state.user.role==='student'?'':`<div class="form-group"><label>Branch</label><input class="form-control" name="branch" value="${escapeHtml(state.user.branch||'')}"></div>`}<div class="form-group"><label>City</label><input class="form-control" name="city" value="${escapeHtml(state.user.city)}"></div><div class="form-group"><label>Country</label><input class="form-control" name="country" value="${escapeHtml(state.user.country)}"></div><div class="form-group full"><label>Skills (comma separated)</label><input class="form-control" name="skills" value="${escapeHtml((state.user.skills||[]).join(', '))}"></div><div class="form-group full"><label>Bio</label><textarea class="form-control" name="bio">${escapeHtml(state.user.bio)}</textarea></div>${extraStudent}${state.user.role==='student'?'':`<div class="form-group full"><label class="checkbox-line"><input type="checkbox" name="profile_public" ${state.user.profile_public!==false?'checked':''}> Publish my academy profile</label></div>`}</div><button class="button button-primary" type="submit" style="margin-top:18px">Save Profile</button></form>`;
  }

  function instructorShell(active,content,title,subtitle){
    if(!state.loggedIn){routeTo('/login');return;}
    if(state.user.role!=='instructor'){routeTo('/dashboard');return;}
    setChrome('dashboard');
    ensureUnifiedDashboardLayoutStyles();
    ensureDashboardV94Styles();

    const avatar=state.user.avatar?`<img src="${escapeHtml(state.user.avatar)}" alt="">`:initials(state.user.name);
    const teaching=[
      ['instructor-dashboard','Overview','dashboard'],
      ['instructor-courses','My Courses','book'],
      ['instructor-recorded-lectures','Recorded Lectures','video']
    ];
    const management=[
      ['instructor-certificates','Certificates','award'],
      ['instructor-students','My Students','users'],
      ['instructor-requests','Approval Status','clock'],
      ['profile','My Profile','user']
    ];
    const renderLinks=links=>links.map(l=>`<a class="${active===l[0]?'active':''}" href="#/${l[0]}">${icon(l[2])}<span>${l[1]}</span></a>`).join('');

    const sidebar=`<aside class="dashboard-sidebar" id="dashboardSidebar">
      ${dashboardBrand('Instructor Dashboard')}
      <div class="dashboard-profile-mini">
        <span class="avatar">${avatar}</span>
        <span><strong>${escapeHtml(state.user.name)}</strong><span>Instructor · ${escapeHtml(state.user.branch||'All branches')}</span></span>
      </div>
      <nav class="dashboard-nav">
        <span class="dashboard-nav-label">Teaching</span>
        ${renderLinks(teaching.slice(0,2))}
        <a class="instructor-course-create-nav" href="admin/index.html?courseEditor=new&amp;mode=offline#courses" target="_blank" rel="noopener" title="Submit a new public course for approval">${icon('plus')}<span>Create Public Course</span></a>
        <div class="dashboard-nav-group ${['instructor-live','instructor-recordings'].includes(active)?'is-active is-open':''}">
          <button class="dashboard-nav-parent ${['instructor-live','instructor-recordings'].includes(active)?'active':''}" type="button" data-action="toggle-instructor-live-submenu" aria-expanded="${['instructor-live','instructor-recordings'].includes(active)?'true':'false'}">${icon('radio')}<span>Live Classes</span><b>${icon('chevronDown')}</b></button>
          <div class="dashboard-nav-submenu" aria-label="Live Classes submenu">
            <a class="${active==='instructor-live'?'active':''}" href="#/instructor-live"><span>Live Classroom</span></a>
            <a class="${active==='instructor-recordings'?'active':''}" href="#/instructor-recordings"><span>Live Recordings</span></a>
          </div>
        </div>
        ${renderLinks(teaching.slice(2))}
        <span class="dashboard-nav-label">Students & Review</span>
        ${renderLinks(management)}
      </nav>
      <div class="dashboard-sidebar-footer">
        <a href="#/">${icon('home')}<span>Open Website</span></a>
        <button type="button" data-action="logout">${icon('logout')}<span>Sign Out</span></button>
      </div>
    </aside>`;

    app.innerHTML=`<section class="dashboard-shell">
      ${sidebar}
      <main class="dashboard-main">
        ${dashboardTop(title,subtitle)}
        <section class="dashboard-content">
          ${dashboardPageHead(title,subtitle,false)}
          ${content}
        </section>
      </main>
    </section>`;
    scheduleDashboardFixedSidebar();
  }

  function renderInstructorDashboard(){
    const d=state.instructorData;
    const courses=d.courses||[], quizzes=d.quizzes||[], assignments=d.assignments||[], submissions=d.submissions||[], recordings=d.recordings||[];
    const upcoming=(d.live_sessions||[]).filter(x=>['scheduled','live'].includes(liveStatus(x))).sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0));
    const toGrade=submissions.filter(x=>String(x.status||'').toLowerCase()==='submitted');
    const publishedQuizzes=quizzes.filter(x=>x.status!=='draft');
    const publishedAssignments=assignments.filter(x=>x.status!=='draft');
    const recentAssessments=[...quizzes.map(x=>({...x,_type:'Quiz'})),...assignments.map(x=>({...x,_type:'Assignment'}))]
      .sort((a,b)=>new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0)).slice(0,5);
    const content=`<section class="premium-dashboard-hero instructor-premium-hero"><div><span class="eyebrow light">Instructor Workspace</span><h2>Teach, assess and review from one place.</h2><p>Your assigned courses, live classes, recordings, multi-step quizzes and student submissions stay connected to the same classroom.</p></div><div class="premium-hero-actions"><a class="button button-primary" href="admin/index.html?courseEditor=new&amp;mode=offline#courses" target="_blank" rel="noopener">${icon('plus')} Create Public Course</a><a class="button button-secondary" href="#/instructor-courses">Manage Assigned Courses</a></div></section>
      <div class="dashboard-metrics premium-metrics">${[[courses.length,'Assigned courses','book'],[(d.students||[]).length,'Students','users'],[toGrade.length,'To grade','project'],[publishedQuizzes.length,'Published quizzes','note']].map(m=>`<article class="premium-metric-card"><i>${icon(m[2])}</i><div><strong>${m[0]}</strong><span>${m[1]}</span></div></article>`).join('')}</div>
      <div class="premium-dashboard-grid">
        <section class="panel"><div class="panel-head"><div><span class="eyebrow">Teaching tools</span><h2>Quick actions</h2></div><a href="#/instructor-courses">All courses</a></div><div class="instructor-quick-grid premium"><a href="#/instructor-courses">${icon('book')}<span><strong>Assigned Courses</strong><small>Prepare lessons and manage coursework course-by-course.</small></span></a><a href="#/instructor-live">${icon('radio')}<span><strong>Live Classes</strong><small>Schedule and start your embedded Zoom classroom.</small></span></a><a href="#/instructor-recordings">${icon('play')}<span><strong>Recordings</strong><small>Publish completed class recordings for students.</small></span></a><a href="#/instructor-students">${icon('users')}<span><strong>Students</strong><small>Review learners attached to your courses.</small></span></a></div></section>
        <aside class="panel premium-instructor-summary"><div class="panel-head"><h2>Classroom status</h2></div><div class="premium-summary-line"><strong>${toGrade.length}</strong><span>assignment submission${toGrade.length===1?'':'s'} waiting for grading</span></div><div class="premium-summary-line"><strong>${upcoming.length}</strong><span>scheduled or live class${upcoming.length===1?'':'es'}</span></div><div class="premium-summary-line"><strong>${recordings.length}</strong><span>recorded class${recordings.length===1?'':'es'} available</span></div><div class="premium-summary-line"><strong>${publishedAssignments.length}</strong><span>published assignment${publishedAssignments.length===1?'':'s'}</span></div></aside>
      </div>
      <div class="premium-dashboard-grid lower">
        <section class="panel"><div class="panel-head"><div><span class="eyebrow">Assessments</span><h2>Recent coursework</h2></div><a href="#/instructor-courses">Manage in courses</a></div>${recentAssessments.length?`<div class="premium-assessment-feed">${recentAssessments.map(item=>`<a href="#/instructor-course-manage/${Number(item.course_id||0)}"><span class="classroom-row-icon">${icon(item._type==='Quiz'?'note':'project')}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.course_title||'Course')}${item.due_at?` · ${classroomDate(item.due_at)}`:''}</small></span><b>${item._type}</b></a>`).join('')}</div>`:'<p class="muted">No quiz or assignment has been created yet.</p>'}</section>
        <section class="panel"><div class="panel-head"><div><span class="eyebrow">Live teaching</span><h2>Next classes</h2></div><a href="#/instructor-live">Open Live Classes</a></div>${upcoming.length?`<div class="premium-live-mini">${upcoming.slice(0,5).map(item=>`<a href="#/instructor-live"><span class="live-dot"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.course_title||'Course')} · ${classroomDate(item.starts_at)}</small></span><b>${escapeHtml(liveStatus(item))}</b></a>`).join('')}</div>`:'<p class="muted">No live class is scheduled yet.</p>'}</section>
      </div>`;
    instructorShell('instructor-dashboard',content,`Welcome, ${escapeHtml(state.user.name.split(' ')[0])}.`,'A premium teaching workspace for your assigned academy courses.');
  }

  function instructorStudentById(id){
    return (state.instructorData.students||[]).find(student=>Number(student.id)===Number(id))||null;
  }

  function instructorStudentCourseCount(student){
    return Array.isArray(student?.courses)?student.courses.length:(Array.isArray(student?.course_ids)?student.course_ids.length:0);
  }

  function instructorStudentStatusLabel(value){
    return String(value||'studying').replace(/_/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
  }

  function openInstructorStudentDetail(studentId){
    const student=instructorStudentById(studentId);
    if(!student){toast('Student record could not be found in the current backend data.','error');return;}

    const courses=Array.isArray(student.courses)?student.courses:[];
    const attempts=(state.instructorData.quiz_attempts||[]).filter(row=>Number(row.user_id)===Number(student.id));
    const submissions=(state.instructorData.submissions||[]).filter(row=>Number(row.user_id)===Number(student.id));
    const quizStats=student.quiz_stats||{};
    const assignmentStats=student.assignment_stats||{};
    const feeTotal=Number(student.fee_total||0),feePaid=Number(student.fee_paid||0),feePending=Math.max(0,Number(student.fee_pending||0));
    const hasFeeRecord=feeTotal>0||feePaid>0;
    const primaryBatch=student.batch_name||'No batch linked';
    const primaryCourse=student.profile_course_title||courses[0]?.title||'No primary course';
    const profileMeta=[
      student.email?`<a href="mailto:${escapeHtml(student.email)}">${escapeHtml(student.email)}</a>`:'Email not saved',
      student.phone?`<a href="tel:${escapeHtml(String(student.phone).replace(/[^+\d]/g,''))}">${escapeHtml(student.phone)}</a>`:'Phone not saved'
    ].join(' · ');

    const courseRows=courses.length?courses.map(course=>`<article class="student-detail-course">
      <div>
        <strong>${escapeHtml(course.title||'Course')}</strong>
        <small>${escapeHtml(String(course.delivery_mode||'').replace(/_/g,' ')||'Access mode not set')} · ${escapeHtml(instructorStudentStatusLabel(course.status||'pending'))}</small>
      </div>
      <div class="student-detail-progress">
        <span>${Number(course.lessons_completed||0)} / ${Number(course.lessons_total||0)} lessons</span>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,Number(course.progress_percent||0)))}%"></div></div>
      </div>
      ${course.slug?`<a class="button button-secondary button-sm" href="#/course/${encodeURIComponent(course.slug)}">Course</a>`:''}
    </article>`).join(''):`<p class="muted">No instructor-owned course enrollment is linked to this learner yet.</p>`;

    const quizRows=attempts.length?attempts.slice(0,8).map(row=>`<tr><td>${escapeHtml(row.quiz_title||'Quiz')}</td><td>${escapeHtml(row.course_title||'Course')}</td><td><strong>${Number(row.percent||0)}%</strong><br><small>${Number(row.score||0)}/${Number(row.max_score||0)}</small></td><td>${classroomDate(row.submitted_at)}</td></tr>`).join(''):`<tr><td colspan="4"><span class="muted">No quiz attempts yet.</span></td></tr>`;
    const submissionRows=submissions.length?submissions.slice(0,8).map(row=>`<tr><td>${escapeHtml(row.assignment_title||'Assignment')}</td><td>${escapeHtml(row.course_title||'Course')}</td><td><span class="status-pill">${escapeHtml(row.status||'submitted')}</span></td><td>${row.grade===null||row.grade===undefined?'—':`${Number(row.grade)}/${Number(row.points||0)}`}</td></tr>`).join(''):`<tr><td colspan="4"><span class="muted">No assignment submissions yet.</span></td></tr>`;

    openClassroomModal(
      student.name||'Student',
      `${student.student_code||'Academy ID pending'} · Backend-linked learner record`,
      `<div class="student-detail-shell">
        <section class="student-detail-identity">
          <span class="avatar large">${escapeHtml(initials(student.name||'Student'))}</span>
          <div>
            <span class="backend-connected-badge">${icon('check')} Connected to backend</span>
            <h3>${escapeHtml(student.name||'Student')}</h3>
            <p>${profileMeta}</p>
            <div class="student-detail-chips">
              <span>${escapeHtml(student.branch||student.batch_branch||'Branch not set')}</span>
              <span>${escapeHtml(instructorStudentStatusLabel(student.academic_status))}</span>
              <span>${instructorStudentCourseCount(student)} course${instructorStudentCourseCount(student)===1?'':'s'}</span>
            </div>
          </div>
        </section>

        <div class="student-detail-metrics">
          <article><small>Quiz attempts</small><strong>${Number(quizStats.attempts||0)}</strong><span>${Number(quizStats.average_percent||0)}% average</span></article>
          <article><small>Best quiz score</small><strong>${Number(quizStats.best_percent||0)}%</strong><span>${Number(quizStats.quizzes_attempted||0)} quiz${Number(quizStats.quizzes_attempted||0)===1?'':'zes'} attempted</span></article>
          <article><small>Assignments</small><strong>${Number(assignmentStats.submissions||0)}</strong><span>${Number(assignmentStats.graded||0)} graded</span></article>
          <article><small>Fee status</small><strong>${escapeHtml(String(student.fee_status||'pending').toUpperCase())}</strong><span>${hasFeeRecord?`${money(feePaid)} paid · ${money(feePending)} pending`:'No fee record'}</span></article>
        </div>

        <section class="student-detail-block">
          <div class="panel-head"><div><span class="eyebrow">Backend placement</span><h3>Course & batch</h3></div></div>
          <div class="student-detail-placement">
            <div><small>Primary course</small><strong>${escapeHtml(primaryCourse)}</strong></div>
            <div><small>Batch</small><strong>${escapeHtml(primaryBatch)}</strong><span>${student.batch_start?`Starts ${escapeHtml(String(student.batch_start))}`:'No batch date saved'}</span></div>
            <div><small>Branch</small><strong>${escapeHtml(student.batch_branch||student.branch||'Not set')}</strong></div>
            <div><small>Access</small><strong>${escapeHtml(String(student.batch_mode||courses[0]?.delivery_mode||'Not set').replace(/-/g,' '))}</strong></div>
          </div>
        </section>

        <section class="student-detail-block">
          <div class="panel-head"><div><span class="eyebrow">Enrollments</span><h3>Your assigned courses</h3></div><span>${courses.length}</span></div>
          <div class="student-detail-course-list">${courseRows}</div>
        </section>

        <section class="student-detail-block">
          <div class="panel-head"><div><span class="eyebrow">Assessment activity</span><h3>Quiz results</h3></div><span>${attempts.length}</span></div>
          <div class="history-table-wrap"><table class="history-table"><thead><tr><th>Quiz</th><th>Course</th><th>Score</th><th>Submitted</th></tr></thead><tbody>${quizRows}</tbody></table></div>
        </section>

        <section class="student-detail-block">
          <div class="panel-head"><div><span class="eyebrow">Coursework</span><h3>Assignment submissions</h3></div><span>${submissions.length}</span></div>
          <div class="history-table-wrap"><table class="history-table"><thead><tr><th>Assignment</th><th>Course</th><th>Status</th><th>Grade</th></tr></thead><tbody>${submissionRows}</tbody></table></div>
        </section>
      </div>`
    );
  }

  function renderInstructorStudents(){
    const students=state.instructorData.students||[];
    const linkedEnrollments=students.reduce((total,student)=>total+instructorStudentCourseCount(student),0);
    const activeStudents=students.filter(student=>(student.courses||[]).some(course=>['active','completed'].includes(String(course.status||'')))).length;
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Backend-linked students</span><p>Students are pulled from real course enrollments and direct instructor assignments. Click any learner to open courses, batch, fee status, quiz scores and assignment activity.</p></div></div>
      <div class="dashboard-metrics premium-metrics instructor-student-metrics">
        <article class="premium-metric-card"><i>${icon('users')}</i><div><strong>${students.length}</strong><span>Connected students</span></div></article>
        <article class="premium-metric-card"><i>${icon('book')}</i><div><strong>${linkedEnrollments}</strong><span>Course enrollments</span></div></article>
        <article class="premium-metric-card"><i>${icon('check')}</i><div><strong>${activeStudents}</strong><span>Active learners</span></div></article>
      </div>
      ${students.length?`<div class="instructor-student-grid">${students.map(s=>{
        const courses=Array.isArray(s.courses)?s.courses:[];
        const courseNames=courses.slice(0,2).map(c=>c.title).filter(Boolean);
        const extra=Math.max(0,courses.length-courseNames.length);
        return `<article class="panel instructor-student-card backend-linked-card" data-action="instructor-view-student" data-id="${s.id}" role="button" tabindex="0">
          <div class="people-row"><span class="avatar">${initials(s.name)}</span><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.student_code||'Academy ID pending')} · ${escapeHtml(s.branch||s.batch_branch||'No branch')}</small></div><span class="backend-dot" title="Backend connected"></span></div>
          <p>${escapeHtml(s.headline||'Academy learner')}</p>
          <div class="student-course-tags">${courseNames.length?courseNames.map(name=>`<span>${escapeHtml(name)}</span>`).join(''):'<span>No instructor course linked</span>'}${extra?`<span>+${extra} more</span>`:''}</div>
          <div class="student-card-footer"><span>${escapeHtml(instructorStudentStatusLabel(s.academic_status))}</span><button class="button button-secondary button-sm" type="button" data-action="instructor-view-student" data-id="${s.id}">View Student</button></div>
        </article>`;
      }).join('')}</div>`:`<div class="empty-state"><h3>No students connected</h3><p>No learner is currently enrolled in a course assigned to this instructor. Once an administrator enrolls a student into one of your courses, the student will appear here automatically.</p></div>`}`;
    instructorShell('instructor-students',content,'My Students','Live backend learner records for the courses assigned to you.');
  }

  function renderInstructorCertificates(){
    const rows=state.instructorData.certifications||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Certificates</span><p>Official certificates are generated from the backend after a student is marked Completed. Instructors can view certificate status here but cannot directly publish or delete academy certificates.</p></div></div>${rows.length?`<div class="classroom-list">${rows.map(c=>`<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('award')}</span><div><span class="course-category">${escapeHtml(c.student_name||'Student')} ${c.student_code?`· ${escapeHtml(c.student_code)}`:''}</span><h3>${escapeHtml(c.title||'Certificate')}</h3><p>${escapeHtml(c.issuer||'Full Stack Academy')}${c.credential_id?` · ${escapeHtml(c.credential_id)}`:''}</p></div><span class="status-pill status-${escapeHtml(c.status||'pending')}">${escapeHtml(c.status||'pending')}</span></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>No certificates yet</h3><p>Certificates generated by the academy backend will appear here.</p></div>`}`;
    instructorShell('instructor-certificates',content,'Certificates','Official certificate records are controlled by academy administration.');
  }

  function renderInstructorRequests(){
    const profiles=state.instructorData.profile_requests||[],certs=state.instructorData.certificate_requests||[];
    const rows=[...profiles.map(x=>({kind:'Profile update',student:x.student_name,status:x.status,date:x.created_at})),...certs.map(x=>({kind:x.title,student:x.student_name,status:x.status,date:x.created_at}))];
    const content=rows.length?`<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Request</th><th>Student</th><th>Status</th><th>Submitted</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.kind)}</td><td>${escapeHtml(r.student)}</td><td><span class="status-pill status-${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td><td>${new Date(r.date).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><h3>No approval requests</h3><p>Requests you submit for students will appear here.</p></div>`;
    instructorShell('instructor-requests',content,'Approval Status','Track profile and certification submissions reviewed by administrators.');
  }

  function instructorCourses(){return state.instructorData.courses||[];}
  function classroomDate(value){if(!value)return 'No date set';const d=new Date(value);return Number.isNaN(d.getTime())?String(value):d.toLocaleString(siteSettings.locale||'en-IN',{dateStyle:'medium',timeStyle:'short'});}
  function classroomDateInput(value){return value?String(value).slice(0,16):'';}
  function sqlDateTime(value){return String(value||'').trim().replace('T',' ').slice(0,19);}
  function liveStatus(item){
    const raw=String(item?.status||'scheduled').toLowerCase();
    if(raw==='cancelled') return 'cancelled';

    const start=item?.starts_at?new Date(item.starts_at):null;
    const end=item?.ends_at?new Date(item.ends_at):null;
    const now=Date.now();
    const startMs=start&&!Number.isNaN(start.getTime())?start.getTime():null;
    const endMs=end&&!Number.isNaN(end.getTime())?end.getTime():null;

    // Guard against stale DB rows. A future class can never be LIVE NOW merely
    // because its stored status accidentally remained "live".
    if(raw==='live' && startMs!==null && now < startMs-(15*60*1000)) return 'scheduled';

    // Once the class end time has passed, move it out of Live/Upcoming.
    if(endMs!==null && now > endMs) return 'ended';

    // Safety fallback for older rows with no ends_at.
    if(endMs===null && startMs!==null && now > startMs+(3*60*60*1000)) return 'ended';

    return raw;
  }

  function liveTiming(item){
    const status=liveStatus(item),
      start=item?.starts_at?new Date(item.starts_at):null,
      end=item?.ends_at?new Date(item.ends_at):null,
      backendUnlock=item?.start_available_at?new Date(item.start_available_at):null,
      now=Date.now();

    const startMs=start&&!Number.isNaN(start.getTime())?start.getTime():null;
    const endMs=end&&!Number.isNaN(end.getTime())?end.getTime():null;
    const unlockMs=backendUnlock&&!Number.isNaN(backendUnlock.getTime())
      ? backendUnlock.getTime()
      : (startMs===null?null:startMs-(15*60*1000));

    const canStart=status==='scheduled' && (unlockMs===null || now>=unlockMs);
    const waiting=status==='scheduled' && unlockMs!==null && now<unlockMs;
    const minutes=startMs===null?0:Math.max(0,Math.ceil((startMs-now)/60000));
    return {status,startMs,endMs,unlockMs,canStart,waiting,minutes};
  }

  function liveWaitLabel(item){
    const timing=liveTiming(item);
    if(timing.status==='live')return 'Live now';
    if(timing.status==='ended')return 'Class ended';
    if(timing.waiting)return timing.minutes>=60?`Starts in ${Math.ceil(timing.minutes/60)} hr`:`Starts in ${timing.minutes} min`;
    if(timing.status==='scheduled')return 'Ready to start';
    return timing.status;
  }

  function mountedZoomIframe(){
    return document.querySelector('#inlineLiveStage iframe[src*="zoom-room.php"]');
  }

  function embeddedZoomIsMounted(kind=''){
    const frame=mountedZoomIframe();
    if(!frame)return false;
    if(kind==='instructor' && state.currentPath!=='/instructor-live')return false;
    if(kind==='student' && state.currentPath!=='/live-classes')return false;
    return true;
  }

  function stopLiveAutoRefreshWhileZoomMounted(){
    if(!mountedZoomIframe())return false;
    if(state.liveRefreshTimer){
      clearTimeout(state.liveRefreshTimer);
      state.liveRefreshTimer=null;
    }
    if(state.instructorStartUnlockTimer){
      clearTimeout(state.instructorStartUnlockTimer);
      state.instructorStartUnlockTimer=null;
    }
    return true;
  }

  function scheduleLivePageRefresh(kind){
    // IMPORTANT: renderStudentLiveClasses/renderInstructorLive rebuilds #app.
    // Rebuilding while Zoom is mounted destroys the iframe, so Zoom joins again.
    // Once a user has opened the classroom, keep that DOM node untouched.
    if(embeddedZoomIsMounted(kind)){
      stopLiveAutoRefreshWhileZoomMounted();
      return;
    }

    if(state.liveRefreshTimer)clearTimeout(state.liveRefreshTimer);
    state.liveRefreshTimer=setTimeout(async()=>{
      state.liveRefreshTimer=null;

      // Check again at execution time. The user may have joined Zoom after
      // this timer was originally scheduled.
      if(embeddedZoomIsMounted(kind)){
        stopLiveAutoRefreshWhileZoomMounted();
        return;
      }

      try{
        if(kind==='instructor' && state.currentPath==='/instructor-live'){
          await syncInstructorData();
          if(!embeddedZoomIsMounted('instructor')){
            renderInstructorLive();
            initPage();
          }
        }else if(kind==='student' && state.currentPath==='/live-classes'){
          await syncStudentData();
          if(!embeddedZoomIsMounted('student')){
            renderStudentLiveClasses();
            initPage();
          }
        }
      }catch(error){
        console.warn('Live class refresh failed',error);
      }
    },15000);
  }

  function scheduleInstructorStartUnlock(rows){
    if(state.instructorStartUnlockTimer){
      clearTimeout(state.instructorStartUnlockTimer);
      state.instructorStartUnlockTimer=null;
    }
    if(state.currentPath!=='/instructor-live')return;
    if(embeddedZoomIsMounted('instructor'))return;

    const now=Date.now();
    const waiting=(rows||[])
      .map(item=>({item,timing:liveTiming(item)}))
      .filter(x=>x.timing.status==='scheduled' && x.timing.unlockMs!==null && x.timing.unlockMs>now)
      .sort((a,b)=>a.timing.unlockMs-b.timing.unlockMs);

    if(!waiting.length)return;

    const delay=Math.max(250,Math.min(2147483000,waiting[0].timing.unlockMs-now+250));
    state.instructorStartUnlockTimer=setTimeout(async()=>{
      state.instructorStartUnlockTimer=null;
      if(state.currentPath!=='/instructor-live')return;
      if(embeddedZoomIsMounted('instructor'))return;
      try{
        await syncInstructorData();
        if(embeddedZoomIsMounted('instructor'))return;
        renderInstructorLive();
        initPage();
        toast('Your scheduled class is ready to start.');
      }catch(error){
        console.warn('Could not unlock scheduled class automatically',error);
      }
    },delay);
  }

  function branchDetailUrl(branch){return `branches/view/index.html?branch=${encodeURIComponent(branch.slug||branch.id)}`;}
  function syncBranchChrome(){
    const rows=D.branches||[];
    const grid=document.querySelector('.branch-mega-grid');
    if(grid)grid.innerHTML=rows.map((b,i)=>`<a class="branch-mega-card" href="${branchDetailUrl(b)}"><span class="branch-mega-image">${b.image?`<img src="${escapeHtml(b.image)}" alt="${escapeHtml(b.name)}" loading="lazy">`:''}<b>${String(i+1).padStart(2,'0')}</b></span><span class="branch-mega-card-copy"><small>${escapeHtml(b.location)}</small><strong>${escapeHtml(b.name)}</strong><em>View branch details</em></span></a>`).join('');
    const mobile=document.querySelector('.mobile-branch-links');if(mobile)mobile.innerHTML=rows.map((b,i)=>`<a href="${branchDetailUrl(b)}"><b>${String(i+1).padStart(2,'0')}</b> ${escapeHtml(b.shortName||b.name)}</a>`).join('');
    const count=document.querySelector('.branch-mega-kicker');if(count)count.textContent=`${rows.length} Hyderabad Centres`;
    const mobileCount=document.querySelector('.mobile-branch-main span');if(mobileCount)mobileCount.textContent=`${String(rows.length).padStart(2,'0')} Centres`;
    document.querySelectorAll('footer a[href="#/branches"]').forEach(a=>{if(a.textContent.includes('·'))a.textContent=rows.map(b=>b.shortName||String(b.name).replace(/^FSA\s*[—-]\s*/, '')).join(' · ');});
  }
  function syncCourseMegaMenu(){
    const grid=document.querySelector('.course-mega-grid');if(!grid)return;
    grid.innerHTML=(D.content?.courseNavigation||[]).map(c=>`<a class="course-mega-item" href="#/courses?q=${encodeURIComponent(c.query||'')}"><span class="mega-icon" data-premium-icon="${escapeHtml(c.icon||'book')}"></span><span><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.caption||'')}</small></span></a>`).join('');
  }

  function applyBackendCatalog(catalog={}){
    if(catalog.site){D.site=catalog.site;applySiteSettings(catalog.site);}
    if(catalog.content){D.content=catalog.content;D.stats=catalog.content.stats||[];D.faqs=catalog.content.faqs||[];D.academyImages=catalog.content.academyImages||{};window.FSA_CONTENT?.set(catalog.content);}

    ['courses','plans','branches','instructors','batches','companies','alumni','candidates','events','reviews'].forEach(key=>{
      if(Array.isArray(catalog[key])) D[key]=catalog[key];
    });
    D.categories=[...new Set((D.courses||[]).map(c=>c.category).filter(Boolean))].map(name=>({name,count:D.courses.filter(c=>c.category===name).length}));
    syncBranchChrome();syncCourseMegaMenu();
    document.dispatchEvent(new CustomEvent('fsa:catalog-updated'));

  }
  async function refreshCatalogData(){const catalog=await apiRequest('catalog');applyBackendCatalog(catalog);}
  function instructorCourseById(id){return instructorCourses().find(c=>Number(c.id)===Number(id));}
  function instructorCourseOptions(selected=''){return instructorCourses().map(c=>`<option value="${c.id}" ${Number(selected)===Number(c.id)?'selected':''}>${escapeHtml(c.title)}</option>`).join('');}
  function instructorLessonOptions(courseId,selected=''){
    const course=instructorCourseById(courseId), options=['<option value="">Whole course / no specific lesson</option>'];
    lessonEntries(course||{}).forEach(item=>options.push(`<option value="${item.key}" ${String(selected)===item.key?'selected':''}>${escapeHtml(item.moduleTitle)} — ${escapeHtml(item.title)}</option>`));return options.join('');
  }

  function instructorModeEnabled(course,mode){
    const modes=Array.isArray(course?.deliveryModes)&&course.deliveryModes.length?course.deliveryModes:(Array.isArray(course?.delivery_modes)?course.delivery_modes:[course?.deliveryMode||'offline']);
    return modes.includes(mode);
  }
  function instructorModeStatus(enabled){return `<span class="instructor-mode-status ${enabled?'is-enabled':'is-disabled'}">${enabled?'Enabled':'Not enabled by Admin'}</span>`;}
  function instructorModeCard(course,mode,stats={}){
    const enabled=instructorModeEnabled(course,mode);
    const labels={offline:['Offline / Physical','Build the full classroom course content students use after an Offline enrollment.','classroom'],live:['Live','Schedule and teach Zoom classes for this assigned course.','radio'],recorded:['Recorded','Manage the Bunny Stream recorded-course lecture library.','video']};
    const [title,desc,iconName]=labels[mode];
    let action='';
    if(mode==='offline') action=`<button class="button ${enabled?'button-primary':'button-secondary'} button-sm" type="button" data-action="instructor-offline-course-edit" data-id="${course.id}" ${enabled?'':'disabled'}>${icon('edit')} Prepare Offline Course</button>`;
    if(mode==='live') action=enabled?`<a class="button button-primary button-sm" href="#/instructor-live">${icon('radio')} Open Live Classroom</a>`:`<button class="button button-secondary button-sm" disabled>${icon('radio')} Live not enabled</button>`;
    if(mode==='recorded') action=enabled?`<a class="button button-primary button-sm" href="#/instructor-recorded-lectures">${icon('video')} Manage Recorded Lectures</a>`:`<button class="button button-secondary button-sm" disabled>${icon('video')} Recorded not enabled</button>`;
    const meta=mode==='offline'?`${Number(course.lessons||0)} approved lesson${Number(course.lessons||0)===1?'':'s'}`:mode==='live'?`${Number(stats.live||0)} scheduled/live class${Number(stats.live||0)===1?'':'es'}`:`${Number(stats.recorded||0)} recorded lecture${Number(stats.recorded||0)===1?'':'s'}`;
    return `<article class="instructor-mode-card ${enabled?'is-enabled':'is-disabled'}" data-mode="${mode}"><div class="instructor-mode-icon">${icon(iconName)}</div><div class="instructor-mode-copy"><div class="instructor-mode-title"><strong>${title}</strong>${instructorModeStatus(enabled)}</div><p>${desc}</p><small>${meta}</small></div><div class="instructor-mode-action">${action}</div></article>`;
  }

  function instructorCourseSequence(courseId){
    const lectures=(state.instructorData.recorded_lectures||[]).filter(x=>Number(x.course_id)===Number(courseId)).map(x=>({...x,_type:'lecture',_order:Number(x.sort_order||0)}));
    const quizzes=(state.instructorData.quizzes||[]).filter(x=>Number(x.course_id)===Number(courseId)).map(x=>({...x,_type:'quiz',_order:Number(x.sequence_order??999)}));
    const assignments=(state.instructorData.assignments||[]).filter(x=>Number(x.course_id)===Number(courseId)).map(x=>({...x,_type:'assignment',_order:Number(x.sequence_order??999)}));
    return [...lectures,...quizzes,...assignments].sort((a,b)=>a._order-b._order||Number(a.id)-Number(b.id));
  }
  function sequenceTypeMeta(item){if(item._type==='lecture')return {label:'Video lecture',icon:'play',tone:'lecture'};if(item._type==='assignment')return {label:'Assignment',icon:'project',tone:'assignment'};if(item.quiz_type==='final')return {label:'Final quiz',icon:'award',tone:'final'};return {label:'Checkpoint quiz',icon:'note',tone:'quiz'};}
  function renderInstructorCourseManager(courseId){
    const course=instructorCourses().find(c=>Number(c.id)===Number(courseId));if(!course){instructorShell('instructor-courses','<div class="panel empty-state"><h3>Course not available</h3></div>','Manage Course','Course curriculum');return;}
    const sequence=instructorCourseSequence(courseId),nextOrder=sequence.length?Math.max(...sequence.map(x=>Number(x._order||0)))+1:1;
    const rows=sequence.length?sequence.map((item,index)=>{const meta=sequenceTypeMeta(item),published=item.status!=='draft',subtitle=item._type==='lecture'?`${Number(item.duration_minutes||0)||'—'} min · video lecture`:item._type==='quiz'?`${(item.questions||[]).length} questions · ${item.can_skip?'skippable':'required before continuing'}`:`${Number(item.points||100)} points${item.due_at?` · Due ${classroomDate(item.due_at)}`:''}`,edit=item._type==='lecture'?'instructor-recorded-lecture-edit':item._type==='quiz'?'instructor-quiz-edit':'instructor-assignment-edit',del=item._type==='lecture'?'instructor-recorded-lecture-delete':item._type==='quiz'?'instructor-quiz-delete':'instructor-assignment-delete';return `<article class="coursera-sequence-item ${meta.tone}"><div class="coursera-sequence-index">${index+1}</div><span class="coursera-sequence-icon">${icon(meta.icon)}</span><div class="coursera-sequence-copy"><div><span class="course-category">${meta.label}</span>${item._type==='quiz'&&item.quiz_type==='final'?'<span class="final-quiz-badge">Final</span>':''}${item._type==='quiz'&&!item.can_skip?'<span class="required-badge">Required</span>':''}</div><h3>${escapeHtml(item.title||meta.label)}</h3><p>${escapeHtml(subtitle)}</p><small>Position ${Number(item._order||0)} · ${published?'Published':'Draft'}</small></div><div class="coursera-sequence-actions">${item._type==='lecture'?`<a class="button button-secondary button-sm" href="#/instructor-recorded-lectures/${courseId}/${item.id}">Preview</a>`:item._type==='quiz'?`<button class="button button-secondary button-sm" type="button" data-action="course-quiz-results" data-id="${item.id}">Results</button>`:`<button class="button button-secondary button-sm" type="button" data-action="course-assignment-submissions" data-id="${item.id}">Submissions</button>`}<button class="button button-secondary button-sm" type="button" data-action="${edit}" data-id="${item.id}" data-course="${courseId}">${icon('edit')} Edit</button><button class="button button-ghost button-sm is-danger" type="button" data-action="${del}" data-id="${item.id}" data-course="${courseId}">${icon('trash')}</button></div><div class="coursera-insert-after"><span>Insert after</span><button type="button" data-action="course-sequence-add-quiz" data-course="${courseId}" data-sequence="${Number(item._order||0)+0.1}">+ Quiz</button><button type="button" data-action="course-sequence-add-assignment" data-course="${courseId}" data-sequence="${Number(item._order||0)+0.1}">+ Assignment</button></div></article>`;}).join(''):`<div class="panel empty-state"><h3>Start building the course</h3><p>Add videos, quizzes and assignments in the order students should follow.</p></div>`;
    const content=`<div class="course-manager-head"><a class="button button-secondary button-sm" href="#/instructor-courses">${icon('arrowLeft')} My Courses</a><div><span class="eyebrow">Course curriculum</span><h2>${escapeHtml(course.title)}</h2><p>One Coursera-style sequence. Put quizzes and assignments between any videos.</p></div></div><div class="course-manager-toolbar"><button class="button button-primary" type="button" data-action="instructor-recorded-lecture-new" data-course-id="${courseId}">${icon('plus')} Video Lecture</button><button class="button button-secondary" type="button" data-action="course-sequence-add-quiz" data-course="${courseId}" data-sequence="${nextOrder}">${icon('note')} Checkpoint Quiz</button><button class="button button-secondary" type="button" data-action="course-sequence-add-assignment" data-course="${courseId}" data-sequence="${nextOrder}">${icon('project')} Assignment</button><button class="button button-secondary final-quiz-button" type="button" data-action="course-sequence-add-final-quiz" data-course="${courseId}" data-sequence="${Math.max(9999,nextOrder)}">${icon('award')} Final Quiz</button></div><section class="course-sequence-list">${rows}</section>`;
    instructorShell('instructor-courses',content,'Manage Course','Lectures, quizzes and assignments in one ordered learning path.');
  }

  function openCourseQuizResults(quizId){const quiz=(state.instructorData.quizzes||[]).find(x=>Number(x.id)===Number(quizId)),rows=(state.instructorData.quiz_attempts||[]).filter(x=>Number(x.quiz_id)===Number(quizId));if(!quiz)return;openClassroomModal(`${quiz.title} — Results`,`${rows.length} submitted attempt${rows.length===1?'':'s'}`,rows.length?`<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Student</th><th>Score</th><th>Percent</th><th>Submitted</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.student_name||r.student_email||'Student')}</td><td>${Number(r.score||0)}/${Number(r.max_score||0)}</td><td><strong>${Number(r.percent||0)}%</strong></td><td>${classroomDate(r.submitted_at)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state compact"><p>No student has attempted this quiz yet.</p></div>');}
  function openCourseAssignmentSubmissions(assignmentId){const a=(state.instructorData.assignments||[]).find(x=>Number(x.id)===Number(assignmentId)),rows=(state.instructorData.submissions||[]).filter(x=>Number(x.assignment_id)===Number(assignmentId));if(!a)return;openClassroomModal(`${a.title} — Submissions`,`${rows.length} submission${rows.length===1?'':'s'}`,rows.length?`<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Student</th><th>Status</th><th>Grade</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.student_name||r.student_email||'Student')}</td><td><span class="status-pill">${escapeHtml(r.status||'submitted')}</span></td><td>${r.grade===null||r.grade===undefined?'—':`${Number(r.grade)}/${Number(r.points||a.points||0)}`}</td><td><button class="button button-secondary button-sm" type="button" data-action="instructor-grade-submission" data-id="${r.id}">Review</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state compact"><p>No submissions yet.</p></div>');}

  function renderInstructorCourses(){
    const courses=instructorCourses(), quizzes=state.instructorData.quizzes||[], assignments=state.instructorData.assignments||[], liveRows=state.instructorData.live_sessions||[], recordedRows=state.instructorData.recorded_lectures||[];
    const content=`<section class="instructor-public-course-cta"><div class="instructor-public-course-cta-copy"><span class="eyebrow">COURSE AUTHORING</span><h2>Create a public course</h2><p>Use the same course editor as Academy Admin. Your submission stays unpublished until approved by your Branch Head, Branch Admin, Admin Staff or Super Admin.</p></div><a class="button button-primary instructor-public-course-button" href="admin/index.html?courseEditor=new&amp;mode=offline#courses" target="_blank" rel="noopener">${icon('plus')} Create Public Course ${icon('arrow')}</a></section><section class="instructor-course-page-intro"><div><span class="eyebrow">Assigned courses</span><h2>Your teaching workspaces</h2><p>Every assigned course shows all three delivery types. Admin controls which modes are sold; you prepare the learning content for the modes enabled on your course.</p></div><div class="instructor-mode-legend"><span>${icon('classroom')} Offline</span><span>${icon('radio')} Live</span><span>${icon('video')} Recorded</span></div></section>${courses.length?`<div class="instructor-course-grid instructor-mode-course-grid">${courses.map(c=>{
      const quizCount=quizzes.filter(q=>Number(q.course_id)===Number(c.id)).length;
      const assignmentCount=assignments.filter(a=>Number(a.course_id)===Number(c.id)).length;
      const liveCount=liveRows.filter(row=>Number(row.course_id)===Number(c.id)).length;
      const recordedCount=recordedRows.filter(row=>Number(row.course_id)===Number(c.id)).length;
      const pending=String(c.approvalStatus||'approved')==='pending';
      const publicationReview=String(c.publicApprovalStatus||'approved').toLowerCase();
      const publicDraft=publicationReview==='pending'||publicationReview==='rejected';
      const publicReviewBadge=publicDraft?`<span class="status-pill ${publicationReview==='pending'?'status-pending':'status-rejected'}">${publicationReview==='pending'?'Public course: awaiting approval':'Public course: changes requested'}</span>`:'';
      const publicDraftEdit=publicDraft?`<a class="button button-secondary button-sm" href="admin/index.html?courseEditor=${Number(c.id)}&amp;mode=offline#courses" target="_blank" rel="noopener">${icon('edit')} Edit Public Draft</a>`:'';
      return `<article class="panel instructor-course-card instructor-course-card-v111"><header class="instructor-course-summary"><div class="instructor-course-thumb">${c.image?imageMarkup(c.image,c.title,initials(c.title)):`<span>${icon('book')}</span>`}</div><div class="instructor-course-summary-copy"><div class="instructor-course-summary-top"><span class="course-category">${escapeHtml(c.category)}</span><span class="status-pill ${pending?'status-pending':''}">${pending?'Content pending approval':escapeHtml(c.approvalStatus||'approved')}</span>${publicReviewBadge}</div><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.short||'Assigned academy course')}</p><div class="instructor-course-summary-meta"><span>${icon('book')} ${Number(c.lessons||0)} lessons</span><span>${icon('users')} Assigned instructor course</span>${c.branchName?`<span>${icon('map')} ${escapeHtml(c.branchName)}</span>`:''}</div></div>${c.visibility!=='private'&&c.status==='published'?`<a class="button button-secondary button-sm instructor-course-view" href="#/course/${encodeURIComponent(c.slug)}" target="_blank">View Course</a>`:''}</header><div class="instructor-three-modes">${instructorModeCard(c,'offline',{live:liveCount,recorded:recordedCount})}${instructorModeCard(c,'live',{live:liveCount,recorded:recordedCount})}${instructorModeCard(c,'recorded',{live:liveCount,recorded:recordedCount})}</div><footer class="instructor-coursework-strip coursera-coursework-strip"><div><span>${icon('book')}</span><strong>Course curriculum</strong><small>${recordedCount} lecture${recordedCount===1?'':'s'} · ${quizCount} quiz${quizCount===1?'':'zes'} · ${assignmentCount} assignment${assignmentCount===1?'':'s'}</small></div><div class="instructor-course-card-actions">${publicDraftEdit}${instructorModeEnabled(c,'offline')?`<button class="button button-secondary button-sm" type="button" data-action="instructor-offline-course-edit" data-id="${c.id}">${icon('edit')} Edit Course</button>`:''}<a class="button button-primary button-sm" href="#/instructor-course-manage/${c.id}">Manage Course Curriculum ${icon('arrow')}</a></div></footer></article>`;
    }).join('')}</div>`:`<div class="empty-state"><span class="empty-icon">${icon('book')}</span><h3>No courses yet</h3><p>Create your first public course for approval using the button above, or ask your branch administration to assign an existing course to your account.</p></div>`}`;
    instructorShell('instructor-courses',content,'My Courses','Manage Offline course content, Live teaching and Recorded lectures for every assigned course.');
  }

  function renderInstructorLive(){
    ensureLiveLearningLayoutStyles();ensureLiveV80Styles();ensureLiveV81Styles();ensureLiveV82Styles();ensureLiveV83Styles();ensureLiveV89Styles();
    const allRows=state.instructorData.live_sessions||[];
    const allRecordings=state.instructorData.recordings||[];
    const rows=filterLiveCourse(allRows,'instructor');
    const recordings=filterLiveCourse(allRecordings,'instructor');
    const live=rows.filter(item=>liveStatus(item)==='live').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0));
    const scheduled=rows.filter(item=>liveStatus(item)==='scheduled').sort((a,b)=>new Date(a.starts_at||0)-new Date(b.starts_at||0));
    const ready=scheduled.filter(item=>liveTiming(item).canStart);
    const liveItem=live[0]||null;
    const next=ready[0]||scheduled[0]||null;

    if(state.selectedInstructorLiveId && !live.some(item=>Number(item.id)===Number(state.selectedInstructorLiveId))){
      state.selectedInstructorLiveId=null;
    }

    const content=`<div class="live-learning-stack">
      <div class="live-workspace-toolbar">
        <div class="live-workspace-copy"><span class="eyebrow">Live course workspace</span><p>Select an assigned course, teach inside the embedded Zoom classroom, finalize the recording, and manage the upcoming timetable.</p></div>
        <div class="live-workspace-actions">
          <a class="button button-secondary" href="#/instructor-recordings">${icon('play')} Recorded Classes</a>
          <button class="button button-primary" data-action="instructor-live-new" ${instructorCourses().length?'':'disabled'}>+ Schedule Class / Month</button>
        </div>
      </div>
      ${liveCourseFilterMarkup('instructor',allRows,allRecordings)}
      ${liveTheaterMarkup({liveItem,nextItem:next,mode:'host',recordings,selectedId:state.selectedInstructorLiveId,selectedRecordingId:state.selectedInstructorRecordingId})}
      <section class="panel live-learning-section">
        <div class="live-learning-head">
          <div><span class="eyebrow">Teaching calendar</span><h2>Upcoming scheduled lectures</h2><p>Start becomes available 15 minutes before the scheduled time. Every schedule row is stored in MySQL.</p></div>
          <span class="live-learning-count">${scheduled.length}</span>
        </div>
        ${upcomingLectureGridMarkup(scheduled,'host')}
      </section>
    </div>`;
    instructorShell('instructor-live',content,'Live Classes','Live classroom on the left, recordings on the right, and the complete upcoming schedule below.');
    scheduleLivePageRefresh('instructor');
    scheduleInstructorStartUnlock(scheduled);
    initLiveCountdowns();
    scheduleLiveTheaterRailSync();
  }

  function openInstructorRecordingForm(recording=null){
    const courses=instructorCourses();
    const selected=Number(recording?.course_id||courses[0]?.id||0);
    openClassroomModal(recording?'Edit recording':'Add recording','Choose the course and add the recording URL, title and short description. Latest recordings are shown first.',`<form id="instructorRecordingForm" class="auth-form"><input type="hidden" name="id" value="${recording?.id||''}"><div class="form-grid">
      <div class="form-group full"><label>Course</label><select class="form-control" name="course_id" required>${courses.map(c=>`<option value="${c.id}" ${Number(c.id)===selected?'selected':''}>${escapeHtml(c.title)}</option>`).join('')}</select></div>
      <div class="form-group full"><label>Recording title</label><input class="form-control" name="title" required value="${escapeHtml(recording?.title||'')}"></div>
      <div class="form-group full"><label>Short description</label><textarea class="form-control" name="description" rows="4" placeholder="What was covered in this class?">${escapeHtml(recording?.description||'')}</textarea></div>
      <div class="form-group full"><label>Recording URL</label><input class="form-control" type="url" name="recording_url" required value="${escapeHtml(recording?.recording_url||'')}" placeholder="https://..."></div>
      <div class="form-group"><label>Recorded on</label><input class="form-control" type="datetime-local" name="recorded_at" value="${recording?.recorded_at?String(recording.recorded_at).slice(0,16):new Date().toISOString().slice(0,16)}"></div>
    </div><button class="button button-primary button-block" type="submit">${recording?'Update Recording':'Add Recording'}</button></form>`);
  }

  function recordedLectureSource(raw){
    let value=String(raw||'').trim();
    if(!value)return {kind:'unknown',url:''};
    const iframe=value.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
    if(iframe)value=iframe[1];
    value=value.replace(/&amp;/g,'&').trim();
    let parsed=null;try{parsed=new URL(value,window.location.href);}catch(_){return {kind:'unknown',url:value};}
    const host=String(parsed.hostname||'').toLowerCase();
    const lower=value.toLowerCase();
    if((host==='iframe.mediadelivery.net'||host==='player.mediadelivery.net') && /^\/embed\/[^/]+\/[^/?#]+/i.test(parsed.pathname))return {kind:'bunny',url:parsed.toString()};
    if(/\.(mp4|webm|ogg)(\?|#|$)/i.test(lower))return {kind:'video',url:value};
    const yt=value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?/]+)/i);
    if(yt)return {kind:'youtube',url:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt[1])}?rel=0`};
    const vm=value.match(/vimeo\.com\/(\d+)/i);
    if(vm&&!host.includes('player.vimeo.com'))return {kind:'vimeo',url:`https://player.vimeo.com/video/${vm[1]}`};
    if(host.includes('player.vimeo.com'))return {kind:'vimeo',url:value};
    return {kind:'iframe',url:value};
  }

  function recordedLectureEmbed(url,title){
    const source=recordedLectureSource(url),safe=escapeHtml(source.url||'');
    if(source.kind==='video')return `<video id="recordedLectureVideo" controls playsinline preload="metadata" src="${safe}" aria-label="${escapeHtml(title||'Recorded lecture')}"></video>`;
    if(source.kind==='bunny')return `<iframe id="recordedLectureBunnyPlayer" class="recorded-lecture-bunny" data-provider="bunny" src="${safe}" title="${escapeHtml(title||'Recorded lecture')}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return `<iframe src="${safe}" title="${escapeHtml(title||'Recorded lecture')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }

  function recordedLectureGroups(rows=[]){
    const map=new Map();
    (Array.isArray(rows)?rows:[]).forEach(row=>{
      const courseId=Number(row.course_id||0);if(!courseId)return;
      if(!map.has(courseId))map.set(courseId,{id:courseId,title:row.course_title||'Recorded Course',slug:row.course_slug||'',image:row.course_image||'',items:[]});
      map.get(courseId).items.push(row);
    });
    return [...map.values()].map(group=>({...group,items:group.items.sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||Number(a.id)-Number(b.id))}));
  }

  function recordedCourseProgress(items=[]){
    if(!items.length)return 0;
    const total=items.reduce((sum,item)=>sum+(item.completed?100:Math.max(0,Math.min(100,Number(item.watched_percent||0)))),0);
    return Math.round(total/items.length);
  }

  function recordedTimeLabel(seconds=0){
    const value=Math.max(0,Math.floor(Number(seconds)||0));
    const hours=Math.floor(value/3600),minutes=Math.floor((value%3600)/60),secs=value%60;
    return hours>0?`${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`:`${minutes}:${String(secs).padStart(2,'0')}`;
  }

  function nextRecordedLecture(items=[]){
    if(!items.length)return null;
    const watched=[...items].filter(x=>x.last_watched_at||Number(x.last_position_seconds||0)>0).sort((a,b)=>{
      const ad=a.last_watched_at?new Date(a.last_watched_at).getTime():0,bd=b.last_watched_at?new Date(b.last_watched_at).getTime():0;
      if(ad!==bd)return bd-ad;
      return Number(b.last_position_seconds||0)-Number(a.last_position_seconds||0);
    });
    const active=watched.find(x=>!x.completed);if(active)return active;
    return items.find(x=>!x.completed)||watched[0]||items[0];
  }


  function latestRecordedLectureActivity(items=state.studentRecordedLectures||[]){
    const rows=[...(Array.isArray(items)?items:[])].filter(x=>x.last_watched_at||Number(x.last_position_seconds||0)>0||Number(x.watched_percent||0)>0);
    if(!rows.length)return null;
    rows.sort((a,b)=>{
      const ad=a.last_watched_at?new Date(a.last_watched_at).getTime():0,bd=b.last_watched_at?new Date(b.last_watched_at).getTime():0;
      if(ad!==bd)return bd-ad;
      return Number(b.last_position_seconds||0)-Number(a.last_position_seconds||0);
    });
    return rows.find(x=>!x.completed)||rows[0]||null;
  }

  function recordedStudentResumePath(){
    const recent=latestRecordedLectureActivity();
    return recent?`/recorded-lectures/${Number(recent.course_id)}/${Number(recent.id)}`:'';
  }

  function rememberRecordedStudentLocation(courseId,lectureId,seconds=0){
    try{
      localStorage.setItem('fsaRecordedStudentReturn',JSON.stringify({
        user:String(state.user?.email||state.user?.id||''),courseId:Number(courseId)||0,lectureId:Number(lectureId)||0,seconds:Math.max(0,Math.floor(Number(seconds)||0)),savedAt:Date.now()
      }));
    }catch(_){}
  }

  function renderRecordedLecturesEntry(){
    const path=recordedStudentResumePath();
    if(path){
      const hash=`#${path}`;
      if(window.location.hash!==hash){history.replaceState(null,'',hash);state.currentPath=path;}
      const p=path.split('/').filter(Boolean);
      renderRecordedLecturePlayer(Number(p[1]||0),Number(p[2]||0));
      return;
    }
    renderRecordedLecturesArchive();
  }

  let recordedLectureTrackingCleanup=null;
  let recordedLecturePreviewCleanup=null;
  let recordedDiscussionCleanup=null;
  let recordedLectureSeekHandler=null;
  let recordedLecturePlaybackContext={lectureId:0,seconds:0,duration:0,playing:false};

  function stopRecordedDiscussion(){
    if(typeof recordedDiscussionCleanup==='function'){try{recordedDiscussionCleanup();}catch(_){}}
    recordedDiscussionCleanup=null;
  }
  function stopRecordedLecturePreview(){
    if(typeof recordedLecturePreviewCleanup==='function'){try{recordedLecturePreviewCleanup();}catch(_){}}
    recordedLecturePreviewCleanup=null;
  }
  function setRecordedPlayingState(lectureId,playing){
    recordedLecturePlaybackContext.playing=Boolean(playing);
    document.querySelectorAll(`[data-recorded-lecture-id="${Number(lectureId)||0}"]`).forEach(el=>el.classList.toggle('is-playing',Boolean(playing)));
  }
  function updateRecordedDiscussionClock(seconds){
    const label=recordedTimeLabel(seconds);
    document.querySelectorAll('[data-role="discussion-current-time"]').forEach(el=>el.textContent=label);
  }

  function stopRecordedLectureTracking(){
    if(typeof recordedLectureTrackingCleanup==='function'){
      try{recordedLectureTrackingCleanup();}catch(_){}
    }
    recordedLectureTrackingCleanup=null;
    recordedLectureSeekHandler=null;
    recordedLecturePlaybackContext={lectureId:0,seconds:0,duration:0,playing:false};
  }

  function renderRecordedLecturesArchive(){
    stopRecordedLectureTracking();stopRecordedLecturePreview();stopRecordedDiscussion();
    const groups=recordedLectureGroups(state.studentRecordedLectures);
    const content=`<section class="recorded-lecture-archive-head"><div><span class="eyebrow">On-demand learning</span><h2>Recorded Course Archive</h2><p>Only courses purchased in Recorded mode appear here. Offline and Live purchases stay in their own classrooms. Bunny Stream playback and your exact watch position are stored in the backend.</p></div></section>${groups.length?`<div class="recorded-lecture-course-grid">${groups.map(group=>{
      const done=group.items.filter(x=>x.completed).length,pct=recordedCourseProgress(group.items),next=nextRecordedLecture(group.items);
      const resumeAt=Math.max(0,Number(next?.last_position_seconds||0));
      const status=next?.completed?'Course complete':resumeAt>5?`Resume ${escapeHtml(next.title)} at ${recordedTimeLabel(resumeAt)}`:Number(next?.watched_percent||0)>0?`Resume ${escapeHtml(next.title)}`:`Next: ${escapeHtml(next?.title||'Lecture 1')}`;
      return `<article class="panel recorded-lecture-course-card"><a class="recorded-lecture-course-cover" href="#/recorded-lectures/${group.id}/${next?.id||group.items[0].id}">${group.image?imageMarkup(group.image,group.title,initials(group.title)):`<span>${icon('play')}</span>`}<b>${group.items.length} lecture${group.items.length===1?'':'s'}</b></a><div class="recorded-lecture-course-copy"><span class="eyebrow">Recorded course</span><h3>${escapeHtml(group.title)}</h3><div class="recorded-progress-line"><span><i style="width:${pct}%"></i></span><strong>${pct}%</strong></div><p>${done} of ${group.items.length} completed</p><small class="recorded-next-label">${status}</small><a class="button button-primary" href="#/recorded-lectures/${group.id}/${next?.id||group.items[0].id}">${pct?'Continue learning':'Start lectures'} ${icon('arrow')}</a></div></article>`;
    }).join('')}</div>`:`<div class="panel empty-state"><span class="empty-icon">${icon('play')}</span><h3>No recorded lectures yet</h3><p>When your instructor publishes lectures for an enrolled course, that course will appear here automatically.</p></div>`}`;
    dashboardShell('recorded-lectures',content,'Recorded Lectures','Your course-by-course on-demand learning library.');
  }

  function recordedDiscussionMarkup(courseId,current,mode='student'){
    const lectureId=Number(current?.id||0);
    return `<section class="recorded-comments-panel" data-discussion-course="${Number(courseId)}" data-discussion-mode="${escapeHtml(mode)}">
      <div class="recorded-comments-head">
        <div><span class="eyebrow">Course discussion</span><h3>Questions & discussion</h3><p>Discuss this recorded course like a lesson comment section. Reply to classmates, attach files and reference the exact video time.</p></div>
      </div>
      <form id="recordedDiscussionForm" class="recorded-comment-composer" enctype="multipart/form-data">
        <input type="hidden" name="course_id" value="${Number(courseId)}"><input type="hidden" name="lecture_id" value="${lectureId}"><input type="hidden" name="video_seconds" value="0"><input type="hidden" name="attach_timestamp" value="0"><input type="hidden" name="reply_to_id" value="0">
        <div class="recorded-discussion-reply-preview" data-role="discussion-reply-preview" hidden><div><span>Replying to</span><strong data-role="discussion-reply-name"></strong><small data-role="discussion-reply-text"></small></div><button type="button" data-action="recorded-discussion-cancel-reply" aria-label="Cancel reply">${icon('x')}</button></div>
        <textarea name="message" rows="3" maxlength="5000" placeholder="Add a comment or ask a question about this course…"></textarea>
        <div class="recorded-comment-compose-row">
          <div class="recorded-comment-tools">
            <label class="recorded-discussion-attach" title="Attach file">${icon('upload')}<span>Attach file</span><input type="file" name="attachment" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp,.gif"></label>
            <button class="recorded-discussion-time" type="button" data-action="recorded-discussion-timestamp">${icon('clock')}<span>Video time <b data-role="discussion-current-time">0:00</b></span></button>
            <span class="recorded-discussion-file-name" data-role="discussion-file-name"></span>
          </div>
          <button class="recorded-discussion-send" type="submit"><span>Comment</span>${icon('arrow')}</button>
        </div>
        <div class="recorded-discussion-context" data-role="discussion-time-context" hidden>${icon('clock')} Linked to <strong>${escapeHtml(current?.title||'this lecture')}</strong> at <b data-role="discussion-attached-time">0:00</b><button type="button" data-action="recorded-discussion-remove-time">Remove</button></div>
      </form>
      <div class="recorded-comments-list" id="recordedDiscussionMessages"><div class="recorded-discussion-loading"><span></span><span></span><span></span> Loading discussion…</div></div>
    </section>`;
  }

  function recordedDiscussionMessageHtml(message){
    const role=message.sender_role==='instructor'?'Instructor':message.sender_role==='student'?'Student':'Academy';
    const avatar=message.sender_avatar?`<img src="${escapeHtml(siteAssetUrl(message.sender_avatar))}" alt="">`:escapeHtml(initials(message.sender_name||'User'));
    const attachment=message.has_attachment?`<a class="recorded-comment-attachment" href="${API_URL}?action=recorded_course_discussion_attachment&id=${Number(message.id)}" target="_blank" rel="noopener">${icon('download')}<span><strong>${escapeHtml(message.attachment_name||'Attachment')}</strong><small>Open attachment</small></span></a>`:'';
    const timeChip=message.video_seconds!==null&&message.lecture_id?`<button class="recorded-comment-video-ref" type="button" data-action="recorded-discussion-jump" data-course-id="${Number(message.course_id)}" data-lecture-id="${Number(message.lecture_id)}" data-seconds="${Number(message.video_seconds)}">${icon('play')}<span>${escapeHtml(message.lecture_title||'Lecture')} · ${recordedTimeLabel(message.video_seconds)}</span></button>`:'';
    const reply=message.reply_to_id?`<div class="recorded-comment-quoted"><strong>${escapeHtml(message.reply_sender_name||'Reply')}</strong><span>${escapeHtml((message.reply_message||'Original comment').slice(0,170))}</span></div>`:'';
    const body=message.deleted?`<p class="recorded-comment-deleted">${icon('trash')} Comment removed by moderator</p>`:`${reply}${message.message?`<p class="recorded-comment-text">${textHtml(message.message)}</p>`:''}${timeChip}${attachment}`;
    return `<article class="recorded-comment ${message.reply_to_id?'is-reply':''} ${message.sender_role==='instructor'?'is-instructor':''} ${message.deleted?'is-deleted':''}" data-message-id="${Number(message.id)}">
      <div class="recorded-comment-avatar">${avatar}</div>
      <div class="recorded-comment-main">
        <div class="recorded-comment-meta"><strong>${escapeHtml(message.sender_name||'Academy Member')}</strong>${message.sender_role==='instructor'?'<span class="recorded-comment-role">Instructor</span>':''}<time>${message.created_at?new Date(message.created_at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):''}</time></div>
        ${body}
        <div class="recorded-comment-actions">${!message.deleted?`<button type="button" data-action="recorded-discussion-reply" data-id="${Number(message.id)}" data-name="${escapeHtml(message.sender_name||'Member')}" data-text="${escapeHtml((message.message||message.attachment_name||'Attachment').slice(0,180))}">${icon('discussion')} Reply</button>`:''}${message.can_delete?`<button class="is-danger" type="button" data-action="recorded-discussion-delete" data-id="${Number(message.id)}">${icon('trash')} Delete</button>`:''}</div>
      </div>
    </article>`;
  }

  async function refreshRecordedDiscussion(courseId,{stickToBottom=false,silent=false}={}){
    const box=document.getElementById('recordedDiscussionMessages');if(!box)return;
    try{
      const beforeBottom=box.scrollHeight-box.scrollTop-box.clientHeight<90;
      const result=await apiRequest('recorded_course_discussion_list',{method:'POST',body:{course_id:Number(courseId)}});
      if(!document.getElementById('recordedDiscussionMessages'))return;
      const messages=Array.isArray(result.messages)?result.messages:[];
      const signature=messages.map(m=>`${m.id}:${m.deleted?1:0}:${m.message?.length||0}:${m.video_seconds??''}`).join('|');
      if(box.dataset.signature!==signature){
        box.dataset.signature=signature;
        box.innerHTML=messages.length?messages.map(recordedDiscussionMessageHtml).join(''):`<div class="recorded-discussion-empty">${icon('discussion')}<h3>Start the course discussion</h3><p>Ask the first question, share a resource or mention a moment from the video.</p></div>`;
        if(stickToBottom||beforeBottom)box.scrollTop=box.scrollHeight;
      }
    }catch(error){if(!silent)box.innerHTML=`<div class="recorded-discussion-error">${escapeHtml(error.message)}</div>`;}
  }

  function initRecordedDiscussion(courseId,current,mode='student'){
    stopRecordedDiscussion();
    const box=document.getElementById('recordedDiscussionMessages');if(!box)return;
    updateRecordedDiscussionClock(recordedLecturePlaybackContext.lectureId===Number(current?.id)?recordedLecturePlaybackContext.seconds:0);
    refreshRecordedDiscussion(courseId,{stickToBottom:true});
    const timer=setInterval(()=>refreshRecordedDiscussion(courseId,{silent:true}),4000);
    recordedDiscussionCleanup=()=>clearInterval(timer);
  }

  function initInstructorRecordedPreview(lecture){
    stopRecordedLecturePreview();
    const video=document.getElementById('recordedLectureVideo'),bunny=document.getElementById('recordedLectureBunnyPlayer');
    recordedLecturePlaybackContext={lectureId:Number(lecture.id),seconds:0,duration:0,playing:false};updateRecordedDiscussionClock(0);setRecordedPlayingState(lecture.id,false);
    let active=true;
    if(bunny&&window.playerjs&&typeof window.playerjs.Player==='function'){
      const player=new window.playerjs.Player(bunny);const parse=d=>{try{return typeof d==='string'?JSON.parse(d):d||{};}catch(_){return {};}};
      player.on('ready',()=>{try{const pending=JSON.parse(sessionStorage.getItem('fsaRecordedJump')||'null');if(pending&&Number(pending.lectureId)===Number(lecture.id)){sessionStorage.removeItem('fsaRecordedJump');setTimeout(()=>player.setCurrentTime(Math.max(0,Number(pending.seconds)||0)),250);}}catch(_){}});
      const onTime=d=>{const t=parse(d);recordedLecturePlaybackContext.seconds=Math.max(0,Number(t.seconds||0));recordedLecturePlaybackContext.duration=Math.max(0,Number(t.duration||0));updateRecordedDiscussionClock(recordedLecturePlaybackContext.seconds);};
      const onPlay=()=>setRecordedPlayingState(lecture.id,true),onPause=()=>setRecordedPlayingState(lecture.id,false),onEnded=()=>setRecordedPlayingState(lecture.id,false);
      player.on('timeupdate',onTime);player.on('play',onPlay);player.on('pause',onPause);player.on('ended',onEnded);recordedLectureSeekHandler=seconds=>{try{player.setCurrentTime(Math.max(0,Number(seconds)||0));}catch(_){}};
      recordedLecturePreviewCleanup=()=>{active=false;setRecordedPlayingState(lecture.id,false);recordedLectureSeekHandler=null;try{player.off('timeupdate',onTime);player.off('play',onPlay);player.off('pause',onPause);player.off('ended',onEnded);}catch(_){}};return;
    }
    if(video){video.addEventListener('loadedmetadata',()=>{try{const pending=JSON.parse(sessionStorage.getItem('fsaRecordedJump')||'null');if(pending&&Number(pending.lectureId)===Number(lecture.id)){sessionStorage.removeItem('fsaRecordedJump');setTimeout(()=>{video.currentTime=Math.max(0,Number(pending.seconds)||0);},100);}}catch(_){}} ,{once:true});const onTime=()=>{if(!active)return;recordedLecturePlaybackContext.seconds=video.currentTime||0;recordedLecturePlaybackContext.duration=video.duration||0;updateRecordedDiscussionClock(recordedLecturePlaybackContext.seconds);};const onPlay=()=>setRecordedPlayingState(lecture.id,true),onPause=()=>setRecordedPlayingState(lecture.id,false),onEnded=()=>setRecordedPlayingState(lecture.id,false);video.addEventListener('timeupdate',onTime);video.addEventListener('play',onPlay);video.addEventListener('pause',onPause);video.addEventListener('ended',onEnded);recordedLectureSeekHandler=seconds=>{try{video.currentTime=Math.max(0,Number(seconds)||0);}catch(_){}};recordedLecturePreviewCleanup=()=>{active=false;setRecordedPlayingState(lecture.id,false);recordedLectureSeekHandler=null;video.removeEventListener('timeupdate',onTime);video.removeEventListener('play',onPlay);video.removeEventListener('pause',onPause);video.removeEventListener('ended',onEnded);};}
  }

  function recordedLectureStrip(items=[],current,mode='student',courseId=0){
    const rows=Array.isArray(items)?items:[];
    return `<nav class="recorded-lecture-strip" aria-label="Course lectures"><div class="recorded-lecture-strip-track">${rows.map((r,i)=>{
      const active=Number(r.id)===Number(current?.id),done=Boolean(r.completed),published=r.status!=='draft';
      const href=mode==='instructor'?`#/instructor-recorded-lectures/${Number(courseId)}/${Number(r.id)}`:`#/recorded-lectures/${Number(courseId)}/${Number(r.id)}`;
      const progress=mode==='student'?(done?'Completed':Number(r.watched_percent||0)>0?`${Math.round(Number(r.watched_percent||0))}% watched`:'Not started'):(published?'Published':'Draft');
      return `<a class="recorded-lecture-step ${active?'active':''} ${done?'done':''}" data-recorded-lecture-id="${Number(r.id)}" href="${href}"><span class="recorded-lecture-step-number">${done?'✓':i+1}</span><span class="recorded-lecture-step-copy"><strong>${escapeHtml(r.title||`Lecture ${i+1}`)}</strong><small>${escapeHtml(progress)}</small></span>${active?`<span class="recorded-lecture-step-playing" aria-label="Current lecture"><i></i><i></i><i></i></span>`:''}</a>`;
    }).join('')}</div></nav>`;
  }

  function recordedFileSize(bytes=0){
    const n=Math.max(0,Number(bytes)||0);if(!n)return '';
    if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(n<10240?1:0)} KB`;
    return `${(n/1048576).toFixed(n<10485760?1:0)} MB`;
  }

  function recordedResourceListMarkup(current,mode='student'){
    const resources=Array.isArray(current?.resources)?current.resources:[];
    if(!resources.length)return `<div class="recorded-tab-empty">${icon('download')}<div><strong>No resources added yet</strong><p>Your instructor can attach PDFs, project files, archives, spreadsheets, images, source files or external links to each recorded lecture.</p></div></div>`;
    return `<div class="recorded-resource-list">${resources.map(resource=>{
      const url=resource.external_url?escapeHtml(resource.external_url):`${API_URL}?action=recorded_lecture_resource_download&id=${Number(resource.id)}`;
      const meta=[resource.original_name||'',recordedFileSize(resource.size_bytes),resource.mime_type||''].filter(Boolean).join(' · ');
      return `<article class="recorded-resource-card"><span class="recorded-resource-icon">${icon('download')}</span><div class="recorded-resource-copy"><strong>${escapeHtml(resource.title||resource.original_name||'Lecture resource')}</strong>${resource.description?`<p>${escapeHtml(resource.description)}</p>`:''}<small>${escapeHtml(meta||'Course resource')}</small></div><a class="button button-secondary button-sm" href="${url}" ${resource.external_url?'target="_blank" rel="noopener"':''}>Open</a>${mode==='instructor'?`<button class="button button-ghost button-sm is-danger" type="button" data-action="instructor-recorded-resource-delete" data-id="${Number(resource.id)}" data-lecture-id="${Number(current.id)}">${icon('trash')}</button>`:''}</article>`;
    }).join('')}</div>`;
  }

  function recordedLectureTabContent(courseId,current,tab='overview',mode='student'){
    if(tab==='notes'&&mode==='student')return `<div class="recorded-tab-panel"><div class="recorded-tab-heading"><span class="eyebrow">Private notes</span><h3>Your notes for ${escapeHtml(current.title)}</h3><p>Saved to your learner account and only visible to you.</p></div><textarea class="form-control recorded-note-area" id="recordedLectureNotes" placeholder="Write key ideas, questions, code snippets or revision notes...">${escapeHtml(current.note||'')}</textarea><button class="button button-primary button-sm" type="button" data-action="recorded-note-save" data-id="${Number(current.id)}">Save Notes</button></div>`;
    if(tab==='resources')return `<div class="recorded-tab-panel"><div class="recorded-tab-heading"><span class="eyebrow">Downloads & resources</span><h3>Lecture resources</h3><p>Files and links shared specifically for this recorded lecture.</p></div>${recordedResourceListMarkup(current,mode)}</div>`;
    if(tab==='discussion')return recordedDiscussionMarkup(courseId,current,mode);
    return `<div class="recorded-tab-panel recorded-overview-tab recorded-overview-simple">${current.description?`<p>${escapeHtml(current.description)}</p>`:`<p class="muted">No lecture overview has been added yet.</p>`}</div>`;
  }

  function studentRecordedSequence(courseId){
    const lectures=(state.studentRecordedLectures||[]).filter(x=>Number(x.course_id)===Number(courseId)).map(x=>({...x,_type:'lecture',_order:Number(x.sort_order||0),_complete:Boolean(x.completed)}));
    const work=(state.studentCoursework||[]).filter(x=>Number(x.course_id)===Number(courseId)&&['quiz','assignment'].includes(x.type)).map(x=>({...x,_type:x.type,_order:Number(x.sequence_order??999),_complete:Boolean(x.completed)}));
    return [...lectures,...work].sort((a,b)=>a._order-b._order||Number(a.id)-Number(b.id));
  }
  function recordedSequenceGate(sequence){const i=sequence.findIndex(x=>x._type==='quiz'&&!x.can_skip&&!x.completed&&Number(x.attempts_used||0)<1);return i<0?sequence.length:i;}
  function courseworkItemById(type,id){return (state.studentCoursework||[]).find(x=>x.type===type&&Number(x.id)===Number(id));}
  function recordedSequenceSidebar(courseId,currentLecture){
    const sequence=studentRecordedSequence(courseId),gate=recordedSequenceGate(sequence);
    return `<aside class="curriculum-sidebar recorded-course-sidebar coursera-student-sequence"><div class="curriculum-sidebar-head"><h2>Course content</h2><p class="muted">${sequence.filter(x=>x._complete).length} of ${sequence.length} items complete</p></div><div class="player-module-lessons">${sequence.map((item,index)=>{
      const locked=index>gate,meta=sequenceTypeMeta(item),active=item._type==='lecture'&&Number(item.id)===Number(currentLecture?.id),complete=Boolean(item._complete);let attrs='';
      if(item._type==='lecture')attrs=locked?'':`href="#/recorded-lectures/${courseId}/${item.id}"`;
      else if(item._type==='quiz')attrs=locked?'':`href="#/recorded-lectures/${courseId}/${Number(currentLecture?.id||0)}" data-action="student-open-course-quiz" data-id="${item.id}"`;
      else attrs=locked?'':`href="#/recorded-lectures/${courseId}/${Number(currentLecture?.id||0)}" data-action="student-open-course-assignment" data-id="${item.id}"`;
      const status=locked?'Locked':complete?'Completed':item._type==='quiz'?(item.can_skip?'Optional quiz':'Required quiz'):item._type==='assignment'?'Assignment':Number(item.watched_percent||0)>0?`${Math.round(Number(item.watched_percent))}% watched`:(item.duration_minutes?`${Number(item.duration_minutes)} min`:'Lecture');
      return `<a class="player-lesson recorded-sidebar-lesson course-sequence-student-item ${complete?'completed':''} ${active?'active':''} ${locked?'is-locked':''} ${meta.tone}" ${attrs}><span class="player-lesson-status">${locked?icon('lock'):complete?icon('check'):item._type==='quiz'?icon(item.quiz_type==='final'?'award':'note'):item._type==='assignment'?icon('project'):active?icon('play'):index+1}</span><span><strong>${escapeHtml(item.title||meta.label)}</strong><span>${escapeHtml(status)}</span></span>${active?'<span class="recorded-now-playing"><i></i><i></i><i></i></span>':''}</a>`;
    }).join('')}</div></aside>`;
  }

  function recordedSequenceNavMarkup(item,courseId,currentLectureId,direction='next'){
    const isPrev=direction==='previous',label=isPrev?'Previous':'Next',arrow=isPrev?`${icon('arrowLeft')} `:` ${icon('arrow')}`;
    if(!item)return `<button class="button button-secondary button-sm" type="button" disabled>${isPrev?arrow:''}${label}${!isPrev?arrow:''}</button>`;
    if(item._type==='lecture')return `<a class="button button-secondary button-sm" href="#/recorded-lectures/${courseId}/${item.id}">${isPrev?arrow:''}${label}${!isPrev?arrow:''}</a>`;
    const action=item._type==='quiz'?'student-open-course-quiz':'student-open-course-assignment';
    const itemLabel=item._type==='quiz'?(item.quiz_type==='final'?'Final Quiz':'Quiz'):'Assignment';
    return `<button class="button button-secondary button-sm sequence-nav-coursework" type="button" data-action="${action}" data-id="${item.id}" title="${escapeHtml(item.title||itemLabel)}">${isPrev?arrow:''}${isPrev?label:`${itemLabel} · ${label}`}${!isPrev?arrow:''}</button>`;
  }
  function openRecordedStudentQuiz(quizId){const quiz=courseworkItemById('quiz',quizId);if(!quiz)return toast('Quiz is not available.','error');const questions=Array.isArray(quiz.questions)?quiz.questions:[];if(!questions.length)return toast('This quiz has no questions yet.','error');const left=Math.max(0,Number(quiz.attempts_allowed||1)-Number(quiz.attempts_used||0));if(left<1)return toast('No quiz attempts remaining.','error');openStudentClassroomModal(quiz.title,`<div class="quiz-wizard-intro"><span class="eyebrow">${quiz.quiz_type==='final'?'Final Quiz':'Course Checkpoint'}</span><p>${escapeHtml(quiz.description||'Complete this quiz to continue.')}</p><div class="quiz-rule-row"><span>${quiz.can_skip?'Optional · you may skip':'Required before later content unlocks'}</span><span>${left} attempt${left===1?'':'s'} remaining</span></div><div class="quiz-wizard-progress"><div><strong data-role="quiz-step-label">Question 1 of ${questions.length}</strong><span>${questions.length} questions</span></div><div class="progress-track"><div class="progress-fill" data-role="quiz-progress-fill" style="width:${Math.round(100/questions.length)}%"></div></div></div></div><form id="studentQuizForm" class="auth-form student-quiz-wizard" data-step="0" data-recorded-course="${quiz.course_id}"><input type="hidden" name="quiz_id" value="${quiz.id}"><div class="student-quiz-steps">${questions.map((q,index)=>`<fieldset class="student-quiz-step ${index===0?'active':''}" data-step="${index}"><legend><span>${index+1}</span><span>${escapeHtml(q.question)}</span></legend><div class="quiz-option-list">${(q.options||[]).map((option,oi)=>`<label><input type="radio" name="q_${escapeHtml(q.id)}" value="${oi}"><span class="quiz-option-letter">${String.fromCharCode(65+oi)}</span><span>${escapeHtml(option)}</span></label>`).join('')}</div><small class="quiz-question-points">${Number(q.points||1)} point${Number(q.points||1)===1?'':'s'}</small></fieldset>`).join('')}</div><div class="quiz-wizard-nav"><button class="button button-secondary" type="button" data-action="student-quiz-prev" hidden>${icon('arrowLeft')} Previous</button><span>Submit to unlock the next required course item.</span><button class="button button-primary" type="button" data-action="student-quiz-next" ${questions.length===1?'hidden':''}>Next ${icon('arrow')}</button><button class="button button-primary" type="submit" data-role="quiz-submit" ${questions.length>1?'hidden':''}>Submit Quiz</button></div></form>`);}
  function openRecordedStudentAssignment(assignmentId){const a=courseworkItemById('assignment',assignmentId);if(!a)return toast('Assignment is not available.','error');openStudentClassroomModal(a.title,`<div class="assignment-brief premium"><div class="assignment-brief-top"><div><span class="course-category">Course Assignment</span><p>${textHtml(a.instructions||'Complete the assignment and submit your work below.')}</p></div><div class="assignment-meta"><span>${Number(a.points||0)} points</span>${a.due_at?`<span>Due ${classroomDate(a.due_at)}</span>`:'<span>No deadline</span>'}</div></div>${a.attachment_url?`<a class="assignment-resource-link" href="${escapeHtml(a.attachment_url)}" target="_blank" rel="noopener">${icon('download')}<span><strong>Instructor attachment</strong><small>Open the assignment resource</small></span>${icon('arrow')}</a>`:''}</div><form id="studentAssignmentForm" class="auth-form classroom-assignment-form" enctype="multipart/form-data" data-recorded-course="${a.course_id}"><input type="hidden" name="assignment_id" value="${a.id}"><input type="hidden" name="file_url" value=""><div class="form-group"><label>Written response</label><textarea class="form-control" rows="6" name="submission_text"></textarea></div><div class="form-group"><label>Attachment</label><label class="classroom-upload"><input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp"><span class="classroom-upload-icon">${icon('upload')}</span><span class="classroom-upload-copy"><strong>Choose a file</strong><small data-role="classroom-file-name">PDF, Office, ZIP, image or text · max 20 MB</small></span><span class="classroom-upload-button">Browse</span></label></div><button class="button button-primary button-block" type="submit">Turn In Assignment</button></form>`);}

  function recordedCurriculumSidebar(rows,current,mode='student'){
    const instructor=mode==='instructor',done=instructor?rows.filter(x=>x.status==='published').length:rows.filter(x=>x.completed).length;
    const summary=instructor?`${done} of ${rows.length} lectures published`:`${done} of ${rows.length} lectures complete`;
    return `<aside class="curriculum-sidebar recorded-course-sidebar"><div class="curriculum-sidebar-head"><h2>Course content</h2><p class="muted">${summary}</p></div><article class="player-module open"><button class="player-module-head" type="button"><span><strong>Recorded lectures</strong><span>${rows.length} lecture${rows.length===1?'':'s'}</span></span></button><div class="player-module-lessons">${rows.map((row,index)=>{
      const active=Number(row.id)===Number(current.id),status=instructor?(row.status==='published'?'Published':'Draft'):(row.completed?'Completed':Number(row.watched_percent||0)>0?`${Math.round(Number(row.watched_percent))}% watched`:(row.duration_minutes?`${Number(row.duration_minutes)} min`:'Not started'));
      const href=instructor?`#/instructor-recorded-lectures/${Number(row.course_id)}/${Number(row.id)}`:`#/recorded-lectures/${Number(row.course_id)}/${Number(row.id)}`;
      return `<a class="player-lesson recorded-sidebar-lesson ${!instructor&&row.completed?'completed':''} ${active?'active':''}" href="${href}" data-recorded-lecture-id="${Number(row.id)}"><span class="player-lesson-status">${!instructor&&row.completed?icon('check'):active?icon('play'):index+1}</span><span><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(status)}</span></span>${active?'<span class="recorded-now-playing"><i></i><i></i><i></i></span>':''}</a>`;
    }).join('')}</div></article></aside>`;
  }

  function renderRecordedLecturePlayer(courseId,lectureId=0){
    stopRecordedLectureTracking();stopRecordedLecturePreview();stopRecordedDiscussion();
    courseId=Number(courseId);
    const rows=(state.studentRecordedLectures||[]).filter(x=>Number(x.course_id)===courseId).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||Number(a.id)-Number(b.id));
    if(!rows.length){
      const empty=`<div class="recorded-library-toolbar premium-recorded-toolbar"><a href="#/recorded-lectures/archive">${icon('arrowLeft')}<span>Recorded Course Archive</span></a></div><div class="panel empty-state recorded-private-empty"><span class="empty-icon">${icon('play')}</span><h3>No recorded lectures yet</h3><p>This account only receives recorded lessons for courses purchased in Recorded mode. Ask the academy if you expected access here.</p><a class="button button-primary" href="#/my-courses">Back to My Courses</a></div>`;
      dashboardShell('recorded-lectures',empty,'Recorded Course','No recorded lectures are available for this purchase.');
      return;
    }

    const courseSequence=studentRecordedSequence(courseId),gate=recordedSequenceGate(courseSequence);
    let current=rows.find(x=>Number(x.id)===Number(lectureId))||nextRecordedLecture(rows)||rows[0];
    let currentSequenceIndex=courseSequence.findIndex(x=>x._type==='lecture'&&Number(x.id)===Number(current.id));
    if(currentSequenceIndex>gate){
      const fallback=[...courseSequence.slice(0,gate+1)].reverse().find(x=>x._type==='lecture');
      if(fallback){
        current=rows.find(x=>Number(x.id)===Number(fallback.id))||current;
        currentSequenceIndex=courseSequence.findIndex(x=>x._type==='lecture'&&Number(x.id)===Number(current.id));
        setTimeout(()=>toast('Complete the required quiz before continuing to later course items.','error'),0);
      }
    }

    const index=rows.findIndex(x=>Number(x.id)===Number(current.id));
    const sequenceDone=courseSequence.filter(x=>x._complete).length,pct=courseSequence.length?Math.round((sequenceDone/courseSequence.length)*100):recordedCourseProgress(rows);
    currentSequenceIndex=courseSequence.findIndex(x=>x._type==='lecture'&&Number(x.id)===Number(current.id));
    const previousSequence=currentSequenceIndex>0?courseSequence[currentSequenceIndex-1]:null;
    const nextSequence=currentSequenceIndex>=0&&currentSequenceIndex<courseSequence.length-1?courseSequence[currentSequenceIndex+1]:null;
    const resumeAt=Math.max(0,Number(current.last_position_seconds||0));
    const totalMinutes=rows.reduce((sum,x)=>sum+Number(x.duration_minutes||0),0);
    const courseTitle=current.course_title||'Recorded Course';
    rememberRecordedStudentLocation(courseId,current.id,resumeAt);
    if(!['overview','notes','resources','discussion'].includes(state.recordedLessonTab))state.recordedLessonTab='overview';

    const content=`<div class="recorded-library-toolbar premium-recorded-toolbar student-recorded-toolbar">
        <a href="#/recorded-lectures/archive">${icon('arrowLeft')}<span>Recorded Course Archive</span></a>
        <div class="recorded-toolbar-actions"><span class="recorded-toolbar-course">${escapeHtml(courseTitle)}</span><span class="recorded-learning-status ${pct>=100?'is-complete':pct>0?'is-active':'is-pending'}">${pct>=100?'Completed':pct>0?'In progress':'Not started'}</span></div>
      </div>
      <div class="recorded-course-overview compact-recorded-admin-stats recorded-student-course-stats">
        <article><span>${icon('play')}</span><div><strong>${courseSequence.length}</strong><small>Course items</small></div></article>
        <article><span>${icon('check')}</span><div><strong>${sequenceDone}</strong><small>Completed</small></div></article>
        <article><span>${icon('clock')}</span><div><strong>${totalMinutes?`${totalMinutes}m`:'—'}</strong><small>Video duration</small></div></article>
        <article><span>${icon('history')}</span><div><strong>${pct}%</strong><small>Course progress</small></div></article>
      </div>
      <section class="player-shell recorded-private-course-shell recorded-instructor-private-shell recorded-student-private-shell coursera-course-player">
        <div class="player-layout recorded-private-layout">
          <main class="lesson-stage recorded-private-stage">
            <div class="recorded-private-video">${recordedLectureEmbed(current.video_url,current.title)}</div>
            <div class="lesson-title-row recorded-private-title-row recorded-student-title-row">
              <div><span class="course-category">Recorded Course${current.completed?' · Completed':''}</span><h1>${escapeHtml(current.title)}</h1><p>Lecture ${index+1} of ${rows.length}${current.duration_minutes?` · ${Number(current.duration_minutes)} min`:''}${resumeAt>5&&!current.completed?` · Resume from ${recordedTimeLabel(resumeAt)}`:''}</p></div>
              <div class="lesson-nav-actions coursera-sequence-nav">
                ${recordedSequenceNavMarkup(previousSequence,courseId,current.id,'previous')}
                <button class="button ${current.completed?'button-secondary':'button-primary'} button-sm" type="button" data-action="recorded-lecture-complete" data-id="${current.id}" ${current.completed?'disabled':''}>${icon('check')} ${current.completed?'Completed':'Mark Complete'}</button>
                ${recordedSequenceNavMarkup(nextSequence,courseId,current.id,'next')}
              </div>
            </div>
            <div class="tabs recorded-private-tabs">${[['overview','Overview'],['notes','Notes'],['resources','Resources'],['discussion','Discussion']].map(([key,label])=>`<button class="tab-button ${state.recordedLessonTab===key?'active':''}" type="button" data-action="recorded-lesson-tab" data-tab="${key}">${label}</button>`).join('')}</div>
            <div id="recordedLessonTabPanel">${recordedLectureTabContent(courseId,current,state.recordedLessonTab,'student')}</div>
          </main>
          ${recordedSequenceSidebar(courseId,current)}
        </div>
      </section>`;

    dashboardShell('recorded-lectures',content,courseTitle,'Recorded course · Continue exactly where you left off.');
    setTimeout(()=>{
      initRecordedLectureTracking(current);
      if(state.recordedLessonTab==='discussion')initRecordedDiscussion(courseId,current,'student');
    },0);
  }

  function initRecordedLectureTracking(lecture){
    stopRecordedLectureTracking();
    const video=document.getElementById('recordedLectureVideo');
    const bunny=document.getElementById('recordedLectureBunnyPlayer');
    const saved=Math.max(0,Number(lecture.last_position_seconds||0));
    const originalPercent=Math.max(0,Number(lecture.watched_percent||0));
    let active=true;
    recordedLecturePlaybackContext={lectureId:Number(lecture.id),seconds:saved,duration:0,playing:false};
    updateRecordedDiscussionClock(saved);setRecordedPlayingState(lecture.id,false);

    const updateLocal=(seconds,duration,completed=false)=>{
      if(!active)return;
      const safeSeconds=Math.max(0,Math.floor(Number(seconds)||0));
      const percent=completed?100:(duration>0?Math.max(0,Math.min(100,(safeSeconds/duration)*100)):originalPercent);
      lecture.last_position_seconds=safeSeconds;
      lecture.watched_percent=Math.max(Number(lecture.watched_percent||0),percent);
      if(completed||percent>=95)lecture.completed=true;
      lecture.last_watched_at=new Date().toISOString();
      rememberRecordedStudentLocation(lecture.course_id,lecture.id,safeSeconds);
    };

    const touch=async()=>{try{await apiRequest('student_recorded_lecture_progress',{method:'POST',body:{lecture_id:lecture.id,position_seconds:saved,watched_percent:originalPercent,completed:Boolean(lecture.completed)}})}catch(_){}};

    if(bunny && window.playerjs && typeof window.playerjs.Player==='function'){
      const player=new window.playerjs.Player(bunny);
      let lastSave=0,lastSeconds=saved,lastDuration=0,finishing=false,resumePending=saved>5,resumeAttempts=0;
      const timers=[];
      const parseTiming=data=>{try{return typeof data==='string'?JSON.parse(data):data||{};}catch(_){return {};}};
      const attemptResume=()=>{
        if(!active||!resumePending||resumeAttempts>=6)return;
        resumeAttempts++;
        try{player.setCurrentTime(saved);}catch(_){}
      };
      const save=async(force=false,completed=false,keepalive=false)=>{
        if(!active||!lastDuration||!isFinite(lastDuration))return;
        if(resumePending && lastSeconds+3<saved)return;
        const now=Date.now();if(!force&&now-lastSave<5000)return;lastSave=now;
        const percent=completed?100:Math.max(0,Math.min(100,(lastSeconds/lastDuration)*100));
        updateLocal(lastSeconds,lastDuration,completed||percent>=95);
        try{await apiRequest('student_recorded_lecture_progress',{method:'POST',keepalive,body:{lecture_id:lecture.id,position_seconds:Math.floor(lastSeconds),watched_percent:percent,completed:completed||percent>=95}})}catch(_){}
      };
      const onReady=()=>{
        touch();
        try{const pending=JSON.parse(sessionStorage.getItem('fsaRecordedJump')||'null');if(pending&&Number(pending.lectureId)===Number(lecture.id)){sessionStorage.removeItem('fsaRecordedJump');setTimeout(()=>{try{player.setCurrentTime(Math.max(0,Number(pending.seconds)||0));}catch(_){}},350);}}catch(_){}
        if(resumePending){
          attemptResume();
          [250,700,1400,2400].forEach(ms=>timers.push(setTimeout(attemptResume,ms)));
        }
      };
      const onTimeUpdate=timingData=>{
        const data=parseTiming(timingData);
        const seconds=Math.max(0,Number(data.seconds||0)),duration=Math.max(0,Number(data.duration||0));
        if(duration>0)lastDuration=duration;
        lastSeconds=seconds;recordedLecturePlaybackContext.seconds=seconds;recordedLecturePlaybackContext.duration=lastDuration;updateRecordedDiscussionClock(seconds);
        if(resumePending){
          if(lastDuration>0 && saved>=lastDuration-3){resumePending=false;}
          else if(seconds+3<saved){attemptResume();return;}
          else resumePending=false;
        }
        save(false,false,false);
      };
      const onPlay=()=>setRecordedPlayingState(lecture.id,true);
      const onPause=()=>{setRecordedPlayingState(lecture.id,false);save(true,false,false);};
      const onEnded=async()=>{setRecordedPlayingState(lecture.id,false);if(finishing)return;finishing=true;resumePending=false;await save(true,true,false);await syncStudentData();renderRecordedLecturePlayer(lecture.course_id,lecture.id);initPage();};
      const flush=()=>{save(true,false,true);};
      const visibility=()=>{if(document.visibilityState==='hidden')flush();};
      player.on('ready',onReady);player.on('timeupdate',onTimeUpdate);player.on('play',onPlay);player.on('pause',onPause);player.on('ended',onEnded);
      recordedLectureSeekHandler=seconds=>{try{player.setCurrentTime(Math.max(0,Number(seconds)||0));}catch(_){}};
      window.addEventListener('pagehide',flush);window.addEventListener('beforeunload',flush);document.addEventListener('visibilitychange',visibility);
      recordedLectureTrackingCleanup=()=>{
        save(true,false,true);
        active=false;timers.forEach(clearTimeout);
        window.removeEventListener('pagehide',flush);window.removeEventListener('beforeunload',flush);document.removeEventListener('visibilitychange',visibility);
        setRecordedPlayingState(lecture.id,false);recordedLectureSeekHandler=null;
        try{player.off('ready',onReady);player.off('timeupdate',onTimeUpdate);player.off('play',onPlay);player.off('pause',onPause);player.off('ended',onEnded);}catch(_){}
      };
      return;
    }

    if(!video){touch();return;}
    let lastSave=0,resumePending=saved>5;
    const applyResume=()=>{
      if(!resumePending||!video.duration||!isFinite(video.duration))return;
      const target=Math.min(saved,Math.max(0,video.duration-1));
      if(target>5){try{video.currentTime=target;}catch(_){}}
    };
    const save=async(force=false,keepalive=false)=>{
      if(!active||!video.duration||!isFinite(video.duration))return;
      if(resumePending && video.currentTime+3<saved)return;
      const now=Date.now();if(!force&&now-lastSave<5000)return;lastSave=now;
      const percent=Math.min(100,(video.currentTime/video.duration)*100);
      updateLocal(video.currentTime,video.duration,percent>=95);
      try{await apiRequest('student_recorded_lecture_progress',{method:'POST',keepalive,body:{lecture_id:lecture.id,position_seconds:Math.floor(video.currentTime),watched_percent:percent,completed:percent>=95}})}catch(_){}
    };
    const onLoaded=()=>{applyResume();touch();try{const pending=JSON.parse(sessionStorage.getItem('fsaRecordedJump')||'null');if(pending&&Number(pending.lectureId)===Number(lecture.id)){sessionStorage.removeItem('fsaRecordedJump');setTimeout(()=>{try{video.currentTime=Math.max(0,Number(pending.seconds)||0);}catch(_){}},120);}}catch(_){}};
    const onTime=()=>{recordedLecturePlaybackContext.seconds=video.currentTime||0;recordedLecturePlaybackContext.duration=video.duration||0;updateRecordedDiscussionClock(recordedLecturePlaybackContext.seconds);if(resumePending){if(video.currentTime+3<saved){applyResume();return;}resumePending=false;}save(false,false);};
    const onPlay=()=>setRecordedPlayingState(lecture.id,true);
    const onPause=()=>{setRecordedPlayingState(lecture.id,false);save(true,false);};
    const onEnded=async()=>{setRecordedPlayingState(lecture.id,false);resumePending=false;await save(true,false);await syncStudentData();renderRecordedLecturePlayer(lecture.course_id,lecture.id);initPage();};
    const flush=()=>{save(true,true);};
    const visibility=()=>{if(document.visibilityState==='hidden')flush();};
    video.addEventListener('loadedmetadata',onLoaded);video.addEventListener('loadeddata',applyResume);video.addEventListener('timeupdate',onTime);video.addEventListener('play',onPlay);video.addEventListener('pause',onPause);video.addEventListener('ended',onEnded);
    recordedLectureSeekHandler=seconds=>{try{video.currentTime=Math.max(0,Number(seconds)||0);}catch(_){}};
    window.addEventListener('pagehide',flush);window.addEventListener('beforeunload',flush);document.addEventListener('visibilitychange',visibility);
    recordedLectureTrackingCleanup=()=>{
      save(true,true);
      active=false;window.removeEventListener('pagehide',flush);window.removeEventListener('beforeunload',flush);document.removeEventListener('visibilitychange',visibility);
      setRecordedPlayingState(lecture.id,false);recordedLectureSeekHandler=null;
      video.removeEventListener('loadedmetadata',onLoaded);video.removeEventListener('loadeddata',applyResume);video.removeEventListener('timeupdate',onTime);video.removeEventListener('play',onPlay);video.removeEventListener('pause',onPause);video.removeEventListener('ended',onEnded);
    };
  }

  function recordedResourceEntryMarkup(index=0){
    return `<article class="recorded-resource-entry" data-resource-entry="${index}"><div class="recorded-resource-entry-head"><div><strong>New resource</strong><small>Add one file or one external link, with its own title and description.</small></div><button class="recorded-resource-entry-remove" type="button" data-action="instructor-recorded-resource-entry-remove" aria-label="Remove resource">${icon('trash')}</button></div><div class="form-grid"><div class="form-group"><label>Resource title <small>Required</small></label><input class="form-control" type="text" maxlength="190" data-resource-title placeholder="Worksheet / Project files / Reading"></div><div class="form-group"><label>External resource URL <small>Optional if uploading a file</small></label><input class="form-control" type="url" data-resource-url placeholder="https://..."></div><div class="form-group full"><label>Resource description <small>Required</small></label><textarea class="form-control" rows="3" data-resource-description placeholder="Explain what this resource contains and how the student should use it."></textarea></div><div class="form-group full"><label>Resource file <small>Optional if using a URL · max 50 MB</small></label><label class="classroom-upload recorded-resource-upload"><input type="file" data-resource-file><span class="classroom-upload-icon">${icon('upload')}</span><span class="classroom-upload-copy"><strong>Choose one resource file</strong><small data-role="recorded-resource-file-name">PDF, Office, ZIP, project/source files, images, audio/video and other safe files</small></span><span class="classroom-upload-button">Browse</span></label></div></div></article>`;
  }

  function openInstructorRecordedLectureForm(item=null,presetCourseId=0){
    const courses=state.instructorData.courses||[];if(!courses.length){toast('No course is assigned to your instructor account.','error');return;}
    const selectedCourseId=Number(item?.course_id||presetCourseId||courses[0]?.id||0),same=(state.instructorData.recorded_lectures||[]).filter(x=>Number(x.course_id)===selectedCourseId),next=same.length?Math.max(...same.map(x=>Number(x.sort_order||0)))+1:1;
    const source=recordedLectureSource(item?.video_url||''),isBunny=source.kind==='bunny',resources=Array.isArray(item?.resources)?item.resources:[];
    const resourceList=resources.length?`<div class="recorded-form-existing-resources">${resources.map(resource=>`<article><span>${icon('download')}</span><div><strong>${escapeHtml(resource.title||resource.original_name||'Resource')}</strong>${resource.description?`<p>${escapeHtml(resource.description)}</p>`:''}<small>${escapeHtml(resource.original_name||resource.mime_type||'Lecture resource')}</small></div><button type="button" data-action="instructor-recorded-resource-delete" data-id="${Number(resource.id)}" data-lecture-id="${Number(item.id)}">${icon('trash')}</button></article>`).join('')}</div>`:'<p class="muted recorded-resource-help">No resources attached yet.</p>';
    openClassroomModal(item?'Edit recorded lecture':'Add recorded lecture','Add the Bunny video, lecture details and optional downloadable resources. Students open the Recorded Course in a dedicated private course page.',`<form id="recordedLectureForm" class="auth-form" enctype="multipart/form-data"><input type="hidden" name="id" value="${item?.id||''}"><div class="form-grid">
      <div class="form-group"><label>Course</label><select class="form-control" name="course_id" required>${courses.map(c=>`<option value="${c.id}" ${Number(c.id)===selectedCourseId?'selected':''}>${escapeHtml(c.title)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Sequence / order</label><input class="form-control" name="sort_order" type="number" min="1" value="${item?.sort_order||next}" required></div>
      <div class="form-group full"><label>Lecture title</label><input class="form-control" name="title" required maxlength="190" value="${escapeHtml(item?.title||'')}" placeholder="Lecture 01 — Introduction"></div>
      <div class="form-group full"><label>Bunny Stream iframe / embed URL</label><textarea class="form-control" name="video_url" rows="3" required placeholder='https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_ID'>${escapeHtml(item?.video_url||'')}</textarea><small>${isBunny?'✓ Bunny Stream embed detected.':'Paste the Bunny iframe code or only its src URL. YouTube/Vimeo/direct links remain supported for old test lectures.'}</small></div>
      <div class="form-group"><label>Duration (minutes)</label><input class="form-control" name="duration_minutes" type="number" min="0" value="${item?.duration_minutes||0}"></div>
      <div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="published" ${item?.status!=='draft'?'selected':''}>Published</option><option value="draft" ${item?.status==='draft'?'selected':''}>Draft</option></select></div>
      <div class="form-group full"><label>Description</label><textarea class="form-control" name="description" rows="5" placeholder="What will students learn in this lecture?">${escapeHtml(item?.description||'')}</textarea></div>
      <div class="form-group full recorded-resource-field"><div class="recorded-resource-section-head"><div><label>Lecture resources</label><small>Each resource has its own title, description and either a file or external URL.</small></div><button class="button button-secondary button-sm" type="button" data-action="instructor-recorded-resource-entry-add">${icon('plus')} Add another resource</button></div>${resourceList}<div id="recordedResourceEntries">${recordedResourceEntryMarkup(0)}</div></div>
    </div><div class="classroom-modal-actions"><button type="button" class="button button-secondary" data-action="classroom-modal-close">Cancel</button><button type="button" class="button button-primary" data-action="instructor-recorded-lecture-save">${item?'Save changes':'Publish lecture'}</button></div></form>`);
  }

  function instructorRecordedProgressTable(courseId,lectures){
    const students=(state.instructorData.students||[]).filter(s=>(s.course_ids||[]).map(Number).includes(Number(courseId)));
    const progress=state.instructorData.recorded_lecture_progress||[];
    if(!students.length)return `<div class="recorded-progress-empty"><span>${icon('users')}</span><div><h3>No enrolled students yet</h3><p>Student watch progress will appear here automatically as soon as a learner is enrolled in this course.</p></div></div>`;

    const studentRows=students.map(student=>{
      const rows=progress.filter(p=>Number(p.user_id)===Number(student.id)&&Number(p.course_id)===Number(courseId));
      const byLecture=id=>rows.find(p=>Number(p.lecture_id)===Number(id));
      const completed=lectures.filter(l=>byLecture(l.id)?.completed).length;
      const pct=lectures.length?Math.round(lectures.reduce((sum,l)=>sum+(byLecture(l.id)?.completed?100:Number(byLecture(l.id)?.watched_percent||0)),0)/lectures.length):0;
      const latest=[...rows].filter(r=>r.last_watched_at).sort((a,b)=>new Date(b.last_watched_at)-new Date(a.last_watched_at))[0];
      const next=lectures.find(l=>!byLecture(l.id)?.completed);
      const current=latest&&!latest.completed?`Watching · ${latest.lecture_title}`:next?`Next · ${next.title}`:'All lectures completed';
      const status=pct>=100?'Completed':pct>0?'In progress':'Not started';
      const statusClass=pct>=100?'is-complete':pct>0?'is-active':'is-idle';
      return {student,completed,pct,latest,current,status,statusClass};
    });

    const avg=Math.round(studentRows.reduce((sum,row)=>sum+row.pct,0)/Math.max(1,studentRows.length));
    const completedStudents=studentRows.filter(row=>row.pct>=100).length;
    const activeStudents=studentRows.filter(row=>row.pct>0&&row.pct<100).length;

    return `<div class="recorded-progress-dashboard">
      <div class="recorded-progress-metrics">
        <article><span class="recorded-metric-icon">${icon('users')}</span><div><strong>${studentRows.length}</strong><small>Enrolled learners</small></div></article>
        <article><span class="recorded-metric-icon">${icon('check')}</span><div><strong>${completedStudents}</strong><small>Course completed</small></div></article>
        <article><span class="recorded-metric-icon">${icon('play')}</span><div><strong>${activeStudents}</strong><small>Currently learning</small></div></article>
        <article><span class="recorded-metric-icon">${icon('history')}</span><div><strong>${avg}%</strong><small>Average progress</small></div></article>
      </div>
      <div class="recorded-progress-table-wrap"><table class="recorded-progress-table"><thead><tr><th>Learner</th><th>Status</th><th>Lecture progress</th><th>Current / next</th><th>Last activity</th></tr></thead><tbody>${studentRows.map(({student,completed,pct,latest,current,status,statusClass})=>`<tr>
        <td><button class="recorded-student-link" type="button" data-action="instructor-view-student" data-id="${student.id}"><span class="recorded-student-avatar">${escapeHtml(initials(student.name||'Student'))}</span><span><strong>${escapeHtml(student.name||'Student')}</strong><small>${escapeHtml(student.email||student.student_code||'Learner')}</small></span></button></td>
        <td><span class="recorded-learning-status ${statusClass}">${status}</span></td>
        <td><div class="recorded-table-progress"><div class="recorded-progress-label"><span>${completed}/${lectures.length} lectures</span><b>${pct}%</b></div><span class="recorded-table-track"><i style="width:${pct}%"></i></span></div></td>
        <td><span class="recorded-current-next">${escapeHtml(current)}</span></td>
        <td><span class="recorded-last-activity">${latest?.last_watched_at?classroomDate(latest.last_watched_at):'No activity yet'}</span></td>
      </tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  function renderInstructorRecordedLectures(courseId=0,lectureId=0){
    stopRecordedLectureTracking();stopRecordedLecturePreview();stopRecordedDiscussion();
    const rows=state.instructorData.recorded_lectures||[],courses=state.instructorData.courses||[],groups=recordedLectureGroups(rows);
    courseId=Number(courseId||0);lectureId=Number(lectureId||0);
    if(!courseId){
      const content=`<div class="recorded-lecture-admin-head"><div><span class="eyebrow">On-demand course library</span><h2>Recorded Course Archive</h2><p>This is separate from Zoom Live Recordings. Only courses that already contain recorded lectures appear in this archive.</p></div><button class="button button-primary" data-action="instructor-recorded-lecture-new" ${courses.length?'':'disabled'}>${icon('plus')} Add Recorded Lecture</button></div>${groups.length?`<div class="recorded-lecture-course-grid">${groups.map(group=>{const published=group.items.filter(x=>x.status==='published').length;return `<article class="panel recorded-lecture-course-card"><a class="recorded-lecture-course-cover" href="#/instructor-recorded-lectures/${group.id}">${group.image?imageMarkup(group.image,group.title,initials(group.title)):`<span>${icon('play')}</span>`}<b>${group.items.length} lecture${group.items.length===1?'':'s'}</b></a><div class="recorded-lecture-course-copy"><span class="eyebrow">${published} published</span><h3>${escapeHtml(group.title)}</h3><p>${group.items.length-published} draft · sequence controlled by lecture order</p><a class="button button-primary" href="#/instructor-recorded-lectures/${group.id}">Manage Course ${icon('arrow')}</a></div></article>`;}).join('')}</div>`:`<div class="panel empty-state"><span class="empty-icon">${icon('play')}</span><h3>No recorded lectures yet</h3><p>Add the first lecture link to one of your assigned courses. That course will then appear here.</p><button class="button button-primary" data-action="instructor-recorded-lecture-new">+ Add First Lecture</button></div>`}`;
      instructorShell('instructor-recorded-lectures',content,'Recorded Lectures','Build ordered recorded courses and host a private course discussion.');return;
    }
    const group=groups.find(g=>Number(g.id)===courseId),course=courses.find(c=>Number(c.id)===courseId);
    if(!course){instructorShell('instructor-recorded-lectures',`<div class="panel empty-state"><h3>Course not available</h3><p>This course is not assigned to your instructor account.</p></div>`,'Recorded Lectures','Manage assigned recorded courses.');return;}
    if(!group){const content=`<div class="recorded-library-toolbar premium-recorded-toolbar"><a href="#/instructor-recorded-lectures">${icon('arrowLeft')} Archive</a><button class="button button-primary" data-action="instructor-recorded-lecture-new" data-course-id="${course.id}">+ Add Lecture</button></div><div class="panel empty-state"><h3>No lectures in ${escapeHtml(course.title)}</h3><p>Add the first video link to create the recorded course library.</p></div>`;instructorShell('instructor-recorded-lectures',content,course.title,'Recorded lecture management');return;}
    const current=group.items.find(x=>Number(x.id)===lectureId)||group.items[0],index=group.items.findIndex(x=>Number(x.id)===Number(current.id));
    const publishedCount=group.items.filter(x=>x.status==='published').length,totalMinutes=group.items.reduce((sum,x)=>sum+Number(x.duration_minutes||0),0),studentCount=(state.instructorData.students||[]).filter(s=>(s.course_ids||[]).map(Number).includes(Number(course.id))).length;
    if(!['overview','resources','discussion'].includes(state.recordedLessonTab))state.recordedLessonTab='overview';
    const content=`<div class="recorded-library-toolbar premium-recorded-toolbar"><a href="#/instructor-recorded-lectures">${icon('arrowLeft')}<span>Recorded Course Archive</span></a><div class="recorded-toolbar-actions"><span class="recorded-toolbar-course">${escapeHtml(group.title)}</span><button class="button button-primary" data-action="instructor-recorded-lecture-new" data-course-id="${course.id}">${icon('plus')} Add Lecture</button></div></div>
      <div class="recorded-course-overview compact-recorded-admin-stats"><article><span>${icon('play')}</span><div><strong>${group.items.length}</strong><small>Lectures</small></div></article><article><span>${icon('check')}</span><div><strong>${publishedCount}</strong><small>Published</small></div></article><article><span>${icon('clock')}</span><div><strong>${totalMinutes?`${totalMinutes}m`:'—'}</strong><small>Duration</small></div></article><article><span>${icon('users')}</span><div><strong>${studentCount}</strong><small>Learners</small></div></article></div>
      <section class="player-shell recorded-private-course-shell recorded-instructor-private-shell">
        <div class="player-layout recorded-private-layout">
          <main class="lesson-stage recorded-private-stage">
            <div class="recorded-private-video">${recordedLectureEmbed(current.video_url,current.title)}</div>
            <div class="lesson-title-row recorded-private-title-row recorded-instructor-title-row">
              <div><span class="course-category">Recorded Course · ${escapeHtml(current.status||'draft')}</span><h1>${escapeHtml(current.title)}</h1><p>Lecture ${index+1} of ${group.items.length}${current.duration_minutes?` · ${Number(current.duration_minutes)} min`:''}</p></div>
              <div class="lesson-nav-actions"><button class="button button-secondary button-sm" type="button" data-action="instructor-recorded-lecture-edit" data-id="${current.id}">${icon('edit')} Edit Lecture</button><button class="button button-ghost button-sm is-danger" type="button" data-action="instructor-recorded-lecture-delete" data-id="${current.id}">${icon('trash')} Delete</button></div>
            </div>
            <div class="tabs recorded-private-tabs">${[['overview','Overview'],['resources','Resources'],['discussion','Discussion']].map(([key,label])=>`<button class="tab-button ${state.recordedLessonTab===key?'active':''}" type="button" data-action="recorded-lesson-tab" data-tab="${key}">${label}</button>`).join('')}</div>
            <div id="recordedLessonTabPanel">${recordedLectureTabContent(course.id,current,state.recordedLessonTab,'instructor')}</div>
          </main>
          ${recordedCurriculumSidebar(group.items,current,'instructor')}
        </div>
      </section>`;
    instructorShell('instructor-recorded-lectures',content,group.title,'Manage Bunny lectures, lesson resources and course discussion.');
    setTimeout(()=>{initInstructorRecordedPreview(current);if(state.recordedLessonTab==='discussion')initRecordedDiscussion(course.id,current,'instructor');},0);
  }

  function renderInstructorRecordings(){
    ensureLiveLearningLayoutStyles();ensureLiveV80Styles();
    const all=state.instructorData.recordings||[];
    const filtered=filterLiveCourse(all,'recordings').sort((a,b)=>new Date(b.recorded_at||b.created_at||0)-new Date(a.recorded_at||a.created_at||0));
    const published=filtered.filter(item=>item.status==='published'&&item.recording_url).length;
    const processing=filtered.filter(item=>item.status!=='published'||!item.recording_url).length;
    const content=`<section class="recording-library-hero">
        <div class="recording-library-copy"><span class="eyebrow">Recording library</span><h2>Recorded Classes</h2><p>Zoom recordings sync automatically after class. You can also add a secure recording link manually.</p></div>
        <div class="recording-library-actions"><button class="button button-secondary dashboard-action-button" type="button" data-action="instructor-recording-sync">${icon('history')}<span>Sync Zoom</span></button><button class="button button-primary dashboard-action-button" type="button" data-action="instructor-recording-new">${icon('plus')}<span>Add Recording</span></button></div>
      </section>
      <div class="recording-library-stats"><span><strong>${filtered.length}</strong><small>Showing</small></span><span><strong>${published}</strong><small>Ready to watch</small></span><span><strong>${processing}</strong><small>Processing</small></span></div>
      ${liveCourseFilterMarkup('recordings',state.instructorData.live_sessions||[],all)}
      <div class="recording-admin-grid recording-admin-grid-premium">${filtered.length?filtered.map(item=>{const ready=Boolean(item.recording_url)&&item.status==='published';return `<article class="panel recording-admin-card recording-admin-card-premium"><div class="recorded-course-cover">${item.course_image?imageMarkup(item.course_image,item.course_title||item.title,initials(item.course_title||item.title)):`<div class="recorded-course-cover-fallback">${icon('play')}</div>`}<span class="recorded-course-badge">${escapeHtml(item.source||'recorded')}</span><span class="recording-cover-status ${ready?'is-ready':'is-processing'}">${ready?'Ready':'Processing'}</span></div><div class="recorded-course-body"><span class="course-category">${escapeHtml(item.course_title||'Course')}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description||'Recorded Live class')}</p><div class="recorded-course-meta"><span>${icon('clock')} ${item.recorded_at?classroomDate(item.recorded_at):'Latest'}</span><span>${escapeHtml(item.source||'manual')}</span></div><div class="recording-card-actions">${ready?`<a class="button button-primary button-sm recording-watch-button" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener">${icon('play')}<span>Watch</span></a>`:`<button class="button button-secondary button-sm recording-sync-button" type="button" data-action="instructor-recording-sync" data-live-id="${item.live_session_id||''}">${icon('history')}<span>Sync</span></button>`}<button class="button button-secondary button-sm recording-edit-button" type="button" data-action="instructor-recording-edit" data-id="${item.id}">${icon('edit')}<span>Edit</span></button><button class="button button-ghost button-sm recording-delete-button" type="button" data-action="instructor-recording-delete" data-id="${item.id}" aria-label="Delete recording">${icon('trash')}</button></div></div></article>`}).join(''):`<div class="panel live-learning-empty" style="grid-column:1/-1"><span class="empty-icon">${icon('play')}</span><h3>No recordings yet</h3><p>End a Live class or add a recording URL manually. The newest recording will appear first.</p></div>`}</div>`;
    instructorShell('instructor-recordings',content,'Live Recordings','Manage Zoom/live-class recordings and manual replay URLs by course.');
  }

  function renderInstructorQuizzes(){
    const rows=state.instructorData.quizzes||[], attempts=state.instructorData.quiz_attempts||[];
    const quizCards=rows.length?`<div class="classroom-list">${rows.map(q=>`<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('note')}</span><div><span class="course-category">${escapeHtml(q.course_title||'Course')}</span><h3>${escapeHtml(q.title)}</h3><p>${(q.questions||[]).length} question${(q.questions||[]).length===1?'':'s'} · ${q.attempts_allowed||1} attempt${Number(q.attempts_allowed)===1?'':'s'}${q.due_at?` · Due ${classroomDate(q.due_at)}`:''}</p><div class="quiz-analytics-inline"><span><strong>${Number(q.student_count||0)}</strong> students</span><span><strong>${Number(q.attempt_count||0)}</strong> attempts</span><span><strong>${Number(q.average_percent||0)}%</strong> avg.</span><span><strong>${Number(q.best_percent||0)}%</strong> best</span></div></div><span class="status-pill">${escapeHtml(q.status)}</span></div><div class="row-actions"><button class="button button-secondary button-sm" data-action="instructor-quiz-edit" data-id="${q.id}">${icon('edit')} Edit Quiz</button><button class="button button-ghost button-sm" data-action="instructor-quiz-delete" data-id="${q.id}">${icon('trash')}</button></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>No quizzes yet</h3><p>Create an assessment and it will appear in the student's private Classroom tab and My Quizzes dashboard.</p></div>`;
    const resultTable=`<div class="panel" style="margin-top:20px"><div class="panel-head"><div><span class="eyebrow">Automatic scoring</span><h2>Student quiz results</h2></div><span>${attempts.length}</span></div>${attempts.length?`<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Student</th><th>Quiz</th><th>Course</th><th>Score</th><th>Percentage</th><th>Submitted</th></tr></thead><tbody>${attempts.map(a=>`<tr><td><strong>${escapeHtml(a.student_name||'Student')}</strong><small style="display:block">${escapeHtml(a.student_email||'')}</small></td><td>${escapeHtml(a.quiz_title||'Quiz')}</td><td>${escapeHtml(a.course_title||'Course')}</td><td>${Number(a.score||0)}/${Number(a.max_score||0)}</td><td><span class="status-pill">${Number(a.percent||0)}%</span></td><td>${a.submitted_at?classroomDate(a.submitted_at):'—'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Student scores will appear here immediately after a quiz is submitted.</p>'}</div>`;
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Assessments</span><p>Create multi-question quizzes for any assigned course. Students take them one step at a time and scores are calculated automatically.</p></div><button class="button button-primary" data-action="instructor-quiz-new" ${instructorCourses().length?'':'disabled'}>+ Create Quiz</button></div>${quizCards}${resultTable}`;
    instructorShell('instructor-quizzes',content,'Quizzes','Build multi-step assessments, review automatic scores and track attempt analytics.');
  }
  function renderInstructorAssignments(){
    const rows=state.instructorData.assignments||[], submissions=state.instructorData.submissions||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Classwork</span><p>Post instructions and attachments, then review student submissions and give grades/feedback.</p></div><button class="button button-primary" data-action="instructor-assignment-new" ${instructorCourses().length?'':'disabled'}>+ Create Assignment</button></div>${rows.length?`<div class="classroom-list">${rows.map(a=>{const count=submissions.filter(s=>Number(s.assignment_id)===Number(a.id)).length;return `<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('project')}</span><div><span class="course-category">${escapeHtml(a.course_title||'Course')}</span><h3>${escapeHtml(a.title)}</h3><p>${a.points} points${a.due_at?` · Due ${classroomDate(a.due_at)}`:''} · ${count} submission${count===1?'':'s'}</p></div><span class="status-pill">${escapeHtml(a.status)}</span></div><div class="row-actions"><button class="button button-secondary button-sm" data-action="instructor-assignment-edit" data-id="${a.id}">${icon('edit')} Edit</button><button class="button button-ghost button-sm" data-action="instructor-assignment-delete" data-id="${a.id}">${icon('trash')}</button></div></article>`}).join('')}</div>`:'<div class="empty-state"><h3>No assignments yet</h3><p>Create classwork for your students from this page.</p></div>'}<div class="panel" style="margin-top:20px"><div class="panel-head"><h2>Student submissions</h2><span>${submissions.length}</span></div>${submissions.length?`<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Student</th><th>Assignment</th><th>Course</th><th>Status</th><th>Grade</th><th></th></tr></thead><tbody>${submissions.map(sub=>`<tr><td>${escapeHtml(sub.student_name)}</td><td>${escapeHtml(sub.assignment_title||'Assignment')}</td><td>${escapeHtml(sub.course_title||'Course')}</td><td><span class="status-pill">${escapeHtml(sub.status)}</span></td><td>${sub.grade===null?'—':`${sub.grade}/${sub.points}`}</td><td><button class="button button-secondary button-sm" data-action="instructor-grade-submission" data-id="${sub.id}">Review</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">No student work has been submitted yet.</p>'}</div>`;
    instructorShell('instructor-assignments',content,'Assignments','Post classwork, collect files and grade submissions.');
  }

  function closeInstructorClassroomModal(){document.getElementById('instructorClassroomModal')?.remove();if(!document.querySelector('.classroom-modal'))document.body.classList.remove('locked');}
  function openClassroomModal(title,subtitle,body){
    closeInstructorClassroomModal();
    document.body.classList.add('locked');
    document.body.insertAdjacentHTML('beforeend',`<div class="profile-action-modal classroom-modal classroom-modal-instructor" id="instructorClassroomModal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><section class="profile-action-card classroom-modal-card"><header class="classroom-modal-header"><div class="classroom-modal-heading"><span class="eyebrow">Instructor classroom</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="icon-button profile-action-close classroom-modal-close" type="button" data-action="close-classroom-modal" aria-label="Close">${icon('x')}</button></header><div class="classroom-modal-body">${body}</div></section></div>`);
  }

  function openInstructorCourseForm(course=null){
    openClassroomModal(course?'Edit course page':'Create course','Public information and visibility are controlled here. Private lessons are edited separately.',`<form id="instructorCourseForm" class="auth-form"><input type="hidden" name="id" value="${course?.id||''}"><div class="form-grid"><div class="form-group"><label>Course title</label><input class="form-control" name="title" required value="${escapeHtml(course?.title||'')}"></div><div class="form-group"><label>URL slug</label><input class="form-control" name="slug" value="${escapeHtml(course?.slug||'')}"></div><div class="form-group"><label>Category</label><input class="form-control" name="category" required value="${escapeHtml(course?.category||'Web Development')}"></div><div class="form-group"><label>Badge</label><input class="form-control" name="badge" value="${escapeHtml(course?.badge||'')}"></div><div class="form-group"><label>Visibility</label><select class="form-control" name="visibility"><option value="public" ${course?.visibility!=='private'?'selected':''}>Public course page</option><option value="private" ${course?.visibility==='private'?'selected':''}>Private / enrolled students only</option></select></div><div class="form-group"><label>Publishing</label><select class="form-control" name="status"><option value="draft" ${course?.status==='draft'?'selected':''}>Draft</option><option value="published" ${course?.status!=='draft'?'selected':''}>Published</option></select></div><div class="form-group full"><label>Cover image URL</label><input class="form-control" name="image" value="${escapeHtml(course?.image||'')}" placeholder="https://... or uploads/media/..."></div><div class="form-group full"><label>Short description</label><textarea class="form-control" name="short">${escapeHtml(course?.short||'')}</textarea></div><div class="form-group full"><label>Full public description</label><textarea class="form-control" name="description" rows="6">${escapeHtml(course?.description||'')}</textarea></div><div class="form-group"><label>Price</label><input class="form-control" type="number" min="0" step="0.01" name="price" value="${course?.price||0}"></div><div class="form-group"><label>Original price</label><input class="form-control" type="number" min="0" step="0.01" name="originalPrice" value="${course?.originalPrice||0}"></div><div class="form-group"><label>Duration</label><input class="form-control" name="duration" value="${escapeHtml(course?.duration||'')}"></div><div class="form-group"><label>Hours</label><input class="form-control" type="number" min="0" name="hours" value="${course?.hours||0}"></div><div class="form-group"><label>Level</label><input class="form-control" name="level" value="${escapeHtml(course?.level||'Beginner')}"></div><div class="form-group"><label>Language</label><input class="form-control" name="language" value="${escapeHtml(course?.language||'English')}"></div></div><button class="button button-primary button-block" type="submit">${course?'Save Course Page':'Create Course'}</button></form>`);
  }

  function instructorOfflineLines(items=[]){return Array.isArray(items)?items.map(item=>String(item||'').trim()).filter(Boolean).join('\n'):'';}
  function instructorOfflineResourceLines(resources=[]){return Array.isArray(resources)?resources.map(r=>`${r.title||'Resource'} | ${r.url||''}`).filter(x=>!x.endsWith('| ')).join('\n'):'';}
  function instructorOfflineLectureEditor(lecture={},index=0){return `<article class="io-lecture"><div class="io-builder-head"><div><span class="io-index">${index+1}</span><strong>Lecture video</strong></div><button type="button" data-action="io-remove-lecture">Remove</button></div><div class="form-grid"><div class="form-group"><label>Lecture tab title</label><input class="form-control" data-field="io-lecture-title" value="${escapeHtml(lecture.title||'')}" placeholder="Video 01 — Introduction"></div><div class="form-group"><label>Duration</label><input class="form-control" data-field="io-lecture-duration" value="${escapeHtml(lecture.duration||'')}" placeholder="18 min"></div><div class="form-group full"><label>Embed URL or iframe code</label><textarea class="form-control" rows="3" data-field="io-lecture-embed" placeholder="Paste hosted video iframe or HTTPS embed URL">${escapeHtml(lecture.embedUrl||lecture.videoUrl||'')}</textarea></div><div class="form-group full"><label>Text shown below this video</label><textarea class="form-control" rows="4" data-field="io-lecture-content" placeholder="Explanation, instructions or lecture summary">${escapeHtml(lecture.content||'')}</textarea></div><div class="form-group full offline-image-field"><label>Optional lecture image</label><div class="io-upload-line"><input class="form-control" data-field="io-lecture-image" value="${escapeHtml(lecture.image||'')}" placeholder="uploads/media/... or https://..."><label class="button button-secondary button-sm">Upload image<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" data-offline-image-upload></label></div></div></div></article>`;}
  function instructorOfflineContentBlockEditor(block={},index=0){const type=['text','image','video','file','link'].includes(block.type)?block.type:'text';return `<article class="io-content-block"><div class="io-builder-head"><div><span class="io-index">${index+1}</span><strong>Rich content</strong></div><button type="button" data-action="io-remove-module-block">Remove</button></div><div class="form-grid"><div class="form-group"><label>Block type</label><select class="form-control" data-field="io-module-block-type"><option value="text" ${type==='text'?'selected':''}>Text / explanation</option><option value="image" ${type==='image'?'selected':''}>Image</option><option value="video" ${type==='video'?'selected':''}>Video / iframe</option><option value="file" ${type==='file'?'selected':''}>PDF / file</option><option value="link" ${type==='link'?'selected':''}>External link</option></select></div><div class="form-group"><label>Block heading</label><input class="form-control" data-field="io-module-block-title" value="${escapeHtml(block.title||'')}" placeholder="Optional heading"></div><div class="form-group full"><label>Description / text</label><textarea class="form-control" rows="4" data-field="io-module-block-text" placeholder="Explain this content block.">${escapeHtml(block.text||block.description||'')}</textarea></div><div class="form-group full"><label>Media / file / link URL</label><div class="io-upload-line"><input class="form-control" data-field="io-module-block-url" value="${escapeHtml(block.url||'')}" placeholder="https://... or uploads/media/..."><label class="button button-secondary button-sm">Upload image / PDF / file<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" data-io-module-block-upload></label></div><small>For videos, paste the Bunny/YouTube/hosted iframe or HTTPS embed URL.</small></div></div></article>`;}
  function instructorOfflineLessonEditor(lesson={}){const videos=Array.isArray(lesson.videos)&&lesson.videos.length?lesson.videos:[];return `<article class="io-lesson"><div class="io-builder-head"><strong>Lesson</strong><button type="button" data-action="io-remove-lesson">Remove lesson</button></div><div class="form-grid"><div class="form-group"><label>Lesson title</label><input class="form-control" data-field="io-lesson-title" value="${escapeHtml(lesson.title||'')}" placeholder="Lesson 01 — Foundations"></div><div class="form-group"><label>Total lesson duration</label><input class="form-control" data-field="io-lesson-duration" value="${escapeHtml(lesson.duration||'')}" placeholder="1h 20m"></div><div class="form-group full"><label>Lesson overview text</label><textarea class="form-control" rows="4" data-field="io-lesson-content">${escapeHtml(lesson.content||'')}</textarea></div><div class="form-group full offline-image-field"><label>Lesson cover image</label><div class="io-upload-line"><input class="form-control" data-field="io-lesson-image" value="${escapeHtml(lesson.image||'')}" placeholder="uploads/media/... or https://..."><label class="button button-secondary button-sm">Upload image<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" data-offline-image-upload></label></div></div><div class="form-group full"><label>Resources <small>One per line: Resource title | URL</small></label><textarea class="form-control" rows="3" data-field="io-lesson-resources" placeholder="Worksheet | https://example.com/file.pdf">${escapeHtml(instructorOfflineResourceLines(lesson.resources))}</textarea></div><div class="form-group full"><label class="io-checkbox"><input type="checkbox" data-field="io-lesson-preview" ${lesson.preview?'checked':''}><span><strong>Public curriculum preview</strong><small>Show this lesson title on the public course page.</small></span></label></div><div class="form-group full"><div class="io-subsection-head"><div><strong>Lecture Videos</strong><small>Add as many videos as required for this lesson.</small></div><button class="button button-secondary button-sm" type="button" data-action="io-add-lecture">+ Add Lecture Video</button></div><div class="io-lecture-list">${videos.map(instructorOfflineLectureEditor).join('')}</div><p class="io-empty" ${videos.length?'hidden':''}>No lecture videos added. This can remain a reading-only lesson.</p></div></div></article>`;}
  function instructorOfflineModuleEditor(module={}){const lessons=Array.isArray(module.lessons)&&module.lessons.length?module.lessons:[{}],blocks=Array.isArray(module.contentBlocks)?module.contentBlocks:[];return `<section class="io-module"><div class="io-builder-head io-module-head"><div><span class="io-module-label">Module</span><input class="form-control" data-field="io-module-title" value="${escapeHtml(module.title||'')}" placeholder="Module heading"><input class="form-control io-duration" data-field="io-module-duration" value="${escapeHtml(module.duration||'')}" placeholder="Duration"></div><button type="button" data-action="io-remove-module">Remove module</button></div><div class="form-grid io-module-intro"><div class="form-group full"><label>Module description</label><textarea class="form-control" rows="4" data-field="io-module-description" placeholder="Explain what this module covers.">${escapeHtml(module.description||'')}</textarea></div><div class="form-group full"><label>Module key points <small>One point per line</small></label><textarea class="form-control" rows="4" data-field="io-module-points">${escapeHtml(instructorOfflineLines(module.points))}</textarea></div><div class="form-group full"><div class="io-subsection-head"><div><strong>Rich module content</strong><small>Add text, images, videos, PDFs/files and links before or around the lessons.</small></div><button class="button button-secondary button-sm" type="button" data-action="io-add-module-block">+ Add Content</button></div><div class="io-module-content-blocks">${blocks.map(instructorOfflineContentBlockEditor).join('')}</div></div></div><div class="io-lessons">${lessons.map(instructorOfflineLessonEditor).join('')}</div><button class="button button-secondary button-sm" type="button" data-action="io-add-lesson">+ Add Lesson</button></section>`;}
  function instructorOfflineProjectEditor(project={},index=0){return `<article class="io-project"><div class="io-builder-head"><strong>Project ${index+1}</strong><button type="button" data-action="io-remove-project">Remove</button></div><div class="form-grid"><div class="form-group full"><label>Project title</label><input class="form-control" data-field="io-project-title" value="${escapeHtml(project.title||'')}"></div><div class="form-group full"><label>Project description</label><textarea class="form-control" rows="3" data-field="io-project-description">${escapeHtml(project.description||'')}</textarea></div></div></article>`;}
  function instructorOfflineReviewEditor(review={}){return `<article class="io-review"><div class="io-builder-head"><strong>Course review</strong><button type="button" data-action="io-remove-review">Remove</button></div><div class="form-grid"><div class="form-group"><label>Student name</label><input class="form-control" data-field="io-review-name" value="${escapeHtml(review.name||'')}"></div><div class="form-group"><label>Student role</label><input class="form-control" data-field="io-review-role" value="${escapeHtml(review.role||'')}"></div><div class="form-group"><label>Rating</label><select class="form-control" data-field="io-review-rating">${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(review.rating||5)===n?'selected':''}>${n} / 5</option>`).join('')}</select></div><div class="form-group full"><label>Review text</label><textarea class="form-control" rows="3" data-field="io-review-text">${escapeHtml(review.text||'')}</textarea></div></div></article>`;}
  function instructorOfflineDraft(course){
    const pending=course?.pendingContentModes?.offline||course?.pendingModeContent?.offline||null;
    const base=pending||(course?.contentModes?.offline||course?.contentByMode?.offline||{});
    return {...base};
  }
  function openInstructorOfflineCourseForm(course){
    const offline=instructorOfflineDraft(course);
    const modules=(String(course.approvalStatus||'')==='pending'||String(course.approvalStatus||'')==='rejected')&&Array.isArray(course.pendingModules)&&course.pendingModules.length?course.pendingModules:(Array.isArray(course.modules)?course.modules:[]);
    const projects=Array.isArray(offline.projectItems)?offline.projectItems:[];
    const reviews=Array.isArray(offline.courseReviews)?offline.courseReviews:[];
    openClassroomModal(`Prepare Offline Course — ${course.title}`,'The same content areas used in Admin are available here. Pricing, delivery-mode availability, branch and instructor assignment remain Admin-controlled. Your changes are submitted for the normal course-content approval flow.',`<form id="instructorOfflineCourseForm" class="instructor-offline-editor"><input type="hidden" name="course_id" value="${course.id}"><section class="io-admin-lock"><div>${icon('shield')}<span><strong>Admin-controlled setup</strong><small>${escapeHtml(course.title)} · ${escapeHtml(course.category)} · Offline mode ${instructorModeEnabled(course,'offline')?'enabled':'disabled'} · Pricing and ownership cannot be changed here.</small></span></div><span class="status-pill ${String(course.approvalStatus)==='pending'?'status-pending':''}">${escapeHtml(course.approvalStatus||'approved')}</span></section><nav class="io-editor-tabs"><button type="button" class="active" data-action="io-editor-tab" data-tab="details">Course Details</button><button type="button" data-action="io-editor-tab" data-tab="overview">Overview</button><button type="button" data-action="io-editor-tab" data-tab="projects">Projects & Reviews</button><button type="button" data-action="io-editor-tab" data-tab="curriculum">Modules & Lessons</button></nav><div class="io-editor-pane active" data-io-pane="details"><div class="io-section-head"><div><span class="eyebrow">Basic information</span><h3>Offline course presentation</h3><p>These are the same descriptive course fields used by the Admin editor for the Physical / Offline version.</p></div></div><div class="form-grid"><div class="form-group"><label>Badge</label><input class="form-control" name="badge" value="${escapeHtml(offline.badge||'')}" placeholder="Bestseller"></div><div class="form-group"><label>Duration</label><input class="form-control" name="duration" value="${escapeHtml(offline.duration||'')}" placeholder="3 Months"></div><div class="form-group"><label>Level</label><input class="form-control" name="level" value="${escapeHtml(offline.level||'')}" placeholder="Beginner"></div><div class="form-group"><label>Language</label><input class="form-control" name="language" value="${escapeHtml(offline.language||'English')}"></div><div class="form-group"><label>Learning hours</label><input class="form-control" type="number" min="0" name="hours" value="${Number(offline.hours||0)}"></div><div class="form-group"><label>Updated label</label><input class="form-control" name="updated" value="${escapeHtml(offline.updated||'')}" placeholder="October 2026"></div><div class="form-group full offline-image-field"><label>Course image</label><div class="io-upload-line"><input class="form-control" name="image" value="${escapeHtml(offline.image||'')}" placeholder="uploads/media/... or https://..."><label class="button button-secondary button-sm">Upload image<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" data-offline-image-upload></label></div></div><div class="form-group full"><label>Short description</label><textarea class="form-control" rows="3" name="short">${escapeHtml(offline.short||'')}</textarea></div></div></div><div class="io-editor-pane" data-io-pane="overview"><div class="io-section-head"><div><span class="eyebrow">Overview</span><h3>What students need to know</h3><p>Leave an optional section empty if it should stay hidden on the course page.</p></div></div><div class="form-grid"><div class="form-group full"><label>Main course heading</label><input class="form-control" name="contentHeading" value="${escapeHtml(offline.contentHeading||'')}" placeholder="What you will master in this course"></div><div class="form-group full"><label>Key points <small>One point per line</small></label><textarea class="form-control" rows="6" name="skills">${escapeHtml(instructorOfflineLines(offline.skills))}</textarea></div><div class="form-group full"><label>Main course content</label><textarea class="form-control" rows="8" name="description">${escapeHtml(offline.description||'')}</textarea></div><div class="form-group full"><label>Requirements <small>One per line</small></label><textarea class="form-control" rows="5" name="requirements">${escapeHtml(instructorOfflineLines(offline.requirements))}</textarea></div><div class="form-group full"><label>Who this course is for <small>One per line</small></label><textarea class="form-control" rows="5" name="audience">${escapeHtml(instructorOfflineLines(offline.audience))}</textarea></div></div></div><div class="io-editor-pane" data-io-pane="projects"><div class="io-section-head"><div><span class="eyebrow">Projects & Reviews</span><h3>Practical proof and learner feedback</h3><p>Add the project details and genuine course-specific reviews used by the Admin course editor.</p></div><div class="io-section-actions"><button class="button button-secondary button-sm" type="button" data-action="io-add-project">+ Project</button><button class="button button-secondary button-sm" type="button" data-action="io-add-review">+ Review</button></div></div><div class="io-projects" id="instructorOfflineProjects">${projects.map(instructorOfflineProjectEditor).join('')}</div><div class="io-reviews" id="instructorOfflineReviews">${reviews.map(instructorOfflineReviewEditor).join('')}</div></div><div class="io-editor-pane" data-io-pane="curriculum"><div class="io-section-head"><div><span class="eyebrow">Protected learning area</span><h3>Modules, lessons and lecture content</h3><p>Build the Offline learner classroom with the same lesson detail available to Admin: duration, overview, cover image, resources, public preview and multiple lecture videos.</p></div><button class="button button-secondary button-sm" type="button" data-action="io-add-module">+ Add Module</button></div><div class="io-modules" id="instructorOfflineModules">${modules.map(instructorOfflineModuleEditor).join('')}</div></div><footer class="io-editor-footer"><span>${icon('history')} Saves as a course-content request for approval.</span><button class="button button-primary" type="submit">Save & Submit Offline Content</button></footer></form>`);
  }
  function splitLineItems(value){return String(value||'').split(/\r?\n/).map(line=>{const [first,...rest]=line.split('|');const url=rest.join('|').trim();return {title:first.trim(),url};}).filter(x=>x.url);}
  function instructorOfflineCollect(form){
    const lines=name=>String(form.elements[name]?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const projects=[...form.querySelectorAll('.io-project')].map(row=>({title:row.querySelector('[data-field="io-project-title"]')?.value.trim()||'',description:row.querySelector('[data-field="io-project-description"]')?.value.trim()||''})).filter(x=>x.title||x.description);
    const reviews=[...form.querySelectorAll('.io-review')].map(row=>({name:row.querySelector('[data-field="io-review-name"]')?.value.trim()||'',role:row.querySelector('[data-field="io-review-role"]')?.value.trim()||'',rating:Number(row.querySelector('[data-field="io-review-rating"]')?.value||5),text:row.querySelector('[data-field="io-review-text"]')?.value.trim()||''})).filter(x=>x.name||x.text);
    const modules=[...form.querySelectorAll('.io-module')].map((mod,mi)=>({title:mod.querySelector('[data-field="io-module-title"]')?.value.trim()||`Module ${mi+1}`,duration:mod.querySelector('[data-field="io-module-duration"]')?.value.trim()||'',description:mod.querySelector('[data-field="io-module-description"]')?.value.trim()||'',points:String(mod.querySelector('[data-field="io-module-points"]')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),contentBlocks:[...mod.querySelectorAll(':scope > .io-module-intro .io-content-block')].map(block=>({type:block.querySelector('[data-field="io-module-block-type"]')?.value||'text',title:block.querySelector('[data-field="io-module-block-title"]')?.value.trim()||'',text:block.querySelector('[data-field="io-module-block-text"]')?.value.trim()||'',url:block.querySelector('[data-field="io-module-block-url"]')?.value.trim()||''})).filter(x=>x.title||x.text||x.url),lessons:[...mod.querySelectorAll(':scope > .io-lessons > .io-lesson')].map(lesson=>({title:lesson.querySelector('[data-field="io-lesson-title"]')?.value.trim()||'',duration:lesson.querySelector('[data-field="io-lesson-duration"]')?.value.trim()||'',preview:Boolean(lesson.querySelector('[data-field="io-lesson-preview"]')?.checked),content:lesson.querySelector('[data-field="io-lesson-content"]')?.value.trim()||'',image:lesson.querySelector('[data-field="io-lesson-image"]')?.value.trim()||'',resources:splitLineItems(lesson.querySelector('[data-field="io-lesson-resources"]')?.value||''),videos:[...lesson.querySelectorAll('.io-lecture')].map((lecture,index)=>({title:lecture.querySelector('[data-field="io-lecture-title"]')?.value.trim()||`Lecture ${String(index+1).padStart(2,'0')}`,duration:lecture.querySelector('[data-field="io-lecture-duration"]')?.value.trim()||'',videoProvider:'embed',videoId:'',embedUrl:lecture.querySelector('[data-field="io-lecture-embed"]')?.value.trim()||'',content:lecture.querySelector('[data-field="io-lecture-content"]')?.value.trim()||'',image:lecture.querySelector('[data-field="io-lecture-image"]')?.value.trim()||''})).filter(x=>x.title||x.embedUrl||x.content||x.image)})).filter(x=>x.title)})).filter(x=>x.title||x.lessons.length);
    return {course_id:Number(form.elements.course_id?.value||0),content:{badge:String(form.elements.badge?.value||'').trim(),contentHeading:String(form.elements.contentHeading?.value||'').trim(),image:String(form.elements.image?.value||'').trim(),short:String(form.elements.short?.value||'').trim(),description:String(form.elements.description?.value||'').trim(),duration:String(form.elements.duration?.value||'').trim(),hours:Number(form.elements.hours?.value||0),level:String(form.elements.level?.value||'').trim(),language:String(form.elements.language?.value||'').trim(),updated:String(form.elements.updated?.value||'').trim(),skills:lines('skills'),requirements:lines('requirements'),audience:lines('audience'),projectItems:projects,courseReviews:reviews},modules};
  }

  function openInstructorLiveForm(item=null){
    const courseId=item?.course_id||instructorCourses()[0]?.id||'';
    const weekdays=[['1','Mon'],['2','Tue'],['3','Wed'],['4','Thu'],['5','Fri'],['6','Sat'],['7','Sun']];
    const scheduleFields=item
      ? `<input type="hidden" name="schedule_mode" value="single"><div class="form-group full"><div class="alert-card"><strong>Editing one scheduled class</strong><p>Recurring timetable creation is available when you create a new schedule. Editing here changes only this class.</p></div></div>`
      : `<div class="form-group"><label>Schedule type</label><select class="form-control" name="schedule_mode"><option value="single">One class only</option><option value="recurring">Repeat through a date / whole month</option></select></div>
         <div class="form-group"><label>Repeat until <small>For monthly/repeating schedule</small></label><input class="form-control" type="date" name="repeat_until"></div>
         <div class="form-group full"><label>Repeat on weekdays <small>Select one or more. If none are selected, the first class weekday is repeated weekly.</small></label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${weekdays.map(([value,label])=>`<label style="display:flex;align-items:center;gap:6px;padding:8px 11px;border:1px solid var(--dash-border);border-radius:10px;background:var(--dash-surface)"><input type="checkbox" name="repeat_weekdays" value="${value}"> ${label}</label>`).join('')}</div></div>
         <div class="form-group full"><div class="alert-card"><strong>Monthly schedule</strong><p>Example: choose Monday + Wednesday + Friday and set Repeat until the last day of the month. The LMS creates each class separately and students see the complete timetable automatically.</p></div></div>`;
    openClassroomModal(
      item?'Edit live class':'Schedule live class / monthly timetable',
      'Choose the course and time. Zoom meetings are created automatically. Repeating schedules create separate class entries so every date can be started, ended and recorded independently.',
      `<form id="instructorLiveForm" class="auth-form">
        <input type="hidden" name="id" value="${item?.id||''}">
        <div class="form-grid">
          <div class="form-group"><label>Course</label><select class="form-control" name="course_id" data-role="classroom-course-select" required>${instructorCourseOptions(courseId)}</select></div>
          <div class="form-group"><label>Lesson (optional)</label><select class="form-control" name="lesson_key" data-role="classroom-lesson-select">${instructorLessonOptions(courseId,item?.lesson_key||'')}</select></div>
          <div class="form-group full"><label>Class title</label><input class="form-control" name="title" required value="${escapeHtml(item?.title||'')}"></div>
          <div class="form-group"><label>First class starts</label><input class="form-control" type="datetime-local" name="starts_at" required value="${classroomDateInput(item?.starts_at)}"></div>
          <div class="form-group"><label>First class ends</label><input class="form-control" type="datetime-local" name="ends_at" value="${classroomDateInput(item?.ends_at)}"><small>If blank, repeating classes default to 60 minutes.</small></div>
          ${scheduleFields}
          ${item?.meeting_id?`<div class="form-group"><label>Zoom Meeting ID</label><input class="form-control" value="${escapeHtml(item.meeting_id)}" readonly></div><div class="form-group"><label>Passcode</label><input class="form-control" value="${escapeHtml(item.passcode||'')}" readonly></div>`:'<div class="form-group full"><div class="alert-card"><strong>Zoom meetings are automatic</strong><p>You do not need to paste a Zoom URL, Meeting ID or passcode. A meeting is created for every scheduled occurrence.</p></div></div>'}
          <div class="form-group full"><label>Recording URL <small>Optional — normally added after one completed class.</small></label><input class="form-control" type="url" name="recording_url" value="${escapeHtml(item?.recording_url||'')}"></div>
          <div class="form-group"><label>Status</label><select class="form-control" name="status">${['scheduled','live','ended','cancelled'].map(x=>`<option ${item?.status===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="form-group full"><label>Description</label><textarea class="form-control" name="description">${escapeHtml(item?.description||'')}</textarea></div>
        </div>
        <button class="button button-primary button-block" type="submit">${item?'Update This Class':'Create Schedule'}</button>
      </form>`
    );
  }

  function quizQuestionEditor(q={},index=0){const opts=Array.isArray(q.options)?q.options.join('\n'):'';return `<article class="quiz-question-editor"><div class="ic-builder-head"><strong>Question ${index+1}</strong><button type="button" data-action="quiz-remove-question">Remove</button></div><div class="form-grid"><div class="form-group full"><label>Question</label><input class="form-control" data-field="quiz-question" value="${escapeHtml(q.question||'')}"></div><div class="form-group"><label>Type</label><select class="form-control" data-field="quiz-type"><option value="mcq" ${q.type!=='true_false'?'selected':''}>Multiple choice</option><option value="true_false" ${q.type==='true_false'?'selected':''}>True / False</option></select></div><div class="form-group"><label>Correct answer #</label><input class="form-control" type="number" min="1" max="10" data-field="quiz-correct" value="${Number(q.correct??0)+1}"></div><div class="form-group"><label>Points</label><input class="form-control" type="number" min="1" max="100" data-field="quiz-points" value="${q.points||1}"></div><div class="form-group full"><label>Choices <small>One choice per line. For True/False this is ignored.</small></label><textarea class="form-control" rows="4" data-field="quiz-options">${escapeHtml(opts)}</textarea></div></div></article>`;}
  function openInstructorQuizForm(q=null,preferredCourseId='',options={}){
    const courseId=Number(q?.course_id||preferredCourseId||instructorCourses()[0]?.id||0),questions=Array.isArray(q?.questions)&&q.questions.length?q.questions:[{}],quizType=q?.quiz_type||options.quizType||'checkpoint',sequence=Number(q?.sequence_order??options.sequenceOrder??(quizType==='final'?9999:999)),canSkip=q?Boolean(q.can_skip):Boolean(options.canSkip);
    openClassroomModal(q?'Edit quiz':quizType==='final'?'Add final quiz':'Add checkpoint quiz','Place this quiz anywhere in the course sequence. Required quizzes block later content until a learner submits an attempt.',`<form id="instructorQuizForm"><input type="hidden" name="id" value="${q?.id||''}"><input type="hidden" name="course_id" value="${courseId}"><div class="form-grid"><div class="form-group full"><label>Course</label><input class="form-control" value="${escapeHtml(instructorCourses().find(c=>Number(c.id)===courseId)?.title||'Assigned course')}" readonly></div><div class="form-group"><label>Quiz type</label><select class="form-control" name="quiz_type"><option value="checkpoint" ${quizType==='checkpoint'?'selected':''}>Checkpoint quiz</option><option value="final" ${quizType==='final'?'selected':''}>Final quiz</option></select></div><div class="form-group"><label>Position in course</label><input class="form-control" type="number" step="0.1" min="0" name="sequence_order" value="${sequence}"><small>1.5 places it between lecture 1 and lecture 2.</small></div><div class="form-group full"><label>Quiz title</label><input class="form-control" name="title" required value="${escapeHtml(q?.title||'')}"></div><div class="form-group"><label>Due date</label><input class="form-control" type="datetime-local" name="due_at" value="${classroomDateInput(q?.due_at)}"></div><div class="form-group"><label>Attempts allowed</label><input class="form-control" type="number" min="1" max="10" name="attempts_allowed" value="${q?.attempts_allowed||1}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="published" ${q?.status!=='draft'?'selected':''}>Published</option><option value="draft" ${q?.status==='draft'?'selected':''}>Draft</option></select></div><div class="form-group"><label class="checkbox-line course-skip-toggle"><input type="checkbox" name="can_skip" value="1" ${canSkip?'checked':''}><span><strong>Allow learner to skip</strong><small>If off, later course items remain locked until one attempt is submitted.</small></span></label></div><div class="form-group full"><label>Description</label><textarea class="form-control" name="description">${escapeHtml(q?.description||'')}</textarea></div></div><div id="quizQuestionBuilder">${questions.map(quizQuestionEditor).join('')}</div><div class="coursework-form-footer"><button class="button button-secondary" type="button" data-action="quiz-add-question">+ Add Question</button><button class="button button-primary" type="submit">Save Quiz</button></div></form>`);
  }
  function collectQuizQuestions(form){return [...form.querySelectorAll('.quiz-question-editor')].map((row,index)=>{const type=row.querySelector('[data-field="quiz-type"]')?.value||'mcq';return {id:`q${index+1}`,question:row.querySelector('[data-field="quiz-question"]')?.value.trim()||'',type,options:type==='true_false'?['True','False']:String(row.querySelector('[data-field="quiz-options"]')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),correct:Math.max(0,Number(row.querySelector('[data-field="quiz-correct"]')?.value||1)-1),points:Number(row.querySelector('[data-field="quiz-points"]')?.value||1)};}).filter(q=>q.question);}

  function openInstructorAssignmentForm(a=null,preferredCourseId='',options={}){
    const courseId=Number(a?.course_id||preferredCourseId||instructorCourses()[0]?.id||0),sequence=Number(a?.sequence_order??options.sequenceOrder??999);
    openClassroomModal(a?'Edit assignment':'Add assignment','Assignments live inside the course sequence and can be placed between any lectures.',`<form id="instructorAssignmentForm" class="auth-form" enctype="multipart/form-data"><input type="hidden" name="id" value="${a?.id||''}"><input type="hidden" name="course_id" value="${courseId}"><div class="form-grid"><div class="form-group full"><label>Course</label><input class="form-control" value="${escapeHtml(instructorCourses().find(c=>Number(c.id)===courseId)?.title||'Assigned course')}" readonly></div><div class="form-group"><label>Position in course</label><input class="form-control" type="number" step="0.1" min="0" name="sequence_order" value="${sequence}"><small>Use 2.5 to place it between item 2 and 3.</small></div><div class="form-group"><label>Points</label><input class="form-control" type="number" min="0" step="0.5" name="points" value="${a?.points??100}"></div><div class="form-group full"><label>Assignment title</label><input class="form-control" name="title" required value="${escapeHtml(a?.title||'')}"></div><div class="form-group"><label>Due date</label><input class="form-control" type="datetime-local" name="due_at" value="${classroomDateInput(a?.due_at)}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="published" ${a?.status!=='draft'?'selected':''}>Published</option><option value="draft" ${a?.status==='draft'?'selected':''}>Draft</option></select></div><div class="form-group full"><label>Instructions</label><textarea class="form-control" rows="6" name="instructions">${escapeHtml(a?.instructions||'')}</textarea></div><div class="form-group full"><label>Attachment URL</label><input class="form-control" name="attachment_url" value="${escapeHtml(a?.attachment_url||'')}"></div><div class="form-group full"><label>Or upload attachment</label><label class="classroom-upload"><input type="file" name="attachment" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp"><span class="classroom-upload-icon">${icon('upload')}</span><span class="classroom-upload-copy"><strong>Choose an assignment resource</strong><small data-role="classroom-file-name">PDF, Office, ZIP, image or text · max 20 MB</small></span><span class="classroom-upload-button">Browse</span></label></div></div><button class="button button-primary button-block" type="submit">Save Assignment</button></form>`);
  }
  function openInstructorGradeForm(sub){openClassroomModal(`Review — ${sub.assignment_title||'Assignment'}`,`${sub.student_name} · ${sub.course_title||'Course'}`,`<div class="submission-review"><h3>Student response</h3><p>${textHtml(sub.submission_text||'No written response.')}</p>${sub.file_url?`<a class="button button-secondary button-sm" href="${escapeHtml(sub.file_url)}" target="_blank" rel="noopener">${icon('download')} Open attachment</a>`:''}</div><form id="instructorGradeForm" class="auth-form"><input type="hidden" name="id" value="${sub.id}"><div class="form-group"><label>Grade out of ${sub.points}</label><input class="form-control" type="number" min="0" max="${sub.points}" step="0.5" name="grade" required value="${sub.grade??''}"></div><div class="form-group"><label>Feedback</label><textarea class="form-control" rows="5" name="feedback">${escapeHtml(sub.feedback||'')}</textarea></div><button class="button button-primary button-block" type="submit">Save Grade & Feedback</button></form>`);}

  async function renderPublicProfile(slug){
    setChrome('public');app.innerHTML='<section class="page-section"><div class="container"><div class="panel">Loading public profile…</div></div></section>';
    try{const r=await apiRequest('public_profile',{method:'POST',body:{slug}});const p=r.profile,avatar=p.avatar?`<img src="${escapeHtml(p.avatar)}" alt="">`:initials(p.name);
      app.innerHTML=`<section class="public-profile-hero"><div class="container public-profile-head"><span class="profile-avatar-xl">${avatar}</span><div><span class="eyebrow light">Verified Academy ${escapeHtml(p.role)}</span><h1>${escapeHtml(p.name)}</h1><p>${escapeHtml(p.headline||'Full Stack Academy member')}</p><div class="public-profile-meta"><span>${icon('map')} ${escapeHtml([p.city,p.country].filter(Boolean).join(', '))}</span><span>${icon('building')} ${escapeHtml(p.branch||'Academy member')}</span></div></div></div></section><section class="page-section"><div class="container public-profile-grid"><main><article class="panel"><h2>About</h2><p>${escapeHtml(p.bio||'This member has not added a biography yet.')}</p><div class="skill-cloud">${(p.skills||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></article><article class="panel"><div class="panel-head"><h2>Approved certifications</h2><span>${r.certifications.length}</span></div>${r.certifications.length?r.certifications.map(c=>`<div class="public-cert-row"><span>${icon('award')}</span><div><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.issuer)}${c.credential_id?` · ${escapeHtml(c.credential_id)}`:''}</small></div></div>`).join(''):'<p class="muted">No approved certifications published yet.</p>'}</article></main><aside class="panel"><h2>${p.role==='instructor'?'Teaching portfolio':'Learning portfolio'}</h2><div class="profile-stat-row"><span><strong>${r.courses.length}</strong><span>Courses</span></span><span><strong>${p.role==='instructor'?r.courses.length:r.courses.filter(c=>c.status==='completed').length}</strong><span>${p.role==='instructor'?'Published':'Complete'}</span></span></div>${r.courses.map(c=>`<a class="public-course-row" href="#/course/${escapeHtml(c.slug)}"><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.category)}</small></a>`).join('')}</aside></div></section>`;initPage();
    }catch(e){app.innerHTML=`<section class="page-section"><div class="container"><div class="empty-state"><h2>Profile unavailable</h2><p>${escapeHtml(e.message)}</p></div></div></section>`;}
  }
  function lessonEntries(course) {
    const rows = [];
    (Array.isArray(course.modules)?course.modules:[]).forEach((module, mi) => (Array.isArray(module.lessons)?module.lessons:[]).forEach((lesson, li) => rows.push({ ...lesson, moduleTitle: module.title || `Module ${mi+1}`, mi, li, key: `${mi}-${li}` })));
    return rows;
  }

  function currentLessonFor(course) {
    const entries = lessonEntries(course);
    const saved = state.playerSelection[course.id];
    if (saved && entries.some(e=>e.key===saved)) return entries.find(e=>e.key===saved);
    const done = new Set(state.progress[course.id] || []);
    return entries.find(e=>!done.has(e.key)) || entries[0];
  }

  function lessonImageMarkup(lesson,course){
    const source=lesson.image||course.image||D.academyImages.player;
    return source?`<div class="lesson-reading-image">${imageMarkup(source,lesson.title,initials(course.title))}</div>`:'';
  }
  function lectureList(lesson){
    const videos=Array.isArray(lesson.videos)?lesson.videos.filter(Boolean):[];
    if(videos.length)return videos;
    if(lesson.videoUrl||lesson.videoProvider&&lesson.videoProvider!=='none')return [{title:'Video 01',duration:lesson.duration||'',videoUrl:lesson.videoUrl||'',content:'',image:''}];
    return [];
  }
  function currentLectureFor(course,lesson){
    const videos=lectureList(lesson);
    if(!videos.length)return null;
    const storageKey=`${course.id}:${lesson.key}`;
    const index=Math.max(0,Math.min(videos.length-1,Number(state.lectureSelection[storageKey]||0)));
    return {...videos[index],index};
  }
  function lectureVideoMarkup(course,lesson,lecture){
    if(lecture?.videoUrl){
      return `<div class="lesson-video-embed"><iframe src="${escapeHtml(lecture.videoUrl)}" title="${escapeHtml(lecture.title||lesson.title)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
    }
    const image=lecture?.image||lesson.image;
    if(image)return `<div class="lesson-video-placeholder">${imageMarkup(image,lecture?.title||lesson.title,initials(course.title))}<span><strong>${lecture?'Lecture reading':'Reading lesson'}</strong><small>Use the explanation and resources below.</small></span></div>`;
    return `<div class="lesson-video-placeholder">${imageMarkup(course.image||D.academyImages.player,lesson.title,initials(course.title))}<span><strong>${lecture?'Lecture content':'Lesson content'}</strong><small>No video has been added to this ${lecture?'lecture':'lesson'}.</small></span></div>`;
  }
  function lectureTabs(course,lesson,activeLecture){
    const videos=lectureList(lesson);
    if(videos.length<2)return '';
    return `<div class="lecture-tabs" role="tablist" aria-label="Lesson lecture videos">${videos.map((video,index)=>`<button class="lecture-tab ${activeLecture?.index===index?'active':''}" type="button" data-action="select-lecture" data-course="${course.id}" data-lesson="${lesson.key}" data-index="${index}"><span>${String(index+1).padStart(2,'0')}</span>${escapeHtml(video.title||`Video ${String(index+1).padStart(2,'0')}`)}${video.duration?`<small>${escapeHtml(video.duration)}</small>`:''}</button>`).join('')}</div>`;
  }
  function classroomForLesson(items,lessonKey){return (Array.isArray(items)?items:[]).filter(item=>!item.lesson_key||item.lesson_key===lessonKey);}
  function playerClassroomContent(course,lesson){
    const room=course.classroom||{}, sessions=classroomForLesson(room.live_sessions,lesson.key), quizzes=classroomForLesson(room.quizzes,lesson.key), assignments=classroomForLesson(room.assignments,lesson.key), attempts=room.quiz_attempts||{}, submissions=room.assignment_submissions||{};
    return `<div class="lesson-tabs-content classroom-student"><div class="classroom-section-head"><div><span class="eyebrow">Google Classroom style</span><h3>Classroom for this lesson</h3><p class="muted">Join live teaching, replay recordings, take quizzes and submit assignments without leaving your private course.</p></div></div>
      <section class="classroom-student-section"><div class="panel-head"><h4>${icon('radio')} Live classes & recordings</h4><span>${sessions.length}</span></div>${sessions.length?`<div class="classroom-list">${sessions.map(item=>`<article class="classroom-row student"><span class="classroom-row-icon">${icon(item.status==='ended'?'video':'radio')}</span><div><strong>${escapeHtml(item.title)}</strong><small>${classroomDate(item.starts_at)} · ${escapeHtml(item.status)}</small>${item.description?`<p>${escapeHtml(item.description)}</p>`:''}</div><div class="classroom-row-actions">${item.meeting_id&&item.status!=='ended'?`<a class="button button-primary button-sm" href="#/live-classes">Open Live Classes</a>`:''}${item.recording_url?`<a class="button button-secondary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener">Watch Recording</a>`:''}</div></article>`).join('')}</div>`:'<p class="muted">No live class or recording has been attached to this lesson yet.</p>'}</section>
      <section class="classroom-student-section"><div class="panel-head"><h4>${icon('note')} Quizzes</h4><span>${quizzes.length}</span></div>${quizzes.length?`<div class="classwork-card-grid">${quizzes.map(q=>{const a=attempts[q.id]||{};const used=Number(a.attempts||0),left=Math.max(0,Number(q.attempts_allowed||1)-used);return `<article class="classwork-card"><span class="classwork-icon">${icon('note')}</span><div><strong>${escapeHtml(q.title)}</strong><p>${escapeHtml(q.description||`${(q.questions||[]).length} questions`)}</p><small>${q.due_at?`Due ${classroomDate(q.due_at)} · `:''}${left} attempt${left===1?'':'s'} left${used?` · Best ${a.best_score}/${a.max_score}`:''}</small></div><button class="button button-primary button-sm" data-action="student-open-quiz" data-id="${q.id}" ${left<1?'disabled':''}>${used?'Try Again':'Start Quiz'}</button></article>`}).join('')}</div>`:'<p class="muted">No quiz has been assigned here.</p>'}</section>
      <section class="classroom-student-section"><div class="panel-head"><h4>${icon('project')} Assignments</h4><span>${assignments.length}</span></div>${assignments.length?`<div class="classwork-card-grid">${assignments.map(a=>{const sub=submissions[a.id]||null;return `<article class="classwork-card"><span class="classwork-icon">${icon('project')}</span><div><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.instructions||'Open the assignment to view instructions and submit your work.')}</p><small>${a.points} points${a.due_at?` · Due ${classroomDate(a.due_at)}`:''}${sub?` · ${sub.status==='graded'?`Graded ${sub.grade}/${a.points}`:'Submitted'}`:''}</small></div><button class="button ${sub?'button-secondary':'button-primary'} button-sm" data-action="student-open-assignment" data-id="${a.id}">${sub?'View / Resubmit':'Open Assignment'}</button></article>`}).join('')}</div>`:'<p class="muted">No assignment has been posted here.</p>'}</section></div>`;
  }

  function currentSecureCourse(){const slug=state.currentPath.split('/')[2];return state.playerCourses[slug]?.course||courseBySlug(slug);}
  function closeStudentClassroomModal(){document.getElementById('studentClassroomModal')?.remove();if(!document.querySelector('.classroom-modal'))document.body.classList.remove('locked');}
  function openStudentClassroomModal(title,body){
    closeStudentClassroomModal();
    document.body.classList.add('locked');
    document.body.insertAdjacentHTML('beforeend',`<div class="profile-action-modal classroom-modal classroom-modal-student" id="studentClassroomModal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><section class="profile-action-card classroom-modal-card"><header class="classroom-modal-header"><div class="classroom-modal-heading"><span class="eyebrow">Private classroom</span><h2>${escapeHtml(title)}</h2></div><button class="icon-button profile-action-close classroom-modal-close" type="button" data-action="close-student-classroom-modal" aria-label="Close">${icon('x')}</button></header><div class="classroom-modal-body">${body}</div></section></div>`);
  }
  function setStudentQuizStep(form,nextIndex){
    if(!form)return;
    const steps=[...form.querySelectorAll('.student-quiz-step')];
    if(!steps.length)return;
    const index=Math.max(0,Math.min(steps.length-1,Number(nextIndex)||0));
    form.dataset.step=String(index);
    steps.forEach((step,i)=>step.classList.toggle('active',i===index));
    const label=form.querySelector('[data-role="quiz-step-label"]');if(label)label.textContent=`Question ${index+1} of ${steps.length}`;
    const fill=form.querySelector('[data-role="quiz-progress-fill"]');if(fill)fill.style.width=`${Math.round(((index+1)/steps.length)*100)}%`;
    const prev=form.querySelector('[data-action="student-quiz-prev"]');if(prev)prev.hidden=index===0;
    const next=form.querySelector('[data-action="student-quiz-next"]');if(next)next.hidden=index>=steps.length-1;
    const submit=form.querySelector('[data-role="quiz-submit"]');if(submit)submit.hidden=index<steps.length-1;
    steps[index]?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function openStudentQuiz(quizId){
    const course=currentSecureCourse(),quiz=(course?.classroom?.quizzes||[]).find(q=>Number(q.id)===Number(quizId));if(!quiz)return;
    const questions=Array.isArray(quiz.questions)?quiz.questions:[],attempt=course.classroom?.quiz_attempts?.[quiz.id]||{};
    if(!questions.length){toast('This quiz has no questions yet.','error');return;}
    const used=Number(attempt.attempts||0),allowed=Number(quiz.attempts_allowed||1),left=Math.max(0,allowed-used);
    if(left<1){toast('No quiz attempts remaining.','error');return;}
    openStudentClassroomModal(quiz.title,`<div class="quiz-wizard-intro"><p>${escapeHtml(quiz.description||'Complete each question one step at a time. Your score is calculated automatically when you submit.')}</p>${attempt.attempts?`<div class="quiz-score-note">Previous best: <strong>${attempt.best_score}/${attempt.max_score}</strong> · ${left} attempt${left===1?'':'s'} remaining</div>`:''}<div class="quiz-wizard-progress"><div><strong data-role="quiz-step-label">Question 1 of ${questions.length}</strong><span>${questions.length} total question${questions.length===1?'':'s'}</span></div><div class="progress-track"><div class="progress-fill" data-role="quiz-progress-fill" style="width:${Math.round(100/questions.length)}%"></div></div></div></div><form id="studentQuizForm" class="auth-form student-quiz-wizard" data-step="0"><input type="hidden" name="quiz_id" value="${quiz.id}"><div class="student-quiz-steps">${questions.map((q,index)=>`<fieldset class="student-quiz-step ${index===0?'active':''}" data-step="${index}"><legend><span>${index+1}</span><span>${escapeHtml(q.question)}</span></legend><div class="quiz-option-list">${(q.options||[]).map((option,oi)=>`<label><input type="radio" name="q_${escapeHtml(q.id)}" value="${oi}"><span class="quiz-option-letter">${String.fromCharCode(65+oi)}</span><span>${escapeHtml(option)}</span></label>`).join('')}</div><small class="quiz-question-points">${Number(q.points||1)} point${Number(q.points||1)===1?'':'s'}</small></fieldset>`).join('')}</div><div class="quiz-wizard-nav"><button class="button button-secondary" type="button" data-action="student-quiz-prev" hidden>${icon('arrowLeft')} Previous</button><span>Answers are saved on this screen until you submit.</span><button class="button button-primary" type="button" data-action="student-quiz-next" ${questions.length===1?'hidden':''}>Next ${icon('arrow')}</button><button class="button button-primary" type="submit" data-role="quiz-submit" ${questions.length>1?'hidden':''}>Submit Quiz</button></div></form>`);
  }
  function openStudentAssignment(assignmentId){
    const course=currentSecureCourse(),a=(course?.classroom?.assignments||[]).find(x=>Number(x.id)===Number(assignmentId));if(!a)return;
    const sub=course.classroom?.assignment_submissions?.[a.id]||{};
    const submitted=!!sub.submitted_at;
    const graded=sub.status==='graded';
    openStudentClassroomModal(a.title,`<div class="assignment-brief premium"><div class="assignment-brief-top"><div><span class="course-category">${escapeHtml(course?.title||'Course assignment')}</span><p>${textHtml(a.instructions||'Complete the assignment and submit your work below.')}</p></div><div class="assignment-meta"><span>${Number(a.points||0)} points</span>${a.due_at?`<span>Due ${classroomDate(a.due_at)}</span>`:'<span>No deadline</span>'}</div></div>${a.attachment_url?`<a class="assignment-resource-link" href="${escapeHtml(a.attachment_url)}" target="_blank" rel="noopener">${icon('download')}<span><strong>Instructor attachment</strong><small>Open the file provided with this assignment</small></span>${icon('arrow')}</a>`:''}${graded?`<div class="graded-feedback"><span>${icon('award')}</span><div><strong>Graded ${sub.grade}/${a.points}</strong><p>${escapeHtml(sub.feedback||'No written feedback added.')}</p></div></div>`:submitted?`<div class="submission-saved-note">${icon('check')} Your previous submission is loaded below. You can update it and resubmit.</div>`:''}</div><form id="studentAssignmentForm" class="auth-form classroom-assignment-form" enctype="multipart/form-data"><input type="hidden" name="assignment_id" value="${a.id}"><input type="hidden" name="file_url" value="${escapeHtml(sub.file_url||'')}"><div class="form-group"><label>Written response <small>Explain your work, answer the brief, or add notes for your instructor.</small></label><textarea class="form-control" rows="6" name="submission_text" placeholder="Write your assignment response here...">${escapeHtml(sub.submission_text||'')}</textarea></div><div class="form-group"><label>Attachment <small>Optional · PDF, Office, ZIP, image or text · max 20 MB.</small></label><label class="classroom-upload"><input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp"><span class="classroom-upload-icon">${icon('upload')}</span><span class="classroom-upload-copy"><strong>${sub.file_url?'Replace submitted file':'Choose a file to attach'}</strong><small data-role="classroom-file-name">${sub.file_url?'Current attachment will remain unless you choose another file.':'No file selected'}</small></span><span class="classroom-upload-button">Browse</span></label></div>${sub.file_url?`<a class="current-submission-file" href="${escapeHtml(sub.file_url)}" target="_blank" rel="noopener">${icon('paperclip')} View current submitted attachment</a>`:''}<button class="button button-primary button-block" type="submit">${submitted?'Resubmit Assignment':'Turn In Assignment'}</button></form>`);
  }
  async function refreshSecureClassroom(){const slug=state.currentPath.split('/')[2];if(slug){delete state.playerCourses[slug];await renderPlayer(slug);}}

  function courseRichBlockMarkup(block={}){
    const type=block.type||'text',title=String(block.title||'').trim(),text=String(block.text||block.description||'').trim(),url=String(block.url||'').trim();
    if(type==='image'&&url)return `<figure class="course-rich-block course-rich-image">${imageMarkup(url,title||'Course content','Course content')}${title||text?`<figcaption>${title?`<strong>${escapeHtml(title)}</strong>`:''}${text?`<span>${textHtml(text)}</span>`:''}</figcaption>`:''}</figure>`;
    if(type==='video'&&url){const direct=/\.(?:mp4|webm|mov)(?:[?#].*)?$/i.test(url);return `<section class="course-rich-block course-rich-video">${title?`<h4>${escapeHtml(title)}</h4>`:''}<div class="course-rich-video-frame">${direct?`<video src="${escapeHtml(url)}" controls preload="metadata" playsinline></video>`:`<iframe src="${escapeHtml(url)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`}</div>${text?`<div class="lesson-rich-text">${textHtml(text)}</div>`:''}</section>`;}
    if((type==='file'||type==='link')&&url)return `<article class="course-rich-block course-rich-file"><span>${icon(type==='file'?'download':'arrow')}</span><div>${title?`<strong>${escapeHtml(title)}</strong>`:'<strong>Course resource</strong>'}${text?`<p>${escapeHtml(text)}</p>`:''}</div><a class="button button-secondary button-sm" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open</a></article>`;
    return `<section class="course-rich-block course-rich-text">${title?`<h4>${escapeHtml(title)}</h4>`:''}${text?`<div class="lesson-rich-text">${textHtml(text)}</div>`:''}</section>`;
  }
  function moduleIntroMarkup(course,lesson){const module=course.modules?.[lesson.mi]||{},points=Array.isArray(module.points)?module.points:[],blocks=Array.isArray(module.contentBlocks)?module.contentBlocks:[];if(!module.description&&!points.length&&!blocks.length)return '';return `<section class="module-intro-panel"><div class="module-intro-heading"><span class="eyebrow">${escapeHtml(module.title||'Module')}</span>${module.description?`<p>${textHtml(module.description)}</p>`:''}</div>${points.length?`<ul class="module-point-list">${points.map(point=>`<li>${icon('check')}<span>${escapeHtml(point)}</span></li>`).join('')}</ul>`:''}${blocks.length?`<div class="module-rich-blocks">${blocks.map(courseRichBlockMarkup).join('')}</div>`:''}</section>`;}
  function playerTabContent(course, lesson, tab) {
    const noteKey = `${course.id}:${lesson.key}`;
    const lecture=currentLectureFor(course,lesson);
    if (tab === 'notes') return `<div class="lesson-tabs-content"><h3>Lesson notes</h3><p class="muted">Your notes are stored securely in your learner account.</p><textarea class="form-control lesson-note-area" id="lessonNotes" data-note-key="${noteKey}" placeholder="Write key ideas, questions or project reminders...">${escapeHtml(state.notes[noteKey] || '')}</textarea><button class="button button-primary button-sm" style="margin-top:12px" data-action="save-notes" data-note-key="${noteKey}">Save Notes</button></div>`;
    if (tab === 'resources') {
      const resources=Array.isArray(lesson.resources)?lesson.resources:[];
      return `<div class="lesson-tabs-content"><h3>Lesson resources</h3>${resources.length?`<div class="resource-list">${resources.map((resource,index)=>`<article class="resource-item"><span class="resource-item-left"><i class="resource-item-icon">${icon(index%2?'code':'note')}</i><span><strong>${escapeHtml(resource.title||'Lesson resource')}</strong><span>Course resource</span></span></span><a class="button button-secondary button-sm" href="${escapeHtml(resource.url||'#/contact')}" target="_blank" rel="noopener">${icon('download')} Open</a></article>`).join('')}</div>`:`<div class="empty-state compact"><p>No resources have been added for this lesson.</p></div>`}</div>`;
    }
    if (tab === 'classroom') return playerClassroomContent(course, lesson);
    if (tab === 'discussion') return `<div class="lesson-tabs-content"><h3>Class discussion</h3><div class="form-section"><p class="muted">Discussion access is available for supported instructor-led batches. Contact academy support to ask a course question.</p><a class="button button-primary button-sm" href="mailto:${escapeHtml(siteSettings.support_email||'info@fullstackacademy.in')}?subject=${encodeURIComponent(course.title + ' course question')}">Email Course Support</a></div></div>`;
    const lectureContent=String(lecture?.content||'').trim();
    const lessonContent=String(lesson.content||'').trim();
    return `<div class="lesson-tabs-content lesson-reading">${moduleIntroMarkup(course,lesson)}<h3>${escapeHtml(lecture?.title||'About this lesson')}</h3>${lectureContent?`<div class="lesson-rich-text">${textHtml(lectureContent)}</div>`:''}${lecture?.image?`<div class="lesson-reading-image">${imageMarkup(lecture.image,lecture.title||lesson.title,initials(course.title))}</div>`:''}${lessonContent?`<div class="lesson-overview-block"><h4>Lesson overview</h4><div class="lesson-rich-text">${textHtml(lessonContent)}</div></div>`:(!lectureContent?`<p>This lesson is part of <strong>${escapeHtml(course.title)}</strong> and focuses on <strong>${escapeHtml(lesson.title)}</strong>.</p>`:'')}${!lecture?.image&&lesson.image?lessonImageMarkup(lesson,course):''}${lesson.pdfUrl?`<div class="lesson-overview-pdf"><span>${icon('note')}<span><strong>PDF lesson overview</strong><small>Open or download the instructor's lesson summary.</small></span></span><a class="button button-secondary button-sm" href="${escapeHtml(lesson.pdfUrl)}" target="_blank" rel="noopener">${icon('download')} Open PDF</a></div>`:''}</div>`;
  }
  function playerCourseById(id){
    const cached=Object.values(state.playerCourses).map(item=>item.course).find(course=>Number(course.id)===Number(id));
    return cached||courseById(id);
  }
  async function securePlayerCourse(slug,baseCourse){
    const cached=state.playerCourses[slug];
    if(cached && Date.now()-cached.fetchedAt<30000)return cached.course;
    const result=await apiRequest('course_player',{method:'POST',body:{course_id:baseCourse.id}});
    const course={...baseCourse,...(result.course||{}),classroom:result.classroom||{}};
    state.playerCourses[slug]={course,fetchedAt:Date.now(),access:result.access||{}};
    return course;
  }
  // Coursera-style Physical course content, inside the existing learner dashboard.
  // This intentionally does not use Recorded/Live materials or lecturer uploads.
  let physicalPageData=null;
  let physicalSectionIndex=0;
  let physicalRenderRequest=0;
  const physicalSafeMedia=value=>{
    const url=String(value||'').trim();
    return /^(https?:\/\/|uploads\/|assets\/)/i.test(url)?escapeHtml(url):'';
  };
  if(typeof document!=="undefined"&&!document.getElementById("physicalRichLessonStyle")){const style=document.createElement("style");style.id="physicalRichLessonStyle";style.textContent=".pc-lesson-code{background:#18212c;color:#e7eef7;border-radius:12px;padding:18px;overflow-x:auto;white-space:pre;font:14px/1.7 ui-monospace,Consolas,monospace}.pc-learning-rich p{line-height:1.8}.pc-learning-rich .pc-lesson-list{padding-left:20px}.pc-inline-code{color:#852937;background:#f7edef;border-radius:4px;padding:2px 5px}.pc-code-caption{color:#852937;font-weight:700;margin-bottom:8px}.pc-syntax-keyword{color:#c792ea}.pc-syntax-string{color:#a4d68e}.pc-syntax-number{color:#f9ba67}.pc-syntax-comment{color:#8492a6;font-style:italic}";document.head.appendChild(style);}
  function physicalHighlightSource(source){
    const token=/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|async|await|class|import|from|export|default|true|false|null|undefined|SELECT|FROM|WHERE|INSERT|INTO|CREATE|TABLE|def|print|echo|public|private)\b|\b\d+(?:\.\d+)?\b)/gm;
    let result='',last=0,match;
    const html=part=>escapeHtml(part);
    while((match=token.exec(source))!==null){result+=html(source.slice(last,match.index));const v=match[0];const name=/^(\/\/|#|\/\*)/.test(v)?'comment':/^["'`]/.test(v)?'string':/^\d/.test(v)?'number':'keyword';result+='<span class="pc-syntax-'+name+'">'+html(v)+'</span>';last=token.lastIndex;}
    return result+html(source.slice(last));
  }
  function physicalRichText(value){
    const lines=String(value||'').replace(/\r/g,'').split('\n');let html='',code=[],lang='text';
    const inline=line=>{
      let s=escapeHtml(line);s=s.replace(/`([^`]+)`/g,'<code class="pc-inline-code">$1</code>');
      s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
      s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>'<a href="'+url.replace(/&quot;/g,'')+'" target="_blank" rel="noopener noreferrer">'+label+'</a>');return s;
    };
    for(const line of lines){const f=line.match(/^```([a-zA-Z0-9]*)\s*$/);if(f){if(code!==null && code.length){html+='<pre class="pc-lesson-code"><code>'+physicalHighlightSource(code.join('\n'))+'</code></pre>';code=[];}if(lang==='__open__'){lang='text';}else{lang='__open__';}continue;}
      if(lang==='__open__'){code.push(line);continue;}
      if(/^### /.test(line))html+='<h4>'+inline(line.slice(4))+'</h4>';
      else if(/^## /.test(line))html+='<h3>'+inline(line.slice(3))+'</h3>';
      else if(/^# /.test(line))html+='<h2>'+inline(line.slice(2))+'</h2>';
      else if(/^[-*] /.test(line))html+='<div class="pc-lesson-list">• '+inline(line.slice(2))+'</div>';
      else if(/^\d+\. /.test(line))html+='<div class="pc-lesson-list">'+inline(line)+'</div>';
      else if(line.trim())html+='<p>'+inline(line)+'</p>';
    }
    if(code.length)html+='<pre class="pc-lesson-code"><code>'+physicalHighlightSource(code.join('\n'))+'</code></pre>';
    return html;
  }
  function physicalLearnerBlock(block,completed){
    if(block.type==='locked')return `<div class="pc-locked"><span>${icon('lock')}</span><div><strong>Next content is locked</strong><p>Submit the required quiz or assignment above to continue.</p></div></div>`;
    const title=block.title?`<h2>${escapeHtml(block.title)}</h2>`:'';
    const text=block.text?`<p>${textHtml(block.text)}</p>`:'';
    if(block.type==='banner')return `<header class="pc-learning-banner">${physicalSafeMedia(block.url)?`<img src="${physicalSafeMedia(block.url)}" alt="" loading="lazy">`:''}<div class="pc-learning-banner-text"><span>PHYSICAL COURSE</span><h2>${escapeHtml(block.title||'Welcome')}</h2>${text}</div></header>`;
    if(block.type==='heading')return `<div class="pc-learning-block pc-learning-heading"><h2>${escapeHtml(block.title||'Lesson heading')}</h2></div>`;
    if(block.type==='paragraph')return `<article class="pc-learning-block pc-learning-rich">${title}${physicalRichText(block.text||'')}</article>`;
    if(block.type==='code')return `<article class="pc-learning-block pc-learning-code">${title}<div class="pc-code-caption">${escapeHtml(block.language||'text')}</div><pre class="pc-lesson-code"><code data-code-language="${escapeHtml(block.language||'text')}">${physicalHighlightSource(String(block.text||''))}</code></pre></article>`;
    if(block.type==='callout')return `<aside class="pc-learning-block pc-learning-callout">${title}${text}</aside>`;
    if(block.type==='divider')return `<hr class="pc-learning-divider">`;
    if(block.type==='image')return `<figure class="pc-learning-block pc-learning-figure">${block.url&&physicalSafeMedia(block.url)?`<img src="${physicalSafeMedia(block.url)}" alt="${escapeHtml(block.title||'Course image')}" loading="lazy">`:''}${block.title?`<figcaption>${escapeHtml(block.title)}</figcaption>`:''}</figure>`;
    if(block.type==='gallery')return `<div class="pc-learning-block">${title}<div class="pc-learning-gallery">${(block.images||[]).filter(physicalSafeMedia).map((url,i)=>`<img src="${physicalSafeMedia(url)}" loading="lazy" alt="${escapeHtml(block.title||'Gallery')} ${i+1}">`).join('')}</div></div>`;
    if(block.type==='download')return `<div class="pc-learning-block pc-learning-download">${title}${physicalSafeMedia(block.url)?`<a class="button button-secondary button-sm" href="${physicalSafeMedia(block.url)}" target="_blank" rel="noopener noreferrer">${icon('download')} Open resource</a>`:'<p>Resource will be added soon.</p>'}</div>`;
    if(block.type==='quiz'||block.type==='assignment'){
      const done=completed.includes(block.id);
      const answers=(block.choices||[]).map((value,i)=>`<label class="pc-quiz-answer"><input type="radio" name="answer" value="${i}" required><span>${escapeHtml(value)}</span></label>`).join('');
      return `<article class="pc-learning-block pc-learning-activity"><div class="pc-activity-kicker">${block.type==='quiz'?'Knowledge check':'Practice assignment'} ${block.required?'<span class="pc-required-tag">Submission required</span>':'<span class="pc-optional-tag">Optional</span>'}</div>${title}${text}${done?`<div class="pc-activity-complete">${icon('check')} Submitted successfully${block.required?' · Next content unlocked':''}</div>`:`<form class="physical-activity-form" data-block-id="${escapeHtml(block.id)}" data-course-id="${Number(physicalPageData.course.id)}">${block.type==='quiz'?`<fieldset class="pc-quiz-options"><legend class="sr-only">Choose one answer</legend>${answers}</fieldset>`:`<label class="pc-assignment-answer">Your written submission<textarea name="answer" rows="5" placeholder="Write your response here…" minlength="10" required></textarea></label>`}<button type="submit" class="button button-primary">${block.type==='quiz'?'Submit answer':'Submit assignment'} ${icon('arrow')}</button></form>`}</article>`;
    }
    return '';
  }
  function physicalSectionCanOpen(index){
    if(!physicalPageData)return false;
    const section=physicalPageData.sections[index];
    return !!section && !section.locked;
  }
  function physicalLessonKind(section){return ['quiz','assignment'].includes(section?.kind)?section.kind:'lesson';}
  function physicalModuleLabel(section){return String(section?.module||'Course introduction').trim()||'Course introduction';}
  function renderPhysicalPageView(){
    if(!physicalPageData)return;
    const {course,sections,progress}=physicalPageData;
    physicalSectionIndex=Math.min(Math.max(0,physicalSectionIndex),sections.length-1);
    if(!physicalSectionCanOpen(physicalSectionIndex))physicalSectionIndex=0;
    const section=sections[physicalSectionIndex];
    const submitted=progress?.submitted||[];
    const completed=(progress?.completed||[]).length;
    const required=Number(physicalPageData.required_total||0);
    const nextAllowed=physicalSectionCanOpen(physicalSectionIndex+1);
    const kind=physicalLessonKind(section),module=physicalModuleLabel(section);
    const toc=sections.map((s,i)=>{
      const label=physicalModuleLabel(s),k=physicalLessonKind(s);
      const group=i===0||label!==physicalModuleLabel(sections[i-1])?`<div class="pc-toc-module"><span>${icon('layers')}</span><strong>${escapeHtml(label)}</strong></div>`:'';
      return `${group}<button type="button" class="pc-toc-item ${i===physicalSectionIndex?'active':''}" data-action="pc-learner-nav" data-section="${i}" ${physicalSectionCanOpen(i)?'':'disabled'}><span class="pc-toc-number">${physicalSectionCanOpen(i)?(k==='quiz'?'?':k==='assignment'?'✓':String(i+1).padStart(2,'0')):icon('lock')}</span><span><strong>${escapeHtml(s.title)}</strong><small>${k==='quiz'?'Quiz':k==='assignment'?'Assignment':'Lesson'} ${s.locked?'· Locked':(s.blocks||[]).length+' widgets'}</small></span></button>`;
    }).join('');
    const content=`<div class="recorded-library-toolbar premium-recorded-toolbar offline-student-toolbar pc-learner-toolbar"><a href="#/my-courses">${icon('arrowLeft')} My Courses</a><div class="recorded-toolbar-actions"><span class="recorded-toolbar-course">Physical / Offline</span><span class="recorded-learning-status">${required?`${completed}/${required} checkpoints submitted`:'Classroom learning'}</span></div></div>
    <section class="player-shell recorded-private-course-shell offline-private-course-shell pc-learner-shell"><div class="player-layout recorded-private-layout offline-private-layout pc-learner-layout">
      <main class="lesson-stage recorded-private-stage offline-private-stage pc-learner-main"><div class="pc-learner-main-header"><div class="pc-learning-crumb">${escapeHtml(module)} <span>›</span> ${kind==='lesson'?'Lesson':kind==='quiz'?'Quiz':'Assignment'} ${physicalSectionIndex+1} of ${sections.length}</div><h1>${escapeHtml(section.title)}</h1>${section.description?`<p>${textHtml(section.description)}</p>`:'<p>Work through the content below, then complete any required activity to continue.</p>'}</div>
      <div class="pc-learner-blocks">${section.blocks.map(b=>physicalLearnerBlock(b,submitted)).join('')||'<div class="pc-learning-block">Content for this lesson has not been added yet.</div>'}</div>
      <footer class="pc-learner-pager"><button class="button button-secondary" data-action="pc-learner-nav" data-section="${physicalSectionIndex-1}" ${physicalSectionIndex===0?'disabled':''}>${icon('arrowLeft')} Previous</button>${physicalSectionIndex+1<sections.length?`<button class="button button-primary" data-action="pc-learner-nav" data-section="${physicalSectionIndex+1}" ${nextAllowed?'':'disabled'}>Next lesson ${icon('arrow')}</button>`:'<a class="button button-secondary" href="#/my-courses">Back to My Courses</a>'}</footer>
      </main>
      <aside class="curriculum-sidebar recorded-course-sidebar offline-course-sidebar pc-learner-toc"><div class="curriculum-sidebar-head"><span class="eyebrow">Course contents</span><h2>${escapeHtml(course.title)}</h2><p class="muted">${sections.length} lessons · ${required?`${completed} of ${required} required activities complete`:'Classroom learning'}</p></div><nav aria-label="Physical course lessons and modules" class="pc-toc-items">${toc}</nav></aside>
    </div></section>`;
    dashboardShell('my-courses',content,course.title,'Physical / Offline · Private classroom course');
    initPage();
  }
  async function renderPhysicalPrivatePage(slug){
    if(!state.loggedIn){routeTo('/login');return;}
    const course=courseBySlug(slug);if(!course){renderNotFound();return;}
    const offline=studentEnrollmentForCourse(course.id,'offline');
    const fallback=studentEnrollmentForCourse(course.id);
    if(!offline && fallback?.delivery_mode==='recorded'){routeTo(studentRecordedCourseEntry(course.id).replace(/^#/,''));return;}
    if(!offline && fallback?.delivery_mode==='live'){routeTo('/live-classes');return;}
    if(!offline){toast('Active Physical course enrollment is required.','error');routeTo('/my-courses');return;}
    dashboardShell('my-courses','<div class="panel player-loading offline-dashboard-loading"><div class="loading-spinner"></div><strong>Loading physical course…</strong></div>',course.title,'Physical / Offline course');
    const request=++physicalRenderRequest;
    try{
      physicalPageData=await apiRequest('physical_student_page',{query:{course_id:course.id}});
      if(request!==physicalRenderRequest)return;
      if(!physicalPageData.sections.length){dashboardShell('my-courses',`<div class="panel empty-state"><h3>Private classroom page not ready</h3><p>The academy has not added physical course content yet.</p><a class="button button-primary" href="#/my-courses">Back to My Courses</a></div>`,course.title,'Physical / Offline course');return;}
      physicalSectionIndex=0;
      renderPhysicalPageView();
    }catch(error){if(request!==physicalRenderRequest)return;dashboardShell('my-courses',`<div class="panel empty-state"><h3>Unable to open course</h3><p>${escapeHtml(error.message)}</p><a href="#/my-courses" class="button button-secondary">Back to My Courses</a></div>`,course.title,'Physical / Offline course');}
  }
  async function physicalSubmitActivity(form){
    const button=form.querySelector('button[type="submit"]');
    const fd=new FormData(form),answer=String(fd.get('answer')??'');
    if(answer.trim()===''){toast('Complete your answer before submitting.','error');return;}
    if(button)button.disabled=true;
    try{
      const result=await apiRequest('physical_student_submit',{method:'POST',body:{course_id:Number(form.dataset.courseId),block_id:form.dataset.blockId,answer}});
      toast(result.message||'Submission saved.');
      physicalPageData=await apiRequest('physical_student_page',{query:{course_id:Number(form.dataset.courseId)}});
      renderPhysicalPageView();
    }catch(error){toast(error.message,'error');if(button)button.disabled=false;}
  }

  async function renderPlayer(slug) {
    if (!state.loggedIn) { routeTo('/login'); return; }
    const baseCourse = courseBySlug(slug);
    if (!baseCourse) return renderNotFound();
    if (!state.enrollments.includes(Number(baseCourse.id))) { toast('This course is not active in your account. Contact the academy for access.','error'); routeTo('/my-courses'); return; }
    const offlineEnrollment=studentEnrollmentForCourse(baseCourse.id,'offline');
    const fallbackEnrollment=studentEnrollmentForCourse(baseCourse.id);
    const enrollment=offlineEnrollment||fallbackEnrollment;
    const purchasedMode=String(enrollment?.delivery_mode||'offline').toLowerCase();
    if(!offlineEnrollment&&purchasedMode==='recorded'){routeTo(studentRecordedCourseEntry(baseCourse.id).replace(/^#/,''));return;}
    if(!offlineEnrollment&&purchasedMode==='live'){routeTo('/live-classes');return;}
    dashboardShell('my-courses','<div class="panel player-loading offline-dashboard-loading"><div class="loading-spinner"></div><strong>Opening your secure course…</strong></div>',baseCourse.title,'Physical / Offline course');
    let course;
    try{course=await securePlayerCourse(slug,baseCourse);}catch(error){
      const failed=`<div class="panel empty-state premium-empty"><span class="empty-icon">${icon('lock')}</span><h3>Course could not be opened</h3><p>${escapeHtml(error.message)}</p><div class="cta-actions"><a class="button button-primary" href="#/my-courses">Back to My Courses</a><a class="button button-secondary" href="#/contact">Contact Academy</a></div></div>`;
      dashboardShell('my-courses',failed,baseCourse.title,'Physical / Offline course');
      return;
    }
    const entries = lessonEntries(course);
    if (!entries.length) {
      const empty=`<div class="panel empty-state premium-empty"><span class="empty-icon">${icon('book')}</span><h3>Lessons have not been added yet</h3><p>The course is active in your account, but the academy has not published curriculum lessons yet.</p><div class="cta-actions"><a class="button button-primary" href="#/course/${encodeURIComponent(course.slug)}">View Course Details</a><a class="button button-secondary" href="#/my-courses">Back to My Courses</a></div></div>`;
      dashboardShell('my-courses',empty,course.title,'Physical / Offline course');
      return;
    }
    const current = currentLessonFor(course);
    const currentLecture=currentLectureFor(course,current);
    const index = entries.findIndex(e=>e.key===current.key);
    const done = new Set(state.progress[course.id] || []);
    const percent = progressPercent(course.id);
    const completedCount=completedLessons(course.id);
    const totalVideos=entries.reduce((sum,item)=>sum+lectureList(item).length,0);
    const content=`<div class="recorded-library-toolbar premium-recorded-toolbar offline-student-toolbar">
        <a href="#/my-courses">${icon('arrowLeft')}<span>My Courses</span></a>
        <div class="recorded-toolbar-actions"><span class="recorded-toolbar-course">Physical / Offline</span><span class="recorded-learning-status ${percent>=100?'is-complete':percent>0?'is-active':'is-pending'}">${percent>=100?'Completed':percent>0?'In progress':'Not started'}</span></div>
      </div>
      <div class="recorded-course-overview compact-recorded-admin-stats offline-student-course-stats">
        <article><span>${icon('book')}</span><div><strong>${entries.length}</strong><small>Lessons</small></div></article>
        <article><span>${icon('check')}</span><div><strong>${completedCount}</strong><small>Completed</small></div></article>
        <article><span>${icon('play')}</span><div><strong>${totalVideos}</strong><small>Lecture videos</small></div></article>
        <article><span>${icon('history')}</span><div><strong>${percent}%</strong><small>Course progress</small></div></article>
      </div>
      <section class="player-shell recorded-private-course-shell recorded-instructor-private-shell offline-private-course-shell offline-dashboard-parity-shell">
        <div class="player-layout recorded-private-layout offline-private-layout offline-dashboard-parity-layout">
          <main class="lesson-stage recorded-private-stage offline-private-stage">
            <div class="offline-private-media">${lectureTabs(course,current,currentLecture)}${lectureVideoMarkup(course,current,currentLecture)}</div>
            <div class="lesson-title-row recorded-private-title-row offline-private-title-row">
              <div><span class="course-category">${escapeHtml(current.moduleTitle)}</span><h1>${escapeHtml(current.title)}</h1><p>Lesson ${index+1} of ${entries.length}${current.duration?` · ${escapeHtml(current.duration)}`:''}${lectureList(current).length?` · ${lectureList(current).length} video${lectureList(current).length===1?'':'s'}`:''}</p></div>
              <div class="lesson-nav-actions"><button class="button button-secondary button-sm" data-action="previous-lesson" data-course="${course.id}" ${index===0?'disabled':''}>${icon('arrowLeft')} Previous</button><button class="button ${done.has(current.key)?'button-secondary':'button-primary'} button-sm" data-action="mark-complete" data-course="${course.id}" data-key="${current.key}">${icon('check')} ${done.has(current.key)?'Completed':'Mark Complete'}</button><button class="button button-secondary button-sm" data-action="next-lesson" data-course="${course.id}" ${index===entries.length-1?'disabled':''}>Next ${icon('arrow')}</button></div>
            </div>
            <div class="tabs recorded-private-tabs offline-private-tabs">${[['overview','Overview'],['classroom','Classroom'],['notes','Notes'],['resources','Resources'],['discussion','Discussion']].map(t=>`<button class="tab-button ${state.lessonTab===t[0]?'active':''}" data-action="lesson-tab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
            <div id="lessonTabPanel">${playerTabContent(course,current,state.lessonTab)}</div>
          </main>
          <aside class="curriculum-sidebar recorded-course-sidebar offline-course-sidebar"><div class="curriculum-sidebar-head"><h2>Course content</h2><p class="muted">${completedCount} of ${entries.length} lessons complete</p></div>${course.modules.map((module,mi)=>`<article class="player-module ${mi===current.mi?'open':''}"><button class="player-module-head" data-action="toggle-player-module"><span><strong>${mi+1}. ${escapeHtml(module.title)}</strong><span>${module.lessons.length} lessons${module.duration?` · ${escapeHtml(module.duration)}`:''}</span></span>${icon('chevronDown')}</button><div class="player-module-lessons">${module.lessons.map((lesson,li)=>{const key=`${mi}-${li}`,videoCount=lectureList(lesson).length;return `<button class="player-lesson ${done.has(key)?'completed':''} ${current.key===key?'active':''}" data-action="select-lesson" data-course="${course.id}" data-key="${key}"><span class="player-lesson-status">${done.has(key)?icon('check'):current.key===key?icon('play'):icon(videoCount?'play':'book')}</span><span><strong>${escapeHtml(lesson.title)}</strong><span>${escapeHtml(lesson.duration||'Reading')}${videoCount?` · ${videoCount} video${videoCount===1?'':'s'}`:''}</span></span>${current.key===key?'<span class="recorded-now-playing"><i></i><i></i><i></i></span>':''}</button>`}).join('')}</div></article>`).join('')}</aside>
        </div>
      </section>`;
    dashboardShell('my-courses',content,course.title,`${current.moduleTitle} · ${current.title} · Physical / Offline`);
    initPage();
  }

  function renderHelp() {
    setChrome('public');
    const managedFaqs = D.content?.helpFaqExtras;
    const items = Array.isArray(managedFaqs) && managedFaqs.length ? managedFaqs : (D.faqs||[]);
    app.innerHTML = `${pageHero({eyebrow:'Help Centre',title:'How can we help?',text:'Find quick answers about courses, plans, enrollment and learner accounts.',center:true})}<section class="page-section"><div class="container">${faqList(items)}<div class="mission-grid" style="margin-top:60px"><div class="form-section"><span class="eyebrow">Send a Message</span><h2>Contact academy support</h2><form id="contactForm" novalidate><div class="form-grid"><div class="form-group"><label>Full name</label><input class="form-control" name="name" required value="${escapeHtml(state.user.name === 'Academy Learner' ? '' : state.user.name)}"></div><div class="form-group"><label>Email address</label><input class="form-control" name="email" type="email" required value="${escapeHtml(state.user.email)}"></div><div class="form-group"><label>Phone number</label><input class="form-control" name="phone" value="${escapeHtml(state.user.phone)}"></div><div class="form-group"><label>Subject</label><input class="form-control" name="subject" required placeholder="Course, account or enrollment support"></div><div class="form-group full"><label>Message</label><textarea class="form-control" name="message" required placeholder="Tell us how we can help"></textarea></div></div><button class="button button-primary" type="submit">Send Message</button></form></div><div class="cta-panel"><h2>Speak with the academy team</h2><p>Call or email Full Stack Academy for course guidance, branch information and enrollment assistance.</p><div class="cta-actions"><a class="button button-primary" href="#/contact">Open Contact Page</a><a class="button button-secondary" href="#/courses">Browse Courses</a></div></div></div></div></section>`;
  }
  function renderLegal(type) {
    setChrome('public');
    const isPrivacy=type==='privacy',isTerms=type==='terms';
    const title=isPrivacy?'Privacy Policy':isTerms?'Terms and Conditions':'Refund Policy';
    const intro=isPrivacy?'How Full Stack Academy handles learner, enquiry and account information.':isTerms?'Rules for using the academy website, learner accounts, courses and materials.':'How refund-review requests are submitted and assessed for academy enrollments.';
    const sections=isPrivacy?[
      ['information','Information we collect','We may collect information you submit through registration, enquiry, callback, checkout and profile forms, including your name, email, phone number, course interest and account details.'],
      ['use','How information is used','Information is used to respond to enquiries, manage learner accounts, process enrollment requests, provide course access, communicate service information and improve academy operations.'],
      ['security','Security and access','Passwords are stored as secure password hashes. Administrator access uses authenticated server sessions, and access to personal information is limited to authorised academy personnel.'],
      ['choices','Your choices','You may request correction of your account information or contact the academy regarding your personal data and communication preferences.'],
      ['contact','Contact','Privacy questions can be sent to info@fullstackacademy.in or discussed with the academy team at +91 9015 236 236.']
    ]:isTerms?[
      ['accounts','Learner accounts','You are responsible for maintaining the confidentiality of your login details and for activity performed through your account.'],
      ['enrollment','Enrollment and access','Course availability, learning mode, batch seats, fees and access periods may vary by course and must be confirmed during enrollment.'],
      ['materials','Course materials','Videos, recordings, worksheets, projects, notes and certificates may not be copied, resold or redistributed without written academy permission.'],
      ['conduct','Acceptable use','Do not misuse the website, attempt unauthorised access, disrupt services or use course materials in a way that infringes academy or third-party rights.'],
      ['contact','Contact','Questions about these terms can be directed to info@fullstackacademy.in or +91 9015 236 236.']
    ]:[
      ['eligibility','Refund review','Refund eligibility depends on the applicable enrollment terms, payment status, course access, batch commencement and any written conditions confirmed at enrollment.'],
      ['request','How to request a review','Contact the academy with your name, course, payment reference and reason for the request. The team will review the applicable enrollment record and respond.'],
      ['timing','Processing','Approved refund timing can depend on the original payment method and banking or payment-provider processing timelines.'],
      ['contact','Contact','Refund questions can be sent to info@fullstackacademy.in or discussed with the academy team at +91 9015 236 236.']
    ];
    const configured=D.content?.legalPages?.[type];
    const policySections=Array.isArray(configured?.sections) && configured.sections.length
      ? configured.sections.filter(s=>s && String(s.title||'').trim()).map((s,i)=>[
          'policy-'+i, String(s.title), String(s.body||'')
        ]) : sections;
    const policyIntro=typeof configured?.intro==='string' ? configured.intro : intro;
    const policyUpdated=typeof configured?.updated==='string' ? configured.updated : 'September 2026';
    app.innerHTML=`${pageHero({eyebrow:'Academy Policy',title,text:escapeHtml(policyIntro),center:true})}<section class="page-section section-surface"><div class="container legal-premium-shell"><aside class="legal-premium-nav"><span>On this page</span>${policySections.map(([id,h])=>`<a href="#${id}"><i class="premium-link-icon">${icon(id==='security'?'shield':id==='contact'?'mail':'file')}</i>${escapeHtml(h)}</a>`).join('')}</aside><article class="legal-premium-content"><div class="legal-updated">${icon('calendar')} Last updated: ${escapeHtml(policyUpdated)}</div>${policySections.map(([id,h,body])=>`<section id="${id}"><h2>${escapeHtml(h)}</h2><p>${escapeHtml(body)}</p></section>`).join('')}</article></div></section>`;
  }

  function renderNotFound() {
    setChrome('public');
    app.innerHTML = `<section class="page-section section-surface" style="min-height:70vh;display:grid;align-items:center"><div class="container"><div class="empty-state"><span class="empty-icon">404</span><h3>Page not found</h3><p>The page may have moved or the address may be incomplete.</p><a class="button button-primary" href="#/">Return Home</a></div></div></section>`;
  }

  function updateCartDrawer() {
    const t = cartTotals();
    const items = document.getElementById('cartDrawerItems');
    const drawerFooter = document.getElementById('cartDrawerFooter');
    if (!items || !drawerFooter) return;
    if (!t.courseItems.length) {
      items.innerHTML = `<div class="empty-state"><span class="empty-icon">${icon('cart')}</span><h3>Your cart is empty</h3><p>Add a course to preview the checkout experience.</p></div>`;
      drawerFooter.innerHTML = `<a class="button button-primary button-block" href="#/courses">Explore Courses</a>`;
      return;
    }
    items.innerHTML = `${t.courseItems.map(c=>`<article class="cart-mini-item"><span class="cart-mini-thumb">${imageMarkup(c.image,c.title,initials(c.title))}</span><span><strong>${c.title}</strong><span>${purchaseModeLabel(c.cartMode)} · ${money(c.price)}</span></span><button data-action="remove-cart" data-id="${c.id}" aria-label="Remove ${c.title}">${icon('trash')}</button></article>`).join('')}`;
    drawerFooter.innerHTML = `<div class="cart-drawer-total"><span>Total</span><strong>${money(t.total)}</strong></div><a class="button button-primary button-block" href="#/cart">Review Cart</a><a class="button button-secondary button-block" href="#/checkout">Checkout</a>`;
  }

  function addToCart(id, silent = false, requestedMode = '') {
    id = Number(id);
    const course=courseById(id);
    if(!course){toast('Course unavailable.','error');return false;}
    const mode=normalizePurchaseMode(requestedMode) || defaultCoursePurchaseMode(course);
    const access=purchaseState(id,mode);
    if(access.kind!=='available'){
      if(!silent)toast(access.kind==='pending'?'An enrollment request for this course is already pending.':'This course format is already on your account.');
      return false;
    }
    state.cartModes = state.cartModes && typeof state.cartModes==='object' ? state.cartModes : {};
    const previous=normalizePurchaseMode(state.cartModes[id]);
    state.cartModes[id]=mode;
    write(LS.cartModes,state.cartModes);
    if (!state.cart.includes(id)) {
      state.cart.push(id); write(LS.cart,state.cart);
      if (!silent) toast(`${purchaseModeLabel(mode)} course added to your cart.`);
    } else if (!silent) {
      toast(previous && previous!==mode ? `Course updated to ${purchaseModeLabel(mode)}.` : 'This course is already in your cart.');
    }
    updateHeader(); updateCartDrawer();
    return true;
  }

  function removeFromCart(id) {
    id=Number(id);
    state.cart = state.cart.filter(x=>x!==id); write(LS.cart,state.cart);
    if(state.cartModes && typeof state.cartModes==='object'){ delete state.cartModes[id]; write(LS.cartModes,state.cartModes); }
    updateHeader(); updateCartDrawer();
    if (state.currentPath === '/cart') renderCart();
    toast('Course removed from cart.');
  }

  async function toggleWishlist(id) {
    id = Number(id);
    if (state.loggedIn) {
      try {
        const result = await apiRequest('wishlist_toggle', { method:'POST', body:{ course_id:id } });
        if (result.saved && !state.wishlist.includes(id)) state.wishlist.push(id);
        if (!result.saved) state.wishlist = state.wishlist.filter(x=>x!==id);
        toast(result.message);
      } catch (error) { toast(error.message, 'error'); return; }
    } else {
      if (state.wishlist.includes(id)) { state.wishlist = state.wishlist.filter(x=>x!==id); toast('Removed from wishlist.'); }
      else { state.wishlist.push(id); toast('Saved locally. Sign in to keep it in your account.'); }
    }
    write(LS.wishlist,state.wishlist);
    if (state.currentPath.startsWith('/course/')) renderCourseDetail(state.currentPath.split('/')[2],new URLSearchParams((location.hash.split('?')[1]||'')).get('mode')||state.detailDeliveryMode);
    else if (state.currentPath === '/wishlist') renderWishlist();
    else if (state.currentPath === '/courses') updateCoursesResults();
    else if (state.currentPath === '/dashboard') renderDashboard();
    else if (state.currentPath === '/instructor-dashboard') renderInstructorDashboard();
    else if (state.currentPath === '/instructor-students') renderInstructorStudents();
    else if (state.currentPath === '/instructor-requests') renderInstructorRequests();
    else if (state.currentPath === '/my-courses') renderMyCourses();
    else if (state.currentPath === '/') renderHome();
    else router();
    initPage();
  }


  function updateGlobalSearch(value = '') {
    const target = document.getElementById('globalSearchResults');
    if (!target) return;
    const q = value.trim().toLowerCase();
    const searchable = catalogCourses();
    const list = q ? searchable.filter(c=>`${c.title} ${c.category} ${(c.skills||[]).join(' ')}`.toLowerCase().includes(q)).slice(0,6) : searchable.filter(c=>c.featured).slice(0,4);
    target.innerHTML = list.map(c=>`<a class="search-result-item" href="#/course/${c.slug}"><span class="search-result-thumb">${imageMarkup(c.image,c.title,initials(c.title))}</span><span><strong>${c.title}</strong><span>${c.category} · ${c.duration} · ${money(c.price)}</span></span>${icon('arrow')}</a>`).join('') || `<div class="empty-state" style="padding:28px"><p>No matching courses found.</p></div>`;
  }

  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(input => {
      if(input.disabled)return;
      const okay = input.type === 'checkbox' ? input.checked : input.value.trim() !== '' && input.checkValidity();
      input.classList.toggle('invalid',!okay);
      valid = valid && okay;
    });
    if (!valid) toast('Please complete the highlighted required fields.','error');
    return valid;
  }

  async function completeCheckout(form) {
    if (!state.loggedIn) { sessionStorage.setItem('fsa_after_auth_path','/checkout');toast('Please sign in before placing an order.','error'); routeTo('/login'); return; }
    try {
      const studentSession=await apiRequest('auth_me',{query:{account_type:'student'}});
      if(!studentSession.authenticated || studentSession.user?.role!=='student'){
        toast('Please sign in with your Student Profile before placing a course order.','error');
        routeTo('/login'); return;
      }
      state.user={...state.user,...studentSession.user};
    } catch(error){ toast(error.message||'Please sign in with your Student Profile.','error'); routeTo('/login'); return; }
    const editing=!!form.querySelector('#checkoutBillingEditor:not([hidden])');
    if(!validateForm(form))return;
    prunePurchasedCart(true);
    const t = cartTotals();
    if(!t.courseItems.length){routeTo('/my-courses');return;}
    const fd = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton?.innerHTML;
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Placing Order…'; }
    try {
      const result = await apiRequest('checkout_create', { method:'POST', body:{
        course_ids: t.courseItems.map(course => course.id),
        course_items: t.courseItems.map(course => ({course_id:Number(course.id),delivery_mode:course.cartMode||defaultCoursePurchaseMode(course)})),
        plan_id: '', billing: '', coupon: state.coupon || '',
        reuse_billing:form.dataset.returning==='yes'&&!editing&&!!state.checkoutProfile?.email,
        name: editing||form.dataset.returning!=='yes'?fd.get('name'):state.user.name, email:editing||form.dataset.returning!=='yes'?fd.get('email'):state.user.email, phone:editing||form.dataset.returning!=='yes'?fd.get('phone'):state.user.phone,
        country:editing||form.dataset.returning!=='yes'?fd.get('country'):null, state:editing||form.dataset.returning!=='yes'?fd.get('state'):null, address:editing||form.dataset.returning!=='yes'?fd.get('address'):null, city:editing||form.dataset.returning!=='yes'?fd.get('city'):null, postal:editing||form.dataset.returning!=='yes'?fd.get('postal'):null,
        payment_method: fd.get('payment'), message: fd.get('message') || ''
      }});
      // Student identity remains server-owned; checkout does not change the login email.
      write(LS.lastOrder,result.order);
      state.cart = []; state.cartModes = {}; state.coupon = null;
      write(LS.cart,[]); write(LS.cartModes,{});
      await syncStudentData();
      updateHeader(); updateCartDrawer();
      toast(result.message);
      routeTo('/checkout-success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      if (submitButton && document.body.contains(submitButton)) { submitButton.disabled = false; submitButton.innerHTML = originalText; }
    }
  }
  async function handleFormSubmit(event) {
    const form = event.target;
    if (!form || form.tagName !== 'FORM') return;
    const formId = form.getAttribute('id') || '';
    event.preventDefault();
    if(form.matches('.physical-activity-form')){await physicalSubmitActivity(form);return;}
    if (formId === 'checkoutForm') return completeCheckout(form);
    if (formId === 'loginForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      try {
        const result = await apiRequest('auth_login', { method:'POST', body:{ identifier:fd.get('identifier'), account_type:fd.get('account_type'), password:fd.get('password'), remember:fd.get('remember')==='on' } });
        if (result.user.role === 'admin') { toast('Opening the administrator dashboard.'); setTimeout(()=>{ window.location.href=ADMIN_URL; },250); return; }
        state.user = { ...state.user, ...result.user, joined: new Date(result.user.created_at || Date.now()).toLocaleDateString(siteSettings.locale || 'en-IN',{month:'long',year:'numeric'}) };
        state.loggedIn = true;
        if(result.user.role==='instructor') await syncInstructorData(); else await syncStudentData();
        toast('Signed in successfully.');
        if(result.user.role==='instructor') routeTo('/instructor-dashboard');
        else {
          const afterAuth=sessionStorage.getItem('fsa_after_auth_path'); sessionStorage.removeItem('fsa_after_auth_path');
          const resumePath=recordedStudentResumePath();
          routeTo(afterAuth&&state.cart.length?afterAuth:(resumePath||'/dashboard'));
        }
      } catch (error) { toast(error.message,'error'); }
      return;
    }
    if (formId === 'registerForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      if (fd.get('password') !== fd.get('confirm')) { toast('Passwords do not match.','error'); return; }
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || 'Create Learner Account';
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Creating Account…'; }
      try {
        const accountType='student';
        const result = await apiRequest('auth_register', { method:'POST', body:{ account_type:accountType,name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone'),password:fd.get('password'),headline:fd.get('headline'),branch:fd.get('branch'),bio:fd.get('bio'),skills:String(fd.get('skills')||'').split(',').map(x=>x.trim()).filter(Boolean) } });
        if(accountType==='instructor'){
          state.loggedIn=false;toast(result.message);routeTo('/login');return;
        }
        state.user = { ...state.user, ...result.user, joined: new Date(result.user.created_at || Date.now()).toLocaleDateString(siteSettings.locale || 'en-IN',{month:'long',year:'numeric'}) };
        state.loggedIn = true;

        try {
          await syncStudentData();
        } catch (syncError) {
          console.error('Learner data synchronization failed after registration:', syncError);
          state.enrollments = [];
          state.pendingEnrollments = [];
          state.progress = {};
          state.orders = [];
        }
        toast(result.message);
        const afterAuth=sessionStorage.getItem('fsa_after_auth_path'); sessionStorage.removeItem('fsa_after_auth_path');
        routeTo(afterAuth&&state.cart.length?afterAuth:'/profile');
      } catch (error) {
        toast(error.message,'error');
      } finally {
        if (submitButton && document.body.contains(submitButton)) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
      return;
    }
    if (formId === 'forgotPasswordForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      try { const result = await apiRequest('auth_forgot_password',{method:'POST',body:{email:fd.get('email')}}); toast(result.message); form.reset(); }
      catch (error) { toast(error.message,'error'); }
      return;
    }
    if (formId === 'resetPasswordForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      if (fd.get('password') !== fd.get('confirm')) { toast('Passwords do not match.','error'); return; }
      try { const result = await apiRequest('auth_reset_password',{method:'POST',body:{email:fd.get('email'),token:fd.get('token'),password:fd.get('password')}}); toast(result.message); routeTo('/login'); }
      catch (error) { toast(error.message,'error'); }
      return;
    }
    if (formId === 'contactForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      try {
        const result = await apiRequest('contact_submit',{method:'POST',body:{name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone'),subject:fd.get('subject'),message:fd.get('message')}});
        toast(result.message); form.reset();
      } catch (error) { toast(error.message,'error'); }
      return;
    }
    if(formId==='emailOtpRequestForm'){
      if(!validateForm(form))return;
      const fd=new FormData(form);
      try{ const result=await apiRequest('profile_email_request',{method:'POST',body:{email:fd.get('newEmail')}});toast(result.message); }
      catch(error){toast(error.message,'error');}
      return;
    }
    if(formId==='emailOtpConfirmForm'){
      if(!validateForm(form))return;
      const fd=new FormData(form);
      try{const result=await apiRequest('profile_email_confirm',{method:'POST',body:{code:fd.get('code')}});state.user={...state.user,...result.user};toast(result.message);renderProfile();initPage();}
      catch(error){toast(error.message,'error');}
      return;
    }
    if (formId === 'profileForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      try {
        const result = await apiRequest('profile_update',{method:'POST',body:{name:fd.get('name'),phone:fd.get('phone'),headline:fd.get('headline'),bio:fd.get('bio'),city:fd.get('city'),country:fd.get('country'),branch:fd.get('branch'),skills:String(fd.get('skills')||'').split(',').map(x=>x.trim()).filter(Boolean),profile_public:state.user.role==='student'?state.user.profile_public:fd.get('profile_public')==='on'}});
        ['name','email','phone','headline','city','country','bio'].forEach(k=>state.user[k]=fd.get(k));
        if(state.user.role==='student'){
          const personal={fatherName:fd.get('fatherName'),dob:fd.get('dob'),cnic:fd.get('cnic')};
          for(const key of ['alumniRole','alumniCompany','alumniSalary','alumniLocation','alumniGraduationYear','alumniQuote','jobExperience','jobLocation','jobAvailability','jobSummary'])if(fd.has(key))personal[key]=fd.get(key);
          if(fd.has('jobSkills'))personal.jobSkills=String(fd.get('jobSkills')||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
          await apiRequest('student_profile_details_save',{method:'POST',body:personal});
          const extra=await apiRequest('student_profile_details');state.studentAdminProfile=extra.profile||{};
        }
        state.user = { ...state.user, ...result.user }; toast(result.message); renderProfile(); initPage();
      } catch (error) { toast(error.message,'error'); }
      return;
    }
    if(formId==='studentCertificateForm'){
      if(!validateForm(form))return;const fd=new FormData(form);
      try{const result=await apiRequest('student_certificate_submit',{method:'POST',body:Object.fromEntries(fd.entries())});toast(result.message);await syncStudentData();renderCertificates();initPage();}catch(error){toast(error.message,'error');}
      return;
    }
    if(formId==='instructorStudentForm'){
      if(!validateForm(form))return;const fd=new FormData(form);const body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.skills=String(body.skills||'').split(',').map(x=>x.trim()).filter(Boolean);body.profile_public=fd.get('profile_public')==='on';body.course_ids=fd.getAll('course_ids').map(Number).filter(Boolean);
      try{const result=await apiRequest('instructor_student_save',{method:'POST',body});toast(result.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorStudents();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorCertificateForm'){
      if(!validateForm(form))return;const fd=new FormData(form);const body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.student_id=Number(body.student_id||0);
      try{const result=await apiRequest('instructor_certificate_save',{method:'POST',body});toast(result.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorCertificates();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorProfileRequestForm'){
      if(!validateForm(form))return;const fd=new FormData(form);const body=Object.fromEntries(fd.entries());body.student_id=Number(body.student_id);body.skills=String(body.skills||'').split(',').map(x=>x.trim()).filter(Boolean);
      try{const result=await apiRequest('instructor_profile_request',{method:'POST',body});toast(result.message);document.getElementById('instructorActionModal')?.remove();await syncInstructorData();renderInstructorRequests();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorCertificateRequestForm'){
      if(!validateForm(form))return;const fd=new FormData(form);const body=Object.fromEntries(fd.entries());body.student_id=Number(body.student_id);
      try{const result=await apiRequest('instructor_certificate_request',{method:'POST',body});toast(result.message);document.getElementById('instructorActionModal')?.remove();await syncInstructorData();renderInstructorRequests();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorOfflineCourseForm'){
      const submit=form.querySelector('button[type="submit"]');const original=submit?.textContent||'Save & Submit Offline Content';if(submit){submit.disabled=true;submit.textContent='Saving…';}
      try{const payload=instructorOfflineCollect(form);const r=await apiRequest('instructor_offline_course_save',{method:'POST',body:payload});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await Promise.all([syncInstructorData(),refreshCatalogData()]);renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');if(submit){submit.disabled=false;submit.textContent=original;}}return;
    }
    if(formId==='instructorCourseForm'){
      if(!validateForm(form))return;const fd=new FormData(form),body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.price=Number(body.price||0);body.originalPrice=Number(body.originalPrice||0);body.hours=Number(body.hours||0);
      try{const r=await apiRequest('instructor_course_save',{method:'POST',body});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await Promise.all([syncInstructorData(),refreshCatalogData()]);renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorContentForm'){
      const courseId=Number(new FormData(form).get('course_id')||0),modules=collectInstructorModules(form);
      try{const r=await apiRequest('instructor_course_content_save',{method:'POST',body:{course_id:courseId,modules}});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorLiveForm'){
      if(!validateForm(form))return;
      const fd=new FormData(form),body=Object.fromEntries(fd.entries());
      body.id=Number(body.id||0);
      body.course_id=Number(body.course_id||0);
      body.starts_at=sqlDateTime(body.starts_at);
      body.ends_at=sqlDateTime(body.ends_at);
      body.repeat_weekdays=fd.getAll('repeat_weekdays').map(Number).filter(x=>x>=1&&x<=7);
      if(body.schedule_mode==='recurring'&&!body.repeat_until){toast('Choose the Repeat until date for the monthly schedule.','error');return;}
      try{
        const r=await apiRequest('instructor_live_save',{method:'POST',body});
        toast(r.message);
        document.getElementById('instructorClassroomModal')?.remove();
        await syncInstructorData();
        renderInstructorLive();
        initPage();
      }catch(error){toast(error.message,'error');}
      return;
    }
    if(formId==='instructorLiveFinalizeForm'){
      if(!validateForm(form))return;
      const fd=new FormData(form);
      const body={
        id:Number(fd.get('id')||0),
        title:String(fd.get('title')||'').trim(),
        description:String(fd.get('description')||'').trim(),
        recording_url:String(fd.get('recording_url')||'').trim()
      };
      if(body.recording_url && !/^https?:\/\//i.test(body.recording_url)){toast('Enter a valid http/https recording URL or leave it blank for Zoom sync.','error');return;}
      try{
        const r=await apiRequest('instructor_live_end',{method:'POST',body});
        toast(r.message||'Live class ended and recording saved.');
        document.getElementById('instructorClassroomModal')?.remove();
        state.selectedInstructorLiveId=null;
        await syncInstructorData();
        renderInstructorLive();
        initPage();
        initLiveCountdowns();
        if(!body.recording_url){
          setTimeout(async()=>{
            try{
              await apiRequest('instructor_recording_sync',{method:'POST',body:{live_session_id:body.id}});
              await syncInstructorData();
              if(state.currentPath==='/instructor-live')renderInstructorLive();
              if(state.currentPath==='/instructor-recordings')renderInstructorRecordings();
              initPage();initLiveCountdowns();
            }catch(_){}
          },45000);
        }
      }catch(error){toast(error.message,'error');}
      return;
    }
    if(formId==='instructorRecordingForm'){
      if(!validateForm(form))return;
      const fd=new FormData(form),body=Object.fromEntries(fd.entries());
      body.id=Number(body.id||0);body.course_id=Number(body.course_id||0);body.recorded_at=sqlDateTime(body.recorded_at);
      try{const r=await apiRequest('instructor_recording_save',{method:'POST',body});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorRecordings();initPage();}catch(error){toast(error.message,'error');}
      return;
    }
    if(formId==='instructorQuizForm'){
      if(!validateForm(form))return;const fd=new FormData(form),questions=collectQuizQuestions(form);if(!questions.length){toast('Add at least one valid quiz question.','error');return;}const body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.course_id=Number(body.course_id||0);body.attempts_allowed=Number(body.attempts_allowed||1);body.due_at=sqlDateTime(body.due_at);body.questions=questions;
      try{const r=await apiRequest('instructor_quiz_save',{method:'POST',body});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorCourseManager(body.course_id);initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorAssignmentForm'){
      if(!validateForm(form))return;const fd=new FormData(form);fd.set('due_at',sqlDateTime(fd.get('due_at')));
      try{const r=await apiRequest('instructor_assignment_save',{method:'POST',body:fd});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorCourseManager(Number(fd.get('course_id')));initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorGradeForm'){
      if(!validateForm(form))return;const fd=new FormData(form);try{const r=await apiRequest('instructor_submission_grade',{method:'POST',body:{id:Number(fd.get('id')),grade:Number(fd.get('grade')),feedback:fd.get('feedback')}});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();const cid=Number(target.dataset.course||0);if(cid)renderInstructorCourseManager(cid);else renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='studentQuizForm'){
      const quizId=Number(new FormData(form).get('quiz_id')),course=currentSecureCourse(),quiz=(course?.classroom?.quizzes||[]).find(q=>Number(q.id)===quizId)||courseworkItemById('quiz',quizId);if(!quiz)return;
      const answers={};let missing=false;(quiz.questions||[]).forEach(q=>{const checked=form.querySelector(`[name="q_${CSS.escape(String(q.id))}"]:checked`);if(!checked)missing=true;else answers[q.id]=Number(checked.value);});
      if(missing){const firstMissing=(quiz.questions||[]).findIndex(q=>!form.querySelector(`[name="q_${CSS.escape(String(q.id))}"]:checked`));setStudentQuizStep(form,Math.max(0,firstMissing));toast('Answer every quiz question before submitting.','error');return;}
      const submit=form.querySelector('[data-role="quiz-submit"]');if(submit){submit.disabled=true;submit.textContent='Calculating score…';}
      try{
        const r=await apiRequest('student_quiz_submit',{method:'POST',body:{quiz_id:Number(quiz.id),answers}});
        const percent=Number(r.percent||0),passed=percent>=50,results=Array.isArray(r.results)?r.results:[];
        const recordedCourseId=Number(form.dataset.recordedCourse||0),slug=course?.slug||'';
        await syncStudentData();if(slug)delete state.playerCourses[slug];if(recordedCourseId){const current=(state.studentRecordedLectures||[]).find(x=>Number(x.course_id)===recordedCourseId);renderRecordedLecturePlayer(recordedCourseId,Number(current?.id||0));initPage();}else{state.lessonTab='classroom';await renderPlayer(slug);}
        openStudentClassroomModal(`${quiz.title} — Result`,`<div class="quiz-result-screen"><div class="quiz-result-icon ${passed?'pass':''}">${icon(passed?'check':'note')}</div><span class="eyebrow">Quiz completed</span><h2>${passed?'Assessment submitted':'Score recorded'}</h2><div class="quiz-result-score"><strong>${percent}%</strong><span>${r.score}/${r.max_score} points</span></div><p>Your answers were scored automatically. ${passed?'You can review each answer below.':'Review the correct answers below before your next attempt.'}</p>${results.length?`<div class="quiz-result-breakdown">${results.map((item,index)=>`<article class="${item.is_correct?'correct':'wrong'}"><span>${item.is_correct?'✓':'×'}</span><div><strong>${index+1}. ${escapeHtml(item.question)}</strong><small>Your answer: ${escapeHtml(item.given_text||'No answer')} · Correct: ${escapeHtml(item.correct_text||'')}</small></div><b>${Number(item.earned||0)}/${Number(item.points||0)}</b></article>`).join('')}</div>`:''}<div class="row-actions" style="justify-content:center"><button class="button button-primary" type="button" data-action="close-student-classroom-modal">Back to Classroom</button></div></div>`);
        toast(`Quiz submitted: ${r.score}/${r.max_score} (${percent}%).`);
      }catch(error){if(submit){submit.disabled=false;submit.textContent='Submit Quiz';}toast(error.message,'error');}return;
    }
    if(formId==='recordedDiscussionForm'){
      const fd=new FormData(form);const send=form.querySelector('.recorded-discussion-send');if(send){send.disabled=true;send.classList.add('is-sending');}
      try{const r=await apiRequest('recorded_course_discussion_send',{method:'POST',body:fd});form.querySelector('textarea[name="message"]').value='';const file=form.querySelector('input[name="attachment"]');if(file)file.value='';const fileName=form.querySelector('[data-role="discussion-file-name"]');if(fileName)fileName.textContent='';form.querySelector('[name="reply_to_id"]').value='0';form.querySelector('[name="attach_timestamp"]').value='0';form.querySelector('[name="video_seconds"]').value='0';form.querySelector('[data-role="discussion-reply-preview"]')?.setAttribute('hidden','');form.querySelector('[data-role="discussion-time-context"]')?.setAttribute('hidden','');form.classList.remove('has-time');toast(r.message);await refreshRecordedDiscussion(Number(fd.get('course_id')),{stickToBottom:true});}catch(error){toast(error.message,'error');}finally{if(send){send.disabled=false;send.classList.remove('is-sending');}}return;
    }
    if(formId==='studentAssignmentForm'){
      const fd=new FormData(form),recordedCourseId=Number(form.dataset.recordedCourse||0);try{const r=await apiRequest('student_assignment_submit',{method:'POST',body:fd});toast(r.message);closeStudentClassroomModal();await syncStudentData();if(recordedCourseId){const current=(state.studentRecordedLectures||[]).find(x=>Number(x.course_id)===recordedCourseId);renderRecordedLecturePlayer(recordedCourseId,Number(current?.id||0));initPage();}else await refreshSecureClassroom();}catch(error){toast(error.message,'error');}return;
    }
    if (formId === 'learningPreferencesForm') {
      const fd = new FormData(form); state.user.weeklyGoal = Math.max(1,Math.min(40,Number(fd.get('weeklyGoal')||5))); state.user.notifications = fd.get('notifications') === 'on';
      try { const result = await apiRequest('profile_preferences',{method:'POST',body:{weekly_goal:state.user.weeklyGoal,notifications:state.user.notifications}}); toast(result.message); } catch (error) { toast(error.message,'error'); } return;
    }
    if (formId === 'securityForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      if (fd.get('newPassword') !== fd.get('confirmPassword')) { toast('New passwords do not match.','error'); return; }
      try { const result = await apiRequest('profile_password',{method:'POST',body:{current_password:fd.get('currentPassword'),new_password:fd.get('newPassword')}}); toast(result.message); form.reset(); }
      catch (error) { toast(error.message,'error'); }
    }
  }
  async function handleChange(event) {
    const input = event.target;
    if(input.matches('.recorded-discussion-attach input[type="file"]')){
      const form=input.closest('#recordedDiscussionForm'),name=form?.querySelector('[data-role="discussion-file-name"]');if(name)name.textContent=input.files?.[0]?.name||'';
    }
    if(input.matches('[data-resource-file]')){
      const label=input.closest('.recorded-resource-upload'),name=label?.querySelector('[data-role="recorded-resource-file-name"]'),file=input.files?.[0];
      if(name)name.textContent=file?file.name:'PDF, Office, ZIP, project/source files, images, audio/video and other safe files';
      label?.classList.toggle('has-file',!!file);
    }
    if(input.matches('.classroom-upload input[type="file"]')){
      const label=input.closest('.classroom-upload');
      const name=label?.querySelector('[data-role="classroom-file-name"]');
      if(name)name.textContent=input.files?.[0]?.name||'No file selected';
      label?.classList.toggle('has-file',!!input.files?.[0]);
    }
    if(input.matches('[data-io-module-block-upload]')&&input.files?.[0]){
      const file=input.files[0];const fd=new FormData();fd.append('file',file);input.disabled=true;
      try{const r=await apiRequest('instructor_classroom_upload',{method:'POST',body:fd});const urlInput=input.closest('.io-content-block')?.querySelector('[data-field="io-module-block-url"]');if(urlInput)urlInput.value=r.url;toast('Content file uploaded.');}catch(error){toast(error.message,'error');}finally{input.disabled=false;input.value='';}
      return;
    }
    if(input.matches('[data-offline-image-upload]')&&input.files?.[0]){
      const file=input.files[0];if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){toast('Choose a JPG, PNG or WebP image.','error');input.value='';return;}const fd=new FormData();fd.append('file',file);input.disabled=true;
      try{const r=await apiRequest('instructor_classroom_upload',{method:'POST',body:fd});const urlInput=input.closest('.offline-image-field')?.querySelector('input.form-control');if(urlInput)urlInput.value=r.url;toast('Image uploaded.');}catch(error){toast(error.message,'error');}finally{input.disabled=false;input.value='';}
      return;
    }
    if(input.matches('#registerForm [name="account_type"]')){
      const instructor=input.value==='instructor';
      const button=document.getElementById('registerSubmitButton');if(button)button.textContent=instructor?'Submit Instructor Profile':'Create Student Account';
    }
    if(input.matches('[data-role="live-course-filter"]')){
      if(!state.liveCourseFilters)state.liveCourseFilters={student:'all',instructor:'all',recordings:'all'};
      const mode=input.dataset.mode||'student';
      state.liveCourseFilters[mode]=input.value||'all';
      if(mode==='student'){state.selectedStudentRecordingId=null;state.selectedStudentLiveId=null;renderStudentLiveClasses();}
      else if(mode==='instructor'){state.selectedInstructorRecordingId=null;state.selectedInstructorLiveId=null;renderInstructorLive();}
      else if(mode==='recordings')renderInstructorRecordings();
      initPage();initLiveCountdowns();
      return;
    }
    if(input.matches('[data-role="classroom-course-select"]')){
      const form=input.closest('form'),lesson=form?.querySelector('[data-role="classroom-lesson-select"]');if(lesson)lesson.innerHTML=instructorLessonOptions(input.value,'');
    }
    if(input.matches('[data-field="ic-pdf-file"]')&&input.files?.[0]){
      const file=input.files[0];if(file.type!=='application/pdf'){toast('Choose a PDF file.','error');input.value='';return;}const fd=new FormData();fd.append('file',file);input.disabled=true;
      try{const r=await apiRequest('instructor_classroom_upload',{method:'POST',body:fd});const urlInput=input.closest('.ic-lesson')?.querySelector('[data-field="ic-lesson-pdf"]');if(urlInput)urlInput.value=r.url;toast('PDF uploaded and attached to this lesson.');}catch(error){toast(error.message,'error');}finally{input.disabled=false;input.value='';}
    }
    if (input.matches('[name="course-category"]')) {
      state.courseFilters.categories = [...document.querySelectorAll('[name="course-category"]:checked')].map(x=>x.value); updateCoursesResults();
    }
    if (input.matches('[name="course-level"]')) {
      state.courseFilters.levels = [...document.querySelectorAll('[name="course-level"]:checked')].map(x=>x.value); updateCoursesResults();
    }
    if (input.matches('[name="course-price"]')) {
      state.courseFilters.price = [...document.querySelectorAll('[name="course-price"]:checked')].map(x=>x.value); updateCoursesResults();
    }
    if (input.matches('[name="course-rating"]')) { state.courseFilters.rating = Number(input.value); updateCoursesResults(); }
    if (input.id === 'courseSort') { state.courseFilters.sort = input.value; updateCoursesResults(); }
    if (input.id === 'batchBranchSelect') { state.batchBranch = input.value || 'all'; updateBatchResults(); }
    if (input.id === 'batchModeSelect') { state.batchMode = input.value || 'all'; updateBatchResults(); }
    if (input.matches('[data-batch-filter-select]')) {
      const type=input.dataset.batchFilterSelect;
      if(type==='shift')state.batchShift=input.value||'all';
      if(type==='mode')state.batchMode=input.value||'all';
      if(type==='branch')state.batchBranch=input.value||'all';
      const course=state.currentPath.startsWith('/course/')?courseBySlug(state.currentPath.split('/')[2]):null;
      updateBatchResults(course);
    }
    if (input.id === 'eventCategoryFilter') updateEventArchiveQuery({category:input.value,month:''});
    if (input.id === 'eventLocationFilter') updateEventArchiveQuery({location:input.value,month:''});
    if (input.id === 'eventYearFilter') updateEventArchiveQuery({year:input.value,month:''});
    if (input.id === 'avatarInput' && input.files?.[0]) {
      const file = input.files[0];
      if (file.size > 1048576) { toast('Please choose an image smaller than 1 MB.','error'); return; }
      const formData = new FormData(); formData.append('avatar', file);
      try {
        const result = await apiRequest('profile_avatar',{method:'POST',body:formData});
        state.user = { ...state.user, ...result.user };
        toast(result.message); renderProfile(); initPage();
      } catch (error) { toast(error.message,'error'); }
    }
  }

  let searchTimer;
  function handleInput(event) {
    if (event.target.id === 'courseSearchInput') {
      clearTimeout(searchTimer); searchTimer = setTimeout(()=>{ state.courseFilters.query = event.target.value; updateCoursesResults(); },170);
    }
    if (event.target.id === 'globalSearchInput') updateGlobalSearch(event.target.value);
    if (event.target.id === 'eventSearchInput') {
      clearTimeout(searchTimer); searchTimer = setTimeout(()=>updateEventArchiveQuery({q:event.target.value,month:''}),220);
    }
  }

  function instructorStudentCourseChecklist(student=null){
    const selected=new Set((student?.course_ids||[]).map(Number));
    if(!instructorCourses().length)return '<p class="muted">Create an instructor course first if you want to enroll this student now.</p>';
    return `<div class="student-course-picker">${instructorCourses().map(c=>`<label class="student-course-option"><input type="checkbox" name="course_ids" value="${c.id}" ${selected.has(Number(c.id))?'checked':''}><span><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.visibility||'public')} · ${escapeHtml(c.status||'draft')}</small></span></label>`).join('')}</div><small>Selected courses are activated for the student. Existing course history is never deleted here.</small>`;
  }

  function openInstructorStudentForm(student=null){
    openClassroomModal(student?'Edit student profile':'Create student profile',student?`Academy ID: ${student.student_code||'Assigned automatically'}`:'The Academy ID is generated automatically in yearly sequence, e.g. FSA-026-0001.',`<form id="instructorStudentForm" class="auth-form"><input type="hidden" name="id" value="${student?.id||''}"><div class="form-grid"><div class="form-group"><label>Full name</label><input class="form-control" name="name" required value="${escapeHtml(student?.name||'')}"></div><div class="form-group"><label>Email</label><input class="form-control" type="email" name="email" required value="${escapeHtml(student?.email||'')}"></div><div class="form-group"><label>Phone</label><input class="form-control" name="phone" value="${escapeHtml(student?.phone||'')}"></div><div class="form-group"><label>${student?'New password (optional)':'Temporary password'}</label><input class="form-control" type="password" name="password" minlength="8" ${student?'':'required'} autocomplete="new-password"></div><div class="form-group full"><label>Headline</label><input class="form-control" name="headline" value="${escapeHtml(student?.headline||'Full Stack Academy Learner')}"></div><div class="form-group"><label>Branch</label><input class="form-control" name="branch" value="${escapeHtml(student?.branch||state.user.branch||'')}"></div><div class="form-group"><label>City</label><input class="form-control" name="city" value="${escapeHtml(student?.city||'')}"></div><div class="form-group"><label>Country</label><input class="form-control" name="country" value="${escapeHtml(student?.country||'India')}"></div><div class="form-group full"><label>Skills <small>Comma separated</small></label><input class="form-control" name="skills" value="${escapeHtml((student?.skills||[]).join(', '))}"></div><div class="form-group full"><label>Bio</label><textarea class="form-control" rows="4" name="bio">${escapeHtml(student?.bio||'')}</textarea></div><div class="form-group full"><label class="checkbox-line" style="justify-content:flex-start"><input type="checkbox" name="profile_public" ${student?.profile_public===false?'':'checked'}> Publish student academy profile</label></div><div class="form-group full"><label>Course enrollment</label>${instructorStudentCourseChecklist(student)}</div></div><button class="button button-primary button-block" type="submit">${student?'Save Student Profile':'Create Student & Generate ID'}</button></form>`);
  }

  function openInstructorCertificateForm(cert=null,studentId=''){
    const students=state.instructorData.students||[];const selected=Number(cert?.user_id||studentId||students[0]?.id||0);
    openClassroomModal(cert?'Edit certificate':'Issue certificate','Certificates created here are published directly to the assigned student profile.',`<form id="instructorCertificateForm" class="auth-form"><input type="hidden" name="id" value="${cert?.id||''}"><div class="form-grid"><div class="form-group full"><label>Student</label><select class="form-control" name="student_id" required>${students.map(s=>`<option value="${s.id}" ${Number(s.id)===selected?'selected':''}>${escapeHtml(s.name)} · ${escapeHtml(s.student_code||'No ID')}</option>`).join('')}</select></div><div class="form-group full"><label>Certificate title</label><input class="form-control" name="title" required value="${escapeHtml(cert?.title||'')}"></div><div class="form-group"><label>Issuer</label><input class="form-control" name="issuer" value="${escapeHtml(cert?.issuer||'Full Stack Academy')}" required></div><div class="form-group"><label>Credential ID</label><input class="form-control" name="credential_id" value="${escapeHtml(cert?.credential_id||'')}" placeholder="Auto-generated if blank"></div><div class="form-group"><label>Issued on</label><input class="form-control" name="issued_on" type="date" value="${escapeHtml(cert?.issued_on||'')}"></div><div class="form-group"><label>Expires on (optional)</label><input class="form-control" name="expires_on" type="date" value="${escapeHtml(cert?.expires_on||'')}"></div><div class="form-group full"><label>Certificate / credential URL (optional)</label><input class="form-control" name="certificate_url" type="url" value="${escapeHtml(cert?.certificate_url||'')}"></div></div><button class="button button-primary button-block" type="submit">${cert?'Save Certificate':'Issue Certificate'}</button></form>`);
  }

  async function handleClick(event) {
    if(!event.target.closest('.account-menu')) document.querySelector('.account-menu')?.classList.remove('open');
    const target = event.target.closest('[data-action]');
    if (!target) {
      if(event.target===document.getElementById('studentClassroomModal')){closeStudentClassroomModal();return;}
      if(event.target===document.getElementById('instructorClassroomModal')){closeInstructorClassroomModal();return;}
      if (event.target === mobileMenu || event.target === cartDrawer || event.target === searchModal) closeOverlays();
      if (event.target.closest('.mobile-nav a,.mobile-account-links a,.drawer-footer a')) closeOverlays();
      return;
    }
    const action = target.dataset.action;
    if(action==='pc-learner-nav'){event.preventDefault();const index=Number(target.dataset.section);if(physicalSectionCanOpen(index)){physicalSectionIndex=index;renderPhysicalPageView();window.scrollTo({top:0,behavior:'smooth'});}return;}
    if (action === 'open-mobile-menu') openOverlay(mobileMenu);
    if (action === 'close-mobile-menu') closeOverlays();
    if (action === 'open-cart') { updateCartDrawer(); openOverlay(cartDrawer); }
    if (action === 'close-cart') closeOverlays();
    if (action === 'open-search') { updateGlobalSearch(); openOverlay(searchModal); setTimeout(()=>document.getElementById('globalSearchInput')?.focus(),100); }
    if (action === 'close-search') closeOverlays();
    if (action === 'close-announcement') { write(LS.announcement,true); announcement.style.display='none'; }
    if (action === 'scroll-top') window.scrollTo({top:0,behavior:'smooth'});
    if (action === 'scroll-events') document.getElementById('event-list')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (action === 'scroll-events-calendar') document.getElementById('events-calendar')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (action === 'event-category') updateEventArchiveQuery({category:target.dataset.value || 'all',month:''});
    if (action === 'event-view') updateEventArchiveQuery({view:target.dataset.view || 'grid'});
    if (action === 'event-clear-filters') updateEventArchiveQuery({q:'',category:'all',location:'all',year:'all',month:''});
    if (action === 'event-calendar-month') updateEventArchiveQuery({month:target.dataset.month || ''});
    if (action === 'event-media-thumb') updateEventMedia(Number(target.dataset.index || 0));
    if (action === 'event-media-prev' || action === 'event-media-next') { const root=document.querySelector('[data-event-media-root]'); const current=Number(root?.dataset.current || 0); updateEventMedia(current + (action==='event-media-next'?1:-1)); }
    if (action === 'event-add-calendar') { const item=eventBySlug(target.dataset.slug); if(item){ downloadEventCalendar(item); toast('Calendar file downloaded.'); } }
    if(action==='checkout-edit-billing'){
      const panel=document.getElementById('checkoutBillingEditor');if(!panel)return;
      const open=panel.hidden;panel.hidden=!open;target.setAttribute('aria-expanded',String(open));
      target.textContent=open?'Use saved details':'Edit saved details';
      panel.querySelectorAll('input,select').forEach(input=>input.disabled=!open);
      return;
    }
    if (action === 'add-cart') {
      const requestedMode=target.dataset.mode || (state.currentPath.startsWith('/course/') ? state.detailDeliveryMode : '');
      addToCart(target.dataset.id,false,requestedMode);
    }
    if (action === 'remove-cart') removeFromCart(target.dataset.id);
    if (action === 'open-cart') { updateCartDrawer(); openOverlay(cartDrawer); }
    if (action === 'buy-now') { if(addToCart(target.dataset.id,true))routeTo('/checkout'); }
    if (action === 'toggle-wishlist') await toggleWishlist(target.dataset.id);
    if (action === 'move-wishlist') { const id=Number(target.dataset.id); if(!state.wishlist.includes(id)) state.wishlist.push(id); write(LS.wishlist,state.wishlist); removeFromCart(id); toast('Moved to wishlist.'); }
    if (action === 'toggle-faq') target.parentElement.classList.toggle('open');
    if (action === 'batch-reset') { state.batchShift='all'; state.batchBranch='all'; state.batchMode='all'; state.batchQuery=''; if(state.currentPath==='/batches'){ renderBatches(); initPage(); } else updateBatchResults(); }
    if (action === 'course-mode') {
      state.courseMode=target.dataset.mode||'all';
      document.querySelectorAll('[data-action="course-mode"]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===state.courseMode));
      updateCoursesResults();
    }
    if (action === 'batch-shift' || action === 'batch-branch' || action === 'batch-mode') {
      if(action==='batch-shift')state.batchShift=target.dataset.value||'all';
      if(action==='batch-branch')state.batchBranch=target.dataset.value||'all';
      if(action==='batch-mode')state.batchMode=target.dataset.value||'all';
      document.querySelectorAll(`[data-action="${action}"]`).forEach(btn=>btn.classList.toggle('active',btn.dataset.value===(action==='batch-shift'?state.batchShift:action==='batch-branch'?state.batchBranch:state.batchMode)));
      const course=state.currentPath.startsWith('/course/')?courseBySlug(state.currentPath.split('/')[2]):null;
      updateBatchResults(course);
    }
    if (action === 'course-scroll-batches') { document.getElementById('course-batches')?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if (action === 'detail-mode') {
      const selected=target.dataset.mode||'classroom';
      history.replaceState(null,'',`#/course/${encodeURIComponent(state.currentPath.split('/')[2])}?mode=${encodeURIComponent(selected)}`);
      renderCourseDetail(state.currentPath.split('/')[2],selected);initPage();
    }
    if (action === 'course-review-prev' || action === 'course-review-next') moveCourseReview(action==='course-review-next'?1:-1);
    if (action === 'category-link') routeTo(`/courses?category=${encodeURIComponent(target.dataset.category)}`);
    if (action === 'course-view') { state.courseView=target.dataset.view; document.querySelectorAll('[data-action="course-view"]').forEach(x=>x.classList.toggle('active',x===target)); updateCoursesResults(); }
    if (action === 'mobile-filters') document.getElementById('courseFilters')?.classList.toggle('mobile-open');
    if (action === 'clear-filters') { state.courseFilters={query:'',categories:[],levels:[],price:[],rating:0,sort:'popular'}; renderCourses(); initPage(); }
    if (action === 'remove-filter') {
      const v=target.dataset.value; if(v.startsWith('Search:'))state.courseFilters.query=''; else if(v.endsWith('+ rating'))state.courseFilters.rating=0; else {state.courseFilters.categories=state.courseFilters.categories.filter(x=>x!==v);state.courseFilters.levels=state.courseFilters.levels.filter(x=>x!==v);} renderCourses(); initPage();
    }
    if (action === 'course-tab') { state.courseTab=target.dataset.tab; document.querySelectorAll('[data-action="course-tab"]').forEach(x=>x.classList.toggle('active',x===target)); const c=courseBySlug(state.currentPath.split('/')[2]); document.getElementById('courseTabPanel').innerHTML=courseTabContent(c,state.courseTab); initReveal(); }
    if (action === 'toggle-module') target.parentElement.classList.toggle('open');
    if (action === 'preview-course') toast('Course preview opened.');
    if (action === 'apply-coupon') { const code=document.getElementById('couponInput')?.value.trim().toUpperCase(); if(code==='FSA10'){state.coupon='FSA10';toast('10% promotional discount applied.');renderCart();}else{state.coupon=null;toast('This promotional code is not valid.','error');renderCart();} initPage(); }
    
    if (action === 'toggle-password') { const input=target.parentElement.querySelector('input'); input.type=input.type==='password'?'text':'password'; }
    if (action === 'toggle-account-menu') { target.closest('.account-menu')?.classList.toggle('open'); }
    if (action === 'logout') { try { await apiRequest('auth_logout',{method:'POST',body:{account_type:state.user?.role==='instructor'?'instructor':'student'}}); } catch (_) {} state.loggedIn=false; state.enrollments=[]; state.pendingEnrollments=[]; state.progress={}; state.orders=[]; state.assignedCourses=[]; state.studentCoursework=[]; state.studentLiveSessions=[]; state.studentRecordings=[];state.studentRecordedLectures=[]; state.playerCourses={}; state.instructorData={students:[],profile_requests:[],certificate_requests:[],certifications:[],courses:[],live_sessions:[],quizzes:[],quiz_attempts:[],assignments:[],submissions:[]}; try{await refreshCatalogData();}catch(_){} toast('Signed out successfully.'); routeTo('/'); }
    if (action === 'toggle-dashboard-nav') document.getElementById('dashboardSidebar')?.classList.toggle('open');
    if (action === 'toggle-instructor-live-submenu') {
      const group=target.closest('.dashboard-nav-group');
      if(group){
        const open=!group.classList.contains('is-open');
        group.classList.toggle('is-open',open);
        target.setAttribute('aria-expanded',open?'true':'false');
      }
      return;
    }
    if (action === 'dashboard-route') {
      event.preventDefault();
      const path=String(target.dataset.route||'').trim()||'/dashboard';
      document.getElementById('dashboardSidebar')?.classList.remove('open');
      const wanted=`#${path}`;
      if(location.hash===wanted) router(); else routeTo(path);
      return;
    }
    if(action==='instructor-student-new'){toast('Student creation is managed from the academy backend.','error');}
    if(action==='instructor-view-student'){openInstructorStudentDetail(Number(target.dataset.id||0));}
    if(action==='edit-instructor-student'){toast('Student records are managed by branch/admin staff.','error');}
    if(action==='add-student-certificate'){toast('Certificates are generated from the backend for completed students.','error');}
    if(action==='instructor-certificate-new'){toast('Certificates are generated from the backend for completed students.','error');}
    if(action==='instructor-certificate-edit'){const cert=(state.instructorData.certifications||[]).find(x=>Number(x.id)===Number(target.dataset.id));if(cert)openInstructorCertificateForm(cert);}
    if(action==='instructor-certificate-delete'&&confirm('Remove this certificate from the student profile?')){try{const r=await apiRequest('instructor_certificate_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorCertificates();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='close-instructor-modal')document.getElementById('instructorActionModal')?.remove();
    if(action==='close-classroom-modal')closeInstructorClassroomModal();
    if(action==='instructor-course-new'){toast('Courses are created and assigned from the academy backend.','error');}
    if(action==='instructor-course-edit'){toast('Course setup is managed from the academy backend.','error');}
    if(action==='instructor-content-edit'||action==='instructor-offline-course-edit'){const c=instructorCourseById(target.dataset.id);if(c)openInstructorOfflineCourseForm(c);}
    if(action==='io-editor-tab'){const form=target.closest('#instructorOfflineCourseForm');if(form){form.querySelectorAll('.io-editor-tabs button').forEach(btn=>btn.classList.toggle('active',btn===target));form.querySelectorAll('[data-io-pane]').forEach(pane=>pane.classList.toggle('active',pane.dataset.ioPane===target.dataset.tab));}return;}
    if(action==='io-add-project'){document.getElementById('instructorOfflineProjects')?.insertAdjacentHTML('beforeend',instructorOfflineProjectEditor({},document.querySelectorAll('#instructorOfflineProjects .io-project').length));return;}
    if(action==='io-remove-project'){target.closest('.io-project')?.remove();return;}
    if(action==='io-add-review'){document.getElementById('instructorOfflineReviews')?.insertAdjacentHTML('beforeend',instructorOfflineReviewEditor({}));return;}
    if(action==='io-remove-review'){target.closest('.io-review')?.remove();return;}
    if(action==='io-add-module'){document.getElementById('instructorOfflineModules')?.insertAdjacentHTML('beforeend',instructorOfflineModuleEditor({lessons:[{}]}));return;}
    if(action==='io-remove-module'){target.closest('.io-module')?.remove();return;}
    if(action==='io-add-lesson'){target.closest('.io-module')?.querySelector('.io-lessons')?.insertAdjacentHTML('beforeend',instructorOfflineLessonEditor({}));return;}
    if(action==='io-add-module-block'){const mod=target.closest('.io-module'),list=mod?.querySelector('.io-module-content-blocks');if(list)list.insertAdjacentHTML('beforeend',instructorOfflineContentBlockEditor({},list.querySelectorAll('.io-content-block').length));return;}
    if(action==='io-remove-module-block'){target.closest('.io-content-block')?.remove();return;}
    if(action==='io-remove-lesson'){target.closest('.io-lesson')?.remove();return;}
    if(action==='io-add-lecture'){const lesson=target.closest('.io-lesson'),list=lesson?.querySelector('.io-lecture-list');if(list){list.insertAdjacentHTML('beforeend',instructorOfflineLectureEditor({},list.querySelectorAll('.io-lecture').length));lesson.querySelector('.io-empty')?.setAttribute('hidden','');}return;}
    if(action==='io-remove-lecture'){const lesson=target.closest('.io-lesson');target.closest('.io-lecture')?.remove();if(lesson&&!lesson.querySelector('.io-lecture'))lesson.querySelector('.io-empty')?.removeAttribute('hidden');return;}
    if(action==='instructor-course-delete'){const c=instructorCourseById(target.dataset.id);if(c&&confirm(`Delete ${c.title}? This also removes its live classes, quizzes and assignments.`)){try{const r=await apiRequest('instructor_course_delete',{method:'POST',body:{id:c.id}});toast(r.message);await Promise.all([syncInstructorData(),refreshCatalogData()]);renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}}}
    if(action==='ic-add-module'){document.getElementById('instructorCurriculumBuilder')?.insertAdjacentHTML('beforeend',instructorModuleEditor({lessons:[{}]}));}
    if(action==='ic-remove-module')target.closest('.ic-module')?.remove();
    if(action==='ic-add-lesson')target.closest('.ic-module')?.querySelector('.ic-lessons')?.insertAdjacentHTML('beforeend',instructorLessonEditor({}));
    if(action==='ic-remove-lesson')target.closest('.ic-lesson')?.remove();
    if(action==='recorded-community-tab'){
      const shell=target.closest('.recorded-community-shell');if(shell){shell.querySelectorAll('.recorded-community-tabs button').forEach(btn=>btn.classList.toggle('active',btn===target));shell.querySelectorAll('[data-community-pane]').forEach(pane=>{const active=pane.dataset.communityPane===target.dataset.tab;pane.hidden=!active;pane.classList.toggle('active',active);});}return;
    }
    if(action==='recorded-discussion-timestamp'){
      const form=target.closest('#recordedDiscussionForm');if(form){const seconds=Math.max(0,Math.floor(Number(recordedLecturePlaybackContext.seconds)||0));form.querySelector('[name="video_seconds"]').value=String(seconds);form.querySelector('[name="lecture_id"]').value=String(recordedLecturePlaybackContext.lectureId||form.querySelector('[name="lecture_id"]').value||0);form.querySelector('[name="attach_timestamp"]').value='1';const ctx=form.querySelector('[data-role="discussion-time-context"]');ctx?.removeAttribute('hidden');const t=form.querySelector('[data-role="discussion-attached-time"]');if(t)t.textContent=recordedTimeLabel(seconds);form.classList.add('has-time');}return;
    }
    if(action==='recorded-discussion-remove-time'){
      const form=target.closest('#recordedDiscussionForm');if(form){form.querySelector('[name="attach_timestamp"]').value='0';form.querySelector('[name="video_seconds"]').value='0';form.querySelector('[data-role="discussion-time-context"]')?.setAttribute('hidden','');form.classList.remove('has-time');}return;
    }
    if(action==='recorded-discussion-reply'){
      const form=document.getElementById('recordedDiscussionForm');if(form){form.querySelector('[name="reply_to_id"]').value=String(target.dataset.id||0);const preview=form.querySelector('[data-role="discussion-reply-preview"]');preview?.removeAttribute('hidden');const n=form.querySelector('[data-role="discussion-reply-name"]'),t=form.querySelector('[data-role="discussion-reply-text"]');if(n)n.textContent=target.dataset.name||'Member';if(t)t.textContent=target.dataset.text||'';form.querySelector('textarea[name="message"]')?.focus();}return;
    }
    if(action==='recorded-discussion-cancel-reply'){
      const form=target.closest('#recordedDiscussionForm');if(form){form.querySelector('[name="reply_to_id"]').value='0';form.querySelector('[data-role="discussion-reply-preview"]')?.setAttribute('hidden','');}return;
    }
    if(action==='recorded-discussion-delete'&&confirm('Remove this message from the course discussion?')){
      try{const r=await apiRequest('recorded_course_discussion_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);const form=document.getElementById('recordedDiscussionForm');await refreshRecordedDiscussion(Number(form?.querySelector('[name="course_id"]')?.value||0),{silent:true});}catch(error){toast(error.message,'error');}return;
    }
    if(action==='recorded-discussion-jump'){
      const courseId=Number(target.dataset.courseId||0),lectureId=Number(target.dataset.lectureId||0),seconds=Number(target.dataset.seconds||0);const currentLecture=Number(recordedLecturePlaybackContext.lectureId||0);
      if(currentLecture===lectureId&&typeof recordedLectureSeekHandler==='function'){recordedLectureSeekHandler(seconds);setTimeout(()=>document.querySelector('.recorded-private-video,.recorded-player-stage')?.scrollIntoView({behavior:'smooth',block:'center'}),30);}else{sessionStorage.setItem('fsaRecordedJump',JSON.stringify({lectureId,seconds}));const instructor=state.user?.role==='instructor';routeTo(`/${instructor?'instructor-recorded-lectures':'recorded-lectures'}/${courseId}/${lectureId}`);}return;
    }
    if(action==='recorded-lesson-tab'){
      state.recordedLessonTab=target.dataset.tab||'overview';
      document.querySelectorAll('[data-action="recorded-lesson-tab"]').forEach(btn=>btn.classList.toggle('active',btn===target));
      const parts=state.currentPath.split('/').filter(Boolean),courseId=Number(parts[1]||0),lectureId=Number(parts[2]||0),instructor=state.currentPath.startsWith('/instructor-recorded-lectures');
      const source=instructor?(state.instructorData.recorded_lectures||[]):(state.studentRecordedLectures||[]);
      const current=source.find(x=>Number(x.id)===lectureId&&Number(x.course_id)===courseId);
      const panel=document.getElementById('recordedLessonTabPanel');
      stopRecordedDiscussion();
      if(current&&panel){panel.innerHTML=recordedLectureTabContent(courseId,current,state.recordedLessonTab,instructor?'instructor':'student');if(state.recordedLessonTab==='discussion')initRecordedDiscussion(courseId,current,instructor?'instructor':'student');}
      return;
    }
    if(action==='recorded-note-save'){
      const id=Number(target.dataset.id||0),note=document.getElementById('recordedLectureNotes')?.value||'';
      try{const r=await apiRequest('student_recorded_lecture_note_save',{method:'POST',body:{lecture_id:id,note}});const lecture=(state.studentRecordedLectures||[]).find(x=>Number(x.id)===id);if(lecture)lecture.note=note;toast(r.message);}catch(error){toast(error.message,'error');}
      return;
    }
    if(action==='instructor-recorded-resource-entry-add'){
      const wrap=document.getElementById('recordedResourceEntries');if(wrap){wrap.insertAdjacentHTML('beforeend',recordedResourceEntryMarkup(wrap.querySelectorAll('.recorded-resource-entry').length));}return;
    }
    if(action==='instructor-recorded-resource-entry-remove'){
      const entry=target.closest('.recorded-resource-entry'),wrap=entry?.parentElement;if(entry&&wrap){if(wrap.querySelectorAll('.recorded-resource-entry').length>1)entry.remove();else{entry.querySelectorAll('input,textarea').forEach(el=>{el.value='';});entry.querySelector('[data-role="recorded-resource-file-name"]')?.replaceChildren(document.createTextNode('PDF, Office, ZIP, project/source files, images, audio/video and other safe files'));}}return;
    }
    if(action==='instructor-recorded-resource-delete'&&confirm('Remove this lecture resource?')){
      try{const resourceId=Number(target.dataset.id||0),lectureId=Number(target.dataset.lectureId||0);const lecture=(state.instructorData.recorded_lectures||[]).find(x=>Number(x.id)===lectureId);const r=await apiRequest('instructor_recorded_resource_delete',{method:'POST',body:{id:resourceId}});toast(r.message);await syncInstructorData();const fresh=(state.instructorData.recorded_lectures||[]).find(x=>Number(x.id)===lectureId);if(document.getElementById('recordedLectureForm'))openInstructorRecordedLectureForm(fresh||lecture);else if(fresh)renderInstructorRecordedLectures(fresh.course_id,fresh.id);initPage();}catch(error){toast(error.message,'error');}
      return;
    }
    if(action==='instructor-recorded-lecture-new'){openInstructorRecordedLectureForm(null,Number(target.dataset.courseId||target.dataset.course||0));}
    if(action==='instructor-recorded-lecture-edit'){openInstructorRecordedLectureForm((state.instructorData.recorded_lectures||[]).find(x=>Number(x.id)===Number(target.dataset.id)));}
    if(action==='instructor-recorded-lecture-save'){
      const form=document.getElementById('recordedLectureForm');
      if(form){
        const fd=new FormData(form),resourceEntries=[...form.querySelectorAll('.recorded-resource-entry')];
        const body={id:Number(fd.get('id')||0),course_id:Number(fd.get('course_id')||0),sort_order:Number(fd.get('sort_order')||1),duration_minutes:Number(fd.get('duration_minutes')||0),title:String(fd.get('title')||''),video_url:String(fd.get('video_url')||''),status:String(fd.get('status')||'published'),description:String(fd.get('description')||'')};
        try{
          target.disabled=true;target.textContent='Saving…';
          const r=await apiRequest('instructor_recorded_lecture_save',{method:'POST',body}),lectureId=Number(r.id||body.id||0);
          let uploaded=0;
          for(const entry of resourceEntries){
            const title=String(entry.querySelector('[data-resource-title]')?.value||'').trim();
            const description=String(entry.querySelector('[data-resource-description]')?.value||'').trim();
            const resourceUrl=String(entry.querySelector('[data-resource-url]')?.value||'').trim();
            const file=entry.querySelector('[data-resource-file]')?.files?.[0]||null;
            const hasAny=Boolean(title||description||resourceUrl||file);
            if(!hasAny)continue;
            if(!description)throw new Error('Add a description for every lecture resource.');
            if(file&&resourceUrl)throw new Error('For each resource, choose either a file or an external URL, not both.');
            if(!file&&!resourceUrl)throw new Error('Choose a file or enter an external URL for every resource you add.');
            const rf=new FormData();rf.set('lecture_id',String(lectureId));rf.set('title',title||(file?.name||'External resource'));rf.set('description',description);
            if(file)rf.set('file',file);else rf.set('external_url',resourceUrl);
            await apiRequest('instructor_recorded_resource_upload',{method:'POST',body:rf});uploaded++;
          }
          toast(uploaded?`${r.message} ${uploaded} resource${uploaded===1?'':'s'} added.`:r.message);
          document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorRecordedLectures(Number(body.course_id||0),lectureId);initPage();
        }catch(error){toast(error.message,'error');}
        finally{target.disabled=false;target.textContent=body.id?'Save changes':'Publish lecture';}
      }
    }
    if(action==='instructor-recorded-lecture-delete'&&confirm('Delete this recorded lecture? Student progress for it will also be removed.')){try{const lecture=(state.instructorData.recorded_lectures||[]).find(x=>Number(x.id)===Number(target.dataset.id));const courseId=Number(lecture?.course_id||0);const r=await apiRequest('instructor_recorded_lecture_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorRecordedLectures(courseId,0);initPage();}catch(error){toast(error.message,'error');}}
    if(action==='recorded-lecture-complete'){try{const id=Number(target.dataset.id),lecture=(state.studentRecordedLectures||[]).find(x=>Number(x.id)===id);const r=await apiRequest('student_recorded_lecture_progress',{method:'POST',body:{lecture_id:id,position_seconds:Number(lecture?.last_position_seconds||0),watched_percent:100,completed:true}});toast(r.message);await syncStudentData();if(lecture)renderRecordedLecturePlayer(lecture.course_id,id);initPage();}catch(error){toast(error.message,'error');}}
    if(action==='instructor-recording-new')openInstructorRecordingForm();
    if(action==='instructor-recording-edit')openInstructorRecordingForm((state.instructorData.recordings||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-recording-delete'&&confirm('Remove this recording from the course library?')){try{const r=await apiRequest('instructor_recording_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorRecordings();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='instructor-recording-sync'){try{const r=await apiRequest('instructor_recording_sync',{method:'POST',body:{live_session_id:Number(target.dataset.liveId||0)}});toast(r.message);await syncInstructorData();if(state.currentPath==='/instructor-recordings')renderInstructorRecordings();else renderInstructorLive();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='instructor-live-new')openInstructorLiveForm();
    if(action==='live-slider-prev' || action==='live-slider-next'){
      const slider=document.getElementById(target.dataset.slider||'');
      if(slider){
        const distance=Math.max(280,Math.floor(slider.clientWidth*.75));
        slider.scrollBy({left:action==='live-slider-next'?distance:-distance,behavior:'smooth'});
      }
    }
    if(action==='instructor-inline-class'){
      if(state.liveRefreshTimer){clearTimeout(state.liveRefreshTimer);state.liveRefreshTimer=null;}
      if(state.instructorStartUnlockTimer){clearTimeout(state.instructorStartUnlockTimer);state.instructorStartUnlockTimer=null;}
      state.selectedInstructorRecordingId=null;
      state.selectedInstructorLiveId=Number(target.dataset.id||0);
      renderInstructorLive();
      setTimeout(()=>document.getElementById('inlineLiveStage')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
    if(action==='instructor-live-start'){
      const id=Number(target.dataset.id||0);
      const oldLabel=target.innerHTML;
      try{
        target.disabled=true;
        target.textContent='Checking Zoom…';
        const r=await apiRequest('instructor_live_start',{method:'POST',body:{id}});
        toast(r.message||'Live class started. Students can join now.');
        await syncInstructorData();
        state.selectedInstructorRecordingId=null;
        state.selectedInstructorLiveId=id;
        renderInstructorLive();
        initPage();
        setTimeout(()=>document.getElementById('inlineLiveStage')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
      }catch(error){
        target.disabled=false;
        target.innerHTML=oldLabel;
        toast(error.message,'error');
      }
    }
    if(action==='instructor-live-end'||action==='instructor-live-finalize'){
      const item=(state.instructorData.live_sessions||[]).find(x=>Number(x.id)===Number(target.dataset.id));
      if(item)openInstructorLiveFinalizeForm(item);
    }
    if(action==='instructor-live-edit')openInstructorLiveForm((state.instructorData.live_sessions||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-live-delete'&&confirm('Remove this live class?')){try{const r=await apiRequest('instructor_live_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorLive();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='course-quiz-results')openCourseQuizResults(Number(target.dataset.id));
    if(action==='course-assignment-submissions')openCourseAssignmentSubmissions(Number(target.dataset.id));
    if(action==='course-sequence-add-quiz')openInstructorQuizForm(null,target.dataset.course||'',{sequenceOrder:Number(target.dataset.sequence||999),quizType:'checkpoint'});
    if(action==='course-sequence-add-final-quiz')openInstructorQuizForm(null,target.dataset.course||'',{sequenceOrder:Number(target.dataset.sequence||9999),quizType:'final'});
    if(action==='course-sequence-add-assignment')openInstructorAssignmentForm(null,target.dataset.course||'',{sequenceOrder:Number(target.dataset.sequence||999)});
    if(action==='student-open-course-quiz'){event.preventDefault();openRecordedStudentQuiz(Number(target.dataset.id));}
    if(action==='student-open-course-assignment'){event.preventDefault();openRecordedStudentAssignment(Number(target.dataset.id));}
    if(action==='instructor-quiz-new')openInstructorQuizForm(null,target.dataset.course||'');
    if(action==='instructor-quiz-edit')openInstructorQuizForm((state.instructorData.quizzes||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-quiz-delete'&&confirm('Delete this quiz and its attempts?')){try{const r=await apiRequest('instructor_quiz_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();const cid=Number(target.dataset.course||0);if(cid)renderInstructorCourseManager(cid);else renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='quiz-add-question'){const list=document.getElementById('quizQuestionBuilder');list?.insertAdjacentHTML('beforeend',quizQuestionEditor({},list.querySelectorAll('.quiz-question-editor').length));}
    if(action==='quiz-remove-question')target.closest('.quiz-question-editor')?.remove();
    if(action==='student-quiz-next'){const form=target.closest('#studentQuizForm');if(form){const step=Number(form.dataset.step||0),current=form.querySelector(`.student-quiz-step[data-step="${step}"]`);if(current&&!current.querySelector('input[type="radio"]:checked')){toast('Choose an answer before continuing.','error');return;}setStudentQuizStep(form,step+1);}}
    if(action==='student-quiz-prev'){const form=target.closest('#studentQuizForm');if(form)setStudentQuizStep(form,Number(form.dataset.step||0)-1);}
    if(action==='instructor-assignment-new')openInstructorAssignmentForm(null,target.dataset.course||'');
    if(action==='instructor-assignment-edit')openInstructorAssignmentForm((state.instructorData.assignments||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-assignment-delete'&&confirm('Delete this assignment and its submissions?')){try{const r=await apiRequest('instructor_assignment_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();const cid=Number(state.currentPath.split('/')[2]||0);if(state.currentPath.startsWith('/instructor-course-manage/')&&cid)renderInstructorCourseManager(cid);else renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='instructor-grade-submission'){const sub=(state.instructorData.submissions||[]).find(x=>Number(x.id)===Number(target.dataset.id));if(sub)openInstructorGradeForm(sub);}
    if(action==='live-theater-recording'){
      const mode=target.dataset.mode||'student';
      const id=Number(target.dataset.id||0);
      if(mode==='host'){
        state.selectedInstructorRecordingId=id;
        state.selectedInstructorLiveId=null;
        renderInstructorLive();
      }else{
        state.selectedStudentRecordingId=id;
        state.selectedStudentLiveId=null;
        renderStudentLiveClasses();
      }
      setTimeout(()=>document.getElementById('inlineLiveStage')?.scrollIntoView({behavior:'smooth',block:'center'}),50);
    }
    if(action==='live-theater-live'){
      const mode=target.dataset.mode||'student';
      const id=Number(target.dataset.id||0);
      if(mode==='host'){
        state.selectedInstructorRecordingId=null;
        state.selectedInstructorLiveId=id;
        renderInstructorLive();
      }else{
        state.selectedStudentRecordingId=null;
        state.selectedStudentLiveId=id;
        renderStudentLiveClasses();
      }
      setTimeout(()=>document.getElementById('inlineLiveStage')?.scrollIntoView({behavior:'smooth',block:'center'}),50);
    }
    if(action==='student-inline-class'){
      if(state.liveRefreshTimer){clearTimeout(state.liveRefreshTimer);state.liveRefreshTimer=null;}
      state.selectedStudentRecordingId=null;
      state.selectedStudentLiveId=Number(target.dataset.id||0);
      renderStudentLiveClasses();
      setTimeout(()=>document.getElementById('inlineLiveStage')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
    if(action==='student-live-join'){state.selectedStudentLiveId=Number(target.dataset.id||0);routeTo('/live-classes');}
    if(action==='student-course-live-open'){
      if(!state.liveCourseFilters)state.liveCourseFilters={student:'all',instructor:'all',recordings:'all'};
      state.liveCourseFilters.student=String(target.dataset.courseId||'all');
      state.selectedStudentLiveId=Number(target.dataset.liveId||0)||null;
      routeTo('/live-classes');
    }
    if(action==='student-open-quiz')openStudentQuiz(target.dataset.id);
    if(action==='student-open-assignment')openStudentAssignment(target.dataset.id);
    if(action==='close-student-classroom-modal')closeStudentClassroomModal();
    if (action === 'learner-tab') { state.learnerTab=target.dataset.tab; renderMyCourses(); initPage(); }
    if (action === 'profile-tab') { state.profileTab=target.dataset.tab; document.querySelectorAll('[data-action="profile-tab"]').forEach(x=>x.classList.toggle('active',x===target)); document.getElementById('profileTabPanel').innerHTML=profileTabContent(state.profileTab); }
    if (action === 'print-certificate') { toast('Opening print view.'); setTimeout(()=>window.print(),300); }
    if (action === 'toggle-player-module') target.parentElement.classList.toggle('open');
    if (action === 'select-lesson') { state.playerSelection[target.dataset.course]=target.dataset.key; write(LS.playerSelection,state.playerSelection); const c=playerCourseById(target.dataset.course); renderPlayer(c.slug); initPage(); }
    if (action === 'select-lecture') { const key=`${target.dataset.course}:${target.dataset.lesson}`;state.lectureSelection[key]=Number(target.dataset.index||0);write(LS.lectureSelection,state.lectureSelection);const c=playerCourseById(target.dataset.course);renderPlayer(c.slug);initPage(); }
    if (action === 'mark-complete') {
      const id=Number(target.dataset.course), key=target.dataset.key;
      try {
        const result = await apiRequest('student_progress_toggle',{method:'POST',body:{course_id:id,lesson_key:key}});
        const list=new Set(state.progress[id]||[]); if(result.completed) list.add(key); else list.delete(key); state.progress[id]=[...list];
        await syncStudentData();
        const c=playerCourseById(id); toast(progressPercent(id)===100?'Course completed — certificate unlocked!':result.message); renderPlayer(c.slug); initPage();
      } catch (error) { toast(error.message,'error'); }
    }
    if (action === 'previous-lesson' || action === 'next-lesson') {
      const course=playerCourseById(target.dataset.course), entries=lessonEntries(course), current=currentLessonFor(course), idx=entries.findIndex(e=>e.key===current.key), next=entries[idx+(action==='next-lesson'?1:-1)]; if(next){state.playerSelection[course.id]=next.key;write(LS.playerSelection,state.playerSelection);renderPlayer(course.slug);initPage();}
    }
    if (action === 'lesson-tab') { state.lessonTab=target.dataset.tab; document.querySelectorAll('[data-action="lesson-tab"]').forEach(x=>x.classList.toggle('active',x===target)); const c=state.playerCourses[state.currentPath.split('/')[2]]?.course||courseBySlug(state.currentPath.split('/')[2]), l=currentLessonFor(c); document.getElementById('lessonTabPanel').innerHTML=playerTabContent(c,l,state.lessonTab); }
    if (action === 'save-notes') {
      const key=target.dataset.noteKey, [courseId, lessonKey]=key.split(':');
      const note=document.getElementById('lessonNotes')?.value||'';
      try { const result=await apiRequest('student_note_save',{method:'POST',body:{course_id:Number(courseId),lesson_key:lessonKey,note}}); state.notes[key]=note; toast(result.message); }
      catch(error){ toast(error.message,'error'); }
    }
    if (action === 'toggle-video') { const center=document.querySelector('.video-center-control'); center?.classList.toggle('playing'); document.querySelectorAll('[data-action="toggle-video"]').forEach(btn=>btn.innerHTML=center?.classList.contains('playing')?icon('pause'):icon('play','',true)); toast(center?.classList.contains('playing')?'Lesson playing.':'Lesson paused.'); }
    if (action === 'download-demo') toast('This lesson resource is not available yet.','error');
    if (action === 'demo-discussion') toast('Your question has been added to the discussion.');
    if (action === 'branch-select') selectBranchRoute(target.dataset.id);
    if (action === 'branch-scroll') document.getElementById(target.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});
    if (action === 'branch-location') requestBranchLocation();
    if (action === 'branch-marker') { const b=D.branches.find(x=>x.id===target.dataset.id); if(b) toast(`${b.name}: ${b.address}`); }
    if (action === 'search-term') { const input=document.getElementById('globalSearchInput'); input.value=target.dataset.searchTerm; updateGlobalSearch(input.value); }
  }

  let courseReviewTimer=null;
  function moveCourseReview(direction=1) {
    const track=document.querySelector('[data-course-review-track]');
    if(!track)return;
    const cards=[...track.children];
    if(!cards.length)return;
    const gap=parseFloat(getComputedStyle(track).gap)||18;
    const step=(cards[0].getBoundingClientRect().width+gap);
    const max=Math.max(0,track.scrollWidth-track.clientWidth);
    let next=track.scrollLeft+step*direction;
    if(direction>0&&next>max-8)next=0;
    if(direction<0&&next<0)next=max;
    track.scrollTo({left:next,behavior:'smooth'});
    setTimeout(updateCourseReviewCounter,360);
  }
  function updateCourseReviewCounter() {
    const track=document.querySelector('[data-course-review-track]');
    if(!track||!track.children.length)return;
    const first=track.children[0],gap=parseFloat(getComputedStyle(track).gap)||18,step=first.getBoundingClientRect().width+gap;
    const index=Math.min(track.children.length-1,Math.max(0,Math.round(track.scrollLeft/Math.max(1,step))));
    document.querySelectorAll('[data-review-current]').forEach(node=>node.textContent=String(index+1).padStart(2,'0'));
  }
  function initCoursePageInteractions() {
    if(courseReviewTimer){clearInterval(courseReviewTimer);courseReviewTimer=null;}
    const track=document.querySelector('[data-course-review-track]');
    if(!track)return;
    track.addEventListener('scroll',updateCourseReviewCounter,{passive:true});
    courseReviewTimer=setInterval(()=>{if(!document.hidden&&!track.matches(':hover'))moveCourseReview(1);},6000);
  }

  function prepareScrollAnimations() {
    const decorate = (selector, variant = '', stagger = true) => {
      document.querySelectorAll(selector).forEach((node,index) => {
        if (!node.classList.contains('reveal')) node.classList.add('reveal');
        if (variant) node.classList.add(variant);
        if (stagger && !node.style.transitionDelay) node.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
      });
    };

    decorate('#app .section-heading, #app .fsa-home-heading, #app .page-heading, #app .fsa-carousel-heading-row', 'reveal-soft', false);
    decorate('#app .fsa-home-stats-grid article, #app .course-card, #app .category-card, #app .plan-card, #app .branch-card, #app .fsa-home-course, #app .fsa-branch-showcase, #app .fsa-home-help-card, #app .fsa-home-feature, #app .fsa-placement-card, #app .fsa-home-testimonial, #app .fsa-learning-choice-card, #app .value-card, #app .mission-card, #app .step-card, #app .contact-info-card, #app .panel, #app .fsa-catalog-course, #app .fsa-batch-card, #app .fsa-course-review, #app .fsa-archive-grid article, #app .fsa-learning-mode-cards article, #app .fsa-course-summary-grid article', 'reveal-soft');
    decorate('#app .fsa-home-mission-photo, #app .about-image-stack, #app .page-hero-image, #app .map-visual, #app .fsa-home-award img, #app .fsa-company-marquees', 'reveal-scale', false);
    decorate('#app .fsa-home-mission-top > div:first-child, #app .split-section > div:first-child, #app .about-story > div:last-child', 'reveal-left', false);
    decorate('#app .fsa-home-mission-top > div:last-child, #app .split-section > div:last-child', 'reveal-right', false);
    decorate('.site-footer .footer-brand, .site-footer .footer-column', 'reveal-soft');
  }

  function updateScrollProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal:not(.revealed)');
    if (!('IntersectionObserver' in window)) { items.forEach(x=>x.classList.add('revealed')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: .12 });
    items.forEach(x=>observer.observe(x));
  }

  function animateStats() {
    document.querySelectorAll('[data-count]').forEach(node => {
      const end = Number(node.dataset.count), suffix=node.dataset.suffix||'', duration=900, start=performance.now();
      const tick = now => { const p=Math.min(1,(now-start)/duration), eased=1-Math.pow(1-p,3), value=end%1? (end*eased).toFixed(1):Math.round(end*eased); node.textContent=`${value}${suffix}`; if(p<1)requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }

  function updateHeader() {
    const searchButton = document.querySelector('[data-action="open-search"]');
    const cartButton = document.querySelector('[data-action="open-cart"]');
    const menuButton = document.querySelector('[data-action="open-mobile-menu"]');
    if (searchButton) searchButton.innerHTML = icon('search');
    if (cartButton) cartButton.innerHTML = `${icon('cart')}<span class="cart-count" id="cartCount">${state.cart.length}</span>`;
    if (menuButton) menuButton.innerHTML = icon('menu');
    document.querySelectorAll('[data-action="close-mobile-menu"].icon-button,[data-action="close-cart"],[data-action="close-search"]').forEach(btn => btn.innerHTML = icon('x'));
    const modalIcon = document.querySelector('.search-field-icon'); if(modalIcon) modalIcon.innerHTML=icon('search');
    const desktopAuth=document.getElementById('desktopAuth');
    if(desktopAuth){
      const instructor=state.user.role==='instructor';desktopAuth.innerHTML=state.loggedIn?`<div class="account-menu"><button class="account-menu-trigger" type="button" data-action="toggle-account-menu"><span class="account-avatar">${state.user.avatar?`<img src="${escapeHtml(state.user.avatar)}" alt="">`:escapeHtml(initials(state.user.name))}</span><span>${escapeHtml((state.user.name||'My Account').split(/\s+/)[0])}</span>${icon('chevronDown')}</button><div class="account-dropdown"><div class="account-dropdown-user"><strong>${escapeHtml(state.user.name||'Academy Member')}</strong><small>${escapeHtml(state.user.email||'')}</small></div><a href="${instructor?'#/instructor-dashboard':'#/dashboard'}">Dashboard</a>${instructor?'<a href="#/instructor-courses">My Courses</a><a href="#/instructor-live">Live Classes</a><a href="#/instructor-recorded-lectures">Recorded Lectures</a><a href="#/instructor-certificates">Certificates</a><a href="#/instructor-students">Students</a>':'<a href="#/my-courses">My Courses</a><a href="#/recorded-lectures">Recorded Lectures</a><a href="#/live-classes">Live Classes</a>'}<a href="#/profile">My Profile</a><button type="button" data-action="logout">Sign Out</button></div></div>`:`<a class="text-button" href="#/login">Sign In</a>`;
    }
    const mobileAccountLinks=document.getElementById('mobileAccountLinks');
    if(mobileAccountLinks)mobileAccountLinks.hidden=!state.loggedIn;
    const mobileAuthAction=document.getElementById('mobileAuthAction');
    if(mobileAuthAction)mobileAuthAction.innerHTML=state.loggedIn?`<button class="button button-secondary button-block" type="button" data-action="logout">Sign Out ${escapeHtml((state.user.name||'').split(/\s+/)[0])}</button>`:`<a class="button button-secondary button-block" href="#/login">Sign In</a>`;
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    const key = state.currentPath === '/' ? 'home' : state.currentPath.split('/')[1];
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===key));
    const placementTrigger=document.querySelector('.placement-nav-trigger');
    if(placementTrigger) placementTrigger.classList.toggle('active',['companies','alumni','candidates'].includes(key));
  }

  function initPage() {
    upgradeBatchDropdowns(); updateHeader(); updateDocumentTitle(); updateCartDrawer(); prepareScrollAnimations(); initReveal(); animateStats(); initHomeInteractions(); initCoursePageInteractions(); updateScrollProgress();
    if (state.currentPath === '/branches') initBranchMap(); else if (branchMapState.map) destroyBranchMap();
    header.classList.toggle('is-scrolled',window.scrollY>12);
    app.focus({preventScroll:true});
  }

  let routeRequest=0;
  async function router() {
    closeOverlays();
    const raw = decodeURIComponent((location.hash || '#/').slice(1));
    const [path, query=''] = raw.split('?');
    const request=++routeRequest;
    state.currentPath = path || '/';
    const publicRoute=['/','/courses','/batches','/events','/about','/contact','/companies','/alumni','/candidates','/branches','/help','/terms','/privacy','/refund','/super40-bba'].includes(path)||path.startsWith('/course/')||path.startsWith('/event/');
    if(publicRoute && D.content){try{await refreshCatalogData();}catch(error){toast(error.message||'Backend connection failed.','error');}if(request!==routeRequest)return;}
    if(state.loggedIn && state.user?.role==='student' && (path.startsWith('/course/')||['/courses','/cart','/checkout'].includes(path))){
      try{await syncStudentData();prunePurchasedCart();}catch(error){console.warn('Enrollment refresh unavailable:',error.message);}
      if(request!==routeRequest)return;
    }

    const recordedRoute=state.currentPath.startsWith('/recorded-lectures')||state.currentPath.startsWith('/instructor-recorded-lectures');
    if(!recordedRoute){stopRecordedDiscussion();stopRecordedLectureTracking();stopRecordedLecturePreview();}
    window.scrollTo(0,0);
    if (state.currentPath === '/') renderHome();
    else if (state.currentPath === '/courses') { if(query) state.currentPath=`/courses?${query}`; renderCourses(); state.currentPath='/courses'; }
    else if (state.currentPath.startsWith('/course/')) renderCourseDetail(state.currentPath.split('/')[2],new URLSearchParams(query).get('mode')||'');
    else if (state.currentPath === '/super40-bba') { setChrome('public'); if (window.FSA_SUPER40_PAGE) window.FSA_SUPER40_PAGE.render(app); else renderNotFound(); }
    else if (state.currentPath === '/batches') renderBatches();
    else if (state.currentPath === '/cart') renderCart();
    else if (state.currentPath === '/checkout') renderCheckout();
    else if (state.currentPath === '/checkout-success') renderCheckoutSuccess();
    else if (state.currentPath === '/login') renderLogin();
    else if (state.currentPath === '/register') renderRegister();
    else if (state.currentPath === '/forgot-password') renderForgotPassword();
    else if (state.currentPath === '/reset-password') renderResetPassword(query);
    else if (state.currentPath === '/dashboard') renderDashboard();
    else if (state.currentPath === '/instructor-dashboard') renderInstructorDashboard();
    else if (state.currentPath === '/instructor-courses') renderInstructorCourses();
    else if (state.currentPath.startsWith('/instructor-course-manage/')) renderInstructorCourseManager(Number(state.currentPath.split('/')[2]||0));
    else if (state.currentPath === '/instructor-live') renderInstructorLive();
    else if (state.currentPath === '/instructor-recordings') renderInstructorRecordings();
    else if (state.currentPath.startsWith('/instructor-recorded-lectures')) { const p=state.currentPath.split('/').filter(Boolean); renderInstructorRecordedLectures(Number(p[1]||0),Number(p[2]||0)); }
    else if (state.currentPath === '/instructor-quizzes') renderInstructorQuizzes();
    else if (state.currentPath === '/instructor-assignments') renderInstructorAssignments();
    else if (state.currentPath === '/instructor-certificates') renderInstructorCertificates();
    else if (state.currentPath === '/instructor-students') renderInstructorStudents();
    else if (state.currentPath === '/instructor-requests') renderInstructorRequests();
    else if (state.currentPath.startsWith('/my-course/')) renderStudentCourseHub(state.currentPath.split('/')[2]);
    else if (state.currentPath === '/my-courses') renderMyCourses();
    else if (state.currentPath === '/my-quizzes') renderMyQuizzes();
    else if (state.currentPath === '/my-assignments') renderMyAssignments();
    else if (state.currentPath === '/live-classes') renderStudentLiveClasses();
    else if (state.currentPath === '/recorded-lectures') renderRecordedLecturesEntry();
    else if (state.currentPath === '/recorded-lectures/archive') renderRecordedLecturesArchive();
    else if (state.currentPath.startsWith('/recorded-lectures/')) { const p=state.currentPath.split('/').filter(Boolean); renderRecordedLecturePlayer(Number(p[1]||0),Number(p[2]||0)); }
    else if (state.currentPath === '/wishlist') renderWishlist();
    else if (state.currentPath === '/certificates') renderCertificates();
    else if (state.currentPath === '/purchase-history') renderPurchaseHistory();
    else if (state.currentPath === '/profile') renderProfile();
    else if (state.currentPath.startsWith('/people/')) renderPublicProfile(state.currentPath.split('/')[2]);
    else if (state.currentPath.startsWith('/learn/')) {
      const slug=state.currentPath.split('/')[2],classroomTarget=new URLSearchParams(query).get('classroom')||'';
      if(classroomTarget)state.lessonTab='classroom';
      const loading=classroomTarget?renderPlayer(slug):renderPhysicalPrivatePage(slug);
      if(classroomTarget)Promise.resolve(loading).then(()=>{const [kind,id]=classroomTarget.split(':');if(kind==='quiz'&&id)openStudentQuiz(Number(id));else if(kind==='assignment'&&id)openStudentAssignment(Number(id));}).catch(error=>toast(error.message||'Unable to open coursework.','error'));
    }
    else if (state.currentPath === '/events') renderEvents(query);
    else if (state.currentPath.startsWith('/event/')) renderEventDetail(state.currentPath.split('/')[2]);
    else if (state.currentPath === '/about') renderAbout();
    else if (state.currentPath === '/contact') renderContact();
    else if (state.currentPath === '/companies') { setChrome('public'); if (window.FSA_PLACEMENTS_PAGE) window.FSA_PLACEMENTS_PAGE.renderCompanies(app); else renderNotFound(); }
    else if (state.currentPath === '/alumni') { setChrome('public'); if (window.FSA_PLACEMENTS_PAGE) window.FSA_PLACEMENTS_PAGE.renderAlumni(app, query); else renderNotFound(); }
    else if (state.currentPath === '/candidates') { setChrome('public'); if (window.FSA_CANDIDATES_PAGE) window.FSA_CANDIDATES_PAGE.render(app); else renderNotFound(); }
    else if (state.currentPath === '/branches') { const branchId = new URLSearchParams(query).get('branch') || ''; renderBranches(branchId); }
    else if (state.currentPath === '/help') renderHelp();
    else if (['/terms','/privacy','/refund'].includes(state.currentPath)) renderLegal(state.currentPath.slice(1));
    else renderNotFound();
    window.FSA_CMS?.applyRoute(state.currentPath, app);
    initPage();window.FSA_CONTENT?.apply();
    if (state.currentPath === '/branches' && query) {
      const branchId = new URLSearchParams(query).get('branch');
      if (branchId && D.branches.some(branch => branch.id === branchId)) {
        setTimeout(() => document.getElementById(`branch-${branchId}`)?.scrollIntoView({behavior:'smooth',block:'center'}), 140);
      }
    }
  }

  ICONS.creditCard = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>';
  ICONS.upload = '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>';
  ICONS.paperclip = '<path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>';

  ICONS.radio = '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.8 4.8a10.2 10.2 0 0 0 0 14.4M19.2 4.8a10.2 10.2 0 0 1 0 14.4"/>';
  ICONS.classroom = '<path d="M3 5h18v12H3zM8 21h8M12 17v4"/><path d="M7 9h5M7 12h8"/>';
  ICONS.layers = '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>';
  ICONS.building = '<path d="M4 21V5l8-3 8 3v16M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2M2 21h20"/>';
  ICONS.graduation = '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M22 9v6"/>';

  document.addEventListener('click',handleClick);
  document.addEventListener('submit',handleFormSubmit);
  document.addEventListener('change',handleChange);
  document.addEventListener('input',handleInput);
  window.addEventListener('hashchange',router);
  window.addEventListener('scroll',()=>{ header.classList.toggle('is-scrolled',window.scrollY>12); scrollTopButton.classList.toggle('show',window.scrollY>500); updateScrollProgress(); },{passive:true});
  window.addEventListener('keydown',event=>{ if(event.key==='Escape'){if(document.getElementById('studentClassroomModal'))closeStudentClassroomModal();else if(document.getElementById('instructorClassroomModal'))closeInstructorClassroomModal();else closeOverlays();} });
  ['courses','plans','branches','instructors','batches','companies','alumni','candidates','events','reviews'].forEach(key=>D[key]=[]);
  applySiteSettings(siteSettings);
  (async function initializeApp() {
    try {
      const catalog = await apiRequest('catalog');
      applyBackendCatalog(catalog);
      const wantsInstructor=String(window.location.hash||'').includes('/instructor');
      const result = await apiRequest('auth_me',{query:{account_type:wantsInstructor?'instructor':'student'}});
      if (result.authenticated && result.user?.role !== 'admin') {
        state.loggedIn = true;
        state.user = { ...state.user, ...result.user };
        if(result.user.role==='instructor')await syncInstructorData();else await syncStudentData();
      } else {
        state.loggedIn = false;
        state.enrollments = [];
        state.studentEnrollmentRows = [];
        state.pendingEnrollments = [];
        state.progress = {};
        state.orders = [];
        state.assignedCourses = [];
        state.studentCoursework = [];
        state.studentLiveSessions = [];
        state.studentRecordings = [];
        state.playerCourses = {};

      }
    } catch (error) {
      const message = String(error?.message || '');
      state.loggedIn = false;
      state.user = { ...defaultUser };
      state.enrollments = [];
      state.studentEnrollmentRows = [];
      state.allEnrollmentRows = [];
      state.checkoutProfile = null;
      state.pendingEnrollments = [];
      state.progress = {};
      state.orders = [];
      state.notes = {};
      state.wishlist = [];
      state.assignedCourses = [];
      state.studentCoursework = [];
      state.studentLiveSessions = [];
      state.studentRecordings = [];
      state.playerCourses = {};
      state.instructorData = {students:[],profile_requests:[],certificate_requests:[],certifications:[],courses:[],live_sessions:[],recordings:[],recorded_lectures:[],recorded_lecture_progress:[],quizzes:[],quiz_attempts:[],assignments:[],submissions:[]};
      toast(message.includes('install') ? 'Open /install/ to configure the MySQL database.' : (message || 'Backend connection failed. Check PHP and MySQL.'), 'error');
      app.innerHTML='<section class="page-section"><div class="container"><p>Backend connection failed. Check PHP and MySQL.</p></div></section>';return;
    }
    router();
  })();

  window.addEventListener('message',(event)=>{
    if(event.origin!==window.location.origin)return;
    const payload=event.data||{};
    if(payload.type!=='fsa-zoom-state')return;

    state.zoomEmbedState=String(payload.state||'idle');
    state.zoomEmbedLiveId=Number(payload.liveId||0)||null;
    state.zoomEmbedMode=payload.mode||null;

    if(['loading','joining','joined','reconnecting'].includes(state.zoomEmbedState)){
      stopLiveAutoRefreshWhileZoomMounted();
    }
  });

  window.addEventListener('resize',()=>{
    if(document.body.dataset.mode==='dashboard') scheduleDashboardFixedSidebar();
    scheduleLiveTheaterRailSync();
    if(mountedZoomIframe())stopLiveAutoRefreshWhileZoomMounted();
  });
})();
