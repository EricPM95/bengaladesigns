// La prueba de la Tanda V41 (parte 3): LA EDAD POR FRANJAS (sustituye a «¿En qué año naciste?» de la primera vez).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV41_edad.mjs      (sin Vite solo se pasa la parte del servidor, los datos y la migración)
// Ninguna parte toca el Supabase de producción: el servidor y el panel se prueban con bases de mentira, la migración 0094 con PGlite y la app con el servidor de mentira de la demo (?logrosDemo=1).
//
// DECISIÓN (menores de 18): una respuesta vieja con año de nacimiento que hoy daría menos de 18 años NO tiene franja (null): no hay franja «menos de 18» y no se apunta a nadie en una que no es la suya.
//   La migración 0094 hace lo mismo (franja vacía) y en el panel esa respuesta no cuenta en «Edad por tramos».
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { abrirApp } from './_enLaApp.mjs'
import { FRANJAS_EDAD, NOMBRE_FRANJA, franjaDeAnio, franjaDeEdad, franjaDeFila } from '../../server/franjaEdad.js'
import { crearServicioPrimeraVez, limpiarRespuestas } from '../../server/primeraVez.js'
import { primeraVez } from '../../server/panel/calculos.js'
import { prepararUsuarios, filaDe, indiceDeDestinos } from '../../server/panel/calculosUsuarios.js'
import { cargarDatos } from '../../server/logros/datos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V41_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. La función pura: de la edad (o del año) a su franja, con la edad de hoy inyectada ───────── */
console.log('1. La franja sale de la edad: bordes 24/25, 34/35, 44/45, 54/55, 64/65 y menores de 18')
{
  debe(FRANJAS_EDAD.join('|') === '18-24|25-34|35-44|45-54|55-64|65+', 'franjas', 'son seis, en orden: 18-24 · 25-34 · 35-44 · 45-54 · 55-64 · 65+')
  const bordes = [[17, null], [18, '18-24'], [24, '18-24'], [25, '25-34'], [34, '25-34'], [35, '35-44'], [44, '35-44'], [45, '45-54'], [54, '45-54'], [55, '55-64'], [64, '55-64'], [65, '65+'], [99, '65+']]
  for (const [edad, franja] of bordes) debe(franjaDeEdad(edad) === franja, 'bordes', `edad ${edad} → ${franja ?? 'sin franja (menor de 18)'} (sale ${franjaDeEdad(edad)})`)
  debe(franjaDeEdad(NaN) === null && franjaDeEdad(undefined) === null && franjaDeEdad(-3) === null && franjaDeEdad(0) === null, 'bordes', 'sin edad, edad rara o 0 → sin franja')
  // El año se convierte con la edad de HOY, que se inyecta (aquí 2026) para que la prueba no dependa del día en que se pase.
  const HOY = 2026
  const deAnio = [[2009, null], [2008, '18-24'], [2002, '18-24'], [2001, '25-34'], [1992, '25-34'], [1991, '35-44'], [1982, '35-44'], [1981, '45-54'], [1972, '45-54'], [1971, '55-64'], [1962, '55-64'], [1961, '65+'], [1920, '65+']]
  for (const [anio, franja] of deAnio) debe(franjaDeAnio(anio, HOY) === franja, 'anio', `nacida en ${anio} (hoy ${HOY}, ${HOY - anio} años) → ${franja ?? 'sin franja'}`)
  debe(franjaDeAnio(2027, HOY) === null && franjaDeAnio(1899, HOY) === null && franjaDeAnio(null, HOY) === null && franjaDeAnio('', HOY) === null && franjaDeAnio('abc', HOY) === null && franjaDeAnio(1990.5, HOY) === null, 'anio', 'año en el futuro, anterior a 1900, vacío o raro → sin franja')
  debe(franjaDeAnio(1990, 2030) === '35-44' && franjaDeAnio(1990, 2035) === '45-54', 'anio', 'la edad de hoy se inyecta: el mismo año cae en otra franja con otro «hoy»')
  debe(franjaDeAnio(2000) === franjaDeEdad(new Date().getFullYear() - 2000), 'anio', 'sin «hoy» inyectado usa el año del reloj')
  // La franja guardada manda sobre el año; sin franja (fila vieja o sin la 0094) sale la del año.
  debe(franjaDeFila({ franja_edad: '55-64', anio_nacimiento: 1990 }, HOY) === '55-64' && franjaDeFila({ franja_edad: null, anio_nacimiento: 1990 }, HOY) === '35-44' && franjaDeFila({ anio_nacimiento: 1961 }, HOY) === '65+' && franjaDeFila({}, HOY) === null && franjaDeFila(null, HOY) === null, 'fila', 'la franja guardada manda; si no hay, la del año; si tampoco, nada')
  debe(franjaDeFila({ franja_edad: '12-17', anio_nacimiento: 1990 }, HOY) === '35-44', 'fila', 'un valor que no es una de las seis franjas se ignora')
  debe(NOMBRE_FRANJA['65+'] === '65 o más' && NOMBRE_FRANJA['25-34'] === '25-34', 'franjas', '«65+» se dice «65 o más»')
}

