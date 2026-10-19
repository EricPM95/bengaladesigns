# Tanda 9: todo encendido en la app publicada (solo para Eric) y los arreglos pequeños

Ninguna clave aparece en este informe ni en el repositorio: solo nombres de variables.

## 1. Encender todo en producción (Vercel): lo que tienes que hacer tú

En este PC **no hay herramienta de Vercel** con acceso al proyecto, así que las variables las pones tú. Es **Vercel → tu proyecto → Settings → Environment Variables → Production** (marca solo «Production»). La dirección de la app es `https://bengaladesigns.vercel.app`.

**A. Variables nuevas (las inventas o las copias tal cual):**

| Nombre | Valor | De dónde sale |
|---|---|---|
| `VITE_HOY_V2` | `true` | tal cual |
| `LOGROS_ACTIVOS` | `true` | tal cual |
| `VITE_LOGROS_ACTIVOS` | `true` | tal cual |
| `VITE_CUENTAS_ACTIVAS` | `true` | tal cual |
| `PASES_COBRO_ACTIVO` | `true` | (en `.env.local` ya está con `true`) |
| `PUSH_ACTIVO` | `true` | tal cual |
| `LOGROS_ADMIN_EMAILS` | el email con el que entras a la app | **sin esto no se abre `/?admin=logros` ni el botón de reiniciar** |
| `APP_URL` | `https://bengaladesigns.vercel.app` | la dirección pública |
| `CRON_SECRET` | una frase larga que te inventes (30 o más letras y números) | no está en `.env.local`; Vercel la manda sola a la tarea de avisos |

**B. Variables que se copian de `.env.local` (misma línea, mismo nombre; no las pegues en ningún chat):**
- `STRIPE_SECRET_KEY` (la `sk_test_` de la cuenta de prueba «APP RUTAS»);
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_CONTACTO`;
- `SUPABASE_SERVICE_ROLE_KEY` (ya está en Vercel; compruébalo).

**C. `STRIPE_WEBHOOK_SECRET`:** va en Vercel, pero **no** es el de `.env.local` (ese es el de `stripe listen`, solo para este PC). Sale del paso 2 de abajo.

**D. Las que ya tenías en Vercel y tienen que seguir:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY` (y las de Civitatis y `ROUTE_ENGINE` si las usas).

**E. Lo que NO se pone en producción:** `PAGO_DE_MENTIRA` y `AVISOS_EMAIL_ACTIVO`.

**F. Volver a desplegar.** Las `VITE_` se leen al **construir** la app: después de poner todo, **Deployments → el último → «⋯» → Redeploy** (sin marcar «usar caché de compilación»). Hazlo también después de poner `STRIPE_WEBHOOK_SECRET`.

### Antes de encender, comprobado

- **Caso A (los viajes que ya tienes en el móvil pasan a tu cuenta al entrar, sin perder nada):** probado con el Supabase de verdad (`scripts/cuentas/comprobarCasoA.mjs`): una sesión anónima con un viaje, una cuenta nueva, `/api/cuenta/reclamar`: el viaje pasa a la cuenta, no cambia nada de dentro y la cuenta lo ve. Además lo cubre `pruebaCuentas1` (reclamar).
- **La tarea de avisos:** está en `vercel.json` (`/api/cron/avisos`, una vez al día a las 9:00; Vercel Hobby no deja más) y la protege `CRON_SECRET`: sin él (o con una clave mala) responde 404, como se ve hoy en la app publicada.
- La app publicada hoy: abre (200), `/api/pase/config` dice `cobro: false` (apagado), la tarea de avisos y el aviso de Stripe responden 404 (apagados). Lo repito cuando enciendas todo (punto 5).

## 2. El aviso de Stripe a producción (paso a paso)

