(() => {
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

  const AIRCRAFT_MODELS = {
    claude: {
      id: "claude",
      spriteKeys: ["claude", "zero"],
    },
    zero21: {
      id: "zero21",
      spriteKeys: ["zero", "claude"],
    },
    a6m5: {
      id: "a6m5",
      spriteKeys: ["a6m5", "zero"],
    },
    reppu: {
      id: "reppu",
      spriteKeys: ["a7m2", "a6m5", "zero"],
    },
    n1k2: {
      id: "n1k2",
      spriteKeys: ["n1k2", "zero"],
    },
    raiden: {
      id: "raiden",
      spriteKeys: ["j2m", "n1k2", "zero"],
    },
  };

  const BOSS_VARIANTS = {
    kongo: {
      id: "kongo",
      displayName: "KONGO-CLASS",
      shipSpriteKey: "kongo",
      warningText: {
        ja: "金剛型戦艦 接近",
        zh: "金刚级战列舰接近",
        en: "KONGO-CLASS BATTLESHIP APPROACHING",
      },
      phaseDescriptors: ["Main battery ranging", "Cross-broadside pressure", "Heavy salvo collapse"],
      stats: {
        hp: 52,
        armorBulletScale: 0.88,
        armorMissileScale: 0.74,
        hitShieldWindow: 0.18,
        shipVolleyScale: 1,
      },
    },
    nagato: {
      id: "nagato",
      displayName: "NAGATO-CLASS",
      shipSpriteKey: "nagato",
      warningText: {
        ja: "長門型戦艦 接近",
        zh: "长门级战列舰接近",
        en: "NAGATO-CLASS BATTLESHIP APPROACHING",
      },
      phaseDescriptors: ["Main battery ranging", "Cross-broadside pressure", "Heavy salvo collapse"],
      stats: {
        hp: 58,
        armorBulletScale: 0.82,
        armorMissileScale: 0.68,
        hitShieldWindow: 0.16,
        shipVolleyScale: 0.88,
      },
    },
    yamato: {
      id: "yamato",
      displayName: "YAMATO-CLASS",
      shipSpriteKey: "yamato",
      warningText: {
        ja: "大和型戦艦 接近",
        zh: "大和级战列舰接近",
        en: "YAMATO-CLASS BATTLESHIP APPROACHING",
      },
      phaseDescriptors: ["Opening fan spread", "Alternating broadside sweep", "Final heavy barrage"],
      stats: {
        hp: 74,
        armorBulletScale: 0.76,
        armorMissileScale: 0.62,
        hitShieldWindow: 0.14,
        shipVolleyScale: 0.8,
      },
    },
  };

  const STAGE_DEFS = {
    1: {
      id: 1,
      act: "第一幕 · 前沿接敌",
      theatreIntel: {
        act: "第一幕 · 前沿接敌",
        air: "敌机：九六舰战 / 零战二一 · 精锐：零战二一",
        bossIdle: "主力舰目标：金刚级",
        bossActive: "主力舰：金刚级（交战）",
      },
      resultBands: ["Intercept Run", "Mid Sweep", "Late Sweep"],
      backgroundBaseFill: "#0d2f4d",
      progress: { bossSpawnScore: 30, targetScore: 30 },
      bossVariant: "kongo",
      normalModelPool: ["claude", "zero21"],
      normalPoolWeights: [0.34, 0.66],
      eliteModel: "zero21",
      advancedAirPattern: false,
      airMainJa: "九六艦戦",
      airMainEn: "A5M CLAUDE",
      airMainSrc: "./assets/aircraft/enemies/ijn/A5M-Claude-removebg-preview.png?v=20260401a",
      airEliteJa: "零戦二一型",
      airEliteEn: "A6M2 ZERO MODEL 21",
      airEliteSrc: "./assets/aircraft/enemies/ijn/A6M2-Zero-Model-21-removebg-preview.png?v=20260401a",
      bossJa: "金剛級戦艦",
      bossEn: "KONGO-CLASS BATTLESHIP",
      bossSrc: "./assets/naval/bosses/KONGO-CLASS-removebg-preview.png?v=20260404ship",
    },
    2: {
      id: 2,
      act: "第二幕 · 深水拦截",
      theatreIntel: {
        act: "第二幕 · 深水拦截",
        air: "敌机：零战五二型 · 精锐：紫电改",
        bossIdle: "主力舰目标：长门级",
        bossActive: "主力舰：长门级（交战）",
      },
      resultBands: ["Second Line", "Sustain Sweep", "Deep Sweep"],
      backgroundBaseFill: "#0d2f4d",
      progress: { bossSpawnScore: 55, targetScore: 60 },
      bossVariant: "nagato",
      normalModelPool: ["a6m5"],
      normalPoolWeights: [1],
      eliteModel: "n1k2",
      advancedAirPattern: false,
      airMainJa: "零戦五二型",
      airMainEn: "A6M5 ZERO MODEL 52",
      airMainSrc: "./assets/aircraft/enemies/ijn/A6M5-Zero-Model-52-removebg-preview.png?v=20260402d",
      airEliteJa: "紫電改",
      airEliteEn: "N1K2 SHIDEN-KAI",
      airEliteSrc: "./assets/aircraft/enemies/ijn/N1K2-J-Shiden-Kai-removebg-preview.png?v=20260402d",
      bossJa: "長門級戦艦",
      bossEn: "NAGATO-CLASS BATTLESHIP",
      bossSrc: "./assets/naval/candidates/NAGATO-CLASS-removebg-preview.png?v=20260404ship",
    },
    3: {
      id: 3,
      act: "第三幕 · 决战海域",
      theatreIntel: {
        act: "第三幕 · 决战海域",
        air: "敌机：烈风 · 精锐：雷电",
        bossIdle: "主力舰目标：大和级",
        bossActive: "主力舰：大和级（交战）",
      },
      resultBands: ["Approach Vector", "Heavy Resistance", "Final Corridor"],
      backgroundBaseFill: "#0b2437",
      progress: { bossSpawnScore: 90, targetScore: 95 },
      bossVariant: "yamato",
      normalModelPool: ["reppu"],
      normalPoolWeights: [1],
      eliteModel: "raiden",
      advancedAirPattern: true,
      airMainJa: "烈風",
      airMainEn: "A7M2 REPPU",
      airMainSrc: "./assets/aircraft/enemies/ijn/A7M2-Reppu-removebg-preview.png?v=20260403a",
      airEliteJa: "雷電",
      airEliteEn: "J2M RAIDEN",
      airEliteSrc: "./assets/aircraft/enemies/ijn/J2M-Raiden-Jack-removebg-preview.png?v=20260403a",
      bossJa: "大和級戦艦",
      bossEn: "YAMATO-CLASS BATTLESHIP",
      bossSrc: "./assets/naval/candidates/YAMATO-CLASS-removebg-preview.png?v=20260404ship",
    },
  };

  function clampStage(stage) {
    return Math.max(1, Math.min(STAGE_COUNT, Math.round(stage || 1)));
  }

  function getStageDefinition(stage) {
    return STAGE_DEFS[clampStage(stage)];
  }

  function getStageProgress(stage) {
    const stageDef = getStageDefinition(stage);
    return { ...stageDef.progress };
  }

  function getStageBossVariant(stage) {
    return getStageDefinition(stage).bossVariant;
  }

  function getBossDisplayName(variant) {
    return BOSS_VARIANTS[variant]?.displayName || BOSS_VARIANTS.kongo.displayName;
  }

  function getBossWarningText(stage) {
    const bossVariant = getStageBossVariant(stage);
    return { ...BOSS_VARIANTS[bossVariant].warningText };
  }

  function getStageLoadout(stage) {
    const stageDef = getStageDefinition(stage);
    return {
      act: stageDef.act,
      airMainJa: stageDef.airMainJa,
      airMainEn: stageDef.airMainEn,
      airMainSrc: stageDef.airMainSrc,
      airEliteJa: stageDef.airEliteJa,
      airEliteEn: stageDef.airEliteEn,
      airEliteSrc: stageDef.airEliteSrc,
      bossJa: stageDef.bossJa,
      bossEn: stageDef.bossEn,
      bossSrc: stageDef.bossSrc,
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

  const PLAYER_INVULN_DURATION = 0.22;

  const RUN_UPGRADE_POOL = [
    {
      id: "afterburner-trim",
      label: "Afterburner Trim",
      shortLabel: "Afterburner",
      description: "Loosens the airframe for faster lateral correction through dense bullet lanes.",
      statLine: "+8% move speed",
      modifiers: { speedScale: 1.08 },
    },
    {
      id: "gun-harmonization",
      label: "Gun Harmonization",
      shortLabel: "Gun Feed",
      description: "Tightens wing-gun timing so the main battery cycles sooner on every burst.",
      statLine: "-8% primary cooldown",
      modifiers: { fireRateScale: 0.92 },
    },
    {
      id: "rapid-rack",
      label: "Rapid Rack",
      shortLabel: "Rapid Rack",
      description: "Shortens missile recycle time so large contacts are pressured more often.",
      statLine: "-14% missile cooldown",
      modifiers: { missileCooldownScale: 0.86 },
    },
    {
      id: "shield-relay",
      label: "Shield Relay",
      shortLabel: "Shield Relay",
      description: "Expands reserve shielding and immediately tops one charge back into the bay.",
      statLine: "+1 shield cap and +1 charge",
      modifiers: { shieldCapBonus: 1 },
    },
    {
      id: "armor-belt",
      label: "Armor Belt",
      shortLabel: "Armor Belt",
      description: "Adds a sacrificial armor plate and extends the recovery window after the plating breaks.",
      statLine: "+1 armor and +0.16s guard",
      modifiers: { armorCapBonus: 1, armorInvulnBonus: 0.16 },
    },
    {
      id: "wide-salvo",
      label: "Wide Salvo",
      shortLabel: "Wide Salvo",
      description: "Keeps spread ammo active longer so elite waves can be pushed aggressively.",
      statLine: "+2.2s spread duration",
      modifiers: { spreadDurationBonus: 2.2 },
    },
  ];

  function getStageStartScore(stage) {
    if (stage <= 1) return 0;
    return getStageProgress(stage - 1).targetScore;
  }

  function getBossPhaseDescriptor(boss, phase = boss?.phase || 1) {
    if (!boss) return "Opening volley";
    const descriptors = BOSS_VARIANTS[boss.variant]?.phaseDescriptors || BOSS_VARIANTS.kongo.phaseDescriptors;
    return descriptors[Math.max(0, Math.min(descriptors.length - 1, phase - 1))];
  }

  function getTheatreIntelBrief(stage, inBossFight = false) {
    const theatreIntel = getStageDefinition(stage).theatreIntel;
    return {
      act: theatreIntel.act,
      air: theatreIntel.air,
      bb: inBossFight ? theatreIntel.bossActive : theatreIntel.bossIdle,
    };
  }

  function pickNormalEnemyModel(stage, randomValue = Math.random()) {
    const stageDef = getStageDefinition(stage);
    const weights = stageDef.normalPoolWeights || stageDef.normalModelPool.map(() => 1);
    const total = weights.reduce((sum, value) => sum + value, 0) || 1;
    let cursor = randomValue * total;
    for (let i = 0; i < stageDef.normalModelPool.length; i++) {
      cursor -= weights[i] || 0;
      if (cursor <= 0) return stageDef.normalModelPool[i];
    }
    return stageDef.normalModelPool[stageDef.normalModelPool.length - 1];
  }

  function getEliteEnemyModel(stage) {
    return getStageDefinition(stage).eliteModel;
  }

  function getBossConfig(stage) {
    const bossVariant = getStageBossVariant(stage);
    return {
      variant: bossVariant,
      ...BOSS_VARIANTS[bossVariant].stats,
    };
  }

  function getStageResultBandLabel(stage, ratio) {
    const bands = getStageDefinition(stage).resultBands;
    if (ratio >= 0.66) return bands[2];
    if (ratio >= 0.33) return bands[1];
    return bands[0];
  }

  function getStageBackgroundFill(stage) {
    return getStageDefinition(stage).backgroundBaseFill;
  }

  function getAircraftSpriteKeys(model) {
    return [...(AIRCRAFT_MODELS[model]?.spriteKeys || AIRCRAFT_MODELS.zero21.spriteKeys)];
  }

  function getShipSpriteKey(variant) {
    return BOSS_VARIANTS[variant]?.shipSpriteKey || BOSS_VARIANTS.kongo.shipSpriteKey;
  }

  window.GameContent = {
    AIRFRAMES,
    STAGE_COUNT,
    STAGE_DEFS,
    AIRCRAFT_MODELS,
    BOSS_VARIANTS,
    ENEMY_CAPS,
    PERFORMANCE_CAPS,
    BASE_PLAYER_STATS,
    PLAYER_INVULN_DURATION,
    RUN_UPGRADE_POOL,
    getStageProgress,
    getStageBossVariant,
    getBossDisplayName,
    getBossWarningText,
    getStageLoadout,
    getStageStartScore,
    getBossPhaseDescriptor,
    getStageDefinition,
    getTheatreIntelBrief,
    pickNormalEnemyModel,
    getEliteEnemyModel,
    getBossConfig,
    getStageResultBandLabel,
    getStageBackgroundFill,
    getAircraftSpriteKeys,
    getShipSpriteKey,
  };
})();
