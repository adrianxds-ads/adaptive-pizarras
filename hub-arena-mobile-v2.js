/* ADRIÁN HUB · Mobile Arena v2 visual bridge.
   Cloze Arena visual contract, adapted to Grammar / Phrasal / Classroom.
   Read-only game observation: no timer, score, question or storage writes. */
(function(){
 "use strict";
 const slug=(location.pathname.split("/").filter(Boolean)[0]||"");
 const apps={
  "adaptive-english":{name:"GRAMMAR QUEST",short:"GQ",kind:"grammar",mode:"GRAMMAR",originalPause:"focusPauseBtn",sound:true},
  "adaptive-phrasal-verbs":{name:"PHRASAL SPRINT",short:"PS",kind:"phrasal",mode:"PHRASAL",originalPause:"abortSessionBtn",sound:true},
  "adaptive-pizarras":{name:"CLASSROOM B2",short:"CB",kind:"classroom",mode:"CLASSROOM",originalPause:"abortBtn",sound:true}
 };
 const app=apps[slug];
 if(!app)return;
 const id=x=>document.getElementById(x);
 const text=x=>(x?.textContent||"").trim();
 const screen=x=>id(x)&&!id(x).classList.contains("hidden");
 const add=(parent,tag,cls,txt)=>{
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(txt!=null)node.textContent=txt;if(parent)parent.appendChild(node);
  return node;
 };
 function controls(){
  const panel=document.querySelector("#startScreen>.panel");
  if(!panel||panel.querySelector(".ar-home-top"))return;
  const top=add(null,"div","ar-home-top");
  const brand=add(top,"div","ar-brand");
  add(brand,"span","ar-monogram",app.short);
  add(brand,"span","ar-brand-text",app.name+" · B2");
  if(app.sound&&(id("soundBtn")||app.kind==="classroom")){
   const btn=add(top,"button","ar-audio","🔊 Audio");
   btn.type="button";btn.id="arHomeAudio";
   btn.setAttribute("aria-label","Activar o silenciar sonido");
   btn.addEventListener("click",()=>{(app.kind==="classroom"?window.HubClassroomAudio?.toggle():id("soundBtn")?.click());syncSound()});
  }
  panel.prepend(top);
  const heading=panel.querySelector(".meta")||id("startMeta")||panel.querySelector(".subtitle");
  const snap=add(null,"div","ar-hero-snapshot");
  for(const [key,label] of [["Coverage","Cobertura"],["Accuracy","Precisión"],["Rank","Rango"]]){
   const card=add(snap,"div","ar-snap");add(card,"b","", "—").id="arSnap"+key;add(card,"span","",label);
  }
  if(heading)heading.after(snap);else top.after(snap);
  const main=id("startBtn")||id("startClassBtn");
  if(main){
   const info=add(null,"div","ar-clock-info");
   info.innerHTML='<span>⏱</span><b>15 s</b><span>por pregunta · reloj original</span>';
   const actions=main.closest(".actions")||main;
   actions.after(info);
  }
  syncStats();
 }
 function syncStats(){
  const get=(...ids)=>ids.map(x=>id(x)).find(Boolean);
  const values={
   Coverage:text(get("coverageText","statsCoverage"))||"—",
   Accuracy:text(get("startAccuracy","statsAccuracy"))||"—",
   Rank:text(get("startAiLevel","startDue","startAvg"))||"—"
  };
  for(const [key,v] of Object.entries(values)){
   const n=id("arSnap"+key);if(n&&text(n)!==v)n.textContent=v.replace(/\s*\/\s*15$/,"");
  }
 }
 function syncSound(){
  if(!app.sound)return;
  const orig=id("soundBtn"),home=id("arHomeAudio"),hud=id("arSound");
  if(app.kind==="classroom"){const on=window.HubClassroomAudio?.isOn?.()!==false;if(home)home.textContent=on?"🔊 Sonido sí":"🔇 Silencio";if(hud)hud.textContent=on?"🔊":"🔇";return;}
  if(!orig)return;
  const raw=text(orig)+" "+(orig.getAttribute("aria-label")||"");
  let on=raw.includes("🔊")||/sound on|sonido activado|desactivar sonido/i.test(raw);
  if(raw.includes("🔇")||/sound off/i.test(raw))on=false;
  if(home)home.textContent=on?"🔊 Sonido sí":"🔇 Silencio";
  if(hud)hud.textContent=on?"🔊":"🔇";
 }
 function createHud(){
  const stage=id("gameScreen");if(!stage||id("arArenaHeader"))return;
  const h=add(null,"header","ar-arena-header");h.id="arArenaHeader";
  const top=add(h,"div","ar-hud");
  const exit=add(top,"button","ar-exit",app.kind==="grammar"?"Ⅱ Pausa":"↩ Salir");
  exit.type="button";exit.id="arExit";exit.setAttribute("aria-label",app.kind==="grammar"?"Pausar y abrir ajustes":"Salir del ejercicio");
  exit.addEventListener("click",()=>id(app.originalPause)?.click());
  const center=add(top,"div","ar-center");
  add(center,"span","ar-mode-badge",app.mode).id="arModeBadge";
  add(center,"span","ar-count","1 / 15").id="arCount";
  const combo=add(center,"span","ar-combo","🔥 ×2");
  combo.id="arCombo";combo.hidden=true;
  if(app.sound){
   const sound=add(top,"button","ar-hud-sound","🔊");
   sound.type="button";sound.id="arSound";sound.setAttribute("aria-label","Activar o silenciar sonido");
   sound.addEventListener("click",()=>{(app.kind==="classroom"?window.HubClassroomAudio?.toggle():id("soundBtn")?.click());syncSound()});
  }else{
   // Keep HUD's third column balanced without introducing a nonfunctional sound control.
   add(top,"span","ar-hud-side","15 s").id="arClassState";
  }
  const progress=add(h,"div","ar-progress");progress.id="arProgress";
  progress.setAttribute("role","progressbar");progress.setAttribute("aria-label","Progreso de la sesión");
  progress.setAttribute("aria-valuemin","0");progress.setAttribute("aria-valuemax","15");progress.setAttribute("aria-valuenow","0");
  for(let i=0;i<15;i++)add(progress,"i");
  const card=add(h,"div","ar-timer");card.id="arTimer";card.dataset.preread="0";
  const line=add(card,"div","ar-timer-top");
  add(line,"span","ar-timer-label","Tiempo para responder").id="arTimerLabel";
  add(line,"strong","ar-timer-digits","15.0 s").id="arTimerDigits";
  const bar=add(card,"div","ar-timer-track");
  add(bar,"div","ar-timer-fill").id="arTimerFill";
  stage.prepend(h);syncSound();
 }
 function foldResults(){
  const panel=document.querySelector("#endScreen>.panel");
  if(!panel||panel.querySelector(".ar-end-fold"))return;
  const nodes=[...panel.children].filter(n=>
   n.matches(".grid,.charts,.learning-score-box,.phrasegrid,.ai-valuation-box,.ai-handoff-card,.ai-legend-wrap"));
  if(nodes.length===0)return;
  const fold=add(null,"details","ar-end-fold");
  add(fold,"summary","", "📊 Estadísticas, gráficos y datos · Ver detalles");
  // Preserve document IDs and event listeners by moving real elements, never cloning.
  for(const n of nodes)fold.appendChild(n);
  const actions=panel.querySelector(".end-quick-actions")||panel.querySelector(".actions");
  if(actions)actions.after(fold);else panel.appendChild(fold);
 }
 function getSession(){
  try{return typeof session!=="undefined"?session:null}catch(_){return null}
 }
 function getLocked(){
  try{return typeof locked!=="undefined"&&locked}catch(_){return false}
 }
 function getStudy(){return getSession()?.type==="study"}
 function currentNumbers(){
  const qn=parseInt(text(id("qIndex")),10);
  const totalText=text(id("qTotal"));
  const total=parseInt(totalText.replace(/[^\d]/g,""),10);
  const focus=text(id("focusQuestionCounter")).match(/(\d+)\s*\/\s*(\d+)/);
  const study=app.kind==="classroom" && getStudy();
  const current=focus?Number(focus[1]):(Number.isFinite(qn)?qn:1);
  if(study){
   const s=getSession();
   const minimum=Math.max(1,Number(s?.minQuestions)||12);
   // A study contract can exceed the minimum. Never pretend it ends at question 15.
   return {index:current,total:Math.max(minimum,current),study:true};
  }
  return {index:current,total:focus?Number(focus[2]):(Number.isFinite(total)&&total>=1&&total<=200?total:15),study:false};
 }
 function updateHud(){
  if(!screen("gameScreen"))return;
  createHud();
  const {index,total,study}=currentNumbers();
  const badge=id("arModeBadge"),counter=id("arCount"),progress=id("arProgress");
  if(badge&&app.kind==="classroom"){
   const mode=text(id("qMode"))||"CLASSROOM";
   if(badge.textContent!==mode)badge.textContent=mode;
  }
  if(counter){
   const value=study?"CLASE · "+index:index+" / "+total;
   if(counter.textContent!==value)counter.textContent=value;
  }
  if(app.kind==="classroom"){
   const side=id("arClassState");
   if(side){
    if(study){
     const s=getSession(),left=Math.max(0,Number(s?.endsAt||0)-Date.now());
     const minutes=Math.floor(left/60000),seconds=Math.floor(left%60000/1000);
     side.textContent="CLASE "+String(minutes).padStart(2,"0")+":"+String(seconds).padStart(2,"0");
     side.title="Tiempo restante del contrato de clase";
    }else{side.textContent="15 s";side.title="Límite por pregunta"}
   }
  }
  if(progress){
   // Keep one 15-segment track even in long Classroom contracts; the number
   // reflects the percentage of the minimum study requirement, never a false 15-question limit.
   const cells=study?15:Math.max(1,Math.min(total,50));
   if(progress.children.length!==cells){
    progress.replaceChildren();for(let i=0;i<cells;i++)add(progress,"i");
   }
   const covered=study?Math.min(cells,Math.floor((index-1)/Math.max(1,total)*cells)):Math.max(0,index-1);
   for(let i=0;i<progress.children.length;i++){
    const p=progress.children[i];p.className=i<covered?"done":i===covered?"active":"";
   }
   progress.setAttribute("aria-valuenow",String(Math.max(0,index-1)));
   progress.setAttribute("aria-valuemax",String(total));
  }
  const source=id("focusTimerText")||id("timerText");
  const sec=parseFloat(text(source).replace(",","."));
  const answers=id("answers");
  const pre=!!answers?.classList.contains("read-first-hidden") ||
    (app.kind==="phrasal" && id("gameScreen")?.classList.contains("think-recall"));
  const registered=getLocked();
  syncAnswerFeedback(registered);
  const card=id("arTimer");
  if(card){
   card.dataset.preread=pre?"1":"0";
   card.dataset.registered=registered?"1":"0";
   card.dataset.urgent=!pre&&Number.isFinite(sec)&&sec<=4.2?"1":"0";
   card.dataset.warn=!pre&&Number.isFinite(sec)&&sec>4.2&&sec<=6?"1":"0";
  }
  const digits=id("arTimerDigits"),label=id("arTimerLabel"),fill=id("arTimerFill");
  if(digits){
   const display=pre?"LEER":Number.isFinite(sec)?Math.max(0,sec).toFixed(1)+" s":text(source)||"15.0 s";
   if(digits.textContent!==display)digits.textContent=display;
  }
  if(label){
   const l=registered?"Respuesta registrada":pre?"Lectura previa · sin presión":"Tiempo de respuesta · 15 s";
   if(label.textContent!==l)label.textContent=l;
  }
  if(fill){
   const pct=Number.isFinite(sec)?Math.max(0,Math.min(100,sec/15*100)):100;
   fill.style.width=(pre?100:pct.toFixed(1))+"%";
  }
  const c=id("arCombo");
  if(c){
   const fromLabel=text(id("comboHud")).match(/(\d+)/);
   const fromSession=(()=>{try{return typeof session!=="undefined"&&session?Number(session.combo):0}catch(_){return 0}})();
   const combo=fromLabel?Number(fromLabel[1]):fromSession;
   c.hidden=combo<2;c.textContent="🔥 ×"+combo;
  }
  syncSound();
 }

 function syncAnswerFeedback(registered){
  const fb=id("feedback"),s=getSession();
  if(!fb||!s)return;
  // Read-only session tally; do not infer progress from option colors.
  const records=Array.isArray(s.records)?s.records:[];
  const hits=Number(s.correct)||0;
  const attempts=records.length||(Array.isArray(s.times)?s.times.length:0);
  const misses=Math.max(0,attempts-hits);
  const value="✓ "+hits+"   ✕ "+misses;
  if(fb.textContent!==value)fb.textContent=value;
  fb.classList.add("ar-arcade-tally");
  fb.setAttribute("aria-label",hits+" aciertos y "+misses+" errores");
 }

 function boot(){
  const stage=id("gameScreen"),home=id("startScreen"),end=id("endScreen");
  if(!stage||!home||!end)return;
  document.body.setAttribute("data-arena-mobile-v2",app.kind);
  controls();createHud();foldResults();
  setInterval(()=>{
   if(screen("startScreen")){syncStats();syncSound()}
   if(screen("gameScreen"))updateHud();
  },130);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
 else boot();
 window.HubArenaMobileV2=Object.freeze({version:"2.0.0",kind:app.kind,reference:"cloze-arena-v2"});
})();
