let activeGameId = null,
  keepCurrentGame = true,
  reviewRecord = null,
  reviewPly = 0;
function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "g-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}
function snapshotGame(result) {
  if (mode !== "ai" || !activeGameId || !keepCurrentGame) return;
  const old = state.games.find((x) => x.id === activeGameId);
  if (!old && !game.history().length) return;
  const record = {
    id: activeGameId,
    createdAt: old?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    initialFen: old?.initialFen || new Chess().fen(),
    moves: game.history(),
    human: old?.human || human,
    level: old?.level || state.level,
    result: result || old?.result || "未结束",
  };
  const index = state.games.findIndex((x) => x.id === record.id);
  if (index < 0) state.games.unshift(record);
  else state.games[index] = record;
  save();
}
function setKeepCurrent(keep) {
  keepCurrentGame = keep;
  state.saveGames = keep;
  if (!keep && activeGameId)
    state.games = state.games.filter((x) => x.id !== activeGameId);
  if (keep) snapshotGame();
  save();
}
function archiveHome() {
  const records = [...state.games].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  $("#app").innerHTML =
    `<section class="hero"><div><div class="eyebrow">棋局收藏 · 每一步都有发现</div><h1>我的棋局与复盘</h1><p>默认自动保存每一步，未结束的棋局也能继续下。复盘不会改变战绩。</p></div></section><div class="archive-list">${records.length ? records.map((r) => `<article class="card"><span class="pill">${escapeHTML(r.result)} · ${r.moves.length} 步</span><h2>${escapeHTML(new Date(r.createdAt).toLocaleDateString("zh-CN"))} 的棋局</h2><p>执${r.human === "w" ? "白" : "黑"} · ${escapeHTML(AI_LEVELS[r.level]?.name || "小棋友")}</p><div class="controls"><button onclick="openReview('${r.id}')">逐步复盘</button>${r.result === "未结束" ? `<button onclick="resumeGame('${r.id}')">继续这盘</button>` : ""}<button onclick="deleteGame('${r.id}')">删除棋局</button></div></article>`).join("") : '<div class="panel"><h2>第一盘棋，等你来收藏</h2><p>在人机对弈中走一步，就会自动保存。</p><button onclick="navigate(&quot;ai&quot;)">开始下棋</button></div>'}</div>`;
}
function deleteGame(id) {
  ask("删除这盘棋？", "只删除这盘收藏，战绩和训练进度保留。", () => {
    state.games = state.games.filter((x) => x.id !== id);
    if (activeGameId === id) {
      keepCurrentGame = false;
      activeGameId = null;
    }
    save();
    archiveHome();
  });
}
function restoreRecord(record, ply = record.moves.length) {
  const board = new Chess();
  if (record.initialFen && !board.load(record.initialFen)) return null;
  for (const move of record.moves.slice(0, ply))
    if (!board.move(move)) return null;
  return board;
}
function resumeGame(id) {
  const record = state.games.find((x) => x.id === id);
  if (!record || record.result !== "未结束") return;
  const restored = restoreRecord(record);
  if (!restored) {
    ask(
      "这盘棋暂时无法读取",
      "记录中有无效着法，可保留备份后重新开始。",
      () => {},
    );
    return;
  }
  stop();
  mode = "ai";
  clearPlanSession();
  game = restored;
  human = record.human;
  state.level = record.level;
  activeGameId = id;
  keepCurrentGame = true;
  ended = recorded = answered = false;
  flipped = human === "b";
  last = [];
  renderNav();
  renderGame();
  maybeAI();
}
function openReview(id) {
  const record = state.games.find((x) => x.id === id);
  if (!record) return;
  stop();
  clearPlanSession();
  mode = "review";
  reviewRecord = JSON.parse(JSON.stringify(record));
  reviewPly = 0;
  flipped = record.human === "b";
  answered = ended = false;
  renderNav();
  renderReview();
}
function reviewStep(delta) {
  if (!reviewRecord) return;
  reviewPly = Math.min(
    reviewRecord.moves.length,
    Math.max(0, reviewPly + delta),
  );
  renderReview();
  if (
    reviewPly === reviewRecord.moves.length &&
    !state.reviewed.includes(reviewRecord.id)
  ) {
    state.reviewed.push(reviewRecord.id);
    save();
  }
}
function renderReview() {
  const restored = restoreRecord(reviewRecord, reviewPly);
  if (!restored) {
    $("#app").innerHTML =
      '<div class="panel">棋谱中有无效着法，无法复盘。<button onclick="navigate(\'archive\')">返回棋局</button></div>';
    return;
  }
  game = restored;
  const h = game.history({ verbose: true }),
    move = h[h.length - 1];
  last = move ? [move.from, move.to] : [];
  layout(
    "一起回看这盘棋",
    `<span class="pill">${escapeHTML(reviewRecord.result)}</span><h2>第 ${reviewPly} / ${reviewRecord.moves.length} 步</h2><p>${reviewPly ? "刚才走的是 " + escapeHTML(reviewRecord.moves[reviewPly - 1]) : "这是开局时的棋盘。"}</p><div class="controls"><button ${reviewPly === 0 ? "disabled" : ""} onclick="reviewStep(-reviewPly)">回到开局</button><button ${reviewPly === 0 ? "disabled" : ""} onclick="reviewStep(-1)">← 退一步</button><button ${reviewPly === reviewRecord.moves.length ? "disabled" : ""} onclick="reviewStep(1)">下一步 →</button><button ${reviewPly === reviewRecord.moves.length ? "disabled" : ""} onclick="reviewStep(reviewRecord.moves.length)">看到最后</button><button onclick="flipped=!flipped;drawBoard()">翻转棋盘</button><button onclick="navigate('archive')">返回棋局</button></div><p class="tip">小问题：这一步有将军吗？对手有没有没保护的棋子？</p><ol class="review-moves">${reviewRecord.moves.map((m, i) => `<li><button class="${i === reviewPly - 1 ? "active" : ""}" onclick="reviewStep(${i + 1}-reviewPly)">${i + 1}. ${escapeHTML(m)}</button></li>`).join("")}</ol>`,
  );
}
