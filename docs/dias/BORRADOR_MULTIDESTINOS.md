BORRADOR (no pasar a Code todavía). Va cuando Roma esté entera curada y lista para lanzar (la ruta, RESERVAS, las llegadas, todo). Antes de pasarlo, revisarlo con lo que haya cambiado y ponerle su número de tanda.

Ideas para cuando toque (Claude, 10-oct):
- Italia (ciudades en tren): este mismo modelo. Curar cada ciudad como Roma (sus días escritos con llegada y vuelta, sus reservas, horarios, tips, fotos y excursiones), más una tabla de los tramos reales entre ciudades (estación, duración). En el formulario, solo los destinos curados; los demás, «Próximamente» con «Avísame» (así sabemos qué piden).
- Islandia (ruta en coche o autocaravana): otro tipo de viaje (el arquetipo roadtrip_exclusivo). La pieza no es la ciudad sino la etapa: de A a B en coche, con las paradas del camino y dónde se duerme. Habría que escribir «etapas escritas» (por número de días y sentido de la vuelta), con el alojamiento de cada noche (o el camping), el coche una vez, las excursiones por etapa, y la temporada y el estado de las carreteras como avisos.
- Orden: Roma lista → ciudades de Italia → rutas en coche (Islandia la primera).

Tanda de los viajes de varios destinos, cada destino como un viaje suelto (decidido por Eric el 10-oct-2026). Va todo en este mensaje. Los destinos no curados siguen con el generador.

LA IDEA
Un viaje por Italia (Florencia → Pisa → Roma) son tres viajes sueltos seguidos. Cada destino funciona como Roma ahora, que es un viaje de un solo destino: su ruta, su RESERVAS, sus fotos. No se parte ningún día:
- el último día de un destino es su «día de vuelta», hasta la hora en que se va;
- el primero del siguiente es su «día de llegada», desde la hora en que llega;
- esa fecha sale en los dos destinos.

1. CÓMO SE CUENTAN LOS DÍAS
- 3 días en Roma (13–15 oct) y 5 en Florencia (15–19 oct) son 7 días. El día de cambio cuenta en los dos destinos y una sola vez en el viaje: días del viaje = la suma de los días de cada destino − (número de destinos − 1).
- La llamada del esqueleto (la que reparte los días entre ciudades, con city_transitions y phase_transitions) reparte así: cada cambio cae en un día que es el último del destino de antes y el primero del siguiente. Ajusta su prompt y cómo se leen sus días.
- Las noches: cada destino, sus días menos uno (la noche del día de cambio ya se duerme en el siguiente). El último destino, como ahora (el último día se vuelve a casa).
- Sin fechas: «Roma · 3 días», «Florencia · 5 días» y el viaje, «7 días».
- Dime en el informe si hoy el viajero puede cambiar cuántos días pasa en cada destino, y cómo. No lo cambies en esta tanda.

2. CADA DESTINO, SU MOTOR
- Cada destino se monta solo, como si fuera un viaje de un destino:
  - si tiene días escritos (hoy solo Roma, data/dias/roma): con nuestro motor de días escritos y sus listas (llegada, días y vuelta);
  - si no: con el generador de ahora, pero solo para ese destino y sus días.
- Roma dentro de un viaje de varios destinos sale igual que Roma sola, con los mismos días y las mismas horas de llegada y salida. Es lo que más importa: pruébalo (punto 6).
- El día de llegada a un destino, como nuestro día de llegada (el D0 de Roma), desde la hora de llegada de su tramo. El día de salida, como nuestro día de vuelta, hasta la hora de salida. Las horas solo eligen la fila (mañana, tarde, noche), como las reservas: sin cuentas al minuto (regla 17).
- En la gratis (sin llegada y vuelta): el día de cambio, por defecto, el destino de antes por la mañana y el siguiente por la tarde.

