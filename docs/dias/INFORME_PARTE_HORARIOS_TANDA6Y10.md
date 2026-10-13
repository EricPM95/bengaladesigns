# Informe de la parte de horarios oficiales y cierres (Tanda 6y10, agente A)

En palabras sencillas: he puesto en los datos de Roma los horarios que Eric miró en las webs oficiales el 13-oct-2026 (Panteón, Museos Vaticanos, Galería Borghese, Coliseo y Foro), con su fuente y su fecha. Los cierres por fecha ya tenían un solo formato y una sola función en el motor; lo he dejado escrito en un sitio y he quitado lo que sobraba.

## La tabla de horarios (fuente y fecha de comprobación: 13-oct-2026, Eric, webs oficiales)

| Sitio | Horario | Última entrada | Cierra | Fuente (solo en los datos) |
|---|---|---|---|---|
| Panteón | todos los días 09:00-19:00 | 18:30 | 1 ene y 25 dic (ya no el 15 ago) | web oficial del Panteón / cultura.gov.it |
| Museos Vaticanos | lunes a sábado 08:00-20:00 | 18:00 | ver abajo | museivaticani.va, horarios |
| Museos, último domingo del mes | 09:00-14:00 | 12:30 | salvo Pascua, 29 jun, 25, 26 y 31 dic | igual |
| Museos, 24 y 31 de dic | 08:00-15:00 (día abierto) | 13:00 | | calendario oficial de los Museos |
| Galería Borghese | martes a domingo 09:00-19:00 | 17:00 | lunes, 25 dic y 1 ene | galleriaborghese.cultura.gov.it |
| Galería, turnos de 2 horas | 9, 11, 13, 15 y 17 | | | igual |
| Coliseo | el horario normal de la tabla (ver el informe de la 6y9), también feb y mar de 2027 | según tramo | 25 dic y 1 ene | colosseo.it |
| Foro y Palatino | igual que el Coliseo, abriendo a las 09:00 | según tramo | 25 dic y 1 ene | colosseo.it |

Museos Vaticanos cierran: los domingos (menos el último del mes), 1 y 6 de enero, 11 de febrero, 19 de marzo, lunes de Pascua, 1 de mayo, 29 de junio, 14 y 15 de agosto, **1 de noviembre**, 8, 25 y 26 de diciembre. En cada sitio, `hours_audit` lleva `fuente`, `fecha: 2026-10-13` y `comprobado_web`.

## Qué cambié en los datos (`data/pipeline_v2/roma.json`)

- **Panteón**: fuera el horario por día de la semana (`by_day`: sábado 09-16, domingo con hueco por la misa), fuera las misas (`misas_festivos`) y fuera el cierre del 15 de agosto. Ahora son 09:00-19:00 todos los días, última entrada 18:30, cierra 1 ene y 25 dic. La rueda de la hora se queda (de 09:00 a 18:30). La ficha ampliada (`detalle/roma/centro_historico.json`) dice lo mismo.
- **Museos Vaticanos**: la lista de cierres es exactamente la de Eric. **Quité las dos fechas sueltas de 2027** (`2027-08-16` y `2027-11-01`) y añadí `11-01`, que vale cada año (antes el 1 de noviembre solo cerraba en 2027). Lunes a sábado, último domingo y excepciones ya estaban bien. El 24 y el 31 de diciembre llevan su horario reducido 08:00-15:00 como **día abierto** (`special_hours`); la última entrada es 13:00, que es la del calendario oficial que ya estaba en los datos (no hizo falta poner 13:30).
- **Galería Borghese**: última entrada 17:00 (antes 17:45), turnos `09:00, 11:00, 13:00, 15:00, 17:00` (antes 10 horas). Ya no pone «sin verificar». Quité una nota que hablaba del lunes 29 de marzo de 2027 (lunes: ya cerrado). La ficha ampliada (`villa_borghese.json`) dice lo mismo (última entrada 17:00, turnos de 2 horas).
- **Coliseo y Foro**: quité «sin verificar» y «el patrón de otros años». Los tramos de marzo siguen siendo el horario normal (no hubo que cambiar horas). Solo cambió `hours_audit`.
- No añadí ningún cierre nuevo en ningún sitio (regla de Eric).
- Los cambios se hacen con `scripts/destino/_6y10_parchearHorarios.mjs` (reemplazos de texto, vuelve a lanzarse sin romper nada): el `git diff` de `roma.json` es solo de estos trozos.

## El formato de cierres por fecha y su evaluador

No hizo falta inventar uno: el motor ya tenía el formato bueno (lo usaban los Museos desde antes). Lo dejé escrito en un comentario único de `shared/routeEngine/openingHours.js` y lo uso para cualquier año y destino:

- `closed_on`: días de la semana en que cierra siempre (`"domingo"`).
- `closed_dates`: lista de reglas, leídas por **una sola función**, `matchesDateToken`:
  - `"12-25"`: cada año ese día.
  - `"easter"`, `"easter+1"`, `"easter-2"`: Pascua móvil. Pascua sale de **una sola función**, `easterIso(año)`; el lunes de Pascua es `easter+1`.
  - `"08-10..08-24"`: rango de cada año; `"first_sunday"`; `"AAAA-MM-DD"` (un solo año; en Roma ya no queda ninguno).
