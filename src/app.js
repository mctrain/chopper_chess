"use strict";
let mode = "home",
  game = new Chess(),
  human = "w",
  flipped = false,
  selected = null,
  hint = [],
  timer = null,
  epoch = 0,
  busy = false,
  ended = false,
  recorded = false,
  current = null,
  groupIndex = 0,
  practiceIndex = 0,
  answered = false,
  assisted = false,
  wrong = false,
  message = "",
  last = [];
const pieceNames = { k: "王", q: "后", r: "车", b: "象", n: "马", p: "兵" };
// 可调整的弱 AI 参数：depth 为半回合深度，noise 为随机噪声，blunder 为随机走子概率。
function stop() {
  epoch++;
  clearTimeout(timer);
  busy = false;
  $("#promotion").close();
  selected = null;
  hint = [];
}
function ask(title, text, fn) {
  $("#confirmTitle").textContent = title;
  $("#confirmText").textContent = text;
  $("#confirmYes").onclick = () => {
    $("#confirm").close();
    fn();
  };
  $("#confirm").showModal();
}
function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applySettings();
  save();
}
function toggleSound() {
  state.muted = !state.muted;
  applySettings();
  save();
}
function applySettings() {
  document.body.classList.toggle("dark", state.theme === "dark");
  $("#theme").textContent = state.theme === "dark" ? "☀ 浅色" : "☾ 深色";
  $("#sound").textContent = state.muted ? "♪ 已静音" : "♪ 声音开";
}
let audio;
function sound(kind = "move") {
  if (state.muted) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const notes = {
      move: [390],
      capture: [260, 420],
      check: [490, 620],
      win: [523, 659, 784],
      lose: [392, 330, 262],
      wrong: [220, 190],
    }[kind] || [390];
    notes.forEach((f, i) => {
      const o = audio.createOscillator(),
        g = audio.createGain(),
        t = audio.currentTime + i * 0.11;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g);
      g.connect(audio.destination);
      o.start(t);
      o.stop(t + 0.17);
    });
  } catch {}
}
function navigate(next) {
  snapshotGame();
  stop();
  clearPlanSession();
  mode = next;
  renderNav();
  if (next === "home") home();
  else if (next === "practice") practiceHome();
  else if (next === "puzzles") startPuzzle();
  else if (next === "archive") archiveHome();
  else if (next === "learn") learnHome();
  else newGame();
}
function renderNav() {
  const names = {
    home: "⌂ 我的旅程",
    ai: "♟ 人机对弈",
    practice: "⚑ 主题练习",
    puzzles: "✦ 每日谜题",
    local: "♜ 亲子对弈",
    learn: "▤ 学习小课堂",
    archive: "↺ 棋局复盘",
  };
  $("#nav").innerHTML = Object.entries(names)
    .map(
      ([k, v]) =>
        `<button class="${mode === k ? "active" : ""}" onclick="navigate('${k}')">${v}</button>`,
    )
    .join("");
}
function newGame() {
  snapshotGame();
  stop();
  activeGameId = makeId();
  keepCurrentGame = state.saveGames;
  game = new Chess();
  ended = recorded = answered = false;
  last = [];
  message = "";
  flipped = human === "b" && mode === "ai";
  renderGame();
  maybeAI();
}
function layout(title, body) {
  $("#app").innerHTML =
    `<div class="play-layout"><section class="board-wrap"><div class="player"><span id="topPlayer"></span><span class="sub" id="topLabel"></span></div><div id="board" class="board" aria-label="国际象棋棋盘"></div><div class="player"><span id="bottomPlayer"></span><span class="sub">点棋子，再点目标格</span></div></section><aside class="panel"><div class="eyebrow">小八的训练营</div><h1>${title}</h1>${body}</aside></div>`;
  drawBoard();
}
function renderGame() {
  layout(
    mode === "ai" ? "和小棋友下一盘" : "一起下盘棋",
    `${
      mode === "ai"
        ? `<label for="difficulty">小棋友的难度</label><select id="difficulty" onchange="state.level=+this.value;save()">${AI_LEVELS.slice(
            1,
          )
            .map(
              (cfg, i) =>
                `<option value="${i + 1}" ${state.level === i + 1 ? "selected" : ""}>${i + 1} 级 · ${cfg.name}</option>`,
            )
            .join("")}</select>`
        : "<p>家长和孩子轮流点击走子。</p>"
    }<div id="status" class="status" role="status" aria-live="polite"></div><div class="controls"><button onclick="undo()">↶ 悔棋</button><button onclick="giveHint()">☀ 提示</button><button onclick="resign()">认输</button><button onclick="${mode === "ai" ? "ask('交换黑白？','将重新开局，由白棋先走。',()=>{human=human==='w'?'b':'w';newGame()})" : "flipped=!flipped;drawBoard()"}">${mode === "ai" ? "⇄ 换边" : "⇅ 翻转棋盘"}</button><button class="wide primary" onclick="ask('重新开局？','当前这盘将结束，不计入战绩。',newGame)">重新开局</button></div>${mode === "ai" ? `<label class="save-choice"><input type="checkbox" ${keepCurrentGame ? "checked" : ""} onchange="setKeepCurrent(this.checked)"> 自动保留这盘棋，方便以后复盘</label><button onclick="navigate('archive')">查看我的棋局</button>` : ""}<div id="moves" class="moves"></div><p class="tip">${mode === "ai" ? "小提醒：先照顾好自己的王，再看看对手有没有没保护的棋子。" : "小提醒：轮到谁，就由谁点击棋子。可以随时翻转棋盘。"}</p>`,
  );
  updateGameStatus();
}
function drawBoard() {
  if (!$("#board")) return;
  const files = flipped ? "hgfedcba" : "abcdefgh",
    ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1],
    legal = selected ? game.moves({ square: selected, verbose: true }) : [];
  let out = "";
  for (let ri = 0; ri < 8; ri++)
    for (let fi = 0; fi < 8; fi++) {
      const sq = files[fi] + ranks[ri],
        p = game.get(sq),
        dark = (sq.charCodeAt(0) - 97 + ranks[ri]) % 2 === 1,
        dest = legal.some((m) => m.to === sq);
      out += `<button class="sq ${dark ? "dark-square" : ""} ${last.includes(sq) ? "last" : ""} ${selected === sq ? "selected" : ""} ${hint.includes(sq) ? "hint" : ""} ${p && p.type === "k" && p.color === game.turn() && game.in_check() ? "check" : ""}" aria-label="${sq}${p ? " " + (p.color === "w" ? "白" : "黑") + pieceNames[p.type] : " 空格"}" onclick="clickSquare('${sq}')">${p ? PIECE_SVGS[p.color + p.type.toUpperCase()] : ""}${dest ? `<span class="${p ? "ring" : "dot"}"></span>` : ""}${fi === 0 ? `<span class="coord rank">${ranks[ri]}</span>` : ""}${ri === 7 ? `<span class="coord file">${files[fi]}</span>` : ""}</button>`;
    }
  $("#board").innerHTML = out;
  const top = flipped ? "w" : "b",
    bottom = flipped ? "b" : "w",
    name = (c) =>
      `${c === "w" ? "○ 白棋" : "● 黑棋"}${mode === "ai" ? (c === human ? " · 你" : " · 小棋友") : ""}`;
  $("#topPlayer").textContent = name(top);
  $("#bottomPlayer").textContent = name(bottom);
  $("#topLabel").textContent =
    mode === "ai"
      ? "友好对弈"
      : mode === "local"
        ? "亲子时光"
        : "仔细观察，慢慢思考";
}
function clickSquare(sq) {
  if (mode === "review" || lessonDemo || busy || ended || answered) return;
  if (mode === "ai" && game.turn() !== human) return;
  const p = game.get(sq);
  if (selected) {
    const opts = game
      .moves({ square: selected, verbose: true })
      .filter((m) => m.to === sq);
    if (opts.length) {
      if (opts.some((m) => m.promotion)) {
        const from = selected;
        $("#promoteChoices").innerHTML = ["q", "r", "b", "n"]
          .map(
            (t) =>
              `<button aria-label="升变为${pieceNames[t]}" onclick="$('#promotion').close();attemptMove({from:'${from}',to:'${sq}',promotion:'${t}'})">${PIECE_SVGS[game.turn() + t.toUpperCase()]}</button>`,
          )
          .join("");
        $("#promotion").showModal();
        $("#promoteChoices button").focus();
        return;
      }
      attemptMove(opts[0]);
      return;
    }
  }
  selected = p && p.color === game.turn() ? sq : null;
  hint = [];
  drawBoard();
}
function attemptMove(move) {
  if (mode === "review" || lessonDemo || busy || ended || answered) return;
  if (["practice", "puzzles", "lesson"].includes(mode)) {
    solveExercise(move);
    return;
  }
  performMove(move);
  maybeAI();
}
function performMove(move) {
  const m = game.move(move);
  if (!m) return;
  selected = null;
  hint = [];
  last = [m.from, m.to];
  if (!game.game_over())
    sound(game.in_check() ? "check" : m.captured ? "capture" : "move");
  drawBoard();
  updateGameStatus();
  snapshotGame();
}
function updateGameStatus() {
  if (!$("#status")) return;
  if (!ended && game.game_over()) {
    ended = true;
    const winner = game.in_checkmate()
      ? game.turn() === "w"
        ? "b"
        : "w"
      : null;
    message = winner
      ? `${winner === "w" ? "白棋" : "黑棋"}获胜！${mode === "ai" ? (winner === human ? "你做到了！" : "这盘积累了新经验。") : ""}`
      : "握握手，这是一盘和棋。";
    record(winner);
    sound(mode === "ai" && winner && winner !== human ? "lose" : "win");
  }
  $("#status").innerHTML = ended
    ? `<b>${message}</b><button class="primary" onclick="newGame()">再来一局 →</button>`
    : `<b>${busy ? "小棋友正在想一想…" : (game.turn() === "w" ? "白棋" : "黑棋") + "走棋" + (game.in_check() ? " · 注意，将军！" : "")}</b>${mode === "ai" ? (game.turn() === human ? "轮到你啦，找出想走的棋子。" : "稍等一下，小棋友马上落子。") : "点起点，再点终点。"}`;
  const history = game.history();
  if ($("#moves"))
    $("#moves").textContent = history.length
      ? history
          .map((m, i) => (i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : "") + m)
          .join(" ")
      : "棋谱会出现在这里";
}
function record(winner) {
  if (mode !== "ai" || recorded) return;
  recorded = true;
  state[winner === null ? "draws" : winner === human ? "wins" : "losses"]++;
  snapshotGame(
    winner === null ? "和棋" : winner === human ? "胜利" : "再接再厉",
  );
  save();
}
function undo() {
  if (ended) return;
  stop();
  if (!game.history().length) return;
  if (mode === "ai") {
    game.undo();
    if (game.turn() !== human && game.history().length) game.undo();
  } else game.undo();
  last = [];
  drawBoard();
  updateGameStatus();
  snapshotGame();
  maybeAI();
}
function resign() {
  if (ended) return;
  ask("确定认输吗？", "每一盘都是练习，下一盘再加油。", () => {
    const loser = mode === "ai" ? human : game.turn();
    stop();
    ended = true;
    message =
      (loser === "w" ? "白棋" : "黑棋") +
      "认输，" +
      (loser === "w" ? "黑棋" : "白棋") +
      "获胜。";
    record(loser === "w" ? "b" : "w");
    sound("lose");
    updateGameStatus();
  });
}
function maybeAI() {
  if (mode !== "ai" || ended || game.turn() === human) return;
  busy = true;
  updateGameStatus();
  const token = epoch;
  timer = setTimeout(() => {
    if (token !== epoch) return;
    const move = chooseMove(game, state.level);
    busy = false;
    if (move) performMove(move);
  }, 450);
}
function practiceHome() {
  current = null;
  $("#app").innerHTML =
    `<section class="hero"><div><div class="eyebrow">主题练习 · 一步一个小成就</div><h1>收集二十枚棋士徽章</h1><p>先看目标，再找机会。走错也没关系，可以再试一次。</p></div><div class="hero-art">⚑</div></section><section class="cards practice-grid">${GROUPS.map((g, i) => `<article class="card"><span class="pill">主题 ${String(i + 1).padStart(2, "0")} · ${g.items.length} 关</span><h2 style="margin-top:14px">${g.title}</h2><p>${g.description}</p><div class="progress"><i style="width:${(g.items.filter((x) => state.practice.includes(x.id)).length / g.items.length) * 100}%"></i></div><div class="sub">${g.items.filter((x) => state.practice.includes(x.id)).length} / ${g.items.length} 已完成 · ${g.badge}</div><div class="levels">${g.items.map((x, j) => `<button onclick="startPractice(${i},${j})" aria-label="第${j + 1}关 ${x.title}">${state.practice.includes(x.id) ? "✓" : j + 1}</button>`).join("")}</div></article>`).join("")}</section>`;
}
