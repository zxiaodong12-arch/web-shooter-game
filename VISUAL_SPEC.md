# Mini Blaster Visual Spec (Semi-Realistic Zero Style)

> **文档说明 Document note：** 下文每节先列为英文规格要点，紧随 **中文** 小节为对应中文描述，便于本地化协作与评审。

## 1. Visual Direction

- Target feel: semi-realistic WWII aircraft top-down arcade shooter.
- Readability priority: gameplay first, realism second.
- Style keywords: brushed metal, olive paint, subtle weathering, bright muzzle/explosion accents.

**中文 · 视觉方向：** 整体追求「半写实」二战飞机 **俯视射击** 街机感；**玩法可读性优先于写实细节**。风格关键词：**金属拉丝/磨砂质感**、**橄榄绿系涂装**、**轻微旧化/风霜**、**枪口与爆炸等高亮点缀**，避免画面发灰发闷。

## 2. Art Pillars

- Silhouette clarity: player, enemy, bullet must be recognizable in <150ms glance.
- Material layering: base color + shadow + highlight + panel lines.
- Motion truthfulness: aircraft movement must include slight banking and propeller blur.
- FX readability: hit/explosion effects should pop without obscuring bullets/enemies.

**中文 · 美术原则：** **剪影清晰**——约 150ms 内一眼区分玩家、敌机、子弹。**材质分层**：固有色 + 暗部 + 受光 + 蒙皮/舱盖结构线。**动效真实感**：横移时带轻微 **横滚（倾斜）**，螺旋桨用 **模糊圆盘 + 桨叶** 表现转速。**特效可读**：命中与爆破要醒目，但不能盖住子弹轨迹与机体轮廓。

## 3. Color System

- Player base: `#4f6f5c` to `#2f4b3b`.
- Player highlights: `#9eb6a5`, canopy `#d6f5f0`.
- Enemy base: `#ff7a66` (keep for contrast).
- Background: deep navy `#0d2f4d` + star field.
- Accent FX: muzzle `#ffe08e`, explosion `#ffd56c`, damage wave `#ffb69d`.
- UI text: near-white `#d7f4ff`.

**中文 · 配色：** 玩家为 **灰绿—深绿** 机身，**浅灰绿高光**、**浅青绿座舱盖**。敌机/威胁保持 **暖橙红** 系与背景形成对比。背景 **深海蓝** + 星野。枪口、爆炸、冲击用 **金黄/暖橙** 点缀。界面主文字 **近白偏冷** `#d7f4ff`，保证深色背景上可读。

## 4. Lighting Rules

- Global light from upper-left.
- All sprites require:
  - one soft highlight edge (upper-left side),
  - one occlusion/shadow edge (lower-right side),
  - center contrast detail for depth.

**中文 · 光照：** 统一 **左上方主光**。每个 sprite：**左上受光缘**（柔和高光）、**右下闭塞/投影缘**、**中部对比与细节**，共同撑起「块面感」，避免纸片贴图感。

## 5. Player Aircraft Spec

- Components:
  - fuselage body
  - tapered wings
  - tailplane
  - canopy
  - nose + propeller hub
  - propeller blur disk + blades
- Motion:
  - bank up to 10-12 degrees based on horizontal velocity.
  - propeller visual uses blur ellipse + rotating blades.
- Damage feedback:
  - on hit: short red tint overlay (80-120ms) + shockwave + particle burst.

**中文 · 玩家机：** 结构含 **机身、锥形机翼、平尾、座舱、机头+桨毂、桨叶模糊盘+桨叶**。运动：**最大横滚约 10°–12°**（随水平速度）。螺旋桨用 **椭圆模糊 + 旋转桨叶** 表现。受击：**短时泛红叠色（约 80–120ms）** + **冲击波** + **粒子爆破**。

## 6. Enemy Spec

- Keep rectangular enemy for now (readability), but add depth:
  - top highlight strip
  - subtle shadow edge
  - hit flash when entering dying state.
- Death behavior:
  - shake/fade 300-450ms before removal.

