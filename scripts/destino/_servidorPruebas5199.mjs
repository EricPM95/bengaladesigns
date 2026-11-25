// Servidor de la app para las pruebas, en el puerto 5199 (el mismo Vite estable que arranca la batería, pero lanzado desde un guion propio).
// Motivo (noche 24-nov): otros agentes reinician SU Vite (5173) matando todo proceso cuya línea de órdenes contiene «vite»; el de la batería caía con ellos a mitad de pasada.
// Este guion no lleva «vite» en su línea de órdenes, así que sobrevive a esa limpieza.
//   node scripts/destino/_servidorPruebas5199.mjs     (y a la batería: APP_URL=http://localhost:5199 node scripts/destino/bateriaParalela.mjs sinvite=1 …)
import { createServer } from 'vite'

process.env.API_TARGET = process.env.API_TARGET ?? 'http://localhost:8787'
const servidor = await createServer({ configFile: 'scripts/destino/_vite_estable.config.mjs', server: { port: 5199, strictPort: true } })
await servidor.listen()
console.log('servidor de pruebas en http://localhost:5199')
