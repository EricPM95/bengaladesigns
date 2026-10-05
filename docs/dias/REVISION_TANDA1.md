# Revisión de la tanda 1 (viajes 1 a 10) y de la tanda 2 (viajes 11 a 23): tal como los saca el motor

Cada día sale de la misma llamada que hace la app (`buildDayBlockV3`, motor v4). La columna «Cambio» es el registro del motor: qué ha cambiado respecto al documento y por qué (nada deducido aquí). Vacía = igual que el documento. Si pone «SIN CAUSA APUNTADA», es un fallo. Se regenera con `node scripts/destino/revisionTanda1.mjs`.

Los viajes 19 a 23 son los cinco de la simulación a mano (`docs/dias/VIAJES_2_5_SIMULACION.html`). La comparación parada a parada con ella está en `docs/dias/VIAJES_2_5_DIFERENCIAS.md` y la página del motor, en el mismo formato que la simulación, en `docs/dias/VIAJES_2_5_MOTOR.html` (`node scripts/destino/viajes25Motor.mjs`).

## Viaje 1: 1 día, martes 12-01-2027, sin nada

### Día 1 · martes 2027-01-12 · D0 Roma en un día (crucero)

Variantes: A, ruta_normal, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:45 | Plaza de San Pedro | 20 | - |  |
| 10:05 | Basílica de San Pedro | 5 | de camino |  |
| 10:15 | Via della Conciliazione | 10 | de camino |  |
| 10:45 | Castillo de Sant'Angelo | 15 | por fuera |  |
| 11:05 | Puente Sant'Angelo | 5 | de camino |  |
| 11:30 | Piazza Navona | 25 | - |  |
| 12:10 | Panteón | 15 | por fuera |  |
| 12:40 | Comida: Armando al Pantheon | 60 | mesa |  |
| 14:00 | Fontana de Trevi | 20 | - |  |
| 14:30 | Plaza Venecia | 5 | de camino |  |
| 14:40 | Altar de la Patria | 5 | de camino |  |
| 14:50 | Plaza del Campidoglio | 5 | de camino |  |
| 15:10 | El Foro Romano, desde la terraza del Campidoglio | 15 | por fuera |  |
| 15:30 | Via dei Fori Imperiali | 10 | de camino |  |
| 15:55 | Coliseo | 15 | por fuera |  |
| 16:15 | Arco de Constantino | 5 | de camino |  |

**No incluido**

- Plaza de España
- Museos Vaticanos y Capilla Sixtina

**Avisos**

- Invierno en Roma: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:00, hemos adaptado tu ruta: lo que se ve al aire libre, con luz.

## Viaje 2: 1 día, miércoles 14-07-2027, reserva del Coliseo a las 10:00

### Día 1 · miércoles 2027-07-14 · D0 Roma en un día (crucero)

Variantes: D, ruta_del_reves, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 10:00 | Coliseo | 60 | dentro |  |
| 11:20 | Arco de Constantino | 10 | - |  |
| 11:35 | Via dei Fori Imperiali | 15 | de camino |  |
| 12:00 | Plaza Venecia | 5 | de camino |  |
| 12:10 | Altar de la Patria | 5 | de camino |  |
| 12:35 | Fontana de Trevi | 20 | - |  |
| 13:15 | Comida: Armando al Pantheon | 45 | mesa |  |
| 14:15 | Panteón | 15 | por fuera |  |
| 14:45 | Piazza Navona | 20 | - |  |
| 15:15 | Puente Sant'Angelo | 5 | de camino |  |
| 15:25 | Castillo de Sant'Angelo | 5 | de camino |  |
| 15:55 | Plaza de San Pedro | 15 | - |  |
| 16:10 | Basílica de San Pedro | 10 | de camino |  |

**No incluido**

- Foro Romano y Palatino
- Plaza de España
- Museos Vaticanos y Capilla Sixtina

**Avisos**

- Verano en Roma: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.

## Viaje 3: 1,5 días: llegada jueves 25-03-2027 a las 12:00 (medio día de tarde) y viernes 26 (Viernes Santo) entero

### Día 1 · jueves 2027-03-25 · D0-medio Medio día del Vaticano

Variantes: B, tarde_sin_museos, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 15:00 | Plaza de San Pedro | 20 | - |  |
| 15:20 | Basílica de San Pedro | 5 | de camino |  |
| 15:40 | Pasea y piérdete por Borgo Pio | 25 | - |  |
| 16:10 | Via della Conciliazione | 10 | de camino |  |
| 16:40 | Castillo de Sant'Angelo | 15 | por fuera |  |
| 17:10 | Puente Sant'Angelo | 15 | - |  |
| 17:45 | Pasea y piérdete por Prati | 45 | - |  |
| 19:30 | Cena: L'Arcangelo |  | mesa |  |
| 21:30 | Piazza Navona (noche) | 30 | noche |  |

**No incluido**

- Museos Vaticanos y Capilla Sixtina

**Avisos**

- Primavera en Roma: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 18:30, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas especiales del viaje**

- 2027-03-25 Jueves Santo: Es posible que la Basílica de San Pedro cierre por la mañana por la Misa Crismal del Papa. Hemos puesto la Basílica desde las 12:00; cuenta 45-60 min de cola en el control.
- 2027-03-26 Viernes Santo: Es posible que San Pedro cierre por la tarde, y de noche hay Via Crucis en el Coliseo. Hemos puesto el Coliseo por la mañana. La Basílica, otro día.

### Día 2 · viernes 2027-03-26 · D1-corto Día de la Roma antigua, el centro y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:00 | Coliseo | 20 | por fuera |  |
| 09:25 | Arco de Constantino | 5 | de camino |  |
| 09:35 | Via dei Fori Imperiali | 15 | de camino |  |
| 10:05 | Plaza del Campidoglio | 15 | - |  |
| 10:35 | El Foro Romano, desde la terraza del Campidoglio | 15 | por fuera |  |
| 10:55 | Plaza Venecia | 5 | de camino |  |
| 11:15 | Altar de la Patria | 10 | por fuera |  |
| 11:35 | Teatro de Marcelo | 5 | de camino |  |
| 12:00 | Boca de la Verdad | 15 | - |  |
| 12:35 | Isla Tiberina | 20 | - |  |
| 13:10 | Comida: Nonna Betta | 60 | mesa |  |
| 14:20 | Barrio Judío | 30 | - |  |
| 14:55 | Fuente de las Tortugas | 5 | de camino |  |
| 15:05 | Largo di Torre Argentina | 5 | de camino |  |
| 15:15 | Iglesia del Gesù | 5 | de camino |  |
| 15:30 | Elefantino de Bernini | 3 | de camino |  |
| 15:35 | Iglesia de Santa Maria sopra Minerva | 3 | de camino |  |
| 15:50 | Panteón | 15 | por fuera |  |
| 16:20 | Piazza Navona | 30 | - |  |
| 17:10 | Campo de' Fiori | 25 | - |  |
| 17:55 | Ponte Sisto | 15 | - | documento: hora 18:15 → atardecer |
| 18:25 | Pasea y piérdete por Trastevere iluminado | 30 | - | documento: hora 18:45 → atardecer |
| 18:55 | Iglesia de Santa Maria in Trastevere | 5 | de camino | documento: hora 19:20 → atardecer |
| 19:50 | Cena: Trattoria Da Enzo al 29 |  | mesa | documento: hora 20:00 → atardecer |
| 21:50 | Fontana de Trevi (noche) | 20 | noche | documento: hora 22:05 → atardecer |
| 22:30 | Plaza de España (noche) | 20 | noche | documento: hora 22:45 → atardecer |
| (17:45) | Pasea y piérdete por el Centro Histórico | 15 | - | quitada: atardecer |

**No incluido**

- Museos Vaticanos y Capilla Sixtina

## Viaje 4: 1,5 días: día entero domingo 02-05-2027 y medio día de mañana el lunes 03-05

