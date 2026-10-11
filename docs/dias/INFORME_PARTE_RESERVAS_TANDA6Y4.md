# Tanda 6y4, parte RESERVAS

Cubre del punto 0 las preguntas 2, 5, 6, 7 y 8, y la Fontana de Trevi del punto 5 (sin la parte de la ficha). Todo en palabras sencillas. Sin push.

## Lo hecho

### Pregunta 2: la foto del Free Tour es la de la Plaza de España
- Un solo sitio: en los datos de Roma (`data/pipeline_v2/roma.json`), el Free Tour decía `photo_from: "Piazza Navona"`; ahora dice `"Plaza de España"`. De ahí lo leen las tres cosas: la ruta nuestra (el motor), el Free Tour de la ruta a mano (`pedirFotoDelFreeTour`) y su fila en EXPLORAR (el servidor). No hizo falta tocar nada más en el código (solo comentarios).
- Qué foto sirve el servidor para la Plaza de España: **propia** (`dia_plaza_de_espana.jpg`), sin crédito (esa foto no lleva autor en `_fotos.json`; si algún día lo lleva, la ficha ya lo pinta). No es de Unsplash ni de Wikipedia.
- Una sola petición por parada, como antes. También vale en la ruta nuestra.
- Ojo, nada que ver con mi trabajo pero lo vi: al probar con PowerShell (que manda mal los acentos) el servidor devolvió una foto de Wikipedia equivocada guardada en la caché de fotos (un cantante) para un nombre mal escrito. Con el nombre bien escrito sale la foto propia. No hice nada, solo lo cuento.

### Pregunta 5: acortar con una excursión reservada en los días que se quitan
- Los días con una excursión reservada se quitan igual que los demás. Ya **nunca quedan días de más** (la prueba lo comprueba con más de 500 combinaciones de días, excursiones reservadas y duración nueva).
- El «¿Estás seguro?» las nombra: «Se quitarán el vie 12 y el sáb 13, con sus paradas, tu entrada al Coliseo del vie 12 y tu excursión a Pompeya y Sorrento.»
  - La entrada lleva su día («del vie 12»; sin fechas, «del día 3»). La excursión va sin día, salvo que se quiten dos o más excursiones (entonces con día, para distinguirlas). Esto último lo decidí yo.
  - «con sus paradas» solo sale si algún día lleva paradas o comida elegida. Un día que solo lleva una excursión reservada no dice «paradas»: dice la excursión.
- Dónde: `planManualResize` (ya sin días «fijados»), `manualRemovalText` y `manualShrinkNotice` en `src/lib/manualDuration.ts`; la ventana (`ManualShrinkDialog`) solo enseña ese texto.
- «Cancelar» no cambia nada. Quitada la frase vieja «Tus reservas de esos días se quedan en RESERVAS» y la de «se queda, porque tiene una excursión reservada».

### Pregunta 6: sin [Deshacer] tras acortar
- No hay. Basta el «¿Estás seguro?». La prueba comprueba que, después de acortar, no queda ningún aviso con «Deshacer» y que la ventana no usa esa función.

### Pregunta 7: las reservas de los días quitados se van con su día
- Al confirmar, `setRouteDateRange` (en el almacén) quita también las reservas de esos días. El presupuesto se calcula de las reservas, así que su precio desaparece de él solo (la prueba lo mira). Los avisos de la campana de esas reservas también se van.
- Qué pasa con cada tipo cuando se quita un día (decidido por mí, dime si no):
  - **Entrada reservada (Coliseo, Panteón…)**: se va con su día, con su precio.
  - **Free Tour reservado**: se va con su día (su parada ya se va con el día).
  - **Excursión reservada**: se va con su día (y el día de excursión también).
  - **Billete de transporte de ese día** (el que se apunta por día en RESERVAS): se va con su día.
  - **Alojamiento**: el hotel es de TODA la estancia, no de un día, así que se queda con su precio. Solo si se quita el primer día de la estancia, pasa a ser el de su nuevo primer día; se borra solo si desaparece la estancia entera. (En Roma, un solo destino, casi nunca se nota.)
  - **Lo que no es de un día**: seguro, eSIM, tarjeta, coche de alquiler, vuelo de ida y de vuelta y gastos extras no se tocan.
- No se queda nada suelto en RESERVAS por un día quitado.

### Pregunta 8: [Deshacer] al quitar cualquier reserva
- Una sola función, `quitarConDeshacer(mensaje, cambio)` en `src/store/useAddFlowStore.ts`. Hace el cambio y deja el aviso corto de abajo con [Deshacer]. «Deshacer» devuelve la ruta **y todo lo reservado** tal cual (entradas, excursiones, alojamientos, billetes, seguro, tarjeta, coche, eSIM y sus precios). Antes solo devolvía la ruta y las reservas.
- `removeReservationWithUndo` (entrada, Free Tour y excursión) ahora pasa por ella, con su mensaje: «Entrada quitada del viaje», «Excursión quitada del viaje», «Free Tour quitado del viaje».
- Sitios revisados y cambiados (antes quitaban sin aviso): excursión reservada en su tarjeta («Quitar del viaje», `ReservedMarks.tsx`), seguro (`InsuranceRow.tsx`), coche/camper de alquiler (`RentalVehicleRow.tsx` y `VehicleBlock.tsx`), billete de transporte (`TransportRow.tsx`), alojamiento (hoja «Tu alojamiento» en `AlojamientoHost.tsx` y «Eliminar» en `AlojamientoReservas.tsx`), vuelo de ida o de vuelta (`LlegadaYVuelta.tsx`), «Quitar del viaje» de una venta cancelada (`SaleCards.tsx`) y las tarjetas de «Útil para el viaje»: seguro, eSIM, tarjeta y alquiler (`UtilParaElViaje.tsx`). Ya iban bien: `StopMenu.tsx` y `AddReservationSheet.tsx`.
- La prueba recorre todo `src/components` y da fallo si algún sitio quita una reserva sin pasar por esa función. Única excepción a propósito: `dayInterruptor.ts` (cambiar la excursión de un día quita la anterior para poner la nueva; no es «quitar»).
- Los gastos extras del presupuesto no son una reserva y no los he tocado (son de la parte del presupuesto).

