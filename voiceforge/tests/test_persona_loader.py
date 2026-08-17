import pytest
import os
import sys

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from agent.personas.persona_loader import load_persona, get_available_personas

def test_get_available_personas():
    personas = get_available_personas()
    assert len(personas) >= 3
    assert "study_buddy" in personas
    assert "meeting_notes" in personas
    assert "voice_journal" in personas

def test_load_persona_by_slug():
    p = load_persona("study_buddy")
    assert isinstance(p, dict)
    assert p.get("name") == "Study Buddy"
    assert "system_prompt" in p
    assert len(p["system_prompt"]) > 10

def test_load_persona_by_display_name():
    p1 = load_persona("Study Buddy")
    assert p1.get("name") == "Study Buddy"
    
    p2 = load_persona("Meeting Notes")
    assert p2.get("name") == "Meeting Notes"
    
    p3 = load_persona("Voice Journal")
    assert p3.get("name") == "Voice Journal"

def test_load_persona_with_extension():
    p = load_persona("study_buddy.yaml")
    assert p.get("name") == "Study Buddy"

def test_load_persona_with_hyphens():
    p = load_persona("study-buddy")
    assert p.get("name") == "Study Buddy"

def test_load_persona_default_fallback():
    p = load_persona("default")
    assert isinstance(p, dict)
    assert "system_prompt" in p

def test_load_persona_empty_fallback():
    p = load_persona("")
    assert isinstance(p, dict)
    assert "system_prompt" in p

def test_load_persona_not_found():
    with pytest.raises(FileNotFoundError):
        load_persona("completely_nonexistent_persona_xyz_999")
