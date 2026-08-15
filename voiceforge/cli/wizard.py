import os
import glob
import yaml
import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich import print as rprint
from dotenv import set_key

from validators import validate_groq_key, validate_livekit_creds

app = typer.Typer()
console = Console()

@app.command()
def main():
    console.print(Panel("Welcome to VoiceForge Wizard", expand=False))
    
    # Step 1: Groq API Key
    console.print(Panel("Step 1: Groq API Key", expand=False))
    console.print("Get your API key at: https://console.groq.com/keys")
    
    while True:
        groq_api_key = Prompt.ask("Enter your Groq API Key", password=True)
        if not groq_api_key:
            if Prompt.ask("Skip Groq validation? (y/n)") == "y":
                break
            continue
            
        with console.status("Validating Groq API key...", spinner="dots"):
            success, msg = validate_groq_key(groq_api_key)
            
        if success:
            console.print(f"[green]✅ {msg}[/green]")
            break
        else:
            console.print(f"[red]❌ {msg}[/red]")
            if Prompt.ask("Skip Groq validation? (y/n)") == "y":
                break

    # Step 2: LiveKit Credentials
    console.print(Panel("Step 2: LiveKit Credentials", expand=False))
    console.print("Get your credentials at: https://cloud.livekit.io")
    
    while True:
        livekit_url = Prompt.ask("Enter LIVEKIT_URL", default="wss://your-project.livekit.cloud")
        livekit_api_key = Prompt.ask("Enter LIVEKIT_API_KEY")
        livekit_api_secret = Prompt.ask("Enter LIVEKIT_API_SECRET", password=True)
        
        with console.status("Validating LiveKit credentials...", spinner="dots"):
            success, msg = validate_livekit_creds(livekit_url, livekit_api_key, livekit_api_secret)
            
        if success:
            console.print(f"[green]✅ {msg}[/green]")
            break
        else:
            console.print(f"[red]❌ {msg}[/red]")
            if Prompt.ask("Skip LiveKit validation? (y/n)") == "y":
                break

    # Step 3: Persona Selection
    console.print(Panel("Step 3: Persona Selection", expand=False))
    
    templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    personas = []
    if os.path.exists(templates_dir):
        for filepath in glob.glob(os.path.join(templates_dir, "*.yaml")):
            try:
                with open(filepath, 'r') as f:
                    data = yaml.safe_load(f)
                    if data and 'name' in data:
                        personas.append(data['name'])
            except Exception as e:
                pass
                
    if not personas:
        console.print("[yellow]No persona templates found in cli/templates/. Proceeding without persona.[/yellow]")
        selected_persona = ""
    else:
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("#")
        table.add_column("Persona Name")
        
        for idx, persona in enumerate(personas, start=1):
            table.add_row(str(idx), persona)
            
        console.print(table)
        
        while True:
            choice = Prompt.ask("Select a persona by number")
            if choice.isdigit() and 1 <= int(choice) <= len(personas):
                selected_persona = personas[int(choice)-1]
                break
            console.print("[red]Invalid choice. Try again.[/red]")
            
    # Step 4: Write .env
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    
    if not os.path.exists(env_path):
        with open(env_path, 'w') as f:
            f.write("")
            
    set_key(env_path, "LIVEKIT_URL", livekit_url or "")
    set_key(env_path, "LIVEKIT_API_KEY", livekit_api_key or "")
    set_key(env_path, "LIVEKIT_API_SECRET", livekit_api_secret or "")
    set_key(env_path, "GROQ_API_KEY", groq_api_key or "")
    set_key(env_path, "VOICEFORGE_PERSONA", selected_persona or "")
    
    console.print(Panel("✅ Config written to .env", expand=False))

    # Step 5: Print Next Steps
    console.print(Panel("Next Steps", expand=False))
    console.print("Run the following commands in separate terminals:\n")
    console.print("[bold cyan]# Terminal 1 — Start the token server[/bold cyan]")
    console.print("cd token-server && uvicorn token_server:app --reload --port 8000\n")
    console.print("[bold cyan]# Terminal 2 — Start the agent[/bold cyan]")
    console.print("cd agent && python main.py dev\n")
    console.print("[bold cyan]# Terminal 3 — Start the web UI[/bold cyan]")
    console.print("cd web && npm run dev\n")

if __name__ == '__main__':
    app()
