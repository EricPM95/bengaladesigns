#!/bin/bash
# CATALOGO V67 (HOY, Roma): vuelve a correr los guiones de captura que ya existen (solo capturas, nada de la app) y deja sus fotos donde los dejan ellos;
# después `catalogoV67_hoy_copiar.mjs` las copia a docs/dias/catalogo/. UN Chrome cada vez, por la cola.
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
export APP_URL=http://localhost:5173
rm -f /tmp/cv67_roma_fin.log
C="node scripts/destino/_conCola.mjs node scripts/destino"
for h in H1 H2 H3 H4 H5 R1 R2; do $C/capturasV59_cierre.mjs roma $h > /tmp/cv67_cierre_$h.log 2>&1; done
$C/capturasV59_comida_roma.mjs > /tmp/cv67_comida.log 2>&1
$C/capturasV66_a.mjs roma > /tmp/cv67_v66a.log 2>&1
$C/capturasV66_b.mjs fuerzas roma > /tmp/cv67_fuerzas.log 2>&1
$C/capturasV66_b.mjs resumen roma > /tmp/cv67_resumen.log 2>&1
for p in uno tres peligro margen pasada; do $C/capturasV54.mjs $p > /tmp/cv67_v54_$p.log 2>&1; done
$C/capturasV63_a.mjs aviso > /tmp/cv67_v63_aviso.log 2>&1
$C/capturasV63_a.mjs entrada > /tmp/cv67_v63_entrada.log 2>&1
$C/capturasV52.mjs 1 > /tmp/cv67_v52_1.log 2>&1
$C/capturasV52.mjs 2 > /tmp/cv67_v52_2.log 2>&1
$C/catalogo_hoy.mjs lluvia avisos > /tmp/cv67_hoy_lluvia.log 2>&1
echo fin > /tmp/cv67_roma_fin.log
