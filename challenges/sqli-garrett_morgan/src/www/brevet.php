<?php
$db = new SQLite3('database.db');

$id = $_GET['id'] ?? '1';

$query = "SELECT patent_id, title, description FROM patents WHERE patent_id = $id";
$result = $db->query($query);

if (!$result) {
    die("Aucune archive trouvée.");
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Archive Technique</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>

<header class="sub-hero">
    <h1>Archive Technique</h1>
    <p>Division Ingénierie – Accès Restreint</p>
</header>

<main class="container">

    <form class="search">
        <input type="text" name="id" placeholder="ID du brevet">
        <button type="submit">Consulter</button>
    </form>

    <?php while ($row = $result->fetchArray(SQLITE3_ASSOC)) : ?>
        <article class="archive">
            <h2><?= htmlspecialchars($row['title']) ?></h2>
            <p><?= htmlspecialchars($row['description']) ?></p>
        </article>
    <?php endwhile; ?>

</main>

<footer>
    <p>Archives internes – Morgan Industries</p>
</footer>

</body>
</html>
