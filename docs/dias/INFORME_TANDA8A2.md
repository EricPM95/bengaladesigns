# Informe: Tanda 8A2, los arreglos tras la 8A y lo que decidió Eric

17-oct-2026. Sin pantallas, todo detrás de los interruptores de siempre (apagados). **No se ha tocado el motor de rutas.** El detalle de las reglas está en `APUNTES_TRAS_TANDA7.md` §33 y `REVISION_DESIGN_PASO3.md`.

## Qué he cambiado (en una frase por punto)
1. **Patrimonios:** el Centro histórico de Roma cuenta para todo lo que queda dentro de las murallas (82 sitios de nuestros datos, no solo los de las colecciones).
2. **El Vaticano es capital** (`capital: true` en sus tres sitios).
3. **Día de prueba nuevo:** una prueba de HOY por cuenta, para siempre; el día se elige por la hora de llegada; se gasta solo al usar HOY; la pregunta de las 12:00.
4. **Pase:** los precios en un solo archivo (1 persona 6,99 €, Dúo 10,99 €, Grupo 4,99 € cada uno), y paga todo el que compra.
5. **Recomendaciones:** fuera «ya no encaja»; el administrador siempre puede aceptar; si el día ya no existe, elige día; ya se puede «cambiar una parada por otra».
6. **«Sustituir el anterior» no borra:** el viaje de antes pasa a «Viajes guardados».
7. **Miniaturas** WebP de las 92 fotos propias de Roma.
8. **Lo que faltaba de la 8A:** `/admin/logros` en Vercel, el paquete `web-push` y el script de las claves VAPID.

## 1. Los Patrimonios, sitio por sitio
**Fuente:** la ficha de la UNESCO del Centro histórico (ficha 91), según me has pasado: abarca «todo el centro histórico de Roma dentro de las murallas, en su extensión máxima del siglo XVII» (las aurelianas y las de Urbano VIII en el Janículo, que cierran Trastevere). La Basílica de San Pablo Extramuros entra en la misma ficha, pero **no está en nuestros datos** (la prueba lo comprueba; cuenta el día que se añada).

**Cómo lo he hecho:** he comparado las coordenadas de nuestros 94 sitios con un contorno aproximado de esas murallas y he revisado a mano los que quedaban en el borde o en el Janículo y el Borgo, donde mi contorno era el más tosco. Los datos están en `data/logros/roma.json › patrimonios` (la lista `sitios` de cada Patrimonio y, en el Centro histórico, el motivo de cada uno en `motivos`). Un sitio solo puede estar en un Patrimonio.

**Cuentan para el Centro histórico de Roma (82):** Coliseo, Foro Romano y Palatino, Fontana de Trevi, Panteón, Piazza Navona, Plaza de España, Castillo de Sant'Angelo, Trastevere y todo lo demás de dentro de las murallas, esté o no en una colección. La lista completa está en el archivo; los casos dudosos, que he decidido así:

| Sitio | Decisión | Por qué |
|---|---|---|
| Mirador del Janículo, Fontana dell'Acqua Paola | Cuentan | Están dentro de las murallas de Urbano VIII del Janículo (mi contorno los dejaba en el borde) |
| Terraza del Pincio, Jardines del Pincio, Santa Maria del Popolo, Piazza del Popolo | Cuentan | El Pincio y la plaza quedan dentro de la muralla (el Muro Torto va por la parte de abajo, al norte) |
| Mercado de Testaccio, Testaccio | Cuentan | Testaccio está entre el Tíber y la muralla |
| Pirámide Cestia, Porta Pinciana, Cementerio Protestante | Cuentan | Están en la propia muralla o pegados a ella (la Pirámide forma parte de la Porta San Paolo) |
| Via della Conciliazione, Borgo Pio | Cuentan | El Borgo queda dentro de las murallas leoninas/urbanas (la ficha incluye lo de la Santa Sede hasta la Plaza de San Pedro) |
| Basílica de San Juan de Letrán, Santa María la Mayor, Termas de Caracalla, Circo Máximo, Domus Aurea, Colle Oppio, Monti | Cuentan | Dentro de las aurelianas |

