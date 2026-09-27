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
   > Belenes en las iglesias, el árbol de San Pedro y el mercadillo de Piazza Navona. El 25 cierran el Coliseo, el Foro, el Panteón y el Vaticano. Hemos preparado tu ruta para esos días.

## 2 días desde el viernes 13 de agosto de 2027 (Ferragosto, cerrado todo el viaje)

1. **Ferragosto** · icono `calma` · etiqueta del día: «Ferragosto» en el día 2 · mixto
   > El 14 de agosto los Museos Vaticanos cierran por Ferragosto. Hemos puesto tu visita el viernes 13 para que no los pierdas.
   > El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
   > Mitad de agosto: los romanos se van a la playa y Roma está más tranquila que nunca, aunque algunos restaurantes cierran por vacaciones. Hemos preparado tu ruta con lo que abre estos días.

## 3 días desde el martes 1 de junio de 2027 (2 de junio y audiencia del miércoles)

1. **2 de junio · Fiesta de la República** · icono `bandera` · etiqueta del día: «Fiesta de la República» en el día 2 · mixto
   > Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro. Hemos puesto la Basílica después de comer, cuando ya ha abierto.
   > Por la mañana hay un desfile militar en Via dei Fori Imperiali y las Frecce Tricolori pintan el cielo con la bandera. Hemos preparado tu ruta para que puedas verlo.

## 3 días desde el viernes 26 de marzo de 2027 (Pascua y Pasquetta)

1. **Domingo 28 de marzo · Museos Vaticanos** · icono `cierre` · etiqueta del día: «Museos Vaticanos cerrados» en el día 3 · auto
   > Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 27 para que no los pierdas.

## 2 días sin fechas, mes de diciembre (solo los de temporada)

1. **Navidad en Roma** · icono `navidad` · etiqueta del día: — (sin fechas) · curado
   > Si tu viaje coincide con los días del 24 al 26 de diciembre: belenes en las iglesias, el árbol de San Pedro y el mercadillo de Piazza Navona. El 25 cierran el Coliseo, el Foro, el Panteón y el Vaticano. Hemos preparado tu ruta para esos días.


## Lo que conviene revisar

- **2 días desde el 26 de septiembre**: ese domingo es el **último domingo del mes**, así que los Museos Vaticanos abren (solo por la mañana): el aviso es el de "muchísima gente", no el de "cierran". Con otro domingo sale "Los domingos los Museos Vaticanos cierran…".
- **Ferragosto desde el 13 de agosto**: no es "cerrado todo el viaje": el viernes 13 abren y el motor pone ahí el Vaticano. Con salida el 14 (2 días) sí sale: "Los Museos Vaticanos cierran el 14 y el 15 de agosto (Ferragosto), que son los días de tu viaje. Los hemos dejado en «No te dio tiempo» por si cambias de fechas."
- **Pascua desde el 26 de marzo (3 días)**: el viaje acaba el domingo 28, así que Pasquetta (29) no cae dentro, y la tarjeta de Pascua lleva `verificar: true`: solo sale lo del domingo. Con 4 días sale Pasquetta, junto con el Vaticano movido.
- **2 de junio**: el `horario_especial` del Coliseo y el Foro está **sin confirmar**, así que el motor no los mueve y no sale el aviso automático de horario. He quitado del texto curado "hemos pasado su visita a la tarde u otro día" porque no sería verdad. Si confirmas el horario de 2027, pon `confirmado: true` y el motor los pondrá dentro de ese horario, con su aviso.
- **Año Nuevo**: el texto dice "hoy te llevamos por plazas y fuentes", pero si el 1 de enero cae en el día de excursión (pasa en 5 días desde el 29 de diciembre) no es verdad. Habría que decidir si el texto se queda más general.
- **Sin fechas (diciembre)**: no hay ninguna fecha de `tipo: temporada` en el JSON, así que solo sale Navidad como fecha fija del mes, con "Si tu viaje coincide con…". El mercadillo navideño como temporada (del 1 de diciembre al 6 de enero) habría que añadirlo.
- Salen 6 de las 15 fechas; las otras 9 llevan `verificar: true` (validar.mjs las lista).

## Textos curados reescritos (el dato primero, al final "Hemos…", 35 palabras como mucho)

