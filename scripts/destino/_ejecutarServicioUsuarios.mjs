// (V35A) El servicio de «Usuarios» con la base falsa (sin Supabase). Lo usa la prueba del servidor.
import { cargarDatos } from '../../server/logros/datos.js'
import { crearServicioUsuarios } from '../../server/panel/usuarios.js'
import { AHORA, baseFalsa } from './_baseFalsaUsuarios.mjs'

export function servicioFalso({ base = baseFalsa(), ahora = AHORA, admin = null } = {}) {
  const datos = cargarDatos()
  return crearServicioUsuarios({ admin, datos: () => datos, ahora: () => ahora, leer: async () => base, ttl: 0 })
}
