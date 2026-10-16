/* El service worker mínimo (Tanda 8A). Hace posible instalar la web en el móvil y recibir avisos; NO guarda nada:
   sin modo sin conexión y sin copias de las respuestas del servidor, para no enseñar datos viejos. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()))

// (Sin `respondWith`: cada petición va a la red como siempre.)
self.addEventListener('fetch', () => {})

// Avisos al móvil (web push), cuando se enciendan: el servidor manda { titulo, cuerpo }.
self.addEventListener('push', (evento) => {
  let datos = { titulo: 'Tu viaje', cuerpo: '' }
  try {
    datos = { ...datos, ...evento.data.json() }
  } catch (e) {
    /* sin datos */
  }
  evento.waitUntil(self.registration.showNotification(datos.titulo, { body: datos.cuerpo, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' }))
})
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  evento.waitUntil(self.clients.matchAll({ type: 'window' }).then((ventanas) => (ventanas[0] ? ventanas[0].focus() : self.clients.openWindow('/'))))
})
