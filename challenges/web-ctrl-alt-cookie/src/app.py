from flask import Flask, request, make_response, render_template_string

app = Flask(__name__)

FLAG = "NHK26{l0u_m0n7ull1_41m3_l35_c00k135}"

LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ctrl+Alt+Cookie</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 50px;
            text-align: center;
            background-color: {{ background_color }};
            transition: background-color 0.8s ease;
        }
    </style>
</head>
<body>
    <h1>Connexion Administrateur</h1>
    <form method="POST">
        <label>Utilisateur :</label><br>
        <input type="text" name="username" required><br><br>
        <label>Mot de passe :</label><br>
        <input type="password" name="password" required><br><br>
        <button type="submit">Se connecter</button>
    </form>

    {% if message %}
    <script>
        alert({{ message|tojson }});
    </script>
    {% endif %}
</body>
</html>
"""

@app.route("/", methods=["GET", "POST"])
def login():
    nbessai = int(request.cookies.get("nbessai", "0"))
    administrateur = int(request.cookies.get("Administrateur", "0"))

    if nbessai < 3:
        background_color = "#90ee90"
    else:
        bloc = (nbessai - 3) // 3
        if bloc % 2 == 0:
            background_color = "#ff7f7f"
        else:
            background_color = "#90ee90"

    message = None

    if request.method == "POST":
        if administrateur == 1:
            message = f"Félicitations ! Le flag est :\n{FLAG}"
        else:
            message = "Identifiants incorrects !"
        nbessai += 1

    resp = make_response(render_template_string(
        LOGIN_TEMPLATE,
        background_color=background_color,
        message=message
    ))

    resp.set_cookie("nbessai", str(nbessai), httponly=True, samesite="Lax")

    if "Administrateur" not in request.cookies:
        resp.set_cookie("Administrateur", "0", httponly=False)

    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"

    return resp


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
