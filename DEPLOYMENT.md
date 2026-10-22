# Deployment record

## 2026-10-22 — curriculum and daily-plan release

- Target: existing AxureShow project **小马国际象棋训练营**.
- Verified live URL: https://www.axxiu.cn/project/vYZO48Ko/
- Application source commit: `455131c` (followed by documentation/skill commit `705e5a1`).
- Release: `releases/axureshow-inline.html`, built by `tools/build.py`.
- SHA-256: `bf0d835e4da6a529a39885b8d2f0f1529332127e4c40e14aae6852034e9e7b6b`.
- Release bytes: 350971.
- Publication method: existing project's 更新 → 直接粘贴单HTML代码 → 确认更新.
- Result: verified in a fresh browser tab at the original URL. The platform progress indicator stayed at 0%; the live page conclusively showed the new features.

## Verification evidence

- Portable skill validated with the skill creator's quick validator.
- Bundled release gate ran successfully: **38/38 Node/jsdom tests**; **330 legal FENs with unique objective solutions** verified by python-chess; 30 legal lesson demonstrations; manifest matches exact HTML bytes.
- Real cloud Chrome UI checked: 30-day calendar, weekday task deep link to the assigned puzzle, three occupied squares matched three inline SVGs and zero board images, all five new AI labels, human e4 and AI f5 response, automatic two-ply archive, review forward to e4 and backward to initial position, 30 classroom cards, opening demo playback and independent-exercise board with 32 inline SVGs.
- No lesson or puzzle completion was manufactured through developer scripts; task completion regressions run in isolated jsdom.
- Calendar screenshot saved as a user-facing proof outside the Git repository.
- Runtime console observation included browser-extension metadata errors; these are extension URLs, not application errors.
- Actual iPad/Safari rendering, mainland ISP latency and long-term hosting availability were not measured in this environment.

## Source publication status

GitHub target: `https://github.com/mctrain/chopper_chess.git`, branch `main`.
The original remote `main` commit `1e308c8bba2db70d153e0b31add871d797c380e2` was fetched and merged without rewriting its history.

At the time of this record, source changes exist in multiple local commits. HTTPS push needs credentials; SSH connections close before key exchange, including the provider's normal port-443 endpoint. A deploy public key was supplied and the user configured it, but this environment has not reached SSH authentication. The GitHub plugin reports installed but has not exposed its repository/write tools in this running tool session. **Do not claim that GitHub push succeeded without a successful push and remote HEAD verification.**

A local Git bundle can preserve the full history until transport is available. The deployment is independent of GitHub push and has been verified separately.
