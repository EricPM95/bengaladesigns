# Fechas clave de los viajeros españoles y Free Tour en festivos (1 de octubre de 2026)

Reglas nuevas: INVARIANTES 406 (fechas clave) y 407 (Free Tour a sus horas). El método, en `docs/METODO_DESTINOS.md`.

## 1. Números

| Prueba | Antes | Ahora |
|---|---|---|
| 365 fechas, todo el año | 36 | **26** (10 arreglados, 0 nuevos; 22 son informativos) |
| 365 fechas, **solo fechas clave** | 16 de verdad | **2 de verdad** · 22 informativos |
| Navidad y Fin de Año | 0 | **0** |
| 56 viajes | 0 peor | **0 peor** (4 mejor, 52 igual) |

1.133 viajes de la prueba pisan alguna fecha clave. Por fecha:

| Fecha clave (2027) | De verdad | Informativos |
|---|---|---|
| Semana Santa (24-29 mar) | 0 | 2 |
| Puente de mayo (30 abr-2 may) | 0 | 2 |
| Fin de semana de julio (16-18 jul) | 0 | 0 |
| 15 de agosto (13-16 ago) | 0 | 8 |
| Puente del Pilar (9-12 oct) | 0 | 0 |
| Todos los Santos (30 oct-1 nov) | 0 | 2 |
| Puente de diciembre (4-8 dic) | 0 | 0 |
| Navidad y Reyes (24 dic-6 ene) | 2 | 8 |

Los 2 que quedan:
- **El 1 de enero con Free Tour a las 9:30** (viaje de 2 días): el paseo de tarde por Trastevere se queda sin sitio. Es lo que decidiste.
- **Un zigzag el 1 de enero** con los Museos Capitolinos marcados en «Elige lugares» (no por Arte): van después de Navona y hay que volver al Campidoglio. Sin arreglar.

Los informativos son imprescindibles de pago que cierran un día del viaje (los Museos Vaticanos el 14, 15 y 16 de agosto, por ejemplo): el aviso lo explica.

## 2. Qué salió en las fechas clave y qué se hizo

- **Con Arte, los sábados y el 1 de enero** los Museos Capitolinos iban después de Navona y se volvía atrás (9 casos: puente de mayo, 15 de agosto, Año Nuevo). Ahora van por la mañana, junto al Campidoglio.
- **El descanso de después de comer** empujaba el Panteón del sábado más allá de las 16:00. Ahora no hay descanso si cierra una puerta.
- **Llegar 5 min tarde a una hora escrita sin turno** ya no cuenta: hasta 10 min es orientativa.
- **Una comida corta** ya no cuenta si la tarde no tiene ninguna hora fija a la que llegar tarde.

## 3. Cierres comprobados

**Museos Vaticanos** — calendario oficial 2026 y 2027 (museivaticani.va, PDF), releído el 1 de octubre de 2026. Coincide con los datos:

| Fecha clave | Qué dice el calendario |
|---|---|
| 10-12 oct 2026 | Domingo 11 cerrado. El lunes 12 abre normal. |
| 30 oct-1 nov 2026 | Domingo 1 de noviembre cerrado. |
| 5-8 dic 2026 | Domingo 6 y martes 8 cerrados. |
| 24-29 mar 2027 | Domingo 28 (Pascua) y lunes 29 cerrados. El 28 es último domingo de mes, pero cierra. |
| 30 abr-2 may 2027 | Sábado 1 y domingo 2 cerrados. |
| 16-18 jul 2027 | Domingo 18 cerrado. |
| 13-16 ago 2027 | Sábado 14, domingo 15 y lunes 16 cerrados. |
| 1 nov 2027 | Lunes 1 cerrado. |
| 24 y 31 dic | Abren de 8:00 a 13:00 (última entrada) y cierran a las 15:00. |

**Castillo de Sant'Angelo** — cultura.gov.it: en 2026 abrió el 1 de mayo, el 15 y 16 de agosto y el Lunes de Pascua (lunes, su día de cierre; pasó el cierre al martes). **Para 2027 aún no hay nada publicado**: en los datos sigue cerrado los lunes, el 25 de diciembre y el 1 de enero. El lunes 29 de marzo y el lunes 16 de agosto de 2027 salen como cerrados; si el Ministerio publica apertura, se cambia. No lo doy por abierto sin la fuente de ese año.

**Coliseo y Foro** — colosseo.it: cierran el 25 de diciembre; horario corto el 1 de enero; el 2 de junio, solo por la tarde; el Viernes Santo cierran a las 14:00 (2024 y 2025; el de 2027 no está publicado: va como «probable»).

**Panteón, Galería Borghese, Termas de Caracalla, Museos Capitolinos, Ara Pacis** — sin cambios en los datos; los comprobé en tandas anteriores (su fuente y su fecha están en cada ficha). No los he vuelto a mirar hoy.

**Basílica de San Pedro el 25 de diciembre** — ni vatican.va ni basilicasanpietro.va publican a qué hora vuelve a abrir a las visitas después de la bendición («gli orari possono variare»). La ruta entra desde las 13:30, el tramo prudente que ya había; en el día del Vaticano, a las 14:15.

## 4. Free Tour en festivos

