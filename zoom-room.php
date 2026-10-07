<?php
declare(strict_types=1);

// Never let an old embedded-room response stay in the browser cache while the
// LMS is being updated. This is especially important during local/XAMPP work.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$left = isset($_GET['left']) && (string)$_GET['left'] === '1';
$liveId = isset($_GET['live_id']) ? (int)$_GET['live_id'] : 0;
$mode = (string)($_GET['mode'] ?? 'student');

if ($left) {
    ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zoom Meeting Closed</title>
<style>
html,body{margin:0;width:100%;height:100%;display:grid;place-items:center;background:#000;color:#fff;font-family:Arial,sans-serif}
</style>
</head>
<body>
<div>Zoom meeting closed.</div>
<script>
try{
  if(window.parent && window.parent!==window){
    window.parent.postMessage(
      {type:'fsa-zoom-state',state:'left'},
      window.location.origin
    );
  }
}catch(e){}
</script>
</body>
</html>
<?php
    exit;
}

if ($liveId < 1 || !in_array($mode, ['student','host'], true)) {
    http_response_code(400);
    echo 'Invalid live classroom request.';
    exit;
}

$leaveUrl =
    'zoom-room.php?left=1&live_id=' . rawurlencode((string)$liveId) .
    '&mode=' . rawurlencode($mode) . '&v=90';
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="format-detection" content="telephone=no">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Zoom Classroom</title>
<style>
/* Keep this page neutral. Zoom Client View owns the meeting UI. */
html,body{
  margin:0;
  padding:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#000;
}
#zmmtg-root{
  width:100%;
  height:100%;
}

/* Only used while PHP/API/CDN prerequisites load. It is removed BEFORE
   ZoomMtg.join() so it can never cover Zoom's preview, permission, waiting-room,
   audio or in-meeting UI. */
#fsa-zoom-loading{
  position:fixed;
  inset:0;
  z-index:20;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#000;
  color:#fff;
  font:16px Arial,sans-serif;
  pointer-events:none;
}
#fsa-zoom-loading[hidden]{display:none!important}

#fsa-zoom-error{
  position:fixed;
  inset:0;
  z-index:2147483646;
  display:none;
  align-items:center;
  justify-content:center;
  padding:24px;
  background:#050505;
  color:#fff;
  font:15px/1.55 Arial,sans-serif;
  text-align:center;
}
#fsa-zoom-error.is-open{display:flex}
#fsa-zoom-error-card{max-width:720px}
#fsa-zoom-error button{
  margin-top:16px;
  padding:10px 16px;
  border:0;
  border-radius:8px;
  cursor:pointer;
}
</style>
</head>
<body>
<div id="fsa-zoom-loading"><div id="fsa-zoom-status">Preparing Zoom…</div></div>
<div id="fsa-zoom-error" role="alert">
  <div id="fsa-zoom-error-card">
    <div id="fsa-zoom-error-text"></div>
    <button type="button" id="fsa-zoom-retry">Try Again</button>
  </div>
</div>
<div id="zmmtg-root"></div>
<div id="aria-notify-area"></div>

