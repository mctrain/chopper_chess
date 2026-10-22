# Chopper Chess · 小八的国象之旅

专为已有走子基础的 6 岁孩子制作的中文国象训练站。纯前端、无账户后端，双击 `dist/index.html` 即可用；iPad 横屏为主要交互场景。棋子沿用 lichess 官方 cburnett SVG，浅格 `#f0d9b5`、深格 `#b58863`，支持点击走子、升变、将军提示、音效和双主题。

线上入口：https://www.axxiu.cn/project/vYZO48Ko/

## 快速使用

- 首页日历安排首次使用当天起连续 30 天。工作日约 25 分钟，周末约 56 分钟，均为建议时长，可随时休息。
- 点 checklist 任务，直接进入当天指定的谜题、主题关卡或小课堂。自己走对后自动打勾，没有手动勾选入口。
- 提示或看答案后照走，不记独立完成；选择“重新独立挑战”可重新作答。
- 人机对弈默认逐步保存。取消“自动保留”会删除本盘收藏并停止保存；棋局列表中也可逐盘删除。
- “棋局复盘”可续下未完成棋局，或单步前进、回退、首步、末步、翻转及点击棋谱跳转。复盘不是引擎分析，不给着法评分。
- “学习小课堂”包含开局、中局、残局各 10 节，每课有三个提醒、示范回放和独立练习。
- 自由训练有 20 个主题、120 关、180 道谜题及 20 枚主题徽章。
- 首页底部可导出 JSON 备份或确认清零。清零会删除当前浏览器的所有进度和收藏，不影响别的设备。

应用数据只保存在当前浏览器的当前 origin 下，不跨设备同步。导出文件是人工恢复/迁移的数据备份，当前没有导入 UI。清理网站数据和无痕窗口关闭可能导致丢失。托管平台自带的提醒、评论与举报按钮属于平台注入层。

## 本地开发与验证

需要 Node.js 20+、Python 3.10+。运行网站本身不需要 Node、Python、联网或构建服务器。

```bash
git clone https://github.com/mctrain/chopper_chess.git
cd chopper_chess
npm ci
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-dev.txt
npm run check
```

| 命令 | 作用 |
| --- | --- |
| `npm run build` | 从 `src/`、`data/`、本地第三方资源生成离线单页、离线 ZIP、部署单页和 SHA-256 清单 |
| `npm test` | 先构建，再运行 Node 原生测试 + jsdom 交互回归 |
| `npm run validate:data` | python-chess 逐题枚举所有合法着法，检查 FEN、目标唯一解、演示着法和数量 |
| `npm run check` | 数据验证 + 构建 + 全部 JS/集成测试，发布前必跑 |
| `python tools/generate_data.py` | 确定性重新生成扩展题库；保留 v1 ID，运行后必须验证并构建 |
| `npm run format` | Prettier 格式化可维护 JS/CSS/测试；生成文件由下一次 build 还原 |

`dist/index.html` 是离线版本；`releases/axureshow-inline.html` 是部署版本，后者连使用说明和离线 ZIP 下载也内嵌，适合 AxureShow 的“粘贴 HTML”更新入口。两者运行时均不请求外部 CSS、脚本、字体或棋子图片。`releases/` 可重新生成，不提交。

## 架构与目录

采用普通经典脚本而非 ESM，保证 `file://` 双击可用；不使用 `fetch` 加载题库、服务端 API、框架或 CDN。脚本有明确职责，但共享同一浏览器全局词法作用域。不要把顶层 `let/const` 当成 `window` 属性；测试使用 VM 上下文访问。

