# Informe: las cuentas, parte 2 (lo de dentro)

16-oct-2026. Sigue todo detrás del mismo interruptor, **apagado**: con él apagado la app es la de hoy. Sin pantallas de Design: las de ahora son provisionales y solo salen con el interruptor encendido. No se ha tocado el motor de rutas (nada de `shared/routeEngine` ni de `server/engine`).

## En una frase
Ya están hechos el borrado de cuenta que no perjudica a nadie, invitar a alguien a un viaje, los Vistos de cada persona y aceptar una recomendación que cambia la ruta, más la prueba larga del motor partida en tramos. Falta aplicar dos migraciones (la 0020 y la 0021, juntas) y que Design dibuje las pantallas.

## 1. La clave del servidor (`sb_secret_…`)

**¿La acepta mi código?** Sí, por lo que se puede comprobar sin entrar en Supabase.
- El servidor usa `@supabase/supabase-js` 2.114.0. Esa versión reconoce las claves nuevas (`sb_publishable_…` y `sb_secret_…`) por su nombre (`isNewApiKey` en `dist/index.mjs`) y las manda en la cabecera `apikey`, que es donde Supabase las espera. Las claves viejas (`service_role`) siguen funcionando igual.
- Con la clave nueva, `auth.getUser(token)` (para saber quién es cada persona) recibe el token de la persona, no la clave; y `auth.admin.deleteUser`, `storage` y las funciones (`rpc`) se llaman con la clave de servicio. No hace falta cambiar nada.
- Un ajuste pequeño que sí hice: el cliente del servidor se crea ahora con `persistSession: false` y `autoRefreshToken: false` (un servidor no tiene sesión que guardar ni renovar).
- **Lo que no puedo hacer:** probarlo contra tu Supabase de verdad (no tengo la clave ni red hacia él). La prueba usa clientes de mentira. Cuando apliques las migraciones, el punto E del informe de la parte 1 (borrar una cuenta de prueba y mirar que no queda nada) es la comprobación real. Si saliera «Invalid API key» o un 401 en los registros de Vercel, avísame: lo único que cambiaría es cómo se manda la clave.

**¿Qué pasaba con las ventas del afiliado sin la clave?** Lo mire en `server/index.js` (rutas `/api/sales/ingest` y `/api/trip-sales`):
- Sin la clave, las ventas se guardaban **en la memoria** del servidor (`salesStore`). En Vercel cada petición puede caer en una instancia distinta que se apaga al rato: **lo guardado en memoria se pierde**, y la ruta decía `{ ok: true }` igualmente. O sea, sí, habría perdido ventas **sin avisar**.
- Pero en producción casi seguro no se perdía nada, por otra razón: `/api/sales/ingest` solo deja pasar si `SALES_INGEST_SECRET` está puesto; sin él, en producción responde 401 a todo. Si nunca lo pusiste, nunca entró ninguna venta (ni a la memoria). Si lo pusiste y mandabas ventas, esas se perdieron.
- Ahora que la clave está: las ventas se escribirán en la tabla `affiliate_sales`. **Esa tabla es la migración 0017.** Si no la has aplicado, ahora el guardado fallará con un 500 «No se pudo guardar la venta» (se ve, ya no es silencioso) y `/api/trip-sales` devolverá lista vacía. Compruébalo antes de empezar a mandar ventas.

## 2. Borrar la cuenta sin que pierdan nada los demás