/* ───────── 2. El servidor guarda la franja, no el año; una respuesta vieja sale con su franja ───────── */
console.log('2. El servidor: guarda la franja; una respuesta vieja con año sale con su franja; sin la 0094 no se atasca')
{
  const l = limpiarRespuestas({ frecuencia: 'dos_o_tres', compania: 'pareja', franja_edad: '25-34', anio_nacimiento: 1950 }, 2026)
  debe(l.franja_edad === '25-34' && !('anio_nacimiento' in l), 'guarda', 'lo que se guarda lleva la franja y NUNCA el año de nacimiento (aunque llegue)')
  debe(limpiarRespuestas({ franja_edad: '99-100' }, 2026).franja_edad === null && limpiarRespuestas({}, 2026).franja_edad === null, 'guarda', 'una franja que no es de las seis, o ninguna → vacío')
  debe(limpiarRespuestas({ anio_nacimiento: 1990 }, 2026).franja_edad === '35-44' && limpiarRespuestas({ anio_nacimiento: 1990 }, 2036).franja_edad === '45-54', 'vieja', 'una app vieja que aún manda el año: se guarda su franja (con el año de hoy inyectado)')

  const filas = new Map()
  const admin = (sinFranja = false) => ({
    from: () => ({
      upsert: async (fila) => {
        if (sinFranja && 'franja_edad' in fila) return { error: { code: '42703', message: 'column "franja_edad" of relation "viajero_primera_vez" does not exist' } }
        filas.set(fila.user_id, { ...(filas.get(fila.user_id) ?? {}), ...fila })
        return { error: null }
      },
      select: (columnas) => ({
        eq: (_c, id) => ({
          maybeSingle: async () => {
            if (sinFranja && String(columnas).includes('franja_edad')) return { data: null, error: { code: '42703', message: 'column viajero_primera_vez.franja_edad does not exist' } }
            return { data: filas.get(id) ?? null, error: null }
          },
        }),
      }),
    }),
  })
  const s = crearServicioPrimeraVez({ admin: admin() })
  const g = await s.guardar({ id: 'u1' }, { frecuencia: 'cuatro_o_mas', compania: 'amigos', franja_edad: '45-54' })
  debe(g.estado === 200 && filas.get('u1').franja_edad === '45-54' && !('anio_nacimiento' in filas.get('u1')), 'guarda', 'PUT guarda la franja en la fila (y ningún año)')
  const r = await s.leer({ id: 'u1' })
  debe(r.cuerpo.franja_edad === '45-54' && !('anio_nacimiento' in r.cuerpo), 'lee', 'GET devuelve la franja y ya no el año de nacimiento')
  // Una fila vieja (solo año): sale con su franja (con la edad de hoy de verdad: se compara con la misma función).
  filas.set('viejo', { user_id: 'viejo', frecuencia: null, compania: null, anio_nacimiento: 1975, hecho_en: '2026-01-01' })
  const v = await s.leer({ id: 'viejo' })
  debe(v.cuerpo.franja_edad === franjaDeAnio(1975, new Date().getFullYear()) && v.cuerpo.franja_edad !== null, 'vieja', `una respuesta vieja con año sale con su franja (${v.cuerpo.franja_edad})`)
  filas.set('menor', { user_id: 'menor', anio_nacimiento: new Date().getFullYear() - 10, hecho_en: '2026-01-01' })
  debe((await s.leer({ id: 'menor' })).cuerpo.franja_edad === null, 'vieja', 'una respuesta vieja de un menor de 18 sale sin franja')

  // Sin la migración 0094: se guarda todo lo demás y no falla; el GET sigue contestando (la franja sale del año).
  const filas2 = filas
  filas2.clear()
  const sin = crearServicioPrimeraVez({ admin: admin(true) })
  const gs = await sin.guardar({ id: 'u2' }, { frecuencia: 'dos_o_tres', compania: 'familia', franja_edad: '35-44' })
  debe(gs.estado === 200 && filas2.get('u2')?.frecuencia === 'dos_o_tres' && filas2.get('u2')?.compania === 'familia' && !('franja_edad' in filas2.get('u2')), 'sin_0094', 'sin la 0094 se guarda todo lo demás y la franja se ignora (no falla, no se atasca)')
  filas2.set('u3', { user_id: 'u3', frecuencia: null, compania: null, anio_nacimiento: 1990, hecho_en: '2026-01-01' })
  const ls = await sin.leer({ id: 'u3' })
  debe(ls.estado === 200 && ls.cuerpo.hecho === true && ls.cuerpo.franja_edad === franjaDeAnio(1990, new Date().getFullYear()), 'sin_0094', 'sin la 0094 el GET responde bien (200) y la franja sale del año de nacimiento')
  const codigo = leer('server/primeraVez.js')
  debe(!/select\([^)]*\*/.test(codigo), 'v36', 'el servidor de la primera vez no usa select(*): solo las columnas justas (regla V36)')
}

