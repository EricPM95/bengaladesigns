# Informe de la Tanda 6v

## Qué hay ahora

- **Entradas y Free Tour:** «EN TU RUTA» (las que cuentan) y «Ver n más» (las demás, sin «Añádela»). [Reservar entrada] y [Reservar Free Tour] abren la ficha del sitio en su pestaña «Entradas».
- **Alojamiento:** campo «Elige tu zona ⌄» + [Buscar alojamiento] a la vista; hoja con rueda y [Guardar]; con zona, «Te alojas en Prati · Cambiar». Gratis, solo [Buscar alojamiento].
- **Excursiones:** «¿Ya tienes una? Añádela» dentro de la tarjeta, debajo de [Ver excursiones].
- **Sin hoja de «no encaja bien»:** la hora guardada se queda. Solo avisa si dos reservas se pisan (hoja de abajo + campana, con [Ver mis reservas]).

## Capturas (375 px)

- Ficha abierta desde [Reservar entrada], en «Entradas»: `docs/dias/img/6v-ficha-entradas-375.jpg`
- Hoja de la zona (rueda): `docs/dias/img/6v-zona-hoja-375.jpg`
- Aviso de dos reservas que se pisan: `docs/dias/img/6v-solape-375.jpg`
- Versión gratis (Alojamiento solo con [Buscar alojamiento]): `docs/dias/img/6v-gratis-375.jpg`

## Pruebas (todas a 0 fallos)

| Prueba | Resultado |
|---|---|
| 6g · 6h · 6i · 6j · 6k · 6l · 6o · 6r | 0 fallos |
| pruebaListas, 1 de cada 5 fechas, 1 a 6 días (37.157 viajes) | 0 fallos |
| 6s, puesta al día (2.475 comprobaciones) | 0 fallos |
| 6t (1.056 comprobaciones) | 0 fallos |
| **6v (nueva, 49 comprobaciones)** | **0 fallos** |
| Typecheck | limpio |

**6s puesta al día:** el «x de n» (y «Entradas x/n» del resumen) cuenta solo las de «En tu ruta»; «En tu ruta» son justo las de las paradas por dentro (y el Free Tour si va) en el orden de los datos; «Ver más» son justo las demás, y suman la lista entera; de 1 a 6 días, con y sin fechas, gratis y de pago.

**6v (nueva):** [Reservar entrada] abre la ficha en «Entradas» (no hay ninguna tienda en el bloque); las de «Ver más» no llevan «Añádela»; «Ver n más» no sale sin haber más; la zona es el campo (sin fichas de zonas), con sus cuatro estados; «Añádela» dentro de la tarjeta de excursiones y uno solo; no queda la hoja de «no encaja bien» en ningún archivo de la app; solapes: 10:00 y 11:45 sí avisan, 10:00 y 14:00 no, 10:00 y 12:30 (justo al acabar) no, otro día no, una excursión no, fuera del viaje no, con el texto exacto del encargo y los nombres de las dos reservas; la campana avisa mientras se pisen y se va sola al arreglarlo; la versión gratis nunca enseña «¿Ajustamos tu ruta a tu vuelo?».

## A mano en el navegador (375 px; a 390 px solo comprobé que no hay desbordes en la versión gratis)

- De pago: bloque de entradas abierto («En tu ruta», «Ver 2 más» con Cúpula y Castillo), [Reservar entrada] de una de la ruta y de una de «Ver más» (las dos abren la ficha en «Entradas», sin abrir ninguna tienda), hoja de la zona (rueda, «Vaticano» debajo, [Guardar]), «Te alojas en Prati · Cambiar», «Aún no lo sé» (campo + [Buscar alojamiento]), excursiones.
- **Una hora sin lista** (Museos a las 11:45): no sale ninguna hoja de «no encaja»; se guarda y sube solo el aviso de que se pisa con el Free Tour de 10:00. Cambiando los Museos a las 14:00 no sale nada más y el aviso desaparece.
- Gratis: Alojamiento solo con [Buscar alojamiento], Entradas, Excursiones.
- **No** lo hice a mano en pantalla: el caso de excursiones «sin día de excursión» (lo comprueba la prueba) ni el ordenador.
