// The hero painting: a canal lock at night, drawn pixel by pixel.
// Nine boats are the nine tools. The gates stay shut until the person copies
// the prompt. Pure functions over an RGBA buffer, so the browser and
// scripts/render-poster.mjs draw exactly the same picture.

export const W = 640;
export const H = 360;

const WATER = 296; // surface of the lower pool

// ------------------------------------------------------------------ helpers --
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, s) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const fbm = (x, y, s, o = 4) => {
  let sum = 0;
  let amp = 0.5;
  for (let i = 0; i < o; i++) {
    sum += noise(x, y, s + i * 17) * amp;
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return sum / (1 - 0.5 ** o);
};

function painter(buf) {
  const px = (x, y, c, a = 1) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    if (a >= 1) {
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
    } else {
      buf[i] += (c[0] - buf[i]) * a;
      buf[i + 1] += (c[1] - buf[i + 1]) * a;
      buf[i + 2] += (c[2] - buf[i + 2]) * a;
    }
    buf[i + 3] = 255;
  };
  const rect = (x, y, w, h, c, a) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c, a);
  };
  const line = (x0, y0, x1, y1, c, t = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let k = 0; k <= n; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / (n || 1));
      const y = Math.round(y0 + ((y1 - y0) * k) / (n || 1));
      rect(x, y, t, t, c);
    }
  };
  // A dithered pool of light, stronger at the centre.
  const light = (cx, cy, r, c, strength) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const d = Math.hypot(x - cx, (y - cy) * 1.25) / r;
        if (d >= 1) continue;
        const f = (1 - d) ** 2;
        const step = Math.floor(f * 4 + dither(x, y)) / 4;
        if (step > 0) px(x, y, c, Math.min(0.85, step * strength));
      }
    }
  };
  return { px, rect, line, light };
}

// ----------------------------------------------------------------- scenery ---
function sky(p) {
  const stops = ['#070b19', '#0a1124', '#0e1931', '#142342', '#1c3056', '#27406b', '#335079'].map(rgb);
  for (let y = 0; y < 262; y++) {
    const t = (y / 262) ** 1.15 * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < W; x++) p.px(x, y, f > dither(x, y) ? stops[i + 1] : stops[i]);
  }
  const r = rng(11);
  for (let n = 0; n < 230; n++) {
    const x = (r() * W) | 0;
    const y = (r() ** 1.4 * 180) | 0;
    const b = r();
    p.px(x, y, rgb(b > 0.9 ? '#e6eeff' : b > 0.6 ? '#8fa6d6' : '#4c639a'));
    if (b > 0.975) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + dx, y + dy, rgb('#5973ac'));
    }
  }
}

function clouds(p) {
  const body = rgb('#1b2d55');
  const lit = rgb('#304a7c');
  const rim = rgb('#486599');
  // Banks of cloud: centre x, centre y, half width, half height, seed.
  const banks = [
    [70, 150, 150, 38, 3],
    [190, 118, 120, 18, 9],
    [30, 62, 90, 16, 23],
    [470, 176, 120, 22, 31],
    [560, 96, 80, 14, 41],
  ];
  for (const [cx, cy, rw, rh, s] of banks) {
    const density = (x, y) => {
      const dx = (x - cx) / rw;
      const dy = (y - cy) / rh;
      const fall = 1 - (dx * dx + dy * dy * (dy > 0 ? 2.6 : 1));
      return fall + (fbm(x / 26, y / 13, s, 5) - 0.55) * 1.9;
    };
    for (let y = cy - rh * 2; y < cy + rh * 2; y++) {
      for (let x = cx - rw - 20; x < cx + rw + 20; x++) {
        const d = density(x, y);
        if (d < 0.18) continue;
        if (d < 0.36 && (d - 0.18) / 0.18 < dither(x, y)) continue;
        let c = body;
        if (density(x, y - 3) < 0.3) c = rim;
        else if (density(x - 3, y - 9) < 0.42 + dither(x, y) * 0.18) c = lit;
        p.px(x, y, c);
      }
    }
  }
}

