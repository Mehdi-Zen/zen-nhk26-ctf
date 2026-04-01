/**
 * Crazy Casino - Blackjack Client
 */

let currentGameId = null;

const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

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
    document.getElementById('btn-deal').addEventListener('click', startGame);
    document.getElementById('btn-hit').addEventListener('click', hit);
    document.getElementById('btn-stand').addEventListener('click', stand);
    document.getElementById('btn-double').addEventListener('click', doubleDown);
    document.getElementById('btn-new-game').addEventListener('click', newGame);
}

async function loadBalance() {
    try {
        const data = await apiCall('/api/g/bal');
        document.getElementById('balance').textContent = data.b.toLocaleString();
    } catch (e) {
        console.error('Failed to load balance');
    }
}

async function startGame() {
    const bet = parseInt(document.getElementById('bet-amount').value);

    if (isNaN(bet) || bet < 10 || bet > 10000) {
        showStatus('Invalid bet amount (10-10,000)', '');
        return;
    }

    try {
        const data = await apiCall('/api/bj/start', {
            method: 'POST',
            body: JSON.stringify({ bet })
        });

        if (data.error) {
            showStatus(data.error, 'lose');
            return;
        }

        currentGameId = data.gameId;

        renderHand('dealer-hand', data.dealerHand);
        renderHand('player-hand', data.playerHand);

        document.getElementById('dealer-value').textContent = '?';
        document.getElementById('player-value').textContent = data.playerValue || 0;

        if (data.status === 'blackjack') {
            showResult('BLACKJACK!', data.winnings, 'blackjack');
        } else {
            showActionPanel();
            showStatus('Your turn', '');
        }

        loadBalance();

    } catch (e) {
        console.error('Start game error:', e);
        showStatus(e.message || 'Failed to start game', 'lose');
    }
}

async function hit() {
    if (!currentGameId) return;

    try {
        const data = await apiCall('/api/bj/hit', {
            method: 'POST',
            body: JSON.stringify({ gameId: currentGameId })
        });

        renderHand('player-hand', data.playerHand);
        document.getElementById('player-value').textContent = data.playerValue;

        if (data.status === 'bust') {
            showResult('BUST!', 0, 'lose');
            currentGameId = null;
        }

    } catch (e) {
        showStatus(e.message || 'Failed to hit', 'lose');
    }
}

async function stand() {
    if (!currentGameId) return;

    try {
        const data = await apiCall('/api/bj/stand', {
            method: 'POST',
            body: JSON.stringify({ gameId: currentGameId })
        });

        renderHand('dealer-hand', data.dealerHand);
        document.getElementById('dealer-value').textContent = data.dealerValue;
        document.getElementById('player-value').textContent = data.playerValue;

        let message, type;
        switch (data.status) {
            case 'win':
            case 'dealer_bust':
                message = data.status === 'dealer_bust' ? 'DEALER BUSTS!' : 'YOU WIN!';
                type = 'win';
                break;
            case 'lose':
                message = 'DEALER WINS';
                type = 'lose';
                break;
            case 'push':
                message = 'PUSH';
                type = 'push';
                break;
            default:
                message = data.status.toUpperCase();
                type = '';
        }

        showResult(message, data.winnings, type);
        currentGameId = null;
        loadBalance();

    } catch (e) {
        showStatus(e.message || 'Failed to stand', 'lose');
    }
}

async function doubleDown() {
    if (!currentGameId) return;

    try {
        const data = await apiCall('/api/bj/double', {
            method: 'POST',
            body: JSON.stringify({ gameId: currentGameId })
        });

        renderHand('player-hand', data.playerHand);
        document.getElementById('player-value').textContent = data.playerValue;

        if (data.dealerHand) {
            renderHand('dealer-hand', data.dealerHand);
            document.getElementById('dealer-value').textContent = data.dealerValue;
        }

        let message, type;
        switch (data.status) {
            case 'bust':
                message = 'BUST!';
                type = 'lose';
                break;
            case 'win':
            case 'dealer_bust':
                message = data.status === 'dealer_bust' ? 'DEALER BUSTS!' : 'YOU WIN!';
                type = 'win';
                break;
            case 'lose':
                message = 'DEALER WINS';
                type = 'lose';
                break;
            case 'push':
                message = 'PUSH';
                type = 'push';
                break;
            default:
                message = data.status.toUpperCase();
                type = '';
        }

        showResult(message, data.winnings, type);
        currentGameId = null;
        loadBalance();

    } catch (e) {
        showStatus(e.message || 'Insufficient balance', 'lose');
    }
}

function newGame() {
    currentGameId = null;
    document.getElementById('dealer-hand').innerHTML = '';
    document.getElementById('player-hand').innerHTML = '';
    document.getElementById('dealer-value').textContent = '';
    document.getElementById('player-value').textContent = '';
    document.getElementById('game-status').textContent = '';
    document.getElementById('game-status').className = 'game-status';

    showBettingPanel();
    loadBalance();
}

function renderHand(elementId, hand) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (!hand || !Array.isArray(hand)) return;

    hand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.style.animationDelay = `${index * 0.15}s`;

        if (card.value === 'hidden') {
            cardEl.className = 'card hidden-card';
        } else {
            cardEl.className = `card ${card.suit}`;
            const symbol = SUIT_SYMBOLS[card.suit] || '?';
            const displayValue = card.value;

            // Build card HTML with pips
            cardEl.innerHTML = buildCardHTML(displayValue, symbol);
        }

        container.appendChild(cardEl);
    });
}

function buildCardHTML(value, symbol) {
    const isFaceCard = ['J', 'Q', 'K'].includes(value);
    const isAce = value === 'A';

    // Top tab
    let html = `
        <div class="card__tab">
            ${value}<span class="card__tab__symbol">${symbol}</span>
        </div>
        <div class="card__tab card__tab--bottom">
            ${value}<span class="card__tab__symbol">${symbol}</span>
        </div>
        <div class="card__graphic">
    `;

    if (isFaceCard) {
        // Face cards: single large letter
        html += `<span class="pip face-pip">${value}</span>`;
    } else if (isAce) {
        // Ace: single large symbol
        html += `<span class="pip">${symbol}</span>`;
    } else {
        // Number cards: multiple pips
        const numPips = parseInt(value, 10);
        for (let i = 0; i < numPips; i++) {
            html += `<span class="pip">${symbol}</span>`;
        }
    }

    html += '</div>';
    return html;
}

function showStatus(message, type) {
    const status = document.getElementById('game-status');
    status.textContent = message;
    status.className = 'game-status ' + type;
}

function showBettingPanel() {
    document.getElementById('betting-panel').classList.remove('hidden');
    document.getElementById('action-panel').classList.add('hidden');
    document.getElementById('result-panel').classList.add('hidden');
}

function showActionPanel() {
    document.getElementById('betting-panel').classList.add('hidden');
    document.getElementById('action-panel').classList.remove('hidden');
    document.getElementById('result-panel').classList.add('hidden');
}

function showResult(message, winnings, type) {
    document.getElementById('betting-panel').classList.add('hidden');
    document.getElementById('action-panel').classList.add('hidden');
    document.getElementById('result-panel').classList.remove('hidden');

    const msgEl = document.getElementById('result-message');
    msgEl.textContent = message;
    msgEl.className = 'result-message ' + type;

    const winEl = document.getElementById('result-winnings');
    if (winnings > 0) {
        winEl.textContent = `+${winnings.toLocaleString()} chips`;
        winEl.className = 'result-winnings positive';
    } else {
        winEl.textContent = 'Better luck next time';
        winEl.className = 'result-winnings';
    }
}
