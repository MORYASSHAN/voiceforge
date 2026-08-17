from typing import Tuple

def validate_livekit_creds(url: str, api_key: str, api_secret: str) -> Tuple[bool, str]:
    """
    Validates LiveKit credentials format and generates a test JWT if livekit-api is available.
    Returns (success: bool, message: str)
    """
    if not url or not api_key or not api_secret:
        return False, "All fields (URL, API Key, API Secret) are required"
        
    url = url.strip()
    api_key = api_key.strip()
    api_secret = api_secret.strip()
    
    if not (url.startswith("ws://") or url.startswith("wss://") or url.startswith("http://") or url.startswith("https://")):
        return False, "URL must start with ws://, wss://, http://, or https://"
        
    if len(api_key) < 3:
        return False, "API Key is too short (must be at least 3 characters)"
        
    if len(api_secret) < 3:
        return False, "API Secret is too short (must be at least 3 characters)"
        
    try:
        from livekit import api
        token = (
            api.AccessToken(api_key, api_secret)
            .with_identity("test-identity")
            .with_name("test")
            .with_grants(api.VideoGrants(room_join=True, room="test-room"))
        )
        jwt = token.to_jwt()
        if jwt:
            return True, "LiveKit credentials validated successfully (Token Generation OK)"
        else:
            return False, "Failed to generate LiveKit JWT token"
    except Exception as e:
        return False, f"LiveKit credential validation failed: {str(e)}"
