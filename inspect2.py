from pathlib import Path
text = Path('src/pages/Departments/DepartmentsPage.jsx').read_text(encoding='utf-8')
start = text.index('              <div className="department-modal__header"')
print(repr(text[start:start+300].encode('unicode_escape')))
