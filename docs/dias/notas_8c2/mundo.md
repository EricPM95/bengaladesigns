# Notas de «¿Dónde has estado ya?» y el pasaporte (Tanda 8C2)

## Qué hay y dónde
- **J1, J2, J3**: `src/components/logros/pantallas/DondeHasEstado.tsx` (J2 es J1 con una búsqueda: al escribir se esconde el globo; J3 es la fase «ganado» del mismo archivo).
- **P2, P2l, P2v, P2i2, P2m, P2e**: `src/components/logros/pantallas/PasaporteScreen.tsx`. `abrir({ t: 'pasaporte', pagina })`: `pagina` = un país («Italia»), un país y su página de sellos («Italia:2»), `lista` (abre la lista) o `sello:<id del viaje>` (estampa el sello de ese viaje). Sin `pagina`, sale la tapa del pasaporte y se abre en el primer país.
- Piezas: `pantallas/mundo/` → `Globo.tsx` (el globo en SVG, gira con un dedo, se acerca con dos, tocar país o moneda), `proyeccion.ts` (matemática pura), `paises.ts` (catálogo y costas bajo demanda), `SelloPasaporte.tsx` + `selloDatos.ts` (el sello del diseño), `api.ts`, `mundo.css`, `tierra110.json` (costas, 84 KB).
- Catálogo: `data/logros/paises_mundo.json` (196 países, nombre en español, continente, centro; `p: 1` = «pequeño en el globo», sin costa). Generado con `scripts/destino/generarMundo.mjs` (de world-countries y world-atlas, solo en desarrollo, no se instalan).
- Servidor: `server/logros/pantallas/previos.js` → `GET /api/logros/previos` (países, días, sellos recuerdo, números) y `GET /api/logros/pasaporte2` (envuelve lo de siempre y añade `paginas`). Guardar sigue siendo `PUT /api/logros/previos`. No se ha editado ningún archivo compartido.
- Demo: `src/lib/logrosDemo_mundo.ts`. Escaparates: `src/dev/escaparates/mundo.ts`. Prueba: `scripts/destino/pruebas8c/mundo.mjs`.

## La regla (comprobada en la prueba)
Los países marcados dan su sello recuerdo y sus números, y nada más. `previos` solo lo leen `pasaporte()` y estas rutas: la prueba comprueba que exp.js, motor.js y momentos.js no lo nombran, que en servicio.js solo se usa en `pasaporteDe`, que `expDe` y `sorteoDe` no lo miran, y que con 0 viajes la EXP es 0, no se entra en el sorteo y el motor no gana ningún país.

## Lo que no ha quedado igual que el diseño
- El globo no usa d3 ni internet: es una proyección ortográfica propia con las costas de world-atlas 110m guardadas en la app. Los países que no llevan costa se ven como moneda; los países pequeños que se marcan en J1 solo se marcan desde la lista (como dice el diseño: «Pequeño en el globo»).
- Sin nombre del viajero: el diseño pone «de Elena» en la tapa; la app no tiene ese dato, así que solo dice «Pasaporte».
- Las monedas del globo son una por país (en el diseño, una por ciudad: la app no tiene las coordenadas de cada ciudad).
- No hay animación de pasar página (el diseño tiene un giro que nunca se activa); sale un fundido corto.
- El monumento del sello solo existe para las ciudades que el diseño dibuja (Roma, Florencia, París, Lisboa, Atenas, Ámsterdam, Londres, Pisa; el Vaticano usa el de Roma, como en el diseño). Las demás salen solo con su nombre y fecha.
- «Crear viaje» (sello por conseguir) abre el formulario de viaje nuevo sin destino puesto.
- Los números del pasaporte (`países · ciudades · días viajando`) salen del servidor; «ciudades» solo cuenta las ganadas con la app.
- Los continentes: Europa, Asia, África, Oceanía, América del Norte (con Centroamérica y Caribe) y América del Sur.

## Los textos que he puesto yo (no están en el diseño ni en los apuntes)
- `DondeHasEstado.tsx`: «No se ha podido guardar. Vuelve a probar.»; en J3, la línea «N sellos de recuerdo · N continentes» (calculada).
- `PasaporteScreen.tsx`: «sin sello aún» (país visitado con el viaje sin acabar, en la lista); «No se ha podido abrir tu pasaporte. Vuelve a probar.»; «N SELLOS» al pie de la página; los nombres accesibles (aria) de botones.
- «Tu primer sello llega al acabar un viaje» es del diseño del Perfil (pasaporte vacío).

## Cosas a vigilar
- `PasaporteScreen`: el aviso de lint «set-state-in-effect» (se abre una sola vez donde pide `pagina`).
- Peso: archivos nuevos solo bajan al abrir estas pantallas: tierra110.json 84 KB (≈25 KB comprimido), paises_mundo.json 17 KB, resto de código ≈ 35 KB sin comprimir.
- Con el motor de captura (Chrome sin ventana, render por software) hay que esperar ~4 s para ver el globo ya girado y pintado; en el móvil es inmediato.
