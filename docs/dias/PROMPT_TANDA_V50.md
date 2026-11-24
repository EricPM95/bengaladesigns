Hola. TANDA V50: RESERVAS Y EL AVISO «HOY YA NO PUEDES ENTRAR» (tanda corta, MODO RÁPIDO). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v50.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí:** nada que funcione se quita.

**Dibujos: `NUEVO_DISEÑO`, en mis Descargas** (el Design más reciente, con los dibujos A1-A3 de esta tanda; sustituye a `PARA_CODE`). Descomprímelo en `docs/diseno/proyecto/` (sustituye lo que haya) y míralo con `scripts/destino/capturaDesign.mjs`. **Design es un prototipo:** se copia SOLO lo que se describe aquí.

## 0. Regla nueva para CLAUDE.md (Eric: «a veces hace las cosas horribles»)
Toda pantalla, hoja o aviso nuevo **usa las piezas que ya existen** (`HojaPropuesta`, `BOTON_ORO`/`BOTON_CLARO`, las tarjetas de HOY, la hoja de opciones de DÍAS…) y el mismo diseño que su pantalla hermana. **Nunca inventa un diseño:** si no hay dibujo, copia la pantalla más parecida que ya existe y lo dice en el REPASO. Ante la duda, pregunta.

## 1. «Hoy ya no puedes entrar a los Museos Vaticanos» (A1-A3)
- **El aviso (A1):** el texto se queda; el enlace pasa de [Ver solución] a **[Pasar a otro día]**.
- **Hoy [Ver solución] abre «Una solución»** («Esta vez no hay un cambio pequeño…», cierran a las 20:00, «llegáis») con solo [Dejarlo como está]. Fuera.
- **La hoja de «Pasar a otro día», con el diseño nuevo (A2), y la MISMA pieza para Cambiar plan › «Pasar a otro día»:**
  - el texto de arriba («Hoy ya no llegas a los Museos Vaticanos. Te los pasamos al jueves 26, que tiene hueco y está abierto.»);
  - **la tarjeta del sitio:** foto pequeña, nombre, cuándo en gris («Por la mañana», «Al final del miércoles · «Si te sobra tiempo»») y a la derecha la fecha en su cuadrado oscuro («JUE 26»). No se pulsa;
  - la franja verde «✓ Sigue igual: el resto de tu {día de hoy}»;
  - [Pasarlos al jueves], [Elegir otro día] y [Dejarlo como está]. Siempre de «tú».
- **Si no cabe en ningún día (A3):** «Hoy ya no llegas a los Museos Vaticanos, y no caben en ningún otro día de tu viaje.», con el dorado **[Guardarlos en pendientes]** y, pequeños, [Quitarlos del viaje] y [Dejarlo como está].

## 2. RESERVAS › «Llegada y vuelta» sin vuelos, como «Alojamiento»
Hoy [Buscar vuelos] sale fuera del bloque. Igual que el alojamiento: dentro del bloque, «¿Ya tienes vuelo?» con el botón blanco **[Añadir mi vuelo]** (abre la hoja «Tu vuelo» de siempre) y «¿Aún no?» con **[Buscar vuelos]**. Plegado, solo la cabecera.

## 3. El buscador del alojamiento (`buscarLugarPhoton.ts`)
- **Ordena mal:** con «Via Nazionale» o «Via Nazionale 22» salen sitios con «nazionale» en el nombre (el Istituto nazionale di statistica tres veces, un museo) y **no la calle**. Primero calles y portales, después sitios con nombre; sin repetidos; sin tildes antes de buscar («Vía» → «Via»). Mira `location_bias_scale`, `zoom` y los `layer` de Photon.
- **El campo «O escribe la dirección» también busca** con el mismo buscador y las mismas sugerencias (Eric escribió ahí y no salía nada).
- Compruébalo con «Via Nazionale», «Via Nazionale 22», «Via del Corso», «Vía della Conciliazione» y «Hotel Artemide».

## 4. Pequeños de RESERVAS
- **El aviso naranja del documento**, con su nombre: «Esta **tarjeta de embarque**…» (avión), «Este **billete**…» (tren, bus, barco), «Esta **entrada**…», «Esta **reserva**…» (alojamiento, excursión, coche). Hoy siempre «Esta tarjeta».
- **La rueda de la hora:** la X se monta encima del ✓. **Quita la X:** se cierra tocando fuera o deslizando hacia abajo, sin guardar. Se quedan la papelera y el ✓. En todas las hojas con hora.
- **Al subir una entrada o una excursión** cuyo documento trae otro día u otra hora: la app lo corrige y lo dice, como ya hace con el vuelo.
- **Entradas en otro día: [Deshacer].** En la V49 solo lo pusiste en la excursión. Que el aviso con [Deshacer] salga cuando el motor termine de recolocar los días, y que deshaga todo.
- **Los datos de las excursiones:** revisa una por una las de Roma y Lanzarote en nuestros archivos y quita lo inventado (puntos de encuentro, horas). Dime cuáles has tocado.

## 5. Sin pruebas
- No pases pruebas ni escribas una nueva (hay una tanda solo para eso).
- Antes de subir: `npm run build` sin errores y una captura en modo iPhone de cada punto.
- El REPASO, corto: esas capturas, qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
