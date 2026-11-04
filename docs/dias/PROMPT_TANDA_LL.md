Hola. TANDA LL: EL DÍA DE LLEGADA Y EL DE VUELTA (4-nov). Dos partes con un push cada una: PRIMERO Lanzarote (Eric se va el domingo 8 y lo va a usar), DESPUÉS Roma. Si el límite de uso no da para las dos, la parte 1 tiene que quedar subida. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Antes de empezar:** Eric acaba de descargar dos informes: `LANZAROTE_LLEGADAS_PROPUESTA.md` y `ROMA_LLEGADAS_ANALISIS.md` (búscalos en su carpeta de Descargas; si el nombre lleva un número detrás, es el mismo). Crea `docs/llegadas/` en el proyecto y cópialos ahí con esos nombres. Son el plan, hecho leyendo y ejecutando el motor. Si no los encuentras, dímelo y para.
- **Como siempre:** Lanzarote sigue oculto (solo administrador). 2 agentes como mucho, 1 Chrome, un servidor. Nota de estado (`_estado_ll.md`) a la rama `estado` cada 30 minutos y al acabar cada parte. No apagues el PC.
- **Reglas de Eric para TODOS los destinos:**
  - **Hora útil de llegada** = aterrizaje + **45 min** para salir con el equipaje (siempre, en cualquier aeropuerto) + **1 h** para recoger el coche de alquiler (solo si hay coche de alquiler) + el trayecto a la zona del alojamiento + **1 h** para instalarse.
  - **El día de llegada nunca queda vacío:** con lo que quede hasta la cena, paradas ligeras y cercanas al alojamiento, la cena cerca y, si toca, el atardecer o el paseo de noche.
  - **Los imprescindibles grandes, siempre por la mañana y en días enteros:** nunca el día de llegada ni el de vuelta. Una reserva del viajero manda siempre.
  - **Adaptar los días de llegada y vuelta al vuelo es del pase,** como hoy. Sin pase, como ahora.

# PARTE 1 · LANZAROTE (lo primero)
Haz lo que propone `LANZAROTE_LLEGADAS_PROPUESTA.md` (apartados 2 a 5 y 7), con estas decisiones de Eric:
1. **El día de llegada,** con las filas A a F del apartado 3 y las paradas por zona de esa tabla. En las filas A y B, el día «Manrique en casa» (en Playa Blanca, el de Papagayo) cuenta como hecho. En domingo, su versión de domingo (el mercadillo).
2. **El reparto del apartado 4.** El primer día entero es el sur volcánico (Timanfaya), SALVO después de una llegada en las filas E o F (de noche): entonces el día 2 es el norte de Manrique y el sur pasa al día 3, para no salir a las 7:51 después de llegar de noche.
3. **El día de vuelta del apartado 5:**
   - **hora límite** = vuelo − 2 h de aeropuerto − **30 min** para repostar y devolver el coche − el trayecto de la última parada al aeropuerto;
   - las paradas de la última mañana por zona y por hora del vuelo, de su tabla;
   - si el vuelo sale a las 17:00 o más tarde y «Manrique en casa» no se ha hecho, su versión corta va el día de vuelta.
   - **Nunca vacío** si hay tiempo.
   - Pon al día los minutos de salir antes por zona en `_llegada.json` (hoy, 165 para todas).
4. **Las cenas, según el día de la semana:** solo los restaurantes que abren ese día. Si no se sabe de ninguno abierto, «Cena cerca de tu alojamiento», sin nombre. Lo mismo con las comidas, también la de La Graciosa, que hoy no lleva (Casa Enriqueta o El Veril según el día).
5. **Sin horas muertas:**
   - en el sur volcánico, la comida no deja un hueco de más de 30 min (adelántala, sin bajar de las 12:30, o alarga la bodega);
   - en noviembre a marzo, el día de Papagayo sale de casa para llegar hacia las 10:00, no a las 9:00.
