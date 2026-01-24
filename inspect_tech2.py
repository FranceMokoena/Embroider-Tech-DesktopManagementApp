from pathlib import Path
text = Path('src/pages/Technicians/TechniciansPage.jsx').read_text(encoding='utf-8')
pos = text.index('technicians-list')
print(text[pos-80:pos+200])
