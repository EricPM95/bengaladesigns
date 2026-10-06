# Respuesta a tu informe de los rojos (INFORME_ROJOS_2026-10-03)

Aprobado por el usuario. Commit por parte y sin push. Al final, pasa las pruebas completas: las 365 fechas, las reservas simuladas y los viajes con Free Tour.

- **Si algo no encaja, no lo arregles por tu cuenta:** dime qué, dónde y con qué fecha.

## A. Lo que hay que deshacer

1. **A una entrada reservada se llega siempre 30 min antes.** Quita lo de «pero hasta 10 min antes vale» (INVARIANTES 469).
   - Es una decisión del usuario, y la tarjeta dice «Llega 30 min antes». Con 10 min la tarjeta mentiría, y el Coliseo pide llegar 15 min antes.
   - Si los 30 min no caben, se recorta lo de antes (regla de la hora fija: opcionales, elástica y comida). Si aun así no cabe, aviso en la campana.
   - Lo demás que cambiaste sin estar en el encargo queda aprobado: la comida de 60 min cuando después hay una hora fija, el descanso que ya no mueve una hora fija, el opcional que se quita antes de un cierre, el recorte de la Basílica hasta su cierre y la hora enseñada que no pasa de la última entrada.

## B. Las decisiones

2. **Basílica de San Pedro el 24 y el 31 de diciembre (D3 con Free Tour):** déjalo como está, porque el viajero manda. Añade un aviso en la campana, con la hora de cierre de ese día sacada del dato:
   > «Hoy la Basílica cierra a las {hora}; si quieres entrar, ve otro día del viaje.»
3. **Jueves Santo con entrada a los Museos:**
   - **la Plaza de San Pedro sale siempre**, porque está al aire libre. No debe quedarse fuera por la entrada;
   - la Basílica va después de los Museos si está abierta a esa hora. Si no lo está, aviso en la campana;
   - dime qué sale con cada hora de entrada de ese día.
4. **El parque de Villa Borghese dos veces en D4:** se queda como está. Son dos partes distintas del parque (el camino hacia la Galería, y el lago con el Templo de Esculapio), así que no cuentan como el mismo sitio en la regla 2. Que la prueba no los cuente como repetidos.
5. **La Passeggiata del Gianicolo de 65 a 70 min los lunes:** se queda así. Sube el límite de este paseo a 70 min en la prueba.
6. **Último domingo de mes:** como propones.
   - El día va sin Museos.
   - En la ficha de los Museos Vaticanos, en la pestaña Entradas, va el aviso. Sácalo del dato de la web oficial que ya comprobaste: el último domingo la entrada es gratis de 9:00 a 12:30 (última entrada), sin reserva y con mucha cola, y no vale si cae en Pascua, 29 de junio, 25, 26 o 31 de diciembre.
   - No hace falta la variante `fecha:ultimo_domingo`.
7. **El Castillo en la pantalla:** es pequeño, pero va en este encargo porque hoy la app enseña un texto falso.
   - En el Castillo **no sale** «Hoy lo ves por fuera para llegar a todo lo del día», **ni el botón «Quiero entrar»**: el usuario decidió que no haya «Entra si quieres».
   - Sale su texto de `por_fuera`, el de la ficha.
   - Haz lo mismo en cualquier parada marcada `outside_authored`: el texto de «para llegar a todo» es solo para las que salen por fuera porque no caben (`outsideKind: 'no_cabe'`).
   - Excepción: en los viajes de 1 y 2 días, lo que va por fuera a propósito puede seguir teniendo «Quiero entrar», porque el viajero puede marcarlo en el pool. Dime cómo está hoy y si cuadra con esto.
   - Mándame una captura de un día con el Castillo.
8. **D4 en verano con entrada a las 17:00 o a las 17:45:** comida tranquila a las 14:30 o a las 15:00 (regla de la comida flexible).
   - El rato que sobre antes de la Galería es margen y no cuenta como hueco hasta 60 min.
   - Si con la entrada de las 17:45 sigue quedando más de 60 min, dime cuánto.

## C. Los huecos que quedan

9. **D1, Coliseo a las 17:30 o a las 18:00 (80 y 125 min antes del Coliseo):** propuesta, la **Basílica de San Pietro in Vincoli**, con el Moisés de Miguel Ángel. Es gratis y está a pocos minutos del Coliseo.
   - Comprueba en su web oficial el horario de cada temporada, también si cierra a mediodía, y si ya tiene ficha en `roma.json`.
   - Si no tiene ficha, o su horario no cuadra con esas entradas, **no la añadas:** dímelo con el horario que hayas visto, y te mando la ficha escrita.
   - Si cuadra: parada por dentro, unos 20 min, `una_vez`, antes del Coliseo y después del paseo por Monti, y `si_cerrado: "quitar"`.
10. **Esperas antes de un atardecer** (D4 a las 9:00 y a las 10:00 en invierno, de 35 a 55 min antes de la Terraza del Pincio; D2 los miércoles, de 33 a 53 min antes del Puente Sant'Angelo):
    - estas esperas tiene que absorberlas la parada elástica de antes, estirándose;
    - si no puede (porque ya está en su máximo o porque no hay elástica en ese tramo), dime por qué en cada caso, con un ejemplo. No lo arregles.
11. **D1 de mañana (de 33 a 48 min antes del Panteón con entradas de mediodía en verano):** igual que el punto 10. Dime por qué no lo absorbe la elástica.

## Informe

1. **En rojo, arriba:** cualquier fallo (hora fija rota o movida, sitio cerrado, imprescindible quitado sin aviso o repetido el mismo día). Tiene que seguir en 0 después de volver a los 30 min.
2. Cuántas reservas dejan de caber al volver a los 30 min, por día y franja, y qué se recorta en cada caso.
3. Lo que pido en los puntos 3, 7, 8, 9, 10 y 11.
4. La tabla de huecos de más de 30 min, antes y ahora.

Explícalo en español sencillo, sin jerga.
