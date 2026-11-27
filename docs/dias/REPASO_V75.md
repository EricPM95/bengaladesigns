# REPASO V75 (27-nov): «+ Añadir una reserva», ferry/tren/autobus/otra y los tres iconos

Esta vez CON pruebas de lo que guarda y borra: `pruebaV75` (parte pura 32, Roma 81, Lanzarote 81), `pruebaV75_lectura` (13), `pruebaJutrip` (130), 21 pruebas de reservas, V36 (cliente y servidor) y `pruebaPantallas8b` (arranque 261,1 KB), todas en 0. No hizo falta ninguna migracion. Capturas (iPhone) junto a su dibujo en `docs/dias/V75_capturas/`.

- ✅ Boton ancho «+ Añadir una reserva» y hoja de 9 tipos; Vuelo, Alojamiento, Entrada, Excursion y Coche abren su hoja de siempre. ✅ Vuelo en un destino: con la ida puesta abre la vuelta; con las dos, «Ya tienes tus vuelos».
- ✅ Ferry, tren, autobus y otra con su dia, horas, localizador y precio; un bloque por tipo antes de «Util para el viaje», que no cuenta en «X de N reservas listas». 🟡 En grupo el precio sale en el paso 2 (el dibujo lo pone en el 1).
- ✅/🟡 Los tres iconos (QR, lapiz, papelera) arriba a la derecha en todas las tarjetas, y la hoja de confirmar al borrar. 🟡 La hoja dice «no se puede deshacer» pero el aviso con [Deshacer] sigue saliendo unos segundos (decision tuya).
- ✅ Un PDF grande de varias paginas se lee entero (hasta 20 paginas) como UNA lectura.
- Sin comprobar: subir un archivo real a «+ Sube tu billete» (gasta cupo de IA), invitados con una cuenta real, R5 y R8-R11 del dibujo (no estaban en el prompt). Decisiones: `DECISIONES_V75.md`.