/* ───────── 3. El panel: la ficha y el reparto enseñan la franja, no el año ───────── */
console.log('3. El panel: «25-34 años» en la ficha; el reparto por edades con las seis franjas')
{
  const AHORA = new Date('2026-11-20T10:00:00Z')
  const usuarios = Array.from({ length: 9 }, (_, i) => ({ id: `u${i}`, email: `u${i}@x.es`, alta: '2026-01-01T09:00:00Z', ultimo_acceso: '2026-11-19T08:00:00Z', proveedor: 'correo' }))
  const base = {
    usuarios,
    travelers: [],
    trips: [],
    miembros: [],
    pases: [],
    miembros_pase: [],
    pagos: [],
    logros: [],
    perfiles: [],
    avisos_destino: [],
    primera_vez: [
      { user_id: 'u0', frecuencia: 'dos_o_tres', compania: 'pareja', franja_edad: '25-34', anio_nacimiento: null },
      { user_id: 'u1', frecuencia: null, compania: null, franja_edad: '25-34' },
      { user_id: 'u2', frecuencia: null, compania: null, franja_edad: '65+' },
      { user_id: 'u3', frecuencia: null, compania: null, franja_edad: null, anio_nacimiento: 1990 }, // vieja: 36 años en 2026 → 35-44
      { user_id: 'u4', frecuencia: null, compania: null, franja_edad: null, anio_nacimiento: 1961 }, // vieja: 65 → 65+
      { user_id: 'u5', frecuencia: null, compania: null, franja_edad: null, anio_nacimiento: 2015 }, // vieja: 11 años → sin franja
      { user_id: 'u6', frecuencia: null, compania: null, franja_edad: '18-24' },
      { user_id: 'u7', frecuencia: null, compania: null, franja_edad: '45-54' },
      { user_id: 'u8', frecuencia: null, compania: null, franja_edad: '55-64' },
    ],
    hay: { pagos: true, pais: true, uso: false, clics: false, pruebas: false, proximamente: false },
  }
  const pv = primeraVez(base, AHORA)
  const edad = pv.bloques.find((b) => b.id === 'edad')
  debe(edad.total === 8, 'reparto', `el reparto cuenta 8 respuestas con franja (el menor de 18 no cuenta): ${edad.total}`)
  const por = Object.fromEntries(edad.opciones.map((o) => [o.valor, o]))
  debe(por['25-34'].n === 2 && por['65+'].n === 2 && por['35-44'].n === 1 && por['18-24'].n === 1 && por['45-54'].n === 1 && por['55-64'].n === 1, 'reparto', 'cada franja con sus personas (las viejas con año ya cuentan en su franja)')
  debe(edad.opciones.every((o) => FRANJAS_EDAD.includes(o.valor)) && por['65+'].nombre === '65 o más' && por['25-34'].nombre === '25-34', 'reparto', 'solo salen las seis franjas, con su nombre («65 o más»)')
  debe(edad.opciones.length === 6, 'reparto', 'con todas las franjas elegidas salen las seis')
  debe(pv.contestaron === 9 - 1, 'reparto', `contestaron 8: la persona solo con año de menor no cuenta (${pv.contestaron})`)
  const { registros } = prepararUsuarios(base, { hoy: '2026-11-20', datos: cargarDatos(), conocidos: indiceDeDestinos([]) })
  const ficha = (id) => filaDe(registros.find((r) => r.id === id), '2026-11-20').primera_vez
  debe(ficha('u0').franja_edad === '25-34' && !('anio_nacimiento' in ficha('u0')), 'ficha', 'la fila del usuario lleva la franja y ya no el año')
  debe(ficha('u3').franja_edad === '35-44' && ficha('u4').franja_edad === '65+', 'ficha', 'una persona con respuesta vieja sale con su franja de hoy')
  debe(ficha('u5').franja_edad === null, 'ficha', 'el menor de 18 sale sin franja')
  const fuente = leer('server/panel/calculosUsuarios.js') + leer('server/panel/calculos.js') + leer('src/components/panel/api.ts') + leer('src/components/panel/usuarios/Ficha.tsx')
  debe(!/nacida en/.test(fuente) && !/p\.anio_nacimiento|pv\.anio_nacimiento/.test(fuente), 'panel', 'el panel ya no dice «nacida en …» ni lee el año de nacimiento')
}

