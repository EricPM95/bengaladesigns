# Opinión: días escritos y el motor solo para las fechas (28 de septiembre de 2026)

## Resumen

**Sí, es buena idea**, y la haría. Es lo que hace que la app no falle y que un destino nuevo sea trabajo de contenido, no de reglas.

Dos matices importantes:

1. **Es menos revolución de lo que parece.** `curated_days` ya son días escritos por vosotros, con sus variantes. Lo que cambia de verdad es quitarle al motor la libertad de reparar: rellenar, estirar, recuperar, cambiar el orden. Y a cambio, escribir las versiones por luz.
2. **Con 3 versiones de luz y una parada elástica de ±30 min, las cuentas no salen.** Los huecos volverían por dentro de cada versión (punto 4).

**Un dato de hoy.** Varios números de la consulta son de antes de los commits de esta tarde (82d7986…a375b81):
- el Ara Pacis ya sale en 18 días de las dos revisiones;
- el Castillo entra por dentro en los 11 viajes de 4-5 días sin Free Tour;
- el Panteón entra por dentro al acabar el Free Tour;
- los huecos bajan de 38 a 3 y de 28 a 7.

Eso no cambia mi opinión: son parches que funcionan, pero cada uno destapa el siguiente caso. Es justo lo que describes.

## 1. ¿Es buena idea?

Sí, por tres razones:

- **Conjunto cerrado.** Unas 40-60 piezas por destino se revisan a mano una vez, y la prueba de las 365 fechas las cubre todas. Hoy probamos una muestra y el motor inventa en las fechas que no hemos mirado.
- **Los fallos se arreglan en los datos, no en el código.** Un hueco en la prueba se corrige reescribiendo esa versión, no con una regla nueva que mueve otros 20 días.
- **Escala a destinos.** El motor queda genérico (colocar, comprobar, avisar) y cada ciudad es un JSON.

**El riesgo real es el coste de contenido, no el técnico.** Cada destino son días de escritura y revisión. Por eso propongo no escribir desde cero: el motor actual sirve de generador de borradores (punto 6).

## 2. Qué se aprovecha, qué cambia y qué sobra

**Se queda tal cual:**
- calendario y atardeceres (`tripCalendar`, `sunset.js`);
- horarios (`openingHours`: by_day, by_season, last_entry, cierres, misas);
- fechas especiales y avisos (`specialDates`, `dateNotices`);
- la matriz de tiempos andando y en transporte;
- el reparto de días por duración y el orden por coste de `curatedTrip.js`: ya penaliza cierres, joyas en lunes, `evitar`…;
- restaurantes (`dinnerZones`, `recommendedRestaurant`, sin repetir);
- nocturnas (`nightWalk.js`);
- el formateo al cliente (`buildDayV3`: textos, por fuera, «Roma iluminada», traslados);
- el cliente entero, con la edición del viajero, «+ Añadir día» y días libres;
- la auditoría y las revisiones: pasan a ser la prueba de las 365 fechas.

**Cambia:**
- `planDay` pasa de "programar y reparar" a "elegir versión, calcular horas y comprobar".
- El programador (`scheduleDay`) se queda solo para poner horas: andando, horas fijas, última entrada. No debe quitar paradas por su cuenta. Si algo no cabe, es un fallo de la prueba, no una decisión en tiempo real.

**Sobra (para los destinos escritos):**
- la regla de relleno (317);
- `absorbWaits` y los estiramientos;
- `recover` y `fillSunWait`;
- `si_espera`;
- el invierno forzado y el normal en invierno;
- el cambio de orden antes de «ya ha cerrado»;
- el tope de `museos_de_pago`;
- `si_da_tiempo` y `solo_si_falta`;
- buena parte de las variantes por condición (`sol_despues_de`, `atardecer_antes_de`).

Es más o menos la mitad de `curatedTrip.js`.

`blockTrip.js`, `planTrip.js` y `shortTrip.js` se quedan mientras haya destinos sin escribir.

## 3. Riesgos y casos que no están en la consulta

- **Días que empiezan o acaban a media tarde.** Es el más importante. Por eso propongo escribir cada día en **dos mitades**: una mañana y una tarde. Un día de llegada a las 15:00 usa solo la tarde. Uno de salida a las 14:00, solo la mañana.
- **La luz solo afecta a la tarde.** Las dos mitades también reducen la escritura: la mañana se escribe una vez y solo la tarde lleva versiones de luz.
- **Free Tour:** es una hora fija (10:00) que no sale todos los días del año (festivos). D3 y D1-FT necesitan su solución escrita para cuando no hay tour.
- **El Panteón y el Castillo con Free Tour:** se escriben en D3 o en el reparto de nivel 2. Hoy son reglas: la 322 y `sin_tope`.
- **Días de 6 y 7:** D6 y D7 necesitan sus versiones. Ahí es donde entran los nivel 2 que sobran, bien.
- **Excursiones y medios días:** ya son tipos de día. Se escriben igual, con sus horas fijas de tren o bus.
- **Lugar elegido por el viajero que no cabe:** la consulta lo baja a sugerencia. Contradice la decisión de «pool con prioridad absoluta». Es una decisión de producto que conviene tomar a sabiendas.
  - Mi propuesta: cada tarde escrita declara un **hueco para el pool** (la parada elástica o la de nivel 3 que se puede quitar).
  - Si el lugar no es de esa zona, se prueba el día de su zona; si no hay, sugerencia con motivo.
