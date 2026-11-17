// Un JPEG de mentira con los datos de una cámara de iPhone (marca, modelo, fecha de la toma y GPS), para las pruebas. Copiado de pruebaCuentas1.mjs (con `conGps: false`, una foto sin ubicación).
export function crearJpegConExif({ little = true, make = 'Apple', model = 'iPhone 15', fecha = '2026:10:11 10:30:15', zona = '+02:00', lat = [41, 53, 25.2], latRef = 'N', lng = [12, 29, 32], lngRef = 'E', conGps = true } = {}) {
  const u16 = (n) => (little ? [n & 255, n >> 8] : [n >> 8, n & 255])
  const u32 = (n) => (little ? [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255] : [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255])
  const ascii = (t) => [...Buffer.from(`${t}\0`, 'latin1')]
  // Cada entrada: { tag, tipo, cuenta, valor: bytes (ya completos) }. Los valores de más de 4 bytes van a la zona de datos.
  const bloque = (entradas, desde) => {
    const tabla = 2 + entradas.length * 12 + 4
    let datos = []
    const filas = []
    for (const e of entradas) {
      let valor
      if (e.valor.length <= 4) valor = [...e.valor, ...Array(4 - e.valor.length).fill(0)]
      else {
        valor = u32(desde + tabla + datos.length)
        datos = [...datos, ...e.valor]
        if (datos.length % 2) datos.push(0)
      }
      filas.push([...u16(e.tag), ...u16(e.tipo), ...u32(e.cuenta), ...valor])
    }
    return [...u16(entradas.length), ...filas.flat(), ...u32(0), ...datos]
  }
  const racional = (v, den) => [...u32(Math.round(v * den)), ...u32(den)]
  const gradosBytes = ([g, m, s]) => [...racional(g, 1), ...racional(m, 1), ...racional(s, 100)]
  const a = (tag, texto) => ({ tag, tipo: 2, cuenta: ascii(texto).length, valor: ascii(texto) })
  // Tamaños fijos para saber dónde cae cada bloque (la tabla de cada IFD y su zona de datos).
  const tamano = (entradas) => bloque(entradas, 0).length
  const exifEntradas = [a(0x9003, fecha), ...(zona ? [a(0x9011, zona)] : [])]
  const gpsEntradas = [a(0x0001, latRef), { tag: 0x0002, tipo: 5, cuenta: 3, valor: gradosBytes(lat) }, a(0x0003, lngRef), { tag: 0x0004, tipo: 5, cuenta: 3, valor: gradosBytes(lng) }]
  const ifd0Plantilla = (exif, gps) => [a(0x010f, make), a(0x0110, model), { tag: 0x8769, tipo: 4, cuenta: 1, valor: u32(exif) }, ...(conGps ? [{ tag: 0x8825, tipo: 4, cuenta: 1, valor: u32(gps) }] : [])]
  const tam0 = tamano(ifd0Plantilla(0, 0))
  const posExif = 8 + tam0
  const tamExif = tamano(exifEntradas)
  const posGps = posExif + tamExif
  const tiff = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8), ...bloque(ifd0Plantilla(posExif, posGps), 8), ...bloque(exifEntradas, posExif), ...(conGps ? bloque(gpsEntradas, posGps) : [])]
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  const len = app1.length + 2
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0x4a, 0x46, 0xff, 0xe1, len >> 8, len & 255, ...app1, 0xff, 0xda, 0, 2, 0xaa, 0xbb, 0xff, 0xd9])
}
