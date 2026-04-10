const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const titleEl = document.getElementById("game-title");
const tipEl = document.getElementById("game-tip");
const airframeDossierEl = document.getElementById("airframe-dossier");
const airframeDossierImageEl = document.getElementById("airframe-dossier-image");
const airframeDossierCodeEl = document.getElementById("airframe-dossier-code");
const airframeDossierTitleEl = document.getElementById("airframe-dossier-title");
const airframeDossierMetaEl = document.getElementById("airframe-dossier-meta");
const airframeDossierTagEl = document.getElementById("airframe-dossier-tag");
const airframeDossierLine1El = document.getElementById("airframe-dossier-line1");
const airframeDossierLine2El = document.getElementById("airframe-dossier-line2");
const airframeDossierStatusEl = document.getElementById("airframe-dossier-status");
const airframeDossierFootnoteEl = document.getElementById("airframe-dossier-footnote");
const tacticalIntelWarningEl = document.getElementById("tactical-intel-warning");
const tacticalIntelWarningTitleEl = document.getElementById("tactical-intel-warning-title");
const tacticalIntelWarningFillEl = document.getElementById("tactical-intel-warning-fill");
const tacticalIntelStageEl = document.getElementById("tactical-intel-stage");
const tacticalIntelMissionLabelEl = document.getElementById("tactical-intel-mission-label");
const tacticalIntelScoreEl = document.getElementById("tactical-intel-score");
const tacticalIntelTargetEl = document.getElementById("tactical-intel-target");
const tacticalIntelTotalEl = document.getElementById("tactical-intel-total");
const tacticalIntelLivesEl = document.getElementById("tactical-intel-lives");
const tacticalIntelMeterFillEl = document.getElementById("tactical-intel-meter-fill");
const tacticalIntelLineActEl = document.getElementById("tactical-intel-line-act");
const tacticalIntelLineAirEl = document.getElementById("tactical-intel-line-air");
const tacticalIntelLineBbEl = document.getElementById("tactical-intel-line-bb");
const tacticalIntelLineBbTextEl = document.getElementById("tactical-intel-line-bb-text");
const tacticalIntelLineAirMainTextEl = document.getElementById("tactical-intel-line-air-main-text");
const tacticalIntelLineAirEliteTextEl = document.getElementById("tactical-intel-line-air-elite-text");
const tacticalIntelLineAirMainJaEl = document.getElementById("tactical-intel-line-air-main-ja");
const tacticalIntelLineAirMainEnEl = document.getElementById("tactical-intel-line-air-main-en");
const tacticalIntelLineAirEliteJaEl = document.getElementById("tactical-intel-line-air-elite-ja");
const tacticalIntelLineAirEliteEnEl = document.getElementById("tactical-intel-line-air-elite-en");
const tacticalIntelAirThumbMainEl = document.getElementById("tactical-intel-air-thumb-main");
const tacticalIntelAirThumbEliteEl = document.getElementById("tactical-intel-air-thumb-elite");
const tacticalIntelBbThumbEl = document.getElementById("tactical-intel-bb-thumb");
const tacticalIntelLineBbJaEl = document.getElementById("tactical-intel-line-bb-ja");
const tacticalIntelLineBbEnEl = document.getElementById("tactical-intel-line-bb-en");
const tacticalIntelAugmentsEl = document.getElementById("tactical-intel-augments");
canvas.tabIndex = 0;

const debugFlags = new URLSearchParams(window.location.search);

const AIRFRAMES = {
  p51d: {
    id: "p51d",
    assetPath: "./assets/aircraft/player/usa/P-51D-removebg-preview.png?v=20260410c",
    armoredAssetPath: "./assets/aircraft/player/usa/P-51D-armored-removebg-preview.png?v=20260410c",
    title: "P-51D Mustang",
    meta: "USN / Long-Range Strike",
    shortCode: "01",
    dossierTag: "Strike Package",
    dossierBody: [
      "Long-range escort tuned for repeated missile re-attack windows and heavier plating.",
      "Carries one extra armor plate so recovery windows stay forgiving under pressure.",
    ],
    statSummary: "Extra armor plate // faster missile recycle",
    combatProfile: {
      speedScale: 1,
      fireRateScale: 1,
      missileCooldownScale: 0.88,
      shieldCapBonus: 0,
      armorCapBonus: 1,
      spreadDurationBonus: 0.8,
    },
  },
  spitfire: {
    id: "spitfire",
    assetPath: "./assets/aircraft/player/raf/Spitfire-ZT-D-removebg-preview.png?v=20260401a",
    title: "Supermarine Spitfire",
    meta: "RN / Agile Interceptor",
    shortCode: "02",
    dossierTag: "Knife-Fight Interceptor",
    dossierBody: [
      "Quick-turn interceptor built for fast sector response.",
      "Sharper throttle response and a tighter primary-gun rhythm.",
    ],
    statSummary: "Higher top speed // tighter main-gun cadence",
    combatProfile: {
      speedScale: 1.08,
      fireRateScale: 0.94,
      missileCooldownScale: 1.06,
      shieldCapBonus: 0,
      armorCapBonus: 0,
      spreadDurationBonus: 0,
    },
  },
};
const AIRFRAME_ORDER = Object.keys(AIRFRAMES);
let selectedAirframeId = "p51d";
const menuAirframeHitboxes = [];
let menuHoveredAirframeId = null;
const resultButtonHitboxes = [];
let hoveredResultButton = null;
const upgradeCardHitboxes = [];
let hoveredUpgradeIndex = -1;
let canRender = false;

function buildSpriteCanvas(image, rotation = 0) {
  const offscreen = document.createElement("canvas");
  offscreen.width = image.naturalWidth;
  offscreen.height = image.naturalHeight;
  const offscreenCtx = offscreen.getContext("2d");
  if (!offscreenCtx) return null;
  if (rotation !== 0) {
    offscreenCtx.translate(offscreen.width / 2, offscreen.height / 2);
    offscreenCtx.rotate(rotation);
    offscreenCtx.drawImage(image, -offscreen.width / 2, -offscreen.height / 2);
  } else {
    offscreenCtx.drawImage(image, 0, 0);
  }
  return offscreen;
}

// Render-time scaling cache: avoid repeated drawImage resampling for common sizes.
const scaledSpriteVariants = new WeakMap();
function getScaledSpriteVariant(baseCanvas, targetHeight, step = 4) {
  if (!baseCanvas || !Number.isFinite(targetHeight) || targetHeight <= 0) return null;
  const h = Math.max(8, Math.round(targetHeight / step) * step);
  let byHeight = scaledSpriteVariants.get(baseCanvas);
  if (!byHeight) {
    byHeight = new Map();
    scaledSpriteVariants.set(baseCanvas, byHeight);
  }
  let variant = byHeight.get(h);
  if (variant) return variant;

  const aspect = baseCanvas.width / baseCanvas.height;
  const w = Math.max(8, Math.round(h * aspect));
  const offscreen = document.createElement("canvas");
  offscreen.width = w;
  offscreen.height = h;
  const offscreenCtx = offscreen.getContext("2d");
  if (!offscreenCtx) return null;
  offscreenCtx.drawImage(baseCanvas, 0, 0, w, h);
  variant = { canvas: offscreen, width: w, height: h };
  byHeight.set(h, variant);
  return variant;
}

const playerImage = new Image();
let playerSpriteCanvas = null;
let playerSpriteReady = false;
playerImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(playerImage);
  if (!offscreen) return;
  playerSpriteCanvas = offscreen;
  playerSpriteReady = true;
  if (canRender) render();
});

const playerArmoredImage = new Image();
let playerArmoredSpriteCanvas = null;
let playerArmoredSpriteReady = false;
playerArmoredImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(playerArmoredImage);
  if (!offscreen) return;
  playerArmoredSpriteCanvas = offscreen;
  playerArmoredSpriteReady = true;
  if (canRender) render();
});

for (const airframe of Object.values(AIRFRAMES)) {
  airframe.previewImage = new Image();
  airframe.previewCanvas = null;
  airframe.previewReady = false;
  airframe.previewImage.addEventListener("load", () => {
    const offscreen = buildSpriteCanvas(airframe.previewImage);
    if (!offscreen) return;
    airframe.previewCanvas = offscreen;
    airframe.previewReady = true;
    if (canRender) render();
  });
  airframe.previewImage.src = airframe.assetPath;
}

function loadSelectedAirframe() {
  const airframe = AIRFRAMES[selectedAirframeId] || AIRFRAMES.p51d;
  playerSpriteReady = false;
  playerSpriteCanvas = null;
  playerImage.src = airframe.assetPath;
  playerArmoredSpriteReady = false;
  playerArmoredSpriteCanvas = null;
  if (airframe.armoredAssetPath) {
    playerArmoredImage.src = airframe.armoredAssetPath;
  }
  applyCombatProfile();
  invalidateUiCaches();
  syncAirframeDossier();
  if (canRender) render();
}

function syncAirframeDossier() {
  const airframe = getSelectedAirframe();
  if (!airframeDossierEl || !airframe) return;
  if (airframeDossierImageEl) {
    airframeDossierImageEl.src = airframe.assetPath;
    airframeDossierImageEl.alt = `${airframe.title} preview`;
  }
  if (airframeDossierCodeEl) airframeDossierCodeEl.textContent = airframe.shortCode;
  if (airframeDossierTitleEl) airframeDossierTitleEl.textContent = airframe.title;
  if (airframeDossierMetaEl) airframeDossierMetaEl.textContent = airframe.meta;
  if (airframeDossierTagEl) airframeDossierTagEl.textContent = airframe.dossierTag;
  if (airframeDossierLine1El) airframeDossierLine1El.textContent = airframe.dossierBody?.[0] || "";
  if (airframeDossierLine2El) airframeDossierLine2El.textContent = airframe.dossierBody?.[1] || "";
  if (airframeDossierStatusEl) airframeDossierStatusEl.textContent = airframe.dossierTag;
  if (airframeDossierFootnoteEl) airframeDossierFootnoteEl.textContent = airframe.statSummary;
}

const enemyClaudeImage = new Image();
let enemyClaudeSpriteCanvas = null;
let enemyClaudeSpriteReady = false;
enemyClaudeImage.src = "./assets/aircraft/enemies/ijn/A5M-Claude-removebg-preview.png?v=20260401a";
enemyClaudeImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(enemyClaudeImage, Math.PI);
  if (!offscreen) return;
  enemyClaudeSpriteCanvas = offscreen;
  enemyClaudeSpriteReady = true;
  render();
});

const enemyZeroImage = new Image();
let enemyZeroSpriteCanvas = null;
let enemyZeroSpriteReady = false;
enemyZeroImage.src = "./assets/aircraft/enemies/ijn/A6M2-Zero-Model-21-removebg-preview.png?v=20260401a";
enemyZeroImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(enemyZeroImage, Math.PI);
  if (!offscreen) return;
  enemyZeroSpriteCanvas = offscreen;
  enemyZeroSpriteReady = true;
  eliteSpriteCanvas = offscreen;
  eliteSpriteReady = true;
  render();
});

let eliteSpriteCanvas = null;
let eliteSpriteReady = false;

const enemyA6M5Image = new Image();
let enemyA6M5SpriteCanvas = null;
let enemyA6M5SpriteReady = false;
enemyA6M5Image.src = "./assets/aircraft/enemies/ijn/A6M5-Zero-Model-52-removebg-preview.png?v=20260402d";
enemyA6M5Image.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(enemyA6M5Image, Math.PI);
  if (!offscreen) return;
  enemyA6M5SpriteCanvas = offscreen;
  enemyA6M5SpriteReady = true;
  render();
});

const enemyN1K2Image = new Image();
let enemyN1K2SpriteCanvas = null;
let enemyN1K2SpriteReady = false;
enemyN1K2Image.src = "./assets/aircraft/enemies/ijn/N1K2-J-Shiden-Kai-removebg-preview.png?v=20260402d";
enemyN1K2Image.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(enemyN1K2Image, Math.PI);
  if (!offscreen) return;
  enemyN1K2SpriteCanvas = offscreen;
  enemyN1K2SpriteReady = true;
  render();
});

const enemyA7M2Image = new Image();
let enemyA7M2SpriteCanvas = null;
let enemyA7M2SpriteReady = false;
enemyA7M2Image.src = "./assets/aircraft/enemies/ijn/A7M2-Reppu-removebg-preview.png?v=20260403a";
enemyA7M2Image.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(enemyA7M2Image, Math.PI);
  if (!offscreen) return;
  enemyA7M2SpriteCanvas = offscreen;
  enemyA7M2SpriteReady = true;
  render();
});

const enemyJ2MImage = new Image();
let enemyJ2MSpriteCanvas = null;
let enemyJ2MSpriteReady = false;
enemyJ2MImage.src = "./assets/aircraft/enemies/ijn/J2M-Raiden-Jack-removebg-preview.png?v=20260403a";
enemyJ2MImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(enemyJ2MImage, Math.PI);
  if (!offscreen) return;
  enemyJ2MSpriteCanvas = offscreen;
  enemyJ2MSpriteReady = true;
  render();
});

const bossImage = new Image();
let bossSpriteCanvas = null;
let bossSpriteReady = false;
bossImage.src = "./assets/aircraft/enemies/boss/boss_plane_transparent.png?v=20260330u";
bossImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(bossImage, Math.PI);
  if (!offscreen) return;
  bossSpriteCanvas = offscreen;
  bossSpriteReady = true;
  render();
});

const kongoImage = new Image();
let kongoSpriteCanvas = null;
let kongoSpriteReady = false;
kongoImage.src = "./assets/naval/bosses/KONGO-CLASS-removebg-preview.png?v=20260404ship";
kongoImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(kongoImage);
  if (!offscreen) return;
  kongoSpriteCanvas = offscreen;
  kongoSpriteReady = true;
  render();
});

const nagatoImage = new Image();
let nagatoSpriteCanvas = null;
let nagatoSpriteReady = false;
nagatoImage.src = "./assets/naval/candidates/NAGATO-CLASS-removebg-preview.png?v=20260404ship";
nagatoImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(nagatoImage);
  if (!offscreen) return;
  nagatoSpriteCanvas = offscreen;
  nagatoSpriteReady = true;
  render();
});

const yamatoImage = new Image();
let yamatoSpriteCanvas = null;
let yamatoSpriteReady = false;
yamatoImage.src = "./assets/naval/candidates/YAMATO-CLASS-removebg-preview.png?v=20260404ship";
yamatoImage.addEventListener("load", () => {
  const offscreen = buildSpriteCanvas(yamatoImage);
  if (!offscreen) return;
  yamatoSpriteCanvas = offscreen;
  yamatoSpriteReady = true;
  render();
});

// Runtime background image (drawn into the canvas, behind stars/glow).
const runtimeBgImage = new Image();
let runtimeBgImageReady = false;
let runtimeBgDrawW = 0;
let runtimeBgDrawH = 0;
let runtimeBgCoverCanvas = null;
let runtimeBgCoverReady = false;
// "applied" version is more blurred/clean for HUD readability.
runtimeBgImage.src = "./assets/runtime-bg-pacific-no-text-no-flags-1600x1120.png?v=20260403bg1";
runtimeBgImage.addEventListener("load", () => {
  runtimeBgImageReady = true;
  // Precompute cover scaling so per-frame parallax is just offsets + drawImage.
  const padding = 22;
  const targetW = canvas.width + padding * 2;
  const targetH = canvas.height + padding * 2;
  const scale = Math.max(targetW / runtimeBgImage.naturalWidth, targetH / runtimeBgImage.naturalHeight);
  runtimeBgDrawW = runtimeBgImage.naturalWidth * scale;
  runtimeBgDrawH = runtimeBgImage.naturalHeight * scale;

  // Blur once into an offscreen canvas so per-frame drawing stays cheap.
  const c = document.createElement("canvas");
  c.width = Math.ceil(runtimeBgDrawW);
  c.height = Math.ceil(runtimeBgDrawH);
  const gctx = c.getContext("2d");
  if (gctx) {
    gctx.clearRect(0, 0, c.width, c.height);
    gctx.save();
    // Make the source image read as "texture" only.
    // Keep the blueprint texture visible enough under HUD glass.
    // (We already blur it once into an offscreen canvas; do not over-blur or it disappears.)
    gctx.globalAlpha = 1;
    // Tune for "environment layer": keep it readable but stop it from抢HUD细节。
    gctx.filter = "blur(3.2px) saturate(0.88) brightness(0.98) contrast(0.92)";
    gctx.drawImage(runtimeBgImage, 0, 0, c.width, c.height);
    gctx.restore();

    // Gentle darkening overlay to keep HUD readable.
    gctx.fillStyle = "rgba(8, 28, 46, 0.2)";
    gctx.fillRect(0, 0, c.width, c.height);
    runtimeBgCoverCanvas = c;
    runtimeBgCoverReady = true;
  }

  render();
});

const bulletImage = new Image();
let bulletSpriteCanvas = null;
let bulletSpriteReady = false;
let bulletSpriteVariant = null;
bulletImage.src = "./assets/weapons/bullets/bullet.png?v=20260330u";
bulletImage.addEventListener("load", () => {
  const offscreen = document.createElement("canvas");
  offscreen.width = bulletImage.naturalWidth;
  offscreen.height = bulletImage.naturalHeight;
  const offscreenCtx = offscreen.getContext("2d");
  if (!offscreenCtx) return;
  offscreenCtx.drawImage(bulletImage, 0, 0);
  bulletSpriteCanvas = offscreen;
  bulletSpriteVariant = getScaledSpriteVariant(offscreen, 22, 1);
  bulletSpriteReady = true;
  render();
});

const enemyBulletKinds = ["normal", "elite", "boss"];
const enemyBulletSpriteCanvases = {
  normal: null,
  elite: null,
  boss: null,
};
const enemyBulletRenderSprites = {
  normal: null,
  elite: null,
  boss: null,
};
const enemyBulletSpriteReady = {
  normal: false,
  elite: false,
  boss: false,
};

enemyBulletKinds.forEach((kind) => {
  const enemyBulletImage = new Image();
  enemyBulletImage.src = `./assets/weapons/bullets/enemy_bullet_${kind}.png?v=20260402b`;
  enemyBulletImage.addEventListener("load", () => {
    const offscreen = buildSpriteCanvas(enemyBulletImage, Math.PI);
    if (!offscreen) return;
    enemyBulletSpriteCanvases[kind] = offscreen;
    enemyBulletRenderSprites[kind] = getScaledSpriteVariant(offscreen, kind === "boss" ? 30 : 25, 1);
    enemyBulletSpriteReady[kind] = true;
    render();
  });
});

const missileImage = new Image();
let missileSpriteCanvas = null;
let missileSpriteReady = false;
// Rocket front view asset provided by you.
missileImage.src = "./assets/weapons/missiles/daodan.png?v=20260330u";
missileImage.addEventListener("load", () => {
  const offscreen = document.createElement("canvas");
  offscreen.width = missileImage.naturalWidth;
  offscreen.height = missileImage.naturalHeight;
  const offscreenCtx = offscreen.getContext("2d");
  if (!offscreenCtx) return;
  offscreenCtx.drawImage(missileImage, 0, 0);
  missileSpriteCanvas = offscreen;
  missileSpriteReady = true;
  render();
});

// Pre-render a muzzle flash sprite to avoid per-flash radialGradient allocations.
let muzzleFlashSpriteCanvas = null;
let muzzleFlashSpriteSize = 0;
function buildMuzzleFlashSprite() {
  const size = 24;
  muzzleFlashSpriteSize = size;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const mctx = c.getContext("2d");
  if (!mctx) return;

  const cx = size / 2;
  const cy = size / 2;
  const grad = mctx.createRadialGradient(cx, cy, 1, cx, cy, 12);
  grad.addColorStop(0, "rgba(255,250,219,0.95)");
  grad.addColorStop(0.35, "rgba(255,193,92,0.85)");
  grad.addColorStop(1, "rgba(255,193,92,0)");

  // Upward triangle portion.
  mctx.fillStyle = grad;
  mctx.beginPath();
  mctx.moveTo(cx, cy - 7);
  mctx.lineTo(cx - 5.5, cy + 4.5);
  mctx.lineTo(cx + 5.5, cy + 4.5);
  mctx.closePath();
  mctx.fill();

  // Central glow dot portion.
  mctx.fillStyle = grad;
  mctx.beginPath();
  mctx.arc(cx, cy, 8, 0, Math.PI * 2);
  mctx.fill();

  muzzleFlashSpriteCanvas = c;
}

buildMuzzleFlashSprite();

const STAGE_COUNT = 3;

const ENEMY_CAPS = {
  normal: 12,
  elite: 3,
  airTotal: 14,
};

const PERFORMANCE_CAPS = {
  enemyBulletsMax: 160,
  explosionParticlesMax: 420,
  shockwavesMax: 56,
  explosionParticlesPerFrame: 72,
  shockwavesPerFrame: 3,
};

const effectSpawnBudget = {
  explosions: 0,
  shockwaves: 0,
};

function getStageProgress(stage) {
  if (stage <= 1) return { bossSpawnScore: 30, targetScore: 30 };
  if (stage === 2) return { bossSpawnScore: 55, targetScore: 60 };
  return { bossSpawnScore: 90, targetScore: 95 };
}

function getStageBossVariant(stage) {
  if (stage >= 3) return "yamato";
  if (stage >= 2) return "nagato";
  return "kongo";
}

function getBossDisplayName(variant) {
  if (variant === "yamato") return "YAMATO-CLASS";
  if (variant === "nagato") return "NAGATO-CLASS";
  return "KONGO-CLASS";
}

function getBossWarningText(stage) {
  if (stage >= 3) {
    return {
      ja: "大和型戦艦 接近",
      zh: "大和级战列舰接近",
      en: "YAMATO-CLASS BATTLESHIP APPROACHING",
    };
  }
  if (stage >= 2) {
    return {
      ja: "長門型戦艦 接近",
      zh: "长门级战列舰接近",
      en: "NAGATO-CLASS BATTLESHIP APPROACHING",
    };
  }
  return {
    ja: "金剛型戦艦 接近",
    zh: "金刚级战列舰接近",
    en: "KONGO-CLASS BATTLESHIP APPROACHING",
  };
}

function getStageLoadout(stage) {
  if (stage >= 3) {
    return {
      act: "第三幕 · 决战海域",
      airMainJa: "烈風",
      airMainEn: "A7M2 REPPU",
      airMainSrc: "./assets/aircraft/enemies/ijn/A7M2-Reppu-removebg-preview.png?v=20260403a",
      airEliteJa: "雷電",
      airEliteEn: "J2M RAIDEN",
      airEliteSrc: "./assets/aircraft/enemies/ijn/J2M-Raiden-Jack-removebg-preview.png?v=20260403a",
      bossJa: "大和級戦艦",
      bossEn: "YAMATO-CLASS BATTLESHIP",
      bossSrc: "./assets/naval/candidates/YAMATO-CLASS-removebg-preview.png?v=20260404ship",
    };
  }
  if (stage >= 2) {
    return {
      act: "第二幕 · 深水拦截",
      airMainJa: "零戦五二型",
      airMainEn: "A6M5 ZERO MODEL 52",
      airMainSrc: "./assets/aircraft/enemies/ijn/A6M5-Zero-Model-52-removebg-preview.png?v=20260402d",
      airEliteJa: "紫電改",
      airEliteEn: "N1K2 SHIDEN-KAI",
      airEliteSrc: "./assets/aircraft/enemies/ijn/N1K2-J-Shiden-Kai-removebg-preview.png?v=20260402d",
      bossJa: "長門級戦艦",
      bossEn: "NAGATO-CLASS BATTLESHIP",
      bossSrc: "./assets/naval/candidates/NAGATO-CLASS-removebg-preview.png?v=20260404ship",
    };
  }
  return {
    act: "第一幕 · 前沿接敌",
    airMainJa: "九六艦戦",
    airMainEn: "A5M CLAUDE",
    airMainSrc: "./assets/aircraft/enemies/ijn/A5M-Claude-removebg-preview.png?v=20260401a",
    airEliteJa: "零戦二一型",
    airEliteEn: "A6M2 ZERO MODEL 21",
    airEliteSrc: "./assets/aircraft/enemies/ijn/A6M2-Zero-Model-21-removebg-preview.png?v=20260401a",
    bossJa: "金剛級戦艦",
    bossEn: "KONGO-CLASS BATTLESHIP",
    bossSrc: "./assets/naval/bosses/KONGO-CLASS-removebg-preview.png?v=20260404ship",
  };
}

const BASE_PLAYER_STATS = {
  speed: 340,
  fireInterval: 0.17,
  spreadFireInterval: 0.13,
  missileCooldown: 1.6,
  maxShield: 3,
  maxArmor: 1,
  spreadDuration: 7.5,
};
// Short i-frame/buffer after taking a hit to prevent rapid consecutive damage.
const PLAYER_INVULN_DURATION = 0.22;

function createDefaultRunBonuses() {
  return {
    speedScale: 1,
    fireRateScale: 1,
    missileCooldownScale: 1,
    shieldCapBonus: 0,
    armorCapBonus: 0,
    armorInvulnBonus: 0,
    spreadDurationBonus: 0,
  };
}

