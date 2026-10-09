# Prueba de la Tanda 6h

6570 viajes (365 fechas de 2027) y 27390 parejas de sitios para las líneas de transporte.

**Fallos: 0.**

## Por regla

Ninguna.

## Lo que se apunta (no es un fallo)

- falta_coliseo_vaticano: 2
  - 2 días · inicio 2027-01-01: no sale el Coliseo (D1)
  - 3 días · inicio 2027-01-01: no sale el Coliseo (D1)
- orden_ok: 12453
- orden_coliseo_vaticano: 685
  - 4 días, interruptor en Roma · inicio 2027-01-01: el Coliseo (D1) cae en el día completo ninguno (no sale)
  - 4 días, interruptor en Roma · inicio 2027-01-08: el Vaticano (D2/D3) cae en el día completo 4
  - 4 días, interruptor en Roma · inicio 2027-01-15: el Vaticano (D2/D3) cae en el día completo 4
  - 4 días, interruptor en Roma · inicio 2027-01-22: el Vaticano (D2/D3) cae en el día completo 4
  - 4 días, interruptor en Roma · inicio 2027-01-29: el Vaticano (D2/D3) cae en el día completo 4
  - 4 días, interruptor en Roma · inicio 2027-02-05: el Vaticano (D2/D3) cae en el día completo 4

## Por qué el Coliseo o el Vaticano no caen en los 3 primeros días completos (desde 3,5 días)

- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 218 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 192 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D6: Castillo de Sant'Angelo cerrado) y el reparto por fechas lo manda al final · 106 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D6: Castillo de Sant'Angelo cerrado) y el reparto por fechas lo manda al final · 93 viajes
- el Vaticano (D2/D3): Museos Vaticanos y Capilla Sixtina cerrado; mala fecha del documento · 29 viajes
- el Coliseo (D1): el 25 de diciembre o el 1 de enero el D1 es el D1-corto (todo por fuera) · 6 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D4: Galería Borghese cerrado; D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 6 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D4: Galería Borghese cerrado; D6: Castillo de Sant'Angelo cerrado) y el reparto por fechas lo manda al final · 5 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D4: Ara Pacis cerrado; D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 4 viajes
- el Vaticano (D2/D3): mala fecha del documento · 3 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D6: Mercados de Trajano cerrado) y el reparto por fechas lo manda al final · 3 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D7: mala fecha del documento) y el reparto por fechas lo manda al final · 3 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: Museos Vaticanos y Capilla Sixtina cerrado; D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 2 viajes
- el Vaticano (D2/D3): Panteón cerrado; Museos Vaticanos y Capilla Sixtina cerrado; horario especial (01-01); mala fecha del documento · 2 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D4: Ara Pacis cerrado; D6: Castillo de Sant'Angelo cerrado) y el reparto por fechas lo manda al final · 2 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: mala fecha del documento; D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 2 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D3: horario especial (easter-3); D5: Termas de Caracalla cerrado) y el reparto por fechas lo manda al final · 2 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: mala fecha del documento; D6: Mercados de Trajano cerrado) y el reparto por fechas lo manda al final · 1 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D3: horario especial (easter-3); D6: Castillo de Sant'Angelo cerrado) y el reparto por fechas lo manda al final · 1 viajes
- el Coliseo (D1): Coliseo cerrado; Foro Romano y Palatino cerrado; Panteón cerrado; horario especial (01-01) · 1 viajes
- el Vaticano (D2/D3): no puede ir donde estaba por lo de otros días de su fecha (D7: mala fecha del documento) y el reparto por fechas lo manda al final · 1 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D2: horario especial (easter-3); D6: Castillo de Sant'Angelo cerrado) y el reparto por fechas lo manda al final · 1 viajes
- el Coliseo (D1): horario especial (06-02); mala fecha del documento · 1 viajes
- el Coliseo (D1): no puede ir donde estaba por lo de otros días de su fecha (D6: Castillo de Sant'Angelo cerrado; D7: mala fecha del documento) y el reparto por fechas lo manda al final · 1 viajes

## Dónde salen los restaurantes nuevos de Trastevere

- Checco er Carettiere · D7 (comida): 157 viajes (por ejemplo, 6 días con Free Tour, interruptor en Roma · inicio 2027-01-01; 6 días con Free Tour, interruptor en Roma · inicio 2027-01-06)
- Da Lucia · D7 (comida): 168 viajes (por ejemplo, 6 días, interruptor en Roma · inicio 2027-01-05; 6 días, interruptor en Roma · inicio 2027-01-19)

## Parejas de sitios con línea, por línea

- Bus 23: 1489
- Bus 40 y 64: 3064
- Bus 64: 2408
- Metro A: 2666
- Metro B: 1416
- Tranvía 8: 3568

## Primeros fallos de cada regla
