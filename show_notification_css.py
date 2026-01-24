from pathlib import Path
text = Path('src/pages/Notifications/NotificationsPage.css').read_text()
start = text.index('.notification-card__header')
end = text.index('.notification-card__description')
print(text[start:end])
print('---desc block---')
start2 = text.index('.notification-card__description')
end2 = text.index('.notification-card__timestamp')
print(text[start2:end2])
