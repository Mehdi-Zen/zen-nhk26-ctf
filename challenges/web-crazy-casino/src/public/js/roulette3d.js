/**
 * Crazy Casino - Stake-style Roulette Wheel (Canvas 2D)
 */

const WHEEL_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
    11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
    22, 18, 29, 7, 28, 12, 35, 3, 26
];

const NUM_COLORS_MAP = {
    0: '#0d6b32',
    1: '#c41e3a', 2: '#1a1a2e', 3: '#c41e3a', 4: '#1a1a2e', 5: '#c41e3a', 6: '#1a1a2e',
    7: '#c41e3a', 8: '#1a1a2e', 9: '#c41e3a', 10: '#1a1a2e', 11: '#1a1a2e', 12: '#c41e3a',
    13: '#1a1a2e', 14: '#c41e3a', 15: '#1a1a2e', 16: '#c41e3a', 17: '#1a1a2e', 18: '#c41e3a',
    19: '#c41e3a', 20: '#1a1a2e', 21: '#c41e3a', 22: '#1a1a2e', 23: '#c41e3a', 24: '#1a1a2e',
    25: '#c41e3a', 26: '#1a1a2e', 27: '#c41e3a', 28: '#1a1a2e', 29: '#1a1a2e', 30: '#c41e3a',
    31: '#1a1a2e', 32: '#c41e3a', 33: '#1a1a2e', 34: '#c41e3a', 35: '#1a1a2e', 36: '#c41e3a'
};

let canvas, ctx;
let currentAngle = 0;
let targetAngle = 0;
let spinning = false;
let spinStartTime = 0;
let spinDuration = 4000;
let startAngle = 0;
let lastResults = [];
let pendingResult = null;

function initRoulette3D() {
    canvas = document.getElementById('roulette-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 340;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    drawWheel(currentAngle);
}

function drawWheel(angle) {
    const size = 340;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 160;
    const innerR = 110;
    const hubR = 50;
    const segCount = WHEEL_NUMBERS.length;
    const segAngle = (Math.PI * 2) / segCount;

    ctx.clearRect(0, 0, size, size);

    // Outer ring shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // Outer gold rim
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#8b7335';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw segments
    for (let i = 0; i < segCount; i++) {
        const num = WHEEL_NUMBERS[i];
        const start = angle + i * segAngle - Math.PI / 2;
        const end = start + segAngle;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, start, end);
        ctx.closePath();
        ctx.fillStyle = NUM_COLORS_MAP[num];
        ctx.fill();

        // Segment border
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Number text
        const textAngle = start + segAngle / 2;
        const textR = (outerR + innerR) / 2 + 5;
        const tx = cx + Math.cos(textAngle) * textR;
        const ty = cy + Math.sin(textAngle) * textR;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString(), 0, 0);
        ctx.restore();
    }

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = '#8b7335';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner dark ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d12';
    ctx.fill();

    // Inner decorative segments
    for (let i = 0; i < segCount; i++) {
        const num = WHEEL_NUMBERS[i];
        const start = angle + i * segAngle - Math.PI / 2;
        const end = start + segAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, innerR - 2, start, end);
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, hubR, cx, cy, innerR - 2);
        grad.addColorStop(0, 'rgba(20,20,30,0.9)');
        grad.addColorStop(1, NUM_COLORS_MAP[num] + '40');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // Hub
    const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR);
    hubGrad.addColorStop(0, '#2a2a35');
    hubGrad.addColorStop(0.7, '#16161e');
    hubGrad.addColorStop(1, '#0d0d12');

    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    // Hub rim
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.strokeStyle = '#8b7335';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hub center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#8b7335';
    ctx.fill();

    // Hub spokes
    for (let i = 0; i < 8; i++) {
        const a = angle + (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12);
        ctx.lineTo(cx + Math.cos(a) * (hubR - 4), cy + Math.sin(a) * (hubR - 4));
        ctx.strokeStyle = '#8b733560';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function spinWheel(resultNumber) {
    if (spinning) return;
    spinning = true;

    const segCount = WHEEL_NUMBERS.length;
    const segAngle = (Math.PI * 2) / segCount;
    const targetIdx = WHEEL_NUMBERS.indexOf(resultNumber);

    // Calculate target: the pointer is at top (-PI/2) and drawWheel already offsets by -PI/2
    // So segment i is at angle i*segAngle from the pointer
    // We need to rotate so that targetIdx lands under the pointer
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    const targetSegCenter = targetIdx * segAngle + segAngle / 2;
    // Wheel rotates positively, so to land segment under pointer we go to -targetSegCenter
    const normalizedCurrent = currentAngle % (Math.PI * 2);
    targetAngle = currentAngle - normalizedCurrent + fullRotations * Math.PI * 2 - targetSegCenter;

    startAngle = currentAngle;
    spinStartTime = performance.now();
    spinDuration = 4000 + Math.random() * 1000;

    pendingResult = { number: resultNumber, color: NUM_COLORS_MAP[resultNumber] };

    requestAnimationFrame(animateSpin);
}

function animateSpin(timestamp) {
    const elapsed = timestamp - spinStartTime;
    const progress = Math.min(elapsed / spinDuration, 1);
    const eased = easeOutCubic(progress);

    currentAngle = startAngle + (targetAngle - startAngle) * eased;
    drawWheel(currentAngle);

    if (progress < 1) {
        requestAnimationFrame(animateSpin);
    } else {
        spinning = false;
        if (pendingResult) {
            lastResults.unshift(pendingResult);
            if (lastResults.length > 10) lastResults.pop();
            renderLastResults();
            pendingResult = null;
        }
    }
}

function renderLastResults() {
    const container = document.getElementById('last-results');
    if (!container) return;
    container.textContent = '';
    lastResults.forEach(function(r) {
        const dot = document.createElement('span');
        dot.className = 'last-result-dot';
        dot.style.background = r.color;
        dot.textContent = r.number;
        container.appendChild(dot);
    });
}

document.addEventListener('DOMContentLoaded', initRoulette3D);
