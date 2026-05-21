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
  const head = 14;
  const angle = Math.atan2(ey - sy, ex - sx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
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
  const spacing = 90;
  const offset = ((wavefrontPhaseOffset % spacing) + spacing) % spacing;
  const highlightX = offset;

  wavefrontCtx.clearRect(0, 0, width, height);

  for (let x = highlightX - spacing * 20; x <= width + spacing * 20; x += spacing) {
    const isHighlight = Math.abs(x - highlightX) < 0.001;
    wavefrontCtx.strokeStyle = isHighlight ? '#9b2fd8' : '#5c79c3';
    wavefrontCtx.lineWidth = isHighlight ? 5 : 3;
    wavefrontCtx.beginPath();
    wavefrontCtx.moveTo(x, 36);
    wavefrontCtx.lineTo(x, height - 46);
    wavefrontCtx.stroke();
  }

  wavefrontCtx.setLineDash([8, 7]);
  wavefrontCtx.strokeStyle = '#9b2fd8';
  wavefrontCtx.lineWidth = 3;
  wavefrontCtx.beginPath();
  wavefrontCtx.moveTo(highlightX, height - 44);
  wavefrontCtx.lineTo(highlightX, height);
  wavefrontCtx.stroke();
  wavefrontCtx.setLineDash([]);

  for (let y = 82; y <= 238; y += 52) {
    wavefrontCtx.fillStyle = '#9b2fd8';
    wavefrontCtx.beginPath();
    wavefrontCtx.arc(highlightX, y, 7, 0, TAU);
    wavefrontCtx.fill();
  }

  wavefrontCtx.fillStyle = '#1f2a3d';
  wavefrontCtx.font = 'bold 22px Segoe UI';
  wavefrontCtx.fillText('same phase points / 同相位点', Math.min(highlightX + 18, width - 360), 84);
  wavefrontCtx.font = '20px Segoe UI';
  wavefrontCtx.fillText('All points on this wavefront are in the same phase.', 30, 296);
  wavefrontCtx.fillText('这条波前上的所有点处于同一相位。', 30, 324);

  drawArrow(wavefrontCtx, 70, 34, 370, 34, '#cc3f0c');
  wavefrontCtx.fillStyle = '#1f2a3d';
  wavefrontCtx.font = 'bold 20px Segoe UI';
  wavefrontCtx.fillText('Ray direction / wave travel direction', 390, 40);
  wavefrontCtx.fillText('射线方向 / 波传播方向', 390, 66);
  wavefrontCtx.fillText('ray ⟂ wavefront / 射线 ⟂ 波前', 720, 94);

  const lambdaStart = highlightX + spacing;
  const lambdaEnd = highlightX + spacing * 2;
  if (lambdaEnd < width - 50) {
    drawArrow(wavefrontCtx, lambdaStart, height - 20, lambdaEnd, height - 20, '#1f2a3d');
    drawArrow(wavefrontCtx, lambdaEnd, height - 20, lambdaStart, height - 20, '#1f2a3d');
    wavefrontCtx.font = 'bold 20px Segoe UI';
    wavefrontCtx.fillText('one wavelength λ / 一个波长 λ', lambdaStart + 6, height - 26);
  }

  drawLinkedSine(highlightX, spacing);
}

function drawLinkedSine(highlightX, spacing) {
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
  const wavelength = spacing;
  const k = TAU / wavelength;
  const phase = (highlightX / spacing) * TAU;

  linkedWaveCtx.strokeStyle = '#127a8a';
  linkedWaveCtx.lineWidth = 4;
  linkedWaveCtx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const y = midY - amp * Math.sin(k * x - phase);
    if (x === 0) linkedWaveCtx.moveTo(x, y); else linkedWaveCtx.lineTo(x, y);
  }
  linkedWaveCtx.stroke();

  const crestX = highlightX;
  const crestY = midY - amp;
  linkedWaveCtx.fillStyle = '#9b2fd8';
  linkedWaveCtx.beginPath();
  linkedWaveCtx.arc(crestX, crestY, 8, 0, TAU);
  linkedWaveCtx.fill();

  linkedWaveCtx.setLineDash([8, 7]);
  linkedWaveCtx.strokeStyle = '#9b2fd8';
  linkedWaveCtx.lineWidth = 3;
  linkedWaveCtx.beginPath();
  linkedWaveCtx.moveTo(crestX, 0);
  linkedWaveCtx.lineTo(crestX, crestY - 10);
  linkedWaveCtx.stroke();
  linkedWaveCtx.setLineDash([]);

  linkedWaveCtx.fillStyle = '#1f2a3d';
  linkedWaveCtx.font = 'bold 20px Segoe UI';
  linkedWaveCtx.fillText('corresponding crest / 对应波峰', Math.min(crestX + 16, width - 300), crestY - 16);
  linkedWaveCtx.fillText('same phase shown as a crest / 同一相位在正弦图中显示为波峰', 26, 30);
}

function updateWavefrontReadouts() {
  readouts.wavefrontSpeed.textContent = Number(controls.wavefrontSpeed.value).toFixed(2);
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

wavefrontPlayPauseButton.addEventListener("click", () => {
  wavefrontRunning = !wavefrontRunning;
  wavefrontPlayPauseButton.textContent = wavefrontRunning ? "Pause" : "Play";
});

wavefrontResetButton.addEventListener("click", () => {
  wavefrontPhaseOffset = 0;
  controls.wavefrontSpeed.value = "0.6";
  wavefrontRunning = true;
  wavefrontPlayPauseButton.textContent = "Pause";
  updateWavefrontReadouts();
});

updateWavefrontReadouts();
