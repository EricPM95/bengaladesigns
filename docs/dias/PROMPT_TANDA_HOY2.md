Hola. TANDA HOY2: EL NUEVO HOY, PARTE 2 · HOY COMPLETA Y «CAMBIAR PLAN» (5-nov). Va después del mensaje de dudas de la LG1 (fotos y colores; las 365 fechas, después del viaje): si estás con ello, acábalo con su push. Detrás vienen la HOY2b y la HOY3. Eric usa HOY en Lanzarote desde el domingo 8: las tres subidas el VIERNES 6 por la noche como tarde. Si no llega todo, sube lo que funcione (0 fallos) en el orden de abajo y dime lo que falta. Este prompt acaba con «reinicia el api-server»: si no te llega, dímelo antes de empezar.

- **Design:** el zip `HOY_COMPLETO.zip` (Descargas o carpeta del proyecto). Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`. Las páginas:
  - **`Piezas/Hoy Completa.dc.html`:** HOY entera en 10 momentos, con el orden de los bloques. Es la guía de cómo se ve HOY.
  - **`Piezas/Hoy Recorrido.dc.html`:** cada pantalla; esta tanda, la 22 a la 32b.
  - El diseño, igual; los textos y los datos, los nuestros.
- **Donde Design no cuadra, manda esto:**
  - **«Ya estás aquí»** lleva todos los botones de la H3 (pantalla 9 del recorrido), no solo los 3 de la Completa 3.
  - **«Por llegar»** lleva lo de la LG1: [Escuchar historia], [Tu entrada] y la línea [Ya he llegado].
  - **Fuera los minutos** en «Voy con retraso» («Vas 25 min por detrás»; ver apartado 2).
  - **Las pantallas que aún llevan el mapa pequeño** (6, 7, 25, 31): con la foto, como en la Completa.
- **Como siempre:** HOY en el viaje es del pase (y del día de prueba). Roma y Lanzarote (oculto). 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_hoy2.md` a la rama `estado` cada 30 min. No apagues el PC.
- **Reglas:**
  - **Nada se mueve solo:** todo cambio es una propuesta con vista previa y [Deshacer]. Reservas y turnos, nunca. Siempre **el cambio más pequeño**.
  - **Prioridad para absorber un retraso:** primero lo opcional (opcionales de Lanzarote y «Si te sobra tiempo»), luego lo flexible (nivel 3), luego lo principal (resto de nivel 2); lo imprescindible (imprescindibles, joyas, atardecer del día), solo preguntando; lo fijo (reserva o turno), nunca.

## 1. HOY completa (Completa 1 a 10)
- **El orden de los bloques, de arriba abajo, en todos los momentos:**
  1. la cabecera;
  2. los avisos del momento;
  3. la tarjeta principal;
  4. [¿Qué hago ahora?] (lo hace la HOY2b; aquí solo su sitio);
  5. «Cerca de ti»;
  6. «Tu día»;
  7. «Si te sobra tiempo».
- **Los avisos de arriba, por urgencia:**
  1. lo que corre peligro ya (una entrada o un turno; llegar cerrado, de la HOY2b);
  2. el tiempo (lluvia, nubes, viento, «ha parado de llover»);
  3. la tarjeta tranquila de la mañana con los horarios (HOY2b);
  4. «Añade JUTRIP a tu pantalla de inicio» (HOY3).
  - Como mucho 2 a la vista; el resto, plegado en «1 aviso más».
  - «Sin conexión» es solo una línea fina, siempre encima.
  - **TODOS los avisos de HOY llevan su X (Eric).** El que se cierra no vuelve ese día, salvo que pase algo nuevo (otra entrada en peligro, otro aviso del tiempo).
- **Aire entre bloques**, como en Design: que nada parezca pegado.
- **«Tu día» SIN HORAS** (la ruta va por franjas desde el 6-oct; las horas de la HOY1 fueron un error del prompt):
  - por Mañana · Tarde · Noche, como en DÍAS, también en la comida y la cena;
  - solo llevan hora las reservas y los turnos (✓ 11:30), el vuelo y el atardecer;
  - «Sal de casa a las…» y «Sal ahora para tu turno» se quedan.
- **«Por llegar» sin mapa:** fuera `MapaDeLlegada`. Arriba, la foto del lugar (`FotoDeLaParada`) con la etiqueta «Por llegar»; sin foto, el fondo de color.
- **El día acabado (7):** «Hasta aquí, hoy» y la tarjeta oscura «Mañana, miércoles 11 · La Graciosa». Solo cuando no quedan paradas hoy.
- **El día de llegada (8):** «Bienvenido a Lanzarote», con el vuelo, recoger el coche, «Empiezas hacia las 11:25» (la hora útil de la LL) y [Cómo llegar al coche de alquiler] (en Roma, sin coche). Sustituye a las viejas 3b y 3c del apartado 01.
- **El último día (9):** con los datos de la LL; [Cómo llegar al aeropuerto].
- **Sin pase: NO la Completa 10 (fue un error mío pedirla).** Durante el viaje, sin pase (y fuera del día de prueba), HOY no enseña su pantalla con candados: enseña `HoySinPase`, como ahora, con todo lo que trae HOY y la invitación al pase. La cámara de la cabecera sigue con su candado.
  - Pon al día su lista con lo que HOY hace ahora:
    - tu día paso a paso: cuándo salir, cómo llegar, «Ya estás aquí»;
    - «Cambiar plan», sin mover nada sin tu permiso;
    - los avisos del tiempo con su alternativa;
    - «Cerca de ti»;
    - la cámara y los logros;
    - las historias para escuchar;
    - tus entradas sin internet;
    - los avisos en el móvil bloqueado.
  - El día de prueba, HOY entero y sin un solo candado (mira `CercaDeTiFila conPase={pagoActivo()}`).

