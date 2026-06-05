import * as esbuild from 'esbuild';
import { deflateSync } from 'zlib';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const watch = process.argv.includes('--watch');

// 生成胶囊图标 PNG（RGBA，SDF 抗锯齿，无外部依赖）
function makePNG(size, getPixel) {
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[i] = c;
  }
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; ihdrData[9] = 6; // RGBA

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const { r, g, b, a } = getPixel(x, y);
      row[1 + x * 4] = r; row[1 + x * 4 + 1] = g;
      row[1 + x * 4 + 2] = b; row[1 + x * 4 + 3] = a;
    }
    rows.push(row);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeIconPixelFn(size) {
  const cx = size / 2, cy = size / 2;
  const bgR = 0xEB, bgG = 0x4C, bgB = 0x89;
  const bgCorner = size * 0.22;
  // 竖向胶囊（垂直药丸）
  const pHW = size * 0.17;              // 半宽 = 圆角半径
  const pHH = size * 0.32;             // 半高
  const innerHH = Math.max(0, pHH - pHW);

  function sdfRR(px, py, chx, chy, hw, hh, r) {
    const dx = Math.abs(px - chx) - hw + r;
    const dy = Math.abs(py - chy) - hh + r;
    return (dx > 0 && dy > 0) ? Math.sqrt(dx * dx + dy * dy) - r : Math.max(dx, dy) - r;
  }
  // 竖向胶囊 SDF
  function sdfPill(px, py) {
    const dx = Math.abs(px - cx);
    const dy = Math.max(Math.abs(py - cy) - innerHH, 0);
    return Math.sqrt(dx * dx + dy * dy) - pHW;
  }

  return function(x, y) {
    const px = x + 0.5, py = y + 0.5;

    const bgD = sdfRR(px, py, cx, cy, cx - 0.5, cy - 0.5, bgCorner);
    const bgA = Math.min(1, Math.max(0, 0.5 - bgD));
    if (bgA <= 0) return { r: 0, g: 0, b: 0, a: 0 };

    let r = bgR, g = bgG, b = bgB;

    const pD = sdfPill(px, py);
    const pA = Math.min(1, Math.max(0, 0.7 - pD));
    if (pA > 0) {
      // 上半纯白，下半略暖白
      const wR = 255, wG = py < cy ? 255 : 253, wB = py < cy ? 255 : 254;
      r = Math.round(r + (wR - r) * pA);
      g = Math.round(g + (wG - g) * pA);
      b = Math.round(b + (wB - b) * pA);

      // 水平中缝线
      if (pD < -0.5) {
        const sw = Math.max(0.55, size * 0.012);
        const sd = Math.abs(py - cy);
        if (sd < sw + 0.5) {
          const sA = Math.min(0.55, Math.max(0, sw + 0.5 - sd) * 0.55);
          r = Math.round(r * (1 - sA) + (bgR * 0.45 + 255 * 0.55) * sA);
          g = Math.round(g * (1 - sA) + (bgG * 0.45 + 255 * 0.55) * sA);
          b = Math.round(b * (1 - sA) + (bgB * 0.45 + 255 * 0.55) * sA);
        }
      }
    }

    return { r, g, b, a: Math.round(bgA * 255) };
  };
}

function generateIcons() {
  const dir = 'icons';
  if (!existsSync(dir)) mkdirSync(dir);
  for (const size of [16, 48, 128]) {
    const path = `${dir}/icon${size}.png`;
    if (!existsSync(path)) {
      writeFileSync(path, makePNG(size, makeIconPixelFn(size)));
      console.log(`生成图标 ${path}`);
    }
  }
}

generateIcons();

const baseConfig = {
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  target: 'chrome120',
};

const builds = [
  {
    ...baseConfig,
    entryPoints: ['src/content/index.ts'],
    outfile: 'dist/content.js',
    format: 'iife',
  },
  {
    ...baseConfig,
    entryPoints: ['src/background.ts'],
    outfile: 'dist/background.js',
    format: 'esm',
  },
  {
    ...baseConfig,
    entryPoints: ['src/options/options.ts'],
    outfile: 'dist/options.js',
    format: 'iife',
  },
  {
    ...baseConfig,
    entryPoints: ['src/content/interceptor.ts'],
    outfile: 'dist/interceptor.js',
    format: 'iife',
  },
];

if (watch) {
  const ctxs = await Promise.all(builds.map(esbuild.context));
  await Promise.all(ctxs.map(ctx => ctx.watch()));
  console.log('watching...');
} else {
  await Promise.all(builds.map(esbuild.build));
  console.log('build done ✓');
}
