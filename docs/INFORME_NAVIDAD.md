# Roma en Navidad: informe (30 de septiembre de 2026)

Del 1 de diciembre al 8 de enero. Commit por parte, sin push. Reglas nuevas: 395 a 398.

## 1. Datos que cambiaron

### El 1 de enero

| Lugar | Antes | Ahora | Fuente |
|---|---|---|---|
| Coliseo | Cerrado | Abre de 8:30 a 16:30, última entrada 15:30 (probable) | colosseo.it, «Special opening on January 1, 2026» |
| Foro Romano y Palatino | Cerrado | Abre de 8:30 a 16:30, última entrada 15:30 (probable) | La misma |
| Panteón | Cerrado | Abre de 9:00 a 17:00, última entrada 16:30 (probable) | cultura.gov.it, «1 gennaio 2026 al Pantheon» |
| Termas de Caracalla | Cerradas | Abren de 9:30 a 16:30, última entrada 15:30 (probable) | cultura.gov.it (dato del usuario; no lo he podido abrir yo) |
| Castillo de Sant'Angelo | Cerrado, sin fuente | Cerrado, con fuente | cultura.gov.it |
| Galería Borghese | Cerrada, sin fuente | Cerrada, con fuente | galleriaborghese.cultura.gov.it |
| Palazzo Doria Pamphilj | Cerrado, sin fuente | Cerrado, con fuente | doriapamphilj.it |
| Catacumbas de San Calixto | Cerradas | Cerradas, con fuente | catacombesancallisto.it |

- **Aviso del 1 de enero.** Antes: «Roma empieza el año con calma: hoy cierran el Coliseo, el Foro, el Panteón y los Museos Vaticanos. Hemos colocado sus visitas en otro día de tu viaje.» Ahora: «Hoy cierran los Museos Vaticanos, y el Coliseo y el Foro suelen abrir con horario corto (compruébalo en su web). Hemos puesto los Museos otro día y tus visitas dentro de ese horario.»
- **Variante `navidad` de D1:** antes el 25 de diciembre y el 1 de enero; ahora solo el 25.
- **Días escritos:** fuera la variante del 1 de enero de D1 y D1-FT, que enseñaba el Coliseo por fuera. En D1, el 1 de enero el Panteón va nada más comer, como los sábados, para entrar antes de las 16:30.
- **Villa Borghese, Santa Maria in Trastevere y San Pedro:** no tenían ningún cierre el 31 ni el 1 en los datos. No había nada que quitar.

### La Basílica de San Pedro y los Museos Vaticanos en las fiestas

Van como tramos del día, no como el día entero cerrado. Todos `probable` y `verificar`, con revisión en noviembre.

| Fecha | Lugar | Tramo abierto a las visitas | Por qué |
|---|---|---|---|
| 24 dic | Basílica | 7:00-15:00 | Misa de la noche a las 22:00 |
| 25 dic | Basílica | 13:30-19:00 | Misa a las 10:00 y Urbi et Orbi a las 12:00 |
| 31 dic | Basílica | 7:00-14:30 | Te Deum a las 17:00 |
| 1 ene | Basílica | 13:00-19:00 | Misa a las 10:00 |
| 6 ene | Basílica | 13:00-19:00 | Misa de la Epifanía por la mañana |
| 24 y 31 dic | Museos Vaticanos | 8:00-15:00, última entrada 13:00 | Cierre anticipado. **Confirmado** en el calendario oficial de 2026 y 2027 |

### Transporte en los festivos (nuevo)

`destination_config.transporte_festivos`, con los horarios de ATAC de 2025-26: el 24 todo para a las 21:00; el 25, solo de 8:30 a 13:00 y de 16:30 a 21:00; el 31, el bus hasta las 21:00 y el metro hasta las 2:30; el 1 de enero, desde las 8:00.

- Un tramo en bus o metro fuera de esas horas pasa a taxi, o a pie si son 25 min o menos.
- El tramo de Navidad de San Pedro a Santa Cecilia (15:05) va en taxi.
- Los textos y el aviso de traslado ya no mandan al bus a esas horas.
- La vuelta de la bendición Urbi et Orbi decía «el metro A»; ahora dice «andando o en taxi», porque el metro para a las 13:00.

### Mercadillos