| 文件 | 职责 / 主要入口 |
| --- | --- |
| `src/app.js` | 路由、棋盘、点击走子、升变、普通对弈、音效、主题。`navigate/stop/newGame/drawBoard/attemptMove/performMove` |
| `src/ai.js` | 五档陪练参数、子力评估、至多两半回合的 alpha-beta 搜索；`chooseMove` 不得修改调用者棋局 |
| `src/storage.js` | `fresh/migrateState/save`，旧数据升级、日期函数、转义、导出和存储失败提醒 |
| `src/archive.js` | 人机棋谱逐步保存、续下、删除、只读回放；`snapshotGame/restoreRecord/openReview/reviewStep` |
| `src/exercises.js` | 练习/谜题/课堂挑战共用的判题、提示、演示答案、重试和连对统计 |
| `src/planner.js` | 30 天计划、日历/checklist、任务跳转、独立完成证据和日期归属 |
| `src/lessons.js` | 三阶段课程列表、逐步示范、开始独立挑战 |
| `src/badges.js` | 首页仪表盘与 20 个主题徽章的派生状态 |
| `src/bootstrap.js` | 全部依赖就绪后应用设置并进入首页 |
| `src/index.html / src/style.css` | 页面骨架、对话框、所有布局及主题变量 |
| `src/content.js / src/pieces.js` | **生成文件**；分别来自 JSON 题库和官方本地 SVG，禁止手改 |
| `data/legacy.json` | v1 固定题目及 ID，用于生成时保留旧进度兼容性 |
| `data/curriculum.json` | 当前发布的 20 组 / 180 谜题 / 30 课程，内容真源 |
| `tools/data_rules.py` | 独立的教学目标谓词，供生成和验证共用，不读取题目 `solution` 判定目标 |
| `tools/generate_data.py` | 固定种子构造/筛选局面，生成当前 JSON |
| `tools/validate_data.py` | 重新枚举验证并输出 `tools/validation-report.json` |
| `tools/build.py` | 构建唯一真源，固定 ZIP 时间戳，避免生成时间造成无意义差异 |
| `assets/cburnett/` | 官方本地棋子 SVG，保留造型与开源声明 |
| `vendor/chess.js` | chess.js 0.13.4；经典脚本封装，仅去掉 ESM export，暴露 `Chess` |
| `tests/*.test.cjs` | 行为与集成回归，使用隔离 DOM/本地存储和可控计时器 |
| `.agents/skills/maintain-chopper-chess/` | 可复制到其它 agent 的完整修改—测试—部署 skill |

构建顺序固定为：规则引擎 → pieces → ai → content → storage → archive → planner → lessons → exercises → badges → app → bootstrap。函数体可以引用稍后声明的函数；禁止在 bootstrap 前主动执行依赖尚未初始化的入口。

### 路由与棋盘生命周期

`mode` 有 `home/ai/local/practice/puzzles/learn/lesson/archive/review`。导航先保存当前 AI 棋局，再调用 `stop()`，取消异步 AI、谜题自动跳转和演示回调，清除任务上下文，再渲染目的页。`epoch` 是计时器防串页标记；每个延迟回调必须检查捕获的 epoch，新增异步行为也必须遵守。

`game` 是当前屏幕唯一 Chess 实例。`human` 只表示人机棋局的人类颜色，不得在练习执黑时覆盖它。`selected/hint/last` 控制选中、推荐和末步两格高亮；将军格由规则引擎派生。棋盘按钮始终 64 个；占用格必须同步生成一个本地 SVG，禁止退回 `<img src>`。合法移动统一经 `attemptMove()` 进入，普通对弈调用 `performMove()`，练习调用 `solveExercise()`；复盘和课堂示范中不得接受实战走子。

### 五档儿童 AI

| 级别 | 名字 | 深度（半回合） | 噪声 | 随机走子概率 |
| --- | --- | --- | --- | --- |
| 1 | 小蜗牛 · 陪我试试 | 0 | 0 | 100%，优先随机吃子 |
| 2 | 小兔子 · 看看吃子 | 1 | 220 | 50% |
| 3 | 小松鼠 · 想一小步 | 1 | 140 | 35% |
| 4 | 小海豚 · 多看一眼 | 2 | 90 | 24% |
| 5 | 小狮子 · 小小挑战 | 2 | 45 | 15% |

在 `src/ai.js` 调整 `AI_LEVELS`。深度非递减、失误概率和噪声整体降低，形成从易到难的能力梯度；随机因素意味着单盘/单步强弱不保证严格排序，也不承诺孩子一定赢。最高档刻意保留失误，禁止未经要求加深到 3+ 或接入强棋引擎。提示使用确定性选择，不带随机失误。`chooseMove(g,level,deterministic,rng)` 可注入随机源做可重现测试。

### localStorage 契约与升级

