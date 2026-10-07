# Para Code · Tanda 6h: el orden del Coliseo y el Vaticano, los restaurantes de Trastevere y las paradas de transporte

**Empieza cuando hayas terminado la 6g** (con su push). Es corta.

`docs\dias\DIAS_ROMA_PARADAS.md` ha cambiado: pásalo por el convertidor y no lo toques. Lo que ha cambiado:
- las líneas de transporte (el bus 40, el 64, el 23 y las paradas del tranvía 8);
- los restaurantes nuevos de Trastevere;
- las alternativas de comida y cena de Trastevere en el D2, el D1-FT y el D7.

## Cómo trabajar

- **Nada de parches.**
- **`PROGRESO_TANDA6H.md`,** con una línea por bloque y TERMINADO al final.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA6H.md`.
- **Al acabar,** `INFORME_TANDA6H.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. Comprobar que el Coliseo y el Vaticano van al principio (solo la prueba)

**El motor no cambia:** sigue la regla de siempre de «El orden de los días» (lo imprescindible, primero; si un cierre lo obliga, se cambia con el día siguiente).

**Lo que se añade es una comprobación en la prueba**, que avisa pero no cambia nada:
- **Desde 3,5 días:** el día del Coliseo (D1 o D1-FT) y el del Vaticano (D2 o D3) caen en el 1.º, el 2.º o, como mucho, el 3.º día completo. No cuentan los días de llegada ni de vuelta.
- **De 2 a 3 días:** salen los dos en el viaje.
- **1 y 1,5 días:** no se comprueba; tienen sus días propios.
- **Si alguna fecha no cumple,** no la arregles: apúntala en el informe, con el motivo.

**La prueba de la 6g decía** que en algo más de la mitad de las fechas un cierre cambia el orden de los días, y que en esas fechas no podía comprobar las noches del D5 al D7. **Que las compruebe también en esas fechas,** con la regla 13: la pareja que toque, sin repetir y sin un sitio visto ese mismo día.

## 2. Los restaurantes nuevos de Trastevere

En el documento hay tres restaurantes nuevos, con su dirección y su horario:
- **Da Lucia:** cierra el lunes y el domingo solo abre a mediodía.
- **Checco er Carettiere:** abre todos los días.
- **Da Teo:** cierra el domingo.

Van como alternativas de comida y cena en Trastevere (el D2, el D1-FT y el D7). Con eso, los viajes de 6 días del 31 de diciembre y el 1 de enero ya no repiten Da Enzo.

**En el informe:** los viajes en los que sale cada uno.

## 3. Las paradas de transporte público

**Cambia las coordenadas que pusiste en la 6g por estas.** Las del metro y las del tranvía son las de la estación o la parada. Las del autobús son, casi todas, las del sitio de al lado (columna «Qué es»), a menos de 250 m de la parada: valen para la regla de los 12 min andando.

| Línea | Parada | Lat | Lon | Qué es |
|---|---|---|---|---|
| Metro A | Ottaviano | 41.90944 | 12.45806 | estación |
| Metro A | Flaminio | 41.91194 | 12.47583 | estación |
| Metro A | Spagna | 41.90650 | 12.48306 | estación |
| Metro A | Barberini | 41.90389 | 12.48889 | estación |
| Metro A y B | Termini | 41.90150 | 12.50060 | estación |
| Metro A | San Giovanni | 41.88528 | 12.50944 | estación |
| Metro B | Cavour | 41.89500 | 12.49361 | estación |
| Metro B | Colosseo | 41.89139 | 12.49139 | estación |
| Metro B | Circo Massimo | 41.88361 | 12.48806 | estación |
| Metro B | Piramide | 41.87556 | 12.48222 | estación |
| Tranvía 8 | Belli (Viale Trastevere) | 41.89013 | 12.47433 | parada |
| Tranvía 8 | Trastevere/Mastai | 41.88758 | 12.47294 | parada |
| Tranvía 8 | Torre Argentina (Via Arenula) | 41.89533 | 12.47641 | parada |
| Tranvía 8 | Piazza Venezia | 41.89528 | 12.48121 | parada |
| Bus 40 y 64 | Termini (Piazza dei Cinquecento) | 41.90083 | 12.50194 | la estación |
| Bus 40 y 64 | Piazza Venezia | 41.89640 | 12.48250 | la plaza |
| Bus 40 y 64 | Largo di Torre Argentina | 41.89528 | 12.47694 | la plaza |
| Bus 64 | Sant'Andrea della Valle (Corso Vittorio) | 41.89583 | 12.47444 | la iglesia |
| Bus 40 y 64 | Chiesa Nuova | 41.89861 | 12.46917 | la iglesia |
| Bus 40 y 64 | Lungotevere de Sassia (el Borgo) | 41.90154 | 12.46267 | el hospital Santo Spirito |
| Bus 64 | Estación de San Pietro | 41.89639 | 12.45444 | la estación |
| Bus 23 (hacia el norte) | Traspontina (el Castillo) | 41.90278 | 12.46222 | la iglesia |
| Bus 23 (hacia el sur) | Lungotevere de Sassia (el Castillo) | 41.90154 | 12.46267 | el hospital Santo Spirito |
| Bus 23 (hacia el sur) | Lungotevere Sanzio (Trastevere) | 41.89113 | 12.47459 | el Ponte Garibaldi |
| Bus 23 (hacia el sur) | Lungotevere Alberteschi (la Isla Tiberina) | 41.89080 | 12.47720 | la isla |
| Bus 23 (hacia el norte) | Monte Savello (la Isla Tiberina) | 41.89080 | 12.47720 | la isla |
| Bus 23 | Lungotevere Aventino / Emporio | 41.88326 | 12.47523 | el Ponte Sublicio |
| Bus 23 | Marmorata (Testaccio) | 41.87956 | 12.47706 | la Piazza Testaccio |
| Bus 23 | Ostiense-Piramide | 41.87667 | 12.48139 | Porta San Paolo |

**Lo que cambia de las líneas** (ya está en el documento):
- **Bus 40:** ya no llega a la Traspontina ni a Via della Conciliazione. Acaba en el Lungotevere de Sassia, a unos 400 m.
- **Bus 64:** sigue llegando a la estación de San Pietro, junto a la Plaza de San Pedro.
- **Bus 23:** cada sentido va por una orilla.
  - Trastevere solo lo tiene **hacia el sur** (del Castillo a la Pirámide).
  - **Hacia el norte** no pasa por Trastevere: de Trastevere al Castillo o a Testaccio en esa dirección, nada de «Bus 23».
- **Tranvía 8:** se queda como está.

**Prueba:**
- 0 trayectos «Bus 23» de Trastevere hacia el norte;
- 0 trayectos «Bus 40» que acaben en la Traspontina o en Via della Conciliazione;
- **en el informe:** cuántos trayectos de cada línea salen en los viajes de 1 a 6 días, antes y después del cambio.

Al final, **reinicia el api-server.**
