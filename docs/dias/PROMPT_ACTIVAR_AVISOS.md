Hola. ACTIVAR LOS AVISOS DE LA HOY3 CON ERIC, PASO A PASO (5-nov). Va ANTES del arreglo pequeño. Eric está delante. Este mensaje acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Cómo hacerlo:** guía a Eric UN paso cada vez, con palabras sencillas (dónde pinchar, qué pegar). Espera a que diga «hecho» antes del siguiente. Lo que puedas hacer tú desde el PC, hazlo tú.

**Las claves:**
- Nunca en el chat, en un archivo del proyecto ni en un commit.
- Si las generas tú, ponlas directamente donde van (Vercel por su CLI si está con sesión, o se las enseñas a Eric en tu terminal para que las copie) y bórralas de cualquier archivo temporal.
- Ninguna clave se repite en el informe.

## Los pasos (los de `docs/dias/HOY3_SQL_PARA_PEGAR.sql`)
1. **Las claves VAPID y CRON_SECRET:**
   - genera las VAPID (`npx web-push generate-vapid-keys`);
   - genera un CRON_SECRET largo al azar.
2. **Vercel** (proyecto de bengaladesigns.vercel.app, Production):
   - las variables son `PUSH_ACTIVO=true`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACTO` (mailto: con el correo de Eric) y `CRON_SECRET`;
   - si ya existe alguna, dímelo antes de cambiarla.
3. **Supabase › Database › Extensions:** Eric activa `pg_cron` y `pg_net`.
4. **Supabase › SQL Editor, el PASO 1** del archivo: la migración 0074.
5. **El PASO 2:** los dos secretos del Vault. Eric escribe allí mismo:
   - la URL `https://bengaladesigns.vercel.app/api/cron/avisos-viaje`;
   - el mismo CRON_SECRET de Vercel.
6. **El PASO 3:** la migración 0075, el planificador de cada minuto.
7. **El PASO 4:** la comprobación. Todo tiene que salir «listo».
8. **Redesplegar Vercel** para que coja las variables.
9. **En el iPhone de Eric:**
   - JUTRIP en la pantalla de inicio (Safari › Compartir › «Añadir a pantalla de inicio»);
   - abrirla desde ese icono y aceptar los avisos;
   - Ajustes › [Enviarme un aviso de prueba].
   - Si no llega en 1 minuto, busca por qué (los registros de Vercel y de `pg_net`) y arréglalo.

## Al acabar
- Apunta en el informe, sin claves:
  - qué se ha hecho;
  - las migraciones 0074 y 0075 como APLICADAS;
  - si llegó el aviso de prueba.
- Sin commit si no cambia código. Si arreglas algo:
  - con `pruebaJutrip` y `pruebaTandaHOY3` en 0;
  - git status limpio y nada privado;
  - push de main a origin, sin --force.
- Después sigue con el arreglo pequeño que te pasará Eric. Al final, reinicia el api-server.