function ridge(p, { top, amp, seed, scale, colors, haze, base = 270 }) {
  const [shade, body, lit] = colors.map(rgb);
  const hz = rgb(haze);
  const at = (x) => top(x) + (fbm(x / scale, 0.5, seed, 5) - 0.5) * amp;
  for (let x = 0; x < W; x++) {
    const h = at(x) | 0;
    for (let y = h; y < base; y++) {
      const n = fbm((x + y * 0.7) / 9, y / 17, seed + 5, 3);
      let c = n > 0.58 ? lit : n < 0.42 ? shade : body;
      if (y - h < 2 && at(x - 3) > h) c = lit;
      const mist = (y - (base - 34)) / 34;
      if (mist > dither(x, y)) c = hz;
      p.px(x, y, c);
    }
  }
  return at;
}

// A clump of leaves: a noisy disc, lit from the upper left.
function clump(p, cx, cy, r, pal, seed) {
  const [dark, mid, lite, tip] = pal;
  for (let y = -r - 2; y <= r + 2; y++) {
    for (let x = -r - 2; x <= r + 2; x++) {
      const n = noise((cx + x) / 2.3, (cy + y) / 2.3, seed);
      const d = Math.hypot(x, y * 1.2) / r + (n - 0.5) * 0.9;
      if (d > 1) continue;
      const side = (-x * 0.55 - y) / r + (noise((cx + x) / 1.6, (cy + y) / 1.6, seed + 1) - 0.5) * 1.5;
      const c = side > 0.95 ? tip : side > 0.45 ? lite : side > -0.15 ? mid : dark;
      p.px(cx + x, cy + y, c);
    }
  }
}

function woods(p, ridgeAt, { from, to, step, size, pal, seed, drop = 40 }) {
  const r = rng(seed);
  const colors = pal.map(rgb);
  for (let row = 0; row < 4; row++) {
    for (let x = from; x < to; x += step) {
      const jx = x + ((r() - 0.5) * step) | 0;
      const y = (ridgeAt(jx) + row * (drop / 4) + r() * 5) | 0;
      if (y > 266) continue;
      clump(p, jx, y + 2, (size * (0.7 + r() * 0.7)) | 0, colors, seed + row);
    }
  }
}

function cypress(p, x, base, h, w) {
  const [d, m, l] = ['#0b1c22', '#12292c', '#1e3f3a'].map(rgb);
  for (let j = 0; j < h; j++) {
    const t = j / h;
    const half = Math.max(0, Math.round(w * Math.sin(Math.min(1, t * 1.15) * 2.2) ** 0.8 + (hash(x, j, 4) - 0.5) * 2));
    for (let i = -half; i <= half; i++) {
      const v = -i / (half + 1) + (hash(x + i, j, 8) - 0.5);
      p.px(x + i, base - h + j, v > 0.4 ? l : v > -0.3 ? m : d);
    }
  }
}

function bank(p) {
  // Grass shelf, then a stone retaining wall down to the water.
  const grass = ['#15302b', '#1d3f33', '#2b5640'].map(rgb);
  for (let x = 0; x < W; x++) {
    const top = (262 + (fbm(x / 30, 2, 51) - 0.5) * 8) | 0;
    for (let y = top; y < 274; y++) {
      const n = hash(x, y, 6);
      p.px(x, y, y === top ? grass[2] : n > 0.72 ? grass[2] : n > 0.3 ? grass[1] : grass[0]);
    }
    if (hash(x, 1, 52) > 0.8) p.rect(x, top - 2, 1, 2, grass[2]);
  }
  const mortar = rgb('#0e1422');
  const stones = ['#252f46', '#2d3852', '#37435f', '#222b40'].map(rgb);
  const cap = rgb('#5a6785');
  for (let y = 274; y < WATER + 2; y++) {
    const row = ((y - 274) / 6) | 0;
    for (let x = 0; x < W; x++) {
      const bx = x + row * 7;
      const stone = (bx / 15) | 0;
      let c = stones[(hash(stone, row, 61) * 4) | 0];
      if ((y - 274) % 6 === 5 || bx % 15 === 0) c = mortar;
      else if ((y - 274) % 6 === 0) c = stones[2];
      if (y < 276) c = y === 274 ? cap : stones[2];
      if (y > WATER - 4 && hash(x, y, 63) > 0.45) c = rgb('#17302f');
      p.px(x, y, c);
    }
  }
}

