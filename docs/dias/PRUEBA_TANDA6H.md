# Prueba de la Tanda 6h

6570 viajes (365 fechas de 2027) y 27060 parejas de sitios para las líneas de transporte.

**Fallos: 0.**

## Por regla

Ninguna.

## Lo que se apunta (no es un fallo)

- orden_ok: 13095
- orden_coliseo_vaticano: 45
  - 4 días, interruptor en Roma · inicio 2027-01-01: el Coliseo (D1) cae en el día completo 4
  - 4 días, interruptor en Roma · inicio 2027-12-24: el Coliseo (D1) cae en el día completo 4
  - 4 días, interruptor en Roma · inicio 2027-12-31: el Coliseo (D1) cae en el día completo 4
  - 4 días con Free Tour, interruptor en Roma · inicio 2027-01-01: el Coliseo (D1) cae en el día completo 4
  - 4 días con Free Tour, interruptor en Roma · inicio 2027-12-24: el Coliseo (D1) cae en el día completo 4
  - 4 días con Free Tour, interruptor en Roma · inicio 2027-12-31: el Coliseo (D1) cae en el día completo 4

## Por qué el Coliseo o el Vaticano no caen en los 3 primeros días completos (desde 3,5 días)

- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D7: mala fecha del documento) y el reparto por fechas lo manda al final · 8 viajes
- el Coliseo (D1): Coliseo cerrado; Foro Romano y Palatino cerrado; Panteón cerrado · 5 viajes
- el Coliseo (D1): Coliseo cerrado; Foro Romano y Palatino cerrado; mala fecha del documento · 5 viajes
- el Coliseo (D1): Coliseo cerrado; Foro Romano y Palatino cerrado · 5 viajes
- el Vaticano (D2/D3): Museos Vaticanos y Capilla Sixtina cerrado; Castillo de Sant'Angelo cerrado (se ve por fuera); mala fecha del documento · 4 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D4: Galería Borghese cerrado; D5: Termas de Caracalla cerrado (el día tiene su versión)) y el reparto por fechas lo manda al final · 4 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D3: Panteón cerrado; D5: Termas de Caracalla cerrado (el día tiene su versión)) y el reparto por fechas lo manda al final · 3 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D7: mala fecha del documento) y el reparto por fechas lo manda al final · 3 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: Museos Vaticanos y Capilla Sixtina cerrado; D5: Termas de Caracalla cerrado (el día tiene su versión)) y el reparto por fechas lo manda al final · 2 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: Museos Vaticanos y Capilla Sixtina cerrado) y el reparto por fechas lo manda al final · 2 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: Museos Vaticanos y Capilla Sixtina cerrado; D7: mala fecha del documento) y el reparto por fechas lo manda al final · 2 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D3: Panteón cerrado) y el reparto por fechas lo manda al final · 1 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D3: Panteón cerrado; D7: mala fecha del documento) y el reparto por fechas lo manda al final · 1 viajes

## Dónde salen los restaurantes nuevos de Trastevere

- Checco er Carettiere · D7 (comida): 161 viajes (por ejemplo, 5 días con Free Tour, interruptor en Roma · inicio 2027-01-07; 5 días con Free Tour, interruptor en Roma · inicio 2027-01-14)
- Da Lucia · D7 (comida): 801 viajes (por ejemplo, 5 días, interruptor en Roma · inicio 2027-01-06; 5 días, interruptor en Roma · inicio 2027-02-10)

## Parejas de sitios con línea, por línea

- Bus 23: 1489
- Bus 40 y 64: 2986
- Bus 64: 2352
- Metro A: 2582
- Metro B: 1416
- Tranvía 8: 3514

## Primeros fallos de cada regla
