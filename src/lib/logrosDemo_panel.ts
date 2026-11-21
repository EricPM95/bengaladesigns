/**
 * El servidor de mentira del PANEL DE JUTRIP (V33, rehecho en la V35A; SOLO desarrollo, `?logrosDemo=1`): contesta lo mismo que `server/panel/` (misma forma) con datos INVENTADOS (nada de nadie): Inicio, Ventas, Destinos pedidos y
 * Reportes (lista, detalle y responder), todo con el periodo elegido (`?periodo=7d|mes|30d|6m|anio|todo|custom&desde=&hasta=`). Usuarios y Logros tienen su propia demo (`logrosDemo_panelUsuarios.ts`, `logrosDemo_panelLogros.ts`).
 * `window.__demoPanel` deja cambiar quién es administrador y si hay clave de correo, y apunta lo que el panel ha pedido.
 */
const HOY = '2026-11-20'
// (V35B) `sessionStorage['trazo:demo-sin-0091'] = '1'`: la demo contesta como el servidor SIN la migración 0091 (lo nuevo, «Pronto»).
const sinLa0091 = (): boolean => { try { return window.sessionStorage.getItem('trazo:demo-sin-0091') === '1' } catch { return false } }
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const corto = (d: string) => `${Number(d.slice(8, 10))} ${MESES[Number(d.slice(5, 7)) - 1]}`
const sumar = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10)
const entre = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5)

interface ProximamenteDemo {
  clave: string
  destino: string
  iso: string
  publicado: boolean
  avisos: number
}
export const demoPanel: { admin: boolean; correo: boolean; avisados: Record<string, string[]>; respuestas: { id: string; texto: string; correo: string; hecho: boolean }[]; pedidos: string[]; estados: Record<string, string>; sin0091: boolean; proximamente: ProximamenteDemo[]; pruebas: string[] } = {
  // Con `sessionStorage['trazo:demo-no-admin'] = '1'` contesta como una cuenta que NO es de administrador: el servidor de verdad daría 403.
  admin: typeof window === 'undefined' ? true : (() => { try { return window.sessionStorage.getItem('trazo:demo-no-admin') !== '1' } catch { return true } })(),
  correo: false,
  avisados: {},
  respuestas: [],
  pedidos: [],
  estados: {},
  // (V35B) Con `sessionStorage['trazo:demo-sin-0091'] = '1'` contesta como el servidor SIN la migración 0091 (los botones nuevos salen apagados con «Pronto»).
  sin0091: typeof window === 'undefined' ? false : (() => { try { return window.sessionStorage.getItem('trazo:demo-sin-0091') === '1' } catch { return false } })(),
  proximamente: [
    { clave: 'florencia', destino: 'Florencia', iso: 'it', publicado: true, avisos: 143 },
    { clave: 'berlin', destino: 'Berlín', iso: 'de', publicado: false, avisos: 98 },
    { clave: 'cartagena_de_indias', destino: 'Cartagena de Indias', iso: 'co', publicado: false, avisos: 0 },
  ],
  pruebas: ['pruebas1@demo.test'],
}
if (typeof window !== 'undefined') (window as unknown as { __demoPanel: typeof demoPanel }).__demoPanel = demoPanel

