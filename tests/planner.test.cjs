const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { setup } = require("./helpers.cjs");
test("30 consecutive local dates, weekdays 25m, weekends 56m and sufficient unique tasks", () => {
  for (const date of [
    "2026-10-22T12:00:00",
    "2026-02-20T12:00:00",
    "2026-12-20T12:00:00",
  ]) {
    const h = setup({ date });
    try {
      const plan = h.json("trainingPlan()");
      assert.equal(plan.length, 30);
      const ids = [];
      for (const day of plan) {
        assert.equal(day.minutes, day.weekend ? 56 : 25);
        assert.equal(day.tasks.length, day.weekend ? 5 : 2);
        for (const task of day.tasks) {
          assert(task.items.length > 0);
          ids.push(...task.items);
        }
      }
      assert.equal(ids.length, new Set(ids).size);
      assert.equal(h.w.document.querySelectorAll(".calendar-day").length, 30);
      assert.equal(
        h.w.document.querySelectorAll("input[type=checkbox]").length,
        0,
      );
    } finally {
      h.close();
    }
  }
});
test("clicking task deep-links to assigned exercise; only correct legal completion counts", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    h.run("launchTask(localDate(),0)");
    assert.equal(
      h.run("current.id"),
      h.run("trainingPlan()[0].tasks[0].items[0]"),
    );
    assert.equal(
      h.run("completionFor(localDate(),trainingPlan()[0].tasks[0])"),
      0,
    );
    h.run("attemptMove({from:'a1',to:'a1'})");
    assert.equal(h.run("state.events.length"), 0);
    h.solve();
    assert.equal(
      h.run("completionFor(localDate(),trainingPlan()[0].tasks[0])"),
      1,
    );
    h.solve();
    assert.equal(h.run("state.events.length"), 1);
  } finally {
    h.close();
  }
});
test("five assigned puzzles complete task and return to calendar, without changing random cursor", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    h.run("launchTask(localDate(),0)");
    for (let i = 0; i < 5; i++) {
      h.solve();
      h.flush();
    }
    assert.equal(h.run("mode"), "home");
    assert.equal(
      h.run("completionFor(localDate(),trainingPlan()[0].tasks[0])"),
      5,
    );
    assert.equal(h.run("state.cursor"), 0);
    assert(h.w.document.querySelector(".task.done"));
  } finally {
    h.close();
  }
});
test("hints and shown answers never mark planner tasks, independent retry can", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    h.run("launchTask(localDate(),1);giveHint()");
    h.solve();
    assert.equal(h.run("state.events.length"), 0);
    h.run("retryIndependently()");
    h.solve();
    assert.equal(h.run("state.events.length"), 1);
    h.run("nextPractice();showAnswer()");
    h.flush();
    assert.equal(h.run("state.events.length"), 1);
    h.run("retryExercise()");
    h.solve();
    assert.equal(h.run("state.events.length"), 1);
  } finally {
    h.close();
  }
});
test("future and past views cannot backdate completion; unrelated practice does not fill assigned task", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    h.run("launchTask(dayOffset(localDate(),1),0)");
    h.solve();
    assert.equal(
      h.run(
        "completionFor(dayOffset(localDate(),1),trainingPlan()[1].tasks[0])",
      ),
      0,
    );
    assert.equal(h.run("state.events[0].date"), h.run("localDate()"));
    h.run('navigate("practice");startPractice(19,5)');
    h.solve();
    assert.equal(
      h.run("completionFor(localDate(),trainingPlan()[0].tasks[1])"),
      0,
    );
  } finally {
    h.close();
  }
});
test("progress survives reload and events deduplicate per date/kind/id", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    h.run("launchTask(localDate(),0)");
    h.solve();
    const reload = setup({
      state: h.json("state"),
      date: "2026-10-22T12:00:00",
    });
    try {
      assert.equal(
        reload.run("completionFor(localDate(),trainingPlan()[0].tasks[0])"),
        1,
      );
      reload.run("launchTask(localDate(),0)");
      assert.notEqual(reload.run("current.id"), h.run("current.id"));
    } finally {
      reload.close();
    }
  } finally {
    h.close();
  }
});
test("demo and reading never complete lesson; correct challenge does and weekend deep link works", () => {
  const h = setup({ date: "2026-10-24T12:00:00" });
  try {
    h.run("launchTask(localDate(),2)");
    assert.equal(h.run("mode"), "lesson");
    h.run("demoPly++;renderLesson()");
    assert.equal(h.run("state.events.length"), 0);
    h.run("beginLessonExercise()");
    h.solve();
    assert.equal(h.run("state.lessonDone.length"), 1);
    assert.equal(
      h.run("completionFor(localDate(),trainingPlan()[0].tasks[2])"),
      1,
    );
  } finally {
    h.close();
  }
});
test("weekday training never assigns lessons and missed days are not silently completed", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    assert(
      h.run(
        'trainingPlan().filter(d=>!d.weekend).every(d=>d.tasks.every(t=>t.kind!=="lesson"))',
      ),
    );
    assert(h.run("trainingPlan().every(d=>!dayComplete(d))"));
  } finally {
    h.close();
  }
});

test("non-today preview progresses through assigned items without backdating evidence", () => {
  const h = setup({ date: "2026-10-22T12:00:00" });
  try {
    h.run("launchTask(dayOffset(localDate(),1),0)");
    const first = h.run("current.id");
    h.solve();
    h.flush();
    assert.notEqual(h.run("current.id"), first);
    assert.equal(h.run("planRemaining().length"), 4);
    for (let i = 0; i < 4; i++) {
      h.solve();
      h.flush();
    }
    assert.equal(h.run("mode"), "home");
    assert.equal(
      h.run(
        "completionFor(dayOffset(localDate(),1),trainingPlan()[1].tasks[0])",
      ),
      0,
    );
    assert(h.run("state.events.every(e=>e.date===localDate())"));
  } finally {
    h.close();
  }
});

test("a session spanning midnight advances but only records the actual completion day", () => {
  const h = setup({ date: "2026-10-22T23:59:00" });
  try {
    h.run("launchTask(localDate(),0)");
    const first = h.run("current.id");
    h.setDate("2026-10-23T00:01:00");
    h.solve();
    h.flush();
    assert.notEqual(h.run("current.id"), first);
    assert.equal(h.run("state.events[0].date"), "2026-10-23");
    assert.equal(
      h.run("completionFor('2026-10-22',trainingPlan()[0].tasks[0])"),
      0,
    );
  } finally {
    h.close();
  }
});
