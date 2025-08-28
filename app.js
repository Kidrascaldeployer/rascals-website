// ---------------- Mobile nav toggle ----------------
const menuBtn = document.getElementById('menuBtn');
if (menuBtn){
  menuBtn.addEventListener('click', ()=>{
    const left = document.querySelector('.nav-left');
    const right = document.querySelector('.nav-right');
    const open = (left?.style.display === 'flex') || (right?.style.display === 'flex');
    const next = open ? 'none' : 'flex';
    if (left) left.style.display = next;
    if (right) right.style.display = next;
    menuBtn.setAttribute('aria-expanded', String(!open));
  });
}

// ---------------- Header scroll shadow ----------------
window.addEventListener('scroll', ()=>{
  document.querySelector('.site-header')
    ?.classList.toggle('scrolled', window.scrollY > 8);
});

// --------------- Reveal-on-scroll ---------------
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
  }, {threshold:.12});
  document.querySelectorAll('.reveal-on-scroll').forEach(el => io.observe(el));
}

/* --------------------- Hero preview tab --------------------- */
(function(){
  const media = document.getElementById('heroMedia');
  const toggle = document.getElementById('heroPreviewToggle');
  if (!media || !toggle) return;
  toggle.addEventListener('click', ()=>{
    const now = !media.classList.contains('fit-contain');
    media.classList.toggle('fit-contain', now);
    toggle.setAttribute('aria-pressed', String(now));
    toggle.textContent = now ? 'Fill' : 'Preview';
  });
})();

/* --------------------- Hero parallax glow --------------------- */
(function(){
  const hm = document.getElementById('heroMedia');
  if (!hm) return;
  hm.addEventListener('pointermove', (e)=>{
    const r = hm.getBoundingClientRect();
    hm.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5) * 6 + 'px');
    hm.style.setProperty('--ty', ((e.clientY - r.top ) / r.height - 0.5) * 6 + 'px');
  });
  hm.addEventListener('pointerleave', ()=>{
    hm.style.setProperty('--tx', '0px');
    hm.style.setProperty('--ty', '0px');
  });
})();

/* --------------------- Lightbox --------------------- */
(function(){
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbClose = document.getElementById('lightboxClose');
  if (!lb || !lbImg || !lbClose) return;

  const clickSelectors = ['.grid.gallery img', '.car-track img', '.hero-media img'].join(',');
  let currentList = [];
  let currentIndex = -1;

  function openLightbox(src, alt, list = [], index = -1){
    lbImg.src = src; lbImg.alt = alt || '';
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden','false');
    currentList = list; currentIndex = index;
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden','true');
    lbImg.src = ''; lbImg.alt = '';
    currentList = []; currentIndex = -1;
    document.body.style.overflow = '';
  }
  function showAt(i){
    if (i < 0 || i >= currentList.length) return;
    currentIndex = i;
    const el = currentList[i];
    openLightbox(el.src, el.alt || '', currentList, i);
  }

  document.addEventListener('click', (e)=>{
    const img = e.target.closest(clickSelectors);
    if (!img) return;
    const container = img.closest('.grid.gallery, .car-track, .hero-media') || document;
    const list = [...container.querySelectorAll('img')];
    const index = list.indexOf(img);
    openLightbox(img.src, img.alt || '', list, index);
  });

  lb.addEventListener('click', (e)=>{ if (e.target === lb) closeLightbox(); });
  lbClose.addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e)=>{
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight' && currentList.length) showAt(Math.min(currentIndex + 1, currentList.length - 1));
    if (e.key === 'ArrowLeft'  && currentList.length) showAt(Math.max(currentIndex - 1, 0));
  });
})();

/* --------------------- Toasts --------------------- */
function showToast(msg){
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> el.classList.remove('is-on'), 1600);
}

/* --------------------- Back to top --------------------- */
(function(){
  const toTop = document.getElementById('toTop');
  if (!toTop) return;
  const toggle = ()=> toTop.style.display = window.scrollY > 600 ? 'block' : 'none';
  window.addEventListener('scroll', toggle);
  toggle();
  toTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
})();

/* --------------------- Studio OVERLAY --------------------- */
(function(){
  const overlay = document.getElementById('studioOverlay');
  const openers = [document.getElementById('openStudioNav')].filter(Boolean);
  const closeBtn= document.getElementById('closeStudio');

  if (!overlay) return;

  function openStudio(pushHash = true){
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
    if (pushHash && location.hash !== '#studio') {
      history.pushState({studio:true}, '', '#studio');
    }
    closeBtn?.focus();
  }

  function closeStudio(popHash = true){
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
    if (popHash && location.hash === '#studio') {
      if (history.state && history.state.studio) history.back();
      else history.replaceState(null, '', ' ');
    }
  }

  openers.forEach(btn => btn.addEventListener('click', (e)=>{
    if (btn.getAttribute('href') === '#studio') e.preventDefault();
    openStudio(true);
  }));

  closeBtn?.addEventListener('click', ()=> closeStudio(true));
  overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeStudio(false); });

  window.addEventListener('keydown', (e)=>{
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeStudio(true);
  });

  if (location.hash === '#studio') openStudio(false);
  window.addEventListener('popstate', ()=>{
    if (location.hash === '#studio') openStudio(false);
    else if (overlay.classList.contains('is-open')) closeStudio(false);
  });
})();

