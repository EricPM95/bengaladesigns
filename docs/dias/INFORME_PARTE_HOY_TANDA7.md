# Tanda 7 · Parte HOY (llegada, vuelta y «+ Más visitas»)

Rama `worktree-agent-a3a667fa46c801f11`, que salió de un commit viejo: lo primero fue avanzarla a `main` (58b6f3a, sin conflictos). Sin push.

## 1. Qué cambió, punto por punto

**1a. El día de llegada (HOY, de pago).** Antes de la primera parada sale la tarjeta «Llegada a Fiumicino» (o Ciampino, Termini, Tiburtina, Civitavecchia) con el billete de DÍAS (`BilleteDeVuelo` / `billeteDe`), que al tocarlo abre la ficha de llegada; debajo, [Cómo llegar a tu alojamiento] (`BotonComoLlegarAlojamiento`) solo si hay dirección. La tarjeta sale solo con la hora del viajero (sin ella no hay billete) y no sale en coche. Solo en el primer día que no es de vuelta.

**1b. El día de vuelta.** Después de la última parada: «Llegada al aeropuerto de Fiumicino» («a la estación de Termini», «al puerto de Civitavecchia») con [Cómo llegar] (Google Maps en transporte público, al punto) y, en pequeño y subrayado, «Ver cómo ir», que abre la ficha de vuelta. Sin paradas: la tarjeta «Hoy vuelves a casa» (ver apartado 4) en lugar de «Siguiente parada», sin la lista y sin la llegada al aeropuerto. Con salida de madrugada, el último día de ruta termina con la tarjeta «Tu vuelo sale esta noche…» (viene en `returnDay.tarjetaUltimoDia`).

**1c. Al acabar cada día:** [Cómo llegar a tu alojamiento] si hay dirección (también en el día de excursión; no en el de vuelta).

**1d.** Nunca «sal a las…» y ninguna hora calculada: las únicas horas son las del viajero (dentro del billete y en el texto de la tarjeta del motor). [No me da tiempo] y [Deshacer] siguen igual. En la gratis HOY no existe, así que nada de esto sale.

**2. «Más para tu día».** [+ Más visitas] junto a [No me da tiempo] (dos columnas) y también en «Todo visto por hoy» (justo cuando se va bien de tiempo). Abre `HojaAbajo` con el título y el texto escritos; la lista son las paradas de «Si te sobra tiempo» del día (el motor ya deja fuera restaurantes y nocturnas), ordenadas por imprescindible, nivel 1, 2, 3 y, a igual peso, la más cercana a la ruta de hoy primero; cada una con foto pequeña, tiempo de visita y [Añadir]. [Añadir] usa `addSpareStop` (ahora con un índice opcional) y `withUndo`: entra donde menos rodeo hace, nunca antes de lo ya visto o saltado, sin quitar ni mover nada, con el aviso «Añadido al miércoles 5» y [Deshacer]. Solo en días recortados y si queda alguna; con la última añadida el botón desaparece.
- Qué es «recortado» (`src/lib/masVisitas.ts › diaRecortado`): el día de llegada con `arrivalPlan.caso` = `rapido`, `de_tarde` o `ruta_del_centro` (la entera, el anochecer y la noche no), y el día de vuelta con `returnDay.contenido === 'manana'`.
- Peso: `importancia_por_sitio` del servidor (imprescindible / nivel 1) y `level` del catálogo (2, 3). Nada escrito para Roma.

**3. «Cerrado este día».** D ya lo ponía en DÍAS; en HOY solo salía por el horario de los datos. Ahora la parada con `closedThisDay` lo dice también en la tarjeta oscura y en la lista, y no avisa «cierra hoy a las…».

