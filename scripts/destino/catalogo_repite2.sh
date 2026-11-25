#!/bin/bash
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
rm -f /tmp/cat_fin3.log
node scripts/destino/catalogo_reservas.mjs naranja > /tmp/cat_r3.log 2>&1
node scripts/destino/catalogo_pase.mjs pregunta > /tmp/cat_r4.log 2>&1
node scripts/destino/catalogo_hoy.mjs entrar > /tmp/cat_r5.log 2>&1
echo fin > /tmp/cat_fin3.log
