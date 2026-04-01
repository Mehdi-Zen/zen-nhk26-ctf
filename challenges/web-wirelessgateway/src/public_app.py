from flask import Flask, request, render_template, jsonify
import requests
from urllib.parse import urlparse

app = Flask(__name__)

BLOCKED = ["127.", "localhost"]

def is_blocked(hostname):
    if not hostname:
        return True

    hostname = hostname.lower()

    for b in BLOCKED:
        if hostname.startswith(b):
            return True

    return False


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/diagnostic", methods=["POST"])
def diagnostic():
    url = request.form.get("url")

    if not url:
        return jsonify({"error": "Missing URL"})

    parsed = urlparse(url)
    hostname = parsed.hostname

    if is_blocked(hostname):
        return jsonify({"error": "Access denied (internal host detected)"})

    custom_header = request.form.get("header")
    headers = {}

    if custom_header:
        try:
            key, value = custom_header.split(":", 1)
            headers[key.strip()] = value.strip()
        except:
            return jsonify({"error": "Invalid header format"})

    try:
        r = requests.get(url, timeout=2, headers=headers)

        return jsonify({
            "status": r.status_code,
            "preview": r.text[:200]
        })

    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

