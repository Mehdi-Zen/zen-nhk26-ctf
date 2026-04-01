#!/usr/bin/env python3
"""
Load test CTFd with Locust
Usage:
  Depuis la VM CTFd (bypass Nginx):
    API_TOKEN=ctfd_xxx locust -f scripts/loadtest.py --host http://127.0.0.1:8000

  Depuis l'extérieur:
    API_TOKEN=ctfd_xxx locust -f scripts/loadtest.py --host https://192.168.213.10
"""
from locust import HttpUser, task, between
import random
import string
import os


class CTFdUser(HttpUser):
    wait_time = between(2, 8)

    def on_start(self):
        """Auth via API token (pas besoin de register/login)"""
        token = os.environ.get("API_TOKEN", "")
        self.client.headers.update({
            "Authorization": f"Token {token}",
            "Content-Type": "application/json",
        })

    @task(5)
    def view_challenges(self):
        """Browse challenges page"""
        self.client.get("/challenges", verify=False)

    @task(3)
    def view_scoreboard(self):
        """Browse scoreboard"""
        self.client.get("/scoreboard", verify=False)

    @task(3)
    def api_challenges(self):
        """Fetch challenges via API"""
        self.client.get("/api/v1/challenges", verify=False)

    @task(2)
    def api_scoreboard(self):
        """Fetch scoreboard via API"""
        self.client.get("/api/v1/scoreboard", verify=False)

    @task(2)
    def view_profile(self):
        """View own profile"""
        self.client.get("/user", verify=False)

    @task(1)
    def submit_wrong_flag(self):
        """Submit a wrong flag"""
        resp = self.client.get("/api/v1/challenges", verify=False)
        if resp.status_code == 200:
            challenges = resp.json().get("data", [])
            if challenges:
                challenge = random.choice(challenges)
                self.client.post(
                    "/api/v1/challenges/attempt",
                    json={
                        "challenge_id": challenge["id"],
                        "submission": "NHK26{wrong_" + "".join(random.choices(string.ascii_lowercase, k=6)) + "}"
                    },
                    verify=False,
                )

    @task(1)
    def view_challenge_detail(self):
        """View a specific challenge"""
        resp = self.client.get("/api/v1/challenges", verify=False)
        if resp.status_code == 200:
            challenges = resp.json().get("data", [])
            if challenges:
                challenge = random.choice(challenges)
                self.client.get(f"/api/v1/challenges/{challenge['id']}", verify=False)
