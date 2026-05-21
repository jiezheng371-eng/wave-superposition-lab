const TAU = Math.PI * 2;

const pulseCanvas = document.getElementById("pulseCanvas");
const pulseCtx = pulseCanvas.getContext("2d");

const phaseCanvas = document.getElementById("phaseCanvas");
const phaseCtx = phaseCanvas.getContext("2d");

const wavefrontCanvas = document.getElementById("wavefrontCanvas");
const wavefrontCtx = wavefrontCanvas.getContext("2d");
const linkedWaveCanvas = document.getElementById("linkedWaveCanvas");
const linkedWaveCtx = linkedWaveCanvas.getContext("2d");

const controls = {
  amp1: document.getElementById("amp1"),
  amp2: document.getElementById("amp2"),
  width: document.getElementById("pulseWidth"),
  speed: document.getElementById("speed"),
  separation: document.getElementById("separation"),
  phase: document.getElementById("phase"),
  animationSpeed: document.getElementById("animationSpeed"),
  wavefrontSpeed: document.getElementById("wavefrontSpeed"),
  wavefrontAngle: document.getElementById("wavefrontAngle"),
  showSamePhasePoints: document.getElementById("showSamePhasePoints"),
};

const readouts = {
  amp1: document.getElementById("amp1Value"),
  amp2: document.getElementById("amp2Value"),
  width: document.getElementById("widthValue"),
  speed: document.getElementById("speedValue"),
  separation: document.getElementById("separationValue"),
  phaseDeg: document.getElementById("phaseDeg"),
  phaseRad: document.getElementById("phaseRad"),
  animationSpeed: document.getElementById("animationSpeedValue"),
  interferenceLabel: document.getElementById("interferenceLabel"),
  wavefrontSpeed: document.getElementById("wavefrontSpeedValue"),
  wavefrontAngle: document.getElementById("wavefrontAngleValue"),
};

const pulsePlayPauseButton = document.getElementById("pulsePlayPause");
const pulseResetButton = document.getElementById("pulseReset");
const wavefrontPlayPauseButton = document.getElementById("wavefrontPlayPause");
const wavefrontResetButton = document.getElementById("wavefrontReset");

let pulseAnimationRunning = true;
let pulseTime = 0;
let smoothPhaseRad = 0;

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

  const centerDistance = Math.abs(center2 - center1);
  let overlapLabel = "before overlap / 重叠前";
  if (centerDistance < pulseWidth * 0.6) {
    overlapLabel = "during overlap / 重叠中";
  } else if (center1 > width / 2 + separation / 2) {
    overlapLabel = "after overlap / 重叠后";
  }
  pulseCtx.fillStyle = "#173f97";
  pulseCtx.font = "bold 22px Segoe UI";
  pulseCtx.fillText(overlapLabel, width - 320, height - 20);
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
    readouts.interferenceLabel.textContent = "Interference type: Destructive interference (antiphase). Complete cancellation requires equal amplitudes.";
  } else {
    readouts.interferenceLabel.textContent = "Interference type: Partial interference (not fully constructive or destructive)";
  }
}

function updateAnimationSpeedReadout() {
  const speedValue = Number(controls.animationSpeed.value);
  readouts.animationSpeed.textContent = speedValue.toFixed(2);
}

