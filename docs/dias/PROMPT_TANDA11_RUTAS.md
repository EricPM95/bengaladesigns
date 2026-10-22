Hola. TANDA 11: LOS ARREGLOS DE LAS RUTAS DE ROMA (PARTE A, SIN VUELOS) Y LA PÁGINA DE LOS VIAJES LARGOS. Eric ha revisado las 126 rutas de RUTAS_REVISION.html y hemos decidido qué cambiar. Esta tanda **sí toca el motor**.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA11_RUTAS.md.
- En docs/dias están dos archivos de Claude (ya subidos a main en la 10D; Claude ha puesto al día NOTAS_REVISION_RUTAS.md con los puntos C5 a C9, el día en blanco y la revisión de los de 2 días, así que inclúyelo en tu commit). Léelos enteros antes de tocar nada:
  - **NOTAS_REVISION_RUTAS.md**: cada caso, con la ruta donde se ve, lo que sale, el porqué y lo decidido;
  - **REGLAS_PARA_DESTINOS.md**: las mismas reglas escritas para cualquier destino.
- **Nada de parches:** cada arreglo, como una regla sencilla del motor o como un dato del día escrito, que valga para todas las rutas y para los destinos siguientes. Si algo solo se puede arreglar con un caso suelto, dímelo antes.

## 1. Lo que hay que arreglar: la PARTE A de NOTAS_REVISION_RUTAS.md
Todos los puntos de la Parte A, del 0 al 14 (el 15 va en la Tanda 10B; si ya está hecho, no lo repitas). En resumen:
- **0.** La comida: no se recorta nada para adelantarla mientras empiece como tarde a las 15:00.
- **1 y 2.** La Basílica de San Pedro: nunca desaparece ni va «por fuera» por la comida; con la Cúpula, una sola visita, «Cúpula de San Pedro y Basílica por dentro». Y ningún otro imprescindible puede desaparecer ni quedarse en una línea del trayecto.
- **3.** 2 días con Free Tour: el Gueto se queda (con la comida allí si encaja), el Janículo después de cenar en Trastevere y el Tempietto fuera de la noche.
- **4.** Cualquier parada por fuera: un solo aviso que diga por qué, sin «entra» ni «Reserva recomendada»; el Tempietto cerrado pasa siempre a «El mirador de San Pietro in Montorio», y el mirador no cierra nunca: sin «Cerrado este día» ni «Hoy cierra» (hoy los lleva en 3 rutas de 2 días; mira si pasa con otros miradores o plazas); las reservas del viajero mueven la parada a su día o avisan si ese día cierra, y se guardan igual.
- **5.** Quitar de la página de revisión los dos falsos avisos (Villa Borghese y el Reloj de agua; Santa Maria Maggiore).
- **6.** Del Mirador del Janículo y San Pietro in Vincoli, mirar si hay bus o un camino más corto; si no, se queda.
- **7.** «Se ve dentro del Free Tour», solo en el día del Free Tour, y nunca en rutas sin Free Tour (en los viajes largos sale 651 veces en A, B y C).
- **8, 9, 10 y 11.** El orden de los días: Roma antigua el primer día, el Vaticano en el medio, al final el día que se añade (en 4 días, Basílicas y el Aventino); qué manda cuando chocan (primero los cierres; luego, el Vaticano no el último día; luego, Roma antigua el día 1); al elegir el día cuentan los cierres de todas las paradas, pero poco los que se ven por fuera; un día con versión para ese día de la semana no cuenta como malo; D5 necesita su versión de lunes (Caracalla, los lunes, solo de 9:00 a 14:00).
- **12.** Los datos de horarios: los Museos Capitolinos abren los lunes; San Luigi dei Francesi cierra a las 18:30; Santa Maria in Aracoeli no cierra de martes a domingo (compruébalo en su web oficial). Y busca más sitios donde la ficha y el motor no digan lo mismo.
- **13.** Dentro de una zona, primero lo que cierra antes y al final lo que no cierra, probando un rodeo pequeño antes de dejar que algo llegue cerrado (Argentina → San Luigi → Panteón → Gesù → Navona).
- **14.** El día de vuelta sin vuelo sigue sin paradas. Y confirma cómo cuenta los días la página de revisión frente a la app (en la página, «3 días» ¿es el viaje de 3 noches de la app, con el día de vuelta aparte?).
- Lo que dice «que Code mire…» o «que Code diga…» en cada punto, dímelo en el informe.

