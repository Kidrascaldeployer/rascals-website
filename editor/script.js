const META_TEMPLATE   = 'metadata/{id}.json';
const IMG_BASE        = 'assets/layers';
const PIXELATED_BASE  = 'assets/LAYERS PIXELATED';
const CUSTOM_BG_BASE  = 'assets/costumbackgrounds';
const SHADOW_CLOAK_BASE = 'assets/SHADOW CLOAK';
const SHADOW_CLOAK_FILE = 'SHADOW CLOAK.png';

/* ---------- formats ---------- */
const FORMATS = {
  square:     { key:'square',     name:'Square',      w:1080, h:1080, defaultBg:'square1.png', fileSuffix:'square'     },
  phonesaver: { key:'phonesaver', name:'Phone Saver', w:1080, h:2340, defaultBg:'phone1.png',  fileSuffix:'phonesaver' },
  raid:       { key:'raid',       name:'Raid',        w:1600, h:900,  defaultBg:'raid1.png',   fileSuffix:'raid'       }
};

const FORMAT_BASELINE = {
  square:     { scale: 0.85, offsetX: 0,  offsetY: 0 },
  phonesaver: { scale: 0.50, offsetX: 0,  offsetY: 0 },
  raid:       { scale: 0.55, offsetX: 0,  offsetY: 0 }
};

const LOCK_SCALE_FORMATS = new Set(['phonesaver']);

/* ---------- IMPORTANT ----------
   Keep ORIGINAL editor metadata keys,
   but map them to your NEW folder names.
--------------------------------- */
const LAYER_ORDER = [
  { key:'BACKGROUND', folder:'Background' },
  { key:'BODY',       folder:'BODY' },
  { key:'CLOTHING',   folder:'CLOTHING' },
  { key:'MOUTHS',     folder:'MOUTHS RASCALS' },
  { key:'EXTRA',      folder:'EXTRA' },
  { key:'HEADSTUFF',  folder:'HEADGEAR' },
  { key:'ONE OF ONE', folder:'ONE OF ONE' },
];

const AFFECTED_LAYERS = ['BODY','CLOTHING','MOUTHS','EXTRA','HEADSTUFF','ONE OF ONE'];

/* ---------- custom BG list ---------- */
const CUSTOM_BG = {
  square: [
    {label:'Rascals on Apechain', file:'square1.png'},
    {label:'Apechain Rascals',    file:'square2.png'},
    {label:'Want to play a game', file:'square3.png'},
    {label:'To the moon',         file:'square4.png'},
    {label:'RocSol Background',   file:'square5.png'},
    {label:'Paradise Pixel',      file:'square6.png'},
    {label:'Moon Pixel',          file:'square7.png'},
 ],
  phonesaver: [
    {label:'Color Brown/White',   file:'phone1.png'},
    {label:'Color Dark/Yellow',   file:'phone2.png'},
    {label:'Color Dark/Orange',   file:'phone3.png'},
    {label:'Color Blue/White',    file:'phone4.png'}
  ],
  raid: [
    {label:'WELCOME TO THE APECHAIN', file:'raid1.png'},
    {label:'JOIN THE RASCALS',        file:'raid2.png'},
    {label:'GET YOUR GRAILS NOW',     file:'raid3.png'},
    {label:'YOU AINT SEEN NOTHING YET', file:'raid4.png'},
    {label:'BUY HOLD BELIEVE',        file:'raid5.png'},
    {label:'UNITED AS ONE',           file:'raid6.png'}
  ]
};

/* ---------- helpers ---------- */
const $  = id => document.getElementById(id);
const els = (q, root = document) => Array.from(root.querySelectorAll(q));

function expandTemplate(str, id) {
  return str.replaceAll('{id}', String(id));
}

function attributesToRecord(attrs) {
  const r = {};
  for (const a of attrs || []) r[a.trait_type] = a.value;
  return r;
}

function clampToken(n) {
  return Math.min(3333, Math.max(1, Number(n) || 1));
}

async function loadJson(url, { timeout = 10000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal }).catch(() => null);
  clearTimeout(t);

  if (!r || !r.ok) throw new Error(`HTTP ${r?.status || 'ERR'} loading ${url}`);

  const txt = await r.text();
  const noComments = txt
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  return JSON.parse(noComments);
}

const ImageCache = new Map();
function loadImg(src) {
  if (!src) return Promise.reject(new Error('Empty image src'));
  if (ImageCache.has(src)) return ImageCache.get(src);

  const p = new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Image not found: ' + src));
    i.src = src;
  });

  ImageCache.set(src, p);
  return p;
}

function valueToFile(_, value) {
  return String(value).trim();
}

function getCharacterBase() {
  if (State.shadowCloak) return IMG_BASE;
  return State.pixelated ? PIXELATED_BASE : IMG_BASE;
}

function buildCharacterSrc(folder, value) {
  return `${getCharacterBase()}/${folder}/${valueToFile(folder, value)}.png`;
}

