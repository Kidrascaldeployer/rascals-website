// Header shrink on scroll
(function(){
  const header = document.getElementById('site-header');
  if(!header) return;
  const onScroll = () => {
    header.classList.toggle('shrink', window.scrollY > 80);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Tilt effect (if library loaded)
window.addEventListener("DOMContentLoaded", () => {
  const banner = document.querySelector(".main-banner");
  if (banner && window.VanillaTilt) {
    window.VanillaTilt.init(banner, { max: 8, speed: 400, glare: true, "max-glare": 0.2 });
  }
});

// Fade-in observer
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".fade-in").forEach(s => observer.observe(s));

// Lightbox with caption (uses alt text)
(function(){
  const gallery = document.getElementById("rascals-gallery");
  if (!gallery) return;

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-nav prev" aria-label="Previous">◀</button>
    <img class="lightbox-image" alt="">
    <button class="lightbox-nav next" aria-label="Next">▶</button>
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
  const thumbs = [...gallery.querySelectorAll("img")];
  let index = 0;

  function open(i){
    index = i;
    const t = thumbs[i];
    const full = t.dataset.full || t.currentSrc || t.src;
    imgEl.src = full;
    imgEl.alt = t.alt || "Artwork";
    captionEl.textContent = t.alt || "";
    linkEl.href = full;
    lb.classList.add("open");
    document.body.style.overflow="hidden";
  }
  function close(){ lb.classList.remove("open"); document.body.style.overflow=""; }
  function next(){ open((index+1)%thumbs.length); }
  function prev(){ open((index-1+thumbs.length)%thumbs.length); }

  thumbs.forEach((img,i)=> img.addEventListener("click",()=>open(i)));
  btnClose.addEventListener("click", close);
  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);
  lb.addEventListener("click", e=>{ if(e.target===lb) close(); });

  document.addEventListener("keydown", e=>{
    if(!lb.classList.contains("open")) return;
    if(e.key==="Escape") close();
    if(e.key==="ArrowRight") next();
    if(e.key==="ArrowLeft") prev();
  });
})();

// Back to top button
(function(){
  const btn = document.getElementById('backToTop');
  if(!btn) return;

  function onScroll(){
    btn.classList.toggle('show', window.scrollY > 800);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  btn.addEventListener('click', ()=>{
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// Active section highlight in sticky nav
(function () {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navLinks = Array.from(document.querySelectorAll('.sticky-nav a'));
  if (!sections.length || !navLinks.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      navLinks.forEach((a) => {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    });
  }, { threshold: 0.6 });

  sections.forEach((s) => io.observe(s));
})();
