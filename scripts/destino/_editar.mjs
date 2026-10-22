// Ayudante de edición (Tanda 11): sustituye textos exactos en un archivo respetando su fin de línea (en esta máquina muchos archivos están en CRLF) y avisa si no encuentra uno.
//   editar(ruta, [[viejo, nuevo], …], { todos: true })   → los textos se escriben con «\n»; el archivo conserva su CRLF o LF.
import fs from 'node:fs'

export function editar(ruta, pares, { todos = false } = {}) {
  const crudo = fs.readFileSync(ruta, 'utf8')
  const crlf = crudo.includes('\r\n')
  let s = crlf ? crudo.replace(/\r\n/g, '\n') : crudo
  let fallos = 0
  for (const [viejo, nuevo] of pares) {
    if (!s.includes(viejo)) {
      console.error(`NO ENCONTRADO en ${ruta}: ${viejo.slice(0, 100).replace(/\n/g, '⏎')}`)
      fallos++
      continue
    }
    s = todos ? s.split(viejo).join(nuevo) : s.replace(viejo, () => nuevo)
  }
  fs.writeFileSync(ruta, crlf ? s.replace(/\n/g, '\r\n') : s)
  return fallos
}
