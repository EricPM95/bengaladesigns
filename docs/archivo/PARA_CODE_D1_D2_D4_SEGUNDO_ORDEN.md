# D1, D2 y D4: el segundo orden para las entradas tarde, y los huecos

Lo ha escrito Claude con el usuario. Tú lo conviertes al formato de los días escritos (DIAS_ESCRITOS_FORMATO.md) y lo pasas por las pruebas. Commit por día, sin push.

**Si algo no cabe o choca con un horario, no lo arregles por tu cuenta:** dime qué, dónde y con qué fecha, y lo reescribo yo.

## Regla nueva (a INVARIANTES, todos los destinos)

> **El viajero manda.** Si su reserva coincide con el atardecer, la nocturna o cualquier otra cosa del día, ese día va sin ello, sin forzarlo y sin aviso. La ruta se adapta a sus horas, no al revés.

En las pruebas, un atardecer que no cabe **por la hora de una reserva** no cuenta como fallo.

## Cómo se elige la versión

Cada uno de estos días tiene su orden de siempre y uno o dos órdenes nuevos, según la hora de la entrada reservada. Guárdalos como variantes nuevas (por ejemplo, `entrada:mediodia` y `entrada:tarde`), con las franjas como dato del día. El motor las usará cuando lleguen las reservas (encargo del motor). Hasta entonces, mídelas en la prueba de las 365 fechas como si hubiera una reserva en cada franja.

- Las horas de entrada, siempre **30 min antes** (llegar antes).
- Las cuatro versiones de luz (A, B, C, D) y las variantes de día de la semana siguen funcionando igual que ahora.

---

## D2 · Vaticano

Los Museos Vaticanos abren de lunes a sábado, de 8:00 a 20:00, con última entrada a las 18:00. Los domingos solo abren el último de cada mes, de 9:00 a 14:00. La Basílica abre de 7:00 a 20:00 y la Cúpula desde las 7:30. A primera hora, la Plaza y la Basílica están casi vacías.

### Orden 1 · entrada de 8:00 a 11:00

El de ahora, con los huecos tapados (más abajo).

### Orden 2 · entrada de 11:30 a 12:30

**Mañana** (empieza 7:30):
1. Plaza de San Pedro, 20 min.
2. Basílica de San Pedro, dentro, 60 min.
3. Cúpula de San Pedro, dentro, 45 min, **opcional**.
4. Pasea y piérdete por Borgo Pio, con **elástica**: absorbe hasta la hora de llegar a la entrada.
5. Museos Vaticanos y Capilla Sixtina, **fija** (la hora de la reserva), 180 min.

**Comida** al salir, cerca: Pizzarium (Bonci) o Borghiciana Pastificio Artigianale. Puede ser tarde, a las 15:00 o 15:30, y no pasa nada: la hora la eligió el viajero.

**Tarde:**
- **A (invierno):** Via della Conciliazione (camino) → Puente Sant'Angelo **al atardecer**, con el Castillo de Sant'Angelo (por fuera) → Iglesia de Santa Maria in Trastevere (dentro) → Trastevere (cena).
- **B, C y D:** las de ahora, con los huecos tapados.

### Orden 3 · entrada de 13:00 a 14:00

**Mañana** (empieza 7:30):
1. Plaza de San Pedro, 20 min.
2. Basílica de San Pedro, dentro, 60 min.
3. Cúpula de San Pedro, dentro, 45 min, **opcional**.
4. Via della Conciliazione (camino).
5. Puente Sant'Angelo, 10 min.
6. Castillo de Sant'Angelo, por fuera, 20 min.
7. Pasea y piérdete por Borgo Pio, con **elástica**.

**Comida** antes de la entrada: Borghiciana Pastificio Artigianale (alternativa: 200 Gradi).

**Tarde:**
1. Museos Vaticanos y Capilla Sixtina, **fija**, 180 min.
2. Después, según la luz:
   - **A:** sin atardecer, porque sales de noche. Santa Maria in Trastevere → Trastevere (cena).
   - **B:** Mirador del Janículo al atardecer, subiendo en bus (el 115 o el 870, como en la variante del miércoles). El Tempietto, por fuera. Después, Santa Maria in Trastevere y Trastevere (cena).
   - **C y D:** San Pietro in Montorio y Tempietto de Bramante (por fuera si ya ha cerrado) → Fontana dell'Acqua Paola → Mirador del Janículo al atardecer → Santa Maria in Trastevere → Trastevere (cena).

### Orden 4 · entrada de 14:30 a 18:00

La Plaza, la Basílica y la Cúpula, a primera hora; el Janículo y Trastevere, de día; los Museos, por la tarde; y la cena, en el Borgo.

**Mañana** (empieza 7:30):
1. Plaza de San Pedro, 20 min.
2. Basílica de San Pedro, dentro, 60 min.
3. Cúpula de San Pedro, dentro, 45 min (aquí no es opcional: hay tiempo).
4. Via della Conciliazione (camino).
5. Puente Sant'Angelo, 10 min.
6. Castillo de Sant'Angelo, por fuera, 20 min.
7. Ponte Sisto y Plaza Trilussa (vecinos, en ese orden), 15 min.
8. Iglesia de Santa Maria in Trastevere, dentro, 20 min.
9. San Pietro in Montorio y Tempietto de Bramante, dentro (abre a las 10:00), 20 min.
10. Fontana dell'Acqua Paola, 10 min.
11. Mirador del Janículo, con la luz de la mañana, 20 min.

