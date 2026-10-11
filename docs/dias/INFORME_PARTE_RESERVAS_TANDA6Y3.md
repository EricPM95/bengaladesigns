# Tanda 6y3, parte RESERVAS (ruta a mano)

Cubre los puntos (a) a (d) del encargo. Todo en palabras sencillas.

## Lo hecho

### (a) El orden de «Añadir parada» en la ruta a mano (pregunta 1)
- El orden nuevo es este, y sin repetir nada:
  1. lo que más «me gusta» tiene **de verdad** (los números de `?prueba=1` solo se pintan, nunca ordenan; la regla ni los mira);
  2. los de **nivel 1**;
  3. los de **`pool_lista`**, en su orden, **sin los que ya salieron por el nivel 1**;
  4. el resto, con el orden de siempre (nivel, orden editorial, alfabético).
- Una sola regla en un solo sitio: `compareManualExplorer` en `src/lib/manualPlan.ts`. Tanto «Añadir parada» (`ManualAddStopsScreen`) como EXPLORAR en la ruta a mano la usan a través de `PlaceExplorerScreen`, que la llama una sola vez.
- Servidor: no hizo falta cambiar el dato. Ya mandaba `level` y `essential_rank` (puesto en `pool_lista`) por separado; solo he aclarado los comentarios. Ejemplo con datos reales de Roma: la Plaza de San Pedro llega con nivel 1 y sin puesto en la lista; Trastevere llega con su puesto en la lista y sin nivel 1; Piazza Navona llega con las dos cosas.
- Dentro del nivel 1 el orden es el de siempre (orden editorial), no el de `pool_lista`. Lo he decidido yo; ver preguntas.
- Efecto visible: antes salían primero Coliseo, Foro, Trastevere, Cúpula… (la lista a mano); ahora salen primero los 11 de nivel 1 (incluida la Plaza de San Pedro) y detrás los de la lista que no son de nivel 1 (Cúpula, Trastevere, Galería Borghese…).

### (b) Quitar la reserva del Free Tour a mano quita su parada (pregunta 10)
- En una ruta a mano, quitar la reserva del Free Tour **quita también su parada del día**. La parada de antes queda con su tramo por recalcular, como al quitar cualquier parada. Nada más cambia.
- Se avisa con el aviso corto de siempre abajo: «Free Tour quitado del viaje» con **[Deshacer]**. Deshacer devuelve la reserva **y** la parada, tal cual estaban.
- La ventana de «Quitarla de tu viaje no cancela tu reserva…» (menú de la parada) y la confirmación de «Eliminar reserva» (hoja de la reserva) siguen igual, antes del aviso.
- Dónde está: la regla vive en el almacén (`removeReservation` en `useRouteStore.ts`, con `withoutManualFreeTour` en `freeTourManual.ts`); el aviso con Deshacer, en `removeReservationWithUndo` (`useAddFlowStore.ts`), que usan los dos sitios donde el viajero quita una reserva de una parada (`StopMenu.tsx` y `AddReservationSheet.tsx`).
- Otras reservas se quitan como siempre (sin aviso, la parada se queda). En la ruta nuestra no cambia nada (la parada que pone el motor no se quita).
- Nota: las otras formas de quitar una reserva no tenían Deshacer antes, y siguen sin tenerlo. Solo el Free Tour a mano lo trae.

### (c) Botones del aviso: [Pasar al mié 15] y [Añadir al mié 15] (sin «lo»)
- Cambiados en un solo sitio (`reservaFueraDeDia.ts`). Sin fechas: «Pasar al día 2» / «Añadir al día 2». Vale para sitios masculinos y femeninos.
- Los textos de los avisos («Tu entrada al Coliseo es el…») no cambian (la prueba comprueba uno entero).
- Revisado: no queda ningún «Pasarlo» ni «Añadirlo» en `src/`, `server/`, `shared/` ni `scripts/` (lo comprueba la prueba nueva). Sí quedan en documentos antiguos de `docs/` (informes de tandas anteriores); no los he tocado.

