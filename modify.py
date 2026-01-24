from pathlib import Path
path = Path('src/pages/Departments/DepartmentsPage.jsx')
text = path.read_text(encoding='utf-8')
marker = "              </div>\n            <form"
insert = "              </div>\n            {successMessage && <p className=\"department-modal__success\">{successMessage}</p>}\n            <form"
if marker not in text:
    raise SystemExit('marker not found')
text = text.replace(marker, insert, 1)
path.write_text(text, encoding='utf-8')
