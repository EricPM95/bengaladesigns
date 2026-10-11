# Informe de la parte de fotos de la Tanda 6y2 (punto 4)

Las fotos equivocadas de Wikipedia ya no salen, hay una página con candidatas de Unsplash para elegir y el crédito de las fotos grandes va sobre una esquina. Todo solo Roma.

## 1. Las fotos equivocadas ya no salen
- **Una sola regla, en un solo sitio:** la lista `fotos_rechazadas` de `data/dias/roma/_fotos.json` (cada sitio con su motivo escrito) y la función `fotoOculta` de `server/engine/writtenDays.js`. `fotoOculta` mira esa lista y también `sin_foto`, así que los dos «sin foto» de antes y los nuevos pasan por el mismo sitio. El servidor la usa en todos sus caminos: `/api/place-photo`, `/api/pool-photos`, `resolvePlacePhoto` (antes de leer la caché de Supabase y antes de Unsplash y Wikipedia) y la foto de noche.
- **Los sitios que quedan sin foto (el recuadro de color de la app) son 8, no 9:** Cripta de los Capuchinos (salía la «Kapuzinergruft» de Viena), Trastevere al atardecer (un reloj del Quirinal), Via dei Coronari y Borgo Pio (las dos con el Passetto di Borgo), y las cuatro excursiones: Florencia y Pisa (un manuscrito), Nápoles y Pompeya en tren (una vista de Marsella), Costa Amalfitana y Florencia en tren de alta velocidad (un avión de Vueling). El encargo decía «9 entradas» pero nombra 8; son esas 8. Si falta una, dímelo.
- **No pasan a otra fuente:** comprobado con mi servidor (puerto 8799): los 8 responden «ninguna foto», sin Unsplash, sin Wikipedia, sin caché y sin la foto de su zona; también «Trastevere al atardecer (noche)» y «Borgo Pio de noche», aunque pidas con `force` y un título de Wikipedia. Una foto propia tuya, si algún día la hay en `fotos`, sí saldría (va antes). Para sacar un sitio de la lista: pon su foto y borra su línea.
- **Lo que pinta el cliente sin foto:** el recuadro neutro, nunca una imagen rota. Dos arreglos pequeños que hacían falta:
  - En la ficha de la parada, la miniatura de al lado del título era una `<img>` aunque no hubiera foto; ahora es el recuadro gris neutro.
  - `placeholderPhoto` (el explorador y «Añadir al día») devolvía una foto de stock al azar (picsum) cuando un sitio no tenía foto: con esos sitios salía una foto cualquiera. Ahora devuelve vacío (el color neutro), igual que ya hacía la ruta generada desde la 5.6. Esto también cambia los demás sitios sin foto añadidos desde el explorador; me parece lo que quieres, pero dime si no.
- **Lo guardado en el navegador:** las fotos equivocadas se habrían quedado 24 h en el móvil de quien ya las vio. Subida la clave de guardado (`photo:v3`, `poolphoto:v2`) y limpiadas las viejas: se vuelven a pedir una vez.
- `_fotos_wikimedia.json` sigue igual (27 fotos): los créditos de las 6 fotos equivocadas ya no se usan, pero no estorban y el script `creditosWikimedia.mjs` sigue siendo repetible.

## 2. La página de candidatas
`docs/dias/FOTOS_ROMA_CANDIDATAS.html` (un solo fichero, ábrelo con doble clic; las fotos se cargan de images.unsplash.com, hace falta internet). Se genera con `scripts/destino/fotosCandidatas6y2.mjs` desde `data/dias/roma/_fotos_candidatas_6y2.json`. Cada foto lleva autor enlazado, enlace a Unsplash y `utm_source=viajes_bengala`. Las busqué con la API que ya usa el servidor (la clave se leyó del `.env.local`; no está en ningún fichero versionado). Comprobé que las 21 direcciones de imagen responden.

| Sitio | Candidatas | Qué hay |
|---|---|---|
| Cripta de los Capuchinos | 0 | «Sin candidatas buenas, pon una tuya»: en Unsplash no hay fotos de la cripta (dentro no se puede fotografiar); lo que sale con «cripta» o «huesos» es genérico o de otro sitio |
| Trastevere al atardecer | 3 | Calle de adoquines con casas de colores, calle con mesas de noche, Roma a la hora dorada. **Ninguna dice «Trastevere» en su descripción**: salen al buscar «Trastevere». Que las mire Eric |
| Via dei Coronari | 3 | «Sin candidatas buenas»: la calle no sale. Tres calles parecidas del centro (una iglesia de la Via Giulia, edificios medievales, una calle del centro), marcadas como no confirmadas |
| Borgo Pio | 3 | «Sin candidatas buenas»: tres de la zona (Via della Conciliazione y San Pedro), marcadas como de la zona, no la calle |
| Florencia y Pisa | 3 | Torre de Pisa (2) y la catedral de Florencia desde la Torre de Arnolfo; descripciones que lo confirman |
| Nápoles y Pompeya en tren | 3 | Pompeya con el Vesubio (2) y Nápoles con el Vesubio; confirmadas |
| Costa Amalfitana | 3 | Amalfi, Positano y una panorámica de la costa; confirmadas |
| Florencia en tren de alta velocidad | 3 | Catedral desde la Piazzale Michelangelo, Ponte Vecchio y una panorámica; confirmadas |

Unsplash no dice dónde se hizo cada foto, solo su descripción; por eso cada candidata lleva una nota de cuánto te puedes fiar. Eric elige («Trastevere: opción 2») o pone una suya.

