/**
 * Compartir un enlace con la hoja del móvil (`navigator.share`); si el aparato no la tiene, se copia al portapapeles. Devuelve qué pasó para poder decirlo
 * («Enlace copiado»). Sin ventana (pruebas en el servidor) devuelve 'error'.
 */
export type ResultadoDeCompartir = 'compartido' | 'copiado' | 'cancelado' | 'error'

export async function compartirEnlace({ titulo, texto, url }: { titulo?: string; texto: string; url: string }): Promise<ResultadoDeCompartir> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: titulo, text: texto, url })
        return 'compartido'
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return 'cancelado'
        // otro fallo de la hoja: se intenta copiar
      }
    }
    await navigator.clipboard.writeText(`${texto}\n${url}`)
    return 'copiado'
  } catch {
    return 'error'
  }
}
