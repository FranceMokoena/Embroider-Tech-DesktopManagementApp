from pathlib import Path
text = Path('src/pages/Sessions/SessionsPage.jsx').read_text(encoding='utf-8').splitlines()
for idx,line in enumerate(text,1):
    if 200 <= idx <= 270:
        print(f"{idx:03}: {line}")