/* ───────── 4. La migración 0094 y su COMPROBAR ───────── */
console.log('4. La migración 0094 (PGlite): columna con solo las seis franjas, filas viejas convertidas, el año se queda')
{
  const m = leer('supabase/migrations/0094_franja_edad.sql')
  const c = leer('docs/dias/COMPROBAR_0094.sql')
  const sinCom = (t) => t.replace(/--.*$/gm, '')
  debe(/sin aplicar/i.test(m.split('\n')[0]) && /V41/.test(m) && /cu[aá]ndo y por qu[eé]/i.test(m), 'migracion', 'la 0094 existe, dice SIN APLICAR y explica cuándo y por qué')
  debe(/franja_edad text check/.test(m) && ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].every((f) => m.includes(`'${f}'`)), 'migracion', 'añade franja_edad (texto) con CHECK de las seis franjas')
  debe(!/drop column|anio_nacimiento\s*=\s*null|alter column anio_nacimiento/i.test(sinCom(m)), 'migracion', 'el año de nacimiento NO se borra ni se vacía')
  debe(!/empezar_de_cero/.test(sinCom(m)), 'migracion', 'no vuelve a crear empezar_de_cero (la tabla ya estaba en su inventario)')
  debe(/as todo/.test(c) && /franja_edad/.test(c) && !/\b(insert|update|delete|drop|alter)\b/i.test(sinCom(c)), 'comprobar', 'COMPROBAR_0094.sql solo lee y saca una fila con `todo`')
  // La última versión de empezar_de_cero sigue borrando la fila entera de la tabla.
  const migraciones = fs.readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
  const ultima = migraciones.filter((f) => /function public\.empezar_de_cero/.test(leer(`supabase/migrations/${f}`))).at(-1)
  debe(/viajero_primera_vez/.test(leer(`supabase/migrations/${ultima}`)) && migraciones.at(-1) !== undefined, 'empezar', `la última empezar_de_cero (${ultima}) lleva viajero_primera_vez en su inventario (borra la fila entera)`)
  debe(/empezar_de_cero/.test(leer('server/cuentas.js')), 'empezar', '«Borrar mi cuenta» usa empezar_de_cero (borra la fila entera de la primera vez)')

  const db = new PGlite()
  try {
    await db.exec(`create table public.viajero_primera_vez (
      user_id uuid primary key, frecuencia text, compania text, anio_nacimiento smallint check (anio_nacimiento between 1920 and 2100), hecho_en timestamptz not null default now())`)
    const hoy = new Date().getFullYear()
    const casos = [['a', hoy - 17], ['b', hoy - 18], ['c', hoy - 24], ['d', hoy - 25], ['e', hoy - 34], ['f', hoy - 35], ['g', hoy - 44], ['h', hoy - 45], ['i', hoy - 54], ['j', hoy - 55], ['k', hoy - 64], ['l', hoy - 65], ['m', null]]
    const uuid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
    for (const [k, [, anio]] of casos.entries()) await db.query('insert into public.viajero_primera_vez (user_id, anio_nacimiento) values ($1, $2)', [uuid(k + 1), anio])
    await db.exec(m) // se aplica entera…
    await db.exec(m) // …y se puede repetir
    const filas = (await db.query('select anio_nacimiento, franja_edad from public.viajero_primera_vez')).rows
    debe(filas.length === casos.length, 'sql', 'las filas siguen todas ahí tras aplicarla dos veces')
    const mal = filas.filter((f) => f.anio_nacimiento !== null && (f.franja_edad ?? null) !== franjaDeAnio(f.anio_nacimiento, hoy))
    debe(mal.length === 0, 'sql', `cada fila con año queda en la franja que dice la función pura (bordes 17/18, 24/25, 34/35, 44/45, 54/55, 64/65): ${JSON.stringify(mal)}`)
    debe(filas.every((f) => f.anio_nacimiento === null || Number(f.anio_nacimiento) > 0) && filas.filter((f) => f.anio_nacimiento !== null).length === casos.length - 1, 'sql', 'el año de nacimiento se conserva en todas')
    debe(filas.find((f) => Number(f.anio_nacimiento) === hoy - 17).franja_edad === null && filas.find((f) => f.anio_nacimiento === null).franja_edad === null, 'sql', 'el menor de 18 y quien no dio año se quedan sin franja')
    let rechazada = false
    try {
      await db.query("insert into public.viajero_primera_vez (user_id, franja_edad) values ('00000000-0000-0000-0000-0000000000ff', '12-17')")
    } catch {
      rechazada = true
    }
    debe(rechazada, 'sql', 'la base rechaza una franja que no sea de las seis')
    await db.query("insert into public.viajero_primera_vez (user_id, franja_edad) values ('00000000-0000-0000-0000-0000000000fe', '65+')")
    // Repetir la migración no pisa lo que alguien contestó después: una franja ya puesta se queda.
    await db.query("update public.viajero_primera_vez set franja_edad = '55-64', anio_nacimiento = $1 where user_id = '00000000-0000-0000-0000-0000000000fe'", [hoy - 20])
    await db.exec(m)
    debe((await db.query("select franja_edad from public.viajero_primera_vez where user_id = '00000000-0000-0000-0000-0000000000fe'")).rows[0].franja_edad === '55-64', 'sql', 'aplicarla otra vez no pisa una franja ya contestada')
  } finally {
    await db.close()
  }
}