### Día 1 · domingo 2027-05-02 · D1-corto Día de la Roma antigua, el centro y Trastevere

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:00 | Coliseo | 20 | por fuera |  |
| 09:25 | Arco de Constantino | 5 | de camino |  |
| 09:35 | Via dei Fori Imperiali | 15 | de camino |  |
| 10:05 | Plaza del Campidoglio | 15 | - |  |
| 10:35 | El Foro Romano, desde la terraza del Campidoglio | 15 | por fuera |  |
| 10:55 | Plaza Venecia | 5 | de camino |  |
| 11:15 | Altar de la Patria | 10 | por fuera |  |
| 11:35 | Teatro de Marcelo | 5 | de camino |  |
| 12:00 | Boca de la Verdad | 15 | - |  |
| 12:35 | Isla Tiberina | 20 | - |  |
| 13:10 | Comida: Nonna Betta | 60 | mesa |  |
| 14:20 | Barrio Judío | 30 | - |  |
| 14:55 | Fuente de las Tortugas | 5 | de camino |  |
| 15:05 | Largo di Torre Argentina | 5 | de camino |  |
| 15:15 | Iglesia del Gesù | 5 | de camino |  |
| 15:30 | Elefantino de Bernini | 3 | de camino |  |
| 15:35 | Iglesia de Santa Maria sopra Minerva | 3 | de camino |  |
| 15:50 | Panteón | 15 | por fuera |  |
| 16:20 | Piazza Navona | 30 | - |  |
| 17:10 | Campo de' Fiori | 25 | - |  |
| 17:40 | Ponte Sisto | 5 | de camino |  |
| 18:00 | Pasea y piérdete por Trastevere | 35 | - | documento: min 45 → atardecer |
| 18:35 | Iglesia de Santa Maria in Trastevere | 5 | de camino | documento: hora 18:50 → atardecer |
| 18:50 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino | documento: hora 19:10 → atardecer |
| 19:10 | Fontana dell'Acqua Paola | 10 | - | documento: hora 19:30 → atardecer |
| 19:50 | Mirador del Janículo | 30 | - | documento: hora 20:00 → atardecer |
| 21:05 | Cena: Tonnarello |  | mesa | documento: hora 21:15 → atardecer · restaurante: Trattoria Da Enzo al 29 cierra ese día o a esa hora: va Tonnarello |

**No incluido**

- Museos Vaticanos y Capilla Sixtina: Cerrado el domingo

**Avisos**

- Primavera en Roma: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:15, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

### Día 2 · lunes 2027-05-03 · D0-medio Medio día del Vaticano

Variantes: D, manana, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:30 | Plaza de San Pedro | 20 | - |  |
| 09:50 | Basílica de San Pedro | 5 | de camino |  |
| 10:10 | Pasea y piérdete por Borgo Pio | 20 | - |  |
| 10:35 | Via della Conciliazione | 10 | de camino |  |
| 11:05 | Castillo de Sant'Angelo | 15 | por fuera |  |
| 11:25 | Puente Sant'Angelo | 5 | de camino |  |
| 11:35 | Via dei Coronari | 10 | de camino |  |
| 12:10 | Fontana de Trevi | 20 | - |  |
| 12:50 | Plaza de España | 20 | - |  |
| 13:25 | Comida: Edy | 60 | mesa | restaurante: Poldo e Gianna Osteria cierra ese día o a esa hora: va Edy |

**No incluido**

- Museos Vaticanos y Capilla Sixtina: Cerrado el domingo

## Viaje 5: 2 días, martes 16 y miércoles 17-03-2027

### Día 1 · martes 2027-03-16 · D2 Día del Vaticano y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:35 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 17:55 | Fontana dell'Acqua Paola | 10 | - |  |
| 18:25 | Mirador del Janículo | 30 | - |  |
| 19:20 | Pasea y piérdete por Trastevere iluminado | 30 | - |  |
| 20:15 | Cena: Tonnarello |  | mesa |  |
| 21:55 | Trastevere de noche | 30 | noche |  |

**Avisos**

- Invierno en Roma: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 18:15, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

### Día 2 · miércoles 2027-03-17 · D1 Día de la Roma antigua

Variantes: B, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 45 | - |  |
| 20:00 | Cena: Armando al Pantheon |  | mesa |  |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| 22:30 | Plaza de España (noche) | 20 | noche |  |

## Viaje 6: 2 días, sábado 29 y domingo 30-05-2027, con Free Tour de tarde a las 17:00

### Día 1 · sábado 2027-05-29 · D2 Día del Vaticano y Trastevere

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:30 | Pasea y piérdete por Trastevere | 60 | - |  |
| 18:45 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 19:05 | Fontana dell'Acqua Paola | 10 | - |  |
| 19:25 | La Passeggiata del Gianicolo | 35 | - | documento: min 15 → atardecer |
| 20:10 | Mirador del Janículo | 30 | - | documento: hora 20:00 → atardecer |
| 21:05 | Cena: Tonnarello |  | mesa | documento: hora 21:00 → atardecer |
| 22:50 | Trastevere de noche | 30 | noche | documento: hora 22:40 → atardecer |

**Avisos**

- Primavera en Roma: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:30, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

### Día 2 · domingo 2027-05-30 · D1 Día de la Roma antigua

Variantes: D, free_tour_tarde, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 45 | mesa |  |
| 14:45 | Barrio Judío | 20 | - |  |
| 15:10 | Fuente de las Tortugas | 5 | de camino |  |
| 15:20 | Largo di Torre Argentina | 5 | de camino |  |
| 15:35 | Elefantino de Bernini | 5 | de camino |  |
| 15:55 | Panteón | 25 | dentro |  |
| 17:00 | Free Tour Centro Histórico | 150 | - |  |
| 19:50 | Cena: Pizzeria Da Baffetto |  | mesa |  |
| 21:45 | Foro Romano desde el Campidoglio (noche) | 25 | noche |  |

## Viaje 7: 2 días, lunes 11 y martes 12-10-2027, con Galería Borghese y Cúpula de San Pedro en el pool

### Día 1 · lunes 2027-10-11 · D2 Día del Vaticano y Trastevere

Variantes: B, normal, pool:Cúpula de San Pedro

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:30 | Cúpula de San Pedro | 45 | dentro | nueva: pool: Cúpula de San Pedro |
| 14:35 | Comida: Borghiciana Pastificio Artigianale | 45 | mesa | documento: hora 13:40, min 60 → pool: Cúpula de San Pedro |
| 15:25 | Via della Conciliazione | 10 | de camino | documento: hora 14:45 → pool: Cúpula de San Pedro |
| 15:55 | Castillo de Sant'Angelo | 20 | por fuera | documento: hora 15:15 → pool: Cúpula de San Pedro |
| 16:30 | Puente Sant'Angelo | 15 | - | documento: hora 15:50 → pool: Cúpula de San Pedro |
| 16:55 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 17:30 | Iglesia de Santa Maria in Trastevere | 25 | dentro | documento: hora 16:55 → pool: Cúpula de San Pedro |
| 18:05 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino | documento: hora 17:35 → pool: Cúpula de San Pedro |
| 18:25 | Fontana dell'Acqua Paola | 10 | - | documento: hora 17:55 → pool: Cúpula de San Pedro |
| 19:05 | Mirador del Janículo | 30 | - | documento: hora 18:25 → pool: Cúpula de San Pedro |
| 20:10 | Pasea y piérdete por Trastevere iluminado | 10 | - | documento: hora 19:20, min 30 → pool: Cúpula de San Pedro |
| 20:35 | Cena: Tonnarello |  | mesa | documento: hora 20:15 → pool: Cúpula de San Pedro |
| 22:20 | Trastevere de noche | 30 | noche | documento: hora 21:55 → pool: Cúpula de San Pedro |

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · martes 2027-10-12 · D1 Día de la Roma antigua

Variantes: B, normal, AB, pool:Galería Borghese

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Giggetto al Portico d'Ottavia | 45 | mesa |  |
| 14:45 | Largo di Torre Argentina | 5 | de camino |  |
| 15:10 | Panteón | 25 | dentro | documento: hora 15:05 → pool: Galería Borghese + pool: Galería Borghese: horas por los márgenes |
| 15:40 | Piazza Navona | 5 | de camino | documento: hora 15:35 → pool: Galería Borghese + pool: Galería Borghese: horas por los márgenes |
| 16:25 | Un taxi, unos 20 min | 20 | bus/metro |  |
| 17:00 | Galería Borghese | 120 | dentro |  |
| 19:35 | Terraza del Pincio | 20 | - |  |
| 20:15 | Cena: Il Gabriello |  | mesa |  |
| 22:10 | Fontana de Trevi (noche) | 20 | noche | documento: hora 22:00 → pool: Galería Borghese + pool: Galería Borghese: horas por los márgenes |
| (22:40) | Plaza de España (noche) | 20 | - | quitada: hora límite de la noche |

