#!/usr/bin/env bash
# Выложить изменения и дождаться, пока на сайте обновятся ВСЕ файлы.
#   bash deploy.sh "что я поменял"
cd "$(dirname "$0")" || exit 1
# Сначала проверяем код: с ошибкой ничего не выкладываем
node --check app.js || { echo "ОШИБКА в app.js — выкладка отменена"; exit 1; }
node -e "new Function(require('fs').readFileSync('studio.js','utf8').replace(/^import.*$/mg,''))" || { echo "ОШИБКА в studio.js — выкладка отменена"; exit 1; }
bash bump.sh
git add -A && git commit -q -m "${1:-Обновление}" && git push -q || exit 1
n=$(grep -o '[0-9]*' version.json)
URL=https://777rigaoffice777-hash.github.io/dream-app
for i in $(seq 1 60); do
  ok=1
  for f in app.js studio.js; do
    curl -s "$URL/$f?t=$RANDOM$RANDOM" | head -1 | grep -q "build $n" || ok=0
  done
  curl -s "$URL/version.json?t=$RANDOM$RANDOM" | grep -q "\"v\": $n" || ok=0
  [ $ok = 1 ] && { sleep 5; echo "Готово: версия $n на сайте"; exit 0; }
  sleep 8
done
echo "Сайт ещё не обновился — проверь позже"; exit 1