/** El rango de un periodo (igual que `server/panel/periodo.js`). */
function rango(p: string, desde: string, hasta: string): { desde: string; hasta: string; etiqueta: string; titulo: string; periodo: string } {
  const mes = `${HOY.slice(0, 7)}-01`
  if (p === 'custom' && desde && hasta) return { periodo: 'custom', desde, hasta, etiqueta: `${corto(desde)} – ${corto(hasta)}`, titulo: `${corto(desde)} – ${corto(hasta)}` }
  if (p === '7d') return { periodo: p, desde: sumar(HOY, -6), hasta: HOY, etiqueta: 'Últimos 7 días', titulo: 'últimos 7 días' }
  if (p === '30d') return { periodo: p, desde: sumar(HOY, -29), hasta: HOY, etiqueta: 'Últimos 30 días', titulo: 'últimos 30 días' }
  if (p === '6m') return { periodo: p, desde: '2026-06-01', hasta: HOY, etiqueta: 'Últimos 6 meses', titulo: 'últimos 6 meses' }
  if (p === 'anio') return { periodo: p, desde: '2026-01-01', hasta: HOY, etiqueta: 'Este año', titulo: 'este año' }
  if (p === 'todo') return { periodo: p, desde: '2026-01-01', hasta: HOY, etiqueta: 'Todo', titulo: 'todo el tiempo' }
  return { periodo: 'mes', desde: mes, hasta: HOY, etiqueta: 'Este mes', titulo: 'este mes' }
}
/** Los pases de cada día (inventados, siempre los mismos para el mismo día). */
const pasesDelDia = (d: string) => (Number(d.slice(8, 10)) * 7 + Number(d.slice(5, 7))) % 6
function serie(r: { desde: string; hasta: string }): { tipo: 'dia' | 'semana'; cubetas: { clave: string; etiqueta: string; pases: number }[] } {
  const n = entre(r.desde, r.hasta) + 1
  if (n <= 62) return { tipo: 'dia', cubetas: Array.from({ length: n }, (_, i) => { const d = sumar(r.desde, i); return { clave: d, etiqueta: corto(d), pases: pasesDelDia(d) } }) }
  const cubetas: { clave: string; etiqueta: string; pases: number }[] = []
  for (let d = r.desde; d <= r.hasta; d = sumar(d, 7)) cubetas.push({ clave: d, etiqueta: corto(d), pases: Array.from({ length: 7 }, (_, i) => pasesDelDia(sumar(d, i))).reduce((a, b) => a + b, 0) })
  return { tipo: 'semana', cubetas }
}

const COMPRAS = [
  { fecha: '2026-11-20T10:00:00Z', destino: 'Roma', tipo: 'duo', personas: 2, persona: { id: 'u001', nombre: 'Laura García' }, estado: 'comprado', importe_cent: 1099, moneda: 'eur' },
  { fecha: '2026-11-20T08:00:00Z', destino: 'Lanzarote', tipo: 'uno', personas: 1, persona: { id: 'u002', nombre: 'Jordi Vila' }, estado: 'comprado', importe_cent: 699, moneda: 'eur' },
  { fecha: '2026-11-19T10:00:00Z', destino: 'Roma', tipo: 'grupo', personas: 4, persona: { id: 'u003', nombre: 'Marc Puig' }, estado: 'comprado', importe_cent: 1996, moneda: 'eur' },
  { fecha: '2026-11-19T09:00:00Z', destino: 'Barcelona', tipo: 'uno', personas: 1, persona: { id: 'u004', nombre: 'Ana Ruiz' }, estado: 'reembolsado', importe_cent: 699, moneda: 'eur' },
  { fecha: '2026-11-18T10:00:00Z', destino: 'Roma', tipo: 'uno', personas: 1, persona: { id: 'u005', nombre: 'Elena Castro' }, estado: 'regalado', importe_cent: 0, moneda: 'eur' },
  { fecha: '2026-11-18T09:00:00Z', destino: 'Lanzarote', tipo: 'duo', personas: 2, persona: null, estado: 'comprado', importe_cent: 1099, moneda: 'eur' },
]