Cambia lo de la parte 1. Ahora el servidor, antes de borrar archivos y usuario, llama a `preparar_borrado()` (solo para el servidor; migración 0021):
- **Viaje compartido:** si quien borra su cuenta es el administrador y el viaje tiene invitados, **el viaje no se borra**: pasa a administrarlo el invitado que entró primero (el más antiguo en `trip_members`; si empatan, el de id menor). Esa persona deja de figurar como invitada (ahora es la dueña). Las recomendaciones que ella misma había mandado a ese viaje se van (ya es su viaje); las de los demás invitados siguen. Las invitaciones que había mandado la persona que se borra dejan de valer. Sin invitados, el viaje se borra como antes.
- **Pases:** se borra solo **su uso**. Si compró un Dúo o un grupo y hay otras personas, el pase se queda con ellas y pasa a ser de la primera que lo usó (o de la destinataria, si era un regalo). Si ella lo usaba, ese uso desaparece del pase (los usos y los usados bajan en uno; nadie puede ocupar su plaza). Si lo compró para otras personas y no lo usaba, los usos no se tocan. Si no queda nadie más, el pase se borra. Un pase de otra persona que ella usaba: se va su uso y el pase sigue.
- **Siempre se borran:** sus Vistos, sus fotos (también los archivos) y sus logros.
- **Si algo falla al preparar el borrado, no se borra nada** (ni el usuario ni las fotos) y se le dice que vuelva a probar.
- **Importante:** el servidor ahora **necesita la migración 0021** para poder borrar cuentas. Sin ella, borrar responde 500 con ese aviso y no toca nada (se queda del lado seguro, a propósito). Como las dos migraciones (0020 y 0021) están sin aplicar, basta con aplicarlas juntas.

## 3. Invitar a alguien (la lógica)
- El administrador crea una invitación: un **código de 8 caracteres** (sin 0, O, 1, I ni L, para dictarlo) y un **enlace** (`https://…/?invitacion=CÓDIGO`) que sirven para lo mismo. Con `crear_invitacion`, solo si es el administrador de ese viaje y con una cuenta de verdad.
- Quien abre el enlace: la app guarda el código y limpia la dirección; si no tiene cuenta, la pantalla de entrar le pide crearla; **después de entrar canjea sola** la invitación y entra como invitado (la app se recarga y el viaje sale en su lista). También puede escribir el código a mano.
- **Con un pase:** si la invitación va con un Pase Dúo o de grupo (de quien invita), al entrar recibe su **uso del pase**. Los invitados que caben son los usos que le queden al pase: un Dúo con su dueña dentro deja 1; un grupo de 4 con su dueña dentro deja 3.
- **Sin pase:** vale para las personas que se pongan (por defecto 1, hasta 50).
- **Se puede anular** (solo el administrador). **Deja de valer** cuando ya no quedan usos o al anularla. Abrir tu propia invitación o una a la que ya estás unido no gasta ningún uso.
- Ver antes de entrar (`ver_invitacion`): dice si vale y a qué destino te invitan, nada más (sin personas ni datos del viaje); funciona también con la sesión anónima.
- Pantalla provisional: en el Perfil, bloque «Invitar y recomendaciones» (solo con el interruptor encendido y una cuenta de verdad): «¿Te han dado un código?», crear invitación con el número de personas, ver las que hay con su enlace y plazas, y [Anular].
- **Quien está invitado** ve el viaje de otra persona en su lista, no lo cambia (la base de datos lo impide) y la app deja de intentar guardarlo (sin aviso de error).

## 4. Los Vistos de cada persona
Con el interruptor encendido y una cuenta de verdad, la app **pinta los Vistos de esa persona desde `stop_visits`** (no los del administrador, que van dentro de la ruta) y **guarda en la tabla** los que ella pone o quita. Sin renderizar nada nuevo (es un enganche invisible, `VistosPorPersona`). Con el interruptor apagado no se monta nada y los Vistos son los de siempre. Al entrar con la cuenta, los Vistos que el administrador ya tenía dentro de su ruta se copian a su tabla (parte 1).

