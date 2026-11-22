# Prueba de la Tanda 6g

4529 viajes (4, 5 y 6 días, 365 fechas de 2027, con y sin Free Tour, con el interruptor del día 4 en Roma y en Excursión) y las excursiones de los datos.

**Fallos: 7.**

## Por regla

- noche_vista_ese_dia: 7

## Lo que se apunta (no es un fallo)

- noches_con_otro_orden: 2900
- noches_con_noche_especial: 104

## Primeros fallos de cada regla

### noche_vista_ese_dia (7)

- 4 días con Free Tour · inicio 2027-12-23 · interruptor en Excursión · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
- 5 días con Free Tour · inicio 2027-01-11 · interruptor en Roma · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
- 5 días con Free Tour · inicio 2027-01-12 · interruptor en Roma · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
- 6 días con Free Tour · inicio 2027-01-11 · interruptor en Roma · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
- 6 días con Free Tour · inicio 2027-01-11 · interruptor en Excursión · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
- 6 días con Free Tour · inicio 2027-01-12 · interruptor en Roma · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
- 6 días con Free Tour · inicio 2027-01-12 · interruptor en Excursión · día 3 D4: la nocturna «Plaza de España (noche)» es un sitio visto ese día («Plaza de España»)
