# Prueba de la Tanda 6k

4483 viajes y 19744 días montados con el motor del servidor (13 fechas de 2027 y los 12 meses sin fechas).

**Fallos: 0.**

## Por regla

Ninguna.

## Lo que se apunta (no es un fallo)

- d3_orden_ok: 26
- cambio_de_dos_dias: 3339
- cambio_de_mas_de_dos_dias_por_cierres: 504
  - 3 días · inicio 2027-01-01 · Galería Borghese el día 2 a las 09:00: D1,D2,D4 → D2,D4,D1
  - 3 días · inicio 2027-01-01 · Galería Borghese el día 2 a las 12:00: D1,D2,D4 → D2,D4,D1
  - 3 días · inicio 2027-01-01 · Galería Borghese el día 2 a las 15:00: D1,D2,D4 → D2,D4,D1
  - 3 días · inicio 2027-01-31 · Coliseo el día 2 a las 09:00: D1,D2,D4 → D4,D1,D2
  - 3 días · inicio 2027-01-31 · Coliseo el día 2 a las 12:30: D1,D2,D4 → D4,D1,D2
  - 3 días · inicio 2027-01-31 · Coliseo el día 2 a las 15:00: D1,D2,D4 → D4,D1,D2

## Primeros fallos de cada regla
