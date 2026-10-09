# Informe de la Tanda 6s

## Qué hay ahora

La pestaña RESERVAS es nueva, hecha con el diseño «Reservas v4», en dos versiones con un solo interruptor (`src/lib/pago.ts`, hoy encendido):

- **Versión de pago:** resumen «Tu viaje a Roma · n de 3 listo», «Llegada y vuelta» (tarjeta de embarque con la ida y la vuelta), Alojamiento con la pregunta de la zona, Entradas y Free Tour, Excursiones y Útil para el viaje.
- **Versión gratis** (`?version=gratis`): sin resumen, sin «Llegada y vuelta», y en Alojamiento solo «Buscar alojamiento en Roma» con el mapa. En DÍAS la barra de llegada y de vuelta no tiene «+ AÑADIR VUELO».
- Todo lo que se reserva se puede quitar, con confirmación dentro de «Cambiar». Quitar una reserva no mueve ningún día.

## Capturas

- Gratis, móvil 375: `docs/dias/img/6s-gratis-375.jpg`
- De pago, móvil 375: `docs/dias/img/6s-pago-375.jpg`
- De pago, escritorio (dos columnas): `docs/dias/img/6s-pago-escritorio.jpg` (la captura del navegador salió en cuatro teselas, pero se ve la rejilla)

## Pruebas (todas a 0 fallos)

| Prueba | Resultado |
|---|---|
| 6g (4.526 viajes) | 0 fallos |
| 6h (6.570 viajes, 26.732 parejas) | 0 fallos |
| 6i (689 días) | 0 fallos |
| 6j (884 viajes) | 0 fallos |
| 6k (4.483 viajes) | 0 fallos |
| 6l (300 viajes) | 0 fallos |
| 6o | 0 fallos |
| 6r (3.289 viajes, 14.454 días) | 0 fallos |
| pruebaListas, 1 de cada 5 fechas, 1-2 / 3 / 4 / 5-6 días (37.157 viajes) | 0 fallos |
| **6s (nueva, 2.311 comprobaciones)** | **0 fallos** |
| Typecheck (`tsc -p tsconfig.app.json`) | limpio |

**Qué mira la prueba 6s.** Pinta la pestaña RESERVAS con el código de verdad de la app (en el servidor, con los datos del destino que da el servidor de la app) para viajes de 1 a 6 días, con y sin fechas, en tres estados (vacío, a medias, todo hecho) y en las dos versiones, y en los cinco pares de medios (avión, tren, autobús, barco, coche). Da fallo si: sale algo de pago en la versión gratis; sale «null», «undefined» o «NaN»; los bloques no van en el orden del encargo; las entradas no siguen el orden de los datos del destino o no son justo las que están en la ruta; el bloque de excursiones sale (o no) contra los días del viaje; el interruptor del día 4 enseña dos «Añádela» o no enseña la tarjeta de su excursión; quitar una reserva cambia algún día; sale el nombre de un proveedor o «centro» suelto. Comprobado que da fallo cuando algo va mal: antes de arreglarlo avisó del hueco vacío de excursiones.

## Comprobado a mano en el navegador (375 px)

- De pago, con fechas: todo el panel; Llegada y vuelta (puntos, hora, ajuste de ruta, líneas «Ida · vie 16 · 11:15 · Fiumicino · libre hacia las 12:15», «Falta la vuelta», «✓ Listo», «Eliminar vuelo» con confirmación que borra hora y punto); Alojamiento (zonas, «Te alojas en Prati · Cambiar», «Aún no lo sé», mapa con las fechas); Entradas (orden, «Ver 2 más», Free Tour reservado y quitado); hoja de la hora (fichas de días con «Cerrado» el domingo, rueda, «Guardar · 10:00»); excursión (añadir con fechas y recogida, línea reservada, quitar: el día se queda).
- Gratis: panel, excursiones, barra de DÍAS sin el botón de añadir.
- Escritorio 1280: las dos columnas.

## Lo que NO comprobé a mano (solo con la prueba)

- 390 px y un viaje de varios destinos.
- Los medios tren, autobús, barco y coche en pantalla (sí en la prueba, con la ficha cerrada).
- Las mitades abiertas y la hoja de la hora de cada medio distinto del avión.

## Cambios de fondo que conviene saber

- `/api/destination-excursions` ahora da también el orden de las entradas, las zonas del alojamiento y el mapa. `/api/reservation-hours` acepta `dates` y devuelve los días cerrados.
- Reparé las expresiones regulares rotas de la 6m (las horas «con fechas» se calculaban sin la fecha).
- `fetchArrivalInfo` pasó a exportarse (la prueba lo usa); no cambia nada más.
- Reglas nuevas en `docs/INVARIANTES_PANTALLA.md`: 481 a 486.
- Preguntas: `PREGUNTAS_TANDA6S.md` (diez).