**Cuentan para la Ciudad del Vaticano (5):** Museos Vaticanos y Capilla Sixtina, Basílica de San Pedro, Cúpula de San Pedro, Plaza de San Pedro y los 100 Presepi (la exposición va bajo las columnatas de la Plaza). Es otro Patrimonio (ficha 286): no se repiten en el del Centro histórico.

**Dejados fuera (7):**

| Sitio | Motivo |
|---|---|
| Galería Borghese | Fuera: Villa Borghese queda fuera de la Porta Pinciana (lo dijiste tú) |
| Parque de Villa Borghese, Bioparque de Roma, Galería Nacional de Arte Moderno | Fuera de las murallas (dentro de Villa Borghese) |
| Quartiere Coppedè | Fuera de las murallas |
| Catacumbas de San Calixto | **Por comprobar** (siguen igual): están en la Vía Apia y no he podido confirmar que sean un componente de la ficha 1708 |
| Via Appia Antica | **Por comprobar**: es el camino de la ficha 1708, pero no he podido confirmar qué tramos entran. No te lo había pedido, pero estaba en los datos |

**Lo que he tenido que hacer además:** hasta ahora solo contaban para el país, la capital y el Patrimonio los 37 sitios de las colecciones. Un Visto en, por ejemplo, la Villa Farnesina no daba «Italia». Ahora **cualquier sitio de nuestros datos cuenta**: Italia por defecto y el Vaticano para sus 5 sitios (`pais_defecto`, `capital_defecto` y `excepciones_pais` en `roma.json`). El contorno de las murallas es **aproximado**: si ves un sitio mal clasificado, se cambia de lista en `roma.json`.

## 2. El Vaticano es capital
`capital: true` en los tres sitios del Vaticano (y en su excepción de país). Con eso, hoy se pueden conseguir 2 capitales (Roma y el Vaticano); el logro de Capitales sigue sin verse porque empieza en 5.

## 3. El día de prueba, con la regla nueva
- **Una por cuenta, para siempre** (tabla `hoy_prueba`, una fila por cuenta). Si ya la gastó, en Roma o donde sea, no hay otra: la prueba lo comprueba con un segundo destino.
- **Qué día es** (`server/logros/pase.js`, valores en `data/pase/ajustes.json`): sin llegada puesta, el día 1; si el día de llegada queda libre antes de las 10:00, ese día; si no, el primer día siguiente que lo esté (normalmente el 2); y si ninguno lo está, el día con más horas libres. «Libre» = llegada + 90 minutos de traslado y maleta; el último día acaba 3 horas antes del vuelo; para contar, un día tiene que dejar al menos 2 horas útiles.
- **Se calcula cada vez mientras no se gasta**, así que si pone o cambia el vuelo, se recalcula solo (probado con llegada a las 7:00, a las 14:00, sin vuelo, 2 días con llegada tarde y el vuelo puesto después).
- **Se gasta solo al usar HOY de verdad:** al tocar [Visto] o [Cómo llegar] (`POST /api/pase/prueba/usar`). Abrir HOY y cerrarlo no guarda nada.
- **La pregunta de las 12:00:** la primera vez que usa HOY en su día de prueba a partir de las 12:00 (hora de Roma) el servidor responde `pregunta_medio_dia` con el texto «Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?» y las opciones [Hoy] y [Mañana], **sin gastar nada ni guardar el Visto**. La respuesta va a `POST /api/pase/prueba/responder`:
  - **[Hoy]:** gasta la prueba y avisa de que el móvil tiene que volver a mandar el Visto (`reenviar_vistos`);
  - **[Mañana]:** la pasa al día siguiente del viaje, la apunta como aplazada y dice que lo de hoy se gana mañana con «Lo de ayer también cuenta» (las fotos de la galería de hoy valen ese día). Si no queda ningún día en el viaje, no se hace la pregunta y se gasta directamente.
  - Solo se pregunta **una vez en la vida**.
  La pantalla (P10) llega con Design.
