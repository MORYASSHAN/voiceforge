import os
import glob
import json
import re
import yaml
import urllib.request
import urllib.error
from dotenv import load_dotenv, set_key
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from livekit import api
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest

# Search for .env in candidate locations
_base_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_base_dir)
_candidate_envs = [
    os.path.join(os.getcwd(), ".env"),
    os.path.join(_root_dir, ".env"),
    os.path.join(_base_dir, ".env"),
]
_env_file_path = os.path.join(_root_dir, ".env")
for p in _candidate_envs:
    if os.path.exists(p):
        _env_file_path = p
        load_dotenv(p)
        break
else:
    load_dotenv()

app = FastAPI(
    title="VoiceForge Token & Pipeline Server",
    description="Real-time voice AI orchestrator, persona management & LiveKit token gateway",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PersonaModel(BaseModel):
    slug: str = Field(..., description="Unique slug for the persona (e.g. study_buddy)")
    name: str = Field(..., description="Human-readable name")
    system_prompt: str = Field(..., description="LLM System instructions")
    description: Optional[str] = Field(None, description="Short summary description")

class ActivePersonaModel(BaseModel):
    slug: str = Field(..., description="Persona slug to activate")

class KeyValidationRequest(BaseModel):
    groq_api_key: Optional[str] = None
    livekit_url: Optional[str] = None
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None

@app.get("/")
def root():
    return {
        "service": "VoiceForge Token Server",
        "version": "1.2.0",
        "status": "online",
        "docs": "/docs",
        "livekit_url_configured": bool(os.getenv("LIVEKIT_URL")),
        "groq_key_configured": bool(os.getenv("GROQ_API_KEY")),
        "active_persona": os.getenv("VOICEFORGE_PERSONA", "study_buddy"),
    }

@app.get("/health")
def health_check():
    api_key_set = bool(os.getenv("LIVEKIT_API_KEY"))
    api_secret_set = bool(os.getenv("LIVEKIT_API_SECRET"))
    livekit_url = os.getenv("LIVEKIT_URL")
    groq_key_set = bool(os.getenv("GROQ_API_KEY"))
    return {
        "status": "healthy" if (api_key_set and api_secret_set and livekit_url and groq_key_set) else "misconfigured",
        "livekit_api_key_present": api_key_set,
        "livekit_api_secret_present": api_secret_set,
        "livekit_url": livekit_url or None,
        "groq_api_key_present": groq_key_set,
        "active_persona": os.getenv("VOICEFORGE_PERSONA", "study_buddy"),
    }

@app.get("/diagnostics")
def get_diagnostics():
    return {
        "stt_model": os.getenv("STT_MODEL", "groq/whisper-large-v3-turbo"),
        "llm_model": os.getenv("LLM_MODEL", "groq/llama-3.3-70b-versatile"),
        "tts_model": os.getenv("TTS_MODEL", "groq/canopylabs/orpheus-v1-english"),
        "tts_voice": os.getenv("TTS_VOICE", "autumn"),
        "livekit_url": os.getenv("LIVEKIT_URL", "unconfigured"),
        "active_persona": os.getenv("VOICEFORGE_PERSONA", "study_buddy"),
        "env_path": _env_file_path,
    }

@app.post("/validate-keys")
def validate_keys(req: KeyValidationRequest):
    results = {}
    
    # Validate Groq API Key if provided
    if req.groq_api_key:
        key = req.groq_api_key.strip()
        url = "https://api.groq.com/openai/v1/models"
        request = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "User-Agent": "VoiceForge/1.2",
            }
        )
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                results["groq"] = {"valid": response.status == 200, "message": "Groq API key valid"}
        except urllib.error.HTTPError as e:
            results["groq"] = {"valid": False, "message": f"Groq validation failed: HTTP {e.code}"}
        except Exception as e:
            results["groq"] = {"valid": False, "message": f"Groq connection failed: {str(e)}"}

    # Validate LiveKit Credentials if provided
    if req.livekit_url and req.livekit_api_key and req.livekit_api_secret:
        try:
            token = (
                api.AccessToken(req.livekit_api_key.strip(), req.livekit_api_secret.strip())
                .with_identity("health-check")
                .with_name("HealthCheck")
                .with_grants(api.VideoGrants(room_join=True, room="health-check-room"))
            )
            jwt = token.to_jwt()
            results["livekit"] = {"valid": bool(jwt), "message": "LiveKit credentials valid"}
        except Exception as e:
            results["livekit"] = {"valid": False, "message": f"LiveKit token failed: {str(e)}"}

    return results

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
                            "description": data.get("description", None),
                        })
            except Exception:
                pass
    return {
        "personas": personas,
        "active_persona": os.getenv("VOICEFORGE_PERSONA", "study_buddy")
    }

