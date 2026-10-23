/* Backend-managed copy/assets. Templates retain the original layout. */
(() => {
  'use strict';
  let content={},scheduled=false;
  const originals=new WeakMap();
  const attrs=new WeakMap();
  const labelAttrs=new WeakMap();
  const route=()=>/\/branches\//.test(location.pathname)?'/branch/'+String(window.BRANCH_PAGE?.slug||window.BRANCH_PAGE?.id||''):String(location.hash||'#/').slice(1).split('?')[0];
  const safeUrl=value=>!/^\s*(?:javascript|vbscript|data):/i.test(String(value));
  function apply(){
    scheduled=false;
    const page=route(),local=content.routes?.[page]||{};
    const copy={...(content.copy||{}),...(local.copy||{})},assets={...(content.assets||{}),...(local.assets||{})};
    const scopes=[document.querySelector('header'),document.querySelector('footer'),document.getElementById('fsaAiAssistant'),document.getElementById('fsaCallBackdrop'),document.getElementById('fsaNewsletterBackdrop')];
    if(document.body.dataset.mode!=='dashboard')scopes.push(document.getElementById('app')||document.querySelector('main'));
    if(/\/branches\//.test(location.pathname))scopes.push(document.body);
    for(const scope of scopes.filter(Boolean)){
      const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        const node=walker.currentNode,parent=node.parentElement;
        if(!parent||parent.closest('script,style,textarea,input,select,[data-site-name],[data-site-email],[data-site-phone],.leaflet-container'))continue;
        const current=window.FSA_LANGUAGE?.source(node)??node.nodeValue,old=originals.get(node);
        const original=old&&old.rendered===current?old.original:current;
        const key=original.trim();if(!Object.prototype.hasOwnProperty.call(copy,key))continue;
        const next=original.replace(key,String(copy[key]??''));
        if(window.FSA_LANGUAGE)window.FSA_LANGUAGE.setSource(node,next);else if(current!==next)node.nodeValue=next;
        originals.set(node,{original,rendered:next});
      }
      scope.querySelectorAll('[alt],[title],[placeholder],[aria-label]').forEach(el=>{
        const values={...(content.attributes||{}),...(local.attributes||{})};
        const saved=labelAttrs.get(el)||{};
        for(const name of ['alt','title','placeholder','aria-label']){
          if(!el.hasAttribute(name))continue;
          const current=window.FSA_LANGUAGE?.attributeSource(el,name)??el.getAttribute(name),prev=saved[name],original=prev&&prev.rendered===current?prev.original:current;
          if(Object.prototype.hasOwnProperty.call(values,original)){const next=String(values[original]??'');if(window.FSA_LANGUAGE)window.FSA_LANGUAGE.setAttributeSource(el,name,next);else if(next!==current)el.setAttribute(name,next);saved[name]={original,rendered:next};}
        }
        labelAttrs.set(el,saved);
      });
      scope.querySelectorAll('img[src],video[poster],source[src],a[href]').forEach(el=>{
        const attribute=el.tagName==='A'?'href':el.hasAttribute('poster')?'poster':'src';
        const current=el.getAttribute(attribute)||'',previous=attrs.get(el);
        const original=previous&&previous.rendered===current?previous.original:current;
        const key=original.replace(/^\.\.\/\.\.\//,'');
        if(!Object.prototype.hasOwnProperty.call(assets,key))return;
        let next=String(assets[key]??'');if(!safeUrl(next))return;
        if(original.startsWith('../../')&&next.startsWith('assets/'))next='../../'+next;
        if(next!==current)el.setAttribute(attribute,next);
        attrs.set(el,{original,rendered:next});
      });
    }
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(apply);}}
  function set(value){content=value&&typeof value==='object'?value:{};schedule();document.dispatchEvent(new CustomEvent('fsa:content-updated'));}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('hashchange',schedule);
  window.FSA_CONTENT={set,apply,get:()=>content};
})();
