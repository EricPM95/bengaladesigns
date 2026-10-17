# El orden para pasarle a Code (preparado el 14-oct, 22:40)

Para dárselo a Eric cuando lo pida. Antes de dárselo, revisar si algo ha cambiado (git log de origin/main y lo que haya dicho Eric).

1. **Tanda 7b · las mañanas de la vuelta más cortas.** El prompt está listo: `PROMPT_TANDA7b.md`. Toca el motor: muestra de 60 fechas, push y las 365.
   - Mientras Code trabaja: Claude busca los horarios de transporte que faltan.

2. **Tanda 7c · los horarios de transporte que faltan** (solo si hay datos oficiales). Ciampino, Tiburtina, Civitavecchia, FL1, metro, bus 40/64, tranvía 8, nocturnos y el Leonardo de invierno (desde el 13-dic; quizá aún no publicado). Son datos de `_llegada.json`: si no cambia el motor, solo la batería rápida. Si lo de invierno no ha salido, esa parte espera a noviembre.
   - Se puede juntar con la 7b si los horarios están listos antes de que Eric pase la 7b.

3. **Tanda 8 · HOY, los logros, «Por qué te lo recomendamos» y /admin/logros.** No toca el motor: solo la batería rápida. Antes hace falta:
   - que Eric revise los 95 textos de «Por qué» y sus 4 dudas (Colonna repetido, la cifra de 50.000 del Coliseo, los pintores de la GNAM, Fellini);
   - los dibujos finales de Design: la fila del sello del Vaticano en «Modelos», los iconos que hay que cambiar y los arreglos de las pantallas;
   - Viajero fundador: decidido. Acaba un año después de la salida (estimado: 4-nov-2027). Que Code lo guarde como «salida + 1 año», no como una fecha escrita a mano;
   - Probador: por decidir;
   - los nombres de todos los logros: ya revisados (`NOMBRES_LOGROS.md`).

**También en la Tanda 8:** que la web se pueda instalar en el móvil (icono, pantalla completa y el aviso «Añádela a tu pantalla de inicio»), y las reglas de peso (apartado 16 de los apuntes).

**Fuera de la Tanda 8:** la vuelta al mundo (va en la próxima actualización, después de la salida).

Todo lo de la Tanda 8 está en `APUNTES_TRAS_TANDA7.md` y `BRIEF_DISENO_LOGROS.md`.

4. **Tanda de las cuentas (la última antes de la salida).** Inicio de sesión con email y enlace mágico o con Google; la cuenta se pide al empezar; logros y fotos se guardan en la cuenta. Las fotos van a la nube, comprimidas (unos 300 KB), sin la ubicación escondida, privadas, borrables al borrar la cuenta y con [Guardar en mi galería]. Además: política de privacidad (RGPD) y [Borrar mi cuenta]. Viajero fundador y Probador se conectan aquí. Detalle en el apartado 24 de los apuntes.
   - **El cobro, «el pase del viaje»:** un pago por viaje que abre lo de antes (llegada, vuelta, alojamiento) y lo de durante (HOY y logros), con un día de prueba gratis cuando empieza el viaje. Va en esta tanda; si no llega a tiempo, sale en 2027 y hasta entonces todo queda abierto. Detalle en el apartado 25 de los apuntes (17:18–17:33).

## La Tanda 8, partida en tres (16-oct, noche)
- **8a · el cerebro de los logros** (PROMPT_TANDA8A.md): sin pantallas, detrás de un interruptor. Batería rápida.
- **8b · HOY v2 y los momentos:** cuando Design acabe los pasos 3 y 4.
- **8c · las pantallas de los logros.**
- Después: cuentas, parte 3 (pantallas reales y el cobro del pase).

## Antes de la prueba con las 100 personas (Eric, 17-oct)
- Tres agentes revisan toda la app en busca de errores: textos y avisos que no cuadran con su sitio, fotos de otro sitio, mapas, fechas y números (APUNTES §38).

## Además, cuando toque
- Volver a sacar VIAJES_REVISION con el motor nuevo (después de la 7b).
- Copiar al PC: PENDIENTES_RECOMPENSAS, PENDIENTES_ESCUCHAR, PENDIENTES_6K, APUNTES_TRAS_TANDA7, BRIEF_DISENO_LOGROS, PROMPT_TANDA7b y este archivo. Nunca mientras Code está en mitad de una tanda.

