const TAU = Math.PI * 2;

const pulseCanvas = document.getElementById("pulseCanvas");
const pulseCtx = pulseCanvas.getContext("2d");

const phaseCanvas = document.getElementById("phaseCanvas");
const phaseCtx = phaseCanvas.getContext("2d");

const wavefrontCanvas = document.getElementById("wavefrontCanvas");
const wavefrontCtx = wavefrontCanvas.getContext("2d");

const controls = {
  amp1: document.getElementById("amp1"),
  amp2: document.getElementById("amp2"),
  width: document.getElementById("pulseWidth"),
  speed: document.getElementById("speed"),
  separation: document.getElementById("separation"),
  phase: document.getElementById("phase"),
};

const readouts = {
  amp1: document.getElementById("amp1Value"),
  amp2: document.getElementById("amp2Value"),
  width: document.getElementById("widthValue"),
  speed: document.getElementById("speedValue"),
  separation: document.getElementById("separationValue"),
  phaseDeg: document.getElementById("phaseDeg"),
  phaseRad: document.getElementById("phaseRad"),
  interferenceLabel: document.getElementById("interferenceLabel"),
};

const pulsePlayPauseButton = document.getElementById("pulsePlayPause");
const pulseResetButton = document.getElementById("pulseReset");

let pulseAnimationRunning = true;
let pulseTime = 0;

function gaussianPulse(x, center, width, amplitude) {
  const distance = (x - center) / width;
  return amplitude * Math.exp(-(distance * distance));
}

function drawAxis(ctx, width, height, label) {
  const midY = height / 2;
  ctx.save();
  ctx.strokeStyle = "#707d93";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  ctx.fillStyle = "#344766";
  ctx.font = "16px Segoe UI";
  ctx.fillText("0 displacement", 10, midY - 8);
  ctx.fillText(label, width - 170, 24);
  ctx.restore();
}

function drawWaveLine(ctx, getY, color, lineWidth = 2.5) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const midY = height / 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  for (let x = 0; x <= width; x += 2) {
    const y = midY - getY(x);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

function drawLegend(ctx) {
  const items = [
    ["Wave 1", "#0068a8"],
    ["Wave 2", "#c83e0e"],
    ["Resultant", "#117a2f"],
  ];

  ctx.save();
  ctx.font = "18px Segoe UI";
  let x = 20;
  const y = 28;

  items.forEach(([text, color]) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 12, 24, 8);
    ctx.fillStyle = "#1f2a3d";
    ctx.fillText(text, x + 30, y);
    x += 180;
  });

  ctx.restore();
}

function drawPulseScene() {
  const width = pulseCanvas.width;
  const height = pulseCanvas.height;

  const amp1 = Number(controls.amp1.value);
  const amp2 = Number(controls.amp2.value);
  const pulseWidth = Number(controls.width.value);
  const speed = Number(controls.speed.value);
  const separation = Number(controls.separation.value);

  const centerLeftStart = width / 2 - separation / 2;
  const centerRightStart = width / 2 + separation / 2;

  const center1 = centerLeftStart + pulseTime * speed;
  const center2 = centerRightStart - pulseTime * speed;

  pulseCtx.clearRect(0, 0, width, height);

  drawAxis(pulseCtx, width, height, "Two pulse superposition");
  drawLegend(pulseCtx);

  drawWaveLine(pulseCtx, (x) => gaussianPulse(x, center1, pulseWidth, amp1), "#0068a8");
  drawWaveLine(pulseCtx, (x) => gaussianPulse(x, center2, pulseWidth, amp2), "#c83e0e");
  drawWaveLine(
    pulseCtx,
    (x) => gaussianPulse(x, center1, pulseWidth, amp1) + gaussianPulse(x, center2, pulseWidth, amp2),
    "#117a2f",
    3.5
  );

  pulseCtx.fillStyle = "#344766";
  pulseCtx.font = "17px Segoe UI";
  pulseCtx.fillText("Resultant calculated at each point: y = y₁ + y₂", 18, height - 16);
}

function updatePhaseReadout() {
  const phaseDeg = Number(controls.phase.value);
  const phaseRad = (phaseDeg * Math.PI) / 180;

  readouts.phaseDeg.textContent = String(phaseDeg);
  readouts.phaseRad.textContent = phaseRad.toFixed(2);

  const wrapped = ((phaseDeg % 360) + 360) % 360;

  if (wrapped === 0) {
    readouts.interferenceLabel.textContent = "Interference type: Constructive interference (in phase)";
  } else if (wrapped === 180) {
    readouts.interferenceLabel.textContent = "Interference type: Destructive interference (antiphase)";
  } else {
    readouts.interferenceLabel.textContent = "Interference type: Partial interference (not fully constructive or destructive)";
  }
}

