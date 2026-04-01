const express    = require("express");
const helmet     = require("helmet");
const cookieParser = require("cookie-parser");
const crypto     = require("crypto");
const path       = require("path");
const jwt        = require("jsonwebtoken");

const { mysqlPool } = require("./src/mysql");
const { pgPool }    = require("./src/pg");

const PORT       = parseInt(process.env.PORT || "8080", 10);
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const SAFE_TIERS  = new Set(["NOVICE","ADEPT","MAITRE"]);
const SAFE_LEVELS = new Set(["PUBLIC","CONFIDENTIEL","SECRET"]);

function safeUpper(s, max=24)  { return String(s||"").trim().toUpperCase().slice(0,max); }
function sha256hex(s)          { return crypto.createHash("sha256").update(String(s)).digest("hex"); }
function looksSuspicious(s)    { return /('|%27|--|;|\/\*|\*\/|\bunion\b|\bselect\b|\bpg_sleep\b)/i.test(String(s||"")); }

function decodeDeep(s, max=3) {
  let out = String(s||"");
  for (let i=0; i<max; i++) {
    try { const d=decodeURIComponent(out); if(d===out) return out; out=d; } catch { return out; }
  }
  return out;
}

// WAF léger : bloque les mots-clés SQL sauf si le payload contient un '%'
function microWaf(req, res, next) {
  const raw = (req.originalUrl||"") + " " + JSON.stringify(req.body||{});
  if (/(\bunion\b|\bselect\b|\bpg_sleep\b|--|\/\*|\*\/|;)/i.test(raw) && !raw.includes("%"))
    return res.status(403).json({ erreur: "Perturbation détectée dans la commotion." });
  return next();
}

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const DIST_DIR = "/opt/challenge/frontend/dist";
app.use(express.static(DIST_DIR));
app.use("/api/profil", microWaf);


// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────
app.post("/api/auth/inscription", async (req, res) => {
  const nom = String(req.body.nom_plume||"").trim().slice(0,64);
  const mdp = String(req.body.mot_de_passe||"").trim().slice(0,128);
  if (!nom||!mdp) return res.status(400).json({ erreur: "Tous les champs sont requis." });
  try {
    const [r] = await mysqlPool.query(
      "INSERT INTO users (nom_plume, pass_sha256, rang) VALUES (?, ?, 'NOVICE')",
      [nom, sha256hex(mdp)]
    );
    return res.json({ ok:true, id:r.insertId, nom_plume:nom, rang:"NOVICE" });
  } catch { return res.status(400).json({ erreur: "Nom d'utilisateur déjà utilisé." }); }
});

app.post("/api/auth/connexion", async (req, res) => {
  const nom = String(req.body.nom_plume||"").trim().slice(0,64);
  const mdp = String(req.body.mot_de_passe||"").trim().slice(0,128);
  if (!nom||!mdp) return res.status(400).json({ erreur: "Identifiants incomplets." });
  const [rows] = await mysqlPool.query(
    "SELECT id, nom_plume, rang FROM users WHERE nom_plume=? AND pass_sha256=? LIMIT 1",
    [nom, sha256hex(mdp)]
  );
  if (!rows||!rows.length) return res.status(401).json({ erreur: "Identifiants incorrects." });
  return res.json({ id:rows[0].id, nom_plume:rows[0].nom_plume, rang:rows[0].rang });
});

app.post("/api/auth/deconnexion", (_req, res) => res.json({ ok:true }));


// ─────────────────────────────────────────────────────────────
// Profil — second-order SQLi
// ─────────────────────────────────────────────────────────────
app.post("/api/profil/preferences", async (req, res) => {
  const userId  = parseInt(String(req.headers["x-session-id"]||"0"), 10);
  const prefEnc = String(req.body.pref_enc||"").slice(0,4000);
  if (!userId||!prefEnc) return res.status(400).json({ erreur: "Paramètres invalides." });
  try {
    await mysqlPool.query(
      "INSERT INTO report_prefs (user_id, pref_enc) VALUES (?,?) ON DUPLICATE KEY UPDATE pref_enc=VALUES(pref_enc)",
      [userId, prefEnc]
    );
    return res.json({ ok:true });
  } catch { return res.status(500).json({ erreur: "Erreur serveur." }); }
});

app.get("/api/profil/historique", async (req, res) => {
  const userId = parseInt(req.headers["x-session-id"]||"0", 10);
  if (!userId) return res.json({ items:[] });

  // Lire la préférence stockée
  const [prefRows] = await mysqlPool.query(
    "SELECT pref_enc FROM report_prefs WHERE user_id=? LIMIT 1", [userId]
  );

  // Pas de préférence → retourner les logs réels de l'utilisateur
  if (!prefRows.length) {
    try {
      const [r] = await mysqlPool.query(
        "SELECT id, action, detail, date FROM logs WHERE user_id=? ORDER BY date DESC LIMIT 20",
        [userId]
      );
      return res.json({ items: r || [] });
    } catch { return res.json({ items:[] }); }
  }

  // Préférence enregistrée → injecter (second-order SQLi)
  const pref = decodeDeep(prefRows[0].pref_enc, 3);
  const sql = "SELECT id, action, detail, date FROM logs WHERE " + pref + " LIMIT 20";
  try { const [r]=await mysqlPool.query(sql); return res.json({ items:r }); }
  catch { return res.json({ items:[] }); }
});


// ─────────────────────────────────────────────────────────────
// Labo — lecture (accessible sans auth)
// ─────────────────────────────────────────────────────────────
app.get("/api/labo/dashboard", async (_req, res) => {
  try {
    const [stats]   = await mysqlPool.query("SELECT label,valeur,tendance,hausse FROM dashboard_stats ORDER BY id");
    const [semaine] = await mysqlPool.query("SELECT jour_label AS label, valeur_kwh AS value FROM dashboard_semaine ORDER BY id");
    return res.json({ stats:stats||[], semaine:semaine||[] });
  } catch { return res.json({ stats:[], semaine:[] }); }
});

app.get("/api/labo/galerie", async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query("SELECT id,titre,valeur,label,detail,couleur FROM galerie_miroirs WHERE actif=1 ORDER BY id");
    return res.json({ miroirs:rows||[] });
  } catch { return res.json({ miroirs:[] }); }
});

