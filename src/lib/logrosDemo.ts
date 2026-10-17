/**
 * MODO DEMO DE LOS LOGROS (Tanda 8b). SOLO EN DESARROLLO: se carga con `import()` desde `llamar()` y desde `logros.ts` solo si `import.meta.env.DEV` es verdadero, así que
 * en producción ni existe. Se enciende con `?logrosDemo=1` (se recuerda en la pestaña; `?logrosDemo=0` lo apaga). Fuerza los logros, las cuentas y una cuenta de mentira.
 *
 * `llamar()` deja de hablar con el servidor y recibe aquí respuestas guionizadas, con LA FORMA REAL del servidor (server/logros/servicio.js, momentos.js, pase.js).
 * El guion va por el NOMBRE de la parada (en minúsculas y sin tildes), pensado para la ruta rápida de Roma:
 *
 *   fontana de trevi        pedazo con ubicación cerca            (nuevos: suma + suma_sello)
 *   plaza navona / piazza   sin ubicación + aviso                  (hay_pedazo; sin nuevos)
 *   panteon                 lejos + aviso                          (cuenta:false, motivo 'lejos')
 *   basilica de san pedro   Emblema Oculto: pide foto              (al subirla: emblema basilica_san_pedro, frase de suspense, primera_vez)
 *   coliseo                 Emblema Oculto + maravilla al subir la foto (emblema coliseo + maravilla)
 *   foro romano             colección completada + sello que sube (suma, suma_sello, coleccion, sello)
 *   capilla sixtina / museos vaticanos   Emblema Oculto y la línea «foto_dentro» (en la Capilla Sixtina no se pueden hacer fotos…)
 *   cualquier otra          Visto sin nada que ganar → «Guarda un recuerdo»
 *
 * Las fotos: la de la cámara de la app vale; la de la galería vale salvo que se fuerce otra cosa con `__demo.siguienteFoto('no_camara' | 'otra_fecha' | 'otro_sitio' | 'sin_cobertura')`.
 * Atajos en la consola (`window.__demo`): ver `AYUDA` abajo o `__demo.ayuda()`.
 */
import { useLogrosStore } from '../store/useLogrosStore'
import { useRouteStore } from '../store/useRouteStore'
import type { Momento, RespuestaDeHecho } from './logros'

const quitarTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim()

type EstadoPase = 'sin' | 'prueba' | 'con'
const demo = {
  pase: 'con' as EstadoPase,
  hora: null as string | null,
  preguntaHecha: false,
  foto: null as null | 'valida' | 'no_camara' | 'otra_fecha' | 'otro_sitio' | 'sin_cobertura',
  sinCobertura: false,
  /** El número del día de ruta que es «hoy» para «Lo de ayer» (las paradas de los días anteriores quedan pendientes). */
  dia: 1,
  /** Lo que ya se ganó con foto en esta sesión (para no volver a darlo). */
  ganado: new Set<string>(),
  vistos: new Set<string>(),
  /** Lo que el demo ha dado en esta sesión (para el resumen del día: con lo ganado de verdad, no vacío). */
  entregados: [] as Momento[],
}

