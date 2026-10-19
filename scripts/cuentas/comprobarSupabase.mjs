// Comprueba las cuentas (parte 3) contra el Supabase DE VERDAD. Lo lanza Eric UNA vez, cuando haya aplicado las migraciones y puesto las claves:
//   node scripts/cuentas/comprobarSupabase.mjs
// Opciones: --api=http://localhost:8787 (el servidor de la app, para el pago de prueba y el borrado)   --sin-pago (se salta el pago de prueba)   --esperar-pago (espera el pago de prueba con «stripe listen»)
// Las claves se leen SOLO de `.env.local` y no se muestran nunca (ni en pantalla ni en ningún archivo). Si falta una clave o una migración, NO prueba nada: dice qué falta y para.
// Todo lo que crea (usuarios de prueba, viaje, foto, invitación, recomendación) se borra al final, salga bien o mal.
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const opcion = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? def
const API = opcion('api', 'http://localhost:8787')
const sinPago = args.includes('--sin-pago')
/** Cuentas 3B: espera el pago de prueba (Stripe en modo pruebas, con `stripe listen` hacia este ordenador). */
const esperarPago = args.includes('--esperar-pago')
/** Tanda 9: tras el pago, devuelve el dinero desde Stripe (modo pruebas) y comprueba que el pase se anula y lo ganado se queda. */
const devolver = args.includes('--devolver')
const minutosDeEspera = Number(opcion('espera', '5'))

