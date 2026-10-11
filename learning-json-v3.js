/* XDS Learning JSON 1.0.0: user-initiated, read-only exports. */
(function(w){
'use strict';
if(w.AdrianLearningJSON)return;
const SCHEMA='XDS_LEARNING_HANDOFF_V1';
const KEYS={
 english:'adaptive_english_campaign1_v1',
 'phrasal-verbs':'adaptive_phrasal_verbs_v1',
 pizarras:'classroom_b2_state_v3',
 'b2-cloze':'adaptive_b2_cloze_campaign1_v1',
 cambridge:'cambridgeB2ExerciseStatsV3',
 'keyword-speaking':'keywordSpeakingStatsV1',
 catala:'adaptive_verbs_catala_campaign1_v1',
 hoti0108:'adaptive_hoti0108_v1'};
function appId(){const p=location.pathname;return Object.entries({
 '/adaptive-english':'english','/adaptive-phrasal-verbs':'phrasal-verbs',
 '/adaptive-pizarras':'pizarras','/b2-multiple-choice-cloze':'b2-cloze',
 '/adaptive-exam':'cambridge','/adaptive-keyword-speaking':'keyword-speaking',
 '/adaptive-verbs-catala':'catala','/adaptive-hoti0108':'hoti0108'
 }).find(([path])=>p.startsWith(path))?.[1]||'unknown';}
function stateFor(app){
 const key=KEYS[app];
 if(!key)return {key:null,error:'La aplicación no tiene adaptador',state:{}};
 try{const raw=localStorage.getItem(key);
 if(!raw)return {key,error:'Sin progreso en este dispositivo',state:{}};
 const parsed=JSON.parse(raw)||{};
 return {key,state:app==='hoti0108'?(parsed.studyGame||{}):parsed,error:null};
 }catch(e){return {key,error:'No se puede leer el progreso',state:{}};}
}
function bad(a){
 if(a?.kind==='wrong'||a?.kind==='incorrect')return true;
 if(a?.kind==='correct'||a?.kind==='neutral')return false;
 return typeof a?.ok==='boolean'?!a.ok:
 typeof a?.correct==='boolean'?!a.correct:
 typeof a?.isCorrect==='boolean'?!a.isCorrect:
 typeof a?.correct==='number'&&typeof a?.total==='number'?a.correct<a.total:false;
}
function moment(a){
 const v=a?.ts??a?.at??a?.timestamp??a?.completedAt??0;
 return typeof v==='number'?v:Date.parse(v)||0;
}
function time(a){
 if(a&&Number.isFinite(a.responseMs))return {ms:a.responseMs,source:'recorded_response_ms'};
 if(a&&Number.isFinite(a.ms))return {ms:a.ms,source:'recorded_ms'};
 if(a&&Number.isFinite(a.time))return {ms:Math.round(a.time*1000),source:'recorded_seconds'};
 if(a&&Number.isFinite(a.responseSec))return {ms:Math.round(a.responseSec*1000),source:'recorded_response_seconds'};
 return {ms:null,source:'not_recorded'};
}
function answers(s,app){
 if(app==='keyword-speaking')return (s.sessions||[]).flatMap(x=>x.results||[]);
 if(app==='hoti0108')return (s.roundHistory||[]).flatMap(x=>x.timedAnswers||[]);
 if(app==='cambridge'&&Array.isArray(s.attempts))
 return s.attempts.flatMap(run=>(run.items||[]).map((x,i)=>({
 ...x,paperId:run.paperId,exerciseId:run.exerciseId,part:run.part,
 completedAt:run.completedAt,sessionId:run.id,itemIndex:i+1})));
 return Array.isArray(s.answerHistory)?s.answerHistory:
 Array.isArray(s.history)?s.history:[];
}
function sessions(s,app){
 if(app==='cambridge')return Array.isArray(s.attempts)?s.attempts:[];
 if(app==='keyword-speaking')return Array.isArray(s.sessions)?s.sessions:[];
 for(const k of ['sessionHistory','roundHistory','history'])
 if(Array.isArray(s[k])&&(k!=='history'||Array.isArray(s.answerHistory)))return s[k];
 return [];
}
async function archive(key){
 if(!w.indexedDB||!key)return {rows:[],status:'unavailable'};
 return new Promise(resolve=>{
  let done=false,req;
  const finish=(rows,status)=>{if(!done){done=true;resolve({rows,status});}};
  try{req=indexedDB.open('xds-learning-history-v1',1);}
  catch(e){finish([],'unavailable');return;}
  req.onupgradeneeded=()=>{try{req.transaction.abort();}catch(e){}};
  req.onerror=()=>finish([],'unavailable');
  req.onsuccess=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('records')){db.close();finish([],'not_present');return;}
   try{
    const get=db.transaction('records','readonly').objectStore('records').getAll();
    get.onsuccess=()=>{const rows=get.result.filter(x=>x.bucket?.startsWith(key+':'));db.close();finish(rows,'ok');};
    get.onerror=()=>{db.close();finish([],'unavailable');};
   }catch(e){db.close();finish([],'unavailable');}
  };
 });
}
function merge(active,archived){
 const seen=new Set(),result=[];
 for(const row of [...archived,...active]){
  if(!row||typeof row!=='object')continue;
  const key=JSON.stringify(row);
  if(seen.has(key))continue;
  seen.add(key);result.push(row);
 }
 return result.sort((a,b)=>moment(a)-moment(b));
}
function metrics(s){
 const data={};
 for(const k of ['level','sessions','totalAttempts','totalCorrect','answers','correct','points','difficulty','coverage','mastery','fluency','studySec','updatedAt']){
  if(typeof s[k]==='number')data[k]=s[k];
 }
 const m=s.metrics||s.items||s.attempts;
 if(m&&typeof m==='object'&&!Array.isArray(m)){
  const values=Object.entries(m);data.trackedItems=values.length;
  const err=values.filter(([,x])=>x&&(x.misses||x.wrong||x.lapses));
  data.itemsWithRecordedMistakes=err.length;
  data.mostMissed=err.sort((a,b)=>(b[1].misses||b[1].wrong||b[1].lapses||0)-(a[1].misses||a[1].wrong||a[1].lapses||0))
   .slice(0,15).map(([id,x])=>({id,mistakes:x.misses??x.wrong??x.lapses,attempts:x.attempts??x.count??null}));
 }
 return data;
}
async function build(kind,app=appId()){
 const {key,state,error}=stateFor(app);
 const out={schema:SCHEMA,version:'1.0.0',type:kind,generatedAt:new Date().toISOString(),
  app:{id:app,url:location.origin+location.pathname},
  source:{device:'local_browser',storageKey:key,archive:'not_checked',crossDeviceVerified:false},
  evidence:{available:!error,missingReason:error||null,
   note:'Sólo registros reales. Tiempo de pulsación y espera de corrección se distinguen cuando existen.'}};
 if(error)return out;
 const local=answers(state,app),ss=sessions(state,app);
 if(kind==='progress'){
  const recent=local.slice(-50).filter(a=>typeof a.ok==='boolean'||typeof a.correct==='boolean');
  out.progress=metrics(state);out.evidence.recordedAnswers=local.length;out.evidence.recordedSessions=ss.length;
  out.progress.recentAccuracy=recent.length?recent.filter(x=>!bad(x)).length/recent.length:null;
  out.recentMistakes=local.filter(bad).slice(-10);out.recentSessions=ss.slice(-5);
  return out;
 }
 const archived=await archive(key);out.source.archive=archived.status;
 const rows=merge(local,archived.rows.filter(x=>x.bucket.endsWith(':answers')).map(x=>x.row));
 if(kind==='last_error'||kind==='last_answer'){
  const list=kind==='last_error'?rows.filter(bad):rows;
  out.attempt=list.at(-1)||null;out.answerTime=out.attempt?time(out.attempt):{ms:null,source:'not_recorded'};
  if(!out.attempt)out.evidence.missingReason='No hay registros individuales de este tipo';
 }else if(kind==='last_session'){
  out.session=merge(ss,archived.rows.filter(x=>x.bucket.endsWith(':sessions')).map(x=>x.row)).at(-1)||null;
  if(!out.session)out.evidence.missingReason='No hay sesiones registradas';
 }else if(kind==='history'){
  out.progress=metrics(state);out.answers=rows;
  out.sessions=merge(ss,archived.rows.filter(x=>x.bucket.endsWith(':sessions')).map(x=>x.row));
  out.evidence.recordedAnswers=out.answers.length;out.evidence.recordedSessions=out.sessions.length;
 }
 return out;
}
async function copy(text){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch(e){}
 try{
  const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;opacity:0';
  document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return !!ok;
 }catch(e){return false;}
}
function download(data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='xds-'+data.app.id+'-historico-'+new Date().toISOString().slice(0,10)+'.json';
 link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function openPanel({app=appId(),technical}={}){
 document.querySelector('#xds-json-overlay')?.remove();
 const overlay=document.createElement('div');overlay.id='xds-json-overlay';
 overlay.innerHTML='<section class="xds-json-panel" role="dialog" aria-modal="true" aria-labelledby="xds-json-title">'+
 '<h2 id="xds-json-title">JSON · Aprendizaje</h2>'+
 '<p>Elige qué copiar para analizarlo en otra IA. Nada se comparte automáticamente.</p>'+
 '<div class="xds-json-buttons">'+
 '<button data-kind="last_error">Último error</button><button data-kind="last_answer">Última respuesta</button>'+
 '<button data-kind="last_session">Última sesión</button><button data-kind="progress">Progreso</button>'+
 '<button data-kind="history">Descargar histórico</button><button data-kind="technical">JSON técnico → ChatGPT</button>'+
 '</div><p id="xds-json-message" role="status" aria-live="polite"></p>'+
 '<textarea class="xds-json-fallback" aria-label="JSON para copia manual" readonly hidden></textarea>'+
 '<button class="xds-json-close">Cerrar</button></section>';
 const style=document.createElement('style');style.id='xds-json-styles';
 style.textContent='#xds-json-overlay{position:fixed;inset:0;z-index:2147483645;display:flex;justify-content:center;align-items:center;box-sizing:border-box;padding:14px;background:#000c}'+
 '.xds-json-panel{width:min(100%,510px);max-height:92dvh;overflow:auto;box-sizing:border-box;background:#152920;color:#f3f4ee;border:1px solid #c9a859;border-radius:17px;padding:18px;font:16px/1.4 system-ui,sans-serif}'+
 '.xds-json-panel h2{font-size:24px;margin:0}.xds-json-panel p{font-size:15px;color:#e0e9e0;margin:10px 0 14px}'+
 '.xds-json-buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
 '.xds-json-panel button{font:700 15px/1.3 system-ui,sans-serif;cursor:pointer;min-height:53px;border:1px solid #668876;border-radius:10px;padding:10px;background:#294b3e;color:#fff}'+
 '.xds-json-panel button:disabled{opacity:.55}.xds-json-panel button:focus-visible{outline:3px solid #ffda7c}'+
 '.xds-json-panel [data-kind="history"]{background:#4b4029;border-color:#b89b4c}'+
 '.xds-json-panel .xds-json-close{margin-top:10px;width:100%;background:#20362d}'+
 '.xds-json-fallback{width:100%;box-sizing:border-box;min-height:130px;background:#0a150f;color:#fff;padding:10px}'+
 '@media(max-width:430px){.xds-json-buttons{grid-template-columns:1fr}.xds-json-panel{padding:14px}.xds-json-panel button{min-height:46px}}';
 document.head.append(style);document.body.append(overlay);
 const close=()=>{overlay.remove();style.remove();document.removeEventListener('keydown',escape);};
 const escape=e=>{if(e.key==='Escape')close();};
 document.addEventListener('keydown',escape);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 overlay.querySelector('.xds-json-close').onclick=close;
 overlay.querySelectorAll('[data-kind]').forEach(button=>button.onclick=async()=>{
  const kind=button.dataset.kind,notice=overlay.querySelector('#xds-json-message');
  const fallback=overlay.querySelector('.xds-json-fallback');
  button.disabled=true;notice.textContent='Preparando JSON…';fallback.hidden=true;
  try{
   if(kind==='technical'){if(technical)await technical();close();return;}
   const result=await build(kind,app);
   if(kind==='history'){
    download(result);notice.textContent='Histórico descargado con los datos disponibles en este dispositivo.';
   }else{
    const value=JSON.stringify(result,null,2),ok=await copy(value);
    notice.textContent=ok?'JSON copiado. Puedes pegarlo en la IA que prefieras.':'No se pudo copiar. Selecciona el JSON de abajo.';
    if(!ok){fallback.value=value;fallback.hidden=false;fallback.select();}
   }
  }catch(e){notice.textContent='No se pudo generar el JSON: '+String(e?.message||e);}
  finally{button.disabled=false;}
 });
 overlay.querySelector('.xds-json-close').focus();return overlay;
}
w.AdrianLearningJSON=Object.freeze({version:'1.0.0',schema:SCHEMA,build,openPanel,appId});
})(window);
