import os
import codecs
from flask import Flask, request, abort, render_template_string, send_from_directory

DEFAULT_FILES_DIR = "/app/files"
FILES_CONTENT_VERSION = "byte-me-v5"

REPORTS = {
    61: {
        "filename": "rapport_61.pdf",
        "title": "Journal de paillasse Ellman (I)",
        "snippet": "Indexation des lots, normalisation et nomenclature interne.",
        "public": True,
    },
    62: {
        "filename": "rapport_62.pdf",
        "title": "Spectres & annotations Ellman (II)",
        "snippet": "Relevés instrumentaux exportés (format historique).",
        "public": True,
    },
    63: {
        "filename": "rapport_63.pdf",
        "title": "Protocoles de contrôle Ellman (III)",
        "snippet": "Contrôles de conformité sur les pièces jointes et métadonnées.",
        "public": True,
    },
    64: {
        "filename": "rapport_64.pdf",
        "title": "Carnet de labo Ellman (IV)",
        "snippet": "Extraits de notes consolidées et renvois bibliographiques.",
        "public": True,
    },
    65: {
        "filename": "notes_publication.pdf",
        "title": "Notes de publication",
        "snippet": "Note interne de publication et de diffusion.",
        "public": True,
    },
    66: {
        "filename": "rapport_66.pdf",
        "title": "Compte rendu Dossier #66",
        "snippet": "Synthèse d’archivage et contrôle de conformité.",
        "public": True,
    },
    67: {
        "filename": "rapport_67.txt",
        "title": "Rapport 67 (brouillon)",
        "snippet": "Brouillon interne (non listé).",
        "public": False,
    },
}

app = Flask(__name__)

