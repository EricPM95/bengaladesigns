# Borrador · textos propios de cada sitio de llegada y salida (Roma)

**No está subido a `_llegada.json`**: para revisar antes. Estado a 1-10-2026.
Todas las cifras de este borrador salen de entradas que ya están en `_llegada.json` con su fuente oficial y su fecha de comprobado (29 y 30-09-2026); no hay ninguna cifra nueva. Las que marco con ⚠ hay que comprobarlas en la web oficial antes de subir.

## 1. Qué hay hoy, sitio por sitio

| Sitio | Medio | Camino al centro (`al_centro`) | Camino de vuelta (`a_la_salida`) | Resumen propio (`por_que_*`) | Tips propios (`solo_en`) | «Sal antes» propio |
|---|---|---|---|---|---|---|
| Fiumicino (FCO) | avión | 5 opciones, con fuente | 3 | **No** (usa el del medio, que habla de Termini) | Sí, desde hoy: los dos del Leonardo (`solo_en: fco`) | 180 min (el del medio) |
| Ciampino (CIA) | avión | 5 opciones, con fuente | **2** (faltan los autobuses: ⚠) | **No** | **Ninguno** | 170 min (nuevo: antes salía igual que Fiumicino) |
| Roma Termini | tren | 2 | — (vuelta: andén en pantalla) | Sí | Sí (3) | 45 min |
| Roma Tiburtina (tren) | tren | 1 | 1 | Sí | Sí (los de Termini no salen) | 55 min (nuevo) |
| Autostazione Tiburtina (Tibus) | autobús | 1 | 1 | **No** (usa el del medio, que ya habla de Tibus) | 3, del medio | 55 min (nuevo) |
| Puerto de Civitavecchia | ferry | 3 | 0 (**falta**: usa los de ida) | **No** (el del medio) | 3, del medio | 120 + 110 min de trayecto |
| Puerto de Civitavecchia | crucero | 2 | 0 | **No** (el del medio) | 2, del medio | margen 30 + 110 min |

Lo que cambia en el código con este paso (no son textos nuevos):
- `leaveMinutesOf` lee `salir_antes_min` del punto antes que el del medio.
- Los tips con `solo_en` salen cuando ese punto está a la vista (antes: solo si todo lo que se veía era ese punto, y sin reserva se enseñan todos, así que los del Leonardo habrían desaparecido).
- Los dos tips del Leonardo («Los niños no pagan el Leonardo», «El Leonardo sale del fondo de Termini») ya no salen con Ciampino: allí no hay Leonardo.

## 2. Borrador de lo que falta

### Ciampino · resumen (`por_que_llegada`)
> Ciampino es el aeropuerto pequeño de Roma, a unos 15 km: el bus con el tren (Ciampino Airlink, 2,70 €) o un autobús directo a Termini te dejan en el centro en menos de una hora. No hay Leonardo Express: ese tren es solo de Fiumicino.

### Ciampino · resumen (`por_que_vuelta`)
> A Ciampino se llega en unos 40 min desde el centro, así que sales un poco más tarde que a Fiumicino. El Airlink sale de Termini (tren y, en la última parte, un bus corto) y el taxi oficial de dentro de las murallas va a tarifa fija.

### Ciampino · tips (borrador; con `solo_en: ["cia"]`)
1. **Aquí no hay Leonardo Express** · «Si buscas el tren del aeropuerto, ese es el de Fiumicino. Desde Ciampino, el bus con el tren (Airlink) o un autobús directo a Termini.» Fuente: la de Ciampino Airlink de `_llegada.json`.
2. **El taxi de Ciampino sale más barato** · «La tarifa fija a dentro de las murallas son 40 € (55 € desde Fiumicino), con suplementos incluidos.» Fuente: adr.it/pax-cia-taxi (29-09-2026).
3. ⚠ **Autobuses de vuelta** · añadir como opciones de `a_la_salida` Terravision y Rome Airport Bus desde Termini hacia Ciampino: hay que comprobar en terravision.eu y romeairportbus.it los horarios y el precio desde Termini (los de llegada ya están comprobados).

### Fiumicino · resumen propio (`por_que_llegada`)
> Desde Fiumicino lo más cómodo es el Leonardo Express: 32 min sin paradas hasta Termini por 14 €. Si te alojas cerca de Trastevere u Ostiense, el tren regional FL1 (8 €) te deja más cerca.

### Fiumicino · resumen propio (`por_que_vuelta`)
> El Leonardo Express sale de Termini cada 15 min y tarda 32 min; el último es a las 23:05. El taxi oficial a tarifa fija (55 €) solo si sales de dentro de las murallas.

### Tibus (autobús) · resumen
Hoy vale el del medio, que ya nombra Tibus y el metro B. Sin cambios.

### Puerto de Civitavecchia · resumen propio (ferry)
> El puerto está a unos 80 km de Roma. Desde los muelles, la lanzadera gratuita te lleva a la salida del puerto y de ahí a la estación (10-20 min andando); el tren regional (4,60 €) tarda entre 60 y 80 min a San Pietro, Ostiense o Termini.

### Puerto de Civitavecchia · camino de vuelta (`a_la_salida`, ferry y crucero)
⚠ **Falta del todo.** Hoy usa los de llegada al revés. Hay que comprobar: tren regional de Roma a Civitavecchia (horario y 4,60 €, Trenitalia), la lanzadera del puerto desde Largo della Pace hasta los muelles, y la hora de embarque de la naviera (la pone cada naviera: se pide en la reserva).

### Otros sitios que no tenemos (⚠, solo si el viajero puede llegar así)
- Estación de Roma Ostiense y San Pietro (trenes regionales de Civitavecchia): hoy solo salen dentro del tren de Civitavecchia.
- Roma Fiumicino por tren regional FL1: ya sale como opción de Fiumicino.

## 3. Qué sitios salen según el origen

Hoy sale el medio entero con todos sus puntos, y el medio sale o no según la factibilidad del formulario (`useTransportFeasibility`). **No hay filtro por origen dentro de un medio**: desde Barcelona, Fiumicino y Ciampino salen los dos aunque haya más vuelos a uno que a otro. Para filtrar por origen haría falta un dato nuevo por punto (qué orígenes tienen conexión directa) con fuente por cada aerolínea; no lo hay y no me lo invento. Dime si lo quieres.
