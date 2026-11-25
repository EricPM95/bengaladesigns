#!/bin/bash
# Corre los guiones del catálogo seguidos (UN Chrome cada vez, dentro de la misma plaza de la cola). Cada trozo, una app nueva (los avisos «una vez al día» no se pisan).
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
rm -f /tmp/cat_fin.log
n=0
corre() { n=$((n+1)); node scripts/destino/catalogo_$1.mjs "${@:2}" > /tmp/cat_${n}_$1.log 2>&1; cp /tmp/cat_${n}_$1.log /tmp/cat_run_${n}_$1.log 2>/dev/null; }
corre logros
corre hoy entrar
corre hoy yano
corre hoy navidad
corre hoy lluvia
corre hoy lejos
corre hoy ubicacion
corre hoy avisos
corre hoy recuerdos
corre pase pregunta
corre pase aviso
corre pase hoyesprueba p3 dia12 gastada
corre reservas
echo fin > /tmp/cat_fin.log