app.get("/api/labo/bouteille", async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id,session_label,isolation,charge_joules,duree_sec,rendement_pct,DATE_FORMAT(date_exp,'%Y-%m-%d') AS date_exp FROM bouteille_charges ORDER BY id"
    );
    return res.json({ sessions:rows||[] });
  } catch { return res.json({ sessions:[] }); }
});

app.get("/api/labo/instruments", async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query("SELECT id,nom,type_instr,statut,lecture,description,calibre FROM instruments_lab ORDER BY id");
    return res.json({ instruments:rows||[] });
  } catch { return res.json({ instruments:[] }); }
});

app.get("/api/labo/carnet", async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query("SELECT id,date_exp,titre,contenu,joules FROM carnet_pages ORDER BY date_exp");
    return res.json({ pages:rows||[] });
  } catch { return res.json({ pages:[] }); }
});

app.get("/api/labo/archives", async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query("SELECT id,annee,titre,auteur_arch,extrait,classification FROM archives_docs ORDER BY annee,id");
    return res.json({ docs:rows||[] });
  } catch { return res.json({ docs:[] }); }
});


// ─────────────────────────────────────────────────────────────
// Labo — écriture HONEYPOT (connecté, n'importe quel rang)
// Requêtes 100% paramétrées → aucune vulnérabilité, aucune
// utilité pour la progression. Surface d'attaque fictive.
// ─────────────────────────────────────────────────────────────
function getSession(req) { return parseInt(req.headers["x-session-id"]||"0", 10); }

