# Resumen de la cola V30, V31 y V32 (20-nov, tarde)

*(Se va rellenando al acabar cada tanda.)*

## V30 · Sonidos de verdad, estilo juego — HECHA

**Qué cambia, en palabras sencillas**

- Los sonidos de los premios ya no los fabrica el móvil: son **grabaciones de videojuegos** (el paquete gratis «GDC Game Audio Bundle» de Sonniss, que se puede usar en una app comercial y no pide citar al autor), mezcladas en capas para sonar alegres y con golpe: monedas, campanas, brillos mágicos, metales. **57 candidatos** (3 a 4 por momento; algunas letras las descartó la forma de onda), **menos de 1 MB** en total, en m4a a 44,1 kHz.
- Se quedan **fijos**, como estaban: el toque y el brillo pequeño de [Visto], la campanita del aviso y el tic de los números. El volumen general queda en 0,80.
- **El golpe de cada premio cae a menos de 30 ms del final de su animación**, medido de verdad. Los tiempos de la medalla, el sello, la colección y el pasaporte salen a un solo archivo (`tiempos.ts`) y la pantalla y su sonido leen el mismo número.
- **Las escenas de cada sitio** (Roma, el Coliseo y Lanzarote) tienen su partitura propia; los fuegos y los resúmenes también.
- **`/admin/sonidos`:** los 4 fijos marcados; cada candidato con ▶, fuente, duración y peso; y **«Con su animación»** abre la pantalla de verdad con ese sonido. «Lo elegido» para copiarme.
- **Baldosas derechas** en las 18 insignias (las de 4 trozos con sus lados rectos horizontales y verticales; las de 3, simétricas con el borde de fuera arriba).
- **Animaciones a pantalla completa:** la escena llena el ancho y el alto sin deformarse (iPhone con barra de Safari, iPhone completo, iPhone SE, Android). En un ordenador se ajusta como antes.
- **Fuera el aviso «Añádela a tu pantalla de inicio»** con un interruptor (`AVISO_INSTALAR_VISIBLE`, apagado). Salía en **dos sitios**: el recuadro con los 3 pasos al entrar, y la tarjeta de HOY el primer día en iPhone. Los dos apagados; el código sigue.
- Subido el resumen de la cola anterior (`RESUMEN_COLA_V28B_V29.md`).

**Pruebas:** `pruebaV30` 537 comprobaciones en 0; `pruebaV29`, `pruebaV28`, `pruebaV13`, `pruebaLogros2`, `pruebaV3`, `pruebaTandaHOY3` (con la API de Lanzarote) y `pruebaJutrip` en 0.

**Lo que no se pudo / lo que hay que saber**

- **No puedo oír.** Lo medible está medido (duración, volumen, saturación, silencio de delante, golpe), pero si suenan bien lo decides tú.
- **Pixabay y Kenney no se usaron:** Sonniss tenía de sobra y la descarga de Kenney pide un navegador; no se esquivó.
- **Fotos de Roma:** entraron 2 de 4 (Lungotevere y mirador de San Pietro in Montorio). Wikimedia sigue cortando (429) con Borgo Pio y Colle Oppio.
- **Dos pruebas viejas fallan, y no parecen de la V30:** `pruebaPantallas8b` (comprobado: también falla en el código de antes) (4 de 171: Compartir, ResumenViaje, ResumenDia y HojaLogros no salen como archivo aparte; la V30 arregló la quinta, Reproductor) y `pruebaTanda10N8_perfil` (1 de 17: «pastilla del pase»; no toca nada de lo mío, pero no la he comprobado en el código de antes).
- La barra de estado del iPhone con la app en la pantalla de inicio (`apple-mobile-web-app-status-bar-style`) sigue en «default»: cambiarla afecta a toda la app, no lo he tocado sin que lo decidas.

**PARA ERIC (V30), en orden**

