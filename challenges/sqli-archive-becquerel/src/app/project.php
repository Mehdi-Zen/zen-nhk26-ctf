<?php
header('Content-Type: text/html; charset=utf-8');
$host = '127.0.0.1';
$dbname = 'becquerel_db';
$user = 'user';
$pass = 'password';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion: " . $e->getMessage());
}
$id = $_GET['id'] ?? '1';
if ($id === '1') {
    $query = "SELECT name, detail FROM projects WHERE id = 1";
    $authorized = true;
} else {
    $query = "SELECT name, detail FROM projects WHERE id = $id";
    $authorized = false;
}
$results = [];
try {
    $stmt = $pdo->query($query);
    if ($authorized) {
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row !== false) {
            $results = [['name' => 'Archive consultée', 'detail' => '']];
        }
    }
} catch (Exception $e) {
    $results = [];
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archives Henri Becquerel</title>
    <style>
        body {font-family: Georgia, serif; background: #0f0b07 url('https://monsieurvintage.com/photos/2024/02/henri-becquerel-copyright-paul-nadar-wikimedia-une-1000x600.jpg') no-repeat center center fixed; background-size: cover; color: #2c1810; margin:0; padding:20px;}
        .document-container {max-width:860px; margin:40px auto; background:#f9f5ed url('https://www.transparenttextures.com/patterns/old-paper.png'); padding:60px 50px; border:2px solid #8B4513; box-shadow:0 15px 40px rgba(0,0,0,0.5);}
        .content {font-size:1.15em; background:rgba(255,255,255,0.4); padding:25px; border-left:6px solid #8B4513;}
    </style>
</head>
<body>
<div class="document-container">
    <h1>Archives Henri Becquerel</h1>
    <?php if (!empty($results)): ?>
        <?php if ($authorized): ?>
            <img src="https://skullsinthestars.com/wp-content/uploads/2010/12/becquerel_plate.jpg?w=640" style="max-width:100%; border:4px solid #6b3f1e;">
        <?php endif; ?>
        <h2><?php echo htmlspecialchars($results[0]['name'] ?? ''); ?></h2>
        <p><?php echo nl2br(htmlspecialchars($results[0]['detail'] ?? '')); ?></p>
    <?php else: ?>
        <div class="content">
            <p>Aucune fiche trouvée pour cet identifiant. Les archives complètes sont indexées dans le registre projects — accès restreint.</p>
        </div>
    <?php endif; ?>
    <a href="index.php">← Retour</a>
</div>
</body>
</html>