Hola. TANDA 10G: LA APERTURA, LA SESIÓN ABIERTA, EL PRIMER PASO DE CREAR EL VIAJE Y LA VERSIÓN GRATIS. No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10G.md e inclúyelo en tu commit.

## 1. La pantalla de apertura
- **Sale siempre que se abre la app:** desde el navegador, desde el icono de la pantalla de inicio del móvil y al volver a abrirla otro día. Hoy solo sale la primera vez en cada pestaña (`sessionStorage` en index.html): quita esa condición. La única excepción es la recarga que hace la propia app justo después de entrar en la cuenta o de unirse a un viaje, para que no salga dos veces seguidas.
- **Una línea nueva debajo del lema:** «De viajeros, para viajeros» y, debajo, **«TU APP DE VIAJES»**, más pequeña, en mayúsculas espaciadas y en el oro profundo, como estaba en la apertura de Design (Marca JUTRIP 02 · 01). Entra después del lema, suave.
- **Dura 3,5 segundos y se ve entera (Eric):** el logo, el lema letra a letra y «TU APP DE VIAJES». Si no cabe, acelera las animaciones para que todo quepa en 3,5 segundos, pero que se vea todo.
- **No se corta nunca:**
  - Hoy la app la quita a los 3 segundos desde que se abre la página (`3000 - performance.now()` en main.tsx), y si la animación empieza tarde (por ejemplo, esperando la letra Italiana), se queda a medias. Que se quite **solo cuando ha acabado la animación entera**, contando desde que empieza de verdad.
  - **Fuera el toque que la salta:** ni la app ni un toque la cortan.
- Con las animaciones reducidas del móvil: quieta, con el logo, el lema y la línea nueva, 1,5 segundos.

## 2. La sesión abierta, como en todas las apps
- **Lo que pasa:** Eric dice que cada vez que entra tiene que pasar por la pantalla de entrar, con el email. **Primero, averigua por qué** y dímelo. Mira todos los casos:
  - el navegador del PC;
  - el navegador del móvil (Eric usa el iPhone);
  - la app instalada desde el icono de la pantalla de inicio;
  - el enlace del email que se abre en otro navegador (por ejemplo, dentro de la app de Gmail), que deja la sesión en ese navegador y no en el de la app;
  - Google;
  - que la sesión caduque o no se renueve (`persistSession`, `autoRefreshToken`, cuánto dura la sesión).
- **Lo que tiene que pasar:**
  - Con la sesión abierta, al abrir la app sale **solo la apertura** y después, directamente, **tu último viaje**.
  - **En qué pestaña se abre (Eric):** siempre en **RUTA**. Si hoy es un día del viaje, en **HOY**. Esto pasa siempre que se sale de la app y se vuelve a entrar, aunque antes estuvieras en otra pestaña.
  - La pantalla de entrar sale solo si no hay sesión, o si el viajero la ha cerrado con [Cerrar sesión].
  - La sesión dura hasta que el viajero la cierra.
- Arregla lo que se pueda arreglar en la app. Lo que dependa de algo de fuera (de cómo guarda la sesión el iPhone para la app instalada, o de un ajuste de Supabase que tenga que cambiar Eric), explícamelo en español sencillo y dime exactamente qué tiene que tocar Eric y dónde.

## 3. El primer paso de Crear el viaje («¿De dónde sales y a dónde vas?»)
- **La tarjeta del destino sin foto:** al tocar «Destino», sale la tarjeta de Roma con un fondo de rayas, sin foto. Tiene que llevar **su foto: en Roma, la del Coliseo**. Que salga de los datos de cada destino (la foto de portada del destino), no de una lista fija, para que los destinos nuevos tengan la suya sin tocar nada.
- **Los transportes, en la misma pantalla:**
  - Hoy, al tocar [Trazar ruta], la app salta a la pantalla antigua «02 — Calculando ruta… Conectando Barcelona con Roma», con la distancia y los transportes (Avión, Tren, Autobús, Ferry, En tu coche).
  - Tiene que pasar **en la misma pantalla del paso 1**: al tocar [Trazar ruta], el mapa se queda y dibuja la línea de origen a destino; la tarjeta de abajo («Origen», «Destino» y [Trazar ruta]) desaparece y, en su sitio, con la misma tarjeta, aparecen la distancia y los transportes, con su tiempo, como en la pantalla antigua.
  - Arriba, en lugar de «¿De dónde sales y a dónde vas?», «Conectando *Barcelona* con *Roma*», con los nombres en oro.
  - Lo demás del paso, igual (elegir el transporte y seguir al paso 3).
  - Design no tiene pieza para esto: hazlo con las piezas que ya hay (la tarjeta del paso 1 y la lista de transportes de la pantalla antigua) y con los colores de Marca JUTRIP, y enséñamelo en las capturas.

