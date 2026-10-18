/* El service worker mínimo (Tanda 8A, avisos en la cuentas parte 3). Hace posible instalar la web en el móvil y recibir avisos; NO guarda nada:
   sin modo sin conexión y sin copias de las respuestas del servidor, para no enseñar datos viejos. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()))

// (Sin `respondWith`: cada petición va a la red como siempre.)
self.addEventListener('fetch', () => {})

// Avisos al móvil (web push): el servidor manda { titulo, cuerpo, url }. El título es el nombre de la app (lo pone el servidor, de data/marca.json).
self.addEventListener('push', (evento) => {
  let datos = { titulo: 'Aviso', cuerpo: '', url: '/' }
  try {
    datos = { ...datos, ...evento.data.json() }
  } catch (e) {
    /* sin datos */
  }
  evento.waitUntil(self.registration.showNotification(datos.titulo, { body: datos.cuerpo, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: datos.url } }))
})

// Al tocar el aviso se abre la app con la campanita abierta en ese aviso (`/?aviso=ID`). Si la app ya está abierta, se le dice por mensaje y no se recarga.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const url = (evento.notification.data && evento.notification.data.url) || '/'
  const id = new URL(url, self.location.origin).searchParams.get('aviso')
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      if (ventanas[0]) {
        ventanas[0].postMessage({ tipo: 'aviso', id })
        return ventanas[0].focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
