(() => {
  function createGameAssetStore({ AIRFRAMES, canvas, buildSpriteCanvas, getScaledSpriteVariant, requestRender }) {
    const store = {
      player: {
        image: new Image(),
        spriteCanvas: null,
        ready: false,
        armoredImage: new Image(),
        armoredSpriteCanvas: null,
        armoredReady: false,
      },
      enemies: {
        claude: { image: new Image(), spriteCanvas: null, ready: false },
        zero: { image: new Image(), spriteCanvas: null, ready: false },
        a6m5: { image: new Image(), spriteCanvas: null, ready: false },
        n1k2: { image: new Image(), spriteCanvas: null, ready: false },
        a7m2: { image: new Image(), spriteCanvas: null, ready: false },
        j2m: { image: new Image(), spriteCanvas: null, ready: false },
        boss: { image: new Image(), spriteCanvas: null, ready: false },
        elite: { spriteCanvas: null, ready: false },
      },
      ships: {
        kongo: { image: new Image(), spriteCanvas: null, ready: false },
        nagato: { image: new Image(), spriteCanvas: null, ready: false },
        yamato: { image: new Image(), spriteCanvas: null, ready: false },
      },
      background: {
        image: new Image(),
        imageReady: false,
        drawW: 0,
        drawH: 0,
        coverCanvas: null,
        coverReady: false,
      },
      weapons: {
        bullet: { image: new Image(), spriteCanvas: null, spriteVariant: null, ready: false },
        enemyBullets: {
          kinds: ["normal", "elite", "boss"],
          spriteCanvases: { normal: null, elite: null, boss: null },
          renderSprites: { normal: null, elite: null, boss: null },
          ready: { normal: false, elite: false, boss: false },
        },
        missile: { image: new Image(), spriteCanvas: null, ready: false },
        muzzleFlash: { spriteCanvas: null, size: 0 },
      },
      loadSelectedAirframe(airframeId) {
        const airframe = AIRFRAMES[airframeId] || AIRFRAMES.p51d;
        store.player.ready = false;
        store.player.spriteCanvas = null;
        store.player.image.src = airframe.assetPath;
        store.player.armoredReady = false;
        store.player.armoredSpriteCanvas = null;
        if (airframe.armoredAssetPath) {
          store.player.armoredImage.src = airframe.armoredAssetPath;
        }
      },
      allSpritesReady() {
        return (
          store.player.ready &&
          store.enemies.claude.ready &&
          store.enemies.zero.ready &&
          store.enemies.a6m5.ready &&
          store.enemies.n1k2.ready &&
          store.enemies.a7m2.ready &&
          store.enemies.j2m.ready &&
          store.enemies.elite.ready &&
          store.enemies.boss.ready &&
          store.weapons.bullet.ready &&
          store.weapons.missile.ready &&
          store.ships.kongo.ready &&
          store.ships.nagato.ready &&
          store.ships.yamato.ready
        );
      },
      syncDerivedSprites() {
        store.enemies.elite.spriteCanvas = store.enemies.zero.spriteCanvas;
        store.enemies.elite.ready = store.enemies.zero.ready;
      },
    };

    store.player.image.addEventListener("load", () => {
      const offscreen = buildSpriteCanvas(store.player.image);
      if (!offscreen) return;
      store.player.spriteCanvas = offscreen;
      store.player.ready = true;
      requestRender();
    });

    store.player.armoredImage.addEventListener("load", () => {
      const offscreen = buildSpriteCanvas(store.player.armoredImage);
      if (!offscreen) return;
      store.player.armoredSpriteCanvas = offscreen;
      store.player.armoredReady = true;
      requestRender();
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
        requestRender();
      });
      airframe.previewImage.src = airframe.assetPath;
    }

    const enemyDefs = [
      ["claude", "./assets/aircraft/enemies/ijn/A5M-Claude-removebg-preview.png?v=20260401a"],
      ["zero", "./assets/aircraft/enemies/ijn/A6M2-Zero-Model-21-removebg-preview.png?v=20260401a"],
      ["a6m5", "./assets/aircraft/enemies/ijn/A6M5-Zero-Model-52-removebg-preview.png?v=20260402d"],
      ["n1k2", "./assets/aircraft/enemies/ijn/N1K2-J-Shiden-Kai-removebg-preview.png?v=20260402d"],
      ["a7m2", "./assets/aircraft/enemies/ijn/A7M2-Reppu-removebg-preview.png?v=20260403a"],
      ["j2m", "./assets/aircraft/enemies/ijn/J2M-Raiden-Jack-removebg-preview.png?v=20260403a"],
      ["boss", "./assets/aircraft/enemies/boss/boss_plane_transparent.png?v=20260330u"],
    ];

    for (const [key, src] of enemyDefs) {
      const enemyAsset = store.enemies[key];
      enemyAsset.image.src = src;
      enemyAsset.image.addEventListener("load", () => {
        const offscreen = buildSpriteCanvas(enemyAsset.image, Math.PI);
        if (!offscreen) return;
        enemyAsset.spriteCanvas = offscreen;
        enemyAsset.ready = true;
        if (key === "zero") store.syncDerivedSprites();
        requestRender();
      });
    }

    const shipDefs = [
      ["kongo", "./assets/naval/bosses/KONGO-CLASS-removebg-preview.png?v=20260404ship"],
      ["nagato", "./assets/naval/candidates/NAGATO-CLASS-removebg-preview.png?v=20260404ship"],
      ["yamato", "./assets/naval/candidates/YAMATO-CLASS-removebg-preview.png?v=20260404ship"],
    ];

    for (const [key, src] of shipDefs) {
      const shipAsset = store.ships[key];
      shipAsset.image.src = src;
      shipAsset.image.addEventListener("load", () => {
        const offscreen = buildSpriteCanvas(shipAsset.image);
        if (!offscreen) return;
        shipAsset.spriteCanvas = offscreen;
        shipAsset.ready = true;
        requestRender();
      });
    }

    store.background.image.src = "./assets/runtime-bg-pacific-no-text-no-flags-1600x1120.png?v=20260403bg1";
    store.background.image.addEventListener("load", () => {
      store.background.imageReady = true;
      const padding = 22;
      const targetW = canvas.width + padding * 2;
      const targetH = canvas.height + padding * 2;
      const scale = Math.max(targetW / store.background.image.naturalWidth, targetH / store.background.image.naturalHeight);
      store.background.drawW = store.background.image.naturalWidth * scale;
      store.background.drawH = store.background.image.naturalHeight * scale;

      const c = document.createElement("canvas");
      c.width = Math.ceil(store.background.drawW);
      c.height = Math.ceil(store.background.drawH);
      const gctx = c.getContext("2d");
      if (gctx) {
        gctx.clearRect(0, 0, c.width, c.height);
        gctx.save();
        gctx.globalAlpha = 1;
        gctx.filter = "blur(3.2px) saturate(0.88) brightness(0.98) contrast(0.92)";
        gctx.drawImage(store.background.image, 0, 0, c.width, c.height);
        gctx.restore();
        gctx.fillStyle = "rgba(8, 28, 46, 0.2)";
        gctx.fillRect(0, 0, c.width, c.height);
        store.background.coverCanvas = c;
        store.background.coverReady = true;
      }

      requestRender();
    });

    store.weapons.bullet.image.src = "./assets/weapons/bullets/bullet.png?v=20260330u";
    store.weapons.bullet.image.addEventListener("load", () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = store.weapons.bullet.image.naturalWidth;
      offscreen.height = store.weapons.bullet.image.naturalHeight;
      const offscreenCtx = offscreen.getContext("2d");
      if (!offscreenCtx) return;
      offscreenCtx.drawImage(store.weapons.bullet.image, 0, 0);
      store.weapons.bullet.spriteCanvas = offscreen;
      store.weapons.bullet.spriteVariant = getScaledSpriteVariant(offscreen, 22, 1);
      store.weapons.bullet.ready = true;
      requestRender();
    });

    for (const kind of store.weapons.enemyBullets.kinds) {
      const enemyBulletImage = new Image();
      enemyBulletImage.src = `./assets/weapons/bullets/enemy_bullet_${kind}.png?v=20260402b`;
      enemyBulletImage.addEventListener("load", () => {
        const offscreen = buildSpriteCanvas(enemyBulletImage, Math.PI);
        if (!offscreen) return;
        store.weapons.enemyBullets.spriteCanvases[kind] = offscreen;
        store.weapons.enemyBullets.renderSprites[kind] = getScaledSpriteVariant(offscreen, kind === "boss" ? 30 : 25, 1);
        store.weapons.enemyBullets.ready[kind] = true;
        requestRender();
      });
    }

    store.weapons.missile.image.src = "./assets/weapons/missiles/daodan.png?v=20260330u";
    store.weapons.missile.image.addEventListener("load", () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = store.weapons.missile.image.naturalWidth;
      offscreen.height = store.weapons.missile.image.naturalHeight;
      const offscreenCtx = offscreen.getContext("2d");
      if (!offscreenCtx) return;
      offscreenCtx.drawImage(store.weapons.missile.image, 0, 0);
      store.weapons.missile.spriteCanvas = offscreen;
      store.weapons.missile.ready = true;
      requestRender();
    });

    const size = 24;
    store.weapons.muzzleFlash.size = size;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const mctx = c.getContext("2d");
    if (mctx) {
      const cx = size / 2;
      const cy = size / 2;
      const grad = mctx.createRadialGradient(cx, cy, 1, cx, cy, 12);
      grad.addColorStop(0, "rgba(255,250,219,0.95)");
      grad.addColorStop(0.35, "rgba(255,193,92,0.85)");
      grad.addColorStop(1, "rgba(255,193,92,0)");
      mctx.fillStyle = grad;
      mctx.beginPath();
      mctx.moveTo(cx, cy - 7);
      mctx.lineTo(cx - 5.5, cy + 4.5);
      mctx.lineTo(cx + 5.5, cy + 4.5);
      mctx.closePath();
      mctx.fill();
      mctx.fillStyle = grad;
      mctx.beginPath();
      mctx.arc(cx, cy, 8, 0, Math.PI * 2);
      mctx.fill();
      store.weapons.muzzleFlash.spriteCanvas = c;
    }

    return store;
  }

  window.GameAssetFactory = { createGameAssetStore };
})();
