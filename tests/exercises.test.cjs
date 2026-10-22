const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { setup, root } = require("./helpers.cjs");
const fs = require("node:fs"),
  path = require("node:path");
test("all 330 positions load, render every piece inline, and accept the validated solution", () => {
  const h = setup();
  try {
    h.run(
      `for(const q of [...GROUPS.flatMap(g=>g.items),...PUZZLES,...LESSONS.map(l=>l.exercise)]){current=q;mode='puzzles';startExercise();if(document.querySelectorAll('#board .sq').length!==64||document.querySelectorAll('#board svg.piece').length!==game.board().flat().filter(Boolean).length||document.querySelector('#board img'))throw Error('Rendering '+q.id);const m=game.move({from:q.solution.slice(0,2),to:q.solution.slice(2,4),promotion:q.solution[4]});if(!m||(q.kind==='mate'&&!game.in_checkmate()))throw Error('Solution '+q.id)}`,
    );
  } finally {
    h.close();
  }
});
test("wrong practice moves preserve FEN, correct move grants progress once", () => {
  const h = setup();
  try {
    h.run('navigate("practice");startPractice(0,0)');
    const fen = h.run("game.fen()");
    h.run('clickSquare("a1");clickSquare("a2")');
    assert.equal(h.run("game.fen()"), fen);
    assert.equal(h.run("wrong"), true);
    h.solve();
    h.solve();
    assert.equal(h.run("state.practice.length"), 1);
    assert.equal(h.run("state.events.length"), 1);
  } finally {
    h.close();
  }
});
test("promotion selection contains four synchronous SVG pieces and underpromotion remains legal", () => {
  const h = setup();
  try {
    h.run(
      'navigate("practice");startPractice(2,4);clickSquare(current.solution.slice(0,2));clickSquare(current.solution.slice(2,4))',
    );
    assert(h.w.document.querySelector("#promotion").open);
    assert.equal(
      h.w.document.querySelectorAll("#promoteChoices svg.piece").length,
      4,
    );
    h.w.document.querySelector("#promoteChoices button").click();
    assert.equal(h.run("answered"), true);
    h.run(
      `navigate('local');game=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');renderGame();clickSquare('a7');clickSquare('a8')`,
    );
    h.w.document.querySelector('[aria-label="升变为马"]').click();
    assert.equal(h.run('game.get("a8").type'), "n");
  } finally {
    h.close();
  }
});
test("en passant exercise removes passed pawn and highlights both move squares", () => {
  const h = setup();
  try {
    h.run('navigate("practice");startPractice(2,5)');
    h.solve();
    assert.equal(h.run('game.get("d5")'), null);
    assert.equal(h.run('game.get("d6").color'), "w");
    assert.equal(h.w.document.querySelectorAll(".sq.last").length, 2);
  } finally {
    h.close();
  }
});
test("puzzle accuracy counts first attempt only, wrong retries reset streak, hints count once", () => {
  const h = setup();
  try {
    h.run(
      'navigate("puzzles");attemptMove({from:"a1",to:"a1"});attemptMove({from:"a1",to:"a1"})',
    );
    h.solve();
    assert.equal(h.run("state.attempts"), 1);
    assert.equal(h.run("state.correct"), 0);
    assert.equal(h.run("state.streak"), 0);
    h.flush();
    h.run("giveHint();giveHint()");
    h.solve();
    assert.equal(h.run("state.attempts"), 2);
    assert.equal(h.run("state.correct"), 0);
  } finally {
    h.close();
  }
});
test("180 random puzzle IDs do not repeat until a whole round is done", () => {
  const h = setup();
  try {
    h.run('navigate("puzzles")');
    const queue = h.json("state.queue");
    assert.equal(queue.length, 180);
    assert.equal(new Set(queue).size, 180);
    h.run("state.cursor=180;startPuzzle()");
    assert.equal(h.run("state.cursor"), 0);
    assert.equal(h.run("state.queue.length"), 180);
  } finally {
    h.close();
  }
});
test("navigation cancels answer reveal and next-puzzle timers without mutating destination", () => {
  const h = setup();
  try {
    h.run('navigate("puzzles");showAnswer();navigate("local")');
    const fen = h.run("game.fen()");
    h.flush();
    assert.equal(h.run("game.fen()"), fen);
    assert.equal(h.run("mode"), "local");
    h.run('navigate("puzzles")');
    h.solve();
    h.run('navigate("home")');
    h.flush();
    assert.equal(h.run("mode"), "home");
  } finally {
    h.close();
  }
});
test("board orientation, square colors, selection, hint and check remain correct", () => {
  const h = setup();
  try {
    h.run('navigate("local");clickSquare("e2")');
    assert.equal(h.w.document.querySelectorAll(".sq.selected").length, 1);
    assert.equal(h.w.document.querySelectorAll(".sq .dot").length, 2);
    assert(
      h.w.document
        .querySelector('[aria-label="a1 白车"]')
        .classList.contains("dark-square"),
    );
    h.run("flipped=true;drawBoard()");
    assert.equal(
      h.w.document.querySelector(".sq").getAttribute("aria-label"),
      "h1 白车",
    );
    h.run("game=new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');drawBoard()");
    assert.equal(h.w.document.querySelectorAll(".sq.check").length, 1);
  } finally {
    h.close();
  }
});
test("20 badges unlock only for fully completed themes", () => {
  const h = setup();
  try {
    assert.equal(h.run("earnedBadges().length"), 0);
    h.run("state.practice=GROUPS[0].items.slice(0,5).map(q=>q.id)");
    assert.equal(h.run("earnedBadges().length"), 0);
    h.run('state.practice.push(GROUPS[0].items[5].id);navigate("home")');
    assert.equal(h.run("earnedBadges().length"), 1);
    assert.equal(h.w.document.querySelectorAll(".badge").length, 20);
  } finally {
    h.close();
  }
});
test("all rendered onclick handlers compile across screens and special dialog states", () => {
  const h = setup();
  try {
    for (const screen of [
      "home",
      "ai",
      "practice",
      "puzzles",
      "local",
      "learn",
      "archive",
    ]) {
      h.run(`navigate('${screen}')`);
      for (const e of h.w.document.querySelectorAll("[onclick]"))
        assert.doesNotThrow(() => new Function(e.getAttribute("onclick")));
    }
    h.run("openLesson('opening-1')");
    for (const e of h.w.document.querySelectorAll("[onclick]"))
      assert.doesNotThrow(() => new Function(e.getAttribute("onclick")));
  } finally {
    h.close();
  }
});