app.post("/api/labo/galerie/observation", async (req, res) => {
  const userId = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  const titre       = String(req.body.titre||"").slice(0,128);
  const commentaire = String(req.body.commentaire||"").slice(0,1000);
  try {
    await mysqlPool.query(
      "INSERT INTO galerie_observations (user_id, titre, commentaire) VALUES (?,?,?)",
      [userId, titre, commentaire]
    );
    return res.json({ ok:true });
  } catch { return res.status(500).json({ erreur: "Erreur serveur." }); }
});

app.post("/api/labo/bouteille/annotation", async (req, res) => {
  const userId    = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  const sessionId = parseInt(req.body.session_id||"0", 10)||null;
  const note      = String(req.body.note||"").slice(0,1000);
  try {
    await mysqlPool.query(
      "INSERT INTO bouteille_annotations (user_id, session_id, note) VALUES (?,?,?)",
      [userId, sessionId, note]
    );
    return res.json({ ok:true });
  } catch { return res.status(500).json({ erreur: "Erreur serveur." }); }
});

app.post("/api/labo/instruments/signalement", async (req, res) => {
  const userId     = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  const instrument  = String(req.body.instrument||"").slice(0,128);
  const description = String(req.body.description||"").slice(0,1000);
  try {
    await mysqlPool.query(
      "INSERT INTO instruments_signalements (user_id, instrument, description) VALUES (?,?,?)",
      [userId, instrument, description]
    );
    return res.json({ ok:true });
  } catch { return res.status(500).json({ erreur: "Erreur serveur." }); }
});

app.post("/api/labo/archives/recherche", async (req, res) => {
  const userId  = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  const requete = String(req.body.requete||"").slice(0,255);
  try {
    await mysqlPool.query(
      "INSERT INTO archives_recherches (user_id, requete) VALUES (?,?)",
      [userId, requete]
    );
    // Retourne les docs filtrés de façon safe
    const [rows] = await mysqlPool.query(
      "SELECT id,annee,titre,auteur_arch,extrait,classification FROM archives_docs WHERE LOWER(titre) LIKE ? OR LOWER(auteur_arch) LIKE ? ORDER BY annee,id LIMIT 10",
      [`%${requete.toLowerCase()}%`, `%${requete.toLowerCase()}%`]
    );
    return res.json({ docs:rows||[] });
  } catch { return res.json({ docs:[] }); }
});


// ─────────────────────────────────────────────────────────────
// Artefacts (AES-256-GCM)
// ─────────────────────────────────────────────────────────────
app.get("/api/artefacts", async (_req, res) => {
  try {
    const [rows] = await mysqlPool.query("SELECT id,designation,description,indice FROM artefacts ORDER BY id");
    return res.json({ artefacts:rows||[] });
  } catch { return res.json({ artefacts:[] }); }
});

app.post("/api/artefacts/dechiffrer", async (req, res) => {
  const artefactId = parseInt(req.body.artefact_id||"0", 10);
  const cleHex     = String(req.body.cle_hex||"").trim().toLowerCase();
  if (!artefactId||!/^[0-9a-f]{64}$/.test(cleHex))
    return res.status(400).json({ erreur: "Paramètres invalides." });

  let art;
  try {
    const [r] = await mysqlPool.query(
      "SELECT id,nonce_hex,ciphertext_hex,tag_hex FROM artefacts WHERE id=? LIMIT 1",
      [artefactId]
    );
    art = r&&r[0];
  } catch { art=null; }
  if (!art) return res.status(404).json({ erreur: "Artefact introuvable." });

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(cleHex, "hex"),
      Buffer.from(art.nonce_hex, "hex")
    );
    decipher.setAuthTag(Buffer.from(art.tag_hex, "hex"));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(art.ciphertext_hex, "hex")),
      decipher.final()
    ]).toString("utf8");

    if (pt.startsWith("NOLLET|") && pt.includes("SCOPE=api")) {
      const token = jwt.sign({ scope:"api", rank:"MAITRE" }, JWT_SECRET, { algorithm:"HS256", expiresIn:"20m" });
      return res.json({ ok:true, jwt:token });
    }
    return res.json({ ok:true, texte:pt });
  } catch {
    return res.status(403).json({ erreur: "Déchiffrement impossible — clé incorrecte." });
  }
});


