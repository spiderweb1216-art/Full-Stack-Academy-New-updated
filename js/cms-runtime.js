/* Full Stack Academy CMS Runtime — editable pages, snippets and dynamic theme. */
(() => {
  'use strict';

  const API_URL = 'api/index.php?action=public_cms';
  const CMS_DISABLED = false; // Page/snippet overrides remain disabled; theme is applied by app.js from the backend catalog.
  const state = { pages: [], snippets: [], theme: {}, loaded: false, route: '/', once: new Set() };
  const THEME_VARS = {
    brand:'--brand', brand_hover:'--brand-hover', brand_dark:'--brand-dark', brand_deep:'--brand-deep',
    ink:'--ink', ink_soft:'--ink-soft', muted:'--muted', pink:'--pink', pink_2:'--pink-2', pink_3:'--pink-3',
    surface:'--surface', surface_2:'--surface-2', border:'--border', border_strong:'--border-strong',
    success:'--success', warning:'--warning', danger:'--danger', radius:'--cms-radius'
  };

  function applyTheme(theme = {}) {
    const root=document.documentElement;
    const brand=/^#[0-9a-f]{6}$/i.test(String(theme.brand||''))?String(theme.brand).trim():'#852937';
    Object.entries(THEME_VARS).forEach(([key, cssVar]) => {
      let value = String(theme[key] || '').trim();
      if(['brand_hover','brand_dark','brand_deep','danger'].includes(key)) value=brand;
      if (value) root.style.setProperty(cssVar, value);
    });
    const n=parseInt(brand.slice(1),16), rgb=`${(n>>16)&255}, ${(n>>8)&255}, ${n&255}`;
    root.style.setProperty('--brand',brand); root.style.setProperty('--brand-hover',brand); root.style.setProperty('--brand-dark',brand); root.style.setProperty('--brand-deep',brand);
    root.style.setProperty('--fsa-brand',brand); root.style.setProperty('--fsa-brand-dark',brand); root.style.setProperty('--brand-rgb',rgb); root.style.setProperty('--fsa-brand-rgb',rgb);
  }

  function normalizeRoute(route) {
    const raw = String(route || '/').split('?')[0] || '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  function matchesRule(rule, route) {
    rule = String(rule || '').trim();
    route = normalizeRoute(route);
    if (!rule || rule === '*') return true;
    if (!rule.startsWith('/')) rule = `/${rule}`;
    if (rule.endsWith('*')) return route.startsWith(rule.slice(0, -1));
    return route === rule;
  }

  function matchesRules(raw, route) {
    const rules = String(raw || '*').split(/[\n,]+/).map(x => x.trim()).filter(Boolean);
    return (rules.length ? rules : ['*']).some(rule => matchesRule(rule, route));
  }

  function pageFor(route) {
    const matches = state.pages.filter(page => matchesRule(page.route_rule, route));
    matches.sort((a, b) => {
      const aw = String(a.route_rule || '').includes('*') ? 0 : 1;
      const bw = String(b.route_rule || '').includes('*') ? 0 : 1;
      return bw - aw || String(b.route_rule || '').length - String(a.route_rule || '').length;
    });
    return matches[0] || null;
  }

  function stripWrapper(code, tag) {
    const raw = String(code || '').trim();
    const re = new RegExp(`^<${tag}[^>]*>([\\s\\S]*)<\\/${tag}>$`, 'i');
    const match = raw.match(re);
    return match ? match[1].trim() : raw;
  }

  function activateScript(oldScript) {
    const script = document.createElement('script');
    [...oldScript.attributes].forEach(attr => script.setAttribute(attr.name, attr.value));
    script.textContent = oldScript.textContent;
    script.dataset.fsaCmsExecuted = '1';
    oldScript.replaceWith(script);
  }

  function executeScripts(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches?.('script')) { activateScript(root); return; }
    root.querySelectorAll?.('script').forEach(activateScript);
  }

  function insertHtml(target, html, position = 'beforeend', owner = '') {
    const code = String(html || '');
    if (!target || !code.trim()) return [];
    const template = document.createElement('template');
    template.innerHTML = code;
    const nodes = [...template.content.childNodes];
    nodes.forEach(node => {
      if (node.nodeType === 1) node.setAttribute('data-fsa-cms-owned', owner || 'cms');
    });
    if (position === 'afterbegin') target.prepend(template.content);
    else target.append(template.content);
    nodes.forEach(node => { if (node.nodeType === 1) executeScripts(node); });
    return nodes;
  }

  function addStyle(code, id) {
    const css = stripWrapper(code, 'style');
    if (!css) return;
    const style = document.createElement('style');
    style.dataset.fsaCmsAsset = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function runJs(code, route, app, id) {
    const js = stripWrapper(code, 'script');
    if (!js) return;
    try {
      const cms = {
        route,
        app,
        once(key, fn) {
          const token = `${id}:${key}`;
          if (state.once.has(token)) return false;
          state.once.add(token);
          if (typeof fn === 'function') fn();
          return true;
        }
      };
      new Function('route', 'app', 'cms', `"use strict";\n${js}`)(route, app, cms);
    } catch (error) {
      console.error(`[FSA CMS] JavaScript error in ${id}:`, error);
    }
  }

  function clearRouteAssets() {
    document.querySelectorAll('[data-fsa-cms-asset]').forEach(node => node.remove());
    document.querySelectorAll('body > [data-fsa-cms-owned], head > [data-fsa-cms-owned]').forEach(node => node.remove());
  }

  function applyRoute(route, app = document.getElementById('app')) {
    route = normalizeRoute(route || (location.hash || '#/').slice(1));
    state.route = route;
    if (CMS_DISABLED || !state.loaded || !app) return false;

    clearRouteAssets();
    const page = pageFor(route);
    if (page) {
      addStyle(page.css_code, `page:${page.id}`);
      if (page.render_mode === 'replace' && String(page.html_code || '').trim()) {
        app.innerHTML = '';
        insertHtml(app, page.html_code, 'beforeend', `page:${page.id}`);
      } else {
        if (String(page.before_html || '').trim()) insertHtml(app, page.before_html, 'afterbegin', `page-before:${page.id}`);
        if (String(page.after_html || '').trim()) insertHtml(app, page.after_html, 'beforeend', `page-after:${page.id}`);
      }
      runJs(page.js_code, route, app, `page:${page.id}`);
      if (page.page_title) {
        setTimeout(() => {
          const academy = document.querySelector('[data-site-name]')?.textContent?.trim() || 'Full Stack Academy';
          document.title = `${page.page_title} | ${academy}`;
        }, 0);
      }
    }

    state.snippets.filter(snippet => snippet.enabled && matchesRules(snippet.route_rules, route)).forEach(snippet => {
      const id = `snippet:${snippet.id}:${snippet.slug}`;
      addStyle(snippet.css_code, id);
      const placement = snippet.placement || 'page_after';
      if (placement === 'head') insertHtml(document.head, snippet.html_code, 'beforeend', id);
      else if (placement === 'page_before') insertHtml(app, snippet.html_code, 'afterbegin', id);
      else if (placement === 'body_end') insertHtml(document.body, snippet.html_code, 'beforeend', id);
      else insertHtml(app, snippet.html_code, 'beforeend', id);
      runJs(snippet.js_code, route, app, id);
    });

    document.dispatchEvent(new CustomEvent('fsa:cms-applied', { detail: { route, page } }));
    return true;
  }

  async function load() {
    if (CMS_DISABLED) {
      state.loaded = true;
      return;
    }
    try {
      const response = await fetch(API_URL, { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || 'CMS configuration could not be loaded.');
      state.pages = Array.isArray(data.pages) ? data.pages : [];
      state.snippets = Array.isArray(data.snippets) ? data.snippets : [];
      state.theme = data.theme || {};
      state.loaded = true;
      applyTheme(state.theme);
      if (!CMS_DISABLED) applyRoute((location.hash || '#/').slice(1));
    } catch (error) {
      console.warn('[FSA CMS] Runtime unavailable:', error.message || error);
    }
  }

  window.FSA_CMS = { state, applyTheme, applyRoute, reload: load, matchesRule };
  load();
})();
