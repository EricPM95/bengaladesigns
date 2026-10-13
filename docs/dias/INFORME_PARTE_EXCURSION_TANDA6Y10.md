# Tanda 6y10 · Parte E: añadir una excursión con los días llenos

## Qué cambió

En EXPLORAR › Excursiones › [+ Añadir], si la excursión no cabe en ningún día, sale lo de siempre («Ningún día libre para esto», con los días en gris). **Debajo** salen dos opciones más, con los mismos botones, hojas y colores de ahora. Solo salen cuando no cabe: con un día vacío, o al añadir un lugar, no salen.

1. **[Añadir en un día nuevo].** El viaje gana un día al final con la excursión. La duración sube uno y, con fechas, la fecha de vuelta pasa al día siguiente (el viaje de 15–20 oct pasa a 15–21 oct). **No sale ningún aviso propio**: ni «Tienes más días que fechas» (ya no sobran días), ni otro. Si la vuelta de RESERVAS ya no cuadra, se queda para el aviso de siempre de la campana. Sin fechas, solo sube la duración. Con 14 días el botón sale apagado («Máximo 14 días»).
2. **[Cambiar un día por la excursión].** Una hoja «¿Qué día cambiamos?» con la lista de días, cada uno con su título (el mismo que en DÍAS):
   - los que llevan imprescindibles, **marcados** con la pastilla «Imprescindibles» y sus nombres;
   - arriba, **«Recomendado · se pierde lo menos»**, el que menos se pierde;
   - un día con una reserva del viajero (entrada, Free Tour o excursión) sale **en gris**, con «Tienes una reserva este día», y no se puede elegir;
   - nunca el día de llegada, el último ni uno que ya es una excursión de día entero (la regla de siempre de las excursiones).
   - Antes de cambiar, el **«¿Estás seguro?» de siempre** (el mismo diálogo, [Cancelar] y [Cambiar]), que nombra lo que se pierde: «Viernes 16 pasará a ser «Excursión a Pompeya y Sorrento». Se pierde lo que tienes ese día: …». Los imprescindibles van primero y todos por su nombre; después, cuatro nombres más y «y N más».

Las dos opciones dejan abajo el aviso corto con **[Deshacer]** y abren en Días el día que cambió.

## Cómo se calcula «el que menos se pierde»

Para cada día que se puede cambiar se mira qué paradas se irían de verdad (se prueba el cambio sobre una copia y se comparan las paradas: una excursión de medio día solo quita las de la mañana). Cada parada pesa según el dato del destino:

- **imprescindible**: sitio de nivel 1 con `tier` «joya» o «imprescindible»;
- **nivel 1**: el resto de nivel 1;
- **las demás**: cualquier otra (también un sitio que el viajero buscó por su cuenta).

Se compara por este orden y gana el menor: 1) cuántos imprescindibles pierde, 2) cuántos de nivel 1, 3) cuántas paradas más. Si empatan, el primero de la lista (el orden de siempre). Los descansos y huecos libres no cuentan. Un día con reserva nunca es el recomendado.

Vale para todos los destinos: el servidor da `importancia_por_sitio` (nuevo, en `/api/destination-excursions`, calculado de `level` y `tier` de los datos del destino en `shared/routeEngine/importanciaDeSitios.js`). No hay ningún nombre de sitio escrito en el código. Un destino sin esos datos funciona igual: todo cuenta como «paradas más» y gana el día con menos paradas.

## Cómo funciona Deshacer

Es la pieza de siempre (`quitarConDeshacer`), que ahora comparte código con una función nueva, `cambiarConDeshacer`, para los cambios que no quitan reservas. Antes del cambio guarda la ruta entera (días, fechas, vuelta) y todo lo reservado (entradas, excursiones, alojamiento, transporte, seguro, eSIM, tarjeta y coche). Al pulsar [Deshacer] lo devuelve tal cual: la prueba compara el viaje antes y después y tiene que ser idéntico, con y sin fechas. Si el cambio no se pudo hacer (por ejemplo 14 días), no queda ningún [Deshacer].

## Ficheros

- Nuevos: `src/lib/excursionSinHueco.ts` (la lógica pura), `src/components/route/excursions/ExcursionSinHueco.tsx` (las dos opciones y la hoja), `src/store/excursionSinHuecoActions.ts` (las dos acciones con Deshacer), `shared/routeEngine/importanciaDeSitios.js`, `scripts/destino/pruebaFase6y10_excursion.mjs` y `_6y10_excursion_entrada.tsx`.
- Tocados: `AddToDaySheet.tsx` (pinta las opciones debajo del «no cabe»), `ConfirmDialog.tsx` (opción `alto`, para ir por encima de otra hoja), `freeDays.ts` y `useRouteStore.ts` (`extendTrip` al poner la excursión en un día nuevo), `useAddFlowStore.ts` (`cambiarConDeshacer`, `openDayAfterExcursion`), `destinationExcursions.ts` y `server/index.js` (el dato `importancia_por_sitio`).

## Pruebas