const REPORTES = [
  { id: 'a1', tipo: 'dato_mal', estado: 'visto', titulo: 'Coliseo · Horario', destino: 'Roma', quien: { id: 'u001', nombre: 'Eric Peña', email: 'eric@demo.test' }, texto: 'Cierra a las 17:00', mins: 60 },
  { id: 'a2', tipo: 'foto', estado: 'nuevo', titulo: 'Panteón · Foto', destino: 'Roma', quien: null, texto: 'Panteón · Foto: Laura G.', mins: 120 },
  { id: 'a3', tipo: 'restaurante', estado: 'nuevo', titulo: 'Trattoria da Enzo', destino: 'Roma', quien: { id: 'u003', nombre: 'Marc Puig', email: 'marc@demo.test' }, texto: 'Trattoria da Enzo', mins: 180 },
  { id: 'a4', tipo: 'no_funciona', estado: 'nuevo', titulo: 'No me deja pagar el pase', destino: null, quien: { id: 'u004', nombre: 'Ana Ruiz', email: 'ana@demo.test' }, texto: 'No me deja pagar el pase', mins: 300 },
  { id: 'a5', tipo: 'idea', estado: 'hecho', titulo: 'Modo oscuro en HOY', destino: null, quien: { id: 'u001', nombre: 'Laura García', email: 'laura@demo.test' }, texto: 'Modo oscuro en HOY', mins: 1440 },
  { id: 'a6', tipo: 'lugar', estado: 'descartado', titulo: 'Mirador de Guinate', destino: 'Lanzarote', quien: { id: 'u005', nombre: 'Elena Castro', email: 'elena@demo.test' }, texto: 'Mirador de Guinate', mins: 1500 },
]
const ahora = Date.parse(`${HOY}T12:00:00Z`)

