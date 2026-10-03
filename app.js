const APP_VERSION='2.0.0';
const STORAGE_KEY='pizarras_state_v1';
const READ_FIRST_KEY='pizarras_read_first_v1';
const TIME_LIMIT=15;
const QUICK_SIZE=15;
const BASE_BANK=window.PIZARRAS_BANK||[];
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const DAY=86400000;
const FILTERS={Adaptive:null,Speaking:['Speaking'],Connectors:['Connectors'],Grammar:['Grammar','Corrections'],Vocabulary:['Vocabulary','Word formation'],Phrasal:['Phrasal verbs'],Mixed:null};
const FILTER_LABELS={Adaptive:'Adaptativo',Speaking:'Speaking',Connectors:'Conectores',Grammar:'Gramática',Vocabulary:'Vocabulario',Phrasal:'Phrasal',Mixed:'Mixto'};
let activeFilter='Adaptive';
let state=null,session=null,current=null,timerHandle=null,classHandle=null,revealHandle=null,deadline=0,locked=false,audioCtx=null,currentPreReadMs=0;
let readFirstMode=(()=>{try{return localStorage.getItem(READ_FIRST_KEY)!=='0';}catch(e){return true;}})();

function validQuestion(q){return !!q&&typeof q.id==='string'&&typeof q.category==='string'&&typeof q.concept==='string'&&typeof q.prompt==='string'&&typeof q.correct==='string'&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options.map(x=>String(x).trim().toLowerCase())).size===4&&q.options.includes(q.correct);}
function allBank(){const map=new Map(BASE_BANK.map(q=>[q.id,q]));for(const q of state?.customItems||[])if(validQuestion(q)&&!map.has(q.id))map.set(q.id,q);return [...map.values()];}
function byId(id){return allBank().find(q=>q.id===id)||null;}
function freshItem(){return{attempts:0,correct:0,misses:0,totalTime:0,streak:0,lastSeen:0,lastCorrect:null,intervalDays:0,nextDueTs:0,lapses:0,recallStage:0,lastMode:'',masteredRewarded:false};}
function freshState(){return{version:2,level:1,sessions:0,classSessions:0,quickSessions:0,answers:0,correct:0,studySec:0,points:0,items:{},history:[],answerHistory:[],customItems:[],pendingPlan:null,planHistory:[]};}
function normalize(){
  state=Object.assign(freshState(),state||{});state.version=2;
  state.history=Array.isArray(state.history)?state.history:[];state.answerHistory=Array.isArray(state.answerHistory)?state.answerHistory:[];state.customItems=Array.isArray(state.customItems)?state.customItems.filter(validQuestion):[];state.planHistory=Array.isArray(state.planHistory)?state.planHistory:[];
  if(!state.items||typeof state.items!=='object')state.items={};
  for(const q of allBank())state.items[q.id]=Object.assign(freshItem(),state.items[q.id]||{});
  state.classSessions=Number(state.classSessions)||state.history.filter(x=>x?.type==='study').length;
  state.quickSessions=Number(state.quickSessions)||state.history.filter(x=>x?.type==='quick').length;
  state.sessions=Math.max(Number(state.sessions)||0,state.classSessions+state.quickSessions);
}
function load(){try{state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||freshState();normalize();}catch(e){state=freshState();normalize();}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function st(q){if(!state.items[q.id])state.items[q.id]=freshItem();return state.items[q.id];}
function itemAccuracy(q){const m=st(q);return m.attempts?m.correct/m.attempts:0;}
function mastery(q){const m=st(q);if(!m.attempts)return 0;const acc=itemAccuracy(q),exp=Math.min(1,m.attempts/8),avg=m.totalTime/Math.max(1,m.attempts),speed=clamp((TIME_LIMIT-avg)/TIME_LIMIT,0,1),recall=clamp((m.recallStage||0)/6,0,1),retention=clamp((m.intervalDays||0)/16,0,1);return Math.round((acc*.46+exp*.17+speed*.13+recall*.14+retention*.10)*100);}
function mastered(q){const m=st(q);return m.attempts>=6&&mastery(q)>=80&&(m.intervalDays||0)>=4;}
function isLeech(q){const m=st(q);return m.attempts>=4&&m.misses>=3&&itemAccuracy(q)<.62;}
function dueNow(q,now=Date.now()){const m=st(q);return m.attempts>0&&(!m.nextDueTs||m.nextDueTs<=now);}
function coverage(){const b=allBank();return b.length?Math.round(b.filter(q=>st(q).attempts).length/b.length*100):0;}
function globalMastery(){const b=allBank();return b.length?Math.round(b.reduce((n,q)=>n+mastery(q),0)/b.length):0;}
function recent(n=80){return state.answerHistory.slice(-n);}
function recentAccuracy(){const h=recent();return h.length?Math.round(h.filter(x=>x.ok).length/h.length*100):null;}
function avgResponse(){const h=recent();return h.length?mean(h.map(x=>Number(x.time)||0)):null;}
function dueCount(){return allBank().filter(q=>dueNow(q)).length;}
function leechCount(){return allBank().filter(isLeech).length;}
function fmtTime(s){s=Math.max(0,Math.round(Number(s)||0));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),r=s%60;return h?`${h}h ${String(m).padStart(2,'0')}m`:m?`${m}m ${r}s`:`${r}s`;}
function fmtClock(sec){sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function readFirstDelayMs(text,mode='RECOGNITION'){const words=String(text||'').trim().split(/\s+/).filter(Boolean).length,base=Math.max(3000,Math.min(4800,3000+Math.max(0,words-8)*90));if(mode==='MEMORY')return Math.max(6500,base+1800);if(mode==='RECALL')return Math.max(5400,base+1100);return Math.round(base);}
function syncReadFirstButton(){const b=$('readFirstToggle');if(!b)return;b.setAttribute('aria-pressed',readFirstMode?'true':'false');b.textContent=readFirstMode?'MODO · LEER PRIMERO · SÍ':'MODO · TODO JUNTO · NORMAL';}
function toggleReadFirstMode(){readFirstMode=!readFirstMode;try{localStorage.setItem(READ_FIRST_KEY,readFirstMode?'1':'0');}catch(e){}syncReadFirstButton();}

function categoryStats(){
  const out=[];for(const cat of [...new Set(allBank().map(q=>q.category))]){const qs=allBank().filter(q=>q.category===cat),seen=qs.filter(q=>st(q).attempts),due=qs.filter(q=>dueNow(q)).length,leeches=qs.filter(isLeech).length,m=qs.length?mean(qs.map(mastery)):0,acc=seen.length?mean(seen.map(itemAccuracy)):0;out.push({category:cat,total:qs.length,seen:seen.length,due,leeches,mastery:m,accuracy:acc});}return out;
}
function recommendedFocus(){
  if(state.pendingPlan?.focusCategories?.length)return state.pendingPlan.focusCategories;
  const rows=categoryStats().map(x=>({...x,priority:(100-x.mastery)/12+x.due*.55+x.leeches*1.8+(x.category==='Speaking'?2.4:0)})).sort((a,b)=>b.priority-a.priority);
  return rows.slice(0,2).map(x=>x.category);
}
function lastStudyAt(){const row=[...state.history].reverse().find(x=>x?.type==='study');return row?.at||0;}
function recommendedSession(){
  if(state.pendingPlan){const mins=clamp(Number(state.pendingPlan.durationMinutes)||8,5,20);return{minutes:mins,focus:state.pendingPlan.focusCategories?.length?state.pendingPlan.focusCategories:recommendedFocus(),reason:`Plan externo listo · ${state.pendingPlan.title||'sesión personalizada'}`,external:true};}
  let minutes=8;const due=dueCount(),leech=leechCount(),acc=recentAccuracy(),last=lastStudyAt();
  if(due>=40)minutes+=3;else if(due>=18)minutes+=2;else if(due>=7)minutes+=1;
  if(leech>=6)minutes+=2;else if(leech>=3)minutes+=1;
  if(acc!=null&&acc<78)minutes+=1;else if(acc!=null&&acc>=94&&due<10)minutes-=1;
  if(last){const gap=(Date.now()-last)/DAY;if(gap>=5)minutes+=2;else if(gap>=2)minutes+=1;}
  if(state.classSessions<3)minutes=Math.max(minutes,8);
  minutes=clamp(Math.round(minutes),6,15);const focus=activeFilter==='Mixed'?[]:(activeFilter!=='Adaptive'&&FILTERS[activeFilter]?FILTERS[activeFilter]:recommendedFocus());
  const bits=[];bits.push(due?`${due} revisiones pendientes`:'sin deuda fuerte de repaso');if(leech)bits.push(`${leech} leech${leech===1?'':'es'}`);if(acc!=null)bits.push(`${acc}% de precisión reciente`);
  return{minutes,focus,reason:bits.join(' · '),external:false};
}
function poolForFilter(){const bank=allBank(),cats=FILTERS[activeFilter];if(activeFilter==='Adaptive')return bank;if(cats)return bank.filter(q=>cats.includes(q.category));return bank;}
function renderFilters(){const host=$('filters');host.innerHTML='';Object.keys(FILTERS).forEach(name=>{const b=document.createElement('button');b.className='chip'+(name===activeFilter?' active':'');b.textContent=FILTER_LABELS[name].toUpperCase();b.onclick=()=>{activeFilter=name;renderHome();};host.appendChild(b);});}
function renderHome(){
  const rec=recommendedSession(),acc=recentAccuracy(),avg=avgResponse(),bank=allBank();
  $('startLevel').textContent='Pizarras 2.0';$('startMeta').textContent=`${bank.length} ejercicios activos · ${BASE_BANK.length} anclados a Sara · ${state.customItems.length} variaciones añadidas`;
  $('recommendedClass').textContent=`${rec.minutes} MIN`;$('classFocus').textContent=`Foco: ${rec.focus.map(x=>FILTER_LABELS[x]||x).join(' + ')||'repaso adaptativo'}`;$('classReason').textContent=rec.reason;
  $('startClassBtn').textContent=`EMPEZAR CLASE · ${rec.minutes} MIN`;
  $('coverageText').textContent=coverage()+'%';$('coverageFill').style.width=coverage()+'%';$('masteryText').textContent=globalMastery()+'%';$('masteryFill').style.width=globalMastery()+'%';$('startAccuracy').textContent=acc==null?'-':acc+'%';$('startAvg').textContent=avg==null?'-':avg.toFixed(1)+'s';$('startDue').textContent=dueCount();$('startMastered').textContent=bank.filter(mastered).length+'/'+bank.length;$('startStudy').textContent=fmtTime(state.studySec);$('startLeeches').textContent=leechCount();
  const ps=$('planStatus');if(state.pendingPlan){ps.classList.remove('hidden');ps.classList.add('plan-active');ps.textContent=`PLAN ACTIVO · ${state.pendingPlan.title||'Sesión personalizada'} · ${rec.minutes} min${state.pendingPlan.itemIds?.length?` · ${state.pendingPlan.itemIds.length} objetivos`:''}`;}else{ps.classList.add('hidden');ps.classList.remove('plan-active');}
  renderFilters();syncReadFirstButton();
}
function show(id){['startScreen','gameScreen','endScreen','statsScreen','jsonScreen'].forEach(x=>$(x).classList.toggle('hidden',x!==id));scrollTo(0,0);}

function weightedPick(pool,weightFn){const ws=pool.map(q=>Math.max(.01,weightFn(q))),sum=ws.reduce((a,b)=>a+b,0);let r=Math.random()*sum;for(let i=0;i<pool.length;i++){r-=ws[i];if(r<=0)return pool[i];}return pool.at(-1);}
function studyPool(){
  let pool=allBank();
  if(session.planItemIds?.length){const ids=new Set(session.planItemIds);const p=pool.filter(q=>ids.has(q.id));if(p.length)pool=p;}
  else if(session.planTitle&&session.focusCategories?.length){const preferred=pool.filter(q=>session.focusCategories.includes(q.category));if(preferred.length)pool=preferred;}
  else if(activeFilter!=='Adaptive'){pool=poolForFilter();}
  else if(session.focusCategories?.length){const preferred=pool.filter(q=>session.focusCategories.includes(q.category));if(preferred.length>=20)pool=preferred;}
  return pool;
}
function studyWeight(q){
  const m=st(q),now=Date.now();let w=1;
  if(!m.attempts)w+=3.2;else{w+=(100-mastery(q))/16;if(dueNow(q,now))w+=6+Math.min(5,Math.max(0,(now-(m.nextDueTs||now))/DAY));if(isLeech(q))w+=5;if(m.lastCorrect===false)w+=2.5;}
  if(session.focusCategories?.includes(q.category))w+=2.2;if(activeFilter==='Adaptive'&&q.category==='Speaking')w+=1.1;
  if(session.recentIds.slice(-4).includes(q.id))w*=.06;if(session.recentConcepts.slice(-2).includes(q.concept))w*=.45;
  return w;
}
function pickStudyQuestion(){
  const dueRelearn=session.relearnQueue.filter(x=>x.at<=session.questionCount&&!session.recentIds.slice(-2).includes(x.id));if(dueRelearn.length){const pick=dueRelearn[0];session.relearnQueue=session.relearnQueue.filter(x=>x!==pick);const q=byId(pick.id);if(q)return q;}
  let pool=studyPool();if(!pool.length)pool=allBank();const fresh=pool.filter(q=>!session.recentIds.slice(-4).includes(q.id));return weightedPick(fresh.length?fresh:pool,studyWeight);
}
function buildQuickQueue(){const pool=[...poolForFilter()],out=[];while(out.length<QUICK_SIZE&&pool.length){const q=weightedPick(pool,x=>1+(st(x).attempts?0:1)+(100-mastery(x))/35+Math.min(2,st(x).misses*.25));out.push(q);pool.splice(pool.indexOf(q),1);}return out;}
function chooseRetrievalMode(q){if(session.type==='quick')return'RECOGNITION';const m=st(q),ms=mastery(q),acc=itemAccuracy(q);if(q.category==='Speaking'&&m.attempts>=2&&ms>=48&&Math.random()<.62)return'MEMORY';if(m.attempts>=2&&acc>=.58&&Math.random()<clamp(.30+(m.recallStage||0)*.08,.30,.78))return'RECALL';return'RECOGNITION';}
function displayPrompt(q,mode){return mode!=='RECOGNITION'&&q.recallPrompt?q.recallPrompt:q.prompt;}
function renderSegments(){const host=$('segments');host.innerHTML='';const total=session.type==='quick'?15:10;for(let i=0;i<total;i++){const d=document.createElement('i');d.className='seg';host.appendChild(d);}updateSegments();}
function updateSegments(){const els=[...$('segments').children];if(!session)return;if(session.type==='quick'){els.forEach((e,i)=>e.classList.toggle('on',i<session.index));}else{const p=session.durationSec?clamp((Date.now()-session.startedAt)/(session.durationSec*1000),0,1):0,filled=Math.round(p*els.length);els.forEach((e,i)=>e.classList.toggle('on',i<filled));}}
function updateHud(){const study=session.type==='study';$('qMode').textContent=study?'CLASS':'QUICK';$('qIndex').textContent=session.questionCount+1;$('qTotal').textContent=study?'STUDY':'/ 15';$('pointsHud').textContent=session.points+' PTS';$('comboHud').textContent='COMBO ×'+session.combo;$('levelHud').textContent=study?'ADAPTIVE':`L${state.level}`;$('classClock').classList.toggle('hidden',!study);if(!study)$('classClock').textContent='';}
function startClassClock(){clearInterval(classHandle);if(session.type!=='study')return;updateClassClock();classHandle=setInterval(updateClassClock,250);}
function updateClassClock(){if(!session||session.type!=='study')return;const left=Math.max(0,(session.endsAt-Date.now())/1000);$('classClock').textContent=left>0?fmtClock(left):'FINISH';updateSegments();if(left<=0){session.timeUp=true;$('classClock').textContent='FINAL';}}
function startAnswerTimer(){deadline=Date.now()+TIME_LIMIT*1000;tick();clearInterval(timerHandle);timerHandle=setInterval(tick,50);}
function tick(){const left=Math.max(0,deadline-Date.now()),sec=left/1000,pct=left/(TIME_LIMIT*1000)*100;$('timerText').textContent=sec.toFixed(1);$('timer').style.setProperty('--p',pct+'%');$('timer').classList.toggle('urgent',sec<=3);if(left<=0){clearInterval(timerHandle);answer(null,null,true);}}
function renderQuestion(){
  clearInterval(timerHandle);clearTimeout(revealHandle);revealHandle=null;currentPreReadMs=0;locked=false;
  if(session.type==='quick'&&session.index>=session.queue.length)return finishSession(false);
  if(session.type==='study'&&session.timeUp&&session.questionCount>=session.minQuestions)return finishSession(false);
  current=session.type==='quick'?session.queue[session.index]:pickStudyQuestion();if(!current)return finishSession(false);
  const mode=chooseRetrievalMode(current);session.currentMode=mode;const prompt=displayPrompt(current,mode);session.currentPrompt=prompt;
  $('categoryLine').innerHTML=`${current.category.toUpperCase()} · ${current.concept.toUpperCase()}${mode==='RECOGNITION'?'':`<br><span class="recall-badge">${mode==='MEMORY'?'MEMORY · DI LA FRASE ANTES DE VERLA':'RECALL · RESPONDE MENTALMENTE PRIMERO'}</span>`}`;$('questionText').textContent=prompt;$('feedback').innerHTML='';
  const opts=shuffle(current.options),host=$('answers');host.innerHTML='';host.classList.toggle('read-first-hidden',readFirstMode);opts.forEach((text,i)=>{const b=document.createElement('button');b.className='answer c'+i;b.textContent=text;b.disabled=readFirstMode;b.onclick=()=>answer(text,b,false);host.appendChild(b);});
  updateHud();$('timerText').textContent=TIME_LIMIT.toFixed(1);$('timer').style.setProperty('--p','100%');$('timer').classList.remove('urgent');
  if(readFirstMode){currentPreReadMs=readFirstDelayMs(prompt,mode);const expectedSession=session,expectedQuestion=current;revealHandle=setTimeout(()=>{if(session!==expectedSession||current!==expectedQuestion||locked)return;host.classList.remove('read-first-hidden');[...host.children].forEach(b=>b.disabled=false);revealHandle=null;startAnswerTimer();},currentPreReadMs);}else{host.classList.remove('read-first-hidden');[...host.children].forEach(b=>b.disabled=false);startAnswerTimer();}
}
function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}
function tone(freq,dur=.07,gain=.015){try{ensureAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur);}catch(e){}}
function updateSpacing(q,ok,mode,elapsed){
  const m=st(q),now=Date.now();m.lastSeen=now;m.lastCorrect=ok;m.lastMode=mode;
  if(!ok){m.lapses=(m.lapses||0)+1;m.recallStage=Math.max(0,(m.recallStage||0)-1);m.intervalDays=.25;m.nextDueTs=now+6*3600000;return;}
  let stage=m.recallStage||0;if(mode==='MEMORY'||mode==='RECALL')stage=Math.min(6,stage+1);else if(m.streak>=2&&elapsed<=7)stage=Math.min(4,stage+1);m.recallStage=stage;
  const table=[1,1,2,4,8,16,30];let interval=table[Math.min(stage,table.length-1)];if(elapsed>9)interval=Math.max(1,Math.round(interval*.7));m.intervalDays=interval;m.nextDueTs=now+interval*DAY;
}
function answer(text,button,timeout){
  if(locked)return;locked=true;clearInterval(timerHandle);clearTimeout(revealHandle);revealHandle=null;
  const elapsed=clamp((TIME_LIMIT*1000-Math.max(0,deadline-Date.now()))/1000,0,TIME_LIMIT),ok=text===current.correct,m=st(current),mode=session.currentMode;
  m.attempts++;m.totalTime+=elapsed;state.answers++;let delta=-3;
  if(ok){m.correct++;m.streak++;state.correct++;session.correct++;session.combo++;session.bestCombo=Math.max(session.bestCombo,session.combo);delta=10+(elapsed<=5?2:0)+(mode!=='RECOGNITION'?3:0)+(session.combo===3?3:session.combo===5?5:session.combo===10?10:0);tone(880,.08,.018);}else{m.misses++;m.streak=0;session.combo=0;tone(220,.10,.018);session.errors.push({id:current.id,category:current.category,concept:current.concept,prompt:session.currentPrompt,shown:timeout?'TIME':text,correct:current.correct,explanation:current.explanation,mode});if(session.type==='study'&&!session.relearnQueue.some(x=>x.id===current.id))session.relearnQueue.push({id:current.id,at:session.questionCount+4});}
  updateSpacing(current,ok,mode,elapsed);session.points=Math.max(0,session.points+delta);state.points=Math.max(0,state.points+delta);session.times.push(elapsed);state.studySec+=(elapsed+currentPreReadMs/1000);session.questionCount++;session.recentIds.push(current.id);session.recentConcepts.push(current.concept);session.records.push({id:current.id,category:current.category,concept:current.concept,ok,time:+elapsed.toFixed(2),mode,preReadMs:currentPreReadMs,prompt:session.currentPrompt,answer:text||null,correct:current.correct,at:Date.now()});
  state.answerHistory.push({at:Date.now(),id:current.id,category:current.category,concept:current.concept,ok,time:elapsed,mode,studyType:session.type,studyMode:readFirstMode?'READ_FIRST':'STANDARD',preReadMs:currentPreReadMs,prompt:session.currentPrompt,answer:text||null,correctAnswer:current.correct,explanation:current.explanation||''});state.answerHistory=state.answerHistory.slice(-3000);save();
  [...$('answers').children].forEach(b=>{b.disabled=true;if(b.textContent===current.correct)b.classList.add('good');else b.classList.add('dim');});if(button&&!ok){button.classList.remove('dim');button.classList.add('bad');}
  $('feedback').innerHTML=`<b>${ok?'CORRECT':timeout?'TIME':'NOT QUITE'} · ${delta>0?'+':''}${delta} PTS</b>${current.explanation||''}`;updateHud();
  const expected=session,setIndex=session.index,setQuestionCount=session.questionCount;setTimeout(()=>{if(session!==expected||session.questionCount!==setQuestionCount)return;if(session.type==='quick')session.index++;if(session.type==='study'&&session.timeUp&&session.questionCount>=session.minQuestions)return finishSession(false);renderQuestion();},ok?170:340);
}
function makeStudySession(){
  const rec=recommendedSession(),plan=state.pendingPlan;return{type:'study',startedAt:Date.now(),endsAt:Date.now()+rec.minutes*60000,durationSec:rec.minutes*60,minQuestions:8,questionCount:0,index:0,correct:0,points:0,combo:0,bestCombo:0,times:[],errors:[],records:[],recentIds:[],recentConcepts:[],relearnQueue:[],focusCategories:plan?.focusCategories?.length?plan.focusCategories:rec.focus,planItemIds:plan?.itemIds||[],planTitle:plan?.title||null,planId:plan?.id||null,timeUp:false};
}
function startStudy(){try{ensureAudio();}catch(e){}session=makeStudySession();show('gameScreen');renderSegments();startClassClock();renderQuestion();}
function startQuick(){try{ensureAudio();}catch(e){}session={type:'quick',queue:buildQuickQueue(),index:0,questionCount:0,correct:0,points:0,combo:0,bestCombo:0,times:[],errors:[],records:[],recentIds:[],recentConcepts:[],relearnQueue:[],startedAt:Date.now()};show('gameScreen');renderSegments();renderQuestion();}
function medal(score){return score===15?['🥇','GOLD · 15/15']:score===14?['🟣','VIOLET · 14/15']:score===13?['🔵','BLUE · 13/15']:['',''];}
function finishSession(early=false){
  if(!session)return;clearInterval(timerHandle);clearInterval(classHandle);clearTimeout(revealHandle);revealHandle=null;
  const completed=session,answered=completed.questionCount,acc=answered?completed.correct/answered:0,avg=mean(completed.times),elapsedSec=Math.max(1,(Date.now()-completed.startedAt)/1000),beforeMastered=0;
  for(const r of completed.records){const q=byId(r.id);if(q&&mastered(q))beforeMastered++;}const consolidated=new Set(completed.records.filter(r=>{const q=byId(r.id);return r.ok&&q&&(st(q).intervalDays||0)>=4;}).map(r=>r.id)).size;
  state.sessions++;state.level=state.sessions+1;if(completed.type==='study')state.classSessions++;else state.quickSessions++;
  const row={at:Date.now(),type:completed.type,durationSec:elapsedSec,plannedSec:completed.durationSec||null,early,questions:answered,correct:completed.correct,accuracy:acc,avgTime:avg,points:completed.points,bestCombo:completed.bestCombo,filter:activeFilter,focusCategories:completed.focusCategories||[],planId:completed.planId||null,planTitle:completed.planTitle||null,consolidated,errors:completed.errors.length};state.history.push(row);state.history=state.history.slice(-600);
  if(completed.type==='study'&&state.pendingPlan){state.planHistory.push({id:state.pendingPlan.id||null,title:state.pendingPlan.title||'',completedAt:Date.now(),questions:answered,accuracy:acc});state.planHistory=state.planHistory.slice(-100);state.pendingPlan=null;}
  save();renderEnd(row,completed);show('endScreen');session=completed;
}
function renderEnd(row,completed){
  const study=row.type==='study',score=completed.correct,answered=row.questions,acc=Math.round(row.accuracy*100),avg=row.avgTime||0;
  $('endKicker').textContent=study?(row.early?'CLASE TERMINADA ANTES DE TIEMPO':'CLASE COMPLETADA'):'QUIZ RÁPIDO COMPLETADO';$('endMedal').textContent='';
  if(study){$('endScore').textContent=fmtClock(row.durationSec);$('endLine').textContent=`${answered} recuperaciones · ${acc}% · ${completed.focusCategories?.map(x=>FILTER_LABELS[x]||x).join(' + ')||'repaso adaptativo'}`;}else{const [icon,label]=medal(score);$('endScore').textContent=`${score}/${answered}`;$('endMedal').textContent=icon;$('endLine').textContent=label||'QUIZ COMPLETADO';if(score>=13){tone(score===15?1318:score===14?1046:880,.18,.025);setTimeout(()=>tone(score===15?1760:score===14?1318:1174,.2,.02),120);}}
  $('endQuestions').textContent=answered;$('endAccuracy').textContent=acc+'%';$('endAvg').textContent=avg.toFixed(1)+'s';$('endConsolidated').textContent=row.consolidated;
  const next=recommendedSession();$('nextClass').innerHTML=`<b>Siguiente clase sugerida · ${next.minutes} min</b>${next.focus.map(x=>FILTER_LABELS[x]||x).join(' + ')} · ${next.reason}`;$('continueBtn').textContent=`SIGUIENTE CLASE · ${next.minutes} MIN`;renderEndErrors(completed.errors);
}
function renderEndErrors(errors){const host=$('endErrors');if(!errors.length){host.innerHTML='<h3>Repaso</h3><div class="status">Sin errores en esta sesión.</div>';return;}host.innerHTML='<h3>Errores de esta sesión · '+errors.length+'</h3>'+errors.slice(-12).map(e=>`<div class="errorcard"><b>${escapeHtml(e.concept)} · ${escapeHtml(e.mode)}</b><p>${escapeHtml(e.prompt)}</p><p>Tu respuesta: ${escapeHtml(e.shown??'—')}</p><p><strong>Correcta:</strong> ${escapeHtml(e.correct)} · ${escapeHtml(e.explanation||'')}</p></div>`).join('');}
function abortSession(){if(!session)return;if(session.type==='study'){if(confirm('¿Terminar esta clase antes de tiempo? Se guardará lo trabajado.'))finishSession(true);}else{if(confirm('¿Salir del quiz rápido? Esta ronda no contará como completada.')){clearInterval(timerHandle);clearInterval(classHandle);clearTimeout(revealHandle);session=null;renderHome();show('startScreen');}}}
function goHome(){clearInterval(timerHandle);clearInterval(classHandle);clearTimeout(revealHandle);session=null;renderHome();show('startScreen');}