const RUN_UPGRADE_POOL = [
  {
    id: "afterburner-trim",
    label: "Afterburner Trim",
    shortLabel: "Afterburner",
    description: "Loosens the airframe for faster lateral correction through dense bullet lanes.",
    statLine: "+8% move speed",
    apply() {
      state.runBonuses.speedScale *= 1.08;
    },
  },
  {
    id: "gun-harmonization",
    label: "Gun Harmonization",
    shortLabel: "Gun Feed",
    description: "Tightens wing-gun timing so the main battery cycles sooner on every burst.",
    statLine: "-8% primary cooldown",
    apply() {
      state.runBonuses.fireRateScale *= 0.92;
    },
  },
  {
    id: "rapid-rack",
    label: "Rapid Rack",
    shortLabel: "Rapid Rack",
    description: "Shortens missile recycle time so large contacts are pressured more often.",
    statLine: "-14% missile cooldown",
    apply() {
      state.runBonuses.missileCooldownScale *= 0.86;
    },
  },
  {
    id: "shield-relay",
    label: "Shield Relay",
    shortLabel: "Shield Relay",
    description: "Expands reserve shielding and immediately tops one charge back into the bay.",
    statLine: "+1 shield cap and +1 charge",
    apply() {
      state.runBonuses.shieldCapBonus += 1;
    },
  },
  {
    id: "armor-belt",
    label: "Armor Belt",
    shortLabel: "Armor Belt",
    description: "Adds a sacrificial armor plate and extends the recovery window after the plating breaks.",
    statLine: "+1 armor and +0.16s guard",
    apply() {
      state.runBonuses.armorCapBonus += 1;
      state.runBonuses.armorInvulnBonus += 0.16;
    },
  },
  {
    id: "wide-salvo",
    label: "Wide Salvo",
    shortLabel: "Wide Salvo",
    description: "Keeps spread ammo active longer so elite waves can be pushed aggressively.",
    statLine: "+2.2s spread duration",
    apply() {
      state.runBonuses.spreadDurationBonus += 2.2;
    },
  },
];

function getStageStartScore(stage) {
  if (stage <= 1) return 0;
  return getStageProgress(stage - 1).targetScore;
}

function getAirframeCombatProfile() {
  return (AIRFRAMES[selectedAirframeId] || AIRFRAMES.p51d).combatProfile;
}

function getCombinedCombatProfile() {
  const airframeProfile = getAirframeCombatProfile();
  const runBonuses = state?.runBonuses || createDefaultRunBonuses();
  return {
    speed: BASE_PLAYER_STATS.speed * airframeProfile.speedScale * runBonuses.speedScale,
    fireInterval: BASE_PLAYER_STATS.fireInterval * airframeProfile.fireRateScale * runBonuses.fireRateScale,
    spreadFireInterval:
      BASE_PLAYER_STATS.spreadFireInterval * airframeProfile.fireRateScale * runBonuses.fireRateScale,
    missileCooldown:
      BASE_PLAYER_STATS.missileCooldown * airframeProfile.missileCooldownScale * runBonuses.missileCooldownScale,
    maxShield: BASE_PLAYER_STATS.maxShield + airframeProfile.shieldCapBonus + runBonuses.shieldCapBonus,
    maxArmor: BASE_PLAYER_STATS.maxArmor + (airframeProfile.armorCapBonus || 0) + runBonuses.armorCapBonus,
    armorInvulnDuration: PLAYER_INVULN_DURATION + (runBonuses.armorInvulnBonus || 0),
    spreadDuration:
      BASE_PLAYER_STATS.spreadDuration + airframeProfile.spreadDurationBonus + runBonuses.spreadDurationBonus,
  };
}

function applyCombatProfile() {
  if (!state?.player) return null;
  const profile = getCombinedCombatProfile();
  state.player.speed = profile.speed;
  state.fireInterval = profile.fireInterval;
  state.spreadFireInterval = profile.spreadFireInterval;
  state.missileCooldownDuration = profile.missileCooldown;
  state.playerMaxShield = profile.maxShield;
  state.playerMaxArmor = profile.maxArmor;
  state.playerArmorInvulnDuration = profile.armorInvulnDuration;
  state.playerSpreadDuration = profile.spreadDuration;
  state.player.shield = Math.min(state.player.shield, state.playerMaxShield);
  state.player.armor = Math.min(state.player.armor, state.playerMaxArmor);
  return profile;
}

function getBossPhaseDescriptor(boss, phase = boss?.phase || 1) {
  if (!boss) return "Opening volley";
  if (boss.variant === "yamato") {
    if (phase === 1) return "Opening fan spread";
    if (phase === 2) return "Alternating broadside sweep";
    return "Final heavy barrage";
  }
  if (phase === 1) return "Main battery ranging";
  if (phase === 2) return "Cross-broadside pressure";
  return "Heavy salvo collapse";
}

function announceBossPhase(boss, phase = boss?.phase || 1) {
  if (!boss) return;
  state.phaseBannerTimer = 1.5;
  state.phaseBannerText = `${getBossDisplayName(boss.variant)} // PHASE ${phase}`;
  state.phaseBannerSub = getBossPhaseDescriptor(boss, phase);
}

function pickUpgradeChoices() {
  const pool = RUN_UPGRADE_POOL.slice();
  const picks = [];
  while (pool.length && picks.length < 3) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}

function openUpgradeDraft() {
  state.mode = "upgrade";
  state.paused = false;
  state.upgradeChoices = pickUpgradeChoices();
  state.upgradeSelection = 0;
  upgradeCardHitboxes.length = 0;
  hoveredUpgradeIndex = -1;
  canvas.style.cursor = "";
  invalidateUiCaches();
  syncChrome();
  render();
}

function applyRunUpgrade(choice) {
  if (!choice?.apply) return;
  choice.apply();
  state.runUpgradeHistory.push(choice.shortLabel || choice.label);
  applyCombatProfile();
  if (choice.id === "shield-relay") {
    state.player.shield = Math.min(state.playerMaxShield, state.player.shield + 1);
  }
  if (choice.id === "armor-belt") {
    state.player.armor = Math.min(state.playerMaxArmor, state.player.armor + 1);
  }
}

function chooseUpgrade(index) {
  const choice = state.upgradeChoices[index];
  if (!choice) return;
  applyRunUpgrade(choice);
  state.upgradeChoices = [];
  state.upgradeSelection = 0;
  upgradeCardHitboxes.length = 0;
  hoveredUpgradeIndex = -1;
  advanceToNextStage();
  state.mode = "playing";
  syncChrome();
  render();
}

function skipCinematicTimers() {
  let skipped = false;
  if (state.mode === "playing" && state.bossWarningTimer > 0 && !state.bossSpawned) {
    state.bossWarningTimer = Math.min(state.bossWarningTimer, 0.2);
    skipped = true;
  }
  if (state.mode === "playing" && state.victoryDelay > 0) {
    state.victoryDelay = Math.min(state.victoryDelay, 0.14);
    skipped = true;
  }
  if (state.mode === "playing" && state.stageClearNoticeTimer > 0) {
    state.stageClearNoticeTimer = Math.min(state.stageClearNoticeTimer, 0.18);
    skipped = true;
  }
  return skipped;
}

/** Score gained this stage only — used for non-boss spawn pacing so each act’s time-to-boss stays comparable. */
function stageDifficultyScore() {
  return Math.max(0, state.score - (state.stageScoreStart || 0));
}

function applyStageProgress(stage) {
  const cfg = getStageProgress(stage);
  state.bossSpawnScore = cfg.bossSpawnScore;
  // Boss generation threshold should be based on score gained during this stage,
  // not total global score. Same delta per act so Act 2 boss pacing matches Act 1.
  state.bossSpawnScoreDelta = 30;
  state.targetScore = cfg.targetScore;
}

function advanceToNextStage() {
  // Baseline for "stage gained score" calculations.
  state.stageScoreStart = state.score;
  state.stage += 1;
  state.bossDefeated = false;
  state.bossSpawned = false;
  state.bossWarningTimer = 0;
  state.activeBoss = null;
  state.victoryDelay = 0;
  state.stageClearNoticeTimer = -1;
  state.player.invulnTimer = 0;
  applyStageProgress(state.stage);
  applyCombatProfile();
  state.bullets.length = 0;
  state.enemyBullets.length = 0;
  state.missiles.length = 0;
  state.enemies.length = 0;
  state.powerups.length = 0;
  invalidateUiCaches();
  state.paused = false;
}

const state = {
  mode: "menu",
  score: 0,
  kills: 0,
  lives: 3,
  stage: 1,
  stageScoreStart: 0,
  targetScore: 30,
  bossSpawnScore: 30,
  bossSpawnScoreDelta: 30,
  elapsed: 0,
  frame: 0,
  spawnCooldown: 0,
  fireCooldown: 0,
  fireInterval: BASE_PLAYER_STATS.fireInterval,
  spreadFireInterval: BASE_PLAYER_STATS.spreadFireInterval,
  hitStop: 0,
  victoryDelay: 0,
  stageClearNoticeTimer: -1,
  stageClearNoticeDuration: 2.4,
  nextEnemyId: 1,
  bossSpawned: false,
  bossDefeated: false,
  bossWarningTimer: 0,
  bossWarningDuration: 3.2,
  phaseBannerTimer: 0,
  phaseBannerText: "",
  phaseBannerSub: "",
  player: {
    x: canvas.width / 2,
    y: canvas.height - 55,
    w: 46,
    h: 24,
    speed: BASE_PLAYER_STATS.speed,
    vx: 0,
    vy: 0,
    shield: 0,
    armor: BASE_PLAYER_STATS.maxArmor,
    invulnTimer: 0,
    spreadTimer: 0,
  },
  bullets: [],
  enemyBullets: [],
  enemies: [],
  explosions: [],
  shockwaves: [],
  muzzleFlashes: [],
  powerups: [],
  keys: { left: false, right: false, up: false, down: false, space: false },
  missiles: [],
  missileCooldown: 0,
  missileCooldownDuration: BASE_PLAYER_STATS.missileCooldown,
  playerMaxShield: BASE_PLAYER_STATS.maxShield,
  playerMaxArmor: BASE_PLAYER_STATS.maxArmor,
  playerArmorInvulnDuration: PLAYER_INVULN_DURATION,
  playerSpreadDuration: BASE_PLAYER_STATS.spreadDuration,
  activeBoss: null,
  paused: false,
  nextEliteDropType: "spread",
  normalKillsSinceDrop: 0,
  runBonuses: createDefaultRunBonuses(),
  runUpgradeHistory: [],
  upgradeChoices: [],
  upgradeSelection: 0,
};
canRender = true;

applyStageProgress(state.stage);
applyCombatProfile();

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 91) % canvas.width,
  y: (i * 47) % canvas.height,
  r: 1 + ((i * 13) % 3),
}));

const SPRITE_SCALE = {
  playerHeight: 84,
  enemyNormal: 2.32,
  enemyElite: 2.72,
  enemyBoss: 1.95,
  /** Side-view BB art is cropped tighter than older assets; scale down draw height so on-screen span matches previous art. */
  shipBossVisual: 0.72,
};

// Missile tuning constants.
const MISSILE_TRAIL_POINTS = 14;
const MISSILE_TRAIL_SEGMENTS = 6;
/** Vertical limits for player center `y` (hitbox is centered on y). */
const PLAYER_MOVE_MARGIN_TOP = 118;
const PLAYER_MOVE_MARGIN_BOTTOM = 42;
/** Snap render-only coordinates to device pixels for crisper sprites. */
function snapRenderCoord(v) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  return Math.round(v * dpr) / dpr;
}
// Reused per-frame lookup to avoid O(N) enemy scans in missile steering.
const enemyByIdMap = new Map();
const ENEMY_GRID_CELL_SIZE = 80;
const enemySpatialGrid = {
  cols: 0,
  rows: 0,
  buckets: [],
};

function rebuildEnemySpatialGrid() {
  const cols = Math.ceil(canvas.width / ENEMY_GRID_CELL_SIZE);
  const rows = Math.ceil(canvas.height / ENEMY_GRID_CELL_SIZE);
  if (enemySpatialGrid.cols !== cols || enemySpatialGrid.rows !== rows || enemySpatialGrid.buckets.length !== cols * rows) {
    enemySpatialGrid.cols = cols;
    enemySpatialGrid.rows = rows;
    enemySpatialGrid.buckets = new Array(cols * rows);
    for (let i = 0; i < enemySpatialGrid.buckets.length; i++) enemySpatialGrid.buckets[i] = [];
  }

  const { buckets } = enemySpatialGrid;
  for (let i = 0; i < buckets.length; i++) buckets[i].length = 0;

  for (let ei = 0; ei < state.enemies.length; ei++) {
    const e = state.enemies[ei];
    if (e.dying) continue;
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const gx = Math.max(0, Math.min(cols - 1, Math.floor(cx / ENEMY_GRID_CELL_SIZE)));
    const gy = Math.max(0, Math.min(rows - 1, Math.floor(cy / ENEMY_GRID_CELL_SIZE)));
    buckets[gy * cols + gx].push(ei);
  }
}

// Pre-rendered star dot to reduce per-frame arc calls.
const STARDOT_SIZE = 6;
let starDotCanvas = null;
function buildStarDot() {
  const c = document.createElement("canvas");
  c.width = STARDOT_SIZE;
  c.height = STARDOT_SIZE;
  const sctx = c.getContext("2d");
  if (!sctx) return;
  const cx = STARDOT_SIZE / 2;
  const cy = STARDOT_SIZE / 2;
  const grad = sctx.createRadialGradient(cx, cy, 0.5, cx, cy, STARDOT_SIZE / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  sctx.fillStyle = grad;
  sctx.beginPath();
  sctx.arc(cx, cy, STARDOT_SIZE / 2, 0, Math.PI * 2);
  sctx.fill();
  starDotCanvas = c;
}

buildStarDot();

const explosionDotCache = new Map();
function getExplosionDot(color) {
  let c = explosionDotCache.get(color);
  if (c) return c;
  const size = 16;
  c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const sctx = c.getContext("2d");
  if (!sctx) return null;
  sctx.fillStyle = color;
  sctx.beginPath();
  sctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  sctx.fill();
  explosionDotCache.set(color, c);
  return c;
}

const explosionPool = [];
const shockwavePool = [];
const muzzleFlashPool = [];

function obtainExplosion() {
  return (
    explosionPool.pop() || {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 0,
      color: "#fff",
      kind: "burst",
      angle: 0,
      spin: 0,
      stretch: 1,
    }
  );
}

function releaseExplosion(p) {
  if (!p) return;
  explosionPool.push(p);
}

function obtainShockwave() {
  return shockwavePool.pop() || { x: 0, y: 0, radius: 0, maxRadius: 0, life: 0, maxLife: 0, color: "#fff" };
}

function releaseShockwave(w) {
  if (!w) return;
  shockwavePool.push(w);
}

function obtainMuzzleFlash() {
  return muzzleFlashPool.pop() || { x: 0, y: 0, life: 0, maxLife: 0, side: "left" };
}

function releaseMuzzleFlash(m) {
  if (!m) return;
  muzzleFlashPool.push(m);
}

function clearTransientEffects() {
  while (state.explosions.length) releaseExplosion(state.explosions.pop());
  while (state.shockwaves.length) releaseShockwave(state.shockwaves.pop());
  while (state.muzzleFlashes.length) releaseMuzzleFlash(state.muzzleFlashes.pop());
}

// UI caches to reduce per-frame text/layout work.
let menuOverlayCanvas = null;
let wonOverlayCanvas = null;
let lostOverlayCanvas = null;

let bgGlowCanvas = null;
let playerShadowCanvas = null;

function invalidateUiCaches() {
  menuOverlayCanvas = null;
  wonOverlayCanvas = null;
  lostOverlayCanvas = null;
  bgGlowCanvas = null;
  playerShadowCanvas = null;
  eliteSpriteCanvas = enemyZeroSpriteCanvas;
  eliteSpriteReady = enemyZeroSpriteReady;
  drawBossApproachBar._grad = null;
}

function buildBgGlowCanvas() {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const gctx = c.getContext("2d");
  if (!gctx) return;
  const glow = gctx.createRadialGradient(
    c.width * 0.5, c.height * 0.42, 0,
    c.width * 0.5, c.height * 0.42, c.width * 0.42
  );
  glow.addColorStop(0, "rgba(170, 216, 255, 0.20)");
  glow.addColorStop(0.45, "rgba(130, 195, 246, 0.10)");
  glow.addColorStop(1, "rgba(130, 195, 246, 0)");
  gctx.fillStyle = glow;
  gctx.fillRect(0, 0, c.width, c.height);
  bgGlowCanvas = c;
}

function buildPlayerShadowCanvas() {
  if (!playerSpriteReady || !playerSpriteCanvas) return;
  const drawHeight = SPRITE_SCALE.playerHeight;
  const aspect = playerSpriteCanvas.width / playerSpriteCanvas.height;
  const drawWidth = drawHeight * aspect;
  const w = Math.ceil(drawWidth * 0.58 + 4);
  const h = 30;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const sctx = c.getContext("2d");
  if (!sctx) return;
  const cx = w / 2, cy = h / 2;
  const grad = sctx.createRadialGradient(cx, cy + 1, 10, cx, cy + 1, drawWidth * 0.34);
  grad.addColorStop(0, "rgba(0,0,0,0.16)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = grad;
  sctx.beginPath();
  sctx.ellipse(cx, cy + 1, drawWidth * 0.29, 13, 0, 0, Math.PI * 2);
  sctx.fill();
  playerShadowCanvas = c;
  playerShadowCanvas._drawWidth = drawWidth;
}

loadSelectedAirframe();

function startStageCheckpoint(stageOverride = 1, { preserveRunBonuses = false } = {}) {
  state.mode = "playing";
  const stage = Math.max(1, Math.min(STAGE_COUNT, Number(stageOverride) || 1));
  state.score = getStageStartScore(stage);
  state.kills = 0;
  state.lives = 3;
  state.stage = stage;
  applyStageProgress(stage);
  state.stageScoreStart = state.score;
  state.elapsed = 0;
  state.spawnCooldown = 0.4;
  state.fireCooldown = 0;
  state.hitStop = 0;
  state.victoryDelay = 0;
  state.stageClearNoticeTimer = -1;
  state.nextEnemyId = 1;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.bossWarningTimer = 0;
  state.activeBoss = null;
  state.phaseBannerTimer = 0;
  state.phaseBannerText = "";
  state.phaseBannerSub = "";
  state.missileCooldown = 0;
  state.paused = false;
  state.upgradeChoices = [];
  state.upgradeSelection = 0;
  if (!preserveRunBonuses) {
    state.runBonuses = createDefaultRunBonuses();
    state.runUpgradeHistory = [];
  }
  state.nextEliteDropType = "spread";
  state.normalKillsSinceDrop = 0;
  applyCombatProfile();
  state.player.x = canvas.width / 2;
  state.player.y = canvas.height - 55;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.shield = preserveRunBonuses && state.playerMaxShield > BASE_PLAYER_STATS.maxShield ? 1 : 0;
  state.player.armor = state.playerMaxArmor;
  state.player.invulnTimer = 1.05;
  state.player.spreadTimer = 0;
  state.bullets.length = 0;
  state.enemyBullets.length = 0;
  state.missiles.length = 0;
  state.enemies.length = 0;
  clearTransientEffects();
  state.powerups.length = 0;
  invalidateUiCaches();
  startBtn.disabled = true;
  startBtn.hidden = true;
  hoveredResultButton = null;
  hoveredUpgradeIndex = -1;
  canvas.focus();
  syncChrome();
}

function resetGame() {
  startStageCheckpoint(1);
  applyDebugStartState();
}

function restartCurrentStage() {
  startStageCheckpoint(state.stage, { preserveRunBonuses: true });
}

function applyDebugStartState() {
  const debugStage = Number(debugFlags.get("debug_stage") || 1);
  const debugSetStage = debugFlags.get("debug_set_stage");
  if (debugSetStage === "1") {
    window.debugSetStage?.(debugStage);
  }
  if (debugFlags.get("debug_spawn_enemy") === "1") {
    const enemyKind = debugFlags.get("debug_enemy_kind") || "elite";
    window.debugSpawnEnemy?.(enemyKind);
  }
  if (debugFlags.get("debug_stage_clear_notice") === "1") {
    window.debugTriggerStageClearNotice?.(debugStage);
  }
  if (debugFlags.get("debug_boss_warning") === "1") {
    window.debugTriggerBossWarning?.(debugStage);
  }
}

function returnToMenu() {
  state.mode = "menu";
  state.paused = false;
  state.score = 0;
  state.kills = 0;
  state.lives = 3;
  state.stage = 1;
  applyStageProgress(1);
  state.stageScoreStart = 0;
  state.elapsed = 0;
  state.spawnCooldown = 0;
  state.fireCooldown = 0;
  state.hitStop = 0;
  state.victoryDelay = 0;
  state.stageClearNoticeTimer = -1;
  state.nextEnemyId = 1;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.bossWarningTimer = 0;
  state.activeBoss = null;
  state.phaseBannerTimer = 0;
  state.phaseBannerText = "";
  state.phaseBannerSub = "";
  state.missileCooldown = 0;
  state.runBonuses = createDefaultRunBonuses();
  state.runUpgradeHistory = [];
  state.upgradeChoices = [];
  state.upgradeSelection = 0;
  state.nextEliteDropType = "spread";
  state.normalKillsSinceDrop = 0;
  applyCombatProfile();
  state.player.x = canvas.width / 2;
  state.player.y = canvas.height - 55;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.shield = 0;
  state.player.armor = state.playerMaxArmor;
  state.player.invulnTimer = 0;
  state.player.spreadTimer = 0;
  state.bullets.length = 0;
  state.enemyBullets.length = 0;
  state.missiles.length = 0;
  state.enemies.length = 0;
  clearTransientEffects();
  state.powerups.length = 0;
  invalidateUiCaches();
  startBtn.disabled = false;
  startBtn.hidden = false;
  canvas.style.cursor = "";
  hoveredResultButton = null;
  hoveredUpgradeIndex = -1;
  resultButtonHitboxes.length = 0;
  upgradeCardHitboxes.length = 0;
  syncChrome();
  render();
}

function allSpritesReady() {
  return (
    playerSpriteReady &&
    enemyClaudeSpriteReady &&
    enemyZeroSpriteReady &&
    enemyA6M5SpriteReady &&
    enemyN1K2SpriteReady &&
    enemyA7M2SpriteReady &&
    enemyJ2MSpriteReady &&
    eliteSpriteReady &&
    bossSpriteReady &&
    bulletSpriteReady &&
    missileSpriteReady &&
    kongoSpriteReady &&
    nagatoSpriteReady &&
    yamatoSpriteReady
  );
}

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    invalidateUiCaches();
    render();
  });
}

function getTheatreIntelBrief() {
  const inBossFight = !!(state.activeBoss && !state.activeBoss.dying);
  if (state.stage >= 3) {
    return {
      act: "第三幕 · 决战海域",
      air: "敌机：烈风 · 精锐：雷电",
      bb: inBossFight ? "主力舰：大和级（交战）" : "主力舰目标：大和级",
    };
  }
  if (state.stage >= 2) {
    return {
      act: "第二幕 · 深水拦截",
      air: "敌机：零战五二型 · 精锐：紫电改",
      bb: inBossFight ? "主力舰：长门级（交战）" : "主力舰目标：长门级",
    };
  }
  return {
    act: "第一幕 · 前沿接敌",
    air: "敌机：九六舰战 / 零战二一 · 精锐：零战二一",
    bb: inBossFight ? "主力舰：金刚级（交战）" : "主力舰目标：金刚级",
  };
}

const uiSyncCache = {
  inAction: null,
  augmentSig: "",
  bossWarnClass: null,
  bossActiveClass: null,
  nextSlowPanelSyncAt: 0,
  nextFastPanelSyncAt: 0,
};

const UI_PANEL_SLOW_SYNC_MS = 100;
const UI_PANEL_FAST_SYNC_MS = 50;

function setTextIfChanged(el, value) {
  if (!el) return;
  const next = String(value);
  if (el.textContent !== next) el.textContent = next;
}

function setSrcIfChanged(el, value) {
  if (!el) return;
  if (el.getAttribute("src") !== value) el.src = value;
}

function setWidthIfChanged(el, value) {
  if (!el) return;
  if (el.style.width !== value) el.style.width = value;
}

