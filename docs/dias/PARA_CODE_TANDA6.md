# Para Code · Tanda 6: el motor de listas (paradas y franjas, sin horas al minuto)

**Empieza cuando acabes la Tanda 5.** Esta tanda cambia la forma de hacer los días. Hasta ahora eran tablas con horas al minuto, cuatro versiones por atardecer, y el motor corregía y rellenaba. Desde ahora son **listas de paradas por franjas**, escritas por nosotros, y el motor solo hace unas pocas cosas.

La fuente es `docs\dias\DIAS_ROMA_PARADAS.md`: lee primero «Cómo funciona», que son las 15 reglas que valen para todos los destinos. **No lo toques.**

## Cómo trabajar

- **Nada de parches:** cada regla, en un sitio y para todos los destinos.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA6.md`.
- **Al acabar,** `INFORME_TANDA6.md` en palabras sencillas.
- **Commits locales por bloques. No hagas push.**

## 1. Archivar lo viejo (no borrar)

- Mueve `docs\dias\DIAS_ESCRITOS_ROMA.md` y las tablas viejas de `data/dias/roma/` a una carpeta de archivo (`docs/archivo/` y `data/archivo/`).
- Quita del motor lo que ya no se usa:
  - las horas escritas al minuto;
  - las versiones A, B, C y D;
  - el ajuste al atardecer;
  - las tablas de fechas especiales;
  - rellenar huecos y alargar paradas;
  - la corrección automática de las distancias;
  - los márgenes complicados.
- Antes de quitar nada, apunta en el informe qué quitas y por qué.

## 2. El formato de los días

Haz un convertidor de `DIAS_ROMA_PARADAS.md` a datos. Cada día lleva:

- **Franjas:** mañana, comida, tarde, cena y noche.
- **Cada parada:** el sitio (de `roma.json`), los minutos aproximados (`~`) y cómo se visita: por dentro, por fuera o de camino.
- **Comida y cena:** el restaurante y su alternativa (y la tercera, si la hay).
- **Noche:** las nocturnas por orden de preferencia.
- **Avisos del día y cierres especiales:** lunes, miércoles, domingo.
- **Pool:** dónde va cada cosa.
- **Experiencias:** qué sustituyen o qué añaden.
- **Free Tour.**
- **Si llueve.**

Si una línea del documento no se entiende como dato, **no la inventes**: apúntala en las preguntas.

## 3. Lo que hace el motor (y nada más)

1. **Elegir los días del viaje y su orden.** Igual que ahora: el Vaticano no en domingo ni miércoles, la excursión, «Prefiero quedarme en Roma».
2. **Cierres:**
   - lo cerrado ese día sale de la lista con «Cerrado hoy», o el día se cambia con otro;
   - cada parada tiene que estar abierta en su franja;
   - avisos «Cierra a las…» y «Abre a las…».
3. **Lo que tiene hora fija** (reserva, turno, Free Tour) va a su hora:
   - la tarjeta «Llegada a…» va antes;
   - lo que cabe antes va antes y lo demás después, sin cambiar el orden;
   - si antes queda un rato, entra una parada corta pegada al sitio;
   - si no, el día empieza más tarde.
4. **Pool y experiencias:** van al sitio escrito en el documento.
5. **Si cabe:**
   - el motor suma lo que dura cada parada y el trayecto, por franja;
   - si no cabe, lo de menos importancia de esa franja pasa a «Si te sobra tiempo» (la pirámide, de abajo arriba; nunca un imprescindible la primera vez);
   - la comida, como muy tarde a las 14:30.
6. **Restaurantes y nocturnas:**
   - la alternativa escrita;
   - un recambio, solo si es un restaurante de verdad y está a menos de 10 min;
   - sin repetir restaurantes ni nocturnas;
   - las nocturnas imprescindibles, en los primeros días.
7. **Siempre las mismas comprobaciones al recolocar** (regla 13 del documento):
   - sin zigzag;
   - la pirámide;
   - por dentro una sola vez;
   - nada repetido;
   - se come y se cena donde acaba la ruta;
   - nada cerrado.

   Si un cambio rompe alguna, no se hace.
8. **Hora orientativa:** la suma de lo que dura cada parada más el trayecto, desde que empieza el día. Se enseña pequeña («hacia las 10:30») y nunca se usa para mover nada. *Provisional.*

## 4. Lo que se ve en la app

- **El trayecto entre paradas, siempre:** en RUTA, DÍAS y HOY, entre una tarjeta y la siguiente («8 min andando», «Taxi, 15 min», «Bus 23, 20 min»).
- **Fallo que hay que arreglar:** al abrir las opciones del trayecto solo salen «Andando» y «Taxi». **Falta «Transporte público»** (autobús, metro, tranvía y tren), con su tiempo y la línea si la hay.
- **«De camino»:** dos o más seguidos, en una sola tarjeta «De camino a {siguiente}», sin foto propia.
- **«Llegada a…»:** su propia tarjeta, con su texto (cuánto antes, por qué, dónde se entra) y sin foto.
- **«Si te sobra tiempo»:** un apartado plegado al final del día, solo si ha sobrado algo, con un botón «Añadir» en cada parada.
- **La cabecera del día:** «Hoy el sol se pone a las…», solo como dato.
- **«No incluido»:** solo lo que se queda fuera del viaje, con su motivo si es un cierre.

## 5. La pestaña HOY

- La siguiente parada, el trayecto hasta ella y «Marcar como hecha».
- Los avisos de cierre de hoy.
- **Cuenta atrás de las reservas:** «Tu entrada al Coliseo es a las 12:00. Sal de aquí a las 11:15».
- **«Voy con retraso»:** lo de menos importancia de la franja en la que está pasa a «Si te sobra tiempo», con las comprobaciones del punto 3.7. Mensaje: «Hemos ajustado tu día para que no pierdas lo importante».
- **«Estoy cansado»:** lo mismo, pero quitando más: deja solo lo de nivel 1 y 2 de lo que queda del día.
- **Lluvia:**
  - mira la previsión con Open-Meteo (es gratis), la víspera y esa mañana;
  - si hay previsión de lluvia en una franja: «Hay previsión de lluvia esta tarde. Si llueve, aquí tienes una alternativa» **[Ver alternativa]**;
  - la alternativa es la línea «Si llueve» de ese día;
  - nunca cambia sola: decide el viajero.

## 6. Pruebas (sencillas)

En todos los viajes de 1 a 6 días, las 365 fechas de 2027, con y sin pool, Free Tour y reservas:

1. **El orden de cada día = el de su lista**, sin lo quitado.
2. **Nada cerrado** en su franja.
3. **Sin zigzag:** la ruta no vuelve a menos de 300 m de una parada anterior después de alejarse más de 600 m (salvo que la lista escrita lo haga).
4. **La pirámide:** ningún imprescindible quitado la primera vez que sale.
5. **Por dentro una sola vez** en el viaje.
6. **0 restaurantes y 0 nocturnas repetidos.**
7. **Las reservas, a su hora,** con su «Llegada a…».
8. **Ninguna comida después de las 14:30**, salvo que delante solo haya imprescindibles; esos casos, apuntados.

**No hay prueba de «huecos»:** el tiempo libre es del viajero.

Al final:
- **una página de simulación nueva** (con `<!doctype html>` y `<meta charset="utf-8">`) con un viaje de cada duración, en invierno y en verano, uno con reserva y otro con lluvia;
- **reinicia el api-server.**

## 7. Lo que NO va en esta tanda

- Las llegadas y salidas: la hora en el formulario, la tarde de llegada y la mañana de salida. Lo estamos pensando.
- «Cerca de ti», compartir el viaje, el diario.
