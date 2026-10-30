// Devuelve la carpeta de un build de producción RECIÉN HECHO (10S): las pruebas de peso nunca miden un dist viejo.
// Se construye en una carpeta temporal (no toca ./dist) y se reutiliza mientras nada de src/, shared/, data/marca.json, index.html,
// vite.config.ts, tailwind/postcss ni package.json sea más nuevo que ese build. Tarda ~22 s cuando hay que construir (0 s si ya está al día).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const RAIZ = path.resolve(import.meta.dirname, '..', '..')
const DESTINO = path.join(os.tmpdir(), 'app-rutas-dist-peso')

function masNuevo(p, tope = 0) {
  let m = tope
  if (!fs.existsSync(p)) return m
  const st = fs.statSync(p)
  if (!st.isDirectory()) return Math.max(m, st.mtimeMs)
  for (const n of fs.readdirSync(p)) m = Math.max(m, masNuevo(path.join(p, n), m))
  return m
}

export function distFresco() {
  const fuentes = ['src', 'shared', 'data/marca.json', 'index.html', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'package.json', 'public/icons'].map((f) => path.join(RAIZ, f))
  const cambio = fuentes.reduce((m, f) => masNuevo(f, m), 0)
  const indice = path.join(DESTINO, 'index.html')
  if (fs.existsSync(indice) && fs.statSync(indice).mtimeMs > cambio) return DESTINO
  const t0 = Date.now()
  execFileSync(process.execPath, [path.join(RAIZ, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', DESTINO, '--emptyOutDir', '--logLevel', 'error'], { cwd: RAIZ, stdio: 'inherit' })
  console.log(`   (dist recién construido en ${DESTINO}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`)
  return DESTINO
}
