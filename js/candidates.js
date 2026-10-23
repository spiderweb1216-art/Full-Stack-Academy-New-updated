/* Full Stack Academy — Available Candidates page
   Data is based on the public FSA placement listing and intentionally keeps
   concise, recruiter-friendly skill summaries for fast filtering. */
(() => {
  'use strict';

  const SOURCE_URL = 'https://fullstackacademy.in/available-candidates-for-placement/';
  const CONTACT_EMAIL = 'info@fullstackacademy.in';

  const candidates = [];
  let allCourses = [];
  let allSkills = [];
  let courseCounts = {};
  let skillCounts = {};

  const state = {
    query:'',
    courses:new Set(),
    skills:new Set(),
    skillQuery:'',
    sort:'newest',
    page:1,
    perPage:9,
    filtersOpen:false,
    expandedSkills:false
  };

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const normalize = value => String(value || '').toLocaleLowerCase();
  const initials = name => String(name || 'FS').trim().split(/\s+/).slice(0,2).map(word => word[0] || '').join('').toUpperCase();
  const unique = values => [...new Set(values)].sort((a,b)=>a.localeCompare(b));

  function icon(name) {
    const premiumMap={close:'x',external:'award'};
    if(window.FSA_UI?.icon)return window.FSA_UI.icon(premiumMap[name]||name,'candidate-premium-icon');
    const paths = {
      search:'<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
      filter:'<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"></path>',
      close:'<path d="m6 6 12 12M18 6 6 18"></path>',
      chevron:'<path d="m8 10 4 4 4-4"></path>',
      briefcase:'<path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M3 12h18"></path>',
      users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9"></path>',
      check:'<path d="m5 12 4 4L19 6"></path>',
      mail:'<path d="M4 5h16v14H4z"></path><path d="m4 7 8 6 8-6"></path>',
      external:'<path d="M14 4h6v6"></path><path d="m20 4-9 9"></path><path d="M18 13v6H5V6h6"></path>',
      arrow:'<path d="M5 12h14M13 6l6 6-6 6"></path>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  }

  function counts(values, key) {
    return values.reduce((acc, candidate) => {
      const list = Array.isArray(candidate[key]) ? candidate[key] : [candidate[key]];
      list.forEach(value => acc[value] = (acc[value] || 0) + 1);
      return acc;
    }, {});
  }

  function syncCandidateData(){
    const rows=Array.isArray(window.FSA_DATA?.candidates)?window.FSA_DATA.candidates:[];
    candidates.splice(0,candidates.length,...rows.map((candidate,index)=>({...candidate,id:Number(candidate.id||index+1),skills:Array.isArray(candidate.skills)?candidate.skills:[]})));
    allCourses=unique(candidates.map(candidate=>candidate.course).filter(Boolean));
    allSkills=unique(candidates.flatMap(candidate=>candidate.skills));
    courseCounts=counts(candidates,'course');
    skillCounts=counts(candidates,'skills');
  }

  function filteredCandidates() {
    let rows = candidates.filter(candidate => {
      const searchable = normalize([candidate.name, candidate.course, ...candidate.skills].join(' '));
      const queryMatch = !state.query || searchable.includes(normalize(state.query));
      const courseMatch = !state.courses.size || state.courses.has(candidate.course);
      const skillMatch = !state.skills.size || [...state.skills].every(skill => candidate.skills.includes(skill));
      return queryMatch && courseMatch && skillMatch;
    });

    if (state.sort === 'newest') rows.sort((a,b)=>{
      const time=r=>{ const v=r.created_at||r.createdAt||r.created_on||r.published_at||''; const d=v?Date.parse(String(v)):NaN;return Number.isFinite(d)?d:0; };
      return time(b)-time(a) || (Number(b.id)||0)-(Number(a.id)||0);
    });
    if (state.sort === 'name-asc') rows.sort((a,b)=>a.name.localeCompare(b.name));
    if (state.sort === 'name-desc') rows.sort((a,b)=>b.name.localeCompare(a.name));
    if (state.sort === 'course') rows.sort((a,b)=>a.course.localeCompare(b.course) || a.name.localeCompare(b.name));
    if (state.sort === 'skills-desc') rows.sort((a,b)=>b.skills.length - a.skills.length || a.name.localeCompare(b.name));
    return rows;
  }

  function activeFilterCount() {
    return (state.query ? 1 : 0) + state.courses.size + state.skills.size;
  }

  function requestCvUrl(candidate) {
    const subject = encodeURIComponent(`Resume request — ${candidate.name}`);
    const body = encodeURIComponent(`Hello Full Stack Academy Placement Team,\n\nI would like to request the latest resume/CV for ${candidate.name} (${candidate.course}).\n\nRegards,`);
    return `mailto:${encodeURIComponent(window.FSA_DATA?.content?.placementEmail||window.FSA_DATA?.site?.support_email||CONTACT_EMAIL)}?subject=${subject}&body=${body}`;
  }

  function renderHero() {
    return `<section class="candidate-hero">
      <div class="container candidate-hero-grid">
        <div class="candidate-hero-copy">
          <span class="candidate-eyebrow">Placement Talent Pool</span>
          <h1>Hire job-ready <em>Full Stack Academy candidates.</em></h1>
          <p>Explore trained candidates, filter by learning track and technical skills, and quickly shortlist profiles that fit your hiring needs.</p>
          <div class="candidate-hero-actions">
            <a class="button button-primary" href="#candidateDirectory">Browse Candidates ${icon('arrow')}</a>
            <a class="button button-secondary" href="#/contact">Talk to Placement Team</a>
          </div>
          <div class="candidate-trust-row">
            <span>${icon('check')} Industry-focused training</span>
            <span>${icon('check')} Recruiter-friendly filtering</span>
            <span>${icon('check')} CVs on request</span>
          </div>
        </div>
        <div class="candidate-hero-panel" aria-label="Placement pool summary">
          <div class="candidate-hero-badge">Available for placement</div>
          <strong>${candidates.length}</strong>
          <span>candidate profiles</span>
          <div class="candidate-hero-mini-grid">
            <div><b>${allCourses.length}</b><small>Training tracks</small></div>
            <div><b>${allSkills.length}+</b><small>Searchable skills</small></div>
          </div>
          <div class="candidate-hero-stack">
            ${candidates.slice(0,5).map((candidate,index)=>`<span style="--stack:${index}"><img src="${esc(candidate.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"><i>${esc(initials(candidate.name))}</i></span>`).join('')}
            <p><b>Recruiter access</b><small>Search, filter and shortlist faster.</small></p>
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderFilterCheckbox(value, count, type, checked) {
    const id = `candidate-${type}-${value.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
    return `<label class="candidate-check" for="${esc(id)}">
      <span><input id="${esc(id)}" type="checkbox" data-candidate-${type}="${esc(value)}" ${checked ? 'checked' : ''}><i>${icon('check')}</i><b>${esc(value)}</b></span>
      <small>${count}</small>
    </label>`;
  }

  function renderSkillsFilter() {
    const q = normalize(state.skillQuery);
    const filtered = allSkills.filter(skill => !q || normalize(skill).includes(q));
    const visible = state.expandedSkills || q ? filtered : filtered.slice(0,10);
    return `<div class="candidate-filter-group candidate-skill-filter">
      <div class="candidate-filter-label"><span>Skills</span>${state.skills.size ? `<button type="button" data-candidate-clear="skills">Clear</button>` : ''}</div>
      <label class="candidate-filter-search">${icon('search')}<input type="search" data-candidate-skill-search placeholder="Search skills" value="${esc(state.skillQuery)}"></label>
      <div class="candidate-check-list" data-candidate-skill-list>
        ${visible.length ? visible.map(skill => renderFilterCheckbox(skill, skillCounts[skill] || 0, 'skill', state.skills.has(skill))).join('') : '<p class="candidate-filter-empty">No matching skills.</p>'}
      </div>
      ${!q && filtered.length > 10 ? `<button class="candidate-show-more" type="button" data-candidate-action="toggle-skills">${state.expandedSkills ? 'Show fewer skills' : `Show all ${filtered.length} skills`} ${icon('chevron')}</button>` : ''}
    </div>`;
  }

  function renderSidebar() {
    return `<aside class="candidate-sidebar ${state.filtersOpen ? 'is-open' : ''}" data-candidate-sidebar>
      <div class="candidate-sidebar-head">
        <div><span>${icon('filter')}</span><div><strong>Filter candidates</strong><small>Narrow your shortlist</small></div></div>
        <button type="button" data-candidate-action="close-filters" aria-label="Close filters">${icon('close')}</button>
      </div>
      <div class="candidate-filter-group">
        <div class="candidate-filter-label"><span>Training track</span>${state.courses.size ? `<button type="button" data-candidate-clear="courses">Clear</button>` : ''}</div>
        <div class="candidate-check-list">${allCourses.map(course => renderFilterCheckbox(course, courseCounts[course] || 0, 'course', state.courses.has(course))).join('')}</div>
      </div>
      ${renderSkillsFilter()}
      <div class="candidate-sidebar-footer"><button type="button" class="button button-secondary button-block" data-candidate-action="reset">Reset all filters</button></div>
    </aside>`;
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.query) chips.push(`<button type="button" data-candidate-remove="query">Search: “${esc(state.query)}” ${icon('close')}</button>`);
    state.courses.forEach(course => chips.push(`<button type="button" data-candidate-remove-course="${esc(course)}">${esc(course)} ${icon('close')}</button>`));
    state.skills.forEach(skill => chips.push(`<button type="button" data-candidate-remove-skill="${esc(skill)}">${esc(skill)} ${icon('close')}</button>`));
    return chips.length ? `<div class="candidate-active-filters"><span>Active filters</span>${chips.join('')}<button class="candidate-clear-all" type="button" data-candidate-action="reset">Clear all</button></div>` : '';
  }

  function candidateCard(candidate) {
    const visibleSkills = candidate.skills.slice(0,5);
    return `<article class="candidate-card">
      <div class="candidate-card-photo">
        <span class="candidate-photo-fallback">${esc(initials(candidate.name))}</span>
        <img src="${esc(candidate.image)}" alt="${esc(candidate.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.previousElementSibling.hidden=true" onerror="this.style.display='none'">
        <span class="candidate-available"><i></i> ${esc(candidate.availability || "Availability not specified")}</span>
      </div>
      <div class="candidate-card-body">
        <div class="candidate-card-topline"><span>${icon('briefcase')} Trained in</span><small>FSA Candidate</small></div>
        <h3>${esc(candidate.name)}</h3>
        <p class="candidate-course">${esc(candidate.course)}</p>
        <div class="candidate-skills">${visibleSkills.map(skill=>`<span>${esc(skill)}</span>`).join('')}</div>
      </div>
      <div class="candidate-card-footer">
        <a class="candidate-cv-button" href="${esc(requestCvUrl(candidate))}">${icon('mail')} Request CV</a>
        <a class="candidate-source-link" href="#/companies" title="Explore Full Stack Academy placement network">Placement Network ${icon('arrow')}</a>
      </div>
    </article>`;
  }

  function renderResults() {
    const rows = filteredCandidates();
    const pages = Math.max(1, Math.ceil(rows.length / state.perPage));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * state.perPage;
    const visible = rows.slice(start, start + state.perPage);
    const from = rows.length ? start + 1 : 0;
    const to = Math.min(start + state.perPage, rows.length);

    return `<div class="candidate-results-wrap">
      <div class="candidate-results-toolbar">
        <div>
          <button class="candidate-mobile-filter" type="button" data-candidate-action="open-filters">${icon('filter')} Filters ${activeFilterCount() ? `<b>${activeFilterCount()}</b>` : ''}</button>
          <p><strong>${rows.length}</strong> candidate${rows.length === 1 ? '' : 's'} found <span>· Showing ${from}–${to}</span></p>
        </div>
        <label class="candidate-sort"><span>Sort by</span><select data-candidate-sort>
          <option value="newest" ${state.sort==='newest'?'selected':''}>Newest First</option>
          <option value="name-asc" ${state.sort==='name-asc'?'selected':''}>Name: A–Z</option>
          <option value="name-desc" ${state.sort==='name-desc'?'selected':''}>Name: Z–A</option>
          <option value="course" ${state.sort==='course'?'selected':''}>Training track</option>
          <option value="skills-desc" ${state.sort==='skills-desc'?'selected':''}>Most skills</option>
        </select>${icon('chevron')}</label>
      </div>
      ${renderActiveFilters()}
      ${visible.length ? `<div class="candidate-grid">${visible.map(candidateCard).join('')}</div>` : `<div class="candidate-empty-state"><span>${icon('users')}</span><h3>No candidates match these filters.</h3><p>Try removing a skill, choosing another training track, or clearing your search.</p><button type="button" class="button button-primary" data-candidate-action="reset">Clear filters</button></div>`}
      ${pages > 1 ? `<nav class="candidate-pagination" aria-label="Candidate pages">
        <button type="button" data-candidate-page="${Math.max(1,state.page-1)}" ${state.page===1?'disabled':''}>Previous</button>
        <div>${Array.from({length:pages},(_,i)=>i+1).map(page=>`<button type="button" data-candidate-page="${page}" class="${page===state.page?'active':''}">${page}</button>`).join('')}</div>
        <button type="button" data-candidate-page="${Math.min(pages,state.page+1)}" ${state.page===pages?'disabled':''}>Next</button>
      </nav>` : ''}
    </div>`;
  }

  function renderDirectory(app) {
    const directory = app.querySelector('[data-candidate-directory]');
    if (!directory) return;
    directory.innerHTML = `<div class="candidate-directory-layout">${renderSidebar()}${renderResults()}</div><button class="candidate-filter-backdrop ${state.filtersOpen?'show':''}" type="button" data-candidate-action="close-filters" aria-label="Close filters"></button>`;
  }

  function render(app) {
    if (!app) return;
    syncCandidateData();
    state.filtersOpen = false;
    document.body.classList.remove('candidate-filter-lock');
    app.innerHTML = `${renderHero()}
      <section class="candidate-directory-section" id="candidateDirectory">
        <div class="container">
          <div class="candidate-directory-heading">
            <div><span class="candidate-eyebrow">Available Candidates</span><h2>Find the right candidate for your team.</h2><p>Search by name or technology, then combine training-track and skill filters to build a focused shortlist.</p></div>
            <label class="candidate-main-search">${icon('search')}<input type="search" data-candidate-search placeholder="Search candidate, course or skill..." value="${esc(state.query)}"><kbd>Search</kbd></label>
          </div>
          <div data-candidate-directory></div>
        </div>
      </section>
      <section class="candidate-recruiter-cta">
        <div class="container candidate-recruiter-cta-inner">
          <div><span class="candidate-eyebrow">Hiring Support</span><h2>Need a curated shortlist instead?</h2><p>Tell the Full Stack Academy placement team what role you are hiring for and the skills you need.</p></div>
          <a class="button button-primary" href="#/contact">Contact Placement Team ${icon('arrow')}</a>
        </div>
      </section>`;
    renderDirectory(app);
  }

  function resetFilters(app) {
    state.query=''; state.courses.clear(); state.skills.clear(); state.skillQuery=''; state.sort='newest'; state.page=1; state.expandedSkills=false;
    const search = app?.querySelector('[data-candidate-search]'); if (search) search.value='';
    renderDirectory(app);
  }

  document.addEventListener('input', event => {
    const app = document.getElementById('app');
    if (!app || !app.querySelector('.candidate-directory-section')) return;
    if (event.target.matches('[data-candidate-search]')) {
      state.query = event.target.value.trim(); state.page=1; renderDirectory(app);
      const input = app.querySelector('[data-candidate-search]'); if(input){ input.focus(); input.setSelectionRange(input.value.length,input.value.length); }
    }
    if (event.target.matches('[data-candidate-skill-search]')) {
      state.skillQuery = event.target.value; renderDirectory(app);
      const input = app.querySelector('[data-candidate-skill-search]'); if(input){ input.focus(); input.setSelectionRange(input.value.length,input.value.length); }
    }
  });

  document.addEventListener('change', event => {
    const app = document.getElementById('app');
    if (!app || !app.querySelector('.candidate-directory-section')) return;
    if (event.target.matches('[data-candidate-course]')) {
      const value = event.target.dataset.candidateCourse;
      event.target.checked ? state.courses.add(value) : state.courses.delete(value);
      state.page=1; renderDirectory(app);
    }
    if (event.target.matches('[data-candidate-skill]')) {
      const value = event.target.dataset.candidateSkill;
      event.target.checked ? state.skills.add(value) : state.skills.delete(value);
      state.page=1; renderDirectory(app);
    }
    if (event.target.matches('[data-candidate-sort]')) {
      state.sort = event.target.value; state.page=1; renderDirectory(app);
    }
  });

  document.addEventListener('click', event => {
    const app = document.getElementById('app');
    if (!app || !app.querySelector('.candidate-directory-section')) return;
    const actionButton = event.target.closest('[data-candidate-action]');
    if (actionButton) {
      const action = actionButton.dataset.candidateAction;
      if (action === 'reset') resetFilters(app);
      if (action === 'open-filters') { state.filtersOpen=true; renderDirectory(app); document.body.classList.add('candidate-filter-lock'); }
      if (action === 'close-filters') { state.filtersOpen=false; renderDirectory(app); document.body.classList.remove('candidate-filter-lock'); }
      if (action === 'toggle-skills') { state.expandedSkills=!state.expandedSkills; renderDirectory(app); }
      return;
    }
    const clear = event.target.closest('[data-candidate-clear]');
    if (clear) {
      if (clear.dataset.candidateClear === 'courses') state.courses.clear();
      if (clear.dataset.candidateClear === 'skills') state.skills.clear();
      state.page=1; renderDirectory(app); return;
    }
    const removeQuery = event.target.closest('[data-candidate-remove="query"]');
    if (removeQuery) { state.query=''; state.page=1; const search=app.querySelector('[data-candidate-search]'); if(search)search.value=''; renderDirectory(app); return; }
    const removeCourse = event.target.closest('[data-candidate-remove-course]');
    if (removeCourse) { state.courses.delete(removeCourse.dataset.candidateRemoveCourse); state.page=1; renderDirectory(app); return; }
    const removeSkill = event.target.closest('[data-candidate-remove-skill]');
    if (removeSkill) { state.skills.delete(removeSkill.dataset.candidateRemoveSkill); state.page=1; renderDirectory(app); return; }
    const pageButton = event.target.closest('[data-candidate-page]');
    if (pageButton && !pageButton.disabled) { state.page=Number(pageButton.dataset.candidatePage)||1; renderDirectory(app); document.getElementById('candidateDirectory')?.scrollIntoView({behavior:'smooth',block:'start'}); }
  });

  window.addEventListener('hashchange',()=>document.body.classList.remove('candidate-filter-lock'));

  window.FSA_CANDIDATES_PAGE = { render, candidates };
})();