function buildNormalSrc(folder, value) {
  return `${IMG_BASE}/${folder}/${valueToFile(folder, value)}.png`;
}

/* ---------- flexible metadata key lookup ---------- */
function getTraitValue(values, layerKey) {
  const aliases = {
    BACKGROUND: ['BACKGROUND', 'Background', 'background'],
    BODY: ['BODY', 'Body', 'body'],
    CLOTHING: ['CLOTHING', 'Clothing', 'clothing'],
    EXTRA: ['EXTRA', 'Extra', 'extra'],
    HEADSTUFF: ['HEADSTUFF', 'HEADGEAR', 'Headgear', 'headgear', 'HEAD', 'Head'],
    MOUTHS: ['MOUTHS', 'MOUTHS RASCALS', 'Mouths Rascals', 'mouths rascals', 'MOUTH', 'Mouth'],
    'ONE OF ONE': ['ONE OF ONE', 'ONE OF ONES', 'one of ones', 'One of Ones', '1/1', 'ONEOFONE']
  };

  const possible = aliases[layerKey] || [layerKey];

  for (const key of possible) {
    if (values?.[key] != null && values[key] !== '') {
      return values[key];
    }
  }

  return null;
}

/* ---------- history gallery ---------- */
const HISTORY_MAX = 6;

function updatePreviewRatio() {
  const box = $('outCanvasWrap');
  if (!box) return;

  box.classList.remove('preview-square', 'preview-phone', 'preview-raid');

  if (State.format === 'square') box.classList.add('preview-square');
  if (State.format === 'phonesaver') box.classList.add('preview-phone');
  if (State.format === 'raid') box.classList.add('preview-raid');
}

