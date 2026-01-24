from pathlib import Path
path = Path('src/layout/AppShell.jsx')
text = path.read_text(encoding='utf-8')
LT = chr(60)
GT = chr(62)
lines = [
'          ' + LT + 'div className=\" "app-shell__actions\ ref={adminActionsRef}' + GT + '\n',
'            ' + LT + 'button type=\" "button\ className=\app-shell__action" "app-shell__notification\ aria-label=\View" "notifications\ onClick={handleNotificationClick}' + GT + '\n',
'              ' + LT + 'span aria-hidden=\" "true\ className={pp-shell__emoji-icon  + GT + '\n',
'                ??\n',
'              ' + LT + '/span' + GT + '\n',
'              {newScanCount  && (' + '\n',
'                ' + LT + 'span className=\" "app-shell__notification-count\' + GT + '{newScanCount}' + LT + '/span' + GT + '\n',
'              )}\n',
'            ' + LT + '/button' + GT + '\n',
'            ' + LT + 'button type=\" "button\ className=\app-shell__action\ aria-label=\Refresh" "dashboard\ onClick={handleRefresh}' + GT + '\n',
'              ' + LT + 'span aria-hidden=\" "true\ className=\app-shell__emoji-icon\' + GT + '\n',
