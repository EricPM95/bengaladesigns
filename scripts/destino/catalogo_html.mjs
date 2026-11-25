// CATALOGO · arma docs/dias/CATALOGO_AVISOS.html con las capturas de docs/dias/CATALOGO_capturas/ (y su _manifiesto.json). No usa Chrome ni servidores:
//   node scripts/destino/catalogo_html.mjs
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.resolve('docs/dias/CATALOGO_capturas')
let M = {}
try {
  M = JSON.parse(fs.readFileSync(path.join(DIR, '_manifiesto.json'), 'utf8'))
} catch {
  /* sin manifiesto */
}
const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.jpg')).sort()
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SIN = 'No suena. (En HOY, el pase y RESERVAS la app no llama a ningún sonido: `sonar()` solo se pide en los momentos de logros, en la campana de avisos y en el [Visto].)'
const GRUPOS = [
  {
    t: 'El pase',
    items: [
      { k: ['pase_pregunta_medio_dia'], t: 'El día de prueba: «Te queda medio día…»', cuando: 'A las 12:00 del día de prueba, si la persona no tiene pase, tiene la prueba sin gastar y no ha usado HOY por la mañana. La pregunta es «¿Usas hoy tu día de prueba o lo guardas para mañana?».', cuantas: 'Una vez por día de prueba (el servidor decide; la prueba es una por cuenta, para siempre).', suena: SIN },
      { k: ['pase_hoy_es_prueba'], t: 'La franja «Hoy es tu día de prueba»', cuando: 'Durante todo el día de la prueba (de 00:00 a 23:59, hora del destino): HOY entero y, arriba, esta franja.', cuantas: 'Se ve todo el día; no es un aviso que se va.', suena: SIN },
      { k: ['pase_p3_dia_de_llegada'], t: 'La tarjeta P3: «¿Acabas de llegar?»', cuando: 'El día de llegada, sin pase y sin poder usar HOY (la prueba es otro día). Si la prueba es mañana, encima sale «Mañana es tu día de prueba».', cuantas: 'Cada vez que se abre HOY ese día (es una tarjeta fija, no un aviso).', suena: SIN },
      { k: ['pase_dia_12_que_tal_ayer'], t: 'La tarjeta del día 12: «¿Qué tal ayer con HOY?»', cuando: 'Durante el viaje, el día después de la prueba (o cualquier día posterior): [Ver el Pase] y los días que quedan.', cuantas: 'Cada día de HOY tras la prueba (tarjeta fija).', suena: SIN },
      { k: ['pase_prueba_gastada'], t: 'La prueba gastada: «Tu modo Hoy es parte del Pase Roma»', cuando: 'Sin pase, con la prueba ya gastada en OTRO viaje.', cuantas: 'Cada día de HOY de ese viaje (tarjeta fija).', suena: SIN },
      { k: ['pase_aviso_pequeno'], t: 'El aviso pequeño del pase («Desbloquéalo con el Pase…»)', cuando: 'Cuando alguien sin pase toca algo del pase (una segunda foto, escuchar otra historia, reservas, etc.).', cuantas: 'Una vez por toque; se cierra con la X.', suena: SIN },
    ],
  },
  {
    t: 'HOY',
    items: [
      { k: ['hoy_ya_no_da_tiempo'], t: '«Hoy ya no da tiempo a todo»', cuando: 'Con más de una hora de retraso, o al abrir HOY con la mañana ya pasada y nada hecho.', cuantas: 'Una vez al día (se apunta en el móvil por viaje y día).', suena: SIN },
      { k: ['hoy_ya_no_puedes_entrar_aviso', 'hoy_ya_no_puedes_entrar_hoja', 'hoy_ya_no_puedes_entrar_variante_sin_aviso'], t: '«Hoy ya no puedes entrar a…»', cuando: 'Cuando la última entrada de un sitio ya ha pasado (por ejemplo, Museos Vaticanos, última entrada 18:00, y son las 18:20). El enlace [Ver solución] abre la hoja de «Pasar a otro día».', cuantas: 'Una vez por viaje, día y sitio (`avisosUnaVez`).', suena: SIN },
      { k: ['hoy_navidad_tarjeta_temporada', 'hoy_navidad_avisos_de_fechas'], t: 'Fechas especiales: «Navidad en Roma» y los avisos de fechas', cuando: 'Si algún día del viaje cae del 26 de noviembre al 6 de enero (Navidad), en Semana Santa o el 21 de abril; y los avisos de fechas (1 de enero, etc.) que cierran o cambian horarios. Primero la tarjeta de temporada y, al cerrarla, el resto (una sola hoja cada vez).', cuantas: 'Una vez por viaje (se guarda que ya se enseñó).', suena: SIN },
      { k: ['hoy_lluvia_aviso', 'hoy_lluvia_plan'], t: 'La lluvia', cuando: 'Cuando el servidor da previsión de lluvia (más del 50 % de probabilidad o 0,5 mm) en las horas del plan al aire libre. Con [Plan de lluvia] se cambia lo de fuera por sitios cubiertos.', cuantas: 'Cada vez que se abre HOY con lluvia prevista; el plan se aplica o se deja.', suena: SIN },
      { k: ['hoy_fin_del_viaje_resumen', 'hoy_guarda_tus_recuerdos'], t: '«Lo que te llevas de tu viaje» y «Guarda tus recuerdos»', cuando: 'Después del viaje (HOY tras el último día), con las tres últimas fotos y los cuadros vacíos de rayas.', cuantas: 'Cada vez que se abre HOY una vez acabado el viaje (tarjeta fija).', suena: SIN },
      { k: ['hoy_estas_lejos'], t: '«Estás lejos de…»', cuando: 'Cuando la ubicación está a más de 50 km de todo el viaje. HOY cuenta con el tiempo del plan y no con el GPS.', cuantas: 'Mientras dure la distancia (recuadro fijo en la tarjeta de la parada).', suena: SIN },
      { k: ['hoy_activa_tu_ubicacion'], t: '«Activa tu ubicación»', cuando: 'Cuando la persona dijo que no a la ubicación y toca [Usar mi ubicación]. Sin pasos, solo [Entendido].', cuantas: 'Cada vez que toca el botón.', suena: SIN },
      { k: ['hoy_aviso_abajo_con_deshacer'], t: 'Aviso de abajo (con [Deshacer])', cuando: 'Cada vez que algo cambia la ruta: saltar, quitar, pasar a otro día, recuperar. Tapa el menú de abajo.', cuantas: 'Uno cada vez; no se junta con otro; se va solo.', suena: SIN },
      { k: ['hoy_aviso_arriba_foto_guardada', 'hoy_ya_no_puedes_entrar_estado_real'], t: 'Aviso de arriba (sin [Deshacer]): «Foto guardada» y «ya ha cerrado»', cuando: 'Cuando solo informa: un sitio que ya ha cerrado, «Enlace copiado», «Foto guardada». Bajo la cabecera.', cuantas: 'Se va solo a los 5 s; si hay varios se juntan; cada aviso sale una vez por viaje, día y sitio.', suena: SIN },
    ],
  },
  {
    t: 'Logros y momentos',
    items: [
  {
    "f": [
      "logros_coliseo_01"
    ],
    "t": "Los pedazos («Pedazos nuevos»)",
    "cuando": "Al tocar [Visto] en un sitio que forma parte de una colección: cada colección suma su pedazo (aquí, el Coliseo en «Los imprescindibles», «Las 4 joyas» y «La Roma antigua»).",
    "cuantas": "Una vez por pedazo ganado (nunca se repite un sitio ya visto).",
    "suena": "Sí. Campana alegre (mixkit-happy-bell-alert, de Eric en el estudio), una por pedazo y cada una un poco más aguda; si hay una, dos o tres colecciones suena su versión (pedazo, pedazo_dos, pedazo_tres). Al tocar [Seguir] o saltar, se corta con un fundido corto."
  },
  {
    "f": [
      "logros_fila_01"
    ],
    "t": "«Un pedazo nuevo» (una sola colección)",
    "cuando": "Cuando el [Visto] da un pedazo de una sola colección (o dos de la misma): pantalla con la insignia y «1 de 8», «2 de 8»…",
    "cuantas": "Una vez por [Visto] que suma.",
    "suena": "Sí. Campana alegre (mixkit-happy-bell-alert, de Eric en el estudio), una por pedazo y cada una un poco más aguda; si hay una, dos o tres colecciones suena su versión (pedazo, pedazo_dos, pedazo_tres). Al tocar [Seguir] o saltar, se corta con un fundido corto."
  },
  {
    "f": [
      "logros_coliseo_02",
      "logros_coliseo_03"
    ],
    "t": "El emblema oculto",
    "cuando": "Al estar en un sitio con secreto (aquí, el Coliseo con su maravilla): primero la frase de espera con los latidos y el estallido, y después la película del emblema. Los secretos de Roma salen solo cuando se encuentran.",
    "cuantas": "Una vez por emblema en la vida de la cuenta (después se repite solo desde Logros, sin suspense).",
    "suena": "Sí. Subida dramática (dragon-studio-dramatic-riser), latidos de los aros (toque), estallido y la banda de la película. Si la persona salta la escena, se corta con un fundido."
  },
  {
    "f": [
      "logros_coliseo_04"
    ],
    "t": "La medalla (del destino)",
    "cuando": "Cuando el destino sube de grado: bronce con el primer imprescindible, plata con 4, oro con 6, diamante con 8 de 8.",
    "cuantas": "Una vez por grado.",
    "suena": "Sí. Cada grado tiene su sonido: bronce «shine», plata, oro y diamante una subida (hi-tech-reveal-riser), más el sello de goma. La de oro y la de plata empiezan antes del primer fotograma y la pantalla espera ese rato."
  },
  {
    "f": [
      "logros_coliseo_05",
      "logros_petra_01"
    ],
    "t": "La medalla de maravilla («Una maravilla nueva»)",
    "cuando": "Al ganar una de las 7 maravillas del mundo (1.ª a 6.ª, cada una con su pantalla). La 7.ª tiene su propio final.",
    "cuantas": "Una vez por maravilla.",
    "suena": "Sí. Destello sweeping-sparkle (maravilla nueva); la 4.ª, con su versión propia."
  },
  {
    "f": [
      "logros_coliseo_06",
      "logros_viajeros_01"
    ],
    "t": "«Y además…»",
    "cuando": "Cuando en el mismo [Visto] se ganan varias cosas pequeñas (país nuevo, destino nuevo, Patrimonio, escalones de viajero): se juntan en una sola pantalla en vez de varias.",
    "cuantas": "Una vez por [Visto] con 2 o más de estas cosas.",
    "suena": "Sí. Suena la más importante de las que salen (país, Patrimonio o viajero: destello); no suena una por cada una."
  },
  {
    "f": [
      "logros_fila_02"
    ],
    "t": "La barra de experiencia y subir de nivel",
    "cuando": "Al final de la ronda de lo ganado: «+405 EXP», la barra del nivel y, si cruza, «¡Subes a nivel 2 · Explorador!».",
    "cuantas": "Una vez por ronda, tras el resumen del día.",
    "suena": "No tiene sonido propio en el código (sonar() no se llama en esa pantalla); lo que suena justo antes son los pedazos. Solo el resumen del día y del viaje hacen sonar los números que suben (dia_completo, con el tic)."
  },
  {
    "f": [
      "logros_petra_02"
    ],
    "t": "Patrimonio (pantalla suelta de una serie)",
    "cuando": "Tras la maravilla, el Patrimonio de la Humanidad número N.",
    "cuantas": "Una vez por Patrimonio.",
    "suena": "Sí: destello sweeping-sparkle."
  },
  {
    "f": [
      "logros_final7_01"
    ],
    "t": "El final de las 7 maravillas",
    "cuando": "Solo con la 7.ª maravilla.",
    "cuantas": "Una vez en la vida de la cuenta.",
    "suena": "Sí: el sonido de «maravilla»."
  }
],
  },
  {
    t: 'RESERVAS',
    items: [
      { k: ['reservas_aviso_naranja_documento'], t: 'El aviso naranja de un documento', cuando: 'Cuando se sube un billete o una tarjeta de embarque cuya fecha no cuadra con la del viaje. Línea naranja DENTRO de la tarjeta, junto al QR, con [Es correcta].', cuantas: 'Se queda hasta cambiar el documento o pulsar [Es correcta]. No es ventana.', suena: SIN },
      { k: ['reservas_e1_dias_cambian'], t: 'El mensaje de los días que cambian (E1)', cuando: 'Al guardar una excursión o una entrada en otro día: el día de excursión se mueve y los demás se recolocan.', cuantas: 'Una vez por cambio; con [De acuerdo] y [Deshacer] (abajo, tapando el menú).', suena: SIN },
      { k: ['reservas_reorganizar_boton', 'reservas_reorganizar_alerta', 'reservas_reorganizar_hecho'], t: '«Reorganizar»', cuando: 'Con pase, cuando un cambio (un vuelo, una reserva, un Free Tour) hace que un día se pueda mejorar: sale el botón redondo (columna de la izquierda); al tocarlo, «¿Reorganizamos tu día?»; al aceptar, el día se recoloca con [Deshacer].', cuantas: 'El botón se queda hasta reorganizar o hasta que el día deje de necesitarlo; la alerta, una vez por toque.', suena: SIN },
    ],
  },
]

