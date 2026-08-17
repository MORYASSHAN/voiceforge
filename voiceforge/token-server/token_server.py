import os
import glob
import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest

# Search for .env in current directory, parent directory, and project root
_base_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_base_dir)
_candidate_envs = [
    os.path.join(os.getcwd(), ".env"),
    os.path.join(_root_dir, ".env"),
    os.path.join(_base_dir, ".env"),
]
for p in _candidate_envs:
    if os.path.exists(p):
        load_dotenv(p)
        break
else:
    load_dotenv()

app = FastAPI(
    title="VoiceForge Token Server",
    description="Mint LiveKit JWT access tokens for real-time voice sessions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "VoiceForge Token Server",
        "status": "online",
        "docs": "/docs",
        "livekit_url_configured": bool(os.getenv("LIVEKIT_URL")),
    }

@app.get("/health")
def health_check():
    api_key_set = bool(os.getenv("LIVEKIT_API_KEY"))
    api_secret_set = bool(os.getenv("LIVEKIT_API_SECRET"))
    livekit_url = os.getenv("LIVEKIT_URL")
    return {
        "status": "healthy" if (api_key_set and api_secret_set and livekit_url) else "misconfigured",
        "livekit_api_key_present": api_key_set,
        "livekit_api_secret_present": api_secret_set,
        "livekit_url": livekit_url or None,
    }

@app.get("/personas")
def get_personas():
    """Lists available personas from cli/templates directory."""
    templates_dir = os.path.join(_root_dir, "cli", "templates")
    personas = []
    if os.path.exists(templates_dir):
        for filepath in sorted(glob.glob(os.path.join(templates_dir, "*.yaml"))):
            slug = os.path.splitext(os.path.basename(filepath))[0]
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict):
                        personas.append({
                            "slug": slug,
                            "name": data.get("name", slug.replace("_", " ").title()),
                            "system_prompt": data.get("system_prompt", ""),
                        })
            except Exception:
                pass
    return {"personas": personas, "active_persona": os.getenv("VOICEFORGE_PERSONA", "study_buddy")}

@app.get("/token")
async def get_token(
    room: str = Query(..., description="The room name to join"),
    identity: str = Query(..., description="Unique participant identity"),
    name: str = Query(None, description="Display name for participant"),
):
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    livekit_url = os.getenv("LIVEKIT_URL")

    if not api_key or not api_secret:
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be configured in .env",
        )

    if not livekit_url:
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_URL must be configured in .env",
        )

    if not room.strip():
        raise HTTPException(status_code=400, detail="Room name cannot be empty")

    if not identity.strip():
        raise HTTPException(status_code=400, detail="Identity cannot be empty")

    room = room.strip()
    participant_name = name or identity

    try:
        token = (
            api.AccessToken(api_key, api_secret)
            .with_identity(identity.strip())
            .with_name(participant_name.strip())
            .with_grants(api.VideoGrants(room_join=True, room=room))
        )

        # Explicit agent dispatch: the agent worker registers with
        # agent_name="voiceforge", so it only joins rooms with a matching
        # dispatch. A RoomConfiguration on the token only triggers dispatch
        # when the room is first created, so we create the dispatch directly
        # (skipping if one already exists) to ensure the agent joins even if
        # the room already existed from a prior session.
        lkapi = api.LiveKitAPI(livekit_url, api_key, api_secret)
        try:
            try:
                existing = await lkapi.agent_dispatch.list_dispatch(room_name=room)
            except Exception:
                # Room doesn't exist yet (first join) - nothing dispatched yet.
                existing = []
            if not any(d.agent_name == "voiceforge" for d in existing):
                try:
                    await lkapi.agent_dispatch.create_dispatch(
                        CreateAgentDispatchRequest(agent_name="voiceforge", room=room)
                    )
                except Exception as dispatch_err:
                    # Don't fail token issuance if dispatch bookkeeping fails;
                    # the room-join token is still valid on its own.
                    print(f"Warning: agent dispatch failed for room '{room}': {dispatch_err}")
        finally:
            await lkapi.aclose()

        return {
            "token": token.to_jwt(),
            "url": livekit_url.strip(),
            "room": room,
            "identity": identity.strip(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create LiveKit token: {str(e)}",
        )
