# Informe: Tanda 8A, el cerebro de los logros

17-oct-2026. No hay pantallas: solo las reglas, los datos, el servidor, lo que hace falta en el móvil para mandar los hechos y las pruebas. **No se ha tocado el motor de rutas** (nada de `shared/routeEngine` ni de `server/engine`; la prueba comprueba que los logros no los importan). Todo va detrás de un interruptor **apagado**: con él apagado la app es la de hoy, las rutas de los logros ni existen (el servidor responde 404) y `index.html` no cambia.

## En una frase
El servidor ya sabe decidir qué gana cada persona con cada Visto y cada foto (pedazos, emblemas, sellos, colecciones y los logros de viajero), lo guarda en su cuenta sin dar nunca lo mismo dos veces, y se puede volver a calcular todo desde los hechos. Falta aplicar la migración 0023 y las pantallas (8b y 8c).

## Dónde está cada cosa
| Qué | Dónde |
|---|---|
| Datos de Roma: sellos, colecciones, emblemas, sitios (radio, «foto dentro», país, Patrimonio) | `data/logros/roma.json` |
| Logros de viajero, escalones y nombres | `data/logros/viajero.json` |
| Números y listas que se pueden cambiar (plazo, horas de Madrugador y Nocturno, estaciones, orden de los momentos, frases de suspense, mensajes) | `data/logros/ajustes.json` |
| El cerebro (puro, sin base de datos) | `server/logros/motor.js` |
| Qué foto y qué Visto valen | `server/logros/fotos.js` |
| El orden de lo que sale tras un hecho | `server/logros/momentos.js` (el orden, en `ajustes.json › orden_momentos`: fácil de cambiar si Design lo pide) |
| Lo que devuelve para las pantallas (botón flotante, Logros, ficha, pasaporte, vitrina, resúmenes, «lo de ayer») | `server/logros/vistas.js` |
| El servicio (une el cerebro con la base de datos) y el simulador | `server/logros/servicio.js` |
| La base de datos con Supabase | `server/logros/repo.js` |
| Las rutas del servidor y el panel de Eric | `server/logros/rutas.js` |
| El pase | `server/logros/pase.js` |
| Los avisos (cola y envío) | `server/logros/avisos.js` |
| Migración | `supabase/migrations/0023_logros.sql` |
| En el móvil: interruptor, mandar hechos con cola sin cobertura | `src/lib/logros.ts`, `src/components/logros/LogrosPorVisto.tsx`, `src/store/useLogrosStore.ts` |
| Instalar la web | `data/marca.json`, `src/lib/instalar.ts`, `src/components/logros/AvisoInstalar.tsx`, `public/sw.js`, `public/icons/`, `GET /api/manifest.webmanifest` |
| Sonidos y vibración | `src/lib/sonidos.ts`, `public/sonidos/` |
| Panel de Eric y prueba de las fotos | `src/components/logros/AdminLogros.tsx`, `PruebaFotos.tsx` |
| Pruebas | `scripts/destino/pruebaLogros1.mjs` (257), `pruebaLogros2.mjs` (23) |