## Viaje 8: 2 días, martes 29 y miércoles 30-06-2027, con reserva de Museos Vaticanos a las 16:00 y Barrios y Sabores

### Día 1 · martes 2027-06-29 · D1 Día de la Roma antigua

Variantes: D, normal, experiencia:barrios_sabores

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Giggetto al Portico d'Ottavia | 45 | mesa | documento: min 60 → experiencia: barrios_sabores · restaurante: Nonna Betta cierra ese día o a esa hora: va Giggetto al Portico d'Ottavia |
| 14:50 | Barrio Judío | 45 | - | documento: hora 15:00, min 30 → experiencia: barrios_sabores |
| 15:40 | Fuente de las Tortugas | 5 | de camino | documento: hora 15:35 → experiencia: barrios_sabores |
| 16:00 | Largo di Torre Argentina | 15 | - | documento: hora 15:55 → experiencia: barrios_sabores |
| 16:30 | Iglesia del Gesù | 20 | dentro | documento: hora 16:25 → experiencia: barrios_sabores |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:25 | Iglesia de San Luigi dei Francesi | 20 | dentro | documento: hora 17:20 → experiencia: barrios_sabores |
| 18:00 | Panteón | 40 | dentro | documento: hora 17:55 → experiencia: barrios_sabores |
| 19:00 | Piazza Navona | 30 | - | documento: hora 18:50 → experiencia: barrios_sabores |
| 19:50 | Campo de' Fiori | 20 | - | documento: hora 19:40 → experiencia: barrios_sabores |
| 20:30 | Ponte Sisto | 25 | - | documento: hora 20:15 → experiencia: barrios_sabores |
| 21:20 | Cena: Trattoria Da Enzo al 29 |  | mesa | documento: hora 21:00 → experiencia: barrios_sabores |
| 23:25 | Fontana de Trevi (noche) | 20 | noche | documento: hora 23:05 → experiencia: barrios_sabores |

**No incluido**

- Plaza de España

**Avisos**

- Verano en Roma: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.

**Avisos de fechas especiales del viaje**

- 2027-06-29 29 de junio · San Pedro y San Pablo: Es la fiesta de los patronos de Roma y los Museos Vaticanos cierran. Hemos puesto el Vaticano otro día.

### Día 2 · miércoles 2027-06-30 · D2 Día del Vaticano y Trastevere

Variantes: D, reserva_14_16, experiencia:barrios_sabores

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:00 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 09:35 | Pasea y piérdete por Trastevere | 25 | - |  |
| 10:15 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 10:35 | Fontana dell'Acqua Paola | 10 | - |  |
| 11:05 | Mirador del Janículo | 25 | - |  |
| 11:40 | La Passeggiata del Gianicolo, bajando hasta San Pedro | 35 | - |  |
| 12:50 | Comida: Borghiciana Pastificio Artigianale | 45 | mesa | documento: hora 12:35, min 60 → experiencia: barrios_sabores |
| 13:40 | Plaza de San Pedro | 5 | de camino | documento: hora 13:55, min 15 → experiencia: barrios_sabores |
| 14:00 | Basílica de San Pedro | 45 | dentro | documento: hora 14:25 → experiencia: barrios_sabores |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 19:25 | Pasea y piérdete por Prati | 30 | - |  |
| 20:30 | Cena: L'Arcangelo |  | mesa |  |
| 22:25 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | noche |  |

**No incluido**

- Plaza de España

## Viaje 9: 2 días con Free Tour de mañana, miércoles 17 y jueves 18-11-2027, con Arte y Museos

### Día 1 · miércoles 2027-11-17 · D3 Día del Free Tour y el Vaticano por la tarde

Variantes: A, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 07:45 | Fontana de Trevi | 20 | - |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 | - |  |
| 09:00 | Panteón | 20 | dentro |  |
| 10:00 | Free Tour Centro Histórico | 150 | - |  |
| 12:50 | Comida: Armando al Pantheon | 45 | mesa |  |
| 13:50 | Bus 40 o un taxi, unos 25 min | 25 | bus/metro |  |
| 14:30 | Basílica de San Pedro | 45 | dentro |  |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 150 | dentro |  |
| 19:00 | Plaza de San Pedro | 20 | - |  |
| 19:45 | Cena: L'Arcangelo |  | mesa |  |
| 21:40 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | noche |  |

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 16:45, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · jueves 2027-11-18 · D1-FT Día de la Roma antigua, el Gueto y Trastevere

Variantes: A, normal, experiencia:arte_museos

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:45 | Museos Capitolinos | 75 | dentro | nueva: experiencia: arte_museos |
| 14:05 | Plaza Venecia | 5 | de camino | documento: hora 12:40 → experiencia: arte_museos |
| 14:15 | Altar de la Patria | 5 | de camino | documento: hora 13:00, min 30, cómo dentro → experiencia: arte_museos |
| 14:40 | Comida: Giggetto al Portico d'Ottavia | 45 | mesa | documento: hora 13:50, min 60 → experiencia: arte_museos |
| 15:40 | Barrio Judío | 20 | - | documento: hora 15:00, min 25 → experiencia: arte_museos |
| 16:05 | Fuente de las Tortugas | 5 | de camino | documento: hora 15:30 → experiencia: arte_museos |
| 16:20 | Teatro de Marcelo | 5 | de camino | documento: hora 15:40 → experiencia: arte_museos |
| 16:45 | Isla Tiberina | 20 | - | documento: hora 16:00 → experiencia: arte_museos |
| 17:20 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino | documento: hora 16:40 → experiencia: arte_museos |
| 17:40 | Fontana dell'Acqua Paola | 10 | - | documento: hora 17:00 → experiencia: arte_museos |
| 18:20 | Mirador del Janículo | 30 | - | documento: hora 17:30 → experiencia: arte_museos |
| 19:20 | Iglesia de Santa Maria in Trastevere | 20 | dentro | documento: hora 18:25 → experiencia: arte_museos |
| 19:55 | Pasea y piérdete por Trastevere iluminado | 10 | - | documento: hora 18:55, min 35 → experiencia: arte_museos |
| 20:25 | Cena: Trattoria Da Enzo al 29 |  | mesa | documento: hora 19:45 → experiencia: arte_museos |
| 22:25 | Fontana de Trevi (noche) | 20 | noche | documento: hora 21:50 → experiencia: arte_museos |
| (22:30) | Plaza de España (noche) | 20 | - | quitada: hora límite de la noche |

## Viaje 10: 2 días, viernes 24 y sábado 25-12-2027, con Mercadillos

### Día 1 · viernes 2027-12-24 · D1 Día de la Roma antigua

Variantes: A, normal, AB, experiencia:mercadillos_navidenos, adelantar:Panteón

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:35 | Santo Bambino de Aracoeli | 5 | de camino | nueva: experiencia: mercadillos_navidenos |
| 12:45 | Plaza Venecia | 5 | de camino | documento: hora 12:40 → experiencia: mercadillos_navidenos |
| 13:05 | Altar de la Patria | 30 | dentro | documento: hora 13:00 → experiencia: mercadillos_navidenos |
| 13:55 | Comida: Nonna Betta (Con reserva) | 50 | mesa | documento: hora 13:50, min 60 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 15:05 | Panteón | 40 | dentro | documento: hora 17:55 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 16:10 | Barrio Judío | 30 | - | documento: hora 15:00 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 16:45 | Fuente de las Tortugas | 5 | de camino | documento: hora 15:35 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 17:05 | Largo di Torre Argentina | 15 | - | documento: hora 15:55 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 17:35 | Iglesia del Gesù | 20 | dentro | documento: hora 16:25 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 18:00 | Elefantino de Bernini | 5 | de camino | documento: hora 16:55 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 18:05 | Iglesia de Santa Maria sopra Minerva | 5 | de camino | documento: hora 17:00 → experiencia: mercadillos_navidenos + cierre de Panteón |
| 18:30 | Iglesia de San Luigi dei Francesi | 10 | por fuera | documento: hora 17:20, min 20, cómo dentro → experiencia: mercadillos_navidenos + cierre de Panteón + cierre de Iglesia de San Luigi dei Francesi |
| 19:05 | Piazza Navona y su mercadillo navideño | 40 | - | documento: hora 18:50, min 45, título Piazza Navona → experiencia: mercadillos_navidenos |
| 20:00 | Cena: Armando al Pantheon (Con reserva) |  | mesa |  |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| (22:30) | Plaza de España (noche) | 20 | - | quitada: noche especial: Fontana de Trevi (noche) |

