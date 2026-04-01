import os
import sqlite3
import time
from typing import Optional

import jwt
from flask import Flask, request, jsonify, abort, render_template_string
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# JWT secret (présent mais la faille vient de la vérification)
JWT_SECRET = "scientist_vault_secret_change_me"
JWT_ALG = "HS256"

DB_PATH = "/app/vault.db"
FLAG_PATH = "/app/data/flag.txt"

# ---------- UI (CSS inline, sans indices) ----------
BASE_HTML = """
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ title }}</title>
  <style>
    :root{
      --bg:#0b1220; --card:#101a33; --muted:#9fb0d0; --text:#e9eeff;
      --accent:#7c5cff; --accent2:#2de2e6; --danger:#ff4d6d; --border:rgba(255,255,255,.08);
    }
    *{ box-sizing:border-box; }
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
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
    .brand{ display:flex; gap:10px; align-items:center; font-weight:800; letter-spacing:.2px; }
    .dot{ width:10px; height:10px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--accent2)); }
    .nav a{ color:var(--muted); text-decoration:none; margin-left:14px; font-weight:700; }
    .nav a:hover{ color:var(--text); }
    .container{ max-width:980px; margin:0 auto; padding:28px 18px 54px; }
    .card{
      background:rgba(16,26,51,.75); border:1px solid var(--border);
      border-radius:18px; padding:18px;
      box-shadow: 0 10px 30px rgba(0,0,0,.25);
    }
    .hero{ display:grid; grid-template-columns: 1.2fr .8fr; gap:18px; }
    .title{ font-size:28px; margin:0 0 10px; }
    .lead{ color:var(--muted); line-height:1.5; margin:0 0 14px; }
    .btn{
      display:inline-block; padding:10px 12px; border-radius:12px; text-decoration:none; font-weight:800;
      border:1px solid rgba(124,92,255,.55);
      background:linear-gradient(135deg, rgba(124,92,255,.25), rgba(45,226,230,.12));
      color:var(--text);
    }
    .btn:hover{ filter:brightness(1.1); }
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
    .err{ color:var(--danger); font-weight:900; }
    .small{ font-size:13px; color:var(--muted); }
    pre{ background:rgba(255,255,255,.04); padding:12px; border-radius:14px; overflow:auto; border:1px solid var(--border); }
    .footer{ margin-top:22px; color:rgba(159,176,208,.75); font-size:12.5px; }
    @media (max-width: 840px){ .hero{ grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="brand"><span class="dot"></span> Scientist Vault <span class="small">internal archive</span></div>
    <div class="nav">
      <a href="/">Accueil</a>
      <a href="/register">Register</a>
      <a href="/login">Login</a>
      <a href="/vault">Vault</a>
    </div>
  </div>
  <div class="container">
    {{ body|safe }}
    <div class="footer">Scientist Vault © 2026 • Support: équipe interne</div>
  </div>
</body>
</html>
"""

def page(title: str, body: str):
    return render_template_string(BASE_HTML, title=title, body=body)