- **Una fecha en la que ninguna solución escrita funciona:** en la app nunca debe inventar. Sale la parada por fuera con su aviso y la prueba de las 365 lo marca en rojo para escribir la solución. Así el fallo lo vemos nosotros antes que el viajero.
- **Los horarios cambian:** la revisión del 1 de diciembre, o cualquier cambio en una ficha, tiene que relanzar la prueba de las 365. Si no, un día escrito se rompe sin que nadie lo vea.
- **La frontera entre versiones:** un sol a las 18:29 frente a las 18:31 cambia de versión, y el cambio de hora de marzo y octubre mueve el sol una hora de golpe. La prueba debe mirar sobre todo las fechas de frontera.
- **Experiencias como parches:** un parche de Arte puede chocar con una variante de lunes (los Capitolinos cerrados). La prueba tiene que cruzar fechas, duraciones, Free Tour y experiencias: unos 11.000 viajes, que se hacen en minutos.
- **Restaurantes:** cierre semanal y vacaciones de agosto. La alternativa escrita lo cubre si también se comprueba con su ficha.
- **La caché de rutas:** cada día escrito necesita versión (`engine_version` o `data_version`) para no servir rutas viejas.

## 4. ¿3 versiones de luz?

**Me quedo con 4**, o con 3 si la parada elástica llega a ±45 min.

El ancho de cada versión tiene que caber en lo que puede absorber la parada elástica. Con ±30 min, la versión puede tener como mucho unos 60 min de ancho. Con 3 versiones:
- «medio» (18:30-20:00) tiene 90 min de ancho: quedan 30 min de hueco en un extremo o en el otro;
- «largo» va de las 20:00 a las 20:50 y «corto» de las 16:40 a las 18:30: 110 min, casi 2 horas en la misma versión.

Propuesta con el sol de Roma:

| Versión | Sol | Meses aproximados |
|---|---|---|
| A · invierno | antes de 17:30 | nov – mediados de feb |
| B · entretiempo corto | 17:30 – 18:45 | feb – mar, oct |
| C · entretiempo largo | 18:45 – 20:00 | abr, sep, finales de ago |
| D · verano | después de 20:00 | may – ago |

Cada una tiene unos 60-75 min de ancho, lo que cabe en ±30-40 min. Solo se escribe la **tarde** en 4 versiones, y una tarde puede decir «igual que la C» si no cambia.

## 5. Formato propuesto (a mano, un fichero por día)

`data/dias/roma/D4.json`. Solo duraciones y horas fijas: las horas del día las calcula el motor con la matriz de tiempos. Escribirlas a mano es donde más errores se colarían. Las horas aproximadas salen en la revisión, no en el dato.

```json
{
  "id": "D4",
  "nombre": "Trevi sin gente, el Popolo y la Borghese",
  "manana": {
    "empieza": "08:30",
    "paradas": [
      { "lugar": "Fontana de Trevi", "min": 25 },
      { "lugar": "Plaza Colonna", "modo": "camino" },
      { "lugar": "Plaza de España", "min": 20 },
      { "lugar": "Trinità dei Monti", "min": 15, "modo": "dentro", "opcional": true }
    ],
    "comida": { "hora": "13:00", "restaurante": "Edy", "alternativa": "Poldo e Gianna Osteria" }
  },
  "tardes": {
    "D": {
      "paradas": [
        { "lugar": "Galería Borghese", "modo": "dentro", "entrada": "15:00" },
        { "lugar": "Parque de Villa Borghese", "min": 60, "elastica": 30 },
        { "lugar": "Santa Maria del Popolo", "min": 30, "modo": "dentro" },
        { "lugar": "Ara Pacis", "min": 45, "modo": "dentro", "hueco_pool": true },
        { "lugar": "Terraza del Pincio", "modo": "atardecer" }
      ],
      "cena": { "restaurante": "Sgarro Bistrot", "alternativa": "Edy" },
      "noche": ["Panteón (noche)", "Piazza Navona (noche)"]
    },
    "C": "igual que D",
    "B": { "...": "..." },
    "A": { "...": "..." }
  },
  "si_cerrado": {
    "Santa Maria del Popolo": { "modo": "fuera" },
    "Galería Borghese": { "cambiar_por": { "lugar": "Galería Nacional de Arte Moderno", "min": 90 } }
  },
  "variantes": {
    "domingo": { "tardes.D.mover": { "Santa Maria del Popolo": "despues_de:Parque de Villa Borghese" } },
    "lunes": { "no_va": true }
  },
  "experiencias": {
    "arte_museos": { "tardes.*.cambiar": { "Parque de Villa Borghese": { "min": 30 } } }
  }
}
```

