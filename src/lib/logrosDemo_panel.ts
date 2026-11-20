/**
 * El servidor de mentira del PANEL DE JUTRIP (V33; SOLO desarrollo, `?logrosDemo=1`): contesta lo mismo que `server/panel/` (misma forma), con 120 usuarios inventados (nada de nadie), para probar el panel sin Supabase ni correos.
 * `window.__demoPanel` deja cambiar quién es administrador y si hay clave de correo, y apunta lo que el panel ha pedido.
 */
const FRECUENCIAS = ['una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas']
const COMPANIAS = ['a_mi_aire', 'pareja', 'familia', 'amigos']
const DESTINOS = ['Roma', 'Lanzarote', 'Barcelona']
const HOY = Date.UTC(2026, 10, 20, 12)

interface Usuario {
  id: string
  nombre: string
  email: string
  alta: string
  ultimo_acceso: string
  nivel: number
  pase: { tiene: boolean; destinos: { destino: string; tipo: string }[] }
  viajes: { creados: number; hechos: number }
  gastado_cent: number
  moneda: string
  primera_vez: { frecuencia: string | null; compania: string | null; anio_nacimiento: number | null } | null
}

const NOMBRES = ['Laura García', 'Marc Puig', 'Ana Ruiz', 'Pablo Martín', 'Sofía López', 'Elena Costa', 'Jordi Vila', 'Carmen Gil', 'Luis Mora', 'Nuria Sanz']
const usuarios: Usuario[] = Array.from({ length: 120 }, (_, i) => {
  const nombre = i === 0 ? 'Laura García' : `${NOMBRES[i % NOMBRES.length].split(' ')[0]} Prueba${i}`
  const pasePor = i % 3 === 0
  const destinos = pasePor ? [{ destino: DESTINOS[i % 3], tipo: i % 2 ? 'Dúo' : 'Individual' }] : []
  const respondio = i % 4 !== 3
  return {
    id: `u${String(i).padStart(3, '0')}`,
    nombre,
    email: `${nombre.toLowerCase().replace(/[^a-z]/g, '.')}${i}@demo.test`,
    alta: new Date(HOY - (i + 1) * 36e5 * 20).toISOString(),
    ultimo_acceso: new Date(HOY - (i * 7 + 1) * 36e5).toISOString(),
    nivel: i % 9,
    pase: { tiene: pasePor, destinos },
    viajes: { creados: i % 6, hechos: Math.max(0, (i % 6) - 1) },
    gastado_cent: pasePor ? (i % 2 ? 1099 : 699) : 0,
    moneda: 'EUR',
    primera_vez: respondio ? { frecuencia: FRECUENCIAS[i % 3], compania: COMPANIAS[i % 4], anio_nacimiento: i % 5 === 0 ? null : 1960 + (i % 40) } : null,
  }
})

export const demoPanel: { admin: boolean; correo: boolean; avisados: Record<string, string[]>; respuestas: { id: string; texto: string; correo: string }[]; pedidos: string[]; borrar?: never } = {
  // Con `sessionStorage['trazo:demo-no-admin'] = '1'` (como en lo de «Empezar de cero») contesta como una cuenta que NO es de administrador: el servidor de verdad daría 403.
  admin: typeof window === 'undefined' ? true : (() => { try { return window.sessionStorage.getItem('trazo:demo-no-admin') !== '1' } catch { return true } })(),
  correo: false,
  avisados: {},
  respuestas: [],
  pedidos: [],
}
if (typeof window !== 'undefined') (window as unknown as { __demoPanel: typeof demoPanel }).__demoPanel = demoPanel

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

