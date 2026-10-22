let lessonDemo = false,
  lessonIndex = 0,
  demoPly = 0;
const phaseNames = {
  opening: "开局 · 发展与王安全",
  middle: "中局 · 观察与战术",
  ending: "残局 · 配合与收尾",
};
function learnHome() {
  $("#app").innerHTML =
    `<section class="hero"><div><div class="eyebrow">学一点 · 看一步 · 自己试</div><h1>小棋手的三间课堂</h1><p>先看三个小提醒，再一步步看示范，最后自己走一遍。</p></div></section>${Object.entries(
      phaseNames,
    )
      .map(
        ([phase, name]) =>
          `<div class="section-head"><h2>${name}</h2><span class="sub">${state.lessonDone.filter((id) => LESSONS.some((l) => l.id === id && l.phase === phase)).length} / 10 已完成</span></div><section class="lesson-grid">${LESSONS.filter(
            (l) => l.phase === phase,
          )
            .map(
              (l) =>
                `<button class="lesson-card" onclick="openLesson('${l.id}')"><span class="pill">${state.lessonDone.includes(l.id) ? "✓ 已掌握" : "约 12 分钟"}</span><b>${l.title}</b><small>${l.points[0]}</small><span>进入小课堂 →</span></button>`,
            )
            .join("")}</section>`,
      )
      .join("")}`;
}
function openLesson(id) {
  const i = LESSONS.findIndex((l) => l.id === id);
  if (i < 0) return;
  stop();
  mode = "lesson";
  lessonIndex = i;
  demoPly = 0;
  lessonDemo = true;
  renderNav();
  renderLesson();
}
function renderLesson() {
  const lesson = LESSONS[lessonIndex];
  game = new Chess(lesson.exercise.fen);
  flipped = game.turn() === "b";
  last = [];
  for (const uci of lesson.demoMoves.slice(0, demoPly)) {
    const m = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
    last = [m.from, m.to];
  }
  layout(
    lesson.title,
    `${planBanner()}<span class="pill">${phaseNames[lesson.phase]}</span><ol class="lesson-points">${lesson.points.map((t) => `<li>${t}</li>`).join("")}</ol><div class="status"><b>${demoPly ? "示范：" + lesson.exercise.explain : "先观察这个局面"}</b>${lesson.exercise.goal}</div><div class="controls"><button ${demoPly === 0 ? "disabled" : ""} onclick="demoPly--;renderLesson()">← 回到前一步</button><button ${demoPly === lesson.demoMoves.length ? "disabled" : ""} onclick="demoPly++;renderLesson()">播放下一步 →</button><button class="wide primary" onclick="beginLessonExercise()">我来独立试一遍</button><button class="wide" onclick="navigate('learn')">返回小课堂</button></div><p class="tip">示范和阅读不会打勾，自己完成下面的练习才算学会。</p>`,
  );
}
function beginLessonExercise() {
  stop();
  lessonDemo = false;
  current = LESSONS[lessonIndex].exercise;
  startExercise();
}