1. Abrir `/admin/sonidos` con tu cuenta, oír los candidatos y pulsar «Con su animación» en medalla, colección, emblema, país y apertura. Elegir y pasarme «Lo elegido».
2. Probar en un iPhone real (Safari y la app de inicio) y en un Android: que las escenas llenan la pantalla sin franjas.
3. Dos fotos de Roma que no han bajado, para que las pongas a mano en Descargas (o yo las reintento más tarde): Borgo Pio — https://commons.wikimedia.org/wiki/File:Borgo_2947.JPG y Colle Oppio — https://commons.wikimedia.org/wiki/File:Il_Colosseo_dal_parco_di_Colle_Oppio.JPG
4. Decidir si la barra de estado del iPhone pasa a «black-translucent» (toda la app).
5. Lo de la cola anterior que sigue abierto: foto del Free tour de Arrecife, gráfico de egress de Supabase, el sorteo (`SORTEO_VISIBLE` / `VITE_SORTEO_VISIBLE`).

---

## V31 · La primera vez que alguien abre JUTRIP — HECHA (código); falta aplicar el SQL

**Qué cambia, en palabras sencillas**

- Una cuenta nueva **sin ningún viaje** ve 4 preguntas rápidas, **una sola vez** (las conteste o las salte): cada cuánto viaja, con quién, cómo le gusta viajar (+ qué le gusta ver) y el año de nacimiento (opcional, sin ninguno marcado).
- **Se guardan SOLO 3 cosas** (cada cuánto viaja, con quién y el año). El ritmo y lo que le gusta ver salen igual pero no se guardan nada. No se usan para los viajes.
- Al acabar: **el Perfil de siempre con un mapa del mundo dibujado «¿A dónde te apetece ir?»** y la lista por continentes. Tocar un destino abre su tarjeta (con [Ver destino] y [Crear viaje]); los «Próximamente» (Florencia, Berlín, Cartagena de Indias) llevan [Avísame]. Fuera el botón grande [Crear mi viaje]; el «+» flotante es el de siempre, sin texto, con la versión C de Design, y se esconde con la tarjeta o la página del destino abiertas.
- **[Ver destino] sin viaje** (la página de siempre sin fechas ni «Tu alojamiento», con «Lo que te puedes llevar» del propio destino y [Crear mi viaje a …] fijo abajo) y **[Crear viaje]** abre ORIGEN/DESTINO con el destino ya elegido.
- Los destinos están en `data/primera_vez/destinos.json` (Eric lo puede cambiar sin tocar código). Todo sale de los datos de la app (tabla de revisión en el REPASO: Roma 2 medallas, 11 colecciones, 14 emblemas, 7 hoteles; Lanzarote 1 medalla, 7 colecciones, 11 emblemas, 5 hoteles).

**Pruebas:** `pruebaV31` 64 en 0; `pruebaJutrip`, `pruebaTanda10J`, `pruebaV28`, `pruebaV30`, `pruebaV13`, `pruebaV3` en 0. La muestra de 60 de Roma no se ha tocado (el motor no cambia).

**Lo que no se pudo / lo que hay que saber**

- **Hasta que se aplique la 0089, no pasa nada raro:** el servidor contesta «sin tabla» y la app sigue como siempre (ni preguntas ni mapa). Con la 0089, todo se enciende solo.
- **Capturas «al lado de Design»:** no he podido sacar capturas del propio archivo de Design; está en `docs/diseno/proyecto/Primera Vez.dc.html` para abrirlo y comparar.
- Si ya contestó y sigue sin viajes, al abrir la app sale directamente el Perfil con el mapa (desde la pantalla de crear viaje no hay otra puerta al Perfil).
- `pruebaTanda10N8_perfil` sigue con el mismo fallo de antes («pastilla del pase»).

**PARA ERIC (V31), en orden**