**中文 · 敌人：** 可保留 **略几何化** 机体以保证可读，但必须加 **顶缘高光条**、**下缘/侧缘微弱投影**，进入濒死时 **闪白/闪烁**。死亡过程：**抖动 + 淡出**，持续约 **300–450ms** 再移除实体。

## 7. VFX Spec

- Bullet trail: add tiny 2-frame glow tail.
- Hit explosion:
  - 12-20 particles, mixed sizes, fade 0.5-0.9s.
- Shockwave ring:
  - growth 4px -> 66px, lifetime ~0.7s.
- Optional: add spark fragments with fast decay (<0.25s).

**中文 · 特效：** 子弹 **2 帧级短拖尾微光**。命中爆炸：**12–20 颗粒子**、大小参差、寿命 **0.5–0.9s**。冲击波环：**由小到大约至 66px**，寿命约 **0.7s**。可选：**快衰火花碎片**（存活小于 0.25s）增强碎裂感。

## 8. HUD / UI Spec

- HUD area: top-left reserved zone.
- Typography:
  - keep current family for now; move to condensed aviation style in phase 2.
- Hierarchy:
  - Score first line, Lives second line.
  - Keep text shadow/contrast against star background.
- Menu/End screen:
  - title + concise action hint only.
- Pause (in-play):
  - **Input:** **P** or **Esc** toggles pause/resume while sortie is active (`!keydown.repeat`); keys are consumed so they are not reinterpreted as move/fire.
  - **Canvas overlay:** full-viewport tint over the playfield so the frozen frame stays readable; draw **after** the battle scene and **before** other full-screen mode overlays (menu / debrief). Primary label **PAUSED** centered; secondary line **Press P or Esc to resume** beneath it. Type hierarchy: headline clearly dominant; hint smaller but still high-contrast against the dimmed map.
  - **Shell / DOM:** optional global hook `body.game-paused` while `playing && paused` for page-level treatment (e.g. subtle chrome shift). Tactical Intel and dossier regions are not hidden by default; any extra dim/blur of side panels should stay secondary to the canvas focal message.
  - **Footer:** preflight control strip includes **Pause: P or Esc** alongside move/shoot/fullscreen/restart hints.

**中文 · HUD / 界面：** **HUD 保留区**（当前实现中大量信息在侧栏战术 Intel，规格上仍要求 **分数/生命层级清晰**：分数在上、生命在下；星野/海图上文字需 **描边或阴影** 保证对比）。**菜单/结算**：标题 + **简短操作提示**即可。**暂停（战斗中）：** **P / Esc** 切换暂停与继续（忽略长按重复键），并 **吞掉键位** 以免被映射成移动/射击。画布上 **全幅半透明罩色**，先画战场再画暂停层，且 **先于** 菜单/战报全屏层；主标题 **PAUSED**，副文案 **Press P or Esc to resume**；**主标题字号明显大于提示行**。页面级可用 **`body.game-paused`** 做整体壳层微调；侧栏默认不因暂停被硬隐藏，若做额外模糊/淡化，**不得压过** 画布中央的暂停信息。**页脚** 预飞简述中需包含 **暂停：P 或 Esc**，与移动、射击、全屏、重启等并列。

## 9. Camera & Composition

- Canvas center composition.
- Player base line fixed near lower quarter of canvas.
- Ensure no high-contrast FX directly behind score text region.

**中文 · 镜头与构图：** 画布以 **中心战斗区** 为视觉重心；玩家 **基准线靠近画布下方约 1/4**。避免在 **分数/主要 HUD 读出区正后方** 叠高对比爆炸或闪光，防止读数困难。

## 10. Technical Constraints

- Keep single-canvas rendering.
- Preserve `window.render_game_to_text` and `window.advanceTime(ms)` compatibility.
- `render_game_to_text` MUST expose a root-level boolean **`paused`** when validating pause UX and automation.
- `advanceTime(ms)` MUST NOT advance `updatePlaying` while paused (same rule as the main RAF `tick`).
- Maintain 60fps target on typical laptop browser.

