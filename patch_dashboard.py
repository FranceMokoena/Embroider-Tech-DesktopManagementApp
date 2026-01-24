# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('src/pages/Dashboard/DashboardPage.jsx')
text = path.read_text()
old = "<div className=\"dashboard-export\">\n          <button\n            type=\"button\"\n            className=\"dashboard-export__button\"\n            onClick={exportDashboardPdf}\n            disabled={isExporting}\n          >\n            <span role=\"img\" aria-label=\"export\">📤</span>\n            {isExporting ? 'Preparing PDF…' : 'Export dashboard stats PDF'}\n          </button>\n        </div>"
new = "<div className=\"dashboard-export\">\n          <button\n            type=\"button\"\n            className=\"dashboard-export__button\"\n            onClick={exportDashboardPdf}\n            disabled={isExporting}\n          >\n            <span role=\"img\" aria-label=\"export\">📤</span>\n            <span className=\"sr-only\">{isExporting ? 'Preparing PDF' : 'Export dashboard stats'}</span>\n          </button>\n        </div>"
if old not in text:
    raise SystemExit('old block missing')
path.write_text(text.replace(old, new, 1))
