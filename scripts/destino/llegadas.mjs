// La página de revisión de la llegada y la vuelta de un destino (PROMPT_UI, Parte 3): docs/LLEGADAS_<DESTINO>.html,
// generada desde data/dias/<destino>/_llegada.json con las MISMAS reglas que la app (shared/arrival/arrivalRules.js).
// Una sección por medio y, dentro, por punto: la barra (llegada y vuelta, con reserva y sin ella), las tres pestañas y
// cada precio con su fuente y la fecha en que se comprobó.
//
//   node scripts/destino/llegadas.mjs [roma]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { barTextOf } from '../../shared/arrival/arrivalRules.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const destino = (process.argv[2] ?? 'roma').toLowerCase()
const info = JSON.parse(fs.readFileSync(path.join(root, 'data/dias', destino, '_llegada.json'), 'utf8'))
const ORIGEN = 'Barcelona'

/** Horas de ejemplo para ver la barra con reserva (las del PROMPT donde las da). */
const EJEMPLO = {
  avion: { llegada: '11:30', vuelta: '19:30' },
  tren: { llegada: '10:45', vuelta: '18:00' },
  bus: { llegada: '09:10', vuelta: '21:00' },
  ferry: { llegada: '07:00', vuelta: '20:00' },
  coche: { llegada: null, vuelta: null },
}
const NOMBRE = { avion: 'Avión', tren: 'Tren', bus: 'Autobús', ferry: 'Ferry', coche: 'Coche' }

const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fuente = (url, fecha) =>
  url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">Fuente${fecha ? ` · ${esc(fecha)}` : ''}</a>` : '<span class="src none">Sin web oficial: sin precio</span>'

function barra(mode, bar) {
  return `<div class="bar"><span class="blk">${esc(NOMBRE[mode].slice(0, 1))}</span><span class="data">${esc(bar.eyebrow)} · ${esc(bar.main)}</span>${bar.pill ? `<span class="key">${esc(bar.pill)}</span>` : ''}${bar.add ? `<span class="add">${esc(bar.add)}</span>` : ''}<span class="perf">›</span></div>`
}

function opciones(list) {
  const sorted = [...(list ?? [])].sort((a, b) => Number(Boolean(b.mas_comodo)) - Number(Boolean(a.mas_comodo)))
  return `<table>${sorted
    .map(
      (o) => `<tr><td>${o.mas_comodo ? '<span class="tag">EL MÁS CÓMODO</span><br>' : ''}<b>${esc(o.nombre)}</b><br><small>${esc([o.tiempo, o.frecuencia].filter(Boolean).join(' · '))}</small>${o.nota ? `<br><small class="nota">${esc(o.nota)}</small>` : ''}</td><td class="precio">${esc(o.precio ?? '—')}</td><td>${fuente(o.fuente, o.comprobado)}</td></tr>`,
    )
    .join('')}</table>`
}

const bloque = (b) => (b ? `<h5>${esc(b.titulo ?? '')}</h5><p>${esc(b.texto)}</p>${b.fuente ? fuente(b.fuente, b.comprobado) : ''}` : '')
const tips = (list) => (list ?? []).map((t) => `<div class="tip"><b>${esc(t.titulo)}</b><p>${esc(t.texto)}</p>${t.fuente ? fuente(t.fuente) : '<span class="src none">Consejo sin cifra</span>'}</div>`).join('')

