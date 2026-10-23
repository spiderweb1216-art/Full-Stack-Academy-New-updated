/* Full Stack Academy — Placements: Companies + Successfully Placed Alumni
   Public placement/company data adapted into the LMS design system. */
(() => {
  'use strict';

  const CONTACT_EMAIL = 'info@fullstackacademy.in';

  const companies = [];

  const alumni = [];

  const extraCompanyLogos = {
    'Invertio Solutions':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-1-rjns4k5emmt9qm9ji0neal9j6gt8gddmhxoruyxb0g.png',
    'Nakshatra Systems':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-rjns24qez1hlqvsiogv3cpbnxms3kiql5x0m88ix34.png',
    'Radiant Digital Solutions':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/download-rjmejnget9ep7gxz3zc90i7u90eavmf03gkvubfchs.png',
    'Mitsubishi Heavy Industries':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-7-rjpmevwv9viirtzq10r3xwqn58wt19xhl5mw36p0cg.png',
    'Shop Online New York':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-9-rjptxs0ew0ceq6i97m5g11ty9vpyd0cn5y1i4z1h4w.png',
    'Techdome Solution':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-6-rjplty2b0quk4keqaywbe6yyq84fk0srdifh79qqyo.png',
    'LoyaltyMethods':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/loyalty-qw2g6j56kmws9xus46fhvhl56cq94gl5abzb4m8npc.png',
    'Access Meditech':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-3-rjnwz9fiv3ytlii0d185806pvlq635xmumqlxdw4jk.png',
    'INFOLOB':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/logo-website-4-rjnxgaaan39rv9rsye4wdpj96tthhtimiw36tsnfuo.png',
    'Verizon':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/verison-qw2u0h5922k4pck9gx1k9c0u1of9s4e4qxgaglxlhc.png',
    'EverestDX':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/evegents-qw2op463paln38ivvp8u54fkcpm5qfpdfs6o7nny80.png',
    'Pinscale':'https://fullstackacademy.in/wp-content/uploads/elementor/thumbs/pinscales-qw2ld7v7y2gy5uojzvi03dmwjcknwbpyach0h1frwg.png'
  };

  const esc = value => String(value ?? '').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const norm = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
  const initials = name => String(name || 'FS').trim().split(/\s+/).slice(0,2).map(word=>word[0]||'').join('').toUpperCase();
  const unique = values => [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const newestFirst = (a,b) => {
    const date = r => { const v=r.created_at||r.createdAt||r.created_on||r.published_at||''; const t=v?Date.parse(String(v)):NaN; return Number.isFinite(t)?t:0; };
    return date(b)-date(a) || (Number(b.id)||0)-(Number(a.id)||0);
  };
  const salaryValue = salary => { const raw=String(salary ?? '').trim(); if(!raw || !/\d/.test(raw)) return NaN; const value=Number.parseFloat(raw.replace(/[^0-9.]/g,'')); return Number.isFinite(value)?value:NaN; };
  const canonicalCompany = name => {
    const n = norm(name);
    if (n === 'hcl tech') return 'HCL';
    if (n === 'tcs') return 'Tata Consultancy Services';
    return name;
  };

  const logoForCompany = name => {
    const wanted=norm(canonicalCompany(name));
    const company=(window.FSA_DATA?.companies||[]).find(item=>norm(canonicalCompany(item.name))===wanted||norm(item.name)===norm(name));
    return company?.logo || '';
  };

  let courseList = [];
  let alumniCompanyList = [];

  const companyState = { query:'', groups:new Set(), evidence:'all', sort:'newest', page:1, perPage:50, filtersOpen:false };
  const alumniState = { query:'', courses:new Set(), companies:new Set(), companyQuery:'', salary:'all', sort:'newest', page:1, perPage:50, filtersOpen:false, expandedCompanies:false };
  let activePage = '';

  function icon(name) {
    const premiumMap={close:'x',trend:'trend'};
    if(window.FSA_UI?.icon)return window.FSA_UI.icon(premiumMap[name]||name,'placement-premium-icon');
    const paths = {
      search:'<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
      filter:'<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"></path>',
      close:'<path d="m6 6 12 12M18 6 6 18"></path>',
      chevron:'<path d="m8 10 4 4 4-4"></path>',
      briefcase:'<path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M3 12h18"></path>',
      users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9"></path>',
      check:'<path d="m5 12 4 4L19 6"></path>',
      arrow:'<path d="M5 12h14M13 6l6 6-6 6"></path>',
      building:'<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M9 21v-2h6v2"></path>',
      award:'<circle cx="12" cy="8" r="5"></circle><path d="m8.5 12 1 9 2.5-2 2.5 2 1-9"></path>',
      trend:'<path d="m3 17 6-6 4 4 8-9"></path><path d="M15 6h6v6"></path>',
      mail:'<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  }

  function companyPlacements(companyName) {
    const target = norm(canonicalCompany(companyName));
    return alumni.filter(item=>norm(canonicalCompany(item.company))===target);
  }

  function companyGroup(name) {
    const letter = String(name || '').trim()[0]?.toUpperCase() || '#';
    if (letter >= 'A' && letter <= 'F') return 'A–F';
    if (letter >= 'G' && letter <= 'L') return 'G–L';
    if (letter >= 'M' && letter <= 'R') return 'M–R';
    return 'S–Z';
  }

  function filterCheckbox({value,count,type,checked,prefix='placement'}) {
    const id = `${prefix}-${type}-${value.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
    return `<label class="candidate-check" for="${esc(id)}"><span><input id="${esc(id)}" type="checkbox" data-placement-${type}="${esc(value)}" ${checked?'checked':''}><i>${icon('check')}</i><b>${esc(value)}</b></span><small>${count}</small></label>`;
  }

  function filterRadio({value,label,count,type,checked,prefix='placement'}) {
    const id = `${prefix}-${type}-${String(value).replace(/[^a-z0-9]+/gi,'-')}`;
    return `<label class="placement-radio" for="${esc(id)}"><span><input id="${esc(id)}" type="radio" name="${esc(prefix)}-${esc(type)}" value="${esc(value)}" data-placement-${type} ${checked?'checked':''}><i></i><b>${esc(label)}</b></span>${count !== undefined ? `<small>${count}</small>` : ''}</label>`;
  }

  function pageHero({eyebrow,title,em,text,actions,stat,statLabel,miniA,miniALabel,miniB,miniBLabel,kind='placements'}) {
    return `<section class="placement-page-hero ${kind}"><div class="container placement-hero-grid"><div class="placement-hero-copy"><span class="candidate-eyebrow">${esc(eyebrow)}</span><h1>${esc(title)} <em>${esc(em)}</em></h1><p>${esc(text)}</p><div class="candidate-hero-actions">${actions}</div><div class="candidate-trust-row"><span>${icon('check')} Career-focused training</span><span>${icon('check')} Verified FSA placement network</span><span>${icon('check')} Recruiter-ready directories</span></div></div><div class="placement-stat-panel"><span class="placement-stat-kicker">Placement network</span><strong>${esc(stat)}</strong><span>${esc(statLabel)}</span><div class="candidate-hero-mini-grid"><div><b>${esc(miniA)}</b><small>${esc(miniALabel)}</small></div><div><b>${esc(miniB)}</b><small>${esc(miniBLabel)}</small></div></div><div class="placement-stat-note">${icon(kind==='companies'?'building':'award')} <p><b>Full Stack Academy</b><small>Training → placement → career outcomes</small></p></div></div></div></section>`;
  }

  function contactHireUrl() {
    const subject = encodeURIComponent('Hiring support — Full Stack Academy');
    const body = encodeURIComponent('Hello Full Stack Academy Placement Team,\n\nI would like to discuss hiring trained candidates from your placement pool.\n\nRegards,');
    return `mailto:${encodeURIComponent(window.FSA_DATA?.content?.placementEmail||window.FSA_DATA?.site?.support_email||CONTACT_EMAIL)}?subject=${subject}&body=${body}`;
  }

  // ---------- COMPANIES ----------
  function filteredCompanies() {
    const q = norm(companyState.query);
    let rows = companies.filter(company=>{
      const placements = companyPlacements(company.name);
      if (q && !norm([company.name,company.sector,company.location,company.description,company.hiringStatus].join(' ')).includes(q)) return false;
      if (companyState.groups.size && !companyState.groups.has(companyGroup(company.name))) return false;
      if (companyState.evidence === 'with' && !placements.length) return false;
      return true;
    }).map(company=>({ ...company, placements:companyPlacements(company.name) }));

    if (companyState.sort === 'newest') rows.sort(newestFirst);
    else if (companyState.sort === 'name-desc') rows.sort((a,b)=>b.name.localeCompare(a.name));
    else if (companyState.sort === 'placements') rows.sort((a,b)=>b.placements.length-a.placements.length || a.name.localeCompare(b.name));
    else rows.sort((a,b)=>a.name.localeCompare(b.name));
    return rows;
  }

  function companyFilterCount() { return companyState.groups.size + (companyState.evidence!=='all'?1:0) + (companyState.query?1:0); }
  function companyGroupCounts(){ return Object.fromEntries(['A–F','G–L','M–R','S–Z'].map(group=>[group,companies.filter(c=>companyGroup(c.name)===group).length])); }

  function renderCompanySidebar() {
    return `<aside class="candidate-sidebar ${companyState.filtersOpen?'is-open':''}" data-placement-sidebar><div class="candidate-sidebar-head"><div><span>${icon('filter')}</span><div><strong>Filter companies</strong><small>Explore the hiring network</small></div></div><button type="button" data-placement-action="close-filters" aria-label="Close filters">${icon('close')}</button></div><div class="candidate-filter-group"><div class="candidate-filter-label"><span>Company A–Z</span>${companyState.groups.size?'<button type="button" data-placement-clear="groups">Clear</button>':''}</div><div class="candidate-check-list">${['A–F','G–L','M–R','S–Z'].map(group=>filterCheckbox({value:group,count:companyGroupCounts()[group],type:'group',checked:companyState.groups.has(group),prefix:'company'})).join('')}</div></div><div class="candidate-filter-group"><div class="candidate-filter-label"><span>Placement evidence</span></div><div class="placement-radio-list">${filterRadio({value:'all',label:'All companies',count:companies.length,type:'evidence',checked:companyState.evidence==='all',prefix:'company'})}${filterRadio({value:'with',label:'Published alumni',count:companies.filter(c=>companyPlacements(c.name).length).length,type:'evidence',checked:companyState.evidence==='with',prefix:'company'})}</div></div><div class="candidate-sidebar-footer"><button type="button" class="button button-secondary button-block" data-placement-action="reset">Reset all filters</button></div></aside>`;
  }

  function renderCompanyActiveFilters() {
    const chips=[];
    if(companyState.query) chips.push(`<button type="button" data-placement-remove="query">Search: “${esc(companyState.query)}” ${icon('close')}</button>`);
    companyState.groups.forEach(group=>chips.push(`<button type="button" data-placement-remove-group="${esc(group)}">${esc(group)} ${icon('close')}</button>`));
    if(companyState.evidence==='with') chips.push(`<button type="button" data-placement-remove="evidence">Published alumni ${icon('close')}</button>`);
    return chips.length?`<div class="candidate-active-filters"><span>Active filters</span>${chips.join('')}<button class="candidate-clear-all" type="button" data-placement-action="reset">Clear all</button></div>`:'';
  }

  function companyCard(company) {
    const tracks = unique(company.placements.map(item=>item.course)).slice(0,3);
    const count=company.placements.length;
    return `<article class="company-card"><div class="company-logo-stage"><span class="company-logo-fallback">${esc(initials(company.name))}</span>${company.logo?`<img src="${esc(company.logo)}" alt="${esc(company.name)} logo" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.previousElementSibling.hidden=true" onerror="this.style.display='none'">`:''}</div><div class="company-card-body"><div class="company-card-top"><span>${icon('building')} Hiring company</span>${count?`<b>${count} placement${count===1?'':'s'}</b>`:'<b>FSA network</b>'}</div><h3>${esc(company.name)}</h3><p>${esc(company.description || (count?`${count} published FSA alumni placement${count===1?'':'s'} connected with this company.`:'Listed in the Full Stack Academy placement and employer network.'))}</p><div class="company-track-tags">${company.sector?`<span>${esc(company.sector)}</span>`:''}${company.location?`<span>${esc(company.location)}</span>`:''}</div><div class="company-track-tags">${tracks.length?tracks.map(track=>`<span>${esc(track)}</span>`).join(''):'<span>Hiring partner</span>'}</div></div><div class="company-card-footer">${count?`<a href="#/alumni?company=${encodeURIComponent(encodeURIComponent(company.name))}">View placed alumni ${icon('arrow')}</a>`:`<span>Placement network</span>`}</div></article>`;
  }

  function renderCompanyResults() {
    const rows=filteredCompanies();
    const pages=Math.max(1,Math.ceil(rows.length/companyState.perPage));
    if(companyState.page>pages) companyState.page=pages;
    const start=(companyState.page-1)*companyState.perPage;
    const visible=rows.slice(start,start+companyState.perPage);
    const from=rows.length?start+1:0,to=Math.min(start+companyState.perPage,rows.length);
    return `<div class="candidate-results-wrap"><div class="candidate-results-toolbar"><div><button class="candidate-mobile-filter" type="button" data-placement-action="open-filters">${icon('filter')} Filters ${companyFilterCount()?`<b>${companyFilterCount()}</b>`:''}</button><p><strong>${rows.length}</strong> compan${rows.length===1?'y':'ies'} found <span>· Showing ${from}–${to}</span></p></div><label class="candidate-sort"><span>Sort by</span><select data-placement-sort><option value="newest" ${companyState.sort==='newest'?'selected':''}>Newest First</option><option value="name-asc" ${companyState.sort==='name-asc'?'selected':''}>Name: A–Z</option><option value="name-desc" ${companyState.sort==='name-desc'?'selected':''}>Name: Z–A</option><option value="placements" ${companyState.sort==='placements'?'selected':''}>Most placements</option></select>${icon('chevron')}</label></div>${renderCompanyActiveFilters()}${visible.length?`<div class="company-grid">${visible.map(companyCard).join('')}</div>`:`<div class="candidate-empty-state"><span>${icon('building')}</span><h3>No companies match these filters.</h3><p>Try another company name, A–Z group, or clear the placement filter.</p><button type="button" class="button button-primary" data-placement-action="reset">Clear filters</button></div>`}${renderPagination(pages,companyState.page,'company')}</div>`;
  }

  function renderCompanyDirectory(app) {
    const node=app.querySelector('[data-placement-directory]'); if(!node)return;
    node.innerHTML=`<div class="candidate-directory-layout">${renderCompanySidebar()}${renderCompanyResults()}</div><button class="candidate-filter-backdrop ${companyState.filtersOpen?'show':''}" type="button" data-placement-action="close-filters" aria-label="Close filters"></button>`;
  }

  function renderCompanies(app) {
    if(!app)return; syncAlumniData(); const backendCompanies=Array.isArray(window.FSA_DATA?.companies)?window.FSA_DATA.companies:[]; companies.splice(0,companies.length,...backendCompanies.map((company,index)=>({...company,id:company.id||index+1,placementCount:Number(company.placementCount||0)}))); activePage='companies'; companyState.filtersOpen=false; document.body.classList.remove('candidate-filter-lock');
    const published=companies.filter(company=>companyPlacements(company.name).length).length;
    app.innerHTML=`${pageHero({eyebrow:'Hiring & Placement Network',title:'Companies that connect with',em:'Full Stack Academy talent.',text:'Browse the employer network represented on the Full Stack Academy placement pages, then filter companies and jump directly to published alumni outcomes.',actions:`<a class="button button-primary" href="#companiesDirectory">Browse Companies ${icon('arrow')}</a><a class="button button-secondary" href="#/candidates">View Available Candidates</a>`,stat:`${companies.length}+`,statLabel:'company profiles',miniA:published,miniALabel:'With published alumni',miniB:alumni.length,miniBLabel:'Placement outcomes',kind:'companies'})}<section class="placement-specialties"><div class="container"><div class="placement-specialty-grid"><article><span>${icon('users')}</span><div><strong>Job-ready talent</strong><p>Career-focused learners trained through practical tracks.</p></div></article><article><span>${icon('briefcase')}</span><div><strong>Multiple tech tracks</strong><p>Cloud, DevOps, full stack, data and security profiles.</p></div></article><article><span>${icon('trend')}</span><div><strong>Outcome-led network</strong><p>Explore companies alongside published placement outcomes.</p></div></article></div></div></section><section class="placement-directory-section" id="companiesDirectory"><div class="container"><div class="candidate-directory-heading"><div><span class="candidate-eyebrow">Company Directory</span><h2>Explore the FSA employer network.</h2><p>Search by company, filter alphabetically, or show companies connected to published alumni placements.</p></div><label class="candidate-main-search">${icon('search')}<input type="search" data-placement-search placeholder="Search companies..." value="${esc(companyState.query)}" autocomplete="off"><kbd>⌘ K</kbd></label></div><div data-placement-directory></div></div></section><section class="candidate-recruiter-cta"><div class="container"><div class="candidate-recruiter-cta-inner"><div><span class="candidate-eyebrow">Hiring Partner?</span><h2>Looking for trained candidates for your team?</h2><p>Browse the currently available talent pool or contact the placement team for help matching candidates to your role.</p></div><a class="button" href="${esc(contactHireUrl())}">${icon('mail')} Talk to Placement Team</a></div></div></section>`;
    renderCompanyDirectory(app);
  }

  // ---------- ALUMNI ----------
  let courseCounts={};
  let alumniCompanyCounts={};
  function syncAlumniData(){
    const rows=Array.isArray(window.FSA_DATA?.alumni)?window.FSA_DATA.alumni:[];
    alumni.splice(0,alumni.length,...rows.map((item,index)=>({...item,id:Number(item.id||index+1)})));
    courseList=unique(alumni.map(item=>item.course).filter(Boolean));
    alumniCompanyList=unique(alumni.map(item=>item.company).filter(Boolean));
    courseCounts=Object.fromEntries(courseList.map(course=>[course,alumni.filter(item=>item.course===course).length]));
    alumniCompanyCounts=Object.fromEntries(alumniCompanyList.map(company=>[company,alumni.filter(item=>item.company===company).length]));
  }

  function salaryMatches(value,filter) {
    if (filter !== 'all' && !Number.isFinite(value)) return false;
    if(filter==='under-3')return value<3;
    if(filter==='3-5')return value>=3&&value<5;
    if(filter==='5-10')return value>=5&&value<10;
    if(filter==='10-plus')return value>=10;
    return true;
  }

  function filteredAlumni() {
    const q=norm(alumniState.query);
    let rows=alumni.filter(item=>{
      if(q && !norm([item.name,item.course,item.role,item.company,item.salary].join(' ')).includes(q))return false;
      if(alumniState.courses.size&&!alumniState.courses.has(item.course))return false;
      if(alumniState.companies.size&&![...alumniState.companies].some(name=>norm(canonicalCompany(name))===norm(canonicalCompany(item.company))))return false;
      if(!salaryMatches(salaryValue(item.salary),alumniState.salary))return false;
      return true;
    });
    if(alumniState.sort==='newest')rows.sort(newestFirst);
    else if(alumniState.sort==='salary-desc')rows.sort((a,b)=>(Number.isFinite(salaryValue(b.salary))?salaryValue(b.salary):-1)-(Number.isFinite(salaryValue(a.salary))?salaryValue(a.salary):-1)||a.name.localeCompare(b.name));
    else if(alumniState.sort==='salary-asc')rows.sort((a,b)=>(Number.isFinite(salaryValue(a.salary))?salaryValue(a.salary):Infinity)-(Number.isFinite(salaryValue(b.salary))?salaryValue(b.salary):Infinity)||a.name.localeCompare(b.name));
    else if(alumniState.sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));
    else if(alumniState.sort==='company')rows.sort((a,b)=>a.company.localeCompare(b.company)||a.name.localeCompare(b.name));
    else rows.sort(newestFirst);
    return rows;
  }

  function alumniFilterCount() { return alumniState.courses.size+alumniState.companies.size+(alumniState.salary!=='all'?1:0)+(alumniState.query?1:0); }

  function renderAlumniCompaniesFilter() {
    const q=norm(alumniState.companyQuery);
    const filtered=alumniCompanyList.filter(company=>!q||norm(company).includes(q));
    const visible=alumniState.expandedCompanies||q?filtered:filtered.slice(0,10);
    return `<div class="candidate-filter-group"><div class="candidate-filter-label"><span>Company</span>${alumniState.companies.size?'<button type="button" data-placement-clear="companies">Clear</button>':''}</div><label class="candidate-filter-search">${icon('search')}<input type="search" data-placement-company-search placeholder="Search companies" value="${esc(alumniState.companyQuery)}"></label><div class="candidate-check-list">${visible.length?visible.map(company=>filterCheckbox({value:company,count:alumniCompanyCounts[company]||0,type:'company',checked:alumniState.companies.has(company),prefix:'alumni'})).join(''):'<p class="candidate-filter-empty">No matching companies.</p>'}</div>${!q&&filtered.length>10?`<button class="candidate-show-more" type="button" data-placement-action="toggle-companies">${alumniState.expandedCompanies?'Show fewer companies':`Show all ${filtered.length} companies`} ${icon('chevron')}</button>`:''}</div>`;
  }

  function renderAlumniSidebar() {
    return `<aside class="candidate-sidebar ${alumniState.filtersOpen?'is-open':''}" data-placement-sidebar><div class="candidate-sidebar-head"><div><span>${icon('filter')}</span><div><strong>Filter alumni</strong><small>Refine placement outcomes</small></div></div><button type="button" data-placement-action="close-filters" aria-label="Close filters">${icon('close')}</button></div><div class="candidate-filter-group"><div class="candidate-filter-label"><span>Training track</span>${alumniState.courses.size?'<button type="button" data-placement-clear="courses">Clear</button>':''}</div><div class="candidate-check-list">${courseList.map(course=>filterCheckbox({value:course,count:courseCounts[course]||0,type:'course',checked:alumniState.courses.has(course),prefix:'alumni'})).join('')}</div></div>${renderAlumniCompaniesFilter()}<div class="candidate-filter-group"><div class="candidate-filter-label"><span>Package range</span></div><div class="placement-radio-list">${filterRadio({value:'all',label:'All packages',type:'salary',checked:alumniState.salary==='all',prefix:'alumni'})}${filterRadio({value:'under-3',label:'Under 3 LPA',type:'salary',checked:alumniState.salary==='under-3',prefix:'alumni'})}${filterRadio({value:'3-5',label:'3–4.9 LPA',type:'salary',checked:alumniState.salary==='3-5',prefix:'alumni'})}${filterRadio({value:'5-10',label:'5–9.9 LPA',type:'salary',checked:alumniState.salary==='5-10',prefix:'alumni'})}${filterRadio({value:'10-plus',label:'10+ LPA',type:'salary',checked:alumniState.salary==='10-plus',prefix:'alumni'})}</div></div><div class="candidate-sidebar-footer"><button type="button" class="button button-secondary button-block" data-placement-action="reset">Reset all filters</button></div></aside>`;
  }

  function renderAlumniActiveFilters() {
    const chips=[];
    if(alumniState.query)chips.push(`<button type="button" data-placement-remove="query">Search: “${esc(alumniState.query)}” ${icon('close')}</button>`);
    alumniState.courses.forEach(course=>chips.push(`<button type="button" data-placement-remove-course="${esc(course)}">${esc(course)} ${icon('close')}</button>`));
    alumniState.companies.forEach(company=>chips.push(`<button type="button" data-placement-remove-company="${esc(company)}">${esc(company)} ${icon('close')}</button>`));
    if(alumniState.salary!=='all')chips.push(`<button type="button" data-placement-remove="salary">${esc({'under-3':'Under 3 LPA','3-5':'3–4.9 LPA','5-10':'5–9.9 LPA','10-plus':'10+ LPA'}[alumniState.salary])} ${icon('close')}</button>`);
    return chips.length?`<div class="candidate-active-filters"><span>Active filters</span>${chips.join('')}<button class="candidate-clear-all" type="button" data-placement-action="reset">Clear all</button></div>`:'';
  }

  function alumniCard(item) {
    const logo=logoForCompany(item.company);
    return `<article class="alumni-card"><div class="alumni-card-media"><span class="candidate-photo-fallback">${esc(initials(item.name))}</span>${item.image?`<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.previousElementSibling.hidden=true" onerror="this.style.display='none'">`:''}<span class="alumni-placed-badge">${icon('check')} Placed</span></div><div class="alumni-card-body"><div class="alumni-card-kicker">${esc(item.course)}</div><div class="alumni-identity-row"><div class="alumni-person"><h3>${esc(item.name)}</h3><p class="alumni-role">${esc(item.role)}</p></div><div class="alumni-company-side"><span class="alumni-company-logo">${logo?`<img src="${esc(logo)}" alt="${esc(item.company)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none'">`:`<b>${esc(initials(item.company))}</b>`}</span><strong>${esc(item.company)}</strong></div></div></div><div class="alumni-card-footer"><div><strong>${esc(item.salary)}</strong><small>Reported package</small></div><span>${icon('award')}</span></div></article>`;
  }

  function renderPagination(pages,current,prefix) {
    if(pages<=1)return '';
    const around=[];
    for(let page=1;page<=pages;page++) if(page===1||page===pages||Math.abs(page-current)<=1) around.push(page);
    let last=0; const buttons=[];
    around.forEach(page=>{ if(last&&page-last>1)buttons.push('<span class="placement-page-gap">…</span>'); buttons.push(`<button type="button" data-placement-page="${page}" class="${page===current?'active':''}">${page}</button>`); last=page; });
    return `<nav class="candidate-pagination" aria-label="${esc(prefix)} pages"><button type="button" data-placement-page="${Math.max(1,current-1)}" ${current===1?'disabled':''}>Previous</button><div>${buttons.join('')}</div><button type="button" data-placement-page="${Math.min(pages,current+1)}" ${current===pages?'disabled':''}>Next</button></nav>`;
  }

  function renderAlumniResults() {
    const rows=filteredAlumni();
    const pages=Math.max(1,Math.ceil(rows.length/alumniState.perPage));
    if(alumniState.page>pages)alumniState.page=pages;
    const start=(alumniState.page-1)*alumniState.perPage;
    const visible=rows.slice(start,start+alumniState.perPage);
    const from=rows.length?start+1:0,to=Math.min(start+alumniState.perPage,rows.length);
    return `<div class="candidate-results-wrap"><div class="candidate-results-toolbar"><div><button class="candidate-mobile-filter" type="button" data-placement-action="open-filters">${icon('filter')} Filters ${alumniFilterCount()?`<b>${alumniFilterCount()}</b>`:''}</button><p><strong>${rows.length}</strong> alumni placement${rows.length===1?'':'s'} found <span>· Showing ${from}–${to}</span></p></div><label class="candidate-sort"><span>Sort by</span><select data-placement-sort><option value="newest" ${alumniState.sort==='newest'?'selected':''}>Newest First</option><option value="salary-desc" ${alumniState.sort==='salary-desc'?'selected':''}>Package: High–Low</option><option value="salary-asc" ${alumniState.sort==='salary-asc'?'selected':''}>Package: Low–High</option><option value="name" ${alumniState.sort==='name'?'selected':''}>Name: A–Z</option><option value="company" ${alumniState.sort==='company'?'selected':''}>Company: A–Z</option></select>${icon('chevron')}</label></div>${renderAlumniActiveFilters()}${visible.length?`<div class="alumni-grid">${visible.map(alumniCard).join('')}</div>`:`<div class="candidate-empty-state"><span>${icon('award')}</span><h3>No alumni placements match these filters.</h3><p>Try another training track, company, package range, or clear your search.</p><button type="button" class="button button-primary" data-placement-action="reset">Clear filters</button></div>`}${renderPagination(pages,alumniState.page,'alumni')}</div>`;
  }

  function renderAlumniDirectory(app) {
    const node=app.querySelector('[data-placement-directory]'); if(!node)return;
    node.innerHTML=`<div class="candidate-directory-layout">${renderAlumniSidebar()}${renderAlumniResults()}</div><button class="candidate-filter-backdrop ${alumniState.filtersOpen?'show':''}" type="button" data-placement-action="close-filters" aria-label="Close filters"></button>`;
  }

  function applyAlumniQuery(queryString='') {
    const params=new URLSearchParams(queryString || '');
    const requested=params.get('company');
    if(!requested)return;
    const exact=alumniCompanyList.find(company=>norm(canonicalCompany(company))===norm(canonicalCompany(requested))||norm(company)===norm(requested));
    if(exact){ alumniState.companies=new Set([exact]); alumniState.page=1; }
  }

  function renderAlumni(app,queryString='') {
    if(!app)return; syncAlumniData(); activePage='alumni'; alumniState.filtersOpen=false; document.body.classList.remove('candidate-filter-lock'); applyAlumniQuery(queryString);
    const highest=alumni.length?Math.max(...alumni.map(item=>salaryValue(item.salary))):0;
    const uniqueCompanies=unique(alumni.map(item=>item.company)).length;
    app.innerHTML=`${pageHero({eyebrow:'Successfully Placed Candidates',title:'From training to',em:'real career outcomes.',text:'Explore Full Stack Academy alumni placements by training track, employer and reported package. Use the filters to quickly study placement outcomes across the academy network.',actions:`<a class="button button-primary" href="#alumniDirectory">Browse Alumni ${icon('arrow')}</a><a class="button button-secondary" href="#/candidates">Candidates Available Now</a>`,stat:alumni.length,statLabel:'published placement outcomes',miniA:uniqueCompanies,miniALabel:'Employers represented',miniB:`${highest} LPA`,miniBLabel:'Highest listed package',kind:'alumni'})}<section class="placement-directory-section" id="alumniDirectory"><div class="container"><div class="candidate-directory-heading"><div><span class="candidate-eyebrow">Alumni Directory</span><h2>Successfully placed FSA candidates.</h2><p>Search by candidate, role or company and refine results by course, employer and package range.</p></div><label class="candidate-main-search">${icon('search')}<input type="search" data-placement-search placeholder="Search alumni, role or company..." value="${esc(alumniState.query)}" autocomplete="off"><kbd>⌘ K</kbd></label></div><div data-placement-directory></div></div></section><section class="candidate-recruiter-cta"><div class="container"><div class="candidate-recruiter-cta-inner"><div><span class="candidate-eyebrow">Hiring Now?</span><h2>See the candidates currently available for placement.</h2><p>Switch from historical alumni outcomes to the current candidate directory with skill and training-track filters.</p></div><a class="button" href="#/candidates">Browse Available Candidates ${icon('arrow')}</a></div></div></section>`;
    renderAlumniDirectory(app);
  }

  function resetCurrent() {
    if(activePage==='companies') Object.assign(companyState,{query:'',groups:new Set(),evidence:'all',sort:'newest',page:1,filtersOpen:false});
    else Object.assign(alumniState,{query:'',courses:new Set(),companies:new Set(),companyQuery:'',salary:'all',sort:'newest',page:1,filtersOpen:false,expandedCompanies:false});
  }

  function rerender() {
    const app=document.getElementById('app'); if(!app)return;
    if(activePage==='companies')renderCompanyDirectory(app); else if(activePage==='alumni')renderAlumniDirectory(app);
    const search=document.querySelector('[data-placement-search]');
    if(search) search.value=(activePage==='companies'?companyState:alumniState).query;
  }

  document.addEventListener('input',event=>{
    const app=document.getElementById('app');
    if(!app||!app.querySelector('.placement-directory-section'))return;
    if(event.target.matches('[data-placement-search]')){
      const state=activePage==='companies'?companyState:alumniState; state.query=event.target.value; state.page=1; rerender();
      const input=document.querySelector('[data-placement-search]'); if(input){input.focus(); input.setSelectionRange(input.value.length,input.value.length);} return;
    }
    if(activePage==='alumni'&&event.target.matches('[data-placement-company-search]')){
      alumniState.companyQuery=event.target.value; alumniState.page=1; rerender();
      const input=document.querySelector('[data-placement-company-search]'); if(input){input.focus(); input.setSelectionRange(input.value.length,input.value.length);} }
  });

  document.addEventListener('change',event=>{
    const app=document.getElementById('app'); if(!app||!app.querySelector('.placement-directory-section'))return;
    if(event.target.matches('[data-placement-sort]')){ (activePage==='companies'?companyState:alumniState).sort=event.target.value; (activePage==='companies'?companyState:alumniState).page=1; rerender(); return; }
    if(activePage==='companies'&&event.target.matches('[data-placement-group]')){ const value=event.target.dataset.placementGroup; event.target.checked?companyState.groups.add(value):companyState.groups.delete(value); companyState.page=1; rerender(); return; }
    if(activePage==='companies'&&event.target.matches('[data-placement-evidence]')){ companyState.evidence=event.target.value; companyState.page=1; rerender(); return; }
    if(activePage==='alumni'&&event.target.matches('[data-placement-course]')){ const value=event.target.dataset.placementCourse; event.target.checked?alumniState.courses.add(value):alumniState.courses.delete(value); alumniState.page=1; rerender(); return; }
    if(activePage==='alumni'&&event.target.matches('[data-placement-company]')){ const value=event.target.dataset.placementCompany; event.target.checked?alumniState.companies.add(value):alumniState.companies.delete(value); alumniState.page=1; rerender(); return; }
    if(activePage==='alumni'&&event.target.matches('[data-placement-salary]')){ alumniState.salary=event.target.value; alumniState.page=1; rerender(); }
  });

  document.addEventListener('click',event=>{
    const app=document.getElementById('app'); if(!app||!app.querySelector('.placement-directory-section'))return;
    const action=event.target.closest('[data-placement-action]');
    if(action){
      const state=activePage==='companies'?companyState:alumniState;
      switch(action.dataset.placementAction){
        case 'open-filters': state.filtersOpen=true; document.body.classList.add('candidate-filter-lock'); break;
        case 'close-filters': state.filtersOpen=false; document.body.classList.remove('candidate-filter-lock'); break;
        case 'reset': resetCurrent(); document.body.classList.remove('candidate-filter-lock'); break;
        case 'toggle-companies': alumniState.expandedCompanies=!alumniState.expandedCompanies; break;
      }
      rerender(); return;
    }
    const page=event.target.closest('[data-placement-page]'); if(page){ const state=activePage==='companies'?companyState:alumniState; state.page=Number(page.dataset.placementPage)||1; rerender(); document.querySelector('.placement-directory-section')?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    const clear=event.target.closest('[data-placement-clear]'); if(clear){ const key=clear.dataset.placementClear; if(activePage==='companies'&&key==='groups')companyState.groups.clear(); if(activePage==='alumni'&&key==='courses')alumniState.courses.clear(); if(activePage==='alumni'&&key==='companies')alumniState.companies.clear(); (activePage==='companies'?companyState:alumniState).page=1; rerender(); return; }
    const remove=event.target.closest('[data-placement-remove]'); if(remove){ const key=remove.dataset.placementRemove; const state=activePage==='companies'?companyState:alumniState; if(key==='query')state.query=''; if(key==='evidence')companyState.evidence='all'; if(key==='salary')alumniState.salary='all'; state.page=1; rerender(); return; }
    const removeGroup=event.target.closest('[data-placement-remove-group]'); if(removeGroup){companyState.groups.delete(removeGroup.dataset.placementRemoveGroup);companyState.page=1;rerender();return;}
    const removeCourse=event.target.closest('[data-placement-remove-course]'); if(removeCourse){alumniState.courses.delete(removeCourse.dataset.placementRemoveCourse);alumniState.page=1;rerender();return;}
    const removeCompany=event.target.closest('[data-placement-remove-company]'); if(removeCompany){alumniState.companies.delete(removeCompany.dataset.placementRemoveCompany);alumniState.page=1;rerender();}
  });

  document.addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'&&document.querySelector('.placement-directory-section')){event.preventDefault();document.querySelector('[data-placement-search]')?.focus();}
    if(event.key==='Escape'&&document.querySelector('.placement-directory-section')){ const state=activePage==='companies'?companyState:alumniState; if(state.filtersOpen){state.filtersOpen=false;document.body.classList.remove('candidate-filter-lock');rerender();} }
  });

  window.addEventListener('hashchange',()=>{ document.body.classList.remove('candidate-filter-lock'); });
  window.FSA_PLACEMENTS_PAGE={renderCompanies,renderAlumni,companies,alumni};
})();
