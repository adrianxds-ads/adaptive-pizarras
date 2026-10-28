/* Quiz ergonomics 1.0.0. Presentation and cancellable advance; no grading/storage. */
(()=>{
'use strict';
const CONFIG=Object.freeze({TIME_PER_QUESTION:15000,DWELL_TIME_CORRECT:320,DWELL_TIME_WRONG:420,TRANSITION_DURATION:60});
class QuizFlowController{
 constructor(){this.epoch=0;this.pending=new Set();this.stage=null;}
 cancel(){
  for(const handle of this.pending)clearTimeout(handle);
  this.pending.clear();this.epoch++;
  this.stage?.classList.remove('is-transitioning');
 }
 begin(){this.cancel();this.stage=document.getElementById('gameScreen');return this.epoch;}
 defer(fn,ms,epoch=this.epoch){
  const handle=setTimeout(()=>{this.pending.delete(handle);if(epoch===this.epoch)fn();},ms);
  this.pending.add(handle);return handle;
 }
 recover(render,isCurrent,attempt=1){
  if(!isCurrent()||attempt>4)return;
  this.defer(()=>{if(!isCurrent())return;try{render();}catch(error){console.warn('Quiz render retry',attempt,error);this.recover(render,isCurrent,attempt+1);}},Math.min(1200,150*attempt));
 }
 afterAnswer({correct,isCurrent,advance,retry}){
  this.cancel();this.stage=document.getElementById('gameScreen');
  this.defer(()=>{
   if(!isCurrent())return;
   this.stage?.classList.add('is-transitioning');
   this.defer(()=>{
    if(!isCurrent()){this.stage?.classList.remove('is-transitioning');return;}
    try{advance();}catch(error){console.warn('Quiz advance recovered',error);if(retry)this.recover(retry.render,retry.isCurrent);}
    finally{this.stage?.classList.remove('is-transitioning');}
   },CONFIG.TRANSITION_DURATION);
  },correct?CONFIG.DWELL_TIME_CORRECT:CONFIG.DWELL_TIME_WRONG);
 }
}
let sample=null,stage=null,question=null,answers=null,progress=null,timer=null,counter=null;
let measuredOwner=null,measuredWidth=0,measuredFont='',lastTimer='',lastProgress='';
function markGaps(host){
 const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('.gap-slot,.ql-answer,.gap-filled')&&/_{2,}/.test(n.textContent))nodes.push(n);}
 for(const node of nodes){const parts=node.textContent.split(/(_{2,})/),frag=document.createDocumentFragment();for(const text of parts){if(/^_{2,}$/.test(text)){const gap=document.createElement('span');gap.className='gap-slot';gap.textContent=text;gap.setAttribute('aria-label','Hueco por completar');frag.append(gap);}else frag.append(document.createTextNode(text));}node.replaceWith(frag);}
 host.querySelectorAll('.ql-answer').forEach(x=>x.classList.add('gap-filled'));
}
function mount(){
 stage=document.getElementById('gameScreen');question=document.getElementById('questionText');answers=document.getElementById('answers');
 if(!stage||!question||!answers)return false;
 document.body.dataset.quizErgonomics='1.0.0';stage.classList.add('quiz-stage');
 const card=question.closest('.question')||question.parentElement;card.classList.add('prompt-card');question.classList.add('prompt-text');answers.classList.add('options-list');
 if(!document.getElementById('qe-counter')){
  const meta=document.createElement('div');meta.className='prompt-meta';
  counter=document.createElement('span');counter.id='qe-counter';meta.append(counter);card.prepend(meta);
  progress=document.createElement('div');progress.className='progress-track';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Progreso de la sesión');card.before(progress);
  timer=document.createElement('section');timer.className='timer-footer';timer.innerHTML='<div class="timer-header"><span>Tiempo para responder</span><strong class="timer-number"></strong></div><div class="timer-bar-bg"><div class="timer-bar-fill"></div></div>';answers.after(timer);
 }else{counter=document.getElementById('qe-counter');progress=stage.querySelector('.progress-track');timer=stage.querySelector('.timer-footer');}
 return true;
}
function strings(row){
 const prompts=[row?.q,row?.prompt,row?.text,row?.sentence,...(row?.contexts||[])].filter(x=>typeof x==='string');
 const opts=row?.display||row?.a||row?.options||[];
 const options=opts.map(x=>typeof x==='string'?x:x?.text).filter(x=>typeof x==='string');
 for(const k of ['pv','en','correct'])if(typeof row?.[k]==='string')options.push(row[k]);
 return {prompts,options};
}
function reserve(s){
 const width=Math.round(question.closest('.prompt-card').getBoundingClientRect().width);
 const font=getComputedStyle(question).font;
 if(width<50||(s.owner===measuredOwner&&width===measuredWidth&&font===measuredFont))return;
 measuredOwner=s.owner;measuredWidth=width;measuredFont=font;
 const rows=(s.questions||[]).map(strings),prompts=rows.flatMap(x=>x.prompts),opts=rows.flatMap(x=>x.options);

 const longest=opts.slice().sort((a,b)=>b.length-a.length)[0]||'';
 const box=question.closest('.prompt-card').cloneNode(true);box.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));box.classList.add('qe-measure');box.replaceChildren();box.style.cssText='position:absolute!important;left:-10000px!important;top:0!important;visibility:hidden!important;pointer-events:none!important;min-height:0!important;height:auto!important;width:'+width+'px!important;';
 const meta=document.createElement('div');meta.className='prompt-meta';meta.textContent='15 / 15';
 const text=question.cloneNode(false);text.removeAttribute('id');text.className='prompt-text';box.append(meta,text);stage.append(box);
 let height=152;
 for(const prompt of prompts){for(const value of [prompt,prompt.replace(/_{2,}/g,longest)]){
  text.textContent=value;markGaps(text);height=Math.max(height,Math.ceil(box.getBoundingClientRect().height));
 }}
 // Reserve room for feedback in exercises without a literal gap; never clip long text.
 text.textContent=longest;const extra=text.getBoundingClientRect().height;height+=Math.min(100,Math.ceil(extra)+20);
 stage.style.setProperty('--qe-prompt-height',Math.ceil(height+8)+'px');
 box.remove();
 const button=document.createElement('button');button.className='answer option-btn qe-measure';button.type='button';button.tabIndex=-1;button.setAttribute('aria-hidden','true');
 button.style.cssText='position:absolute!important;left:-10000px!important;visibility:hidden!important;pointer-events:none!important;min-height:0!important;height:auto!important;width:'+answers.getBoundingClientRect().width+'px!important;';
 const badge=document.createElement('span');badge.className='option-badge';badge.dataset.letter='A';
 const label=document.createElement('span');label.className='option-label';button.append(badge,label);answers.append(button);
 let optionHeight=56;for(const value of new Set(opts)){label.textContent=value;optionHeight=Math.max(optionHeight,Math.ceil(button.getBoundingClientRect().height));}
 stage.style.setProperty('--qe-option-height',optionHeight+'px');button.remove();
}
function sync(){
 if(!sample||!stage||stage.classList.contains('hidden')||stage.hidden)return;
 const s=sample();if(!s?.owner)return;
 answers.classList.add('options-list');
 reserve(s);markGaps(question);
 const buttons=[...answers.querySelectorAll(':scope > button.answer')];
 buttons.forEach((button,i)=>{
  button.classList.add('option-btn');button.dataset.index=String(i);
  if(!button.querySelector('.option-label')){
   const label=document.createElement('span');label.className='option-label';label.textContent=button.textContent;
   const badge=document.createElement('span');badge.className='option-badge';badge.setAttribute('aria-hidden','true');badge.dataset.letter='ABCD'[i]||'';
   button.replaceChildren(badge,label);
  }
  button.classList.toggle('is-correct',button.classList.contains('good'));
  button.classList.toggle('is-wrong',button.classList.contains('bad'));
 });
 answers.classList.toggle('is-locked',!!s.locked);
 const total=Math.max(1,Number(s.total)||15),done=(s.results||[]).slice(0,total),key=JSON.stringify([total,done,s.index,s.locked]);
 if(key!==lastProgress){
  lastProgress=key;progress.replaceChildren();
  for(let i=0;i<total;i++){const pill=document.createElement('div');pill.className='progress-pill';const result=done[i];pill.classList.toggle('is-correct',result===true);pill.classList.toggle('is-wrong',result===false);pill.classList.toggle('is-current',i===s.index&&!s.locked);pill.setAttribute('aria-label','Pregunta '+(i+1)+': '+(result===true?'acierto':result===false?'error':i===s.index?'actual':'pendiente'));progress.append(pill);}
  progress.style.gridTemplateColumns='repeat('+total+',minmax(0,1fr))';progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(total));progress.setAttribute('aria-valuenow',String(done.length));
 }
 counter.textContent=s.study?'Pregunta '+(s.index+1):(Math.min(total,s.index+1)+' / '+total);
 const limit=Number(s.limit)||15,left=Math.max(0,Math.min(limit,Number(s.remaining)||0)),reading=!!s.reading;
 const label=reading?'Leer antes de responder':s.paused?'Tiempo en pausa':'Tiempo para responder',number=reading?'Lectura previa':Math.ceil(left)+' s';
 const timerKey=[label,number,Math.round(left*10),s.locked].join('|');
 if(timerKey!==lastTimer){
  lastTimer=timerKey;timer.querySelector('.timer-header span').textContent=label;timer.querySelector('strong').textContent=number;
  const fill=timer.querySelector('.timer-bar-fill');fill.style.width=(reading?100:100*left/limit)+'%';fill.classList.toggle('is-critical',!reading&&left<=4);
  const track=timer.querySelector('.timer-bar-bg');track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(limit));track.setAttribute('aria-valuenow',String(reading?limit:left));
 }
}
function bind(getSample){sample=getSample;if(!mount())return;new MutationObserver(()=>{if(!stage.classList.contains('hidden'))sync();}).observe(answers,{childList:true});new MutationObserver(()=>markGaps(question)).observe(question,{childList:true});window.addEventListener('resize',()=>{measuredWidth=0;sync();},{passive:true});setInterval(sync,100);sync();}
// Load the actual question/answer weights before the first timed screen.
const ready=document.fonts?Promise.all(['500 19px Roboto','600 19px Roboto','700 19px Roboto'].map(font=>document.fonts.load(font))).catch(()=>{}):Promise.resolve();
window.QuizFlowController=QuizFlowController;
window.QuizErgonomics=Object.freeze({version:'1.0.0',CONFIG,bind,sync,ready});
})();