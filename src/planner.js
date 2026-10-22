let selectedPlanDate=null,planSession=null;
function clearPlanSession(){planSession=null;lessonDemo=false}
function dayOffset(iso,offset){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+offset);return localDate(d)}
function trainingPlan(){
  let weekendIndex=0;
  return Array.from({length:30},(_,i)=>{
    const date=dayOffset(state.planStart,i),day=new Date(date+'T12:00:00').getDay(),weekend=day===0||day===6;
    const tasks=[{id:'puzzles',kind:'puzzle',title:'每日谜题 · 找到 5 个好机会',minutes:weekend?10:12,items:PUZZLES.slice(i*5,i*5+5).map(q=>q.id)},
      {id:'practice',kind:'practice',title:'主题基本功 · 完成 3 关',minutes:weekend?10:13,items:GROUPS.flatMap(g=>g.items).slice(i*3,i*3+3).map(q=>q.id)}];
    if(weekend){for(const [phase,name] of [['opening','开局'],['middle','中局'],['ending','残局']]){const lesson=LESSONS.filter(l=>l.phase===phase)[weekendIndex];tasks.push({id:phase,kind:'lesson',title:name+'小课堂 · '+lesson.title,minutes:12,items:[lesson.id]})}weekendIndex++}
    return {date,day,index:i+1,weekend,tasks,minutes:tasks.reduce((n,t)=>n+t.minutes,0)};
  });
}
function completionFor(date,task){const done=new Set(state.events.filter(e=>e.date===date&&e.kind===task.kind).map(e=>e.id));return task.items.filter(id=>done.has(id)).length}
function dayComplete(day){return day.tasks.every(t=>completionFor(day.date,t)===t.items.length)}
function noteCompletion(kind,id){
  const date=localDate();if(!state.events.some(e=>e.date===date&&e.kind===kind&&e.id===id))state.events.push({date,kind,id});save();
}
function planRemaining(){if(!planSession)return [];return planSession.task.items.filter(id=>!state.events.some(e=>e.date===planSession.date&&e.kind===planSession.task.kind&&e.id===id))}
function selectPlanDay(date){selectedPlanDate=date;home()}
function calendarHTML(){
  const days=trainingPlan(),today=localDate();if(!selectedPlanDate||!days.some(d=>d.date===selectedPlanDate))selectedPlanDate=days.find(d=>d.date===today)?.date||days[0].date;
  const selected=days.find(d=>d.date===selectedPlanDate),done=days.filter(dayComplete).length;
  return `<section class="training-plan"><div class="section-head"><div><div class="eyebrow">30 天的小小进步</div><h2>我的每日训练</h2><p>${days[0].date} — ${days[29].date} · 已完成 ${done} 天</p></div><span class="pill">工作日 25 分钟 · 周末 56 分钟</span></div><div class="plan-layout"><div class="panel calendar"><div class="weekdays">${['一','二','三','四','五','六','日'].map(n=>`<span>${n}</span>`).join('')}</div><div class="calendar-grid">${'<span></span>'.repeat((new Date(days[0].date+'T12:00:00').getDay()+6)%7)}${days.map(d=>`<button class="calendar-day ${d.date===today?'today':''} ${d.date===selectedPlanDate?'selected-day':''} ${dayComplete(d)?'complete':''}" aria-label="${d.date} ${d.weekend?'周末':'基本功'} ${dayComplete(d)?'已完成':''}" aria-pressed="${d.date===selectedPlanDate}" onclick="selectPlanDay('${d.date}')"><small>${Number(d.date.slice(5,7))}月</small><b>${Number(d.date.slice(8))}</b><span>${dayComplete(d)?'✓':d.weekend?'小课堂':'基本功'}</span></button>`).join('')}</div></div><div class="panel checklist"><span class="pill">第 ${selected.index} 天 · ${selected.weekend?'周末探索':'基本功练习'}</span><h2>${selected.date===today?'今天的训练':selected.date} · 约 ${selected.minutes} 分钟</h2><p>${selected.date===today?'点任务就能开始。完成后自动点亮，不用手动打勾。':selected.date>today?'可以提前看看任务；未来日期只能在当天完成打卡。':'这是当天的记录，不补记过去日期。'} 这是建议用时，累了可以休息。</p><div class="task-list">${selected.tasks.map((t,i)=>{const n=completionFor(selected.date,t),ok=n===t.items.length;return `<button class="task ${ok?'done':''}" onclick="launchTask('${selected.date}',${i})"><span class="task-check" aria-hidden="true">${ok?'✓':'○'}</span><span><b>${t.title}</b><small>${n} / ${t.items.length} 完成 · 约 ${t.minutes} 分钟</small></span><span aria-hidden="true">→</span></button>`}).join('')}</div><p class="tip">自己走出正确着法才会打勾；提示或看答案后，可以到普通练习巩固，或重新进入任务独立完成。</p>${today>days[29].date?'<button onclick="restartPlan()">开始新的 30 天</button>':''}</div></div></section>`;
}
function restartPlan(){ask('开始新的训练月？','已有训练记录和徽章保留，新计划从今天开始。',()=>{state.planStart=localDate();selectedPlanDate=null;save();home()})}
function launchTask(date,index){
  const day=trainingPlan().find(d=>d.date===date),task=day?.tasks[index];if(!task)return;
  snapshotGame();stop();planSession={date,task};
  if(!planRemaining().length){navigate('home');return}
  openPlanItem(planRemaining()[0]);
}
function openPlanItem(id){
  if(!planSession)return;const kind=planSession.task.kind;
  if(kind==='puzzle'){mode='puzzles';renderNav();current=PUZZLES.find(q=>q.id===id);startExercise()}
  else if(kind==='practice'){for(let g=0;g<GROUPS.length;g++){const i=GROUPS[g].items.findIndex(q=>q.id===id);if(i>=0){mode='practice';renderNav();startPractice(g,i);break}}}
  else {mode='lesson';renderNav();openLesson(id)}
}
function nextPlanItem(){
  if(!planSession)return;const next=planRemaining()[0];
  if(next)openPlanItem(next);else navigate('home');
}
function planBanner(){return planSession?`<div class="plan-banner">${planSession.date} 的训练任务 <button onclick="navigate('home')">返回日历</button></div>`:''}
