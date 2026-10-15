"use strict";
/* Classroom B2 · protección experimental, exclusivamente localhost y datos ficticios. */
(()=>{
const SCHEMA="XDS_CLASSROOM_B2_BACKUP_V1",APP="pizarras",KEY=STORAGE_KEY;
const PREF=READ_FIRST_KEY,PENDING=KEY+"_pending";
const DB="xds-classroom-v3-undo-v1",STORE="snapshots",MAX=25*1024*1024;

const ARCHIVE_DB="xds-learning-history-v1",ARCHIVE_STORE="records";
const archivePrefix=KEY+":";
async function archiveDb(create){
 const names=typeof indexedDB.databases==="function"?await indexedDB.databases():null;
 if(!create&&names&&!names.some(x=>x.name===ARCHIVE_DB))return null;
 return new Promise((resolve,reject)=>{
   const req=indexedDB.open(ARCHIVE_DB,1);
   req.onupgradeneeded=()=>{
     if(!create){req.transaction.abort();return;}
     if(!req.result.objectStoreNames.contains(ARCHIVE_STORE))req.result.createObjectStore(ARCHIVE_STORE,{keyPath:"key"});
   };
   req.onsuccess=()=>{
     if(!req.result.objectStoreNames.contains(ARCHIVE_STORE)){req.result.close();reject(Error("Archivo histórico sin almacén de registros."));return;}
     resolve(req.result);
   };
   req.onerror=()=>reject(req.error||Error("No se puede abrir el archivo histórico."));
   req.onblocked=()=>reject(Error("Archivo histórico bloqueado."));
 });
}
function archiveRecordErrors(records){
 const problems=[],keys=new Set();
 if(!Array.isArray(records))return ["Histórico archivado inválido."];
 if(records.length>100000)return ["Demasiados registros históricos."];
 for(const r of records){
   if(!isRecord(r)||typeof r.key!=="string"||r.key.length>500||!r.key.startsWith(archivePrefix)||
      typeof r.bucket!=="string"||!r.bucket.startsWith(archivePrefix)||!isRecord(r.row)||keys.has(r.key)){
     problems.push("Registro de histórico inválido o duplicado.");break;
   }
   keys.add(r.key);
   const queue=[r.row];
   let visited=0;
   while(queue.length){
     const x=queue.pop();if(++visited>5000){problems.push("Histórico demasiado complejo.");break;}
     if(x&&typeof x==="object")for(const [k,v] of Object.entries(x)){
       if(["__proto__","constructor","prototype"].includes(k)){problems.push("Clave peligrosa en histórico.");break;}
       if(v&&typeof v==="object")queue.push(v);
     }
   }
   if(problems.length)break;
 }
 return problems;
}
async function readArchive(){
 const db=await archiveDb(false);if(!db)return [];
 try{
   const rows=await new Promise((resolve,reject)=>{
     const request=db.transaction(ARCHIVE_STORE,"readonly").objectStore(ARCHIVE_STORE).getAll();
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
   });
   const own=rows.filter(x=>x.bucket?.startsWith(archivePrefix));
   const errors=archiveRecordErrors(own);if(errors.length)throw Error(errors.join(" "));
   return own.map(clone);
 }finally{db.close();}
}
async function archiveChange(desired,replaceAll=false){
 const problems=archiveRecordErrors(desired);if(problems.length)throw Error(problems.join(" "));
 if(!desired.length&&!replaceAll)return;
 const db=await archiveDb(true);
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(ARCHIVE_STORE,"readwrite"),store=tx.objectStore(ARCHIVE_STORE);
   const q=store.getAll(),expected=new Map(desired.map(r=>[r.key,r]));
   let failure=null;
   q.onsuccess=()=>{
     const all=q.result,own=all.filter(r=>r.bucket?.startsWith(archivePrefix));
     const existing=new Map(own.map(r=>[r.key,r]));
     if(!replaceAll){
       for(const r of desired){
         if(existing.has(r.key)&&JSON.stringify(existing.get(r.key))!==JSON.stringify(r)){
           failure=Error("Conflicto de histórico archivado: "+r.key);tx.abort();return;
         }
       }
     }
     if(replaceAll)for(const r of own)store.delete(r.key);
     for(const r of desired)if(replaceAll||!existing.has(r.key))store.put(r);
   };
   q.onerror=()=>{failure=q.error;tx.abort();};
   tx.oncomplete=resolve;
   tx.onabort=()=>reject(failure||tx.error||Error("No se pudo completar el histórico."));
   tx.onerror=()=>reject(failure||tx.error||Error("Error en el histórico."));
  });
 }finally{db.close();}
}