继续使用键 `xiaoba-chess-v1`，对象内 `version: 2`。旧键名不变，以免升级造成“进度清空”。`migrateState` 保留 v1 的原题 ID、战绩、完成数和主题设置，并补全新字段；损坏 JSON 回退新数据，字段类型异常做归一化。

| 字段 | 含义 |
| --- | --- |
| `solved/practice/lessonDone` | 已完成内容 ID；旧题目的 q001…q054 ID 不变 |
| `correct/attempts/streak/best` | 首次独立答对、首次尝试、当前/最长连对，提示不计正确 |
| `wins/losses/draws` | 人机战绩；`recorded` 防止结束状态重复累计 |
| `queue/cursor` | 普通随机谜题队列；一轮用完重排，日计划专属顺序不修改它 |
| `games` | `{id,createdAt,updatedAt,initialFen,moves:[SAN...],human,level,result}` |
| `saveGames` | 下一盘默认是否保留，当前盘另有 `keepCurrentGame` |
| `events` | `{date:'YYYY-MM-DD',kind:'puzzle|practice|lesson',id}` 的去重完成证据 |
| `planStart` | 训练周期起始本地日期；30 天后可以开始新周期，历史不删除 |
| `reviewed` | 已回看到最后一步的棋局 ID |
| `theme/muted/level` | 外观、音效、难度偏好 |

`game.history()` 保存 SAN，而非每步 FEN。`restoreRecord` 从 `initialFen` 重放到指定半回合，因此自然覆盖吃子、易位、过路兵与升变。只读复盘不调用 `record`，不能改变收藏棋谱；未完棋局可以继续。每走一步、悔棋和离开人机页都更新收藏，不保存空白的新局。存储失败保留内存状态并显示提醒，不静默删除旧棋局释放空间。

### 日计划与自动打卡

- 使用设备**本地日期**，禁止用 `toISOString().slice(0,10)` 表示训练日期，避免 UTC 跨日偏差。
- 周期为 30 个连续日期，日历按周一到周日排，日期按钮可看过去和未来，但不允许回填证据。
- 每天指定 5 个不重复谜题 ID 和 3 个不重复主题关卡 ID。120 关、180 题足够覆盖一个月并留有余量。
- 每个周末再分配开局/中局/残局各一课。每类 10 课，覆盖任意起始日的 30 天（最多 10 个周末日）。
- checklist 用按钮表示任务，非可编辑 checkbox。`completionFor(date,task)` 只按当天、对应 kind、对应分配 ID 求交集；做别的题不冒充完成当天任务。
- `noteCompletion` 只在独立正确判题后调用，证据日期永远取当前本地日期，不能由日历传入。
- 允许错后自行重试并完成；看提示/答案的当前尝试不记证据。阅读或播放示范也不算完成课程，必须独立解课后题。
- `planSession` 只维护当前任务跳转；进度持久化在 `events`。刷新再进任务会跳过已完成的分配项。
- 这是儿童训练计划而非防作弊系统；纯前端数据仍可被懂开发工具的人自行修改。

### 题库与唯一解

题目为 `{id,fen,solution,title,explain,goal,kind,hint,retry,rule?}`，solution 是 UCI 字符串（含可选升变字符）。课程额外包含 `{id,phase,title,minutes,points,exercise,demoMoves}`。

生成器固定随机种子，保留 v1 内容。验证器检查所有 330 个局面：120 主题、180 谜题、30 课后题；主题与谜题之间不允许相同规范化 FEN。课程可复用同一开局起始局面，因为每课教学目标不同。

`mate` 穷举所有合法着法且恰有一个将杀；`fork/pin/discovery/skewer/capture/enpassant` 按明确的战术目标谓词筛选，要求唯一。`opening` 是教学动作的唯一性，例如“王前兵到 e4”“王翼易位”，**不表示该局面只有一个客观最佳着法**。开局题不能宣称 e4 比 d4 更唯一正确。扩题时先定义独立谓词，再生成，不要把 `move.uci()==solution` 当作唯一性验证。

修改 `data/curriculum.json` 可人工维护内容；修改 `tools/generate_data.py` 可重新生成整套扩展库。发布前运行验证并检查解释与题目目标一致。不要随意重排/改名已发布 ID，否则已有进度与分配计划会失配。

