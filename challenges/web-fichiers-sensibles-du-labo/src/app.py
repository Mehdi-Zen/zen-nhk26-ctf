from flask import Flask, request, render_template
import mysql.connector

app = Flask(__name__)

db = mysql.connector.connect(
    host="localhost",
    user="flask",
    password="flaskpass",
    database="db_scientists"
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/lab")
def lab():
    scientist_id = request.args.get("id")

    if not scientist_id:
        return render_template("intermediaire.html")

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM scientists WHERE id=%s", (scientist_id,))
    user = cursor.fetchone()

    if not user:
        return render_template("aucun.html")

    return render_template("lab.html", user=user)

app.run(host="0.0.0.0", port=5000)
