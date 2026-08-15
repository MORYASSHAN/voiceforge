import re

with open(r"C:\Users\Shaan\.gemini\antigravity\brain\3c8d5d18-a8ca-4098-bcc2-e6259d0e6296\.system_generated\steps\35\content.md", "r", encoding="utf-8") as f:
    content = f.read()

# Try to find python code blocks in the markdown file
# Or try to find <pre><code> tags or similar in HTML
matches = re.findall(r'<code[^>]*>(.*?)</code>', content, re.DOTALL | re.IGNORECASE)

if not matches:
    print("No code tags found, maybe looking for pre tags")
    matches = re.findall(r'<pre[^>]*>(.*?)</pre>', content, re.DOTALL | re.IGNORECASE)

for idx, match in enumerate(matches):
    if "Agent" in match or "livekit" in match or "import" in match:
        clean_text = re.sub(r'<[^>]+>', '', match)
        clean_text = clean_text.replace("&quot;", '"').replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace("&#x27;", "'")
        print(f"--- Code Block {idx} ---")
        print(clean_text)