- `last_sunday { windows, last_entry, except: [reglas] }`: el lugar cierra los domingos pero abre el **último domingo del mes** con ese horario, salvo si cae en una regla de `except` (las mismas reglas de fecha: Pascua, 29 jun, 25, 26 y 31 dic).
- `special_hours [{ fecha, windows, last_entry }]`: ese día abre con otro horario. Cuenta como día abierto.
- Orden de lectura (`closedOnDay`): fecha cerrada, luego día de la semana cerrado (salvo el último domingo), si no, abierto (con el horario especial si lo hay).
- Todo el que pregunta «¿abre este día?» pasa por `horarioDeLaFecha` (rueda de la hora, servidor, pruebas y el orden de días del otro agente), que usa estas funciones. Comprobado: 24 y 31 de diciembre salen como día abierto 08:00-15:00 (en domingo, cerrado, porque los Museos no abren los domingos).

## Pruebas

- **Nueva** `scripts/destino/pruebaFase6y10_horarios.mjs`: **110.990 comprobaciones, 0 fallos**. Compara, día a día de **2026 a 2040** (5.479 días), el horario y el cierre de los cuatro sitios con un oráculo propio (lista de Eric, tabla de Pascua aparte, último domingo calculado de otra forma). Cubre: todos los cierres de los Museos (incluido Pascua y lunes de Pascua 2026-2030, 28-mar-2027 que es Pascua y último domingo, 31-dic-2028 domingo, 29-jun-2031 domingo), último domingo de cada mes con sus excepciones, 24 y 31 de dic abiertos 08:00-15:00, domingos normales cerrados, 16-ago-2027 ya abierto, 1 nov cada año, lunes de la Galería, 1 ene y 25 dic del Panteón, los 5 turnos de la Galería, fuente y fecha 13-oct en las cinco `hours_audit` y ni rastro de «sin verificar».
- Ajustada: `pruebaFase6y9_horarios` (el turno de la Galería de las 17:45 ya no existe: ahora se espera 9, 11, 13, 15, 17): 4.064 comprobaciones, 0 fallos.
- 0 fallos: `pruebaFase6y7_motor` partes 1, 2, 3 (paso 9: 18 + 1 + 17.705), `pruebaFase6y6_cierre` (3.211), `pruebaFase6y4_listas` (643), `pruebaFase6y9_pantallas` (93), `pruebaTanda6h, 6i, 6j, 6k, 6l, 6o, 6r, 6u (con servidor propio), 6z, 6z2, 6z6`, y en serie `6s, 6t, 6v, 6z3, 6z5, 6z6a, 6z6b, 6z6c, 6z6d`.
- `npx tsc --noEmit -p tsconfig.app.json`: sin errores.
- `pruebaTanda6g`: 1 fallo, `etiqueta_roja`: es una mirada al código de `src/components/route/DayList.tsx` (color de la etiqueta «Día de viaje»), que no he tocado; no tiene que ver con horarios. Ya venía así.
- `pruebaFase6y8_comida`: 53.559 comprobaciones, 0 fallos.
- **Muestra de 63 fechas con `pruebaListas`** (festivos, domingos, lunes, miércoles, agosto, Navidad y Año Nuevo, Semana Santa, más los cierres de los Museos y sus excepciones: 11 feb, 19 mar, 29 jun, 14 ago de 2027, 25-oct y 27-dic de 2026, 31-oct de 2027, lunes de Pascua de 2028 y 31-dic de 2028): **139.561 viajes, 378.896 días, 0 fallos.** No lancé las 365 fechas.

## Decidido por Code

- Mantuve el formato de cierres que ya había (`closed_dates`, `last_sunday.except`, `special_hours`) en vez de crear otro: ya cubre Pascua, el último domingo con excepciones y las fechas fijas, y una sola función lo lee.
- Última entrada del 24 y 31 de dic en los Museos: 13:00 (la del calendario oficial que ya estaba en los datos), no 13:30.
- El Viernes Santo del Coliseo y el Foro (08:30-14:00, última entrada 13:00) es un horario especial que ya estaba confirmado en los datos; no lo toqué y mi prueba lo cuenta como regla existente.
- Los cierres del Coliseo/Foro/Galería del 1 ene y 25 dic ya estaban en los datos (no son nuevos). La apertura nocturna de agosto del Panteón se queda en el texto de la tarjeta (Eric no la mencionó).
- Panteón: quité las misas del cálculo (`misas_festivos`): Eric dijo «todos los días de 9:00 a 19:00». La función `massWeekday` del motor queda sin uso para el Panteón (la sigue usando `festivos_domingo` de la Basílica).

## Preguntas abiertas

1. **1 de enero en el Coliseo y el Foro**: `closed_dates` los cierra, pero el texto de fechas especiales del 1 de enero (`fechas_especiales`, «Año Nuevo») dice que abren con horario corto y su auditoría dice «abre con horario especial (probable)». ¿Cierran o abren el 1 de enero? No lo he cambiado.
2. **Lunes de Pascua en la Galería Borghese**: Eric dice «cierra los lunes», pero el Ministerio la abrió el lunes de Pascua de 2022, 2024, 2025 y 2026. Lo dejé cerrado, como dice la lista.
3. **Viernes noche de los Museos (19:00-23:00)**: la ficha y el consejo siguen hablando de ello; no está en la lista de Eric. ¿Se quita?