function syncTacticalIntelPanel(nowMs = performance.now(), force = false) {
  const inAction = state.mode !== "menu";
  if (!tacticalIntelStageEl) return;
  if (!inAction) {
    if (tacticalIntelWarningEl && !tacticalIntelWarningEl.hidden) tacticalIntelWarningEl.hidden = true;
    uiSyncCache.nextSlowPanelSyncAt = 0;
    uiSyncCache.nextFastPanelSyncAt = 0;
    return;
  }

  const doSlowSync = force || nowMs >= uiSyncCache.nextSlowPanelSyncAt;
  const doFastSync = force || doSlowSync || nowMs >= uiSyncCache.nextFastPanelSyncAt;
  if (doSlowSync) uiSyncCache.nextSlowPanelSyncAt = nowMs + UI_PANEL_SLOW_SYNC_MS;
  if (doFastSync) uiSyncCache.nextFastPanelSyncAt = nowMs + UI_PANEL_FAST_SYNC_MS;

  const loadout = getStageLoadout(state.stage);
  const bossVariant =
    state.activeBoss && !state.activeBoss.dying && state.activeBoss.variant
      ? state.activeBoss.variant
      : getStageBossVariant(state.stage);
  const stageProgress = stageDifficultyScore();
  const bossBand = Math.max(1, state.bossSpawnScoreDelta || state.bossSpawnScore || 1);
  const stageProgressClamped = Math.min(stageProgress, bossBand);

  if (doSlowSync) {
    setTextIfChanged(tacticalIntelStageEl, `STAGE ${state.stage} / ${STAGE_COUNT}`);
    setTextIfChanged(tacticalIntelMissionLabelEl, state.bossDefeated ? "Sector clear" : state.bossSpawned ? "Boss contact" : "Boss trigger");
    setTextIfChanged(tacticalIntelScoreEl, stageProgressClamped);
    setTextIfChanged(tacticalIntelTargetEl, bossBand);
    setTextIfChanged(tacticalIntelTotalEl, state.score);
    setTextIfChanged(tacticalIntelLivesEl, state.lives);
    const ratio = state.bossSpawned || state.bossDefeated
      ? 1
      : Math.max(0, Math.min(1, stageProgress / bossBand));
    setWidthIfChanged(tacticalIntelMeterFillEl, `${ratio * 100}%`);

    const brief = getTheatreIntelBrief();
    setTextIfChanged(tacticalIntelLineActEl, brief.act);

    setSrcIfChanged(tacticalIntelAirThumbMainEl, loadout.airMainSrc);
    setSrcIfChanged(tacticalIntelAirThumbEliteEl, loadout.airEliteSrc);
    setSrcIfChanged(tacticalIntelBbThumbEl, loadout.bossSrc);

    setTextIfChanged(tacticalIntelLineAirMainJaEl, loadout.airMainJa);
    setTextIfChanged(tacticalIntelLineAirMainEnEl, loadout.airMainEn);
    setTextIfChanged(tacticalIntelLineAirEliteJaEl, loadout.airEliteJa);
    setTextIfChanged(tacticalIntelLineAirEliteEnEl, loadout.airEliteEn);

    setTextIfChanged(tacticalIntelLineBbJaEl, loadout.bossJa);
    setTextIfChanged(tacticalIntelLineBbEnEl, loadout.bossEn);

    if (tacticalIntelLineBbEl) {
      const isWarning = state.bossWarningTimer > 0 && !state.bossSpawned;
      const isActiveBoss = !!(state.activeBoss && !state.activeBoss.dying);
      if (uiSyncCache.bossWarnClass !== isWarning) {
        tacticalIntelLineBbEl.classList.toggle("is-warning", isWarning);
        uiSyncCache.bossWarnClass = isWarning;
      }
      if (uiSyncCache.bossActiveClass !== isActiveBoss) {
        tacticalIntelLineBbEl.classList.toggle("is-active", isActiveBoss);
        uiSyncCache.bossActiveClass = isActiveBoss;
      }
    }

    if (tacticalIntelAugmentsEl) {
      const spreadLabel = state.player.spreadTimer > 0 ? state.player.spreadTimer.toFixed(1) : "0.0";
      const missileLabel = state.missileCooldown > 0 ? state.missileCooldown.toFixed(1) : "ready";
      const augmentSig = `${selectedAirframeId}|${state.player.shield}|${state.player.armor}|${state.playerMaxArmor}|${spreadLabel}|${missileLabel}|${state.runUpgradeHistory.join(",")}`;
      if (augmentSig !== uiSyncCache.augmentSig) {
        uiSyncCache.augmentSig = augmentSig;
        tacticalIntelAugmentsEl.replaceChildren();
        const airframePill = document.createElement("span");
        airframePill.className = "tactical-intel__pill tactical-intel__pill--airframe";
        airframePill.textContent = `${getSelectedAirframe().title} // ${getSelectedAirframe().dossierTag}`;
        tacticalIntelAugmentsEl.appendChild(airframePill);
        if (state.player.shield > 0) {
          const shield = document.createElement("span");
          shield.className = "tactical-intel__pill tactical-intel__pill--shield";
          shield.textContent = `Shield ${state.player.shield}/${state.playerMaxShield}`;
          tacticalIntelAugmentsEl.appendChild(shield);
        }
        if (state.playerMaxArmor > 0) {
          const armor = document.createElement("span");
          armor.className = "tactical-intel__pill tactical-intel__pill--armor";
          const armorLabel = document.createElement("span");
          armorLabel.className = "tactical-intel__armor-label";
          armorLabel.textContent = "Armor";
          armor.appendChild(armorLabel);
          const armorSegments = document.createElement("span");
          armorSegments.className = "tactical-intel__armor-segments";
          for (let i = 0; i < state.playerMaxArmor; i++) {
            const segment = document.createElement("span");
            segment.className = "tactical-intel__armor-segment";
            if (i < state.player.armor) segment.classList.add("is-filled");
            armorSegments.appendChild(segment);
          }
          armor.appendChild(armorSegments);
          const armorValue = document.createElement("span");
          armorValue.className = "tactical-intel__armor-value";
          armorValue.textContent = `${state.player.armor}/${state.playerMaxArmor}`;
          armor.appendChild(armorValue);
          tacticalIntelAugmentsEl.appendChild(armor);
        }
        if (state.player.spreadTimer > 0) {
          const spread = document.createElement("span");
          spread.className = "tactical-intel__pill tactical-intel__pill--spread";
          spread.textContent = `Spread ${spreadLabel}s`;
          tacticalIntelAugmentsEl.appendChild(spread);
        }
        const missile = document.createElement("span");
        missile.className = "tactical-intel__pill tactical-intel__pill--missile";
        missile.textContent = state.missileCooldown > 0 ? `Missile ${missileLabel}s` : "Missile ready (M)";
        tacticalIntelAugmentsEl.appendChild(missile);
        for (const upgrade of state.runUpgradeHistory) {
          const upgradePill = document.createElement("span");
          upgradePill.className = "tactical-intel__pill tactical-intel__pill--upgrade";
          upgradePill.textContent = upgrade;
          tacticalIntelAugmentsEl.appendChild(upgradePill);
        }
      }
    }
  }

  if (doFastSync && tacticalIntelWarningEl && tacticalIntelWarningTitleEl && tacticalIntelWarningFillEl) {
    if (state.bossWarningTimer > 0 && !state.bossSpawned) {
      if (tacticalIntelWarningEl.hidden) tacticalIntelWarningEl.hidden = false;
      const p = 1 - state.bossWarningTimer / state.bossWarningDuration;
      setWidthIfChanged(tacticalIntelWarningFillEl, `${Math.max(0, Math.min(1, p)) * 100}%`);
      setTextIfChanged(tacticalIntelWarningTitleEl, getBossWarningText(state.stage).zh);
    } else if (!tacticalIntelWarningEl.hidden) {
      tacticalIntelWarningEl.hidden = true;
    }
  }
}

function syncChrome(nowMs = performance.now()) {
  const inAction = state.mode !== "menu";
  const modeChanged = uiSyncCache.inAction !== inAction;
  const stageClearNoticeActive = state.mode === "playing" && state.stageClearNoticeTimer > 0;
  document.body.classList.toggle("game-paused", state.mode === "playing" && state.paused);
  if (modeChanged) {
    document.body.classList.toggle("in-action", inAction);
    if (titleEl) titleEl.setAttribute("aria-hidden", inAction ? "true" : "false");
    if (tipEl) tipEl.setAttribute("aria-hidden", inAction ? "true" : "false");
    uiSyncCache.inAction = inAction;
    uiSyncCache.nextSlowPanelSyncAt = 0;
    uiSyncCache.nextFastPanelSyncAt = 0;
  }
  document.body.classList.toggle("stage-clear-notice", stageClearNoticeActive);
  syncTacticalIntelPanel(nowMs, modeChanged);
}

function setGamePaused(next) {
  if (state.mode !== "playing") return;
  const on = !!next;
  if (state.paused === on) return;
  state.paused = on;
  if (on) {
    state.keys.left = false;
    state.keys.right = false;
    state.keys.up = false;
    state.keys.down = false;
    state.keys.space = false;
  }
  syncChrome();
}

function createExplosion(x, y, color = "#ffd56c", count = 14) {
  const roomByCount = Math.max(0, PERFORMANCE_CAPS.explosionParticlesMax - state.explosions.length);
  const roomByFrame = Math.max(0, PERFORMANCE_CAPS.explosionParticlesPerFrame - effectSpawnBudget.explosions);
  const spawnCount = Math.min(count, roomByCount, roomByFrame);

  for (let i = 0; i < spawnCount; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
    const speed = 60 + Math.random() * 140;
    const life = 0.58 + Math.random() * 0.35;
    const p = obtainExplosion();
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.maxLife = life;
    p.size = 3 + Math.random() * 4.8;
    p.color = color;
    p.kind = "burst";
    p.angle = 0;
    p.spin = 0;
    p.stretch = 1;
    state.explosions.push(p);
    effectSpawnBudget.explosions += 1;
  }

  const canSpawnCore =
    state.explosions.length < PERFORMANCE_CAPS.explosionParticlesMax &&
    effectSpawnBudget.explosions < PERFORMANCE_CAPS.explosionParticlesPerFrame;
  if (!canSpawnCore) return;

  const core = obtainExplosion();
  core.x = x;
  core.y = y;
  core.vx = 0;
  core.vy = 0;
  core.life = 0.24;
  core.maxLife = 0.24;
  core.size = 14;
  core.color = "#fff0bc";
  core.kind = "burst";
  core.angle = 0;
  core.spin = 0;
  core.stretch = 1;
  state.explosions.push(core);
  effectSpawnBudget.explosions += 1;
}

function createArmorDeflectBurst(x, y, impactVx = 0, impactVy = 1) {
  const norm = Math.hypot(impactVx, impactVy) || 1;
  const dirX = impactVx / norm;
  const dirY = impactVy / norm;
  const tangentX = -dirY;
  const tangentY = dirX;
  const sparkCount = 7;
  const roomByCount = Math.max(0, PERFORMANCE_CAPS.explosionParticlesMax - state.explosions.length);
  const roomByFrame = Math.max(0, PERFORMANCE_CAPS.explosionParticlesPerFrame - effectSpawnBudget.explosions);
  const spawnCount = Math.min(sparkCount, roomByCount, roomByFrame);
  for (let i = 0; i < spawnCount; i++) {
    const spark = obtainExplosion();
    const spread = (Math.random() - 0.5) * 1.8;
    const speed = 120 + Math.random() * 120;
    spark.x = x + tangentX * spread * 4;
    spark.y = y + tangentY * spread * 4;
    spark.vx = tangentX * speed + dirX * (18 + Math.random() * 30);
    spark.vy = tangentY * speed + dirY * (18 + Math.random() * 30);
    spark.life = 0.11 + Math.random() * 0.08;
    spark.maxLife = spark.life;
    spark.size = 5 + Math.random() * 4;
    spark.color = i < 2 ? "#f7fbff" : "#bed1e4";
    spark.kind = "spark";
    spark.angle = Math.atan2(spark.vy, spark.vx);
    spark.spin = 0;
    spark.stretch = 1.8 + Math.random() * 0.9;
    state.explosions.push(spark);
    effectSpawnBudget.explosions += 1;
  }

  const shardCount = 5;
  const shardRoomByCount = Math.max(0, PERFORMANCE_CAPS.explosionParticlesMax - state.explosions.length);
  const shardRoomByFrame = Math.max(0, PERFORMANCE_CAPS.explosionParticlesPerFrame - effectSpawnBudget.explosions);
  const shardSpawnCount = Math.min(shardCount, shardRoomByCount, shardRoomByFrame);
  for (let i = 0; i < shardSpawnCount; i++) {
    const shard = obtainExplosion();
    const launch = Math.random() * Math.PI * 2;
    const speed = 55 + Math.random() * 90;
    shard.x = x + Math.cos(launch) * (2 + Math.random() * 4);
    shard.y = y + Math.sin(launch) * (2 + Math.random() * 4);
    shard.vx = Math.cos(launch) * speed - dirX * (20 + Math.random() * 24);
    shard.vy = Math.sin(launch) * speed - dirY * (10 + Math.random() * 22);
    shard.life = 0.28 + Math.random() * 0.18;
    shard.maxLife = shard.life;
    shard.size = 4 + Math.random() * 3.5;
    shard.color = i % 2 === 0 ? "#d8e2ec" : "#9fb2c7";
    shard.kind = "armor-shard";
    shard.angle = launch;
    shard.spin = (Math.random() - 0.5) * 9;
    shard.stretch = 0.8 + Math.random() * 0.35;
    state.explosions.push(shard);
    effectSpawnBudget.explosions += 1;
  }
}

function createShockwave(x, y, color = "#ffe08e") {
  if (state.shockwaves.length >= PERFORMANCE_CAPS.shockwavesMax) return;
  if (effectSpawnBudget.shockwaves >= PERFORMANCE_CAPS.shockwavesPerFrame) return;

  const w = obtainShockwave();
  w.x = x;
  w.y = y;
  w.radius = 4;
  w.maxRadius = 66;
  w.life = 0.72;
  w.maxLife = 0.72;
  w.color = color;
  state.shockwaves.push(w);
  effectSpawnBudget.shockwaves += 1;
}

function resetEffectSpawnBudget() {
  effectSpawnBudget.explosions = 0;
  effectSpawnBudget.shockwaves = 0;
}

function queueEnemyBullets(...bullets) {
  if (!bullets.length) return 0;
  const room = PERFORMANCE_CAPS.enemyBulletsMax - state.enemyBullets.length;
  if (room <= 0) return 0;
  const accepted = Math.min(room, bullets.length);
  for (let i = 0; i < accepted; i++) state.enemyBullets.push(bullets[i]);
  return accepted;
}

function countActiveAirEnemies() {
  let normal = 0;
  let elite = 0;
  for (const e of state.enemies) {
    if (e.ship || e.boss || e.dying) continue;
    if (e.elite) elite += 1;
    else normal += 1;
  }
  return { normal, elite, total: normal + elite };
}

function spawnEnemy(forceNormal = false) {
  const w = 34;
  const h = 24;
  const minX = 20;
  const maxX = canvas.width - 40 - w;
  let x = minX + Math.random() * (maxX - minX);
  if (Math.random() < 0.68) {
    const nearPlayer = state.player.x - w / 2 + (Math.random() - 0.5) * 220;
    x = Math.max(minX, Math.min(maxX, nearPlayer));
  }
  const y = -h;
  const diffScore = stageDifficultyScore();
  const speed = 70 + Math.random() * 85 + Math.min(80, diffScore * 3);
  const elite = !forceNormal && diffScore >= 4 && Math.random() < Math.min(0.28, 0.08 + diffScore * 0.01);
  const normalModel =
    state.stage >= 3 ? "reppu" : state.stage >= 2 ? "a6m5" : Math.random() < 0.34 ? "claude" : "zero21";
  const movementTypeRoll = Math.random();
  let movementType = "straight";
  if (movementTypeRoll > 0.72 && movementTypeRoll <= 0.9) movementType = "sway";
  if (movementTypeRoll > 0.9) movementType = "dive";
  state.enemies.push({
    id: state.nextEnemyId++,
    x,
    y,
    w,
    h,
    speed: elite ? speed * 0.82 : speed,
    dying: false,
    deathTimer: 0,
    deathDuration: elite ? 0.56 : 0.45,
    hitFlash: 0,
    variant: Math.random() < 0.5 ? "red" : "amber",
    aircraftModel: elite ? (state.stage >= 3 ? "raiden" : state.stage >= 2 ? "n1k2" : "zero21") : normalModel,
    elite,
    hp: elite ? 3 : 1,
    maxHp: elite ? 3 : 1,
    movementType,
    swayPhase: Math.random() * Math.PI * 2,
    swayAmount: (14 + Math.random() * 30) * (elite ? 1.3 : 1),
    swaySpeed: 2.2 + Math.random() * 1.8,
    drift: (Math.random() - 0.5) * (elite ? 52 : 34),
    volleyToggle: false,
    shootCooldown: elite ? 0.18 + Math.random() * 0.13 : 0.26 + Math.random() * 0.18,
  });
}

function spawnBoss() {
  state.bossSpawned = true;
  const tier = state.stage >= 3 ? 3 : state.stage >= 2 ? 2 : 1;
  const hp = tier === 3 ? 74 : tier === 2 ? 58 : 52;
  const volleyMul = tier === 3 ? 0.8 : tier === 2 ? 0.88 : 1;
  const bossObj = {
    id: state.nextEnemyId++,
    x: -262,
    y: 82,
    w: 238,
    h: 130,
    speed: 132,
    dying: false,
    deathTimer: 0,
    deathDuration: 1.1,
    hitFlash: 0,
    variant: tier === 3 ? "yamato" : tier === 2 ? "nagato" : "kongo",
    elite: false,
    boss: true,
    ship: true,
    entering: true,
    hp,
    maxHp: hp,
    armorBulletScale: tier === 3 ? 0.76 : tier === 2 ? 0.82 : 0.88,
    armorMissileScale: tier === 3 ? 0.62 : tier === 2 ? 0.68 : 0.74,
    hitShieldWindow: tier === 3 ? 0.14 : tier === 2 ? 0.16 : 0.18,
    hitShieldTimer: 0,
    phase: 1,
    broadsideSide: "left",
    heavyVolleyToggle: false,
    movementType: "shipboss",
    swayPhase: 0,
    swayAmount: 0,
    swaySpeed: 0,
    drift: 0,
    shipVolleyScale: volleyMul,
    anchorY: 82,
    anchorX: canvas.width / 2 - 119,
    patrolMinX: 150,
    patrolMaxX: canvas.width - 150 - 238,
    patrolDir: 1,
    patrolSpeed: tier === 3 ? 24 : tier === 2 ? 21 : 18,
    specialVolleyToggle: false,
    shootCooldown: (tier === 3 ? 0.84 : tier === 2 ? 0.95 : 1.05) * volleyMul,
  };
  state.enemies.push(bossObj);
  state.activeBoss = bossObj;
  announceBossPhase(bossObj, 1);
}

function getShipBossPhase(enemy) {
  const ratio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
  if (ratio > 2 / 3) return 1;
  if (ratio > 1 / 3) return 2;
  return 3;
}

function createBullet(x, y, vx = 0, speed = 500) {
  return { x, y, w: 5, h: 14, speed, vx };
}

function createEnemyBullet(x, y, vx = 0, vy = 240, size = 6, kind = "normal") {
  return { x, y, w: size, h: size * 1.6, vx, vy, kind };
}

function createFanBullets(originX, originY, pattern, kind = "boss") {
  return pattern.map(({ vx, vy, size = 6, ox = 0, oy = 0 }) =>
    createEnemyBullet(originX + ox, originY + oy, vx, vy, size, kind)
  );
}

function getEnemyBulletPalette(kind) {
  if (kind === "boss") {
    return {
      trail: "#ff9b6a",
      core: "#ffd5a8",
      tint: "rgba(255, 132, 72, 0.9)",
      glowAlpha: 0.24,
    };
  }
  if (kind === "elite") {
    return {
      trail: "#ffd36a",
      core: "#fff0b8",
      tint: "rgba(255, 216, 104, 0.92)",
      glowAlpha: 0.22,
    };
  }
  return {
    trail: "#ff8d78",
    core: "#ffb0a1",
    tint: "rgba(255, 126, 109, 0.9)",
    glowAlpha: 0.16,
  };
}

function getEnemyBulletSprite(kind) {
  const resolved = kind === "boss" ? "boss" : kind === "elite" ? "elite" : "normal";
  if (enemyBulletRenderSprites[resolved]) return enemyBulletRenderSprites[resolved];

  const base = enemyBulletSpriteCanvases[resolved] || enemyBulletSpriteCanvases.normal;
  if (!base) return null;
  const targetHeight = resolved === "boss" ? 30 : 25;
  const variant = getScaledSpriteVariant(base, targetHeight, 1);
  if (variant) {
    enemyBulletRenderSprites[resolved] = variant;
    return variant;
  }
  return { canvas: base, width: base.width, height: base.height };
}

function shoot() {
  const bw = 5;
  const bh = 14;
  const wingOffset = state.player.w * 0.34;
  const muzzleY = state.player.y - state.player.h / 2 - bh;
  const leftX = state.player.x - wingOffset - bw / 2;
  const rightX = state.player.x + wingOffset - bw / 2;
  state.bullets.push(createBullet(leftX, muzzleY), createBullet(rightX, muzzleY));
  if (state.player.spreadTimer > 0) {
    state.bullets.push(
      createBullet(leftX, muzzleY + 2, -90, 470),
      createBullet(rightX, muzzleY + 2, 90, 470),
      createBullet(state.player.x - bw / 2, muzzleY - 2, 0, 560)
    );
  }
  const leftFlash = obtainMuzzleFlash();
  leftFlash.x = leftX + bw / 2;
  leftFlash.y = muzzleY + 3;
  leftFlash.life = 0.08;
  leftFlash.maxLife = 0.08;
  leftFlash.side = "left";

  const rightFlash = obtainMuzzleFlash();
  rightFlash.x = rightX + bw / 2;
  rightFlash.y = muzzleY + 3;
  rightFlash.life = 0.08;
  rightFlash.maxLife = 0.08;
  rightFlash.side = "right";

  state.muzzleFlashes.push(leftFlash, rightFlash);
}

function enemyCenter(e) {
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
}

function pickMissileTarget() {
  // Prefer normal enemies (non-elite, non-boss) so AoE triggers as you requested.
  let best = null;
  let bestD2 = Infinity;
  const playerCx = state.player.x;
  const playerCy = state.player.y - state.player.h / 2;

  for (const e of state.enemies) {
    if (e.dying || e.boss) continue;
    if (e.elite) continue;
    const c = enemyCenter(e);
    const dx = c.x - playerCx;
    const dy = c.y - playerCy;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = e;
    }
  }

  if (best) return best;

  // Fallback: any non-dying enemy (still avoid boss to keep balance).
  for (const e of state.enemies) {
    if (e.dying || e.boss) continue;
    const c = enemyCenter(e);
    const dx = c.x - playerCx;
    const dy = c.y - playerCy;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = e;
    }
  }

  return best;
}

function createMissile(x, y, targetEnemy) {
  const w = 8;
  const h = 18;
  const speed = 520;

  const startCx = x + w / 2;
  const startCy = y + h / 2;

  let dirX = 0;
  let dirY = -1;
  let targetId = null;
  if (targetEnemy && !targetEnemy.dying) {
    targetId = targetEnemy.id;
    const t = enemyCenter(targetEnemy);
    const dx = t.x - (x + w / 2);
    const dy = t.y - (y + h / 2);
    const len = Math.max(0.0001, Math.hypot(dx, dy));
    dirX = dx / len;
    dirY = dy / len;
  }

  const trailX = new Array(MISSILE_TRAIL_POINTS);
  const trailY = new Array(MISSILE_TRAIL_POINTS);
  trailX[0] = startCx;
  trailY[0] = startCy;

  return {
    x,
    y,
    w,
    h,
    speed,
    dirX,
    dirY,
    // How quickly the missile can turn (higher = more agile).
    turnRate: 3.4,
    // Current target (optional)
    targetId,
    // Ring buffer trail to avoid push/shift reallocations.
    trailX,
    trailY,
    trailHead: 1,
    trailCount: 1,
    life: 2.6, // seconds
  };
}

function fireMissile() {
  if (state.mode !== "playing" || state.paused) return;
  if (state.missileCooldown > 0) return;

  const missileW = 8;
  const missileH = 18;
  const muzzleY = state.player.y - state.player.h / 2 - missileH;
  const x = state.player.x - missileW / 2;
  const target = pickMissileTarget();

  state.missiles.push(createMissile(x, muzzleY, target));
  state.missileCooldown = state.missileCooldownDuration;
}

function updateMissiles(dt) {
  for (let i = state.missiles.length - 1; i >= 0; i--) {
    const m = state.missiles[i];
    m.life -= dt;
    if (m.life <= 0) {
      state.missiles.splice(i, 1);
      continue;
    }

    // Retarget if needed.
    if (m.targetId != null) {
      let t = enemyByIdMap.get(m.targetId);
      if (!t || t.dying) {
        const newT = pickMissileTarget();
        m.targetId = newT ? newT.id : null;
        t = newT || null;
      }

      if (t) {
        const c = enemyCenter(t);
        const dx = c.x - (m.x + m.w / 2);
        const dy = c.y - (m.y + m.h / 2);
        const len = Math.max(0.0001, Math.hypot(dx, dy));
        const desiredX = dx / len;
        const desiredY = dy / len;
        // Turn by blending directions, then re-normalize.
        const blend = Math.min(1, m.turnRate * dt);
        m.dirX = m.dirX + (desiredX - m.dirX) * blend;
        m.dirY = m.dirY + (desiredY - m.dirY) * blend;
        const nlen = Math.max(0.0001, Math.hypot(m.dirX, m.dirY));
        m.dirX /= nlen;
        m.dirY /= nlen;
      }
    }

    m.x += m.dirX * m.speed * dt;
    m.y += m.dirY * m.speed * dt;

    // Ring buffer trail.
    const tcx = m.x + m.w / 2;
    const tcy = m.y + m.h / 2;
    m.trailX[m.trailHead] = tcx;
    m.trailY[m.trailHead] = tcy;
    m.trailHead = (m.trailHead + 1) % MISSILE_TRAIL_POINTS;
    if (m.trailCount < MISSILE_TRAIL_POINTS) m.trailCount++;

    // Cull offscreen.
    if (m.y < -60 || m.y > canvas.height + 60 || m.x < -60 || m.x > canvas.width + 60) {
      state.missiles.splice(i, 1);
      continue;
    }
  }
}