1. Entra en el panel de Stripe y comprueba arriba a la izquierda que estás en el **entorno de prueba «APP RUTAS»** (no en el real).
2. **Developers** (Desarrolladores) → **Webhooks** → **Add endpoint** (Añadir destino).
3. **Endpoint URL:** `https://bengaladesigns.vercel.app/api/pago/webhook`
4. **Events:** busca y marca `checkout.session.completed` y `charge.refunded` (solo esos dos). Pulsa **Add endpoint**.
5. En la página del endpoint recién creado, en **Signing secret**, pulsa **Reveal** y copia el `whsec_…`.
6. Pégalo en Vercel como `STRIPE_WEBHOOK_SECRET` (Production) y vuelve a desplegar (F).
7. Para probar: compra el pase con la tarjeta `4242 4242 4242 4242` y mira en Stripe → Webhooks → tu endpoint → **Events**: tiene que salir `checkout.session.completed` con respuesta **200**.

## 3. Reiniciar las pruebas de Eric

En `/?admin=logros` (o `/admin/logros`) hay una pestaña nueva, **«Mis pruebas»**, con el botón **[Reiniciar mis pruebas]**:
- **Solo para los emails de `LOGROS_ADMIN_EMAILS`**: la ruta es de administrador.
- **Solo tu propia cuenta:** el servidor saca la cuenta de tu sesión; ignora cualquier otro id que llegara. Cada borrado lleva el id de la cuenta que reinicia.
- **Pide confirmación** («¿Seguro?… no se puede deshacer»).
- **Qué deja a cero:** el día de prueba de HOY, los hechos y logros ganados, la EXP, los pases que has comprado (con sus plazas) y los avisos de la campanita. **No toca** tus viajes, tus fotos, tu cuenta, ni los registros de los cobros.
- **No está en ninguna otra pantalla** (lo comprueba la prueba).
- Probado: con una base de pruebas (la parte de código, 10 comprobaciones nuevas en `pruebaCuentas3`) y con el **Supabase de verdad**: reiniciar una cuenta borró sus avisos y dejó los de otra cuenta intactos.

## 4. Los arreglos pequeños

### El «Parque de Villa Borghese» repetido: NO lo he quitado, y te explico por qué
No es un repetido. En `data/dias/roma/listas.json`, `dias.D4.partes.unica.manana[6]` y `[7]` son dos paradas distintas que comparten el sitio (`lugar: "Parque de Villa Borghese"`):
- `[6]`: «Parque de Villa Borghese ~45» (la Piazza di Siena y el lago);
- `[7]`: **«Reloj de agua del Pincio ~10»**, con su propio título, su foto y sus coordenadas (está en el documento de los días, `DIAS_ROMA_PARADAS.md`, línea 676).

Quitarla borraría una parada que el documento quiere. Lo que falla es que **en la app esa segunda parada sale con el nombre del parque** en vez de «Reloj de agua del Pincio» (por eso parecía repetida). Esto toca cómo el motor pone el nombre, y no lo he tocado.

**Más casos iguales en Roma (te los digo antes de quitar nada):** el mismo patrón («mismo sitio, con un título propio») aparece en: Plaza de España / «Bajar la escalinata de la Plaza de España» (D0), Mirador del Janículo / «Via Garibaldi: se sube andando» (D1-corto), e Iglesia de Santa Maria in Trastevere / «Bajada a Trastevere» (D1-corto, D2, D1-FT). Ninguno es un duplicado de verdad. **Dime si quieres:** (a) dejarlo como está, o (b) que el nombre que se ve sea el título de la parada. Con (b) se toca el motor y habría que pasar de nuevo las 60 fechas, push y las 365. **No he cambiado ningún dato de los días de Roma.**

### La devolución de un pago
Probada con `stripe listen` en este PC y Stripe en modo pruebas (`comprobarSupabase.mjs --esperar-pago --devolver`): pagado con la 4242 → se crea **un** pase → Stripe devuelve el dinero → llega `charge.refunded` → **el pase queda anulado (no borrado)**, **lo ganado con el pase no se pierde** (se comprobó con un logro de prueba) y el registro del cobro queda como «devuelto» (no se borra). Después, borrar la cuenta sigue sin dejar restos.