function categoryRows(){return categoryStats().map(x=>`<div class="skill"><div class="name">${escapeHtml(x.category)} · ${x.due} due</div><div class="track"><div class="fill" style="width:${Math.round(x.mastery)}%"></div></div><div class="pct">${Math.round(x.mastery)}%</div></div>`).join('');}
function weakItems(limit=16){return [...allBank()].sort((a,b)=>(dueNow(b)?1:0)-(dueNow(a)?1:0)||mastery(a)-mastery(b)||st(b).misses-st(a).misses).slice(0,limit);}
function weakRows(){return weakItems().map(q=>`<div class="skill"><div class="name">${dueNow(q)?'⏱ ':''}${isLeech(q)?'⚠ ':''}${escapeHtml(q.concept)}</div><div class="track"><div class="fill" style="width:${mastery(q)}%"></div></div><div class="pct">${mastery(q)}%</div></div>`).join('');}
function renderStats(){
  const avg=avgResponse();$('statsCoverage').textContent=coverage()+'%';$('statsMastery').textContent=globalMastery()+'%';$('statsAccuracy').textContent=(recentAccuracy()??0)+'%';$('statsDue').textContent=dueCount();$('statsClasses').textContent=state.classSessions;$('statsStudy').textContent=fmtTime(state.studySec);$('categoryStats').innerHTML=categoryRows();$('weakestStats').innerHTML=weakRows();
  const h=state.history.filter(x=>x?.type==='study').slice(-20),host=$('historyBars');host.innerHTML=h.length?h.map(x=>`<i title="${Math.round((x.accuracy||0)*100)}% · ${x.questions||0} preguntas" style="height:${Math.max(4,(x.accuracy||0)*100)}%;background:${(x.accuracy||0)>=.85?'#e7bf57':'#8fd7b0'}"></i>`).join(''):'<div class="status">Completa una clase para iniciar la gráfica.</div>';
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

function coachPayload(){
  const rec=recommendedSession(),cats=categoryStats(),weak=weakItems(24).map(q=>{const m=st(q);return{id:q.id,category:q.category,concept:q.concept,masteryPct:mastery(q),attempts:m.attempts,accuracyPct:m.attempts?+(m.correct/m.attempts*100).toFixed(1):null,misses:m.misses,recallStage:m.recallStage||0,intervalDays:m.intervalDays||0,due:dueNow(q),lastSeen:m.lastSeen||null,lastMode:m.lastMode||null};});
  const latest=state.history.at(-1)||null,recentErrors=state.answerHistory.filter(x=>!x.ok).slice(-40).map(x=>({id:x.id,category:x.category,concept:x.concept,mode:x.mode,prompt:x.prompt||null,myAnswer:x.answer??null,correctAnswer:x.correctAnswer||null,explanation:x.explanation||null,timeSec:+(Number(x.time)||0).toFixed(2),at:x.at})),recentAnswers=state.answerHistory.slice(-80).map(x=>({id:x.id,category:x.category,concept:x.concept,ok:!!x.ok,mode:x.mode||'RECOGNITION',timeSec:+(Number(x.time)||0).toFixed(2),prompt:x.prompt||null,myAnswer:x.answer??null,correctAnswer:x.correctAnswer||null,at:x.at}));
  return{schema:'PIZARRAS_STUDY_STATE_V2',task:'design_next_pizarras_study_session',appVersion:APP_VERSION,generatedAt:new Date().toISOString(),learningContract:{sourceBoundary:'Keep the curriculum anchored to Sara/Pizarras source material. New generated items should be variations or retrieval forms of anchored concepts, not unrelated generic English.',goal:'Build automatic recall and durable retention through timed study classes, spaced review and progressive retrieval.',preferredModes:['RECOGNITION','RECALL','MEMORY'],responseTimerSec:TIME_LIMIT,readFirstDefault:true},global:{baseBankSize:BASE_BANK.length,customItems:state.customItems.length,totalAnswers:state.answers,classSessions:state.classSessions,quickSessions:state.quickSessions,studyMinutes:+(state.studySec/60).toFixed(1),coveragePct:coverage(),masteryPct:globalMastery(),recentAccuracyPct:recentAccuracy(),avgResponseSec:avgResponse()==null?null:+avgResponse().toFixed(2),dueNow:dueCount(),leeches:leechCount()},recommendedNextSession:{durationMinutes:rec.minutes,focusCategories:rec.focus,reason:rec.reason},categories:cats.map(x=>({category:x.category,total:x.total,seen:x.seen,due:x.due,leeches:x.leeches,masteryPct:+x.mastery.toFixed(1),accuracyPct:+(x.accuracy*100).toFixed(1)})),weakItems:weak,latestSession:latest,recentAnswers,recentErrors,acceptedPlanSchema:{schema:'PIZARRAS_SESSION_PLAN_V2',id:'optional-string',title:'short session title',durationMinutes:'5-20',focusCategories:['Speaking'],itemIds:['existing-question-id'],newItems:[{id:'unique-id',anchorId:'existing base id recommended',category:'Speaking',concept:'...',prompt:'...',recallPrompt:'optional',correct:'...',options:['four','unique','options','...'],explanation:'...',source:'Sara/Pizarras anchored variation'}],notes:'optional'}};
}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch(e){try{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();return ok;}catch(_){return false;}}}
async function copyCoachState(){const text=JSON.stringify(coachPayload(),null,2);$('jsonText').value=text;const ok=await copyText(text);$('jsonStatus').textContent=ok?'ESTADO COPIADO · pégalo en el chat para diseñar la siguiente clase.':'Estado generado. Selecciona y copia el JSON manualmente.';}
function normalizePlan(x){const cats=[...new Set((x.focusCategories||[]).filter(c=>allBank().some(q=>q.category===c)))],ids=[...new Set((x.itemIds||[]).filter(id=>!!byId(id)))];return{schema:'PIZARRAS_SESSION_PLAN_V2',id:String(x.id||`plan-${Date.now()}`),title:String(x.title||'Sesión personalizada'),durationMinutes:clamp(Number(x.durationMinutes)||8,5,20),focusCategories:cats,itemIds:ids,notes:String(x.notes||''),createdAt:Date.now()};}
function addCustomItems(items){let added=0;for(const raw of items||[]){const q={...raw,id:String(raw.id||''),category:String(raw.category||''),concept:String(raw.concept||''),prompt:String(raw.prompt||''),correct:String(raw.correct||''),options:Array.isArray(raw.options)?raw.options.map(String):[],explanation:String(raw.explanation||''),source:String(raw.source||'Pizarras 2.0 custom'),anchorId:raw.anchorId?String(raw.anchorId):null,recallPrompt:raw.recallPrompt?String(raw.recallPrompt):undefined};const anchored=(q.anchorId&&!!byId(q.anchorId))||/(sara|pizarras|plaud)/i.test(q.source);if(!validQuestion(q)||byId(q.id)||!anchored)continue;state.customItems.push(q);state.items[q.id]=freshItem();added++;}return added;}
function applyJson(){
  try{const x=JSON.parse($('jsonText').value);let added=0,plan=null;if(x.schema==='PIZARRAS_PACK_V2'){added=addCustomItems(x.items||x.newItems||[]);if(x.plan)plan=normalizePlan(x.plan);}else if(x.schema==='PIZARRAS_SESSION_PLAN_V2'){added=addCustomItems(x.newItems||[]);plan=normalizePlan(x);}else throw new Error('Schema no compatible');if(plan)state.pendingPlan=plan;save();$('jsonStatus').textContent=`JSON APLICADO · ${added} variaciones nuevas${plan?` · plan: ${plan.title} · ${plan.durationMinutes} min`:''}`;renderHome();}catch(e){$('jsonStatus').textContent='JSON NO VÁLIDO · usa PIZARRAS_SESSION_PLAN_V2 o PIZARRAS_PACK_V2.';}
}
function clearPlan(){state.pendingPlan=null;save();$('jsonStatus').textContent='Plan pendiente eliminado. El scheduler local vuelve a decidir la siguiente clase.';renderHome();}
function openJson(){const rec=recommendedSession();$('jsonStatus').textContent=state.pendingPlan?`PLAN ACTIVO · ${state.pendingPlan.title} · ${state.pendingPlan.durationMinutes} min`:`Sin plan externo · scheduler local: ${rec.minutes} min · ${rec.focus.join(' + ')}`;$('jsonText').value='';show('jsonScreen');}
async function copyLatestSession(){const payload=coachPayload(),text=JSON.stringify(payload,null,2),ok=await copyText(text);$('copySessionBtn').textContent=ok?'JSON COPIADO ✓':'COPIA MANUAL';setTimeout(()=>$('copySessionBtn').textContent='COPIAR JSON',1400);}

