Hola. TANDA 10N11: EL ALOJAMIENTO GRATIS Y CON PASE, «CÓMO LLEGAR A TU ALOJAMIENTO», LOS CANDADOS DEL PASE, LA LISTA DEL PASE POR PUNTOS Y HOY SIN PASE (29-oct). Va después de la 10N10: si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas (si hace falta, dímelo antes). No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N11.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Design:** el zip completo más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`). Lo de esta tanda: `Piezas/Vuelo Reservas` (02, 03, 08o, 08p, 08q, 08b, 09, 09p), `Piezas/Alojamiento Dias` (01, 02, 02b, 03), `Piezas/Pase Lista` (1, 2 y 2b) y los candados repasados de `Pase Incluye`, `Pase Estilo`, `Pase Escena 4b`, `Recuerdos Ficha` y `Viaje Compartido`. **El diseño, exactamente igual; los textos y los datos, los de este prompt.**
- **Esta tanda cambia cosas de la 10N10** (el alojamiento y la caja de su pase): manda lo de aquí.
- **Cómo trabajar:** hasta 4 agentes a la vez si va más rápido, un solo servidor, hasta 2 Chrome de prueba a la vez (las pruebas del Supabase real o de las mismas cuentas, solas). Con menos de 6 GB libres, espera. Cierra todo lo que deje de hacer falta. La nota de estado (`docs/dias/_estado_10n11.md`) a la rama `estado` cada 30 minutos, también mientras corren las pruebas. No apagues el PC.
- **Las pruebas, solo las de lo que tocas** más `pruebaJutrip` (no la batería completa).

## 1. Las reglas nuevas para toda la app (a `docs/REGLAS_DE_LA_APP.md`)
- **El candado del pase, siempre igual:** cuando algo es del pase y el usuario aún no lo tiene, el candado es **dorado sobre un círculo azul oscuro** (como el de «¿Dónde te alojas?»), también en las líneas pequeñas del pase. Repasa todas las pantallas donde sale un candado del pase.
- **Con el pase, sin frases del pase:** las líneas que explican lo que hace el pase solo salen a quien no lo tiene. Con el pase, fuera.

## 2. El alojamiento: gratis y con pase
- **Gratis:** el nombre del hotel (para tenerlo en la app), «¿Para quién es el alojamiento?», «¿Cuánto ha costado en total?» y «¿Quién lo ha pagado?» (la parte del dinero de la 10N10).
- **Con el pase, además:** la **zona** y la **dirección** del hotel. Con eso, el primer día (y como mucho el último) empieza cerca del alojamiento (lo que ya hace el pase) y sale **[Cómo llegar a tu alojamiento]** (apartado 3).
- **La hoja «Tu alojamiento», en este orden** (`Vuelo Reservas` 08o, 08p, 08q y 08b):
  1. «Nombre del hotel» y, debajo, **[Buscar alojamiento]** (lo que ya tenemos: buscar en el mapa).
  2. **La zona y la dirección:**
     - **sin pase:** sin la lista de zonas. Un bloque pequeño, en gris, con el candado dorado sobre azul en su esquina: «**¿Dónde te alojas?**» y «**Dirección del hotel**»; al tocarlo, el aviso del pase. Debajo, la línea en gris con su candado: «**Con el Pase Roma, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.**» (texto de Design, decisión de Eric: no lo cambies);
     - **con pase, la primera vez:** la lista de zonas a la vista para elegir (Prati, Trastevere, Centro, Termini, Aún no lo sé), como la 08o;
     - **con pase, una vez elegida:** un desplegable cerrado con la zona elegida en azul oscuro con ✓ (08p); al tocarlo, se abren las demás (08q). Debajo, «Dirección» y [Cómo llegar a tu alojamiento]. Sin frase del pase.
  3. «¿Para quién es el alojamiento?» (cuadrados), «¿Cuánto ha costado en total?», «¿Quién lo ha pagado?» (con **todas** las personas marcadas, no solo una; en la 08 de Design solo sale Eric), la línea («90 € cada uno · Va a la cuenta conjunta») y [Guardar el alojamiento].
- **Fuera la caja del pase «Tu primer día, cerca de donde duermes»** (y la de «¿En qué zona te alojas?» de antes) en la hoja y en la tarjeta: en su lugar, la línea en gris de arriba.
- No se pierde nada de lo que hay hoy en el bloque del alojamiento.

## 3. «Cómo llegar a tu alojamiento» (con pase), en tres sitios
- **RESERVAS, la tarjeta del alojamiento** (`Vuelo Reservas` 09 y 09p): sin pase, el nombre del hotel, la línea en gris con el candado y «En este alojamiento · Tú y Viajes» (en redondo); con pase, «Tu zona · Prati» con la dirección y «Cambiar», [Cómo llegar a tu alojamiento] y «En este alojamiento».
- **DÍAS, dentro del día 1** (`Alojamiento Dias`): sin alojamiento, «Alojamiento · Roma · Añade tu alojamiento» y [+ Añadir] (01); con pase, «Alojamiento · Prati», el nombre, la dirección y [Ir] (02); sin pase, «Alojamiento · Roma», el nombre, sin zona ni dirección, y [Ir] con el candado (02b). Al tocar [Ir] sin pase, el aviso del pase.
- **HOY (nuevo):** un botón o una tarjeta [Cómo llegar a tu alojamiento] que se vea bien, al empezar y al acabar el día. Sin pase no sale.
- **[Cómo llegar]** abre el camino desde donde está el viajero hasta la dirección del hotel (lo que ya hace «Cómo llegar a tu alojamiento» hoy).

## 4. El vuelo
- **DÍAS, la tarjeta del vuelo** (`Alojamiento Dias` 03): «Aterrizas a las 15:40» y debajo «**Fiumicino · Cómo llegar desde el aeropuerto**». Fuera «libre hacia las 17:40»: no enseñamos horas calculadas.
- **La hoja del vuelo** (`Vuelo Reservas` 02 y 03): debajo de las horas, sin pase, la línea en gris con el candado: «**Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.**». Con pase, sin línea.
- «¿Para quién es este vuelo?» (como en Design ya).
- **«Tú» con su inicial** («E»), no con una «T», en todas las tarjetas.

## 5. La lista del pase por puntos y HOY sin pase (`Piezas/Pase Lista`)
- **La lista del pase (1):** sustituye a la pantalla que pusiste en la 10N10 en lugar de la película. Todo lo que abría la película abre esta lista. Exactamente como Design, con sus dibujos, sus textos, los precios (de `data/pase/precios.json`) y [Elegir mi pase]. Comprueba que cada punto existe de verdad en la app (`data/pase/incluye.json`): si alguno no, dímelo y no lo pongas.
- **HOY sin pase (2 y 2b):** lo que ve en la pestaña HOY quien no tiene el pase: «HOY, tu guía del día», los puntos con sus dibujos y, abajo, la caja según el día de prueba: sin usar, «Tienes un día de prueba con HOY completo, gratis.» · «Lo usamos el día que llegas, si es antes de las 10:00; si no, el día siguiente.»; ya usado, «Ya has usado tu día de prueba.» · «Con el Pase Roma, tienes HOY todos los días de tu viaje.». Y [Ver el Pase Roma], que abre la lista.

## 6. La prueba
- Solo las pruebas de lo que tocas en esta tanda, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10N11`: el alojamiento sin pase (nombre, bloque pequeño con candado, la línea) y con pase (la lista la primera vez, el desplegable después, la dirección, [Cómo llegar]); «¿Quién lo ha pagado?» con todos los marcados; la tarjeta de RESERVAS con y sin pase; el bloque del día 1 en DÍAS con y sin pase; [Cómo llegar a tu alojamiento] en HOY; la tarjeta del vuelo sin «libre hacia»; la línea del vuelo sin pase y sin ella con pase; «Tú» con la inicial; el candado dorado sobre azul en todas las pantallas del pase; la lista del pase y HOY sin pase con sus dos cajas.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N11.html`, a tamaño de móvil, al lado de las de Design.

## 7. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N11». Di qué pruebas has pasado, qué no se ha podido hacer igual que Design y si hace falta migración (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta, con pase o sin él) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N11.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
