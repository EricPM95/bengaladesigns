Hola. Nueva tanda: TANDA 9, TODO ENCENDIDO EN LA APP PUBLICADA (SOLO PARA ERIC) Y LOS ARREGLOS PEQUEÑOS. Las cuentas y el pago de prueba ya funcionan con el Supabase de verdad. Ahora Eric quiere ver la app entera en su móvil, en la dirección de siempre. Nadie más sabe que existe, así que se enciende todo en producción, con Stripe en modo de pruebas.

## 0. Antes de empezar
- Lee tus INFORME_CUENTAS_3.md e INFORME_CUENTAS_3B.md, y en docs/dias, NOTAS_TANDAS_MENORES.md.
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA9.md. Claude ha dejado NOTAS_TANDAS_MENORES.md en docs/dias. Incluye los dos en tu commit.
- Ninguna clave en el chat, ni en el informe, ni en ningún archivo del repositorio.

## 1. Encender todo en producción (Vercel)
**Lo que se enciende, en el entorno Production de Vercel:**
- `VITE_HOY_V2=true`;
- `LOGROS_ACTIVOS=true` y `VITE_LOGROS_ACTIVOS=true`;
- `VITE_CUENTAS_ACTIVAS=true`;
- `PASES_COBRO_ACTIVO=true`;
- `PUSH_ACTIVO=true`.

**Lo que tiene que estar en Vercel para que funcione:**
- `SUPABASE_SERVICE_ROLE_KEY` (ya está);
- `STRIPE_SECRET_KEY`: la misma `sk_test_` de `.env.local`, de la cuenta de prueba «APP RUTAS»;
- `STRIPE_WEBHOOK_SECRET`: el del aviso de Stripe a producción (punto 2), no el de `stripe listen`;
- `APP_URL`: la dirección pública de la app;
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_CONTACTO`;
- `CRON_SECRET`;
- y lo demás que pidan tus informes.

**Lo que no se pone en producción:** `PAGO_DE_MENTIRA` ni `AVISOS_EMAIL_ACTIVO`.

**Cómo:**
- Si en este PC tienes la herramienta de Vercel con acceso al proyecto, ponlas tú, leyendo los valores de `.env.local` sin enseñarlos.
- Si no, dale a Eric la lista paso a paso (Vercel → Settings → Environment Variables → Production), por nombre y sin valores, y dile de qué línea de `.env.local` sale cada una.
- Las `VITE_` se leen al construir la app: después hay que volver a desplegar. Hazlo tú o dile a Eric cómo.

**Antes de encender, comprueba:**
- que con las cuentas encendidas los viajes que Eric ya tiene en su móvil pasan a su cuenta al entrar (caso A), sin perder nada;
- que la tarea programada de los avisos está en `vercel.json` y que la protege `CRON_SECRET`.

## 2. El aviso de Stripe a producción
- Dile a Eric, paso a paso, cómo crear en el panel de Stripe (entorno de prueba «APP RUTAS» → Developers → Webhooks) el aviso a `https://<dirección de la app>/api/pago/webhook`, con los eventos `checkout.session.completed` y `charge.refunded`.
- Su secreto (`whsec_…`) lo copia Eric en Vercel, en `STRIPE_WEBHOOK_SECRET`.

## 3. Reiniciar las pruebas de Eric
Eric va a probar varias veces: su día de prueba de HOY se gasta una vez por cuenta.
- En `/?admin=logros`, solo para los emails de `LOGROS_ADMIN_EMAILS`, un botón para reiniciar **su propia cuenta de pruebas**: el día de prueba, los logros, la EXP, los pases de prueba y los avisos. Con una confirmación antes.
- Que no pueda tocar la cuenta de nadie más.
- Que no esté en ninguna otra pantalla.

## 4. Los arreglos pequeños (NOTAS_TANDAS_MENORES.md)
- **El «Parque de Villa Borghese» repetido** en `data/dias/roma/listas.json` (`dias.D4.partes.unica.manana[6]` y `[7]`): quita el repetido sin cambiar nada más del día.
  - Esos días los usa el motor: la muestra de 60 fechas, push y las 365 con `_correr6y5.mjs procesos=12`.
  - Mira si hay más paradas repetidas en algún otro día de Roma. Si las hay, dímelo antes de quitarlas.
- **La devolución de un pago:** pruébala con `stripe listen` en local. El pase se anula y lo ganado no se pierde.
- **La prueba larga del motor**, entera, con su lanzador.
- **Las 4 fotos que faltan** (Via del Babuino, Terraza Largo Gaetana Agnesi, Colle Oppio y Mirador de San Pietro in Montorio): busca 2 o 3 candidatas de cada una en Unsplash, como en la 8B4, y dámelas para que Eric elija. No pongas ninguna sin que elija.
- **Los enlaces de afiliación:** la lista de todos los botones de compra de la app, cuáles llevan su código y cuáles no. Solo la lista, sin cambiar nada.

## 5. Después de encender: lo que tiene que probar Eric en su móvil
Al acabar, comprueba tú en la dirección pública que la app abre, que pide entrar y que `/api/pase/config` dice que el cobro está encendido. Después deja en el informe una lista corta, en orden, de lo que tiene que probar Eric:
- añadir la app a la pantalla de inicio (en iPhone, para los avisos);
- entrar con Google;
- ver que su viaje de antes sigue ahí;
- crear un viaje;
- HOY y el día de prueba;
- un Visto con foto y sus sorpresas;
- comprar el pase con la tarjeta de pruebas de Stripe (la hace él, no tú);
- el pasaporte y el Perfil;
- compartir el viaje con otra cuenta (otro navegador) y recomendar un cambio;
- la campanita y un aviso en el móvil;
- reiniciar sus pruebas desde `/?admin=logros`.

## 6. La prueba
- La batería rápida, y la del motor por tocar los días escritos: las 60 fechas, push y las 365.
- `pruebaCuentas3` ampliada con el reinicio de pruebas (solo su propia cuenta, nunca otra).
- Comprueba que no hay errores en la consola en la dirección pública.

## 7. El informe (docs/dias/INFORME_TANDA9.md)
En español sencillo:
- qué has encendido y qué ha tenido que hacer Eric;
- las paradas repetidas;
- la devolución y la prueba larga del motor;
- las candidatas de fotos;
- la lista de los enlaces de afiliación;
- la lista de pruebas para Eric;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
