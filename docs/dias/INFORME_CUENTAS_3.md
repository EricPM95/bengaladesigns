# Las cuentas, parte 3: las pantallas de verdad y el cobro del Pase

Todo está detrás de los interruptores de siempre (`VITE_CUENTAS_ACTIVAS`, `PASES_COBRO_ACTIVO`, `PUSH_ACTIVO`). Con todo apagado, la app es la de hoy. No he tocado el motor de rutas.

**Ojo:** no he probado nada contra Supabase, Stripe ni un móvil de verdad. Las migraciones las probé con una base de datos de prueba (PGlite) y el servidor con un cliente de mentira. Lo que sigue sin comprobar está en «Lo que tienes que hacer tú».

## 1. Qué se hizo y dónde

Siete commits, ninguno subido hasta el final (ver el último apartado):

| Parte | Qué es | Dónde está |
|---|---|---|
| 1 | Entrar en la cuenta (A1–A4), la invitación (I1, I2), nombre y logo de la marca, Privacidad y condiciones | `src/components/cuenta/`, `data/marca.json`, `src/lib/marca.ts`, `src/lib/privacidad.ts` |
| 2 | El Pase de Roma y el cobro (P1, P6, P7, P7b, P8, P8b, P9) | `server/pagos.js`, `src/components/pase/`, `data/pase/` |
| 3 | Compartir el viaje y recomendar cambios (RS, R1, RW, RM, RV, RSent, R2a–d), etiqueta «1 recomendación» | `src/components/propuesta/`, `src/lib/propuesta.ts` |
| 4 | La campanita de Avisos (AV1–AV8) y los avisos al móvil | `server/avisos.js`, `shared/avisos/textos.js`, `public/sw.js`, `vercel.json` |
| 5 | Ajustes, Mis pases, Borrar la cuenta (L-P3, L-P4, L-P5, L-P6) | `src/components/ajustes/` |
| 6 | Foto y nombre del perfil | `src/lib/miPerfil.ts`, `Avatar.tsx`, `EditarPerfil.tsx` |
| 7 | Invitar a un amigo (referidos) | `src/lib/invitaciones.ts`, `server/cuentas.js` |
| 8 | Arreglos de las notas tras la 8C3: el Perfil dice «N países · N ciudades» (la misma cuenta que la cabecera del pasaporte; volver a Roma suma sello, no ciudad; dos viajes a Roma = dos sellos de Roma con su fecha) y el botón de logros en HOY se aparta solo de [No me da tiempo] | `server/logros/pantallas/perfil.js`, `BotonFlotanteLogros.tsx` |
| 9 | Script para comprobar todo contra el Supabase de verdad | `scripts/cuentas/comprobarSupabase.mjs` |

Las pantallas provisionales de las partes 1 y 2 (entrar, invitar, cuenta en el Perfil, botones de cerrar sesión y borrar) ya no existen: las sustituyen las de verdad.

**Cómo funciona el cobro, en corto:** el precio lo pone siempre el servidor (`data/pase/precios.json`); del móvil solo llegan qué pase y cuántas personas. El pase lo crea solo el servidor cuando Stripe avisa (con la firma comprobada). Si el aviso llega dos veces, sale un solo pase. Una devolución anula el pase y lo ya ganado no se pierde. Paga quien compra. Los registros de cobro no llevan datos de persona y no se borran al borrar la cuenta. Stripe se pide por internet sin instalar ningún paquete, así que no pesa al abrir la app.

## 2. Lo que no pudo quedar como el diseño, y por qué

- **Dos pantallas de diseño no coinciden (P6 y P7b).** Mandó «App · Pase y cuenta» (P7b), como decidiste. La P6 de «Logros · Pantallas» trae una imagen grande arriba y un texto extra («Viajaréis con la misma ruta…»); no lo puse. L-P6 se capturó con datos distintos de P7b para que no fueran la misma imagen.
- **P1** (el aviso del Pase) va como tarjeta debajo del vuelo en RESERVAS; en el diseño no se veía dónde exactamente.
- **La hoja «listo» del Pase individual** no está en el diseño: tras pagar un Pase de 1 persona usé la misma hoja de espera/éxito (P8/P8b).
- **El invitado**: EXPLORAR y RESERVAS siguen enseñando herramientas de edición que luego no se guardan (en RUTA y DÍAS sí se esconden). Lo dejé así por no tocar el motor ni esas pantallas.
- **R2** (hoja del administrador) enseña el día entero con las paradas que no cambian en gris, no solo lo que cambia.
- **«Enviar a Viajero»** sale cuando la persona no tiene nombre (el diseño ponía un nombre).
- **La campanita ya estaba en HOY** (es el mismo Header que RUTA y DÍAS): no hizo falta tocar nada.
- **El máximo del Pase Grupo ya existía** como dato (`personas_hasta: 50` en `data/pase/precios.json`).
- **El día en la hoja R2** sale con fecha («el sábado 17») si el viaje tiene fechas, y «el día 3» si no. La campanita dice siempre «día 3» (el servidor no conoce las fechas).
- El aviso con fecha entre las 9:00 y las 21:00 va con **una sola ejecución al día** (`0 9 * * *`) porque Vercel Hobby no deja más; en un plan de pago se puede subir a cada hora.