function drawPhaseScene() {
  const width = phaseCanvas.width;
  const height = phaseCanvas.height;
  const midY = height / 2;

  phaseCtx.clearRect(0, 0, width, height);
  drawAxis(phaseCtx, width, height, "Continuous waves");
  drawLegend(phaseCtx);

  const targetPhaseRad = (Number(controls.phase.value) * Math.PI) / 180;
  smoothPhaseRad += (targetPhaseRad - smoothPhaseRad) * 0.08;

  const amplitude = 58;
  const wavelength = 220;
  const angularWaveNumber = TAU / wavelength;
  const speedFactor = Number(controls.animationSpeed.value);
  const baseAngularFrequency = 0.001;
  const maxAngularFrequency = 0.055;
  const angularFrequency = baseAngularFrequency + (Math.pow(speedFactor / 1.6, 1.8) * (maxAngularFrequency - baseAngularFrequency));
  const animationTime = speedFactor === 0 ? 0 : performance.now();

  drawWaveLine(
    phaseCtx,
    (x) => amplitude * Math.sin(angularWaveNumber * x - angularFrequency * animationTime),
    "#0068a8"
  );

  drawWaveLine(
    phaseCtx,
    (x) => amplitude * Math.sin(angularWaveNumber * x - angularFrequency * animationTime + smoothPhaseRad),
    "#c83e0e"
  );

  drawWaveLine(
    phaseCtx,
    (x) => {
      const y1 = amplitude * Math.sin(angularWaveNumber * x - angularFrequency * animationTime);
      const y2 = amplitude * Math.sin(angularWaveNumber * x - angularFrequency * animationTime + smoothPhaseRad);
      return y1 + y2;
    },
    "#117a2f",
    3.3
  );

  phaseCtx.fillStyle = "#344766";
  phaseCtx.font = "17px Segoe UI";
  phaseCtx.fillText("Adjust phase difference to compare constructive and destructive interference.", 18, midY + 145);
}

let wavefrontPhaseOffset = 0;
let wavefrontRunning = true;

