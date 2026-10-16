/**
 * Lo que se lee de una foto ANTES de quitarle los datos escondidos (cuentas, parte 1, punto 4): cuándo se hizo, dónde (si lleva ubicación) y si la hizo una cámara.
 * Se guarda aparte, en `trip_photo_meta`, porque los logros lo necesitarán (foto de cámara, fecha del viaje, sitio). La foto que se sube sale SIN estos datos.
 *
 * Lector mínimo de EXIF de un JPEG: solo la marca y el modelo, la fecha de la toma y el GPS. Pura (sin navegador): se prueba en Node. Nunca lanza: si no
 * entiende la foto devuelve todo vacío.
 */

export interface DatosDeFoto {
  /** Hora de reloj de la toma, «AAAA-MM-DDTHH:MM:SS» (sin zona, salvo que la foto la diga: entonces con «+02:00»). null si no la lleva. */
  tomadaEn: string | null
  lat: number | null
  lng: number | null
  /** Trae marca o modelo de cámara: las capturas de pantalla y las fotos bajadas de internet no los tienen. */
  conCamara: boolean
}

export const SIN_DATOS: DatosDeFoto = { tomadaEn: null, lat: null, lng: null, conCamara: false }

const TIPOS: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

export function leerDatosDeFoto(bytes: Uint8Array): DatosDeFoto {
  try {
    const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    if (bytes.length < 12 || vista.getUint16(0) !== 0xffd8) return { ...SIN_DATOS }
    // Buscar el segmento APP1 con «Exif\0\0».
    let i = 2
    let tiff = -1
    while (i + 4 < bytes.length) {
      if (bytes[i] !== 0xff) break
      const marcador = bytes[i + 1]
      if (marcador === 0xda || marcador === 0xd9) break
      const longitud = vista.getUint16(i + 2)
      if (marcador === 0xe1 && bytes[i + 4] === 0x45 && bytes[i + 5] === 0x78 && bytes[i + 6] === 0x69 && bytes[i + 7] === 0x66) {
        tiff = i + 10
        break
      }
      i += 2 + longitud
    }
    if (tiff < 0) return { ...SIN_DATOS }
    const little = vista.getUint16(tiff) === 0x4949
    const u16 = (pos: number) => vista.getUint16(pos, little)
    const u32 = (pos: number) => vista.getUint32(pos, little)

    type Entrada = { tipo: number; cuenta: number; pos: number }
    const leerIfd = (desde: number): Map<number, Entrada> => {
      const mapa = new Map<number, Entrada>()
      const inicio = tiff + desde
      if (inicio + 2 > bytes.length) return mapa
      const total = u16(inicio)
      for (let n = 0; n < total && n < 200; n++) {
        const e = inicio + 2 + n * 12
        if (e + 12 > bytes.length) break
        const tipo = u16(e + 2)
        const cuenta = u32(e + 4)
        const tamano = (TIPOS[tipo] ?? 1) * cuenta
        const pos = tamano <= 4 ? e + 8 : tiff + u32(e + 8)
        mapa.set(u16(e), { tipo, cuenta, pos })
      }
      return mapa
    }
    const texto = (e: Entrada | undefined): string | null => {
      if (!e || e.tipo !== 2 || e.pos + e.cuenta > bytes.length) return null
      let s = ''
      for (let k = 0; k < e.cuenta; k++) {
        const c = bytes[e.pos + k]
        if (c === 0) break
        s += String.fromCharCode(c)
      }
      return s.trim() || null
    }
    const racional = (pos: number): number => {
      const den = u32(pos + 4)
      return den === 0 ? 0 : u32(pos) / den
    }
    const grados = (e: Entrada | undefined): number | null => {
      if (!e || e.tipo !== 5 || e.cuenta < 3 || e.pos + 24 > bytes.length) return null
      return racional(e.pos) + racional(e.pos + 8) / 60 + racional(e.pos + 16) / 3600
    }

    const ifd0 = leerIfd(u32(tiff + 4))
    const conCamara = Boolean(texto(ifd0.get(0x010f)) || texto(ifd0.get(0x0110)))

    let tomadaEn: string | null = null
    const exifApunta = ifd0.get(0x8769)
    if (exifApunta) {
      const exif = leerIfd(u32(exifApunta.pos))
      const bruta = texto(exif.get(0x9003)) ?? texto(exif.get(0x9004))
      const m = bruta ? /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(bruta) : null
      if (m && m[1] !== '0000') {
        const zona = texto(exif.get(0x9011))
        tomadaEn = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${zona && /^[+-]\d{2}:\d{2}$/.test(zona) ? zona : ''}`
      }
    }

    let lat: number | null = null
    let lng: number | null = null
    const gpsApunta = ifd0.get(0x8825)
    if (gpsApunta) {
      const gps = leerIfd(u32(gpsApunta.pos))
      const la = grados(gps.get(0x0002))
      const lo = grados(gps.get(0x0004))
      const refLa = texto(gps.get(0x0001))
      const refLo = texto(gps.get(0x0003))
      if (la !== null && lo !== null && (la !== 0 || lo !== 0)) {
        lat = refLa === 'S' ? -la : la
        lng = refLo === 'W' ? -lo : lo
      }
    }
    return { tomadaEn, lat, lng, conCamara }
  } catch {
    return { ...SIN_DATOS }
  }
}
