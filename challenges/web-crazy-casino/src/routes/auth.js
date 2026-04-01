/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const db = new Database('/data/casino.db');
const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';

const FRAGMENT_2 = '61mvadGxV';

// Input validation helpers
const isValidUsername = (u) => typeof u === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(u);
const isValidPassword = (p) => typeof p === 'string' && p.length >= 4 && p.length <= 100;

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Bad request' });
        }

        // SECURE: Validate username format (alphanumeric + underscore, 3-20 chars)
        if (!isValidUsername(username)) {
            return res.status(400).json({ error: 'Bad request' });
        }

        // SECURE: Validate password length
        if (!isValidPassword(password)) {
            return res.status(400).json({ error: 'Bad request' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(409).json({ error: 'Conflict' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);

        const redis = req.app.get('redis');
        await redis.set(`balance:${result.lastInsertRowid}`, '1000');

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('[REGISTER ERROR]', error);
        res.status(500).json({ error: 'Error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Bad request' });
        }

        // SECURE: Validate input types and lengths
        if (!isValidUsername(username) || !isValidPassword(password)) {
            return res.status(400).json({ error: 'Bad request' });
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const redis = req.app.get('redis');
        let balance = await redis.get(`balance:${user.id}`);
        balance = parseInt(balance) || 1000;

        // VULNERABLE: balance and vip_level in token
        const token = jwt.sign({
            sub: user.id,
            usr: user.username,
            bal: balance,
            lvl: 0,
            iat: Math.floor(Date.now() / 1000)
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token: token });
    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        res.status(500).json({ error: 'Error' });
    }
});

router.get('/me', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        let data = {
            id: decoded.sub,
            username: decoded.usr,
            balance: decoded.bal,
            level: decoded.lvl
        };

        // Fragment revealed only if JWT was forged correctly
        if (decoded.lvl >= 3 && decoded.bal >= 1000000) {
            data.msg = FRAGMENT_2;
        }

        res.json(data);
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

module.exports = router;
