/* Classroom durable progress bridge. Only the v3 key is virtualized. */
(()=>{
'use strict';
const KEY='classroom_b2_state_v3',DB='adrian-classroom-progress-v1',STORE='states';
const proto=Storage.prototype,rawGet=proto.getItem,rawSet=proto.setItem,rawRemove=proto.removeItem;
const channel='BroadcastChannel'in window?new BroadcastChannel(DB):null;
let db,value=null,revision=0,queue=Promise.resolve(),failure=null,pending=0,ready=false;
const notice=document.createElement('div');
notice.id='classroomPersistenceStatus';notice.setAttribute('role','status');
notice.style.cssText='position:sticky;top:0;z-index:10000;padding:12px;background:#192229;color:#EAF0F5;font:18px/1.35 Roboto,system-ui';
notice.textContent='Comprobando el progreso guardado…';document.body.prepend(notice);document.querySelector('.app').inert=true;
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s??'null'))),b=>b.toString(16).padStart(2,'0')).join('');
function valid(s){
 const x=JSON.parse(s),fail=()=>{throw Error('Estado de Classroom incompatible; original conservado');};
 if(!x||x.version!==3||!['history','answerHistory','customItems','planHistory'].every(k=>Array.isArray(x[k]))||!x.items||typeof x.items!=='object'||Array.isArray(x.items))fail();
 for(const k of ['answers','correct','sessions','classSessions','quickSessions','level'])if(!Number.isSafeInteger(x[k])||x[k]<0)fail();
 for(const k of ['points','studySec'])if(!Number.isFinite(x[k])||x[k]<0)fail();
 if(x.correct>x.answers)fail();
 const ids=new Set();
 for(const q of x.customItems){if(!q||typeof q.id!=='string'||ids.has(q.id)||!['category','concept','prompt','correct'].every(k=>typeof q[k]==='string')||!Array.isArray(q.options)||q.options.length!==4||!q.options.includes(q.correct)||new Set(q.options.map(v=>String(v).trim().toLowerCase())).size!==4)fail();ids.add(q.id);}
 const queue=[x];let count=0;while(queue.length){const n=queue.pop();if(++count>130000)fail();if(n&&typeof n==='object')for(const [k,v] of Object.entries(n)){if(['__proto__','prototype','constructor'].includes(k))fail();if(v&&typeof v==='object')queue.push(v);}}
 return x;
}
function display(){notice.textContent=failure?'No se ha confirmado el guardado. Conserva esta pestaña y exporta una copia. '+failure.message:pending?'Guardando progreso…':'Progreso guardado en este dispositivo';notice.dataset.state=failure?'error':pending?'pending':'saved';notice.hidden=!failure&&!pending&&ready;}
function transaction(mode,fn){return new Promise((res,rej)=>{const tx=db.transaction(STORE,mode),st=tx.objectStore(STORE);let result,error;try{fn(st,v=>result=v,e=>{error=e;tx.abort();});}catch(e){error=e;tx.abort();}tx.oncomplete=()=>res(result);tx.onabort=()=>rej(error||tx.error||Error('Escritura interrumpida'));tx.onerror=()=>{};});}
async function read(){return transaction('readonly',(s,out)=>{const q=s.get(KEY);q.onsuccess=()=>out(q.result||null);});}
async function verify(row){if(row&&(typeof row.revision!=='number'||await digest(row.raw)!==row.sha256))throw Error('La copia persistente no supera la verificación');if(row?.raw!==null&&row)valid(row.raw);}
async function commit(next,reason){
 const sha=await digest(next);let written;
 await transaction('readwrite',(s,out,abort)=>{
  const q=s.get(KEY);q.onsuccess=()=>{
   const old=q.result;
   if((old?.revision||0)!==revision){abort(Error('Otra pestaña ha cambiado el progreso. Exporta esta copia y vuelve a abrir.'));return;}
   written={id:KEY,raw:next,sha256:sha,revision:revision+1,reason,previous:old?{raw:old.raw,sha256:old.sha256,revision:old.revision}:null};
   s.put(written);
  };
 });
 const check=await read();await verify(check);
 if(check.revision!==written.revision||check.sha256!==sha)throw Error('El progreso cambió antes de confirmar el guardado');
 revision=check.revision;channel?.postMessage({revision});
}
function schedule(next,reason){
 if(failure)throw failure;
 if(next!==null)valid(next);
 value=next;pending++;display();
 queue=queue.then(()=>{if(failure)throw failure;return commit(next,reason);}).catch(e=>{failure=e;}).finally(()=>{pending--;display();});
}
async function flush(){await queue;if(failure)throw failure;}
function install(){
 proto.getItem=function(k){return this===localStorage&&String(k)===KEY?value:rawGet.call(this,k);};
 proto.setItem=function(k,v){if(this===localStorage&&String(k)===KEY)return schedule(String(v),'save');return rawSet.call(this,k,v);};
 proto.removeItem=function(k){if(this===localStorage&&String(k)===KEY)return schedule(null,'remove');return rawRemove.call(this,k);};
 addEventListener('beforeunload',e=>{if(pending||failure){e.preventDefault();e.returnValue='';}});
}
async function start(){
 db=await new Promise((res,rej)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore(STORE,{keyPath:'id'});q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(Error('Cierra las otras pestañas de Classroom para abrir sus datos'));});
 db.onversionchange=()=>{db.close();failure=Error('El almacenamiento cambió; vuelve a abrir Classroom');display();};
 let row=await read();await verify(row);
 const local=rawGet.call(localStorage,KEY);
 if(local!==null)valid(local);
 if(row&&local!==null&&row.raw!==local)throw Error('Hay dos estados de Classroom distintos. Se conservan ambos; requiere revisión.');
 revision=row?.revision||0;value=row?row.raw:local;
 if(!row&&value===null){
  const legacy=rawGet.call(localStorage,'pizarras_state_v1');
  if(legacy!==null){
   if(legacy.startsWith('ADRIAN:GZIP:'))throw Error('El curso anterior necesita decodificación antes de continuar');
   const old=JSON.parse(legacy);if(old.version!==2)throw Error('Versión histórica desconocida');
   const next={...old,version:3};valid(JSON.stringify(next));value=JSON.stringify(next);
  }
 }
 if(!row&&value!==null){await commit(value,local===null?'continue-v2-preserving-original':'archive-local-v3');row=await read();}
 // Archive and verify before freeing only the redundant v3 key, never the legacy key.
 if(local!==null){if(row.raw!==local)throw Error('Copia local no verificada');rawRemove.call(localStorage,KEY);}
 install();
 window.ClassroomProgress=Object.freeze({flush,getItem:()=>value,inspect:()=>({revision,pending,error:failure?.message||null,ready}),database:DB});
 ready=true;display();
}
window.ClassroomProgressReady=start().catch(e=>{failure=e;display();throw e;});
})();