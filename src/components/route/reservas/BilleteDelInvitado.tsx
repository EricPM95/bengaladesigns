import { useRef, useState } from 'react'
import type { MiTramo } from '../../../lib/loSuyo'
import { leerBillete } from '../../../lib/billeteLeer'
import { useBillete } from '../../../hooks/useBillete'
import { useBilleteStore, type LegDelBillete } from '../../../store/useBilleteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { diaEntero } from '../../../lib/billete'
import { CodigoPantallaCompleta, ImagenDelCodigo } from './TarjetaBillete'
import { EliminarTexto } from './BloqueReservas'

/**
 * EL BILLETE DE QUIEN NO ES EL ADMINISTRADOR (10S5): debajo de su tarjeta «Llegada y vuelta», para su ida y su vuelta, [Añadir tarjeta de embarque] (o su billete), el mismo billete privado que el del administrador
 * (solo en su móvil y en su fila privada de la 0070; nadie más lo ve). Aquí el archivo se lee y se guarda directo: código, asiento, localizador y terminal. Las horas y los aeropuertos ya los puso en su vuelo.
 */
function UnTramo({ kind, tramo, medio, yoId }: { kind: LegDelBillete; tramo: MiTramo; medio: 'avion' | 'tren' | 'bus' | 'ferry'; yoId: string | null }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const { billete } = useBillete(kind, null)
  const poner = useBilleteStore((s) => s.poner)
  const quitar = useBilleteStore((s) => s.quitar)
  const archivo = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [ampliado, setAmpliado] = useState(false)
  const esIda = kind === 'arrival'
  const nombre = medio === 'avion' ? 'tarjeta de embarque' : 'billete'
  const conCodigo = Boolean(billete?.codigo && (billete.codigo.dibujo || billete.codigo.imagen))
  const alElegir = async (f: File | undefined) => {
    if (!f) return
    setLeyendo(true)
    try {
      const d = await leerBillete(f, { modo: medio })
      poner(tripId, kind, {
        horaRoma: null,
        localizador: d.localizador,
        terminal: d.origen.terminal,
        asiento: d.asiento,
        coche: d.coche,
        codigo: d.codigo ? { texto: d.codigo.texto, formato: d.codigo.formato, imagen: d.codigo.imagen, dibujo: d.codigo.dibujo ?? null } : null,
        codigoFuera: esIda ? d.origen.codigo : d.destino.codigo,
        dueno: yoId,
      })
    } finally {
      setLeyendo(false)
    }
  }
  const datos = [billete?.asiento ? `Asiento ${billete.asiento}` : null, billete?.coche ? `Coche ${billete.coche}` : null, billete?.terminal ? `Terminal ${billete.terminal}` : null, billete?.localizador ? `Localizador ${billete.localizador}` : null].filter(Boolean)
  return (
    <div className="flex flex-col gap-2 border-t border-dotted pt-3" style={{ borderColor: 'rgba(28,34,48,.28)' }} data-billete-invitado={kind}>
      <span style={{ font: "600 13.5px 'Geist'" }}>{esIda ? 'Tu ida' : 'Tu vuelta'}</span>
      {datos.length > 0 && <span className="text-[13px] text-text/70" data-billete-invitado-datos>{datos.join(' · ')}</span>}
      {conCodigo && billete?.codigo ? (
        <button type="button" onClick={() => setAmpliado(true)} data-billete-codigo-pequeno className="flex items-center gap-3.5 text-left">
          <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
            <ImagenDelCodigo codigo={billete.codigo} tam={64} />
          </span>
          <span style={{ font: "600 13px 'Geist'", color: '#6E5018' }}>Toca para ampliar</span>
        </button>
      ) : (
        <>
          <button type="button" onClick={() => archivo.current?.click()} disabled={leyendo} data-billete-anadir className="flex h-[46px] items-center justify-center rounded-[15px] text-[15px] font-bold" style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510' }}>
            {leyendo ? 'Leyendo…' : medio === 'avion' ? 'Añadir tarjeta de embarque' : 'Añadir tu billete'}
          </button>
          <span className="text-center text-[12.5px] text-text/55">Desde el PDF, una foto o una captura.</span>
        </>
      )}
      {billete && <EliminarTexto alinear="derecha" onClick={() => quitar(tripId, kind)} texto={`Quitar mi ${nombre}`} />}
      <input ref={archivo} type="file" accept="application/pdf,image/*" hidden data-billete-archivo onChange={(e) => void alElegir(e.target.files?.[0])} />
      {ampliado && billete?.codigo && (
        <CodigoPantallaCompleta codigo={billete.codigo} titulo={esIda ? 'Tu ida' : 'Tu vuelta'} cuando={[diaEntero(tramo.fecha), tramo.hora].filter(Boolean).join(' · ')} pie={[billete.asiento ? `Asiento ${billete.asiento}` : null, tramo.codigo ? `${medio === 'avion' ? 'Vuelo' : 'Tren'} ${tramo.codigo.toUpperCase()}` : null].filter(Boolean).join(' · ')} onClose={() => setAmpliado(false)} />
      )}
    </div>
  )
}

export function BilleteDelInvitado({ ida, vuelta, medio, yoId }: { ida: MiTramo | null; vuelta: MiTramo | null; medio: 'avion' | 'tren' | 'bus' | 'ferry'; yoId: string | null }) {
  if (!ida && !vuelta) return null
  return (
    <div className="flex flex-col gap-3" data-billete-del-invitado>
      {ida && <UnTramo kind="arrival" tramo={ida} medio={medio} yoId={yoId} />}
      {vuelta && <UnTramo kind="departure" tramo={vuelta} medio={medio} yoId={yoId} />}
    </div>
  )
}
