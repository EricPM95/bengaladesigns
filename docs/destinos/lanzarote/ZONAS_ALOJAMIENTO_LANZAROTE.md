# Lanzarote · las zonas de alojamiento y el pase (propuesta, 3-nov-2026)

En Roma, las zonas del pase son Centro, Plaza de España, Prati, Trastevere, Termini, Monti y «Aún no lo sé» (`roma.json › destination_config.zonas_alojamiento`). **En Lanzarote, en su lugar:**

| id | Nombre | Debajo | Coordenadas (centro aprox.) ⚠️ |
|---|---|---|---|
| `puerto_del_carmen` | Puerto del Carmen | Tías | 28.920, -13.665 |
| `playa_blanca` | Playa Blanca | Yaiza, el sur | 28.863, -13.830 |
| `costa_teguise` | Costa Teguise | Teguise, la costa | 28.998, -13.495 |
| `arrecife` | Arrecife | la capital | 28.963, -13.550 |
| `norte` | El norte | Haría, Arrieta, Órzola | 29.140, -13.480 |
| `interior` | El interior | Teguise, La Geria, Yaiza, Tinajo, Famara | 29.030, -13.640 |
| `nose` | Aún no lo sé | — | (la ruta gratis: desde la zona más lejana a cada día) |

## Qué hace el pase con la zona, en Lanzarote

En Roma, la zona solo adapta el primer y el último día (decisión del 29-oct). **En Lanzarote cambia todos los días, porque el coche lo cambia todo**, y así lo dirá el pase (verdad):
1. **La hora de salir** cada mañana, con los minutos en coche desde tu zona hasta la primera parada (y la vuelta al final).
2. **El orden del recorrido, al revés cuando sale más corto** desde tu zona (por ejemplo, el día de Teguise desde Playa Blanca), siempre que no rompa un turno con hora (Timanfaya, la Cueva) ni una última entrada. Code lo calcula con los tiempos de Mapbox de la LZ1 y lo enseña en una tabla para que Eric lo apruebe.
3. **La cena cerca de tu zona**, con su restaurante (2-3 por zona, en `RESTAURANTES_LANZAROTE.md`, «Cenas cerca del alojamiento, por zona»).
4. **El día que se recorta** si uno queda demasiado lejos (más de 3 h de coche desde tu zona): se avisa y se propone.

**Sin pase**, la ruta es la misma para todos (pensada para la zona más lejana a cada día), sin hora de salida ni cena por zona: «Cena cerca de tu alojamiento».

## El texto del pase (verdad)
- Roma: «Adaptamos tu primer y tu último día a donde duermes».
- **Lanzarote: «Adaptamos cada día a donde duermes: a qué hora salir, por dónde empezar y dónde cenar cerca».**
