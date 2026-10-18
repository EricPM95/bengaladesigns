Hola. Nueva tanda grande: LAS CUENTAS, PARTE 3 (LAS PANTALLAS DE VERDAD Y EL COBRO DEL PASE). Es la última tanda grande antes de revisar toda la app. Todo detrás de los interruptores de siempre (`VITE_CUENTAS_ACTIVAS`, `PASES_COBRO_ACTIVO`, `PUSH_ACTIVO`): con ellos apagados, la app es la de hoy. Quita las pantallas provisionales de las partes 1 y 2 cuando estén las de verdad. No toques el motor de rutas.

Es larga: hazla por partes, en este orden, con un commit (sin push) al acabar cada una.

## 0. Antes de empezar
- Lee tus INFORME_CUENTAS_1.md, INFORME_CUENTAS_2.md, INFORME_TANDA8A2.md, INFORME_TANDA8C1.md e INFORME_TANDA8C3.md.
- En docs/dias: GRATIS_Y_PASE.md, REVISION_DESIGN_PASO3.md, ORDEN_PARA_CODE.md, EXP_Y_NIVELES.md, NOTAS_TRAS_8C3.md y los apartados 24, 25, 27, 33 y 34 de APUNTES_TRAS_TANDA7.md.
- **El diseño**, en `docs/diseno/proyecto/`:
  - **App · Pase y cuenta:** 01 (P1, P3, P6, P7, P7b, P8, P8b, P9, P10), 02 (A1, A2, A3, A4) y 03 (I1, I2);
  - **App · Ruta y días · 07 · Recomendar cambios:** RS1, RS2, R1, RW1, RW2, RW3, RM, RV, RSent, R2a, R2b, R2c, R2d y la campanita (AV1 a AV7);
  - **Logros · Pantallas · 04:** P3 (Ajustes), P4 (Mis pases), P5 (Borrar la cuenta), P6 (la invitación al pase) y el aviso de las sorpresas pendientes;
  - las piezas `Pase Cuenta`, `Avisos` y `Cambio Parada`.
  - Si dos pantallas dicen cosas distintas, manda la de **App · Pase y cuenta** (P7b es la decidida por Eric; P6 de Logros · Pantallas es la misma pantalla) y dímelo.
- Claude ha dejado este prompt y NOTAS_TRAS_8C3.md en docs/dias. Inclúyelos en tu commit tal cual.
- Si necesitas una migración nueva, escríbela (0026 o la que toque) sin aplicarla, y dime en qué orden va.

## 1. Entrar en la cuenta (Pase y cuenta · 02)
- **A1, A2 y A3**, como en el diseño: [Continuar con Google], [Entrar con mi email], el enlace enviado con [Abrir mi correo] y «¿No te llega? Enviar otra vez» (que no deje mandar otro hasta pasado un rato).
- **La cuenta se pide al empezar** (Eric). Fuera el «seguir sin cuenta» de las pruebas.
- Se queda lo que ya hiciste: la sesión anónima pasa a ser la cuenta con el mismo `uid` (caso A), o se traspasa a la cuenta que ya existía (caso B). Nadie pierde un viaje que ya tenía en el móvil.
- **Después de entrar,** A4: el formulario de verdad de crear el viaje. Si ya tiene viajes, su viaje.
- **I1 e I2:** el icono y la pantalla al abrir.
- **El nombre y el logo** salen de `data/marca.json`, en todas las pantallas y en los avisos del móvil. El hueco del LOGO, vacío y preparado. Ningún nombre de app escrito a mano (en el diseño sale «Trazo» en un aviso: no lo copies).
- **Privacidad y condiciones:** la página que ya hiciste, con un apartado nuevo de **condiciones de uso y de compra**. Cada apartado con «Texto pendiente» (lo escribe el gestor). Añade a la lista de servicios el de pago.

## 2. El Pase de Roma y el cobro (Pase y cuenta · 01)
**Las pantallas:**
- **P1:** en RESERVAS, al guardar el vuelo sin pase, debajo del vuelo (no encima de la ruta). Si ya estaba, compruébalo.
- **P3, P10 y la pantalla 12 de App · HOY:** ya las hiciste en la 8B. Que [Ver el pase] y [Seguir con HOY] abran ahora la hoja de compra (hoy lanzan un evento que nadie escucha).
- **P6, la hoja de compra:**
  - 1 persona, 6,99 €;
  - Pase Dúo · 2 personas, 10,99 €, con 13,98 € tachado y «5,50 € cada uno»;
  - Pase Grupo · 3 o más, 4,99 € cada uno, con [−] y [+].
  - El máximo de personas del Grupo, en un dato. Si ya tienes uno, dime cuál.
  - Los precios, en un archivo de datos, no en el código. El precio lo pone siempre el servidor, nunca el móvil.
  - Antes de [Comprar], deja un hueco para la línea legal que pida el gestor (por ejemplo, la del derecho de desistimiento en lo digital), con «Texto pendiente».