**No incluido**

- Plaza de España
- Museos Vaticanos y Capilla Sixtina: Cerrado el 25 de diciembre
- Basílica de San Pedro

**Avisos**

- Navidad en Roma: ¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.

**Avisos de fechas especiales del viaje**

- 2027-12-25 Sábado 25 · Panteón cerrado: El 25 de diciembre el Panteón cierra por Navidad. Hemos ajustado el día para enseñártelo por fuera sin perder tiempo.
- 2027-12-24 24 de diciembre · Nochebuena: Por la noche el Papa celebra la misa de Nochebuena en San Pedro: la Basílica y los Museos Vaticanos cierran antes. Hemos puesto el Vaticano otro día. El 24 de diciembre el bus, el tranvía y el metro paran a las 21:00. Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.
- 2027-12-25 25 de diciembre · Navidad: A mediodía el Papa da la bendición en San Pedro y la plaza se llena de fieles; muchos monumentos cierran. Hemos ajustado tu ruta a lo que abre. El 25 de diciembre el transporte solo circula de 8:30 a 13:00 y de 16:30 a 21:00. Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.

### Día 2 · sábado 2027-12-25 · D2 Día del Vaticano y Trastevere

Variantes: A, fiesta, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Pasea y piérdete por Trastevere | 30 | - |  |
| 09:00 | Iglesia de Santa Maria in Trastevere | 5 | de camino |  |
| 09:20 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 09:40 | Fontana dell'Acqua Paola | 10 | - |  |
| 10:00 | La Passeggiata del Gianicolo, bajando hasta San Pedro | 30 | - |  |
| 11:00 | Plaza de San Pedro: la bendición del Papa a las 12:00 y el belén | 75 | - |  |
| 12:35 | Comida: Borghiciana Pastificio Artigianale (Con reserva) | 90 | mesa |  |
| 14:10 | Via della Conciliazione | 10 | de camino |  |
| 14:40 | Castillo de Sant'Angelo | 15 | por fuera |  |
| 15:10 | Pasea y piérdete por Prati | 50 | - | documento: min 40 → atardecer |
| 16:20 | Puente Sant'Angelo | 15 | - | documento: hora 16:10 → atardecer |
| 17:00 | Pasea y piérdete por el centro iluminado | 90 | - | documento: hora 16:40 → atardecer |
| 18:35 | Panteón | 5 | de camino | documento: hora 18:15 → atardecer |
| 19:30 | Cena: Armando al Pantheon |  | mesa |  |
| 21:15 | Piazza Navona (noche) | 30 | noche |  |

**No incluido**

- Plaza de España
- Museos Vaticanos y Capilla Sixtina: Cerrado el 25 de diciembre
- Basílica de San Pedro

## Viaje 11: 2 días: sábado 29 y domingo 30-05-2027, sin Free Tour ni pool (Panteón del sábado, Plaza de España y cambio de orden por el domingo)

### Día 1 · sábado 2027-05-29 · D2 Día del Vaticano y Trastevere

Variantes: D, normal, noche:Plaza de España (noche)

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:30 | Pasea y piérdete por Trastevere | 60 | - |  |
| 18:45 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 19:05 | Fontana dell'Acqua Paola | 10 | - |  |
| 19:25 | La Passeggiata del Gianicolo | 35 | - | documento: min 15 → atardecer |
| 20:10 | Mirador del Janículo | 30 | - | documento: hora 20:00 → atardecer |
| 21:05 | Cena: Tonnarello |  | mesa | documento: hora 21:00 → atardecer |
| 22:48 | Un taxi, unos 12 min | 12 | taxi |  |
| 23:15 | Plaza de España (noche) | 20 | noche | nueva: la Plaza de España todavía no ha salido en el viaje: es la nocturna del Día del Vaticano |
| (22:40) | Trastevere de noche | 30 | - | quitada: la Plaza de España todavía no ha salido en el viaje: es la nocturna del Día del Vaticano |

**Avisos**

- Primavera en Roma: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:30, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

### Día 2 · domingo 2027-05-30 · D1 Día de la Roma antigua

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 30 | - |  |
| 19:40 | Campo de' Fiori | 20 | - |  |
| 20:15 | Ponte Sisto | 25 | - |  |
| 21:00 | Cena: Tonnarello |  | mesa | restaurante: Trattoria Da Enzo al 29 cierra ese día o a esa hora: va Tonnarello |
| 22:39 | Un taxi, unos 11 min | 11 | taxi |  |
| 23:05 | Fontana de Trevi (noche) | 20 | noche |  |

## Viaje 12: 2 días: martes 16 y miércoles 17-03-2027, sin pool (cambio de orden por el miércoles: el Vaticano, con Museos, pasa al martes)

### Día 1 · martes 2027-03-16 · D2 Día del Vaticano y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:35 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 17:55 | Fontana dell'Acqua Paola | 10 | - |  |
| 18:25 | Mirador del Janículo | 30 | - |  |
| 19:20 | Pasea y piérdete por Trastevere iluminado | 30 | - |  |
| 20:15 | Cena: Tonnarello |  | mesa |  |
| 21:55 | Trastevere de noche | 30 | noche |  |

**Avisos**

- Invierno en Roma: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 18:15, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

### Día 2 · miércoles 2027-03-17 · D1 Día de la Roma antigua

Variantes: B, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 45 | - |  |
| 20:00 | Cena: Armando al Pantheon |  | mesa |  |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| 22:30 | Plaza de España (noche) | 20 | noche |  |

## Viaje 13: 1,5 días: día entero el martes 12-10-2027 y medio día de tarde el miércoles 13-10, sin reservas

### Día 1 · martes 2027-10-12 · D1-corto Día de la Roma antigua, el centro y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:00 | Coliseo | 20 | por fuera |  |
| 09:25 | Arco de Constantino | 5 | de camino |  |
| 09:35 | Via dei Fori Imperiali | 15 | de camino |  |
| 10:05 | Plaza del Campidoglio | 15 | - |  |
| 10:35 | El Foro Romano, desde la terraza del Campidoglio | 15 | por fuera |  |
| 10:55 | Plaza Venecia | 5 | de camino |  |
| 11:15 | Altar de la Patria | 10 | por fuera |  |
| 11:35 | Teatro de Marcelo | 5 | de camino |  |
| 12:00 | Boca de la Verdad | 15 | - |  |
| 12:35 | Isla Tiberina | 20 | - |  |
| 13:10 | Comida: Giggetto al Portico d'Ottavia | 60 | mesa | restaurante: Nonna Betta cierra ese día o a esa hora: va Giggetto al Portico d'Ottavia |
| 14:20 | Barrio Judío | 30 | - |  |
| 14:55 | Fuente de las Tortugas | 5 | de camino |  |
| 15:05 | Largo di Torre Argentina | 5 | de camino |  |
| 15:15 | Iglesia del Gesù | 5 | de camino |  |
| 15:30 | Elefantino de Bernini | 3 | de camino |  |
| 15:35 | Iglesia de Santa Maria sopra Minerva | 3 | de camino |  |
| 15:50 | Panteón | 15 | por fuera |  |
| 16:20 | Piazza Navona | 30 | - |  |
| 17:10 | Campo de' Fiori | 25 | - |  |
| 17:45 | Pasea y piérdete por el Centro Histórico | 15 | - |  |
| 18:15 | Ponte Sisto | 15 | - |  |
| 18:45 | Pasea y piérdete por Trastevere iluminado | 30 | - |  |
| 19:20 | Iglesia de Santa Maria in Trastevere | 5 | de camino |  |
| 20:00 | Cena: Trattoria Da Enzo al 29 |  | mesa |  |
| 22:05 | Fontana de Trevi (noche) | 20 | noche |  |
| 22:45 | Plaza de España (noche) | 20 | noche |  |