function resolveMissileEnemyCollisions() {
  const blastRadius = 78;
  const blastRadius2 = blastRadius * blastRadius;
  const missileDamage = 1;

  function killEnemyWithDamage(enemy, amount, createSmallDeathEffects = false) {
    if (enemy.ship && enemy.boss && enemy.hitShieldTimer > 0) return;
    enemy.hitFlash = 0.2;
    const appliedDamage =
      enemy.ship && enemy.boss
        ? amount * (enemy.armorMissileScale ?? 1)
        : amount;
    enemy.hp -= appliedDamage;
    if (enemy.ship && enemy.boss) {
      enemy.hitShieldTimer = enemy.hitShieldWindow ?? 0.26;
      enemy.phase = getShipBossPhase(enemy);
    }
    if (enemy.hp <= 0 && !enemy.dying) {
      enemy.dying = true;
      enemy.deathTimer = enemy.deathDuration;
      state.kills += 1;
      state.score += enemy.boss ? 5 : enemy.elite ? 3 : 1;
      if (enemy.boss) {
        state.bossDefeated = true;
        state.activeBoss = null;
        state.victoryDelay = Math.max(enemy.deathDuration + 0.45, 1.25);
        createExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffd995", 22);
        createShockwave(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffd995");
      } else {
        maybeDropPowerup(enemy);
        if (createSmallDeathEffects) {
          const col = enemy.elite ? "#ffe2a4" : "#ffd56c";
          createExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, col, 10);
          createShockwave(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, col);
        }
      }
    }
  }

  for (let mi = state.missiles.length - 1; mi >= 0; mi--) {
    const m = state.missiles[mi];
    const mx = m.x + m.w / 2;
    const my = m.y + m.h / 2;

    for (let ei = state.enemies.length - 1; ei >= 0; ei--) {
      const e = state.enemies[ei];
      if (e.dying || e.entering) continue;
      if (!intersects(m, e)) continue;

      state.missiles.splice(mi, 1);

      // Range explosion behavior (only after hitting a NORMAL enemy)
      const hitIsNormal = !e.elite && !e.boss;
      if (hitIsNormal) {
        // Deal normal damage to the hit enemy (normal hp is 1, so it dies)
        killEnemyWithDamage(e, missileDamage, false);

        // AoE affects nearby enemies (excluding boss), within radius.
        const hitCenter = enemyCenter(e);
        createExplosion(hitCenter.x, hitCenter.y, "#88ecff", 22);
        createShockwave(hitCenter.x, hitCenter.y, "#8fdfff");

        const minGX = Math.max(0, Math.floor((hitCenter.x - blastRadius) / ENEMY_GRID_CELL_SIZE));
        const maxGX = Math.min(enemySpatialGrid.cols - 1, Math.floor((hitCenter.x + blastRadius) / ENEMY_GRID_CELL_SIZE));
        const minGY = Math.max(0, Math.floor((hitCenter.y - blastRadius) / ENEMY_GRID_CELL_SIZE));
        const maxGY = Math.min(enemySpatialGrid.rows - 1, Math.floor((hitCenter.y + blastRadius) / ENEMY_GRID_CELL_SIZE));
        for (let gy = minGY; gy <= maxGY; gy++) {
          for (let gx = minGX; gx <= maxGX; gx++) {
            const bucket = enemySpatialGrid.buckets[gy * enemySpatialGrid.cols + gx];
            for (let i = 0; i < bucket.length; i++) {
              const other = state.enemies[bucket[i]];
              if (!other || other.dying || other.boss || other === e) continue;
              const c = enemyCenter(other);
              const dx = c.x - hitCenter.x;
              const dy = c.y - hitCenter.y;
              if (dx * dx + dy * dy <= blastRadius2) {
                killEnemyWithDamage(other, 1, true);
              }
            }
          }
        }
      } else {
        // Elite/boss: direct hit only
        killEnemyWithDamage(e, missileDamage, true);
      }
      break;
    }
  }
}

function spawnPowerup(x, y, type) {
  state.powerups.push({ x, y, w: 22, h: 22, type, speed: 110, life: 8 });
}

function maybeDropPowerup(enemy) {
  const roll = Math.random();
  if (enemy.elite) {
    const type = state.nextEliteDropType;
    state.nextEliteDropType = type === "spread" ? "shield" : "spread";
    spawnPowerup(enemy.x + enemy.w / 2 - 11, enemy.y + enemy.h / 2 - 11, type);
    return;
  }
  state.normalKillsSinceDrop += 1;
  const shouldPityDrop = state.normalKillsSinceDrop >= 9;
  if (roll < 0.08 || shouldPityDrop) {
    state.normalKillsSinceDrop = 0;
    const type = state.player.shield <= 0 ? "shield" : state.player.spreadTimer <= 1 ? "spread" : roll < 0.5 ? "shield" : "spread";
    spawnPowerup(enemy.x + enemy.w / 2 - 11, enemy.y + enemy.h / 2 - 11, type);
  }
}

function damagePlayer(x, y, color = "#ff9a7d") {
  if (state.player.shield > 0) {
    state.player.shield -= 1;
    createExplosion(x, y, "#8ee6ff", 18);
    createShockwave(x, y, "#8fdfff");
    state.player.invulnTimer = PLAYER_INVULN_DURATION;
    state.hitStop = 0.05;
    return false;
  }
  if (state.player.armor > 0) {
    state.player.armor -= 1;
    const armorHitVx = x - state.player.x;
    const armorHitVy = y - state.player.y;
    createExplosion(x, y, "#dce8f4", 16);
    createArmorDeflectBurst(x, y, armorHitVx, armorHitVy);
    createShockwave(x, y, "#c3d6ea");
    state.player.invulnTimer = state.playerArmorInvulnDuration;
    state.hitStop = 0.06;
    return false;
  }
  createExplosion(x, y, color, 18);
  createShockwave(x, y, color === "#ff9a7d" ? "#ffb69d" : "#ffcaa0");
  state.player.invulnTimer = PLAYER_INVULN_DURATION;
  state.lives -= 1;
  if (state.lives <= 0) {
    state.mode = "lost";
  }
  return true;
}

function clampPlayer() {
  const half = state.player.w / 2;
  const halfH = state.player.h / 2;
  if (state.player.x < half) state.player.x = half;
  if (state.player.x > canvas.width - half) state.player.x = canvas.width - half;
  const minY = halfH + PLAYER_MOVE_MARGIN_TOP;
  const maxY = canvas.height - halfH - PLAYER_MOVE_MARGIN_BOTTOM;
  if (state.player.y < minY) state.player.y = minY;
  if (state.player.y > maxY) state.player.y = maxY;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateHitStop(dt) {
  if (state.hitStop <= 0) return false;
  state.hitStop = Math.max(0, state.hitStop - dt);
  for (const m of state.muzzleFlashes) m.life -= dt;
  for (let i = state.muzzleFlashes.length - 1; i >= 0; i--) {
    if (state.muzzleFlashes[i].life > 0) continue;
    const removed = state.muzzleFlashes[i];
    state.muzzleFlashes[i] = state.muzzleFlashes[state.muzzleFlashes.length - 1];
    state.muzzleFlashes.pop();
    releaseMuzzleFlash(removed);
  }
  return true;
}

function updateCooldowns(dt) {
  state.spawnCooldown -= dt;
  state.fireCooldown -= dt;
  state.missileCooldown = Math.max(0, state.missileCooldown - dt);
  state.phaseBannerTimer = Math.max(0, state.phaseBannerTimer - dt);
}

function updatePlayerMovementAndShooting(dt) {
  let moveX = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  let moveY = (state.keys.down ? 1 : 0) - (state.keys.up ? 1 : 0);
  if (moveX !== 0 && moveY !== 0) {
    const inv = 1 / Math.SQRT2;
    moveX *= inv;
    moveY *= inv;
  }
  state.player.vx = moveX * state.player.speed;
  state.player.vy = moveY * state.player.speed;
  state.player.x += state.player.vx * dt;
  state.player.y += state.player.vy * dt;
  state.player.spreadTimer = Math.max(0, state.player.spreadTimer - dt);
  clampPlayer();

  if (state.keys.space && state.fireCooldown <= 0) {
    shoot();
    state.fireCooldown = state.player.spreadTimer > 0 ? state.spreadFireInterval : state.fireInterval;
  }
}

function updateVictoryDelay(dt) {
  if (state.bossDefeated && state.victoryDelay > 0) {
    state.victoryDelay = Math.max(0, state.victoryDelay - dt);
    return;
  }
  if (state.bossDefeated && state.stageClearNoticeTimer > 0) {
    state.stageClearNoticeTimer = Math.max(0, state.stageClearNoticeTimer - dt);
  }
}

function handleSpawning(dt) {
  if (state.bossDefeated || state.stageClearNoticeTimer > 0) return;
  const gainedInStage = state.score - (state.stageScoreStart || 0);
  if (
    !state.bossSpawned &&
    state.bossWarningTimer <= 0 &&
    gainedInStage >= (state.bossSpawnScoreDelta || state.bossSpawnScore)
  ) {
    state.bossWarningTimer = state.bossWarningDuration;
  }
  if (!state.bossSpawned && state.bossWarningTimer > 0) {
    state.bossWarningTimer = Math.max(0, state.bossWarningTimer - dt);
    if (state.bossWarningTimer <= 0) spawnBoss();
  }
  if (!state.bossSpawned && state.bossWarningTimer <= 0 && state.spawnCooldown <= 0) {
    const air = countActiveAirEnemies();
    if (air.total >= ENEMY_CAPS.airTotal || air.normal >= ENEMY_CAPS.normal) {
      state.spawnCooldown = 0.12;
      return;
    }

    const forceNormal = air.elite >= ENEMY_CAPS.elite;
    spawnEnemy(forceNormal);

    const diffScore = stageDifficultyScore();
    state.spawnCooldown = Math.max(0.25, 1.0 - diffScore * 0.02);
  }
}

function updateBullets(dt) {
  for (const b of state.bullets) {
    b.y -= b.speed * dt;
    b.x += (b.vx || 0) * dt;
  }
  for (const b of state.enemyBullets) {
    b.y += b.vy * dt;
    b.x += (b.vx || 0) * dt;
  }
}

function updateEnemies(dt) {
  for (const e of state.enemies) {
    if (!e.dying) {
      if (e.ship && e.boss) {
        e.hitShieldTimer = Math.max(0, (e.hitShieldTimer || 0) - dt);
        const nextPhase = getShipBossPhase(e);
        if (e.phase !== nextPhase) announceBossPhase(e, nextPhase);
        e.phase = nextPhase;
      }
      if (e.ship) {
        if (e.x < e.anchorX) {
          e.x = Math.min(e.anchorX, e.x + e.speed * dt);
          if (e.x >= e.anchorX) e.entering = false;
        } else {
          e.x += e.patrolDir * e.patrolSpeed * dt;
          if (e.x <= e.patrolMinX) {
            e.x = e.patrolMinX;
            e.patrolDir = 1;
          } else if (e.x >= e.patrolMaxX) {
            e.x = e.patrolMaxX;
            e.patrolDir = -1;
          }
        }
        e.y = e.anchorY + Math.sin(state.elapsed * 0.7) * 2.5;
      } else if (e.boss) {
        if (e.y < e.anchorY) {
          e.y = Math.min(e.anchorY, e.y + e.speed * dt);
          if (e.y >= e.anchorY) e.entering = false;
        }
        e.x = canvas.width / 2 - e.w / 2 + Math.sin(state.elapsed * e.swaySpeed) * e.swayAmount;
      } else {
        e.y += e.speed * dt;
      }
      if (e.movementType === "sway") {
        e.x += Math.sin(state.elapsed * e.swaySpeed + e.swayPhase) * e.swayAmount * dt;
      } else if (e.movementType === "dive") {
        e.x += e.drift * dt;
        e.speed += 8 * dt;
      } else {
        e.x += e.drift * 0.28 * dt;
      }
      e.x = Math.max(8, Math.min(canvas.width - e.w - 8, e.x));
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0 && !e.boss) {
        const centerX = e.x + e.w / 2 - 3;
        const muzzleY = e.y + e.h - 4;
        const aim = (state.player.x - (e.x + e.w / 2)) * 0.18;
        if (state.stage >= 3) {
          if (e.elite) {
            queueEnemyBullets(
              createEnemyBullet(centerX - 4, muzzleY, aim - 56, 224, 5, "elite"),
              createEnemyBullet(centerX, muzzleY - 1, aim, 240, 6, "elite"),
              createEnemyBullet(centerX + 4, muzzleY, aim + 56, 224, 5, "elite")
            );
            e.shootCooldown = 0.16 + Math.random() * 0.08;
          } else if (e.volleyToggle) {
            queueEnemyBullets(
              createEnemyBullet(centerX - 5, muzzleY, aim - 18, 228, 5, "enemy"),
              createEnemyBullet(centerX + 5, muzzleY, aim + 18, 228, 5, "enemy")
            );
            e.shootCooldown = 0.24 + Math.random() * 0.08;
          } else {
            queueEnemyBullets(
              createEnemyBullet(centerX, muzzleY, aim, 236 + Math.random() * 12, 5, e.elite ? "elite" : "enemy")
            );
            e.shootCooldown = 0.2 + Math.random() * 0.07;
          }
          e.volleyToggle = !e.volleyToggle;
        } else {
          queueEnemyBullets(
            createEnemyBullet(centerX, muzzleY, aim, 215 + Math.random() * 28, 5, e.elite ? "elite" : "enemy")
          );
          e.shootCooldown = e.elite ? 0.2 + Math.random() * 0.14 : 0.31 + Math.random() * 0.19;
        }
      }
      if (e.ship && e.shootCooldown <= 0 && !e.entering) {
        const turretY = e.y + e.h - 6;
        const leftX = e.x + e.w * 0.22;
        const midX = e.x + e.w * 0.5;
        const rightX = e.x + e.w * 0.78;
        const shipPhase = e.phase || getShipBossPhase(e);
        const vs = e.shipVolleyScale ?? 1;
        const isYamato = e.variant === "yamato";
        if (isYamato) {
          if (shipPhase === 1) {
            queueEnemyBullets(
              ...createFanBullets(midX - 3, turretY, [
                { vx: -132, vy: 214, size: 5 },
                { vx: -74, vy: 228, size: 6 },
                { vx: 0, vy: 248, size: 8 },
                { vx: 74, vy: 228, size: 6 },
                { vx: 132, vy: 214, size: 5 },
              ], "boss")
            );
            e.shootCooldown = 0.52 * vs;
          } else if (shipPhase === 2) {
            const firingLeft = e.broadsideSide !== "right";
            const spreadDir = firingLeft ? -1 : 1;
            const broadsideX = firingLeft ? leftX : rightX;
            queueEnemyBullets(
              ...createFanBullets(broadsideX - 3, turretY, [
                { vx: 18 * spreadDir, vy: 232, size: 5 },
                { vx: 54 * spreadDir, vy: 244, size: 6 },
                { vx: 92 * spreadDir, vy: 254, size: 6 },
                { vx: 136 * spreadDir, vy: 264, size: 7 },
              ], "boss"),
              ...createFanBullets(midX - 3, turretY - 2, [
                { vx: -40 * spreadDir, vy: 248, size: 6 },
                { vx: 0, vy: 274, size: 7 },
                { vx: 40 * spreadDir, vy: 248, size: 6 },
              ], "boss")
            );
            e.broadsideSide = firingLeft ? "right" : "left";
            e.shootCooldown = 0.46 * vs;
          } else {
            if (e.specialVolleyToggle) {
              queueEnemyBullets(
                ...createFanBullets(midX - 3, turretY - 3, [
                  { vx: -168, vy: 214, size: 5 },
                  { vx: -120, vy: 228, size: 5 },
                  { vx: -72, vy: 244, size: 6 },
                  { vx: -24, vy: 264, size: 7 },
                  { vx: 24, vy: 264, size: 7 },
                  { vx: 72, vy: 244, size: 6 },
                  { vx: 120, vy: 228, size: 5 },
                  { vx: 168, vy: 214, size: 5 },
                ], "boss")
              );
              e.shootCooldown = 0.44 * vs;
            } else {
              queueEnemyBullets(
                ...createFanBullets(leftX - 3, turretY, [
                  { vx: -152, vy: 232, size: 5 },
                  { vx: -98, vy: 246, size: 6 },
                  { vx: -44, vy: 260, size: 6 },
                ], "boss"),
                ...createFanBullets(midX - 3, turretY - 4, [
                  { vx: 0, vy: 316, size: 10 },
                  { vx: -36, vy: 282, size: 7 },
                  { vx: 36, vy: 282, size: 7 },
                ], "boss"),
                ...createFanBullets(rightX - 3, turretY, [
                  { vx: 44, vy: 260, size: 6 },
                  { vx: 98, vy: 246, size: 6 },
                  { vx: 152, vy: 232, size: 5 },
                ], "boss")
              );
              e.shootCooldown = 0.48 * vs;
            }
            e.specialVolleyToggle = !e.specialVolleyToggle;
          }
        } else if (shipPhase === 1) {
          queueEnemyBullets(
            createEnemyBullet(leftX - 3, turretY, -58, 228, 6, "boss"),
            createEnemyBullet(midX - 3, turretY, 0, 244, 7, "boss"),
            createEnemyBullet(rightX - 3, turretY, 58, 228, 6, "boss")
          );
          e.shootCooldown = 0.72 * vs;
        } else if (shipPhase === 2) {
          const firingLeft = e.broadsideSide !== "right";
          const broadsideX = firingLeft ? leftX : rightX;
          const spreadDir = firingLeft ? -1 : 1;
          queueEnemyBullets(
            createEnemyBullet(broadsideX - 3, turretY, 20 * spreadDir, 236, 6, "boss"),
            createEnemyBullet(broadsideX - 3, turretY, 62 * spreadDir, 248, 7, "boss"),
            createEnemyBullet(broadsideX - 3, turretY, 108 * spreadDir, 258, 7, "boss"),
            createEnemyBullet(midX - 3, turretY, 26 * spreadDir, 242, 6, "boss")
          );
          e.broadsideSide = firingLeft ? "right" : "left";
          e.shootCooldown = 0.6 * vs;
        } else {
          if (e.heavyVolleyToggle) {
            queueEnemyBullets(
              createEnemyBullet(midX - 4, turretY - 2, 0, 300, 10, "boss"),
              createEnemyBullet(leftX - 3, turretY, -58, 248, 6, "boss"),
              createEnemyBullet(rightX - 3, turretY, 58, 248, 6, "boss")
            );
            e.shootCooldown = 0.5 * vs;
          } else {
            queueEnemyBullets(
              createEnemyBullet(leftX - 3, turretY, -126, 238, 6, "boss"),
              createEnemyBullet(leftX - 3, turretY, -72, 250, 6, "boss"),
              createEnemyBullet(midX - 3, turretY, -28, 266, 7, "boss"),
              createEnemyBullet(midX - 3, turretY, 28, 266, 7, "boss"),
              createEnemyBullet(rightX - 3, turretY, 72, 250, 6, "boss"),
              createEnemyBullet(rightX - 3, turretY, 126, 238, 6, "boss")
            );
            e.shootCooldown = 0.56 * vs;
          }
          e.heavyVolleyToggle = !e.heavyVolleyToggle;
        }
      }
      if (e.boss && !e.ship && e.shootCooldown <= 0) {
        const centerX = e.x + e.w / 2;
        const muzzleY = e.y + e.h - 8;
        queueEnemyBullets(
          createEnemyBullet(centerX - 3, muzzleY, -90, 245, 7, "boss"),
          createEnemyBullet(centerX - 3, muzzleY, 0, 260, 7, "boss"),
          createEnemyBullet(centerX - 3, muzzleY, 90, 245, 7, "boss")
        );
        e.shootCooldown = 0.68;
      }
    } else {
      e.deathTimer -= dt;
    }
    e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
  }
}

function updateEffectsAndCleanup(dt) {
  for (const p of state.explosions) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.angle += (p.spin || 0) * dt;
    p.life -= dt;
  }
  for (const w of state.shockwaves) {
    const t = 1 - w.life / w.maxLife;
    w.radius = Math.max(0, w.maxRadius * t);
    w.life -= dt;
  }
  for (const p of state.powerups) {
    p.y += p.speed * dt;
    p.life -= dt;
  }
  for (const m of state.muzzleFlashes) m.life -= dt;

  for (let i = state.explosions.length - 1; i >= 0; i--) {
    if (state.explosions[i].life > 0) continue;
    const removed = state.explosions[i];
    state.explosions[i] = state.explosions[state.explosions.length - 1];
    state.explosions.pop();
    releaseExplosion(removed);
  }
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    if (state.shockwaves[i].life > 0) continue;
    const removed = state.shockwaves[i];
    state.shockwaves[i] = state.shockwaves[state.shockwaves.length - 1];
    state.shockwaves.pop();
    releaseShockwave(removed);
  }
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    if (p.life <= 0 || p.y >= canvas.height + 30) state.powerups.splice(i, 1);
  }
  for (let i = state.muzzleFlashes.length - 1; i >= 0; i--) {
    if (state.muzzleFlashes[i].life > 0) continue;
    const removed = state.muzzleFlashes[i];
    state.muzzleFlashes[i] = state.muzzleFlashes[state.muzzleFlashes.length - 1];
    state.muzzleFlashes.pop();
    releaseMuzzleFlash(removed);
  }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    if (b.y >= canvas.height + 24 || b.x <= -24 || b.x >= canvas.width + 24) state.enemyBullets.splice(i, 1);
  }
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.dying && e.deathTimer <= 0) state.enemies.splice(i, 1);
  }
}

function resolveBulletEnemyCollisions() {
  const { cols, rows, buckets: grid } = enemySpatialGrid;

  outer: for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    if (b.y + b.h < 0 || b.x + b.w < 0 || b.x > canvas.width) {
      state.bullets.splice(i, 1);
      continue;
    }

    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const gx = Math.floor(bx / ENEMY_GRID_CELL_SIZE);
    const gy = Math.floor(by / ENEMY_GRID_CELL_SIZE);

    for (let ny = gy - 1; ny <= gy + 1; ny++) {
      if (ny < 0 || ny >= rows) continue;
      for (let nx = gx - 1; nx <= gx + 1; nx++) {
        if (nx < 0 || nx >= cols) continue;
        const bucket = grid[ny * cols + nx];
        for (let bi = bucket.length - 1; bi >= 0; bi--) {
          const ei = bucket[bi];
          const e = state.enemies[ei];
          if (!e || e.dying || e.entering) continue;
          if (!intersects(b, e)) continue;

          state.bullets.splice(i, 1);
          if (e.ship && e.boss && e.hitShieldTimer > 0) {
            createExplosion(
              e.x + e.w / 2,
              e.y + e.h / 2,
              "#9edcff",
              8
            );
            createShockwave(
              e.x + e.w / 2,
              e.y + e.h / 2,
              "rgba(143, 223, 255, 0.8)"
            );
            state.hitStop = 0.02;
            continue outer;
          }
          e.hitFlash = 0.2;
          e.hp -= e.ship && e.boss ? (e.armorBulletScale ?? 1) : 1;
          if (e.ship && e.boss) {
            e.hitShieldTimer = e.hitShieldWindow ?? 0.26;
            e.phase = getShipBossPhase(e);
          }
          createExplosion(
            e.x + e.w / 2,
            e.y + e.h / 2,
            e.boss ? "#ffd995" : e.elite ? "#ffe2a4" : "#ffd56c",
            e.boss ? 10 : e.elite ? 12 : 16
          );
          createShockwave(
            e.x + e.w / 2,
            e.y + e.h / 2,
            e.boss ? "#ffd995" : e.elite ? "#fff0b5" : "#ffe08e"
          );
          state.hitStop = e.hp <= 0 ? 0.055 : 0.03;

          if (e.hp <= 0) {
            e.dying = true;
            e.deathTimer = e.deathDuration;
            state.kills += 1;
            state.score += e.boss ? 5 : e.elite ? 3 : 1;
            if (e.boss) {
              state.bossDefeated = true;
              state.activeBoss = null;
              state.victoryDelay = Math.max(e.deathDuration + 0.45, 1.25);
              createExplosion(e.x + e.w / 2, e.y + e.h / 2, "#ffcc7a", 28);
              createShockwave(e.x + e.w / 2, e.y + e.h / 2, "#ffd995");
            } else {
              maybeDropPowerup(e);
            }
          }
          continue outer;
        }
      }
    }
  }
}

