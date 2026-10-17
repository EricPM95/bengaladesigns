# Tanda 8B · Los momentos de los logros

Todo está detrás de `logrosActivos()`: con los logros apagados no se monta nada. Sin commit ni push (como pedía el encargo).

## Qué hay y dónde

Todo en `src/components/logros/momentos/`:

| Archivo | Qué es |
|---|---|
| `MomentosHost.tsx` | Lo único que entra en el paquete al abrir la app (muy pequeño). Lee `useLogrosStore.momentos`, espera mientras `hojaAbierta` y lanza el reproductor. Monta también el resumen, compartir, la hoja del botón y «Hoy empiezas a ganar logros». |
| `Reproductor.tsx` | Las sorpresas una a una; tocar la pantalla o [Seguir] pasa a la siguiente (el dibujo vuela al botón de logros o al Perfil); [Saltar todo] va al final; al final siempre el resumen del día. Marca lo visto con `POST /api/logros/animacion-vista`; si se saltó algo, deja el puntito. |
| `plan.ts` | (pura) el orden y cómo se agrupan las pantallas. |
| `pantallas.tsx` | Las pantallas: sello (nace o sube de grado con su estallido), colecciones (solas o varias juntas), país / destino / continente (estampa del pasaporte), maravilla, patrimonio, logro de viajero, «Y además…». |
| `EscenaDeEmblema.tsx` | `EscenaDeEmblema({ id, primeraVez, frase, onSeguir })`: la escena de un emblema. Es lo que usará la 8c para repetir un emblema guardado (`primeraVez` falso = sin frase ni suspense). |
| `escenas/` | Una escena por emblema (`coliseo`, `panteon`, `fontana_de_trevi`, `foro_romano`, `museos_vaticanos`, `plaza_san_pedro`, `basilica_san_pedro`, `boca_de_la_verdad`, `ojo_cerradura`, `catacumbas`, `madrugador`, `nocturno`), cada una con su `import()` perezoso (`escenas/index.ts`). `cine.tsx` es lo común. |
| `Fuegos.tsx` | Fuegos artificiales y destellos: solo se usan en la película del Coliseo y en las maravillas. |
| `BotonFlotanteLogros.tsx` | `<BotonFlotanteLogros />`: botón de 58 px con el sello y su aro de avance (y el puntito). Se puede montar en cualquier pantalla del viaje; si hay dos montados solo se dibuja uno. Ya está montado en `RouteScreen.tsx` (se ve en RUTA, DÍAS y HOY). |
| `HojaLogros.tsx` | La hoja sencilla que abre el botón (sellos con grado, colecciones con avance, «N de 12 secretos»). Nunca enseña emblemas. La de verdad es de la 8c. |
| `ResumenDia.tsx` / `ResumenViaje.tsx` | Resumen del día y del viaje (los dos textos de `roma.json › textos.resumen_viaje`: lo conseguido arriba, lo pendiente debajo con su cuenta atrás). |
| `Compartir.tsx` + `imagen.ts` | «Compartir un logro» (C1) y «Compartir el viaje» (C2). La imagen (1080×1920) se genera en el navegador con un lienzo; [Guardar imagen] la descarga y [Compartir] usa `navigator.share` con archivo (si no se puede, descarga). |
| `PrimerDia.tsx` | «Hoy empiezas a ganar logros» con [Empezar mi día]; sale una vez (se recuerda en el móvil con `trazo:logros:primerdia`). |
| `useMomentosUI.ts` | Qué está abierto. Se abre desde fuera con `useMomentosUI.getState().abrirResumenDia()`, `abrirResumenViaje()`, `abrirCompartir({tipo:'logro', momento})`, `abrirHojaLogros()`. |
| `demoMomentos.ts` | Solo desarrollo (`import()` desde el anfitrión): `window.__momentos` con `lanzar(tipo)`, `serieCompleta()`, `repetir(id)`, `resumenDia()`, `resumenViaje('wow'|'con_ganas')`, `compartirLogro()`, `compartirViaje()`, `hoja()`, `primerDia()`, `cerrar()`. |

## Ediciones en archivos compartidos (todas mínimas)