INDEX = """
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Archives Ellman</title>
  <style>
    :root{
      --bg:#f5f5f5; --card:#fff;
      --text:#1a1a1a; --muted:#666; --accent:#2c5282;
      --border:#ddd;
      --border2:#ccc;
      --radius:6px;
      --shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    *{box-sizing:border-box}
    body{
      margin:0; color:var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background:var(--bg);
      min-height:100vh;
    }

    .wrap{max-width:960px;margin:0 auto;padding:24px 20px 48px}
    .topbar{
      display:flex; align-items:center; justify-content:space-between; gap:16px;
      padding:12px 0;
      border-bottom:1px solid var(--border);
      margin-bottom:24px;
    }
    .brand{font-weight:700;font-size:15px;color:var(--text)}
    .badge{font-size:12px;color:var(--muted)}

    .hero{margin-bottom:24px}
    .hero-inner{padding:0}
    h1{margin:0 0 6px;font-size:22px;font-weight:700}
    .sub{margin:0;color:var(--muted);line-height:1.5;font-size:14px}

    .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;margin-top:16px}
    .panel{
      grid-column: span 12;
      border:1px solid var(--border);
      border-radius:var(--radius);
      background:var(--card);
      box-shadow:var(--shadow);
      overflow:hidden;
    }
    .panel.side{background:var(--card)}
    .panel-h{
      display:flex;align-items:center;justify-content:space-between;gap:12px;
      padding:12px 16px;border-bottom:1px solid var(--border);
      background:#fafafa;
    }
    .panel-h b{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--muted)}
    .panel-b{padding:12px 16px}

    .docs{display:flex;flex-direction:column;gap:0}
    .doc{
      padding:12px 0;
      display:flex;align-items:center;justify-content:space-between;gap:12px;
      border-bottom:1px solid #eee;
    }
    .doc:last-child{border-bottom:none}
    .title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .title{font-weight:600;font-size:14px;margin:0}
    .pill{
      font-size:10px;
      font-weight:600;
      text-transform:uppercase;
      letter-spacing:.3px;
      color:var(--muted);
      border:1px solid var(--border2);
      padding:2px 6px;
      border-radius:3px;
      background:#f9f9f9;
    }
    .line{color:var(--muted);font-size:12px;margin-top:2px}
    .id{font-variant-numeric:tabular-nums}
    .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;font-size:12px}

    a.btn{
      flex:0 0 auto;
      display:inline-flex;align-items:center;gap:6px;
      text-decoration:none;
      color:#fff;
      background:var(--accent);
      padding:7px 14px;border-radius:4px;
      font-size:13px;font-weight:500;
      white-space:nowrap;
      border:none;
    }
    a.btn:hover{background:#1a3a5c}
    a.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    code{
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size:12px;
      color:var(--text);
      background:#eee;
      padding:2px 5px;border-radius:3px;
    }
    .hint{
      display:flex;gap:10px;align-items:flex-start;
      padding:10px 12px;
      border:1px solid #d6e4d6;
      background:#f0f7f0;
      border-radius:4px;
      color:#3a5a3a;
      line-height:1.5;
      margin-top:10px;
      font-size:13px;
    }
    .small{font-size:12px;color:var(--muted)}
    .footer{margin-top:12px;color:var(--muted);font-size:11px}
    @media (min-width:900px){
      .panel{grid-column: span 8}
      .panel.side{grid-column: span 4}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand"><span aria-hidden="true"></span><span>Institut Ellman Archives</span></div>
      <div class="badge">Catalogue interne · session invitée</div>
    </div>

    <div class="hero">
      <div class="hero-inner">
        <h1>Dépôt “Jon Ellman” Dossiers & rapports</h1>
        <p class="sub">
          Fonds documentaire consacré à <b>Jon Ellman</b>, figure scientifique (chimie/biologie) :
          notes de laboratoire, comptes rendus et exports historiques.
        </p>

        <div class="grid">
          <div class="panel">
            <div class="panel-h">
              <b>Rapports publics</b>
	              <span class="small">Format : PDF</span>
            </div>
            <div class="panel-b">
	              <div class="docs">
	                {% for d in docs %}
	                <div class="doc">
	                  <div style="min-width:0">
	                    <div class="title-row">
	                      <div class="title">{{ d.title }}</div>
	                      <span class="pill">PDF</span>
	                    </div>
	                    <div class="line">ID : <span class="id">{{ d.id }}</span> · Fichier : <span class="mono">{{ d.filename }}</span></div>
	                    <div class="line small">{{ d.snippet }}</div>
	                  </div>
	                  <a class="btn" href="/download?id={{ d.id }}&name={{ d.filename }}">Télécharger →</a>
	                </div>
	                {% endfor %}
	              </div>
	            </div>
	          </div>

	          <div class="panel side">
	            <div class="panel-h">
	              <b>À propos du fonds</b>
	              <span class="small">Référence interne</span>
	            </div>
	            <div class="panel-b">
	              <div class="small">Objet</div>
	              <div style="font-weight:780;margin-top:4px">Inventaire Ellman</div>
	
	              <div style="margin-top:12px; color: var(--muted); line-height:1.6; font-size:13px">
	                Fonds documentaire consacré à Jon Ellman (chimie/biologie). Numérisations issues du laboratoire et
	                des archives administratives, consolidées après plusieurs opérations de migration.
	              </div>
	
	              <div style="margin-top:12px">
	                <div class="small">Couverture</div>
	                <div style="margin-top:4px">1976–2004 · Dernière ingestion: 2007-11-18</div>
	              </div>
	
	              <div style="margin-top:12px">
	                <div class="small">Accès</div>
	                <div style="margin-top:4px">Session invitée: lecture seule · Téléchargements journalisés</div>
	              </div>
	
	              <div style="margin-top:12px">
	                <div class="small">Statut</div>
	                <div style="margin-top:4px">Partiellement indexé · Catalogue public limité</div>
	              </div>
	
	              <div style="margin-top:12px">
	                <div class="small">Support</div>
	                <div style="margin-top:4px">archives@ellman.local · Référence à fournir: ID + nom de fichier</div>
	              </div>

	              <div class="footer">
	                <div>Accès lecture · Journalisation active</div>
	              </div>
	            </div>
	          </div>
        </div>

      </div>
    </div>
  </div>
</body>
</html>
"""

