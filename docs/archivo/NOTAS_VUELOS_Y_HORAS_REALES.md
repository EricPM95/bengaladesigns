# Notas para el encargo de vuelos y del motor (3 de octubre de 2026)

Apuntado a petición del usuario, para cuando hagamos los vuelos. **Todavía no es un encargo para Code:** lo escribe Claude cuando toque.

## 1. Lo que falta para que funcione de verdad

- En las pruebas ya cabe todo: no se rompe ninguna hora fija y el Free Tour entra a cualquier hora.
- Lo que falta es que el **motor reciba las reservas y los vuelos**. Hoy la app no sabe que el viajero tiene el Coliseo a las 11:00, porque `fitDayToTrip` se hace en la pantalla.

## 2. Solo horas que existen

- **Sin API:** guardar en cada sitio con entrada las horas reales que se venden. La prueba solo usa esas horas: si el Vaticano vende hasta las 16:00, no se mide 16:15, 17:00 ni 18:00. Igual con el resto de sitios.
- **Con la API:** la app enseña solo las horas libres ese día. El viajero no puede elegir una hora que no existe, y no medimos casos imposibles.

## 3. Llegada y vuelta, pensando como un local

**Al llegar, un local cuenta:**
- salir del aeropuerto (la maleta y el control): media hora larga;
- el trayecto al centro: el de `_llegada.json` (Fiumicino, 60 min);
- dejar la maleta y ponerse cómodo: de 30 a 45 min. Si el alojamiento aún no deja entrar, la maleta va a la consigna.

**Lo nuevo** es la media hora de salir del aeropuerto. Hay que revisarla junto con lo que ya había decidido para los traslados (90 min en completo y alojamiento, 45 en completo y directo, 150 en tranquilo y alojamiento, 60 en tranquilo y directo).

**El día de llegada:**
- nada con entrada;
- la primera parada es la que está más cerca del alojamiento;
- según la hora a la que se está listo, más o menos:

| Aterriza | Listo en el centro | Qué hace |
|---|---|---|
| 10:00 | hacia las 12:15 | **Una sola parada** cerca (Trevi o el Panteón) y a comer hacia las 13:30 |
| 12:00 | hacia las 14:15 | **Directo a comer** (en Roma aún se come a esa hora) y la tarde normal |
| 15:00 | hacia las 17:15 | Paseo, atardecer y cena: la regla del medio día, todo por fuera |
| 20:00 | hacia las 22:15 | Cena cerca del alojamiento y, si queda a mano, Trevi iluminada |

**El día de vuelta,** al revés. En `_llegada.json` ya está que se sale 180 min antes de un vuelo:
- con un vuelo a las 13:00, se sale del centro a las 10:00;
- esa mañana es el desayuno y una parada cerca, con la maleta ya en la consigna.

**El medio día de 2,5 días** sigue la regla de 1 día: todo por fuera, salvo lo marcado en el pool.

## 4. El criterio

Usar la cabeza con el tiempo que le queda de verdad al viajero ese día, como un local:
- si le da para una parada antes de comer, una sola;
- si no le da, a comer directamente.

La hora sale de los datos de cada destino (traslado, consigna, hora de comer y de cenar), no de una regla fija para todos.
