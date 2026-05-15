const canvas = document.querySelector("#terrain");
const context = canvas.getContext("2d");
const preview = document.querySelector(".preview");
const previewTitle = document.querySelector("#preview-title");
const closePreview = document.querySelector("#close-preview");
const openModal = document.querySelector("#open-modal");
const closeModal = document.querySelector("#close-modal");
const overlay = document.querySelector("#overlay");

const labels = {
  Atlas: "Atlas, product map",
};

let time = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawTerrain() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const maxRadius = Math.min(width, height) * 0.48;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#080808";
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 1.35);
  glow.addColorStop(0, "rgba(255,255,255,0.12)");
  glow.addColorStop(0.48, "rgba(120,120,120,0.06)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 34; i += 1) {
    const progress = i / 33;
    const radiusX = maxRadius * (0.16 + progress * 0.95);
    const radiusY = maxRadius * (0.1 + progress * 0.7);
    const lift = Math.sin(progress * Math.PI) * maxRadius * 0.18;
    const points = 170;

    context.beginPath();

    for (let p = 0; p <= points; p += 1) {
      const angle = (p / points) * Math.PI * 2;
      const rough =
        Math.sin(angle * 3 + progress * 8 + time * 0.012) * 0.09 +
        Math.cos(angle * 5 - progress * 6 + time * 0.009) * 0.055 +
        Math.sin(angle * 9 + time * 0.006) * 0.025;
      const x = centerX + Math.cos(angle) * radiusX * (1 + rough);
      const y = centerY + Math.sin(angle) * radiusY * (1 + rough) - lift + progress * maxRadius * 0.45;

      if (p === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    const alpha = 0.08 + progress * 0.19;
    context.strokeStyle = `rgba(255,255,255,${alpha})`;
    context.lineWidth = i % 5 === 0 ? 1.3 : 0.7;
    context.stroke();
  }

  for (let i = 0; i < 120; i += 1) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 24634.6345) % 1;
    context.fillStyle = "rgba(255,255,255,0.08)";
    context.fillRect(Math.abs(x) * width, Math.abs(y) * height, 1, 1);
  }

  time += 1;
  requestAnimationFrame(drawTerrain);
}

function showPreview(label) {
  previewTitle.textContent = labels[label] || label;
  preview.classList.add("visible");
  document.body.classList.add("no-scroll");
}

function hidePreview() {
  preview.classList.remove("visible");
  if (!overlay.classList.contains("visible")) {
    document.body.classList.remove("no-scroll");
  }
}

function showModal() {
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function hideModal() {
  overlay.classList.remove("visible");
  overlay.setAttribute("aria-hidden", "true");
  if (!preview.classList.contains("visible")) {
    document.body.classList.remove("no-scroll");
  }
}

document.querySelectorAll(".work-pill").forEach((button) => {
  button.addEventListener("click", () => showPreview(button.dataset.preview));
});

closePreview.addEventListener("click", hidePreview);
openModal.addEventListener("click", showModal);
closeModal.addEventListener("click", hideModal);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    hideModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hidePreview();
    hideModal();
  }
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawTerrain();
