# Reservas dentro de la ruta · 3 · Imprescindibles, grupos y el Castillo

Va **después** de la medida (PARA_CODE_RESERVAS_EN_RUTA_2_MEDIR), y solo si dio 0 fallos. Commit por parte y sin push. Comprueba cada parte en las 365 fechas y los 56 viajes. Las capturas son a 390 px (móvil).

Vale para **todos los destinos**: lo que es de Roma sale de los datos de Roma, nunca del código. A INVARIANTES lo que lleve esa marca.

## 1. Los niveles de cada parada

- Cada parada de los días escritos lleva su nivel:
  1. reservado;
  2. imprescindible;
  3. si entra;
  4. paseo;
  5. opcional.
- Lo reservado no hace falta marcarlo: se sabe al reservar.
- **Imprescindibles de Roma**, en dos escalones:
  - **joyas** (siempre con su visita entera): Coliseo, Museos Vaticanos y Capilla Sixtina, Panteón y Fontana di Trevi;
  - **imprescindibles** (si hace falta sitio, pueden quedarse en su versión corta, de paso y por fuera):
    - Foro y Palatino, y Arco de Constantino;
    - Basílica y Plaza de San Pedro;
    - Altar de la Patria con Piazza Venezia;
    - Castillo de Sant'Angelo por fuera;
    - Piazza Navona y Plaza de España;
    - Trastevere.
- **Cambios de nivel en los datos de Roma** (lo que viste en la consulta):
  - el Castillo de Sant'Angelo (por fuera) y Trastevere suben del nivel 2 a imprescindibles;
  - la Plaza del Campidoglio se queda en nivel 2, que es su «si entra».
- **A INVARIANTES:** «Un imprescindible nunca se quita en silencio. Puede cambiar de hora o de orden en su día; si de verdad no cabe, sale el aviso en la campana y decide el viajero».

## 2. Los grupos de cada entrada

- Un dato por destino: cada sitio con entrada, su grupo («siempre» y «si entran») y sus dos órdenes escritos.
- Usa los grupos de la consulta, con lo que hayamos cerrado después. Todavía no se usan en el motor: solo se guardan y se comprueba que cada orden, escrito como día, pasa las pruebas.

- **Plaza del Campidoglio** («si entra» en el día del Coliseo): es una plaza, con 15-20 min basta. Comprueba que su parada no dura más.

## 3. El Castillo: solo por fuera

- **Todos los días:** el Castillo por fuera, con el puente de Sant'Angelo, unos 20 min. Es la parte imprescindible.
- **No lleva «Entra si quieres».** Si alguien quiere entrar, cambia la hora y la duración a mano, y lo peor que pasa es que come o cena más tarde.
- En su ficha, en Tips, la información de valor para quien quiera entrar:
  - cierra los lunes, el 1 de enero y el 25 de diciembre;
  - la visita se calcula en 1 h 30 a 2 h;
  - la entrada va a tu nombre: «Lleva tu documento: la entrada va a tu nombre».

  Fuente: cultura.gov.it/luogo/castel-santangelo.

## 4. Precios y datos que han cambiado

Compruébalos en la web oficial y corrígelos donde salgan (pestaña Entradas, tips, textos):
- **Panteón:**
  - 7 € la entrada completa;
  - reserva opcional, con acceso por franjas horarias (1.200 personas por franja). Con reserva es una hora fija; sin reserva, como hoy;
  - gratis el primer domingo de cada mes;
  - cierra durante las misas: sábados y vísperas de festivo a las 17:00, domingos y festivos a las 10:30 (la venta se corta una hora antes). También cierra el 25 de diciembre y el 1 de enero.

  Fuente: cultura.gov.it/luogo/pantheon.
- **Fontana di Trevi:**
  - desde el 2 de febrero de 2026, acercarse a la fuente cuesta 2 €, de 9:00 a 22:00 (los viernes desde las 11:30), sin reserva;
  - gratis después de las 22:00.

  Busca la fuente oficial del Ayuntamiento de Roma (lo hemos visto en prensa: finestresullarte.info, 2-2-2026).
- **Coliseo:**
  - dentro de su ficha, en Tips: «Tu entrada vale para el Foro y el Palatino el mismo día, antes o después del Coliseo»;
  - en el Coliseo se puede estar como mucho 75 min: comprueba que su parada no dura más.

  Fuente: colosseo.it, entrada «Colosseo, Foro Romano, Palatino».

## 5. Llegar antes de la hora de la entrada

- **Siempre 30 min antes**, en todos los sitios con entrada (decidido por el usuario), aunque la web oficial pida menos.
  - Si la web de algún sitio pide más, ese sitio lleva lo que pida.
  - En el Coliseo, según su Reglamento de visitantes (art. 7.3), son 15 min la entrada normal y 30 min la Full Experience con subterráneos.
- La parada anterior termina a tiempo para llegar con ese margen.
- La tarjeta lo dice junto a la hora, sin más: «Llega 30 min antes».
- **Coliseo**, dentro de su ficha, en Tips: «Si llegas más de 15 min tarde, pierdes la entrada al Coliseo (te sigue valiendo para el Foro y el Palatino)».

**A INVARIANTES (todos los destinos):** «La información práctica de cada lugar va siempre dentro de su ficha, en Tips o en Entradas, como información de valor (llegar antes, qué pasa si llegas tarde, qué incluye la entrada…). La tarjeta solo lleva hora, nombre, foto, horario, duración y avisos cortos».

Recuerda: precios solo en la pestaña Entradas, en la ventana de llegada y vuelta, y en las excursiones.

**Informe corto:**
- qué precios y textos cambiaste, con el antes y el después;
- captura del Castillo con sus tips;
- la ficha del Coliseo con sus tips, y su tarjeta con «Llega 30 min antes».
