# Informe: Tanda 8B3, los arreglos tras las capturas de la 8B2

17-oct-2026. Todo sigue detrás de los mismos interruptores. **El motor de rutas no se ha tocado.** No hay migraciones nuevas. Trabajé con tres ayudantes (momentos y series, Visto y capturas, HOY y fotos); sus notas están en `docs/dias/notas_8b/` (secciones «8B3» y `fotos.md`).

## Qué he cambiado

### 1. Un solo viaje de pruebas
Las capturas salían de viajes distintos (fechas «17 – 19» y «17 – 20», un viaje con el Panteón en otro sitio…). Ahora existe **`await window.__rutaPrueba()`** (`src/dev/rutaDePrueba.ts`, solo desarrollo): crea siempre el mismo viaje, **Roma del 17 al 20 de octubre de 2026, con «hoy» fijado en el 17**: día 1 «Centro histórico» con Trevi, Navona, Panteón, Basílica de San Pedro y Coliseo; día 2 Foro y Museos Vaticanos. Las paradas no llevan foto puesta a mano: la app las pide al servidor por el nombre, como en un viaje de verdad. Todas las capturas de esta tanda salen de ese viaje.

### 2. Las capturas repetidas (por fin la causa)
No era solo el panel: **el panel guarda las capturas en una carpeta que comparten todos los ayudantes, y el script copiaba «la última de la carpeta», que a veces era de otro**. Por eso V5 era la del Coliseo, el plazo era la CS-06, etc. Ahora cada captura se copia por su nombre exacto y se comprueba. Rehechas, cada una con su pantalla: **V1, V3, V4 (ahora sí «lejos» en el Panteón), V5 (la hoja oscura del Emblema Oculto), V6, A2 (la franja «Sin conexión…»), lista**, y el resto del Visto (A1, V2, V7, V8, V8b, 9b, 9c, recuerdo, foto_dentro, plazo, DIAS-desmarcar). **La prueba nueva compara los archivos byte a byte y falla si dos capturas son iguales** (hoy: 107 capturas, ninguna repetida).

### 3. «País nuevo: Vaticano» al marcar el Coliseo
**Era mi dato de prueba, no el servidor.** El modo de pruebas (`demoMomentos.ts`) tenía un momento «Tu país número 2: Vaticano» suelto que se mezclaba con «Tu destino número 1: Roma» en la serie del Coliseo. El servidor lo hace bien, y ahora tiene su prueba (`pruebaLogros1`): el primer Visto en el Coliseo da **«Tu país número 1: Italia»** y **«Tu destino número 1: Roma»**, una sola vez; el segundo sitio del día no repite ni país ni destino; la Basílica de San Pedro después da «Tu país número 2: Ciudad del Vaticano» y ningún destino nuevo. Todas las series de prueba siguen ya esa verdad.

### 4. Los números cuadran
- El sello «Primeros pasos en Roma · Bronce — Has visto tu primer imprescindible» ahora dice lo mismo que las insignias (1 de 8) y que el resumen. Antes ponía «3 de 8».
- Bajo cada insignia, la cuenta dice lo mismo que la insignia (antes de encenderse, una menos). Antes: insignia «3 de 8» y texto «4 DE 8».
- **El resumen del día cuenta solo lo que ha salido ese día** (o lo del servidor), sin mezclar: quité el «coge la cuenta más alta» de la 8B2. En la serie S2 (2 pedazos, 1 colección, 1 sello) el resumen ya no cuenta un emblema ni una maravilla que no salieron. Prueba nueva en `pruebaLogros1`: el resumen de cada día no arrastra lo de otros días.
- Los dos momentos del [Visto] y de la foto se juntan en una ronda y se ordenan con la **misma lista** del servidor (`ajustes.json › orden_momentos`, importada tal cual, no copiada).

### 5. La medalla de las 7 maravillas
Las capas apagadas son ahora más oscuras y grises, y hay un destello (fogonazo y aro de luz) sobre **su** pedazo: se ve claro que solo se enciende el Coliseo (capturas `CS-coliseo-13a` a `13e`).

