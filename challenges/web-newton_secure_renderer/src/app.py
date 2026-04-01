from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

PORT = 5000
BLACKLIST = ["import", "os", "open", "eval", "exec", "__", "flag"]

HTML_BASE = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Newton's Renderer</title>
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    :root {{
      --bg:       #0a0c10;
      --surface:  #111418;
      --border:   #1e2530;
      --accent:   #00e5ff;
      --accent2:  #ff4081;
      --text:     #c8d6e5;
      --muted:    #4a5568;
      --mono:     'Share Tech Mono', monospace;
      --sans:     'Syne', sans-serif;
    }}

    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--mono);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }}

    /* Scanline overlay */
    body::before {{
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,229,255,0.015) 2px,
        rgba(0,229,255,0.015) 4px
      );
      pointer-events: none;
      z-index: 999;
    }}

    /* Radial glow background */
    body::after {{
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%),
        radial-gradient(ellipse 40% 30% at 80% 100%, rgba(255,64,129,0.05) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }}

    .card {{
      position: relative;
      z-index: 1;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      width: min(520px, 92vw);
      box-shadow:
        0 0 0 1px rgba(0,229,255,0.08),
        0 32px 64px rgba(0,0,0,0.6),
        inset 0 1px 0 rgba(255,255,255,0.04);
      animation: fadeIn 0.6s ease both;
    }}

    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(12px); }}
      to   {{ opacity: 1; transform: translateY(0); }}
    }}

    /* Title bar */
    .titlebar {{
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      background: rgba(0,0,0,0.3);
    }}
    .dot {{ width: 10px; height: 10px; border-radius: 50%; }}
    .dot-r {{ background: #ff5f57; }}
    .dot-y {{ background: #febc2e; }}
    .dot-g {{ background: #28c840; }}
    .titlebar-label {{
      margin-left: auto;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }}

    /* Body */
    .body {{
      padding: 36px 40px 40px;
    }}

    /* Header */
    .header {{ margin-bottom: 28px; }}
    .header h1 {{
      font-family: var(--sans);
      font-weight: 800;
      font-size: 22px;
      color: #fff;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }}
    .header h1 span {{ color: var(--accent); }}
    .header p {{
      margin-top: 8px;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.6;
    }}

    /* Security badge */
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 4px 10px;
      border: 1px solid rgba(255,64,129,0.3);
      border-radius: 2px;
      font-size: 10px;
      color: var(--accent2);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(255,64,129,0.06);
    }}
    .badge::before {{
      content: '●';
      font-size: 8px;
      animation: blink 1.2s step-start infinite;
    }}
    @keyframes blink {{ 50% {{ opacity: 0; }} }}

    /* Divider */
    .divider {{
      border: none;
      border-top: 1px solid var(--border);
      margin: 24px 0;
    }}

    /* Form */
    .field {{ margin-bottom: 16px; }}
    .field label {{
      display: block;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }}
    .field input {{
      width: 100%;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--border);
      border-radius: 3px;
      color: var(--accent);
      font-family: var(--mono);
      font-size: 14px;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      caret-color: var(--accent);
    }}
    .field input::placeholder {{ color: rgba(0,229,255,0.2); }}
    .field input:focus {{
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(0,229,255,0.08), inset 0 0 12px rgba(0,229,255,0.04);
    }}

    button {{
      width: 100%;
      padding: 11px;
      background: transparent;
      border: 1px solid var(--accent);
      border-radius: 3px;
      color: var(--accent);
      font-family: var(--mono);
      font-size: 13px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: color 0.25s, background 0.25s, box-shadow 0.25s;
    }}
    button:hover {{
      background: var(--accent);
      color: var(--bg);
      box-shadow: 0 0 24px rgba(0,229,255,0.25);
    }}

    /* Result block */
    .result-label {{
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }}
    .result-box {{
      background: rgba(0,0,0,0.45);
      border: 1px solid var(--border);
      border-left: 3px solid {accent_color};
      border-radius: 3px;
      padding: 14px 16px;
      font-size: 15px;
      color: {result_text_color};
      word-break: break-all;
      line-height: 1.5;
    }}
    .result-box.blocked {{
      border-left-color: var(--accent2);
      color: var(--accent2);
    }}

    /* Back link */
    .back {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 20px;
      font-size: 11px;
      color: var(--muted);
      text-decoration: none;
      letter-spacing: 0.08em;
      transition: color 0.2s;
    }}
    .back:hover {{ color: var(--accent); }}
    .back::before {{ content: '←'; }}

    /* Prompt line decoration */
    .prompt {{
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 20px;
    }}
    .prompt span {{ color: var(--accent); }}
  </style>
</head>
<body>
  <div class="card">
    <div class="titlebar">
      <div class="dot dot-r"></div>
      <div class="dot dot-y"></div>
      <div class="dot dot-g"></div>
      <span class="titlebar-label">newton_renderer v1.0</span>
    </div>
    <div class="body">
      {content}
    </div>
  </div>
</body>
</html>"""

INDEX_CONTENT = """
<div class="header">
  <h1>Newton's<br/><span>Secure</span> Renderer</h1>
  <p>Évaluateur d'expressions mathématiques avec filtre de sécurité intégré.</p>
  <div class="badge">filtre actif</div>
</div>
<hr class="divider"/>
<div class="prompt">&gt; <span>entrer une expression à évaluer</span></div>
<form action="/render" method="GET">
  <div class="field">
    <label>Formule</label>
    <input name="formule" placeholder="ex: 2**10 + 42" autocomplete="off" autofocus />
  </div>
  <button type="submit">Exécuter</button>
</form>
"""

def render_result_content(result_str, blocked=False):
    if blocked:
        accent = "var(--accent2)"
        text_color = "var(--accent2)"
        box_class = "result-box blocked"
    else:
        accent = "var(--accent)"
        text_color = "var(--accent)"
        box_class = "result-box"

    return f"""
<div class="header">
  <h1>Newton's<br/><span>Secure</span> Renderer</h1>
</div>
<hr class="divider"/>
<div class="result-label">Résultat</div>
<div class="{box_class}">{result_str}</div>
<a class="back" href="/">Nouvelle expression</a>
"""

class VulnerableServer(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed_path = urlparse(self.path)

        if parsed_path.path == "/":
            page = HTML_BASE.format(
                content=INDEX_CONTENT,
                accent_color="var(--accent)",
                result_text_color="var(--accent)"
            )
            self._respond(200, page)

        elif parsed_path.path == "/render":
            query = parse_qs(parsed_path.query)
            formula = query.get("formule", [""])[0]

            blocked = False
            for word in BLACKLIST:
                if word in formula:
                    result = "⛔ Bloqué par le filtre de sécurité"
                    blocked = True
                    break
            else:
                try:
                    result = str(eval(formula))
                except Exception as e:
                    result = f"Erreur : {e}"

            content = render_result_content(result, blocked=blocked)
            page = HTML_BASE.format(
                content=content,
                accent_color="var(--accent2)" if blocked else "var(--accent)",
                result_text_color="var(--accent2)" if blocked else "var(--accent)"
            )
            self._respond(200, page)

        else:
            self.send_response(404)
            self.end_headers()

    def _respond(self, code, html):
        encoded = html.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), VulnerableServer)
    print(f"  Newton's Renderer — http://localhost:{PORT}")
    server.serve_forever()
