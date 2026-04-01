import os
import time
import base64
import secrets
import random
from typing import Dict, Any

from flask import Flask, request, jsonify, render_template_string
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

app = Flask(__name__)

FLAG_PATH = os.getenv("FLAG_PATH", "/app/data/flag.txt")
TIMEOUT_MIN = int(os.getenv("TIMEOUT_MIN", "4"))
TIMEOUT_MAX = int(os.getenv("TIMEOUT_MAX", "6"))
MAX_ACTIVE = int(os.getenv("MAX_ACTIVE_CHALLENGES", "2000"))

challenges: Dict[str, Dict[str, Any]] = {}

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
      cursor:pointer;
    }
    .btn:hover{ filter:brightness(1.1); }
    .form input, .form textarea{
      width:100%; padding:10px 12px; margin:8px 0; border-radius:12px;
      border:1px solid var(--border); background:rgba(255,255,255,.03);
      color:var(--text); outline:none;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    .form textarea{ min-height: 96px; }
    .form button{
      width:100%; padding:10px 12px; border-radius:12px;
      border:1px solid rgba(124,92,255,.55);
      background:rgba(255,255,255,.06); color:var(--text);
      font-weight:900; cursor:pointer;
    }
    .err{ color:var(--danger); font-weight:900; }
    .ok{ color: #7CFFB2; font-weight:900; }
    .small{ font-size:13px; color:var(--muted); }
    pre{
      background:rgba(255,255,255,.04); padding:12px; border-radius:14px; overflow:auto;
      border:1px solid var(--border); white-space: pre-wrap; word-break: break-word;
    }
    .pill{
      display:inline-block; padding:6px 10px; border-radius:999px;
      border:1px solid var(--border); background:rgba(255,255,255,.04);
      color:var(--muted); font-weight:800; font-size:12px;
    }
    #status{
        background:#5144A6;
    }
    .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media (max-width: 840px){ .hero{ grid-template-columns:1fr; } .grid2{ grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="brand"><span class="dot"></span> Crypto Lab <span class="small">experimental server</span></div>
    <div class="nav">
      <a href="/">Accueil</a>
      <a href="/lab">Lab</a>
      <a href="/health">Health</a>
    </div>
  </div>
  <div class="container">
    {{ body|safe }}
    <div class="small" style="margin-top:22px; opacity:.8;">Crypto Lab © 2026 • Réservé à l’équipe scientifique</div>
  </div>
</body>
</html>
"""

def page(title: str, body: str):
    return render_template_string(BASE_HTML, title=title, body=body)


def derive_key(ikm: bytes, salt: bytes, challenge_id: str) -> bytes:
    # Durcissement "propre" : challenge_id influence HKDF info + AAD côté decrypt
    info = b"NHK26|AES-GCM|" + challenge_id.encode()
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=info,
    )
    return hkdf.derive(ikm)

def load_flag() -> str:
    try:
        with open(FLAG_PATH, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "FLAG_FILE_MISSING"

def cleanup_store(now: int):
    # Nettoyage simple (évite mémoire infinie)
    if len(challenges) <= MAX_ACTIVE:
        return
    # supprime d'abord used/expirés
    items = list(challenges.items())
    for cid, entry in items:
        if entry.get("used"):
            challenges.pop(cid, None)
    if len(challenges) <= MAX_ACTIVE:
        return
    # sinon supprime les plus vieux
    items = sorted(challenges.items(), key=lambda kv: kv[1].get("issued_at", 0))
    for cid, _ in items[: max(0, len(challenges) - MAX_ACTIVE)]:
        challenges.pop(cid, None)

@app.route("/")
def home():
    body = """
    <div class="hero">
      <div class="card">
        <h1 class="title">Cryptographie expérimentale</h1>
        <p class="lead">
          Un serveur “rebelle” vous met au défi : résoudre un déchiffrement authentifié
          dans un délai très court. Les humains peuvent-ils suivre la cadence ?
        </p>
        <a class="btn" href="/lab">Ouvrir le laboratoire</a>
        <div style="margin-top:14px;">
          <span class="pill">Crypto</span>
          <span class="pill">Timeout</span>
        </div>
      </div>
      <div class="card">
        <h2 class="title" style="font-size:20px;">Note</h2>
        <p class="lead">
          L’interface est utile, mais comportez vous comme une machine.
        </p>
      </div>
    </div>
    """
    return page("Crypto Lab — Accueil", body)

@app.route("/lab")
def lab():
    # UI: récupère un challenge via /new puis affiche; submit envoie /solve.
    # Le flag n'est JAMAIS affiché ici (uniquement JSON via /solve).
    body = """
    <div class="card">
      <h1 class="title">Laboratoire</h1>
      <p class="lead">
        Cliquez sur <b>New challenge</b>. Vous avez quelques secondes. Bonne chance 🙂
      </p>

      <div class="grid2">
        <div>
          <button class="btn" onclick="newChallenge()">New challenge</button>
          <span class="pill" id="timer">Timer: —</span>
        </div>
        <div style="text-align:right;">
          <span class="pill" id="status">Status: idle</span>
        </div>
      </div>

      <div style="margin-top:14px;">
        <div class="small">Challenge ID</div>
        <pre id="cid">—</pre>

        <div class="small">Ciphertext (base64)</div>
        <pre id="ct">—</pre>

        <div class="grid2">
          <div>
            <div class="small">IKM (hex)</div>
            <pre id="ikm">—</pre>
          </div>
          <div>
            <div class="small">Salt (hex)</div>
            <pre id="salt">—</pre>
          </div>
        </div>

        <div class="small">Solution (base64 du plaintext)</div>
        <div class="form">
          <textarea id="sol" placeholder="Collez ici solution_b64 (base64 du plaintext)"></textarea>
          <button onclick="solve()">Submit</button>
        </div>
      </div>
    </div>

    <script>
      let current = null;
      let deadline = 0;
      let tick = null;

      function setStatus(txt, ok=false){
        const el = document.getElementById('status');
        el.textContent = 'Status: ' + txt;
      }

      function startTimer(seconds){
        deadline = Date.now() + seconds*1000;
        if(tick) clearInterval(tick);
        tick = setInterval(()=>{
          const ms = deadline - Date.now();
          const s = (ms/1000).toFixed(2);
          document.getElementById('timer').textContent = 'Timer: ' + (ms>0 ? s+'s' : '0.00s');
          if(ms <= 0){
            clearInterval(tick);
          }
        }, 50);
      }

      async function newChallenge(){
        setStatus('requesting...');
        document.getElementById('sol').value = '';
        const r = await fetch('/new', {method:'POST'});
        const j = await r.json().catch(()=>({}));
        if(!r.ok){
          setStatus('error');
          return;
        }
        current = j;
        document.getElementById('cid').textContent = j.challenge_id;
        document.getElementById('ct').textContent = j.ciphertext_b64;
        document.getElementById('ikm').textContent = j.key_blob.ikm_hex;
        document.getElementById('salt').textContent = j.key_blob.salt_hex;
        setStatus('challenge issued');
        startTimer(j.timeout);
      }

      async function solve(){
        if(!current){
          setStatus('no challenge');
          return;
        }
        const solution_b64 = document.getElementById('sol').value.trim();
        if(!solution_b64){
          setStatus('missing solution');
          return;
        }
        setStatus('submitting...');
        const r = await fetch('/solve', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({challenge_id: current.challenge_id, solution_b64})
        });
        const j = await r.json().catch(()=>({}));
        // IMPORTANT: le flag n'est pas affiché (JSON only)
        if(r.ok){
          setStatus('ok (see API json)');
        } else {
          setStatus(j.status || 'failed');
        }
      }
    </script>
    """
    return page("Crypto Lab — Laboratoire", body)


@app.route("/new", methods=["POST"])
def api_new():
    now = int(time.time())
    cleanup_store(now)

    challenge_id = "chal-" + secrets.token_hex(4)
    timeout = random.randint(TIMEOUT_MIN, TIMEOUT_MAX)

    ikm = secrets.token_bytes(32)
    salt = secrets.token_bytes(16)
    key = derive_key(ikm, salt, challenge_id)

    nonce = secrets.token_bytes(12)

    # Plaintext unique à chaque /new 
    token = secrets.token_hex(12)  # 24 hex chars
    plaintext = f"TOKEN:{token}|TS:{now}|CID:{challenge_id}".encode()

    aad = b"NHK26|AAD|" + challenge_id.encode()

    aesgcm = AESGCM(key)
    ct_and_tag = aesgcm.encrypt(nonce, plaintext, aad)

    raw = nonce + ct_and_tag  # nonce(12) || ciphertext||tag(16)
    ciphertext_b64 = base64.b64encode(raw).decode()

    challenges[challenge_id] = {
        "plaintext": plaintext,
        "issued_at": now,
        "timeout": timeout,
        "used": False,
    }

    return jsonify({
        "challenge_id": challenge_id,
        "ciphertext_b64": ciphertext_b64,
        "key_blob": {
            "ikm_hex": ikm.hex(),
            "salt_hex": salt.hex(),
        },
        "timeout": timeout,
        "issued_at": now
    })

@app.route("/solve", methods=["POST"])
def api_solve():
    data = request.get_json(silent=True) or {}
    challenge_id = (data.get("challenge_id") or "").strip()
    solution_b64 = (data.get("solution_b64") or "").strip()

    entry = challenges.get(challenge_id)
    if not entry:
        return jsonify({"status": "unknown_challenge"}), 400

    if entry.get("used"):
        return jsonify({"status": "expired"}), 400

    now = time.time()
    if now > entry["issued_at"] + entry["timeout"]:
        entry["used"] = True
        return jsonify({"status": "timeout"}), 400

    # Ne jamais faire confiance à une date/entête client : on ignore tout header.
    # On utilise uniquement issued_at stocké côté serveur.

    try:
        submitted = base64.b64decode(solution_b64, validate=True)
    except Exception:
        entry["used"] = True
        return jsonify({"status": "invalid_base64"}), 400

    # Réponse attendue = plaintext exact (impossible à deviner)
    if submitted != entry["plaintext"]:
        entry["used"] = True
        return jsonify({"status": "wrong"}), 400

    entry["used"] = True
    return jsonify({"status": "ok", "flag": load_flag()})

@app.route("/robots.txt", methods=["GET"])
def robots():
    content = (
        "User-agent: *\n"
        "Disallow: /internal/\n"
        "\n"
        "# HKDF info : NHK26|AES-GCM|CHALLENGE_ID\n"
        "# GCM  AAD  : NHK26|AAD|CHALLENGE_ID\n"
    )
    return content, 200, {"Content-Type": "text/plain; charset=utf-8"}

@app.route("/health", methods=["GET"])
def health():
    return jsonify(status="ok")

# age 404 propre 
@app.errorhandler(404)
def nf(_):
    return page("404 — Not Found", """
      <div class="card">
        <h1 class="title">404 — Introuvable</h1>
        <p class="lead">Cette ressource n’existe pas.</p>
        <a class="btn" href="/">Retour</a>
      </div>
    """), 404

if __name__ == "__main__":
    os.makedirs("/app/data", exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=False)
