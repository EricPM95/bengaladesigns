// Genera docs/dias/REPASO_HOY2.html, REPASO_HOY2b.html y REPASO_HOY3.html: lista de comprobación con casillas arriba y capturas de móvil.
//   node scripts/destino/repasoHOY2.mjs
import fs from 'node:fs'

const OK = '✅ Hecho'
const MED = '⚠️ A medias / lo miras tú'
const NO = '❌ No hecho'
const P = (punto, estado, donde, captura = null, nota = '') => ({ punto, estado, donde, captura, nota })

const HOY2 = {
  id: 'HOY2',
  titulo: 'Repaso de la Tanda HOY2',
  intro:
    'El nuevo HOY, parte 2: HOY completa (orden de los bloques, avisos con X, «Tu día» sin horas, «Por llegar» con foto, día acabado, llegada, último día, sin pase), [Cambiar plan] con sus 5 opciones y propuestas (retraso, saltar, pasar a otro día, añadir), quiero comer ahora, «¿Qué hacemos con…?», la entrada en peligro y la lluvia. Todo en tu viaje de Lanzarote (martes 10 y domingo 8). Lanzarote sigue OCULTO (solo administrador).',
  prefijos: ['hoy2_'],
  puntos: [
    P('Orden de los bloques: cabecera, avisos, tarjeta principal, «Cerca de ti», «Tu día», «Si te sobra tiempo»', OK, 'HOY el martes 10', 'hoy2_completa_01_lz_martes10_por_la_manana.jpg'),
    P('Avisos con su X, máximo 2 a la vista y «N avisos más»; «Sin conexión» como línea fina encima', OK, 'HOY con lluvia, nubes y viento a la vez', 'hoy2_completa_05_lz_martes10_avisos_tiempo.jpg'),
    P('«Tu día» sin horas, por Mañana · Tarde · Noche (solo llevan hora las reservas y el atardecer)', OK, 'HOY › Tu día', 'hoy2_completa_02_lz_martes10_por_llegar.jpg'),
    P('«Por llegar» con la foto del lugar y sin mapa', OK, 'HOY al ir hacia una parada', 'hoy2_completa_02_lz_martes10_por_llegar.jpg'),
    P('«Ya estás aquí» con todos los botones', OK, 'HOY al llegar', 'hoy2_completa_03_lz_martes10_ya_estas_aqui.jpg'),
    P('Al tocar la tarjeta se abre la ficha completa de DÍAS (Resumen, Entradas, Tips, Logros)', OK, 'HOY › tocar la tarjeta', 'hoy2_completa_04_lz_ficha_completa.jpg'),
    P('Atardecer: tarjeta naranja y debajo la tarjeta de la parada con [He terminado]', MED, 'HOY al atardecer', 'hoy2_completa_06_lz_martes10_atardecer.jpg', 'En Design es solo la naranja; se deja la parada para no perder [He terminado]. Dime si prefieres la naranja sola.'),
    P('Día acabado: «Hasta aquí, hoy» y «Mañana, miércoles 11 · …» (solo cuando no queda ninguna parada)', OK, 'HOY al acabar el día', 'hoy2_completa_07_lz_martes10_dia_acabado.jpg'),
    P('Día de llegada: «Bienvenido a Lanzarote», «Empiezas hacia las HH:MM» y [Cómo llegar al coche de alquiler]', OK, 'HOY el domingo 8', 'hoy2_completa_08_lz_domingo8_llegada.jpg'),
    P('Último día: «Hoy vuelves a casa» con [Cómo llegar al aeropuerto]', OK, 'HOY el viernes 13', 'hoy2_completa_09_lz_ultimo_dia.jpg', 'Debajo sale también la siguiente parada, para poder marcar «visto».'),
    P('«Si te sobra tiempo» abajo del todo, plegada, con [Recuperar] y [Pasar a otro día]', OK, 'HOY › abajo del todo', 'hoy2_completa_10_lz_sobra_tiempo_abierta.jpg', 'Estos dos botones usan las acciones de siempre, sin vista previa.'),
    P('Roma: por llegar y llegada sin coche', OK, 'HOY en Roma', 'hoy2_completa_12_roma_llegada.jpg'),
    P('Sin pase: la lista nueva de lo que trae HOY (no la pantalla con candados)', OK, 'HOY en el viaje sin pase', 'hoy2_completa_13_sin_pase_lista.jpg'),
    P('Día de prueba: HOY entero sin un solo candado y con X en su franja', OK, 'HOY el día de prueba', 'hoy2_completa_14_dia_de_prueba.jpg'),
    P('[Cambiar plan] en lugar de [No me da tiempo], con la hoja de 5 opciones', OK, 'HOY › tarjeta de la parada', 'hoy2_cambiar_22.jpg'),
    P('Voy con retraso: sin minutos, con Cambia / Se mantiene / Aplicar / Ver otra opción / Volver a mi ruta original', OK, 'HOY › Cambiar plan › Voy con retraso', 'hoy2_cambiar_23.jpg'),
    P('«Plan actualizado · Deshacer» tras aplicar cualquier propuesta', OK, 'HOY tras [Aplicar]', 'hoy2_cambiar_30.jpg'),
    P('Saltarme esta parada, con aviso si hay entrada', OK, 'HOY › Cambiar plan › Saltarme', 'hoy2_cambiar_25.jpg'),
    P('Pasar a otro día en sus 3 casos (cabe / cabe quitando algo / no cabe)', OK, 'HOY › Cambiar plan › Pasar a otro día', 'hoy2_cambiar_26a.jpg', 'Capturas 26a, 26b y 26c. [Ver otra opción] no sale si solo hay una propuesta.'),
    P('Añadir un sitio cercano: los de logro primero; «encaja» o «hay que mover algo»', OK, 'HOY › Cambiar plan › Añadir', 'hoy2_cambiar_27a.jpg', 'Capturas 27lista, 27a y 27b.'),
    P('Quiero comer ahora: solo restaurantes abiertos, el más cercano primero, [Ir aquí] = propuesta', OK, 'HOY › Cambiar plan › Quiero comer ahora', 'hoy2_comer_24_lista.jpg', 'Solo salen restaurantes con horario confirmado y coordenadas (en Lanzarote 18 de 50).'),
    P('A la hora de comer: «Tu restaurante está a N minutos» [Cómo llegar] [Cambiar]', OK, 'HOY a mediodía', 'hoy2_comer_c4_hora_de_comer.jpg', 'La tarjeta de comida sustituye a la de la parada; se vuelve con «Ya he comido · seguir con el plan».'),
    P('«¿Qué hacemos con…?» una sola vez con sus 3 botones', OK, 'HOY al alejarte de una parada sin marcarla', 'hoy2_parada_28_que_hacemos.jpg'),
    P('«Tu entrada de las 11:30… corre peligro» arriba, con X y [Ver solución]; la solución no mueve la reserva', OK, 'HOY con retraso grande', 'hoy2_peligro_29_aviso.jpg', 'Solución en hoy2_peligro_29b_solucion.jpg.'),
    P('Lluvia: [Ver alternativa] → «Plan de lluvia»; al parar, «¿Volvemos al plan?»', OK, 'HOY con lluvia', 'hoy2_lluvia_32_plan.jpg', 'Capturas 32, 32b. En Roma, «Si llueve» con el mismo formato.'),
    P('Nubes y viento (31) con su alternativa', MED, 'HOY con nubes o viento', null, 'Probado en nubes; el viento solo por código y prueba, sin captura.'),
    P('Pruebas de la tanda: HOY2_A 85, HOY2_B 128, HOY2_C 132, todas con 0 fallos', OK, 'No es de móvil'),
  ],
}

