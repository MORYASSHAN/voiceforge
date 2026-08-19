import os
import sys
import json
import logging
from dotenv import load_dotenv

# Ensure agent directory is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Load .env from project root
env_path = os.path.join(os.path.dirname(current_dir), ".env")
load_dotenv(env_path)

try:
    from personas import load_persona
except ImportError:
    from agent.personas import load_persona

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    ConversationItemAddedEvent,
    JobContext,
    SessionUsageUpdatedEvent,
    TurnHandlingOptions,
    cli,
    inference,
    llm,
)
from livekit.plugins import groq, silero

logger = logging.getLogger("voiceforge")
logging.basicConfig(level=logging.INFO)

class VoiceForgeAgent(Agent):
    def __init__(self, persona: dict) -> None:
        llm_model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
        if llm_model.startswith("groq/"):
            llm_model = llm_model[5:]
        instructions = persona.get("system_prompt", "You are a helpful and concise voice assistant.")
        try:
            super().__init__(
                llm=groq.LLM(model=llm_model),
                instructions=instructions,
            )
        except Exception as e:
            logger.warning(f"Failed to init LLM with {llm_model}: {e}. Falling back to openai/gpt-oss-120b.")
            super().__init__(
                llm=groq.LLM(model="openai/gpt-oss-120b"),
                instructions=instructions,
            )

def _prewarm(proc) -> None:
    # Load the VAD model once per worker process instead of per-call.
    proc.userdata["vad"] = silero.VAD.load()

server = AgentServer(setup_fnc=_prewarm)

@server.rtc_session(agent_name="voiceforge")
async def voiceforge_session(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    
    # 1. Determine persona from room metadata or environment variable
    persona_name = os.getenv("VOICEFORGE_PERSONA", "study_buddy")
    try:
        # Check if job metadata specifies a custom persona
        job_meta = getattr(ctx, "job", None)
        if job_meta and getattr(job_meta, "metadata", None):
            parsed_meta = json.loads(job_meta.metadata)
            if isinstance(parsed_meta, dict) and "persona" in parsed_meta:
                persona_name = parsed_meta["persona"]
        elif ctx.room.metadata:
            parsed_room_meta = json.loads(ctx.room.metadata)
            if isinstance(parsed_room_meta, dict) and "persona" in parsed_room_meta:
                persona_name = parsed_room_meta["persona"]
    except Exception as e:
        logger.debug(f"Could not parse session metadata: {e}")

    try:
        persona = load_persona(persona_name)
        logger.info(f"Loaded persona for room '{ctx.room.name}': {persona.get('name', persona_name)}")
    except Exception as e:
        logger.warning(f"Could not load persona '{persona_name}': {e}. Using fallback default.")
        persona = load_persona("default")
    
    stt_model = os.getenv("STT_MODEL", "whisper-large-v3-turbo")
    if stt_model.startswith("groq/"):
        stt_model = stt_model[5:]
    tts_model = os.getenv("TTS_MODEL", "canopylabs/orpheus-v1-english")
    if tts_model.startswith("groq/"):
        tts_model = tts_model[5:]
    tts_voice = os.getenv("TTS_VOICE", "autumn")

    session = AgentSession(
        stt=groq.STT(model=stt_model, language="en"),
        tts=groq.TTS(model=tts_model, voice=tts_voice),
        vad=ctx.proc.userdata["vad"],
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            interruption={"mode": "vad"},
            preemptive_generation={"enabled": True},
        ),
    )

    @session.on("conversation_item_added")
    def _on_conversation_item_added(ev: ConversationItemAddedEvent):
        if isinstance(ev.item, llm.ChatMessage) and ev.item.role == "assistant":
            e2e = ev.item.metrics.get("e2e_latency")
            if e2e is not None:
                logger.info(f"Turn reply latency (E2E): {e2e:.3f}s")
                # Broadcast telemetry packet over data channel
                try:
                    if ctx.room and ctx.room.local_participant:
                        telemetry_packet = json.dumps({
                            "type": "telemetry",
                            "e2e_latency": round(e2e * 1000),
                            "timestamp": int(os.getenv("TIMESTAMP", "0")),
                        }).encode("utf-8")
                        ctx.room.local_participant.publish_data(telemetry_packet)
                except Exception as pub_err:
                    logger.debug(f"Telemetry broadcast notice: {pub_err}")

    @session.on("session_usage_updated")
    def _on_session_usage_updated(ev: SessionUsageUpdatedEvent):
        logger.debug(f"Session usage: {ev.usage}")

    async def log_usage():
        logger.info(f"Final session usage for room '{ctx.room.name}': {session.usage}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(agent=VoiceForgeAgent(persona), room=ctx.room)
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(server)

