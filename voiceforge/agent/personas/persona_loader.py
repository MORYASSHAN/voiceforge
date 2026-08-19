import os
import re
import yaml
from typing import Optional, Dict, Any, List

def _get_templates_dir() -> str:
    # This file is in agent/personas, templates are in cli/templates
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base_dir, "cli", "templates")

def _normalize_key(text: str) -> str:
    """Normalize a name/slug for fuzzy matching: lowercase, strip non-alphanumeric."""
    return re.sub(r'[^a-z0-9]', '', text.lower())

def load_persona(name: str, fallback: bool = False) -> Dict[str, Any]:
    """
    Loads a persona configuration dictionary by slug, filename, or display name.
    If 'default', empty, or fallback=True when not found, provides an intelligent fallback.
    """
    templates_dir = _get_templates_dir()
    
    if not name or name.strip() == "" or name.lower() == "default":
        # Check if default.yaml exists, otherwise fallback to first available or built-in default
        default_file = os.path.join(templates_dir, "default.yaml")
        if os.path.exists(default_file):
            try:
                with open(default_file, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict):
                        return data
            except Exception:
                pass
        
        # Look for study_buddy or first available template
        available = get_available_personas()
        if available and "study_buddy" in available:
            return load_persona("study_buddy")
        elif available:
            return load_persona(available[0])
            
        return {
            "name": "Default Assistant",
            "system_prompt": "You are a helpful, warm, and concise voice AI assistant. Keep responses natural and conversational."
        }

    clean_name = name.strip()
    if clean_name.endswith(('.yaml', '.yml')):
        clean_name = os.path.splitext(clean_name)[0]

    # Direct filename match
    for ext in ('.yaml', '.yml'):
        candidate = os.path.join(templates_dir, f"{clean_name}{ext}")
        if os.path.exists(candidate):
            with open(candidate, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if isinstance(data, dict):
                    return data

    # Slug match with underscores or hyphens
    slug_candidates = [
        clean_name.replace(' ', '_').lower(),
        clean_name.replace(' ', '-').lower(),
        clean_name.replace('-', '_').lower(),
        clean_name.replace('_', '-').lower(),
    ]
    for slug in slug_candidates:
        for ext in ('.yaml', '.yml'):
            candidate = os.path.join(templates_dir, f"{slug}{ext}")
            if os.path.exists(candidate):
                with open(candidate, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict):
                        return data

    # Fuzzy match by persona 'name' inside all YAML files
    norm_search = _normalize_key(clean_name)
    if os.path.exists(templates_dir):
        for fname in os.listdir(templates_dir):
            if fname.endswith(('.yaml', '.yml')):
                fpath = os.path.join(templates_dir, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                        if isinstance(data, dict):
                            display_name = data.get('name', '')
                            if _normalize_key(display_name) == norm_search or _normalize_key(fname) == norm_search:
                                return data
                except Exception:
                    continue

    if fallback:
        available = get_available_personas()
        if available and "study_buddy" in available:
            return load_persona("study_buddy")
        elif available:
            return load_persona(available[0])
        return {
            "name": name.replace("_", " ").title() if name else "Default Assistant",
            "system_prompt": "You are a helpful, warm, and concise voice AI assistant. Keep responses natural and conversational."
        }

    raise FileNotFoundError(f"Persona '{name}' not found in {templates_dir}. Available personas: {get_available_personas()}")

def get_available_personas() -> List[str]:
    """Returns a list of available persona slugs."""
    templates_dir = _get_templates_dir()
    if not os.path.exists(templates_dir):
        return []
        
    personas = []
    for filename in sorted(os.listdir(templates_dir)):
        if filename.endswith(('.yaml', '.yml')):
            personas.append(os.path.splitext(filename)[0])
            
    return personas
