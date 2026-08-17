import os
import sys

# Ensure UTF-8 stdout on Windows
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from dotenv import load_dotenv

# Load .env from project root
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

from cli.validators.groq import validate_groq_key

def main():
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        print("[!] GROQ_API_KEY is not set in .env")
        sys.exit(1)
        
    print(f"Testing Groq API Key: {api_key[:6]}...{api_key[-4:] if len(api_key) > 10 else ''}")
    success, msg = validate_groq_key(api_key)
    if success:
        print(f"[OK] {msg}")
    else:
        print(f"[ERROR] {msg}")
        sys.exit(1)

if __name__ == "__main__":
    main()