<script>
(() => {
  'use strict';

  const liveId = <?= json_encode($liveId) ?>;
  const mode = <?= json_encode($mode) ?>;
  const leaveUrl = <?= json_encode($leaveUrl) ?>;

  const loading = document.getElementById('fsa-zoom-loading');
  const status = document.getElementById('fsa-zoom-status');
  const errorBox = document.getElementById('fsa-zoom-error');
  const errorText = document.getElementById('fsa-zoom-error-text');
  const retryButton = document.getElementById('fsa-zoom-retry');

  let joined = false;
  let joinStarted = false;
  let meetingStatus = 0;
  let waitingRoom = false;
  let fatalTimer = null;

  retryButton.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('_retry', String(Date.now()));
    window.location.replace(url.toString());
  });

  // Chrome supports this already, but keeping the polyfill makes current Zoom
  // SDK builds safe on older Chromium/Edge installations used in classrooms.
  if (typeof Promise.withResolvers !== 'function') {
    Promise.withResolvers = function(){
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      return {promise, resolve, reject};
    };
  }

  function notifyParent(state, extra={}){
    try{
      if(window.parent && window.parent!==window){
        window.parent.postMessage({
          type:'fsa-zoom-state',
          state,
          liveId,
          mode,
          ...extra
        }, window.location.origin);
      }
    }catch(e){}
  }

  function setStatus(text){
    if(status) status.textContent = text || '';
  }

  function revealZoomUi(){
    if(loading) loading.hidden = true;
  }

  function normalizedError(value){
    if(!value) return 'Unknown Zoom Meeting SDK error.';
    if(typeof value === 'string') return value;
    const parts=[];
    if(value.errorCode!==undefined) parts.push(`code ${value.errorCode}`);
    if(value.reason) parts.push(String(value.reason));
    if(value.errorMessage) parts.push(String(value.errorMessage));
    if(value.message) parts.push(String(value.message));
    if(parts.length) return parts.join(': ');
    try{return JSON.stringify(value);}catch(e){return String(value);}
  }

  function sanitize(message){
    return String(message||'Unknown Zoom error')
      .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi,'$1[hidden]')
      .replace(/([?&](?:zak|token)=)[^&\s]+/gi,'$1[hidden]')
      .replace(/("?(?:zak|token)"?\s*:\s*")[^"]+/gi,'$1[hidden]');
  }

  function fail(message){
    clearTimeout(fatalTimer);
    const safe=sanitize(message);
    console.error('[FSA Zoom]', safe);
    notifyParent('error',{message:safe});
    revealZoomUi();
    errorText.textContent=safe;
    errorBox.classList.add('is-open');
  }

  function withTimeout(promise, ms, label){
    return new Promise((resolve,reject)=>{
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled) return;
        settled=true;
        reject(new Error(`${label} timed out after ${Math.round(ms/1000)} seconds.`));
      },ms);
      Promise.resolve(promise).then(value=>{
        if(settled) return;
        settled=true;
        clearTimeout(timer);
        resolve(value);
      },error=>{
        if(settled) return;
        settled=true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src===src);
      if(existing){
        if(existing.dataset.loaded==='1') return resolve();
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error(`Could not load ${src}`)),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=false;
      script.dataset.loaded='0';
      script.onload=()=>{script.dataset.loaded='1';resolve();};
      script.onerror=()=>reject(new Error(`Could not load Zoom SDK file: ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadZoomClientView(version){
    const base='https://source.zoom.us';
    const vendor=`${base}/${version}/lib/vendor`;
    const vendorScripts=[
      `${vendor}/react.min.js`,
      `${vendor}/react-dom.min.js`,
      `${vendor}/react-redux.min.js`,
      `${vendor}/redux.min.js`,
      `${vendor}/redux-thunk.min.js`,
      `${vendor}/lodash.min.js`
    ];
    for(const src of vendorScripts){
      await withTimeout(loadScript(src),15000,'Zoom dependency download');
    }

    const bundles=[
      `${base}/${version}/zoom-meeting-${version}.min.js`,
      `${base}/zoom-meeting-${version}.min.js`
    ];
    let lastError=null;
    for(const src of bundles){
      try{
        await withTimeout(loadScript(src),20000,'Zoom Meeting SDK download');
        if(window.ZoomMtg) return;
      }catch(error){
        lastError=error;
      }
    }
    throw new Error(
      `Zoom Client View ${version} could not be loaded from source.zoom.us.` +
      (lastError && lastError.message ? ` ${lastError.message}` : '')
    );
  }

  function waitForLanguage(){
    return new Promise((resolve,reject)=>{
      if(!window.ZoomMtg || !ZoomMtg.i18n || typeof ZoomMtg.i18n.load!=='function'){
        resolve();
        return;
      }
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled) return;
        settled=true;
        reject(new Error('Zoom language resources did not finish loading.'));
      },10000);
      try{
        ZoomMtg.i18n.load('en-US');
        if(typeof ZoomMtg.i18n.onLoad==='function'){
          ZoomMtg.i18n.onLoad(()=>{
            if(settled) return;
            settled=true;
            clearTimeout(timer);
            resolve();
          });
        }else{
          settled=true;
          clearTimeout(timer);
          resolve();
        }
      }catch(error){
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  function initZoom(options){
    return new Promise((resolve,reject)=>{
      let done=false;
      const ok=value=>{if(done)return;done=true;resolve(value);};
      const bad=error=>{if(done)return;done=true;reject(error);};
      try{
        const result=ZoomMtg.init({...options,success:ok,error:bad});
        if(result && typeof result.then==='function') result.then(ok,bad);
      }catch(error){bad(error);}
    });
  }

  function joinZoom(options){
    return new Promise((resolve,reject)=>{
      let done=false;
      const ok=value=>{if(done)return;done=true;resolve(value);};
      const bad=error=>{if(done)return;done=true;reject(error);};
      try{
        const result=ZoomMtg.join({...options,success:ok,error:bad});
        if(result && typeof result.then==='function') result.then(ok,bad);
      }catch(error){bad(error);}
    });
  }

  function registerZoomListeners(){
    if(!window.ZoomMtg || typeof ZoomMtg.inMeetingServiceListener!=='function') return;
    try{
      ZoomMtg.inMeetingServiceListener('onMeetingStatus', data=>{
        meetingStatus=Number(data && data.status || 0);
        console.info('[FSA Zoom] meeting status', data);
        if(meetingStatus===1){
          revealZoomUi();
          notifyParent('joining');
        }else if(meetingStatus===2){
          joined=true;
          clearTimeout(fatalTimer);
          revealZoomUi();
          notifyParent('joined');
        }else if(meetingStatus===4){
          revealZoomUi();
          notifyParent('reconnecting');
        }else if(meetingStatus===3){
          notifyParent('left');
        }
      });
      ZoomMtg.inMeetingServiceListener('onUserIsInWaitingRoom', data=>{
        console.info('[FSA Zoom] waiting room', data);
        waitingRoom=true;
        revealZoomUi();
        notifyParent('waiting');
      });
    }catch(error){
      console.warn('[FSA Zoom] event listener setup warning', error);
    }
  }

  notifyParent('loading');

  async function start(){
    try{
      setStatus('Checking Zoom meeting access…');
      const response=await withTimeout(fetch(
        `api/index.php?action=zoom_embed_session&live_id=${encodeURIComponent(liveId)}&mode=${encodeURIComponent(mode)}&_=${Date.now()}`,
        {
          credentials:'same-origin',
          cache:'no-store',
          headers:{'Accept':'application/json'}
        }
      ),20000,'LMS Zoom authorization');

      let data;
      try{data=await response.json();}
      catch(e){throw new Error('The LMS PHP API did not return valid JSON. Check api/index.php / PHP error log.');}
      if(!response.ok || data.success===false){
        throw new Error(data.message || `LMS API returned HTTP ${response.status}.`);
      }

      const version=String(data.sdk_version || '6.5.0').trim();
      if(!/^\d+\.\d+\.\d+$/.test(version)){
        throw new Error(`Invalid Meeting SDK version configured in Admin: ${version}`);
      }

      setStatus(`Loading Zoom Meeting SDK ${version}…`);
      await loadZoomClientView(version);

      ZoomMtg.setZoomJSLib(`https://source.zoom.us/${version}/lib`,'/av');
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();

      setStatus('Loading Zoom language resources…');
      await waitForLanguage();
      registerZoomListeners();

      if(typeof ZoomMtg.checkSystemRequirements==='function'){
        try{console.info('[FSA Zoom] system requirements',ZoomMtg.checkSystemRequirements());}catch(e){}
      }

      setStatus(mode==='host'?'Opening Zoom host studio…':'Opening Zoom classroom…');

      await withTimeout(initZoom({
        leaveUrl,
        patchJsMedia:true,
        leaveOnPageUnload:true,
        disableCORP:!window.crossOriginIsolated,
        debug:false
      }),25000,'Zoom SDK initialization');

      // Critical v90 fix: remove our full-screen loader BEFORE join. Zoom Client
      // View may render native pre-join/permission/waiting-room UI before the
      // join success callback fires. Covering it creates the exact black
      // "Starting Zoom meeting…" screen seen in the LMS.
      revealZoomUi();
      joinStarted=true;
      notifyParent('joining');

      const joinArgs={
        signature:String(data.signature||''),
        meetingNumber:String(data.meeting_number||''),
        passWord:String(data.password||''),
        userName:String(data.user_name||'Full Stack Academy'),
        userEmail:String(data.user_email||'')
      };
      // sdkKey is intentionally omitted. Zoom's current 6.x API marks it as
      // deprecated in join options; the signed JWT already carries appKey/sdkKey.
      if(mode==='host'){
        if(!data.zak) throw new Error('Zoom did not return the host ZAK token. Check Server-to-Server OAuth user:read:token:admin scope and the configured host user.');
        joinArgs.zak=String(data.zak);
      }

      fatalTimer=setTimeout(()=>{
        if(joined || meetingStatus===2) return;
        // Do not silently sit on a black screen. If Zoom has rendered native
        // controls, leave them visible; otherwise show a precise timeout.
        const root=document.getElementById('zmmtg-root');
        const hasZoomDom=!!(root && root.children && root.children.length);
        if(!hasZoomDom){
          fail('Zoom did not render the meeting interface. Verify the Meeting SDK Client ID/Secret, host ZAK scope, meeting ownership, and access to source.zoom.us.');
        }
      },45000);

      try{
        await withTimeout(joinZoom(joinArgs),60000,'Zoom meeting join');
        joined=true;
        clearTimeout(fatalTimer);
        revealZoomUi();
        notifyParent('joined');
      }catch(error){
        // Some SDK builds can keep the join promise pending while native Zoom
        // UI is already active (preview / waiting room / connecting). Never
        // replace that usable UI with our own timeout overlay.
        const root=document.getElementById('zmmtg-root');
        const hasZoomDom=!!(root && root.children && root.children.length);
        const timeoutLike=/timed out/i.test(normalizedError(error));
        if(meetingStatus===2){
          joined=true;
          clearTimeout(fatalTimer);
          revealZoomUi();
          notifyParent('joined');
          return;
        }
        if(timeoutLike && (waitingRoom || meetingStatus===1 || meetingStatus===4 || hasZoomDom)){
          clearTimeout(fatalTimer);
          revealZoomUi();
          console.warn('[FSA Zoom] join callback is still pending; keeping native Zoom UI visible.', error);
          return;
        }
        throw error;
      }
    }catch(err){
      fail(err && err.message ? err.message : normalizedError(err));
    }
  }

  window.addEventListener('error',event=>{
    if(joinStarted && !joined){
      console.error('[FSA Zoom] window error',event.error||event.message);
    }
  });
  window.addEventListener('unhandledrejection',event=>{
    if(joinStarted && !joined){
      console.error('[FSA Zoom] unhandled rejection',event.reason);
    }
  });
  window.addEventListener('beforeunload',()=>{
    notifyParent(joined?'leaving':'unloading');
  });

  start();
})();
</script>
</body>
</html>