function lista(url: URL): unknown {
  const q = sinTildes(url.searchParams.get('q') ?? '')
  const pase = url.searchParams.get('pase')
  const destino = sinTildes(url.searchParams.get('destino') ?? '')
  const frecuencia = url.searchParams.get('frecuencia')
  const compania = url.searchParams.get('compania')
  const orden = url.searchParams.get('orden') ?? 'reciente'
  let r = usuarios.filter((u) => (!q || sinTildes(`${u.nombre} ${u.email}`).includes(q)) && (pase !== 'si' || u.pase.tiene) && (pase !== 'no' || !u.pase.tiene) && (!destino || u.pase.destinos.some((d) => sinTildes(d.destino).includes(destino))) && (!frecuencia || u.primera_vez?.frecuencia === frecuencia) && (!compania || u.primera_vez?.compania === compania))
  const clave: Record<string, (u: Usuario) => number> = { reciente: (u) => -Date.parse(u.alta), acceso: (u) => -Date.parse(u.ultimo_acceso), viajes: (u) => -u.viajes.creados, gastado: (u) => -u.gastado_cent }
  r = [...r].sort((a, b) => (clave[orden] ?? clave.reciente)(a) - (clave[orden] ?? clave.reciente)(b) || a.id.localeCompare(b.id))
  const pagina = Math.max(1, Number(url.searchParams.get('pagina')) || 1)
  return { ok: true, pagina, por_pagina: 50, total: r.length, usuarios: r.slice((pagina - 1) * 50, pagina * 50) }
}

function totales(): unknown {
  const con = usuarios.filter((u) => u.primera_vez)
  const reparto = (valores: (string | null)[], etiquetas: string[]) => {
    const dados = valores.filter(Boolean)
    return etiquetas.map((v) => ({ valor: v, n: dados.filter((x) => x === v).length, pct: pct(dados.filter((x) => x === v).length, dados.length) }))
  }
  const edades = con.map((u) => u.primera_vez?.anio_nacimiento).filter((a): a is number => Boolean(a)).map((a) => 2026 - a)
  const tramos: [string, (e: number) => boolean][] = [['Menos de 18', (e) => e < 18], ['18 – 29', (e) => e >= 18 && e <= 29], ['30 – 44', (e) => e >= 30 && e <= 44], ['45 – 59', (e) => e >= 45 && e <= 59], ['60 o más', (e) => e >= 60]]
  return {
    ok: true,
    total: usuarios.length,
    con_viaje: usuarios.filter((u) => u.viajes.creados > 0).length,
    nuevos_semana: usuarios.filter((u) => HOY - Date.parse(u.alta) < 7 * 864e5).length,
    contestaron: con.length,
    respuestas: {
      frecuencia: reparto(con.map((u) => u.primera_vez?.frecuencia ?? null), FRECUENCIAS),
      compania: reparto(con.map((u) => u.primera_vez?.compania ?? null), COMPANIAS),
      edad: tramos.map(([tramo, f]) => ({ tramo, n: edades.filter(f).length, pct: pct(edades.filter(f).length, edades.length) })),
    },
  }
}

