// REPASO de la Tanda V35A: cada pantalla del panel al lado de la de Design (ordenador y móvil), lo que no se copió exacto y la lista de comprobación.
//   node scripts/destino/generarRepasoV35A.mjs
import fs from 'node:fs'
const D = 'docs/dias/V35A_capturas'
const hay = (f) => fs.existsSync(`${D}/${f}`)
const nombres = {
  P1: 'Inicio', P2: 'Reportes (lista)', P2b: 'Reportes (abierto)', P3: 'Fotos de viajeros', P4: 'Destinos pedidos', P5: 'Ventas', P5b: 'Ventas (afiliados)',
  P6: 'Usuarios', P6c: 'Usuarios (ficha)', P7: 'Logros y sonidos', P7b: 'Qué tiene cada destino', P7c: 'Sonidos', P7d: 'Herramientas', P7e: 'Para Code',
  M1: 'Inicio', M2: 'Reportes (lista)', M2b: 'Reportes (abierto)', M3: 'Fotos de viajeros', M4: 'Destinos pedidos', M5: 'Ventas', M6: 'Ventas (afiliados)', M7: 'Logros y sonidos', M7b: 'Qué tiene cada destino', M7c: 'Sonidos', M7d: 'Herramientas', M8: 'Usuarios (ficha)',
}
const suya = (id) => ['panel_', 'usuarios_', 'logros_'].map((p) => `${p}${id}.jpg`).find(hay)
const fila = (id) => {
  const d = hay(`diseno_${id}.jpg`) ? `diseno_${id}.jpg` : null
  const s = suya(id)
  if (!d && !s) return ''
  const im = (f, t) => (f ? `<figure><img src="V35A_capturas/${f}" alt="${t}"><figcaption>${t}</figcaption></figure>` : `<figure class="vacio"><figcaption>${t}: sin captura</figcaption></figure>`)
  return `<section><h3>${id} · ${nombres[id] ?? id}</h3><div class="par">${im(d, 'Design')}${im(s, 'La app')}</div></section>`
}
const ids = (r) => Object.keys(nombres).filter((i) => i.startsWith(r))
const noExacto = [
  'Enlace al sitio (Reportes): la app no tiene enlace profundo a un sitio concreto; lleva a «Qué tiene cada destino».',
  'Destinos pedidos: Añadir, Pasar a Próximamente y Quitar salen apagados con «Pronto» (necesitan datos nuevos en la base: V35B).',
  'Ventas: el pase «Pase Roma» de Eric (6,99 €) no tiene cuenta asociada: «empezar_de_cero» borra los pases y «pagos_registro» no guarda quién pagó.',
  'Ventas: comisión de Stripe y clics a afiliados salen «Pronto». Los enlaces de Civitatis y Stay22 están en data/panel/enlaces.json y no se han podido verificar desde aquí.',
  'Usuarios: niveles desde 1; retención «Pronto»; «Viajan entre…» usa dos campos de fecha del navegador.',
  'Logros y sonidos: «Elegir fotos» no existe en la app, así que no se puso; la prueba de fotos va dentro de «Para Code».',
  'Inicio: «Dónde viven» sale «Pronto» (falta el país donde vive cada persona).',
]
const v35b = ['País donde vive cada persona', 'Aparato y app instalada', 'Comisión de Stripe por cobro', 'Clics a afiliados', 'Próximamente en la base de datos (y sus tres botones)', 'user_id en pagos_registro', 'Retención de usuarios']
const lista = [
  'Menú de Design con cifras rojas reales', 'Selector de periodo igual y arriba en Inicio, Ventas, Destinos pedidos y Usuarios', 'Dinero siempre en «€» con coma y dos decimales',
  'Pases Individual / Dúo / Grupo', 'Banderas reales (pieza compartida)', 'Inicio: tarjetas, gráfico, primera vez, desde dónde viajan', 'Reportes: quién, contexto, historial, respuesta y «marcar como hecho»',
  'Ventas: conversión real y «lo que te queda»', 'Usuarios: bloques, lista, fichas y filtro «Viajan entre…»', 'Logros y sonidos: 4 pestañas', 'Sin SQL nuevo; nada toca producción',
  'pruebaV35A 91/0, pruebaV35A_usuarios 174/0, pruebaV35A_logros 126/0, pruebaJutrip 130/0, V33 22/0 y 111/0, V34 78/0, V34C 84/0, EntrarUnaVez 7/0',
]
const li = (a) => `<ul>${a.map((x) => `<li>${x}</li>`).join('')}</ul>`
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V35A · el panel</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1400px;margin:0 auto;padding:16px;color:#1C2230}h1{font-size:24px}h2{margin-top:40px}h3{margin:24px 0 8px}.par{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;border:1px solid #ddd;border-radius:8px}figcaption{font-size:12px;color:#667;margin-top:4px}.vacio{border:1px dashed #bbb;padding:24px;border-radius:8px}@media(max-width:700px){.par{grid-template-columns:1fr}}</style>
<h1>V35A · El panel, igual que Design</h1><p>Cada pantalla de Design (izquierda) y la de la app con datos de la demo (derecha).</p>
<h2>Lo que no se copió exacto, y por qué</h2>${li(noExacto)}
<h2>En ordenador</h2>${ids('P').map(fila).join('')}
<h2>En el móvil</h2>${ids('M').map(fila).join('')}
<h2>Para la V35B</h2>${li(v35b)}
<h2>Lista de comprobación</h2>${li(lista)}</html>`
fs.writeFileSync('docs/dias/REPASO_V35A.html', html)
console.log('REPASO_V35A.html escrito')
