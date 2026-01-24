import sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
text=Path('README.md').read_text(encoding='utf-8')
lines=text.splitlines()
for idx in range(202, 216):
    print(idx+1, repr(lines[idx]))
