<?php
$conn = new mysqli("127.0.0.1", "CTF_NHK_2026", "CTF_NHK_2026", "bdd_laboratoire");


if ($conn->connect_error) {
    die("Erreur de connexion à la base de données");
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$message = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $query = "SELECT * FROM scientists
              WHERE username = '$username' AND password = UNHEX(SHA2('$password', 256))";

    $result = $conn->query($query);

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();

        if ($row['username'] === 'marie.curie') {
            $message  = "<strong>Bienvenue Marie Curie</strong><br><br>";
            $message .= "<span class='flag'>{$row['secret']}</span>";
        } else {
            $message = "Connexion réussie – Scientifique reconnu(e)";
        }
    } else {
        $message = "Échec de la connexion";
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Accès au laboratoire</title>

<style>
:root {
    --bg-main: #1c1f24;
    --bg-secondary: #2a2e35;
    --card-bg: #2f343c;
    --border: #3a4048;
    --text: #e4e7eb;
    --muted: #a0aec0;
    --blue: #64b5f6;
    --green: #4db6ac;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    background: linear-gradient(135deg, var(--bg-main), var(--bg-secondary));
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    width: 420px;
    padding: 35px 45px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 20px 35px rgba(0,0,0,.35);
}

.icon {
    text-align: center;
    font-size: 2.8em;
    color: var(--green);
    margin-bottom: 10px;
}

h1, h2 {
    text-align: center;
    margin: 0 0 8px;
    color: var(--blue);
    font-weight: 600;
}

.subtitle {
    text-align: center;
    font-size: .9em;
    color: var(--muted);
    margin-bottom: 28px;
}

label {
    font-size: .85em;
    color: var(--muted);
    margin-bottom: 5px;
    display: block;
}

input {
    width: 100%;
    padding: 11px;
    margin-bottom: 18px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
}

input:focus {
    outline: none;
    border-color: var(--blue);
    box-shadow: 0 0 0 1px rgba(100,181,246,.4);
}

button {
    width: 100%;
    padding: 11px;
    border: none;
    border-radius: 6px;
    background: var(--blue);
    color: #0b1320;
    font-weight: 600;
    cursor: pointer;
}

button:hover {
    background: #42a5f5;
}

.message {
    margin-top: 18px;
    text-align: center;
    font-weight: 600;
    color: #ff6b6b;
}

.flag {
    margin-top: 20px;
    padding: 14px;
    background: rgba(100,181,246,.12);
    border-left: 4px solid var(--blue);
    border-radius: 6px;
    text-align: center;
    font-family: monospace;
    color: var(--blue);
    word-break: break-all;
}

@media (max-width: 480px) {
    .container {
        width: 90%;
        padding: 30px;
    }
}
	
}
</style>

</head>
<body>

<div class="container">
    <div class="icon">🔬</div>
    <h2>Authentification du laboratoire</h2>
    <div class="subtitle">Accès réservé au personnel scientifique</div>

    <form method="POST">
        <label>Identifiant</label>
        <input type="text" name="username">

        <label>Mot de passe</label>
        <input type="password" name="password">

        <button type="submit">Se connecter</button>
    </form>

    <div class="message">
        <?= $message ?>
    </div>
</div>

</body>
</html>

