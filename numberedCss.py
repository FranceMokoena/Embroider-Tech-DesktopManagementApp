from pathlib import Path
import sys
sys.stdout.reconfigure(encoding="utf-8")
lines=Path('src/pages/Departments/DepartmentsPage.css').read_text(encoding='utf-8').split('\n')
for idx in range(len(lines)-20, len(lines)):
    print(f"{idx+1}: {lines[idx]}")