const $=id=>document.getElementById(id);
const status=document.createElement("div");
status.id="backupSafetyStatus";status.className="status";status.setAttribute("role","status");
status.textContent="Copias protegidas · verifica el archivo antes de restaurar.";
$("importFile").closest(".actions").insertAdjacentElement("afterend",status);
const undoButton=document.createElement("button");
undoButton.id="undoImportBtn";undoButton.type="button";undoButton.className="ghost small";
undoButton.textContent="DESHACER ÚLTIMO CAMBIO";undoButton.disabled=true;
$("resetBtn").insertAdjacentElement("afterend",undoButton);
const say=(text,isError=false)=>{status.textContent=text;status.dataset.error=String(isError);};
const isRecord=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const clone=x=>JSON.parse(JSON.stringify(x));
const hex=async value=>{
 const bytes=new TextEncoder().encode(value),digest=await crypto.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
};
const payload=b=>({schema:b.schema,app:b.app,schemaVersion:b.schemaVersion,createdAt:b.createdAt,state:b.state,readFirst:b.readFirst,
 ...(b.schemaVersion===2?{archiveRecords:b.archiveRecords}: {})});
function checkState(raw){
 const problems=[];
 if(!isRecord(raw))return ["El estado no es un objeto."];
 if(raw.version!==freshState().version)problems.push("Versión incompatible con este motor; conserva la copia original.");
 for(const k of ["history","answerHistory","customItems","planHistory"]){
   if(!Array.isArray(raw[k]))problems.push(k+" debe ser un array.");
 }
 if(!isRecord(raw.items))problems.push("items debe ser un objeto.");
 if(raw.pendingPlan!==null&&raw.pendingPlan!==undefined&&!isRecord(raw.pendingPlan))problems.push("Plan inválido.");
 if(raw.activeSession!==undefined&&raw.activeSession!==null){
   if(!isRecord(raw.activeSession)||!["study","quick"].includes(raw.activeSession.type))problems.push("Sesión activa inválida.");
 }
 for(const k of ["answers","correct","sessions","classSessions","quickSessions","level"]){
   if(!integer(raw[k]))problems.push(k+" debe ser entero no negativo.");
 }
 if(!Number.isFinite(raw.points)||raw.points<0)problems.push("Puntos inválidos.");
 if(!Number.isFinite(raw.studySec)||raw.studySec<0)problems.push("Tiempo de estudio inválido.");
 if(integer(raw.answers)&&integer(raw.correct)&&raw.correct>raw.answers)problems.push("Aciertos superiores a respuestas.");
 if(integer(raw.sessions)&&integer(raw.quickSessions)&&integer(raw.classSessions)&&raw.sessions<Math.max(raw.quickSessions,raw.classSessions))problems.push("Sesiones incoherentes.");
 if(isRecord(raw.items)){
   for(const [id,m] of Object.entries(raw.items)){
     if(id.length>200||!isRecord(m)){problems.push("Registro de ejercicio inválido.");break;}
     if(!integer(m.attempts)||!integer(m.correct)||m.correct>m.attempts||!integer(m.misses)){problems.push("Contadores de ejercicio inválidos.");break;}
   }
 }
 const seen=new Set(),base=new Set(BASE_BANK.map(q=>q.id));
 for(const q of Array.isArray(raw.customItems)?raw.customItems:[]){
   if(typeof validQuestion!=="function"||!validQuestion(q)||seen.has(q.id)||base.has(q.id)){
     problems.push("Variación con ID duplicado o pregunta inválida.");break;
   }
   seen.add(q.id);
 }
 const queue=[raw];let scanned=0;
 while(queue.length){
   const value=queue.pop();
   if(++scanned>130000){problems.push("Estructura demasiado compleja.");break;}
   if(value&&typeof value==="object"){
     for(const [key,child] of Object.entries(value)){
       if(["__proto__","prototype","constructor"].includes(key)){problems.push("Propiedad peligrosa detectada.");queue.length=0;break;}
       if(child&&typeof child==="object")queue.push(child);
     }
   }
 }
 return [...new Set(problems)];
}
function openDb(){
 return new Promise((resolve,reject)=>{
   const request=indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:"id"});};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error("No se pudo abrir el diario de recuperación."));
   request.onblocked=()=>reject(Error("Diario bloqueado por otra pestaña."));
 });
}
function transact(db,mode,work){
 return new Promise((resolve,reject)=>{
   const t=db.transaction(STORE,mode),s=t.objectStore(STORE);
   let request;try{request=work(s);}catch(e){t.abort();reject(e);return;}
   t.oncomplete=()=>resolve(request?.result);
   t.onabort=()=>reject(t.error||Error("Transacción abortada."));
   t.onerror=()=>reject(t.error||Error("Error de transacción."));
 });
}
async function latest(){
 const db=await openDb();
 try{
   const all=await transact(db,"readonly",s=>s.getAll());
   return all.sort((a,b)=>b.createdMs-a.createdMs)[0]||null;
 }finally{db.close();}
}
async function snapshot(reason){
 await window.ClassroomProgress.flush();
 const previousRaw=localStorage.getItem(KEY),previousPending=sessionStorage.getItem(PENDING);
 const previousRead=localStorage.getItem(PREF),previousArchive=await readArchive();
 const record={id:Date.now()+"-"+Math.random().toString(36).slice(2),
   createdMs:Date.now(),reason,previousRaw,previousPending,previousRead,previousArchive,
   previousMemory:JSON.stringify(state)};
 record.digest=await hex(JSON.stringify({previousRaw,previousPending,previousRead,previousArchive,previousMemory:record.previousMemory}));
 const db=await openDb();
 try{
   await transact(db,"readwrite",s=>s.put(record));
   const readBack=await transact(db,"readonly",s=>s.get(record.id));
   if(!readBack||readBack.digest!==record.digest)throw Error("La copia de recuperación no se pudo verificar.");
 }finally{db.close();}
 return record;
}
async function deleteSnapshot(id){
 const db=await openDb();try{await transact(db,"readwrite",s=>s.delete(id));}finally{db.close();}
}
async function restoreStorage(record,previous){
 window.ClassroomProgress.replace(record.previousRaw);
 if(record.previousPending===null)sessionStorage.removeItem(PENDING);
 else sessionStorage.setItem(PENDING,record.previousPending);
 if(record.previousRead===null)localStorage.removeItem(PREF);
 else localStorage.setItem(PREF,record.previousRead);
 await window.ClassroomProgress.flush();
 if(localStorage.getItem(KEY)!==record.previousRaw||
    sessionStorage.getItem(PENDING)!==record.previousPending||
    localStorage.getItem(PREF)!==record.previousRead)throw Error("No se verificó la recuperación anterior.");
 await archiveChange(record.previousArchive||[],true);
 state=clone(previous);
 readFirstMode=record.previousRead!=="0";
 normalize();renderHome();
}
async function createBundle(){
 const snapshotState=clone(state),archiveRecords=await readArchive();
 const problems=checkState(snapshotState);
 if(problems.length)throw Error("El progreso actual requiere revisión antes de exportar: "+problems.join(" "));
 const b={schema:SCHEMA,app:APP,schemaVersion:2,createdAt:new Date().toISOString(),
   state:snapshotState,readFirst:readFirstMode?"1":"0",archiveRecords};
 b.sha256=await hex(JSON.stringify(payload(b)));
 return b;
}
function download(b){
 const blob=new Blob([JSON.stringify(b,null,2)],{type:"application/json"});
 const anchor=document.createElement("a"),url=URL.createObjectURL(blob);
 anchor.href=url;anchor.download="classroom-b2-backup-"+new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")+".json";
 document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function validateDocument(x){
 let candidate,readFirst=null,source,archiveRecords=[];
 if(isRecord(x)&&x.schema===SCHEMA){
   if(x.app!==APP||![1,2].includes(x.schemaVersion)||typeof x.sha256!=="string")throw Error("Aplicación, versión o firma no compatibles.");
   const digest=await hex(JSON.stringify(payload(x)));
   if(digest!==x.sha256.toLowerCase())throw Error("La huella SHA-256 no coincide: archivo alterado.");
   if(x.readFirst!==null&&x.readFirst!=="0"&&x.readFirst!=="1")throw Error("Preferencia inválida.");
   candidate=x.state;readFirst=x.readFirst;source="huella SHA-256";
   if(x.schemaVersion===2)archiveRecords=x.archiveRecords;
 }else if(isRecord(x)&&x.app===APP&&isRecord(x.state)){
   candidate=x.state;source="legado-sin-firma";
 }else if(isRecord(x)&&x.version===freshState().version&&Object.hasOwn(x,"items")&&Object.hasOwn(x,"answerHistory")){
   candidate=x;source="estado-sin-firma";
 }else throw Error("Formato desconocido o de otra aplicación.");
 const problems=[...checkState(candidate),...archiveRecordErrors(archiveRecords)];
 if(problems.length)throw Error(problems.join(" "));
 const compact=JSON.stringify({candidate,archiveRecords});
 if(compact.length>MAX)throw Error("Estado demasiado grande.");
 return {candidate:clone(candidate),readFirst,source,archiveRecords:clone(archiveRecords)};
}
const busy={value:false};
async function locked(action){
 if(busy.value){say("Hay una operación en curso.",true);return;}
 busy.value=true;
 try{return await action();}catch(e){say(String(e.message||e),true);return null;}
 finally{busy.value=false;await updateUndo().catch(()=>{});}
}
async function updateUndo(){
 undoButton.disabled=!(await latest());
}
async function exportSafe(){
 return locked(async()=>{
   const b=await createBundle();download(b);
   say("Copia con huella SHA-256 preparada. Comprueba que el archivo se haya guardado correctamente.");
   return b;
 });
}
function describe(x){return "respuestas: "+x.answers+", sesiones: "+x.sessions+
  ", historial: "+x.answerHistory.length+", ejercicios: "+Object.keys(x.items).length;}
async function applyCandidate(prepared){
 if(session&&!session.finished)throw Error("Termina o interrumpe la sesión antes de importar.");
 if(state?.activeSession&&!state.activeSession.finished)throw Error("Existe una sesión pendiente: no se importará mientras pueda reanudarse.");
 const current=state;
 const message="IMPORTACIÓN CLASSROOM B2\nActual: "+describe(current)+
  "\nArchivo: "+describe(prepared.candidate)+
  "\nFormato: "+prepared.source+
  "\n\nSe guardará una copia de recuperación antes de reemplazar el progreso. ¿Continuar?";
 if(!confirm(message))return {cancelled:true};
 const oldMemory=clone(state),oldMode=readFirstMode;
 const journal=await snapshot("import");
 try{
   state=clone(prepared.candidate);
   normalize();
   const encoded=JSON.stringify(state);
   window.ClassroomProgress.replace(encoded);
   await window.ClassroomProgress.flush();
   if(localStorage.getItem(KEY)!==encoded)throw Error("No se pudo verificar la escritura del progreso.");
   sessionStorage.removeItem(PENDING);
   if(sessionStorage.getItem(PENDING)!==null)throw Error("No se pudo limpiar el estado temporal.");
   if(prepared.readFirst!==null){
     localStorage.setItem(PREF,prepared.readFirst);
     if(localStorage.getItem(PREF)!==prepared.readFirst)throw Error("Preferencia no verificada.");
     readFirstMode=prepared.readFirst==="1";
   }
   await archiveChange(prepared.archiveRecords);
   renderHome();
   say("Importación comprobada. Puedes deshacerla con el botón de recuperación.");
   return {restored:true,journal:journal.id};
 }catch(error){
   let rollbackError=null;
   try{await restoreStorage(journal,oldMemory);readFirstMode=oldMode;await deleteSnapshot(journal.id);}
   catch(e){rollbackError=e;}
   if(rollbackError)throw Error("FALLO CRÍTICO. El diario conserva el estado anterior. "+
      "Recuperación automática incompleta: "+rollbackError.message+"; fallo original: "+error.message);
   throw Error("Importación cancelada y estado anterior restaurado: "+error.message);
 }
}
async function importSafe(file){
 return locked(async()=>{
   if(!file)return null;
   if(file.size>MAX)throw Error("Archivo mayor de 25 MiB.");
   const x=JSON.parse(await file.text()),prepared=await validateDocument(x);
   return applyCandidate(prepared);
 });
}
async function undo(){
 return locked(async()=>{
   if((session&&!session.finished)||(state?.activeSession&&!state.activeSession.finished))throw Error("No puedes deshacer mientras hay una sesión pendiente.");
   const journal=await latest();
   if(!journal){say("No hay copias de recuperación.");return;}
   const digest=await hex(JSON.stringify({previousRaw:journal.previousRaw,
     previousPending:journal.previousPending,previousRead:journal.previousRead,previousArchive:journal.previousArchive,previousMemory:journal.previousMemory}));
   if(digest!==journal.digest)throw Error("Diario de recuperación alterado.");
   if(!confirm("¿Restaurar el estado anterior a la última operación de "+journal.reason+"?"))return;
   const currentBackup=await snapshot("before-undo");
   try{
     await restoreStorage(journal,JSON.parse(journal.previousMemory));
     await deleteSnapshot(journal.id);
     await deleteSnapshot(currentBackup.id);
     say("Estado anterior recuperado y verificado.");
   }catch(e){
     try{await restoreStorage(currentBackup,JSON.parse(currentBackup.previousMemory));}catch(_){}
     throw Error("No se pudo completar la recuperación: "+e.message);
   }
 });
}
async function safeReset(){
 return locked(async()=>{
   if((session&&!session.finished)||(state?.activeSession&&!state.activeSession.finished))throw Error("No se puede reiniciar con una sesión activa.");
   if(!confirm("¿Reiniciar Classroom B2? Se guardará una copia de recuperación previa."))return;
   if(!confirm("Segunda confirmación: ¿eliminar el progreso actual de esta copia aislada?"))return;
   const oldMemory=clone(state),journal=await snapshot("reset");
   try{
     window.ClassroomProgress.replace(null);
     await window.ClassroomProgress.flush();
     if(localStorage.getItem(KEY)!==null)throw Error("No se pudo eliminar el estado.");
     sessionStorage.removeItem(PENDING);
     await archiveChange([],true);
     state=freshState();normalize();renderHome();
     say("Reinicio completado. Puedes deshacerlo.");
   }catch(e){
     await restoreStorage(journal,oldMemory);
     throw Error("Reinicio revertido: "+e.message);
   }
 });
}
$("exportBtn").textContent="EXPORTAR COPIA SEGURA";
$("importBtn").textContent="IMPORTAR COPIA";
$("resetBtn").textContent="REINICIAR CON COPIA";
$("exportBtn").onclick=exportSafe;
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=event=>{
 const file=event.target.files[0];event.target.value="";
 if(file)importSafe(file);
};
$("resetBtn").onclick=safeReset;
undoButton.onclick=undo;
updateUndo().catch(e=>say("Diario de recuperación no disponible: "+e.message,true));
window.ClassroomDataGuard=Object.freeze({schema:SCHEMA,createBundle,validateDocument,
 checkState,readArchive,importSafe,undo,safeReset,updateUndo});
})();