function resolveEnemyBulletsPlayerCollisions(playerRect) {
  const padX = 46;
  const padY = 80;
  const minX = playerRect.x - padX;
  const maxX = playerRect.x + playerRect.w + padX;
  const minY = playerRect.y - padY;
  const maxY = playerRect.y + playerRect.h + padY;

  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    if (b.x + b.w < minX || b.x > maxX || b.y + b.h < minY || b.y > maxY) continue;
    if (!intersects(b, playerRect)) continue;

    state.enemyBullets.splice(i, 1);
    if (state.player.invulnTimer > 0) continue;
    damagePlayer(
      b.x + b.w / 2,
      b.y + b.h / 2,
      b.kind === "boss" ? "#ffb27c" : b.kind === "elite" ? "#ffe08e" : "#ff9a7d"
    );
    if (state.mode === "lost") return false;
  }
  return true;
}

function resolvePowerupsPlayerCollisions(playerRect) {
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    if (intersects(p, playerRect)) {
      if (p.type === "shield") state.player.shield = Math.min(state.playerMaxShield, state.player.shield + 1);
      if (p.type === "spread") state.player.spreadTimer = Math.max(state.player.spreadTimer, state.playerSpreadDuration);
      createExplosion(p.x + p.w / 2, p.y + p.h / 2, p.type === "shield" ? "#88ecff" : "#ffd86a", 10);
      createShockwave(p.x + p.w / 2, p.y + p.h / 2, p.type === "shield" ? "#8fdfff" : "#ffe08e");
      state.powerups.splice(i, 1);
    }
  }
}

function resolveEnemiesPlayerCollisions() {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.dying) continue;
    if (e.ship && e.boss) continue;
    const reachedBottom = e.y > canvas.height + 8;
    const hitPlayer =
      e.x < state.player.x + state.player.w / 2 && e.x + e.w > state.player.x - state.player.w / 2 && e.y + e.h > state.player.y - state.player.h / 2;
    if (reachedBottom) {
      // Removed: letting enemies slip past no longer costs lives.
      state.enemies.splice(i, 1);
      continue;
    }

    if (hitPlayer) {
      if (state.player.invulnTimer > 0) {
        // Prevent rapid consecutive hits from draining multiple shields/lives.
        state.enemies.splice(i, 1);
        continue;
      }
      if (hitPlayer && state.player.shield > 0) {
        damagePlayer(state.player.x, state.player.y - 6, "#8ee6ff");
        state.enemies.splice(i, 1);
        continue;
      }
      if (hitPlayer) {
        damagePlayer(state.player.x, state.player.y - 6, "#ff9a7d");
        if (state.mode === "lost") {
          state.enemies.splice(i, 1);
          return false;
        }
      }
      state.enemies.splice(i, 1);
    }
  }
  return true;
}

function resolveVictoryState() {
  if (!state.bossDefeated || state.victoryDelay > 0) return;
  if (state.stageClearNoticeTimer < 0) {
    state.stageClearNoticeTimer = state.stageClearNoticeDuration;
    return;
  }
  if (state.stageClearNoticeTimer > 0) return;
  if (state.stage < STAGE_COUNT) {
    openUpgradeDraft();
    return;
  }
  state.mode = "won";
}

function updatePlaying(dt) {
  state.elapsed += dt;
  resetEffectSpawnBudget();
  state.player.invulnTimer = Math.max(0, state.player.invulnTimer - dt);
  if (updateHitStop(dt)) return;

  updateCooldowns(dt);
  updatePlayerMovementAndShooting(dt);

  updateVictoryDelay(dt);
  handleSpawning(dt);

  updateBullets(dt);
  updateEnemies(dt);
  enemyByIdMap.clear();
  for (const e of state.enemies) enemyByIdMap.set(e.id, e);
  updateMissiles(dt);
  updateEffectsAndCleanup(dt);
  rebuildEnemySpatialGrid();

  resolveBulletEnemyCollisions();
  resolveMissileEnemyCollisions();

  const playerRect = {
    x: state.player.x - state.player.w / 2,
    y: state.player.y - state.player.h / 2,
    w: state.player.w,
    h: state.player.h,
  };

  if (!resolveEnemyBulletsPlayerCollisions(playerRect)) return;
  resolvePowerupsPlayerCollisions(playerRect);
  if (!resolveEnemiesPlayerCollisions()) return;

  resolveVictoryState();
}

function drawPlayerFallback() {
  const p = state.player;
  const fuselageW = p.w * 0.36;
  const fuselageH = p.h * 1.44;
  const wingSpan = p.w * 1.35;
  const wingRoot = p.w * 0.21;
  const tailSpan = p.w * 0.58;
  const topY = p.y - fuselageH / 2;
  const bottomY = p.y + fuselageH / 2;
  const noseY = topY - 7;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const shadowGrad = ctx.createRadialGradient(p.x, p.y + 9, 2, p.x, p.y + 9, wingSpan * 0.58);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0.22)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, wingSpan * 0.55, p.h * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();

  const wingGrad = ctx.createLinearGradient(p.x, topY, p.x, bottomY);
  wingGrad.addColorStop(0, "#607a66");
  wingGrad.addColorStop(1, "#395845");
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(p.x, topY + 4);
  ctx.lineTo(p.x - wingSpan / 2 + wingRoot, p.y - 3);
  ctx.lineTo(p.x - wingSpan / 2, p.y + 4);
  ctx.lineTo(p.x - wingRoot, p.y + 8);
  ctx.lineTo(p.x - tailSpan / 2, bottomY - 4.5);
  ctx.lineTo(p.x + tailSpan / 2, bottomY - 4);
  ctx.lineTo(p.x + wingRoot, p.y + 8);
  ctx.lineTo(p.x + wingSpan / 2, p.y + 4);
  ctx.lineTo(p.x + wingSpan / 2 - wingRoot, p.y - 3);
  ctx.closePath();
  ctx.fill();

  const bodyGrad = ctx.createLinearGradient(p.x - fuselageW / 2, topY, p.x + fuselageW / 2, topY);
  bodyGrad.addColorStop(0, "#304c3b");
  bodyGrad.addColorStop(0.5, "#6f8f7a");
  bodyGrad.addColorStop(1, "#2b4536");
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(p.x - fuselageW / 2, topY, fuselageW, fuselageH);

  ctx.fillStyle = "#9bb59f";
  ctx.beginPath();
  ctx.moveTo(p.x, noseY);
  ctx.lineTo(p.x - fuselageW * 0.58, topY + 3);
  ctx.lineTo(p.x + fuselageW * 0.58, topY + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#22372b";
  ctx.fillRect(p.x - fuselageW * 0.42, p.y - 2.5, fuselageW * 0.84, 8);

  ctx.fillStyle = "#6d8c79";
  ctx.fillRect(p.x - tailSpan / 2, bottomY - 5, tailSpan, 4.2);

  ctx.strokeStyle = "rgba(196, 214, 198, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x, noseY + 4);
  ctx.lineTo(p.x, bottomY - 1);
  ctx.moveTo(p.x - wingSpan * 0.38, p.y + 2);
  ctx.lineTo(p.x + wingSpan * 0.38, p.y + 2);
  ctx.stroke();

  const canopyGrad = ctx.createLinearGradient(p.x, p.y - 6, p.x, p.y + 6);
  canopyGrad.addColorStop(0, "#d6f5f0");
  canopyGrad.addColorStop(1, "#7ca79a");
  ctx.fillStyle = canopyGrad;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 1.2, 3.6, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d84334";
  ctx.beginPath();
  ctx.arc(p.x - wingSpan * 0.24, p.y + 1.4, 2.9, 0, Math.PI * 2);
  ctx.arc(p.x + wingSpan * 0.24, p.y + 1.4, 2.9, 0, Math.PI * 2);
  ctx.fill();

  const propellerLen = fuselageW * 2.2;
  const phase = state.elapsed * 56;
  const cx = p.x;
  const cy = noseY - 1.4;
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#efe6ce";
  ctx.beginPath();
  ctx.ellipse(cx, cy, propellerLen * 0.58, propellerLen * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#f2ead6";
  ctx.lineWidth = 1.8;
  for (let k = 0; k < 2; k++) {
    const a = phase + (Math.PI / 2) * k;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * propellerLen / 2, cy - Math.sin(a) * propellerLen / 2);
    ctx.lineTo(cx + Math.cos(a) * propellerLen / 2, cy + Math.sin(a) * propellerLen / 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#ead39b";
  ctx.beginPath();
  ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlayer() {
  if (state.mode === "menu") return;
  const p = state.player;
  if (!playerSpriteReady || !playerSpriteCanvas) {
    drawPlayerFallback();
    return;
  }

  const useArmored = p.armor > 0 && playerArmoredSpriteReady && playerArmoredSpriteCanvas;
  const sprite = useArmored ? playerArmoredSpriteCanvas : playerSpriteCanvas;

  const drawHeight = SPRITE_SCALE.playerHeight;
  const aspect = sprite.width / sprite.height;
  const drawWidth = drawHeight * aspect;

  ctx.save();
  const drawCx = snapRenderCoord(p.x);
  const drawCy = snapRenderCoord(p.y - 1);
  ctx.translate(drawCx, drawCy);

  if (useArmored) {
    ctx.filter = "contrast(1.08) saturate(1.12)";
  }
  ctx.drawImage(sprite, -drawWidth / 2, -drawHeight * 0.74, drawWidth, drawHeight);
  ctx.restore();
}

function drawEnemyFallback(e, rx, ry, rw, rh, flashT) {
  const topColor = e.variant === "amber" ? "#ffb76d" : "#ff8c7c";
  const bottomColor = e.variant === "amber" ? "#e35a3a" : "#e34b4b";
  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, rw, rh);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(rx + 2, ry + 2, Math.max(0, rw - 4), 2);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(rx + 1.5, ry + rh - 3, Math.max(0, rw - 3), 2);

  const eyeY = ry + rh * 0.34;
  const eyeW = Math.max(3, rw * 0.17);
  const eyeH = Math.max(3, rh * 0.22);
  ctx.fillStyle = "#3f1616";
  ctx.fillRect(rx + rw * 0.23, eyeY, eyeW, eyeH);
  ctx.fillRect(rx + rw * 0.61, eyeY, eyeW, eyeH);

  if (flashT > 0 || e.dying) {
    const pulse = e.dying ? 0.45 + Math.sin(state.elapsed * 50 + e.id) * 0.2 : flashT * 0.8;
    ctx.globalAlpha = Math.max(ctx.globalAlpha, 0.2) * Math.max(0.25, pulse);
    ctx.fillStyle = "#fff1cc";
    ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
  }
}

function drawBossApproachBar() {
  if (state.mode !== "playing") return;
  const boss = state.activeBoss;
  if (!boss || boss.dying) return;

  const barW = 290;
  const barX = (canvas.width - barW) / 2;
  const barY = 12;
  const trackH = 12;
  const ratioBoss = boss.maxHp ? Math.max(0, Math.min(1, boss.hp / boss.maxHp)) : 0;
  const shieldR = boss.ship && boss.hitShieldWindow
    ? Math.max(0, Math.min(1, (boss.hitShieldTimer || 0) / boss.hitShieldWindow))
    : 0;

  const name = getBossDisplayName(boss.variant);
  const phaseLabel = boss.ship ? `PHASE ${getShipBossPhase(boss)}/3` : "BOSS";

  ctx.save();

  ctx.textAlign = "left";
  ctx.font = "800 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(160, 206, 236, 0.9)";
  ctx.fillText("BOSS CONTACT", barX, barY + 10);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(129, 190, 238, 0.95)";
  ctx.fillText(phaseLabel, barX + barW, barY + 10);

  ctx.textAlign = "left";
  ctx.font = "800 13px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255, 238, 214, 0.96)";
  ctx.fillText(name, barX, barY + 28);

  const trackY = barY + 34;
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.roundRect(barX, trackY, barW, trackH, 999);
  ctx.fill();
  ctx.strokeStyle = "rgba(109, 168, 204, 0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!drawBossApproachBar._grad) {
    const g = ctx.createLinearGradient(barX, trackY, barX + barW, trackY);
    g.addColorStop(0, "#ffcf69");
    g.addColorStop(0.55, "#ff9c52");
    g.addColorStop(1, "#f55d4c");
    drawBossApproachBar._grad = g;
  }
  if (ratioBoss > 0) {
    ctx.fillStyle = drawBossApproachBar._grad;
    ctx.beginPath();
    ctx.roundRect(barX, trackY, Math.max(2, barW * ratioBoss), trackH, 999);
    ctx.fill();
  }

  if (shieldR > 0) {
    ctx.fillStyle = "rgba(120, 220, 255, 0.42)";
    ctx.beginPath();
    ctx.roundRect(barX, trackY, barW * shieldR, trackH, 999);
    ctx.fill();
  }

  ctx.textAlign = "right";
  ctx.font = "800 11px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(255, 230, 198, 0.92)";
  ctx.fillText(`HP ${Math.ceil(boss.hp)} / ${boss.maxHp}`, barX + barW, trackY + trackH + 15);

  ctx.textAlign = "left";
  ctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "rgba(152, 222, 255, 0.82)";
  ctx.fillText(getBossPhaseDescriptor(boss), barX, trackY + trackH + 15);

  ctx.restore();
}

function drawBossPhaseBanner() {
  if (state.mode !== "playing" || state.phaseBannerTimer <= 0 || !state.phaseBannerText) return;
  const t = Math.min(1, state.phaseBannerTimer / 1.5);
  const alpha = Math.min(1, 0.2 + t * 0.7);
  const panelW = 320;
  const panelH = 46;
  const x = (canvas.width - panelW) / 2;
  const y = 54;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(8, 22, 35, 0.88)";
  ctx.beginPath();
  ctx.roundRect(x, y, panelW, panelH, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(132, 214, 255, 0.32)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 234, 196, 0.96)";
  ctx.font = "800 14px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(state.phaseBannerText, canvas.width / 2, y + 18);
  ctx.fillStyle = "rgba(145, 229, 255, 0.84)";
  ctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(state.phaseBannerSub, canvas.width / 2, y + 33);
  ctx.restore();
}

function drawCombatStatusPanel(panelX, panelY, panelW, panelH) {
  const bossBand = Math.max(1, state.bossSpawnScoreDelta || state.bossSpawnScore || 1);
  const stageProgress = Math.min(stageDifficultyScore(), bossBand);
  const ratio = state.bossSpawned || state.bossDefeated ? 1 : stageProgress / bossBand;
  const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGrad.addColorStop(0, "rgba(7, 25, 43, 0.86)");
  panelGrad.addColorStop(1, "rgba(10, 41, 68, 0.72)");
  ctx.fillStyle = panelGrad;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 14);
  ctx.fill();

  ctx.strokeStyle = "rgba(140, 214, 255, 0.42)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#80d8ff";
  ctx.font = "700 11px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("COMBAT STATUS", panelX + 14, panelY + 16);
  ctx.fillStyle = "#eef8ff";
  ctx.font = "700 13px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(state.bossSpawned ? "BOSS CONTACT" : state.bossDefeated ? "SECTOR CLEAR" : "BOSS TRIGGER", panelX + 14, panelY + 34);
  ctx.fillStyle = "#eef8ff";
  ctx.font = "700 22px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(`${stageProgress}/${bossBand}`, panelX + 14, panelY + 58);
  ctx.fillStyle = "rgba(186, 224, 248, 0.86)";
  ctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(`TOTAL SCORE ${state.score}`, panelX + 14, panelY + 69);

  const meterX = panelX + 14;
  const meterY = panelY + 68;
  const meterW = 192;

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(meterX, meterY, meterW, 8, 999);
  ctx.fill();

  const meterGrad = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
  meterGrad.addColorStop(0, "#ffd36a");
  meterGrad.addColorStop(1, "#ff8f3c");
  ctx.fillStyle = meterGrad;
  ctx.beginPath();
  ctx.roundRect(meterX, meterY, meterW * ratio, 8, 999);
  ctx.fill();
}

function drawStageAtmosphereOverlay() {
  if (state.mode !== "playing" || state.stage < 3) return;
  const bossWarningActive = state.bossWarningTimer > 0 && !state.bossSpawned;
  const activeBoss = state.activeBoss && !state.activeBoss.dying ? state.activeBoss : null;
  const yamatoEntering = !!(activeBoss && activeBoss.variant === "yamato" && activeBoss.entering);
  const alphaBoost = bossWarningActive ? 0.12 : yamatoEntering ? 0.09 : 0.05;

  ctx.save();
  const stormGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  stormGrad.addColorStop(0, `rgba(6, 18, 30, ${0.22 + alphaBoost})`);
  stormGrad.addColorStop(0.55, `rgba(14, 34, 54, ${0.12 + alphaBoost * 0.45})`);
  stormGrad.addColorStop(1, `rgba(18, 44, 70, ${0.08 + alphaBoost * 0.25})`);
  ctx.fillStyle = stormGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const horizonY = canvas.height * 0.32;
  const seaGlow = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
  seaGlow.addColorStop(0, `rgba(103, 166, 198, ${0.02 + alphaBoost * 0.12})`);
  seaGlow.addColorStop(0.45, `rgba(46, 102, 138, ${0.08 + alphaBoost * 0.18})`);
  seaGlow.addColorStop(1, `rgba(14, 42, 70, ${0.14 + alphaBoost * 0.28})`);
  ctx.fillStyle = seaGlow;
  ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

  ctx.strokeStyle = `rgba(168, 214, 240, ${0.08 + alphaBoost * 0.18})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 8);
  ctx.lineTo(canvas.width, horizonY + 8);
  ctx.stroke();

  if (bossWarningActive || yamatoEntering) {
    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.28, 10, canvas.width / 2, canvas.height * 0.3, canvas.width * 0.72);
    vignette.addColorStop(0, `rgba(255, 120, 74, ${0.025 + alphaBoost * 0.12})`);
    vignette.addColorStop(0.46, `rgba(255, 86, 60, ${0.018 + alphaBoost * 0.08})`);
    vignette.addColorStop(1, "rgba(4, 8, 14, 0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}

function drawYamatoPresenceOverlay() {
  const boss = state.activeBoss;
  if (!boss || boss.dying || boss.variant !== "yamato") return;

  const bossCenterX = boss.x + boss.w / 2;
  const bossCenterY = boss.y + boss.h * 0.42;
  const enterT = boss.entering ? 1 - Math.max(0, boss.anchorX - boss.x) / Math.max(1, boss.anchorX + boss.w) : 1;
  const pulse = 0.5 + (Math.sin(state.elapsed * 6.6) + 1) * 0.22;

  ctx.save();
  const shadowGrad = ctx.createRadialGradient(bossCenterX, bossCenterY, 12, bossCenterX, bossCenterY, boss.w * 0.95);
  shadowGrad.addColorStop(0, `rgba(255, 236, 210, ${0.04 + enterT * 0.08})`);
  shadowGrad.addColorStop(0.36, `rgba(191, 98, 70, ${0.06 + pulse * 0.08})`);
  shadowGrad.addColorStop(1, "rgba(4, 10, 18, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(bossCenterX, bossCenterY, boss.w * 0.9, boss.h * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  if (boss.entering) {
    const wakeAlpha = 0.08 + enterT * 0.14;
    ctx.strokeStyle = `rgba(222, 242, 252, ${wakeAlpha})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(boss.x + boss.w * 0.16, boss.y + boss.h * 0.72);
    ctx.lineTo(boss.x - boss.w * 0.08, boss.y + boss.h * 0.9);
    ctx.moveTo(boss.x + boss.w * 0.84, boss.y + boss.h * 0.72);
    ctx.lineTo(boss.x + boss.w * 1.08, boss.y + boss.h * 0.9);
    ctx.stroke();

    const shockGlow = ctx.createRadialGradient(bossCenterX, boss.y + boss.h * 0.66, 8, bossCenterX, boss.y + boss.h * 0.66, boss.w * 0.7);
    shockGlow.addColorStop(0, `rgba(255, 212, 164, ${0.04 + enterT * 0.12})`);
    shockGlow.addColorStop(1, "rgba(255, 212, 164, 0)");
    ctx.fillStyle = shockGlow;
    ctx.fillRect(boss.x - boss.w * 0.2, boss.y + boss.h * 0.4, boss.w * 1.4, boss.h * 0.8);
  }
  ctx.restore();
}

