# Informe de la Tanda 6p

Hechos los seis puntos, solo en el móvil (430 px o menos). En el ordenador no cambia nada: todo va con la condición de pantalla estrecha. No toca cómo se montan los días ni el motor.

## Lo que cambia (a 375 px)

- **Las tarjetas ganan anchura:** de 285 a 329 px (un 15 % más ancha). La tarjeta empieza donde antes estaban las tres rayitas; las rayitas pasan al borde izquierdo del panel (a la altura de cada tarjeta) y se siguen usando para arrastrar. La línea de puntos del día y el número de cada parada se quedan, ajustados al nuevo sitio.
- **El panel blanco de los días, de borde a borde**, sin la franja beige de los lados (también las tarjetas de día cerradas; el asa de arrastrar del día se queda sobre su franja de color).
- **La franja de color, más estrecha** (de 58 a 46 px arriba) y con el icono de 20 a 16 px. Se sigue viendo el color de cada tipo de sitio.
- **La foto, un 9 % más estrecha** (de 138 a 126 px; el tope era un 15 %).
- **El «···»**, de 28 a 24 px y 2 px más abajo.
- **La pestañita de entrada** se queda en el borde derecho, a media altura, sin tapar el «···» ni el nombre.

## Nombres largos

A 375 px: «Plaza de San Pedro» en una línea; «Museos Vaticanos y Capilla Sixtina, con la Pinacoteca» y «El Puente y el Castillo de Sant'Angelo» en dos (medido con el ancho real del nombre: 141 px). Sin «…». A 390 px, todos los nombres del día del Vaticano en una o dos líneas.

## Captura de antes y de después (375 px, día del Vaticano)

- Antes: `img/6p_antes_375.jpg`
- Después: `img/6p_despues_375.jpg`

## Comprobado

- Arrastrar una parada sigue funcionando (movida «Plaza de San Pedro» por detrás de la Basílica con el asa nueva).
- Typecheck limpio (`tsc -p tsconfig.app.json`).
- No he pasado las pruebas del motor (no cambia) ni he revisado otros fallos, como pediste.
- **Sin ver:** HOY con un viaje de hoy (sus tarjetas no usan este componente, no cambian), y el ordenador (no cambia por construcción).
