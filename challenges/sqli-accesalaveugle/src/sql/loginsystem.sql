CREATE DATABASE IF NOT EXISTS loginsystem;
USE loginsystem;

DROP TABLE IF EXISTS admin;

CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(50)
);

INSERT INTO admin VALUES
(1, 'admin', 'Hacked123');

-- Utilisateur CTF
CREATE USER IF NOT EXISTS 'ctf'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON loginsystem.* TO 'ctf'@'%';
FLUSH PRIVILEGES;

