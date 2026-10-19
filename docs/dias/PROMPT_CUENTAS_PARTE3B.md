Hola. Tanda pequeña: LAS CUENTAS, PARTE 3B, LOS ARREGLOS TRAS LA PARTE 3 Y LA PRUEBA DE VERDAD. Claude ha revisado tu informe y tus 41 capturas: ha quedado muy bien (entrar, el Pase, Mis pases, la campanita, recomendar con las parejas, el pasaporte con dos sellos de Roma). Quedan estos arreglos. Todo detrás de los mismos interruptores. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_CUENTAS_3.md.
- Claude ha dejado este prompt en docs/dias. Inclúyelo en tu commit tal cual.

## 1. Las pruebas, en 0 de verdad
- Arregla los 3 fallos que quedaron en la batería rápida: `pruebaFase6z6f` (3a), `pruebaTanda6z3` (6) y `pruebaTanda6o` (`window.open` sin sellar en `HojaLogros.tsx` y `ColeccionPorDentro.tsx`). Aunque sean de la 8C, la regla es no subir nada con fallos.
- Si alguna vez una prueba que no es tuya falla, arréglala o para y dímelo, pero no hagas push.

## 2. El peso al abrir
- En la 8C2 la regla era: la descarga al abrir, menos de 340 KB comprimidos. Ahora son 344 KB.
- Carga Ajustes, Mis pases, las hojas del Pase y las de recomendar solo al abrirlas, y vuelve a bajar de 340 KB.
- Si eso rompe el permiso de avisos o los portales, dime por qué y qué propones.
- Si cambiaste el límite de la prueba, dímelo.

## 3. El invitado, sin herramientas que no guardan
- Ahora, en EXPLORAR y RESERVAS, el invitado ve botones de cambiar que luego no se guardan. Eso confunde.
- **EXPLORAR:** «Añadir a mi ruta» le lleva al modo recomendación, con el sitio ya puesto, como cualquier otra propuesta.
- **RESERVAS:** solo para mirar. Puede abrir las entradas y comprar, pero nada de cambiar el vuelo, el alojamiento ni las reservas del viaje de otro.
- Mira si queda algún otro botón de cambiar en otra pantalla y haz lo mismo.

## 4. R2, más corta
- En R2a, R2b y R2c salen todas las paradas del día en gris (en R2a, 17). Lo que cambia queda abajo del todo.
- Como en el diseño: lo que cambia, con la parada de antes y la de después en gris. Lo demás del día, recogido en una línea («12 paradas más, sin cambios») que se abre al tocarla.
- En R2a, «Parque de Villa Borghese» sale dos veces seguidas en el mismo día. Mira si viene de la ruta del ejemplo o de algo tuyo. Si viene del motor, no lo toques: dímelo.

## 5. Sin nombre
- Ahora sale «Enviar a Viajero» y, en la campanita, «Viajero te recomienda…».
- Si la persona entró con el email y no tiene nombre, pídeselo una sola vez cuando haga falta (al compartir un viaje, al unirse a uno o al unirse a un pase): «¿Cómo te llamas?». Con [Seguir] y con «Ahora no».
- Mientras no tenga nombre, «Enviar» solo, y en los avisos la inicial de su email.

## 6. Las fotos de perfil, privadas
- El almacén `perfiles` es público: cualquiera con el enlace ve la cara de la persona.
- Hazlo privado: la foto solo la ven la persona y la gente de sus viajes y pases, con enlaces que caducan. Si hace falta, en una migración nueva (0027) sin aplicar.

## 7. Los datos de ejemplo de la campanita
- En AV2, AV3 y AV5, las fechas no cuadran con el viaje del 17 al 20 de octubre: «Tu resumen del viaje está listo» el 6 de octubre, antes del viaje, y «Te quedan 3 días…» el 8 de septiembre. Que cuadren.
- En esas tres sale además el error «Cambios sin guardar. No se ha podido guardar tu viaje». Mira por qué falla el guardado en el modo de pruebas. Si es solo porque no hay Supabase en local, que no salga en las capturas.

## 8. Lo de desarrollo, fuera de la app de verdad
- Comprueba que en la app de producción no salen ni el botón «Pruebas» ni «Dev: ruta rápida (sin IA)» (se ven en A4, P1, 1a-hoy…). Si ya es así, dímelo en una línea.

## 9. Stripe, sin tocar producción
- En tu informe, el aviso de Stripe va a la dirección pública de la app. Para eso Eric tendría que encender `PASES_COBRO_ACTIVO` y `VITE_CUENTAS_ACTIVAS` en Vercel, y en producción eso pide cuenta y pago a todo el mundo. **No.**
- Que la prueba del cobro funcione en este PC, con la herramienta de Stripe para la consola (`stripe listen`, que reenvía los avisos a `localhost`). Eric entra una vez en su cuenta de Stripe desde el navegador, en modo de pruebas, cuando se lo pidas.
- Nada de claves ni interruptores nuevos en Vercel en esta tanda. Si más adelante hace falta probar en una dirección pública, que sea en una de «Preview», nunca en producción. Explícalo en el informe.

## 10. La prueba de verdad con Supabase
Eric va a poner `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`. Cuando esté:
1. Lanza `comprobarSupabase.mjs` solo para ver qué migraciones faltan, y dile la lista exacta (de la 0017 a la 0027), en orden.
2. Eric las aplica en el SQL Editor y te dice «ya está».
3. Lánzalo entero. Si algo falla, arréglalo y vuelve a lanzarlo.
4. Después, el pago de prueba con `stripe listen`.

Antes de que Eric aplique nada, confirma que con las migraciones puestas y todo apagado la app de producción sigue igual (en la 8B salía un 400 al leer los viajes sin la 0024: con ella aplicada, ¿se arregla?).

Si Eric no ha puesto la clave cuando acabes lo demás, no lo lances: deja los pasos en el informe y haz push con lo demás.

## 11. La prueba
- No toca el motor: la batería rápida, **toda en 0**.
- `pruebaCuentas3` ampliada con lo de arriba:
  - el peso;
  - el invitado en EXPLORAR y RESERVAS;
  - R2 recogida;
  - el nombre;
  - las fotos privadas;
  - las fechas de la campanita.
- Rehaz las capturas que cambien en `docs/dias/capturas_cuentas3/` (R2a, R2b, R2c, AV2, AV3, AV5 y las nuevas: el invitado en EXPLORAR y RESERVAS, y «¿Cómo te llamas?»).
- Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.

## 12. El informe (docs/dias/INFORME_CUENTAS_3B.md)
En español sencillo:
- qué has cambiado;
- el peso antes y después;
- lo del duplicado de Villa Borghese;
- por qué fallaba el guardado en el modo de pruebas;
- qué ha pasado con Supabase y con Stripe (o los pasos que faltan para Eric);
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
