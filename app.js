// ===============================
// RASCALS — app.js (clean build)
// ===============================

// Header shrink on scroll
(function () {
  const header = document.getElementById("site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("shrink", window.scrollY > 80);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// Tilt effect for hero banner (VanillaTilt if present)
window.addEventListener("DOMContentLoaded", () => {
  const banner = document.querySelector(".main-banner");
  if (banner && window.VanillaTilt) {
    window.VanillaTilt.init(banner, { max: 8, speed: 400, glare: true, "max-glare": 0.2 });
  }
});

// Fade-in observer with stagger
(function () {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".fade-in").forEach((el, i) => {
    el.dataset.delay = i % 5;
    observer.observe(el);
  });
})();

// Lightbox for both galleries
(function () {
  const galleries = document.querySelectorAll("#rascals-gallery, #previews-gallery");
  if (!galleries.length) return;

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close (Esc)">&times;</button>
    <button class="lightbox-nav prev" aria-label="Previous (←)">&larr;</button>
    <img class="lightbox-image" alt="" />
    <button class="lightbox-nav next" aria-label="Next (→)">&rarr;</button>
    <div class="lightbox-meta">
      <div class="lightbox-caption"></div>
      <a class="open-original" target="_blank" rel="noopener">Open original</a>
    </div>
  `;
  document.body.appendChild(lb);

  const imgEl = lb.querySelector(".lightbox-image");
  const captionEl = lb.querySelector(".lightbox-caption");
  const linkEl = lb.querySelector(".open-original");
  const btnClose = lb.querySelector(".lightbox-close");
  const btnPrev = lb.querySelector(".lightbox-nav.prev");
  const btnNext = lb.querySelector(".lightbox-nav.next");

  const thumbs = [];
  galleries.forEach(g => thumbs.push(...g.querySelectorAll("img")));
  let index = -1;

  function open(i) {
    index = i;
    const t = thumbs[index];
    const full = t.getAttribute("data-full") || t.currentSrc || t.src;
    const fig = t.closest("figure");
    const figCap =
      fig && fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent.trim() : "";

    imgEl.src = full;
    imgEl.alt = t.alt || "Artwork";
    captionEl.textContent = figCap || t.alt || "";
    linkEl.href = full;

    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function next() {
    if (thumbs.length) open((index + 1) % thumbs.length);
  }
  function prev() {
    if (thumbs.length) open((index - 1 + thumbs.length) % thumbs.length);
  }

  thumbs.forEach((img, i) => img.addEventListener("click", () => open(i)));
  btnClose.addEventListener("click", close);
  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);
  lb.addEventListener("click", e => {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
})();

// Back to top
(function () {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  const onScroll = () => btn.classList.toggle("show", window.scrollY > 800);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();

// Active section highlight in sticky nav
(function () {
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".sticky-nav a"));
  if (!sections.length || !navLinks.length) return;

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
      });
    },
    { threshold: 0.6 }
  );
  sections.forEach(s => io.observe(s));
})();

// Auto-generate blue sparkles for all cards
(function () {
  const containers = document.querySelectorAll(".gallery-item, .preview-card");
  containers.forEach(c => {
    for (let i = 0; i < 8; i++) {
      const sp = document.createElement("div");
      sp.className = "sparkle";
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 50;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      sp.style.setProperty("--x", `${x.toFixed(0)}px`);
      sp.style.setProperty("--y", `${y.toFixed(0)}px`);
      c.appendChild(sp);
    }
    c.addEventListener("mouseleave", () => {
      c.querySelectorAll(".sparkle").forEach(s => {
        s.style.animation = "none";
        // force reflow, then clear to allow retrigger
        // eslint-disable-next-line no-unused-expressions
        s.offsetHeight;
        s.style.animation = "";
      });
    });
  });
})();

// === CUSTOM CURSOR (create ONCE & reuse) ===
(function () {
  // Remove any accidental duplicates from earlier builds
  document.querySelectorAll(".custom-cursor").forEach((n, i) => {
    if (i > 0) n.remove();
  });

  let cursor = document.querySelector(".custom-cursor");
  if (!cursor) {
    cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");
    document.body.appendChild(cursor);
  }

  document.addEventListener("mousemove", e => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
})();

// === 3D TILT EFFECT (inline transform so it doesn't fight CSS) ===
(function () {
  function applyTilt(card) {
    let raf = null;
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y - r.height / 2) / (r.height / 2)) * 6;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 6;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // inline transform overrides any :hover transform
        card.style.transform = `rotateX(${-rx}deg) rotateY(${ry}deg) scale(1.03)`;
      });
    });

    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.3s ease";
      card.style.transform = "rotateX(0) rotateY(0) scale(1)";
      setTimeout(() => (card.style.transition = ""), 300);
    });
  }

  document.querySelectorAll(".gallery-item, .preview-card").forEach(applyTilt);
})();
