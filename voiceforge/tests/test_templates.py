import os
import glob
import yaml
import pytest

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates_dir = os.path.join(root_dir, "cli", "templates")

def test_template_files_exist():
    assert os.path.exists(templates_dir)
    files = glob.glob(os.path.join(templates_dir, "*.yaml"))
    assert len(files) >= 3

def test_all_templates_valid_yaml():
    files = glob.glob(os.path.join(templates_dir, "*.yaml"))
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            assert isinstance(data, dict), f"{fpath} is not a valid YAML dictionary"
            assert "name" in data, f"{fpath} is missing 'name' field"
            assert "system_prompt" in data, f"{fpath} is missing 'system_prompt' field"
            assert len(data["name"].strip()) > 0
            assert len(data["system_prompt"].strip()) > 20
