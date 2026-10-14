# Informe: «Reorganizar» y las listas nuevas de llegada y vuelta (Tanda 7)

## Qué pasaba

La Tanda 7 añadió a `data/dias/roma/listas.json` veinte listas que solo sirven a la llegada y a la vuelta (`D1-rapido`, `D1-rapido-invierno-10/11`, `D1-tarde`, `D1-centro-*`, `D1-anochecer-*`, `D1-noche`, `D1-noche-sin-cena`, `D1-sin-ruta`, `D1-vaticano`, `DC-vaticano`, `DC-roma-antigua`, `DC-pincio-popolo`, `DC-aventino`, `DC-cupula`, `DV-traslado`).

«Reorganizar este día» (`construirCatalogo` en `shared/routeEngine/reorganizarDia.js`) recorría TODOS los días escritos como si fueran días de ruta. Reconocía los sitios del viajero (Museos, Coliseo…) como `D1-vaticano` («D1+Vaticano, 2 noches con llegada tarde», una lista que solo existe para una llegada tarde), respetaba su orden y dejaba los Museos reservados a las 9:00 en la tarde. Por eso fallaban `pruebaFase6y2_reorganizar` (3 de 782) y `pruebaFase6y_reorganizar` (4).

La regla de Eric: una reserva mantiene su hora. Esas listas las elige el motor por las tablas `llegadas` de `listas.json`; no son días de ruta candidatos a reconocer, ordenar ni repartir.

## Quién más recorre los días escritos

Revisado todo `shared/routeEngine/*.js`, `server/engine/*.js`, `server/index.js` y `src/lib/*.ts`. Solo UN sitio los recorre todos como candidatos de ruta: `construirCatalogo` de Reorganizar. Los demás no lo hacen o lo hacen por una buena razón:

- `listasTrip.js` (lugaresDocumento, fueraDelDocumento): leen todo el documento para saber qué sitios son «conocidos» y cuánto se tarda en verlos por fuera. Es un dato del documento, no un reparto de días; las listas de llegada y vuelta también cuentan. Se dejan.
- `listasOrden.js` / `ordenarDias`: trabajan con los ids que ya eligió el esqueleto (`chosen`). No recorren el resto.
- `vueltaDia.js` (`diasDelSitio`): busca a propósito TODAS las listas que llevan la visita de un sitio grande (también las versiones del día 1). Se deja.
- `llegadaDia1.js`, `reservationPlan.js`, `writtenDays.js`: leen una lista por su id.
- Sugerencias, pool, fichas, `/api/destination-excursions`: leen `destino.pool`, `sugerencias` de un día concreto o los ficheros del destino, no la lista de días.

## La marca (en los datos)

- Cada lista de llegada o vuelta lleva en `listas.json` el campo `solo_llegada_o_vuelta: true`.
- La pone el convertidor (`scripts/destino/listasConvertir.mjs`) por el documento: toda lista cuyo encabezado cuelga del `## Llegadas y vueltas` de `docs/dias/DIAS_ROMA_PARADAS.md`. No hay ningún nombre de lista escrito en el código para esto (la regla es el encabezado). Un destino sin ese encabezado no marca nada y se porta como hoy.
- Una sola función lee la marca: `esDiaDeRuta(dia)` en `shared/routeEngine/listasDia.js`. `construirCatalogo` la usa y salta esas listas.
- `docs/dias/DIAS_ROMA_PARADAS.md` NO se ha tocado.

## Qué cambia

| Fichero | Cambio |
|---|---|
| `scripts/destino/listasConvertir.mjs` | Detecta el encabezado «Llegadas y vueltas» y marca esas listas (0 dudas) |
| `data/dias/roma/listas.json` | Regenerado: solo añade `solo_llegada_o_vuelta: true` a las 20 listas; nada más cambia |
| `shared/routeEngine/listasDia.js` | Nueva `esDiaDeRuta` |
| `shared/routeEngine/reorganizarDia.js` | `construirCatalogo` salta las listas que no son de ruta |
| `scripts/destino/pruebaTanda7_reorganizar.mjs` | Prueba nueva (71 comprobaciones) |
| `docs/dias/GUIA_NUEVOS_DESTINOS.md` | Una frase sobre cómo se marcan |

La prueba nueva comprueba: que las marcadas son exactamente las del documento bajo «Llegadas y vueltas» y que D0, D1…D7 y los medios días no lo están; que las tablas de llegada y vuelta siguen apuntando a listas que existen; que con los Museos reservados a las 9:00 Reorganizar los deja los primeros, con y sin las listas de llegada y vuelta presentes, con el mismo orden y sin añadir ni quitar paradas; y que quitando la marca se reproduce el fallo de origen.

## Resultados

Ver el resumen final del agente (pruebas pasadas).