| Fecha | Antes | Ahora |
|---|---|---|
| ano_nuevo | Roma empieza el año con calma: el Coliseo, el Foro, el Panteón y los Museos Vaticanos cierran hoy. Hemos colocado tu ruta para que los veas otro día, y hoy te llevamos por plazas, fuentes e iglesias abiertas. | Roma empieza el año con calma: el Coliseo, el Foro, el Panteón y los Museos Vaticanos cierran. Hemos colocado tu ruta para que los veas otro día y hoy te llevamos por plazas y fuentes. |
| reyes | Último día del mercadillo navideño de Piazza Navona, donde los romanos celebran la Befana. Los Museos Vaticanos cierran; hemos puesto tu visita otro día. | Último día del mercadillo navideño de Piazza Navona, donde los romanos celebran la Befana. Los Museos Vaticanos cierran. Hemos puesto tu visita otro día. |
| viernes_santo | Por la noche el Papa preside el Via Crucis junto al Coliseo. La zona se corta desde la tarde: hemos dejado el Coliseo para la mañana. | Por la noche, hacia las 21:15, el Papa preside el Via Crucis junto al Coliseo, y la zona se corta desde la tarde. Hemos dejado el Coliseo para la mañana. |
| pascua | A las 12:00 el Papa da la bendición Urbi et Orbi en la Plaza de San Pedro, después de la misa. Hay muchísima gente: llega con margen si quieres verla. | A las 12:00 el Papa da la bendición Urbi et Orbi en la Plaza de San Pedro y hay muchísima gente. Para verla, llega hacia las 11:30. Hemos preparado tu día para que puedas acercarte. |
| natale_di_roma | Es el Natale di Roma: desfile de legionarios en el Circo Máximo y, a mediodía, el sol entra por el óculo del Panteón y cae justo sobre la puerta. Si puedes, pásate por el Panteón hacia las 12:00. | Es el Natale di Roma: desfile de legionarios en el Circo Máximo y el sol entra por el óculo del Panteón y cae sobre la puerta. Hemos apuntado la hora: pásate hacia las 12:00. |
| liberacion | Festivo nacional: hay actos oficiales y mucha gente en el centro. Tu ruta está preparada para este día. | Festivo nacional: hay actos oficiales y mucha gente en el centro. Hemos preparado tu ruta para este día. |
| primero_mayo | Los Museos Vaticanos y las Termas de Caracalla cierran; los hemos colocado en otro día. Por la tarde hay un gran concierto en San Juan de Letrán y la zona se llena. | Los Museos Vaticanos y las Termas de Caracalla cierran, y por la tarde hay un gran concierto en San Juan de Letrán. Hemos colocado tu visita a los dos en otro día. |
| fiesta_republica | Por la mañana hay un desfile militar en Via dei Fori Imperiali y los aviones de las Frecce Tricolori pintan el cielo con la bandera. El Coliseo y el Foro abren más tarde: hemos pasado su visita a la tarde u otro día. | Por la mañana hay un desfile militar en Via dei Fori Imperiali y las Frecce Tricolori pintan el cielo con la bandera. Hemos preparado tu ruta para que puedas verlo. |
| san_pedro_pablo | Son los patronos de Roma. Los Museos Vaticanos cierran (hemos movido tu visita) y por la noche el Castillo de Sant'Angelo se ilumina con la Girandola, unos fuegos artificiales que se hacen desde el siglo XV. | Son los patronos de Roma. Por la noche el Castillo de Sant'Angelo se ilumina con la Girandola, fuegos del siglo XV: acércate al puente hacia las 21:30. Hemos movido tu visita al Vaticano, que cierra. |
| ferragosto | Mitad de agosto: los romanos se van a la playa y la ciudad está más tranquila que nunca. Los Museos Vaticanos cierran el 14 y el 15, y algunos restaurantes cierran por vacaciones. | Mitad de agosto: los romanos se van a la playa y Roma está más tranquila que nunca, aunque algunos restaurantes cierran por vacaciones. Hemos preparado tu ruta con lo que abre estos días. |
| inmaculada | Por la tarde el Papa va a la Plaza de España a rendir homenaje a la Virgen, junto a la columna de la Inmaculada: la plaza se llena. Los Museos Vaticanos cierran; hemos movido tu visita. | Por la tarde el Papa va a la Plaza de España a rendir homenaje a la Virgen y la plaza se llena. Los Museos Vaticanos cierran. Hemos movido tu visita. |
| navidad | Belenes en las iglesias, el árbol y el belén de la Plaza de San Pedro y el mercadillo de Piazza Navona. El 25 a las 12:00, bendición Urbi et Orbi del Papa. El Coliseo, el Foro, el Panteón y el Vaticano cierran el 25: tu ruta ya lo tiene en cuenta. | Belenes en las iglesias, el árbol de San Pedro y el mercadillo de Piazza Navona. El 25 cierran el Coliseo, el Foro, el Panteón y el Vaticano. Hemos preparado tu ruta para esos días. |
| nochevieja | Roma despide el año con conciertos y fuegos artificiales. Reserva la cena con tiempo: esta noche todo se llena. | Roma despide el año con conciertos y fuegos artificiales, y esta noche todo se llena: reserva la cena con tiempo. Hemos preparado tu día para que llegues descansado. |

Quedan en `data/pipeline_v2/roma.json` → `fechas_especiales`; el original sigue en `docs/roma_fechas_especiales.json`.