### 6. La película del Coliseo
«Casi 2.000 años esperándote…» **sale siempre**, también al volver a verla (`EscenaDeEmblema` con `primeraVez` falso). Capturas nuevas: `CS-coliseo-05` y `06` (la frase), y `06b` (al repetir la película).

### 7. HOY v2
- **Avisos de otro día:** los avisos de cierre salen solo de las paradas del día de hoy (el código ya lo hacía). El «Basílica … 20:00» que viste en V2 venía de la ruta de prueba del Visto, que la ponía en el sábado; con el viaje único, el sábado 17 da tres avisos (Coliseo 18:30, Panteón 19:00 y Basílica 20:00) y la Basílica está en ese día.
- **El texto tras el Visto no cambia:** sin respuesta del servidor no sale ninguna hoja ni tira (antes, sin cobertura, salía «Guarda un recuerdo»). Cuando llega, la hoja y la tira dicen lo mismo, porque salen de la misma decisión (`visto/decidir.ts`). El móvil no usa ningún catálogo de emblemas (nunca se ven antes de ganarlos): solo `hay_emblema` de la respuesta. También se borra al tocar [Visto] lo que la parada tuviera guardado de otra vez (los ids de parada se repiten entre pruebas; era la causa probable del texto que cambiaba). Medido en el Coliseo: nada a los 0,4, 1,5, 3 y 4,8 s; al salir la hoja, «Te espera una sorpresa» en la hoja y en la tira a la vez. Prueba nueva: `pruebaVisto8b3` (12 comprobaciones puras).
- **«⌛ 0min»:** ningún chip enseña una duración de 0 (ficha, tarjeta de DÍAS, «Si te sobra tiempo», HOY v2, «Más para tu día»).

## Por qué el Coliseo salía sin foto
El servidor **ya devolvía** `dia_coliseo.jpg`. Salía sin foto porque **las paradas del viaje de pruebas llevaban la foto vacía y nadie la pedía**. Ahora HOY v2 la pide por el nombre si falta (`useFotoDeParada.ts`) y sale la suya (`hoy-coliseo.jpg`). La foto de «una reja con árboles» de V7 no sale ni del servidor ni de los datos de Roma: era un dato de prueba del Visto, que ya pide las fotos como la app.

## Las fotos (decidido y aplicado; no se ha borrado ninguna, solo cambia cuál sale)
Detalle, con la foto que salía antes y la que sale ahora, en `docs/dias/notas_8b/fotos.md` («8B3»).
- **Sin foto antes que una equivocada:** Via del Babuino (salía con la de Trevi), Terraza de Largo Gaetana Agnesi y Colle Oppio (salían con la del Altar de la Patria) y el Mirador de San Pietro in Montorio (salía con la del Janículo). Se quitó la regla de «la foto de otro sitio de la zona».
- **Museos Vaticanos:** sin foto (la de dentro de la Capilla Sixtina, fuera); quedan en `fotos_rechazadas` tanto «Museos Vaticanos y Capilla Sixtina» como «Museos Vaticanos».
- **Sitios importantes** (los de nivel 1 del destino): **nunca** la de Wikipedia ni la de otro sitio, tampoco la que hubiera guardada en la caché.
- **Navidad:** un sitio cuyas fotos propias son todas de unas fechas va sin foto fuera de ellas. Piazza Navona queda **sin foto en octubre** y con la suya en diciembre.
- **Columna de Trajano:** deja de compartir la de los Mercados de Trajano; queda sin foto.
- **`scripts/destino/auditoriaFotos.mjs` sale con error** si vuelve alguna de estas cosas (importante con Wikipedia o con foto de otro sitio, fotos repetidas, Navidad fuera de fechas, foto de la zona), y ya forma parte de `pruebaPantallas8b`. Hoy da 0.

