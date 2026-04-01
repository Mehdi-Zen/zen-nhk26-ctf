/**
 * Transaction Routes (Vault)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const serialize = require('node-serialize');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';

const verifyAccess = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // No hints about requirements
        if (decoded.lvl < 3 || decoded.bal < 1000000) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

router.get('/info', verifyAccess, (req, res) => {
    res.json({ status: 'locked' });
});

// VULNERABLE: Deserialization RCE
router.post('/process', verifyAccess, (req, res) => {
    try {
        const { d } = req.body;

        // SECURE: Validate d is a string with reasonable length
        if (!d || typeof d !== 'string' || d.length > 5000) {
            return res.status(400).json({ error: 'Bad request' });
        }

        let obj;
        try {
            obj = serialize.unserialize(d);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid' });
        }

        // Check for RCE evidence
        let f = null;
        try {
            if (fs.existsSync('/tmp/pwned') || fs.existsSync('/tmp/casino_pwned')) {
                f = fs.readFileSync('/flag.txt', 'utf8').trim();
                // Clean up so next player can't get it for free
                try { fs.unlinkSync('/tmp/pwned'); } catch (e) {}
                try { fs.unlinkSync('/tmp/casino_pwned'); } catch (e) {}
            }
        } catch (e) {}

        res.json({ s: 'processed', f: f });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

router.get('/check', verifyAccess, (req, res) => {
    let f = null;
    try {
        if (fs.existsSync('/tmp/pwned') || fs.existsSync('/tmp/casino_pwned')) {
            f = fs.readFileSync('/flag.txt', 'utf8').trim();
            try { fs.unlinkSync('/tmp/pwned'); } catch (e) {}
            try { fs.unlinkSync('/tmp/casino_pwned'); } catch (e) {}
        }
    } catch (e) {}

    res.json({ s: f ? 'breached' : 'secure', f: f });
});

module.exports = router;
