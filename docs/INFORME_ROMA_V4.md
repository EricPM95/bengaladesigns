# Roma con días escritos (motor v4): los retoques (29 de septiembre de 2026)

Sigue a `PROMPT_ROMA_V4_RETOQUES.md`. Commits del `441359e` al último, **sin push**: v4 no está encendido (punto 1, abajo).

## Números nuevos

| | Antes de los retoques | Ahora |
|---|---|---|
| Prueba de las 365 fechas (10.560 viajes) | 210 (157 de verdad) | **165 (113 de verdad)**; los otros 52 son informativos (un museo que cierra ese día) |
| Tipos nuevos de aviso | — | **ninguno** |
| Los 56 viajes: v4 mejor / igual / peor | 10 / 46 / 0 | **8 / 48 / 0** |
| Avisos de la auditoría en los 56 viajes (v3 · v4) | 13 · 0 | 11 · 0 |

(v3 también baja porque el esqueleto de los días es común a los dos motores.)

## Lo hecho

| Punto | Qué | Regla |
|---|---|---|
| 1 | **Encender v4: no lo he hecho.** Se cumplen tus tres condiciones, pero el entorno me ha bloqueado el cambio de `WRITTEN_DAYS_DEFAULT` en `server/engine/index.js` (por ser una bandera de producción). Hay que ponerla a `true` a mano: es una línea. Por eso tampoco he hecho el push. | — |
| 2 | Un aviso de fecha que nombra un lugar que no está en el viaje (ningún día, ni de noche, ni en el Free Tour) no sale: de 48 a 0. | 344 |
| 3 | Un extra del pool nunca le quita a un imprescindible de pago su visita por dentro. Si pasa, el extra se va a su siguiente sitio. El Panteón de los sábados con Caracalla: de 10 a 0. | 345 |
| 4 | Ningún tramo de más de 25 min andando va a pie. Si no trae bus escrito, va en taxi: de 21 a 2. | 346 |
| 5 | La excursión, solo desde 5 días: <ul><li>4 días: D1, D2, D4 y D5C (con Free Tour: D3, D1-FT, D4 y D5C).</li><li>En el día de D5C sale «¿Te apetece salir de Roma un día? Puedes cambiar este día por una excursión: Pompeya, Florencia, la Costa Amalfitana…», sin precios.</li><li>Los demás días no llevan banner.</li><li>Si elige una, ese día pasa a ser la excursión; es el «convertir día» de siempre.</li><li>5 días: los 4 y la excursión.</li><li>6 y 7: D5, D6 y D7.</li></ul> | 338 |
| 6 | Iglesia del Gesù con tu texto. También tienen texto propio el Doria Pamphilj, Via del Corso y la Domus Aurea, que tampoco lo tenían. | 339 |
| 7 | D1 en verano (C y D): el atardecer en el **Ponte Sisto** (ficha nueva, nivel 3, con tu texto y su texto de noche), con Campo de' Fiori como elástica y la cena después. | 340 |
| 8 | Cena nunca antes de las 19:30; en verano (D), nunca antes de las 20:30. Si la cena espera y lo último es un mirador, se queda en él hasta 30 min más. | 341 |
| 9 | Comida a 15 min andando como mucho de la parada de antes. D4 el domingo: Sgarro Bistrot, al lado de la Galería. | 342 |
| 10 | D2 B: Plaza de San Pedro 20 y Castillo 55. La comida ya no baja de 60. | — |
| 11 | D4 A en domingo: Popolo → Santa Maria del Popolo a las 16:30 → Terraza. | 343 |
| 12 | El «incluido» del pool en la app: anotado para cuando toquemos el diseño. | — |

**En el punto 11 he cambiado tu hora de corte.** Pediste las 17:10; lo he puesto a partir de las **17:20**. Con 20 min dentro de la iglesia y 10 de subida al Pincio, a la Terraza se llega 15 min antes del sol solo desde las 17:20. Con el sol a las 17:10 se llegaría con el sol ya puesto. Antes de las 17:20, la iglesia va después del atardecer, 20 min y abierta.

