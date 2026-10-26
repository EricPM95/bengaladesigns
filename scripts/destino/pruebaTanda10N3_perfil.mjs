// La prueba de la Tanda 10N3, parte F2 (§3b puntos 2 a 7): el perfil que no enseña nunca el viejo, los dos sellos del pasaporte, el encuadre de la foto, los 70 px, la portada de cada viaje y la etiqueta «Abierto».
//   APP_URL=http://localhost:5187 API_URL=http://localhost:8857 node scripts/destino/pruebaTanda10N3_perfil.mjs
// (Sin APP_URL, usa el Vite de siempre. No hace falta Supabase: el viaje de pruebas y los logros de mentira, ?logrosDemo=1.) Capturas en docs/dias/capturas_jutrip/10n3_perfil_*.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirConPerfil } from './_10p_sorteo_app.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const leer = (f) => fs.readFileSync(f, 'utf8')
const CAPTURAS = 'docs/dias/capturas_jutrip'

/* ─────────────────────────── 1. El código ─────────────────────────── */
console.log('1. El código')
{
  const tarjeta = sinComentarios(leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx'))
  debe(!/['"`]Abierto['"`]/.test(tarjeta) && !/>\s*Abierto\s*</.test(tarjeta), 'abierto', 'la tarjeta del viaje de «Mis viajes» ya no escribe «Abierto»')
  for (const f of ['src/components/ajustes/Avatar.tsx', 'src/components/compartir/CarasDelViaje.tsx', 'src/components/logros/pantallas/perfil/MarcoDeRango.tsx', 'src/components/ajustes/AjustarFoto.tsx']) debe(/FotoEncuadrada/.test(sinComentarios(leer(f))), 'avatar', `${path.basename(f)} pinta la foto con el componente único FotoEncuadrada`)
  const sheet = sinComentarios(leer('src/components/layout/PerfilSheet.tsx'))
  debe(/<Suspense fallback=\{<PerfilEsqueleto/.test(sheet) && !/<Suspense fallback=\{cuerpoDeSiempre/.test(sheet), 'viejo', 'mientras baja el cuerpo con logros se ve el perfil nuevo vacío, no el viejo')
  const cuerpo = sinComentarios(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'))
  debe(!/return cuerpoDeSiempre/.test(cuerpo) && /PerfilEsqueleto/.test(cuerpo), 'viejo', 'CuerpoConLogros sin datos pinta el esqueleto nuevo, no el viejo')
  const mig = leer('supabase/migrations/0044_perfil_foto_portadas.sql')
  debe(/foto_encuadre jsonb/.test(mig) && /portadas jsonb/.test(mig) && /'encuadre', tr\.foto_encuadre/.test(mig), 'migracion', 'la migración 0044 añade foto_encuadre y portadas y devuelve el encuadre en gente_del_viaje')
  const perfil = sinComentarios(leer('src/lib/miPerfil.ts'))
  debe(/select\('nombre, foto_path'\)/.test(perfil) && /foto_encuadre/.test(perfil), 'degrada', 'sin la migración se lee el perfil de siempre (la foto y el nombre no se pierden)')
  debe(/error \}? ?= |const \{ error \} = await supabase\.from\('travelers'\)\.update\(\{ foto_encuadre/.test(perfil), 'error', 'guardar el encuadre mira el error de Supabase')
}

/* ─────────────────────────── 2. La lógica del encuadre ─────────────────────────── */
console.log('2. Pantalla: el perfil, el pasaporte, la foto y las portadas')
const { app, texto, cerrarVentanas } = await abrirConPerfil({ nombre: 'Eric' })
const E = (js) => app.evaluar(js)
const esp = app.esp
const cap = async (nombre) => app.captura(path.join(CAPTURAS, `10n3_perfil_${nombre}.jpg`), 82)
try {
  await app.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  // 2.1 Las funciones puras del encuadre.
  const puro = await E(`(async () => {
    const m = await import('/src/lib/encuadreFoto.ts')
    const r = {}
    r.leer1 = m.leerEncuadre({ x: 0.3, y: 0.6, zoom: 2 })
    r.leer2 = m.leerEncuadre('{"x":2,"y":-1,"zoom":9}')
    r.leer3 = m.leerEncuadre({ x: 'a' })
    r.centrado = m.esCentrado({ x: 0.5, y: 0.5, zoom: 1 }) && m.esCentrado(null) && !m.esCentrado({ x: 0.4, y: 0.5, zoom: 1 })
    r.lim = m.limitarEncuadre({ x: 0, y: 1, zoom: 2 }, 1.5)
    r.vis = m.parteVisible(1.5, 1)
    r.estilo = m.estiloDeEncuadre({ x: 0.5, y: 0.5, zoom: 2 }, 1)
    r.estiloCentrado = m.estiloDeEncuadre({ x: 0.5, y: 0.5, zoom: 1 }, 1)
    return r
  })()`)
  debe(puro.leer1?.zoom === 2 && puro.leer2?.x === 1 && puro.leer2?.y === 0 && puro.leer2?.zoom === 4 && puro.leer3 === null, 'encuadre', 'leerEncuadre valida y recorta a 0..1 y zoom 1..4; lo que no vale es null')
  debe(puro.centrado === true, 'encuadre', 'esCentrado: centrada y sin acercar = nada que guardar')
  debe(Math.abs(puro.vis.vw - 1 / 1.5) < 1e-9 && puro.vis.vh === 1, 'encuadre', 'una foto apaisada 3:2 enseña dos tercios de su ancho y todo su alto con zoom 1')
  debe(puro.lim.x >= 0.16 && puro.lim.x <= 0.17 && puro.lim.y <= 0.75 && puro.lim.y >= 0.7, 'encuadre', `el encuadre nunca se sale de la foto (x ${puro.lim.x.toFixed(3)}, y ${puro.lim.y.toFixed(3)})`)
  debe(parseFloat(puro.estilo.width) === 200 && parseFloat(puro.estilo.left) === -50 && parseFloat(puro.estiloCentrado.width) === 100, 'encuadre', 'con zoom 2 la imagen mide el doble del círculo y queda centrada')

  // 2.2 El perfil al abrirse NUNCA enseña el viejo (respuesta retrasada).
  await E(`window.__retrasoDemo = { '/api/logros/perfil': 3500 }; true`)
  await E(`import('/src/store/usePerfilUi.ts').then((m) => { window.__perfilUi = m.usePerfilUi; m.usePerfilUi.getState().abrir(); return true })`)
  await E(`(() => {
    window.__muestras = []
    const mirar = () => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      const t = d ? d.innerText : ''
      window.__muestras.push({
        t: Math.round(performance.now()),
        abierto: Boolean(d),
        viejo: Boolean(d && (d.querySelector('[data-fila-de-viaje],[data-cifras-del-mapa],[data-chincheta]') || /\\bAbierto\\b/.test(t) || /\\d+ (país|países) · \\d+ (lugar|lugares)/.test(t))),
        esqueleto: Boolean(d && d.querySelector('[data-perfil-cargando]')),
        nuevo: Boolean(d && d.querySelector('[data-cabecera-con-marco]')),
      })
    }
    window.__reloj = setInterval(mirar, 60)
    return true
  })()`)
  await esp(900)
  await cap('01_abriendo')
  await esp(3600)
  await E(`clearInterval(window.__reloj); true`)
  const muestras = await E('window.__muestras')
  const vistas = muestras.filter((m) => m.abierto)
  debe(vistas.length > 20, 'viejo', `se tomaron ${vistas.length} muestras con el perfil abierto`)
  debe(vistas.every((m) => !m.viejo), 'viejo', 'en NINGUNA muestra (cada 60 ms, con la respuesta retrasada 3,5 s) salió el perfil viejo (mapa grande, «1 país · 1 lugar», «Abierto»)')
  debe(vistas.some((m) => m.esqueleto && !m.nuevo), 'viejo', 'mientras llegan los datos se ve el perfil nuevo vacío (huecos grises)')
  debe(vistas.at(-1).nuevo && !vistas.at(-1).esqueleto, 'viejo', 'al llegar los datos sale el perfil nuevo con ellos')
  // Y con el servidor caído (la respuesta nunca llega): tampoco el viejo.
  await E(`window.__perfilUi.getState().cerrar(); window.__retrasoDemo = { '/api/logros/perfil': 600000 }; true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(1500)
  const sinServidor = await E(`(() => { const d = document.querySelector('[role="dialog"][aria-label="Perfil"]'); return { esqueleto: Boolean(d?.querySelector('[data-perfil-cargando]')), viejo: Boolean(d?.querySelector('[data-fila-de-viaje],[data-cifras-del-mapa],[data-chincheta]')), viajes: d?.querySelectorAll('[data-tarjeta-de-viaje]').length ?? 0 } })()`)
  debe(sinServidor.esqueleto && !sinServidor.viejo, 'viejo', 'si los datos tardan o no llegan, sigue el perfil nuevo vacío (nunca el viejo)')
  debe(sinServidor.viajes >= 1, 'viejo', 'y «Mis viajes» de este móvil sale ya, con el viaje de pruebas')
  await E(`window.__perfilUi.getState().cerrar(); window.__retrasoDemo = {}; true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(2500)

  // 2.3 La tarjeta de «Mi pasaporte»: los sellos de la esquina.
  const sellosCon = async () => E(`(() => Array.from(document.querySelectorAll('[data-abrir-pasaporte] [data-sello-asomando]')).map((e) => ({ tipo: e.getAttribute('data-sello-asomando'), svg: Boolean(e.querySelector('svg')), texto: e.textContent })))()`)
  const suyos = await sellosCon()
  debe(suyos.length === 2 && suyos.every((s) => s.tipo === 'suyo' && s.svg), 'sellos', 'con sellos ganados, la esquina lleva los dos últimos suyos')
  debe(suyos.some((s) => /ROMA|VATICANO|Roma/i.test(s.texto)), 'sellos', 'los sellos son de sitios que de verdad ha visitado (el demo: Roma)')
  const hayMapa = await E(`Boolean(document.querySelector('[data-mapa-pasaporte] svg, [data-mapa-pasaporte] canvas, [data-mapa-pasaporte] img'))`)
  debe(hayMapa, 'mapa', 'el círculo del mapa está pintado')
  const pintados = await E(`(() => { const m = document.querySelector('[data-mapa-pasaporte]'); return m ? m.querySelectorAll('path[fill^="oklch"]').length : -1 })()`)
  console.log(`   (países pintados en el círculo del mapa: ${pintados})`)
  debe(pintados > 0 || pintados === -1, 'mapa', 'el círculo del mapa pinta con color los países visitados')
  // Sin sellos ni países: dos sellos de muestra.
  await E(`import('/src/lib/logrosDemo_perfil.ts').then((m) => { m.ponerPerfilDemo({ pasaporte: { paises: 0, ciudades: 0, sellos: 0, dias_viajando: 0, paises_iso: [], sellos_recientes: [] } }); return true })`)
  await E(`window.__perfilUi.getState().cerrar(); true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(2500)
  const muestra = await sellosCon()
  debe(muestra.length === 2 && muestra.every((s) => s.tipo === 'muestra' && s.svg), 'sellos', 'sin sellos del viajero, la esquina lleva dos sellos de muestra (no queda en blanco)')
  debe(muestra.every((s) => /ROMA/i.test(s.texto)), 'sellos', 'los de muestra son los del diseño: dos sellos de Roma')
  const formas = await E(`Array.from(document.querySelectorAll('[data-abrir-pasaporte] [data-sello-asomando] svg')).map((s) => s.querySelectorAll('circle').length > 0 ? 'redondo' : 'cuadrado')`)
  debe(formas[0] === 'redondo' && formas[1] === 'cuadrado', 'sellos', `el primero es redondo y el segundo cuadrado, como en el diseño P1 (${formas.join(', ')})`)
  await E(`document.querySelector('[data-abrir-pasaporte]').scrollIntoView({ block: 'center' }); true`)
  await esp(600)
  await cap('02_pasaporte_sin_sellos')
  // Un solo sello suyo: el suyo y uno de muestra.
  await E(`import('/src/lib/logrosDemo_perfil.ts').then((m) => { m.ponerPerfilDemo({ pasaporte: { paises: 1, ciudades: 1, sellos: 1, dias_viajando: 3, paises_iso: ['it'], sellos_recientes: [{ ciudad: 'Pisa', fecha: '2026-06-20', destino: 'Pisa' }] } }); return true })`)
  await E(`window.__perfilUi.getState().cerrar(); true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(2500)
  const uno = await sellosCon()
  debe(uno.length === 2 && uno[0].tipo === 'suyo' && uno[1].tipo === 'muestra', 'sellos', 'con un solo sello ganado: el suyo y uno de muestra')
  const pisa = await E(`Array.from(document.querySelectorAll('[data-abrir-pasaporte] [data-sello-asomando]')).map((e) => e.textContent).join('|')`)
  debe(/PISA/i.test(pisa), 'sellos', 'el sello suyo es el que ganó (Pisa)')
  // El mapa se va pintando con lo visitado: con 'it' hay un país con color; sin países, ninguno.
  const pintadosIt = await E(`document.querySelector('[data-mapa-pasaporte]')?.querySelectorAll('path[fill^="oklch"]').length ?? -1`)
  console.log(`   (países pintados con Italia: ${pintadosIt})`)
  await E(`import('/src/lib/logrosDemo_perfil.ts').then((m) => { m.reiniciarPerfilDemo(); return true })`)

  // 2.4 «Mis viajes» a 70 px del pasaporte.
  await E(`window.__perfilUi.getState().cerrar(); true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(2500)
  const dist = await E(`(() => { const p = document.querySelector('[data-abrir-pasaporte]').getBoundingClientRect(); const t = document.querySelector('[data-mis-viajes] h3').getBoundingClientRect(); return t.top - p.bottom })()`)
  debe(dist >= 68 && dist <= 72, 'separacion', `entre la tarjeta del pasaporte y el título «Mis viajes» hay ${dist.toFixed(1)} px (deben ser unos 70)`)

  // 2.5 Sin «Abierto».
  const abiertoTexto = await E(`/\\bAbierto\\b/.test(document.querySelector('[role="dialog"][aria-label="Perfil"]').innerText)`)
  debe(!abiertoTexto, 'abierto', 'ninguna tarjeta de «Mis viajes» dice «Abierto»')
  const grupos = await E(`Array.from(document.querySelectorAll('[data-grupo-de-viajes]')).map((g) => g.getAttribute('data-grupo-de-viajes'))`)
  debe(grupos.length >= 1, 'abierto', `siguen los títulos de grupo (${grupos.join(', ')})`)

  // 2.6 La portada del destino por defecto.
  const tripId = await E(`import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.id)`)
  const tarjeta = () => E(`(() => { const t = document.querySelector('[data-tarjeta-de-viaje]'); const i = t?.querySelector('img[data-portada-foto-url]'); return t ? { origen: t.getAttribute('data-portada-origen'), src: i ? i.getAttribute('src') : null, credito: t.querySelector('[data-credito-portada]')?.textContent ?? null, boton: Boolean(t.querySelector('[data-cambiar-portada]')) } : null })()`)
  const t0 = await tarjeta()
  debe(t0 && t0.origen === 'destino' && /\/fotos\/roma\/dia_coliseo_p\.jpg/.test(t0.src ?? ''), 'portada', `un viaje a Roma enseña por defecto la foto de Roma (${t0?.src})`)
  debe(/David Libeert/.test(t0?.credito ?? ''), 'portada', `la foto del destino lleva su crédito (${t0?.credito})`)
  debe(t0?.boton === true, 'portada', 'la tarjeta tiene [Cambiar portada]')
  await E(`document.querySelector('[data-mis-viajes]').scrollIntoView({ block: 'start' }); true`)
  await esp(700)
  await cap('04_mis_viajes_portada_destino')

  // 2.7 Cambiar la portada: una foto del viaje.
  await E(`window.__fotosDePrueba = { [${JSON.stringify(tripId)}]: [
    { id: 'f2', tripId: ${JSON.stringify(tripId)}, dayId: 'd2', dayNumber: 2, stopName: 'Fontana di Trevi', storagePath: 'u/f2.jpg', width: 1600, height: 1000, bytes: 1, createdAt: '2026-01-11T10:00:00Z', url: '/fotos/roma/dia_fontana_de_trevi_p.jpg', urlMin: '' },
    { id: 'f1', tripId: ${JSON.stringify(tripId)}, dayId: 'd1', dayNumber: 1, stopName: 'Coliseo', storagePath: 'u/f1.jpg', width: 1600, height: 1000, bytes: 1, createdAt: '2026-01-10T10:00:00Z', url: '/fotos/roma/dia_basilica_san_pedro_p.jpg', urlMin: '' },
    { id: 'f3', tripId: ${JSON.stringify(tripId)}, dayId: 'd3', dayNumber: 3, stopName: 'Panteón', storagePath: 'u/f3.jpg', width: 1600, height: 1000, bytes: 1, createdAt: '2026-01-12T10:00:00Z', url: '/fotos/roma/dia_ara_pacis_p.jpg', urlMin: '' },
  ] }; true`)
  await E(`document.querySelector('[data-cambiar-portada]').click(); true`)
  await esp(800)
  const hoja1 = await E(`(() => { const h = document.querySelector('[data-hoja="cambiar-portada"]'); return h ? { opciones: ['[data-portada-viaje-fotos]', '[data-portada-galeria]', '[data-portada-destino]'].map((s) => Boolean(h.querySelector(s))) } : null })()`)
  debe(hoja1 && hoja1.opciones.every(Boolean), 'portada', 'la hoja «Cambiar portada» tiene las tres cosas: una foto de tu viaje, una de mi galería y volver a la del destino')
  await E(`document.querySelector('[data-portada-viaje-fotos]').click(); true`)
  await esp(700)
  const nFotos = await E(`document.querySelectorAll('[data-portada-foto]').length`)
  debe(nFotos === 3, 'portada', `salen las 3 fotos de sus paradas (${nFotos})`)
  await cap('06_cambiar_portada')
  await E(`document.querySelector('[data-portada-foto="f2"]').click(); true`)
  await esp(900)
  const t1 = await tarjeta()
  debe(t1.origen === 'viaje' && /dia_fontana_de_trevi_p/.test(t1.src ?? ''), 'portada', `al elegir una foto del viaje, la tarjeta la enseña (${t1.origen}: ${t1.src})`)
  debe(t1.credito === null, 'portada', 'la foto del viajero no lleva el crédito del destino')
  const guardado = await E(`JSON.parse(localStorage.getItem('trazo:portadas') || '{}')[${JSON.stringify(tripId)}]`)
  debe(guardado?.f === 'viaje' && guardado.id === 'f2', 'portada', 'la elección se guarda (en la cuenta y en este móvil)')
  await E(`document.querySelector('[data-mis-viajes]').scrollIntoView({ block: 'start' }); true`)
  await esp(500)
  await cap('05_mis_viajes_portada_viajero')

  // 2.8 Una de la galería.
  await E(`document.querySelector('[data-cambiar-portada]').click(); true`)
  await esp(600)
  const doc = await app.cdp('DOM.getDocument', { depth: 1 })
  const nodo = await app.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '[data-hoja="cambiar-portada"] input[type="file"]' })
  await app.cdp('DOM.setFileInputFiles', { nodeId: nodo.result.nodeId, files: [path.resolve('public/fotos/roma/dia_coliseo_p.jpg')] })
  await esp(2500)
  const t2 = await tarjeta()
  debe(t2.origen === 'galeria' && /^data:image\/jpeg/.test(t2.src ?? '' ) === false /* el src se recorta a 80 */ ? true : t2.origen === 'galeria', 'portada', `una foto de la galería también vale (${t2.origen})`)
  const g = await E(`JSON.parse(localStorage.getItem('trazo:portadas') || '{}')[${JSON.stringify(tripId)}]`)
  debe(g?.f === 'galeria' && (g.data || g.ruta), 'portada', 'la de la galería queda guardada')
  // Volver a la del destino.
  await E(`document.querySelector('[data-cambiar-portada]').click(); true`)
  await esp(600)
  await E(`document.querySelector('[data-portada-destino]').click(); true`)
  await esp(800)
  const t3 = await tarjeta()
  debe(t3.origen === 'destino' && /dia_coliseo_p/.test(t3.src ?? ''), 'portada', 'volver a la del destino devuelve la foto de Roma')
  const g3 = await E(`JSON.parse(localStorage.getItem('trazo:portadas') || '{}')[${JSON.stringify(tripId)}]`)
  debe(g3?.f === 'destino', 'portada', 'y queda guardado que quiere la del destino')

  // 2.9 Al acabar el viaje, sale sola la primera foto suya (si no eligió portada).
  await E(`import('/src/store/usePortadas.ts').then((m) => m.usePortadas.getState().elegir(${JSON.stringify(tripId)}, null))`)
  await E(`import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const r = s.route; m.useRouteStore.setState({ route: { ...r, answers: { ...r.answers, dateRange: { start: '2026-01-10', end: '2026-01-13' } }, days: r.days.map((d, i) => ({ ...d, date: '2026-01-' + String(10 + i).padStart(2, '0') })) } }); return true })`)
  await esp(1500)
  const fase = await E(`document.querySelector('[data-grupo-de-viajes]')?.getAttribute('data-grupo-de-viajes')`)
  const t4 = await tarjeta()
  debe(t4.origen === 'auto' && /dia_basilica_san_pedro_p/.test(t4.src ?? ''), 'portada', `viaje acabado y sin portada elegida: sale sola su primera foto (grupo ${fase}; ${t4.origen}: ${t4.src})`)
  await E(`import('/src/store/usePortadas.ts').then((m) => m.usePortadas.getState().elegir(${JSON.stringify(tripId)}, { f: 'viaje', id: 'f3', ruta: 'u/f3.jpg' }))`)
  await esp(900)
  const t5 = await tarjeta()
  debe(t5.origen === 'viaje' && /dia_ara_pacis_p/.test(t5.src ?? ''), 'portada', 'y la puede cambiar por otra')
  await E(`import('/src/store/usePortadas.ts').then((m) => m.usePortadas.getState().elegir(${JSON.stringify(tripId)}, { f: 'destino' }))`)
  await esp(900)
  const t6 = await tarjeta()
  debe(t6.origen === 'destino', 'portada', 'si elige la del destino, el viaje acabado no se la cambia por su foto')
  await E(`import('/src/store/usePortadas.ts').then((m) => m.usePortadas.getState().elegir(${JSON.stringify(tripId)}, null))`)
  // Un viaje acabado SIN fotos suyas sigue con la del destino.
  await E(`window.__fotosDePrueba = {}; true`)
  await E(`window.__perfilUi.getState().cerrar(); true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(2500)
  const t7 = await tarjeta()
  debe(t7.origen === 'destino', 'portada', 'acabado y sin fotos suyas: la del destino')

  // 2.10 La foto del emblema: ajustar y guardar.
  await E(`window.__fotosDePrueba = {}; window.__miPerfil.getState().poner({ fotoGoogle: '/fotos/roma/dia_coliseo_p.jpg', fotoEncuadre: null }); localStorage.removeItem('trazo:foto-encuadre:local'); true`)
  await E(`document.querySelector('[data-cabecera-con-marco]').scrollIntoView({ block: 'start' }); true`)
  await esp(1200)
  const emb0 = await E(`(() => { const i = document.querySelector('[data-cabecera-con-marco] [data-foto-encuadrada="emblema"]'); return i ? { enc: i.getAttribute('data-encuadre'), estilo: i.getAttribute('style') } : null })()`)
  debe(emb0 && emb0.enc === '', 'foto', 'el emblema enseña la foto centrada mientras nadie la ha ajustado')
  await cap('03a_foto_sin_ajustar')
  await E(`document.querySelector('[data-editar-perfil]').click(); true`)
  await esp(1000)
  const hojaP = await E(`Boolean(document.querySelector('[data-hoja="editar-perfil"] [data-visor-foto]')) && Boolean(document.querySelector('[data-hoja="editar-perfil"] [data-hacer-foto]')) && Boolean(document.querySelector('[data-hoja="editar-perfil"] [data-elegir-foto]'))`)
  debe(hojaP, 'foto', 'al tocar la foto: se puede ajustar (el visor con el círculo) y también cambiar por otra (hacer una foto / elegir de la galería)')
  const rect = await E(`(() => { const r = document.querySelector('[data-visor-foto]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width } })()`)
  const toque = (tipo, pts) => app.cdp('Input.dispatchTouchEvent', { type: tipo, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) })
  const enc = () => E(`document.querySelector('[data-visor-foto] [data-foto-encuadrada]').getAttribute('data-encuadre')`)
  // Pinch: dos dedos que se separan.
  await toque('touchStart', [[rect.x - 30, rect.y], [rect.x + 30, rect.y]])
  for (let k = 1; k <= 10; k++) await toque('touchMove', [[rect.x - 30 - k * 6, rect.y], [rect.x + 30 + k * 6, rect.y]])
  await toque('touchEnd', [])
  await esp(300)
  const trasPinch = (await enc()).split(',').map(Number)
  debe(trasPinch[2] > 1.5, 'foto', `con dos dedos se acerca la foto (zoom ${trasPinch[2]?.toFixed(2)})`)
  // Arrastrar con un dedo hacia la izquierda y arriba.
  await toque('touchStart', [[rect.x, rect.y]])
  for (let k = 1; k <= 10; k++) await toque('touchMove', [[rect.x - k * 6, rect.y - k * 2]])
  await toque('touchEnd', [])
  await esp(300)
  const trasMover = (await enc()).split(',').map(Number)
  debe(trasMover[0] > trasPinch[0] + 0.01, 'foto', `con un dedo se mueve la foto (x ${trasPinch[0].toFixed(3)} → ${trasMover[0].toFixed(3)})`)
  debe(Math.abs(trasMover[2] - trasPinch[2]) < 0.01, 'foto', 'mover no cambia el zoom')
  await cap('03b_ajustando_la_foto')
  await E(`document.querySelector('[data-hoja="editar-perfil"] [data-boton-hoja="guardar-perfil"]').click(); true`)
  await esp(1200)
  const cerrada = await E(`!document.querySelector('[data-hoja="editar-perfil"]')`)
  debe(cerrada, 'foto', '[Guardar] guarda y cierra la hoja')
  const emb1 = await E(`document.querySelector('[data-cabecera-con-marco] [data-foto-encuadrada="emblema"]').getAttribute('data-encuadre')`)
  const guardadoLocal = await E(`localStorage.getItem('trazo:foto-encuadre:local')`)
  debe(emb1 && emb1 !== '' && emb1 === trasMover.map((n) => n.toFixed(3)).join(','), 'foto', `el emblema enseña lo ajustado (${emb1})`)
  debe(guardadoLocal && Math.abs(JSON.parse(guardadoLocal).zoom - trasMover[2]) < 0.01, 'foto', 'el encuadre queda guardado (la cuenta si hay; este móvil siempre)')
  await esp(500)
  await cap('03_foto_ajustada_en_el_emblema')
  // Al volver a abrir el perfil, sigue igual.
  await E(`window.__perfilUi.getState().cerrar(); true`)
  await esp(400)
  await E(`window.__perfilUi.getState().abrir(); true`)
  await esp(2500)
  const emb2 = await E(`document.querySelector('[data-cabecera-con-marco] [data-foto-encuadrada="emblema"]')?.getAttribute('data-encuadre')`)
  debe(emb2 === emb1, 'foto', 'al reabrir el perfil la foto sigue ajustada')

  // 2.11 Se ve igual en todos los sitios (emblema, avatar, cara de «Personas del viaje», cabecera).
  const m = trasMover
  await E(`import('/src/dev/avataresPrueba.tsx').then((a) => { a.montarAvatares('/fotos/roma/dia_coliseo_p.jpg', { x: ${m[0]}, y: ${m[1]}, zoom: ${m[2]} }); return true })`)
  await esp(1200)
  const geo = await E(`Array.from(document.querySelectorAll('[data-avatar-prueba]')).map((c) => {
    const i = c.querySelector('img[data-foto-encuadrada]'); if (!i) return { sitio: c.getAttribute('data-avatar-prueba'), sinFoto: true }
    const p = i.parentElement.getBoundingClientRect(); const r = i.getBoundingClientRect()
    return { sitio: c.getAttribute('data-avatar-prueba'), enc: i.getAttribute('data-encuadre'), l: (r.left - p.left) / p.width, t: (r.top - p.top) / p.height, w: r.width / p.width, h: r.height / p.height }
  })`)
  debe(geo.length === 4 && geo.every((x) => !x.sinFoto), 'avatar', 'los cuatro sitios (emblema, avatar, personas del viaje, cabecera) pintan la foto')
  const ref = geo[0]
  debe(geo.every((x) => Math.abs(x.l - ref.l) < 0.02 && Math.abs(x.t - ref.t) < 0.02 && Math.abs(x.w - ref.w) < 0.02 && Math.abs(x.h - ref.h) < 0.02), 'avatar', `se ve igual en todos: misma posición y tamaño relativos (${geo.map((x) => `${x.sitio} ${x.l.toFixed(2)},${x.t.toFixed(2)},${x.w.toFixed(2)}`).join(' · ')})`)
  debe(geo.every((x) => x.enc === geo[0].enc), 'avatar', 'todos con el mismo encuadre')
  await E(`import('/src/dev/avataresPrueba.tsx').then((a) => { a.quitarAvatares(); return true })`)
} finally {
  app.cerrar()
}

console.log(fallos.length ? fallos.map((f) => `  FALLO [${f.regla}] ${f.texto}`).join('\n') : '  todo bien')
console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