- `src/App.tsx`: un `import` y `<MomentosHost />` junto a `<LogrosPorVisto />`.
- `src/components/route/RouteScreen.tsx`: un `import` y `<BotonFlotanteLogros />` al final.
- No he tocado `useLogrosStore.ts`, `src/lib/logros.ts`, `src/lib/sonidos.ts`, `dibujos/index.tsx`, `server/` ni `data/`.

## Lo que decidí distinto al diseño o al servidor (y por qué)

1. **Orden de las sorpresas.** El servidor manda el emblema primero (`ajustes.json › orden_momentos`); el diseño («Un solo Visto, muchas cosas») pide: sello, colecciones (todas juntas), emblema y «Y además…». Mandé el diseño y lo reordeno en el móvil (`plan.ts`). Si Eric prefiere el orden del servidor, es cambiar ese archivo. No toqué `ajustes.json`.
2. **«Y además…».** Si salen 2 o más de maravilla / Patrimonio / destino nuevo / país / continente / logro de viajero, van juntos en una pantalla (como en J). Si sale uno solo, tiene su pantalla propia.
3. **La maravilla del Coliseo** ya va dentro de la película (la tarjeta «Y además… Tu primera maravilla · 1/7»), así que no sale otra vez aparte.
4. **Los sellos «suma_sello»** (la línea «1 de 8» del sello) no tienen pantalla propia: el avance ya se ve en las colecciones y en el sello.
5. **Emblema en cine:** tocar la pantalla va directo al emblema (no pasa a la siguiente pantalla); [Seguir] sigue. Es la forma de «saltar» una película larga sin perder el emblema. Tiempos: escenas ~10 s, película del Coliseo ~28 s.
6. **Sellos que suben:** acorté la espera a ~3,5 s (en el diseño son ~10 s) para que no se haga larga.
7. **Los dibujos del emblema, sello, insignia y chapa** son los de `dibujos/index.tsx`; la insignia no tiene «pieza nueva que vuela» (el contrato no lo permite), así que cada insignia entra con un pequeño rebote.

## Escenas: lo que NO es idéntico al diseño

- La **película del Coliseo** es una copia casi literal del diseño (mismas partículas, tiempos y fuegos). No lleva el sello pequeño ni la «E» de la esquina: esos dos viajan con el vuelo genérico (el emblema al botón, la tarjeta al Perfil).
- Las **11 escenas de los demás emblemas** las he dibujado yo siguiendo la descripción y el color de «Emblemas Cine», más simples que las del diseño: Panteón (anillos y rayo por el óculo), Trevi (agua, rayos, moneda), Foro (ruinas, Miliario y cinco calzadas), Museos (bóveda por paneles y las dos manos), Plaza (columnata, huellas y la raya de VATICANO), Basílica (cúpula, baldaquino, rayo y tumba), Boca de la Verdad (cara, ojos y mano), Ojo de la Cerradura (puerta y paseo de setos), Catacumbas (lamparilla que descubre las galerías), Madrugador (amanecer) y Nocturno (ventanas que se encienden). Madrugador y Nocturno no enseñan ninguna hora.
- Con «reducir movimiento» (CSS `prefers-reduced-motion`): la película del Coliseo sale como emblema quieto con su texto; el resto de pantallas salen ya puestas. **No lo he podido probar en el navegador del panel** (no deja emular esa preferencia): está comprobado solo leyendo el código.
- Sonido y vibración: el primer momento suena al ganarlo (lo hace `LogrosPorVisto`); desde la segunda pantalla suena cada una con `sonar()`/`vibrar()`. Los sonidos son los provisionales de la 8A.

## Textos que puse yo (el diseño no los dibuja)

- Resumen del día: «Tu día en {ciudad}», «Esto es lo que has ganado hoy», «Aún no has ganado nada hoy», y las líneas «1 sello subido de grado», «4 pedazos de colecciones», «1 colección completada», «3 emblemas ocultos», «1 Patrimonio de la Humanidad», «2 logros de viajero» (los números son los reales del servidor).
- «Ver el resumen del viaje» (cuando el viaje ya ha acabado) y «Ver mi viaje».
- Hoja del botón: «Tus logros en {ciudad}», «Por conseguir», «En tu ruta», «Todavía no hay logros que enseñar».
- Compartir: «Preparando la imagen…», «No hemos podido preparar la imagen.», y en las etiquetas de la imagen «Emblema oculto», «Colección completada», etc.
- «Toca para ir al emblema» (pista bajo la película).
- En las pantallas de maravilla distinta de la primera: «{nombre}» y «N de 7».

