#!/bin/sh
# Оновлює ?v=… у всіх посиланнях на файли, щоб браузер одразу взяв нові CSS/JS, а не старі з кешу
cd "$(dirname "$0")/.." || exit 1
new=$(date +%s)
git grep -lIE 'v=[0-9]{9,}' -- ':!node_modules' | xargs sed -i -E "s/([?&]v=)[0-9]{9,}/\1$new/g"
echo "version -> $new"
