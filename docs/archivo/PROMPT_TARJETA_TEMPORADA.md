# La tarjeta de temporada: en todos los viajes

Todos los viajes, al abrir la ruta por primera vez, enseñan una **tarjeta de temporada**. Solo después salen los avisos de fechas, si los hay, uno por tema, como ahora.

La tarjeta sustituye a la nota de temporada que hoy sale arriba de la ruta.

Reglas:
- Commit por parte y sin push.
- A INVARIANTES: «Cada viaje empieza con su tarjeta de temporada. Solo dice lo que la ruta hace de verdad».

## 1. El diseño

Está en `docs/diseno/tarjeta_temporada/Navidad Modal.dc.html`, con `support.js` e `image-slot.js` al lado, para abrirlo en el navegador. Lleva las seis versiones (1a y 1b de Navidad, y 2a-2d de primavera, verano, otoño e invierno) con sus efectos. Cópiala igual, con la escena, los colores, la letra y lo que cae. **Los textos no:** los del diseño prometen cosas que la ruta no hace; usa los del punto 3.
- **Formato:** tarjeta de 390 px.
  - Arriba, una escena de la época: el cielo, la silueta del destino y lo que cae (pétalos, sol, hojas o nieve), que se desvanece antes de llegar al texto.
  - Encima, en letra pequeña: «HEMOS PREPARADO TU VIAJE PARA ESTAS FECHAS».
  - El título grande: «Primavera en Roma», «Verano en Roma», «Otoño en Roma», «Invierno en Roma», «Navidad en Roma».
  - El texto y el botón «Entendido».
- **Navidad:** solo la versión 1a, «Noche en Roma», con el cielo de noche, las ventanas encendidas y la guirnalda. **La 1b («Nevando sobre la tarjeta», la del medallón con la fecha) no se usa: no la copies.**
- Si el móvil tiene «reducir movimiento», no cae nada.
- Se cierra con «Entendido» y no vuelve a salir en ese viaje. Si quieres, un botón pequeño arriba para volver a verla.
- `{destino}` en el título y en los textos: tiene que valer para cualquier destino.

## 2. Qué estación

- **Con fechas:** la del primer día del viaje. En Navidad, del 26 de noviembre al 6 de enero en Roma (`temporada_navidad`, como ya está), la de Navidad en lugar de la de invierno.
- **Sin fechas:** la época elegida en el formulario.
- Primavera: 20 de marzo – 20 de junio. Verano: 21 de junio – 22 de septiembre. Otoño: 23 de septiembre – 20 de diciembre. Invierno: 21 de diciembre – 19 de marzo. (Ajústalo si ya hay otro corte en `by_period`; dime cuál usas.)

## 3. Los textos

Solo prometen lo que la ruta hace. `{hora}` es el atardecer real, al cuarto de hora. Cada frase entre corchetes sale solo si se cumple su condición; si no, se usa la versión sin ella.

**Primavera**
> ¡Vas a vivir {destino} en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las {hora}, hemos preparado tu ruta para aprovechar la luz[ y llegar a los miradores con el atardecer].

- Condición: que alguna parada del viaje sea un atardecer.

**Verano**
> ¡Vas a vivir {destino} en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor[: lo más importante, a primera hora, y después de comer, descanso o sitios a cubierto]. Y como anochece sobre las {hora}, las mejores vistas llegan al atardecer.

- Condición «a primera hora»: la misma regla de siempre, que la mayoría de los días empiecen por un imprescindible antes de las 10:00.
- Condición «después de comer»: que la regla de verano de 14:00 a 16:30 (PROMPT_REPASO_LOCAL_ROMA, punto 2) esté en la ruta. Si falta una de las dos, quita solo esa parte.

**Otoño**
> ¡Vas a vivir {destino} en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las {hora}, hemos colocado tu ruta para que veas lo mejor con luz[ y llegues a los miradores con el atardecer].

- Condición: que alguna parada del viaje sea un atardecer.

**Invierno** (sin Navidad)
> ¡Vas a vivir {destino} en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las {hora}, hemos adaptado tu ruta: lo que se ve al aire libre, con luz[, y por la noche, {destino} iluminada].

- Condición: que el viaje tenga paseo nocturno.

**Navidad**: los tres textos que ya tienes (con mercadillo en la ruta, sin mercadillo, y solo luces a finales de noviembre). Sin cambios.

## 4. Orden al abrir la ruta

1. La tarjeta de temporada.
2. Al tocar «Entendido», los avisos de fechas, si hay (la ventana de siempre, uno por tema).
3. La ruta.

Si ya se vieron (el viaje se abrió antes), no salen otra vez.

**Informe corto:** capturas de las cinco tarjetas a 390 px, y cómo se eligen la estación y los textos.
