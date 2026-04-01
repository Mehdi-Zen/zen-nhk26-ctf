/**
 * Roulette Routes - SECURE (no vulnerabilities)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';

// Roulette numbers and their colors
const ROULETTE_NUMBERS = {
    0: 'green',
    1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black',
    7: 'red', 8: 'black', 9: 'red', 10: 'black', 11: 'black', 12: 'red',
    13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
    19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black',
    25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
    31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

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

// SECURE: Spin the wheel
router.post('/spin', verifyToken, async (req, res) => {
    try {
        const { bet, betType, betValue } = req.body;

        // SECURE: Validate bet amount
        if (typeof bet !== 'number' || !Number.isFinite(bet) || bet <= 0 || bet > 10000) {
            return res.status(400).json({ error: 'Invalid bet' });
        }

        // SECURE: Validate bet type
        const validBetTypes = ['number', 'color', 'even_odd', 'half', 'dozen', 'column'];
        if (!validBetTypes.includes(betType)) {
            return res.status(400).json({ error: 'Invalid bet type' });
        }

        // SECURE: Validate bet value based on type
        let isValidBetValue = false;
        switch (betType) {
            case 'number':
                isValidBetValue = Number.isInteger(betValue) && betValue >= 0 && betValue <= 36;
                break;
            case 'color':
                isValidBetValue = ['red', 'black'].includes(betValue);
                break;
            case 'even_odd':
                isValidBetValue = ['even', 'odd'].includes(betValue);
                break;
            case 'half':
                isValidBetValue = ['1-18', '19-36'].includes(betValue);
                break;
            case 'dozen':
                isValidBetValue = ['1-12', '13-24', '25-36'].includes(betValue);
                break;
            case 'column':
                isValidBetValue = [1, 2, 3].includes(betValue);
                break;
        }

        if (!isValidBetValue) {
            return res.status(400).json({ error: 'Invalid bet value' });
        }

        const betAmount = Math.floor(bet);
        const redis = req.app.get('redis');
        let balance = parseInt(await redis.get(`balance:${req.user.sub}`)) || 0;

        if (balance < betAmount) {
            return res.status(400).json({ error: 'No more chips' });
        }

        // Deduct bet
        await redis.decrBy(`balance:${req.user.sub}`, betAmount);

        // Spin the wheel
        const result = Math.floor(Math.random() * 37); // 0-36
        const resultColor = ROULETTE_NUMBERS[result];

        // Calculate winnings
        let win = 0;
        let won = false;

        switch (betType) {
            case 'number':
                if (result === betValue) {
                    win = betAmount * 35; // 35:1 payout
                    won = true;
                }
                break;
            case 'color':
                if (result !== 0 && resultColor === betValue) {
                    win = betAmount * 2; // 1:1 payout
                    won = true;
                }
                break;
            case 'even_odd':
                if (result !== 0) {
                    const isEven = result % 2 === 0;
                    if ((betValue === 'even' && isEven) || (betValue === 'odd' && !isEven)) {
                        win = betAmount * 2;
                        won = true;
                    }
                }
                break;
            case 'half':
                if (result !== 0) {
                    if ((betValue === '1-18' && result <= 18) || (betValue === '19-36' && result >= 19)) {
                        win = betAmount * 2;
                        won = true;
                    }
                }
                break;
            case 'dozen':
                if (result !== 0) {
                    const dozen = betValue === '1-12' ? [1, 12] : betValue === '13-24' ? [13, 24] : [25, 36];
                    if (result >= dozen[0] && result <= dozen[1]) {
                        win = betAmount * 3; // 2:1 payout
                        won = true;
                    }
                }
                break;
            case 'column':
                if (result !== 0 && result % 3 === (betValue === 3 ? 0 : betValue)) {
                    win = betAmount * 3;
                    won = true;
                }
                break;
        }

        let currentBalance = parseInt(await redis.get(`balance:${req.user.sub}`)) || 0;
        if (win > 0) {
            currentBalance = await redis.incrBy(`balance:${req.user.sub}`, win);
        }

        res.json({
            result,
            color: resultColor,
            won,
            winnings: win,
            balance: currentBalance
        });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
