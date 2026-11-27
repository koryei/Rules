import { BOATS, W, H, paintBackdrop, paintFrame } from './scene.js';

document.documentElement.classList.add('js');

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const still = matchMedia('(prefers-reduced-motion: reduce)');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

// ------------------------------------------------------------------ painting --
const scene = (() => {
  const canvas = $('#lock');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return { open() {}, pick() {} };

  const backdrop = paintBackdrop();
  const image = ctx.createImageData(W, H);
  const state = { open: 0, window: 0, picked: -1, phase: 0, lit: BOATS.map(() => 0.25) };
  const tweens = new Map();
  let frame = 0;
  let last = 0;

  const draw = () => {
    paintFrame(backdrop, state, image.data);
    ctx.putImageData(image, 0, 0);
  };

  // Redraws about 18 times a second, only while something is changing.
  const tick = (now) => {
    frame = 0;
    if (now - last >= 55) {
      last = now;
      for (const [key, t] of tweens) {
        const k = Math.min(1, Math.max(0, (now - t.start) / t.length));
        t.apply(t.from + (t.to - t.from) * k);
        if (k === 1) tweens.delete(key);
      }
      if (tweens.has('open')) state.phase += 0.7;
      draw();
    }
    if (tweens.size) frame = requestAnimationFrame(tick);
  };

  const tween = (key, from, to, length, apply, delay = 0) => {
    if (still.matches) {
      tweens.delete(key);
      apply(to);
      draw();
      return;
    }
    tweens.set(key, { from, to, length, apply, start: performance.now() + delay });
    if (!frame) frame = requestAnimationFrame(tick);
  };

  draw();
  // One entrance: the lanterns come on, nearest the gate first.
  BOATS.forEach((_, i) => {
    tween(`lit${i}`, 0.25, 1, 260, (v) => { state.lit[i] = v; }, 250 + i * 110);
  });

  let closing = 0;
  return {
    // The person has approved: the gates swing open, then settle shut again.
    open() {
      clearTimeout(closing);
      tween('open', state.open, 1, 1100, (v) => { state.open = v; });
      tween('window', state.window, 1, 300, (v) => { state.window = v; });
      closing = setTimeout(() => {
        tween('open', state.open, 0, 1300, (v) => { state.open = v; });
        tween('window', state.window, 0, 1300, (v) => { state.window = v; });
      }, 5200);
    },
    pick(i) {
      state.picked = i;
      draw();
    },
  };
})();

// ---------------------------------------------------------------------- tabs --
for (const list of $$('[data-tabs]')) {
  const tabs = $$('[role="tab"]', list);
  const select = (tab, focus) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.toggleAttribute('data-hidden', !on);
      panel.inert = !on;
    }
    if (focus) tab.focus();
  };
  list.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });
  select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
}

// ---------------------------------------------------------------------- copy --
const source = $('#prompt-text');
const statuses = $$('[data-status]').map((el) => ({ el, idle: el.textContent }));
let restore = 0;

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

function say(button, message) {
  // Answer next to the button that was used; the hero speaks for the rest.
  const near = button?.closest('.actions')?.querySelector('[data-status]');
  const target = statuses.find((s) => s.el === near) || statuses[0];
  target.el.textContent = message;
  target.el.classList.add('is-live');
  return target;
}

async function copyPrompt(button) {
  clearTimeout(restore);
  const ok = await writeClipboard(source.textContent.trim());
  button?.focus({ preventScroll: true });

  if (!ok) {
    $('#tab-prompt').click();
    say(button, 'Couldn’t reach the clipboard. The prompt is selected, so press ⌘C or Ctrl+C');
    $('#prompt').scrollIntoView({ block: 'start' });
    source.focus({ preventScroll: true });
    getSelection().selectAllChildren(source);
    return;
  }

  const buttons = $$('[data-copy]');
  buttons.forEach((b) => b.classList.add('is-copied'));
  const spoken = say(button, 'Copied. Paste it into your agent and press Enter');
  scene.open();

  restore = setTimeout(() => {
    buttons.forEach((b) => b.classList.remove('is-copied'));
    spoken.el.textContent = spoken.idle;
    spoken.el.classList.remove('is-live');
  }, 6000);
}

for (const button of $$('[data-copy]')) {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    copyPrompt(button);
  });
}

// ------------------------------------------------------------------ shortcut --
const toggle = $('#shortcut');
const applyShortcut = () => {
  document.documentElement.classList.toggle('shortcut-off', !toggle.checked);
  const hero = $('#hero-copy');
  if (toggle.checked) hero.setAttribute('aria-keyshortcuts', 'c');
  else hero.removeAttribute('aria-keyshortcuts');
};
toggle.checked = store.get('agent-rules:shortcut') !== 'off';
applyShortcut();
toggle.addEventListener('change', () => {
  store.set('agent-rules:shortcut', toggle.checked ? 'on' : 'off');
  applyShortcut();
});

addEventListener('keydown', (e) => {
  if (!toggle.checked || e.key.toLowerCase() !== 'c') return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return;
  if (e.target.closest?.('input:not([type="checkbox"]), textarea, select, [contenteditable]')) return;
  e.preventDefault();
  const hero = $('#hero-copy');
  const visible = hero.getBoundingClientRect().bottom > 0;
  copyPrompt(visible ? hero : $('.top-copy'));
});

// --------------------------------------------------------------------- fleet --
const reads = $('[data-reads]');
const idleReads = reads.innerHTML;
const tools = $$('[data-boat]');

for (const tool of tools) {
  tool.addEventListener('click', () => {
    const on = tool.getAttribute('aria-pressed') !== 'true';
    tools.forEach((t) => t.setAttribute('aria-pressed', String(on && t === tool)));
    scene.pick(on ? Number(tool.dataset.boat) : -1);
    if (!on) {
      reads.innerHTML = idleReads;
      return;
    }
    const code = document.createElement('code');
    code.textContent = tool.dataset.path;
    const name = tool.textContent.trim();
    if (tool.dataset.how === 'imports') reads.replaceChildren(`${name} reads your file through one import line in `, code);
    else reads.replaceChildren(`${name} reads `, code, ', which links to your file');
  });
}

// -------------------------------------------------------------------- header --
new IntersectionObserver(([entry]) => {
  $('.top').classList.toggle('is-scrolled', !entry.isIntersecting && entry.boundingClientRect.top < 100);
}, { rootMargin: '-76px 0px 0px 0px' }).observe($('#hero-copy'));
