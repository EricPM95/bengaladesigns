Hola. TANDA 10N9: ARREGLOS CORTOS DE LO QUE QUEDÓ DE LA 10N8 (28-oct). Va después de la 10N8 (ya hecha): si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N9.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md`; lo de Design, exactamente igual.
- **Cómo trabajar (Eric, 28-oct):** como mucho 2 agentes a la vez, un solo servidor y un solo Chrome de prueba. Antes de lanzar un agente, mira la memoria libre: con menos de 4 GB, espera. Cierra cada proceso en cuanto deje de hacer falta. La nota de estado (`docs/dias/_estado_10n9.md`) a la rama `estado` cada 30 minutos, también mientras esperas a los agentes. Si no está en `CLAUDE.md`, apúntalo.
- **Migraciones aplicadas por Eric:** todas hasta la 0063, **menos la 0062** (no la ha aplicado, por lo del apartado 1).

## 1. Lo «Solo para mí» del administrador guardado aparte, solo en la cuenta conjunta
- **El problema de la 0062:** saca de `trips.bookings` toda reserva cuyo «¿Para quién es?» es solo el administrador, **en cualquier forma de llevar las cuentas**. En «Cada uno lo suyo», como ahora una entrada sale marcada solo para quien la compra, casi todas las entradas del administrador desaparecerían para sus amigos, y se rompería «Eric la tiene a las 9:15 · Reservar la mía a la misma hora» (10N6 1l y 10N8 §8).
- **Que valga solo en la cuenta conjunta** (`modo_cuentas_del_viaje = 'conjunta'`), igual que la 0055: en el disparador, en la limpieza del final y en `reservasPrivadasAdmin.ts`. En «Cada uno lo suyo» y viajando solo, todo como antes de la 0062.
- **Si el viaje pasa de cuenta conjunta a «Cada uno lo suyo»**, lo que estaba guardado aparte vuelve a `trips.bookings` (ya no es secreto: en «Cada uno lo suyo» lo de una sola persona se ve y avisa igual).
- **Migración nueva que sustituya a la 0062** (no la edites): que se pueda aplicar sin haber aplicado la 0062 y que lo deje todo bien. Dime en el informe si Eric debe aplicar la 0062 y luego la nueva, o solo la nueva.

## 2. «Guardar el vuelo» también para el administrador
- Lo de la 10N8 §7d, que solo tiene el invitado: en la rueda de la hora, sin [Guardar]; se rellena todo y, al final, **un solo botón «Guardar el vuelo»** (y «Guardar el alojamiento»). Solo entonces se guarda y llega **un solo aviso**, con la ida y la vuelta juntas.

## 3. Como en Design
- **La hoja del vuelo, exactamente como `Piezas/Reservas Cada Uno`.** Fuera las diferencias que dijiste en la 10N8 (el resumen «✓ Ida…» en las pestañas, la rueda de dos columnas, sin precio, el botón fijo abajo). Si alguna es imprescindible, dímelo antes de hacerla.
- **La tarjeta de «Mis viajes», con los chips de Design.**

## 4. La película del pase
- Captura de cada escena en 390 × 664 y en 375 × 667: **ningún texto se pisa ni se corta**. Si alguno se pisa, arréglalo. Vuelve a poner la comprobación automática para que no pase más.

## 5. «Abierto 24 h»
- **La Fontana di Trevi, con la etiqueta** (se visita a cualquier hora, aunque tenga zona de pago).
- **El Teatro de Marcelo, sin la etiqueta:** abre de 9:00 a 19:00. Ponle ese horario en su ficha.
- El resto de la lista de 38, bien.

## 6. La prueba
- La batería completa y `pruebaJutrip`, en 0 fallos (si alguna falla solo con el Vite normal, pásala con el Vite estable y dilo en el informe).
- Prueba nueva `pruebaTanda10N9`: lo «Solo para mí» del administrador apartado solo en la cuenta conjunta (y que en «Cada uno lo suyo» sus entradas las siguen viendo los demás), el cambio de modo que lo devuelve, «Guardar el vuelo» del administrador con un solo aviso, la hoja del vuelo y «Mis viajes» como Design, la película sin textos pisados en los dos tamaños, «Abierto 24 h» en la Fontana y no en el Teatro de Marcelo.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N9.html`, a tamaño de móvil, al lado de las de Design.

## 7. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N9». Di qué migración hay que aplicar.

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N9.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.

---

**Añadido a la 10N9, apartado 4 (Eric, 28-oct):** la película del pase, en su iPhone, se ve peor que antes, sin márgenes. Puede que hayas usado archivos que no eran. Comprueba que usas `Pase Pelicula Movil` del RETOQUES.zip más nuevo (y los cambios de `Piezas/Pase Pelicula`, `Piezas/Pase Escena 4b` y `Piezas/Pase Globo`), y hazla exactamente igual, escena por escena: captura de cada escena tuya al lado de la de Design, en 390 × 844, 390 × 664 y 375 × 667, con los márgenes de Design. Dime qué archivos usaste en la 10N8 y qué ha cambiado. Guarda este añadido también en docs/dias/PROMPT_TANDA10N9.md.
