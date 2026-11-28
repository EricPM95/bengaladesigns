# Decisiones pendientes de Eric (V77 a V81 y el finde de pruebas)

Cada una con la pregunta y mi propuesta. Las que dicen «migración» necesitan que las apliques tú.

## Motor y HOY
1. **Free Tour a las 10:00 y el desayuno (día 1 de 3 días, 9-mar-2027).** Con el tour a las 10:00 el día 1 deja el Panteón, la Via della Conciliazione y el Castillo en pendientes: solo cabía un desayuno antes. Es tu regla al pie de la letra. *Propuesta:* dejar ir antes del tour lo que quepa con margen (Panteón a las 9:00, como antes).
2. **Reserva «Otra» a las 19:30 con la cena a las 19:00.** Va detrás de la cena (solo se adelanta con hora igual o posterior). *Propuesta:* dejarlo así; si la quieres siempre delante, lo cambio.
3. **Fichas del contador de RESERVAS en el iPhone:** salen 2 columnas, no 3. *Propuesta:* dejar 2; para 3 habría que reducir la letra o quitar el círculo ✓.
4. **«Casi lista» en grupo:** ¿una línea pequeña «Va a Mi cuenta · Solo lo ves tú»? *Propuesta:* no, ya no se contradice.
5. **Excursión cancelada:** solo se guarda en el móvil (no se comparte en un viaje compartido). *Propuesta:* guardarla en la cuenta (`camposDelViajero`) en una tanda aparte.
6. **Terminar una excursión organizada** no suma colección ni Reto del día. *Propuesta:* que pase por el flujo del «visto».
7. **Excursión por tu cuenta o organizada:** los `modo_habitual` de Costa Amalfitana, Florencia y Pisa y Tívoli (organizadas) y de Venecia, Ostia Antica, Fuerteventura e Isla de Lobos (por tu cuenta) son mi propuesta. *Pregunta:* ¿los confirmas?
8. **HOY pasa a «después» 2 h tras «Ya en el aeropuerto»** aunque el vuelo no haya salido. *Propuesta:* esperar a la hora del vuelo si es posterior.

## Datos y textos
9. **Audio de Haría:** no creado (falta el secreto de audios). *Propuesta:* lo generas tú o me lo pasas cuando quieras.
10. **Puntos de foto (V78):** 9 propuestos en `PUNTOS_DE_FOTO_PROPUESTOS.md`, solo 3 con fuente confirmada. Via dei Fori no cambia hasta que apruebes el punto. *Pregunta:* ¿cuáles apruebas?
11. **Nombres cortos de Roma** (solo «Lo mejor:» los usa): *Propuesta:* aprobar la lista y extenderlos a las demás pantallas.
12. **~18 restaurantes sin coordenadas** y Tacande aproximada. *Propuesta:* completarlas con Mapbox en una tanda de datos.
13. **Historias de Pompeya, Florencia y Nápoles** (no sale «Escuchar») y fotos pequeñas de las ideas. *Propuesta:* encargarlas a la próxima tanda de contenido.
14. **Hoja de pago:** muestra «Texto pendiente» (texto legal). *Propuesta:* escribirlo o quitarlo antes de abrir pagos.
15. **Fotos:** 78 pasan de 300 KB. *Propuesta:* recomprimirlas solo si te molesta el peso del repositorio; la foto de cabecera de la parada en HOY se queda grande.

## Supabase (finde, Paso 5) — todas con migración o cambio de regla
16. **Resumen de «me gusta»** (`place_likes_resumen(destino)`, ~3 KB). *Propuesta:* migración nueva.
17. **Avisos del viaje sin bajar la ruta entera** (`avisos_viaje_para_plan`) o rehacer solo cuando cambie la huella. *Propuesta:* migración nueva.
18. **Solo los avisos nuevos** (`avisos_de(p_uid, p_desde)`). *Propuesta:* migración nueva.
19. **Subir la vida de la lectura ligera del servidor de 30 s a 2-3 min** (ahorra otro ~60 % de «cerca»). *Propuesta:* sí, con el riesgo de ofrecer un pedazo ya ganado un rato.
20. **«Cerca de aquí» quieto cada 10 min** (hoy 5) y **campana cada 10 min** (ya llega por Realtime). *Propuesta:* sí a las dos.
21. **Mirar el gráfico de egress de Supabase unos días:** si no baja de ~160 a ~80 MB/día, la causa sigue siendo otra.

