#!/usr/bin/env bash
# Автосохранение проекта в GitHub.
#   bash autosave.sh        — сохранить изменения (commit + push)
#   bash autosave.sh pull   — забрать свежую версию с GitHub (при старте на другом компьютере)
# Claude Code запускает его сам (см. .claude/settings.json).
cd "$(dirname "$0")" || exit 0

if [ "$1" = "pull" ]; then
  git pull --rebase --autostash -q >/dev/null 2>&1 || echo "autosave: не удалось забрать изменения с GitHub (нет интернета?)" >&2
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  git add -A 2>/dev/null
  git commit -q -m "Автосохранение $(date '+%Y-%m-%d %H:%M')" >/dev/null 2>&1
fi

# Всё, что уходит в GitHub, сразу попадает на сайт. Поэтому код с ошибкой НЕ отправляем —
# он остаётся сохранённым на этом компьютере, пока ошибку не исправят.
code_ok=1
command -v node >/dev/null 2>&1 && {
  node --check app.js >/dev/null 2>&1 || code_ok=0
  node -e "new Function(require('fs').readFileSync('studio.js','utf8').replace(/^import.*$/mg,''))" >/dev/null 2>&1 || code_ok=0
  node --check sw.js >/dev/null 2>&1 || code_ok=0
}
if [ "$code_ok" = 0 ]; then
  echo "autosave: в коде ошибка — сохранено только на компьютере, на сайт не отправлено" >&2
  exit 0
fi

# Отправляем, если есть неотправленные коммиты
if [ -n "$(git log '@{u}..' --oneline 2>/dev/null)" ]; then
  git pull --rebase --autostash -q >/dev/null 2>&1
  git push -q >/dev/null 2>&1 || echo "autosave: не удалось отправить в GitHub (нет интернета?)" >&2
fi
exit 0
