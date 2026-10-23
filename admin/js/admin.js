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
  const courseEditorParams = new URLSearchParams(location.search);
  const editorPageMode = courseEditorParams.has('courseEditor');
  const requestedEditorId = Number(courseEditorParams.get('courseEditor')||0);
  const requestedEditorMode = courseEditorParams.get('mode') || 'offline';
  let editorPageOpened = false;
  const editorUrl = (id,mode='offline') => `index.html?courseEditor=${encodeURIComponent(id||'new')}&mode=${encodeURIComponent(mode)}#courses`;
  const openCourseEditorTab = (id,mode='offline') => {
    if(!['super_admin','admin_staff','branch_head','branch_admin','instructor'].includes(normalizedRole())){toast('You cannot create courses with this role.','error');return;}
    const w=window.open(editorUrl(id,mode),'_blank','noopener');
    if(!w)toast('Allow pop-ups to open the course editor in a new tab.','error');
  };
  const accessForm = document.getElementById('accessForm');
  const privateContentForm = document.getElementById('privateContentForm');

  const COURSE_MODES = ['offline','live','recorded'];
  const COURSE_MODE_LABELS = {offline:'Physical / Offline',live:'Live',recorded:'Recorded'};
  const COURSE_MODE_FIELDS = ['badge','image','short','contentHeading','description','price','originalPrice','duration','hours','projects','rating','reviews','students','level','language','updated','instructor','instructorRole'];
  let activeCourseMode = 'offline';
  let categorizedEditorMode = 'offline';
  let enabledCourseModes = ['offline'];
  let courseModeDrafts = {offline:{},live:{},recorded:{}};

  const state = {
    user: null, view: 'dashboard', users: [], students: [], certificates: [], signingAuthorities: [], studentTab:'enrolled', courses: [], batches: [], branches: [], companies: [], events: [], reviews: [], alumni: [], candidates: [], instructors: [], orders: [], enrollments: [], inquiries: [], approvals: null, media: [], pages: [], snippets: [],
    settings: null, site: null, templates: [], logs: [], userSearch: '', userRole: 'all', inquiryStatus: 'all', mediaPickerTarget: '', mediaPickerElement: null
  };

  const titles = {
    heroSlider:'Homepage Slider', websiteContent:'Website Content', dashboard:'Overview', courseTypes:'Course Types', physicalCourses:'Physical Courses', recordedCourses:'Recorded Courses', liveCourses:'Live Courses', courses:'All Courses', batches:'Batches', branches:'Branches', companies:'Companies', events:'Events', reviews:'Reviews', students:'Students', alumni:'Alumni', candidates:'Job Seekers', instructors:'Instructors', video:'Zoom Live', media:'Media Library', orders:'Orders', enrollments:'Enrollments', users:'Users', approvals:'Approvals', inquiries:'Enquiries',
    smtp:'SMTP Setup', templates:'Email Templates', logs:'Email Logs', pages:'Pages', snippets:'Code Snippets', theme:'Theme Colors', settings:'Website Settings', integrations:'Integrations', account:'Admin Account'
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
    admin_staff:['heroSlider','websiteContent','dashboard','courseTypes','courses','physicalCourses','recordedCourses','liveCourses','batches','branches','companies','events','reviews','students','instructors','media','orders','enrollments','users','approvals','inquiries','account'],
    branch_head:['dashboard','courses','physicalCourses','recordedCourses','liveCourses','batches','branches','students','instructors','media','enrollments','users','approvals','account'],
    branch_admin:['dashboard','courses','physicalCourses','recordedCourses','liveCourses','batches','branches','students','instructors','media','enrollments','users','approvals','account'],
    instructor:['dashboard','courses','physicalCourses','recordedCourses','liveCourses','media','account']
  };
  const canView = view => (ROLE_VIEWS[normalizedRole()]||['dashboard','account']).includes(view);
  const manageableRoles = () => ({
    super_admin:['super_admin','admin_staff','branch_head','branch_admin','instructor','student'],
    admin_staff:['branch_head'],
    branch_head:['branch_admin','instructor','student'],
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
  function moduleContentBlockEditor(block={},index=0) {
    const type=['text','image','video','file','link'].includes(block.type)?block.type:'text';
    return `<article class="module-content-block" data-module-content-block>
      <div class="module-content-block-head"><div><span class="module-block-number">${index+1}</span><strong>Rich content block</strong></div><button class="builder-remove" type="button" data-action="remove-module-block">Remove</button></div>
      <div class="module-content-block-grid">
        <label>Block type<select data-field="module-block-type"><option value="text" ${type==='text'?'selected':''}>Text / explanation</option><option value="image" ${type==='image'?'selected':''}>Image</option><option value="video" ${type==='video'?'selected':''}>Video / iframe</option><option value="file" ${type==='file'?'selected':''}>PDF / file</option><option value="link" ${type==='link'?'selected':''}>External link</option></select></label>
        <label>Block heading<input type="text" data-field="module-block-title" maxlength="190" value="${builderInput(block.title)}" placeholder="Optional heading"></label>
        <label class="full">Description / text<textarea data-field="module-block-text" rows="4" maxlength="30000" placeholder="Explain this section, image, video or file.">${builderInput(block.text||block.description)}</textarea></label>
        <label class="full">Media / file / link URL <small>Image, video/embed, PDF/file or external link.</small><div class="media-input-row"><input type="text" data-field="module-block-url" maxlength="3000" value="${builderInput(block.url)}" placeholder="https://... or uploads/media/..."><button class="secondary-button" type="button" data-action="choose-module-block-media">Choose Media</button><label class="secondary-button module-block-upload">Upload File<input type="file" data-module-content-upload hidden accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"></label></div></label>
      </div>
    </article>`;
  }
  function moduleEditor(module={}) {
    const lessons=Array.isArray(module.lessons)&&module.lessons.length?module.lessons:[{}];
    return `<article class="builder-card curriculum-module">
      <div class="builder-card-head"><strong>Module <span class="module-number"></span></strong><button class="builder-remove" type="button" data-action="remove-module">Remove Module</button></div>
      <div class="builder-card-body">
        <div class="builder-row two">
          <label>Module heading<input type="text" data-field="module-title" maxlength="190" placeholder="Web Development Fundamentals" value="${builderInput(module.title)}"></label>
          <label>Module duration<input type="text" data-field="module-duration" maxlength="60" placeholder="18h 20m" value="${builderInput(module.duration)}"></label>
        </div>
        <label>Module description<textarea data-field="module-description" rows="4" maxlength="12000" placeholder="Explain what this module covers before the lessons begin.">${builderInput(module.description)}</textarea></label>
        <label>Module key points <small>One point per line</small><textarea data-field="module-points" rows="4" placeholder="Understand the core concept&#10;Complete the practical exercise">${builderInput(Array.isArray(module.points)?module.points.join('\n'):'')}</textarea></label>
        <div class="module-rich-content"><div class="module-rich-content-head"><div><strong>Rich module content</strong><small>Add explanations, images, videos, PDFs/files or links around the module description.</small></div><button class="secondary-button" type="button" data-action="add-module-block">+ Add Content Block</button></div><div class="module-content-blocks">${(Array.isArray(module.contentBlocks)?module.contentBlocks:[]).map(moduleContentBlockEditor).join('')}</div></div>
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
  function publicLessonEditor(lesson={},index=0){
    return `<div class="public-lesson-editor" data-public-lesson>
      <span class="public-lesson-num" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>
      <label>Lesson title<input data-field="public-lesson-title" maxlength="190" placeholder="Lesson ${String(index+1).padStart(2,'0')} — Topic name" value="${builderInput(lesson.title||'')}"></label>
      <label>Duration <small>Optional</small><input data-field="public-lesson-duration" maxlength="60" placeholder="20 min" value="${builderInput(lesson.duration||'')}"></label>
      <div class="public-lesson-controls"><button type="button" data-action="public-move-lesson" data-direction="-1" aria-label="Move lesson up" title="Move lesson up">↑</button><button type="button" data-action="public-move-lesson" data-direction="1" aria-label="Move lesson down" title="Move lesson down">↓</button><button type="button" data-action="public-remove-lesson" aria-label="Remove lesson" title="Remove lesson">×</button></div>
    </div>`;
  }
  function publicModuleEditor(module={}){
    const lessons=Array.isArray(module.lessons)?module.lessons:[];
    return `<article class="builder-card public-module-editor"><div class="builder-card-head"><strong class="public-module-num">Module</strong><div class="public-module-controls"><button type="button" data-action="public-move-module" data-direction="-1" aria-label="Move module up" title="Move module up">↑</button><button type="button" data-action="public-move-module" data-direction="1" aria-label="Move module down" title="Move module down">↓</button><button class="builder-remove" type="button" data-action="public-remove-module">Remove module</button></div></div><div class="builder-card-body"><div class="builder-row two"><label>Module heading<input data-field="public-module-title" maxlength="190" placeholder="Module 01 — Foundations" value="${builderInput(module.title)}"></label><label>Duration <small>Optional</small><input data-field="public-module-duration" maxlength="60" placeholder="2 hours" value="${builderInput(module.duration)}"></label></div><div class="public-lesson-list">${lessons.map(publicLessonEditor).join('')}</div><button class="secondary-button public-add-lesson" type="button" data-action="public-add-lesson">+ Add Lesson</button></div></article>`;
  }
  function refreshPublicModules(){
    const groups=[...document.querySelectorAll('#publicCurriculumBuilder .public-module-editor')];
    groups.forEach((group,i)=>{
      const title=group.querySelector('.public-module-num');if(title)title.textContent=`Module ${String(i+1).padStart(2,'0')}`;
      group.querySelectorAll('.public-lesson-editor').forEach((row,j)=>{const count=row.querySelector('.public-lesson-num');if(count)count.textContent=String(j+1).padStart(2,'0');});
    });
  }
  function publicFaqEditor(row={}){
    return `<article class="builder-card public-faq-editor"><div class="builder-card-head"><strong>Course FAQ</strong><button class="builder-remove" type="button" data-action="public-remove-faq">Remove</button></div><div class="builder-card-body"><label>Question<input data-field="public-faq-question" maxlength="500" placeholder="What will I learn?" value="${builderInput(row.q)}"></label><label>Answer<textarea data-field="public-faq-answer" rows="3" maxlength="6000">${builderInput(row.a)}</textarea></label></div></article>`;
  }
  function collectPublicModules(){
    return [...document.querySelectorAll('#publicCurriculumBuilder .public-module-editor')].map((card,i)=>({
      title:card.querySelector('[data-field="public-module-title"]')?.value.trim()||`Module ${String(i+1).padStart(2,'0')}`,
      duration:card.querySelector('[data-field="public-module-duration"]')?.value.trim()||'',
      lessons:[...card.querySelectorAll('.public-lesson-editor')].map(row=>({
        title:row.querySelector('[data-field="public-lesson-title"]')?.value.trim()||'',
        duration:row.querySelector('[data-field="public-lesson-duration"]')?.value.trim()||'',preview:false
      })).filter(l=>l.title)
    })).filter(m=>m.title);
  }
  function collectPublicFaqs(){
    return [...document.querySelectorAll('#publicFaqBuilder .public-faq-editor')].map(card=>({
      q:card.querySelector('[data-field="public-faq-question"]')?.value.trim()||'',
      a:card.querySelector('[data-field="public-faq-answer"]')?.value.trim()||''
    })).filter(row=>row.q&&row.a);
  }
  function emptyCourseModeContent(){
    return {badge:'',image:'',short:'',contentHeading:'',description:'',price:'',originalPrice:'',duration:'',hours:'',projects:'',rating:'',reviews:'',students:'',level:'',language:'',updated:'',instructor:'',instructorRole:'',skills:[],requirements:[],audience:[],projectItems:[],courseReviews:[],publicModules:[],publicModulesManaged:false,publicFaqs:[]};
  }
  function normalizeCourseModeDraft(value={}){
    const base=emptyCourseModeContent();
    if(value&&typeof value==='object') Object.assign(base,value);
    base.skills=Array.isArray(base.skills)?base.skills:[];
    base.requirements=Array.isArray(base.requirements)?base.requirements:[];
    base.audience=Array.isArray(base.audience)?base.audience:[];
    base.projectItems=Array.isArray(base.projectItems)?base.projectItems:[];
    base.courseReviews=Array.isArray(base.courseReviews)?base.courseReviews:[];
    base.publicModules=Array.isArray(base.publicModules)?base.publicModules:[];
    base.publicModulesManaged=Boolean(base.publicModulesManaged);
    base.publicFaqs=Array.isArray(base.publicFaqs)?base.publicFaqs:[];
    return base;
  }
  function captureActiveCourseMode(){
    if(!courseForm) return;
    const draft=normalizeCourseModeDraft(courseModeDrafts[activeCourseMode]);
    COURSE_MODE_FIELDS.forEach(name=>{ if(courseForm.elements[name]) draft[name]=courseForm.elements[name].value ?? ''; });
    draft.skills=splitLines(courseForm.elements.skills?.value||'');
    draft.requirements=splitLines(courseForm.elements.requirements?.value||'');
    draft.audience=splitLines(courseForm.elements.audience?.value||'');
    // Keep legacy projects and reviews in storage; they are not part of the lean public-page editor.
    draft.publicModules=collectPublicModules();
    draft.publicModulesManaged=true;
    // Preserve legacy per-course FAQs without showing them on the course detail page.
    if(draft.projectItems.length) draft.projects=draft.projectItems.length;
    if(draft.courseReviews.length){
      draft.reviews=Math.max(Number(draft.reviews||0),draft.courseReviews.length);
      if(!Number(draft.rating||0)) draft.rating=(draft.courseReviews.reduce((sum,review)=>sum+Number(review.rating||0),0)/draft.courseReviews.length).toFixed(1);
    }
    courseModeDrafts[activeCourseMode]=draft;
  }
  function updateCourseModeTabs(){
    const availability=document.getElementById('fsaFormatAvailability');
    if(availability){
      availability.querySelectorAll('input[data-mode]').forEach(box=>{box.checked=enabledCourseModes.includes(box.dataset.mode);});
      const summary=availability.querySelector('[data-format-summary]');
      if(summary)summary.textContent=enabledCourseModes.length===3?'All three course formats enabled. Click Save Public Page to save changes.':`${enabledCourseModes.length} format${enabledCourseModes.length===1?'':'s'} enabled. Select an inactive card to activate it, or choose Enable all.`;
      availability.querySelectorAll('[data-format-status]').forEach(node=>{
        const active=enabledCourseModes.includes(node.dataset.formatStatus);
        node.textContent=active?'Enabled':'Disabled';
        node.closest('.fsa-format-option')?.classList.toggle('is-enabled',active);
      });
    }
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
      context.innerHTML=`<strong>${esc(COURSE_MODE_LABELS[activeCourseMode])} ${enabled?'content':'is not enabled'}</strong><span>${enabled?'Everything below is stored separately for this delivery type — including image, descriptions, price, duration, outcomes, requirements and curriculum modules. '+descriptions[activeCourseMode]:'Click the + on this tab to enable this delivery type, then enter its own separate content.'}</span>`;
    }
  }
  function setCourseModeEnabled(mode,enabled){
    if(!COURSE_MODES.includes(mode))return;
    const alreadyEnabled=enabledCourseModes.includes(mode);
    if(alreadyEnabled===enabled){updateCourseModeTabs();return;}
    if(!enabled && enabledCourseModes.length===1){
      toast('At least one course format must remain enabled.','error');
      updateCourseModeTabs();
      return;
    }
    captureActiveCourseMode();
    if(enabled){
      enabledCourseModes=COURSE_MODES.filter(m=>enabledCourseModes.includes(m)||m===mode);
      activeCourseMode=mode;
    }else{
      enabledCourseModes=enabledCourseModes.filter(m=>m!==mode);
      if(activeCourseMode===mode)activeCourseMode=enabledCourseModes[0];
    }
    loadCourseMode(activeCourseMode);
  }
  function enableAllCourseModes(){
    captureActiveCourseMode();
    enabledCourseModes=[...COURSE_MODES];
    loadCourseMode(activeCourseMode);
    toast('All three formats are enabled in this editor. Save Public Page to keep the changes.');
  }
  function loadCourseMode(mode){
    activeCourseMode=COURSE_MODES.includes(mode)?mode:'offline';
    const draft=normalizeCourseModeDraft(courseModeDrafts[activeCourseMode]);
    COURSE_MODE_FIELDS.forEach(name=>{ if(courseForm.elements[name]) courseForm.elements[name].value=draft[name] ?? ''; });
    if(courseForm.elements.skills) courseForm.elements.skills.value=toLines(draft.skills);
    if(courseForm.elements.requirements) courseForm.elements.requirements.value=toLines(draft.requirements);
    if(courseForm.elements.audience) courseForm.elements.audience.value=toLines(draft.audience);
    const starter=[{title:'Module 01',duration:'',lessons:[{title:'Lesson 01',duration:''}]}];
    const publicModules=draft.publicModules.length?draft.publicModules:(draft.publicModulesManaged?[]:starter);
    document.getElementById('publicCurriculumBuilder').innerHTML=publicModules.map(publicModuleEditor).join('');
    refreshPublicModules();
    updateImagePreview(courseForm.elements.image);
    updateCourseModeTabs();
  }
  function switchCourseMode(mode){
    if(!COURSE_MODES.includes(mode)) return;
    // The entire format card (including its + sign) has a single action:
    // select the format and ENABLE it if it was not already offered.
    const switching=mode!==activeCourseMode;
    if(switching) captureActiveCourseMode();
    if(!enabledCourseModes.includes(mode)) enabledCourseModes=[...enabledCourseModes,mode];
    if(switching)loadCourseMode(mode);
    else updateCourseModeTabs();
  }

  function renderCourseBuilders(course={}) {
    const modules=Array.isArray(course.modules)?course.modules:[];
    const projects=Array.isArray(course.projectItems)?course.projectItems:[];
    const reviews=Array.isArray(course.courseReviews)?course.courseReviews:[];
    document.getElementById('curriculumBuilder').innerHTML=modules.map(moduleEditor).join('');
    // Old project/review data remains in the course record but is not edited here.
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
      const points=String(module.querySelector('[data-field="module-points"]')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      const contentBlocks=[...module.querySelectorAll(':scope > .builder-card-body > .module-rich-content .module-content-block')].map(block=>({type:block.querySelector('[data-field="module-block-type"]')?.value||'text',title:block.querySelector('[data-field="module-block-title"]')?.value.trim()||'',text:block.querySelector('[data-field="module-block-text"]')?.value.trim()||'',url:block.querySelector('[data-field="module-block-url"]')?.value.trim()||''})).filter(block=>block.title||block.text||block.url);
      return {title:title||(lessons.length?`Module ${index+1}`:''),duration:module.querySelector('[data-field="module-duration"]')?.value.trim()||'',description:module.querySelector('[data-field="module-description"]')?.value.trim()||'',points,contentBlocks,lessons};
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
      response = await fetch(`${API}?${new URLSearchParams({action,...(options.query||{})}).toString()}`, init);
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
      const role=String(fd.get('role')||'');
      if(role==='student') throw new Error('Create and manage students in Student Management.');
      if(['branch_head','branch_admin','instructor'].includes(role)&&!String(fd.get('branch')||'').trim()) throw new Error('Please select a branch for this role.');
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
  let adminAlerts=[];
  let notificationPoll=null;
  const alertsButton=()=>document.getElementById('adminAlertsButton');
  async function refreshAdminAlerts(){
    if(!state.user)return;
    try{
      const data=await api('admin_notifications');adminAlerts=data.items||[];
      const num=Math.min(99,Number(data.count||0));
      const badge=document.getElementById('adminAlertsCount');if(badge){badge.textContent=num>=99?'99+':String(num);badge.hidden=!num;}
      const side=document.getElementById('adminApprovalsCount');if(side){side.textContent=String(data.pending||'');side.hidden=!data.pending;}
      const list=document.getElementById('adminAlertsItems');
      if(list)list.innerHTML=adminAlerts.length?adminAlerts.map(item=>`<button type="button" class="academy-notice ${item.read?'is-read':'is-new'}" data-action="academy-open-notice" data-key="${esc(item.key)}" data-next-view="${esc(item.view)}"><span class="academy-notice-dot"></span><span><strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></span></button>`).join(''):'<p class="academy-alerts-empty">You are all caught up.</p>';
    }catch(e){/* Keep the main dashboard usable if notifications are unavailable. */}
  }
  function startAdminAlerts(){refreshAdminAlerts();if(notificationPoll)clearInterval(notificationPoll);notificationPoll=setInterval(()=>{if(state.user&&!document.hidden)refreshAdminAlerts();},45000);}
  function showLogin(message=''){
    setModalOpen(modalBackdrop,false); setModalOpen(courseModalBackdrop,false); setModalOpen(accessModalBackdrop,false); setModalOpen(contentModalBackdrop,false); setModalOpen(mediaPickerBackdrop,false);
    state.user=null;if(notificationPoll){clearInterval(notificationPoll);notificationPoll=null;}
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
    applyRoleNavigation();startAdminAlerts();
    const requested=view || location.hash.slice(1) || 'dashboard';
    const alias=requested;
    const safeView=titles[alias] && canView(alias) ? alias : 'dashboard';
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
    document.querySelector('[data-courses-menu]')?.classList.toggle('is-active',['courses','courseTypes','physicalCourses','recordedCourses','liveCourses'].includes(view));
    const studentsGroup=document.querySelector('[data-students-menu]');
    if(studentsGroup) studentsGroup.classList.toggle('is-active',view==='students');
    document.querySelectorAll('[data-student-section]').forEach(btn=>btn.classList.toggle('active',view==='students' && btn.dataset.studentSection===state.studentTab));
    sidebar.classList.remove('open'); loading();
    try {
      if(view==='heroSlider') await renderHeroSlider();
      else if(view==='websiteContent') await renderWebsiteContent();
      else if(view==='dashboard') await renderDashboard();
      else if(view==='courses') await renderAllCourses();
      else if(view==='courseTypes') await renderCourseTypes();
      else if(view==='physicalCourses') await renderPhysicalCourses();
      else if(view==='recordedCourses') await renderModeCourses('recorded');
      else if(view==='liveCourses') await renderModeCourses('live');
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
      else if(view==='approvals'){await renderApprovals();refreshAdminAlerts();}
      else if(view==='inquiries') await renderInquiries();
      else if(view==='smtp') await renderSmtp();
      else if(view==='templates') await renderTemplates();
      else if(view==='logs') await renderLogs();
      else if(view==='pages') await renderCmsPages();
      else if(view==='snippets') await renderCmsSnippets();
      else if(view==='theme') await renderTheme();
      else if(view==='settings') await renderSettings();
      else if(view==='integrations') await renderStudentIntegrations();
      else if(view==='account') renderAccount();
    } catch(error){
      if(error.installUrl){ content.innerHTML=`${emptyState('MySQL setup required','Open the installer to create the database and first administrator account.')}<div style="text-align:center;margin-top:15px"><a class="primary-button" href="../install/">Open Installer</a></div>`; }
      else content.innerHTML=emptyState('Unable to load this section',error.message);
      toast(error.message,'error'); if(/sign in|administrator access/i.test(error.message)) showLogin();
    }
  }


  async function renderStudentIntegrations(){
    const res=await api('admin_student_integrations');const c=res.settings||{};const providers=c.providers||{};
    const sw=(name,on,disabled=false)=>`<label class="integration-switch" aria-label="${name}" title="${disabled?'SMS gateway integration is required before activation':'Toggle '+name}"><input type="checkbox" name="${name}" ${on?'checked':''} ${disabled?'disabled':''}><span class="integration-switch-track"></span><span class="integration-switch-text">${disabled?'Unavailable':on?'On':'Off'}</span></label>`;
    const providerCard=(key,label,description)=>{const v=providers[key]||{};return `<article class="settings-card integration-card"><div class="int-head"><div><h2>${label}</h2><p>${description}</p></div>${sw(key+'_enabled',!!v.enabled)}</div><div class="settings-form"><label>OAuth Client ID<input name="${key}_id" value="${esc(v.client_id||'')}" autocomplete="off" placeholder="Client / Application ID"></label><label>Client secret<input name="${key}_secret" type="password" value="" autocomplete="new-password" placeholder="${v.has_secret?'Configured — leave blank to keep':'Paste new client secret'}"></label></div></article>`};
    content.innerHTML=`${pageHead('Student Login Integrations','Configure student-only sign-in providers and authentication security.')}
      <form id="studentIntegrationsForm" class="integrations-stack">
       ${providerCard('google','Google','Google Cloud OAuth 2.0 web application')}
       ${providerCard('microsoft','Microsoft','Microsoft Entra ID application registration')}
       ${providerCard('linkedin','LinkedIn','Sign In with LinkedIn using OpenID Connect')}
       <article class="settings-card integration-card"><div class="int-head"><div><h2>Verification and abuse protection</h2><p>Manage student sign-in security and identity verification.</p></div></div>
         <div class="integration-option-list">
           <div class="integration-option"><div><strong>Email OTP</strong><p>Send a verification code through the configured SMTP service after password sign-in. Maximum five attempts within 15 minutes.</p></div>${sw('otp_email_enabled',!!c.otp_email_enabled)}</div>
           <div class="integration-option"><div><strong>SMS OTP</strong><p>An SMS gateway is not connected yet. SMS codes cannot be sent or verified until a provider such as Twilio is configured in the backend.</p><span class="integration-unavailable">Requires SMS gateway integration</span></div>${sw('otp_sms_enabled',false,true)}</div>
         </div>
         <div class="settings-form integration-captcha"><label>reCAPTCHA type<select name="recaptcha_mode"><option value="off" ${!c.recaptcha_mode||c.recaptcha_mode==='off'?'selected':''}>Disabled</option><option value="v2" ${c.recaptcha_mode==='v2'?'selected':''}>v2 checkbox</option><option value="v3" ${c.recaptcha_mode==='v3'?'selected':''}>v3 score-based</option></select></label><label>reCAPTCHA site key<input name="recaptcha_site_key" value="${esc(c.recaptcha_site_key||'')}"></label><label>reCAPTCHA secret<input name="recaptcha_secret" type="password" placeholder="${c.recaptcha_has_secret?'Configured — leave blank to keep':'Secret key'}" autocomplete="new-password"></label></div><p class="form-hint">reCAPTCHA keys are saved, but challenge validation is not yet enforced by the current public login backend. Login attempts are limited to five failures in 15 minutes.</p>
       </article><div class="int-save"><button class="primary-button" type="submit">Save Integrations</button></div>
      </form>`;
    content.querySelectorAll('.integration-switch input:not(:disabled)').forEach(el=>el.addEventListener('change',()=>{const t=el.parentElement.querySelector('.integration-switch-text');if(t)t.textContent=el.checked?'On':'Off'}));
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

  function openCourseModal(course=null, scopedMode=null, activateOnOpen=false){
    setFormStatus('courseForm');
    courseForm.reset();
    const set=(name,value)=>{ if(courseForm.elements[name]) courseForm.elements[name].value=value ?? ''; };
    ['id','title','slug','category','status'].forEach(name=>set(name,course?.[name]));
    courseForm.elements.status.value=course?.status||'published';
    if(normalizedRole()==='instructor')courseForm.elements.status.value='draft';
    if(courseForm.elements.visibility)courseForm.elements.visibility.value=course?.visibility||'public';
    courseForm.elements.featured.checked=Boolean(course?.featured);
    if(courseForm.elements.branchName)courseForm.elements.branchName.innerHTML='<option value="">Choose branch</option>'+state.branches.map(b=>`<option value="${esc(b.shortName||b.name||b.slug)}" ${(b.shortName||b.name||b.slug)===(course?.branchName||'')?'selected':''}>${esc(b.shortName||b.name)}</option>`).join('');
    if(courseForm.elements.assignedInstructorId)courseForm.elements.assignedInstructorId.innerHTML='<option value="0">No instructor assigned</option>'+state.instructors.filter(i=>!isBranchRole()||String(i.branch||'').toLowerCase()===String(state.user?.branch||'').toLowerCase()).map(i=>`<option value="${i.id}" ${Number(i.id)===Number(course?.instructorUserId||0)?'selected':''}>${esc(i.name)} — ${esc(i.branch||'No branch')}</option>`).join('');
    if(isBranchRole()||normalizedRole()==='instructor'){
      if(courseForm.elements.branchName){courseForm.elements.branchName.innerHTML=`<option value="${esc(state.user?.branch||'')}">${esc(state.user?.branch||'Assigned branch')}</option>`;courseForm.elements.branchName.value=state.user?.branch||'';}
    }
    if(normalizedRole()==='instructor'){
      if(courseForm.elements.assignedInstructorId){courseForm.elements.assignedInstructorId.innerHTML=`<option value="${Number(state.user.id)}">${esc(state.user.name)}</option>`;courseForm.elements.assignedInstructorId.value=String(state.user.id);}
      if(courseForm.elements.visibility)courseForm.elements.visibility.value='public';
    }
    courseForm.querySelectorAll('[data-central-publish-only]').forEach(node=>node.hidden=normalizedRole()==='instructor');

    // New public courses begin with Physical, Live and Recorded enabled.
    // Existing courses retain their database setting until the editor saves a change.
    enabledCourseModes=course
      ? (Array.isArray(course.deliveryModes)?course.deliveryModes.filter(mode=>COURSE_MODES.includes(mode)):[])
      : [...COURSE_MODES];
    if(course && !enabledCourseModes.length && !(course.deliveryModes||[]).includes('disabled'))
      enabledCourseModes=[COURSE_MODES.includes(course.deliveryMode)?course.deliveryMode:'offline'];
    categorizedEditorMode=COURSE_MODES.includes(scopedMode)?scopedMode:(enabledCourseModes[0]||'offline');
    activeCourseMode=categorizedEditorMode;
    // Only the explicit Offer Existing Course action can preselect a new mode.
    // Ordinary editing and tab navigation must not activate additional formats.
    if(activateOnOpen && course && !enabledCourseModes.includes(activeCourseMode))enabledCourseModes.push(activeCourseMode);
    if(!course && !enabledCourseModes.includes(activeCourseMode)) enabledCourseModes=[activeCourseMode];
    const incoming=course?.contentModes&&typeof course.contentModes==='object'?course.contentModes:{};
    courseModeDrafts={offline:normalizeCourseModeDraft(incoming.offline),live:normalizeCourseModeDraft(incoming.live),recorded:normalizeCourseModeDraft(incoming.recorded)};
    if(course && !incoming[activeCourseMode] && (!Array.isArray(course.deliveryModes) || course.deliveryModes.includes(activeCourseMode))) courseModeDrafts[activeCourseMode]=normalizeCourseModeDraft(course);
    // Never copy protected lesson metadata into a public syllabus. Use only saved public modules.
    loadCourseMode(activeCourseMode);

    const modalType=COURSE_MODE_LABELS[categorizedEditorMode]||'Course';
    document.getElementById('courseModalTitle').textContent=(course?'Edit ':'Add ')+(course?.title||'Course')+' — Formats & Details';
    // Categorized editor deliberately works on one delivery version at a time.
    const switcher=courseForm.querySelector('.course-mode-switcher');
    if(switcher){
      switcher.style.display='';
      let picker=switcher.querySelector('#fsaFormatAvailability');
      if(!picker){
        picker=document.createElement('div');picker.id='fsaFormatAvailability';picker.className='fsa-format-availability';
        const tabs=switcher.querySelector('.course-mode-tabs');
        if(tabs)tabs.before(picker);else switcher.append(picker);
      }
      picker.innerHTML=`<div class="fsa-format-label"><div><strong>Course formats</strong><span>Choose which formats this course offers. New courses start with all three enabled.</span></div><button type="button" class="fsa-enable-all-formats" data-action="fsa-enable-all-formats">Enable all formats</button></div><div class="fsa-format-options">${COURSE_MODES.map(m=>`<label class="fsa-format-option"><input type="checkbox" data-course-format-checkbox data-mode="${m}" ${enabledCourseModes.includes(m)?'checked':''}><span>${m==='offline'?'Physical / Offline':m==='recorded'?'Recorded':'Live'} <small data-format-status="${m}">${enabledCourseModes.includes(m)?'Enabled':'Disabled'}</small></span></label>`).join('')}</div><small data-format-summary></small>`;
      updateCourseModeTabs();
    }
    const modeNote=document.getElementById('courseModeContext');
    if(modeNote && scopedMode)modeNote.setAttribute('aria-label',`${modalType} public course page editor`);
    setModalOpen(courseModalBackdrop,true);
    if(editorPageMode){document.body.classList.add('fsa-editor-page');document.body.classList.remove('modal-open');document.title=`Edit Course | ${course?.title||'New Course'}`;
      const hdr=courseModalBackdrop.querySelector('.course-editor-modal > header');
      if(hdr && !hdr.querySelector('.fsa-editor-menu-button')){const menu=document.createElement('button');menu.type='button';menu.className='icon-button mobile-only fsa-editor-menu-button';menu.textContent='☰';menu.setAttribute('aria-label','Open dashboard navigation');menu.addEventListener('click',()=>sidebar.classList.toggle('open'));hdr.prepend(menu);}
      const backButton=courseModalBackdrop.querySelector('.course-editor-modal > header [data-action="close-course-modal"]');if(backButton){backButton.textContent='← Back to All Courses';backButton.className='fsa-back-to-courses';backButton.setAttribute('aria-label','Back to All Courses');backButton.setAttribute('title','Return to All Courses');backButton.type='button';}}
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
      <section class="settings-card academy-shared-editor" data-editor-type="batch"><form class="settings-form academy-shared-editor-form" id="batchForm"><input type="hidden" name="id" value="${esc(row.id||'')}">
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

  // Branches administration: these functions were missing from LMS v5.1.
  async function renderBranchesAdmin(){
    const result=await api('admin_branches');
    state.branches=Array.isArray(result.branches)?result.branches:[];
    const canEdit=isCentralRole();
    const addAction=canEdit?'<button class="primary-button" type="button" data-action="add-branch">+ Add Branch</button>':'';
    content.innerHTML=`${pageHead('Branch Management',canEdit?'Manage academy locations, contact details, photography and the public branch pages.':'View branch information available to your account.',addAction)}
      <div class="toolbar"><div class="toolbar-group"><span class="form-hint">${state.branches.length} branch${state.branches.length===1?'':'es'} in your access scope</span></div></div>
      <div class="table-wrap">${state.branches.length?`<table class="data-table"><thead><tr><th>Branch</th><th>Location & Contact</th><th>Opening hours</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.branches.map(branch=>{
        const id=Number(branch.dbId)||0;
        const slug=String(branch.slug||'');
        const url=`../branches/view/index.html?branch=${encodeURIComponent(slug)}`;
        const preview=branch.image||branch.heroImage||'';
        const image=preview?`<img src="${esc(mediaUrl(preview))}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:10px">`:esc(initials(branch.shortName||branch.name||'FS'));
        const editButtons=canEdit?`<button type="button" data-action="edit-branch" data-id="${id}">Edit</button><button type="button" data-action="delete-branch" data-id="${id}">Delete</button>`:'';
        return `<tr><td><div class="user-cell"><span>${image}</span><div><strong>${esc(branch.name||branch.shortName||'Unnamed branch')}</strong><small>${esc(slug)}</small></div></div></td><td>${esc(branch.location||branch.address||'—')}<br><small>${esc(branch.phone||branch.email||'')}</small></td><td>${esc(branch.hours||'—')}</td><td><span class="${statusClass(branch.status)}">${esc(branch.status||'published')}</span></td><td><div class="row-actions"><a href="${esc(url)}" target="_blank" rel="noopener">View</a>${editButtons}</div></td></tr>`;
      }).join('')}</tbody></table>`:emptyState('No branches found',canEdit?'Add your first branch to publish an academy location.':'No branches are assigned to your account.')}</div>`;
  }

  function openBranchEditor(branch={}){
    if(!isCentralRole()){
      toast('You do not have permission to edit branches.','error');
      return;
    }
    const b={status:'published',sortOrder:state.branches.length+1,...branch};
    const existing=Number(b.dbId)||0;
    content.innerHTML=`${pageHead(existing?'Edit Branch':'Add Branch','Update a location and its public branch page. Changes are saved to MySQL.')}
      <section class="settings-card easy-editor-card academy-shared-editor" data-editor-type="branch"><form id="branchForm" class="settings-form easy-editor-form academy-shared-editor-form">
        <input type="hidden" name="dbId" value="${existing||''}">
        <label>Branch name<input name="name" required maxlength="190" value="${esc(b.name||'')}" placeholder="FSA — Charminar"></label>
        <label>Short name<input name="shortName" maxlength="120" value="${esc(b.shortName||'')}" placeholder="Charminar"></label>
        <label>URL slug<input name="slug" maxlength="120" value="${esc(b.slug||'')}" placeholder="charminar (automatically created if empty)"></label>
        <label>Area / location<input name="location" maxlength="190" value="${esc(b.location||'')}" placeholder="Charminar, Hyderabad"></label>
        <label class="full">Full address<input name="address" maxlength="500" value="${esc(b.address||'')}" placeholder="Street address and city"></label>
        <label>Phone number<input name="phone" maxlength="60" value="${esc(b.phone||'')}"></label>
        <label>Extension<input name="extension" maxlength="80" value="${esc(b.extension||'')}"></label>
        <label>Email<input name="email" type="email" maxlength="190" value="${esc(b.email||'')}"></label>
        <label>Opening hours<input name="hours" maxlength="190" value="${esc(b.hours||'')}" placeholder="Mon–Sat · 9 AM–8 PM"></label>
        <label class="full">Description<textarea name="description" maxlength="5000" rows="5">${esc(b.description||'')}</textarea></label>
        ${easyImageField('Branch listing image','image',b.image||'','Photo shown in the branches listing.')}
        ${easyImageField('Branch page hero image','heroImage',b.heroImage||'','Large image shown on the branch detail page.')}
        ${easyDetails('Gallery & display options','Optional gallery, map coordinates and publishing controls.',`
          <div class="settings-form easy-inner-grid">
            <label class="full">Gallery image URLs (one per line)<textarea name="gallery" rows="5" placeholder="assets/images/branch-detail/example/gallery-1.jpg">${esc(toLines(b.gallery))}</textarea></label>
            <label>Latitude<input name="lat" type="number" step="any" min="-90" max="90" value="${b.lat===null||b.lat===undefined?'':esc(b.lat)}"></label>
            <label>Longitude<input name="lng" type="number" step="any" min="-180" max="180" value="${b.lng===null||b.lng===undefined?'':esc(b.lng)}"></label>
            <label>Sort order<input name="sortOrder" type="number" value="${Number(b.sortOrder)||0}"></label>
            <label>Status<select name="status"><option value="published" ${b.status!=='draft'?'selected':''}>Published</option><option value="draft" ${b.status==='draft'?'selected':''}>Draft</option></select></label>
          </div>`)}
        <div class="form-actions full"><button class="secondary-button" type="button" data-view="branches">Cancel</button><button class="primary-button" type="submit">${existing?'Save Changes':'Create Branch'}</button></div>
      </form></section>`;
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
      <div class="table-wrap">${state.instructors.length?`<table class="data-table"><thead><tr><th>Instructor</th><th>Headline</th><th>Branch</th><th>Status</th><th>Public</th><th>Actions</th></tr></thead><tbody>${state.instructors.map(i=>`<tr><td><div class="user-cell"><span>${i.avatar?`<img src="${esc(mediaUrl(i.avatar))}" alt="" style="width:42px;height:42px;border-radius:50%;object-fit:cover">`:initials(i.name)}</span><div><strong>${esc(i.name)}</strong><small>${esc(i.email)}</small></div></div></td><td>${esc(i.headline||'Instructor')}</td><td>${esc(i.branch||'—')}</td><td><span class="${statusClass(i.status)}">${esc(i.status)}</span></td><td>${i.profile_public?'Yes':'No'}</td><td>${['super_admin','branch_head','branch_admin'].includes(normalizedRole())?`<button data-action="edit-instructor" data-id="${i.id}">Edit Profile</button>`:'<span class="muted">View only</span>'}</td></tr>`).join('')}</tbody></table>`:emptyState('No instructors found','Create an Instructor user first from Users.')}</div>`;
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
    accessForm.elements.delivery_mode.value=item?.delivery_mode||'offline';
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
      <div class="table-wrap">${state.enrollments.length?`<table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Mode</th><th>Order</th><th>Status</th><th>Access Window</th><th>IP Security</th><th>Actions</th></tr></thead><tbody>${state.enrollments.map(item=>`<tr><td><strong>${esc(item.student_name)}</strong><br><small>${esc(item.email)}</small></td><td>${esc(item.course_title)}</td><td><span class="status-pill">${esc(item.delivery_mode==='recorded'?'Recorded':item.delivery_mode==='live'?'Live':'Physical / Offline')}</span></td><td>${esc(item.order_number||'Manual grant')}</td><td><select data-action="enrollment-status" data-id="${item.id}">${['pending','active','completed','cancelled'].map(status=>`<option value="${status}" ${item.status===status?'selected':''}>${status[0].toUpperCase()+status.slice(1)}</option>`).join('')}</select></td><td><small>${item.access_starts_at?`Starts ${formatDate(item.access_starts_at)}`:'Starts immediately'}<br>${item.access_expires_at?`Expires ${formatDate(item.access_expires_at)}`:'No expiry'}</small></td><td><small>${item.ip_lock_enabled?`Locked${item.allowed_ip?` to ${esc(item.allowed_ip)}`:' on first opening'}`:'Not locked'}${item.last_access_ip?`<br>Last: ${esc(item.last_access_ip)}`:''}</small></td><td><button data-action="edit-enrollment" data-id="${item.id}">Manage</button></td></tr>`).join('')}</tbody></table>`:emptyState('No enrollments found','Use Grant Access to assign a course directly to a student.')}</div>`;
  }

  async function renderUsers(){ const [result,branchesResult]=await Promise.all([api('admin_users'),api('admin_branches')]); state.users=result.users||[];state.branches=branchesResult.branches||[];drawUsers(); }
  function drawUsers(){
    const q=state.userSearch.toLowerCase();
    const users=state.users.filter(user=>`${user.name} ${user.email} ${user.phone||''} ${user.student_code||''} ${user.branch||''} ${roleLabel(user.role)}`.toLowerCase().includes(q)&&(state.userRole==='all'||user.role===state.userRole||(state.userRole==='super_admin'&&user.role==='admin')));
    const availableRoles=ROLE_ORDER.filter(role=>state.users.some(user=>user.role===role||(role==='super_admin'&&user.role==='admin')));
    const roleFilterOptions=availableRoles.map(role=>`<option value="${role}" ${state.userRole===role?'selected':''}>${esc(roleLabel(role))}</option>`).join('');
    content.innerHTML=`${pageHead('User Management','Role hierarchy is enforced automatically. Use the access-role filter to quickly view each level.',manageableRoles().length?'<button class="primary-button" data-action="add-user">+ Add User</button>':'')}
      <div class="toolbar"><div class="toolbar-group"><input id="userSearch" type="search" placeholder="Search name, email, branch, phone or role" value="${esc(state.userSearch)}"><select id="userRoleFilter" aria-label="Filter by access role"><option value="all">All access roles</option>${roleFilterOptions}</select></div><span class="form-hint">${users.length} account${users.length===1?'':'s'} shown</span></div>
      <div class="table-wrap">${users.length?`<table class="data-table"><thead><tr><th>User</th><th>Branch</th><th>Access Role</th><th>Status</th><th>Recorded LMS</th><th>Actions</th></tr></thead><tbody>${users.map(user=>`<tr><td><div class="user-cell"><span>${initials(user.name)}</span><div><strong>${esc(user.name)}</strong><small>${esc(user.email)}</small></div></div></td><td><span>${esc(user.branch||'Academy-wide')}</span></td><td>${esc(roleLabel(user.role))}</td><td><span class="${statusClass(user.status)}">${esc(user.status)}</span></td><td>${user.role==='instructor'?`<span class="status-pill ${user.can_record_lectures?'status-active':'status-pending'}">${user.can_record_lectures?'Allowed':'Not allowed'}</span>`:'—'}</td><td><div class="row-actions">${user.role==='student'?'':`<button data-action="edit-user" data-id="${user.id}">Edit</button>`}<button data-action="toggle-user-status" data-id="${user.id}" data-status="${user.status==='active'?'blocked':'active'}">${user.status==='active'?'Block':'Activate'}</button>${Number(user.id)!==Number(state.user.id)?`<button data-action="delete-user" data-id="${user.id}">Delete</button>`:''}</div></td></tr>`).join('')}</tbody></table>`:emptyState('No matching users','Try another search or access role.')}</div>`;
  }
  function syncUserRoleFields(){
    const selectedRole=userForm.elements.role?.value||'';
    const row=document.getElementById('recordedLecturePermissionRow');
    const checkbox=userForm.elements.can_record_lectures;
    const canGrant=isCentralRole();
    const needsBranch=['branch_head','branch_admin','instructor'].includes(selectedRole);
    const branchRow=document.getElementById('userBranchRow');
    const branchSelect=userForm.elements.branch;
    if(branchRow)branchRow.hidden=!needsBranch;
    if(branchSelect){branchSelect.required=needsBranch;branchSelect.disabled=!needsBranch;if(!needsBranch)branchSelect.value='';}
    if(row) row.hidden=selectedRole!=='instructor';
    if(checkbox){checkbox.disabled=selectedRole!=='instructor'||!canGrant;if(selectedRole!=='instructor')checkbox.checked=false;}
  }
  function openUserModal(user=null){
    if(user?.role==='student'){toast('Manage students through Student Management.','error');return;}
    setFormStatus('userForm');userForm.reset();
    const allowed=manageableRoles();
    if(!allowed.length){toast('Your role cannot create or edit user accounts.','error');return;}
    userForm.elements.id.value=user?.id||'';userForm.elements.name.value=user?.name||'';userForm.elements.email.value=user?.email||'';userForm.elements.phone.value=user?.phone||'';
    const roleSelect=userForm.elements.role;const currentRole=user?.role==='admin'?'super_admin':(user?.role||allowed.find(r=>r!=='student')); 
    const roleOptions=ROLE_ORDER.filter(r=>r!=='student'&&(allowed.includes(r)||(user&&r===currentRole)));roleSelect.innerHTML=roleOptions.map(r=>`<option value="${r}" ${r===currentRole?'selected':''}>${esc(roleLabel(r))}</option>`).join('');
    userForm.elements.status.value=user?.status||'active';
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
    const pendingEnrollments=r.enrollment_requests||[];
    const enrollmentTable=pendingEnrollments.length?`<table class="data-table"><thead><tr><th>Student</th><th>Course</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead><tbody>${pendingEnrollments.map(x=>`<tr><td>${esc(x.student)}</td><td>${esc(x.course)}</td><td>${esc(x.branch)}</td><td><span class="${statusClass('pending')}">Pending</span></td><td>${actionButtons('enrollment',x)}</td></tr>`).join('')}</tbody></table>`:emptyState('No enrollment approvals','Manual pending enrollments and paid-course access requests will appear here. Unpaid orders must be confirmed through Orders.');
    const publicCourses=r.course_public_requests||[];
    const publicTable=publicCourses.length?`<table class="data-table"><thead><tr><th>Public course</th><th>Submitted by</th><th>Branch</th><th>Status</th><th>Decision</th></tr></thead><tbody>${publicCourses.map(x=>`<tr><td><strong>${esc(x.title)}</strong><br><small>${esc(x.slug)}</small></td><td>${esc(x.instructorName)}</td><td>${esc(x.branch)}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span>${x.note?`<small>${esc(x.note)}</small>`:''}</td><td>${actionButtons('course_public',x)}</td></tr>`).join('')}</tbody></table>`:emptyState('No new public course requests','Instructor-created public courses awaiting review will appear here.');
    content.innerHTML=`${pageHead('Approval Centre','Recorded LMS content is approved centrally. Other assigned branch course content can be approved by the Branch Head or Branch Admin.')}
      <section><h2>Public course approvals</h2><div class="table-wrap">${publicTable}</div></section>
      <section><h2>Student enrollment approvals</h2><div class="table-wrap">${enrollmentTable}</div></section>
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

  let websiteDraft=null,websiteRevision='',websiteSection='heroSlides',websiteSearch='';
  const websiteSections={translations:'Translation Dictionary (Hindi)',homeSections:'Homepage Services, Mission & Images',coursesPage:'Courses Archive Page',heroSlides:'Homepage Banners',stats:'Homepage Statistics',faqs:'Help FAQs',courseFaqTemplates:'Course FAQ Templates',courseFaqs:'Per-course FAQs',academyImages:'Page Images',callback:'Callback Options',assistant:'Assistant Questions / Replies',super40:'SUPER40 Program',news:'Latest News',attributes:'Labels / Placeholders',helpFaqExtras:'Account Help FAQs',courseNavigation:'Course Navigation',copy:'Website Text',assets:'Image / Link URLs',routes:'Page-specific Text / Images',placementEmail:'Placement Contact Email'};
  function websiteContentFields(){
    const value=websiteDraft?.[websiteSection];
    if(['copy','assets','attributes'].includes(websiteSection)){
      const entries=Object.entries(value||{}).filter(([key,val])=>`${key} ${val}`.toLowerCase().includes(websiteSearch.toLowerCase()));
      return `<label>Search current text or URL<input class="form-control" id="websiteContentSearch" value="${esc(websiteSearch)}" autocomplete="off"></label><p>${entries.length} fields. The first 80 matching fields are displayed; search to find another field.</p><div id="websiteTextFields">${entries.slice(0,80).map(([key,val])=>`<label style="display:block;margin:18px 0"><small>${esc(key)}</small><textarea class="form-control" data-website-key="${esc(key)}" rows="2">${esc(val)}</textarea></label>`).join('')}</div><details><summary>Add a text or URL override</summary><label>Exact current text / URL<input class="form-control" id="websiteNewKey"></label><label>Replacement<input class="form-control" id="websiteNewValue"></label><button type="button" class="secondary-button" id="websiteAddOverride">Add field</button></details>`;
    }
    if(websiteSection==='placementEmail')return `<label>Placement team email<input class="form-control" type="email" id="websiteContentValue" value="${esc(value||'')}"></label>`;
    return `<p>${websiteSection==='super40'?'Edit the program section arrays, fee schedule, dates and scholarship values.':websiteSection==='routes'?'Use route keys such as /about or /privacy, with copy and assets objects.':'Edit this section as JSON. Keep property names; change values, add rows, or remove rows.'}</p><textarea class="form-control" id="websiteContentJson" spellcheck="false" style="width:100%;min-height:440px;font-family:monospace">${esc(JSON.stringify(value??{},null,2))}</textarea>`;
  }
  function paintWebsiteContent(){
    content.innerHTML=`${pageHead('Website Content','Edit existing text and images without changing page layouts. Companies, alumni, reviews, events, branches and batches remain in their own sections.')}<form id="websiteContentForm"><label>Content section<select class="form-control" id="websiteContentSection">${Object.entries(websiteSections).map(([key,label])=>`<option value="${key}" ${key===websiteSection?'selected':''}>${label}</option>`).join('')}</select></label><div id="websiteContentFields">${websiteContentFields()}</div><div class="form-actions" style="margin-top:20px"><button class="primary-button" type="submit">Save Website Content</button><button class="secondary-button" type="button" id="websiteContentReload">Reload Saved Content</button><a class="secondary-button" href="../index.html" target="_blank" rel="noopener">View Website</a></div><p id="websiteContentStatus" role="status"></p></form>`;
    const form=document.getElementById('websiteContentForm');
    const remember=()=>{
      if(['copy','assets','attributes'].includes(websiteSection))form.querySelectorAll('[data-website-key]').forEach(input=>websiteDraft[websiteSection][input.dataset.websiteKey]=input.value);
      else if(websiteSection==='placementEmail')websiteDraft.placementEmail=document.getElementById('websiteContentValue').value.trim();
      else websiteDraft[websiteSection]=JSON.parse(document.getElementById('websiteContentJson').value);
    };
    document.getElementById('websiteContentSection').onchange=event=>{try{remember();websiteSection=event.target.value;websiteSearch='';paintWebsiteContent();}catch(error){toast('Correct the JSON before switching sections.','error');event.target.value=websiteSection;}};
    document.getElementById('websiteContentReload').onclick=()=>renderWebsiteContent();
    const search=document.getElementById('websiteContentSearch');
    if(search)search.oninput=()=>{remember();websiteSearch=search.value;paintWebsiteContent();const next=document.getElementById('websiteContentSearch');next.focus();next.setSelectionRange(websiteSearch.length,websiteSearch.length);};
    const add=document.getElementById('websiteAddOverride');if(add)add.onclick=()=>{remember();const key=document.getElementById('websiteNewKey').value.trim();if(!key)return;websiteDraft[websiteSection][key]=document.getElementById('websiteNewValue').value;websiteSearch=key;paintWebsiteContent();};
    form.onsubmit=async event=>{event.preventDefault();event.stopPropagation();try{remember();const button=form.querySelector('[type="submit"]');button.disabled=true;const result=await api('admin_website_content_save',{method:'POST',body:{content:websiteDraft,revision:websiteRevision}});websiteDraft=result.content;websiteRevision=result.revision;toast(result.message);document.getElementById('websiteContentStatus').textContent=result.message;button.disabled=false;}catch(error){toast(error.message||'Unable to save content.','error');form.querySelector('[type="submit"]').disabled=false;}};
  }
  // Homepage slider manager: upload to existing Media Library, save through revision-safe CMS.
  let bannerDraft=[],bannerContent=null,bannerRevision='',bannerBusy=false;
  const bannerFormats={desktopImage:{label:'Desktop',dimension:'1920 × 700'},tabletImage:{label:'Tablet',dimension:'1280 × 800'},mobileImage:{label:'Mobile',dimension:'1066 × 1600'}};
  const bannerGet=(row,key)=>String(row[key]||(key==='desktopImage'?row.image:'')||'');
  function bannerFields(row,index){
    const images=Object.entries(bannerFormats).map(([key,cfg])=>{
      const url=bannerGet(row,key);return `<div class="fsa-banner-slot" data-format="${key}" data-index="${index}">
        <div class="fsa-banner-slot-head"><strong>${cfg.label}</strong><small>${cfg.dimension} px</small></div>
        <div class="fsa-banner-drop" data-banner-drop="${key}" data-index="${index}" role="button" tabindex="0" aria-label="Upload ${cfg.label} image for slide ${index+1}">
          ${url?`<img src="${esc(mediaUrl(url))}" alt="${cfg.label} banner preview" loading="lazy">`:`<span>＋<br>Drop image here<br><small>or click to upload</small></span>`}
          ${url?`<button class="fsa-banner-delete" type="button" data-banner-clear="${key}" data-index="${index}" aria-label="Remove ${cfg.label} image from slide ${index+1}" title="Remove image">×</button>`:''}
        </div><input type="hidden" name="${key}" value="${esc(url)}"><input class="fsa-banner-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" data-index="${index}" data-format="${key}" hidden>
      </div>`;
    }).join('');
    return `<section class="settings-card fsa-banner-card" draggable="true" data-banner-index="${index}">
      <div class="fsa-banner-card-head"><span class="fsa-banner-handle" title="Drag to reorder">⠿</span><h2>Banner ${index+1} <small class="fsa-banner-compact-state">${row.enabled!==false?'· Visible':'· Hidden'}</small></h2><div class="row-actions"><button type="button" data-banner-action="up" data-index="${index}" ${index===0?'disabled':''}>↑</button><button type="button" data-banner-action="down" data-index="${index}" ${index===bannerDraft.length-1?'disabled':''}>↓</button><button type="button" class="fsa-banner-remove" data-banner-action="remove" data-index="${index}" aria-label="Delete slide ${index+1}">× Delete slide</button></div></div>
      <div class="fsa-banner-images">${images}</div>
      <div class="settings-form fsa-banner-details"><label>Button text<input name="buttonText" value="${esc(row.buttonText??'See Details')}" maxlength="60" placeholder="e.g. Explore Courses"></label><label>Button link<input name="href" value="${esc(row.href||'')}" placeholder="#/courses or https://example.com"></label><label class="full">Image description (accessibility)<input name="alt" value="${esc(row.alt||'')}" maxlength="250" placeholder="Describe the banner image"></label><div class="fsa-banner-action-preview full"><span>BUTTON PREVIEW</span><span class="fsa-banner-action-pill" data-banner-button-preview="${index}">${esc(row.buttonText??'See Details')||'Button hidden'} &nbsp; ↗</span><small>This uses the same button style as your homepage. The entire banner image also opens the same link.</small></div><label class="check-row full"><input type="checkbox" name="enabled" ${row.enabled!==false?'checked':''}><span><strong>Visible on homepage</strong></span></label></div>
    </section>`;
  }
  function collectBannerEdits(){document.querySelectorAll('.fsa-banner-card[data-banner-index]').forEach(el=>{const row=bannerDraft[Number(el.dataset.bannerIndex)];if(!row)return;Object.keys(bannerFormats).forEach(k=>row[k]=el.querySelector(`[name="${k}"]`).value.trim());row.image=row.desktopImage;row.buttonText=el.querySelector('[name="buttonText"]').value.trim();row.href=el.querySelector('[name="href"]').value.trim();row.alt=el.querySelector('[name="alt"]').value.trim();row.enabled=el.querySelector('[name="enabled"]').checked;});}
  function bannerSetBusy(busy,message=''){bannerBusy=busy;document.querySelectorAll('#homepageSliderForm button, #homepageSliderForm input[type="file"]').forEach(n=>n.disabled=busy);const el=document.getElementById('bannerUploadStatus');if(el)el.textContent=message;}
  async function bannerUpload(files,format,index=null){
    const selected=[...files].filter(f=>f&&f.type.startsWith('image/'));
    if(!selected.length){toast('Select supported image files.','error');return;}
    if(bannerBusy)return;collectBannerEdits();bannerSetBusy(true,`Uploading 0 of ${selected.length}…`);
    let success=0;try{for(const file of selected){if(file.size>8*1024*1024)throw new Error(`${file.name}: maximum image size is 8 MB.`);
      const form=new FormData();form.append('media',file);
      const result=await api('admin_media_upload',{method:'POST',body:form});const url=result.media?.url;
      if(!url)throw new Error(`Upload did not return a URL for ${file.name}.`);
      let dest=index;
      if(dest===null||dest===undefined||success>0){dest=bannerDraft.length;bannerDraft.push({image:'',desktopImage:'',tabletImage:'',mobileImage:'',href:'#/courses',buttonText:'See Details',alt:'',enabled:true});}
      bannerDraft[dest][format]=url;if(format==='desktopImage')bannerDraft[dest].image=url;
      success++;bannerSetBusy(true,`Uploaded ${success} of ${selected.length}…`);
    }toast(`${success} image${success===1?'':'s'} uploaded. Click Save Homepage Slides to publish.`);}
    catch(error){toast(error.message||'Upload failed','error');}
    finally{bannerBusy=false;paintBannerEditor();document.getElementById('bannerUploadStatus').textContent=`${success} uploaded. Unsaved changes — click Save Homepage Slides.`;}
  }
  function paintBannerEditor(){
    content.innerHTML=`${pageHead('Homepage Slider','Manage every homepage banner here. Drag and drop images, upload multiple files, reorder banners, then save. The public homepage design stays unchanged.')}
      <style>
      .fsa-banner-tools{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:0 0 16px}.fsa-banner-tools label{cursor:pointer}.fsa-banner-note{margin-bottom:22px;color:#75686b}
      .fsa-banner-card{padding:20px;margin-bottom:18px;border-radius:18px}.fsa-banner-card.fsa-dragging{opacity:.48}.fsa-banner-card.fsa-over{outline:2px dashed #942638;outline-offset:3px}
      .fsa-banner-card-head{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap}.fsa-banner-card-head h2{margin:0;flex:1}.fsa-banner-compact-state{font-size:12px;font-weight:500;color:#97787f}.fsa-banner-action-preview{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;background:#fbf5f6;border:1px solid #ebd6db;border-radius:12px}.fsa-banner-action-preview>span:first-child{font-size:10px;letter-spacing:.09em;font-weight:750;color:#8c273b}.fsa-banner-action-preview small{color:#7f7476}.fsa-banner-action-pill{display:inline-flex;align-items:center;background:#8d2539;color:white;border-radius:40px;padding:10px 18px;font-size:12px;font-weight:700}.fsa-banner-details input:focus{border-color:#8c273b;outline:2px solid #ecd0d7;outline-offset:1px}.fsa-banner-handle{font-size:26px;color:#91283b;cursor:grab;user-select:none}.fsa-banner-images{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
      .fsa-banner-slot{min-width:0}.fsa-banner-slot-head{display:flex;justify-content:space-between;gap:5px;margin-bottom:8px}.fsa-banner-slot-head small{font-size:11px;color:#897e7e}
      .fsa-banner-drop{position:relative;display:grid;place-items:center;text-align:center;height:170px;overflow:hidden;border:1.5px dashed #cdb5bb;border-radius:13px;background:#fbf5f6;cursor:pointer;color:#872639;transition:background .15s,border .15s}.fsa-banner-drop:hover,.fsa-banner-drop.fsa-over{background:#f7e8eb;border-color:#91283b}.fsa-banner-drop img{display:block;width:100%;height:100%;object-fit:contain;background:#f6eff0}.fsa-banner-drop span{line-height:1.6;font-weight:650}.fsa-banner-drop small{font-weight:400}
      .fsa-banner-delete{position:absolute;right:8px;top:8px;z-index:2;display:grid;place-items:center;background:#8e2437!important;color:white!important;border:none!important;border-radius:50%!important;width:32px!important;height:32px!important;padding:0!important;font-size:24px!important;cursor:pointer}.fsa-banner-details{margin-top:16px}.fsa-banner-remove{color:#922b3b!important}
      @media(max-width:900px){.fsa-banner-images{grid-template-columns:1fr}.fsa-banner-drop{height:190px}.fsa-banner-card-head h2{min-width:100px}}
      </style>
      <form id="homepageSliderForm"><div class="fsa-banner-tools"><button type="button" class="secondary-button" id="addBannerSlide">＋ Add empty banner</button><label class="secondary-button">⇧ Bulk upload desktop<input type="file" id="bulkBannerDesktop" multiple accept="image/*" hidden></label><label class="secondary-button">⇧ Bulk upload tablet<input type="file" id="bulkBannerTablet" multiple accept="image/*" hidden></label><label class="secondary-button">⇧ Bulk upload mobile<input type="file" id="bulkBannerMobile" multiple accept="image/*" hidden></label><a class="secondary-button" href="../index.html" target="_blank" rel="noopener">Preview homepage ↗</a></div>
      <p class="fsa-banner-note">Upload a desktop, tablet and mobile image into the same banner card. Bulk upload creates one new banner per image for the chosen device. You can drag cards to reorder. Desktop 1920×700 · tablet 1280×800 · mobile 1066×1600 px. Unset device images fall back to desktop.</p>
      <p id="bannerUploadStatus" role="status" aria-live="polite"></p><div id="fsaBannerList">${bannerDraft.map(bannerFields).join('')}</div>
      <div class="form-actions"><button class="primary-button" type="submit">Save Homepage Slides</button><button class="secondary-button" type="button" id="reloadBannerSlides">Reload saved</button></div><p id="bannerSaveStatus" role="status"></p></form>`;
    document.getElementById('addBannerSlide').onclick=()=>{collectBannerEdits();bannerDraft.push({image:'',desktopImage:'',tabletImage:'',mobileImage:'',href:'#/courses',buttonText:'See Details',alt:'',enabled:true});paintBannerEditor();};
    document.getElementById('reloadBannerSlides').onclick=()=>{if(confirm('Discard unsaved banner changes and reload?'))renderHeroSlider();};
    [['bulkBannerDesktop','desktopImage'],['bulkBannerTablet','tabletImage'],['bulkBannerMobile','mobileImage']].forEach(([id,key])=>{document.getElementById(id).onchange=e=>bannerUpload(e.target.files,key);});
    content.querySelectorAll('[data-banner-action]').forEach(b=>b.onclick=()=>{collectBannerEdits();const i=Number(b.dataset.index),a=b.dataset.bannerAction;if(a==='remove'){if(!confirm('Delete this slide? Changes take effect only after saving.'))return;bannerDraft.splice(i,1);}if(a==='up'&&i>0)[bannerDraft[i-1],bannerDraft[i]]=[bannerDraft[i],bannerDraft[i-1]];if(a==='down'&&i<bannerDraft.length-1)[bannerDraft[i+1],bannerDraft[i]]=[bannerDraft[i],bannerDraft[i+1]];paintBannerEditor();});
    content.querySelectorAll('[data-banner-clear]').forEach(b=>b.onclick=e=>{e.stopPropagation();collectBannerEdits();const i=Number(b.dataset.index),key=b.dataset.bannerClear;bannerDraft[i][key]='';if(key==='desktopImage')bannerDraft[i].image='';paintBannerEditor();});
    content.querySelectorAll('.fsa-banner-drop').forEach(zone=>{const i=Number(zone.dataset.index),key=zone.dataset.bannerDrop;const input=zone.parentNode.querySelector('input[type=file]');zone.onclick=e=>{if(!e.target.closest('[data-banner-clear]'))input.click();};zone.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}};input.onchange=e=>bannerUpload(e.target.files,key,i);zone.ondragover=e=>{e.preventDefault();e.stopPropagation();zone.classList.add('fsa-over');};zone.ondragleave=()=>zone.classList.remove('fsa-over');zone.ondrop=e=>{e.preventDefault();e.stopPropagation();zone.classList.remove('fsa-over');bannerUpload(e.dataTransfer.files,key,i);};});
    let dragging=null;content.querySelectorAll('.fsa-banner-card').forEach(card=>{card.ondragstart=e=>{if(e.target.closest('.fsa-banner-drop')){e.preventDefault();return;}dragging=Number(card.dataset.bannerIndex);card.classList.add('fsa-dragging');e.dataTransfer.effectAllowed='move';};card.ondragend=()=>{dragging=null;card.classList.remove('fsa-dragging');content.querySelectorAll('.fsa-over').forEach(n=>n.classList.remove('fsa-over'));};card.ondragover=e=>{if(dragging===null)return;e.preventDefault();card.classList.add('fsa-over');};card.ondragleave=()=>card.classList.remove('fsa-over');card.ondrop=e=>{if(dragging===null||e.target.closest('.fsa-banner-drop'))return;e.preventDefault();collectBannerEdits();const dest=Number(card.dataset.bannerIndex);const [moved]=bannerDraft.splice(dragging,1);bannerDraft.splice(dest,0,moved);dragging=null;paintBannerEditor();};});
    content.querySelectorAll('.fsa-banner-card input[name="buttonText"]').forEach(inp=>inp.addEventListener('input',()=>{const preview=inp.closest('.fsa-banner-card').querySelector('[data-banner-button-preview]');if(preview)preview.textContent=(inp.value.trim()||'Button hidden')+'  ↗';}));
    document.getElementById('homepageSliderForm').onsubmit=async e=>{e.preventDefault();if(bannerBusy)return;collectBannerEdits();bannerSetBusy(true,'Saving banners…');try{const next={...bannerContent,heroSlides:bannerDraft};const result=await api('admin_website_content_save',{method:'POST',body:{content:next,revision:bannerRevision}});bannerContent=result.content;bannerRevision=result.revision;bannerDraft=(result.content.heroSlides||[]).map(r=>({...r}));toast('Homepage slides saved.');bannerBusy=false;paintBannerEditor();document.getElementById('bannerSaveStatus').textContent='Saved. Refresh the homepage to see changes.';}catch(error){bannerSetBusy(false,'Save failed. Your edits are still here.');toast(error.message||'Could not save slides.','error');}};
  }
  async function renderHeroSlider(){const result=await api('admin_website_content');bannerContent=result.content;bannerRevision=result.revision;bannerDraft=(result.content.heroSlides||[]).map(r=>({...r}));paintBannerEditor();}

  async function renderWebsiteContent(){const result=await api('admin_website_content');websiteDraft=result.content;websiteRevision=result.revision;paintWebsiteContent();}

  async function renderSettings(){
    const result=await api('admin_settings');
    state.settings=result.settings;
    const site=state.settings.site||{};
    state.site=site;
    applyAdminBranding(site);
    content.innerHTML=`${pageHead('Website Settings','Manage public content, contact details and every website logo from one place.')}<div class="settings-layout"><aside class="settings-menu"><button class="active">General & Branding</button><button data-view="pages">Pages</button><button data-view="snippets">Code Snippets</button><button data-view="theme">Theme Colors</button><button data-view="media">Media Library</button><button data-view="smtp">SMTP Email</button><button data-view="account">Administrator</button></aside><section class="settings-card"><h2>Public Website Configuration</h2><p>Saved changes load automatically on the public website and admin dashboard.</p><form class="settings-form" id="siteSettingsForm"><div class="settings-section-title full"><span>General Information</span><small>Website identity, contact information and public behaviour.</small></div><label>Academy name<input name="academy_name" required maxlength="120" value="${esc(site.academy_name||'')}"></label><label>Short tagline<input name="academy_tagline" maxlength="120" value="${esc(site.academy_tagline||'Learning Platform')}"></label><label class="full">Footer description <small>Leave blank to hide this text.</small><textarea name="footer_text" maxlength="500">${esc(site.footer_text??'Career-focused technology learning with practical projects, structured pathways and expert guidance.')}</textarea></label><label class="full">Announcement text <small>Leave blank to hide the top announcement bar.</small><input name="announcement_text" maxlength="255" value="${esc(site.announcement_text??'New AI and Web Development batches are now open.')}"></label><label>Public URL<input name="site_url" type="url" placeholder="https://yourdomain.com" value="${esc(site.site_url||'')}"></label><label>Support email<input name="support_email" type="email" required value="${esc(site.support_email||'')}"></label><label>Support phone<input name="support_phone" required value="${esc(site.support_phone||'')}"></label><label>Currency symbol<input name="currency_symbol" maxlength="5" value="${esc(site.currency_symbol||'₹')}"></label><label>Number locale<select name="locale">${['en-IN','en-PK','en-US','en-GB'].map(locale=>`<option value="${locale}" ${site.locale===locale?'selected':''}>${locale}</option>`).join('')}</select></label><label>Timezone<select name="timezone">${['Asia/Kolkata','Asia/Karachi','Asia/Dubai','UTC'].map(zone=>`<option value="${zone}" ${site.timezone===zone?'selected':''}>${zone}</option>`).join('')}</select></label><div class="settings-section-title full"><span>Logo Settings</span><small>Choose images from the Media Library. Empty footer, mobile or admin logo fields automatically use the header logo.</small></div>${logoField('Header logo','header_logo',site.header_logo,'header_logo_width',site.header_logo_width||180,'Used in the main desktop header.')}${logoField('Footer logo','footer_logo',site.footer_logo,'footer_logo_width',site.footer_logo_width||190,'Leave empty to use the header logo.')}${logoField('Mobile menu logo','mobile_logo',site.mobile_logo,'mobile_logo_width',site.mobile_logo_width||160,'Leave empty to use the header logo.')}${logoField('Admin dashboard logo','admin_logo',site.admin_logo,'admin_logo_width',site.admin_logo_width||180,'Used on the admin login and sidebar. Leave empty to use the header logo.')}${logoField('Website favicon','favicon_url',site.favicon_url||'assets/favicon.svg','',0,'Small browser-tab icon. Recommended square image.') }<label class="check-row full"><input type="checkbox" name="registration_enabled" ${site.registration_enabled!==false?'checked':''}><span><strong>Allow learner registrations</strong><small>Students can create accounts from the public website.</small></span></label><label class="check-row full"><input type="checkbox" name="email_notifications" ${site.email_notifications?'checked':''}><span><strong>Send automatic emails</strong><small>Uses SMTP when enabled.</small></span></label><div class="form-actions"><button class="primary-button" type="submit">Save Website Settings</button></div></form></section></div>`;
  }

  function renderAccount(){ content.innerHTML=`${pageHead('Administrator Account','Change the default password before publishing the website.')}<div class="settings-layout"><aside class="settings-menu"><button class="active">Profile & Security</button><button data-view="users">All Administrators</button></aside><section class="settings-card"><h2>${esc(state.user.name)}</h2><p>${esc(state.user.email)} · Administrator</p><form class="settings-form" id="adminPasswordForm"><label class="full">Current password<input name="current_password" type="password" required></label><label>New password<input name="new_password" type="password" minlength="8" required></label><label>Confirm password<input name="confirm_password" type="password" minlength="8" required></label><div class="form-actions"><button class="primary-button" type="submit">Update Password</button></div></form></section></div>`; }

  // Physical-only page builder. Section headings drive the right-hand course TOC.
  // Native HTML Drag & Drop reorders widgets and sections, with keyboard-accessible move buttons.
  const PC_TYPES={banner:'Course banner',heading:'Heading',paragraph:'Text content',image:'Image',gallery:'Image gallery',callout:'Highlight',download:'Link / download',quiz:'Quiz',assignment:'Assignment',code:'Code block',divider:'Divider'};
  const PC_ICONS={banner:'▣',heading:'H',paragraph:'¶',image:'▧',gallery:'▦',callout:'✦',download:'↗',quiz:'?',assignment:'✓',code:'</>',divider:'—'};
  let pcCourse=null,pcSections=[],pcDirty=false,pcDrag=null,pcOpenBlock=null,pcActiveLesson=0;
  const pcId=()=>`pc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
  function pcNewBlock(type){
    const base={id:pcId(),type,title:'',text:'',url:'',images:[],choices:['Option A','Option B'],correct:0,required:false};
    if(type==='quiz')base.questions=[{id:pcId(),prompt:'',choices:['Option A','Option B'],correct:0}];
    return base;
  }
  function pcOptions(value){return Object.entries(PC_TYPES).map(([type,label])=>`<option value="${type}" ${type===value?'selected':''}>${esc(label)}</option>`).join('');}
  function pcField(label,field,value='',type='input',hint=''){
    return `<label class="pc-field">${esc(label)}${type==='textarea'?`<textarea data-pc-field="${field}" rows="${field==='text'?'4':'3'}">${esc(value)}</textarea>`:`<input data-pc-field="${field}" value="${esc(value)}" type="text">`}${hint?`<small>${esc(hint)}</small>`:''}</label>`;
  }

  function pcQuizQuestions(block){
    const list=Array.isArray(block?.questions)&&block.questions.length?block.questions:[];
    if(list.length)return list.map((question,index)=>({
      id:physicalSafeId(question?.id||pcId()),
      prompt:String(question?.prompt||question?.text||'').trim(),
      choices:(Array.isArray(question?.choices)?question.choices:[]).map(v=>String(v||'').trim()).filter(Boolean).slice(0,8),
      correct:Math.max(0,Number(question?.correct)||0)
    })).map(question=>({...question,choices:question.choices.length?question.choices:['Option A','Option B'],correct:Math.max(0,Math.min(question.choices.length-1,question.correct))}));
    const choices=(block?.choices||['Option A','Option B']).map(v=>String(v||'').trim()).filter(Boolean).slice(0,8);
    return [{id:pcId(),prompt:String(block?.text||'').trim(),choices:choices.length?choices:['Option A','Option B'],correct:Math.max(0,Math.min((choices.length||2)-1,Number(block?.correct)||0))}];
  }
  function physicalSafeId(value){
    const text=String(value||'').replace(/[^a-zA-Z0-9_-]+/g,'').slice(0,64);
    return text||pcId();
  }
  function pcQuizQuestionEditor(question,qi){
    const choices=(question.choices||['Option A','Option B']).join('\n');
    return `<article class="pc-quiz-question" data-pc-quiz-question="${qi}" data-question-id="${esc(question.id||'')}">
      <div class="pc-quiz-question-top"><strong>Question ${qi+1}</strong><button type="button" class="pc-danger" data-action="pc-remove-quiz-question" data-question="${qi}" ${qi===0?'disabled':''}>Remove</button></div>
      <label class="pc-field">Question text<textarea data-pc-quiz-field="prompt" rows="3">${esc(question.prompt||'')}</textarea></label>
      <label class="pc-field">Answer options — one per line<textarea data-pc-quiz-field="choices" rows="4">${esc(choices)}</textarea><small>Up to 8 answer choices for this question.</small></label>
      <label class="pc-field">Correct answer number<input data-pc-quiz-field="correct" type="number" min="1" max="8" value="${Math.max(0,Number(question.correct)||0)+1}"></label>
    </article>`;
  }
  function pcQuizSummary(block){
    const questions=pcQuizQuestions(block);
    return `${questions.length} question${questions.length===1?'':'s'}`;
  }
  function pcBlockEditor(block,si,bi){
    const type=PC_TYPES[block.type]?block.type:'paragraph';const isOpen=pcOpenBlock===block.id;
    let inputs='';
    if(type!=='divider') inputs+=pcField(type==='banner'?'Banner headline':type==='quiz'?'Quiz title':type==='assignment'?'Assignment title':'Widget heading / caption','title',block.title);
    if(type==='paragraph') inputs+=`<div class="pc-rich-field"><div class="pc-rich-toolbar" role="toolbar" aria-label="Lesson formatting"><button type="button" data-pc-format="heading" title="Heading">H2</button><button type="button" data-pc-format="bold" title="Bold"><strong>B</strong></button><button type="button" data-pc-format="italic" title="Italic"><em>I</em></button><button type="button" data-pc-format="list" title="Bullet list">≡</button><button type="button" data-pc-format="number" title="Numbered list">1.</button><button type="button" data-pc-format="link" title="Link">🔗</button><button type="button" data-pc-format="inlinecode" title="Inline code">&lt;/&gt;</button><button type="button" data-pc-format="code" title="Fenced code block">{ }</button></div>${pcField('Lesson content — rich formatting','text',block.text,'textarea','Use toolbar to format text. Use a separate Code Block widget for longer code examples.')}<div class="pc-rich-preview-label">Student preview</div><div class="pc-rich-preview" data-pc-preview></div></div>`;
    if(type==='code') inputs+=`${pcField('Source code','text',block.text,'textarea','Paste code exactly as written. It will display with a colored code editor style to students.')}<label class="pc-field">Programming language<select data-pc-field="language">${['javascript','html','css','jsx','json','python','php','sql','bash','text'].map(lang=>`<option value="${lang}" ${String(block.language||'javascript')===lang?'selected':''}>${lang.toUpperCase()}</option>`).join('')}</select></label><div class="pc-rich-preview-label">Code preview</div><pre class="pc-code-preview"><code data-pc-code-preview></code></pre>`;
    if(['banner','callout','assignment'].includes(type)) inputs+=pcField(type==='banner'?'Short banner description':type==='assignment'?'Assignment instructions':'Body text','text',block.text,'textarea');
    if(['banner','image','download'].includes(type))inputs+=`<div class="pc-media-field">${pcField(type==='banner'?'Banner image URL':type==='image'?'Image URL':'File / link URL','url',block.url,'input','Upload in Media Library or provide an https:// link.')}<button type="button" class="secondary-button" data-action="pc-pick-media" data-section="${si}" data-block="${bi}">Choose media</button></div>`;
    if(type==='gallery')inputs+=pcField('Gallery image URLs — one per line','images',(block.images||[]).join('\n'),'textarea','Add up to 16 photos using the Media Library URLs.');
    if(type==='quiz'){
      const questions=pcQuizQuestions(block);
      inputs+=`<div class="pc-quiz-builder"><div class="pc-quiz-builder-head"><div><strong>Quiz questions</strong><small>Create one quiz with multiple questions.</small></div><button type="button" class="secondary-button" data-action="pc-add-quiz-question">+ Add question</button></div><div class="pc-quiz-list">${questions.map((question,qi)=>pcQuizQuestionEditor(question,qi)).join('')}</div></div>`;
    }
    if(['quiz','assignment'].includes(type))inputs+=`<label class="pc-required"><input type="checkbox" data-pc-field="required" ${block.required?'checked':''}><span><strong>Require submission to continue</strong><small>When checked, the next content stays locked until the learner submits successfully.</small></span></label>`;
    const label=block.title|| (type==='paragraph'?String(block.text||'').slice(0,65):type==='quiz'?pcQuizSummary(block):'Configure this widget');
    const photo=type==='image'&&cmUrl(block.url)?`<img src="${esc(cmUrl(block.url))}" alt="" loading="lazy">`:'';
    const stage=type==='banner'?`<div class="pc-builder-banner-stage">${cmUrl(block.url)?`<img src="${esc(cmUrl(block.url))}" alt="" loading="lazy">`:''}<div><span>PHYSICAL COURSE</span><h2>${esc(block.title||'Add your banner headline')}</h2><p>${esc(block.text||'Add a short introduction to your course.')}</p></div></div>`:'';
    return `<article class="pc-block ${isOpen?'pc-block-open':''}" data-pc-block="${bi}" data-pc-block-id="${esc(block.id)}" tabindex="0" aria-label="${esc(PC_TYPES[type])} widget, draggable to reorder">
      <div class="pc-block-top"><span class="pc-drag-handle" draggable="true" aria-label="Drag widget" title="Drag to reorder">⠿</span><span class="pc-block-icon" aria-hidden="true">${PC_ICONS[type]}</span><div class="pc-block-summary"><strong>${esc(PC_TYPES[type])}</strong><small>${esc(label||'Configure this widget')}</small></div>${photo}<div class="pc-actions"><button type="button" data-action="pc-toggle-block" data-id="${esc(block.id)}" aria-expanded="${isOpen}">${isOpen?'Close':'Edit'}</button><button type="button" data-action="pc-move-block" data-section="${si}" data-block="${bi}" data-direction="-1" title="Move up">↑</button><button type="button" data-action="pc-move-block" data-section="${si}" data-block="${bi}" data-direction="1" title="Move down">↓</button><button type="button" data-action="pc-remove-block" data-section="${si}" data-block="${bi}" class="pc-danger" title="Delete widget">×</button></div></div>${stage}
      <div class="pc-block-fields" ${isOpen?'':'hidden'}><label class="pc-field">Widget type<select data-pc-field="type" data-section="${si}" data-block="${bi}">${pcOptions(type)}</select></label>${inputs}</div></article>`;
  }
  function pcRichSafe(text){return String(text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function pcRichPreview(value){
    const source=String(value||'').replace(/\r/g,'');
    return source.split(/\n/).map(line=>{
      let safe=pcRichSafe(line);
      safe=safe.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
      const link=safe.match(/\[([^\]]+)\]\((https?:\/\/[^ )]+)\)/);if(link)safe=safe.replace(link[0],'<a href="'+link[2].replace(/&quot;/g,'')+'" target="_blank" rel="noopener noreferrer">'+link[1]+'</a>');
      if(/^### /.test(line))return '<h4>'+safe.slice(4)+'</h4>';
      if(/^## /.test(line))return '<h3>'+safe.slice(3)+'</h3>';
      if(/^# /.test(line))return '<h2>'+safe.slice(2)+'</h2>';
      if(/^[-*] /.test(line))return '<div class="pc-preview-item">• '+safe.slice(2)+'</div>';
      if(/^\d+\. /.test(line))return '<div class="pc-preview-item">'+safe+'</div>';
      return safe?'<p>'+safe+'</p>':'<div style="height:8px"></div>';
    }).join('');
  }
  function pcRefreshRichPreviews(root=document){
    root.querySelectorAll('.pc-rich-field').forEach(w=>{const src=w.querySelector('[data-pc-field="text"]'),target=w.querySelector('[data-pc-preview]');if(src&&target)target.innerHTML=pcRichPreview(src.value);});
    root.querySelectorAll('.pc-block').forEach(w=>{const src=w.querySelector('[data-pc-field="text"]'),target=w.querySelector('[data-pc-code-preview]');if(src&&target)target.textContent=src.value;});
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-pc-format]');if(!button)return;event.preventDefault();const box=button.closest('.pc-rich-field');pcInsertFormat(box?.querySelector('[data-pc-field="text"]'),button.dataset.pcFormat);});
  document.addEventListener('input',event=>{if(!event.target.matches('#pcEditor .pc-rich-field [data-pc-field="text"],#pcEditor .pc-block:has([data-pc-code-preview]) [data-pc-field="text"]'))return;pcRefreshRichPreviews(event.target.closest('.pc-block')||document);});
  function pcInsertFormat(textarea,mode){
    if(!textarea)return;const start=textarea.selectionStart,end=textarea.selectionEnd,selected=textarea.value.slice(start,end);
    const map={heading:['## ',''],bold:['**','**'],italic:['*','*'],list:['- ',''],number:['1. ',''],link:['[','](https://example.com)'],inlinecode:['`','`'],code:['```javascript\n','\n```']};
    const [before,after]=map[mode]||['',''];const value=before+(selected||(mode==='heading'?'Heading':mode==='code'?'// Paste your code here':'text'))+after;
    textarea.setRangeText(value,start,end,'select');textarea.focus();textarea.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function pcCapture(){
    const main=document.getElementById('pcEditor');if(!main)return;
    // A module heading is a property of every child section. Capture it once
    // per visible group, never just on the selected lesson.
    main.querySelectorAll('[data-pc-module-title]').forEach(input=>{
      const start=Number(input.dataset.moduleStart),end=Number(input.dataset.moduleEnd);
      const original=pcSections[start] ? pcModuleName(pcSections[start]) : 'Module';
      const title=input.value.trim().slice(0,190)||original;
      for(let i=start;i<=end;i++)if(pcSections[i])pcSections[i].module=title;
    });
    main.querySelectorAll('.pc-lesson-surface[data-pc-section]').forEach(section=>{
      const si=Number(section.dataset.pcSection),target=pcSections[si];if(!target)return;
      target.title=section.querySelector('[data-pc-section-title]')?.value||'';
      target.description=section.querySelector('[data-pc-lesson-description]')?.value||'';
      section.querySelectorAll('[data-pc-block]').forEach(row=>{
        const bi=Number(row.dataset.pcBlock),block=target.blocks[bi];if(!block)return;
        row.querySelectorAll('[data-pc-field]').forEach(field=>{
          const key=field.dataset.pcField;
          if(key==='required')block.required=field.checked;
          else if(key==='choices')block.choices=field.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,8);
          else if(key==='images')block.images=field.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,16);
          else if(key==='correct')block.correct=Math.max(0,(Number(field.value)||1)-1);
          else block[key]=field.value;
        });
        if((block.type||'')==='quiz'){
          const questions=[];
          row.querySelectorAll('[data-pc-quiz-question]').forEach((questionRow,index)=>{
            const prompt=(questionRow.querySelector('[data-pc-quiz-field="prompt"]')?.value||'').trim();
            const choices=(questionRow.querySelector('[data-pc-quiz-field="choices"]')?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,8);
            const correct=Math.max(0,(Number(questionRow.querySelector('[data-pc-quiz-field="correct"]')?.value)||1)-1);
            questions.push({id:physicalSafeId(questionRow.dataset.questionId||pcId()),prompt,choices:choices.length?choices:['Option A','Option B'],correct:Math.max(0,Math.min((choices.length?choices.length:2)-1,correct))});
          });
          if(!questions.length)questions.push({id:pcId(),prompt:'',choices:['Option A','Option B'],correct:0});
          block.questions=questions;
          block.text=questions[0]?.prompt||block.text||'';
          block.choices=questions[0]?.choices||block.choices||['Option A','Option B'];
          block.correct=questions[0]?.correct||0;
        }
      });
    });
  }
  function pcMarkDirty(){pcDirty=true;const status=document.getElementById('pcSaveState');if(status)status.textContent='Unsaved changes';}
  function pcLessonKind(section){return ['lesson','quiz','assignment'].includes(section?.kind)?section.kind:'lesson';}
  function pcModuleName(section){return String(section?.module||'Course introduction').trim()||'Course introduction';}
  function pcGroups(){
    const groups=[];
    pcSections.forEach((section,i)=>{
      const name=pcModuleName(section);
      if(!groups.length||groups[groups.length-1].name!==name)groups.push({name,start:i,end:i});
      else groups[groups.length-1].end=i;
    });
    return groups;
  }
  function pcGroupAt(sectionIndex){return pcGroups().find(group=>group.start<=sectionIndex&&group.end>=sectionIndex);}
  function pcNextModuleName(){
    const used=new Set(pcGroups().map(g=>g.name.toLowerCase()));
    let n=pcGroups().length+1;while(used.has(`module ${String(n).padStart(2,'0')}`))n++;
    return `Module ${String(n).padStart(2,'0')}`;
  }
  function pcNewLesson(kind='lesson',module='Module 01'){
    kind=['lesson','quiz','assignment'].includes(kind)?kind:'lesson';
    const count=pcSections.filter(s=>pcModuleName(s)===module&&pcLessonKind(s)===kind).length+1;
    const title=`${kind==='lesson'?'Lesson':kind==='quiz'?'Quiz':'Assignment'} ${String(count).padStart(2,'0')}`;
    const blocks=kind==='quiz'?[{...pcNewBlock('quiz'),title:'Knowledge check',text:''}]:kind==='assignment'?[{...pcNewBlock('assignment'),title:'Practice assignment',text:''}]:[];
    return {id:pcId(),title,module,kind,description:'',blocks};
  }
  function pcToc(){
    const groups=pcGroups();
    const cards=groups.map((group,gi)=>{
      const itemRows=pcSections.slice(group.start,group.end+1).map((section,offset)=>{
        const i=group.start+offset,kind=pcLessonKind(section);
        const short=kind==='quiz'?'?':kind==='assignment'?'✓':String(pcSections.slice(group.start,i+1).filter(s=>pcLessonKind(s)==='lesson').length).padStart(2,'0');
        return `<div class="pc-outline-line ${i===pcActiveLesson?'selected':''}" draggable="true" data-pc-outline-lesson="${i}" data-pc-outline-row="${i}" title="Drag to reorder lessons">
          <button type="button" class="pc-outline-lesson" data-action="pc-select-lesson" data-section="${i}" aria-current="${i===pcActiveLesson?'step':'false'}"><span class="pc-outline-kind">${short}</span><span><strong>${esc(section.title||`Untitled ${kind}`)}</strong><small>${kind[0].toUpperCase()+kind.slice(1)} · ${(section.blocks||[]).length} widgets</small></span></button>
          <div class="pc-outline-order"><button type="button" data-action="pc-move-section" data-section="${i}" data-direction="-1" title="Move up in this module" aria-label="Move ${esc(section.title)} up">↑</button><button type="button" data-action="pc-move-section" data-section="${i}" data-direction="1" title="Move down in this module" aria-label="Move ${esc(section.title)} down">↓</button></div>
        </div>`;
      }).join('');
      return `<section class="pc-module-card" data-pc-outline-module="${group.start}"><header class="pc-module-head"><span class="pc-module-index">${String(gi+1).padStart(2,'0')}</span><label class="pc-module-name">Module title<input data-pc-module-title data-module-start="${group.start}" data-module-end="${group.end}" maxlength="190" value="${esc(group.name)}" aria-label="Module ${gi+1} title"></label><div class="pc-module-controls"><button type="button" data-action="pc-move-module" data-module-start="${group.start}" data-direction="-1" ${gi===0?'disabled':''} title="Move module up">↑</button><button type="button" data-action="pc-move-module" data-module-start="${group.start}" data-direction="1" ${gi===groups.length-1?'disabled':''} title="Move module down">↓</button><button type="button" data-action="pc-remove-module" data-module-start="${group.start}" class="pc-danger" title="Delete module and its content">×</button></div></header>
        <div class="pc-module-lessons" data-pc-outline-drop="${group.start}">${itemRows}</div>
        <div class="pc-module-add-actions"><button type="button" data-action="pc-add-lesson" data-kind="lesson" data-module-start="${group.start}">+ Lesson</button><button type="button" data-action="pc-add-lesson" data-kind="quiz" data-module-start="${group.start}">+ Quiz</button><button type="button" data-action="pc-add-lesson" data-kind="assignment" data-module-start="${group.start}">+ Assignment</button></div>
      </section>`;
    }).join('');
    const label=`+ Add ${pcNextModuleName()}`;
    return `<div class="pc-toc-title"><span>COURSE STRUCTURE</span><h3>Modules & activities</h3><small>${groups.length} modules · ${pcSections.length} items</small></div><nav aria-label="Modules, lessons, quizzes and assignments" class="pc-builder-toc-links">${cards||'<p class="pc-module-blank">Your course is empty. Add a module to automatically create Lesson 01.</p>'}</nav><div class="pc-structure-add"><button type="button" class="pc-add-module-primary" data-action="pc-add-module">${label}</button><small>Each module starts with Lesson 01. Add unlimited lessons, quizzes and assignments inside it.</small></div>`;
  }
  function pcRenderEditor(){
    if(!pcCourse)return;
    pcActiveLesson=Math.min(Math.max(pcActiveLesson,0),Math.max(0,pcSections.length-1));
    const si=pcActiveLesson,section=pcSections[si];
    const type=pcLessonKind(section),module=section?pcModuleName(section):'';
    const paletteGroups=[['Basic content',['banner','heading','paragraph','callout','divider']],['Media & resources',['image','gallery','download']],['Assessments',['quiz','assignment']]];
    const palette=paletteGroups.map(([label,types])=>`<div class="pc-palette-group"><h4>${label}</h4><div class="pc-palette-list">${types.map(t=>`<button type="button" draggable="true" class="pc-widget-palette-item" data-pc-palette="${t}" data-action="pc-palette-add" ${!section?'disabled':''} aria-label="Add ${esc(PC_TYPES[t])} widget"><span>${PC_ICONS[t]}</span><b>${esc(PC_TYPES[t])}</b><small>+</small></button>`).join('')}</div></div>`).join('');
    const editorBody=!section?`<div class="pc-empty-canvas"><span class="pc-empty-icon">▤</span><span class="pc-overline">START YOUR PRIVATE COURSE</span><h2>Add your first module</h2><p>Click Add Module. Module 01 will be created with Lesson 01 ready for the drag-and-drop content editor.</p><button type="button" class="primary-button" data-action="pc-add-module">+ Add Module 01</button></div>`:`
      <div class="pc-canvas-heading"><div class="pc-editor-breadcrumb">PHYSICAL COURSES / ${esc(module)} / ${esc(section.title)}</div><div class="pc-canvas-top"><div><span class="pc-overline">${esc(module.toUpperCase())} · ITEM ${si+1} OF ${pcSections.length}</span><h2>${esc(section.title||'Untitled item')}</h2><p>Edit the title, then drag content widgets below. Add more lessons, quizzes, or assignments from the module on the left.</p></div><span class="pc-lesson-kind-pill pc-lesson-${type}">${type==='quiz'?'?':type==='assignment'?'✓':'▤'} ${type[0].toUpperCase()+type.slice(1)}</span></div></div>
      <section class="pc-section pc-lesson-surface" data-pc-section="${si}" data-pc-section-id="${esc(section.id)}" id="pc-builder-section-${si}"><header class="pc-section-top pc-lesson-settings"><div class="pc-lesson-form"><label class="pc-section-name">${type==='lesson'?'Lesson':type==='quiz'?'Quiz':'Assignment'} title<input data-pc-section-title maxlength="190" value="${esc(section.title)}" placeholder="e.g. Introduction to data analysis"></label><div class="pc-lesson-module-reference"><small>Inside module</small><strong>${esc(module)}</strong><span>Change this module title on the left.</span></div><label class="pc-section-name pc-lesson-description">Short introduction (optional)<textarea data-pc-lesson-description rows="2" placeholder="Briefly introduce this ${type} to learners.">${esc(section.description||'')}</textarea></label></div><div class="pc-lesson-operations"><button type="button" data-action="pc-duplicate-lesson" data-section="${si}">Duplicate ${type}</button><button type="button" class="pc-danger" data-action="pc-remove-section" data-section="${si}">Delete ${type}</button></div></header>
      <div class="pc-section-body" data-pc-dropzone="${si}"><div class="pc-canvas-content-title"><strong>${type==='lesson'?'Lesson':type==='quiz'?'Quiz':'Assignment'} content</strong><small>${(section.blocks||[]).length} widgets · Drag ⋮⋮ to rearrange</small></div>${(section.blocks||[]).map((block,bi)=>pcBlockEditor(block,si,bi)).join('')}
      <div class="pc-drop-hint pc-drop-zone">＋ Drop a widget here, or click a widget on the left</div><div class="pc-add-widget"><select data-pc-new-type aria-label="Choose widget">${pcOptions('paragraph')}</select><button type="button" class="secondary-button" data-action="pc-add-block" data-section="${si}">+ Insert widget</button></div></div></section>
      <div class="pc-editor-footer"><button type="button" class="secondary-button" data-action="pc-select-lesson" data-section="${si-1}" ${si===0?'disabled':''}>← Previous</button><span>${si+1} / ${pcSections.length}</span><button type="button" class="secondary-button" data-action="pc-select-lesson" data-section="${si+1}" ${si===pcSections.length-1?'disabled':''}>Next →</button><button type="button" class="primary-button" data-action="pc-save">Save</button></div>`;
    content.innerHTML=`${pageHead('Physical Course · Lesson Builder',`${esc(pcCourse.title)} · Admin editor · Your existing website theme`)}
      <div id="pcEditor" class="pc-editor pc-editor-v130 pc-editor-v132"><div class="pc-editor-toolbar"><div><button type="button" class="secondary-button" data-action="pc-back">← Physical courses</button><button type="button" class="secondary-button" data-action="cm-view-private" data-id="${pcCourse.id}" data-mode="offline">Preview saved page ↗</button><span id="pcSaveState" class="pc-save-state" role="status">${pcDirty?'Unsaved changes':'Saved version loaded'}</span></div><button type="button" class="primary-button" data-action="pc-save" ${!section?'disabled':''}>Save course content</button></div>
      <div class="pc-builder-layout"><aside class="pc-builder-sidebar" aria-label="Widget picker and module structure">
      <div class="pc-builder-widgets"><div class="pc-picker-head"><span class="pc-overline">PAGE BUILDER</span><h3>Elements</h3><p>Click or drag a widget into the selected lesson, quiz or assignment.</p></div><label class="pc-picker-search">⌕ <input type="search" id="pcWidgetSearch" placeholder="Find a widget…" aria-label="Search widgets"></label><div class="pc-widget-palette">${palette}</div></div>
      <div class="pc-builder-toc">${pcToc()}</div></aside>
      <main class="pc-builder-canvas" aria-label="Selected lesson editor">${editorBody}</main></div></div>`;
    pcRefreshRichPreviews(content);
  }
  async function pcOpenEditor(id){
    loading();try{
      const res=await api('admin_physical_page',{query:{course_id:id}});
      pcCourse=res.course;pcSections=Array.isArray(res.sections)?res.sections:[];
      pcDirty=false;pcOpenBlock=null;pcActiveLesson=0;pcRenderEditor();
    }catch(e){toast(e.message,'error');await renderAllCourses();}
  }
  // One category = one manager. Existing multi-delivery courses appear in each enabled category.
  const categoryForMode = mode => mode==='recorded'?'recordedCourses':mode==='live'?'liveCourses':'physicalCourses';
  const courseModes = course => {const modes=Array.isArray(course?.deliveryModes)?course.deliveryModes:(Array.isArray(course?.delivery_modes)?course.delivery_modes:[]);return modes.includes('disabled')?[]:modes.filter(mode=>COURSE_MODES.includes(mode)).length?modes.filter(mode=>COURSE_MODES.includes(mode)):[course.deliveryMode||'offline'];};
  // Single admin control center for enabling or deactivating delivery types.
  // Deactivated formats retain their course content and historical enrollments.
  async function renderCourseTypes(){
    const response=await api('admin_courses');
    const rows=response.courses||[];
    state.courses=rows;
    const counts=Object.fromEntries(COURSE_MODES.map(mode=>[mode,rows.filter(course=>courseModes(course).includes(mode)).length]));
    const totals={all:rows.length,deactivated:rows.filter(c=>courseModes(c).length===0).length};
    const names={offline:'Physical',recorded:'Recorded',live:'Live'};
    const rowMarkup=course=>{
      const enabled=courseModes(course);const inactive=enabled.length===0;
      return `<tr data-types-row="${course.id}" data-types-search="${esc([course.title,course.slug,course.category].join(' ').toLowerCase())}">
        <td><div class="ct-course"><span class="ct-course-avatar">${initials(course.title)}</span><div><strong>${esc(course.title)}</strong><small>${esc(course.slug)}</small></div></div></td>
        ${['offline','recorded','live'].map(mode=>`<td data-label="${names[mode]}"><label class="ct-toggle" title="${enabled.includes(mode)?'Deactivate':'Activate'} ${names[mode]} — saved content is preserved"><input type="checkbox" data-course-type-toggle data-id="${course.id}" data-mode="${mode}" ${enabled.includes(mode)?'checked':''}><span class="ct-switch" aria-hidden="true"></span><span class="ct-toggle-word">${enabled.includes(mode)?'Active':'Off'}</span></label></td>`).join('')}
        <td><span class="ct-status ${inactive?'ct-is-off':'ct-is-on'}">${inactive?'Deactivated':`${enabled.length} active`}</span></td>
      </tr>`;
    };
    content.innerHTML=`${pageHead('Course Types','Choose exactly which formats each course offers. Unchecking a format deactivates it — it does not delete the course, its pages, lessons, or existing student access.')}
      <section class="ct-panel"><header class="ct-panel-head"><div><div class="cm-manager-eyebrow">DELIVERY AVAILABILITY</div><h2>Course type settings</h2><p>Changes are saved individually. Turn formats back on at any time.</p></div><label class="ct-search">⌕ <input type="search" id="ctCourseSearch" placeholder="Search courses…" autocomplete="off" aria-label="Search course types"></label></header>
      <div class="ct-stats"><div><strong>${rows.length}</strong><span>Total courses</span></div><div><strong>${counts.offline}</strong><span>Physical active</span></div><div><strong>${counts.recorded}</strong><span>Recorded active</span></div><div><strong>${counts.live}</strong><span>Live active</span></div><div><strong>${totals.deactivated}</strong><span>Fully deactivated</span></div></div>
      <div class="ct-note"><strong>Data-safe controls</strong> — unchecking removes an offering from its course list and new purchases. It never deletes lessons, assignments, quizzes, public-page content, payment history, or existing student enrollments.</div>
      <div class="ct-table-scroll"><table class="ct-table"><thead><tr><th>Course</th><th>Physical</th><th>Recorded</th><th>Live</th><th>Status</th></tr></thead><tbody>${rows.map(rowMarkup).join('')}</tbody></table><p class="ct-empty" id="ctSearchEmpty" hidden>No courses match your search.</p></div>
      <div class="ct-footnote"><span>✓ Checked = active and listed</span><span>○ Unchecked = deactivated, data retained</span></div></section>`;
    const search=document.getElementById('ctCourseSearch');
    search?.addEventListener('input',()=>{
      const text=search.value.trim().toLowerCase();let visible=0;
      content.querySelectorAll('[data-types-row]').forEach(row=>{const ok=!text||text.split(/\s+/).every(word=>row.dataset.typesSearch.includes(word));row.hidden=!ok;if(ok)visible++;});
      const empty=document.getElementById('ctSearchEmpty');if(empty)empty.hidden=visible>0;
    });
  }
  // One entry per course. Format toggles and per-format content remain in the existing editor.
  async function renderAllCourses(){
    pcCourse=null;
    const central=isCentralRole(),instructor=normalizedRole()==='instructor';
    const calls=[api('admin_courses')];
    if(central||isBranchRole())calls.push(api('admin_branches'),api('admin_instructors'));
    const result=await Promise.all(calls);
    state.courses=result[0].courses||[];
    if(central||isBranchRole()){state.branches=result[1].branches||[];state.instructors=result[2].instructors||[];}
    if(instructor){state.branches=[{shortName:state.user.branch,name:state.user.branch}];state.instructors=[{id:state.user.id,name:state.user.name,branch:state.user.branch}];}
    if(editorPageMode && !editorPageOpened){
      editorPageOpened=true;
      // All authorized course creators use the identical editor and backend validation.
      const course=requestedEditorId ? state.courses.find(c=>Number(c.id)===requestedEditorId) : null;
      if(requestedEditorId && !course){toast('Course not found or access denied.','error');return;}
      openCourseModal(course,requestedEditorMode);
    }
    const rows=state.courses.slice().sort((a,b)=>{
      const aDate=Date.parse(a.createdAt||a.created_at||'')||0;
      const bDate=Date.parse(b.createdAt||b.created_at||'')||0;
      return bDate-aDate || Number(b.id||0)-Number(a.id||0);
    });
    const formatTabs=course=>{
      const enabled=courseModes(course);
      return `<div class="fsa-all-format-links" role="group" aria-label="${esc(course.title)} available formats">${COURSE_MODES.map(mode=>{
        const on=enabled.includes(mode),label=mode==='offline'?'Physical':mode==='live'?'Live':'Recorded';
        if(!on)return `<span class="fsa-all-format-off" title="${label} inactive">${label} · Off</span>`;
        return `<span class="fsa-all-format-active">✓ ${label}</span>`;
      }).join('')}</div>`;
    };
    const cards=rows.map(course=>{
      const id=Number(course.id),modes=courseModes(course),name=esc(course.title),slug=encodeURIComponent(course.slug||'');
      // One public editor per course; delivery formats are tabs INSIDE that editor.
      // Private editing remains a separate workflow using the original page builder.
      const canEdit=central||isBranchRole()||(instructor&&course.publicApprovalStatus!=='approved'&&Number(course.instructorUserId)===Number(state.user.id));
      const publicActions=canEdit?`<button type="button" class="secondary-button" data-action="cm-edit-public" data-id="${id}" data-mode="${modes[0]||'offline'}">Edit public page ✎</button>`:'';
      const publicViews=course.visibility==='private'?'<span class="status-pill status-pending">Private — not publicly listed</span>':modes.map(mode=>{
        const label=mode==='offline'?'Physical':mode==='live'?'Live':'Recorded';
        return `<a class="cm-mini-action" href="../#/course/${slug}?mode=${mode==='offline'?'classroom':mode}" target="_blank" rel="noopener" aria-label="View ${label} public page for ${name}">${label} ↗</a>`;
      }).join('');
      const privateViews=modes.map(mode=>{
        const label=mode==='offline'?'Physical':mode==='live'?'Live':'Recorded';
        return `<button type="button" class="cm-mini-action" data-action="cm-view-private" data-id="${id}" data-mode="${mode}" aria-label="Preview ${label} private page for ${name}">${label} preview ↗</button>`;
      }).join('');
      const privateEdit=(central||isBranchRole()) && modes.includes('offline')?`<button type="button" class="secondary-button" data-action="pc-edit" data-id="${id}">Edit Physical private page ✎</button>`:'';
      const instructorHint=modes.some(m=>m==='live'||m==='recorded')?`<small class="fsa-private-hint">Live / Recorded private lessons are edited by their assigned instructor.</small>`:'';
      const actions=`<div class="fsa-course-actions-unified"><div class="fsa-course-action-group"><strong>Public page</strong><div class="fsa-action-wrap">${publicActions}${publicViews}</div></div><div class="fsa-course-action-group"><strong>Private page</strong><div class="fsa-action-wrap">${privateEdit}${privateViews||'<small>No active formats</small>'}</div>${instructorHint}</div></div>`;
      const manage='';
      const approvalTag=course.publicApprovalStatus==='pending'?'<span class="status-pill status-pending">Awaiting approval</span>':course.publicApprovalStatus==='rejected'?'<span class="status-pill status-rejected">Rejected — edit & resubmit</span>':'';
      return `<article class="fsa-all-course-row" data-all-course-search="${esc([course.title,course.slug,course.category,course.branchName,course.status].join(' ').toLowerCase())}">
        <div class="fsa-all-course-main"><span class="cm-course-avatar">${initials(course.title)}</span><div><h3>${name}</h3><small>${esc(course.slug||'')} · ${esc(course.status||'draft')} · ${esc(course.visibility||'public')}</small>${approvalTag}${formatTabs(course)}</div></div>
        <div class="fsa-all-course-actions">${actions||'<span class="fsa-all-inactive">All formats inactive — not available on public catalogue.</span>'}</div>
        <div class="fsa-all-course-manage">${manage}</div>
      </article>`;
    }).join('');
    const add=`<button class="primary-button" data-action="cm-add-course" data-mode="offline">+ Add Course</button>`;
    content.innerHTML=`${pageHead('All Courses','Edit the public course page with Physical, Live and Recorded tabs. Edit the Physical private page using its original page builder; instructor-managed private lessons remain separate.',add)}
      <div class="panel fsa-all-courses-panel"><div class="panel-head"><div><h2>Course directory <span class="cm-total-pill">${rows.length}</span></h2><p>One course record · public format tabs · private page tools</p></div><label class="cm-search-box"><span aria-hidden="true">⌕</span><input id="fsaAllCourseSearch" type="search" placeholder="Search courses" aria-label="Search all courses"></label></div>
      <div id="fsaAllCoursesList">${cards||emptyState('No courses yet','Add your first course to get started.')}</div><p id="fsaAllCourseEmpty" class="cm-no-matches" hidden>No matching courses.</p></div>`;
    const input=document.getElementById('fsaAllCourseSearch');
    input?.addEventListener('input',()=>{
      const q=input.value.trim().toLowerCase();let found=0;
      content.querySelectorAll('[data-all-course-search]').forEach(row=>{
        const hit=!q||q.split(/\s+/).every(term=>row.dataset.allCourseSearch.includes(term));row.hidden=!hit;if(hit)found++;
      });
      const empty=document.getElementById('fsaAllCourseEmpty');if(empty)empty.hidden=found>0;
    });
  }

  async function renderPhysicalCourses(){await renderModeCourses('offline');}
  async function renderModeCourses(mode){
    if(!COURSE_MODES.includes(mode))mode='offline';
    pcCourse=null;
    const central=isCentralRole(),instructor=normalizedRole()==='instructor';
    const requests=[api('admin_courses')];
    if(central){requests.push(api('admin_branches'),api('admin_instructors'));}
    if(mode==='offline')requests.push(api('admin_physical_courses'));
    const result=await Promise.all(requests);
    state.courses=result[0].courses||[];
    if(central){state.branches=result[1].branches||[];state.instructors=result[2].instructors||[];}
    const pages=mode==='offline'?result[result.length-1].courses||[]:[];
    const pageMap=new Map(pages.map(p=>[Number(p.id),p]));
    const rows=state.courses.filter(course=>courseModes(course).includes(mode));
    const name=mode==='offline'?'Physical Courses':mode==='recorded'?'Recorded Courses':'Live Courses';
    const privateInfo=mode==='offline'?'Physical private learning pages are available to authorized academy and branch staff.':'Private lessons are instructor-managed. Admin access is view-only.';
    const canEditPhysical=!instructor;
    const actions=rows.map(course=>{
      const id=Number(course.id),sameType=courseModes(course).length===1;
      const courseTitle=esc(course.title),courseSlug=esc(course.slug);
      const courseStatus=String(course.status||'draft');
      const isReady=Boolean(pageMap.get(id)?.has_page);
      const viewPublic=course.visibility==='private'?'<span class="status-pill status-pending">Private</span>':`<a class="cm-mini-action cm-action-view" href="../#/course/${encodeURIComponent(course.slug)}?mode=${mode==='offline'?'classroom':mode}" target="_blank" rel="noopener" aria-label="View public page of ${courseTitle}">View <span aria-hidden="true">↗</span></a>`;
      const canEditPublic=central||isBranchRole()||(instructor&&course.publicApprovalStatus!=='approved'&&Number(course.instructorUserId)===Number(state.user.id));
      const editPublic=canEditPublic?`<button type="button" class="cm-mini-action cm-action-edit" data-action="cm-edit-public" data-id="${id}" data-mode="${mode}" aria-label="Edit public page of ${courseTitle}">Edit <span aria-hidden="true">✎</span></button>`:'';
      const publicButtons=`<div class="cm-action-pair">${viewPublic}${editPublic}</div>`;
      const privateButtons=mode==='offline'
        ? `<div class="cm-private-status ${isReady?'cm-private-ready':'cm-private-empty'}"><span class="cm-status-dot" aria-hidden="true"></span>${isReady?'Page created':'Not created'}</div><div class="cm-action-pair"><button type="button" class="cm-mini-action cm-action-view" data-action="cm-view-private" data-id="${id}" data-mode="offline" aria-label="Preview private page of ${courseTitle}">Preview <span aria-hidden="true">↗</span></button>${canEditPhysical?`<button type="button" class="cm-mini-action cm-action-primary" data-action="pc-edit" data-id="${id}" aria-label="Edit private page data of ${courseTitle}">${isReady?'Edit content':'Build page'} <span aria-hidden="true">✎</span></button>`:''}</div>`
        : `<div class="cm-private-status cm-private-instructor"><span class="cm-status-dot" aria-hidden="true"></span>Instructor managed</div><div class="cm-action-pair"><button type="button" class="cm-mini-action cm-action-view" data-action="cm-view-private" data-id="${id}" data-mode="${mode}" aria-label="Preview private page of ${courseTitle}">Preview <span aria-hidden="true">↗</span></button>${instructor?`<a class="cm-mini-action cm-action-primary" href="../#/instructor-course-manage/${id}" target="_blank" rel="noopener">Instructor editor <span aria-hidden="true">↗</span></a>`:''}</div>`;
      const availability=central?`<div class="fsa-row-format-status" aria-label="Course delivery availability">${COURSE_MODES.map(m=>`<span class="fsa-row-format-pill ${courseModes(course).includes(m)?'on':'off'}" title="${COURSE_MODE_LABELS[m]}: ${courseModes(course).includes(m)?'Enabled':'Disabled'}">${courseModes(course).includes(m)?'✓':'○'} ${m==='offline'?'Physical':m==='recorded'?'Recorded':'Live'}</span>`).join('')}</div>`:'';
      const formatDisable=central?`<div class="fsa-row-availability-action"><button type="button" data-action="fsa-open-types" title="Manage all delivery formats in Course Types">Manage types ↗</button></div>`:'';
      const footer=central&&sameType?`<button type="button" class="cm-delete-link" data-action="cm-delete" data-id="${id}" data-mode="${mode}" title="Delete this entire course and its enrollments">Delete course</button>`:'';
      const courseSearch=esc([course.title,course.slug,course.branchName,course.instructor,course.status].join(' ').toLowerCase());
      return `<tr data-cm-search="${courseSearch}">
        <td data-label="Course"><div class="cm-course-info"><span class="cm-course-avatar" aria-hidden="true">${initials(course.title)}</span><div class="cm-course-copy"><div class="cm-course-title">${courseTitle}</div><div class="cm-course-meta"><span class="cm-course-slug">${courseSlug}</span><span class="${statusClass(courseStatus)}">${esc(courseStatus)}</span>${!sameType?'<span class="cm-shared-tag">Multi-format</span>':''}</div>${availability}</div></div></td>
        <td data-label="Public page"><div class="cm-page-cell"><div class="cm-cell-hint">Public listing</div>${publicButtons}</div></td>
        <td data-label="Private page"><div class="cm-page-cell">${privateButtons}</div></td>
        <td data-label="Assigned to"><div class="cm-assignment"><strong>${esc(course.branchName||'Not assigned')}</strong><span>${esc(course.instructor||'No instructor assigned')}</span>${formatDisable}${footer}</div></td>
      </tr>`;
    });
    const add=`<button class="primary-button" data-action="cm-add-course" data-mode="${mode}">+ Add ${mode==='offline'?'Physical':mode==='recorded'?'Recorded':'Live'} Course</button>`;
    const intro=mode==='offline'?'Only courses with Physical enabled appear here. Admin manages public and private pages.':'Only courses with this format enabled appear here. Admin edits public content and previews instructor-managed lessons.';
    const candidates=(central||isBranchRole())?state.courses.filter(course=>!courseModes(course).includes(mode)):[];
    const formatName=mode==='offline'?'Physical':mode==='recorded'?'Recorded':'Live';
    const attachExisting=candidates.length?`<div class="cm-add-format"><div><strong>Already offer this subject in another format?</strong><span>Add a ${formatName} option to an existing course without duplicating its record or enrollments.</span></div><label class="cm-add-format-select"><span>Existing course</span><select id="cmExistingCourseForMode" aria-label="Choose a course to offer as ${formatName}">${candidates.map(course=>`<option value="${Number(course.id)}">${esc(course.title)}</option>`).join('')}</select></label><button type="button" class="secondary-button" data-action="cm-attach-mode" data-mode="${mode}">+ Offer as ${formatName}</button></div>`:'';
    content.innerHTML=`${pageHead(name,privateInfo,add)}
      ${attachExisting}
      <div class="panel pc-course-list cm-course-manager">
        <div class="panel-head cm-manager-heading">
          <div class="cm-manager-copy"><div class="cm-manager-eyebrow">COURSE DIRECTORY</div><h2>${esc(name)} <span class="cm-total-pill">${rows.length}</span></h2><p>${esc(intro)}</p></div>
          ${rows.length?`<div class="cm-search-group"><label class="cm-search-box"><span aria-hidden="true" class="cm-search-icon">⌕</span><input id="cmCourseSearch" type="search" placeholder="Search by course, branch or instructor" aria-label="Search ${esc(name)}" autocomplete="off"></label><span class="cm-result-count" id="cmCourseResultCount" aria-live="polite">Showing ${rows.length} of ${rows.length}</span></div>`:''}
        </div>
        ${rows.length?`<div class="table-wrap cm-course-table-wrap"><table class="data-table cm-mode-table"><colgroup><col class="cm-col-course"><col class="cm-col-public"><col class="cm-col-private"><col class="cm-col-assignment"></colgroup><thead><tr><th scope="col">Course</th><th scope="col">Public page</th><th scope="col">Private page</th><th scope="col">Assigned to</th></tr></thead><tbody>${actions.join('')}</tbody></table></div><div id="cmCourseNoMatches" class="cm-no-matches" hidden>No matching courses. Try a different search.</div>`:emptyState('No '+name.toLowerCase()+' yet',central?'Use Add Course above to create the first '+name.toLowerCase()+' record.':'A course will appear here after assignment to your account.')}
      </div>`;
    const searchInput=document.getElementById('cmCourseSearch');
    if(searchInput){
      searchInput.addEventListener('input',()=>{
        const query=searchInput.value.trim().toLowerCase().replace(/\s+/g,' ');
        let visible=0;
        content.querySelectorAll('.cm-mode-table tbody tr').forEach(row=>{
          const matches=!query||query.split(' ').every(word=>(row.dataset.cmSearch||'').includes(word));
          row.hidden=!matches;if(matches)visible++;
        });
        const resultCount=document.getElementById('cmCourseResultCount');
        if(resultCount)resultCount.textContent=`Showing ${visible} of ${rows.length}`;
        const empty=document.getElementById('cmCourseNoMatches');if(empty)empty.hidden=visible!==0;
      });
    }
  }
  function cmParagraph(value){return `<p class="cm-text">${esc(value||'').replace(/\n/g,'<br>')}</p>`;}
  function cmUrl(value){const url=String(value||'').trim();return /^https?:\/\//i.test(url)?url:/^(?:uploads|assets)\/[\w.\-/%]+$/i.test(url)?`../${url}`:'';}
  function cmBlock(block){
    const title=block.title?`<h3>${esc(block.title)}</h3>`:'';
    const url=cmUrl(block.url),type=block.type||'paragraph';
    if(type==='divider')return '<hr>';
    if(type==='banner')return `<header class="cm-hero-banner">${url?`<img src="${esc(url)}" alt="" loading="lazy">`:''}<div class="cm-hero-copy"><span>PHYSICAL COURSE</span><h2>${esc(block.title||'Welcome to this course')}</h2>${cmParagraph(block.text||'')}</div></header>`;
    if(type==='heading')return `<div class="cm-preview-block"><h2>${esc(block.title||'Heading')}</h2></div>`;
    if(type==='image')return `<div class="cm-preview-block">${title}${url?`<img class="cm-preview-image" src="${esc(url)}" alt="${esc(block.title||'Course image')}" loading="lazy">`:'<p>Image not set.</p>'}</div>`;
    if(type==='gallery')return `<div class="cm-preview-block">${title}<div class="cm-preview-gallery">${(block.images||[]).map(v=>cmUrl(v)).filter(Boolean).map(v=>`<img src="${esc(v)}" loading="lazy" alt="Gallery image">`).join('')}</div></div>`;
    if(type==='download')return `<div class="cm-preview-block">${title}${cmParagraph(block.text||'')}${url?`<a target="_blank" rel="noopener noreferrer" href="${esc(url)}">${esc(block.linkTitle||'Open learning resource ↗')}</a>`:'<p>No file attached.</p>'}</div>`;
    if(type==='quiz'){const questions=pcQuizQuestions(block);return `<div class="cm-preview-block cm-assessment cm-preview-quiz"><div class="cm-private-type">Quiz ${block.required?'· Required':''}</div>${title}<div class="cm-quiz-meta">${questions.length} question${questions.length===1?'':'s'}</div>${questions.map((question,qi)=>`<div class="cm-quiz-question"><strong>Question ${qi+1}</strong>${cmParagraph(question.prompt||'')}${(question.choices||[]).map((option,i)=>`<div class="cm-choice">${i+1}. ${esc(option)}</div>`).join('')}</div>`).join('')}<small>Read-only preview · Correct answers are not displayed</small></div>`;}
    if(type==='assignment')return `<div class="cm-preview-block cm-assessment"><div class="cm-private-type">Assignment ${block.required?'· Required':''}</div>${title}${cmParagraph(block.text)}<small>Submission is only available to enrolled students.</small></div>`;
    return `<div class="cm-preview-block ${type==='callout'?'cm-preview-callout':''}">${title}${cmParagraph(block.text)}</div>`;
  }
  function cmPreviewShell(course,mode,sections,readonly=true){
    const name=mode==='offline'?'Physical':'Recorded';
    const scope=mode==='live'?'Live':name;
    const groups=[];
    sections.forEach((section,index)=>{
      const module=pcModuleName(section);
      let current=groups[groups.length-1];
      if(!current||current.name!==module){current={name:module,items:[]};groups.push(current);}current.items.push({section,index});
    });
    const sectionNodes=sections.map((section,idx)=>{
      const blocks=section.blocks||[];
      return `<section id="cm-private-section-${idx}" class="cm-preview-section"><span class="eyebrow">${esc(pcModuleName(section))} · ${esc(pcLessonKind(section))} ${idx+1}</span><h2>${esc(section.title)}</h2>${section.description?cmParagraph(section.description):''}${blocks.map(cmBlock).join('')||'<p class="cm-text">No content has been added to this lesson yet.</p>'}</section>`;
    });
    const tocBody=groups.map((group,groupIndex)=>`<section class="cm-smart-module"><div class="cm-smart-module-head"><span class="cm-smart-module-index">${String(groupIndex+1).padStart(2,'0')}</span><div><strong>${esc(group.name)}</strong><small>${group.items.length} item${group.items.length===1?'':'s'}</small></div></div><div class="cm-smart-module-list">${group.items.map(({section,index},itemIndex)=>`<a href="#cm-private-section-${index}" class="cm-smart-link" data-action="cm-scroll-section" data-anchor="cm-private-section-${index}"><span class="cm-smart-link-index">${pcLessonKind(section)==='quiz'?'?':pcLessonKind(section)==='assignment'?'✓':String(itemIndex+1).padStart(2,'0')}</span><span class="cm-smart-link-copy"><strong>${esc(section.title)}</strong><small>${pcLessonKind(section)[0].toUpperCase()+pcLessonKind(section).slice(1)} · ${(section.blocks||[]).length} widget${(section.blocks||[]).length===1?'':'s'}</small></span></a>`).join('')}</div></section>`).join('');
    content.innerHTML=`${pageHead(course.title,`${scope} Course · Private page ${readonly?'(read-only preview)':''}`)}
      <div class="pc-editor-toolbar"><div><button class="secondary-button" data-action="cm-back" data-mode="${mode}">← ${scope} Courses</button><a class="secondary-button" href="../#/course/${encodeURIComponent(course.slug)}?mode=${mode==='offline'?'classroom':mode}" target="_blank" rel="noopener">View Public Page ↗</a></div>${mode==='offline'&&normalizedRole()!=='instructor'?`<button class="primary-button" data-action="pc-edit" data-id="${pcCourse?.id||course.id}">Edit Private Page Data</button>`:''}</div>
      <div class="pc-editor-guide">Admin preview: private content is displayed without student progress or submission controls. ${mode==='offline'?'Admin can edit this page.':'Only the assigned instructor can edit private lessons.'}</div>
      <div class="cm-preview-layout cm-preview-layout-smart"><main class="cm-preview-body">${sectionNodes.join('')||emptyState('No private content yet',mode==='offline'?'Use Edit Private Page Data to add content.':'The instructor has not published learning content.')}</main><aside class="cm-preview-toc cm-preview-toc-smart"><div class="cm-preview-toc-head"><span>COURSE CONTENTS</span><h3>${esc(course.title||'Course')}</h3><p>${sections.length} items · Classroom learning</p></div><div class="cm-preview-toc-scroll">${tocBody||'<p>No lessons yet</p>'}</div></aside></div>`;
    requestAnimationFrame(cmActivatePreviewToc);
  }
  function cmActivatePreviewToc(){
    const links=[...document.querySelectorAll('.cm-smart-link[data-anchor]')];
    if(!links.length)return;
    const setActive=id=>links.forEach(link=>link.classList.toggle('active',link.dataset.anchor===id));
    const sections=links.map(link=>document.getElementById(link.dataset.anchor)).filter(Boolean);
    const onScroll=()=>{
      let current=sections[0]?.id||'';
      sections.forEach(section=>{if(section.getBoundingClientRect().top<=180)current=section.id;});
      if(current)setActive(current);
    };
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
  }
  async function cmOpenPrivate(id,mode){
    loading();
    try{
      if(mode==='offline'){
        const result=await api('admin_physical_page',{query:{course_id:id}});
        cmPreviewShell(result.course,'offline',result.sections||[]);
      }else{
        const result=await api('admin_course_private_preview',{query:{course_id:id,mode}});
        const sections=[];
        const modules=result.modules||[];
        if(modules.length)sections.push({title:'Course curriculum',blocks:modules.flatMap(mod=>[
          {type:'heading',title:mod.title||'Module'},
          {type:'paragraph',title:'Module overview',text:mod.description||''},
          ...(mod.lessons||[]).map(l=>({type:'paragraph',title:l.title||'Lesson',text:[l.duration,l.content].filter(Boolean).join(' · ')}))
        ])});
        const lectures=result.lectures||[];
        if(mode==='recorded'&&lectures.length)sections.push({title:'Recorded lectures',blocks:lectures.map(l=>({type:cmUrl(l.video_url)?'download':'paragraph',title:l.title,text:[l.description,`${l.duration_minutes||0} minutes`,l.status].filter(Boolean).join(' · '),url:l.video_url,linkTitle:'Open instructor lecture video ↗'}))});
        const sessions=result.sessions||[];
        if(mode==='live'&&sessions.length)sections.push({title:'Live sessions',blocks:sessions.map(s=>({type:'paragraph',title:s.title,text:[s.description,s.starts_at,s.status].filter(Boolean).join(' · ')}))});
        const recordings=result.recordings||[];
        if(mode==='live'&&recordings.length)sections.push({title:'Class recordings',blocks:recordings.map(r=>({type:cmUrl(r.recording_url)?'download':'paragraph',title:r.title,text:[r.description,r.status].filter(Boolean).join(' · '),url:r.recording_url,linkTitle:'Open class recording ↗'}))});
        const quizzes=result.quizzes||[];
        if(quizzes.length)sections.push({title:'Quizzes',blocks:quizzes.map(q=>({type:'callout',title:q.title,text:[q.description,q.status].filter(Boolean).join(' · ')}))});
        const assignments=result.assignments||[];
        if(assignments.length)sections.push({title:'Assignments',blocks:assignments.map(a=>({type:'callout',title:a.title,text:[a.instructions,a.status].filter(Boolean).join(' · ')}))});
        cmPreviewShell(result.course,mode,sections);
      }
    }catch(error){toast(error.message,'error');await renderModeCourses(mode);}
  }

  function pcReorderBlock(fromSection,fromBlock,toSection,toBlock){
    const source=pcSections[fromSection]?.blocks||[],target=pcSections[toSection]?.blocks||[];
    if(!source[fromBlock]||!pcSections[toSection])return;
    if(fromSection===toSection && fromBlock<toBlock)toBlock--;
    const [block]=source.splice(fromBlock,1);
    target.splice(Math.min(Math.max(0,toBlock),target.length),0,block);
    pcMarkDirty();pcRenderEditor();
  }
  async function pcHandleAction(target){
    const action=target.dataset.action;
    if(action==='pc-edit'){await pcOpenEditor(Number(target.dataset.id));return;}
    if(action==='pc-back'){if(pcDirty&&!confirm('Leave without saving changes?'))return;await renderAllCourses();return;}
    if(action==='pc-focus-section'||action==='pc-select-lesson'){
      pcCapture();const at=Number(target.dataset.section);
      if(at>=0&&at<pcSections.length){pcActiveLesson=at;pcOpenBlock=null;pcRenderEditor();}
      return;
    }
    if(action==='pc-toggle-block'){pcCapture();pcOpenBlock=pcOpenBlock===target.dataset.id?null:target.dataset.id;pcRenderEditor();return;}
    if(action==='pc-save'){
      pcCapture();if(!pcCourse)return;
      if(!pcSections.length){toast('Add a module first. Each module automatically contains Lesson 01.','error');return;}
      target.disabled=true;
      try{
        const result=await api('admin_physical_page_save',{method:'POST',body:{course_id:pcCourse.id,sections:pcSections}});
        pcSections=result.sections;pcDirty=false;toast(result.message);pcRenderEditor();
      }catch(error){toast(error.message,'error');}
      finally{target.disabled=false;}
      return;
    }
    pcCapture();
    if(action==='pc-add-quiz-question'){
      const section=pcSections[pcActiveLesson];
      const block=(section?.blocks||[]).find(item=>item.id===pcOpenBlock && item.type==='quiz') || (section?.blocks||[]).find(item=>item.type==='quiz');
      if(!block){toast('Open a quiz widget first.','error');return;}
      const questions=pcQuizQuestions(block);
      questions.push({id:pcId(),prompt:'',choices:['Option A','Option B'],correct:0});
      block.questions=questions;pcOpenBlock=block.id;pcMarkDirty();pcRenderEditor();return;
    }
    if(action==='pc-remove-quiz-question'){
      const section=pcSections[pcActiveLesson];
      const block=(section?.blocks||[]).find(item=>item.id===pcOpenBlock && item.type==='quiz') || (section?.blocks||[]).find(item=>item.type==='quiz');
      const at=Number(target.dataset.question);
      if(!block||!Array.isArray(block.questions)||block.questions.length<=1)return;
      block.questions.splice(at,1); pcOpenBlock=block.id; pcMarkDirty(); pcRenderEditor(); return;
    }
    if(action==='pc-add-module'){
      const module=pcNextModuleName();pcSections.push(pcNewLesson('lesson',module));
      pcActiveLesson=pcSections.length-1;pcOpenBlock=null;
    }
    if(action==='pc-add-section'||action==='pc-add-lesson'){
      const kind=target.dataset.kind||'lesson';
      const at=Number(target.dataset.moduleStart);
      const group=pcGroups().find(g=>g.start===at)||pcGroupAt(pcActiveLesson);
      if(!group){toast('Add a module first.','error');return;}
      const next=pcNewLesson(kind,group.name);
      pcSections.splice(group.end+1,0,next);pcActiveLesson=group.end+1;
      pcOpenBlock=next.blocks[0]?.id||null;
    }
    if(action==='pc-duplicate-lesson'){
      const at=Number(target.dataset.section),source=pcSections[at];if(!source)return;
      const copy=JSON.parse(JSON.stringify(source));copy.id=pcId();copy.title=`${copy.title} (copy)`;
      copy.blocks.forEach(b=>b.id=pcId());pcSections.splice(at+1,0,copy);pcActiveLesson=at+1;pcOpenBlock=null;
    }
    if(action==='pc-palette-add'){
      if(!pcSections[pcActiveLesson])return;
      const type=target.dataset.pcPalette||'paragraph';
      const b=pcNewBlock(type);pcSections[pcActiveLesson].blocks.push(b);pcOpenBlock=b.id;
    }
    if(action==='pc-remove-section'){
      const at=Number(target.dataset.section),group=pcGroupAt(at);
      if(!group)return;
      if(group.start===group.end){toast('A module needs at least one item. Delete the module instead.','error');return;}
      if(!confirm('Delete this item and all of its widgets?'))return;
      pcSections.splice(at,1);pcActiveLesson=Math.min(at,pcSections.length-1);pcOpenBlock=null;
    }
    if(action==='pc-remove-module'){
      const at=Number(target.dataset.moduleStart),group=pcGroups().find(g=>g.start===at);
      if(!group)return;
      if(pcGroups().length===1){toast('Keep at least one module. You can rename it or replace its lessons.','error');return;}
      if(!confirm(`Delete ${group.name} and all its ${group.end-group.start+1} lessons, quizzes and assignments?`))return;
      pcSections.splice(group.start,group.end-group.start+1);
      pcActiveLesson=Math.min(group.start,pcSections.length-1);pcOpenBlock=null;
    }
    if(action==='pc-move-module'){
      const groups=pcGroups(),index=groups.findIndex(g=>g.start===Number(target.dataset.moduleStart));
      const next=index+Number(target.dataset.direction);
      if(index>=0&&next>=0&&next<groups.length){
        const chunks=groups.map(g=>pcSections.slice(g.start,g.end+1));
        [chunks[index],chunks[next]]=[chunks[next],chunks[index]];
        pcSections=chunks.flat();pcActiveLesson=chunks.slice(0,next).reduce((sum,group)=>sum+group.length,0);pcOpenBlock=null;
      }
    }
    if(action==='pc-move-section'){
      const at=Number(target.dataset.section),to=at+Number(target.dataset.direction),group=pcGroupAt(at);
      // Arrow controls reorder items only inside the selected module.
      if(group&&to>=group.start&&to<=group.end){
        [pcSections[at],pcSections[to]]=[pcSections[to],pcSections[at]];
        pcActiveLesson=to;pcOpenBlock=null;
      }
    }
    if(action==='pc-add-block'){
      const si=Number(target.dataset.section),type=target.closest('.pc-add-widget')?.querySelector('[data-pc-new-type]')?.value||'paragraph';
      if(!pcSections[si])return;
      const b=pcNewBlock(type);pcSections[si].blocks.push(b);pcOpenBlock=b.id;
    }
    if(action==='pc-remove-block'){
      if(!confirm('Remove this widget?'))return;
      pcSections[Number(target.dataset.section)]?.blocks.splice(Number(target.dataset.block),1);
    }
    if(action==='pc-move-block'){
      const si=Number(target.dataset.section),at=Number(target.dataset.block),to=at+Number(target.dataset.direction);
      const blocks=pcSections[si]?.blocks||[];
      if(to>=0&&to<blocks.length)[blocks[at],blocks[to]]=[blocks[to],blocks[at]];
    }
    if(action==='pc-pick-media'){
      const input=target.closest('.pc-block')?.querySelector('[data-pc-field="url"]');
      if(input){openMediaPicker('',input);pcMarkDirty();}
      return;
    }
    pcMarkDirty();pcRenderEditor();
  }

  // Native drag/drop: widget palette -> section, block -> block/section, section -> section.
  document.addEventListener('dragstart',event=>{
    if(!event.target.closest('#pcEditor'))return;
    const palette=event.target.closest('[data-pc-palette]');
    const outlineLesson=event.target.closest('[data-pc-outline-lesson]');
    const block=event.target.closest('[data-pc-block]');
    const section=event.target.closest('[data-pc-section]');
    if(palette)pcDrag={kind:'palette',type:palette.dataset.pcPalette};
    else if(outlineLesson)pcDrag={kind:'outline-lesson',section:Number(outlineLesson.dataset.pcOutlineLesson)};
    else if(block)pcDrag={kind:'block',section:Number(block.closest('[data-pc-section]').dataset.pcSection),block:Number(block.dataset.pcBlock)};
    else if(section)pcDrag={kind:'section',section:Number(section.dataset.pcSection)};
    else return;
    pcCapture();event.dataTransfer.effectAllowed=pcDrag.kind==='palette'?'copy':'move';
    event.dataTransfer.setData('text/plain',JSON.stringify(pcDrag));
    event.target.classList.add('pc-dragging');
  });
  document.addEventListener('dragover',event=>{
    if(!pcDrag||!event.target.closest('#pcEditor'))return;
    if(pcDrag.kind==='outline-lesson' && event.target.closest('[data-pc-outline-row],[data-pc-outline-drop]')){event.preventDefault();event.dataTransfer.dropEffect='move';return;}
    const section=event.target.closest('[data-pc-section]');
    if(!section)return;
    if(pcDrag.kind==='section'||event.target.closest('[data-pc-dropzone]')){
      event.preventDefault();event.dataTransfer.dropEffect=pcDrag.kind==='palette'?'copy':'move';
    }
  });
  document.addEventListener('drop',event=>{
    if(!pcDrag||!event.target.closest('#pcEditor'))return;
    if(pcDrag.kind==='outline-lesson'){
      const row=event.target.closest('[data-pc-outline-row]');
      const moduleBox=event.target.closest('[data-pc-outline-drop]');
      if(!row&&!moduleBox){pcDrag=null;return;}
      event.preventDefault();pcCapture();
      const from=pcDrag.section,sourceGroup=pcGroupAt(from);
      const destIndex=row?Number(row.dataset.pcOutlineRow):Number(moduleBox.dataset.pcOutlineDrop);
      const destinationGroup=pcGroupAt(destIndex);
      if(!destinationGroup||!sourceGroup){pcDrag=null;return;}
      if(sourceGroup.start===sourceGroup.end&&sourceGroup.name!==destinationGroup.name){toast('Each module needs at least one item. Add another item before moving this one.','error');pcDrag=null;return;}
      const insertBefore=row?destIndex:destinationGroup.end+1;
      const [moved]=pcSections.splice(from,1);
      moved.module=destinationGroup.name;
      const at=Math.max(0,Math.min(pcSections.length,insertBefore-(from<insertBefore?1:0)));
      pcSections.splice(at,0,moved);pcActiveLesson=at;pcOpenBlock=null;
      pcMarkDirty();pcRenderEditor();pcDrag=null;return;
    }
    const section=event.target.closest('[data-pc-section]');
    if(!section)return;
    event.preventDefault();const destination=Number(section.dataset.pcSection);
    if(pcDrag.kind==='section'){
      const source=pcDrag.section;if(source!==destination){const [sectionItem]=pcSections.splice(source,1);pcSections.splice(destination,0,sectionItem);pcMarkDirty();pcRenderEditor();}
    }else if(pcDrag.kind==='palette'){
      const b=pcNewBlock(pcDrag.type);
      const hovered=event.target.closest('[data-pc-block]');
      const position=hovered?Number(hovered.dataset.pcBlock):pcSections[destination].blocks.length;
      pcSections[destination].blocks.splice(position,0,b);
      pcOpenBlock=b.id;pcMarkDirty();pcRenderEditor();
    }else if(pcDrag.kind==='block'){
      const block=event.target.closest('[data-pc-block]');
      pcReorderBlock(pcDrag.section,pcDrag.block,destination,block?Number(block.dataset.pcBlock):pcSections[destination].blocks.length);
    }
    pcDrag=null;
  });
  document.addEventListener('dragend',()=>{pcDrag=null;document.querySelectorAll('.pc-dragging').forEach(el=>el.classList.remove('pc-dragging'));});
  document.addEventListener('change',event=>{
    const lessonKind=event.target.closest('#pcEditor [data-pc-lesson-kind]');
    if(lessonKind){
      pcCapture();const current=pcSections[pcActiveLesson],kind=lessonKind.value;
      if(current && ['quiz','assignment'].includes(kind) && !current.blocks.some(block=>block.type===kind)){
        const block=pcNewBlock(kind);block.title=kind==='quiz'?'Knowledge check':'Practice assignment';
        current.blocks.push(block);pcOpenBlock=block.id;
      }
      pcMarkDirty();pcRenderEditor();return;
    }
    const typeField=event.target.closest('#pcEditor [data-pc-field="type"]');
    if(typeField){pcCapture();pcOpenBlock=typeField.closest('[data-pc-block]')?.dataset.pcBlockId||null;pcMarkDirty();pcRenderEditor();}
  });

  document.addEventListener('input',event=>{
    if(event.target.id==='pcWidgetSearch'){
      const q=event.target.value.toLowerCase().trim();
      document.querySelectorAll('#pcEditor .pc-widget-palette-item').forEach(btn=>btn.hidden=!btn.textContent.toLowerCase().includes(q));
      return;
    }
    if(!event.target.closest('#pcEditor [data-pc-field],#pcEditor [data-pc-section-title],#pcEditor [data-pc-module-title],#pcEditor [data-pc-lesson-description]'))return;
    pcMarkDirty();
    if(event.target.matches('[data-pc-section-title]')){
      const si=Number(event.target.closest('[data-pc-section]')?.dataset.pcSection);
      const label=document.querySelectorAll('[data-pc-outline-row] .pc-outline-lesson strong')[si];
      if(label)label.textContent=event.target.value||`Lesson ${si+1}`;
      const headline=document.querySelector('.pc-canvas-heading h2');if(headline)headline.textContent=event.target.value||'Untitled lesson';
    }
  });

  document.addEventListener('change', event=>{
    const box=event.target.closest?.('[data-course-format-checkbox]');
    if(!box || !courseModalBackdrop.contains(box))return;
    setCourseModeEnabled(box.dataset.mode,box.checked);
  });

  document.addEventListener('click', async event=>{
    const courseToggle=event.target.closest('[data-action="toggle-courses-menu"]');
    if(courseToggle){event.preventDefault();document.querySelector('[data-courses-menu]')?.classList.toggle('open');return;}
    const pcTarget=event.target.closest('[data-action^="pc-"]');
    if(pcTarget){event.preventDefault();await pcHandleAction(pcTarget);return;}
    const reviewTab=event.target.closest('[data-review-admin-tab]');
    if(reviewTab){
      const type=reviewTab.dataset.reviewAdminTab;
      document.querySelectorAll('[data-review-admin-tab]').forEach(btn=>btn.classList.toggle('active',btn===reviewTab));
      document.querySelectorAll('[data-review-admin-panel]').forEach(panel=>{panel.hidden=panel.dataset.reviewAdminPanel!==type;});
      return;
    }
    const studentSectionTarget=event.target.closest('[data-student-section]');
    if(studentSectionTarget){event.preventDefault();state.studentTab=studentSectionTarget.dataset.studentSection||'enrolled';await navigate('students');return;}
    if(event.target.closest('#adminAlertsButton')){event.preventDefault();const popup=document.getElementById('adminAlertsPanel');if(popup){const opening=popup.hidden;popup.hidden=!opening;alertsButton()?.setAttribute('aria-expanded',String(opening));if(opening)refreshAdminAlerts();}return;}
    const notice=event.target.closest('[data-action="academy-open-notice"]');
    if(notice){event.preventDefault();document.getElementById('adminAlertsPanel').hidden=true;alertsButton()?.setAttribute('aria-expanded','false');const key=notice.dataset.key;const selected=adminAlerts.find(item=>item.key===key);if(selected&&!selected.actionable&&!selected.read){try{await api('admin_notification_read',{method:'POST',body:{key}});}catch(_){}}const view=notice.dataset.nextView;if(canView(view))await navigate(view);refreshAdminAlerts();return;}
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
    else if(action==='review-approval'){const note=prompt(target.dataset.decision==='approved'?'Optional approval note:':'Reason for rejection:','')??null;if(note===null)return;try{const r=await api('admin_approval_review',{method:'POST',body:{type:target.dataset.type,id:target.dataset.id,decision:target.dataset.decision,note}});toast(r.message);await renderApprovals();refreshAdminAlerts();}catch(e){toast(e.message,'error');}}
    else if(action==='close-modal') setModalOpen(modalBackdrop,false);
    else if(action==='cm-add-course') openCourseEditorTab('new',target.dataset.mode||'offline');
    else if(action==='fsa-open-types') navigate('courses');
    else if(action==='cm-attach-mode'){
      const mode=target.dataset.mode||'offline';
      const id=Number(document.getElementById('cmExistingCourseForMode')?.value||0);
      const course=state.courses.find(c=>Number(c.id)===id);
      if(!course||courseModes(course).includes(mode)){toast('Choose a course that does not already offer this format.','error');return;}
      openCourseModal(course,mode,true);
      toast("Edit this format's public-page details, then save to enable it for the same course.");
    }
    else if(action==='cm-edit-public') openCourseEditorTab(target.dataset.id,target.dataset.mode||'offline');
    else if(action==='fsa-enable-all-formats')enableAllCourseModes();
    else if(action==='fsa-format-disable'){
      const id=Number(target.dataset.id),mode=target.dataset.mode;
      const course=state.courses.find(item=>Number(item.id)===id);
      if(!course||!isCentralRole()||!courseModes(course).includes(mode))return;
      if(courseModes(course).length<=1){toast('Keep one format enabled, or set the entire course to Draft to hide it from the website.','error');return;}
      if(!confirm(`Disable the ${COURSE_MODE_LABELS[mode]} version of “${course.title}” for NEW purchases? Existing content and enrollments are retained.`))return;
      target.disabled=true;
      try{
        const response=await api('admin_course_format_disable',{method:'POST',body:{course_id:id,mode}});
        toast(response.message||'Format disabled.');await renderModeCourses(mode);
      }catch(error){toast(error.message,'error');target.disabled=false;}
    }
    else if(action==='cm-view-private'){if(!document.getElementById('pcEditor')||!pcDirty||confirm('Preview opens the last saved version. Continue without saving?'))await cmOpenPrivate(Number(target.dataset.id),target.dataset.mode||'offline');}
    else if(action==='cm-back') await renderAllCourses();
    else if(action==='cm-scroll-section'){event.preventDefault();document.getElementById(target.dataset.anchor)?.scrollIntoView({behavior:'smooth',block:'start'});}
    else if(action==='cm-delete'){
      const id=Number(target.dataset.id),course=state.courses.find(c=>Number(c.id)===id);
      if(!course||!isCentralRole()||courseModes(course).length!==1)return;
      if(!confirm(`Delete the ENTIRE course “${course.title}”, including enrollment links? This cannot be undone.`))return;
      try{const r=await api('admin_course_delete',{method:'POST',body:{id}});toast(r.message);await renderModeCourses(target.dataset.mode||'offline');}catch(e){toast(e.message,'error');}
    }
    else if(action==='add-course') openCourseEditorTab('new');
    else if(action==='course-mode'){if(!courseForm.querySelector('.course-mode-switcher')?.style.display)switchCourseMode(target.dataset.mode||'offline');}
    else if(action==='add-enrollment') openEnrollmentModal();
    else if(action==='edit-enrollment') openEnrollmentModal(state.enrollments.find(item=>Number(item.id)===Number(target.dataset.id)));
    else if(action==='close-access-modal') setModalOpen(accessModalBackdrop,false);
    else if(action==='edit-course') openCourseEditorTab(target.dataset.id);
    else if(action==='edit-private-content'){if(normalizedRole()==='instructor')openPrivateContentModal(state.courses.find(course=>Number(course.id)===Number(target.dataset.id)));else toast('Private recorded/live content is edited by the assigned instructor only.','error');}
    else if(action==='close-content-modal') setModalOpen(contentModalBackdrop,false);
    else if(action==='close-course-modal') { if(editorPageMode){window.location.href='index.html#courses';}else setModalOpen(courseModalBackdrop,false); }
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
    else if(action==='add-module-block'){const module=target.closest('.curriculum-module'),list=module?.querySelector('.module-content-blocks');if(list){list.insertAdjacentHTML('beforeend',moduleContentBlockEditor({},list.querySelectorAll('.module-content-block').length));refreshBuilders();}}
    else if(action==='remove-module-block'){target.closest('.module-content-block')?.remove();refreshBuilders();}
    else if(action==='choose-module-block-media'){const input=target.closest('.module-content-block')?.querySelector('[data-field="module-block-url"]');if(input)openMediaPicker('',input);}
    else if(action==='remove-lesson'){target.closest('.lesson-row-editor')?.remove();refreshBuilders();}
    else if(action==='add-lecture'){const lesson=target.closest('.lesson-row-editor');const list=lesson?.querySelector('.lecture-list');const count=list?.querySelectorAll('.lecture-row-editor').length||0;list?.insertAdjacentHTML('beforeend',lectureEditor({title:`Video ${String(count+1).padStart(2,'0')}`},count));refreshBuilders();}
    else if(action==='remove-lecture'){target.closest('.lecture-row-editor')?.remove();refreshBuilders();}
    else if(action==='public-add-module'){const list=document.getElementById('publicCurriculumBuilder');const index=list.querySelectorAll('.public-module-editor').length+1;list.insertAdjacentHTML('beforeend',publicModuleEditor({title:`Module ${String(index).padStart(2,'0')}`,lessons:[{title:'Lesson 01'}]}));refreshPublicModules();}
    else if(action==='public-remove-module'){target.closest('.public-module-editor')?.remove();refreshPublicModules();}
    else if(action==='public-add-lesson'){const module=target.closest('.public-module-editor');const list=module?.querySelector('.public-lesson-list');if(list){const index=list.querySelectorAll('.public-lesson-editor').length+1;list.insertAdjacentHTML('beforeend',publicLessonEditor({title:`Lesson ${String(index).padStart(2,'0')}`},index-1));refreshPublicModules();}}
    else if(action==='public-remove-lesson'){target.closest('.public-lesson-editor')?.remove();refreshPublicModules();}
    else if(action==='public-move-lesson'||action==='public-move-module'){
      const card=target.closest(action==='public-move-lesson'?'.public-lesson-editor':'.public-module-editor');const dir=Number(target.dataset.direction)||0;
      if(card&&dir<0&&card.previousElementSibling)card.parentElement.insertBefore(card,card.previousElementSibling);
      if(card&&dir>0&&card.nextElementSibling)card.parentElement.insertBefore(card.nextElementSibling,card);
      refreshPublicModules();
    }
    else if(action==='public-add-faq'){document.getElementById('publicFaqBuilder').insertAdjacentHTML('beforeend',publicFaqEditor({}));}
    else if(action==='public-remove-faq'){target.closest('.public-faq-editor')?.remove();}
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
    else if(action==='delete-course'){ if(!confirm('Delete this course? Related enrollment progress will also be removed.'))return; try{const r=await api('admin_course_delete',{method:'POST',body:{id:target.dataset.id}});toast(r.message);await renderModeCourses(categorizedEditorMode);}catch(e){toast(e.message,'error');} }
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
    if(event.target.matches('[data-module-content-upload]')&&event.target.files?.[0]){
      const input=event.target,file=input.files[0],row=input.closest('.module-content-block'),urlInput=row?.querySelector('[data-field="module-block-url"]');
      const fd=new FormData();fd.append('file',file);input.disabled=true;
      try{const r=await api('course_content_asset_upload',{method:'POST',body:fd});if(urlInput)urlInput.value=r.url||'';toast('Course content file uploaded.');}catch(e){toast(e.message,'error');}finally{input.disabled=false;input.value='';}
      return;
    }
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
        delete payload.student_code;
        if(['super_admin','admin_staff'].includes(payload.role))payload.branch='';
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
        payload.publicModules = activeDraft.publicModules;
        payload.publicModulesManaged = true;
        payload.publicFaqs = activeDraft.publicFaqs;
        // Editing must UPDATE the existing course, never INSERT another row with its slug.
        // The saved public page is opened with ?courseEditor=<database ID>.
        const idInForm = Number(courseForm.elements.namedItem('id')?.value || 0);
        const idFromUrl = editorPageMode ? requestedEditorId : 0;
        const currentCourseId = idFromUrl > 0 ? idFromUrl : idInForm;
        if (editorPageMode && requestedEditorId > 0 && idInForm > 0 && idInForm !== requestedEditorId) {
          throw new Error('Course ID mismatch. Refresh the editor before saving.');
        }
        payload.id = currentCourseId > 0 ? currentCourseId : 0;
        if (editorPageMode && requestedEditorId > 0 && !payload.id) {
          throw new Error('Cannot identify the existing course. Please reopen it from All Courses.');
        }
        const r = await api('admin_course_save', { method:'POST', body:payload });
        setFormStatus('courseForm', r.message || 'Course saved.');
        toast(r.message || 'Course saved.');
        refreshAdminAlerts();
        if(editorPageMode){const savedId=Number(r.course?.id||r.course_id||r.id||payload.id||0);if(savedId){courseForm.elements.namedItem('id').value=String(savedId);if(!requestedEditorId)window.location.replace(editorUrl(savedId,activeCourseMode));}}
        else {await renderAllCourses();setModalOpen(courseModalBackdrop,false);}
      } else if (formId === 'privateContentForm') {
        const payload={course_id:Number(fd.get('course_id')||0),modules:collectModules()};
        const r=await api('admin_course_content_save',{method:'POST',body:payload});
        setFormStatus('privateContentForm',r.message||'Private lessons saved.');toast(r.message||'Private lessons saved.');
        await renderAllCourses();setModalOpen(contentModalBackdrop,false);
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
      } else if (formId === 'studentIntegrationsForm') {
        const p={section:'student_integrations',providers:{},otp_email_enabled:fd.get('otp_email_enabled')==='on',recaptcha_mode:fd.get('recaptcha_mode'),recaptcha_site_key:fd.get('recaptcha_site_key'),recaptcha_secret:fd.get('recaptcha_secret')};
        for(const key of ['google','microsoft','linkedin'])p.providers[key]={enabled:fd.get(key+'_enabled')==='on',client_id:fd.get(key+'_id'),secret:fd.get(key+'_secret')};
        const r=await api('admin_student_integrations',{method:'POST',body:p});toast(r.message);await renderStudentIntegrations();
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
  document.addEventListener('click',event=>{const popup=document.getElementById('adminAlertsPanel');if(popup&&!popup.hidden&&!event.target.closest('.academy-alerts')){popup.hidden=true;alertsButton()?.setAttribute('aria-expanded','false');}});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'){const pop=document.getElementById('adminAlertsPanel');if(pop)pop.hidden=true;alertsButton()?.setAttribute('aria-expanded','false');setModalOpen(modalBackdrop,false);if(!editorPageMode)setModalOpen(courseModalBackdrop,false);setModalOpen(accessModalBackdrop,false);setModalOpen(contentModalBackdrop,false);setModalOpen(mediaPickerBackdrop,false);sidebar.classList.remove('open');}});

  (async function init(){
    try{const publicResult=await api('public_settings');applyAdminBranding(publicResult.site||{});applyAdminTheme(publicResult.site?.theme||{});}catch(_){}
    try{const r=await api('auth_admin_me');if(r.authenticated&&['admin','super_admin','admin_staff','branch_head','branch_admin','instructor'].includes(r.user?.role)){state.user=r.user;showApp();}else showLogin();}
    catch(error){const message=error.installUrl?'MySQL is not installed. Open the installer first.':'Backend connection failed. Start PHP and MySQL.';showLogin(message);toast(message,'error');}
  })();

  // Course Types controls save immediately; revert the checkbox if the API rejects the change.
  document.addEventListener('change',async event=>{
    const box=event.target.closest?.('[data-course-type-toggle]');
    if(!box || state.view!=='courseTypes')return;
    const id=Number(box.dataset.id),mode=box.dataset.mode,enabled=box.checked;
    box.disabled=true;
    try {
      const result=await api('admin_course_type_toggle',{method:'POST',body:{course_id:id,mode,enabled}});
      toast(result.message||'Course type updated.');
      const search=document.getElementById('ctCourseSearch')?.value||'';
      await renderCourseTypes();
      const input=document.getElementById('ctCourseSearch');if(input){input.value=search;input.dispatchEvent(new Event('input'));}
    }catch(error){box.checked=!enabled;box.disabled=false;toast(error.message||'Unable to update course type.','error');}
  });
})();