function viajeActual() {
  const route = useRouteStore.getState().route
  const rango = route?.answers?.dateRange
  return { route, inicio: rango?.start ?? '2026-10-10', fin: rango?.end ?? '2026-10-14' }
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fechaLarga = (f: string) => `${Number(f.slice(8, 10))} de ${MESES[Number(f.slice(5, 7)) - 1]}`
const rangoLargo = (a: string, b: string) => (a === b ? fechaLarga(a) : a.slice(0, 7) === b.slice(0, 7) ? `${Number(a.slice(8, 10))} al ${fechaLarga(b)}` : `${fechaLarga(a)} al ${fechaLarga(b)}`)

interface Guion {
  sitio: string
  nombre: string
  ubic: 'cerca' | 'lejos' | 'sin'
  hay_pedazo: boolean
  hay_emblema: boolean
  foto_dentro?: string | null
  nuevosVisto?: () => Momento[]
  nuevosFoto?: () => Momento[]
}

const suma = (nombre: string, n: number, total: number, sitios: string[], coleccion: string): Momento => ({ tipo: 'suma', cat: 'pedazo', coleccion, destino: 'roma', nombre, n, total, sitios, linea: `${n} de ${total}`, primera_vez: true }) as Momento
const sumaSello = (nombre: string, n: number, total: number, sello: string): Momento => ({ tipo: 'suma_sello', cat: 'pedazo', sello, destino: 'roma', nombre, n, total, linea: `${n} de ${total}`, primera_vez: true }) as Momento
const emblema = (id: string, nombre: string, linea: string, maravilla: string | null = null): Momento =>
  ({ tipo: 'emblema', cat: 'emblema', clave: `roma|emblema|${id}`, id, destino: 'roma', nombre, linea, momento: false, maravilla, primera_vez: true, frase: '¡Eh! Aquí hay algo…', en: new Date().toISOString() }) as Momento

/** Lo que da el Coliseo como PRIMER sitio del viaje (8B3, igual que el servidor): 1 pedazo en cada una de sus 3 colecciones, el sello de Roma que nace en bronce («1 de 8»), país nuevo Italia (el 1.º) y destino nuevo Roma (el 1.º). La Basílica después sería el país 2, Ciudad del Vaticano. */
function primeraVezEnRoma(): Momento[] {
  const en = new Date().toISOString()
  return [
    suma('Los imprescindibles de Roma', 1, 8, ['coliseo'], 'imprescindibles'),
    suma('Las 4 joyas de Roma', 1, 4, ['coliseo'], 'cuatro_joyas'),
    suma('La Roma antigua', 1, 6, ['coliseo'], 'roma_antigua'),
    sumaSello('Roma', 1, 8, 'roma'),
    { tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:bronce', sello: 'roma', destino: 'roma', grado: 'bronce', nombre: 'Primeros pasos en Roma', linea: 'Has visto tu primer imprescindible.', primera_vez: true, en } as Momento,
    { tipo: 'pais', cat: 'pais', clave: 'global|pais|Italia', pais: 'Italia', n: 1, nombre: 'Tu país número 1: Italia', primera_vez: true, en } as Momento,
    { tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: 'global|destino_nuevo|roma', destino: 'roma', n: 1, nombre: 'Tu destino número 1: Roma', primera_vez: true, en } as Momento,
  ]
}

const GUIONES: [RegExp, Guion][] = [
  [/fontana de trevi|trevi/, { sitio: 'fontana_de_trevi', nombre: 'Fontana de Trevi', ubic: 'cerca', hay_pedazo: false, hay_emblema: false, nuevosVisto: () => [suma('Las 4 joyas de Roma', 2, 4, ['fontana_de_trevi'], 'cuatro_joyas'), sumaSello('Roma', 2, 8, 'roma')] }],
  [/plaza navona|piazza navona|navona/, { sitio: 'piazza_navona', nombre: 'Plaza Navona', ubic: 'sin', hay_pedazo: true, hay_emblema: false }],
  [/panteon/, { sitio: 'panteon', nombre: 'Panteón', ubic: 'lejos', hay_pedazo: true, hay_emblema: false }],
  [/basilica de san pedro|san pedro/, { sitio: 'basilica_de_san_pedro', nombre: 'Basílica de San Pedro', ubic: 'cerca', hay_pedazo: false, hay_emblema: true, nuevosFoto: () => [emblema('basilica_san_pedro', 'Sobre la tumba de San Pedro', 'Bajo el altar mayor está, según la tradición, la tumba del apóstol.')] }],
  [/coliseo|colosseo|colosseum/, { sitio: 'coliseo', nombre: 'Coliseo', ubic: 'cerca', hay_pedazo: false, hay_emblema: true, nuevosVisto: () => primeraVezEnRoma(), nuevosFoto: () => [emblema('coliseo', 'Una maravilla del mundo', 'El mayor anfiteatro de la Antigüedad.', 'coliseo'), { tipo: 'maravilla', cat: 'maravilla', clave: 'global|maravilla|coliseo', id: 'coliseo', n: 1, nombre: 'Coliseo', linea: 'Una de las nuevas siete maravillas del mundo.', primera_vez: true, en: new Date().toISOString() } as Momento] }],
  [/foro romano|foro/, { sitio: 'foro_romano_y_palatino', nombre: 'Foro Romano', ubic: 'cerca', hay_pedazo: false, hay_emblema: false, nuevosVisto: () => [
    suma('La Roma antigua', 6, 6, ['foro_romano_y_palatino'], 'roma_antigua'),
    sumaSello('Roma', 4, 8, 'roma'),
    { tipo: 'coleccion', cat: 'coleccion', clave: 'roma|coleccion|roma_antigua', id: 'roma_antigua', destino: 'roma', nombre: 'La Roma antigua', linea: 'Seis piedras que lo empezaron todo', primera_vez: true, en: new Date().toISOString() } as Momento,
    { tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:plata', sello: 'roma', destino: 'roma', grado: 'plata', nombre: 'Roma te atrapa', linea: 'Cuatro imprescindibles vistos: ya eres de aquí.', primera_vez: true, en: new Date().toISOString() } as Momento,
  ] }],
  [/capilla sixtina|museos vaticanos|vaticanos/, { sitio: 'museos_vaticanos_y_capilla_sixtina', nombre: 'Museos Vaticanos', ubic: 'cerca', hay_pedazo: false, hay_emblema: true, foto_dentro: 'En la Capilla Sixtina no se pueden hacer fotos: hazla en cualquier otra sala o en la salida.', nuevosFoto: () => [emblema('museos_vaticanos', 'Bajo la cúpula de Miguel Ángel', 'Tocar el cielo con un dedo.')] }],
]

function guionDe(nombre: string): Guion | null {
  const n = quitarTildes(nombre ?? '')
  return GUIONES.find(([re]) => re.test(n))?.[1] ?? null
}

const PREGUNTA = { texto: 'Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?', opciones: [{ id: 'hoy', texto: 'Hoy' }, { id: 'manana', texto: 'Mañana' }] }

function visto(c: Record<string, unknown>): RespuestaDeHecho {
  const g = guionDe(String(c.nombre ?? ''))
  const nombre = String(c.nombre ?? g?.nombre ?? 'esta parada')
  const base = { sitio_nombre: nombre, hay_pedazo: (g?.hay_pedazo ?? false) && !demo.ganado.has('foto|' + g?.sitio), hay_emblema: (g?.hay_emblema ?? false) && !demo.ganado.has('foto|' + g?.sitio), foto_dentro: g?.foto_dentro ?? null }
  if (demo.pase === 'sin') return { ok: true, cuenta: false, motivo: 'sin_pase', mensaje: null, ubic: 'cerca', ...base, nuevos: [] }
  if (demo.pase === 'prueba' && !demo.preguntaHecha && (demo.hora ?? '') >= '12:00') return { ok: true, cuenta: false, motivo: 'pregunta_medio_dia', pregunta: PREGUNTA, ubic: 'cerca', ...base, nuevos: [] }
  const clave = String(c.stop_id ?? c.nombre)
  if (demo.vistos.has(clave)) return { ok: true, cuenta: true, repetido: true, ubic: g?.ubic ?? 'cerca', ...base, nuevos: [] }
  if (g?.ubic === 'lejos') return { ok: true, cuenta: false, motivo: 'lejos', mensaje: `Parece que no estás en ${nombre}. Tu pedazo te espera allí.`, ubic: 'lejos', ...base, nuevos: [] }
  demo.vistos.add(clave)
  const ubic = g?.ubic ?? 'cerca'
  // Un pedazo ganado al tocar Visto (con ubicación cerca) ya no queda pendiente: «Lo de ayer» y la tira de la parada tienen que decir lo mismo que la hoja.
  if (ubic === 'cerca' && g?.nuevosVisto) demo.ganado.add('pedazo|' + g.sitio)
  return { ok: true, cuenta: true, ubic, aviso: ubic === 'sin' ? 'Activa tu ubicación o haz una foto para ganar tu pedazo.' : null, ...base, sitio: g?.sitio, nuevos: ubic === 'cerca' ? (g?.nuevosVisto?.() ?? []) : [] }
}

function foto(c: Record<string, unknown>): RespuestaDeHecho {
  const g = guionDe(String(c.nombre ?? ''))
  const nombre = String(c.nombre ?? g?.nombre ?? 'esta parada')
  const { inicio, fin } = viajeActual()
  let motivo = demo.foto
  demo.foto = null
  if (!motivo && c.origen === 'galeria' && c.tomada_en) {
    const dia = String(c.tomada_en).slice(0, 10)
    if (dia < inicio || dia > fin) motivo = 'otra_fecha'
  }
  const rango = rangoLargo(inicio, fin)
  if (motivo === 'no_camara') return { ok: true, valida: false, motivo: 'no_camara', mensaje: 'Esta foto no está hecha con una cámara.', nuevos: [] }
  if (motivo === 'otro_sitio') return { ok: true, valida: false, motivo: 'otro_sitio', mensaje: `Esta foto no es de ${nombre}.`, nuevos: [] }
  if (motivo === 'otra_fecha') {
    const [d, h] = rango.includes(' al ') ? rango.split(' al ') : [rango, rango]
    return { ok: true, valida: false, motivo: 'otra_fecha', mensaje: `Esta foto es del 2 de septiembre. Elige una del ${d} al ${h}.`, nuevos: [] }
  }
  const clave = `foto|${g?.sitio ?? c.nombre}`
  const nuevos = demo.ganado.has(clave) ? [] : (g?.nuevosFoto?.() ?? [])
  // La foto en un sitio con pedazo sin ubicación: el pedazo llega con la foto.
  if (!nuevos.length && g?.hay_pedazo && !demo.ganado.has(clave)) nuevos.push(suma('Los imprescindibles de Roma', 3, 8, [g.sitio], 'imprescindibles'), sumaSello('Roma', 3, 8, 'roma'))
  demo.ganado.add(clave)
  return { ok: true, valida: true, cuenta: true, nuevos }
}

/** Los pendientes de «Lo de ayer»: las paradas de los días anteriores a `demo.dia` con guion que aún tienen algo (pedazo o emblema). */
function loDeAyer() {
  const { route, fin } = viajeActual()
  const lista: Record<string, unknown>[] = []
  for (const day of route?.days ?? []) {
    if (day.dayNumber >= demo.dia) continue
    for (const stop of day.stops ?? []) {
      const g = guionDe(stop.name)
      if (!g || demo.ganado.has(`foto|${g.sitio}`)) continue
      const falta = [(g.hay_pedazo || g.nuevosVisto) && !demo.ganado.has('pedazo|' + g.sitio) ? 'pedazo' : null, g.hay_emblema ? 'emblema' : null].filter(Boolean)
      if (falta.length) lista.push({ fecha: viajeActual().inicio, dia: day.dayNumber, sitio: g.sitio, stop_id: stop.id, nombre: stop.name, foto_dentro: g.foto_dentro ?? null, falta })
    }
  }
  const sorpresas = lista.filter((x) => (x.falta as string[]).includes('emblema')).length
  void fin
  return { ok: true, pendientes: lista, sorpresas, pedazos: lista.filter((x) => (x.falta as string[]).includes('pedazo')).length, dias_para_reclamar: null, plazo_pasado: false, texto: sorpresas > 0 ? 'Te espera una sorpresa: sube tu foto' : null }
}

/** Apunta lo que da cada respuesta, para que el resumen del día lo cuente. */
function entregar(r: RespuestaDeHecho): RespuestaDeHecho {
  for (const m of r.nuevos ?? []) if (m.tipo !== 'suma_sello' && !demo.entregados.some((x) => x.clave && x.clave === m.clave && x.tipo === m.tipo && x.nombre === m.nombre)) demo.entregados.push(m)
  return r
}
function porCategoria(): Record<string, number> {
  const cuenta: Record<string, number> = {}
  for (const m of demo.entregados) {
    const cat = String((m as { cat?: string }).cat ?? m.tipo)
    cuenta[cat] = (cuenta[cat] ?? 0) + 1
  }
  return cuenta
}

export async function responder(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 250))
  if (demo.sinCobertura) return null
  const url = new URL(ruta, 'http://demo.local')
  const p = url.pathname
  const c = (opciones.cuerpo ?? {}) as Record<string, unknown>
  if (p === '/api/logros/visto') return entregar(visto(c))
  if (p === '/api/logros/foto') return demo.foto === 'sin_cobertura' ? ((demo.foto = null), null) : entregar(foto(c))
  if (p === '/api/logros/deshacer') {
    demo.vistos.delete(String(c.stop_id ?? c.nombre))
    return { ok: true, quitados: [] }
  }
  if (p === '/api/logros/lo-de-ayer') return loDeAyer()
  if (p === '/api/logros/estado') return { ok: true, sellos: [], colecciones: [], secretos: { encontrados: 0, total: 12 }, pendiente: loDeAyer(), puntito: false, viaje: { id: String(url.searchParams.get('trip_id')), ...viajeActual() } }
  if (p === '/api/logros/ficha') return { ok: true, colecciones: [] }
  if (p === '/api/logros/resumen') return { ok: true, ganado: demo.entregados.map((m) => ({ clave: m.clave ?? `${m.tipo}|${m.nombre}`, logro: m.tipo, escalon: m.id ?? m.coleccion ?? m.sello ?? null, destino: 'roma', en: m.en ?? new Date().toISOString() })), por_categoria: porCategoria(), pendiente: loDeAyer(), texto_viaje: '¡Wow! Tu viaje a Roma fue increíble. Echa un vistazo a todo lo que conseguiste.', texto_viaje_tipo: 'wow' }
  if (p === '/api/pase/estado') return { ok: true, cobro: true, pases: demo.pase === 'con' ? [{ id: 'demo', destino: 'roma', tipo: 'individual' }] : [], prueba: { estado: demo.pase === 'sin' ? 'gastada' : 'pendiente', trip_id: null, fecha: null, motivo: null, ya_usada: demo.pase === 'sin' }, hoy: { puede: demo.pase !== 'sin', motivo: demo.pase === 'con' ? 'con_pase' : demo.pase === 'prueba' ? 'dia_de_prueba' : 'prueba_ya_usada', tarjeta: demo.pase === 'sin' ? 'pase' : null }, precios: {} }
  if (p === '/api/pase/prueba/usar') return { ok: true, acceso: demo.pase !== 'sin', motivo: 'dia_de_prueba', uso: 'como_llegar', tarjeta: demo.pase === 'sin' ? 'pase' : null }
  if (p === '/api/pase/prueba/responder') {
    demo.preguntaHecha = true
    return c.respuesta === 'manana' ? { ok: true, respuesta: 'manana', prueba: { estado: 'pendiente' }, lo_de_hoy: 'Lo de hoy se gana mañana con «Lo de ayer también cuenta», con las fotos de la galería.' } : { ok: true, respuesta: 'hoy', prueba: { estado: 'gastada' }, reenviar_vistos: true }
  }
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Atajos de la consola                                                */
/* ------------------------------------------------------------------ */

const AYUDA = `window.__demo (solo desarrollo):
  lanzar('serieCompleta')      mete en el almacén un momento de CADA tipo, en el orden del servidor
  lanzar('emblema'|'coleccion'|'sello'|'maravilla'|'pais'|'viajero'...)   un solo tipo
  estadoPase('sin'|'prueba'|'con')   el estado del pase; con 'prueba' y hora >= 12:00 sale la pregunta de las 12:00 una vez
  hora('13:00')                la hora que cuenta para la pregunta de las 12:00 (null = la de verdad)
  hoy('2026-11-04')            finge otro día de hoy (para el plazo de 30 días: «Te quedan 9 días para reclamar tu premio»)
  dia(n)                       el día de ruta que es «hoy» para «Lo de ayer» (por defecto 1: nada pendiente)
  siguienteFoto('no_camara'|'otra_fecha'|'otro_sitio'|'sin_cobertura')   fuerza el resultado de la próxima foto
  sinCobertura(true|false)     el servidor «no contesta»: todo va a la cola
  reiniciar()                  borra lo ganado y lo visto del demo, la cola y las marcas de «primera vez»
  estado()                     lo que sabe el demo`

export function momentosDeSerie(): Momento[] {
  const en = new Date().toISOString()
  // El orden del servidor (ajustes.json › orden_momentos): pedazos, colecciones, emblema (con su maravilla pegada), sello, país, destino, continente, Patrimonio, viajero.
  return [
    suma('Los imprescindibles de Roma', 3, 8, ['coliseo'], 'imprescindibles'),
    sumaSello('Roma', 3, 8, 'roma'),
    { tipo: 'coleccion', cat: 'coleccion', clave: 'roma|coleccion|roma_antigua', id: 'roma_antigua', destino: 'roma', nombre: 'La Roma antigua', linea: 'Seis piedras que lo empezaron todo', primera_vez: true, en } as Momento,
    emblema('coliseo', 'Una maravilla del mundo', 'El mayor anfiteatro de la Antigüedad.', 'coliseo'),
    { tipo: 'maravilla', cat: 'maravilla', clave: 'global|maravilla|coliseo', id: 'coliseo', n: 1, nombre: 'Coliseo', linea: 'Una de las nuevas siete maravillas del mundo.', primera_vez: true, en } as Momento,
    { tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:plata', sello: 'roma', destino: 'roma', grado: 'plata', nombre: 'Roma te atrapa', linea: 'Cuatro imprescindibles vistos: ya eres de aquí.', primera_vez: true, en } as Momento,
    { tipo: 'pais', cat: 'pais', clave: 'global|pais|Italia', pais: 'Italia', n: 1, nombre: 'Tu país número 1: Italia', primera_vez: true, en } as Momento,
    { tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: 'global|destino_nuevo|roma', destino: 'roma', n: 1, nombre: 'Tu destino número 1: Roma', primera_vez: true, en } as Momento,
    { tipo: 'continente', cat: 'continente', clave: 'global|continente|Europa', continente: 'Europa', nombre: 'Nuevo continente: Europa', primera_vez: true, en } as Momento,
    { tipo: 'patrimonio', cat: 'patrimonio', clave: 'roma|patrimonio|roma_historica', id: 'roma_historica', nombre: 'Centro histórico de Roma', primera_vez: true, en } as Momento,
    { tipo: 'viajero', cat: 'viajero', clave: 'global|viajero|trotamundos:1', logro: 'trotamundos', escalon: '1', destino: 'roma', nombre: 'Primera parada', linea: 'Tu primer destino con la app.', primera_vez: true, en } as Momento,
  ]
}

const api = {
  ayuda: () => console.info(AYUDA),
  lanzar(que: string = 'serieCompleta') {
    const todos = momentosDeSerie()
    const lista = que === 'serieCompleta' ? todos : todos.filter((m) => m.tipo === que || (que === 'suma' && m.tipo === 'suma_sello'))
    entregar({ ok: true, nuevos: lista })
    useLogrosStore.getState().recibir({ ok: true, cuenta: true, nuevos: lista })
    return lista.map((m) => m.tipo)
  },
  estadoPase(e: EstadoPase) {
    demo.pase = e
    demo.preguntaHecha = false
  },
  hora(h: string | null) {
    demo.hora = h
  },
  /** Finge que hoy es otro día (AAAA-MM-DD) para ver el plazo de 30 días después del viaje. Sin argumento, vuelve al día de verdad. */
  hoy(f?: string) {
    ;(window as unknown as { __demoHoy?: string }).__demoHoy = f
  },
  dia(n: number) {
    demo.dia = n
  },
  siguienteFoto(m: 'valida' | 'no_camara' | 'otra_fecha' | 'otro_sitio' | 'sin_cobertura') {
    demo.foto = m
  },
  sinCobertura(v: boolean) {
    demo.sinCobertura = v
  },
  reiniciar() {
    demo.ganado.clear()
    demo.vistos.clear()
    demo.entregados.length = 0
    demo.preguntaHecha = false
    demo.foto = null
    try {
      for (const k of Object.keys(window.localStorage)) if (k.startsWith('trazo:logros')) window.localStorage.removeItem(k)
    } catch {
      /* sin almacenamiento */
    }
  },
  estado: () => ({ ...demo, ganado: [...demo.ganado], vistos: [...demo.vistos] }),
}

declare global {
  interface Window {
    __demo?: typeof api
  }
}
if (typeof window !== 'undefined') window.__demo = api

/**
 * Sin cámara (el ordenador de desarrollo, el panel del navegador): en el demo, `getUserMedia` devuelve un vídeo de mentira (un lienzo con un degradado que se mueve) para poder ver el visor
 * y hacer la foto con el disparador. Si hay cámara de verdad, se usa esa. Con `__demo.camaraFalsa(false)` se desactiva.
 */
let camaraFalsa = true
;(window as unknown as { __demo: Record<string, unknown> }).__demo.camaraFalsa = (v: boolean) => {
  camaraFalsa = v
}
if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
  const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  navigator.mediaDevices.getUserMedia = async (c?: MediaStreamConstraints) => {
    try {
      return await Promise.race([original(c), new Promise<never>((_, no) => window.setTimeout(() => no(new Error('sin respuesta')), 1200))])
    } catch (e) {
      if (!camaraFalsa || !c?.video) throw e
      const lienzo = document.createElement('canvas')
      lienzo.width = 720
      lienzo.height = 960
      const g = lienzo.getContext('2d')!
      let t = 0
      const pintar = () => {
        t += 1
        const grad = g.createLinearGradient(0, 0, 720, 960)
        grad.addColorStop(0, `hsl(${30 + Math.sin(t / 40) * 12} 45% 55%)`)
        grad.addColorStop(1, `hsl(${200 + Math.cos(t / 50) * 12} 35% 35%)`)
        g.fillStyle = grad
        g.fillRect(0, 0, 720, 960)
        g.fillStyle = 'rgba(255,255,255,.25)'
        g.fillRect(180, 300, 360, 380)
        window.setTimeout(pintar, 100)
      }
      pintar()
      return lienzo.captureStream(10)
    }
  }
}
