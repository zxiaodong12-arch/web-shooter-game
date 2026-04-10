# Mini Blaster · 太平洋空战射击

---

## 游戏简介

**Mini Blaster** 是一款以太平洋战场为氛围包装的 **HTML5 Canvas 俯视射击游戏**：单文件式前端技术栈（`index.html` + `styles.css` + `game.js`），可在桌面浏览器中直接运行。玩家在出击前选择 **机体涂装/型号**（仅外观），随后在 multi-stage **出击任务** 中击落敌机、规避敌弹、收集强化，并最终击沉分幕出现的 **主力舰 Boss**。任务分为多 **Stage（幕）**，每幕有独立的计分门槛、敌人编组与战舰造型；通关需要完成最终幕的歼灭条件。

行文约定：**下文各小节均为「中文说明」在前，「English」紧随其后**，便于本地团队与海外协作者同读一份文档。

---

## Game overview

**Mini Blaster** is a **Pacific-theatre–themed top-down canvas shooter** built as a simple static front end (`index.html`, `styles.css`, `game.js`) for desktop browsers. Before each sortie you pick an **airframe look** (visual only; stats stay the same), then fight through a **multi-stage campaign**: shoot down fighters, dodge enemy bullets, grab power-ups, and sink **capital-ship bosses** that appear per act. Each **stage** has its own score gate, enemy mix, and boss art; **full victory** requires clearing the final act’s objectives.

**Convention:** In every section below, **中文 comes first**, then **English**.

---

## 运行环境与依赖

- **浏览器：** 支持 **HTML5 Canvas**、现代 ES 语法（建议 Chromium / Firefox / Safari 最新稳定版）。游戏以 **requestAnimationFrame** 为主循环，目标约 **60 FPS**。
- **Node.js（可选）：** 若需运行 Playwright 自动化客户端、或执行 npm 依赖安装，建议 **Node.js 18+**。仓库内 `dependencies` 包含 `playwright`，部分环境另需本机安装 Chromium（由 Playwright 管理）。

---

## Requirements

- **Browser:** Modern desktop browser with **HTML5 Canvas** and up-to-date JavaScript (ES2020+ recommended). Main loop uses **requestAnimationFrame**; target **~60 FPS**.
- **Node.js (optional):** **Node.js 18+** for `npm install`, Playwright runs, and the bundled `web_game_playwright_client.mjs`. Browsers for automation are usually installed via Playwright’s installer.

---

## 快速开始（强烈建议 HTTP）

不建议长期使用 **`file://` 直接双击打开 `index.html`**：部分浏览器对本地文件的图片与 Canvas 有更严格的安全策略，自动化（Playwright）也更容易出现异常。请在项目目录下启动任意 **静态 HTTP 服务**，再通过 **`http://127.0.0.1:端口/index.html`** 访问。

在项目根目录执行（示例端口 `8080`，可更换）：

```bash
cd web-shooter-game
python3 -m http.server 8080 --bind 127.0.0.1
```