function setActiveTabUI(fmtKey) {
  els('#stageTabs .nav-tab').forEach(b => {
    const active = b.getAttribute('data-view') === fmtKey;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.body.setAttribute('data-fmt', fmtKey);
  updatePreviewRatio();
  populateCustomSelect();
  updateBgLabel();
}

function updateToggleStates() {
  const gmc = $('gmcupsToggle');
  const pixelToggle = $('pixelatedToggle');

  if (State.pixelated || State.shadowCloak) {
    State.gmCups = false;
    if (gmc) {
      gmc.checked = false;
      gmc.disabled = true;
    }
  } else if (gmc) {
    gmc.disabled = false;
    gmc.checked = !!State.gmCups;
  }

  if (State.shadowCloak) {
    State.pixelated = false;
    if (pixelToggle) {
      pixelToggle.checked = false;
      pixelToggle.disabled = true;
    }
  } else if (pixelToggle) {
    pixelToggle.disabled = false;
    pixelToggle.checked = !!State.pixelated;
  }
}

function syncControlsFromState() {
  const useCustomEl = $('useCustomBg');
  const noBgToggle  = $('noBgToggle');
  const gmc         = $('gmcupsToggle');
  const pixelToggle = $('pixelatedToggle');
  const shadowToggle = $('shadowCloakToggle');

  if (useCustomEl) useCustomEl.checked = (State.backgroundMode === 'custom');
  if (noBgToggle)  noBgToggle.checked  = (State.backgroundMode === 'none');
  if (shadowToggle) shadowToggle.checked = !!State.shadowCloak;

  updateToggleStates();

  if (pixelToggle) pixelToggle.checked = !!State.pixelated;
  if (gmc)         gmc.checked         = !!State.gmCups;

  if ($('tokenInputBelow')) $('tokenInputBelow').value = State.tokens[0] || 1;

  updateOutMeta();
  updateBgLabel();
}

function makeSnapshot() {
  return {
    img: $('mainCanvas').toDataURL('image/png'),
    token: State.tokens[0] || 1,
    format: State.format,
    backgroundMode: State.backgroundMode,
    selectedCustomForFmt: State.selectedCustom[State.format] || null,
    gmCups: State.gmCups,
    pixelated: State.pixelated,
    shadowCloak: State.shadowCloak
  };
}

function addToHistory(snapshot) {
  const gallery = $('historyGallery');
  if (!gallery || !snapshot?.img) return;

  const thumb = document.createElement('div');
  thumb.className = 'history-thumb';

  const imgEl = document.createElement('img');
  imgEl.src = snapshot.img;
  imgEl.alt = `#${snapshot.token} — ${snapshot.format}`;

  const labelEl = document.createElement('div');
  labelEl.className = 'history-label';
  labelEl.textContent = `${snapshot.format.charAt(0).toUpperCase() + snapshot.format.slice(1)} · #${snapshot.token}`;

  thumb.appendChild(imgEl);
  thumb.appendChild(labelEl);

  thumb.dataset.token          = String(snapshot.token);
  thumb.dataset.format         = snapshot.format;
  thumb.dataset.backgroundMode = snapshot.backgroundMode;
  thumb.dataset.customFile     = snapshot.selectedCustomForFmt || '';
  thumb.dataset.gmCups         = snapshot.gmCups ? '1' : '0';
  thumb.dataset.pixelated      = snapshot.pixelated ? '1' : '0';
  thumb.dataset.shadowCloak    = snapshot.shadowCloak ? '1' : '0';

  thumb.addEventListener('click', () => {
    State.format = thumb.dataset.format;
    State.tokens = [clampToken(thumb.dataset.token)];
    State.backgroundMode = (thumb.dataset.backgroundMode === 'custom' || thumb.dataset.backgroundMode === 'none')
      ? thumb.dataset.backgroundMode
      : 'nft';
    State.gmCups = thumb.dataset.gmCups === '1';
    State.pixelated = thumb.dataset.pixelated === '1';
    State.shadowCloak = thumb.dataset.shadowCloak === '1';

    if (State.shadowCloak) {
      State.pixelated = false;
      State.gmCups = false;
    }

    if (State.backgroundMode === 'custom' && thumb.dataset.customFile) {
      State.selectedCustom[State.format] = thumb.dataset.customFile;
    }

    setActiveTabUI(State.format);
    syncControlsFromState();
    State.save();
    buildFromTokens(State.tokens);
  });

  gallery.appendChild(thumb);
  while (gallery.children.length > HISTORY_MAX) gallery.removeChild(gallery.firstChild);
  gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' });
}

/* ---------- persistent state ---------- */
const LSKEY = 'rascals-editor-state-v27';

const Persist = {
  read() {
    try { return JSON.parse(localStorage.getItem(LSKEY) || '{}'); }
    catch { return {}; }
  },
  write(o) {
    try { localStorage.setItem(LSKEY, JSON.stringify(o)); }
    catch {}
  }
};

const State = {
  format: 'square',
  tokens: [1],
  backgroundMode: 'nft',
  selectedCustom: { square:null, phonesaver:null, raid:null },
  gmCups: false,
  pixelated: false,
  shadowCloak: false,
  presets: {},
  lastRecords: [],
  dirty: false,

  load() {
    const s = Persist.read();
    Object.assign(this, {
      format: s.format ?? this.format,
      tokens: s.tokens ?? this.tokens,
      backgroundMode: s.backgroundMode ?? this.backgroundMode,
      selectedCustom: Object.assign({}, this.selectedCustom, s.selectedCustom || {}),
      gmCups: !!s.gmCups,
      pixelated: !!s.pixelated,
      shadowCloak: !!s.shadowCloak
    });

    if (this.shadowCloak) {
      this.pixelated = false;
      this.gmCups = false;
    }
  },

  save() {
    Persist.write({
      format: this.format,
      tokens: this.tokens,
      backgroundMode: this.backgroundMode,
      selectedCustom: this.selectedCustom,
      gmCups: this.gmCups,
      pixelated: this.pixelated,
      shadowCloak: this.shadowCloak
    });
  }
};

/* ---------- presets ---------- */
function mergePresets(...objs) {
  const out = { scale: 1, offsetX: 0, offsetY: 0 };
  for (const o of objs || []) {
    if (!o) continue;
    if (o.scale   != null) out.scale   = +o.scale;
    if (o.offsetX != null) out.offsetX = +o.offsetX;
    if (o.offsetY != null) out.offsetY = +o.offsetY;
  }
  return out;
}

function withoutScale(p) {
  const { offsetX = 0, offsetY = 0 } = p || {};
  return { offsetX:+offsetX, offsetY:+offsetY };
}

function getPreset(values, fmtKey, customFile) {
  const S = State.presets || {};
  const defaults       = S.defaults || {};
  const fileFmtDefault = (S.formatDefaults || {})[fmtKey] || {};
  const formatDefaults = mergePresets(FORMAT_BASELINE[fmtKey] || {}, fileFmtDefault);

  const bodyVal    = values?.['BODY'] || null;
  const bodyGlobal = bodyVal ? (S.bodyOverrides || {})[bodyVal] : null;
  const bodyByFmt  = bodyVal ? (S.bodyOverridesByFormat || {})[`${fmtKey}/${bodyVal}`] : null;

  const baseCommon = mergePresets(defaults, formatDefaults, bodyGlobal, bodyByFmt);

  if (customFile) {
    const customFmtDefaults = (S.customFormatDefaults || {})[fmtKey] || {};
    const anyPreset         = (S.customBackgrounds || {})[`${fmtKey}/*`] || {};
    const filePreset        = (S.customBackgrounds || {})[`${fmtKey}/${customFile}`] || {};
    const mergedCustom      = mergePresets(customFmtDefaults, anyPreset, filePreset);

    if (LOCK_SCALE_FORMATS.has(fmtKey)) {
      const onlyOffsets = withoutScale(mergedCustom);
      return mergePresets(baseCommon, onlyOffsets);
    }
    return mergePresets(baseCommon, mergedCustom);
  }

  return baseCommon;
}

/* ---------- drawing ---------- */
function fillBase(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = '#0a0f22';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

async function drawImageSafe(ctx, src, dx, dy, dw, dh) {
  try {
    const img = await loadImg(src);
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  } catch (e) {
    console.warn('[Missing image]', src);
    return false;
  }
}

async function drawCharacterLayer(ctx, folder, value, dx, dy, dw, dh) {
  const primary = buildCharacterSrc(folder, value);

  try {
    const img = await loadImg(primary);
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  } catch (e) {
    if (State.pixelated && !State.shadowCloak) {
      const fallback = buildNormalSrc(folder, value);
      try {
        const fallbackImg = await loadImg(fallback);
        ctx.drawImage(fallbackImg, dx, dy, dw, dh);
        return true;
      } catch (err) {
        console.warn('[Missing fallback image]', fallback);
      }
    }

    console.warn('[Missing character image]', primary);
    return false;
  }
}

async function drawCustomCover(ctx, W, H, src) {
  try {
    const img = await loadImg(src);
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const x = (W - dw) / 2;
    const y = (H - dh) / 2;
    ctx.drawImage(img, x, y, dw, dh);
    return true;
  } catch (e) {
    console.warn('[Missing custom BG]', src);
    return false;
  }
}

/* ---------- preview image management ---------- */
let previewImg = null;

function ensurePreviewImg() {
  if (previewImg && document.body.contains(previewImg)) return previewImg;

  const el = $('previewImg');
  if (el) {
    previewImg = el;
  } else {
    const wrap = $('outCanvasWrap');
    const img = document.createElement('img');
    img.id = 'previewImg';
    img.alt = '';
    img.hidden = true;
    wrap.appendChild(img);
    previewImg = img;
  }

  const c = $('mainCanvas');
  if (c) c.style.display = 'none';

  return previewImg;
}

function hidePreview() {
  const img = ensurePreviewImg();
  img.hidden = true;
  img.removeAttribute('src');
}

function updatePreviewFromCanvas() {
  const img = ensurePreviewImg();
  try {
    img.src = $('mainCanvas').toDataURL('image/png');
    img.hidden = false;
  } catch (e) {}
}

/* ---------- debounced render ---------- */
function scheduleRender() {
  if (State.dirty) return;
  State.dirty = true;
  requestAnimationFrame(async () => {
    State.dirty = false;
    await drawAll(State.lastRecords);
  });
}

/* ---------- status helper ---------- */
function setStatus(html) {
  const bar = $('statusBar');
  if (bar) bar.innerHTML = html;
}

/* ---------- UI ---------- */
function updateOutMeta() {
  const fmt = FORMATS[State.format];

  const nameEl = $('outName');
  if (nameEl) {
    nameEl.textContent = fmt.name + (State.lastRecords.length ? ` — #${State.lastRecords.map(r => r.id).join(' · #')}` : '');
  }

  const sizeEl = $('outSize');
  if (sizeEl) sizeEl.textContent = `${fmt.w} × ${fmt.h}`;

  const bgEl = $('outBg');
  if (bgEl) {
    const values = State.lastRecords[0]?.values || {};
    const hasOneOfOne = !!(getTraitValue(values, 'ONE OF ONE') && getTraitValue(values, 'ONE OF ONE') !== 'None');
    const cloakIgnored = State.shadowCloak && hasOneOfOne;

    const baseText = (State.backgroundMode === 'custom')
      ? `Custom BG: ${State.selectedCustom[State.format] || FORMATS[State.format].defaultBg}`
      : (State.backgroundMode === 'none' ? 'No Background' : 'NFT Background');

    let extraState = State.pixelated ? 'Pixelated ON' : 'Pixelated OFF';
    if (State.shadowCloak) extraState += cloakIgnored ? ' · Shadow Cloak OFF for 1/1' : ' · Shadow Cloak ON';

    bgEl.textContent = `${baseText} · ${extraState}`;
  }
}

function populateCustomSelect() {
  updateOutMeta();
  updateBgLabel();
}

function updateBgLabel() {
  const el = $('bgLabel');
  if (!el) return;

  const list = CUSTOM_BG[State.format] || [];
  const current = State.selectedCustom[State.format];
  const found = list.find(bg => bg.file === current);
  const values = State.lastRecords[0]?.values || {};
  const hasOneOfOne = !!(getTraitValue(values, 'ONE OF ONE') && getTraitValue(values, 'ONE OF ONE') !== 'None');
  const cloakIgnored = State.shadowCloak && hasOneOfOne;

  let label = (State.backgroundMode === 'none')
    ? 'No Background'
    : (found ? found.label : 'Background');

  if (State.pixelated) label += ' · Pixelated';
  if (State.shadowCloak) label += cloakIgnored ? ' · Cloak Off for 1/1' : ' · Shadow Cloak';

  el.textContent = label;
}

function wireTabs() {
  els('#stageTabs .nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (!FORMATS[view] || view === State.format) return;

      State.format = view;
      State.save();

      els('#stageTabs .nav-tab').forEach(b => {
        const active = b.getAttribute('data-view') === State.format;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      document.body.setAttribute('data-fmt', State.format);
      updatePreviewRatio();
      populateCustomSelect();
      updateOutMeta();
      updateBgLabel();
      history.replaceState(null, '', buildShareURL());
      scheduleRender();
    });
  });
}

function wireTokenControls(prevId, inputId, nextId) {
  const prev = $(prevId);
  const input = $(inputId);
  const next = $(nextId);

  if (prev) prev.addEventListener('click', () => {
    State.tokens[0] = clampToken((State.tokens[0] || 1) - 1);
    if (input) input.value = State.tokens[0];
    State.save();
    buildFromTokens(State.tokens);
  });

  if (next) next.addEventListener('click', () => {
    State.tokens[0] = clampToken((State.tokens[0] || 1) + 1);
    if (input) input.value = State.tokens[0];
    State.save();
    buildFromTokens(State.tokens);
  });

  if (input) input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      State.tokens[0] = clampToken(input.value);
      State.save();
      buildFromTokens(State.tokens);
    }
  });
}

