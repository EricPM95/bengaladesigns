Hola. TANDA 10R: LAS EXCURSIONES DE ROMA, CON SUS ENLACES Y SUS DATOS DE VERDAD, Y EN RESERVAS COMO LAS ENTRADAS (prompt del 26-oct, puesto al día el 31-oct). Va después de la 10S8 (ya hecha).

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10R.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Migraciones aplicadas por Eric: todas hasta la 0073 (si al empezar `COMPROBAR_0073.sql` no te consta, pregúntaselo).
- **Cómo trabajar (Eric quiere esta tanda rápida):** los 4 agentes a la vez, repartiendo los apartados; un solo servidor; hasta 2 Chrome de prueba a la vez. Nada de batería completa: solo las pruebas de lo tocado y `pruebaJutrip`. Si un apartado se complica, déjalo a medias, dímelo y sigue. Dime al empezar cuánto calculas que vas a tardar. La nota de estado (`docs/dias/_estado_10r.md`) a la rama `estado` cada 30 minutos, de principio a fin. No apagues el PC.
- **Lo de Design, exactamente igual (Eric, 26-oct: «nos gusta mucho»).** Cada pantalla de Design que nombra esta tanda se hace igual que en su pieza: medidas, márgenes, colores, letras, iconos, sombras, textos y animaciones. Nada «parecido» ni a tu manera. Solo cambian los datos de ejemplo (usa los de verdad) y lo que este prompt diga expresamente que cambia. Si algo no se puede hacer igual en la web o en el iPhone, dímelo antes y no lo cambies por tu cuenta. En el REPASO de esta tanda, cada captura al lado de la de Design, para compararlas. Y cualquier menú de opciones nuevo, con el formato de tarjetas de la 10N4 (apartado 3), para que la app sea siempre igual. Los nombres de las personas, siempre con la primera letra en mayúscula y el resto en minúscula («Viajes», no «VIAJES»), y espacio claro entre bloques distintos (10N5).
- No toques el motor de rutas, salvo lo que haga falta para que Venecia salga como excursión de un día igual que las demás (si es así, dímelo antes y pasa la muestra de 60 fechas).
- Lo ha comprobado Eric el 26-oct en la web de Civitatis. Hoy, en `roma.json › excursions.options`, los precios «desde» son aproximados y están muy lejos de los reales (Nápoles y Pompeya en tren sale «desde 55 €» y cuesta 139 €), y cinco enlaces no se resolvían porque sus nombres han cambiado.

## 0b. Respuestas a tus dudas de la 10S8
- **Leer documentos exige el pase siempre: hecho** (commit 28328327). **Falta que la pantalla diga lo mismo que el servidor:** hoy, con el cobro apagado, los botones de añadir documento salen **sin candado** y el que no tiene pase elige el archivo para nada (el servidor le dice que no). **El candado de los documentos depende solo de tener el pase, no del cobro:** sin pase, candado y aviso pequeño, también con el cobro apagado. Pasa otra vez `pruebaTanda10S8` (A a D) y `pruebaJutrip`.
- **«Y N sitios más…»:** son **todas** las paradas de ese día que no caben (imprescindibles o no), no solo los imprescindibles: nada pasa a «Si te sobra tiempo» sin que se diga.
- Lo demás, como lo has dejado: sin tarjeta no hay fila de datos (los datos llegan con el documento, que es del pase); la papelera de la entrada con Deshacer; el título a 19 px; «Falta la zona» con pase; la pregunta de la hora solo cuando el documento trae la hora.
- **El prompt de la 10S8 te llegó cortado** (Eric lo pegó entero, pero se perdió el final). Lo que faltaba no cambiaba nada. Este acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## 1. Los enlaces buenos (`civitatis_slug`)
- pompeya_sorrento → `excursion-pompeya-sorrento`
- napoles_pompeya_tren → `excursion-pompeya-tren`
- florencia_pisa → `excursion-florencia-pisa`
- costa_amalfitana → `excursion-amalfi-positano`
- tivoli_villas → `excursion-villa-adriana-villa-este`
- florencia_tren → `excursion-florencia`
- **venecia_tren (nueva)** → `excursion-venecia`
- Ostia Antica, como está.
Con ellos, vuelve a pasar `GET /activities/resolve` en el sandbox y dime cuáles se resuelven ya y con qué número de actividad.

