#!/bin/bash
# Uso: bash scripts/destino/_subirTanda.sh V52 "mensaje"  — build, commit selectivo (src, scripts, CLAUDE.md, data, server, public, docs de la tanda), push sin --force y espera a produccion.
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS" || exit 1
T=$1; MSG=$2
npm run build 2>&1 | tail -n 2 | grep -q "built in" || { echo "BUILD FALLA"; exit 2; }
git reset -q
git add CLAUDE.md src scripts server data public supabase 2>/dev/null
git add docs/dias/PROMPT_TANDA_${T}.md docs/dias/PROMPT_SEGUIDO_V52_A_V58.md docs/dias/${T}_capturas docs/dias/${T}_puntos.json docs/dias/REPASO_${T}.md docs/dias/DECISIONES_${T}.md docs/dias/PROMPT_TANDA_V5*.md 2>/dev/null
git diff --cached --name-only | grep -Ei '(^|/)\.env' && { echo ".ENV EN EL COMMIT"; exit 3; }
git diff --cached -- . ':!scripts/destino/_subirTanda.sh' | grep -E '^\+' | grep -Ei '(sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{30,}|service_role)' | head -n 2 | grep . && { echo "POSIBLE CLAVE"; exit 4; }
git commit -q -m "$MSG

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" || { echo "NADA QUE COMMITEAR"; }
git push origin main 2>&1 | tail -n 1
NEW=$(grep -o 'assets/index-[A-Za-z0-9_-]*\.js' dist/index.html | head -n 1)
for i in $(seq 1 30); do H=$(curl -s https://jutrip.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -n 1); [ "$H" = "$NEW" ] && { echo "PRODUCCION OK $H"; exit 0; }; sleep 20; done
echo "PRODUCCION NO CAMBIA (local $NEW, prod $H)"; exit 5
