function earnedBadges() {
  return GROUPS.filter((g) =>
    g.items.every((q) => state.practice.includes(q.id)),
  );
}
function badgeHTML() {
  return `<div class="section-head"><h2>我的徽章架</h2><span class="sub">${earnedBadges().length} / ${GROUPS.length} · 完成主题点亮徽章</span></div><div class="badges">${GROUPS.map(
    (g) => {
      const done = g.items.every((q) => state.practice.includes(q.id));
      return `<div class="badge ${done ? "" : "locked"}" title="完成 ${g.title} 的全部练习"><span>${done ? "🏅" : "○"}</span> ${g.badge}</div>`;
    },
  ).join("")}</div>`;
}
function home() {
  const completed = state.practice.length,
    total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  $("#app").innerHTML =
    `<section class="hero"><div><div class="eyebrow">小棋手，欢迎回来</div><h1>每天一点点，下出好一步。</h1><p>先找将军，再看吃子。今天的小任务已经准备好啦。</p></div><div class="hero-art" aria-hidden="true">♜ ♞ ♔</div></section>${calendarHTML()}<section class="stats"><div class="stat"><span>我的徽章</span><b>${earnedBadges().length} <small>/ ${GROUPS.length}</small></b><span>每完成一个主题，点亮一枚</span></div><div class="stat"><span>解开的谜题</span><b>${state.solved.length} <small>/ ${PUZZLES.length}</small></b><span>首次作答正确率 ${state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0}%</span></div><div class="stat"><span>人机对弈战绩</span><b>${state.wins} <small>胜</small></b><span>${state.losses} 负 · ${state.draws} 和 · ${state.games.length} 盘收藏</span></div><div class="stat"><span>主题练习进度</span><b>${completed} <small>/ ${total}</small></b><span>课堂 ${state.lessonDone.length} / ${LESSONS.length} · 最长连对 ${state.best} 题</span></div></section><section class="cards"><article class="card"><div class="icon">♞</div><span class="pill">轻松下一盘</span><h2>和小棋友过招</h2><p>从小蜗牛开始。每盘棋默认收藏，方便和家长复盘。</p><button class="primary" onclick="navigate('ai')">开始人机对弈 →</button><button onclick="navigate('archive')">我的棋局与复盘</button></article><article class="card"><div class="icon">⚑</div><span class="pill">${GROUPS.length} 个训练主题</span><h2>收集棋士徽章</h2><p>杀法和战术，${total} 个小关卡慢慢练。</p><button onclick="navigate('practice')">自由练习 →</button><button onclick="navigate('puzzles')">${PUZZLES.length} 道谜题</button></article><article class="card"><div class="icon">▤</div><span class="pill">开局 · 中局 · 残局</span><h2>学一个小本领</h2><p>每课三个提醒、一步示范和一道独立挑战。</p><button onclick="navigate('learn')">进入学习小课堂 →</button><button onclick="navigate('local')">和家长下一盘</button></article></section>${badgeHTML()}<div class="section-head data-controls"><span class="sub">${storageOK ? "记录保存在当前浏览器，请定期导出备份。" : "当前无法保存记录，请导出备份。"}</span><div><button onclick="downloadJSON()">导出进度备份</button><button onclick="ask('重新开始旅程？','这会清空本浏览器的徽章、谜题、训练计划和棋局收藏。请先导出备份。',()=>{state=fresh();activeGameId=null;selectedPlanDate=null;save();applySettings();navigate('home')})">清空数据重新开始</button></div></div>`;
}