function bankDetail(p) {
  const shrub = ['#0f2427', '#163530', '#22493a', '#376247'].map(rgb);
  const r = rng(77);
  const groups = [[6, 7], [34, 5], [96, 4], [150, 6], [168, 4], [232, 3], [300, 5], [318, 3], [566, 6], [586, 8], [612, 5], [420, 3]];
  for (const [gx, size] of groups) {
    for (let n = 0; n < size; n++) {
      clump(p, gx + (((r() - 0.5) * size * 4) | 0), 266 + ((r() * 4) | 0) - (size >> 1), 3 + ((r() * size * 0.7) | 0), shrub, 79);
    }
  }
  for (let x = 4; x < W; x += 3) {
    if (noise(x / 17, 3, 78) < 0.56) continue;
    const len = 2 + ((hash(x, 5, 78) * 13 * noise(x / 9, 7, 78)) | 0);
    for (let j = 0; j < len; j++) {
      if (hash(x, j, 79) > 0.25) p.rect(x + (hash(x, j, 80) > 0.6 ? 1 : 0), 275 + j, 2, 1, shrub[hash(x, j, 81) > 0.7 ? 3 : 1]);
    }
  }
  for (const x of [40, 124, 210, 296]) {
    p.rect(x, 266, 4, 9, rgb('#161d30'));
    p.rect(x - 1, 265, 6, 2, rgb('#5a6785'));
  }
  // The towpath from the cottage door down to the lock.
  for (let x = 436; x < 524; x++) {
    const y = 266 + (((x - 436) / 40) | 0);
    for (let j = 0; j < 5; j++) if (hash(x, j, 82) > 0.2) p.px(x, y + j, rgb(j === 0 ? '#5f6378' : '#41465d'));
  }
}

function cottage(p) {
  const x = 468;
  const base = 264;
  const wall = ['#3a415b', '#4a526f', '#596181'].map(rgb);
  // walls
  for (let y = base - 38; y < base; y++) {
    for (let i = x; i < x + 66; i++) {
      const n = hash((i / 3) | 0, (y / 2) | 0, 71);
      p.px(i, y, i > x + 50 ? wall[0] : n > 0.8 ? wall[2] : n > 0.2 ? wall[1] : wall[0]);
    }
  }
  // roof
  const roof = ['#5d2c33', '#7c3a38', '#9b4b3d'].map(rgb);
  for (let j = 0; j < 24; j++) {
    const inset = Math.max(0, 22 - j);
    for (let i = x - 6 + inset; i < x + 72 - inset; i++) {
      const tile = (j % 4 === 3 || (i + (((j / 4) | 0) % 2) * 3) % 6 === 0) ? 0 : i < x + 34 ? 2 : 1;
      p.px(i, base - 62 + j, roof[tile]);
    }
  }
  p.rect(x - 6, base - 38, 78, 2, rgb('#301a26'));
  // chimney
  p.rect(x + 48, base - 70, 8, 16, rgb('#454c68'));
  p.rect(x + 47, base - 72, 10, 3, rgb('#646d8c'));
  // door
  p.rect(x + 40, base - 20, 11, 20, rgb('#221c2c'));
  p.rect(x + 41, base - 19, 9, 19, rgb('#4a3236'));
  p.px(x + 48, base - 10, rgb('#c8954a'));
  // the dark window
  p.rect(x + 53, base - 29, 8, 9, rgb('#1b2036'));
  p.rect(x + 56, base - 29, 1, 9, rgb('#5a6180'));
}