export function responder(ruta: string, url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (!ruta.startsWith('/api/admin/')) return undefined
  const metodo = opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET')
  // Cambiar el estado de un reporte (Visto · Hecho · Descartar): lo apunta para que la lista y el detalle digan el mismo estado.
  const cambio = /^\/api\/admin\/avisos-viajeros\/([^/]+)$/.exec(ruta)
  if (cambio && metodo === 'PATCH' && REPORTES.some((x) => x.id === cambio[1])) {
    if (!demoPanel.admin) return null
    demoPanel.estados[cambio[1]] = String((c as { estado?: string }).estado ?? 'visto')
    return { ok: true, avisado: false }
  }
  // Las rutas de siempre (Avisos de viajeros) las contesta su propia demo; aquí solo lo del panel (y el 403 de quien no es administrador).
  const nuevas = /^\/api\/admin\/(inicio|ventas|destinos|reportes|cuentas-de-prueba)/.test(ruta)
  if (!nuevas) return undefined
  demoPanel.pedidos.push(`${metodo} ${ruta}${url.search}`)
  if (!demoPanel.admin) return null
  const r = rango(url.searchParams.get('periodo') ?? 'mes', url.searchParams.get('desde') ?? '', url.searchParams.get('hasta') ?? '')
  const infoPeriodo = { periodo: r.periodo, desde: r.desde, hasta: r.hasta, etiqueta: r.etiqueta, titulo: r.titulo }
  const nuevos = REPORTES.filter((x) => (demoPanel.estados[x.id] ?? x.estado) === 'nuevo').length
  if (ruta === '/api/admin/inicio') {
    if (url.searchParams.get('resumen') === '1') return { ok: true, reportes_nuevos: nuevos, fotos_por_aprobar: 12 }
    const s = serie(r)
    return {
      ok: true,
      periodo: infoPeriodo,
      hoy: HOY,
      reportes_nuevos: nuevos,
      fotos_por_aprobar: 12,
      pases: { hoy: 1, mes: 9 },
      ingresos: { hoy_cent: 1099, mes_cent: 8400, moneda: 'eur' },
      // (V35B) Con «Sin cuentas de prueba» apagado cuenta una más (la de pruebas).
      sin_pruebas: url.searchParams.get('sin_pruebas') !== '0',
      usuarios: { total: 3 + (url.searchParams.get('sin_pruebas') === '0' ? 1 : 0), hoy: 1, semana: 1, con_viaje: 2, pct_con_viaje: 67 },
      serie: { ...s, total: s.cubetas.reduce((a, b) => a + b.pases, 0) },
      atencion: [
        { tipo: 'fallo', titulo: 'Algo no funciona: No me deja pagar el pase', en: new Date(ahora - 36e5).toISOString() },
        { tipo: 'reporte', titulo: 'Un dato está mal: Coliseo', en: new Date(ahora - 2 * 36e5).toISOString() },
        { tipo: 'venta', titulo: 'Pase Lanzarote · Dúo', en: new Date(ahora - 24 * 36e5).toISOString() },
        { tipo: 'venta', titulo: 'Pase Roma · Individual', en: '2026-10-19T10:00:00Z' },
      ],
      primera_vez: {
        contestaron: 3,
        bloques: [
          { id: 'frecuencia', titulo: '¿Cada cuánto viajan?', total: 3, opciones: [{ valor: 'dos_o_tres', nombre: '2 o 3 veces al año', n: 2, pct: 67 }, { valor: 'cuatro_o_mas', nombre: '4 o más', n: 1, pct: 33 }] },
          { id: 'compania', titulo: '¿Con quién viajan?', total: 3, opciones: [{ valor: 'pareja', nombre: 'En pareja', n: 2, pct: 67 }, { valor: 'amigos', nombre: 'Con amigos', n: 1, pct: 33 }] },
          { id: 'edad', titulo: 'Edad por tramos', total: 3, opciones: [{ valor: '30_44', nombre: '30 – 44', n: 2, pct: 67 }, { valor: '18_29', nombre: '18 – 29', n: 1, pct: 33 }] },
        ],
      },
      desde_donde: { paises: [{ iso: 'es', n: 2 }, { iso: 'mx', n: 1 }], ciudades: [{ nombre: 'Barcelona', iso: 'es', n: 2 }, { nombre: 'Madrid', iso: 'es', n: 1 }, { nombre: 'Ciudad de México', iso: 'mx', n: 1 }] },
      donde_viven: sinLa0091() ? null : { total: 3, paises: [{ iso: 'es', nombre: 'España', n: 2, pct: 67 }, { iso: 'mx', nombre: 'México', n: 1, pct: 33 }] },
      correo: { activo: demoPanel.correo },
    }
  }
  if (ruta === '/api/admin/ventas') {
    const s = serie(r)
    const total = s.cubetas.reduce((a, b) => a + b.pases, 0)
    return {
      ok: true,
      periodo: infoPeriodo,
      hoy: HOY,
      moneda: 'eur',
      pases: { periodo: total, hoy: 1 },
      ingresos_cent: total * 750,
      // (V35B) «Lo que te queda» = ingresos − comisión de Stripe − devoluciones (sin la 0091, la comisión es null → «pronto»).
      devoluciones_cent: 699,
      te_queda: demoPanel.sin0091 ? { cent: total * 750 - 699, comision_cent: null, devoluciones_cent: 699, antes_de_impuestos: true } : { cent: total * 750 - total * 36 - 699, comision_cent: total * 36, devoluciones_cent: 699, antes_de_impuestos: true },
      conversion: { pct: 50, compraron: 1, viajeros: 2 },
      por_dia: s,
      por_destino: [{ destino: 'Roma', n: Math.ceil(total / 2), importe_cent: Math.ceil(total / 2) * 750 }, { destino: 'Lanzarote', n: Math.floor(total / 2), importe_cent: Math.floor(total / 2) * 750 }].filter((d) => d.n > 0),
      compras: COMPRAS,
      total_compras: COMPRAS.length,
      afiliados: demoPanel.sin0091
        ? { clics: null, enlaces: { civitatis: 'https://www.civitatis.com/es/afiliados/', stay22: 'https://www.stay22.com/dashboard' } }
        : { clics: 41, por_destino: [{ destino: 'Roma', actividad: 24, hotel: 11 }, { destino: 'Lanzarote', actividad: 6, hotel: 0 }], por_proveedor: { civitatis: 30, stay22: 11 }, enlaces: { civitatis: 'https://www.civitatis.com/es/afiliados/', stay22: 'https://www.stay22.com/dashboard' } },
    }
  }
  if (ruta === '/api/admin/destinos')
    return {
      ok: true,
      periodo: infoPeriodo,
      pedidos: [
        { destino: 'Lisboa', veces: 214, quieren_aviso: 201, avisados: 201, ultimo_aviso: '2026-11-12T10:00:00Z', proximamente: false, lanzado: true },
        { destino: 'Berlín', veces: 166, quieren_aviso: 150, avisados: 0, ultimo_aviso: null, proximamente: true },
        { destino: 'Cartagena de Indias', veces: 137, quieren_aviso: 0, avisados: 0, ultimo_aviso: null, proximamente: true },
        { destino: 'Ámsterdam', veces: 112, quieren_aviso: 98, avisados: 0, ultimo_aviso: null, proximamente: false },
        { destino: 'Tokio', veces: 66, quieren_aviso: 0, avisados: 0, ultimo_aviso: null, proximamente: false },
      ].map((x) => ({ ...x, proximamente: demoPanel.proximamente.some((p) => p.destino === x.destino) && !x.lanzado })),
      // (V35B) `puede_editar`: false = falta la 0091 (botones apagados con «Pronto»). Un destino nunca sale a la vez en «Los más pedidos» y en Próximamente.
      puede_editar: !demoPanel.sin0091,
      proximamente: demoPanel.proximamente.map((p) => ({ clave: p.clave, destino: p.destino, iso: p.iso, publicado: p.publicado, avisos: p.avisos, avisados: (demoPanel.avisados[p.destino] ?? []).length })),
      correo: { activo: demoPanel.correo },
    }
  if (ruta === '/api/admin/destinos/proximamente' && metodo === 'POST') {
    if (demoPanel.sin0091) return { ok: false, pronto: true, error: 'Falta aplicar la migración 0091 en Supabase.' }
    const nombre = String((c as { destino?: string }).destino ?? '').trim()
    if (!nombre || demoPanel.proximamente.some((p) => p.destino === nombre)) return { ok: false, error: `${nombre} ya está en Próximamente.` }
    demoPanel.proximamente.push({ clave: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_'), destino: nombre, iso: '', publicado: false, avisos: 0 })
    return { ok: true, destino: { nombre }, con_pin: true }
  }
  if (ruta === '/api/admin/destinos/proximamente/quitar' && metodo === 'POST') {
    if (demoPanel.sin0091) return { ok: false, pronto: true }
    demoPanel.proximamente = demoPanel.proximamente.filter((p) => p.clave !== String((c as { clave?: string }).clave ?? ''))
    return { ok: true }
  }
  if (ruta === '/api/admin/cuentas-de-prueba') {
    if (metodo === 'POST') {
      if (demoPanel.sin0091) return { ok: false, pronto: true }
      const e = String((c as { email?: string }).email ?? '').trim().toLowerCase()
      demoPanel.pruebas = (c as { marcar?: boolean }).marcar === false ? demoPanel.pruebas.filter((x) => x !== e) : [...new Set([...demoPanel.pruebas, e])]
      return { ok: true }
    }
    return { ok: true, disponible: !demoPanel.sin0091, cuentas: demoPanel.sin0091 ? [] : demoPanel.pruebas.map((email) => ({ email, marcado_en: '2026-11-21T09:00:00Z' })), administradores: ['admin@demo.test'] }
  }
  if (ruta === '/api/admin/destinos/ya-disponible' && metodo === 'POST') {
    const destino = String(c.destino ?? '')
    const personas = Array.from({ length: destino === 'Florencia' ? 143 : 0 }, (_, i) => `p${i}`)
    const ya = demoPanel.avisados[destino] ?? []
    const nuevosAvisados = personas.filter((p) => !ya.includes(p))
    demoPanel.avisados[destino] = [...ya, ...nuevosAvisados]
    return { ok: true, campana: nuevosAvisados.length, correos: demoPanel.correo ? nuevosAvisados.length : 0, ya_avisados: ya.length, correo: demoPanel.correo ? 'activo' : 'sin_clave' }
  }
  if (ruta === '/api/admin/reportes') {
    const tipo = url.searchParams.get('tipo') ?? ''
    const estado = url.searchParams.get('estado') ?? ''
    const items = REPORTES.filter((x) => (!tipo || x.tipo === tipo) && (!estado || (demoPanel.estados[x.id] ?? x.estado) === estado)).map((x) => ({
      id: x.id, creado: new Date(ahora - x.mins * 6e4).toISOString(), tipo: x.tipo, estado: demoPanel.estados[x.id] ?? x.estado, titulo: x.titulo, destino: x.destino, con_cuenta: Boolean(x.quien), quien: x.quien,
    }))
    return { ok: true, nuevos, items }
  }
  const detalle = /^\/api\/admin\/reportes\/([^/]+)$/.exec(ruta)
  if (detalle && metodo === 'GET') {
    const x = REPORTES.find((y) => y.id === detalle[1])
    if (!x) return null
    const estado = demoPanel.estados[x.id] ?? x.estado
    const dato = x.tipo === 'dato_mal'
    return {
      ok: true,
      reporte: { id: x.id, creado: new Date(ahora - x.mins * 6e4).toISOString(), tipo: x.tipo, estado, titulo: x.titulo, destino: x.destino, con_cuenta: Boolean(x.quien), avisame: Boolean(x.quien), texto: dato ? 'Cierra a las 17:00' : x.texto, fotos_urls: [], captura_url: null },
      quien: x.quien,
      contexto: [
        { l: 'Desde dónde', v: 'Desde DÍAS de su viaje «Roma 26–29 nov»' },
        { l: 'Aparato', v: 'iPhone · Safari 17' },
        { l: '¿Quiere respuesta?', v: x.quien ? 'Sí' : 'No' },
      ],
      tecnico: { version_app: '947e7f58', pantalla: 'route', pestana: 'dias' },
      sitio: dato ? { nombre: 'Coliseo', id: 'coliseo', destino: 'roma' } : null,
      en_la_app: dato ? { etiqueta: 'Horario en la app', valor: '08:30–16:30' } : null,
      dice_el_viajero: dato ? 'Cierra a las 17:00' : null,
      historial: [
        { quien: 'viajero', cuando: new Date(ahora - x.mins * 6e4).toISOString(), texto: dato ? 'Cierra a las 17:00' : x.texto },
        ...demoPanel.respuestas.filter((rp) => rp.id === x.id).map((rp) => ({ quien: 'tu' as const, cuando: new Date(ahora).toISOString(), texto: rp.texto })),
      ],
      se_puede_responder: Boolean(x.quien),
    }
  }
  const resp = /^\/api\/admin\/reportes\/([^/]+)\/responder$/.exec(ruta)
  if (resp && metodo === 'POST') {
    const texto = String(c.texto ?? '').trim()
    if (texto.length < 2 || texto.length > 300) return null
    const x = REPORTES.find((y) => y.id === resp[1])
    // Solo con cuenta Y «avísame» hay correo (y solo con la clave puesta).
    const correo = !x?.quien ? 'sin_cuenta' : demoPanel.correo ? 'enviado' : 'sin_clave'
    demoPanel.respuestas.push({ id: resp[1], texto, correo, hecho: c.hecho === true })
    if (c.hecho === true) demoPanel.estados[resp[1]] = 'hecho'
    else if ((demoPanel.estados[resp[1]] ?? x?.estado) === 'nuevo') demoPanel.estados[resp[1]] = 'visto'
    return { ok: true, campana: true, correo, estado: demoPanel.estados[resp[1]] ?? x?.estado ?? null }
  }
  return undefined
}