**No incluido**

- Museos Vaticanos y Capilla Sixtina

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · miércoles 2027-10-13 · D0-medio Medio día del Vaticano

Variantes: B, tarde_sin_museos, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 15:00 | Plaza de San Pedro | 20 | - |  |
| 15:20 | Basílica de San Pedro | 5 | de camino |  |
| 15:40 | Pasea y piérdete por Borgo Pio | 25 | - |  |
| 16:10 | Via della Conciliazione | 10 | de camino |  |
| 16:40 | Castillo de Sant'Angelo | 15 | por fuera |  |
| 17:10 | Puente Sant'Angelo | 15 | - |  |
| 17:45 | Pasea y piérdete por Prati | 45 | - |  |
| 19:30 | Cena: L'Arcangelo |  | mesa |  |
| 21:30 | Piazza Navona (noche) | 30 | noche |  |

**No incluido**

- Museos Vaticanos y Capilla Sixtina

## Viaje 14: 2 días: martes 24 y miércoles 25-12-2027, sin pool (Nochebuena y Navidad)

### Día 1 · viernes 2027-12-24 · D1 Día de la Roma antigua

Variantes: A, normal, AB, adelantar:Panteón

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta (Con reserva) | 50 | mesa | documento: min 60 → cierre de Panteón |
| 15:00 | Panteón | 40 | dentro | documento: hora 17:55 → cierre de Panteón |
| 16:05 | Barrio Judío | 30 | - | documento: hora 15:00 → cierre de Panteón |
| 16:40 | Fuente de las Tortugas | 5 | de camino | documento: hora 15:35 → cierre de Panteón |
| 17:00 | Largo di Torre Argentina | 15 | - | documento: hora 15:55 → cierre de Panteón |
| 17:30 | Iglesia del Gesù | 20 | dentro | documento: hora 16:25 → cierre de Panteón |
| 17:55 | Elefantino de Bernini | 5 | de camino | documento: hora 16:55 → cierre de Panteón |
| 18:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino | documento: hora 17:00 → cierre de Panteón |
| 18:25 | Iglesia de San Luigi dei Francesi | 10 | por fuera | documento: hora 17:20, min 20, cómo dentro → cierre de Panteón + cierre de Iglesia de San Luigi dei Francesi |
| 19:00 | Piazza Navona | 45 | - | documento: hora 18:50 → cierre de Panteón |
| 20:00 | Cena: Armando al Pantheon (Con reserva) |  | mesa |  |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| (22:30) | Plaza de España (noche) | 20 | - | quitada: noche especial: Fontana de Trevi (noche) |

**No incluido**

- Plaza de España
- Museos Vaticanos y Capilla Sixtina: Cerrado el 25 de diciembre
- Basílica de San Pedro

**Avisos**

- Navidad en Roma: ¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.

**Avisos de fechas especiales del viaje**

- 2027-12-25 Sábado 25 · Panteón cerrado: El 25 de diciembre el Panteón cierra por Navidad. Hemos ajustado el día para enseñártelo por fuera sin perder tiempo.
- 2027-12-24 24 de diciembre · Nochebuena: Por la noche el Papa celebra la misa de Nochebuena en San Pedro: la Basílica y los Museos Vaticanos cierran antes. Hemos puesto el Vaticano otro día. El 24 de diciembre el bus, el tranvía y el metro paran a las 21:00. Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.
- 2027-12-25 25 de diciembre · Navidad: A mediodía el Papa da la bendición en San Pedro y la plaza se llena de fieles; muchos monumentos cierran. Hemos ajustado tu ruta a lo que abre. El 25 de diciembre el transporte solo circula de 8:30 a 13:00 y de 16:30 a 21:00. Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.

### Día 2 · sábado 2027-12-25 · D2 Día del Vaticano y Trastevere

Variantes: A, fiesta, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Pasea y piérdete por Trastevere | 30 | - |  |
| 09:00 | Iglesia de Santa Maria in Trastevere | 5 | de camino |  |
| 09:20 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 09:40 | Fontana dell'Acqua Paola | 10 | - |  |
| 10:00 | La Passeggiata del Gianicolo, bajando hasta San Pedro | 30 | - |  |
| 11:00 | Plaza de San Pedro: la bendición del Papa a las 12:00 y el belén | 75 | - |  |
| 12:35 | Comida: Borghiciana Pastificio Artigianale (Con reserva) | 90 | mesa |  |
| 14:10 | Via della Conciliazione | 10 | de camino |  |
| 14:40 | Castillo de Sant'Angelo | 15 | por fuera |  |
| 15:10 | Pasea y piérdete por Prati | 50 | - | documento: min 40 → atardecer |
| 16:20 | Puente Sant'Angelo | 15 | - | documento: hora 16:10 → atardecer |
| 17:00 | Pasea y piérdete por el centro iluminado | 90 | - | documento: hora 16:40 → atardecer |
| 18:35 | Panteón | 5 | de camino | documento: hora 18:15 → atardecer |
| 19:30 | Cena: Armando al Pantheon |  | mesa |  |
| 21:15 | Piazza Navona (noche) | 30 | noche |  |

**No incluido**

- Plaza de España
- Museos Vaticanos y Capilla Sixtina: Cerrado el 25 de diciembre
- Basílica de San Pedro

## Viaje 15: 2 días: martes 12 y miércoles 13-10-2027, con la Galería Borghese en el pool (con el cambio de orden, el D1 cae en miércoles y la Galería abre)

### Día 1 · martes 2027-10-12 · D2 Día del Vaticano y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:35 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 17:55 | Fontana dell'Acqua Paola | 10 | - |  |
| 18:25 | Mirador del Janículo | 30 | - |  |
| 19:20 | Pasea y piérdete por Trastevere iluminado | 30 | - |  |
| 20:15 | Cena: Tonnarello |  | mesa |  |
| 21:55 | Trastevere de noche | 30 | noche |  |

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · miércoles 2027-10-13 · D1 Día de la Roma antigua

Variantes: B, normal, AB, pool:Galería Borghese

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 45 | mesa |  |
| 14:45 | Largo di Torre Argentina | 5 | de camino |  |
| 15:10 | Panteón | 25 | dentro | documento: hora 15:05 → pool: Galería Borghese + pool: Galería Borghese: horas por los márgenes |
| 15:40 | Piazza Navona | 5 | de camino | documento: hora 15:35 → pool: Galería Borghese + pool: Galería Borghese: horas por los márgenes |
| 16:25 | Un taxi, unos 20 min | 20 | bus/metro |  |
| 17:00 | Galería Borghese | 120 | dentro |  |
| 19:35 | Terraza del Pincio | 20 | - |  |
| 20:15 | Cena: Il Gabriello |  | mesa |  |
| 22:10 | Fontana de Trevi (noche) | 20 | noche | documento: hora 22:00 → pool: Galería Borghese + pool: Galería Borghese: horas por los márgenes |
| (22:40) | Plaza de España (noche) | 20 | - | quitada: hora límite de la noche |

## Viaje 16: 2 días con Free Tour de mañana: martes 12 y miércoles 13-10-2027, con el Ojo de la Cerradura en el pool

### Día 1 · martes 2027-10-12 · D3 Día del Free Tour y el Vaticano por la tarde

Variantes: B, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 07:45 | Fontana de Trevi | 20 | - |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 | - |  |
| 09:00 | Panteón | 20 | dentro |  |
| 10:00 | Free Tour Centro Histórico | 150 | - |  |
| 12:50 | Comida: Armando al Pantheon | 45 | mesa |  |
| 13:50 | Bus 40 o un taxi, unos 25 min | 25 | bus/metro |  |
| 14:30 | Basílica de San Pedro | 45 | dentro |  |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 150 | dentro |  |
| 19:00 | Plaza de San Pedro | 20 | - |  |
| 19:45 | Cena: L'Arcangelo |  | mesa |  |
| 21:40 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | noche |  |

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · miércoles 2027-10-13 · D1-FT Día de la Roma antigua, el Gueto y Trastevere

