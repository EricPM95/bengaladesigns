Hola. TANDA 10S9: RETOQUES DE RESERVAS DEL REPASO DE ERIC (1-nov): LOS TRES BLOQUES IGUALES, LAS HORAS DE EJEMPLO EN GRIS, LA RUEDA QUE NO GUARDA, EL AVISO «HEMOS AJUSTADO TU RUTA» SIN PASE, UN SOLO LÁPIZ SIN DOCUMENTO Y TODAS LAS RUEDAS IGUALES. Va después de la 10R (ya hecha). No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S9.md e inclúyelo en tu commit. Acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Cómo trabajar (rápida):** los 4 agentes a la vez; un solo servidor; hasta 2 Chrome de prueba. Solo las pruebas de lo tocado y `pruebaJutrip`. Si un apartado se complica, déjalo a medias, dímelo y sigue. Dime al empezar cuánto calculas. Nota de estado (`docs/dias/_estado_10s9.md`) a la rama `estado` cada 30 minutos. No apagues el PC.

## 0b. Respuestas a tus dudas de la 10R
- **Sandbox:** mientras sea el sandbox, **mandan los datos de nuestra tabla**, también para el administrador: los de la API de pruebas nunca pisan los nuestros. Los números de las 6 excursiones que no están en el sandbox, cuando haya producción.
- **Ostia Antica** (web, 1-nov): nota **9,6/10**, **294** opiniones, **3 h**, **cancelación gratis hasta 3 días antes**, punto de encuentro **Piazzale Ostiense, salida del metro Piramide**. El precio, el que tiene, hasta que Eric lo mire en euros. «comprobado: 2026-11-01».
- **Nápoles y Pompeya en tren:** **No reembolsable** (web, 1-nov), con el mismo aviso que Florencia en tren.
- Lo demás, como lo has dejado (el orden del banner, las fotos, HOY sin pase, el punto de encuentro, Venecia desde 6 días). La lectura de un billete real la prueba Eric.

## 1. Los bloques de RESERVAS, todos como «Llegada y vuelta» (Eric, con capturas)
- Hoy «Llegada y vuelta» tiene la cabecera grande (icono grande, título grande, «Falta» debajo del título y la flecha a la derecha) y «Alojamiento» y «Entradas y Free Tour» otra más pequeña, con el estado en una pastilla a la derecha y sin flecha. **Los tres, como «Llegada y vuelta»:** el mismo icono, el título con la misma letra y el mismo tamaño, **el estado debajo del título** («Falta», «Listo», «0 de 9 reservadas») y **la flecha a la derecha**, para que se vea que se abre. Sustituye a lo de las pastillas de la 10S4.
- **Un bloque siempre se puede cerrar**, falte lo que falte (hoy «Llegada y vuelta» no se cierra si falta un vuelo). Al entrar, abierto si falta algo y cerrado si está «Listo», como hasta ahora.
- El de las excursiones: si es un bloque que se abre con tus excursiones reservadas, igual; si es solo la entrada a la lista, como está, y me dices cuál es.

## 2. La hoja del vuelo
- **Las pestañas, siempre «Ida» y «Vuelta»**, sin el día ni la hora (hoy, al poner la ida, pasa a «Ida · Miércoles 25 · 11:15»). Con su ✓ si ya está puesta.
- **Regla nueva, para toda la app: una hora que pone la app es un ejemplo, en gris, hasta que el viajero la elige.** Hoy salen en negro, como si ya estuvieran puestas, la hora de la vuelta («18:05») y la de llegada de la ida («11:15»). En gris, como el «08:30» de «Sale a las». Si la hora es obligatoria, [Guardar el vuelo] no se activa hasta que la elija (el ejemplo no cuenta). Repasa todas las casillas de hora de la app.
- **La rueda no guarda la hora si no se mueve (fallo):** si el vuelo es justo a la hora del ejemplo (08:30), al abrir la rueda y tocar el ✓ no se guarda; hay que mover la rueda y volver. **El ✓ guarda la hora que se ve en la rueda**, se haya movido o no. Tocar fuera, igual (10S6).