// ─────────────────────────────────────────────────────────────
// JWT protected API (PostgreSQL — partie 2)
// ─────────────────────────────────────────────────────────────
function requireJwt(req, res, next) {
  const auth  = req.headers.authorization||"";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ erreur:"JWT requis" });
  try { req.jwt=jwt.verify(token, JWT_SECRET); return next(); }
  catch { return res.status(401).json({ erreur:"JWT invalide" }); }
}

app.get("/api/v1/experiences", requireJwt, async (req, res) => {
  const tier = safeUpper(req.query.tier||"");
  const q    = String(req.query.q||"").trim().slice(0,64);
  if (looksSuspicious(tier)||looksSuspicious(q)) console.warn("[honeypot] experiences", { tier,q });
  try {
    if (tier&&!SAFE_TIERS.has(tier)) return res.json({ ok:true, experiences:[] });
    let rows=[];
    if (tier) {
      rows=(await pgPool.query("SELECT id,tier,nom,description FROM lab.experiences WHERE tier=$1 ORDER BY id",[tier])).rows;
    } else if (q) {
      rows=(await pgPool.query("SELECT id,tier,nom,description FROM lab.experiences WHERE nom ILIKE $1 ORDER BY id LIMIT 20",["%"+q+"%"])).rows;
    } else {
      const rank=safeUpper(req.jwt?.rank||"NOVICE");
      const allowed=rank==="MAITRE"?["NOVICE","ADEPT","MAITRE"]:(rank==="ADEPT"?["NOVICE","ADEPT"]:["NOVICE"]);
      rows=(await pgPool.query("SELECT id,tier,nom,description FROM lab.experiences WHERE tier=ANY($1) ORDER BY id",[allowed])).rows;
    }
    return res.json({ ok:true, experiences:rows||[] });
  } catch { return res.json({ ok:true, experiences:[] }); }
});

app.get("/api/v1/classification", requireJwt, async (req, res) => {
  const level = safeUpper(req.query.level||"");
  if (looksSuspicious(level)) console.warn("[honeypot] classification", { level });
  try {
    if (level&&!SAFE_LEVELS.has(level)) return res.json({ ok:true, docs:[] });
    const rows = level
      ? (await pgPool.query("SELECT id,level,titre,contenu FROM lab.classification_docs WHERE level=$1 ORDER BY id",[level])).rows
      : (await pgPool.query("SELECT id,level,titre,contenu FROM lab.classification_docs ORDER BY id")).rows;
    return res.json({ ok:true, docs:rows||[] });
  } catch { return res.json({ ok:true, docs:[] }); }
});

app.get("/api/v1/rapport", requireJwt, async (req, res) => {
  const auteur = String(req.query.auteur || "").slice(0, 512);
  if (!auteur) return res.json({ ok:true, items:[], hint:"Paramètre auteur requis." });

  const t0 = Date.now();
  let client;
  try {
    client = await pgPool.connect();

    // Désactiver le timeout sur cette session (SET sans LOCAL = toute la session)
    await client.query("SET statement_timeout = 0");
    await client.query("SET search_path = lab, public");

    // 💀 Time-based blind SQLi — auteur injecté directement, aucun filtrage
    // IMPORTANT : pg_sleep doit être dans le SELECT ou dans une sous-requête scalaire
    // qui s'exécute indépendamment du nombre de lignes retournées.
    //
    // Confirmer l'injection (~3s) :
    //   ' OR (SELECT pg_sleep(3)) IS NOT NULL--
    //
    // Exfiltrer le flag caractère par caractère :
    //   ' OR (SELECT CASE WHEN substring((SELECT flag_value FROM lab.flags LIMIT 1),1,1)='N' THEN pg_sleep(3) ELSE pg_sleep(0) END) IS NOT NULL--
    //
    // La clause OR garantit l'évaluation même si auteur ne matche aucune ligne.
    const sql = `SELECT id, auteur, titre, contenu FROM lab.rapports WHERE auteur = '${auteur}' LIMIT 5`;
    const r = await client.query(sql);
    const elapsed = Date.now() - t0;
    return res.json({ ok:true, items: r.rows || [], elapsed });
  } catch (e) {
    console.error("[rapport] PG error:", e.message);
    return res.json({ ok:true, items:[], elapsed: Date.now() - t0, _err: e.message });
  } finally {
    if (client) client.release();
  }
});

