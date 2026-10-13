# Tanda 6y10 · Parte FICHA (agente D): la ficha del lugar, los «me gusta» y la etiqueta de Trastevere

Todo en palabras sencillas. Commits locales, sin push.

## Qué cambió, punto por punto

### Punto 2 · La ficha del lugar: dos etiquetas y el corazón

- **Debajo del nombre, solo dos etiquetas** (`StopDetailSheet.tsx`):
  - el **reloj** con el horario de ese día, sin texto: `08:30–18:30`. Si ese día no abre, `Cerrado` (en rojo). Con dos tramos (cierre de mediodía), los dos: `09:00–13:00 y 15:00–19:00`. Sin fechas, el horario del mes del viaje. Un sitio sin horario en los datos (una fuente, una plaza) no lleva reloj, solo el de arena;
  - el **reloj de arena** con el tiempo que recomendamos: `1h 15min`.
- **Fuera de la ficha**: «Monumento», «Fuente», «Mirador», «Ruinas», «Reserva obligatoria / Requiere reserva», «Acceso libre», «Abierto», «Abre a las…», la etiqueta lila de Trastevere y también la pastilla «Experiencia nocturna» (no era una de las dos; la luna junto al nombre sigue). Esas etiquetas siguen donde estaban fuera de la ficha (listas y tarjetas).
- **De dónde sale el horario**: de `horarioDeParada` (`src/lib/horarioDeParada.ts`), que lee los datos del sitio con los mismos ayudantes del motor (`shared/routeEngine/openingHours.js`) y es lo que ya pintan las tarjetas de DÍAS y HOY («Abre 8:30 – 18:30»). Así la etiqueta no puede decir otra cosa que la tarjeta. La etiqueta se escribe en `src/lib/etiquetaHorario.ts`. Como el agente A cambia los DATOS de horarios en paralelo, no hay que tocar nada aquí cuando lleguen: la etiqueta los lee.
- **Iconos**: los de la familia fina de la app (`reloj`, `arena`, `gusta`), sin emojis.
- **El corazón** debajo de las etiquetas, como en el diseño «Ficha Lugar»: botón redondeado con el corazón y «**154** lo recomiendan». Al tocarlo se marca (corazón relleno que crece con rebote, fondo rosado suave) y al tocarlo otra vez se quita. Con «reducir movimiento» cambia sin animar. Solo sale en los sitios del catálogo del destino (no en un sitio de Mapbox cualquiera ni en el Free Tour). La parada de noche («Coliseo (noche)») cuenta en su sitio de día.
- Menos de 20 «me gusta» en total: sin número («Sé el primero en recomendarlo» con 0, «Ya lo han recomendado» con 1–19). Nunca dice «viajeros».

### Los «me gusta» de partida

- Campo nuevo `megusta_inicial` en cada sitio de `data/pipeline_v2/roma.json` (95 lugares y 71 restaurantes) y la nota una sola vez, en `megusta_inicial_nota`: «redes de Eric, aproximado por debajo del real».
- **Cómo se generó**: `scripts/destino/megustaInicial6y10.mjs`. La cifra sale del NOMBRE del sitio con una semilla fija (`megusta-6y10`, mezcla FNV-1a), nunca al azar: correrlo dos veces da lo mismo, y la prueba lo comprueba contra lo guardado. Edita `roma.json` solo por líneas (una línea nueva por sitio, con la sangría del fichero; +167 líneas, nada más cambia).
- **Rangos**: nivel 1 (los 7 imprescindibles y las 4 joyas; en los datos son `level: 1`): 100–199 · nivel 2 (35 lugares): 50–99 · nivel 3 (49): 0.
- **Restaurantes**: los que más salen en `data/dias/roma/listas.json` (comida y cena: el principal, la alternativa y la tercera, en todas las partes, variantes y pools). **Son 21** (el corte cae entre el 21 —con 3 apariciones, todos los empatados dentro— y el 22, que sale 2 veces): Borghiciana Pastificio Artigianale (32), Dal Toscano (32), L'Arcangelo (31), Osteria dell'Angelo (31), Armando al Pantheon (21), Supplizio (17), La Taverna dei Fori Imperiali (10), Trattoria Valentino (10), Poldo e Gianna Osteria (9), Il Gabriello (7), Tonnarello (7), Trattoria Da Enzo al 29 (7), Checco er Carettiere (6), Giggetto al Portico d'Ottavia (6), Nonna Betta (5), Da Lucia (5), Pizzeria Da Baffetto (4), Buccone Vini e Olii (3), Felice a Testaccio (3), Piperno (3), Sgarro Bistrot (3). Tienen entre 100 y 199. Los otros 50 restaurantes: 0.
- El servidor lo manda como `likes_initial` en `/api/destination-places` (lugares y restaurantes).
- Ejemplos: Coliseo 164, Museos Vaticanos 194, Fontana de Trevi 145, Panteón 133, Foro Romano 132.

### La cuenta única (una sola por sitio, la misma en toda la app)

