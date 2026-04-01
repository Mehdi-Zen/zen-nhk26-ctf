<?php
// Connexion SQLite (chemin ABSOLU, writable par www-data)
$db = new PDO('sqlite:/var/www/html/data/guestbook.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Création automatique de la table
$db->exec("
CREATE TABLE IF NOT EXISTS guestbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    message TEXT
)
");

// Cookie visiteur = indice pour le joueur
setcookie("VISITOR_SESSION", base64_encode("guest"), time() + 3600, "/");

// Filtre volontairement FAIBLE (challenge XSS)
function weak_filter($s) {
    return str_ireplace(
        ['<script', '</script>', 'javascript:', 'onfocus'],
        '',
        $s
    );
}

// Soumission du formulaire
if (!empty($_POST['name']) && !empty($_POST['message'])) {
    $stmt = $db->prepare("INSERT INTO guestbook (name, message) VALUES (?, ?)");
    $stmt->execute([
        htmlspecialchars($_POST['name'], ENT_QUOTES, 'UTF-8'),
        weak_filter($_POST['message'])
    ]);
    header("Location: /");
    exit;
}

// Récupération des messages
$rows = $db->query("SELECT name, message FROM guestbook ORDER BY id DESC");
?>

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alan Turing Museum – Livre d’Or</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Roboto+Slab:wght@300;400;700&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg:        #0a0e14;
      --paper:      #f8f1e9;
      --ink:        #1a1a1a;
      --accent:     #c41e3b;     /* rouge Turing / bombe Enigma */
      --secondary:  #2a6b5f;     /* vert teletype / old computer */
      --border:     #4a5b6c;
      --glow:       rgba(196, 30, 59, 0.15);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: var(--bg);
      color: var(--ink);
      font-family: 'Roboto Slab', Georgia, serif;
      line-height: 1.6;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 2px 2px, rgba(74,91,108,0.4) 1px, transparent 0),
        linear-gradient(var(--bg) 1px, transparent 1px),
        linear-gradient(90deg, var(--bg) 1px, transparent 1px);
      background-size: 40px 40px, 40px 40px, 40px 40px;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
      background: var(--paper);
      border: 1px solid var(--border);
      box-shadow: 0 10px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04);
      border-radius: 4px;
      overflow: hidden;
    }

    header {
      background: linear-gradient(135deg, #1e293b, #111827);
      color: white;
      padding: 2.5rem 2rem 2rem;
      text-align: center;
      border-bottom: 4px solid var(--accent);
      position: relative;
    }

    header::before {
      content: "A.M.T. 1912–1954";
      position: absolute;
      top: 1.1rem;
      right: 2rem;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.95rem;
      color: #94a3b8;
      letter-spacing: 2px;
    }

    h1 {
      font-size: 2.4rem;
      margin-bottom: 0.6rem;
      color: white;
      text-shadow: 0 2px 8px rgba(0,0,0,0.6);
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-family: 'IBM Plex Mono', monospace;
      color: #cbd5e1;
      font-size: 1.05rem;
      opacity: 0.9;
    }

    .info {
      background: rgba(196,30,59,0.08);
      border-left: 4px solid var(--accent);
      padding: 1rem 1.5rem;
      margin: 1.5rem 2rem;
      font-size: 0.95rem;
      color: #4b5563;
    }

    form {
      padding: 0 2rem 2.5rem;
      display: grid;
      gap: 1.4rem;
    }

    input, textarea {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 1.05rem;
      padding: 0.9rem 1.1rem;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      background: #f1f5f9;
      transition: all 0.15s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--glow);
      background: white;
    }

    textarea {
      min-height: 140px;
      resize: vertical;
    }

    button {
      background: var(--accent);
      color: white;
      border: none;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      justify-self: start;
    }

    button:hover {
      background: #a21a31;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(196,30,59,0.35);
    }

    .messages {
      padding: 0 2rem 2.5rem;
    }

    .entry {
      padding: 1.4rem 1.8rem;
      margin-bottom: 1.4rem;
      background: rgba(74,91,108,0.06);
      border-left: 5px solid var(--secondary);
      border-radius: 0 6px 6px 0;
      position: relative;
    }

    .entry:nth-child(even) {
      border-left-color: var(--accent);
      background: rgba(196,30,59,0.04);
    }

    .name {
      font-family: 'IBM Plex Mono', monospace;
      color: #1e293b;
      font-weight: 600;
      font-size: 1.15rem;
      margin-bottom: 0.5rem;
    }

    .message {
      white-space: pre-wrap;
      color: #334155;
    }

    hr {
      border: none;
      border-top: 1px dashed #94a3b8;
      margin: 2.5rem 0 1.5rem;
    }

    footer {
      text-align: center;
      padding: 1.8rem;
      color: #64748b;
      font-size: 0.9rem;
      border-top: 1px solid #334155;
      background: #0f172a;
    }

    @media (max-width: 640px) {
      .container { margin: 0 0.6rem; }
      header { padding: 2rem 1.2rem 1.6rem; }
      form, .messages { padding-left: 1.2rem; padding-right: 1.2rem; }
    }
  </style>
</head>
<body>

<div class="container">

  <header>
    <h1>Alan Turing Museum</h1>
    <div class="subtitle">Livre d’or – Hommage au père de l’informatique moderne</div>
  </header>

  <div class="info">
    Les messages sont consultés par l’administrateur via une session encodée.
  </div>

  <form method="POST">
    <input name="name"    placeholder="Votre nom"    required autocomplete="off">
    <textarea name="message" placeholder="Votre message..." required></textarea>
    <button type="submit">Laisser un message</button>
  </form>

  <hr>

  <div class="messages">
    <?php foreach ($rows as $r): ?>
      <div class="entry">
        <div class="name"><?= htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8') ?></div>
        <div class="message"><?= $r['message'] ?></div>
      </div>
    <?php endforeach; ?>
  </div>

  <footer>
    « Sometimes it is the people no one can imagine anything of who do the things no one can imagine. » – Alan Turing
  </footer>

</div>

</body>
</html>