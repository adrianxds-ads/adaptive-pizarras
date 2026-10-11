/* Classroom B2 · curriculum v3. Curated contextual variations based on the existing Sara/Pizarras topics.
   The previous 301-item reference bank stays intact in questions.js and may be consulted/recovered. */
(function(root){
'use strict';
const category={G:'Grammar',V:'Vocabulary',P:'Phrasal verbs',S:'Speaking',C:'Connectors',W:'Word formation',R:'Corrections'};
const lessons=[
{title:'Conversación natural',rows:`
S|asking opinions|Which phrase politely invites a partner's opinion?|What do you think about it?|Tell me your final opinion.|You must agree with me.|You are wrong about that.|Invite rather than demand an opinion.
S|partial agreement|I see your point, but I ___ convinced.|am not entirely|am very no|not completely am|do not entirely be|I'm not entirely convinced is a natural polite disagreement.
G|dependent prepositions|She is really good ___ explaining difficult ideas.|at|in|on|for|Good at + noun or -ing.
C|concession|___ it was expensive, we decided to go.|Although|Despite|In spite|However|Although introduces a complete clause.
V|collocations|We need to ___ a decision before Friday.|make|do|take up|put|Make a decision is the natural collocation.
S|suggestions|Which is the most tactful suggestion?|We could consider another option.|You have to choose mine.|Your option makes no sense.|No other choice exists.|Could consider leaves room for negotiation.
G|dependent prepositions|This book is based ___ a true story.|on|in|at|from|Based on a story; based in a place.
V|uncountables|We received useful ___ from the teacher.|advice|advices|an advice|many advice|Advice is uncountable.
S|comparison language|Both pictures show people, whereas the second one ___ more relaxed.|seems|is seeming|does seem to be of|look|Seems + adjective for a cautious comparison.
C|cause vs result|The train was delayed, ___ we arrived late.|so|because|although|despite|So introduces the result.
G|verb patterns|Would you mind ___ the window?|closing|to close|close|closed|Mind + -ing.
V|money vocabulary|After paying the rent, it was hard to make ends ___.|meet|match|fit|connect|Make ends meet = manage financially.
`},
{title:'Phrasal verbs en contexto',rows:`
P|look after|Could you ___ my suitcase while I buy a ticket?|look after|look into|look up|look out|Look after = take care of.
P|put off|We had to ___ the meeting until Thursday.|put off|put out|put through|put up|Put off = postpone.
P|run out of|We have ___ coffee, so I'll go to the shop.|run out of|run into|run across|run over|Run out of = have none left.
P|get over|It took her a while to ___ the disappointment.|get over|get off|get around|get by|Get over = recover from.
P|come up with|The team managed to ___ an original solution.|come up with|come down with|come out of|come across to|Come up with = think of an idea.
P|take over|When the manager retires, Elena will ___ the department.|take over|take after|take off|take in|Take over = assume control.
P|call off|Bad weather forced them to ___ the match.|call off|call on|call in|call up|Call off = cancel.
P|back out|He promised to help, but then he ___ at the last minute.|backed out|backed up|backed on|backed over|Back out = withdraw from an agreement.
G|phrasal particle|The concert has been called ___.|off|in|over|at|Call off = cancel; particle off.
P|cut down on|My doctor suggested I ___ sugary drinks.|cut down on|cut through|cut out at|cut away with|Cut down on = consume less.
V|idioms|I've been snowed ___ with work this week.|under|over|away|through|Be snowed under = extremely busy.
S|clarifying|If I understood you correctly, you mean we should ___?|leave earlier|early leaving|leaving the earlier|earliest leave|Use should + infinitivo sin to.
`},
{title:'Patrones verbales',rows:`
G|verb patterns|I can't afford ___ another laptop at the moment.|to buy|buying|buy|bought|Afford + to-infinitive.
G|verb patterns|She suggested ___ by train instead.|travelling|to travel|travel|travelled|Suggest + -ing.
G|verb patterns|He made us ___ the entire exercise again.|do|to do|doing|done|Make someone + infinitivo sin to.
G|verb patterns|They let me ___ the museum after hours.|visit|to visit|visiting|visited|Let someone + infinitivo sin to.
G|verb patterns|I'm looking forward to ___ from you.|hearing|hear|to hear|heard|Look forward to + -ing: to is a preposition here.
G|verb patterns|I'm used to ___ in a noisy office.|working|work|to work|worked|Be used to + -ing means accustomed.
G|verb patterns|I used to ___ here when I was a student.|live|living|to live|lived|Used to + infinitivo sin to expresses a past habit.
G|verb patterns|The teacher encouraged us ___ more often.|to speak|speaking|speak|spoken|Encourage someone to do something.
G|verb patterns|She denied ___ the message.|sending|to send|send|sent|Deny + -ing.
G|verb patterns|We managed ___ the last bus.|to catch|catching|catch|caught|Manage + to-infinitive.
V|collocations|She takes great pride ___ her work.|in|at|for|by|Take pride in.
S|polite uncertainty|Which sounds most appropriately cautious?|It might be worth trying.|It certainly must work.|It will definitely solve everything.|It is impossible to disagree.|Might be worth + -ing softens a suggestion.
`},
{title:'Conectores y matices',rows:`
C|although vs despite|___ the heavy rain, the tour continued.|Despite|Although|Even though|Because|Despite + noun phrase.
C|although vs despite|___ it was raining heavily, the tour continued.|Although|Despite|In spite of|Because of|Although + subject and verb.
C|because vs because of|The flight was cancelled ___ a technical problem.|because of|because|although|even though|Because of + noun phrase.
C|because vs because of|The flight was cancelled ___ the engine had failed.|because|because of|despite|in spite of|Because + clause.
C|however|The tickets were expensive. ___, the concert sold out.|Nevertheless|Despite|Although|Unless|Nevertheless can link contrasting independent statements.
C|purpose|We left early ___ avoid the traffic.|in order to|so that|because of|despite|In order to + infinitive expresses purpose.
C|purpose|We left early ___ we could avoid the traffic.|so that|in order to|despite|as a result|So that + subject + modal.
C|result|The explanation was ___ clear that everyone understood.|so|such|too|enough|So + adjective + that.
C|result|It was ___ an interesting talk that I stayed longer.|such|so|too|very|Such + (an) adjective + noun + that.
C|contrast|You can join us, ___ you have already finished the task.|provided that|despite|whereas|however|Provided that expresses a condition.
G|degree|The bag isn't big ___ to hold my laptop.|enough|too|so|such|Adjective + enough.
S|presenting two sides|Which phrase introduces a balanced argument?|On the one hand, it saves time.|Everyone knows it is perfect.|It obviously has no drawbacks.|You have no reason to disagree.|On the one hand introduces one side of a discussion.
`},
{title:'Colocaciones sin monotonía',rows:`
V|do vs make|Could you ___ me a favour?|do|make|take|put|Do someone a favour.
V|do vs make|Let's ___ arrangements for Saturday.|make|do|take|put|Make arrangements.
V|do vs make|I need to ___ some research before the interview.|do|make|take|give|Do research.
V|do vs make|She ___ an excellent impression at the interview.|made|did|put|took|Make an impression.
V|collocations|Please ___ attention to the safety instructions.|pay|make|put|give|Pay attention.
V|collocations|The charity hopes to ___ awareness of the issue.|raise|lift|grow|rise|Raise awareness.
V|collocations|We should ___ into account the cost of transport.|take|make|do|hold|Take into account.
V|collocations|The museum will ___ an exhibition next month.|hold|make|do|carry|Hold an exhibition.
V|collocations|I finally ___ up my mind about the course.|made|did|took|put|Make up your mind.
V|collocations|The decision could have a major ___ on tourism.|impact|affection|cause|remark|Have an impact on.
V|work idioms|She has been working ___ the clock to finish the project.|around|above|behind|against|Work around the clock.
G|dependent prepositions|He's responsible ___ organising the visits.|for|of|with|at|Responsible for + -ing.
`},
{title:'Reported speech y deducción',rows:`
G|reported speech|“I am tired,” he said. → He said that he ___ tired.|was|is being|were|has been|Backshift am -> was in reported speech.
G|reported speech|“I will call tomorrow,” she said. → She said she ___ call the next day.|would|will|might have|has|Will -> would; tomorrow -> the next day.
G|reported speech|“Don't touch it,” she warned us. → She warned us ___ it.|not to touch|don't touch|to not touching|not touch|Warn someone not to + infinitive.
G|reported speech|“Where do you live?” she asked me. → She asked me where I ___.|lived|did live|do I live|was live|Embedded questions use statement word order.
G|reported speech|“I haven't seen him,” he admitted. → He admitted that he ___ him.|hadn't seen|hasn't seen|didn't saw|hadn't see|Present perfect often becomes past perfect.
G|modal deduction|All the lights are off. They ___ have gone to bed.|must|might not|can't|shouldn't|Must have + past participle: strong past deduction.
G|modal deduction|She speaks perfect French. She ___ have lived in France.|might|mustn't|can't|needn't|Might have = possible past explanation.
G|modal deduction|He was in Madrid all day; he ___ have met her in Paris.|can't|must|should|ought to|Can't have = past impossibility.
G|modal deduction|You ___ have brought food; lunch was included.|needn't|mustn't|can't|won't|Needn't have = unnecessary completed action.
G|modal regret|I ___ have checked the timetable before leaving.|should|may|can|will|Should have + past participle expresses regret.
V|word choice|You need to ___ responsibility for your actions.|take|make|do|put|Take responsibility.
S|speculation|Which phrase sounds appropriately tentative?|They may have missed the train.|They must missed the train.|They have perhaps must miss it.|They surely can missing the train.|May have + past participle expresses possibility.
`},
{title:'Word formation en uso',rows:`
W|adjective formation|Her explanation was clear and ___. (HELP)|helpful|helpness|helpfully|helpless|Helpful is a positive adjective.
W|negative prefixes|The instructions were completely ___. (USE)|useless|unusedly|uselessly|unuse|Useless is the adjective meaning not useful.
W|adverb formation|He handled the situation very ___. (PROFESSIONAL)|professionally|professional|profession|unprofessional|An adverb modifies handled.
W|noun formation|The final ___ took several hours. (DECIDE)|decision|decisive|deciding|decided|The noun of decide is decision.
W|noun formation|Her ___ to the project was remarkable. (CONTRIBUTE)|contribution|contributive|contributingly|contributor|Contribution is the action/result noun.
W|adjective formation|The speech was surprisingly ___. (PERSUADE)|persuasive|persuasion|persuadingly|persuade|Persuasive is the adjective.
W|negative prefixes|The answer was completely ___. (ACCURATE)|inaccurate|unaccurate|disaccurate|accuracy|Inaccurate, not unaccurate.
W|noun formation|Air ___ is a growing concern in large cities. (POLLUTE)|pollution|polluting|polluted|polluter|Pollution is the noun.
W|adjective formation|We need a more ___ solution. (PRACTICE)|practical|practically|practise|practice|Practical means useful in real situations.
W|adverb formation|She responded ___ to criticism. (CALM)|calmly|calm|calmness|calming|Calmly is the adverb.
W|negative prefixes|It would be ___ to ignore the warning. (RESPONSIBLE)|irresponsible|unresponsible|disresponsible|responsibility|Irresponsible has prefix ir-.
W|noun formation|The event was a great ___. (SUCCEED)|success|successful|successfully|succeeding|Success is a noun.
`},
{title:'Hipótesis y tiempo',rows:`
G|conditionals|If I ___ more time, I would learn Italian.|had|have|will have|would have|Second conditional: if + past, would + infinitive.
G|conditionals|If we had left earlier, we ___ the train.|would have caught|will catch|would catch|had caught|Third conditional: would have + participle.
G|conditionals|If it rains tomorrow, we ___ inside.|will stay|would stay|would have stayed|had stayed|First conditional: if + present, will.
G|conditionals|Unless we ___ now, we'll miss the start.|leave|will leave|left|would leave|Unless = if not; present for future condition.
G|conditionals|I wish I ___ more confident when speaking.|were|am|will be|have been|Wish + past form for an unreal present.
G|conditionals|If only I ___ harder for that exam last month.|had studied|studied|will study|would study|If only + past perfect for past regret.
G|past habits|When I was little, I ___ spend summers by the sea.|would|will|might have|should have|Would can express repeated past habits.
G|used to|I'm slowly getting used to ___ early.|waking up|wake up|woke up|have woken|Get used to + -ing.
G|future perfect|By next June, she ___ her degree.|will have finished|will finishing|had finished|has finish|Future perfect: will have + participle.
G|past perfect|By the time we arrived, the film ___.|had started|has started|starts|is starting|Past perfect marks the earlier past action.
C|hypothetical contrast|Even if it ___ cheaper, I wouldn't buy it.|were|will be|had been|is being|Even if + past for an unreal present.
V|collocations|A good plan can make a real ___.|difference|different|differently|differ|Make a difference.
`},
{title:'Trabajo, viajes y cultura',rows:`
V|travel vocabulary|The museum offers a ___ tour for visitors with hearing difficulties.|guided|guiding|guidance|guideful|A guided tour is led by a guide.
V|job vocabulary|The contract offers better job ___.|security|safe|securely|secureness|Job security = stability of employment.
V|travel vocabulary|We need to check the train ___ before booking.|timetable|schedulely|timecard|chronology|Train timetable is idiomatic in British English.
V|word choice|She ___ a complaint about the delayed flight.|made|did|gave|put|Make a complaint.
V|collocations|The council plans to ___ a public consultation.|launch|throw|open up with|begin on|Launch a consultation.
G|transport prepositions|I left my umbrella ___ the taxi.|in|on|at|by|In a car or taxi; on a train or bus.
G|place prepositions|They live ___ the outskirts of the city.|on|at|in|over|On the outskirts.
G|comparisons|This gallery is similar ___ the one we visited yesterday.|to|as|than|with|Similar to; the same as.
V|arts vocabulary|The whole ___ stood up to applaud the performance.|audience|spectators|viewers|witnesses|Audience = people watching a performance.
P|drop off|I nearly ___ during the documentary because I was exhausted.|dropped off|dropped in|dropped out|dropped over|Drop off = fall asleep.
S|expressing preference|I'd rather ___ the morning tour.|take|to take|taking|taken|Would rather + infinitivo sin to.
C|consequence|The museum closed early; ___, we had to change our plans.|as a result|despite|although|whereas|As a result introduces a consequence.
`},
{title:'Cambridge B2 · Speaking',rows:`
S|comparing images|Both pictures feature people working, ___ the first looks more stressful.|although|because of|despite|in order to|Although links two clauses in a contrast.
S|speculation|She looks as ___ she has just received good news.|if|whether|unless|though of|Look as if + clause.
S|inviting partner|Shall we start ___ the first option?|with|by|for|at|Start with the first option.
S|agreeing politely|That's a fair point. I ___ with you to some extent.|agree|am agree|make agree|have agreeing|Agree is a verb, not an adjective.
S|asking clarification|Sorry, could you ___ what you mean by that?|clarify|clear off|explain me|make clear me|Clarify what you mean is idiomatic.
S|weighing options|On balance, the second proposal ___ more practical.|seems|is seeming|seem|seemed of|On balance signals a considered judgement.
S|collaborative task|Why don't we ___ the advantages of both options?|compare|to compare|comparing|compared|Why don't we + infinitivo sin to.
S|nuanced opinion|I'm ___ to agree, but I have one reservation.|inclined|declined|reclined|unclined|Be inclined to agree expresses cautious agreement.
S|reasoned argument|The main ___ for choosing this option is its flexibility.|reason|cause to|reasoning of|excuse why|The main reason for + -ing.
S|negotiating|Could we reach a ___ on this point?|compromise|comparison|comprising|compassion|Reach a compromise.
S|closing discussion|So, shall we ___ on the first option?|settle|resolve on|decide at|achieve|Settle on = choose after consideration.
C|adding support|Furthermore, it would also ___ time.|save|saving|to save|saved|Would + infinitivo sin to.
`},
{title:'Precisión léxica y contrastes',rows:`
V|borrow vs lend|Could you ___ me your notes until tomorrow?|lend|borrow|loaning|owe|Lend someone something; borrow from someone.
V|say vs tell|He ___ us that the exhibition had been postponed.|told|said|spoke|talked|Tell someone; say something to someone.
V|rise vs raise|The museum plans to ___ ticket prices next year.|raise|rise|arise|arouse|Raise takes an object; rise does not.
V|economic vs economical|The new heating system is more ___ to run.|economical|economic|economy|economically|Economical means saving money/resources.
V|sensible vs sensitive|It would be ___ to check the forecast before leaving.|sensible|sensitive|sensuous|sentimental|Sensible = practical and reasonable.
V|remember vs remind|Could you ___ me to bring the documents?|remind|remember|recall|recollect|Remind someone to do something.
V|job vs work|Finding a permanent ___ took longer than expected.|job|work|working|labour|Job is a countable position; work is generally uncountable.
V|make vs let|The instructor ___ us choose our own topic.|let|made to|allowed|forced to|Let someone + infinitivo sin to.
G|relative clauses|The woman ___ guided us was very knowledgeable.|who|which|whose|where|Who refers to a person as subject.
G|relative clauses|The house, ___ was built in 1900, is now a museum.|which|that|where|whose|Non-defining relative clauses use which.
C|contrast|The first tour is cheaper, ___ the second includes lunch.|whereas|despite|because of|so that|Whereas joins contrasting clauses.
W|word formation|Her explanation was extremely ___. (CONVINCE)|convincing|convinced|conviction|convince|A convincing explanation persuades people.
`},
{title:'Phrasals y estructuras avanzadas',rows:`
P|bring up|She didn't want to ___ the issue during dinner.|bring up|bring over|bring in on|bring along to|Bring up = mention a topic.
P|carry on|Although it was late, we decided to ___ working.|carry on|carry out|carry off|carry away|Carry on + -ing = continue.
P|look into|The manager promised to ___ the complaint.|look into|look after|look up to|look forward to|Look into = investigate.
P|turn down|He ___ the job offer because of the salary.|turned down|turned on|turned out|turned in|Turn down = reject an offer.
P|work out|We need to ___ how much the trip will cost.|work out|work up|work over|work through out|Work out = calculate or solve.
P|set off|They plan to ___ before sunrise.|set off|set up|set out of|set back|Set off = begin a journey.
P|come across|I ___ an interesting article while researching.|came across|came about|came on to|came over|Come across = find by chance.
P|keep up with|It's hard to ___ all the new vocabulary.|keep up with|keep down on|keep out of|keep on by|Keep up with = stay at the same pace.
P|put up with|I can't ___ that constant noise any longer.|put up with|put out with|put on up|put off with|Put up with = tolerate.
P|sort out|Let's ___ the booking problem before lunch.|sort out|sort off|sort on|sort over|Sort out = resolve.
G|phrasal particle|We finally worked ___ the answer.|out|off|at|on|Work out the answer; particle out.
G|phrasal particle|The team set ___ at dawn.|off|in|under|over|Set off; particle off.
`}
];
const bank=[];
lessons.forEach((lesson,i)=>{
 const lines=lesson.rows.trim().split(/\n/).filter(Boolean);
 lines.forEach((line,j)=>{
  const p=line.split('|');
  if(p.length!==8)throw Error('Bad curriculum row '+(i+1)+'/'+(j+1)+' length '+p.length);
  const [short,concept,prompt,correct,a,b,c,explanation]=p;
  if(!category[short])throw Error('Bad category '+short);
  const q={id:'v3-'+String(i+1).padStart(2,'0')+'-'+String(j+1).padStart(2,'0'),lesson:i+1,lessonTitle:lesson.title,category:category[short],concept,prompt,correct,options:[correct,a,b,c],explanation,source:'Classroom B2 · ampliación curricular de temas Sara/Pizarras · v3'};
  if(new Set(q.options.map(x=>x.toLowerCase().trim())).size!==4)throw Error('Repeated option '+q.id);
  bank.push(q);
 });
});
root.CLASSROOM_V3_LESSONS=Object.freeze(lessons.map((l,i)=>({id:i+1,title:l.title,questions:bank.filter(q=>q.lesson===i+1).length})));
root.CLASSROOM_V3_BANK=Object.freeze(bank);
})(window);
