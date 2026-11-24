# V50 — RESERVAS y el aviso «Hoy ya no puedes entrar» (24-nov)

## 0. Regla nueva en CLAUDE.md
«Toda pantalla, hoja o aviso nuevo usa las piezas que ya existen y el mismo diseño que su pantalla hermana; nunca se inventa un diseño; sin dibujo se copia la más parecida y se dice en el REPASO; ante la duda, se pregunta.»

## 1. «Hoy ya no puedes entrar» (A1-A3)
- El aviso: el texto se queda; el enlace pasa de [Ver solución] a **[Pasar a otro día]** (solo en este aviso; «A este ritmo llegarías…» sigue con [Ver solución]).
- La hoja «Una solución» (la de «Esta vez no hay un cambio pequeño…») ya no sale para este aviso.
- **La hoja de «Pasar a otro día» (A2/A4)** es ahora UNA pieza (`TarjetaDelSitio` en `CambiarPlan.tsx`) que usan el aviso Y Cambiar plan › Pasar a otro día: el texto de arriba, la tarjeta del sitio (foto pequeña, nombre, cuándo en gris, fecha en su cuadrado oscuro; no se pulsa), la franja verde «Sigue igual: el resto de tu {día}», el botón dorado, [Elegir otro día] y [Dejarlo como está]. En el aviso: «Hoy ya no llegas a los Museos Vaticanos. Te los pasamos al jueves 26, que tiene hueco y está abierto.» y [Pasarlos al jueves]. Copia la pantalla `HojaPropuesta` que ya existía (mismas piezas: `HojaV2`, `Titulo`, `BOTON_ORO`, `BOTON_CLARO`).
- **A3 (no cabe en ningún día):** «Hoy ya no llegas a los Museos Vaticanos, y no caben en ningún otro día de tu viaje.» con [Guardarlos en pendientes] (dorado, con [Deshacer] abajo) y, pequeños, [Quitarlos del viaje] (con [Deshacer]) y [Dejarlo como está].
- **No visto en pantalla: el aviso A1 ni la hoja A3.** Con los datos del viaje de pruebas la app manda los Museos a «Lugares pendientes» antes de enseñar el aviso, y no logré fabricar un caso. Sí está capturada la hoja A2/A4 por Cambiar plan › Pasar a otro día (es la misma pieza).

## 2. RESERVAS › «Llegada y vuelta» sin vuelos
Como «Alojamiento»: plegado, solo la cabecera; abierto, «¿Ya tienes vuelo?» con el botón blanco [Añadir mi vuelo] (abre «Tu vuelo» de siempre) y «¿Aún no?» con [Buscar vuelos]. (Si el viaje no es en avión: «¿Ya tienes tu billete?» / [Añadir mi billete].) Copia el bloque de Alojamiento.

## 3. El buscador del alojamiento (hecho por un agente; Photon real, ~17 consultas sueltas)
- Primero las calles, después los sitios con nombre; sin repetidos; sin tildes antes de buscar («Vía» → «Via»); recuadro de la ciudad del viaje (`bbox`) además del sesgo. «Via Nazionale» → Via Nazionale, 00184 Roma primero (ya no el Istituto nazionale di statistica); «Via Nazionale 22» → Hotel Artemide; «Via del Corso», «Vía della Conciliazione» y «Hotel Artemide» salen bien.
- El campo «O escribe la dirección» también busca (misma lista de sugerencias que el mapa); al tocar una sugerencia se guarda el punto como desde el mapa. Capturado con «Via Nazionale».
- Sin comprobar: viajes con varias ciudades o islas (Lanzarote).

## 4. Pequeños de RESERVAS
- **El aviso naranja:** «Esta tarjeta de embarque…» (avión) / «Este billete…» (tren, bus, barco). **«Esta entrada…» y «Esta reserva…» NO están:** el aviso naranja solo se pinta dentro de la tarjeta del vuelo; para entradas y excursiones, cuando el documento trae otro día/hora se CORRIGE (punto siguiente) y no se pinta la línea naranja.
- **La rueda de la hora:** quitada la X; se cierra tocando fuera, con Escape o deslizando hacia abajo desde el asa, SIN guardar; quedan la papelera y el ✓. En todas las hojas con hora (es la misma `HojaDeHora`).
- **Al subir una entrada o una excursión** cuyo documento trae otro día u otra hora: la reserva pasa a ese día y a esa hora (si la fecha es de un día del viaje) y sale el aviso de abajo con [Deshacer]: «Tu entrada es del jueves 26 a las 10:00: hemos cambiado tu reserva» (`corregirConElDocumento.ts`). No visto en pantalla.
- **Entradas en otro día: [Deshacer]:** cuando el motor termina de recolocar los días sale el aviso de abajo «Tu Coliseo, el jueves 26» con [Deshacer], que deshace la reserva y el movimiento (`addReservation`). No visto en pantalla.
- **Datos de las excursiones — lo que he tocado:**
  - `data/dias/roma/_excursiones.json` (las 8: pompeya_sorrento, tivoli, ostia_antica, florencia, costa_amalfitana, florencia_pisa, napoles_pompeya_tren, venecia_tren): `punto_de_encuentro` → null, `vuelta` → null y las horas del recorrido (`paradas[].hora`) vaciadas (eran un horario de ejemplo). La pantalla ya no inventa «Vuelves a Roma a las 14:00» ni enseña horas vacías.
  - `data/pipeline_v2/roma.json › excursions.options` (las 8): `meeting_point` → null (decían «Estación de Termini», «Piazzale Ostiense», «Via Marsala 46/48»…; las comprobó Eric en la web de Civitatis, pero la regla es solo la API o el bono del viajero). El punto del Free Tour (`default_free_tour`) NO se ha tocado. 
  - `server/civitatis/servicio.js`: el punto de encuentro de una excursión es solo el que publica la API (antes, si la API no lo traía, caía al nuestro).
  - Lanzarote: sus tres excursiones (La Graciosa, Fuerteventura, Isla de Lobos) no traen punto de encuentro ni hora; las actividades de Civitatis de `_civitatis.json` traen el punto que publica la API: no se han tocado.

## Sin pruebas (por orden de Eric)
No se ha pasado ninguna prueba ni escrito `pruebaV50`: `npm run build` y capturas. Pruebas viejas que fallarán: las que esperan [Ver solución] en «Ya no puedes entrar», la X de la rueda de la hora, el ✓ del aviso de documento con «Esta tarjeta», los puntos de encuentro y horas de las excursiones de Roma, y «Buscar vuelos» fuera del bloque vacío.
