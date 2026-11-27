import { useEffect, useState } from 'react'
import { ICONOS } from '../../../lib/iconos'
import { createPortal } from 'react-dom'
import type { LegState } from '../../../lib/reservasLegs'
import { diaEntero } from '../../../lib/billete'
import type { BilleteGuardado, CodigoDelBillete } from '../../../store/useBilleteStore'
import { Icono } from '../../ui/Icono'
import { iconoDeMedio, INK } from './BloqueReservas'
import { BotonAnadirDocumento, LineaNaranjaDeDocumento, IconoDeDocumento, LapizDeReserva, PapeleraRoja, claveDocumentoDeMedio } from './BotonesDeReserva'
import { CajaDeDato } from './PiezasDesignReservas'
import { DORADO } from '../../ui/botonesOro'
import { puntoCorto } from '../../../lib/arrivalReturn'
import { queEliminarTramo } from '../../../lib/queEliminar'

/**
 * LA MITAD DEL VUELO (O DEL TREN…) EN RESERVAS, con su billete (Tanda 10S5 §4; 10S8 §3, `Piezas/Billete Reservas` B1b a B3). Todo lo del billete es de esta persona (se guarda en su móvil y se ve sin internet). Por bloques:
 *   1. El día y las horas: «IDA · Jueves 26 noviembre» con su lápiz (abre la hoja del vuelo), la hora grande (sin tarjeta, «Llegas a las 11:25»; con ella, las dos horas) y el trayecto.
 *   2. Los datos (solo con tarjeta o con datos puestos): vuelo, duración, terminal, asiento, localizador, con su lápiz («Datos del vuelo»).
 *   3. El código en pequeño con «Toca para ampliar»; o, sin él, [Añadir tarjeta de embarque] (con el candado sin pase). Sin duración calculada, sin «Desde el PDF…» y sin «Cambiar los datos».
 *   4. (V75) La papelera roja que quita ese lado va ARRIBA a la derecha, tras el QR y el lápiz.
 */
const PUNTEADA = '1px dotted rgba(28,34,48,.28)'

/** Los dibujos de las filas, los del diseño (avión, reloj, terminal, asiento, tren, billete). */
const DIBUJO = {
  avion: <path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z" />,
  tren: <path d={ICONOS.tren} />,
  reloj: <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />,
  terminal: <path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6" />,
  asiento: <path d="M8 4v8h7l2 5M8 12v6M13 12v6" />,
  coche: <path d="M4 7h16v10H4zM4 12h16M9 7v10" />,
  billete: <path d={ICONOS.pase} />,
}

export interface FilaDeDato {
  clave: string
  texto: string
  dibujo: keyof typeof DIBUJO
}

/**
 * Los datos en su fila con su nombre: «Vuelo VY 6102», «1 h 55 min», «Terminal 1», «Asiento 14C», «Localizador ABC123» (tren: «Tren 03180», «3 h 2 min», «Coche 003», «Asiento 01D»). Solo los que haya.
 * (10S8) La duración calculada solo se pasa con la tarjeta puesta: sin tarjeta no sale.
 */
export function filasDelBillete(leg: Pick<LegState, 'mode' | 'codigo'>, billete: BilleteGuardado | null, duracion: string | null): FilaDeDato[] {
  const palabra = leg.mode === 'avion' ? 'Vuelo' : leg.mode === 'tren' ? 'Tren' : leg.mode === 'bus' ? 'Autobús' : 'Barco'
  const filas: FilaDeDato[] = []
  if (leg.codigo) filas.push({ clave: 'numero', texto: `${palabra} ${leg.codigo.toUpperCase()}`, dibujo: leg.mode === 'avion' ? 'avion' : 'tren' })
  if (duracion) filas.push({ clave: 'duracion', texto: duracion, dibujo: 'reloj' })
  if (billete?.terminal) filas.push({ clave: 'terminal', texto: /^terminal/i.test(billete.terminal) ? billete.terminal : `Terminal ${billete.terminal}`, dibujo: 'terminal' })
  if (billete?.coche) filas.push({ clave: 'coche', texto: /^coche/i.test(billete.coche) ? billete.coche : `Coche ${billete.coche}`, dibujo: 'coche' })
  if (billete?.asiento) filas.push({ clave: 'asiento', texto: /^asiento/i.test(billete.asiento) ? billete.asiento : `Asiento ${billete.asiento}`, dibujo: 'asiento' })
  if (billete?.localizador) filas.push({ clave: 'localizador', texto: `Localizador ${billete.localizador.toUpperCase()}`, dibujo: 'billete' })
  return filas
}