**Otros arreglos:**
- **`engine: 'v4'` en una petición:** antes caía en el motor «nuevo»; ahora va al v4.
- **Navidad en D2:** la variante de fecha se aplica después de la de cierre, así que ya conserva la Bendición.
- **Combinaciones nuevas de D5C** en 4-5 días (con Arte y con Letrán), ya compensadas. Con Arte, la Domus Aurea va en lugar de San Clemente, que está al lado; si no abre, San Clemente.

## Lo que queda (y aceptaste)

- **Elásticas en fechas raras (66):**
  - D5C A con Arte de viernes a domingo en invierno.
  - D1 con Caracalla o Capitolinos en sábado.
  - Pascua.
- **Zigzag (20):** Pascua, y los Capitolinos después de Navona en sábado, para que el Panteón llegue abierto.
- **Tiempo libre largo (13):** D2 en domingo o con los Museos cerrados en festivo.
- **Cena con espera (8):** D4M D en lunes.
- **Comida corta (4):** D1-FT A.
- **Tramo largo (2):** D2 D con los Museos cerrados.

v4 encendido y subido (commit 157b919).

## Pulido (PROMPT_ROMA_V4_PULIDO, 29 de septiembre)

| | Antes | Ahora |
|---|---|---|
| Prueba de las 365 fechas | 165 (113 de verdad) | **155 (103 de verdad)**, sin tipos nuevos |
| Los 56 viajes: v4 mejor / igual / peor | 8 / 48 / 0 | **5 / 51 / 0** (v3 8 avisos, v4 0) |

1. **Paradas encogidas** (reglas 348-350):
   - Ninguna parada baja del 75 % de lo escrito ni de 15 min (20 un barrio).
   - Si la elástica se quedaría en menos de 15 min, se quita, y su rato va al aperitivo del mismo barrio (Monti, Trastevere).
   - La causa de fondo era el redondeo al cuarto de hora: el Barrio Judío escrito de 20 min salía de 11. **Ahora todas las horas y duraciones van de 5 en 5** (es el punto 9 del prompt de UI, adelantado), y los minutos andando, exactos.
   - D1-FT A: el Ghetto 20 y la Isla 15, Trastevere como elástica, al Janículo en el bus 115, y se baja por la Fontana dell'Acqua Paola y el Tempietto.
2. **Un solo bloque por barrio antes de cenar**: «Trastevere al anochecer y aperitivo»; «Trastevere de noche», después de cenar (regla 351).
3. **Aperitivo, 90 min como mucho, siempre**: si sobra tiempo, la cena se adelanta, nunca antes de las 19:30, ni de las 20:30 en verano (regla 352).
4. **Tranquilo** (regla 353): la comida, 105 min como mucho. Las opcionales de la tarde (Letrán y San Clemente en D4M, Mercados de Trajano en D5C) se quitan mientras la tarde pueda absorber ese rato. En invierno se quitan; en verano, con tardes tan largas, vuelven las que hagan falta.
5. **Trevi en D3 a las 8:30**, con el desayuno de 35 min hasta el Free Tour.
6. **D4 B, 14 de marzo**: Popolo 10, lago 25, Terraza 40. El mirador solo se alarga si la cena espera en C y D; en A y B ese rato es de la nocturna y del aperitivo.

**Otros arreglos:**
- **D5C, segundo sitio del pool:** para Caracalla (por la mañana) y los Capitolinos (en lugar de los Mercados de Trajano). Sin él, en viajes de 5 días se quedaban fuera.
- **Elástica en tranquilo:** nunca pasa del máximo de su paseo (Borgo Pio, 45).
- **Adelantar la llegada al atardecer:** solo en los miradores, nunca en una avenida (los Foros).

## Repaso de los 35 viajes (29 de septiembre de 2026)

Once partes, con un commit por parte y sin push (reglas 363-374).

1. **Arco → Foro.** Se entra por la Vía Sacra, así que el tramo es de 4 min (corregido a mano en
   `travel/roma.ajustes.json`, que manda sobre la matriz). La hora de cada parada es la anterior + su duración + el
   paseo: ahora el Arco va de 10:00 a 10:20 y el Foro empieza a las 10:25. En la auditoría hay un aviso nuevo, `no_cuadra`.