**Comida** en Trastevere: Tonnarello o Trattoria Da Enzo al 29. **Elástica** antes de la entrada. Después, bajada en bus o andando a la entrada de los Museos (unos 30 min).

**Tarde:**
1. Museos Vaticanos y Capilla Sixtina, **fija**, hasta el cierre como mucho (20:00).
2. **Atardecer:** solo en **D**, si sales antes de la puesta: el Puente Sant'Angelo al atardecer. En A, B y C no hay atardecer (el viajero manda).
3. **Cena** en el Borgo o en Prati: L'Arcangelo (alternativa: Tonnarello).
4. **Noche:** el Castillo y el Puente iluminados (`centro_iluminado`, como en D2 D de ahora).

### Días de la semana

- **Miércoles (audiencia):** la Plaza y la Basílica no abren a los turistas hasta las 12:30.
  - **Orden 2:** la Plaza y la Basílica, después de los Museos y de la comida. La Cúpula, ese día, no.
  - **Orden 3:** por la mañana, el Puente, el Castillo y el Borgo. La Plaza y la Basílica, a las 12:30, antes de comer.
  - **Orden 4:** la mañana empieza por el Puente y el Castillo y sigue con Trastevere y el Janículo. La Plaza y la Basílica, después de comer y antes de los Museos, solo si la entrada es a las 15:30 o más tarde. Si no, quedan fuera ese día.
- **Domingo:** solo el último del mes, con última entrada a las 12:30. Así que solo cabe el orden 2.
- **Lunes:** el Tempietto cierra, así que va por fuera.

### Los huecos de D2 que ha medido Code

- **B y C (Fontana dell'Acqua Paola → Janículo, hasta 134 min).** El problema es la espera hasta el atardecer. Se sube por Trastevere y se cena al bajar: **Trastevere una sola vez**, pero de camino.
  - El nuevo orden: Via della Conciliazione → Puente Sant'Angelo → Castillo de Sant'Angelo por fuera → Ponte Sisto y Plaza Trilussa → Iglesia de Santa Maria in Trastevere → Tempietto → Fontana dell'Acqua Paola → Mirador del Janículo (atardecer, con **elástica de 30**) → bajar a cenar a Trastevere.
- **D (Conciliazione → Puente, hasta 103 min).** El nuevo orden: Tempietto → Fontana dell'Acqua Paola → Mirador del Janículo → bajada por Santa Maria in Trastevere → Pasea y piérdete por Trastevere (**elástica**) → Ponte Sisto → Castillo de Sant'Angelo por fuera → Puente Sant'Angelo al atardecer → cena en el Borgo (L'Arcangelo).
- **A (comida → Borgo Pio, hasta 57 min):** que el paseo de Borgo Pio absorba más, con su elástica.

---

## D1 · Coliseo

El Coliseo abre a las 8:30. Su última entrada cambia por temporada: 15:30 en invierno y otoño, 16:00 en primavera y 18:15 en verano. El Foro y el Palatino abren a las 9:00, con la misma última entrada. **La entrada vale para el Foro y el Palatino el mismo día, antes o después del Coliseo.**

### Orden 1 · Coliseo primero, entrada de 8:30 a 15:00

El de ahora. Arregla el caso de Santa Maria sopra Minerva los sábados (sale a las 19:05 y cierra a las 19:00).

### Orden 2 · Foro primero, entrada desde las 15:30 (propuesta del usuario)

La Roma antigua, por la mañana, sin el Coliseo. El Coliseo, a su hora. Y el centro barroco, después, hacia la cena.

**Mañana** (empieza 8:30):
1. Plaza del Campidoglio, 15 min (si entra).
2. Plaza Venecia (camino).
3. Altar de la Patria, dentro, 40 min (abre a las 9:30).
4. Foro Romano y Palatino, dentro, 100 min (abre a las 9:00). Va con la misma entrada: vale el mismo día, antes o después del Coliseo.
5. Si sobra tiempo antes de comer: Boca de la Verdad o Circo Máximo, como paradas «si entra», y si no, Via dei Fori Imperiali de camino.

**Comida** en Monti: Trattoria Monti (alternativa: La Taverna dei Fori Imperiali).

**Tarde:**
1. Coliseo, **fijo** (la hora de la reserva), 75 min como mucho.
2. Arco de Constantino, 20 min.
3. Panteón, dentro, 30 min. Abre hasta las 19:00 (sábados, hasta las 16:00: ver abajo).
4. Elefantino de Bernini (camino) e Iglesia de Santa Maria sopra Minerva (dentro hasta las 19:00; si no, por fuera).
5. Piazza Navona: **al atardecer** si cuadra (B, C, D). En A, el sol se pone mientras estás en el Coliseo: no hay atardecer, y Navona va ya de noche.
6. **Cena** en el centro, como ahora (`centro_historico`).
7. **Noche:** la de ahora (`fuentes`, con Trevi iluminada).

