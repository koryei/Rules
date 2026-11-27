#!/usr/bin/env node
// Writes the hero painting to site/art/ for browsers without JavaScript and
// for link previews. Run after changing site/scene.js. No dependencies.
//
//   node scripts/render-poster.mjs

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { W, H, paintBackdrop, paintFrame } from '../site/scene.js';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b) => {
  let c = 0xffffffff;
  for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), body.length + 4);
  return out;
};

// rgba is W*H*4. view picks a rectangle; scale enlarges it with hard pixels.
function png(rgba, view, scale) {
  const [vx, vy, vw, vh] = view;
  const w = vw * scale;
  const h = vh * scale;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);
    for (let x = 0; x < w; x++) {
      const i = ((vy + ((y / scale) | 0)) * W + vx + ((x / scale) | 0)) * 4;
      raw[row + 1 + x * 3] = rgba[i];
      raw[row + 2 + x * 3] = rgba[i + 1];
      raw[row + 3 + x * 3] = rgba[i + 2];
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(w, 0);
  head.writeUInt32BE(h, 4);
  head[8] = 8; // bit depth
  head[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const art = new URL('../site/art/', import.meta.url);
const frame = paintFrame(paintBackdrop(), {});
writeFileSync(new URL('lock.png', art), png(frame, [0, 0, W, H], 1));
// 1200x630 link preview, cropped around the lock and the keeper's window.
writeFileSync(new URL('share.png', art), png(frame, [20, 45, 600, 315], 2));
console.log('wrote site/art/lock.png and site/art/share.png');