### Punto 5: fuera la Fontana de Trevi de las entradas
- Una sola regla, en el servidor (`/api/destination-excursions`): un sitio con `entrada_de_pago` en los datos (hoy solo la Fontana: la tasa que se paga allí) **no tiene entrada que se compre**. Por eso ya no sale en las entradas por sitio (pestaña «Entradas», pestañita de la tarjeta, «Reservar entrada») ni se aceptaría en la lista de «Entradas y Free Tour».
- «Entradas y Free Tour» de RESERVAS, «x de n listo» y el filtro «Entradas» de EXPLORAR ya no la contaban por la lista del destino; la prueba lo confirma con una ruta que lleva la Fontana (sale «0 de 2 reservadas», Coliseo y Panteón).
- No he borrado nada: su ficha, `entrada_de_pago` y su fila de `_entradas.json` siguen. Esa fila ya no llega a la app; **la ficha nueva (otro agente) debe leer el bloque «No necesitas entrada» de `entrada_de_pago`, no de las entradas por sitio**.

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y4_reservas.mjs` (+ `_6y4_reservas_entrada.tsx`): **117 comprobaciones, 0 fallos**. Cubre: el texto exacto del «¿Estás seguro?» con entrada y excursión; que se quitan con su día y salen del presupuesto; «Cancelar» sin cambios; más de 500 combinaciones sin días de más ni reservas sueltas; sin «Deshacer» tras acortar; hotel y billete de un día quitado; [Deshacer] devuelve todo idéntico para 11 tipos (entrada, excursión, Free Tour, alojamiento, transporte, vuelo de ida, vuelo de vuelta, seguro, eSIM, tarjeta, coche) y en la ruta nuestra; ningún sitio quita sin la función; la foto del Free Tour (datos, servidor, ruta a mano, ruta nuestra); la Fontana fuera de todo y su ficha y datos vivos.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio.
- Existentes, contra mi servidor (puerto 8813), a 0 fallos: 6y2 reservas (128), 6y2 formulario (60), 6y manual (1706), 6y formulario (459), 6v (82), 6s (2511), 6u (1884 viajes), 6z5 (119), 6z6 (las cuatro partes), Corr6z6 (las tres partes), 6z6f (22).
- **Ajustes a pruebas existentes (solo por mi trabajo):**
  - `pruebaFase6y3_formulario.mjs`: la parte 2g comprobaba lo contrario («las reservas se quedan en RESERVAS» y «una excursión reservada fija su día»); ahora comprueba lo nuevo. Y la comprobación del código de la ventana, que ahora pasa también los nombres cortos.
  - `pruebaFase6y3_reservas.mjs`: «quitar otra reserva no deja aviso» pasa a «deja “Entrada quitada del viaje”»; la foto del Free Tour ahora es la de la Plaza de España (foto propia, ruta local `/fotos/...`).
- Correr `pruebaTanda6v` y `pruebaTanda6s` reescribe `docs/dias/PRUEBA_TANDA6V.md` y `PRUEBA_TANDA6S.md`; los dejé como estaban.

## No pude hacer / no verifiqué
- **Visual a 375 px** (sin navegador): falta mirar el «¿Estás seguro?» con el texto largo (varias cosas nombradas), el aviso corto con [Deshacer] tras quitar cada tipo de reserva (sobre todo si sale mientras una hoja está cerrándose: el aviso es un portal a `z-95`) y que "Quitar del viaje" de la excursión sigue pidiendo su ventana de confirmación antes.
- Los clics no se ejecutan con un DOM real: la prueba llama a las mismas funciones que los botones y comprueba por código que cada botón pasa por ellas.
- Reiniciar el api-server del repo principal (cambió `server/index.js` y los datos de Roma). Mi servidor de prueba lo he parado.
- No toqué el selector del calendario ni la ficha de lugar (otros agentes). Si la ficha nueva sigue leyendo `entradas_por_sitio` para la Fontana, no encontrará nada: es lo pedido.

## Preguntas abiertas
1. El alojamiento (el hotel) se queda al acortar, porque es de toda la estancia. ¿Prefieres que se quite también si la estancia queda en menos noches? (Ahora el precio no se reparte por noches.)
2. Si el viajero cambia la fecha de inicio a la vez que acorta, las reservas siguen su fecha, no su día: una reserva puede acabar fuera de todos los días sin quitarse (esto ya pasaba). ¿Quieres que también se quiten las que quedan fuera de las fechas nuevas?
3. Cuando se quitan varias reservas a la vez, el texto del «¿Estás seguro?» las nombra todas; con 4 o 5 puede ser largo. ¿Lo dejamos así o lo recortamos a «y 3 reservas más»?
4. Los gastos extras del presupuesto («Quitar» un gasto) siguen sin [Deshacer]: no son una reserva y son de la parte del presupuesto. ¿Los incluimos?
