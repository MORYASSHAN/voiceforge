# 🎙️ VoiceForge

<div align="center">
  <img src="https://raw.githubusercontent.com/MORYASSHAN/voiceforge/main/assets/banner.png" alt="VoiceForge Banner" width="100%" onerror="this.style.display='none'"/>

  <h3>⚡ Ultra-Low Latency Real-Time Voice AI Agent Starter Kit</h3>
  <p>Build, customize, and self-host bidirectional, interruptible voice agents in minutes.</p>

  <p>
    <a href="#-key-features"><img src="https://img.shields.io/badge/LiveKit-Agents_v1.6+-000000?style=for-the-badge&logo=livekit&logoColor=white" alt="LiveKit Agents" /></a>
    <a href="#-architecture"><img src="https://img.shields.io/badge/Groq-Llama_3.3_&_Whisper-F05A28?style=for-the-badge&logo=groq&logoColor=white" alt="Groq Inference" /></a>
    <a href="#-web-frontend"><img src="https://img.shields.io/badge/React_18-Vite_&_Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React + Vite" /></a>
    <a href="#-testing"><img src="https://img.shields.io/badge/Tests-27_Passing-success?style=for-the-badge&logo=pytest&logoColor=white" alt="Pytest 27 Passed" /></a>
    <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" /></a>
  </p>
</div>

---

## 🌟 Overview

**VoiceForge** is a production-ready, open-source starter kit for creating real-time, conversational voice AI applications. Built on top of **LiveKit Agents**, **Groq Inference**, and **Silero VAD**, VoiceForge orchestrates **Speech-to-Text (STT)**, **Large Language Models (LLMs)**, and **Text-to-Speech (TTS)** into an ultra-responsive, interruptible audio pipeline with under 400ms end-to-end response times.

Whether you're building a voice tutor, customer support agent, personal meeting assistant, or interactive gaming NPC, VoiceForge gets you from `git clone` to a live conversational agent in your browser in under 5 minutes.

---

## 🚀 Key Features

* 🔐 **BYOK (Bring Your Own Keys):** No proxying, no third-party telemetry, no cloud storage of your keys. Everything runs directly from your local machine.
* 🧙 **Guided CLI Wizard:** Interactive setup CLI that validates your Groq & LiveKit credentials in real time and automatically writes your `.env` configuration.
* 🧠 **Blazing-Fast Groq Inference:**
  * **STT:** `whisper-large-v3-turbo` (instant speech transcription)
  * **LLM:** `llama-3.3-70b-versatile` (deep reasoning & natural conversation)
  * **TTS:** `canopylabs/orpheus-v1-english` / `playai-tts` (expressive, natural human speech)
* ⚡ **Natural Barge-In & Interruptibility:** Powered by **Silero VAD**, the agent stops speaking immediately when you start talking.
* 🎭 **Dynamic Persona Engine:** Switch personas on the fly (e.g. *Study Buddy*, *Meeting Notes*, *Voice Journal*) with simple YAML templates or via the web UI.
* 💻 **Cyberpunk Web Interface:**
  * **Interactive Visualizers:** Switch between *Orb*, *Spectrum*, *Aura*, and *Constellation* visualizer modes.
  * **Telemetry HUD:** Live tracking of session duration, end-to-end latency ($ms$), and token usage.
  * **Synthesized Audio Feedback:** Web Audio sound effects for link initialization, mute toggles, interruptions, and disconnects.
  * **Theme Switcher:** Cyberpunk Cyan, Emerald, and Amber color palettes.
  * **Keyboard Shortcuts:** Full hands-free control (`Space` to mute, `Esc` to interrupt, `T` for transcripts, `V` for visualizers, `P` for personas, `S` for settings).
* 🐳 **Self-Hostable (Docker):** Run entirely locally with the included Docker Compose setup for self-hosted LiveKit and Kokoro TTS.

---

## 🏗️ Architecture

```
voiceforge/
├── cli/                      # Setup wizard (typer + rich) & credential validators
│   ├── templates/            # YAML Persona prompt definitions
│   └── validators/           # Groq API and LiveKit credentials format & token tests
├── agent/                    # Python LiveKit Agents worker ("The Brain")
│   ├── personas/             # Persona loader with slug normalization & fuzzy fallback
│   ├── main.py               # LiveKit Agent worker (STT -> LLM -> TTS pipeline)
│   └── requirements.txt      # Python agent dependencies
├── token-server/             # FastAPI JWT Token Server & Agent Dispatch Gateway
│   ├── token_server.py       # REST API endpoints (/token, /health, /diagnostics, /personas)
│   └── requirements.txt      # FastAPI dependencies
├── web/                      # Modern React 18 + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/       # VoiceOrb, Transcript, TelemetryHUD, SetupWizard, PersonaSelector
│   │   ├── hooks/            # useLiveKitRoom, useSoundEffects
│   │   └── types/            # TypeScript definitions
│   └── package.json          # Frontend dependencies
├── tests/                    # Automated Pytest suite (27 unit & integration tests)
├── docker-compose.yml        # Optional self-hosted LiveKit server + Kokoro TTS
└── .env.example              # Environment variables template
```

---

## ⚡ Quick Start

