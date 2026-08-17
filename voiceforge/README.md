# 🎙️ VoiceForge

<div align="center">
  <p><strong>Open-source, self-hostable voice AI agent starter kit.</strong></p>
  <p>Build ultra-low latency, real-time voice agents in minutes.</p>
</div>

---

## 🌟 Overview

VoiceForge is a complete starter kit for building bidirectional, real-time voice AI agents. Built on top of **LiveKit Agents**, it orchestrates Speech-to-Text (STT), Large Language Models (LLMs), and Text-to-Speech (TTS) into a seamless, interruptible voice pipeline.

The true value of VoiceForge lies in its **onboarding layer**: a guided CLI setup wizard, curated defaults, and ready-made persona templates that get you from `git clone` to a working voice conversation in the browser in under 10 minutes.

### 🚀 Features
- **BYOK (Bring Your Own Keys):** No proxying, no storage. Your keys stay on your machine.
- **Guided Setup Wizard:** A beautiful, interactive CLI that walks you through getting and validating API keys.
- **Ready-Made Personas:** Start instantly with templates like Study Buddy, Voice Journal, or Meeting Notes.
- **Modern Web Frontend:** A sleek, dark-themed React + Vite interface with Framer Motion animations.
- **Groq Integration:** Blazing-fast inference using Groq for STT, LLM, and TTS (talks directly to Groq's API, not through a hosted gateway).
- **Real Barge-In:** Silero VAD + VAD-based interruption, so you can talk over the agent mid-reply.
- **Latency & Usage Metrics:** Per-turn end-to-end latency and session token usage logged out of the box.
- **Self-Hostable:** Optional Docker Compose setup for running your own LiveKit server and local TTS (Kokoro).

---

## 🏗️ Architecture

VoiceForge consists of three main components:

```
voiceforge/
├── cli/              # Setup wizard (typer + rich) - Walkthrough, validation, persona selection
├── agent/            # LiveKit Agents worker (Python) - The "brain" orchestrating STT/LLM/TTS
├── token-server/     # Token Server (FastAPI) - Mints LiveKit JWTs for the web client
├── web/              # Frontend (React + Vite) - Voice UI, animated VoiceOrb, live transcripts
└── docker-compose.yml # Optional self-hosted LiveKit and Kokoro TTS
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Groq API Key:** Get it free at [console.groq.com/keys](https://console.groq.com/keys)
- **LiveKit Cloud Account:** Get it free at [cloud.livekit.io](https://cloud.livekit.io) (or self-host via Docker)

> ⚠️ **Groq account setup (one-time, easy to miss):**
> - The TTS voice model requires accepting terms before it'll work: open [console.groq.com/playground?model=canopylabs%2Forpheus-v1-english](https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english) and click accept. Without this, TTS calls fail with `model_terms_required` and the agent session closes.
> - Groq's available model lineup changes over time. If `LLM_MODEL`/`STT_MODEL`/`TTS_MODEL` in your `.env` reference a model that's been deprecated, calls fail with `model_not_found`. Check `https://api.groq.com/openai/v1/models` (with your key) for what's currently available, or just leave these unset to use the tested defaults in `agent/main.py`.

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/voiceforge.git
cd voiceforge

# Install CLI dependencies
pip install typer rich python-dotenv pyyaml
```

### 2. Run the Setup Wizard
The CLI wizard is the easiest way to get started. It will guide you through entering your keys, validating them, picking a persona, and generating your `.env` file.
```bash
python cli/wizard.py
```

### 3. Start the Services
All three services must be running — the token server and web UI alone are **not** enough; the agent worker is the actual "brain" and won't join calls if it isn't running.

**Fastest path (Windows):** run `start_all.bat` in the project root. It launches the token server, agent worker, and web UI each in their own window.

**Manual path:** open three separate terminals in the `voiceforge` directory.

**Terminal 1: Token Server**
```bash
cd token-server
pip install -r requirements.txt
uvicorn token_server:app --reload --port 8000
```

**Terminal 2: Agent Worker**
```bash
cd agent
pip install -r requirements.txt
python main.py dev
```

**Terminal 3: Web UI**
```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser. Click **INITIATE_LINK** to talk to your new AI agent!

> ℹ️ The token server automatically dispatches the agent to whichever room you connect to (via LiveKit's explicit agent dispatch API), so you don't need to run any separate `lk dispatch` commands.

---

## 🎭 Customizing Personas

VoiceForge uses simple YAML files to define agent behavior. Check the `cli/templates/` directory.

To create your own, add a new `.yaml` file:
```yaml
name: Pirate Captain
system_prompt: |
  You are a swashbuckling pirate captain. Answer all questions as if we are sailing the high seas.
  Keep it brief, use pirate slang, and always ask for the user's opinion on the next course of action!
```
Then select it in the CLI wizard, or manually update the `VOICEFORGE_PERSONA` variable in your `.env` file.

---

## 🐳 Self-Hosting (Optional)

Don't want to use LiveKit Cloud? You can run LiveKit locally, along with Kokoro TTS for a completely free, local audio pipeline.

```bash
docker-compose --profile local up -d
```
Update your `.env` to point to the local instances:
```env
LIVEKIT_URL=ws://127.0.0.1:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
TTS_MODEL=kokoro/kokoro
```

---

## 👨‍💻 About the Author

**Shaan Goswami**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shaan-goswami-778729274/)
[![Portfolio](https://img.shields.io/badge/Portfolio-2563EB?style=for-the-badge&logo=react&logoColor=white)](https://my-site-a5cfc457.ploy.build/)

Building the future of voice AI and interactive agent experiences.

---

## 📄 License
MIT License. See `LICENSE` for more information.
