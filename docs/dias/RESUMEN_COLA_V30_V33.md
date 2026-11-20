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