## 2. Los datos de hoy (26-oct-2026), hasta que la API los traiga
| id | Nombre (el de Civitatis) | Desde | Nota | Opiniones | Duración | Cancelación |
|---|---|---|---|---|---|---|
| pompeya_sorrento | Excursión a Pompeya y Sorrento | 98,26 € | 8,3/10 | 793 | 12-13 h | Gratuita |
| napoles_pompeya_tren | Excursión a Nápoles y Pompeya en tren de alta velocidad | 139 € | 8,7/10 | 343 | 12 h | — |
| florencia_pisa | Excursión a Florencia y Pisa | 95,40 € | 8,6/10 | 704 | 14 h | Gratuita |
| costa_amalfitana | Excursión a la Costa Amalfitana en autobús + Barco a Positano y Amalfi | 115 € | 7,9/10 | 60 | 15 h 30 | Gratuita |
| tivoli_villas | Excursión a Tívoli | 118,80 € | 8,7/10 | 725 | la de ahora (dime si la API da otra) | Gratuita |
| florencia_tren | Excursión a Florencia en tren de alta velocidad | 149 € | 8,6/10 | 689 | 12 h 15 - 13 h | **No reembolsable** |
| venecia_tren | Excursión a Venecia en tren de alta velocidad | 243,95 € | 9,0/10 | 315 | 15 h | Gratuita (hasta 24 h antes) |
- Apunta en cada una «comprobado: 2026-10-26 (Eric, web de Civitatis)».
- **La nota, sobre 10, tal como la da Civitatis**, y ahora sí se enseña (ya no es aproximada).
- **Fuera los tachados escritos a mano:** solo salen si los trae la API.
- **Debajo del precio, en pequeño: «Precio orientativo»**, mientras no venga de la API. Con la API, el de verdad, sin esa línea.
- **«No reembolsable»**, bien a la vista en la tarjeta y en la ficha de Florencia en tren (en el estilo de un aviso, no escondido).
- Fuera `provisional_pricing` en todas: ya no son aproximados.

## 2b. Las fotos de las excursiones, las de Civitatis (permiso confirmado, 31-oct)
- **Eric tiene permiso de Civitatis (Magalí) para enseñar en la app las fotos que vienen en su API.** Las de cada excursión, en su tarjeta y en su ficha.
- El sandbox ya da las fotos (`fotosDe(a.photos)` en `server/civitatis/mapeo.js`). Comprueba, con cada una de las siete excursiones resueltas: que son las mismas fotos que se ven en la web de verdad de esa excursión, y que vienen de sus servidores públicos (no de `qa.`). **Si es así, úsalas ya para todos** (no solo para el administrador), tal como vienen y sin cambiarlas, guardando la dirección de la foto en nuestros datos con la fecha. Si alguna no cuadra o es de pruebas, esa sigue con la nuestra (licencia libre, con su crédito) y me lo dices.
- Las fotos son de Civitatis, pero en la app nunca sale su nombre.

## 3. Venecia, nueva
- Como las demás: su foto (la de Civitatis, como en el 2b; si no se puede, una con licencia libre y su crédito), sus coordenadas, el punto de encuentro (dime cuál da Civitatis o la API) y una descripción corta nuestra, en el estilo de las demás (sin copiar la de Civitatis).
- Sale en la lista de Excursiones y donde salen las demás.

## 4. Las excursiones en RESERVAS, como las entradas (regla nueva, 31-oct)
- Una excursión reservada es, en la práctica, una entrada grande: **en RESERVAS, igual que las entradas de la 10S8** (`Piezas/Entradas Billete` E1 a E5), con las mismas piezas y el mismo estilo:
  - el nombre grande, el día y la hora en sus dos cuadros («Sábado / 28 de noviembre», «07:30»), para quién (en redondo), el precio, los dos lápices y la papelera roja abajo a la derecha;
  - **el documento (el billete de la excursión), solo con el pase**: [Añadir tu excursión] con el candado dorado sin pase y su aviso pequeño («Con el Pase Roma, guardas el billete de tu excursión y lo tienes a mano en el punto de encuentro, aunque no haya internet.» [Ver el Pase Roma]); con el pase, sin candado, y al añadirlo, el localizador, el código con «Toca para ampliar» y «Datos de la excursión» con su lápiz. Pasa por `read-ticket` con la sesión, el pase y el límite de la 10S8;
  - **el punto de encuentro** (con el pase: [Cómo llegar al punto de encuentro], como el del alojamiento);
  - en HOY, con el pase, el día de la excursión: «Tu excursión» con su código, como «Tu entrada».
- Lo de las fechas enteras, los cuadrados para elegir el día, la cabecera sin línea debajo del título y el bloque en claro, como en el resto de RESERVAS. Lo que no dibuja Design, con estas piezas.
- **El día de la excursión no cambia de sitio** al reservarla: como hasta ahora (regla 6j), sin mover nada más.

## 5. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip`, en 0 fallos. Si tocas el motor (Venecia), la muestra de 60 fechas.
- Añade a `pruebaCivitatis1` (o una nueva `pruebaTanda10R`): los siete enlaces; los datos de la tabla; sin tachados a mano; «Precio orientativo» sin la API y sin él con la API; «No reembolsable» en Florencia en tren; Venecia en la lista; las fotos de Civitatis en las siete (o la nuestra, si no cuadra); la excursión en RESERVAS como una entrada (sin pase, el candado y su aviso; con pase, el billete y «Tu excursión» en HOY); la papelera.
- Capturas de la lista de Excursiones, de dos fichas (Venecia y Florencia en tren) y de la excursión en RESERVAS (sin pase y con pase) en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10R.html`, a tamaño de móvil.

## 6. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10R».

**Al final del informe, la lista de comprobación DE ESTA TANDA** (comprueba que no es la de otra). Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10R.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
