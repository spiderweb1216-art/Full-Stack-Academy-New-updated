/* Shared premium UI enhancements for main LMS and standalone branch pages. */
(() => {
  'use strict';
  const P={
    search:'<circle cx="11" cy="11" r="7.2"/><path d="m16.4 16.4 4.1 4.1"/>',
    phone:'<path d="M5.4 3.5h3.1l1.4 4-2 1.8a15.4 15.4 0 0 0 6.8 6.8l1.8-2 4 1.4v3.1a2.4 2.4 0 0 1-2.4 2.4C9.8 21 3 14.2 3 5.9a2.4 2.4 0 0 1 2.4-2.4Z"/>',
    x:'<path d="m6 6 12 12M18 6 6 18"/>',
    user:'<circle cx="12" cy="8" r="3.4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    cookie:'<path d="M20.5 13.2A8.8 8.8 0 1 1 10.8 3.5a4.5 4.5 0 0 0 5.7 5.7 4.5 4.5 0 0 0 4 4Z"/><circle cx="8.5" cy="9" r=".7"/><circle cx="11" cy="15" r=".7"/><circle cx="7" cy="16" r=".7"/>',
    sparkle:'<path d="m12 3 1.35 3.65L17 8l-3.65 1.35L12 13l-1.35-3.65L7 8l3.65-1.35L12 3ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14ZM5 12l.65 1.75L7.4 14.4l-1.75.65L5 16.8l-.65-1.75-1.75-.65 1.75-.65L5 12Z"/>',
    book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/>',
    ai:'<path d="M8 3h8M12 3v4M4 9h16v10H4zM8 13h.01M16 13h.01M8 19v2M16 19v2"/><path d="M9 16h6"/>',
    code:'<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    cloud:'<path d="M17.6 19H7a5 5 0 1 1 1.4-9.8A6.4 6.4 0 0 1 21 11.7 3.5 3.5 0 0 1 17.6 19Z"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m8.8 12.2 2.1 2.1 4.4-5"/>',
    megaphone:'<path d="m3 11 15-6v14L3 13v-2Z"/><path d="m7 15 1 5h4l-1.3-4.2M21 9v6"/>',
    building:'<path d="M4 21V5l8-3 8 3v16M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2M2 21h20"/>',
    users:'<path d="M16 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 19.5V21"/><circle cx="9" cy="7.5" r="4"/><path d="M17 4.2a4 4 0 0 1 0 7.6M22 21v-1.5a4.5 4.5 0 0 0-3.2-4.3"/>',
    award:'<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9M10 8l1.3 1.3L14 6.7"/>',
    star:'<path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.7Z"/>',
    map:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.2"/>',
    calendar:'<path d="M5 3v3M19 3v3M4 7h16v14H4zM4 10h16"/><path d="M8 14h3M13 14h3M8 17h3"/>',
    radio:'<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.8 4.8a10.2 10.2 0 0 0 0 14.4M19.2 4.8a10.2 10.2 0 0 1 0 14.4"/>',
    play:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3V9Z"/>',
    classroom:'<path d="M3 5h18v12H3zM8 21h8M12 17v4"/><path d="M7 9h5M7 12h8"/>',
    graduation:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M22 9v6"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.5 1-1.5 2.3M12 17h.01"/>',
    mail:'<path d="M3 5h18v14H3z"/><path d="m3 7 9 6 9-6"/>',
    file:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
    privacy:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10"/>',
    refund:'<path d="M4 7h11a5 5 0 1 1 0 10H8"/><path d="m7 4-3 3 3 3M12 13h5M14.5 10.5v5"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    briefcase:'<path d="M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2"/>',
    filter:'<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>',
    chevron:'<path d="m8 10 4 4 4-4"/>',
    trend:'<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    video:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3V9Z"/>',
    playSolid:'<path d="m9 7 8 5-8 5V7Z"/>',
    pause:'<path d="M9 7v10M15 7v10"/>',
    volume:'<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute:'<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="m17 10 4 4M21 10l-4 4"/>',
    fullscreen:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    replay:'<path d="M4 8V3m0 0h5M4 3l4 4a8 8 0 1 1-2 8"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    accessibility:'<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5h14M12 7v14M8 21l4-8 4 8"/>',
    contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18V3Z"/>',
    type:'<path d="M4 6V4h16v2M9 20h6M12 4v16"/>',
    minus:'<path d="M5 12h14"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
    reset:'<path d="M4 8V3m0 0h5M4 3l4 4a8 8 0 1 1-2 8"/>'
  };
  const icon=(name,cls='',filled=false)=>`<svg class="${cls}" viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]||P.award}</svg>`;
  window.FSA_UI={icon};

  const onBranch=()=>/\/branches\//.test(location.pathname.replace(/\\/g,'/'));
  const localRoute=(route='/')=>onBranch()?`../../index.html#${route}`:`#${route}`;

  function fillPremiumIcons(root=document){
    root.querySelectorAll('[data-premium-icon]').forEach(el=>{if(!el.dataset.iconReady){el.innerHTML=icon(el.dataset.premiumIcon);el.dataset.iconReady='1';}});
  }

  function initPremiumSelects(root=document){
    const selects=[];
    if(root instanceof HTMLSelectElement)selects.push(root);
    if(root.querySelectorAll)selects.push(...root.querySelectorAll('select'));
    selects.forEach(select=>{
      if(select.dataset.premiumSelectReady==='1'||select.closest('.admin-shell'))return;
      select.dataset.premiumSelectReady='1';
      select.classList.add('fsa-premium-select-control');
      const shell=document.createElement('span');
      shell.className='fsa-premium-select-shell';
      select.parentNode.insertBefore(shell,select);
      shell.appendChild(select);
      const chevron=document.createElement('span');
      chevron.className='fsa-premium-select-chevron';
      chevron.setAttribute('aria-hidden','true');
      chevron.innerHTML=icon('chevron');
      shell.appendChild(chevron);
    });
  }
  window.FSA_UI.enhanceSelects=initPremiumSelects;

  function linkIconFor(a){
    const t=(a.textContent||'').trim().toLowerCase(), h=(a.getAttribute('href')||'').toLowerCase();
    if(t.includes('course')||h.includes('/course'))return 'book';
    if(t.includes('super40')||t.includes('bba'))return 'graduation';
    if(t.includes('compan'))return 'building';
    if(t.includes('candidate'))return 'users';
    if(t.includes('placed')||t.includes('alumni'))return 'award';
    if(t.includes('branch')||t.includes('visit'))return 'map';
    if(t.includes('batch'))return 'calendar';
    if(t.includes('privacy'))return 'privacy';
    if(t.includes('term'))return 'file';
    if(t.includes('refund'))return 'refund';
    if(t.includes('call')||h.startsWith('tel:'))return 'phone';
    if(t.includes('email')||h.startsWith('mailto:'))return 'mail';
    if(t.includes('help')||t.includes('contact'))return 'help';
    return 'arrow';
  }
  function decorateFooter(root=document){
    root.querySelectorAll('.site-footer .footer-column>a,.site-footer .footer-contact-column p a,.footer-policy-links a,.branch-footer .footer-grid>div>a').forEach(a=>{
      if(a.querySelector('.premium-link-icon')||a.classList.contains('footer-logo'))return;
      const s=document.createElement('span');s.className='premium-link-icon';s.innerHTML=icon(linkIconFor(a));a.prepend(s);
    });
  }

  function enforceLocalLinks(root=document){
    root.querySelectorAll('a[href^="http://"],a[href^="https://"]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(/fullstackacademy\.in\/alumni/i.test(href))a.href=localRoute('/alumni');
      else if(/fullstackacademy\.in\/courses/i.test(href))a.href=localRoute('/courses');
      else if(/fullstackacademy\.in\/branches/i.test(href))a.href=localRoute('/branches');
      else if(/super40-bba-admission|Full-Stack-BBA-College/i.test(href))a.href=localRoute('/contact');
      else if(/fullstackacademy\.in\/events/i.test(href))a.href=localRoute('/events');
      else if(/google\.[^/]+\/maps|maps\.google|google\.com\/maps/i.test(href))a.href=onBranch()?'#location':localRoute('/branches');
      else a.href=localRoute('/contact');
      a.removeAttribute('target');a.removeAttribute('rel');
    });
  }

  const scrollSelectors='.fsa-course-mode-tabs,.fsa-batch-shift-tabs,.fsa-batch-filters>div,.fsa-batches-filter-scroll,.candidate-active-filters,.company-track-tags,.candidate-skills,.s40-chip-list,.batch-filters,.mobile-course-links';
  function initScrollRows(root=document){
    root.querySelectorAll(scrollSelectors).forEach(el=>{
      if(el.dataset.premiumScrollReady)return;el.dataset.premiumScrollReady='1';el.classList.add('premium-scroll-row');
      let down=false,startX=0,startLeft=0,moved=false;
      el.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down=true;moved=false;startX=e.clientX;startLeft=el.scrollLeft;el.classList.add('is-drag-scrolling');el.setPointerCapture?.(e.pointerId)});
      el.addEventListener('pointermove',e=>{if(!down)return;const d=e.clientX-startX;if(Math.abs(d)>4)moved=true;el.scrollLeft=startLeft-d});
      const stop=()=>{down=false;el.classList.remove('is-drag-scrolling')};el.addEventListener('pointerup',stop);el.addEventListener('pointercancel',stop);
      el.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
      el.addEventListener('wheel',e=>{if(el.scrollWidth<=el.clientWidth+2)return;if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){el.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});
    });
  }

  const COOKIE_KEY='fsa_cookie_consent_v1';
  const NEWSLETTER_SUB_KEY='fsa_newsletter_subscribed_v1';
  const NEWSLETTER_DISMISS_KEY='fsa_newsletter_dismissed_v1';

  const localApi=()=>onBranch()?'../../api/index.php':'api/index.php';
  const safeRead=(key)=>{try{return localStorage.getItem(key)}catch(_){return null}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,value)}catch(_){}};
  const modalIsOpen=()=>Boolean(document.querySelector('.fsa-call-backdrop.open,.fsa-newsletter-backdrop.open'));
  const syncBodyLock=()=>document.body.classList.toggle('fsa-modal-locked',modalIsOpen());

  async function submitLocalInquiry(payload){
    const r=await fetch(`${localApi()}?action=contact_submit`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let j={};try{j=await r.json()}catch(_){throw new Error('The website returned an invalid response.');}
    if(!r.ok||j.success===false)throw new Error(j.message||'Could not submit the request.');
    return j;
  }

  function fieldMarkup({label,name,type='text',placeholder='',autocomplete='',required=false,iconName='user',full=false,options=null}){
    const control=options
      ? `<select name="${name}" ${required?'required':''}>${options.map(x=>`<option>${x}</option>`).join('')}</select>`
      : `<input name="${name}" ${required?'required':''} type="${type}" ${autocomplete?`autocomplete="${autocomplete}"`:''} ${type==='tel'?'inputmode="tel"':''} placeholder="${placeholder}">`;
    return `<div class="fsa-call-field ${full?'full':''}"><label>${label}${required?' *':''}</label><div class="fsa-field-control"><span class="fsa-field-icon">${icon(iconName)}</span>${control}</div></div>`;
  }

  function injectCallModal(){
    if(document.getElementById('fsaCallBackdrop'))return;
    const options=[];
    const modes=[];
    const wrap=document.createElement('div');wrap.id='fsaCallBackdrop';wrap.className='fsa-call-backdrop';wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`<section class="fsa-call-modal" role="dialog" aria-modal="true" aria-labelledby="fsaCallTitle"><div class="fsa-call-head"><span class="fsa-call-head-icon">${icon('phone')}</span><div><small>Course Guidance</small><strong id="fsaCallTitle">Request a callback</strong></div><button class="fsa-call-close" type="button" data-call-close aria-label="Close callback form">${icon('x')}</button></div><div class="fsa-call-body"><div class="fsa-call-intro"><span>${icon('sparkle')}</span><p>Tell us what you want to learn. Our team can guide you to the right course, mode and batch.</p></div><form id="fsaCallForm" novalidate><div class="fsa-call-form-grid">${fieldMarkup({label:'Full name',name:'name',placeholder:'Your name',autocomplete:'name',required:true,iconName:'user'})}${fieldMarkup({label:'Phone number',name:'phone',type:'tel',placeholder:'+91 ...',autocomplete:'tel',required:true,iconName:'phone'})}${fieldMarkup({label:'Email address',name:'email',type:'email',placeholder:'you@example.com',autocomplete:'email',required:true,iconName:'mail',full:true})}${fieldMarkup({label:'Course interested',name:'course',options,iconName:'book'})}${fieldMarkup({label:'Learning mode',name:'mode',options:modes,iconName:'layers'})}</div><button class="fsa-call-submit" type="submit"><span>${icon('phone')}</span>Request My Call</button><p class="fsa-call-status" data-call-status></p><div class="fsa-call-foot">${icon('privacy')}<span>Your details are used only to respond to this enquiry.</span></div></form></div></section>`;
    document.body.appendChild(wrap);
    const refreshChoices=()=>{
      const cfg=window.FSA_DATA?.content?.callback||{};
      const choices=[...new Set([...(window.FSA_DATA?.courses||[]).map(c=>c.title),...(cfg.extraCourses||[])])];
      for(const [name,values] of [['course',choices],['mode',cfg.modes||[]]]){
        const select=wrap.querySelector(`select[name="${name}"]`);if(!select)continue;const previous=select.value;
        select.replaceChildren(...values.map(value=>{const option=document.createElement('option');option.textContent=value;option.value=value;return option;}));
        if(values.includes(previous))select.value=previous;
      }
      initPremiumSelects(wrap);
    };
    document.addEventListener('fsa:catalog-updated',refreshChoices);document.addEventListener('fsa:content-updated',refreshChoices);
    const open=()=>{refreshChoices();document.getElementById('fsaNewsletterBackdrop')?.classList.remove('open');wrap.classList.add('open');wrap.setAttribute('aria-hidden','false');syncBodyLock();requestAnimationFrame(()=>{const body=wrap.querySelector('.fsa-call-body');if(body)body.scrollTop=0});setTimeout(()=>wrap.querySelector('input[name="name"]')?.focus({preventScroll:true}),120)};
    const close=()=>{wrap.classList.remove('open');wrap.setAttribute('aria-hidden','true');syncBodyLock()};
    document.addEventListener('click',e=>{const trigger=e.target.closest('[data-call-popup],[data-action="open-call-popup"]');if(trigger){e.preventDefault();open();return}if(e.target===wrap||e.target.closest('[data-call-close]'))close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('open'))close()});
    wrap.querySelector('#fsaCallForm').addEventListener('submit',async e=>{
      e.preventDefault();const f=e.currentTarget,status=f.querySelector('[data-call-status]'),btn=f.querySelector('button[type="submit"]');
      if(!f.checkValidity()){f.reportValidity();return}const fd=new FormData(f);status.className='fsa-call-status';status.textContent='Sending your request…';btn.disabled=true;
      try{await submitLocalInquiry({name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone'),subject:`Callback request · ${fd.get('course')}`,message:`Please call me about ${fd.get('course')}. Preferred learning mode: ${fd.get('mode')}.`});status.className='fsa-call-status success';status.textContent='Thank you — your callback request has been received.';f.reset();setTimeout(close,1700)}catch(err){status.className='fsa-call-status error';status.textContent=err.message||'Could not submit the request. Please try again.'}finally{btn.disabled=false}
    });
  }

  function injectCookieBanner(){
    if(document.getElementById('fsaCookieBanner'))return;
    const bar=document.createElement('section');bar.id='fsaCookieBanner';bar.className='fsa-cookie-banner';bar.setAttribute('aria-label','Cookie preferences');
    bar.innerHTML=`<div class="fsa-cookie-inner"><span class="fsa-cookie-icon">${icon('cookie')}</span><div class="fsa-cookie-copy"><strong>We respect your privacy.</strong><p>We use essential cookies and browser storage for sign-in, cart and preferences. Optional analytics will only be allowed if you choose “Accept all”. <a href="${localRoute('/privacy')}">Privacy policy</a></p></div><div class="fsa-cookie-actions"><button type="button" class="fsa-cookie-secondary" data-cookie-choice="essential">Necessary only</button><button type="button" class="fsa-cookie-primary" data-cookie-choice="all">Accept all</button></div></div>`;
    document.body.appendChild(bar);
    const existing=safeRead(COOKIE_KEY);if(!existing)setTimeout(()=>bar.classList.add('open'),280);
    const choose=value=>{safeWrite(COOKIE_KEY,JSON.stringify({choice:value,updated:new Date().toISOString()}));bar.classList.remove('open');window.dispatchEvent(new CustomEvent('fsa-cookie-choice',{detail:{choice:value}}));scheduleNewsletter()};
    bar.addEventListener('click',e=>{const btn=e.target.closest('[data-cookie-choice]');if(btn)choose(btn.dataset.cookieChoice)});
    document.addEventListener('click',e=>{if(!e.target.closest('[data-action="cookie-settings"]'))return;e.preventDefault();bar.classList.add('open')});
  }

  function injectNewsletterModal(){
    if(document.getElementById('fsaNewsletterBackdrop'))return;
    const wrap=document.createElement('div');wrap.id='fsaNewsletterBackdrop';wrap.className='fsa-newsletter-backdrop';wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`<section class="fsa-newsletter-modal" role="dialog" aria-modal="true" aria-labelledby="fsaNewsletterTitle"><button class="fsa-newsletter-close" type="button" data-newsletter-close aria-label="Close newsletter popup">${icon('x')}</button><div class="fsa-newsletter-visual"><span>${icon('mail')}</span><small>FSA Updates</small></div><div class="fsa-newsletter-content"><span class="fsa-newsletter-kicker">Stay Ahead</span><h2 id="fsaNewsletterTitle">Useful course & batch updates, without the noise.</h2><p>Get new course announcements, upcoming batch updates and academy news in your inbox.</p><form id="fsaNewsletterForm" novalidate><label><span>Your name <em>Optional</em></span><div class="fsa-newsletter-control"><i>${icon('user')}</i><input name="name" autocomplete="name" placeholder="Your name"></div></label><label><span>Email address *</span><div class="fsa-newsletter-control"><i>${icon('mail')}</i><input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div></label><button type="submit"><span>${icon('arrow')}</span>Subscribe</button><p class="fsa-newsletter-status" data-newsletter-status></p><small class="fsa-newsletter-privacy">By subscribing you agree to receive academy updates. You can unsubscribe from future emails at any time.</small></form></div></section>`;
    document.body.appendChild(wrap);
    const open=()=>{if(document.getElementById('fsaCallBackdrop')?.classList.contains('open'))return;wrap.classList.add('open');wrap.setAttribute('aria-hidden','false');syncBodyLock();setTimeout(()=>wrap.querySelector('input[name="email"]')?.focus({preventScroll:true}),120)};
    const close=(remember=true)=>{wrap.classList.remove('open');wrap.setAttribute('aria-hidden','true');syncBodyLock();if(remember)safeWrite(NEWSLETTER_DISMISS_KEY,String(Date.now()))};
    wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('[data-newsletter-close]'))close(true)});
    document.addEventListener('click',e=>{if(!e.target.closest('[data-action="open-newsletter-popup"]'))return;e.preventDefault();open()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('open'))close(true)});
    wrap.querySelector('#fsaNewsletterForm').addEventListener('submit',async e=>{
      e.preventDefault();const f=e.currentTarget,status=f.querySelector('[data-newsletter-status]'),btn=f.querySelector('button[type="submit"]');if(!f.checkValidity()){f.reportValidity();return}const fd=new FormData(f);status.className='fsa-newsletter-status';status.textContent='Subscribing…';btn.disabled=true;
      try{await submitLocalInquiry({name:String(fd.get('name')||'Newsletter Subscriber').trim()||'Newsletter Subscriber',email:fd.get('email'),phone:'',subject:'Newsletter subscription',message:'Subscribed to Full Stack Academy course, batch and academy updates through the website newsletter popup.'});safeWrite(NEWSLETTER_SUB_KEY,'1');status.className='fsa-newsletter-status success';status.textContent='Subscribed — welcome to FSA updates.';f.reset();setTimeout(()=>close(false),1400)}catch(err){status.className='fsa-newsletter-status error';status.textContent=err.message||'Could not subscribe. Please try again.'}finally{btn.disabled=false}
    });
    window.FSA_OPEN_NEWSLETTER=open;
  }

  let newsletterTimer=0;
  function scheduleNewsletter(){
    clearTimeout(newsletterTimer);
    if(safeRead(NEWSLETTER_SUB_KEY)==='1')return;
    const dismissed=Number(safeRead(NEWSLETTER_DISMISS_KEY)||0);if(dismissed&&Date.now()-dismissed<7*24*60*60*1000)return;
    newsletterTimer=setTimeout(function tryOpen(){
      const cookie=document.getElementById('fsaCookieBanner');
      if(!safeRead(COOKIE_KEY)||cookie?.classList.contains('open')||modalIsOpen()||document.visibilityState!=='visible'){newsletterTimer=setTimeout(tryOpen,3500);return}
      window.FSA_OPEN_NEWSLETTER?.();
    },9000);
  }

  function injectFooterPrivacyControls(root=document){
    root.querySelectorAll('.footer-policy-links,.footer-policy-inline').forEach(row=>{
      if(!row.querySelector('[data-action="cookie-settings"]')){const b=document.createElement('button');b.type='button';b.className='footer-policy-button';b.dataset.action='cookie-settings';b.innerHTML=`<span class="premium-link-icon">${icon('cookie')}</span>Cookie Settings`;row.appendChild(b)}
      if(!row.querySelector('[data-action="open-newsletter-popup"]')){const b=document.createElement('button');b.type='button';b.className='footer-policy-button';b.dataset.action='open-newsletter-popup';b.innerHTML=`<span class="premium-link-icon">${icon('mail')}</span>Newsletter`;row.appendChild(b)}
    });
  }

  /* Learner review experience. Only mounted on conversion-relevant public pages. */
  const reviewEsc=value=>String(value??'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
  const backendWrittenReviews=()=> (window.FSA_DATA?.reviews||[]).filter(r=>r.type==='written').map(r=>({...r,name:reviewEsc(r.name),avatar:reviewEsc(r.avatar),comment:reviewEsc(r.text),course:reviewEsc(r.course||r.role),rating:Math.max(1,Math.min(5,Number(r.rating||5)))}));
  const backendVideoReviews=()=> (window.FSA_DATA?.reviews||[]).filter(r=>r.type==='video'&&r.videoUrl).map(r=>({src:reviewEsc(r.videoUrl),poster:reviewEsc(r.thumbnail||r.avatar||''),label:reviewEsc(r.name),caption:reviewEsc(r.role||r.course||''),badge:reviewEsc(r.text||'')}));
  const reviewAsset=src=>onBranch()?`../../${src}`:src;
  const reviewStars=count=>`<span class="stars" aria-label="${count} out of 5 stars">${Array.from({length:count},()=>icon('star','',true)).join('')}</span>`;
  const reviewInitials=name=>String(name||'FSA').trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>part.charAt(0)).join('').toUpperCase()||'FSA';
  const reviewAvatar=item=>item.avatar?`<span class="avatar"><img src="${reviewAsset(item.avatar)}" alt="${item.name}" loading="lazy" decoding="async"></span>`:`<span class="avatar fsa-review-avatar-fallback" aria-hidden="true">${reviewInitials(item.name)}</span>`;
  const reviewCard=item=>`<article class="fsa-home-testimonial"><div class="fsa-home-testimonial-top"><span class="fsa-quote-mark" aria-hidden="true">“</span><div class="fsa-home-testimonial-stars">${reviewStars(item.rating||5)}</div></div><p>${item.comment}</p><div class="fsa-home-testimonial-user">${reviewAvatar(item)}<span><strong>${item.name}</strong><small>${item.course}</small></span></div></article>`;

  const videoReviewCard=(item,index)=>{const poster=reviewAsset(item.poster);
    const yt=String(item.src).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    const vm=String(item.src).match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if(yt||vm){const url=yt?`https://www.youtube.com/embed/${yt[1]}`:`https://player.vimeo.com/video/${vm[1]}`;return `<article class="fsa-video-review-card"><div class="fsa-review-phone"><div class="fsa-review-phone-screen"><iframe src="${url}" title="${item.label}" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;border:0"></iframe></div></div><div class="fsa-video-review-meta"><strong>${item.label}</strong><span>${item.caption}</span></div></article>`;}
    return `<article class="fsa-video-review-card is-video-loading" data-video-review-card><div class="fsa-review-phone" data-video-shell><span class="fsa-review-phone-speaker" aria-hidden="true"></span><div class="fsa-review-phone-screen"><img class="fsa-video-fallback" src="${poster}" alt="Temporary preview for ${item.label}" loading="eager" decoding="sync"><video playsinline preload="metadata" poster="${poster}" data-review-video aria-label="${item.label}"><source src="${item.src}" type="video/mp4">Your browser does not support HTML video.</video><div class="fsa-video-vignette" aria-hidden="true"></div><span class="fsa-stock-video-badge">${item.badge||''}</span><span class="fsa-video-load-status" aria-live="polite"></span><button type="button" class="fsa-video-center-play" data-video-action="toggle" aria-label="Play ${item.label}">${icon('playSolid')}</button><div class="fsa-video-controls" data-video-controls><div class="fsa-video-progress-wrap"><input type="range" min="0" max="1000" value="0" step="1" data-video-progress aria-label="Video progress"></div><div class="fsa-video-control-row"><button type="button" data-video-action="toggle" aria-label="Play or pause">${icon('playSolid')}</button><span class="fsa-video-time" data-video-time>0:00 / 0:00</span><span class="fsa-video-control-spacer"></span><button type="button" data-video-action="mute" aria-label="Mute or unmute">${icon('volume')}</button><button type="button" data-video-action="fullscreen" aria-label="View fullscreen">${icon('fullscreen')}</button></div></div></div></div><div class="fsa-video-review-meta"><strong>${item.label}</strong><span>${item.caption||''}</span></div></article>`;}

  function injectReviewStyles(){
    if(document.getElementById('fsaRelevantReviewStyles'))return;
    const style=document.createElement('style');style.id='fsaRelevantReviewStyles';
    style.textContent=`
      #fsaRelevantReviews{padding:78px 0;background:#f7f8f7;color:#21332d;overflow:hidden}
      #fsaRelevantReviews *{box-sizing:border-box}
      #fsaRelevantReviews .container{width:min(var(--container,1350px),calc(100% - 40px));margin-inline:auto}
      #fsaRelevantReviews .fsa-review-heading-row{display:flex;align-items:flex-end;justify-content:space-between;gap:34px;margin-bottom:24px}
      #fsaRelevantReviews .fsa-home-heading{max-width:760px;margin:0;text-align:left}
      #fsaRelevantReviews .fsa-home-heading>span{display:flex;align-items:center;gap:10px;margin-bottom:10px;color:var(--brand);font-family:Poppins,Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
      #fsaRelevantReviews .fsa-home-heading>span:before{content:"";width:32px;height:2px;background:var(--brand)}
      #fsaRelevantReviews .fsa-home-heading h2{margin:0 0 10px;color:#21332d;font-family:Poppins,Inter,sans-serif;font-size:clamp(34px,4vw,54px);font-weight:600;line-height:1.08;letter-spacing:-.045em}
      #fsaRelevantReviews .fsa-home-heading h2 em{color:var(--brand);font-style:normal}
      #fsaRelevantReviews .fsa-home-heading p{margin:0;max-width:690px;color:#72807a;font-size:14px;line-height:1.7}
      #fsaRelevantReviews .fsa-review-tabs{display:inline-flex;align-items:center;gap:6px;padding:5px;border:1px solid #e9dcde;border-radius:999px;background:#fff;box-shadow:0 8px 26px rgba(60,30,34,.05)}
      #fsaRelevantReviews .fsa-review-tab{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 18px;border:0;border-radius:999px;background:transparent;color:#65716c;font:600 12px/1 Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap;transition:.2s ease}
      #fsaRelevantReviews .fsa-review-tab svg{width:16px;height:16px}
      #fsaRelevantReviews .fsa-review-tab.active{background:var(--brand);color:#fff;box-shadow:0 7px 20px rgba(var(--brand-rgb),.18)}
      #fsaRelevantReviews .fsa-review-panel[hidden]{display:none!important}
      #fsaRelevantReviews .fsa-review-panel{animation:fsaReviewFade .25s ease}
      @keyframes fsaReviewFade{from{opacity:.4;transform:translateY(4px)}to{opacity:1;transform:none}}

      #fsaRelevantReviews .fsa-review-slider-head{display:flex;align-items:center;justify-content:flex-end;gap:18px;margin:0 0 16px}
      #fsaRelevantReviews .fsa-review-slider-note{display:flex;align-items:center;gap:9px;color:#72807a;font-size:10px;font-weight:600}
      #fsaRelevantReviews .fsa-review-slider-note:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--brand);box-shadow:0 0 0 5px rgba(var(--brand-rgb),.08)}
      #fsaRelevantReviews .fsa-review-slider-controls{display:flex;align-items:center;gap:9px}
      #fsaRelevantReviews .fsa-review-slider-controls button{width:42px;height:42px;display:grid;place-items:center;border:1px solid #eadbdd;border-radius:50%;background:#fff;color:var(--brand);cursor:pointer;transition:.2s ease;padding:0;box-shadow:0 6px 18px rgba(61,31,35,.04)}
      #fsaRelevantReviews .fsa-review-slider-controls button:hover{background:var(--brand);border-color:var(--brand);color:#fff;transform:translateY(-1px)}
      #fsaRelevantReviews .fsa-review-slider-controls button svg{width:16px;height:16px}
      #fsaRelevantReviews .fsa-review-slider-count{min-width:62px;text-align:center;color:#8d9692;font-size:10px;font-weight:600}
      #fsaRelevantReviews .fsa-review-slider-count b{color:#21332d;font-size:12px}

      #fsaRelevantReviews .fsa-video-review-carousel{width:100%;overflow:hidden!important}
      #fsaRelevantReviews .fsa-video-review-rail{display:flex;gap:14px;width:100%;padding:4px 1px 10px;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior-x:contain}
      #fsaRelevantReviews .fsa-video-review-rail::-webkit-scrollbar{display:none;width:0;height:0}
      #fsaRelevantReviews .fsa-video-review-card{flex:0 0 calc((100% - 56px)/5);min-width:0;scroll-snap-align:start;text-align:center}
      #fsaRelevantReviews .fsa-review-phone{position:relative;width:100%;max-width:238px;aspect-ratio:9/16;margin:0 auto;padding:6px;border-radius:32px;background:linear-gradient(155deg,#25302c,#111714);box-shadow:0 18px 46px rgba(31,49,42,.18),0 0 0 1px rgba(255,255,255,.36) inset;transition:.25s ease}
      #fsaRelevantReviews .fsa-video-review-card:hover .fsa-review-phone{transform:translateY(-4px);box-shadow:0 25px 58px rgba(31,49,42,.24),0 0 0 1px rgba(255,255,255,.36) inset}
      #fsaRelevantReviews .fsa-review-phone:before{content:"";position:absolute;inset:2px;border:1px solid rgba(255,255,255,.12);border-radius:30px;pointer-events:none;z-index:8}
      #fsaRelevantReviews .fsa-review-phone-speaker{position:absolute;z-index:9;left:50%;top:11px;transform:translateX(-50%);width:58px;height:16px;border-radius:16px;background:#0d1210;box-shadow:0 1px 0 rgba(255,255,255,.09)}
      #fsaRelevantReviews .fsa-review-phone-screen{position:relative;width:100%;height:100%;overflow:hidden;border-radius:27px;background:#d8ddda;isolation:isolate}
      #fsaRelevantReviews .fsa-video-fallback{position:absolute;inset:0;z-index:1;width:100%;height:100%;display:block;object-fit:cover;object-position:center;background:#d8ddda;opacity:1;visibility:visible;transition:opacity .28s ease,visibility .28s ease}
      #fsaRelevantReviews .fsa-review-phone video{position:absolute;inset:0;z-index:2;width:100%!important;height:100%!important;display:block;object-fit:cover!important;object-position:center center;background:transparent;border:0;margin:0;padding:0;opacity:0;transition:opacity .28s ease}
      #fsaRelevantReviews .fsa-video-review-card.has-video-started .fsa-review-phone video,#fsaRelevantReviews .fsa-video-review-card.is-playing .fsa-review-phone video{opacity:1}
      #fsaRelevantReviews .fsa-video-review-card.has-video-started .fsa-video-fallback{opacity:0}
      #fsaRelevantReviews .fsa-video-review-card.has-video-error .fsa-review-phone video{opacity:0!important}
      #fsaRelevantReviews .fsa-video-review-card.has-video-error .fsa-video-fallback{opacity:1!important}
      #fsaRelevantReviews .fsa-video-load-status{position:absolute;z-index:6;left:50%;bottom:58px;transform:translateX(-50%);max-width:80%;padding:5px 8px;border-radius:999px;background:rgba(20,31,27,.7);color:#fff;font-size:7px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:.2s ease}
      #fsaRelevantReviews .fsa-video-review-card.has-video-error .fsa-video-load-status{opacity:1}
      #fsaRelevantReviews .fsa-video-vignette{position:absolute;inset:0;z-index:3;background:linear-gradient(to bottom,rgba(8,15,12,.08) 52%,rgba(8,15,12,.72) 100%);pointer-events:none}
      #fsaRelevantReviews .fsa-stock-video-badge{position:absolute;left:11px;top:12px;z-index:6;padding:6px 9px;border-radius:999px;background:rgba(20,31,27,.66);backdrop-filter:blur(9px);color:#fff;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}
      #fsaRelevantReviews .fsa-video-center-play{position:absolute;z-index:7;left:50%;top:50%;transform:translate(-50%,-50%);width:50px;height:50px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.62);border-radius:50%;background:rgba(255,255,255,.92);color:var(--brand);box-shadow:0 9px 24px rgba(0,0,0,.18);cursor:pointer;transition:.2s ease;padding:0}
      #fsaRelevantReviews .fsa-video-center-play svg{width:22px;height:22px;margin-left:2px}
      #fsaRelevantReviews .fsa-video-review-card.is-playing .fsa-video-center-play{opacity:0;visibility:hidden;transform:translate(-50%,-50%) scale(.86)}
      #fsaRelevantReviews .fsa-video-review-card:not(.is-playing):hover .fsa-video-center-play{transform:translate(-50%,-50%) scale(1.06)}
      #fsaRelevantReviews .fsa-video-controls{position:absolute;z-index:8;left:9px;right:9px;bottom:9px;padding:8px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:rgba(15,24,20,.62);backdrop-filter:blur(11px);opacity:0;transform:translateY(7px);transition:.22s ease}
      #fsaRelevantReviews .fsa-video-review-card:hover .fsa-video-controls,#fsaRelevantReviews .fsa-video-review-card.is-playing .fsa-video-controls,#fsaRelevantReviews .fsa-video-review-card:focus-within .fsa-video-controls{opacity:1;transform:none}
      #fsaRelevantReviews .fsa-video-progress-wrap{height:8px;display:flex;align-items:center;margin-bottom:4px}
      #fsaRelevantReviews .fsa-video-progress-wrap input{appearance:none;-webkit-appearance:none;width:100%;height:3px;border-radius:99px;background:linear-gradient(to right,#fff 0 var(--video-progress,0%),rgba(255,255,255,.28) var(--video-progress,0%) 100%);outline:0;cursor:pointer}
      #fsaRelevantReviews .fsa-video-progress-wrap input::-webkit-slider-thumb{-webkit-appearance:none;width:9px;height:9px;border:0;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(var(--brand-rgb),.65)}
      #fsaRelevantReviews .fsa-video-progress-wrap input::-moz-range-thumb{width:9px;height:9px;border:0;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(var(--brand-rgb),.65)}
      #fsaRelevantReviews .fsa-video-control-row{display:flex;align-items:center;gap:6px;color:#fff}
      #fsaRelevantReviews .fsa-video-control-row button{width:27px;height:27px;display:grid;place-items:center;flex:0 0 27px;padding:0;border:0;border-radius:8px;background:rgba(255,255,255,.10);color:#fff;cursor:pointer;transition:.18s ease}
      #fsaRelevantReviews .fsa-video-control-row button:hover{background:#fff;color:var(--brand)}
      #fsaRelevantReviews .fsa-video-control-row button svg{width:13px;height:13px}
      #fsaRelevantReviews .fsa-video-time{font-size:7.5px;font-weight:600;white-space:nowrap;opacity:.88}
      #fsaRelevantReviews .fsa-video-control-spacer{flex:1}
      #fsaRelevantReviews .fsa-video-review-meta{width:100%;margin:11px auto 0;display:flex;flex-direction:column;align-items:center;gap:3px}
      #fsaRelevantReviews .fsa-video-review-meta strong{color:#21332d;font-size:10px;font-weight:700}
      #fsaRelevantReviews .fsa-video-review-meta span{color:#87918c;font-size:8px}
      #fsaRelevantReviews .fsa-review-avatar-fallback{display:grid!important;place-items:center;background:linear-gradient(145deg,var(--accent-soft-2),var(--accent-soft-3));color:var(--brand);font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase}
      #fsaRelevantReviews .fsa-video-dots,#fsaRelevantReviews .fsa-written-dots{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px}
      #fsaRelevantReviews .fsa-review-dot{width:6px;height:6px;padding:0;border:0;border-radius:99px;background:#d7d2d3;cursor:pointer;transition:.22s ease}
      #fsaRelevantReviews .fsa-review-dot.active{width:23px;background:var(--brand)}

      #fsaRelevantReviews .fsa-testimonial-carousel{width:100%;overflow:hidden!important}
      #fsaRelevantReviews .fsa-home-testimonial-track{display:flex;gap:22px;padding:2px 1px 14px;overflow-x:auto!important;overflow-y:hidden!important;max-height:none!important;scrollbar-width:none!important;-ms-overflow-style:none!important;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;overscroll-behavior-y:auto;scroll-behavior:smooth}
      #fsaRelevantReviews .fsa-home-testimonial-track::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
      #fsaRelevantReviews .fsa-home-testimonial-slide{flex:0 0 calc((100% - 44px)/3);min-width:0;scroll-snap-align:start}
      #fsaRelevantReviews .fsa-home-testimonial{position:relative;height:100%;min-height:286px;display:flex;flex-direction:column;padding:26px;border:1px solid #e8e3e3;border-radius:17px;background:#fff;box-shadow:0 12px 32px rgba(76,27,33,.035);overflow:hidden}
      #fsaRelevantReviews .fsa-home-testimonial-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      #fsaRelevantReviews .fsa-quote-mark{color:#f0d3d7;font:50px/.8 Georgia,serif}
      #fsaRelevantReviews .fsa-home-testimonial-stars .stars{display:flex;gap:3px;margin:0;color:var(--brand)}
      #fsaRelevantReviews .fsa-home-testimonial-stars .stars svg{width:15px;height:15px;fill:currentColor}
      #fsaRelevantReviews .fsa-home-testimonial>p{flex:1;margin:25px 0 24px;color:#65716c;font-size:11px;line-height:1.85}
      #fsaRelevantReviews .fsa-home-testimonial-user{display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid #eee7e8}
      #fsaRelevantReviews .fsa-home-testimonial-user .avatar{width:50px;height:50px;flex:0 0 50px;display:block;overflow:hidden;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #eadbdd,0 7px 18px rgba(83,24,32,.10)}
      #fsaRelevantReviews .fsa-home-testimonial-user .avatar img{width:100%;height:100%;display:block;object-fit:cover;object-position:center top}
      #fsaRelevantReviews .fsa-home-testimonial-user strong,#fsaRelevantReviews .fsa-home-testimonial-user small{display:block}
      #fsaRelevantReviews .fsa-home-testimonial-user strong{color:#21332d;font-size:10px}
      #fsaRelevantReviews .fsa-home-testimonial-user small{margin-top:3px;color:#7a8380;font-size:8.5px}

      @media(max-width:1200px){
        #fsaRelevantReviews .fsa-video-review-card{flex-basis:calc((100% - 42px)/4)}
      }
      @media(max-width:940px){
        #fsaRelevantReviews .fsa-video-review-card{flex-basis:calc((100% - 28px)/3)}
        #fsaRelevantReviews .fsa-home-testimonial-slide{flex-basis:calc((100% - 22px)/2)}
      }
      @media(max-width:720px){
        #fsaRelevantReviews{padding:60px 0}
        #fsaRelevantReviews .container{width:min(100% - 28px,var(--container,1350px))}
        #fsaRelevantReviews .fsa-review-heading-row{align-items:flex-start;flex-direction:column;gap:20px}
        #fsaRelevantReviews .fsa-home-heading h2{font-size:34px}
        #fsaRelevantReviews .fsa-review-tabs{width:100%;display:grid;grid-template-columns:1fr 1fr;border-radius:16px}
        #fsaRelevantReviews .fsa-review-tab{width:100%;padding:0 10px;border-radius:12px}
        #fsaRelevantReviews .fsa-review-slider-head{margin-bottom:12px}
        #fsaRelevantReviews .fsa-review-slider-note{font-size:9px}
        #fsaRelevantReviews .fsa-review-slider-controls button{width:38px;height:38px}
        #fsaRelevantReviews .fsa-video-review-rail{gap:12px;margin-right:-14px;padding-right:14px}
        #fsaRelevantReviews .fsa-video-review-card{flex:0 0 min(72vw,250px)}
        #fsaRelevantReviews .fsa-review-phone{max-width:none}
        #fsaRelevantReviews .fsa-video-controls{opacity:1;transform:none}
        #fsaRelevantReviews .fsa-home-testimonial-slide{flex-basis:88%}
        #fsaRelevantReviews .fsa-home-testimonial{min-height:280px}
      }
      @media(max-width:430px){
        #fsaRelevantReviews .fsa-home-heading h2{font-size:30px}
        #fsaRelevantReviews .fsa-review-slider-note span{display:none}
        #fsaRelevantReviews .fsa-video-review-card{flex-basis:min(76vw,245px)}
        #fsaRelevantReviews .fsa-home-testimonial-slide{flex-basis:94%}
      }

      /* V42 compact-window guard: keep the assistant fully visible without becoming a full-height drawer. */
      .fsa-ai-panel{top:auto!important;inset-block-start:auto!important}
      .fsa-ai-messages{overscroll-behavior:contain;scrollbar-gutter:stable}
      @media(prefers-reduced-motion:reduce){#fsaRelevantReviews .fsa-review-panel{animation:none!important}#fsaRelevantReviews .fsa-video-review-rail,#fsaRelevantReviews .fsa-home-testimonial-track{scroll-behavior:auto!important}}
    `;
    document.head.appendChild(style);
  }

  function reviewExperienceMarkup(){
    return `<section id="fsaRelevantReviews" class="fsa-home-section fsa-home-testimonials-section" data-relevant-review-experience><div class="container"><div class="fsa-review-heading-row"><div class="fsa-home-heading fsa-home-heading-left"><span>Student Experience</span><h2>Hear It From Our <em>Learners</em></h2><p>Watch learner-style video stories first, or switch to written feedback from Full Stack Academy students and alumni.</p></div><div class="fsa-review-tabs" role="tablist" aria-label="Student review format"><button class="fsa-review-tab active" type="button" role="tab" aria-selected="true" data-review-tab="video">${icon('video')} Video Reviews</button><button class="fsa-review-tab" type="button" role="tab" aria-selected="false" data-review-tab="written">${icon('star')} Written Reviews</button></div></div><div class="fsa-review-panel" data-review-panel="video" role="tabpanel"><div class="fsa-review-slider-head"><div class="fsa-review-slider-controls" aria-label="Video testimonial slider controls"><button type="button" data-video-review-prev aria-label="Previous video review">${icon('arrowLeft')}</button><button type="button" data-video-review-next aria-label="Next video review">${icon('arrow')}</button></div></div><div class="fsa-video-review-carousel"><div class="fsa-video-review-rail" data-video-review-track>${backendVideoReviews().map(videoReviewCard).join('')}</div></div></div><div class="fsa-review-panel" data-review-panel="written" role="tabpanel" hidden><div class="fsa-review-slider-head"><div class="fsa-review-slider-controls" aria-label="Written testimonial slider controls"><button type="button" data-relevant-review-prev aria-label="Previous testimonial">${icon('arrowLeft')}</button><button type="button" data-relevant-review-next aria-label="Next testimonial">${icon('arrow')}</button></div></div><div class="fsa-testimonial-carousel"><div class="fsa-home-testimonial-track" data-relevant-review-track>${backendWrittenReviews().map(item=>`<div class="fsa-home-testimonial-slide" data-relevant-review-card>${reviewCard(item)}</div>`).join('')}</div></div></div></div></section>`;
  }

  let activeReviewSection=null,activeReviewCleanup=null;
  function clearRelevantReviews(){
    if(activeReviewCleanup){try{activeReviewCleanup()}catch(_){}}
    activeReviewCleanup=null;activeReviewSection=null;
  }

  function initRelevantReviews(section){
    if(!section)return;
    if(activeReviewSection===section&&section.dataset.reviewReady==='1')return;
    clearRelevantReviews();
    section.dataset.reviewReady='1';
    const tabButtons=[...section.querySelectorAll('[data-review-tab]')];
    const panels=[...section.querySelectorAll('[data-review-panel]')];
    const videos=[...section.querySelectorAll('[data-review-video]')];
    const videoTrack=section.querySelector('[data-video-review-track]');
    const videoCards=[...section.querySelectorAll('[data-video-review-card]')];
    const videoPrev=section.querySelector('[data-video-review-prev]');
    const videoNext=section.querySelector('[data-video-review-next]');
    const track=section.querySelector('[data-relevant-review-track]');
    const cards=[...section.querySelectorAll('[data-relevant-review-card]')];
    const prev=section.querySelector('[data-relevant-review-prev]');
    const next=section.querySelector('[data-relevant-review-next]');
    let videoFrame=0,writtenFrame=0,videoAuto=null,writtenAuto=null,activeTab='video';

    const fmtTime=value=>{
      const n=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
      const m=Math.floor(n/60),sec=String(n%60).padStart(2,'0');
      return `${m}:${sec}`;
    };
    const indexFor=(rail,items)=>{
      if(!rail||!items.length)return 0;
      const left=rail.scrollLeft;let best=0,d=Infinity;
      items.forEach((card,i)=>{const x=Math.abs((card.offsetLeft-rail.offsetLeft)-left);if(x<d){d=x;best=i}});
      return best;
    };
    const scrollToIndex=(rail,items,i)=>{
      if(!rail||!items.length)return;
      const normalized=(i+items.length)%items.length,card=items[normalized];
      rail.scrollTo({left:Math.max(0,card.offsetLeft-rail.offsetLeft),behavior:'smooth'});
    };
    const updateVideoPosition=()=>{};
    const updateWrittenPosition=()=>{};
    const pauseOtherVideos=keep=>videos.forEach(video=>{if(video!==keep&&!video.paused){try{video.pause()}catch(_){}}});
    const updateVideoUi=video=>{
      const card=video.closest('[data-video-review-card]');if(!card)return;
      const playing=!video.paused&&!video.ended;
      card.classList.toggle('is-playing',playing);
      const toggleButtons=[...card.querySelectorAll('[data-video-action="toggle"]')];
      toggleButtons.forEach((btn,idx)=>{
        const replay=video.ended;
        btn.innerHTML=icon(replay?'replay':playing?'pause':'playSolid');
        btn.setAttribute('aria-label',replay?'Replay video':playing?'Pause video':'Play video');
        if(idx===0)btn.querySelector('svg')?.setAttribute('aria-hidden','true');
      });
      const mute=card.querySelector('[data-video-action="mute"]');
      if(mute){mute.innerHTML=icon(video.muted||video.volume===0?'mute':'volume');mute.setAttribute('aria-label',video.muted||video.volume===0?'Unmute video':'Mute video')}
      const progress=card.querySelector('[data-video-progress]');
      const time=card.querySelector('[data-video-time]');
      const pct=video.duration&&Number.isFinite(video.duration)?Math.min(100,(video.currentTime/video.duration)*100):0;
      if(progress){progress.value=String(Math.round(pct*10));progress.style.setProperty('--video-progress',`${pct}%`)}
      if(time)time.textContent=`${fmtTime(video.currentTime)} / ${fmtTime(video.duration)}`;
    };
    const toggleVideo=video=>{
      if(video.ended){try{video.currentTime=0}catch(_){}}
      if(video.paused||video.ended){pauseOtherVideos(video);const play=video.play();if(play&&typeof play.catch==='function')play.catch(()=>{})}else video.pause();
    };

    videoCards.forEach(card=>{
      const video=card.querySelector('[data-review-video]');if(!video)return;
      const screen=card.querySelector('.fsa-review-phone-screen');
      const progress=card.querySelector('[data-video-progress]');
      card.querySelectorAll('[data-video-action="toggle"]').forEach(btn=>btn.addEventListener('click',event=>{event.stopPropagation();toggleVideo(video)}));
      card.querySelector('[data-video-action="mute"]')?.addEventListener('click',event=>{event.stopPropagation();video.muted=!video.muted;updateVideoUi(video)});
      card.querySelector('[data-video-action="fullscreen"]')?.addEventListener('click',async event=>{
        event.stopPropagation();
        const shell=card.querySelector('[data-video-shell]');
        try{if(shell?.requestFullscreen)await shell.requestFullscreen();else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen()}catch(_){}
      });
      progress?.addEventListener('input',event=>{
        event.stopPropagation();
        if(video.duration&&Number.isFinite(video.duration)){video.currentTime=(Number(progress.value)/1000)*video.duration;updateVideoUi(video)}
      });
      screen?.addEventListener('click',event=>{
        if(event.target.closest('button,input')||card.classList.contains('has-video-error'))return;
        toggleVideo(video);
      });
      const markVideoReady=()=>{card.classList.remove('is-video-loading','has-video-error');card.classList.add('is-video-ready');const status=card.querySelector('.fsa-video-load-status');if(status)status.textContent='';updateVideoUi(video)};
      const markVideoError=()=>{card.classList.remove('is-video-loading','is-video-ready','is-playing');card.classList.add('has-video-error');const status=card.querySelector('.fsa-video-load-status');if(status)status.textContent='Preview image shown';const playButtons=[...card.querySelectorAll('[data-video-action="toggle"]')];playButtons.forEach(btn=>{btn.disabled=true;btn.setAttribute('aria-label','Video preview unavailable')});updateVideoUi(video)};
      ['loadedmetadata','loadeddata','canplay','durationchange','timeupdate','play','pause','ended','volumechange'].forEach(type=>video.addEventListener(type,()=>{
        if(type==='loadeddata'||type==='canplay')markVideoReady();
        if(type==='play'){pauseOtherVideos(video);card.classList.add('has-video-started')}
        updateVideoUi(video);
      }));
      video.addEventListener('error',markVideoError);
      video.querySelector('source')?.addEventListener('error',markVideoError);
      if(video.readyState>=2)markVideoReady();
      updateVideoUi(video);
    });

    const setTab=name=>{
      activeTab=name;
      tabButtons.forEach(btn=>{const active=btn.dataset.reviewTab===name;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false')});
      panels.forEach(panel=>panel.hidden=panel.dataset.reviewPanel!==name);
      if(name!=='video')videos.forEach(video=>{try{video.pause()}catch(_){}});
      requestAnimationFrame(()=>{updateVideoPosition();updateWrittenPosition()});
    };
    tabButtons.forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.reviewTab)));

    videoPrev?.addEventListener('click',()=>scrollToIndex(videoTrack,videoCards,indexFor(videoTrack,videoCards)-1));
    videoNext?.addEventListener('click',()=>scrollToIndex(videoTrack,videoCards,indexFor(videoTrack,videoCards)+1));
    videoTrack?.addEventListener('scroll',()=>{if(videoFrame)cancelAnimationFrame(videoFrame);videoFrame=requestAnimationFrame(updateVideoPosition)},{passive:true});

    prev?.addEventListener('click',()=>scrollToIndex(track,cards,indexFor(track,cards)-1));
    next?.addEventListener('click',()=>scrollToIndex(track,cards,indexFor(track,cards)+1));
    track?.addEventListener('scroll',()=>{if(writtenFrame)cancelAnimationFrame(writtenFrame);writtenFrame=requestAnimationFrame(updateWrittenPosition)},{passive:true});

    updateVideoPosition();updateWrittenPosition();
    videoAuto=setInterval(()=>{
      if(activeTab!=='video'||document.hidden||!videoTrack||videoTrack.matches(':hover')||section.matches(':focus-within')||videos.some(video=>!video.paused&&!video.ended))return;
      scrollToIndex(videoTrack,videoCards,indexFor(videoTrack,videoCards)+1);
    },7000);
    writtenAuto=setInterval(()=>{
      if(activeTab!=='written'||document.hidden||!track||track.matches(':hover')||section.matches(':focus-within'))return;
      scrollToIndex(track,cards,indexFor(track,cards)+1);
    },6500);

    activeReviewSection=section;
    activeReviewCleanup=()=>{
      videos.forEach(video=>{try{video.pause()}catch(_){}});
      if(videoFrame)cancelAnimationFrame(videoFrame);if(writtenFrame)cancelAnimationFrame(writtenFrame);
      if(videoAuto)clearInterval(videoAuto);if(writtenAuto)clearInterval(writtenAuto);
    };
  }

  function currentSpaPath(){return decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]||'/'}
  function reviewRouteIsRelevant(path){return path==='/'||path==='/courses'||path==='/batches'||path==='/alumni'}

  function mountRelevantReviews(){
    injectReviewStyles();
    /* Never add the general review module to standalone branch pages. */
    if(onBranch()){
      document.querySelector('#fsaSitewideReviews')?.remove();
      document.querySelector('#fsaRelevantReviews')?.remove();
      clearRelevantReviews();
      return;
    }
    const app=document.getElementById('app');
    if(!app)return;
    const publicMode=document.body.dataset.mode==='public';
    const path=currentSpaPath();
    const relevant=publicMode&&reviewRouteIsRelevant(path);
    /* Remove the previous V30 site-wide block if it survives a soft navigation. */
    app.querySelector('#fsaSitewideReviews')?.remove();
    let section=app.querySelector('#fsaRelevantReviews');
    const nativeHome=app.querySelector('[data-home-testimonial-carousel]');
    const homeAnchor=app.querySelector('[data-review-experience-anchor]');

    if(!relevant){
      section?.remove();
      /* Native home reviews should never leak to a non-home route, but remove them defensively. */
      if(path!=='/')nativeHome?.remove();
      clearRelevantReviews();
      return;
    }

    if(path==='/'&&homeAnchor){
      homeAnchor.insertAdjacentHTML('beforebegin',reviewExperienceMarkup());
      homeAnchor.remove();
      nativeHome?.remove();
      section=app.querySelector('#fsaRelevantReviews');
    }else if(path==='/'&&nativeHome){
      nativeHome.insertAdjacentHTML('beforebegin',reviewExperienceMarkup());
      nativeHome.remove();
      section=app.querySelector('#fsaRelevantReviews');
    }else if(!section){
      app.insertAdjacentHTML('beforeend',reviewExperienceMarkup());
      section=app.querySelector('#fsaRelevantReviews');
    }
    if(section)section.dataset.mountedPath=path;
    initRelevantReviews(section);
  }

  let reviewMountFrame=0;
  function scheduleRelevantReviews(){
    if(reviewMountFrame)cancelAnimationFrame(reviewMountFrame);
    reviewMountFrame=requestAnimationFrame(()=>{reviewMountFrame=0;mountRelevantReviews()});
  }

  function enhance(root=document){fillPremiumIcons(root);initPremiumSelects(root);decorateFooter(root);enforceLocalLinks(root);initScrollRows(root);injectFooterPrivacyControls(root)}
  document.addEventListener('DOMContentLoaded',()=>{
    injectCallModal();injectNewsletterModal();injectCookieBanner();enhance();scheduleNewsletter();injectReviewStyles();scheduleRelevantReviews();
    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>{enhance(app);scheduleRelevantReviews()}).observe(app,{childList:true,subtree:true});
    window.addEventListener('hashchange',scheduleRelevantReviews);
  });
})();

