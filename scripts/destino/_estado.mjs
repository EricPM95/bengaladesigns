// Escribe la nota de estado de la tanda y la sube a la rama «estado» de GitHub, SOLO con ese archivo (Eric, 28-oct: la conexión de Claude con su PC no funciona).
//   node scripts/destino/_estado.mjs 10N8 "Qué estoy haciendo" "Qué falta"
// · No toca main, ni la carpeta de trabajo, ni el índice de git: construye el commit con un índice temporal (git plumbing) y lo sube con `git push origin estado` (sin --force: cada nota es un commit nuevo encima del anterior).
// · La nota lleva arriba: hora de la última actualización, qué se está haciendo, qué falta, y cuántos procesos de node y de Chrome de prueba hay abiertos.
// · El archivo `docs/dias/_estado_<tanda>.md` está en .git/info/exclude para que NUNCA entre en el commit de la tanda a main.
import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [tanda = '10N8', haciendo = '(sin detalle)', falta = '(sin detalle)'] = process.argv.slice(2)
const archivo = `docs/dias/_estado_${tanda.toLowerCase()}.md`
const git = (args, extra = {}) => execFileSync('git', args, { encoding: 'utf8', ...extra }).trim()

function contarProcesos() {
  try {
    const salida = execSync(
      `powershell -NoProfile -Command "$n = @(Get-CimInstance Win32_Process -Filter \\"Name='node.exe'\\").Count; $e = @(Get-CimInstance Win32_Process -Filter \\"Name='esbuild.exe'\\").Count; $c = @(Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -match 'remote-debugging-port' -and $_.CommandLine -notmatch '--type=' }).Count; \\"$n $e $c\\""`,
      { encoding: 'utf8' }
    ).trim()
    const [node, esbuild, chrome] = salida.split(/\s+/).map(Number)
    return { node, esbuild, chrome }
  } catch {
    return { node: '?', esbuild: '?', chrome: '?' }
  }
}

const p = contarProcesos()
const ahora = new Date()
const hora = ahora.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
const texto = `# Estado de la tanda ${tanda}

**Última actualización: ${hora}**
(Se actualiza cada ~30 min mientras Claude está activo y se sube a la rama \`estado\` de GitHub. Si esta hora es de hace más de 40-50 minutos, Claude no está trabajando.)

## Qué está haciendo
${haciendo}

## Qué falta
${falta}

## Procesos abiertos ahora mismo
- node: ${p.node}
- esbuild: ${p.esbuild}
- Chrome de prueba (con remote-debugging-port): ${p.chrome}
`
fs.mkdirSync(path.dirname(archivo), { recursive: true })
fs.writeFileSync(archivo, texto)

// Commit con SOLO este archivo, sin tocar índice ni carpeta de trabajo ni main.
const indiceTemporal = path.join(os.tmpdir(), `indice_estado_${process.pid}`)
const env = { ...process.env, GIT_INDEX_FILE: indiceTemporal }
try {
  const blob = git(['hash-object', '-w', archivo])
  git(['read-tree', '--empty'], { env })
  git(['update-index', '--add', '--cacheinfo', `100644,${blob},${archivo.replace(/\\/g, '/')}`], { env })
  const arbol = git(['write-tree'], { env })
  let padre = null
  try {
    git(['fetch', 'origin', 'estado'], { stdio: 'ignore' })
    padre = git(['rev-parse', 'refs/remotes/origin/estado'])
  } catch {
    try {
      padre = git(['rev-parse', '--verify', 'refs/heads/estado'])
    } catch {
      padre = null
    }
  }
  const mensaje = `estado ${tanda}: ${hora}\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
  const args = ['commit-tree', arbol, ...(padre ? ['-p', padre] : []), '-m', mensaje]
  const commit = git(args, { env })
  git(['update-ref', 'refs/heads/estado', commit])
  const salida = git(['push', 'origin', 'refs/heads/estado:refs/heads/estado'], { stdio: ['ignore', 'pipe', 'pipe'] })
  console.log(`Nota subida a la rama estado (${commit.slice(0, 8)}) a las ${hora}. node=${p.node} esbuild=${p.esbuild} chrome=${p.chrome}`)
  if (salida) console.log(salida)
} finally {
  try {
    fs.rmSync(indiceTemporal, { force: true })
  } catch {
    /* nada */
  }
}
