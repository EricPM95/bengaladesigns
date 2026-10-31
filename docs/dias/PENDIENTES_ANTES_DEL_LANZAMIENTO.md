# Pendientes antes del lanzamiento

Lista viva de lo que Eric ha decidido dejar «de momento así» y hay que cerrar antes de lanzar. Cada punto lleva la fecha y quién lo apuntó.

- **«Reorganizar» no puede poner un sitio a una hora en que ese día está cerrado** (Eric, 31-oct, tanda 10S7b). Hoy el botón «Reorganizar» del pase ordena las paradas de un día por los huecos de hora que ese día ya tenía (`reorganizeDay`, `src/lib/reorganizarDia.ts`) y no mira los cierres de cada día de la semana: una parada puede acabar a una hora en la que su sitio está cerrado ese día. Hay que hacer que, al ordenar, cada sitio solo ocupe huecos en los que está abierto ese día (y, si no cabe en ninguno, que se quede donde estaba y se avise).
