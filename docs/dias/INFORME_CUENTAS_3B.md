# Las cuentas, parte 3B: los arreglos tras la parte 3

Todo sigue detrás de los mismos interruptores (`VITE_CUENTAS_ACTIVAS`, `PASES_COBRO_ACTIVO`, `PUSH_ACTIVO`). Con todo apagado, la app es la de hoy. No he tocado el motor de rutas.

## 1. Qué he cambiado (en el orden del encargo)

**1. Las pruebas, en 0.** Los tres fallos que quedaban eran de la 8C y los he arreglado en lugar de dejarlos:
- `pruebaFase6z6f` (3a): la franja «Antes del viaje · 29 oct – 1 nov» de la hoja de logros es a propósito (la pide el diseño); la regla vieja «ninguna etiqueta de momento» no la conocía. He puesto esa única excepción en la prueba, con su motivo.
- `pruebaTanda6z3` (6): `HojaLogros.tsx` llevaba copiado a mano el dibujo de «Ruta»; ahora usa `ICONOS.ruta` de `src/lib/iconos.ts`.
- `pruebaTanda6o`: los dos `window.open` sin sellar de `HojaLogros.tsx` y `ColeccionPorDentro.tsx` eran enlaces de «Cómo llegar» (mapas, sin código de afiliado). Ahora usan `abrirMapaEnOtraPestana` (en `src/lib/mapsLinks.ts`), un enlace que se pulsa, sin `window.open`.

**2. El peso al abrir.** Ajustes, Mis pases, editar el perfil, «¿Cómo te llamas?», las hojas del Pase (comprar, invitar, dos viajes) y las de recomendar (ver la propuesta, la hoja del administrador, «Se lo hemos mandado») se bajan solo al abrirlas.
- **Antes:** 803 KB de JavaScript, **343,7 KB** comprimidos. **Ahora:** 729,5 KB, **322,4 KB** comprimidos (−21 KB; bajo el límite de 340 KB).
- **No he cambiado el límite de la prueba** (sigue en 340 KB).
- El permiso de avisos y los portales siguen bien: el gesto del permiso (`pedirPermisoUnaVez`) vive en los botones, que no se cargan perezosos, y las hojas se pintan en su portal igual que antes (lo comprueban las capturas).

**3. El invitado, sin herramientas que no guardan.**
- **EXPLORAR:** «+ Añadir» (y el de excursiones y Free Tour) de quien mira el viaje de otra persona entra en el modo recomendación sobre una copia, con el sitio ya puesto y la pregunta del día. Como cualquier otra propuesta: nada se cambia de verdad hasta [Enviar].
- **RESERVAS:** pantalla nueva solo para mirar (`ReservasSoloVer.tsx`): la ida y la vuelta, el alojamiento y las entradas de la otra persona, sin un solo botón de añadir, cambiar o quitar. Lo único que se toca es [Reservar entrada], que abre la ficha del sitio para comprar la suya.
- **Otras pantallas:** he revisado el resto. La **cartera** (presupuesto) tenía cifras que se podían cambiar y no se guardan: ahora quien mira no la ve. HOY («visto», «No me da tiempo») es de cada persona (los vistos son por persona), no lo he tocado. RUTA y DÍAS ya se escondían desde la parte 3.

**4. R2, más corta.** En R2a, R2b y R2c ahora sale lo que cambia con la parada de antes y la de después en gris; el resto del día queda en una línea («16 paradas más, sin cambios») que se abre al tocarla. En R2a pasa de 17 paradas en gris a una sola en gris + la línea. Si recoger solo escondería una parada, se enseña tal cual.

**5. Sin nombre.** Con el email y sin nombre ya no sale «Viajero»:
- «Enviar» a secas, «Enviada · esperando respuesta», «Se lo hemos mandado» y, en la campanita, «Te recomiendan un cambio en el día 2», «Han aceptado tu cambio», «Han preferido dejar el día 2 como estaba», «Alguien se ha unido a tu viaje». El círculo lleva la **inicial de su email** (solo la letra; la migración 0027 la añade a `gente_del_viaje` y a los avisos).
- «¿Cómo te llamas?» con [Seguir] y «Ahora no» se pregunta **una sola vez** (se apunta por cuenta en el móvil, hagan lo que hagan): al compartir un viaje, al unirse a uno o al unirse a un pase. Quien se une justo al crear su cuenta lo ve al volver a abrir la app.