## Cómo funciona (corto)
- **El móvil manda hechos; el servidor decide.** Un Visto (con su hora y la ubicación de ese momento) o una foto (con la fecha, la ubicación si la trae y si es de una cámara). El servidor convierte la ubicación en «cerca / lejos / sin ubicación» y **no guarda las coordenadas** (la tabla ni tiene dónde).
- **Una función pura calcula todo** desde los hechos (`calcular`). Lo que se gana con un hecho nuevo es la diferencia entre calcular antes y después. Cada cosa ganada tiene una clave única, así que nunca se da dos veces; y `recalcular` vuelve a calcularlo todo y pone lo que falte (no quita nada solo; lo que sobraría se enseña en el resultado).
- **Solo en las fechas del viaje** (hora de Roma) y dentro del plazo de 30 días (el día 30 vale, el 31 no). Fuera de fechas, el Visto se marca para la ruta pero no da logros y ni se guarda como hecho.
- **Pedazo:** Visto cerca (sin foto), o foto válida. Sin ubicación: se guarda el Visto y se le dice «Activa tu ubicación o haz una foto…». Lejos: «Parece que no estás en …».
- **Emblema:** siempre con foto válida. **Madrugador y Nocturno:** foto válida en uno de los 8 imprescindibles, por su hora (antes de las 8:00; desde las 22:00, o las 19:00 en invierno: dic–feb, la definición de la Tanda 7).
- **Foto válida:** de la cámara de la app, o de la galería si es de una cámara, con la fecha dentro del viaje y, si trae ubicación, en el sitio. Los mensajes son los del encargo («Esta foto es del 2 de septiembre. Elige una del 10 al 14 de octubre.»…).
- **Deshacer:** antes de la foto quita lo ganado solo con el Visto; con foto, no se puede (`con_foto`).
- **Sin cobertura:** el móvil guarda el Visto con su hora y lo manda al volver la señal (`vaciarCola`); la hora que cuenta es la del Visto.
- **Viaje compartido:** cada persona, sus Vistos y sus logros. Con el Pase Dúo el viaje es «en pareja» para los dos.
- **Entre viajes:** el avance de colecciones y sellos se suma; el segundo viaje a la misma ciudad da «Nunca es la última vez».
- **Entrar con una cuenta que ya existía:** `reclamar_anonimo_logros` (en la 0023) pasa los hechos de la sesión anónima antes de borrarla; `server/cuentas.js` la llama (si la 0023 no está aplicada, no pasa nada).
- **Borrar la cuenta** se lleva todo lo de los logros (la prueba lo comprueba tabla por tabla).

## Los sitios que faltan en los datos
**Ninguno.** Los 37 sitios de las colecciones y los emblemas existen en `roma.json` con su id (la prueba y `/admin/logros` lo comprueban). Dos aclaraciones de nombres, sin tocar nada de los datos de Roma:
- «Museos Vaticanos» es `museos_vaticanos_y_capilla_sixtina` (un solo sitio, con la Capilla Sixtina dentro).
- «San Pietro in Montorio y el Tempietto» y «Tempietto de Bramante» son un solo sitio (`san_pietro_in_montorio_y_tempietto_de_bramante`): cuenta en El alma de Trastevere y en La Roma secreta.

## Los radios que he puesto
| Sitio | Radio | Por qué |
|---|---|---|
| Coliseo | 250 m | Anfiteatro grande, con la plaza y la cola de la entrada alrededor. |
| Foro Romano y Palatino | 350 m | Recinto muy grande (Foro y colina del Palatino); se entra por tres sitios distintos. |
| Fontana de Trevi | 120 m | Plaza pequeña; la gente se amontona en unos 60 metros. |
| Panteón | 120 m | Un edificio y su plaza. |
| Piazza Navona | 200 m | Plaza alargada, de unos 240 metros. |
| Plaza de España | 150 m | La plaza y la escalinata. |
| Castillo de Sant'Angelo | 200 m | Castillo, puente y parque que lo rodea. |
| Trastevere | 900 m | Es un barrio entero (más de un kilómetro de largo): el radio cubre todo el barrio. |
| Museos Vaticanos y Capilla Sixtina | 400 m | Complejo enorme y con cola larga en la calle: vale desde la cola hasta la salida. |
| Basílica de San Pedro | 250 m | La basílica y su atrio, pegada a la plaza. |
| Plaza de San Pedro | 250 m | Plaza de unos 240 metros de ancho. |
| Isla Tiberina | 150 m | Isla de unos 270 metros de largo. |
| Iglesia de Santa Maria in Trastevere | 120 m | Iglesia y su plaza. |
| San Pietro in Montorio y Tempietto de Bramante | 120 m | Iglesia y el patio del Tempietto. |
| Plaza del Campidoglio | 150 m | Plaza de Miguel Ángel y sus escaleras. |
| Iglesia de Santa Maria sopra Minerva | 100 m | Iglesia y su plazuela. |
| Elefantino de Bernini | 100 m | Plazuela pequeña. |
| Puente Sant'Angelo | 150 m | Puente de unos 130 metros con sus orillas. |
| Iglesia de San Luigi dei Francesi | 100 m | Iglesia en una calle estrecha. |
| Santa Maria del Popolo | 120 m | Iglesia en la esquina de la Piazza del Popolo. |
| Galería Borghese | 200 m | Villa dentro de un parque; la entrada queda a un lado. |
| Largo di Torre Argentina | 150 m | Yacimiento abierto que se ve desde la calle. |
| Circo Máximo | 500 m | Antiguo circo de unos 600 metros de largo. |
| Termas de Caracalla | 350 m | Recinto grande con jardines. |
| Mirador del Janículo | 200 m | Terraza larga con el parque del Janículo detrás. |
| Terraza del Pincio | 200 m | Terraza y jardines. |
| Jardín de los Naranjos | 120 m | Jardín pequeño. |
| Piazza del Popolo | 200 m | Plaza grande y abierta. |
| Plaza Venecia | 150 m | Plaza con el Altar de la Patria al fondo. |
| Fontana dell'Acqua Paola | 100 m | Fuente con una pequeña explanada. |
| Fuente del Tritón | 100 m | Fuente en una plaza pequeña. |
| Ojo de la Cerradura del Aventino | 100 m | Una puerta en una plaza pequeña. |
| Pirámide Cestia | 150 m | Pirámide y su glorieta. |
| Basílica de San Clemente | 100 m | Iglesia en una calle estrecha. |
| Fuente de las Tortugas | 100 m | Fuente en una plazuela. |
| Boca de la Verdad | 100 m | Pórtico de una iglesia con cola. |
| Catacumbas de San Calixto | 300 m | Complejo grande en la Vía Apia; la entrada queda dentro de una finca. |

