Hola. TANDA V1b: DOS ARREGLOS PEQUEÑOS QUE SALEN DE LA V1 (15-nov). Va antes de la V3 (escenas). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v1b.md` a la rama `estado`. No apagues el PC. Nada en Vercel ni en Supabase de producción sin mi «sí».

## 1. Los avisos, abiertos mientras el cobro esté apagado
- **Sí, hazlo** en `server/avisosViaje.js`. La regla que acordamos el 7-nov es: con `PASES_COBRO_ACTIVO=false`, todo abierto menos leer documentos. Los avisos también.
- **Con el cobro encendido,** todo vuelve a como está ahora: pase del destino, administrador o día de prueba.
- **Las demás reglas no cambian:** la hora del destino, 4 al día como mucho, nada de noche y solo con «Avisos en el móvil» activado.
- **Mira si hay algo más que siga cerrado con el cobro apagado** (aparte de los documentos), en el servidor o en la app. Dímelo en una lista y ábrelo igual, con la misma regla.

## 2. Al abrir la app, no bajar todos los viajes enteros
- **Sí, hazlo.** Al abrir:
  - baja solo la **lista** de viajes (nombre, destino, fechas, foto, lo que enseña Mis viajes);
  - y el **viaje activo** entero (el de hoy o el próximo).
- **Los demás viajes, enteros solo al abrirlos.**
- **Sin internet o con Supabase caído,** igual que en la V1:
  - el viaje activo y su HOY, guardados en el móvil;
  - la lista de Mis viajes, también guardada.
  - Ningún viaje desaparece de la lista porque no se haya bajado entero.
- **El viaje compartido, igual:** el compañero ve la lista y el viaje activo, y los cambios llegan como ahora (la comprobación de la fecha del último cambio de la V1).
- **Lo que ve el viajero, igual que hoy.** Solo cambia lo que se descarga.
- **Dime la cuenta,** antes y después: cuántos kB baja la app al abrir con mi cuenta y cuánto sumaría al mes con 3 usuarios abriendo la app 20 veces al día. Y tu cuenta total de salida de datos al mes después de la V1 y la V1b, contra los 5 GB.

## 3. La prueba (corta)
- `pruebaJutrip` y `pruebaEstabilidad` en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV1b`:**
  - con el cobro apagado, a un usuario sin pase y sin ser administrador le llega un aviso;
  - con el cobro encendido (simulado), no le llega;
  - al abrir la app solo se baja la lista y el viaje activo;
  - al abrir otro viaje, se baja entero y se ve bien;
  - sin red, la lista y el viaje activo se ven.
- **En el REPASO:** la cuenta de antes y después, la lista del punto 1 y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga, que Mis viajes sale entero y que al abrir un viaje que no es el activo se ve bien. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
