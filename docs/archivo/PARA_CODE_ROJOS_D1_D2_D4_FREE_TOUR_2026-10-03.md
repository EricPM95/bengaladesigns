# Lo que salió en rojo en D1, D2, D4 y el Free Tour

Aprobado por el usuario. Es la respuesta a tu informe de las partes A, B y C (commits 40aa45f y f03258d). Commit por parte y sin push.

- Después de cada parte, pasa la versión rápida de la prueba (una fecha por semana). Al final, pasa la completa.
- **Si algo no encaja, no lo arregles por tu cuenta:** dime qué, dónde y con qué fecha.

## A. Dos reglas generales (a INVARIANTES, todos los destinos)

1. **Una hora fija nunca se mueve ni se quita.** Esto vale para las entradas reservadas y para el Free Tour. Si no cabe todo, se recorta lo que va antes, en este orden:
   - primero salen las opcionales;
   - luego se encoge la elástica;
   - luego se acorta la comida, hasta los 30 min de la regla de la comida flexible.

   Si aun así no cabe, sale el aviso en la campana. La hora fija sigue donde estaba.
2. **Un mismo sitio, una vez al día.** La única excepción es la nocturna: un sitio visto por la mañana puede volver iluminado esa noche (Trevi a las 8:00 y Trevi iluminada a las 22:00).
   - Un atardecer no es una nocturna. Un mirador visto de día no vuelve al atardecer el mismo día.
   - Si un sitio sirve para el atardecer, va al atardecer. Si el atardecer no cuadra, va de día, y solo una vez.

## B. D4

3. **Terraza del Pincio:** con la regla 2, sale **solo una vez, al atardecer**. Si el atardecer no cuadra con la reserva, sale de día. Arréglalo en el orden 3 y en cualquier otro sitio donde salga dos veces.
4. **Verano (julio y agosto) con entrada a la Galería de 15:00 a 17:45:**
   - la regla de «nada al sol antes de las 16:30» es para el parque, no para la Galería, que es por dentro;
   - en esas fechas el orden es: comida, luego la Galería en las horas de calor, luego el Parque de Villa Borghese (con elástica) cuando baja el sol, y por último los Jardines y la Terraza del Pincio al atardecer;
   - la Galería, reservada, nunca se quita (regla 1).

   Ejemplo a comprobar: jueves 1 de julio, con entrada a las 15:00 y a las 16:00.

## C. D2

5. **Miércoles con entrada a los Museos de 13:00 a 14:00:**
   - la mañana es como la del orden 2 del miércoles: a las 9:00 el Puente Sant'Angelo, el Castillo por fuera y «Pasea y piérdete por Borgo Pio» (con elástica);
   - luego, comida rápida en Pizzarium (regla de la comida flexible);
   - los Museos a su hora;
   - **la Plaza y la Basílica de San Pedro, después de los Museos.** Comprueba en la web oficial la hora de cierre de la Basílica en cada temporada.

   Ejemplo a comprobar: miércoles 13 de enero.
6. **Lunes:**
   - el Castillo va siempre por fuera, así que **su cierre del lunes no cambia nada**. Que no cuente como cerrado ni deje hueco;
   - el Tempietto, si cierra, `si_cerrado: "quitar"`. Su tiempo va al paseo de la zona o a la parada que se estira: dime a cuál.
7. **Domingos:**
   - los Museos Vaticanos cierran los domingos, así que una entrada reservada en domingo no puede existir. Quita esos casos de la prueba;
   - el último domingo de cada mes hay entrada especial. Comprueba en la web oficial (museivaticani.va) si es gratis, a qué horas y si se puede reservar, y dime qué harías ese día. El ejemplo de tu informe, domingo 31 de enero de 2027, es último domingo.
8. **«Por fuera para llegar a todo» sube de 184 a 545, casi todo en D2.** Dime qué sitios salen ahora por fuera en D2 y por qué, con un ejemplo de cada uno.
   - **La Basílica de San Pedro no puede salir por fuera** en el día de los Vaticanos, salvo cuando esté cerrada. Si sale, márcalo en rojo.

## D. D1

9. **Sábados con el orden 2:** el Palazzo Doria Pamphilj es de «si entra». Comprueba su horario de sábado en su web oficial. Si cae después de su cierre, se quita sin aviso y su tiempo va a la parada que se estira.

   Ejemplo a comprobar: sábado 29 de mayo, con entrada a las 15:30.
10. **Coliseo desde las 15:30, con huecos de más de una hora** (por ejemplo, 65 min con el Coliseo a las 15:30):
    - la comida en Monti se alarga (regla de la comida flexible);
    - añade «Pasea y piérdete por Monti», con elástica, para el rato que quede. Es un paseo, no una parada de calle (las calles solo son parada si son icónicas). Va una vez por viaje;
    - dime en qué otros casos sigue quedando hueco.

## E. El Free Tour añadido después

11. **El tour se clasifica por su hora, no por su nombre:**
    - si empieza antes de las 13:00, es de mañana y sustituye la mañana del centro;
    - si empieza entre las 13:00 y las 18:59, es de tarde y sustituye la tarde del centro barroco (Piazza Navona, San Ignacio…), con el Panteón por dentro justo antes;
    - si empieza a las 19:00 o más tarde, es de noche y sustituye la nocturna de ese día.

    Así, el tour «de noche» de invierno, que sale hacia las 16:30, cuenta como tour de tarde. Comprueba también que salen bien las fechas del cambio de hora y las de frontera.
12. **La hora del tour no se mueve nunca (regla 1).** Lo que va antes se recorta. Esto vale sobre todo para el tour de las 16:00, que hoy cabe solo en el 11,8 % de los casos.
13. **Días de enero sin tour** (por ejemplo, el sábado 2 de enero): dime por qué ningún día del viaje trae el tour de esa franja.
14. **Mide de nuevo** cuánto cabe en viajes de 3, 4 y 5 días, a cada hora del tour (10:00, 16:00, 17:00 y el de noche según la hora real de cada mes), y compáralo con tu tabla de antes.

## Informe

1. **En rojo, arriba:**
   - cualquier fallo: hora fija rota o movida, sitio cerrado, o imprescindible quitado sin aviso. **La hora fija rota tiene que bajar a 0;** si no llega, dime cuántos casos quedan y por qué;
   - la Basílica de San Pedro por fuera en un día de Vaticanos (punto 8).
2. La misma tabla de % que cabe, por día y franja, antes y ahora.
3. La tabla del Free Tour, antes y ahora.
4. Lo que me pides en los puntos 6, 7, 8, 10 y 13.
5. Los huecos de más de 30 min que queden (sin contar el margen de antes de una entrada).

Explícalo en español sencillo, sin jerga.
