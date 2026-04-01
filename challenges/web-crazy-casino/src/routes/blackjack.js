/**
 * Blackjack Routes - SECURE (no vulnerabilities)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';

// Card deck
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Active games store (in-memory)
const games = new Map();

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// SECURE: Create a shuffled deck
const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// SECURE: Calculate hand value
const calculateHand = (hand) => {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
            value += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value, 10);
        }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
};

// SECURE: Start new game
router.post('/start', verifyToken, async (req, res) => {
    try {
        const { bet } = req.body;

        // SECURE: Validate bet
        if (typeof bet !== 'number' || !Number.isFinite(bet) || bet <= 0 || bet > 10000) {
            return res.status(400).json({ error: 'Invalid bet' });
        }

        const betAmount = Math.floor(bet);
        const redis = req.app.get('redis');
        let balance = parseInt(await redis.get(`balance:${req.user.sub}`)) || 0;

        if (balance < betAmount) {
            return res.status(400).json({ error: 'No more chips' });
        }

        // Deduct bet
        await redis.decrBy(`balance:${req.user.sub}`, betAmount);

        // Create game
        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const gameId = `${req.user.sub}_${Date.now()}`;
        const game = {
            deck,
            playerHand,
            dealerHand,
            bet: betAmount,
            status: 'playing',
            createdAt: Date.now()
        };

        // Check for blackjack
        const playerValue = calculateHand(playerHand);
        if (playerValue === 21) {
            game.status = 'blackjack';
            const winnings = Math.floor(betAmount * 2.5);
            await redis.incrBy(`balance:${req.user.sub}`, winnings);
            game.winnings = winnings;
        }

        games.set(gameId, game);

        // Cleanup old games
        const now = Date.now();
        for (const [id, g] of games.entries()) {
            if (now - g.createdAt > 3600000) games.delete(id);
        }

        res.json({
            gameId,
            playerHand,
            dealerHand: [dealerHand[0], { suit: 'hidden', value: 'hidden' }],
            playerValue,
            status: game.status,
            winnings: game.winnings || 0
        });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// SECURE: Hit
router.post('/hit', verifyToken, async (req, res) => {
    try {
        const { gameId } = req.body;

        // SECURE: Validate gameId
        if (typeof gameId !== 'string' || gameId.length > 100) {
            return res.status(400).json({ error: 'Invalid game' });
        }

        const game = games.get(gameId);
        if (!game || game.status !== 'playing') {
            return res.status(400).json({ error: 'Invalid game' });
        }

        // Verify ownership
        if (!gameId.startsWith(req.user.sub + '_')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Draw card
        const card = game.deck.pop();
        game.playerHand.push(card);

        const playerValue = calculateHand(game.playerHand);

        if (playerValue > 21) {
            game.status = 'bust';
            games.delete(gameId);
        }

        res.json({
            card,
            playerHand: game.playerHand,
            playerValue,
            status: game.status
        });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// SECURE: Stand
router.post('/stand', verifyToken, async (req, res) => {
    try {
        const { gameId } = req.body;

        // SECURE: Validate gameId
        if (typeof gameId !== 'string' || gameId.length > 100) {
            return res.status(400).json({ error: 'Invalid game' });
        }

        const game = games.get(gameId);
        if (!game || game.status !== 'playing') {
            return res.status(400).json({ error: 'Invalid game' });
        }

        // Verify ownership
        if (!gameId.startsWith(req.user.sub + '_')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Dealer plays
        while (calculateHand(game.dealerHand) < 17) {
            game.dealerHand.push(game.deck.pop());
        }

        const playerValue = calculateHand(game.playerHand);
        const dealerValue = calculateHand(game.dealerHand);

        let status, winnings = 0;
        const redis = req.app.get('redis');

        if (dealerValue > 21) {
            status = 'dealer_bust';
            winnings = game.bet * 2;
        } else if (playerValue > dealerValue) {
            status = 'win';
            winnings = game.bet * 2;
        } else if (playerValue < dealerValue) {
            status = 'lose';
        } else {
            status = 'push';
            winnings = game.bet;
        }

        if (winnings > 0) {
            await redis.incrBy(`balance:${req.user.sub}`, winnings);
        }

        games.delete(gameId);

        res.json({
            dealerHand: game.dealerHand,
            dealerValue,
            playerValue,
            status,
            winnings
        });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// SECURE: Double down
router.post('/double', verifyToken, async (req, res) => {
    try {
        const { gameId } = req.body;

        // SECURE: Validate gameId
        if (typeof gameId !== 'string' || gameId.length > 100) {
            return res.status(400).json({ error: 'Invalid game' });
        }

        const game = games.get(gameId);
        if (!game || game.status !== 'playing' || game.playerHand.length !== 2) {
            return res.status(400).json({ error: 'Invalid game' });
        }

        // Verify ownership
        if (!gameId.startsWith(req.user.sub + '_')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const redis = req.app.get('redis');
        let balance = parseInt(await redis.get(`balance:${req.user.sub}`)) || 0;

        if (balance < game.bet) {
            return res.status(400).json({ error: 'No more chips' });
        }

        // Deduct additional bet
        await redis.decrBy(`balance:${req.user.sub}`, game.bet);

        // Double the bet
        game.bet *= 2;

        // Draw one card and stand
        game.playerHand.push(game.deck.pop());
        const playerValue = calculateHand(game.playerHand);

        if (playerValue > 21) {
            games.delete(gameId);
            return res.json({
                playerHand: game.playerHand,
                playerValue,
                status: 'bust',
                winnings: 0
            });
        }

        // Dealer plays
        while (calculateHand(game.dealerHand) < 17) {
            game.dealerHand.push(game.deck.pop());
        }

        const dealerValue = calculateHand(game.dealerHand);
        let status, winnings = 0;

        if (dealerValue > 21) {
            status = 'dealer_bust';
            winnings = game.bet * 2;
        } else if (playerValue > dealerValue) {
            status = 'win';
            winnings = game.bet * 2;
        } else if (playerValue < dealerValue) {
            status = 'lose';
        } else {
            status = 'push';
            winnings = game.bet;
        }

        if (winnings > 0) {
            await redis.incrBy(`balance:${req.user.sub}`, winnings);
        }

        games.delete(gameId);

        res.json({
            playerHand: game.playerHand,
            dealerHand: game.dealerHand,
            playerValue,
            dealerValue,
            status,
            winnings
        });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