Ficheros: `src/components/route/hoy/{HoyDurante,piezas}.tsx` (tocados), `hoy/llegadaVuelta.tsx`, `hoy/masVisitas.tsx`, `hoy/SlotVuelvesACasa.tsx`, `src/lib/{masVisitas,llegadaVueltaHoy}.ts` (nuevos); `src/lib/{types,mapGeneratedRoute,mapsLinks,destinationPlacesApi}.ts` y `src/store/useRouteStore.ts` (mínimos).

## 2. Un hueco que he cerrado a medias (importante)

El cliente **no mapeaba** lo que el motor devuelve (`arrival_day`, `arrival_plan`, `return_day`, `is_return_leg`) y **tampoco manda** `llegada` ni `vuelta` al servidor (`rebuildDay`, orquestador). He añadido el mapeo (camelCase: `DayPlan.arrivalDay`, `arrivalPlan`, `returnDay`, `isReturnLeg`) para poder leerlo. **Falta que alguien envíe `llegada`/`vuelta` al generar y al rehacer** (parte del rehacer, agente I, o integración): sin eso, en la app real la tarjeta de llegada y la de vuelta salen (solo dependen de las horas de RESERVAS), pero [+ Más visitas] y «Hoy vuelves a casa» no, porque los días no vienen recortados del motor. En la prueba los días salen del motor con `llegada`/`vuelta` y el mismo mapeo.

## 3. Verificado a 375 px (Chrome con Playwright, Supabase bloqueado, API en el 8896)

Metí los viajes de la prueba en el almacén de la app (el rehacer aún no manda llegada/vuelta) y fijé la fecha de hoy. Capturas en `docs/dias/img/7-hoy-*.jpg`:
- `1-llegada-arriba`, `2-llegada-botones`, `3-llegada-final`: «Llegada a Fiumicino» con el billete BCN → FCO y [Cómo llegar a tu alojamiento]; [No me da tiempo] y [+ Más visitas] lado a lado.
- `4-mas-visitas-hoja`, `5-anadido-deshacer`, `6-tras-deshacer`, `7b-vuelta-mas-visitas`: la hoja (Altar de la Patria, Foro, Coliseo), el aviso con [Deshacer], y la mañana del día de vuelta (Museos Capitolinos, Mercados de Trajano, Santo Bambino, Teatro de Marcelo).
- `7-vuelta-arriba`, `8-vuelta-aeropuerto`, `9-vuelta-ficha`: «Llegada al aeropuerto de Fiumicino» con [Cómo llegar] y «Ver cómo ir» que abre la ficha de vuelta.
- `10-hoy-vuelves-a-casa`: la ranura con los datos del motor.

**No visto:** las fotos pequeñas salen como recuadro gris (en esos viajes de prueba las fotos reales no se habían pedido todavía; la URL de relleno no pinta); el clic en «Cómo llegar» (abre Google Maps, comprobado el enlace en la prueba); la gratis en el navegador (HOY ni existe; comprobado en la prueba); tren, autobús y barco solo en la prueba (no en el navegador).

## 4. La tarjeta «Hoy vuelves a casa» (agente H)

No estaba en ninguna copia. `hoy/SlotVuelvesACasa.tsx` es la ranura: pinta título, texto, «Desde tu zona…», [Ver cómo ir] (abre la ficha de vuelta) y la despedida con los datos del motor. Al integrar H, se cambia el cuerpo de ese componente (recibe `tarjeta` y `onVerComoIr`); HOY no se toca. «¿Crees que te da tiempo a ver algo?» y [Explorar monumentos] no están en la ranura: los trae H.

## 5. Pruebas

