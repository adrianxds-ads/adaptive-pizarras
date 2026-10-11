/* Pure selection policy for Classroom B2 v3: novelty-first, variety-constrained, recover errors without loops. */
(function(root){
'use strict';
const MAX_ANSWER_REPEAT_WINDOW=10;
const mix=(arr)=>arr[Math.floor(Math.random()*arr.length)];
const last=(xs,n)=>(xs||[]).slice(-n);
const lemma=q=>String(q.correct||'').trim().toLocaleLowerCase();
function chooseQuestion(bank,state,session,now=Date.now()){
  const done=new Set(session.seenInClass||[]);
  const history=last(state.answerHistory,80);
  const avoidRecent=new Set(last(history,28).filter(r=>r.ok).map(r=>r.id));
  const avoidConcepts=new Set(last(session.recentConcepts,6));
  const avoidAnswers=new Set(last(session.recentAnswers,MAX_ANSWER_REPEAT_WINDOW));
  const counts=session.categoryCounts||{};
  const lessons=Number(session.lesson)||1;
  const near=new Set([lessons,lessons%12+1,(lessons+10)%12+1]);
  const newItems=bank.filter(q=>q.lesson);
  const possible=bank.filter(q=>!done.has(q.id));
  if(!possible.length)return null;
  // After a class has introduced a topic, bring in neighbours rather than recycle it.
  const seenCore=(session.seenInClass||[]).filter(id=>newItems.some(q=>q.id===id&&q.lesson===lessons)).length;
  const coreAvailable=seenCore<9;
  const curated=possible.filter(q=>q.lesson&&(coreAvailable?near.has(q.lesson):true));
  const legacy=possible.filter(q=>!q.lesson);
  const desiredCurated=0.72;
  const curatedSoFar=(session.curatedCount||0)/Math.max(1,session.questionCount||0);
  let pool=curated.length&&(curatedSoFar<desiredCurated||!legacy.length)?curated:legacy.length?legacy:curated;
  if(!pool.length)pool=possible;
  const score=q=>{
    const m=state.items?.[q.id]||{}, attempts=m.attempts||0;
    const recentClass=last(session.recentIds,14).includes(q.id);
    if(recentClass)return 0;
    let s=1.0+(attempts===0?3:0)+(m.lastCorrect===false?0.85:0);
    if(attempts>0&&m.nextDueTs&&m.nextDueTs<=now)s+=0.85;
    if(avoidRecent.has(q.id))s*=0.12;
    if(avoidConcepts.has(q.concept))s*=0.02;
    if(avoidAnswers.has(lemma(q)))s*=0.02;
    s*=1/(1+Math.max(0,(counts[q.category]||0)-Math.min(...Object.values(counts).concat(0)))*0.22);
    if(q.lesson===lessons)s*=coreAvailable?2.4:0.6;
    else if(q.lesson&&near.has(q.lesson))s*=1.4;
    if(q.concept==='do vs make')s*=0.4;
    // A tutor plan may suggest a focus but can never restrict the entire class to a handful of items.
    if(session.planItemIds?.includes(q.id))s*=1.25;
    if(session.focusCategories?.includes(q.category))s*=1.15;
    return Math.max(0.0001,s);
  };
  // Strict filters first; progressively relax when a small category runs out.
  const filters=[
    q=>!avoidConcepts.has(q.concept)&&!avoidAnswers.has(lemma(q))&&!avoidRecent.has(q.id),
    q=>!avoidConcepts.has(q.concept)&&!avoidAnswers.has(lemma(q)),
    q=>!avoidConcepts.has(q.concept),
    q=>true
  ];
  let candidates=[];
  for(const filter of filters){candidates=pool.filter(filter);if(candidates.length>=3)break;}
  if(!candidates.length)candidates=pool;
  let total=0;const weights=candidates.map(q=>(total+=score(q),score(q)));
  if(total<=0)return mix(candidates);
  let ticket=Math.random()*total;
  for(let i=0;i<candidates.length;i++){ticket-=weights[i];if(ticket<=0)return candidates[i];}
  return candidates.at(-1);
}
function canRetry(q,session){
  const ids=session.retriedIds||[];
  return q&&!ids.includes(q.id)&&!last(session.recentIds,10).includes(q.id)&&!last(session.recentConcepts,6).includes(q.concept);
}
root.ClassroomRotation=Object.freeze({chooseQuestion,canRetry});
})(window);