## 2. Lo de la PARTE C que ya está decidido
- **C8 (sustituye a C2, C5, C6 y C7):** Roma lleva 5 días de Roma curados (Roma antigua, Vaticano, Centro y Villa Borghese, Basílicas y el Aventino, la Vía Appia). Desde el 6.º día de Roma, día en blanco, como del 7.º en adelante. Roma desde arriba no sale por defecto (se queda en los datos). Si un cierre no deja la Vía Appia en su día, se cambia con Basílicas y el Aventino (nunca con los tres primeros), para que el día en blanco quede siempre después de los 5 días de Roma; solo si tampoco se puede, con el día en blanco (dime en cuántas rutas pasa). Con sus cierres y la luz de invierno (C5: nunca en bici por la Vía Appia a oscuras).
- **El día en blanco** (6.º de Roma y siguientes) es **el mismo que ya tenemos del 7.º en adelante**: al abrirlo, la hoja «Ya has visto lo mejor de Roma» («A partir de aquí, el viaje lo eliges tú…») con [Elegir mis sitios] (`ExtraDaySheet`). Debajo, pequeño, «¿Te lo organizamos? Roma desde arriba», que monta ese día con Roma desde arriba, solo si el viajero lo elige. En el día, [+ Añadir parada] y la excursión sugerida, como ahora.
- **C9.** La Cúpula, parada solo con Naturaleza y Vistas; sin ella, en la ficha de la Basílica, «¿Te quedan fuerzas? Sube a la Cúpula: Roma entera a tus pies» [+ Añadir], y si la añade, Cúpula y Basílica por dentro en una sola visita.
- **Los nombres de los días:** que cada día salga con el nombre de su día escrito (hoy la Vía Appia sale como «Roma antigua» en la app; C4).
- **C3.** En 4 días con excursión, la excursión se queda el día 4.
- La Parte B (llegadas y salidas) **no** va en esta tanda.

## 3. Las páginas
- **RUTAS_REVISION.html, de nuevo**, con las mismas 126 rutas y el motor arreglado, sacadas igual que la otra vez (la misma petición que la app y el mismo camino del servidor). Añade un selector «Qué ha cambiado» que marque, en cada ruta, lo que cambia respecto a la página anterior, para que Eric revise solo eso.
- **RUTAS_REVISION_LARGOS.html, de nuevo**, con el motor arreglado y el mismo selector «Qué ha cambiado».
- Los datos de las dos, también en JSON, como la otra vez.

## 4. La prueba
- **Toca el motor:** la batería rápida, la muestra de 60 fechas, push, y después las 365 con `_correr6y5.mjs procesos=12`.
- Pruebas nuevas, una por punto, que fallen con el motor de antes y pasen con el nuevo (por ejemplo: la Basílica nunca desaparece en las 126 rutas; ningún imprescindible queda como línea del trayecto; el Gesù llega abierto en esa ruta; en 4 días empezando el viernes, el Vaticano va el sábado; no quedan avisos repetidos en las paradas por fuera).
- Comprueba que lo que sale en la página es lo mismo que enseña la app en 3 rutas: 3 días A empezando el lunes, 2 días D empezando el sábado y 4 días F empezando el domingo.

## 5. El informe (docs/dias/INFORME_TANDA11_RUTAS.md)
En español sencillo, punto por punto: qué has cambiado, cuántas rutas cambian, lo que te pedía mirar cada punto y lo que no has podido arreglar y por qué. Y, aparte, las 10 cosas más raras que veas en la página de los viajes largos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
