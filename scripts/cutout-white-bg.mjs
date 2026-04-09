#!/usr/bin/env node
/**
 * Remove near-white background, drop disconnected regions (caption text),
 * keep largest connected component (battleship + rigging).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

let minWhite = 246;
let spread = 12;

function parseArgs(argv) {
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--min-white" && argv[i + 1]) {
      minWhite = Number(argv[++i]);
    } else if (a === "--spread" && argv[i + 1]) {
      spread = Number(argv[++i]);
    } else if (!a.startsWith("--")) {
      positional.push(a);
    }
  }
  return positional;
}

/** Perceived whiteness: high = more likely background */
function isBackgroundPixel(r, g, b) {
  const m = Math.min(r, g, b);
  const M = Math.max(r, g, b);
  if (m >= minWhite) return true;
  if (m >= minWhite - spread && M - m <= spread + 6) return true;
  return false;
}

function largestComponentMask(width, height, alpha, connectivity = 8) {
  const n = width * height;
  const labels = new Int32Array(n).fill(-1);
  let bestSize = 0;
  let bestLabel = -1;
  let nextLabel = 0;
  const sizes = [];

  const neighbors =
    connectivity === 8
      ? [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ]
      : [
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, 0],
        ];

  function idx(x, y) {
    return y * width + x;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (alpha[i] < 128) continue;
      if (labels[i] >= 0) continue;

      const lab = nextLabel++;
      sizes.push(0);
      const stack = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const ci = idx(cx, cy);
        if (labels[ci] >= 0) continue;
        if (alpha[ci] < 128) continue;
        labels[ci] = lab;
        sizes[lab]++;

        for (const [dx, dy] of neighbors) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ni = idx(nx, ny);
          if (labels[ni] < 0 && alpha[ni] >= 128) stack.push([nx, ny]);
        }
      }

      if (sizes[lab] > bestSize) {
        bestSize = sizes[lab];
        bestLabel = lab;
      }
    }
  }

  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (labels[i] === bestLabel && bestLabel >= 0) out[i] = 255;
    else out[i] = 0;
  }
  return out;
}

function trimAlphaBBox(width, height, alpha) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] >= 128) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function processOne(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error("expected RGBA");
  const n = width * height;
  const alpha = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    if (isBackgroundPixel(r, g, b)) alpha[i] = 0;
    else alpha[i] = 255;
  }

  const kept = largestComponentMask(width, height, alpha, 8);
  const outBuf = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const k = kept[i];
    outBuf[o] = data[o];
    outBuf[o + 1] = data[o + 1];
    outBuf[o + 2] = data[o + 2];
    outBuf[o + 3] = k;
  }

  const bbox = trimAlphaBBox(width, height, kept);
  if (!bbox) {
    console.error("no content:", inputPath);
    return;
  }

  await sharp(outBuf, { raw: { width, height, channels: 4 } })
    .extract(bbox)
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);

  console.log("wrote", outputPath, bbox);
}

const defaultJobs = [
  ["/Users/legolas/Downloads/flys/微信图片_20260331163243_23_43.jpg", "/Users/legolas/Downloads/flys/kongou-ship-cutout.png"],
  ["/Users/legolas/Downloads/flys/微信图片_20260331163244_24_43.jpg", "/Users/legolas/Downloads/flys/nagato-ship-cutout.png"],
  ["/Users/legolas/Downloads/flys/微信图片_20260331163245_25_43.jpg", "/Users/legolas/Downloads/flys/yamato-ship-cutout.png"],
];

async function main() {
  const positional = parseArgs(process.argv);
  let jobs = defaultJobs;
  if (positional.length >= 2 && positional.length % 2 === 0) {
    jobs = [];
    for (let i = 0; i < positional.length; i += 2) jobs.push([positional[i], positional[i + 1]]);
  }

  for (const [inp, outp] of jobs) {
    if (!fs.existsSync(inp)) {
      console.error("skip missing:", inp);
      continue;
    }
    const dir = path.dirname(outp);
    fs.mkdirSync(dir, { recursive: true });
    await processOne(inp, outp);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