- **Un solo almacén**: `src/store/useMeGustaStore.ts` (zustand). Cuenta de un sitio = **partida + viajeros**. La ficha de un lugar, la tarjeta de EXPLORAR y la ficha de un restaurante leen y escriben ahí; ya no hay otra cuenta en la pantalla de EXPLORAR.
- **Una sola pieza**: `src/components/ui/MeGusta.tsx` (variantes `ficha` y `tarjeta`) con el gancho `src/lib/useMeGusta.ts`. El corazón se dibuja en un único sitio.
- **Dónde se guarda lo de los viajeros**:
  - sin login: en la nube con la sesión anónima de siempre (`place_likes`, `placeLikesApi.ts`; es como se guarda el viaje) **y además** en el dispositivo (`trazo:megusta:<destino>`), para que el corazón funcione sin nube y no se pierda. Al volver la nube se suben los que quedaron sin subir;
  - con login: la sesión anónima se convierte en cuenta y conserva el mismo identificador, así que sus «me gusta» ya quedan en su cuenta (no hace falta nada más).
  - El total nunca cuenta dos veces al mismo viajero (se quita lo que la nube cree de él y se pone lo que tiene marcado ahora).
- **Orden de EXPLORAR**: «Recomendados» y la ruta a mano ordenan por la SUMA (`totalesDe`). La tarjeta enseña `♡ 154` (solo el número).
- Se quitaron los números de prueba inventados (`?prueba=1`) y su botón «De prueba / Los de verdad» del panel de pruebas: con cifras de partida reales ya no tenían sentido y hacían que el Coliseo enseñase números distintos según el interruptor.

### Punto 3 · Etiqueta lila «Trastevere»

Solo en los acordeones de DÍAS y HOY (`StopAccordion`, `TrazoCards`, `ZoneWalkCard`, `HoyDurante`). Quitada de la ficha y de las tarjetas de EXPLORAR.

## Pruebas

Typecheck `npx tsc --noEmit -p tsconfig.app.json`: sin errores. Todas las pruebas, en serie, con mi servidor (puerto 8874): **0 fallos**.

- **Nueva**: `scripts/destino/pruebaFase6y10_ficha.mjs` (+ `_6y10_ficha_entrada.tsx`): 299 comprobaciones. Mira: la ficha solo con sus dos etiquetas y el corazón (ninguna de las quitadas, ni Trastevere, ni «viajeros»); el reloj dice el horario de esa fecha, «Cerrado» (Museos en domingo, en rojo) y el del mes sin fechas; cifras de partida en su rango por nivel, fijas (el script da lo mismo dos veces y lo guardado), con la nota, y los 21 restaurantes son los que más salen; el servidor las manda iguales en dos peticiones; la misma cuenta en la ficha, en EXPLORAR y en la ficha de restaurante; dar y quitar el «me gusta» en uno se ve en los otros; los de los viajeros se suman a los de partida sin contar dos veces al mismo viajero; EXPLORAR ordena por la suma (también la ruta a mano) y la tarjeta es solo el número; Trastevere solo en DÍAS y HOY; una sola pieza `MeGusta`, sin nombres de sitios, colores ni emojis en el código nuevo.
- **Pasan a 0 fallos** (las que he tenido que ajustar van abajo): 6y4_ficha (124), 6y5_pantallas (247), 6y7_pantallas (77), 6y9_pantallas (92), 6y7_historias (554), 6y_manual (1706), 6y2_formulario/fotos/reorganizar/reservas, 6y3_formulario/fotos/reservas, 6y4_formulario/iconos/listas/perfil/presupuesto/reservas, Corr6z6 (y sus tres partes), Tanda6z3 (29831, 10 pantallas de HOY), 6z5, 6z6a-d, Tanda6z6, Fase6z6e/f/fWikimedia, Fotos6z3, Tanda6x_franjas (42665), Tanda6z3_dias (48620), Fase6y9_fichas y Tanda6z. Sin emojis en `src` (lo comprueban 6y4_iconos y 6z3 y mi prueba para lo nuevo).
- **Pruebas antiguas que he ajustado (lo mínimo)**:
  - `pruebaFase6y4_ficha.mjs`: la etiqueta «Trastevere» ahora debe salir 0 veces en la ficha y en EXPLORAR (antes 1 y ≥5) y seguir saliendo en DÍAS y HOY. (La ficha ya no lleva «Requiere reserva», «Acceso libre» etc.; esa prueba no miraba esas etiquetas, y las comprueba la nueva.)
  - `pruebaFase6y3_reservas.mjs`: la regla de la ruta a mano recibe la cuenta única (`likesTotales`), no `likes.counts`.
  - `pruebaTanda6z.mjs`: el bloque «Recomendaciones» comprobaba los números de prueba inventados (`?prueba=1`), que ya no existen; ahora comprueba el entorno de prueba, el umbral de 20 y los textos sin «viajeros».
  - `pruebaTanda6z6a.mjs` (+ `_6z6a_entrada.tsx`): el panel de pruebas ya no tiene «Números de «me gusta» · De prueba / Los de verdad» ni `fijarPrueba/pruebaActiva`.

