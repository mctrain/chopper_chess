---
name: maintain-chopper-chess
description: Maintain the Chopper Chess child training SPA in mctrain/chopper_chess. Use for feature changes, bugs, curriculum or daily-plan changes, game replay, tests, GitHub commits, release builds, and verifying or updating the existing AxureShow deployment. Carry changes through implementation, tests, browser verification and authorized publication.
---

# Maintain Chopper Chess

## Establish scope

1. Locate the checkout using `README.md`, `package.json` and `AGENTS.md`. Read those files and inspect `git status`, remotes and recent commits. Preserve unrelated user edits and the repository's history.
2. Identify the requested behavior and affected state contracts before editing. Read only the modules listed in the README that own that behavior.
3. Keep offline classic scripts, local cburnett SVGs, Chinese child-friendly UI, 48px touch targets and the existing hosting URL. Never add a runtime CDN or per-piece image network request.

## Implement

1. Edit `src/`, `data/`, `tools/` and behavioral tests. Do not patch generated `dist/index.html`, `src/content.js`, `src/pieces.js` or release HTML by hand.
2. Preserve published IDs and the `xiaoba-chess-v1` localStorage key. Add migration tests for schema changes. Cancel pending board timers through `stop()`/`epoch` before navigation.
3. Keep replay read-only. Update archives after each human/AI move and undo; do not write game stats during review.
4. Record training completion only after an independent correct answer. Derive the evidence date from device-local today. Never let a calendar selector, manual checkbox, demo playback or shown answer create completion evidence.
5. Keep AI at most two half-moves deep with child-appropriate mistakes. Use seeded randomness for tests rather than claiming strict strength ordering on every random move.
6. For curriculum changes, read `tools/data_rules.py`. Define a semantic objective predicate independent of the stored solution, verify legal FENs and enumerate all legal candidate moves. Opening exercises teach specified actions, not a claim that only one opening move is objectively best.

## Test and package

1. Install declared dev dependencies if absent: `npm ci`, then a local Python venv and `pip install -r requirements-dev.txt`. Activate that venv for the following commands.
2. Run the bundled gate from the checkout:

   ```bash
   python .agents/skills/maintain-chopper-chess/scripts/check_release.py --repo .
   ```

   This runs `npm run check` (data validation, build and tests) and verifies the release checksum. Fix root causes before continuing. Add regressions for changed behavior; never weaken expected results to silence failures.
3. Inspect the actual generated HTML in an available supported browser. Verify calendar/task navigation, complete SVG rendering, human/AI moves, saved-game replay forward/backward, a lesson challenge, and dark mode. Check a narrow/iPad landscape layout if the browser supports it. If unavailable, report that limit honestly; do not substitute jsdom for real Safari testing.
4. Split commits by coherent feature or fix, including relevant tests. Commit generated files only after building. Exclude credentials, localStorage dumps and personal screenshots.

## Push and publish

1. Push to the explicitly authorized remote without force, then compare remote HEAD to the local commit. If history advanced, fetch and reconcile instead of overwriting it. If credentials are absent, offer a public deploy key; never request secrets in chat or commit private keys.
2. Distinguish transport errors from authentication errors. If a connection closes before key exchange, do not blame the deploy key. Preserve commits and provide an honest blocker or a verified supported connector path.
3. Read [the hosting procedure](references/axureshow.md) before deploying. Update the existing project with `releases/axureshow-inline.html`; do not create a new project just because a progress bar stalls.
4. Use the platform's supported secure browser login or user takeover. Never automate password entry through ordinary page controls or save credentials in this skill.
5. Verify the literal original deployed URL in a fresh tab. Require visible new-version evidence, exercise rendering, task navigation and archived replay. Save a screenshot of the non-sensitive result when the environment supports it.
6. Update `DEPLOYMENT.md` with the verified commit/build checksum, deployment result and verification limitations. Report tests, commits/push status and the deployed URL. Never call a successful build a successful deployment.

This skill packages a workflow, not an authentication token or an undocumented hosting API. Other agents can run the same commands and follow the UI with their own authorized browser session.
