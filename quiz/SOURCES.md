# Источники картинок викторины «Страны»

- **Флаги и гербы** — Wikimedia Commons (https://commons.wikimedia.org). Имя исходного файла для каждой
  страны записано в `data.json` → `items[].credits`. Большинство государственных символов — общественное
  достояние; условия каждого файла — на его странице в Wikimedia Commons.
- **Очертания современных стран** — Natural Earth (https://www.naturalearthdata.com), общественное достояние.
- **Очертания исторических стран** — historical-basemaps, André Ourednik
  (https://github.com/aourednik/historical-basemaps), лицензия GPL-3.0
  (https://www.gnu.org/licenses/gpl-3.0.html). Очертания упрощены для викторины.

Пересобрать данные: `cd tools && npm install`, затем `node tools/build-quiz.mjs` (список стран — `tools/quiz-list.mjs`).
