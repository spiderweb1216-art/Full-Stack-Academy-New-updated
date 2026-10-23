(async () => {
  'use strict';

  const fallbackData = window.BRANCH_PAGE || {};
  const params = new URLSearchParams(window.location.search || '');
  const requestedSlug = params.get('branch') || params.get('slug') || '';
  const branchSlug = String(requestedSlug || document.body?.dataset?.branch || fallbackData.id || '').trim().toLowerCase();
  const rootMedia = value => {
    const url=String(value||'').trim();
    if(!url) return '';
    if(/^(?:https?:|data:|blob:|\/\/|\/|\.\.?\/)/i.test(url)) return url;
    return `../../${url.replace(/^\.?\//,'')}`;
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));

  const applyBackendTheme = theme => {
    const valid=/^#[0-9a-f]{6}$/i;
    const brand=valid.test(String(theme?.brand||''))?String(theme.brand).trim():'#852937';
    const n=parseInt(brand.slice(1),16);
    const rgb=`${(n>>16)&255}, ${(n>>8)&255}, ${n&255}`;
    const root=document.documentElement;
    [['--brand',brand],['--brand-hover',brand],['--brand-dark',brand],['--brand-deep',brand],['--danger',brand],['--fsa-brand',brand],['--fsa-brand-dark',brand],['--brand-rgb',rgb],['--fsa-brand-rgb',rgb],['--accent-soft-1','color-mix(in srgb, var(--brand) 5%, white)'],['--accent-soft-2','color-mix(in srgb, var(--brand) 10%, white)'],['--accent-soft-3','color-mix(in srgb, var(--brand) 17%, white)']].forEach(([k,v])=>root.style.setProperty(k,v));
    root.style.setProperty('--pink','var(--accent-soft-1)');
    root.style.setProperty('--pink-2','var(--accent-soft-2)');
    root.style.setProperty('--pink-3','var(--accent-soft-3)');
    const meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.content=brand;
  };
  const cleanBranchShortName = value => String(value||'').replace(/^\s*FSA\s*[—–-]\s*/i,'').trim();
  const branchIdentity = branch => [branch?.shortName,branch?.name,branch?.slug,branch?.id,branch?.location].map(v=>String(v||'').trim().toLowerCase()).filter(Boolean);
  let data = {...fallbackData};
  let backendInstructors = [];
  let backendBranches = [];
  let backendBatches = [];

  const fetchJson = async url => {
    const response = await fetch(url, {credentials:'same-origin', cache:'no-store', headers:{'Accept':'application/json'}});
    const raw = await response.text();
    let payload;
    try { payload = raw ? JSON.parse(raw) : {}; }
    catch (_) { throw new Error(`Backend returned invalid JSON (${response.status}).`); }
    if (!response.ok || payload.success === false) {const error=new Error(payload.message || `Backend request failed (${response.status}).`);error.status=response.status;throw error;}
    return payload;
  };

  try {
    // Use the same catalog endpoint as the public SPA. This keeps branch detail
    // pages in sync with Admin edits and also works for branches added later.
    const payload = await fetchJson(`../../api/index.php?action=catalog&_=${Date.now()}`);
    applyBackendTheme(payload.site?.theme || {});
    window.FSA_DATA={...(window.FSA_DATA||{}),...payload};window.FSA_CONTENT?.set(payload.content||{});
    const allBranches = Array.isArray(payload.branches) ? payload.branches : [];
    const branch = allBranches.find(item => String(item.slug||item.id||'').toLowerCase() === branchSlug);
    if (!branch){const error=new Error('Published branch not found in backend.');error.status=404;throw error;}
    const shortName = cleanBranchShortName(branch.shortName || branch.name) || cleanBranchShortName(branch.name) || branchSlug;
    data = {
      ...data,
      ...branch,
      id: branch.id || branch.slug || branchSlug,
      slug: branch.slug || branch.id || branchSlug,
      name: shortName,
      shortName,
      title: branch.name || shortName,
      description: branch.description || '',
      image: rootMedia(branch.image),
      heroImage: rootMedia(branch.heroImage || branch.image),
      gallery: (Array.isArray(branch.gallery) ? branch.gallery : []).map(rootMedia),
      lat: (branch.lat == null || branch.lat === '' ? NaN : Number(branch.lat)),
      lng: (branch.lng == null || branch.lng === '' ? NaN : Number(branch.lng)),
    };
    backendBranches = allBranches.map(item => ({...item, shortName:cleanBranchShortName(item.shortName||item.name)||item.shortName||item.name, image:rootMedia(item.image), heroImage:rootMedia(item.heroImage || item.image)}));
    const identities = new Set(branchIdentity(branch));
    backendInstructors = (Array.isArray(payload.instructors) ? payload.instructors : [])
      .filter(item => identities.has(String(item.branch||'').trim().toLowerCase()))
      .map(item => ({...item, avatar:rootMedia(item.avatar)}));
    backendBatches = (Array.isArray(payload.batches) ? payload.batches : [])
      .filter(item => String(item.branchSlug||'').trim().toLowerCase() === branchSlug);
  } catch (catalogError) {
    // Compatibility fallback for installations where only branch_public is available.
    try {
      const payload = await fetchJson(`../../api/index.php?action=branch_public&slug=${encodeURIComponent(branchSlug)}&_=${Date.now()}`);
      const branch = payload.branch || {};
      const shortName = cleanBranchShortName(branch.shortName || branch.name) || cleanBranchShortName(branch.name) || branchSlug;
      data = {
        ...data,
        ...branch,
        id: branch.id || branch.slug || branchSlug,
        slug: branch.slug || branch.id || branchSlug,
        name: shortName,
        shortName,
        title: branch.name || shortName,
        description: branch.description || '',
        image: rootMedia(branch.image),
        heroImage: rootMedia(branch.heroImage || branch.image),
        gallery: (Array.isArray(branch.gallery) ? branch.gallery : []).map(rootMedia),
        lat: (branch.lat == null || branch.lat === '' ? NaN : Number(branch.lat)),
        lng: (branch.lng == null || branch.lng === '' ? NaN : Number(branch.lng)),
      };
      backendInstructors = (Array.isArray(payload.instructors) ? payload.instructors : []).map(item => ({...item, avatar:rootMedia(item.avatar)}));
      backendBatches = Array.isArray(payload.batches) ? payload.batches : [];
      backendBranches = (Array.isArray(payload.branches) ? payload.branches : []).map(item => ({...item, shortName:cleanBranchShortName(item.shortName||item.name)||item.shortName||item.name, image:rootMedia(item.image), heroImage:rootMedia(item.heroImage || item.image)}));
    } catch (branchError) {
      console.error('[FSA branch backend]', catalogError, branchError);
      const main=document.querySelector('main');
      if(main)main.innerHTML='<section class="page-section"><div class="container"><h1>Page not found</h1><p>The page may have moved or the address may be incomplete.</p></div></section>';
      return;
      data = {...data, name:cleanBranchShortName(data.name||data.shortName||data.title)||data.name||'Academy', gallery:(Array.isArray(data.gallery)?data.gallery:[]).map(rootMedia), heroImage:rootMedia(data.heroImage||data.image), image:rootMedia(data.image)};
    }
  }
  window.BRANCH_PAGE = data;
  if(!window.FSA_DATA?.content){try{const response=await fetchJson('../../api/index.php?action=public_content');window.FSA_CONTENT?.set(response.content||{});}catch(_){}}

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const branchPageHref = branch => {
    const slug=String(branch?.id||branch?.slug||'').trim();
    return `../view/index.html?branch=${encodeURIComponent(slug)}`;
  };

  const hydrateBackendBranch = () => {
    const shortName=cleanBranchShortName(data.shortName || data.name || data.title) || 'Academy';
    const backendTitle=String(data.title || data.name || shortName).trim();
    document.title=`${backendTitle} | Full Stack Academy`;
    const metaDescription=document.querySelector('meta[name="description"]');
    if(metaDescription && data.description) metaDescription.setAttribute('content',data.description);

    const heroTitle=$('.branch-hero-copy h1');
    if(heroTitle){
      const titleText=backendTitle || shortName;
      const match=titleText.match(/^(.*?)[—–-]\s*(.+)$/);
      heroTitle.innerHTML=match ? `${escapeHtml(match[1].trim())} – <em>${escapeHtml(match[2].trim())}</em>` : `<em>${escapeHtml(titleText)}</em>`;
    }
    const heroKicker=$('.branch-kicker');
    if(heroKicker) heroKicker.textContent=`${data.location || shortName} Learning Centre`;
    const heroCopy=$('.branch-hero-copy > p');
    if(heroCopy) heroCopy.textContent=data.description || `${backendTitle} is a Full Stack Academy learning centre.`;
    const heroImage=$('.branch-hero-media img');
    if(heroImage && (data.heroImage||data.image)){heroImage.src=data.heroImage||data.image;heroImage.alt=`${backendTitle} branch`;}
    const heroBadge=$('.hero-badge small'); if(heroBadge) heroBadge.textContent=data.location||data.address||shortName;

    const contactItems=$$('.contact-strip .contact-item');
    if(contactItems[0]){contactItems[0].href='#location';const strong=$('strong',contactItems[0]);if(strong)strong.textContent=data.address||data.location||shortName;}
    if(contactItems[1]){contactItems[1].href=`mailto:${data.email||''}`;const strong=$('strong',contactItems[1]);if(strong)strong.textContent=data.email||'—';}
    if(contactItems[2]){contactItems[2].href=data.phone?`tel:${String(data.phone).replace(/[^+\d]/g,'')}`:'#';const strong=$('strong',contactItems[2]);if(strong)strong.textContent=[data.phone,data.extension].filter(Boolean).join(' · ')||'—';}

    const galleryIntro=$('.gallery-section .section-heading p');
    if(galleryIntro) galleryIntro.textContent=`Swipe through the ${shortName} branch classrooms and learning spaces.`;
    const galleryTrack=$('.gallery-track');
    const galleryImages=(Array.isArray(data.gallery)&&data.gallery.length?data.gallery:[data.heroImage||data.image]).filter(Boolean);
    data.gallery=galleryImages;
    if(galleryTrack) galleryTrack.innerHTML=galleryImages.map((src,index)=>`<button class="gallery-slide" type="button" data-gallery-index="${index}"><img src="${escapeHtml(src)}" alt="${escapeHtml(shortName)} academy gallery image ${index+1}" loading="lazy"></button>`).join('');

    const teamTrack=$('.team-track');
    if(teamTrack){
      teamTrack.innerHTML=backendInstructors.length
        ? backendInstructors.map(item=>`<article class="team-card"><div class="team-avatar">${item.avatar?`<img src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.name)}">`:`<img src="../../assets/images/fsa-home/logo.svg" alt="Full Stack Academy">`}</div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.headline||'Full Stack Academy Instructor')}</p></article>`).join('')
        : `<article class="team-card"><div class="team-avatar"><img src="../../assets/images/fsa-home/logo.svg" alt="Full Stack Academy"></div><h3>Instructor profiles</h3><p>No public instructors are assigned to this branch yet.</p></article>`;
    }

    const locationTitle=$('.location-head h2'); if(locationTitle) locationTitle.textContent=`Find ${backendTitle}`;
    const locationCopy=$('.location-head p');
    if(locationCopy) locationCopy.textContent=`${data.hours?`Open ${data.hours}. `:''}Branch location is shown by default. Allow your browser location to draw a driving route and estimate distance.`;
    const routeMessage=$('[data-route-message]'); if(routeMessage) routeMessage.textContent=`Showing the ${backendTitle} location.`;

    const footerContact=$('.footer-contact-premium');
    if(footerContact){
      footerContact.innerHTML=`<h3>Contact Us</h3>${data.phone?`<a href="tel:${escapeHtml(String(data.phone).replace(/[^+\d]/g,''))}"><span data-premium-icon="phone"></span>${escapeHtml(data.phone)}</a>`:''}${data.email?`<a href="mailto:${escapeHtml(data.email)}"><span data-premium-icon="mail"></span>${escapeHtml(data.email)}</a>`:''}${backendBranches.map(branch=>`<a href="${escapeHtml(branchPageHref(branch))}"><span data-premium-icon="map"></span>${escapeHtml(branch.name||branch.shortName||'FSA Branch')}</a>`).join('')}`;
    }

    const otherGrid=$('.other-branch-grid');
    if(otherGrid && backendBranches.length){
      otherGrid.innerHTML=backendBranches.filter(branch=>String(branch.id||branch.slug)!==String(data.id)).map(branch=>`<a class="other-branch-card reveal" href="${escapeHtml(branchPageHref(branch))}"><img src="${escapeHtml(branch.heroImage||branch.image||'../../assets/images/fsa-home/logo.svg')}" alt="${escapeHtml(branch.name||branch.shortName||'FSA branch')}" loading="lazy"><span><small>${escapeHtml(branch.location||branch.address||'')}</small><strong>${escapeHtml(branch.name||branch.shortName||'Full Stack Academy')}</strong><em>View branch →</em></span></a>`).join('');
    }

    const megaGrid=$('.branch-mega-grid');
    if(megaGrid && backendBranches.length){
      megaGrid.innerHTML=backendBranches.map((branch,index)=>`<a class="branch-mega-card" href="${escapeHtml(branchPageHref(branch))}"><span class="branch-mega-image"><img src="${escapeHtml(branch.image||branch.heroImage||'../../assets/images/fsa-home/logo.svg')}" alt="${escapeHtml(branch.name||'FSA branch')}" loading="lazy"><b>${String(index+1).padStart(2,'0')}</b></span><span class="branch-mega-card-copy"><small>${escapeHtml(branch.location||branch.address||'')}</small><strong>${escapeHtml(branch.name||branch.shortName||'Full Stack Academy')}</strong><em>View branch details</em></span><i aria-hidden="true" data-premium-icon="arrow"></i></a>`).join('');
      const kicker=$('.branch-mega-kicker'); if(kicker) kicker.textContent=`${backendBranches.length} Hyderabad Centre${backendBranches.length===1?'':'s'}`;
    }

    const mobileLinks=$('.mobile-branch-links');
    if(mobileLinks && backendBranches.length){
      mobileLinks.innerHTML=backendBranches.map((branch,index)=>`<a href="${escapeHtml(branchPageHref(branch))}"><b>${String(index+1).padStart(2,'0')}</b> ${escapeHtml(branch.shortName||String(branch.name||'').replace(/^FSA\s*[—-]\s*/,''))}</a>`).join('');
      const mobileCount=$('.mobile-branch-main span'); if(mobileCount) mobileCount.textContent=`${String(backendBranches.length).padStart(2,'0')} Centres`;
    }


    const batchesIntro=$('.batches-section .section-heading p');
    if(batchesIntro) batchesIntro.textContent=`All schedules, modes, instructors and seat availability for ${shortName} are loaded from the academy backend.`;
    const batchesGrid=$('[data-batches-grid]');
    if(batchesGrid){
      const card=row=>{
        const startText=String(row.start||'Upcoming').trim();
        const m=startText.match(/^(\d{1,2})\s+([A-Za-z]{3,})/);
        const day=m?m[1]:(startText==='Start Anytime'?'START':'UP');
        const mon=m?m[2].slice(0,3).toUpperCase():(startText==='Start Anytime'?'ANYTIME':'COMING');
        const mode=String(row.mode||'Offline Classroom');
        const place=row.branch||shortName||'FSA Branch';
        const seats=(row.seats===null||row.seats===undefined)?'Flexible access':`${row.seats} seats open`;
        return `<article class="fsa-branch-batch-card" data-slot="${escapeHtml(row.shiftKey||String(row.shift||'').toLowerCase())}" data-branch="${escapeHtml(String(row.branchSlug||branchSlug).toLowerCase())}" data-mode="${escapeHtml(mode.toLowerCase().replace(/\s+/g,'-'))}" data-search="${escapeHtml(`${row.course||''} ${place} ${mode} ${row.time||''}`.toLowerCase())}"><div class="fsa-branch-batch-top"><span class="fsa-branch-batch-date"><strong>${escapeHtml(day)}</strong><small>${escapeHtml(mon)}</small></span><span class="fsa-branch-mode-pill">${escapeHtml(mode)}</span></div><h3>${escapeHtml(row.course||'Academy Batch')}</h3><div class="fsa-branch-batch-details"><span><span data-premium-icon="clock"></span><b>${escapeHtml(row.time||row.days||'Schedule available')}</b></span><span><span data-premium-icon="map"></span><b>${escapeHtml(place)}</b></span><span><span data-premium-icon="users"></span><b>${escapeHtml(seats)}</b></span></div><a class="fsa-branch-batch-link" href="../../index.html#/course/${encodeURIComponent(row.slug||'')}">View course <span data-premium-icon="arrow"></span></a></article>`;
      };
      batchesGrid.className='fsa-branch-batch-grid';
      batchesGrid.innerHTML=backendBatches.length?backendBatches.map(card).join(''):`<div class="batch-empty" data-batch-empty>No published batches are currently assigned to this branch.</div>`;
    }
    const batchSection=$('.batches-section .site-shell');
    if(batchSection){
      const heading=batchSection.querySelector('.section-heading');
      if(heading)heading.innerHTML=`<span>Admissions Schedule</span><h2>Upcoming <em>Learning Options</em></h2><p>All schedules, learning modes, branches, instructors and seat availability come from the backend.</p>`;
      const branches=backendBranches.map(br=>[String(br.slug||'').toLowerCase(),br.shortName||String(br.name||'').replace(/^FSA\s*[—-]\s*/,'')||br.location||br.slug]).filter(x=>x[0]);
      const opts=items=>items.map(([v,l])=>`<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join('');
      const form=document.createElement('div'); form.className='fsa-branch-batch-filter-form';
      form.innerHTML=`<label><small>Course</small><strong>Search course</strong><input type="search" data-branch-batch-search placeholder="Search batches..."></label><label><small>Time</small><strong>Choose schedule</strong><select data-branch-batch-shift>${opts([['all','All Times'],['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['anytime','Start Anytime']])}</select></label><label><small>Mode</small><strong>Choose learning mode</strong><select data-branch-batch-mode>${opts([['all','All Modes'],['live-streamed','Live Streamed'],['recorded','Recorded'],['offline-classroom','Offline Classroom']])}</select></label><label><small>Branch</small><strong>Choose location</strong><select data-branch-batch-branch>${opts([['all','All Locations'],['online','Online'],...branches])}</select></label>`;
      const oldFilters=batchSection.querySelector('.batch-filters'); if(oldFilters)oldFilters.replaceWith(form); else heading?.after(form);
      const layout=batchSection.querySelector('.batches-layout'); if(layout)layout.className='fsa-branch-batches-layout';
      layout?.querySelector('.batch-branch-filter')?.remove();
    }
  };
  hydrateBackendBranch();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shared home-style header + mobile drawer on standalone branch pages
  const menuBtn = $('[data-branch-menu-open]');
  const mobileMenu = $('#mobileMenu');
  const closeSharedMenu = () => {
    mobileMenu?.classList.remove('open');
    mobileMenu?.setAttribute('aria-hidden','true');
    menuBtn?.setAttribute('aria-expanded','false');
    document.body.classList.remove('fsa-menu-open');
  };
  menuBtn?.addEventListener('click', () => {
    const open = !mobileMenu?.classList.contains('open');
    mobileMenu?.classList.toggle('open', open);
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('fsa-menu-open', open);
  });
  $$('[data-branch-menu-close]').forEach(btn => btn.addEventListener('click', closeSharedMenu));
  mobileMenu?.addEventListener('click', e => {
    if (e.target === mobileMenu || e.target.closest('a')) closeSharedMenu();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && mobileMenu?.classList.contains('open')) closeSharedMenu(); });

  const sharedAnnouncement = $('#sharedAnnouncement');
  $('[data-close-shared-announcement]')?.addEventListener('click', () => sharedAnnouncement?.classList.add('is-closed'));
  const sharedHeader = $('#siteHeader');
  const updateSharedHeader = () => sharedHeader?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', updateSharedHeader, {passive:true}); updateSharedHeader();

  // Scroll progress + top button
  const progress = $('#scrollProgress');
  const scrollTop = $('[data-scroll-top]');
  const updateScrollUi = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.width = `${Math.min(100,(scrollY/max)*100)}%`;
    scrollTop?.classList.toggle('show', scrollY > 600);
  };
  addEventListener('scroll', updateScrollUi, {passive:true}); updateScrollUi();
  scrollTop?.addEventListener('click', () => scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'}));

  // Reveal animation
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
    }), {threshold:.12, rootMargin:'0px 0px -35px'});
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  // Reusable gallery slider
  const gallery = $('[data-gallery-slider]');
  let galleryIndex = 0, galleryTimer = null, lightboxIndex = 0;
  if (gallery) {
    const viewport = $('.gallery-viewport', gallery);
    const track = $('.gallery-track', gallery);
    const slides = $$('.gallery-slide', gallery);
    const dotsWrap = $('[data-slider-dots]', gallery);
    const perView = () => innerWidth <= 580 ? 1 : innerWidth <= 880 ? 1 : innerWidth <= 1120 ? 2 : 3;
    const maxIndex = () => Math.max(0, slides.length - perView());
    const move = (index, user=false) => {
      galleryIndex = Math.max(0, Math.min(maxIndex(), index));
      const slide = slides[0]; if (!slide) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 18;
      const offset = galleryIndex * (slide.getBoundingClientRect().width + gap);
      track.style.transform = `translate3d(${-offset}px,0,0)`;
      slides.forEach((s,i) => s.classList.toggle('active', i >= galleryIndex && i < galleryIndex + perView()));
      $$('.slider-dots button', gallery).forEach((d,i) => d.classList.toggle('active', i === galleryIndex));
      if (user) restartGallery();
    };
    const rebuildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (let i=0;i<=maxIndex();i++) {
        const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',`Go to gallery slide ${i+1}`); b.addEventListener('click',()=>move(i,true)); dotsWrap.appendChild(b);
      }
    };
    rebuildDots();
    $('[data-slider-prev]', gallery)?.addEventListener('click',()=>move(galleryIndex <= 0 ? maxIndex() : galleryIndex-1,true));
    $('[data-slider-next]', gallery)?.addEventListener('click',()=>move(galleryIndex >= maxIndex() ? 0 : galleryIndex+1,true));
    let startX=0;
    viewport?.addEventListener('pointerdown',e=>{startX=e.clientX; viewport.setPointerCapture?.(e.pointerId)});
    viewport?.addEventListener('pointerup',e=>{const dx=e.clientX-startX;if(Math.abs(dx)>45)move(galleryIndex+(dx<0?1:-1),true)});
    const restartGallery = () => {
      clearInterval(galleryTimer);
      if (reduceMotion || slides.length <= perView()) return;
      galleryTimer=setInterval(()=>move(galleryIndex>=maxIndex()?0:galleryIndex+1),5200);
    };
    window.restartGallery = restartGallery;
    addEventListener('resize',()=>{rebuildDots(); move(Math.min(galleryIndex,maxIndex())); restartGallery();},{passive:true});
    move(0); restartGallery();
    slides.forEach((s,i)=>s.addEventListener('click',()=>openLightbox(i)));
  }

  // Team slider
  const teamSlider = $('[data-team-slider]');
  if (teamSlider) {
    const track=$('.team-track',teamSlider), cards=$$('.team-card',teamSlider); let idx=0;
    const pv=()=>innerWidth<=580?1:innerWidth<=880?2:innerWidth<=1120?3:4;
    const max=()=>Math.max(0,cards.length-pv());
    const move=n=>{idx=Math.max(0,Math.min(max(),n));const first=cards[0];if(!first)return;const gap=parseFloat(getComputedStyle(track).gap)||16;track.style.transform=`translate3d(${-idx*(first.getBoundingClientRect().width+gap)}px,0,0)`};
    $('[data-team-prev]',teamSlider)?.addEventListener('click',()=>move(idx<=0?max():idx-1));
    $('[data-team-next]',teamSlider)?.addEventListener('click',()=>move(idx>=max()?0:idx+1));
    addEventListener('resize',()=>move(Math.min(idx,max())),{passive:true}); move(0);
  }

  // Lightbox
  const lb=$('[data-lightbox]'), lbImg=$('[data-lightbox-image]');
  const openLightbox = index => {
    if(!lb || !lbImg || !Array.isArray(data.gallery) || !data.gallery.length) return;
    lightboxIndex=(index+data.gallery.length)%data.gallery.length; lbImg.src=data.gallery[lightboxIndex]; lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  };
  const closeLightbox=()=>{lb?.classList.remove('open');lb?.setAttribute('aria-hidden','true');document.body.style.overflow=''};
  $('[data-lightbox-close]')?.addEventListener('click',closeLightbox);
  $('[data-lightbox-prev]')?.addEventListener('click',()=>openLightbox(lightboxIndex-1));
  $('[data-lightbox-next]')?.addEventListener('click',()=>openLightbox(lightboxIndex+1));
  lb?.addEventListener('click',e=>{if(e.target===lb)closeLightbox()});
  addEventListener('keydown',e=>{if(!lb?.classList.contains('open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')openLightbox(lightboxIndex-1);if(e.key==='ArrowRight')openLightbox(lightboxIndex+1)});

  // Unified batch filters: Course, Time, Mode, Branch.
  const applyBatchFilters=()=>{
    const q=String($('[data-branch-batch-search]')?.value||'').trim().toLowerCase();
    const slot=$('[data-branch-batch-shift]')?.value||'all';
    const mode=$('[data-branch-batch-mode]')?.value||'all';
    const branch=$('[data-branch-batch-branch]')?.value||'all';
    let shown=0;
    $$('.fsa-branch-batch-card').forEach(card=>{const okQ=!q||String(card.dataset.search||'').includes(q);const okSlot=slot==='all'||card.dataset.slot===slot;const okMode=mode==='all'||card.dataset.mode===mode;const okBranch=branch==='all'||card.dataset.branch===branch;card.hidden=!(okQ&&okSlot&&okMode&&okBranch);if(!card.hidden)shown++;});
    const empty=$('[data-batch-empty]'); if(empty)empty.hidden=shown!==0;
  };
  document.addEventListener('input',e=>{if(e.target.matches('[data-branch-batch-search]'))applyBatchFilters();});
  document.addEventListener('change',e=>{if(e.target.matches('[data-branch-batch-shift],[data-branch-batch-mode],[data-branch-batch-branch]'))applyBatchFilters();});
  applyBatchFilters();

  // Branch map and location route
  const mapEl=$('#branchMap');
  const distanceEl=$('[data-route-distance]'), timeEl=$('[data-route-time]'), messageEl=$('[data-route-message]');
  const directions=$('[data-open-directions]');
  let map=null, routeLayer=null, userMarker=null;
  const destination={lat:(data.lat == null || data.lat === '' ? NaN : Number(data.lat)),lng:(data.lng == null || data.lng === '' ? NaN : Number(data.lng))};
  const hasDestination=Number.isFinite(destination.lat)&&Number.isFinite(destination.lng)&&Math.abs(destination.lat)<=90&&Math.abs(destination.lng)<=180;
  const gmaps=(origin=null)=>'#location';
  if(directions){directions.href='#location';directions.removeAttribute('target');directions.removeAttribute('rel');}
  const initMap=()=>{
    if(!mapEl || !window.L || !hasDestination)return;
    map=L.map(mapEl,{scrollWheelZoom:false,attributionControl:false}).setView([destination.lat,destination.lng],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    const icon=L.divIcon({className:'fsa-map-pin',html:'<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#852937;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 6px 14px rgba(0,0,0,.2)"><span style="transform:rotate(45deg);color:#fff;font:600 10px Inter">FSA</span></div>',iconSize:[34,34],iconAnchor:[17,34]});
    L.marker([destination.lat,destination.lng],{icon}).addTo(map).bindPopup(`<strong>${data.title||'Full Stack Academy'}</strong><br>${data.address||data.location||''}`).openPopup();
  };
  initMap();
  const haversine=(a,b)=>{const r=6371,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng),aa=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;return r*2*Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa))};
  const route=async origin=>{
    if(directions)directions.href='#location';
    if(messageEl)messageEl.textContent='Calculating a driving route…';
    if(userMarker)map?.removeLayer(userMarker); if(routeLayer)map?.removeLayer(routeLayer);
    userMarker=window.L&&map?L.circleMarker([origin.lat,origin.lng],{radius:7,color:'#17372f',weight:3,fillColor:'#fff',fillOpacity:1}).addTo(map).bindPopup('Your location'):null;
    try{
      const url=`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const res=await fetch(url); if(!res.ok)throw new Error('route'); const json=await res.json(); const r=json.routes?.[0]; if(!r)throw new Error('route');
      if(map&&window.L){routeLayer=L.geoJSON(r.geometry,{style:{color:'#852937',weight:5,opacity:.8}}).addTo(map);map.fitBounds(routeLayer.getBounds(),{padding:[35,35]})}
      if(distanceEl)distanceEl.textContent=`${(r.distance/1000).toFixed(r.distance<10000?1:0)} km`;
      const mins=Math.max(1,Math.round(r.duration/60)); if(timeEl)timeEl.textContent=mins<60?`${mins} min`:`${Math.floor(mins/60)}h ${mins%60}m`;
      if(messageEl)messageEl.textContent=`Driving route from your location to ${data.title||data.name}.`;
    }catch(err){
      const km=haversine(origin,destination); if(distanceEl)distanceEl.textContent=`~${km.toFixed(1)} km`; if(timeEl)timeEl.textContent='—'; if(messageEl)messageEl.textContent='Live road routing is unavailable. Approximate straight-line distance is shown; use the branch contact details for navigation.'; if(map&&userMarker)map.fitBounds([[origin.lat,origin.lng],[destination.lat,destination.lng]],{padding:[35,35]});
    }
  };
  $('[data-track-location]')?.addEventListener('click',()=>{
    if(!navigator.geolocation){if(messageEl)messageEl.textContent='Location is not supported by this browser.';return;}
    if(messageEl)messageEl.textContent='Waiting for location permission…';
    if (!hasDestination) {if(messageEl)messageEl.textContent='This branch has no map coordinates yet. Contact the branch for directions.';return;}
    navigator.geolocation.getCurrentPosition(pos=>route({lat:pos.coords.latitude,lng:pos.coords.longitude}),err=>{if(messageEl)messageEl.textContent=err.code===1?'Location permission was not granted. You can still use the branch location shown here.':'Could not get your location. Please try again.'},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  });
})();
