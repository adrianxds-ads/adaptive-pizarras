const vm=require('vm'),fs=require('fs'),assert=require('assert');let now=1000000,fail=false;
const data=new Map(),backup=new Map();const el={classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},children:[]};
const ctx=vm.createContext({window:{PIZARRAS_BANK:[]},document:{getElementById(){return el}},localStorage:{getItem:k=>data.get(k),setItem(k,v){if(fail)throw Error('quota');data.set(k,v)},removeItem:k=>data.delete(k)},sessionStorage:{getItem:k=>backup.get(k),setItem:(k,v)=>backup.set(k,v),removeItem:k=>backup.delete(k)},Date:class extends Date{static now(){return now}},console,alert(){},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},navigator:{}});
const src=fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8').split('\nload();renderHome();')[0];vm.runInContext(src,ctx);
function run(s){return vm.runInContext(s,ctx)}
run("renderEnd=()=>{};renderPizarrasMedals=()=>{};show=()=>{};renderSegments=()=>{};startClassClock=()=>{};renderQuestion=()=>{};state=freshState();session={type:'study',startedAt:160000,endsAt:1000000,durationSec:840,minQuestions:8,questionCount:8,correct:6,points:70,bestCombo:3,times:[2,3],records:[],errors:[],focusCategories:[],planId:'p',milestonesShown:{}};state.pendingPlan={id:'p',title:'test'};save()");
assert.equal(JSON.parse(data.get('pizarras_state_v1')).activeSession.questionCount,8);
now+=600000;run("session=null;load();resumeStudy()");assert.equal(run('session.endsAt'),now);assert.equal(run('session.questionCount'),8);
run('finishSession(false);finishSession(false)');assert.equal(run('state.sessions'),1);assert.equal(run('state.classSessions'),1);assert.equal(run('state.activeSession'),null);
fail=true;run('state.answers=20;save()');assert.equal(JSON.parse(backup.get('pizarras_state_v1_pending')).answers,20);run('load()');assert.equal(run('state.answers'),20);
fail=false;run('save()');assert.equal(backup.size,0);assert.equal(JSON.parse(data.get('pizarras_state_v1')).answers,20);
console.log('PASS: checkpoint, pause excluded, resume counts, idempotent completion, quota fallback, fallback read and retry');

run("state=freshState();tone=()=>{};const q={id:'q',category:'Grammar',concept:'test',prompt:'test',correct:'yes',options:['yes','no','a','b']};state.customItems=[q];current=q;session={type:'study',startedAt:Date.now()-840000,endsAt:Date.now(),durationSec:840,minQuestions:8,questionCount:7,correct:0,points:0,combo:0,bestCombo:0,times:[],records:[],errors:[],recentIds:[],recentConcepts:[],relearnQueue:[],currentMode:'RECOGNITION',currentPrompt:'test',focusCategories:[]};locked=false;deadline=Date.now()+10000;answer('yes',null,false);answer('yes',null,false)");
assert.equal(run('state.answers'),1);assert.equal(run('state.history.length'),1);assert.equal(run('state.history[0].questions'),8);assert.equal(run('session.finished'),true);
run("state=freshState();current=q;session={type:'quick',queue:[q],index:0,startedAt:Date.now(),questionCount:0,correct:0,points:0,combo:0,bestCombo:0,times:[],records:[],errors:[],recentIds:[],recentConcepts:[],relearnQueue:[],currentMode:'RECOGNITION',currentPrompt:'test'};locked=false;answer('no',null,false)");
assert.equal(run('state.quickSessions'),1);assert.equal(run('state.history[0].questions'),1);
console.log('PASS: final study and quick answers close before feedback; duplicate answer ignored');
