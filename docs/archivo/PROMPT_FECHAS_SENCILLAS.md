# Fechas especiales, más sencillas

Queremos una app más sencilla. En Navidad, en los festivos y en las fechas especiales, la app hace **solo dos cosas**:

1. **Horarios.** Adapta la ruta a los horarios, los cierres y el transporte de ese día, y lo cuenta en el aviso: qué cambia y qué hemos hecho.
2. **Lo que ya está en tu ruta.** Si la ruta pasa por un sitio que en esas fechas tiene algo, lo cuenta en su ficha: el árbol de Navidad del Coliseo o de San Pedro, el mercadillo de Navona, un belén, las luces de Via del Corso.

Además, **los grandes días religiosos, los que llenan Roma de gente**, se cuentan en los avisos de fechas del principio de la ruta, como siempre: qué pasa, y sobre todo **qué hemos cambiado en tu ruta por eso**. Así el viajero ve que lo hemos tenido en cuenta. Pero nunca son una parada ni una sugerencia con hora.

El criterio es este: **lo que se repite muchas veces sí** (las misas y audiencias del Papa, el Ángelus de los domingos, los mercadillos de Navidad, que duran semanas). **Lo que pasa una vez al año no** (fuegos artificiales, conciertos, desfiles, festivales): no salen en ningún sitio, salvo lo que cambien en los horarios.

Reglas:
- Commit por parte y sin push.
- La regla de arriba va a INVARIANTES.
- Los textos, con «tú».

## 1. Qué se quita del todo

Revisa todas las `fechas_especiales` de Roma, los avisos del día, las sugerencias (`sugerencia`) y las líneas de Navidad. Quita:
- el concierto del Circo Máximo del 31;
- el concierto del 1 de mayo;
- los fuegos de la Girandola del 29 de junio;
- el desfile del 2 de junio;
- el desfile y el rayo de sol del Panteón del 21 de abril;
- el Te Deum del 31.

Quita también todas las **sugerencias con hora** (`sugerencia`): la Urbi et Orbi del 25 y la de Pascua dejan de ser una parada sugerida.

## 2. Los grandes días religiosos: solo en el aviso, con lo que hemos cambiado

Estos se quedan, pero **solo como aviso de fecha al principio de la ruta** (uno por tema, con su icono), diciendo qué pasa y qué hemos hecho en la ruta:
- **24 de diciembre:** misa de Nochebuena en San Pedro.
- **25 de diciembre:** bendición Urbi et Orbi a mediodía, con la plaza llena.
- **8 de diciembre:** el Papa en la Plaza de España por la tarde, con la plaza llena.
- **6 de enero:** misa de la Epifanía en San Pedro, y la Befana y el último día del mercadillo en Navona.
- **Viernes Santo:** Via Crucis en el Coliseo, con la zona cortada por la tarde.
- **Domingo de Pascua:** bendición a mediodía en San Pedro.

Ejemplos de cómo deben sonar:

> «25 de diciembre · Navidad: a mediodía el Papa da la bendición en San Pedro y la plaza se llena de fieles. Hemos puesto tu visita al Vaticano otro día, para que la veas con calma.»

> «Viernes Santo: por la noche hay Via Crucis en el Coliseo y la zona se corta por la tarde. Hemos puesto el Coliseo por la mañana.»

Si un día así la ruta no cambia nada, el aviso lo dice igual («…tu ruta de hoy no pasa por San Pedro, así que no te afecta»), o no sale: elige lo más útil y dime qué has hecho.

Cada año, compruébalo en vatican.va y márcalo con `verificar` hasta tener la fecha y la hora de ese año.

**Lo del Papa que se repite todas las semanas:**
- **Audiencia de los miércoles:** ya está como cierre de la Basílica por la mañana. Que el aviso o la ficha lo digan: «Los miércoles por la mañana el Papa recibe a los fieles en la plaza y la Basílica abre más tarde. Hemos puesto San Pedro por la tarde.»
- **Ángelus de los domingos a las 12:00:** si la ruta está en la Plaza de San Pedro un domingo cerca de mediodía, la ficha lo cuenta: «Los domingos a las 12:00 el Papa se asoma a la ventana a rezar el Ángelus: la plaza se llena.» Sin mover nada.
- **Verano:** en julio suele no haber audiencias, y a veces el Ángelus es fuera de Roma. Compruébalo en vatican.va y guarda de qué fechas a qué fechas.

