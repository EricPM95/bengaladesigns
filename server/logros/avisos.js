/**
 * LOS AVISOS DE LOS LOGROS (Tanda 8A, apartado 6): la cola está lista y el envío, preparado pero APAGADO.
 *
 * Qué toca avisar y cuándo (`servicio.prepararAvisos`, que los deja en la cola `logro_avisos`):
 *   - el resumen del viaje, al día siguiente del último día;
 *   - «Te quedan 3 días para reclamar tus 2 sorpresas de Roma», 3 días antes de que acabe el plazo de 30 días.
 *
 * El envío de verdad (aviso en el móvil o email) se enciende cuando estén la pantalla del permiso (paso 3 de Design) y el servicio de correo (falta el dominio).
 * Aviso en el móvil (web push): está preparado detrás de su interruptor `PUSH_ACTIVO=true`. Para que mande de verdad falta:
 *   1. instalar el paquete `web-push` (npm i web-push) — no está en el proyecto, para no cargar la web con algo que hoy no se usa;
 *   2. unas claves VAPID (npx web-push generate-vapid-keys) en las variables del servidor VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_CONTACTO (mailto:);
 *   3. la pantalla del permiso, que pide Design, para que la persona acepte los avisos y se guarde su suscripción (`push_suscripciones`);
 *   4. en iPhone, solo funciona con la web instalada en la pantalla de inicio (iOS 16.4 o más).
 */

export const pushActivo = (env = process.env) => String(env.PUSH_ACTIVO ?? '').toLowerCase() === 'true'

/** El texto de cada aviso. */
export function textoDeAviso(aviso) {
  const p = aviso.payload ?? {}
  if (aviso.tipo === 'quedan_dias') return { titulo: p.ciudad ? `${p.ciudad}: tus sorpresas te esperan` : 'Tus sorpresas te esperan', cuerpo: p.texto ?? `Te quedan ${p.dias ?? 3} días para reclamar tus sorpresas.` }
  return { titulo: 'Tu resumen del viaje ya está', cuerpo: 'Mira todo lo que has conseguido en tu viaje.' }
}

/**
 * Manda los avisos que ya tocan. Sin PUSH_ACTIVO, sin el paquete o sin las claves VAPID, NO manda nada y dice por qué (no marca nada como enviado).
 * @returns {{ enviados: number, motivo?: string }}
 */
export async function enviarAvisosPendientes({ repo, ahora = new Date(), env = process.env, cargarWebPush = () => import('web-push') }) {
  if (!pushActivo(env)) return { enviados: 0, motivo: 'apagado' }
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACTO } = env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_CONTACTO) return { enviados: 0, motivo: 'faltan_claves_vapid' }
  let webpush
  try {
    webpush = (await cargarWebPush()).default ?? (await cargarWebPush())
  } catch {
    return { enviados: 0, motivo: 'falta_el_paquete_web_push' }
  }
  webpush.setVapidDetails(VAPID_CONTACTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  let enviados = 0
  for (const aviso of await repo.avisosPendientes(ahora.toISOString())) {
    const subs = await repo.suscripcionesDe(aviso.user_id)
    if (subs.length === 0) continue // (sin permiso del móvil: más adelante saldrá por email)
    const texto = textoDeAviso(aviso)
    let alguno = false
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.claves }, JSON.stringify(texto))
        alguno = true
      } catch {
        /* una suscripción caducada no para al resto */
      }
    }
    if (alguno) {
      await repo.marcarAvisoEnviado(aviso.id, ahora.toISOString())
      enviados++
    }
  }
  return { enviados }
}