### Los sitios importantes sin foto propia (para que los busquemos)
- **Foro Romano y Palatino** (hoy sin foto propia; no lleva Wikipedia).
- **Arco de Constantino** (igual).
- **Panteón** (hoy sale una de Unsplash).
- **Piazza Navona** (de día solo tiene la de Navidad de noche: sin foto fuera de diciembre-enero).
- **Museos Vaticanos** (sin foto desde que se quitó la de dentro; haría falta una de fachada o los patios).
Los demás importantes (Coliseo, Basílica y Plaza de San Pedro, Trevi, Plaza de España…) ya tienen foto propia.

## Las capturas nuevas (`docs/dias/capturas_8b/`, 107 en total, JPG)
- **Serie entera del Coliseo, del viaje único** (`CS-coliseo-00` … `18`, con `06b` y `13a`–`13e`): HOY v2 → [Visto] → aviso → hoja del Emblema Oculto → cámara → pedazos nuevos → la película paso a paso (frase «Casi 2.000 años esperándote…», polvo de oro, se enciende, estalla el emblema, fuegos, [Seguir]) → la medalla (apagada, se enciende el Coliseo, solo el Coliseo, «Tu primera maravilla», tras la película) → el sello nace y queda en bronce → «Y además…» (2) → el resumen del día.
- **Serie S2** (`S2-01` … `10`): pedazos antes / encendiéndose / final, colección completa (2), sello que sube (3), sello plata y resumen.
- **El Visto sobre HOY v2:** A1, A2, V1–V8, V8b, 9b, 9c, recuerdo, foto_dentro, V6, plazo, lista, DIAS-desmarcar.
- **HOY v2:** 1a, 2 (los tres avisos), `hoy-coliseo` (el Coliseo con su foto y sin «0min») y `lista` (cinco fotos correctas).

## Pruebas
- `pruebaPantallas8b`: **68 comprobaciones, 0 fallos** (nuevo: ninguna captura repetida byte a byte, que el demo no diga «país número 2: Vaticano», la auditoría de fotos en 0, y que el móvil no lleva su propio orden escrito).
- `pruebaLogros1`: **361/0** (nuevo: el país y el destino del primer Visto en el Coliseo, el segundo sitio sin repetirlos, la Basílica como país 2, y el resumen de cada día sin arrastrar lo de otros días).
- `pruebaVisto8b3`: 12/0, ya en la batería. `pruebaLogros2`: 54/0.
- Batería rápida (74 pruebas, sin `pruebaFase6y5_motor`): **«MAL: ninguna»**, con el servidor reiniciado. Tres pruebas antiguas de fotos se ajustaron porque comprobaban lo que esta tanda cambia a propósito (la regla de la foto de la zona ya no existe; `fotos_rechazadas` pasa de 10 a 12 sitios con los dos Museos Vaticanos). `tsc -p tsconfig.app.json` limpio.
- El peso al abrir no cambia: **708,4 KB de JavaScript, 315,1 KB de descarga** (igual que en la 8B2).

## Riesgos
- **Sigue sin probarse en un móvil real** ni con Supabase real (cámara, permisos, galería con datos de cámara, `navigator.share`, vibración, audio).
- **Sin cobertura, el Visto queda en la cola y no hay tarjeta** hasta que vuelve la señal (es lo que pediste: nunca un texto que cambie), así que durante ese rato la persona no ve confirmación de pedazo o emblema.
- **La ronda única espera 0,9 s** a juntar el [Visto] y la foto antes de enseñar las sorpresas; si la foto tarda más, saldrán en otra ronda.
- **Cinco sitios importantes sin foto propia** (arriba): hasta que las busquemos, la ficha enseñará el cuadrado de color en esos sitios.
- **El modo de pruebas** da números fijos para otros sitios (Trevi, Foro…) según el orden en que se toquen; para series nuevas hay que partir de `__demo.reiniciar()`.
- **Los ayudantes editan en paralelo y Vite recarga la página**: al repetir una captura hay que volver a crear el viaje con `__rutaPrueba()`.

## Lo que sigue anotado
- La película de «El final de las 7 maravillas» (solo sale con la séptima maravilla).
- Lo de la 8c y las cuentas, parte 3, como en el informe de la 8B.
