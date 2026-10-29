# Tabla de la prueba de dos cuentas reales (Supabase real) · 2026-10-29T07:04:37.739Z

| Caso | ¿Llega? | ¿Aviso nuevo? | Frase | Franja | Franjas | Sonidos | Tarda (s) | Eventos Realtime |
|---|---|---|---|---|---|---|---|---|
| quitar un día | sí | sí | Eric ha quitado el sábado 14. | Eric ha quitado el sábado 14 | 1 | 1 | 0.6 | trips 1 · avisos 1 |
| cambiar el orden de los días | sí | sí | Eric ha cambiado el orden de los días. | Eric ha cambiado el orden de los días | 1 | 1 | 0.3 | trips 1 · avisos 1 |
| añadir un restaurante | sí | sí | Eric ha añadido Da Enzo al jueves 12. | Eric ha añadido un sitio | 1 | 1 | 0.4 | trips 1 · avisos 1 |
| añadir sitios | sí | sí | Eric ha añadido Castel Sant'Angelo y 2 sitios más al miércoles 11. | Eric ha añadido 3 sitios | 1 | 1 | 0.7 | trips 1 · avisos 1 |
| quitar el Free Tour | sí | sí | Eric ha quitado el Free Tour. | Eric ha quitado el Free Tour | 1 | 1 | 0.7 | trips 1 · avisos 1 |
| dos seguidos · primero (añadir Pincio al día 3) | sí | sí | Eric ha añadido Gianicolo al viernes 13. | Eric ha añadido un sitio | 1 | 1 | 0.3 | trips 1 · avisos 1 |
| dos seguidos · segundo (quitar Trastevere) | sí | sí | Eric ha quitado Trastevere. | Eric ha quitado un sitio | 1 | 1 | 0.3 | trips 1 · avisos 1 |
| vuelo del invitado (solo para él) | NO | NO | — | no sale | 0 | 0 | — | avisos 0 |

Notas de la prueba (cuentas reales «Eric» administrador y «Viajes» con «Puede editar», creadas una sola vez; viaje de prueba borrado al acabar):
- Realtime está activo en `trips` y en `avisos` del Supabase real: en todos los casos llegaron los dos eventos al invitado (columna de eventos).
- Esta pasada es contra el Supabase real SIN la migración 0065 aplicada. Por eso: (a) la campana del invitado se queda con 1 solo aviso de cambios al final (el 0058 sustituye al anterior de menos de 2 minutos: es el «ese mismo aviso cambió»); (b) el vuelo del invitado «solo para él» no llega (0061: en cuenta conjunta no avisa a nadie). Con la 0065 aplicada, la prueba de PGlite (`pruebaTanda10N10_avisos.mjs`) da: 3 avisos distintos para 3 cambios seguidos, y «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.» al administrador. Después de aplicarla: `node scripts/destino/pruebaTanda10N10_avisos_real.mjs --con0065 --tabla`.
- «Suena» cuenta las veces que la franja pidió el sonido (`window.__sonidosPedidos`); que el altavoz del móvil lo reproduzca depende de su audio (ver informe).