function bigTree(p) {
  const trunk = ['#0c1119', '#161b25', '#262b34'].map(rgb);
  const limb = (x0, y0, x1, y1, t0, t1) => {
    const n = 90;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      const x = x0 + (x1 - x0) * u + Math.sin(u * 5 + x0) * 3;
      const y = y0 + (y1 - y0) * u;
      const t = Math.max(1, Math.round(t0 + (t1 - t0) * u));
      p.rect(Math.round(x - t / 2), Math.round(y), t, 3, trunk[1]);
      p.rect(Math.round(x - t / 2), Math.round(y), 1, 3, trunk[2]);
      p.rect(Math.round(x + t / 2 - 2), Math.round(y), 2, 3, trunk[0]);
    }
  };
  limb(626, 300, 610, 130, 17, 9);
  limb(612, 150, 566, 78, 7, 3);
  limb(616, 190, 580, 160, 5, 2);
  limb(610, 132, 628, 36, 8, 3);
  limb(590, 108, 536, 104, 4, 1);
  const pal = ['#08171a', '#102a27', '#1c4235', '#356248'].map(rgb);
  const r = rng(97);
  const crowns = [
    [622, 22, 46], [572, 18, 34], [526, 8, 22], [490, 2, 14],
    [590, 62, 30], [540, 56, 16], [634, 82, 34], [560, 96, 18],
    [528, 104, 12], [600, 128, 18], [638, 150, 24], [574, 158, 14], [632, 205, 18],
  ];
  for (const [cx, cy, spread] of crowns) {
    const count = ((spread * spread) / 38) | 0;
    for (let n = 0; n < count; n++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * spread;
      clump(p, (cx + Math.cos(a) * d) | 0, (cy + Math.sin(a) * d * 0.66) | 0, 3 + ((r() * 5) | 0), pal, 101);
    }
  }
}

/** Everything that never moves. Draw once and reuse. */
export function paintBackdrop() {
  const buf = new Uint8ClampedArray(W * H * 4);
  const p = painter(buf);
  sky(p);
  clouds(p);
  ridge(p, {
    top: (x) => 214 - 34 * Math.exp(-(((x - 96) / 70) ** 2)) - 52 * Math.exp(-(((x - 566) / 84) ** 2)),
    amp: 40, seed: 5, scale: 52, colors: ['#1c2f55', '#233a65', '#2d4776'], haze: '#304c79',
  });
  const mid = ridge(p, {
    top: (x) => 236 - 22 * Math.exp(-(((x - 40) / 90) ** 2)) - 30 * Math.exp(-(((x - 600) / 100) ** 2)),
    amp: 24, seed: 15, scale: 44, colors: ['#122441', '#182d4b', '#213a58'], haze: '#223a5c',
  });
  woods(p, mid, { from: 0, to: 250, step: 7, size: 4, seed: 19, drop: 22, pal: ['#10213a', '#152a42', '#1c374c', '#264656'] });
  woods(p, mid, { from: 372, to: W, step: 7, size: 4, seed: 29, drop: 22, pal: ['#10213a', '#152a42', '#1c374c', '#264656'] });
  const near = (x) => 252 - 26 * Math.exp(-(((x - 8) / 80) ** 2)) - 42 * Math.exp(-(((x - 604) / 66) ** 2)) + Math.sin(x / 23) * 3;
  woods(p, near, { from: -4, to: 208, step: 9, size: 6, seed: 37, drop: 26, pal: ['#0b1a28', '#102632', '#17353c', '#244a47'] });
  woods(p, near, { from: 540, to: W + 8, step: 9, size: 7, seed: 43, drop: 34, pal: ['#0b1a28', '#102632', '#17353c', '#244a47'] });
  cypress(p, 452, 266, 56, 6);
  cypress(p, 440, 266, 38, 4);
  cypress(p, 546, 266, 64, 6);
  cypress(p, 559, 266, 44, 5);
  cottage(p);
  bank(p);
  bankDetail(p);
  return buf;
}

// -------------------------------------------------------------------- lock ---
const GATE = { left: 340, mid: 388, right: 436, top: 258, bottom: WATER + 3 };

