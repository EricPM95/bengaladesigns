/* El service worker (Tanda 8A: instalar y avisos; HOY1 apartado 9: la web abre SIN INTERNET).
   Guarda SOLO la propia web para poder abrirla sin cobertura: la página (HTML), el código con nombre único (/assets/), los iconos y las fuentes. NUNCA guarda respuestas de /api/ ni de la nube (Supabase,
   Mapbox…): esos datos viejos no se enseñan; lo de hoy (ruta, fichas, historias, billetes) lo guarda la propia app en el móvil (src/lib/sinConexion.ts).
   En localhost no guarda nada (el servidor de desarrollo cambia a cada momento); se puede probar con /sw.js?cache=1. */

const CACHE = 'trazo-web-v1'
const ENLOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname) && !self.location.search.includes('cache=1')
const CARPETAS = ['/icons/', '/marca/', '/logros/', '/medalla/', '/marcos/', '/fotos/', '/pelicula/', '/sonidos/']

/** Qué hacer con una petición: 'pagina' (red primero, la copia si no hay red), 'activo' (/assets/, nombre único: copia primero y no se vuelve a pedir) o 'fuente' (copia primero y se renueva por detrás); null = no tocarla. */
function queHacer(url, peticion, origen) {
  if (peticion.method !== 'GET') return null
  if (url.origin === origen) {
    if (url.pathname.startsWith('/api/')) return null
    if (peticion.mode === 'navigate') return 'pagina'
    if (url.pathname.startsWith('/assets/')) return 'activo'
    if (url.pathname === '/favicon.svg' || CARPETAS.some((c) => url.pathname.startsWith(c))) return 'fuente'
    return null
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return 'fuente'
  return null
}
self.queHacerConUnaPeticion = queHacer

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) =>
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .catch(() => undefined)
      .then(() => self.clients.claim()),
  ),
)

self.addEventListener('fetch', (evento) => {
  if (ENLOCAL) return // (Sin `respondWith`: cada petición va a la red como siempre.)
  const url = new URL(evento.request.url)
  const hacer = queHacer(url, evento.request, self.location.origin)
  if (!hacer) return
  if (hacer === 'pagina') {
    evento.respondWith(
      fetch(evento.request)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone()
            void caches.open(CACHE).then((c) => c.put('/', copia))
          }
          return respuesta
        })
        .catch(() => caches.match('/').then((copia) => copia || Response.error())),
    )
    return
  }
  evento.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(evento.request).then((copia) => {
        // Lo que tiene nombre único (/assets/, iconos…) no cambia: si hay copia, no se vuelve a pedir. Las fuentes se renuevan por detrás.
        if (copia && hacer === 'activo') return copia
        const red = fetch(evento.request)
          .then((respuesta) => {
            if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) void c.put(evento.request, respuesta.clone())
            return respuesta
          })
          .catch(() => copia || Response.error())
        return copia || red
      }),
    ),
  )
})

// Avisos al móvil (web push): el servidor manda { titulo, cuerpo, url, tag }. (HOY3: `tag` hace que un aviso repetido sustituya al anterior en vez de salir dos veces; los avisos del viaje llevan `url: '/?hoy=1'`.) El título es el nombre de la app (lo pone el servidor, de data/marca.json).
self.addEventListener('push', (evento) => {
  let datos = { titulo: 'Aviso', cuerpo: '', url: '/' }
  try {
    datos = { ...datos, ...evento.data.json() }
  } catch (e) {
    /* sin datos */
  }
  evento.waitUntil(self.registration.showNotification(datos.titulo, { body: datos.cuerpo, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: datos.url }, ...(datos.tag ? { tag: datos.tag } : {}) }))
})

// Al tocar el aviso se abre la app con la campanita abierta en ese aviso (`/?aviso=ID`); los avisos del viaje (HOY3, `/?hoy=1`) abren HOY. Si la app ya está abierta, se le dice por mensaje y no se recarga.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const url = (evento.notification.data && evento.notification.data.url) || '/'
  const parametros = new URL(url, self.location.origin).searchParams
  const id = parametros.get('aviso')
  const abrirHoy = parametros.get('hoy') === '1'
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      if (ventanas[0]) {
        if (abrirHoy) ventanas[0].postMessage({ tipo: 'hoy' })
        else ventanas[0].postMessage({ tipo: 'aviso', id })
        return ventanas[0].focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
