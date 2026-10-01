import { useEffect } from 'react'
import { withCampaign } from '../../lib/affiliateLinks'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * Pone el código de campaña del viaje abierto en todos los enlaces de «Reservar» (los de Civitatis) justo antes de que se sigan (clic, clic del
 * medio, menú del botón derecho): así ninguna pantalla se olvida de llevarlo y la app no tiene que repetirlo en cada enlace.
 * PARA_CODE_RESERVAS, 5.
 */
export function CampaignLinks() {
  useEffect(() => {
    const stamp = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href*="civitatis.com"]') as HTMLAnchorElement | null
      if (!link) return
      const { campaignCode, route } = useRouteStore.getState()
      if (!route) return
      const stamped = withCampaign(link.href, campaignCode)
      if (stamped !== link.href) link.href = stamped
    }
    // (Solo en desarrollo: para probar una venta de ejemplo con el código del viaje abierto.)
    if (import.meta.env.DEV) (window as unknown as { __tripCampaign?: () => string }).__tripCampaign = () => useRouteStore.getState().campaignCode
    for (const name of ['click', 'auxclick', 'contextmenu'] as const) document.addEventListener(name, stamp, true)
    return () => {
      for (const name of ['click', 'auxclick', 'contextmenu'] as const) document.removeEventListener(name, stamp, true)
    }
  }, [])
  return null
}
