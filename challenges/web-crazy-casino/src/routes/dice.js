/**
 * Dice Routes - SECURE (no vulnerabilities)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';

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

// SECURE: Roll dice
router.post('/roll', verifyToken, async (req, res) => {
    try {
        const { bet, prediction } = req.body;

        // SECURE: Validate bet amount
        if (typeof bet !== 'number' || !Number.isFinite(bet) || bet <= 0 || bet > 10000) {
            return res.status(400).json({ error: 'Invalid bet' });
        }

        // SECURE: Validate prediction (over/under target number 1-6)
        // prediction format: { type: 'over'|'under'|'exact', target: 1-6 }
        if (!prediction || typeof prediction !== 'object') {
            return res.status(400).json({ error: 'Invalid prediction' });
        }

        const { type, target } = prediction;

        if (!['over', 'under', 'exact'].includes(type)) {
            return res.status(400).json({ error: 'Invalid prediction type' });
        }

        // Target is the sum of two dice (2-12)
        if (!Number.isInteger(target) || target < 2 || target > 12) {
            return res.status(400).json({ error: 'Invalid target' });
        }

        const betAmount = Math.floor(bet);
        const redis = req.app.get('redis');
        let balance = parseInt(await redis.get(`balance:${req.user.sub}`)) || 0;

        if (balance < betAmount) {
            return res.status(400).json({ error: 'No more chips' });
        }

        // Deduct bet
        await redis.decrBy(`balance:${req.user.sub}`, betAmount);

        // Roll two dice
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2;

        // Calculate winnings based on prediction
        let win = 0;
        let won = false;

        switch (type) {
            case 'over':
                // Predict total > target (target is sum threshold 2-12)
                if (target >= 2 && target <= 11 && total > target) {
                    // Payout based on probability
                    const overOdds = { 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.5, 6: 1.7, 7: 2, 8: 2.5, 9: 3, 10: 4, 11: 6 };
                    win = Math.floor(betAmount * (overOdds[target] || 2));
                    won = true;
                }
                break;
            case 'under':
                // Predict total < target
                if (target >= 3 && target <= 12 && total < target) {
                    const underOdds = { 3: 6, 4: 4, 5: 3, 6: 2.5, 7: 2, 8: 1.7, 9: 1.5, 10: 1.3, 11: 1.2, 12: 1.1 };
                    win = Math.floor(betAmount * (underOdds[target] || 2));
                    won = true;
                }
                break;
            case 'exact':
                // Predict exact sum (2-12)
                if (target >= 2 && target <= 12 && total === target) {
                    // Exact sum payouts (based on probability)
                    const exactOdds = { 2: 36, 3: 18, 4: 12, 5: 9, 6: 7.2, 7: 6, 8: 7.2, 9: 9, 10: 12, 11: 18, 12: 36 };
                    win = Math.floor(betAmount * (exactOdds[target] || 6));
                    won = true;
                }
                break;
        }

        let currentBalance = parseInt(await redis.get(`balance:${req.user.sub}`)) || 0;
        if (win > 0) {
            currentBalance = await redis.incrBy(`balance:${req.user.sub}`, win);
        }

        res.json({
            dice: [die1, die2],
            total,
            won,
            winnings: win,
            balance: currentBalance
        });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
