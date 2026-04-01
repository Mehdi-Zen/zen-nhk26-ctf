from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Internal Admin Panel v1.2 <!-- debug: core-router migrated to port 9000 -->"

@app.route("/flag")
def fake_flag():
    return "FLAG{Tu es tombe dans le piege, dommage}"

@app.route("/status")
def status():
    return "Services: admin-panel:8000(active) core-router:9000(active) monitor:9090(disabled)"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)

