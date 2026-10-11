# Tanda 6y4 · Parte de la ficha (puntos 16, 6, 5 de la ficha y 18)

Palabras sencillas. Todo local, sin push. Solo Roma. La prueba es `scripts/destino/pruebaFase6y4_ficha.mjs` (se lanza con `API_URL=http://localhost:PUERTO node scripts/destino/pruebaFase6y4_ficha.mjs` y un servidor con este código).

No he podido hacer la comprobación visual a 375 px: no tengo navegador. Lo que sí he comprobado es lo que la pantalla pinta (react-dom/server con el código de verdad), el motor de verdad y los datos. Ver «Lo que no he podido verificar».

## Punto 16 · La ficha de cada lugar, con el diseño nuevo

El diseño es `docs/diseno/ficha_lugar/Ficha Lugar.dc.html` (con su support.js e image-slot.js: **no están en el commit de esta rama**, los leí de la carpeta del repo principal; el commit que los mete lo hace quien coordina). Las piezas del diseño viven en `src/components/route/dayDetail/FichaPiezas.tsx`; `StopDetailSheet.tsx` las monta con los datos. **Cada pieza que no recibe datos no se pinta** (la prueba lo comprueba pieza a pieza). Ningún texto de ejemplo del diseño llega a la app (la prueba busca «Cáritas», «Barberini», «Neptuno», «9:41»…).

### Dónde he puesto cada cosa de la ficha vieja en la nueva