function gates(p, open) {
  const { left, mid, right, top, bottom } = GATE;
  const e = open * open * (3 - 2 * open);
  // The chamber behind the doors: dark water with the lamp light on it.
  p.rect(left, top + 4, right - left, bottom - top - 4, rgb('#080e1c'));
  for (let y = top + 22; y < bottom; y += 3) {
    for (let x = left + 4; x < right - 4; x++) {
      if (hash((x / 5) | 0, y, 83) > 0.62) p.px(x, y, rgb(Math.abs(x - mid) < 14 ? '#8a5a3c' : '#1d3157'), 0.3 + e * 0.7);
    }
  }
  // Stone piers either side.
  for (const px of [left - 9, right]) {
    p.rect(px, top - 4, 9, bottom - top + 4, rgb('#333e5a'));
    p.rect(px, top - 4, 2, bottom - top + 4, rgb('#4c5a7b'));
    p.rect(px - 1, top - 6, 11, 3, rgb('#6a7798'));
    for (let y = top + 3; y < bottom; y += 7) p.rect(px, y, 9, 1, rgb('#151c2d'));
  }
  const wood = ['#241a20', '#3d2a28', '#53392e', '#6d4c37'].map(rgb);
  const width = Math.round((mid - left) * (1 - 0.82 * e));
  for (const dir of [1, -1]) {
    const hinge = dir === 1 ? left : right - 1;
    for (let i = 0; i < width; i++) {
      const x = hinge + i * dir;
      const u = i / Math.max(1, width - 1);
      // Mitre gates meet in a shallow V, higher at the middle.
      const y0 = Math.round(top + 6 - 6 * u * (1 - e));
      const plank = i % 8;
      for (let y = y0; y < bottom; y++) {
        let c = plank === 0 ? wood[0] : plank === 1 ? wood[3] : dir === 1 ? wood[2] : wood[1];
        if (hash(x, (y / 3) | 0, 85) > 0.86) c = wood[1];
        if (y > bottom - 9 && hash(x, y, 86) > 0.5) c = rgb('#1b2b2a');
        p.px(x, y, c);
      }
      p.rect(x, y0, 1, 3, rgb('#8a6544'));
      p.px(x, y0 + 12, rgb('#121521'));
      p.px(x, y0 + 13, rgb('#4b5266'));
      p.px(x, y0 + 28, rgb('#121521'));
      p.px(x, y0 + 29, rgb('#4b5266'));
    }
    p.rect(hinge + (width - 1) * dir, top + 1, 1, bottom - top - 1, wood[0]);
    // Balance beam: the long timber a lock keeper leans on, tipped white.
    const bx = hinge - dir * Math.round(44 - 20 * e);
    const by = top - 8 + Math.round(5 * e);
    const ix = hinge + dir * Math.round(26 * (1 - e) + 3);
    const iy = top + 1 - Math.round(7 * e);
    p.line(bx, by, ix, iy - 1, rgb('#5a3f33'), 4);
    p.line(bx, by, ix, iy - 1, rgb('#8a6544'), 1);
    const tx = bx + dir * 11;
    const ty = by + Math.round(((iy - 1 - by) * 11) / Math.max(1, Math.abs(ix - bx)));
    p.line(bx, by, tx, ty, rgb('#cfd6e6'), 4);
  }
  // A thread of water escaping through the seam while the gates are shut.
  if (e < 0.5) {
    for (let y = top + 24; y < bottom; y++) {
      if (hash(0, y, 87) > 0.35) p.px(mid - (hash(1, y, 87) > 0.5 ? 1 : 0), y, rgb('#a9c4ee'), 0.8 - e);
    }
    for (let n = 0; n < 22; n++) p.px(mid - 9 + ((hash(n, 2, 88) * 18) | 0), bottom - 1 - ((hash(n, 3, 88) * 3) | 0), rgb('#bcd2f4'), 0.7);
  }
  // Railing across the walkway above the doors.
  if (e < 0.15) {
    for (let x = left; x <= right; x += 12) p.rect(x, top - 11, 1, 9, rgb('#10172a'));
    p.rect(left, top - 11, right - left, 1, rgb('#8793b0'));
  }
}

