# DECISIONES V59

## §3 La hora de comer y de cenar (agente de la comida)
- **Minutos del trayecto sin ubicación:** la tarjeta de la comida cuenta desde la ÚLTIMA parada hecha («Desde Altar de la Patria»), como el dibujo («Desde el Panteón»). La hoja «Comer cerca de ti» (`HojaComerAhora`, V44 §5) sigue contando desde la parada de ahora (la siguiente): puede dar minutos distintos a los de la tarjeta. Pregunta a Eric si quiere que la hoja haga lo mismo.
- **[Cambiar plan] en la comida sin restaurante (C3/C4):** abre el menú de siempre de la parada de después de la comida (no hay un menú propio de la comida); «Saltar» salta esa parada.
- **Lugar de «Cerca de tu alojamiento»:** sale solo si hay hotel puesto en el viaje (`accommodationSelections`); si no, «Cerca de ti».
- **Comida cerrada (restaurante cerrado ahora):** HORARIO en rojo («Cerrado · Abre a las 19:00»), no sale [Cómo llegar]: [Elegir otro sitio] pasa a ser el botón dorado y [Cambiar plan] el segundo. No viene en el dibujo; se mantiene lo que ya hacía la tarjeta vieja («está cerrado ahora, mira otro sitio»).
- **Horario de restaurantes sin datos:** «Abierto · Sin horario fijo» (V46: «Abierto» si no hay horario).

## §1 y §2 El cierre del día y el resumen (agente del cierre)
- **H1: qué sitios cuentan como «sin ver».** Los pendientes cuya hora prevista ya pasó (la tarde sigue igual, como dice la franja verde). H2 y H3: todos los que se quedaron sin ver (las paradas nocturnas no cuentan). Una entrada o reserva no se mueve nunca (no sale como tarjeta); si lo único que queda sin ver es eso, la hoja dice «Tu entrada de las 9:15 en el Coliseo ya ha pasado» (o «Tu día sigue como estaba») con un solo [Entendido].
- **H4: el único botón [Entendido] SÍ guarda el pequeño retraso** (corre un poco las horas de lo que sigue, con aviso y [Deshacer]), igual que hacía antes «Ajustar mi día». El dibujo no dice si hay que guardar algo: si prefieres que solo informe y no toque las horas, se quita en `HojaVoyConRetraso` (`onEntendido`, `HojaDelDia.tsx`).
- **H4/H5 con una propuesta «de lo más importante» (hay que preguntar antes de quitarlo):** sigue la hoja de propuesta de siempre (`HojaPropuesta`), porque H5 no tiene ese caso.
- **H5 sin ningún día donde quepan los sitios:** un solo botón dorado [Guardarlos en pendientes] (no hay «Pasarlos»).
- **Los minutos del H4** («Vas 40 minutos tarde») salen redondeados de 5 en 5; hasta 5 min, «un poco tarde».
- **H2 se espera a lo que haya en pantalla** (las sorpresas y la hoja del Visto de la última parada) y solo sale con el pase. El resumen del día de las 21:00 pasa a las **22:00** (`HORA_DE_NOCHE`); un día con sitios sin ver NO enseña el resumen hasta cerrar la hoja de cierre (o, si HOY no se abre, no sale).
- **Bandera de «País nuevo»:** hay una tabla corta de países (Italia, España, Francia…); un país que no esté sale sin bandera.
- **Miniaturas de «Pedazos nuevos»:** la insignia de la colección con sus pedazos (no un pedazo suelto como en el dibujo); un solo dibujo por colección aunque se ganen varios pedazos de ella.
- **Pie de cada miniatura** (nombre del Patrimonio, del logro de viajero): hasta 2 líneas. Para el nombre del Patrimonio y de la maravilla se añadió `nombre` a cada entrada de `ganado` en `/api/logros/resumen` (`server/logros/vistas.js`); **hay que reiniciar el api-server**.
- **Texto de «lo que acabas de conseguir» (los logros de viajero en «Y además…»):** `server/logros/momentos.js` (`loQueConsigues`): «Tu primer Patrimonio de la Humanidad» / «Ya son 5 países». Los que ya traen su línea propia en `viajero.json` (la pandilla viaja…) no cambian. **Hay que reiniciar el api-server.**
- **Sonidos (regla V52):** no se añade ninguna animación nueva: las hojas de cierre usan `HojaV2` (sin sonido, como todas las de HOY) y el resumen conserva su sonido `resumen_dia` y su subida de números.
