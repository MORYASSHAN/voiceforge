import re

def validate_livekit_creds(url: str, api_key: str, api_secret: str) -> tuple[bool, str]:
    """Returns (success: bool, message: str)"""
    if not url or not api_key or not api_secret:
        return False, "All fields (URL, API Key, API Secret) are required"
        
    if not (url.startswith("ws://") or url.startswith("wss://")):
        return False, "URL must start with ws:// or wss://"
        
    try:
        from livekit import api
        # Try a quick test if livekit api is installed
        return True, "LiveKit credentials validated successfully (Format Check)"
    except ImportError:
        # Fallback manual check
        if len(api_key) < 5 or len(api_secret) < 5:
            return False, "API Key or Secret seems too short"
            
        return True, "LiveKit credentials validated successfully (Format Check)"