1. **Pegar el SQL** `supabase/migrations/0089_viajero_primera_vez.sql` en el SQL editor de Supabase (se puede pegar entera y repetir). Después pasar `docs/dias/COMPROBAR_0089.sql`: tiene que salir **una sola fila** con `migracion_0089 = 'Aplicada'`.
2. **Datos nuevos que se guardan, para qué y dónde** (para la política de privacidad): en la tabla `viajero_primera_vez` de Supabase, ligada a la cuenta: (a) cada cuánto viaja (una vez al año, 2 o 3 veces, 4 o más), (b) con quién suele viajar (a mi aire, pareja, familia, amigos), (c) el año de nacimiento (opcional). Sirven solo para mejorar JUTRIP; no se enseñan nunca ni se usan para los viajes. Se borran con «Empezar de cero» y con borrar la cuenta. Además, [Avísame] guarda el destino y el correo de la cuenta (tabla `avisos_destino`, que ya existía) para escribirle cuando el destino esté.
3. **Qué añadir a la política de privacidad:** que se recoge el año de nacimiento (opcional), la frecuencia de viaje y con quién viaja, para qué (mejorar el servicio), dónde (Supabase) y que se pueden borrar. **No escribo yo los textos legales:** que los redacte el gestor.
4. **Menores de 14 años:** en España necesitan el permiso de sus padres para dar sus datos. Hay que mirarlo con el gestor (por ejemplo, si la app debe pedir la edad o un aviso a los padres).
5. Probar en un iPhone: girar y acercar el mapa, tocar los destinos (en Europa también), y comprobar que «Crear viaje» sale con el destino puesto.

---

## V32 · La app en jutrip.app — HECHO el código; FALTA que Eric toque los paneles

**Qué cambia, en palabras sencillas**

- **No había ninguna dirección de bengaladesigns.vercel.app escrita en el código de la app** (0; solo 2 menciones en un ejemplo de una prueba y en un informe viejo). Los enlaces de invitación y los regresos de entrar salen de la dirección en la que esté abierta la app, y el de Stripe de `APP_URL`: **ya funcionaba en cualquier dirección**. Detalle en `docs/dias/REPASO_V32.html`.
- **Redirección de la dirección vieja (y de www) a jutrip.app**, conservando ruta, `?` y `#`. **Está apagada hasta que Eric ponga una variable en Vercel** (paso 2): así el código ya subido funciona en las dos direcciones y nada se rompe si el dominio aún no está conectado. Las llamadas al servidor (`/api/*`, el webhook de Stripe) **no se redirigen**.
- **El correo de la marca:** Ajustes ahora tiene «Contactar» (soporte@jutrip.app); «Mis pases» dice a quién escribir si hay un problema con un pago; la privacidad da soporte@jutrip.app y privacidad@jutrip.app.
- **Plantillas de los correos de Supabase** en `docs/jutrip_app/PLANTILLAS_CORREOS_SUPABASE.md` (el código bien grande).
- **Lo que se pierde al cambiar de dirección** (sesión, cuentas de invitado sin correo, fotos sin subir…): tabla en el REPASO. Los dos riesgos reales: **las cuentas de invitado sin correo** y **las fotos sin subir**.

**Pruebas:** `pruebaV32` 29 en 0; `pruebaJutrip`, `pruebaCuentas1` (invitaciones), `pruebaCuentas3` (pase y pago), `pruebaEntrar` y `pruebaV31` en 0. Muestra de 60 de Roma idéntica (motor sin tocar). Arreglado de paso: la V31 había subido el peso de arranque por encima del tope (402 KB > 340): ahora sus piezas pesadas se bajan solo al hacer falta.

**PARA ERIC (V32), en orden — los paneles los tocas tú**

