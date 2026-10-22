# Agent maintenance contract

Read README.md for the architecture, state contracts, curriculum predicates and deployment procedure before editing.

- Edit `src/`, `data/`, `tools/`, or `tests/`. Build outputs in `dist/` and `releases/` are generated. `src/content.js` and `src/pieces.js` are generated too.
- Keep classic scripts and file:// compatibility. No runtime CDN, fetch-loaded data, service backend, external fonts, or per-piece image requests.
- Run `npm ci`; activate a Python venv with `requirements-dev.txt`; use `npm run check` before publishing.
- Keep the `xiaoba-chess-v1` storage key, preserve published exercise IDs, and add migration tests when schemas change.
- Only independent correct solutions create date/kind/id training evidence. Never add a manual completion checkbox or accept a calendar date as an evidence timestamp.
- Cancel asynchronous work via `stop()` / `epoch` before changing board ownership. Keep review read-only and never increment game stats from it.
- Keep all five AI levels gentle (maximum depth two half-moves). Explain probabilistic strength honestly.
- Use Prettier defaults, two spaces, named camelCase functions and single-purpose files. Prefer explicit state transitions over monkey-patching functions.
- Add focused behavioral regressions; never change an expected result just to make a failing test pass. Validate new FEN and objective uniqueness independently with python-chess.
- Preserve GitHub history and split commits by feature. Never force-push or commit secrets.
- Deploy changes to the existing AxureShow project using the generated single HTML, verify the original URL, and report any incomplete push/deployment honestly.
- The portable workflow skill is `.agents/skills/maintain-chopper-chess/SKILL.md`.
