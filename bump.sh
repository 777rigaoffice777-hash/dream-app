#!/usr/bin/env bash
# Поднимает версию приложения во всех местах сразу.
# Запускай после каждого изменения:  bash bump.sh
# Телефон увидит новую версию и сам обновится.
cd "$(dirname "$0")" || exit 1
v=$(grep -o '"v": *[0-9]*' version.json | grep -o '[0-9]*$')
n=$((v + 1))
sed -i "s/?v=[0-9]*/?v=$n/g" index.html
sed -i "s/name=\"app-version\" content=\"[0-9]*\"/name=\"app-version\" content=\"$n\"/" index.html
sed -i "s/masterskaya-v[0-9]*/masterskaya-v$n/" sw.js
printf '{ "v": %s }\n' "$n" > version.json
echo "Версия $n"
