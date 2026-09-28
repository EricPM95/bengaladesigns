# Días escritos: el formato (28 de septiembre de 2026)

Primer paso de `PROMPT_DIAS_ESCRITOS.md`. Aquí van el formato, los cortes de luz y cómo leer el borrador de D4 (`data/dias/roma/D4.json`). **El motor todavía no lee estos ficheros**: primero lo revisamos.

## 1. Los cortes de luz

Atardeceres de Roma en 2027, con el mismo cálculo que usa la app (`sunset.js`): del 16:39 (diciembre) al 20:49 (finales de junio).

Una tarde escrita aguanta lo que absorbe su parada elástica: ±30 min, es decir, unos 60 min de ancho. Con cortes a **17:40, 18:45 y 19:45**, las cuatro versiones salen casi iguales:

| Versión | Sol | Ancho | Días al año | Fechas |
|---|---|---|---|---|
| **A** · invierno | antes de las 17:40 | 60 min (16:39–17:39) | 105 | 31 oct – 12 feb |
| **B** · entretiempo corto | 17:40 – 18:44 | 64 min | 68 | 13 feb – 27 mar · 6 oct – 30 oct |
| **C** · entretiempo largo | 18:45 – 19:44 | 58 min | 48 | 28 mar – 9 abr · 1 sep – 5 oct |
| **D** · verano | desde las 19:45 | 64 min (19:45–20:49) | 144 | 10 abr – 31 ago |

- Cada tarde se escribe para el sol del **centro** de su versión (A 17:10, B 18:12, C 19:15, D 20:17). La elástica corrige ±30 min hacia cada lado.
- **Cambio de hora:** el 28 de marzo el sol salta de 18:30 a 19:31 (de B a C) y el 31 de octubre de 18:07 a 17:06 (de B a A). La prueba de las 365 fechas mira sobre todo esos días y los de frontera.
- Otros cortes que he probado:
  - 17:30 / 18:45 / 20:00: B y C salen de 74 min, más de lo que absorbe ±30.
  - 17:45 / 18:50 / 19:50: A sale de 65 min y B de 64.
  - Los de arriba son los más parejos.
- **Otros destinos:** los cortes salen del mismo cálculo con sus atardeceres. El motor los reparte en 4 partes iguales del rango del año y cada destino los puede fijar a mano (`cortes_luz`).

## 2. El formato

Un fichero por día: `data/dias/<destino>/<id>.json`. Solo **duraciones** y **horas fijas**. El resto de horas las calcula el motor con la matriz de tiempos; en la revisión salen las horas aproximadas. Los textos (`por_que`), las fichas de lugares, los avisos de fechas y la nota de temporada siguen donde están. El día solo dice **qué, en qué orden y cuánto**.

```jsonc
{
  "id": "D4",
  "nombre": "…",                       // título del día
  "nombre_tranquilo": "…",             // solo si el título menciona algo opcional
  "barrio_cena": "tridente",           // para la cena y la nocturna (como ahora)
  "noche": "escalinata",               // paseo nocturno (nightWalk, como ahora)

  "manana": {
    "paradas": [ PARADA, … ],
    "comida": COMIDA
  },
  "tarde": {
    "empieza": "14:45",                // la comida llega hasta aquí, en los dos ritmos
    "A": { "paradas": [ PARADA, … ], "cena": CENA },
    "B": …, "C": …,
    "D": "igual que C"                 // o su propia lista
  },
  "variantes": {                       // solo donde un cierre toca ese día
    "lunes": { … cambios … },
    "domingo": { … }
  },
  "pool": { "<lugar>": SITIO, … }       // el sitio escrito de cada lugar del pool que cae en este día
}
```

### PARADA

