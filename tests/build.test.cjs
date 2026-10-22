const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { JSDOM, VirtualConsole } = require("jsdom"),
  { root } = require("./helpers.cjs");
for (const name of ["dist/index.html", "releases/axureshow-inline.html"])
  test(
    name + " is independently runnable with zero runtime asset requests",
    () => {
      const errors = [],
        virtualConsole = new VirtualConsole();
      virtualConsole.on("jsdomError", (e) => errors.push(e));
      const d = new JSDOM(fs.readFileSync(path.join(root, name), "utf8"), {
        runScripts: "dangerously",
        url: "https://chess.test/",
        virtualConsole,
        beforeParse(w) {
          w.HTMLDialogElement.prototype.close = function () {};
          w.HTMLDialogElement.prototype.showModal = function () {};
        },
      });
      try {
        assert.equal(errors.length, 0, errors.map((e) => e.message).join("\n"));
        assert.equal(
          d.window.document.querySelectorAll(".calendar-day").length,
          30,
        );
        d.window.navigate("ai");
        assert.equal(
          d.window.document.querySelectorAll("#board svg.piece").length,
          32,
        );
        d.window.navigate("puzzles");
        assert(
          d.window.document.querySelectorAll("#board svg.piece").length >= 3,
        );
        assert.equal(
          d.window.document.querySelectorAll(
            "script[src],link[rel=stylesheet],#board img",
          ).length,
          0,
        );
      } finally {
        d.window.close();
      }
    },
  );
