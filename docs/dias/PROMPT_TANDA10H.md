Hola. TANDA 10H, pequeña: [ESCUCHAR HISTORIA] SIN PASE, EL NOMBRE DEL PASE Y EL DÍA DE PRUEBA. No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10H.md e inclúyelo en tu commit.

## 1. [Escuchar historia] sin pase
- El **mismo botón de siempre**, con su diseño (el de la tarjeta de la parada y el de la ficha), y **el candado dorado en el extremo derecho, dentro del botón**, sobre marfil, como los demás cerrados.
- Fuera «Con la versión completa».
- Al tocarlo: «Incluido con el Pase de Roma» y `abrirPase()`.
- La historia del Coliseo, como muestra, sigue abierta.

## 2. El nombre del pase, siempre del destino
- En toda la app, «Pase de {Destino}» sale de los datos del destino («Pase de Roma», «Pase de París», «Pase de Londres»…). Busca si queda algún «Pase de Roma» escrito a mano y pásalo al dato.

- **En oro, siempre (Eric, 24-oct):** en los textos de la app, **«HOY»** y **«Pase de {Destino}»** van siempre en oro, para que se reconozcan como algo de la app. Con la regla de lectura de Marca JUTRIP: en texto pequeño, el oro profundo (`#6F4E37`); en títulos de 18 px o más, el oro oscuro (`#A67C52`); sobre los paneles oscuros, el oro pálido (`#E9C77A`). Que sea una sola pieza (por ejemplo, un `<Marca>` que se usa dentro de cualquier frase), para que salga igual en toda la app, también en los textos del día de prueba de abajo.

## 3. El día de prueba
Las reglas (APUNTES_TRAS_TANDA7 §33, decididas por Eric):
- uno por cuenta, para siempre;
- **qué día es:** un día entero. El de llegada, si está libre antes de las 10:00 (casi entero); si no, el siguiente; sin vuelo, el día 1; si ningún día está libre antes de las 10:00, el que tiene más horas libres;
- **el día empieza a las 00:00 y acaba a las 23:59, con la hora del destino**;
- **se gasta** solo al usar HOY ([Visto] o [Cómo llegar]); si lo usa por primera vez a partir de las 12:00: «Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?» [Hoy] [Mañana];
- si ya lo ha usado, HOY enseña la tarjeta de la pantalla 12, sin más avisos.

Lo que tiene que salir en HOY sin pase. Los textos son de Eric y Claude; el destino, el día y el pase salen siempre de los datos («Roma», «sábado 25», «Pase de Roma»):

| Momento | Qué sale |
|---|---|
| Más de 5 días antes del viaje | La cuenta atrás y lo que tendrás. **Sin hablar de la prueba.** |
| **Desde 5 días antes**, prueba sin usar y **la prueba no es el primer día** | La cuenta atrás («Tu modo Hoy se activa el sábado 25») y debajo: «Te regalamos un día con HOY para que lo pruebes: **el domingo 26, gratis y completo**. Y si luego te quedas con el pase, lo que veas el sábado también suma a tus logros.» |
| **Desde 5 días antes**, prueba sin usar y **la prueba es el primer día** | La cuenta atrás y debajo: «Te regalamos tu primer día con HOY para que lo pruebes: **el sábado 25, gratis y completo**.» |
| Antes del viaje, prueba ya usada en otro viaje | La cuenta atrás, sin hablar de la prueba. |
| El día de llegada, si la prueba es mañana | «Mañana es tu día de prueba: queremos que vivas Roma con el Pase de Roma completo, gratis, un día entero.» |
| **El día de la prueba** (de 00:00 a 23:59, hora del destino) | HOY entero y, arriba, la franja: «Hoy es tu día de prueba: tienes el Pase de Roma completo, gratis, hasta medianoche. Disfrútalo.» |
| Durante el viaje, después de la prueba | «¿Qué tal ayer con HOY? Sigue con tu compañero el resto del viaje y completa los secretos y las colecciones de Roma. Lo que conseguiste ayer ya es tuyo.» y [Ver el Pase de Roma]. |
| Durante el viaje, prueba ya usada en otro viaje | «Tu modo Hoy es parte del Pase de Roma.» |
| **Después del viaje** | **Nada de la prueba** (hoy sale «Tienes un día de prueba» y no debería): «Tu viaje a Roma ha terminado. La próxima vez, con el Pase de Roma, te acompañamos todo el viaje.» |
| Sin fechas | «Pon tus fechas» (sin prueba hasta que haya fechas). |

- **«Lo que veas el sábado también suma a tus logros»:** comprueba que es verdad con lo que ya hay («Lo de ayer también cuenta», con las fotos de días anteriores). Si para que sume hace falta algo (por ejemplo, la foto), dímelo y ajustamos el texto: no se puede prometer algo que la app no hace.
- Mira el código y dime si algún caso no sale así, y arréglalo.

## 4. La prueba
- La batería rápida y `pruebaJutrip`.
- Prueba nueva:
  - [Escuchar historia] cerrado con su candado dentro;
  - no queda ningún «Pase de Roma» escrito a mano;
  - «HOY» y «Pase de Roma» salen en oro en los textos (con el oro que toca según el tamaño y el fondo);
  - cada fila de la tabla del día de prueba.
- Capturas en `docs/dias/capturas_jutrip/`:
  - [Escuchar historia] cerrado;
  - una captura de cada fila de la tabla del día de prueba.
- Añádelas a `GRATIS_REVISION.html`.

## 5. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10H».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