## Pesos (al construir, sin comprimir / comprimido)

- Entra en el paquete de la app al abrir: `MomentosHost` + `useMomentosUI` (pocos KB; el paquete principal medía 359 KB al construir, con todo lo demás de esta tanda).
- Se carga al ganar algo: `Reproductor` 18 KB (7 KB), CSS de momentos 8 KB (1,7 KB).
- Se carga al abrir cada cosa: `EscenaDeEmblema` 4 KB, película del Coliseo 13,6 KB (5,1 KB), `cine` 8,3 KB (compartido por las 11 escenas), cada escena entre 1,6 y 2,8 KB, resumen del día 4,6 KB, resumen del viaje 6,8 KB, compartir 7,7 KB, hoja 4,2 KB, primer día 3,1 KB.

## Pruebas hechas (navegador del panel, tamaño móvil, `?logros=on&cuentas=on`)

Recorridos con `window.__momentos`: sello nuevo, sello que sube (bronce→plata), sello del Vaticano, colecciones (3 juntas, una sola, una completa), país, maravilla, logro de viajero, «Y además…», la película del Coliseo (tiempos 2 s, 9 s, 16 s, 21 s, 25 s, 28 s), las 11 escenas, la frase de suspense (Panteón), [Saltar todo] (deja el puntito), el flujo entero hasta el resumen del día, resumen del viaje (los dos textos), compartir viaje y logro, hoja del botón, «Hoy empiezas a ganar logros» y el botón con su vuelo en DÍAS. `npx tsc -p tsconfig.app.json --noEmit` limpio. En la consola solo salen errores ajenos (recursos 400/404 de otras partes) y los avisos de vibración bloqueada cuando no hay toque previo (en la película ya lo evito).
Capturas en `docs/dias/capturas_8b/` (nombres con la letra del diseño: A, B, C, D, E, F, H, J, K, L0, R, C1, C2, B1…).

## Lo que queda sin hacer o por revisar

- «El final de las 7 maravillas» (las 7 monedas que se funden en la medalla con fuegos) **no está hecho como película**: solo está la pantalla de «Maravilla del mundo» con `MedallaMaravillas` y fuegos. Hoy solo se consigue el Coliseo; para las otras seis y la medalla final falta dibujar la secuencia («Medalla Siete» del diseño) cuando se sumen.
- «Cuando se acaba la ruta» abre el resumen del día: lo dejé como llamada (`abrirResumenDia()`); no he conectado ningún disparador porque no está definido cuándo se considera «acabada la ruta» (no quise tocar DÍAS/HOY).
- Un solo viaje: el anfitrión usa `useSyncStore.activeTripId`.
- «Estampar mi sello» (pasaporte) no está (es de otra tanda).
- La hoja del botón es solo un marcador funcional; el diseño completo (3a/5a, emblemas guardados que se repiten con `EscenaDeEmblema`) es de la 8c.
- Compartir un logro no lleva la foto del viajero (el diseño tiene un recuadro «TU FOTO»); lleva el dibujo grande. El marcador «LOGO» y el nombre del viajero no los pinto.
- En compartir, los textos de dentro de los dibujos (como «ROMA» del sello) usan una letra de repuesto porque el navegador no carga fuentes web dentro de la imagen.
- No he probado en un móvil de verdad la vibración, `navigator.share` con archivo ni el audio.

---

# 8B2 · Arreglos de los momentos