function wireSidebar() {
  wireTokenControls('prevBtnBelow', 'tokenInputBelow', 'nextBtnBelow');

  $('shuffleBtn')?.addEventListener('click', () => {
    State.tokens[0] = 1 + Math.floor(Math.random() * 3333);
    State.save();
    if ($('tokenInputBelow')) $('tokenInputBelow').value = State.tokens[0];
    buildFromTokens(State.tokens);
  });

  $('bgPrevBtn')?.addEventListener('click', () => {
    State.backgroundMode = 'custom';
    const list = CUSTOM_BG[State.format] || [];
    if (!list.length) return;

    let idx = list.findIndex(bg => bg.file === State.selectedCustom[State.format]);
    if (idx < 0) idx = 0;
    idx = (idx - 1 + list.length) % list.length;

    State.selectedCustom[State.format] = list[idx].file;
    State.save();
    populateCustomSelect();
    updateOutMeta();
    updateBgLabel();
    history.replaceState(null, '', buildShareURL());
    scheduleRender();
  });

  $('bgNextBtn')?.addEventListener('click', () => {
    State.backgroundMode = 'custom';
    const list = CUSTOM_BG[State.format] || [];
    if (!list.length) return;

    let idx = list.findIndex(bg => bg.file === State.selectedCustom[State.format]);
    if (idx < 0) idx = 0;
    idx = (idx + 1) % list.length;

    State.selectedCustom[State.format] = list[idx].file;
    State.save();
    populateCustomSelect();
    updateOutMeta();
    updateBgLabel();
    history.replaceState(null, '', buildShareURL());
    scheduleRender();
  });

  $('shuffleBgBtn')?.addEventListener('click', () => {
    State.backgroundMode = 'custom';
    const list = CUSTOM_BG[State.format] || [];
    if (!list.length) return;

    let newBg;
    const current = State.selectedCustom[State.format];

    if (list.length === 1) {
      newBg = list[0].file;
    } else {
      do {
        newBg = list[Math.floor(Math.random() * list.length)].file;
      } while (newBg === current);
    }

    State.selectedCustom[State.format] = newBg;
    State.save();
    populateCustomSelect();
    updateOutMeta();
    updateBgLabel();
    history.replaceState(null, '', buildShareURL());
    scheduleRender();
  });

  $('downloadSingleBtn')?.addEventListener('click', downloadCurrent);

  const useCustomEl = $('useCustomBg');
  const noBgToggle  = $('noBgToggle');
  const gmc         = $('gmcupsToggle');
  const pixelToggle = $('pixelatedToggle');
  const shadowToggle = $('shadowCloakToggle');

  if (useCustomEl) {
    useCustomEl.checked = (State.backgroundMode === 'custom');
    useCustomEl.addEventListener('change', () => {
      State.backgroundMode = useCustomEl.checked ? 'custom' : 'nft';
      if (noBgToggle && useCustomEl.checked) noBgToggle.checked = false;

      State.save();
      populateCustomSelect();
      updateOutMeta();
      updateBgLabel();
      history.replaceState(null, '', buildShareURL());
      scheduleRender();
    });
  }

  if (noBgToggle) {
    noBgToggle.checked = (State.backgroundMode === 'none');
    noBgToggle.addEventListener('change', () => {
      State.backgroundMode = noBgToggle.checked
        ? 'none'
        : (($('useCustomBg')?.checked) ? 'custom' : 'nft');

      if (State.backgroundMode === 'none' && useCustomEl) useCustomEl.checked = false;

      State.save();
      updateOutMeta();
      updateBgLabel();
      history.replaceState(null, '', buildShareURL());
      scheduleRender();
    });
  }

  if (gmc) {
    gmc.checked = State.gmCups;
    gmc.addEventListener('change', () => {
      if (State.pixelated || State.shadowCloak) {
        State.gmCups = false;
        gmc.checked = false;
        State.save();
        updateToggleStates();
        return;
      }

      State.gmCups = gmc.checked;
      State.save();
      history.replaceState(null, '', buildShareURL());
      scheduleRender();
    });
  }

  if (pixelToggle) {
    pixelToggle.checked = State.pixelated;
    pixelToggle.addEventListener('change', () => {
      if (State.shadowCloak) {
        State.pixelated = false;
        pixelToggle.checked = false;
        State.save();
        updateToggleStates();
        return;
      }

      State.pixelated = pixelToggle.checked;

      if (State.pixelated) {
        State.gmCups = false;
      }

      State.save();
      updateToggleStates();
      updateOutMeta();
      updateBgLabel();
      history.replaceState(null, '', buildShareURL());
      scheduleRender();
    });
  }

  if (shadowToggle) {
    shadowToggle.checked = State.shadowCloak;
    shadowToggle.addEventListener('change', () => {
      State.shadowCloak = shadowToggle.checked;

      if (State.shadowCloak) {
        State.gmCups = false;
        State.pixelated = false;
      }

      State.save();
      updateToggleStates();
      updateOutMeta();
      updateBgLabel();
      history.replaceState(null, '', buildShareURL());
      scheduleRender();
    });
  }

  updateToggleStates();

  const menu = $('menuBtn');
  const sidebar = $('sidebar');
  const backdrop = $('backdrop');

  const openDrawer = () => {
    sidebar.classList.add('open');
    menu.classList.add('is-open');
    backdrop.classList.add('show');
    backdrop.hidden = false;
    menu.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    sidebar.classList.remove('open');
    menu.classList.remove('is-open');
    backdrop.classList.remove('show');
    backdrop.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
  };

  menu?.addEventListener('click', () => sidebar.classList.contains('open') ? closeDrawer() : openDrawer());
  backdrop?.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
}

