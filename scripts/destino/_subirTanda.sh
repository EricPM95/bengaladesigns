#!/bin/bash
# Uso: bash scripts/destino/_subirTanda.sh V52 "mensaje"  — build, commit selectivo (src, scripts, CLAUDE.md, data, server, public, docs de la tanda), push sin --force y espera a produccion.
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS" || exit 1
T=$1; MSG=$2
npm run build 2>&1 | tail -n 2 | grep -q "built in" || { echo "BUILD FALLA"; exit 2; }
git reset -q
git add CLAUDE.md src scripts server shared data public supabase 2>/dev/null
git add docs/dias/PROMPT_TANDA_${T}.md docs/dias/PROMPT_SEGUIDO_V52_A_V58.md docs/dias/${T}_capturas docs/dias/${T}_puntos.json docs/dias/REPASO_${T}.md docs/dias/DECISIONES_${T}.md docs/dias/PROMPT_TANDA_V5*.md 2>/dev/null
git add docs/dias/CHECKLIST_V60_V65.md docs/dias/REPASO_V60_V65.html docs/dias/_decisiones_V60_V65.md docs/dias/CHECKLIST_V66_V67.md docs/dias/_decisiones_V66_V67.md docs/dias/CATALOGO_AVISOS.html docs/dias/PROMPT_SEGUIDO_V66_V67.md 2>/dev/null
git add docs/dias/CHECKLIST_V68_V71.md docs/dias/REPASO_V68_V71.html docs/dias/_decisiones_V68_V71.md docs/dias/PROMPT_SEGUIDO_V68_A_V71.md 2>/dev/null
git add docs/dias/catalogo docs/dias/REPASO_V66_V67.html docs/dias/V6*_log_*.json 2>/dev/null
git add docs/civitatis docs/dias/PROMPT_SEGUIDO_V60_A_V65.md docs/dias/${T}_puntos.json 2>/dev/null
git add -A -- docs/dias/RUTAS_REVISION.html docs/dias/RUTAS_REVISION.json docs/dias/RUTAS_REVISION_LARGOS.html docs/dias/RUTAS_REVISION_LARGOS.json 2>/dev/null
git diff --cached --name-only | grep -Ei '(^|/)\.env' && { echo ".ENV EN EL COMMIT"; exit 3; }
git diff --cached -- . ':!scripts/destino/_subirTanda.sh' ':!supabase/migrations' ':!docs/dias/COMPROBAR_*.sql' ':!docs/dias/CATALOGO_AVISOS.html' ':!docs/dias/REPASO_V*.html' ':!docs/dias/catalogo' | grep -E '^\+' | grep -Ei '(sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{30,}|service_role)' | head -n 2 | grep . && { echo "POSIBLE CLAVE"; exit 4; }
git commit -q -m "$MSG

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" || { echo "NADA QUE COMMITEAR"; }
git push origin main 2>&1 | tail -n 1
MARCA=$3
for i in $(seq 1 30); do P=$(curl -s https://jutrip.app/ | grep -o "assets/index-[A-Za-z0-9_-]*.js" | head -n 1); for f in $(curl -s https://jutrip.app/$P | grep -o "assets/[A-Za-z0-9_.-]*.js" | sort -u); do curl -s https://jutrip.app/$f | grep -q "$MARCA" && { echo "PRODUCCION OK ($f)"; exit 0; }; done; sleep 20; done
echo "PRODUCCION NO TIENE LA MARCA"; exit 5
