# PROMPT UI — Diseño de la app (por partes)

Toca el diseño. Aquí van las dos primeras partes: la pestaña Días y el interior de cada día. Hazlas en orden, commit por parte y sin push. Todo con reglas generales, a INVARIANTES, que valga para todos los destinos.

Reglas de siempre:
- Diseño Trazo: Instrument Serif + Geist, papel crema, acento terracota, tarjetas con franja de color.
- Cualquier cambio de estilo se aplica en toda la app.
- Sin alertas del navegador: las confirmaciones, en ventanas propias de la app.
- Commit por parte y sin push.

## Parte 1 — Pestaña Días

### 1. Cada día con su color
Ahora el mapa ya pinta cada día de un color, pero en la lista de días nada dice qué color es cada uno.

- **Los colores de los pines se quedan como están.** Solo hay que llevar ese mismo color a la lista de días y a la línea.
- **La línea del recorrido de cada día**, de su color, uniendo sus paradas en orden (1 → 2 → 3…).
  - En el mapa con todos los días, cada día con su línea.
- **Una franja diagonal fina en la parte izquierda de cada acordeón**, del color de su día.
  - Fina, pero que se note.
  - El color sale del mismo sitio que el de los pines, para que siempre coincidan.
  - El cuadrado del número del día se queda como está; solo el número lleva el color del día (Parte 2, punto 1).
- **Los puntitos de debajo del título se quedan como están**, cada uno del color de su tipo de parada (monumento, arte…).
- **El mapa, según el acordeón:**
  - sin ningún día abierto, salen las paradas de todos los días, cada una con su color y su línea;
  - al abrir un día, solo sale ese día en el mapa, como ahora.
- **Sin leyenda en el mapa.** La franja ya dice qué color es cada día.
- **El color va unido al día, no a su posición.** Si el viajero mueve un día de sitio, su franja y sus pines se mueven con él y no cambian de color.

### 2. El asa para arrastrar los días
- Ahora las tres rayitas están entre el título y los tres puntos, pequeñas y grises.
- Pásalas **a la izquierda del todo**, antes del cuadrado del número, sobresaliendo un poco por encima del borde izquierdo del acordeón. Que no tapen la franja de color.
- **Más grandes que ahora**, y con una zona de toque de al menos 44 × 44 px, para que se cojan bien con el dedo.
- Como ahora, solo en los días que se pueden mover. Los días de llegada y de vuelta se quedan fijos al principio y al final.

### 3. Menú de los tres puntos de cada día
- **«Volver al día original»** (lo que ahora es «Regenerar»), con el icono de la varita: vuelve a dejar ese día tal como lo preparamos. Detalle en la Parte 2, punto 6.
- **«Eliminar día»**, nuevo, en todos los días, también en el de llegada y el de vuelta:
  - antes de eliminar, una ventana de la app: «¿Eliminar el día X? Puedes recuperarlo con "Volver a mi ruta original".», con los botones «Eliminar» y «Cancelar»;
  - después, un aviso abajo durante unos segundos: «Día eliminado · Deshacer».

### 4. «Volver a mi ruta original» (la varita mágica)
- **Qué hace:** deja todos los días exactamente como se los dimos al crear el viaje: mismos días, mismo orden, mismas paradas, horas y restaurantes. No vuelve a calcular la ruta: recupera la copia guardada al crearla.
  - Esa copia se guarda al crear el viaje y no cambia al editar.
  - Así, aunque cambien los datos o las reglas, la ruta vuelve a ser la misma que vio.
- **Dónde:** un botón redondo flotante con el icono de la varita mágica, en la esquina superior derecha del mapa de la pestaña Días, justo debajo de la flecha «‹» de plegar el panel y con su mismo estilo (redondo, borde terracota, fondo crema).
  - La primera vez sale con su texto, «Ruta original»; después, solo el icono.
  - **Solo aparece si el viajero ha cambiado algo.** Sin cambios, no hace falta.
- **Al tocarlo:** una ventana de la app: «¿Volver a tu ruta original? Tus días quedarán tal como te los preparamos y se perderán los cambios que has hecho.», con los botones «Volver a la original» y «Cancelar».
- **Después:** un aviso abajo durante unos segundos, «Ruta original recuperada · Deshacer».
- Los textos, de tú a tú y en tono cercano.

## Parte 2 — Interior de cada día

Prototipo de referencia: el lienzo «Interior del día». En cada punto va el prototipo elegido. Donde el prototipo y este texto no coincidan, manda este texto.

### 1. El color del día, también dentro
- El número del día en la cabecera del día abierto («1») va en el color de ese día en el mapa.
  - El cuadrado se queda como está; solo cambia el color del número.
  - Sobre el cuadrado oscuro, el tono claro del pin; sobre el claro, el tono fuerte.
- La franja diagonal de la Parte 1 también va aquí, en la cabecera.
- **Los números de orden de las paradas (1, 2, 3…), todos del color del día**, igual que sus pines en el mapa: relleno claro, número en el tono fuerte y borde blanco.
- La franja del icono de cada tarjeta sigue siendo del color de su tipo (monumento, iglesia, museo…), igual que ahora.

### 2. Solo tres tramos: mañana, tarde y noche
- Quita «Mediodía».
- El orden del día queda así: **Mañana → Comida → Tarde → Cena → Noche**.
  - Las paradas de antes de comer van en Mañana (el Panteón a las 12:30 es de la mañana).
  - La comida y la cena van entre tramos, no dentro de uno.
  - En invierno, cuando la cena cae después de la última parada, va dentro de Noche, al final.