/* -----------------------------------------------------------
   Community Highlights — local WEBP (images/metadata/{id}.webp)
   + Autoplay progress bar + edge clipping (handled in CSS)
----------------------------------------------------------- */
function uniqueRandomInts(count, min, max, exclude = new Set()){
  const set = new Set();
  const span = max - min + 1;
  const target = Math.min(count, Math.max(0, span - exclude.size));
  while (set.size < target){
    const v = Math.floor(Math.random() * span) + min;
    if (!exclude.has(v)) set.add(v);
  }
  return [...set];
}

(function(){
  const track = document.getElementById('carTrack');
  const shuffleBtn = document.getElementById('carShuffle');
  const prog = document.getElementById('carProg');
  if (!track) return;

  let carousel = null;
  const usedIds = new Set();
  let baseImgs = [];
  let swapTimer = null;

  let interval = Number(track.dataset.interval || 8000);
  let t0 = performance.now();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resetProgress(){ t0 = performance.now(); if (prog) prog.style.width = '0%'; }
  function progressRAF(){
    const now = performance.now();
    const p = Math.min(1, (now - t0) / interval);
    if (prog) prog.style.width = (p * 100) + '%';
    requestAnimationFrame(progressRAF);
  }
  requestAnimationFrame(progressRAF);

  function createCarousel(){
    if (carousel && typeof carousel.destroy === 'function') carousel.destroy();
    [...track.querySelectorAll('img[data-clone="1"]')].forEach(n => n.remove());

    const baseSlides = baseImgs;
    if (!baseSlides.length) return (carousel = null);

    const clonesA = baseSlides.map(n => { const c = n.cloneNode(true); c.dataset.clone = '1'; return c; });
    const clonesB = baseSlides.map(n => { const c = n.cloneNode(true); c.dataset.clone = '1'; return c; });
    clonesA.forEach(c => track.appendChild(c));
    clonesB.forEach(c => track.appendChild(c));

    let speed = 0.45, playing = true, raf;

    function setLoopWidth(){
      return baseSlides.reduce((acc, el) => acc + (el.getBoundingClientRect().width + 12), 0);
    }
    let loopWidth = setLoopWidth();

    function tick(){
      if (playing) {
        track.scrollLeft += speed;
        if (track.scrollLeft >= loopWidth) track.scrollLeft -= loopWidth;
      }
      raf = requestAnimationFrame(tick);
    }
    if (!reduced) raf = requestAnimationFrame(tick);

    const pause = ()=> playing = false;
    const resume = ()=> playing = true;

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('touchstart', pause, {passive:true});
    track.addEventListener('touchend', resume, {passive:true});
    track.addEventListener('focusin', pause);
    track.addEventListener('focusout', resume);

    const onKey = (e)=>{
      if (e.key === 'ArrowRight'){ pause(); track.scrollBy({left: 420, behavior:'smooth'}); setTimeout(resume, 1200); resetProgress(); }
      else if (e.key === 'ArrowLeft'){ pause(); track.scrollBy({left:-420, behavior:'smooth'}); setTimeout(resume, 1200); resetProgress(); }
    };
    track.addEventListener('keydown', onKey);

    const onResize = ()=>{ clearTimeout(onResize._t); onResize._t = setTimeout(()=> loopWidth = setLoopWidth(), 180); };
    window.addEventListener('resize', onResize);

    const prevBtn = document.querySelector('.car-btn.prev');
    const nextBtn = document.querySelector('.car-btn.next');
    const onPrev = prevBtn ? ()=>{ pause(); const card = baseSlides[0]; const step = card ? card.getBoundingClientRect().width + 12 : 380; track.scrollBy({ left: -step, behavior:'smooth' }); setTimeout(resume, 1200); resetProgress(); } : null;
    const onNext = nextBtn ? ()=>{ pause(); const card = baseSlides[0]; const step = card ? card.getBoundingClientRect().width + 12 : 380; track.scrollBy({ left: step,  behavior:'smooth' }); setTimeout(resume, 1200); resetProgress(); } : null;

    if (prevBtn) prevBtn.addEventListener('click', onPrev);
    if (nextBtn) nextBtn.addEventListener('click', onNext);

    carousel = {
      destroy(){
        cancelAnimationFrame(raf);
        track.replaceChildren(...baseSlides);
        track.removeEventListener('mouseenter', pause);
        track.removeEventListener('mouseleave', resume);
        track.removeEventListener('touchstart', pause);
        track.removeEventListener('touchend', resume);
        track.removeEventListener('focusin', pause);
        track.removeEventListener('focusout', resume);
        track.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        if (prevBtn) prevBtn.removeEventListener('click', onPrev);
        if (nextBtn) nextBtn.removeEventListener('click', onNext);
      }
    };
    return carousel;
  }

  function nextFreshId(){
    const minId = Number(track.dataset.min || 1);
    const maxId = Number(track.dataset.max || 3333);
    const [fresh] = uniqueRandomInts(1, minId, maxId, usedIds);
    return fresh ?? null;
  }

  function rerollForImage(img, attemptsLeft = 6){
    if (attemptsLeft <= 0) { img.src = 'images/rascals/UNREVEALED.png'; return; }
    const tmpl  = track.dataset.imageTemplate || 'images/metadata/{id}.webp';

    const oldId = Number(img.dataset.tokenId);
    if (!Number.isNaN(oldId)) usedIds.delete(oldId);

    const fresh = nextFreshId();
    if (fresh == null){ img.src = 'images/rascals/UNREVEALED.png'; return; }

    usedIds.add(fresh);
    img.dataset.tokenId = String(fresh);
    img.onerror = ()=> rerollForImage(img, attemptsLeft - 1);
    img.src = tmpl.replace('{id}', fresh);
  }

  function preload(src){
    return new Promise((resolve, reject)=>{
      const im = new Image();
      im.onload = ()=> resolve(im);
      im.onerror = reject;
      im.src = src;
    });
  }

  async function swapOneSlot(){
    if (!baseImgs.length) return;

    const idx = Math.floor(Math.random() * baseImgs.length);
    const img = baseImgs[idx];

    const tmpl  = track.dataset.imageTemplate || 'images/metadata/{id}.webp';
    const oldId = Number(img.dataset.tokenId);
    const fresh = nextFreshId();
    if (fresh == null) return;

    const nextSrc = tmpl.replace('{id}', fresh);

    try{
      await preload(nextSrc);
      img.classList.add('is-swapping');
      setTimeout(()=>{
        if (!Number.isNaN(oldId)) usedIds.delete(oldId);
        usedIds.add(fresh);
        img.dataset.tokenId = String(fresh);
        img.onerror = ()=> rerollForImage(img);
        img.src = nextSrc;
        setTimeout(()=> img.classList.remove('is-swapping'), 30);
      }, 180);
    }catch(_e){}

    createCarousel();
  }

  function startAutoSwap(){
    stopAutoSwap();
    interval = Number(track.dataset.interval || 8000);
    if (interval <= 0 || reduced) return;
    resetProgress();
    swapTimer = setInterval(()=>{
      if (document.hidden) return;
      resetProgress();
      swapOneSlot();
    }, interval);
  }
  function stopAutoSwap(){ if (swapTimer) { clearInterval(swapTimer); swapTimer = null; } }

  async function loadRandomHighlights(){
    const tmpl  = track.dataset.imageTemplate || 'images/metadata/{id}.webp';
    const count = Number(track.dataset.count || 8);
    const minId = Number(track.dataset.min || 1);
    const maxId = Number(track.dataset.max || 3333);

    track.innerHTML = '';
    usedIds.clear();

    const picks = uniqueRandomInts(count, minId, maxId, usedIds);
    picks.forEach(id => usedIds.add(id));

    baseImgs = [];
    for (const id of picks){
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = `Token #${id}`;
      img.dataset.tokenId = String(id);
      img.dataset.base = '1';
      img.src = tmpl.replace('{id}', id);
      img.onerror = ()=> rerollForImage(img);
      baseImgs.push(img);
      track.appendChild(img);
    }

    createCarousel();
    startAutoSwap();
  }

  document.getElementById('carShuffle')?.addEventListener('click', ()=>{
    loadRandomHighlights();
    (function(){ const p = document.getElementById('carProg'); if (p) p.style.width = '0%'; })();
    showToast('Shuffled highlights');
  });

  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) stopAutoSwap(); else startAutoSwap();
  });

  loadRandomHighlights();
})();

// ===== Subtle starfield background =====
(function () {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0, h = 0, stars = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = canvas.width  = Math.floor(window.innerWidth  * DPR);
    h = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);

    const cssW = w / DPR, cssH = h / DPR;
    const count = Math.min(180, Math.max(80, Math.floor(cssW * cssH / 16000)));
    stars = Array.from({length: count}, () => ({
      x: Math.random() * cssW,
      y: Math.random() * cssH,
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.35 + 0.35,
      tw: Math.random() * 0.03 + 0.01
    }));
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff";
    for (const s of stars) {
      const alpha = s.a + Math.sin(performance.now()*s.tw) * 0.15;
      ctx.globalAlpha = Math.max(0.05, Math.min(0.9, alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  if (!reduced) requestAnimationFrame(draw);
})();
