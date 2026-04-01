-- Crazy Casino Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    game TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vip_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    vip_level INTEGER DEFAULT 1,
    secret_note TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- VIP members - fragment hidden among noise
INSERT INTO vip_members (username, vip_level, secret_note) VALUES
    ('xX_player_Xx', 3, 'acc:7291'),
    ('monaco_whale', 3, 'acc:4582'),
    ('lucky_star', 2, 'acc:1133'),
    ('system_vault', 3, '3M1J2Z1Zp'),
    ('diamond_vip', 3, 'acc:9920'),
    ('high_stakes', 3, 'acc:3847'),
    ('golden_ace', 2, 'acc:5561');

CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    total_winnings INTEGER DEFAULT 0,
    biggest_win INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
