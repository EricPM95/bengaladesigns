# REPASO V55: todas las hojas que proponen un cambio, con el mismo formato (y la rueda de la hora)

Modo rápido: sin pruebas. Comprobado con `npx tsc --noEmit -p tsconfig.app.json` (sin errores), `npm run build` (sin errores) y capturas en modo iPhone (390x844). Todas las capturas están en `docs/dias/V55_capturas/`: `<hoja>_antes.jpg`, `<hoja>_despues.jpg` y `<hoja>_antes_y_despues.jpg` (una al lado de la otra). Nada subido a Git.

## Qué hay ahora
- **Una sola forma de hoja de propuesta.** Arriba el texto; una tarjeta por cada sitio que cambia (foto real de su parada, nombre, a dónde va en gris y, a la derecha, su cuadrado); la franja verde de lo que sigue igual; el botón dorado con la acción; y [Dejarlo como está] pequeño. Se acabó el bloque gris de resumen (`ResumenDeCambios` ya no existe), «¿Lo dejamos?» y «Sí, dejarlo».
- **Cuadrados:** otro día → el de la fecha; hoy a otra hora → el de la fecha de hoy y «Hoy a las 17:30» en gris; a pendientes → el azul con el pin con reloj; quitar del viaje → el azul con la papelera (pieza nueva `CuadradoQuitar`).
- **Con más de 3 sitios:** 3 tarjetas y «y 5 más» en gris que despliega el resto.
- **Las tarjetas salen solas** de lo que cambia la propuesta (`src/lib/tarjetasDePropuesta.ts`), así que sirve igual para Roma, Lanzarote y cualquier destino nuevo, y una hoja nueva ya sale con tarjetas sin escribir nada.
- **CLAUDE.md:** la regla V43 del «bloque de resumen» queda sustituida por esta, la tabla de piezas puesta al día y una regla nueva para la rueda.

## Hojas pasadas (antes y después en las capturas)
| Hoja | Captura |
|---|---|
| Voy con retraso | `retraso` |
| Quiero comer ahora | `comer` |
| Añadir un sitio cercano | `anadir` |
| Saltarme esta parada (con reserva por llegar) | `saltar` |
| Hoy ya no da tiempo a todo | `yanodatiempo` |
| Si te sobra tiempo / Necesito más tiempo (HojaSolucion) | `mastiempo_despues` (ya estaba en tarjetas desde la V54: es la misma hoja que `peligro`) |
| Horario y cerrado (uno y tres sitios) | `horario`, `horario_grupo` (ya en tarjetas desde la V54; ahora con el mismo código común) |
| Entrada en peligro | `peligro` (igual que antes: ya estaba) |
| ¿Qué hago ahora? › Añadir | `quehago` |
| Plan de lluvia (Roma, montado con la pieza real) | `lluvia_roma` |
| Plan de lluvia (Lanzarote) | `lluvia_lanza` |
| Reorganizar (2 sitios) | `reorganizar` |
| **Reorganizar con más de 3 sitios** | `reorganizar_mas` |
| **Lanzarote:** pasar a otro día, retraso y lluvia | `lanza_otro_dia`, `lanza_retraso`, `lluvia_lanza` |
| ¿Cómo vais? › Cansados (opcional) | pasada a la hoja común; **sin captura** (ver DECISIONES) |

## La rueda de la hora (lo que he comprobado)
Causa: `HojaDeHora` solo guardaba si la casilla ya tenía hora o si se había movido la rueda («la hora gris de ejemplo nunca se guarda», V49). Ahora el ✓ guarda siempre la hora que se ve; tocar fuera, deslizar hacia abajo o Escape cierran sin guardar. Comprobado en un Chrome de iPhone montando las piezas reales (`scripts/destino/capturasV55_rueda.mjs`):
- **`HojaDeHora` / `CampoDeHora`**, casilla vacía con 08:30 en gris, ✓ sin mover la rueda → guarda 08:30. (Era el fallo.)
- **`CampoDeHora` con hora 09:15**, ✓ sin mover → guarda 09:15 (como antes).
- **`TimeField`** (que usa `HojaDeHora`; reservas a mano): vacío + tocar fuera → no guarda y la casilla sigue vacía; vacío + ✓ → guarda 09:00 (la que enseña); con lista de horas (columna única) + ✓ → guarda la primera que se ve (09:00).
- **Escape** → cierra y no guarda.
- **`PickerSheet`**: no es una rueda de hora, es la hoja de la fecha (calendario + «Listo», la usa `DateField`); no tiene ese fallo y no se ha tocado.
- Las demás: busqué con grep (`snap-y`, `type="time"`, `RuedaDeHora`, `TimeListWheel`, `CampoDeHora`, `TimeField`). Solo hay UNA rueda confirmable (`HojaDeHora`, con sus dos columnas `RuedaDeHora` o una `TimeListWheel`); todas las hojas de reservas pasan por `CampoDeHora` o `TimeField`. Lo único que queda con `type="time"` es la pantalla de desarrollo (`DevQuickRouteScreen`), que no es de la app.
- No comprobado en un iPhone real: solo en Chrome con tamaño de iPhone y toques simulados.

## Lanzarote
La API se reinició con `DESTINOS_OCULTOS='-'` solo para sacar estas capturas y **se ha dejado otra vez normal**. Las tarjetas salen igual (de las operaciones de la propuesta). En las capturas de Lanzarote las fotos pequeñas aparecen en beige: no habían terminado de cargar al sacar la captura (en Roma sí salen). «Voy con retraso» en Lanzarote, con el día holgado, sale sin tarjetas porque no cambia ningún sitio (ver DECISIONES).

## Qué no he podido comprobar
- La captura de «¿Cómo vais?» › lo opcional (ver DECISIONES, punto 9).
- El cuadrado de la papelera en pantalla: el motor casi no genera «quitar del viaje» (DECISIONES, punto 6).
- Las pruebas viejas no se han pasado (modo rápido) y varias buscan textos que cambian: lista en `DECISIONES_V55.md`.
- Producción (jutrip.app), push y reinicio del api-server: no hechos (no hay commit ni push en este encargo; la API de desarrollo está encendida y normal).
