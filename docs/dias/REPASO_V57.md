# REPASO V57: el día de la vuelta, el de la excursión y el probador de Reorganizar

**Por qué salió vacío el día de vuelta:** era un fallo de la app, no del viaje de prueba: con el vuelo puesto pero sin el plan del motor («Sí, adaptarlos»), HOY no pintaba nada. La excursión como «Hoy libre» también era un fallo: HOY solo miraba el interruptor de excursión, no el tipo de día (pasa en Lanzarote con La Graciosa y en Roma con la excursión reservada).

## Qué he cambiado
- **Día de vuelta (HOY):** nunca sale vacío. Con vuelo: tarjeta «Sal hacia el aeropuerto a las …» con el trayecto, el billete QR debajo, y las paradas o «La tarde es tuya». Sin vuelo: «Añade tu vuelo de vuelta…» con [Añadir mi vuelo] (abre «Tu vuelo» en RESERVAS). Con el vuelo ya salido: «Buen viaje de vuelta» y, 2 h después, lo de después del viaje. Con vuelo, sin Reorganizar y sin tiempo: aviso de arriba con [Adaptar mi día].
- **Día de excursión (HOY):** tarjeta de excursión (hora, ✓ reservada, punto de encuentro si es verdad), nunca «Hoy libre». Ya no se pasan sitios a un día de excursión.
- **Probador:** `/admin` › «Probar Reorganizar» (solo administradores, carga perezosa, en memoria, mismo motor y mismas tarjetas de DÍAS). Casos preparados con un toque.

## Cómo queda
- **Roma:** con vuelo a las 19:40 sale «Sal hacia el aeropuerto a las 16:00 · Al aeropuerto: 70 min». Sin vuelo, la tarjeta de añadirlo.
- **Lanzarote:** igual, pero la hora de salir y el límite del coche en la T1 salen tras Reorganizar (15:47 y 17:10); antes, solo «Devuelve el coche en la T1».

## Qué no pude comprobar
- Un día de vuelta con paradas reales (el motor de Roma no las pone; las puse a mano).
- Lanzarote: el aviso «no te da tiempo» no sale hasta reorganizar.
- No pulsé [Añadir mi vuelo] ni [Adaptar mi día] en captura; ni las pruebas viejas (modo rápido).
- Probador: solo probé un caso en captura; falta ver el último día y Lanzarote.
- Capturas en `docs/dias/V57_capturas/`; peso al abrir 338,4 KB (tope 340).