2. **D1:** Minerva → Elefantino → Panteón → San Luigi → Navona.
3. **La comida:** como mucho 90 min en completo y 105 en tranquilo.
4. **Tranquilo:** nunca antes de las 10:00. Toda la mañana y la tarde se corren con la primera hora.
5. **D1 en tranquilo:** el Gesù, las Tortugas y Torre Argentina son opcionales, y hay una sola nocturna.
6. **Tranquilo:** las opcionales no vuelven. El rato que sobra va a Monti (hasta 120 min) y al aperitivo.
7. **D4M:** metro A a San Giovanni, y Letrán → Santa María la Mayor → San Pietro in Vincoli → Mercados → Monti.
8. **Ningún rato de más de 20 min sin nombre.** La nocturna va de 5 en 5, hay «Aperitivo en Monti» antes de los Foros
   y en invierno la tarde libre pasa a ser un aperitivo de 90 min con la cena adelantada. Los huecos antes de las
   nocturnas en los 35 viajes pasan de 11 a 0.
9. **Comida cerca de la Galería Borghese:** Girarrosto Fiorentino, Via Sicilia 46, a unos 10 min.
10. **La cena, a 15 min andando como mucho:** en Monti salen La Boccaccia o Valentino.
11. **Aperitivos y ratos libres de 5 en 5.**

**Números**

- **Los 35 viajes (`revision/REVISION_V4_FINAL.md`):** 0 huecos sin nombre; en la auditoría, solo 1 aviso (1 h libre
  antes de la Galería en el viaje 35, tranquilo).
- **Los 56 viajes:** v4 mejor en 4, igual en 48 y peor en 4. Los 4 peores son de tranquilo en invierno.
- **Las 365 fechas:** **10.217** (antes, 155).
  - En completo, unos 276 (antes, alrededor de la mitad de los 155).
  - En tranquilo, unos 7.550.
  - La causa es la parte 4: los días de tranquilo están escritos para empezar entre las 8:30 y las 9:30 (Vaticano a las
    8:30, Coliseo a las 9:00, Puente Sant'Angelo a las 8:45). Con la primera parada a las 10:00:
    - en invierno no se llega al atardecer (el D2 llega al Castillo después del sol);
    - la comida se queda corta;
    - aparecen horas libres antes de la Galería.
  - Esto no tiene arreglo general en el motor. Hay que decidir qué hacer con esas mañanas.

### Parte 4 deshecha (decisión del usuario) y números finales

En tranquilo, las mañanas vuelven a la hora escrita. Con la misma auditoría (que ahora también mira si las horas
cuadran), antes y después del repaso:

| | Antes del repaso | Ahora |
|---|---|---|
| Las 365 fechas, total | 142 | **100** |
| Completo | 95 | 54 |
| Tranquilo | 47 | 46 |
| Los 56 viajes | — | v4 mejor en 5, igual en 51, peor en 0; 0 avisos |
| Los 35 viajes | — | 0 huecos sin nombre, auditoría a 0 |

- **Completo, en detalle:** 28 avisos reales, frente a los 27 de antes, y 26 informativos (Navidad, 1 de enero).
  - De los 28, solo 1 sale por la comprobación nueva de las horas: el tramo de 33 min del 25 de diciembre, de San Pedro
    a Santa Cecilia, que ya salía como tramo largo.
  - No hay avisos reales nuevos: el resto son los mismos casos de antes, algunos con la hora corrida.
- **Los 41 avisos de la elástica que había antes en completo** eran días de verano con tarde de sobra. Ahora ese rato
  sale con nombre (descanso o aperitivo), y la prueba solo lo cuenta si sobra más de lo que absorben (regla 374).
- **Tranquilo:** hay 2 comidas «cortas» nuevas (el 1 de enero y el 31 de diciembre, D1 A). Como el Arco ahora dura
  20 min, la mañana acaba 5 min más tarde que la tarde escrita. La comida sigue durando 45 min.