**Otras que Eric debería revisar (no las he añadido):**
- «Excursión a Tívoli» (la tarjeta de la página de excursiones) sale de Wikipedia con «Entrance to the Grotto at Posillipo, Naples» (una gruta de Nápoles): también es equivocada.
- «Excursión a Pompeya y Sorrento» sale de Unsplash; no he podido confirmar a ojo que sea Pompeya.
- Solo miré las excursiones y los 4 sitios que dijo la 6z6f; el resto de fotos de Wikipedia de Roma que no están en `_fotos_wikimedia.json` no las he revisado.

## 3. El crédito en las fotos que se enseñan sin ficha
- **Fotos grandes (cabecera de las excursiones, `ExcursionsPage.tsx`):** el crédito en pequeño sobre la esquina de abajo a la derecha, con el autor enlazado y la licencia, solo si la foto tiene crédito completo (Wikipedia con datos y Unsplash); las propias, nunca; sin crédito o a medias, nada. La cabecera pide ahora la ficha de la foto (`fetchPlacePhotoDetail`) en vez de solo la dirección: es la misma petición y la misma memoria de siempre, **no hay ninguna petición más**.
- **Un solo formateo:** nueva pieza `src/components/ui/FotoCredito.tsx` (con `hayCreditoDeFoto`). La ficha de la parada la usa en lugar de sus dos bloques de antes, y la esquina de las excursiones también. Se ve igual que antes en la ficha.
- **Fotos pequeñas** (tarjetas del explorador, selector de lugares `StepPool`, «Añadir al día», `ExplorePanel`, y también `CuratedPlacesPool` y `ManualAddStopsScreen`): comprobado que ninguna lleva línea de crédito ni pide la ficha de la foto.
- **«Créditos»** (`src/lib/creditos.ts`): sigue siendo cierto y ahora dice también lo de la esquina de las excursiones y que en las fotos pequeñas no hay línea.

## 4. AttractionsFinder
No lo he tocado, como pediste.

## 5. Pruebas
- Nueva `scripts/destino/pruebaFase6y2_fotos.mjs`: 92 comprobaciones, 0 fallos con mi servidor (`SERVIDOR=http://localhost:8799`). Cubre la lista y su motivo, la regla en todos los caminos del servidor (y que va antes de la caché y de Unsplash), lo que responde el servidor (las 8 y sus versiones de noche sin foto; Plaza Colonna con su crédito, Coliseo propia, una de Unsplash con su autor), el cliente sin foto, el crédito de la esquina pintado de verdad (Wikipedia, Unsplash, y nada en propia, a medias, dominio público o sin foto), 0 líneas de crédito en las pequeñas, «Créditos» y la página de candidatas (3 candidatas por sitio o su aviso). Contra el servidor viejo del puerto 8787 falla donde debe (3a, 3b, 3c).
- Ajustadas solo estas dos, por lo que cambia mi trabajo:
  - `pruebaFase6z6fWikimedia.mjs`: ya no exige que los 8 sitios rechazados salgan de Wikipedia; la clave del guardado pasa de v2 a v3; las comprobaciones de la línea de crédito de la ficha miran ahora `FotoCredito.tsx` (la ficha lo usa). 40 comprobaciones, 0 fallos. No cuenta «27 fotos», así que el JSON no cambió.
  - `pruebaFase6z6e.mjs`: la comprobación 1d mira `FotoCredito.tsx` en lugar de la ficha. 27, 0 fallos.
- Corridas sin cambios, 0 fallos: `pruebaFase6z6d` (21), `pruebaFase6z6c` (28), `pruebaTanda6z6c` (94), `pruebaFotos6z3` (52), `pruebaFase6z6f` (22), `pruebaTanda6z6b` (92), `pruebaFase6y_manual` (1694).
- `npx tsc --noEmit -p tsconfig.app.json`: limpio.
- No he añadido invariantes nuevas a `INVARIANTES` para no chocar con las otras tres tandas en paralelo; la regla es: «un sitio con la foto equivocada va a `fotos_rechazadas` con su motivo; solo `fotoOculta` decide».

## 6. Lo que no pude ver ni comprobar
- No tengo navegador: la comprobación visual a 375 px es tuya. Lo que hay que mirar: (1) la cabecera de una excursión con crédito (por ejemplo, la de Tívoli no lo tiene; una con foto de Unsplash sí), con el texto pequeño en la esquina y sin tapar nada importante; (2) un sitio rechazado (Borgo Pio) en una ficha y en el explorador: recuadro gris, sin imagen vacía; (3) la página de candidatas abierta con doble clic.
- No he visto la página de candidatas en un navegador (solo que su HTML es correcto y que sus 21 imágenes responden).
- No he comprobado cómo se ve una cabecera de excursión con foto de Wikipedia con crédito (ninguna de las 5 excursiones de hoy lo tiene).

## 7. Preguntas abiertas
1. Los 8 sitios sin foto: ¿eliges de la página, o prefieres que busque más para Trastevere, Via dei Coronari y Borgo Pio (las que no se pueden confirmar)? Para la Cripta de los Capuchinos hará falta una foto tuya.
2. ¿Te parece bien que los demás sitios sin foto añadidos desde el explorador salgan sin foto (color neutro) y no con una foto de stock al azar?
3. ¿Quito del todo las 6 entradas de `_fotos_wikimedia.json` de las fotos equivocadas, o las dejo como están?
4. La foto de «Excursión a Tívoli» también es equivocada: ¿la añado a la lista y a la página de candidatas?