## 4. La versión gratis: lo de pago, cerrado y a la vista
**La idea (Eric, 23-oct):** quien no tiene el pase ve **todo** lo que el pase le daría, cerrado y con su invitación, **nunca escondido**.
- **Una sola pieza de «cerrado» para toda la app:**
  - lo de pago se ve **en gris, con un candado dorado sobre fondo marfil**, y una línea corta con lo que ganarías;
  - al tocarlo, se abre lo mismo que abre hoy [Ver el Pase de Roma]: **la hoja de compra que ya existe** («¿Cuántos sois?», con 1 persona, Dúo y Grupo). Hazlo con **una sola función para abrir el pase**, que usen todos los candados, la pastilla de RUTA y los [Ver el Pase de Roma]: cuando llegue la película del pase (Design la está haciendo), solo habrá que cambiar esa función para que abra primero la película;
  - como mucho **una** invitación grande (una tarjeta) por pantalla: lo demás, solo con la pieza del candado.
- **Guardar el viaje es gratis; que la app lo use para ajustar tu ruta es del pase (Eric, 24-oct).** Aunque sea gratis, el viajero tiene que poder tener **todo su viaje guardado** en RESERVAS: su vuelo o tren, su alojamiento y sus entradas. Lo que da el pase es lo que la app hace con eso.
  - **RESERVAS, «Llegada y vuelta»: abierto y gratis.** Hoy, sin pase, desaparece entero y el resumen dice «0 de 2 listo». Tiene que salir como con pase, para apuntar el vuelo o el tren (la hora, la referencia, la compañía), y el resumen vuelve a **«0 de 3 listo»**. Dentro, debajo del vuelo guardado, la pieza del candado: «Con el pase, ajustamos tu primer y tu último día a tu vuelo».
  - **DÍAS, el vuelo:** la barra «Llegada · desde Madrid» con [+ Vuelo] **abierto** (guarda el vuelo, igual que en RESERVAS). Lo que va cerrado es el ajuste: si el vuelo cambia el primer o el último día, sin pase el día no se ajusta y sale la pieza del candado con «Con el pase, tu día se ajusta a la hora de tu vuelo». El billete de llegada y de vuelta, visible con los datos guardados.
  - **El alojamiento:** guardarlo en RESERVAS, gratis (como ahora). Lo cerrado es lo que hace la app con él: la zona del alojamiento para que cada día empiece cerca y [Cómo llegar a tu alojamiento], con «Con el pase, cada día empieza cerca de donde duermes».
  - **El presupuesto:** las líneas de ida y vuelta, gratis (son datos del viajero).
  - **Los avisos de la campana cuando una reserva no cuadra con el vuelo** (por ejemplo, una entrada a las 11:00 el día que aterrizas a las 15:40): **gratis**. Hoy son solo de pago; ahora que el vuelo se guarda gratis, el aviso también, porque evita que el viajero pierda una entrada pagada.
  - Si algo de esto choca con cómo está hecho el motor (por ejemplo, que guardar el vuelo ya mueva el día solo), dímelo antes de cambiarlo.
- **Lo que hoy desaparece sin pase y tiene que salir cerrado:**
  - **EXPLORAR, «Cerca de mí»:** Baños y Fuentes, en gris con su candado (hoy no salen). Los restaurantes y los lugares, gratis como ahora.
  - **DÍAS y RESERVAS, la zona del alojamiento** y [Cómo llegar a tu alojamiento], como se dice arriba.
