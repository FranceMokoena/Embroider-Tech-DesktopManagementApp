from pathlib import Path
text=Path('src/pages/Technicians/TechniciansPage.jsx').read_text(encoding='utf-8')
start=text.index('<table')
end=text.index('</table>')+len('</table>')
print(text[start:end])
