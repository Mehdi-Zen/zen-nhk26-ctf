/**
 * Crazy Casino - Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    const t = localStorage.getItem('token');
    if (!t) { window.location.href = '/'; return; }

    loadProfile(); loadBalance(); loadLeaderboard();
    ['reel1','reel2','reel3'].forEach(function(id) {
        var randSym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        renderReelSymbol(document.getElementById(id), randSym);
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    document.getElementById('spin-btn').addEventListener('click', spin);
});

async function loadProfile() {
    try {
        const d = await apiCall('/auth/me');
        if (d.username) {
            document.getElementById('username').textContent = d.username;
            document.getElementById('vip-level').textContent = d.level || 0;
        }
    } catch (e) {}
}

async function loadBalance() {
    try {
        const d = await apiCall('/api/g/bal');
        document.getElementById('balance').textContent = (d.b || 0).toLocaleString();
    } catch (e) {}
}

async function loadLeaderboard() {
    try {
        const d = await apiCall('/api/g/top');
        const c = document.getElementById('leaderboard');
        if (d.l && d.l.length > 0) {
            c.innerHTML = d.l.map((e, i) => {
                let rankClass = '';
                if (i === 0) rankClass = 'gold';
                else if (i === 1) rankClass = 'silver';
                else if (i === 2) rankClass = 'bronze';
                return `<div class="leaderboard-entry"><span class="entry-rank ${rankClass}">#${i+1}</span><span class="entry-name">Player ${e.id}</span><span class="entry-chips">${(e.b||0).toLocaleString()}</span></div>`;
            }).join('');
        } else { c.innerHTML = '<p style="color: var(--gray-warm); text-align: center;">-</p>'; }
    } catch (e) {}
}

var SLOT_SYMBOLS = ['7', '🍒', '🍋', '🔔', '⭐', '💎', '🍀'];
var API_TO_SYMBOL = { 'A': '7', 'B': '🍒', 'C': '🍋', 'D': '🔔', 'E': '⭐', 'F': '💎', 'G': '🍀' };
var SYMBOL_HEIGHT = 100;
var reelResults = { reel1: '♠', reel2: '♠', reel3: '♠' };

function renderReelSymbol(container, symbol) {
    container.textContent = '';
    var div = document.createElement('div');
    div.className = 'reel-symbol';
    if (symbol === '7') {
        div.style.color = '#ff3333';
        div.style.fontWeight = 'bold';
        div.style.fontFamily = "'Cinzel', serif";
        div.style.textShadow = '0 0 15px rgba(255,50,50,0.6)';
        div.style.fontSize = '3.5rem';
    }
    div.textContent = symbol;
    container.appendChild(div);
}

function spinSlotReel(reelId, targetSymbol, duration) {
    var reel = document.getElementById(reelId);
    var startTime = performance.now();
    var flickerInterval = 60;
    var lastFlicker = 0;

    function animate(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);

        // Flicker through random symbols, slowing down as progress increases
        var currentInterval = flickerInterval + progress * 300;
        if (now - lastFlicker > currentInterval) {
            lastFlicker = now;
            if (progress < 0.85) {
                var randSym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
                renderReelSymbol(reel, randSym);
            } else {
                renderReelSymbol(reel, targetSymbol);
            }
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            renderReelSymbol(reel, targetSymbol);
            reelResults[reelId] = targetSymbol;
        }
    }

    requestAnimationFrame(animate);
}

async function spin() {
    const amt = parseInt(document.getElementById('bet-amount').value);
    const btn = document.getElementById('spin-btn');
    const res = document.getElementById('spin-result');

    if (amt <= 0 || amt > 10000) {
        res.textContent = 'Invalid bet';
        return;
    }

    btn.disabled = true;
    res.textContent = '';

    try {
        const d = await apiCall('/api/g/play', { method: 'POST', body: JSON.stringify({ amt }) });

        if (d.error) {
            res.textContent = d.error;
            btn.disabled = false;
            return;
        }

        if (d.r) {
            spinSlotReel('reel1', API_TO_SYMBOL[d.r[0]] || d.r[0], 1500);
            spinSlotReel('reel2', API_TO_SYMBOL[d.r[1]] || d.r[1], 2000);
            spinSlotReel('reel3', API_TO_SYMBOL[d.r[2]] || d.r[2], 2500);
        }

        setTimeout(function() {
            btn.disabled = false;
            document.getElementById('balance').textContent = (d.b || 0).toLocaleString();
            if (d.w > 0) {
                res.textContent = 'WIN! +' + d.w.toLocaleString() + ' chips';
                res.className = 'spin-result win';
            } else {
                res.textContent = 'Better luck next time';
                res.className = 'spin-result loss';
            }
        }, 2800);
    } catch (e) {
        btn.disabled = false;
        res.textContent = 'Failed to spin';
        res.className = 'spin-result loss';
    }
}
