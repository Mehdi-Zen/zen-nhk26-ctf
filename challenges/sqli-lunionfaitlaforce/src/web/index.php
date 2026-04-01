<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion sécurisée</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<h2>Authentification</h2>

<!-- TODO: supprimer ce commentaire en production -->
<!-- admin user : adminhk -->

<form method="POST" action="login.php">
    <input type="text" name="username" placeholder="Nom d'utilisateur" required>
    <input type="password" name="password" placeholder="Mot de passe" required>
    <button type="submit">Connexion</button>
</form>

</body>
</html>
