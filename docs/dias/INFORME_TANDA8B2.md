# Informe: Tanda 8B2, los arreglos de la 8B

17-oct-2026. Todo sigue detrás de los mismos interruptores (HOY v2 con `?hoy2=on`, los logros con los suyos). **El motor de rutas no se ha tocado.** No hay migraciones nuevas. Trabajé otra vez con ayudantes en paralelo (momentos, Visto y fotos, HOY v2, escenas); sus notas están en `docs/dias/notas_8b/` (secciones «8B2», `escenas_8b2.md` y `fotos.md`).

## Qué he cambiado

### 1. El orden de las sorpresas, siempre este, y en un solo sitio
- **Dónde se decide: el servidor.** `data/logros/ajustes.json › orden_momentos` es ahora: pedazos, colecciones completadas, emblema, sello, país, destino nuevo, continente, maravilla, Patrimonio, logros de viajero. El móvil **ya no reordena** (`plan.ts` solo agrupa lo que llega, en el mismo orden), así que no pueden descuadrarse.
- **Lo que ve la persona:** 1) los pedazos nuevos, **todos en una sola pantalla** (cada insignia con su pedazo encendiéndose); 2) cada colección completada, una pantalla por colección; 3) el Emblema Oculto; 4) el sello, si sube; 5) «Y además…»; 6) el resumen del día.
- **Excepción, las maravillas:** el servidor pega el momento de la maravilla justo después de su emblema (el emblema trae ahora `maravilla`). En el Coliseo: la película y, a continuación, **una pantalla entera con la medalla de las 7 maravillas encendiendo su pedazo, «Tu primera maravilla · 1 de 7» y [Seguir]**. Ya no va como tarjetita dentro de «Y además…» ni dentro de la película.
- Fuera el texto «Una foto, 3 colecciones»: la pantalla de pedazos dice «Un pedazo nuevo» o «Pedazos nuevos».

### 2. Cada cosa con su dibujo de verdad
- **El pedazo nuevo** sale con la **insignia de su colección** y el pedazo de ese sitio encendiéndose (latido y destello), como en Logros · Modelos. La hoja V2 del Visto ya no lleva el hexágono con ✓: lleva la misma insignia.
- **Tarjetas pequeñas** («Y además…», lo ganado en pequeño): un pedazo con su insignia, un logro de viajero con su chapa y una maravilla con la medalla de las 7. Nunca un icono genérico.
- **Las 11 escenas de emblemas** (Panteón, Trevi, Foro, Museos, Plaza de San Pedro, Basílica, Boca de la Verdad, Cerradura, Catacumbas, Madrugador y Nocturno) están **reescritas como traslado literal de «Emblema Cine»** de Design (mismos trazos, tiempos, partículas, luces y frases), cada una en su archivo y con carga perezosa. La película del Coliseo no se ha tocado salvo quitarle la tarjetita de la maravilla. La espera de suspense («¡Eh! Aquí hay algo…») lleva ahora los rayos que giran y el viñeteado.
- Madrugador y Nocturno no enseñan ninguna hora.

### 3. El Visto y las fotos, sobre HOY v2
- **Las hojas salían sobre «el HOY de antes» porque las capturas de la 8B se hicieron sin `?hoy2=on`** (no era un camino del código: con el interruptor, `HoyView` es el único sitio que lo monta y el HOY viejo no aparece). Todas las capturas del Visto se han rehecho con `?hoy2=on` y se ven sobre HOY v2 y sobre DÍAS.
- V2: «Tu pedazo ya es tuyo. La foto es para tu álbum.» y la insignia con su pedazo.
- **Los textos con nombre de sitio** usan siempre el nombre de la parada que se acaba de marcar (antes algunos usaban el `sitio_nombre` del servidor). Comprobado con Trevi, Navona, Panteón, San Pedro, Coliseo, Museos y Plaza de España. El «Plaza Navona en el Panteón» de V3 no era un error del texto: la hoja era de Navona y el Panteón era la tarjeta de la siguiente parada que se veía detrás.
- **Desmarcar desde «···»** en DÍAS: hecho (`DesmarcarDelMenu.tsx`). Sale «Desmarcar visto» solo si la parada está vista, con los logros encendidos y **sin foto para los logros**; con la foto subida ya no se deshace.
- La franja «Sin conexión…» (A2) pasa a la parte de abajo, encima de la barra, para no tapar el título del día.