/**
 * (V64 §3; Design «Billete Datos» B1-B3) LAS CAJAS DE «DATOS DEL VUELO» (o del tren…): SEIS cajas en TRES filas de dos: COMPAÑÍA / VUELO, TERMINAL / ASIENTO, DURACIÓN / LOCALIZADOR (tren: COMPAÑÍA / TREN, ESTACIÓN / ASIENTO, DURACIÓN / LOCALIZADOR).
 * Una caja SIN DATO no sale y las demás se recolocan sin huecos (B2). La duración es la de las horas reales (la calcula quien llama; sin tarjeta no sale). Solo los datos que haya; nunca uno inventado.
 */
export interface CajaDelBillete {
  clave: string
  rotulo: string
  valor: string
  /** El trazo del icono (los de Design). */
  d: string
}
export const D_CAJAS = {
  compania: 'M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18',
  vuelo: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  tren: 'M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 11h16M8 21l2-3M16 21l-2-3M8.5 14.5h.01M15.5 14.5h.01',
  terminal: 'M4 21V9l8-5 8 5v12M9 21v-7h6v7',
  estacion: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  asiento: 'M7 4h6a2 2 0 0 1 2 2v7H7zM15 13h3a2 2 0 0 1 2 2v3H9M9 18v3M18 18v3',
  duracion: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  localizador: 'M3 7h18v10H3zM9 7v10M13 10h4M13 14h3',
}
export function cajasDelBillete(leg: Pick<LegState, 'kind' | 'mode' | 'codigo' | 'compania' | 'otroPunto' | 'point'>, billete: BilleteGuardado | null, duracion: string | null): CajaDelBillete[] {
  const avion = leg.mode === 'avion'
  const conCoche = leg.mode === 'tren' || leg.mode === 'bus'
  const esIda = leg.kind === 'arrival'
  const cajas: CajaDelBillete[] = []
  const pon = (clave: string, rotulo: string, valor: string | null | undefined, d: string) => {
    const v = (valor ?? '').trim()
    if (v) cajas.push({ clave, rotulo, valor: v, d })
  }
  pon('compania', leg.mode === 'ferry' ? 'NAVIERA' : 'COMPAÑÍA', leg.compania, D_CAJAS.compania)
  pon('numero', avion ? 'VUELO' : leg.mode === 'tren' ? 'TREN' : leg.mode === 'bus' ? 'AUTOBÚS' : 'BARCO', leg.codigo?.toUpperCase(), avion ? D_CAJAS.vuelo : D_CAJAS.tren)
  // El lado por donde se sale: fuera en la ida (el otro punto) y Roma en la vuelta (el punto elegido). Entre paréntesis, «Barcelona (El Prat)» → «El Prat».
  const lugarDeSalida = esIda ? (leg.otroPunto ?? '') : leg.point ? puntoCorto(leg.point) : ''
  if (avion) {
    const t = (billete?.terminal ?? '').trim().replace(/^terminal\s*/i, '')
    const aeropuerto = esIda ? (/\(([^)]+)\)/.exec(lugarDeSalida)?.[1] ?? '') : lugarDeSalida
    pon('terminal', 'TERMINAL', t ? `${/^[0-9A-Za-z]{1,2}$/.test(t) ? `T${t.toUpperCase()}` : t}${aeropuerto ? ` · ${aeropuerto}` : ''}` : null, D_CAJAS.terminal)
  } else if (lugarDeSalida) {
    pon('estacion', leg.mode === 'ferry' ? 'PUERTO' : 'ESTACIÓN', lugarDeSalida, D_CAJAS.estacion)
  }
  const coche = conCoche ? (billete?.coche ?? '').trim().replace(/^coche\s*/i, '') : ''
  const asiento = (billete?.asiento ?? '').trim().replace(/^asiento\s*/i, '')
  pon('asiento', 'ASIENTO', [coche ? `Coche ${coche}` : '', asiento].filter(Boolean).join(' · '), D_CAJAS.asiento)
  pon('duracion', 'DURACIÓN', duracion, D_CAJAS.duracion)
  pon('localizador', 'LOCALIZADOR', billete?.localizador?.toUpperCase(), D_CAJAS.localizador)
  return cajas
}