/* ───────── 5. La pregunta en la app ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V41 (edad): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('5. En la app (390x844): título, subtítulo, seis opciones, elegir guarda la franja y «Saltar»')
const RUTA = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0'
const NUEVA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.removeItem('trazo:demo:primera_vez_hecha');localStorage.removeItem('trazo:primera_vez:avisados')}catch(e){}"
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
// Pasa la bienvenida y las tres primeras preguntas (frecuencia, compañía, sueño) hasta llegar a la de la edad.
const hastaLaEdad = async (a) => {
  await esperar(a, "Boolean(document.querySelector('[data-bienvenida-primera-vez]'))")
  await a.evaluar("document.querySelector('[data-empezar]')?.click(); true")
  await esperar(a, "Boolean(document.querySelector('[data-preguntas-primera-vez]'))")
  for (let i = 0; i < 3; i++) {
    await clic(a, '[data-continuar]')
    await a.esp(300)
  }
  return esperar(a, "Boolean(document.querySelector('[data-franjas]'))", 10)
}
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA })
  try {
    debe(await hastaLaEdad(a), 'pregunta', 'la cuarta pregunta es la de la edad')
    const info = JSON.parse(await a.evaluar("JSON.stringify({ h1: document.querySelector('[data-preguntas-primera-vez] h1')?.textContent, sub: document.querySelector('[data-edad-subtitulo]')?.textContent, subPx: getComputedStyle(document.querySelector('[data-edad-subtitulo]')).fontSize, opciones: [...document.querySelectorAll('[data-franjas] [data-opcion]')].map((b) => ({ id: b.dataset.opcion, t: b.textContent, h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width), icono: b.querySelector('svg path')?.getAttribute('d') })), marcadas: document.querySelectorAll('[data-franjas] [aria-pressed=\"true\"]').length, texto: document.body.innerText, ancho: document.documentElement.scrollWidth, anios: document.querySelectorAll('[data-anio]').length })"))
    debe(info.h1 === '¿Cuántos años tienes?', 'pregunta', `el título es «¿Cuántos años tienes?» (${info.h1})`)
    debe(info.sub === 'Solo para conocer mejor a quien viaja con Jutrip.' && info.subPx === '14.5px', 'pregunta', `debajo, en pequeño: «Solo para conocer mejor a quien viaja con Jutrip.» (${info.sub}, ${info.subPx})`)
    debe(info.opciones.map((o) => o.t).join('|') === '18-24|25-34|35-44|45-54|55-64|65 o más', 'pregunta', `las seis opciones, en orden (${info.opciones.map((o) => o.t).join(' | ')})`)
    debe(info.opciones.map((o) => o.id).join('|') === '18-24|25-34|35-44|45-54|55-64|65+', 'pregunta', 'cada opción lleva su franja como valor')
    debe(info.opciones.every((o) => o.h === 132) && new Set(info.opciones.map((o) => o.icono)).size === 6, 'diseno', 'tarjetas de 132 px de alto (como en Design, Q4) y un icono distinto cada una')
    debe(info.marcadas === 0, 'pregunta', 'empieza SIN ninguna franja marcada (una sola, opcional)')
    debe(!/En qué año naciste/.test(info.texto) && info.anios === 0, 'pregunta', 'la rueda de años ya no está')
    debe(info.ancho <= 390, 'diseno', `sin scroll horizontal (${info.ancho})`)
    debe((await a.evaluar("document.querySelector('[aria-label^=\"Pregunta \"]').getAttribute('aria-label')")) === 'Pregunta 4 de 5' && Boolean(await a.evaluar("!!(document.querySelector('[data-saltar]') && document.querySelector('[data-continuar]'))")), 'pregunta', 'sigue siendo la 4 de 5, con «Saltar» y [Continuar]')
    // Una sola a la vez: elegir otra quita la anterior; tocar la misma la quita.
    await clic(a, '[data-opcion="35-44"]')
    await clic(a, '[data-opcion="45-54"]')
    const una = JSON.parse(await a.evaluar("JSON.stringify([...document.querySelectorAll('[data-franjas] [aria-pressed=\"true\"]')].map((b) => b.dataset.opcion))"))
    debe(una.length === 1 && una[0] === '45-54', 'pregunta', 'se elige UNA sola: al tocar otra se quita la anterior')
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
    const png = await a.cdp('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(`${CAP}/edad.png`, Buffer.from(png.result.data, 'base64'))
    await clic(a, '[data-continuar]') // → país
    await a.esp(300)
    await clic(a, '[data-continuar]') // → termina
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = JSON.parse(await a.evaluar('JSON.stringify(window.__demoPrimeraVez)'))
    debe(g.guardados === 1 && g.franja_edad === '45-54', 'guarda', `elegir una guarda la franja (${g.franja_edad})`)
    debe(g.ultimo && g.ultimo.franja_edad === '45-54' && !('anio_nacimiento' in g.ultimo), 'guarda', 'a la API viaja la franja, no el año')
  } finally {
    a.cerrar()
  }
}
{
  // «Saltar» en la pregunta de la edad no guarda nada de ella (aunque haya algo marcado).
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA })
  try {
    debe(await hastaLaEdad(a), 'saltar', 'otra vez en la pregunta de la edad')
    await clic(a, '[data-opcion="65+"]')
    await clic(a, '[data-saltar]')
    await a.esp(300)
    await clic(a, '[data-continuar]')
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = JSON.parse(await a.evaluar('JSON.stringify(window.__demoPrimeraVez)'))
    debe(g.guardados === 1 && g.franja_edad === null, 'saltar', '«Saltar» quita lo marcado y no se guarda ninguna franja')
  } finally {
    a.cerrar()
  }
}
{
  // El panel en el navegador: la ficha enseña la franja.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844 })
  try {
    const t = JSON.parse(await a.evaluar("import('/src/components/panel/usuarios/Ficha.tsx').then((m) => JSON.stringify([m.frasePrimeraVez({ frecuencia: 'dos_o_tres', compania: 'pareja', franja_edad: '25-34' }), m.frasePrimeraVez({ frecuencia: null, compania: null, franja_edad: '65+' }), m.frasePrimeraVez({ frecuencia: null, compania: null, franja_edad: null }), m.frasePrimeraVez(null)]))"))
    debe(t[0] === 'Primera vez: viaja 2 o 3 veces al año · en pareja · 25-34 años', 'panel', `la ficha dice «25-34 años» (${t[0]})`)
    debe(t[1] === 'Primera vez: 65 o más años' && /todavía no ha contestado/.test(t[2]) && /todavía no ha contestado/.test(t[3]), 'panel', 'la ficha: «65 o más años»; sin nada, «todavía no ha contestado»')
    const l = JSON.parse(await a.evaluar("import('/src/components/panel/api.ts').then((m) => JSON.stringify([m.lineaDePrimeraVez({ frecuencia: 'dos_o_tres', compania: 'pareja', franja_edad: '35-44' }), m.lineaDePrimeraVez(null)]))"))
    debe(l[0] === '2–3 veces/año · en pareja · 35-44 años' && l[1] === '—', 'panel', `la línea de la lista dice «35-44 años» (${l[0]})`)
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V41 (edad): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
