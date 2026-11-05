Hola. TANDA HOY3: LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO (5-nov). Va después de la HOY2b (con su push). Eric los usa en Lanzarote desde el domingo 8: subida el VIERNES 6 por la noche como tarde. Si no llega todo, sube lo que funcione (0 fallos) y dime lo que falta. Este prompt acaba con «reinicia el api-server»: si no te llega, dímelo antes de empezar.

**La idea:** hoy los avisos de HOY solo salen con la app abierta. Los que dependen de la HORA (no de dónde estás) tienen que llegar también con el móvil bloqueado, como notificación. Usa los avisos que ya mandamos antes del viaje (`web-push`, «en 10 días empieza tu viaje»). Los avisos por cercanía se quedan como están: esos irán con la app nativa.

- **Como siempre:** con el pase (y el día de prueba). Roma y Lanzarote (oculto). 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_hoy3.md` a la rama `estado`. No apagues el PC.
- **Textos:** frases completas y cercanas, como en `TEXTOS_HOY.md`. Añade ahí los de esta tanda.

## 1. Los avisos
1. **Cada mañana,** 30 min antes de la hora de salir, nunca antes de las 7:30: «Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26.» Si hay aviso del tiempo para hoy, va en el mismo mensaje.
2. **«Sal ahora para llegar a tu turno de las 11:30»:** a la hora de salir hacia un turno o una reserva, solo si los hay.
3. **El tiempo, la noche antes** (21:00): solo si mañana hay lluvia, nubes en los miradores del norte o viento fuerte, con los umbrales de `avisos_tiempo.json`. Por ejemplo: «Mañana habrá nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.»
4. **El atardecer,** 1 h antes: «Hoy el sol se pone a las 18:04. Desde El Golfo se ve precioso.» Con la parada del día o, si no la hay, el sitio de atardecer más cercano a la zona de hoy.
5. **El día de llegada,** a la hora de aterrizar más 10 min: «Bienvenido a Lanzarote. Cuando tengas el coche, empiezas hacia las 11:25.»
6. **El último día:**
   - por la mañana: «Hoy vuelves a casa. Devuelve el coche en la T1 antes de las 17:10.»;
   - y a la hora límite menos 30 min: «En media hora tienes que salir hacia el aeropuerto.»

- **Límites:** como mucho 4 avisos al día y ninguno entre las 22:00 y las 7:30 (salvo el de llegada).
- **Al tocar un aviso,** se abre HOY.
- **Si el viajero cambia la ruta** (una propuesta aplicada, otro día, una reserva nueva), los avisos de ese día se recalculan.

## 2. La hora del destino
Todas las horas, en la hora del destino: Lanzarote va 1 h por detrás de la Península (Atlantic/Canary). Un aviso «a las 9:26» tiene que llegar a las 9:26 de Lanzarote. Pruébalo.

## 3. Cómo se mandan a su hora
En el plan gratuito de Vercel, los cron solo van una vez al día. Hazlo cada 5 min de otra forma (por ejemplo, `pg_cron` y `pg_net` de Supabase llamando a un endpoint del api con una clave secreta, o lo que veas más fiable) y dime cómo lo has hecho.
- Si hace falta una tabla o una migración, dame el SQL listo para pegar en el SQL Editor y su número. Eric las aplica a mano.
- Nunca pongas claves en el código ni en el chat.

## 4. En el móvil de Eric
- **iPhone:** los avisos solo llegan si JUTRIP está en la pantalla de inicio. El primer día del viaje, si es iPhone y no está instalada, una tarjeta en HOY: «Añade JUTRIP a tu pantalla de inicio para recibir los avisos del viaje», con los pasos (usa `instalar.ts`). Se cierra con la X.
- **Ajustes:**
  - el interruptor «Avisos en el móvil» incluye estos avisos (pon al día su línea);
  - solo para el administrador, [Enviarme un aviso de prueba], para que Eric compruebe hoy mismo que le llegan.

## 5. La prueba
- `pruebaJutrip`, `pruebaTandaHOY1`, `pruebaTandaHOY2` y `pruebaTandaHOY2b` en 0.
- **Nueva `pruebaTandaHOY3`, con reloj de mentira:**
  - cada aviso a su hora;
  - la hora de Canarias;
  - como mucho 4 al día y nada de noche;
  - el turno solo si lo hay;
  - el tiempo solo si toca;
  - se recalculan al cambiar la ruta;
  - sin pase, ninguno;
  - con el interruptor apagado, ninguno.
- **En el REPASO:**
  - **la lista de avisos del viaje de Eric,** del domingo 8 al viernes 13: la hora y el texto de cada uno, para que los compruebe;
  - **cómo se mandan;**
  - **la migración**, si la hay;
  - **tu lista de comprobación DE ESTA TANDA.**

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
