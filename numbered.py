from pathlib import Path
import sys
sys.stdout.reconfigure(encoding="utf-8")
text = Path('src/pages/Departments/DepartmentsPage.jsx').read_text(encoding='utf-8')
lines = text.split('\n')
for idx in range(1, 120):
    print(f"{idx}: {lines[idx-1]}")
