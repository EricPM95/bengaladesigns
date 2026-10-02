# Informe · UI de Días y arreglos sueltos (2 de octubre de 2026)

Capturas a 390 px en `docs/capturas_2026-10-02/` (`ud*`, y `rs2e` para la fecha fuera del viaje). Reglas 438 a 443 de `INVARIANTES_MOTOR.md`. **Sin push.**

## Arreglos sueltos (PARA_CODE_ARREGLOS_SUELTOS)

1. **Tívoli** (comprobado en la web del proveedor): cuadran duración (5 h), recogida, entradas incluidas y enlace. No cuadran: el precio (nosotros 125 €, la web 118,80 €), las opiniones (367 con 4,4; la web 359 con 8,7/10) y faltan tres notas (3 € extra por exposiciones temporales, sin acceso en silla de ruedas, guía en español a veces bilingüe). Sin tocar: dime si actualizo.
2. **Campaña**: `…civitatis.com/…?aid=5206&cmp=app-{código}`. Va en todos los enlaces del proveedor (botones rojos de actividades del destino y del explorador, «Reservar» de las excursiones) al seguir el enlace; nunca nada del viajero. `app-` sustituye al `v-` de antes; el servidor acepta los dos.
3. **Fotos**: Coliseo = candidata 3 (David Libeert), Puente Sant'Angelo = candidata 1 (Angelo Casto), con su crédito. Ojo: la del Puente es la misma imagen que ya usaba el Castillo de Sant'Angelo (Unsplash); si un día llevan las dos, se verá repetida.
4. **Fecha fuera del viaje**: ya estaba hecho (`rs2e_fecha_fuera_del_viaje.jpg`).

## UI de Días (PARA_CODE_UI_DIAS)

| Parte | Hecho | Captura |
|---|---|---|
| 1 Fotos | El Coliseo no se veía porque estaba en `sin_foto` (a la espera de tu elección). El paseo de Campo de' Fiori no tenía foto porque su foto de zona ya la llevaba la parada de Campo de' Fiori de ese día y la regla «nunca la misma foto dos veces» lo dejaba en blanco; ahora prueba con otro lugar de la zona (Piazza Farnese). Barrido: 103 nombres de Roma, solo 5 sin foto (abajo). | `ud1a`, `ud1b`, `ud1c` |
| 2 Etiquetas | Quitadas: «Opcional», «Paseo libre», «Imprescindible» (pool del formulario en destinos sin catálogo) y las etiquetas de datos `paseo`, `secreto`, `local`, `tranquilo`, `foto`. | `ud2` |
| 3 Mapa | Franja con flecha hacia abajo; al tocarla vuelve el mapa. | `ud3a`, `ud3b` |
| 4 Añadir día | Ejemplo «Recorrido por el Centro Histórico» (dato del destino: `ejemplo_nombre_dia`); el pool abre con Atracciones marcado. | `ud4a`, `ud4b` |
| 5 Ventana de añadir | Rediseñada; «Minutos / ¿Cuánto tiempo quieres visitarlo?»; el pool se queda y sale «Añadido al Día n ✓». Sin «Deshacer» en ese aviso. | `ud5a`, `ud5b` |
| 6 Recuperar | «Recuperar este día» en los tres puntos (solo días con cambios); «Recuperar mi ruta» con varita nueva en la tarjeta de Roma y su ventana; fuera la varita de cada día. | `ud6a`–`ud6e` |
| 7 Reservado | «🔒 Coliseo · 11:00» en el día cerrado; franja verde y «Reservada ✓ / Fijada» en la parada. | `ud7a`, `ud7b` |

**Sin foto buena** (búscalas tú): Via Margutta, Via del Babuino, Via Veneto, Santo Bambino de Aracoeli y «Pasear por San Giovanni». Las he buscado en Unsplash con varias consultas y no sale el sitio.

## Decisiones que tomé y conviene mirar

- «Paseo libre» ya no sale en la tarjeta del paseo (lo contaste como etiqueta interna): la tarjeta lleva su icono y la foto de la zona.
- «Recuperar mi ruta» solo sale cuando el viaje tiene un único destino (la ruta original es la del viaje entero). Con varios destinos no hay forma de recuperar solo uno todavía.
- Con la varita fuera de los días, el menú «Recuperar toda mi ruta» desaparece de Días; queda solo en Ruta.
- En un viaje con una excursión de día entero, el día de la excursión no marca «🔒» hasta que esa excursión esté reservada.
- El Free Tour no tiene reserva en la app (solo entradas y excursiones): no hay nada que marcar en verde para él.