function lamps(p, window_, post) {
  const amber = rgb('#ff9a3c');
  // The keeper's window: the one light that is always on.
  const x = 477;
  const y = 235;
  p.light(x + 8, y + 7, 30 + Math.round(window_ * 16), amber, 0.34 + window_ * 0.3);
  p.rect(x - 1, y - 1, 18, 16, rgb('#2a1a1c'));
  p.rect(x, y, 16, 14, rgb('#ffb04a'));
  p.rect(x, y, 16, 5, rgb('#ffd27c'));
  p.rect(x + 7, y, 2, 14, rgb('#5a2f22'));
  p.rect(x, y + 6, 16, 1, rgb('#5a2f22'));
  p.rect(x - 2, y + 15, 20, 2, rgb('#737d9c'));
  // The lamp post beside the lock lights when the gates open.
  p.rect(450, 244, 2, 30, rgb('#0e1424'));
  p.rect(447, 239, 8, 7, rgb('#1a2134'));
  if (post > 0.05) {
    p.light(451, 242, 24, amber, 0.55 * post);
    p.rect(449, 241, 4, 4, rgb('#ffd27c'), post);
  } else {
    p.rect(449, 241, 4, 4, rgb('#4a4350'));
  }
}

// ------------------------------------------------------------------- boats ---
// x is the stern, y the waterline, len the hull length. Order is the queue.
export const BOATS = [
  { x: 282, y: 312, len: 46, hull: '#9c464c' },
  { x: 222, y: 320, len: 50, hull: '#357775' },
  { x: 168, y: 308, len: 42, hull: '#aa7238' },
  { x: 108, y: 319, len: 50, hull: '#4f629b' },
  { x: 52, y: 309, len: 44, hull: '#728648' },
  { x: 262, y: 344, len: 62, hull: '#b57c3e' },
  { x: 184, y: 336, len: 56, hull: '#7e578b' },
  { x: 90, y: 347, len: 64, hull: '#438592' },
  { x: 14, y: 333, len: 54, hull: '#a25240' },
];

const lanternOf = (b) => ({ x: b.x + b.len - 9, y: b.y - Math.round(b.len * 0.44) });

function boat(p, b, lit, picked) {
  const { x, y, len } = b;
  const h = Math.max(6, Math.round(len * 0.15));
  const hull = rgb(b.hull);
  const dim = hull.map((v) => (v * 0.55) | 0);
  // Hull: rounded stern on the left, a pointed bow lifting toward the gate.
  for (let i = 0; i < len; i++) {
    const bow = Math.max(0, i - (len - h * 2)) / (h * 2);
    const stern = Math.max(0, 4 - i);
    const deck = y - h - Math.round(bow * bow * 4) + (stern > 2 ? 1 : 0);
    const keel = y - Math.round(bow * bow * (h + 2)) - (stern >> 1);
    for (let j = deck; j < keel; j++) {
      p.px(x + i, j, j === deck ? rgb('#c6cde0') : j - deck < h * 0.55 ? hull : dim);
    }
  }
  p.rect(x + 2, y - 1, len - h, 1, rgb('#05080f'), 0.7);
  const cw = Math.round(len * 0.58);
  const ch = Math.max(5, Math.round(len * 0.13));
  const cx = x + Math.round(len * 0.12);
  p.rect(cx, y - h - ch, cw, ch, rgb('#222c47'));
  p.rect(cx, y - h - ch, 2, ch, rgb('#38456a'));
  p.rect(cx - 1, y - h - ch - 2, cw + 2, 2, rgb('#7983a3'));
  p.rect(cx + 4, y - h - ch - 4, 2, 2, rgb('#3c4663'));
  for (let i = 4; i < cw - 4; i += 7) {
    p.rect(cx + i, y - h - ch + 1, 3, ch - 2, rgb(lit > 0.5 ? '#c98345' : '#10172a'));
  }
  // Tiller at the stern.
  p.rect(x + 1, y - h - 5, 1, 5, rgb('#8a6544'));
  p.rect(x + 1, y - h - 5, 4, 1, rgb('#8a6544'));
  const l = lanternOf(b);
  p.rect(l.x + 1, l.y + 2, 1, y - h - l.y - 2, rgb('#0c1221'));
  if (lit > 0.02) p.light(l.x + 1, l.y, Math.round((picked ? 28 : 12) * lit) + 2, rgb('#ff9a3c'), picked ? 0.8 : 0.5);
  p.rect(l.x, l.y - 2, 3, 1, rgb('#0c1221'));
  p.rect(l.x, l.y - 1, 3, 3, rgb(lit > 0.5 ? '#ffd27c' : '#55485a'));
  if (picked) {
    // A small pointer over the chosen boat.
    const ty = l.y - 15;
    const mx = x + (len >> 1);
    for (let j = 0; j < 5; j++) p.rect(mx - 4 + j, ty + j, 9 - j * 2, 1, rgb('#ffd27c'));
  }
}