| Antes | Ahora |
|---|---|
| Foto de 64 px a la izquierda del nombre | Foto de 84 px a la izquierda del nombre, con la esquina de abajo a la derecha recortada (como el diseño). Sin foto, el recuadro neutro de siempre |
| Crédito de la foto (`FotoCredito`) | Justo debajo de la cabecera (foto + nombre), pequeño. Sigue siendo la misma pieza |
| «Añadir foto» / «Cambiar foto» (botón de una línea debajo de la cabecera) | **Botón redondo de 32 px con la cámara, en la ESQUINA de abajo a la derecha de la foto**, solo el icono (el nombre «Añadir foto» o «Cambiar foto» va en su etiqueta para el lector de pantalla). Es el mismo `BotonFoto` y sube con la misma `subirFoto`. Gratis: una por parada (la segunda sustituye: «Cambiar foto»); de pago: sin límite. Sin día (EXPLORAR) o con botón fijo («Añadir parada») no sale, como antes |
| Nombre con el icono del Free Tour o la luna | Nombre en serif de 27 px, con los mismos iconos delante |
| Píldoras: «Experiencia nocturna», duración, horario («Abierto…/Cerrado…/Acceso libre»), «Requiere reserva», tipo | Las etiquetas pequeñas bajo el nombre, como el diseño: duración en oscuro, horario en verde (o rojo si está cerrado), «Requiere reserva» en rojo, tipo en contorno, y la de «Trastevere» en lila |
| «Me gusta» de «Viajeros lo recomiendan» | Debajo de las etiquetas, igual |
| Texto de horario orientativo de la cabecera (`scheduleText`) | Dentro de la tarjeta «Horario» |
| Pestañas en caja gris (Resumen · Entradas · Tips) | Pastilla con la bolita oscura que se desliza; se queda pegada arriba al subir. Con una sola pestaña no sale |
| «Escuchar» (botón pequeño arriba del Resumen) | **Barra oscura fija abajo, «Escuchar la historia»**, con el botón redondo ámbar de play/pausa, lo que lleva leído y [Parar]. Solo de pago y con voz en español (la voz del móvil de la 6z6, sin cambios). Sale en todas las pestañas; lee el texto del Resumen. El botón pequeño de HOY no cambia |
| Línea de Navidad / Ángelus (`seasonLine`), paseo nocturno, «Por dentro / Por fuera», «Quiero entrar» | Arriba del Resumen, las mismas tarjetas |
| «Por qué aquí» (primer párrafo) | El texto grande en serif de 22 px |
| Descripción del lugar | El texto de 14 px debajo |
| «Qué vas a ver» (lista de puntos) | Tarjeta con la lista numerada. Si viene como un párrafo suelto (el de la IA), sin números |
| «Por qué te lo recomendamos» | Etiqueta pequeña + párrafo, debajo de «Qué vas a ver» |
| «Por el camino» | Tarjeta ámbar con su icono (con todos sus textos) |
| «Horario» (aviso del día, avisos rojos, aviso gris, texto largo, pie fijo) | Tarjeta «Horario»: arriba el aviso de ese día (verde o rojo) o «Visitable todo el año»; los avisos de cierre; las filas «días · horas · última entrada» cuando la ficha curada las trae por separado (si manda el horario auditado, sus renglones como párrafos); y el pie fijo «Los horarios pueden cambiar…» |
| «Transporte» (dirección, «Cómo llegar →», metro, bus, tranvía, web) | Tarjeta «Cómo llegar»: dirección, metro con la letra de la línea y su nota («A 5 min caminando…»), buses con sus números en cuadraditos, tranvía, la web y el botón negro [Cómo llegar →] (solo si hay dirección, como antes) |
| Pestaña «Entradas»: tarjetas con [Reservar] | Tarjetas blancas con el nombre en serif, «Desde X €» grande y [Reservar] ancho |
| «Ya tienes entrada · 10:30» + «Entrada 10:30» + «Reservada ✓ / Fijada» + nota con dos horas | **«✓ Tu entrada: 10:30»** (la hora, una sola vez) + «Llega unos 30 minutos antes: …» + punto de encuentro y n.º de reserva si los hay + «Fijada» + [Cambiar]. La marca «Reservada ✓» se quita (el ✓ de «Tu entrada» ya lo dice) |
| «¿Ya la tienes? Añádela» | Igual |
| Pestaña Tips (TipBox / LocalSecretBox) | Tarjetas con círculo (bombilla en oscuro; el secreto local con el ojo y su etiqueta «Secreto local») |
| Ficha del Free Tour | Mismo contenido (punto de encuentro, lugares que verás, horario, Reservar) con el aspecto nuevo |
| Botón de volver (40 px, borde de acento) y píldora del día | Volver de 44 px blanco con sombra suave (como el diseño); la píldora del día, igual que antes pero con la sombra del diseño |
| Tirador gris entre el mapa y el panel | El panel sube sobre el mapa con las esquinas redondas del diseño; el tirador sigue moviendo la altura del mapa |

Lo que **no** he tocado: el mapa de arriba, los textos de nuestros datos, la lógica de «Quiero entrar», «Me gusta», «Añadir a mi día» (el CTA fijo de «Añadir parada»), las llamadas a los servidores.

Una cosa del diseño que no se puede copiar tal cual: la barra de «Escuchar la historia» enseña la duración total (2:10) y la voz del móvil no la da. Enseña, en su lugar, «Voz del móvil», «Leyendo…» o «En pausa», y la barra de progreso avanza por frases (la lectura se corta en trozos).

## Punto 5 (la parte de la ficha) · La Fontana de Trevi

Su pestaña «Entradas» ya no lleva [Reservar] ni «Añádela»: sale el bloque **«No necesitas entrada»** del diseño y, debajo, **«Bajar junto al agua · 2 €»**. Todo sale de NUESTRO dato (`entrada_de_pago` de la Fontana en `data/pipeline_v2/roma.json`, ya comprobado con el Ayuntamiento de Roma el 30-09-2026):