### 📋 Prerequisites
* **Python 3.10+** (Tested up to Python 3.14)
* **Node.js 18+** & **npm**
* **Groq API Key:** Free at [console.groq.com/keys](https://console.groq.com/keys)
* **LiveKit Cloud Project:** Free at [cloud.livekit.io](https://cloud.livekit.io) *(or self-host locally)*

---

### Step 1: Clone and Set Up Python Virtual Environment

```bash
git clone https://github.com/MORYASSHAN/voiceforge.git
cd voiceforge/voiceforge

# Create and activate Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install typer rich python-dotenv pyyaml fastapi uvicorn "livekit-agents[groq,turn-detector]>=1.6.0" livekit-api pytest pytest-asyncio httpx
```

---

### Step 2: Run the Setup Wizard

The interactive wizard will validate your API keys, let you choose an initial persona, and generate your `.env` file automatically:

```bash
python cli/wizard.py
```

*(Alternatively, copy `.env.example` to `.env` and fill in your keys manually)*:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=your_secret_key_here
GROQ_API_KEY=gsk_your_groq_api_key_here
VOICEFORGE_PERSONA=study_buddy
```

---

### Step 3: Start the Services

Open **three separate terminal tabs** inside `voiceforge/voiceforge`:

#### 🔹 Terminal 1: Token Server (FastAPI)
```bash
cd token-server
uvicorn token_server:app --reload --port 8000
```
*Token server runs at: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)*

#### 🔹 Terminal 2: Agent Worker (LiveKit AI Brain)
```bash
cd agent
python main.py dev
```
*Registers the agent worker to your LiveKit Cloud room with STT, LLM, and TTS initialized.*

#### 🔹 Terminal 3: Web Frontend (React + Vite)
```bash
cd web
npm install
npm run dev
```
*Frontend opens at: `http://localhost:3000`*

---

### Step 4: Talk to Your Agent!

1. Open **`http://localhost:3000`** in Chrome, Edge, or Safari.
2. Click **`INITIATE_LINK`** and allow microphone access.
3. When the status indicator displays **`🟢 SYS.ONLINE`**, start speaking!

---

## 🎭 Persona System

VoiceForge comes with built-in personas stored in `cli/templates/*.yaml`:

| Persona | Slug | Description |
| :--- | :--- | :--- |
| 📚 **Study Buddy** | `study_buddy` | Clear concept explanations, analogies, interactive quizzes, and step-by-step guidance. |
| 📝 **Meeting Notes** | `meeting_notes` | Concise bullet-point summaries, action item extraction with owners & deadlines. |
| 🧘 **Voice Journal** | `voice_journal` | Warm, empathetic conversational companion for daily emotional check-ins & reflections. |

### 🛠️ Adding Custom Personas
Create a new YAML file in `cli/templates/` (e.g. `cli/templates/code_mentor.yaml`):

```yaml
name: Code Mentor
description: Senior Software Architect guiding through clean code and system design.
system_prompt: |
  You are an expert software engineer and code mentor.
  Help the user debug logic, design scalable system architectures, and write idiomatic code.
  Keep spoken responses structured, concise, and easy to follow.
```

Switch to your new persona either by:
* Selecting it in the web frontend persona modal (`P` key)
* Running `python cli/wizard.py`
* Updating `VOICEFORGE_PERSONA=code_mentor` in `.env`

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Description |
| :---: | :--- | :--- |
| **`Space`** | **Mute / Unmute** | Toggle your microphone on and off |
| **`Esc`** | **Barge-In Interrupt** | Immediately interrupt the agent while it is speaking |
| **`V`** | **Cycle Visualizer** | Switch between *Orb*, *Spectrum*, *Aura*, and *Constellation* |
| **`T`** | **Toggle Transcripts** | Open / close the live conversation transcript drawer |
| **`P`** | **Persona Menu** | Open the interactive persona selection modal |
| **`S`** / **`C`** | **Settings** | Open the configuration modal |

---

## 🧪 Testing

VoiceForge includes a comprehensive automated test suite covering validators, persona loaders, template schemas, and FastAPI token endpoints:

```bash
# Run all automated tests
pytest tests/ -v

# Run frontend production build test
cd web && npm run build
```

---

## 🐳 Self-Hosting with Docker (Optional)

If you prefer to run completely offline without LiveKit Cloud, launch local LiveKit and Kokoro TTS containers:

```bash
docker compose --profile local up -d
```

Update your `.env`:
```env
LIVEKIT_URL=ws://127.0.0.1:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
TTS_MODEL=kokoro/kokoro
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `LIVEKIT_URL` | LiveKit WebSocket endpoint (`wss://...` or `ws://...`) | *Required* |
| `LIVEKIT_API_KEY` | LiveKit project API key | *Required* |
| `LIVEKIT_API_SECRET` | LiveKit project API secret | *Required* |
| `GROQ_API_KEY` | Groq inference API key | *Required* |
| `VOICEFORGE_PERSONA` | Active persona template slug | `study_buddy` |
| `LLM_MODEL` | LLM model for generation | `llama-3.3-70b-versatile` |
| `STT_MODEL` | Speech-to-Text transcription model | `whisper-large-v3-turbo` |
| `TTS_MODEL` | Text-to-Speech synthesis model | `canopylabs/orpheus-v1-english` |
| `TTS_VOICE` | Default voice preset | `autumn` |

---

## 👨‍💻 Author

**Shaan Goswami**

* 💼 **LinkedIn:** [Shaan Goswami](https://www.linkedin.com/in/shaan-goswami-778729274/)
* 🌐 **Portfolio:** [shaan.build](https://my-site-a5cfc457.ploy.build/)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
