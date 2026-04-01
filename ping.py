import requests
import sys
try:
    r = requests.get("http://localhost:8000", timeout=5)
    sys.exit(0 if r.status_code == 200 else 1)
except:
    sys.exit(1)
