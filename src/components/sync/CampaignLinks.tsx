import { useEffect } from 'react'
import { withCampaign } from '../../lib/affiliateLinks'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * Pone el código de campaña del viaje abierto en todos los enlaces de «Reservar» (los de Civitatis) justo antes de que se sigan (clic, clic del
 * medio, menú del botón derecho): así ninguna pantalla se olvida de llevarlo y la app no tiene que repetirlo en cada enlace.
 * PARA_CODE_RESERVAS, 5.
 */
/**
 * (V35B) Cuenta los clics en «Reservar» (Civitatis = actividad; Stay22 / hoteles = hotel) por destino, tipo y día. SIN saber quién: el aviso no lleva cuenta, ni el servidor guarda IP. Nunca estorba al enlace (aviso suelto y sin esperar).
 */
const clasificar = (link: HTMLAnchorElement): { tipo: 'actividad' | 'hotel'; proveedor: 'civitatis' | 'stay22' } | null => {
  const href = link.href || ''
  if (/civitatis\.com/i.test(href)) return { tipo: 'actividad', proveedor: 'civitatis' }
  if (link.hasAttribute('data-hotel') || /stay22\.com/i.test(href)) return { tipo: 'hotel', proveedor: 'stay22' }
  return null
}
export function avisarDelClic(destino: string, tipo: 'actividad' | 'hotel', proveedor: 'civitatis' | 'stay22'): void {
  try {
    const cuerpo = JSON.stringify({ destino: String(destino).slice(0, 60), tipo, proveedor })
    const w = window as unknown as { __clicsAfiliados?: unknown[] }
    ;(w.__clicsAfiliados ??= []).push(JSON.parse(cuerpo))
    if (navigator.sendBeacon?.('/api/afiliados/clic', new Blob([cuerpo], { type: 'application/json' }))) return
    void fetch('/api/afiliados/clic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true, credentials: 'omit' }).catch(() => undefined)
  } catch {
    /* nunca estorba */
  }
}

export function CampaignLinks() {
  useEffect(() => {
    const contar = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null
      const que = link ? clasificar(link) : null
      if (!link || !que) return
      const rotulo = (link.closest('[data-destino-nombre]') as HTMLElement | null)?.getAttribute('data-destino-nombre')
      const destino = rotulo || useRouteStore.getState().route?.destination || ''
      if (destino) avisarDelClic(destino, que.tipo, que.proveedor)
    }
    for (const name of ['click', 'auxclick'] as const) document.addEventListener(name, contar, true)
    const stamp = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href*="civitatis.com"]') as HTMLAnchorElement | null
      if (!link) return
      // (Sin viaje abierto también: el código de afiliado va siempre; el de campaña, solo con viaje.)
      const { campaignCode, route } = useRouteStore.getState()
      const stamped = withCampaign(link.href, route ? campaignCode : null)
      if (stamped !== link.href) link.href = stamped
    }
    // (Solo en desarrollo: para probar una venta de ejemplo con el código del viaje abierto.)
    if (import.meta.env.DEV) (window as unknown as { __tripCampaign?: () => string }).__tripCampaign = () => useRouteStore.getState().campaignCode
    for (const name of ['click', 'auxclick', 'contextmenu'] as const) document.addEventListener(name, stamp, true)
    return () => {
      for (const name of ['click', 'auxclick'] as const) document.removeEventListener(name, contar, true)
      for (const name of ['click', 'auxclick', 'contextmenu'] as const) document.removeEventListener(name, stamp, true)
    }
  }, [])
  return null
}
