// Countdown Timer — Targeting July 24, 2025, 18:00 Brussels Time (16:00 UTC)
const targetDate = new Date("2025-07-24T16:00:00Z").getTime();

function updateTimer() {
  const now = Date.now();
  const diff = targetDate - now;

  if (diff <= 0) {
    document.querySelector(".mint-timer").textContent = "Mint is live!";
    clearInterval(timerInterval);
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("timer-days").textContent = String(days).padStart(2, "0");
  document.getElementById("timer-hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("timer-minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("timer-seconds").textContent = String(seconds).padStart(2, "0");
}

const timerInterval = setInterval(updateTimer, 1000);
updateTimer();


// Fade-in Animation
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(section => {
  observer.observe(section);
});
