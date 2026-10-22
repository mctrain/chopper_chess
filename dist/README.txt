小八的国象之旅 · 使用说明

一、打开网站
在线版：使用交付的在线链接。当前 Sites 版本为账号私有，需要使用拥有此网站的账号访问。
离线版：解压 xiaoba-offline.zip，双击 index.html 即可使用，不需安装、不需联网。
请完整保留 assets 文件夹、chess.js、app.js、data.js 和 style.css。
iPad 推荐 Safari 横屏访问在线版；iPad 文件 App 直接预览 HTML 不等同于完整浏览器，离线版优先在电脑浏览器打开。
棋盘支持点击起点再点击终点；浅色格 #f0d9b5，深色格 #b58863。
黄色为最后一步，绿色为选中格，蓝框为提示，红色为被将军的王。
升变弹窗默认聚焦“后”，也可以选择车、象、马。

二、五个模块与本地验证
1. 人机对弈：点 e2，再点 e4，等待 AI 走棋。试悔棋（退回你的回合）、提示、换边、认输和再来一局。
   1 档优先随机吃子，无吃子时随机合法走；2 档一层贪心加噪声；3 档降低噪声；4、5 档两层浅搜。
   这里的档位是弱 AI 参数，不代表正式等级分，也无法保证每个孩子的胜率。
   结束后禁止悔棋，避免重复统计战绩；切换模块或重开未完成对局不计战绩。
2. 主题练习：四组各六关。可从任意一关开始。走错给提示且保持原局面，走对解锁该关。
   完成一组得到徽章。点击“看答案”后会演示正确着法，再点“我来试一遍”实际走出才算完成。
   基础战术包括马捉双、兵吃被牵制的马、象吃后闪将、象串击王后、升变杀、吃过路兵。
3. 每日谜题：30 道，每轮随机不重复。主要一步杀，另有四道明确目标的战术题。
   答对出现绿框，1.5 秒后自动下一题；错题可以无限重试；提示与答案不计独立答对。
   完成数按不同题目去重；正确率为独立首次答对次数 / 已作答次数；提示、看答案和首次走错计一次未独立答对。
   连对是连续独立首次答对；使用提示、答案或走错会中断。做完一轮重新洗牌。
4. 亲子对弈：双方同设备轮流点棋，无 AI 自动回复；支持翻转、单步悔棋、提示、认输、重开。
5. 我的旅程：首页显示练习进度、徽章、谜题数量/正确率、最长连对、人机胜负和。
   完成一关后刷新，应保留记录；棋局本身不续盘。切换浏览器、设备或网址不会同步记录。

三、清零与设置
首页右下角“清空数据重新开始”→确认。仅删除本网站记录，不影响其他网站。
右上角可以切换浅色/深色、声音开关，设置也保存。
浏览器隐私模式、禁用站点存储或清理浏览器数据可能使进度丢失。
file:// 的本地存储由浏览器实现决定；搬动离线文件或换地址可能出现独立记录。

四、调整 AI 参数
用文本编辑器打开 app.js，搜索 AI_LEVELS：
  depth：搜索的半回合数（1=只看自己一步，2=再看对手回应）。
  noise：随机评估噪声，越大越不稳定。
  blunder：改走随机合法着法的概率，0 至 1。
1 档专门写在 chooseMove 中，优先随机吃子，其余随机走。
2 档 depth=1, noise=180, blunder=0.30
3 档 depth=1, noise=70,  blunder=0.15
4 档 depth=2, noise=100, blunder=0.18
5 档 depth=2, noise=25,  blunder=0.05
AI 在主线程浅搜，不建议在 iPad 上把 depth 提到 3 以上。

五、局面验证与开发检查
tools/generate_data.py 使用 python-chess 生成并验证 24 练习 + 30 谜题。
安装：python -m pip install python-chess
生成：python tools/generate_data.py（源码目录版以 dist 为输出）
报告：tools/validation-report.json
所有 FEN 使用 is_valid() 验证；一步杀穷举全部合法走法，确认仅一个将杀。
战术题按题目明确目标穷举唯一解，不把它们冒充引擎证明的全局唯一最佳着。
例如“用兵吃掉被牵制的马”与“用象将军并串击后”各自只有一着满足目标。
Node 交互检查：在项目内安装 jsdom，然后设置 JSDOM_PATH 指向其模块，运行 tools/test.cjs。
已检查规则数据与关键交互逻辑；本次运行环境的预览服务不可用，未完成浏览器视觉验收和真实 iPad 触摸测试。

六、免费静态部署（Cloudflare Pages）
官方免费静态方案：https://developers.cloudflare.com/pages/functions/pricing/
上传说明：https://developers.cloudflare.com/pages/get-started/direct-upload/
登录自己的 Cloudflare 账号 → Workers & Pages → Create application → Pages → 上传静态文件。
把离线 ZIP 的网站文件上传，确保 index.html 在发布目录根部；不需要构建命令、后端或数据库。
免费方案使用平台提供的域名即可。无须购买自定义域名，也无须添加付费服务。
此交付没有替你创建 Cloudflare 账号或接受其服务条款。

七、依赖与授权
chess.js 0.13.4，Jeff Hlywa，BSD-2-Clause，完整声明在 chess.js 顶部。
为支持 file:// 直接打开，只移除了 ESM export 声明，并加经典脚本包装；规则引擎逻辑未改。
棋子是 lichess-org/lila/public/piece/cburnett 官方 SVG 的本地副本。
作者 Colin M. L. Burnett，按 Lichess COPYING.md 标注的 GPLv2+ 分发，未修改图形。
具体来源和完整上游授权目录参见 THIRD-PARTY-NOTICES.txt、LICHESS-COPYING.md 与 GPL-2.0.txt。
本项目不使用或部署 lila 服务端，与 Lichess 官方无关联。
