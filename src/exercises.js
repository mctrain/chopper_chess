function startPractice(g, i) {
  stop();
  mode = "practice";
  groupIndex = g;
  practiceIndex = i;
  current = GROUPS[g].items[i];
  startExercise();
}
function nextPractice() {
  if (planSession) {
    nextPlanItem();
    return;
  }
  if (practiceIndex + 1 >= GROUPS[groupIndex].items.length) {
    stop();
    practiceHome();
  } else startPractice(groupIndex, practiceIndex + 1);
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function startPuzzle() {
  stop();
  if (planSession?.task.kind === "puzzle") {
    nextPlanItem();
    return;
  }
  if (
    state.queue.length !== PUZZLES.length ||
    state.queue.some((id) => !PUZZLES.some((p) => p.id === id)) ||
    state.cursor >= state.queue.length
  ) {
    state.queue = shuffle(PUZZLES.map((x) => x.id));
    state.cursor = 0;
    save();
  }
  current = PUZZLES.find((x) => x.id === state.queue[state.cursor]);
  startExercise();
}
function startExercise() {
  lessonDemo = false;
  game = new Chess(current.fen);
  flipped = game.turn() === "b";
  last = [];
  selected = null;
  hint = [];
  ended = false;
  answered = false;
  assisted = false;
  wrong = false;
  const practice = mode === "practice",
    lesson = mode === "lesson",
    n = planSession
      ? planSession.task.items.indexOf(
          lesson ? LESSONS[lessonIndex].id : current.id,
        ) + 1
      : practice
        ? practiceIndex + 1
        : state.cursor + 1,
    total = planSession
      ? planSession.task.items.length
      : practice
        ? GROUPS[groupIndex].items.length
        : PUZZLES.length;
  const title = lesson
    ? LESSONS[lessonIndex].title
    : practice
      ? GROUPS[groupIndex].title
      : "发现精彩的一步";
  layout(
    title,
    `${planBanner()}<span class="pill">${lesson ? "学后练一练" : practice ? "闯关练习" : "随机不重复"}${lesson ? "" : ` · 第 ${n} / ${total} 题`}</span><div class="progress"><i style="width:${lesson ? 0 : ((n - 1) / total) * 100}%"></i></div><h2>${current.title}</h2><p>${current.explain}</p><div id="status" class="status" role="status" aria-live="polite"><b>目标：${current.goal}</b>${game.turn() === "w" ? "白棋" : "黑棋"}先走，找出关键的一步。</div>${mode === "puzzles" ? `<p>🔥 当前连对 <b>${state.streak}</b> 题 · 最佳 ${state.best} 题</p>` : ""}<div class="controls"><button onclick="giveHint()">☀ 给我提示</button><button onclick="showAnswer()">看答案</button><button class="wide" onclick="navigate('${lesson ? "learn" : practice ? "practice" : "home"}')">← 返回${lesson ? "课堂" : practice ? "主题" : "首页"}</button></div><p class="tip">先找将军、再找吃子。提示和答案帮助学习，但不会自动完成训练打卡。</p>`,
  );
}
function countPuzzleAttempt() {
  if (mode === "puzzles" && !wrong && !assisted) {
    state.attempts++;
    state.streak = 0;
    save();
  }
}
function solveExercise(move) {
  const uci = move.from + move.to + (move.promotion || "");
  if (uci !== current.solution) {
    countPuzzleAttempt();
    wrong = true;
    sound("wrong");
    selected = null;
    hint = [];
    $("#status").innerHTML = `<b>再想一想，你可以的。</b>${current.retry}`;
    drawBoard();
    return;
  }
  const m = game.move(move);
  if (!m) return;
  last = [m.from, m.to];
  selected = null;
  hint = [];
  answered = true;
  sound("win");
  drawBoard();
  $("#board").classList.add("success");
  const kind =
      mode === "puzzles" ? "puzzle" : mode === "lesson" ? "lesson" : "practice",
    evidenceId = kind === "lesson" ? LESSONS[lessonIndex].id : current.id;
  if (!assisted) {
    noteCompletion(kind, evidenceId);
    // Preview and sessions crossing midnight advance without backdating evidence.
    if (
      planSession?.task.kind === kind &&
      planSession.task.items.includes(evidenceId)
    ) {
      planSession.visited ||= [];
      if (!planSession.visited.includes(evidenceId))
        planSession.visited.push(evidenceId);
    }
  }
  const coached = assisted
    ? "<p>这是跟提示完成的；重新进入任务独立做一次，才能打勾。</p>"
    : "";
  if (mode === "practice") {
    if (!state.practice.includes(current.id)) state.practice.push(current.id);
    save();
    const complete = GROUPS[groupIndex].items.every((x) =>
      state.practice.includes(x.id),
    );
    $("#status").innerHTML =
      `<b>太棒了，闯关成功！</b>${complete ? "🏅 已获得「" + GROUPS[groupIndex].badge + "」徽章。" : current.explain}${coached}<button class="primary" onclick="${planSession && assisted ? "retryIndependently()" : "nextPractice()"}">${planSession && assisted ? "重新独立挑战" : "继续 →"}</button>`;
  } else if (mode === "lesson") {
    if (!assisted && !state.lessonDone.includes(evidenceId))
      state.lessonDone.push(evidenceId);
    save();
    $("#status").innerHTML =
      `<b>你学会了一个小本领！</b>${current.explain}${coached}<button class="primary" onclick="${assisted ? "retryIndependently()" : planSession ? "nextPlanItem()" : "navigate('learn')"}">${assisted ? "重新独立挑战" : "完成，继续 →"}</button>`;
  } else {
    if (!wrong && !assisted) {
      state.attempts++;
      state.correct++;
      state.streak++;
      state.best = Math.max(state.best, state.streak);
    }
    if (!state.solved.includes(current.id)) state.solved.push(current.id);
    if (!planSession) state.cursor++;
    save();
    $("#status").innerHTML =
      `<b>找到了，真棒！</b>${coached}${planSession && assisted ? '<button onclick="retryIndependently()">重新独立挑战</button>' : "马上进入下一题…"}`;
    if (!(planSession && assisted)) {
      const token = epoch;
      timer = setTimeout(() => {
        if (epoch === token) startPuzzle();
      }, 1500);
    }
  }
}
function giveHint() {
  if (ended || busy || answered || lessonDemo || mode === "review") return;
  if (["practice", "puzzles", "lesson"].includes(mode)) {
    countPuzzleAttempt();
    assisted = true;
    hint = [current.solution.slice(0, 2)];
    $("#status").innerHTML = "<b>给你一个小线索</b>" + current.hint;
    drawBoard();
    return;
  }
  const m = chooseMove(game, 5, true);
  if (m) {
    hint = [m.from, m.to];
    selected = null;
    drawBoard();
  }
}
function showAnswer() {
  if (answered || busy || lessonDemo) return;
  countPuzzleAttempt();
  assisted = true;
  busy = true;
  hint = [current.solution.slice(0, 2), current.solution.slice(2, 4)];
  drawBoard();
  $("#status").innerHTML = "<b>一起看看这一步</b>" + current.hint;
  const token = epoch;
  timer = setTimeout(() => {
    if (token !== epoch) return;
    const s = current.solution,
      m = game.move({
        from: s.slice(0, 2),
        to: s.slice(2, 4),
        promotion: s[4],
      });
    last = [m.from, m.to];
    hint = [];
    drawBoard();
    sound("move");
    $("#status").innerHTML =
      "<b>这就是关键的一步。</b>" +
      current.explain +
      '<button class="primary" onclick="retryExercise()">跟着再试一遍</button>';
    busy = false;
    answered = true;
  }, 900);
}
function retryExercise() {
  stop();
  startExercise();
  assisted = true;
}
function retryIndependently() {
  stop();
  startExercise();
}