Lo que no quepa del centro barroco (San Luigi dei Francesi, Barrio Judío, Campo de' Fiori, Largo di Torre Argentina…) se queda fuera ese día, sin aviso. No son joyas, y casi todos salen en otros días del viaje. El Panteón no puede faltar: si no cabe por dentro, por fuera, y su visita pasa a la noche.

**Invierno:** la última entrada al Coliseo es a las 15:30, así que con este orden la entrada será de 15:30 como mucho.

### Días de la semana

- **Sábado:** el Panteón, solo hasta las 16:00 (misa a las 17:00). En el orden 2, el Panteón va por la mañana, después del Foro y antes de comer, y por la tarde, después del Coliseo, se va directo a Navona.
- **Domingo:** misa en el Panteón a las 10:30 y venta cortada desde las 9:30. En el orden 2 va por la tarde, así que no afecta.
- **Primer domingo del mes:** entrada gratis al Coliseo y mucha gente. Usa las reglas de ahora.

---

## D4 · Galería Borghese

La Galería abre de martes a domingo, de 9:00 a 19:00. Las entradas son a las horas en punto, con visita de 2 h (1 h 15 en el turno de las 17:45). Cierra los lunes.

Santa Maria del Popolo abre de 8:30 a 9:45, de 10:30 a 12:00 y de 16:00 a 18:00 (el domingo, de 16:30 a 18:00). El Ara Pacis, de 9:30 a 19:30.

### Orden 1 · entrada de 9:00 a 11:00

El de ahora.

### Orden 2 · entrada de 12:00 a 14:00

**Mañana** (empieza 8:30):
1. Fontana de Trevi, **fija**, 8:30, 25 min.
2. Desayuno romano, 20 min, opcional.
3. Via Condotti, 10 min (la calle lleva a la escalinata).
4. Plaza de España, 20 min.
5. Trinità dei Monti, dentro, 10 min (abre a las 10:15; si no, por fuera).
6. Parque de Villa Borghese, de camino a la Galería por Piazza di Siena, con **elástica**.
7. Galería Borghese, **fija**, 120 min.

**Comida** en el Tridente: Edy (alternativa: Poldo e Gianna Osteria).

**Tarde:**
1. Parque de Villa Borghese: el lago y el Templo de Esculapio, con **elástica**.
2. Jardines del Pincio, 20 min.
3. **Terraza del Pincio:** al atardecer en A, B y C. En D, de día.
4. Piazza del Popolo, 10 min.
5. Santa Maria del Popolo, dentro (de 16:00 a 18:00; si no, por fuera).
6. **Ara Pacis:** **opcional**. Solo en D, antes de la cena, si abre.
7. **Cena** en el Tridente y la **noche** en la escalinata, como ahora.

### Orden 3 · entrada de 15:00 a 17:45

**Mañana** (empieza 8:30):
1. Fontana de Trevi, **fija**, 8:30, 25 min.
2. Desayuno romano, 20 min, opcional.
3. Via Condotti, 10 min.
4. Plaza de España, 20 min.
5. Trinità dei Monti, dentro, 10 min (si no ha abierto, por fuera).
6. Pasea y piérdete por el Tridente, con **elástica**: una sola vez en el viaje, como dice la regla.
7. Piazza del Popolo, 10 min.
8. Santa Maria del Popolo, dentro, 25 min (de 10:30 a 12:00).
9. Ara Pacis, dentro, 45 min.

**Comida** en el Tridente: Edy (alternativa: Poldo e Gianna Osteria).

**Tarde:**
1. Jardines del Pincio, 20 min, subiendo desde Piazza del Popolo.
2. Terraza del Pincio, de día, 10 min. En A, el atardecer coincide con la Galería, así que no hay.
3. Parque de Villa Borghese: el lago y el Templo de Esculapio, con **elástica**.
4. Galería Borghese, **fija**.
5. **Al salir:** en B, C y D, la Terraza del Pincio al atardecer si llegas antes de la puesta (unos 15 min andando). Si no, sin atardecer.
6. **Cena** en el Tridente y la **noche** en la escalinata.

### Los huecos de D4 que ha medido Code

- **C y D (comida → Parque de Villa Borghese, hasta 108 min, sobre todo con el sol tarde en verano):** después de comer, Pasea y piérdete por el Tridente, con **elástica**, si no ha salido antes en el viaje. Si ya salió, el Ara Pacis, y lo que sobre va a la elástica del parque.

---

## Qué quiero en el informe

1. **En rojo, arriba:** cualquier fallo (hora fija rota, sitio cerrado, imprescindible quitado sin aviso). No cuenta como fallo un atardecer quitado por la hora de una reserva.
2. Con las versiones nuevas, el % que cabe el mismo día para el Coliseo, los Vaticanos y la Galería, en cada franja.
3. Los huecos de más de 30 min que queden en D1, D2 y D4.
4. Lo que no te encaje o no sepas cómo escribir: pregúntame antes de inventarlo.

Explícalo en español sencillo, sin jerga.
