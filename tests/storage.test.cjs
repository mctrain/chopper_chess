const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { setup } = require("./helpers.cjs");
test("v1 progress migrates without losing puzzle IDs, practice, badges, stats or preferences", () => {
  const old = {
    solved: ["q025"],
    practice: ["q007"],
    wins: 3,
    losses: 2,
    draws: 1,
    theme: "dark",
    muted: true,
    level: 4,
  };
  const h = setup({ state: old });
  try {
    for (const key of [
      "solved",
      "practice",
      "wins",
      "losses",
      "draws",
      "theme",
      "level",
    ])
      assert.deepEqual(h.json("state." + key), old[key]);
    assert.equal(h.run("state.version"), 2);
    assert.equal(h.run("state.saveGames"), true);
    assert.equal(h.run("state.games.length"), 0);
    assert(h.w.document.body.classList.contains("dark"));
  } finally {
    h.close();
  }
});
test("corrupt JSON and invalid field types fail gracefully to usable defaults", () => {
  for (const input of [
    "{oops",
    {
      solved: null,
      practice: 3,
      games: [null],
      events: [{}, null],
      level: 999,
      attempts: -7,
      theme: "oops",
      planStart: "invalid",
    },
  ]) {
    const h = setup({ state: input });
    try {
      assert.equal(h.w.document.querySelectorAll(".calendar-day").length, 30);
      assert(Array.isArray(h.json("state.practice")));
      assert(h.run("state.level<=5&&state.level>=1"));
      assert.equal(h.run("state.attempts"), 0);
    } finally {
      h.close();
    }
  }
});
test("storage quota failures retain in-memory progress and display a visible warning", () => {
  const h = setup({ blockedStorage: true });
  try {
    h.run('navigate("practice");startPractice(0,0)');
    h.solve();
    assert.equal(h.run("storageOK"), false);
    assert.equal(h.run("state.practice.length"), 1);
    assert.equal(h.w.document.querySelector("#storageAlert").hidden, false);
  } finally {
    h.close();
  }
});
test("theme and difficulty persist without clearing training progress", () => {
  const h = setup();
  try {
    h.run('state.practice=["q007"];toggleTheme();state.level=5;save()');
    const reload = setup({ state: h.json("state") });
    try {
      assert.equal(reload.run("state.level"), 5);
      assert.equal(reload.run("state.practice[0]"), "q007");
      assert(reload.w.document.body.classList.contains("dark"));
    } finally {
      reload.close();
    }
  } finally {
    h.close();
  }
});
test("clear-all is confirmed and resets games, plan, evidence and mastery", () => {
  const h = setup();
  try {
    h.run('state.practice=["q007"];navigate("home")');
    h.w.document.querySelector(".data-controls button:last-child").click();
    assert.equal(h.run("state.practice.length"), 1);
    h.w.document.querySelector("#confirmYes").click();
    assert.equal(h.run("state.practice.length"), 0);
    assert.equal(h.run("state.games.length"), 0);
    assert.equal(h.run("state.events.length"), 0);
  } finally {
    h.close();
  }
});