export function responder(ruta: string, url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (!ruta.startsWith('/api/admin/')) return undefined
  const metodo = opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET')
  // Las rutas de siempre (Avisos de viajeros) las contesta su propia demo; aquí solo lo nuevo del panel (y el 403 de quien no es administrador).
  const nuevas = /^\/api\/admin\/(inicio|usuarios|ventas|destinos|reportes)/.test(ruta)
  if (!nuevas) return undefined
  demoPanel.pedidos.push(`${metodo} ${ruta}`)
  if (!demoPanel.admin) return null
  if (ruta === '/api/admin/inicio')
    return {
      ok: true,
      reportes_nuevos: 7,
      fotos_por_aprobar: 12,
      pases: { hoy: 9, mes: 142 },
      ingresos: { hoy_cent: 9400, mes_cent: 187000, moneda: 'EUR' },
      usuarios: { hoy: 38, semana: 214, total: usuarios.length, con_viaje: usuarios.filter((u) => u.viajes.creados > 0).length },
      serie14: [30, 44, 38, 52, 60, 48, 70, 64, 56, 80, 74, 66, 88, 92].map((pases, i) => ({ dia: new Date(HOY - (13 - i) * 864e5).toISOString().slice(0, 10), pases })),
      atencion: [
        { tipo: 'fallo', titulo: '3 reportes de «Algo no funciona» en las últimas 2 horas', en: new Date(HOY - 36e5).toISOString() },
        { tipo: 'reporte', titulo: 'Coliseo · Horario', en: new Date(HOY - 12 * 6e4).toISOString() },
        { tipo: 'foto', titulo: 'Panteón · Pablo M.', en: new Date(HOY - 36e5).toISOString() },
        { tipo: 'venta', titulo: 'Pase Roma · Dúo · 10,99 €', en: new Date(HOY - 3 * 36e5).toISOString() },
      ],
      correo: { activo: demoPanel.correo },
    }
  if (ruta === '/api/admin/usuarios/totales') return totales()
  if (ruta === '/api/admin/usuarios') return lista(url)
  const ficha = /^\/api\/admin\/usuarios\/([^/]+)$/.exec(ruta)
  if (ficha) {
    const u = usuarios.find((x) => x.id === ficha[1])
    if (!u) return null
    return {
      ok: true,
      usuario: u,
      viajes: [{ destino: 'Roma', inicio: '2026-11-26', fin: '2026-11-29', grupo: 'grupo', miembros: 4 }, { destino: 'Lanzarote', inicio: '2026-11-08', fin: '2026-11-13', grupo: 'solo', miembros: 1 }],
      pases: u.pase.tiene ? [{ fecha: '2026-11-12', destino: u.pase.destinos[0].destino, tipo: u.pase.destinos[0].tipo, importe_cent: u.gastado_cent, moneda: 'EUR' }] : [],
      logros: { sellos: [{ destino: 'roma', nombre: 'Roma', grado: 'oro' }], colecciones: { hechas: 3, total: 11 }, paises: ['Italia'], destinos: ['Roma'] },
      reportes: [{ id: 'r1', tipo: 'dato_mal', titulo: 'Coliseo · Horario', estado: 'hecho', en: '2026-11-19T10:00:00Z' }],
    }
  }
  if (ruta === '/api/admin/ventas')
    return {
      ok: true,
      importes_conocidos: true,
      pases_hoy: 9,
      pases_mes: 142,
      ingresos_mes_cent: 187000,
      moneda: 'EUR',
      por_destino: [{ destino: 'Roma', n: 90 }, { destino: 'Lanzarote', n: 34 }, { destino: 'Barcelona', n: 18 }],
      por_dia: Array.from({ length: 30 }, (_, i) => ({ dia: new Date(HOY - (29 - i) * 864e5).toISOString().slice(0, 10), n: 2 + (i % 7) })),
      compras: [{ fecha: '2026-11-20', destino: 'Roma', tipo: 'Dúo', importe_cent: 1099, moneda: 'EUR' }, { fecha: '2026-11-20', destino: 'Lanzarote', tipo: 'Individual', importe_cent: 699, moneda: 'EUR' }, { fecha: '2026-11-19', destino: 'Roma', tipo: 'Grupo ×4', importe_cent: 1996, moneda: 'EUR' }],
    }
  if (ruta === '/api/admin/destinos')
    return {
      ok: true,
      pedidos: [{ destino: 'Lisboa', veces: 214 }, { destino: 'Berlín', veces: 166 }, { destino: 'Tokio', veces: 66 }],
      proximamente: [{ destino: 'Florencia', avisos: 143, avisados: (demoPanel.avisados.Florencia ?? []).length }, { destino: 'Berlín', avisos: 98, avisados: 0 }, { destino: 'Cartagena de Indias', avisos: 61, avisados: 0 }],
      correo: { activo: demoPanel.correo },
    }
  if (ruta === '/api/admin/destinos/ya-disponible' && metodo === 'POST') {
    const destino = String(c.destino ?? '')
    const personas = Array.from({ length: destino === 'Florencia' ? 143 : 0 }, (_, i) => `p${i}`)
    const ya = demoPanel.avisados[destino] ?? []
    const nuevos = personas.filter((p) => !ya.includes(p))
    demoPanel.avisados[destino] = [...ya, ...nuevos]
    return { ok: true, campana: nuevos.length, correos: demoPanel.correo ? nuevos.length : 0, ya_avisados: ya.length, correo: demoPanel.correo ? 'activo' : 'sin_clave' }
  }
  const resp = /^\/api\/admin\/reportes\/([^/]+)\/responder$/.exec(ruta)
  if (resp && metodo === 'POST') {
    const texto = String(c.texto ?? '').trim()
    if (texto.length < 2 || texto.length > 300) return null
    // Los reportes de la demo (a1 a a5): a1, a4 y a5 los mandó una cuenta con «avísame»; a2 sin cuenta; a3 sin «avísame». Solo con cuenta Y «avísame» hay correo (y solo con la clave puesta).
    const correo = resp[1] === 'a2' ? 'sin_cuenta' : resp[1] === 'a3' ? 'no_avisame' : demoPanel.correo ? 'enviado' : 'sin_clave'
    demoPanel.respuestas.push({ id: resp[1], texto, correo })
    return { ok: true, campana: true, correo }
  }
  return undefined
}