## 3. Textos que he puesto yo (no estaban en el diseño)

Revísalos con calma; están en `shared/avisos/textos.js`, `data/pase/textos.json`, `src/lib/propuesta.ts`, `src/lib/privacidad.ts` y los componentes de cada pantalla.

- Espera del pago: «Un momento, estamos confirmando el pago.»; rechazado: «No te hemos cobrado nada. Puedes volver a intentarlo.»
- Mis pases: «Todavía no tienes ningún pase.», «Primero guarda un viaje para poder invitar.», «Enlace copiado», «No se ha podido compartir.»
- Hoja de recomendación: «Ese día ya no está en tu viaje. ¿En qué día lo pones?»
- Avisos de la campanita (recomendación, respuesta, unión, fecha, logros): todos los de `shared/avisos/textos.js`.
- Privacidad: los apartados nuevos de condiciones, el de cobros y el del servicio de avisos al móvil.
- **La línea legal de la compra** está como «Texto pendiente» en `data/pase/textos.json`: hay que ponerla antes de encender el cobro.

Ningún texto nombra una empresa salvo Privacidad, y la hoja de compra no dice «Stripe».

## 4. Lo que tienes que hacer tú (paso a paso)

### a) Migraciones en Supabase (SQL Editor, en este orden)

`0020` → `0021` → `0022` → `0023` → `0024` → `0025` → `0026`. Si `0017` o `0018` no estuvieran aplicadas, van antes. Cada una es un archivo de `supabase/migrations/`; pégalo entero y pulsa Run. La `0026` va en una sola transacción: si falla, no deja nada a medias.
Estado conocido: `0023` y `0025` estaban sin aplicar y `0026` es nueva. No he podido comprobar cuáles tienes aplicadas.

### b) Claves, por nombre (en `.env.local` para probar; en Vercel → Settings → Environment Variables para producción)