- **Lo que es gratis (Eric):**
  - el Perfil y «¿Dónde has estado ya?» (los países de antes);
  - el resumen de RESERVAS («0 de 3 listo», con «Llegada y vuelta» contando);
  - guardar en RESERVAS el vuelo o el tren, el alojamiento y las entradas;
  - la ruta, los días, el mapa, las fichas (con sus tips, horarios y cierres), quitar, mover y añadir paradas, EXPLORAR, las entradas, el Free Tour, las excursiones, buscar alojamiento y el presupuesto;
  - la historia del Coliseo, como muestra.
- **Lo que es del pase y ya sale bien cerrado:**
  - HOY (con el día de prueba y la pantalla 1a/1b);
  - [Escuchar historia];
  - la tarjeta del día de vuelta;
  - el «Si llueve» va dentro de HOY y no necesita candado aparte.
- **RUTA, la pastilla del pase en la tarjeta de cada destino** (aprobada por Eric; hoy no está en la app): como **P0c** (sin pase) y **P0d** (con pase) de `Piezas/Pase Incluye`, con los colores de Marca JUTRIP:
  - sin pase, «Pase de Roma» con el candado, sobre marfil;
  - con pase, «Pase de Roma» con el ✓, sobre oro;
  - al tocarla, la misma función para abrir el pase;
  - con varios destinos, cada tarjeta lleva la suya («Pase de Florencia»…), con el nombre sacado de los datos.
- **Logros sin pase:** que se vean la vitrina y las colecciones, cerradas, con «Con el Pase de {Destino}, cada sitio que ves suma» (en Roma, «Pase de Roma»). [Visto] no cuenta sin pase, salvo el día de prueba. Enséñame cómo queda.
- **HOY antes del viaje:** quita el [Ver el Pase de Roma] repetido (el de la tarjeta del día de prueba); se queda el del panel. La tarjeta, sin botón o con «Cuándo es mi día de prueba».
- **La página para revisarlo:** `docs/dias/GRATIS_REVISION.html`, con una captura de cada pantalla sin pase (RUTA con la pastilla del pase, DÍAS con el vuelo guardado y el ajuste cerrado, HOY antes, durante y después del viaje, EXPLORAR con «Cerca de mí», la ficha de un sitio, RESERVAS con «Llegada y vuelta» abierto y «0 de 3 listo», Logros y el Perfil). Que se lea bien en el móvil.

## 5. La prueba
- La batería rápida y `pruebaJutrip`.
- Prueba nueva:
  - la apertura sale en cada apertura nueva y no sale dos veces con la recarga de después de entrar;
  - no se quita antes de que acabe la animación, y un toque no la corta;
  - con la sesión guardada, al abrir no sale la pantalla de entrar, se abre el último viaje en RUTA y, si hoy es un día del viaje, en HOY;
  - la tarjeta de Roma lleva su foto;
  - [Trazar ruta] no cambia de pantalla;
  - sin pase, el vuelo se puede guardar en RESERVAS y en DÍAS, el resumen dice «0 de 3» y el día no se ajusta al vuelo (sale el candado);
  - sin pase, la zona del alojamiento y «Cerca de mí» salen cerrados (no desaparecen) y al tocarlos se abre la pantalla del pase;
  - la pastilla del pase sale en la tarjeta de RUTA, con candado sin pase y con ✓ con pase;
  - con pase, todo sale abierto como siempre.
- Capturas en `docs/dias/capturas_jutrip/`:
  - la apertura en tres momentos y el final, con «TU APP DE VIAJES» (comprueba que no salen en blanco);
  - el paso 1 con la tarjeta de Roma y su foto;
  - el paso 1 después de [Trazar ruta], con los transportes.

## 6. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10G»: por qué pedía entrar cada vez, qué has arreglado, cuánto dura la apertura, qué sale cerrado en la versión gratis y lo que tenga que hacer Eric.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