0. **Antes de nada** (para no perder nada): en la app vieja, tú y Alicia entrad con vuestro correo («Entrar con mi email»), con señal, y esperad a que suban las fotos pendientes. Comprobar: Ajustes muestra vuestro correo.
1. **Vercel › Settings › Domains:** añadir `jutrip.app` y `www.jutrip.app`. Vercel te dirá los registros DNS: cópialos en **Cloudflare › DNS** con la **nube gris («DNS only»)**. En Vercel deja `www.jutrip.app` como redirección a `jutrip.app`. *Comprobar:* los dos dominios en verde («Valid Configuration») en Vercel.
2. **Vercel › Settings › Environment Variables:** poner `APP_URL` = `https://jutrip.app` (para el regreso de Stripe) **y** `VITE_APP_URL_NUEVA` = `https://jutrip.app` (enciende la redirección de la dirección vieja; solo cuando el paso 1 esté en verde). Redesplegar. *Comprobar:* abrir `https://bengaladesigns.vercel.app/ruta` te lleva a `https://jutrip.app/ruta`. Para apagarla: borrar `VITE_APP_URL_NUEVA` y redesplegar.
3. **Supabase › Authentication › URL Configuration:** Site URL = `https://jutrip.app`; en Redirect URLs añadir `https://jutrip.app/**` y `https://www.jutrip.app/**` (dejar las de bengaladesigns.vercel.app unas semanas). *Comprobar:* entrar con el correo en jutrip.app: el enlace del correo vuelve a jutrip.app.
4. **Mapbox:** abre mapbox.com › Tokens y mira si el token público (el que usa la web) tiene «URL restrictions». **No puedo verlo desde aquí.** Si las tiene, añade `https://jutrip.app` y `https://www.jutrip.app` (sin barra final). Si no, no hay que hacer nada. *Comprobar:* en jutrip.app el mapa sale.
5. **Google (entrar con Google):** el regreso va a la dirección de Supabase (`…supabase.co/auth/v1/callback`), que **no cambia**: en Credentials › tu cliente OAuth no hay que tocar nada. Solo en «OAuth consent screen» (Pantalla de consentimiento) añadir `jutrip.app` en «Authorized domains» y poner la web de la app = `https://jutrip.app` (es la marca que ve la gente). *Comprobar:* «Continuar con Google» en jutrip.app entra y vuelve a jutrip.app.
6. **Stripe (modo prueba):** Developers › Webhooks › «jutrip-pagos»: cambiar la URL a `https://jutrip.app/api/pago/webhook` (mismo secreto, no cambia). Settings › Business › Public details: web `https://jutrip.app` y correo de soporte `soporte@jutrip.app`. *Comprobar:* «Send test webhook» da **200**; y un pago de prueba con la tarjeta 4242 4242 4242 4242 acaba en «Pase activo».
7. **Civitatis y Stay22:** en sus paneles, la web = `jutrip.app` (los enlaces de afiliado, aid y Stay22, **no cambian**).
8. **En los dos móviles (Eric y Alicia):** borrar el icono viejo de la pantalla de inicio. Abrir `https://jutrip.app` en Safari › Compartir › «Añadir a pantalla de inicio». Entrar con el correo. *Comprobar:* la app abre en pantalla completa y vuestros viajes están.
9. **Pegar las plantillas de correo** de `docs/jutrip_app/PLANTILLAS_CORREOS_SUPABASE.md` en Supabase › Authentication › Emails › Templates (Magic Link, Confirm signup, Change Email Address). *Comprobar:* pedir un código de entrada: llega «Tu código para entrar en Jutrip: …» desde «Jutrip <no-reply@jutrip.app>».
10. **Decirme «paneles hechos»:** entonces compruebo en producción, en modo iPhone: jutrip.app carga y el mapa sale, entrar con código y con Google, un enlace de invitación abre el viaje, la dirección vieja lleva a la nueva y el webhook de prueba da 200 (esto último lo verás tú en Stripe: yo no puedo mandar un webhook firmado sin la clave).

---

## V33 · El panel de Jutrip (/admin) — HECHO (código); falta aplicar la 0090 y poner la clave de correo

**Qué cambia, en palabras sencillas**

- **Una sola entrada, `/admin`, solo para administradores** (la comprobación es en el servidor: cada `/api/admin/*` da 401 sin sesión y 403 a quien no es administrador; la pantalla dice «Esta página es solo para administradores»). Menú de Design: Inicio · Reportes · Fotos · Destinos y «Avísame» · Ventas · Usuarios · Logros · Sonidos (ordenador y móvil). `/admin/logros` y `/admin/sonidos` llevan a su apartado.
- **Inicio** (reportes sin mirar, fotos por aprobar, pases e ingresos de hoy y del mes, usuarios nuevos, gráfico de 14 días, lo último que ha llegado, totales de la primera vez), **Reportes** con **[Responder]** (a la campana; por correo solo si mandó el reporte con cuenta y «avísame»; desde soporte@), **Fotos**, **Destinos y «Avísame»** con **[Ya está disponible: avisarles]** (una sola vez por persona y destino), **Ventas** y **Usuarios** (lista de 50 en 50 con buscador, filtros y orden, totales en porcentajes y ficha; solo lectura, sin exportar, sin datos de tarjeta).
- **Correo a soporte@jutrip.app** cuando entra un reporte nuevo (sin el correo del viajero en el asunto; como mucho uno cada 15 minutos, los seguidos juntos). **Sin `RESEND_API_KEY` el panel funciona igual** y lo dice; solo no manda correos.
- **Importes de los pases:** no hizo falta tocar nada: la tabla de cobros (`pagos_registro`, 0026) ya guardaba importe y moneda de cada compra. Los pases dados a mano o con código cuentan 0 €; no hay pases antiguos sin importe.