const HOY2B = {
  id: 'HOY2b',
  titulo: 'Repaso de la Tanda HOY2b',
  intro:
    'El compañero, el reto del día y los retoques: [¿Qué hago ahora?], «¿Cómo vais?» y Cansados, +15/+30 que no mueve la ruta, el reto con su álbum de cromos con fotos, A tu aire, el atardecer sin parada con fotos, [Guardar en mi galería], los avisos de horario ahora en HOY y la pestaña Logros cerrada. Todo en tu viaje de Lanzarote (martes 10). Los textos de HOY están en docs/hoy/TEXTOS_HOY.md.',
  prefijos: ['hoy2b_'],
  puntos: [
    P('[¿Qué hago ahora?] siempre a la vista, debajo de la tarjeta principal y el reto', OK, 'HOY', 'hoy2b_quehago_sin_iluminar_1.jpg'),
    P('Iluminado con punto dorado quieto cuando hay un rato libre (≥30 min)', OK, 'HOY con un hueco', 'hoy2b_quehago_iluminado_1.jpg', 'Hoja en hoy2b_quehago_iluminado_hoja.jpg. Mira que el punto se vea bien al sol.'),
    P('Hora de comer sin restaurante: lleva a «Quiero comer ahora»', OK, 'HOY a mediodía', 'hoy2b_quehago_comer_hoja.jpg'),
    P('Día acabado y con luz: atardecer cercano y cena', OK, 'HOY al final de la tarde', 'hoy2b_quehago_atardecer_1.jpg'),
    P('Sin iluminar: «Vas clavando la ruta… Ahora toca X, a N minutos»', OK, 'HOY', 'hoy2b_quehago_sin_iluminar_hoja.jpg'),
    P('[Añadir] abre una propuesta; no se mueve nada hasta [Aplicar]', OK, 'HOY › ¿Qué hago ahora? › Añadir', 'hoy2b_quehago_anadir_propuesta.jpg'),
    P('«¿Cómo vais?» una vez al día tras comer (con 2 paradas o más); se apaga con «Sugerencias del compañero»', OK, 'HOY por la tarde', 'hoy2b_comovais_1.jpg', 'Regla mía: 1 h tras empezar la comida y hasta las 18:30. ¿Te vale?'),
    P('Cansados: «Vamos con calma» (quita algo y propone una pausa abierta)', OK, 'HOY › Cansados', 'hoy2b_cansados_calma_1.jpg'),
    P('Cansados: «Tomaos un respiro» (+15/+30)', OK, 'HOY › Cansados', 'hoy2b_cansados_respiro_1.jpg'),
    P('Cansados: «Aguantad un poco» con reserva cerca y [Pasar a otro día]', OK, 'HOY › Cansados', 'hoy2b_cansados_reserva_1.jpg'),
    P('Cansados: solo lo opcional, [Terminar el día] / [Seguimos]', OK, 'HOY › Cansados', 'hoy2b_cansados_opcional_1.jpg'),
    P('+15/+30 no mueve la ruta; aviso de cerrado sin botones y «podrás verla por fuera» solo donde toca', OK, 'HOY › Necesito más tiempo', 'hoy2b_mastiempo_cerrado_por_fuera.jpg'),
    P('+30 con una reserva en peligro: «Con 30 min más no llegas a tu entrada…» y [Ver solución]', OK, 'HOY › Necesito más tiempo', 'hoy2b_mastiempo_reserva.jpg'),
    P('Reto del día con 1 colección, y con 3 en fila con scroll horizontal', OK, 'HOY debajo de la tarjeta principal', 'hoy2b_reto_3_1.jpg', 'Datos de mentira en el navegador de pruebas: mira tú los reales en el móvil.'),
    P('Álbum de cromos con foto de cada sitio y sus 4 estados; [Añadir] abre la hoja de días', OK, 'HOY › tocar una colección', 'hoy2b_album_1.jpg', 'Timanfaya no tiene foto: sale con color de fondo.'),
    P('Aviso de horario en HOY por la mañana (hasta 2 sitios, con X): «Para hoy: la Cueva de los Verdes cierra a las 18:00…»', OK, 'HOY por la mañana si hay una visita justa', 'hoy2b_manana_1_sitio_1.jpg', 'Tu martes 10 no tiene ninguna visita justa de verdad (la más ajustada tiene 46 min): ahí no saldrá. Las capturas usan horas movidas.'),
    P('Aviso en directo «A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado» con [Ver solución]', OK, 'HOY con retraso', 'hoy2b_en_directo_aviso_1.jpg', 'Solución: hoy2b_en_directo_solucion_1.jpg.'),
    P('DÍAS sin la línea gris «A esta hora, posiblemente…»', OK, 'Ruta › Días'),
    P('El Tempietto pasa a «El mirador de San Pietro in Montorio»', MED, 'Roma, lunes', null, 'El texto está; la foto va neutra porque no hay una buena del mirador. Si me pasas una, la pongo.'),
    P('[Guardar en mi galería] junto a «Guardada en los recuerdos de hoy» y en cada foto grande', MED, 'HOY › cámara › álbum', null, 'Probado con simulación de iPhone y de Android, no en un móvil real. Pruébalo tú.'),
    P('A tu aire: día sin ruta con «Hoy libre», lista para marcar Visto y [Volver a mi ruta]', OK, 'HOY el miércoles 11', 'hoy2b_a_tu_aire_1.jpg'),
    P('Atardecer sin parada: título, la frase del mar (solo Lanzarote) y los sitios con foto, tiempo y [Cómo llegar]', OK, 'HOY a media tarde sin parada de atardecer', 'hoy2b_atardecer_sin_parada_1.jpg'),
    P('Pestaña Logros de la ficha: todas las colecciones cerradas al abrir', OK, 'Ficha de un sitio › Logros', 'hoy2b_logros_lanzarote_abierta_1.jpg'),
    P('Pruebas de la tanda: HOY2b_D 92, HOY2b_E 136, HOY1_B 195, todas con 0 fallos', OK, 'No es de móvil'),
    P('Lista roja «X cierra hoy a las…» (6z6) duplica la tarjeta nueva de la mañana', MED, 'HOY por la mañana', null, 'La dejo porque pruebaJutrip la comprueba. ¿Quieres que la quite?'),
  ],
}

