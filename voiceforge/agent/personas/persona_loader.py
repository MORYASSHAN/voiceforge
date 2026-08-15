import os
import yaml

def _get_templates_dir() -> str:
    # This file is in agent/personas, templates are in cli/templates
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    return os.path.join(base_dir, "cli", "templates")

def load_persona(name: str) -> dict:
    templates_dir = _get_templates_dir()
    filepath = os.path.join(templates_dir, f"{name}.yaml")
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Persona file not found at {filepath}. Please ensure the persona exists.")
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
        
    if not isinstance(data, dict):
        raise ValueError(f"Invalid persona format in {filepath}")
        
    return data

def get_available_personas() -> list[str]:
    templates_dir = _get_templates_dir()
    if not os.path.exists(templates_dir):
        return []
        
    personas = []
    for filename in os.listdir(templates_dir):
        if filename.endswith(('.yaml', '.yml')):
            personas.append(os.path.splitext(filename)[0])
            
    return personas