# ---------- DB ----------
def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = db()
    con.execute("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          pw_hash TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
    """)
    con.commit()
    con.close()

# ---------- JWT helpers ----------
def issue_token(user_id: int, username: str, admin: bool = False) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "username": username,
        "admin": admin,
        "iat": now,
        "exp": now + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def get_bearer_token() -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return None

def decode_token_vuln(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "HS256")
    if alg.lower() == "none":
        return jwt.decode(token, options={"verify_signature": False}, algorithms=["none"])
    return jwt.decode(token, JWT_SECRET, algorithms=[alg])

# ---------- Routes UI (sans hints) ----------
@app.route("/")
def home():
    body = """
    <div class="hero">
      <div class="card">
        <h1 class="title">Le Coffre des Scientifiques</h1>
        <p class="lead">
          Un service interne protège des documents réservés à l’équipe scientifique.
          L’accès au coffre est restreint.
        </p>
        <a class="btn" href="/vault">Accéder au coffre</a>
      </div>
      <div class="card">
        <h2 class="title" style="font-size:20px;">Portail d’accès</h2>
        <p class="lead">Créez un compte ou connectez-vous.</p>
        <a class="btn" href="/register">Créer un compte</a>
        <a class="btn" href="/login" style="margin-left:10px;">Se connecter</a>
        <p class="small" style="margin-top:14px;">Certaines zones requièrent des privilèges.</p>
      </div>
    </div>
    """
    return page("Scientist Vault — Accueil", body)

@app.route("/register")
def register_page():
    body = """
    <div class="card">
      <h1 class="title">Register</h1>
      <p class="lead">Création de compte utilisateur.</p>
      <div class="form">
        <input id="u" placeholder="username">
        <input id="p" type="password" placeholder="password">
        <button onclick="doRegister()">Créer</button>
      </div>
      <p id="msg" class="small"></p>
      <script>
        async function doRegister(){
          const u = document.getElementById('u').value;
          const p = document.getElementById('p').value;
          const r = await fetch('/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:u, password:p})});
          const j = await r.json().catch(()=>({}));
          document.getElementById('msg').innerHTML = r.ok ? 'Compte créé. <a class="btn" href="/login">Login</a>' : '<span class="err">'+(j.error||'Erreur')+'</span>';
        }
      </script>
    </div>
    """
    return page("Scientist Vault — Register", body)

@app.route("/login")
def login_page():
    body = """
    <div class="card">
      <h1 class="title">Login</h1>
      <p class="lead">Connexion au portail.</p>
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
          const r = await fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:u, password:p})});
          const j = await r.json().catch(()=>({}));
          if(r.ok){
            // Token stocké côté client (sans l’afficher à l’écran)
            localStorage.setItem('sv_token', j.token);
            document.getElementById('msg').innerHTML = 'Connexion réussie. <a class="btn" href="/vault">Continuer</a>';
          } else {
            document.getElementById('msg').innerHTML = '<span class="err">'+(j.error||'Erreur')+'</span>';
          }
        }
      </script>
    </div>
    """
    return page("Scientist Vault — Login", body)

@app.route("/vault")
def vault_page():
    body = """
    <div class="card">
      <h1 class="title">Vault</h1>
      <p class="lead">Zone protégée.</p>
      <div class="form">
        <button onclick="loadVault()">Ouvrir</button>
      </div>
      <div id="out" class="small" style="margin-top:12px;"></div>
      <script>
        async function loadVault(){
          const t = localStorage.getItem('sv_token') || '';
          const r = await fetch('/api/vault', {headers: t ? {'Authorization':'Bearer '+t} : {}});
          const j = await r.json().catch(()=>({}));
          document.getElementById('out').innerHTML = r.ok ? '<pre>'+j.data+'</pre>' : '<span class="err">'+(j.error||'Accès refusé')+'</span>';
        }
      </script>
    </div>
    """
    return page("Scientist Vault — Vault", body)

# ---------- API ----------
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(error="username/password requis"), 400
    if len(username) > 32 or len(password) > 128:
        return jsonify(error="champs trop longs"), 400

    con = db()
    try:
        con.execute(
            "INSERT INTO users(username, pw_hash, created_at) VALUES(?,?,?)",
            (username, generate_password_hash(password), int(time.time()))
        )
        con.commit()
    except sqlite3.IntegrityError:
        return jsonify(error="username déjà pris"), 409
    finally:
        con.close()

    return jsonify(ok=True)

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    if not username or not password:
        return jsonify(error="username/password requis"), 400

    con = db()
    row = con.execute("SELECT id, username, pw_hash FROM users WHERE username=?", (username,)).fetchone()
    con.close()

    if not row or not check_password_hash(row["pw_hash"], password):
        return jsonify(error="identifiants invalides"), 401

    token = issue_token(row["id"], row["username"], admin=False)
    return jsonify(token=token)

@app.route("/api/me", methods=["GET"])
def api_me():
    token = get_bearer_token()
    if not token:
        return jsonify(error="token manquant"), 401
    try:
        payload = decode_token_vuln(token)
    except Exception:
        return jsonify(error="token invalide"), 401
    return jsonify(user={"username": payload.get("username"), "admin": bool(payload.get("admin"))})

@app.route("/api/vault", methods=["GET"])
def api_vault():
    token = get_bearer_token()
    if not token:
        return jsonify(error="token manquant"), 401

    try:
        payload = decode_token_vuln(token)
    except Exception:
        return jsonify(error="token invalide"), 401

    if not bool(payload.get("admin")):
        return jsonify(error="accès refusé"), 403

    try:
        with open(FLAG_PATH, "r", encoding="utf-8") as f:
            flag = f.read().strip()
    except FileNotFoundError:
        flag = "FLAG_FILE_MISSING"

    return jsonify(data=f"Accès accordé.\nFlag: {flag}")

@app.route("/health")
def health():
    return jsonify(status="ok")

@app.errorhandler(404)
def nf(_):
    return page("404 — Not Found", """
      <div class="card">
        <h1 class="title">404 — Introuvable</h1>
        <p class="lead">Cette ressource n’existe pas.</p>
        <a class="btn" href="/">Retour</a>
      </div>
    """), 404

@app.errorhandler(403)
def fb(_):
    return page("403 — Forbidden", """
      <div class="card">
        <h1 class="title">403 — Accès refusé</h1>
        <p class="lead">Zone restreinte.</p>
        <a class="btn" href="/login">Login</a>
      </div>
    """), 403

if __name__ == "__main__":
    os.makedirs("/app/data", exist_ok=True)
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
