CREATE DATABASE IF NOT EXISTS bdd_laboratoire;
USE bdd_laboratoire;

CREATE TABLE scientists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password BINARY(32),
    name VARCHAR(100),
    gender VARCHAR(10),
    field VARCHAR(100),
    secret VARCHAR(255)
);

INSERT INTO scientists (username, password, name, gender, field, secret) VALUES
(
  'marie.curie',
  UNHEX(SHA2('un_mot_de_passe_super_fort_01!', 256)),
  'Marie Curie',
  'Femme',
  'Physique / Chimie',
  'NHK26{Marie_Curie_Grande_Physicienne}'
);

