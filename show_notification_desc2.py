from pathlib import Path
text = Path('src/pages/Notifications/NotificationsPage.css').read_text()
start = text.index('.notification-card__link')
end = text.index('.notification-card__new-badge')
print(text[start:end])