function buildShareURL() {
  const fmt = State.format;
  const t = (State.tokens || []).filter(Boolean).join('-');
  const cb = (State.backgroundMode === 'custom' && State.selectedCustom[fmt]) ? State.selectedCustom[fmt] : '';
  const uc = (State.backgroundMode === 'custom') ? '1' : '0';
  const nb = (State.backgroundMode === 'none') ? '1' : '0';

  const q = new URLSearchParams({
    fmt,
    t,
    uc,
    cb,
    nb,
    gmc: State.gmCups ? '1' : '0',
    px: State.pixelated ? '1' : '0',
    sc: State.shadowCloak ? '1' : '0'
  });

  return `${location.origin}${location.pathname}?${q.toString()}`;
}

function loadFromQuery() {
  const q = new URLSearchParams(location.search);
  if (!q.has('fmt') && !q.has('t')) return;

  const fmt = q.get('fmt');
  if (fmt && FORMATS[fmt]) State.format = fmt;

  const t = (q.get('t') || '').trim();
  if (t) State.tokens = t.split('-').map(clampToken).slice(0, 1);

  const nb = q.get('nb') === '1';
  const uc = q.get('uc') === '1';
  State.backgroundMode = nb ? 'none' : (uc ? 'custom' : 'nft');

  const cb = q.get('cb');
  if (cb) State.selectedCustom[State.format] = cb;

  State.gmCups = q.get('gmc') === '1';
  State.pixelated = q.get('px') === '1';
  State.shadowCloak = q.get('sc') === '1';

  if (State.shadowCloak) {
    State.pixelated = false;
    State.gmCups = false;
  } else if (State.pixelated) {
    State.gmCups = false;
  }
}

