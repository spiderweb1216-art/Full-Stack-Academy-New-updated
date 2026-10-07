(() => {
  'use strict';

  const API = '../api/index.php';
  let csrfToken = '';
  const loginView = document.getElementById('loginView');
  const adminApp = document.getElementById('adminApp');
  const content = document.getElementById('adminContent');
  const sidebar = document.getElementById('sidebar');
  const toastStack = document.getElementById('toastStack');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const courseModalBackdrop = document.getElementById('courseModalBackdrop');
  const accessModalBackdrop = document.getElementById('accessModalBackdrop');
  const contentModalBackdrop = document.getElementById('contentModalBackdrop');
  const mediaPickerBackdrop = document.getElementById('mediaPickerBackdrop');
  const userForm = document.getElementById('userForm');
  const courseForm = document.getElementById('courseForm');
  const accessForm = document.getElementById('accessForm');
  const privateContentForm = document.getElementById('privateContentForm');

  const COURSE_MODES = ['offline','live','recorded'];
  const COURSE_MODE_LABELS = {offline:'Physical / Offline',live:'Live',recorded:'Recorded'};
  const COURSE_MODE_FIELDS = ['badge','image','short','description','price','originalPrice','duration','hours','projects','rating','reviews','students','level','language','updated','instructor','instructorRole'];
  let activeCourseMode = 'offline';
  let enabledCourseModes = ['offline'];
  let courseModeDrafts = {offline:{},live:{},recorded:{}};

  const state = {
    user: null, view: 'dashboard', users: [], students: [], certificates: [], signingAuthorities: [], studentTab:'enrolled', courses: [], batches: [], branches: [], companies: [], events: [], reviews: [], alumni: [], candidates: [], instructors: [], orders: [], enrollments: [], inquiries: [], approvals: null, media: [], pages: [], snippets: [],
    settings: null, site: null, templates: [], logs: [], userSearch: '', userRole: 'all', inquiryStatus: 'all', mediaPickerTarget: '', mediaPickerElement: null
  };

  const titles = {
    dashboard:'Overview', courses:'Courses', batches:'Batches', branches:'Branches', companies:'Companies', events:'Events', reviews:'Reviews', students:'Students', alumni:'Alumni', candidates:'Job Seekers', instructors:'Instructors', video:'Zoom Live', media:'Media Library', orders:'Orders', enrollments:'Enrollments', users:'Users', approvals:'Approvals', inquiries:'Enquiries',
    smtp:'SMTP Setup', templates:'Email Templates', logs:'Email Logs', pages:'Pages', snippets:'Code Snippets', theme:'Theme Colors', settings:'Website Settings', account:'Admin Account'
  };

  const esc = (value='') => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
  const initials = (name='') => name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'FS';
  const money = value => `${state.site?.currency_symbol || '₹'}${Number(value || 0).toLocaleString(state.site?.locale || 'en-IN')}`;
  const formatDate = value => value ? new Date(value).toLocaleString(state.site?.locale || 'en-IN',{dateStyle:'medium',timeStyle:'short'}) : '—';
  const statusClass = status => `status-pill status-${esc(String(status || 'new').toLowerCase())}`;
  const ROLE_ORDER = ['super_admin','admin_staff','branch_head','branch_admin','instructor','student'];
  const roleLabel = role => ({admin:'Super Admin',super_admin:'Super Admin',admin_staff:'Admin Staff',branch_head:'Branch Head',branch_admin:'Branch Admin',instructor:'Instructor',student:'Student'}[String(role||'').toLowerCase()] || String(role||'User').replaceAll('_',' '));
  const normalizedRole = () => state.user?.role==='admin' ? 'super_admin' : String(state.user?.role||'');
  const isCentralRole = () => ['super_admin','admin_staff'].includes(normalizedRole());
  const isBranchRole = () => ['branch_head','branch_admin'].includes(normalizedRole());
  const ROLE_VIEWS = {
    super_admin:Object.keys(titles),
    admin_staff:['dashboard','courses','batches','branches','companies','events','reviews','students','instructors','media','orders','enrollments','users','approvals','inquiries','account'],
    branch_head:['dashboard','courses','batches','branches','students','instructors','media','enrollments','users','approvals','account'],
    branch_admin:['dashboard','courses','batches','branches','students','instructors','media','enrollments','users','approvals','account'],
    instructor:['dashboard','courses','media','account']
  };
  const canView = view => (ROLE_VIEWS[normalizedRole()]||['dashboard','account']).includes(view);
  const manageableRoles = () => ({
    super_admin:['super_admin','admin_staff','branch_head','branch_admin','instructor','student'],
    admin_staff:['branch_head'],
    branch_head:['branch_admin','student'],
    branch_admin:['instructor','student'],
    instructor:[]
  }[normalizedRole()]||[]);
  function applyRoleNavigation(){
    document.querySelectorAll('.admin-nav [data-view]').forEach(btn=>{btn.hidden=!canView(btn.dataset.view);});
    document.querySelectorAll('.admin-nav .nav-label').forEach(label=>{const next=[];let node=label.nextElementSibling;while(node&&!node.classList.contains('nav-label')){next.push(node);node=node.nextElementSibling;}label.hidden=!next.some(x=>!x.hidden);});
    document.querySelectorAll('[data-student-section="alumni"],[data-student-section="candidates"]').forEach(btn=>{btn.hidden=!isCentralRole();});
  }
  const toLines = value => Array.isArray(value) ? value.join('\n') : '';
  const toCsv = value => Array.isArray(value) ? value.join(', ') : '';
  const mediaUrl = value => {
    const url=String(value||'').trim();
    if(!url) return '';
    if(/^(?:https?:|data:|blob:|\/\/)/i.test(url)) return url;
    return `../${url.replace(/^\.?\//,'')}`;
  };
  const fileSize = value => {
    const bytes=Number(value||0);
    if(bytes<1024) return `${bytes} B`;
    if(bytes<1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  };

  function applyAdminBranding(site={}) {
    state.site={...(state.site||{}),...site};
    const name=state.site.academy_name||'Full Stack Academy';
    document.querySelectorAll('[data-admin-site-name]').forEach(node=>{node.textContent=name;});
    const logo=state.site.admin_logo||state.site.header_logo||'';
    const width=Math.max(48,Math.min(420,Number(state.site.admin_logo_width||180)));
    document.querySelectorAll('[data-admin-logo]').forEach(image=>{
      const brand=image.closest('.admin-brand');
      if(logo){image.src=mediaUrl(logo);image.alt=name;image.style.width=`${width}px`;image.hidden=false;brand?.classList.add('has-logo');}
      else{image.removeAttribute('src');image.hidden=true;brand?.classList.remove('has-logo');}
    });
    document.querySelectorAll('[data-admin-logo-fallback]').forEach(node=>{node.hidden=Boolean(logo);});
    const favicon=state.site.favicon_url||'assets/favicon.svg';
    const faviconNode=document.getElementById('adminFavicon');
    if(faviconNode)faviconNode.href=mediaUrl(favicon)||'../assets/favicon.svg';
    document.title=`Academy Administration | ${name}`;
  }

  function updateImagePreview(input){
    if(!input) return;
    const preview=input.closest('label')?.querySelector('.field-preview');
    if(!preview) return;
    const url=String(input.value||'').trim();
    preview.innerHTML=url?`<img src="${esc(mediaUrl(url))}" alt="Selected image preview"><small>${esc(url)}</small>`:'';
  }

  function logoField(label,name,value,widthName,width,help=''){
    return `<div class="logo-setting full"><div class="logo-setting-copy"><strong>${esc(label)}</strong>${help?`<small>${esc(help)}</small>`:''}</div><div class="logo-setting-controls"><label>Image URL<div class="media-input-row"><input name="${esc(name)}" maxlength="2000" value="${esc(value||'')}" placeholder="Choose from Media Library"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="${esc(name)}">Choose from Media</button></div><span class="field-preview">${value?`<img src="${esc(mediaUrl(value))}" alt="${esc(label)} preview"><small>${esc(value)}</small>`:''}</span></label>${widthName?`<label>Logo width (px)<input name="${esc(widthName)}" type="number" min="48" max="420" value="${Number(width||180)}"></label>`:''}</div></div>`;
  }

  function splitLines(value='') { return String(value || '').split(/\r?\n/).map(item=>item.trim()).filter(Boolean); }
  function builderInput(value='') { return esc(value ?? ''); }
  function resourcesToLines(resources=[]) {
    return Array.isArray(resources) ? resources.map(item=>`${item.title||'Lesson resource'} | ${item.url||''}`).filter(line=>!line.endsWith(' | ')).join('\n') : '';
  }
  function lectureEditor(lecture={},index=0) {
    const provider=lecture.videoProvider==='embed'?'embed':'none';
    return `<article class="lecture-row-editor">
      <div class="lecture-editor-head"><strong>Lecture Video <span class="lecture-number">${index+1}</span></strong><button class="builder-remove" type="button" data-action="remove-lecture">Remove</button></div>
      <div class="lecture-editor-grid">
        <label>Lecture tab title<input type="text" data-field="lecture-title" maxlength="190" placeholder="Video 01 — Introduction" value="${builderInput(lecture.title)}"></label>
        <label>Duration<input type="text" data-field="lecture-duration" maxlength="60" placeholder="18 min" value="${builderInput(lecture.duration)}"></label>
        <label>Video source<select data-field="lecture-video-provider"><option value="none" ${provider==='none'?'selected':''}>Text or image only</option><option value="embed" ${provider==='embed'?'selected':''}>Embed / hosted recording URL</option></select></label>
        <label>Recording type<input type="text" value="Use your hosted recording or embed URL below" readonly></label>
        <label class="full">Embed URL or iframe code<textarea data-field="lecture-embed-url" rows="3" maxlength="4000" placeholder="Paste an iframe code or secure embed URL">${builderInput(lecture.embedUrl)}</textarea></label>
        <label class="full">Text shown below this video<textarea data-field="lecture-content" rows="5" maxlength="30000" placeholder="Add explanation, instructions, code notes or a lecture summary.">${builderInput(lecture.content)}</textarea></label>
        <label class="full">Optional lecture image<div class="media-input-row"><input type="text" data-field="lecture-image" maxlength="2000" value="${builderInput(lecture.image)}" placeholder="Choose from Media Library"><button class="secondary-button" type="button" data-action="choose-lecture-media">Choose from Media</button></div><span class="field-preview">${lecture.image?`<img src="${esc(mediaUrl(lecture.image))}" alt="Lecture image preview"><small>${esc(lecture.image)}</small>`:''}</span></label>
      </div>
    </article>`;
  }
  function lessonVideos(lesson={}) {
    const list=Array.isArray(lesson.videos)?lesson.videos.filter(Boolean):[];
    if(list.length) return list;
    if(lesson.videoProvider&&lesson.videoProvider!=='none') return [{title:lesson.title?`${lesson.title} — Video 01`:'Video 01',duration:lesson.duration||'',videoProvider:lesson.videoProvider,videoId:lesson.videoId||'',embedUrl:lesson.embedUrl||'',content:'',image:''}];
    return [];
  }
  function lessonEditor(lesson={}) {
    const videos=lessonVideos(lesson);
    return `<article class="lesson-row-editor">
      <div class="lesson-editor-head"><strong>Lesson</strong><button class="builder-remove" type="button" data-action="remove-lesson">Remove Lesson</button></div>
      <div class="lesson-editor-grid">
        <label>Lesson title<input type="text" data-field="lesson-title" maxlength="190" placeholder="Lesson 01 — HTML Foundations" value="${builderInput(lesson.title)}"></label>
        <label>Total lesson duration<input type="text" data-field="lesson-duration" maxlength="60" placeholder="1h 20m" value="${builderInput(lesson.duration)}"></label>
        <label class="full">Lesson overview text<textarea data-field="lesson-content" rows="5" maxlength="30000" placeholder="This overview appears below the selected lecture content.">${builderInput(lesson.content)}</textarea></label>
        <label class="full">Lesson cover image<div class="media-input-row"><input type="text" data-field="lesson-image" maxlength="2000" value="${builderInput(lesson.image)}" placeholder="Choose from Media Library"><button class="secondary-button" type="button" data-action="choose-lesson-media">Choose from Media</button></div><span class="field-preview">${lesson.image?`<img src="${esc(mediaUrl(lesson.image))}" alt="Lesson image preview"><small>${esc(lesson.image)}</small>`:''}</span></label>
        <label class="full">Resources <small>One per line: Resource title | https://link</small><textarea data-field="lesson-resources" rows="4" placeholder="Lesson worksheet | https://example.com/file.pdf">${builderInput(resourcesToLines(lesson.resources))}</textarea></label>
        <label class="lesson-preview"><input type="checkbox" data-field="lesson-preview" ${lesson.preview?'checked':''}> Show lesson title as a public curriculum preview</label>
        <div class="lesson-lectures full">
          <div class="lesson-lectures-head"><div><strong>Lecture Videos</strong><small>Add as many videos as required for this lesson.</small></div><button class="secondary-button" type="button" data-action="add-lecture">+ Add Lecture Video</button></div>
          <div class="lecture-list">${videos.map(lectureEditor).join('')}</div>
          <p class="lecture-empty" ${videos.length?'hidden':''}>No lecture videos added. This can remain a reading-only lesson.</p>
        </div>
      </div>
    </article>`;
  }
  function moduleEditor(module={}) {
    const lessons=Array.isArray(module.lessons)&&module.lessons.length?module.lessons:[{}];
    return `<article class="builder-card curriculum-module">
      <div class="builder-card-head"><strong>Module <span class="module-number"></span></strong><button class="builder-remove" type="button" data-action="remove-module">Remove Module</button></div>
      <div class="builder-card-body">
        <div class="builder-row two">
          <label>Module title<input type="text" data-field="module-title" maxlength="190" placeholder="Web Development Fundamentals" value="${builderInput(module.title)}"></label>
          <label>Module duration<input type="text" data-field="module-duration" maxlength="60" placeholder="18h 20m" value="${builderInput(module.duration)}"></label>
        </div>
        <div class="lesson-list">${lessons.map(lessonEditor).join('')}</div>
        <div class="builder-inline-actions"><button class="secondary-button" type="button" data-action="add-lesson">+ Add Lesson</button></div>
      </div>
    </article>`;
  }
  function projectEditor(project={}) {
    return `<article class="builder-card project-editor">
      <div class="builder-card-head"><strong>Project <span class="project-number"></span></strong><button class="builder-remove" type="button" data-action="remove-project">Remove Project</button></div>
      <div class="builder-card-body">
        <label>Project title<input type="text" data-field="project-title" maxlength="190" placeholder="Portfolio Website" value="${builderInput(project.title)}"></label>
        <label>Project description<textarea data-field="project-description" maxlength="4000" rows="4" placeholder="Explain what students will build and practise.">${builderInput(project.description)}</textarea></label>
      </div>
    </article>`;
  }
  function reviewEditor(review={}) {
    const rating=Number(review.rating||5);
    return `<article class="builder-card review-editor">
      <div class="builder-card-head"><strong>Review <span class="review-number"></span></strong><button class="builder-remove" type="button" data-action="remove-review">Remove Review</button></div>
      <div class="builder-card-body">
        <div class="builder-row review-row">
          <label>Student name<input type="text" data-field="review-name" maxlength="120" placeholder="Student name" value="${builderInput(review.name)}"></label>
          <label>Student role or result<input type="text" data-field="review-role" maxlength="160" placeholder="Frontend Developer" value="${builderInput(review.role)}"></label>
          <label>Rating<select data-field="review-rating">${[5,4,3,2,1].map(value=>`<option value="${value}" ${rating===value?'selected':''}>${value} stars</option>`).join('')}</select></label>
        </div>
        <label>Review text<textarea data-field="review-text" maxlength="3000" rows="4" placeholder="Write the course-specific review.">${builderInput(review.text)}</textarea></label>
      </div>
    </article>`;
  }
  function refreshBuilders() {
    document.querySelectorAll('#curriculumBuilder .curriculum-module').forEach((node,index)=>{const number=node.querySelector('.module-number');if(number)number.textContent=String(index+1);});
    document.querySelectorAll('#curriculumBuilder .lesson-row-editor').forEach(lesson=>{
      const lectures=[...lesson.querySelectorAll('.lecture-row-editor')];
      lectures.forEach((node,index)=>{const number=node.querySelector('.lecture-number');if(number)number.textContent=String(index+1);});
      const empty=lesson.querySelector('.lecture-empty');if(empty)empty.hidden=lectures.length>0;
    });
    document.querySelectorAll('#projectsBuilder .project-editor').forEach((node,index)=>{const number=node.querySelector('.project-number');if(number)number.textContent=String(index+1);});
    document.querySelectorAll('#reviewsBuilder .review-editor').forEach((node,index)=>{const number=node.querySelector('.review-number');if(number)number.textContent=String(index+1);});
    const curriculumCount=document.querySelectorAll('#curriculumBuilder .curriculum-module').length;
    const projectCount=document.querySelectorAll('#projectsBuilder .project-editor').length;
    const reviewCount=document.querySelectorAll('#reviewsBuilder .review-editor').length;
    const curriculumEmpty=document.getElementById('curriculumEmpty'); if(curriculumEmpty)curriculumEmpty.hidden=curriculumCount>0;
    const projectsEmpty=document.getElementById('projectsEmpty'); if(projectsEmpty)projectsEmpty.hidden=projectCount>0;
    const reviewsEmpty=document.getElementById('reviewsEmpty'); if(reviewsEmpty)reviewsEmpty.hidden=reviewCount>0;
  }
  function emptyCourseModeContent(){
    return {badge:'',image:'',short:'',description:'',price:'',originalPrice:'',duration:'',hours:'',projects:'',rating:'',reviews:'',students:'',level:'',language:'',updated:'',instructor:'',instructorRole:'',skills:[],requirements:[],audience:[],projectItems:[],courseReviews:[]};
  }
  function normalizeCourseModeDraft(value={}){
    const base=emptyCourseModeContent();
    if(value&&typeof value==='object') Object.assign(base,value);
    base.skills=Array.isArray(base.skills)?base.skills:[];
    base.requirements=Array.isArray(base.requirements)?base.requirements:[];
    base.audience=Array.isArray(base.audience)?base.audience:[];
    base.projectItems=Array.isArray(base.projectItems)?base.projectItems:[];
    base.courseReviews=Array.isArray(base.courseReviews)?base.courseReviews:[];
    return base;
  }
  function captureActiveCourseMode(){
    if(!courseForm) return;
    const draft=normalizeCourseModeDraft(courseModeDrafts[activeCourseMode]);
    COURSE_MODE_FIELDS.forEach(name=>{ if(courseForm.elements[name]) draft[name]=courseForm.elements[name].value ?? ''; });
    draft.skills=splitLines(courseForm.elements.skills?.value||'');
    draft.requirements=splitLines(courseForm.elements.requirements?.value||'');
    draft.audience=splitLines(courseForm.elements.audience?.value||'');
    draft.projectItems=collectProjects();
    draft.courseReviews=collectReviews();
    if(draft.projectItems.length) draft.projects=draft.projectItems.length;
    if(draft.courseReviews.length){
      draft.reviews=Math.max(Number(draft.reviews||0),draft.courseReviews.length);
      if(!Number(draft.rating||0)) draft.rating=(draft.courseReviews.reduce((sum,review)=>sum+Number(review.rating||0),0)/draft.courseReviews.length).toFixed(1);
    }
    courseModeDrafts[activeCourseMode]=draft;
  }
  function updateCourseModeTabs(){
    document.querySelectorAll('.course-mode-tab').forEach(button=>{
      const mode=button.dataset.mode;
      const selected=mode===activeCourseMode;
      const enabled=enabledCourseModes.includes(mode);
      button.classList.toggle('active',selected);
      button.classList.toggle('enabled',enabled);
      button.setAttribute('aria-selected',selected?'true':'false');
      const mark=button.querySelector('.course-mode-check');
      if(mark) mark.textContent=enabled?'✓':'+';
    });
    const context=document.getElementById('courseModeContext');
    if(context){
      const enabled=enabledCourseModes.includes(activeCourseMode);
      const descriptions={offline:'Classroom / branch-based content and pricing.',live:'Instructor-led live online content and pricing.',recorded:'Self-paced recorded content and pricing.'};
      context.classList.toggle('is-disabled',!enabled);
      context.innerHTML=`<strong>${esc(COURSE_MODE_LABELS[activeCourseMode])} ${enabled?'content':'is not enabled'}</strong><span>${enabled?'Everything below is stored separately for this delivery type — including image, descriptions, price, duration, outcomes, requirements, projects and reviews. '+descriptions[activeCourseMode]:'Click the + on this tab to enable this delivery type, then enter its own separate content.'}</span>`;
    }
  }
  function toggleCourseMode(mode){
    if(!COURSE_MODES.includes(mode)) return;
    captureActiveCourseMode();
    if(enabledCourseModes.includes(mode)){
      if(enabledCourseModes.length===1){toast('A course must have at least one delivery type.','error');return;}
      enabledCourseModes=enabledCourseModes.filter(x=>x!==mode);
      if(activeCourseMode===mode) activeCourseMode=enabledCourseModes[0];
    }else{
      enabledCourseModes=[...enabledCourseModes,mode];
      activeCourseMode=mode;
    }
    loadCourseMode(activeCourseMode);
  }
  function loadCourseMode(mode){
    activeCourseMode=COURSE_MODES.includes(mode)?mode:'offline';
    const draft=normalizeCourseModeDraft(courseModeDrafts[activeCourseMode]);
    COURSE_MODE_FIELDS.forEach(name=>{ if(courseForm.elements[name]) courseForm.elements[name].value=draft[name] ?? ''; });
    if(courseForm.elements.skills) courseForm.elements.skills.value=toLines(draft.skills);
    if(courseForm.elements.requirements) courseForm.elements.requirements.value=toLines(draft.requirements);
    if(courseForm.elements.audience) courseForm.elements.audience.value=toLines(draft.audience);
    document.getElementById('projectsBuilder').innerHTML=draft.projectItems.map(projectEditor).join('');
    document.getElementById('reviewsBuilder').innerHTML=draft.courseReviews.map(reviewEditor).join('');
    refreshBuilders();
    updateImagePreview(courseForm.elements.image);
    updateCourseModeTabs();
  }
  function switchCourseMode(mode){
    if(!COURSE_MODES.includes(mode)) return;
    if(mode===activeCourseMode){
      if(!enabledCourseModes.includes(mode)){enabledCourseModes.push(mode);updateCourseModeTabs();}
      return;
    }
    captureActiveCourseMode();
    if(!enabledCourseModes.includes(mode)) enabledCourseModes.push(mode);
    loadCourseMode(mode);
  }

  function renderCourseBuilders(course={}) {
    const modules=Array.isArray(course.modules)?course.modules:[];
    const projects=Array.isArray(course.projectItems)?course.projectItems:[];
    const reviews=Array.isArray(course.courseReviews)?course.courseReviews:[];
    document.getElementById('curriculumBuilder').innerHTML=modules.map(moduleEditor).join('');
    document.getElementById('projectsBuilder').innerHTML=projects.map(projectEditor).join('');
    document.getElementById('reviewsBuilder').innerHTML=reviews.map(reviewEditor).join('');
    refreshBuilders();
  }
  function collectLessonResources(value='') {
    return String(value||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const parts=line.split('|');
      const url=(parts.pop()||'').trim();
      const title=parts.join('|').trim()||'Lesson resource';
      return {title,url};
    }).filter(item=>/^https?:\/\//i.test(item.url)||/^(?:uploads|assets)\//i.test(item.url));
  }
  function collectLectureVideos(lessonRow){
    return [...lessonRow.querySelectorAll('.lecture-row-editor')].map((row,index)=>({
      title:row.querySelector('[data-field="lecture-title"]')?.value.trim()||`Lecture ${String(index+1).padStart(2,'0')}`,
      duration:row.querySelector('[data-field="lecture-duration"]')?.value.trim()||'',
      videoProvider:row.querySelector('[data-field="lecture-video-provider"]')?.value||'none',
      videoId:row.querySelector('[data-field="lecture-video-id"]')?.value.trim()||'',
      embedUrl:row.querySelector('[data-field="lecture-embed-url"]')?.value.trim()||'',
      content:row.querySelector('[data-field="lecture-content"]')?.value.trim()||'',
      image:row.querySelector('[data-field="lecture-image"]')?.value.trim()||''
    })).filter(item=>item.title||item.videoId||item.embedUrl||item.content||item.image);
  }
  function collectModules() {
    return [...document.querySelectorAll('#curriculumBuilder .curriculum-module')].map((module,index)=>{
      const lessons=[...module.querySelectorAll(':scope > .builder-card-body > .lesson-list > .lesson-row-editor')].map(row=>({
        title:row.querySelector('[data-field="lesson-title"]')?.value.trim()||'',
        duration:row.querySelector('[data-field="lesson-duration"]')?.value.trim()||'',
        preview:Boolean(row.querySelector('[data-field="lesson-preview"]')?.checked),
        content:row.querySelector('[data-field="lesson-content"]')?.value.trim()||'',
        image:row.querySelector('[data-field="lesson-image"]')?.value.trim()||'',
        resources:collectLessonResources(row.querySelector('[data-field="lesson-resources"]')?.value||''),
        videos:collectLectureVideos(row)
      })).filter(lesson=>lesson.title);
      const title=module.querySelector('[data-field="module-title"]')?.value.trim()||'';
      return {title:title||(lessons.length?`Module ${index+1}`:''),duration:module.querySelector('[data-field="module-duration"]')?.value.trim()||'',lessons};
    }).filter(module=>module.title||module.lessons.length);
  }
  function collectProjects() {
    return [...document.querySelectorAll('#projectsBuilder .project-editor')].map((project,index)=>{
      const title=project.querySelector('[data-field="project-title"]')?.value.trim()||'';
      const description=project.querySelector('[data-field="project-description"]')?.value.trim()||'';
      return {title:title||((description)?`Project ${index+1}`:''),description};
    }).filter(project=>project.title||project.description);
  }
  function collectReviews() {
    return [...document.querySelectorAll('#reviewsBuilder .review-editor')].map(review=>({
      name:review.querySelector('[data-field="review-name"]')?.value.trim()||'',
      role:review.querySelector('[data-field="review-role"]')?.value.trim()||'',
      rating:Number(review.querySelector('[data-field="review-rating"]')?.value||5),
      text:review.querySelector('[data-field="review-text"]')?.value.trim()||''
    })).filter(review=>review.name||review.text);
  }

  async function api(action, options={}) {
    const init = {
      method: options.method || 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json', ...(options.headers || {}) }
    };
    if (options.body !== undefined) {
      if (csrfToken) init.headers['X-CSRF-Token'] = csrfToken;
      if (options.body instanceof FormData) {
        init.body = options.body;
      } else {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(options.body);
      }
    }

    let response;
    try {
      response = await fetch(`${API}?action=${encodeURIComponent(action)}`, init);
    } catch (_) {
      throw new Error('The admin panel could not reach the backend. Check PHP, the database connection and your internet connection.');
    }

    const raw = await response.text();
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (_) {
      const looksLikeInstaller = /install|database\.php|not installed/i.test(raw);
      throw new Error(looksLikeInstaller
        ? 'The website database connection is missing. Restore api/config/database.php and install.lock on Hostinger.'
        : `The backend returned an invalid response (${response.status}). Check the PHP error log.`);
    }

    if (payload.csrf_token) csrfToken = payload.csrf_token;

    // A stale token can happen after login, a long-open tab, or a Hostinger session refresh.
    // The API response includes a fresh token, so retry the save once automatically.
    if (response.status === 419 && payload.csrf_token && !options._csrfRetried) {
      return api(action, { ...options, _csrfRetried: true });
    }

    if (!response.ok || payload.success === false) {
      const error = new Error(payload.message || 'The request could not be completed.');
      error.status = response.status;
      error.installUrl = payload.install_url;
      throw error;
    }
    return payload;
  }

  function toast(message,type='success') {
    const node=document.createElement('div'); node.className=`toast ${type==='error'?'error':''}`; node.textContent=message;
    toastStack.appendChild(node); setTimeout(()=>node.remove(),4200);
  }
  function setModalOpen(backdrop, open) {
    backdrop.hidden = !open;
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('modal-open', open || !modalBackdrop.hidden || !courseModalBackdrop.hidden || !accessModalBackdrop.hidden || !contentModalBackdrop.hidden || !mediaPickerBackdrop.hidden);
  }
  function setLoginStatus(message='', isError=false) {
    const status=document.getElementById('adminLoginStatus');
    if(!status) return;
    status.textContent=message;
    status.classList.toggle('error',Boolean(isError));
  }
  function setFormStatus(formId, message='', isError=false) {
    const status=document.getElementById(`${formId}Status`);
    if(!status) return;
    status.textContent=message;
    status.classList.toggle('error',Boolean(isError));
    status.hidden=!message;
  }
  function validateAdminForm(formId, form, fd) {
    if(formId==='userForm') {
      const id=Number(fd.get('id')||0);
      const name=String(fd.get('name')||'').trim();
      const email=String(fd.get('email')||'').trim();
      const password=String(fd.get('password')||'');
      if(!name) throw new Error('Enter the user full name.');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid user email address.');
      if(!id && password.length<8) throw new Error('Enter a password of at least 8 characters for the new user.');
      if(id && password && password.length<8) throw new Error('A new password must contain at least 8 characters.');
    }
    if(formId==='courseForm') {
      const title=String(fd.get('title')||'').trim();
      const category=String(fd.get('category')||'').trim();
      const price=String(fd.get('price')||'').trim();
      let slug=String(fd.get('slug')||'').trim();
      if(!title) throw new Error('Enter the course title.');
      if(!category) throw new Error('Enter the course category.');
      if(price==='' || Number.isNaN(Number(price)) || Number(price)<0) throw new Error('Enter a valid course price.');
      if(!slug) {
        slug=title.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        if(form.elements.namedItem('slug')) form.elements.namedItem('slug').value=slug;
      }
      if(!slug) throw new Error('Enter a valid course URL slug.');
    }
  }
  function showLogin(message=''){
    setModalOpen(modalBackdrop,false); setModalOpen(courseModalBackdrop,false); setModalOpen(accessModalBackdrop,false); setModalOpen(contentModalBackdrop,false); setModalOpen(mediaPickerBackdrop,false);
    document.body.classList.remove('admin-mode'); loginView.hidden=false; adminApp.hidden=true; sidebar.classList.remove('open');
    setLoginStatus(message,Boolean(message));
    document.getElementById('adminLoginForm')?.elements.email?.focus();
  }
  function showApp(view=''){
    setModalOpen(modalBackdrop,false); setModalOpen(courseModalBackdrop,false); setModalOpen(accessModalBackdrop,false); setModalOpen(contentModalBackdrop,false); setModalOpen(mediaPickerBackdrop,false);
    document.body.classList.add('admin-mode'); loginView.hidden=true; adminApp.hidden=false; setLoginStatus('');
    document.getElementById('adminName').textContent=state.user?.name || 'Administrator';
    document.getElementById('adminRole').textContent=roleLabel(state.user?.role);
    document.getElementById('adminInitials').textContent=initials(state.user?.name);
    applyRoleNavigation();
    const requested=view || location.hash.slice(1) || 'dashboard';
    const safeView=titles[requested] && canView(requested) ? requested : 'dashboard';
    history.replaceState(null,'',`#${safeView}`);
    navigate(safeView,false);
  }
  function pageHead(title,text,action=''){ return `<div class="page-head"><div><span class="eyebrow">Academy Administration</span><h1>${esc(title)}</h1><p>${esc(text)}</p></div>${action}</div>`; }
  function emptyState(title,text){ return `<div class="empty-state"><span>◎</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`; }
  function loading(){ content.innerHTML='<div class="loading">Loading information…</div>'; }

  async function navigate(view,updateHash=true){
    if(!titles[view] || !canView(view)) view='dashboard'; state.view=view; if(updateHash) location.hash=view;
    document.getElementById('viewTitle').textContent=titles[view];
    document.querySelectorAll('.admin-nav [data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view));
    const studentsGroup=document.querySelector('[data-students-menu]');
    if(studentsGroup) studentsGroup.classList.toggle('is-active',view==='students');
    document.querySelectorAll('[data-student-section]').forEach(btn=>btn.classList.toggle('active',view==='students' && btn.dataset.studentSection===state.studentTab));
    sidebar.classList.remove('open'); loading();
    try {
      if(view==='dashboard') await renderDashboard();
      else if(view==='courses') await renderCourses();
      else if(view==='batches') await renderBatchesAdmin();
      else if(view==='branches') await renderBranchesAdmin();
      else if(view==='companies') await renderCompaniesAdmin();
      else if(view==='events') await renderEventsAdmin();
      else if(view==='reviews') await renderReviewsAdmin();
      else if(view==='students') await renderStudentsAdmin();
      else if(view==='alumni') await renderAlumniAdmin();
      else if(view==='candidates') await renderCandidatesAdmin();
      else if(view==='instructors') await renderInstructorsAdmin();
      else if(view==='video') await renderVideoSettings();
      else if(view==='media') await renderMedia();
      else if(view==='orders') await renderOrders();
      else if(view==='enrollments') await renderEnrollments();
      else if(view==='users') await renderUsers();
      else if(view==='approvals') await renderApprovals();
      else if(view==='inquiries') await renderInquiries();
      else if(view==='smtp') await renderSmtp();
      else if(view==='templates') await renderTemplates();
      else if(view==='logs') await renderLogs();
      else if(view==='pages') await renderCmsPages();
      else if(view==='snippets') await renderCmsSnippets();
      else if(view==='theme') await renderTheme();
      else if(view==='settings') await renderSettings();
      else if(view==='account') renderAccount();
    } catch(error){
      if(error.installUrl){ content.innerHTML=`${emptyState('MySQL setup required','Open the installer to create the database and first administrator account.')}<div style="text-align:center;margin-top:15px"><a class="primary-button" href="../install/">Open Installer</a></div>`; }
      else content.innerHTML=emptyState('Unable to load this section',error.message);
      toast(error.message,'error'); if(/sign in|administrator access/i.test(error.message)) showLogin();
    }
  }

  async function renderDashboard(){
    const {data}=await api('admin_dashboard'); const m=data.metrics; state.site=data.site || state.site; applyAdminBranding(state.site||{}); const recentUsers=data.recent_users||[]; const recentOrders=data.recent_orders||[];
    content.innerHTML=`
      ${pageHead('Dashboard Overview','Monitor course sales, learner access, users, messages and email delivery from one place.')}
      ${state.user?.must_change_password?'<div class="alert"><span><strong>Security action required:</strong> Change the default administrator password before publishing.</span><button class="secondary-button" data-view="account">Change Password</button></div>':''}
      <div class="metric-grid">
        <article class="metric-card"><span>Total Users</span><strong>${m.total_users}</strong><small>${m.active_users} active accounts</small></article>
        <article class="metric-card"><span>Published Courses</span><strong>${m.courses}</strong><small>${m.draft_courses || 0} draft course${Number(m.draft_courses)===1?'':'s'}</small></article>
        <article class="metric-card"><span>Pending Orders</span><strong>${m.pending_orders}</strong><small>${m.paid_orders} paid orders</small></article>
        <article class="metric-card"><span>Paid Revenue</span><strong>${money(m.revenue)}</strong><small>${m.active_enrollments} active enrollments</small></article>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><div><h2>Recent Orders</h2><p>Latest course and learning-plan purchases</p></div><button data-view="orders">View all</button></div>
          ${recentOrders.length?`<div class="activity-list">${recentOrders.map(order=>`<div class="activity-item"><span class="activity-avatar">₹</span><div><strong>${esc(order.order_number)}</strong><p>${esc(order.customer_name)} · ${money(order.total)}</p></div><span class="${statusClass(order.status)}">${esc(order.status)}</span></div>`).join('')}</div>`:emptyState('No orders yet','Course orders will appear here.')}
        </section>
        <section class="panel"><div class="panel-head"><div><h2>System Readiness</h2><p>Launch configuration</p></div></div><div class="activity-list">
          <div class="activity-item"><span class="activity-avatar">DB</span><div><strong>MySQL Database</strong><p>Courses, users, orders and progress connected</p></div><span class="status-pill status-active">Ready</span></div>
          <div class="activity-item"><span class="activity-avatar">@</span><div><strong>SMTP Delivery</strong><p>${m.smtp_enabled?'Configured and enabled':'Enter provider credentials in SMTP Setup'}</p></div><span class="status-pill ${m.smtp_enabled?'status-active':'status-skipped'}">${m.smtp_enabled?'Enabled':'Pending'}</span></div>
          <div class="activity-item"><span class="activity-avatar">✉</span><div><strong>New Enquiries</strong><p>Messages waiting for follow-up</p></div><span class="status-pill status-new">${m.new_inquiries}</span></div>
        </div></section>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Recent Users</h2><p>Latest learner and administrator accounts</p></div><button data-view="users">View all</button></div>
      ${recentUsers.length?`<div class="activity-list">${recentUsers.map(user=>`<div class="activity-item"><span class="activity-avatar">${initials(user.name)}</span><div><strong>${esc(user.name)}</strong><p>${esc(user.email)} · ${esc(roleLabel(user.role))}</p></div><span class="${statusClass(user.status)}">${esc(user.status)}</span></div>`).join('')}</div>`:emptyState('No users yet','New registrations will appear here.')}</div>`;
  }

  async function renderCourses(){
    const role=normalizedRole();
    if(['super_admin','admin_staff','branch_head','branch_admin'].includes(role)){
      const [result,branchesResult,instructorsResult]=await Promise.all([api('admin_courses'),api('admin_branches'),api('admin_instructors')]);
      state.courses=result.courses||[];state.branches=branchesResult.branches||[];state.instructors=instructorsResult.instructors||[];
    }else{const result=await api('admin_courses');state.courses=result.courses||[];}
    drawCourses();
  }
  function drawCourses(){
    const role=normalizedRole();const central=isCentralRole();const instructor=role==='instructor';
    const addAction=central?'<button class="primary-button" data-action="add-course">+ Add Course</button>':'';
    content.innerHTML=`${pageHead('Course Management',instructor?'Only courses assigned to your instructor account are shown. Recorded LMS courses require the Recorded Lectures permission before you can prepare them.':isBranchRole()?'Only courses assigned to your branch are shown. Branch approvals appear in Approval Centre.':'Assign a branch and instructor, then manage public course pages and protected LMS lessons.',addAction)}
      <div class="toolbar"><div class="toolbar-group"><span class="form-hint">${state.courses.length} course${state.courses.length===1?'':'s'} in your access scope</span></div></div>
      <div class="table-wrap">${state.courses.length?`<table class="data-table"><thead><tr><th>Course</th><th>Type</th><th>Branch / Instructor</th><th>Lessons</th><th>Approval</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.courses.map(course=>{const approval=course.approvalStatus||'approved';const modes=Array.isArray(course.deliveryModes)&&course.deliveryModes.length?course.deliveryModes:[course.deliveryMode||'offline'];const recorded=modes.includes('recorded');const recordedBlocked=instructor&&recorded&&!Boolean(state.user?.can_record_lectures);const contentAction=recordedBlocked?'<span class="status-pill status-pending">Recorded permission required</span>':`<button data-action="edit-private-content" data-id="${course.id}">${instructor?'Prepare LMS Content':'Private Lessons'}</button>`;const actions=[central?`<button data-action="edit-course" data-id="${course.id}">Public Page</button>`:'',contentAction,`<a href="../#/course/${encodeURIComponent(course.slug)}" target="_blank">View</a>`,central?`<button data-action="delete-course" data-id="${course.id}">Delete</button>`:''].filter(Boolean).join('');return `<tr><td><div class="user-cell"><span>${initials(course.title)}</span><div><strong>${esc(course.title)}</strong><small>${esc(course.slug)}</small></div></div></td><td>${modes.map(mode=>`<span class="course-mode-pill">${esc(COURSE_MODE_LABELS[mode]||mode)}</span>`).join(' ')}</td><td><strong>${esc(course.branchName||'Not assigned')}</strong><br><small>${esc(state.instructors.find(x=>Number(x.id)===Number(course.instructorUserId))?.name||course.instructor||'No instructor')}</small></td><td>${course.lessons}${course.pendingLessons?`<br><small>${course.pendingLessons} pending</small>`:''}</td><td><span class="${statusClass(approval)}">${esc(approval)}</span><br><small>${course.approvalKind==='central'?'Central approval':course.approvalKind==='branch'?'Branch approval':''}</small></td><td><span class="${statusClass(course.status)}">${esc(course.status)}</span></td><td><div class="row-actions">${actions}</div></td></tr>`;}).join('')}</tbody></table>`:emptyState('No courses found',instructor?'No course has been assigned to you yet.':'No course is available in your access scope.')}</div>`;
  }
  function openCourseModal(course=null){
    setFormStatus('courseForm');
    courseForm.reset();
    const set=(name,value)=>{ if(courseForm.elements[name]) courseForm.elements[name].value=value ?? ''; };
    ['id','title','slug','category','status'].forEach(name=>set(name,course?.[name]));
    courseForm.elements.status.value=course?.status||'published';
    courseForm.elements.featured.checked=Boolean(course?.featured);
    if(courseForm.elements.branchName)courseForm.elements.branchName.innerHTML='<option value="">Choose branch</option>'+state.branches.map(b=>`<option value="${esc(b.shortName||b.name||b.slug)}" ${(b.shortName||b.name||b.slug)===(course?.branchName||'')?'selected':''}>${esc(b.shortName||b.name)}</option>`).join('');
    if(courseForm.elements.assignedInstructorId)courseForm.elements.assignedInstructorId.innerHTML='<option value="0">No instructor assigned</option>'+state.instructors.map(i=>`<option value="${i.id}" ${Number(i.id)===Number(course?.instructorUserId||0)?'selected':''}>${esc(i.name)} — ${esc(i.branch||'No branch')}</option>`).join('');

    enabledCourseModes=Array.isArray(course?.deliveryModes)?course.deliveryModes.filter(mode=>COURSE_MODES.includes(mode)):[];
    if(!enabledCourseModes.length) enabledCourseModes=[COURSE_MODES.includes(course?.deliveryMode)?course.deliveryMode:'offline'];
    activeCourseMode=enabledCourseModes[0]||'offline';
    const incoming=course?.contentModes&&typeof course.contentModes==='object'?course.contentModes:{};
    courseModeDrafts={offline:normalizeCourseModeDraft(incoming.offline),live:normalizeCourseModeDraft(incoming.live),recorded:normalizeCourseModeDraft(incoming.recorded)};
    if(course && !incoming[activeCourseMode]) courseModeDrafts[activeCourseMode]=normalizeCourseModeDraft(course);
    loadCourseMode(activeCourseMode);

    document.getElementById('courseModalTitle').textContent=course?'Edit Public Course Page':'Add Course';
    setModalOpen(courseModalBackdrop,true);
    setTimeout(()=>courseForm.elements.title.focus(),0);
  }
  function openPrivateContentModal(course){
    if(!course){toast('Save the public course first.','error');return;}
    privateContentForm.reset();
    privateContentForm.elements.course_id.value=course.id;
    document.getElementById('contentModalTitle').textContent='Private Lessons';
    document.getElementById('contentModalCourseName').textContent=course.title;
    const sourceModules=normalizedRole()==='instructor'&&['pending','rejected'].includes(course.approvalStatus)&&Array.isArray(course.pendingModules)&&course.pendingModules.length?course.pendingModules:(Array.isArray(course.modules)?course.modules:[]);
    document.getElementById('curriculumBuilder').innerHTML=sourceModules.map(moduleEditor).join('');
    setFormStatus('privateContentForm');refreshBuilders();setModalOpen(contentModalBackdrop,true);
  }

  async function fetchMedia(){
    const result=await api('admin_media');
    state.media=result.media||[];
    return state.media;
  }
  function mediaCards(items,{picker=false}={}){
    if(!items.length)return emptyState('No media uploaded','Upload your first image or video to use across the website.');
    return `<div class="media-grid ${picker?'is-picker':''}">${items.map(item=>{const video=String(item.mime_type||'').startsWith('video/');return `<article class="media-card"><button class="media-thumb" type="button" ${picker?`data-action="select-media" data-url="${esc(item.url)}"`:`data-action="copy-media-url" data-url="${esc(item.url)}"`}>${video?`<video src="${esc(mediaUrl(item.url))}" muted preload="metadata"></video><span class="media-video-badge">VIDEO</span>`:`<img src="${esc(mediaUrl(item.url))}" alt="${esc(item.name)}" loading="lazy">`}</button><div class="media-card-body"><strong title="${esc(item.name)}">${esc(item.name)}</strong><small>${video?'Video':`${item.width||0} × ${item.height||0}`} · ${fileSize(item.size)}</small><code>${esc(item.url)}</code><div class="media-card-actions">${picker?`<button class="primary-button" type="button" data-action="select-media" data-url="${esc(item.url)}">Use Media</button>`:`<button class="secondary-button" type="button" data-action="copy-media-url" data-url="${esc(item.url)}">Copy URL</button><button class="danger-button" type="button" data-action="delete-media" data-id="${item.id}">Delete</button>`}</div></div></article>`;}).join('')}</div>`;
  }



  async function renderBatchesAdmin(){
    const [batchResult,courseResult,branchResult,instructorResult]=await Promise.all([api('admin_batches'),api('admin_courses'),api('admin_branches'),api('admin_instructors')]);
    state.batches=batchResult.batches||[];state.courses=courseResult.courses||[];state.branches=branchResult.branches||[];state.instructors=instructorResult.instructors||[];
    content.innerHTML=`${pageHead('Batch Management','All public batch dates, times, branches, instructors, seats and fees are loaded from this backend.','<button class="primary-button" data-action="add-batch">+ Add Batch</button>')}
      <div class="toolbar"><div class="toolbar-group"><span class="form-hint">${state.batches.length} batch${state.batches.length===1?'':'es'} in MySQL</span></div></div>
      <div class="table-wrap">${state.batches.length?`<table class="data-table"><thead><tr><th>Course</th><th>Mode / Branch</th><th>Schedule</th><th>Instructor</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.batches.map(row=>`<tr><td><strong>${esc(row.course)}</strong><br><small>${esc(row.slug||'')}</small></td><td>${esc(row.mode)}<br><small>${esc(row.branch||'Online')}</small></td><td>${esc(row.start)}<br><small>${esc([row.days,row.time].filter(Boolean).join(' · '))}</small></td><td>${esc(row.instructorName||'FSA Faculty')}</td><td>${row.seats===null||row.seats===undefined?'Flexible':`${Number(row.seats)} / ${Number(row.seatsTotal||row.seats)}`}</td><td><span class="${statusClass(row.status)}">${esc(row.status)}</span></td><td><div class="row-actions"><button data-action="edit-batch" data-id="${row.id}">Edit</button><button data-action="delete-batch" data-id="${row.id}">Delete</button></div></td></tr>`).join('')}</tbody></table>`:emptyState('No batches found','Add the first academy batch.')}</div>`;
  }
  function openBatchEditor(row={}){
    const courseOptions=state.courses.map(c=>`<option value="${c.id}" ${Number(row.courseId)===Number(c.id)?'selected':''}>${esc(c.title)}</option>`).join('');
    const branchOptions=state.branches.map(b=>`<option value="${esc(b.slug)}" ${String(row.branchSlug||'')===String(b.slug)?'selected':''}>${esc(b.shortName||b.name)}</option>`).join('');
    const instructorOptions=state.instructors.map(i=>`<option value="${i.id}" ${Number(row.instructorId)===Number(i.id)?'selected':''}>${esc(i.name)}${i.branch?` — ${esc(i.branch)}`:''}</option>`).join('');
    content.innerHTML=`${pageHead(row.id?'Edit Batch':'Add Batch','The existing public batch cards will use these backend values without changing the frontend design.')}
      <section class="settings-card"><form class="settings-form" id="batchForm"><input type="hidden" name="id" value="${esc(row.id||'')}">
      <label>Course<select name="courseId"><option value="0">Custom / keep typed name</option>${courseOptions}</select></label><label>Course name<input name="course" required maxlength="190" value="${esc(row.course||'')}"></label>
      <label>Course slug<input name="slug" maxlength="190" value="${esc(row.slug||'')}"></label><label>Learning mode<select name="modeKey"><option value="live-streamed" ${row.modeKey==='live-streamed'?'selected':''}>Live Streamed</option><option value="offline-classroom" ${row.modeKey==='offline-classroom'?'selected':''}>Offline Classroom</option><option value="recorded" ${row.modeKey==='recorded'?'selected':''}>Recorded</option></select></label>
      <label class="full">Batch / course image<div class="media-input-row"><input name="image" maxlength="2000" value="${esc(row.image||'')}"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="image">Choose from Media</button></div></label>
      <label>Branch<select name="branchSlug"><option value="online" ${!row.branchSlug||row.branchSlug==='online'?'selected':''}>Online</option>${branchOptions}</select></label><label>Instructor<select name="instructorId"><option value="0">FSA Faculty / unassigned</option>${instructorOptions}</select></label>
      <label>Shift<select name="shiftKey">${['morning','afternoon','evening','anytime'].map(v=>`<option value="${v}" ${row.shiftKey===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></label><label>Class time<input name="time" maxlength="120" value="${esc(row.time||'')}" placeholder="10:00 AM – 11:30 AM"></label>
      <label>Start date<input name="startDate" type="date" value="${esc(row.startDate||'')}"></label><label>End date<input name="endDate" type="date" value="${esc(row.endDate||'')}"></label>
      <label>Class days<input name="days" maxlength="120" value="${esc(row.days||'')}" placeholder="Mon · Wed · Fri"></label><label>Classroom / room<input name="classroom" maxlength="190" value="${esc(row.classroom||'')}"></label>
      <label>Total seats<input name="seatsTotal" type="number" min="0" value="${row.seatsTotal??''}"></label><label>Seats available<input name="seats" type="number" min="0" value="${row.seats??''}"></label>
      <label>Batch fee<input name="fee" type="number" min="0" step="0.01" value="${Number(row.fee||0)}"></label><label>Sort order<input name="sortOrder" type="number" value="${Number(row.sortOrder||0)}"></label>
      <label class="full">Online meeting URL<input name="meetingUrl" type="url" maxlength="2500" value="${esc(row.meetingUrl||'')}" placeholder="https://..."></label>
      <label class="full">Description<textarea name="description" rows="4" maxlength="5000">${esc(row.description||'')}</textarea></label>
      <label>Status<select name="status"><option value="published" ${row.status!=='draft'&&row.status!=='closed'?'selected':''}>Published</option><option value="draft" ${row.status==='draft'?'selected':''}>Draft</option><option value="closed" ${row.status==='closed'?'selected':''}>Closed</option></select></label>
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="batches">Cancel</button><button class="primary-button" type="submit">Save Batch</button></div></form></section>`;
  }

  function easyImageField(label,name,value='',help='Upload a new image or choose one already in Media Library.'){
    const v=String(value||'');
    return `<div class="easy-media-field full"><div class="easy-media-preview">${v?`<img src="${esc(mediaUrl(v))}" alt="${esc(label)} preview">`:`<span>No image yet</span>`}</div><div class="easy-media-controls"><strong>${esc(label)}</strong><small>${esc(help)}</small><input type="hidden" name="${esc(name)}" value="${esc(v)}"><div class="easy-media-actions"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="${esc(name)}">Choose Media</button><label class="secondary-button easy-upload-button">Upload Image<input type="file" class="easy-image-upload" data-target="${esc(name)}" accept="image/*,.svg,.avif,.bmp,.tif,.tiff,.ico,.heic,.heif,.jxl" hidden></label>${v?`<button class="secondary-button" type="button" data-action="clear-easy-image" data-target="${esc(name)}">Remove</button>`:''}</div><span class="field-preview easy-media-path">${v?`<small>${esc(v)}</small>`:''}</span></div></div>`;
  }
  function easyDetails(title,help,body,open=false){
    return `<details class="easy-editor-section full" ${open?'open':''}><summary><div><strong>${esc(title)}</strong><small>${esc(help)}</small></div><span>⌄</span></summary><div class="easy-editor-body">${body}</div></details>`;
  }

  async function renderCompaniesAdmin(){
    const result=await api('admin_companies');state.companies=result.companies||[];
    content.innerHTML=`${pageHead('Company Management','Everything on the public Companies page and homepage hiring-company section is loaded from this backend.','<button class="primary-button" data-action="add-company">+ Add Company</button>')}
      <div class="toolbar"><div class="toolbar-group"><span class="form-hint">${state.companies.length} compan${state.companies.length===1?'y':'ies'} in MySQL</span></div></div>
      <div class="table-wrap">${state.companies.length?`<table class="data-table"><thead><tr><th>Company</th><th>Sector / Location</th><th>Placements</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.companies.map(c=>`<tr><td><div class="user-cell"><span>${c.logo?`<img src="${esc(mediaUrl(c.logo))}" alt="" style="width:48px;height:48px;border-radius:10px;object-fit:contain;background:#fff">`:initials(c.name)}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.website||c.slug)}</small></div></div></td><td>${esc(c.sector||'—')}<br><small>${esc(c.location||'—')}</small></td><td>${Number(c.placementCount||0)}</td><td><span class="${statusClass(c.status)}">${esc(c.status)}</span>${c.featured?' <small>Featured</small>':''}</td><td><div class="row-actions"><button data-action="edit-company" data-id="${c.id}">Edit</button><a href="../#/companies" target="_blank">View</a><button data-action="delete-company" data-id="${c.id}">Delete</button></div></td></tr>`).join('')}</tbody></table>`:emptyState('No companies found','Add the first hiring company.')}</div>`;
  }
  function openCompanyEditor(company={}){
    const c={status:'published',hiringStatus:'Hiring Partner',sortOrder:(state.companies.length+1),...company};
    content.innerHTML=`${pageHead(c.id?'Edit Company':'Add Company','Simple company editor. Add the logo and basic details; the public Companies page updates automatically.')}
      <section class="settings-card easy-editor-card"><form class="settings-form easy-editor-form" id="companyForm"><input type="hidden" name="id" value="${esc(c.id||'')}">
      ${easyImageField('Company logo','logo',c.logo,'Upload a transparent PNG/WebP logo for the best result.')}
      <label>Company name<input name="name" required maxlength="190" value="${esc(c.name||'')}" placeholder="e.g. Amazon"></label>
      <label>Website<input name="website" type="url" maxlength="2000" value="${esc(c.website||'')}" placeholder="https://company.com"></label>
      <label>Industry<input name="sector" maxlength="160" value="${esc(c.sector||'')}" placeholder="Technology / Consulting"></label>
      <label>Location<input name="location" maxlength="190" value="${esc(c.location||'')}" placeholder="Hyderabad"></label>
      <label>Hiring label<input name="hiringStatus" maxlength="100" value="${esc(c.hiringStatus||'Hiring Partner')}" placeholder="Hiring Partner"></label>
      <label>Students placed<input name="placementCount" type="number" min="0" value="${Number(c.placementCount||0)}"></label>
      <label class="full">Short description<textarea name="description" rows="3" maxlength="5000" placeholder="A short public description of this company.">${esc(c.description||'')}</textarea></label>
      ${easyDetails('Publishing & display','Optional controls. You normally do not need to change these.',`<div class="settings-form easy-inner-grid"><label>URL slug<input name="slug" maxlength="160" value="${esc(c.slug||'')}" placeholder="Auto-created if left blank"></label><label>Sort order<input name="sortOrder" type="number" value="${Number(c.sortOrder||0)}"></label><label>Status<select name="status"><option value="published" ${c.status!=='draft'?'selected':''}>Published</option><option value="draft" ${c.status==='draft'?'selected':''}>Draft</option></select></label><label class="check-row"><input type="checkbox" name="featured" ${c.featured?'checked':''}><span><strong>Featured company</strong><small>Show this company before normal companies.</small></span></label></div>`)}
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="companies">Cancel</button><button class="primary-button" type="submit">Save Company</button></div></form></section>`;
  }

  async function renderReviewsAdmin(){
    const result=await api('admin_reviews');state.reviews=result.reviews||[];
    const writtenRows=state.reviews.filter(r=>r.type==='written'), videoRows=state.reviews.filter(r=>r.type==='video');
    const rowHtml=(r)=>`<tr><td><div class="review-admin-person"><span class="review-admin-avatar">${r.avatar?`<img src="${esc(mediaUrl(r.avatar))}" alt="">`:esc(initials(r.name))}</span><div class="review-admin-copy"><strong>${esc(r.name)}</strong><small>${esc((r.text||'').slice(0,92)||r.videoUrl||'No caption')}</small></div></div></td><td>${esc(r.course||'—')}<br><small>${esc(r.role||'')}</small></td><td><span class="review-admin-stars">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating||5))))}</span></td><td><span class="${statusClass(r.status)}">${esc(r.status)}</span>${r.featured?' <small class="review-admin-featured">Featured</small>':''}</td><td><div class="row-actions"><button data-action="edit-review-record" data-id="${r.id}">Edit</button><button data-action="delete-review-record" data-id="${r.id}">Delete</button></div></td></tr>`;
    const table=(rows,empty)=>rows.length?`<div class="table-wrap review-admin-table-wrap"><table class="data-table review-admin-table"><thead><tr><th>Reviewer</th><th>Course / Role</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table></div>`:emptyState(empty,'Add a review and publish it to show it in the matching frontend tab.');
    content.innerHTML=`${pageHead('Review Management','These records feed the existing Video Reviews and Written Reviews tabs on the public website.','<button class="primary-button" data-action="add-review-record">+ Add Review</button>')}
      <div class="review-admin-tabs" role="tablist"><button class="active" type="button" data-review-admin-tab="video">Video Reviews <span>${videoRows.length}</span></button><button type="button" data-review-admin-tab="written">Written Reviews <span>${writtenRows.length}</span></button></div>
      <section data-review-admin-panel="video">${table(videoRows,'No video reviews yet')}</section>
      <section data-review-admin-panel="written" hidden>${table(writtenRows,'No written reviews yet')}</section>`;
  }
  function openReviewEditor(review={}){
    const r={type:'written',rating:5,status:'published',sortOrder:(state.reviews.length+1),...review};
    const isVideo=r.type==='video';
    content.innerHTML=`${pageHead(r.id?'Edit Review':'Add Review','Use a normal form. No JSON or code is required.')}
      <section class="settings-card"><form class="settings-form" id="reviewForm"><input type="hidden" name="id" value="${esc(r.id||'')}">
      <label>Review type<select name="type" id="reviewTypeSelect"><option value="written" ${!isVideo?'selected':''}>Written Review</option><option value="video" ${isVideo?'selected':''}>Video Review</option></select></label>
      <label>Reviewer name<input name="name" required maxlength="190" value="${esc(r.name||'')}"></label>
      <label class="full">Reviewer photo / avatar<div class="media-input-row"><input name="avatar" maxlength="2000" value="${esc(r.avatar||'')}" placeholder="Choose from Media Library"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="avatar">Choose Media</button></div></label>
      <label>Course / programme<input name="course" maxlength="190" value="${esc(r.course||'')}" placeholder="MERN Full Stack Development"></label>
      <label>Role / label<input name="role" maxlength="190" value="${esc(r.role||'')}" placeholder="FSA Student / Alumni"></label>
      <label>Rating<select name="rating">${[5,4,3,2,1].map(v=>`<option value="${v}" ${Number(r.rating||5)===v?'selected':''}>${v} Star${v===1?'':'s'}</option>`).join('')}</select></label>
      <label>Sort order<input name="sortOrder" type="number" value="${Number(r.sortOrder||0)}"></label>
      <label class="full review-written-field" ${isVideo?'hidden':''}>Written review<textarea name="writtenText" rows="5" maxlength="8000" placeholder="Write the student review exactly as it should appear on the website.">${esc(r.text||'')}</textarea></label>
      <div class="full review-video-field" ${!isVideo?'hidden':''}><label>Video file / URL<div class="media-input-row"><input name="videoUrl" maxlength="2500" value="${esc(r.videoUrl||'')}" placeholder="Upload MP4/WebM/MOV or choose a video from Media Library"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="videoUrl">Choose Media</button><button class="secondary-button" type="button" data-action="upload-review-video">Upload Video</button><input id="reviewVideoUploadInput" type="file" hidden accept="video/mp4,video/webm,video/quicktime"></div></label><label style="margin-top:14px">Video thumbnail / poster<div class="media-input-row"><input name="thumbnail" maxlength="2000" value="${esc(r.thumbnail||'')}" placeholder="Optional image"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="thumbnail">Choose Media</button></div></label><label style="margin-top:14px">Short caption / quote<textarea name="videoText" rows="3" maxlength="8000" placeholder="Optional text shown with the video review.">${esc(r.text||'')}</textarea></label></div>
      <label>Status<select name="status"><option value="published" ${r.status!=='draft'?'selected':''}>Published</option><option value="draft" ${r.status==='draft'?'selected':''}>Draft</option></select></label>
      <label class="check-row"><input type="checkbox" name="featured" ${r.featured?'checked':''}><span><strong>Featured review</strong><small>Featured reviews are shown before normal reviews of the same type.</small></span></label>
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="reviews">Cancel</button><button class="primary-button" type="submit">Save Review</button></div></form></section>`;
  }

  async function renderEventsAdmin(){
    const result=await api('admin_events');state.events=result.events||[];
    content.innerHTML=`${pageHead('Event Management','Every public event card and event detail page is loaded from MySQL.','<button class="primary-button" data-action="add-event">+ Add Event</button>')}
      <div class="toolbar"><div class="toolbar-group"><span class="form-hint">${state.events.length} event${state.events.length===1?'':'s'} in MySQL</span></div></div>
      <div class="table-wrap">${state.events.length?`<table class="data-table event-admin-table"><thead><tr><th>Event</th><th>Date / Time</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.events.map(e=>`<tr><td><div class="event-admin-main"><div class="event-admin-thumb">${e.image?`<img src="${esc(mediaUrl(e.image))}" alt="${esc(e.title)}">`:`<span>${initials(e.title)}</span>`}</div><div class="event-admin-copy"><strong>${esc(e.title)}</strong><small>${esc(e.category||'Academy Event')} · ${esc(e.slug)}</small></div></div></td><td>${esc(e.date||'Date TBA')}<br><small>${esc(e.time||'Time TBA')}</small></td><td>${esc(e.location||'—')}<br><small>${esc(e.address||'')}</small></td><td><span class="${statusClass(e.status)}">${esc(e.status)}</span>${e.featured?' <small class="event-featured-label">Featured</small>':''}</td><td><div class="row-actions"><button data-action="edit-event" data-id="${e.id}">Edit</button><a href="../#/event/${encodeURIComponent(e.slug)}" target="_blank">View</a><button data-action="delete-event" data-id="${e.id}">Delete</button></div></td></tr>`).join('')}</tbody></table>`:emptyState('No events found','Add the first event to publish it on the Events page.')}</div>`;
  }

  const safeArray=value=>Array.isArray(value)?value:[];
  const eventMediaKind=item=>item?.type==='video'?'video':'image';
  function eventMediaItem(item={}){
    const type=eventMediaKind(item),src=String(item.src||item.url||'');
    const preview=src?(type==='video'?`<video src="${esc(mediaUrl(src))}" muted playsinline preload="metadata"></video><span class="event-media-type-badge">VIDEO</span>`:`<img src="${esc(mediaUrl(src))}" alt="">`):`<div class="event-media-empty">Media</div>`;
    return `<article class="event-builder-item event-media-item event-media-tile" draggable="true">
      <div class="event-media-preview">${preview}<button class="event-media-remove" type="button" data-action="remove-event-item" aria-label="Remove media">×</button><button class="event-drag-handle" type="button" aria-label="Drag to reorder" title="Drag or swipe to reorder">⋮⋮</button></div>
      <input type="hidden" data-field="src" value="${esc(src)}"><input type="hidden" data-field="type" value="${type}">
      <div class="event-media-meta"><input data-field="caption" maxlength="500" value="${esc(item.caption||'')}" placeholder="Optional caption"><button class="event-mini-button" type="button" data-action="replace-event-item-media">Replace</button></div>
    </article>`;
  }
  function eventAgendaItem(item={}){
    return `<details class="event-builder-item event-compact-item event-flow-item" draggable="true"><summary><span class="event-drag-handle" role="button" aria-label="Drag to reorder">⋮⋮</span><strong>${esc(item.title||'New flow step')}</strong><small>${esc(item.time||'Add time')}</small><button type="button" class="builder-remove event-summary-remove" data-action="remove-event-item" aria-label="Remove">×</button></summary><div class="event-builder-grid"><label>Step / time label<input data-field="time" maxlength="100" value="${esc(item.time||'')}" placeholder="10:00 AM or Step 1"></label><label>Title<input data-field="title" maxlength="220" value="${esc(item.title||'')}" placeholder="Registration & welcome"></label><label class="event-builder-wide">Description<textarea data-field="description" rows="2" maxlength="3000" placeholder="What happens in this step">${esc(item.description||'')}</textarea></label></div></details>`;
  }
  function eventHighlightItem(item={}){
    const icons=['sparkles','users','award','briefcase','project','layers','video'];
    return `<details class="event-builder-item event-compact-item" draggable="true"><summary><span class="event-drag-handle" role="button" aria-label="Drag to reorder">⋮⋮</span><strong>${esc(item.title||'New highlight')}</strong><small>${esc(item.icon||'sparkles')}</small><button type="button" class="builder-remove event-summary-remove" data-action="remove-event-item" aria-label="Remove">×</button></summary><div class="event-builder-grid"><label>Icon<select data-field="icon">${icons.map(x=>`<option value="${x}" ${item.icon===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select></label><label>Title<input data-field="title" maxlength="180" value="${esc(item.title||'')}" placeholder="Hands-on projects"></label><label class="event-builder-wide">Description<textarea data-field="description" rows="2" maxlength="2000">${esc(item.description||'')}</textarea></label></div></details>`;
  }
  function eventSponsorItem(item={}){
    const logo=String(item.logo||'');
    const preview=logo?`<img src="${esc(mediaUrl(logo))}" alt="Sponsor logo">`:`<div class="event-sponsor-empty">Logo</div>`;
    return `<article class="event-builder-item event-sponsor-tile" draggable="true">
      <div class="event-sponsor-preview">${preview}<button class="event-media-remove" type="button" data-action="remove-event-item" aria-label="Remove sponsor logo">×</button><button class="event-drag-handle" type="button" aria-label="Drag to reorder" title="Drag or swipe to reorder">⋮⋮</button></div>
      <input type="hidden" data-field="logo" value="${esc(logo)}">
      <button class="event-mini-button event-sponsor-replace" type="button" data-action="choose-event-sponsor-logo">Replace</button>
    </article>`;
  }
  function collectEventItems(selector,fields){
    return [...document.querySelectorAll(selector)].map(row=>{
      const item={};fields.forEach(field=>{const el=row.querySelector(`[data-field="${field}"]`);item[field]=String(el?.value||'').trim();});return item;
    }).filter(item=>Object.values(item).some(Boolean));
  }
  async function uploadEventMedia(file,input,typeSelect=null){
    if(!(file instanceof File)||!file.size)return null;
    const fd=new FormData();fd.append('media',file);
    const r=await api('admin_media_upload',{method:'POST',body:fd});
    if(!r.media?.url)throw new Error('The uploaded media URL was not returned.');
    if(input){input.value=r.media.url;input.dispatchEvent(new Event('input',{bubbles:true}));}
    if(typeSelect)typeSelect.value=String(r.media.mime_type||'').startsWith('video/')?'video':'image';
    return {src:r.media.url,type:String(r.media.mime_type||'').startsWith('video/')?'video':'image',caption:''};
  }
  function eventEditorSection(id,title,help,count,body,actions=''){
    return `<details class="event-editor-section full" data-event-section="${id}"><summary><div><strong>${title}</strong><small>${help}</small></div><span class="event-section-count" data-count-for="${id}">${count}</span><span class="event-section-chevron">⌄</span></summary><div class="event-section-body">${actions}${body}</div></details>`;
  }
  function refreshEventBuilderUI(){
    const defs=[['media','eventMediaBuilder'],['agenda','eventAgendaBuilder'],['highlights','eventHighlightsBuilder'],['sponsors','eventSponsorsBuilder']];
    defs.forEach(([key,id])=>{const count=document.getElementById(id)?.children.length||0;const badge=document.querySelector(`[data-count-for="${key}"]`);if(badge)badge.textContent=String(count);});
  }
  async function bulkUploadEventMedia(files){
    const valid=[...files].filter(f=>f instanceof File&&f.size);
    if(!valid.length)return;
    const builder=document.getElementById('eventMediaBuilder');if(!builder)return;
    const progress=document.getElementById('eventBulkUploadStatus');
    let done=0,failed=0;
    for(const file of valid){
      try{if(progress)progress.textContent=`Uploading ${done+failed+1} of ${valid.length}…`;const item=await uploadEventMedia(file);builder.insertAdjacentHTML('beforeend',eventMediaItem(item));done++;}
      catch(err){failed++;toast(`${file.name}: ${err.message}`,'error');}
    }
    if(progress)progress.textContent=failed?`${done} uploaded, ${failed} failed`:`${done} item${done===1?'':'s'} uploaded`;
    refreshEventBuilderUI();toast(`${done} media item${done===1?'':'s'} added.`);
  }
  async function bulkUploadEventSponsors(files){
    const valid=[...files].filter(f=>f instanceof File&&f.size&&(String(f.type||'').startsWith('image/')||/\.(?:jpe?g|png|webp|gif|svg|avif|bmp|tiff?|ico|heic|heif|jxl)$/i.test(String(f.name||''))));
    if(!valid.length)return;
    const builder=document.getElementById('eventSponsorsBuilder');if(!builder)return;
    const progress=document.getElementById('eventSponsorBulkStatus');
    let done=0,failed=0;
    for(const file of valid){
      try{if(progress)progress.textContent=`Uploading ${done+failed+1} of ${valid.length}…`;const item=await uploadEventMedia(file);builder.insertAdjacentHTML('beforeend',eventSponsorItem({logo:item.src}));done++;}
      catch(err){failed++;toast(`${file.name}: ${err.message}`,'error');}
    }
    if(progress)progress.textContent=failed?`${done} uploaded, ${failed} failed`:`${done} logo${done===1?'':'s'} uploaded`;
    refreshEventBuilderUI();setupEventSortable();toast(`${done} sponsor logo${done===1?'':'s'} added.`);
  }
  function setupEventSortable(){
    const lists=[...document.querySelectorAll('#eventMediaBuilder,#eventAgendaBuilder,#eventHighlightsBuilder,#eventSponsorsBuilder')];
    lists.forEach(list=>{
      list.addEventListener('dragstart',e=>{const row=e.target.closest('.event-builder-item');if(!row)return;row.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';});
      list.addEventListener('dragend',e=>{e.target.closest('.event-builder-item')?.classList.remove('is-dragging');refreshEventBuilderUI();});
      list.addEventListener('dragover',e=>{e.preventDefault();const dragging=list.querySelector('.is-dragging');if(!dragging)return;const after=[...list.querySelectorAll('.event-builder-item:not(.is-dragging)')].find(el=>e.clientY<el.getBoundingClientRect().top+el.getBoundingClientRect().height/2);if(after)list.insertBefore(dragging,after);else list.appendChild(dragging);});
    });
    let touchRow=null,touchList=null;
    document.querySelectorAll('.event-drag-handle').forEach(handle=>{
      handle.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;touchRow=handle.closest('.event-builder-item');touchList=touchRow?.parentElement;if(!touchRow||!touchList)return;touchRow.classList.add('is-dragging');handle.setPointerCapture?.(e.pointerId);e.preventDefault();});
      handle.addEventListener('pointermove',e=>{if(!touchRow||!touchList)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('.event-builder-item');if(el&&el!==touchRow&&el.parentElement===touchList){const r=el.getBoundingClientRect();touchList.insertBefore(touchRow,e.clientY<r.top+r.height/2?el:el.nextSibling);}e.preventDefault();});
      const end=()=>{touchRow?.classList.remove('is-dragging');touchRow=null;touchList=null;refreshEventBuilderUI();};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    });
  }
  function openEventEditor(e={}){
    const organiser=e.organiser&&typeof e.organiser==='object'?e.organiser:{};
    const media=safeArray(e.media),agenda=safeArray(e.agenda),highlights=safeArray(e.highlights),sponsors=safeArray(e.sponsors);
    const mediaActions=`<div class="event-section-toolbar"><div><button class="primary-button" type="button" data-action="bulk-event-media">+ Bulk Add Images & Videos</button><input id="eventBulkMediaInput" type="file" multiple hidden accept="image/*,.svg,.avif,.bmp,.tif,.tiff,.ico,.heic,.heif,.jxl,video/mp4,video/webm,video/quicktime"><button class="secondary-button" type="button" data-action="add-event-media-library">Choose from Library</button></div><small id="eventBulkUploadStatus">Select many files once. Drag or swipe thumbnails to reorder.</small></div>`;
    const agendaActions=`<div class="event-section-toolbar"><button class="secondary-button" type="button" data-action="add-event-agenda">+ Add Flow Step</button><small>Compact rows. Expand a row only when you need to edit it.</small></div>`;
    const highlightActions=`<div class="event-section-toolbar"><button class="secondary-button" type="button" data-action="add-event-highlight">+ Add Highlight</button><small>Use short title + description cards.</small></div>`;
    const sponsorActions=`<div class="event-section-toolbar"><div><button class="primary-button" type="button" data-action="bulk-event-sponsors">+ Bulk Add Sponsor Logos</button><input id="eventSponsorBulkInput" type="file" multiple hidden accept="image/*,.svg,.avif,.bmp,.tif,.tiff,.ico,.heic,.heif,.jxl"><button class="secondary-button" type="button" data-action="add-event-sponsor">+ Choose One Logo</button></div><small id="eventSponsorBulkStatus">Logos only. Upload many at once, then drag/swipe to set the frontend order.</small></div>`;
    const organiserBody=`<div class="event-builder-grid"><label>Organiser name<input name="organiserName" maxlength="190" value="${esc(organiser.name||'Full Stack Academy')}"></label><label>Organiser role<input name="organiserRole" maxlength="160" value="${esc(organiser.role||'Event Organiser')}"></label><label>Organiser email<input name="organiserEmail" type="email" maxlength="190" value="${esc(organiser.email||'')}"></label><label>Organiser phone<input name="organiserPhone" maxlength="60" value="${esc(organiser.phone||'')}"></label><label class="event-builder-wide">Organiser description<textarea name="organiserDescription" rows="3">${esc(organiser.description||'')}</textarea></label></div>`;
    content.innerHTML=`${pageHead(e.id?'Edit Event':'Add Event','Fast editor with bulk media upload, drag/swipe ordering and collapsible sections. No JSON or code required.')}
      <section class="settings-card event-editor-card"><form class="settings-form" id="eventForm"><input type="hidden" name="id" value="${esc(e.id||'')}">
      <label>Event title<input name="title" required maxlength="220" value="${esc(e.title||'')}"></label><label>URL slug<input name="slug" maxlength="180" value="${esc(e.slug||'')}"></label>
      <label>Event category<input name="category" maxlength="120" value="${esc(e.category||'Academy Event')}" placeholder="Workshop / Hackathon / Seminar"></label><label>Sort order<input name="sortOrder" type="number" value="${Number(e.sortOrder||0)}"></label>
      <label>Start date<input name="date" type="date" value="${esc(e.date||'')}"></label><label>End date<input name="endDate" type="date" value="${esc(e.endDate||'')}"></label>
      <label>Time / schedule<input name="time" maxlength="160" value="${esc(e.time||'')}" placeholder="10:30 AM – 1:30 PM"></label><label>Location / branch<input name="location" maxlength="190" value="${esc(e.location||'')}"></label>
      <label class="full">Full venue address<input name="address" maxlength="500" value="${esc(e.address||'')}"></label>
      <label class="full">Hero / card image<div class="media-input-row"><input name="image" maxlength="2000" value="${esc(e.image||'')}" placeholder="Choose from Media Library"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="image">Choose from Media</button></div><span class="field-preview">${e.image?`<img src="${esc(mediaUrl(e.image))}" alt="Event image preview"><small>${esc(e.image)}</small>`:''}</span></label>
      <label class="full">Event description<textarea name="description" rows="5" maxlength="10000">${esc(e.description||'')}</textarea></label>
      <label class="full">Registration / booking URL<input name="registrationUrl" type="url" maxlength="2000" value="${esc(e.registrationUrl||'')}" placeholder="https://... (leave blank to use Get A Call)"></label>
      <label class="full">Tags <small>One tag per line.</small><textarea name="tags" rows="3">${esc((e.tags||[]).join('\n'))}</textarea></label>

      ${eventEditorSection('media','Gallery & Videos','Frontend section 1. Bulk upload, then drag/swipe into the exact display order.',media.length,`<div class="event-media-grid event-builder-list" id="eventMediaBuilder">${media.map(eventMediaItem).join('')}</div>`,mediaActions)}
      ${eventEditorSection('highlights','Highlights','Frontend About section highlights. Compact rows expand only when you choose.',highlights.length,`<div class="event-builder-list" id="eventHighlightsBuilder">${highlights.map(eventHighlightItem).join('')}</div>`,highlightActions)}
      ${eventEditorSection('agenda','Event Flow','Frontend section 3. Add text steps without JSON.',agenda.length,`<div class="event-builder-list event-flow-builder" id="eventAgendaBuilder">${agenda.map(eventAgendaItem).join('')}</div>`,agendaActions)}
      ${eventEditorSection('organiser','Organiser','Frontend section 4. Contact and organiser card details.',organiser?.name?1:0,organiserBody)}
      ${eventEditorSection('sponsors','Sponsors & Partners','Frontend section 5. Logo-only slider; bulk upload and reorder here.',sponsors.filter(x=>x&&x.logo).length,`<div class="event-sponsor-admin-grid event-builder-list" id="eventSponsorsBuilder">${sponsors.filter(x=>x&&x.logo).map(eventSponsorItem).join('')}</div>`,sponsorActions)}

      <label>Status<select name="status"><option value="published" ${e.status!=='draft'?'selected':''}>Published</option><option value="draft" ${e.status==='draft'?'selected':''}>Draft</option></select></label>
      <label class="check-row"><input type="checkbox" name="featured" ${e.featured?'checked':''}><span><strong>Featured event</strong><small>Only one event is featured at a time. It appears in the large top section.</small></span></label>
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="events">Cancel</button><button class="primary-button" type="submit">Save Event</button></div></form></section>`;
    refreshEventBuilderUI();setupEventSortable();
  }


  function feePill(student){return `<span class="fee-pill fee-${esc(student.feeStatus||'pending')}">${esc(student.feeStatus||'pending')}</span>`;}
  function studentThumb(student){return `<div class="student-profile-cell">${student.image?`<img src="${esc(mediaUrl(student.image))}" alt="">`:`<span>${initials(student.name)}</span>`}<div><strong>${esc(student.name)}</strong><small>${esc(student.email||'')}</small></div></div>`;}
  function certificatePublicUrl(studentCode=''){const code=String(studentCode||'').trim();return code?`../certificate.php?student=${encodeURIComponent(code)}`:'#';}
  function certificateForStudent(student){if(!student)return null;return (state.certificates||[]).find(c=>Number(c.studentId)===Number(student.id)&&(!student.courseId||Number(c.courseId)===Number(student.courseId)))||(state.certificates||[]).find(c=>Number(c.studentId)===Number(student.id))||null;}
  function certificateDateValue(value){return value?String(value).slice(0,10):'';}
  function downloadCertificatesCsv(){
    const rows=state.certificates||[];
    const headers=['Certificate ID','Student ID','Student Name','Email','Phone','Branch','Course','Batch','From Date','To Date','Issued On','Signing Authority','Designation','Certificate Link'];
    const q=v=>`"${String(v??'').replaceAll('"','""')}"`;
    const data=[headers.map(q).join(','),...rows.map(c=>[
      c.id,c.studentCode,c.studentName,c.email,c.phone,c.branch,c.courseName,c.batchName,c.fromDate,c.toDate,c.issuedOn,c.signingName,c.signingTitle,
      new URL(certificatePublicUrl(c.studentCode),location.href).href
    ].map(q).join(','))].join('\r\n');
    const blob=new Blob([data],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`full-stack-academy-certificates-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  async function renderStudentsAdmin(){
    if(!isCentralRole()&&['alumni','candidates'].includes(state.studentTab))state.studentTab='enrolled';
    const tab=state.studentTab||'enrolled';
    const [studentsResult,branchesResult,certificatesResult,authoritiesResult,coursesResult,batchesResult]=await Promise.all([api('admin_students'),api('admin_branches'),api('admin_certificates'),api('admin_certificate_signing_authorities'),api('admin_courses'),api('admin_batches')]);
    state.students=studentsResult.students||[];state.branches=branchesResult.branches||[];state.certificates=certificatesResult.certificates||[];state.signingAuthorities=authoritiesResult.authorities||[];state.courses=coursesResult.courses||[];state.batches=batchesResult.batches||[];

    // Load optional public-profile data only when that submenu is selected.
    if(tab==='alumni'){
      const alumniResult=await api('admin_alumni');
      state.alumni=alumniResult.alumni||[];
    } else if(tab==='candidates'){
      try{
        const candidateResult=await api('admin_candidates');
        state.candidates=candidateResult.candidates||[];
      }catch(candidateError){
        // Compatibility fallback for projects where the public catalogue route
        // is newer than the admin_candidates route. It is still backend data.
        try{
          const catalogue=await api('catalog');
          state.candidates=catalogue.candidates||[];
        }catch(_){
          state.candidates=[];
          drawStudentsAdmin();
          const host=content.querySelector('[data-job-seekers-load-error]');
          if(host) host.innerHTML=`<div class="alert"><span><strong>Job Seekers could not be loaded.</strong> ${esc(candidateError.message||'Check the backend connection and refresh this section.')}</span></div>`;
          toast(candidateError.message||'Job Seekers could not be loaded.','error');
          return;
        }
      }
    }
    drawStudentsAdmin();
  }
  function certificateAuthorityById(id){return (state.signingAuthorities||[]).find(a=>Number(a.id)===Number(id))||null;}
  function certificateAuthorityMatch(certificate={}){
    if(certificate.signingAuthorityId){const direct=certificateAuthorityById(certificate.signingAuthorityId);if(direct)return direct;}
    return (state.signingAuthorities||[]).find(a=>String(a.name||'').trim().toLowerCase()===String(certificate.signingName||'').trim().toLowerCase())||null;
  }
  function signingAuthorityOptions(selectedId=0){
    const active=(state.signingAuthorities||[]).filter(a=>a.active!==false||Number(a.id)===Number(selectedId));
    return `<option value="">Choose signing authority</option>${active.map(a=>`<option value="${a.id}" ${Number(a.id)===Number(selectedId)?'selected':''}>${esc(a.name)} — ${esc(a.designation||'No designation')}</option>`).join('')}`;
  }
  function authorityPreviewHtml(authority){
    if(!authority)return `<div class="certificate-authority-preview"><div class="certificate-authority-preview-image">No signature</div><div class="certificate-authority-preview-copy"><strong>Select an authority</strong><small>Designation and signature will be filled automatically.</small></div></div>`;
    return `<div class="certificate-authority-preview"><div class="certificate-authority-preview-image">${authority.signatureUrl?`<img src="${esc(mediaUrl(authority.signatureUrl))}" alt="${esc(authority.name)} signature">`:'No signature'}</div><div class="certificate-authority-preview-copy"><strong>${esc(authority.name)}</strong><span>${esc(authority.designation||'')}</span><small>${authority.active===false?'Inactive authority':'Signature and designation will be applied automatically.'}</small></div></div>`;
  }
  function updateCertificateAuthorityPreview(form){
    if(!form)return;const select=form.elements.signingAuthorityId,host=form.querySelector('[data-certificate-authority-preview]');if(!host)return;
    host.innerHTML=authorityPreviewHtml(certificateAuthorityById(select?.value||0));
  }
  function updateBulkCertificateIdPreview(form){
    if(!form)return;const host=form.querySelector('[data-certificate-id-preview]');if(!host)return;
    const refs=String(form.elements.references?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!refs.length){host.innerHTML=`<div class="certificate-resolved-empty">Leave empty to generate certificates for every completed student in your access scope.</div>`;return;}
    const map=new Map((state.students||[]).map(s=>[String(s.studentCode||'').trim().toLowerCase(),s]));
    host.innerHTML=`<div class="certificate-resolved-list">${refs.slice(0,100).map(code=>{const s=map.get(code.toLowerCase());return `<div class="certificate-resolved-item"><div><strong>${esc(code)}</strong><small>${s?esc(s.name):'Student ID not found'}</small></div><span class="${s&&s.academicStatus==='completed'?'status-pill status-approved':'status-pill status-pending'}">${s?(s.academicStatus==='completed'?'Completed':'Not completed'):'Unknown'}</span></div>`;}).join('')}</div>`;
  }
  function canManageSigningAuthorities(){return ['super_admin','admin_staff'].includes(normalizedRole());}
  function signingAuthoritiesPanel(){
    const rows=state.signingAuthorities||[];
    if(!rows.length)return emptyState('No signing authorities yet','Add your first authorised signer. Their designation and signature will then be selectable when generating certificates.');
    return `<div class="signing-authority-grid">${rows.map(a=>`<article class="signing-authority-card"><div class="signing-authority-card-head"><div class="signing-authority-avatar">${a.signatureUrl?`<img src="${esc(mediaUrl(a.signatureUrl))}" alt="">`:'No signature'}</div><div><h3>${esc(a.name)}</h3><p>${esc(a.designation||'No designation')}</p></div></div><div class="signing-authority-meta"><span class="${a.active!==false?'status-pill status-approved':'status-pill status-pending'}">${a.active!==false?'Active':'Inactive'}</span><small>ID ${a.id}</small></div>${canManageSigningAuthorities()?`<div class="signing-authority-actions"><button data-action="edit-signing-authority" data-id="${a.id}">Edit</button><button data-action="delete-signing-authority" data-id="${a.id}">Delete</button></div>`:''}</article>`).join('')}</div>`;
  }
  function openSigningAuthorityEditor(authority={}){
    if(!canManageSigningAuthorities()){toast('Only Super Admin or Admin Staff can manage signing authorities.','error');return;}
    const a={active:true,...authority};
    content.innerHTML=`${pageHead(a.id?'Edit Signing Authority':'Add Signing Authority','Save the signer once. Certificate forms will automatically use this person’s designation and signature.','<button class="secondary-button" data-student-section="signing">← Signing Authorities</button>')}
      <section class="certificate-panel"><div class="certificate-panel-body">
        <form id="signingAuthorityForm" class="signing-authority-form">
          <input type="hidden" name="id" value="${Number(a.id||0)}">
          <label>Authority name<input name="name" required maxlength="190" value="${esc(a.name||'')}" placeholder="Example: Mohammed Imran"></label>
          <label>Designation<input name="designation" required maxlength="190" value="${esc(a.designation||'')}" placeholder="Example: Director, Full Stack Academy"></label>
          <label class="full">Signature image<div class="media-input-row"><input name="signatureUrl" required maxlength="2000" value="${esc(a.signatureUrl||'')}" placeholder="Choose signature from Media Library"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="signatureUrl">Choose Media</button></div><small>Upload a clean transparent PNG/WebP signature for best certificate output.</small></label>
          <div class="full signing-authority-signature-preview" data-signing-authority-image>${a.signatureUrl?`<img src="${esc(mediaUrl(a.signatureUrl))}" alt="Signature preview">`:'Signature preview will appear here.'}</div>
          <label class="check-row full"><input type="checkbox" name="active" ${a.active!==false?'checked':''}><span><strong>Active signing authority</strong><small>Inactive authorities stay in history but are not offered for new certificates.</small></span></label>
          <div class="form-actions full"><button class="secondary-button" type="button" data-student-section="signing">Cancel</button><button class="primary-button" type="submit">${a.id?'Update Authority':'Save Authority'}</button></div>
        </form>
      </div></section>`;
  }

  function certificateBulkPanel(){
    const completed=(state.students||[]).filter(s=>s.academicStatus==='completed');
    const last=(state.certificates||[])[0]||{};
    const matched=certificateAuthorityMatch(last);
    return `<section class="certificate-panel">
      <div class="certificate-panel-head"><div><h2>Bulk Generate Certificates</h2><p>Paste Student IDs only. Student names, course, batch and dates are pulled automatically from the backend.</p></div></div>
      <div class="certificate-panel-body">
        <form id="bulkCertificateForm">
          <div class="certificate-bulk-layout">
            <div class="certificate-id-card">
              <h3>1. Student IDs</h3><p>One Student ID per line. Do not type student names.</p>
              <div class="certificate-bulk-grid">
                <label class="full">Completed Student IDs <small>${completed.length} completed student${completed.length===1?'':'s'} available</small><textarea name="references" rows="9" placeholder="FSA_51026-ABCD&#10;FSA_51026-EFGH&#10;FSA_51026-IJKL"></textarea></label>
              </div>
              <div class="certificate-id-example"><span>Accepted format</span><code>FSA_51026-ABCD</code></div>
              <div data-certificate-id-preview><div class="certificate-resolved-empty">Paste Student IDs above. Matching student names will be resolved automatically.</div></div>
            </div>
            <div class="certificate-authority-card">
              <h3>2. Certificate authority</h3><p>Select a saved authority. Designation and signature are applied automatically.</p>
              <div class="certificate-bulk-grid">
                <label class="full">Signing authority<select name="signingAuthorityId" required>${signingAuthorityOptions(matched?.id||0)}</select></label>
                <label class="full">Issued on<input name="issuedOn" type="date" value="${new Date().toISOString().slice(0,10)}" required></label>
              </div>
              <div data-certificate-authority-preview>${authorityPreviewHtml(matched)}</div>
              <div class="certificate-help" style="margin-top:14px"><strong>Automatic details:</strong> Student name, course, batch, branch, Student ID, batch dates, designation and signature are taken from saved backend records.</div>
            </div>
          </div>
          <div class="form-actions" style="margin-top:20px;justify-content:flex-end"><button class="primary-button" type="submit">Generate Certificates</button></div>
        </form>
      </div>
    </section>`;
  }

  function certificateTable(){
    const rows=state.certificates||[];
    return rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Student ID / Link</th><th>Course / Batch</th><th>Dates</th><th>Signing Authority</th><th>Actions</th></tr></thead><tbody>${rows.map(c=>`<tr>
      <td><strong>${esc(c.studentName)}</strong><br><small>${esc(c.email||'')} · ${esc(c.branch||'')}</small></td>
      <td><a class="certificate-table-link" href="${certificatePublicUrl(c.studentCode)}" target="_blank">${esc(c.studentCode||'Open')}</a><br><small>Issued ${esc(c.issuedOn||'—')}</small></td>
      <td><strong>${esc(c.courseName||'—')}</strong><br><small>${esc(c.batchName||'No batch')}</small></td>
      <td><small>${esc(c.fromDate||'—')} → ${esc(c.toDate||'—')}</small></td>
      <td>${esc(c.signingName||'—')}<br><small>${esc(c.signingTitle||'')}</small></td>
      <td><div class="row-actions"><a href="${certificatePublicUrl(c.studentCode)}" target="_blank">Open</a><button data-action="edit-student-certificate" data-id="${c.id}">Edit</button><button data-action="delete-student-certificate" data-id="${c.id}">Delete</button></div></td>
    </tr>`).join('')}</tbody></table></div>`:emptyState('No certificates yet','Mark a student as Completed, then generate a certificate from the student record or use Bulk Generate.');
  }

  function drawStudentsAdmin(){
    const students=state.students||[],tab=state.studentTab||'enrolled';
    const studying=students.filter(s=>s.academicStatus==='studying').length,completed=students.filter(s=>s.academicStatus==='completed').length,alumniCount=students.filter(s=>s.isAlumni).length,jobCount=students.filter(s=>s.isJobSeeker).length,outstanding=students.reduce((sum,s)=>sum+Number(s.feePending||0),0),certCount=(state.certificates||[]).length;
    let body='';
    if(tab==='enrolled') body=students.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>Course / Batch</th><th>Fees</th><th>Certificate</th><th>Profile</th><th>Actions</th></tr></thead><tbody>${students.map(s=>{const cert=certificateForStudent(s);return `<tr><td>${studentThumb(s)}</td><td><span class="student-id-chip">${esc(s.studentCode||'Pending ID')}</span><br><small>${esc(s.academicStatus.replace('_',' '))}</small></td><td><strong>${esc(s.course||'No course')}</strong><br><small>${esc(s.batch||'No batch')}</small></td><td>${feePill(s)}<br><small>${money(s.feePaid)} / ${money(s.feeTotal)}</small></td><td>${cert?`<a class="certificate-link-chip" href="${certificatePublicUrl(s.studentCode)}" target="_blank">${esc(s.studentCode)}</a>`:s.academicStatus==='completed'?`<button data-action="generate-student-certificate" data-id="${s.id}">Generate</button>`:'<small>Complete course first</small>'}</td><td>${s.isAlumni?'<span class="student-linked-badge">ALUMNI</span>':''}${s.isJobSeeker?'<span class="student-linked-badge">JOB SEEKER</span>':''}${!s.isAlumni&&!s.isJobSeeker?'<small>Current student</small>':''}</td><td><div class="row-actions"><button data-action="edit-student" data-id="${s.id}">Edit</button><button data-action="delete-student" data-id="${s.id}">Delete</button></div></td></tr>`;}).join('')}</tbody></table></div>`:emptyState('No students yet','Add your first enrolled student.');
    else if(tab==='alumni') body=state.alumni.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Alumni</th><th>Placement</th><th>Course</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.alumni.map(a=>`<tr><td><div class="student-profile-cell">${a.image?`<img src="${esc(mediaUrl(a.image))}" alt="">`:`<span>${initials(a.name)}</span>`}<div><strong>${esc(a.name)}</strong><small>${esc(a.location||'')}</small></div></div></td><td><strong>${esc(a.role||'—')}</strong><br><small>${esc(a.company||'—')} · ${esc(a.salary||'—')}</small></td><td>${esc(a.course||'—')}</td><td><span class="${statusClass(a.status)}">${esc(a.status)}</span>${a.studentId?'<span class="student-linked-badge">STUDENT LINKED</span>':''}</td><td><div class="row-actions">${a.studentId?`<button data-action="edit-student" data-id="${a.studentId}">Edit Student</button>`:`<button data-action="edit-alumni" data-id="${a.id}">Edit</button>`}<a href="../#/alumni" target="_blank">View</a></div></td></tr>`).join('')}</tbody></table></div>`:emptyState('No alumni profiles','Mark a student as Alumni or add an alumni profile.');
    else if(tab==='candidates') body=`<div data-job-seekers-load-error></div>${state.candidates.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Job Seeker</th><th>Track / Skills</th><th>Availability</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.candidates.map(c=>`<tr><td><div class="student-profile-cell">${c.image?`<img src="${esc(mediaUrl(c.image))}" alt="">`:`<span>${initials(c.name)}</span>`}<div><strong>${esc(c.name)}</strong><small>${esc(c.location||'')}</small></div></div></td><td>${esc(c.course||'—')}<br><small>${esc((c.skills||[]).slice(0,4).join(', '))}</small></td><td>${esc(c.availability||'Available')}</td><td><span class="${statusClass(c.status)}">${esc(c.status)}</span>${c.studentId?'<span class="student-linked-badge">STUDENT LINKED</span>':''}</td><td><div class="row-actions">${c.studentId?`<button data-action="edit-student" data-id="${c.studentId}">Edit Student</button>`:`<button data-action="edit-candidate" data-id="${c.id}">Edit</button>`}<a href="../#/candidates" target="_blank">View Public Page</a></div></td></tr>`).join('')}</tbody></table></div>`:emptyState('No job seekers','Mark a student as Job Seeker to publish them here.')}`;
    else if(tab==='fees') body=students.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Total Fee</th><th>Paid</th><th>Pending</th><th>Status</th><th>Action</th></tr></thead><tbody>${students.map(s=>`<tr><td>${studentThumb(s)}</td><td>${esc(s.course||'—')}</td><td>${money(s.feeTotal)}</td><td>${money(s.feePaid)}</td><td><strong>${money(s.feePending)}</strong></td><td>${feePill(s)}</td><td><button data-action="edit-student" data-id="${s.id}">Update Fees</button></td></tr>`).join('')}</tbody></table></div>`:emptyState('No fee records','Student fee records will appear here.');
    else if(tab==='certificates') body=`<div class="certificate-summary-grid"><article class="certificate-summary-card"><small>Completed Students</small><strong>${completed}</strong></article><article class="certificate-summary-card"><small>Certificates Issued</small><strong>${certCount}</strong></article><article class="certificate-summary-card"><small>Completed Without Certificate</small><strong>${Math.max(0,completed-certCount)}</strong></article></div>${certificateBulkPanel()}<section class="certificate-panel"><div class="certificate-panel-head"><div><h2>All Certificates</h2><p>Every generated course-completion certificate, with Student ID based public links.</p></div><button class="secondary-button" data-action="download-certificates-csv">Download CSV</button></div><div class="certificate-panel-body">${certificateTable()}</div></section>`;
    else if(tab==='signing') body=`<section class="certificate-panel"><div class="certificate-panel-head"><div><h2>Saved Signing Authorities</h2><p>Add each authorised signer once. Their designation and signature then fill automatically on single and bulk certificates.</p></div>${canManageSigningAuthorities()?'<button class="primary-button" data-action="add-signing-authority">+ Add Signing Authority</button>':''}</div><div class="certificate-panel-body">${signingAuthoritiesPanel()}</div></section>`;
    const sectionTitle={enrolled:'Students Enrolled',alumni:'Alumni',candidates:'Job Seekers',fees:'Fees',certificates:'Certificates',signing:'Signing Authorities'}[tab]||'Students Enrolled';
    const sectionText={enrolled:'Manage currently enrolled students, course and batch assignments.',alumni:'Students and alumni profiles connected to the public Alumni page.',candidates:'Students and candidates available through the public Job Seekers page.',fees:'Check complete, partial and pending student fee balances.',certificates:'Generate, edit, open, export and delete completion certificates.',signing:'Manage certificate signers, their designations and signature images.'}[tab]||'';
    const sectionAction=tab==='enrolled'?'<button class="primary-button" data-action="add-student">+ Add New Student</button>':'';
    const summary=tab==='certificates'?'':`<div class="student-summary-grid"><article class="student-summary-card"><small>Total Students</small><strong>${students.length}</strong></article><article class="student-summary-card"><small>Currently Studying</small><strong>${studying}</strong></article><article class="student-summary-card"><small>Completed</small><strong>${completed}</strong></article><article class="student-summary-card"><small>Outstanding Fees</small><strong>${money(outstanding)}</strong></article></div>`;
    content.innerHTML=`${pageHead(sectionTitle,sectionText,sectionAction)}${summary}${body}`;
    document.querySelectorAll('[data-student-section]').forEach(btn=>btn.classList.toggle('active',btn.dataset.studentSection===tab));
    if(tab==='certificates'){const form=document.getElementById('bulkCertificateForm');updateBulkCertificateIdPreview(form);updateCertificateAuthorityPreview(form);}
  }
  function studentBatchModeToDelivery(batch){const key=String(batch?.modeKey||'').toLowerCase();return key==='offline-classroom'?'offline':key==='recorded'?'recorded':'live';}
  function studentCourseModes(course){const modes=Array.isArray(course?.deliveryModes)&&course.deliveryModes.length?course.deliveryModes:(course?.deliveryMode?[course.deliveryMode]:[]);return modes.filter(mode=>COURSE_MODES.includes(mode));}
  function studentCourseModePrice(course,mode){if(!course)return 0;const direct=Number(course?.pricingByMode?.[mode]?.price);if(Number.isFinite(direct)&&direct>=0)return direct;const nested=Number(course?.contentModes?.[mode]?.price);if(Number.isFinite(nested)&&nested>=0)return nested;return Number(course.price||0);}
  function studentBatchOptions(selected=0,courseId=0,deliveryMode=''){const rows=state.batches.filter(b=>{if(courseId&&Number(b.courseId||0)!==Number(courseId))return false;if(deliveryMode&&studentBatchModeToDelivery(b)!==deliveryMode)return false;return true;});return `<option value="">${courseId?'Choose batch':'Choose course first'}</option>${rows.map(b=>`<option value="${b.id}" ${Number(selected)===Number(b.id)?'selected':''}>${esc(b.course||b.courseName||'Batch')} — ${esc(b.mode||COURSE_MODE_LABELS[studentBatchModeToDelivery(b)]||'')} — ${esc(b.branch||b.branchName||'Online')} ${b.startDate?`— ${esc(b.startDate)}`:''}</option>`).join('')}`;}
  function refreshStudentCourseAssignment(form,{initial=false,courseChanged=false,modeChanged=false,batchChanged=false}={}){
    if(!form)return;
    const courseSelect=form.elements.courseId,modeSelect=form.elements.deliveryMode,batchSelect=form.elements.batchId,feeInput=form.elements.feeTotal;
    const courseId=Number(courseSelect?.value||0),course=state.courses.find(c=>Number(c.id)===courseId);
    const allowed=studentCourseModes(course);
    let mode=String(modeSelect?.value||'');
    const currentBatch=state.batches.find(b=>Number(b.id)===Number(batchSelect?.value||0));
    if(batchChanged&&currentBatch)mode=studentBatchModeToDelivery(currentBatch);
    if(!allowed.includes(mode))mode=allowed[0]||'';
    if(modeSelect){modeSelect.innerHTML=allowed.length?allowed.map(m=>`<option value="${m}" ${m===mode?'selected':''}>${esc(COURSE_MODE_LABELS[m]||m)}</option>`).join(''):'<option value="">Choose course first</option>';modeSelect.disabled=!allowed.length;}
    const eligible=state.batches.filter(b=>Number(b.courseId||0)===courseId&&(!mode||studentBatchModeToDelivery(b)===mode));
    let selectedBatchId=Number(batchSelect?.value||0);
    if(!eligible.some(b=>Number(b.id)===selectedBatchId))selectedBatchId=0;
    if((courseChanged||modeChanged)&&eligible.length===1)selectedBatchId=Number(eligible[0].id);
    if(batchSelect){batchSelect.innerHTML=studentBatchOptions(selectedBatchId,courseId,mode);batchSelect.disabled=!courseId;}
    const selectedBatch=eligible.find(b=>Number(b.id)===Number(batchSelect?.value||selectedBatchId));
    let autoFee=selectedBatch?Number(selectedBatch.fee||0):studentCourseModePrice(course,mode);
    if(!Number.isFinite(autoFee)||autoFee<0)autoFee=0;
    if(feeInput && (!initial || Number(feeInput.value||0)<=0 || courseChanged || modeChanged || batchChanged))feeInput.value=String(autoFee);
    const source=form.querySelector('[data-student-auto-source]');
    if(source){const parts=[];if(course)parts.push(esc(course.title));if(mode)parts.push(esc(COURSE_MODE_LABELS[mode]||mode));if(selectedBatch)parts.push(esc(selectedBatch.branch||selectedBatch.branchName||'Online'));source.innerHTML=course?`<strong>Auto-loaded from backend</strong><span>${parts.join(' · ')}${selectedBatch?` · Batch fee ${money(autoFee)}`:` · Course fee ${money(autoFee)}`}</span>`:'<strong>Select a course</strong><span>Available access types, batches and fee will load automatically.</span>';}
    updateStudentFeePreview(form);
  }
  function filterStudentBatchOptions(form){refreshStudentCourseAssignment(form,{initial:true});}
  function updateStudentFeePreview(form){if(!form)return;const total=Number(form.elements.feeTotal?.value||0),paid=Number(form.elements.feePaid?.value||0),pending=Math.max(0,total-paid),status=total>0&&paid>=total?'Complete':paid>0?'Partial':'Pending';const box=form.querySelector('[data-student-fee-preview]');if(box){const pct=total>0?Math.min(100,(paid/total)*100):0;box.innerHTML=`<div class="student-fee-line"><span>${status}</span><strong>${money(pending)} pending</strong></div><div class="student-fee-meter"><span style="width:${pct}%"></span></div>`;}}
  function toggleStudentPanels(form){if(!form)return;const alumni=form.querySelector('[data-student-alumni-panel]'),job=form.querySelector('[data-student-job-panel]');if(alumni)alumni.hidden=!form.elements.isAlumni?.checked;if(job)job.hidden=!form.elements.isJobSeeker?.checked;}
  function studentFormPayload(form){
    const fd=new FormData(form),payload=Object.fromEntries(fd.entries());
    payload.isAlumni=fd.get('isAlumni')==='on';payload.isJobSeeker=fd.get('isJobSeeker')==='on';payload.jobSkills=splitLines(fd.get('jobSkills'));
    return payload;
  }
  function updateStudentCertificateSection(form){
    if(!form)return;
    const box=form.querySelector('[data-student-certificate-section]');if(!box)return;
    const completed=form.elements.academicStatus?.value==='completed';
    box.hidden=!completed;
    if(!completed)return;
    const id=Number(form.elements.id?.value||0),student=state.students.find(s=>Number(s.id)===id),cert=certificateForStudent(student);
    const actionBox=box.querySelector('[data-certificate-actions]');if(!actionBox)return;
    if(cert&&student){
      actionBox.innerHTML=`<div class="certificate-state"><div><strong>Certificate already generated</strong><small>Public certificate link uses Student ID ${esc(student.studentCode||'')}.</small></div><div class="certificate-state-actions"><a class="secondary-button" href="${certificatePublicUrl(student.studentCode)}" target="_blank">Open Certificate</a><button class="primary-button" type="button" data-action="edit-student-certificate" data-id="${cert.id}">Edit Certificate</button></div></div>`;
    }else{
      actionBox.innerHTML=`<div class="certificate-state"><div><strong>Ready to generate</strong><small>Student details, course, batch and dates will be loaded automatically. Saving this form first ensures the Completed status is stored.</small></div><div class="certificate-state-actions"><button class="primary-button" type="button" data-action="save-and-generate-certificate">Save & Generate Certificate</button></div></div>`;
    }
  }
  function openCertificateEditor(student={},certificate={}){
    const s=student||{},c=certificate||{};
    if(!s.id){toast('Save the student before generating a certificate.','error');return;}
    const batch=state.batches.find(b=>Number(b.id)===Number(s.batchId||c.batchId||0));
    const fromDate=certificateDateValue(c.fromDate||batch?.startDate||'');
    const toDate=certificateDateValue(c.toDate||batch?.endDate||'');
    const issuedOn=certificateDateValue(c.issuedOn||new Date().toISOString().slice(0,10));
    const matched=certificateAuthorityMatch(c);
    content.innerHTML=`${pageHead(c.id?'Edit Certificate':'Generate Certificate','Student name, course, batch and dates come from the student record. Select only the saved signing authority.','<button class="secondary-button" data-student-section="certificates">← All Certificates</button>')}
      <section class="certificate-panel">
        <div class="certificate-panel-body">
          <form class="signing-authority-form" id="certificateForm">
            <input type="hidden" name="id" value="${Number(c.id||0)}"><input type="hidden" name="studentId" value="${Number(s.id)}">
            <div class="certificate-editor-preview full"><small>Student</small><strong>${esc(s.name||'')}</strong><span class="student-id-chip">${esc(s.studentCode||'')}</span><small>${esc(s.course||'No course')} ${s.batch?`· ${esc(s.batch)}`:''}</small></div>
            <label>Issued on<input name="issuedOn" type="date" required value="${esc(issuedOn)}"></label>
            <label>Signing authority<select name="signingAuthorityId" required>${signingAuthorityOptions(matched?.id||0)}</select></label>
            <label>From date<input name="fromDate" type="date" value="${esc(fromDate)}"><small>Loaded from the selected batch when available.</small></label>
            <label>To date<input name="toDate" type="date" value="${esc(toDate)}"><small>Loaded from the selected batch when available.</small></label>
            <div class="full" data-certificate-authority-preview>${authorityPreviewHtml(matched)}</div>
            <div class="certificate-help full"><strong>Automatic:</strong> Student name, course, batch and branch are taken from the backend. The public certificate link is <a href="${certificatePublicUrl(s.studentCode)}" target="_blank">${esc(s.studentCode||'Student ID')}</a>.</div>
            <div class="form-actions full"><button class="secondary-button" type="button" data-action="edit-student" data-id="${Number(s.id)}">Back to Student</button><button class="primary-button" type="submit">${c.id?'Update Certificate':'Generate Certificate'}</button></div>
          </form>
        </div>
      </section>`;
    updateCertificateAuthorityPreview(document.getElementById('certificateForm'));
  }
  function openStudentEditor(student={}){
    const s={academicStatus:'studying',jobExperience:'Fresher',jobLocation:'Hyderabad',jobAvailability:'Available',deliveryMode:'',...student};
    const courseOptions=state.courses.map(c=>`<option value="${c.id}" ${Number(s.courseId)===Number(c.id)?'selected':''}>${esc(c.title)}</option>`).join('');
    const selectedCourse=state.courses.find(c=>Number(c.id)===Number(s.courseId));
    const availableModes=studentCourseModes(selectedCourse);
    const initialMode=availableModes.includes(s.deliveryMode)?s.deliveryMode:(availableModes[0]||'');
    const deliveryOptions=availableModes.length?availableModes.map(m=>`<option value="${m}" ${m===initialMode?'selected':''}>${esc(COURSE_MODE_LABELS[m]||m)}</option>`).join(''):'<option value="">Choose course first</option>';
    const studentCode=esc(s.studentCode||'Generated after save');
    content.innerHTML=`${pageHead(s.id?'Edit Student':'Add New Student','Create the student account, connect the course and batch, then manage fee and public profile status.','<button class="secondary-button" data-view="students">← Back to Students</button>')}
      <form class="student-editor" id="studentForm"><input type="hidden" name="id" value="${Number(s.id||0)}">
        <div class="student-editor-hero"><div class="student-editor-hero-copy"><span class="student-editor-hero-icon">◎</span><div><h2>${s.id?'Update Student Record':'New Student Registration'}</h2><p>Complete the core details first. You can update fees, Alumni and Job Seeker status any time later.</p></div></div><div class="student-editor-id"><span>Student ID</span><strong>${studentCode}</strong></div></div>

        <section class="student-editor-card">
          <div class="student-card-head"><span class="student-card-step">01</span><div><h2>Student Details</h2><p>Personal details, login information and branch assignment.</p></div></div>
          <div class="student-card-body"><div class="student-identity-layout"><div class="student-identity-main"><div class="student-editor-grid">
            <label>Student name<input name="name" required maxlength="120" value="${esc(s.name||'')}" placeholder="Enter full student name"></label>
            <label>Father name<input name="fatherName" maxlength="190" value="${esc(s.fatherName||'')}" placeholder="Enter father name"></label>
            <label>Date of birth<input name="dob" type="date" value="${esc(s.dob||'')}"></label>
            <label>CNIC / National ID<input name="cnic" maxlength="40" value="${esc(s.cnic||'')}" placeholder="Example: 42101-1234567-1"></label>
            <label>Email ID<input name="email" type="email" required value="${esc(s.email||'')}" placeholder="student@example.com"></label>
            <label>Phone<input name="phone" maxlength="40" value="${esc(s.phone||'')}" placeholder="+92 300 0000000"></label>
            <label>Branch<select name="branch">${state.branches.map(b=>{const v=b.shortName||b.name||b.slug;const selected=v===(s.branch||state.user?.branch||'');return `<option value="${esc(v)}" ${selected?'selected':''}>${esc(b.shortName||b.name)}</option>`;}).join('')}</select></label>
            <label>${s.id?'New password':'Login password'} <small>${s.id?'Leave blank to keep current password':'Optional. Leave blank to auto-generate.'}</small><input name="password" type="password" minlength="8" placeholder="${s.id?'Leave blank to keep current':'Auto-generate if empty'}"></label>
          </div></div><aside class="student-photo-panel">${easyImageField('Student photo','image',s.image,'Use a clear square portrait. This image is also used on linked public profiles.')}</aside></div></div>
        </section>

        <section class="student-editor-card">
          <div class="student-card-head"><span class="student-card-step">02</span><div><h2>Course, Access & Batch</h2><p>Select the course once. Access types, matching batches and course fee are loaded automatically from the backend.</p></div></div>
          <div class="student-card-body"><div class="student-editor-grid student-course-grid"><label>Course<select name="courseId"><option value="">Choose course</option>${courseOptions}</select></label><label>Access type<select name="deliveryMode" ${availableModes.length?'':'disabled'}>${deliveryOptions}</select><small>Only delivery types enabled on this course are shown.</small></label><label>Batch<select name="batchId" ${s.courseId?'':'disabled'}>${studentBatchOptions(s.batchId,s.courseId,initialMode)}</select><small>Only batches belonging to this course and access type are shown.</small></label><label>Student status<select name="academicStatus"><option value="studying" ${s.academicStatus==='studying'?'selected':''}>Currently Studying</option><option value="completed" ${s.academicStatus==='completed'?'selected':''}>Completed</option><option value="on_hold" ${s.academicStatus==='on_hold'?'selected':''}>On Hold</option><option value="inactive" ${s.academicStatus==='inactive'?'selected':''}>Inactive</option></select></label><div class="full student-auto-source" data-student-auto-source></div></div></div>
        </section>

        <section class="student-editor-card">
          <div class="student-card-head"><span class="student-card-step">03</span><div><h2>Fees</h2><p>Total fee comes from the selected backend batch or course access type. Enter only the amount received.</p></div></div>
          <div class="student-card-body"><div class="student-editor-grid student-fee-grid"><label>Total fee <small>Auto-loaded</small><input name="feeTotal" type="number" min="0" step="0.01" value="${Number(s.feeTotal||0)}" placeholder="0" readonly></label><label>Paid amount<input name="feePaid" type="number" min="0" step="0.01" value="${Number(s.feePaid||0)}" placeholder="0"></label><div class="full student-fee-preview-card" data-student-fee-preview></div></div></div>
        </section>

        <section class="student-editor-card" data-student-certificate-section ${s.academicStatus==='completed'?'':'hidden'}>
          <div class="student-card-head"><span class="student-card-step">04</span><div><h2>Certificate</h2><p>Available when the student is marked Completed. Generate the public certificate using the Student ID link.</p></div></div>
          <div class="student-card-body" data-certificate-actions></div>
        </section>

        <section class="student-editor-card">
          <div class="student-card-head"><span class="student-card-step">05</span><div><h2>Public Profile Status</h2><p>Only enable these when the student should appear on the Alumni or Job Seekers areas.</p></div></div>
          <div class="student-card-body"><div class="student-checks"><label class="student-check-card"><input type="checkbox" name="isAlumni" ${s.isAlumni?'checked':''}><span><strong>Alumni</strong><small>Publish or update this student on the Alumni page.</small></span></label><label class="student-check-card"><input type="checkbox" name="isJobSeeker" ${s.isJobSeeker?'checked':''}><span><strong>Job Seeker</strong><small>Publish or update this student on the Job Seekers page.</small></span></label></div>
            <div class="student-extra-panel" data-student-alumni-panel ${s.isAlumni?'':'hidden'}><div class="student-editor-grid"><label>Placed role<input name="alumniRole" value="${esc(s.alumniRole||'')}"></label><label>Company<input name="alumniCompany" value="${esc(s.alumniCompany||'')}"></label><label>Package / salary<input name="alumniSalary" value="${esc(s.alumniSalary||'')}"></label><label>Location<input name="alumniLocation" value="${esc(s.alumniLocation||'')}"></label><label>Graduation year<input name="alumniGraduationYear" value="${esc(s.alumniGraduationYear||'')}"></label><label class="full">Alumni quote<textarea name="alumniQuote" rows="4">${esc(s.alumniQuote||'')}</textarea></label></div></div>
            <div class="student-extra-panel" data-student-job-panel ${s.isJobSeeker?'':'hidden'}><div class="student-editor-grid"><label>Experience<input name="jobExperience" value="${esc(s.jobExperience||'Fresher')}"></label><label>Location<input name="jobLocation" value="${esc(s.jobLocation||'Hyderabad')}"></label><label>Availability<input name="jobAvailability" value="${esc(s.jobAvailability||'Available')}"></label><label class="full">Skills <small>One skill per line</small><textarea name="jobSkills" rows="5">${esc(toLines(s.jobSkills||[]))}</textarea></label><label class="full">Job Seeker summary<textarea name="jobSummary" rows="4">${esc(s.jobSummary||'')}</textarea></label></div></div>
          </div>
        </section>
        <div class="student-form-actions"><button class="secondary-button" type="button" data-view="students">Cancel</button><button class="primary-button" type="submit">${s.id?'Update Student':'Save Student'}</button></div>
      </form>`;
    const form=document.getElementById('studentForm');refreshStudentCourseAssignment(form,{initial:true});toggleStudentPanels(form);updateStudentFeePreview(form);updateStudentCertificateSection(form);
  }

  async function renderAlumniAdmin(){
    const result=await api('admin_alumni');state.alumni=result.alumni||[];
    content.innerHTML=`${pageHead('Alumni','Successfully placed alumni shown on the public Alumni page and homepage are loaded from MySQL.','<button class="primary-button" data-action="add-alumni">+ Add Alumni</button>')}<div class="table-wrap">${state.alumni.length?`<table class="data-table"><thead><tr><th>Alumni</th><th>Placement</th><th>Course</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.alumni.map(a=>`<tr><td><div class="user-cell"><span>${a.image?`<img src="${esc(mediaUrl(a.image))}" alt="" style="width:46px;height:46px;border-radius:50%;object-fit:cover">`:initials(a.name)}</span><div><strong>${esc(a.name)}</strong><small>${esc(a.location||'—')}</small></div></div></td><td>${esc(a.role||'—')}<br><small>${esc(a.company||'—')} · ${esc(a.salary||'—')}</small></td><td>${esc(a.course||'—')}</td><td><span class="${statusClass(a.status)}">${esc(a.status)}</span></td><td><div class="row-actions"><button data-action="edit-alumni" data-id="${a.id}">Edit</button><a href="../#/alumni" target="_blank">View</a><button data-action="delete-alumni" data-id="${a.id}">Delete</button></div></td></tr>`).join('')}</tbody></table>`:emptyState('No alumni found','Add the first alumni profile.')}</div>`;
  }
  function openAlumniEditor(a={}){
    const row={status:'published',sortOrder:(state.alumni.length+1),...a};
    const courseOptions=(state.courses||[]).map(c=>`<option value="${esc(c.title||c.name||'')}"></option>`).join('');
    const companyOptions=(state.companies||[]).map(c=>`<option value="${esc(c.name||'')}"></option>`).join('');
    content.innerHTML=`${pageHead(row.id?'Edit Alumni':'Add Alumni','Simple alumni form. Add the student photo and placement details; the frontend updates automatically.')}
      <section class="settings-card easy-editor-card"><form class="settings-form easy-editor-form" id="alumniForm"><input type="hidden" name="id" value="${esc(row.id||'')}">
      ${easyImageField('Alumni photo','image',row.image,'Upload a clear portrait. Square or portrait images work best.')}
      <label>Full name<input name="name" required maxlength="190" value="${esc(row.name||'')}" placeholder="Student name"></label>
      <label>Course / Track<input name="course" list="easyAlumniCourses" maxlength="190" value="${esc(row.course||'')}" placeholder="Select or type course"><datalist id="easyAlumniCourses">${courseOptions}</datalist></label>
      <label>Placed role<input name="role" maxlength="190" value="${esc(row.role||'')}" placeholder="Software Engineer"></label>
      <label>Company<input name="company" list="easyAlumniCompanies" maxlength="190" value="${esc(row.company||'')}" placeholder="Select or type company"><datalist id="easyAlumniCompanies">${companyOptions}</datalist></label>
      <label>Package<input name="salary" maxlength="80" value="${esc(row.salary||'')}" placeholder="₹6.5 LPA"></label>
      <label>Location<input name="location" maxlength="190" value="${esc(row.location||'')}" placeholder="Hyderabad"></label>
      <label class="full">Student quote / outcome<textarea name="quote" rows="3" maxlength="5000" placeholder="Short success story or testimonial.">${esc(row.quote||'')}</textarea></label>
      ${easyDetails('Publishing & display','Optional controls for URL, placement year and ordering.',`<div class="settings-form easy-inner-grid"><label>Placement year<input name="graduationYear" maxlength="20" value="${esc(row.graduationYear||'')}"></label><label>URL slug<input name="slug" maxlength="180" value="${esc(row.slug||'')}" placeholder="Auto-created if blank"></label><label>Sort order<input name="sortOrder" type="number" value="${Number(row.sortOrder||0)}"></label><label>Status<select name="status"><option value="published" ${row.status!=='draft'?'selected':''}>Published</option><option value="draft" ${row.status==='draft'?'selected':''}>Draft</option></select></label></div>`)}
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="alumni">Cancel</button><button class="primary-button" type="submit">Save Alumni</button></div></form></section>`;
  }
  async function renderCandidatesAdmin(){
    const result=await api('admin_candidates');state.candidates=result.candidates||[];
    content.innerHTML=`${pageHead('Job Seekers','Available candidates shown on the public Job Seekers page are loaded from MySQL.','<button class="primary-button" data-action="add-candidate">+ Add Job Seeker</button>')}<div class="table-wrap">${state.candidates.length?`<table class="data-table"><thead><tr><th>Candidate</th><th>Track / Skills</th><th>Availability</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.candidates.map(c=>`<tr><td><div class="user-cell"><span>${c.image?`<img src="${esc(mediaUrl(c.image))}" alt="" style="width:46px;height:46px;border-radius:50%;object-fit:cover">`:initials(c.name)}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.location||'—')}</small></div></div></td><td>${esc(c.course||'—')}<br><small>${esc((c.skills||[]).slice(0,4).join(', '))}</small></td><td>${esc(c.availability||'Available')}</td><td><span class="${statusClass(c.status)}">${esc(c.status)}</span></td><td><div class="row-actions"><button data-action="edit-candidate" data-id="${c.id}">Edit</button><a href="../#/candidates" target="_blank">View</a><button data-action="delete-candidate" data-id="${c.id}">Delete</button></div></td></tr>`).join('')}</tbody></table>`:emptyState('No job seekers found','Add the first candidate profile.')}</div>`;
  }
  function openCandidateEditor(c={}){
    const row={status:'published',experience:'Fresher',availability:'Available',location:'Hyderabad',sortOrder:(state.candidates.length+1),...c};
    const courseOptions=(state.courses||[]).map(x=>`<option value="${esc(x.title||x.name||'')}"></option>`).join('');
    content.innerHTML=`${pageHead(row.id?'Edit Job Seeker':'Add Job Seeker','Simple recruiter profile editor. Fill the normal fields and add skills one per line.')}
      <section class="settings-card easy-editor-card"><form class="settings-form easy-editor-form" id="candidateForm"><input type="hidden" name="id" value="${esc(row.id||'')}">
      ${easyImageField('Candidate photo','image',row.image,'Upload a clear professional portrait.')}
      <label>Full name<input name="name" required maxlength="190" value="${esc(row.name||'')}" placeholder="Candidate name"></label>
      <label>Course / Track<input name="course" list="easyCandidateCourses" maxlength="190" value="${esc(row.course||'')}" placeholder="Select or type course"><datalist id="easyCandidateCourses">${courseOptions}</datalist></label>
      <label>Experience<input name="experience" maxlength="120" value="${esc(row.experience||'Fresher')}" placeholder="Fresher / 1 year"></label>
      <label>Availability<select name="availability"><option ${row.availability==='Available'?'selected':''}>Available</option><option ${row.availability==='Interviewing'?'selected':''}>Interviewing</option><option ${row.availability==='Placed'?'selected':''}>Placed</option><option ${row.availability==='Not Available'?'selected':''}>Not Available</option></select></label>
      <label>Location<input name="location" maxlength="190" value="${esc(row.location||'Hyderabad')}" placeholder="Hyderabad"></label>
      <label>Email<input name="email" type="email" maxlength="190" value="${esc(row.email||'')}" placeholder="candidate@email.com"></label>
      <label>Phone<input name="phone" maxlength="60" value="${esc(row.phone||'')}" placeholder="+91 ..."></label>
      <label class="full">Skills <small>Write one skill per line. No JSON required.</small><textarea name="skills" rows="4" placeholder="JavaScript&#10;React&#10;Node.js&#10;MySQL">${esc((row.skills||[]).join('\n'))}</textarea></label>
      <label class="full">Profile summary<textarea name="summary" rows="3" maxlength="5000" placeholder="Short recruiter-facing summary.">${esc(row.summary||'')}</textarea></label>
      ${easyDetails('Publishing & display','Optional URL and ordering controls.',`<div class="settings-form easy-inner-grid"><label>URL slug<input name="slug" maxlength="180" value="${esc(row.slug||'')}" placeholder="Auto-created if blank"></label><label>Sort order<input name="sortOrder" type="number" value="${Number(row.sortOrder||0)}"></label><label>Status<select name="status"><option value="published" ${row.status!=='draft'?'selected':''}>Published</option><option value="draft" ${row.status==='draft'?'selected':''}>Draft</option></select></label></div>`)}
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="candidates">Cancel</button><button class="primary-button" type="submit">Save Job Seeker</button></div></form></section>`;
  }
  async function renderInstructorsAdmin(){
    const [result,branchResult]=await Promise.all([api('admin_instructors'),api('admin_branches')]);state.instructors=result.instructors||[];state.branches=branchResult.branches||[];
    content.innerHTML=`${pageHead('Instructors','Instructor profiles shown here are the same backend profiles used by the public Instructors page.')}
      <div class="table-wrap">${state.instructors.length?`<table class="data-table"><thead><tr><th>Instructor</th><th>Headline</th><th>Branch</th><th>Status</th><th>Public</th><th>Actions</th></tr></thead><tbody>${state.instructors.map(i=>`<tr><td><div class="user-cell"><span>${i.avatar?`<img src="${esc(mediaUrl(i.avatar))}" alt="" style="width:42px;height:42px;border-radius:50%;object-fit:cover">`:initials(i.name)}</span><div><strong>${esc(i.name)}</strong><small>${esc(i.email)}</small></div></div></td><td>${esc(i.headline||'Instructor')}</td><td>${esc(i.branch||'—')}</td><td><span class="${statusClass(i.status)}">${esc(i.status)}</span></td><td>${i.profile_public?'Yes':'No'}</td><td>${['super_admin','branch_admin'].includes(normalizedRole())?`<button data-action="edit-instructor" data-id="${i.id}">Edit Profile</button>`:'<span class="muted">View only</span>'}</td></tr>`).join('')}</tbody></table>`:emptyState('No instructors found','Create an Instructor user first from Users.')}</div>`;
  }
  function openInstructorEditor(item){
    if(!item)return;
    content.innerHTML=`${pageHead('Edit Instructor','Manage the image and public instructor information without changing the public website styling.')}
      <section class="settings-card"><form class="settings-form" id="instructorProfileForm"><input type="hidden" name="id" value="${item.id}">
      <label>Full name<input name="name" required value="${esc(item.name||'')}"></label><label>Headline<input name="headline" value="${esc(item.headline||'')}"></label>
      <label>Branch<select name="branch"><option value="">No branch assigned</option>${state.branches.map(b=>`<option value="${esc(b.shortName||b.slug)}" ${(item.branch||'')===(b.shortName||b.slug)?'selected':''}>${esc(b.name)}</option>`).join('')}</select></label><label>Status<select name="status">${['active','pending','blocked'].map(s=>`<option value="${s}" ${item.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
      <label>City<input name="city" value="${esc(item.city||'')}"></label><label>Country<input name="country" value="${esc(item.country||'')}"></label>
      <label class="full">Instructor image<div class="media-input-row"><input name="avatar_url" value="${esc(item.avatar||'')}"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="avatar_url">Choose from Media</button></div></label>
      <label class="full">Bio<textarea name="bio" rows="6">${esc(item.bio||'')}</textarea></label><label class="full">Skills <small>One skill per line.</small><textarea name="skills" rows="5">${esc(toLines(item.skills||[]))}</textarea></label>
      <label class="check-row full"><input type="checkbox" name="profile_public" ${item.profile_public!==false?'checked':''}><span><strong>Show on public Instructors page</strong><small>Only active, public instructors appear on the website.</small></span></label>
      <div class="form-actions full"><button class="secondary-button" type="button" data-view="instructors">Cancel</button><button class="primary-button" type="submit">Save Instructor</button></div></form></section>`;
  }

  async function renderVideoSettings(){
    const result=await api('admin_settings');state.settings=result.settings;const zoom=state.settings.zoom||{};
    content.innerHTML=`${pageHead('Zoom Live Classes','Connect Zoom once. Instructors can then schedule two-way live classes and the LMS creates the Zoom meeting automatically.')}
      <section class="settings-card video-settings-card"><div class="security-summary"><span class="activity-avatar">◉</span><div><strong>Two-way Zoom classroom</strong><p>Students and instructors use normal Zoom audio, video, chat and screen sharing. Join and host links are stored in the LMS live-class record.</p></div></div>
      <form class="settings-form" id="videoSettingsForm">
        <div class="full" style="padding:18px 20px;border:1px solid #ead8dc;border-radius:16px;background:#fffaf9">
          <span class="eyebrow">1. Zoom REST API / meeting creation</span>
          <h3 style="margin:6px 0 6px">Server-to-Server OAuth</h3>
          <p class="muted" style="margin:0">Keep the Account ID, Client ID and Client Secret from your existing Server-to-Server OAuth app. This app creates, updates and deletes meetings.</p>
        </div>
        <label>Zoom Account ID<input name="account_id" maxlength="190" value="${esc(zoom.account_id||'')}" placeholder="Server-to-Server OAuth Account ID"></label>
        <label>Zoom REST Client ID<input name="client_id" maxlength="190" value="${esc(zoom.client_id||'')}" placeholder="Server-to-Server OAuth Client ID"></label>
        <label class="full">Zoom REST Client Secret<input name="client_secret" type="password" autocomplete="new-password" placeholder="${zoom.has_client_secret?'Saved securely — leave blank to keep':'Server-to-Server OAuth Client Secret'}"><small>Stored encrypted in MySQL. Never shown to students or instructors.</small></label>
        <label class="full">Default Zoom host user / email<input name="host_user" maxlength="190" value="${esc(zoom.host_user||'')}" placeholder="teacher@yourdomain.com or Zoom user ID"><small>Meetings and host ZAK tokens are created for this Zoom user.</small></label>
        <label class="check-row full"><input name="enabled" type="checkbox" ${zoom.enabled?'checked':''}><span><strong>Enable automatic Zoom meetings</strong><small>Instructors schedule a live class and the backend creates the Zoom meeting automatically.</small></span></label>
        <label class="check-row"><input name="waiting_room" type="checkbox" ${zoom.waiting_room!==false?'checked':''}><span><strong>Waiting room</strong><small>Students wait until the host admits them.</small></span></label>
        <label class="check-row"><input name="join_before_host" type="checkbox" ${zoom.join_before_host?'checked':''}><span><strong>Allow join before host</strong><small>Normally keep this off for academy classes.</small></span></label>

        <div class="full" style="margin-top:10px;padding:18px 20px;border:1px solid #ead8dc;border-radius:16px;background:#fffaf9">
          <span class="eyebrow">2. Embedded Zoom classroom</span>
          <h3 style="margin:6px 0 6px">Meeting SDK / Embed app</h3>
          <p class="muted" style="margin:0">Use the separate Client ID and Client Secret shown in your Zoom General App → Embed → Web. Meeting SDK does not use an Account ID.</p>
        </div>
        <label>Meeting SDK Client ID<input name="sdk_client_id" maxlength="190" value="${esc(zoom.sdk_client_id||'')}" placeholder="General App / Meeting SDK Client ID"></label>
        <label>Meeting SDK version<input name="sdk_version" maxlength="20" value="${esc(zoom.sdk_version||'6.5.0')}" placeholder="6.5.0"><small>Use the Web version enabled in Zoom Marketplace.</small></label>
        <label class="full">Meeting SDK Client Secret<input name="sdk_client_secret" type="password" autocomplete="new-password" placeholder="${zoom.has_sdk_client_secret?'Saved securely — leave blank to keep':'General App / Meeting SDK Client Secret'}"><small>Used only on the PHP backend to generate short-lived Meeting SDK JWTs.</small></label>
        <label class="check-row full"><input name="embed_enabled" type="checkbox" ${zoom.embed_enabled?'checked':''}><span><strong>Enable embedded classroom</strong><small>Start and Join buttons open a Full Stack Academy classroom page with Zoom running inside the website.</small></span></label>

        <div class="form-actions full"><button class="primary-button" type="submit">Save Zoom Settings</button></div>
      </form>
      <div class="video-help-grid">
        <article><strong>Server-to-Server scopes</strong><p>Keep the meeting create/update/delete permissions and add the Zoom ZAK permission <code>user:read:zak:admin</code> so an instructor can start the meeting inside the website.</p></article>
        <article><strong>Meeting SDK credentials</strong><p>Use the separate Development Client ID + Client Secret from General App → Embed while testing. Do not put the Meeting SDK values into the Server-to-Server fields.</p></article>
      </div></section>`;
  }

  async function renderMedia(){
    await fetchMedia();
    content.innerHTML=`${pageHead('Media Library','Upload and manage images and videos used across the website.')}<section class="media-upload-panel"><div><span class="eyebrow">Upload New Media</span><h2>Add image or video</h2><p>Images: JPG/JPEG, PNG, WebP, GIF, SVG, AVIF, BMP, TIFF, ICO, HEIC/HEIF and JPEG XL up to 8 MB. Videos: MP4, WebM or MOV up to 100 MB.</p></div><form id="mediaUploadForm" class="media-upload-form" enctype="multipart/form-data"><label class="media-dropzone"><input name="media" type="file" accept="image/*,.svg,.avif,.bmp,.tif,.tiff,.ico,.heic,.heif,.jxl,video/mp4,video/webm,video/quicktime" required><span><strong>Choose image or video</strong><small>SVG and other common image formats are supported. The file will be stored in the website Media Library.</small></span></label><button class="primary-button" type="submit">Upload Media</button></form></section><div class="media-library-head"><div><h2>All Media</h2><p>${state.media.length} media item${state.media.length===1?'':'s'} available</p></div></div>${mediaCards(state.media)}`;
  }
  async function openMediaPicker(targetName, targetElement=null){
    state.mediaPickerTarget=targetName||'';
    state.mediaPickerElement=targetElement;
    setModalOpen(mediaPickerBackdrop,true);
    const grid=document.getElementById('mediaPickerGrid');
    grid.innerHTML='<div class="loading">Loading media…</div>';
    try{await fetchMedia();grid.innerHTML=mediaCards(state.media,{picker:true});}
    catch(error){grid.innerHTML=emptyState('Unable to load media',error.message);toast(error.message,'error');}
  }
  function selectMedia(url){
    const targetName=state.mediaPickerTarget;
    const input=state.mediaPickerElement || (targetName?document.querySelector(`[name="${targetName}"]`):null);
    if(!input){toast('The target field is no longer available.','error');return;}
    input.value=url;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    updateImagePreview(input);
    state.mediaPickerElement=null;
    setModalOpen(mediaPickerBackdrop,false);
    toast('Media selected from the Media Library.');
  }

  async function renderOrders(){
    const result=await api('admin_orders'); state.orders=result.orders||[];
    content.innerHTML=`${pageHead('Order Management','Review course orders and mark payment status. Setting an order to Paid automatically activates course access.')}
      <div class="table-wrap">${state.orders.length?`<table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${state.orders.map(order=>`<tr><td><strong>${esc(order.order_number)}</strong></td><td><strong>${esc(order.customer_name)}</strong><br><small>${esc(order.customer_email)} · ${esc(order.customer_phone)}</small></td><td>${esc(order.item_names||'—')}</td><td>${esc(order.payment_method)}</td><td><strong>${money(order.total)}</strong><br><small>Discount ${money(order.discount)}</small></td><td><select data-action="order-status" data-id="${order.id}">${['pending','paid','cancelled','refunded'].map(status=>`<option value="${status}" ${order.status===status?'selected':''}>${status[0].toUpperCase()+status.slice(1)}</option>`).join('')}</select></td><td>${formatDate(order.created_at)}</td></tr>`).join('')}</tbody></table>`:emptyState('No orders found','Student course orders will appear here.')}</div>`;
  }

  const dateTimeInputValue=value=>{
    if(!value) return '';
    const raw=String(value).trim();
    const sqlMatch=raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if(sqlMatch) return `${sqlMatch[1]}T${sqlMatch[2]}`;
    const date=new Date(raw);
    if(Number.isNaN(date.getTime())) return '';
    const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,16);
  };
  function openEnrollmentModal(item=null){
    accessForm.reset();
    accessForm.elements.id.value=item?.id||'';
    accessForm.elements.user_id.innerHTML=state.users.filter(user=>user.role==='student').map(user=>`<option value="${user.id}" ${Number(item?.user_id)===Number(user.id)?'selected':''}>${esc(user.name)} — ${esc(user.email)}</option>`).join('');
    accessForm.elements.course_id.innerHTML=state.courses.map(course=>`<option value="${course.id}" ${Number(item?.course_id)===Number(course.id)?'selected':''}>${esc(course.title)}</option>`).join('');
    accessForm.elements.status.value=item?.status||'active';
    accessForm.elements.access_starts_at.value=dateTimeInputValue(item?.access_starts_at);
    accessForm.elements.access_expires_at.value=dateTimeInputValue(item?.access_expires_at);
    accessForm.elements.ip_lock_enabled.checked=Boolean(item?.ip_lock_enabled);
    accessForm.elements.reset_ip.checked=false;
    document.getElementById('resetIpRow').hidden=!item?.allowed_ip;
    document.getElementById('accessModalTitle').textContent=item?'Edit Course Access':'Grant Course Access';
    setFormStatus('accessForm');
    setModalOpen(accessModalBackdrop,true);
  }
  async function renderEnrollments(){
    const [enrollmentResult,userResult,courseResult]=await Promise.all([api('admin_enrollments'),api('admin_users'),api('admin_courses')]);
    state.enrollments=enrollmentResult.enrollments||[];state.users=userResult.users||[];state.courses=courseResult.courses||[];
    content.innerHTML=`${pageHead('Enrollment Access','Grant courses manually, set expiry dates and control optional IP locking. Paid academy orders can still be activated from Orders.','<button class="primary-button" data-action="add-enrollment">+ Grant Access</button>')}
      <div class="table-wrap">${state.enrollments.length?`<table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Order</th><th>Status</th><th>Access Window</th><th>IP Security</th><th>Actions</th></tr></thead><tbody>${state.enrollments.map(item=>`<tr><td><strong>${esc(item.student_name)}</strong><br><small>${esc(item.email)}</small></td><td>${esc(item.course_title)}</td><td>${esc(item.order_number||'Manual grant')}</td><td><select data-action="enrollment-status" data-id="${item.id}">${['pending','active','completed','cancelled'].map(status=>`<option value="${status}" ${item.status===status?'selected':''}>${status[0].toUpperCase()+status.slice(1)}</option>`).join('')}</select></td><td><small>${item.access_starts_at?`Starts ${formatDate(item.access_starts_at)}`:'Starts immediately'}<br>${item.access_expires_at?`Expires ${formatDate(item.access_expires_at)}`:'No expiry'}</small></td><td><small>${item.ip_lock_enabled?`Locked${item.allowed_ip?` to ${esc(item.allowed_ip)}`:' on first opening'}`:'Not locked'}${item.last_access_ip?`<br>Last: ${esc(item.last_access_ip)}`:''}</small></td><td><button data-action="edit-enrollment" data-id="${item.id}">Manage</button></td></tr>`).join('')}</tbody></table>`:emptyState('No enrollments found','Use Grant Access to assign a course directly to a student.')}</div>`;
  }

  async function renderUsers(){ const [result,branchesResult]=await Promise.all([api('admin_users'),api('admin_branches')]); state.users=result.users||[];state.branches=branchesResult.branches||[];drawUsers(); }
  function drawUsers(){
    const q=state.userSearch.toLowerCase();
    const users=state.users.filter(user=>`${user.name} ${user.email} ${user.phone||''} ${user.student_code||''} ${user.branch||''} ${roleLabel(user.role)}`.toLowerCase().includes(q)&&(state.userRole==='all'||user.role===state.userRole||(state.userRole==='super_admin'&&user.role==='admin')));
    const availableRoles=ROLE_ORDER.filter(role=>state.users.some(user=>user.role===role||(role==='super_admin'&&user.role==='admin')));
    const roleFilterOptions=availableRoles.map(role=>`<option value="${role}" ${state.userRole===role?'selected':''}>${esc(roleLabel(role))}</option>`).join('');
    content.innerHTML=`${pageHead('User Management','Role hierarchy is enforced automatically. Use the access-role filter to quickly view each level.',manageableRoles().length?'<button class="primary-button" data-action="add-user">+ Add User</button>':'')}
      <div class="toolbar"><div class="toolbar-group"><input id="userSearch" type="search" placeholder="Search name, email, ID, phone or role" value="${esc(state.userSearch)}"><select id="userRoleFilter" aria-label="Filter by access role"><option value="all">All access roles</option>${roleFilterOptions}</select></div><span class="form-hint">${users.length} account${users.length===1?'':'s'} shown</span></div>
      <div class="table-wrap">${users.length?`<table class="data-table"><thead><tr><th>User</th><th>Academy ID / Branch</th><th>Access Role</th><th>Status</th><th>Recorded LMS</th><th>Actions</th></tr></thead><tbody>${users.map(user=>`<tr><td><div class="user-cell"><span>${initials(user.name)}</span><div><strong>${esc(user.name)}</strong><small>${esc(user.email)}</small></div></div></td><td><strong>${esc(user.student_code||'—')}</strong><br><small>${esc(user.branch||'No branch')}</small></td><td>${esc(roleLabel(user.role))}</td><td><span class="${statusClass(user.status)}">${esc(user.status)}</span></td><td>${user.role==='instructor'?`<span class="status-pill ${user.can_record_lectures?'status-active':'status-pending'}">${user.can_record_lectures?'Allowed':'Not allowed'}</span>`:'—'}</td><td><div class="row-actions"><button data-action="edit-user" data-id="${user.id}">Edit</button>${user.role==='student'?`<button data-action="generate-student-code" data-id="${user.id}">New ID</button>`:''}<button data-action="toggle-user-status" data-id="${user.id}" data-status="${user.status==='active'?'blocked':'active'}">${user.status==='active'?'Block':'Activate'}</button>${Number(user.id)!==Number(state.user.id)?`<button data-action="delete-user" data-id="${user.id}">Delete</button>`:''}</div></td></tr>`).join('')}</tbody></table>`:emptyState('No matching users','Try another search or access role.')}</div>`;
  }
  function syncUserRoleFields(){
    const selectedRole=userForm.elements.role?.value||'';
    const row=document.getElementById('recordedLecturePermissionRow');
    const checkbox=userForm.elements.can_record_lectures;
    const canGrant=isCentralRole();
    if(row) row.hidden=selectedRole!=='instructor';
    if(checkbox){checkbox.disabled=selectedRole!=='instructor'||!canGrant;if(selectedRole!=='instructor')checkbox.checked=false;}
  }
  function openUserModal(user=null){
    setFormStatus('userForm');userForm.reset();
    const allowed=manageableRoles();
    if(!allowed.length){toast('Your role cannot create or edit user accounts.','error');return;}
    userForm.elements.id.value=user?.id||'';userForm.elements.name.value=user?.name||'';userForm.elements.email.value=user?.email||'';userForm.elements.phone.value=user?.phone||'';
    const roleSelect=userForm.elements.role;const currentRole=user?.role==='admin'?'super_admin':(user?.role||allowed[0]);
    const roleOptions=ROLE_ORDER.filter(r=>allowed.includes(r)||(user&&r===currentRole));roleSelect.innerHTML=roleOptions.map(r=>`<option value="${r}" ${r===currentRole?'selected':''}>${esc(roleLabel(r))}</option>`).join('');
    userForm.elements.status.value=user?.status||'active';userForm.elements.student_code.value=user?.student_code||'';
    const branchSelect=userForm.elements.branch;const selectedBranch=user?.branch||state.user?.branch||'';branchSelect.innerHTML='<option value="">Choose branch</option>'+state.branches.map(b=>`<option value="${esc(b.shortName||b.name||b.slug)}" ${(b.shortName||b.name||b.slug)===selectedBranch?'selected':''}>${esc(b.shortName||b.name)}</option>`).join('');
    if(isBranchRole()){branchSelect.innerHTML=`<option value="${esc(state.user?.branch||'')}">${esc(state.user?.branch||'Current branch')}</option>`;branchSelect.value=state.user?.branch||'';}
    if(userForm.elements.can_record_lectures)userForm.elements.can_record_lectures.checked=Boolean(user?.can_record_lectures);
    syncUserRoleFields();
    userForm.elements.password.required=!user;document.getElementById('modalTitle').textContent=user?'Edit User':'Add User';document.getElementById('passwordHint').textContent=user?'Leave password empty to keep the existing password.':'A password is required for a new staff account.';setModalOpen(modalBackdrop,true);setTimeout(()=>userForm.elements.name.focus(),0);
  }

  async function renderApprovals(){
    const r=await api('admin_approvals');state.approvals=r;
    const instructors=r.instructor_applications||[],profiles=r.profile_requests||[],certs=r.certificate_requests||[],courseRequests=r.course_content_requests||[];
    const actionButtons=(type,item)=>item.status==='pending'?`<div class="row-actions"><button class="primary-button" data-action="review-approval" data-type="${type}" data-id="${item.id}" data-decision="approved">Approve</button><button class="danger-button" data-action="review-approval" data-type="${type}" data-id="${item.id}" data-decision="rejected">Reject</button></div>`:`<span class="${statusClass(item.status)}">${esc(item.status)}</span>`;
    const courseTable=courseRequests.length?`<table class="data-table"><thead><tr><th>Course</th><th>Instructor</th><th>Branch</th><th>Approval level</th><th>Pending lessons</th><th>Status</th><th>Action</th></tr></thead><tbody>${courseRequests.map(x=>`<tr><td><strong>${esc(x.title)}</strong><br><small>${esc(x.slug)}</small></td><td>${esc(x.instructorName||'Instructor')}</td><td>${esc(x.branch||'—')}</td><td><strong>${x.kind==='central'?'Super Admin / Admin Staff':'Branch Head / Branch Admin'}</strong></td><td>${Number(x.pendingLessons||0)}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span>${x.note?`<br><small>${esc(x.note)}</small>`:''}</td><td>${actionButtons('course_content',x)}</td></tr>`).join('')}</tbody></table>`:emptyState('No course content approvals','Instructor course content waiting for approval will appear here.');
    content.innerHTML=`${pageHead('Approval Centre','Recorded LMS content is approved centrally. Other assigned branch course content can be approved by the Branch Head or Branch Admin.')}
      <section><h2>Course content approvals</h2><div class="table-wrap">${courseTable}</div></section>
      <section><h2>Instructor applications</h2><div class="table-wrap">${instructors.length?`<table class="data-table"><thead><tr><th>Applicant</th><th>Professional profile</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead><tbody>${instructors.map(x=>`<tr><td><strong>${esc(x.name)}</strong><br><small>${esc(x.email)} · ${esc(x.phone||'')}</small></td><td>${esc(x.headline||'Instructor')}<br><small>${esc((x.skills||[]).join(', ')||'Skills not supplied')}</small></td><td>${esc(x.branch||'Not selected')}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span></td><td>${actionButtons('instructor',x)}</td></tr>`).join('')}</tbody></table>`:emptyState('No instructor profiles','Instructor signups will appear here for approval.')}</div></section>
      <div class="dashboard-grid"><section><h2>Student profile changes</h2><div class="table-wrap">${profiles.length?`<table class="data-table"><thead><tr><th>Student</th><th>Instructor</th><th>Proposed changes</th><th>Status</th><th>Action</th></tr></thead><tbody>${profiles.map(x=>`<tr><td><strong>${esc(x.student_name)}</strong></td><td>${esc(x.instructor_name)}</td><td><small>${Object.entries(x.payload||{}).filter(([,v])=>v&&(!Array.isArray(v)||v.length)).map(([k,v])=>`${esc(k.replaceAll('_',' '))}: ${esc(Array.isArray(v)?v.join(', '):v)}`).join('<br>')}</small></td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span></td><td>${actionButtons('profile',x)}</td></tr>`).join('')}</tbody></table>`:emptyState('No profile requests','Instructor profile edits will appear here.')}</div></section>
      <section><h2>Certifications</h2><div class="table-wrap">${certs.length?`<table class="data-table"><thead><tr><th>Student</th><th>Certificate</th><th>Submitted by</th><th>Status</th><th>Action</th></tr></thead><tbody>${certs.map(x=>`<tr><td><strong>${esc(x.student_name)}</strong></td><td>${esc(x.title)}<br><small>${esc(x.issuer)}${x.credential_id?` · ${esc(x.credential_id)}`:''}</small></td><td>${esc(x.submitter_name)}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span></td><td>${actionButtons('certificate',x)}</td></tr>`).join('')}</tbody></table>`:emptyState('No certificate requests','Submitted certifications will appear here.')}</div></section></div>`;
  }

  async function renderInquiries(){ const result=await api('admin_inquiries'); state.inquiries=result.inquiries||[]; drawInquiries(); }
  function drawInquiries(){ const list=state.inquiries.filter(item=>state.inquiryStatus==='all'||item.status===state.inquiryStatus); content.innerHTML=`${pageHead('Enquiry Inbox','Review support messages submitted through the website.')}
    <div class="toolbar"><div class="toolbar-group"><select id="inquiryStatusFilter"><option value="all">All statuses</option><option value="new" ${state.inquiryStatus==='new'?'selected':''}>New</option><option value="contacted" ${state.inquiryStatus==='contacted'?'selected':''}>Contacted</option><option value="closed" ${state.inquiryStatus==='closed'?'selected':''}>Closed</option></select></div><span class="form-hint">${list.length} enquir${list.length===1?'y':'ies'}</span></div>
    <div class="table-wrap">${list.length?`<table class="data-table"><thead><tr><th>Person</th><th>Reference</th><th>Subject</th><th>Message</th><th>Status</th><th>Received</th></tr></thead><tbody>${list.map(item=>`<tr><td><strong>${esc(item.name)}</strong><br><small>${esc(item.email)} · ${esc(item.phone||'')}</small></td><td>${esc(item.reference)}</td><td>${esc(item.subject||item.course||'—')}</td><td title="${esc(item.message||'')}">${esc((item.message||'—').slice(0,100))}</td><td><select data-action="inquiry-status" data-id="${item.id}">${['new','contacted','closed'].map(status=>`<option value="${status}" ${item.status===status?'selected':''}>${status[0].toUpperCase()+status.slice(1)}</option>`).join('')}</select></td><td>${formatDate(item.created_at)}</td></tr>`).join('')}</tbody></table>`:emptyState('No enquiries found','Website support messages will appear here.')}</div>`; }

  async function renderSmtp(){ const result=await api('admin_settings'); state.settings=result.settings; const smtp=state.settings.smtp; content.innerHTML=`${pageHead('SMTP Email Setup','Connect Hostinger Email, Gmail Workspace, Zoho Mail or another SMTP provider.')}
    <div class="settings-layout"><aside class="settings-menu"><button class="active">SMTP Connection</button><button data-view="templates">Email Templates</button><button data-view="logs">Delivery Logs</button></aside><section class="settings-card"><div class="smtp-status ${smtp.enabled?'connected':''}"><i></i><div><strong>${smtp.enabled?'SMTP delivery is enabled':'SMTP delivery is disabled'}</strong><small>${smtp.enabled?`Configured for ${esc(smtp.host||'your server')}`:'Save credentials and send a test email.'}</small></div></div>
    <form class="settings-form" id="smtpForm"><label class="check-row full"><input type="checkbox" name="enabled" ${smtp.enabled?'checked':''}><span><strong>Enable SMTP</strong><small>Welcome, reset, order and enrollment emails will use these settings.</small></span></label><label>SMTP host<input name="host" required value="${esc(smtp.host||'')}" placeholder="smtp.hostinger.com"></label><label>SMTP port<input name="port" type="number" required value="${esc(smtp.port||587)}"></label><label>Encryption<select name="encryption"><option value="tls" ${smtp.encryption==='tls'?'selected':''}>TLS / STARTTLS</option><option value="ssl" ${smtp.encryption==='ssl'?'selected':''}>SSL</option><option value="none" ${smtp.encryption==='none'?'selected':''}>None</option></select></label><label>Timeout<input name="timeout" type="number" min="5" max="30" value="${esc(smtp.timeout||15)}"></label><label>Username<input name="username" value="${esc(smtp.username||'')}"></label><label>Password<input name="password" type="password" placeholder="${smtp.has_password?'Saved securely — leave blank to keep':'Mailbox password'}"></label><label>From email<input name="from_email" type="email" required value="${esc(smtp.from_email||'')}"></label><label>From name<input name="from_name" required value="${esc(smtp.from_name||'')}"></label><p class="form-hint full">Hostinger commonly uses smtp.hostinger.com with port 465 SSL or 587 TLS.</p><div class="form-actions"><button class="secondary-button" type="button" data-action="open-test-email">Send Test Email</button><button class="primary-button" type="submit">Save SMTP Settings</button></div></form>
    <form class="settings-form" id="testEmailForm" hidden><label class="full">Test recipient<input name="to" type="email" required></label><div class="form-actions"><button class="secondary-button" type="button" data-action="close-test-email">Cancel</button><button class="primary-button" type="submit">Send Test</button></div></form></section></div>`; }

  async function renderTemplates(){ const result=await api('admin_templates'); state.templates=result.templates||[]; content.innerHTML=`${pageHead('Email Templates','Edit automatic emails sent to learners.')}
    <div class="template-grid">${state.templates.map(template=>`<form class="template-card template-form" data-template-id="${esc(template.id)}"><div class="template-card-head"><div><h2>${esc(template.name)}</h2><p>${esc(template.id.replaceAll('_',' '))}</p></div><label class="toggle"><input name="enabled" type="checkbox" ${template.enabled?'checked':''}><span></span></label></div><label>Subject<input name="subject" required value="${esc(template.subject)}"></label><label>Email body<textarea name="body" required>${esc(template.body)}</textarea></label><p class="form-hint">Variables: {{name}}, {{course}}, {{order}}, {{reset_link}}</p><button class="primary-button" type="submit">Save Template</button></form>`).join('')}</div>`; }
  async function renderLogs(){ const result=await api('admin_email_logs'); state.logs=result.logs||[]; content.innerHTML=`${pageHead('Email Delivery Logs','Review SMTP delivery results and server messages.')}<div class="table-wrap">${state.logs.length?`<table class="data-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Type</th><th>Status</th><th>Message</th><th>Date</th></tr></thead><tbody>${state.logs.map(log=>`<tr><td>${esc(log.to)}</td><td>${esc(log.subject)}</td><td>${esc(log.type)}</td><td><span class="${statusClass(log.status)}">${esc(log.status)}</span></td><td>${esc((log.message||'—').slice(0,100))}</td><td>${formatDate(log.created_at)}</td></tr>`).join('')}</tbody></table>`:emptyState('No email activity yet','Email attempts will be recorded here.')}</div>`; }

  const cmsAiPrompt = `Design a new Full Stack Academy CMS code snippet for this website.
Return these fields exactly: Name, Slug, Placement, Route Rules, HTML, CSS, JavaScript.
Placement must be one of: head, page_before, page_after, body_end.
Route Rules can be * for all pages, an exact route such as /about, or a wildcard such as /course/*.
Use plain HTML, CSS and vanilla JavaScript. Do not use document.write. Do not overwrite the whole page unless I explicitly ask. Prefix CSS classes with a unique fsa- name so styles do not clash. Make it responsive. If an image is needed, use a Media Library URL such as uploads/media/2026/09/example.webp. JavaScript receives route, app and cms variables; cms.once('key',()=>{}) may be used for one-time setup. Return code that can be pasted directly into the admin Code Snippets fields.`;

  function applyAdminTheme(theme={}){
    const map={brand:'--brand',brand_dark:'--brand-deep',ink:'--ink',muted:'--muted',pink:'--pink',surface:'--surface',border:'--border',success:'--success',warning:'--warning',danger:'--danger'};
    Object.entries(map).forEach(([key,varName])=>{if(theme[key])document.documentElement.style.setProperty(varName,theme[key]);});
  }

  function cmsMediaHelper(){
    return `<label class="full cms-media-helper">Media URL helper<div class="media-input-row"><input name="cms_media_helper" readonly placeholder="Choose an uploaded image, then copy its URL"><button class="secondary-button" type="button" data-action="choose-media" data-media-target="cms_media_helper">Choose from Media</button><button class="secondary-button" type="button" data-action="copy-input" data-input-name="cms_media_helper">Copy URL</button></div><small>Paste this URL into an img src, CSS background-image, or your snippet code.</small></label>`;
  }

  async function renderCmsPages(){
    const result=await api('admin_cms_pages');state.pages=result.pages||[];
    content.innerHTML=`${pageHead('Pages','Edit existing live pages without changing the LMS core. Native mode keeps the built-in page and lets you inject code before/after it; Replace mode uses your saved HTML as the complete page body.','<button class="primary-button" data-action="add-cms-page">+ Add Custom Page</button>')}
      <div class="cms-info-grid"><article><strong>Safe Native Mode</strong><p>Keep course, checkout and account logic working, then add custom sections before or after the native page.</p></article><article><strong>Builder-style Code</strong><p>Open a page, capture its current native HTML, edit it, then save as Replace mode when you want complete control.</p></article><article><strong>Media URLs</strong><p>Upload images in Media Library and paste the URL into page HTML or CSS.</p></article></div>
      <div class="table-wrap"><table class="data-table cms-page-table"><thead><tr><th>Page</th><th>Route</th><th>Mode</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${state.pages.map(page=>`<tr><td><strong>${esc(page.name)}</strong><br><small>${esc(page.page_title||'No title override')}</small></td><td><code>${esc(page.route_rule)}</code></td><td><span class="status-pill ${page.render_mode==='replace'?'status-pending':'status-active'}">${esc(page.render_mode)}</span></td><td><span class="${statusClass(page.status)}">${esc(page.status)}</span></td><td>${formatDate(page.updated_at)}</td><td><div class="row-actions"><button data-action="edit-cms-page" data-id="${page.id}">Edit</button><button data-action="copy-cms-page-code" data-id="${page.id}">Copy Code</button><a href="../index.html#${esc(page.route_rule.includes('*')?'/':page.route_rule)}" target="_blank" rel="noopener">Open</a></div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function openCmsPageEditor(page={}){
    const isNew=!page.id;
    const concrete=String(page.route_rule||'').includes('*')?'':(page.route_rule||'/');
    content.innerHTML=`${pageHead(isNew?'Add CMS Page':`Edit ${page.name||'Page'}`,'Use Native mode for safe additions. Use Capture Native HTML when you want to turn the currently rendered page into editable replacement code.','<button class="secondary-button" data-view="pages">← Back to Pages</button>')}
      <form class="cms-editor" id="cmsPageForm">
        <input type="hidden" name="id" value="${esc(page.id||'')}">
        <section class="cms-editor-card"><div class="cms-card-head"><div><span class="eyebrow">Page Identity</span><h2>Route & publishing</h2></div></div><div class="settings-form">
          <label>Page name<input name="name" required maxlength="190" value="${esc(page.name||'')}"></label>
          <label>Route rule<input name="route_rule" required maxlength="190" value="${esc(page.route_rule||'/custom-page')}" placeholder="/about or /course/*"><small>* at the end applies to every matching detail page.</small></label>
          <label>Browser title override<input name="page_title" maxlength="190" value="${esc(page.page_title||'')}"></label>
          <label>Render mode<select name="render_mode"><option value="native" ${(page.render_mode||'native')==='native'?'selected':''}>Native + custom blocks</option><option value="replace" ${page.render_mode==='replace'?'selected':''}>Replace page with saved HTML</option></select></label>
          <label>Status<select name="status"><option value="published" ${(page.status||'published')==='published'?'selected':''}>Published</option><option value="draft" ${page.status==='draft'?'selected':''}>Draft / disabled</option></select></label>
          <label>Concrete live route for capture<input name="capture_route" value="${esc(concrete)}" placeholder="Example: /course/digital-marketing"><small>For wildcard rules, enter one real page route to capture.</small></label>
          ${cmsMediaHelper()}
          <div class="form-actions"><button class="secondary-button" type="button" data-action="capture-live-page">Capture Native HTML</button><button class="secondary-button" type="button" data-action="copy-current-page-code">Copy Editor Code</button>${page.id?'<button class="danger-button" type="button" data-action="reset-cms-page" data-id="'+page.id+'">Reset to Native</button>':''}<button class="primary-button" type="submit">Save Page</button></div>
        </div></section>
        <section class="cms-editor-card"><div class="cms-card-head"><div><span class="eyebrow">WPBakery-style Source</span><h2>Replacement HTML</h2><p>Used only when Render mode is Replace. Capture Native HTML fills this field with the current frontend markup.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="html_code">Copy HTML</button></div><textarea class="code-field cms-code-xl" name="html_code" spellcheck="false" placeholder="<section>...</section>">${esc(page.html_code||'')}</textarea></section>
        <div class="cms-editor-two"><section class="cms-editor-card"><div class="cms-card-head"><div><h2>Before native page</h2><p>Safe insertion before existing page content.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="before_html">Copy</button></div><textarea class="code-field" name="before_html" spellcheck="false">${esc(page.before_html||'')}</textarea></section><section class="cms-editor-card"><div class="cms-card-head"><div><h2>After native page</h2><p>Safe insertion after existing page content.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="after_html">Copy</button></div><textarea class="code-field" name="after_html" spellcheck="false">${esc(page.after_html||'')}</textarea></section></div>
        <div class="cms-editor-two"><section class="cms-editor-card"><div class="cms-card-head"><div><h2>Page CSS</h2><p>Loaded only when this route matches.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="css_code">Copy</button></div><textarea class="code-field" name="css_code" spellcheck="false" placeholder=".my-section { ... }">${esc(page.css_code||'')}</textarea></section><section class="cms-editor-card"><div class="cms-card-head"><div><h2>Page JavaScript</h2><p>Runs after the page is rendered. Variables available: route, app, cms.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="js_code">Copy</button></div><textarea class="code-field" name="js_code" spellcheck="false" placeholder="console.log(route);">${esc(page.js_code||'')}</textarea></section></div>
        <div class="cms-sticky-save"><span>Save changes, then open the public page in a new tab to verify.</span><button class="primary-button" type="submit">Save CMS Page</button></div>
      </form>`;
  }

  async function renderCmsSnippets(){
    const result=await api('admin_cms_snippets');state.snippets=result.snippets||[];
    content.innerHTML=`${pageHead('Code Snippets','Add reusable functionality without modifying core files. Snippets can inject HTML, CSS and JavaScript globally or only on selected routes.','<button class="primary-button" data-action="add-cms-snippet">+ New Snippet</button>')}
      <section class="cms-ai-instructions"><div><span class="eyebrow">Share this with AI</span><h2>Instruction for creating a new snippet</h2><p>Copy this prompt, tell the AI what functionality you want, then paste the returned fields into New Snippet.</p></div><pre>${esc(cmsAiPrompt)}</pre><button class="secondary-button" type="button" data-action="copy-ai-prompt">Copy AI Instruction</button></section>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Snippet</th><th>Placement</th><th>Routes</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.snippets.length?state.snippets.map(snippet=>`<tr><td><strong>${esc(snippet.name)}</strong><br><small>${esc(snippet.slug)}</small></td><td>${esc(snippet.placement)}</td><td><code>${esc((snippet.route_rules||'*').replace(/\n/g,', '))}</code></td><td>${snippet.priority}</td><td><span class="status-pill ${snippet.enabled?'status-active':'status-skipped'}">${snippet.enabled?'Enabled':'Disabled'}</span></td><td><div class="row-actions"><button data-action="edit-cms-snippet" data-id="${snippet.id}">Edit</button><button data-action="copy-cms-snippet" data-id="${snippet.id}">Copy Code</button><button data-action="delete-cms-snippet" data-id="${snippet.id}">Delete</button></div></td></tr>`).join(''):`<tr><td colspan="6">${emptyState('No snippets yet','Create a reusable feature such as WhatsApp, chat widget, tracking code, announcement, calculator, popup or custom section.')}</td></tr>`}</tbody></table></div>`;
  }

  function openCmsSnippetEditor(snippet={}){
    const isNew=!snippet.id;
    content.innerHTML=`${pageHead(isNew?'New Code Snippet':`Edit ${snippet.name}`,'Paste HTML, CSS and JavaScript separately. This keeps snippets easier to manage and copy.','<button class="secondary-button" data-view="snippets">← Back to Snippets</button>')}
      <form class="cms-editor" id="cmsSnippetForm"><input type="hidden" name="id" value="${esc(snippet.id||'')}">
        <section class="cms-editor-card"><div class="settings-form">
          <label>Name<input name="name" required maxlength="190" value="${esc(snippet.name||'')}"></label><label>Slug<input name="slug" maxlength="190" value="${esc(snippet.slug||'')}"><small>Auto-generated from name if blank.</small></label>
          <label>Placement<select name="placement"><option value="page_after" ${(snippet.placement||'page_after')==='page_after'?'selected':''}>After page content</option><option value="page_before" ${snippet.placement==='page_before'?'selected':''}>Before page content</option><option value="body_end" ${snippet.placement==='body_end'?'selected':''}>End of body</option><option value="head" ${snippet.placement==='head'?'selected':''}>Document head</option></select></label><label>Priority<input name="priority" type="number" min="-9999" max="9999" value="${Number(snippet.priority??100)}"><small>Lower numbers run first.</small></label>
          <label class="full">Route rules<textarea name="route_rules" rows="3" placeholder="*\n/about\n/course/*">${esc(snippet.route_rules||'*')}</textarea><small>One rule per line or comma separated. * = all pages.</small></label>
          <label class="full">Description<textarea name="description" rows="3" maxlength="5000">${esc(snippet.description||'')}</textarea></label>
          <label class="check-row full"><input name="enabled" type="checkbox" ${snippet.enabled!==false?'checked':''}><span><strong>Enable snippet</strong><small>Disabled snippets stay saved but are not sent to the public website.</small></span></label>
          ${cmsMediaHelper()}
        </div></section>
        <div class="cms-editor-two"><section class="cms-editor-card"><div class="cms-card-head"><div><h2>HTML</h2><p>Markup to insert at the selected placement.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="html_code">Copy</button></div><textarea class="code-field cms-code-xl" name="html_code" spellcheck="false">${esc(snippet.html_code||'')}</textarea></section><section class="cms-editor-card"><div class="cms-card-head"><div><h2>CSS</h2><p>You may paste CSS with or without style tags.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="css_code">Copy</button></div><textarea class="code-field cms-code-xl" name="css_code" spellcheck="false">${esc(snippet.css_code||'')}</textarea></section></div>
        <section class="cms-editor-card"><div class="cms-card-head"><div><h2>JavaScript</h2><p>Runs when a matching route renders. Variables available: route, app, cms.</p></div><button type="button" class="secondary-button" data-action="copy-field" data-field="js_code">Copy</button></div><textarea class="code-field cms-code-xl" name="js_code" spellcheck="false">${esc(snippet.js_code||'')}</textarea></section>
        <div class="cms-sticky-save"><span>Admin-authored snippets can run JavaScript on the live website. Only paste code you trust.</span><button class="primary-button" type="submit">Save Snippet</button></div>
      </form>`;
  }

  async function renderTheme(){
    const result=await api('admin_settings');state.settings=result.settings;const theme=state.settings.theme||{};applyAdminTheme(theme);
    const field=(label,name,help='')=>`<label class="theme-field"><span>${esc(label)}</span><div><input type="color" name="${esc(name)}" value="${esc(theme[name]||'#852937')}"><code>${esc(theme[name]||'')}</code></div>${help?`<small>${esc(help)}</small>`:''}</label>`;
    content.innerHTML=`${pageHead('Dynamic Theme Colors','Change the website color system from the backend. The public site uses CSS variables, so sections, buttons, borders and surfaces update without editing CSS files.')}
      <form id="themeSettingsForm" class="cms-editor"><section class="theme-preview"><div><span class="eyebrow">Live admin preview</span><h2>Brand color system</h2><p>Save to publish these colors on the public website.</p><button type="button" class="primary-button">Primary Button</button><button type="button" class="secondary-button">Secondary Button</button></div></section>
      <section class="cms-editor-card"><div class="cms-card-head"><div><h2>Brand</h2><p>Main identity and interaction colors.</p></div></div><div class="theme-grid">${field('Primary','brand')}${field('Primary hover','brand_hover')}${field('Primary dark','brand_dark')}${field('Primary deep','brand_deep')}</div></section>
      <section class="cms-editor-card"><div class="cms-card-head"><div><h2>Text & surfaces</h2></div></div><div class="theme-grid">${field('Main text','ink')}${field('Soft text','ink_soft')}${field('Muted text','muted')}${field('Soft pink','pink')}${field('Soft pink 2','pink_2')}${field('Soft pink 3','pink_3')}${field('Surface','surface')}${field('Surface 2','surface_2')}${field('Border','border')}${field('Strong border','border_strong')}</div></section>
      <section class="cms-editor-card"><div class="cms-card-head"><div><h2>System colors</h2></div></div><div class="theme-grid">${field('Success','success')}${field('Warning','warning')}${field('Danger','danger')}<label>Global radius<input name="radius" value="${esc(theme.radius||'18px')}" pattern="\\d{1,2}(?:\\.\\d+)?(?:px|rem)" placeholder="18px"><small>Accepted: px or rem.</small></label></div></section>
      <div class="cms-sticky-save"><span>Colors are saved in MySQL settings and applied automatically.</span><button class="primary-button" type="submit">Save Theme Colors</button></div></form>`;
  }

  async function captureLivePage(form){
    const route=String(form.elements.capture_route?.value||form.elements.route_rule?.value||'/').trim();
    if(!route||route.includes('*'))throw new Error('Enter a concrete live route without * before capturing.');
    toast('Capturing the native page markup…');
    const iframe=document.createElement('iframe');iframe.className='cms-capture-frame';iframe.setAttribute('aria-hidden','true');iframe.src=`../index.html?cms=off#${route.startsWith('/')?route:`/${route}`}`;document.body.appendChild(iframe);
    try{
      await new Promise((resolve,reject)=>{let tries=0;const timer=setInterval(()=>{tries+=1;try{const liveApp=iframe.contentDocument?.getElementById('app');if(liveApp&&liveApp.innerHTML.trim().length>100){clearInterval(timer);resolve();return;}}catch(_){}if(tries>80){clearInterval(timer);reject(new Error('The live page did not finish rendering. Open it once in a new tab and try again.'));}},125);iframe.addEventListener('error',()=>{clearInterval(timer);reject(new Error('The live page could not be opened for capture.'));},{once:true});});
      const html=iframe.contentDocument.getElementById('app').innerHTML.trim();
      form.elements.html_code.value=html;form.elements.render_mode.value='replace';toast('Native page HTML captured into Replacement HTML. Review it before saving.');form.elements.html_code.scrollIntoView({behavior:'smooth',block:'center'});
    }finally{iframe.remove();}
  }

  function composePageCode(page){
    const parts=[`<!-- FSA CMS PAGE: ${page.name} | ${page.route_rule} -->`];
    if(page.render_mode==='replace'&&page.html_code)parts.push(page.html_code);
    else{if(page.before_html)parts.push('<!-- BEFORE NATIVE PAGE -->\n'+page.before_html);if(page.after_html)parts.push('<!-- AFTER NATIVE PAGE -->\n'+page.after_html);}
    if(page.css_code)parts.push(`<style>\n${page.css_code}\n</style>`);if(page.js_code)parts.push(`<script>\n${page.js_code}\n<\/script>`);return parts.join('\n\n');
  }

  function composeSnippetCode(snippet){
    const parts=[`<!-- FSA SNIPPET: ${snippet.name} | ${snippet.slug} | ${snippet.placement} | ${snippet.route_rules||'*'} -->`];
    if(snippet.html_code)parts.push(snippet.html_code);if(snippet.css_code)parts.push(`<style>\n${snippet.css_code}\n</style>`);if(snippet.js_code)parts.push(`<script>\n${snippet.js_code}\n<\/script>`);return parts.join('\n\n');
  }

  async function renderSettings(){
    const result=await api('admin_settings');
    state.settings=result.settings;
    const site=state.settings.site||{};
    state.site=site;
    applyAdminBranding(site);
    content.innerHTML=`${pageHead('Website Settings','Manage public content, contact details and every website logo from one place.')}<div class="settings-layout"><aside class="settings-menu"><button class="active">General & Branding</button><button data-view="pages">Pages</button><button data-view="snippets">Code Snippets</button><button data-view="theme">Theme Colors</button><button data-view="media">Media Library</button><button data-view="smtp">SMTP Email</button><button data-view="account">Administrator</button></aside><section class="settings-card"><h2>Public Website Configuration</h2><p>Saved changes load automatically on the public website and admin dashboard.</p><form class="settings-form" id="siteSettingsForm"><div class="settings-section-title full"><span>General Information</span><small>Website identity, contact information and public behaviour.</small></div><label>Academy name<input name="academy_name" required maxlength="120" value="${esc(site.academy_name||'')}"></label><label>Short tagline<input name="academy_tagline" maxlength="120" value="${esc(site.academy_tagline||'Learning Platform')}"></label><label class="full">Footer description <small>Leave blank to hide this text.</small><textarea name="footer_text" maxlength="500">${esc(site.footer_text??'Career-focused technology learning with practical projects, structured pathways and expert guidance.')}</textarea></label><label class="full">Announcement text <small>Leave blank to hide the top announcement bar.</small><input name="announcement_text" maxlength="255" value="${esc(site.announcement_text??'New AI and Web Development batches are now open.')}"></label><label>Public URL<input name="site_url" type="url" placeholder="https://yourdomain.com" value="${esc(site.site_url||'')}"></label><label>Support email<input name="support_email" type="email" required value="${esc(site.support_email||'')}"></label><label>Support phone<input name="support_phone" required value="${esc(site.support_phone||'')}"></label><label>Currency symbol<input name="currency_symbol" maxlength="5" value="${esc(site.currency_symbol||'₹')}"></label><label>Number locale<select name="locale">${['en-IN','en-PK','en-US','en-GB'].map(locale=>`<option value="${locale}" ${site.locale===locale?'selected':''}>${locale}</option>`).join('')}</select></label><label>Timezone<select name="timezone">${['Asia/Kolkata','Asia/Karachi','Asia/Dubai','UTC'].map(zone=>`<option value="${zone}" ${site.timezone===zone?'selected':''}>${zone}</option>`).join('')}</select></label><div class="settings-section-title full"><span>Logo Settings</span><small>Choose images from the Media Library. Empty footer, mobile or admin logo fields automatically use the header logo.</small></div>${logoField('Header logo','header_logo',site.header_logo,'header_logo_width',site.header_logo_width||180,'Used in the main desktop header.')}${logoField('Footer logo','footer_logo',site.footer_logo,'footer_logo_width',site.footer_logo_width||190,'Leave empty to use the header logo.')}${logoField('Mobile menu logo','mobile_logo',site.mobile_logo,'mobile_logo_width',site.mobile_logo_width||160,'Leave empty to use the header logo.')}${logoField('Admin dashboard logo','admin_logo',site.admin_logo,'admin_logo_width',site.admin_logo_width||180,'Used on the admin login and sidebar. Leave empty to use the header logo.')}${logoField('Website favicon','favicon_url',site.favicon_url||'assets/favicon.svg','',0,'Small browser-tab icon. Recommended square image.') }<label class="check-row full"><input type="checkbox" name="registration_enabled" ${site.registration_enabled!==false?'checked':''}><span><strong>Allow learner registrations</strong><small>Students can create accounts from the public website.</small></span></label><label class="check-row full"><input type="checkbox" name="email_notifications" ${site.email_notifications?'checked':''}><span><strong>Send automatic emails</strong><small>Uses SMTP when enabled.</small></span></label><div class="form-actions"><button class="primary-button" type="submit">Save Website Settings</button></div></form></section></div>`;
  }

  function renderAccount(){ content.innerHTML=`${pageHead('Administrator Account','Change the default password before publishing the website.')}<div class="settings-layout"><aside class="settings-menu"><button class="active">Profile & Security</button><button data-view="users">All Administrators</button></aside><section class="settings-card"><h2>${esc(state.user.name)}</h2><p>${esc(state.user.email)} · Administrator</p><form class="settings-form" id="adminPasswordForm"><label class="full">Current password<input name="current_password" type="password" required></label><label>New password<input name="new_password" type="password" minlength="8" required></label><label>Confirm password<input name="confirm_password" type="password" minlength="8" required></label><div class="form-actions"><button class="primary-button" type="submit">Update Password</button></div></form></section></div>`; }

  document.addEventListener('click', async event=>{
    const reviewTab=event.target.closest('[data-review-admin-tab]');
    if(reviewTab){
      const type=reviewTab.dataset.reviewAdminTab;
      document.querySelectorAll('[data-review-admin-tab]').forEach(btn=>btn.classList.toggle('active',btn===reviewTab));
      document.querySelectorAll('[data-review-admin-panel]').forEach(panel=>{panel.hidden=panel.dataset.reviewAdminPanel!==type;});
      return;
    }
    const studentSectionTarget=event.target.closest('[data-student-section]');
    if(studentSectionTarget){event.preventDefault();state.studentTab=studentSectionTarget.dataset.studentSection||'enrolled';await navigate('students');return;}
    const viewTarget=event.target.closest('[data-view]'); if(viewTarget){ event.preventDefault(); if(viewTarget.dataset.view==='students'&&!state.studentTab) state.studentTab='enrolled'; navigate(viewTarget.dataset.view); return; }
    const target=event.target.closest('[data-action]'); if(!target) return; const action=target.dataset.action;
    if(action==='toggle-password'){ const input=target.closest('.password-field').querySelector('input'); input.type=input.type==='password'?'text':'password'; target.textContent=input.type==='password'?'Show':'Hide'; }
    else if(action==='open-sidebar') sidebar.classList.add('open');
    else if(action==='close-sidebar') sidebar.classList.remove('open');
    else if(action==='add-signing-authority') openSigningAuthorityEditor({});
    else if(action==='edit-signing-authority') openSigningAuthorityEditor(state.signingAuthorities.find(a=>Number(a.id)===Number(target.dataset.id))||{});
    else if(action==='delete-signing-authority'){if(!confirm('Delete this signing authority? Existing certificates keep their saved signature details.'))return;try{const r=await api('admin_certificate_signing_authority_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);state.studentTab='signing';await renderStudentsAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='add-user') openUserModal();
    else if(action==='edit-user') openUserModal(state.users.find(user=>Number(user.id)===Number(target.dataset.id)));
    else if(action==='generate-student-code'){if(!confirm('Generate a new login ID? The previous ID will stop working.'))return;try{const r=await api('admin_user_code_generate',{method:'POST',body:{id:target.dataset.id}});toast(`New student ID: ${r.student_code}`);await renderUsers();}catch(e){toast(e.message,'error');}}
    else if(action==='review-approval'){const note=prompt(target.dataset.decision==='approved'?'Optional approval note:':'Reason for rejection:','')??null;if(note===null)return;try{const r=await api('admin_approval_review',{method:'POST',body:{type:target.dataset.type,id:target.dataset.id,decision:target.dataset.decision,note}});toast(r.message);await renderApprovals();}catch(e){toast(e.message,'error');}}
    else if(action==='close-modal') setModalOpen(modalBackdrop,false);
    else if(action==='add-course') openCourseModal();
    else if(action==='toggle-course-mode'){event.stopPropagation();toggleCourseMode(target.dataset.mode||'offline');}
    else if(action==='course-mode') switchCourseMode(target.dataset.mode||'offline');
    else if(action==='add-enrollment') openEnrollmentModal();
    else if(action==='edit-enrollment') openEnrollmentModal(state.enrollments.find(item=>Number(item.id)===Number(target.dataset.id)));
    else if(action==='close-access-modal') setModalOpen(accessModalBackdrop,false);
    else if(action==='edit-course') openCourseModal(state.courses.find(course=>Number(course.id)===Number(target.dataset.id)));
    else if(action==='edit-private-content') openPrivateContentModal(state.courses.find(course=>Number(course.id)===Number(target.dataset.id)));
    else if(action==='close-content-modal') setModalOpen(contentModalBackdrop,false);
    else if(action==='close-course-modal') setModalOpen(courseModalBackdrop,false);
    else if(action==='choose-media') openMediaPicker(target.dataset.mediaTarget||'');
    else if(action==='choose-lesson-media'){const input=target.closest('.lesson-row-editor')?.querySelector('[data-field="lesson-image"]');openMediaPicker('',input);}
    else if(action==='choose-lecture-media'){const input=target.closest('.lecture-row-editor')?.querySelector('[data-field="lecture-image"]');openMediaPicker('',input);}
    else if(action==='close-media-picker') setModalOpen(mediaPickerBackdrop,false);
    else if(action==='clear-easy-image'){const input=document.querySelector(`[name="${target.dataset.target||''}"]`);if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));const field=input.closest('.easy-media-field');const box=field?.querySelector('.easy-media-preview');if(box)box.innerHTML='<span>No image yet</span>';const path=field?.querySelector('.easy-media-path');if(path)path.innerHTML='';target.remove();}}
    else if(action==='select-media') selectMedia(target.dataset.url||'');
    else if(action==='copy-media-url'){try{await navigator.clipboard.writeText(target.dataset.url||'');toast('Media URL copied.');}catch(_){toast(target.dataset.url||'');}}
    else if(action==='delete-media'){if(!confirm('Delete this media item permanently?'))return;try{const r=await api('admin_media_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderMedia();}catch(e){toast(e.message,'error');}}
    else if(action==='add-module'){document.getElementById('curriculumBuilder').insertAdjacentHTML('beforeend',moduleEditor({lessons:[{}]}));refreshBuilders();}
    else if(action==='remove-module'){target.closest('.curriculum-module')?.remove();refreshBuilders();}
    else if(action==='add-lesson'){target.closest('.curriculum-module')?.querySelector('.lesson-list')?.insertAdjacentHTML('beforeend',lessonEditor({}));refreshBuilders();}
    else if(action==='remove-lesson'){target.closest('.lesson-row-editor')?.remove();refreshBuilders();}
    else if(action==='add-lecture'){const lesson=target.closest('.lesson-row-editor');const list=lesson?.querySelector('.lecture-list');const count=list?.querySelectorAll('.lecture-row-editor').length||0;list?.insertAdjacentHTML('beforeend',lectureEditor({title:`Video ${String(count+1).padStart(2,'0')}`},count));refreshBuilders();}
    else if(action==='remove-lecture'){target.closest('.lecture-row-editor')?.remove();refreshBuilders();}
    else if(action==='add-project'){document.getElementById('projectsBuilder').insertAdjacentHTML('beforeend',projectEditor({}));refreshBuilders();}
    else if(action==='remove-project'){target.closest('.project-editor')?.remove();refreshBuilders();}
    else if(action==='add-review'){document.getElementById('reviewsBuilder').insertAdjacentHTML('beforeend',reviewEditor({rating:5}));refreshBuilders();}
    else if(action==='remove-review'){target.closest('.review-editor')?.remove();refreshBuilders();}
    else if(action==='open-test-email'){ document.getElementById('smtpForm').hidden=true; document.getElementById('testEmailForm').hidden=false; }
    else if(action==='close-test-email'){ document.getElementById('testEmailForm').hidden=true; document.getElementById('smtpForm').hidden=false; }
    else if(action==='add-cms-page') openCmsPageEditor({render_mode:'replace',status:'published',route_rule:'/custom-page'});
    else if(action==='edit-cms-page') openCmsPageEditor(state.pages.find(page=>Number(page.id)===Number(target.dataset.id))||{});
    else if(action==='reset-cms-page'){if(!confirm('Reset this page to the native LMS design and clear all saved page code?'))return;try{const r=await api('admin_cms_page_reset',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderCmsPages();}catch(e){toast(e.message,'error');}}
    else if(action==='capture-live-page'){try{const form=target.closest('#cmsPageForm');if(!form)throw new Error('Page editor not found.');await captureLivePage(form);}catch(e){toast(e.message,'error');}}
    else if(action==='copy-current-page-code'){const form=target.closest('#cmsPageForm');if(form){const fd=new FormData(form);const page=Object.fromEntries(fd.entries());try{await navigator.clipboard.writeText(composePageCode(page));toast('Current page editor code copied.');}catch(_){toast('Clipboard access was blocked. Use the individual Copy buttons.','error');}}}
    else if(action==='copy-cms-page-code'){const page=state.pages.find(x=>Number(x.id)===Number(target.dataset.id));if(page){try{await navigator.clipboard.writeText(composePageCode(page));toast('Saved page code copied.');}catch(_){toast('Clipboard access was blocked.','error');}}}
    else if(action==='add-cms-snippet') openCmsSnippetEditor({placement:'page_after',route_rules:'*',priority:100,enabled:true});
    else if(action==='edit-cms-snippet') openCmsSnippetEditor(state.snippets.find(snippet=>Number(snippet.id)===Number(target.dataset.id))||{});
    else if(action==='delete-cms-snippet'){if(!confirm('Delete this code snippet permanently?'))return;try{const r=await api('admin_cms_snippet_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderCmsSnippets();}catch(e){toast(e.message,'error');}}
    else if(action==='copy-cms-snippet'){const snippet=state.snippets.find(x=>Number(x.id)===Number(target.dataset.id));if(snippet){try{await navigator.clipboard.writeText(composeSnippetCode(snippet));toast('Snippet code copied.');}catch(_){toast('Clipboard access was blocked.','error');}}}
    else if(action==='copy-ai-prompt'){try{await navigator.clipboard.writeText(cmsAiPrompt);toast('AI snippet instruction copied.');}catch(_){toast('Clipboard access was blocked.','error');}}
    else if(action==='copy-field'){const form=target.closest('form');const field=form?.elements?.namedItem(target.dataset.field);if(field){try{await navigator.clipboard.writeText(field.value||'');toast('Code copied.');}catch(_){toast('Clipboard access was blocked.','error');}}}
    else if(action==='copy-input'){const input=document.querySelector(`[name="${target.dataset.inputName||''}"]`);if(input){try{await navigator.clipboard.writeText(input.value||'');toast('URL copied.');}catch(_){toast('Clipboard access was blocked.','error');}}}
    else if(action==='add-batch') openBatchEditor({status:'published',modeKey:'offline-classroom',shiftKey:'morning',branchSlug:state.branches[0]?.slug||'online',sortOrder:(state.batches.length+1)});
    else if(action==='edit-batch') openBatchEditor(state.batches.find(b=>Number(b.id)===Number(target.dataset.id))||{});
    else if(action==='delete-batch'){if(!confirm('Delete this batch?'))return;try{const r=await api('admin_batch_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderBatchesAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='add-review-record') openReviewEditor({type:'written',rating:5,status:'published',sortOrder:(state.reviews.length+1)});
    else if(action==='edit-review-record') openReviewEditor(state.reviews.find(r=>Number(r.id)===Number(target.dataset.id))||{});
    else if(action==='delete-review-record'){if(!confirm('Delete this review?'))return;try{const r=await api('admin_review_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderReviewsAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='upload-review-video') document.getElementById('reviewVideoUploadInput')?.click();
    else if(action==='add-alumni') openAlumniEditor({status:'published',sortOrder:(state.alumni.length+1)});
    else if(action==='add-student') openStudentEditor({});
    else if(action==='edit-student') openStudentEditor(state.students.find(s=>Number(s.id)===Number(target.dataset.id))||{});
    else if(action==='generate-student-certificate'){const s=state.students.find(x=>Number(x.id)===Number(target.dataset.id));if(s)openCertificateEditor(s,certificateForStudent(s)||{});}
    else if(action==='edit-student-certificate'){const cert=state.certificates.find(c=>Number(c.id)===Number(target.dataset.id));const s=cert?state.students.find(x=>Number(x.id)===Number(cert.studentId)):null;if(cert&&s)openCertificateEditor(s,cert);else toast('Certificate record could not be loaded.','error');}
    else if(action==='save-and-generate-certificate'){const form=target.closest('#studentForm');if(!form)return;try{target.disabled=true;target.textContent='Saving…';const r=await api('admin_student_save',{method:'POST',body:studentFormPayload(form)});toast(r.message);state.studentTab='enrolled';await renderStudentsAdmin();const s=state.students.find(x=>Number(x.id)===Number(r.student_id));if(s)openCertificateEditor(s,certificateForStudent(s)||{});}catch(e){toast(e.message,'error');target.disabled=false;target.textContent='Save & Generate Certificate';}}
    else if(action==='delete-student-certificate'){if(!confirm('Delete this generated certificate? Its public Student ID link will stop working.'))return;try{const r=await api('admin_certificate_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);state.studentTab='certificates';await renderStudentsAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='download-certificates-csv') downloadCertificatesCsv();
    else if(action==='delete-student'){if(!confirm('Delete this student account and its linked student data?'))return;try{const r=await api('admin_student_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderStudentsAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='edit-alumni') openAlumniEditor(state.alumni.find(a=>Number(a.id)===Number(target.dataset.id))||{});
    else if(action==='delete-alumni'){if(!confirm('Delete this alumni profile?'))return;try{const r=await api('admin_alumni_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderAlumniAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='add-candidate') openCandidateEditor({status:'published',experience:'Fresher',location:'Hyderabad',availability:'Available',sortOrder:(state.candidates.length+1)});
    else if(action==='edit-candidate') openCandidateEditor(state.candidates.find(c=>Number(c.id)===Number(target.dataset.id))||{});
    else if(action==='delete-candidate'){if(!confirm('Delete this job seeker?'))return;try{const r=await api('admin_candidate_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderCandidatesAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='bulk-event-media') document.getElementById('eventBulkMediaInput')?.click();
    else if(action==='bulk-event-sponsors') document.getElementById('eventSponsorBulkInput')?.click();
    else if(action==='add-event-media-library'){const builder=document.getElementById('eventMediaBuilder');if(builder){builder.insertAdjacentHTML('beforeend',eventMediaItem({type:'image'}));const row=builder.lastElementChild;const input=row?.querySelector('[data-field="src"]');if(input)openMediaPicker('',input);refreshEventBuilderUI();setupEventSortable();}}
    else if(action==='add-event-agenda'){document.getElementById('eventAgendaBuilder')?.insertAdjacentHTML('beforeend',eventAgendaItem({}));refreshEventBuilderUI();setupEventSortable();}
    else if(action==='add-event-highlight'){document.getElementById('eventHighlightsBuilder')?.insertAdjacentHTML('beforeend',eventHighlightItem({icon:'sparkles'}));refreshEventBuilderUI();setupEventSortable();}
    else if(action==='add-event-sponsor'){const builder=document.getElementById('eventSponsorsBuilder');if(builder){builder.insertAdjacentHTML('beforeend',eventSponsorItem({}));const row=builder.lastElementChild;const input=row?.querySelector('[data-field="logo"]');if(input)openMediaPicker('',input);refreshEventBuilderUI();setupEventSortable();}}
    else if(action==='remove-event-item'){target.closest('.event-builder-item')?.remove();refreshEventBuilderUI();}
    else if(action==='replace-event-item-media'){const input=target.closest('.event-media-item')?.querySelector('[data-field="src"]');if(input)openMediaPicker('',input);}
    else if(action==='choose-event-sponsor-logo'){const input=target.closest('.event-builder-item')?.querySelector('[data-field="logo"]');if(input)openMediaPicker('',input);}
    else if(action==='add-event') openEventEditor({status:'published',category:'Academy Event',sortOrder:(state.events.length+1),featured:false});
    else if(action==='edit-event') openEventEditor(state.events.find(e=>Number(e.id)===Number(target.dataset.id))||{});
    else if(action==='delete-event'){if(!confirm('Delete this event?'))return;try{const r=await api('admin_event_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderEventsAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='add-company') openCompanyEditor({status:'published',hiringStatus:'Hiring Partner',sortOrder:(state.companies.length+1)});
    else if(action==='edit-company') openCompanyEditor(state.companies.find(c=>Number(c.id)===Number(target.dataset.id))||{});
    else if(action==='delete-company'){if(!confirm('Delete this company?'))return;try{const r=await api('admin_company_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderCompaniesAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='add-branch') openBranchEditor({status:'published',sortOrder:(state.branches.length+1)});
    else if(action==='edit-branch') openBranchEditor(state.branches.find(b=>Number(b.dbId)===Number(target.dataset.id))||{});
    else if(action==='delete-branch'){if(!confirm('Delete this branch?'))return;try{const r=await api('admin_branch_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderBranchesAdmin();}catch(e){toast(e.message,'error');}}
    else if(action==='edit-instructor') openInstructorEditor(state.instructors.find(i=>Number(i.id)===Number(target.dataset.id)));
    else if(action==='logout'){ try{await api('auth_admin_logout',{method:'POST',body:{}});}catch(_){} state.user=null; history.replaceState(null,'',location.pathname); showLogin(); toast('Signed out successfully.'); }
    else if(action==='toggle-user-status'){ if(!confirm(`Change this user to ${target.dataset.status}?`))return; try{const r=await api('admin_user_status',{method:'POST',body:{id:target.dataset.id,status:target.dataset.status}});toast(r.message);await renderUsers();}catch(e){toast(e.message,'error');} }
    else if(action==='delete-user'){ if(!confirm('Delete this user and all related data?'))return; try{const r=await api('admin_user_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderUsers();}catch(e){toast(e.message,'error');} }
    else if(action==='delete-course'){ if(!confirm('Delete this course? Related enrollment progress will also be removed.'))return; try{const r=await api('admin_course_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderCourses();}catch(e){toast(e.message,'error');} }
  });

  document.addEventListener('input',event=>{
    if(event.target.matches('.easy-media-field input[type="hidden"]')){const field=event.target.closest('.easy-media-field'),box=field?.querySelector('.easy-media-preview'),path=field?.querySelector('.easy-media-path'),src=String(event.target.value||'');if(box)box.innerHTML=src?`<img src="${esc(mediaUrl(src))}" alt="Preview">`:'<span>No image yet</span>';if(path)path.innerHTML=src?`<small>${esc(src)}</small>`:'';}
    if(event.target.closest('#studentForm')&&['feeTotal','feePaid'].includes(event.target.name))updateStudentFeePreview(event.target.closest('#studentForm'));
    if(event.target.id==='userSearch'){state.userSearch=event.target.value;drawUsers();const input=document.getElementById('userSearch');input?.focus();input?.setSelectionRange(input.value.length,input.value.length);}
    if(event.target.name==='title'&&event.target.closest('#courseForm')&&!courseForm.elements.id.value){courseForm.elements.slug.value=event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
    if(['image','header_logo','footer_logo','mobile_logo','admin_logo','favicon_url'].includes(event.target.name)||event.target.matches('[data-field="lesson-image"],[data-field="lecture-image"]'))updateImagePreview(event.target);
    if(event.target.closest('#themeSettingsForm')){const f=event.target.closest('form');applyAdminTheme(Object.fromEntries(new FormData(f).entries()));if(event.target.type==='color')event.target.nextElementSibling&&(event.target.nextElementSibling.textContent=event.target.value);}
    const compact=event.target.closest('.event-compact-item');if(compact&&event.target.dataset.field){const strong=compact.querySelector('summary strong'),small=compact.querySelector('summary small');const title=compact.querySelector('[data-field="title"],[data-field="name"]')?.value;const meta=compact.querySelector('[data-field="time"],[data-field="icon"],[data-field="role"]')?.value;if(strong)strong.textContent=title||'New item';if(small)small.textContent=meta||'Edit details';}
    if(event.target.matches('.event-sponsor-tile [data-field="logo"]')){const row=event.target.closest('.event-sponsor-tile'),src=String(event.target.value||''),preview=row?.querySelector('.event-sponsor-preview');if(preview&&src){preview.innerHTML=`<img src="${esc(mediaUrl(src))}" alt="Sponsor logo"><button class="event-media-remove" type="button" data-action="remove-event-item" aria-label="Remove sponsor logo">×</button><button class="event-drag-handle" type="button" aria-label="Drag to reorder" title="Drag or swipe to reorder">⋮⋮</button>`;setupEventSortable();}}
    if(event.target.matches('.event-media-item [data-field="src"]')){const row=event.target.closest('.event-media-item'),src=String(event.target.value||''),type=row.querySelector('[data-field="type"]')?.value||'image',preview=row.querySelector('.event-media-preview');if(preview&&src){const overlay=`<button class="event-media-remove" type="button" data-action="remove-event-item" aria-label="Remove media">×</button><button class="event-drag-handle" type="button" aria-label="Drag to reorder" title="Drag or swipe to reorder">⋮⋮</button>`;preview.innerHTML=type==='video'?`<video src="${esc(mediaUrl(src))}" muted playsinline preload="metadata"></video><span class="event-media-type-badge">VIDEO</span>${overlay}`:`<img src="${esc(mediaUrl(src))}" alt="">${overlay}`;setupEventSortable();}}
  });

  document.addEventListener('change',async event=>{
    if(event.target.closest('#studentForm')&&event.target.name==='courseId'){refreshStudentCourseAssignment(event.target.closest('#studentForm'),{courseChanged:true});return;}
    if(event.target.closest('#studentForm')&&event.target.name==='deliveryMode'){refreshStudentCourseAssignment(event.target.closest('#studentForm'),{modeChanged:true});return;}
    if(event.target.closest('#studentForm')&&event.target.name==='batchId'){refreshStudentCourseAssignment(event.target.closest('#studentForm'),{batchChanged:true});return;}
    if(event.target.closest('#studentForm')&&event.target.name==='academicStatus'){updateStudentCertificateSection(event.target.closest('#studentForm'));return;}
    if(event.target.closest('#studentForm')&&['isAlumni','isJobSeeker'].includes(event.target.name)){toggleStudentPanels(event.target.closest('#studentForm'));return;}
    if(event.target.id==='reviewTypeSelect'){
      const form=event.target.closest('#reviewForm'),video=event.target.value==='video';
      form?.querySelectorAll('.review-written-field').forEach(el=>el.hidden=video);
      form?.querySelectorAll('.review-video-field').forEach(el=>el.hidden=!video);
      return;
    }
    if(event.target.id==='reviewVideoUploadInput'){
      const file=event.target.files?.[0];event.target.value='';
      try{const input=document.querySelector('#reviewForm [name="videoUrl"]');if(file&&input){await uploadEventMedia(file,input);toast('Video uploaded.');}}catch(e){toast(e.message,'error');}
      return;
    }
    if(event.target.classList.contains('easy-image-upload')){
      const file=event.target.files?.[0],targetName=event.target.dataset.target||'';event.target.value='';
      const input=targetName?document.querySelector(`[name="${targetName}"]`):null;
      try{if(file&&input){await uploadEventMedia(file,input);const field=input.closest('.easy-media-field');const box=field?.querySelector('.easy-media-preview');if(box)box.innerHTML=`<img src="${esc(mediaUrl(input.value))}" alt="Preview">`;const path=field?.querySelector('.easy-media-path');if(path)path.innerHTML=`<small>${esc(input.value)}</small>`;toast('Image uploaded.');}}catch(e){toast(e.message,'error');}
      return;
    }
    if(event.target.id==='eventBulkMediaInput'){const files=event.target.files;event.target.value='';try{await bulkUploadEventMedia(files||[]);setupEventSortable();}catch(e){toast(e.message,'error');}return;}
    if(event.target.id==='eventSponsorBulkInput'){const files=event.target.files;event.target.value='';try{await bulkUploadEventSponsors(files||[]);}catch(e){toast(e.message,'error');}return;}
    if(event.target.classList.contains('event-media-upload')){const row=event.target.closest('.event-media-item');const input=row?.querySelector('[data-field="src"]');const type=row?.querySelector('[data-field="type"]');try{if(input)await uploadEventMedia(event.target.files?.[0],input,type);}catch(e){toast(e.message,'error');}event.target.value='';return;}
    if(event.target.classList.contains('event-sponsor-upload')){const row=event.target.closest('.event-sponsor-tile');const input=row?.querySelector('[data-field="logo"]');try{if(input)await uploadEventMedia(event.target.files?.[0],input);}catch(e){toast(e.message,'error');}event.target.value='';return;}
    if(event.target.closest('#userForm')&&event.target.name==='role'){syncUserRoleFields();return;}
    if(event.target.id==='userRoleFilter'){state.userRole=event.target.value;drawUsers();}
    else if(event.target.id==='inquiryStatusFilter'){state.inquiryStatus=event.target.value;drawInquiries();}
    else if(event.target.dataset.action==='inquiry-status'){try{const r=await api('admin_inquiry_update',{method:'POST',body:{id:event.target.dataset.id,status:event.target.value}});toast(r.message);}catch(e){toast(e.message,'error');}}
    else if(event.target.dataset.action==='order-status'){if(!confirm(`Change order status to ${event.target.value}?`)){await renderOrders();return;}try{const r=await api('admin_order_status',{method:'POST',body:{id:event.target.dataset.id,status:event.target.value}});toast(r.message);await renderOrders();}catch(e){toast(e.message,'error');await renderOrders();}}
    else if(event.target.dataset.action==='enrollment-status'){try{const r=await api('admin_enrollment_status',{method:'POST',body:{id:event.target.dataset.id,status:event.target.value}});toast(r.message);await renderEnrollments();}catch(e){toast(e.message,'error');await renderEnrollments();}}
  });

  document.addEventListener('input', event=>{
    const bulkForm=event.target.closest('#bulkCertificateForm');
    if(bulkForm && event.target.name==='references')updateBulkCertificateIdPreview(bulkForm);
    const authorityForm=event.target.closest('#signingAuthorityForm');
    if(authorityForm && event.target.name==='signatureUrl'){
      const host=authorityForm.querySelector('[data-signing-authority-image]');
      if(host)host.innerHTML=event.target.value?`<img src="${esc(mediaUrl(event.target.value))}" alt="Signature preview">`:'Signature preview will appear here.';
    }
  });
  document.addEventListener('change', event=>{
    const certForm=event.target.closest('#bulkCertificateForm,#certificateForm');
    if(certForm && event.target.name==='signingAuthorityId')updateCertificateAuthorityPreview(certForm);
  });

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form || form.tagName !== 'FORM') return;

    // Never use form.id here. A form control named "id" shadows that property
    // in browsers, which previously made the User and Course Save buttons do nothing.
    const formId = form.getAttribute('id') || '';
    event.preventDefault();

    const fd = new FormData(form);
    const button = form.querySelector('button[type="submit"]');
    const original = button?.textContent || '';
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy','true');
      button.textContent = formId==='userForm' ? 'Saving User…' : formId==='courseForm' ? 'Saving Public Page…' : formId==='privateContentForm' ? 'Saving Private Lessons…' : formId==='cmsPageForm' ? 'Saving CMS Page…' : formId==='cmsSnippetForm' ? 'Saving Snippet…' : formId==='themeSettingsForm' ? 'Saving Theme…' : 'Please wait…';
    }
    if(['userForm','courseForm','privateContentForm'].includes(formId)) setFormStatus(formId,'Saving…');

    try {
      validateAdminForm(formId, form, fd);

      if (formId === 'adminLoginForm') {
        setLoginStatus('Checking administrator account…');
        const r = await api('auth_admin_login', { method:'POST', body:{ email:fd.get('email'), password:fd.get('password') } });
        state.user = r.user;
        form.reset();
        showApp('dashboard');
        toast('Welcome to the administration dashboard.');
      } else if (formId === 'userForm') {
        const payload = Object.fromEntries(fd.entries());
        payload.can_record_lectures = fd.get('can_record_lectures') === 'on';
        const r = await api('admin_user_save', { method:'POST', body:payload });
        setFormStatus('userForm', r.message || 'User saved.');
        toast(r.message || 'User saved.');
        await renderUsers();
        setModalOpen(modalBackdrop,false);
      } else if (formId === 'studentForm') {
        const r=await api('admin_student_save',{method:'POST',body:studentFormPayload(form)});toast(r.message);state.studentTab='enrolled';await renderStudentsAdmin();
      } else if (formId === 'signingAuthorityForm') {
        const payload=Object.fromEntries(fd.entries());payload.active=fd.get('active')==='on';const r=await api('admin_certificate_signing_authority_save',{method:'POST',body:payload});toast(r.message);state.studentTab='signing';await renderStudentsAdmin();
      } else if (formId === 'certificateForm') {
        const payload=Object.fromEntries(fd.entries());const r=await api('admin_certificate_save',{method:'POST',body:payload});toast(r.message);state.studentTab='certificates';await renderStudentsAdmin();
      } else if (formId === 'bulkCertificateForm') {
        const payload=Object.fromEntries(fd.entries());payload.references=String(fd.get('references')||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
        const r=await api('admin_certificate_bulk_generate',{method:'POST',body:payload});toast(r.message||`${r.generated||0} certificate(s) generated.`);state.studentTab='certificates';await renderStudentsAdmin();
      } else if (formId === 'courseForm') {
        captureActiveCourseMode();
        const payload = Object.fromEntries(fd.entries());
        payload.featured = fd.get('featured') === 'on';
        payload.deliveryMode = enabledCourseModes[0] || activeCourseMode;
        payload.deliveryModes = enabledCourseModes;
        payload.contentModes = courseModeDrafts;
        const activeDraft=normalizeCourseModeDraft(courseModeDrafts[activeCourseMode]);
        Object.assign(payload, activeDraft);
        payload.skills = activeDraft.skills;
        payload.requirements = activeDraft.requirements;
        payload.audience = activeDraft.audience;
        payload.projectItems = activeDraft.projectItems;
        payload.courseReviews = activeDraft.courseReviews;
        const r = await api('admin_course_save', { method:'POST', body:payload });
        setFormStatus('courseForm', r.message || 'Course saved.');
        toast(r.message || 'Course saved.');
        await renderCourses();
        setModalOpen(courseModalBackdrop,false);
      } else if (formId === 'privateContentForm') {
        const payload={course_id:Number(fd.get('course_id')||0),modules:collectModules()};
        const r=await api('admin_course_content_save',{method:'POST',body:payload});
        setFormStatus('privateContentForm',r.message||'Private lessons saved.');toast(r.message||'Private lessons saved.');
        await renderCourses();setModalOpen(contentModalBackdrop,false);
      } else if (formId === 'accessForm') {
        const payload=Object.fromEntries(fd.entries());payload.ip_lock_enabled=fd.get('ip_lock_enabled')==='on';payload.reset_ip=fd.get('reset_ip')==='on';
        const r=await api('admin_enrollment_save',{method:'POST',body:payload});setFormStatus('accessForm',r.message);toast(r.message);setModalOpen(accessModalBackdrop,false);await renderEnrollments();
      } else if (formId === 'batchForm') {
        const payload=Object.fromEntries(fd.entries());const r=await api('admin_batch_save',{method:'POST',body:payload});toast(r.message);await renderBatchesAdmin();
      } else if (formId === 'reviewForm') {
        const payload=Object.fromEntries(fd.entries());payload.featured=fd.get('featured')==='on';payload.text=payload.type==='video'?String(fd.get('videoText')||''):String(fd.get('writtenText')||'');delete payload.writtenText;delete payload.videoText;
        const r=await api('admin_review_save',{method:'POST',body:payload});toast(r.message);await renderReviewsAdmin();
      } else if (formId === 'alumniForm') {
        const payload=Object.fromEntries(fd.entries());const r=await api('admin_alumni_save',{method:'POST',body:payload});toast(r.message);await renderAlumniAdmin();
      } else if (formId === 'candidateForm') {
        const payload=Object.fromEntries(fd.entries());payload.skills=splitLines(fd.get('skills'));const r=await api('admin_candidate_save',{method:'POST',body:payload});toast(r.message);await renderCandidatesAdmin();
      } else if (formId === 'eventForm') {
        const payload=Object.fromEntries(fd.entries());
        payload.featured=fd.get('featured')==='on';
        payload.tags=splitLines(fd.get('tags'));
        payload.media=collectEventItems('#eventMediaBuilder .event-media-item',['type','src','caption']).filter(item=>item.src);
        payload.agenda=collectEventItems('#eventAgendaBuilder .event-flow-item',['time','title','description']).filter(item=>item.title||item.description);
        payload.highlights=collectEventItems('#eventHighlightsBuilder .event-builder-item',['icon','title','description']).filter(item=>item.title||item.description);
        payload.sponsors=collectEventItems('#eventSponsorsBuilder .event-sponsor-tile',['logo']).filter(item=>item.logo);
        payload.organiser={name:String(fd.get('organiserName')||'').trim(),role:String(fd.get('organiserRole')||'').trim(),description:String(fd.get('organiserDescription')||'').trim(),email:String(fd.get('organiserEmail')||'').trim(),phone:String(fd.get('organiserPhone')||'').trim()};
        ['organiserName','organiserRole','organiserDescription','organiserEmail','organiserPhone'].forEach(key=>delete payload[key]);
        const r=await api('admin_event_save',{method:'POST',body:payload});toast(r.message);await renderEventsAdmin();
      } else if (formId === 'companyForm') {
        const payload=Object.fromEntries(fd.entries());payload.featured=fd.get('featured')==='on';const r=await api('admin_company_save',{method:'POST',body:payload});toast(r.message);await renderCompaniesAdmin();
      } else if (formId === 'branchForm') {
        const payload=Object.fromEntries(fd.entries());payload.gallery=splitLines(fd.get('gallery'));const r=await api('admin_branch_save',{method:'POST',body:payload});toast(r.message);await renderBranchesAdmin();
      } else if (formId === 'instructorProfileForm') {
        const payload=Object.fromEntries(fd.entries());payload.skills=splitLines(fd.get('skills'));payload.profile_public=fd.get('profile_public')==='on';const r=await api('admin_instructor_save',{method:'POST',body:payload});toast(r.message);await renderInstructorsAdmin();
      } else if (formId === 'videoSettingsForm') {
        const payload=Object.fromEntries(fd.entries());payload.section='zoom';payload.enabled=fd.get('enabled')==='on';payload.embed_enabled=fd.get('embed_enabled')==='on';payload.waiting_room=fd.get('waiting_room')==='on';payload.join_before_host=fd.get('join_before_host')==='on';
        const r=await api('admin_settings',{method:'POST',body:payload});toast(r.message);await renderVideoSettings();
      } else if (formId === 'mediaUploadForm') {
        const file=fd.get('media');
        if(!(file instanceof File)||!file.size) throw new Error('Choose an image or video to upload.');
        const r=await api('admin_media_upload',{method:'POST',body:fd});
        toast(r.message); await renderMedia();
      } else if (formId === 'smtpForm') {
        const payload=Object.fromEntries(fd.entries()); payload.section='smtp'; payload.enabled=fd.get('enabled')==='on';
        const r=await api('admin_settings',{method:'POST',body:payload}); toast(r.message); await renderSmtp();
      } else if (formId === 'testEmailForm') {
        const r=await api('admin_send_test',{method:'POST',body:{to:fd.get('to')}}); toast(r.message); await renderSmtp();
      } else if (form.classList.contains('template-form')) {
        const r=await api('admin_template_save',{method:'POST',body:{id:form.dataset.templateId,subject:fd.get('subject'),body:fd.get('body'),enabled:fd.get('enabled')==='on'}}); toast(r.message);
      } else if (formId === 'cmsPageForm') {
        const payload=Object.fromEntries(fd.entries());delete payload.capture_route;delete payload.cms_media_helper;
        const r=await api('admin_cms_page_save',{method:'POST',body:payload});toast(r.message);await renderCmsPages();
      } else if (formId === 'cmsSnippetForm') {
        const payload=Object.fromEntries(fd.entries());delete payload.cms_media_helper;payload.enabled=fd.get('enabled')==='on';
        const r=await api('admin_cms_snippet_save',{method:'POST',body:payload});toast(r.message);await renderCmsSnippets();
      } else if (formId === 'themeSettingsForm') {
        const payload=Object.fromEntries(fd.entries());payload.section='theme';const r=await api('admin_settings',{method:'POST',body:payload});applyAdminTheme(r.theme||payload);toast(r.message);await renderTheme();
      } else if (formId === 'siteSettingsForm') {
        const payload=Object.fromEntries(fd.entries()); payload.section='site'; payload.registration_enabled=fd.get('registration_enabled')==='on'; payload.email_notifications=fd.get('email_notifications')==='on';
        const r=await api('admin_settings',{method:'POST',body:payload}); toast(r.message); await renderSettings();
      } else if (formId === 'adminPasswordForm') {
        if(fd.get('new_password')!==fd.get('confirm_password')) throw new Error('New passwords do not match.');
        const r=await api('admin_profile_password',{method:'POST',body:{current_password:fd.get('current_password'),new_password:fd.get('new_password')}});
        state.user.must_change_password=false; toast(r.message); form.reset();
      }
    } catch (error) {
      if (formId === 'adminLoginForm') setLoginStatus(error.message,true);
      if (['userForm','courseForm','privateContentForm','accessForm'].includes(formId)) setFormStatus(formId,error.message,true);
      toast(error.message,'error');
    } finally {
      if (button && document.body.contains(button)) {
        button.disabled=false;
        button.removeAttribute('aria-busy');
        button.textContent=original;
      }
    }
  });

  modalBackdrop.addEventListener('click',event=>{if(event.target===modalBackdrop)setModalOpen(modalBackdrop,false);});
  courseModalBackdrop.addEventListener('click',event=>{if(event.target===courseModalBackdrop)setModalOpen(courseModalBackdrop,false);});
  contentModalBackdrop.addEventListener('click',event=>{if(event.target===contentModalBackdrop)setModalOpen(contentModalBackdrop,false);});
  accessModalBackdrop.addEventListener('click',event=>{if(event.target===accessModalBackdrop)setModalOpen(accessModalBackdrop,false);});
  mediaPickerBackdrop.addEventListener('click',event=>{if(event.target===mediaPickerBackdrop)setModalOpen(mediaPickerBackdrop,false);});
  window.addEventListener('hashchange',()=>{if(state.user)navigate(location.hash.slice(1)||'dashboard',false);});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'){setModalOpen(modalBackdrop,false);setModalOpen(courseModalBackdrop,false);setModalOpen(accessModalBackdrop,false);setModalOpen(contentModalBackdrop,false);setModalOpen(mediaPickerBackdrop,false);sidebar.classList.remove('open');}});

  (async function init(){
    try{const publicResult=await api('public_settings');applyAdminBranding(publicResult.site||{});applyAdminTheme(publicResult.site?.theme||{});}catch(_){}
    try{const r=await api('auth_admin_me');if(r.authenticated&&['admin','super_admin','admin_staff','branch_head','branch_admin','instructor'].includes(r.user?.role)){state.user=r.user;showApp();}else showLogin();}
    catch(error){const message=error.installUrl?'MySQL is not installed. Open the installer first.':'Backend connection failed. Start PHP and MySQL.';showLogin(message);toast(message,'error');}
  })();
})();