function drawBossWarningOverlay() {
  if (state.bossWarningTimer <= 0 || state.bossSpawned) return;
  const progress = 1 - state.bossWarningTimer / state.bossWarningDuration;
  const flicker = 0.56 + (Math.sin(state.elapsed * 24) + 1) * 0.24;
  const alpha = Math.min(1, 0.42 + flicker + progress * 0.16);
  const isStage3 = state.stage >= 3;

  ctx.save();
  ctx.fillStyle = isStage3 ? `rgba(255, 74, 54, ${0.1 + alpha * 0.11})` : `rgba(255, 26, 26, ${0.07 + alpha * 0.075})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = 360;
  const panelH = 92;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = 126;
  const alertPulse = 0.62 + (Math.sin(state.elapsed * 20) + 1) * 0.34;

  if (isStage3) {
    const ringAlpha = 0.08 + progress * 0.12;
    ctx.strokeStyle = `rgba(255, 168, 116, ${ringAlpha})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const ry = panelY + panelH / 2 + i * 6;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, ry, 228 + i * 34, 62 + i * 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = isStage3 ? `rgba(255, 78, 64, ${0.2 + alertPulse * 0.14})` : `rgba(255, 56, 48, ${0.14 + alertPulse * 0.12})`;
  ctx.beginPath();
  ctx.roundRect(panelX - 8, panelY - 8, panelW + 16, panelH + 16, 24);
  ctx.fill();

  ctx.fillStyle = "rgba(10, 18, 28, 0.92)";
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 18);
  ctx.fill();
  const panelGlow = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGlow.addColorStop(0, `rgba(255, 70, 70, ${0.12 + alertPulse * 0.16})`);
  panelGlow.addColorStop(0.5, `rgba(255, 70, 70, ${0.04 + alertPulse * 0.06})`);
  panelGlow.addColorStop(1, "rgba(255, 88, 88, 0)");
  ctx.fillStyle = panelGlow;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 18);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 120, 104, ${0.62 + alpha * 0.26})`;
  ctx.lineWidth = 1.7;
  ctx.stroke();

  const barGrad = ctx.createLinearGradient(panelX + 18, panelY + 14, panelX + panelW - 18, panelY + 14);
  barGrad.addColorStop(0, isStage3 ? `rgba(255, 118, 82, ${0.28 + alpha * 0.28})` : `rgba(255, 74, 74, ${0.24 + alpha * 0.26})`);
  barGrad.addColorStop(0.18, isStage3 ? `rgba(255, 146, 94, ${0.88 + alpha * 0.18})` : `rgba(255, 92, 92, ${0.84 + alpha * 0.18})`);
  barGrad.addColorStop(0.5, `rgba(255, 196, 136, ${0.58 + alpha * 0.18})`);
  barGrad.addColorStop(1, "rgba(255, 92, 92, 0)");
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(panelX + 18, panelY + 12, panelW - 36, 4, 999);
  ctx.fill();

  const warningText = getBossWarningText(state.stage);
  const warnJa = warningText.ja;
  const warnEn = warningText.en;
  ctx.fillStyle = `rgba(255, ${214 + Math.round(alertPulse * 22)}, ${204 + Math.round(alertPulse * 12)}, 0.98)`;
  ctx.font = "700 24px 'Zen Old Mincho', 'Hiragino Mincho ProN', serif";
  ctx.textAlign = "center";
  ctx.fillText(warnJa, canvas.width / 2, panelY + 43);

  ctx.fillStyle = `rgba(145, 229, 255, ${0.86})`;
  ctx.font = "700 11px 'Orbitron', 'Barlow Condensed', sans-serif";
  ctx.fillText(warnEn, canvas.width / 2, panelY + 63);

  ctx.fillStyle = `rgba(255, 162, 150, ${0.7 + alpha * 0.16})`;
  ctx.font = "700 9px 'Orbitron', 'Barlow Condensed', sans-serif";
  ctx.fillText("WARNING // HEAVY SURFACE CONTACT // PRESS ENTER TO SKIP", canvas.width / 2, panelY + 79);

  ctx.restore();
}

function drawStageClearNoticeOverlay() {
  if (state.stageClearNoticeTimer <= 0 || state.mode !== "playing") return;
  const normalized = 1 - state.stageClearNoticeTimer / state.stageClearNoticeDuration;
  const fadeIn = Math.min(1, normalized / 0.16);
  const fadeOut = Math.min(1, state.stageClearNoticeTimer / 0.46);
  const visibility = Math.min(fadeIn, fadeOut);
  const easedVisibility = visibility * visibility * (3 - 2 * visibility);
  const pulse = 0.52 + (Math.sin(state.elapsed * 14) + 1) * 0.16;
  const alpha = Math.min(1, 0.14 + easedVisibility * (0.68 + pulse * 0.14));
  const isFinalStage = state.stage >= STAGE_COUNT;
  const titleJa = isFinalStage ? "旗艦撃沈 任務達成" : "旗艦撃沈 空域粛清";
  const titleEn = isFinalStage ? "MISSION ACCOMPLISHED" : "FLAGSHIP DESTROYED";
  const subtitle = isFinalStage
    ? "Primary hostile flagship destroyed. Friendly command confirms sector security."
    : "Enemy command vessel neutralized. Airspace control is temporarily restored.";
  const footer = isFinalStage
    ? "FINAL REPORT // OPERATION COMPLETE // PRESS ENTER TO CONTINUE"
    : "TACTICAL REPORT // NEXT-SECTOR INTERCEPT READY // PRESS ENTER TO CONTINUE";

  ctx.save();
  ctx.fillStyle = `rgba(123, 196, 255, ${0.025 + alpha * 0.05})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = 458;
  const panelH = 106;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = 132;
  const outerInset = 10;

  ctx.fillStyle = `rgba(112, 196, 255, ${0.08 + alpha * 0.11})`;
  ctx.beginPath();
  ctx.roundRect(panelX - outerInset, panelY - outerInset, panelW + outerInset * 2, panelH + outerInset * 2, 20);
  ctx.fill();

  ctx.fillStyle = `rgba(9, 22, 36, ${0.84 + easedVisibility * 0.1})`;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 14);
  ctx.fill();

  const panelGlow = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGlow.addColorStop(0, `rgba(120, 214, 255, ${0.1 + pulse * 0.08})`);
  panelGlow.addColorStop(0.38, `rgba(120, 214, 255, ${0.04 + pulse * 0.04})`);
  panelGlow.addColorStop(1, "rgba(120, 214, 255, 0)");
  ctx.fillStyle = panelGlow;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 14);
  ctx.fill();

  ctx.strokeStyle = `rgba(149, 224, 255, ${0.24 + alpha * 0.42})`;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + easedVisibility * 0.08})`;
  ctx.strokeRect(panelX + 9, panelY + 9, panelW - 18, panelH - 18);

  const topBarGrad = ctx.createLinearGradient(panelX + 26, panelY + 16, panelX + panelW - 26, panelY + 16);
  topBarGrad.addColorStop(0, "rgba(120, 214, 255, 0)");
  topBarGrad.addColorStop(0.14, "rgba(120, 214, 255, 0.9)");
  topBarGrad.addColorStop(0.5, "rgba(255, 219, 138, 0.82)");
  topBarGrad.addColorStop(0.86, "rgba(120, 214, 255, 0.9)");
  topBarGrad.addColorStop(1, "rgba(120, 214, 255, 0)");
  ctx.fillStyle = topBarGrad;
  ctx.beginPath();
  ctx.roundRect(panelX + 24, panelY + 14, panelW - 48, 3, 999);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(panelX + 3, panelY + 3, panelW - 6, panelH - 6, 11);
  ctx.clip();
  const sweepWidth = 96;
  const sweepTravel = panelW + sweepWidth * 2;
  const sweepX = panelX - sweepWidth + sweepTravel * normalized;
  const sweep = ctx.createLinearGradient(sweepX, panelY, sweepX + sweepWidth, panelY);
  sweep.addColorStop(0, "rgba(255,255,255,0)");
  sweep.addColorStop(0.46, `rgba(199, 240, 255, ${0.015 + easedVisibility * 0.08})`);
  sweep.addColorStop(0.5, `rgba(255, 243, 198, ${0.04 + easedVisibility * 0.18})`);
  sweep.addColorStop(0.54, `rgba(199, 240, 255, ${0.015 + easedVisibility * 0.08})`);
  sweep.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sweep;
  ctx.fillRect(panelX - 20, panelY, panelW + 40, panelH);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(255, 244, 225, ${0.54 + easedVisibility * 0.42})`;
  ctx.font = "700 22px 'Zen Old Mincho', 'Hiragino Mincho ProN', serif";
  drawTrackedText(ctx, titleJa, canvas.width / 2, panelY + 40, 1.4);

  ctx.fillStyle = `rgba(156, 234, 255, ${0.56 + easedVisibility * 0.34})`;
  ctx.font = "700 11px 'Orbitron', 'Barlow Condensed', sans-serif";
  ctx.fillText(titleEn, canvas.width / 2, panelY + 60);

  ctx.fillStyle = `rgba(239, 246, 251, ${0.56 + easedVisibility * 0.26})`;
  ctx.font = "600 10px 'IBM Plex Sans', 'Trebuchet MS', sans-serif";
  const subtitleLines = wrapTextLines(ctx, subtitle, panelW - 82, 2);
  for (let i = 0; i < subtitleLines.length; i++) {
    ctx.fillText(subtitleLines[i], canvas.width / 2, panelY + 74 + i * 11);
  }

  ctx.fillStyle = `rgba(255, 220, 152, ${0.42 + easedVisibility * 0.4})`;
  ctx.font = "700 9px 'Orbitron', 'Barlow Condensed', sans-serif";
  ctx.fillText(footer, canvas.width / 2, panelY + 94);
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = state.stage >= 3 ? "#0b2437" : "#0d2f4d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw runtime background image behind the star/glow field.
  // Small parallax (5-10px) to keep it alive without re-designing the asset.
  if (runtimeBgDrawW > 0 && runtimeBgDrawH > 0) {
    const maxParallaxX = 7; // keep within 5-10px
    const maxParallaxY = 1.8;
    const xOff = Math.sin(state.elapsed * 0.34) * maxParallaxX;
    const yOff = Math.cos(state.elapsed * 0.22) * maxParallaxY;

    ctx.save();
    const centerX = canvas.width / 2 + xOff;
    const centerY = canvas.height / 2 + yOff;

    // Prefer the blurred offscreen cover; fallback to the raw image if needed.
    if (runtimeBgCoverReady && runtimeBgCoverCanvas) {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(runtimeBgCoverCanvas, centerX - runtimeBgDrawW / 2, centerY - runtimeBgDrawH / 2);
    } else if (runtimeBgImageReady) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(runtimeBgImage, centerX - runtimeBgDrawW / 2, centerY - runtimeBgDrawH / 2);
    }
    ctx.restore();
  }

  // Center ellipse mask disabled by request.

  // Extra faint darkening in the top-left to reduce land-block contrast.
  if (runtimeBgDrawW > 0 && runtimeBgDrawH > 0) {
    ctx.save();
    const tlx = canvas.width * 0.18;
    const tly = canvas.height * 0.14;
    const tr = Math.min(canvas.width, canvas.height) * 0.55;
    const tlGrad = ctx.createRadialGradient(tlx, tly, 0, tlx, tly, tr);
    tlGrad.addColorStop(0, "rgba(2, 10, 22, 0.22)");
    tlGrad.addColorStop(0.6, "rgba(2, 10, 22, 0.08)");
    tlGrad.addColorStop(1, "rgba(2, 10, 22, 0)");
    ctx.fillStyle = tlGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  if (!bgGlowCanvas) buildBgGlowCanvas();
  if (bgGlowCanvas) ctx.drawImage(bgGlowCanvas, 0, 0);

  drawStageAtmosphereOverlay();

  for (const star of STARS) {
    // Tone down "space stars" so they read more like sea noise / sonar speckle over tactical maps.
    const alpha = 0.09 + ((Math.sin(state.elapsed * 2 + star.x) + 1) * 0.06);
    ctx.globalAlpha = alpha;
    if (starDotCanvas) {
      const r = star.r || 1;
      // Draw the same dot sprite, scaled for small radius variation.
      const size = STARDOT_SIZE * (0.35 + r / 3);
      ctx.drawImage(starDotCanvas, star.x - size / 2, star.y - size / 2, size, size);
    } else {
      // Fallback.
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawCenterText(title, subtitle) {
  ctx.save();
  ctx.fillStyle = "rgba(4, 14, 24, 0.52)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cardW = 388;
  const cardH = 192;
  const cardX = canvas.width / 2 - cardW / 2;
  const cardY = canvas.height / 2 - cardH / 2 + 10;
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardGrad.addColorStop(0, "rgba(8, 28, 46, 0.97)");
  cardGrad.addColorStop(1, "rgba(7, 20, 34, 0.95)");
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  ctx.strokeStyle = "rgba(135, 215, 255, 0.32)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(cardX + 12, cardY + 12, cardW - 24, cardH - 24);

  ctx.fillStyle = "rgba(8, 22, 36, 0.92)";
  ctx.beginPath();
  ctx.roundRect(cardX + 18, cardY - 10, 142, 18, 999);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 217, 120, 0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#7fdcff";
  ctx.font = "700 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(state.mode === "won" ? "MISSION COMPLETE" : "SORTIE FAILED", cardX + 32, cardY + 3);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(cardX + 28, cardY + 44);
  ctx.lineTo(cardX + cardW - 28, cardY + 44);
  ctx.stroke();

  ctx.fillStyle = "#f2f8ff";
  ctx.font = "700 46px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, cardY + 90);
  ctx.font = "600 20px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#d9eaf8";
  ctx.fillText(subtitle, canvas.width / 2, cardY + 124);

  const scoreBoxW = 150;
  const scoreBoxH = 44;
  const scoreBoxY = cardY + 136;
  const scoreBoxX = canvas.width / 2 - scoreBoxW / 2;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 999);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 220, 142, 0.24)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#81ddff";
  ctx.font = "700 11px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("FINAL SCORE", canvas.width / 2, scoreBoxY + 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 18px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(`${state.score}/${state.targetScore}`, canvas.width / 2, scoreBoxY + 32);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(124, 180, 214, 0.8)";
  ctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("COVER SHEET // AX-17", cardX + 26, cardY + cardH - 18);
  ctx.textAlign = "left";
  ctx.restore();
}

function formatElapsedTime(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function getResultStageLabel() {
  if (state.mode === "won") return `All Stages (${STAGE_COUNT})`;
  if (state.bossDefeated && state.victoryDelay > 0 && state.stage < STAGE_COUNT) return "Stage Clear";
  if (state.activeBoss || state.bossSpawned)
    return state.stage >= STAGE_COUNT ? "Final Boss" : "Boss Wave";
  const stageProg = stageDifficultyScore();
  const bossBand = state.bossSpawnScoreDelta || state.bossSpawnScore;
  if (stageProg >= bossBand * 0.66) return state.stage >= 3 ? "Final Corridor" : state.stage >= 2 ? "Deep Sweep" : "Late Sweep";
  if (stageProg >= bossBand * 0.33) return state.stage >= 3 ? "Heavy Resistance" : state.stage >= 2 ? "Sustain Sweep" : "Mid Sweep";
  return state.stage >= 3 ? "Approach Vector" : state.stage >= 2 ? "Second Line" : "Intercept Run";
}

function fitText(textCtx, text, maxWidth) {
  let output = text;
  while (output.length > 0 && textCtx.measureText(output).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return output || text;
}

function buildResultOverlayCache(config) {
  resultButtonHitboxes.length = 0;
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const mctx = c.getContext("2d");
  if (!mctx) return null;

  const cardW = 408;
  const cardH = 364;
  const cardX = canvas.width / 2 - cardW / 2;
  const cardY = canvas.height / 2 - cardH / 2 + 6;
  const accent = config.accent;
  const accentSoft = config.accentSoft;
  const stats = [
    { label: "Score", value: `${state.score}/${state.targetScore}` },
    { label: "Kills", value: `${state.kills}` },
    { label: "Time", value: formatElapsedTime(state.elapsed) },
    { label: "Stage", value: getResultStageLabel() },
  ];

  mctx.save();
  mctx.fillStyle = "rgba(7, 16, 28, 0.38)";
  mctx.fillRect(0, 0, canvas.width, canvas.height);
  const haze = mctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 24, canvas.width / 2, canvas.height / 2, 320);
  haze.addColorStop(0, "rgba(173, 214, 245, 0.08)");
  haze.addColorStop(1, "rgba(7, 16, 28, 0)");
  mctx.fillStyle = haze;
  mctx.fillRect(0, 0, canvas.width, canvas.height);

  const cardGrad = mctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardGrad.addColorStop(0, "rgba(239, 247, 252, 0.92)");
  cardGrad.addColorStop(1, "rgba(229, 239, 247, 0.86)");
  mctx.fillStyle = cardGrad;
  mctx.beginPath();
  mctx.roundRect(cardX, cardY, cardW, cardH, 22);
  mctx.fill();

  mctx.strokeStyle = "rgba(71, 109, 136, 0.16)";
  mctx.lineWidth = 1;
  mctx.stroke();

  mctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  mctx.strokeRect(cardX + 12.5, cardY + 12.5, cardW - 25, cardH - 25);

  mctx.fillStyle = accentSoft;
  mctx.beginPath();
  mctx.roundRect(cardX + 26, cardY + 18, 132, 18, 999);
  mctx.fill();

  mctx.fillStyle = accent;
  mctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.textAlign = "center";
  mctx.fillText(config.kicker, cardX + 92, cardY + 30);

  mctx.fillStyle = "#193349";
  mctx.font = "800 34px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText(config.title, canvas.width / 2, cardY + 78);

  mctx.fillStyle = "rgba(25, 51, 73, 0.7)";
  mctx.font = "600 14px 'IBM Plex Sans', 'Segoe UI', sans-serif";
  mctx.fillText(config.subtitle, canvas.width / 2, cardY + 104);

  mctx.strokeStyle = "rgba(92, 135, 166, 0.18)";
  mctx.beginPath();
  mctx.moveTo(cardX + 28, cardY + 126);
  mctx.lineTo(cardX + cardW - 28, cardY + 126);
  mctx.stroke();

  const gridX = cardX + 28;
  const gridY = cardY + 142;
  const cellW = 165;
  const cellH = 50;
  const colGap = 22;
  const rowGap = 14;
  stats.forEach((stat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = gridX + col * (cellW + colGap);
    const y = gridY + row * (cellH + rowGap);

    mctx.fillStyle = "rgba(255, 255, 255, 0.26)";
    mctx.beginPath();
    mctx.roundRect(x, y, cellW, cellH, 12);
    mctx.fill();

    mctx.strokeStyle = "rgba(92, 135, 166, 0.1)";
    mctx.lineWidth = 1;
    mctx.stroke();

    mctx.textAlign = "left";
    mctx.fillStyle = accent;
    mctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
    mctx.fillText(stat.label.toUpperCase(), x + 14, y + 16);

    mctx.fillStyle = "#17314a";
    mctx.font = "800 17px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
    mctx.fillText(fitText(mctx, stat.value, cellW - 28), x + 14, y + 37);
  });

  const buttonDividerY = cardY + 286;
  mctx.strokeStyle = "rgba(92, 135, 166, 0.14)";
  mctx.beginPath();
  mctx.moveTo(cardX + 28, buttonDividerY);
  mctx.lineTo(cardX + cardW - 28, buttonDividerY);
  mctx.stroke();

  const buttonY = cardY + cardH - 52;
  const primaryButtonX = gridX;
  const secondaryButtonX = gridX + cellW + colGap;
  const buttonW = cellW;
  const buttonH = 46;
  const retryHovered = hoveredResultButton === "retry";
  const hangarHovered = hoveredResultButton === "hangar";
  mctx.textAlign = "center";
  const primaryGrad = mctx.createLinearGradient(primaryButtonX, buttonY - 22, primaryButtonX, buttonY - 22 + buttonH);
  primaryGrad.addColorStop(0, retryHovered ? "rgba(255, 245, 238, 1)" : "rgba(255, 236, 228, 0.96)");
  primaryGrad.addColorStop(0.52, retryHovered ? "rgba(244, 198, 178, 0.54)" : accentSoft);
  primaryGrad.addColorStop(1, retryHovered ? "rgba(227, 144, 111, 0.54)" : "rgba(222, 158, 136, 0.34)");
  mctx.fillStyle = primaryGrad;
  mctx.beginPath();
  mctx.roundRect(primaryButtonX, buttonY - 22, buttonW, buttonH, 16);
  mctx.fill();
  mctx.strokeStyle = retryHovered ? "rgba(212, 138, 100, 0.56)" : "rgba(212, 138, 100, 0.32)";
  mctx.lineWidth = retryHovered ? 1.5 : 1.15;
  mctx.stroke();
  if (retryHovered) {
    mctx.shadowColor = "rgba(229, 145, 101, 0.28)";
    mctx.shadowBlur = 16;
  }
  mctx.fillStyle = retryHovered ? "rgba(255, 255, 255, 0.52)" : "rgba(255, 255, 255, 0.38)";
  mctx.beginPath();
  mctx.roundRect(primaryButtonX + 10, buttonY - 15, buttonW - 20, 10, 999);
  mctx.fill();
  mctx.shadowColor = "transparent";
  mctx.shadowBlur = 0;
  mctx.fillStyle = accent;
  mctx.font = retryHovered ? "800 16px 'Barlow Condensed', 'Trebuchet MS', sans-serif" : "800 15px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText(config.primaryLabel || "RETRY SORTIE", primaryButtonX + buttonW / 2, buttonY - 2);
  mctx.fillStyle = retryHovered ? "rgba(120, 62, 41, 0.92)" : "rgba(132, 74, 54, 0.82)";
  mctx.font = retryHovered ? "700 10px 'IBM Plex Sans', 'Segoe UI', sans-serif" : "700 9px 'IBM Plex Sans', 'Segoe UI', sans-serif";
  mctx.fillText(config.primarySub || "Press Enter", primaryButtonX + buttonW / 2, buttonY + 13);

  const secondaryGrad = mctx.createLinearGradient(secondaryButtonX, buttonY - 22, secondaryButtonX, buttonY - 22 + buttonH);
  secondaryGrad.addColorStop(0, hangarHovered ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.38)");
  secondaryGrad.addColorStop(1, hangarHovered ? "rgba(195, 220, 236, 0.34)" : "rgba(222, 234, 242, 0.2)");
  mctx.fillStyle = secondaryGrad;
  mctx.beginPath();
  mctx.roundRect(secondaryButtonX, buttonY - 22, buttonW, buttonH, 16);
  mctx.fill();
  mctx.strokeStyle = hangarHovered ? "rgba(92, 135, 166, 0.46)" : "rgba(92, 135, 166, 0.26)";
  mctx.lineWidth = hangarHovered ? 1.4 : 1.1;
  mctx.stroke();
  if (hangarHovered) {
    mctx.shadowColor = "rgba(117, 165, 199, 0.18)";
    mctx.shadowBlur = 14;
  }
  mctx.fillStyle = hangarHovered ? "rgba(255, 255, 255, 0.34)" : "rgba(255, 255, 255, 0.24)";
  mctx.beginPath();
  mctx.roundRect(secondaryButtonX + 10, buttonY - 15, buttonW - 20, 9, 999);
  mctx.fill();
  mctx.shadowColor = "transparent";
  mctx.shadowBlur = 0;
  mctx.fillStyle = "#466781";
  mctx.font = hangarHovered ? "800 16px 'Barlow Condensed', 'Trebuchet MS', sans-serif" : "800 15px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText("RETURN TO MENU", secondaryButtonX + buttonW / 2, buttonY - 2);
  mctx.fillStyle = hangarHovered ? "rgba(57, 92, 121, 0.94)" : "rgba(70, 103, 129, 0.84)";
  mctx.font = hangarHovered ? "700 10px 'IBM Plex Sans', 'Segoe UI', sans-serif" : "700 9px 'IBM Plex Sans', 'Segoe UI', sans-serif";
  mctx.fillText("Press Esc", secondaryButtonX + buttonW / 2, buttonY + 13);

  resultButtonHitboxes.push(
    { id: "retry", x: primaryButtonX, y: buttonY - 22, w: buttonW, h: buttonH },
    { id: "hangar", x: secondaryButtonX, y: buttonY - 22, w: buttonW, h: buttonH }
  );

  if (config.footerHint) {
    mctx.textAlign = "center";
    mctx.fillStyle = "rgba(70, 103, 129, 0.84)";
    mctx.font = "700 10px 'IBM Plex Sans', 'Segoe UI', sans-serif";
    mctx.fillText(config.footerHint, canvas.width / 2, cardY + cardH - 14);
  }

  mctx.restore();
  return c;
}

function drawTrackedText(textCtx, text, x, y, tracking = 0) {
  if (!text || tracking === 0) {
    textCtx.fillText(text, x, y);
    return;
  }
  const chars = Array.from(text);
  let cursor = x;
  const align = textCtx.textAlign || "left";
  if (align === "center") {
    const width = chars.reduce((sum, ch, idx) => sum + textCtx.measureText(ch).width + (idx < chars.length - 1 ? tracking : 0), 0);
    cursor -= width / 2;
  } else if (align === "right" || align === "end") {
    const width = chars.reduce((sum, ch, idx) => sum + textCtx.measureText(ch).width + (idx < chars.length - 1 ? tracking : 0), 0);
    cursor -= width;
  }
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    textCtx.fillText(ch, cursor, y);
    cursor += textCtx.measureText(ch).width + tracking;
  }
}

function wrapTextLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  let truncated = false;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= maxLines) {
        truncated = true;
        break;
      }
    }
  }

  if (lines.length < maxLines && line) lines.push(line);

  // If we had to cut, add an ellipsis to the last line.
  if (truncated && lines.length === maxLines) {
    let s = lines[maxLines - 1] || "";
    while (s.length > 0 && ctx.measureText(`${s}...`).width > maxWidth) s = s.slice(0, -1);
    lines[maxLines - 1] = s ? `${s}...` : "...";
  }

  if (lines.length > maxLines) lines.length = maxLines;
  return lines;
}

function drawChip(ctx, x, y, w, h, chip) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "rgba(12, 31, 48, 0.78)");
  grad.addColorStop(1, "rgba(9, 22, 35, 0.72)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(135, 214, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(126, 220, 255, 0.64)";
  ctx.font = "700 9px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(chip.value.toUpperCase(), x + 12, y + 13);

  ctx.fillStyle = "rgba(238, 247, 255, 0.88)";
  ctx.font = "700 13px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(chip.label, x + 12, y + 27);
  ctx.restore();
}

function drawAirframeThumbnail(targetCtx, airframe, x, y, w, h) {
  targetCtx.save();
  if (airframe.previewReady && airframe.previewCanvas) {
    const aspect = airframe.previewCanvas.width / airframe.previewCanvas.height;
    const drawH = Math.min(h - 8, 56);
    const drawW = drawH * aspect;
    targetCtx.drawImage(airframe.previewCanvas, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
  } else {
    targetCtx.strokeStyle = "rgba(127, 220, 255, 0.24)";
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.roundRect(x + 8, y + 8, w - 16, h - 16, 10);
    targetCtx.stroke();
  }
  targetCtx.restore();
}

function getSelectedAirframe() {
  return AIRFRAMES[selectedAirframeId] || AIRFRAMES.p51d;
}

function drawMenuAirframeIndexCard(targetCtx, airframe, x, y, w, h, selected, hovered) {
  const border = hovered
    ? "rgba(132, 220, 255, 0.24)"
    : "rgba(132, 220, 255, 0.12)";
  const fillTop = selected ? "rgba(19, 58, 86, 0.98)" : "rgba(11, 33, 52, 0.94)";
  const fillBottom = selected ? "rgba(10, 28, 44, 0.98)" : "rgba(8, 23, 37, 0.94)";

  targetCtx.save();
  const grad = targetCtx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, fillTop);
  grad.addColorStop(1, fillBottom);
  targetCtx.fillStyle = grad;
  targetCtx.beginPath();
  targetCtx.roundRect(x, y, w, h, 18);
  targetCtx.fill();

  targetCtx.strokeStyle = border;
  targetCtx.lineWidth = 1;
  targetCtx.stroke();

  targetCtx.fillStyle = selected ? "rgba(129, 225, 255, 0.7)" : "rgba(129, 225, 255, 0.42)";
  targetCtx.fillRect(x + 14, y + 12, 60, 2);

  targetCtx.fillStyle = selected ? "#82ddff" : "rgba(130, 213, 255, 0.7)";
  targetCtx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  targetCtx.textAlign = "left";
  targetCtx.fillText(selected ? "CURRENT AIRFRAME" : "AIRFRAME INDEX", x + 14, y + 26);

  drawAirframeThumbnail(targetCtx, airframe, x + 14, y + 34, 92, 72);

  targetCtx.fillStyle = "#f2f8ff";
  targetCtx.font = "700 18px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  targetCtx.fillText(airframe.title, x + 118, y + 56);

  targetCtx.fillStyle = "rgba(214, 231, 244, 0.84)";
  targetCtx.font = "600 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  targetCtx.fillText(airframe.meta, x + 118, y + 75);

  targetCtx.fillStyle = selected ? "rgba(255, 223, 154, 0.96)" : "rgba(194, 224, 242, 0.78)";
  targetCtx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  targetCtx.fillText(fitText(targetCtx, airframe.statSummary, w - 134), x + 118, y + 93);

  targetCtx.textAlign = "right";
  targetCtx.fillStyle = selected ? "rgba(255, 216, 138, 0.84)" : "rgba(137, 204, 235, 0.42)";
  targetCtx.font = "700 18px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  targetCtx.fillText(airframe.shortCode, x + w - 14, y + 26);
  targetCtx.restore();
}

