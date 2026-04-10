#!/usr/bin/env node
/**
 * Lightweight regression smoke: static server + Playwright Chromium.
 * Run: npm run smoke
 * Requires: npx playwright install chromium (once per machine / after playwright upgrade)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function safeFilePath(urlPath) {
  const raw = decodeURIComponent(urlPath.split("?")[0]);
  const rel = raw === "/" || raw === "" ? "index.html" : raw.replace(/^\/+/, "");
  const full = path.normalize(path.join(ROOT, rel));
  const relCheck = path.relative(ROOT, full);
  if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) return null;
  return full;
}

function createStaticServer() {
  return http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      return res.end();
    }
    const filePath = safeFilePath(req.url || "/");
    if (!filePath) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end();
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      res.end(data);
    });
  });
}

async function runSmoke(baseUrl) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(5000);

    const boot = await page.evaluate(() => {
      const c = document.getElementById("game");
      const r = JSON.parse(window.render_game_to_text());
      const rect = c.getBoundingClientRect();
      return {
        mode: r.mode,
        backingW: c.width,
        backingH: c.height,
        cssW: rect.width,
        cssH: rect.height,
        rsx: r.canvas.renderScaleX,
        rsy: r.canvas.renderScaleY,
        logicalW: r.canvas.logicalWidth,
        logicalH: r.canvas.logicalHeight,
      };
    });

    await page.click("#start-btn");
    await page.waitForTimeout(500);

    const playing = await page.evaluate(() => JSON.parse(window.render_game_to_text()).mode);
    await page.evaluate(() => window.advanceTime(120));
    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    if (errors.length) {
      console.error("Smoke failed: browser console / page errors:\n", errors.join("\n"));
      process.exitCode = 1;
      return;
    }

    const scaleOk = Math.abs(boot.rsx - boot.rsy) < 0.001;
    const sizeOk = Math.abs(boot.cssH - 560) < 2 && Math.abs(boot.cssW - 800) < 2;
    const logicalOk = boot.logicalW === 800 && boot.logicalH === 560;
    const flowOk = boot.mode === "menu" && playing === "playing" && after.mode === "playing";

    if (!(flowOk && scaleOk && sizeOk && logicalOk)) {
      console.error("Smoke failed: assertion mismatch.", { boot, playing, afterMode: after.mode });
      process.exitCode = 1;
      return;
    }

    console.log("smoke: ok (menu → playing, canvas logical 800×560, uniform scale, no console errors)");
  } finally {
    await browser.close();
  }
}

async function main() {
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", resolve);
    server.on("error", reject);
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await runSmoke(baseUrl);
  } catch (e) {
    if (String(e.message || e).includes("Executable doesn't exist")) {
      console.error(
        "Playwright browser missing. Install Chromium once:\n  npx playwright install chromium\n"
      );
    }
    console.error(e);
    process.exitCode = 1;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main();
