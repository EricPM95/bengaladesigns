# Tanda 6y5 · Parte de las historias y los datos de las fichas (agente B)

Palabras sencillas. Todo local, sin push. Solo Roma. La prueba es `scripts/destino/pruebaFase6y5_historias.mjs` (con un servidor de la app con este código: `SERVIDOR=http://localhost:PUERTO node scripts/destino/pruebaFase6y5_historias.mjs`; si está a mano `docs/dias/HISTORIAS_ROMA.md`, o la ruta en la variable `HISTORIAS`, compara cada historia letra por letra con la de Eric).

No he hecho la comprobación visual a 375 px (no hay navegador en esta copia). Lo que sí: la pantalla pintada con el código de verdad (react-dom/server), los datos y el servidor.

## Qué se ha hecho

1. **Las 31 historias están en los datos**, en un campo nuevo `historia` de la ficha de cada sitio (`data/pipeline_v2/detalle/roma/*.json`). Solo el texto: sin título, sin las líneas «Comprobar», sin notas. Los párrafos van separados por una línea en blanco. Las pasó un script que se puede repetir: `scripts/destino/pasarHistorias6y5.mjs [ruta a HISTORIAS_ROMA.md]` (no duplica nada).
2. **La historia del Coliseo es gratis**: lleva además `historia_gratis: true` en su ficha (campo nuevo, en los datos, no un nombre escrito en el código).
3. **Los 6 datos dudosos (punto 4)** corregidos, con las frases de Eric (Trevi: Océano y la moneda; Panteón: 21 de abril y la cúpula; Navona: la leyenda de las dos figuras; San Pedro: el bronce del Baldaquino). Todo lo demás de las fichas, igual.
4. **La línea de la guía (punto 6)** añadida al final de `GUIA_NUEVOS_DESTINOS.md`.
5. **La app**:
   - `src/lib/historia.ts` (nuevo): la única regla de quién oye la historia: sin historia, nada; con historia, de pago, salvo la marcada gratis; en la gratis, candado.
   - La barra de la ficha (`Escuchar.tsx`, `barra`) ahora dice **«Escuchar historia»** y lee la historia (no el Resumen). Mismo código de voz de siempre (voz del móvil en español, avanza por frases).
   - **Gratis**: la del Coliseo suena; en los demás sitios con historia la barra sale con el candado. Al tocarlo, se avisa con un evento en un solo sitio (`pedirPago()` en `src/lib/pago.ts`, evento `trazo:pagar`) y la barra dice «Es de la versión completa».
   - **Sitio sin historia**: ni barra ni botón (ni siquiera con candado).
   - **HOY (de pago)**: «Escuchar» sigue leyendo el Resumen; al lado sale «Historia» (`HistoriaDeParada`) solo si la ficha del sitio tiene historia.
   - La historia **no se escribe** en ninguna pestaña: solo se escucha.
   - El campo llega a la app por donde ya llegaba la ficha ampliada (`/api/place-detail` devuelve la ficha entera). He subido la versión de la caché del navegador (`placeDetailApi.ts`, de 1 a 2) para que nadie se quede con la ficha vieja sin historia. La ficha de la parada, además, parte de la ficha ya guardada en memoria si la hay (sale al instante).
6. **P23: la rama de HOY gratis, borrada** de `HoyDurante.tsx` (y con ella `CabeceraDelDia` y `TituloDelDia`, que solo usaba esa rama). La pestaña HOY ya era solo de pago.

## Qué historia ha recibido cada sitio (las 31)