/** (V64 §3) El rótulo y la frase del bloque oscuro del documento: «TARJETA DE EMBARQUE · Enséñala en la puerta»; tren «TU BILLETE · Enséñalo al revisor»; ferry «Enséñalo al embarcar»; autobús «Enséñalo al conductor». */
export function textoDelDocumento(mode: LegState['mode']): { rotulo: string; frase: string } {
  if (mode === 'avion') return { rotulo: 'TARJETA DE EMBARQUE', frase: 'Enséñala en la puerta' }
  return { rotulo: 'TU BILLETE', frase: mode === 'ferry' ? 'Enséñalo al embarcar' : mode === 'bus' ? 'Enséñalo al conductor' : 'Enséñalo al revisor' }
}

/** El código en una imagen (el recorte guardado). Sin imagen, nada. */
export function ImagenDelCodigo({ codigo, tam, datos }: { codigo: CodigoDelBillete; tam: number; datos?: string }) {
  const fuente = codigo.dibujo ?? codigo.imagen
  if (!fuente) return null
  return <img src={fuente} alt="Código de tu billete" width={tam} height={tam} data-codigo-imagen={datos} style={{ width: tam, height: tam, objectFit: 'contain', display: 'block', background: '#fff', imageRendering: codigo.dibujo ? 'auto' : 'pixelated' }} />
}

/** Dibuja el código: la imagen guardada (el recorte, o el que la app redibujó al leerlo). */
function CodigoDibujado({ codigo, tam }: { codigo: CodigoDelBillete; tam: number }) {
  return <ImagenDelCodigo codigo={codigo} tam={tam} />
}

/** La cabecera de una mitad: «IDA» / «VUELTA», el día y el lápiz de arriba (la hoja del vuelo). `onToggle`: la Ida plegada (B2c) se abre y se cierra tocando su línea. */
export function CabeceraDeMitad({ leg, fecha, resto, onCambiar, onToggle, pasada, documento, onQuitar, rotulo, clave }: { /** (V76) «IDA · 1 DE 2»: el rótulo de un tramo cuando hay escalas (sin él, «IDA» / «VUELTA»), y la clave de sus iconos (`escala-arrival-0`; sin ella, la mitad). */ rotulo?: string; clave?: string; /** (V75) La papelera, la tercera tras el QR y el lápiz. */ onQuitar?: () => void; /** (V45 §1) El QR junto al lápiz: gris con «+» si falta la tarjeta, dorado si está (al tocarlo, en grande). */ documento?: { hay: boolean; onAbrir: () => void }; leg: Pick<LegState, 'kind' | 'mode'>; fecha: string; /** (B2c) Lo que va tras el día en la línea plegada: «11:25 · Fiumicino». */ resto?: string; onCambiar: () => void; onToggle?: () => void; pasada?: boolean }) {
  const esIda = leg.kind === 'arrival'
  const contenido = (
    <>
      <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-[11px]" style={{ background: '#1C2230', color: '#F3D88F', font: "700 11px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
        <Icono nombre={iconoDeMedio(leg.mode)} size={12} />
        {rotulo ?? (esIda ? 'IDA' : 'VUELTA')}
      </span>
      <span className={resto ? "min-w-0 flex-1" : "min-w-0 flex-auto whitespace-nowrap"} style={{ font: "600 14px 'Geist'", color: INK, textAlign: 'left' }} data-mitad-fecha>
        {fecha}
        {resto ? <span data-mitad-resumen> · {resto}</span> : null}
      </span>
    </>
  )
  return (
    <div className="flex items-center gap-2.5" data-mitad-cabecera={leg.kind}>
      {onToggle ? (
        <button type="button" onClick={onToggle} aria-expanded={!pasada} data-mitad-plegable={leg.kind} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 border-none bg-transparent p-0">
          {contenido}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">{contenido}</span>
      )}
      <span className="-my-2 -mr-2.5 flex flex-none items-center">
        {documento && <IconoDeDocumento hay={documento.hay} onAbrir={documento.onAbrir} datos={`vuelo-${clave ?? leg.kind}`} />}
        <LapizDeReserva onClick={onCambiar} etiqueta={`Cambiar ${rotulo ? 'este tramo' : esIda ? 'la ida' : 'la vuelta'}`} datos={`mitad-${clave ?? leg.kind}`} atributos={{ 'data-cambiar-mitad': '' }} />
        {onQuitar && <PapeleraRoja onClick={onQuitar} etiqueta={`Quitar ${rotulo ? 'este tramo' : esIda ? 'la ida' : 'la vuelta'}`} que={rotulo ? `tu escala ${leg.kind === 'arrival' ? 'de la ida' : 'de la vuelta'}` : queEliminarTramo(leg.mode, esIda)} datos={`mitad-${clave ?? leg.kind}`} atributos={{ 'data-eliminar': 'derecha' }} />}
      </span>
    </div>
  )
}

