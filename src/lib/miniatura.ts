/**
 * LA MINIATURA DE UNA FOTO PROPIA (Tanda 8A2). Design pone la foto pequeña de cada sitio en todas las listas de paradas, en vez del círculo con ✓. Cada foto propia
 * (public/fotos/<destino>/<foto>.jpg, y su versión de tarjeta <foto>_p.jpg) tiene una miniatura WebP de 144 px en public/fotos/<destino>/mini/<foto>.webp
 * (`node scripts/generarMiniaturas.mjs`; unos 4 KB cada una). Esto traduce la dirección de la foto grande o pequeña a la de su miniatura; el servidor también la manda
 * ya hecha en `photo_mini` cuando existe.
 */

/** La miniatura de una foto propia (`/fotos/roma/foo.jpg`, `foo_p.jpg`, con o sin `?v=`), o null si no es una foto propia. */
export function urlMiniatura(url: string | null | undefined): string | null {
  if (!url) return null
  const m = /^(\/fotos\/[^/]+)\/([^/?]+?)(?:_p)?\.jpg(\?.*)?$/.exec(url)
  return m ? `${m[1]}/mini/${m[2]}.webp${m[3] ?? ''}` : null
}