/** Lee `.env.local` sin tocar el entorno de nadie ni enseñar nada. */
function leerEnv() {
  const f = path.resolve('.env.local')
  if (!fs.existsSync(f)) return {}
  const env = {}
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !linea.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
const env = leerEnv()

const resultados = []
let fallos = 0
const ok = (nombre) => resultados.push(`  ✓ ${nombre}`)
const mal = (nombre, porque) => {
  fallos++
  resultados.push(`  ✗ ${nombre}${porque ? ` — ${porque}` : ''}`)
}
const comprobar = (cond, nombre, porque) => (cond ? ok(nombre) : mal(nombre, porque))
const texto = (e) => String(e?.message ?? e ?? 'error desconocido')

/* ── 0 · Qué hace falta antes de empezar ── */
const CLAVES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
const sinClaves = CLAVES.filter((c) => !env[c])
if (sinClaves.length) {
  console.log('No lanzo la comprobación: faltan estas claves en .env.local (solo los nombres, nunca los valores):')
  for (const c of sinClaves) console.log(`  · ${c}`)
  console.log('Ponlas (Supabase → Project Settings → API) y vuelve a lanzar el script.')
  process.exit(2)
}

const url = env.VITE_SUPABASE_URL
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const nuevoCliente = () => createClient(url, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

/* ── 1 · Las migraciones: cada una se reconoce por algo que SOLO ella crea ── */
// (La 0019 solo limpia la caché de fotos de lugares y no deja nada que se pueda mirar desde fuera: se pide aplicarla siempre que se aplique la 0018 o falte alguna posterior.)
const MIGRACIONES = [
  { n: '0017', tabla: 'affiliate_sales' },
  { n: '0018', tabla: 'trip_photos' },
  { n: '0020', tabla: 'trip_recommendations' },
  { n: '0021', tabla: 'trip_invitations' },
  { n: '0022', tabla: 'civitatis_cache' },
  { n: '0023', tabla: 'logro_hechos' },
  { n: '0024', tabla: 'hoy_prueba' },
  { n: '0024', tabla: 'trips', columna: 'guardado_en' },
  { n: '0025', tabla: 'logro_referidos' },
  { n: '0026', tabla: 'avisos' },
  { n: '0026', tabla: 'pagos_registro' },
  { n: '0026', tabla: 'invitaciones_app' },
]
const existe = async (tabla, columna = '*') => {
  const { error } = await admin.from(tabla).select(columna).limit(1)
  // (Con la clave de servicio, cualquier error al mirar una tabla o columna es que no está; a veces PostgREST devuelve el error sin texto.)
  return !error
}
const faltan = []
for (const m of MIGRACIONES) {
  const hay = await existe(m.tabla, m.columna ?? '*')
  if (!hay) faltan.push({ n: m.n, texto: `${m.n} (falta ${m.columna ? `la columna ${m.tabla}.${m.columna}` : `la tabla ${m.tabla}`})` })
}
// La 0027 (cuentas 3B) hace privado el almacén de fotos de perfil.
const { data: bucketPerfiles } = await admin.storage.getBucket('perfiles')
if (!bucketPerfiles) faltan.push({ n: '0026', texto: '0026 (falta el almacén «perfiles»)' })
if (!bucketPerfiles || bucketPerfiles.public !== false) faltan.push({ n: '0027', texto: '0027 (el almacén «perfiles» no es privado todavía)' })
if (faltan.length) {
  const numeros = [...new Set(faltan.map((f) => f.n))].sort()
  console.log('No lanzo la comprobación: faltan migraciones por aplicar en Supabase (SQL Editor, en este orden):')
  for (const f of faltan) console.log(`  · ${f.texto}`)
  console.log(`Aplica, en este orden y solo las que faltan: ${numeros.join(' → ')} (cada una es un archivo de supabase/migrations/; la 0019 va entre la 0018 y la 0020 si aplicas la 0018).`)
  process.exit(2)
}
ok('las migraciones 0017 a 0027 están aplicadas')

/* ── 2 · El flujo, con dos personas de prueba ── */
const creados = { usuarios: [], viaje: null, archivos: [] }
const persona = async (nombre) => {
  // Cuentas de verdad (no anónimas, con el correo ya confirmado): invitar, recomendar y borrar la cuenta piden una cuenta («Primero crea tu cuenta»). Se borran al final.
  const correo = `prueba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
  const clave = `P-${Math.random().toString(36).slice(2)}-${Date.now()}`
  const { data: nuevo, error: eNuevo } = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
  if (eNuevo || !nuevo?.user) throw new Error(`no se pudo crear a ${nombre}: ${texto(eNuevo)}`)
  creados.usuarios.push(nuevo.user.id)
  const cliente = nuevoCliente()
  const { data, error } = await cliente.auth.signInWithPassword({ email: correo, password: clave })
  if (error || !data?.user) throw new Error(`${nombre} no entra: ${texto(error)}`)
  await admin.from('travelers').upsert({ id: data.user.id, is_anonymous: false, email: correo }, { onConflict: 'id' })
  return { cliente, id: data.user.id, token: data.session?.access_token }
}

try {
  const eric = await persona('la dueña')
  const laura = await persona('la invitada')
  const extrana = await persona('una tercera persona que no comparte nada')

  // Guardar un viaje
  const ruta = { id: 'prueba', answers: { destination: { name: 'Roma' } }, days: [] }
  const { data: viaje, error: eViaje } = await eric.cliente.from('trips').insert({ traveler_id: eric.id, route: ruta }).select('id').single()
  comprobar(!eViaje && viaje?.id, 'guardar un viaje con la cuenta', texto(eViaje))
  if (viaje?.id) creados.viaje = viaje.id

  // Subir la foto de perfil
  const rutaFoto = `${eric.id}/prueba.jpg`
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
  const subida = await eric.cliente.storage.from('perfiles').upload(rutaFoto, jpg, { contentType: 'image/jpeg', upsert: true })
  comprobar(!subida.error, 'subir la foto de perfil', texto(subida.error))
  if (!subida.error) creados.archivos.push(rutaFoto)

  // Invitar y entrar como invitada
  const { data: inv, error: eInv } = await eric.cliente.rpc('crear_invitacion', { p_trip: creados.viaje, p_pass: null, p_usos: 1 })
  const codigo = inv?.codigo
  comprobar(!eInv && codigo, 'crear el código de invitación', texto(eInv))
  if (codigo) {
    const { data: vista } = await laura.cliente.rpc('ver_invitacion', { p_codigo: codigo })
    comprobar(vista?.valida === true, 'ver la invitación antes de entrar', JSON.stringify(vista))
    const { data: unida, error: eUnir } = await laura.cliente.rpc('canjear_invitacion', { p_codigo: codigo })
    comprobar(!eUnir && unida?.ok !== false, 'entrar al viaje con el código', texto(eUnir) || JSON.stringify(unida))
  }

  // La foto de perfil es privada (0027): ni con el enlace público, ni una tercera persona; sí la dueña y quien comparte su viaje, con un enlace que caduca.
  if (!subida.error) {
    const publica = await fetch(`${url}/storage/v1/object/public/perfiles/${rutaFoto}`).then((r) => r.status).catch(() => 0)
    comprobar(publica >= 400 || publica === 0, 'la foto de perfil NO se ve con la dirección pública', `respondió ${publica}`)
    const propia = await eric.cliente.storage.from('perfiles').createSignedUrl(rutaFoto, 60)
    comprobar(!propia.error && Boolean(propia.data?.signedUrl), 'la dueña ve su foto con un enlace que caduca', texto(propia.error))
    if (propia.data?.signedUrl) {
      const estado = await fetch(propia.data.signedUrl).then((r) => r.status).catch(() => 0)
      comprobar(estado === 200, 'el enlace firmado de la foto se abre', `respondió ${estado}`)
    }
    const deLaInvitada = await laura.cliente.storage.from('perfiles').createSignedUrl(rutaFoto, 60)
    comprobar(!deLaInvitada.error && Boolean(deLaInvitada.data?.signedUrl), 'quien comparte el viaje ve la foto', texto(deLaInvitada.error))
    const deLaExtrana = await extrana.cliente.storage.from('perfiles').createSignedUrl(rutaFoto, 60)
    comprobar(Boolean(deLaExtrana.error) || !deLaExtrana.data?.signedUrl, 'una tercera persona NO ve la foto', 'pudo pedir un enlace')
  }

  // Recomendar y aceptar
  const { data: rec, error: eRec } = await laura.cliente.from('trip_recommendations').insert({ trip_id: creados.viaje, tipo: 'cambio', payload: { prueba: true } }).select('id').single()
  comprobar(!eRec && rec?.id, 'la invitada recomienda un cambio', texto(eRec))
  if (rec?.id) {
    const { error: eAc } = await eric.cliente.from('trip_recommendations').update({ estado: 'aceptada', decidida_por: eric.id, decidida_en: new Date().toISOString() }).eq('id', rec.id)
    comprobar(!eAc, 'la dueña acepta la recomendación', texto(eAc))
  }

  // El aviso (lo ponen los disparadores solos)
  const { data: avisos, error: eAv } = await admin.rpc('avisos_de', { p_uid: eric.id })
  comprobar(!eAv && Array.isArray(avisos) && avisos.length >= 1, 'a la dueña le llega un aviso de la recomendación', texto(eAv) || `avisos: ${Array.isArray(avisos) ? avisos.length : '?'}`)

  // El pago de prueba (hace falta la API arrancada con PASES_COBRO_ACTIVO y PAGO_DE_MENTIRA, o las claves de Stripe en modo pruebas)
  if (sinPago) {
    resultados.push('  – pago de prueba: saltado (--sin-pago)')
  } else {
    try {
      const cfg = await fetch(`${API}/api/pase/config`).then((r) => r.json())
      if (!cfg?.cobro) {
        resultados.push('  – pago de prueba: el cobro está apagado en la API (PASES_COBRO_ACTIVO + STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET). Enciéndelo con Stripe en modo pruebas y vuelve a lanzar.')
      } else {
        // El pago pide una cuenta de verdad (no anónima): se crea una de usar y tirar, con correo ya confirmado.
        const correo = `prueba-${Date.now()}@example.com`
        const clave = `P-${Math.random().toString(36).slice(2)}-${Date.now()}`
        const { data: nueva, error: eNueva } = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
        if (eNueva || !nueva?.user) throw new Error(`no se pudo crear la cuenta de prueba del pago: ${texto(eNueva)}`)
        creados.usuarios.push(nueva.user.id)
        const entrada = nuevoCliente()
        const { data: sesionComprador, error: eEntra } = await entrada.auth.signInWithPassword({ email: correo, password: clave })
        if (eEntra) throw new Error(`la cuenta de prueba no entra: ${texto(eEntra)}`)
        const r = await fetch(`${API}/api/pago/crear`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${sesionComprador.session.access_token}` }, body: JSON.stringify({ plan: 'uno', destino: (cfg.destinos ?? ['Roma'])[0] }) })
        const j = await r.json().catch(() => ({}))
        comprobar(r.ok && j.url, 'empezar un pago de prueba (el precio lo pone el servidor)', j.error ?? `HTTP ${r.status}`)
        if (esperarPago && r.ok && j.url) {
          // Cuentas 3B: el aviso de Stripe llega a ESTE ordenador con la herramienta de Stripe para la consola (`stripe listen --forward-to localhost:8787/api/pago/webhook`); nada se toca en Vercel.
          console.log(`\nPara cerrar el pago de prueba:\n  1. En otra consola: stripe listen --forward-to localhost:8787/api/pago/webhook  (su «whsec_…» va en STRIPE_WEBHOOK_SECRET de .env.local, y se reinicia la API)\n  2. Abre esta dirección y paga con la tarjeta 4242 4242 4242 4242 (cualquier fecha futura y CVC):\n     ${j.url}\nEspero hasta ${minutosDeEspera} minutos a que llegue el aviso de Stripe…`)
          let listo = null
          for (let i = 0; i < minutosDeEspera * 20 && !listo; i++) {
            await new Promise((ok) => setTimeout(ok, 3000))
            const e = await fetch(`${API}/api/pago/estado?sesion=${encodeURIComponent(j.sesion)}`, { headers: { authorization: `Bearer ${sesionComprador.session.access_token}` } }).then((x) => x.json()).catch(() => ({}))
            if (e.listo || e.rechazado) listo = e
          }
          comprobar(listo?.listo === true, 'el pago de prueba llega por «stripe listen» y se crea el pase', listo ? JSON.stringify(listo) : 'no llegó el aviso en 5 minutos')
          if (listo?.listo) {
            const { data: pases } = await admin.rpc('pases_de', { p_uid: nueva.user.id })
            comprobar(Array.isArray(pases) && pases.length === 1, 'queda UN solo pase para esa persona', `pases: ${Array.isArray(pases) ? pases.length : '?'}`)
            if (devolver) {
              // Tanda 9: la devolución. Se gana algo con el pase, se devuelve el pago desde Stripe (modo pruebas) y llega `charge.refunded` por `stripe listen`: el pase se anula y lo ganado NO se pierde.
              await admin.from('achievements').insert({ user_id: nueva.user.id, destino: 'Roma', logro: 'prueba_devolucion', escalon: '' })
              const sk = env.STRIPE_SECRET_KEY
              const sesionStripe = await fetch(`https://api.stripe.com/v1/checkout/sessions/${j.sesion}`, { headers: { authorization: `Bearer ${sk}` } }).then((x) => x.json())
              const devolucion = await fetch('https://api.stripe.com/v1/refunds', { method: 'POST', headers: { authorization: `Bearer ${sk}`, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ payment_intent: sesionStripe.payment_intent }) }).then((x) => x.json())
              comprobar(devolucion.status === 'succeeded' || devolucion.status === 'pending', 'Stripe hace la devolución del pago de prueba', JSON.stringify(devolucion.error ?? devolucion.status))
              let anulado = null
              for (let i = 0; i < 40 && !anulado; i++) {
                await new Promise((ok) => setTimeout(ok, 3000))
                const e = await fetch(`${API}/api/pago/estado?sesion=${encodeURIComponent(j.sesion)}`, { headers: { authorization: `Bearer ${sesionComprador.session.access_token}` } }).then((x) => x.json()).catch(() => ({}))
                if (e.devuelto) anulado = e
              }
              comprobar(anulado?.devuelto === true, 'la devolución llega por «stripe listen» y el pase se anula', 'no llegó el aviso de devolución en 2 minutos')
              const { data: p2 } = await admin.from('passes').select('estado').eq('comprador_id', nueva.user.id)
              comprobar((p2 ?? []).length === 1 && p2[0].estado === 'anulado', 'el pase queda anulado (no borrado)', JSON.stringify(p2))
              const { data: logros } = await admin.from('achievements').select('logro').eq('user_id', nueva.user.id)
              comprobar((logros ?? []).some((l) => l.logro === 'prueba_devolucion'), 'lo ganado con el pase NO se pierde al devolverlo', JSON.stringify(logros))
              const { data: reg } = await admin.from('pagos_registro').select('estado').eq('pago_ref', j.sesion)
              comprobar(reg?.[0]?.estado === 'devuelto', 'el registro del cobro queda como «devuelto» (no se borra)', JSON.stringify(reg))
            }
          }
        } else {
          resultados.push('  – para cerrar el pago: vuelve a lanzar con --esperar-pago (y «stripe listen --forward-to localhost:8787/api/pago/webhook» en otra consola); paga con la tarjeta 4242 4242 4242 4242.')
        }
      }
    } catch (e) {
      mal('hablar con la API para el pago de prueba', `${API}: ${texto(e)}`)
    }
  }

  // Borrar la cuenta de la dueña por la API: no deben quedar restos (viaje, foto)
  try {
    const r = await fetch(`${API}/api/cuenta`, { method: 'DELETE', headers: { authorization: `Bearer ${eric.token}` } })
    comprobar(r.ok, 'borrar la cuenta desde la API', `HTTP ${r.status}`)
    if (r.ok) {
      creados.usuarios = creados.usuarios.filter((u) => u !== eric.id)
      // Borrar la cuenta no deja sin viaje a quien estaba invitada (0021, `preparar_borrado`): el viaje PASA a ella; de la cuenta borrada no queda nada.
      const { data: restoViaje } = await admin.from('trips').select('id, traveler_id').eq('id', creados.viaje)
      comprobar((restoViaje ?? []).length === 1 && restoViaje[0].traveler_id === laura.id, 'el viaje compartido pasa a la invitada al borrar la cuenta de la dueña (y no se pierde)', JSON.stringify(restoViaje))
      const { data: restoDueno } = await admin.from('travelers').select('id').eq('id', eric.id)
      comprobar((restoDueno ?? []).length === 0, 'no queda nada de la cuenta borrada')
      const { data: restoFoto } = await admin.storage.from('perfiles').list(eric.id)
      comprobar((restoFoto ?? []).length === 0, 'no queda la foto de perfil de la cuenta borrada')
      creados.viaje = null
      creados.archivos = []
    }
  } catch (e) {
    mal('hablar con la API para borrar la cuenta', `${API}: ${texto(e)}`)
  }
} catch (e) {
  mal('la comprobación se ha parado', texto(e))
} finally {
  // Limpiar todo lo que quede, pase lo que pase
  try {
    if (creados.archivos.length) await admin.storage.from('perfiles').remove(creados.archivos)
    if (creados.viaje) await admin.from('trips').delete().eq('id', creados.viaje)
    for (const u of creados.usuarios) await admin.auth.admin.deleteUser(u)
  } catch (e) {
    resultados.push(`  ! no he podido limpiar todo (${texto(e)}). Borra a mano los usuarios anónimos creados hoy en Authentication → Users.`)
  }
}

console.log('\nComprobación de las cuentas contra Supabase\n' + resultados.join('\n'))
console.log(fallos === 0 ? '\nTodo bien: ya está.' : `\n${fallos} fallo(s).`)
process.exit(fallos === 0 ? 0 : 1)