app.get("/api/v1/artefacts/secrets", requireJwt, async (req, res) => {
  const ref = String(req.query.ref||"").trim().slice(0,64);
  if (looksSuspicious(ref)) console.warn("[honeypot] secrets", { ref });
  try {
    const rows = ref
      ? (await pgPool.query("SELECT id,ref,note FROM lab.secrets WHERE ref=$1 ORDER BY id LIMIT 10",[ref])).rows
      : (await pgPool.query("SELECT id,ref,note FROM lab.secrets ORDER BY id LIMIT 10")).rows;
    return res.json({ ok:true, secrets:rows||[] });
  } catch { return res.json({ ok:true, secrets:[] }); }
});

app.get("/api/ping", async (_req, res) => {
  try { await pgPool.query("SELECT 1"); return res.json({ ok:true }); }
  catch { return res.json({ ok:false }); }
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ erreur:"Not found" });
  return res.sendFile(path.join(DIST_DIR, "index.html"));
});


// carnet/note honeypot
app.post("/api/labo/carnet/note", async (req, res) => {
  const userId = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  const titre   = String(req.body.titre||"").slice(0,128);
  const contenu = String(req.body.contenu||"").slice(0,2000);
  const joules  = parseFloat(req.body.joules)||0;
  const date_exp = String(req.body.date_exp||"").slice(0,10);
  try {
    await mysqlPool.query(
      "INSERT INTO carnet_pages (date_exp, titre, contenu, joules, auteur) VALUES (?,?,?,?,?) DUPLICATE KEY UPDATE contenu=contenu",
      [date_exp||new Date().toISOString().slice(0,10), titre||"Note sans titre", contenu, joules, "novice"]
    );
    return res.json({ ok:true });
  } catch { return res.status(500).json({ erreur: "Erreur serveur." }); }
});


// ─────────────────────────────────────────────────────────────
// Labo — lecture des données saisies par l'utilisateur (honeypots)
// ─────────────────────────────────────────────────────────────
app.get("/api/labo/galerie/observation", async (req, res) => {
  const userId = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id, titre, commentaire, created_at FROM galerie_observations WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
      [userId]
    );
    return res.json({ observations: rows || [] });
  } catch { return res.json({ observations: [] }); }
});

app.get("/api/labo/bouteille/annotation", async (req, res) => {
  const userId = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id, session_id, note, created_at FROM bouteille_annotations WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
      [userId]
    );
    return res.json({ annotations: rows || [] });
  } catch { return res.json({ annotations: [] }); }
});

app.get("/api/labo/instruments/signalement", async (req, res) => {
  const userId = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id, instrument, description, created_at FROM instruments_signalements WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
      [userId]
    );
    return res.json({ signalements: rows || [] });
  } catch { return res.json({ signalements: [] }); }
});

app.get("/api/labo/carnet/note", async (req, res) => {
  const userId = getSession(req);
  if (!userId) return res.status(401).json({ erreur: "Session requise." });
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id, date_exp, titre, contenu, joules FROM carnet_pages WHERE auteur='novice' ORDER BY date_exp DESC LIMIT 20"
    );
    return res.json({ notes: rows || [] });
  } catch { return res.json({ notes: [] }); }
});


app.listen(PORT, "0.0.0.0", () => console.log(`[+] Listening on :${PORT}`));