function exportProgress(){const blob=new Blob([JSON.stringify({app:'pizarras',version:APP_VERSION,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pizarras-2-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function importFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);state=x.state||x;normalize();save();renderHome();}catch(e){alert('No se pudo importar este backup de Pizarras.');}};r.readAsText(file);}
function reset(){if(!confirm('¿Resetear todo el progreso de Pizarras?'))return;localStorage.removeItem(STORAGE_KEY);load();renderHome();}

load();renderHome();
$('startClassBtn').onclick=startStudy;$('quickBtn').onclick=startQuick;$('readFirstToggle').onclick=toggleReadFirstMode;$('statsBtn').onclick=()=>{renderStats();show('statsScreen');};$('statsBackBtn').onclick=goHome;$('jsonBtn').onclick=openJson;$('jsonBackBtn').onclick=goHome;$('copyStateBtn').onclick=copyCoachState;$('applyPlanBtn').onclick=applyJson;$('clearPlanBtn').onclick=clearPlan;$('continueBtn').onclick=startStudy;$('copySessionBtn').onclick=copyLatestSession;$('homeBtn').onclick=goHome;$('abortBtn').onclick=abortSession;$('exportBtn').onclick=exportProgress;$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=e=>importFile(e.target.files[0]);$('resetBtn').onclick=reset;