TRY_HARDER = """
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Try harder</title>
  <style>
    *{box-sizing:border-box}
    body{
      margin:0; color:#1a1a1a;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background:#f5f5f5;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
    }
    .card{
      width:min(560px, 100%);
      border:1px solid #ddd;
      border-radius:6px;
      background:#fff;
      box-shadow:0 1px 3px rgba(0,0,0,.08);
      padding:24px;
    }
    h1{margin:0 0 8px; font-size:22px; font-weight:700}
    p{margin:0; color:#666; line-height:1.5; font-size:14px}
    a{
      display:inline-flex; gap:6px; align-items:center;
      margin-top:16px;
      text-decoration:none;
      color:#fff;
      background:#2c5282;
      padding:8px 16px;border-radius:4px;
      font-size:13px;font-weight:500;
    }
    a:hover{background:#1a3a5c}
    a:focus-visible{outline:2px solid #2c5282;outline-offset:2px}
  </style>
</head>
<body>
	  <div class="card" role="main" aria-label="Try harder">
	    <h1>Try harder</h1>
	    <p>Ce document n’existe pas en version publique.</p>
	    <a href="/">Retour au catalogue →</a>
	  </div>
</body>
</html>
"""

def get_files_dir() -> str:
    return os.environ.get("FILES_DIR", DEFAULT_FILES_DIR)

def rot13(value: str) -> str:
    return codecs.encode(value, "rot_13")

def pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