function toast(msg) {
  const bar = $('statusBar');
  if (bar) {
    const old = bar.innerHTML;
    bar.textContent = msg;
    setTimeout(() => { bar.innerHTML = old; }, 1200);
  }
}

/* ---------- data ---------- */
async function fetchRecord(id) {
  try {
    const json = await loadJson(expandTemplate(META_TEMPLATE, id));
    const values = Array.isArray(json.attributes) ? attributesToRecord(json.attributes) : json;
    return { id, values };
  } catch (e) {
    console.warn('[Missing metadata]', id, e.message);
    throw e;
  }
}

/* ---------- renderer core ---------- */
async function renderSceneCore(ctx, width, height, fmtKey, records) {
  const baseSize = 2048;
  const coverScale = Math.max(width / baseSize, height / baseSize);

  const usingCustom = (State.backgroundMode === 'custom');
  const usingNone   = (State.backgroundMode === 'none');
  const customFile  = usingCustom ? (State.selectedCustom[fmtKey] || FORMATS[fmtKey].defaultBg) : null;

  ctx.clearRect(0, 0, width, height);
  fillBase(ctx, width, height);

  if (!usingNone) {
    if (customFile) {
      const mainSrc = `${CUSTOM_BG_BASE}/${fmtKey}/${customFile}`;
      await drawCustomCover(ctx, width, height, mainSrc);
    } else {
      const values0 = records[0]?.values;
      const tokenBg = getTraitValue(values0, 'BACKGROUND');

      if (tokenBg && tokenBg !== 'None') {
        const dw = baseSize * coverScale;
        const dh = baseSize * coverScale;
        const bgSrc = buildNormalSrc('Background', tokenBg);

        await drawImageSafe(
          ctx,
          bgSrc,
          (width - dw) / 2,
          (height - dh) / 2,
          dw,
          dh
        );
      }
    }
  }

  const { values } = records[0];
  const p = getPreset(values, fmtKey, customFile);
  const scale = coverScale * (p.scale || 1);

  ctx.save();
  ctx.translate(width / 2 + (p.offsetX || 0), height + (p.offsetY || 0));
  ctx.scale(scale, scale);
  ctx.translate(-baseSize / 2, -baseSize);

  const oneOfOneVal = getTraitValue(values, 'ONE OF ONE');
  const hasOneOfOne = !!(oneOfOneVal && oneOfOneVal !== 'None');
  const useShadowCloak = State.shadowCloak && !hasOneOfOne;

  if (useShadowCloak) {
    const bodyVal = getTraitValue(values, 'BODY');
    const mouthVal = getTraitValue(values, 'MOUTHS');
    const isBandana = String(mouthVal || '').trim().toUpperCase() === 'BANDANA';

    if (bodyVal && bodyVal !== 'None') {
      await drawCharacterLayer(ctx, 'BODY', bodyVal, 0, 0, baseSize, baseSize);
    }

    if (isBandana && mouthVal && mouthVal !== 'None') {
      await drawCharacterLayer(ctx, 'MOUTHS RASCALS', mouthVal, 0, 0, baseSize, baseSize);
    }

    const shadowSrc = `${SHADOW_CLOAK_BASE}/${SHADOW_CLOAK_FILE}`;
    await drawImageSafe(ctx, shadowSrc, 0, 0, baseSize, baseSize);

    if (!isBandana && mouthVal && mouthVal !== 'None') {
      await drawCharacterLayer(ctx, 'MOUTHS RASCALS', mouthVal, 0, 0, baseSize, baseSize);
    }
  } else {
    for (const layerKey of AFFECTED_LAYERS) {
      const entry = LAYER_ORDER.find(l => l.key === layerKey);
      const val = getTraitValue(values, layerKey);

      if (!entry || !val || val === 'None') continue;

      await drawCharacterLayer(ctx, entry.folder, val, 0, 0, baseSize, baseSize);
    }
  }

  if (State.gmCups && !useShadowCloak) {
    const bodyVal = getTraitValue(values, 'BODY');
    if (bodyVal && bodyVal !== 'None') {
      const overlay = `${IMG_BASE}/GMCUPS/${valueToFile('BODY', bodyVal)}.png`;
      await drawImageSafe(ctx, overlay, 0, 0, baseSize, baseSize);
    }
  }

  ctx.restore();
}

