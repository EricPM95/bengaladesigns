/**
 * (V35B) CÓMO USAN LA APP, lo mínimo. Una vez al día, la app avisa de que esta cuenta ha estado activa: la fecha del día (sin hora), el tipo de aparato (iPhone, Android u ordenador; sin modelo) y si usa la app
 * instalada o el navegador. NADA MÁS: ni dirección IP, ni ubicación, ni navegador exacto. El servidor ni siquiera mira las cabeceras de la petición: solo lo que la app manda en el cuerpo, ya limpio.
 *
 *   POST /api/uso   { aparato: 'iphone' | 'android' | 'ordenador', instalada: boolean }   → { ok: true, guardado }
 *
 * Hace falta una sesión de una cuenta de verdad (las anónimas no cuentan: ok sin guardar). Escribe con la clave de servicio llamando a la función `uso_anotar` (migración 0091), que pone la fecha de Madrid y guarda UN día
 * por cuenta. Sin esa función (0091 sin aplicar) responde ok con `guardado: false`: la app no falla y no insiste ese día. «Cómo entró» (correo o Google) no se guarda: ya sale de la cuenta.
 */
import { quienEs, tokenDe } from './cuentas.js'

export const APARATOS = ['iphone', 'android', 'ordenador']

/** Pura: lo que llega de la app, limpio; o null si no es un aviso de uso válido. Solo estos dos datos; cualquier otro campo se descarta. */
export function limpiarUso(cuerpo) {
  const c = cuerpo && typeof cuerpo === 'object' ? cuerpo : {}
  if (!APARATOS.includes(c.aparato)) return null
  return { aparato: c.aparato, instalada: c.instalada === true }
}

/** ¿La función no existe (0091 sin aplicar)? */
const faltaLaFuncion = (error) =>
  Boolean(error) && (error.code === 'PGRST202' || error.code === '42883' || error.code === '42P01' || error.code === 'PGRST205' || /Could not find the function|does not exist|schema cache/i.test(String(error.message ?? '')))

export function crearServicioUso({ admin }) {
  return {
    async anotar(usuario, cuerpo) {
      if (!admin) return { estado: 503, cuerpo: { ok: false } }
      const uso = limpiarUso(cuerpo)
      if (!uso) return { estado: 400, cuerpo: { ok: false } }
      if (usuario.is_anonymous) return { estado: 200, cuerpo: { ok: true, guardado: false } }
      const { error } = await admin.rpc('uso_anotar', { p_uid: usuario.id, p_aparato: uso.aparato, p_instalada: uso.instalada })
      if (error) {
        if (faltaLaFuncion(error)) return { estado: 200, cuerpo: { ok: true, guardado: false } }
        console.error('[uso]', error.message)
        return { estado: 503, cuerpo: { ok: false } }
      }
      return { estado: 200, cuerpo: { ok: true, guardado: true } }
    },
  }
}

export function registrarRutasUso(app, { admin }) {
  const servicio = crearServicioUso({ admin })
  app.post('/api/uso', async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ ok: false })
      const usuario = await quienEs(admin, tokenDe(req))
      if (!usuario) return res.status(401).json({ ok: false })
      const r = await servicio.anotar(usuario, req.body)
      return res.status(r.estado).json(r.cuerpo)
    } catch (error) {
      console.error('[uso]', error)
      return res.status(503).json({ ok: false })
    }
  })
}
