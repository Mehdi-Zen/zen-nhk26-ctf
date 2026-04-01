/**
 * Games Routes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';
const FRAGMENT_1 = 'NHK26{3ZJ';

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

router.get('/bal', verifyToken, async (req, res) => {
    try {
        const redis = req.app.get('redis');
        let balance = await redis.get(`balance:${req.user.sub}`);
        res.json({ b: parseInt(balance) || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// VULNERABLE: Race condition
router.post('/play', verifyToken, async (req, res) => {
    try {
        const { amt } = req.body;

        // SECURE: Validate amt is a number type and within bounds
        if (typeof amt !== 'number' || !Number.isFinite(amt)) {
            return res.status(400).json({ error: 'Invalid' });
        }

        const betAmount = Math.floor(amt);

        if (betAmount <= 0 || betAmount > 10000) {
            return res.status(400).json({ error: 'Invalid' });
        }

        const redis = req.app.get('redis');

        // VULN: No lock
        let balance = await redis.get(`balance:${req.user.sub}`);
        balance = parseInt(balance) || 0;

        if (balance < betAmount) {
            return res.status(400).json({ error: 'No more chips' });
        }

        // Delay for race condition exploit (200ms window)
        await new Promise(resolve => setTimeout(resolve, 200));

        // VULN: Using atomic decrBy AFTER the check - allows race condition
        // Multiple requests can pass the balance check, then each atomically decrements
        const newBalance = await redis.decrBy(`balance:${req.user.sub}`, betAmount);

        // Slots
        const sym = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const r1 = sym[Math.floor(Math.random() * sym.length)];
        const r2 = sym[Math.floor(Math.random() * sym.length)];
        const r3 = sym[Math.floor(Math.random() * sym.length)];

        let win = 0;
        if (r1 === r2 && r2 === r3) win = betAmount * 10;
        else if (r1 === r2 || r2 === r3 || r1 === r3) win = betAmount * 2;

        let currentBalance = newBalance;
        if (win > 0) {
            currentBalance = await redis.incrBy(`balance:${req.user.sub}`, win);
        }

        let result = { r: [r1, r2, r3], w: win, b: currentBalance };

        // Fragment only if exploited
        if (currentBalance < -1000 || currentBalance > 100000) {
            result.f = FRAGMENT_1;
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

router.get('/top', async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const keys = await redis.keys('balance:*');

        // SECURE: Limit keys processed to prevent DoS
        const limitedKeys = keys.slice(0, 100);
        const list = [];

        for (const key of limitedKeys) {
            const id = key.split(':')[1];
            // SECURE: Validate id is numeric
            if (/^\d+$/.test(id)) {
                const b = parseInt(await redis.get(key)) || 0;
                list.push({ id, b });
            }
        }
        list.sort((a, b) => b.b - a.b);
        res.json({ l: list.slice(0, 10) });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
