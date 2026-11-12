"""
Zenith Auth - Official Python SDK
Production-ready client authentication and license verification
"""

import requests
import json
import uuid
import platform
import hashlib

class ZenithAuth:
    def __init__(self, app_id: int, public_key: str, base_url: str = "http://127.0.0.1:3000/api/v1/client"):
        self.app_id = app_id
        self.public_key = public_key
        self.base_url = base_url.rstrip('/')
        self.session_token = None
        self.user_data = None

    def get_hwid(self) -> str:
        """Generates a stable hardware identifier based on CPU & network MAC"""
        raw = f"{platform.node()}-{uuid.getnode()}-{platform.processor()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:24].upper()

    def initialize(self, client_version: str = "2.4.0") -> bool:
        """Performs initial integrity handshake with Zenith Auth servers"""
        payload = {
            "app_id": self.app_id,
            "public_key": self.public_key,
            "client_version": client_version
        }
        try:
            resp = requests.post(f"{self.base_url}/init", json=payload, timeout=8)
            data = resp.json()
            return resp.status_code == 200 and data.get("status") is True
        except Exception as e:
            print(f"[Zenith] Handshake Error: {e}")
            return False

    def login(self, username: str, password: str, hwid: str = None) -> dict:
        """Authenticates user credentials and binds HWID"""
        if not hwid:
            hwid = self.get_hwid()
        payload = {
            "username": username,
            "password": password,
            "hwid": hwid,
            "app_id": self.app_id
        }
        resp = requests.post(f"{self.base_url}/login", json=payload, timeout=8)
        data = resp.json()
        if data.get("status"):
            self.session_token = data.get("token")
            self.user_data = data.get("user")
        return data

    def register(self, username: str, email: str, password: str, license_key: str, hwid: str = None) -> dict:
        """Registers a new account using an unredeemed license key"""
        if not hwid:
            hwid = self.get_hwid()
        payload = {
            "username": username,
            "email": email,
            "password": password,
            "license_key": license_key,
            "hwid": hwid,
            "app_id": self.app_id
        }
        resp = requests.post(f"{self.base_url}/register", json=payload, timeout=8)
        return resp.json()

    def verify_license(self, license_key: str, hwid: str = None) -> dict:
        """Checks license validity, duration, and expiration status"""
        if not hwid:
            hwid = self.get_hwid()
        payload = {
            "license_key": license_key,
            "hwid": hwid,
            "app_id": self.app_id
        }
        resp = requests.post(f"{self.base_url}/license/verify", json=payload, timeout=8)
        return resp.json()

    def get_variables(self, username: str = None) -> dict:
        """Retrieves global and user-specific variables"""
        payload = {
            "app_id": self.app_id,
            "username": username or (self.user_data.get("username") if self.user_data else None)
        }
        resp = requests.post(f"{self.base_url}/vars", json=payload, timeout=8)
        return resp.json()

    def ping(self) -> bool:
        """Sends session keepalive heartbeat"""
        if not self.session_token:
            return False
        resp = requests.post(f"{self.base_url}/session/ping", json={"session_token": self.session_token}, timeout=5)
        return resp.status_code == 200