**中文 · 技术约束：** **主玩法仍用单画布** 渲染（DOM 侧栏为补充）。保留 **`window.render_game_to_text`** 与 **`window.advanceTime(ms)`** 供自动化与确定性测试。JSON **根级必须包含布尔字段 `paused`**，以便校验暂停状态。`advanceTime` 在暂停时 **不得调用** `updatePlaying`，与主循环 `requestAnimationFrame` **tick** 规则一致。目标在常见笔记本浏览器上 **维持约 60fps**。

## 11. Implementation Roadmap

1. Phase A (done mostly): player semi-realistic silhouette + propeller blur.
2. Phase B: enemy shading + hit flash + improved death readability.
3. Phase C: bullet trail + richer explosion layers.
4. Phase D: HUD polish (contrast panel, iconography).
5. Phase E: optional post-effect pass (vignette/light fog very subtle).
6. Phase F (implemented): in-sortie pause — canvas dim + PAUSED/resume copy, `body.game-paused`, footer hint, frozen simulation + test hooks (`paused` in JSON, `advanceTime` respects pause).

**中文 · 实施路线图：** **A** 玩家半写实剪影与螺旋桨模糊（基本完成）；**B** 敌人体积与命中闪、死亡可读性；**C** 拖尾与爆炸层次；**D** HUD 面板与图标化；**E** 可选整体轻雾/暗角；**F（已实现）** 战斗中暂停——画布压暗、**英文**主副文案（PAUSED / Press P or Esc…）、`body.game-paused`、页脚说明、逻辑冻结及 **`paused` / `advanceTime`** 测试约定。

## 12. Acceptance Checklist

- [ ] Player shape is clearly Zero-inspired and readable at gameplay speed.
- [ ] Movement banking feels natural and not distracting.
- [ ] Hit events are visible from peripheral vision.
- [ ] Enemy death state is clearly distinct from alive state.
- [ ] HUD remains legible during heavy effects.
- [ ] Pause: overlay readable at a glance; resume instruction visible; playfield visibly frozen while paused.
- [ ] Pause: **P** and **Esc** both toggle; no stuck movement or auto-fire after resume from cleared key state.
- [ ] No console errors in Playwright validation.
- [ ] `render_game_to_text` matches visible gameplay state (including **`paused`** when applicable).

**中文 · 验收清单：** 玩家轮廓 **零战气质** 且高速下可辨；横滚 **自然不抢戏**；命中在 **余光** 内可见；敌机 **濒死/存活** 状态区分明确；**重特效时 HUD** 仍可读；**暂停** 时罩层与恢复说明 **一眼可读**、战场 **明显静止**；**P 与 Esc** 均可切换暂停，恢复后 **无黏键、无松手仍自动开火**；Playwright 无控制台报错；**`render_game_to_text` 与画面一致**（含 **`paused`**）。

## 13. Next Build Tasks (Concrete)

1. Add enemy highlight/shadow bands and hit flash.
2. Add bullet glow trail.
3. Add short player damage tint overlay.
4. Add HUD translucent backing plate for better legibility.
5. Re-run Playwright scenarios and capture updated screenshots.
6. Optional pause polish: tuned overlay alpha, slight blur only on canvas (not side panels), or localized vignette — keep §8 pause bullets as the baseline.

**中文 · 后续具体任务：** 敌人 **高光/暗边 + 命中闪**；子弹 **发光拖尾**；玩家受击 **短时染色叠层**；HUD **半透明衬底** 提对比；重跑 Playwright 与截图归档；可选 **暂停视觉微调**（罩色透明度、仅画布轻微模糊/暗角），但以 **§8 暂停条款** 为底线勿破坏可读性。

## 14. Reference captures

- Pause full-page example: `output/pause-screen.png` (paused mid-sortie, tactical column visible).

**中文 · 参考截图：** 暂停态整页示例见项目内 **`output/pause-screen.png`**（对战中途暂停，右侧战术栏可见）。
