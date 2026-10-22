# AxureShow update and verification

Existing project name: 小马国际象棋训练营.
Existing public URL: https://www.axxiu.cn/project/vYZO48Ko/

1. Build and test first. Keep `releases/axureshow-inline.html` and `releases/manifest.json` unchanged between verification and deployment.
2. Open AxureShow project management in the authorized browser. Confirm a signed-in signal. Use secure authentication capabilities if available; otherwise hand off the actual browser session. The user's independent browser login does not authenticate an agent's cloud browser.
3. Find the existing project by both name and public URL. Click **更新**, then **直接粘贴单HTML代码 (点击切换)**.
4. Fill **粘贴新 HTML 代码** with the generated release file. Click **确认更新**. This is the free update flow; the separate online **编辑** function may require paid membership.
5. Do not rely on the progress text alone. This service can leave it at 0% even when the new content is live. Open the original public URL in a fresh tab and inspect the actual calendar/module changes.
6. Verify the board uses inline SVG (`#board svg.piece`), that occupied-square count equals SVG count, and that no `#board img` remains. Use read-only DOM checks; never read user secrets or hidden application stores.
7. Click through an assigned daily task, a lesson's demo/challenge, and a saved-game forward/backward review. Avoid clearing any user data. Use an isolated test profile when available; otherwise do not manufacture persistent progress on the user's profile merely for a test.
8. Dismiss the non-binding prototype reminder with “我知道了” if displayed. Platform comment/report widgets are injected hosting UI; do not modify them by scripting the hosting service.
9. Verify the final URL after redirects, preserve it literally, and report whether the original URL retained access. Do not guarantee mainland ISP latency or Safari performance without a real local measurement.

If directory upload was used instead, require a visible selected-file count before confirming. If none appears, use the single-HTML path above. Never retry confirmation blindly or publish a folder that the UI did not actually select.

If authentication or hosting access fails, preserve the tested build and explain the exact blocker. Do not create new hosting accounts, accept new binding terms or buy upgrades without the user's applicable authorization.
