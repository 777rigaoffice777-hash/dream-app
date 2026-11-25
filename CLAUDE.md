# Мастерская — PWA Вани

Простое веб-приложение без сборки: `index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`.
Хостинг: GitHub Pages из ветки `main` → https://777rigaoffice777-hash.github.io/dream-app/

## Правила
- Автор — ребёнок, который учится. Объясняй просто, по-русски, коротко.
- Всё сохраняется в GitHub автоматически: хук Stop запускает `autosave.sh` (commit + push),
  хук SessionStart забирает свежую версию (`autosave.sh pull`). Не отключай это.
- После изменений поднимай версию: `CACHE` в `sw.js` и `?v=N` у style.css/app.js в `index.html`,
  чтобы телефон быстрее получил обновление.
- Без фреймворков и сборщиков, пока Ваня сам не попросит.
