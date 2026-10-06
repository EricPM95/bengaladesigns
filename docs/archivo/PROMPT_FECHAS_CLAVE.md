# Las fechas en que viajan los españoles

Idea de fondo: curamos rutas muy bien hechas para un **fin de semana** y para **entre semana**, que es cuando viaja la mayoría. Pero nuestros viajeros son españoles, y viajan sobre todo en **los festivos y puentes de España**. Esas fechas tienen que estar tan bien curadas como un fin de semana normal, en Roma y en todos los destinos que vengan.

Reglas de siempre:
- Commit por parte y sin push.
- Reglas generales a INVARIANTES.
- Nada de eventos de una vez al año (ver PROMPT_FECHAS_SENCILLAS): solo horarios, cierres, transporte y lo que ya está en la ruta.

## 1. El método, por escrito

Crea `docs/METODO_DESTINOS.md`, la lista que seguiremos con cada destino nuevo:

1. **La base:** fin de semana (viernes-domingo) y entre semana (martes-jueves), de 1 a 7 días, en las cuatro estaciones.
2. **Las fechas clave de los viajeros españoles:**
   - **Semana Santa:** de Jueves Santo a Lunes de Pascua.
   - **Puente de mayo:** alrededor del 1 de mayo.
   - **Verano:** julio y agosto, sobre todo alrededor del 15 de agosto.
   - **Puente del Pilar:** alrededor del 12 de octubre.
   - **Todos los Santos:** alrededor del 1 de noviembre.
   - **Puente de diciembre:** del 6 al 8 de diciembre.
   - **Navidad y Reyes:** del 24 de diciembre al 6 de enero.
3. **El calendario del destino cruzado con esas fechas:** sus festivos, sus cierres, su transporte en festivos y lo que tiene de temporada (mercadillos, belenes, luces).
4. **Viajes de revisión a mano** de cada fecha clave, parada a parada, para revisarlos «como un local».
5. **Pruebas:** la de las 365 fechas y la de fechas clave, con 0 avisos de verdad en las fechas clave.

A INVARIANTES: «Un destino no se da por cerrado hasta que sus fechas clave de viajeros españoles están curadas y probadas.»

## 2. Roma: las fechas clave de 2026-27

Calcula las fechas con el calendario real, sin fijarlas a mano. Como guía, las de este curso:

| Fecha clave | Viaje típico que hay que revisar |
|---|---|
| Puente del Pilar 2026 | sáb 10 – lun 12 oct (3 días) |
| Todos los Santos 2026 | vie 30 oct – dom 1 nov (3 días). El 1 de noviembre cierran los Museos Vaticanos. |
| Puente de diciembre 2026 | sáb 5 – mar 8 dic (4 días). El 8 es la Inmaculada en Roma y los Museos Vaticanos cierran. |
| Navidad y Reyes | ya está en `NAVIDAD_ROMA.md` |
| Semana Santa 2027 | jue 25 – lun 29 mar (5 días) y mié 24 – dom 28 mar (5 días). Pascua es el 28 de marzo. |
| Puente de mayo 2027 | vie 30 abr – dom 2 may (3 días). El 1 cae en sábado. |
| Verano 2027 | vie 13 – lun 16 ago (4 días), con Ferragosto y el cierre del lunes 16 de los Museos Vaticanos. Y un fin de semana de julio (3 días). |

- **Cierres de Roma:** comprueba todos los de esas fechas en la web oficial de cada sitio (Museos Vaticanos, Coliseo, Panteón, Castillo, Borghese…), con fuente y fecha de comprobación.
- **Con y sin Free Tour:** cada viaje, en las dos versiones.

## 3. Revisión y prueba

1. **Revisión a mano:** escribe `docs/revision/FECHAS_CLAVE_ROMA.md` con esos viajes, parada a parada y con horas, igual que NAVIDAD_ROMA.md.
2. **La prueba de las 365 fechas:** que dé también sus números **solo en las fechas clave**. El objetivo es 0 avisos de verdad en ellas; los informativos (algo cerrado ese día) se aceptan si el aviso lo explica bien.
3. **Arregla lo que salga en las fechas clave** con el mismo criterio de siempre (un local, sin madrugones absurdos, sin esperas largas, sin ir y volver) y vuelve a pasar todas las pruebas: igual o mejor.

**Informe corto:**
- los cierres comprobados;
- los avisos de las fechas clave, antes y después;
- el archivo de revisión;
- `METODO_DESTINOS.md`.
