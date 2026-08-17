import os
import sys
import glob
import yaml

# Ensure UTF-8 stdout on Windows
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich import print as rprint
from dotenv import set_key, dotenv_values

# Allow both direct execution (python cli/wizard.py) and module import (python -m cli.wizard)
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from validators import validate_groq_key, validate_livekit_creds
except ImportError:
    from cli.validators import validate_groq_key, validate_livekit_creds

app = typer.Typer(help="VoiceForge Guided Setup Wizard")
console = Console()

@app.command()
def main():
    console.print(Panel.fit("[bold cyan]🎙️ Welcome to VoiceForge Setup Wizard[/bold cyan]\nLet's configure your real-time voice AI stack in a few quick steps.", border_style="cyan"))
    
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    existing_env = dotenv_values(env_path) if os.path.exists(env_path) else {}

    # Step 1: Groq API Key
    console.print(Panel("Step 1: Groq API Key", expand=False, style="bold blue"))
    console.print("[dim]Get your free API key at: https://console.groq.com/keys[/dim]")
    
    existing_groq = existing_env.get("GROQ_API_KEY", "")
    groq_api_key = existing_groq
    
    while True:
        prompt_text = "Enter your Groq API Key"
        if existing_groq:
            prompt_text += f" [dim](Press Enter to keep existing)[/dim]"
            
        entered_key = Prompt.ask(prompt_text, password=True, default=existing_groq if existing_groq else "")
        if not entered_key and not existing_groq:
            if Prompt.ask("Skip Groq validation? (y/n)", default="n").lower() == "y":
                groq_api_key = ""
                break
            continue
            
        target_key = entered_key or existing_groq
        with console.status("[bold cyan]Validating Groq API key...[/bold cyan]", spinner="dots"):
            success, msg = validate_groq_key(target_key)
            
        if success:
            console.print(f"[green]✅ {msg}[/green]")
            groq_api_key = target_key
            break
        else:
            console.print(f"[red]❌ {msg}[/red]")
            if Prompt.ask("Proceed anyway / Skip validation? (y/n)", default="n").lower() == "y":
                groq_api_key = target_key
                break

    # Step 2: LiveKit Credentials
    console.print(Panel("Step 2: LiveKit Credentials", expand=False, style="bold blue"))
    console.print("[dim]Get your free Cloud credentials at: https://cloud.livekit.io (or use local ws://127.0.0.1:7880)[/dim]")
    
    existing_lk_url = existing_env.get("LIVEKIT_URL", "wss://your-project.livekit.cloud")
    existing_lk_key = existing_env.get("LIVEKIT_API_KEY", "")
    existing_lk_secret = existing_env.get("LIVEKIT_API_SECRET", "")
    
    while True:
        livekit_url = Prompt.ask("Enter LIVEKIT_URL", default=existing_lk_url)
        livekit_api_key = Prompt.ask("Enter LIVEKIT_API_KEY", default=existing_lk_key)
        livekit_api_secret = Prompt.ask("Enter LIVEKIT_API_SECRET", password=True, default=existing_lk_secret)
        
        with console.status("[bold cyan]Validating LiveKit credentials...[/bold cyan]", spinner="dots"):
            success, msg = validate_livekit_creds(livekit_url, livekit_api_key, livekit_api_secret)
            
        if success:
            console.print(f"[green]✅ {msg}[/green]")
            break
        else:
            console.print(f"[red]❌ {msg}[/red]")
            if Prompt.ask("Proceed anyway / Skip LiveKit validation? (y/n)", default="n").lower() == "y":
                break

    # Step 3: Persona Selection
    console.print(Panel("Step 3: Persona Selection", expand=False, style="bold blue"))
    
    templates_dir = os.path.join(current_dir, "templates")
    personas = []  # List of tuples: (slug, display_name)
    if os.path.exists(templates_dir):
        for filepath in sorted(glob.glob(os.path.join(templates_dir, "*.yaml"))):
            slug = os.path.splitext(os.path.basename(filepath))[0]
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict) and 'name' in data:
                        personas.append((slug, data['name']))
            except Exception:
                pass
                
    selected_persona_slug = existing_env.get("VOICEFORGE_PERSONA", "study_buddy")
    if not personas:
        console.print("[yellow]No persona templates found in cli/templates/. Using default persona.[/yellow]")
        selected_persona_slug = "default"
    else:
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("#", width=4)
        table.add_column("Persona Name", style="bold")
        table.add_column("Template File", style="dim")
        
        default_index = 1
        for idx, (slug, display_name) in enumerate(personas, start=1):
            if slug == selected_persona_slug:
                default_index = idx
            table.add_row(str(idx), display_name, f"{slug}.yaml")
            
        console.print(table)
        
        while True:
            choice = Prompt.ask("Select a persona by number", default=str(default_index))
            if choice.isdigit() and 1 <= int(choice) <= len(personas):
                selected_persona_slug = personas[int(choice)-1][0]
                console.print(f"[green]Selected persona: {personas[int(choice)-1][1]} ({selected_persona_slug})[/green]")
                break
            console.print("[red]Invalid choice. Try again.[/red]")
            
    # Step 4: Write .env
    if not os.path.exists(env_path):
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write("# VoiceForge Environment Configuration\n")
            
    set_key(env_path, "LIVEKIT_URL", livekit_url or "", quote_mode="never")
    set_key(env_path, "LIVEKIT_API_KEY", livekit_api_key or "", quote_mode="never")
    set_key(env_path, "LIVEKIT_API_SECRET", livekit_api_secret or "", quote_mode="never")
    set_key(env_path, "GROQ_API_KEY", groq_api_key or "", quote_mode="never")
    set_key(env_path, "VOICEFORGE_PERSONA", selected_persona_slug or "study_buddy", quote_mode="never")
    
    console.print(Panel(f"[bold green]✅ Configuration successfully written to:[/bold green] {env_path}", expand=False))

    # Step 5: Print Next Steps
    console.print(Panel("🚀 Next Steps: Run the services in separate terminals", expand=False, style="bold cyan"))
    console.print("[bold yellow]# Terminal 1 — Start the Token Server[/bold yellow]")
    console.print("cd token-server && uvicorn token_server:app --reload --port 8000\n")
    console.print("[bold yellow]# Terminal 2 — Start the Agent Worker[/bold yellow]")
    console.print("cd agent && python main.py dev\n")
    console.print("[bold yellow]# Terminal 3 — Start the Web Frontend[/bold yellow]")
    console.print("cd web && npm run dev\n")

if __name__ == '__main__':
    app()