- **50 px de margen** encima de cada cabecera de tramo y encima de la comida y la cena, respecto a lo que tengan arriba. Así se ven bien separados los cinco bloques.
- **Entre la cabecera del tramo y su primer «+ Añadir parada», el mismo espacio que entre parada → «+ Añadir parada» → parada.** Ahora hay demasiado.

### 3. Comida y cena, con su propio formato (elegido: «Comidas A · Mesa»)
- Sin foto y sin número de orden.
- Una tarjeta de fondo terracota suave (#FCEFE8, borde #F1D6C9), con:
  - el icono en un círculo terracota;
  - «COMIDA · 13:15 – 14:15» en mono, en terracota;
  - el nombre del restaurante en grande, en Instrument Serif;
  - debajo, a cuántos minutos está;
  - a la derecha, el botón «Cambiar» con borde terracota.
- La cena, igual, con su icono y «CENA».

### 4. El desayuno
- Sin número de orden, para no romper la numeración de la ruta.
- El mismo formato que la comida, en pequeño: una tarjeta terracota suave más baja, con el nombre en letra normal y «Cambiar» como enlace.
- Se queda dentro del tramo de la mañana, en su sitio del recorrido.

### 5. «De camino» (elegido: «De camino B · Mini-tarjeta»)
- Es lo que pillas andando de una parada a otra sin desviarte, sin tiempo de visita: una calle, una fuente pequeña o una plaza de nivel 3. **No son lugares cercanos**: esos van en «+ Añadir parada» y en Explorar.
- Sin número de orden y sin hora. No suma tiempo.
- Una tarjeta baja (60 px) con borde discontinuo y fondo casi blanco, un poco metida hacia la derecha respecto a las paradas, con:
  - la foto redonda del lugar;
  - «DE CAMINO · SIN DESVÍO» en mono pequeño;
  - el nombre en Instrument Serif;
  - «Ver ›» a la derecha, que abre su ficha.
- Parte el trayecto en dos, cada tramo con sus minutos andando: 4 min → Borgo Pio → 3 min.

### 6. Volver al día original
- Quita el botón «Volver a la ruta original» de dentro del día.
- En el menú de los tres puntos de cada día, **«Volver al día original»**, con el icono de la varita mágica: deja ese día exactamente como lo preparamos (la copia guardada, sin recalcular).
  - Solo sale si el día tiene cambios.
- La varita del mapa (Parte 1) hace lo mismo con el viaje entero.

### 7. Abajo del todo: la excursión (elegido: «Excursión B · Tres destinos»)
- Quita «Montar día manualmente»: para eso ya está el botón «+ Añadir día».
- La excursión se queda, con una tarjeta al final de la lista de días, solo si el viaje no lleva ya un día de excursión:
  - arriba, «UN DÍA FUERA DE ROMA» en mono terracota y «Sal de Roma un día» en Instrument Serif;
  - debajo, «Cambia uno de tus días por una de estas escapadas. El resto del viaje se queda como está.»;
  - tres tarjetas con foto, una al lado de otra: las tres primeras excursiones del destino (en Roma, Pompeya, Florencia y Costa Amalfitana), cada una con la franja terracota en diagonal, el nombre y «Día completo» o «Medio día»;
  - abajo, el botón «Ver todas las excursiones», con borde terracota.
- Tocar una tarjeta abre esa excursión.
- Al elegir una, pregunta qué día cambia. En viajes de 4 días, propone el de D5C.
- Sin precios.

### 8. Las fotos
- La foto de cada parada es siempre de ese lugar.
  - Ahora, la Plaza de España de noche sale con la Fontana de Trevi.
- Las paradas de noche llevan una foto de ese lugar de noche. Si no hay, la de día del mismo lugar, nunca la de otro sitio.
- Haz una página de revisión, `docs/FOTOS_ROMA.html`, con cada lugar de Roma y sus fotos de día y de noche, para que las revise yo.
- La clave de Unsplash, en el servidor.

### 9. Horas y duraciones redondas
- Ahora salen visitas de 27 o 32 min y horas como 09:38.
- Regla: todas las horas y todas las duraciones que ve el viajero, **de 5 en 5 minutos** (09:40, 25 min, 1h 10 min).
- La elástica se ajusta también de 5 en 5.
- Los minutos andando entre paradas se quedan exactos («3 min · 225 m»): son el paseo real.
- Es un cambio del motor. Comprueba que la prueba de las 365 fechas y los 56 viajes siguen igual o mejor.

### 10. Avisos de fechas al crear la ruta (fuera de la pestaña Días)
- Si hay más de un aviso, **flechas ‹ › a los lados y «1 de 3»**, además de los puntitos.
- El botón dice «Siguiente» hasta el último aviso, y en el último, «Entendido».
- Así nadie cierra sin ver el resto.

### 11. Un detalle
- En la comida del Panteón pone «34 hasta Museos Vaticanos y Capilla Sixtina»: falta «min». Revisa ese texto en todas las comidas y cenas.

## Al terminar
- Commit por parte y sin push.
- Informe corto en `docs/INFORME_UI.md`: qué has cambiado, capturas de la pestaña Días y de un día abierto (uno de verano y uno de invierno), y lo que no hayas podido hacer.
