# Avisos de fechas especiales — Parte D

Generado el 2026-09-27 con `node scripts/destino/avisosFechas.mjs` (motor v3, días curados, completo, sin Free Tour ni experiencias). Cada viaje: las tarjetas de la ventana, con su icono, la etiqueta que queda en el día y su texto. `auto` = lo ha hecho el motor; `curado` = de `fechas_especiales`; `mixto` = las dos cosas en la misma tarjeta.

Capturas: [móvil](diseno/avisos_fechas/navidad-movil.png) · [ordenador](diseno/avisos_fechas/navidad-ordenador.png) · [dos tarjetas con puntitos](diseno/avisos_fechas/ano-nuevo-movil-1.png) ([la segunda](diseno/avisos_fechas/ano-nuevo-movil-2.png), [en ordenador](diseno/avisos_fechas/ano-nuevo-ordenador.png)) · [etiqueta del día](diseno/avisos_fechas/etiqueta-del-dia.png).

## 2 días desde el domingo 26 de septiembre de 2027 (Vaticano en domingo)

1. **Domingo 26 de septiembre · Museos Vaticanos** · icono `cierre` · etiqueta del día: «Último domingo de mes» en el día 1 · auto
   > El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el lunes 27.

## 3 días desde el viernes 24 de diciembre de 2027 (Navidad)

1. **Navidad en Roma** · icono `navidad` · etiqueta del día: «Navidad en Roma» en el día 1 · mixto
   > Los Museos Vaticanos cierran el sábado 25 (Navidad) y el domingo 26 (San Esteban). Hemos puesto tu visita el viernes 24 para que no los pierdas.
   > El 25 de diciembre el Coliseo y el Panteón cierran por Navidad. Hemos puesto tu visita el domingo 26 para que no los pierdas.
   > Belenes en las iglesias, el árbol de la Plaza de San Pedro y el mercadillo de Navona; el 25 a las 12:00, bendición del Papa. El Coliseo, el Foro, el Panteón y el Vaticano cierran el 25: hemos colocado tu ruta para que no te pierdas nada.

## 2 días desde el viernes 13 de agosto de 2027 (Ferragosto, cerrado todo el viaje)

1. **Ferragosto** · icono `calma` · etiqueta del día: «Ferragosto» en el día 2 · mixto
   > El 14 de agosto los Museos Vaticanos cierran por Ferragosto. Hemos puesto tu visita el viernes 13 para que no los pierdas.
   > El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
   > Los romanos se van a la playa y la ciudad está más tranquila que nunca; los Museos Vaticanos cierran y algunos restaurantes también. Hemos ajustado tu ruta a lo que sí abre.

## 3 días desde el martes 1 de junio de 2027 (2 de junio y audiencia del miércoles)

1. **2 de junio · Fiesta de la República** · icono `bandera` · etiqueta del día: «Fiesta de la República» en el día 2 · mixto
   > Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro. Hemos puesto la Basílica después de comer, cuando ya ha abierto.
   > Por la mañana hay un desfile militar en Via dei Fori Imperiali y las Frecce Tricolori pintan el cielo con la bandera. El Coliseo y el Foro abren más tarde: hemos pasado su visita a la tarde u otro día.

## 3 días desde el viernes 26 de marzo de 2027 (Pascua y Pasquetta)

1. **Domingo 28 de marzo · Museos Vaticanos** · icono `cierre` · etiqueta del día: «Museos Vaticanos cerrados» en el día 3 · auto
   > Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 27 para que no los pierdas.

## 2 días sin fechas, mes de diciembre (solo los de temporada)

1. **Navidad en Roma** · icono `navidad` · etiqueta del día: — (sin fechas) · curado
   > Si tu viaje coincide con los días del 24 al 26 de diciembre: belenes en las iglesias, el árbol de la Plaza de San Pedro y el mercadillo de Navona; el 25 a las 12:00, bendición del Papa. El Coliseo, el Foro, el Panteón y el Vaticano cierran el 25: hemos colocado tu ruta para que no te pierdas nada.


## Lo que conviene revisar

- **2 días desde el 26 de septiembre**: ese domingo es el **último domingo del mes**, así que los Museos Vaticanos abren (solo por la mañana): el aviso es el de "muchísima gente", no el de "cierran". Con otro domingo sale "Los domingos los Museos Vaticanos cierran…".
- **Ferragosto desde el 13 de agosto**: no es "cerrado todo el viaje": el viernes 13 abren y el motor pone ahí el Vaticano. Con salida el 14 (2 días) sí sale: "Los Museos Vaticanos cierran el 14 y el 15 de agosto (Ferragosto), que son los días de tu viaje. Los hemos dejado en «No te dio tiempo» por si cambias de fechas."
- **Pascua desde el 26 de marzo (3 días)**: el viaje acaba el domingo 28, así que Pasquetta (29) no cae dentro, y la tarjeta de Pascua lleva `verificar: true`: solo sale lo del domingo. Con 4 días sale Pasquetta, junto con el Vaticano movido.
- **2 de junio**: el `horario_especial` del Coliseo y el Foro está **sin confirmar**, así que el motor no los mueve y no sale el aviso automático de horario. He quitado del texto curado "hemos pasado su visita a la tarde u otro día" porque no sería verdad. Si confirmas el horario de 2027, pon `confirmado: true` y el motor los pondrá dentro de ese horario, con su aviso.
- **Año Nuevo**: el texto dice "hoy te llevamos por plazas y fuentes", pero si el 1 de enero cae en el día de excursión (pasa en 5 días desde el 29 de diciembre) no es verdad. Habría que decidir si el texto se queda más general.
- **Sin fechas (diciembre)**: no hay ninguna fecha de `tipo: temporada` en el JSON, así que solo sale Navidad como fecha fija del mes, con "Si tu viaje coincide con…". El mercadillo navideño como temporada (del 1 de diciembre al 6 de enero) habría que añadirlo.
- Salen 6 de las 15 fechas; las otras 9 llevan `verificar: true` (validar.mjs las lista).

## Textos curados

Mandan los tuyos: mientras preparaba esto reescribiste los textos en `docs/roma_fechas_especiales.json`, y son los que están ahora en `roma.json`. Lo que sale en `validar.mjs`:

- 🔴 **natale_di_roma**: 41 palabras (35 como mucho) — sale ya.
- 🔴 **fiesta_republica**: 40 palabras (35 como mucho) — sale ya.
- 🔴 **san_pedro_pablo**: 39 palabras (35 como mucho) — lleva `verificar: true`, ahora no sale.
- 🔴 **navidad**: 47 palabras (35 como mucho) — sale ya.
- 🟡 **fiesta_republica**: dice "hemos pasado su visita a la tarde u otro día", pero su `horario_especial` está sin confirmar y el motor no mueve el Coliseo ni el Foro. O se confirma el horario de 2027 (`confirmado: true`) o el texto no debería decirlo.
