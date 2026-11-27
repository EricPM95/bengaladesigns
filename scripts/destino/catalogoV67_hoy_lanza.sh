#!/bin/bash
# CATALOGO V67 (HOY, Lanzarote): exige la API normal. Solo capturas; UN Chrome cada vez, por la cola.
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
export APP_URL=http://localhost:5173
rm -f /tmp/cv67_lanza_fin.log
C="node scripts/destino/_conCola.mjs node scripts/destino"
for h in H1 H2 H4 H5 R1; do $C/capturasV59_cierre.mjs lanza $h > /tmp/cv67_l_cierre_$h.log 2>&1; done
$C/capturasV59_comida_lanza.mjs > /tmp/cv67_l_comida.log 2>&1
$C/capturasV66_a.mjs lanza > /tmp/cv67_l_v66a.log 2>&1
$C/capturasV66_b.mjs fuerzas lanza > /tmp/cv67_l_fuerzas.log 2>&1
$C/capturasV54.mjs lanza > /tmp/cv67_l_v54.log 2>&1
$C/capturasV67_b_l6.mjs > /tmp/cv67_l_l6.log 2>&1
echo fin > /tmp/cv67_lanza_fin.log
