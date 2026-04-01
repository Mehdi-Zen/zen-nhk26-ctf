SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS becquerel_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE becquerel_db;

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    detail TEXT NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO projects (id, name, detail) VALUES
(1, 'Fiche 1 : Découverte initiale', 
 'Henri Becquerel a observé des rayons invisibles émis par l\'uranium en 1896. Les plaques photographiques se voilent même dans l\'obscurité.'),

(2, 'Fiche 2 : Expériences complémentaires', 
 'Observations sur différents sels d\'uranium et autres substances. Résultats variables selon la durée d\'exposition.'),

(3, 'Fiche 3 : Propriétés observées', 
 'NHK26{proprietes_de_la_radioactivite}'),  

(4, 'Note de laboratoire secrète', 
 'Observations supplémentaires non publiées. Le phénomène semble indépendant de toute stimulation extérieure.'),

(5, 'Correspondance avec Poincaré', 
 'Lettre du 12 mars 1897. Discussion sur les implications théoriques des rayons uraniques.'),

(6, 'Notes sur le thorium', 
 'Observations secondaires sur d\'autres éléments. Pas de conclusion définitive.'),

(7, 'Calculs de dosage', 
 'Données de mesure de l\'intensité. Résultats non concluants pour l\'instant.'),

(8, 'Propriétés observées (bis)', 
 'NHK26{proprietes_de_la_radioactivite}');  
