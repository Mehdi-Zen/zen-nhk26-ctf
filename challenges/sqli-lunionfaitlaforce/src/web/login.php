<?php
require 'config.php';

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

$query = "SELECT id, username FROM users WHERE username = '$username' AND password = '$password'";
$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "<p>" . htmlspecialchars($row['username']) . "</p>";
    }
} else {
    echo "<p>Identifiants incorrects ❌</p>";
}