- «La fuente se ve gratis desde la plaza a cualquier hora.» → campo nuevo `libre`.
- «Bajar junto al agua» → campo nuevo `titulo`. El importe «2 €» → `precio` (ya estaba).
- El detalle se monta con los campos que ya había: «De 9:00 a 22:00 (los lunes y viernes, desde las 11:30). Última entrada a las 21:00. Gratis fuera de ese horario; también para los menores de 6 años, las personas con discapacidad y su acompañante, y los residentes de Roma. Se paga online o allí mismo, solo con tarjeta.»
- **Sin importe ni horarios en el dato, el bloque sale sin números** (la prueba lo comprueba con un dato de mentira).
- Mismo mecanismo para cualquier sitio de cualquier destino que tenga `entrada_de_pago` (no hay ningún nombre de sitio en el código).

La pestaña sale aunque la Fontana desaparezca de `_entradas.json` (que es lo que hace el otro agente de RESERVAS): no depende de ella. Yo no he tocado `_entradas.json`, ni RESERVAS, ni el «x de 3 listo».

Pregunta abierta (abajo): los lunes. El dato `viernes_desde: 11:30` solo habla del viernes, pero la ficha curada y la nota de la tasa dicen «lunes y viernes». Para la ficha he añadido `desde_tarde_dias: ["lunes","viernes"]` (de esas dos fuentes). El **aviso de la tarjeta de la Fontana en DÍAS** (el motor, `avisoPagoEntrada`) sigue mirando solo el viernes.

## Punto 6 · Menos «10:30» con una entrada reservada

- **Ficha, pestaña Entradas:** «✓ Tu entrada: 10:30» una sola vez. Debajo, sin hora calculada: «Llega unos 30 minutos antes: el control de seguridad y la cola de entrada» (cada sitio con su motivo de `_destino.json`; si no tiene, «hay cola de control»). En el Free Tour: «Llega unos 15 minutos antes a la Plaza de España. Busca el paraguas o el cartel del tour.» Los minutos (30 / 15) salen de la misma regla de llegada de siempre (`llegadas` de `_destino.json`: reserva 30, turno 15, tour 15).
- Lo cambia el motor (`shared/routeEngine/listasTrip.js`, solo la función que escribe esa línea): antes escribía «🕘 Entrada a las 10:30 · llega a las 10:00: …». La hora de llegada sigue yendo en los campos internos de la parada (`arrival_time`) porque la usa la cuenta atrás de HOY; no se enseña.
- Un viaje **guardado** con la línea vieja se pasa a la nueva al pintarla (`src/lib/notaDeLlegada.ts`).
- El **Foro** (que va en la misma entrada que el Coliseo) lleva «✓ Tu entrada: 10:30» pero no la línea de llegar antes (esa es de la entrada, que se pasa en el primer sitio).
- **DÍAS:** la hora ya salía una vez (la pestañita de la entrada en el borde de la tarjeta); la prueba lo asegura.
- **HOY de pago:** la hora salía en la caja «Tu entrada a… · 10:30 ✓» y, si se pulsaba [No me da tiempo] en esa parada, otra vez en «Tienes la entrada reservada a las 10:30». Ahora, mientras ese aviso está abierto, la caja de abajo no repite la hora.
- **HOY gratis:** desde la 6z6 la pestaña HOY es solo de pago, así que esa rama no se alcanza; la hora sigue saliendo una vez en su píldora.
- **RESERVAS:** la hora salía una vez (la línea verde); sin cambios.

## Punto 18 · La etiqueta «Trastevere»

Sale de la **zona** de nuestros datos: `zones.trastevere.etiqueta_barrio = "Trastevere"` en `data/pipeline_v2/roma.json`; el servidor (`/api/destination-excursions`, campo nuevo `etiquetas_por_sitio`) da el nombre de cada lugar cuya zona la lleva, y la app solo lo enseña. Para otro destino basta con poner `etiqueta_barrio` en la zona.

Los sitios que la llevan (los 10 lugares con zona «trastevere» en los datos):

1. Mirador del Janículo
2. Isla Tiberina
3. Iglesia de Santa Maria in Trastevere
4. Villa Farnesina
5. Plaza Trilussa
6. San Pietro in Montorio y Tempietto de Bramante
7. Fontana dell'Acqua Paola
8. Basílica de Santa Cecilia in Trastevere
9. Trastevere
10. Mirador de San Pietro in Montorio