**6. Las fotos de perfil, privadas.** Migración **0027** (sin aplicar): el almacén `perfiles` pasa a ser privado y solo la ven la propia persona y la gente con la que comparte un viaje o un pase (función `comparte_con`). La app las pide con **enlaces que caducan a la hora** y los renueva a los 55 minutos (Perfil, campanita y la imagen de compartir).

**7. Los datos de ejemplo de la campanita.** Ahora cuadran con el viaje del 17 al 20 de octubre y se calculan a partir de sus fechas: el aviso de los 10 días es del 7 oct; la recomendación, la unión y las respuestas, de antes del viaje; el resumen y «Te quedan 3 días…» son del 21 oct (después). Los avisos del móvil de ejemplo llevan días de la semana que existen (lunes 12 y miércoles 7 de octubre).

**8. Lo de desarrollo.** Ya era así: en producción no salen ni «Pruebas» ni «Dev: ruta rápida». «Dev: ruta rápida» está dentro de `import.meta.env.DEV` (no está en el build: lo comprueba la prueba mirando `dist/`); «Pruebas» solo sale en localhost y en vistas previas de Vercel (`esEntornoDePrueba`) y la prueba lo comprueba con direcciones de producción, de vista previa y con `VITE_VERCEL_ENV=production`.

## 2. El duplicado de «Parque de Villa Borghese» (R2a)

**No viene de mi código ni de la hoja R2: viene del día escrito de Roma.** La ruta de ejemplo la genera el motor, y su día 2 (D4) trae dos paradas seguidas «Parque de Villa Borghese» (la 7.ª y la 8.ª). En `data/dias/roma/listas.json`, `dias.D4.partes.unica.manana` tiene las posiciones `[6]` y `[7]` con `lugar = "Parque de Villa Borghese"` (la primera, «~45: la Piazza di Siena y el lago…»). **No lo he tocado**, como pedías: queda para que lo mires tú. Con R2 recogida, el duplicado ya no se ve en la hoja (queda escondido en «16 paradas más»), pero sigue en la ruta.

## 3. Por qué fallaba el guardado en el modo de pruebas

El error «Cambios sin guardar» de las capturas AV2, AV3 y AV5 **no era por no tener Supabase en local**: el Supabase de verdad (el de `.env.local`) **no tiene aplicada la migración 0024**, y con las cuentas encendidas la app lee `trips.guardado_en`, una columna que aún no existe (`column trips.guardado_en does not exist`). La carga de los viajes falla y sale el aviso.
- Arreglo: en el modo de pruebas (`?logrosDemo=1`, **solo desarrollo**) ya no se intenta cargar ni guardar en la nube. Las capturas salen sin el error.
- **Producción:** con todo apagado la app no pide `guardado_en` (pide las mismas columnas de hoy), así que no pasa. Con las cuentas encendidas **hace falta la 0024**: con ella aplicada el 400 desaparece (lo he comprobado en una base de pruebas con todas las migraciones, de la 0001 a la 0027).

## 4. Supabase y Stripe: qué ha pasado y qué falta

**Supabase:** `SUPABASE_SERVICE_ROLE_KEY` **todavía no está en `.env.local`**, así que no he lanzado `comprobarSupabase.mjs` (al lanzarlo sin la clave solo dice qué falta y para). Lo que sí he hecho: aplicar **todas las migraciones, de la 0001 a la 0027, en orden, sobre una base de pruebas** (PGlite): ninguna da error. He ampliado el script (ahora comprueba de la 0017 a la 0027, y la foto privada: no se ve con la dirección pública, sí con enlace firmado, sí quien comparte el viaje, no una tercera persona).

