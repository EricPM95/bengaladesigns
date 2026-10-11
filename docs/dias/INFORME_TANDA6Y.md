# Informe de la Tanda 6y

La ruta a mano («Quiero hacerla yo») y el botón «Reorganizar». Se hizo en tres partes que luego se juntaron; cada una tiene su informe con el detalle:
- Parte A (formulario y creación de la ruta a mano): `INFORME_PARTE_A_TANDA6Y.md`
- Parte B («Reorganizar»): `INFORME_PARTE_B_TANDA6Y.md` (y los datos en `PRUEBA_REORGANIZAR_6Y.json`)
- Parte C (el interior de los días a mano): `INFORME_PARTE_C_TANDA6Y.md`

## 1. La pantalla de elegir, antes de las experiencias
- Paso nuevo del formulario entre «quién viaja» y las experiencias, con los textos exactos del prompt y el diseño de `docs/diseno/ruta_manual` (el mapa dibujado con los tres días, la tarjeta oscura «RECOMENDADO» con la flecha y la tarjeta blanca con el lápiz). Visto a 375 px.
- [¡Sí, hazla por mí!] sigue por experiencias, lugares y resumen, con la ruta montándose por detrás como hasta ahora.
- [Quiero hacerla yo] salta experiencias y lugares y va a un resumen corto (destino, fechas, transporte, estación, compañía y duración, sin experiencias ni sitios) con [Empezar mi ruta]. **No se monta ninguna ruta por detrás**: comprobado en el navegador (0 peticiones a la generación) y en la prueba.
- Flechas de atrás: elegir → «quién viaja»; experiencias y resumen corto → elegir. La barra de pasos sigue el camino elegido (5 pasos a mano, 7 con experiencias).
- **Qué usaba las experiencias y qué hace ahora sin ellas** (detalle en el informe de la parte A): solo corren en «hazla por mí» el formulario de experiencias, el pool y el resumen largo; la caché de rutas no se toca; EXPLORAR ya no sugiere «También te puede interesar» (lista vacía, que es lo que se pide); la hoja del Free Tour dice «la ruta no lleva Free Tour» y se pinta bien; el servidor y lo de temporada aceptan la lista vacía (`/api/reservation-plan` probado con una ruta sin experiencias).

## 2. La ruta a mano
- `buildManualRoute` (un solo sitio): los mismos datos del formulario, días vacíos (`dayType: 'manual'`, `stops: []`), nombrados por su fecha («lun 13 oct») o «Día 1», «Día 2»…; se pueden renombrar. Se guarda y se recupera como cualquier viaje; nunca lee ni escribe la caché de rutas. Lleva el centro de la ciudad de destino para que el mapa de RUTA, DÍAS y EXPLORAR no salga en blanco (lo vi en pantalla: sin él, «Mapa no disponible»).
- **Una sola regla** (`isManualRoute`, `planMode === 'manual'`): la app no mete nada sola, no reordena nada (ni por reservas ni por horarios), no sugiere paradas, no pone «Te falta…» ni «Si te sobra tiempo». Cerrados con ella: rehacer días al poner una reserva grande, quitar una reserva, el Free Tour, cambiar fechas, «Vas justo» y «Estoy cansado» de HOY, «Quiero entrar», encajar el día al poner el vuelo, y pedir el plan de reservas.
- Día vacío: [Añadir parada] (EXPLORAR con nuestra lista completa, marcando varios; orden: más «me gusta» de verdad → imprescindibles → nivel 1 → resto; «En tu mié 14» en lo que ya está en otro día) y [Añadir excursión] (solo en días vacíos). Con paradas, solo [Añadir parada] al final. Visto: el día vacío con sus dos botones, EXPLORAR abriéndose «Añadir parada — mié 14» con la lista en el orden nuevo y el aviso «Añadido al miércoles 14» con [Deshacer].
- Lo demás ya funcionaba y se comprueba en la prueba (tarjetas con horario y «Cerrado ese día», avisos «coinciden», «vas justo», «día completo» y el de cierre de reserva, precios y presupuesto, afiliados con los mismos códigos, «EN TU RUTA», 0 horas calculadas a la vista).

## 3. «Reorganizar»
- Un módulo compartido (`shared/routeEngine/reorganizarDia.js`) que usa nuestros días escritos solo para saber el orden: grupos sacados del documento (nada escrito a mano en el código), lo reservado decide su fila, comida y cena solo si el día ya las tiene, y **nunca añade, quita ni cambia de día**. El botón «Reorganizar este día» sale con 2 paradas o más en la ruta a mano y en los días cambiados a mano de la nuestra, con «Día reorganizado» y [Deshacer] (o «Tu día ya está en buen orden»). «Crear mi propio día» usa la misma forma de ordenar.
- **Resultado de la prueba (1.166 comprobaciones, 0 fallos):** con nuestros días escritos D0 a D7 (20 mezclas cada uno, 160/160) y con reservas (200/200), sale siempre el orden escrito. Con **200 días mezclados** (semilla fija): 0 nocturnas de día, 0 comidas al principio o al final, 0 cenas mal puestas, 0 Trastevere antes de mediodía, 0 grupos partidos. **Zigzag: 75 de 200** (29 si se mira cada franja por separado); casi todo viene de «mañana antes que tarde», que sale del propio documento. **Sitios de la zona de Trastevere antes de la comida: 28** (el Janículo, la Isla Tiberina… que el documento pone de mañana en el D7). No lo he arreglado a mano, como pedías. Los 5 ejemplos están en el informe de la parte B.

## 4. Pruebas
- Nuevas: `pruebaFase6y_formulario.mjs` (459), `pruebaFase6y_manual.mjs` (1.694), `pruebaFase6y_reorganizar.mjs` (1.166), todas a 0 fallos (con nombres propios para no pisar ninguna prueba existente).
- Las de siempre, a 0 fallos (con la 6r a la 6z6f). Capturas: `docs/dias/img/6y-*.jpg`. Viaje de prueba borrado.

## 5. Lo que NO pude comprobar
- En pantalla a 375 px: el botón «Reorganizar» con «Deshacer», una excursión añadida a un día con precio y la pastilla a la cartera, EXPLORAR marcando varias paradas con el «En tu día…» y la pantalla de elegir en un móvil bajo. El navegador de pruebas se volvió inestable (capturas con artefactos). Lo cubren las pruebas (1694 y 1166 comprobaciones con el código de la app y el servidor real), pero no lo he visto.
- Las pruebas de 365 días y la lista de 12 meses no las he vuelto a pasar (el motor de nuestra ruta no cambia, salvo que «Crear mi propio día» usa ahora el orden compartido; la de la 6g, 170 viajes, sale a 0).