// ------------------------------------------------------------------- water ---
function water(p, buf, phase) {
  const deep = rgb('#0a1328');
  const src = buf.slice(0, W * (WATER + 3) * 4);
  for (let y = WATER + 3; y < H; y++) {
    const d = y - WATER - 3;
    const sway = Math.round(Math.sin(d * 0.9 + phase) * (0.6 + d * 0.035) + (noise(d / 3, phase * 0.4, 91) - 0.5) * 4);
    const from = Math.max(0, WATER + 2 - Math.round(d * 1.45));
    for (let x = 0; x < W; x++) {
      const sx = Math.min(W - 1, Math.max(0, x + sway));
      const i = (from * W + sx) * 4;
      const keep = Math.max(0.12, 0.66 - d * 0.009);
      p.px(x, y, [
        deep[0] + (src[i] - deep[0]) * keep,
        deep[1] + (src[i + 1] - deep[1]) * keep,
        deep[2] + (src[i + 2] - deep[2]) * keep,
      ]);
    }
    if (d % 4 === 1) {
      for (let x = 0; x < W; x++) {
        if (noise((x + sway * 2) / 11, d * 1.7, 93) > 0.74) p.px(x, y, rgb('#3a5a8c'), 0.55);
      }
    }
  }
}

function glint(p, x, y, strength, width, phase) {
  for (let d = 2; d < 34 && y + d < H; d += 2) {
    const w = Math.max(1, Math.round(width * (1 - d / 40) * (0.4 + hash(x, d, 95))));
    const off = Math.round(Math.sin(d * 0.8 + phase) * 2);
    p.rect(x - (w >> 1) + off, y + d, w, 1, rgb('#ffa64d'), strength * (1 - d / 36));
  }
}

function foreground(p) {
  const r = rng(131);
  for (let n = 0; n < 150; n++) {
    const left = n < 80;
    const x = left ? (r() ** 1.6 * 70) | 0 : 590 + ((r() * 52) | 0);
    const h = 5 + ((r() * (left ? 22 - x / 5 : 20)) | 0);
    const lean = ((r() - 0.5) * 7) | 0;
    p.line(x, H, x + lean, H - Math.max(3, h), rgb(r() > 0.7 ? '#1d4035' : '#071418'));
  }
}

/**
 * Compose one frame.
 * state.open   0..1  how far the gates have swung
 * state.lit    nine values 0..1, one per boat lantern
 * state.window 0..1  extra glow in the keeper's window
 * state.picked boat index, or -1
 */
export function paintFrame(backdrop, state, out) {
  const buf = out || new Uint8ClampedArray(W * H * 4);
  buf.set(backdrop);
  const p = painter(buf);
  const { open = 0, lit = BOATS.map(() => 1), window: win = 0, picked = -1, phase = 0 } = state;
  lamps(p, win, open);
  gates(p, open);
  bigTree(p);
  water(p, buf, phase);
  glint(p, 485, WATER + 2, 0.55 + win * 0.35, 18, phase);
  if (open > 0.05) glint(p, 451, WATER + 2, 0.5 * open, 7, phase);
  // Far boats first so near ones overlap them.
  BOATS.map((b, i) => [b, i])
    .sort((a, b) => a[0].y - b[0].y)
    .forEach(([b, i]) => {
      boat(p, b, lit[i], picked === i);
      const l = lanternOf(b);
      if (lit[i] > 0.05) glint(p, l.x + 1, b.y, (picked === i ? 0.85 : 0.45) * lit[i], picked === i ? 12 : 6, phase);
    });
  foreground(p);
  return buf;
}
