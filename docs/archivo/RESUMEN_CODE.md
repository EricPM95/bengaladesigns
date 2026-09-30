# Resumen de lo hecho (30 de septiembre de 2026, tarde)

Las cuatro tareas de `PARA_CODE_PRUEBA_Y_PUSH.md` están hechas, con un commit por tarea y sin subir a GitHub.

## 1. El 14 de agosto (2 días, Museos Vaticanos cerrados)

| Hora | Parada |
|---|---|
| 08:30 | Plaza de San Pedro |
| 09:00 | Cúpula de San Pedro (por dentro) |
| 09:45 | Basílica de San Pedro (por dentro) |
| 10:50 | Via della Conciliazione (de camino) |
| 11:05 | Puente Sant'Angelo |
| 11:20 | Castillo de Sant'Angelo (por dentro) |
| 12:45 | Comida, hasta las 14:15 |
| 14:15 | «Descanso a la sombra», 105 min |
| 16:00 | Santa Maria in Trastevere, **por dentro** (en taxi, 16 min) |
| 16:30 | Santa Cecilia, **por dentro** |
| 17:05 | Trastevere, 90 min |
| 18:45 | Tempietto de Bramante (por fuera, ya cerrado) |
| 19:00 | Fontana dell'Acqua Paola |
| 19:40 | Mirador del Janículo, atardecer |
| 20:45 | Cena |
| 22:30 | Trastevere de noche |

- Se empieza temprano otra vez y el Castillo va antes de comer.
- La prueba ya no cuenta como aviso un descanso largo después de comer en verano: de junio a agosto, entre las 13:30 y las 16:30. Puse las 13:30 y no las 14:00 porque un descanso empezaba a las 13:45, al acabar la comida.

## 2. Cierres con año

- `closed_dates` admite ahora fechas completas («2027-11-01»), que valen solo ese año. Las de siempre («12-25») siguen valiendo todos los años.
- Añadidos a los Museos Vaticanos el **lunes 16 de agosto de 2027** y el **lunes 1 de noviembre de 2027**, con el calendario oficial como fuente (el PDF de museivaticani.va).

## 3. Belén de los barrenderos

La línea de la ficha acaba ahora con «Se visita con reserva en la web de AMA.» y ya sale; antes estaba guardada sin salir. El horario está en la web de AMA: del 15 de diciembre al 31 de enero, todos los días de 8:00 a 20:00.

## 4. El 24 de diciembre

El día del Free Tour se da la vuelta cuando cae el 24 de diciembre:

| Hora | Parada |
|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina (por dentro) |
| 11:15 | Plaza de San Pedro |
| 11:35 | Basílica de San Pedro (por dentro) |
| 12:45 | Comida junto al Vaticano, hasta las 14:15 |
| 14:35 | Panteón (por dentro), en bus 40 o taxi |
| 15:15 | Fontana de Trevi |
| 16:00 | Free Tour por el centro |
| 18:30 | Con mercadillos: Piazza Navona y su mercadillo de Navidad |
| 19:30 | Cena junto a Navona |

Dos cosas que he decidido yo:
- **El 31 de diciembre lleva la misma variante.** Tiene el mismo problema: los Museos cierran a las 15:00 y el 1 de enero están cerrados.
- **En ritmo tranquilo, la Fontana de Trevi de antes del tour no va.** Si no, se llegaba justo al tour. El tour la enseña igual, y sale también de noche.

Además, el día de Roma Antigua con Free Tour tiene ahora su variante de Navidad: si cae el 25, empieza a las 9:50 y no deja hora y media libre.

## 5. Las pruebas

| Prueba | Antes | Después |
|---|---|---|
| Navidad (2.184 viajes) | 0 | **0** |
| 56 viajes frente al motor anterior | 5 mejor, 51 igual, 0 peor | 5 mejor, 51 igual, 0 peor |
| 365 fechas (10.560 viajes), avisos en total | 70 | **83** |
| — de ellos, informativos | 38 | 44 |
| — de ellos, avisos de verdad | 32 | 39 |

**La prueba de las 365 fechas no queda «igual o mejor»: sube de 70 a 83.** Comparando caso a caso hay 10 arreglados y 23 nuevos.

Los 10 arreglados: viajes que empiezan el 24 o el 31 de diciembre con Free Tour y ahora sí ven los Museos Vaticanos por dentro.

Los 23 nuevos:

| Cuántos | Qué | Por qué |
|---|---|---|
| 12 | Informativo: los Museos Vaticanos no se ven por dentro | Son los dos cierres de 2027 que se han añadido. En los viajes del 14 al 16 de agosto, del 15 al 16 de agosto y del 31 de octubre al 1 de noviembre están cerrados todos los días. |
| 4 | Informativo: el Coliseo y el Foro no se ven por dentro | Viaje del 24 al 25 de diciembre con Free Tour. Al poner el Vaticano el 24, Roma Antigua cae el 25, que cierran. |
| 2 | Cena con 81 min de espera | 16 de agosto de 2027 con Free Tour. Ese lunes cierran los Museos y también el Castillo, y la tarde acaba a las 17:35. |
| 2 | Cena con 21 min de espera | 14 de agosto con Free Tour, 3 días. Ya había otros dos iguales en el viaje de 2 días. |
| 2 | La comida no cabe holgada | 31 de octubre de 2027 con Free Tour. El día del tour cae en domingo porque el lunes 1 cierran los Museos. La comida dura 45 min y la tarde empieza 5 min tarde. |
| 1 | Descanso de 105 min el 1 de mayo | Es el mismo descanso del 14 de agosto, pero mayo queda fuera de la excepción de verano. |

Los avisos de verdad suben en 7, y todos salen de dos cosas pedidas: los cierres de 2027 (el viaje tiene menos días útiles) y el nuevo 14 de agosto (el descanso, también en mayo).

## 6. Commits

**Subidos a GitHub:** todo hasta `43655af` (Navidad, partes 1 a 4).

**Sin subir:**
- `5e22635` El 14 de agosto y el descanso de verano en la prueba.
- `3ef3973` Cierres con año y los dos de 2027.
- `6d6ee0a` El belén de los barrenderos, con reserva.
- `1e7b5c0` El 24 y el 31 de diciembre, el Vaticano por la mañana.
- El de la variante de Navidad del día de Roma Antigua con Free Tour.
- El de este resumen, con los resultados de las pruebas.

## 7. Para decidir

1. **¿Se sube así?** La prueba de las 365 fechas sube de 70 a 83. No lo he subido.
2. **El 1 de mayo:** ¿se amplía la excepción del descanso a mayo, o ese día vuelve a llevar el Castillo por la tarde, como estaba esta mañana?
3. **El 16 de agosto de 2027 con Free Tour:** la tarde queda corta (81 min de espera antes de cenar). Habría que escribir algo para esa tarde.
4. **El 31 de diciembre** lleva la misma vuelta que el 24. Si preferís que no, se quita.
5. **El viaje del 24 al 25 de diciembre con Free Tour** ve los Museos, pero no el Coliseo por dentro. Antes era al revés. No caben los dos: el 25 cierran ambos.