## 5. Aceptar una recomendación cambia la ruta
- Los tres tipos de recomendación tienen ahora un formato fijo (`payload`), explicado al principio de `src/lib/aplicarRecomendacion.ts`: `cambio` (quitar, añadir o mover una parada), `dia` (sustituir un día o añadir uno nuevo) y `ruta` (la ruta entera).
- El administrador pulsa [Aceptar] (en el bloque provisional) y la ruta **cambia de verdad**, usando las acciones de siempre (quitar, mover, insertar, sustituir un día, añadir un día). Por eso la varita sigue funcionando como hoy: cada día cambiado guarda su copia de antes y «Recuperar este día» lo deja como estaba; «Recuperar mi ruta» vuelve a la ruta que prepararon (quita los días nuevos y las paradas añadidas). La ruta cambiada se guarda sola, como cualquier cambio.
- **Si ya no encaja** (el día o la parada ya no existen, el sitio ya está, la ruta entera era sobre otra ruta…), **no se aplica a ciegas**: la recomendación se marca «ya no encaja» y se le dice por qué («Esta recomendación ya no encaja: Esa parada ya no está en ese día.»). Estado nuevo en la base de datos: `ya_no_encaja` (migración 0021).
- Solo se puede aceptar con **ese viaje abierto** («Abre primero ese viaje para aceptar la recomendación»).
- El administrador no puede reescribir lo recomendado, solo aceptar, rechazar o marcar «ya no encaja» (queda apuntado quién y cuándo).
- Quien recomienda lo hace con `recomendar(tripId, tipo, payload)` (la API existe y está probada; la pantalla para el invitado llega con Design).

## 6. La prueba larga, más rápida
`pruebaFase6y5_motor` acepta ahora `tramo=i/n`: de las 365 fechas del año (partes p2 y p4) hace una de cada n empezando por la i; lo que no depende de las fechas (p1, p18 y tope) solo sale en el tramo 0. **No cambia lo que se comprueba, solo cómo se reparte.** El lanzador es `scripts/destino/_correr6y5.mjs` (`procesos=16`): los lanza todos a la vez, suma las comprobaciones y los fallos y deja cada tramo en una carpeta si se le da `salida=`.

**Resultado** (con el motor tal como está, sin cambiar nada del motor):
- La prueba entera, sin partir, tardó **3.669 s (61 min)**: 143.647 comprobaciones, 0 fallos.
- **Partida en 17 trozos a la vez** (`_correr6y5.mjs procesos=12`: 12 tramos de fechas para p2 y p4, p1 en 4 procesos —una por fecha y «sin fechas»— y p18+tope): **356 s (unos 6 minutos)**, **143.647 comprobaciones, 0 fallos**. Exactamente las mismas comprobaciones que sin partir y los mismos fallos (ninguno).
- Una primera versión, con p1 dentro del tramo 0, tardó 1.238 s porque ese tramo cargaba con p1 (unos 16 minutos él solo); por eso p1 va ahora repartida. El PC tiene 16 procesadores lógicos; con menos tardaría más.
- Para que entre en la batería normal de cada tanda basta con lanzar `API_URL=http://localhost:8787 node scripts/destino/_correr6y5.mjs procesos=12` (hace falta el servidor encendido). No la he metido dentro de `bateriaParalela.mjs` porque esa lanza muchas pruebas a la vez y esta ya lanza 17 procesos: mejor correrla sola, después de la batería.

## 7. La prueba
`node scripts/destino/pruebaCuentas1.mjs`: ampliada a **296 comprobaciones, 0 fallos** (eran 181). Sobre el Postgres de verdad (PGlite) añade, entre otras:
- **Borrar la cuenta:** el viaje con invitados no se borra y pasa al que entró primero (con dos invitados, al primero y no al segundo); sus recomendaciones, las invitaciones del que se borra, los vistos de los demás; el viaje sin invitados sí se borra; los cinco casos de pases (Dúo con Bob, grupo comprado para otros, el pase de otro que usaba, el que solo usaba ella, el regalo); si falla la preparación, no se borra nada; nada de la persona queda en ninguna tabla ni en el almacenamiento.
- **Invitar:** el código, quién puede crear, ver, canjear y anular; la sesión anónima no canjea; un uso por plaza; Dúo (1 invitado) y grupo (3 de 4); lo que deja de valer; el invitado no cambia la ruta; abrir tu propia invitación no gasta uso.
- **Recomendaciones:** el estado «ya no encaja», quién puede ponerlo y que no existen más estados.
- **Vistos de cada persona y recomendaciones aplicadas** (con el almacén real de la app): pintar los vistos de una persona, detectar lo que pone o quita, y cada tipo de recomendación aplicada a la ruta con «Recuperar este día» y «Recuperar mi ruta» después; las que ya no encajan no cambian nada.