## Patrimonios de la Humanidad, sitio por sitio
**No he podido abrir las fichas de la UNESCO** (la web me da un error 403). Por eso solo cuenta lo que he podido comprobar con documentos oficiales de la UNESCO y de la Santa Sede, y el resto queda en `patrimonio_por_comprobar`, que **no cuenta todavía**.
- **Centro histórico de Roma (ficha 91, inscrito en 1980 y ampliado en 1990):** los documentos del Comité nombran el Foro, el Panteón y el Mausoleo de Adriano (el Castillo de Sant'Angelo). El Coliseo, Trevi, Navona, Plaza de España y Trastevere están dentro de las murallas aurelianas (la zona del Centro histórico, 22 rioni), pero no he podido ver el mapa oficial: **dime si los damos por buenos** (es cambiar una línea de cada sitio en `roma.json`).
- **Ciudad del Vaticano (ficha 286, 1984):** un informe de la Santa Sede a la UNESCO dice que está inscrito todo el territorio del Estado. Cuentan los tres sitios del Vaticano.
- **Vía Apia. Regina Viarum (ficha 1708, 2024):** no he podido comprobar que las Catacumbas de San Calixto sean uno de sus componentes. No cuenta.
- **Excursiones (Pompeya, Villa Adriana, Villa d'Este, Florencia, Costa Amalfitana):** las excursiones **no tienen [Visto] en la app** (son opciones de un día, no paradas con Visto), así que **no cuentan de momento** y no las he puesto en los datos.

| Sitio | Patrimonio | Estado |
|---|---|---|
| Coliseo | Centro histórico de Roma (UNESCO 91) | por comprobar (no cuenta) |
| Foro Romano y Palatino | Centro histórico de Roma (UNESCO 91) | **cuenta** |
| Fontana de Trevi | Centro histórico de Roma (UNESCO 91) | por comprobar (no cuenta) |
| Panteón | Centro histórico de Roma (UNESCO 91) | **cuenta** |
| Piazza Navona | Centro histórico de Roma (UNESCO 91) | por comprobar (no cuenta) |
| Plaza de España | Centro histórico de Roma (UNESCO 91) | por comprobar (no cuenta) |
| Castillo de Sant'Angelo | Centro histórico de Roma (UNESCO 91) | **cuenta** |
| Trastevere | Centro histórico de Roma (UNESCO 91) | por comprobar (no cuenta) |
| Museos Vaticanos y Capilla Sixtina | Ciudad del Vaticano (UNESCO 286) | **cuenta** |
| Basílica de San Pedro | Ciudad del Vaticano (UNESCO 286) | **cuenta** |
| Plaza de San Pedro | Ciudad del Vaticano (UNESCO 286) | **cuenta** |
| Catacumbas de San Calixto | Vía Apia. Regina Viarum (UNESCO 1708) | por comprobar (no cuenta) |

Con esto, hoy se pueden conseguir 2 Patrimonios (Centro histórico y Ciudad del Vaticano), así que de «Patrimonios» solo se ve el escalón 1.

## Logros y escalones que se ven hoy (solo Roma)
Se calcula solo desde los datos (`logrosVisibles`): se van añadiendo destinos por su fecha de alta y cada escalón sale desde el primer destino con el que ya se puede conseguir. Cuando se añada un destino, los escalones que desbloquee salen con «Nuevo escalón» durante 30 días (el primer destino no los lleva).

**Se ven hoy:** Países (solo el 1), Destinos (solo el 1), Continentes (Europa), Maravillas (solo el 1), Dos países en un día, Patrimonios (solo el 1), Las cuatro estaciones, Un destino cuatro estaciones, Los 12 meses, Navidad fuera de casa, Nochevieja fuera de casa, Tres viajes en un año, De sol a sol, Alondra, Búho, Viajes (1, 5, 10), las cuatro chapas de Con quién viajas (1, 3, 5, 10), Día perfecto, Viaje perfecto, Imparable, Escapada, Gran viaje, Nunca es la última vez, El fotógrafo, Conocedor (25 y 50), Cazador de emblemas (5 y 10), Coleccionista (5 y 10), Ciudad al completo, Todos sus secretos, Diamante a la primera, Viajero fundador, Pionero y La edición del año.

**Todavía no se ven:** Capitales (empieza en 5), Los pequeños gigantes (pide 6 microestados), Al otro lado del ecuador, Viajero nacional (pide 3 destinos de tu país), Tres ciudades de oro y de diamante (piden 3 ciudades), Probador (se da a mano) y los escalones altos: Países desde el 3, Destinos desde el 3, Patrimonios 10 y 15, Maravillas 2 a 7, Cazador 15 y Coleccionista 15.

## Lo que he decidido yo (por si Eric quiere cambiarlo)
Las del apartado 3 del encargo, tal cual: estaciones por meses (primavera mar–may, verano jun–ago, otoño sep–nov, invierno dic–feb, el día de cada Visto válido), Un destino cuatro estaciones, Los 12 meses, Navidad fuera de casa (24 o 25 de diciembre), Nochevieja (31), Tres viajes en un año, Día perfecto (sin «Si te sobra tiempo» ni «Cerrado este día»), Viaje perfecto, Madrugador y Nocturno una vez por ciudad como emblema (Alondra y Búho, días distintos), Ciudad al completo, Todos sus secretos, la ciudad de las «tres ciudades» y «Conocedor» (sin el Vaticano) y Pionero encendido en Roma. Además, estas que el encargo no cerraba, y que he resuelto así:
1. **«Visto válido»** = dentro de las fechas del viaje, recibido dentro del plazo y **no «lejos»** del sitio. Con ubicación «sin datos» vale para país, destino, etc., pero el pedazo pide estar cerca o una foto.
2. **Una foto válida también cuenta como estar en el sitio** (no hace falta el Visto) para países, destinos, Patrimonios y demás.
3. **El Vaticano no es «capital»** para el logro de Capitales (su país sí cuenta como país y como microestado). Si prefieres que lo sea, es `capital: true` en tres sitios.
4. **Día de prueba** (para el pase): el primer día entero del primer viaje a ese destino = el primero que no es el de llegada ni el de vuelta; en viajes de 1 o 2 días, el primero.
5. **El fotógrafo** solo se da cuando el viaje ya ha acabado, con al menos 3 paradas vistas y foto en todas ellas (si no, con la primera foto ya lo daría).
6. **Diamante a la primera:** el sello de diamante con solo lo conseguido en el primer viaje a esa ciudad.
7. **Imparable:** 3 días consecutivos del calendario, perfectos, dentro de un mismo viaje.
8. **Escapada / Gran viaje:** se dan con el primer Visto válido del viaje (las noches salen de sus fechas).
9. **Viajero fundador:** alta de la cuenta antes de «salida + 1 año» **y** un Visto válido entre la salida y un año después. La salida se lee de `app_config.salida_app`.
10. **Pionero:** el puesto se mide por la hora del primer hecho válido de cada persona en ese destino (empate: por id). Roma, los 100 primeros (`pionero.limite` en `roma.json`).
11. **La edición del año:** un logro por destino y año con un Visto válido ese año (el nombre sale como «Roma 2027»).
12. **El plazo** también vale para los Vistos que llegan tarde (sin cobertura): si llegan pasados los 30 días, no cuentan.

## Peso de la app
Medido con `vite build` (antes y después de esta tanda): el JavaScript de la primera carga pasa de **3.456,88 kB (1.000,02 kB comprimido)** a **3.470,02 kB (1.004,28 kB comprimido)**, y el CSS de 545,82 kB a 546,06 kB. O sea, **+13 kB (unos +4 kB comprimidos)**: la primera carga sigue en **unos 1,1 MB comprimidos** (4,0 MB sin comprimir). Los 2 MB de meta no se cumplen si se cuenta lo descomprimido, pero esto **no viene de los logros**: viene de lo que ya había (mapas, datos del destino…). Los iconos (4 archivos, unos 10 kB) y los 10 sonidos provisionales (unos 120 kB en total, de 1 a 3 segundos) **no se cargan al abrir**: los sonidos se piden al sonar y los iconos solo al instalar. Los logros no llevan vídeos ni GIF.

## Instalar la web, sonidos y vibración
- **Instalar:** el nombre y los colores salen de **un solo sitio**, `data/marca.json` (hoy «Routy», provisional, con un icono provisional). El manifiesto lo da el servidor (`/api/manifest.webmanifest`) y el service worker (`public/sw.js`) es mínimo: **no guarda ninguna respuesta** (sin modo sin conexión). Todo se añade a la página solo con los logros encendidos. El aviso «Añádela a tu pantalla de inicio» sale una vez, se puede cerrar, no sale si ya está instalada y explica los pasos de iPhone y de Android (en Android, con el aviso del propio navegador si lo da).
- **Sonidos:** `sonar('emblema')`; qué archivo suena en cada momento está en `public/sonidos/sonidos.json`; para poner los de verdad se cambian los archivos o esa lista, sin tocar el código. Suena al tocar [Visto] (dentro del propio toque, que es cuando el móvil deja) y, al llegar la respuesta, suena lo más importante de lo ganado. Un ajuste (`ponerSonido(false)`) lo quita siempre.
- **Modo silencio:** uso Web Audio con la sesión de audio en «ambiente». **iPhone (Safari 16.4 o más):** debería respetar el interruptor de silencio. **Android:** el navegador no puede saber si el móvil está en silencio (solo manda el volumen multimedia). Es lo que dice la teoría: Eric tiene que comprobarlo en su iPhone y en su Android.
- **Vibración:** pequeña, con `navigator.vibrate`: **Android con Chrome, sí; iPhone, no** (iOS no deja vibrar a las webs).

## La prueba de las fotos en iPhone y Android
Con las cuentas y los logros encendidos, se abre **`/?pruebaFotos=1`** (en local: `http://localhost:5173/?cuentas=on&logros=on&pruebaFotos=1`). Pulsas «Elegir una foto», escoges una de la galería y dice la fecha de la cámara, si llega la ubicación y si es de una cámara, y si serviría para los logros. **No sube nada.** En iPhone, al elegir la foto toca «Opciones» y activa «Ubicación» / «Todos los datos»; si no, Safari quita la ubicación y la fecha puede faltar. Pruébala con una foto de la cámara, una captura de pantalla y una imagen bajada de internet, en los dos móviles.

## /admin/logros
Una página solo para Eric. La cuenta de administrador sale de la variable del servidor **`LOGROS_ADMIN_EMAILS`** (emails separados por comas; también vale `LOGROS_ADMIN_IDS`); ningún email está en el código. Tiene: sellos y colecciones, emblemas con su radio y su texto de «foto dentro», Patrimonios (con lo que cuenta y lo que está por comprobar), los avisos de los datos (sitios que faltan, ids que no existen, sitios sin radio), los logros de viajero con lo que se ve hoy, un simulador (sitios, fechas y horas: qué se gana y en qué orden), cuánta gente tiene cada cosa (solo números) y «Dar Probador» por email. **Nunca enseña fotos.** La API es `/api/admin/logros/*`. La página se abre en **`/?admin=logros`**; **`/admin/logros` funciona en local, pero en Vercel hace falta una regla de reescritura en `vercel.json` que yo no he puesto** (me dijiste que no tocara Vercel).

## Los avisos
La lógica está lista y probada: el resumen del viaje al día siguiente del último día y «Te quedan 3 días para reclamar tus N sorpresas de Roma» 3 días antes de acabar el plazo (solo si queda algo por reclamar), en la cola `logro_avisos` (`POST /api/logros/avisos/preparar`). **El envío está apagado.** El aviso en el móvil (web push) lo he dejado preparado detrás de `PUSH_ACTIVO=true`. **Falta:** instalar el paquete `web-push` (no lo he añadido para no cargar el proyecto), unas claves VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACTO`), la pantalla del permiso (paso 3 de Design) que guarda la suscripción, y el servicio de correo para quien no dé permiso (falta el dominio). En iPhone solo funciona con la web ya instalada en la pantalla de inicio (iOS 16.4 o más).

## El pase
`puedeGanarLogros` es la única función: con el cobro apagado (`PASES_COBRO_ACTIVO` sin poner) siempre sí; con el cobro encendido, con el pase de ese destino o en su día de prueba. Lo ganado no se quita al acabar la prueba. Si compra el pase más tarde, lo de los días anteriores se gana con las fotos de la galería dentro del plazo (`lo-de-ayer`).

## Migraciones nuevas (sin aplicar)
Solo una: **`0023_logros.sql`**. Orden de todas las pendientes: **0020 y 0021 juntas, en ese orden → 0022 (independiente) → 0023**. La 0023 necesita las tablas de la 0020 (`achievements`, `passes`, `trip_members`…), la 0018 (`trip_photos`) y la `trip_invitations` de la 0021. Crea: `logro_hechos`, `logro_perfil`, `logro_avisos`, `push_suscripciones`, tres columnas nuevas en `achievements` (`animacion_vista`, `frase`, `detalle`) y las funciones `reclamar_anonimo_logros`, `logro_orden_pionero` y `logro_contar` (solo para el servidor). Hasta que se aplique, el interruptor tiene que seguir apagado.

## Lo que tiene que hacer Eric fuera del código
No me pegues ninguna clave en el chat.
1. Aplicar las migraciones en ese orden (SQL Editor de Supabase).
2. Para probar en un entorno de pruebas: variables del **servidor** `LOGROS_ACTIVOS=true`, `CUENTAS_ACTIVAS=true` (o `VITE_CUENTAS_ACTIVAS=true`, que ya lee) y `LOGROS_ADMIN_EMAILS=tu@email`; y del **móvil/web** `VITE_LOGROS_ACTIVOS=true` y `VITE_CUENTAS_ACTIVAS=true`. En local basta `?cuentas=on&logros=on`. No las pongas en producción todavía.
3. Probar la página de las fotos con el iPhone y con un Android, y el sonido con el interruptor de silencio.
4. Decidir el nombre de la app (hoy «Routy» en `data/marca.json`) y el icono; poner los sonidos de verdad (con licencia comercial).
5. Decidir lo de los Patrimonios «por comprobar» (arriba) y si el Vaticano cuenta como capital.
6. Si quieres `/admin/logros` en producción, pedir la regla de reescritura de `vercel.json`.
7. Para avisos al móvil: lo de la sección «Los avisos».

## Lo que queda para la 8b y la 8c
- **8b (HOY v2 y los momentos):** las pantallas de los momentos que leen `useLogrosStore` (ya reciben la lista en orden, con la frase de suspense solo la primera vez), el sonido ya suena; la tarjeta «Lo de ayer también cuenta» (`GET /api/logros/lo-de-ayer`); los permisos de cámara y ubicación con su línea; [Deshacer] 5 segundos; el aviso de «Activa tu ubicación o haz una foto»; el botón de la cámara y el selector de la galería (`enviarFotoDeLaCamara`, `enviarFotoDeGaleria` están hechas).
- **8c (las pantallas de los logros):** el botón flotante (`/estado`), Logros, la pestaña de colecciones de la ficha (`/ficha`), el pasaporte (`/pasaporte`), la vitrina (`/vitrina`), el Perfil con los logros de viajero (`/viajero`), «¿Dónde has estado ya?» (`PUT /previos`), los resúmenes (`/resumen`) y la pantalla del permiso de avisos.

## Riesgos y lo que no he podido hacer
- **No lo he probado con Supabase de verdad**, solo con un Postgres real (PGlite) con las migraciones reales y las reglas de seguridad: los mensajes de error de Supabase, el `upsert` con `ignoreDuplicates` y las funciones llamadas por `rpc` son lo primero a mirar en la prueba a mano.
- **Las fichas de la UNESCO** no se han podido abrir (arriba).
- **Cada petición vuelve a calcular todo** desde los hechos de la persona (una persona tiene decenas, no miles): es lo que da la garantía de que nada se descuadra. Si algún día pesa, se puede guardar un resumen.
- **Dos hechos a la vez** de la misma persona pueden calcular lo mismo; la clave única de la base de datos evita que se dé dos veces y cada respuesta solo enseña lo que de verdad ha insertado.
- **Las horas de la foto de la galería** se toman como hora de Roma si la foto no dice su zona (así las guardan las cámaras). Un móvil con otra zona horaria puede desplazar la hora (afecta a Madrugador y Nocturno, no a las fechas salvo cerca de la medianoche).
- **La ubicación en iPhone:** al elegir una foto desde la web Safari puede quitarla; la regla dice que sin ubicación la foto vale.
- **El sonido en Android no puede respetar el modo silencio** (arriba).
- **`pruebaTanda6z6b` dejó de valer el 17 de octubre** (no por esta tanda: falla igual sin mis cambios): el Perfil ordena los viajes con el reloj de verdad y la prueba suponía «hoy» = 10 de octubre. Le he parado el reloj dentro de la prueba; el código del Perfil no se ha tocado.

## Pruebas
`pruebaLogros1`: **257 comprobaciones, 0 fallos** (los datos contra el catálogo; las reglas de fotos, Vistos, horas y pase; los 4 grados de Roma y los 3 del Vaticano; pedazo con ubicación cerca, sin ella, lejos y con foto; emblema sin y con foto; foto de galería de otro día, sin cámara, de otro sitio y buena; Visto fuera de fechas; deshacer antes y después de la foto; Madrugador y Nocturno en verano y en invierno y en un sitio que no es imprescindible; una foto que suma en tres colecciones; completar una colección y subir el sello; dos países en un día; el plazo de 30 días; el Visto sin cobertura; los países de antes; un viaje compartido; un segundo viaje; Viajero fundador con la salida cambiada; Pionero; lo mismo dos veces; volver a calcular todo; el pase; las rutas con sesión, anónima, cuenta y administrador; las reglas de seguridad; borrar la cuenta; entrar con una cuenta que ya existía). `pruebaLogros2`: **23 comprobaciones, 0 fallos** (interruptor, instalar, sonidos, apagado). Batería rápida: ver abajo.

**Batería rápida** (72 pruebas, sin `pruebaFase6y5_motor`, que no se toca porque el motor no ha cambiado): todas en 0 fallos, incluidas `pruebaCuentas1` (con el cambio de `server/cuentas.js`), `pruebaLogros1` y `pruebaLogros2`. `tsc -p tsconfig.app.json` y `oxlint` sin errores en lo nuevo. Las dos pruebas nuevas ya están en la batería (`bateriaParalela.mjs`).
