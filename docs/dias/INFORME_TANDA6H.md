# Informe de la Tanda 6h

Hecho y comprobado. Lo que he decidido yo está en `PREGUNTAS_TANDA6H.md` (6 puntos). El resultado de la prueba (con ejemplos) está en `PRUEBA_TANDA6H.md`. El resultado de la prueba de una de cada 5 fechas de la 6g ya está apuntado en `INFORME_TANDA6G.md` (56.210 viajes, 0 fallos).

## Lo que ha cambiado

1. **Coliseo y Vaticano al principio (solo la prueba, el motor no cambia).** La prueba avisa, sin arreglar nada, si desde 3,5 días el D1/D1-FT o el D2/D3 no caen como mucho en el 3.er día completo, y si de 2 a 3 días falta alguno de los dos. En 1 y 1,5 días no se comprueba.
   - **Resultado (2 a 6 días, las 365 fechas, 6.570 viajes):** de 13.140 comprobaciones, **683 avisos** desde 3,5 días y **5** de 2 a 3 días.
   - **Los 5 de 2 a 3 días:** viajes que empiezan el 30 o el 31 de diciembre y el 1 de enero: el 25 de diciembre o el 1 de enero el D1 es el D1-corto (todo por fuera) y el Coliseo no se ve por dentro.
   - **Los 683 de 3,5 días o más, por motivo:**
     - El grueso, el día de Roma del interruptor: el cierre de otro día de ese día de la semana (las Termas de Caracalla el lunes en el D5; el Castillo de Sant'Angelo el lunes en el D6) obliga a cambiar el orden y el D1 o el D2 pasan al final (**Coliseo: ~335 viajes; Vaticano: ~300**).
     - **Vaticano:** 28 viajes con los Museos Vaticanos cerrados (domingo y miércoles), y 2 con el horario especial del 1 de enero.
     - **Coliseo:** 14 viajes con el D1-corto del 25 de diciembre y el 1 de enero.
     - El resto son combinaciones de cierres (Galería Borghese, Ara Pacis, Mercados de Trajano, horario especial de Semana Santa…). La lista entera, con las cifras, está en `PRUEBA_TANDA6H.md`.
   - **No se ha arreglado nada**, como se pedía. Es consecuencia de que con el interruptor en Roma los días de Roma van en su orden (decidido en la 6g).
2. **Las noches del D5 al D7 se comprueban también en las fechas con otro orden de días:** la regla 13 (la pareja que toque, sin repetir, sin un sitio visto ese mismo día, y solo parejas del documento). **0 fallos** en las 365 fechas de 4, 5 y 6 días (con y sin Free Tour, con el interruptor en las dos posiciones).
3. **Restaurantes nuevos de Trastevere** (Da Lucia, Checco er Carettiere y Da Teo) en los datos, y como alternativas de comida y cena en el D2 (cena: Tonnarello, Checco er Carettiere o Da Lucia), el D1-FT (cena: Da Enzo, Tonnarello o Checco er Carettiere) y el D7 (comida: Da Enzo, Da Lucia, Checco er Carettiere o Da Teo; Tonnarello no). Con eso **los viajes de 6 días del 31 de diciembre y el 1 de enero ya no repiten Da Enzo** y la prueba de la 6g ya no apunta ningún restaurante repetido sin salida.
   - **Dónde salen** (las 365 fechas): **Checco er Carettiere, comida del D7, en 160 viajes; Da Lucia, comida del D7, en 156 viajes.** Da Teo, el D2 y el D1-FT: en ninguno (con el resto de alternativas el motor no llega a ellos). El domingo del D7 cae en Da Lucia o en Checco (no en Da Teo, que cierra).
4. **Paradas de transporte público con las coordenadas de la tabla**, y los cambios de recorrido: el bus 40 ya no llega a la Traspontina ni a Via della Conciliazione (acaba en el Lungotevere de Sassia), el bus 64 llega a la estación de San Pietro, el bus 23 solo pasa por Trastevere hacia el sur y el tranvía 8 se queda igual.
   - **Prueba:** sobre todas las parejas de sitios y restaurantes de Roma (26.732): **0 trayectos «Bus 23» de Trastevere hacia el norte y 0 «Bus 40» que acaben en la Traspontina o en Via della Conciliazione.**
   - **Trayectos con línea real, en los viajes de 1 a 6 días** (16 formas de viaje, una fecha de cada 30 días; unos 11.000 trayectos; solo se cuentan los de más de 25 min andando):

     | Línea | Antes | Después |
     |---|---|---|
     | Bus 23 | 133 | 4 |
     | Bus 40 (y 64) | 10 | 62 |
     | Bus 64 | — | 129 |
     | Tranvía 8 | 66 | 12 |
     | Metro A | 1 | 1 |
     | Taxi (sin línea) | 274 | 289 |

     El bus 23 baja mucho porque ya solo va en un sentido por cada orilla y las paradas son las del Lungotevere. El 40 y el 64 suben porque las paradas nuevas (Chiesa Nuova, el Lungotevere de Sassia, la estación de San Pietro) cubren el Borgo y el Vaticano. «Antes» son las coordenadas de la 6g.

## Resultado de la prueba

- **Prueba de la 6h** (`PRUEBA_TANDA6H.md`): 6.570 viajes y 26.732 parejas de sitios: **0 fallos**.
- **Prueba de la 6g** con las 365 fechas: **0 fallos**.
- **Prueba de siempre** (1 a 6 días, con pool, reservas, Free Tour y experiencias, una de cada 5 fechas de 2027): **56.210 viajes, 0 fallos**.
- `tsc -p tsconfig.app.json` limpio.

## Para ti

- Las coordenadas y los horarios de los tres restaurantes nuevos son aproximados: hay que confirmarlos.
- Los 683 avisos del Coliseo y el Vaticano son la consecuencia de los días de Roma en su orden (6g): si quieres que el D1 y el D2 no se muevan nunca por un cierre del D5 o el D6, hay que decidir cómo.