- Nueva `scripts/destino/pruebaTanda7_hoy.mjs` (+ `_tanda7_hoy_entrada.tsx`): 124 comprobaciones, 0 fallos. Cubre llegada (5 puntos y medios, orden, billete, alojamiento con y sin dirección, gratis, coche, sin hora), vuelta (aeropuerto, estación, puerto, [Cómo llegar], «Ver cómo ir», sin paradas, madrugada), más visitas (solo recortados, orden por peso y cercanía, hoja, añadir por fuerza bruta del menor rodeo, nada quitado, [Deshacer] exacto, última añadida), «Cerrado este día» y textos (sin «sal a las…», sin horas ajenas, sin empresas, sin emojis). `VOLCAR=carpeta` deja los viajes en JSON para verlos a mano.
- Typecheck `npx tsc --noEmit -p tsconfig.app.json`: limpio.
- Regresión en serie (API en el 8896), todas a 0 fallos: Tanda6z3, 6z3_dias, 6z5, 6z6 (a-d), 6s, 6t, 6v, 6x_franjas, 6z, 6z2, Tanda7_reservas, Tanda7_mover, Fotos6z3, Corr6z6 (las cuatro), Fase6y2/3/4_reservas, 6y5_pantallas, 6y7_titulos, 6y7_pantallas, 6y9_pantallas, 6y10_ficha. No hizo falta ajustar ninguna vieja. No he lanzado las pruebas del motor (pruebaFase6y2_* a 6y10_* de listas/viajes/comida/horarios, Tanda7_llegada/vuelta/integración): no toqué el motor ni el servidor, solo el cliente y un parámetro opcional del almacén. `pruebaFase6y2_reorganizar` y `pruebaFase6y_reorganizar` ya fallaban en `main` (no son mías).

## 6. Textos de invariantes propuestos

1. En HOY de pago, el día de llegada lleva «Llegada a {punto}» con el billete antes de la primera parada; sin la hora del viajero, o en coche, no sale.
2. En HOY, el día de vuelta con paradas termina con «Llegada al aeropuerto de {punto}» (o estación, o puerto) con [Cómo llegar] y «Ver cómo ir»; sin paradas es la tarjeta «Hoy vuelves a casa», y nunca las dos.
3. [Cómo llegar a tu alojamiento] sale en HOY solo con dirección, tras la llegada y al acabar cada día de ruta; nunca en el día de vuelta.
4. [+ Más visitas] sale solo en un día recortado con algo en «Si te sobra tiempo»; la lista va de imprescindible a nivel 3 y, a igual peso, la más cercana; [Añadir] entra donde menos rodeo hace, sin quitar nada y con [Deshacer].
5. Ningún texto de HOY dice «sal a las…» ni enseña una hora que calcule la app.

## 7. Decidido por Code

- «Recortado» = casos `rapido`, `de_tarde`, `ruta_del_centro` del día de llegada y mañanas del día de vuelta (el documento no da la lista exacta).
- Sin la hora del viajero no hay tarjeta de llegada ni de vuelta (la barra de DÍAS sigue pidiendo el vuelo).
- La tarjeta de llegada lleva su propio [Cómo llegar a tu alojamiento] y el del final del día se repite el día de llegada.
- `tarjetaUltimoDia` se lee del día de vuelta (`returnDay`), porque el motor la deja ahí y no en el último día de ruta.
- Con 3 noches la llegada rápida/de tarde casi nunca deja nada fuera (el resto del viaje lo cubre): el botón sale sobre todo con 1-2 noches y en las mañanas de vuelta largas (D6, DA-medio).
- La hoja se queda abierta tras [Añadir] (se pueden añadir varias); se cierra sola al añadir la última.

## 8. Preguntas abiertas

1. ¿Quién envía `llegada` y `vuelta` al servidor al generar y rehacer? Sin eso HOY no recibe días recortados ni la tarjeta «Hoy vuelves a casa» (apartado 2).
2. Una parada del día cuya hora ya pasó: [Añadir] la mete detrás de lo visto, pero no mira la hora del reloj. ¿Está bien (la app avisa y no prohíbe)?
3. ¿Quieres el aviso «Añadido al miércoles 5» más corto, tipo «Añadido a hoy»?
4. En «Llegada a Termini» (tren) el billete enseña «TERMINI» como código. ¿Se queda?
5. Las fotos de la hoja dependen de que ya estén pedidas: ¿las pedimos al abrir la hoja?
