import urllib.request
import urllib.error
import json

def validate_groq_key(api_key: str) -> tuple[bool, str]:
    """Returns (success: bool, message: str)"""
    if not api_key:
        return False, "API key cannot be empty"
        
    url = "https://api.groq.com/openai/v1/models"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                return True, "Groq API key validated successfully"
            else:
                return False, f"HTTP Error: {response.status}"
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return False, "Invalid Groq API key (401 Unauthorized)"
        return False, f"HTTP Error: {e.code}"
    except Exception as e:
        return False, f"Connection error: {str(e)}"
