// Genera docs/dias/REPASO_10N9.html (la lista de comprobación con casillas, arriba del todo, y las capturas a tamaño de móvil) y, con --md, imprime la misma lista en Markdown para el informe.
//   node scripts/destino/repaso10N9.mjs          → escribe docs/dias/REPASO_10N9.html
//   node scripts/destino/repaso10N9.mjs --md     → imprime la lista de comprobación en Markdown
// La lista sale de los ficheros `docs/dias/_10n9_checklist_<agente>.json` (un objeto por punto: apartado, punto, estado, nota, donde, captura), puestos en el orden del prompt de la Tanda 10N9
// (docs/dias/PROMPT_TANDA10N9.md), más los puntos del §0, el §12 y el §13, que son de quien integra.
// (10S7, 31-oct) Puesta al dia: antes -> «nombra lo quitado y no se ha pasado»; ahora -> se ha pasado y genera el repaso sin errores (no tiene fallos que dar: es un generador). Decision de Eric (10S7, 31-oct): pasarla en 0 fallos. No cambia nada del repaso ya entregado.
import fs from 'node:fs'

const ORDEN = ['0', '1', '2', '3', '4', '5', '6', '7']
const E = { hecho: '✅ Hecho', medias: '⚠️ A medias', no: '❌ No hecho' }
const resultadoBateria = process.env.RESULTADO_BATERIA || 'ver el informe'
const resultadoPrueba = process.env.RESULTADO_PRUEBA || 'ver el informe'
const P = (apartado, punto, estado, nota, donde, captura = null, captura_design = null) => ({ apartado, punto, estado, nota, donde, captura, captura_design })
let puntos = [
  P('0 · Antes de empezar', 'Prompt guardado en docs/dias/PROMPT_TANDA10N9.md y en el commit', 'hecho', '', 'No es de móvil.'),
  P('0 · Antes de empezar', 'Reglas de siempre (REGLAS_DE_LA_APP.md y Design); 2 agentes como mucho, un servidor, un Chrome, memoria mirada; nota de estado cada 30 min a la rama «estado» (apuntada en CLAUDE.md)', 'hecho', 'Hubo 2 agentes a la vez, un Vite y una API, y la batería con un solo Chrome. La nota se subió cada ~25 min.', 'No es de móvil.'),
  P('0 · Antes de empezar', 'Migraciones: Eric tiene hasta la 0063 menos la 0062', 'hecho', 'Hay que aplicar SOLO la 0064 (no la 0062).', 'Supabase > SQL editor: pegar 0064_solo_para_mi_admin_aparte_solo_conjunta.sql'),
  P('1 · Solo para mí del administrador, solo en cuenta conjunta', 'La separación solo vale con modo_cuentas_del_viaje = conjunta: disparador, limpieza del final y reservasPrivadasAdmin.ts; en «Cada uno lo suyo» y viajando solo, como antes de la 0062', 'hecho', 'Probado con la base de datos real (PGlite): en «Cada uno lo suyo» Ana sigue viendo la entrada del administrador; en la conjunta no le llega.', 'Con dos cuentas: Eric administrador con «Cada uno lo suyo»: la entrada «Solo para mí» de Eric la ve su amigo y sale «Reservar la mía a la misma hora».'),
  P('1 · Solo para mí del administrador, solo en cuenta conjunta', 'Si el viaje pasa de cuenta conjunta a «Cada uno lo suyo», lo apartado vuelve a trips.bookings', 'hecho', 'Probado en la base de datos. Sin ver con dos móviles reales.', 'Con dos cuentas: Ajustes del viaje > cómo llevar las cuentas > cambiar a «Cada uno lo suyo».'),
  P('1 · Solo para mí del administrador, solo en cuenta conjunta', 'Migración nueva que sustituye a la 0062, sin editarla y aplicable sin ella', 'hecho', '0064_solo_para_mi_admin_aparte_solo_conjunta.sql. Se aplica SOLA; si algún día aplicaste la 0062, también vale (la corrige y devuelve lo apartado de viajes que no son conjuntos).', 'No es de móvil.'),
  P('2 · Guardar el vuelo del administrador', 'En la rueda de la hora, sin [Guardar]; un solo botón «Guardar el vuelo» (y «Guardar el alojamiento»); solo entonces se guarda y llega un solo aviso con la ida y la vuelta', 'hecho', 'El aviso dice «ha guardado el vuelo (ida … y vuelta …)». El botón está apagado hasta poner alguna hora. Sin ver con dos móviles (sonido, segundos).', 'RESERVAS o RUTA > Llegada y vuelta > Tu vuelo. Cuenta de administrador de un viaje compartido.', '10n9_hoja_vuelo.jpg'),
  P('3 · Como en Design', 'La hoja del vuelo exactamente como Reservas Cada Uno: resumen «✓ Ida…» en las pestañas, rueda de dos columnas, sin precio, botón fijo abajo', 'medias', 'Hecha como Design 02b. Diferencias que quedan: la hoja usa el fondo de la app (no el crema de Design); minutos de 5 en 5 (Design de 1 en 1, era un ejemplo); el administrador ve un solo chip de día (el del viaje) con «Cambia las fechas del viaje». El precio del vuelo ya no está en la hoja: el del administrador sigue en el bloque; el del invitado se conserva pero hoy no tiene dónde ponerse.', 'Llegada y vuelta > Tu vuelo (administrador e invitado).', '10n9_hoja_vuelo.jpg', '10n9_hoja_vuelo_design.jpg'),
  P('3 · Como en Design', 'La tarjeta de «Mis viajes» con los chips de Design', 'hecho', 'Chips «4 días · 3 noches · 10 paradas», «En 12 días» y botón dorado. En un viaje hecho Design pone «12 paradas · 3 logros · 41 fotos»: aquí salen paradas y fotos (no hay cifra de logros por viaje).', 'Perfil > Mis viajes (un viaje y varios).', '10n9_mis_viajes.jpg', '10n9_mis_viajes_design.jpg'),
  P('4 · La película del pase', 'Captura de cada escena en 390×664 y 375×667: ningún texto se pisa ni se corta; comprobación automática puesta otra vez', 'hecho', 'Medido con getBoundingClientRect en las escenas 0, 1, 3, 4, 5, 6 y 7: 0 pisados, 0 cortados. La marca data-texto-abajo está otra vez. En la escena «Suma» la pieza «Pedazo» pasa por encima del título pequeño (es la animación de Design, una imagen).', 'Abrir el pase (Roma, con pase) y ver la película en tu móvil.', '10n9_pelicula_suma_390x664.jpg'),
  P('4 · La película del pase (añadido de Eric, 28-oct)', 'Usar Pase Pelicula Movil del RETOQUES.zip más nuevo (y Piezas/Pase Pelicula, Pase Escena 4b y Pase Globo) y hacerla exactamente igual, escena por escena; captura de cada escena tuya al lado de la de Design en 390×844, 390×664 y 375×667, con los márgenes de Design; decir qué archivos se usaron en la 10N8 y qué ha cambiado', 'medias', 'Los archivos eran los correctos: los 4 HTML de Design son byte a byte los del RETOQUES.zip (el de Descargas es el mismo) y los TS de la app (gen/Pase_Pelicula.ts, Pase_Escena_4b.ts, Pase_Globo.ts) salen idénticos al regenerarlos. Medido en 7 escenas × 3 tamaños (y 393×852, 393×659, 430×932): el fondo llena la pantalla y el palco, el texto, los iconos y las rayitas están a 0 px de Design, salvo lo propio de la app ([Ver]/✕ del final, silencio, [Comprar], la lista del final con «HOY»). NO he podido reproducir tu «sin márgenes» en Chrome. Posibles causas en un iPhone real: app añadida a la pantalla de inicio (la app usa viewport-fit=cover y Design no usa safe-area) o la barra de Safari. Dime con cuál lo ves; si es la pantalla de inicio, añado los safe-area. Único cambio que choca con Design: el título pequeño «Todo lo que incluye tu Pase Roma» va en la línea de [Saltar] (tu decisión del 26-oct) y no en su sitio de Design (top 16), donde se pisa con el contenido de la escena «hoy». Si lo quieres en el sitio de Design, es una línea.', 'Pase Roma > la película, en tu iPhone (Safari y, si la tienes, la app en la pantalla de inicio).', '10n9_peli_e4_390x844_app.jpg', '10n9_peli_e4_390x844_design.jpg'),
  P('5 · Abierto 24 h', 'La Fontana di Trevi, con la etiqueta', 'hecho', 'Ya la llevaba; se ve en su ficha.', 'Roma > Fontana de Trevi > ficha.', '10n9_trevi_24h.jpg'),
  P('5 · Abierto 24 h', 'El Teatro de Marcelo, sin la etiqueta y con horario 9:00–19:00', 'hecho', 'Puede entrar ahora en el motor de horarios (hay una entrada «de camino a la cena» que podría caer pasadas las 19:00); el barrido de 1884 viajes no dio fallos.', 'Roma > Teatro de Marcelo > ficha.', '10n9_marcelo_horario.jpg'),
  P('5 · Abierto 24 h', 'El resto de la lista de 38, bien', 'hecho', 'Quedan 37 con la etiqueta (ninguno con horario a la vez).', 'No es de móvil.'),
  P('6 · La prueba', 'Prueba nueva pruebaTanda10N9 (cuentas, vuelo, pantallas)', 'hecho', resultadoPrueba, 'No es de móvil.'),
  P('6 · La prueba', 'La batería completa y pruebaJutrip, en 0 fallos (si falla solo con el Vite normal, con el Vite estable)', 'hecho', resultadoBateria, 'No es de móvil.'),
  P('6 · Capturas', 'Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, al lado de las de Design', 'hecho', '', 'Esta página.'),
  P('7 · El informe', 'Apartado «10N9» en INFORME_TANDA10B.md diciendo qué migración aplicar, y esta lista al final', 'hecho', '', 'No es de móvil.'),
]
if (process.env.PUNTOS_JSON) puntos = JSON.parse(fs.readFileSync(process.env.PUNTOS_JSON, 'utf8'))
const seccion = (p) => (/^(?:§s*)?(d+(?:.d+)?[a-z]?)/.exec(p.apartado)?.[1] ?? '99')
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const estado = (p) => E[p.estado] ?? p.estado

