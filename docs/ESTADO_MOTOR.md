# Estado del motor nuevo — resumen para CHAT

Contexto: implementación del Prompt 9 (flexibilización del algoritmo de rutas) en Viajes Bengala.
Este documento resume qué está hecho, qué falta y qué decisiones se tomaron. Todo local, **nada
pusheado todavía** (7 commits).

---

## ENTREGA A — cerrada ✅

1. **Etiquetas desde los `tags` del JSON** en vez de adivinarlas con regex sobre el nombre.
   `Fontana de Trevi → Fuente · Monumento`, `Panteón → Monumento · Iglesia`, `Piazza Navona → Plaza`.
   Corrección al diagnóstico del prompt: no era culpa del camino separado de los viajes de 1 día —
   estaba roto igual en todas las duraciones.
2. **Pool de excursiones por duración y ritmo**: completo 3/5/7, tranquilo 2/3/5.
3. **`destination_config`** en roma.json: `core_days: 4`, `max_auto_days: 7`.
4. **Taxonomía**: 11 iglesias estaban archivadas como `museos_arte` y salían en el mapa con la
   paleta de museo. Ahora tienen categoría y pin propios (⛪), dentro del mismo chip "Atracciones".
   Los `tags` en cambio estaban bien: ninguna iglesia lleva "museo", y el "arte" que llevan es
   cierto (San Luigi tiene tres Caravaggios). El error vivía en `filter_category`.

---

## ENTREGA B — motor nuevo, a mitad

### Hecho: el reparto (`server/engine/`)

- **`units.js`** — 67 lugares → **59 unidades** indivisibles. Un `group` del JSON es una sola cosa,
  así que "Coliseo y Foro van el mismo día" y "el orden del grupo no se altera" son imposibles de
  incumplir, no reglas escritas. `contained_in` **no** fusiona (sería una unidad de 330 min que
  obliga a ver el zoo y la Galería Borghese el mismo día): es adyacencia.
- **`modeConfig.js`** — completo y tranquilo como datos, nunca como ramas de código.
- **`preplan.js`** — función pura que reparte el viaje entero y que cada llamada recalcula. Cascada
  pool → experiencias → nivel 1 → nivel 2 → nivel 3, con desalojo, tope por categoría y rescate de
  imprescindibles.
- **`__tests__/verifyPreplan.mjs`** — 336 días (7 duraciones × 2 ritmos × free tour × 3 pools):
  0 repetidos, 0 presupuestos rotos, 0 cierres incumplidos, 0 imprescindibles perdidos teniendo
  sitio, 0 topes de categoría superados, determinismo comprobado.

### Lo que ya se arregló de verdad

- **El pool entra también en viajes de 2 días** (antes se descartaba en silencio) y la franja
  **adopta su zona**: elegir la Galería Borghese convierte el día 1 en una mañana de Villa Borghese.
- **Las experiencias cambian la espina dorsal del día.** Era el bug estructural que justificaba la
  reescritura: elegir "Arte y museos" no metía ni un museo porque los intereses solo ordenaban el
  relleno y el núcleo venía fijo del reparto curado.
- **Tope por categoría**: 2 museos por día como mucho. Un día de arte queda museo + barrio + plaza +
  segundo museo + mirador.
- **Aviso en vez de silencio**: lo que el viajero pidió y no cupo sale con su motivo
  (`no_room`, `no_room_long_visit`, `closed_every_day`).

### Fallos encontrados al trazar rutas reales (ninguno lo habría pillado un typecheck)

1. `closed_on` es un **array** y el parser solo leía cadenas: la regla se quedaba muda — cero
   lugares cerrados, ningún error, los Museos Vaticanos programados un domingo.
2. Cobrar trayecto y redondeo a **todas** las paradas hacía que el Vaticano (285 min) costara 307
   contra un presupuesto de 300: **un viaje de 3 días a Roma se quedaba sin Vaticano**.
3. Sin penalización por zona lejana el relleno se dispersaba: el día "de Roma Antigua" contenía la
   Galería Borghese, a 4 km.