## 3. «Hemos ajustado tu ruta» sin pase (grave)
- Con una cuenta sin pase, al guardar el vuelo sube la hoja «Tus vuelos · Hemos ajustado tu ruta · El miércoles 25 es tu llegada a Roma. Hemos puesto el Free Tour el miércoles 25, nada más llegar…» con [De acuerdo].
- **La causa** (`src/lib/adaptarVuelos.ts`, `alCambiarElVuelo`): desde la 10S7b, la hoja del resumen (`HojaResumenVuelo`, con las frases de `construirResumen` y de `shared/routeEngine/llegadaDia1.js`) sale **siempre**, con y sin pase, como si fuera «lo que solo informa». Pero dice que hemos cambiado la ruta, y sin pase no se cambia nada: **es mentira**.
- **Lo que pido:**
  - **sin pase, esa hoja no sale nunca.** Lo que solo informa (el plan de la llegada y de la vuelta, «Hoy vuelves a casa») se actualiza callado en DÍAS, como dijimos;
  - **con pase**, tampoco antes de la pregunta (hoy salen a la vez «Hemos ajustado tu ruta» y «¿Adaptamos tu primer y tu último día…?»). Después de [Sí, adaptarlos], solo la franja de la 10S7b con lo que de verdad ha cambiado. Si se queda alguna frase útil del resumen, que sea verdad: nunca «Hemos puesto…» si no se ha movido;
  - repasa las frases de `llegadaDia1.js` y `construirResumen` que pueden salir y dime cuáles quedan y dónde.

## 4. Un solo lápiz mientras no hay documento (alojamiento, entradas y excursiones)
- Hoy el alojamiento tiene dos lápices: el de arriba (el nombre) y otro en la fila del precio que **abre «Datos de la reserva»** (dirección, entrada, salida, teléfono, localizador), que no tiene nada que ver con el precio.
- **Como en los vuelos:** **sin documento, un solo lápiz, arriba**, que abre la hoja de siempre («Tu alojamiento»: nombre, fechas, para quién, precio; con pase, la zona y la dirección). **Con documento (con el pase)**, aparece el bloque de los datos leídos con su lápiz, que abre «Datos de la reserva».
- **Lo mismo en las entradas y las excursiones:** sin documento, un solo lápiz arriba con todo lo que pone el viajero (sitio, día, hora, para quién, precio); el de los datos leídos solo con documento.

## 5. Todas las ruedas de la hora, iguales (pendiente de la 10S6)
- En «Datos de la reserva» del alojamiento, «Entrada» y «Salida» abren **la rueda del iPhone** (con «Restablecer» y el ✓ azul) y, al tocar «Salida», se pone sola la hora de ahora («0:34»). **Todas las ruedas de la app, como la del vuelo:** desde abajo, en su hoja, con ✓ y papelera, tocar fuera guarda, y el ✓ guarda aunque no se mueva (apartado 2). Con su ejemplo en gris: Entrada «15:00», Salida «11:00».
- Repasa todas (alojamiento, entradas, Free Tour, excursiones, gastos, «Datos del vuelo», «Datos de la entrada»…) y dime cuáles has cambiado.

## 6. Los botones flotantes tapan cosas que se tocan
- En «Llegada y vuelta», el botón de logros tapa el lápiz de la fila del precio; en «Alojamiento», el final de la línea del pase. Propón cómo arreglarlo (por ejemplo, que los botones flotantes se escondan al bajar y vuelvan al subir, como en muchas apps) y hazlo si no cambia nada más. Que nada que se toca quede debajo de ellos.

## 7. La prueba
- Solo las pruebas de lo tocado, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10S9`: los tres bloques con la misma cabecera (estado debajo, flecha) y que se cierran faltando algo; las pestañas «Ida» y «Vuelta» sin fecha ni hora; las horas de ejemplo en gris y sin contar para guardar; el ✓ sin mover la rueda guarda 08:30; sin pase, guardar el vuelo no abre «Hemos ajustado tu ruta»; con pase, no sale antes de la pregunta; el alojamiento con un solo lápiz sin documento y dos con documento (igual en una entrada); la rueda nueva en «Datos de la reserva» con 15:00 y 11:00 en gris; los botones flotantes sin tapar el lápiz del precio; Ostia y Nápoles con sus datos.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S9.html`, a tamaño de móvil.

## 8. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S9»: qué has hecho, en palabras sencillas, y qué pruebas has pasado. **Al final, la lista de comprobación DE ESTA TANDA**: todos los puntos, en el mismo orden, con ✅ / ⚠️ / ❌, dónde lo mira Eric en el móvil (con pase o sin él) y su captura. La misma lista arriba de `REPASO_10S9.html`.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
