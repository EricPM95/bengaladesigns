Hola. TANDA V79: «CERRAR MI VIAJE», EL RESUMEN DEL VIAJE Y LAS MEDALLAS «LA QUE TOCA» EN TODOS LOS LOGROS QUE CUENTAN. Tanda corta, **con pruebas de lo que cuenta logros**. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v79.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `TODO_IGUAL` (en Descargas, la versión de hoy; descomprímelo en `docs/diseno/proyecto/`, encima, sin borrar):
- **VL6** («Cerrar mi viaje») de «La vuelta en HOY»;
- **VL7a y VL7b, la versión NUEVA** («Resumen de tu viaje a Roma / a Lanzarote», con la forma de P1 de «Ficha Logros en Grande»).

Design es un prototipo: las fotos y los números son de ejemplo; van los reales.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. «Cerrar mi viaje» (VL6)
- En el estado «Ya en el aeropuerto» (VL3, V70), debajo de la tarjeta del vuelo: la tarjeta oscura con estrellas «Tu viaje a Roma termina aquí» y [Cerrar mi viaje].
- **Al pulsarlo,** se abre el resumen del viaje (§2) y HOY pasa a «después» (`HoyDespuesV2`). No se borra nada del viaje.
- **Si no lo pulsa,** el resumen sale solo, UNA vez, como decidimos en la V74: 2 horas después de «Ya en el aeropuerto» o, si no pasó por ahí, 2 horas después de la hora del vuelo de vuelta.
- **Se puede volver a abrir** desde el viaje acabado en Perfil, si ya hay un sitio para el viaje acabado. Si no lo hay, no lo inventes: apúntalo en DECISIONES.

## 2. «Resumen de tu viaje a Roma» (VL7a, VL7b)
A pantalla completa, con la MISMA forma que la página de logros del destino (P1, V72). **Solo lo ganado EN ESTE VIAJE:**
- **Arriba:**
  - la foto real del destino;
  - «TU VIAJE A ROMA · 6 DÍAS»;
  - el título «Resumen de tu viaje a Roma»;
  - la tarjeta de la medalla con su grado y su frase («Has conseguido el oro en este viaje» / «Te quedan 2 para la plata»).
- **«Más medallas»:** solo existe en los destinos con más de una medalla (hoy, Roma: Roma y el Vaticano), y solo sale si en este viaje se ganó esa otra medalla. En los destinos con una sola medalla (Lanzarote), nunca.
- **«Colecciones que han avanzado»,** con «4 de 8» y la barrita de P1.
- **«Emblemas ocultos descubiertos»:** cada uno con su dibujo real y su nombre.
- **«Logros de viajero»** ganados en este viaje: las tarjetas de L1, **sin el círculo de la vitrina** (aquí no hay vitrina).
- **«Tus fotos del viaje»:** unas cuantas y «+43». Al tocar, el álbum del viaje.
- «Roma aún esconde 9 secretos: vuelve cuando quieras».
- **[Ver mi pasaporte] en GRANATE.** **Regla nueva para CLAUDE.md: el pasaporte va siempre en granate**, también su botón; es la única excepción al dorado único (V53).
- **Al tocar una medalla o una colección,** la ficha en grande de la V72.
- **Con pocos logros no queda vacío:** las secciones sin nada no salen (VL7b).

## 3. Las medallas de los logros que cuentan: SIEMPRE «la que toca» (Eric)
- **Todo logro que va contando** (países, destinos, capitales, continentes…) se dibuja **siempre con la medalla del nivel que le toca por el TOTAL que lleva en ese momento.**
  - Ejemplo con los países:
    - el 1.er país, la medalla de nivel 1;
    - el 2.º, **la misma** de nivel 1;
    - el 3.º sube a la de «Trotamundos»;
    - y así con el 5, el 8, el 10…
  - **Hoy está mal** en el resumen del día: `ResumenDia.tsx` usa `<Chapa logro="paises" escalon={i + 1}>`, por el orden del día.
- **Cada país nuevo, con su bandera redonda** en la esquina de la medalla, como en VL7a («Italia · país nuevo»). Donde la esquina de arriba lleva el círculo de la vitrina (+ / ✓), la bandera va abajo a la derecha. Fuera el emoji delante del nombre.
- **Una sola cuenta para todo:** una función que, dado el logro y el total, dé su nivel. La usan TODAS las pantallas:
  - la pantalla grande al ganarlo;
  - el resumen del día y el resumen del viaje;
  - la ficha en grande;
  - «Todos mis logros».

  Busca cada sitio donde se dibuja una de estas medallas y dime en el REPASO cuáles has cambiado.

## 4. Pruebas
- Escribe `pruebaV79`:
  - la función del nivel: 1, 2, 3, 4, 5, 8, 10 países y destinos;
  - el resumen del día con un 4.º país (medalla de nivel 3, con su bandera);
  - el resumen del viaje sin otra medalla (sin «Más medallas»);
  - el resumen sale una sola vez (al pulsar o a las 2 h).
- **Pásalas:** `pruebaV79`, `pruebaLogros1`, `pruebaLogros2`, `pruebaV35A_logros` y `pruebaJutrip`. `npm run build` sin errores.
- **El REPASO, corto:** captura en modo iPhone al lado de su dibujo de VL6, VL7a y VL7b (Roma y Lanzarote); un país nuevo en la pantalla grande, el resumen del día y «Todos mis logros». Qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