| Qué | Antes | Ahora |
|---|---|---|
| Cuándo sale en el formulario | Solo si el viaje empieza en noviembre o diciembre | Del 16 de noviembre al 21 de enero, con aviso en los márgenes |
| Tarjeta en Roma | «Mercadillos de Navidad y ambiente invernal» | «El mercadillo de Piazza Navona, los belenes y las luces de Navidad» |
| Si la eliges | No añadía nada | Ver abajo |
| Aviso `mercadillo_navona` | Fuentes secundarias, «compruébalo en la web oficial» | turismoroma.it; «suele haber mercadillo… Hemos puesto la plaza en tu ruta» |

Lo que añade la experiencia:
- **Piazza Navona** pasa a ser «Piazza Navona y su mercadillo de Navidad», con 45 min. No es una parada nueva: cambia la que ya existe. Cae al anochecer (17:10-17:55).
- **Con Free Tour** (el tour ya pasa por Navona de día): al salir de la Basílica se cruza el Puente Sant'Angelo y se llega al mercadillo a las 20:10, con la cena al lado.
- **En viajes de 1 día con Free Tour:** lo dice el propio tour, que acaba allí.
- **100 Presepi:** la Plaza de San Pedro pasa a «Plaza de San Pedro y los 100 Presepi», desde el 8 de diciembre, sin tiempo de más.
- **Santo Bambino de Aracoeli:** de camino entre el Campidoglio y la Plaza Venecia, desde el 24 de diciembre y solo en ritmo completo.
- **Paseo de las luces:** Via del Corso, Condotti, Babuino y Margutta, 40 min antes de cenar el día del Tridente, del 26 de noviembre al 6 de enero.
- **El 6 de enero** la fiesta de Navona acaba a las 14:00: la parada «y su mercadillo» y el texto de noche valen hasta el 5.

### Líneas de Navidad en la ficha (`navidad_lineas`)

Textos del usuario, tal cual. Salen 4; las otras 6 están guardadas con `verificar` y no salen hasta confirmarlas ese año.

| Línea | Fechas | ¿Sale? |
|---|---|---|
| Santos Cosme y Damián (Foro / Via dei Fori Imperiali) | 1 dic-6 ene | Sí |
| Plaza de España, los bomberos y el Papa | 8 dic | Sí |
| Piazza Navona, la Befana | 1 dic-6 ene | Sí (no el día que ya va el mercadillo) |
| Via del Corso, las luces | 26 nov-6 ene | Sí |
| Plaza de San Pedro, árbol, belén y 100 Presepi | 15 dic-6 ene | No: `verificar` |
| Plaza de San Pedro, árbol y belén (antes del día 8) | 1-7 dic | No: `verificar` |
| Belén de los barrenderos | 1 dic-6 ene | No: `verificar` |
| Santa María la Mayor, Arnolfo | 1 dic-6 ene | No: `verificar` |
| Campidoglio, Santo Bambino | 24 dic-6 ene | No: `verificar` |
| Plaza de España, árbol y belén | 1 dic-6 ene | No: `verificar` |

## 2. Lo que he comprobado y lo que no