- **Si ya la usó y abre HOY sin pase:** `GET /api/pase/estado` devuelve `hoy.puede: false` y `tarjeta: 'pase'` (la pantalla 12), sin alertas.
- **`puedeGanarLogros`** conserva el contrato y ahora entiende la prueba gastada / pendiente. Con el cobro apagado, siempre sí.
- **Una decisión mía:** la prueba es del primer viaje (por fecha) al que todavía no le ha pasado el último día. Y las fotos de la galería cuentan por el día en que se SUBEN (el día de prueba o con pase), no por el día en que se hicieron: es lo que hace funcionar «Lo de ayer también cuenta».

## 4. El pase: precios y quién paga
- `data/pase/precios.json`: 1 persona **6,99 €**; Pase Dúo **10,99 €** (13,98 € tachado, 5,50 € cada uno); Pase Grupo (3 a 50 personas) **4,99 € cada uno**. Fuera el escalón de 5 o más a 3,99 €. `GET /api/pase/precios` y `POST /api/pase/precio` los dan.
- **Paga todo el que compra** (`repartoDelPago`): el invitado entra con su plaza sin pagar nada. **No había nada hecho para que cada uno pague su parte** (el cobro no existe aún), así que no hay nada que quitar; la prueba comprueba que tampoco se ha puesto.
- **En la base de datos no he puesto reglas de plazas por tipo de pase:** `preparar_borrado` (de las cuentas) baja las plazas de un pase cuando alguien se borra, y una regla chocaba con eso. Las plazas y el precio de cada pase los valida el servidor al crearlo.
- El cobro sigue apagado.

## 5. Recomendar cambios: fuera «ya no encaja»
- El estado `ya_no_encaja` **ya no existe**, ni en el código ni en la base de datos (la migración pasa a «pendiente» las que hubiera).
- **El administrador siempre puede aceptar** (`resolverRecomendacion`): lo recomendado **sustituye a lo que tiene ahora**. Lo que ya está hecho (quitar algo que ya no está, añadir algo que ya está) se acepta sin hacer nada y lo dice.
- **Si el día de la recomendación ya no existe**, la aplicación **no la aplica sin que elija día**: devuelve `necesita_dia` con los días entre los que elegir y espera `diaElegido`. (La aplicación de una recomendación es del propio móvil del administrador, con las acciones de siempre; no hay un servidor entre medias que lo pueda hacer cumplir. La pantalla provisional ya enseña los días para elegir.)
- **El «antes» es la ruta de ahora** (`vistaPrevia`): por días, solo los que cambian, con lo que sale y lo que entra (R2). Vale para una parada, un día o la ruta entera.
- **La varita sigue funcionando:** las acciones guardan la copia del día antes de cambiarlo (probado con «Recuperar este día» y «Recuperar mi ruta» tras cada tipo).
- **Los tres tipos:** una parada (quitar, mover, añadir y **cambiar una por otra**, que no estaba y ahora sí), un día (el día entero nuevo: sirve para añadir o quitar paradas y cambiar el orden) y la ruta entera.

## 6. «Sustituir el anterior» no borra
Dato nuevo: `trips.guardado_en` (migración 0024). `viajesQueSePisan` dice qué viajes se pisan (mismo destino y fechas que se tocan, sin contar los ya guardados aparte ni los de otra persona), `guardarViajeAparte` le pone la fecha (no borra nada) y `separarViajes` separa «Mis viajes» de «Viajes guardados». La lista de viajes lee ese dato solo con las cuentas encendidas. Los logros del viaje guardado se quedan. La pantalla la dibuja Design.

## 7. Las miniaturas
`node scripts/generarMiniaturas.mjs roma` saca de cada foto propia una miniatura **WebP de 144 × 144 px** (se ve bien a 48 px en pantallas 3x), recortada al centro, desde la versión de tarjeta de 640 px. Van en `public/fotos/roma/mini/`.
- **92 miniaturas**, **393 KB en total**, **4,3 KB de media** (la más pequeña 1,1 KB, la mayor 7,2 KB).
- El servidor manda la dirección en `photo_mini` junto a `photo_url` y `photo_small`, y `urlMiniatura()` (`src/lib/miniatura.ts`) la saca de la de la foto grande o pequeña. Las pantallas que la usen son de Design.

