# Para Code · Tanda 6c: cambios del documento y sugerencias de HOY

Empieza cuando acabes la 6b. `DIAS_ROMA_PARADAS.md` ha cambiado otra vez: pásalo por el convertidor y no lo toques.

## Cómo trabajar

- **Nada de parches.**
- `PROGRESO_TANDA6C.md` con una línea por bloque, y TERMINADO al final.
- Al acabar, `INFORME_TANDA6C.md` en palabras sencillas.
- **Commits locales por bloques. No hagas push.**

## 1. Lo nuevo en los días

- **D6:** la Columna y los Mercados de Trajano (~1 h), entre Piazza Venezia y la terraza del Altar.
- **D7:** la mañana empieza en Campo de' Fiori, con su mercado, y la Plaza Farnese. Después se cruza el Ponte Sisto a la Farnesina. **El domingo** no hay mercado: Campo de' Fiori va de camino.
- **D1:** «Si te sobra tiempo» antes de comer: la Columna y los Mercados de Trajano, si el viaje no lleva el D6.
- **Ya no queda ningún «el día empieza más tarde»:** en el miércoles del D0-medio, el lunes del D4 y el miércoles del D6. El D6 en miércoles empieza a su hora, con Navona, el Panteón de camino, los Coronari, el Puente y el Castillo antes de la Cúpula.

## 2. Las sugerencias de «Vas bien de tiempo» (regla 15)

- **De todo el destino**, no solo de los días del viaje. Los sitios de los días de 5, 6 y 7 días valen como sugerencia en los viajes de 3 y 4 días.
- **Solo se excluye** lo que sale en otro día de su viaje, o va con «Lo tienes el día {n}».
- **Distancia según el tiempo que sobra:**
  - en mitad de una franja, 5–10 min andando, sin zigzag;
  - justo antes de comer o cenar, con 1 h 30 o más de sobra, hasta 15–20 min andando o 15 min en bus o metro.
- **Si la zona tiene restaurante:** la comida o la cena se cambia a esa zona, con las reglas de restaurantes (de verdad, abierto, sin repetir). Ejemplo: «Vas bien de tiempo. ¿Subes a la Plaza del Quirinal y bajas a Monti? Y cenas en Monti».
- **Siempre abierto** a la hora a la que llegaría, con tiempo de verlo.
- **Prueba:** en los viajes de 3 y 4 días, al acabar la tarde del D4 y del D1 con tiempo de sobra, enseña en el informe qué sugerencias salen.

## 3. Lo que he visto en la 6b (revisado en `VIAJES_LISTAS.html`)

La 6b está bien: el D2 con los Museos a las 14:00 sale como quería, el D0 se llena (acaba hacia las 19:05) y los cierres a la hora de llegada funcionan. Quedan estas cosas:

1. **La regla 6 no se cumple** (antes de quitar, se acorta).
   - **Lo que pasa:** viaje de 3 días con el Coliseo a las 12:00, D1. Pasa la Plaza del Campidoglio a «Si te sobra tiempo» para comer antes de las 14:30. Además, entre el Foro (acaba hacia las 10:40) y la «Llegada a…» de las 11:30 quedan 50 min sin nada.
   - **La regla:** primero **se acorta lo de menos de la mañana**: el Altar por dentro pasa a por fuera (~30) o a de camino. Solo después se quita.
   - **Cómo tiene que quedar:** Arco y Foro, «Llegada a…», Coliseo a las 12:00; después, los Fori Imperiali, el Campidoglio y el Altar por fuera, y la comida en el Gueto hacia las 14:20.
   - **Prueba:** 0 paradas en «Si te sobra tiempo» por la comida mientras quede en esa mañana algo por dentro que se pueda pasar a por fuera.
2. **San Luigi dei Francesi, aviso contradictorio.** Sale hacia las 17:20 con «Hoy ya ha cerrado. Cierra a las 18:15: entra antes», y en el registro pone que llega a las 17:57.
   - La hora que se enseña y la que se usa para los cierres tienen que ser **la misma**.
   - Una parada nunca lleva dos avisos que se contradicen.
   - Revisa el horario de San Luigi en `roma.json`.
3. **Sitios poco conocidos de relleno.** Para llenar mañanas y para las sugerencias, **solo** sitios que salen en algún día escrito del documento o que son de nivel 1 o 2. Nunca sitios poco conocidos como el **Colle Oppio**.
4. **La tarjeta de descanso no sale en la página.** El D5 acaba hacia las 17:00 y se cena a las 20:00, pero no aparece. Sácala en `VIAJES_LISTAS.html`, y también un ejemplo de «Vas bien de tiempo» con sus sugerencias.
5. **El viaje «con lluvia» de la página no aplica la alternativa:** en la lista siguen el Janículo y la Isla Tiberina. Aplícala en ese viaje, como dice su título.
6. **Galería Borghese sin reserva:** que diga **«Turno recomendado: 11:00»**, no en negrita como una reserva (tu pregunta 10).
7. **Free Tour de mañana + Museos a las 14:00 el mismo día:** al meter la reserva, avisa: «El Free Tour y los Museos a las 14:00 el mismo día no caben bien. ¿Pasamos los Museos a otro día?». Y si sí, se cambia de día.
8. **Tercer restaurante en el Gueto:** añade **Piperno** (Via Monte de' Cenci 9) como tercera opción de la comida del Gueto, con su horario de su web. Si no lo encuentras, apúntalo y lo busco yo.
9. **D4:** la Piazza del Popolo pasa a ~30 por la tarde (el obelisco y las iglesias gemelas). Así se llega a Santa Maria del Popolo cuando abre, a las 16:00, y no hay que verla por fuera.

## 4. Respuestas a PREGUNTAS_TANDA6B.md

Todo lo que no sale aquí, vale como lo hiciste.

- **1:** vale (15 min entre paradas, 30 como máximo de la hora fija).
- **6:** vale, el Foro va después del Arco.
- **7:** el documento ya no dice «el día empieza más tarde» en ningún sitio (punto 1).
- **10:** «Turno recomendado» (punto 3.6).
- **19:** vale. Repaso yo las frases de `noche_frases`.
- **Sitios sin foto:** Via del Babuino y Via Veneto van de camino y no llevan foto. La terraza de Largo Gaetana Agnesi usa la del Coliseo. El mirador de San Pietro in Montorio usa la del Janículo. El Colle Oppio sale (punto 3.3).

## 5. Pruebas

- La prueba entera.
- Regenera `VIAJES_LISTAS.html`.
- Reinicia el api-server.