const HOY3 = {
  id: 'HOY3',
  titulo: 'Repaso de la Tanda HOY3',
  intro:
    'Los avisos del viaje con el móvil bloqueado. Salen del servidor a su hora de Lanzarote (Atlantic/Canary). Para que lleguen tienes que pegar el SQL de docs/dias/HOY3_SQL_PARA_PEGAR.sql en Supabase, crear los dos secretos y poner las variables en Vercel; sin eso no se manda nada. El detalle de los avisos y los textos del tiempo está en docs/dias/HOY3_AVISOS_DE_ERIC.md.',
  prefijos: [],
  puntos: [
    P('Aplicar a mano en Supabase: activar pg_cron y pg_net (Database › Extensions) y pegar el SQL de docs/dias/HOY3_SQL_PARA_PEGAR.sql (0074 y 0075)', NO, 'Supabase › SQL Editor', null, 'Pendiente de ti. Se comprueba con COMPROBAR_0074.sql y COMPROBAR_0075.sql.'),
    P('Crear en el Vault los secretos avisos_viaje_url y avisos_viaje_clave (la misma clave que CRON_SECRET) y poner en Vercel PUSH_ACTIVO=true, las claves VAPID y CRON_SECRET; redesplegar', NO, 'Supabase Vault / Vercel', null, 'Pendiente de ti. Nunca pongas las claves en el chat.'),
    P('Ajustes › encender «Avisos en el móvil» y pulsar [Enviarme un aviso de prueba] (solo administrador) con el móvil bloqueado: debe llegar en segundos', MED, 'Ajustes', null, 'El primer paso real; no se puede probar sin tu móvil.'),
    P('iPhone: abre JUTRIP desde la pantalla de inicio el sábado 7 o el domingo 8; si no está añadida, HOY enseña la tarjeta «Añade JUTRIP a tu pantalla de inicio…»', MED, 'HOY el primer día', null, 'Probado en el navegador de pruebas, no en un iPhone real.'),
    P('Tocar un aviso con el móvil bloqueado y con la app abierta abre HOY', MED, 'Notificaciones', null, 'Probado con el service worker real en prueba; falta verlo en el móvil.'),
    P('Con el interruptor apagado, o sin pase, no llega ningún aviso', OK, 'No es de móvil'),
    P('Máximo 4 al día, ninguno entre 22:00 y 7:30 salvo el de llegada; la hora es la de Lanzarote', OK, 'No es de móvil'),
    P('dom 8 · 08:35 · «Bienvenido a Lanzarote. Cuando tengas el coche, empiezas hacia las 11:25.»', OK, 'Notificación'),
    P('dom 8 · 17:04 · «Hoy el sol se pone a las 18:04. Desde Famara se ve precioso.»', OK, 'Notificación'),
    P('lun 9 · 07:30 · «Buenos días. Hoy toca Fuego y mar: sal de casa a las 7:51.»', OK, 'Notificación'),
    P('lun 9 · 17:04 · «Hoy el sol se pone a las 18:04. Desde El Golfo se ve precioso.»', OK, 'Notificación'),
    P('mar 10 · 08:56 · «Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26.»', OK, 'Notificación'),
    P('mar 10 · 17:03 · «Hoy el sol se pone a las 18:03. Desde Famara se ve precioso.»', OK, 'Notificación'),
    P('mié 11 · 08:14 · «Buenos días. Hoy toca La Graciosa: sal de casa a las 8:44.»', OK, 'Notificación'),
    P('mié 11 · 17:02 · «Hoy el sol se pone a las 18:02. Desde Famara se ve precioso.»', OK, 'Notificación'),
    P('jue 12 · 08:17 · «Buenos días. Hoy toca Papagayo y Playa Blanca: sal de casa a las 8:47.»', OK, 'Notificación'),
    P('jue 12 · 17:02 · «Hoy el sol se pone a las 18:02. Desde el Faro de Pechiguera se ve precioso.»', OK, 'Notificación'),
    P('vie 13 · 09:08 · «Hoy vuelves a casa. Devuelve el coche en la T1 antes de las 17:10.»', OK, 'Notificación'),
    P('vie 13 · 15:17 · «En media hora tienes que salir hacia el aeropuerto.»', MED, 'Notificación', null, 'Lo he calculado como la hora de salir al aeropuerto (15:47) menos 30 min. Con el límite de la T1 (17:10) menos 30 saldría a las 16:40, más tarde que la salida. Dime si prefieres otra.'),
    P('Solo si toca: el tiempo a las 21:00 de la noche antes («Mañana habrá nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.») y «Sal ahora para llegar a tu turno de las 11:30»', OK, 'Notificación', null, 'En tu viaje no hay turnos apuntados, así que ese no saldrá.'),
    P('Cómo se mandan: pg_cron de Supabase despierta cada minuto una función que llama con pg_net a /api/cron/avisos-viaje con una clave; el servidor calcula y manda con web-push. Vercel gratis solo permite un cron al día.', OK, 'No es de móvil', null, 'Cada minuto en vez de cada 5, para que «a las 9:26» llegue a las 9:26 (el SQL lleva la línea para pasar a 5).'),
    P('Los miembros de un viaje compartido no reciben nada (solo el dueño con pase)', MED, 'No es de móvil', null, 'Dime si quieres que lo reciban también.'),
    P('Pruebas de la tanda: HOY3 123 · 0, pruebaTanda10J 225 · 0, pruebaCuentas3 473 · 0', OK, 'No es de móvil'),
  ],
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
function genera(t) {
  let n = 0
  const lista = t.puntos
    .map((p) => {
      n++
      return `<label class="p"><input type="checkbox" data-k="p${n}"><span><b>${esc(p.estado)}</b> — ${esc(p.punto)}${p.nota ? `<br><small>${esc(p.nota)}</small>` : ''}<br><em>Dónde: ${esc(p.donde)}</em>${p.captura ? `<br><a href="capturas_jutrip/${esc(p.captura)}"><img src="capturas_jutrip/${esc(p.captura)}" alt="" loading="lazy"></a>` : ''}</span></label>`
    })
    .join('')
  const todas = t.prefijos.length ? fs.readdirSync('docs/dias/capturas_jutrip').filter((f) => t.prefijos.some((x) => f.startsWith(x) && (x !== 'hoy2_' || !f.startsWith('hoy2b_'))) && f.endsWith('.jpg')).sort() : []
  const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso ${t.id} · Ruta</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.75}label.p em{opacity:.7;font-size:13px}
label.p img{width:100%;max-width:220px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>${esc(t.titulo)}</h1>
<p>${esc(t.intro)}</p>
<div id="cuenta"></div>
${lista}
${galeria ? `<h2>Todas las capturas</h2>${galeria}` : ''}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repaso${t.id.toLowerCase()}';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
  fs.writeFileSync(`docs/dias/REPASO_${t.id}.html`, html)
  console.log(`docs/dias/REPASO_${t.id}.html (${n} puntos, ${todas.length} capturas)`)
}
for (const t of [HOY2, HOY2B, HOY3]) genera(t)