- **P7:** compartir el pase, con su código y «1 de 2 usados».
- **P7b:** lo que ve quien recibe el enlace: «Laura te invita a su Pase de Roma», «Sin pagar nada» y [Unirme]. Si no tiene cuenta, A1 y después entra.
- **P8:** el aviso de los 10 días, en el móvil y en la campanita (punto 4).
- **P8b y P9:** solo con dos viajes a Roma que se pisan, como ya lo dejaste en la 8a2.

**El cobro:**
- **El servicio de pago: Stripe** (Checkout, que ya trae tarjeta, Apple Pay y Google Pay en la web), en **modo de pruebas**. Si para una web en España ves algo claramente mejor, dímelo en el informe, pero hazlo con Stripe.
- **El pase lo crea solo el servidor**, cuando Stripe confirma el pago (su aviso al servidor, con la firma comprobada). Nunca desde el móvil.
- Si el mismo aviso llega dos veces, un solo pase.
- **Si se devuelve un pago,** el pase se anula. Lo ganado no se pierde nunca.
- **Paga todo el que compra;** los invitados entran sin pagar, cada uno con su plaza.
- **El pase es por destino, para siempre** («el pase de Roma»), como en GRATIS_Y_PASE.md. Ajustar los vuelos del segundo viaje (1,49 €) es de 2027: no lo hagas.
- **La prueba de HOY va con la cuenta:** una por cuenta, para siempre. Que no se pueda volver a tener borrando la app o entrando con otra sesión anónima.
- **Sin las claves de Stripe**, o con `PASES_COBRO_ACTIVO` apagado: todo abierto, como hoy, y la hoja de compra no sale.
- **Un modo de pago de mentira** para las pruebas y el modo de pruebas (pago bueno, pago rechazado, pago devuelto), sin Stripe.
- **Los registros de los cobros** no se borran al borrar la cuenta (Hacienda pide guardarlos): se quedan aparte, sin nada que lleve a la persona más que lo necesario. Apúntalo como duda para el gestor.
- **[Ver recibo]** (en Mis pases): el recibo de Stripe.
- Que el código de Stripe no pese al abrir la app: solo cuando se va a pagar.

## 3. Compartir el viaje y recomendar cambios (Ruta y días · 07)
- **RS1 y RS2:** [Compartir viaje] en RUTA, con la hoja del enlace y el código. Con un Pase Dúo o Grupo, la misma hoja (P7), y el invitado entra con su plaza.
- **Un solo formato de código** en toda la app (el que ya tienes, que se lea bien en voz alta).
- **R1:** lo que ve el invitado, con la ruta de verdad del administrador y **sus propios** Vistos.
- **Recomendar, de tres maneras:**
  - una parada, desde su menú «···» (RW1);
  - un día, desde su cabecera (RW2);
  - la ruta entera, desde RUTA (RW3).
- **RM, el modo recomendación:** las herramientas de siempre, pero nada cambia hasta [Enviar a Elena]. La barra «Tu propuesta · N cambios» con [Ver] y [Enviar a Elena].
- **RV:** [Ver], la lista de sus cambios, cada uno con [Deshacer].
- **RSent:** «Se lo hemos mandado a Elena» y [Volver al viaje].
- **Cambiar una parada por otra** va como una pareja (ya la guardas así desde la 8a2), en su recuadro «Propuesta: cambiar» (la pieza `Cambio Parada`), en RM, en RV y en R2.
- **R2 (a, b y c):** la hoja del administrador, siempre por días: solo los días que cambian; lo que sale, tachado en rojo; lo que entra, en verde; lo que no cambia, en gris. [Aceptar] y [No, gracias].
- **R2d:** si el día ya no existe, «¿En qué día lo pones?».
- **El administrador siempre puede aceptar,** aunque su ruta haya cambiado: lo propuesto sustituye a lo de ahora. La varita lo deshace, como ya funciona.
- **En la tarjeta del día que cambia,** la etiqueta «1 recomendación» mientras no conteste. Al tocarla, R2.
- **Laura, en su [Ver]:** «Enviada · esperando a Elena».
- **Quita del Perfil** el bloque provisional «Invitar y recomendaciones».