export function TarjetaBillete({
  leg,
  trayecto,
  fecha,
  billete,
  duracion,
  horaFuera,
  onCambiar,
  onQuitar,
  onAnadirTarjeta,
  onAmpliar,
  onDatos,
  onToggle,
  avisoDeFecha,
  rotulo,
  clave,
}: {
  /** (V76) Un tramo de un vuelo con escala: «IDA · 1 DE 2» y la clave de sus iconos. */
  rotulo?: string
  clave?: string
  leg: LegState
  trayecto: string
  fecha: string
  billete: BilleteGuardado | null
  duracion: string | null
  /** La hora del lado de fuera (salida de la ida / llegada de la vuelta), si el viajero la puso o el billete la trae. */
  horaFuera: string | null
  /** El lápiz de arriba: la hoja del vuelo (horas, aeropuertos). */
  onCambiar: () => void
  onQuitar: () => void
  onAnadirTarjeta: () => void
  onAmpliar: () => void
  /** El lápiz del bloque de datos: «Datos del vuelo». */
  onDatos?: () => void
  /** (B2c) Con la Ida ya pasada, tocar la cabecera la pliega. */
  onToggle?: () => void
  /** (V45 §6) «⚠ Esta tarjeta es del viernes 13 y tu vuelo es el lunes 23. Revisa que sea la buena» con [Es correcta]: dentro de la tarjeta, junto al QR. */
  avisoDeFecha?: { texto: string; onCorrecta: () => void } | null
}) {
  const esIda = leg.kind === 'arrival'
  const conCodigo = Boolean(billete?.codigo && (billete.codigo.dibujo || billete.codigo.imagen))
  // (10S8, B1b) Sin tarjeta ni datos guardados: solo la hora grande y el trayecto (ni fila de datos ni su lápiz). Con datos (o con la tarjeta): sus filas y el lápiz de «Datos del vuelo».
  // (10S9b §1) Lo escrito a mano en «Datos del vuelo» (localizador, terminal, asiento, coche) ya cuenta igual que lo leído del documento: guarda la misma fila privada y abre el bloque con su lápiz. El número del vuelo solo NO lo abre (viene también de la hoja del vuelo, «Ref. vuelo»).
  const conDatos = conCodigo || Boolean(leg.codigo) || Boolean(leg.compania) || Boolean(billete && (billete.localizador || billete.terminal || billete.asiento || billete.coche))
  const cajas = conDatos ? cajasDelBillete(leg, billete, conCodigo ? duracion : null) : []
  const doc = textoDelDocumento(leg.mode)
  const botonTexto = leg.mode === 'avion' ? 'Añade tu tarjeta de embarque' : 'Añade tu billete'
  const iconoMedio = iconoDeMedio(leg.mode)
  const horas = horaFuera ? (esIda ? [horaFuera, leg.time] : [leg.time, horaFuera]) : null
  return (
    <div data-mitad={clave ?? leg.kind} {...(rotulo ? { 'data-tramo': rotulo } : {})} data-mitad-hecha="1" data-billete-privado={conCodigo ? 'con-codigo' : 'sin-codigo'} className="mx-3.5 mb-3 flex flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)' }}>
      <CabeceraDeMitad leg={leg} fecha={fecha} onCambiar={onCambiar} onToggle={onToggle} documento={{ hay: conCodigo, onAbrir: onAmpliar }} onQuitar={onQuitar} rotulo={rotulo} clave={clave} />

      {horas ? (
        <div className="flex items-center gap-2" data-billete-horas>
          <span className="min-w-0 flex-1" style={{ font: "400 38px/1 'Instrument Serif',serif" }} data-billete-hora-izq>
            {horas[0]}
          </span>
          <span aria-hidden="true" className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: '1.5px solid #B58A2E', color: '#8E6820' }}>
            <Icono nombre={iconoMedio} size={15} style={{ transform: leg.mode === 'avion' ? 'rotate(45deg)' : undefined }} />
          </span>
          <span className="min-w-0 flex-1 text-right" style={{ font: "400 38px/1 'Instrument Serif',serif" }} data-billete-hora-der>
            {horas[1]}
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2.5" data-billete-horas>
          <span style={{ font: "400 15px 'Geist'", color: 'rgba(28,34,48,.65)' }}>{esIda ? 'Llegas a las' : 'Sales a las'}</span>
          <span style={{ font: "400 44px/1 'Instrument Serif',serif" }} data-billete-hora-sola>
            {leg.time}
          </span>
        </div>
      )}

      <span data-billete-trayecto style={{ font: "500 14px 'Geist'", color: 'rgba(28,34,48,.7)', marginTop: horas ? -4 : 0 }}>
        {trayecto}
      </span>

      {cajas.length > 0 && (
        <div className="flex flex-col gap-2" data-billete-datos style={{ borderTop: PUNTEADA, paddingTop: 12 }}>
          <div className="flex items-center justify-between">
            <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>DATOS DEL {leg.mode === 'avion' ? 'VUELO' : leg.mode === 'tren' ? 'TREN' : leg.mode === 'bus' ? 'AUTOBÚS' : 'FERRY'}</span>
            {onDatos && (
              <span className="-my-1.5 -mr-2.5 flex-none">
                <LapizDeReserva onClick={onDatos} etiqueta={`Cambiar los datos del ${leg.mode === 'avion' ? 'vuelo' : 'billete'}`} datos="datos-billete" atributos={{ 'data-billete-cambiar-datos': '' }} />
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2" data-billete-filas>
            {cajas.map((c) => (
              <span key={c.clave} data-billete-fila={c.clave} className="min-w-0">
                <CajaDeDato rotulo={c.rotulo} icono={{ d: c.d }} datos={c.clave}>
                  {c.valor}
                </CajaDeDato>
              </span>
            ))}
          </div>
        </div>
      )}

      {avisoDeFecha && <LineaNaranjaDeDocumento texto={avisoDeFecha.texto} onCorrecta={avisoDeFecha.onCorrecta} clave={claveDocumentoDeMedio(leg.mode)} onSubir={onAnadirTarjeta} onEscribir={onDatos} />}
      {conCodigo && billete?.codigo ? (
        // (V64 §3) El bloque oscuro del documento: la línea de corte con sus muescas, el código en su cuadro blanco, «TARJETA DE EMBARQUE · Enséñala en la puerta» y [Ampliar].
        <>
          <div aria-hidden="true" className="relative -mx-4 h-0" style={{ borderTop: '1.5px dashed rgba(181,138,46,.6)' }}>
            <span className="absolute -left-[9px] -top-[10px] h-[18px] w-[18px] rounded-full" style={{ background: '#FFFDF8' }} />
            <span className="absolute -right-[9px] -top-[10px] h-[18px] w-[18px] rounded-full" style={{ background: '#FFFDF8' }} />
          </div>
          <div data-billete-codigo-pequeno className="flex items-center gap-3.5 rounded-[20px] p-3.5" style={{ background: 'linear-gradient(160deg,#232A3C,#1C2230)', boxShadow: '0 16px 24px -18px rgba(28,34,48,.9)' }}>
            <button type="button" onClick={onAmpliar} aria-label="Ampliar el código" data-billete-codigo-qr className="flex-none rounded-[14px] border-none bg-white p-2">
              <CodigoDibujado codigo={billete.codigo} tam={92} />
            </button>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>{doc.rotulo}</span>
              <span style={{ font: "400 21px/1.15 'Instrument Serif',serif", color: '#FFFDF8' }}>{doc.frase}</span>
              <button type="button" onClick={onAmpliar} data-billete-ampliar className="flex h-[34px] items-center gap-[7px] self-start rounded-xl border-none px-[13px] text-[12.5px] font-bold" style={{ background: DORADO, color: '#4A3510' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
                </svg>
                Ampliar
              </button>
            </span>
          </div>
        </>
      ) : (
        // (V53 §4) [+ Añade tu tarjeta de embarque] ocupa su fila; la papelera (V75) ya no va abajo: está arriba, tras el QR y el lápiz.
        <div style={{ borderTop: cajas.length === 0 ? PUNTEADA : undefined, paddingTop: cajas.length === 0 ? 12 : 0 }}>
          <BotonAnadirDocumento estilo="borde" texto={botonTexto} clave={claveDocumentoDeMedio(leg.mode)} onAnadir={onAnadirTarjeta} datos={`vuelo-${clave ?? leg.kind}`} aMano={onDatos} />
        </div>
      )}
    </div>
  )
}

/**
 * EL CÓDIGO A PANTALLA COMPLETA (B4): fondo blanco, el código lo más grande posible, el trayecto y la hora arriba, «Asiento 14C · Vuelo VY 6102» abajo y la ✕. Desde la web no se puede subir el brillo del móvil.
 */
export function CodigoPantallaCompleta({ codigo, titulo, cuando, pie, onClose }: { codigo: CodigoDelBillete; titulo: string; cuando: string; pie: string; onClose: () => void }) {
  const [lado, setLado] = useState(() => (typeof window === 'undefined' ? 320 : Math.min(window.innerWidth - 48, window.innerHeight - 260, 560)))
  useEffect(() => {
    const medir = () => setLado(Math.max(180, Math.min(window.innerWidth - 48, window.innerHeight - 260, 560)))
    medir()
    window.addEventListener('resize', medir)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Tu código" data-billete-pantalla-completa className="fixed inset-0 flex flex-col items-center px-6" style={{ zIndex: 300, background: '#fff', color: INK, paddingTop: 'max(18px, env(safe-area-inset-top))', paddingBottom: 'max(22px, env(safe-area-inset-bottom))' }}>
      <button type="button" onClick={onClose} aria-label="Cerrar" data-billete-cerrar className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ top: 'max(14px, env(safe-area-inset-top))', background: '#FFFDF8', border: '1.5px solid #B58A2E' }}>
        <Icono nombre="cerrar" size={18} style={{ color: '#8E6820' }} />
      </button>
      <div className="mt-[62px] flex flex-col gap-1.5 text-center">
        <span style={{ font: "400 28px/1.1 'Instrument Serif',serif" }} data-billete-grande-titulo>
          {titulo}
        </span>
        <span style={{ font: "500 15px 'Geist'", color: 'rgba(28,34,48,.65)' }} data-billete-grande-cuando>
          {cuando}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <ImagenDelCodigo codigo={codigo} tam={lado} datos="grande" />
      </div>
      <span style={{ font: "600 15px 'Geist'" }} data-billete-grande-pie>
        {pie}
      </span>
    </div>,
    document.body,
  )
}

export { diaEntero }