Variantes: B, normal, pool:Ojo de la Cerradura del Aventino

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Giggetto al Portico d'Ottavia | 60 | mesa |  |
| 15:05 | Barrio Judío | 20 | - | documento: hora 15:00 → pool: Ojo de la Cerradura del Aventino + pool: Ojo de la Cerradura del Aventino: horas por los márgenes |
| 15:30 | Fuente de las Tortugas | 3 | de camino | documento: hora 15:25 → pool: Ojo de la Cerradura del Aventino: horas por los márgenes |
| 15:45 | Teatro de Marcelo | 5 | de camino | documento: hora 15:35 → pool: Ojo de la Cerradura del Aventino + pool: Ojo de la Cerradura del Aventino: horas por los márgenes |
| 16:10 | Boca de la Verdad | 15 | - | documento: hora 15:55 → pool: Ojo de la Cerradura del Aventino: horas por los márgenes |
| 16:35 | Jardín de los Naranjos | 10 | de camino | documento: hora 16:20 → pool: Ojo de la Cerradura del Aventino: horas por los márgenes |
| 17:00 | Ojo de la Cerradura del Aventino | 10 | - | documento: hora 16:45 → pool: Ojo de la Cerradura del Aventino: horas por los márgenes |
| 17:40 | Un taxi, unos 15 min | 15 | bus/metro |  |
| 18:10 | Mirador del Janículo | 30 | - | documento: hora 17:45 → pool: Ojo de la Cerradura del Aventino + atardecer |
| 19:10 | Iglesia de Santa Maria in Trastevere | 20 | dentro | documento: hora 18:40 → pool: Ojo de la Cerradura del Aventino + pool: Ojo de la Cerradura del Aventino: horas por los márgenes + atardecer |
| 19:45 | Pasea y piérdete por Trastevere iluminado | 10 | - | documento: hora 19:10, min 30 → pool: Ojo de la Cerradura del Aventino + pool: Ojo de la Cerradura del Aventino: horas por los márgenes + atardecer |
| 20:15 | Cena: Trattoria Da Enzo al 29 |  | mesa |  |
| 22:20 | Fontana de Trevi (noche) | 20 | noche |  |

## Viaje 17: 2,5 días: llegada el viernes 14-05-2027 por la tarde y días enteros sábado 15 y domingo 16, sin pool (DT-medio de tarde y cambio de orden por el domingo)

### Día 1 · viernes 2027-05-14 · DT-medio Medio día del Tridente y el Pincio

Variantes: D, tarde

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 16:00 | Plaza de España | 20 | - |  |
| 16:30 | Via del Babuino y Via Margutta | 10 | de camino |  |
| 16:55 | Piazza del Popolo | 15 | - |  |
| 17:25 | Santa Maria del Popolo (los Caravaggio) | 20 | dentro |  |
| 18:05 | Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines | 90 | - |  |
| 19:55 | Terraza del Pincio | 30 | - |  |
| 20:45 | Trinità dei Monti y su mirador sobre la Plaza de España | 10 | por fuera |  |
| 21:00 | Bajar la escalinata de la Plaza de España | 5 | de camino |  |
| 21:20 | Cena: Il Gabriello |  | mesa |  |
| 22:53 | Un taxi, unos 12 min | 12 | taxi |  |
| 23:20 | Coliseo (noche) | 20 | noche |  |

**Avisos**

- Primavera en Roma: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:15, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

### Día 2 · sábado 2027-05-15 · D2 Día del Vaticano y Trastevere

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:30 | Pasea y piérdete por Trastevere | 60 | - |  |
| 18:45 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 19:05 | Fontana dell'Acqua Paola | 10 | - |  |
| 19:25 | La Passeggiata del Gianicolo | 15 | - |  |
| 20:00 | Mirador del Janículo | 30 | - |  |
| 21:00 | Cena: Tonnarello |  | mesa |  |
| 22:40 | Trastevere de noche | 30 | noche |  |

### Día 3 · domingo 2027-05-16 · D1 Día de la Roma antigua

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 30 | - |  |
| 19:40 | Campo de' Fiori | 20 | - |  |
| 20:15 | Ponte Sisto | 25 | - |  |
| 21:00 | Cena: Tonnarello |  | mesa | restaurante: Trattoria Da Enzo al 29 cierra ese día o a esa hora: va Tonnarello |
| 22:39 | Un taxi, unos 11 min | 11 | taxi |  |
| 23:05 | Fontana de Trevi (noche) | 20 | noche |  |

## Viaje 18: 2,5 días con Free Tour de mañana: martes 12 y miércoles 13-10-2027 enteros y medio día de mañana el jueves 14, con San Juan de Letrán en el pool (DM-medio con Letrán)

### Día 1 · martes 2027-10-12 · D3 Día del Free Tour y el Vaticano por la tarde

Variantes: B, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 07:45 | Fontana de Trevi | 20 | - |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 | - |  |
| 09:00 | Panteón | 20 | dentro |  |
| 10:00 | Free Tour Centro Histórico | 150 | - |  |
| 12:50 | Comida: Armando al Pantheon | 45 | mesa |  |
| 13:50 | Bus 40 o un taxi, unos 25 min | 25 | bus/metro |  |
| 14:30 | Basílica de San Pedro | 45 | dentro |  |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 150 | dentro |  |
| 19:00 | Plaza de San Pedro | 20 | - |  |
| 19:45 | Cena: L'Arcangelo |  | mesa |  |
| 21:40 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | noche |  |

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · miércoles 2027-10-13 · D1-FT Día de la Roma antigua, el Gueto y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Giggetto al Portico d'Ottavia | 60 | mesa |  |
| 15:00 | Barrio Judío | 25 | - |  |
| 15:30 | Fuente de las Tortugas | 5 | de camino |  |
| 15:40 | Teatro de Marcelo | 5 | de camino |  |
| 16:00 | Isla Tiberina | 20 | - |  |
| 16:40 | Iglesia de Santa Maria in Trastevere | 20 | dentro |  |
| 17:15 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 17:35 | Fontana dell'Acqua Paola | 10 | - |  |
| 18:10 | Mirador del Janículo | 30 | - | documento: hora 18:05 → atardecer |
| 19:15 | Pasea y piérdete por Trastevere iluminado | 30 | - | documento: hora 19:00 → atardecer |
| 20:15 | Cena: Trattoria Da Enzo al 29 |  | mesa |  |
| 22:20 | Fontana de Trevi (noche) | 20 | noche |  |

### Día 3 · jueves 2027-10-14 · DM-medio Medio día de Monti

Variantes: B, manana, unica, pool:Basílica de San Juan de Letrán

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:00 | Plaza del Quirinal (la vista de San Pedro) | 15 | - |  |
| 09:40 | Pasea y piérdete por Monti (Via Panisperna y la Piazza Madonna dei Monti) | 30 | - |  |
| 10:30 | San Pietro in Vincoli (el Moisés de Miguel Ángel) | 20 | dentro |  |
| 11:15 | Basílica de Santa María la Mayor | 30 | dentro | documento: hora 11:10 → pool: Basílica de San Juan de Letrán + pool: Basílica de San Juan de Letrán: horas por los márgenes |
| 12:15 | San Juan de Letrán y la Escalera Santa | 45 | dentro | documento: hora 12:10 → pool: Basílica de San Juan de Letrán: horas por los márgenes |
| 13:20 | Comida: SantoPalato | 60 | mesa | documento: hora 13:10 → pool: Basílica de San Juan de Letrán: horas por los márgenes |

## Viaje 19: 2,5 días (simulación 1, invierno): viernes 15 (tarde), sábado 16 y domingo 17 de enero de 2027

### Día 1 · viernes 2027-01-15 · DT-medio Medio día del Tridente y el Pincio

Variantes: A, tarde_A_de_invierno, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 15:00 | Plaza de España | 20 | - |  |
| 15:35 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | dentro |  |
| 16:15 | Pasea y piérdete por los Jardines del Pincio | 10 | - | nueva: atardecer |
| 16:40 | Terraza del Pincio | 30 | - | documento: hora 16:15 → atardecer |
| 17:25 | Santa Maria del Popolo (los Caravaggio) | 20 | dentro | documento: hora 17:05 → atardecer |
| 18:00 | Piazza del Popolo | 20 | - | documento: hora 17:40 → atardecer |
| 18:25 | Via del Babuino y Via Margutta | 10 | de camino | documento: hora 18:05 → atardecer |
| 18:50 | Pasea y piérdete por Via Condotti y el Tridente iluminados | 30 | - | documento: hora 18:25, min 40 → atardecer |
| 19:35 | Cena: Il Gabriello |  | mesa | documento: hora 19:20 → atardecer |
| 21:08 | Un taxi, unos 12 min | 12 | taxi |  |
| 21:35 | Coliseo (noche) | 20 | noche | documento: hora 21:20 → atardecer |

