# Consulta: la hoja de reglas claras de las rutas

**Aquí no cambies nada del código ni de los datos:** solo opina y compara. Te lo pedimos porque nos están saliendo errores que la prueba no ve, y creemos que es por cómo han crecido las reglas.

- INVARIANTES_MOTOR tiene **476 reglas en 2.700 líneas**, apuntadas por fechas y con reglas de motores antiguos mezcladas con las de ahora.
- Un ejemplo: la **416** (1 de octubre) dice que una nocturna «puede volver a un sitio visto esa tarde (el Puente Sant'Angelo al atardecer y otra vez de noche)». La **462** (3 de octubre) dice que solo si la visita de día fue por la mañana. Siguen vivas las dos, y por eso el día de los Vaticanos sacó el Castillo de día a las 19:50 y su nocturna a las 20:15.

Te adjuntamos el borrador **`docs/archivo/REGLAS_RUTAS_BORRADOR.md`**: unas 30 reglas, en orden de importancia, para todos los destinos. Léelo entero y contéstanos esto:

1. **Choques:** qué reglas de INVARIANTES contradicen al borrador. Dinos el número y qué dice cada una.
2. **Sobran:** qué reglas de INVARIANTES ya no sirven, porque son de un motor que ya no existe (ritmos, redondeo a :00 y :30, `zone_walks`, Claude eligiendo lugares…) o porque otra posterior las sustituye.
3. **Faltan:** qué hace hoy el motor que el borrador no dice, y que tendría que decir. Por ejemplo: las relaciones `contained_in`, `neighbor_of` y `approach_to`, las variantes por cierre, las excursiones o la Navidad.
4. **Qué harías tú:**
   - qué regla falta para que no vuelvan a salir errores como el del Castillo;
   - qué cambiarías del orden de importancia;
   - qué te parece difícil de cumplir o de comprobar.
5. **La prueba:** de cada regla del borrador, dinos si la prueba de hoy ya la comprueba, cómo la comprobarías si no, y qué falta para la regla 29 (una sola identidad por sitio, también para nocturnas, paseos y «De camino»).
6. **Cómo lo dejarías:** proponnos cómo organizar los ficheros. Por ejemplo:
   - un `docs/REGLAS_RUTAS.md` corto, que manda;
   - INVARIANTES solo para lo técnico y la pantalla;
   - cada regla con su comprobación al lado.

   Dinos también qué habría que tocar en el motor y en los días escritos para cumplirlo, ordenado de lo que más errores quita a lo que menos.

## Informe

Escríbelo en `docs/INFORME_REGLAS_RUTAS.md`, en este orden:
1. una tabla de choques (regla de INVARIANTES → regla del borrador → qué hacer);
2. la lista de lo que sobra;
3. la lista de lo que falta;
4. tu opinión.

Explícalo en español sencillo, sin jerga. Si algo del borrador no lo entiendes o te parece mal, dilo.