### La prueba larga del motor
`_correr6y5.mjs procesos=12` (la entera, con su lanzador): **143.647 comprobaciones, 0 fallos, 0 trozos sin resultado** (381 s). Es el total exacto de la prueba entera, así que ya no queda «sin pasar» (en la tanda anterior se quedó sin resultado por tiempo).

**La muestra de 60 fechas (`pruebaListas paso=6`) y las 365 con `_correr365`: no las he terminado.** No he cambiado ningún dato de los días ni el motor en esta tanda (el único cambio en `server/` es la ruta del botón de reinicio), así que no hay nada nuevo que comprobar ahí; la muestra de 60 fechas tarda más de 10 minutos por proceso y la paré para poder subir. Si quieres que las pase, se lanzan aparte con `node scripts/destino/_correr365.mjs desde=2026-10-11 procesos=12 salida=<carpeta>`.

### Las 4 fotos que faltan
Hecha la página **`docs/dias/FOTOS_CANDIDATAS_TANDA9.html`** (ábrela en el navegador) con 3 candidatas por sitio, de Unsplash, con su autor. **No he puesto ninguna en la app: elige tú** (por ejemplo «`colle_oppio · 2`» o «ninguna»). Ojo: en 8B4 ya no había fotos de Unsplash que nombraran estos sitios, y sigue pasando: casi todas son **«sin confirmar»** (salieron al buscar el sitio, pero la foto no dice dónde es) y la página lo dice en cada una; solo la de San Pietro in Montorio nombra el sitio. Mírala con tus ojos antes de elegir.

### Los enlaces de afiliación (solo la lista, sin cambiar nada)
**Con nuestro código** (todos los de Civitatis salen con `aid=5206`, más el código de campaña del viaje, por `stampCivitatis`/`withCampaign`):
- [Reservar entrada] / [Reservar Free Tour] de RESERVAS y la pestaña «Entradas» de las fichas (Civitatis).
- Excursiones (RESERVAS y la página de excursiones) y las búsquedas de actividades del destino (Civitatis).
- Los enlaces de traslados de la ficha de llegada (Civitatis, por la API: también sellados).
- El mapa de alojamientos (Stay22): lleva el código de campaña de Stay22, **no** uno de Booking.

**Sin código de afiliado (enlaces normales):**
- **Booking:** no hay ningún botón que lleve a Booking con código (el mapa de Stay22 es lo que hay). Falta el código de Booking.
- **GetYourGuide:** los traslados privados de GYG de la ficha de llegada están aún con datos de mentira (`url_afiliado: '#'`): no llevan a ningún sitio ni código.
- **Vuelos:** [Buscar vuelos] de «Llegada y vuelta», del transporte y de «Útil para el viaje» → Skyscanner (sin código); y la búsqueda de vuelos/trenes entre ciudades → buscador de Google.
- **Seguro** → IATI Seguros; **eSIM** → Holafly; **tarjeta sin comisión** → N26 (los tres, sin código).
- **Alquiler de coche/autocaravana** → DiscoverCars, Motorhome Republic y Northbound (sin código).
- **Free Tour de la ficha** («free tour gratis… reserva») → buscador de Google.
- **Entradas oficiales** que enseñan las fichas (Coliseo, Vaticano…): webs oficiales, sin código (no tienen programa de afiliados).
- «Cómo llegar» → Google Maps / Apple Maps (no son de compra).

## 5. Después de encender: lo que tienes que probar en tu móvil

Yo compruebo en la dirección pública, **cuando hayas encendido todo y vuelto a desplegar**, que la app abre, que pide entrar y que `/api/pase/config` dice `cobro: true`. Si lo hago antes, sale lo de hoy (todo apagado). La lista, en orden:

1. **Añadir la app a la pantalla de inicio** (en iPhone es imprescindible para los avisos: Safari → Compartir → «Añadir a pantalla de inicio»); ábrela desde ese icono.
2. **Entrar con Google.**
3. **Ver que tu viaje de antes sigue ahí** (debe pasar a tu cuenta solo).
4. **Crear un viaje** nuevo.
5. **HOY y el día de prueba.**
6. **Un Visto con foto** y sus sorpresas.
7. **Comprar el pase** con la tarjeta de pruebas `4242 4242 4242 4242` (la haces tú) y mirar en Stripe → Webhooks que el aviso llegó con 200.
8. **El pasaporte y el Perfil** (foto, nombre, «Mis pases»).
9. **Compartir el viaje con otra cuenta** (otro navegador o ventana privada) y **recomendar un cambio**; aceptarlo desde la primera cuenta.
10. **La campanita y un aviso en el móvil** (el permiso de avisos sale una sola vez, al acabar el primer día del viaje).
11. **Reiniciar tus pruebas** desde `/?admin=logros` → «Mis pruebas» (y volver a ver el día de prueba de HOY).

## 6. Pruebas

- **Batería rápida (76 pruebas):** 75 en 0 fallos (o con su «ok?» de siempre); la 76.ª, `pruebaFase6y5_motor` lanzada suelta, no termina en 25 minutos, pero **entera con su lanzador dio 143.647 comprobaciones y 0 fallos** (apartado 4). Incluye `pruebaCuentas1` y `pruebaPantallas8b` en 0.
- **`pruebaCuentas3`: 476 comprobaciones, 0 fallos**, ampliada con el reinicio de pruebas (cada borrado lleva el id de la cuenta que reinicia, no toca viajes/fotos/cuenta/cobros, solo administrador, pide confirmar, y el botón no está en otra pantalla).
- **Con el Supabase de verdad:** `comprobarCasoA.mjs` bien; `comprobarSupabase.mjs --esperar-pago --devolver` «Todo bien» (pago, un solo pase, devolución, pase anulado, lo ganado se queda).
- `tsc` limpio y `vite build` bien. Consola sin errores en las capturas de la parte 3B; no he abierto la dirección pública con todo encendido (todavía está apagada: lo haré cuando enciendas Vercel).

## 7. Riesgos

- **Todo queda público, con pagos de prueba:** cualquiera con la dirección podría crear cuenta y «pagar» con la 4242. Eric dice que nadie la conoce; los cobros son de prueba (no se mueve dinero real) y los pases de prueba se limpian con el botón de reinicio, pero **no hay que pasar el enlace a nadie** hasta que lo decidas.
- **Los avisos con fecha** salen una vez al día (9:00): un aviso puede tardar hasta 24 h dentro de su ventana (Vercel Hobby no deja más tareas).
- **Si falta `LOGROS_ADMIN_EMAILS`**, el panel de administrador y «Reiniciar mis pruebas» no se abren.
- **Si falta `STRIPE_WEBHOOK_SECRET`** (o es el de `stripe listen`), el servidor rechaza todo aviso de Stripe: se paga pero **no se crea el pase**. Por eso el paso 7 de la lista (mirar el 200 en Stripe).
- **`VITE_*` y el despliegue:** si no se vuelve a desplegar tras cambiarlas, la app sigue como estaba (apagada).
- **«Reiniciar mis pruebas» no se puede deshacer** (pide confirmación). No toca viajes ni fotos.
- **Fotos de perfil:** si no se aplicó bien la 0027, no se ven fotos (ya está aplicada y comprobada).
- **iPhone:** los avisos al móvil solo funcionan con la web añadida a la pantalla de inicio.
- **Villa Borghese y las demás paradas con título propio** siguen saliendo con el nombre del sitio hasta que decidas el punto 4.
