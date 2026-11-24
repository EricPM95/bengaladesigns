Hola. TANDA DE NOCHE (24-25 nov): EL REPASO DE DISEÑO, UNA SOLA FORMA PARA CADA COSA, TODAS LAS PRUEBAS Y EL CATÁLOGO DE AVISOS. Eric deja el PC solo toda la noche: haz las cuatro partes seguidas, sin esperar a nadie. Empieza SOLO cuando la V50 esté subida a main. Este prompt acaba con «apaga el PC»: si no te llega hasta ahí, dímelo antes de empezar.

**Esta noche puedes usar hasta 4 agentes a la vez** si hay 6 GB de memoria libre o más (con menos, 2). **Nunca más de 2 Chrome de prueba a la vez.** Un solo servidor de la app, compartido. **No apagues el PC hasta el final** (ahí sí, Eric lo pide en este prompt). Nota `_estado_noche.md` en la rama `estado` al empezar y cada 30 minutos. Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. No abras los `.env*`. **Nunca se quita nada que funcione y nunca se inventa un diseño** (CLAUDE.md).

# PARTE 1 · El repaso de diseño (antes era la V51)
**Los dibujos:** `docs/diseno/proyecto/` (de `NUEVO_DISEÑO`). Para cada pantalla de la lista: captura del dibujo y de la app en modo iPhone (375 px) con datos reales, y se ajustan colores, tamaños, márgenes, tipografía, iconos, orden y textos fijos. **Design es un prototipo:** no se copian los datos de ejemplo, ni se quita lo que el dibujo no enseña, ni lo marcado con «OJO». Si algo no está claro, a DECISIONES.

**TODA LA APP: el cuadrado de la fecha, uno solo (regla nueva en CLAUDE.md)**
0. Donde salga una fecha en un cuadrado de calendario, **el mismo cuadrado en toda la app**, como el «JUE 26» del dibujo A2 (`NUEVO_DISEÑO`): **fondo azul oscuro, el día de la semana pequeño en mayúsculas y el número grande, los dos en dorado**. Una sola pieza (por ejemplo `CuadradoFecha.tsx`), usada en todas partes: la lista de «Pasar a otro día» (hoy en beige), las hojas de HOY, RESERVAS y donde haya más. **OJO con DÍAS:** en la lista de días los cuadrados son beige y el del día abierto, oscuro. Pásalos también al azul y distingue el día abierto con un borde dorado, y enséñalo en el REPASO. Los botones para elegir día de las hojas («Mar 24», «Jue 26») no son cuadrados de fecha: se quedan.

**HOY**
1. **La tarjeta de la parada**, antes y al llegar (`Parada Tarjeta`): las tres cajas, el recuadro de la ubicación, la historia azul, «Ya estás aquí» con la franja del pedazo y los tres botones. OJO: mientras suena la historia, se queda como hoy.
2. **«Pasar a otro día»** (`Piezas/Hoy Recorrido` 26a y el A2 del aviso de los Vaticanos): la lista de días con el recomendado en su tarjeta dorada; la hoja con **la tarjeta del sitio** (foto pequeña, nombre, cuándo en gris y la fecha en su cuadrado oscuro, que no se pulsa), la franja verde «✓ Sigue igual: el resto de tu {día}», [Pasarlo al {día}], [Elegir otro día] y [Dejarlo como está]. **La misma pieza** para Cambiar plan y para el aviso «Hoy ya no puedes entrar».
3. **«Voy con retraso»** (23a-23c), **«Quiero comer ahora»** (24a-24g) y **«Añadir un sitio cercano»** (27a-27f), en `Piezas/Hoy Recorrido`. OJO: el título de comer es «Desayunar / Comer / Cenar cerca de ti»; sin ubicación, «No tienes la ubicación activada · [Usar mi ubicación]».
4. **«Lugares pendientes»** (`Lugares Pendientes`, L1-L4). OJO: «Volver al alojamiento» se queda con su [Cómo llegar]; el «···» usa la hoja de opciones de DÍAS.
5. **Los avisos** (A1-A3, el de arriba y el de abajo con [Deshacer]).
6. **El billete** (`Billete QR`, Q1-Q4), en HOY y DÍAS.

**RESERVAS**
7. **Vuelo** (`Reservas Billete`).
8. **Alojamiento** (`Piezas/Entradas Billete` A1-A3, y el mapa, `Alojamiento Mapa` M1-M3). OJO: la zona y «¿Para quién es?» se quedan, aunque el dibujo no los enseñe.
9. **Entradas** (`Piezas/Entradas Billete` E1-E5) y **excursiones** (`Piezas/Excursion Nueva` X0-X7): la hoja (una persona y grupo) y la tarjeta guardada. OJO: «¿Para quién es?» en «Casi lista» se queda; sin [Cómo llegar al punto de encuentro].
10. **El aviso de los días que cambian** (`Entrada Cambio Dias`, E1).