Guardado en `default_free_tour.disponibilidad.horas_especiales`, con tu fuente (calendario de reserva de Civitatis, 30-09-2026) y `verificar`: el 24, 25 y 31 de diciembre y el 1 y 6 de enero, solo a las 12:00.

Qué he hecho en cada caso:

- **Si el viaje tiene otro día para el tour** (casi todos): el día del tour se va a un día normal, con el tour a las 10:00 y el Vaticano por la tarde. Ejemplo: 30 dic-1 ene, el tour va el 30.
- **24 o 31 de diciembre sin otro día** (viajes de 2 días 24-25 y 31-1):
  - Museos Vaticanos a las 8:00, la Plaza de San Pedro, metro A a la Plaza de España y tour a las 12:00.
  - **La Basílica se ve desde la plaza**: no da tiempo a entrar antes del tour y por la tarde ya ha cerrado.
  - Se come al acabar el tour (14:45) y la tarde es el Panteón por dentro, San Luigi y Campo de' Fiori.
  - He elegido esto y no «el Vaticano otro día» porque en esos viajes el otro día es el 25 o el 1, con los Museos cerrados.
- **25 de diciembre, 1 y 6 de enero** (Museos cerrados): la mañana empieza a las 10:30 por Trevi, tour a las 12:00, comida a las 14:45 y por la tarde el Castillo por fuera, la Plaza y la Basílica.
- **Viajes de un solo día** en esas cinco fechas: un tour a mediodía parte el día en dos (el Coliseo cierra a las 16:30). El día va **sin tour** y lo dice: «Hoy el Free Tour solo sale a las 12:00 y en un solo día partiría la ruta en dos: hemos dejado el día sin él, con el centro a tu aire.»

La prueba de Navidad cuenta ahora cualquier tour a una hora a la que ese día no sale: 0.

## 5. Decisiones de la tanda anterior, hechas

- La ficha de la Plaza de San Pedro el 25 de diciembre: «Hoy a las 12:00 el Papa da la bendición desde el balcón de la Basílica y la plaza se llena de fieles. Después se va vaciando, y la Basílica vuelve a abrir a las visitas a primera hora de la tarde.»
- Fuera los avisos del 25 de abril y del 1 de noviembre. Los demás festivos (Lunes de Pascua, 1 de mayo, 29 de junio) solo salen si la ruta cambia.

## 6. Los avisos de las fechas clave

| Fecha clave | Antes | Ahora |
|---|---|---|
| Pilar | Solo el cierre del domingo. | Igual: «Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 10 para que no los pierdas.» |
| Todos los Santos | El cierre, más «Todos los Santos es festivo en toda Italia, con misas especiales y el centro animado. Hemos revisado los horarios…» | Solo el cierre de los Museos. El aviso del festivo ya no sale. |
| Puente de diciembre | «Por la tarde el Papa suele ir a la Plaza de España a honrar a la Virgen y la plaza se llena.» | «Por la tarde el Papa va a la Plaza de España y se llena; los Museos Vaticanos cierran. Hemos puesto la Plaza de España otro día. El Vaticano va otro día.» |
| Semana Santa | Viernes Santo con sugerencia de noche; Pascua con la bendición como parada; «los romanos se van de pícnic». | «Por la noche hay Via Crucis en el Coliseo y la zona se corta por la tarde. Hemos puesto el Coliseo por la mañana.» (u «otro día») · «A mediodía el Papa da la bendición en San Pedro y la plaza se llena de fieles. Hemos puesto tu visita al Vaticano otro día, para que la veas con calma.» · «Es festivo y los Museos Vaticanos cierran. Hemos puesto el Vaticano otro día.» |
| Puente de mayo | «…por la tarde suele haber un gran concierto en San Juan de Letrán.» | «Es festivo y cierran los Museos Vaticanos y algunos monumentos. Hemos puesto el Vaticano otro día.» |
| 15 de agosto | «Los romanos se van a la playa y la ciudad está más tranquila que nunca.» | «El 15 de agosto es festivo: cierran los Museos Vaticanos y muchos comercios. Hemos puesto el Vaticano otro día y el resto de tu ruta, en lo que abre.» Más el de restaurantes. |
| Fin de semana de julio | Solo el cierre del domingo. | Igual. |

## 7. Archivos

- `docs/revision/FECHAS_CLAVE_ROMA.md`: 16 viajes (los 8 de tu tabla, con y sin Free Tour), parada a parada. Su auditoría sale a 0.
- `docs/METODO_DESTINOS.md`: el método.
- `scripts/destino/fechasClave.mjs`: las fechas, calculadas. Las de 2026-27 coinciden con tu tabla.
- `scripts/destino/revisionFechasClave.mjs`: regenera la revisión (`curso=2027` para el curso siguiente).

## 8. Para decidir

1. **El lunes 29 de marzo y el lunes 16 de agosto de 2027, el Castillo** sale cerrado (lunes). En 2026 abrió esos festivos. ¿Lo dejo cerrado hasta que se publique, o lo pongo «probable abierto»?
2. **El 24 y el 31 con Free Tour en viajes de 2 días:** la Basílica se queda por fuera. La alternativa es quitar el tour ese día y ver la Basílica por dentro.
3. **El zigzag del 1 de enero** con los Capitolinos marcados a mano: ¿lo arreglo (mismo criterio que con Arte)?
