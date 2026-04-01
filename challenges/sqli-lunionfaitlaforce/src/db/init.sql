CREATE DATABASE ctf_sqli;
USE ctf_sqli;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(50)
);

INSERT INTO users (username, password)
VALUES ('adminhk', 'martini');
CREATE TABLE flag (
    flag VARCHAR(255)
);

INSERT INTO flag VALUES ('FLAG{union_sqli_martini}');
CREATE USER IF NOT EXISTS 'ctf'@'127.0.0.1' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON ctf_sqli.* TO 'ctf'@'127.0.0.1';
FLUSH PRIVILEGES;