# PARTE 2 · Una sola forma para cada cosa (Eric: «todo lo que lleva X, que sea la misma X»)
**OJO: la app tiene DOS mundos, y no se mezclan.** **HOY** tiene su propio estilo (sus botones, sus tarjetas y sus hojas, los de los dibujos de HOY de Design); **el resto** (RUTA, DÍAS, EXPLORAR, RESERVAS, el Perfil, los logros, el pase) tiene el suyo. **No conviertas HOY en el resto ni al revés.** Lo que se iguala es **dentro de cada mundo**: todo lo que se repite en HOY, igual en todo HOY; todo lo que se repite en el resto, igual en todo el resto. Lo que es exactamente lo mismo en los dos (por ejemplo, la X de cerrar una hoja o el cuadrado de la fecha), una sola pieza. Ante la duda, como el dibujo de Design de ese mundo.

Recorre la app y busca cada elemento que se repite. **Cada uno, UNA sola pieza y el mismo aspecto en todo su mundo:**
- **la X de cerrar** (tamaño, círculo, color, sitio) y el tirador de las hojas;
- **las hojas** (bordes redondeados, título, margen, la sombra de detrás);
- **los botones:** el dorado, el claro, el de borde, el azul oscuro, el enlace pequeño («Dejarlo como está»), el de la papelera y el lápiz;
- **el cuadrado de la fecha** (punto 0 de la Parte 1);
- **las etiquetas** («Te lo recomendamos», «En tu ruta», «Contiene recompensa», «Lo tienes el …», «Listo», «Falta»…), los iconos y sus círculos;
- **las tarjetas** (de parada, de lugar, de reserva), los avisos de arriba y de abajo, y los recuadros de puntos.

Elige como modelo el que está en el dibujo de Design más reciente de ESE mundo (si no hay dibujo, el que más se repite en ese mundo), apunta en CLAUDE.md cuál es la pieza de cada cosa (archivo y nombre) y cambia los demás. **En el REPASO, una tabla:** cada elemento, si es de HOY, del resto o de los dos, la pieza que queda, y cuántos sitios has cambiado, con alguna captura de antes y después.

# PARTE 3 · Todas las pruebas
- La batería completa (`docs/dias/COMO_CORRER_LAS_PRUEBAS.md`), a prioridad baja.
- Por cada prueba que falle: **si la prueba espera algo que cambiamos a propósito** (las V43 a V50 y esta noche), ponla al día; **si es un fallo de la app**, arréglalo sin tocar nada que funcione; **si no estás seguro**, a DECISIONES.
- Ya sabemos de `pruebaV2Hoy` (el aviso «ya ha cerrado» va arriba) y `pruebaTandaHOY2b_D` [6] (en Lanzarote, los sitios del atardecer al aire libre tienen que salir).
- Al final, la batería otra vez, hasta que esté en 0 (o solo con lo de DECISIONES).

# PARTE 4 · El catálogo de avisos y momentos (un agente aparte, en paralelo)
Los avisos y momentos que casi nunca salen. Con el día simulado de HOY y viajes de prueba, **una captura en modo iPhone de cada uno**, en `docs/dias/CATALOGO_AVISOS.html`, y al lado de cada una, en palabras sencillas: **cuándo sale**, **cuántas veces** y **si suena** (qué sonido). Como mínimo:
- el pase: el día de prueba («te queda medio día…»), la tarjeta P3, la del día 12 y la prueba gastada;
- HOY: «Hoy ya no da tiempo a todo», las fechas especiales (Navidad…), «Hoy ya no puedes entrar…», la lluvia, «Guarda tus recuerdos», «Estás lejos», «Activa tu ubicación» y los avisos de arriba y abajo;
- los logros: el pedazo, «Un pedazo nuevo», el emblema oculto, la barra de experiencia, «Y además…», la medalla y subir de nivel;
- RESERVAS: el aviso naranja de un documento, el mensaje de los días que cambian (E1), y el de «Reorganizar».
Si alguno no se puede provocar, dilo y por qué. No cambies nada de la app para hacer las capturas.

# PARTE 5 · La lista de comprobación de TODO (Eric: «tenemos que saber qué está hecho y qué no»)
En `docs/dias/CHECKLIST.md` (y en el REPASO), **una línea por cada punto que se ha pedido** en las tandas V43 a V50 (los prompts están en `docs/dias/PROMPT_TANDA*.md` o en el historial de git) y en este prompt. En cada línea:
- **✅ Hecho y comprobado en pantalla** (con el nombre de la captura), **🟡 Hecho pero sin ver en pantalla**, **⚠️ A medias** o **❌ No hecho**;
- y si no está hecho, **por qué** en una frase (no se pudo, falta una decisión de Eric, se dejó para otra tanda…).
No pasa nada si algo no está hecho: lo que importa es saberlo. **Lo que de verdad no hayas comprobado, nunca como ✅.** Las decisiones pendientes de Eric, juntas al final.

# Al final
- **El REPASO, en palabras sencillas:** qué ha cambiado en el diseño (con capturas), la tabla de las piezas, cuántas pruebas fallaban y cuáles eran de la prueba y cuáles de la app, el enlace al catálogo, y lo que queda para Eric.
- Con la batería en 0, `npm run build` sin errores, git status limpio y nada privado, haz push de main a origin, sin --force. Puedes subir al terminar cada parte, si está en 0. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo.
- Cierra los servidores de prueba, los Chrome y los agentes, y apunta cuántos había. Reinicia el api-server y sube la última nota de estado con el resultado final.
- **Y por último, apaga el PC** (Eric lo pide en este prompt; vale solo para esta noche).
