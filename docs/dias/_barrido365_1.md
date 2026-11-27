# Prueba del motor de listas (Tanda 6)

397648 viajes (1066972 días) en 183 fechas desde el 2027-01-01, con y sin pool, Free Tour, reservas y experiencias. 15458 s.

**Fallos: 643.**

## Por regla

- orden: 643
- cerrado: 0
- zigzag: 0
- piramide: 0
- dentro_dos_veces: 0
- restaurante_repetido: 0
- noche_repetida: 0
- reserva: 0
- comida_tarde: 0
- comida_tras_hora_fija: 0
- dia_empieza_tarde: 0
- cerrado_a_la_llegada: 0
- camino_en_sobra: 0
- lluvia: 0
- sin_explicar: 0
- pool: 0
- paradas_perdidas: 0
- paradas_nuevas: 0
- reserva_sin_su_dia: 0
- sin_plan: 0

## Lo que se apunta (no es un fallo)

- sobra_tiempo_sin_reserva: 190517
- no_cabe_del_todo: 12324
- sobra_por_fila_de_reserva: 173571
- sobra_cierre: 4692
- sobra_documento: 2340
- comida_tarde: 2154
- orden_dias_cierre: 22289
- reserva_en_dia_sin_ciudad: 34404
- reserva_grande_en_dia_cerrado: 4403
- paradas_de_mas_por_el_hueco: 10901
- cambio_de_d1_por_festivo: 2
- cambio_por_variante_de_cierre_del_documento: 4237
- parada_cerrada_por_reserva: 75
- restaurante_repetido: 949
- par_sin_los_dos_en_el_viaje: 1647

## Primeros fallos de cada regla

### orden (643)

- 2 días con Free Tour + reserva Coliseo 12:30 · inicio 2027-06-30 · 2027-07-01 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2 días con Free Tour + reserva Coliseo 12:30 · inicio 2027-07-01 · 2027-07-02 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2 días con Free Tour + reserva Coliseo 12:30 · inicio 2027-07-02 · 2027-07-03 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2,5 días con Free Tour, medio día de tarde + reserva Coliseo 12:30 · inicio 2027-06-29 · 2027-07-01 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2,5 días con Free Tour, medio día de tarde + reserva Coliseo 12:30 · inicio 2027-06-30 · 2027-07-02 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2,5 días con Free Tour, medio día de tarde + reserva Coliseo 12:30 · inicio 2027-07-01 · 2027-07-03 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2,5 días con Free Tour, medio día de mañana + reserva Coliseo 12:30 · inicio 2027-06-30 · 2027-07-01 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2,5 días con Free Tour, medio día de mañana + reserva Coliseo 12:30 · inicio 2027-07-01 · 2027-07-02 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 2,5 días con Free Tour, medio día de mañana + reserva Coliseo 12:30 · inicio 2027-07-02 · 2027-07-03 D1-FT: el orden del día no es el de su lista (Plaza del Campidoglio → Altar de la Patria → Foro Romano y Palatino → Arco de Constantino → La Taverna dei Fori Imperiali → Via dei Fori Imperiali…)
- 3 días + reserva Galería 13:00 · inicio 2027-01-04 · 2027-01-06 D4: el orden del día no es el de su lista (Fontana de Trevi, sin gente → Desayuno → Plaza de España → Escalinata y Trinità dei Monti → Via Condotti → Ara Pacis…)
- 3 días + reserva Galería 13:00 · inicio 2027-01-11 · 2027-01-13 D4: el orden del día no es el de su lista (Fontana de Trevi, sin gente → Desayuno → Plaza de España → Escalinata y Trinità dei Monti → Via Condotti → Ara Pacis…)
- 3 días + reserva Galería 13:00 · inicio 2027-01-18 · 2027-01-20 D4: el orden del día no es el de su lista (Fontana de Trevi, sin gente → Desayuno → Plaza de España → Escalinata y Trinità dei Monti → Via Condotti → Ara Pacis…)
