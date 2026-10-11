# Tanda 6y4, punto 17: los iconos de transporte, los de «Varias Ciudades»

## Qué se ha hecho
Todos los iconos de transporte de la app salen de un solo sitio, `src/lib/iconos.ts`, en un bloque propio marcado «INICIO Transporte / FIN Transporte» (al final de la lista). Los sitios que ya usaban `<Icono nombre="…" />` cambian solos; no hubo que tocar sus tamaños ni colores (se pintan con `currentColor`).

## Los cuatro del diseño (copiados tal cual, mismo trazo)
- Avión, tren, autobús y coche. Caja de 24, grosor 1,7, puntas y esquinas redondeadas, igual que el diseño.

## Los que he tenido que dibujar (el diseño no los trae), con el mismo estilo de línea
- Barco (el ferry): hecho a mano, mismo grosor y caja.
- Autocaravana: nueva. Ahora la usan los sitios donde se elige «Camper / autocaravana» (antes llevaban el coche).
- Taxi: el coche nuevo con un letrero encima (antes era el coche viejo con letrero).
- A pie (`andando`), metro y tranvía: ya existían, en la misma línea, y no los he cambiado. El diseño no trae ninguno.

## Dónde se ven (sin tocar su código, salvo lo que se dice)
- Llegada y vuelta: barra de DÍAS (`ArrivalReturnBar`), hoja de llegada (`ArrivalDetailSheet`), hoja de llegada y vuelta, RESERVAS «Llegada y vuelta» y sus bloques (`BloqueReservas`).
- Formulario Trazo: pasos de transporte, pantallas de coche, camper y taxi de los tres flujos.
- Pestaña RUTA: `TransportSection`, tramos entre ciudades (`cityTransitionTransport`).
- Tramos entre paradas en DÍAS (a pie, bus, metro, tranvía, taxi): `TransportModeIcons`, `StopConnector`.
- Presupuesto, preparación del viaje (`ReadinessIcons`), `VehicleBlock`, mapas (llegada).

## Cambios de código fuera de iconos.ts
- `LoadingScreen.tsx`: el avión de la pantalla de carga era un dibujo relleno propio; ahora es el avión de la familia, girado 45° para que mire a la derecha.
- Camper → autocaravana en `BaseYExcursionesTransportFlow`, `RoadtripTransportFlow`, `UrbanoTransportFlow`, `VehicleBlock` y `cityTransitionTransport` (campervan).
- En iconos.ts he quitado los trazos viejos de avión, tren, bus, barco, coche y taxi de su sitio (si no, la lista tendría claves repetidas) y he dejado una nota donde estaban. No he reordenado nada más.

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y4_iconos.mjs` (3012 comprobaciones, 0 fallos): los cuatro coinciden con el diseño, existen barco, a pie y autocaravana, sin duplicados, ningún `src` lleva un trazo viejo, un `<svg>` suelto de transporte ni un emoji de transporte.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio. `pruebaTanda6z3`, `pruebaTanda6z6b` y `pruebaTanda6z6c`: 0 fallos, sin cambiar nada de ellas.

## No verificado
- No hay navegador: la comprobación visual a 375 px (que los iconos nuevos se lean bien pequeños, sobre todo el tren y el autobús a 14-16 px, y la autocaravana y el barco dibujados por mí) la tienes que hacer tú.

## Preguntas abiertas
1. ¿Te vale el barco y la autocaravana dibujados por mí, o se los pedimos a diseño para que los hagan con su mano?
2. El taxi lleva ahora el coche nuevo con un letrero: ¿lo quieres distinto del coche, o igual?
3. El diseño no trae «a pie», metro ni tranvía; los he dejado como estaban. ¿Los pedimos también?
