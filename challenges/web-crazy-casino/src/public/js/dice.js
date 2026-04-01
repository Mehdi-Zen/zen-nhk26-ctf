/**
 * Crazy Casino - Dice Client
 */

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

let isRolling = false;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadBalance();
    setupEventListeners();
});

function setupEventListeners() {
    // Target slider
    const slider = document.getElementById('target-slider');
    slider.addEventListener('input', () => {
        const val = slider.value;
        document.getElementById('target-display').textContent = val;
        document.getElementById('over-target').textContent = val;
        document.getElementById('under-target').textContent = val;
    });

    // Over/Under buttons
    document.getElementById('btn-over').addEventListener('click', () => {
        const target = parseInt(document.getElementById('target-slider').value);
        placeBet('over', target);
    });

    document.getElementById('btn-under').addEventListener('click', () => {
        const target = parseInt(document.getElementById('target-slider').value);
        placeBet('under', target);
    });

    // Exact buttons
    document.querySelectorAll('.exact-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value);
            placeBet('exact', value);
        });
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

async function placeBet(type, target) {
    if (isRolling) return;

    const bet = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(bet) || bet < 10 || bet > 10000) {
        showResult('Invalid bet (10-10,000)', false);
        return;
    }

    isRolling = true;

    // Immediately show bet deduction
    const balanceEl = document.getElementById('balance');
    const currentBalance = parseInt(balanceEl.textContent.replace(/,/g, '')) || 0;
    balanceEl.textContent = (currentBalance - bet).toLocaleString();

    // Roll animation
    const die1 = document.getElementById('die1');
    const die2 = document.getElementById('die2');
    die1.classList.add('rolling');
    die2.classList.add('rolling');

    // Animate dice faces during roll
    const rollInterval = setInterval(() => {
        die1.querySelector('.die-face').textContent = DIE_FACES[Math.floor(Math.random() * 6)];
        die2.querySelector('.die-face').textContent = DIE_FACES[Math.floor(Math.random() * 6)];
    }, 100);

    try {
        const data = await apiCall('/api/dc/roll', {
            method: 'POST',
            body: JSON.stringify({
                bet,
                prediction: { type, target }
            })
        });

        // Wait a bit for effect
        setTimeout(() => {
            clearInterval(rollInterval);
            die1.classList.remove('rolling');
            die2.classList.remove('rolling');

            // Check for error response
            if (data.error) {
                showResult(data.error, false);
                isRolling = false;
                loadBalance();
                return;
            }

            // Show final dice
            die1.querySelector('.die-face').textContent = DIE_FACES[data.dice[0] - 1];
            die2.querySelector('.die-face').textContent = DIE_FACES[data.dice[1] - 1];

            // Show total
            document.getElementById('total').textContent = data.total;

            // Show result
            if (data.won) {
                showResult(`WIN! +${data.winnings.toLocaleString()} chips`, true);
            } else {
                showResult(`Total: ${data.total} - Better luck next time`, false);
            }

            document.getElementById('balance').textContent = data.balance.toLocaleString();
            isRolling = false;
        }, 1000);

    } catch (e) {
        clearInterval(rollInterval);
        die1.classList.remove('rolling');
        die2.classList.remove('rolling');
        showResult(e.message || 'Failed to roll', false);
        isRolling = false;
    }
}

function showResult(message, won) {
    const el = document.getElementById('result-message');
    el.textContent = message;
    el.className = 'result-message ' + (won ? 'win' : 'lose');
}
