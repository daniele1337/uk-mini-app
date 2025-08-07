#!/bin/bash
cd /var/www/uk-mini-app
git add .
git commit -m "Update: $(date)"
echo "✅ Код обновлен!"