function buildMenuOverlayCache() {
  const panelW = 430;
  const panelH = 200;
  const panelX = canvas.width / 2 - panelW / 2;
  const panelY = canvas.height / 2 - panelH / 2 + 24;
  const subtitleText = "Check controls, confirm target count, then push straight into the intercept.";

  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const mctx = c.getContext("2d");
  if (!mctx) return;

  mctx.save();
  const panelGrad = mctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGrad.addColorStop(0, "rgba(10, 35, 56, 0.92)");
  panelGrad.addColorStop(1, "rgba(7, 23, 38, 0.94)");
  mctx.fillStyle = panelGrad;
  mctx.beginPath();
  mctx.roundRect(panelX, panelY, panelW, panelH, 28);
  mctx.fill();

  mctx.strokeStyle = "rgba(138, 219, 255, 0.34)";
  mctx.lineWidth = 1.5;
  mctx.stroke();

  mctx.textAlign = "left";
  mctx.fillStyle = "#7fdcff";
  mctx.font = "700 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText("SORTIE BRIEFING", panelX + 24, panelY + 28);
  mctx.fillStyle = "#f3f8ff";
  mctx.font = "700 32px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText("Ready for Launch", panelX + 24, panelY + 70);

  mctx.font = "600 14px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillStyle = "#d7e9f8";
  const maxWidth = panelW - 48;
  const subtitleY = panelY + 94;
  const lineHeight = 15;
  const maxLines = 2;
  const lines = wrapTextLines(mctx, subtitleText, maxWidth, maxLines);
  for (let i = 0; i < lines.length; i++) mctx.fillText(lines[i], panelX + 24, subtitleY + i * lineHeight);

  const chips = [
    { label: "WASD / Arrows", value: "Move" },
    { label: "Space", value: "Fire" },
    { label: "M", value: "Missile" },
    { label: "F", value: "Fullscreen" },
    { label: "Enter", value: "Skip / Confirm" },
  ];
  mctx.fillStyle = "rgba(6, 19, 31, 0.58)";
  mctx.beginPath();
  mctx.roundRect(panelX + 22, panelY + 266, panelW - 44, 46, 18);
  mctx.fill();
  mctx.strokeStyle = "rgba(126, 220, 255, 0.1)";
  mctx.lineWidth = 1;
  mctx.stroke();
  mctx.fillStyle = "rgba(126, 220, 255, 0.84)";
  mctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText("FLIGHT CONTROLS", panelX + 36, panelY + 262);
  chips.forEach((chip, idx) => {
    const x = panelX + 34 + idx * 146;
    const y = panelY + 270;
    drawChip(mctx, x, y, 138, 34, chip);
  });
  mctx.restore();

  menuOverlayCanvas = c;
}

function buildCenterOverlayCache(topLabel, title, subtitle) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const mctx = c.getContext("2d");
  if (!mctx) return null;

  mctx.save();
  mctx.fillStyle = "rgba(4, 14, 24, 0.52)";
  mctx.fillRect(0, 0, canvas.width, canvas.height);

  const cardW = 388;
  const cardH = 192;
  const cardX = canvas.width / 2 - cardW / 2;
  const cardY = canvas.height / 2 - cardH / 2 + 10;
  const cardGrad = mctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardGrad.addColorStop(0, "rgba(8, 28, 46, 0.97)");
  cardGrad.addColorStop(1, "rgba(7, 20, 34, 0.95)");
  mctx.fillStyle = cardGrad;
  mctx.beginPath();
  mctx.roundRect(cardX, cardY, cardW, cardH, 24);
  mctx.fill();

  mctx.strokeStyle = "rgba(135, 215, 255, 0.32)";
  mctx.lineWidth = 1.2;
  mctx.stroke();

  mctx.strokeStyle = "rgba(255,255,255,0.08)";
  mctx.strokeRect(cardX + 12, cardY + 12, cardW - 24, cardH - 24);

  mctx.strokeStyle = "rgba(120, 177, 214, 0.14)";
  mctx.beginPath();
  mctx.moveTo(cardX + 24, cardY + 28);
  mctx.lineTo(cardX + cardW - 24, cardY + 28);
  mctx.moveTo(cardX + 24, cardY + cardH - 28);
  mctx.lineTo(cardX + cardW - 24, cardY + cardH - 28);
  mctx.stroke();

  mctx.fillStyle = "rgba(126, 220, 255, 0.9)";
  mctx.fillRect(cardX + 22, cardY + 22, 10, 2);
  mctx.fillRect(cardX + cardW - 32, cardY + 22, 10, 2);
  mctx.fillRect(cardX + 22, cardY + cardH - 24, 10, 2);
  mctx.fillRect(cardX + cardW - 32, cardY + cardH - 24, 10, 2);

  mctx.fillStyle = "rgba(8, 22, 36, 0.92)";
  mctx.beginPath();
  mctx.roundRect(cardX + 18, cardY - 10, 142, 18, 999);
  mctx.fill();
  mctx.strokeStyle = "rgba(255, 217, 120, 0.28)";
  mctx.lineWidth = 1;
  mctx.stroke();

  mctx.fillStyle = "#7fdcff";
  mctx.font = "700 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.textAlign = "left";
  mctx.fillText(topLabel, cardX + 32, cardY + 3);
  mctx.fillStyle = "rgba(255, 219, 138, 0.82)";
  mctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.textAlign = "right";
  mctx.fillText("DEBRIEF // CLEARANCE", cardX + cardW - 28, cardY + 3);

  mctx.strokeStyle = "rgba(255,255,255,0.12)";
  mctx.beginPath();
  mctx.moveTo(cardX + 28, cardY + 44);
  mctx.lineTo(cardX + cardW - 28, cardY + 44);
  mctx.stroke();

  mctx.fillStyle = "#f2f8ff";
  mctx.font = "700 46px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.textAlign = "center";
  mctx.fillText(title, canvas.width / 2, cardY + 90);
  mctx.font = "600 20px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillStyle = "#d9eaf8";
  mctx.fillText(subtitle, canvas.width / 2, cardY + 124);

  const scoreBoxW = 150;
  const scoreBoxH = 44;
  const scoreBoxY = cardY + 136;
  const scoreBoxX = canvas.width / 2 - scoreBoxW / 2;
  mctx.fillStyle = "rgba(255,255,255,0.08)";
  mctx.beginPath();
  mctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 999);
  mctx.fill();
  mctx.strokeStyle = "rgba(255, 220, 142, 0.24)";
  mctx.lineWidth = 1;
  mctx.stroke();
  mctx.fillStyle = "#81ddff";
  mctx.font = "700 11px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText("FINAL SCORE", canvas.width / 2, scoreBoxY + 14);
  mctx.fillStyle = "#ffffff";
  mctx.font = "700 18px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText(`${state.score}/${state.targetScore}`, canvas.width / 2, scoreBoxY + 32);
  mctx.textAlign = "left";
  mctx.fillStyle = "rgba(124, 180, 214, 0.8)";
  mctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  mctx.fillText("COVER SHEET // AX-17", cardX + 26, cardY + cardH - 18);
  mctx.textAlign = "left";

  mctx.restore();
  return c;
}

function drawPauseOverlay() {
  if (state.mode !== "playing" || !state.paused) return;
  ctx.save();
  ctx.fillStyle = "rgba(4, 14, 24, 0.38)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(243, 248, 255, 0.96)";
  ctx.textAlign = "center";
  ctx.font = "700 26px 'Orbitron', 'Barlow Condensed', sans-serif";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 6);
  ctx.fillStyle = "rgba(126, 220, 255, 0.88)";
  ctx.font = "600 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("Press P or Esc to resume", canvas.width / 2, canvas.height / 2 + 20);
  ctx.restore();
}

function drawUpgradeOverlay() {
  if (state.mode !== "upgrade") return;

  upgradeCardHitboxes.length = 0;
  ctx.save();
  ctx.fillStyle = "rgba(4, 14, 24, 0.54)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = 664;
  const panelH = 272;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = 118;
  ctx.fillStyle = "rgba(8, 28, 46, 0.96)";
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(135, 215, 255, 0.32)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#7fdcff";
  ctx.font = "700 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(`STAGE ${state.stage} CLEAR // SELECT REFIT`, panelX + 24, panelY + 28);
  ctx.fillStyle = "#f3f8ff";
  ctx.font = "700 30px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText(`Choose the next sortie edge for Stage ${Math.min(STAGE_COUNT, state.stage + 1)}`, panelX + 24, panelY + 66);
  ctx.fillStyle = "#d9eaf8";
  ctx.font = "600 13px 'IBM Plex Sans', 'Segoe UI', sans-serif";
  ctx.fillText("Left / right to cycle. Enter or click to lock one refit before re-engaging.", panelX + 24, panelY + 90);

  const cardY = panelY + 114;
  const cardW = 196;
  const cardH = 118;
  const gap = 14;
  state.upgradeChoices.forEach((choice, index) => {
    const x = panelX + 24 + index * (cardW + gap);
    const selected = index === state.upgradeSelection;
    const hovered = index === hoveredUpgradeIndex;
    const glow = selected ? "rgba(255, 214, 132, 0.24)" : hovered ? "rgba(126, 220, 255, 0.14)" : "rgba(255,255,255,0.06)";
    const border = selected ? "rgba(255, 208, 122, 0.62)" : hovered ? "rgba(126, 220, 255, 0.34)" : "rgba(126, 220, 255, 0.14)";
    const titleColor = selected ? "#fff3d9" : "#f2f8ff";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.roundRect(x, cardY, cardW, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = selected ? 1.5 : 1.1;
    ctx.stroke();

    ctx.fillStyle = selected ? "rgba(255, 216, 138, 0.92)" : "rgba(126, 220, 255, 0.88)";
    ctx.font = "700 10px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
    ctx.fillText(`REFIT ${index + 1}`, x + 16, cardY + 18);
    ctx.fillStyle = titleColor;
    ctx.font = "800 18px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
    ctx.fillText(choice.label, x + 16, cardY + 44);
    ctx.fillStyle = selected ? "rgba(255, 224, 168, 0.92)" : "rgba(255, 211, 106, 0.84)";
    ctx.font = "700 11px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
    ctx.fillText(choice.statLine, x + 16, cardY + 62);
    ctx.fillStyle = "rgba(214, 231, 244, 0.88)";
    ctx.font = "600 11px 'IBM Plex Sans', 'Segoe UI', sans-serif";
    const lines = wrapTextLines(ctx, choice.description, cardW - 32, 3);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + 16, cardY + 82 + i * 13);
    }
    upgradeCardHitboxes.push({ id: String(index), index, x, y: cardY, w: cardW, h: cardH });
  });
  ctx.restore();
}

function drawModeOverlay() {
  if (state.mode === "menu") {
    drawMenuOverlay();
    return;
  }
  if (state.mode === "upgrade") {
    drawUpgradeOverlay();
    return;
  }
  if (state.mode === "won") {
    if (!wonOverlayCanvas) {
      wonOverlayCanvas = buildResultOverlayCache({
        kicker: "MISSION COMPLETE",
        title: "Sector Secured",
        subtitle: "Hostile formation neutralized. Debrief ready.",
        accent: "#b97e3f",
        accentSoft: "rgba(233, 200, 145, 0.3)",
        primaryLabel: "NEW SORTIE",
        primarySub: "Press Enter",
        footerHint: "Esc returns to the hangar",
      });
    }
    if (wonOverlayCanvas) ctx.drawImage(wonOverlayCanvas, 0, 0);
    return;
  }
  if (state.mode === "lost") {
    if (!lostOverlayCanvas) {
      lostOverlayCanvas = buildResultOverlayCache({
        kicker: "MISSION FAILED",
        title: "Sortie Lost",
        subtitle: `Stage ${state.stage} checkpoint is ready for an immediate relaunch.`,
        accent: "#b86d57",
        accentSoft: "rgba(222, 163, 145, 0.28)",
        primaryLabel: "RETRY STAGE",
        primarySub: "Press Enter",
        footerHint: "Press R for a full campaign restart, or Esc for the hangar",
      });
    }
    if (lostOverlayCanvas) ctx.drawImage(lostOverlayCanvas, 0, 0);
  }
}

function drawMenuOverlay() {
  ctx.save();
  const panelW = 652;
  const panelH = 322;
  const panelX = canvas.width / 2 - panelW / 2;
  const panelY = canvas.height / 2 - panelH / 2 + 26;
  const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGrad.addColorStop(0, "rgba(10, 35, 56, 0.92)");
  panelGrad.addColorStop(1, "rgba(7, 23, 38, 0.94)");
  ctx.fillStyle = panelGrad;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 28);
  ctx.fill();

  ctx.strokeStyle = "rgba(138, 219, 255, 0.34)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#7fdcff";
  ctx.font = "700 12px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("SORTIE BRIEFING", panelX + 24, panelY + 28);
  ctx.fillStyle = "#f3f8ff";
  ctx.font = "700 32px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("Ready for Launch", panelX + 24, panelY + 70);
  ctx.font = "600 14px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#d7e9f8";
  const subtitleText = "Choose your airframe on the main tactical screen, then launch the intercept package.";
  const maxWidth = panelW - 48;
  const subtitleY = panelY + 94;
  const lineHeight = 15;
  const maxLines = 2;
  const lines = wrapTextLines(ctx, subtitleText, maxWidth, maxLines);
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], panelX + 24, subtitleY + i * lineHeight);

  ctx.fillStyle = "rgba(126, 220, 255, 0.88)";
  ctx.font = "700 11px 'Barlow Condensed', 'Trebuchet MS', sans-serif";
  ctx.fillText("AIRFRAME SELECTION", panelX + 24, panelY + 132);

  menuAirframeHitboxes.length = 0;
  const cardY = panelY + 144;
  const cardW = 292;
  const cardH = 116;
  const gap = 20;
  const ids = ["p51d", "spitfire"];
  ids.forEach((id, idx) => {
    const airframe = AIRFRAMES[id];
    const x = panelX + 24 + idx * (cardW + gap);
    const y = cardY;
    drawMenuAirframeIndexCard(
      ctx,
      airframe,
      x,
      y,
      cardW,
      cardH,
      selectedAirframeId === id,
      menuHoveredAirframeId === id
    );
    menuAirframeHitboxes.push({ id, x, y, w: cardW, h: cardH });
  });

  const controlsY = panelY + 268;
  const controlsH = 32;
  ctx.fillStyle = "rgba(6, 19, 31, 0.34)";
  ctx.beginPath();
  ctx.roundRect(panelX + 22, controlsY - 2, panelW - 44, controlsH + 4, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(126, 220, 255, 0.07)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const chips = [
    { label: "WASD / Arrows", value: "Move" },
    { label: "Space", value: "Fire" },
    { label: "M", value: "Missile" },
    { label: "F", value: "Fullscreen" },
    { label: "Enter", value: "Skip / Confirm" },
  ];
  const chipY = controlsY + 1;
  const chipW = 112;
  const chipH = 28;
  const chipGap = 6;
  chips.forEach((chip, idx) => {
    const x = panelX + 34 + idx * (chipW + chipGap);
    drawChip(ctx, x, chipY, chipW, chipH, chip);
  });
  ctx.restore();
}

