// Punto de entrada de la función serverless de Vercel — reexporta la app Express de
// server/index.js tal cual (mismos endpoints, misma lógica). Vercel la invoca por request en vez de
// mantenerla escuchando con app.listen() (eso solo pasa en desarrollo local, ver el guard
// `if (!process.env.VERCEL)` en server/index.js). vercel.json reescribe todo /api/* hacia esta
// función para que el enrutado interno de Express (app.post('/api/generate-route', ...), etc.) siga
// resolviendo por la ruta completa.
export { default } from '../server/index.js'