## 4. La campanita de Avisos (Ruta y días · 07, AV1 a AV7)
- **Es la campanita de Avisos que ya hay** en la cabecera de RUTA y DÍAS. Ponla también en HOY, en el mismo sitio (AV4). No hagas otra.
- **Una tabla de avisos en el servidor,** de cada persona, con leídos y sin leer. El puntito, si hay alguno sin leer. Los avisos que ya enseña la campanita hoy siguen saliendo.
- **La lista** (AV2), lo más nuevo arriba y lo no leído destacado:
  - «Laura te recomienda un cambio en el día 2» (o «cambios en el día 3», o «otra ruta»);
  - «Elena ha aceptado tu cambio en el día 2» y «Elena ha preferido dejar el día 2 como estaba» (AV5, la de Laura);
  - «Laura se ha unido a tu viaje»;
  - «En 10 días empieza tu viaje a Roma»;
  - «Tu resumen del viaje está listo»;
  - «Te quedan 3 días para reclamar tus 2 sorpresas de Roma».
- **Tocar una recomendación** abre R2. Al contestar, en la lista queda «Aceptada» o «No aceptada» (AV3).
- **En el móvil** (AV6), lo mismo, con `PUSH_ACTIVO`. Al tocarlo, se abre la app con la campanita abierta en ese aviso.
- **Los avisos con fecha** (los 10 días, el resumen del viaje y los 3 días) los manda el servidor a su hora, con una tarea programada en Vercel (mira qué deja el plan). Nunca de noche: entre las 9:00 y las 21:00 de la hora del viajero. Cada aviso, una sola vez.
- **El permiso del móvil:** fuera las tarjetas que preguntan si queremos avisos (N1). La ventana del móvil sale una sola vez, justo después de [Compartir viaje] o de [Enviar a Elena], o al acabar el primer día del viaje (lo que pase antes). Si dice que no, todo sigue llegando a la campanita.
- **En iPhone,** los avisos de una web solo llegan si está en la pantalla de inicio: si no lo está, no pidas el permiso.
- **Sin permiso de avisos, el email** (Logros · Pantallas): déjalo preparado y apagado. Hace falta el servicio de correos, que necesita el dominio, que espera al nombre de la app.

## 5. Ajustes, Mis pases y Borrar la cuenta (Logros · Pantallas · 04)
- **El botón de Ajustes del Perfil** abre P3:
  - **Mi cuenta:** su email, cómo entra («Entras con tu email» o con Google) y [Cerrar sesión];
  - **Mis pases:** «2 pases · Roma (Dúo) y Lisboa», con los suyos de verdad;
  - **La app:** «Sonido de los momentos», «Avisos en el móvil» (encender y apagar de verdad), «Ver otra vez el tutorial» y «Privacidad y condiciones»;
  - **Borrar mi cuenta.**
- **P4, Mis pases:** cada pase con su tipo, su destino, «En curso» / «Próximo», la fecha de compra, el precio, el viaje, con quién lo comparte («✓ Dentro»), el código y el enlace para invitar, y [Ver recibo].
- **P5:** «¿Borrar tu cuenta?» con [Borrar mi cuenta] y [Cancelar]. Lo que borra, lo que ya hiciste en la parte 2 (los viajes compartidos y las plazas de los pases pasan a los demás). Borra también sus avisos, sus permisos de avisos del móvil y su foto de perfil.
- **Quita del Perfil** los botones provisionales de cerrar sesión y borrar.

## 6. La foto y el nombre del perfil
- **La foto:** al tocarla en el Perfil, hacer una foto o elegirla de la galería. Pequeña (unos pocos KB), sin datos escondidos, en la nube, y se borra con la cuenta. Si entra con Google, su foto de Google hasta que ponga otra. Sin foto, la inicial, como ahora.
- **El nombre:** el de Google; si entra con el email, «Viajero» hasta que ponga uno. Se cambia en el mismo sitio que la foto.
- **Dónde sale:** el Perfil, «Hola, {nombre}», el pie de Compartir y lo que ven los demás del viaje (el «E» y el «L» de la campanita y de R2).
- Esto no tiene pantalla de Design: hazlo con las piezas que ya hay y dime cómo ha quedado.

## 7. Invitar a un amigo (la EXP de la 8C1)
Lo que faltaba para rellenar `logro_referidos`:
- **Cuenta como invitación** entrar por un enlace o un código de viaje o de pase, si con eso **se crea una cuenta nueva**. Una cuenta que ya existía no cuenta.
- **Además, un enlace personal para invitar a la app,** sin viaje. Su sitio en la app lo dibujará Design; de momento, una fila «Invitar a un amigo» en Ajustes, con [Compartir el enlace].
- Cada persona tiene un solo invitador: el primero.
- Lo demás ya está (100 EXP cuando el amigo acaba su primer viaje, máximo 10 al año).