function drawPhaseScene() {
  const width = phaseCanvas.width;
  const height = phaseCanvas.height;
  const midY = height / 2;

  phaseCtx.clearRect(0, 0, width, height);
  drawAxis(phaseCtx, width, height, "Continuous waves");
  drawLegend(phaseCtx);

  const phaseRad = (Number(controls.phase.value) * Math.PI) / 180;

  const amplitude = 58;
  const wavelength = 220;
  const angularWaveNumber = TAU / wavelength;
  const angularFrequency = 0.055;
  const t = performance.now();

  drawWaveLine(
    phaseCtx,
    (x) => amplitude * Math.sin(angularWaveNumber * x - angularFrequency * t),
    "#0068a8"
  );

  drawWaveLine(
    phaseCtx,
    (x) => amplitude * Math.sin(angularWaveNumber * x - angularFrequency * t + phaseRad),
    "#c83e0e"
  );

  drawWaveLine(
    phaseCtx,
    (x) => {
      const y1 = amplitude * Math.sin(angularWaveNumber * x - angularFrequency * t);
      const y2 = amplitude * Math.sin(angularWaveNumber * x - angularFrequency * t + phaseRad);
      return y1 + y2;
    },
    "#117a2f",
    3.3
  );

  phaseCtx.fillStyle = "#344766";
  phaseCtx.font = "17px Segoe UI";
  phaseCtx.fillText("Adjust phase difference to compare constructive and destructive interference.", 18, midY + 145);
}

function drawWavefrontScene() {
  const width = wavefrontCanvas.width;
  const height = wavefrontCanvas.height;

  wavefrontCtx.clearRect(0, 0, width, height);
  wavefrontCtx.fillStyle = "#fcfdff";
  wavefrontCtx.fillRect(0, 0, width, height);

  wavefrontCtx.strokeStyle = "#5c79c3";
  wavefrontCtx.lineWidth = 3;

  const spacing = 70;
  for (let x = 110; x < width - 80; x += spacing) {
    wavefrontCtx.beginPath();
    wavefrontCtx.moveTo(x, 40);
    wavefrontCtx.lineTo(x, height - 50);
    wavefrontCtx.stroke();
  }

  wavefrontCtx.strokeStyle = "#cc3f0c";
  wavefrontCtx.fillStyle = "#cc3f0c";
  wavefrontCtx.lineWidth = 4;

  const startX = 130;
  const startY = height / 2;
  const endX = width - 160;
  const endY = height / 2;

  wavefrontCtx.beginPath();
  wavefrontCtx.moveTo(startX, startY);
  wavefrontCtx.lineTo(endX, endY);
  wavefrontCtx.stroke();

  wavefrontCtx.beginPath();
  wavefrontCtx.moveTo(endX, endY);
  wavefrontCtx.lineTo(endX - 18, endY - 11);
  wavefrontCtx.lineTo(endX - 18, endY + 11);
  wavefrontCtx.closePath();
  wavefrontCtx.fill();

  wavefrontCtx.fillStyle = "#21314d";
  wavefrontCtx.font = "20px Segoe UI";
  wavefrontCtx.fillText("Wavefronts (same phase)", 16, 30);
  wavefrontCtx.fillText("Ray direction (perpendicular to wavefronts)", 16, height - 12);
}

function updateControlReadouts() {
  readouts.amp1.textContent = controls.amp1.value;
  readouts.amp2.textContent = controls.amp2.value;
  readouts.width.textContent = controls.width.value;
  readouts.speed.textContent = Number(controls.speed.value).toFixed(1);
  readouts.separation.textContent = controls.separation.value;
}

function animate() {
  if (pulseAnimationRunning) {
    pulseTime += 1;
  }

  drawPulseScene();
  drawPhaseScene();
  drawWavefrontScene();

  requestAnimationFrame(animate);
}

pulsePlayPauseButton.addEventListener("click", () => {
  pulseAnimationRunning = !pulseAnimationRunning;
  pulsePlayPauseButton.textContent = pulseAnimationRunning ? "Pause" : "Play";
});

pulseResetButton.addEventListener("click", () => {
  pulseTime = 0;
  pulseAnimationRunning = true;
  pulsePlayPauseButton.textContent = "Pause";
});

[controls.amp1, controls.amp2, controls.width, controls.speed, controls.separation].forEach((slider) => {
  slider.addEventListener("input", updateControlReadouts);
});

controls.phase.addEventListener("input", updatePhaseReadout);

updateControlReadouts();
updatePhaseReadout();
animate();