**Pruebas:** `pruebaV33` (pantalla) 47 en 0 y `pruebaV33_servidor` 181 en 0; `pruebaJutrip`, `pruebaV20` (Cuéntanos), `pruebaV29`, `pruebaV30`, `pruebaV31`, `pruebaTanda10J` y `pruebaCuentas3` en 0. Muestra de 60 de Roma idéntica (motor sin tocar).

**Lo que no se pudo / lo que hay que saber**

- **El panel con datos reales y los correos de verdad no se han podido probar** (no tengo cuenta de administrador de producción, ni clave de correo, ni la 0090 aplicada). Todo está probado con bases y correos de mentira.
- **El correo interno no tiene temporizador propio** (Vercel no lo permite): sale cuando entra otro reporte, cuando alguien abre el Inicio del panel o cuando corre la tarea programada de avisos.
- **Comprobación en producción con cuenta de administrador y con cuenta normal:** pendiente (necesito que me digas «paneles hechos» y que la 0090 esté aplicada; con cuenta de administrador real no puedo entrar yo).

**PARA ERIC (V33), en orden**

1. **Pegar el SQL** `supabase/migrations/0090_panel_jutrip.sql` en el SQL editor de Supabase (se puede pegar entera y repetir) y pasar `docs/dias/COMPROBAR_0090.sql`: **una sola fila**, `migracion_0090 = 'Aplicada'`. (Después de la 0089 de la V31.) *Sin la 0090 el panel abre pero sus apartados dan error claro; el resto de la app sigue igual.*
2. **Clave de correo `RESEND_API_KEY`** (la creas y la pones tú; yo nunca la veo): Resend › API Keys › Create API Key › permiso «Sending access» y dominio `jutrip.app` › copiar la clave › Vercel › Settings › Environment Variables › nombre `RESEND_API_KEY`, entorno Production › redesplegar. *Comprobar:* en el panel, Inicio ya no dice «Los correos están apagados». Hace falta que `jutrip.app` esté verificado en Resend (ya lo está) y `APP_URL` puesto (V32, paso 2) para el enlace del correo a soporte@.
3. **Para el gestor (política de privacidad), en palabras sencillas:** los administradores de JUTRIP pueden ver, para gestionar la app y dar soporte, los datos de cada usuario: nombre y correo, fecha de alta y último acceso, nivel, sus viajes (destino, fechas, si fue en grupo), sus pases y lo que pagó, sus logros y su pasaporte, los reportes que ha mandado y lo que contestó en las preguntas de la primera vez (cada cuánto viaja, con quién y año de nacimiento). Nunca datos de tarjeta (los lleva Stripe) ni contraseñas. El acceso es solo de lectura, solo para administradores y no se exporta. **No escribo yo el texto legal.**
4. Probar con tu cuenta: `/admin` abre con cifras reales; con otra cuenta, «solo para administradores». Mandar un reporte de prueba desde la app: llega UN correo a soporte@ (y varios seguidos, juntos, cada 15 minutos).

---

## Al cerrar la cola

- **Commits:** V30 `6b6ac5b8` · V31 `5672b5b2` · V32 `4a0b2c99` · V33 (el último de esta lista).
- **Queda abierto:** fotos de Roma (Borgo Pio y Colle Oppio), `pruebaPantallas8b` y `pruebaTanda10N8_perfil` (fallan desde antes), elegir sonidos, y los paneles de la V32.
- **Servidores:** la API y Vite siguen encendidos (como pediste); no se ha apagado el PC.
