from flask import Flask, request, render_template_string
import sqlite3
import os

app = Flask(__name__)
DB_FILE = "sequences.db"

def init_db():
    if not os.path.exists(DB_FILE):
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()

        c.execute("""
        CREATE TABLE sequences (
            id INTEGER PRIMARY KEY,
            sequence TEXT UNIQUE,
            name TEXT
        )
        """)
        c.execute("INSERT INTO sequences (sequence, name) VALUES ('ATCG', 'Séquence test')")

        c.execute("""
        CREATE TABLE vault (
            id INTEGER PRIMARY KEY,
            payload TEXT
        )
        """)
        c.execute("INSERT INTO vault (payload) VALUES ('NHK26{CRISPR2026DNA}')")

        conn.commit()
        conn.close()

@app.route('/', methods=['GET', 'POST'])
def index():
    result = ""
    if request.method == 'POST':
        sequence = request.form['sequence']
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Vulnérabilité volontaire
        query = f"SELECT id, name FROM sequences WHERE sequence = '{sequence}'"
        try:
            cursor.execute(query)
            result = cursor.fetchall()
        except sqlite3.Error as e:
            result =  "Analyse génétique impossible"

        conn.close()

    return render_template_string("""
        <h1>Expédition Génétique - Charpentier & Doudna</h1>
        <p>Entrez une séquence génétique :</p>
        <form method="post">
            <input type="text" name="sequence" required>
            <input type="submit" value="Analyser">
        </form>
        <h2>Résultat :</h2>
        <pre>{{ result }}</pre>
    """, result=result)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)