/* ---------- main draw ---------- */
async function drawAll(records) {
  State.lastRecords = records;

  const fmt = FORMATS[State.format];
  const canvas = $('mainCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = fmt.w;
  canvas.height = fmt.h;

  hidePreview();
  showCanvasLoader(true);

  try {
    await renderSceneCore(ctx, fmt.w, fmt.h, State.format, records);
    updateOutMeta();
    updateBgLabel();
    updatePreviewFromCanvas();
    addToHistory(makeSnapshot());
  } finally {
    showCanvasLoader(false);
  }
}

/* ---------- traits ---------- */
async function renderTraits(values) {
  const heading = Array.from(document.querySelectorAll('.card-title'))
    .find(h => /resolved\s+traits|traits/i.test(h.textContent));
  if (heading) heading.textContent = 'TRAITS';

  const box = $('traits');
  if (!box) return;

  box.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'trait-grid';
  box.appendChild(grid);

  function addChip(key, val) {
    const label = `${key}: ${val && val !== 'None' ? val : '—'}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.style.padding = '10px 12px';
    btn.style.fontWeight = '600';
    btn.style.textAlign = 'left';
    btn.textContent = label;
    btn.dataset.layer = key;
    btn.dataset.value = val || '—';

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(`${key}: ${btn.dataset.value}`);
        toast('Copied trait');
      } catch {}
    });

    const wrap = document.createElement('div');
    wrap.className = 'trait';
    wrap.appendChild(btn);
    grid.appendChild(wrap);
  }

  const oneOfOneVal = getTraitValue(values, 'ONE OF ONE');
  const hasOneOfOne = !!(oneOfOneVal && oneOfOneVal !== 'None');
  const useShadowCloak = State.shadowCloak && !hasOneOfOne;

  if (useShadowCloak) {
    addChip('BODY', getTraitValue(values, 'BODY') ?? '—');
    addChip('MOUTHS', getTraitValue(values, 'MOUTHS') ?? '—');
    addChip('SHADOW CLOAK', SHADOW_CLOAK_FILE);
    return;
  }

  for (const layer of LAYER_ORDER) {
    if (layer.key === 'BACKGROUND') continue;
    addChip(layer.key, getTraitValue(values, layer.key) ?? '—');
  }

  if (State.shadowCloak && hasOneOfOne) {
    addChip('SHADOW CLOAK', 'Ignored for 1/1');
  }

  if (State.gmCups) {
    const bodyVal = getTraitValue(values, 'BODY') || '—';
    addChip('GMCUPS', (bodyVal && bodyVal !== 'None') ? bodyVal : '—');
  }
}

/* ---------- download ---------- */
function downloadCurrent() {
  const fmt = FORMATS[State.format];
  const firstId = State.tokens[0] || 1;
  const mode = State.pixelated ? 'pixelated' : 'normal';
  const values = State.lastRecords[0]?.values || {};
  const hasOneOfOne = !!(getTraitValue(values, 'ONE OF ONE') && getTraitValue(values, 'ONE OF ONE') !== 'None');
  const cloak = State.shadowCloak && !hasOneOfOne ? '_shadowcloak' : '';

  const a = document.createElement('a');
  a.download = `rascal_${String(firstId).padStart(4, '0')}_${fmt.fileSuffix}_${mode}${cloak}.png`;
  a.href = $('mainCanvas').toDataURL('image/png');
  a.click();
}

/* ---------- pipeline ---------- */
async function buildFromTokens(ids) {
  ids = ids.slice(0, 1).filter(v => v != null && String(v).trim() !== '').map(clampToken);
  if (ids.length === 0) ids = [1];

  State.tokens = ids;
  State.save();

  if ($('tokenInputBelow')) $('tokenInputBelow').value = State.tokens[0] || 1;

  setStatus('Loading metadata…');
  showCanvasLoader(true);

  try {
    const results = await Promise.allSettled(ids.map(async id => {
      const json = await loadJson(expandTemplate(META_TEMPLATE, id));
      const values = Array.isArray(json.attributes) ? attributesToRecord(json.attributes) : json;
      return { id, values };
    }));

    const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failedIdx = results
      .map((r, i) => ({ r, i }))
      .filter(x => x.r.status === 'rejected')
      .map(x => ids[x.i]);

    if (ok.length === 0) {
      throw new Error('No tokens loaded (check metadata/*.json).');
    }

    State.lastRecords = ok;
    renderTraits(ok[0].values);

    setStatus(failedIdx.length ? `Compositing… (missing: ${failedIdx.join(', ')})` : 'Compositing…');
    await drawAll(ok);

    const values = ok[0]?.values || {};
    const hasOneOfOne = !!(getTraitValue(values, 'ONE OF ONE') && getTraitValue(values, 'ONE OF ONE') !== 'None');
    const modeText = State.pixelated ? 'pixelated' : 'normal';
    const cloakText = State.shadowCloak
      ? (hasOneOfOne ? ' · shadow cloak ignored for 1/1' : ' · shadow cloak')
      : '';

    setStatus(
      failedIdx.length
        ? `Built <b>#${ok.map(r => r.id).join(', ')}</b> · <b>${modeText}</b>${cloakText} · <span class="bad">missing: ${failedIdx.join(', ')}</span>`
        : `Built <b>#${ids.join(', ')}</b> · <b>${modeText}</b>${cloakText} · <span class="okay">ready</span>`
    );

    history.replaceState(null, '', buildShareURL());
  } catch (err) {
    console.error(err);
    setStatus(`Failed · <span class="bad">${err.message}</span>`);
  } finally {
    showCanvasLoader(false);
  }
}

