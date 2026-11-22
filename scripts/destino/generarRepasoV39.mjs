// REPASO de la Tanda V39: «Turista en tu país», «El viaje de tus sueños» y la bola del mundo para todos.
import fs from 'node:fs'
const img = (f) => (fs.existsSync(`docs/dias/${f}`) ? `<img src="${f}" alt="${f}">` : '<i>(sin captura)</i>')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V39</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:260px;border:1px solid #ddd;border-radius:10px;margin:6px 8px 6px 0}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V39 · «Turista en tu país», el viaje de tus sueños y la bola del mundo para todos</h1>
<h2>1 y 2 · «Tu país» y la serie «Turista en tu país»</h2>
${li([
  '<b>Cómo se sabe tu país:</b> manda lo que contestaste en «¿En qué país vives?» (solo cambia si lo cambias tú en Ajustes). Si saltaste la pregunta, cada viaje se mira por el país de su <b>origen</b> y el de su <b>destino</b> (en producción el origen del viaje no se guardaba nunca —<code>origen_pais</code> iba siempre vacío—, así que «Viajero nacional» no se podía ganar: ahora sí). En el panel, «Dónde viven» usa lo contestado y, si no hay, el origen del último viaje, y la ficha dice «(por el origen de su viaje)».',
  '<b>Serie «Tu país»</b> (un solo logro de viajero con escalones): 1 destino de tu país → <b>«Turista en tu país»</b> («Has empezado a descubrir España.»), con el emblema del Dashboard de Design; 3 destinos → <b>«Viajero nacional»</b> («También se viaja cerca: 3 destinos de tu país.»); y un 3.er escalón <b>sin activar</b> («Conocedor de tu país», con <code>activo:false</code>; el nombre y el texto son una propuesta mía: cámbialos cuando quieras).',
  '<b>Con tu propio país ya no sale «País nuevo»</b>: sale el primer escalón de la serie. España cuenta igual en el pasaporte (sello y número de países) y en la EXP. «Destino nuevo» y la capital se quedan siempre. Quien viene de fuera (Londres → Madrid) recibe «País nuevo: España» como siempre. Un mexicano en Cancún, igual que un español en Madrid.',
  'Lo ya ganado no se quita: una cuenta con «País nuevo» de su propio país lo conserva, y un «Viajero nacional» viejo se lee como el escalón 3. La ficha sigue la regla de la V38C (nunca «0» ni «te falta» para lo ya conseguido).',
  'Hoy los únicos destinos de la app son Roma y Lanzarote: con los datos reales solo se verá el escalón 1; el 3 aparecerá cuando haya 3 destinos de un mismo país.',
])}
<h2>3 · «El viaje de tus sueños»</h2>
${li([
  'Sustituye a la pregunta 3 («¿Cómo te gusta viajar?», que no se guardaba). Siguen siendo <b>5 preguntas</b>: cada cuánto viajas · con quién · <b>el viaje de tus sueños</b> · año · país donde vives. La pantalla es la de Design (<code>Primera Vez</code>, Q3a-Q3c): buscador de país o destino con la bandera de su país y la etiqueta «País»/«Destino», ideas antes de escribir, tarjeta con «Cambiar» y «Saltar». Solo uno.',
  'La lista va <b>dentro de la app</b> (sin llamar a nada de fuera): los países de <code>data/logros/paises_mundo.json</code> y unos 600 destinos famosos en <code>data/primera_vez/suenos.json</code>, que puedes editar (formato <code>"Nombre|iso|alias;alias"</code>, una línea por destino; las que empiezan por <code>#</code> son comentarios). Encuentra sin tildes ni mayúsculas («japon», «nueva york»). Va en un trozo aparte que solo se baja al llegar a esa pregunta (el peso de abrir la app se queda en 334,9 KB, por debajo del tope).',
  'También en <b>Ajustes</b>: «El viaje de tus sueños» (ver, cambiar, quitar). No había pantalla de Design para esa hoja ni para el bloque del panel: están hechas con el patrón de «¿En qué país vives?» y de «Los más pedidos».',
  '<b>Panel → Destinos pedidos → «Destinos soñados»</b>, con las mismas barras, banderas y periodo, y un botón [Avisar].',
  '<b>Aviso:</b> «¡Tu viaje soñado ya está en Jutrip: Tokio!» llega a la campana una sola vez por persona y sueño (si eligió un país, vale cualquier destino de ese país). Reutiliza el mecanismo de los [Avísame]. <b>Ojo:</b> no hay un disparador automático al publicar un destino: sale al pulsar [Ya está disponible] de un destino publicado o [Avisar] en «Destinos soñados» (como los [Avísame], lo decide Eric).',
])}
<h2>4 · La bola «¿A dónde te apetece ir?» para todos</h2>
${li([
  'Sale en el Perfil de <b>todos</b>: el viajero nuevo, arriba como siempre; el que ya viaja, <b>debajo del pasaporte</b>. Con las mismas piezas de Design (la bola, la lista por continentes, la tarjeta del destino).',
  'Cada destino dice lo suyo: donde ya has estado, el pin con un <b>✓ dorado</b> y «✓ Ya has estado»; con un viaje próximo o en marcha, el pin destacado y «Tu viaje · 12–15 dic»; los demás, como siempre; «Próximamente» en gris con [Avísame].',
  'Al tocar un destino donde ya has estado: <b>«Lo que llevas»</b> (7 de 7 medallas, 11 de 11 colecciones, 5 de 14 secretos) con [Ver mis logros de Roma] y [Crear otro viaje]; con un viaje próximo, [Abrir mi viaje] en vez de [Crear viaje]. [Crear viaje] abre ORIGEN/DESTINO con el destino puesto (como en la V31).',
  '<b>Textos dentro de sus recuadros, con margen</b> (lo pediste al ver la primera captura): en el Perfil la lista va en 2 columnas, el nombre baja de línea si no cabe y lo que dice el destino va debajo; la prueba comprueba que ningún texto toca el borde.',
  '<b>Datos:</b> una sola petición al abrir el Perfil (la respuesta del Perfil trae ahora <code>destinos</code>, sacado de lo ya cargado); en el Perfil de quien ya viaja no se piden por adelantado los números de cada destino, solo al tocar uno.',
])}
<p>${img('V39_capturas/bola_en_el_perfil_con_viajes.jpg')}${img('V39_capturas/bola_tarjeta_lo_que_llevas.jpg')}${img('V39_suenos_q3.jpg')}</p>
<h2>5 · Ventas (pruebaV35B)</h2>
<p>Era la prueba, no el panel: tenía el reloj parado el 21-nov pero apuntaba los clics de afiliados con el día real; desde las 00:00 del 22-nov caían fuera del periodo y salían a 0. Arreglada llevando esos clics al 20-nov. Ventas enseña bien (73 comprobaciones, 0 fallos).</p>
<h2>Tu lista de comprobación de esta tanda</h2>${li([
  'Perfil de una cuenta con viajes: «¿A dónde te apetece ir?» debajo del pasaporte; los textos de la lista dentro de sus recuadros; Roma con su ✓ y, si tienes un viaje próximo, «Tu viaje · fechas».',
  'Toca Roma: «Lo que llevas» con sus tres números y los botones.',
  'Primera vez (cuenta nueva con la 0093 aplicada): la pregunta 3 es «¿Cuál es el viaje de tus sueños?»; prueba «japon» y «nueva york».',
  'Ajustes → «El viaje de tus sueños»: cámbialo y quítalo.',
  'Un español que viaja a Madrid/Lanzarote: «Turista en tu país» y «Destino nuevo», no «País nuevo».',
  'Panel → «Destinos soñados».',
])}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Aplica la migración 0093</b>: abre <code>supabase/migrations/0093_turista_y_suenos.sql</code>, copia todo y pégalo en el SQL editor de Supabase (se puede pegar más de una vez sin duplicar nada). Luego pega <code>docs/dias/COMPROBAR_0093.sql</code>: debe salir una sola fila con <code>todo = true</code>. <b>Sin aplicarla la app funciona igual:</b> 4 preguntas (la de los sueños se salta sola), Ajustes sin esa fila y «Pronto» en «Destinos soñados».',
  '<b>Dos decisiones de los agentes que se apartan del encargo (dime si prefieres otra):</b> (1) el país «de dónde sale» (contestado u origen) <b>no se guarda en una columna</b>: se calcula al leer, así no puede quedarse viejo ni pisar lo contestado, y guardar el origen en la tabla de primera vez habría creado una fila que apaga las preguntas; (2) <b><code>empezar_de_cero</code> no se rehace</b>: el sueño son columnas de <code>viajero_primera_vez</code>, que ya está en su inventario, así que «Empezar de cero» y «Borrar mi cuenta» lo borran al borrar la fila (lo comprueba <code>pruebaTanda10J</code>).',
  'El tercer escalón de «Tu país» («Conocedor de tu país») está sin activar y su nombre es una propuesta mía.',
  'El nuevo logro llega a una cuenta con «País nuevo» de su país la próxima vez que gane algo (lo ya ganado no se quita).',
  'La lista de destinos soñados es editable en <code>data/primera_vez/suenos.json</code>.',
  'No he visto la chapa nueva «Turista en tu país» en pantalla (se copió el dibujo del zip); echa un ojo.',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V39.html', html)
console.log('ok')
