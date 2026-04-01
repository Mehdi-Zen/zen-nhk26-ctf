<?php
$carnets = [    1 => [        'titre' => 'Jour 1 - Arrivée à Guadalupe',
        'date' => '15 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => false,
        'contenu' => "Nous sommes enfin arrivés à l'île de Guadalupe. L'excitation est palpable dans l'équipe. Les eaux sont bleu turquoize. Les premiers repérages montrent une présence importante de requins. Juan prépare l'équipement de mesure thermique."
    ],
    2 => [        'titre' => 'Jour 2 - Calibrage des instruments',
        'date' => '16 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    3 => [        'titre' => 'Jour 3 - Première immersion',
        'date' => '17 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => false,
        'contenu' => "Première plongée aujourd'hui ! Nous avons observé un mâle adulte d'environ 4,5 mètres. Son comportement était curieux mais non agressif. La visibilité était exceptionnelle, environ 30 mètres. Juan a pu prendre des mesures de température à différentes profondeurs."
    ],
    4 => [        'titre' => 'Jour 4 - Observations nocturnes',
        'date' => '18 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    5 => [        'titre' => 'Jour 5 - Rencontre avec "Deep Blue"',
        'date' => '19 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => false,
        'contenu' => "Journée incroyable ! Nous pensons avoir observé Deep Blue, l'une des plus grandes femelles connues. Elle mesurait au moins 6 mètres. Sa présence majestueuse nous a tous laissés sans voix. Ces créatures sont si mal comprises du grand public."
    ],
    6 => [        'titre' => 'Jour 6 - Anomalies thermiques',
        'date' => '20 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    7 => [        'titre' => 'Jour 7 - Analyse des températures',
        'date' => '21 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => false,
        'contenu' => "Les relevés de température montrent une augmentation de 1,3°C par rapport aux données de 2019. C'est préoccupant. Nous devons corréler ces données avec les changements de comportement observés. Ocean pense que cela pourrait affecter leurs zones de chasse."
    ],
    8 => [        'titre' => 'Jour 8 - Migration inhabituelle',
        'date' => '22 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    9 => [        'titre' => 'Jour 9 - Protocole d\'étude',
        'date' => '23 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    10 => [        'titre' => 'Jour 10 - Comportement de chasse',
        'date' => '24 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => false,
        'contenu' => "Observation fascinante d'une séquence de chasse. Le requin a utilisé la technique de l'approche par le bas. La précision est millimétrique. Ces prédateurs sont le résultat de millions d'années d'évolution. Chaque mouvement a un but précis."
    ],
    11 => [        'titre' => 'Jour 11 - Prélèvements biologiques',
        'date' => '25 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    12 => [        'titre' => 'Jour 12 - Données préliminaires',
        'date' => '26 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => false,
        'contenu' => "Nous commençons à compiler nos observations. Les patterns sont clairs : les zones de chasse se déplacent vers des eaux plus profondes et plus fraîches. C'est une adaptation directe au réchauffement. Juan finalise les graphiques pour la présentation."
    ],
    13 => [        'titre' => 'Jour 13 - Incident technique',
        'date' => '27 mars 2024',
        'auteur' => 'Juan Oliphant',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    14 => [        'titre' => 'Jour 14 - Tempête approchante',
        'date' => '28 mars 2024',
        'auteur' => 'Ocean Ramsey',
        'prive' => true,
        'contenu' => "Carnet privé - Accès réservé à l'équipe de recherche"
    ],
    15 => [        'titre' => 'NHK26{1D0R_D4nS_L3S_PR0F0ND3URS}',
        'date' => '29 mars 2024',
        'auteur' => 'Ocean Ramsey & Juan Oliphant',
        'prive' => true,
        'contenu' => "FÉLICITATIONS ! Vous avez découvert nos notes confidentielles.\n\nCe carnet contient nos conclusions les plus importantes : le réchauffement climatique modifie radicalement le comportement des grands requins blancs. Nos données montrent une corrélation de 87% entre l'augmentation de température et le changement de zones de chasse.\n\nFlag : NHK26{1D0R_D4nS_L3S_PR0F0ND3URS}\n\nCes découvertes doivent être partagées avec la communauté scientifique pour protéger ces magnifiques créatures."
    ]
];

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!isset($carnets[$id])) {
    $error = true;
    $message = "Ce carnet n'existe pas.";
} else {
    $carnet = $carnets[$id];
    $error = false;
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Carnet - Ocean & Juan</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <header>
        <h1>Expédition Grands Requins Blancs 2024</h1>
        <a href="index.php" class="back-link">← Retour à l'accueil</a>
    </header>
    
    <main>
        <?php if ($error): ?>
            <div class="error-box">
                <h2><?= $message ?></h2>
                <p>Vérifiez l'URL et réessayez.</p>
            </div>
        <?php else: ?>
            <article class="carnet">
                <h2><?= htmlspecialchars($carnet['titre']) ?></h2>
                <div class="meta">
                    <span class="date">Date : <?= htmlspecialchars($carnet['date']) ?></span>
                    <span class="auteur">Auteur : <?= htmlspecialchars($carnet['auteur']) ?></span>
                    <?php if ($carnet['prive']): ?>
                        <span class="badge-prive">Privé</span>
                    <?php endif; ?>
                </div>
                <div class="contenu">
                    <?= nl2br(htmlspecialchars($carnet['contenu'])) ?>
                </div>
            </article>
        <?php endif; ?>
        
        <div class="navigation">
            <p class="hint">Astuce : les carnets sont numérotés séquentiellement.</p>
        </div>
    </main>
</body>
</html>