/* ---------- skeleton ---------- */
function showCanvasLoader(on = true) {
  const sk = $('canvasSkeleton');
  if (!sk) return;
  if (on) sk.classList.remove('hidden');
  else sk.classList.add('hidden');
}

/* ---------- boot ---------- */
(async function boot() {
  const onScroll = () => {
    document.body.classList.toggle('scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  State.load();
  loadFromQuery();
  State.save();

  wireTabs();
  wireSidebar();

  els('#stageTabs .nav-tab').forEach(b => {
    const active = b.getAttribute('data-view') === State.format;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.body.setAttribute('data-fmt', State.format);
  updatePreviewRatio();

  populateCustomSelect();
  updateOutMeta();
  updateBgLabel();
  ensurePreviewImg();

  if ($('useCustomBg')) $('useCustomBg').checked = (State.backgroundMode === 'custom');
  if ($('noBgToggle')) $('noBgToggle').checked = (State.backgroundMode === 'none');
  if ($('gmcupsToggle')) $('gmcupsToggle').checked = State.gmCups;
  if ($('pixelatedToggle')) $('pixelatedToggle').checked = State.pixelated;
  if ($('shadowCloakToggle')) $('shadowCloakToggle').checked = State.shadowCloak;
  if ($('tokenInputBelow')) $('tokenInputBelow').value = State.tokens[0] || 1;

  updateToggleStates();

  try {
    State.presets = await loadJson('scene-presets.json');
  } catch (e) {
    console.warn('[Presets FAILED to load] Using defaults.', e);
  }

  await buildFromTokens(State.tokens);

  $('eggBtn')?.addEventListener('click', () => {
    document.body.classList.add('sparkle');
    $('brand')?.classList.add('wobble');
    setTimeout(() => {
      document.body.classList.remove('sparkle');
      $('brand')?.classList.remove('wobble');
    }, 1400);
  });
})();
