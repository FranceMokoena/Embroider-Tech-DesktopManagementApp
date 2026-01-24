from pathlib import Path
text = Path('src/pages/Technicians/TechniciansPage.jsx').read_text(encoding='utf-8')
start = text.index('      <div class="technicians-list"')
end = text.index('      )}', start)
print(text[start:end])