**Avisos**

- Invierno en Roma: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:00, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

### Día 2 · sábado 2027-01-16 · D2 Día del Vaticano y Trastevere

Variantes: A, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 75 | mesa |  |
| 15:00 | Via della Conciliazione | 10 | de camino |  |
| 15:30 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 16:05 | Puente Sant'Angelo | 15 | - |  |
| 16:30 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 17:05 | Isla Tiberina | 20 | - |  |
| 17:45 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 18:20 | Pasea y piérdete por Trastevere iluminado | 80 | - |  |
| 20:00 | Cena: Tonnarello |  | mesa |  |
| 22:00 | Piazza Navona (noche) | 30 | noche |  |

### Día 3 · domingo 2027-01-17 · D1 Día de la Roma antigua

Variantes: A, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 45 | - |  |
| 20:00 | Cena: Pizzeria Da Baffetto |  | mesa | restaurante: Armando al Pantheon cierra ese día o a esa hora: va Pizzeria Da Baffetto |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| 22:30 | Plaza de España (noche) | 20 | noche |  |

## Viaje 20: 2,5 días (simulación 2, primavera, con Free Tour de mañana): martes 13 y miércoles 14 enteros y jueves 15 de abril de 2027 por la mañana

### Día 1 · martes 2027-04-13 · D3 Día del Free Tour y el Vaticano por la tarde

Variantes: D, normal, CD

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 07:45 | Fontana de Trevi | 20 | - |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 | - |  |
| 09:00 | Panteón | 20 | dentro |  |
| 10:00 | Free Tour Centro Histórico | 150 | - |  |
| 12:50 | Comida: Armando al Pantheon | 45 | mesa |  |
| 14:20 | Bus 40 o un taxi, unos 25 min | 25 | bus/metro |  |
| 15:00 | Museos Vaticanos y Capilla Sixtina | 150 | dentro |  |
| 18:00 | Plaza de San Pedro | 10 | - |  |
| 18:25 | Basílica de San Pedro | 45 | dentro |  |
| 19:15 | Via della Conciliazione | 10 | de camino |  |
| 19:45 | Castillo de Sant'Angelo | 10 | por fuera |  |
| 20:10 | Puente Sant'Angelo | 15 | - |  |
| 20:45 | Cena: L'Arcangelo |  | mesa |  |
| 22:45 | Piazza Navona (noche) | 15 | noche |  |

**Avisos**

- Primavera en Roma: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 19:45, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

### Día 2 · miércoles 2027-04-14 · D1-FT Día de la Roma antigua, el Gueto y Trastevere

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Giggetto al Portico d'Ottavia | 60 | mesa |  |
| 15:00 | Barrio Judío | 25 | - |  |
| 15:30 | Fuente de las Tortugas | 5 | de camino |  |
| 15:40 | Teatro de Marcelo | 5 | de camino |  |
| 16:00 | Isla Tiberina | 20 | - |  |
| 16:40 | Iglesia de Santa Maria in Trastevere | 20 | dentro |  |
| 17:10 | Pasea y piérdete por Trastevere | 45 | - | documento: min 60 → atardecer |
| 18:15 | San Pietro in Montorio y Tempietto de Bramante | 10 | por fuera | documento: hora 18:35, min 20, cómo dentro → atardecer + cierre de San Pietro in Montorio y Tempietto de Bramante |
| 18:50 | Fontana dell'Acqua Paola | 10 | - | documento: hora 19:10 → atardecer |
| 19:30 | Mirador del Janículo | 30 | - | documento: hora 20:05 → atardecer |
| 20:45 | Cena: Trattoria Da Enzo al 29 |  | mesa | documento: hora 21:15 → atardecer |
| 22:45 | Fontana de Trevi (noche) | 15 | noche | documento: hora 23:20 → atardecer |
| (19:30) | La Passeggiata del Gianicolo | 15 | - | quitada: atardecer |

### Día 3 · jueves 2027-04-15 · DM-medio Medio día de Monti

Variantes: D, manana, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 09:00 | Fontana de Trevi | 5 | de camino |  |
| 09:20 | Plaza del Quirinal (la vista de San Pedro) | 15 | - |  |
| 09:40 | Pasea y piérdete por Monti (Via Panisperna y la Piazza Madonna dei Monti) | 60 | - |  |
| 11:00 | San Pietro in Vincoli (el Moisés de Miguel Ángel) | 20 | dentro |  |
| 11:40 | Basílica de Santa María la Mayor | 40 | dentro |  |
| 12:45 | Comida: Trattoria Monti | 60 | mesa |  |

## Viaje 21: 2,5 días (simulación 3, verano): jueves 15 (tarde), viernes 16 y sábado 17 de julio de 2027

### Día 1 · jueves 2027-07-15 · DT-medio Medio día del Tridente y el Pincio

Variantes: D, tarde

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 16:00 | Plaza de España | 20 | - |  |
| 16:30 | Via del Babuino y Via Margutta | 10 | de camino |  |
| 16:55 | Piazza del Popolo | 15 | - |  |
| 17:25 | Santa Maria del Popolo (los Caravaggio) | 20 | dentro |  |
| 18:05 | Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines | 110 | - | documento: min 90 → atardecer |
| 20:20 | Terraza del Pincio | 30 | - | documento: hora 19:55 → atardecer |
| 21:15 | Trinità dei Monti y su mirador sobre la Plaza de España | 10 | por fuera | documento: hora 20:45 → atardecer |
| 21:25 | Bajar la escalinata de la Plaza de España | 5 | de camino | documento: hora 21:00 → atardecer |
| 21:50 | Cena: Il Gabriello |  | mesa | documento: hora 21:20 → atardecer |
| 23:23 | Un taxi, unos 12 min | 12 | taxi |  |
| 23:50 | Coliseo (noche) | 20 | noche | documento: hora 23:20 → atardecer |

**Avisos**

- Verano en Roma: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.

### Día 2 · viernes 2027-07-16 · D1 Día de la Roma antigua

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 30 | - |  |
| 19:40 | Campo de' Fiori | 20 | - |  |
| 20:20 | Ponte Sisto | 25 | - | documento: hora 20:15 → atardecer |
| 21:10 | Cena: Trattoria Da Enzo al 29 |  | mesa | documento: hora 21:00 → atardecer |
| 23:15 | Fontana de Trevi (noche) | 20 | noche | documento: hora 23:05 → atardecer |

### Día 3 · sábado 2027-07-17 · D2 Día del Vaticano y Trastevere

Variantes: D, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:30 | Pasea y piérdete por Trastevere | 60 | - |  |
| 18:45 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 19:05 | Fontana dell'Acqua Paola | 10 | - |  |
| 19:25 | La Passeggiata del Gianicolo | 45 | - | documento: min 15 → atardecer |
| 20:20 | Mirador del Janículo | 30 | - | documento: hora 20:00 → atardecer |
| 21:15 | Cena: Tonnarello |  | mesa | documento: hora 21:00 → atardecer |
| 23:00 | Trastevere de noche | 30 | noche | documento: hora 22:40 → atardecer |

## Viaje 22: 2,5 días (simulación 4, otoño): martes 12 y miércoles 13 enteros y jueves 14 de octubre de 2027 por la mañana

### Día 1 · martes 2027-10-12 · D2 Día del Vaticano y Trastevere