```jsonc
{
  "lugar": "Galería Borghese",       // nombre exacto de la ficha
  "min": 120,                        // duración (si no, la de la ficha)
  "modo": "dentro",                  // parada (por defecto) | dentro | fuera | camino | atardecer | noche
  "tipo": "fija",                    // fija | normal (por defecto) | opcional
  "hora": "11:00",                   // solo las fijas; con dos ritmos: { "completo": "08:30", "tranquilo": "09:45" }
  "entrada": true,                   // se vende entrada (Coliseo, Vaticano, Panteón, Castillo, Borghese, Free Tour…)
  "elastica": 30,                    // UNA por tarde: cuánto puede crecer o encoger
  "si_cerrado": "fuera",             // "fuera" (con su texto por_fuera) | { "cambiar_por": PARADA }
  "tranquilo": { "pasa_a": "…", "sugerencia": "…" },  // solo opcionales: a dónde va en tranquilo y qué se le dice
  "titulo": "…"                      // solo si la parada sale con otro nombre («Via Margutta y Via del Babuino»)
}
```

### COMIDA y CENA

```jsonc
{ "restaurante": "Edy", "alternativa": "Poldo e Gianna Osteria" }
```

- **Restaurante y alternativa:** la alternativa se usa si el restaurante cierra ese día o ya salió en el viaje. Nunca se repite en el mismo viaje, y la prueba lo comprueba.
- **Comida:** la tarde tiene su hora de empiezo, así que la comida dura lo que haga falta hasta ella. En completo, lo que deja la mañana; en tranquilo, más, porque la mañana quita las opcionales. El mínimo sigue siendo el de ahora (45 min).

### Tipos de parada y ritmo

- **fija:** tiene hora. Puede llevar dos, una por ritmo.
- **normal:** está en los dos ritmos.
- **opcional:** en tranquilo se quita. Con `tranquilo.pasa_a`, va a otro sitio escrito (por ejemplo, «Trevi de noche después de cenar»); con `tranquilo.sugerencia`, sale el texto en la parada que se queda.

El tranquilo **solo cambia la mañana**: empieza más tarde y quita las opcionales. También alarga la comida hasta el empiezo de la tarde. Las 4 tardes son las mismas en los dos ritmos.

### Variantes

Solo por un cierre que toca ese día (lunes, domingo con misa, miércoles de audiencia) o por un festivo grande (su propia variante con la fecha). Una variante no reescribe el día: dice qué cambia. Tiene cuatro operaciones:

- **`quitar`:** una lista de lugares que se quitan.
- **`cambiar`:** `{ "lugar": PARADA }`, para cambiar una parada por otra.
- **`mover`:** `{ "lugar": "despues_de:<otro>" }`, para cambiar de sitio una parada.
- **`restaurante`:** para cambiar la comida o la cena.

Cada operación se aplica a `manana`, a `tarde.<versión>` o a `tarde.*` (las cuatro versiones).

### Pool

Cada lugar de `pool_lista` que cae en este día lleva su sitio escrito:

```jsonc
"Galería Borghese": {
  "aqui": "ya está (manana)",                            // o qué parada sustituye / qué rato ocupa
  "si_no_esta_el_dia": { "dia": "D1", "mitad": "tarde", "sustituye": ["…"] },
  "segundo_sitio":     { "dia": "D4M", "mitad": "manana", "sustituye": ["…"] }
}
```

- Si dos lugares elegidos caen en el mismo hueco, manda el orden de `pool_lista`: el segundo va a su `segundo_sitio`.
- Lo que el viajero añade después («+ Añadir», Explorar) no mueve la ruta.

## 3. La comprobación (en la prueba, no en la app)

La app nunca inventa. La prueba recorre:
- las 365 fechas de inicio;
- todas las duraciones;
- los dos ritmos;
- con Free Tour y sin él;
- cada lugar del pool solo y todas las parejas.

Avisa, sin arreglar nada, de:
- una parada fuera de su horario o de su última entrada;
- un cierre sin `si_cerrado`;
- una elástica que tendría que pasar de ±30;
- un hueco de más de 20 min o un tiempo libre de más de 30;
- un atardecer fuera de hora;
- un restaurante repetido o cerrado sin alternativa;
- un imprescindible de pago que no sale nunca por dentro;
- un lugar de nivel 1-2 que no está en ningún día.

Lo que salga se arregla en el dato. Es la auditoría de ahora (`auditoria.mjs`), ejecutada sobre todas las fechas.

El motor actual se queda hasta que los 56 viajes (`revision20.mjs` + `revisionCierre.mjs`) salgan igual o mejor con el nuevo.
