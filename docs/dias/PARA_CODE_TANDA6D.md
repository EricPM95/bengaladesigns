# Para Code · Tanda 6d: horas de reserva escritas y sugerencias más finas

He revisado la 6c en `VIAJES_LISTAS.html` y en `INFORME_TANDA6C_SUGERENCIAS.md`. Está muy bien: la tarjeta de descanso sale en su sitio, la regla 6 ya acorta antes de quitar y San Luigi coincide. `DIAS_ROMA_PARADAS.md` ha cambiado: pásalo por el convertidor y no lo toques.

## Cómo trabajar

- **Nada de parches.**
- `PROGRESO_TANDA6D.md` con una línea por bloque, y TERMINADO al final.
- Al acabar, `INFORME_TANDA6D.md` en palabras sencillas.
- **Commits locales por bloques. No hagas push.**

## 1. Reservas a otra hora: ahora están escritas

Una reserva a otra hora ya no la resuelve el motor con la regla general: el documento trae el día escrito para cada franja de hora.

- **D2 · «Museos reservados por la tarde (a las 15:00 o más tarde)»:**
  - mañana: la Cúpula a primera hora (si el viaje no lleva el D6), la Basílica, la Plaza, el Castillo por dentro y el Puente;
  - comida sin prisas en Prati;
  - tarde: los Museos y, al salir, la Plaza iluminada;
  - cena en Trastevere.
  - **Por qué:** la Basílica cierra a las 18:30 o a las 19:00, y al salir de los Museos estaría cerrada.
- **D1 · «El Coliseo reservado a otra hora»:** media mañana (10:30–12:00), mediodía (12:30–15:00) y tarde (16:00 o más). Se permite el Foro **antes** del Arco y del Coliseo, porque es otra lista escrita, no un cambio de orden.
- **D2 · miércoles sin Museos:** empieza a su hora, con el Castillo, el Puente y el Lungotevere, y la Plaza y la Basílica desde las 12:30.
- **La regla general** (la regla 4) queda solo para las horas que no tienen lista escrita.

**En `VIAJES_LISTAS.html`** (esto ya te lo pedí en la 6c y no salió):
- el D2 con los Museos a las 9:00, 11:00, 14:00 y 16:00;
- el D1 con el Coliseo a las 9:00, 11:00, 12:00, 14:00 y 16:00.

Un viaje por cada hora.

## 2. Sugerencias de «Vas bien de tiempo»: tres arreglos

1. **No sugerir nada que ya salga en el viaje**, ni días antes ni días después, ni en la noche de ese mismo día. Ahora sale «Fontana de Trevi · Lo tienes el día 2» la tarde en que, después de cenar, se va a ver Trevi iluminada. Quita «Lo tienes el día {n}»: si sale en el viaje, no se sugiere.
2. **Lo lejano solo antes de cenar.** Antes de comer, solo lo que quede cerca de donde empieza la tarde. Si no, hay zigzag: en el D4 se sugiere Campo de' Fiori o los Mercados de Trajano antes de comer, y la tarde vuelve a empezar en la Piazza del Popolo.
3. **Si se cambia la cena de zona, la noche del día tiene que seguir cerca:** taxi de 15 min o menos, la regla de siempre. Si no, va la nocturna más cercana a la nueva cena que no haya salido.

Y revisa `tipo_local` de **Coming Out**: es un pub, no un restaurante para recomendar una cena.

## 3. Pequeños

- **Espera máxima de 20 min, no de 15.** En el D4, Santa Maria del Popolo (los Caravaggio) se pierde por 20 min de espera, y la espera es en la misma plaza.
- **El hueco antes de una reserva:** si antes de una «Llegada a…» sobran más de 30 min, HOY lo dice («Tienes 50 min antes de tu entrada») con sugerencias cercanas. En el D1 con el Coliseo a las 12:00, la primera es San Pietro in Vincoli.

## 4. Respuestas a PREGUNTAS_TANDA6C.md

Todo lo que no sale aquí, vale como lo hiciste.

- **4:** el documento ya dice ~30 en la Piazza del Popolo. Quita el ajuste aparte.
- **5:** cambia con el punto 1 (el miércoles del D2 ya está escrito).
- **7:** cambia con el punto 3 (HOY lo dice).
- **12:** «Trevi» como zona vale.
- **13:** cambia con el punto 2.1.
- **14:** Piperno vale. Las coordenadas aproximadas valen, porque está en Via Monte de' Cenci, al lado del Portico d'Ottavia.

## 5. Pruebas

- La prueba entera.
- Regenera `VIAJES_LISTAS.html` con los viajes del punto 1 y el ejemplo de HOY.
- Reinicia el api-server.