function render() {
  drawBackground();

  if (bulletSpriteReady && bulletSpriteCanvas) {
    const variant = bulletSpriteVariant || getScaledSpriteVariant(bulletSpriteCanvas, 22, 1);
    const drawCanvas = variant?.canvas || bulletSpriteCanvas;
    const bDrawH = variant?.height || 22;
    const bDrawW = variant?.width || Math.round((bulletSpriteCanvas.width / bulletSpriteCanvas.height) * bDrawH);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#ffe08e";
    for (const b of state.bullets) {
      ctx.fillRect(b.x, b.y + 10, b.w, 14);
    }
    ctx.globalAlpha = 1;
    for (const b of state.bullets) {
      ctx.drawImage(drawCanvas, b.x - (bDrawW - b.w) / 2, b.y - 2, bDrawW, bDrawH);
    }
  } else {
    ctx.fillStyle = "#ffeeb1";
    ctx.globalAlpha = 0.34;
    for (const b of state.bullets) {
      ctx.fillRect(b.x + 1, b.y + 10, Math.max(1, b.w - 2), 18);
    }
    ctx.fillStyle = "#ffe08e";
    ctx.globalAlpha = 1;
    for (const b of state.bullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }
  if (enemyBulletSpriteReady.normal) {
    for (const b of state.enemyBullets) {
      const palette = getEnemyBulletPalette(b.kind);
      const sprite = getEnemyBulletSprite(b.kind);
      if (!sprite) continue;
      const drawH = sprite.height;
      const drawW = sprite.width;
      const drawX = b.x - (drawW - b.w) / 2;
      ctx.globalAlpha = palette.glowAlpha;
      ctx.drawImage(sprite.canvas, drawX, b.y - 1, drawW, drawH);
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite.canvas, drawX, b.y - 4, drawW, drawH);
    }
  } else {
    for (const b of state.enemyBullets) {
      const palette = getEnemyBulletPalette(b.kind);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = palette.trail;
      ctx.fillRect(b.x + 1, b.y - 12, Math.max(1, b.w - 2), 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette.core;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  for (const m of state.missiles) {
    const cx = m.x + m.w / 2;
    const cy = m.y + m.h / 2;

    // Trail (center points).
    // Throttle trail drawing a bit to reduce pure draw overhead.
    if (m.trailCount > 1 && (state.frame % 2 === 0)) {
      const segmentCount = Math.min(m.trailCount - 1, MISSILE_TRAIL_SEGMENTS);
      const start = (m.trailHead - segmentCount - 1 + MISSILE_TRAIL_POINTS) % MISSILE_TRAIL_POINTS;
      ctx.globalAlpha = 1;
      for (let i = 0; i < segmentCount; i++) {
        const idx1 = (start + i) % MISSILE_TRAIL_POINTS;
        const idx2 = (idx1 + 1) % MISSILE_TRAIL_POINTS;
        const a = (i + 1) / segmentCount;
        ctx.globalAlpha = 0.08 + a * 0.13;
        ctx.strokeStyle = "rgba(136, 236, 255, 1)";
        ctx.lineWidth = 1.5 + a * 0.8;
        ctx.beginPath();
        ctx.moveTo(m.trailX[idx1], m.trailY[idx1]);
        ctx.lineTo(m.trailX[idx2], m.trailY[idx2]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (missileSpriteReady && missileSpriteCanvas) {
      const drawHeight = m.h * 1.1;
      const drawWidth = (missileSpriteCanvas.width / missileSpriteCanvas.height) * drawHeight;
      const angle = Math.atan2(m.dirY, m.dirX) + Math.PI / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(missileSpriteCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#88ecff";
      ctx.fillRect(m.x, m.y, m.w, m.h);
      ctx.globalAlpha = 1;
    }
  }

  for (const p of state.powerups) {
    ctx.globalAlpha = Math.min(1, Math.max(0.45, p.life / 2));
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.fillStyle = p.type === "shield" ? "#5dd9ff" : "#ffc94d";
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff7d6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (p.type === "shield") {
      ctx.arc(cx, cy, 6, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.lineTo(cx + 4, cy + 6);
      ctx.lineTo(cx - 4, cy + 6);
      ctx.closePath();
    } else {
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx - 5, cy + 5);
      ctx.lineTo(cx, cy + 2);
      ctx.lineTo(cx + 5, cy + 5);
      ctx.closePath();
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const m of state.muzzleFlashes) {
    const t = Math.max(0, m.life / m.maxLife);
    ctx.globalAlpha = t;
    if (muzzleFlashSpriteCanvas && muzzleFlashSpriteSize > 0) {
      ctx.drawImage(muzzleFlashSpriteCanvas, m.x - muzzleFlashSpriteSize / 2, m.y - muzzleFlashSpriteSize / 2);
    } else {
      // Fallback: keep old behavior if sprite failed to build.
      const grad = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, 12);
      grad.addColorStop(0, "rgba(255,250,219,0.95)");
      grad.addColorStop(0.35, "rgba(255,193,92,0.85)");
      grad.addColorStop(1, "rgba(255,193,92,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y - 7);
      ctx.lineTo(m.x - 5.5, m.y + 4.5);
      ctx.lineTo(m.x + 5.5, m.y + 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const w of state.shockwaves) {
    const t = Math.max(0, w.life / w.maxLife);
    ctx.globalAlpha = t * 0.85;
    ctx.strokeStyle = w.color;
    ctx.lineWidth = 2 + (1 - t) * 3;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of state.explosions) {
    const t = Math.max(0, p.life / p.maxLife);
    if (t <= 0) continue;
    if (p.kind === "spark") {
      const len = p.size * (1.3 + (p.stretch || 1));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      ctx.globalAlpha = t * 0.95;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size * 0.18);
      ctx.beginPath();
      ctx.moveTo(-len * 0.65, 0);
      ctx.lineTo(len * 0.35, 0);
      ctx.stroke();
      ctx.globalAlpha = t * 0.55;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.4, p.size * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    if (p.kind === "armor-shard") {
      const shardW = p.size * (0.8 + (p.stretch || 1) * 0.4);
      const shardH = p.size * 0.58;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      ctx.globalAlpha = t * 0.9;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "rgba(245, 249, 252, 0.72)";
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(-shardW * 0.55, -shardH * 0.35);
      ctx.lineTo(shardW * 0.15, -shardH * 0.55);
      ctx.lineTo(shardW * 0.55, shardH * 0.05);
      ctx.lineTo(-shardW * 0.2, shardH * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }
    const r = p.size * (0.7 + (1 - t) * 0.6);
    const sprite = getExplosionDot(p.color);
    ctx.globalAlpha = t;
    if (sprite) {
      const d = r * 2;
      ctx.drawImage(sprite, p.x - r, p.y - r, d, d);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  drawYamatoPresenceOverlay();

  let normalEnemyCount = 0;
  for (const e of state.enemies) {
    if (!e.ship && !e.boss && !e.elite && !e.dying) normalEnemyCount++;
  }
  const enemyFxTier = normalEnemyCount > 20 ? 2 : normalEnemyCount > 12 ? 1 : 0;

  for (const e of state.enemies) {
    let dx = 0;
    let dy = 0;
    let scale = 1;
    const ex = e.x;
    const ey = e.y;
    const flashT = Math.min(1, (e.hitFlash || 0) / 0.2);
    if (e.dying) {
      const t = Math.max(0, e.deathTimer / e.deathDuration);
      const amp = 8 * t;
      dx = Math.sin((e.id + state.elapsed) * 90) * amp;
      dy = Math.cos((e.id + state.elapsed * 1.4) * 95) * amp * 0.45;
      scale = 0.9 + t * 0.1;
      ctx.globalAlpha = 0.3 + t * 0.7;
    } else if (e.entering && !e.ship) {
      ctx.globalAlpha = 0.45 + Math.sin(state.elapsed * 6) * 0.15;
    }
    const rw = e.w * scale;
    const rh = e.h * scale;
    const rx = ex + dx + (e.w - rw) / 2;
    const ry = ey + dy + (e.h - rh) / 2;
    if (e.ship) {
      ctx.save();
      const shipSpriteCanvas =
        e.variant === "yamato" && yamatoSpriteReady && yamatoSpriteCanvas
          ? yamatoSpriteCanvas
          : e.variant === "nagato" && nagatoSpriteReady && nagatoSpriteCanvas
            ? nagatoSpriteCanvas
            : kongoSpriteReady && kongoSpriteCanvas
              ? kongoSpriteCanvas
              : null;

      let shipDrawCanvas = null;
      let shipDrawW = rw;
      let shipDrawH = rh;
      let shipDrawX = rx;
      let shipDrawY = ry;
      if (shipSpriteCanvas) {
        const shipVariant = getScaledSpriteVariant(shipSpriteCanvas, rh * SPRITE_SCALE.shipBossVisual, 8);
        shipDrawCanvas = shipVariant?.canvas || shipSpriteCanvas;
        shipDrawW = shipVariant?.width || rw;
        shipDrawH = shipVariant?.height || rh;
        shipDrawX = snapRenderCoord(rx + (rw - shipDrawW) / 2);
        shipDrawY = snapRenderCoord(ry + rh - shipDrawH);
      }

      const seaLineY = snapRenderCoord(shipDrawCanvas ? shipDrawY + shipDrawH * 0.875 : ry + rh * 0.82);
      const foamH = 20;
      const seaGrad = ctx.createLinearGradient(rx, seaLineY, rx, seaLineY + foamH);
      seaGrad.addColorStop(0, "rgba(204, 229, 242, 0.26)");
      seaGrad.addColorStop(0.35, "rgba(150, 198, 225, 0.14)");
      seaGrad.addColorStop(1, "rgba(150, 198, 225, 0)");
      ctx.fillStyle = seaGrad;
      const foamX0Raw = shipDrawCanvas ? shipDrawX - rw * 0.02 : rx - rw * 0.04;
      const foamWRaw = shipDrawCanvas ? shipDrawW + rw * 0.04 : rw * 1.08;
      const foamX0 = snapRenderCoord(foamX0Raw);
      const foamX1 = snapRenderCoord(foamX0Raw + foamWRaw);
      const foamW = Math.max(1, foamX1 - foamX0);
      ctx.fillRect(foamX0, seaLineY, foamW, foamH);

      ctx.strokeStyle = "rgba(214, 235, 247, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(foamX0, seaLineY + 1);
      ctx.lineTo(foamX0 + foamW, seaLineY + 1);
      ctx.stroke();

      const leftMist = ctx.createRadialGradient(foamX0, seaLineY + 3, 1, foamX0, seaLineY + 3, 26);
      leftMist.addColorStop(0, "rgba(210, 232, 245, 0.18)");
      leftMist.addColorStop(1, "rgba(210, 232, 245, 0)");
      ctx.fillStyle = leftMist;
      ctx.beginPath();
      ctx.ellipse(foamX0, seaLineY + 3, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      const rightMist = ctx.createRadialGradient(foamX0 + foamW, seaLineY + 3, 1, foamX0 + foamW, seaLineY + 3, 26);
      rightMist.addColorStop(0, "rgba(210, 232, 245, 0.18)");
      rightMist.addColorStop(1, "rgba(210, 232, 245, 0)");
      ctx.fillStyle = rightMist;
      ctx.beginPath();
      ctx.ellipse(foamX0 + foamW, seaLineY + 3, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      if (shipSpriteCanvas && shipDrawCanvas) {
        ctx.drawImage(shipDrawCanvas, shipDrawX, shipDrawY, shipDrawW, shipDrawH);
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.09;
        ctx.drawImage(shipDrawCanvas, shipDrawX, shipDrawY, shipDrawW, shipDrawH);

        const bridgeGlow = ctx.createRadialGradient(
          rx + rw * 0.56,
          ry + rh * 0.38,
          2,
          rx + rw * 0.56,
          ry + rh * 0.38,
          rw * 0.18
        );
        bridgeGlow.addColorStop(0, "rgba(255, 248, 226, 0.16)");
        bridgeGlow.addColorStop(0.5, "rgba(255, 241, 208, 0.08)");
        bridgeGlow.addColorStop(1, "rgba(255, 241, 208, 0)");
        ctx.fillStyle = bridgeGlow;
        ctx.beginPath();
        ctx.ellipse(rx + rw * 0.56, ry + rh * 0.38, rw * 0.18, rh * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;

        if (e.entering) {
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = 0.08 + Math.sin(state.elapsed * 6) * 0.03;
          ctx.drawImage(shipDrawCanvas, shipDrawX, shipDrawY, shipDrawW, shipDrawH);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }
        if (flashT > 0 || e.dying) {
          if (e.dying) {
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = 0.22 + Math.sin(state.elapsed * 24 + e.id) * 0.08;
            ctx.drawImage(shipDrawCanvas, shipDrawX, shipDrawY, shipDrawW, shipDrawH);
          } else {
            const pulse = 0.18 + flashT * 0.18;
            ctx.globalCompositeOperation = "screen";
            ctx.fillStyle = `rgba(255, 229, 170, ${pulse})`;
            const hitPoints = [
              { x: rx + rw * 0.24, y: ry + rh * 0.56, r: 9 },
              { x: rx + rw * 0.5, y: ry + rh * 0.46, r: 11 },
              { x: rx + rw * 0.76, y: ry + rh * 0.56, r: 9 },
            ];
            for (const p of hitPoints) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        if ((e.hitShieldTimer || 0) > 0 && !e.dying) {
          const shieldPulse = Math.max(0, Math.min(1, e.hitShieldTimer / (e.hitShieldWindow || 0.26)));
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = 0.1 + shieldPulse * 0.18;
          ctx.drawImage(shipDrawCanvas, shipDrawX, shipDrawY, shipDrawW, shipDrawH);
          const shieldGlow = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
          shieldGlow.addColorStop(0, "rgba(116, 215, 255, 0)");
          shieldGlow.addColorStop(0.25, "rgba(116, 215, 255, 0.12)");
          shieldGlow.addColorStop(0.5, "rgba(214, 244, 255, 0.24)");
          shieldGlow.addColorStop(0.75, "rgba(116, 215, 255, 0.12)");
          shieldGlow.addColorStop(1, "rgba(116, 215, 255, 0)");
          ctx.fillStyle = shieldGlow;
          ctx.beginPath();
          ctx.roundRect(rx + 2, ry + rh * 0.12, rw - 4, rh * 0.56, 10);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }

        const tRipple = state.elapsed;
        const rBase = snapRenderCoord(seaLineY + 1);
        ctx.globalCompositeOperation = "screen";
        ctx.lineWidth = 1.15;
        ctx.strokeStyle = `rgba(214, 240, 252, ${0.14 + Math.sin(tRipple * 5.2) * 0.05})`;
        ctx.beginPath();
        const ripSegs = 10;
        for (let i = 0; i <= ripSegs; i++) {
          const t = i / ripSegs;
          const x = foamX0 + t * foamW;
          const wob = Math.sin(tRipple * 6.5 + t * 9) * 2 + Math.sin(tRipple * 3.1 + t * 16) * 0.9;
          if (i === 0) ctx.moveTo(x, rBase + wob);
          else ctx.lineTo(x, rBase + wob);
        }
        ctx.stroke();
        ctx.strokeStyle = `rgba(188, 228, 246, ${0.09 + Math.sin(tRipple * 3.8) * 0.035})`;
        ctx.beginPath();
        const rBase2 = snapRenderCoord(seaLineY + 4);
        for (let i = 0; i <= ripSegs; i++) {
          const t = i / ripSegs;
          const x = foamX0 + t * foamW;
          const wob = Math.sin(tRipple * 5 + t * 12 + 0.9) * 1.5;
          if (i === 0) ctx.moveTo(x, rBase2 + wob);
          else ctx.lineTo(x, rBase2 + wob);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.fillStyle = "rgba(115, 123, 132, 0.92)";
        ctx.fillRect(rx, ry + rh * 0.3, rw, rh * 0.42);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      continue;
    }
    const normalEnemySpriteCanvas =
      e.aircraftModel === "claude"
        ? enemyClaudeSpriteReady && enemyClaudeSpriteCanvas
          ? enemyClaudeSpriteCanvas
          : enemyZeroSpriteReady && enemyZeroSpriteCanvas
            ? enemyZeroSpriteCanvas
            : null
        : e.aircraftModel === "a6m5"
          ? enemyA6M5SpriteReady && enemyA6M5SpriteCanvas
            ? enemyA6M5SpriteCanvas
            : enemyZeroSpriteReady && enemyZeroSpriteCanvas
              ? enemyZeroSpriteCanvas
              : null
          : e.aircraftModel === "reppu"
            ? enemyA7M2SpriteReady && enemyA7M2SpriteCanvas
              ? enemyA7M2SpriteCanvas
              : enemyA6M5SpriteReady && enemyA6M5SpriteCanvas
                ? enemyA6M5SpriteCanvas
                : enemyZeroSpriteReady && enemyZeroSpriteCanvas
                  ? enemyZeroSpriteCanvas
                  : null
            : enemyZeroSpriteReady && enemyZeroSpriteCanvas
              ? enemyZeroSpriteCanvas
              : enemyClaudeSpriteReady && enemyClaudeSpriteCanvas
                ? enemyClaudeSpriteCanvas
                : null;
    const eliteEnemySpriteCanvas =
      e.aircraftModel === "raiden" && enemyJ2MSpriteReady && enemyJ2MSpriteCanvas
        ? enemyJ2MSpriteCanvas
        : e.aircraftModel === "n1k2" && enemyN1K2SpriteReady && enemyN1K2SpriteCanvas
          ? enemyN1K2SpriteCanvas
          : state.stage >= 2 && enemyN1K2SpriteReady && enemyN1K2SpriteCanvas
            ? enemyN1K2SpriteCanvas
            : eliteSpriteReady && eliteSpriteCanvas
              ? eliteSpriteCanvas
              : null;
    const spriteCanvas = e.boss
      ? bossSpriteReady && bossSpriteCanvas
        ? bossSpriteCanvas
        : normalEnemySpriteCanvas
          ? normalEnemySpriteCanvas
          : null
      : e.elite
        ? eliteEnemySpriteCanvas || normalEnemySpriteCanvas
        : normalEnemySpriteCanvas
          ? normalEnemySpriteCanvas
          : null;
    if (spriteCanvas) {
      const drawHeightRaw = e.boss
        ? rh * SPRITE_SCALE.enemyBoss
        : e.elite
          ? rh * SPRITE_SCALE.enemyElite
          : rh * SPRITE_SCALE.enemyNormal;
      const spriteVariant = getScaledSpriteVariant(spriteCanvas, drawHeightRaw, 4);
      const drawWidth = spriteVariant?.width || Math.round((spriteCanvas.width / spriteCanvas.height) * drawHeightRaw);
      const drawHeight = spriteVariant?.height || drawHeightRaw;
      const drawCanvas = spriteVariant?.canvas || spriteCanvas;
      const centerX = rx + rw / 2;
      const centerY = ry + rh / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.drawImage(drawCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      if (e.elite && !e.boss) {
        // Use small ace-flight markings instead of a full-frame tint/glow.
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255, 214, 132, 0.82)";
        ctx.beginPath();
        ctx.arc(-drawWidth * 0.26, -drawHeight * 0.1, drawWidth * 0.024, 0, Math.PI * 2);
        ctx.arc(drawWidth * 0.26, -drawHeight * 0.1, drawWidth * 0.024, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 184, 120, 0.72)";
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-drawWidth * 0.07, drawHeight * 0.08);
        ctx.lineTo(drawWidth * 0.07, drawHeight * 0.08);
        ctx.stroke();

        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = "rgba(255, 226, 168, 0.9)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-drawWidth * 0.32, -drawHeight * 0.02);
        ctx.lineTo(-drawWidth * 0.18, -drawHeight * 0.11);
        ctx.moveTo(drawWidth * 0.32, -drawHeight * 0.02);
        ctx.lineTo(drawWidth * 0.18, -drawHeight * 0.11);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      if (flashT > 0 || e.dying) {
        const isNormalFighter = !e.ship && !e.boss && !e.elite;
        if (e.dying) {
          if (!(isNormalFighter && enemyFxTier >= 1)) {
            const pulse = 0.45 + Math.sin(state.elapsed * 50 + e.id) * 0.2;
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = Math.max(0.18, pulse * 0.5);
            ctx.drawImage(drawCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          }
        } else {
          if (e.elite) {
            ctx.strokeStyle = "rgba(255, 235, 181, 0.54)";
            ctx.lineWidth = 1.8;
            const markerX = drawWidth * 0.34;
            const markerY = drawHeight * 0.28;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(markerX, markerY), Math.PI * 0.84, Math.PI * 1.16);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-markerX, -markerY * 0.2);
            ctx.lineTo(-markerX + 10, -markerY * 0.2);
            ctx.moveTo(markerX, -markerY * 0.2);
            ctx.lineTo(markerX - 10, -markerY * 0.2);
            ctx.stroke();
          } else if (!(isNormalFighter && enemyFxTier >= 2)) {
            ctx.strokeStyle = e.boss ? "rgba(255, 223, 162, 0.45)" : "rgba(255, 224, 142, 0.34)";
            ctx.lineWidth = 1.6;
            ctx.strokeRect(-drawWidth / 2 + 2, -drawHeight / 2 + 2, drawWidth - 4, drawHeight - 4);
          }
        }
      }
      ctx.restore();
    } else {
      drawEnemyFallback(e, rx, ry, rw, rh, flashT);
    }
    ctx.globalAlpha = 1;
  }
  drawPlayer();
  drawBossApproachBar();
  drawBossPhaseBanner();
  drawBossWarningOverlay();
  drawStageClearNoticeOverlay();
  drawPauseOverlay();
  drawModeOverlay();
}

let rafId = 0;
let last = performance.now();

function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (state.mode === "playing" && !state.paused) updatePlaying(dt);
  syncChrome();
  render();

  state.frame++;

  rafId = requestAnimationFrame(tick);
}

function buttonToKey(key, down) {
  if (key === "ArrowLeft" || key === "a" || key === "A") state.keys.left = down;
  if (key === "ArrowRight" || key === "d" || key === "D") state.keys.right = down;
  if (key === "ArrowUp" || key === "w" || key === "W") state.keys.up = down;
  if (key === "ArrowDown" || key === "s" || key === "S") state.keys.down = down;
  if (key === " " || key === "Spacebar" || key === "Space" || key === "space") state.keys.space = down;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function getMenuAirframeHit(point) {
  if (state.mode !== "menu") return null;
  return menuAirframeHitboxes.find(
    (box) => point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h
  ) || null;
}

function getResultButtonHit(point) {
  if (state.mode !== "won" && state.mode !== "lost") return null;
  return resultButtonHitboxes.find(
    (box) => point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h
  ) || null;
}

function getUpgradeCardHit(point) {
  if (state.mode !== "upgrade") return null;
  return upgradeCardHitboxes.find(
    (box) => point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h
  ) || null;
}

function selectAdjacentAirframe(direction) {
  if (state.mode !== "menu") return;
  const order = AIRFRAME_ORDER;
  if (!order.length) return;
  const currentIndex = Math.max(0, order.indexOf(selectedAirframeId));
  const nextIndex = (currentIndex + direction + order.length) % order.length;
  const nextId = order[nextIndex];
  if (!nextId || nextId === selectedAirframeId) return;
  selectedAirframeId = nextId;
  loadSelectedAirframe();
}

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Space", "Spacebar"].includes(e.key)) {
    e.preventDefault();
  }
  if (state.mode === "upgrade" && !e.repeat) {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      state.upgradeSelection =
        (state.upgradeSelection - 1 + state.upgradeChoices.length) % Math.max(1, state.upgradeChoices.length);
      render();
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      state.upgradeSelection = (state.upgradeSelection + 1) % Math.max(1, state.upgradeChoices.length);
      render();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      chooseUpgrade(state.upgradeSelection);
      return;
    }
  }
  if (state.mode === "playing" && !e.repeat && (e.key === "Escape" || e.key === "p" || e.key === "P")) {
    e.preventDefault();
    setGamePaused(!state.paused);
    return;
  }
  if (state.mode === "menu" && !e.repeat) {
    if (e.key === "ArrowLeft") selectAdjacentAirframe(-1);
    if (e.key === "ArrowRight") selectAdjacentAirframe(1);
    if (["1", "2", "3"].includes(e.key) && allSpritesReady()) {
      startStageCheckpoint(Number(e.key));
      return;
    }
  }
  buttonToKey(e.key, true);

  if ((e.key === "m" || e.key === "M") && state.mode === "playing" && !e.repeat) {
    fireMissile();
  }

  if (e.key === "Enter" && state.mode === "playing" && !e.repeat && skipCinematicTimers()) {
    render();
    return;
  }

  if (e.key === "Enter" && state.mode === "lost") {
    restartCurrentStage();
    return;
  }

  if (e.key === "Enter" && (state.mode === "won" || state.mode === "menu")) {
    if (state.mode === "menu" && !allSpritesReady()) return;
    resetGame();
    return;
  }

  if ((e.key === "r" || e.key === "R") && state.mode === "lost" && !e.repeat) {
    resetGame();
    return;
  }

  if (e.key === "Escape" && (state.mode === "won" || state.mode === "lost") && !state.paused) {
    returnToMenu();
  }

  if ((e.key === "f" || e.key === "F") && document.fullscreenElement == null) {
    document.documentElement.requestFullscreen?.();
  } else if ((e.key === "f" || e.key === "F") && document.fullscreenElement != null) {
    document.exitFullscreen?.();
  }
});

window.addEventListener("keyup", (e) => {
  buttonToKey(e.key, false);
});

canvas.addEventListener("mousemove", (event) => {
  const point = getCanvasPoint(event);
  const menuHit = getMenuAirframeHit(point);
  const nextMenuHoverId = menuHit?.id || null;
  const resultHit = getResultButtonHit(point);
  const nextResultHoverId = resultHit?.id || null;
  const upgradeHit = getUpgradeCardHit(point);
  const nextUpgradeIndex = upgradeHit?.index ?? -1;
  if (
    nextMenuHoverId !== menuHoveredAirframeId ||
    nextResultHoverId !== hoveredResultButton ||
    nextUpgradeIndex !== hoveredUpgradeIndex
  ) {
    menuHoveredAirframeId = nextMenuHoverId;
    hoveredResultButton = nextResultHoverId;
    hoveredUpgradeIndex = nextUpgradeIndex;
    canvas.style.cursor = nextMenuHoverId || nextResultHoverId || nextUpgradeIndex >= 0 ? "pointer" : "";
    invalidateUiCaches();
    render();
  }
});

canvas.addEventListener("mouseleave", () => {
  if (menuHoveredAirframeId == null && hoveredResultButton == null && hoveredUpgradeIndex < 0) return;
  menuHoveredAirframeId = null;
  hoveredResultButton = null;
  hoveredUpgradeIndex = -1;
  canvas.style.cursor = "";
  invalidateUiCaches();
  render();
});

canvas.addEventListener("click", (event) => {
  const point = getCanvasPoint(event);
  const resultHit = getResultButtonHit(point);
  if (resultHit) {
    if (resultHit.id === "retry") {
      if (state.mode === "lost") restartCurrentStage();
      else resetGame();
      return;
    }
    if (resultHit.id === "hangar") {
      returnToMenu();
      return;
    }
  }

  const upgradeHit = getUpgradeCardHit(point);
  if (upgradeHit) {
    chooseUpgrade(upgradeHit.index);
    return;
  }

  const hit = getMenuAirframeHit(point);
  if (!hit || !AIRFRAMES[hit.id] || hit.id === selectedAirframeId) return;
  selectedAirframeId = hit.id;
  loadSelectedAirframe();
});

startBtn.addEventListener("click", () => {
  if (!allSpritesReady()) return;
  resetGame();
});

function renderGameToText() {
  const combatProfile = getCombinedCombatProfile();
  const payload = {
    mode: state.mode,
    paused: !!state.paused,
    selectedAirframe: selectedAirframeId,
    airframeTrait: getSelectedAirframe().statSummary,
    coordinateSystem: "origin at top-left; x rightward; y downward; units are canvas pixels",
    canvas: { width: canvas.width, height: canvas.height },
    player: {
      x: Number(state.player.x.toFixed(2)),
      y: Number(state.player.y.toFixed(2)),
      vx: Number(state.player.vx.toFixed(2)),
      vy: Number(state.player.vy.toFixed(2)),
      width: state.player.w,
      height: state.player.h,
      shield: state.player.shield,
      shieldCap: state.playerMaxShield,
      armor: state.player.armor,
      armorCap: state.playerMaxArmor,
      spreadTimer: Number(state.player.spreadTimer.toFixed(2)),
    },
    bullets: state.bullets.slice(0, 14).map((b) => ({ x: Number(b.x.toFixed(1)), y: Number(b.y.toFixed(1)), vx: Number((b.vx || 0).toFixed(1)) })),
    enemyBullets: state.enemyBullets.slice(0, 18).map((b) => ({ x: Number(b.x.toFixed(1)), y: Number(b.y.toFixed(1)), vx: Number((b.vx || 0).toFixed(1)), vy: Number(b.vy.toFixed(1)), kind: b.kind })),
    enemies: state.enemies
      .slice(0, 20)
      .map((e) => ({
        id: e.id,
        x: Number(e.x.toFixed(1)),
        y: Number(e.y.toFixed(1)),
        speed: Number(e.speed.toFixed(1)),
        movementType: e.movementType,
        elite: !!e.elite,
        boss: !!e.boss,
        hp: e.hp,
        dying: !!e.dying,
        hitFlash: Number((e.hitFlash || 0).toFixed(2)),
      })),
    powerups: state.powerups.slice(0, 8).map((p) => ({ type: p.type, x: Number(p.x.toFixed(1)), y: Number(p.y.toFixed(1)), life: Number(p.life.toFixed(2)) })),
    explosions: {
      active: state.explosions.length,
      sample: state.explosions.slice(0, 8).map((p) => ({ x: Number(p.x.toFixed(1)), y: Number(p.y.toFixed(1)), life: Number(p.life.toFixed(2)) })),
    },
    shockwaves: {
      active: state.shockwaves.length,
      sample: state.shockwaves
        .slice(0, 5)
        .map((w) => ({ x: Number(w.x.toFixed(1)), y: Number(w.y.toFixed(1)), radius: Number(w.radius.toFixed(1)), life: Number(w.life.toFixed(2)) })),
    },
    muzzleFlashes: {
      active: state.muzzleFlashes.length,
      sample: state.muzzleFlashes.slice(0, 4).map((m) => ({ x: Number(m.x.toFixed(1)), y: Number(m.y.toFixed(1)), life: Number(m.life.toFixed(2)) })),
    },
    score: state.score,
    stageProgress: stageDifficultyScore(),
    bossTriggerScore: state.bossSpawnScoreDelta || state.bossSpawnScore,
    kills: state.kills,
    targetScore: state.targetScore,
    stage: state.stage,
    stageCount: STAGE_COUNT,
    combatProfile: {
      speed: Number(combatProfile.speed.toFixed(1)),
      fireInterval: Number(combatProfile.fireInterval.toFixed(3)),
      spreadFireInterval: Number(combatProfile.spreadFireInterval.toFixed(3)),
      missileCooldown: Number(combatProfile.missileCooldown.toFixed(3)),
      armorInvulnDuration: Number(combatProfile.armorInvulnDuration.toFixed(3)),
      spreadDuration: Number(combatProfile.spreadDuration.toFixed(2)),
    },
    runUpgrades: state.runUpgradeHistory.slice(),
    upgradeChoices: state.mode === "upgrade" ? state.upgradeChoices.map((choice) => choice.label) : [],
    boss: {
      spawned: state.bossSpawned,
      defeated: state.bossDefeated,
      phaseBanner: Number(state.phaseBannerTimer.toFixed(2)),
    },
    lives: state.lives,
    timers: {
      spawnCooldown: Number(Math.max(0, state.spawnCooldown).toFixed(3)),
      fireCooldown: Number(Math.max(0, state.fireCooldown).toFixed(3)),
      hitStop: Number(Math.max(0, state.hitStop).toFixed(3)),
      victoryDelay: Number(Math.max(0, state.victoryDelay).toFixed(3)),
      stageClearNotice: Number(Math.max(0, state.stageClearNoticeTimer).toFixed(3)),
      bossWarning: Number(Math.max(0, state.bossWarningTimer).toFixed(3)),
      elapsed: Number(state.elapsed.toFixed(2)),
    },
  };
  return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  const dt = 1 / 60;
  for (let i = 0; i < steps; i++) {
    if (state.mode === "playing" && !state.paused) updatePlaying(dt);
  }
  render();
};
window.debugSpawnPowerup = (type = "spread") => {
  spawnPowerup(state.player.x - 11, Math.max(80, state.player.y - 160), type);
  render();
};
window.debugSpawnEnemy = (kind = "elite") => {
  const before = state.score;
  if (kind === "boss") {
    spawnBoss();
  } else {
    if (kind === "elite" && state.score < 4) state.score = 4;
    spawnEnemy();
    const enemy = state.enemies[state.enemies.length - 1];
    if (kind === "elite" && enemy) {
      enemy.elite = true;
      enemy.hp = 3;
      enemy.maxHp = 3;
      enemy.speed *= 0.82;
      enemy.deathDuration = 0.56;
    }
  }
  state.score = before;
  render();
};
window.debugTriggerStageClearNotice = (stageOverride = Number(debugFlags.get("debug_stage") || state.stage || 1)) => {
  state.mode = "playing";
  state.stage = Math.max(1, Math.min(STAGE_COUNT, Number(stageOverride) || 1));
  applyStageProgress(state.stage);
  state.stageScoreStart = Math.max(0, state.score);
  state.bossSpawned = true;
  state.bossDefeated = true;
  state.activeBoss = null;
  state.victoryDelay = 0;
  state.stageClearNoticeTimer = state.stageClearNoticeDuration;
  state.enemyBullets.length = 0;
  state.enemies.length = 0;
  clearTransientEffects();
  render();
};
window.debugSetStage = (stageOverride = 1) => {
  state.mode = "playing";
  state.stage = Math.max(1, Math.min(STAGE_COUNT, Number(stageOverride) || 1));
  applyStageProgress(state.stage);
  state.stageScoreStart = 0;
  state.score = 0;
  state.kills = 0;
  state.lives = 3;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.activeBoss = null;
  state.victoryDelay = 0;
  state.stageClearNoticeTimer = -1;
  state.bossWarningTimer = 0;
  state.spawnCooldown = 0;
  state.enemyBullets.length = 0;
  state.bullets.length = 0;
  state.enemies.length = 0;
  clearTransientEffects();
  render();
};
window.debugTriggerBossWarning = (stageOverride = Number(debugFlags.get("debug_stage") || 1)) => {
  state.mode = "playing";
  state.stage = Math.max(1, Math.min(STAGE_COUNT, Number(stageOverride) || 1));
  applyStageProgress(state.stage);
  state.stageScoreStart = 0;
  state.score = 0;
  state.kills = 0;
  state.lives = 3;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.activeBoss = null;
  state.victoryDelay = 0;
  state.stageClearNoticeTimer = -1;
  state.bossWarningTimer = state.bossWarningDuration;
  state.enemyBullets.length = 0;
  state.bullets.length = 0;
  state.enemies.length = 0;
  clearTransientEffects();
  render();
};

syncChrome();
render();
cancelAnimationFrame(rafId);
rafId = requestAnimationFrame(tick);