## Qué he cambiado
1. **El orden ya no se toca en el móvil.** `plan.ts` solo AGRUPA lo que llega del servidor, en su orden (`ajustes.json › orden_momentos`, el único sitio): todos los pedazos nuevos en una sola pantalla; cada colección completada, una pantalla; el Emblema Oculto; el sello si sube; «Y además…»; y al final el resumen del día. Los `suma_sello` no tienen pantalla.
2. **Excepción de las maravillas.** Justo tras el emblema de una maravilla (Coliseo) va una pantalla entera con la medalla de las 7 apagada que enciende su pedazo: «Maravilla del mundo · Tu primera maravilla · 1 de 7» + [Seguir]. Quité la tarjetita «Tu primera maravilla» de la película (`escenas/coliseo.tsx`, solo ese bloque; ahora los textos se quedan y [Seguir] sale a los ~25 s) y de «Y además…».
3. **Pedazos con su dibujo de verdad.** Pantalla de pedazos: cada insignia sale con lo que ya tenía y, a los ~1 s, se enciende el pedazo nuevo con latido y destello (`InsigniaEncendiendo`). Etiqueta siempre «Un pedazo nuevo» / «Pedazos nuevos» (fuera «Una foto, 3 colecciones»). Si llegan dos pedazos de la misma colección en una ronda sale una sola fila (esto lo añadió el agente del Visto; lo conservé). La colección completada: pantalla propia con la insignia cerrándose y «N DE N · COMPLETA». En «Y además…» las miniaturas son chapas reales; una maravilla se dibuja con la medalla.
4. **Suspense** (`Suspense3` en `EscenaDeEmblema.tsx`): añadidos los rayos que giran (van creciendo con la espera) y el viñeteado. Solo con `primeraVez` y `frase`.
5. **Resumen del viaje y los demás: nunca «undefined».** `pedirEstado` completa siempre las listas y la ciudad vacía; `ResumenViaje`, `ResumenDia`, `HojaLogros` y el botón escriben «Tu viaje», «Tus logros» o «N secretos por descubrir» si falta la ciudad, y esconden la línea si falta el dato; sin `viaje` no se pinta la fecha. El resumen del día coge, de cada cosa, la cuenta más alta entre lo del servidor y lo que se acaba de enseñar. Sin el número de secretos, la sección no sale (nunca se inventa uno).
6. Demo: `window.__momentos.serieColiseo()` (3 pedazos, emblema + maravilla, sello que nace, país, destino, Patrimonio, viajero) y `serieS2()` (3 pedazos + colección completada + sello que sube a plata), `datos(acabado, tipo, nImp)`. El orden de `logrosDemo.ts` ya lo había puesto el agente del Visto.
   Solo en desarrollo: `window.__retrasoInsignia = 99` deja las insignias apagadas para capturar el principio.

## Textos nuevos
«Pedazos nuevos» · «Un pedazo nuevo» · «¡Colección completa!» · «N DE N · COMPLETA» · «Maravilla del mundo» · «Tu primera maravilla» · «N de 7» · «Tu viaje» · «N secretos por descubrir».

## Capturas (`docs/dias/capturas_8b/`, sustituyen a las de la 8B; las del Visto/HOY no las toqué)
- `CS-coliseo-00…20`: la serie entera del Coliseo: HOY v2 con [Visto] (00), aviso (01), hoja del Emblema Oculto (02), cámara (03), pedazos (04), pedazos que vuelan al botón (05), película (06 frase, 07 polvo de oro, 08 se enciende, 09 estalla, 10 fuegos, 11 final con [Seguir]), medalla 1 de 7 (12-14), sello que nace (15-17), «Y además…» (18-19), resumen del día (20).
- `S2-01…10`: varios pedazos (antes, se encienden, final), colección completada, sello que sube a plata (tiembla, estalla, plata) y resumen.
- `C-suspense-1/2`: la espera con rayos y viñeteado.
- Las capturas de los pedazos y la película se tomaron congelando el tiempo (`getAnimations`), por eso los fuegos y las partículas están en un instante exacto.
- En 04 y las del Coliseo, los pedazos/película salen de mi serie de demo; el [Visto] real del demo (Visto agent) solo devuelve un pedazo (no da el emblema), por eso la serie se completa con `serieColiseo()` tras la foto.

## Qué queda / riesgos
- «El final de las 7 maravillas» (película) sigue sin hacer, anotado.
- Con la medalla, el «pedazo que se enciende» es la propia animación de `MedallaMaravillas` al pasar de `[]` a `[id]`; con más maravillas no se sabe cuáles estaban ya encendidas (el momento solo trae la nueva) y la medalla sale con solo esa.
- El texto «N DE 8» bajo la insignia sale con la cuenta DESPUÉS del pedazo mientras la insignia pasa de N-1 a N; es a propósito.
- Probé a mano que `ResumenViaje` aguanta un estado sin ciudad (revisado el código, y con el demo del Visto sin lista de secretos); con el servidor real no he podido probarlo (sin cuenta real).
- Al capturar, las hojas del Visto y el demo del Visto reinician la página con las recargas de otros agentes: la serie hay que repetirla de un tirón.
