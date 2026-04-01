from flask import Flask, request, jsonify

app = Flask(__name__)

TOKEN = "Internal-NHK2026-Token"

with open("flag.txt") as f:
    REAL_FLAG = f.read().strip()


@app.route("/")
def home():
    return """<p>Core router v0.3</p><!-- TODO: remove /internal/stage1 before production -->"""

@app.route("/internal/stage1")
def stage1():
    return jsonify({
        "message": "Authentication required",
        "token_hint": TOKEN
    })


@app.route("/internal/flag")
def flag():

    if request.remote_addr != "127.0.0.1":
        return "Forbidden", 403

    if request.headers.get("X-Internal-Auth") != TOKEN:
        return "Unauthorized", 401

    return REAL_FLAG


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)

