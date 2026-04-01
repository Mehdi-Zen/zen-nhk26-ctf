/**
 * VIP/Members Routes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const db = new Database('/data/casino.db');
const JWT_SECRET = process.env.JWT_SECRET || '8pRUZUwkV6gGV767';

const verifyVIP = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // Check VIP level - no hint given
        if (decoded.lvl < 3) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

router.get('/info', verifyVIP, (req, res) => {
    res.json({ status: 'active' });
});

// "Sanitize" input - blocks obvious __proto__ but misses constructor.prototype
const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const clean = {};
    for (const key of Object.keys(obj)) {
        // "Security" filter - blocks __proto__ keyword (the obvious attack vector)
        // But misses constructor.prototype (the advanced bypass)
        if (key === '__proto__') {
            continue; // Skip dangerous key
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            clean[key] = sanitize(obj[key]);
        } else {
            clean[key] = obj[key];
        }
    }
    return clean;
};

// Whitelist of allowed column names - prevents SQL injection
const ALLOWED_COLUMNS = ['username', 'vip_level', 'created_at'];
const SAFE_COL_REGEX = /^[a-z_]+$/;

// VULNERABLE: Prototype Pollution via constructor.prototype bypass
router.post('/q', verifyVIP, (req, res) => {
    try {
        const { cfg } = req.body;

        // Vulnerable recursive merge (sanitized but bypassable)
        const extend = (dst, src) => {
            for (const k in src) {
                if (typeof src[k] === 'object' && src[k] !== null && !Array.isArray(src[k])) {
                    if (!dst[k]) dst[k] = {};
                    extend(dst[k], src[k]);
                } else {
                    dst[k] = src[k];
                }
            }
            return dst;
        };

        let opts = { cols: ['username', 'vip_level'], filter: null };

        if (cfg) {
            // Apply "sanitization" before merge
            const safeCfg = sanitize(cfg);
            extend(opts, safeCfg);
        }

        // Check prototype pollution - obscure property name (hex-like)
        const check = {};

        // SECURE: Validate columns against whitelist + regex to prevent SQL injection
        const validCols = Array.isArray(opts.cols)
            ? opts.cols.filter(c => typeof c === 'string' && SAFE_COL_REGEX.test(c) && ALLOWED_COLUMNS.includes(c))
            : ['username', 'vip_level'];

        if (validCols.length === 0) {
            validCols.push('username', 'vip_level');
        }

        let columns = validCols.join(', ');
        let query = `SELECT ${columns} FROM vip_members`;

        if (opts.filter && typeof opts.filter === 'string' && opts.filter.length <= 50) {
            query += ` WHERE username = ?`;
            const results = db.prepare(query).all(opts.filter);
            return res.json({ c: results.length, d: results });
        }

        // Polluted prototype grants access to secret_note
        // Property name looks like memory address - hard to guess
        if (check._0x7f3e) {
            query = 'SELECT username, vip_level, secret_note FROM vip_members WHERE vip_level >= 3';
        }

        const results = db.prepare(query).all();
        res.json({ c: results.length, d: results });

    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