浏览器打开：[http://127.0.0.1:8080/index.html](http://127.0.0.1:8080/index.html)。

亦可使用 `npx serve`、`php -S` 等等价方式，只要根目录指向包含 `index.html` 的文件夹即可。

---

## Quick start (HTTP strongly recommended)

Avoid relying on **`file://`** to open `index.html`: some browsers restrict canvas/image behaviour for local files, and Playwright automation is more reliable over **HTTP**. Serve the project root with any static file server, then load **`http://127.0.0.1:<port>/index.html`**.

Example using Python:

```bash
cd web-shooter-game
python3 -m http.server 8080 --bind 127.0.0.1
```

Open [http://127.0.0.1:8080/index.html](http://127.0.0.1:8080/index.html).

`npx serve`, `php -S`, or any static server pointing at this folder works too.

---

## 画布分辨率与清晰度（DPR）

- **逻辑坐标：** 游戏内碰撞、刷怪、HUD 绘制统一使用固定逻辑分辨率 **800×560**（`GAME_W` × `GAME_H`），与 CSS 显示尺寸无关。
- **实际像素：** `canvas` 的 **backing store**（`canvas.width` / `canvas.height`）按 **CSS 显示尺寸 × `devicePixelRatio`** 计算，并 **将 DPR 上限封顶为 2**（`MAX_CANVAS_DPR`），减轻超高 DPR 设备的发热。
- **绘制：** 每帧在 **逻辑坐标系**下绘制，再通过 `setTransform(renderScaleX, renderScaleY, …)` 映射到物理像素，因此在 **Retina / 高 DPR 屏**上主画布通常比「固定 800×560 再被 CSS 拉大」更锐利。
- **布局：** `.stage-main` 使用 **`align-items: flex-start`**，避免与右侧战术栏同列时被 flex **纵向拉伸**，从而保持 **800:560** 显示比例与均匀缩放。

---

## Canvas resolution & sharpness (DPR)

- **Logical space:** Simulation and drawing use a fixed **800×560** logical playfield (`GAME_W` × `GAME_H`), independent of CSS size.
- **Backing store:** The bitmap size follows **CSS layout size × `devicePixelRatio`**, with **DPR capped at 2** (`MAX_CANVAS_DPR`).
- **Rendering:** The code draws in **logical units**, then scales with **`setTransform(renderScaleX, renderScaleY, …)`**, so **high-DPI** displays typically look **sharper** than upscaling a single 800×560 buffer via CSS alone.
- **Layout:** `.stage-main` uses **`align-items: flex-start`** so the canvas is not **stretched vertically** to match a taller aside column, preserving the **800:560** aspect and uniform scale.

---

## 冒烟测试（`npm run smoke`）

仓库提供 **Playwright** 驱动的轻量回归脚本，无需手动起固定端口服务：

```bash
npm install
npx playwright install chromium   # 首次或升级 Playwright 后如缺浏览器再执行
npm run smoke
```

脚本会在本机 **随机端口** 启动临时静态服务，加载游戏后检查：无控制台错误、菜单 → 出击进入 `playing`、`render_game_to_text()` 中画布逻辑尺寸与 **均匀 `renderScale`** 等。实现见 **`scripts/smoke.cjs`**。

---

## Smoke test (`npm run smoke`)

A **Playwright** smoke script lives in-repo (no fixed port):

```bash
npm install
npx playwright install chromium   # if the browser bundle is missing
npm run smoke
```

It serves the repo on a **random localhost port**, loads the game, and asserts basic health (no console errors, menu → sortie, consistent logical canvas + uniform scale in `render_game_to_text()`). See **`scripts/smoke.cjs`**.

---

## 操作说明

| 操作 | 按键 |
| --- | --- |
| 移动 | **W A S D** 或 **方向键** |
| 射击 | **空格 Space** |
| 暂停 / 继续 | 对战中 **P** 或 **Esc**（不按重复触发的长按） |
| 全屏 | **F**（进入/退出全屏，视浏览器支持） |
| 重来 / 确认 | 结算或菜单等流程中的 **Enter**（以当前 `game.js` 逻辑为准） |
| 选机体（菜单） | **←** **→** 切换可选涂装 |

页面底部 **Preflight / 控制提示** 会与实现保持大致一致；若不一致以 `index.html` 与 `game.js` 为准。

---

## Controls

| Action | Keys |
| --- | --- |
| Move | **W A S D** or **arrow keys** |
| Shoot | **Space** |
| Pause / resume | **P** or **Esc** while playing (no key-repeat shortcuts) |
| Fullscreen | **F** (toggle if the browser supports Fullscreen API) |
| Restart / confirm | **Enter** in result/menu flows (see current `game.js`) |
| Menu: airframe | **←** **→** to cycle |

The footer **control strip** should mirror this; if it drifts, treat **`index.html` + `game.js`** as source of truth.

---

## 功能概览（加长）

- **机体选择：** 出击前在画布/侧栏档案中选择不同 **盟军螺旋桨战机** 贴图；**数值不变**，便于专注美术与代入感。
- **进度与计分：** 每幕有 **目标分数 / Boss 出现门槛**；击落敌机、精英与 Boss 会推进计数；多幕之间有过关提示与短暂的 **战术通告** 流程（具体文案与时长见实现）。
- **敌人与威胁：** 普通机、**精英**（更高耐久/奖励）、**敌方子弹**、Boss 弹幕与 **主炮/Long gun** 类模式；部分阶段敌机有 **走位模式**（直线、摆动、下冲等）。
- **玩家能力：** 主射击、**护盾**、**散射弹** 限时、**导弹**（范围杀伤，有冷却与视觉轨迹）；受击有 **无敌帧**、**命中停顿**、爆炸与冲击波反馈。
- **界面：** 宽屏下 **主画布 + 右侧 Tactical Intel**（阶段、分数、生命、进度条、情报行、强化状态、Boss 预警等）；窄屏下布局 **堆叠** 适配。**胜利/失败** 有独立 **战报卡片**（分数、击坠、时间、阶段等，以代码为准）。
- **暂停：** 对战中冻结逻辑与射击；画布中央 **PAUSED** 与恢复说明；`document.body` 可带 **`game-paused`** 类名供 CSS 微调整页气质。测试用 JSON 含 **`paused`** 字段。

---

## Features (extended)

- **Airframe pick:** Pre-sortie choice among **Allied prop fighter** sprites — **cosmetic only**; combat stats unchanged.
- **Progression:** Per-stage **score targets** and **boss entry thresholds**; kills and boss sinks advance the sortie; **inter-act notices** punctuate stage transitions (copy/timing = implementation).
- **Threats:** Regular fighters, **elite** variants, **enemy bullets**, boss patterns and shelling-style bursts; some enemies use **movement profiles** (straight, sway, dive, etc.).
- **Player kit:** Main gun, **shield**, timed **spread shot**, **missiles** with cooldown and trails; hits use **i-frames**, **hit-stop**, explosions, shockwaves.
- **UI:** Wide layout = **canvas + Tactical Intel** rail (stage, score, lives, meter, intel lines, augments, boss warning). Narrow breakpoints **stack** panels. **Win/lose** uses a **debrief card** (score, kills, time, stage — verify in code).
- **Pause:** Freezes sim and firing; **PAUSED** + resume hint on canvas; `body` may get **`game-paused`** for shell styling. Test JSON includes boolean **`paused`**.

---

## 仓库结构说明

| 路径 | 作用 |
| --- | --- |
| `index.html` | 页面壳层、画布、战术侧栏、机体档案 DOM、脚本/样式引用（含 `?v=` 缓存戳） |
| `game.js` | 主循环、输入、物理与碰撞、敌我 AI、Boss、UI 同步、`renderGameToText`、调试入口 |
| `js/game-content.js` | 关卡/敌人/Boss 等数据与文案（由 `window.GameContent` 注入） |
| `js/game-assets.js` | 资源加载工厂（`GameAssetFactory`：机体、敌机、战舰、背景、武器贴图） |
| `styles.css` | 排版、主题色、动效、响应式断点、暂停等状态下的壳层样式（如 `.game-paused`） |
| `assets/` | 运行时资源：`aircraft/`、`naval/`、`weapons/`、`backgrounds/` 等 |
| `output/` | 截图、Playwright 导出 JSON、本地验证产物（可按需 `.gitignore`） |
| `scripts/smoke.cjs` | `npm run smoke`：内置静态服务 + Playwright 冒烟断言 |
| `web_game_playwright_client.mjs` | Playwright 驱动：URL、动作 JSON、截图目录、迭代与间隔等 |
| `scripts/` | 其他辅助脚本（非游戏运行时必需） |
| `VISUAL_SPEC.md` | 视觉与 UI 规格（英文要点 + 中文摘要） |
| `progress.md` | 编年体式开发与验证记录 |

---

## Project layout

| Path | Role |
| --- | --- |
| `index.html` | Shell, canvas, tactical rail, dossier DOM, script/style tags (cache-bust `?v=`) |
| `game.js` | Loop, input, physics, AI, bosses, UI sync, `renderGameToText`, debug hooks |
| `js/game-content.js` | Stage/enemy/boss data and copy (`window.GameContent`) |
| `js/game-assets.js` | Asset loader factory (`GameAssetFactory`: airframes, enemies, ships, bg, weapons) |
| `styles.css` | Layout, theme, motion, breakpoints, shell tweaks (e.g. `.game-paused`) |
| `assets/` | Runtime art: `aircraft/`, `naval/`, `weapons/`, `backgrounds/`, etc. |
| `output/` | Screenshots, Playwright JSON dumps (omit from git if desired) |
| `scripts/smoke.cjs` | `npm run smoke`: static server + Playwright smoke assertions |
| `web_game_playwright_client.mjs` | Playwright driver: URL, actions, screenshot dir, iterations |
| `scripts/` | Other aux tooling — not required at runtime |
| `VISUAL_SPEC.md` | Visual/UI spec (English + 中文) |
| `progress.md` | Chronological dev + validation log |

---

## 浏览器内调试 API

游戏在 `window` 上挂载若干 **仅用于开发/自动化** 的接口（具体名称与参数以 `game.js` 底部为准）：

- **`render_game_to_text()`（或别名 `render_game_to_text`）**  
  返回 **一行 JSON 字符串**，描述当前可观测状态：`mode`、`paused`、玩家坐标与速度、子弹/敌弹/敌机采样、Boss 标记、计时器、分数与幕号等。`canvas` 字段同时包含 **逻辑尺寸**（`logicalWidth` / `logicalHeight`）与 **backing 像素**（`backingWidth` / `backingHeight`）及 **`renderScaleX` / `renderScaleY`**，便于核对 DPR 缩放。用于截图对比、回归测试、录屏重放前后的差分。

- **`advanceTime(ms)`**  
  按 **固定 60Hz 步长** 推进内置时间；仅在 **`playing` 且未 `paused`** 时调用与主循环相同的 `updatePlaying` 逻辑，避免暂停时“偷跑”。每步后通常会触发绘制（以当前实现为准）。

- **`debugSpawnEnemy` / `debugSpawnPowerup` / `debugTriggerStageClearNotice` / `debugSetStage` 等**  
  用于快速造景、验证 Boss 预警、过幕提示等；部分行为依赖 URL query 或调试开关，查阅 `game.js` 内注释与 `debugFlags`。

**注意：** 这些 API 不属于稳定对外契约；发版或大改前若依赖自动化，请同步更新 Playwright 脚本与快照。

---

## Browser test hooks

The game attaches **dev/automation** helpers on `window` (exact names at the bottom of **`game.js`**):

- **`render_game_to_text()`** — JSON string of canonical state: **`mode`**, **`paused`**, player pose/vel, bullet/enemy samples, boss flags, timers, score/stage, etc. The **`canvas`** object includes **logical** size (`logicalWidth` / `logicalHeight`), **backing** bitmap size (`backingWidth` / `backingHeight`), and **`renderScaleX` / `renderScaleY`** for DPR checks. Useful for screenshot diffs and regression checks.

- **`advanceTime(ms)`** — Fixed **60 Hz** steps; calls the same **`updatePlaying`** path as the main loop **only when `playing && !paused`**, so pause does not “fast-forward” sim. Usually triggers a draw after stepping (per implementation).

- **`debugSpawnEnemy` / `debugSpawnPowerup` / `debugTriggerStageClearNotice` / `debugSetStage` / …** — Scene staging; some need query params or `debugFlags` — read `game.js`.

**Note:** Not a semver-stable public API; update Playwright baselines when behaviour changes.

---

## Playwright 自动化客户端

1. 安装依赖：`npm install`（首次会拉取 `playwright` 等包；浏览器二进制可能需要 `npx playwright install`）。
2. **先启动本地 HTTP**（见上文），再执行客户端，例如：

```bash
node web_game_playwright_client.mjs \
  --url http://127.0.0.1:8080/index.html \
  --screenshot-dir output/my-run \
  --iterations 5 \
  --pause-ms 300
```

常用参数包括：`--actions-file`（动作 JSON）、`--actions-json`（内联 JSON）、`--headless`、`--click`、`--click-selector` 等。完整列表见 **`web_game_playwright_client.mjs` 顶部 `parseArgs`**。

沙盒或受限环境中若 Chromium 异常，可在本机全权限终端重试，或改用系统已安装的浏览器通道（视 Playwright 版本而定）。

---

## Playwright client

1. Install deps: **`npm install`** (and e.g. **`npx playwright install`** for browsers if needed).
2. **Start local HTTP**, then run:

```bash
node web_game_playwright_client.mjs \
  --url http://127.0.0.1:8080/index.html \
  --screenshot-dir output/my-run \
  --iterations 5 \
  --pause-ms 300
```

Flags include **`--actions-file`**, **`--actions-json`**, **`--headless`**, **`--click`**, **`--click-selector`**, etc. See **`parseArgs`** at the top of **`web_game_playwright_client.mjs`**.

If Chromium fails in a sandbox, retry from a full-permission terminal or adjust the browser channel per your Playwright setup.

---

## 常见问题与排查

| 现象 | 可能原因 | 建议 |
| --- | --- | --- |
| 白屏或资源 404 | 未用 HTTP 或路径错误 | 用静态服务；确认 URL 指向仓库根目录 |
| 机体/背景不显示 | 缓存旧 `?v=`、或 `assets` 缺失 | 强刷、`Disable cache`；检查 `assets/` 是否完整 |
| 自动化截图全黑/报错 | `file://`、CORS、无头浏览器崩溃 | 改用 `http://127.0.0.1`；本机重跑 Playwright |
| 暂停后仍觉得“时间在走” | 仅检查 `advanceTime` / 调试接口 | 确认 `paused` 为 true 时 `advanceTime` 不推进 `updatePlaying` |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Blank or 404 | Not using HTTP or wrong root | Serve folder; use correct URL |
| Missing sprites | Stale cache or missing `assets/` | Hard-refresh; verify `assets/` |
| Automation black frame | `file://`, CORS, headless crash | Use `http://127.0.0.1`; rerun Playwright locally |
| Time “still runs” when paused | Only **`advanceTime`** / dev hooks | Ensure **`playing && !paused`** before `updatePlaying` |

---

## 延伸阅读

- **[VISUAL_SPEC.md](./VISUAL_SPEC.md)** — 视觉方向、光照与配色、HUD/暂停叠层规范、**画布与 DPR**、验收清单；**中英对照（中文摘要在各节内）**。
- **[progress.md](./progress.md)** — 从初版到多幕 Boss、性能优化、暂停与测试钩子等 **按时间线记录** 的变更与验证说明。
- **[README.md](./README.md)** — 本文件：仓库入口说明（中英双语加长版）。

---

## Further reading

- **[VISUAL_SPEC.md](./VISUAL_SPEC.md)** — Art direction, HUD/pause overlay rules, **canvas & DPR**, acceptance notes (**bilingual sections**).
- **[progress.md](./progress.md)** — **Chronological** dev log (multi-stage bosses, perf passes, pause, hooks).
- **[README.md](./README.md)** — This document: **entry-point** guide (Chinese-first, extended).

---

## 许可与素材

- **Node 元数据：** `package.json` 中 **license** 字段为 **ISC**（仅表示 npm 包元信息，不构成对游戏内美术资源的授权声明）。
- **美术与商标：** 飞机/战舰剪影、圆标等若用于 **再分发或商用**，请自行确认 **版权、商标与二战题材表述** 是否符合当地法规与平台政策。

---

## License & assets

- **npm metadata:** **`package.json`** lists **ISC** — that covers the Node package declaration, **not** a blanket license for bundled artwork.
- **Art & marks:** Aircraft/ship imagery and roundels may be subject to **copyright/trademark** and regional rules for **military history** depictions; verify before **redistribution or commercial** use.
