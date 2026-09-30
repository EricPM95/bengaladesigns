# Método para curar un destino

La lista que seguimos con cada destino nuevo. Un destino no se da por cerrado hasta que sus fechas clave de viajeros españoles están curadas y probadas (INVARIANTES 406).

## 1. La base

Rutas de **fin de semana** (de viernes a domingo) y de **entre semana** (de martes a jueves), de 1 a 7 días, en las **cuatro estaciones**. Con y sin Free Tour.

## 2. Las fechas clave de los viajeros españoles

Nuestros viajeros son españoles y viajan sobre todo en los festivos y puentes de España. Esas fechas tienen que estar tan bien curadas como un fin de semana normal.

| Fecha clave | Cuándo | Viaje típico |
|---|---|---|
| Semana Santa | de Jueves Santo a Lunes de Pascua | 5 días: de jueves a lunes, y de miércoles a domingo |
| Puente de mayo | alrededor del 1 de mayo | el puente del 1 de mayo |
| Verano | julio y agosto, sobre todo alrededor del 15 de agosto | 4 días desde el viernes del 15 de agosto, y un fin de semana de julio |
| Puente del Pilar | alrededor del 12 de octubre | el puente del 12 de octubre |
| Todos los Santos | alrededor del 1 de noviembre | el puente del 1 de noviembre |
| Puente de diciembre | del 6 al 8 de diciembre | del sábado de antes del 6 hasta el 8 |
| Navidad y Reyes | del 24 de diciembre al 6 de enero | los de su revisión propia |

**Las fechas se calculan con el calendario real de cada año**, nunca a mano: `scripts/destino/fechasClave.mjs`.

- El puente de un festivo que cae en lunes va de sábado a lunes; en martes, de sábado a martes; en jueves, de jueves a domingo; en viernes, sábado o domingo, de viernes a domingo; en miércoles, de miércoles a viernes.
- `fechasClaveDelCurso(2026)` da las del curso 2026-27; `fechasClaveDe(2027)`, las del año natural.

## 3. El calendario del destino, cruzado con esas fechas

Para cada fecha clave, en la web oficial de cada sitio y con fuente y fecha de comprobación en los datos:

- **Festivos del destino** que caen dentro (pueden no ser los de España: el 8 de diciembre es festivo en Roma, el 6 no).
- **Cierres y horarios especiales** de los imprescindibles y de lo de pago.
- **Transporte** recortado en los festivos.
- **Lo de temporada** que ya está en la ruta: mercadillos, belenes, luces.
- **El Free Tour:** si ese día sale y a qué hora (calendario de reserva).

Nada de eventos de una vez al año (INVARIANTES 405): solo horarios, cierres, transporte y lo que ya está en la ruta. Un horario de festivo no se da por abierto ni por cerrado sin la fuente oficial de ese año.

## 4. Viajes de revisión a mano

El viaje típico de cada fecha clave, con y sin Free Tour, parada a parada y con horas, para revisarlo «como un local»:

```bash
node scripts/destino/revisionFechasClave.mjs curso=2026
```

Escribe `docs/revision/FECHAS_CLAVE_<DESTINO>.md`. Navidad y Reyes tienen su revisión propia (`revisionNavidad.mjs`).

Criterio de siempre: un local, sin madrugones absurdos, sin esperas largas, sin ir y volver, y ningún texto que prometa lo que la ruta no hace.

## 5. Pruebas

- **Las 365 fechas** (`prueba365.mjs`): da sus números de todo el año y, aparte, **solo en las fechas clave**.
- **Objetivo: 0 avisos de verdad en las fechas clave.** Los informativos (algo cierra ese día) se aceptan si el aviso lo explica bien.
- **Navidad y Fin de Año** (`pruebaNavidad.mjs`) y **los 56 viajes** (`comparacion.mjs`): igual o mejor.

## 6. Cada año

Las fechas cambian: en otoño se vuelve a pasar el punto 3 con el calendario nuevo de cada sitio (lo marcado con `verificar` y `revisar` en los datos) y se regenera la revisión del curso.