Reglas del formato:
- **Modos de parada:** `modo` es `parada` (por defecto), `dentro`, `fuera`, `camino`, `atardecer` o `noche`.
- **Entradas:** `entrada` lleva la hora exacta de la entrada que se vende.
- **Parada elástica:** una por tarde, marcada con `elastica` y los minutos que puede crecer o encoger.
- **Lugar del viajero:** `hueco_pool` marca dónde entra.
- **Tranquilo, si vuelve:** con `opcional` sería el tranquilo del futuro (quitar lo marcado y empezar a las 10:00) sin escribir otra versión.
- **Textos y fichas:** los `por_que` siguen en `docs/roma_por_que.json` y las fichas en `roma.json`. El día solo dice qué, en qué orden y cuánto.
- **Reparto:** un fichero aparte, `data/dias/roma/reparto.json`, con el mapa lugar → días y versiones. La prueba avisa de cualquier nivel 1-2 que no esté en ningún sitio.

## 6. Cuánto trabajo

| Parte | Quién | Aproximado |
|---|---|---|
| Formato + D4 de ejemplo (4 tardes, domingo y lunes) | yo, y tú lo revisas | 1 sesión |
| Borradores de todos los días de Roma, **sacados del motor actual** (las 56 rutas y el barrido por meses) | yo | 1-2 sesiones |
| Revisión y edición de los borradores | tú | lo más largo: unos 40-60 bloques |
| El motor lee los días escritos, calcula horas y comprueba | yo | 2 sesiones |
| Prueba de las 365 fechas y comparación de los 56 viajes | yo | 1 sesión |

Unas 5-6 sesiones mías más tu revisión.

Seguir afinando reglas cuesta 1 sesión por tanda y no tiene final: cada tanda de hoy ha arreglado lo pedido y ha destapado 2-3 casos nuevos. El sistema escrito sí tiene final.

Para un destino nuevo:
- **Hoy:** reglas nuevas y revisar con muestras.
- **Con días escritos:** borrador automático, tu revisión y la prueba de las 365. Mucho más predecible.

## 7. Del prompt de cierre: qué deja de hacer falta y qué sigue

**Deja de hacer falta (pasa a estar escrito):**
- la regla de relleno a-d (317);
- el cambio de orden antes de «ya ha cerrado» (320), que pasa a `si_cerrado`;
- la subida al Janículo según la hora (319), que pasa a la versión de luz;
- el miércoles como regla (318), que pasa a variante escrita (ya lo es casi);
- el Panteón tras el Free Tour y el Castillo desde 4 días (322), que pasan al reparto;
- el tope de museos de pago.

**Sigue sirviendo:**
- **Toda la auditoría (321 y 322):** es la prueba de las 365 fechas. Huecos, paseos largos, restaurante repetido, «por la mañana» por la tarde, imprescindible de pago nunca por dentro.
- **Los textos por hora:** `temprano`, `temprano_antes`.
- **Los restaurantes sin repetir y la cena donde acaba la tarde:** como comprobación, no como elección.
- **Los avisos de fechas** con `requiere_lugares`.
- **El orden de los días por coste,** incluida la entrada que cierra ese día.
- **Los datos arreglados:** el Tempietto 20 min, la Basílica los miércoles, el D3 con comida a las 13:00, el bus 40.

**Hoy y hasta que llegue el cambio:** lo de hoy no se tira. Es lo que usa la app mientras escribimos, y sus mejores salidas son los borradores.

## 8. Qué cambiaría yo de la idea

1. **Dos mitades por día** (mañana y tarde), con la luz solo en la tarde. Resuelve los días a media tarde y reduce la escritura casi a la mitad.
2. **4 versiones de luz**, o 3 con la elástica a ±45 min. Si no, los huecos vuelven dentro de cada versión.
3. **No escribir horas, solo duraciones y horas fijas.** Las horas las calcula el motor y la revisión las enseña.
4. **Borradores desde el motor actual**, no desde cero.
5. **La comprobación en la prueba, no en tiempo real.** La app nunca estira ni inventa. La prueba falla si hay un hueco de más de 30 min, un paseo largo o una entrada fuera de hora, y se arregla en el dato.
6. **Hueco para el lugar del viajero** en cada tarde, decidiendo antes si el pool deja de mandar.
7. **Tranquilo como marca `opcional`,** no como versión. Cuesta poco dejarla escrita aunque el formulario no lo ofrezca al principio.
8. **No quitar el motor actual hasta que los 56 viajes salgan igual o mejor**, y mantenerlo para los destinos que aún no estén escritos.
