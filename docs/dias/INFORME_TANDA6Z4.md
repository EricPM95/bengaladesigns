# Informe de la Tanda 6z4

## 1. Los fallos de la prueba de listas

**Lo que fallaba.** Eran 7 fallos en viajes de 2 días, 9 en los de 3 y 15 en los de 4. Todos con una reserva puesta a una hora en que ese sitio ya está cerrado ese día, y solo en tres fechas:
- **Viernes Santo (26 de marzo de 2027).** El Coliseo y el Foro cierran a las 14:00 (última entrada a las 13:00, por el Via Crucis de la noche) y San Pedro cierra a las 13:00. Un viajero que reserva el Coliseo a las 16:00 o los Museos a las 16:00 está reservando algo que ese día no abre a esa hora.
- **Nochevieja (31 de diciembre).** Los Museos Vaticanos cierran a las 15:00 y San Pedro cierra antes de lo normal. Una reserva de Museos a las 16:00 cae fuera.
- **No tiene nada que ver con el cambio de hora de finales de marzo ni de octubre.** Pasaba justo en esos días por el Viernes Santo y por Nochevieja, que son cierres especiales, no por el horario de verano o de invierno.

**Por qué pasaba.** Con una reserva, la app no quita ni acorta nada: lo que no cabe antes de la reserva se pasa detrás de ella. Cuando una parada de la mañana (el Foro, San Pedro) iba a llegar a un sitio ya cerrado, el motor iba empujando detrás de la reserva todo lo que llevaba delante, esperando que así llegara antes. Pero como la comida no empieza antes de las 12:30, aunque se quitara todo lo de delante seguía llegando tarde. El resultado era el peor posible: la mañana entera empujada a la tarde, el día empezando a las 12:30 y, aun así, el Foro cerrado y «por fuera».

**Cómo se arregló** (un solo sitio, `shared/routeEngine/listasTrip.js`). Antes de empujar nada, el motor mira si quitar todo lo de delante arregla la llegada. Si no la arregla, no empuja la mañana: pone esa parada **la primera del día**, cuando todavía está abierta (el Foro a las 9:00, San Pedro a las 9:00), y lo deja apuntado en el registro («a su hora ya habría cerrado… va lo primero del día», regla 5, un cierre). El resto del día sigue en su sitio y el día empieza a las 9:00. Los dos fallos que pedías (el día empieza tarde, el Foro por fuera) desaparecen. La prueba entiende que una parada adelantada por un cierre no cuenta como cambio de orden, porque un cierre manda sobre el orden escrito.

**Resultado de la prueba de listas, con las fechas de los próximos 12 meses (del 11-oct-2026 al 10-oct-2027, las 365 fechas, sin saltarse ninguna)**
- 1 día: 0 fallos (58 s). 2 días: 0 fallos (251 s). 3 días: 0 fallos (400 s).
- 4, 5 y 6 días: ver al final de este informe.
- Tarda en total unos 15 minutos con las seis tandas en paralelo (una por número de días), así que se puede correr entera.

## 2. Los emojis que quedaban
Pasados a la familia de iconos de la 6z3 (`src/lib/iconos.ts`, 19 iconos nuevos: taxi, arte, playa, bienestar, nieve, bolsa, fiesta, estrella, destello, gema, copa, abeto, pizza, helado, bocadillo, flor, hoja, llave, familia). Dónde estaban:
- **Pines de los mapas:** el pin morado de llegada (avión, barco, tren: `arrivalIcon.ts`), los pines de excursión (`routeMapMarkers.ts`: la casa, el autobús, el alfiler), el alfiler de «Añadir parada», el cubierto de la hoja de comida y el pin «+». Los dos mapas (`StopsMapView` y `RouteOverviewMap`) ahora pintan el icono de la familia.
- **Cuestionarios viejos:** los tres de transporte (`BaseYExcursiones`, `Roadtrip`, `Urbano`: coche, furgoneta, portapapeles, taxi, llave, casa, mapa), `MultidestinoTrenOVuelo` (entradas), `TransportResolutionStep` (avión, coche, casa, obras), `CompanionSelector` (mochila, corazón, familia, fiesta), `DurationSelector` (calendario) y `PlaceSelector` (estrella).
- **Datos que se pintaban:** las experiencias, las categorías de lugares y de puntos de interés, y las estaciones del año.
- **Otros:** la lupa y el alfiler del Landing, el aviso de error, las estrellas de excursiones, el reloj del menú de parada. En el PDF y en los textos planos, el emoji pasa a una palabra («Transporte:», «Alojamiento:»).
- **Se quedan** el 🧪 de las pantallas de desarrollo y el ©.
- **Decisiones que tomó el agente (para ti):** el emoji que traía el JSON de cada excursión ya no se enseña (siempre sale la mochila, como pide la regla de la familia); la furgoneta usa el icono del coche y «Parques» el de explorar, porque no hay otros.
- Una nueva regla 8 en la prueba 6z3 falla si vuelve a aparecer un emoji.