### (d) Foto real del Free Tour a mano
- La parada nace **sin foto** (recuadro neutro, como toda parada añadida sin foto real; antes llevaba una de relleno de picsum). Al guardar la reserva se pide la foto real con la misma lógica que el resto de paradas (`fetchPlacePhoto` → `/api/place-photo`) con el lugar `photo_from` del destino, **Piazza Navona**, y su `wikipedia_title` si lo tiene. La ficha ya pide la misma foto por el mismo nombre (y pinta el crédito si lo lleva).
- Lo que devuelve el servidor para Piazza Navona hoy: **Unsplash** (con crédito de Unsplash, que la ficha pinta). Piazza Navona no tiene `wikipedia_title` en los datos.
- Sin peticiones de más: una sola por parada (cambiar la fecha o guardar otra vez no vuelve a pedirla; la memoria de fotos ya existente evita repetir la misma entre paradas). Si la parada no tiene `photoName` (no hay datos del destino) **no se pide nada**: nunca se busca por el nombre «Free Tour».
- Sin foto, o con el servidor caído: se queda el recuadro neutro y no se rompe nada (comprobado).
- Servidor: la entrada del Free Tour manda ahora también `wikipedia_title` del lugar de la foto (`server/index.js`, `/api/destination-places`). **Hay que reiniciar el api-server del repo principal** para que llegue; sin reiniciar, la foto se pide igual, solo sin ese dato (que hoy es null en Roma).
- Dónde: `pedirFotoDelFreeTour` en `freeTourManual.ts`, llamada desde `addReservation` y desde el botón «Añadir al…» del aviso.

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y3_reservas.mjs` (con `_6y3_reservas_entrada.tsx`): **97 comprobaciones, 0 fallos**. Cubre: el orden (los tres grupos con los datos de Roma, casos concretos, «me gusta» reales primero, empate, los números de prueba no ordenan, una sola regla); quitar el Free Tour (con y sin fechas): sale su parada, aviso, Deshacer lo devuelve todo igual, quitar y volver a añadir no duplica, otra reserva sin cambios, ruta nuestra sin cambios, cableado de los dos sitios; botones nuevos (con/sin fechas, masculino/femenino, Free Tour, que siguen haciendo lo que dicen) y 0 «Pasarlo»/«Añadirlo»; foto real, una sola petición, sin foto y con servidor caído, sin datos del destino, y por el botón del aviso.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio.
- Existentes, contra mi servidor (puerto 8861, código nuevo): 6y2 reservas (128) 0 fallos; 6y manual (1706) 0; 6y formulario (459) 0; 6v (82) 0; 6z6 (las cuatro partes) 0; Corr6z6 (las tres partes) 0; 6z6f (22) 0.
- **Ajustes a pruebas existentes (solo por mi trabajo):**
  - `pruebaFase6y_manual.mjs`, apartado 8: comprobaba el orden antiguo (primero `pool_lista`, luego nivel 1). Ahora comprueba el nuevo (nivel 1, luego `pool_lista` sin repetir).
  - `pruebaFase6y2_reservas.mjs`: los textos de los botones («Pasarlo…» → «Pasar…», «Añadirlo…» → «Añadir…»).
- Nota: correr `pruebaTanda6v.mjs` reescribe `docs/dias/PRUEBA_TANDA6V.md`; lo he dejado como estaba.

## No pude hacer / no verifiqué
- **Visual a 375 px** (sin navegador): falta mirar el aviso «Free Tour quitado del viaje» con Deshacer sobre la barra, la parada del Free Tour con la foto (y sin ella), y los botones nuevos en la campana y en la tarjeta de RESERVAS.
- Los botones y las hojas son de navegador: la prueba comprueba la lógica que llaman y el cableado en el código, no un clic real.
- No he podido leer `docs/dias/PROMPT_TANDA6Y3_PARA_PEGAR.md` (no existe en esta copia del repositorio); he seguido el encargo tal como llegó.
- Por una errata de escritura en una ruta pudo quedar un directorio suelto con una `O` de más en `C:SERSRICDesktopCLAUDE PROYECTOS` (fuera del repositorio) y un `server_6y3.log` en `C:SERSRICDesktopCLAUDE PROYECTS`; si existen, se pueden borrar.

## Preguntas abiertas
1. Dentro del nivel 1, ¿qué orden quieres? Ahora es el editorial de siempre. Alternativa: el de `pool_lista` para los que están en las dos listas (Coliseo, Foro, Trevi… primero).
2. Quitar otras reservas (no el Free Tour) tampoco tiene Deshacer. ¿Lo quieres en todas?
3. El Free Tour dice «Punto de encuentro: Piazza di Spagna» pero su foto es de Piazza Navona (donde acaba el tour; es el `photo_from` del destino, igual que en la ruta nuestra). Pedido: «foto del punto de encuentro (Piazza Navona)». Lo he dejado como el motor. ¿Quieres otra foto?
4. El servidor de pruebas: `SERVER_PORT=8861 node server/index.js`. Reinicia el api-server del repo principal.