def build_simple_pdf(lines: list[str]) -> bytes:
    text_ops: list[str] = []
    for line in lines:
        text_ops.append(f"({pdf_escape(line)}) Tj")
        text_ops.append("T*")
    stream = "BT\n/F1 12 Tf\n72 740 Td\n14 TL\n" + "\n".join(text_ops) + "\nET\n"
    stream_bytes = stream.encode("utf-8")

    header = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    objects: list[bytes] = []
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append(b"2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n")
    objects.append(
        b"3 0 obj\n"
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
        b"   /Resources << /Font << /F1 4 0 R >> >>\n"
        b"   /Contents 5 0 R >>\n"
        b"endobj\n"
    )
    objects.append(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    objects.append(
        b"5 0 obj\n"
        + f"<< /Length {len(stream_bytes)} >>\n".encode("ascii")
        + b"stream\n"
        + stream_bytes
        + b"endstream\nendobj\n"
    )

    out = bytearray()
    out += header
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out += obj

    xref_start = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode("ascii")
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode("ascii")
    out += (
        b"trailer\n"
        + f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode("ascii")
        + b"startxref\n"
        + f"{xref_start}\n".encode("ascii")
        + b"%%EOF\n"
    )
    return bytes(out)

def pdf_lines_for_report(report_id: int, meta: dict) -> list[str]:
    title = meta["title"]
    filename = meta["filename"]

    header = [
        "INSTITUT ELLMAN ARCHIVES",
        "Portail invites - telechargements",
        "",
        f"Dossier: Fonds Jon Ellman",
        f"Document: {title}",
        f"Reference: ID {report_id} / {filename}",
        "",
    ]

    if report_id == 65:
        return header + [
            "Note de publication (extrait)",
            "",
            "Objet:",
            "  Harmoniser les pratiques de diffusion et limiter les confusions lors des telechargements.",
            "",
            "Contexte:",
            "  Le fonds Ellman a ete consolide a partir de plusieurs sources (laboratoire, sauvegardes, exports).",
            "  Certaines pieces ont ete converties et re-nommees lors des migrations.",
            "",
            "Principes:",
            "  - L'inventaire public ne reference que des documents finalises.",
            "  - Les versions de travail (brouillons, annexes) circulent souvent sous forme de texte brut.",
            "    Elles conservent en general leur nom d'origine en attendant un export final.",
            "  - Les pieces de travail et annexes techniques restent internes jusqu'a validation.",
            "",
            "Rappel:",
            "  Toute demande de recuperation doit inclure l'identifiant et l'intitule exact du document.",
        ]

    if report_id == 66:
        return header + [
            "Compte rendu d'archivage - lot 66 (extrait)",
            "",
            "Resume:",
            "  Nettoyage des doublons, normalisation des noms, verification des metadonnees.",
            "",
            "Controle qualite:",
            "  - Integrite: verifications d'ouverture et de pages manquantes.",
            "  - Cohérence: correspondance entre l'entete de dossier et le libelle telecharge.",
            "  - Traçabilité: journalisation et horodatage des acces.",
            "",
            "Note technique:",
            "  Certains composants historiques manipulent encore les noms comme des chaines C;",
            "  un marqueur de fin (NUL, 0x00) peut entrainer une troncature inattendue.",
            "",
            "Etat:",
            "  Un rapport de la serie (67) reste en circuit interne, en attente de mise en forme.",
            "  Derniere version archivee: brouillon texte.",
            "",
            "Recommandation:",
            "  En cas d'ecart, remonter l'ID et la date/heure d'acces au support.",
        ]

    return header + [
        "Synthese:",
        "  Document public issu d'un export d'archives.",
        "",
        "Notice:",
        "  Certains contenus proviennent d'outils anciens; des differences d'encodage peuvent exister.",
        "  En cas d'anomalie, se referer a l'identifiant et au nom d'export.",
    ]

def init_files():
    files_dir = get_files_dir()
    os.makedirs(files_dir, exist_ok=True)

    version_path = os.path.join(files_dir, ".byte_me_version")
    try:
        with open(version_path, "r", encoding="utf-8") as f:
            current_version = f.read().strip()
    except FileNotFoundError:
        current_version = ""

    force_rebuild = current_version != FILES_CONTENT_VERSION

    for report_id, meta in REPORTS.items():
        filename = meta["filename"]
        file_path = os.path.join(files_dir, filename)
        if (not force_rebuild) and os.path.exists(file_path):
            continue

        if filename.endswith(".pdf"):
            lines = pdf_lines_for_report(report_id, meta)

            with open(file_path, "wb") as f:
                f.write(build_simple_pdf(lines))

        elif filename.endswith(".txt") and report_id == 67:
            flag = "NHK26{You_byt3_m3_wi1h_success}"
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(rot13(flag) + "\n")

    if force_rebuild:
        with open(version_path, "w", encoding="utf-8") as f:
            f.write(FILES_CONTENT_VERSION)


@app.get("/")
def home():
    init_files()

    docs = [
        {
            "id": report_id,
            "filename": meta["filename"],
            "title": meta["title"],
            "snippet": meta["snippet"],
        }
        for report_id, meta in REPORTS.items()
        if meta["public"]
    ]
    return render_template_string(INDEX, docs=docs)

@app.get("/download")
def download():
    init_files()

    doc_id = request.args.get("id", type=int)
    name = request.args.get("name", type=str)

    if doc_id is None or name is None:
        abort(400, "missing id or name")

    report = REPORTS.get(doc_id)
    if report is None:
        abort(404, "not found")

    # Fallback: si un proxy filtre %00, on accepte aussi "\0"
    normalized = name.replace("\\0", "\x00")

    # Contrôle "naïf": doit finir par .pdf
    # -> bypass: "rapport_67.txt%00.pdf" ou "rapport_67.txt\\0.pdf"
    if not normalized.endswith(".pdf"):
        abort(403, "pdf only")

    # BUG volontaire: troncature au null byte avant l'accès au fichier
    real_name = normalized.split("\x00", 1)[0]

    # Garde-fous anti chemins (stabilité du challenge)
    if (not real_name) or ("/" in real_name) or (".." in real_name) or ("\\" in real_name):
        abort(400, "bad name")

    if doc_id == 67 and ("\x00" not in normalized) and real_name == "rapport_67.pdf":
        return render_template_string(TRY_HARDER), 403

    if real_name != report["filename"]:
        abort(404, "not found")

    mimetype = "application/octet-stream"
    if real_name.endswith(".pdf"):
        mimetype = "application/pdf"
    elif real_name.endswith(".txt"):
        mimetype = "text/plain; charset=utf-8"

    return send_from_directory(
        get_files_dir(),
        real_name,
        as_attachment=True,
        mimetype=mimetype,
        download_name=real_name,
    )

if __name__ == "__main__":
    # Utile uniquement si tu lances en "python app.py" (pas nécessaire avec gunicorn)
    app.run(host="0.0.0.0", port=5000)