## 测试策略

当前共有 38 个行为测试（其中批量验证覆盖 330 个局面）。`tests/helpers.cjs` 为每个测试建立独立 jsdom、localStorage、对话框和可控计时器；可注入日期和存储配额错误，不依赖真实等待或线上网络。构建测试独立执行离线/部署两份真实 HTML。

| 测试 | 主要风险 |
| --- | --- |
| `ai.test.cjs` | 参数梯度、深度上限、合法走子、不修改 FEN/历史、吃子策略、确定性提示 |
| `archive.test.cjs` | 人/机逐步保存、刷新续下、取消保存、悔棋、取消旧定时器、复盘只读、特殊着法、删除与战绩幂等 |
| `planner.test.cjs` | 跨月/跨年/二月、内容足量不重复、预算、任务深链、正确完成、辅助解不计、未来日期、刷新恢复、课堂示范不打卡 |
| `exercises.test.cjs` | 330 个局面的加载与完整 SVG、错题重试、升变、过路兵、首次正确率、不重复队列、切页竞态、格色/高亮、徽章、事件处理器语法 |
| `storage.test.cjs` | v1 升级、损坏字段、配额失败、设置持久化、清空确认 |
| `build.test.cjs` | 两份完整 HTML 可独立运行，外部脚本/样式/棋子请求为零 |

增加功能时补行为测试，避免只断言源码字符串。若改了异步流程、日期、状态迁移、题库或构建，必须跑完整检查。jsdom 不能证明 Safari/iPad 的真实尺寸与触摸体验；发布后仍需浏览器烟测，并让家长检查实际 iPad 网络和交互。

## 修改、提交与部署

1. 阅读本 README 和 `AGENTS.md`，检查工作区、远程分支和用户改动。改源文件，不改生成的 dist 文件。
2. 按功能拆 commit，保留 GitHub 历史；不要 force-push、上传凭据、把私人 SSH key 放仓库。
3. `npm run check` 必须通过。网页只改文案也要构建，以确保部署单页同步。
4. 用浏览器验证真实 HTML 的首页日历、任务跳转、棋子完整、人机走子、收藏复盘、小课堂及主题切换；检查控制台错误。
5. 向已授权的 GitHub 仓库推送并核对远端 HEAD；如果 SSH 传输被环境阻断，不要把它当作密钥失败，也不要虚报已 push。
6. 登录 AxureShow → 项目管理 → 现有“小马国际象棋训练营”→ **更新** → **直接粘贴单 HTML 代码**，填入 `releases/axureshow-inline.html` → 确认更新。不要创建新项目，否则 origin 或路径变化可能让旧进度看起来消失。
7. 若文件夹上传没有选中提示，不要盲点确认；本项目优先使用单 HTML 更新，不需要付费的在线编辑器。登录仅用安全凭据入口或用户接管，永不收集聊天密码。
8. 新标签打开原分享网址，验证新版功能和旧进度。更新进度条可能停在 0%；它不是成败依据，必须看新页面的实际内容。保留截图和 `releases/manifest.json`，说明测试与限制。

平台没有已验证的稳定公开部署 API，因此这里**没有杜撰自动上传接口**。有授权浏览器的 agent 可以按上述 UI 自动化部署；普通 CLI agent 构建文件后由用户粘贴。`DEPLOYMENT.md` 留存实际发布记录。

在其它 agent 中使用流程 skill：保留本仓库 `.agents/skills/maintain-chopper-chess`，或复制到该 agent 的 skill 搜索目录，然后请求“使用 $maintain-chopper-chess 修改并发布这个网站”。不识别 skill 的 agent 也可直接阅读其 `SKILL.md`。

## 开源与第三方

应用自有代码按根目录 `LICENSE` 的 MIT 许可证分发；第三方内容按各自许可证分发，不会被 MIT 覆盖。chess.js 是 BSD-2-Clause；cburnett SVG 作者 Colin M. L. Burnett，依 lichess 提供的 GPL-2.0-or-later 声明分发。完整 notices、lichess 原 COPYING 和 GPL 文本在 `dist/` 中，离线包也包含它们。禁止把官方棋子替换为外链资源。
