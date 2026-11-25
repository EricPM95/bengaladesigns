# NOCHE · agente RESTO (24-25 nov)

Capturas en `docs/dias/NOCHE_RESTO_capturas/` (`*_dibujo.jpg` = Design, `*_antes.jpg`, `*_despues.jpg`; modo iPhone 375 px). Decisiones y dudas: `docs/dias/DECISIONES_NOCHE_RESTO.md`.

## Piezas (elemento → archivo · nombre · mundo)
- Cuadrado de la fecha → `src/components/ui/CuadradoFecha.tsx` · `CuadradoFecha` · los dos.
- X de cerrar una hoja → `src/components/ui/CruzDeHoja.tsx` · `CruzDeHoja` (`enLinea` junto al título, `oscura`, `datos`) · los dos.
- Tirador de las hojas → `src/components/ui/TiradorDeHoja.tsx` · `TiradorDeHoja` (44 × 4) · los dos.
- Etiqueta pequeña («En tu ruta», «Te lo recomendamos», «Excursión») → `src/components/ui/Etiqueta.tsx` · `Etiqueta` (`oro` / `destacada` / `gris`) · resto.
- Botón dorado y claro → `src/components/ui/botonesOro.ts` · `BOTON_ORO`, `BOTON_CLARO`, `DORADO` · los dos.
- Botón de borde «+ Añade/Sube…» de las tarjetas guardadas → `reservas/BotonesDeReserva.tsx` · `BotonAnadirDocumento estilo="borde"` · resto.
- Papelera roja → `reservas/BotonesDeReserva.tsx` · `PapeleraRoja` (`enLinea`) · resto. Lápiz → `LapizDeReserva`. Icono del documento → `IconoDeDocumento`.

## Tabla de la Parte 2 (resto + lo común)
| Elemento | Mundo | Pieza que queda | Sitios cambiados |
|---|---|---|---|
| Cuadrado de la fecha | los dos | `CuadradoFecha` | 3 (`ListaDeDias`, `DayList` —con el día abierto marcado—, `HojaDia`) |
| X de cerrar una hoja | los dos | `CruzDeHoja` | 16 (HojaDia, HojaOpciones, Reorganizar ×2, ExcursionBloque, AddReservationSheet, HojaAbajo, OtraReservaBuscador, PickerSheet, ListaDelPase, HojaLogros, logros/visto Cruz, MiColeccion, NoticesSheet, Hoja) |
| Tirador de las hojas | los dos | `TiradorDeHoja` | 22 barritas en 16 archivos |
| Esquinas de las hojas | resto | 32 px (las de `HojaDia` / `HojaOpciones` de Design) | ~24 hojas (estaban a 26, 28 y 30) |
| Botón dorado (degradado a mano) | los dos | `DORADO` / `BOTON_ORO` | 12 (+ `ORO_PASE` y `ORO` pasan a ser `DORADO`) |
| Botón de borde «+ Añade/Sube…» | resto | `BotonAnadirDocumento estilo="borde"` (fondo #FFF8E4, borde dorado, 46 px, «+» en trazo) | 1 pieza = vuelo, alojamiento, entradas y excursiones |
| Papelera | resto | `PapeleraRoja` | 1 (`HojaDeHora`) + la fila del vuelo |
| Etiquetas | resto | `Etiqueta` | 5 |
| Tarjetas, avisos, recuadros de puntos | — | sin tocar (ver DECISIONES) | 0 |

## Pantallas de RESERVAS (punto 7-10)
- **Vuelo** (`Reservas Billete`): en la ida/vuelta sin tarjeta, el botón «+ Añade tu tarjeta de embarque» y la papelera van en LA MISMA fila (antes, la papelera abajo a la derecha); con tarjeta, la papelera sola a la izquierda, bajo la línea punteada. «o escribe los datos a mano» se queda bajo el botón.
- **Alojamiento / Entradas / Excursiones** (tarjeta guardada): el botón de borde cambia al del dibujo (E1/A1/X5: crema, borde dorado, 46 px). El resto de la tarjeta ya coincidía con el dibujo (se comprobaron medidas y textos).
- **La hoja de una entrada / excursión**: crema (#FBF3E2), título de 28 px, [Guardar…] dorado de 54 px (`BOTON_ORO`, esquinas de 16) en vez de la píldora champán.
- **El aviso de los días que cambian** (`Entrada Cambio Dias` E1): panel #FFFDF8 de 32 px, título de 28 px, filas de 18 px (la elegida #FBF3E2 con borde dorado, las demás #F7F1E4), la fecha en negrita, fondo oscuro del dibujo y [De acuerdo] dorado de 54 px.
- **`Alojamiento Mapa` (M1-M3)**: sin tocar (no he podido compararlo en pantalla; ver «Sin hacer»).

## Sin hacer o sin ver en pantalla
- Después de la última corrección del botón del vuelo (texto en una sola línea a 375 px) NO he vuelto a capturar: la cola de Chrome estuvo ocupada por las baterías de otros agentes más de una hora. Lo comprobado en pantalla es lo anterior a esa corrección.
- «Alojamiento Mapa» (M1-M3), «Entradas» E3-E5, excursiones X0-X4/X6-X7 y el aviso E1 de los días que cambian: NO comparados en pantalla (solo por código, y el aviso por medidas del dibujo). La hoja del alojamiento no se abrió en la captura (`hoja_aloj_despues.jpg` enseña otra pantalla).
