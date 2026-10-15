(async()=>{
'use strict';
try{
 await window.ClassroomProgressReady;
 for(const node of document.querySelectorAll('script[type="application/x-classroom-deferred"]')){
  const script=document.createElement('script');
  if(node.src){script.src=node.getAttribute('src');await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(Error('No se pudo cargar '+script.src));document.body.append(script);});}
  else{script.textContent=node.textContent.replace("window.addEventListener('load',()=>navigator.serviceWorker.register","(()=>navigator.serviceWorker.register").replace(".catch(()=>{}));",".catch(()=>{}))();");document.body.append(script);}
 }
 const errors=window.ClassroomDataGuard.checkState(state);
 if(errors.length)throw Error(errors.join(' '));
 await window.ClassroomProgress.flush();
 document.dispatchEvent(new Event('classroom-ready'));
 document.querySelector('.app').inert=false;window.ClassroomBootComplete=true;
}catch(e){
 const n=document.getElementById('classroomPersistenceStatus');n.hidden=false;n.dataset.state='error';n.textContent='Classroom se ha detenido para proteger los datos: '+e.message;
 document.querySelector('.app').inert=true;window.ClassroomBootError=e.message;
}
})();