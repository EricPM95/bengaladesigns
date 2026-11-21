// RELLENAR LOS PAGOS VIEJOS (V35B): para los cobros hechos ANTES de la migración 0091 (que no guardaban quién pagó ni la comisión), lee de Stripe y escribe un SQL aparte que Eric aplica si quiere.
//   STRIPE_SECRET_KEY=sk_test_… node scripts/pagos/rellenarPagosViejos.mjs [salida.sql]
// · SOLO LEE de Stripe (GET) y SOLO en modo de prueba: si la clave empieza por sk_live_ (o no es sk_test_) se niega. No toca Supabase ni producción: solo escribe el archivo (por defecto docs/dias/RELLENAR_PAGOS_VIEJOS.sql).
// · De cada cobro pagado saca: quién pagó (metadata.uid del checkout; si no la hay, el correo del cliente, que el SQL busca en auth.users) y la comisión (balance_transaction.fee).
// · El SQL generado SÍ lleva datos de personas (identificadores y correos): NO se sube al repositorio (está en .git/info/exclude). Se pega en el SQL editor de Supabase DESPUÉS de aplicar la 0091.
// · Nunca escribe ni enseña la clave.
import fs from 'node:fs'

const BASE = 'https://api.stripe.com/v1'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REF = /^[A-Za-z0-9_]+$/
const comillas = (t) => `'${String(t).replace(/'/g, "''")}'`

/** Pura: el SQL a partir de los cobros leídos ({ ref, uid, email, comision_cent }). Solo `update`: nunca pisa lo que ya tenga la fila. */
export function generarSql(cobros, { ahora = new Date() } = {}) {
  const lineas = [
    '-- RELLENAR LOS PAGOS VIEJOS: quién pagó (user_id) y la comisión de Stripe de los cobros anteriores a la migración 0091.',
    `-- Generado el ${ahora.toISOString().slice(0, 10)} leyendo Stripe en modo de prueba. Aplícalo en el SQL editor de Supabase DESPUÉS de la 0091. Se puede repetir: no pisa lo que ya esté rellenado.`,
    '-- Este archivo lleva datos de personas: NO lo subas al repositorio.',
    'begin;',
  ]
  let n = 0
  for (const c of cobros) {
    if (!REF.test(String(c.ref ?? ''))) continue
    const comision = Number.isInteger(c.comision_cent) && c.comision_cent >= 0 ? String(c.comision_cent) : 'null'
    let quien = 'null'
    if (UUID.test(String(c.uid ?? ''))) quien = `${comillas(c.uid)}::uuid`
    else if (c.email) quien = `(select id from auth.users where lower(email) = lower(${comillas(c.email)}) limit 1)`
    if (quien === 'null' && comision === 'null') continue
    lineas.push(`update public.pagos_registro set user_id = coalesce(user_id, ${quien}), comision_cent = coalesce(comision_cent, ${comision}) where pago_ref = ${comillas(c.ref)};`)
    n++
  }
  lineas.push('commit;', `-- ${n} cobros.`)
  return lineas.join('\n') + '\n'
}

/** Lee de Stripe (solo GET) los cobros pagados de los pases. `fetchFn` se puede cambiar para las pruebas. */
export async function leerCobros({ clave, fetchFn = fetch }) {
  if (!String(clave ?? '').startsWith('sk_test_')) throw new Error('Solo se usa con una clave de PRUEBA de Stripe (sk_test_…). Esta no lo es: no se hace nada.')
  const pedir = async (ruta) => {
    const r = await fetchFn(`${BASE}${ruta}`, { method: 'GET', headers: { Authorization: `Bearer ${clave}` } })
    const j = await r.json().catch(() => null)
    if (!r.ok) throw new Error(`Stripe contestó ${r.status} en ${ruta.split('?')[0]}`)
    return j
  }
  const cobros = []
  let despues = ''
  for (let pagina = 0; pagina < 50; pagina++) {
    const j = await pedir(`/checkout/sessions?limit=100&expand[]=data.payment_intent.latest_charge${despues}`)
    for (const s of j.data ?? []) {
      if (s.payment_status !== 'paid' || s.metadata?.pase !== '1') continue
      const cargo = s.payment_intent?.latest_charge
      let comision = null
      const bt = typeof cargo?.balance_transaction === 'string' ? cargo.balance_transaction : cargo?.balance_transaction?.id
      if (bt) {
        const t = await pedir(`/balance_transactions/${encodeURIComponent(bt)}`)
        comision = Number.isInteger(t?.fee) ? t.fee : null
      }
      cobros.push({ ref: s.id, uid: s.metadata?.uid ?? s.client_reference_id ?? null, email: s.customer_details?.email ?? s.customer_email ?? null, comision_cent: comision })
    }
    if (!j.has_more || !(j.data ?? []).length) break
    despues = `&starting_after=${encodeURIComponent(j.data[j.data.length - 1].id)}`
  }
  return cobros
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('rellenarPagosViejos.mjs')) {
  const salida = process.argv[2] ?? 'docs/dias/RELLENAR_PAGOS_VIEJOS.sql'
  try {
    const cobros = await leerCobros({ clave: process.env.STRIPE_SECRET_KEY })
    fs.writeFileSync(salida, generarSql(cobros))
    console.log(`Listo: ${cobros.length} cobros leídos de Stripe (modo de prueba). SQL escrito en ${salida}. No lo subas al repositorio.`)
  } catch (e) {
    console.error(String(e?.message ?? e))
    process.exit(1)
  }
}
