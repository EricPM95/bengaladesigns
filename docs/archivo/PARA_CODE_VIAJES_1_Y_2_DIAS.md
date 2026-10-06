# Viajes de 1 y 2 días: por fuera, salvo lo marcado

Commit por parte y sin push. Comprueba con las 365 fechas.

## A INVARIANTES (todos los destinos)

**Viaje de 1 día:**
- Todo por fuera. No se entra en ningún sitio: en un día no da tiempo.
- Una parada con entrada solo va por dentro si el viajero la marcó en el pool (en Roma, por ejemplo, los Museos Vaticanos).
  - **Con fechas:** si ese sitio cierra ese día, sale el aviso.
  - **Sin fechas:** sale igualmente, porque no se puede saber.
- Si el viajero añade una reserva, la ruta se adapta solo a esa reserva, y lo demás sigue por fuera.

**Viaje de 2 días (Roma):**
- **Sin nada marcado en el pool:** el Coliseo, con el Foro y el Palatino, y el Panteón por dentro. Todo lo demás, por fuera.
- **Lo marcado en el pool va por dentro:**
  - el Coliseo, con el Foro y el Palatino;
  - los Museos Vaticanos.
- **Si se marcan los dos:** un día cada uno. En cada día se meten los imprescindibles del centro que quepan (Trevi, Panteón, Navona, Plaza de España…), por fuera salvo el Panteón.
- **Cierres:** siempre por fuera, sin complicarse.

**Viaje de 2,5 días** (o cualquier viaje con medio día de llegada por la tarde o de vuelta por la mañana):
- **El medio día sigue la regla de 1 día:** todo por fuera, salvo lo marcado en el pool.
- **Los días enteros van como un viaje de esos días:** en Roma, los 2 días enteros, como un viaje de 2 días.
- Lo que tiene entrada va siempre en los días enteros, nunca en el medio día.

## Qué hacer

1. Revisa los viajes de 1, 2 y 2,5 días que hay hoy (`short_trips` y los días escritos que usan) con estas reglas, y dime qué cambia en cada uno.
2. Pasa las 365 fechas, con y sin marcar Coliseo y Vaticanos en el pool.
3. **Informe:**
   - en rojo, arriba, cualquier fallo: hora fija rota, sitio cerrado o imprescindible quitado sin aviso;
   - los avisos de cierre que salen con fechas;
   - un ejemplo de 1 día y otro de 2 días, con sus horas.

Explícalo en español sencillo, sin jerga.