Variantes: B, normal

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro | 20 | - |  |
| 12:05 | Basílica de San Pedro | 75 | dentro |  |
| 13:40 | Comida: Borghiciana Pastificio Artigianale | 60 | mesa |  |
| 14:45 | Via della Conciliazione | 10 | de camino |  |
| 15:15 | Castillo de Sant'Angelo | 20 | por fuera |  |
| 15:50 | Puente Sant'Angelo | 15 | - |  |
| 16:20 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 16:55 | Iglesia de Santa Maria in Trastevere | 25 | dentro |  |
| 17:35 | San Pietro in Montorio y Tempietto de Bramante | 5 | de camino |  |
| 17:55 | Fontana dell'Acqua Paola | 10 | - |  |
| 18:25 | Mirador del Janículo | 30 | - |  |
| 19:20 | Pasea y piérdete por Trastevere iluminado | 30 | - |  |
| 20:15 | Cena: Tonnarello |  | mesa |  |
| 21:55 | Trastevere de noche | 30 | noche |  |

**Avisos**

- Otoño en Roma: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

### Día 2 · miércoles 2027-10-13 · D1 Día de la Roma antigua

Variantes: B, normal, AB

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:40 | Plaza Venecia | 5 | de camino |  |
| 13:00 | Altar de la Patria | 30 | dentro |  |
| 13:50 | Comida: Nonna Betta | 60 | mesa |  |
| 15:00 | Barrio Judío | 30 | - |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |  |
| 15:55 | Largo di Torre Argentina | 15 | - |  |
| 16:25 | Iglesia del Gesù | 20 | dentro |  |
| 16:55 | Elefantino de Bernini | 5 | de camino |  |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 5 | de camino |  |
| 17:20 | Iglesia de San Luigi dei Francesi | 20 | dentro |  |
| 17:55 | Panteón | 40 | dentro |  |
| 18:50 | Piazza Navona | 45 | - |  |
| 20:00 | Cena: Armando al Pantheon |  | mesa |  |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| 22:30 | Plaza de España (noche) | 20 | noche |  |

### Día 3 · jueves 2027-10-14 · DT-medio Medio día del Tridente y el Pincio

Variantes: B, manana, unica

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 07:45 | Fontana de Trevi | 20 | - |  |
| 08:25 | Desayuno cerca de la Plaza de España | 30 | - |  |
| 09:10 | Plaza de España | 20 | - |  |
| 09:35 | Via del Babuino y Via Margutta | 10 | de camino |  |
| 10:00 | Piazza del Popolo | 20 | - |  |
| 10:35 | Santa Maria del Popolo (los Caravaggio) | 20 | dentro |  |
| 11:15 | Terraza del Pincio (la vista de San Pedro con la luz de la mañana) | 20 | - |  |
| 11:45 | Pasea y piérdete por los Jardines del Pincio | 20 | - |  |
| 12:25 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | dentro |  |
| 12:45 | Bajar la escalinata de la Plaza de España | 5 | de camino |  |
| 12:50 | Via Condotti | 10 | de camino |  |
| 13:15 | Comida: Poldo e Gianna Osteria | 60 | mesa |  |

## Viaje 23: 2,5 días (simulación 5, Navidad, con Mercadillos): viernes 17 (tarde), sábado 18 y domingo 19 de diciembre de 2027

### Día 1 · viernes 2027-12-17 · DT-medio Medio día del Tridente y el Pincio

Variantes: A, tarde_A_de_invierno, unica, experiencia:mercadillos_navidenos

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 15:00 | Plaza de España | 20 | - |  |
| 15:35 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | dentro |  |
| 16:15 | Terraza del Pincio | 30 | - |  |
| 17:05 | Santa Maria del Popolo (los Caravaggio) | 20 | dentro |  |
| 17:40 | Piazza del Popolo | 20 | - |  |
| 18:05 | Via del Babuino y Via Margutta | 10 | de camino |  |
| 18:35 | Luces de Navidad del Tridente | 30 | - | documento: hora 18:25, min 40, título Pasea y piérdete por Via Condotti y el Tridente iluminados → experiencia: mercadillos_navidenos |
| 19:20 | Cena: Il Gabriello |  | mesa |  |
| 20:53 | Un taxi, unos 12 min | 12 | taxi |  |
| 21:20 | Coliseo (noche) | 20 | noche |  |

**Avisos**

- Navidad en Roma: ¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.

**Avisos de fechas especiales del viaje**

- 2027-12-18 Mercadillo de Navidad en Piazza Navona: Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad.

### Día 2 · sábado 2027-12-18 · D2 Día del Vaticano y Trastevere

Variantes: A, normal, experiencia:mercadillos_navidenos

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | dentro |  |
| 11:30 | Plaza de San Pedro y los 100 Presepi | 40 | - | documento: min 20, título Plaza de San Pedro → experiencia: mercadillos_navidenos |
| 12:25 | Basílica de San Pedro | 75 | dentro | documento: hora 12:05 → experiencia: mercadillos_navidenos |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 | mesa | documento: hora 13:40 → experiencia: mercadillos_navidenos |
| 15:20 | Via della Conciliazione | 10 | de camino | documento: hora 15:00 → experiencia: mercadillos_navidenos |
| 15:50 | Castillo de Sant'Angelo | 20 | por fuera | documento: hora 15:30 → experiencia: mercadillos_navidenos |
| 16:25 | Puente Sant'Angelo | 15 | - | documento: hora 16:05 → experiencia: mercadillos_navidenos |
| 16:50 | Bus 23 por el Lungotevere, unos 20 min | 20 | bus/metro |  |
| 17:25 | Isla Tiberina | 20 | - | documento: hora 17:05 → experiencia: mercadillos_navidenos |
| 18:05 | Iglesia de Santa Maria in Trastevere | 25 | dentro | documento: hora 17:45 → experiencia: mercadillos_navidenos |
| 18:45 | Pasea y piérdete por Trastevere iluminado | 60 | - | documento: hora 18:20, min 80 → experiencia: mercadillos_navidenos |
| 20:00 | Cena: Tonnarello |  | mesa |  |
| 22:00 | Piazza Navona (noche) | 30 | noche |  |

### Día 3 · domingo 2027-12-19 · D1 Día de la Roma antigua

Variantes: A, normal, AB, experiencia:mercadillos_navidenos

| Hora | Parada | Min | Cómo | Cambio |
|---|---|---|---|---|
| 08:30 | Coliseo | 75 | dentro |  |
| 10:05 | Arco de Constantino | 10 | - |  |
| 10:30 | Foro Romano y Palatino | 90 | dentro |  |
| 12:20 | Plaza del Campidoglio | 15 | - |  |
| 12:35 | Santo Bambino de Aracoeli | 5 | de camino | nueva: experiencia: mercadillos_navidenos |
| 12:45 | Plaza Venecia | 5 | de camino | documento: hora 12:40 → experiencia: mercadillos_navidenos |
| 13:05 | Altar de la Patria | 30 | dentro | documento: hora 13:00 → experiencia: mercadillos_navidenos |
| 13:55 | Comida: Nonna Betta | 60 | mesa | documento: hora 13:50 → experiencia: mercadillos_navidenos |
| 15:10 | Barrio Judío | 30 | - | documento: hora 15:00 → experiencia: mercadillos_navidenos |
| 15:45 | Fuente de las Tortugas | 5 | de camino | documento: hora 15:35 → experiencia: mercadillos_navidenos |
| 16:05 | Largo di Torre Argentina | 15 | - | documento: hora 15:55 → experiencia: mercadillos_navidenos |
| 16:35 | Iglesia del Gesù | 20 | dentro | documento: hora 16:25 → experiencia: mercadillos_navidenos |
| 17:00 | Elefantino de Bernini | 5 | de camino | documento: hora 16:55 → experiencia: mercadillos_navidenos |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 5 | de camino | documento: hora 17:00 → experiencia: mercadillos_navidenos |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 | dentro | documento: hora 17:20 → experiencia: mercadillos_navidenos |
| 18:05 | Panteón | 40 | dentro | documento: hora 17:55 → experiencia: mercadillos_navidenos |
| 19:05 | Piazza Navona y su mercadillo navideño | 40 | - | documento: hora 18:50, min 45, título Piazza Navona → experiencia: mercadillos_navidenos |
| 20:00 | Cena: Pizzeria Da Baffetto |  | mesa | restaurante: Armando al Pantheon cierra ese día o a esa hora: va Pizzeria Da Baffetto |
| 21:50 | Fontana de Trevi (noche) | 20 | noche |  |
| 22:30 | Plaza de España (noche) | 20 | noche |  |