/* --------------------------------------------------------------------------
   FSA Language Switcher + Accessibility Toolbar — V49
   Site-wide, persistent visitor preferences for the LMS and branch pages.
   -------------------------------------------------------------------------- */
(() => {
  'use strict';

  const LANGUAGE_KEY='fsa_language_v1';
  const ACCESSIBILITY_KEY='fsa_accessibility_v1';
  const icon=(name,cls='',filled=false)=>window.FSA_UI?.icon?.(name,cls,filled)||'';
  const safeRead=(key,fallback=null)=>{try{return localStorage.getItem(key)??fallback}catch(_){return fallback}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,value)}catch(_){}};

  let currentLanguage='en';
  function applyLanguage(language,remember=true){currentLanguage=language==='hi'?'hi':'en';window.FSA_LANGUAGE?.set(currentLanguage,remember);applyAccessibility(false);}
  function injectLanguageSwitcher(){
    document.querySelectorAll('.site-header .header-actions').forEach(actions=>{
      if(actions.querySelector('.fsa-language-switch'))return;
      const group=document.createElement('div');group.className='fsa-language-switch';group.setAttribute('role','group');group.setAttribute('aria-label','Language');group.setAttribute('data-no-translate','');
      group.innerHTML=`<span class="fsa-language-icon" aria-hidden="true">${icon('globe')}</span><button type="button" data-fsa-language="en" aria-pressed="false" aria-label="English">EN</button><i aria-hidden="true"></i><button type="button" data-fsa-language="hi" aria-pressed="false" aria-label="Hindi" lang="hi">हिन्दी</button>`;
      actions.prepend(group);
    });

  }

  const defaultAccessibility=()=>({text:0,contrast:false,readable:false,links:false,motion:false});
  function readAccessibility(){
    try{return {...defaultAccessibility(),...JSON.parse(safeRead(ACCESSIBILITY_KEY,'{}'))}}
    catch(_){return defaultAccessibility()}
  }
  let accessibility=readAccessibility();
  function applyAccessibility(remember=true){
    const html=document.documentElement;
    html.dataset.fsaText=accessibility.text===2?'xlarge':accessibility.text===1?'large':'normal';
    html.classList.toggle('fsa-a11y-contrast',Boolean(accessibility.contrast));
    html.classList.toggle('fsa-a11y-readable',Boolean(accessibility.readable));
    html.classList.toggle('fsa-a11y-links',Boolean(accessibility.links));
    html.classList.toggle('fsa-a11y-motion',Boolean(accessibility.motion));
    const root=document.getElementById('fsaAccessibility');
    if(root){
      const size=root.querySelector('[data-a11y-size]');if(size)size.textContent=['100%','120%','140%'][accessibility.text]||'100%';
      root.querySelectorAll('[data-a11y-toggle]').forEach(button=>{
        const active=Boolean(accessibility[button.dataset.a11yToggle]);
        button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
        const state=button.querySelector('.fsa-a11y-state');if(state)state.textContent=currentLanguage==='hi'?(active?'चालू':'बंद'):(active?'On':'Off');
      });
    }
    if(remember)safeWrite(ACCESSIBILITY_KEY,JSON.stringify(accessibility));
  }
  function injectAccessibility(){
    if(document.getElementById('fsaAccessibility'))return;
    const root=document.createElement('aside');root.id='fsaAccessibility';root.className='fsa-accessibility';
    root.innerHTML=`<button class="fsa-a11y-launcher" type="button" aria-label="Accessibility options" aria-expanded="false" aria-controls="fsaA11yPanel"><span>${icon('accessibility')}</span><b>Accessibility</b></button><section class="fsa-a11y-panel" id="fsaA11yPanel" aria-hidden="true" aria-label="Accessibility options"><header><span>${icon('accessibility')}</span><div><small>Website tools</small><strong>Accessibility</strong></div><button type="button" data-a11y-close aria-label="Close accessibility options">${icon('x')}</button></header><div class="fsa-a11y-body"><div class="fsa-a11y-size-row"><span><i>${icon('type')}</i><b>Text size</b></span><div><button type="button" data-a11y-text="down" aria-label="Decrease text size">${icon('minus')}</button><output data-a11y-size>100%</output><button type="button" data-a11y-text="up" aria-label="Increase text size">${icon('plus')}</button></div></div><button class="fsa-a11y-option" type="button" data-a11y-toggle="contrast" aria-pressed="false"><span><i>${icon('contrast')}</i><b>High contrast</b></span><em class="fsa-a11y-state">Off</em></button><button class="fsa-a11y-option" type="button" data-a11y-toggle="readable" aria-pressed="false"><span><i>${icon('type')}</i><b>Readable font</b></span><em class="fsa-a11y-state">Off</em></button><button class="fsa-a11y-option" type="button" data-a11y-toggle="links" aria-pressed="false"><span><i>${icon('link')}</i><b>Highlight links</b></span><em class="fsa-a11y-state">Off</em></button><button class="fsa-a11y-option" type="button" data-a11y-toggle="motion" aria-pressed="false"><span><i>${icon('pause')}</i><b>Reduce motion</b></span><em class="fsa-a11y-state">Off</em></button><button class="fsa-a11y-reset" type="button" data-a11y-reset>${icon('reset')}<span>Reset settings</span></button></div></section>`;
    document.body.appendChild(root);applyAccessibility(false);
    const launcher=root.querySelector('.fsa-a11y-launcher'),panel=root.querySelector('.fsa-a11y-panel');
    const setOpen=open=>{root.classList.toggle('is-open',open);launcher.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));if(open)setTimeout(()=>panel.querySelector('button')?.focus({preventScroll:true}),80)};
    launcher.addEventListener('click',()=>setOpen(!root.classList.contains('is-open')));
    root.addEventListener('click',event=>{
      if(event.target.closest('[data-a11y-close]')){setOpen(false);launcher.focus();return}
      const textButton=event.target.closest('[data-a11y-text]');
      if(textButton){accessibility.text=Math.max(0,Math.min(2,accessibility.text+(textButton.dataset.a11yText==='up'?1:-1)));applyAccessibility();return}
      const toggle=event.target.closest('[data-a11y-toggle]');
      if(toggle){const key=toggle.dataset.a11yToggle;accessibility[key]=!accessibility[key];applyAccessibility();return}
      if(event.target.closest('[data-a11y-reset]')){accessibility=defaultAccessibility();applyAccessibility()}
    });
    document.addEventListener('pointerdown',event=>{if(root.classList.contains('is-open')&&!root.contains(event.target))setOpen(false)});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.classList.contains('is-open')){setOpen(false);launcher.focus()}});
  }
  function injectStyles(){
    if(document.getElementById('fsaAccessLanguageStyles'))return;
    const style=document.createElement('style');style.id='fsaAccessLanguageStyles';
    style.textContent=`
      .fsa-language-switch,.fsa-language-switch *,.fsa-accessibility,.fsa-accessibility *{box-sizing:border-box}
      .fsa-language-switch{display:flex;align-items:center;height:34px;padding:3px 5px;gap:3px;border:1px solid #e9d7da;border-radius:999px;background:#fff;color:var(--brand);box-shadow:0 4px 12px rgba(74,31,39,.06);white-space:nowrap;direction:ltr}
      .fsa-language-icon{display:grid;width:19px;height:19px;place-items:center;color:var(--brand)}.fsa-language-icon svg{width:13px;height:13px}
      .fsa-language-switch button{display:grid;min-width:30px;height:26px;place-items:center;padding:0 6px;border:0;border-radius:999px;background:transparent;color:#7a666a;font:700 12px/1 Inter,Arial,sans-serif;cursor:pointer;transition:background .18s ease,color .18s ease,box-shadow .18s ease}
      .fsa-language-switch button:last-child{min-width:45px;font-family:"Noto Sans Devanagari","Nirmala UI",Arial,sans-serif;font-size:13px}
      .fsa-language-switch button.is-active{background:var(--brand);color:#fff;box-shadow:0 3px 9px rgba(var(--brand-rgb),.24)}
      .fsa-language-switch i{width:1px;height:13px;background:#eadcdf}
      .fsa-accessibility{position:fixed;left:max(10px,env(safe-area-inset-left));top:50%;z-index:1450;transform:translateY(-50%);font-family:Inter,Arial,sans-serif;direction:ltr}
      .fsa-a11y-launcher{display:flex;width:42px;min-height:108px;align-items:center;justify-content:center;gap:7px;padding:10px 7px;border:1px solid #ead6da;border-radius:15px;background:#fff;color:var(--brand);box-shadow:0 13px 36px rgba(56,28,34,.17);cursor:pointer;writing-mode:vertical-rl;transform:rotate(180deg);transition:transform .2s ease,box-shadow .2s ease}
      .fsa-a11y-launcher:hover,.fsa-a11y-launcher:focus-visible{transform:rotate(180deg) translateY(-2px);box-shadow:0 16px 42px rgba(56,28,34,.23)}
      .fsa-a11y-launcher span{display:grid;width:27px;height:27px;place-items:center;border-radius:9px;background:var(--brand);color:#fff}.fsa-a11y-launcher svg{width:17px;height:17px}.fsa-a11y-launcher b{font-size:11px;letter-spacing:.04em}
      .fsa-a11y-panel{position:absolute;left:51px;top:50%;width:310px;max-height:min(570px,calc(100vh - 24px));overflow:auto;border:1px solid #e5d4d7;border-radius:18px;background:#fff;box-shadow:0 22px 62px rgba(49,24,30,.22);opacity:0;visibility:hidden;pointer-events:none;transform:translate(-9px,-50%) scale(.98);transform-origin:left center;transition:opacity .2s ease,transform .22s ease,visibility .2s ease}
      .fsa-accessibility.is-open .fsa-a11y-panel{opacity:1;visibility:visible;pointer-events:auto;transform:translate(0,-50%) scale(1)}
      .fsa-a11y-panel header{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid #eee2e4;background:linear-gradient(135deg,#fff8f9,#fff)}
      .fsa-a11y-panel header>span{display:grid;width:38px;height:38px;flex:0 0 38px;place-items:center;border-radius:11px;background:var(--brand);color:#fff}.fsa-a11y-panel header>span svg{width:20px;height:20px}.fsa-a11y-panel header div{min-width:0;flex:1}.fsa-a11y-panel header small{display:block;margin-bottom:2px;color:#82666c;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.fsa-a11y-panel header strong{display:block;color:#293a34;font:700 16px/1.25 Poppins,Inter,sans-serif}.fsa-a11y-panel header button{display:grid;width:34px;height:34px;place-items:center;padding:0;border:0;border-radius:9px;background:var(--accent-soft-2);color:var(--brand);cursor:pointer}.fsa-a11y-panel header button svg{width:15px;height:15px}
      .fsa-a11y-body{display:grid;gap:8px;padding:12px}.fsa-a11y-size-row,.fsa-a11y-option{display:flex;width:100%;min-height:48px;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid #eee1e3;border-radius:12px;background:#fff;color:#38433f}
      .fsa-a11y-size-row>span,.fsa-a11y-option>span{display:flex;align-items:center;gap:8px}.fsa-a11y-size-row i,.fsa-a11y-option i{display:grid;width:30px;height:30px;place-items:center;border-radius:8px;background:var(--accent-soft-2);color:var(--brand)}.fsa-a11y-size-row i svg,.fsa-a11y-option i svg{width:15px;height:15px}.fsa-a11y-size-row b,.fsa-a11y-option b{font-size:14px;font-weight:700}
      .fsa-a11y-size-row>div{display:flex;align-items:center;border:1px solid #e9dadd;border-radius:9px;overflow:hidden}.fsa-a11y-size-row button{display:grid;width:34px;height:34px;place-items:center;padding:0;border:0;background:#faf4f5;color:var(--brand);cursor:pointer}.fsa-a11y-size-row button svg{width:15px;height:15px}.fsa-a11y-size-row output{min-width:50px;color:#52474a;font-size:12px;font-weight:800;text-align:center}
      .fsa-a11y-option{cursor:pointer;text-align:left;transition:border-color .18s ease,background .18s ease}.fsa-a11y-option:hover{border-color:#dcbec3}.fsa-a11y-option.is-active{border-color:#cfa9b0;background:#fff8f9}.fsa-a11y-state{position:relative;min-width:47px;padding:6px 8px 6px 18px;border-radius:999px;background:#eee8e9;color:#776a6d;font-size:11px;font-style:normal;font-weight:800;text-align:center}.fsa-a11y-state:before{content:"";position:absolute;left:7px;top:50%;width:7px;height:7px;border-radius:50%;background:#9b8d90;transform:translateY(-50%)}.fsa-a11y-option.is-active .fsa-a11y-state{background:#e6f5ec;color:#277449}.fsa-a11y-option.is-active .fsa-a11y-state:before{background:#35a76b}
      .fsa-a11y-reset{display:flex;width:100%;height:40px;align-items:center;justify-content:center;gap:7px;margin-top:2px;border:0;border-radius:10px;background:var(--accent-soft-2);color:var(--brand);font-size:13px;font-weight:750;cursor:pointer}.fsa-a11y-reset svg{width:15px;height:15px}
      html[data-fsa-text="large"]{font-size:120%}html[data-fsa-text="xlarge"]{font-size:140%}
      html[data-fsa-text="large"] body :where(p,li,label,input,textarea,select):not(.fsa-accessibility *),html[data-fsa-text="xlarge"] body :where(p,li,label,input,textarea,select):not(.fsa-accessibility *){line-height:1.6!important}
      html.fsa-a11y-readable body,html.fsa-a11y-readable body *:not(svg):not(path){font-family:Arial,Verdana,sans-serif!important;letter-spacing:.015em}
      html.fsa-a11y-links body a:not(.button):not(.fsa-activity-link){text-decoration:underline!important;text-decoration-thickness:2px!important;text-underline-offset:3px!important}
      html.fsa-a11y-contrast body{background:#fff!important;color:#0b0b0b!important}html.fsa-a11y-contrast main :where(p,li,label,small),html.fsa-a11y-contrast .site-footer :where(p,a,small){color:#111!important}html.fsa-a11y-contrast main a:not(.button){color:#000!important;text-decoration:underline!important}html.fsa-a11y-contrast :where(input,textarea,select){border-color:#111!important;background:#fff!important;color:#000!important}
      html.fsa-a11y-motion,html.fsa-a11y-motion *{scroll-behavior:auto!important}html.fsa-a11y-motion *,html.fsa-a11y-motion *:before,html.fsa-a11y-motion *:after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
      html.fsa-a11y-motion .fsa-news-track{animation:none!important;transform:none!important}html.fsa-a11y-motion .fsa-news-group[aria-hidden="true"]{display:none!important}
      @media(max-width:1120px){.site-header .header-actions{gap:5px}.fsa-language-switch{height:32px}.fsa-language-switch button{height:24px}}
      @media(max-width:620px){.fsa-language-switch{padding:3px}.fsa-language-icon{display:none}.fsa-language-switch button{min-width:27px;padding:0 3px;font-size:11px}.fsa-accessibility{left:max(7px,env(safe-area-inset-left))}.fsa-a11y-launcher{width:38px;min-height:96px;border-radius:13px}.fsa-a11y-launcher b{font-size:10px}.fsa-a11y-launcher span{width:25px;height:25px}.fsa-a11y-panel{left:45px;width:min(310px,calc(100vw - 58px))}}
      @media(max-width:380px){.site-header .brand-logo{max-width:135px!important}.site-header .header-actions{gap:3px}.fsa-language-switch{gap:1px}.fsa-language-switch button:first-of-type{min-width:24px}.fsa-language-switch button:last-child{min-width:36px;font-size:12px}}
      @media(max-height:560px){.fsa-a11y-panel{top:0;transform:translate(-9px,-42%)}.fsa-accessibility.is-open .fsa-a11y-panel{transform:translate(0,-42%)}}
      @media print{.fsa-language-switch,.fsa-accessibility{display:none!important}}
    `;
    document.head.appendChild(style);
  }
  function init(){
    injectStyles();injectAccessibility();applyAccessibility(false);
    applyAccessibility(false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* --------------------------------------------------------------------------
   FSA AI Assistant — V44 conversational suggestions
   Demo-only conversational UI. Replace getDemoReply() with your AI endpoint
   later; the widget, message rendering and controls can stay unchanged.
   -------------------------------------------------------------------------- */
(() => {
  'use strict';

  const CHAT_ID='fsaAiAssistant';
  const icon=(name,cls='',filled=false)=>window.FSA_UI?.icon?.(name,cls,filled)||'';
  const trashIcon=()=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></svg>`;
  const onBranch=()=>/\/branches\//.test(location.pathname.replace(/\\/g,'/'));
  const routeHref=(path='/')=>onBranch()?`../../index.html#${path}`:`#${path}`;
  const authRoutes=['/login','/register','/forgot-password','/reset-password','/dashboard','/my-courses','/wishlist','/certificates','/purchase-history','/profile','/checkout','/checkout-success'];
  const currentPath=()=>decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]||'/';
  const shouldShow=()=>onBranch()||(!authRoutes.includes(currentPath())&&!currentPath().startsWith('/learn/'));

  const assistantData=()=>window.FSA_DATA?.content?.assistant||{};
  const quickQuestions=()=>assistantData().questions||[];
  const normalize=text=>String(text||'').trim().toLowerCase();
  function assistantMatch(question){const q=normalize(question);return (assistantData().routes||[]).find(row=>(row.key==='greeting'&&['hi','hello','hey'].includes(q))||(row.keywords||[]).some(word=>q.includes(word)));}
  function relatedQuestions(question){return assistantMatch(question)?.suggestions||assistantData().fallbackSuggestions||[];}
  function getDemoReply(question){return !normalize(question)?(assistantData().empty||{}):(assistantMatch(question)?.reply||assistantData().fallback||{});}

  function injectStyles(){
    if(document.getElementById('fsaAiAssistantStyles'))return;
    const style=document.createElement('style');
    style.id='fsaAiAssistantStyles';
    style.textContent=`
      #${CHAT_ID}{--ai-brand:var(--brand,var(--brand));--ai-ink:var(--ink,#21332d);--ai-muted:var(--muted,#6e7873);--ai-line:var(--border,#ecdadd);--ai-pink:var(--pink,var(--accent-soft-1));--ai-pink2:var(--pink-2,var(--accent-soft-2));font-family:Inter,Arial,sans-serif;position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));width:58px;height:58px;max-width:none;z-index:940;pointer-events:none;isolation:isolate}
      #${CHAT_ID},#${CHAT_ID} *{box-sizing:border-box}
      #${CHAT_ID}[hidden]{display:none!important}
      .fsa-ai-launcher{pointer-events:auto;position:relative;width:58px;height:58px;border:0;border-radius:19px;display:grid;place-items:center;margin-left:auto;background:linear-gradient(145deg,var(--brand),var(--ai-brand));color:#fff;box-shadow:0 18px 46px rgba(var(--brand-rgb),.28),inset 0 1px 0 rgba(255,255,255,.18);cursor:pointer;transition:transform .22s ease,box-shadow .22s ease}
      .fsa-ai-launcher:hover{transform:translateY(-3px);box-shadow:0 22px 52px rgba(var(--brand-rgb),.34),inset 0 1px 0 rgba(255,255,255,.18)}
      .fsa-ai-launcher svg{width:25px;height:25px;stroke-width:1.8}
      .fsa-ai-launcher .fsa-ai-launcher-close{display:none}
      #${CHAT_ID}.is-open .fsa-ai-launcher .fsa-ai-launcher-open{display:none}
      #${CHAT_ID}.is-open .fsa-ai-launcher .fsa-ai-launcher-close{display:block}
      #${CHAT_ID}.is-open .fsa-ai-launcher{opacity:0;visibility:hidden;pointer-events:none;transform:translateY(10px) scale(.92)}
      .fsa-ai-launcher-ping{position:absolute;right:-2px;top:-2px;width:13px;height:13px;border:3px solid #fff;border-radius:50%;background:#49a879;box-shadow:0 0 0 5px rgba(73,168,121,.13)}
      #${CHAT_ID}.has-opened .fsa-ai-launcher-ping{display:none}
      .fsa-ai-panel{pointer-events:auto;position:fixed;inset:auto max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) auto;width:min(392px,calc(100vw - 36px));width:min(392px,calc(100dvw - 36px));min-width:0;max-width:calc(100vw - 36px);max-width:calc(100dvw - 36px);height:min(570px,calc(100vh - 36px));height:min(570px,calc(100dvh - 36px));min-height:0;max-height:calc(100vh - 36px);max-height:calc(100dvh - 36px);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;border:1px solid rgba(var(--brand-rgb),.16);border-radius:25px;background:rgba(255,255,255,.985);box-shadow:0 28px 78px rgba(70,25,34,.2);overflow:hidden!important;overscroll-behavior:contain;opacity:0;visibility:hidden;transform:translateY(14px) scale(.975);transform-origin:bottom right;transition:opacity .22s ease,transform .22s ease,visibility .22s ease}
      #${CHAT_ID}.is-open .fsa-ai-panel{opacity:1;visibility:visible;transform:none}
      .fsa-ai-head{position:relative;width:100%;min-width:0;max-width:100%;overflow:hidden;padding:18px 18px 16px;background:linear-gradient(135deg,var(--brand) 0%,var(--brand) 64%,var(--brand) 100%);color:#fff}
      .fsa-ai-head:after{content:"";position:absolute;width:150px;height:150px;border:1px solid rgba(255,255,255,.16);border-radius:50%;right:-67px;top:-83px;box-shadow:0 0 0 26px rgba(255,255,255,.035),0 0 0 52px rgba(255,255,255,.02)}
      .fsa-ai-head-row{position:relative;z-index:2;display:grid;grid-template-columns:45px minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;min-width:0;padding:0}
      .fsa-ai-avatar{position:relative;display:grid;width:45px;height:45px;flex:0 0 auto;place-items:center;border-radius:15px;background:#fff;color:var(--ai-brand);box-shadow:0 10px 24px rgba(54,15,22,.18)}
      .fsa-ai-avatar svg{width:23px;height:23px}
      .fsa-ai-avatar i{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:#55b685}
      .fsa-ai-head-copy{min-width:0;flex:1}.fsa-ai-head-copy strong{display:block;font:700 15px Poppins,Inter,sans-serif;letter-spacing:-.015em}.fsa-ai-head-copy span{display:flex;align-items:center;gap:7px;margin-top:4px;color:rgba(255,255,255,.78);font-size:10px;font-weight:600}.fsa-ai-demo-pill{padding:3px 7px;border:1px solid rgba(255,255,255,.23);border-radius:999px;background:rgba(255,255,255,.11);color:#fff!important;font-size:8px!important;text-transform:uppercase;letter-spacing:.08em}
      .fsa-ai-head-actions{position:relative!important;right:auto!important;top:auto!important;z-index:8!important;display:flex!important;align-items:center;justify-content:flex-end;gap:6px;transform:none!important;opacity:1!important;visibility:visible!important;min-width:max-content}.fsa-ai-head-actions button{appearance:none!important;-webkit-appearance:none!important;display:grid!important;width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;flex:0 0 36px!important;place-items:center!important;padding:0!important;margin:0!important;border:1px solid rgba(255,255,255,.3)!important;border-radius:11px!important;background:rgba(255,255,255,.14)!important;color:#fff!important;cursor:pointer!important;box-shadow:0 6px 18px rgba(57,14,22,.12)!important;opacity:1!important;visibility:visible!important;line-height:1!important;transition:.18s ease}.fsa-ai-head-actions button:hover{background:rgba(255,255,255,.24)!important;transform:translateY(-1px)}.fsa-ai-head-actions button[data-ai-action="close"]{background:#fff!important;color:var(--ai-brand)!important;border-color:#fff!important}.fsa-ai-head-actions button[data-ai-action="close"]:hover{background:#fff1f3!important}.fsa-ai-head-actions svg{display:block!important;width:18px!important;height:18px!important;stroke:currentColor!important}
      .fsa-ai-messages{width:100%;min-width:0;max-width:100%;min-height:0;overflow-x:hidden!important;overflow-y:auto;padding:18px 16px 14px;background:linear-gradient(180deg,#fff 0%,#fffafa 100%);scrollbar-width:thin;scrollbar-color:#d8bfc4 transparent;overscroll-behavior:contain}
      .fsa-ai-message{position:relative;display:flex;width:100%;max-width:100%;min-width:0;align-items:flex-start;gap:9px;padding-right:31px;margin:0 0 15px;overflow:hidden;animation:fsaAiMessageIn .28s ease both}.fsa-ai-message.bot{justify-content:flex-start}.fsa-ai-message.user{justify-content:flex-end;padding-left:40px}.fsa-ai-message-avatar{display:grid;width:29px;height:29px;flex:0 0 29px;place-items:center;border-radius:10px;background:#f8e8eb;color:var(--ai-brand);margin-top:3px}.fsa-ai-message-avatar svg{width:15px;height:15px}.fsa-ai-message-bubble{display:block;flex:1 1 0;min-width:0;max-width:100%;width:auto;padding:11px 12px;border:1px solid var(--ai-line);border-radius:8px 17px 17px 17px;background:#fff;box-shadow:0 7px 18px rgba(70,40,46,.05);color:var(--ai-ink);font-size:11px;line-height:1.62;white-space:normal!important;overflow:hidden;overflow-wrap:anywhere!important;word-break:break-word!important}.fsa-ai-message-text{display:block!important;width:auto!important;min-width:0!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;line-break:auto!important}.fsa-ai-message-bubble strong{display:block!important;width:auto!important;max-width:100%!important;min-width:0!important;margin-bottom:4px;color:var(--ai-brand);font:700 11px Poppins,Inter,sans-serif;line-height:1.45;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}.fsa-ai-message.user .fsa-ai-message-bubble{flex:0 1 auto;min-width:0;max-width:82%;border-color:transparent;border-radius:17px 8px 17px 17px;background:var(--ai-brand);color:#fff;box-shadow:0 8px 20px rgba(var(--brand-rgb),.15);white-space:pre-wrap!important}.fsa-ai-message-delete{position:absolute;right:0;top:7px;display:grid;width:24px;height:24px;min-width:24px;min-height:24px;place-items:center;padding:0;margin:0;border:1px solid #eadadd;border-radius:8px;background:#fff;color:#9a6871;opacity:0;visibility:hidden;transform:translateX(3px);cursor:pointer;box-shadow:0 5px 14px rgba(67,41,46,.06);transition:.16s ease}.fsa-ai-message:hover .fsa-ai-message-delete,.fsa-ai-message:focus-within .fsa-ai-message-delete{opacity:1;visibility:visible;transform:none}.fsa-ai-message-delete:hover{border-color:#d8aeb6;background:#fff3f5;color:var(--ai-brand)}.fsa-ai-message-delete svg{width:12px;height:12px}
      .fsa-ai-message-actions{display:flex;max-width:100%;flex-wrap:wrap;gap:6px;margin-top:9px}.fsa-ai-message-actions a,.fsa-ai-message-actions button{display:inline-flex;max-width:100%;min-height:29px;align-items:center;justify-content:center;padding:6px 9px;border:1px solid #e5cdd2;border-radius:9px;background:#fff;color:var(--ai-brand);font:700 8px Inter,sans-serif;cursor:pointer;text-decoration:none;white-space:normal;text-align:center;overflow-wrap:anywhere}.fsa-ai-message-actions .primary{border-color:var(--ai-brand);background:var(--ai-brand);color:#fff}
      .fsa-ai-followups{display:grid;width:100%;min-width:0;gap:6px;margin-top:11px}.fsa-ai-followup-label{display:block;color:#8b7479;font-size:7.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.fsa-ai-followup-button{appearance:none;display:flex;width:100%;min-width:0;min-height:34px;align-items:center;gap:8px;padding:8px 10px;border:0;border-radius:10px;background:#f8e9ec;color:var(--brand);text-align:left;font:700 8.5px/1.35 Inter,sans-serif;cursor:pointer;overflow-wrap:anywhere;transition:background .18s ease,color .18s ease,transform .18s ease}.fsa-ai-followup-button:hover{background:var(--accent-soft-3);color:var(--ai-brand);transform:translateY(-1px)}.fsa-ai-followup-button.is-main{background:var(--ai-brand);color:#fff}.fsa-ai-followup-button.is-main:hover{background:var(--brand);color:#fff}.fsa-ai-followup-button:disabled{opacity:.5;cursor:default;transform:none}.fsa-ai-followup-button svg{width:13px;height:13px;flex:0 0 13px}
      .fsa-ai-typing .fsa-ai-message-bubble{display:flex;width:54px;align-items:center;justify-content:center;gap:4px;padding:13px 10px}.fsa-ai-typing i{width:5px;height:5px;border-radius:50%;background:#b98b94;animation:fsaAiDot 1s ease-in-out infinite}.fsa-ai-typing i:nth-child(2){animation-delay:.15s}.fsa-ai-typing i:nth-child(3){animation-delay:.3s}
      .fsa-ai-composer-shell{width:100%;min-width:0;max-width:100%;overflow:hidden;border-top:1px solid #f0e3e5;background:#fff;padding:10px 12px 12px}
      .fsa-ai-composer{display:grid;width:100%;min-width:0;max-width:100%;grid-template-columns:minmax(0,1fr) 42px;gap:7px;align-items:end;padding:5px 5px 5px 12px;border:1px solid #e7d5d8;border-radius:16px;background:#fff;box-shadow:0 8px 22px rgba(67,41,46,.055);transition:border-color .18s ease,box-shadow .18s ease}.fsa-ai-composer:focus-within{border-color:#c99da6;box-shadow:0 0 0 4px rgba(var(--brand-rgb),.055)}.fsa-ai-composer textarea{display:block;width:100%;min-width:0;max-width:100%;max-height:90px;min-height:36px;resize:none;border:0;outline:0;padding:9px 0 7px;background:transparent;color:var(--ai-ink);font:500 11px/1.45 Inter,sans-serif;overflow-wrap:anywhere}.fsa-ai-composer textarea::placeholder{color:#9da6a2}.fsa-ai-send{display:grid;width:38px;height:38px;min-width:38px;max-width:38px;place-items:center;padding:0;border:0;border-radius:12px;background:var(--ai-brand);color:#fff;cursor:pointer;transition:.18s ease}.fsa-ai-send:hover{transform:translateY(-1px);background:var(--brand)}.fsa-ai-send:disabled{opacity:.45;cursor:wait;transform:none}.fsa-ai-send svg{width:17px;height:17px}
      .fsa-ai-footnote{margin:7px 2px 0;text-align:center;color:#9a8c90;font-size:7.5px;line-height:1.4}.fsa-ai-footnote b{color:#7c5860}
      @keyframes fsaAiMessageIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@keyframes fsaAiDot{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-3px);opacity:1}}
      .scroll-top{left:max(18px,env(safe-area-inset-left))!important;right:auto!important}
      @media(max-width:760px){#${CHAT_ID}{right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));width:54px;height:54px}.fsa-ai-launcher{width:54px;height:54px;border-radius:17px}.fsa-ai-panel{inset:auto max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) auto;width:min(392px,calc(100vw - 28px));width:min(392px,calc(100dvw - 28px));max-width:calc(100vw - 28px);max-width:calc(100dvw - 28px);height:min(540px,calc(100vh - 28px));height:min(540px,calc(100dvh - 28px));max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);border-radius:23px;transform-origin:bottom right}.fsa-ai-head{padding:15px}.fsa-ai-head-row{grid-template-columns:42px minmax(0,1fr) auto;gap:10px;padding:0}.fsa-ai-messages{padding:15px 13px 12px}.fsa-ai-message{gap:8px;padding-right:29px}.fsa-ai-message.user{padding-left:28px}.fsa-ai-message.user .fsa-ai-message-bubble{max-width:84%}.fsa-ai-message-bubble{font-size:10.5px;padding:10px 11px}.fsa-ai-composer-shell{padding:9px 10px 10px}.fsa-ai-head-actions{right:auto!important}.fsa-ai-head-actions button{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;flex-basis:32px!important}.fsa-ai-message-delete{opacity:1;visibility:visible;transform:none}.scroll-top{left:max(12px,env(safe-area-inset-left))!important}}
      @media(max-width:520px){.fsa-ai-panel{left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));width:auto;max-width:none;height:min(520px,calc(100vh - 24px));height:min(520px,calc(100dvh - 24px));max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px)}.fsa-ai-head-copy strong{font-size:14px}.fsa-ai-head-copy span{gap:5px}.fsa-ai-demo-pill{display:none}.fsa-ai-head-row{grid-template-columns:40px minmax(0,1fr) auto;padding:0}.fsa-ai-head-actions{right:auto!important;gap:5px}.fsa-ai-head-actions button{width:31px!important;height:31px!important;min-width:31px!important;min-height:31px!important;flex-basis:31px!important}.fsa-ai-message.user{padding-left:20px}.fsa-ai-message.user .fsa-ai-message-bubble{max-width:86%}.fsa-ai-composer-shell{padding-bottom:max(10px,env(safe-area-inset-bottom))}}
      @media(max-height:620px) and (min-width:521px){.fsa-ai-panel{bottom:max(12px,env(safe-area-inset-bottom));height:calc(100vh - 24px);height:calc(100dvh - 24px);max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px)}}
      @media(max-width:390px){.fsa-ai-head{padding:13px 12px}.fsa-ai-head-row{grid-template-columns:38px minmax(0,1fr) auto;gap:8px}.fsa-ai-avatar{width:38px;height:38px;border-radius:12px}.fsa-ai-avatar svg{width:20px;height:20px}.fsa-ai-head-copy strong{font-size:12.5px}.fsa-ai-head-copy span{font-size:9px}.fsa-ai-head-actions button[data-ai-action="reset"]{display:none!important}.fsa-ai-messages{padding-left:10px;padding-right:10px}.fsa-ai-message{gap:7px;padding-right:27px}.fsa-ai-message.user{padding-left:10px}.fsa-ai-message.user .fsa-ai-message-bubble{max-width:90%}.fsa-ai-message-bubble{font-size:10px;padding:9px 10px}.fsa-ai-message-delete{width:22px;height:22px;min-width:22px;min-height:22px}}
      @media(prefers-reduced-motion:reduce){.fsa-ai-launcher,.fsa-ai-panel,.fsa-ai-message{transition:none!important;animation:none!important}.fsa-ai-typing i{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function markup(){
    return `<div id="${CHAT_ID}" aria-live="polite">
      <section class="fsa-ai-panel" role="dialog" aria-label="FSA AI Assistant demo" aria-modal="false">
        <header class="fsa-ai-head">
          <div class="fsa-ai-head-row">
            <span class="fsa-ai-avatar">${icon('sparkle')}<i aria-hidden="true"></i></span>
            <span class="fsa-ai-head-copy"><strong>FSA AI Assistant</strong><span>Online now <b class="fsa-ai-demo-pill">Demo mode</b></span></span>
            <span class="fsa-ai-head-actions"><button type="button" data-ai-action="reset" aria-label="Start a new chat" title="New chat">${icon('replay')}</button><button type="button" data-ai-action="close" aria-label="Close chat" title="Close">${icon('x')}</button></span>
          </div>
        </header>
        <div class="fsa-ai-messages" data-ai-messages></div>
        <footer class="fsa-ai-composer-shell">
          <form class="fsa-ai-composer" data-ai-form>
            <textarea rows="1" maxlength="500" data-ai-input placeholder="Ask about courses, batches, fees…" aria-label="Message FSA AI Assistant"></textarea>
            <button class="fsa-ai-send" type="submit" aria-label="Send message">${icon('arrow')}</button>
          </form>
          <p class="fsa-ai-footnote"><b>Demo assistant</b> · Preset replies now · AI API ready later</p>
        </footer>
      </section>
      <button class="fsa-ai-launcher" type="button" data-ai-action="toggle" aria-label="Open FSA AI Assistant" aria-expanded="false">
        <span class="fsa-ai-launcher-open">${icon('sparkle')}</span><span class="fsa-ai-launcher-close">${icon('x')}</span><i class="fsa-ai-launcher-ping" aria-hidden="true"></i>
      </button>
    </div>`;
  }

  function buildMessage(type,content){
    const row=document.createElement('div');row.className=`fsa-ai-message ${type}`;
    if(type==='bot'){
      const avatar=document.createElement('span');avatar.className='fsa-ai-message-avatar';avatar.innerHTML=icon('sparkle');row.appendChild(avatar);
    }
    const bubble=document.createElement('div');bubble.className='fsa-ai-message-bubble';
    if(type==='user')bubble.textContent=String(content||'');
    else{
      if(content.title){const strong=document.createElement('strong');strong.textContent=content.title;bubble.appendChild(strong)}
      const text=document.createElement('span');text.className='fsa-ai-message-text';text.textContent=content.text||'';bubble.appendChild(text);
      if(content.actions?.length){
        const actions=document.createElement('div');actions.className='fsa-ai-message-actions';
        content.actions.forEach(action=>{
          let el;
          if(action.action){el=document.createElement('button');el.type='button';el.dataset.aiMessageAction=action.action}
          else{el=document.createElement('a');el.href=routeHref(action.href||'/')}
          el.textContent=action.label||'Open';if(action.primary)el.classList.add('primary');actions.appendChild(el);
        });
        bubble.appendChild(actions);
      }
      if(content.suggestions?.length){
        const followups=document.createElement('div');followups.className='fsa-ai-followups';
        const label=document.createElement('span');label.className='fsa-ai-followup-label';label.textContent=content.suggestionLabel||'You can also ask';followups.appendChild(label);
        content.suggestions.forEach((suggestion,index)=>{
          const item=quickQuestions().find(entry=>entry.label===suggestion);
          const button=document.createElement('button');button.type='button';button.className='fsa-ai-followup-button';
          if(content.mainSuggestions&&index===0)button.classList.add('is-main');
          button.dataset.aiSuggestion=suggestion;button.innerHTML=`${icon(item?.icon||'sparkle')}<span></span>`;button.querySelector('span').textContent=suggestion;followups.appendChild(button);
        });
        bubble.appendChild(followups);
      }
    }
    row.appendChild(bubble);
    const del=document.createElement('button');del.type='button';del.className='fsa-ai-message-delete';del.dataset.aiDeleteMessage='1';del.setAttribute('aria-label','Delete this message');del.setAttribute('title','Delete message');del.innerHTML=trashIcon();row.appendChild(del);
    return row;
  }

  function init(){
    if(document.getElementById(CHAT_ID))return;
    injectStyles();document.body.insertAdjacentHTML('beforeend',markup());
    const root=document.getElementById(CHAT_ID),panel=root.querySelector('.fsa-ai-panel'),messages=root.querySelector('[data-ai-messages]'),input=root.querySelector('[data-ai-input]'),form=root.querySelector('[data-ai-form]'),send=form.querySelector('.fsa-ai-send'),launcher=root.querySelector('.fsa-ai-launcher');
    let pending=false;

    const scrollBottom=()=>requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight});
    const addBot=reply=>{messages.querySelectorAll('[data-ai-suggestion]').forEach(button=>button.disabled=true);messages.appendChild(buildMessage('bot',reply));scrollBottom()};
    const addUser=text=>{messages.appendChild(buildMessage('user',text));scrollBottom()};
    const setPending=value=>{pending=value;send.disabled=value;const groups=[...messages.querySelectorAll('.fsa-ai-followups')];groups.forEach((group,index)=>group.querySelectorAll('[data-ai-suggestion]').forEach(btn=>btn.disabled=value||index!==groups.length-1));input.setAttribute('aria-busy',value?'true':'false')};
    const greeting=()=>addBot({...(assistantData().greeting||{}),suggestions:quickQuestions().slice(0,4).map(item=>item.label)});
    const reset=()=>{messages.innerHTML='';greeting();input.value='';resizeInput()};
    const open=()=>{root.classList.add('is-open','has-opened');launcher.setAttribute('aria-expanded','true');setTimeout(()=>input.focus({preventScroll:true}),180)};
    const close=()=>{root.classList.remove('is-open');launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true})};
    const toggle=()=>root.classList.contains('is-open')?close():open();
    const resizeInput=()=>{input.style.height='auto';input.style.height=`${Math.min(90,input.scrollHeight)}px`};
    const showTyping=()=>{const row=document.createElement('div');row.className='fsa-ai-message bot fsa-ai-typing';row.dataset.aiTyping='1';row.innerHTML=`<span class="fsa-ai-message-avatar">${icon('sparkle')}</span><span class="fsa-ai-message-bubble"><i></i><i></i><i></i></span>`;messages.appendChild(row);scrollBottom();return row};

    const sendQuestion=text=>{
      const question=String(text||'').trim();if(!question||pending)return;
      addUser(question);input.value='';resizeInput();setPending(true);const typing=showTyping();
      window.setTimeout(()=>{typing.remove();const reply=getDemoReply(question);reply.suggestions=relatedQuestions(question);addBot(reply);setPending(false);input.focus({preventScroll:true})},Math.min(1050,560+question.length*4));
    };

    root.addEventListener('click',event=>{
      const deleteMessage=event.target.closest('[data-ai-delete-message]');
      if(deleteMessage){
        const row=deleteMessage.closest('.fsa-ai-message');
        if(row){row.style.opacity='0';row.style.transform='translateY(-4px)';window.setTimeout(()=>{row.remove();if(!messages.querySelector('.fsa-ai-message:not(.fsa-ai-typing)'))greeting()},140)}
        return;
      }
      const action=event.target.closest('[data-ai-action]')?.dataset.aiAction;
      if(action==='toggle')toggle();else if(action==='close')close();else if(action==='reset')reset();
      const suggestion=event.target.closest('[data-ai-suggestion]');if(suggestion&&!suggestion.disabled){open();sendQuestion(suggestion.dataset.aiSuggestion)}
      const msgAction=event.target.closest('[data-ai-message-action]')?.dataset.aiMessageAction;
      if(msgAction==='callback'){
        close();
        const existing=document.querySelector('[data-action="open-call-popup"],[data-call-popup]');
        if(existing)existing.click();else location.href=routeHref('/contact');
      }
    });
    form.addEventListener('submit',event=>{event.preventDefault();sendQuestion(input.value)});
    input.addEventListener('input',resizeInput);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit()}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.classList.contains('is-open'))close()});

    const syncVisibility=()=>{const visible=shouldShow();root.hidden=!visible;if(!visible)root.classList.remove('is-open')};
    window.addEventListener('hashchange',syncVisibility);syncVisibility();greeting();

    /* Future AI integration point:
       Replace getDemoReply(question) in sendQuestion() with a fetch() call to
       your own backend/API and pass the returned {title,text,actions} to addBot(). */
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* --------------------------------------------------------------------------
   FSA Top News Ticker — V47 persistent continuous ticker
   Continuous academy updates inside the existing announcement bar.
   -------------------------------------------------------------------------- */
(() => {
  'use strict';

  const onBranch=()=>/\/branches\//.test(location.pathname.replace(/\\/g,'/'));
  const routeHref=path=>onBranch()?`../../index.html#${path}`:`#${path}`;
  const icon=(name,cls='',filled=false)=>window.FSA_UI?.icon?.(name,cls,filled)||'';

  function injectStyles(){
    if(document.getElementById('fsaTopNewsTickerStyles'))return;
    const style=document.createElement('style');style.id='fsaTopNewsTickerStyles';
    style.textContent=`
      .announcement .announcement-inner,.fsa-shared-top .announcement-inner{justify-content:flex-start!important;gap:0!important;padding-right:42px!important;overflow:hidden}
      .fsa-ticker-legacy{display:none!important}
      .fsa-news-ticker{--ticker-duration:42s;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;width:100%;min-width:0;max-width:100%;height:38px;color:#fff;overflow:hidden}
      .fsa-news-label{position:relative;z-index:2;display:inline-flex;height:24px;align-items:center;gap:6px;padding:0 9px;margin-right:12px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.13);color:#fff;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;box-shadow:7px 0 14px rgba(87,20,31,.1)}
      .fsa-news-label svg{width:12px;height:12px}
      .fsa-news-viewport{position:relative;min-width:0;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 18px,#000 calc(100% - 18px),transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 18px,#000 calc(100% - 18px),transparent)}
      .fsa-news-track{display:flex;width:max-content;min-width:100%;align-items:center;animation:fsaNewsTicker var(--ticker-duration) linear infinite;will-change:transform}
      .fsa-news-ticker:hover .fsa-news-track,.fsa-news-ticker:focus-within .fsa-news-track{animation-play-state:paused}
      .fsa-news-group{display:flex;flex:0 0 auto;align-items:center}
      .fsa-news-item{display:inline-flex;align-items:center;gap:9px;padding:0 22px 0 0;color:#fff!important;font-size:10px;font-weight:650;text-decoration:none!important;white-space:nowrap;opacity:.94;transition:opacity .18s ease}
      .fsa-news-item:hover{opacity:1}
      .fsa-news-item:before{content:"";width:5px;height:5px;flex:0 0 5px;border-radius:50%;background:#ffd9df;box-shadow:0 0 0 4px rgba(255,217,223,.1)}
      .fsa-news-item span{display:inline-flex;align-items:center;gap:6px}
      .fsa-news-item svg{width:11px;height:11px}
      @keyframes fsaNewsTicker{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
      @media(max-width:680px){.announcement .announcement-inner,.fsa-shared-top .announcement-inner{width:100%!important;padding-left:10px!important;padding-right:38px!important}.fsa-news-ticker{grid-template-columns:auto minmax(0,1fr)}.fsa-news-label{width:25px;padding:0;justify-content:center;margin-right:7px}.fsa-news-label span{display:none}.fsa-news-label svg{width:13px;height:13px}.fsa-news-item{padding-right:18px;font-size:9px}.fsa-news-viewport{mask-image:linear-gradient(90deg,transparent,#000 10px,#000 calc(100% - 10px),transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 10px,#000 calc(100% - 10px),transparent)}}
      @media(prefers-reduced-motion:reduce){.fsa-news-track{animation:none!important;transform:none!important}.fsa-news-group[aria-hidden="true"]{display:none}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    const bar=document.querySelector('#announcement,#sharedAnnouncement');
    const inner=bar?.querySelector('.announcement-inner');
    if(!bar||!inner||inner.querySelector('.fsa-news-ticker'))return;
    injectStyles();

    const source=inner.querySelector('[data-site-announcement]');
    const legacyText=(source?.textContent||[...inner.children].find(node=>node.tagName==='SPAN'&&!node.classList.contains('announcement-dot'))?.textContent||'').trim();
    [...inner.children].forEach(node=>{
      if(node.matches('.announcement-dot,[data-site-announcement]')||(node.tagName==='SPAN'&&!node.classList.contains('announcement-close'))||(node.tagName==='A'&&!node.closest('.fsa-news-ticker')))node.classList.add('fsa-ticker-legacy');
    });

    const ticker=document.createElement('div');ticker.className='fsa-news-ticker';ticker.setAttribute('aria-label','Latest academy news');
    const label=document.createElement('strong');label.className='fsa-news-label';label.innerHTML=`${icon('megaphone')}<span>Latest</span>`;
    const viewport=document.createElement('div');viewport.className='fsa-news-viewport';
    const track=document.createElement('div');track.className='fsa-news-track';viewport.appendChild(track);ticker.append(label,viewport);
    const close=inner.querySelector('.announcement-close');inner.insertBefore(ticker,close||null);

    let lastSignature='';
    const build=()=>{
      const dynamic=(source?.textContent||legacyText).trim();
      const news=[...(dynamic?[{text:dynamic,href:'/courses'}]:[]),...(window.FSA_CONTENT?.get()?.news||[])].filter((item,index,list)=>list.findIndex(other=>other.text.toLowerCase()===item.text.toLowerCase())===index);
      const signature=news.map(item=>`${item.text}|${item.href}`).join('||');
      if(signature===lastSignature&&track.childElementCount)return;
      lastSignature=signature;
      track.innerHTML='';
      [false,true].forEach(duplicate=>{
        const group=document.createElement('span');group.className='fsa-news-group';if(duplicate)group.setAttribute('aria-hidden','true');
        news.forEach(item=>{
          const link=document.createElement('a');link.className='fsa-news-item';link.href=routeHref(item.href);if(duplicate)link.tabIndex=-1;
          const text=document.createElement('span');text.textContent=item.text;link.appendChild(text);group.appendChild(link);
        });
        track.appendChild(group);
      });
      requestAnimationFrame(()=>{const distance=Math.max(900,track.scrollWidth/2);ticker.style.setProperty('--ticker-duration',`${Math.max(30,Math.round(distance/42))}s`)});
    };
    build();
    if(source)new MutationObserver(build).observe(source,{childList:true,characterData:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* --------------------------------------------------------------------------
   FSA Course Activity Flash — V45
   Ecommerce-style course and batch updates for public website pages.
   -------------------------------------------------------------------------- */
(() => {
  'use strict';

  const ROOT_ID='fsaCourseActivity';
  const HIDDEN_KEY='fsa_course_activity_hidden_v1';
  const onBranch=()=>/\/branches\//.test(location.pathname.replace(/\\/g,'/'));
  const routeHref=path=>onBranch()?`../../index.html#${path}`:`#${path}`;
  const assetHref=path=>onBranch()?`../../${path}`:path;
  const currentPath=()=>decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]||'/';
  const privateRoutes=['/login','/register','/forgot-password','/reset-password','/dashboard','/my-courses','/wishlist','/certificates','/purchase-history','/profile','/checkout','/checkout-success'];
  const shouldShow=()=>onBranch()||(!privateRoutes.includes(currentPath())&&!currentPath().startsWith('/learn/'));
  const icon=(name,cls='',filled=false)=>window.FSA_UI?.icon?.(name,cls,filled)||'';
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function updates(){
    const data=window.FSA_DATA||{};
    return (data.batches||[]).map(batch=>{
      const course=(data.courses||[]).find(c=>Number(c.id)===Number(batch.courseId)||c.slug===batch.slug);
      return {kind:batch.mode||'',icon:batch.modeKey==='recorded'?'video':'calendar',title:course?.title||batch.course,slug:course?.slug||batch.slug,message:batch.modeKey==='recorded'?batch.start:[batch.mode,batch.start].filter(Boolean).join(' · '),meta:[batch.branch,batch.time,batch.seats==null?'':`${batch.seats} seats`].filter(Boolean).join(' · '),image:course?.image||batch.image||'',art:course?.image||batch.image||''};
    });
  }

  function injectStyles(){
    if(document.getElementById('fsaCourseActivityStyles'))return;
    const style=document.createElement('style');style.id='fsaCourseActivityStyles';
    style.textContent=`
      #${ROOT_ID},#${ROOT_ID} *{box-sizing:border-box}
      #${ROOT_ID}{--activity-brand:var(--brand,var(--brand));position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(82px,calc(env(safe-area-inset-bottom) + 82px));z-index:850;width:min(370px,calc(100vw - 36px));max-width:calc(100vw - 36px);font-family:Inter,Arial,sans-serif;pointer-events:none;visibility:hidden}
      #${ROOT_ID}[hidden]{display:none!important}
      #${ROOT_ID}.is-visible{visibility:visible}
      .fsa-activity-card{position:relative;display:grid;grid-template-columns:64px minmax(0,1fr) 30px;gap:11px;align-items:center;width:100%;min-width:0;padding:11px 10px;border:1px solid #ead9dc;border-radius:17px;background:rgba(255,255,255,.985);box-shadow:0 18px 52px rgba(55,31,36,.18);overflow:hidden;pointer-events:auto;opacity:0;transform:translate3d(-24px,12px,0) scale(.97);transition:opacity .3s ease,transform .38s cubic-bezier(.2,.8,.2,1)}
      #${ROOT_ID}.is-visible .fsa-activity-card{opacity:1;transform:none}
      #${ROOT_ID}.is-leaving .fsa-activity-card{opacity:0;transform:translate3d(-18px,6px,0) scale(.985)}
      .fsa-activity-card:before{content:"";position:absolute;left:0;bottom:0;height:3px;width:100%;background:var(--activity-brand);transform-origin:left;animation:fsaActivityTimer 6.4s linear both}
      .fsa-activity-link{display:contents;color:inherit;text-decoration:none}
      .fsa-activity-art{position:relative;display:grid;width:64px;height:64px;place-items:center;overflow:hidden;border-radius:13px;background:linear-gradient(145deg,#faedef,#f4dfe3);color:var(--activity-brand)}
      .fsa-activity-art img{display:block;width:100%;height:100%;object-fit:cover}
      .fsa-activity-art:after{content:"";position:absolute;inset:0;border:1px solid rgba(var(--brand-rgb),.08);border-radius:inherit;pointer-events:none}
      .fsa-activity-copy{display:block;min-width:0;padding:1px 0}
      .fsa-activity-kind{display:flex;align-items:center;gap:5px;margin-bottom:4px;color:var(--activity-brand);font-size:7.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
      .fsa-activity-kind i{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:#50ad7b;box-shadow:0 0 0 4px rgba(80,173,123,.11)}
      .fsa-activity-copy strong{display:block;max-width:100%;overflow:hidden;color:#263a33;font:700 11px/1.35 Poppins,Inter,sans-serif;text-overflow:ellipsis;white-space:nowrap}
      .fsa-activity-copy span{display:block;margin-top:3px;color:#665f61;font-size:9px;font-weight:600;line-height:1.35;overflow-wrap:anywhere}
      .fsa-activity-copy small{display:flex;align-items:center;gap:5px;margin-top:5px;color:#908387;font-size:7.8px;line-height:1.3}
      .fsa-activity-copy small svg{width:11px;height:11px;color:var(--activity-brand)}
      .fsa-activity-close{align-self:start;display:grid;width:28px;height:28px;place-items:center;padding:0;border:0;border-radius:9px;background:#faf2f4;color:#916c73;cursor:pointer;transition:.18s ease}
      .fsa-activity-close:hover{background:#f2dfe3;color:var(--activity-brand)}
      .fsa-activity-close svg{width:13px;height:13px}
      @keyframes fsaActivityTimer{from{transform:scaleX(0)}to{transform:scaleX(1)}}
      body:has(.toast-stack .toast) .scroll-top{bottom:140px!important}
      @media(max-width:520px){#${ROOT_ID}{left:max(12px,env(safe-area-inset-left));bottom:max(72px,calc(env(safe-area-inset-bottom) + 72px));width:min(352px,calc(100vw - 24px));max-width:calc(100vw - 24px)}.fsa-activity-card{grid-template-columns:54px minmax(0,1fr) 27px;gap:9px;padding:9px;border-radius:15px}.fsa-activity-art{width:54px;height:54px;border-radius:11px}.fsa-activity-copy strong{font-size:10px}.fsa-activity-copy span{font-size:8.5px}.fsa-activity-close{width:27px;height:27px}}
      @media(max-width:340px){.fsa-activity-card{grid-template-columns:46px minmax(0,1fr) 25px}.fsa-activity-art{width:46px;height:50px}.fsa-activity-copy small{display:none}.fsa-activity-close{width:25px;height:25px}}
      @media(prefers-reduced-motion:reduce){.fsa-activity-card{transition:none!important}.fsa-activity-card:before{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    if(document.getElementById(ROOT_ID))return;
    let dismissed=false;
    try{dismissed=sessionStorage.getItem(HIDDEN_KEY)==='1'}catch(_){}
    if(dismissed)return;
    injectStyles();
    document.body.insertAdjacentHTML('beforeend',`<aside id="${ROOT_ID}" role="status" aria-live="polite" aria-atomic="true"></aside>`);
    const root=document.getElementById(ROOT_ID);
    let index=0,showTimer=null,nextTimer=null,leaving=false;

    const clearTimers=()=>{window.clearTimeout(showTimer);window.clearTimeout(nextTimer)};
    const schedule=(delay=8500)=>{window.clearTimeout(nextTimer);if(!dismissed&&shouldShow()&&!document.hidden)nextTimer=window.setTimeout(show,delay)};
    const hide=(thenSchedule=true)=>{
      if(!root.classList.contains('is-visible')||leaving)return;
      leaving=true;window.clearTimeout(showTimer);root.classList.add('is-leaving');
      window.setTimeout(()=>{root.classList.remove('is-visible','is-leaving');root.innerHTML='';leaving=false;if(thenSchedule)schedule()},330);
    };
    const show=()=>{
      if(dismissed||!shouldShow()||document.hidden){schedule(3000);return}
      const items=updates();if(!items.length){hide(false);schedule(8500);return;}const item=items[index%items.length];index=(index+1)%items.length;
      root.innerHTML=`<article class="fsa-activity-card"><a class="fsa-activity-link" href="${escapeHtml(routeHref(`/course/${encodeURIComponent(item.slug)}`))}" aria-label="View ${escapeHtml(item.title)}"><span class="fsa-activity-art"><img src="${escapeHtml(item.image)}" alt="" loading="eager"></span><span class="fsa-activity-copy"><b class="fsa-activity-kind"><i aria-hidden="true"></i>${escapeHtml(item.kind)}</b><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.message)}</span><small>${icon(item.icon)}${escapeHtml(item.meta)}</small></span></a><button class="fsa-activity-close" type="button" aria-label="Hide course updates" title="Hide updates">${icon('x')}</button></article>`;
      const image=root.querySelector('.fsa-activity-art img');if(image)image.addEventListener('error',()=>{image.src=assetHref(item.art)},{once:true});
      root.hidden=false;root.classList.remove('is-leaving');requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('is-visible')));
      showTimer=window.setTimeout(()=>hide(true),6400);
    };

    root.addEventListener('click',event=>{
      if(event.target.closest('.fsa-activity-close')){
        dismissed=true;try{sessionStorage.setItem(HIDDEN_KEY,'1')}catch(_){}clearTimers();hide(false);return;
      }
      if(event.target.closest('.fsa-activity-link')){clearTimers();hide(false)}
    });
    root.addEventListener('mouseenter',()=>window.clearTimeout(showTimer));
    root.addEventListener('mouseleave',()=>{if(root.classList.contains('is-visible'))showTimer=window.setTimeout(()=>hide(true),2400)});
    window.addEventListener('hashchange',()=>{root.hidden=!shouldShow();if(!shouldShow()){clearTimers();root.classList.remove('is-visible','is-leaving');root.innerHTML=''}else schedule(2400)});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimers();root.classList.remove('is-visible','is-leaving');root.innerHTML=''}else schedule(2200)});
    root.hidden=!shouldShow();schedule(3600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
