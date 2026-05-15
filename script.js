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
  const centerY = height * 0.5;
  const maxRadius = Math.min(width, height) * 0.42;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#1d1c1a";
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.64, height * 0.28, 0, width * 0.64, height * 0.28, maxRadius * 1.65);
  glow.addColorStop(0, "rgba(127,174,183,0.16)");
  glow.addColorStop(0.5, "rgba(127,174,183,0.045)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(217,214,208,0.04)";
  context.lineWidth = 1;

  for (let x = 0; x < width; x += 34) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y < height; y += 34) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  for (let ring = 0; ring < 16; ring += 1) {
    const progress = ring / 15;
    const radius = maxRadius * (0.22 + progress * 0.95);
    const sides = 6;

    context.beginPath();

    for (let i = 0; i <= sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2 + time * 0.002;
      const pulse = Math.sin(time * 0.018 + ring * 0.8 + i) * 0.05;
      const x = centerX + Math.cos(angle) * radius * (1 + pulse);
      const y = centerY + Math.sin(angle) * radius * 0.72 * (1 - pulse);

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
    context.strokeStyle = `rgba(217,214,208,${0.07 + progress * 0.11})`;
    context.lineWidth = ring % 3 === 0 ? 1.4 : 0.8;
    context.stroke();
  }

  for (let spoke = 0; spoke < 9; spoke += 1) {
    const angle = (spoke / 9) * Math.PI * 2 + time * 0.003;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX + Math.cos(angle) * maxRadius * 1.25, centerY + Math.sin(angle) * maxRadius * 0.88);
    context.strokeStyle = "rgba(127,174,183,0.16)";
    context.lineWidth = 1;
    context.stroke();
  }

  context.fillStyle = "#7faeb7";
  for (let i = 0; i < 11; i += 1) {
    const angle = (i / 11) * Math.PI * 2 - time * 0.006;
    const orbit = maxRadius * (0.45 + (i % 4) * 0.18);
    const x = centerX + Math.cos(angle) * orbit;
    const y = centerY + Math.sin(angle) * orbit * 0.7;
    context.globalAlpha = 0.55 + Math.sin(time * 0.03 + i) * 0.22;
    context.fillRect(x - 2, y - 2, 4, 4);
  }
  context.globalAlpha = 1;

  for (let i = 0; i < 140; i += 1) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 24634.6345) % 1;
    context.fillStyle = "rgba(217,214,208,0.075)";
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