@app.get("/personas/{slug}")
def get_persona_by_slug(slug: str):
    clean_slug = re.sub(r'[^a-z0-9_-]', '', slug.lower().strip())
    if not clean_slug:
        raise HTTPException(status_code=400, detail="Invalid persona slug")
    templates_dir = os.path.join(_root_dir, "cli", "templates")
    filepath = os.path.join(templates_dir, f"{clean_slug}.yaml")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Persona '{slug}' not found")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            return {
                "slug": clean_slug,
                "name": data.get("name", clean_slug),
                "system_prompt": data.get("system_prompt", ""),
                "description": data.get("description", None),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read persona: {str(e)}")

@app.post("/personas")
def save_persona(persona: PersonaModel):
    """Creates or updates a persona template in cli/templates."""
    slug = re.sub(r'[^a-z0-9_-]', '', persona.slug.lower().strip())
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid persona slug")
    
    templates_dir = os.path.join(_root_dir, "cli", "templates")
    os.makedirs(templates_dir, exist_ok=True)
    filepath = os.path.join(templates_dir, f"{slug}.yaml")

    data = {
        "name": persona.name.strip(),
        "system_prompt": persona.system_prompt.strip(),
    }
    if persona.description:
        data["description"] = persona.description.strip()

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)
        return {"status": "saved", "slug": slug, "persona": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write persona template: {str(e)}")

@app.post("/personas/active")
def set_active_persona(body: ActivePersonaModel):
    """Updates the active persona in .env and runtime."""
    slug = body.slug.strip()
    os.environ["VOICEFORGE_PERSONA"] = slug
    if os.path.exists(_env_file_path):
        try:
            set_key(_env_file_path, "VOICEFORGE_PERSONA", slug, quote_mode="never")
        except Exception:
            pass
    return {"status": "updated", "active_persona": slug}

@app.get("/token")
async def get_token(
    room: str = Query(..., description="The room name to join"),
    identity: str = Query(..., description="Unique participant identity"),
    name: str = Query(None, description="Display name for participant"),
    persona: str = Query(None, description="Optional persona slug for this session"),
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
    chosen_persona = persona or os.getenv("VOICEFORGE_PERSONA", "study_buddy")

    try:
        # Create metadata payload with persona specification
        metadata_payload = json.dumps({
            "persona": chosen_persona,
            "display_name": participant_name.strip(),
            "timestamp": int(os.getenv("TIMESTAMP", "0")),
        })

        token = (
            api.AccessToken(api_key, api_secret)
            .with_identity(identity.strip())
            .with_name(participant_name.strip())
            .with_metadata(metadata_payload)
            .with_grants(api.VideoGrants(room_join=True, room=room))
        )

        # Explicit agent dispatch for LiveKit Agents worker
        lkapi = api.LiveKitAPI(livekit_url, api_key, api_secret)
        try:
            try:
                existing = await lkapi.agent_dispatch.list_dispatch(room_name=room)
            except Exception:
                existing = []
            if not any(d.agent_name == "voiceforge" for d in existing):
                try:
                    await lkapi.agent_dispatch.create_dispatch(
                        CreateAgentDispatchRequest(
                            agent_name="voiceforge",
                            room=room,
                            metadata=metadata_payload,
                        )
                    )
                except Exception as dispatch_err:
                    print(f"Notice: agent dispatch for room '{room}': {dispatch_err}")
        finally:
            await lkapi.aclose()

        return {
            "token": token.to_jwt(),
            "url": livekit_url.strip(),
            "room": room,
            "identity": identity.strip(),
            "persona": chosen_persona,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create LiveKit token: {str(e)}",
        )