| N.º | Historia | Sitio (ficha) | Zona (fichero) |
|---|---|---|---|
| 1 | Coliseo (gratis para todos) | Coliseo | roma_antigua |
| 2 | Foro Romano y Palatino | Foro Romano y Palatino | roma_antigua |
| 3 | Arco de Constantino | Arco de Constantino | roma_antigua |
| 4 | Fontana de Trevi | Fontana de Trevi | centro_historico |
| 5 | Panteón | Panteón | centro_historico |
| 6 | Piazza Navona | Piazza Navona | centro_historico |
| 7 | Plaza de España | Plaza de España | centro_historico |
| 8 | Museos Vaticanos y Capilla Sixtina | Museos Vaticanos y Capilla Sixtina | vaticano |
| 9 | Basílica de San Pedro | Basílica de San Pedro | vaticano |
| 10 | Plaza de San Pedro | Plaza de San Pedro | vaticano |
| 11 | Altar de la Patria | Altar de la Patria | roma_antigua |
| 12 | Castillo de Sant'Angelo | Castillo de Sant'Angelo | vaticano |
| 13 | Boca de la Verdad | Boca de la Verdad | roma_antigua |
| 14 | Largo di Torre Argentina | Largo di Torre Argentina | centro_historico |
| 15 | Campo de' Fiori | Campo de' Fiori | centro_historico |
| 16 | Plaza del Campidoglio | Plaza del Campidoglio | roma_antigua |
| 17 | Basílica de San Clemente | Basílica de San Clemente | roma_antigua |
| 18 | San Pietro in Vincoli | Iglesia de San Pietro in Vincoli | roma_antigua |
| 19 | Ojo de la Cerradura del Aventino | Ojo de la Cerradura del Aventino | roma_antigua |
| 20 | Isla Tiberina | Isla Tiberina | roma_antigua |
| 21 | Galería Borghese | Galería Borghese | villa_borghese |
| 22 | Santa María la Mayor | Basílica de Santa María la Mayor | roma_antigua |
| 23 | Circo Máximo | Circo Máximo | roma_antigua |
| 24 | Termas de Caracalla | Termas de Caracalla | roma_antigua |
| 25 | Via Appia y las catacumbas | Via Appia Antica | appia |
| 26 | Columna de Trajano | Columna de Trajano | roma_antigua |
| 27 | San Luigi dei Francesi | Iglesia de San Luigi dei Francesi | centro_historico |
| 28 | Santa Maria della Vittoria | Iglesia de Santa Maria della Vittoria | roma_antigua |
| 29 | Mirador del Janículo | Mirador del Janículo | trastevere |
| 30 | Piazza del Popolo | Piazza del Popolo | villa_borghese |
| 31 | Santa Maria in Trastevere | Iglesia de Santa Maria in Trastevere | trastevere |

**Los que no han encontrado ficha: ninguno.** Los 31 tienen su ficha y ningún otro sitio lleva historia (la prueba lo comprueba). Aclaraciones: la 25 va a «Via Appia Antica» y NO a «Catacumbas de San Calixto» (es otra ficha; la historia habla de las dos cosas, pero se pone en un solo sitio). Si un viaje trae una nocturna («Fontana de Trevi (noche)») o un sitio «visto desde fuera», el servidor ya les da la ficha del sitio de verdad, y por tanto también su historia.

## El chequeo de repeticiones

La prueba mira, sitio por sitio, que la historia no comparta 8 palabras seguidas con la descripción, «Qué vas a ver», los consejos ni los secretos de su ficha (sin acentos ni signos, frase a frase). **Resultado: 0 repeticiones**, también con las frases nuevas del punto 4. Ninguna de las frases nuevas repite lo que dice `HISTORIAS_ROMA.md` de su sitio, así que no he tocado ninguna historia.

## Pruebas

Ver el informe final de quien me llama para el resultado de cada prueba; las que hablaban de la ficha o de HOY gratis se han ajustado lo mínimo:
- `pruebaFase6y4_ficha.mjs` (bloque «A3 escuchar»): ahora la barra es «Escuchar historia», sale con la ficha real del Coliseo y no sale en un sitio sin historia; en la gratis suena la del Coliseo. (Y su entrada `_6y4_ficha_entrada.tsx` exporta `fetchPlaceDetail`.)
- `pruebaTanda6z6c.mjs` (dos líneas de «3 ficha»): comprueban la barra con el texto de la historia, no el del Resumen.
- La rama de HOY gratis ya no está: ninguna prueba la miraba por dentro (HOY gratis ya enseñaba nada).

## Preguntas abiertas

1. **«Lleva a pagar»**: la app no tiene todavía pantalla de pago. El candado avisa con el evento `trazo:pagar` (único sitio: `pedirPago()`) y la barra dice «Es de la versión completa». Cuando exista la pantalla, solo tiene que escuchar ese evento. ¿Vale así hasta entonces?
2. **La guía dice «Lo de pago no se enseña con candados»** (sección 6 de `GUIA_NUEVOS_DESTINOS.md`), y esta barra con candado es la excepción pedida. No he tocado esa frase. ¿La ajusto?
3. **Trevi, secretos**: la frase siguiente («La tradición original no era una moneda, sino beber agua de la fuente») queda al lado de «echar monedas al agua es mucho más antiguo». No he tocado la primera porque no estaba en tu lista, pero se contradicen un poco. ¿La quito o la cambio?
4. En el secreto del Baldaquino se queda el dicho «Lo que no hicieron los bárbaros, lo hicieron los Barberini» (no estaba en la lista).
5. «Historia» en HOY es solo de pago (HOY lo es); la historia del Coliseo gratis suena solo en la ficha.

## Lo que no he podido verificar

- La vista a 375 px de la barra «Escuchar historia» (con y sin candado) y del botón «Historia» en HOY.
- Que la voz del móvil lea bien las 31 historias reales (la prueba usa una voz simulada; el texto pasa por el mismo `trocearTexto` de siempre).
- `docs/dias/HISTORIAS_ROMA.md` y `PROMPT_TANDA6Y5_PARA_PEGAR.md` no estaban en mi copia (son documentos nuevos sin subir): los leí de la carpeta principal, sin tocarlos.
