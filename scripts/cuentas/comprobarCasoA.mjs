// Caso A (tanda 9): quien ya tenía viajes en el móvil (sesión anónima) crea o entra en su cuenta y los viajes pasan a ella SIN perder nada. Contra el Supabase de verdad y la API local (npm run server):
//   node scripts/cuentas/comprobarCasoA.mjs [--api=http://localhost:8787]
// Crea una sesión anónima con un viaje y una cuenta de usar y tirar, llama a /api/cuenta/reclamar y comprueba que el viaje es ahora de la cuenta. Todo lo creado se borra al final.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const API = process.argv.find((a) => a.startsWith('--api='))?.split('=')[1] ?? 'http://localhost:8787'
const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const cliente = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const usuarios = []
let fallos = 0
const ok = (c, t, d = '') => { console.log(`  ${c ? '✓' : '✗'} ${t}${c ? '' : ' — ' + d}`); if (!c) fallos++ }
try {
  const anon = cliente()
  const { data: a, error: ea } = await anon.auth.signInAnonymously()
  if (ea) throw new Error('sin sesión anónima: ' + ea.message)
  usuarios.push(a.user.id)
  await anon.from('travelers').upsert({ id: a.user.id, is_anonymous: true }, { onConflict: 'id', ignoreDuplicates: true })
  const ruta = { id: 'caso-a', destination: 'Roma', answers: {}, days: [{ id: 'd1', dayNumber: 1 }] }
  const { data: viaje, error: ev } = await anon.from('trips').insert({ traveler_id: a.user.id, route: ruta }).select('id').single()
  ok(!ev && viaje?.id, 'el viaje del móvil (sesión anónima) existe', ev?.message)
  const correo = `casoa-${Date.now()}@example.com`
  const clave = `P-${Math.random().toString(36).slice(2)}-${Date.now()}`
  const { data: n, error: en } = await admin.auth.admin.createUser({ email: correo, password: clave, email_confirm: true })
  if (en) throw new Error('sin cuenta: ' + en.message)
  usuarios.push(n.user.id)
  const cuenta = cliente()
  const { data: s, error: es } = await cuenta.auth.signInWithPassword({ email: correo, password: clave })
  if (es) throw new Error('no entra: ' + es.message)
  const r = await fetch(`${API}/api/cuenta/reclamar`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${s.session.access_token}` }, body: JSON.stringify({ anonToken: a.session.access_token }) })
  ok(r.ok, 'la API pasa lo del móvil a la cuenta', `HTTP ${r.status}`)
  const { data: fila } = await admin.from('trips').select('id, traveler_id, route').eq('id', viaje.id)
  ok(fila?.length === 1 && fila[0].traveler_id === n.user.id && fila[0].route?.id === 'caso-a', 'el viaje es ahora de la cuenta y no ha cambiado nada de dentro', JSON.stringify(fila?.map((f) => f.traveler_id)))
  const { data: suyos } = await cuenta.from('trips').select('id')
  ok((suyos ?? []).some((t) => t.id === viaje.id), 'la cuenta lo ve al entrar')
} catch (e) {
  console.log('  ✗', e.message)
  fallos++
} finally {
  for (const u of usuarios) await admin.auth.admin.deleteUser(u).catch(() => undefined)
}
console.log(fallos === 0 ? '\nCaso A bien: los viajes del móvil pasan a la cuenta sin perder nada.' : `\n${fallos} fallo(s).`)
process.exit(fallos ? 1 : 0)