const usados = new Set()
const figura = (f) => {
  usados.add(f)
  const m = Object.values(M).find((x) => x.archivo === f) ?? {}
  return `<figure><img src="CATALOGO_capturas/${f}" alt="${esc(f)}" width="390" loading="lazy"><figcaption>${esc(f)}${m.aria ? ` · «${esc(m.aria)}»` : ''}${m.dudoso ? ' · (revisar: puede no verse el aviso)' : ''}</figcaption></figure>`
}
let html = ''
let hechas = 0
let huecos = 0
for (const g of GRUPOS) {
  html += `<h2>${esc(g.t)}</h2>`
  for (const it of g.items) {
    let fs_ = []
    if (it.f) fs_ = archivos.filter((f) => it.f.some((x) => f.startsWith(x)))
    else if (it.p) fs_ = archivos.filter((f) => f.startsWith(it.p))
    else fs_ = (it.k ?? []).map((k) => M[k]?.archivo).filter((f) => f && archivos.includes(f))
    fs_ = fs_.filter((f) => !Object.values(M).some((x) => x.archivo === f && x.dudoso))
    const motivos = (it.k ?? []).map((k) => M[k]?.motivo).filter(Boolean)
    let cuerpo
    if (fs_.length) {
      hechas++
      cuerpo = `<div class="caps">${fs_.map(figura).join('')}</div>`
    } else {
      huecos++
      cuerpo = `<div class="hueco">NO SE PUDO PROVOCAR: ${esc((it.k ?? []).includes('reservas_aviso_naranja_documento') ? 'la captura salió con la tarjeta de embarque plegada (el aviso se pone bien con ponerAvisoDeDocumento, pero la tarjeta de Llegada y vuelta no se desplegó): el guion ya está corregido y falta repetirlo (la cola de Chrome estuvo ocupada por la batería durante horas). Repetir con: node scripts/destino/_conCola.mjs node scripts/destino/catalogo_reservas.mjs naranja.' : (it.k ?? []).includes('pase_pregunta_medio_dia') ? 'la pregunta se vio en una captura suelta de la primera pasada (hoja «Te queda medio día…» sobre la tarjeta P3, ver pase_p3 de esa pasada) pero esa captura se sobrescribió; el guion está corregido y falta repetirlo: node scripts/destino/_conCola.mjs node scripts/destino/catalogo_pase.mjs pregunta. Aviso: la pone el servidor real a las 12:00 y es una hoja con [Hoy] [Mañana].' : motivos.join(' | ') || 'la captura no salió en esta pasada (mira el informe de la noche).')}</div>`
    }
    html += `<section><h3>${esc(it.t)}</h3><div class="fila">${cuerpo}<div class="txt"><p><b>Cuándo sale:</b> ${esc(it.cuando)}</p><p><b>Cuántas veces:</b> ${esc(it.cuantas)}</p><p><b>Si suena:</b> ${esc(it.suena)}</p></div></div></section>`
  }
}
const sueltas = archivos.filter((f) => !usados.has(f))
if (sueltas.length) html += `<h2>Otras capturas de la pasada</h2><div class="caps">${sueltas.map(figura).join('')}</div>`

