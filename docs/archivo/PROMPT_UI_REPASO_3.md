# Repaso de diseño 3

Seis cambios de diseño. Reglas de siempre:
- Commit por parte y sin push.
- Textos con «tú».
- Sin precios.

Comprueba cada punto en pantalla a 390 px de ancho (móvil) y a ancho de escritorio. Pásame una captura de cada uno.

## 1. Pestaña Ruta: la tarjeta del destino, más limpia, y la ventana de antes

Ahora la tarjeta dice «PAÍS 1», «Italia», tres puntos de colores y «1 destino · 4 días».

Qué queda:
- La **bandera** del país, a la izquierda, igual que ahora.
- El **nombre del destino**: «Roma», no el país.
- Debajo, los **días y las fechas**, si las hay: «4 días · 03 sept – 06 sept». Sin fechas: solo «4 días».
- La **flecha** de la derecha se queda.

Qué se quita: «PAÍS 1», los tres puntos de colores y «1 destino».

Con varios destinos, una tarjeta por destino, en el orden del viaje, cada una con su bandera, sus días y sus fechas.

**Al tocar la tarjeta:** vuelve la ventana que había antes, con **«Hoteles en {destino}»** arriba y **«Actividades en {destino}»** debajo. Búscala en el historial de git (el componente que se quitó o se dejó de usar) y recupérala tal cual, con sus enlaces de afiliado. Si ha cambiado algo desde entonces que la rompe, dime qué y no lo inventes.

## 2. Margen arriba en las franjas del día

La cabecera «MAÑANA · 08:30 — 13:05» va pegada a la barra de llegada, y lo mismo pasa con TARDE y NOCHE respecto a lo que tienen encima. Cada cabecera de franja lleva:
- **28 px de margen arriba**, para que se vea claro dónde empieza cada parte del día;
- **12 px abajo**, hasta la primera tarjeta.

La primera franja del día también lleva su margen arriba, aunque tenga encima la barra de llegada.

## 3. Las comidas y las cenas también se mueven con las tres rayitas

Las tarjetas de comida y de cena (la «Mesa») llevan las mismas tres rayitas que las paradas para arrastrarlas, con el mismo tamaño (zona de 44 px) y el mismo sitio.
- Se mueven entre las paradas del mismo día y la hora se recalcula, igual que al mover una parada.
- La comida no puede acabar en la noche ni la cena en la mañana: si se suelta fuera de su franja, vuelve a su sitio.
- Un restaurante sigue sin ser una parada del motor: solo cambia el orden en el que lo ves.

## 4. Un solo icono de autobús

En la fila del bus salen dos iconos: el lineal y un emoji de autobús («🚌 Bus 115 · 15 min»). Quita el emoji y deja solo el icono lineal, con el mismo tamaño, grosor y color que el del caminante de las filas andando. Revisa lo mismo en metro, tranvía y taxi: un solo icono lineal en cada fila.

## 5 y 6. La comida y la cena, con su espacio

En las capturas, la tarjeta de la cena va pegada al aperitivo de encima, sin hueco. Además, es más ancha que las paradas: se sale por la izquierda, por fuera de la línea del día.

Las tarjetas de comida y de cena:
- Llevan el **mismo hueco arriba y abajo que hay entre dos paradas**.
- Van **alineadas con las paradas**: el mismo borde izquierdo y el mismo derecho, dentro de la línea del día.

Revísalo en todos los casos:
- comida después de una parada;
- cena después de un aperitivo;
- cena después de una parada de noche;
- comida o cena al final del día, antes de «Fin del día».

## INVARIANTES

- Todas las tarjetas del día van alineadas entre sí y con el mismo hueco entre ellas: paradas, comidas, cenas, aperitivos, desayuno y «De camino».
- Cada cabecera de franja lleva su margen arriba.
- Un tipo de transporte, un icono lineal, sin emojis.

**Informe corto,** con una captura de cada punto.
