# Noche 24-25 nov · agente HOY (repaso de diseño + una sola forma en HOY)

Capturas en `docs/dias/NOCHE_HOY_capturas/` (`<pantalla>_antes.jpg` = de las tandas V43-V50, mismo código que HEAD; `<pantalla>_despues.jpg` = de esta noche, modo iPhone 375 × 812, datos reales de Roma). Scripts: `scripts/destino/noche_hoy_app.mjs` (app) y `noche_hoy_dibujos.mjs` (dibujos de Design); NO se pudieron correr con la cola de Chrome (la batería la tuvo ocupada toda la noche); las capturas «después» se hicieron con el navegador del panel de Claude (sin cola de Chrome).

## Pantallas
| Pantalla | Antes → después | Visto en pantalla |
|---|---|---|
| Parada, antes (T1) y al llegar (T3) | foto 210/236 → 140/170 px; nombre 38 → 34; cajas 16 → 18 de radio con icono de 15; recuadro de ubicación transparente → marfil con círculo; historia azul plana → degradado con ondas de 10 barras; botones 50 → 52 (Cómo llegar 1,5×); tira de pedazo y botones de iconos al dibujo | sí (T1 y T3) |
| Pasar a otro día (26a) y hoja (A2) | tarjeta del sitio con filo dorado y sombra; franja verde del dibujo; cuadrado de la fecha azul (el de la lista lo cambió el otro agente) | sí |
| Voy con retraso (23a) | resumen con círculos de 24 px dorado/verde sobre fondo gris suave; botones 52/48 | sí |
| Comer ahora (24) | nombres en Geist 14 negrita, [Elegir] 34 px, mapa 112 px sin borde, chips sin barra de desplazamiento | sí (sin ubicación) |
| Añadir un sitio cercano (27a) | fila al dibujo (foto 42, nombre negrita, [Elegir] 34, etiquetas) | sí |
| Lugares pendientes (L1-L4) | filas compactas (foto 38), [Otro día] con icono, «···» 30 × 34, [Pasar todos] azul con filo dorado, resumen L4 con fotos y fecha | L2 y L4 sí; L1 y L3 no |
| Avisos | el de arriba: tarjeta clara con filo dorado e icono (A1 de «Avisos Arriba»); el de abajo no cambia; el ámbar de cierre al dibujo | arriba y abajo sí; el ámbar de cierre NO (no lo pude provocar) |
| Billete (Q1-Q4) | no tocado: vive en `dayDetail/BilleteDeVuelo.tsx` | no |

## Piezas de HOY (elemento → archivo · nombre · mundo)
- Botón dorado / claro → `src/components/ui/botonesOro.ts` · `BOTON_ORO` / `BOTON_CLARO` · HOY (y los de reservas que ya lo usan).
- Botón azul oscuro → `src/components/route/hoy/piezas.tsx` · `BOTON_AZUL` · HOY.
- Enlace «Dejarlo como está» → `hoy/piezas.tsx` · `EnlaceDejarlo` · HOY.
- Enlace de un aviso de arriba → `hoy/piezas.tsx` · `EnlaceDeAviso` · HOY.
- Recuadro de puntos → `hoy/piezas.tsx` · `RecuadroDePuntos` · HOY.
- Etiqueta pequeña → `hoy/piezas.tsx` · `Etiqueta` (tonos oro, azul, verde, rojo) · HOY.
- Hoja de abajo → `hoy/v2/HojasV2.tsx` · `HojaV2` (32 de radio) · HOY; título de hoja → `hoy/v2/CambiarPlan.tsx` · `Titulo`.
- X de cerrar → `src/components/ui/CruzDeHoja.tsx` · `CruzDeHoja` · los dos (HOY usa `enLinea`).
- Propuesta (texto, resumen, dorado, claro, enlace) → `CambiarPlan.tsx` · `HojaPropuesta`; tarjeta del sitio → `TarjetaDelSitio`; fila de opción → `Opcion`.
- Aviso de arriba → `hoy/v2/AvisoDeAbajo.tsx` · `AvisoDeAbajoHost` (usa `ui/AvisoArriba`); de abajo → `ui/AvisoSobreLaBarra`.
- Cuadrado de la fecha → `ui/CuadradoFecha.tsx` · `CuadradoFecha` · los dos.
- Tarjeta oscura → `hoy/piezas.tsx` · `TarjetaOscura` (26); tarjeta blanca → `CajaBlanca`; caja de la parada → `ParadaHoy.tsx` · `CajaDeParada`.

## Cuántos sitios cambié por elemento
X de cerrar 9 · botones dorados a `BOTON_ORO` ~17 · azul oscuro 7 · «Dejarlo como está» 4 · recuadro de puntos 3 · etiquetas 4 · enlaces de aviso 4 · hojas a 32 de radio 5 (+ «Pasar a otro día» de pendientes pasa a `HojaV2`) · cuadrado de la fecha 2 · aviso de arriba 1 (+ ámbar 1).

## Sin hacer / sin ver
- Dibujos de Design: no capturados (script listo, cola de Chrome ocupada por baterías).
- Capturas «después» no hechas: T2 plaza, comer con ubicación, añadir ya elegido (27c), L1, L3 «···», A1 ámbar de cierre y su hoja, billete.
- Billete Q1-Q4 (dayDetail): el dibujo pide la hora a 36 px (la app 30), 30 → 36 en `BilleteDeVuelo.tsx`; lo debe mirar quien lleve `dayDetail/`.
- `tsc -p tsconfig.app.json` y `npm run build`: sin errores (el build, antes de los últimos retoques; tsc, después).
- Pruebas: no pasadas (las pone al día otro agente). Cambian: `data-hoy-pendiente-pastilla` ya no es una píldora; `data-hoy-mas-tiempo-opcion` ahora está en `Opcion`; el mapa de comer/añadir mide 112/104 px.
- Reiniciar el Vite estable tras estos cambios: lo reinicié a las 23:50; los retoques posteriores (chips sin barra) piden otro reinicio.
