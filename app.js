/* FSA Branches V21 — branch mega-menu markup/CSS refresh; existing routing logic preserved. */
(() => {
  'use strict';

  const D = window.FSA_DATA;
  // Public catalogue data is backend-owned. Never render static course fallback copies from data.js.
  D.courses = [];
  D.branches = [];
  D.instructors = [];
  D.batches = [];
  D.companies = [];
  D.alumni = [];
  D.candidates = [];
  D.events = [];
  D.reviews = [];
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
    lastOrder: 'fsa_last_order_v3'
  };

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  // FRONTEND-ONLY DEMO AUTH MODE
  // This staging build intentionally avoids PHP/MySQL and stores demo accounts in localStorage.
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
      const role = payload.account_type === 'instructor' ? 'instructor' : 'student';
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
    const { method = 'GET', body, params } = options;
    const requestOptions = { method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      if (csrfToken) requestOptions.headers['X-CSRF-Token'] = csrfToken;
      if (body instanceof FormData) requestOptions.body = body;
      else { requestOptions.headers['Content-Type'] = 'application/json'; requestOptions.body = JSON.stringify(body); }
    }
    const query = new URLSearchParams({ action });
    if (params && typeof params === 'object') Object.entries(params).forEach(([key,value]) => {
      if (value !== undefined && value !== null && String(value) !== '') query.set(key, String(value));
    });
    let response;
    try { response = await fetch(`${API_URL}?${query.toString()}`, requestOptions); }
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
    write(LS.user, defaultUser);
    write(LS.enrollments, []);
    write(LS.progress, {});
    write(LS.orders, []);
    write(LS.cart, []);
    write(LS.wishlist, []);
    write(LS.initialized, true);
  }

  const state = {
    cart: read(LS.cart, []).map(normalizeCartEntry).filter(Boolean),
    wishlist: read(LS.wishlist, []),
    user: { ...defaultUser, ...read(LS.user, {}) },
    loggedIn: read(LS.loggedIn, false),
    enrollments: [],
    pendingEnrollments: [],
    progress: {},
    orders: [],
    notes: read(LS.notes, {}),
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
    coupon: null,
    currentPath: '/',
    courseMode: 'all',
    batchShift: 'all',
    batchBranch: 'all',
    batchMode: 'all',
    batchQuery: '',
    detailDeliveryMode: 'classroom'
    ,certifications: [], instructorData: {students:[],profile_requests:[],certificate_requests:[],certifications:[],courses:[],live_sessions:[],quizzes:[],assignments:[],submissions:[]}
  };
  write(LS.cart,state.cart);


  async function syncStudentData() {
    if (!state.loggedIn) {
      state.enrollments = [];
      state.pendingEnrollments = [];
      state.progress = {};
      state.orders = [];
      state.assignedCourses = [];
      return;
    }
    const result = await apiRequest('student_data');
    state.user = { ...state.user, ...(result.user || {}) };
    const enrollmentRows = result.enrollments || [];
    state.enrollments = enrollmentRows.filter(item => ['active','completed'].includes(item.status) && item.access_allowed !== false).map(item => Number(item.course_id));
    state.pendingEnrollments = enrollmentRows.filter(item => item.status === 'pending').map(item => Number(item.course_id));
    state.progress = result.progress || {};
    state.orders = result.orders || [];
    state.notes = result.notes || {};
    state.wishlist = (result.wishlist || []).map(Number);
    state.certifications = result.certifications || [];
    state.assignedCourses = Array.isArray(result.assigned_courses) ? result.assigned_courses : [];
    write(LS.user, state.user);
    write(LS.loggedIn, true);
    write(LS.wishlist, state.wishlist);
  }

  async function syncInstructorData() {
    if (!state.loggedIn || state.user.role !== 'instructor') return;
    state.assignedCourses = [];
    state.playerCourses = {};
    const result = await apiRequest('instructor_data');
    state.user = { ...state.user, ...(result.user || {}) };
    state.instructorData = {students:result.students||[],profile_requests:result.profile_requests||[],certificate_requests:result.certificate_requests||[],certifications:result.certifications||result.certificate_requests||[],courses:result.courses||[],live_sessions:result.live_sessions||[],quizzes:result.quizzes||[],assignments:result.assignments||[],submissions:result.submissions||[]};
    write(LS.user,state.user);write(LS.loggedIn,true);
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
  // Courses are intentionally not defined in frontend JavaScript. The PHP/MySQL catalog is the single public source of truth.

  function globalWrittenReviews(limit=0) {
    const rows=(Array.isArray(D.reviews)?D.reviews:[]).filter(r=>r&&r.type==='written'&&r.name);
    const mapped=rows.map(r=>({id:r.id,name:r.name,role:r.role||r.course||'FSA learner',course:r.course||r.role||'Full Stack Academy',avatar:r.avatar||'',rating:Number(r.rating||5),text:r.text||'',comment:r.text||'',featured:!!r.featured,sortOrder:Number(r.sortOrder||0)}));
    return limit>0?mapped.slice(0,limit):mapped;
  }
  function globalVideoReviews(limit=0) {
    const rows=(Array.isArray(D.reviews)?D.reviews:[]).filter(r=>r&&r.type==='video'&&r.name&&r.videoUrl);
    return limit>0?rows.slice(0,limit):rows;
  }

  function catalogCourses() {
    return Array.isArray(D.courses) ? D.courses : [];
  }

  function syncCourseMegaMenu(){
    const grid=document.getElementById('courseMegaCourseList');
    if(!grid)return;
    const courses=catalogCourses().filter(course=>course&&course.title&&course.slug);
    if(!courses.length){
      grid.innerHTML='<span class="course-mega-loading">No published courses available.</span>';
      return;
    }
    const iconForCourse=(course)=>{
      const text=`${course.category||''} ${course.title||''}`.toLowerCase();
      if(/ai|machine|generative/.test(text))return 'ai';
      if(/data|analyst|analytics/.test(text))return 'chart';
      if(/cloud|aws|devops|azure/.test(text))return 'cloud';
      if(/security|soc|test/.test(text))return 'shield';
      if(/marketing|business/.test(text))return 'megaphone';
      return 'code';
    };
    grid.innerHTML=courses.map(course=>{
      const delivery=courseDelivery(course);
      const modes=[delivery.classroom?'Offline':'',delivery.live?'Live':'',delivery.recorded?'Recorded':''].filter(Boolean).join(' · ');
      return `<a class="course-mega-item course-mega-course" href="#/course/${encodeURIComponent(course.slug)}"><span class="mega-icon" data-premium-icon="${iconForCourse(course)}"></span><span><strong>${escapeHtml(course.title)}</strong><small>${escapeHtml(course.category||'Technology Course')}${modes?` · ${escapeHtml(modes)}`:''}</small></span></a>`;
    }).join('');
    renderPremiumIcons?.();
  }

  function courseDelivery(course) {
    const source=Array.isArray(course?.deliveryModes)&&course.deliveryModes.length?course.deliveryModes:course?.delivery_modes;
    const raw = Array.isArray(source) ? source : String(source || '').split(/[|,]/).filter(Boolean);
    const modes = new Set(raw.map(x => String(x).trim().toLowerCase().replace(/[_\s]+/g,'-')));
    const configured = modes.size > 0;
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
    const empty={badge:'',image:'',short:'',description:'',price:0,originalPrice:0,duration:'',hours:0,projects:0,rating:0,reviews:0,students:0,level:'',language:'',updated:'',instructor:'',instructorRole:'',skills:[],requirements:[],audience:[],projectItems:[],courseReviews:[]};
    const content=hasBackendModes?{...empty,...(modes[key]&&typeof modes[key]==='object'?modes[key]:{})}:course;
    return {...course,...content,deliveryMode:key,selectedDeliveryMode:key,contentModes:modes,contentByMode:modes};
  }


  function uiModeToBackend(mode){ return mode==='classroom'?'offline':mode==='recorded'?'recorded':'live'; }
  function backendModeToUi(mode){ return mode==='offline'?'classroom':mode==='recorded'?'recorded':'live'; }
  function deliveryModeLabel(mode){ return mode==='offline'||mode==='classroom'?'Physical / Offline':mode==='recorded'?'Recorded':'Live'; }
  function defaultCourseUiMode(course){
    const delivery=courseDelivery(course);
    const primary=backendModeToUi(course?.deliveryMode||'');
    if((primary==='live'&&delivery.live)||(primary==='recorded'&&delivery.recorded)||(primary==='classroom'&&delivery.classroom)) return primary;
    return delivery.classroom?'classroom':delivery.live?'live':delivery.recorded?'recorded':'classroom';
  }
  function normalizeCartEntry(entry){
    if(entry&&typeof entry==='object'){
      const courseId=Number(entry.courseId??entry.course_id??entry.id??0);
      const raw=String(entry.mode??entry.deliveryMode??entry.delivery_mode??'').toLowerCase();
      const mode=['offline','live','recorded'].includes(raw)?raw:(raw==='classroom'?'offline':'');
      return courseId?{courseId,mode}:null;
    }
    const courseId=Number(entry||0);
    return courseId?{courseId,mode:''}:null;
  }
  function cartKey(item){ return `${Number(item.courseId||0)}:${item.mode||''}`; }

  function deliveryPills(delivery) {
    return `${delivery.live?'<span class="mode-pill live">Live Streamed</span>':''}${delivery.recorded?'<span class="mode-pill recorded">Recorded</span>':''}${delivery.classroom?'<span class="mode-pill classroom">Offline Classroom</span>':''}`;
  }

  function courseModules(course) {
    if (Array.isArray(course.modules) && course.modules.length) return course.modules;
    const skills = Array.isArray(course.skills) && course.skills.length ? course.skills : ['Foundations','Core Concepts','Practical Skills','Career Project'];
    return [
      { title:`${skills[0] || 'Course'} Foundations`, duration:'8h', lessons:[{title:'Orientation and career roadmap',duration:'30 min',preview:true},{title:`Introduction to ${skills[0] || course.title}`,duration:'55 min',preview:true},{title:'Guided practice lab',duration:'70 min'}] },
      { title:`Core ${skills[1] || 'Technology'} Skills`, duration:'14h', lessons:[{title:`Working with ${skills[1] || 'core tools'}`,duration:'65 min'},{title:'Instructor-led lab',duration:'80 min'},{title:'Applied exercises',duration:'72 min'}] },
      { title:`Applied ${skills[2] || 'Project'} Work`, duration:'16h', lessons:[{title:'Real-world workflow',duration:'60 min'},{title:'Project sprint',duration:'95 min'},{title:'Review and improvement',duration:'45 min'}] },
      { title:'Capstone & Career Preparation', duration:'10h', lessons:[{title:'Capstone planning',duration:'40 min'},{title:'Portfolio and interview readiness',duration:'55 min'},{title:'Final presentation',duration:'60 min'}] }
    ];
  }

  function courseFaqs(course) {
    const d = courseDelivery(course);
    return [
      { q:`Which learning modes are available for ${course.title}?`, a:`The course page supports the modes currently enabled for this course: ${[d.live?'Live Streamed':'',d.recorded?'Recorded':'',d.classroom?'Offline Classroom':''].filter(Boolean).join(', ')}. Availability can be controlled per course when you connect delivery-mode fields to the backend.` },
      { q:'What is Live Streamed learning?', a:'Live Streamed courses are instructor-led online classes delivered on a fixed batch schedule. Learners attend remotely in real time.' },
      { q:'What is the Recorded option?', a:'Recorded courses are available through the private learner area for flexible, self-paced study with lessons, resources, projects, progress and certificates.' },
      { q:'What is Offline Classroom learning?', a:'Offline Classroom courses are instructor-led in-person batches at Full Stack Academy branches in Hyderabad, subject to the branch schedule and seat availability.' },
      { q:'Are projects included?', a:`Yes. The course page highlights ${Number(course.projects || 1)} practical project${Number(course.projects || 1) === 1 ? '' : 's'} plus guided exercises.` },
      { q:'How do upcoming batches work?', a:'Live Streamed and Offline Classroom options use scheduled batches. Recorded courses are shown as Start Anytime because they do not depend on a fixed class schedule.' },
      { q:'Do I receive a certificate?', a:'The learner area supports a completion-certificate workflow. Your backend can define attendance, assessment and completion requirements before the certificate is unlocked.' }
    ];
  }

  function courseReviews(course, limit=12) {
    // Course pages intentionally reuse the same published backend written reviews
    // shown on the homepage. Per-course embedded review JSON is not rendered publicly.
    const pool = globalWrittenReviews();
    return (limit>0 ? pool.slice(0,limit) : pool);
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
        '/instructors':'Instructors',
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
      <div class="course-card-body">${String(course.category||'').trim()?`<span class="course-category">${escapeHtml(course.category)}</span>`:''}<h3><a href="#/course/${encodeURIComponent(course.slug)}">${escapeHtml(course.title)}</a></h3>${String(course.short||'').trim()?`<p class="course-card-description">${textHtml(course.short)}</p>`:''}${meta.length?`<div class="course-meta">${meta.join('')}</div>`:''}<div class="course-card-footer"><span class="course-price"><strong>${money(course.price)}</strong>${hasOriginal?`<del>${money(course.originalPrice)}</del>`:''}</span><span class="course-actions-inline"><a class="button button-secondary button-sm" href="#/course/${encodeURIComponent(course.slug)}" aria-label="View ${escapeHtml(course.title)}">${icon('eye')}</a><button class="button button-primary button-sm" data-action="add-cart" data-id="${course.id}">Add</button></span></div></div>
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

  function academyEvents() {
    return Array.isArray(D.events) ? D.events : [];
  }

  function eventDateSortValue(event) {
    const value = eventDateValue(event);
    return value ? value.getTime() : 0;
  }

  function academyEventsLatestFirst() {
    return [...academyEvents()].sort((a,b) => {
      const dateDiff = eventDateSortValue(b) - eventDateSortValue(a);
      if (dateDiff) return dateDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }

  async function refreshEventsData() {
    const result = await apiRequest('public_events');
    if (Array.isArray(result.events)) D.events = result.events;
    return academyEvents();
  }

  async function refreshSingleEventData(slug) {
    const result = await apiRequest('public_event', { params:{ slug } });
    if (result.event) {
      const others = academyEvents().filter(item => item.slug !== result.event.slug);
      D.events = [result.event, ...others];
    }
    return result.event || null;
  }

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

  function eventFilterDropdown({filter,label,iconName,value,allLabel,options}) {
    const selected = value && value !== 'all' ? value : 'all';
    const selectedLabel = selected === 'all' ? allLabel : selected;
    const rows = [{value:'all',label:allLabel}, ...options.map(item=>({value:String(item),label:String(item)}))];
    return `<div class="fsa-event-smart-select" data-event-filter-dropdown>
      <button class="fsa-event-smart-trigger" type="button" data-action="event-filter-toggle" aria-haspopup="listbox" aria-expanded="false">
        <span class="fsa-event-filter-icon">${icon(iconName)}</span>
        <span class="fsa-event-field-copy"><small>${escapeHtml(label)}</small><strong>${escapeHtml(selectedLabel)}</strong></span>
        <span class="fsa-event-filter-chevron">${icon('chevronDown')}</span>
      </button>
      <div class="fsa-event-smart-menu" role="listbox" aria-label="${escapeHtml(label)}">
        ${rows.map(item=>`<button type="button" role="option" aria-selected="${item.value===selected?'true':'false'}" class="${item.value===selected?'active':''}" data-action="event-filter-option" data-filter="${escapeHtml(filter)}" data-value="${escapeHtml(item.value)}"><span>${escapeHtml(item.label)}</span>${item.value===selected?icon('check'):''}</button>`).join('')}
      </div>
    </div>`;
  }

  function eventIsFeatured(event) {
    const value = event?.featured;
    return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
  }

  function eventIdentity(event) {
    if (!event) return '';
    return event.id ? `id:${event.id}` : `slug:${String(event.slug || '').trim()}`;
  }

  function selectTopEvent(events) {
    const featuredEvents = events.filter(eventIsFeatured);
    return featuredEvents[0] || events[0] || null;
  }

  function renderEvents(query = '') {
    setChrome('public');
    const events = academyEventsLatestFirst();
    const featured = selectTopEvent(events);
    if (!featured) return renderNotFound();
    const featuredWasSelected = eventIsFeatured(featured);
    const featuredIdentity = eventIdentity(featured);
    const params = new URLSearchParams(query);
    params.delete('month');
    const q = String(params.get('q') || '').trim().toLowerCase();
    const category = params.get('category') || 'all';
    const location = params.get('location') || 'all';
    const year = params.get('year') || 'all';
    const categories = [...new Set(events.map(event=>event.category).filter(Boolean))].sort();
    const locations = [...new Set(events.map(event=>event.location).filter(Boolean))].sort();
    const years = [...new Set(events.map(event=>eventDateValue(event)?.getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
    // The event shown in the hero/featured position must never be repeated in the archive below.
    // If one or more events are marked featured, the newest featured event wins; otherwise the newest event wins.
    const filtered = events.filter(event => {
      if (eventIdentity(event) === featuredIdentity) return false;
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
          <div class="fsa-events-hero-actions"><button class="button button-primary" type="button" data-action="scroll-events">Explore Events ${icon('arrow')}</button></div>
          <div class="fsa-events-hero-points"><span>${icon('building')} Hyderabad branches</span><span>${icon('users')} Industry experts</span><span>${icon('award')} Student achievements</span></div>
        </div>
        <a class="fsa-event-featured reveal reveal-scale" href="#/event/${encodeURIComponent(featured.slug)}">
          ${imageMarkup(featured.image,featured.title,'FSA')}
          <div class="fsa-event-featured-copy"><span>${icon('sparkles')} ${featuredWasSelected ? 'Featured Event' : 'Latest Event'}</span><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.location || '')}${featured.time ? ` · ${escapeHtml(featured.time)}` : ''}</p></div>
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
          ${eventFilterDropdown({filter:'category',label:'Event type',iconName:'briefcase',value:category,allLabel:'All event types',options:categories})}
          ${eventFilterDropdown({filter:'location',label:'Location',iconName:'map',value:location,allLabel:'All locations',options:locations})}
          ${eventFilterDropdown({filter:'year',label:'Year',iconName:'calendar',value:year,allLabel:'All years',options:years})}
        </div>
        <div class="fsa-event-filter-foot">
          <div class="fsa-event-active-filters">${filterSummary.length ? filterSummary.map(item=>`<span>${item}</span>`).join('') : '<span class="is-muted">Showing the complete event archive</span>'}</div>
          ${activeFilters ? `<button class="fsa-event-clear" type="button" data-action="event-clear-filters">${icon('x')} Clear filters</button>` : ''}
        </div>
      </div>
      ${pageEvents.length ? `<div class="fsa-events-grid">${pageEvents.map(eventCard).join('')}</div>${pagination}` : `<div class="fsa-events-empty">${icon('calendar')}<h3>No events match these filters.</h3><p>Try another event type, location, year or keyword.</p><button class="button button-primary" data-action="event-clear-filters">Show all events</button></div>`}
    </div></section>
    <section class="fsa-events-cta"><div class="container"><div class="fsa-events-cta-panel reveal"><div><span class="eyebrow">Join The Community</span><h2>Want to attend the next FSA event?</h2><p>Speak with our team about future workshops, branch events, boot camps and expert sessions.</p></div><div class="fsa-events-cta-actions"><button class="button button-secondary" type="button" data-action="open-call-popup">Get A Call</button><a class="button button-ghost-light" href="#/contact">Contact Us</a></div></div></div></section>`;
  }

  function eventMediaSlides(event) {
    const media = Array.isArray(event.media) && event.media.length ? event.media : [{type:'image',src:event.image,caption:event.title}];
    return { media, slides:media.map((item,index)=>`<figure class="fsa-event-media-slide ${index===0?'active':''}" data-event-media-slide="${index}">${item.type==='video'?`<video controls playsinline preload="metadata" poster="${escapeHtml(item.poster || event.image)}"><source src="${escapeHtml(item.src)}" type="video/mp4">Your browser does not support embedded video.</video>`:`${imageMarkup(item.src,item.caption || event.title,'FSA')}`}<figcaption><span>${item.type==='video'?icon('video'):icon('camera')}</span>${escapeHtml(item.caption || (item.type==='video'?'Event video':'Event gallery'))}</figcaption></figure>`).join(''), thumbs:media.map((item,index)=>`<button class="fsa-event-media-thumb ${index===0?'active':''}" type="button" data-action="event-media-thumb" data-index="${index}" aria-label="Open media ${index+1}">${item.type==='video'?`<span class="fsa-event-thumb-video">${icon('play','',true)}</span><img src="${escapeHtml(item.poster || event.image)}" alt="">`:`<img src="${escapeHtml(item.src)}" alt="">`}</button>`).join('') };
  }

  function eventSponsorSection(event) {
    const sponsors = (Array.isArray(event.sponsors) ? event.sponsors : []).filter(item=>item&&item.logo);
    if (!sponsors.length) return '';
    const logos=sponsors.map((item,index)=>`<div class="fsa-event-sponsor-logo" aria-label="Sponsor ${index+1}"><img src="${escapeHtml(item.logo)}" alt="Event sponsor logo" loading="lazy"></div>`).join('');
    return `<div class="fsa-event-sponsor-marquee" aria-label="Event sponsors and partners"><div class="fsa-event-sponsor-track">${logos}${logos}</div></div>`;
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

  function eventCalendarDates(event) {
    const startDate = event?.date ? new Date(`${event.date}T09:00:00`) : new Date();
    const endDate = event?.endDate ? new Date(`${event.endDate}T18:00:00`) : new Date(startDate.getTime() + 60 * 60 * 1000);
    const raw=String(event?.time || '').trim();
    const times=[...raw.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/gi)].map(match=>({h:Number(match[1]),m:Number(match[2]||0),ampm:String(match[3]||'').toUpperCase()}));
    const apply=(date,t)=>{let h=t.h;if(t.ampm==='PM'&&h<12)h+=12;if(t.ampm==='AM'&&h===12)h=0;date.setHours(h,t.m,0,0);};
    if(times[0]) apply(startDate,times[0]);
    if(times[1]) apply(endDate,times[1]);
    else if(!event?.endDate) endDate.setTime(startDate.getTime()+60*60*1000);
    if(endDate<=startDate) endDate.setTime(startDate.getTime()+60*60*1000);
    return {start:startDate,end:endDate};
  }

  function calendarStamp(date) {
    const pad=n=>String(n).padStart(2,'0');
    return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  }

  function calendarDescription(event) {
    const parts=[event.description || '', event.registrationUrl ? `Register: ${event.registrationUrl}` : ''].filter(Boolean);
    return parts.join('\n\n');
  }

  function eventGoogleCalendarUrl(event) {
    const {start,end}=eventCalendarDates(event);
    const params=new URLSearchParams({action:'TEMPLATE',text:event.title || 'Full Stack Academy Event',dates:`${calendarStamp(start)}/${calendarStamp(end)}`,details:calendarDescription(event),location:event.address || event.location || 'Full Stack Academy Hyderabad'});
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function eventOutlookCalendarUrl(event) {
    const {start,end}=eventCalendarDates(event);
    const params=new URLSearchParams({path:'/calendar/action/compose',rru:'addevent',subject:event.title || 'Full Stack Academy Event',startdt:start.toISOString(),enddt:end.toISOString(),body:calendarDescription(event),location:event.address || event.location || 'Full Stack Academy Hyderabad'});
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  function downloadEventCalendar(event) {
    const {start,end}=eventCalendarDates(event);
    const safe=value=>String(value||'').replace(/\\/g,'\\\\').replace(/([,;])/g,'\\$1').replace(/\r?\n/g,'\\n');
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN','METHOD:PUBLISH','PRODID:-//Full Stack Academy//Events//EN','BEGIN:VEVENT',`UID:${safe(event.slug || Date.now())}@fullstackacademy.in`,`DTSTAMP:${calendarStamp(new Date())}`,`DTSTART:${calendarStamp(start)}`,`DTEND:${calendarStamp(end)}`,`SUMMARY:${safe(event.title)}`,`LOCATION:${safe(event.address || event.location)}`,`DESCRIPTION:${safe(calendarDescription(event))}`,event.registrationUrl?`URL:${safe(event.registrationUrl)}`:'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`${event.slug || 'fsa-event'}.ics`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800);
  }

  function renderEventDetail(slug) {
    setChrome('public');
    const events = academyEventsLatestFirst();
    const event = events.find(item => item.slug === slug);
    if (!event) return renderNotFound();
    const date=eventDateParts(event), media=eventMediaSlides(event), organiser=event.organiser || {};
    const index = events.findIndex(item => item.slug === event.slug);
    const related = events.filter(item=>item.slug!==event.slug && (item.category===event.category || item.location===event.location)).slice(0,3);
    const previous = index > 0 ? events[index-1] : null;
    const next = index >= 0 && index < events.length-1 ? events[index+1] : null;
    const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.location || 'Full Stack Academy Hyderabad')}`;
    app.innerHTML = `${pageHero({eyebrow:`${escapeHtml(event.category || 'Academy Event')} · ${escapeHtml(eventStatus(event))}`,title:escapeHtml(event.title),text:escapeHtml(event.description || ''),image:event.image,imageAlt:event.title})}
    <section class="fsa-event-page-body"><div class="container fsa-event-page-layout">
      <main class="fsa-event-main">
        <section class="fsa-event-media-card" data-event-media-root data-current="0"><div class="fsa-event-media-stage">${media.slides}<div class="fsa-event-media-controls"><button type="button" data-action="event-media-prev" aria-label="Previous media">${icon('arrowLeft')}</button><span><b>Gallery</b> · images & video</span><button type="button" data-action="event-media-next" aria-label="Next media">${icon('arrow')}</button></div></div><div class="fsa-event-media-thumbs">${media.thumbs}</div></section>
        <section class="fsa-event-content-card"><span class="eyebrow">About This Event</span><h2>${escapeHtml(event.title)}</h2><p>${escapeHtml(event.description || '')}</p>${Array.isArray(event.highlights)&&event.highlights.length?`<div class="fsa-event-highlights">${event.highlights.map(item=>`<article>${icon(item.icon||'sparkles')}<div><strong>${escapeHtml(item.title||'Event highlight')}</strong><p>${escapeHtml(item.description||'')}</p></div></article>`).join('')}</div>`:''}</section>
        ${Array.isArray(event.agenda)&&event.agenda.length?`<section class="fsa-event-content-card"><div class="fsa-event-section-head"><div><span class="eyebrow">Event Flow</span><h2>What the experience includes</h2></div></div><div class="fsa-event-agenda">${event.agenda.map((item,index)=>`<article><time>${String(index+1).padStart(2,'0')}</time><div><strong>${escapeHtml(item.title||`Session ${index+1}`)}</strong><p>${escapeHtml(item.description||'')}</p></div></article>`).join('')}</div></section>`:''}
        <section class="fsa-event-content-card"><span class="eyebrow">Organised By</span><h2>Meet the event organiser</h2><article class="fsa-event-organiser"><div class="fsa-event-organiser-mark">FSA</div><div><h3>${escapeHtml(organiser.name || 'Full Stack Academy')}</h3><span>${escapeHtml(organiser.role || 'Event Organiser')}</span><p>${escapeHtml(organiser.description || '')}</p><div class="fsa-event-organiser-links"><a href="mailto:${escapeHtml(organiser.email || 'info@fullstackacademy.in')}">${icon('mail')} ${escapeHtml(organiser.email || 'info@fullstackacademy.in')}</a><a href="tel:${String(organiser.phone || '+919015236236').replace(/[^+\d]/g,'')}">${icon('phone')} ${escapeHtml(organiser.phone || '+91 9015 236 236')}</a></div></div></article></section>
        ${Array.isArray(event.sponsors)&&event.sponsors.length?`<section class="fsa-event-content-card"><div class="fsa-event-section-head"><div><span class="eyebrow">Sponsors & Partners</span><h2>Event partners</h2></div></div>${eventSponsorSection(event)}</section>`:''}
        ${related.length?`<section class="fsa-event-related"><div class="fsa-event-section-head"><div><span class="eyebrow">More Events</span><h2>You may also like</h2></div><a href="#/events">View all events ${icon('arrow')}</a></div><div class="fsa-events-grid">${related.map(eventCard).join('')}</div></section>`:''}
      </main>
      <aside class="fsa-event-sidebar"><div class="fsa-event-booking-card"><span class="eyebrow">Event Details</span><div class="fsa-event-booking-meta"><article><span>${icon('calendar')}</span><div><small>Date</small><strong>${escapeHtml(date.full)}</strong></div></article><article><span>${icon('clock')}</span><div><small>Time</small><strong>${escapeHtml(event.time || 'See event schedule')}</strong></div></article><article><span>${icon('map')}</span><div><small>Location</small><strong>${escapeHtml(event.location || 'Full Stack Academy')}</strong></div></article><article><span>${icon('briefcase')}</span><div><small>Type</small><strong>${escapeHtml(event.category || 'Academy Event')}</strong></div></article></div><div class="fsa-event-sidebar-actions">${event.registrationUrl?`<a class="button button-primary" href="${escapeHtml(event.registrationUrl)}" target="_blank" rel="noopener">Register / Enquire</a>`:`<button class="button button-primary" type="button" data-action="open-call-popup">Book / Enquire</button>`}<div class="fsa-add-calendar" data-add-calendar><button class="button button-secondary fsa-add-calendar-trigger" type="button" data-action="event-calendar-toggle" data-slug="${escapeHtml(event.slug)}" aria-expanded="false">${icon('calendar')} Add to Calendar ${icon('chevronDown')}</button><div class="fsa-add-calendar-menu"><a href="${escapeHtml(eventGoogleCalendarUrl(event))}" target="_blank" rel="noopener">${icon('calendar')}<span><strong>Google Calendar</strong><small>Open and save online</small></span></a><a href="${escapeHtml(eventOutlookCalendarUrl(event))}" target="_blank" rel="noopener">${icon('mail')}<span><strong>Outlook Calendar</strong><small>Open in Outlook web</small></span></a><button type="button" data-action="event-add-calendar" data-slug="${escapeHtml(event.slug)}">${icon('download')}<span><strong>Apple / Other</strong><small>Download .ics calendar file</small></span></button></div></div><a class="button button-secondary" href="${mapsUrl}" target="_blank" rel="noopener">${icon('map')} View Location</a></div><div class="fsa-event-share"><span>Event tags</span><div>${(event.tags||[]).map(tag=>`<b>${escapeHtml(tag)}</b>`).join('')}</div></div></div></aside>
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
    const localImage = branch.image || HOME_BRANCH_IMAGES[branch.id];
    const copy = branch.description || HOME_BRANCH_COPY[branch.id] || 'Learn with Full Stack Academy in Hyderabad.';
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
      <p>${escapeHtml(item.comment||item.text||'')}</p>
      <div class="fsa-home-testimonial-user">${avatar}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.course||item.role||'Full Stack Academy')}</small></span></div>
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
    if (state.currentPath === '/') {
      initHeroImageSlider();
      initScrollableHomeCarousel('[data-home-placement-carousel]');
      initScrollableHomeCarousel('[data-home-testimonial-carousel]', { auto:true, interval:5000 });
    }
    // The same backend-driven Video Reviews / Written Reviews component is reused
    // on Home, Courses and single Course pages, so its tabs must initialise everywhere.
    initHomeReviewTabs();
  }

  function reviewVideoPlayer(review) {
    const raw=String(review.videoUrl||'').trim();
    if(!raw)return '';
    let embed='';
    const yt=raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    if(yt)embed=`https://www.youtube.com/embed/${yt[1]}`;
    const vm=raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if(!embed&&vm)embed=`https://player.vimeo.com/video/${vm[1]}`;
    if(embed)return `<iframe src="${escapeHtml(embed)}" title="${escapeHtml(review.name)} video review" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    return `<video controls playsinline preload="metadata" ${review.thumbnail?`poster="${escapeHtml(review.thumbnail)}"`:''}><source src="${escapeHtml(raw)}"></video>`;
  }
  function homeReviewExperienceSection(){
    const written=globalWrittenReviews(12),videos=globalVideoReviews(12);
    if(!written.length&&!videos.length)return '';
    const videoCards=videos.map((r,i)=>`<article class="fsa-review-phone-card" data-review-card>
      <div class="fsa-review-phone-shell">
        <div class="fsa-review-phone-notch"></div>
        <div class="fsa-review-phone-media">${reviewVideoPlayer(r)}</div>
        <div class="fsa-review-phone-overlay"><span>${r.featured?'FEATURED REVIEW':'VIDEO REVIEW'}</span><strong>${String(i+1).padStart(2,'0')}</strong></div>
      </div>
      <div class="fsa-review-card-meta"><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.course||r.role||'FSA Learner')}</small></div>
    </article>`).join('');
    const writtenCards=written.map((r,i)=>`<article class="fsa-review-written-card" data-review-card>
      <div class="fsa-review-written-top">${r.avatar?`<span class="fsa-review-avatar">${imageMarkup(r.avatar,r.name,initials(r.name))}</span>`:`<span class="fsa-review-avatar fsa-initial-avatar">${escapeHtml(initials(r.name))}</span>`}<div><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.course||r.role||'FSA Learner')}</small></div><span class="fsa-review-stars">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating||5))))}</span></div>
      <p>${escapeHtml(r.text||'')}</p>
      ${r.featured?'<span class="fsa-review-featured-chip">Featured</span>':''}
    </article>`).join('');
    return `<section class="fsa-home-section fsa-review-experience-section" data-review-experience><div class="container">
      <div class="fsa-review-experience-head">
        <div class="fsa-home-heading fsa-home-heading-left"><span>Student Reviews</span><h2>Hear It From Our <em>Learners</em></h2><p>Watch learner video stories first, or switch to written feedback from Full Stack Academy students and alumni.</p></div>
        <div class="fsa-review-tabs" role="tablist" aria-label="Review type">
          <button type="button" class="active" data-review-tab="video" role="tab" aria-selected="true">${icon('play')} Video Reviews</button>
          <button type="button" data-review-tab="written" role="tab" aria-selected="false">${icon('star')} Written Reviews</button>
        </div>
      </div>
      <div class="fsa-review-tab-panel active" data-review-panel="video">
        <div class="fsa-review-slider-actions"><button type="button" data-review-prev aria-label="Previous video reviews">${icon('arrowLeft')}</button><button type="button" data-review-next aria-label="Next video reviews">${icon('arrow')}</button></div>
        <div class="fsa-review-scroll-track" data-review-track>${videoCards||'<p class="fsa-review-empty">No published video reviews yet.</p>'}</div>
      </div>
      <div class="fsa-review-tab-panel" data-review-panel="written" hidden>
        <div class="fsa-review-slider-actions"><button type="button" data-review-prev aria-label="Previous written reviews">${icon('arrowLeft')}</button><button type="button" data-review-next aria-label="Next written reviews">${icon('arrow')}</button></div>
        <div class="fsa-review-written-grid fsa-review-scroll-track" data-review-track>${writtenCards||'<p class="fsa-review-empty">No published written reviews yet.</p>'}</div>
      </div>
    </div></section>`;
  }

  function initHomeReviewTabs(){
    const scope=document.querySelector('[data-review-experience]');
    if(!scope)return;
    const tabs=[...scope.querySelectorAll('[data-review-tab]')];
    const panels=[...scope.querySelectorAll('[data-review-panel]')];
    const activate=(type)=>{tabs.forEach(btn=>{const on=btn.dataset.reviewTab===type;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',on?'true':'false');});panels.forEach(panel=>{const on=panel.dataset.reviewPanel===type;panel.classList.toggle('active',on);panel.hidden=!on;});};
    tabs.forEach(btn=>btn.addEventListener('click',()=>activate(btn.dataset.reviewTab)));
    scope.querySelectorAll('[data-review-prev],[data-review-next]').forEach(btn=>btn.addEventListener('click',()=>{const panel=btn.closest('[data-review-panel]');const track=panel?.querySelector('[data-review-track]');if(!track)return;const card=track.querySelector('[data-review-card]');const step=(card?.getBoundingClientRect().width||280)+18;track.scrollBy({left:btn.hasAttribute('data-review-prev')?-step:step,behavior:'smooth'});}));
    const hasVideo=!!scope.querySelector('[data-review-panel="video"] [data-review-card]');
    activate(hasVideo?'video':'written');
  }

  function renderHome() {
    setChrome('public');
    const studentPortraits = [
      'assets/images/fsa-home/student-1.png',
      'assets/images/fsa-home/student-2.png',
      'assets/images/fsa-home/student-3.png',
      'assets/images/fsa-home/student-4.png',
      'assets/images/fsa-home/student-5.png',
      'assets/images/fsa-home/student-6.png'
    ];
    const placements = (Array.isArray(D.alumni) ? D.alumni : []).map(student => ({ name:student.name, role:student.role, company:student.company, image:student.image }));
    const placementPages = Array.from({ length: Math.ceil(placements.length / 10) }, (_,i) => placements.slice(i * 10, (i + 1) * 10));
    const hiringCompanies = (Array.isArray(D.companies) ? D.companies : []).filter(company=>company && company.name);
    const companyRows = hiringCompanies.length ? [0,3,6,9].map(offset => hiringCompanies.map((_,i) => hiringCompanies[(i + offset) % hiringCompanies.length])) : [];
    const onlineCourses = (Array.isArray(D.courses) ? D.courses : []).slice(0,8);
    const heroSlides = [
      { image:'assets/images/fsa-home/slider-offer.webp', alt:'Full Stack Academy Independence Day course offer', href:'#/courses' },
      { image:'assets/images/fsa-home/slider-bba-wide.webp', alt:'Full Stack Academy Osmania University affiliated BBA program', href:'#/super40-bba' }
    ];
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
              <a class="button button-primary fsa-slider-details" data-hero-details href="${heroSlides[0].href}">See Details ${icon('arrow')}</a>
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
            <div class="fsa-home-heading"><span>${D.branches.length} Hyderabad Centre${D.branches.length===1?'':'s'}</span><h2>Visit Our <em>Branches</em></h2><p>${D.branches.length} branch${D.branches.length===1?'':'es'}, one learning community. Choose the centre closest to you for classroom training, mentoring and career support.</p></div>
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
              ${companyRows.map((row,rowIndex)=>`<div class="fsa-company-marquee-row ${rowIndex % 2 ? 'is-reverse' : ''}"><div class="fsa-company-marquee-track"><div class="fsa-company-marquee-group">${row.map(x=>`<a class="fsa-company-logo" href="#/companies"><span class="fsa-company-logo-mark">${x.logo?`<img src="${escapeHtml(x.logo)}" alt="${escapeHtml(x.name)} logo" loading="lazy" onerror="this.style.display='none'">`:`<b>${escapeHtml((x.name||'FS').slice(0,2).toUpperCase())}</b>`}</span><span class="fsa-company-logo-name">${escapeHtml(x.name)}</span></a>`).join('')}</div><div class="fsa-company-marquee-group" aria-hidden="true">${row.map(x=>`<div class="fsa-company-logo"><span class="fsa-company-logo-mark">${x.logo?`<img src="${escapeHtml(x.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}</span><span class="fsa-company-logo-name">${escapeHtml(x.name)}</span></div>`).join('')}</div></div></div>`).join('')}
            </div>
          </div>
        </section>

        ${homeReviewExperienceSection()}

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

  function catalogCourseCard(course, index=0) {
    const delivery=courseDelivery(course);
    const hasOriginal=Number(course.originalPrice||0)>Number(course.price||0)&&Number(course.originalPrice||0)>0;
    const modeSummary=[delivery.live?'Live Streamed':'',delivery.recorded?'Recorded':'',delivery.classroom?'Offline Classroom':''].filter(Boolean).join(' · ');
    return `<article class="fsa-catalog-course reveal reveal-delay-${Math.min(index%4,3)}" data-mode="${delivery.live?'live ':''}${delivery.recorded?'recorded ':''}${delivery.classroom?'classroom':''}" data-title="${escapeHtml(`${course.title} ${course.category} ${(course.skills||[]).join(' ')}`.toLowerCase())}"><a class="fsa-catalog-media" href="#/course/${encodeURIComponent(course.slug)}">${imageMarkup(course.image,`${course.title} course`,initials(course.title))}<span class="fsa-catalog-certified">${escapeHtml(course.badge||'Certified')}</span><span class="fsa-catalog-media-arrow">${icon('arrow')}</span></a><div class="fsa-catalog-body"><div class="fsa-catalog-mode-row">${deliveryPills(delivery)}</div><h3><a href="#/course/${encodeURIComponent(course.slug)}">${escapeHtml(course.title)}</a></h3><p>${textHtml(course.short||course.description||'Industry-focused technology training with practical projects and mentor support.')}</p><div class="fsa-catalog-meta"><span>${icon('clock')} ${escapeHtml(course.duration||'Flexible')}</span><span>${icon('project')} ${Number(course.projects||1)} project${Number(course.projects||1)===1?'':'s'}</span><span>${icon('star','',true)} ${escapeHtml(course.rating||'4.7')}/5</span></div><div class="fsa-catalog-location">${icon(delivery.classroom?'map':delivery.live?'radio':'video')}<span><strong>${escapeHtml(modeSummary)}</strong><small>${delivery.classroom?`Branches: ${escapeHtml(delivery.branches.join(' · ')||'See current branch availability')}`:'Flexible learning access available'}</small></span></div><div class="fsa-catalog-footer"><span class="fsa-catalog-price"><strong>${money(course.price)}</strong>${hasOriginal?`<del>${money(course.originalPrice)}</del>`:''}</span><a class="button button-outline button-sm" href="#/course/${encodeURIComponent(course.slug)}">View Course ${icon('arrow')}</a></div></div></article>`;
  }

  function filteredCatalogCourses() {
    const query=String(state.courseFilters.query||'').trim().toLowerCase();
    return catalogCourses().filter(course=>{
      const d=courseDelivery(course);
      const modeOk=state.courseMode==='all'||(state.courseMode==='live'&&d.live)||(state.courseMode==='recorded'&&d.recorded)||(state.courseMode==='classroom'&&d.classroom);
      const haystack=`${course.title} ${course.category} ${course.short||''} ${(course.skills||[]).join(' ')}`.toLowerCase();
      return modeOk && (!query || haystack.includes(query));
    });
  }

  function updateCoursesResults() {
    const list=filteredCatalogCourses();
    const grid=document.getElementById('fsaCourseCatalogGrid');
    const count=document.getElementById('courseResultCount');
    if(!grid||!count)return;
    count.textContent=`${list.length} current course${list.length===1?'':'s'}`;
    grid.innerHTML=list.length?list.map((course,index)=>catalogCourseCard(course,index)).join(''):`<div class="fsa-catalog-empty"><span>${icon('search')}</span><h3>No course found</h3><p>Try another keyword or learning mode.</p><button class="button button-primary" data-action="course-mode" data-mode="all">Show all courses</button></div>`;
    initReveal();
  }

  function batchCard(row,index=0) {
    const modeClass=row.mode==='Offline Classroom'?'classroom':row.mode==='Recorded'?'recorded':'live';
    const date=row.start==='Start Anytime'?['START','ANYTIME']:row.start.split(' ');
    const hasSeatCount=row.seats!==null&&row.seats!==undefined;
    const seatText=hasSeatCount?`${row.seats} seats open`:'Flexible access';
    const placeIcon=row.mode==='Offline Classroom'?'map':row.mode==='Live Streamed'?'radio':'video';
    return `<article class="fsa-batch-card reveal reveal-delay-${Math.min(index%4,3)}"><div class="fsa-batch-top"><span class="fsa-batch-date"><strong>${escapeHtml(date[0])}</strong><small>${escapeHtml(date[1]||'')}</small></span><span class="mode-pill ${modeClass}">${escapeHtml(row.mode)}</span></div><h3>${escapeHtml(row.course)}</h3><div class="fsa-batch-details"><span>${icon('clock')}<b>${escapeHtml(row.time)}</b></span><span>${icon(placeIcon)}<b>${escapeHtml(row.branch)}</b></span><span>${icon(hasSeatCount?'users':'check')}<b>${seatText}</b></span></div><a class="fsa-batch-link" href="#/course/${encodeURIComponent(row.slug)}">View course ${icon('arrow')}</a></article>`;
  }

  function batchSearchField(compact=false) {
    return `<label class="fsa-batch-search-field ${compact?'compact':''}"><span class="fsa-batch-dropdown-icon">${icon('search')}</span><span class="fsa-batch-dropdown-copy"><small>Course</small><strong>Search course or technology</strong></span><input data-batch-search-input type="search" value="${escapeHtml(state.batchQuery||'')}" placeholder="Search batches..." aria-label="Search batches"></label>`;
  }

  function batchFilterSelect(type,value,compact=false) {
    const backendBranches=(Array.isArray(D.branches)?D.branches:[]).map(branch=>[String(branch.slug||branch.id||'').toLowerCase(),branch.shortName||String(branch.name||'').replace(/^FSA\s*[—-]\s*/,'')||branch.location||branch.slug]).filter(item=>item[0]);
    const filters={
      shift:{label:'Time',hint:'Choose schedule',iconName:'clock',options:[['all','All Times'],['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['anytime','Start Anytime']]},
      mode:{label:'Mode',hint:'Choose learning mode',iconName:'layers',options:[['all','All Modes'],['live-streamed','Live Streamed'],['recorded','Recorded'],['offline-classroom','Offline Classroom']]},
      branch:{label:'Branch',hint:'Choose location',iconName:'map',options:[['all','All Locations'],['online','Online'],...backendBranches]}
    };
    const filter=filters[type];
    return `<label class="fsa-batch-dropdown ${compact?'compact':''}"><span class="fsa-batch-dropdown-icon">${icon(filter.iconName)}</span><span class="fsa-batch-dropdown-copy"><small>${filter.label}</small><strong>${filter.hint}</strong></span><select data-batch-filter-select="${type}" aria-label="${filter.label} filter">${filter.options.map(([key,label])=>`<option value="${escapeHtml(key)}" ${key===value?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select></label>`;
  }

  function upgradeBatchDropdowns() {
    const full=document.querySelector('.fsa-batches-filter-stack');
    if(full){
      full.outerHTML=`<div class="fsa-batch-dropdown-grid">${batchSearchField()}${batchFilterSelect('shift',state.batchShift)}${batchFilterSelect('mode',state.batchMode)}${batchFilterSelect('branch',state.batchBranch)}</div>`;
      const note=document.querySelector('.fsa-batches-directory-head p');
      if(note)note.textContent='Use the three premium dropdowns to quickly narrow the complete schedule.';
    }
    const detail=document.querySelector('.fsa-batch-filters.detail');
    if(detail)detail.outerHTML=`<div class="fsa-batch-dropdown-grid detail course-detail-batch-filters">${batchFilterSelect('shift',state.batchShift,true)}${batchFilterSelect('mode',state.batchMode,true)}${batchFilterSelect('branch',state.batchBranch,true)}</div>`;
    window.FSA_UI?.enhanceSelects?.(app);
  }

  function updateBatchResults(course=null) {
    const wrap=document.getElementById('fsaBatchGrid');
    const count=document.getElementById('batchResultCount');
    if(!wrap)return;
    const q=String(state.batchQuery||'').trim().toLowerCase();
    const rows=batchRows(course).filter(row=>{
      const shiftOk=state.batchShift==='all'||row.shift.toLowerCase()===state.batchShift||(row.shift==='Anytime'&&state.batchShift==='anytime');
      const branchOk=state.batchBranch==='all'||String(row.branchSlug||row.branch||'').toLowerCase()===state.batchBranch;
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
    setChrome('public');
    const queryParams=new URLSearchParams(state.currentPath.split('?')[1]||'');
    if(queryParams.get('q'))state.courseFilters.query=queryParams.get('q');
    const requestedMode=queryParams.get('mode');
    if(['all','live','recorded','classroom'].includes(requestedMode))state.courseMode=requestedMode;
    const list=filteredCatalogCourses();
    const reviews=globalWrittenReviews();
    app.innerHTML=`<section class="fsa-courses-hero"><div class="container fsa-courses-hero-grid"><div class="fsa-courses-hero-copy reveal"><span class="eyebrow">Technology Courses</span><h1>Choose the learning format that <em>fits you.</em></h1><p>Full Stack Academy courses now use three clear delivery types across the website: Live Streamed, Recorded and Offline Classroom.</p><div class="fsa-course-hero-actions"><a class="button button-primary" href="#course-catalog">Explore Courses ${icon('arrow')}</a><a class="button button-secondary" href="#/batches">View All Batches</a></div><div class="fsa-course-hero-points"><span>${icon('radio')} Live Streamed</span><span>${icon('video')} Recorded</span><span>${icon('classroom')} Offline Classroom</span></div></div><div class="fsa-courses-hero-art reveal reveal-scale"><div class="fsa-courses-hero-main">${imageMarkup(D.academyImages?.learning||catalogCourses()[0]?.image,'Students learning technology at Full Stack Academy','FSA')}</div><div class="fsa-course-hero-badge"><span>${icon('layers')}</span><div><small>3 LEARNING FORMATS</small><strong>One catalogue. Clear delivery choices.</strong></div></div></div></div></section>
      <section class="fsa-mode-strip"><div class="container"><div class="fsa-mode-strip-head"><span class="eyebrow">Choose Your Learning Mode</span><p>Filter the catalogue by the way you want to learn.</p></div>${courseModePanel()}</div></section>
      <section class="fsa-courses-section" id="course-catalog"><div class="container"><div class="fsa-course-section-head"><div><span class="eyebrow">Current Admissions</span><h2>Our Industry-Leading <em>Courses</em></h2><p>Search the catalogue, then swipe or scroll the mode filter independently without moving the page.</p></div><div class="fsa-course-search-box">${icon('search')}<input id="courseSearchInput" type="search" value="${escapeHtml(state.courseFilters.query)}" placeholder="Search course, skill or technology..."></div></div><div class="fsa-course-filterbar"><div class="fsa-course-mode-tabs"><button class="${state.courseMode==='all'?'active':''}" data-action="course-mode" data-mode="all">All Courses</button><button class="${state.courseMode==='live'?'active':''}" data-action="course-mode" data-mode="live">Live Streamed</button><button class="${state.courseMode==='recorded'?'active':''}" data-action="course-mode" data-mode="recorded">Recorded</button><button class="${state.courseMode==='classroom'?'active':''}" data-action="course-mode" data-mode="classroom">Offline Classroom</button></div><span id="courseResultCount">${list.length} current courses</span></div><div class="fsa-course-catalog-grid" id="fsaCourseCatalogGrid">${list.map(catalogCourseCard).join('')}</div></div></section>
      <section class="fsa-batches-section" id="upcoming-batches"><div class="container"><div class="fsa-batches-title"><span class="eyebrow">Admissions Schedule</span><h2>Upcoming <em>Learning Options</em></h2><p>Live Streamed and Offline Classroom options follow scheduled batches. Recorded courses can start anytime.</p></div><div class="fsa-batch-dropdown-grid compact">${batchSearchField(true)}${batchFilterSelect('shift',state.batchShift,true)}${batchFilterSelect('mode',state.batchMode,true)}${batchFilterSelect('branch',state.batchBranch,true)}</div><div class="fsa-batch-grid" id="fsaBatchGrid">${batchRows().slice(0,12).map(batchCard).join('')}</div><div class="fsa-batch-bottom"><span class="fsa-batch-count" id="batchResultCount"></span><a class="button button-secondary button-sm" href="#/batches">Open Full Batches Page ${icon('arrow')}</a></div></div></section>
      ${homeReviewExperienceSection()}
      <section class="fsa-course-help-section"><div class="container"><div class="fsa-course-help-panel reveal"><div><span class="eyebrow light">Need Help Choosing?</span><h2>Tell us your goal and preferred learning mode.</h2><p>Our team can help you compare Live Streamed, Recorded and Offline Classroom options and select the right batch.</p></div><div class="fsa-course-help-actions"><button class="button button-light" data-action="open-call-popup">Get A Call</button><a class="button button-ghost-light" href="#/batches">See Batches</a></div></div></div></section>
      <section class="fsa-courses-faq-section"><div class="container fsa-faq-layout"><div><span class="eyebrow">Courses FAQ</span><h2>Questions before you <em>enroll.</em></h2><p>Understand the three delivery modes, batches, projects and certificates before choosing.</p><button class="button button-primary" data-action="open-call-popup">Talk To A Counselor</button></div>${faqMarkup(courseFaqs(catalogCourses()[0]).slice(0,7))}</div></section>`;
    requestAnimationFrame(()=>updateBatchResults());
  }

  function courseDetailReviewSection(course) {
    // Reuse the exact same backend-driven reviews component used on the homepage.
    // It includes both Video Reviews and Written Reviews tabs from Admin → Reviews.
    return homeReviewExperienceSection();
  }

  function renderCourseDetail(slug) {
    const baseCourse=courseBySlug(slug);
    if(!baseCourse)return renderNotFound();
    setChrome('public');
    const delivery=courseDelivery(baseCourse);
    const available=[];if(delivery.live)available.push('live');if(delivery.recorded)available.push('recorded');if(delivery.classroom)available.push('classroom');
    if(!available.includes(state.detailDeliveryMode)) state.detailDeliveryMode=available[0]||'classroom';
    const course=courseContentForMode(baseCourse,state.detailDeliveryMode);
    state.batchShift='all';state.batchBranch='all';state.batchMode=state.detailDeliveryMode==='live'?'live-streamed':state.detailDeliveryMode==='recorded'?'recorded':'offline-classroom';
    const modules=courseModules(course),faqs=courseFaqs(course),related=catalogCourses().filter(c=>c.id!==course.id).sort((a,b)=>Number(b.category===course.category)-Number(a.category===course.category)).slice(0,3),skills=Array.isArray(course.skills)?course.skills.slice(0,10):[],requirements=Array.isArray(course.requirements)?course.requirements.filter(Boolean):[],audience=Array.isArray(course.audience)?course.audience.filter(Boolean):[],projectItems=Array.isArray(course.projectItems)?course.projectItems.filter(item=>item&&(item.title||item.description)):[];
    const modeButtons=`${delivery.live?`<button class="${state.detailDeliveryMode==='live'?'active':''}" data-action="detail-mode" data-mode="live" aria-label="Live Streamed" title="Live Streamed">${icon('radio')}</button>`:''}${delivery.recorded?`<button class="${state.detailDeliveryMode==='recorded'?'active':''}" data-action="detail-mode" data-mode="recorded" aria-label="Recorded" title="Recorded">${icon('video')}</button>`:''}${delivery.classroom?`<button class="${state.detailDeliveryMode==='classroom'?'active':''}" data-action="detail-mode" data-mode="classroom" aria-label="Offline Classroom" title="Offline Classroom">${icon('classroom')}</button>`:''}`;
    const modeCopy=state.detailDeliveryMode==='live'?`<span>${icon('radio')}</span><div><strong>Live Streamed</strong><p>Join a scheduled instructor-led online batch in real time.</p></div>`:state.detailDeliveryMode==='recorded'?`<span>${icon('video')}</span><div><strong>Recorded</strong><p>Start flexibly and learn at your own pace inside the private learner area.</p></div>`:`<span>${icon('classroom')}</span><div><strong>Offline Classroom</strong><p>Choose a Hyderabad branch and attend an instructor-led in-person batch.</p></div>`;
    app.innerHTML=`<section class="fsa-course-detail-hero"><div class="container">${breadcrumbs([{label:'Home',href:'#/'},{label:'Courses',href:'#/courses'},{label:course.title}])}<div class="fsa-course-detail-grid"><div class="fsa-course-detail-copy reveal"><div class="fsa-catalog-mode-row">${deliveryPills(delivery)}</div><h1>${escapeHtml(course.title)}</h1><p>${textHtml(course.short||course.description||'Career-focused training with projects and mentor support.')}</p><div class="fsa-course-detail-stats"><span>${icon('clock')}<b>${escapeHtml(course.duration||'Flexible')}</b><small>Duration</small></span><span>${icon('project')}<b>${Number(course.projects||1)} Projects</b><small>Hands-on</small></span><span>${icon('star','',true)}<b>${escapeHtml(course.rating||'4.7')}/5</b><small>Learner rating</small></span><span>${icon('users')}<b>${Number(course.students||300).toLocaleString(siteSettings.locale||'en-IN')}+</b><small>Learners</small></span></div><div class="fsa-course-detail-actions"><a class="button button-primary" href="#course-batches">Check Batches ${icon('arrow')}</a><button class="button button-secondary" data-action="open-call-popup">Get A Call</button></div></div><div class="fsa-course-detail-visual reveal reveal-scale">${imageMarkup(course.image,course.title,initials(course.title))}<div class="fsa-course-detail-visual-badge"><span>${icon('award')}</span><div><small>FSA CERTIFICATE TRACK</small><strong>Project-based learning</strong></div></div></div></div></div></section>
      <section class="fsa-course-summary-band"><div class="container fsa-course-summary-grid"><article><span>${icon('radio')}</span><div><small>Live Streamed</small><strong>${delivery.live?'Scheduled online batches':'Not enabled'}</strong></div></article><article><span>${icon('video')}</span><div><small>Recorded</small><strong>${delivery.recorded?'Start anytime':'Not enabled'}</strong></div></article><article><span>${icon('classroom')}</span><div><small>Offline Classroom</small><strong>${delivery.classroom?`${D.branches.length} Hyderabad branch${D.branches.length===1?'':'es'}`:'Not enabled'}</strong></div></article><article><span>${icon('award')}</span><div><small>Completion</small><strong>Projects + certificate</strong></div></article></div></section>
      <section class="fsa-detail-main-section"><div class="container fsa-detail-main-layout"><div class="fsa-detail-content"><section class="fsa-detail-block"><span class="eyebrow">Course Overview</span><h2>Build practical <em>${escapeHtml(course.title)}</em> skills.</h2><p>${textHtml(course.description||course.short||'A structured course designed around practical learning, mentor guidance and project work.')}</p>${skills.length?`<div class="fsa-skill-grid">${skills.map(skill=>`<span>${icon('check')} ${escapeHtml(skill)}</span>`).join('')}</div>`:''}</section>${projectItems.length?`<section class="fsa-detail-block"><span class="eyebrow">Practical Projects</span><h2>Build work for the <em>${escapeHtml(deliveryModeLabel(course.selectedDeliveryMode))}</em> track.</h2><div class="value-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${projectItems.map((project,index)=>`<article class="value-card"><span class="value-icon">${icon(index===projectItems.length-1?'briefcase':'project')}</span>${project.title?`<h3>${escapeHtml(project.title)}</h3>`:''}${project.description?`<p>${textHtml(project.description)}</p>`:''}</article>`).join('')}</div></section>`:''}${requirements.length||audience.length?`<section class="fsa-detail-block"><span class="eyebrow">Before You Start</span><h2>Know what this <em>${escapeHtml(deliveryModeLabel(course.selectedDeliveryMode))}</em> version expects.</h2><div class="fsa-detail-private-grid">${requirements.length?`<div><h3>Requirements</h3><div class="fsa-skill-grid">${requirements.map(item=>`<span>${icon('check')} ${escapeHtml(item)}</span>`).join('')}</div></div>`:''}${audience.length?`<div><h3>Who this is for</h3><div class="fsa-skill-grid">${audience.map(item=>`<span>${icon('users')} ${escapeHtml(item)}</span>`).join('')}</div></div>`:''}</div></section>`:''}<section class="fsa-detail-block"><div class="fsa-detail-heading-inline"><div><span class="eyebrow">Curriculum</span><h2>What you will <em>learn.</em></h2></div><span>${modules.length} modules · ${Number(course.hours||60)}+ hours</span></div><div class="fsa-detail-curriculum">${modules.map((module,mi)=>`<article class="fsa-detail-module ${mi===0?'open':''}"><button data-action="toggle-module"><span><small>MODULE ${String(mi+1).padStart(2,'0')}</small><strong>${escapeHtml(module.title)}</strong></span><span>${escapeHtml(module.duration||'')} ${icon('chevronDown')}</span></button><div><ul>${(module.lessons||[]).map(lesson=>`<li><span>${lesson.preview?icon('play'):icon('lock')}</span><b>${escapeHtml(lesson.title)}</b><small>${escapeHtml(lesson.duration||'')}</small>${lesson.preview?'<em>Preview</em>':''}</li>`).join('')}</ul></div></article>`).join('')}</div></section><section class="fsa-detail-block" id="course-batches"><div class="fsa-detail-heading-inline"><div><span class="eyebrow">Learning Schedule</span><h2>${escapeHtml(course.title)} <em>options.</em></h2></div><span id="batchResultCount"></span></div><div class="fsa-batch-dropdown-grid detail course-detail-batch-filters">${batchFilterSelect('shift',state.batchShift,true)}${batchFilterSelect('mode',state.batchMode,true)}${batchFilterSelect('branch',state.batchBranch,true)}</div><div class="fsa-batch-grid detail" id="fsaBatchGrid">${batchRows(course).map(batchCard).join('')}</div></section>${state.detailDeliveryMode==='recorded'?`<section class="fsa-detail-block"><span class="eyebrow">Recorded Course Access</span><h2>Your recorded option becomes a <em>private learner workspace.</em></h2><p>After enrollment, Recorded courses appear in your learner dashboard with lessons, notes, downloadable resources, project work, progress and certificates.</p><div class="fsa-detail-private-grid"><div class="fsa-private-preview">${['Course roadmap','Recorded lesson library','Downloadable notes and lab files','Project submission workspace','Progress & completion certificate'].map((item,i)=>`<div class="fsa-private-row"><span>${i===0?icon('book'):i===1?icon('video'):i===2?icon('download'):i===3?icon('project'):icon('award')}</span><div><strong>${item}</strong><small>${i===1?'Recorded learning':i===2?'Learner resources':i===3?'Private activity':'Course area'}</small></div><b>${i===0?'<em class="preview-open">Preview</em>':icon('lock')}</b></div>`).join('')}</div><div class="fsa-private-copy"><span class="fsa-mode-icon">${icon('video')}</span><h3>Recorded learner access</h3><p>Enroll in a Recorded course and open it anytime from My Courses in your student dashboard.</p><a class="button button-primary button-block" href="#/courses?mode=recorded">Browse Recorded Courses</a><a class="button button-secondary button-block" href="#/login">Student Sign In</a></div></div></section>`:''}</div><aside class="fsa-detail-enroll-card reveal"><div class="fsa-detail-enroll-head"><small>Choose learning mode</small><div class="fsa-detail-mode-switch">${modeButtons}</div></div><div class="fsa-detail-mode-copy" id="detailModeCopy">${modeCopy}</div><div class="fsa-detail-price"><small>Course fee from</small><strong>${money(course.price)}</strong>${Number(course.originalPrice||0)>Number(course.price||0)?`<del>${money(course.originalPrice)}</del>`:''}</div><div class="fsa-detail-enroll-list">${['Practical projects','Completion certificate','Career-focused guidance','Mode-specific learning access'].map(item=>`<span>${icon('check')} ${item}</span>`).join('')}</div><button class="button button-primary button-block" data-action="add-cart" data-id="${course.id}" data-mode="${uiModeToBackend(state.detailDeliveryMode)}">Add Course</button><button class="button button-secondary button-block" data-action="open-call-popup">Ask About This Course</button><small class="fsa-detail-note">The selected learning mode, its content and its exact fee are loaded from the backend and kept with your enrollment selection.</small></aside></div></section>
      ${courseDetailReviewSection(course)}
      <section class="fsa-courses-faq-section detail"><div class="container fsa-faq-layout"><div><span class="eyebrow">Course FAQ</span><h2>${escapeHtml(course.title)} <em>questions.</em></h2><p>Course-specific answers for Live Streamed, Recorded and Offline Classroom learning.</p></div>${faqMarkup(faqs)}</div></section>
      <section class="fsa-related-section"><div class="container"><div class="fsa-course-section-head"><div><span class="eyebrow">Continue Exploring</span><h2>Related <em>courses.</em></h2></div><a class="button button-outline" href="#/courses">View All Courses ${icon('arrow')}</a></div><div class="fsa-course-catalog-grid related">${related.map(catalogCourseCard).join('')}</div></div></section>`;
    requestAnimationFrame(()=>updateBatchResults(course));
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
    app.innerHTML=`<section class="fsa-batches-page-hero"><div class="container fsa-batches-page-grid"><div class="fsa-batches-page-copy reveal"><span class="eyebrow">Admissions & Learning Access</span><h1>Find the right <em>batch or learning mode.</em></h1><p>Compare scheduled Live Streamed classes, branch-based Offline Classroom batches and Recorded courses that can start anytime. The same three-mode structure is now used across the course catalogue.</p><div class="fsa-batches-hero-modes"><span><i>${icon('radio')}</i>Live Streamed</span><span><i>${icon('video')}</i>Recorded</span><span><i>${icon('classroom')}</i>Offline Classroom</span></div></div><aside class="fsa-batches-page-panel reveal reveal-delay-2"><small>How it works</small><h3>Filter your learning options</h3><ul><li>${icon('search')} Search by course or technology</li><li>${icon('clock')} Choose morning, afternoon, evening or anytime</li><li>${icon('map')} Filter online or a Hyderabad branch</li><li>${icon('layers')} Select your preferred learning mode</li></ul><button class="button button-primary button-block" data-action="open-call-popup" style="margin-top:17px">Need Help? Get A Call</button></aside></div></section><section class="fsa-batches-directory"><div class="container"><div class="fsa-batches-directory-head"><div><span class="eyebrow">All Learning Options</span><h2>Upcoming batches & recorded access</h2><p>Use the filters from left to right to narrow the complete backend schedule.</p></div></div><div class="fsa-batch-dropdown-grid directory">${batchSearchField()}${batchFilterSelect('shift',state.batchShift)}${batchFilterSelect('mode',state.batchMode)}${batchFilterSelect('branch',state.batchBranch)}</div><div class="fsa-batches-filter-stack" hidden><div class="fsa-batches-filter-row"><strong>Time</strong><div class="fsa-batches-filter-scroll">${['all','morning','afternoon','evening','anytime'].map(v=>`<button class="${state.batchShift===v?'active':''}" data-action="batch-shift" data-value="${v}">${v==='all'?'All':v==='anytime'?'Start Anytime':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div></div><div class="fsa-batches-filter-row"><strong>Mode</strong><div class="fsa-batches-filter-scroll">${[['all','All Modes'],['live-streamed','Live Streamed'],['recorded','Recorded'],['offline-classroom','Offline Classroom']].map(([v,l])=>`<button class="${state.batchMode===v?'active':''}" data-action="batch-mode" data-value="${v}">${l}</button>`).join('')}</div></div><div class="fsa-batches-filter-row"><strong>Branch</strong><div class="fsa-batches-filter-scroll">${[['all','All Locations'],['online','Online'],...(Array.isArray(D.branches)?D.branches:[]).map(branch=>[String(branch.slug||branch.id||'').toLowerCase(),branch.shortName||String(branch.name||'').replace(/^FSA\s*[—-]\s*/,'')||branch.location])].filter(item=>item[0]).map(([v,l])=>`<button class="${state.batchBranch===v?'active':''}" data-action="batch-branch" data-value="${escapeHtml(v)}">${escapeHtml(l)}</button>`).join('')}</div></div></div><div class="fsa-batches-results-line"><span id="batchResultCount"><strong>${rows.length}</strong> options found</span><button class="clear-button" data-action="batch-reset">Reset filters</button></div><div class="fsa-batches-page-grid-list" id="fsaBatchGrid">${rows.map(batchCard).join('')}</div></div></section><section class="section-sm section-surface"><div class="container"><div class="cta-panel"><span class="eyebrow">Course Guidance</span><h2>Not sure which format fits your schedule?</h2><p>Share your course interest and preferred learning mode. The academy team can help you choose the best available option.</p><div class="cta-actions"><button class="button button-primary" data-action="open-call-popup">Get A Call</button><a class="button button-secondary" href="#/courses">Browse Courses</a></div></div></div></section>`;
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

  function branchGeo(branchOrId){
    const branch=typeof branchOrId==='string'?D.branches.find(item=>item.id===branchOrId):branchOrId;
    const fallback=branch?BRANCH_ROUTE_META[branch.id]:null;
    const lat=Number(branch?.lat ?? fallback?.lat),lng=Number(branch?.lng ?? fallback?.lng);
    return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
  }

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
    if (!branch?.id) return '#/branches';
    return `#/branches?branch=${encodeURIComponent(branch.id)}`;
  }

  function branchDetailUrl(branch) {
    if (!branch?.id) return '#/branches';
    if (branch.detailUrl && !String(branch.detailUrl).startsWith('#/')) return String(branch.detailUrl);
    return BRANCH_ROUTE_META[branch.id]?.page || branchMapsUrl(branch);
  }

  function branchDirectoryRow(branch, index = 0) {
    const localImage = branch.image || HOME_BRANCH_IMAGES[branch.id];
    const maps = branchMapsUrl(branch);
    const livePage = branchDetailUrl(branch);
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


  function renderInstructors(){
    setChrome('public');
    const instructors=Array.isArray(D.instructors)?D.instructors:[];
    app.innerHTML=`${pageHero({eyebrow:'Academy Instructors',title:'Learn from our experienced instructors.',text:'Meet the instructors currently published by Full Stack Academy. Profiles, images, branches and skills are managed from the academy backend.',center:true})}
      <section class="page-section"><div class="container"><div class="card-grid">${instructors.length?instructors.map((item,index)=>`<article class="branch-card reveal reveal-delay-${Math.min(index%4,3)}"><div class="branch-image">${imageMarkup(item.avatar,`${item.name} instructor`,initials(item.name))}</div><div class="branch-body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.headline||'Full Stack Academy Instructor')}</p><div class="branch-contact"><span>${icon('building')} ${escapeHtml(item.branch||'Full Stack Academy')}</span>${item.city?`<span>${icon('map')} ${escapeHtml([item.city,item.country].filter(Boolean).join(', '))}</span>`:''}<span>${icon('award')} ${escapeHtml((item.skills||[]).slice(0,4).join(' · ')||'Technology instructor')}</span></div>${item.bio?`<p>${textHtml(item.bio)}</p>`:''}${item.slug?`<div class="branch-actions"><a class="button button-secondary button-sm" href="#/people/${encodeURIComponent(item.slug)}">View Profile</a></div>`:''}</div></article>`).join(''):emptyState('No instructors published','Instructor profiles will appear here after they are approved and made public.')}</div></div></section>`;
    initPage();
  }

  function renderBranches(preferredBranchId = '') {
    setChrome('public');
    destroyBranchMap();
    if (!Array.isArray(D.branches) || !D.branches.length) {
      app.innerHTML=`${pageHero({eyebrow:'Academy Branches',title:'Our branches are managed from the academy backend.',text:'No published branches are available right now.',center:true})}${emptyState('No branches published','Publish a branch from the admin dashboard and it will appear here automatically.')}`;
      initPage();
      return;
    }
    const firstBranchId = D.branches[0]?.id || 'charminar';
    const requestedId = D.branches.some(branch => branch.id === preferredBranchId) ? preferredBranchId : firstBranchId;
    branchMapState.selectedId = requestedId;
    const selected = D.branches.find(branch => branch.id === requestedId) || D.branches[0];
    const selectedMaps = selected ? branchMapsUrl(selected) : '#';
    const branchCount = D.branches.length;
    const branchNames = D.branches.map(branch => branch.shortName || String(branch.name||'').replace(/^FSA\s*[—-]\s*/, '')).filter(Boolean);
    const branchNamesText = branchNames.join(', ');
    const firstBranchName = selected?.shortName || String(selected?.name||'').replace(/^FSA\s*[—-]\s*/, '') || 'the selected';
    app.innerHTML = `<div class="branches-page">
      <section class="branch-page-hero">
        <div class="container branch-page-hero-grid">
          <div class="branch-page-hero-copy reveal">
            <span class="branch-page-kicker">Hyderabad Learning Centres</span>
            <h1>Full Stack Academy <em>Branches</em></h1>
            <p>Full Stack Academy has ${branchCount} ${branchCount===1?'branch':'branches'} across Hyderabad${branchNamesText?` — ${escapeHtml(branchNamesText)}`:''}. Choose the location that suits you for classroom learning, practical labs, instructor guidance and career-focused support.</p>
            <div class="branch-page-hero-actions"><button class="button button-primary" type="button" data-action="branch-scroll" data-target="branch-directory">Explore Branches</button><button class="button button-secondary" type="button" data-action="branch-scroll" data-target="branch-finder">Find Nearest Branch</button></div>
          </div>
          <div class="branch-page-hero-art reveal reveal-delay-2" aria-hidden="true">
            <img class="branch-page-hero-logo" src="assets/images/fsa-home/logo.svg" alt="">
            <span class="branch-page-hero-mini"><strong>${String(branchCount).padStart(2,'0')}</strong><span>FSA learning centre${branchCount===1?'':'s'} across Hyderabad</span></span>
          </div>
        </div>
      </section>

      <section class="branch-directory-section" id="branch-directory">
        <div class="container">
          <div class="branch-section-heading reveal"><span>Our Centres</span><h2>Visit a Full Stack Academy <em>branch</em></h2><p>Explore all ${branchCount} Hyderabad centre${branchCount===1?'':'s'}, compare locations and choose the classroom that works best for your learning schedule.</p></div>
          <div class="branch-directory">${D.branches.map((branch,index)=>branchDirectoryRow(branch,index)).join('')}</div>
        </div>
      </section>

      <section class="branch-finder-section" id="branch-finder">
        <div class="container">
          <div class="branch-section-heading center reveal"><span>Route Planner</span><h2>Find your <em>nearest FSA branch</em></h2><p>The first branch is shown on the map by default. Select another centre at left, or allow location access to draw the route and calculate driving distance from your current location.</p></div>
          <div class="branch-finder-grid">
            <aside class="branch-finder-panel reveal">
              <div class="branch-finder-panel-head"><small>Select Branch</small><h3>${branchCount} location${branchCount===1?'':'s'}. One academy.</h3><p>${escapeHtml(firstBranchName)} is selected. Tap any branch to update the map on the right.</p></div>
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
      const meta = branchGeo(node.dataset.branchDistance);
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
    const meta = branchGeo(branchMapState.selectedId);
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
    const meta = branchGeo(id);
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
    const selectedMeta = branchGeo(selected) || BRANCH_ROUTE_META.charminar;
    branchMapState.map = window.L.map(mapNode,{zoomControl:true,scrollWheelZoom:false,attributionControl:false}).setView([selectedMeta.lat,selectedMeta.lng],branchMapState.user ? 12 : 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(branchMapState.map);
    D.branches.forEach(branch => {
      const meta = branchGeo(branch);
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


  function cartTotals() {
    const courseItems = state.cart.map(entry=>{
      const normalized=normalizeCartEntry(entry); if(!normalized)return null;
      const base=courseById(normalized.courseId); if(!base)return null;
      const uiMode=normalized.mode?backendModeToUi(normalized.mode):defaultCourseUiMode(base);
      const selected=courseContentForMode(base,uiMode);
      return {...selected,cartMode:uiModeToBackend(uiMode),cartKey:`${base.id}:${uiModeToBackend(uiMode)}`};
    }).filter(Boolean);
    const subtotal = courseItems.reduce((sum,c)=>sum+Number(c.price||0),0);
    const discount = state.coupon === 'FSA10' ? Math.round(subtotal * .10) : 0;
    return { courseItems, subtotal, discount, total: subtotal-discount };
  }

  function renderCart() {
    setChrome('public');
    const t = cartTotals();
    app.innerHTML = `${pageHero({eyebrow:'Your Cart',title:'Review your course selection.',text:'Check the delivery type and exact backend fee for each selected course before submitting your enrollment request.',center:true})}<section class="page-section"><div class="container cart-page-grid"><div>${t.courseItems.length ? `<div class="cart-list">${t.courseItems.map(c=>`<article class="cart-item"><div class="cart-item-image">${imageMarkup(c.image,c.title,initials(c.title))}</div><div><span class="course-category">${c.category}</span><h3>${c.title}</h3><p><strong>${deliveryModeLabel(c.cartMode)}</strong> · ${c.duration||'Flexible'} · ${c.projects||0} projects${c.instructor?` · ${c.instructor}`:''}</p><div class="item-actions"><button class="link-button" data-action="move-wishlist" data-id="${c.id}">Move to wishlist</button><button class="link-button" data-action="remove-cart" data-id="${c.id}" data-mode="${c.cartMode}">Remove</button></div></div><div class="cart-item-price"><strong>${money(c.price)}</strong>${Number(c.originalPrice||0)>Number(c.price||0)?`<del>${money(c.originalPrice)}</del>`:''}<small>${deliveryModeLabel(c.cartMode)}</small></div></article>`).join('')}</div>` : `<div class="empty-state"><span class="empty-icon">${icon('cart')}</span><h3>Your cart is empty</h3><p>Explore courses and add the learning path you want to join.</p><a class="button button-primary" href="#/courses">Explore Courses</a></div>`}</div><aside class="summary-card"><h3>Enrollment summary</h3><div class="coupon-row"><input class="form-control" id="couponInput" value="${state.coupon||''}" placeholder="Promotional code"><button class="button button-secondary button-sm" data-action="apply-coupon">Apply</button></div><div class="form-help">Enter a valid academy promotional code.</div><div class="summary-lines"><div class="summary-line"><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div><div class="summary-line"><span>Discount</span><strong>−${money(t.discount)}</strong></div><div class="summary-line"><span>Final fee</span><strong>Confirmed by academy</strong></div><div class="summary-line total"><span>Estimated total</span><strong>${money(t.total)}</strong></div></div><a class="button button-primary button-block ${t.subtotal===0?'disabled':''}" href="${t.courseItems.length?'#/checkout':'#/courses'}">Continue to Enrollment ${icon('arrow')}</a><div class="demo-notice" style="margin-top:14px">${icon('shield')} The selected delivery type and its backend price are stored with the order, ready for a future online payment provider.</div></aside></div></section>`;
  }
  function renderCheckout() {
    if (!state.loggedIn) { toast('Sign in or create an account before checkout.','error'); routeTo('/login'); return; }
    setChrome('public');
    const t = cartTotals();
    if (!t.courseItems.length) { renderCart(); toast('Add a course before continuing.','error'); return; }
    app.innerHTML = `${pageHero({eyebrow:'Course Enrollment',title:'Submit your enrollment details.',text:'Share your contact and payment preference. The academy team will confirm fees, schedule and next steps.',center:true})}<section class="page-section"><div class="container checkout-grid"><form id="checkoutForm" novalidate><section class="form-section"><h2>Contact information</h2><div class="form-grid"><div class="form-group"><label for="checkoutName">Full name</label><input class="form-control" id="checkoutName" name="name" required value="${escapeHtml(state.user.name === 'Academy Learner' ? '' : state.user.name)}"></div><div class="form-group"><label for="checkoutEmail">Email address</label><input class="form-control" id="checkoutEmail" name="email" type="email" required value="${escapeHtml(state.user.email)}"></div><div class="form-group full"><label for="checkoutPhone">Phone number</label><input class="form-control" id="checkoutPhone" name="phone" required value="${escapeHtml(state.user.phone)}"></div></div></section><section class="form-section"><h2>Location information</h2><div class="form-grid"><div class="form-group"><label>Country</label><select class="form-control" name="country" required><option value="India">India</option><option value="Pakistan">Pakistan</option><option value="United Arab Emirates">United Arab Emirates</option><option value="Other">Other</option></select></div><div class="form-group"><label>State</label><input class="form-control" name="state" value="Telangana" required></div><div class="form-group full"><label>Address</label><input class="form-control" name="address" placeholder="Your address" required></div><div class="form-group"><label>City</label><input class="form-control" name="city" value="${escapeHtml(state.user.city)}" required></div><div class="form-group"><label>Postal code</label><input class="form-control" name="postal" inputmode="numeric" required></div></div></section><section class="form-section"><h2>Preferred payment method</h2><div class="payment-options"><label class="payment-option"><input type="radio" name="payment" value="upi" checked><span class="payment-icon">${icon('phone')}</span><span><strong>UPI</strong><small>Receive payment instructions after confirmation</small></span></label><label class="payment-option"><input type="radio" name="payment" value="bank"><span class="payment-icon">${icon('briefcase')}</span><span><strong>Bank transfer</strong><small>Academy account details will be shared securely</small></span></label><label class="payment-option"><input type="radio" name="payment" value="branch"><span class="payment-icon">${icon('map')}</span><span><strong>Pay at branch</strong><small>Complete payment at your preferred academy location</small></span></label></div><div class="form-group" style="margin-top:15px"><label>Additional message</label><textarea class="form-control" name="message" placeholder="Preferred batch timing, branch or any questions"></textarea></div></section><button class="button button-primary button-lg button-block" type="submit">Place Course Order ${icon('check')}</button></form><aside class="summary-card"><h3>Your selection</h3><div class="summary-lines">${t.courseItems.map(c=>`<div class="summary-line"><span>${c.title}<small style="display:block">${deliveryModeLabel(c.cartMode)}</small></span><strong>${money(c.price)}</strong></div>`).join('')}<div class="summary-line"><span>Discount</span><strong>−${money(t.discount)}</strong></div><div class="summary-line total"><span>Estimated total</span><strong>${money(t.total)}</strong></div></div><div class="demo-notice">${icon('shield')} Your order will remain pending until the academy confirms payment. Paid orders automatically activate course access.</div></aside></div></section>`;
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
    app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card"><span class="eyebrow">Welcome Back</span><h1>Choose your profile</h1><p>Students and instructors sign in to their own dedicated dashboard.</p><form class="auth-form" id="loginForm" novalidate><div class="profile-type-picker"><label><input type="radio" name="account_type" value="student" checked><span><i class="profile-type-icon">${icon('book')}</i><b><strong>Student Profile</strong><small>Learn, track courses and publish achievements</small></b></span></label><label><input type="radio" name="account_type" value="instructor"><span><i class="profile-type-icon">${icon('users')}</i><b><strong>Instructor Profile</strong><small>Manage assigned students after admin approval</small></b></span></label></div><div class="form-group"><label>Email or academy ID</label><input class="form-control" name="identifier" required autocomplete="username" value="${escapeHtml(state.user.email||state.user.student_code||'')}" placeholder="Email or FSA-26-XXXXXX"></div><div class="form-group"><label>Password</label><div class="password-wrap"><input class="form-control" name="password" type="password" required minlength="8" autocomplete="current-password"><button class="password-toggle" type="button" data-action="toggle-password">${icon('eye')}</button></div></div><div class="checkbox-line"><label><input type="checkbox" name="remember" checked> Keep me signed in</label><a href="#/forgot-password">Forgot password?</a></div><button class="button button-primary button-block" type="submit">Open Dashboard</button></form><p class="auth-switch">Need an account? <a href="#/register">Create student or instructor profile</a></p><p class="auth-switch"><a href="${ADMIN_URL}">Administrator login</a></p></article></div></section>`;
  }
  function renderRegister() {
    setChrome('auth');
    const registrationOpen = siteSettings.registration_enabled !== false;
    if (!registrationOpen) {
      const contact = contactDetails();
      app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card"><span class="eyebrow">Registration Paused</span><h1>New account registration is currently closed.</h1><p>The academy has temporarily disabled student and instructor signup. Contact the support team for assistance.</p><div class="cta-actions"><a class="button button-primary" href="mailto:${escapeHtml(contact.email)}">Email Support</a><a class="button button-secondary" href="#/login">Return to Sign In</a></div></article></div></section>`;
      return;
    }
    app.innerHTML = `<section class="auth-page">${authVisual()}<div class="auth-form-wrap"><article class="auth-card auth-card-wide"><span class="eyebrow">Create Account</span><h1>Select your profile</h1><p>Student accounts open immediately. Instructor profiles are reviewed by an administrator before login access is activated.</p><form class="auth-form" id="registerForm" novalidate><div class="profile-type-picker"><label><input type="radio" name="account_type" value="student" checked><span><i class="profile-type-icon">${icon('book')}</i><b><strong>Student Profile</strong><small>Learn, track courses and publish achievements</small></b></span></label><label><input type="radio" name="account_type" value="instructor"><span><i class="profile-type-icon">${icon('users')}</i><b><strong>Instructor Profile</strong><small>Manage assigned students after admin approval</small></b></span></label></div><div class="form-grid"><div class="form-group full"><label>Full name</label><input class="form-control" name="name" required maxlength="120" autocomplete="name"></div><div class="form-group"><label>Email</label><input class="form-control" name="email" type="email" required maxlength="190" autocomplete="email"></div><div class="form-group"><label>Phone</label><input class="form-control" name="phone" type="tel" required maxlength="40" autocomplete="tel"></div><div class="form-group"><label>Password</label><div class="password-wrap"><input class="form-control" name="password" type="password" minlength="8" maxlength="4096" required autocomplete="new-password"><button class="password-toggle" type="button" data-action="toggle-password">${icon('eye')}</button></div></div><div class="form-group"><label>Confirm password</label><input class="form-control" name="confirm" type="password" minlength="8" maxlength="4096" required autocomplete="new-password"></div></div><label class="checkbox-line" style="justify-content:flex-start"><input type="checkbox" name="terms" required> I agree to the <a href="#/terms">terms</a> and <a href="#/privacy">privacy policy</a>.</label><button class="button button-primary button-block" type="submit" id="registerSubmitButton">Create Student Account</button></form><p class="auth-switch">Already registered? <a href="#/login">Sign in</a></p></article></div></section>`;
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
  function dashboardSidebar(active = 'dashboard') {
    const avatar = state.user.avatar ? `<img src="${state.user.avatar}" alt="${escapeHtml(state.user.name)}">` : initials(state.user.name);
    const links = [
      ['dashboard','Dashboard','dashboard','#/dashboard'],['my-courses','My Courses','book','#/my-courses'],['wishlist','Wishlist','heart','#/wishlist'],['certificates','Certificates','certificate','#/certificates'],['purchase-history','Purchase History','history','#/purchase-history'],['profile','My Profile','user','#/profile']
    ];
    return `<aside class="dashboard-sidebar" id="dashboardSidebar"><div class="dashboard-profile-mini"><span class="avatar">${avatar}</span><span><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(state.user.headline)}</span></span></div><nav class="dashboard-nav">${links.map(l=>`<a class="${active===l[0]?'active':''}" href="${l[3]}">${icon(l[2])}<span>${l[1]}</span></a>`).join('')}<i class="nav-divider"></i><a href="#/courses">${icon('search')}<span>Browse Courses</span></a><button data-action="logout">${icon('logout')}<span>Sign Out</span></button></nav></aside>`;
  }

  function dashboardTop(title, subtitle) {
    return `<div class="dashboard-topbar"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="dashboard-actions"><button class="icon-button dashboard-mobile-nav" data-action="toggle-dashboard-nav" aria-label="Open dashboard navigation">${icon('menu')}</button><a class="button button-secondary button-sm" href="#/courses">${icon('search')}<span>Browse Courses</span></a></div></div>`;
  }

  function dashboardShell(active, content, title, subtitle) {
    if (!state.loggedIn) { routeTo('/login'); return; }
    if (state.user.role === 'instructor') { routeTo('/instructor-dashboard'); return; }
    setChrome('dashboard');
    app.innerHTML = `<section class="dashboard-shell">${dashboardSidebar(active)}<main class="dashboard-main">${dashboardTop(title,subtitle)}${content}</main></section>`;
  }

  function enrolledCourses() { return state.enrollments.map(courseById).filter(Boolean); }

  function renderDashboard() {
    const enrolled = enrolledCourses();
    const completed = enrolled.filter(c=>progressPercent(c.id)===100);
    const inProgress = enrolled.filter(c=>progressPercent(c.id)>0&&progressPercent(c.id)<100);
    const continueCourse = inProgress[0] || enrolled[0] || null;
    const continuePanel = continueCourse ? (() => {
      const percent = progressPercent(continueCourse.id);
      return `<article class="continue-card-dashboard"><img src="${continueCourse.image}" alt="${continueCourse.title}" onerror="this.style.display='none'"><div><span class="course-category">${continueCourse.category}</span><h3>${continueCourse.title}</h3><p>${completedLessons(continueCourse.id)} of ${allLessonKeys(continueCourse).length} lessons complete</p><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div><a class="button button-primary button-sm" href="#/learn/${continueCourse.slug}">${percent===100?'Review':'Resume'}</a></article>`;
    })() : `<div class="empty-state" style="padding:35px 15px"><span class="empty-icon">${icon('book')}</span><h3>No active course yet</h3><p>${state.pendingEnrollments.length?'Your order is waiting for payment confirmation. Course access will appear here after activation.':'Choose a course and place your first order.'}</p><a class="button button-primary button-sm" href="${state.pendingEnrollments.length?'#/purchase-history':'#/courses'}">${state.pendingEnrollments.length?'View Orders':'Browse Courses'}</a></div>`;
    const latestOrders = state.orders.slice(0,4);
    const content = `<div class="dashboard-metrics">
      ${[[enrolled.length,'Active courses','book'],[state.pendingEnrollments.length,'Pending courses','clock'],[completed.length,'Certificates earned','certificate'],[state.orders.length,'Course orders','history']].map(m=>`<article class="metric-card"><div class="metric-card-top"><span>${m[1]}</span><i class="metric-card-icon">${icon(m[2])}</i></div><strong>${m[0]}</strong><span>Synced with MySQL</span></article>`).join('')}
      </div><div class="dashboard-grid"><div class="panel"><div class="panel-head"><h2>Continue learning</h2><a href="#/my-courses">View all</a></div>${continuePanel}<div class="course-progress-list" style="margin-top:16px">${inProgress.slice(1,4).map(c=>`<article class="course-progress-item"><div class="progress-item-head"><strong>${c.title}</strong><span>${progressPercent(c.id)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${progressPercent(c.id)}%"></div></div></article>`).join('')}</div></div><aside class="goal-card"><span class="eyebrow light">Weekly Goal</span><h3>Keep your learning streak active.</h3><p>Your weekly target is ${state.user.weeklyGoal} learning hours.</p><div class="progress-track"><div class="progress-fill" style="width:${enrolled.length?35:0}%"></div></div><div style="margin-top:16px;font-family:'DM Sans';font-weight:800">${enrolled.length?'Start your next lesson':'Activate a course to begin'}</div></aside></div>
      <div class="dashboard-grid"><div class="panel"><div class="panel-head"><h2>Recent orders</h2><a href="#/purchase-history">View all</a></div>${latestOrders.length?`<div class="course-progress-list">${latestOrders.map(order=>`<article class="course-progress-item"><div class="progress-item-head"><strong>${escapeHtml(order.item)}</strong><span>${escapeHtml(order.status)}</span></div><p class="muted" style="margin:7px 0 0">${escapeHtml(order.id)} · ${money(order.amount)}</p></article>`).join('')}</div>`:'<p class="muted">No course orders have been placed yet.</p>'}</div><div class="panel"><div class="panel-head"><h2>Latest certificate</h2><a href="#/certificates">View all</a></div>${completed.length?`<div class="certificate-preview"><span class="certificate-seal">${icon('award')}</span><strong>${completed[0].title}</strong><p>Completion certificate available</p><button class="button button-secondary button-sm" data-action="print-certificate" data-id="${completed[0].id}">Print</button></div>`:`<div class="empty-state" style="padding:30px 15px"><p>Complete a course to unlock a certificate.</p></div>`}</div></div>
      <div class="panel" style="margin-top:20px"><div class="panel-head"><h2>Recommended for you</h2><a href="#/courses">Browse all</a></div><div class="card-grid">${D.courses.filter(c=>!state.enrollments.includes(c.id)&&!state.pendingEnrollments.includes(c.id)).slice(0,3).map((c,i)=>courseCard(c,i)).join('')}</div></div>`;
    dashboardShell('dashboard',content,`Welcome back, ${escapeHtml(state.user.name.split(' ')[0])}.`,'Review active courses, pending orders and learning progress stored in your account.');
  }

  function renderMyCourses() {
    const enrolled = enrolledCourses().filter(c => state.learnerTab === 'all' || (state.learnerTab === 'progress' ? progressPercent(c.id) < 100 : progressPercent(c.id) === 100));
    const tabs = `<div class="my-courses-toolbar"><div class="segmented-tabs">${[['all','All Courses'],['progress','In Progress'],['complete','Completed']].map(t=>`<button class="${state.learnerTab===t[0]?'active':''}" data-action="learner-tab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><span class="muted">${enrolled.length} course${enrolled.length===1?'':'s'}</span></div>`;
    const body = enrolled.length
      ? `<div class="enrolled-grid">${enrolled.map(c=>`<article class="enrolled-card"><img src="${c.image}" alt="${c.title}" onerror="this.style.display='none'"><div class="enrolled-body"><span class="course-category">${c.category}</span><h3>${c.title}</h3><p>${c.instructor} · Last accessed recently</p><div class="enrolled-progress"><div class="progress-track"><div class="progress-fill" style="width:${progressPercent(c.id)}%"></div></div><span>${progressPercent(c.id)}%</span></div><a class="button button-primary button-sm" href="#/learn/${c.slug}">${progressPercent(c.id)===100?'Review Course':'Continue Learning'}</a></div></article>`).join('')}</div>`
      : `<div class="empty-state"><span class="empty-icon">${icon('book')}</span><h3>No courses in this section</h3><p>Your enrolled courses will appear here as you make progress.</p><a class="button button-primary" href="#/courses">Browse Courses</a></div>`;
    dashboardShell('my-courses', tabs + body, 'My Courses', 'Continue learning, review completed lessons and track each course.');
  }

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

  function renderProfile() {
    const avatar = state.user.avatar ? `<img src="${state.user.avatar}" alt="${escapeHtml(state.user.name)}">` : initials(state.user.name);
    const content = `<div class="profile-layout"><aside class="profile-card"><div class="profile-avatar-large" id="profileAvatar">${avatar}<label class="avatar-upload" for="avatarInput">${icon('camera')}</label><input class="sr-only" id="avatarInput" type="file" accept="image/*"></div><h2>${escapeHtml(state.user.name)}</h2><p>${escapeHtml(state.user.headline)}</p><div class="profile-stat-row"><span><strong>${state.enrollments.length}</strong><span>Courses</span></span><span><strong>${enrolledCourses().filter(c=>progressPercent(c.id)===100).length}</strong><span>Complete</span></span><span><strong>${state.orders.length}</strong><span>Orders</span></span></div></aside><section class="panel"><div class="settings-tabs">${[['personal','Personal Details'],['learning','Learning Preferences'],['security','Security']].map(t=>`<button class="${state.profileTab===t[0]?'active':''}" data-action="profile-tab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div id="profileTabPanel">${profileTabContent(state.profileTab)}</div></section></div>`;
    if(state.user.role==='instructor')instructorShell('profile',content,'Instructor Profile','Update your professional information and public academy profile.');
    else dashboardShell('profile',content,'My Profile','Update your learner information, password and learning preferences.');
  }

  function profileTabContent(tab) {
    if (tab === 'learning') return `<form id="learningPreferencesForm"><div class="form-grid"><div class="form-group"><label>Weekly learning goal (hours)</label><input class="form-control" name="weeklyGoal" type="number" min="1" max="40" value="${state.user.weeklyGoal}"></div><div class="form-group"><label>Preferred language</label><select class="form-control" name="language"><option>English / Hindi</option><option>English</option><option>Hindi</option></select></div><div class="form-group full"><label class="checkbox-line" style="justify-content:flex-start"><input type="checkbox" name="notifications" ${state.user.notifications?'checked':''}> Receive learning reminders and academy updates.</label></div></div><button class="button button-primary" type="submit" style="margin-top:18px">Save Preferences</button></form>`;
    if (tab === 'security') return `<form id="securityForm"><div class="form-grid"><div class="form-group"><label>Current password</label><input class="form-control" name="currentPassword" type="password" required autocomplete="current-password"></div><div class="form-group"><label>New password</label><input class="form-control" name="newPassword" type="password" minlength="8" required autocomplete="new-password"></div><div class="form-group full"><label>Confirm new password</label><input class="form-control" name="confirmPassword" type="password" minlength="8" required autocomplete="new-password"></div></div><button class="button button-primary" type="submit" style="margin-top:18px">Update Password</button></form>`;
    return `<form id="profileForm"><div class="form-grid"><div class="form-group"><label>Full name</label><input class="form-control" name="name" required value="${escapeHtml(state.user.name)}"></div><div class="form-group"><label>Email address</label><input class="form-control" name="email" type="email" required value="${escapeHtml(state.user.email)}" readonly></div><div class="form-group"><label>Academy ID</label><input class="form-control" value="${escapeHtml(state.user.student_code||'Assigned by administrator')}" readonly></div><div class="form-group"><label>Phone number</label><input class="form-control" name="phone" value="${escapeHtml(state.user.phone)}"></div><div class="form-group"><label>Headline</label><input class="form-control" name="headline" value="${escapeHtml(state.user.headline)}"></div><div class="form-group"><label>Branch</label><input class="form-control" name="branch" value="${escapeHtml(state.user.branch||'')}"></div><div class="form-group"><label>City</label><input class="form-control" name="city" value="${escapeHtml(state.user.city)}"></div><div class="form-group"><label>Country</label><input class="form-control" name="country" value="${escapeHtml(state.user.country)}"></div><div class="form-group full"><label>Skills (comma separated)</label><input class="form-control" name="skills" value="${escapeHtml((state.user.skills||[]).join(', '))}"></div><div class="form-group full"><label>Bio</label><textarea class="form-control" name="bio">${escapeHtml(state.user.bio)}</textarea></div><div class="form-group full"><label class="checkbox-line" style="justify-content:flex-start"><input type="checkbox" name="profile_public" ${state.user.profile_public!==false?'checked':''}> Publish my academy profile</label>${state.user.public_slug?`<small>Public URL: <a href="#/people/${escapeHtml(state.user.public_slug)}">#/people/${escapeHtml(state.user.public_slug)}</a></small>`:''}</div></div><button class="button button-primary" type="submit" style="margin-top:18px">Save Profile</button></form>`;
  }

  function instructorShell(active,content,title,subtitle){
    if(!state.loggedIn){routeTo('/login');return;} if(state.user.role!=='instructor'){routeTo('/dashboard');return;}
    setChrome('dashboard');
    const links=[['instructor-dashboard','Overview','dashboard'],['instructor-courses','My Courses','book'],['instructor-live','Live Classes','radio'],['instructor-quizzes','Quizzes','note'],['instructor-assignments','Assignments','project'],['instructor-certificates','Certificates','award'],['instructor-students','My Students','users'],['instructor-requests','Approval Status','clock'],['profile','My Profile','user']];
    const avatar=state.user.avatar?`<img src="${escapeHtml(state.user.avatar)}" alt="">`:initials(state.user.name);
    app.innerHTML=`<section class="dashboard-shell"><aside class="dashboard-sidebar" id="dashboardSidebar"><div class="dashboard-profile-mini"><span class="avatar">${avatar}</span><span><strong>${escapeHtml(state.user.name)}</strong><span>Instructor · ${escapeHtml(state.user.branch||'All branches')}</span></span></div><nav class="dashboard-nav">${links.map(l=>`<a class="${active===l[0]?'active':''}" href="#/${l[0]}">${icon(l[2])}<span>${l[1]}</span></a>`).join('')}<i class="nav-divider"></i><button data-action="logout">${icon('logout')}<span>Sign Out</span></button></nav></aside><main class="dashboard-main">${dashboardTop(title,subtitle)}${content}</main></section>`;
  }

  function renderInstructorDashboard(){
    const d=state.instructorData, pending=(d.profile_requests||[]).filter(x=>x.status==='pending').length;
    const upcoming=(d.live_sessions||[]).filter(x=>['scheduled','live'].includes(x.status));
    const issued=(d.certifications||[]).filter(x=>x.status==='approved').length;
    const content=`<div class="dashboard-metrics">${[[(d.courses||[]).length,'My courses','book'],[(d.students||[]).length,'Students','users'],[(d.quizzes||[]).length,'Quizzes','note'],[(d.assignments||[]).length,'Assignments','project'],[issued,'Certificates','award']].map(m=>`<article class="metric-card"><div class="metric-card-top"><span>${m[1]}</span><i class="metric-card-icon">${icon(m[2])}</i></div><strong>${m[0]}</strong><span>Instructor classroom</span></article>`).join('')}</div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Teaching workspace</h2><a href="#/instructor-courses">Manage courses</a></div><div class="instructor-quick-grid"><button type="button" data-action="instructor-course-new">${icon('book')}<span><strong>Create a course</strong><small>Build a public or private course page and protected classroom.</small></span></button><a href="#/instructor-live">${icon('radio')}<span><strong>Start a live class</strong><small>Schedule Zoom, add join/start links and recordings.</small></span></a><a href="#/instructor-quizzes">${icon('note')}<span><strong>Create a quiz</strong><small>Publish auto-graded questions to a private course.</small></span></a><a href="#/instructor-assignments">${icon('project')}<span><strong>Post an assignment</strong><small>Collect files, grade work and leave feedback.</small></span></a><button type="button" data-action="instructor-student-new">${icon('users')}<span><strong>Create student profile</strong><small>Generate the next FSA Academy ID and optionally enroll the student.</small></span></button><a href="#/instructor-certificates">${icon('award')}<span><strong>Issue a certificate</strong><small>Create verified certifications for your assigned students.</small></span></a></div></section><aside class="goal-card"><span class="eyebrow light">Instructor control centre</span><h3>Everything for teaching, in one menu.</h3><p>Create courses, lessons, PDFs, Zoom sessions, recordings, quizzes, assignments, student profiles and certificates without entering the admin panel.</p><div class="classroom-mini-stats"><span><strong>${pending}</strong> profile approvals</span><span><strong>${(d.submissions||[]).filter(x=>x.status==='submitted').length}</strong> work to grade</span></div></aside></div>
      <div class="panel" style="margin-top:20px"><div class="panel-head"><h2>Upcoming live classes</h2><a href="#/instructor-live">View all</a></div>${upcoming.length?`<div class="classroom-list">${upcoming.slice(0,4).map(item=>`<article class="classroom-row"><span class="classroom-row-icon">${icon('radio')}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.course_title||'Course')} · ${classroomDate(item.starts_at)}</small></div><span class="status-pill">${escapeHtml(item.status)}</span>${item.start_url?`<a class="button button-primary button-sm" href="${escapeHtml(item.start_url)}" target="_blank" rel="noopener">Start Zoom</a>`:''}</article>`).join('')}</div>`:'<p class="muted">No upcoming live classes. Schedule one from Live Classes.</p>'}</div>`;
    instructorShell('instructor-dashboard',content,`Welcome, ${escapeHtml(state.user.name.split(' ')[0])}.`,'Run your complete academy classroom from your instructor profile.');
  }

  function renderInstructorStudents(){
    const students=state.instructorData.students||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Student management</span><p>Create student accounts directly. Every new student automatically receives the next yearly Academy ID, for example FSA-026-0001.</p></div><button class="button button-primary" data-action="instructor-student-new">+ Create Student Profile</button></div>${students.length?`<div class="instructor-student-grid">${students.map(s=>`<article class="panel instructor-student-card"><div class="people-row"><span class="avatar">${initials(s.name)}</span><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.student_code||'Academy ID pending')} · ${escapeHtml(s.branch||'No branch')}</small></div></div><p>${escapeHtml(s.headline||'Academy learner')}</p><div class="student-course-tags">${(s.course_ids||[]).length?`<span>${(s.course_ids||[]).length} assigned course${(s.course_ids||[]).length===1?'':'s'}</span>`:'<span>No instructor course assigned</span>'}</div><div class="row-actions"><button class="button button-secondary button-sm" data-action="edit-instructor-student" data-id="${s.id}">${icon('edit')} Edit Profile</button><button class="button button-primary button-sm" data-action="add-student-certificate" data-id="${s.id}">${icon('award')} Issue Certificate</button></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>No students yet</h3><p>Create your first student profile. The system will generate the Academy ID automatically.</p><button class="button button-primary" data-action="instructor-student-new">Create Student Profile</button></div>`}`;
    instructorShell('instructor-students',content,'My Students','Create and manage your own learner profiles, credentials and course access.');
  }

  function renderInstructorCertificates(){
    const rows=state.instructorData.certifications||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Certification</span><p>Issue verified certificates to students assigned to you. Leave Credential ID blank to generate one automatically.</p></div><button class="button button-primary" data-action="instructor-certificate-new" ${(state.instructorData.students||[]).length?'':'disabled'}>+ Issue Certificate</button></div>${rows.length?`<div class="classroom-list">${rows.map(c=>`<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('award')}</span><div><span class="course-category">${escapeHtml(c.student_name||'Student')} ${c.student_code?`· ${escapeHtml(c.student_code)}`:''}</span><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.issuer||'Full Stack Academy')}${c.credential_id?` · ${escapeHtml(c.credential_id)}`:''}${c.issued_on?` · Issued ${escapeHtml(c.issued_on)}`:''}</p></div><span class="status-pill status-${escapeHtml(c.status||'approved')}">${escapeHtml(c.status||'approved')}</span></div><div class="row-actions">${c.certificate_url?`<a class="button button-secondary button-sm" href="${escapeHtml(c.certificate_url)}" target="_blank" rel="noopener">Open Certificate</a>`:''}<button class="button button-secondary button-sm" data-action="instructor-certificate-edit" data-id="${c.id}">${icon('edit')} Edit</button><button class="button button-ghost button-sm" data-action="instructor-certificate-delete" data-id="${c.id}">${icon('trash')}</button></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>No certificates issued yet</h3><p>Create a student first, then issue certificates from this page.</p></div>`}`;
    instructorShell('instructor-certificates',content,'Certificates','Create, publish and manage student certifications.');
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
  function syncBranchChrome(){
    const branches=Array.isArray(D.branches)?D.branches:[];
    const grid=document.querySelector('.branch-mega-grid');
    if(grid)grid.innerHTML=branches.map((b,i)=>`<a class="branch-mega-card" href="${escapeHtml(branchDetailUrl(b))}"><span class="branch-mega-image">${imageMarkup(b.image,`${b.name} branch`,'FSA')}<b>${String(i+1).padStart(2,'0')}</b></span><span class="branch-mega-card-copy"><small>${escapeHtml(b.location||b.address)}</small><strong>${escapeHtml(b.name)}</strong><em>View branch details</em></span><i aria-hidden="true" data-premium-icon="arrow"></i></a>`).join('');
    const mobile=document.querySelector('.mobile-branch-links');
    if(mobile)mobile.innerHTML=branches.map((b,i)=>`<a href="${escapeHtml(branchDetailUrl(b))}"><b>${String(i+1).padStart(2,'0')}</b> ${escapeHtml(b.shortName||b.name.replace(/^FSA\s*[—-]\s*/,''))}</a>`).join('');
    const count=document.querySelector('.mobile-branch-main span');if(count)count.textContent=`${String(branches.length).padStart(2,'0')} Centres`;
    const kicker=document.querySelector('.branch-mega-kicker');if(kicker)kicker.textContent=`${branches.length} Hyderabad Centre${branches.length===1?'':'s'}`;
  }
  async function refreshCatalogData(){const catalog=await apiRequest('catalog');if(Array.isArray(catalog.courses))D.courses=catalog.courses;if(Array.isArray(catalog.branches))D.branches=catalog.branches;if(Array.isArray(catalog.instructors))D.instructors=catalog.instructors;if(Array.isArray(catalog.batches))D.batches=catalog.batches;if(Array.isArray(catalog.companies))D.companies=catalog.companies;if(Array.isArray(catalog.alumni))D.alumni=catalog.alumni;if(Array.isArray(catalog.candidates))D.candidates=catalog.candidates;if(Array.isArray(catalog.events))D.events=catalog.events;if(Array.isArray(catalog.reviews))D.reviews=catalog.reviews;syncBranchChrome();syncCourseMegaMenu();}
  async function refreshPlacementPeopleData(){
    const [alumniResult,candidateResult]=await Promise.all([apiRequest('public_alumni'),apiRequest('public_candidates')]);
    if(Array.isArray(alumniResult.alumni))D.alumni=alumniResult.alumni;
    if(Array.isArray(candidateResult.candidates))D.candidates=candidateResult.candidates;
  }
  function instructorCourseById(id){return instructorCourses().find(c=>Number(c.id)===Number(id));}
  function instructorCourseOptions(selected=''){return instructorCourses().map(c=>`<option value="${c.id}" ${Number(selected)===Number(c.id)?'selected':''}>${escapeHtml(c.title)}</option>`).join('');}
  function instructorLessonOptions(courseId,selected=''){
    const course=instructorCourseById(courseId), options=['<option value="">Whole course / no specific lesson</option>'];
    lessonEntries(course||{}).forEach(item=>options.push(`<option value="${item.key}" ${String(selected)===item.key?'selected':''}>${escapeHtml(item.moduleTitle)} — ${escapeHtml(item.title)}</option>`));return options.join('');
  }

  function renderInstructorCourses(){
    const courses=instructorCourses();
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Course ownership</span><p>Build the public sales page and the protected student classroom separately.</p></div><button class="button button-primary" data-action="instructor-course-new">+ Add Course</button></div>${courses.length?`<div class="instructor-course-grid">${courses.map(c=>`<article class="panel instructor-course-card"><div class="instructor-course-cover">${c.image?imageMarkup(c.image,c.title,initials(c.title)):`<span>${icon('book')}</span>`}<span class="course-visibility ${c.visibility==='private'?'private':''}">${escapeHtml(c.visibility||'public')}</span></div><div class="instructor-course-body"><span class="course-category">${escapeHtml(c.category)}</span><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.short||'Add a short public course description.')}</p><div class="instructor-course-meta"><span>${c.lessons||0} lessons</span><span>${escapeHtml(c.status)}</span></div><div class="row-actions"><button class="button button-secondary button-sm" data-action="instructor-course-edit" data-id="${c.id}">${icon('edit')} Public Page</button><button class="button button-primary button-sm" data-action="instructor-content-edit" data-id="${c.id}">${icon('lock')} Private Classroom</button>${c.visibility!=='private'&&c.status==='published'?`<a class="button button-secondary button-sm" href="#/course/${encodeURIComponent(c.slug)}" target="_blank">View</a>`:''}<button class="button button-ghost button-sm" data-action="instructor-course-delete" data-id="${c.id}">${icon('trash')}</button></div></div></article>`).join('')}</div>`:`<div class="empty-state"><span class="empty-icon">${icon('book')}</span><h3>No instructor courses yet</h3><p>Create your first course, then add private lessons, PDFs, live classes, quizzes and assignments.</p><button class="button button-primary" data-action="instructor-course-new">Create Course</button></div>`}`;
    instructorShell('instructor-courses',content,'My Courses','Create your own course pages and protected learning content.');
  }

  function renderInstructorLive(){
    const rows=state.instructorData.live_sessions||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Zoom classroom</span><p>Save the Zoom join link for students and the host/start link for instructors. Add a recording after class.</p></div><button class="button button-primary" data-action="instructor-live-new" ${instructorCourses().length?'':'disabled'}>+ Schedule Live Class</button></div>${rows.length?`<div class="classroom-list">${rows.map(item=>`<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('radio')}</span><div><span class="course-category">${escapeHtml(item.course_title||'Course')}</span><h3>${escapeHtml(item.title)}</h3><p>${classroomDate(item.starts_at)}${item.lesson_key?` · Lesson ${escapeHtml(item.lesson_key)}`:''}</p></div><span class="status-pill status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></div><div class="classroom-link-strip">${item.meeting_id?`<span><strong>Meeting ID</strong>${escapeHtml(item.meeting_id)}</span>`:''}${item.passcode?`<span><strong>Passcode</strong>${escapeHtml(item.passcode)}</span>`:''}${item.recording_url?`<a href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener">Recording</a>`:''}</div><div class="row-actions">${item.start_url?`<a class="button button-primary button-sm" href="${escapeHtml(item.start_url)}" target="_blank" rel="noopener">${icon('video')} Start Zoom</a>`:''}${item.join_url?`<a class="button button-secondary button-sm" href="${escapeHtml(item.join_url)}" target="_blank" rel="noopener">Student Join Link</a>`:''}<button class="button button-secondary button-sm" data-action="instructor-live-edit" data-id="${item.id}">Edit</button><button class="button button-ghost button-sm" data-action="instructor-live-delete" data-id="${item.id}">${icon('trash')}</button></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>No live classes scheduled</h3><p>Create a course first, then schedule Zoom classes here.</p></div>`}`;
    instructorShell('instructor-live',content,'Live Classes','Schedule Zoom, start sessions and publish recordings to learners.');
  }

  function renderInstructorQuizzes(){
    const rows=state.instructorData.quizzes||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Assessments</span><p>Create multiple-choice or true/false quizzes and publish them inside a course or lesson.</p></div><button class="button button-primary" data-action="instructor-quiz-new" ${instructorCourses().length?'':'disabled'}>+ Create Quiz</button></div>${rows.length?`<div class="classroom-list">${rows.map(q=>`<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('note')}</span><div><span class="course-category">${escapeHtml(q.course_title||'Course')}</span><h3>${escapeHtml(q.title)}</h3><p>${(q.questions||[]).length} question${(q.questions||[]).length===1?'':'s'} · ${q.attempts_allowed||1} attempt${Number(q.attempts_allowed)===1?'':'s'}${q.due_at?` · Due ${classroomDate(q.due_at)}`:''}</p></div><span class="status-pill">${escapeHtml(q.status)}</span></div><div class="row-actions"><button class="button button-secondary button-sm" data-action="instructor-quiz-edit" data-id="${q.id}">${icon('edit')} Edit Quiz</button><button class="button button-ghost button-sm" data-action="instructor-quiz-delete" data-id="${q.id}">${icon('trash')}</button></div></article>`).join('')}</div>`:`<div class="empty-state"><h3>No quizzes yet</h3><p>Create an assessment and it will appear in the student's private Classroom tab.</p></div>`}`;
    instructorShell('instructor-quizzes',content,'Quizzes','Create and manage auto-graded course assessments.');
  }

  function renderInstructorAssignments(){
    const rows=state.instructorData.assignments||[], submissions=state.instructorData.submissions||[];
    const content=`<div class="instructor-page-actions"><div><span class="eyebrow">Classwork</span><p>Post instructions and attachments, then review student submissions and give grades/feedback.</p></div><button class="button button-primary" data-action="instructor-assignment-new" ${instructorCourses().length?'':'disabled'}>+ Create Assignment</button></div>${rows.length?`<div class="classroom-list">${rows.map(a=>{const count=submissions.filter(s=>Number(s.assignment_id)===Number(a.id)).length;return `<article class="panel classroom-manage-card"><div class="classroom-manage-head"><span class="classroom-row-icon">${icon('project')}</span><div><span class="course-category">${escapeHtml(a.course_title||'Course')}</span><h3>${escapeHtml(a.title)}</h3><p>${a.points} points${a.due_at?` · Due ${classroomDate(a.due_at)}`:''} · ${count} submission${count===1?'':'s'}</p></div><span class="status-pill">${escapeHtml(a.status)}</span></div><div class="row-actions"><button class="button button-secondary button-sm" data-action="instructor-assignment-edit" data-id="${a.id}">${icon('edit')} Edit</button><button class="button button-ghost button-sm" data-action="instructor-assignment-delete" data-id="${a.id}">${icon('trash')}</button></div></article>`}).join('')}</div>`:'<div class="empty-state"><h3>No assignments yet</h3><p>Create classwork for your students from this page.</p></div>'}<div class="panel" style="margin-top:20px"><div class="panel-head"><h2>Student submissions</h2><span>${submissions.length}</span></div>${submissions.length?`<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Student</th><th>Assignment</th><th>Course</th><th>Status</th><th>Grade</th><th></th></tr></thead><tbody>${submissions.map(sub=>`<tr><td>${escapeHtml(sub.student_name)}</td><td>${escapeHtml(sub.assignment_title||'Assignment')}</td><td>${escapeHtml(sub.course_title||'Course')}</td><td><span class="status-pill">${escapeHtml(sub.status)}</span></td><td>${sub.grade===null?'—':`${sub.grade}/${sub.points}`}</td><td><button class="button button-secondary button-sm" data-action="instructor-grade-submission" data-id="${sub.id}">Review</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">No student work has been submitted yet.</p>'}</div>`;
    instructorShell('instructor-assignments',content,'Assignments','Post classwork, collect files and grade submissions.');
  }

  function openClassroomModal(title,subtitle,body){document.getElementById('instructorClassroomModal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="profile-action-modal classroom-modal" id="instructorClassroomModal"><section class="profile-action-card classroom-modal-card"><button class="icon-button profile-action-close" data-action="close-classroom-modal">${icon('x')}</button><span class="eyebrow">Instructor classroom</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p>${body}</section></div>`);}

  function openInstructorCourseForm(course=null){
    openClassroomModal(course?'Edit course page':'Create course','Public information and visibility are controlled here. Private lessons are edited separately.',`<form id="instructorCourseForm" class="auth-form"><input type="hidden" name="id" value="${course?.id||''}"><div class="form-grid"><div class="form-group"><label>Course title</label><input class="form-control" name="title" required value="${escapeHtml(course?.title||'')}"></div><div class="form-group"><label>URL slug</label><input class="form-control" name="slug" value="${escapeHtml(course?.slug||'')}"></div><div class="form-group"><label>Category</label><input class="form-control" name="category" required value="${escapeHtml(course?.category||'Web Development')}"></div><div class="form-group"><label>Badge</label><input class="form-control" name="badge" value="${escapeHtml(course?.badge||'')}"></div><div class="form-group"><label>Visibility</label><select class="form-control" name="visibility"><option value="public" ${course?.visibility!=='private'?'selected':''}>Public course page</option><option value="private" ${course?.visibility==='private'?'selected':''}>Private / enrolled students only</option></select></div><div class="form-group"><label>Publishing</label><select class="form-control" name="status"><option value="draft" ${course?.status==='draft'?'selected':''}>Draft</option><option value="published" ${course?.status!=='draft'?'selected':''}>Published</option></select></div><div class="form-group full"><label>Cover image URL</label><input class="form-control" name="image" value="${escapeHtml(course?.image||'')}" placeholder="https://... or uploads/media/..."></div><div class="form-group full"><label>Short description</label><textarea class="form-control" name="short">${escapeHtml(course?.short||'')}</textarea></div><div class="form-group full"><label>Full public description</label><textarea class="form-control" name="description" rows="6">${escapeHtml(course?.description||'')}</textarea></div><div class="form-group"><label>Price</label><input class="form-control" type="number" min="0" step="0.01" name="price" value="${course?.price||0}"></div><div class="form-group"><label>Original price</label><input class="form-control" type="number" min="0" step="0.01" name="originalPrice" value="${course?.originalPrice||0}"></div><div class="form-group"><label>Duration</label><input class="form-control" name="duration" value="${escapeHtml(course?.duration||'')}"></div><div class="form-group"><label>Hours</label><input class="form-control" type="number" min="0" name="hours" value="${course?.hours||0}"></div><div class="form-group"><label>Level</label><input class="form-control" name="level" value="${escapeHtml(course?.level||'Beginner')}"></div><div class="form-group"><label>Language</label><input class="form-control" name="language" value="${escapeHtml(course?.language||'English')}"></div></div><button class="button button-primary button-block" type="submit">${course?'Save Course Page':'Create Course'}</button></form>`);
  }

  function recordingLines(lesson={}){return (Array.isArray(lesson.videos)?lesson.videos:[]).map(v=>`${v.title||'Recording'} | ${v.embedUrl||v.videoUrl||''}`).filter(x=>!x.endsWith('| ')).join('\n');}
  function resourceLines(lesson={}){return (Array.isArray(lesson.resources)?lesson.resources:[]).map(r=>`${r.title||'Resource'} | ${r.url||''}`).join('\n');}
  function instructorLessonEditor(lesson={}){return `<article class="ic-lesson"><div class="ic-builder-head"><strong>Lesson</strong><button type="button" data-action="ic-remove-lesson">Remove</button></div><div class="form-grid"><div class="form-group"><label>Lesson title</label><input class="form-control" data-field="ic-lesson-title" value="${escapeHtml(lesson.title||'')}"></div><div class="form-group"><label>Duration</label><input class="form-control" data-field="ic-lesson-duration" value="${escapeHtml(lesson.duration||'')}"></div><div class="form-group full"><label>Lesson overview</label><textarea class="form-control" rows="5" data-field="ic-lesson-content">${escapeHtml(lesson.content||'')}</textarea></div><div class="form-group full"><label>PDF lesson overview</label><div class="pdf-upload-row"><input class="form-control" data-field="ic-lesson-pdf" value="${escapeHtml(lesson.pdfUrl||'')}" placeholder="PDF URL or upload below"><label class="button button-secondary button-sm">Upload PDF<input class="sr-only" type="file" accept="application/pdf" data-field="ic-pdf-file"></label></div></div><div class="form-group full"><label>Recorded lesson videos <small>One per line: Title | embeddable HTTPS URL</small></label><textarea class="form-control" rows="4" data-field="ic-recordings" placeholder="Lesson recording | https://...">${escapeHtml(recordingLines(lesson))}</textarea></div><div class="form-group full"><label>Resources <small>One per line: Title | URL</small></label><textarea class="form-control" rows="3" data-field="ic-resources">${escapeHtml(resourceLines(lesson))}</textarea></div></div></article>`;}
  function instructorModuleEditor(module={}){const lessons=Array.isArray(module.lessons)&&module.lessons.length?module.lessons:[{}];return `<section class="ic-module"><div class="ic-builder-head"><div><strong>Module</strong><input class="form-control" data-field="ic-module-title" value="${escapeHtml(module.title||'')}" placeholder="Module title"></div><button type="button" data-action="ic-remove-module">Remove module</button></div><div class="ic-lessons">${lessons.map(instructorLessonEditor).join('')}</div><button class="button button-secondary button-sm" type="button" data-action="ic-add-lesson">+ Add Lesson</button></section>`;}
  function openInstructorContentForm(course){const modules=Array.isArray(course?.modules)?course.modules:[];openClassroomModal(`Private classroom — ${course.title}`,'Add protected lessons, PDF overviews, recorded video embeds and resources. Live classes, quizzes and assignments are managed from their own menu pages.',`<form id="instructorContentForm"><input type="hidden" name="course_id" value="${course.id}"><div class="ic-builder" id="instructorCurriculumBuilder">${modules.map(instructorModuleEditor).join('')}</div><button class="button button-secondary" type="button" data-action="ic-add-module">+ Add Module</button><button class="button button-primary" type="submit">Save Private Classroom</button></form>`);}
  function splitLineItems(value){return String(value||'').split(/\r?\n/).map(line=>{const [first,...rest]=line.split('|');const url=rest.join('|').trim();return {title:first.trim(),url};}).filter(x=>x.url);}
  function collectInstructorModules(form){return [...form.querySelectorAll('.ic-module')].map((module,mi)=>({title:module.querySelector('[data-field="ic-module-title"]')?.value.trim()||`Module ${mi+1}`,duration:'',lessons:[...module.querySelectorAll('.ic-lesson')].map(row=>{const rec=splitLineItems(row.querySelector('[data-field="ic-recordings"]')?.value||'');return {title:row.querySelector('[data-field="ic-lesson-title"]')?.value.trim()||'',duration:row.querySelector('[data-field="ic-lesson-duration"]')?.value.trim()||'',content:row.querySelector('[data-field="ic-lesson-content"]')?.value.trim()||'',pdfUrl:row.querySelector('[data-field="ic-lesson-pdf"]')?.value.trim()||'',preview:false,image:'',resources:splitLineItems(row.querySelector('[data-field="ic-resources"]')?.value||''),videos:rec.map((r,index)=>({title:r.title||`Recording ${index+1}`,duration:'',videoProvider:'embed',embedUrl:r.url,videoId:'',content:'',image:''}))};}).filter(l=>l.title)})).filter(m=>m.lessons.length||m.title);}

  function openInstructorLiveForm(item=null){const courseId=item?.course_id||instructorCourses()[0]?.id||'';openClassroomModal(item?'Edit live class':'Schedule live class','Paste the Zoom student join URL and the host/start URL. After class, add the cloud/local recording URL.',`<form id="instructorLiveForm" class="auth-form"><input type="hidden" name="id" value="${item?.id||''}"><div class="form-grid"><div class="form-group"><label>Course</label><select class="form-control" name="course_id" data-role="classroom-course-select" required>${instructorCourseOptions(courseId)}</select></div><div class="form-group"><label>Lesson (optional)</label><select class="form-control" name="lesson_key" data-role="classroom-lesson-select">${instructorLessonOptions(courseId,item?.lesson_key||'')}</select></div><div class="form-group full"><label>Class title</label><input class="form-control" name="title" required value="${escapeHtml(item?.title||'')}"></div><div class="form-group"><label>Starts</label><input class="form-control" type="datetime-local" name="starts_at" value="${classroomDateInput(item?.starts_at)}"></div><div class="form-group"><label>Ends</label><input class="form-control" type="datetime-local" name="ends_at" value="${classroomDateInput(item?.ends_at)}"></div><div class="form-group"><label>Meeting ID</label><input class="form-control" name="meeting_id" value="${escapeHtml(item?.meeting_id||'')}"></div><div class="form-group"><label>Passcode</label><input class="form-control" name="passcode" value="${escapeHtml(item?.passcode||'')}"></div><div class="form-group full"><label>Student Zoom join URL</label><input class="form-control" type="url" name="join_url" value="${escapeHtml(item?.join_url||'')}"></div><div class="form-group full"><label>Instructor Zoom start URL</label><input class="form-control" type="url" name="start_url" value="${escapeHtml(item?.start_url||'')}"></div><div class="form-group full"><label>Lesson recording URL</label><input class="form-control" type="url" name="recording_url" value="${escapeHtml(item?.recording_url||'')}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status">${['scheduled','live','ended','cancelled'].map(x=>`<option ${item?.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-group full"><label>Description</label><textarea class="form-control" name="description">${escapeHtml(item?.description||'')}</textarea></div></div><button class="button button-primary button-block" type="submit">Save Live Class</button></form>`);}

  function quizQuestionEditor(q={},index=0){const opts=Array.isArray(q.options)?q.options.join('\n'):'';return `<article class="quiz-question-editor"><div class="ic-builder-head"><strong>Question ${index+1}</strong><button type="button" data-action="quiz-remove-question">Remove</button></div><div class="form-grid"><div class="form-group full"><label>Question</label><input class="form-control" data-field="quiz-question" value="${escapeHtml(q.question||'')}"></div><div class="form-group"><label>Type</label><select class="form-control" data-field="quiz-type"><option value="mcq" ${q.type!=='true_false'?'selected':''}>Multiple choice</option><option value="true_false" ${q.type==='true_false'?'selected':''}>True / False</option></select></div><div class="form-group"><label>Correct answer #</label><input class="form-control" type="number" min="1" max="10" data-field="quiz-correct" value="${Number(q.correct??0)+1}"></div><div class="form-group"><label>Points</label><input class="form-control" type="number" min="1" max="100" data-field="quiz-points" value="${q.points||1}"></div><div class="form-group full"><label>Choices <small>One choice per line. For True/False this is ignored.</small></label><textarea class="form-control" rows="4" data-field="quiz-options">${escapeHtml(opts)}</textarea></div></div></article>`;}
  function openInstructorQuizForm(q=null){const courseId=q?.course_id||instructorCourses()[0]?.id||'';const questions=Array.isArray(q?.questions)&&q.questions.length?q.questions:[{}];openClassroomModal(q?'Edit quiz':'Create quiz','Students get instant scores for multiple-choice and true/false questions.',`<form id="instructorQuizForm"><input type="hidden" name="id" value="${q?.id||''}"><div class="form-grid"><div class="form-group"><label>Course</label><select class="form-control" name="course_id" data-role="classroom-course-select" required>${instructorCourseOptions(courseId)}</select></div><div class="form-group"><label>Lesson (optional)</label><select class="form-control" name="lesson_key" data-role="classroom-lesson-select">${instructorLessonOptions(courseId,q?.lesson_key||'')}</select></div><div class="form-group full"><label>Quiz title</label><input class="form-control" name="title" required value="${escapeHtml(q?.title||'')}"></div><div class="form-group"><label>Due date</label><input class="form-control" type="datetime-local" name="due_at" value="${classroomDateInput(q?.due_at)}"></div><div class="form-group"><label>Attempts allowed</label><input class="form-control" type="number" min="1" max="10" name="attempts_allowed" value="${q?.attempts_allowed||1}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="published" ${q?.status!=='draft'?'selected':''}>Published</option><option value="draft" ${q?.status==='draft'?'selected':''}>Draft</option></select></div><div class="form-group full"><label>Description</label><textarea class="form-control" name="description">${escapeHtml(q?.description||'')}</textarea></div></div><div id="quizQuestionBuilder">${questions.map(quizQuestionEditor).join('')}</div><button class="button button-secondary" type="button" data-action="quiz-add-question">+ Add Question</button><button class="button button-primary" type="submit">Save Quiz</button></form>`);}
  function collectQuizQuestions(form){return [...form.querySelectorAll('.quiz-question-editor')].map((row,index)=>{const type=row.querySelector('[data-field="quiz-type"]')?.value||'mcq';return {id:`q${index+1}`,question:row.querySelector('[data-field="quiz-question"]')?.value.trim()||'',type,options:type==='true_false'?['True','False']:String(row.querySelector('[data-field="quiz-options"]')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),correct:Math.max(0,Number(row.querySelector('[data-field="quiz-correct"]')?.value||1)-1),points:Number(row.querySelector('[data-field="quiz-points"]')?.value||1)};}).filter(q=>q.question);}

  function openInstructorAssignmentForm(a=null){const courseId=a?.course_id||instructorCourses()[0]?.id||'';openClassroomModal(a?'Edit assignment':'Create assignment','Students can submit a written response and/or an attachment. You can grade every submission here.',`<form id="instructorAssignmentForm" class="auth-form" enctype="multipart/form-data"><input type="hidden" name="id" value="${a?.id||''}"><div class="form-grid"><div class="form-group"><label>Course</label><select class="form-control" name="course_id" data-role="classroom-course-select" required>${instructorCourseOptions(courseId)}</select></div><div class="form-group"><label>Lesson (optional)</label><select class="form-control" name="lesson_key" data-role="classroom-lesson-select">${instructorLessonOptions(courseId,a?.lesson_key||'')}</select></div><div class="form-group full"><label>Assignment title</label><input class="form-control" name="title" required value="${escapeHtml(a?.title||'')}"></div><div class="form-group"><label>Due date</label><input class="form-control" type="datetime-local" name="due_at" value="${classroomDateInput(a?.due_at)}"></div><div class="form-group"><label>Points</label><input class="form-control" type="number" min="0" step="0.5" name="points" value="${a?.points??100}"></div><div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="published" ${a?.status!=='draft'?'selected':''}>Published</option><option value="draft" ${a?.status==='draft'?'selected':''}>Draft</option></select></div><div class="form-group full"><label>Instructions</label><textarea class="form-control" rows="6" name="instructions">${escapeHtml(a?.instructions||'')}</textarea></div><div class="form-group full"><label>Attachment URL</label><input class="form-control" name="attachment_url" value="${escapeHtml(a?.attachment_url||'')}"></div><div class="form-group full"><label>Or upload attachment</label><input class="form-control" type="file" name="attachment" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp"></div></div><button class="button button-primary button-block" type="submit">Save Assignment</button></form>`);}

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
      <section class="classroom-student-section"><div class="panel-head"><h4>${icon('radio')} Live classes & recordings</h4><span>${sessions.length}</span></div>${sessions.length?`<div class="classroom-list">${sessions.map(item=>`<article class="classroom-row student"><span class="classroom-row-icon">${icon(item.status==='ended'?'video':'radio')}</span><div><strong>${escapeHtml(item.title)}</strong><small>${classroomDate(item.starts_at)} · ${escapeHtml(item.status)}</small>${item.description?`<p>${escapeHtml(item.description)}</p>`:''}</div><div class="classroom-row-actions">${item.join_url&&item.status!=='ended'?`<a class="button button-primary button-sm" href="${escapeHtml(item.join_url)}" target="_blank" rel="noopener">Join Zoom</a>`:''}${item.recording_url?`<a class="button button-secondary button-sm" href="${escapeHtml(item.recording_url)}" target="_blank" rel="noopener">Watch Recording</a>`:''}</div></article>`).join('')}</div>`:'<p class="muted">No live class or recording has been attached to this lesson yet.</p>'}</section>
      <section class="classroom-student-section"><div class="panel-head"><h4>${icon('note')} Quizzes</h4><span>${quizzes.length}</span></div>${quizzes.length?`<div class="classwork-card-grid">${quizzes.map(q=>{const a=attempts[q.id]||{};const used=Number(a.attempts||0),left=Math.max(0,Number(q.attempts_allowed||1)-used);return `<article class="classwork-card"><span class="classwork-icon">${icon('note')}</span><div><strong>${escapeHtml(q.title)}</strong><p>${escapeHtml(q.description||`${(q.questions||[]).length} questions`)}</p><small>${q.due_at?`Due ${classroomDate(q.due_at)} · `:''}${left} attempt${left===1?'':'s'} left${used?` · Best ${a.best_score}/${a.max_score}`:''}</small></div><button class="button button-primary button-sm" data-action="student-open-quiz" data-id="${q.id}" ${left<1?'disabled':''}>${used?'Try Again':'Start Quiz'}</button></article>`}).join('')}</div>`:'<p class="muted">No quiz has been assigned here.</p>'}</section>
      <section class="classroom-student-section"><div class="panel-head"><h4>${icon('project')} Assignments</h4><span>${assignments.length}</span></div>${assignments.length?`<div class="classwork-card-grid">${assignments.map(a=>{const sub=submissions[a.id]||null;return `<article class="classwork-card"><span class="classwork-icon">${icon('project')}</span><div><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.instructions||'Open the assignment to view instructions and submit your work.')}</p><small>${a.points} points${a.due_at?` · Due ${classroomDate(a.due_at)}`:''}${sub?` · ${sub.status==='graded'?`Graded ${sub.grade}/${a.points}`:'Submitted'}`:''}</small></div><button class="button ${sub?'button-secondary':'button-primary'} button-sm" data-action="student-open-assignment" data-id="${a.id}">${sub?'View / Resubmit':'Open Assignment'}</button></article>`}).join('')}</div>`:'<p class="muted">No assignment has been posted here.</p>'}</section></div>`;
  }

  function currentSecureCourse(){const slug=state.currentPath.split('/')[2];return state.playerCourses[slug]?.course||courseBySlug(slug);}
  function closeStudentClassroomModal(){document.getElementById('studentClassroomModal')?.remove();}
  function openStudentClassroomModal(title,body){closeStudentClassroomModal();document.body.insertAdjacentHTML('beforeend',`<div class="profile-action-modal classroom-modal" id="studentClassroomModal"><section class="profile-action-card classroom-modal-card"><button class="icon-button profile-action-close" data-action="close-student-classroom-modal">${icon('x')}</button><span class="eyebrow">Private classroom</span><h2>${escapeHtml(title)}</h2>${body}</section></div>`);}
  function openStudentQuiz(quizId){const course=currentSecureCourse(),quiz=(course?.classroom?.quizzes||[]).find(q=>Number(q.id)===Number(quizId));if(!quiz)return;const attempt=course.classroom?.quiz_attempts?.[quiz.id]||{};openStudentClassroomModal(quiz.title,`<p>${escapeHtml(quiz.description||'Choose one answer for every question.')}</p>${attempt.attempts?`<div class="quiz-score-note">Previous best: <strong>${attempt.best_score}/${attempt.max_score}</strong></div>`:''}<form id="studentQuizForm" class="auth-form"><input type="hidden" name="quiz_id" value="${quiz.id}"><div class="student-quiz-questions">${(quiz.questions||[]).map((q,index)=>`<fieldset class="student-quiz-question"><legend><span>${index+1}</span>${escapeHtml(q.question)}</legend>${(q.options||[]).map((option,oi)=>`<label><input type="radio" name="q_${escapeHtml(q.id)}" value="${oi}" required><span>${escapeHtml(option)}</span></label>`).join('')}</fieldset>`).join('')}</div><button class="button button-primary button-block" type="submit">Submit Quiz</button></form>`);}
  function openStudentAssignment(assignmentId){const course=currentSecureCourse(),a=(course?.classroom?.assignments||[]).find(x=>Number(x.id)===Number(assignmentId));if(!a)return;const sub=course.classroom?.assignment_submissions?.[a.id]||{};openStudentClassroomModal(a.title,`<div class="assignment-brief"><p>${textHtml(a.instructions||'Complete the assignment and submit your work below.')}</p><div class="assignment-meta"><span>${a.points} points</span>${a.due_at?`<span>Due ${classroomDate(a.due_at)}</span>`:''}</div>${a.attachment_url?`<a class="button button-secondary button-sm" href="${escapeHtml(a.attachment_url)}" target="_blank" rel="noopener">${icon('download')} Instructor attachment</a>`:''}${sub.status==='graded'?`<div class="graded-feedback"><strong>Grade: ${sub.grade}/${a.points}</strong><p>${escapeHtml(sub.feedback||'No feedback added.')}</p></div>`:''}</div><form id="studentAssignmentForm" class="auth-form" enctype="multipart/form-data"><input type="hidden" name="assignment_id" value="${a.id}"><input type="hidden" name="file_url" value="${escapeHtml(sub.file_url||'')}"><div class="form-group"><label>Written response</label><textarea class="form-control" rows="6" name="submission_text">${escapeHtml(sub.submission_text||'')}</textarea></div><div class="form-group"><label>Attach file <small>PDF, Office, ZIP, image or text; max 20 MB.</small></label><input class="form-control" type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp"></div>${sub.file_url?`<a href="${escapeHtml(sub.file_url)}" target="_blank" rel="noopener">Current submitted attachment</a>`:''}<button class="button button-primary button-block" type="submit">${sub.submitted_at?'Resubmit Assignment':'Turn In Assignment'}</button></form>`);}
  async function refreshSecureClassroom(){const slug=state.currentPath.split('/')[2];if(slug){delete state.playerCourses[slug];await renderPlayer(slug);}}

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
    return `<div class="lesson-tabs-content lesson-reading"><h3>${escapeHtml(lecture?.title||'About this lesson')}</h3>${lectureContent?`<div class="lesson-rich-text">${textHtml(lectureContent)}</div>`:''}${lecture?.image?`<div class="lesson-reading-image">${imageMarkup(lecture.image,lecture.title||lesson.title,initials(course.title))}</div>`:''}${lessonContent?`<div class="lesson-overview-block"><h4>Lesson overview</h4><div class="lesson-rich-text">${textHtml(lessonContent)}</div></div>`:(!lectureContent?`<p>This lesson is part of <strong>${escapeHtml(course.title)}</strong> and focuses on <strong>${escapeHtml(lesson.title)}</strong>.</p>`:'')}${!lecture?.image&&lesson.image?lessonImageMarkup(lesson,course):''}${lesson.pdfUrl?`<div class="lesson-overview-pdf"><span>${icon('note')}<span><strong>PDF lesson overview</strong><small>Open or download the instructor's lesson summary.</small></span></span><a class="button button-secondary button-sm" href="${escapeHtml(lesson.pdfUrl)}" target="_blank" rel="noopener">${icon('download')} Open PDF</a></div>`:''}</div>`;
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
  async function renderPlayer(slug) {
    if (!state.loggedIn) { routeTo('/login'); return; }
    const baseCourse = courseBySlug(slug);
    if (!baseCourse) return renderNotFound();
    if (!state.enrollments.includes(Number(baseCourse.id))) { toast('This course is not active in your account. Contact the academy for access.','error'); routeTo('/my-courses'); return; }
    setChrome('player');
    app.innerHTML='<section class="player-loading"><div class="loading-spinner"></div><strong>Opening your secure course…</strong></section>';
    let course;
    try{course=await securePlayerCourse(slug,baseCourse);}catch(error){app.innerHTML=`<section class="page-section section-surface" style="min-height:70vh;display:grid;align-items:center"><div class="container"><article class="success-card"><span class="success-icon">${icon('lock')}</span><span class="eyebrow">Course Access</span><h1>Course could not be opened.</h1><p>${escapeHtml(error.message)}</p><div class="cta-actions"><a class="button button-primary" href="#/my-courses">Back to My Courses</a><a class="button button-secondary" href="#/contact">Contact Academy</a></div></article></div></section>`;return;}
    const entries = lessonEntries(course);
    if (!entries.length) {
      app.innerHTML = `<section class="page-section section-surface" style="min-height:70vh;display:grid;align-items:center"><div class="container"><article class="success-card"><span class="success-icon">${icon('book')}</span><span class="eyebrow">Course Content</span><h1>Lessons have not been added yet.</h1><p>The course is active in your account, but the administrator has not published any curriculum lessons.</p><div class="cta-actions"><a class="button button-primary" href="#/course/${encodeURIComponent(course.slug)}">View Course Details</a><a class="button button-secondary" href="#/my-courses">Back to My Courses</a></div></article></div></section>`;
      return;
    }
    const current = currentLessonFor(course);
    const currentLecture=currentLectureFor(course,current);
    const index = entries.findIndex(e=>e.key===current.key);
    const done = new Set(state.progress[course.id] || []);
    const percent = progressPercent(course.id);
    app.innerHTML = `<section class="player-shell"><div class="player-topbar"><a class="button button-secondary button-sm" href="#/my-courses">${icon('arrowLeft')} Back</a><div class="player-course-title"><strong>${escapeHtml(course.title)}</strong><span>${escapeHtml(current.moduleTitle)} · ${escapeHtml(current.title)}</span></div><div class="player-progress-top"><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><span>${percent}% complete</span></div></div><div class="player-layout"><main class="lesson-stage">${lectureTabs(course,current,currentLecture)}${lectureVideoMarkup(course,current,currentLecture)}<div class="lesson-title-row"><div><span class="course-category">${escapeHtml(current.moduleTitle)}</span><h1>${escapeHtml(current.title)}</h1><p>Lesson ${index+1} of ${entries.length}${current.duration?` · ${escapeHtml(current.duration)}`:''}${lectureList(current).length?` · ${lectureList(current).length} video${lectureList(current).length===1?'':'s'}`:''}</p></div><div class="lesson-nav-actions"><button class="button button-secondary button-sm" data-action="previous-lesson" data-course="${course.id}" ${index===0?'disabled':''}>${icon('arrowLeft')} Previous</button><button class="button ${done.has(current.key)?'button-secondary':'button-primary'} button-sm" data-action="mark-complete" data-course="${course.id}" data-key="${current.key}">${icon('check')} ${done.has(current.key)?'Completed':'Mark Complete'}</button><button class="button button-secondary button-sm" data-action="next-lesson" data-course="${course.id}" ${index===entries.length-1?'disabled':''}>Next ${icon('arrow')}</button></div></div><div class="tabs">${[['overview','Overview'],['classroom','Classroom'],['notes','Notes'],['resources','Resources'],['discussion','Discussion']].map(t=>`<button class="tab-button ${state.lessonTab===t[0]?'active':''}" data-action="lesson-tab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div id="lessonTabPanel">${playerTabContent(course,current,state.lessonTab)}</div></main><aside class="curriculum-sidebar"><div class="curriculum-sidebar-head"><h2>Course content</h2><p class="muted" style="font-size:10px;margin:5px 0 0">${completedLessons(course.id)} of ${entries.length} lessons complete</p></div>${course.modules.map((module,mi)=>`<article class="player-module ${mi===current.mi||mi===0?'open':''}"><button class="player-module-head" data-action="toggle-player-module"><span><strong>${mi+1}. ${escapeHtml(module.title)}</strong><span>${module.lessons.length} lessons${module.duration?` · ${escapeHtml(module.duration)}`:''}</span></span>${icon('chevronDown')}</button><div class="player-module-lessons">${module.lessons.map((lesson,li)=>{const key=`${mi}-${li}`,videoCount=lectureList(lesson).length;return `<button class="player-lesson ${done.has(key)?'completed':''} ${current.key===key?'active':''}" data-action="select-lesson" data-course="${course.id}" data-key="${key}"><span class="player-lesson-status">${done.has(key)?icon('check'):icon(videoCount?'play':'book')}</span><span><strong>${escapeHtml(lesson.title)}</strong><span>${escapeHtml(lesson.duration||'Reading')}${videoCount?` · ${videoCount} video${videoCount===1?'':'s'}`:''}</span></span>${lesson.preview?'<span class="preview-label">Preview</span>':''}</button>`}).join('')}</div></article>`).join('')}</aside></div></section>`;
    initPage();
  }

  function renderHelp() {
    setChrome('public');
    const items = [...D.faqs,{q:'How do I create a learner account?',a:'Open the registration page, enter your contact information and choose a secure password of at least eight characters.'},{q:'How can I reset my password?',a:'Use the Forgot Password link on the sign-in page. Password reset emails are delivered through the academy SMTP system.'}];
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
    app.innerHTML=`${pageHero({eyebrow:'Academy Policy',title,text:intro,center:true})}<section class="page-section section-surface"><div class="container legal-premium-shell"><aside class="legal-premium-nav"><span>On this page</span>${sections.map(([id,h])=>`<a href="#${id}"><i class="premium-link-icon">${icon(id==='security'?'shield':id==='contact'?'mail':'file')}</i>${escapeHtml(h)}</a>`).join('')}</aside><article class="legal-premium-content"><div class="legal-updated">${icon('calendar')} Last updated: September 2026</div>${sections.map(([id,h,body])=>`<section id="${id}"><h2>${escapeHtml(h)}</h2><p>${escapeHtml(body)}</p></section>`).join('')}</article></div></section>`;
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
    items.innerHTML = `${t.courseItems.map(c=>`<article class="cart-mini-item"><span class="cart-mini-thumb">${imageMarkup(c.image,c.title,initials(c.title))}</span><span><strong>${c.title}</strong><small>${deliveryModeLabel(c.cartMode)}</small><span>${money(c.price)}</span></span><button data-action="remove-cart" data-id="${c.id}" data-mode="${c.cartMode}" aria-label="Remove ${c.title}">${icon('trash')}</button></article>`).join('')}`;
    drawerFooter.innerHTML = `<div class="cart-drawer-total"><span>Total</span><strong>${money(t.total)}</strong></div><a class="button button-primary button-block" href="#/cart">Review Cart</a><a class="button button-secondary button-block" href="#/checkout">Checkout</a>`;
  }

  function addToCart(id, mode = '', silent = false) {
    id = Number(id);
    const base=courseById(id); if(!base)return;
    const backendMode=['offline','live','recorded'].includes(mode)?mode:uiModeToBackend(defaultCourseUiMode(base));
    const item={courseId:id,mode:backendMode};
    if (!state.cart.some(existing=>cartKey(normalizeCartEntry(existing)||{})===cartKey(item))) {
      state.cart.push(item); write(LS.cart,state.cart);
      if (!silent) toast(`${deliveryModeLabel(backendMode)} course added to your cart.`);
    } else if (!silent) toast('This course and learning mode are already in your cart.');
    updateHeader(); updateCartDrawer();
  }

  function removeFromCart(id, mode = '') {
    const targetId=Number(id);
    state.cart = state.cart.filter(entry=>{const item=normalizeCartEntry(entry);return item && !(item.courseId===targetId && (!mode || item.mode===mode));}); write(LS.cart,state.cart);
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
    if (state.currentPath.startsWith('/course/')) renderCourseDetail(state.currentPath.split('/')[2]);
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
      const okay = input.type === 'checkbox' ? input.checked : input.value.trim() !== '' && input.checkValidity();
      input.classList.toggle('invalid',!okay);
      valid = valid && okay;
    });
    if (!valid) toast('Please complete the highlighted required fields.','error');
    return valid;
  }

  async function completeCheckout(form) {
    if (!state.loggedIn) { toast('Please sign in before placing an order.','error'); routeTo('/login'); return; }
    if (!validateForm(form)) return;
    const t = cartTotals();
    const fd = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton?.innerHTML;
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Placing Order…'; }
    try {
      const result = await apiRequest('checkout_create', { method:'POST', body:{
        course_ids: t.courseItems.map(course => course.id), course_items: t.courseItems.map(course => ({course_id:course.id, delivery_mode:course.cartMode})), plan_id: '', billing: '', coupon: state.coupon || '',
        name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'),
        country: fd.get('country'), state: fd.get('state'), address: fd.get('address'), city: fd.get('city'), postal: fd.get('postal'),
        payment_method: fd.get('payment'), message: fd.get('message') || ''
      }});
      state.user.name = fd.get('name'); state.user.email = fd.get('email'); state.user.phone = fd.get('phone');
      write(LS.user,state.user);
      write(LS.lastOrder,result.order);
      state.cart = []; state.coupon = null;
      write(LS.cart,[]);
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
    if (formId === 'checkoutForm') return completeCheckout(form);
    if (formId === 'loginForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      try {
        const result = await apiRequest('auth_login', { method:'POST', body:{ identifier:fd.get('identifier'), account_type:fd.get('account_type'), password:fd.get('password'), remember:fd.get('remember')==='on' } });
        if (result.user.role === 'admin') { toast('Opening the administrator dashboard.'); setTimeout(()=>{ window.location.href=ADMIN_URL; },250); return; }
        state.user = { ...state.user, ...result.user, joined: new Date(result.user.created_at || Date.now()).toLocaleDateString(siteSettings.locale || 'en-IN',{month:'long',year:'numeric'}) };
        state.loggedIn = true; write(LS.user,state.user); write(LS.loggedIn,true);
        if(result.user.role==='instructor') await syncInstructorData(); else await syncStudentData();
        toast('Signed in successfully.'); routeTo(result.user.role==='instructor'?'/instructor-dashboard':'/dashboard');
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
        const accountType=fd.get('account_type')==='instructor'?'instructor':'student';
        const result = await apiRequest('auth_register', { method:'POST', body:{ account_type:accountType,name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone'),password:fd.get('password'),headline:fd.get('headline'),branch:fd.get('branch'),bio:fd.get('bio'),skills:String(fd.get('skills')||'').split(',').map(x=>x.trim()).filter(Boolean) } });
        if(accountType==='instructor'){
          state.loggedIn=false;write(LS.loggedIn,false);toast(result.message);routeTo('/login');return;
        }
        state.user = { ...state.user, ...result.user, joined: new Date(result.user.created_at || Date.now()).toLocaleDateString(siteSettings.locale || 'en-IN',{month:'long',year:'numeric'}) };
        state.loggedIn = true;
        write(LS.user,state.user);
        write(LS.loggedIn,true);
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
        routeTo('/dashboard');
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
    if (formId === 'profileForm') {
      if (!validateForm(form)) return;
      const fd = new FormData(form);
      try {
        const result = await apiRequest('profile_update',{method:'POST',body:{name:fd.get('name'),phone:fd.get('phone'),headline:fd.get('headline'),bio:fd.get('bio'),city:fd.get('city'),country:fd.get('country'),branch:fd.get('branch'),skills:String(fd.get('skills')||'').split(',').map(x=>x.trim()).filter(Boolean),profile_public:fd.get('profile_public')==='on'}});
        ['name','email','phone','headline','city','country','bio'].forEach(k=>state.user[k]=fd.get(k));
        state.user = { ...state.user, ...result.user }; write(LS.user,state.user); toast(result.message); renderProfile(); initPage();
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
    if(formId==='instructorCourseForm'){
      if(!validateForm(form))return;const fd=new FormData(form),body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.price=Number(body.price||0);body.originalPrice=Number(body.originalPrice||0);body.hours=Number(body.hours||0);
      try{const r=await apiRequest('instructor_course_save',{method:'POST',body});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await Promise.all([syncInstructorData(),refreshCatalogData()]);renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorContentForm'){
      const courseId=Number(new FormData(form).get('course_id')||0),modules=collectInstructorModules(form);
      try{const r=await apiRequest('instructor_course_content_save',{method:'POST',body:{course_id:courseId,modules}});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorLiveForm'){
      if(!validateForm(form))return;const fd=new FormData(form),body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.course_id=Number(body.course_id||0);body.starts_at=sqlDateTime(body.starts_at);body.ends_at=sqlDateTime(body.ends_at);
      try{const r=await apiRequest('instructor_live_save',{method:'POST',body});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorLive();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorQuizForm'){
      if(!validateForm(form))return;const fd=new FormData(form),questions=collectQuizQuestions(form);if(!questions.length){toast('Add at least one valid quiz question.','error');return;}const body=Object.fromEntries(fd.entries());body.id=Number(body.id||0);body.course_id=Number(body.course_id||0);body.attempts_allowed=Number(body.attempts_allowed||1);body.due_at=sqlDateTime(body.due_at);body.questions=questions;
      try{const r=await apiRequest('instructor_quiz_save',{method:'POST',body});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorQuizzes();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorAssignmentForm'){
      if(!validateForm(form))return;const fd=new FormData(form);fd.set('due_at',sqlDateTime(fd.get('due_at')));
      try{const r=await apiRequest('instructor_assignment_save',{method:'POST',body:fd});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorAssignments();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='instructorGradeForm'){
      if(!validateForm(form))return;const fd=new FormData(form);try{const r=await apiRequest('instructor_submission_grade',{method:'POST',body:{id:Number(fd.get('id')),grade:Number(fd.get('grade')),feedback:fd.get('feedback')}});toast(r.message);document.getElementById('instructorClassroomModal')?.remove();await syncInstructorData();renderInstructorAssignments();initPage();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='studentQuizForm'){
      const course=currentSecureCourse(),quiz=(course?.classroom?.quizzes||[]).find(q=>Number(q.id)===Number(new FormData(form).get('quiz_id')));if(!quiz)return;const answers={};let missing=false;(quiz.questions||[]).forEach(q=>{const checked=form.querySelector(`[name="q_${CSS.escape(String(q.id))}"]:checked`);if(!checked)missing=true;else answers[q.id]=Number(checked.value);});if(missing){toast('Answer every quiz question before submitting.','error');return;}
      try{const r=await apiRequest('student_quiz_submit',{method:'POST',body:{quiz_id:Number(quiz.id),answers}});toast(`Quiz submitted: ${r.score}/${r.max_score} (${r.percent}%).`);closeStudentClassroomModal();await refreshSecureClassroom();}catch(error){toast(error.message,'error');}return;
    }
    if(formId==='studentAssignmentForm'){
      const fd=new FormData(form);try{const r=await apiRequest('student_assignment_submit',{method:'POST',body:fd});toast(r.message);closeStudentClassroomModal();await refreshSecureClassroom();}catch(error){toast(error.message,'error');}return;
    }
    if (formId === 'learningPreferencesForm') {
      const fd = new FormData(form); state.user.weeklyGoal = Math.max(1,Math.min(40,Number(fd.get('weeklyGoal')||5))); state.user.notifications = fd.get('notifications') === 'on';
      try { const result = await apiRequest('profile_preferences',{method:'POST',body:{weekly_goal:state.user.weeklyGoal,notifications:state.user.notifications}}); write(LS.user,state.user); toast(result.message); } catch (error) { toast(error.message,'error'); } return;
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
    if(input.matches('#registerForm [name="account_type"]')){
      const instructor=input.value==='instructor';
      const button=document.getElementById('registerSubmitButton');if(button)button.textContent=instructor?'Submit Instructor Profile':'Create Student Account';
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
        if (input.id === 'avatarInput' && input.files?.[0]) {
      const file = input.files[0];
      if (file.size > 1048576) { toast('Please choose an image smaller than 1 MB.','error'); return; }
      const formData = new FormData(); formData.append('avatar', file);
      try {
        const result = await apiRequest('profile_avatar',{method:'POST',body:formData});
        state.user = { ...state.user, ...result.user }; write(LS.user,state.user);
        toast(result.message); renderProfile(); initPage();
      } catch (error) { toast(error.message,'error'); }
    }
  }

  let searchTimer;
  function handleInput(event) {
    if (event.target.id === 'courseSearchInput') {
      clearTimeout(searchTimer); searchTimer = setTimeout(()=>{ state.courseFilters.query = event.target.value; updateCoursesResults(); },170);
    }
    if (event.target.matches('[data-batch-search-input]')) {
      clearTimeout(searchTimer); searchTimer = setTimeout(()=>{ state.batchQuery = event.target.value; const course=state.currentPath.startsWith('/course/')?courseBySlug(state.currentPath.split('/')[2]):null; updateBatchResults(course); },170);
    }
    if (event.target.id === 'globalSearchInput') updateGlobalSearch(event.target.value);
    if (event.target.id === 'eventSearchInput') {
      clearTimeout(searchTimer); searchTimer = setTimeout(()=>updateEventArchiveQuery({q:event.target.value}),220);
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
      if(!event.target.closest('[data-event-filter-dropdown]')) document.querySelectorAll('[data-event-filter-dropdown].open').forEach(item=>{item.classList.remove('open');item.querySelector('[data-action="event-filter-toggle"]')?.setAttribute('aria-expanded','false');});
      if(!event.target.closest('[data-add-calendar]')) document.querySelectorAll('[data-add-calendar].open').forEach(item=>{item.classList.remove('open');item.querySelector('[data-action="event-calendar-toggle"]')?.setAttribute('aria-expanded','false');});
      if (event.target === mobileMenu || event.target === cartDrawer || event.target === searchModal) closeOverlays();
      if (event.target.closest('.mobile-nav a,.mobile-account-links a,.drawer-footer a')) closeOverlays();
      return;
    }
    const action = target.dataset.action;
    if (action === 'open-mobile-menu') openOverlay(mobileMenu);
    if (action === 'close-mobile-menu') closeOverlays();
    if (action === 'open-cart') { updateCartDrawer(); openOverlay(cartDrawer); }
    if (action === 'close-cart') closeOverlays();
    if (action === 'open-search') { updateGlobalSearch(); openOverlay(searchModal); setTimeout(()=>document.getElementById('globalSearchInput')?.focus(),100); }
    if (action === 'close-search') closeOverlays();
    if (action === 'close-announcement') { write(LS.announcement,true); announcement.style.display='none'; }
    if (action === 'scroll-top') window.scrollTo({top:0,behavior:'smooth'});
    if (action === 'scroll-events') document.getElementById('event-list')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (action === 'event-category') updateEventArchiveQuery({category:target.dataset.value || 'all'});
    if (action === 'event-view') updateEventArchiveQuery({view:target.dataset.view || 'grid'});
    if (action === 'event-filter-toggle') {
      const dropdown=target.closest('[data-event-filter-dropdown]');
      const open=!dropdown?.classList.contains('open');
      document.querySelectorAll('[data-event-filter-dropdown].open').forEach(item=>{item.classList.remove('open');item.querySelector('[data-action="event-filter-toggle"]')?.setAttribute('aria-expanded','false');});
      if(dropdown && open){dropdown.classList.add('open');target.setAttribute('aria-expanded','true');}
    }
    if (action === 'event-filter-option') {
      const filter=target.dataset.filter; const value=target.dataset.value || 'all';
      if(filter && ['category','location','year'].includes(filter)) updateEventArchiveQuery({[filter]:value});
    }
    if (action === 'event-clear-filters') updateEventArchiveQuery({q:'',category:'all',location:'all',year:'all'});
    if (action === 'event-media-thumb') updateEventMedia(Number(target.dataset.index || 0));
    if (action === 'event-media-prev' || action === 'event-media-next') { const root=document.querySelector('[data-event-media-root]'); const current=Number(root?.dataset.current || 0); updateEventMedia(current + (action==='event-media-next'?1:-1)); }
    if (action === 'event-calendar-toggle') {
      const menu=target.closest('[data-add-calendar]'); const open=!menu?.classList.contains('open');
      document.querySelectorAll('[data-add-calendar].open').forEach(item=>{item.classList.remove('open');item.querySelector('[data-action="event-calendar-toggle"]')?.setAttribute('aria-expanded','false');});
      if(menu && open){menu.classList.add('open');target.setAttribute('aria-expanded','true');}
    }
    if (action === 'event-add-calendar') { const item=eventBySlug(target.dataset.slug); if(item){ downloadEventCalendar(item); target.closest('[data-add-calendar]')?.classList.remove('open'); toast('Calendar file downloaded.'); } }
    if (action === 'add-cart') addToCart(target.dataset.id,target.dataset.mode||'');
    if (action === 'remove-cart') removeFromCart(target.dataset.id,target.dataset.mode||'');
    if (action === 'open-cart') { updateCartDrawer(); openOverlay(cartDrawer); }
    if (action === 'buy-now') { addToCart(target.dataset.id,true); routeTo('/checkout'); }
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
    if (action === 'detail-mode') {
      state.detailDeliveryMode=target.dataset.mode||'live';
      if(state.currentPath.startsWith('/course/')){
        renderCourseDetail(state.currentPath.split('/')[2]);
        initPage();
      }
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
    if (action === 'logout') { try { await apiRequest('auth_logout',{method:'POST',body:{}}); } catch (_) {} state.loggedIn=false; state.enrollments=[]; state.pendingEnrollments=[]; state.progress={}; state.orders=[]; state.assignedCourses=[]; state.playerCourses={}; state.instructorData={students:[],profile_requests:[],certificate_requests:[],certifications:[],courses:[],live_sessions:[],quizzes:[],assignments:[],submissions:[]}; write(LS.loggedIn,false); try{await refreshCatalogData();}catch(_){} toast('Signed out successfully.'); routeTo('/'); }
    if (action === 'toggle-dashboard-nav') document.getElementById('dashboardSidebar')?.classList.toggle('open');
    if(action==='instructor-student-new')openInstructorStudentForm();
    if(action==='edit-instructor-student'){const student=(state.instructorData.students||[]).find(x=>Number(x.id)===Number(target.dataset.id));if(student)openInstructorStudentForm(student);}
    if(action==='add-student-certificate')openInstructorCertificateForm(null,target.dataset.id);
    if(action==='instructor-certificate-new')openInstructorCertificateForm();
    if(action==='instructor-certificate-edit'){const cert=(state.instructorData.certifications||[]).find(x=>Number(x.id)===Number(target.dataset.id));if(cert)openInstructorCertificateForm(cert);}
    if(action==='instructor-certificate-delete'&&confirm('Remove this certificate from the student profile?')){try{const r=await apiRequest('instructor_certificate_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorCertificates();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='close-instructor-modal')document.getElementById('instructorActionModal')?.remove();
    if(action==='close-classroom-modal')document.getElementById('instructorClassroomModal')?.remove();
    if(action==='instructor-course-new')openInstructorCourseForm();
    if(action==='instructor-course-edit')openInstructorCourseForm(instructorCourseById(target.dataset.id));
    if(action==='instructor-content-edit'){const c=instructorCourseById(target.dataset.id);if(c)openInstructorContentForm(c);}
    if(action==='instructor-course-delete'){const c=instructorCourseById(target.dataset.id);if(c&&confirm(`Delete ${c.title}? This also removes its live classes, quizzes and assignments.`)){try{const r=await apiRequest('instructor_course_delete',{method:'POST',body:{id:c.id}});toast(r.message);await Promise.all([syncInstructorData(),refreshCatalogData()]);renderInstructorCourses();initPage();}catch(error){toast(error.message,'error');}}}
    if(action==='ic-add-module'){document.getElementById('instructorCurriculumBuilder')?.insertAdjacentHTML('beforeend',instructorModuleEditor({lessons:[{}]}));}
    if(action==='ic-remove-module')target.closest('.ic-module')?.remove();
    if(action==='ic-add-lesson')target.closest('.ic-module')?.querySelector('.ic-lessons')?.insertAdjacentHTML('beforeend',instructorLessonEditor({}));
    if(action==='ic-remove-lesson')target.closest('.ic-lesson')?.remove();
    if(action==='instructor-live-new')openInstructorLiveForm();
    if(action==='instructor-live-edit')openInstructorLiveForm((state.instructorData.live_sessions||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-live-delete'&&confirm('Remove this live class?')){try{const r=await apiRequest('instructor_live_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorLive();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='instructor-quiz-new')openInstructorQuizForm();
    if(action==='instructor-quiz-edit')openInstructorQuizForm((state.instructorData.quizzes||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-quiz-delete'&&confirm('Delete this quiz and its attempts?')){try{const r=await apiRequest('instructor_quiz_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorQuizzes();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='quiz-add-question'){const list=document.getElementById('quizQuestionBuilder');list?.insertAdjacentHTML('beforeend',quizQuestionEditor({},list.querySelectorAll('.quiz-question-editor').length));}
    if(action==='quiz-remove-question')target.closest('.quiz-question-editor')?.remove();
    if(action==='instructor-assignment-new')openInstructorAssignmentForm();
    if(action==='instructor-assignment-edit')openInstructorAssignmentForm((state.instructorData.assignments||[]).find(x=>Number(x.id)===Number(target.dataset.id)));
    if(action==='instructor-assignment-delete'&&confirm('Delete this assignment and its submissions?')){try{const r=await apiRequest('instructor_assignment_delete',{method:'POST',body:{id:Number(target.dataset.id)}});toast(r.message);await syncInstructorData();renderInstructorAssignments();initPage();}catch(error){toast(error.message,'error');}}
    if(action==='instructor-grade-submission'){const sub=(state.instructorData.submissions||[]).find(x=>Number(x.id)===Number(target.dataset.id));if(sub)openInstructorGradeForm(sub);}
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
      const instructor=state.user.role==='instructor';desktopAuth.innerHTML=state.loggedIn?`<div class="account-menu"><button class="account-menu-trigger" type="button" data-action="toggle-account-menu"><span class="account-avatar">${state.user.avatar?`<img src="${escapeHtml(state.user.avatar)}" alt="">`:escapeHtml(initials(state.user.name))}</span><span>${escapeHtml((state.user.name||'My Account').split(/\s+/)[0])}</span>${icon('chevronDown')}</button><div class="account-dropdown"><div class="account-dropdown-user"><strong>${escapeHtml(state.user.name||'Academy Member')}</strong><small>${escapeHtml(state.user.email||'')}</small></div><a href="${instructor?'#/instructor-dashboard':'#/dashboard'}">Dashboard</a>${instructor?'<a href="#/instructor-courses">My Courses</a><a href="#/instructor-live">Live Classes</a><a href="#/instructor-quizzes">Quizzes</a><a href="#/instructor-assignments">Assignments</a><a href="#/instructor-certificates">Certificates</a><a href="#/instructor-students">Students</a>':'<a href="#/my-courses">My Courses</a>'}<a href="#/profile">My Profile</a><button type="button" data-action="logout">Sign Out</button></div></div>`:`<a class="text-button" href="#/login">Sign In</a>`;
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

  async function router() {
    closeOverlays();
    const raw = decodeURIComponent((location.hash || '#/').slice(1));
    const [path, query=''] = raw.split('?');
    state.currentPath = path || '/';
    window.scrollTo(0,0);
    if (state.currentPath === '/') {
      try { await refreshCatalogData(); } catch (error) { console.error('Course catalog backend refresh failed:', error); }
      renderHome();
    }
    else if (state.currentPath === '/courses') {
      try { await refreshCatalogData(); } catch (error) { console.error('Course catalog backend refresh failed:', error); }
      if(query) state.currentPath=`/courses?${query}`; renderCourses(); state.currentPath='/courses';
    }
    else if (state.currentPath.startsWith('/course/')) {
      try { await refreshCatalogData(); } catch (error) { console.error('Course detail backend refresh failed:', error); }
      renderCourseDetail(state.currentPath.split('/')[2]);
    }
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
    else if (state.currentPath === '/instructor-live') renderInstructorLive();
    else if (state.currentPath === '/instructor-quizzes') renderInstructorQuizzes();
    else if (state.currentPath === '/instructor-assignments') renderInstructorAssignments();
    else if (state.currentPath === '/instructor-certificates') renderInstructorCertificates();
    else if (state.currentPath === '/instructor-students') renderInstructorStudents();
    else if (state.currentPath === '/instructor-requests') renderInstructorRequests();
    else if (state.currentPath === '/my-courses') renderMyCourses();
    else if (state.currentPath === '/wishlist') renderWishlist();
    else if (state.currentPath === '/certificates') renderCertificates();
    else if (state.currentPath === '/purchase-history') renderPurchaseHistory();
    else if (state.currentPath === '/profile') renderProfile();
    else if (state.currentPath.startsWith('/people/')) renderPublicProfile(state.currentPath.split('/')[2]);
    else if (state.currentPath.startsWith('/learn/')) renderPlayer(state.currentPath.split('/')[2]);
    else if (state.currentPath === '/events') {
      setChrome('public');
      try { await refreshEventsData(); } catch (error) { console.error('Events backend refresh failed:', error); }
      renderEvents(query);
    }
    else if (state.currentPath.startsWith('/event/')) {
      setChrome('public');
      const slug = state.currentPath.split('/')[2];
      try {
        await Promise.allSettled([refreshEventsData(), refreshSingleEventData(slug)]);
      } catch (error) { console.error('Event detail backend refresh failed:', error); }
      renderEventDetail(slug);
    }
    else if (state.currentPath === '/about') renderAbout();
    else if (state.currentPath === '/contact') renderContact();
    else if (state.currentPath === '/companies') { setChrome('public'); if (window.FSA_PLACEMENTS_PAGE) window.FSA_PLACEMENTS_PAGE.renderCompanies(app); else renderNotFound(); }
    else if (state.currentPath === '/alumni') { setChrome('public'); try{await refreshPlacementPeopleData();}catch(_){ } if (window.FSA_PLACEMENTS_PAGE) window.FSA_PLACEMENTS_PAGE.renderAlumni(app, query); else renderNotFound(); }
    else if (state.currentPath === '/candidates') { setChrome('public'); try{await refreshPlacementPeopleData();}catch(_){ } if (window.FSA_CANDIDATES_PAGE) window.FSA_CANDIDATES_PAGE.render(app); else renderNotFound(); }
    else if (state.currentPath === '/instructors') renderInstructors();
    else if (state.currentPath === '/branches') { const branchId = new URLSearchParams(query).get('branch') || ''; renderBranches(branchId); }
    else if (state.currentPath === '/help') renderHelp();
    else if (['/terms','/privacy','/refund'].includes(state.currentPath)) renderLegal(state.currentPath.slice(1));
    else renderNotFound();
    window.FSA_CMS?.applyRoute(state.currentPath, app);
    initPage();
    if (state.currentPath === '/branches' && query) {
      const branchId = new URLSearchParams(query).get('branch');
      if (branchId && D.branches.some(branch => branch.id === branchId)) {
        setTimeout(() => document.getElementById(`branch-${branchId}`)?.scrollIntoView({behavior:'smooth',block:'center'}), 140);
      }
    }
  }

  ICONS.creditCard = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>';

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
  window.addEventListener('keydown',event=>{ if(event.key==='Escape')closeOverlays(); });
  applySiteSettings(siteSettings);
  (async function initializeApp() {
    try {
      const catalog = await apiRequest('catalog');
      if (catalog.site) applySiteSettings(catalog.site);
      if (Array.isArray(catalog.courses)) {
        D.courses = catalog.courses;
        if (Array.isArray(catalog.plans)) D.plans = catalog.plans;
        if (Array.isArray(catalog.branches)) D.branches = catalog.branches;
        if (Array.isArray(catalog.instructors)) D.instructors = catalog.instructors;
        if (Array.isArray(catalog.batches)) D.batches = catalog.batches;
        if (Array.isArray(catalog.companies)) D.companies = catalog.companies;
        if (Array.isArray(catalog.alumni)) D.alumni = catalog.alumni;
        if (Array.isArray(catalog.candidates)) D.candidates = catalog.candidates;
        if (Array.isArray(catalog.events)) D.events = catalog.events;
        if (Array.isArray(catalog.reviews)) D.reviews = catalog.reviews;
        syncBranchChrome();
        syncCourseMegaMenu();
        D.categories.forEach(category => { category.count = D.courses.filter(course => course.category === category.name).length; });
      }
      if (Array.isArray(catalog.branches)) D.branches = catalog.branches;
      if (Array.isArray(catalog.instructors)) D.instructors = catalog.instructors;
      if (Array.isArray(catalog.batches)) D.batches = catalog.batches;
      if (Array.isArray(catalog.companies)) D.companies = catalog.companies;
      if (Array.isArray(catalog.alumni)) D.alumni = catalog.alumni;
      if (Array.isArray(catalog.candidates)) D.candidates = catalog.candidates;
      if (Array.isArray(catalog.events)) D.events = catalog.events;
      if (Array.isArray(catalog.reviews)) D.reviews = catalog.reviews;
      const result = await apiRequest('auth_me');
      if (result.authenticated && result.user?.role !== 'admin') {
        state.loggedIn = true;
        state.user = { ...state.user, ...result.user };
        if(result.user.role==='instructor')await syncInstructorData();else await syncStudentData();
      } else {
        state.loggedIn = false;
        state.enrollments = [];
        state.pendingEnrollments = [];
        state.progress = {};
        state.orders = [];
        state.assignedCourses = [];
        state.playerCourses = {};
        write(LS.loggedIn,false);
      }
    } catch (error) {
      const message = String(error?.message || '');
      if(!state.loggedIn){
        state.loggedIn = false;
        toast(message.includes('install') ? 'Open /install/ to configure the MySQL database.' : (message || 'Backend connection failed. Check PHP and MySQL.'), 'error');
      } else {
        toast('Your saved login is being used while the server reconnects.','error');
      }
    }
    router();
  })();
})();
