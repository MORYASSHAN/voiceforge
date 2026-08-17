import pytest
import os
import sys
from fastapi.testclient import TestClient

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

token_server_dir = os.path.join(root_dir, "token-server")
if token_server_dir not in sys.path:
    sys.path.insert(0, token_server_dir)

from token_server import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data.get("service") == "VoiceForge Token Server"
    assert data.get("status") == "online"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

def test_personas_endpoint():
    response = client.get("/personas")
    assert response.status_code == 200
    data = response.json()
    assert "personas" in data
    assert len(data["personas"]) >= 3

def test_token_missing_credentials(monkeypatch):
    monkeypatch.delenv("LIVEKIT_API_KEY", raising=False)
    monkeypatch.delenv("LIVEKIT_API_SECRET", raising=False)
    
    response = client.get("/token?room=test&identity=user1")
    assert response.status_code == 500
    assert "must be configured in .env" in response.json()["detail"]

def test_token_missing_url(monkeypatch):
    monkeypatch.setenv("LIVEKIT_API_KEY", "APItest123")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "secretkey1234567890")
    monkeypatch.delenv("LIVEKIT_URL", raising=False)
    
    response = client.get("/token?room=test&identity=user1")
    assert response.status_code == 500
    assert "LIVEKIT_URL" in response.json()["detail"]

def test_token_successful_generation(monkeypatch):
    monkeypatch.setenv("LIVEKIT_API_KEY", "APItest123")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "secretkey12345678901234567890")
    monkeypatch.setenv("LIVEKIT_URL", "wss://test.livekit.cloud")
    
    response = client.get("/token?room=main-room&identity=alice&name=Alice")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert len(data["token"]) > 20
    assert data["url"] == "wss://test.livekit.cloud"
    assert data["room"] == "main-room"
    assert data["identity"] == "alice"

def test_token_empty_room():
    response = client.get("/token?room= &identity=alice")
    assert response.status_code in [400, 500]