## A 375 px (Playwright con el Chrome del equipo, Supabase bloqueado, viaje Madrid→Roma creado por el formulario)

Capturas en `docs/dias/img/`:
- `6y10-ficha-coliseo-con-fechas.jpg` (jue 15 oct: `08:30–18:30`, `1h 15min`, «164 lo recomiendan»; es también el «antes» del corazón);
- `6y10-corazon-despues.jpg` (tras tocarlo: corazón relleno y «165»);
- `6y10-ficha-coliseo-sin-fechas.jpg` (viaje sin fechas, marzo: `08:30–17:00`);
- `6y10-ficha-trevi-con-fechas.jpg` y `6y10-ficha-trevi-sin-fechas.jpg` (la Fontana no tiene horario en los datos —se ve gratis a cualquier hora—, así que lleva solo `20min` y el corazón: «145 lo recomiendan»);
- `6y10-ficha-dia-que-cierra-museos-domingo.jpg` (Museos Vaticanos abierta desde «+ Añadir parada» en el domingo 18 oct: `Cerrado` en rojo, `3h`, «194 lo recomiendan»);
- `6y10-explorar-orden-megusta.jpg` y `6y10-explorar-corazon-marcado.jpg` (EXPLORAR › Atracciones, «Recomendados»: de 194 hacia abajo; tarjeta con `♡ 165` marcado);
- `6y10-ficha-coliseo-desde-explorar.jpg` (la ficha abierta desde EXPLORAR enseña lo mismo);
- `6y10-dias-con-etiqueta-trastevere.jpg` (la Isla Tiberina añadida al jueves 15: la etiqueta lila «Trastevere» sale en el acordeón de DÍAS) y `6y10-explorar-sin-etiqueta-trastevere.jpg` (la misma Isla en EXPLORAR, sin etiqueta; 0 etiquetas en toda la lista de Atracciones).

Comprobado en el navegador: Coliseo 164 en la ficha y en EXPLORAR; darlo en EXPLORAR → 165 y marcado en la ficha; quitarlo en la ficha → 164 y sin marcar en EXPLORAR; orden de EXPLORAR 194, 188, 175, 165, 164, 155, 151, 145, 145, 133, 132, 98…

**Qué no se pudo ver**: la nube real (Supabase estaba bloqueado a propósito: se vio el modo sin nube, con el «me gusta» guardado en el dispositivo); una ficha con «Cerrado» llegando por DÍAS (el motor ya no pone los Museos en un domingo si hay otro día: salió abriéndola desde «+ Añadir parada», que usa la misma ficha y la fecha de ese día); la etiqueta lila en HOY (solo la comprueba la prueba, no la vi en pantalla: HOY solo se abre el día del viaje); la ficha de un restaurante (solo en la prueba).

## Decidido por Code

1. La etiqueta del reloj usa `horarioDeParada` (el adaptador de las tarjetas de DÍAS/HOY) y no `horarioDeLaFecha` directamente: lee los mismos datos con los mismos ayudantes del motor, y así ficha y tarjeta no pueden separarse. Enseña de la apertura al **cierre** (no a la última entrada).
2. Quité también la pastilla «Experiencia nocturna» de debajo del nombre: «solo dos etiquetas».
3. El número solo sale desde 20 en total (como ya estaba por la regla 513). Con las cifras de partida, todos los de nivel 1 y 2 y los 21 restaurantes lo llevan siempre.
4. Cada sitio del catálogo lleva corazón en la ficha; el Free Tour, los paseos libres, los descansos y los sitios que no son del catálogo (Mapbox) no.
5. Los «me gusta» sin nube se quedan en el dispositivo y cuentan en pantalla (antes, sin nube, el corazón se revertía y no hacía nada).
6. Quité el interruptor de números de prueba del panel de pruebas y `pruebaActiva/fijarPrueba/recomendacionesDePrueba` (ver arriba). `esEntornoDePrueba` se queda (lo usan el panel y la lluvia de prueba).
7. El puerto 8864 que pedía el encargo estaba ocupado por otro servidor (de otro agente): usé el 8874 para mi servidor y 5186 para el front.
8. Pruebas antiguas ajustadas: ver arriba.

## Preguntas abiertas

1. En EXPLORAR, con las cifras de partida, la Basílica de San Pedro (188) y la Plaza de San Pedro (175) salen por delante del Coliseo (164) y el Foro (132): las cifras salen de una semilla, no de las redes. ¿Quieres ajustar a mano alguna (por ejemplo, el Coliseo siempre el primero de su nivel)? Basta con cambiar el número en `roma.json` y no volver a correr el script, o decirme el orden que prefieres.
2. Los «me gusta» sin nube (solo en el dispositivo) se suben cuando vuelve la nube. Si alguien lo quita sin nube y la nube todavía lo tenía, al volver se vuelve a marcar. Es un caso raro; ¿lo cuidamos más?
3. Cuando haya otro destino curado, ¿las cifras de partida se piden a las redes de Eric ciudad por ciudad (campo `megusta_inicial` a mano) o el script con semilla también para ellos?
