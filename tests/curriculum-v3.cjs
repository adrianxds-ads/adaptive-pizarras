const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={window:{}};
for(const file of ['questions.js','curriculum-v3.js','rotation-v3.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modern=sandbox.window.CLASSROOM_V3_BANK,legacy=sandbox.window.PIZARRAS_BANK;
const lessons=sandbox.window.CLASSROOM_V3_LESSONS,policy=sandbox.window.ClassroomRotation;
assert(fs.readFileSync('learning-json-v3.js','utf8').includes("pizarras:'classroom_b2_state_v3'"),'JSON exporter must use v3 state');
assert.equal(modern.length,144);
assert.equal(lessons.length,12);
assert(lessons.every(l=>l.questions===12));
const bank=[...modern,...legacy.filter(q=>q.concept!=='do vs make'||['dm-do-0','dm-do-3','dm-do-17','dm-make-0','dm-make-6','dm-make-10','dm-make-18','dm-make-20'].includes(q.id))];
const ids=new Set();
for(const q of bank){
  assert(!ids.has(q.id),'Duplicate '+q.id);ids.add(q.id);
  assert(q.category&&q.concept&&q.prompt&&q.correct&&q.explanation,'Missing field '+q.id);
  assert.equal(q.options.length,4);assert(q.options.includes(q.correct));
  assert.equal(new Set(q.options.map(s=>s.trim().toLowerCase())).size,4,'Options duplicate '+q.id);
}
const state={items:{},answerHistory:[]},unique=new Set(),summary=[];
for(let classNumber=1;classNumber<=12;classNumber++){
 const session={lesson:classNumber,questionCount:0,seenInClass:[],recentIds:[],recentConcepts:[],recentAnswers:[],categoryCounts:{},curatedCount:0,planItemIds:['pv-take-over'],focusCategories:['Phrasal verbs']};
 const chosen=[];
 for(let i=0;i<24;i++){
  const q=policy.chooseQuestion(bank,state,session);
  assert(q,'No item');
  assert(!session.seenInClass.includes(q.id),'Same question repeated within class '+classNumber);
  chosen.push(q);
  unique.add(q.id);
  session.seenInClass.push(q.id);session.recentIds.push(q.id);
  session.recentConcepts.push(q.concept);session.recentAnswers.push(q.correct.toLowerCase());
  session.categoryCounts[q.category]=(session.categoryCounts[q.category]||0)+1;
  if(q.lesson)session.curatedCount++;
  session.questionCount++;
  const st=state.items[q.id]||{attempts:0,correct:0,misses:0};
  st.attempts++;st.correct++;st.lastCorrect=true;state.items[q.id]=st;
  state.answerHistory.push({id:q.id,ok:true,concept:q.concept});
 }
 const distinct=new Set(chosen.map(q=>q.correct.toLowerCase())).size;
 assert(distinct>=16,'Insufficient answer variety in class '+classNumber+': '+distinct);
 summary.push({lesson:classNumber,uniqueItems:new Set(chosen.map(q=>q.id)).size,distinctAnswers:distinct,curated:session.curatedCount});
}
assert(unique.size>170,'Poor across-class rotation: '+unique.size);
const session={retriedIds:[],recentIds:[],recentConcepts:[]};
assert(policy.canRetry(modern[0],session));
session.retriedIds.push(modern[0].id);
assert(!policy.canRetry(modern[0],session));
console.log('PASS: '+bank.length+' valid items; '+unique.size+' unique items across 12 classes / 288 questions.');
console.log(JSON.stringify(summary));