**Batería rápida** (82 pruebas, sin `pruebaFase6y5_motor`, que va con su lanzador): todas en 0 fallos. Una, `pruebaTanda6z3_dias`, falló la primera vez porque un texto de `aplicarRecomendacion.ts` armaba a mano «del día {n}» (esa prueba lo prohíbe); ahora usa el título del día («Quitar X en «Día 1»») y vuelve a 0. `tsc -p tsconfig.app.json` sin errores. `pruebaCuentas1`: **296 comprobaciones, 0 fallos**.

## Lo que tienes que hacer tú, fuera del código
No me pegues ninguna clave en el chat.
1. **Aplicar las dos migraciones juntas, en este orden:** `0020_cuentas.sql` y después `0021_cuentas_2.sql`, en el SQL Editor de Supabase (cada una en una sola ejecución). La 0021 necesita las tablas de la 0020. Si la 0020 ya estuviera aplicada, solo la 0021. **Sin la 0021, borrar una cuenta no funciona** (responde con un aviso y no borra nada).
2. Antes, lo de siempre: que estén aplicadas 0001, 0002, 0003, 0012 y 0018 (la 0020 las necesita).
3. Mirar si la **0017** (ventas del afiliado) está aplicada, antes de mandar ventas (ver punto 1).
4. Cuando quieras probar a mano: enciende `VITE_CUENTAS_ACTIVAS=true` solo en un entorno de pruebas y prueba: crear una invitación, abrir el enlace con otra cuenta (otro navegador), ver que entra como invitada y no puede cambiar la ruta, mandar una recomendación y aceptarla, borrar la cuenta de la administradora y comprobar que la invitada se queda con el viaje.
5. Sigue pendiente de la parte 1: el servicio de correos (necesita dominio), los textos de privacidad y, al salir, pasar Google de «Prueba» a «Publicado».

## Qué falta
- Las pantallas de verdad (Design): invitar, entrar con enlace, la lista de recomendaciones y la del invitado para recomendar; el botón [Guardar en mi galería]. Las de ahora son provisionales.
- **Mis viajes con viajes de otras personas:** el invitado ve el viaje que le han compartido en su lista y en las cifras del Perfil como si fuera suyo (la lista no distingue aún entre «mis viajes» y «viajes compartidos conmigo»: se marca `esInvitado` en los datos, falta pintarlo). Va con las pantallas.
- Un invitado que abre el viaje compartido ve la ruta del administrador y puede mover cosas en su pantalla, pero **no se guarda** (a propósito). Cuando haya pantallas, ahí saldrá [Recomendar un cambio] en vez de los botones de editar.
- El cobro de los pases y la concesión de logros (tandas siguientes).

## Riesgos y lo que no he podido hacer
- **No lo he probado con Supabase de verdad** (ni con la clave nueva, ni con Google, ni con el envío de correos). La prueba usa un Postgres real pero no es Supabase; el acceso y el almacenamiento están simulados.
- **Quien se borra no puede recuperar nada.** Lo traspasado (viaje, pase) pasa a otras personas sin preguntarles; verán el viaje como suyo. Habrá que avisarles con una pantalla cuando exista.
- **Un pase al que se le va un uso no recupera la plaza.** Lo decidí así para que nadie pueda quedarse una plaza libre de un pase que ya pagó otro. Si prefieres que la plaza vuelva, es cambiar dos líneas de la 0021.
- **El viaje compartido que se traspasa pierde sus invitaciones antiguas** (los enlaces que mandó la administradora que se va). La nueva administradora tendrá que crear otros.
- La lista de «Mis viajes» pide ahora (con el interruptor encendido) todos los viajes que la base de datos deja ver. Eso depende de que la 0020 esté aplicada: sin ella, las reglas viejas solo dejan ver los propios y todo sigue igual.
- Aceptar una recomendación aplica el cambio con las acciones de siempre. Si la recomendación trae una parada con datos incompletos (sin coordenadas, por ejemplo), la ruta puede quedar con una parada pobre; la pantalla del invitado tendrá que mandarlas bien formadas.
