const { JSDOM } = require("jsdom");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const scripts = [
  "pieces",
  "ai",
  "content",
  "storage",
  "archive",
  "planner",
  "lessons",
  "exercises",
  "badges",
  "app",
  "bootstrap",
];
function setup(options = {}) {
  const html = fs
    .readFileSync(path.join(root, "src/index.html"), "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, "");
  const dom = new JSDOM(html, {
      runScripts: "dangerously",
      url: "https://chess.test/",
    }),
    w = dom.window;
  const timers = new Map();
  let serial = 0;
  w.setTimeout = (fn) => {
    timers.set(++serial, fn);
    return serial;
  };
  w.clearTimeout = (id) => timers.delete(id);
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  if (options.date) {
    const NativeDate = w.Date;
    w.Date = class extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [options.date]));
      }
      static now() {
        return new NativeDate(options.date).getTime();
      }
    };
  }
  if (options.state)
    w.localStorage.setItem(
      "xiaoba-chess-v1",
      typeof options.state === "string"
        ? options.state
        : JSON.stringify(options.state),
    );
  if (options.blockedStorage)
    Object.defineProperty(w.Storage.prototype, "setItem", {
      value() {
        throw new Error("QuotaExceededError");
      },
    });
  const context = dom.getInternalVMContext(),
    run = (code) => vm.runInContext(code, context);
  run(fs.readFileSync(path.join(root, "vendor/chess.js"), "utf8"));
  for (const name of scripts)
    run(fs.readFileSync(path.join(root, "src", name + ".js"), "utf8"));
  run("state.muted=true");
  return {
    w,
    run,
    dom,
    setDate(date) {
      options.date = date;
    },
    flush() {
      const pending = [...timers.values()];
      timers.clear();
      for (const fn of pending) fn();
    },
    close() {
      run("stop()");
      dom.window.close();
    },
    json(code) {
      return JSON.parse(run("JSON.stringify(" + code + ")"));
    },
    solve() {
      run(
        "attemptMove({from:current.solution.slice(0,2),to:current.solution.slice(2,4),promotion:current.solution[4]})",
      );
    },
  };
}
module.exports = { setup, root };