6. **El viaje de Eric como prueba fija:**
   - aterriza en ACE el domingo 8-nov-2026 a las 08:25 y vuela el viernes 13-nov a las 19:40;
   - Costa Teguise, coche de alquiler, con pase;
   - tiene que salir lo del apartado 6.1 (domingo, Manrique en casa con el mercadillo; lunes, el sur; martes, el norte; miércoles, La Graciosa; jueves, Papagayo; viernes, la mañana cerca y el coche en la T1 antes de las 17:10).
   - Si algo no cuadra con el informe, dímelo.
7. **La prueba nueva `pruebaTandaLL_LZ`:**
   - las filas A a F con llegadas a las 08:25, 10:00, 12:00, 14:30, 17:00, 19:00 y 23:00, desde las 6 zonas, en noviembre y en julio;
   - ningún día de llegada vacío si hay tiempo;
   - ningún imprescindible entero el día de llegada ni el de vuelta;
   - ningún restaurante cerrado ese día;
   - el día de vuelta llega a la T1 antes de su hora límite;
   - el viaje de Eric, tal cual.

   Y `pruebaTandaLZ2a`, `pruebaTandaLZ2b1`, `pruebaTandaLZ3` y `pruebaJutrip` en 0. Las que daban por hecho lo de antes, puestas al día con «antes → ahora → decisión de Eric».
8. **En el REPASO:** capturas de móvil de los 6 días del viaje de Eric y de un día de llegada en la fila C y en la fila F. Y tu lista de comprobación de esta parte.

**Push de la parte 1** (prueba en 0 fallos, Roma idéntica, sin --force). Luego, la parte 2.

# PARTE 2 · ROMA
Haz lo que propone `ROMA_LLEGADAS_ANALISIS.md` (apartado 5), con estas decisiones de Eric:
1. **Un solo camino para el día de llegada.** «Sí, adaptarlos», rehacer el viaje y rehacer un día dan lo mismo: el día de llegada de las franjas F0 a F7. Nunca recortar el día normal. **«Sí, adaptarlos» puede pasar el día grande al día 2** (cambia la regla de la 10S7b).
2. **Con la llegada a media mañana o más tarde, se cae el último día.** Su parte ligera va en el día de llegada y lo grande vuelve si se reserva.
3. **El día del Free Tour** (Vaticano por la tarde) se queda como excepción: el Free Tour tiene hora fija por la mañana.
4. **Los viajes con un solo día entero** (2 noches con llegada tarde) pueden llevar dos grandes ese día: excepción.
5. **La Basílica de San Pedro sola NO es grande.** Los grandes son Coliseo y Foro, Museos Vaticanos y Galería Borghese.
6. **La regla vieja del 21-oct** («llegando a la hora de comer, Galería Borghese por la tarde») queda anulada por la nueva.
7. **El día de vuelta,** con la cuenta del apartado 5.4: una sola para el motor y para la tarjeta, sin grandes por dentro y con paradas ligeras cerca hasta la hora de irte. **Con el vuelo desde las 19:00, cuenta como día entero** y puede llevar un grande por la mañana.
8. **Sin pase, la tarjeta de llegada informa,** sin mover nada: «Con tu vuelo estarás libre hacia las 17:30».
9. **Arregla también:** con llegada de noche, el Coliseo a las 23:10 cuando el texto promete Trevi.
10. **Los trayectos por zona** de la tabla 5.1 son estimados: compruébalos y dime cuáles cambias.

**La prueba nueva `pruebaTandaLL_ROMA`:**
- llegadas a las 9:00, 11:30, 14:30, 17:00 y 20:00, en Fiumicino y en Ciampino, en verano y en invierno, empezando en martes y en jueves;
- los tres caminos dan lo mismo;
- ningún día de llegada vacío;
- ningún grande el día de llegada ni el de vuelta, salvo las excepciones;
- la vuelta.

Las pruebas de llegadas que cambien, puestas al día con «antes → ahora → decisión de Eric». La muestra de 60 fechas cambia a propósito: dime qué cambia y guarda la huella nueva. En el REPASO, capturas de móvil del día de llegada en las cinco horas y del día de vuelta. Y tu lista de comprobación de esta parte.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
