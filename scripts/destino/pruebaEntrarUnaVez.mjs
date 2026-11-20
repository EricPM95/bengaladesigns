// Entrar sin doble carga + aviso de Spam: node scripts/destino/pruebaEntrarUnaVez.mjs
// Sin red ni Supabase: un servidor de mentira para `reclamarCuenta` y lectura del código de la pantalla.
import fs from 'node:fs'
import { reclamarCuenta } from '../../server/cuentas.js'

let fallos = 0
let total = 0
const debe = (ok, texto) => {
  total++
  if (!ok) fallos++
  console.log(`${ok ? 'OK ' : 'MAL'} ${texto}`)
}

function admin({ filas = 0, fallaConsulta = false, pasado = { viajes: 0, fotos: 0, vistos: 0, megusta: 0 } } = {}) {
  const usuarios = { nuevo: { id: 'N', is_anonymous: false }, viejo: { id: 'V', is_anonymous: true } }
  return {
    auth: { getUser: async (t) => ({ data: { user: usuarios[t] ?? null }, error: usuarios[t] ? null : { message: 'x' } }) },
    storage: { from: () => ({ list: async () => ({ data: [], error: null }), move: async () => ({ error: null }) }) },
    rpc: async (nombre) => (nombre === 'reclamar_anonimo' ? { data: pasado, error: null } : { data: null, error: null }),
    from: () => ({ select: () => ({ eq: async () => (fallaConsulta ? { count: null, error: { message: 'x' } } : { count: filas, error: null }) }) }),
  }
}

let r = await reclamarCuenta(admin(), 'nuevo', 'viejo')
debe(r.estado === 200 && r.cuerpo.otros === 0 && r.cuerpo.archivosMovidos === 0, 'sesión anónima vacía: otros = 0 y nada movido (la app no recarga)')
r = await reclamarCuenta(admin({ filas: 1 }), 'nuevo', 'viejo')
debe(r.cuerpo.otros > 0, 'con un pase o logros sin contar en el rpc: otros > 0 (la app recarga)')
r = await reclamarCuenta(admin({ fallaConsulta: true }), 'nuevo', 'viejo')
debe(r.cuerpo.otros === 1, 'si falla la consulta, se cuenta como «hay» (ante la duda, recarga)')
r = await reclamarCuenta(admin({ pasado: { viajes: 2, fotos: 0, vistos: 0, megusta: 0 } }), 'nuevo', 'viejo')
debe(r.cuerpo.pasado.viajes === 2, 'con viajes, el rpc los cuenta')

const cuentas = fs.readFileSync('src/lib/cuentas.ts', 'utf8')
debe(/reclamado\.intento && !reclamado\.movido/.test(cuentas) && /primeraLectura/.test(cuentas), 'al arrancar con cuenta y sin nada que pasar, no se recarga')
debe(/ponerCortina\(\)/.test(cuentas) && /quitarCortina\(\)/.test(cuentas), 'hay cortina mientras se hace la entrada')
const entrar = fs.readFileSync('src/components/cuenta/EntrarCuenta.tsx', 'utf8')
debe(entrar.includes('Si no lo ves en unos segundos, mira en Spam o Promociones.'), 'aviso de Spam o Promociones bajo el código')

console.log(`\nPrueba de entrar una sola vez: ${total} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
