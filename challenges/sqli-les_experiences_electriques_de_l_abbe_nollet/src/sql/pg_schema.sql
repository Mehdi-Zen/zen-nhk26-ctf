-- PostgreSQL schema — Nollet CTF Partie 2 : Time-based blind SQLi
SET client_encoding = 'UTF8';

-- Timeout généreux : pg_sleep(3) doit pouvoir s'exécuter sans être coupé
ALTER ROLE nollet_api SET statement_timeout = '15s';

-- Grant explicite sur pg_sleep pour le rôle nollet_api
GRANT EXECUTE ON FUNCTION pg_sleep(double precision) TO nollet_api;

CREATE SCHEMA IF NOT EXISTS lab AUTHORIZATION nollet_api;
SET search_path = lab, public;

-- Droits d'accès pour nollet_api sur tout le schéma lab
GRANT USAGE ON SCHEMA lab TO nollet_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA lab GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nollet_api;

-- ─────────────────────────────────────────────────────────────
-- FLAG — cible de l'exfiltration time-based
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flags (
  id        INT PRIMARY KEY,
  flag_value TEXT NOT NULL
);
TRUNCATE flags;
INSERT INTO flags (id, flag_value) VALUES (1, 'NHK26{CH4INE_HUMAINE_M0DE_CH4T4IGNE_1746}');

-- ─────────────────────────────────────────────────────────────
-- rapports — table injectable (endpoint /api/v1/rapport)
-- Le paramètre auteur est injecté directement dans la requête
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rapports (
  id         BIGSERIAL PRIMARY KEY,
  auteur     TEXT NOT NULL,
  titre      TEXT NOT NULL,
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
TRUNCATE rapports RESTART IDENTITY;
INSERT INTO rapports (auteur, titre, contenu) VALUES
('admin_nollet',      'Classification Royale',   'Accès réservé. Les archives du Cabinet de Versailles sont scellées.'),
('admin_nollet',      'Chaîne humaine — 1746',   'Décharge simultanée observée sur 180 participants dans la galerie.'),
('scribe_versailles', 'Registre des accrédités', 'Les membres de rang MAITRE disposent d''un accès intégral aux archives.'),
('scribe_versailles', 'Note de sécurité',        'Les jetons JWT expirent après 20 minutes. Renouveler après chaque session.');

-- ─────────────────────────────────────────────────────────────
-- Données honeypots des endpoints /api/v1/*
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiences (
  id          BIGSERIAL PRIMARY KEY,
  tier        TEXT NOT NULL,
  nom         TEXT NOT NULL,
  description TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_experiences_tier ON experiences(tier);
TRUNCATE experiences RESTART IDENTITY;
INSERT INTO experiences (tier, nom, description) VALUES
('NOVICE', 'Galerie des Glaces',       'Chaîne humaine : propagation instantanée, Versailles 1746.'),
('NOVICE', 'Instrumentarium',          'Inventaire des bobines, électroscopes et verreries.'),
('ADEPT',  'Bouteille de Leyde',       'Charge/décharge : mesures et effets de commotion.'),
('ADEPT',  'Cabinet de curiosités',    'Archives croisées : correspondances et registres 1746-1750.'),
('MAITRE', 'Classification Royale',    'Accès scellé : index des coffres et protocoles secrets.');

CREATE TABLE IF NOT EXISTS classification_docs (
  id      BIGSERIAL PRIMARY KEY,
  level   TEXT NOT NULL,
  titre   TEXT NOT NULL,
  contenu TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_classification_level ON classification_docs(level);
TRUNCATE classification_docs RESTART IDENTITY;
INSERT INTO classification_docs (level, titre, contenu) VALUES
('PUBLIC',       'Note de laboratoire',      'Les expériences publiques sont consultables sans accréditation.'),
('CONFIDENTIEL', 'Procédure de calibration', 'La calibration des instruments AES requiert une clé de 32 octets.'),
('SECRET',       'Index des scellés',        'Les scellés de Versailles référencent les archives de la base de rapports.');

CREATE TABLE IF NOT EXISTS secrets (
  id   BIGSERIAL PRIMARY KEY,
  ref  TEXT NOT NULL,
  note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_secrets_ref ON secrets(ref);
TRUNCATE secrets RESTART IDENTITY;
INSERT INTO secrets (ref, note) VALUES
('SCEAU-VERSAILLES',   'Le sceau déchiffré produit un jeton JWT donnant accès aux rapports.'),
('RAPPORTS-PG',        'La base de rapports PostgreSQL accepte des requêtes d''auteur. Certains paramètres sont sensibles.'),
('ARCHIVES-1746',      'Les archives temporisées répondent différemment selon la véracité de la condition testée.');