## 8. Los dos arreglos de NOTAS_TRAS_8C3.md
- **Los sellos del pasaporte:**
  - un sello por cada ciudad de cada viaje, con su fecha: Roma y Florencia en el mismo viaje, 2 sellos; dos viajes a Roma, 2 sellos de Roma; Roma entrando al Vaticano, 2;
  - el Perfil cuenta lo distinto, como la cabecera del pasaporte: «N países · N ciudades». Volver a Roma suma sello, no ciudad;
  - el Perfil y el pasaporte leen la misma cuenta del servidor;
  - el sello de ciudad de los logros (bronce → diamante) no cambia: uno por ciudad;
  - que el viajero de ejemplo del modo de pruebas cuadre con esto en todas las pantallas (también sus logros de viajero con su pasaporte).
- **El botón flotante de logros en HOY v2** tapa un poco [No me da tiempo] (captura 1a-hoy de la 8C3). Que no tape ningún botón de la tarjeta.

## 9. La prueba de verdad con Supabase
- **Primero, sin Supabase:** todo con PGlite, el pago de mentira y el modo de pruebas, como siempre.
- **Después, un script** (`scripts/cuentas/comprobarSupabase.mjs`, o el nombre que quieras) que lo compruebe contra el Supabase de verdad con una cuenta de prueba:
  - qué migraciones están aplicadas y cuáles faltan;
  - con todo apagado, la app de hoy funciona igual que antes de las migraciones;
  - entrar, guardar un viaje, subir una foto, invitar y entrar como invitado, recomendar y aceptar, un aviso en la campanita, un pago de prueba de Stripe y borrar la cuenta sin que quede nada (también los archivos);
  - al acabar, borra todo lo que haya creado.
- Lee las claves solo de `.env.local` (Eric las pone allí). Nunca las enseñes, ni en la consola, ni en el informe, ni en ningún archivo.
- **Si al acabar la tanda las migraciones no están aplicadas o faltan las claves, no lo lances:** no es un fallo de la prueba. Deja en el informe, paso a paso, lo que tiene que hacer Eric:
  - qué migraciones aplicar, en qué orden (todas las pendientes, también la 0017 si falta, y la tuya nueva), cada una en una sola ejecución del SQL Editor;
  - qué claves poner en `.env.local` y en Vercel, por su nombre, sin valores;
  - qué hacer en Stripe (cuenta en modo de pruebas, el aviso al servidor y su dirección);
  - y que te diga «ya está» para lanzarlo.

## 10. Las reglas de siempre
- Ningún nombre de empresa en los textos de la app (salvo en Privacidad). Tampoco «Stripe» en la hoja de compra.
- Ningún número inventado. Los precios, los del punto 2.
- Fuera los textos que explican lo que ya se ve.
- Zonas de toque de 44 px como mínimo.
- «Reducir movimiento» respetado.
- La app avisa, nunca prohíbe.

## 11. La prueba
- No toca el motor: la batería rápida.
- `pruebaCuentas1` y una nueva `pruebaCuentas3` con:
  - entrar con email y con Google (casos A y B), sin «seguir sin cuenta»;
  - la prueba de HOY, una por cuenta;
  - el cobro: pago bueno, rechazado, aviso repetido (un solo pase), devuelto (pase anulado, lo ganado sigue), sin claves (todo abierto), el precio del servidor y no del móvil;
  - las plazas del Dúo y del Grupo;
  - compartir el viaje, entrar como invitado, recomendar de las tres maneras, la pareja, aceptar con la ruta cambiada, R2d y la varita después;
  - la campanita: leídos y sin leer, cada tipo de aviso, uno solo por aviso con fecha, nunca de noche;
  - el permiso del móvil, una sola vez;
  - Ajustes, Mis pases y borrar la cuenta (también los avisos y la foto; los registros de cobro se quedan);
  - las invitaciones a la app (cuenta nueva sí, cuenta vieja no, un solo invitador);
  - los sellos por ciudad y viaje, y el Perfil igual que el pasaporte;
  - el botón flotante sin tapar [No me da tiempo].
- **Capturas** en `docs/dias/capturas_cuentas3/`, a tamaño de móvil, con el nombre de su pantalla en el diseño: A1–A3, A4, I1, I2, P1, P6, P7, P7b, P8, P8b, P9, RS1, RS2, R1, RW1–RW3, RM, RV, RSent, R2a–R2d, AV1–AV7. Las de Logros · Pantallas, con «L-» delante (L-P3, L-P4, L-P5, L-P6). Y las que cambien: el Perfil con foto y nombre, el pasaporte y 1a-hoy.
- Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.
- Mide el peso al abrir antes y después.

## 12. El informe (docs/dias/INFORME_CUENTAS_3.md)
En español sencillo:
- qué has hecho y dónde está;
- lo que no ha podido quedar igual que en el diseño, y por qué;
- los textos que has tenido que poner tú;
- lo que tiene que hacer Eric fuera del código, paso a paso (punto 9);
- las migraciones nuevas y el orden de todas las pendientes;
- las dudas para el gestor (la línea legal de la compra, los registros de cobro, las condiciones);
- el peso antes y después;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
