import CTFd from "../../index";
import { Howl } from "howler";

/**
 * FIRST BLOOD - Cyberpunk Edition
 * Clean, spectacular notification for first solves
 */

// Sound effect
let firstBloodSound = null;
try {
  firstBloodSound = new Howl({
    src: ["/themes/cybernoir/static/sounds/firstblood.mp3"],
    volume: 0.7,
  });
} catch (e) {
  console.log("[FirstBlood] Sound not loaded");
}

export default () => {
  // Register event handler
  CTFd._functions.events.eventFirstBlood = data => {
    showFirstBlood(data);
  };

  // Listen for SSE events
  if (CTFd.events && CTFd.events.source) {
    CTFd.events.source.addEventListener("first_blood", event => {
      const data = JSON.parse(event.data);
      showFirstBlood(data);
    });
  }
};

function showFirstBlood(data) {
  // Play sound
  if (firstBloodSound) {
    firstBloodSound.play();
  }

  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "first-blood-overlay";
  overlay.innerHTML = createHTML(data);
  document.body.appendChild(overlay);

  // Auto dismiss after 7 seconds
  const timeout = setTimeout(() => dismiss(overlay), 7000);

  // Click to dismiss
  overlay.addEventListener("click", () => {
    clearTimeout(timeout);
    dismiss(overlay);
  });

  // Key to dismiss
  const keyHandler = () => {
    clearTimeout(timeout);
    dismiss(overlay);
    document.removeEventListener("keydown", keyHandler);
  };
  document.addEventListener("keydown", keyHandler);
}

function createHTML(data) {
  const challengeName = escapeHtml(data.challenge_name || "Unknown Challenge");
  const category = escapeHtml(data.challenge_category || "Challenge");
  const solver = escapeHtml(data.account_name || data.solver_name || "Unknown");

  return `
    <!-- Flash effect -->
    <div class="fb-flash"></div>

    <!-- Vignette -->
    <div class="fb-vignette"></div>

    <!-- Floating particles -->
    <div class="fb-particles">
      ${Array(20).fill('<div class="fb-particle"></div>').join('')}
    </div>

    <!-- Main content -->
    <div class="fb-content">
      <div class="fb-title">FIRST BLOOD</div>
      <div class="fb-subtitle">Target Eliminated</div>

      <div class="fb-divider"></div>

      <div class="fb-challenge">
        <div class="fb-challenge-name">${challengeName}</div>
        <div class="fb-challenge-category">${category}</div>
      </div>

      <div class="fb-solver">
        <div class="fb-solver-label">Claimed by</div>
        <div class="fb-solver-name">${solver}</div>
      </div>
    </div>

    <!-- Close button -->
    <div class="fb-close"></div>

    <!-- Dismiss hint -->
    <div class="fb-dismiss">Click anywhere to dismiss</div>
  `;
}

function dismiss(overlay) {
  if (overlay.classList.contains("hiding")) return;
  overlay.classList.add("hiding");
  setTimeout(() => overlay.remove(), 400);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
