# V36C · «Sello» o «Medalla» (para que Eric decida; no se ha cambiado nada)

- **Cuántos textos de la app dicen «sello» queriendo decir medalla: unos 19** (más los de desarrollo, que no se ven).
- **Animaciones (2):** `pantallas.tsx`: «Tu sello de Roma, bronce» (etiqueta de la pantalla) y «TU SELLO DE ROMA · BRONCE» (el rótulo que viste).
- **Resumen del día y del viaje (2):** `textosResumen.ts`: «Tu sello sube a {grado}» y «Tu sello {de Roma}, en {grado}».
- **Página del destino y lista «Todos» (4):** `PaginaDeDestino.tsx`: título «Sellos de ciudad» y cada fila «Sello de Roma»; `todos/formato.ts`: «Sello de ciudad · {grado}»; el servidor (`server/logros/pantallas/ganados.js`): «Sello de Roma / del …» en la lista de lo ganado.
- **Logros de viajero (7 textos, `data/logros/viajero.json`):** el nivel «Primer sello» y las descripciones de «Consigue un sello de diamante…», «Consigue el sello de oro en 3 ciudades» y «…de diamante en 3 ciudades» (cada una con su texto corto).
- **Lista del pase y aviso del pase (3):** `disenoLista.ts` «Los sellos de Roma y del Vaticano» y «Consigue el sello de cada sitio que visitas»; `avisoPaseTextos.ts` «consigues el sello de cada sitio que visitas». (`listaDelPase.ts` ya dice «Sellos y medallas».)
- **Ambiguo (1):** `EliminarViajeHost.tsx` «Tus logros, sellos y EXP».
- **Los que DEBEN seguir siendo «sello» (son los del pasaporte):** `PasaporteScreen`, `TarjetaPasaporte`, `AntesDelViaje` («Tu sello en el pasaporte de Roma»), `ResumenViaje` («Estampar mi sello» / «Ver mi sello»), `HoyAntesV2` («llena tu pasaporte de sellos»), «Se va llenando de sellos con cada viaje» (lista del pase).
- **El nombre interno sí confundió:** en el código `sello` es la medalla (el momento «sello», la partitura «sello», `Sello.tsx`, el logro `sello` de la base de datos, `ciudades_sello`) y el sello del pasaporte se llama `selloEstampado`/`sellado`. Al montar el estudio, la tarjeta «Sello del pasaporte» se hizo con el momento «sello» y por eso enseñaba la medalla. Los nombres internos no se tocan (cambiarlos obliga a migrar datos): si decides «medalla», solo se cambian los textos de arriba.
- **Para que decidas:** si todos pasan a «medalla», son esos ~19 textos y el nombre «Sello de ciudad» de la lista y de la página del destino; los del pasaporte se quedan.
