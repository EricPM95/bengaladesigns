import { useRef, useState, type CSSProperties } from 'react'
import type { Reservation } from '../../../lib/bookings'
import { leerEntrada, leerEntradasVarias, leerExcursion, type CodigoConNombre } from '../../../lib/billeteLeer'
import { conCodigo, repartirPorNombre, type TipoDeDocumento } from '../../../lib/entradasPorPersona'
import { useDocumentosDeLaEntrada } from '../../../hooks/useDocumentosDeLaEntrada'
import { useViajeCompartido } from '../../../store/useViajeCompartido'
import { estadoDelPaseParaDocumentos } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { BOTON_CLARO, BOTON_ORO } from '../../ui/botonesOro'
import { HojaAbajo } from './HojaAbajo'
import { HojaAnadirDocumento } from './HojaAnadirDocumento'
import type { CodigoDelBillete } from '../../../store/useBilleteStore'

/**
 * (V65 §2; Design «Añadir un documento» D7e) «LAS ENTRADAS DE CADA UNO»: la hoja que sale al pulsar «+ Sube tu entrada» en una entrada (o excursión: va EXACTAMENTE igual) de MÁS DE UNA persona.
 *   · Arriba, [Subir todas a la vez] (dorado; debajo, en gris, «Si tienes un solo archivo con todas, las repartimos por el nombre»): varios archivos o un PDF de varias páginas; se lee cada código y su nombre
 *     (`leerEntradasVarias`) y se reparte entre las personas por el nombre (`repartirPorNombre`, función pura). Las que no se saben colocar quedan en «Falta». Un solo código para todos: el mismo en todos los móviles.
 *   · Una fila por persona, con el nombre en grande: «✓ Subida» en verde y [Cambiar], o «Falta» en gris y [Subir]; los dos abren la hoja pequeña de la V64 (subir o escribir) para esa persona y, tras subir, «Revisa los datos».
 * Lo SUYO (su archivo, su nombre, su código) lo cambia cada uno desde su móvil sin pedir permiso; la hoja deja subir también el de otra persona de la misma entrada (así se reparte). Los documentos de la fila, solo los ve quien es de la entrada.
 */
const ETIQUETA: CSSProperties = { font: "700 14.5px 'Geist'", color: '#1C2230' }
const PIE: CSSProperties = { margin: 0, padding: '0 6px', textAlign: 'center', font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }

export function HojaEntradasDeCadaUno({ reserva, tipo = 'entrada', año, onClose }: { reserva: Reservation; tipo?: TipoDeDocumento; año?: number; onClose: () => void }) {
  const uso = useDocumentosDeLaEntrada(reserva, tipo)
  const gente = useViajeCompartido((s) => s.gente)
  const archivoUno = useRef<HTMLInputElement>(null)
  const archivoVarios = useRef<HTMLInputElement>(null)
  const quien = useRef<string>('')
  const [hojaPara, setHojaPara] = useState<string | null>(null)
  const [revisando, setRevisando] = useState<{ personaId: string; codigo: CodigoDelBillete | null; localizador: string | null; nombre: string | null; leido: boolean } | null>(null)
  const [leyendo, setLeyendo] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const clave = tipo === 'excursion' ? 'documento_excursion' : 'documento_entrada'
  const enComun = uso.modo === 'comun'
  const nombreDe = (id: string) => uso.lista.find((x) => x.personaId === id)?.nombre ?? ''
  const nombreCompleto = (id: string) => (gente.find((p) => p.id === id)?.nombre ?? '').trim()

  const sinPase = () => {
    if (estadoDelPaseParaDocumentos() !== 'sin') return false
    abrirAvisoPase(clave, {})
    return true
  }
  const pedirUno = (personaId: string) => {
    if (sinPase()) return
    quien.current = personaId
    if (archivoUno.current) {
      archivoUno.current.value = ''
      archivoUno.current.click()
    }
  }
  const alElegirUno = async (archivo: File | undefined) => {
    if (!archivo) return
    const personaId = quien.current
    setLeyendo(personaId)
    setMensaje(null)
    try {
      const lectura = tipo === 'excursion' ? await leerExcursion(archivo, { anioPorDefecto: año }) : await leerEntrada(archivo, { anioPorDefecto: año })
      const codigo = lectura.codigo ? { texto: lectura.codigo.texto, formato: lectura.codigo.formato, imagen: lectura.codigo.imagen, dibujo: lectura.codigo.dibujo ?? null } : null
      setRevisando({ personaId, codigo, localizador: lectura.localizador ?? null, nombre: nombreCompleto(personaId) || null, leido: true })
      if (!codigo) setMensaje(lectura.aviso ?? 'No hemos podido leer el código de este archivo. Ponlo a mano o prueba con una captura.')
    } catch {
      setRevisando({ personaId, codigo: null, localizador: null, nombre: nombreCompleto(personaId) || null, leido: true })
      setMensaje('No hemos podido leer este archivo. Ponlo a mano o prueba con una captura.')
    } finally {
      setLeyendo(null)
    }
  }
  const claveDe = (personaId: string) => (enComun ? 'comun' : personaId)
  const abrirParaEscribir = (personaId: string) => {
    const actual = uso.lista.find((x) => x.personaId === personaId)?.doc ?? null
    setRevisando({ personaId, codigo: actual?.codigo ?? null, localizador: actual?.localizador ?? null, nombre: actual?.nombre ?? (nombreCompleto(personaId) || null), leido: false })
  }

  const pedirVarios = () => {
    if (sinPase()) return
    if (archivoVarios.current) {
      archivoVarios.current.value = ''
      archivoVarios.current.click()
    }
  }
  const alElegirVarios = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return
    setLeyendo('todas')
    setMensaje(null)
    try {
      const leidos: CodigoConNombre[] = []
      let aviso: string | null = null
      for (const a of Array.from(archivos)) {
        const r = await leerEntradasVarias(a, { anioPorDefecto: año })
        leidos.push(...r.codigos)
        aviso = aviso ?? r.aviso
      }
      if (leidos.length === 0) {
        setMensaje(aviso ?? 'No hemos encontrado ningún código en los archivos. Súbelas una a una o escribe los datos.')
        return
      }
      const personas = uso.lista.map((x) => ({ id: x.personaId, nombre: nombreCompleto(x.personaId) || x.nombre }))
      const reparto = repartirPorNombre(
        leidos.map((c) => ({ nombre: c.nombre, codigo: c.codigo, localizador: c.localizador, origen: c.origen })),
        personas,
      )
      if (reparto.comun) {
        // Un solo QR para todos: el mismo en todos los móviles (los de cada uno, si los había, se quitan).
        for (const x of uso.lista) if (x.doc && x.doc.clave !== 'comun') uso.quitar(x.personaId)
        uso.guardar('comun', { codigo: reparto.comun.codigo, localizador: reparto.comun.localizador ?? null, personas: uso.lista.length, nombre: null })
        setMensaje(`Un solo código para ${uso.lista.length}: lo tienen todos en su móvil.`)
        return
      }
      if (enComun) uso.quitar('comun')
      let colocadas = 0
      for (const [personaId, c] of Object.entries(reparto.porPersona)) {
        if (!uso.puedeSubir(personaId)) continue
        uso.guardar(personaId, { codigo: c.codigo, localizador: c.localizador ?? null, personas: 1, nombre: c.nombre ?? (nombreCompleto(personaId) || null) })
        colocadas++
      }
      const faltan = uso.lista.filter((x) => !reparto.porPersona[x.personaId] && !conCodigo(x.doc)).map((x) => x.nombre)
      setMensaje(
        colocadas === 0
          ? 'No hemos sabido colocar ninguna por el nombre. Súbelas una a una con [Subir].'
          : faltan.length > 0
            ? `Hemos colocado ${colocadas} de ${uso.lista.length}. Faltan: ${faltan.join(', ')}.`
            : `Listas las ${uso.lista.length}: cada una en el móvil de su dueño.`,
      )
    } finally {
      setLeyendo(null)
    }
  }

  const guardarRevision = (r: NonNullable<typeof revisando>) => {
    if (enComun) uso.guardar('comun', { codigo: r.codigo, localizador: r.localizador, personas: uso.lista.length, nombre: r.nombre })
    else {
      uso.guardar(r.personaId, { codigo: r.codigo, localizador: r.localizador, personas: 1, nombre: r.nombre })
    }
    setRevisando(null)
  }

  return (
    <>
      <HojaAbajo titleId="hoja-entradas-de-cada-uno" onClose={onClose} capa={116}>
        <div data-hoja-entradas-de-cada-uno={tipo} className="flex flex-col gap-3">
          <h2 id="hoja-entradas-de-cada-uno" className="max-w-[calc(100%-3rem)] font-display text-[30px] leading-[1.05] text-text">
            Las entradas de cada uno
          </h2>
          <input ref={archivoUno} type="file" accept="application/pdf,image/*" hidden data-entradas-archivo="uno" onChange={(e) => void alElegirUno(e.target.files?.[0])} />
          <input ref={archivoVarios} type="file" accept="application/pdf,image/*" multiple hidden data-entradas-archivo="varios" onChange={(e) => void alElegirVarios(e.target.files)} />
          <button type="button" onClick={pedirVarios} disabled={leyendo !== null} data-entradas-subir-todas className="flex items-center justify-center gap-2.5" style={{ ...BOTON_ORO, border: 'none', height: 56, borderRadius: 18, font: "700 16px 'Geist'" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </svg>
            {leyendo === 'todas' ? 'Leyendo las entradas…' : 'Subir todas a la vez'}
          </button>
          <p style={{ ...PIE, marginTop: -4 }}>Si tienes un solo archivo con todas, las repartimos por el nombre</p>
          {mensaje && (
            <p role="status" data-entradas-mensaje style={{ ...PIE, color: '#1C2230' }}>
              {mensaje}
            </p>
          )}
          <div className="mt-1 flex flex-col gap-2" data-entradas-filas>
            {uso.lista.map((x) => {
              const subida = conCodigo(x.doc)
              const puede = uso.puedeSubir(x.personaId)
              return (
                <div key={x.personaId} data-entradas-fila={x.personaId} data-subida={subida ? 'si' : 'no'} className="flex items-center gap-3" style={{ padding: '12px 12px 12px 16px', borderRadius: 20, background: '#FFFDF8', border: subida ? '1px solid rgba(43,127,69,.4)' : '1px solid rgba(28,34,48,.12)' }}>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="[overflow-wrap:anywhere]" style={{ font: "400 26px/1.1 'Instrument Serif',serif" }}>
                      {x.nombre || 'Sin nombre'}
                    </span>
                    <span className="flex items-center gap-[5px]" style={{ font: "700 12.5px 'Geist'", color: subida ? '#1F6236' : 'rgba(28,34,48,.5)' }}>
                      {subida && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2B7F45" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                      {subida ? 'Subida' : 'Falta'}
                    </span>
                  </span>
                  {puede && (
                    <button
                      type="button"
                      onClick={() => {
                        if (sinPase()) return
                        quien.current = claveDe(x.personaId)
                        setHojaPara(x.personaId)
                      }}
                      disabled={leyendo !== null}
                      data-entradas-boton={subida ? 'cambiar' : 'subir'}
                      className="flex flex-none items-center"
                      style={{ ...BOTON_CLARO, height: 42, padding: '0 16px', borderRadius: 14, font: "700 14px 'Geist'" }}
                    >
                      {leyendo === x.personaId ? 'Leyendo…' : subida ? 'Cambiar' : 'Subir'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {uso.loComun === 'proponer' && <p style={PIE}>El día, la hora y para quién es los cambia quien administra el viaje; tú puedes proponer el cambio.</p>}
        </div>
      </HojaAbajo>
      {hojaPara && (
        <HojaAnadirDocumento
          clave={clave}
          titulo={hojaPara === uso.yoId ? undefined : `La entrada de ${nombreDe(hojaPara)}`}
          onSubir={() => {
            quien.current = hojaPara
            pedirUno(hojaPara)
          }}
          onEscribir={() => abrirParaEscribir(hojaPara)}
          onClose={() => setHojaPara(null)}
        />
      )}
      {revisando && <HojaRevisaLosDatos r={revisando} nombrePersona={nombreDe(revisando.personaId)} onChange={setRevisando} onGuardar={() => guardarRevision(revisando)} onClose={() => setRevisando(null)} />}
    </>
  )
}

/** «Revisa los datos» (tras subir) o «Datos de Alicia» (escribiendo): el nombre que lleva la entrada y el localizador, con [Guardar]. NADA se guarda hasta pulsarlo. */
function HojaRevisaLosDatos({ r, nombrePersona, onChange, onGuardar, onClose }: { r: { personaId: string; codigo: CodigoDelBillete | null; localizador: string | null; nombre: string | null; leido: boolean }; nombrePersona: string; onChange: (x: typeof r) => void; onGuardar: () => void; onClose: () => void }) {
  const campo = (etiqueta: string, valor: string, ejemplo: string, alCambiar: (v: string) => void, mayus: boolean, dato: string) => (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span style={ETIQUETA}>{etiqueta}</span>
      <input value={valor} onChange={(e) => alCambiar(e.target.value)} maxLength={60} placeholder={ejemplo} autoComplete="off" autoCapitalize={mayus ? 'characters' : 'words'} data-entradas-campo={dato} className={`h-[54px] w-full min-w-0 rounded-[15px] border bg-[#FFFDF8] px-3.5 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-text/40 focus:border-text/50 ${mayus ? 'uppercase' : ''}`} style={{ borderColor: 'rgba(28,34,48,.12)' }} />
    </label>
  )
  const hayCodigo = Boolean(r.codigo && (r.codigo.dibujo || r.codigo.imagen))
  return (
    <HojaAbajo
      titleId="hoja-entradas-revisa"
      onClose={onClose}
      capa={118}
      pie={
        <button type="button" onClick={onGuardar} data-entradas-guardar className="h-[54px] w-full" style={{ ...BOTON_ORO, border: 'none', borderRadius: 999, font: "700 16px 'Geist'" }}>
          {r.leido ? 'Guardar' : 'Guardar los datos'}
        </button>
      }
    >
      <h2 id="hoja-entradas-revisa" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text" data-hoja-titulo={r.leido ? 'revisa-los-datos' : 'datos-de-la-persona'}>
        {r.leido ? 'Revisa los datos' : `Datos de ${nombrePersona || 'la entrada'}`}
      </h2>
      <p className="mt-2 text-[14px] font-medium leading-[1.4] text-text/75" data-entradas-leida={hayCodigo ? 'si' : 'no'}>
        {r.leido ? (hayCodigo ? 'Hemos leído la entrada. Revisa los datos y cámbialos si hace falta' : 'No hemos podido leer el código de este archivo. Ponlo a mano o prueba con una captura.') : 'El nombre y el localizador que lleva la entrada.'}
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {campo('Nombre en la entrada', r.nombre ?? '', 'Eric Peña', (v) => onChange({ ...r, nombre: v || null }), false, 'nombre')}
        {campo('Localizador', r.localizador ?? '', 'ABC123', (v) => onChange({ ...r, localizador: v.trim() ? v : null }), true, 'localizador')}
      </div>
    </HojaAbajo>
  )
}