(La prueba comprueba que son EXACTAMENTE esos, y que ningún lugar de otra zona la lleva.) No la llevan los restaurantes (no son paradas de la ruta) ni el «Paseo por Trastevere» (el paseo libre): ver preguntas.

Dónde sale: **tarjeta de la parada en DÍAS** (la última píldora de la fila de etiquetas), **HOY** (bajo el horario de cada parada, en la lista y en la tarjeta oscura de «Siguiente parada», con su variante para fondo oscuro), **EXPLORAR** (en la tarjeta de cada lugar, en el renglón de las etiquetas) y **la ficha** (entre las etiquetas pequeñas del nombre).

El color: **lila azulado, matiz 285 (oklch)**, una píldora suave con borde fino. Se define UNA vez, en `src/index.css`, como tokens `--barrio-lila`, `--barrio-lila-soft`, `--barrio-lila-borde` (con su variante de noche, que a su vez sale de `--barrio-lila-noche*`), y se llama desde `tailwind.config.ts` (`barrio-lila…`). No hay ningún número del lila en los componentes (la prueba lo busca).

- Contraste del texto: 7,78 sobre su fondo suave y 9,54 sobre la tarjeta (mínimo 4,5); en noche 8,51 y 10,27.
- A 36° del morado de los días (321) y del azul de los días (249); a 100° del frambuesa (5). La prueba mide el matiz de los 8 colores de día (`src/lib/dayColors.ts`) y del `--accent`. Además es una píldora suave (luz alta, color flojo) y los colores de los días son círculos y pines sólidos y saturados, así que no se confunden aunque estén cerca.
- Ojo: la tarjeta de «noche» de DÍAS usa también tonos azul-violeta (matiz 285) en sus etiquetas. Una parada nocturna de Trastevere llevará la píldora lila junto a etiquetas del mismo tono, aunque la nuestra tiene borde y la palabra «Trastevere». Si queda confuso en pantalla, lo más fácil es mover el lila 10° (un solo número).

## Archivos tocados

Nuevos: `src/components/route/dayDetail/FichaPiezas.tsx`, `src/components/ui/EtiquetaBarrio.tsx`, `src/lib/notaDeLlegada.ts`, `shared/routeEngine/fichaLugar.js`, `scripts/destino/pruebaFase6y4_ficha.mjs`, `scripts/destino/_6y4_ficha_entrada.tsx`.
Cambiados: `StopDetailSheet.tsx` (reescrito el pintado; la lógica de datos igual), `StopReservation.tsx`, `ReservedMarks.tsx` (`timeLabel` puede ser null), `BotonFotoParada.tsx` (opción `esquina`), `Escuchar.tsx` (opción `barra`), `useEscuchar.ts` (aviso de progreso), `placeDetailApi.ts` y `nearbyTransitApi.ts` (la nota del transporte va aparte), `destinationExcursions.ts`, `TrazoCards.tsx`, `StopAccordion.tsx`, `HoyDurante.tsx`, `PlaceExplorerScreen.tsx`, `index.css`, `tailwind.config.ts`, `server/index.js` (dos campos nuevos en `/api/destination-excursions`), `shared/routeEngine/listasTrip.js` (la línea de llegar antes), `data/pipeline_v2/roma.json` (la zona y la tasa de la Fontana) y `data/dias/roma/_destino.json` (el texto genérico de llegada).

## Pruebas

