SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS nollet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'nollet'@'localhost' IDENTIFIED BY 'nolletpass';
CREATE USER IF NOT EXISTS 'nollet'@'127.0.0.1' IDENTIFIED BY 'nolletpass';
GRANT ALL PRIVILEGES ON nollet.* TO 'nollet'@'localhost';
GRANT ALL PRIVILEGES ON nollet.* TO 'nollet'@'127.0.0.1';
FLUSH PRIVILEGES;

USE nollet;

-- ─────────────────────────────────────────────────────────────
-- Auth
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nom_plume   VARCHAR(64)  NOT NULL UNIQUE,
  pass_sha256 CHAR(64)     NOT NULL,
  rang        ENUM('NOVICE','ADEPT','MAITRE') NOT NULL DEFAULT 'NOVICE',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO users (nom_plume, pass_sha256, rang)
VALUES ('admin_nollet', SHA2('nollet1746', 256), 'MAITRE');

-- ─────────────────────────────────────────────────────────────
-- Second-order SQLi : préférences → journal
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS report_prefs;
CREATE TABLE report_prefs (
  user_id    INT  PRIMARY KEY,
  pref_enc   TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
  id      INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action  VARCHAR(255) NOT NULL,
  detail  TEXT,
  date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO logs (user_id, action, detail) VALUES
(1,    'connexion',    'Accès portail principal — session établie'),
(1,    'export',       'Rapport mensuel généré'),
(1,    'modification', 'Mise à jour paramètres expérience galerie'),
(1,    'connexion',    'Session longue durée autorisée'),
(1,    'export',       'Archive 1746 consultée'),
(NULL, 'tentative',    'Accès refusé — identifiants invalides'),
(NULL, 'tentative',    'Accès refusé — identifiants invalides (2ème tentative)'),
(1,    'validation',   'Sceau de Versailles vérifié'),
(1,    'export',       'Carnet expériences synchronisé');

-- ─────────────────────────────────────────────────────────────
-- CIBLE de l'exfiltration : config_laboratoire
-- Mélange config système ordinaire + 20 clés de backup hex.
-- Le joueur énumère les tables, tombe dessus, repère les backup_enc_*
-- et doit les tester toutes sur le Sceau (une seule fonctionne : #09).
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS config_laboratoire;
CREATE TABLE config_laboratoire (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  cle_config  VARCHAR(64) NOT NULL UNIQUE,
  valeur      TEXT        NOT NULL,
  description VARCHAR(255)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO config_laboratoire (cle_config, valeur, description) VALUES
('theme',              'parchemin_sombre',  'Thème visuel de l''interface'),
('langue',             'fr_FR',             'Langue de l''interface'),
('session_timeout',    '1800',              'Durée de session en secondes'),
('max_login_attempts', '5',                 'Tentatives de connexion maximum'),
('log_level',          'INFO',              'Niveau de journalisation'),
('smtp_host',          '127.0.0.1',         'Serveur SMTP interne'),
('smtp_port',          '25',                'Port SMTP'),
('maintenance_mode',   '0',                 'Mode maintenance (0=désactivé)'),
('api_rate_limit',     '100',               'Requêtes API max par minute'),
('secret_pepper',      'nollet-academie',   'Sel de hachage applicatif'),
('backup_enc_01', 'dced629e4af2f32f7abfde977d40a5be8c795f1e40947929fb966fa512b0f79e', 'Clé de sauvegarde chiffrée #01'),
('backup_enc_02', '11c3c899b6ac839ab92006c7d649fb722378706c245d4438da0b336415f26a24', 'Clé de sauvegarde chiffrée #02'),
('backup_enc_03', '3433d8004342f054eaa770a4dbb47a28df2464ca62b927eb1041fccd1b249ad9', 'Clé de sauvegarde chiffrée #03'),
('backup_enc_04', 'b7f26e1e1e544dd9df068873ae43a3978c9e0eeb34a31c5c0828dfba15d44744', 'Clé de sauvegarde chiffrée #04'),
('backup_enc_05', '7d15dca741518f5637b0271bce24802b7738c0a7d6dae7f8b2458c5cda8400c1', 'Clé de sauvegarde chiffrée #05'),
('backup_enc_06', '86cd090279fd902a4d1f7c9c7b0a4a74e96291ed1ce9c911501ca93e6922b116', 'Clé de sauvegarde chiffrée #06'),
('backup_enc_07', '350b90d232b1535b45211b3516e09a3f28167c6f5ef87e002061282e45aea82d', 'Clé de sauvegarde chiffrée #07'),
('backup_enc_08', '4fb2b4b5567a59d92860b92f8a8b6b001ee37aec762416d879130865ddb82b57', 'Clé de sauvegarde chiffrée #08'),
('backup_enc_09', '0a3348fa51af5bbc8ea00f5de451cf978184b45db1686898e47cc48abab093eb', 'Clé de sauvegarde chiffrée #09'),
('backup_enc_10', '1adfde9d82d43a24b837f089552ce9d879d270e3e66f917e1fd2c29dc7d3f158', 'Clé de sauvegarde chiffrée #10'),
('backup_enc_11', '6df026d8e32d931679fd3e96d3312de2476de2fd1b9f6b7cd8c386834e7ffef5', 'Clé de sauvegarde chiffrée #11'),
('backup_enc_12', '1489c692e6ee13270abdb53c893158b1338ad825a62b51b9b1cbff6cf68082a4', 'Clé de sauvegarde chiffrée #12'),
('backup_enc_13', 'd8b20ca68c1c79113f9d9c02ecf57474e72582268fde439818cc550a68df32f2', 'Clé de sauvegarde chiffrée #13'),
('backup_enc_14', 'ff00f1a63db59d949a19d61299356576550ef5a7459e383cc025565dc6a10729', 'Clé de sauvegarde chiffrée #14'),
('backup_enc_15', 'c004910d86fc3d68f834ff15eeacf1301158c5bd9af52c59a75fad52c8d9ae1a', 'Clé de sauvegarde chiffrée #15'),
('backup_enc_16', '67e25fc7a815e5af4af1c0c92552ab1c295e9b7ced1f828cb4b864d29d4dcf8d', 'Clé de sauvegarde chiffrée #16'),
('backup_enc_17', '7d58404b7df95bc9b70b4b480c126a479b25cde24c905468865b7156333e3e0b', 'Clé de sauvegarde chiffrée #17'),
('backup_enc_18', 'bf6f919823f6ce58064d67b61e154fe3f539e84faeed519beac43ae15433fdd2', 'Clé de sauvegarde chiffrée #18'),
('backup_enc_19', '5459dfce7322e4f226d540594900f093bbe9041857e4b688475053c8bd83c0d0', 'Clé de sauvegarde chiffrée #19'),
('backup_enc_20', '3000b93a035d9d1cb1006a5506a0136097bcbf5f93d0daff6f77b517de8d5952', 'Clé de sauvegarde chiffrée #20');


DROP TABLE IF EXISTS artefacts;
CREATE TABLE artefacts (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  designation    VARCHAR(128) NOT NULL,
  description    TEXT         NOT NULL,
  indice         TEXT         NOT NULL,
  ciphertext_hex TEXT         NOT NULL,
  nonce_hex      CHAR(24)     NOT NULL,
  tag_hex        CHAR(32)     NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO artefacts (designation, description, indice, ciphertext_hex, nonce_hex, tag_hex) VALUES
('Sceau du Cabinet de Versailles',
 'Accréditation secrète de l''Académie Royale. Ce sceau ouvre l''accès aux archives expérimentales classifiées conservées dans la base de données du laboratoire.',
 'La configuration du système contient des clés de sauvegarde chiffrées. L''une d''elles déverrouille ce sceau.',
 '096879621a7f67a5a359ebfadad7068fa905a40968b2edf68f73d8d0ebb8fe5ad2a8fb26fd2683dd45481c0721908bedf03c395db045',
 'b8564b5ff33160d67ec27e83', '97a9463cbfa5e5f1ca44b9f1e1469069');


DROP TABLE IF EXISTS galerie_observations;
CREATE TABLE galerie_observations (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT         NOT NULL,
  titre      VARCHAR(128),
  commentaire TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS bouteille_annotations;
CREATE TABLE bouteille_annotations (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT         NOT NULL,
  session_id INT,
  note       TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS instruments_signalements;
CREATE TABLE instruments_signalements (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT         NOT NULL,
  instrument   VARCHAR(128),
  description  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS archives_recherches;
CREATE TABLE archives_recherches (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT         NOT NULL,
  requete    VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Données affichées dans les onglets labo
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS galerie_miroirs;
CREATE TABLE galerie_miroirs (
  id     INT PRIMARY KEY AUTO_INCREMENT,
  titre  VARCHAR(128) NOT NULL,
  valeur VARCHAR(32)  NOT NULL,
  label  VARCHAR(128) NOT NULL,
  detail TEXT         NOT NULL,
  couleur CHAR(7)     NOT NULL,
  actif  TINYINT(1)   NOT NULL DEFAULT 1
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO galerie_miroirs (titre, valeur, label, detail, couleur) VALUES
( 'Miroir Solaire',        '4.2 kWh',  'Production solaire quotidienne',
 'Vos panneaux ont produit l''équivalent de 42 bougies brûlant toute une nuit selon le calcul de Nollet.',
 '#d4930a'),
('Fluide Éolien',         '1.8 kWh',  'Énergie éolienne captée',
 'Le vent souffle votre économie : 1,8 kWh économisés grâce aux conditions météorologiques favorables.',
 '#4ab3d4'),
( 'Feu Domestique',        '6.1 kWh',  'Consommation chauffage',
 'Le chauffage reste le plus grand consommateur — comme la chaleur du soufflet dans les expériences de combustion.',
 '#c0392b'),
('Appareils Chimiques',   '2.3 kWh',  'Électroménager & appareils',
 'Vos instruments domestiques consomment avec régularité, à l''image d''une machine électrostatique bien huilée.',
 '#b5651d'),
( 'Lumière Artificielle',  '0.7 kWh',  'Éclairage',
 'L''éclairage moderne consomme peu — Nollet aurait admiré ces lampes qui surpassent ses tubes luminescents.',
 '#c9a84c'),
('Étincelle Principale',   '15.1 kWh', 'Consommation totale du jour',
 'Bilan journalier complet. La grande étincelle de Nollet — votre empreinte électrique quotidienne.',
 '#2d7a3f');

DROP TABLE IF EXISTS bouteille_charges;
CREATE TABLE bouteille_charges (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  session_label VARCHAR(128)   NOT NULL,
  isolation     VARCHAR(32)    NOT NULL,
  charge_joules DECIMAL(8,2)   NOT NULL,
  duree_sec     INT            NOT NULL,
  rendement_pct DECIMAL(5,2)   NOT NULL,
  date_exp      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note_interne  TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO bouteille_charges (session_label, isolation, charge_joules, duree_sec, rendement_pct, note_interne) VALUES
('Session #1 — Verre standard',     'verre',  847.40, 120, 91.20, 'Résultats nominaux. Isolation correcte.'),
('Session #2 — Résine d''ambre',    'resine', 623.10, 145, 77.50, 'Légère fuite détectée côté armature externe.'),
('Session #3 — Soufre vulgaire',    'soufre', 501.80, 200, 64.30, 'Performance dégradée par l''humidité ambiante.'),
('Session #4 — Cire à cacheter',    'cire',   388.90, 210, 54.10, 'Fusion partielle de l''isolant observée à 28°C.'),
('Session #5 — Verre haute pureté', 'verre',  912.70,  98, 93.80, 'Meilleure session enregistrée. Reproduire conditions.'),
('Session #6 — Test comparatif',    'resine', 710.20, 130, 80.10, 'Comparaison résine/verre. Voir carnet p.47.');

DROP TABLE IF EXISTS instruments_lab;
CREATE TABLE instruments_lab (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nom         VARCHAR(128) NOT NULL,
  type_instr  VARCHAR(32)  NOT NULL,
  statut      ENUM('actif','veille','maintenance','hors_service') NOT NULL DEFAULT 'actif',
  lecture     VARCHAR(32)  NOT NULL,
  description TEXT         NOT NULL,
  calibre     TINYINT(1)   NOT NULL DEFAULT 1
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO instruments_lab (nom, type_instr, statut, lecture, description, calibre) VALUES
('Machine Électrostatique',       'Generateur',   'actif',       '847 V',
 'Globe de soufre frotté produisant une charge électrostatique continue. Modèle perfectionné d''après Hauksbee.', 1),
('Électromètre de Nollet',        'Mesure',       'actif',       '3.4 kV',
 'Deux lames de lin suspendues indiquant la tension par écartement. Précision ±0.2 kV.', 1),
('Conducteur Primaire',           'Transmission', 'veille',      '0 A',
 'Barre de cuivre isolée sur pied de verre. Transmission du fluide électrique sans perte.', 1),
('Baromètre de Torricelli électrique', 'Observation',  'maintenance', '—',
 'Tube sous vide exhibant la lumière électrique. En cours de réparation du joint de cire.', 0),
('Thermomètre de Franklin',       'Mesure',       'actif',       '23.4°C',
 'Mesure la température ambiante du laboratoire, indispensable pour corriger les relevés électriques.', 1),
('Boussole Magnétique',           'Navigation',   'actif',       'N 12°E',
 'Orientation des expériences selon les lignes magnétiques terrestres. Nollet notait chaque variation.', 1);

DROP TABLE IF EXISTS carnet_pages;
CREATE TABLE carnet_pages (
  id       INT PRIMARY KEY AUTO_INCREMENT,
  date_exp CHAR(10)     NOT NULL,
  titre    VARCHAR(128) NOT NULL,
  contenu  TEXT         NOT NULL,
  joules   DECIMAL(8,2) NOT NULL,
  auteur   VARCHAR(64)  NOT NULL DEFAULT 'admin_nollet'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO carnet_pages (date_exp, titre, contenu, joules) VALUES
('1746-03-12', 'Expérience galerie — chaîne humaine 180 gardes',
 'La chaîne de 180 personnes a parfaitement conduit le choc électrique du bout à l''autre en moins d''un instant. Réaction unanime et simultanée confirmée devant l''Académie.',
 1840.50),
('1746-04-03', 'Bouteille de Leyde — record de charge',
 'Nouvelle configuration de l''armature externe en feuilles d''étain. Charge maximale atteinte : 912 joules. Décharge fulminante. Odeur de soufre notable.',
 912.70),
('1746-05-17', 'Instrumentarium — calibration annuelle',
 'Étalonnage complet de l''électromètre. Divergence corrigée de +0.3 kV. Machine électrostatique révisée, roulement central remplacé.',
 0.00),
('1746-06-21', 'Archives — consultation manuscrit de Franklin',
 'Réception du traité de Benjamin Franklin sur la nature du tonnerre. Correspondances frappantes avec nos observations sur la bouteille de Leyde.',
 0.00),
('1746-07-08', 'Rapport de commotion — incident session #3',
 'L''assistant Brossard a reçu par inadvertance la décharge complète de la bouteille. Perte de connaissance brève, rétablissement complet en 10 minutes. Mesures de sécurité renforcées.',
 501.80),
('1746-09-30', 'Synthèse trimestrielle — Académie Royale',
 'Présentation devant l''Académie. Le Roi a daigné observer l''expérience de la chaîne humaine depuis la Tribune. Approbation royale accordée. Sceau apposé.',
 9999.99);

DROP TABLE IF EXISTS archives_docs;
CREATE TABLE archives_docs (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  annee          SMALLINT     NOT NULL,
  titre          VARCHAR(255) NOT NULL,
  auteur_arch    VARCHAR(128) NOT NULL,
  extrait        TEXT         NOT NULL,
  classification ENUM('PUBLIC','RESERVE','CONFIDENTIEL') NOT NULL DEFAULT 'PUBLIC'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO archives_docs (annee, titre, auteur_arch, extrait, classification) VALUES
(1746, 'Essai sur l''électricité des corps', 'Jean-Antoine Nollet',
 'De la manière dont le fluide électrique se distribue entre les corps conducteurs et isolants, avec observations sur la bouteille de Leyde et la chaîne humaine...',
 'PUBLIC'),
(1746, 'Lettre à M. Franklin sur la nature du tonnerre', 'Jean-Antoine Nollet',
 'Monsieur, j''ai pris connaissance de votre traité avec la plus vive attention. Si nos expériences concordent sur plusieurs points...',
 'PUBLIC'),
(1747, 'Rapport confidentiel — Expérience de Versailles', 'Jean-Antoine Nollet',
 'Par ordre de Sa Majesté, nous avons procédé à l''expérience de la chaîne humaine dans la Grande Galerie. Les résultats dépassent toute espérance...',
 'CONFIDENTIEL'),
(1748, 'Correspondance avec l''Académie de Berlin', 'Jean-Antoine Nollet',
 'Les académiciens prussiens contestent notre théorie des deux fluides. Nous maintenons nos positions sur la base de 200 expériences reproducibles...',
 'RESERVE'),
(1749, 'Mémoire sur les tubes luminescents', 'Jean-Antoine Nollet',
 'L''illumination des tubes à gaz raréfié par le fluide électrique ouvre des perspectives nouvelles pour l''éclairage des édifices royaux...',
 'PUBLIC'),
(1750, 'Note secrète — Dispositif de sécurité', 'Jean-Antoine Nollet',
 'Le Sceau d''accès au Cabinet de Versailles a été déposé sous forme chiffrée. La configuration système du laboratoire en conserve la clé de sauvegarde.',
 'CONFIDENTIEL');

DROP TABLE IF EXISTS dashboard_stats;
CREATE TABLE dashboard_stats (
  id       INT PRIMARY KEY AUTO_INCREMENT,
  label    VARCHAR(128) NOT NULL,
  valeur   VARCHAR(32)  NOT NULL,
  tendance VARCHAR(8)   NOT NULL,
  hausse   TINYINT(1)   NOT NULL DEFAULT 1
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO dashboard_stats (label, valeur, tendance, hausse) VALUES
('Consommation mensuelle', '284 kWh', '-12%', 0),
('Charge actuelle',        '3.2 kW', '+5%',  1),
('Économies réalisées',    '18.40 €', '+8%',  1),
('Indice Nollet',          '92/100',  '+3pt', 1);

DROP TABLE IF EXISTS dashboard_semaine;
CREATE TABLE dashboard_semaine (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  jour_label  CHAR(3)        NOT NULL,
  valeur_kwh  DECIMAL(6,2)   NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO dashboard_semaine (jour_label, valeur_kwh) VALUES
('Lun',42),('Mar',67),('Mer',55),('Jeu',80),('Ven',73),('Sam',38),('Dim',29);