| Nombre | Para qué |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ya están |
| `SUPABASE_SERVICE_ROLE_KEY` | **falta en `.env.local`**; el servidor la necesita para cobros, avisos y borrar cuentas. Solo en el servidor, nunca con `VITE_` |
| `VITE_CUENTAS_ACTIVAS=true` | enciende las cuentas en la app |
| `LOGROS_ACTIVOS=true` | enciende los logros (ya lo conoces) |
| `PASES_COBRO_ACTIVO=true` | enciende el cobro del Pase |
| `STRIPE_SECRET_KEY` | la clave secreta de Stripe **en modo pruebas** (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | el secreto del webhook (`whsec_…`) |
| `APP_URL` | la dirección pública de la app (para volver del pago) |
| `PUSH_ACTIVO=true` | enciende los avisos al móvil |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACTO` | ya están en `.env.local`; ponlas también en Vercel |
| `CRON_SECRET` | una frase larga inventada por ti; Vercel la usa para llamar a la tarea de avisos |
| `AVISOS_EMAIL_ACTIVO`, `CORREO_API_KEY` | el correo está preparado pero **apagado**; no hace falta ahora |
| `PAGO_DE_MENTIRA=true` | solo en tu ordenador, para probar sin Stripe. Nunca en producción: el servidor lo ignora si detecta Vercel |

### c) Stripe (modo pruebas)

1. En Stripe, con el interruptor de «Modo de prueba» activado, copia la clave secreta a `STRIPE_SECRET_KEY`.
2. Developers → Webhooks → «Add endpoint». Dirección: `https://TU-APP/api/pago/webhook`. Evento: `checkout.session.completed` y `charge.refunded`.
3. Copia el «Signing secret» a `STRIPE_WEBHOOK_SECRET`.
4. Prueba un pago con la tarjeta `4242 4242 4242 4242` (cualquier fecha futura y CVC). Luego, en el webhook, «Enviar evento de prueba» dos veces con el mismo pago: debe quedar **un solo pase**.
5. Prueba una devolución desde Stripe: el pase debe anularse.

### d) Lanzar la comprobación contra Supabase real

Con las migraciones aplicadas, `SUPABASE_SERVICE_ROLE_KEY` puesta y la API arrancada:

```bash
node scripts/cuentas/comprobarSupabase.mjs
```

Comprueba las migraciones, entrar, guardar un viaje, subir una foto, invitar y entrar, recomendar y aceptar, el aviso, un pago de prueba y borrar la cuenta sin restos (también el archivo de la foto). Lo que crea lo borra al final. **Hoy no lo he lanzado**: faltan la clave de servicio y, casi seguro, migraciones. Al lanzarlo sin ellas, solo dice qué falta y para.
Cuando acabe con «Todo bien: ya está.», dímelo así: **«ya está»**.

### e) Cosas que solo se ven en un móvil de verdad

- Que el permiso de avisos sale **una sola vez** (al acabar el primer día del viaje, en el primer toque) y que el aviso llega con la app cerrada. En iPhone solo funciona con la app instalada en la pantalla de inicio.
- Que la foto de perfil se hace con la cámara del móvil.

## 5. Migraciones nuevas y orden

Nueva: `supabase/migrations/0026_cuentas_3.sql` (ver la invitación ampliada, pases y pagos con sus funciones solo-servidor, `gente_del_viaje` y foto del perfil, tabla `avisos` con sus disparadores y funciones, zona horaria, almacén `perfiles` con sus permisos, invitaciones a la app y referidos). Orden completo en el apartado 4a. **Sin aplicar.**

## 6. Dudas para el gestor

1. **La línea legal de la compra** (qué se promete, desistimiento, devoluciones): está como «Texto pendiente».
2. **Los registros de cobro** (`pagos_registro`) no llevan nombre ni correo y no se borran al borrar la cuenta. ¿Basta para Hacienda y para el derecho al olvido, o hace falta guardar algo más (o menos)?
3. **Las condiciones** nuevas dentro de «Privacidad y condiciones»: que las lea y las ajuste.
4. **El almacén `perfiles` es público** (cada persona solo escribe en su carpeta; cualquiera con el enlace ve la foto). ¿Está bien?
5. Que los avisos al móvil y el nombre de la empresa de servicio (Stripe, web-push) estén bien descritos en Privacidad.

## 7. Pruebas y capturas

- **pruebaCuentas3 (nueva): 390 comprobaciones, 0 fallos.** Incluye comprobar que están todas las capturas pedidas y que **ninguna es idéntica a otra** (falla si lo son).
- **pruebaCuentas1: 314 comprobaciones, 0 fallos.**
- **pruebaPantallas8c: 1.116 comprobaciones, 0 fallos** (antes de tocar el botón de HOY; el botón se comprobó con la captura 1a-hoy).
- **Batería rápida** (74 pruebas, sin el motor): todas bien salvo las de abajo.
- **Fallos que ya estaban (no son de esta tanda; archivos que no he tocado):**
  - `pruebaFase6z6f` 3a: etiquetas de momento en `logros/momentos/hoja/textosHoja.ts:40`.
  - `pruebaTanda6z3` 6: `HojaLogros.tsx` copia un trazo en vez de usar `iconos.ts`.
  - `pruebaTanda6o`: `window.open` sin sellar en `HojaLogros.tsx` y `ColeccionPorDentro.tsx`.
  - Los he dejado tal cual: son de los logros (8C), no de las cuentas.
- Los fallos que sí eran míos (texto «no cierres la app» en la espera del pago, `€` escrito a mano en `pagoPase.ts`, «el día ${…}» a mano en la hoja R2, un menú sin portal) los arreglé y ya pasan.
- La consola sale **sin errores** en todas las capturas.
- **Capturas** (`docs/dias/capturas_cuentas3/`, 41): A1, A2, A3, A4, I1, I2, P1, P6, P7, P7b, P8, P8b, P9, RS1, RS2, R1, RW1–RW3, RM, RV, RSent, R2a–R2d, AV1–AV8, L-P3, L-P4, L-P5, L-P6, Perfil-foto-nombre, Pasaporte (muestra 2 sellos de Roma con su fecha y «7 países · 5 ciudades»), 1a-hoy (el botón de logros sube justo por encima de [No me da tiempo]). AV1 se saca en DÍAS (la campanita es la misma en RUTA, HOY y DÍAS) para no ser idéntica a RS1.
- **Peso al abrir la app** (lo que baja antes de ver nada: 4 archivos, medido con `vite build` antes y después de la parte 3): **1.204 KB → 1.294 KB (+90 KB), y comprimido 317 KB → 344 KB (+27 KB, +9 %).** Es el código de entrar, el Pase, la campanita y Ajustes, que está siempre montado. Stripe no suma nada (no hay paquete).

## 8. Riesgos

- **Sin probar con Supabase, Stripe ni móvil reales** (ver apartado 4).
- **+27 KB comprimidos al abrir.** Se puede bajar cargando Ajustes, Mis pases y las hojas del Pase solo al abrirlas; lo dejé así para no arriesgar el gesto del permiso de avisos y los portales.
- **El cobro** solo es seguro si `STRIPE_WEBHOOK_SECRET` está puesto: sin él, el servidor rechaza todo aviso de Stripe.
- **Avisos con fecha:** con un solo cron al día, un aviso puede llegar con hasta 24 h de margen dentro de la ventana de 9:00 a 21:00.
- **Referidos:** solo cuentan si la persona crea una cuenta nueva (alta de menos de 24 h) y solo para el primer invitador; si alguien ya tenía cuenta, no suma.
- **Subida a producción:** al empujar a `main` Vercel despliega, pero con los interruptores apagados la app es la de hoy.
