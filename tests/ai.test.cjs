const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { setup } = require("./helpers.cjs");
test("five child-friendly levels have increasing depth and decreasing randomness", () => {
  const h = setup();
  try {
    const c = h.json("AI_LEVELS.slice(1)");
    assert.equal(c.length, 5);
    assert.equal(new Set(c.map((x) => x.name)).size, 5);
    assert(c.every((x) => x.depth <= 2));
    for (let i = 1; i < c.length; i++) {
      assert(c[i].depth >= c[i - 1].depth);
      assert(c[i].blunder < c[i - 1].blunder);
    }
    assert(c[4].blunder >= 0.15);
  } finally {
    h.close();
  }
});
test("every level emits legal moves without changing caller FEN or history", () => {
  const h = setup();
  try {
    h.run(
      `for(const fen of [new Chess().fen(),'7k/8/8/3q4/8/8/3R4/K7 w - - 0 1'])for(let level=1;level<=5;level++){const b=new Chess(fen),before=b.fen(),history=JSON.stringify(b.history());const m=chooseMove(b,level,false,()=>.6);if(b.fen()!==before||JSON.stringify(b.history())!==history||!b.move(m))throw Error('AI mutated or illegal '+level)}`,
    );
  } finally {
    h.close();
  }
});
test("lowest level prioritizes legal captures and highest still has random play", () => {
  const h = setup();
  try {
    assert.equal(
      h.run(
        "chooseMove(new Chess('7k/8/8/3q4/8/8/3R4/K7 w - - 0 1'),1,false,()=>0).captured",
      ),
      "q",
    );
    h.run('navigate("ai")');
    assert.equal(h.w.document.querySelectorAll("#difficulty option").length, 5);
  } finally {
    h.close();
  }
});
test("deterministic hint repeats and completed games emit no move", () => {
  const h = setup();
  try {
    assert(
      h.run(
        `{const b=new Chess();JSON.stringify(chooseMove(b,5,true))===JSON.stringify(chooseMove(b,5,true))}`,
      ),
    );
    assert.equal(
      h.run("chooseMove(new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1'),5)"),
      null,
    );
  } finally {
    h.close();
  }
});
