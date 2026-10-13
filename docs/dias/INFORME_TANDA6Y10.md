# Informe de la Tanda 6y10

Informes de cada parte: `INFORME_PARTE_HORARIOS_TANDA6Y10.md`, `INFORME_PARTE_MOTOR_TANDA6Y10.md`, `INFORME_PARTE_SITIOSGRANDES_TANDA6Y10.md`, `INFORME_PARTE_FICHA_TANDA6Y10.md`, `INFORME_PARTE_EXCURSION_TANDA6Y10.md`, `INFORME_PARTE_AUDIOS_TANDA6Y10.md`.

## Qué se ha hecho

- **Horarios (P1).** Panteón 9:00–19:00 todos los días (último acceso 18:30; cierra 1 ene y 25 dic). Museos Vaticanos con exactamente tu lista de cierres, el último domingo del mes con sus excepciones y el 24 y 31 de diciembre de 8:00 a 15:00 como día abierto; quitadas las fechas sueltas de 2027. Galería Borghese: última entrada 17:00 y cinco turnos (9, 11, 13, 15, 17). Coliseo y Foro, normal también en febrero y marzo. Todo con fuente y fecha 13-oct-2026.
- **Motor.** Se prueban todos los órdenes de los días y se queda el que pierde menos (24–26 dic: Vaticano el 24, Villa Borghese el 25, Coliseo el 26). Si de verdad no hay otro día, la parada se queda como «Cerrado este día», sin «Llegada a…» y sin tiempo, con su aviso. La Basílica usa su horario real. «Abre a las…» solo si llega antes de abrir y una vez. No se cambia de día si el otro también cierra (Viaje 5). La comida nunca va antes de las 12:00, salvo la reserva de 12:00 a 13:00.
- **Sitios grandes** en los datos (`sitios_grandes` de `roma.json`); Roma sale igual.
- **Ficha** con dos etiquetas y el corazón; «me gusta» de partida fijos (95 lugares y 21 restaurantes con cifra); una sola cuenta por sitio compartida con EXPLORAR; «♡ 154»; EXPLORAR ordena por la suma. Trastevere solo en DÍAS y HOY.
- **Excursión con días llenos:** [Añadir en un día nuevo] y [Cambiar un día por la excursión], con [Deshacer].
- **Audios:** nombre con huella del texto y sin lista pública.

## Pruebas

- Batería en serie (70 pruebas): todas a 0 fallos, salvo `pruebaFase6y10_sitiosgrandes`, que necesita la carpeta del código de antes (`ref=`) para comparar y no sirve ya tras juntar las demás partes (la pasó a 0 fallos su agente antes de juntar), y `pruebaFase6y10_viajes`, que tenía 9 fallos porque el caso «14–16 de agosto» dependía de una fecha suelta de 2027 que se ha quitado (el 16 de agosto de 2027 ya abre). La prueba ahora usa 14–15 de agosto, donde de verdad cierran los dos días; 118 comprobaciones, 0 fallos.
- Muestra de 54 fechas con `pruebaListas`: 119.673 viajes, 324.948 días, 0 fallos.
- Capturas a 375 px en `docs/dias/img/6y10-*.jpg` (ficha, corazón, EXPLORAR, excursión).
- No visto a mano: la nube real (Supabase bloqueado a propósito), la etiqueta lila en HOY, «Cerrado» llegando desde DÍAS, el recomendado con un día de solo nivel 1 (lo cubre la prueba).

## Decidido por Code

- Se mantiene el formato de cierres por fecha que ya existía; sin cierres nuevos por celebraciones.
- Pesos del orden de días: nivel 1 = 10.000, nivel 2 = 100, resto 1; los empates los gana el orden de siempre.
- Comida de la excepción de los Museos: 30 min desde las 11:15, hace de «Llegada a…».
- La Galería en lunes también usa su versión «sin ella» y queda «Cerrado este día».
- Ficha: el horario sale del mismo adaptador que las tarjetas; el reloj enseña hasta el cierre; quitada la pastilla «Experiencia nocturna»; el número del corazón sale desde 20 en total; corazón solo en sitios del catálogo.
- Los «me gusta» sin nube cuentan en pantalla y se guardan en el dispositivo.
- Excursión: la joya cuenta como imprescindible; nunca se ofrece el día de llegada, el último ni un día que ya es excursión entera; cualquier entrada reservada ese día lo pone en gris.
- Audios: huella de 24 hex que incluye la voz; el programa avisa de los ficheros viejos pero no los borra; el servidor relee el índice por fecha.
- Corregido a mano al juntar: dos conflictos entre agentes (`server/index.js`, `destinationExcursions.ts`, `roma.json`), conservando lo de los dos lados.
- Invariantes 632 a 641; la 593 lleva una nota que remite a la 636.