4. El colocador elegía la mejor franja y **se rendía si no cabía** en vez de probar la siguiente.
5. Con "Arte y museos" en 3 días **se caía el Coliseo**: las tres jornadas se quedaban con su visita
   larga y no le quedaba día. Choque real entre "experiencias > nivel 1" y NEVER_MISS_LANDMARKS.
6. El primer rescate sacrificaba **otro imprescindible** (cambiaba el Coliseo por el Vaticano), y
   solo sabía expulsar visitas largas, así que meter 210 minutos sacando una de 120 seguía sin caber.

### Cómo probarlo (bandera)

El motor nuevo está enchufado **detrás de bandera**, así que la app sigue sirviendo el viejo por
defecto. Para compararlos sobre la misma ruta:

```
node server/engine/__tests__/compararMotores.mjs 4 nonstop
node server/engine/__tests__/compararMotores.mjs 6 tranquilo
node server/engine/__tests__/compararMotores.mjs 3 nonstop "Galería Borghese"
```

Para que la app entera use el nuevo: `ROUTE_ENGINE=nuevo` en `.env.local` y reiniciar el servidor.
Para una sola petición, `"engine": "nuevo"` en el cuerpo de `/api/generate-day-block`.

Primeros números sobre Roma 4 días, ritmo completo: **34 paradas el viejo frente a 29 el nuevo**
(menos relleno compulsivo, que es lo que se buscaba) y **13 horas sueltas frente a 0**. En 6 días el
viejo no devuelve nada —cae a Claude— y el nuevo monta los 5 días de contenido gratis.

### Falta

- **Constructor del día**: orden geográfico dentro de la franja, horas con redondeo a :00/:30 hacia
  arriba, encadenado por debajo de 3 minutos, clamp de horarios de apertura, comidas en ventana.
- **Paseo nocturno encadenado**: hasta 3 experiencias nocturnas a menos de 900 m, ordenadas desde la
  cena. Medido: Fontana ↔ Panteón 588 m, Fontana ↔ Plaza de España 572 m, Plaza de España ↔ Pincio
  678 m — el paseo clásico sale solo. Coliseo (1,4 km al más cercano) y Janículo (1,6-2,7 km) no
  encadenan con nada y se quedan como experiencia única de su noche.
- **Enchufarlo en `generate-day-block`** y pasar el harness completo, ampliado a 1 día y 6-7 días.
- Los 3 miradores de doble uso aún no están escritos en `night_experiences`.

---

## Decisiones tomadas por el usuario

| tema | decisión |
|---|---|
| Desalojo del pool contra nivel 1 | el nivel 1 se mueve de día, nunca se borra |
| Día/noche | `allow_same_day` en las 7 nocturnas; en viajes de 3+ días la nocturna se reserva para otra noche si el lugar se vio de día |
| Encadenado nocturno | hasta 3, por geografía, desde la zona de cena |
| `zone_priority` | conviven: pool > reparto curado > zone_priority |
| Días sin tarde en tranquilo | rellenar hasta las 16:00 mínimo; si sobra, candidato a excursión de medio día |
| Horarios por día de la semana | solo internos; la UI muestra el horario simple + alerta si el día cae en cierre |
| Pool de lugares | se queda en 5/7/10 para ambos ritmos, con aviso cuando no quepa |

---

## Números que conviene tener delante

- **5 unidades largas** en Roma (Vaticano 285', Roma Antigua 210', Borghese 120', Bioparque 120',
  Capitolinos 120'). Con una por día, verlas todas exige 5 días.
- **3 de ellas son nivel 1**, así que a partir de 3 días caben todas.
- Fuera del reparto curado a Roma le quedan **10 lugares en 5 zonas**: los días 5-7 no se pueden
  llenar de contenido nuevo. `core_days: 4` es correcto y la repetición es la única salida.
- Densidad actual del reparto: **7,5 paradas/día** de media (9-10 en completo, 5-6 en tranquilo).
