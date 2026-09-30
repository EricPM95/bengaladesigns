# Resumen (30 de septiembre de 2026)

## 1. Ritmos: borrados del todo (subido)

- El motor no recibe ni mira ningún ritmo. Un solo modo. Fuera de los datos las variantes `tranquilo*`, `pace_texts`, `pace_stats` y el banner de tranquilo.
- Fuera del cliente la pantalla de ritmo y el cuestionario antiguo. Un viaje guardado con ritmo se abre igual: ese dato se ignora.
- INVARIANTES: borradas las reglas que solo eran de tranquilo (118, 138, 169, 175, 184, 234, 353, 366, 367, 368).

| Prueba | Completo de antes | Ahora |
|---|---|---|
| 365 fechas | 49 | **44** (los mismos 44 casos que con la ruta única de ayer; 22 son informativos) |
| Navidad | 0 | **0** |
| 56 viajes | 0 peor | **0 peor** (4 mejor, 52 igual) |

La prueba de las 365 fechas tarda **7 min 45 s** (6.180 viajes). Con los dos ritmos eran el doble de viajes.

Subido hasta `5728bb8`.

## 2. Fin de Año (hecho, sin subir)

Detalle en `docs/INFORME_NAVIDAD.md`, punto 8. Regla 404.

- El aviso de Nochevieja ya no promete fuegos. Lleva el concierto del Circo Máximo como sugerencia aparte, con la vuelta en metro.
- El 1 de enero empieza a las 10:00 si el 31 está en el viaje.
- Prueba: 0 en buses tras las 21:00, última entrada y fuegos. **4 casos** de un 1 de enero antes de las 10:00.

## Para decidir

1. **Viaje 31 dic-1 ene de 2 días.** El 1 de enero le toca Roma Antigua. Desde las 10:00 la comida se va a las 15:00 y el centro queda de noche. Lo he dejado a las 8:30. Tres salidas en el informe.
2. **El concierto** va como frase del aviso del 31, no como parada de la ruta. Si lo quieres como parada de la noche, dímelo.
3. **Free Tour en festivos:** espero tus días y horas.
