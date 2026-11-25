# DECISIONES V56 (modo rápido, sin pruebas)

## Para que decidas tú
1. **Haría (punto 9), a medias.** «Haría y la Casa-Museo César Manrique» es UN sitio de datos que sirve a dos paradas de los días (el pueblo y la Casa-Museo). Para quitarle el horario al pueblo hay que separarlo en dos sitios, y el id actual lo usan los logros, la matriz de coche, las fotos, las entradas y la puntualidad. Sin pruebas no me atreví. De momento el horario (10:00-17:30, cierra el 1 de enero) es el de la Casa-Museo, y la nota del dato lo dice. Teguise sí está hecho.
2. **100 Presepi (punto 7).** Las fechas 2026-27 NO están publicadas (turismoroma.it y la prensa vaticana solo tienen la VIII edición, 8-dic-2025 a 6-ene-2026). No puse fechas. Dejé apuntado en el dato (`verificar`) «revisar en diciembre». Se quedan las de 2025-26 (12-08 a 01-06) hasta entonces.
3. **«Hoy ya no da tiempo» (punto 8).** «Hoy sale hasta las 22:40» no lo encontré escrito como tope en ningún sitio; lo que hice es el corte nuevo: a partir de las 20:00 no sale (`HORA_DE_CENAR_MIN` en `hoyCambiarPlan.ts`). Si quieres además un tope de 22:40 para el resto de avisos, dímelo.
4. **«Cansados» para una persona.** Solo, el botón dice «Sin fuerzas» (el contrario de «Con fuerzas»); «Cansado» obliga a elegir género.
5. **Moneda sin cambio.** Si el país tiene una moneda sin tasa en nuestro cambio (BCE + las latinoamericanas del complemento), la moneda se queda en euros: no habría con qué convertir. Los países sin tasa verán euros hasta que se añada la moneda al complemento de `server/cambio.js`.
6. **Los sitios del atardecer.** Con GPS «fuera de todo el viaje» (a más de 50 km) no se cuenta desde el GPS (saldría basura) sino desde la última parada hecha. El arreglo de la V44 ya usaba el GPS cuando se está en el destino; lo que faltaba era la última parada hecha (con todo hecho no había «parada anterior»).
7. **«me gusta» (punto 3).** Los datos viejos tenían Sgarro con cifra y Taverna Trilussa sin ella (el orden del empate). Puse Trilussa a 100 (la que da el guion) y ajusté el guion `megustaInicial6y10.mjs` (21 + Sgarro = 22) para que dé lo mismo que el dato. No volví a correr el guion entero (pisaría cifras de la 10O).

## Pruebas viejas que fallarán (no las he pasado)
- `pruebaFase6y10_ficha` (cuenta de restaurantes con cifra: ahora 22).
- `pruebaFase6y7_titulos` (el último día en blanco de un viaje a mano ya no es «Día de viaje» sino «Hoy vuelves a casa»).
- Las que miran «¿Cómo vais?», «Cansados», «Tomaos un respiro» sin viajar con más gente (`pruebaTandaHOY2b_E`, `pruebaV55`): ahora, solo, dicen «¿Cómo vas?», «Sin fuerzas», «Tómate un respiro».
- Las que miran los textos de `hoyHorarios.ts` («lo tenéis previsto», «si os retrasáis»): solo, ahora dicen «tienes», «te retrasas».
- `pruebaTanda6z2` (miraba el «€» a mano de `paginaDestino.ts`: ya no existe, pasa por `precioEnVista`; debería pasar ahora).
- Las pruebas de peso (`pruebaCuentas3`, `pruebaPantallas8b`, tope 340 KB): la entrada pasa de 341,7 a 338,1 KB; deberían pasar.
- `pruebaTandaHOY2b_D` [6] (atardecer de Lanzarote) usa otra ruta; con la última parada hecha debería dar 2-3.
- `pruebaTanda11` lee `_rutasRevision*Viajes.json` (se quedan); los generadores `rutasRevision.mjs` / `rutasRevisionPagina.mjs` y las capturas `capturaRevision*.mjs` siguen en `scripts/destino` pero ya no tienen página: se pueden borrar cuando quieras (no lo pedías).
- Pruebas que mirasen los dos «Hoy ya no da tiempo» a partir de las 20:00 (`pruebaV43`, `pruebaV55`).

## Borrado (pedido en el punto 5, `git rm`, sin commit)
`docs/dias/RUTAS_REVISION.html`, `RUTAS_REVISION.json`, `RUTAS_REVISION_LARGOS.html`, `RUTAS_REVISION_LARGOS.json`, `scripts/destino/pruebaRevisionRutas.mjs`, `scripts/destino/pruebaRevisionLargos.mjs`.

## No hecho / no comprobado
- La nota de estado en la rama `estado` (sube con push): no se hizo por la orden de no hacer push.
- Nada se ha comprobado en jutrip.app (sin push, no hay nada que comprobar).