## 8. Lo que faltaba de la 8A
- **`/admin/logros` en Vercel:** regla de reescritura en `vercel.json` (`/admin/logros` → `/index.html`). Es un archivo del repositorio; no he tocado ningún ajuste de Vercel. `/?admin=logros` sigue valiendo.
- **`web-push`:** añadido como dependencia; solo se carga con `PUSH_ACTIVO=true`, así que apagado no cambia nada. (`sharp` entra como dependencia de desarrollo, para las miniaturas.)
- **Claves VAPID:** `node scripts/generarClavesVapid.mjs` las crea y las escribe en `.env.local` (git lo ignora), **sin enseñarlas** en la consola ni en ningún archivo; si ya hay, no las pisa (`--forzar` las cambia). Ya las he generado en este equipo. Hay una ruta para la clave pública (`GET /api/logros/push/clave`), que solo responde con el envío encendido.
- **Nombres que tiene que poner Eric en Vercel** (Settings → Environment Variables, con los mismos valores que salen en `.env.local`; ábrelo tú y cópialos):
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_CONTACTO` (un `mailto:` con un email tuyo; en `.env.local` está con un aviso para que lo cambies)
  - `PUSH_ACTIVO=true`, solo cuando esté la pantalla del permiso.

## Migraciones nuevas, sin aplicar y su orden
Solo una: **`0024_prueba_pase_y_guardados.sql`**. Va **después de la 0023**: el orden de todas las pendientes es **0020 y 0021 juntas → 0022 → 0023 → 0024**. Crea `hoy_prueba`, la columna `trips.guardado_en`, quita el estado «ya no encaja» y deja `reclamar_anonimo_logros` pasando también la prueba. No hace falta aplicarla hasta que se quiera probar con cuentas.

## Lo que tiene que hacer Eric fuera del código
1. Aplicar la 0024 después de la 0023 (SQL Editor de Supabase).
2. Poner en Vercel las variables VAPID (arriba) cuando toque; cambiar `VAPID_CONTACTO` por su email.
3. Mirar la lista de Patrimonios (sobre todo Via Appia Antica y las Catacumbas, que siguen por comprobar) y avisarme si algún sitio está mal clasificado.
4. Cuando se quiera cobrar (parte 3 de las cuentas): `PASES_COBRO_ACTIVO=true`. Sin eso, todo sigue abierto.

## Riesgos
- **El contorno de las murallas es aproximado** (coordenadas, no el mapa oficial de la UNESCO). Lo he revisado a mano en los casos dudosos, pero conviene que lo mires.
- **«Libre» el día de llegada** usa 90 minutos fijos tras la hora del vuelo (valor en `data/pase/ajustes.json`): para un aeropuerto lejano o una estación puede ser poco o mucho.
- **La prueba solo conoce los destinos con logros** (hoy Roma): un viaje a un destino sin datos de logros no entra en la cuenta de «una por cuenta» hasta que lo tenga.
- **Un Visto que llega tarde** (sin cobertura) no hace la pregunta de las 12:00: gasta la prueba directamente.
- **No lo he probado con Supabase de verdad**, solo con un Postgres real (PGlite) y las migraciones reales.
- **Aceptar una recomendación no tiene servidor en medio:** que se pida el día cuando falta lo cumple la aplicación del administrador, no la base de datos.
- **`pruebaCuentas1`:** he cambiado sus comprobaciones de «ya no encaja» por las de «siempre se puede aceptar» (es lo que pedías) y ahora carga también las migraciones 0023 y 0024.

## Pruebas
`pruebaLogros1`: **330 comprobaciones, 0 fallos** (+73: Patrimonios, el Vaticano capital, el día de prueba en todos sus casos, la pregunta de las 12:00 con [Hoy] y con [Mañana], la segunda prueba en otro destino, los precios y el pago, las rutas nuevas). `pruebaLogros2`: **45 comprobaciones, 0 fallos** (+22: «Sustituir el anterior» sin borrar, miniaturas, Vercel, `web-push`, el script de las claves sin enseñarlas). `pruebaCuentas1`: **314 comprobaciones, 0 fallos** (la recomendación sobre una ruta que cambió y sobre un día que ya no existe, con la varita). Batería rápida: 72 pruebas, ninguna mal. `tsc -p tsconfig.app.json` sin errores.
