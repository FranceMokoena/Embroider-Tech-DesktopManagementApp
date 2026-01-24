from pathlib import Path
text = Path('src/pages/Dashboard/DashboardPage.jsx').read_text()
start = text.index('<div className="dashboard-export"')
end = text.index('</div>', start)
print(text[start:end+6])