3. EL TRAMO DE EN MEDIO, UNA SOLA VEZ
- Cada cambio de destino es un tramo: «Tren Roma → Florencia» (o vuelo, autobús, coche: lo que diga el esqueleto o elija el viajero, con las alternativas de ahora).
- En RESERVAS (de pago, en «Llegada y vuelta»): la llegada al primer destino, cada tramo de en medio y la vuelta, en orden. Cada uno, con su hora de salida y de llegada y su precio opcional (al presupuesto, con la pastilla).
- Se apunta una sola vez: con la salida acaba el destino de antes, y con la llegada empieza el siguiente.
- En «x de 3 listo», «Llegada y vuelta» está lista cuando lo están todos sus tramos.

4. CADA DESTINO, LO SUYO
- RESERVAS:
  - el alojamiento, las entradas y el Free Tour, y las excursiones, por destino («Excursiones desde Roma», «Excursiones desde Florencia»);
  - una sola vez por viaje: el seguro, la tarjeta y el coche;
  - la eSIM, una por país (como ya está).
- RUTA:
  - una tarjeta por destino con sus días y sus fechas («Roma · 3 días · 13 – 15 oct»), su bombilla si tiene tips y la varita;
  - entre dos tarjetas, el tramo: «Roma → Florencia · mié 15», con su icono (tren, avión…), en vez de solo la distancia.
- DÍAS: los días de cada destino, bajo el nombre de su destino. La fecha de cambio sale en los dos: «mié 15 · hasta que te vas» en Roma y «mié 15 · desde que llegas» en Florencia (si el viajero puso la hora del tramo, esa hora; nunca una calculada).
- HOY (de pago): el día de cambio, las dos partes seguidas: primero la del destino de antes, luego el tramo como una parada más (con [Cómo llegar] a la estación o al aeropuerto) y luego la del siguiente.
- La tarjeta oscura de RESERVAS: antes, «Tu viaje a Roma y Florencia empieza en…»; durante, «Estás en Florencia · día 4 de 7».
- El tiempo, los tips y el horario de las tarjetas: los de cada destino.
- Las fotos, sin preguntar nada: cada foto es del destino de su parada; las sueltas de HOY, del destino de la siguiente parada por visitar (si ya está todo visto, del de la última).
- El globo del Perfil:
  - una chincheta por destino;
  - una chincheta pequeña por cada excursión de un día (Pisa desde Florencia);
  - al tocar una chincheta, el álbum solo de ese sitio, con [Ver todo el viaje] arriba.
- El presupuesto: uno por viaje, con todo sumado y por bloques, como ahora. No se parte por destino.

5. LO QUE NO CAMBIA
- Un viaje solo a Roma sale exactamente igual que ahora.
- Nada de días escritos nuevos.
- Las reglas de siempre: la app avisa y nunca prohíbe, sin horas calculadas a la vista y sin nombres de empresas en los textos.

6. PRUEBAS
- Las de siempre a 0 fallos (incluida la de listas con las 365 fechas de Roma).
- Una prueba 6z7:
  - Roma dentro de un viaje (Florencia → Roma, Roma → Florencia y Florencia → Roma → Nápoles) da los mismos días que Roma sola con las mismas horas, en 20 fechas distintas;
  - las cuentas: días del viaje = suma − (destinos − 1), y las noches de cada destino;
  - cada tramo se pide una vez; con la salida acaba el destino de antes y con la llegada empieza el siguiente;
  - RESERVAS por destino; el seguro, la tarjeta y el coche, una vez; la eSIM, una por país;
  - las fotos, en el destino correcto; una chincheta por destino y una por excursión de un día;
  - en la gratis, el día de cambio con la mañana y la tarde por defecto;
  - un destino de un solo día en medio (Florencia → Pisa 1 día → Roma): ese día sale con sus tres partes, sin romper nada.
- A mano, a 375 px, con el panel de pruebas, en la gratis y en la de pago:
  - Florencia → Pisa → Roma;
  - Roma → Florencia, con una excursión a Pisa desde Florencia;
  - y en cada uno: RUTA con los tramos, DÍAS con la fecha de cambio en los dos destinos, HOY el día de cambio, RESERVAS por destino y el globo con sus chinchetas.
- Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Es una tanda grande: antes de tocar el motor, escribe en PROGRESO de la 6z7 un plan corto en palabras sencillas (qué piezas vas a tocar y en qué orden) y ve por bloques, con la prueba de Roma sola pasando en cada bloque. Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z7 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
