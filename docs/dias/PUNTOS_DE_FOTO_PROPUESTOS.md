# Puntos de foto propuestos (V78, apartado 2) — para que Eric los apruebe

Nada de esto está en `data/logros/*.json`. Coordenadas: OpenStreetMap/Nominatim (marcadas «OSM») o el catálogo de la app (`data/pipeline_v2/<destino>.json`, marcadas «catálogo»). Distancias calculadas contra el centro y el radio actual de cada sitio en `data/logros/<destino>.json`.

Columna «Comprobado»: **A** = la fuente nombra el lugar como punto de la foto y lo leí; **B** = solo lo vi en el resultado de la búsqueda (la página no se pudo abrir: 403/429) o la fuente es genérica; hay que confirmarlo en el mapa antes de aprobar.

## Roma (5 puntos)

| Sitio (id) | Punto de foto | lat, lng | Radio | Fuente | Comprobado | Mapa |
|---|---|---|---|---|---|---|
| Coliseo (`coliseo`, r 250) | Parque del Colle Oppio (Giardinetto di Monte Oppio, junto a la estación Colosseo) | 41.89189, 12.49596 (OSM, centro del parque) | 80 | https://romewise.com/colosseum/finding-the-best-view-of-the-colosseum/ ; https://mamalovesrome.com/best-photo-spots-in-rome/ | A | https://www.openstreetmap.org/?mlat=41.89189&mlon=12.49596#map=18/41.89189/12.49596 |
| Coliseo (`coliseo`) | Via dei Fori Imperiali, mirando al Coliseo | 41.8926, 12.4882 (OSM, tramo de la vía) | 80 | https://getnofilter.com/en/spot/colosseum-from-via-dei-fori-imperiali-in-italy (aparece como punto «Colosseum from Via dei Fori Imperiali»; la página dio 429 al abrirla) | B | https://www.openstreetmap.org/?mlat=41.8926&mlon=12.4882#map=18/41.8926/12.4882 |
| Basílica de San Pedro (`basilica_de_san_pedro`, r 250) | Via della Conciliazione (la avenida que lleva a la cúpula) | 41.9023, 12.4620 (OSM: entre los nodos 12.4636 y 12.4600 de la vía) | 100 | https://www.locationscout.net/italy/6693-basilica-di-san-pietro-via-della-conciliazione ; https://www.pixeoapp.com/photo-spots/europe/italy/via-della-conciliazione/ (la página de locationscout dio 403; la descripción «punto de fuga hacia la cúpula» salió en la búsqueda) | B | https://www.openstreetmap.org/?mlat=41.9023&mlon=12.4620#map=18/41.9023/12.4620 |
| Basílica de San Pedro (`basilica_de_san_pedro`) | Ponte Umberto I (cúpula al atardecer, con el Ponte Sant'Angelo delante) | 41.9027, 12.4713 (OSM) | 80 | https://guide.michelin.com/ca/en/article/travel/rome-9-must-visit-instagrammable-spots ; https://www.locationscout.net/italy/2883-basilica-di-san-pietro/44282 | B | https://www.openstreetmap.org/?mlat=41.9027&mlon=12.4713#map=18/41.9027/12.4713 |
| Basílica de San Pedro (`basilica_de_san_pedro`) | Via Piccolomini / terraza de Largo Cardinal Ferrata (la cúpula, la «perspectiva mágica») | 41.8898, 12.4409 (OSM, Largo Cardinal Domenico Ferrata) | 100 | https://www.italia.it/en/lazio/rome/via-piccolomini ; https://www.turismoroma.it/en/la-cupola-di-san-pietro%e2%80%a6-e-la-prospettiva-magica | B | https://www.openstreetmap.org/?mlat=41.8898&mlon=12.4409#map=18/41.8898/12.4409 |

Comprobaciones de radio (centro del punto a centro del sitio; «fuera» = el círculo del punto no entra en el radio del sitio):
- Colle Oppio: 364 m del Coliseo, fuera de su radio de 250 m. No toca ningún otro sitio.
- Via dei Fori Imperiali: 425 m del Coliseo, fuera. **Cae dentro del radio del Foro (240 m, radio 350)**: es justo el caso de la tanda (la foto iría al Foro por radio normal). Con la regla del §2 («en un punto de foto lejano: solo el sitio de ESE punto») debe mandar el punto sobre el radio normal; si el código da prioridad al radio normal, este punto no sirve de nada. Hay que decidirlo en la regla, no en los datos.
- Via della Conciliazione: 538 m de la Basílica, fuera. Dejé el punto en el medio de la avenida y no cerca de la plaza porque el extremo de la plaza (12.4600) cae a 225 m de la Plaza de San Pedro (radio 250). No toca el Castillo ni el Puente Sant'Angelo.
- Ponte Umberto I: 1309 m de la Basílica, fuera. Está a ~415 m del Castillo (radio 200): el círculo de 80 m no toca el del Castillo.
- Via Piccolomini: 1825 m de la Basílica, fuera. No toca el Janículo (radio 200).

### Dentro del radio normal (no son puntos lejanos: NO se proponen)
- **Largo Gaetana Agnesi** (41.8917, 12.4913, OSM): a 183 m del Coliseo, dentro de su radio de 250 m; la foto ya cuenta por radio normal. Además las fuentes de la búsqueda (througheternity.com) lo citan, pero no pude abrir ninguna.
- **Terraza del Campidoglio sobre el Foro** (Terrazza sul Foro / Via di Monte Tarpeo, ~41.8926, 12.4838): a ~125 m del centro del Foro (radio 350) y a ~114 m de la Plaza del Campidoglio (radio 150): dentro de los dos, ya cuenta. Fuentes: https://mamalovesrome.com/best-photo-spots-in-rome/ (terraza detrás de la Plaza del Campidoglio con vista al Foro y al Coliseo al fondo).

### Roma: sitios sin punto fiable
- **Castillo de Sant'Angelo** (`castillo_de_santangelo`): Ponte Umberto I está a ~415 m, pero las fuentes lo citan como vista de la cúpula, y hay desacuerdo sobre si desde el puente se ve el Castillo (los árboles lo tapan según una guía, Wanderlog dice que sí). No lo propongo. El Puente Sant'Angelo (el sitio `puente_santangelo`) ya está dentro de su propio radio.
- **Vittoriano / Plaza Venecia** (`plaza_venecia`, r 150): las guías hablan de la terraza de arriba (de pago) y de fotografiarlo de noche; ninguna da un punto lejano concreto. Sin punto. (Via del Corso: sin fuente.)
- **Fontana de Trevi, Panteón, Navona, etc.**: se ven de cerca, sin punto.
- **Janículo / cúpula**: el Janículo ya es un sitio propio (`mirador_del_janiculo`); la cúpula desde allí queda cubierta por el radio de ese sitio (no es un sitio nuevo).
- **Circo Máximo, Termas de Caracalla, Pirámide Cestia**: radios grandes, sin punto lejano buscado.

## Lanzarote (4 puntos)

| Sitio (id) | Punto de foto | lat, lng | Radio | Fuente | Comprobado | Mapa |
|---|---|---|---|---|---|---|
| La Graciosa (`la_graciosa`, r 2500, centro Caleta de Sebo) | Mirador del Río (vista del canal El Río y de La Graciosa) | 29.2145, -13.4812 (catálogo) | 100 | https://capturetheatlas.com/es/miradores-lanzarote/ ; https://www.hellocanaryislands.com/viewpoints/lanzarote/mirador-del-rio/ | A | https://www.openstreetmap.org/?mlat=29.2145&mlon=-13.4812#map=18/29.2145/-13.4812 |
| La Graciosa (`la_graciosa`) | Mirador de Guinate (la isla desde el risco de Famara) | 29.18478, -13.50115 (OSM) | 100 | https://www.visitlagraciosa.com/?p=4970 y https://capturetheatlas.com/es/miradores-lanzarote/ (Guinate: «archipiélago Chinijo»; La Graciosa citada en otras guías de la búsqueda) | B | https://www.openstreetmap.org/?mlat=29.18478&mlon=-13.50115#map=18/29.18478/-13.50115 |
| Caleta de Famara y Playa de Famara (`caleta_de_famara_y_playa_de_famara`, r 990) | Mirador del Risco de Famara (El Bosquecillo), sobre la playa y el pueblo | 29.12602, -13.52319 (catálogo) | 100 | https://capturetheatlas.com/es/miradores-lanzarote/ («overlooking the Famara cliff, the village of Caleta de Famara, nearby beaches») | A | https://www.openstreetmap.org/?mlat=29.12602&mlon=-13.52319#map=18/29.12602/-13.52319 |
| Haría (`haria_pueblo`, r 300) | Mirador de Haría / Malpaso (el valle de palmeras con el pueblo debajo) | 29.13158, -13.51417 (catálogo) | 100 | https://lavozdelanzarote.com/en/things-to-do-in-lanzarote/the-7-most-spectacular-viewpoints-in-lanzarote_213682_102.html | B | https://www.openstreetmap.org/?mlat=29.13158&mlon=-13.51417#map=18/29.13158/-13.51417 |

Comprobaciones de radio:
- Mirador del Río: 2888 m del centro de La Graciosa (radio 2500, por tanto el círculo de 100 m queda fuera). **Es a la vez el sitio `mirador_del_rio` (0 m)**: una foto aquí valdría para La Graciosa por el punto y para el Mirador del Río por radio normal; es el mismo lugar y las dos medallas son legítimas, pero hay que saberlo.
- Mirador de Guinate: 5212 m de La Graciosa, fuera; a 50 m del sitio `mirador_de_guinate` (mismo caso). Dato dudoso: hellocanaryislands.com da -13.5424 y OSM -13.5011 (el catálogo usa -13.5012; me quedo con OSM). Esa web no dice que se vea La Graciosa; otras guías de la búsqueda sí. Por eso B.
- Risco de Famara: 4087 m del centro de Famara, fuera; es el sitio `mirador_del_bosquecillo` (0 m).
- Mirador de Haría: 1616 m del pueblo, fuera; es el sitio `mirador_de_haria` (0 m).

### Dentro del radio normal (no son puntos lejanos)
- **Mirador del Golfo** (28.9789, -13.8305, OSM): a 338 m del centro de El Golfo/Charco de los Clicos (radio 700). Dentro: ya cuenta. Fuente: capturetheatlas (mirador gratis con vista al Charco de los Clicos).

### Lanzarote: sitios sin punto fiable
- **Montañas del Fuego**: ninguna guía abierta da un mirador fuera de su radio de 2500 m; sin punto.
- **Jameos del Agua y Cueva de los Verdes**: no se ven de lejos (son subterráneos); sin punto.
- **Playas de Papagayo** (r 1500): existe el «Mirador de Papagayo» (capturetheatlas), pero no encontré coordenadas fiables (OSM solo da Punta de Papagayo, que está en la playa); sin punto hasta tenerlas.
- **Salinas de Janubio** (r 800): hay mirador, pero queda dentro del radio de las propias salinas; sin punto. **La Geria** (r 3000), **Los Hervideros**, **Teguise** y **Arrecife**: sin fuente de punto lejano.

## Recuento
- Roma: **5** puntos propuestos (2 con comprobación A/fuente leída; el resto B).
- Lanzarote: **4** puntos propuestos (2 A, 2 B).
- Total: **9**. Sugerencia: aprobar primero los 3 con comprobación A (Colle Oppio, Mirador del Río, Risco de Famara) y confirmar en el mapa los demás.

## JSON de ejemplo (formato de `DECISIONES_V78.md`; no se ha metido en los datos reales)

```json
"coliseo": {
  "puntos_de_foto": [
    {
      "nombre": "Parque del Colle Oppio, mirando al Coliseo",
      "lat": 41.89189,
      "lng": 12.49596,
      "radio_m": 80,
      "fuente": "https://romewise.com/colosseum/finding-the-best-view-of-the-colosseum/"
    }
  ]
},
"la_graciosa": {
  "puntos_de_foto": [
    {
      "nombre": "Mirador del Río, mirando a La Graciosa",
      "lat": 29.2145,
      "lng": -13.4812,
      "radio_m": 100,
      "fuente": "https://capturetheatlas.com/es/miradores-lanzarote/"
    }
  ]
}
```
