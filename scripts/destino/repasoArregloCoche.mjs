// Genera docs/dias/REPASO_ARREGLO_COCHE.html: lista de comprobación con casillas arriba y capturas de móvil del arreglo del formulario y de RESERVAS (6-nov).
//   node scripts/destino/repasoArregloCoche.mjs
import fs from 'node:fs'

const OK = '✅ Hecho'
const MED = '⚠️ A medias / lo miras tú'
const P = (punto, estado, donde, captura = null, nota = '') => ({ punto, estado, donde, captura, nota })
const puntos = [
  P('Lanzarote ya no llama a Claude para elegir los lugares: la ruta de tu viaje sale igual', OK, 'No es de móvil', null, 'Comparado parada a parada y comida a comida con docs/dias/_hoy3_ruta_eric.json: 0 días distintos. Sin llamadas de pago en el registro de la API.'),
  P('El paso «¿Cómo quieres llegar a Lanzarote?» desde Barcelona: el avión primero, encendido y con su tiempo, a la vista sin hacer scroll', OK, 'Formulario › Cómo quieres llegar', 'arreglo_lz_transporte_barcelona_1.jpg', 'Tren, Autobús, Ferry y En tu coche en gris con «Sin ruta»; «Desde Barcelona solo tiene sentido llegar en avión.» y «Ir en avión · Continuar». Igual desde Madrid (arreglo_lz_transporte_madrid_1.jpg).'),
  P('Fuera la caja «Para moverte» del formulario', OK, 'Formulario', 'arreglo_lz_transporte_barcelona_1.jpg', 'El coche de alquiler y la base fija se dan por hechos sin enseñarlos; se cambian en RESERVAS.'),
  P('«ACE» en vez de «LAN» en la pantalla de carga y en los chips', OK, 'Pantalla «Trazando tu ruta…»', null, 'cityCode.ts: lanzarote → ACE. Comprobado en la prueba (no sale «LAN» en ningún sitio del formulario).'),
  P('«Trazando tu ruta…» ya no espera a Claude', OK, 'Pantalla de carga', null, 'Antes unos 10 s (lo medido por Eric). Ahora el servidor responde la Fase 1 y los 5 días en milisegundos; ver el informe para las cifras.'),
  P('El aviso «Tu viaje a Lanzarote empieza en 3 días» sale UNA vez, ya con la ruta abierta; nunca encima de la carga ni del formulario', OK, 'Al pulsar [Ver mi ruta]', null, 'La franja de avisos espera a que la ruta esté abierta y sale entonces, una sola vez. Vale para cualquier aviso que llegue mientras se crea el viaje.'),
  P('RESERVAS › Vuelo sin reservar: botón [Buscar vuelos] (BCN → ACE, 8-13 nov, sin el nombre de la web)', OK, 'RESERVAS › Llegada y vuelta', 'arreglo_coche_vuelo_buscar_vuelos.jpg', 'Enlace de afiliado con búsqueda profunda: comprobado que acaba en la búsqueda BCN → ACE con las fechas.'),
  P('RESERVAS › Coche de alquiler sin reserva: [Añadir tu reserva] a la vista, «Desde el PDF, una foto o una captura.», «¿Para quién es?» solo con 2 personas o más', OK, 'RESERVAS › Coche de alquiler', 'arreglo_coche_bloque_sin_reserva.jpg', 'Con un solo viajero no sale «¿Para quién es?».'),
  P('RESERVAS › Coche con la reserva puesta: «Listo», compañía · coche · precio, recogida y devolución', OK, 'RESERVAS › Coche de alquiler', 'arreglo_coche_bloque_con_reserva.jpg', 'La hora de recogida cuenta en el día de llegada y la de devolución en el último día (límite de la T1).'),
  P('«Útil para el viaje»: fuera la fila de vuelos y, en Lanzarote, la de alquiler de coche (en Roma se queda)', OK, 'RESERVAS › Útil para el viaje'),
  P('Enlaces de afiliado (vuelos, seguro, eSIM, coche) en un solo archivo', MED, 'No es de móvil', null, 'src/lib/enlacesAfiliado.ts. Los cuatro abren bien. DiscoverCars no tiene enlace profundo con destino y fechas: va a la portada con tu código.'),
  P('DÍAS de Lanzarote: el trayecto en coche con «Rutas» (hoja de Roma, Google Maps o Apple Maps, en coche, con el nombre y el pueblo de cada parada) y SIN «+5 min para aparcar»', OK, 'DÍAS › un día con coche', 'arreglo_coche_dias_rutas.jpg', 'La hoja abierta, en arreglo_coche_dias_rutas_hoja.jpg.'),
  P('Avisos del viaje: «¿Cómo vais?» 1 h tras empezar la comida y como tarde a las 18:30', OK, 'HOY por la tarde', null, 'Ya era así: sin cambios.'),
  P('Último aviso del viernes: 16:40, «En media hora tienes que dejar el coche en la T1 (antes de las 17:10).»; fuera el de las 15:17', OK, 'Notificación del viernes 13'),
  P('Fuera la lista roja «X cierra hoy a las…» de HOY', OK, 'HOY por la mañana'),
  P('Los compañeros de un viaje compartido reciben los avisos; cada uno puede apagarlos en Ajustes', MED, 'Notificaciones', null, 'Hecho en el servidor. Hay una migración nueva, la 0076, SIN aplicar (solo cambia la mirada barata del planificador): pegar supabase/migrations/0076_avisos_viaje_companeros.sql y comprobar con docs/dias/COMPROBAR_0076.sql.'),
]
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
let n = 0
const lista = puntos
  .map((p) => {
    n++
    const hay = p.captura && fs.existsSync(`docs/dias/capturas_jutrip/${p.captura}`)
    return `<label class="p"><input type="checkbox" data-k="p${n}"><span><b>${esc(p.estado)}</b> — ${esc(p.punto)}${p.nota ? `<br><small>${esc(p.nota)}</small>` : ''}<br><em>Dónde: ${esc(p.donde)}</em>${hay ? `<br><a href="capturas_jutrip/${esc(p.captura)}"><img src="capturas_jutrip/${esc(p.captura)}" alt="" loading="lazy"></a>` : ''}</span></label>`
  })
  .join('')
const todas = fs.readdirSync('docs/dias/capturas_jutrip').filter((f) => /^arreglo_(coche_|lz_transporte_)/.test(f) && f.endsWith('.jpg')).sort()
const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso del arreglo del coche · Ruta</title>
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
<h1>Repaso del arreglo del formulario y de RESERVAS</h1>
<p>6-nov. Lanzarote sin Claude, el paso del transporte (el avión, sin «Para moverte»), ACE, el aviso de los 3 días, el coche y el vuelo en RESERVAS, los enlaces de afiliado, «Rutas» en DÍAS y las decisiones de los avisos del viaje.</p>
<div id="cuenta"></div>
${lista}
${galeria ? `<h2>Todas las capturas</h2>${galeria}` : ''}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repasoarreglocoche';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
fs.writeFileSync('docs/dias/REPASO_ARREGLO_COCHE.html', html)
console.log(`docs/dias/REPASO_ARREGLO_COCHE.html (${n} puntos, ${todas.length} capturas)`)
