Hola. TANDA V63: ARREGLOS DE HOY Y DÍAS QUE VIO ERIC EN EL IPHONE (25-nov). Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V62 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v63.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

**Son 12 cosas.** En el REPASO, **una línea por cada una con ✅ hecho, 🟡 a medias o ❌ no hecho, y por qué**.

## Los avisos de abajo con [Deshacer] (`AvisoSobreLaBarra`)
1. **Tapan los botones de una hoja abierta** (el de «Parada saltada» encima de [Hacer la foto] del Emblema Oculto). **Mientras haya un aviso con [Deshacer] abajo, la hoja que se abra empieza justo ENCIMA del aviso;** cuando el aviso se va, la hoja baja a su sitio. Nunca un aviso tapa un botón.
2. **El de «Parada saltada · la tienes en Lugares pendientes» sale más abajo que los demás** y deja ver medio menú (la píldora «Hoy» cortada). Regla V44: todos tapan el menú entero, en el mismo sitio. Busca por qué este no y arréglalo.
3. **La línea de tiempo (idea de Eric):** en el borde de arriba del aviso, una línea dorada fina que se va acortando de derecha a izquierda durante lo que dura el aviso; al llegar a la izquierda, el aviso se va. En TODOS. **La duración, la de ahora** (no se toca).

## HOY
4. **El Emblema Oculto de una parada SALTADA** salió estando en la siguiente (en la Plaza del Campidoglio: «Haz una foto en el Foro Romano y Palatino», recién saltado). El de una parada saltada no sale; el de la parada de ahora habla de esa parada.
5. **Al eliminar un viaje salía el resumen del día** (pantalla vacía «TU DÍA» y luego «Aún no has ganado nada hoy»; seguramente `diaCompleto` en `MomentosHost.tsx` da «todo hecho» con un día sin paradas). Nunca el resumen de un viaje eliminado ni de un día sin paradas; nunca una pantalla vacía mientras carga.
6. **El aviso verde «Tu entrada a el Coliseo · 09:15 ✓»** (`entradasDeHoy`, `HoyDuranteV2.tsx`) sale todo el día. **Se va solo a la hora de la entrada + el tiempo de visita recomendado de ese sitio.**
7. **El atardecer** (`fraseDeAtardecer`): con lluvia o cielo cubierto previstos a esa hora, no sale; y si se usó el plan de lluvia, nunca un sitio que el plan ha quitado (el 25-nov, con lluvia fuerte, invitaba a San Pietro in Montorio, que el plan quita).
8. **El plan de lluvia:** el texto de arriba empieza a media frase y en minúscula («el Foro, más corto; por la tarde…»): falta el principio (`hoyLluvia.ts`). Frases completas y claras.
9. **«De dónde» cuenta los minutos, siempre el de verdad:** en Lanzarote salía «13 min · desde el alojamiento» cuando eran 13 min desde la parada anterior (la Casa-Museo); desde el alojamiento eran 29. La tarjeta dice siempre desde dónde cuenta («13 min · Desde la Casa-Museo»), y toda la app calcula el coche igual.
10. **El álbum de la colección** (HOY › Reto del día › tocar una): el contador «0 DE 5» en **dorado**, no en rojo.

## DÍAS
11. **Fuera «A esta hora ya ha cerrado» (y parecidos) en DÍAS** (decisión de Eric: no se recalculaba y lía). En su lugar, **en la tarjeta plegada de cada parada, al lado del reloj de arena y los minutos, el horario de ese día** («⏳ 15 min · 🕘 9:00–19:00»; con dos tramos, «7:45–13:30 · 16:30–20:00»). Lo que no tiene horario (plazas, miradores, barrios, pueblos, regla V56) → **«Abierto siempre»**. Si no sabemos el horario, nada. **«Cerrado este día» se queda** (es un dato, no un cálculo).
12. **El motor nunca pone una visita en las horas en que un sitio cierra a mediodía** (una iglesia de 13:30 a 16:30): la mueve antes o después. Y **al AÑADIR una parada** (desde EXPLORAR o «+ Añadir parada») a un día en que ese sitio cierra, avisa igual que al moverla (como en `ListaDeDias.tsx`); no obliga.

## Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: la lista de las 12 con ✅/🟡/❌, captura en modo iPhone antes y después de 1, 2, 3, 6, 10 y 11; qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
