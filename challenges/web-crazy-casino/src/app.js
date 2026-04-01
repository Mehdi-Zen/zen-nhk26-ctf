/**
 * Crazy Casino - NHK26 INSANE Web Challenge
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { createClient } = require('redis');

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const vipRoutes = require('./routes/vip');
const vaultRoutes = require('./routes/vault');
const blackjackRoutes = require('./routes/blackjack');
const rouletteRoutes = require('./routes/roulette');
const diceRoutes = require('./routes/dice');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ SECURITY HARDENING ============

// Rate limiting store (in-memory)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_AUTH = 20;
const RATE_LIMIT_MAX_API = 60;
const RATE_LIMIT_MAX_GAME = 200;

const rateLimit = (maxReq) => (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, start: now });
        return next();
    }

    const record = rateLimitStore.get(key);
    if (now - record.start > RATE_LIMIT_WINDOW) {
        rateLimitStore.set(key, { count: 1, start: now });
        return next();
    }

    record.count++;
    if (record.count > maxReq) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    next();
};

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.start > RATE_LIMIT_WINDOW * 2) {
            rateLimitStore.delete(key);
        }
    }
}, 300000);

// Security headers middleware
const securityHeaders = (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'");
    next();
};

app.use(securityHeaders);
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', err => console.log('Redis Error', err));
redisClient.connect();

app.set('redis', redisClient);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ HIDDEN JWT SECRET - HEADER BASED ============

// Part 1: Hidden in X-Request-Id header when JSON parse error occurs
app.use(express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            // Leak part 1 in header on parse error
            res.setHeader('X-Request-Id', 'err_OHBSVVpVd2s');
        }
    }
}));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Part 2: Hidden in header when specific User-Agent pattern is used
// Must analyze CSS to find the magic UA string (hex encoded)
app.use((req, res, next) => {
    if (req.headers['user-agent'] && req.headers['user-agent'].includes('VaultMgr/865')) {
        res.setHeader('X-Debug-Token', 'VjZnR1Y3Njc');
    }
    next();
});

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Health check - minimal
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Decoy endpoints to waste time
app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /admin/\nDisallow: /private/');
});
app.get('/admin', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.get('/private', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.get('/.git', (req, res) => res.status(404).json({ error: 'Not found' }));
app.get('/.env', (req, res) => res.status(404).json({ error: 'Not found' }));
app.get('/backup', (req, res) => res.status(404).json({ error: 'Not found' }));

// ============ MAIN ROUTES - OBSCURED PATHS ============

app.use('/auth', rateLimit(RATE_LIMIT_MAX_AUTH), authRoutes);
app.use('/api/g', rateLimit(RATE_LIMIT_MAX_GAME), gamesRoutes);
app.use('/api/m', rateLimit(RATE_LIMIT_MAX_API), vipRoutes);
app.use('/api/t', rateLimit(RATE_LIMIT_MAX_API), vaultRoutes);
app.use('/api/bj', rateLimit(RATE_LIMIT_MAX_API), blackjackRoutes);
app.use('/api/rl', rateLimit(RATE_LIMIT_MAX_GAME), rouletteRoutes);
app.use('/api/dc', rateLimit(RATE_LIMIT_MAX_GAME), diceRoutes);

// Pages
app.get('/', (req, res) => res.render('index'));
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get('/vip', (req, res) => res.render('vip'));
app.get('/blackjack', (req, res) => res.render('blackjack'));
app.get('/roulette', (req, res) => res.render('roulette'));
app.get('/dice', (req, res) => res.render('dice'));

// Error - no details
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Error' });
});

// 404 - no hints
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server on ${PORT}`);
});

module.exports = app;
