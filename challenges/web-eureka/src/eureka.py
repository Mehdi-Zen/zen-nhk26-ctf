from flask import Flask, request, make_response, render_template_string

app = Flask(__name__)

HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Connexion Archimède</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; margin-top: 50px; background-color: #f4f4f4; }
        .login-box { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        .error { color: red; font-size: 0.9em; text-align: center; }
    </style>
</head>
<body>
    <div class="login-box">
        <h3 style="text-align: center;">Authentification</h3>
        <form method="POST" action="/login">
            <input type="text" name="user" placeholder="Identifiant" required>
            <input type="password" name="pw" placeholder="Mot de passe" required>
            <button type="submit">Se connecter</button>
        </form>
        {% if msg %}<p class="error">{{ msg }}</p>{% endif %}
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    resp = make_response(render_template_string(HTML_PAGE))
    resp.headers['Archimede-Levier'] = 'user'
    return resp

@app.route('/login', methods=['POST'])
def login():
    return render_template_string(HTML_PAGE, msg="Erreur : Identifiants incorrects.")

@app.route('/archi')
def admin():
    role = request.headers.get('Archimede-Levier')
    if role == 'admin':
        return "Eurêka ! Voici votre flag : <b style='color:white'>NHK26{ARCHIMEDE-Poussee-9923}</b>"
    elif role == 'user':
        return "Accès refusé : Seul l'administrateur peut actionner le levier.", 403
    else:
        return "Erreur : Rôle non identifié.", 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
