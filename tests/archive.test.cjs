const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { setup } = require("./helpers.cjs");
test("AI autosaves after human and AI moves; unfinished game survives reload", () => {
  const h = setup();
  try {
    h.run('navigate("ai");clickSquare("e2");clickSquare("e4")');
    assert.equal(h.run("state.games.length"), 1);
    assert.equal(h.run("state.games[0].moves.length"), 1);
    h.flush();
    assert.equal(h.run("state.games[0].moves.length"), 2);
    const saved = h.json("state");
    const reload = setup({ state: saved });
    try {
      reload.run("resumeGame(state.games[0].id)");
      assert.equal(reload.run("game.history().length"), 2);
      assert.equal(reload.run("game.fen()"), h.run("game.fen()"));
    } finally {
      reload.close();
    }
  } finally {
    h.close();
  }
});
test("opt-out removes current archive and never silently recreates it", () => {
  const h = setup();
  try {
    h.run(
      'navigate("ai");clickSquare("e2");clickSquare("e4");setKeepCurrent(false)',
    );
    h.flush();
    assert.equal(h.run("state.games.length"), 0);
    h.run(
      'navigate("home");navigate("ai");clickSquare("d2");clickSquare("d4")',
    );
    assert.equal(h.run("state.games.length"), 0);
  } finally {
    h.close();
  }
});
test("undo updates the saved game and navigation cancels delayed AI", () => {
  const h = setup();
  try {
    h.run('navigate("ai");clickSquare("e2");clickSquare("e4");undo()');
    h.flush();
    assert.equal(h.run("game.history().length"), 0);
    assert.equal(h.run("state.games[0].moves.length"), 0);
    h.run('clickSquare("d2");clickSquare("d4");navigate("home")');
    h.flush();
    assert.equal(h.run("mode"), "home");
    assert.equal(h.run("state.games[0].moves.length"), 1);
  } finally {
    h.close();
  }
});
test("review forward/backward reaches exact positions and cannot change stats or archive", () => {
  const h = setup();
  try {
    h.run('navigate("ai");clickSquare("e2");clickSquare("e4")');
    h.flush();
    const before = h.json("state");
    h.run("openReview(state.games[0].id)");
    assert.equal(h.run("reviewPly"), 0);
    h.run("reviewStep(1)");
    assert.equal(h.run('game.get("e4").type'), "p");
    const fen = h.run("game.fen()");
    h.run(
      'clickSquare("d2");clickSquare("d4");attemptMove({from:"d2",to:"d4"})',
    );
    assert.equal(h.run("game.fen()"), fen);
    h.run("reviewStep(999);reviewStep(-999)");
    assert.equal(h.run("reviewPly"), 0);
    assert.deepEqual(h.json("state.games"), before.games);
    assert.equal(h.run("state.wins"), 0);
    assert.equal(h.run("state.losses"), 0);
    assert.equal(h.run("state.draws"), 0);
  } finally {
    h.close();
  }
});
test("replay handles castling, capture, en passant and underpromotion SAN", () => {
  const h = setup();
  try {
    h.run(
      `for(const [fen,moves] of [['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',['O-O','O-O-O']],['7k/8/8/3pP3/8/8/8/K7 w - d6 0 2',['exd6']],['7k/P7/8/8/8/8/8/7K w - - 0 1',['a8=N']]]){const r={initialFen:fen,moves};const b=restoreRecord(r);if(!b||b.history().length!==moves.length)throw Error('Replay special move')}`,
    );
  } finally {
    h.close();
  }
});
test("deletion requires confirmation, affects only one game and preserves stats", () => {
  const h = setup();
  try {
    h.run(
      'navigate("ai");clickSquare("e2");clickSquare("e4");navigate("archive");deleteGame(state.games[0].id)',
    );
    assert.equal(h.run("state.games.length"), 1);
    h.w.document.querySelector("#confirmYes").click();
    assert.equal(h.run("state.games.length"), 0);
    assert.equal(h.run("state.wins"), 0);
  } finally {
    h.close();
  }
});
test("game result is recorded once and resuming invalid notation is rejected", () => {
  const h = setup();
  try {
    h.run(
      `navigate('ai');stop();game=new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');updateGameStatus();updateGameStatus()`,
    );
    assert.equal(h.run("state.wins"), 1);
    assert.equal(h.run("restoreRecord({moves:['illegal']})"), null);
  } finally {
    h.close();
  }
});
