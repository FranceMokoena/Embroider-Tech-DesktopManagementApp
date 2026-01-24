from pathlib import Path
text = Path('src/pages/Notifications/NotificationsPage.css').read_text()
start = text.index('.notification-card__description')
end = text.index('.notification-card__link')
print(text[start:end])