- `pruebaFase6y4_ficha.mjs`: **122 comprobaciones, 0 fallos.** Lleva: la etiqueta (los sitios exactos de la zona, y solo ellos, en DÍAS, HOY, EXPLORAR y la ficha), su color (definido una vez, contraste, distancia a los días y al frambuesa), la Fontana (bloque con datos y sin números), el motor (la línea de llegar antes sin hora, 30 y 15), la hora de la entrada una vez en la ficha, DÍAS, HOY y RESERVAS, la cámara en la esquina (una, gratis/pago), «Escuchar la historia», y cada pieza del diseño con y sin datos.
- Las demás, con 0 fallos: `pruebaTanda6z6b`, `pruebaTanda6z6` (a, b, c, d), `pruebaCorr6z6`, `pruebaFase6z6f`, `pruebaFase6y_manual`, `pruebaFase6y2_*` (formulario, fotos, reorganizar, reservas), `pruebaFase6y3_*` (formulario, fotos, reservas), `pruebaTanda6s`, `pruebaTanda6u`, `pruebaTanda6v`, `pruebaFotos6z3` y `pruebaTanda6z5`. `npx tsc --noEmit -p tsconfig.app.json`: sin errores.
- Pruebas existentes que he **tenido que ajustar** por mi trabajo (solo la parte que cambió, no su intención):
  - `pruebaTanda6z6c.mjs`: miraba que «Escuchar» estuviera dentro de la pestaña «Resumen» en el código; ahora es la barra de la ficha (en todas las pestañas) con el texto del Resumen.
  - `pruebaFase6y2_fotos.mjs`: dos comprobaciones de forma del código (la imagen sale solo con foto, y `<FotoCredito photo={photo} />` ahora lleva una clase). La intención (sin imagen rota; un solo sitio para el crédito) se mantiene.

## Lo que no he podido hacer o verificar

- **Nada a 375 px ni en un navegador.** Lo visual (que la cámara quepa en la esquina, la barra de «Escuchar» sobre el contenido, la bolita de las pestañas, el recorte de la foto, la altura del panel sobre el mapa, el lila en noche) lo tienes que mirar tú. Puntos concretos a mirar: (1) la cámara de 32 px y su zona de toque (le he dado 8 px de margen invisible); (2) que la barra de «Escuchar» no tape el final del texto (le he dejado 110 px de margen al pie cuando está); (3) el aviso de error de subida de la foto, que sale flotando bajo la cámara.
- Los archivos del diseño (`Ficha Lugar.dc.html`, `support.js`, `image-slot.js`) no estaban en el commit de esta rama: los leí de la carpeta del repo principal.
- No he arrancado la app con Mapbox: el mapa de la ficha no cambia, pero la prueba lo sustituye por un hueco.
- La barra «Escuchar la historia» no he podido oírla (la prueba simula la voz).

## Preguntas abiertas

1. **Lunes de la Fontana.** El aviso del motor en DÍAS («Gratis y sin gente: antes de las 9:00 no se paga») usa `viernes_desde` y solo mira el viernes; la ficha curada y la nota oficial dicen que **los lunes** también abre la tasa a las 11:30. ¿Lo corregimos en el motor (lunes y viernes)? Yo solo he tocado la ficha.
2. **El «Paseo por Trastevere»** (el paseo libre de la zona) y los restaurantes de Trastevere no llevan la etiqueta. ¿La quieres también en el paseo? (Es una parada de DÍAS con otro nombre: «Pasea y piérdete por…»; habría que darle la zona.)
3. **«Llega unos 30 minutos antes»** usa el motivo de cada sitio de `_destino.json` (`por_lugar`: «el control de seguridad y la cola de entrada» para el Coliseo, «la cola del control de seguridad» para los Museos…). Tu ejemplo era «hay cola de control»; ese texto sale en los sitios sin motivo propio. ¿Prefieres «hay cola de control» en todos?
4. **Tarjeta de «noche» de DÍAS:** el lila se parece al azul-violeta de esa tarjeta (ver arriba). ¿Lo movemos si se confunde?
5. **«Reservada ✓» y «Fijada» en la ficha:** he quitado «Reservada ✓» (lo dice «✓ Tu entrada») y dejado «Fijada». ¿Bien?
6. **HOY gratis:** su rama del código sigue ahí pero no se alcanza desde la 6z6. ¿La quitamos o la dejamos por si vuelve?
