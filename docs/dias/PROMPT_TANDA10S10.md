Hola. TANDA 10S10: LO QUE HA ENCONTRADO ERIC EN EL MÓVIL (1-nov): MOVER PARADAS ENTRE FRANJAS (GRAVE), LOS AVISOS DE HORARIO, LAS EXCURSIONES EN RESERVAS, EL DÍA DE LLEGADA EN DÍAS Y RETOQUES. Va después de la 10S9b (ya hecha). Si para el apartado 1 hace falta tocar el motor, dímelo antes y pasa la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S10.md e inclúyelo en tu commit. Acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.
- Las reglas de siempre (`docs/REGLAS_DE_LA_APP.md`, `CLAUDE.md`); las nuevas de esta tanda, añádelas ahí.
- **Rápida:** 4 agentes, un servidor, hasta 2 Chrome. Solo las pruebas de lo tocado y `pruebaJutrip`. Si algo se complica, déjalo a medias y dímelo. Dime al empezar cuánto calculas. Nota de estado (`_estado_10s10.md`) a la rama `estado` cada 30 minutos. No apagues el PC.

## 1. Mover paradas entre franjas (GRAVE)
- **El fallo (capturas de Eric):** día con TARDE: 8 Castillo de Sant'Angelo, 9 Puente Sant'Angelo · CENA L'Arcangelo · NOCHE: 10 Piazza Navona. «Mover después» en el Castillo → 8 Puente, 9 Castillo: bien. Otra vez «Mover después» en el Castillo → sale NOCHE · 9 Piazza Navona · CENA · **TARDE** · 10 Castillo · **NOCHE** otra vez: la Navona sube, el Castillo se queda con su TARDE detrás de la noche y salen dos NOCHE. Parece que cada parada conserva su franja y las cabeceras se pintan por grupos seguidos.
- **Las reglas (Eric, 1-nov):**
  - **La comida y la cena son paradas como las demás:** se mueven igual, con los botones y arrastrando.
  - **Fijos solo los textos MAÑANA, TARDE y NOCHE**, siempre en ese orden y una vez cada uno: MAÑANA al principio, TARDE después de la comida, NOCHE después de la cena. **Una parada es de la franja donde cae**: si el Castillo pasa por detrás de la cena, es de Noche (primera, delante de la Navona). Si se mueve la cena, el paso a la Noche se mueve con ella. Una franja sin paradas no enseña su texto.
  - **«Mover antes/después» cambia una posición por la de al lado**, y nada más se mueve.
  - **El viajero manda:** no se impide ningún movimiento; solo se avisa (apartado 2).
- Repasa igual «Mover antes», arrastrar, «Mover a otro día» y «Añadir entre dos paradas», cruzando franjas y pasando por la comida y la cena. Dime qué estaba mal en cada uno.