let secciones = ''
for (const [mode, medio] of Object.entries(info.medios)) {
  const t = EJEMPLO[mode]
  let puntos = ''
  for (const point of medio.puntos) {
    // (Tanda 6t: la app no enseña ninguna hora que calcule ella; solo la que pone el viajero. Gratis: sin hora; de pago: con y sin la hora del viajero.)
    const bars = [
      barTextOf({ kind: 'llegada', mode, point, origin: ORIGEN, destino: info.ciudad, time: t.llegada, pago: true }),
      barTextOf({ kind: 'llegada', mode, point, origin: ORIGEN, destino: info.ciudad, time: null, pago: true }),
      barTextOf({ kind: 'llegada', mode, point, origin: ORIGEN, destino: info.ciudad, time: null, pago: false }),
      barTextOf({ kind: 'vuelta', mode, point, origin: ORIGEN, destino: info.ciudad, time: t.vuelta, pago: true }),
      barTextOf({ kind: 'vuelta', mode, point, origin: ORIGEN, destino: info.ciudad, time: null, pago: true }),
      barTextOf({ kind: 'vuelta', mode, point, origin: ORIGEN, destino: info.ciudad, time: null, pago: false }),
    ]
    const ultimaTarde = ''
    const traslados = mode === 'coche' || mode === 'tren' || mode === 'bus' ? '<p class="muted">Sin pestaña de traslados en este medio.</p>' : point.traslado ? '<p>Traslado privado puerta a puerta (sin precio ni proveedor en la app) · enlace: ' + esc(point.traslado.url) + '</p>' : '<p class="muted">Sin traslado en los datos de este punto: la pestaña no sale.</p>'
    puntos += `
      <article>
        <h3>${esc(point.nombre)}${point.codigo ? ` (${esc(point.codigo)})` : ''} <small>· al centro ${point.al_centro_min} min${point.distancia ? ` · ${esc(point.distancia)}` : ''}</small></h3>
        ${point.foto_url ? `<img src="${esc(point.foto_url)}" alt="" loading="lazy"><p class="cred">Foto: ${esc(point.foto_credito ?? '')}</p>` : ''}
        <h4>La barra</h4>
        <p class="muted">Con reserva (${esc(t.llegada ?? '—')} / ${esc(t.vuelta ?? '—')}) y sin ella.</p>
        ${bars.map((bar) => barra(mode, bar)).join('')}
        <div class="tabs">
          <section><h4>Resumen · llegada</h4><p>${esc(medio.textos.llegada_por_que)}</p><h5>${mode === 'coche' ? 'La ZTL y dónde aparcar' : `De ${esc(point.nombre)} al centro`}</h5>${opciones(point.al_centro)}
            ${mode !== 'coche' ? bloque(info.estacion_alojamiento) + bloque(info.consigna) : ''}<h5>Tu primera parada</h5><p class="muted">La primera parada del día, con su número del mapa (sale de la ruta).</p></section>
          <section><h4>Resumen · vuelta</h4><p>${esc(medio.textos.vuelta_por_que)}</p>${ultimaTarde ? `<h5>Tu última tarde, sin prisas</h5>${ultimaTarde}` : ''}
            <h5>${mode === 'coche' ? 'Salir de Roma' : `Del centro a ${esc(point.nombre)}`}</h5>${opciones(point.a_la_salida?.length ? point.a_la_salida : point.al_centro)}
            ${mode !== 'coche' ? bloque(info.maleta) + `<h5>Tu última hora</h5>${(info.ultima_hora ?? []).map((u) => `<p><b>${esc(u.nombre)}</b> · ${esc(u.texto)}</p>`).join('')}` : ''}</section>
          <section><h4>Traslados</h4>${traslados}</section>
          <section><h4>Tips · llegada</h4>${tips(medio.tips_llegada)}<h4>Tips · vuelta</h4>${tips(medio.tips_vuelta)}</section>
        </div>
      </article>`
  }
  const reglas =
    mode === 'coche'
      ? 'Sin hora clave: la barra enseña el aviso de la ZTL.'
      : mode === 'ferry'
        ? `En el centro = llegada + traslado. Salir = salida − ${medio.salir_antes_min} min de embarque − ${medio.trayecto_min} min de trayecto.`
        : `En el centro = llegada + traslado del punto (de 5 en 5). Salir = salida − ${medio.salir_antes_min} min (de 5 en 5 hacia abajo).`
  secciones += `<section class="modo" id="${mode}"><h2>${esc(NOMBRE[mode])}</h2><p class="reglas">${esc(reglas)}</p>${puntos}</section>`
}

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Llegadas ${esc(info.ciudad)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Geist:wght@400;500;600&family=Geist+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#F5EFE4;--card:#FFFDF8;--ink:#1d1a16;--soft:#6d655a;--accent:#B64E10;--petrol:#1F5F78;--blue:#2563A8;--line:rgba(29,26,22,.12)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Geist,system-ui,sans-serif;padding:24px 16px 80px}
main{max-width:980px;margin:0 auto}h1,h2,h3{font-family:'Instrument Serif',serif;font-weight:400}h1{font-size:40px;margin:0 0 4px}h2{font-size:32px;margin:48px 0 4px;border-top:1px dashed var(--line);padding-top:24px}
h3{font-size:24px;margin:24px 0 8px}h3 small{font:13px Geist;color:var(--soft)}h4{font:600 11px 'Geist Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin:18px 0 6px}h5{font-size:14px;margin:14px 0 4px}
nav a{margin-right:12px;color:var(--accent)}.muted,.reglas{color:var(--soft)}article{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:16px 18px;margin:16px 0}
img{width:100%;max-height:220px;object-fit:cover;border-radius:14px}.cred{font-size:11px;color:var(--soft);margin:2px 0 0}
.bar{display:flex;align-items:stretch;height:52px;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:#fff;margin:6px 0;max-width:560px;font:500 11px 'Geist Mono',monospace;letter-spacing:.06em;text-transform:uppercase}
.bar .blk{width:54px;background:linear-gradient(115deg,var(--petrol) 58%,#4a7f93 58%,#4a7f93 70%,var(--petrol) 70%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px}
.bar .data{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:center;padding:0 10px;color:#4a443c}.bar .key{align-self:center;color:var(--accent);font-weight:600;white-space:nowrap;padding-right:8px}.bar .add{align-self:center;color:var(--blue);font-weight:600;white-space:nowrap;padding-right:8px}
.bar .perf{width:36px;border-left:1.5px dashed rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:18px;color:#999}
.tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px 20px}table{width:100%;border-collapse:collapse;font-size:13px}td{border-top:1px solid var(--line);padding:8px 6px;vertical-align:top}td.precio{font:600 12px 'Geist Mono',monospace;white-space:nowrap}
.tag{display:inline-block;background:var(--petrol);color:#fff;font:600 9.5px 'Geist Mono',monospace;letter-spacing:.08em;border-radius:99px;padding:2px 8px;margin-bottom:3px}.nota{color:var(--soft)}
.src{font-size:11px;color:var(--soft)}.src.none{font-style:italic}.tip{border-top:1px solid var(--line);padding:6px 0}.tip p{margin:2px 0}.tarde .k{color:var(--accent)}
@media (max-width:479px){.bar{height:48px}}
</style></head><body><main>
<h1>Llegada y vuelta · ${esc(info.ciudad)}</h1>
<p class="muted">Generada desde <code>data/dias/${esc(destino)}/_llegada.json</code> con las reglas de la app (<code>shared/arrival/arrivalRules.js</code>). Origen de ejemplo: ${esc(ORIGEN)}. Despedida: «Fin del viaje. ${esc(info.despedida)}»</p>
<nav>${Object.keys(info.medios).map((m) => `<a href="#${m}">${esc(NOMBRE[m])}</a>`).join('')}</nav>
${secciones}
</main></body></html>
`
const out = path.join(root, 'docs', `LLEGADAS_${destino.toUpperCase()}.html`)
fs.writeFileSync(out, html)
console.log(`${path.relative(root, out)} · ${Object.keys(info.medios).length} medios`)
