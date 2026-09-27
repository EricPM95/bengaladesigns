# Avisos de fechas especiales — Parte D

Generado el 2026-09-27 con `node scripts/destino/avisosFechas.mjs` (motor v3, días curados, completo, sin Free Tour ni experiencias), con los textos de `docs/roma_fechas_especiales.json` copiados a `roma.json`. Cada viaje: las tarjetas de la ventana, con su icono, la etiqueta que queda en el día y su texto. `auto` = lo ha hecho el motor; `curado` = de `fechas_especiales`; `mixto` = las dos cosas en la misma tarjeta.

**Reglas vigentes** (decisiones del 2026-09-27): salen las 15 fechas; las de `verificar: true` también, contadas con prudencia ("suele…", "compruébalo en la web oficial"). El 2 de junio lleva su horario especial como `"probable"`: el motor no aplica ese horario, pero evita poner ese día el Coliseo y el Foro.

Capturas: [móvil](diseno/avisos_fechas/navidad-movil.png) · [ordenador](diseno/avisos_fechas/navidad-ordenador.png) · [dos tarjetas con puntitos](diseno/avisos_fechas/ano-nuevo-movil-1.png) ([la segunda](diseno/avisos_fechas/ano-nuevo-movil-2.png), [en ordenador](diseno/avisos_fechas/ano-nuevo-ordenador.png)) · [etiqueta del día](diseno/avisos_fechas/etiqueta-del-dia.png). Se hicieron con los textos de antes; el diseño es el mismo.

## 2 días desde el domingo 26 de septiembre de 2027 (Vaticano en domingo)

1. **Domingo 26 de septiembre · Museos Vaticanos** · icono `cierre` · etiqueta del día: «Último domingo de mes» en el día 1 · auto
   > El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el lunes 27.

## 3 días desde el viernes 24 de diciembre de 2027 (Navidad)

1. **Navidad en Roma** · icono `navidad` · etiqueta del día: «Navidad en Roma» en el día 1 · mixto
   > Los Museos Vaticanos cierran el sábado 25 (Navidad) y el domingo 26 (San Esteban). Hemos puesto tu visita el viernes 24 para que no los pierdas.
   > El 25 de diciembre el Coliseo y el Panteón cierran por Navidad. Hemos puesto tu visita el domingo 26 para que no los pierdas.
   > Belenes en las iglesias, el árbol de San Pedro y el mercadillo de Navona; el 25 a las 12:00, bendición del Papa. Hemos colocado tu ruta para que no te pierdas nada.

## 2 días desde el viernes 13 de agosto de 2027 (Ferragosto, cerrado todo el viaje)

1. **Ferragosto** · icono `calma` · etiqueta del día: «Ferragosto» en el día 2 · mixto
   > El 14 de agosto los Museos Vaticanos cierran por Ferragosto. Hemos puesto tu visita el viernes 13 para que no los pierdas.
   > El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
   > Los romanos se van a la playa y la ciudad está más tranquila que nunca; el Vaticano y algunos restaurantes cierran. Hemos ajustado tu ruta a lo que sí abre.

## 3 días desde el martes 1 de junio de 2027 (2 de junio y audiencia del miércoles)

1. **2 de junio · Fiesta de la República** · icono `bandera` · etiqueta del día: «Fiesta de la República» en el día 2 · mixto
   > Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro. Hemos puesto la Basílica después de comer, cuando ya ha abierto.
   > Hay desfile en Via dei Fori Imperiali y es posible que el Coliseo y el Foro no abran hasta la tarde (compruébalo en su web). Hemos puesto su visita otro día.

## 3 días desde el viernes 26 de marzo de 2027 (Pascua y Pasquetta)

1. **Viernes Santo · Via Crucis en el Coliseo** · icono `religioso` · etiqueta del día: «Via Crucis en el Coliseo» en el día 1 · curado
   > Por la noche el Papa suele presidir el Via Crucis junto al Coliseo y la zona se corta por la tarde (compruébalo en vatican.va). Hemos puesto el Coliseo por la mañana.
2. **Domingo de Pascua** · icono `religioso` · etiqueta del día: «Domingo de Pascua» en el día 3 · mixto
   > Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 27 para que no los pierdas.
   > A las 12:00 el Papa suele dar la bendición Urbi et Orbi en la Plaza de San Pedro, con muchísima gente. Hemos dejado tu día preparado para que puedas ir si quieres.

## 2 días sin fechas, mes de diciembre (solo los de temporada)

1. **8 de diciembre · La Inmaculada** · icono `religioso` · etiqueta del día: — (sin fechas) · curado
   > Si tu viaje coincide con el 8 de diciembre: por la tarde el Papa suele ir a la Plaza de España a honrar a la Virgen y la plaza se llena. Los Museos Vaticanos cierran: hemos movido tu visita.
2. **Navidad en Roma** · icono `navidad` · etiqueta del día: — (sin fechas) · curado
   > Si tu viaje coincide con los días del 24 al 26 de diciembre: belenes en las iglesias, el árbol de San Pedro y el mercadillo de Navona; el 25 a las 12:00, bendición del Papa. Hemos colocado tu ruta para que no te pierdas nada.
3. **31 de diciembre · Nochevieja** · icono `fuegos` · etiqueta del día: — (sin fechas) · curado
   > Si tu viaje coincide con el 31 de diciembre: Roma despide el año con conciertos y fuegos artificiales, y esta noche todo se llena. Hemos puesto tu cena en un barrio con ambiente: resérvala con tiempo.

## Lo que conviene revisar

- **2 días desde el 26 de septiembre**: es el último domingo del mes, así que los Museos Vaticanos abren (solo por la mañana): el aviso es el de "muchísima gente", no el de "cierran".
- **Ferragosto desde el 13 de agosto**: no es "cerrado todo el viaje", porque el viernes 13 abren y el motor pone ahí el Vaticano. Con salida el 14 (2 días) sí sale el de cerrado todo el viaje.
- **Pascua desde el 26 de marzo (3 días)**: el viaje acaba el domingo 28, así que Pasquetta (29) no cae dentro. Ahora salen también el Viernes Santo y el Domingo de Pascua, que llevan `verificar: true`.
- **2 de junio**: con el horario `"probable"`, el motor pone el Coliseo otro día. En este viaje el Coliseo va el 3, así que la frase "Hemos puesto su visita otro día" es verdad.
- **Sin fechas (diciembre)**: salen las fechas fijas del mes con "Si tu viaje coincide con…" (la Inmaculada, Navidad y Nochevieja). No hay ninguna de `tipo: temporada`.
- Todos los textos tienen 35 palabras o menos.
- **`verificar: true` sin prudencia en el texto** (validar.mjs, en amarillo): liberacion, todos_los_santos, nochevieja.
