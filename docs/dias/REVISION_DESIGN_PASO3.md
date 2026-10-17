# Revisión del paso 3 de Design (17-oct, desde las 00:04)
Para escribir el mensaje a Design cuando acabemos todas las páginas. Lo decidido por Eric.

## App · Pase y cuenta
- P1 (al poner el vuelo sin pase): se queda, pero sale en RESERVAS, después de guardar el vuelo, no encima de la ruta.
- P2 («Así será tu día en Roma»): fuera. También fuera de GRATIS_Y_PASE la «demostración de HOY».
- P3 (día de llegada sin pase): se queda. Es la misma pieza que P1, en HOY. El día de llegada no es el de prueba: la prueba es el primer día entero.
- P4: fuera. Se usa la pantalla 12 de App · HOY.
  - En la lista de paradas de la 12 (y en el resto de la app), la foto pequeña de cada sitio en vez del círculo con ✓: a color con un ✓ pequeño en la esquina si está visto; más apagada si está por ver. Code: una versión miniatura de cada foto (pocos KB).
- P5: fuera. **Regla nueva: una prueba de HOY por cuenta, para siempre** (antes, una por destino). Si abre HOY sin pase y ya la usó, ve la tarjeta de la 12 y nada más.
- P6, la hoja de compra, tres opciones:
  - 1 persona: 6,99 €;
  - Pase Dúo · 2 personas: 10,99 €, con 13,98 € tachado y «5,50 € cada uno»;
  - Pase Grupo · 3 o más: 4,99 € cada uno.
  - Fuera el escalón de 5 o más a 3,99 €.
  - Se queda «Se paga una vez y no caduca».
- **El pago: paga todo el que compra** y lo comparte. El invitado entra sin pagar. Si quieren repartirlo, entre ellos. Fuera lo de pagar cada uno su parte con el precio del grupo (tenía trampa: se compraba un Dúo, se pagaba la mitad y no se compartía).
- P7: fuera «Si pagáis por separado…». Quien recibe el enlace: «Laura te invita a su Pase de Roma» con [Unirme].
- **Regla para todas las pantallas: fuera los textos que explican lo que ya se ve.**
- P8 perfecto. P8b (tarjeta en la app, solo con dos viajes a Roma que se pisan) y P9, ok.
- A1, A2 y A3, ok de momento (se diseñarán con calma más adelante).
- A4: usar el formulario de verdad (la pieza de App · Crear el viaje), no uno de mentira.
- Mis pases (Ajustes del Perfil): con los precios nuevos (1 persona, Dúo y Grupo).

## App · Crear el viaje · 05
- C1 ok. «Sustituir el anterior» no borra: el viaje de antes pasa a «Viajes guardados» (como en P9). Propuesta de Claude.
- C2 ok, pero la etiqueta de arriba «Nunca es la última vez» cambia a «Vuelves a Roma»: el logro sale con el primer Visto del viaje, como sorpresa, no al crearlo. Propuesta de Claude.

## App · Ruta y días · 07
- R1: con la ruta de verdad (las piezas de DÍAS y RUTA), tal como la tenga el que la comparte. Ahora el día pone «Vaticano» y salen Navona, Panteón y Trevi.
- Falta: dónde se comparte el viaje. Un botón [Compartir viaje] en RUTA, que abre la hoja con el enlace y el código. Con un Pase Dúo o Grupo es la misma hoja (P7), y el invitado entra con su plaza del pase.
- R2: el antes y el después dentro de la hoja, no detrás. Siempre por días: solo los días que cambian; lo que sale, tachado en rojo, y lo que entra, en verde. Vale igual para un cambio suelto, un día o la ruta entera.
- [Compartir viaje] en RUTA: ok (Eric, 02:07).
- Recomendar, de tres maneras (lo pide Eric): una parada (cambiarla por otra, quitarla o moverla), un día (añadir o quitar paradas) o la ruta entera. Propuesta de Claude: el invitado usa las mismas herramientas de siempre, pero en «modo recomendación»; nada cambia hasta [Enviar a Elena]. Desde el menú «···» de la parada, desde la cabecera de cada día y desde RUTA.
- R2: el desenlace de Claude, ok (por días, rojo tachado lo que sale y verde lo que entra, dentro de la hoja).
- R3 FUERA (Eric): el admin ve siempre la recomendación, aunque su ruta haya cambiado, y puede aceptarla: sustituye a lo que tiene ahora. El «antes» es cómo está su día ahora, no cuando se mandó. Si el día ya no existe, elige en qué día ponerla (Claude). La varita lo deshace. Cambia lo que hizo Code en cuentas parte 2 («ya no encaja»): a la parte 3.

## Explorar y fichas: las etiquetas de la hora · ok
## Logros · Momentos: N1 a N4 · ok
- N1 sirve para el resumen del VIAJE (al día siguiente de volver, cuando ya no abre la app) y para el aviso de los 30 días. El resumen del día sale solo en la app al acabar cada día, sin aviso.
- En iPhone, los avisos de una web solo funcionan si está añadida a la pantalla de inicio: N1 va después del aviso «Añádela a tu pantalla de inicio».
- N1 es el permiso de los avisos, no de la ubicación. La ubicación se pide la primera vez que toca Visto, con una línea nuestra antes. Nunca se activa sola.

## El día de prueba (Eric, 00:34 y 02:07; por confirmar)
- Libre antes de las 10:00 el día de llegada: la prueba es ese día. Más tarde: al día siguiente. Sin vuelo puesto: el día 1.
- Si no hay ningún día libre antes de las 10:00 (2 días con llegada tarde): el día con más horas libres.
- Problema de Eric: la prueba toca el día 1 (sin vuelo) y llega por la tarde. Propuesta de Claude: la prueba solo se gasta al usar HOY (Visto o Cómo llegar, como ya estaba). Si pone el vuelo antes de usarla, se recalcula. Si la primera vez que usa HOY ese día es a partir de las 12:00, pregunta una vez: «Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?» [Hoy] [Mañana]. Lo de hoy cuenta mañana con «Lo de ayer también cuenta».

## Arreglos del paso 3 (zip 3, 17-oct, 11:42)
- Eric: le gusta casi todo. Un cambio: al cambiar una parada por otra, las dos juntas en un recuadro («Propuesta: cambiar», ⇄), en el modo recomendación, en las tres hojas de R2 y en [Ver]. Mensaje: MENSAJE_DESIGN_CAMBIOS_PAREJA_17OCT.md.
- Para Code (cuentas, parte 3): la recomendación guarda «cambiar X por Y» como una pareja, no como quitar + añadir sueltos.
- (12:04) Cómo se entera el admin de una recomendación y el invitado de la respuesta, y el permiso de avisos también al compartir el viaje: MENSAJE_DESIGN_AVISO_RECOMENDACION_17OCT.md. Para Code (cuentas, parte 3): avisos «nueva recomendación» y «respuesta», el puntito y la tarjeta.
- (12:06, Eric) LA CAMPANITA: todos los avisos llegan a una campanita en la cabecera (RUTA, DÍAS, HOY) y al móvil. Fuera las tarjetas que preguntan por los avisos (N1). La ventana de permiso del móvil sale una vez, tras [Compartir viaje] o [Enviar a Elena], o al acabar el primer día. Mensaje rehecho: MENSAJE_DESIGN_AVISO_RECOMENDACION_17OCT.md. Para Code (cuentas, parte 3): la tabla de avisos de la campanita, leídos y sin leer.
