# Informe de la Tanda 6t

## Qué hay ahora

- **La barra de llegada y de vuelta** de DÍAS es la del diseño «1b · Línea y pase azul». De pago y sin hora: «LLEGADA · DESDE BARCELONA», «Añade tu vuelo y ajustamos tu día» y [+ Vuelo] (lleva a RESERVAS). Con la hora del viajero: «LLEGADA · FIUMICINO», «Cómo llegar desde Fiumicino» y la pastilla «✓ 11:20». Gratis: «Cómo llegar a Roma» y solo la flecha. Coche: «LLEGADA · EN COCHE» y «La ZTL y dónde aparcar».
- **La ventana** ya no enseña fuentes ni «Tu primera parada», y tiene la pestaña **Traslados** (Fiumicino, Ciampino y Civitavecchia) con una tarjeta por punto y el botón [Reservar traslado], que abre el enlace en otra pestaña con el aviso «Abriendo la tienda de traslados…». El enlace lleva el código de afiliado (`aid=5206`) y la campaña del viaje (`cmp=app-…`), comprobado en el navegador.
- **Ninguna hora que calcule la app** (regla 487): fuera «En el centro», «libre hacia», «Sal a las», y la tabla «Libre hasta / Maleta a las / Sal a las».
- **La fila de alojamiento del día 1** tiene el aspecto nuevo.

## Capturas (375 px)

- De pago, sin hora: `docs/dias/img/6t-barra-pago-sin-hora-375.jpg`
- De pago, con hora: `docs/dias/img/6t-barra-pago-con-hora-375.jpg`
- Vuelta de pago con hora: `docs/dias/img/6t-vuelta-pago-375.jpg`
- Gratis: `docs/dias/img/6t-barra-gratis-375.jpg`
- Pestaña Traslados con el aviso: `docs/dias/img/6t-traslados-375.jpg`

## Pruebas (todas a 0 fallos)

| Prueba | Resultado |
|---|---|
| 6g (4.526 viajes) · 6h (6.570) · 6i (689 días) · 6j (884) · 6k (4.483) · 6l (300) | 0 fallos |
| 6o | 0 fallos |
| 6r (3.289 viajes, 14.454 días) | 0 fallos |
| 6s (2.311 comprobaciones) | 0 fallos |
| **6t (nueva, 1.056 comprobaciones, 104 ventanas)** | **0 fallos** |
| pruebaListas, 1 de cada 5 fechas, 1 a 6 días (37.157 viajes) | 0 fallos |
| Typecheck (`tsc -p tsconfig.app.json`) | limpio |

**Qué mira la 6t.** Pinta con el código de la app la barra, la ventana y RESERVAS en los cinco medios, a la llegada y a la vuelta, con y sin hora, con y sin punto elegido, gratis y de pago. Da fallo si sale «Fuente» o «Tu primera parada»; si sale una hora que calcula la app (en la barra, en la ventana o en RESERVAS); si «Traslados» sale fuera de Fiumicino, Ciampino y Civitavecchia (o en tren, autobús o coche) o no sale donde debe; si en la gratis sale «Añadir» o «+ Vuelo»; si con hora la barra dice «Añade tu…» o lleva el botón; si los textos de la barra no son los del encargo; si quedan datos con `privado`, un traslado con «#» o con algo más que el enlace; si sale «Roma» escrito en el código de la ventana o de las reglas; o el nombre de un proveedor.

## A mano en el navegador (375 px)

- De pago: barra sin hora, con hora (llegada y vuelta), ventana con las tres pestañas, Traslados de Fiumicino y de Ciampino, vuelta con «Ver Fiumicino», barco sin punto elegido (Traslados de Civitavecchia), tren (sin Traslados), coche (sin Traslados), el botón [Reservar traslado] con su aviso y su enlace.
- Gratis: barra con la flecha, ventana sin fila de reserva.
- **No** lo hice a mano en el ordenador ni con el autobús (solo con la prueba).

## Lo que tienes que decidir

Las búsquedas de traslado de Ciampino y de Civitavecchia devuelven resultados que no tienen nada que ver (ver `PREGUNTAS_TANDA6T.md`, punto 1). Lo dejé como pediste; con tus enlaces directos se arregla solo.
