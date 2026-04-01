<?php
$host = "127.0.0.1";
$user = "ctf";
$pass = "root";
$db   = "ctf_sqli";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Erreur BDD");
}
?>
