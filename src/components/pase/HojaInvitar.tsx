import { useEffect, useState } from 'react'
import { compartirEnlace } from '../../lib/compartirEnlace'
import { enlaceDeInvitacion, invitacionDelViaje, PLAZAS_SIN_PASE } from '../../lib/invitaciones'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { usePersonasStore } from '../../store/usePersonasStore'
import { CarasDelViaje } from '../compartir/CarasDelViaje'
import { Icono } from '../ui/Icono'
import { nombreDelTipo, textoDeCompartirPase, type PaseMio } from '../../lib/pagoPase'
import { TextoConPase } from '../cuenta/TextoConPase'
import { BotonHoja, Hoja } from '../ui/Hoja'

/**
 * LA HOJA DEL ENLACE Y EL CÓDIGO (cuentas parte 3). Es la misma hoja para:
 *   · P7, compartir el pase («Únete a mi Pase Roma», «1 de 2 usados»), con un Pase Dúo o Grupo;
 *   · RS2, compartir el viaje desde RUTA («Invita a tu viaje a Roma»), con o sin pase (con un Dúo o Grupo, la misma hoja que P7 y el invitado entra con su plaza).
 * El código es el de siempre: ocho caracteres que se leen bien en voz alta (sin 0, O, 1, I ni L). El invitado entra sin pagar nada: paga todo el que compra.
 * `codigoInicial` solo lo usan las capturas y la prueba.
 */
export function HojaInvitar({
  modo,
  destino,
  tripId,
  pase,
  onCerrar,
  codigoInicial = null,
}: {
  modo: 'pase' | 'viaje'
  destino: string
  tripId: string | null
  pase: PaseMio | null
  onCerrar: () => void
  codigoInicial?: string | null
}) {
  const conPase = pase != null && pase.tipo !== 'uno' && pase.estado === 'activo'
  const [codigo, setCodigo] = useState<string | null>(codigoInicial ?? (conPase ? (pase.invitacion?.codigo ?? null) : null))
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const gente = useViajeCompartido((s) => s.gente)
  const abrirPersonas = usePersonasStore((s) => s.abrir)

  useEffect(() => {
    if (codigo || codigoInicial) return undefined
    const viaje = tripId ?? pase?.viaje?.id ?? null
    if (!viaje) {
      setError('Primero guarda tu viaje para poder invitar.')
      return undefined
    }
    let vivo = true
    // (Tanda 10N §4) El mismo código para el mismo viaje: se reutiliza la invitación vigente; solo se crea otra si la de antes se gastó o se anuló.
    void invitacionDelViaje(viaje, conPase ? { passId: pase.id } : { usos: PLAZAS_SIN_PASE }).then((r) => {
      if (!vivo) return
      if (r.invitacion) setCodigo(r.invitacion.codigo)
      else setError(r.error ?? 'No se ha podido crear el enlace. Inténtalo de nuevo.')
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enlace = codigo ? enlaceDeInvitacion(window.location.origin, codigo) : null
  const sub = conPase ? (modo === 'pase' ? `${pase.usos_usados} de ${pase.usos_max} usados` : `${pase.usos_usados} de ${pase.usos_max} plazas del pase usadas`) : `Invita hasta ${PLAZAS_SIN_PASE} personas con este código.`
  const compartir = async () => {
    if (!enlace) return
    const r = await compartirEnlace({ titulo: modo === 'pase' ? textoDeCompartirPase(destino) : `Mi viaje a ${destino}`, texto: modo === 'pase' ? textoDeCompartirPase(destino) : `Te invito a mi viaje a ${destino}`, url: enlace })
    setAviso(r === 'copiado' ? 'Enlace copiado' : r === 'error' ? 'No se ha podido compartir. Copia el código de arriba.' : null)
  }

  const copiar = async () => {
    if (!enlace) return
    try {
      await navigator.clipboard.writeText(enlace)
      setAviso('Enlace copiado')
    } catch {
      setAviso('No se ha podido copiar. Copia el código de abajo.')
    }
  }

  return (
    <Hoja
      onCerrar={onCerrar}
      etiqueta={modo === 'pase' && pase ? nombreDelTipo(pase.tipo) : 'Compartir viaje'}
      titulo={modo === 'pase' ? <TextoConPase texto={textoDeCompartirPase(destino)} /> : `Invita a los tuyos a tu viaje a ${destino}`}
      datos={modo === 'pase' ? 'P7' : 'RS2'}
      z={92}
    >
      {modo === 'viaje' && (
        <span data-sub-invitar style={{ font: "400 13.5px/1.45 'Geist'", color: 'rgba(28,34,48,.65)' }}>
          Tus acompañantes verán tu ruta y podrán proponerte cambios.
        </span>
      )}
      {modo === 'viaje' && enlace && (
        <div data-enlace-invitar style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 6px 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.14)', background: '#fff' }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.7)' }}>{enlace.replace(/^https?:\/\//, '')}</span>
          <button className="zona-toque" type="button" data-copiar-enlace onClick={() => void copiar()} style={{ height: 34, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.18)', background: 'transparent', font: "600 12.5px 'Geist'", color: '#1C2230', cursor: 'pointer' }}>
            Copiar
          </button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 14, borderRadius: 18, background: '#F5EFE4' }}>
        <span data-codigo-invitacion style={{ font: "600 26px 'Geist Mono',monospace", letterSpacing: '.3em', minHeight: 32 }}>
          {codigo ?? '········'}
        </span>
        <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)', textAlign: 'center' }}>{sub}</span>
      </div>
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" style={{ margin: 0, textAlign: 'center', font: "500 13px 'Geist'", color: 'rgba(28,34,48,.65)' }}>
          {aviso}
        </p>
      )}
      <BotonHoja tipo="principal" onClick={() => void compartir()} disabled={!enlace} datos="compartir-enlace">
        Compartir el enlace
      </BotonHoja>
      {modo === 'viaje' && gente.length > 1 && (
        <button type="button" data-personas-del-viaje onClick={abrirPersonas} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px 0', border: 'none', borderTop: '1px solid rgba(28,34,48,.1)', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#1C2230' }}>
          <CarasDelViaje personas={gente} max={4} />
          <span style={{ flex: 1, font: "600 14px 'Geist'" }}>Personas del viaje · {gente.length}</span>
          <Icono nombre="adelante" size={16} />
        </button>
      )}
    </Hoja>
  )
}
