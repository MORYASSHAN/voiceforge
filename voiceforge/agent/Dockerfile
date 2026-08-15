FROM python:3.11-slim

WORKDIR /app

# Install build and runtime dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download silero VAD models during build
RUN python -c "from livekit.plugins import silero; silero.VAD.load()" || true

# Copy agent application files
COPY . .

# Run agent worker in start mode
CMD ["python", "main.py", "start"]
