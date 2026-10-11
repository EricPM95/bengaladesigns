import type { PlacePhoto } from '../../lib/placePhoto'

/**
 * La línea de crédito de una foto de un lugar (Tanda 6y2: un solo sitio para la ficha de la parada y la esquina de las fotos grandes).
 *  · Unsplash: «Foto de {autor} en Unsplash», con los dos enlaces que exigen sus condiciones.
 *  · Wikipedia / Wikimedia Commons: «Foto: {autor} · {licencia}», solo con autor y licencia completos (las de dominio público, nada).
 *  · Las propias (`propia`) NO llevan crédito nunca (Tanda 6z6e).
 * Sin crédito completo no pinta NADA (ni una línea vacía ni a medias).
 */
export function hayCreditoDeFoto(photo: PlacePhoto | null | undefined): boolean {
  if (!photo?.attribution) return false
  if (photo.source === 'unsplash') return true
  return photo.source === 'wikipedia' && Boolean(photo.attribution.photographer && photo.attribution.license)
}

export function FotoCredito({ photo, className = 'text-caption text-text-muted', enlaceClassName = 'underline hover:text-text-soft' }: { photo: PlacePhoto | null | undefined; className?: string; enlaceClassName?: string }) {
  if (!photo || !hayCreditoDeFoto(photo) || !photo.attribution) return null
  const { attribution } = photo
  if (photo.source === 'unsplash') {
    return (
      <p className={className}>
        Foto de{' '}
        <a href={attribution.photographerUrl} target="_blank" rel="noreferrer" className={enlaceClassName}>
          {attribution.photographer}
        </a>{' '}
        en{' '}
        <a href={attribution.unsplashUrl} target="_blank" rel="noreferrer" className={enlaceClassName}>
          {attribution.site ?? 'Unsplash'}
        </a>
      </p>
    )
  }
  return (
    <p className={className}>
      Foto:{' '}
      {attribution.photographerUrl ? (
        <a href={attribution.photographerUrl} target="_blank" rel="noreferrer" className={enlaceClassName}>
          {attribution.photographer}
        </a>
      ) : (
        attribution.photographer
      )}{' '}
      · {attribution.license}
    </p>
  )
}
