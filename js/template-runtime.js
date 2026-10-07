(() => {
  'use strict';
  const active = new Map();
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  function getValue(data,key){
    return String(key||'').split('.').reduce((value,part)=>value==null?'':value[part],data);
  }
  function injectCss(){
    let style=document.getElementById('fsa-active-template-css');
    if(!style){style=document.createElement('style');style.id='fsa-active-template-css';document.head.appendChild(style);}
    style.textContent=[...active.values()].filter(t=>!t.builtin&&t.css).map(t=>`/* ${t.slot}: ${t.name} */\n${t.css}`).join('\n\n');
  }
  function setTemplates(rows){
    active.clear();
    (Array.isArray(rows)?rows:[]).forEach(t=>{if(t&&t.slot&&t.active!==false)active.set(t.slot,t);});
    injectCss();
    document.dispatchEvent(new CustomEvent('fsa:templates-updated',{detail:{templates:[...active.values()]}}));
  }
  function render(slot,data,fallback=''){
    const t=active.get(slot);
    if(!t || t.builtin || !String(t.html||'').trim()) return fallback;
    let html=String(t.html||'');
    html=html.replace(/\{\{\{\s*([\w.-]+)\s*\}\}\}/g,(_,key)=>String(getValue(data,key)??''));
    html=html.replace(/\{\{\s*([\w.-]+)\s*\}\}/g,(_,key)=>esc(getValue(data,key)));
    return html;
  }
  window.FSATemplates={setTemplates,render,get:(slot)=>active.get(slot)||null,all:()=>[...active.values()]};
})();
