import pytest
import os
import sys

# Ensure proper paths
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from cli.validators.groq import validate_groq_key
from cli.validators.livekit import validate_livekit_creds

def test_groq_validator_empty_key():
    success, msg = validate_groq_key("")
    assert not success
    assert "cannot be empty" in msg

def test_groq_validator_invalid_key():
    success, msg = validate_groq_key("gsk_invalid_test_key_123456789")
    assert not success
    assert "Invalid Groq API key" in msg or "401" in msg or "Connection error" in msg

def test_livekit_validator_empty_fields():
    success, msg = validate_livekit_creds("", "", "")
    assert not success
    assert "required" in msg

def test_livekit_validator_invalid_url():
    success, msg = validate_livekit_creds("ftp://invalid-url", "API_key", "secret_key_12345")
    assert not success
    assert "URL must start with" in msg

def test_livekit_validator_short_key():
    success, msg = validate_livekit_creds("wss://test.livekit.cloud", "a", "secret_12345")
    assert not success
    assert "too short" in msg

def test_livekit_validator_valid_format():
    success, msg = validate_livekit_creds("wss://myproject.livekit.cloud", "APItest123456", "secretkey1234567890123456789012345678")
    assert success
    assert "validated successfully" in msg