### 4. HOY v2: los arreglos de Eric
- **Avisos del día** con una cruz de 44 px; cerrado, no vuelve ese día (se guarda por viaje y día).
- Fuera **«Tu ruta empieza en…»** y fuera la etiqueta **«Saltada»** (la parada ya sale tachada y con [Recuperar]).
- **Mapa pequeño** alejado (zoom 13): se leen nombres («Vatican City», «Saint Peter's Basilica»). El © de Mapbox ya no tapa un tercio: va tras la «i», que sigue dejando ver el crédito.
- **Título del día de llegada:** «Centro histórico» y debajo, en pequeño, «Madrid → Roma».
- **El HOY de después del viaje** (`HoyDespuesV2.tsx`): con los logros encendidos abre la pieza del resumen del viaje de Logros · Momentos (una vez por viaje y sesión) y deja el botón [Ver el resumen de mi viaje]; con los logros apagados, el de antes.
- **Fechas del modo de pruebas:** todo sale de `route.answers.dateRange`: la 1a ponía «17 – 20 oct» arriba y la tarjeta «17 – 19» porque contaba solo los días de ruta sin el de vuelta; ahora todo es «17 – 20 oct».
- El resumen del viaje decía «undefined esconde 12 secretos» (era de la pieza de momentos, que usaba `estado.ciudad`): ahora, sin ciudad dice «Tu viaje» / «Tus logros» / «N secretos por descubrir», y sin dato esconde la línea. Nunca escribe «undefined».

### 5. El peso (arreglado al revisar)
Al integrar vi que la hoja V2, al llevar la insignia, **arrastraba los dibujos de los logros al paquete de apertura** (de 707 a 769 KB). Lo arreglé con `dibujos/InsigniaPerezosa.tsx` (la insignia se baja solo al dibujarse) y una comprobación nueva que impide que vuelva a pasar.

| Al abrir la app | 8B | 8B2 |
|---|---|---|
| JavaScript que lee el móvil | 707,6 KB | **708,4 KB** |
| Descarga total (comprimido, con CSS) | 314,8 KB | **315,1 KB** |

## Las fotos que estaban mal o repetidas
Auditoría de solo lectura (`node scripts/destino/auditoriaFotos.mjs roma [--servidor …]`, con las mismas reglas que el servidor); detalle y propuestas en `docs/dias/notas_8b/fotos.md`. **No se ha cambiado ninguna foto ni dato.**
- **La foto de Navona = Trevi no era un fallo de la app:** era un dato de prueba que puse a mano al inyectar paradas. Con la lógica real, en octubre Navona recibe una foto de Unsplash.
- De los 94 sitios de Roma: 59 con foto propia, 9 de Unsplash, 19 de Wikipedia, 4 con la foto de otro sitio de su zona y 3 sin foto.
- **Repetidas en sitios distintos (2):** Mercados de Trajano y Columna de Trajano comparten `dia_foros_de_trajano.jpg`; Terraza de Largo Gaetana Agnesi y Colle Oppio comparten la del Altar de la Patria (prestada).
- **Con la foto de otro sitio de su zona (4):** esas dos terrazas, el Mirador de San Pietro in Montorio (la del Janículo) y **Via del Babuino (con la de la Fontana de Trevi)**.
- **Sospechosas:**
  - La foto «de día» de Piazza Navona es una foto de Navidad de noche, válida solo del 1 de diciembre al 5 de enero; el resto del año sale una de Unsplash.
  - El mercadillo de Navidad de Navona y otras fotos de Navidad y de noche puestas como «de día» (Plaza de San Pedro y los 100 Presepi) fuera de su ventana de fechas caen en una foto cualquiera.
  - Wikipedia como último recurso puede traer fotos equivocadas: con el servidor sin caché, para el Panteón devolvió una iglesia catalana.
  - Museos Vaticanos sale con la foto de Wikipedia del interior de la Capilla Sixtina, donde no se pueden hacer fotos.
- Además, en las capturas de HOY v2 las portadas de San Pedro y el Panteón (una playa, unas montañas) son las de Unsplash que salen sin foto propia: los mismos casos de arriba.

## Las escenas que no han quedado igual que en Design, y por qué
- **Todas** son traslado literal del código de «Emblema Cine»; el ayudante **no pudo renderizar el diseño al lado** para comparar píxel a píxel (la comparación es leyendo su código), así que conviene que Eric las mire una a una con las capturas.
- [Seguir] **no hace volar el emblema** como en el diseño: lo hace el vuelo genérico de la app (el emblema al botón de logros).
- **Catacumbas** es la más pesada en pantalla (máscara y textura de piedra): en un móvil muy viejo podría ir justa.
- «Reducir movimiento» no se ha podido probar en el panel (revisado solo leyendo el código; la escena empieza ya en su final).
- Pesos: cada escena entre 1,5 y 5,6 KB (1,0 a 2,3 comprimido); la más grande, Trevi. La común (`cine`) 9,9 KB + 3,3 KB de CSS. Nada entra al abrir.

## Las capturas nuevas (`docs/dias/capturas_8b/`, 105 en total, JPG)
Las de antes de los nombres antiguos se han borrado o sustituido.
- **Serie entera del Coliseo** (`CS-coliseo-00` … `CS-coliseo-20`): HOY v2 antes del Visto → permisos → aviso del Visto → hoja del Emblema Oculto → cámara → pedazos nuevos → los pedazos vuelan al botón → la película en 6 pasos (frase, polvo de oro, se enciende, estalla el emblema, fuegos, [Seguir]) → la medalla de las 7 en 3 pasos («Tu primera maravilla · 1 de 7») → el sello nace en 3 pasos → «Y además…» (2) → el resumen del día.
- **Serie con varios pedazos, una colección completada y el sello que sube** (`S2-01` … `S2-10`): pedazos antes / encendiéndose / final, colección completa (2), sello que sube bronce→plata (3), sello plata y resumen del día.
- **Las 11 escenas de emblemas**, tres capturas cada una (principio, mitad, final): `E1-panteon-1/2/3`, `E2-trevi-…`, `E3-foro-…`, `E4-museos-…`, `E5-plaza-…`, `E6-basilica-…`, `E7-boca-…`, `E8-cerradura-…`, `E9-catacumbas-…`, `E10-madrugador-…`, `E11-nocturno-…`, más `C-suspense-1/2`.
- **El Visto sobre HOY v2:** A1, A2, V1 a V8 (V4 «lejos» y V5 «Emblema Oculto» ya son las suyas), V8b, 9b, 9c, recuerdo, foto_dentro, V6, plazo y `DIAS-desmarcar` (el menú «···»).
- **HOY v2:** 1a, 2, 2b (aviso cerrado con cruz y el crédito del mapa), 3, 3b, lista, despues y despues-resumen.

## Pruebas
- `pruebaPantallas8b` ampliada: **64 comprobaciones, 0 fallos** (antes 45). Nuevo: el orden exacto del servidor y que el móvil no reordena; el reparto en pantallas probado de verdad (pedazos juntos → una por colección → emblema → medalla → sello → «Y además…»; la maravilla fuera de «Y además…»; una maravilla sola con su pantalla); el pedazo con su insignia; «Tu primera maravilla» en su pantalla y no en la película; V2 con insignia y su texto; los avisos con cruz de 44 px; fuera «Tu ruta empieza en…» y «Saltada»; el HOY de después con el resumen; las 11 escenas en su archivo y sin horas; y en producción, que al abrir no entran los dibujos de los logros.
- `pruebaLogros1`: **355/0** (nueva: el orden de las sorpresas y la maravilla del Coliseo justo después de su emblema).
- Batería rápida (73 pruebas, sin `pruebaFase6y5_motor`): **«MAL: ninguna»**, con el servidor de la API reiniciado. `tsc -p tsconfig.app.json` limpio. Consola: sin errores propios (solo los avisos de `vibrate` del panel y un 400 de Supabase por la migración 0024 sin aplicar).

## Riesgos
- **Sigue sin probarse en un móvil real** (cámara, permisos, galería con datos de cámara, `navigator.share`, vibración, audio) ni con Supabase real.
- **Las escenas se han comparado leyendo el código de Design**, no a la vista. Es lo primero que conviene mirar en las capturas E1–E11.
- **La medalla solo sabe cuál es la maravilla nueva:** con más de una maravilla en el mismo momento no sabe cuáles ya estaban encendidas (hoy solo se puede ganar el Coliseo).
- **«Lo de ayer» en el modo de pruebas** enseña todas las paradas del día anterior aunque ya estén vistas (solo el demo).
- Las fotos de arriba (Via del Babuino con la de Trevi, Navona de día, fotos de Navidad fuera de fechas, Wikipedia como último recurso) son datos por decidir: ninguna se ha cambiado.
- Dos servidores de desarrollo (`route-planner` y `api-server`) quedaron levantados por los ayudantes; los dejo como están.

## Lo que queda anotado para más adelante
- **La película de «El final de las 7 maravillas»** (las 7 monedas fundiéndose en la medalla): solo sale con la séptima maravilla y hoy nadie puede llegar a ella. Anotada, no hecha.
- Lo de la 8c y las cuentas, parte 3, sigue como en el informe de la 8B.
