/**
 * (V35B) «CUENTAS QUE NO CUENTAN» (Herramientas del panel): marcar o desmarcar una cuenta, por correo, como de prueba. No cuentan en las cifras ni los gráficos mientras «Sin cuentas de prueba» esté encendido.
 *   GET  /api/admin/cuentas-de-prueba            → { ok, disponible, cuentas:[{ email, marcado_en }], administradores:[correo] }
 *   POST /api/admin/cuentas-de-prueba            { email, marcar: true|false } → { ok }
 * `disponible: false` = falta la migración 0091 (tabla `cuentas_de_prueba`): el panel dice «Pronto». Las cuentas de administrador (LOGROS_ADMIN_EMAILS) no cuentan nunca y no hace falta marcarlas.
 */
import { administradoresDe } from './pruebas.js'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function crearServicioCuentasDePrueba({ admin, env = process.env, consola = console }) {
  return {
    async leer() {
      const administradores = [...administradoresDe(env).correos].sort()
      try {
        const { data, error } = await admin.from('cuentas_de_prueba').select('email,marcado_en').order('marcado_en', { ascending: true })
        if (error) return { ok: true, disponible: false, cuentas: [], administradores }
        return { ok: true, disponible: true, cuentas: data ?? [], administradores }
      } catch {
        return { ok: true, disponible: false, cuentas: [], administradores }
      }
    },
    async marcar(cuerpo) {
      const email = String(cuerpo?.email ?? '').trim().toLowerCase()
      if (!CORREO.test(email) || email.length > 120) return { estado: 400, cuerpo: { ok: false, error: 'Ese correo no vale.' } }
      const { disponible } = await this.leer()
      if (!disponible) return { estado: 409, cuerpo: { ok: false, pronto: true, error: 'Falta aplicar la migración 0091 en Supabase.' } }
      if (cuerpo?.marcar === false) {
        const { error } = await admin.from('cuentas_de_prueba').delete().eq('email', email)
        if (error) return { estado: 500, cuerpo: { ok: false, error: 'No se ha podido desmarcar.' } }
        return { estado: 200, cuerpo: { ok: true, marcada: false } }
      }
      if (administradoresDe(env).correos.has(email)) return { estado: 409, cuerpo: { ok: false, error: 'Las cuentas de administrador no cuentan nunca: no hace falta marcarla.' } }
      const { error } = await admin.from('cuentas_de_prueba').upsert({ email }, { onConflict: 'email' })
      if (error) {
        consola.error?.('[cuentas de prueba]', error.message)
        return { estado: 500, cuerpo: { ok: false, error: 'No se ha podido marcar.' } }
      }
      return { estado: 200, cuerpo: { ok: true, marcada: true } }
    },
  }
}
