import os
import sys
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
        llm_model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile").removeprefix("groq/")
        instructions = persona.get("system_prompt", "You are a helpful and concise voice assistant.")
        super().__init__(
            llm=groq.LLM(model=llm_model),
            instructions=instructions,
        )

def _prewarm(proc) -> None:
    # Load the VAD model once per worker process instead of per-call.
    proc.userdata["vad"] = silero.VAD.load()

server = AgentServer(setup_fnc=_prewarm)

@server.rtc_session(agent_name="voiceforge")
async def voiceforge_session(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    
    # Load persona dynamically with fallback
    persona_name = os.getenv("VOICEFORGE_PERSONA", "study_buddy")
    try:
        persona = load_persona(persona_name)
        logger.info(f"Loaded persona: {persona.get('name', persona_name)}")
    except Exception as e:
        logger.warning(f"Could not load persona '{persona_name}': {e}. Using fallback default.")
        persona = load_persona("default")
    
    stt_model = os.getenv("STT_MODEL", "whisper-large-v3-turbo").removeprefix("groq/")
    tts_model = os.getenv("TTS_MODEL", "canopylabs/orpheus-v1-english").removeprefix("groq/")
    tts_voice = os.getenv("TTS_VOICE", "autumn")

    session = AgentSession(
        stt=groq.STT(model=stt_model, language="en"),
        tts=groq.TTS(model=tts_model, voice=tts_voice),
        vad=ctx.proc.userdata["vad"],
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            # Groq's STT is a non-streaming (batch) API, so the "adaptive"
            # interruption mode can never activate (it requires a streaming,
            # aligned-transcript STT to gatekeep barge-in) and would silently
            # no-op. "vad" mode only needs a VAD model, which we provide above,
            # so it actually enables the user interrupting the agent mid-reply.
            interruption={"mode": "vad"},
            preemptive_generation={"enabled": True},
        ),
    )

    @session.on("conversation_item_added")
    def _on_conversation_item_added(ev: ConversationItemAddedEvent):
        if isinstance(ev.item, llm.ChatMessage) and ev.item.role == "assistant":
            e2e = ev.item.metrics.get("e2e_latency")
            if e2e is not None:
                logger.info(f"reply latency (end of turn -> first audio): {e2e:.3f}s")

    @session.on("session_usage_updated")
    def _on_session_usage_updated(ev: SessionUsageUpdatedEvent):
        logger.debug(f"session usage: {ev.usage}")

    async def log_usage():
        logger.info(f"final session usage: {session.usage}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(agent=VoiceForgeAgent(persona), room=ctx.room)
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(server)