function drawArrow(ctx, sx, sy, ex, ey, color) {
  const head = 16;
  const angle = Math.atan2(ey - sy, ex - sx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - head * Math.cos(angle - Math.PI / 7), ey - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(ex - head * Math.cos(angle + Math.PI / 7), ey - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWavefrontScene() {
  const width = wavefrontCanvas.width;
  const height = wavefrontCanvas.height;
  const speed = Number(controls.wavefrontSpeed.value);
  const angleRad = Number(controls.wavefrontAngle.value) * Math.PI / 180;

  wavefrontCtx.clearRect(0, 0, width, height);

  const cx = width * 0.46;
  const cy = height * 0.52;
  const spacing = 75;
  const lineLength = Math.max(width, height) * 1.8;

  const tangentX = Math.cos(angleRad);
  const tangentY = Math.sin(angleRad);
  const normalX = -Math.sin(angleRad);
  const normalY = Math.cos(angleRad);

  const offset = ((wavefrontPhaseOffset % spacing) + spacing) % spacing;
  let highlightBaseX = cx + (offset * normalX);
  let highlightBaseY = cy + (offset * normalY);

  for (let i = -9; i <= 9; i += 1) {
    const shift = (i * spacing) + offset;
    const bx = cx + shift * normalX;
    const by = cy + shift * normalY;
    const x1 = bx - lineLength * tangentX;
    const y1 = by - lineLength * tangentY;
    const x2 = bx + lineLength * tangentX;
    const y2 = by + lineLength * tangentY;
    wavefrontCtx.strokeStyle = i === 0 ? '#9b2fd8' : '#5c79c3';
    wavefrontCtx.lineWidth = i === 0 ? 5 : 3;
    wavefrontCtx.beginPath();
    wavefrontCtx.moveTo(x1, y1);
    wavefrontCtx.lineTo(x2, y2);
    wavefrontCtx.stroke();
  }

  const rayStartX = width * 0.10;
  const rayStartY = height * 0.20;
  const rayEndX = rayStartX + normalX * 220;
  const rayEndY = rayStartY + normalY * 220;
  drawArrow(wavefrontCtx, rayStartX, rayStartY, rayEndX, rayEndY, '#cc3f0c');

  wavefrontCtx.fillStyle = '#1f2a3d';
  wavefrontCtx.font = 'bold 28px Segoe UI';
  wavefrontCtx.fillText('Ray direction', rayEndX + 10, rayEndY + 8);

  wavefrontCtx.font = 'bold 27px Segoe UI';
  wavefrontCtx.fillStyle = '#9b2fd8';
  wavefrontCtx.fillText('Wavefront', highlightBaseX + 24, highlightBaseY - 12);

  if (controls.showSamePhasePoints.checked) {
    wavefrontCtx.fillStyle = '#9b2fd8';
    for (let t = -160; t <= 160; t += 80) {
      const px = highlightBaseX + t * tangentX;
      const py = highlightBaseY + t * tangentY;
      wavefrontCtx.beginPath();
      wavefrontCtx.arc(px, py, 8, 0, TAU);
      wavefrontCtx.fill();
    }
    wavefrontCtx.fillStyle = '#1f2a3d';
    wavefrontCtx.font = 'bold 24px Segoe UI';
    wavefrontCtx.fillText('same phase', highlightBaseX + 10, highlightBaseY + 36);
  }

  drawLinkedSine(normalX, offset, spacing, speed);
}

function drawLinkedSine(normalX, offset, spacing) {
  const width = linkedWaveCanvas.width;
  const height = linkedWaveCanvas.height;
  const midY = height / 2;

  linkedWaveCtx.clearRect(0, 0, width, height);
  linkedWaveCtx.strokeStyle = '#707d93';
  linkedWaveCtx.lineWidth = 2;
  linkedWaveCtx.beginPath();
  linkedWaveCtx.moveTo(0, midY);
  linkedWaveCtx.lineTo(width, midY);
  linkedWaveCtx.stroke();

  const amp = 42;
  const wavelength = 220;
  const k = TAU / wavelength;
  const phase = (offset / spacing) * TAU;

  linkedWaveCtx.strokeStyle = '#127a8a';
  linkedWaveCtx.lineWidth = 4;
  linkedWaveCtx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const y = midY - amp * Math.sin(k * x - phase);
    if (x === 0) linkedWaveCtx.moveTo(x, y); else linkedWaveCtx.lineTo(x, y);
  }
  linkedWaveCtx.stroke();

  const markerX = width * 0.35;
  const markerY = midY - amp * Math.sin(k * markerX - phase);
  linkedWaveCtx.fillStyle = '#9b2fd8';
  linkedWaveCtx.beginPath();
  linkedWaveCtx.arc(markerX, markerY, 9, 0, TAU);
  linkedWaveCtx.fill();

  linkedWaveCtx.strokeStyle = '#9b2fd8';
  linkedWaveCtx.setLineDash([8, 8]);
  linkedWaveCtx.beginPath();
  linkedWaveCtx.moveTo(markerX, markerY + 10);
  linkedWaveCtx.lineTo(markerX, height - 8);
  linkedWaveCtx.stroke();
  linkedWaveCtx.setLineDash([]);

  linkedWaveCtx.fillStyle = '#1f2a3d';
  linkedWaveCtx.font = 'bold 23px Segoe UI';
  linkedWaveCtx.fillText('Linked sinusoidal view (same phase marker)', 20, 32);
}

function updateWavefrontReadouts() {
  readouts.wavefrontSpeed.textContent = Number(controls.wavefrontSpeed.value).toFixed(2);
  readouts.wavefrontAngle.textContent = String(Math.round(Number(controls.wavefrontAngle.value)));
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
    pulseTime += 0.35;
  }

  drawPulseScene();
  drawPhaseScene();
  if (wavefrontRunning && Number(controls.wavefrontSpeed.value) > 0) {
    wavefrontPhaseOffset += Number(controls.wavefrontSpeed.value) * 0.7;
  }
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
controls.animationSpeed.addEventListener("input", updateAnimationSpeedReadout);

updateControlReadouts();
updatePhaseReadout();
updateAnimationSpeedReadout();
animate();

controls.wavefrontSpeed.addEventListener("input", updateWavefrontReadouts);
controls.wavefrontAngle.addEventListener("input", updateWavefrontReadouts);

wavefrontPlayPauseButton.addEventListener("click", () => {
  wavefrontRunning = !wavefrontRunning;
  wavefrontPlayPauseButton.textContent = wavefrontRunning ? "Pause" : "Play";
});

wavefrontResetButton.addEventListener("click", () => {
  wavefrontPhaseOffset = 0;
  controls.wavefrontSpeed.value = "0.6";
  controls.wavefrontAngle.value = "90";
  controls.showSamePhasePoints.checked = true;
  wavefrontRunning = true;
  wavefrontPlayPauseButton.textContent = "Pause";
  updateWavefrontReadouts();
});

controls.showSamePhasePoints.addEventListener("change", () => {
  drawWavefrontScene();
});

updateWavefrontReadouts();
