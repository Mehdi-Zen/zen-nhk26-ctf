/**
 * Crazy Casino - Roulette Client
 */

const ROULETTE_COLORS = {
    0: 'green',
    1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black',
    7: 'red', 8: 'black', 9: 'red', 10: 'black', 11: 'black', 12: 'red',
    13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
    19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black',
    25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
    31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

let isSpinning = false;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadBalance();
    generateNumberButtons();
    setupEventListeners();
});

function generateNumberButtons() {
    const container = document.getElementById('number-buttons');
    for (let i = 1; i <= 36; i++) {
        const btn = document.createElement('button');
        btn.className = `num-btn ${ROULETTE_COLORS[i]}`;
        btn.dataset.type = 'number';
        btn.dataset.value = i;
        btn.textContent = i;
        btn.addEventListener('click', () => placeBet('number', i));
        container.appendChild(btn);
    }
}

function setupEventListeners() {
    // Color bets
    document.querySelectorAll('.bet-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            let value = btn.dataset.value;

            // Convert to number if needed
            if (type === 'column') {
                value = parseInt(value);
            }

            placeBet(type, value);
        });
    });

    // Green zero
    document.querySelector('.num-btn.green').addEventListener('click', () => {
        placeBet('number', 0);
    });
}

async function loadBalance() {
    try {
        const data = await apiCall('/api/g/bal');
        document.getElementById('balance').textContent = data.b.toLocaleString();
    } catch (e) {
        console.error('Failed to load balance');
    }
}

async function placeBet(betType, betValue) {
    if (isSpinning) return;

    const bet = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(bet) || bet < 10 || bet > 10000) {
        showResult('Invalid bet (10-10,000)', false);
        return;
    }

    isSpinning = true;

    // Immediately show bet deduction
    const balanceEl = document.getElementById('balance');
    const currentBalance = parseInt(balanceEl.textContent.replace(/,/g, '')) || 0;
    balanceEl.textContent = (currentBalance - bet).toLocaleString();

    try {
        const data = await apiCall('/api/rl/spin', {
            method: 'POST',
            body: JSON.stringify({ bet, betType, betValue })
        });

        // Check for error response
        if (data.error) {
            showResult(data.error, false);
            isSpinning = false;
            loadBalance();
            return;
        }

        // Spin the 3D wheel
        if (typeof spinWheel === 'function') {
            spinWheel(data.result);
        }

        // Wait for 3D animation to finish
        setTimeout(() => {
            // Show result
            const resultNum = document.getElementById('result-number');
            resultNum.textContent = data.result;
            resultNum.style.color = data.color === 'red' ? '#c41e3a' :
                                    data.color === 'green' ? '#0d6b32' : '#fff';

            if (data.won) {
                showResult(`WIN! +${data.winnings.toLocaleString()} chips`, true);
            } else {
                showResult(`${data.result} ${data.color.toUpperCase()} - Better luck next time`, false);
            }

            document.getElementById('balance').textContent = data.balance.toLocaleString();
            isSpinning = false;
        }, 5000);

    } catch (e) {
        showResult(e.message || 'Failed to spin', false);
        isSpinning = false;
    }
}

function showResult(message, won) {
    const display = document.getElementById('result-display');
    const text = display.querySelector('.result-text');
    text.textContent = message;
    text.className = 'result-text ' + (won ? 'win' : 'lose');
}