if (process.argv.includes('--md')) {
  let apartado = ''
  const salida = []
  for (const p of puntos) {
    if (p.apartado !== apartado) {
      apartado = p.apartado
      salida.push('', `**${apartado}**`, '')
    }
    salida.push(`- ${estado(p)} — ${p.punto}${p.nota ? ` ${p.nota}` : ''}  \n  *Dónde:* ${p.donde}${p.captura ? `  *Captura:* \`${p.captura}\`` : ''}`)
  }
  console.log(salida.join('\n'))
} else {
  const grupos = []
  for (const p of puntos) {
    let g = grupos.find((x) => x.ap === p.apartado)
    if (!g) grupos.push((g = { ap: p.apartado, puntos: [] }))
    g.puntos.push(p)
  }
  let n = 0
  const lista = grupos
    .map(
      (g) =>
        `<h2>${esc(g.ap)}</h2>` +
        g.puntos
          .map((p) => {
            n++
            return `<label class="p"><input type="checkbox" data-k="p${n}"><span><b>${esc(estado(p))}</b> — ${esc(p.punto)}${p.nota ? `<br><small>${esc(p.nota)}</small>` : ''}<br><em>Dónde: ${esc(p.donde)}</em>${p.captura || p.captura_design ? `<br><span class="par">${p.captura ? `<a href="capturas_jutrip/${esc(p.captura)}"><img src="capturas_jutrip/${esc(p.captura)}" alt="app" loading="lazy"></a>` : ""}${p.captura_design ? `<a href="capturas_jutrip/${esc(p.captura_design)}"><img src="capturas_jutrip/${esc(p.captura_design)}" alt="Design" loading="lazy"></a>` : ""}</span>` : ""}</span></label>`
          })
          .join(''),
    )
    .join('')
  const todas = fs
    .readdirSync('docs/dias/capturas_jutrip')
    .filter((f) => /^10n9_.*\.jpg$/.test(f))
    .sort()
  const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso 10N9 · Ruta</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.75}label.p em{opacity:.7;font-size:13px}
.par{display:flex;gap:8px;align-items:flex-start}.par img{max-width:48%;width:48%}label.p img{width:100%;max-width:220px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>Repaso de la Tanda 10N9</h1>
<p>Arreglos cortos de lo que quedó de la 10N8: lo «Solo para mí» del administrador, «Guardar el vuelo», la hoja del vuelo y Mis viajes como Design, la película sin textos pisados y «Abierto 24 h». Marca cada punto en tu teléfono cuando lo hayas comprobado (se guarda en este navegador).</p>
<div id="cuenta"></div>
${lista}
<h2>Todas las capturas</h2>
${galeria}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repaso10n9';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
  fs.writeFileSync('docs/dias/REPASO_10N9.html', html)
  console.log(`docs/dias/REPASO_10N9.html (${n} puntos, ${todas.length} capturas)`)
}