const pagina = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Catálogo de avisos y momentos</title><style>body{font:14px/1.45 system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:16px;color:#1C2230}h2{border-bottom:2px solid #D8BE84;padding-bottom:4px;margin-top:34px}section{border:1px solid #ddd;border-radius:12px;padding:10px 14px;margin:14px 0;background:#fffdf8}.fila{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}.caps{display:flex;gap:10px;flex-wrap:wrap}figure{margin:0}img{width:260px;height:auto;border:1px solid #ccc;border-radius:14px}figcaption{font-size:11px;color:#666;max-width:260px;word-break:break-all}.txt{flex:1;min-width:260px}.hueco{width:260px;min-height:120px;border:2px dashed #c9a24a;border-radius:14px;padding:14px;color:#7a5a10;background:#fff7dc}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}</style>
<h1>Catálogo de avisos y momentos que casi nunca salen</h1>
<p>Capturas en modo iPhone (390 x 844), con el día simulado de HOY y el viaje de pruebas de Roma (17 al 20 de octubre de 2026), en desarrollo. Hechas con lo que ya existe (<code>window.__rutaPrueba</code>, <code>__horaFalsa</code>, <code>__momentos</code>, <code>__pruebaDelPase</code>…); no se ha cambiado nada de la app. <b>${hechas} con captura · ${huecos} sin captura.</b></p>
<p><b>Resumen de sonidos:</b> la app solo hace sonar los momentos de logros (<code>src/lib/sonidos.ts</code>, lo de Eric en <code>data/sonidos/estudio.json</code>), la campanita <code>aviso</code> cuando llega un aviso nuevo a la campana (una vez cada cierto tiempo) y el toque de [Visto]. Los avisos y hojas de HOY, el pase y RESERVAS no suenan.</p>
${html}</html>`
fs.writeFileSync(path.resolve('docs/dias/CATALOGO_AVISOS.html'), pagina)
console.log(`CATALOGO_AVISOS.html: ${hechas} con captura, ${huecos} sin captura, ${sueltas.length} sueltas`)
