import os
import logging
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    TurnHandlingOptions,
    cli,
    inference,
)
from personas import load_persona

logger = logging.getLogger("voiceforge")
# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class VoiceForgeAgent(Agent):
    def __init__(self, persona: dict) -> None:
        llm_model = os.getenv("LLM_MODEL", "groq/llama-4-scout-17b-16e-instruct")
        instructions = persona.get("system_prompt", "You are a helpful assistant.")
        super().__init__(
            llm=inference.LLM(model=llm_model),
            instructions=instructions,
        )

server = AgentServer()

@server.rtc_session(agent_name="voiceforge")
async def voiceforge_session(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    
    # Load persona dynamically
    persona_name = os.getenv("VOICEFORGE_PERSONA", "default")
    try:
        persona = load_persona(persona_name)
    except FileNotFoundError as e:
        logger.error(f"Failed to load persona: {e}")
        raise
    
    stt_model = os.getenv("STT_MODEL", "groq/whisper-large-v3-turbo")
    tts_model = os.getenv("TTS_MODEL", "groq/playai-tts")
    tts_voice = os.getenv("TTS_VOICE", "Fritz-PlayAI")
    
    session = AgentSession(
        stt=inference.STT(model=stt_model, language="en"),
        tts=inference.TTS(model=tts_model, voice=tts_voice),
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            interruption={"mode": "adaptive"},
            preemptive_generation={"enabled": True},
        ),
    )
    
    await session.start(agent=VoiceForgeAgent(persona), room=ctx.room)
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(server)