**Pasos para ti (cuando pongas la clave):**
1. Pon `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y dime «ya está».
2. Yo lanzo `node scripts/cuentas/comprobarSupabase.mjs` **solo para ver qué migraciones faltan** y te doy la lista exacta, en orden (de la 0017 a la 0027). Adelanto lo que ya he visto con la clave pública (solo si existen o no; no enseña datos): las tablas de la 0017 a la 0026 **existen**; **falta la columna `trips.guardado_en`**, que es de la **0024** (se aplicó una versión de la 0024 sin esa línea; se puede volver a aplicar entera: usa «if not exists» y «or replace»), y falta la **0027**. Del almacén `perfiles` no se puede ver nada con esa clave.
3. Las aplicas en el SQL Editor (cada una es un archivo de `supabase/migrations/`, pegado entero + Run) y me dices «ya está».
4. Lo lanzo entero. Si algo falla, lo arreglo y lo vuelvo a lanzar.

**Stripe, sin tocar producción (lo que pedías):** el aviso de Stripe ya **no** va a la dirección pública de la app. La prueba del cobro se hace **en este PC** con la herramienta de Stripe para la consola:
1. Instalar la herramienta de Stripe (`stripe`; hoy **no está instalada** en este PC) y entrar **una vez** en tu cuenta de Stripe desde el navegador, en **modo de pruebas** (`stripe login`). Te lo pido cuando llegue el momento.
2. En una consola: `stripe listen --forward-to localhost:8787/api/pago/webhook`. Da un `whsec_…`; ese va en `STRIPE_WEBHOOK_SECRET` de `.env.local`, junto a `STRIPE_SECRET_KEY` (`sk_test_…`) y `PASES_COBRO_ACTIVO=true` y `VITE_CUENTAS_ACTIVAS=true` **solo en `.env.local`**, y se reinicia la API.
3. `node scripts/cuentas/comprobarSupabase.mjs --esperar-pago` crea el pago de prueba, te da la dirección de pago (tarjeta `4242 4242 4242 4242`), espera el aviso que llega por `stripe listen` y comprueba que queda **un solo pase**.
- **Nada de claves ni interruptores nuevos en Vercel en esta tanda.** Encender `PASES_COBRO_ACTIVO` y `VITE_CUENTAS_ACTIVAS` en Vercel (producción) pediría cuenta y pago a todo el mundo: no. Si más adelante hace falta probar en una dirección pública, que sea en una de «Preview» de Vercel (con sus propias variables), **nunca en producción**.

## 5. Pruebas y capturas

- **pruebaCuentas3: 466 comprobaciones, 0 fallos** (incluye peso, invitado en EXPLORAR y RESERVAS, R2 recogida, el nombre, fotos privadas con reglas de seguridad reales, fechas de la campanita, lo de desarrollo, y que las 44 capturas están y ninguna es idéntica a otra: sigue fallando si dos lo son).
- **pruebaPantallas8c: 1.120 comprobaciones, 0 fallos. pruebaPantallas8b: 171, 0 fallos** (peso 322,4 KB).
- **Batería rápida (76 pruebas): todas en 0 fallos o con su salida «ok?» de siempre, salvo `pruebaFase6y5_motor`**, que es del motor, necesita sus propios argumentos y la maté a los 1.500 s sin resultado (no es un fallo, pero no queda comprobada). No toqué el motor (ningún archivo de `shared/routeEngine` ha cambiado).
- **Capturas rehechas** (`docs/dias/capturas_cuentas3/`): R2a, R2b, R2c, AV2, AV3, AV5, AV6, P8 y las nuevas Invitado-explorar, Invitado-reservas y Como-te-llamas. **Consola sin errores.**
- `tsc -p tsconfig.app.json` limpio.

## 6. Riesgos

- **Sin probar con Supabase, Stripe ni móvil de verdad** (falta la clave y la herramienta de Stripe; ver el apartado 4). Las reglas de las fotos privadas y de los avisos con inicial están probadas en una base de pruebas, no en el Supabase de verdad.
- **Fotos privadas:** la app solo pide las fotos con enlace firmado. Si se aplica la 0026 pero **no** la 0027, no hay permiso para firmarlas y se ve la inicial en lugar de la foto (no se rompe nada, pero no se ven fotos hasta aplicar la 0027). Con la 0027 aplicada, las fotos dejan de verse con la dirección pública de antes.
- **Primera foto tras entrar:** el enlace firmado se pide con una llamada a más; hasta que llega se ve la inicial (un instante).
- **«¿Cómo te llamas?»** se pregunta una vez por cuenta y móvil: si alguien limpia los datos del navegador, se vuelve a preguntar.
- **EXPLORAR del invitado:** la barra «Tu propuesta» queda por debajo de la pantalla de explorar (que va a pantalla completa); mientras exploras solo ves el aviso «Añadido al domingo 18 ✓». Al cerrar EXPLORAR sale la barra con «Enviar». Si lo quieres más claro, es un cambio de nivel de capas y de texto del aviso, aparte.
- **RESERVAS del invitado:** enseña lo que hay guardado en el viaje (llegada, alojamiento, entradas). Sin alojamiento dice «Sin alojamiento puesto».
- **Los textos nuevos** (los de «sin nombre» y «¿Cómo te llamas?») son míos, no del diseño: `shared/avisos/textos.js`, `src/lib/propuesta.ts`, `HojaComoTeLlamas.tsx`, `ReservasSoloVer.tsx`.