- **Árbol y belén de San Pedro:** en 2025 se inauguraron el 15 de diciembre y estuvieron hasta el 11 de enero (Vatican News, L'Osservatore Romano). No «a primeros de diciembre». Por eso la línea empieza el 15.
- **Belén de los barrenderos:** según la web de AMA, solo se visita con reserva online; del 15 de diciembre al 31 de enero, todos los días de 8:00 a 20:00. El texto no dice que haga falta reservar. No lo he tocado.
- **Santo Bambino:** sale la noche del 24 de diciembre y está hasta el 6 de enero, y los niños le recitan poesías (Vatican News, 2023). Cuadra con el texto.
- **Belén de Arnolfo:** no lo he podido confirmar. Unas fuentes lo ponen en la nave izquierda desde diciembre de 2022 y otras en el museo de la basílica, que es de pago. Lo mismo la reliquia de la cuna.
- **Basílica de San Pedro en las misas:** no hay fuente oficial de a qué hora cierra o vuelve a abrir a las visitas. Los tramos de la tabla son prudentes, no datos.
- **Museos Vaticanos el 24 y el 31:** confirmado en el calendario oficial (PDF de museivaticani.va, 2026 y 2027): última entrada a las 13:00 y cierre a las 15:00. La página de horarios no lo dice; el calendario sí.
- **Visto en ese calendario y sin aplicar:** en 2027 los Museos también cierran el lunes 1 de noviembre y el lunes 16 de agosto (el 15 cae en domingo). Nuestros datos no lo recogen.
- **Sin fuente de horario de festivo:** San Clemente, Santa María la Mayor, los Mercados de Trajano y el Cementerio Protestante el 25 de diciembre y el 1 de enero. La ruta los lleva con su horario normal.

## 3. Pruebas

**Prueba de Navidad** (`scripts/destino/pruebaNavidad.mjs`, resultado en `docs/PRUEBA_NAVIDAD.md`): 2.184 viajes, con salida cada día del 1 de diciembre al 8 de enero, de 1 a 7 días, completo y tranquilo, con y sin Free Tour, con y sin mercadillos.

| Comprobación | Resultado |
|---|---|
| Un lugar cerrado planificado por dentro | 0 |
| Parada fuera de su horario de ese día | 0 |
| Bus o metro fuera del horario del festivo | 0 |
| Texto que dice algo falso | 0 |
| Viaje en fechas, con la experiencia, sin el mercadillo de Navona | 0 |
| Dos paradas en el mismo sitio | 0 |

Como información: en 76 viajes con la experiencia elegida no añade nada. Son los que empiezan del 6 al 8 de enero, ya sin mercadillo ni luces.

**Prueba de las 365 fechas y los 56 viajes:** ver el final de este informe.

## 4. Arreglos que salieron por el camino

- **La regla de la comida (ya subida a GitHub) quitaba opcionales aunque no ayudara.** En un día con Free Tour a hora fija quitó la Fontana de Trevi sin ganar un minuto. Ahora solo quita una opcional si de verdad hace que la comida quepa mejor.
- **Último domingo de mes con Free Tour:** los Museos Vaticanos abren de 9:00 a 14:00 y el día los llevaba a las 14:45. Ahora ese día usa su variante de Museos cerrados.
- **Viajes de 1 día con Free Tour en festivo:** si el Panteón cerraba, el motor quitaba el tour y dejaba 160 min libres. Ahora el tour se mantiene y el Panteón cerrado no va detrás por dentro.
- **Un sitio elegido por el viajero** espera hasta 45 min a que abra antes que verse por fuera (las Termas de Caracalla el 1 de enero, que abren a las 9:30).

## 5. Revisión

`docs/revision/NAVIDAD_ROMA.md`: los 6 viajes pedidos, parada a parada y con horas. Las líneas de Navidad salen con 🎄.

## 6. Para decidir

1. **El 24 de diciembre con Free Tour,** la Basílica queda por fuera, porque el tramo prudente acaba a las 15:00 y el tour ocupa la mañana. Si sabéis a qué hora cierra de verdad ese día, se ajusta.
2. **Los viajes del 6 al 8 de enero** ven la experiencia de mercadillos con su aviso, pero no les añade nada. Es lo que pedía el prompt; la alternativa es cortar la ventana el 5 de enero.
3. **El belén de los barrenderos necesita reserva.** ¿Se añade al texto?
4. **Las 6 líneas con `verificar`** no salen hasta que alguien las confirme para 2026-27.

## 7. La prueba de las 365 fechas y los 56 viajes (pasada final)

| Prueba | Antes de Navidad | Después |
|---|---|---|
| 365 fechas (10 560 viajes), avisos en total | 83 | **70** |
| — en completo | 47 | 42 |
| — en tranquilo | 36 | 28 |
| 56 viajes frente al motor anterior | 5 mejor, 51 igual, 0 peor | 5 mejor, 51 igual, 0 peor |
| Prueba de Navidad (2.184 viajes) | — | 0 |

Comparando caso a caso: 26 arreglados y 13 nuevos.

- **Arreglados (26):** casi todos, el Coliseo, el Foro y el Panteón, que el 1 de enero ya se ven por dentro; y dos ratos libres largos.
- **Nuevos (13):**
  - 10 son informativos: viajes de 2 y 3 días con Free Tour que empiezan el 24 o el 31 de diciembre y no pueden ver los Museos Vaticanos por dentro, porque cierran a las 15:00 esos días y el 25, el 26 y el 1 están cerrados. Es la realidad de esas fechas, no un fallo de la ruta.
  - 2 idas y vueltas por la misma zona (los Museos Capitolinos, con la experiencia de arte, el 1 de enero), del mismo tipo que las 9 que ya había.
  - 1 llegada 5 min tarde a San Clemente el 1 de enero, en el viaje que lleva las Termas de Caracalla elegidas por el viajero: ahora se espera a que abran (9:30) en vez de verlas por fuera.
- El día del Free Tour ya no cae el 24 ni el 31 de diciembre si el viaje lo permite, como los domingos.