## Riesgos sin arreglar (los dicen los agentes)
- Botones viejos de quitar (SaleCards, TransportRow, InsuranceRow, RentalVehicleRow, UtilParaElViaje, AnadirReserva) borran de golpe, sin hoja de confirmar.
- El teclado del iPhone solo se probó con un teclado simulado; Safari real sin comprobar.
- `listas.json` de Lanzarote se regenera con `lanzaroteDatos.mjs` y perdería «Atardecer en El Golfo».
- `pruebaV36_cliente` parpadea con la máquina cargada; `pruebaFase6y2_fotos` está desfasada.
- Las rutas de Lanzarote en `HOY2_B` y `HOY2_C` fallaron varias veces antes de arreglar la espera; la causa no está confirmada.

## Probador (finde, Paso 6): fallos del motor sin arreglar (tocan `shared/routeEngine`)
- **Lanzarote, vuelo de vuelta a las 17:30:** el día sin paradas conserva la cabecera «Sal de casa a las 09:10 · 45 min · 43 km» (el tramo a Teguise, que el motor quitó) y queda vacío con 6 h libres. *Propuesta:* una tanda de motor que quite la cabecera y rellene el día.
- **Nota de Teguise** dice «posiblemente ya esté cerrado» de un pueblo (V56: los pueblos no cierran). *Propuesta:* quitar esa nota.
- **Lanzarote 15:30:** «el día es tuyo hasta las 13:15» contra «devuelve el coche antes de las 13:00», y dos tramos «al aeropuerto» con km distintos (29 y 33).
- **Roma 15:30 y 17:30:** queda un «DE CAMINO» huérfano y «0 paradas» con un solo desayuno.
- **Terminal:** HOY enseña «1» y RESERVAS «T1». *Propuesta:* una función común `etiquetaDeTerminal`.
- **Arreglo hecho** (comidas del día de vuelta): un día de vuelta sin `meals` de cena no pinta cena nunca, ni con vuelo a las 21:00 o más.
- El probador usa la zona por defecto de Lanzarote y no pone alojamiento ni reservas.

## Batería completa (finde): 355 pruebas corridas, 271 bien y 84 mal (no se ha arreglado ninguna; lista completa en `docs/dias/_bateria_365.md`)
Faltan 8 de las 363 sin apuntar (no terminaron o se repitieron). Mi lectura, sin haber abierto cada una:
- **Desfasadas por decisiones de Eric (lo más probable, ~55):** el contador de RESERVAS «x de 4 listo» (V22/V58: `pruebaV22`, `Tanda10G`, `Tanda6s`, `Tanda6z6a`, `Fase6z6f`), Lanzarote con 35 sitios y Haría partida (`TandaLZ1_B`, `LZ2b1_A/B`), «Deshacer» al borrar reservas (V75/V77: `Fase6y3_reservas`, `Tanda7_reservas`), emoji/trazos en tarjetas (`Fase6y4_iconos`, `Tanda6z3`), V18/V21/V28 (archivos que ya no existen), estudio de sonidos con 29 tarjetas (`V38*`, `V39*`, `V40*`), panel admin (`V33`, `V35A`), `Cuentas3` y `10N_compartir` (sin claves de Supabase en la prueba).
- **Posibles fallos reales (hay que mirarlos):** al «Quitar la hora» la casilla queda vacía en vez de volver al ejemplo (`10S3_C`, `10S6_O`, `10S9_C`, `10S9b_B`); «null» en el aviso del mirador del atardecer (`10P_hoy`, `HOY2b_E`); el recuadro «Sin tu ubicación» respecto a «Escucha su historia» (`V46`); `V42` (botones flotantes) y `V27` (tarjetas de DÍAS alineadas); `HOY2b_D` (foto de los sitios y [Volver a mi ruta]); `V2Hoy` («avisoDeCerrada is not a function»); `Fase6y2_formulario` (tocar «Ponle nombre»).
- **Exit raro (marcadas OK pero con salida sospechosa):** `pruebaV38`, `FotosLanzarote`, `10H`, `10I`.
- Hay 6.615 carpetas viejas `enLaApp-*` en Temp (perfiles de Chrome): bórralas a mano o dime y lo hago.
*Propuesta:* una tanda de «ponerse al día» que actualice las desfasadas y arregle las 8 posibles reales.
