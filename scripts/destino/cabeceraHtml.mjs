// Toda página HTML que genera un script empieza por `<!doctype html>` y `<meta charset="utf-8">`: sin eso, en Windows los acentos salen rotos.
// Se aplica a lo que sale de la plantilla (la simulación a mano no lleva cabecera), no a cada página por separado.
export function conCabecera(html) {
  let salida = String(html)
  if (!/^\s*<!doctype html>/i.test(salida)) salida = `<!doctype html>\n${salida}`
  if (!/<meta\s+charset=/i.test(salida)) salida = salida.replace(/^(\s*<!doctype html>\s*(?:<html[^>]*>\s*)?)/i, (cabecera) => `${cabecera}${/<html/i.test(cabecera) ? '' : '<html lang="es">\n'}<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n`)
  return salida
}
