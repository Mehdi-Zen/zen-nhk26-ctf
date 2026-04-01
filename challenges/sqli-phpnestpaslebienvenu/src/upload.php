<?php
$db = new PDO('sqlite:/var/www/html/database.sqlite');

$filename = $_FILES['file']['name'];
$ext = pathinfo($filename, PATHINFO_EXTENSION);

$query = "SELECT content FROM pages WHERE type='$ext'";
$result = $db->query($query);
$row = $result->fetch();
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Résultat d'analyse</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
    background: radial-gradient(circle at center, #1c1c1c, #000);
    color: #00e5ff;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.box {
    background: rgba(0,0,0,0.85);
    padding: 60px;
    border-radius: 20px;
    box-shadow: 0 0 40px #00e5ff;
    text-align: center;
    width: 700px;
}

h2 {
    margin-bottom: 30px;
    font-size: 28px;
}

.query {
    font-size: 16px;
    color: #aaa;
    margin-bottom: 30px;
    word-break: break-all;
}

.result {
    font-size: 22px;
    margin-top: 30px;
}

a {
    display: inline-block;
    margin-top: 30px;
    color: #00e5ff;
    text-decoration: none;
    border: 2px solid #00e5ff;
    padding: 12px 25px;
    border-radius: 8px;
    transition: 0.3s;
    font-size: 16px;
}

    </style>
</head>
<body>

<div class="box">
    <h2>Analyse du fichier</h2>

    <div class="query">
        Requête exécutée : <?php echo htmlspecialchars($query); ?>
    </div>

    <div class="result">
        <?php
        if ($row) {
            echo $row['content'];
        } else {
            echo "Aucun résultat, essaye encore.";
        }
        ?>
    </div>

    <a href="index.php">⬅ Retour au laboratoire</a>
</div>

</body>
</html>