- Nueva `pruebaFase6y10_excursion.mjs`: 103 comprobaciones, 0 fallos. Cubre: las dos opciones solo cuando no cabe; día nuevo (días +1, duración +1, vuelta al día siguiente, sin aviso propio, reservas y transporte sin tocar, Deshacer idéntico, con y sin fechas, tope de 14); cambiar un día (títulos, imprescindibles marcados, recomendado con el orden imprescindible > nivel 1 > resto, empate, día con reserva en gris y no elegible, texto del «¿Estás seguro?», medio día, Deshacer idéntico); dos destinos de mentira con otros datos; y el código sin destinos fijos, sin empresas, sin emojis ni colores a mano.
- En serie, 0 fallos: pruebaFase6y2_* (formulario, fotos, reorganizar, reservas), 6y3_*, 6y4_* (todas), 6y5_pantallas, 6y6_cierre, 6y7_pantallas, 6y7_titulos, 6y9_pantallas, 6y9_fichas, 6y_manual, 6y_reorganizar, pruebaCorr6z6 (y sus tres partes), pruebaTanda6z3 (sin emojis en src) y 6z3_dias. Typecheck `npx tsc --noEmit -p tsconfig.app.json` limpio. No se lanzaron las 365 fechas.

## Lo que se vio a 375 px (Chrome del equipo, Supabase bloqueado)

Viaje a Roma de 6 días (15–20 oct), con una entrada reservada el sábado 17. Capturas en `docs/dias/img/`:

- `6y10-excursion-3-no-cabe.jpg`: el «no cabe» de siempre y las dos opciones debajo.
- `6y10-excursion-4-lista-cambiar.jpg`: la lista con el recomendado arriba, un día en gris («Tienes una reserva este día») y otro con «Imprescindibles» marcado.
- `6y10-excursion-5-seguro.jpg`: el «¿Estás seguro?» nombrando lo que se pierde.
- `6y10-excursion-6-resultado.jpg` y `-7-deshecho.jpg`: el día ya es la excursión, con el aviso y [Deshacer]; tras [Deshacer], el día vuelve con sus 11 paradas.
- `6y10-excursion-8-dia-nuevo.jpg`: el día nuevo (mié 21), cabecera «15 – 21 oct» y aviso con [Deshacer]; `-10-dia-nuevo-deshecho.jpg`: tras [Deshacer], otra vez «15 – 20 oct» y los mismos días.
- `6y10-excursion-9-campana-sin-aviso-propio.jpg`: la campana con el día nuevo no tiene aviso propio. (El único aviso que sale, «Cambios sin guardar», es porque en la prueba se bloquea el guardado en la nube.)

**Lo que no se pudo ver**: el recomendado con un día de nivel 1 «sin imprescindibles pero con sitios de nivel 1» (Roma no tiene ninguno: todo su nivel 1 es imprescindible), lo cubre la prueba con destinos de mentira. Tampoco el día 4 con su interruptor [Roma | Excursión] (el viaje de la prueba lo trae ya en modo excursión, así que no se ofrece). Y el aviso de la vuelta de RESERVAS: no existe un aviso propio de «la fecha de vuelta ya no cuadra con tu vuelo» (ver preguntas).

## Decidido por Code

1. «Imprescindible» = nivel 1 con `tier` «joya» o «imprescindible» (la joya pesa lo mismo, el motor la protege aún más).
2. El día se cambia con las reglas de siempre de las excursiones: nunca llegada, último día ni uno que ya es excursión de día entero. «Un día con reserva» es cualquier entrada, Free Tour o excursión reservada ese día.
3. «Día nuevo» se pone detrás del último día de ruta (delante del día de vuelta si existe), como el resto de días nuevos y como ya hacía «¿Dónde la ponemos?». La fecha de vuelta y la duración suben uno.
4. El aviso de abajo es corto para que quepa entero en el móvil («Día cambiado por la excursión», «Excursión añadida en un día nuevo»).
5. En el «¿Estás seguro?» se nombran todos los imprescindibles y cuatro paradas más; el resto se cuenta.

## Preguntas abiertas

1. **La vuelta en los viajes sin día de vuelta aparte** (como los de Roma): el último día lleva el bloque «Vuelta · a Madrid». Con «Añadir en un día nuevo» la excursión pasa a ser el último día y recibe ese bloque (el día que era el último pasa a ser un día normal). ¿Prefieres que el día nuevo se ponga **antes** del último, para que la excursión nunca caiga el día de la vuelta (la vuelta pasa igual al día siguiente)? Cambia las fechas de lo que haya reservado en el último día.
2. **El aviso de la vuelta.** Hoy no existe ningún aviso de la campana que diga que la fecha de la vuelta (RESERVAS) ya no cuadra con tu vuelo. Si el viajero ya tenía billete de vuelta, al mover la fecha nadie le avisa. ¿Lo creamos (fuera de esta parte), o con el aviso de siempre «Tienes más días que fechas» basta?
3. **Un día ya excursión.** Hoy no se ofrece cambiar un día que ya es una excursión de día entero. ¿Quieres poder cambiarla por otra desde aquí?
4. **Reserva en gris.** Ahora cuenta cualquier reserva (también una entrada pequeña). ¿Solo las grandes o las excursiones?
