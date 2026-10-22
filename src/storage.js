// Keep the v1 key: upgrading must preserve the child's existing progress.
const KEY = "xiaoba-chess-v1";
const $ = (selector) => document.querySelector(selector);
function localDate(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function fresh() {
  return {
    version: 2,
    solved: [],
    correct: 0,
    attempts: 0,
    streak: 0,
    best: 0,
    practice: [],
    wins: 0,
    losses: 0,
    draws: 0,
    queue: [],
    cursor: 0,
    theme: "light",
    muted: false,
    level: 1,
    games: [],
    saveGames: true,
    lessonDone: [],
    events: [],
    planStart: localDate(),
    reviewed: [],
  };
}
function migrateState(input) {
  const defaults = fresh(),
    s = {
      ...defaults,
      ...(input && typeof input === "object" && !Array.isArray(input)
        ? input
        : {}),
    };
  for (const key of ["solved", "practice", "queue", "lessonDone", "reviewed"])
    s[key] = Array.isArray(s[key])
      ? [...new Set(s[key].filter((x) => typeof x === "string"))]
      : [];
  s.games = Array.isArray(s.games)
    ? s.games.filter(
        (x) =>
          x &&
          typeof x.id === "string" &&
          Array.isArray(x.moves) &&
          x.moves.every((m) => typeof m === "string") &&
          ["w", "b"].includes(x.human),
      )
    : [];
  s.events = Array.isArray(s.events)
    ? s.events.filter(
        (x) =>
          x &&
          typeof x.id === "string" &&
          ["puzzle", "practice", "lesson"].includes(x.kind) &&
          /^\d{4}-\d{2}-\d{2}$/.test(x.date),
      )
    : [];
  for (const key of [
    "correct",
    "attempts",
    "streak",
    "best",
    "wins",
    "losses",
    "draws",
    "cursor",
  ])
    s[key] = Number.isFinite(s[key]) ? Math.max(0, Math.floor(s[key])) : 0;
  s.level = Math.min(5, Math.max(1, Math.floor(Number(s.level) || 1)));
  s.theme = s.theme === "dark" ? "dark" : "light";
  s.saveGames = s.saveGames !== false;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s.planStart) ||
    Number.isNaN(new Date(s.planStart + "T12:00:00").getTime())
  )
    s.planStart = defaults.planStart;
  s.version = 2;
  return s;
}
let storageOK = true,
  state;
try {
  state = migrateState(JSON.parse(localStorage.getItem(KEY) || "{}"));
} catch {
  state = fresh();
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
  }
  const alert = $("#storageAlert");
  if (alert) {
    alert.hidden = storageOK;
    alert.textContent = storageOK
      ? ""
      : "当前浏览器无法保存进度或空间已满。请先导出备份，避免关闭页面后丢失记录。";
  }
  return storageOK;
}
function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function downloadJSON() {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  link.download = "chopper-chess-" + localDate() + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