## 3. Lo que cambia en los horarios se queda

Es horario, no evento. Ejemplos:
- la Basílica de San Pedro cerrada a los turistas durante una misa: se queda como tramo cerrado y el aviso lo dice como horario («Hoy la Basílica no se visita de 9:30 a 12:00»);
- el Coliseo y el Foro cerrados por la mañana el 2 de junio;
- la zona del Coliseo cortada la tarde del Viernes Santo: el Coliseo por la mañana.

## 4. Qué se queda

- Cierres, horarios cortos y horarios especiales de cada día (1 de enero, 24 y 31 de diciembre, festivos…).
- Transporte recortado en los festivos: fuera de horas, andando o en taxi.
- El aviso de restaurantes en los días que cierran muchos.
- El 1 de enero después de Nochevieja, sin madrugar (a las 10:00, o a las 9:30 si no cabe; el Campidoglio y el Altar de la Patria pasan a la tarde, no se quitan).
- Las líneas de Navidad en la ficha de las paradas que ya están en la ruta (árboles, belenes, mercadillo, luces).
- La experiencia «Mercadillos Navideños», solo si el viajero la elige.
- Los avisos de los grandes días religiosos del punto 2.

## 5. Los textos

Reescribe cada aviso de fecha especial para que diga solo **qué cambia ese día y qué hemos hecho**, en 35 palabras como mucho. Por ejemplo:

> «1 de enero · Año Nuevo: el Coliseo y el Foro abren con horario corto y los Museos Vaticanos cierran. Hemos empezado tu día más tarde y hemos puesto el Vaticano otro día.»

Pásame en el informe todos los avisos, con su antes y su después.

## 6. La nota de temporada en Navidad

Hoy, en invierno, arriba de la ruta sale la nota de temporada («En tus fechas anochece sobre las {hora_atardecer}…»). Si el viaje cae en la época de Navidad, sale **una nota navideña en su lugar**, con alegría, que le diga al viajero que va a vivir el destino en Navidad y que hemos preparado la ruta para eso.

- **Cuándo sale:** si al menos un día del viaje está dentro de `temporada_navidad` del destino: desde que se encienden las luces hasta el 6 de enero (en Roma 2025-26, del 26 de noviembre al 6 de enero, según turismoroma.it). Guárdala con fuente y `verificar` cada año. Fuera de esas fechas, la nota de invierno de siempre.
- **Solo promete lo que hay.** Elige el texto según lo que de verdad pasa en ese viaje:
  - **Con el mercadillo abierto y en la ruta:**
    > «¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las {hora_atardecer}, también iluminado.»
  - **Sin mercadillo en la ruta (o aún cerrado):**
    > «¡Vas a vivir Roma en Navidad! Las calles se llenan de luces y las plazas estrenan árbol y belén. Hemos preparado tu ruta para que pases por los sitios más bonitos, y como anochece sobre las {hora_atardecer}, también los verás iluminados.»
  - **Solo luces (finales de noviembre, antes de árboles y mercadillo):**
    > «Roma ya se viste de Navidad: las calles estrenan luces. Hemos preparado tu ruta para que las veas, y como anochece sobre las {hora_atardecer}, las disfrutarás de sobra.»
- Si ninguna noche del viaje sale a pasear, quita la parte de «iluminado» (la misma regla que la nota de invierno).
- Que valga para cualquier destino: `{destino}` en lugar de «Roma», y cada destino con su `temporada_navidad` y sus textos. Si un destino no la tiene, la nota de invierno de siempre.
- Va con el icono de Navidad, arriba de todo, como la nota de invierno, y se puede cerrar.

## 7. Prueba

Pasa la prueba de las 365 fechas, los 56 viajes, la de Navidad y la de Fin de Año: igual o mejor. Si todo sale bien, haz push.

**Informe corto:** qué se ha quitado, los avisos (antes y después), una captura de la nota navideña y los números.
