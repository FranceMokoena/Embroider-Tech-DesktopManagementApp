from pathlib import Path
text = Path('src/pages/Departments/DepartmentsPage.jsx').read_text(encoding='utf-8')
target='            <div className=\"department-modal__header\"'
start=text.index(target)
print(repr(text[start:start+220].encode('unicode_escape')))
