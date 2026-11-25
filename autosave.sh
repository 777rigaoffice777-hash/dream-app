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
  git add -A
  git commit -q -m "Автосохранение $(date '+%Y-%m-%d %H:%M')" >/dev/null 2>&1
fi

# Отправляем, если есть неотправленные коммиты
if [ -n "$(git log '@{u}..' --oneline 2>/dev/null)" ]; then
  git pull --rebase --autostash -q >/dev/null 2>&1
  git push -q >/dev/null 2>&1 || echo "autosave: не удалось отправить в GitHub (нет интернета?)" >&2
fi
exit 0