## 2. Los avisos de horario, sin dar nada por hecho
- Una línea pequeña debajo de la parada, **mientras sea verdad** (se quita sola si se mueve), siempre con «posiblemente»:
  - sitios que se ven **por dentro y por fuera** (Castillo de Sant'Angelo, Coliseo…): «A esta hora, posiblemente el Castillo de Sant'Angelo ya esté cerrado, pero puedes verlo por fuera igualmente.»;
  - sitios que **solo se ven por dentro** (Museos Vaticanos, Galería Borghese…): «A esta hora, posiblemente los Museos Vaticanos ya estén cerrados.»;
  - antes de abrir: «A esta hora, posiblemente aún no haya abierto.» (o «…no hayan abierto.»);
  - **una experiencia nocturna antes de la cena:** «Esta parada es para verla de noche: a esta hora posiblemente aún sea de día.».
- Qué sitio es de cada tipo, de nuestros datos. En `REPASO_10S10.html`, **una tabla** con los «por dentro y por fuera» y los «solo por dentro», para que Eric la revise.

## 3. Los nombres que dependen de la hora
- «Fontana de Trevi, sin gente» (31 veces en los datos) sigue diciendo «sin gente» aunque se mueva a las 17:00. **Regla nueva: el nombre de una parada nunca depende de la hora** («Fontana de Trevi»). Lo de la hora, en una etiqueta pequeña que solo sale si la hora lo cumple («Sin gente a primera hora» temprano; «Iluminado» o «Al atardecer» a su hora) y se quita sola si se mueve. Igual con «El Coliseo iluminado», «Mirador del Janículo iluminado», «El Panteón de noche», «Trastevere al atardecer», «Terraza del Pincio iluminada», «Plaza del Campidoglio iluminada…», «El Puente y el Castillo de Sant'Angelo iluminados» y los que encuentres.
- **Los títulos de los días** («Trevi a primera hora…», «Trevi y la Escalinata sin gente…»): si el viajero cambia ese día y ya no es verdad, el título pasa a uno sin horas, solo con los sitios.

## 4. Las excursiones
- **«Enlace pendiente» en [Ver disponibilidad] de la página del día de excursión.** La causa: `data/dias/roma/_excursiones.json` (6g, `ejemplo: true`) tiene `enlace` vacío y solo 5 excursiones. Que la página use las 8 con los datos y los enlaces de la 10R (`roma.json`), con nuestro código y campaña, el nombre completo («Excursión a Florencia en tren de alta velocidad») y «No reembolsable» cuando toque. Eric la rediseñará con Design más adelante.
- **«¿Ya la has reservado? Añade tu confirmación»** (hoy guarda un código y no sirve para nada): lleva a RESERVAS › Excursiones y abre la hoja de la excursión con el día puesto, como las entradas.
- **En RESERVAS, un bloque «Excursiones» como «Entradas y Free Tour»** (cabecera grande, estado debajo del título, flecha). Al abrirlo: la excursión de tu ruta (y las que haya reservado) y, **abajo y dentro del bloque**, «Ver más excursiones». Estado: «0 de 1 reservada»; sin día de excursión, «Ninguna en tu ruta» y dentro solo «Ver más excursiones». Fuera la tarjeta suelta y el «Ver más excursiones» de fuera.

## 5. RESERVAS
- **Todos los bloques, cerrados al entrar, siempre** (cambia lo de la 10S9).
- **La etiqueta del precio, del mismo tamaño y en negrita que las demás** («Sales de», «Aeropuerto de llegada»): en el vuelo «¿Cuánto ha costado en total?»; en el alojamiento, las entradas y las excursiones, solo «Precio».
- **Dudas de la 10S9b:** con datos del vuelo escritos a mano (o guardados de antes) sin tarjeta, **sí sale el bloque de datos con su lápiz** («sin datos, sin bloque»; pon al día `pruebaTanda10S8_C`). El «Cambiar» de las entradas reservadas, **un lápiz de 44 × 44** como en el resto.

## 6. DÍAS, el día de llegada
- [Añadir] del bloque de alojamiento → **RESERVAS › Alojamiento** (hoy va al mapa; desde allí puede escribirlo o [Buscar alojamiento]).
- **Fuera la franja oscura «Tu día de llegada · Con el Pase Roma…»**.
- El bloque del vuelo: **[Ver] → RESERVAS › Llegada y vuelta**; tocar el resto del bloque, lo de ahora.

## 7. La ficha de un sitio
- **La pestaña «Entradas» con su número**, en un círculo pequeño dorado al lado (Design pone «Entradas · 9»).

## 8. El destello al refrescar
- A veces, al refrescar con un viaje abierto, se ve un momento la pantalla de origen y destino y luego la del viaje. Mientras la app no sepa si hay viaje, la pantalla de carga (el logo), nunca la de crear viaje. Pruébalo con la red lenta.

## 9. La prueba
- `pruebaTanda10S10`: el caso del Castillo (dos «Mover después»: Castillo de Noche, primera, sin cabeceras repetidas) y mover la cena; arrastrar y «Mover antes» cruzando franjas; los cuatro avisos de horario; «Fontana de Trevi» con su etiqueta solo temprano; el título del día al cambiarlo; [Ver disponibilidad] con enlace en las 8; el bloque Excursiones; RESERVAS cerrado al entrar; las etiquetas del precio; el día de llegada (sin la franja del pase, [Añadir] y [Ver] a RESERVAS); el número en «Entradas»; sin destello al refrescar con la red lenta. Más `pruebaJutrip`, en 0 fallos.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S10.html`, con la tabla del apartado 2.

## 10. El informe
En «10S10» de `INFORME_TANDA10B.md`, en palabras sencillas, con la lista de comprobación DE ESTA TANDA al final y arriba de `REPASO_10S10.html`.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
