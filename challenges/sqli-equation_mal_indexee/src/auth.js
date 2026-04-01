const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { MongoClient } = require("mongodb");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || "ramanujan";

let db;

const sessions = new Map();
function newSid() {
  return crypto.randomBytes(16).toString("hex");
}
function getSession(req) {
  const sid = req.cookies.sid;
  if (!sid) return null;
  return sessions.get(sid) || null;
}

const BASE_HTML = (title, body) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root{
    --bg:#0b1220; --card:#101a33; --muted:#9fb0d0; --text:#e9eeff;
    --accent:#7c5cff; --accent2:#2de2e6; --danger:#ff4d6d; --border:rgba(255,255,255,.08);
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;
    background: radial-gradient(900px 400px at 20% 0%, rgba(124,92,255,.25), transparent 60%),
                radial-gradient(900px 500px at 80% 20%, rgba(45,226,230,.18), transparent 60%),
                var(--bg);
    color:var(--text); min-height:100vh;
  }
  .topbar{
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 22px; border-bottom:1px solid var(--border);
    background:rgba(16,26,51,.55); backdrop-filter: blur(10px);
    position: sticky; top:0;
  }
  .brand{display:flex; gap:10px; align-items:center; font-weight:800}
  .dot{width:10px; height:10px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--accent2))}
  .nav a{color:var(--muted); text-decoration:none; margin-left:14px; font-weight:700}
  .nav a:hover{color:var(--text)}
  .container{max-width:980px; margin:0 auto; padding:28px 18px 54px}
  .card{
    background:rgba(16,26,51,.75); border:1px solid var(--border);
    border-radius:18px; padding:18px;
    box-shadow: 0 10px 30px rgba(0,0,0,.25);
  }
  .hero{display:grid; grid-template-columns: 1.2fr .8fr; gap:18px}
  .title{font-size:28px; margin:0 0 10px}
  .lead{color:var(--muted); line-height:1.5; margin:0 0 14px}
  .btn{
    display:inline-block; padding:10px 12px; border-radius:12px; text-decoration:none; font-weight:800;
    border:1px solid rgba(124,92,255,.55);
    background:linear-gradient(135deg, rgba(124,92,255,.25), rgba(45,226,230,.12));
    color:var(--text);
  }
  .btn:hover{filter:brightness(1.1)}
  .form input{
    width:100%; padding:10px 12px; margin:8px 0; border-radius:12px;
    border:1px solid var(--border); background:rgba(255,255,255,.03);
    color:var(--text); outline:none;
  }
  .form button{
    width:100%; padding:10px 12px; border-radius:12px;
    border:1px solid rgba(124,92,255,.55);
    background:rgba(255,255,255,.06); color:var(--text);
    font-weight:900; cursor:pointer;
  }
  .err{color:var(--danger); font-weight:900}
  .small{font-size:13px; color:var(--muted)}
  .footer{margin-top:22px; color:rgba(159,176,208,.75); font-size:12.5px}
  @media (max-width: 840px){ .hero{grid-template-columns:1fr} }
</style>
</head>
<body>
  <div class="topbar">
    <div class="brand"><span class="dot"></span> Ramanujan Portal <span class="small">legacy access</span></div>
    <div class="nav">
      <a href="/">Accueil</a>
      <a href="/login">Login</a>
      <a href="/elite">Elite</a>
      <a href="/logout">Logout</a>
    </div>
  </div>
  <div class="container">
    ${body}
    <div class="footer">Ramanujan Portal © 2026 • Internal build</div>
  </div>
</body>
</html>`;

MongoClient.connect(MONGO_URL).then((client) => {
  db = client.db(DB_NAME);
  console.log("[+] Connected to MongoDB");
});

app.get("/", (req, res) => {
  const sess = getSession(req);
  const who = sess ? `<p class="small">Connecté en tant que <b>${sess.user}</b></p>` : `<p class="small">Non connecté</p>`;
  const body = `
    <div class="hero">
      <div class="card">
        <h1 class="title">L’équation mal indexée</h1>
        <p class="lead">
          Portail d’accès historique réservé au personnel scientifique.
          Certaines ressources requièrent des privilèges élevés.
        </p>
        ${who}
        <a class="btn" href="/login">Accéder au portail</a>
      </div>
      <div class="card">
        <h2 class="title" style="font-size:20px;">Zone restreinte</h2>
        <p class="lead">Accès soumis à autorisation.</p>
        <a class="btn" href="/elite">Entrer</a>
      </div>
    </div>`;
  res.send(BASE_HTML("Accueil", body));
});

app.get("/login", (req, res) => {
  const body = `
    <div class="card">
      <h1 class="title">Login</h1>
      <p class="lead">Authentification requise.</p>
      <div class="form">
        <input id="u" placeholder="username">
        <input id="p" type="password" placeholder="password">
        <button onclick="doLogin()">Connexion</button>
      </div>
      <p id="msg" class="small"></p>
      <script>
        async function doLogin(){
          const u = document.getElementById('u').value;
          const p = document.getElementById('p').value;
          const r = await fetch('/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:u, password:p})});
          const j = await r.json().catch(()=>({}));
          document.getElementById('msg').innerHTML = r.ok ? 'Connexion réussie. <a class="btn" href="/elite">Continuer</a>' : '<span class="err">'+(j.error||'Unauthorized')+'</span>';
        }
      </script>
    </div>`;
  res.send(BASE_HTML("Login", body));
});

app.post("/login", async (req, res) => {
  if (!db) return res.status(503).json({ error: "db not ready" });

  const { username, password } = req.body;

  const user = await db.collection("users").findOne({ username: username, password: password });

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const sid = newSid();
  sessions.set(sid, { user: user.username, role: user.role || "user" });

  res.cookie("sid", sid, { httpOnly: true, sameSite: "Lax" });
  return res.json({ msg: "Logged in", user: user.username });
});

app.get("/elite", (req, res) => {
  const sess = getSession(req);
  if (!sess) return res.status(403).send(BASE_HTML("Forbidden", `<div class="card"><h1 class="title">Accès refusé</h1><p class="lead">Login requis.</p><a class="btn" href="/login">Login</a></div>`));

  if (sess.role === "elite") {
    return res.sendFile("/app/data/flag.txt");
  }
  return res.status(403).send(BASE_HTML("Forbidden", `<div class="card"><h1 class="title">Accès refusé</h1><p class="lead">Autorisation insuffisante.</p></div>`));
});

app.get("/logout", (req, res) => {
  const sid = req.cookies.sid;
  if (sid) sessions.delete(sid);
  res.clearCookie("sid");
  res.redirect("/");
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(5000, () => console.log("[*] Listening on :5000"));