## Los enlaces de afiliación (Eric, 16-oct, 10:52) · antes de salir
- Todos los botones de compra de la app tienen que llevar nuestro código, para que nos llegue la comisión:
  - entradas y excursiones: Civitatis, con el código 5206 y la campaña «app» (después, el nombre de la app);
  - la otra tienda de entradas, de reserva (GYG): con su enlace de afiliado (Eric ya tiene la cuenta);
  - hoteles y alojamiento: Booking. Falta el código de afiliado; Code dejó el hueco preparado;
  - el traslado privado al alojamiento: Eric pasa los enlaces;
  - lo de «Útil para el viaje» (los descuentos del 5 %): comprobar que cada enlace lleva su código.
- Code repasa todos los botones de compra (Explorar, Reservas, las fichas, las excursiones, «Útil para el viaje») y entrega una lista: cuáles llevan código y cuáles no.
- Eric comprueba en su panel de Civitatis que llegan los clics con la campaña «app».
- Regla de siempre: en la app nunca se nombra a la empresa.

## Lo que ya hizo Eric fuera del código (16-oct, 18:39)
- Supabase: «Allow manual linking» activado; «Allow anonymous sign-ins» sigue activado.
- Vercel: `SUPABASE_SERVICE_ROLE_KEY` puesta como Secret (clave `sb_secret_`).
- Google: proyecto «App rutas» en Google Cloud, en modo Prueba (solo entra Eric como usuario de prueba), con el permiso openid. Cliente web con origen `https://bengaladesigns.vercel.app` y la dirección de vuelta de Supabase. El ID y el secreto, puestos en Supabase → Providers → Google (activado). El secreto viejo está borrado.
- Supabase → URL Configuration: Site URL `https://bengaladesigns.vercel.app` y Redirect URL `https://bengaladesigns.vercel.app/**`.
- Falta: el servicio de correos (necesita dominio propio, cuando se decida el nombre); aplicar la migración 0020 (cuando estén las pantallas de Design); al salir, pasar Google de Prueba a Publicado y poner el nombre definitivo en Branding.

## Decisiones tras las cuentas, parte 2 (Eric, 16-oct, 21:05)
- Plaza de un pase regalado: si quien la recibió no la usa o borra su cuenta, se pierde. No vuelve al pase. Se queda como lo dejó Code en la 0021.
- Migraciones pendientes, para cuando se prueben las cuentas con las pantallas de Design: 0017 (ventas del afiliado; comprobar si ya está) y después 0020 y 0021, juntas y en ese orden.
- El registro de ventas del afiliado nunca funcionó en producción (sin la clave y sin `SALES_INGEST_SECRET`). No afecta a lo que paga Civitatis; solo a nuestra copia.

## Para la próxima tanda de Code (cuentas, parte 2)
- Eric puso en Vercel `SUPABASE_SERVICE_ROLE_KEY` (16-oct, 18:11) como Secret, con una clave nueva de Supabase de las que empiezan por `sb_secret_` (no la antigua `service_role`). Code tiene que comprobar que su versión de supabase-js la acepta en el servidor; si no, decírselo a Eric.
- Cambiar el borrado de cuenta: el pase que es para otra persona se queda con esa persona; un viaje compartido no se borra, pasa a administrarlo el invitado que entró primero.
- La lógica del enlace o código para invitar.
- Partir la prueba larga por fechas (`tramo=i/n`) para que tarde unos 5 minutos.

## La fecha de salida (Eric, 16-oct, 9:47)
- «No te sofoques con los días, si hace falta sale el año que viene, pero vamos a acabar todo esto bien.» El 4-nov ya no es fijo: primero, todo terminado y bien hecho.
- Orden: Design termina todas las pantallas → Code programa por tandas (HOY v2, logros, pantallas de logros, cuentas y pase) → se prueba todo → sale.

- Regla (Eric, 16-oct, 12:18): todo lo apuntado hasta ahora va en la primera versión, también recomendar cambios en un viaje compartido (apartado 27 de los apuntes). Después de salir, solo arreglos y cosas extra.

## Después de la salida (antes: hacia el 4-nov)
- Comprobar que todo funciona.
- La salida es como web. Las apps de App Store y Google Play van en una actualización posterior.
- La próxima actualización: la tienda (destinos nuevos, emblemas nuevos para ganar y marcos de viajero), la vuelta al mundo y las rutas de la app (la Costa Brava: Tossa y Cadaqués).