## 2. [Cambiar plan] (22) y Voy con retraso (23)
- **[Cambiar plan] sustituye a [No me da tiempo].** La hoja tiene 5 opciones: Voy con retraso · Quiero comer ahora · Saltarme esta parada · Pasar a otro día · Añadir un sitio cercano.
- **Voy con retraso:**
  - por dentro, la hora de ahora contra la prevista del motor; al viajero, sin minutos: «Vas con algo de retraso. Buscamos el ajuste más pequeño para que no te pierdas lo importante.»;
  - la propuesta: recortar lo flexible y quitar lo opcional; si no basta, pasar algo a mañana o a «Si te sobra tiempo»;
  - [Ver otra opción]: la siguiente propuesta. «Volver a mi ruta original» deshace todo lo de hoy.

## 3. Quiero comer ahora (24) y la comida (Completa 4)
- **La hoja con mapa:** los restaurantes **abiertos ahora** más cercanos (los nuestros y «Cerca de ti › Comer»), con [Ir aquí]. Al elegir uno, la comida pasa a ahora y el resto se recoloca (propuesta).
- **A la hora de comer:** «Tu restaurante está a 6 minutos» [Cómo llegar] [Cambiar] (este abre la misma hoja).

## 4. Saltar, pasar a otro día y añadir (25 a 27b)
- **Saltar:** como en la HOY1, con «Parada saltada · Deshacer».
- **Pasar a otro día:** se elige en la hoja de días de siempre y sale uno de tres casos (26a, 26b, 26c): cabe sin tocar nada, cabe quitando algo flexible, o no cabe y queda al final de ese día en «Si te sobra tiempo».
- **Añadir un sitio cercano:**
  - salen los sitios fuera de tu ruta (EXPLORAR y «Cerca de ti»; los de logro, primero);
  - después, «encaja» (27a) o «hay que mover algo» (27b).

## 5. Peligro y lluvia (28 a 32b)
- **«¿Qué hacemos con…?» (28):** si te alejas de una parada sin marcarla, pregunta una vez: [Ya lo visité] / [Lo dejo pendiente] / [Ahora no].
- **«Tu entrada… corre peligro» (29):** si a tu ritmo no llegas a una reserva o turno, aviso arriba con [Ver solución] → «Una solución» (29b).
- **La lluvia (32, 32b):** el aviso con [Ver alternativa] → «Plan de lluvia» (32), y al parar de llover, «¿Volvemos al plan?» (32b).

**Todas las propuestas,** con el formato de la 23: Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original».

## 6. Después de cambiar, la ficha y lo que sobra
- **«Plan actualizado · Deshacer» (30)** tras cada cambio.
- **Tocar la tarjeta abre la ficha COMPLETA** del sitio, la de DÍAS (Qué vas a ver, Dónde aparcar, Tips, Logros), no «Sobre este lugar».
- **«Si te sobra tiempo», abajo del todo:**
  - la misma lista de DÍAS, plegada, solo si hay algo;
  - lo saltado y lo quitado, cada uno con [Recuperar] y [Pasar a otro día];
  - donde Design dice «Pendientes», en la app «Si te sobra tiempo».

## 7. La prueba
- `pruebaJutrip`, `pruebaTandaHOY1`, `pruebaTandaLG1`, `pruebaTandaLL_LZ` y `LL_ROMA` en 0; las que cambien, con «antes → ahora → decisión de Eric».
- **Nueva `pruebaTandaHOY2`:**
  - el orden de los bloques;
  - «Tu día» sin horas salvo lo fijo;
  - «Por llegar» con foto;
  - el día acabado, el de llegada y el último;
  - sin pase, `HoySinPase` con la lista nueva; el día de prueba, sin candados;
  - la X en todos los avisos;
  - cada opción de «Cambiar plan»;
  - retraso de 15, 30 y 60 min sin mover reservas ni turnos, y quitando lo opcional antes que lo imprescindible;
  - comer solo en abiertos;
  - pasar a otro día en sus 3 casos y añadir en sus 2;
  - la parada no marcada, una vez;
  - la entrada en peligro;
  - la lluvia;
  - [Deshacer] y «Volver a mi ruta original» dejan el día como estaba;
  - sin textos de Roma en Lanzarote.
- **En el REPASO,** capturas de móvil **de la pantalla ENTERA (todo el scroll)** de los 10 momentos de la Completa, en el viaje de Eric en Lanzarote (domingo 8 y martes 10), y de las pantallas 22 a 32b. Y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
