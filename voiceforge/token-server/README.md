# VoiceForge LiveKit Token Server

A lightweight FastAPI service for minting LiveKit JWT access tokens for participants joining VoiceForge audio sessions.

## Features
- FastAPI with Uvicorn ASGI server
- Generates signed LiveKit JWT tokens with room join, publish, and subscribe permissions
- CORS middleware enabled for web clients
- Health check endpoints (`/health` and `/`)
- Interactive Swagger OpenAPI documentation at `/docs`

## Installation

```bash
# Create and activate virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and fill in your LiveKit credentials:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `LIVEKIT_URL` | LiveKit WebSocket server URL | `ws://localhost:7880` |
| `LIVEKIT_API_KEY` | LiveKit API Key | `devkey` |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | `secret` |
| `PORT` | Token Server Port | `8080` |
| `HOST` | Token Server Host | `0.0.0.0` |

## Running the Server

```bash
python token_server.py
```
Or via uvicorn directly:
```bash
uvicorn token_server:app --host 0.0.0.0 --port 8080 --reload
```

## API Usage

### 1. Request Token (POST)
```bash
curl -X POST http://localhost:8080/token \
  -H "Content-Type: application/json" \
  -d '{"room_name": "voiceforge-demo", "participant_name": "user-123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "room_name": "voiceforge-demo",
  "participant_name": "user-123",
  "server_url": "ws://localhost:7880"
}
```

### 2. Request Token (GET)
```bash
curl "http://localhost:8080/token?room_name=voiceforge-demo&participant_name=user-123"
```
