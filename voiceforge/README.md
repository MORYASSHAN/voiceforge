<div align="center">

# 🎙️ VoiceForge

**Ultra-Fast, Modular, Real-Time Conversational Voice AI Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![LiveKit](https://img.shields.io/badge/WebRTC-LiveKit-002B36.svg?logo=webrtc&logoColor=white)](https://livekit.io/)
[![Groq](https://img.shields.io/badge/LLM%20Inference-Groq-F55036.svg)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

---

*VoiceForge delivers human-like, low-latency, bi-directional voice conversations powered by Groq's high-speed Llama 3 models, LiveKit WebRTC media transport, and swappable persona templates.*

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏛️ Architecture Overview](#️-architecture-overview)
- [📂 Project Directory Structure](#-project-directory-structure)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [🔧 Detailed Component Setup](#-detailed-component-setup)
  - [1. Configuration Wizard](#1-configuration-wizard)
  - [2. Token Minting Server](#2-token-minting-server)
  - [3. Voice Agent Worker](#3-voice-agent-worker)
  - [4. Web Application Client](#4-web-application-client)
- [🎭 Persona Customization Guide](#-persona-customization-guide)
- [🐳 Self-Hosted Deployment (Docker Compose)](#-self-hosted-deployment-docker-compose)
- [🛠️ Tech Stack](#️-tech-stack)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- **⚡ Sub-500ms End-to-End Latency**: Blazing fast turn-around from user speech to vocal response using Groq Llama 3 models and streaming STT/TTS.
- **🌐 Real-Time WebRTC Media Transport**: Rock-solid audio streaming with jitter buffering and instant room negotiation via LiveKit.
- **🎙️ Seamless Voice Activity Detection (VAD)**: Natural interruptions, turn-taking, and silence detection with Silero VAD.
- **🎭 Dynamic Persona Engine**: Switch instantly between prebuilt templates (*Study Buddy, Tech Interviewer, Wellness Coach, Customer Support*) or define custom YAML personas with customized voices, traits, and system prompts.
- **🔐 Secure Token Minting**: FastAPI token microservice granting short-lived JWTs and room permissions for web and mobile clients.
- **💻 Modern React Client**: Intuitive web UI with live audio visualizers, transcript logs, latency monitors, and persona switchers.
- **🐳 100% Self-Hostable**: Complete Docker Compose suite containing local LiveKit Server, Kokoro FastAPI TTS, Token Server, and Agent.

---

## 🏛️ Architecture Overview

VoiceForge connects the web browser directly to a LiveKit room via WebRTC. The VoiceForge agent worker joins the room, processes inbound user audio streams in real-time, queries Groq for reasoning, and synthesizes audio responses back into the audio track.

```
┌────────────────────────────────────────────────────────┐
│                   Web Browser / Client                 │
│         (React + Vite + LiveKit WebRTC SDK)            │
└───────────▲───────────────────────────────▲────────────┘
            │ 1. Request JWT Access Token   │ 2. WebRTC Audio Stream
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│  Token Server         │       │  LiveKit SFU Server    │
│  (FastAPI / Port 8080)│       │  (Port 7880)           │
└───────────────────────┘       └───────────▲────────────┘
                                            │
                                            │ 3. Subscribes to Audio Track
                                            ▼
                                ┌────────────────────────┐
                                │ VoiceForge Agent Worker│
                                │ (Python LiveKit Agent) │
                                └───────────┬────────────┘
                                            │
            ┌───────────────────────────────┼───────────────────────────────┐
            ▼                               ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│     Silero VAD        │       │  Groq Whisper / Llama │       │ Cartesia / Kokoro TTS │
│ (Voice Activity Det.) │       │   (Fast STT & LLM)    │       │ (Streaming Synthesis) │
└───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

---

## 📂 Project Directory Structure

```
voiceforge/
├── .env.example            # Master environment variable template
├── docker-compose.yml      # Orchestration for local self-hosted stack
├── README.md               # Project documentation
│
├── agent/                  # Real-Time Voice Agent Worker
│   ├── Dockerfile          # Agent container definition
│   ├── main.py             # Agent runtime entrypoint (LiveKit Worker)
│   ├── requirements.txt    # Agent Python dependencies
│   └── personas/           # Persona Loader and configuration logic
│       ├── __init__.py
│       └── persona_loader.py
│
├── cli/                    # Interactive CLI Setup Wizard & Templates
│   ├── __init__.py
│   ├── wizard.py           # Guided environment & persona setup wizard
│   ├── templates/          # Ready-to-use YAML persona templates
│   │   ├── assistant.yaml
│   │   ├── customer_support.yaml
│   │   ├── meeting_notes.yaml
│   │   ├── study_buddy.yaml
│   │   └── voice_journal.yaml
│   └── validators/         # API key and credential validation utilities
│       ├── groq.py
│       └── livekit.py
│
├── token-server/           # LiveKit JWT Token Minting Microservice
│   ├── Dockerfile          # Token server container definition
│   ├── token_server.py     # FastAPI endpoints (/token, /health)
│   └── requirements.txt    # Token server Python dependencies
│
└── web/                    # Modern React Web Application
    ├── index.html          # HTML entrypoint
    ├── package.json        # Frontend dependencies and scripts
    ├── vite.config.ts      # Vite build configuration
    ├── tailwind.config.js  # Styling system configuration
    └── src/                # React components, hooks, visualizers
```

---

## 📋 Prerequisites

Before setting up VoiceForge, ensure your environment meets the following requirements:

1. **Python**: `3.11` or higher installed.
2. **Node.js**: `18.0.0` or higher (with `npm` or `pnpm`).
3. **Groq API Key**: Obtain a free, high-rate-limit key at [Groq Console](https://console.groq.com/).
4. **LiveKit Instance**:
   - **Option A (Recommended for Quickstart)**: Free [LiveKit Cloud](https://cloud.livekit.io/) project.
   - **Option B (Self-Hosted)**: Docker Engine & Docker Compose installed.
5. **Cartesia API Key** *(Optional)*: If using Cartesia Sonic TTS for high-fidelity speech synthesis ([Cartesia AI](https://cartesia.ai/)).

---

## 🚀 Quick Start Guide

Get up and running in 4 easy steps:

### 1. Clone & Navigate to Project
```bash
git clone https://github.com/your-username/voiceforge.git
cd voiceforge
```

### 2. Run the Setup Wizard
VoiceForge includes an interactive CLI wizard that helps you validate credentials and select an agent persona:
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install CLI dependencies and run the wizard
pip install python-dotenv pyyaml requests
python cli/wizard.py
```
*The wizard will guide you through entering your Groq API key, LiveKit credentials, and selecting a persona template, automatically generating your `.env` file.*

### 3. Start the Backend Services
In two separate terminals:

```bash
# Terminal 1: Start Token Server
cd token-server
pip install -r requirements.txt
python token_server.py
```

```bash
# Terminal 2: Start Voice Agent Worker
cd agent
pip install -r requirements.txt
python main.py dev
```

### 4. Start the Web Frontend
```bash
# Terminal 3: Start Web App
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser, allow microphone access, and click **Connect** to start talking!

---

## 🔧 Detailed Component Setup

### 1. Configuration Wizard (`cli/`)

The CLI wizard tests your LiveKit credentials and Groq API keys against live endpoints to verify connectivity prior to launch.

```bash
# Run the interactive configuration wizard
python cli/wizard.py
```

Available personas are automatically loaded from `cli/templates/` and can be switched dynamically.

---

### 2. Token Minting Server (`token-server/`)

The Token Server is a lightweight, asynchronous FastAPI microservice that generates short-lived LiveKit access tokens.

#### Manual Setup:
```bash
cd token-server
pip install -r requirements.txt
python token_server.py
```

#### API Endpoints:
- `GET /health` - Server health check.
- `POST /token` - Generate a LiveKit JWT token with JSON payload:
  ```json
  {
    "room_name": "voiceforge-room",
    "participant_name": "user-123"
  }
  ```
- `GET /token?room=voiceforge-room&identity=user-123` - Convenience endpoint for direct browser testing.

---

### 3. Voice Agent Worker (`agent/`)

The core agent processes speech, detects voice activity, sends prompts to the LLM, and streams synthesized voice back to the user.

#### Environment Variables (`agent/.env` or root `.env`):
```ini
GROQ_API_KEY=gsk_...
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=sec...
PERSONA=study_buddy
```

#### Running the Agent:
```bash
cd agent
pip install -r requirements.txt

# Development mode (auto-reloads and connects to default rooms)
python main.py dev

# Production worker mode
python main.py start
```

---

### 4. Web Application Client (`web/`)

Built with React, Vite, Tailwind CSS, and LiveKit WebRTC Components.

```bash
cd web
npm install
npm run dev
```

#### Environment Variables (`web/.env`):
```ini
VITE_TOKEN_SERVER_URL=http://localhost:8080
VITE_LIVEKIT_URL=ws://localhost:7880
```

---

## 🎭 Persona Customization Guide

VoiceForge supports pluggable persona definitions via clean YAML configuration files.

### Example Persona Definition (`cli/templates/study_buddy.yaml`):

```yaml
name: "study_buddy"
display_name: "Study Buddy"
description: "An encouraging, knowledgeable, and patient academic tutor."

voice:
  provider: "cartesia"
  voice_id: "248be419-c632-4f23-adf1-5324ed7dbf10"
  speed: 1.05

system_prompt: |
  You are an enthusiastic, supportive, and patient study partner.
  - Break down complex concepts into intuitive, bite-sized explanations.
  - Ask engaging follow-up questions to test understanding.
  - Keep vocal responses clear, natural, and conversational.
  - Avoid using markdown syntax or lists in speech.

greeting: "Hey there! What topic are we tackling today?"
```

### Adding a Custom Persona:
1. Create a new YAML file in `cli/templates/my_persona.yaml`.
2. Update your `.env` file:
   ```ini
   PERSONA=my_persona
   ```
3. Restart the agent worker (`python agent/main.py dev`).

---

## 🐳 Self-Hosted Deployment (Docker Compose)

You can run the entire VoiceForge infrastructure completely locally with zero cloud dependencies using Docker Compose:

### 1. Configure `.env`
```bash
cp .env.example .env
```
Ensure your `GROQ_API_KEY` is specified in `.env`.

### 2. Launch All Services
```bash
docker compose up --build -d
```

### 3. Verify Container Status
```bash
docker compose ps
```

| Service | Container Name | Port | Description |
| :--- | :--- | :--- | :--- |
| **LiveKit Server** | `voiceforge-livekit` | `7880`, `7881`, `50000-50020/udp` | WebRTC Media & Signaling Server |
| **Kokoro TTS** | `voiceforge-kokoro-tts` | `8880` | Local High-Speed Neural Speech Synthesizer |
| **Token Server** | `voiceforge-token-server` | `8080` | JWT Access Token Minting Microservice |
| **Agent Worker** | `voiceforge-agent` | *Internal* | Real-time AI Voice Pipeline Worker |

To stop all services:
```bash
docker compose down
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Transport Layer** | [LiveKit](https://livekit.io/) | Ultra-low latency WebRTC audio/video transport & SFU |
| **LLM Inference** | [Groq](https://groq.com/) | Ultra-fast Llama 3.3 70B / Llama 3.1 8B inference |
| **Speech-to-Text** | [Groq Whisper](https://groq.com/) / Deepgram | Real-time streaming speech transcription |
| **Voice Activity** | [Silero VAD](https://github.com/snakers4/silero-vad) | Sub-millisecond speech & turn-taking detection |
| **Text-to-Speech** | [Cartesia Sonic](https://cartesia.ai/) / [Kokoro](https://github.com/hexgrad/kokoro) | Ultra-low latency streaming voice synthesis |
| **Backend Microservices** | [FastAPI](https://fastapi.tiangolo.com/) / Python 3.11 | Token generation and agent lifecycle management |
| **Frontend Client** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/) | Real-time audio visualizer and control UI |

---

## 🤝 Contributing

Contributions are warmly welcomed! To get started:

1. **Fork** the repository.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<div align="center">
  <sub>Built with ❤️ by the VoiceForge Community. Powered by LiveKit and Groq.</sub>
</div>
