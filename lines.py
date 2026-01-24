from pathlib import Path
text = Path('src/pages/Departments/DepartmentsPage.jsx').read_text(encoding='utf-8')
lines = text.split('\n')
for idx in range(130, 180):
    print(idx+1, lines[idx])
