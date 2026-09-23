# Revisión de horarios — pendientes

Lista de lo que hay que confirmar en la revisión completa de horarios de Roma (después del motor v3).
El `schedule` del JSON no lleva días de la semana ni festivos: esa información vive aquí hasta que
se decida cómo modelarla.

## Horarios añadidos el 2026-09-23 (por confirmar)

| Lugar | schedule | last_entry | Fuente |
|---|---|---|---|
| Altar de la Patria (Vittoriano) | 09:30-19:30 | 18:45 | Web oficial. Abre todos los días |
| Basílica de Santa María la Mayor | 07:00-19:00 | 18:30 | Guía fiable. No cierra a mediodía |
| Iglesia de San Pietro in Vincoli | 08:00-12:30 / 15:00-18:00 | — | Guía fiable. En verano la tarde llega a las 19:00; se usa 18:00 todo el año |
| Iglesia de Santa Maria della Vittoria | 08:30-12:00 / 15:30-18:00 | — | Guía fiable |

Los cuatro estaban marcados `type: "exterior"` sin horario, así que el motor los trataba como
abiertos siempre (el Altar salía a las 08:15). Pasan a `interior` con `is_free_access: true`: son
gratis, y sin ese campo el cambio de tipo los habría metido en el filtro "Entradas".

## Información que el `schedule` no puede llevar

- **Santa Maria della Vittoria**: no se visita durante las misas — domingos y festivos a las 10:30
  y a las 12:00.
- **San Pietro in Vincoli**: tarde hasta las 19:00 en verano.

## Otros pendientes

- **Domus Aurea**: sin horario legible ("Solo Vie-Sáb-Dom, visita guiada con reserva"). El motor v3
  le aplica el horario por defecto de interiores (09:00-17:00) hasta tener el real.
- ~~`groups.roma_antigua_core`: dos órdenes distintos~~ — resuelto el 2026-09-23: manda
  `groups.<id>.order` (Arco → Coliseo → Foro) y el `group_order` de cada lugar se ha igualado.
- **Parques**: la instrucción sobre Villa Borghese y el Jardín de los Naranjos llegó cortada; pendiente.
