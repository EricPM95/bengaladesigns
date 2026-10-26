import { useEffect, useState } from 'react'
import { formatHeaderDateRangeShortEs } from '../../lib/dateRange'
import { cambiarPermiso, dejarDeVerElViaje, infoQuitar, lineaDelPermiso, quitarDelViaje, salirDelViaje, textoDelPermiso, type InfoQuitar } from '../../lib/personasViaje'
import { useFotosDePerfil } from '../../hooks/useFotosDePerfil'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { usePersonasStore } from '../../store/usePersonasStore'
import { inicialDe, nombreDe, useViajeCompartido, type Permiso, type Persona } from '../../store/useViajeCompartido'
import { BotonHoja, Hoja } from '../ui/Hoja'
import { Icono } from '../ui/Icono'
import { CaraDePersona } from './CarasDelViaje'
import { abrirHojaInvitar } from './abrirInvitar'

/** La etiqueta de cada permiso (Administrador en azul oscuro, Puede editar en dorado claro, Solo recomendar en gris). */
export function EtiquetaPermiso({ permiso }: { permiso: Permiso }) {
  const estilo = {
    admin: { background: '#1C2230', color: '#F3D59A' },
    editar: { background: '#F6E7C4', color: '#6B4E0E' },
    recomendar: { background: '#ECEBE7', color: 'rgba(28,34,48,.62)' },
  }[permiso]
  return (
    <span data-etiqueta-permiso={permiso} style={{ ...estilo, height: 24, padding: '0 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', font: "600 11.5px 'Geist'", whiteSpace: 'nowrap' }}>
      {textoDelPermiso[permiso]}
    </span>
  )
}

const nombreOInicial = (p: Persona) => nombreDe(p) || inicialDe(p)

/**
 * «PERSONAS DEL VIAJE» (Tanda 10N §4a, pantallas 02 a 05 de `Piezas/Viaje Compartido`).
 *   · El administrador (02): cada persona con su permiso; al tocar a alguien, su fila se abre con [Cambiar permiso] y [Quitar del viaje]; abajo [+ Invitar a alguien].
 *     [Cambiar permiso] abre «Permiso de Ana» (03); [Quitar del viaje], «¿Quitar a Luis del viaje a Roma?» (04) con la plaza del pase que vuelve.
 *   · Un invitado (05): la misma lista, sin botones, con «· Tú» en su fila y abajo [Salir del viaje] (con su confirmación). El administrador no puede salir.
 */
export function PersonasDelViaje() {
  const abierta = usePersonasStore((s) => s.abierta)
  if (!abierta) return null
  return <PersonasAbiertas />
}

function PersonasAbiertas() {
  const cerrar = usePersonasStore((s) => s.cerrar)
  const route = useRouteStore((s) => s.route)
  const idActivo = useSyncStore((s) => s.activeTripId)
  const idDeLaGente = useViajeCompartido((s) => s.tripId)
  const tripId = idActivo ?? idDeLaGente
  const gente = useViajeCompartido((s) => s.gente)
  const cargar = useViajeCompartido((s) => s.cargar)
  const { esAdmin, rol } = usePermisosDelViaje()
  const [abierto, setAbierto] = useState<string | null>(null)
  const [cambiando, setCambiando] = useState<Persona | null>(null)
  const [quitando, setQuitando] = useState<Persona | null>(null)
  const [saliendo, setSaliendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fotos = useFotosDePerfil(gente.map((p) => p.foto))
  if (!route || !tripId) return null

  const rango = route.answers.dateRange ? formatHeaderDateRangeShortEs(route.answers.dateRange.start, route.answers.dateRange.end).toUpperCase() : null
  const etiqueta = [route.destination.toUpperCase(), rango, `${gente.length} PERSONA${gente.length === 1 ? '' : 'S'}`].filter(Boolean).join(' · ')
  const permisoDe = (p: Persona): Permiso => (p.esAdmin ? 'admin' : (p.permiso ?? 'recomendar'))
  const invitar = () => {
    cerrar()
    void abrirHojaInvitar(route, tripId)
  }

  return (
    <>
      <Hoja onCerrar={cerrar} titulo="Personas del viaje" etiqueta={etiqueta} datos="personas-del-viaje" z={93}>
        <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
          {gente.map((p, i) => {
            const mio = p.esYo === true
            const puedeTocar = esAdmin && !mio
            const desplegada = abierto === p.id && puedeTocar
            return (
              <div key={p.id} role="listitem" data-persona-fila={p.id} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(28,34,48,.08)', padding: '10px 0' }}>
                <button
                  type="button"
                  disabled={!puedeTocar}
                  onClick={() => setAbierto(desplegada ? null : p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: puedeTocar ? 'pointer' : 'default', color: '#1C2230' }}
                >
                  <CaraDePersona persona={p} tam={38} tono={i} foto={p.foto ? (fotos[p.foto] ?? null) : null} borde="#FFFDF8" />
                  <span style={{ flex: 1, minWidth: 0, font: "600 15.5px 'Geist'" }}>
                    {nombreOInicial(p)}
                    {mio && <span style={{ fontWeight: 400, color: 'rgba(28,34,48,.55)' }}> · Tú</span>}
                  </span>
                  <EtiquetaPermiso permiso={permisoDe(p)} />
                  {puedeTocar && <Icono nombre="adelante" size={14} />}
                </button>
                {desplegada && (
                  <div data-fila-abierta style={{ display: 'flex', gap: 8, margin: '10px 0 0 50px' }}>
                    <button type="button" data-cambiar-permiso onClick={() => setCambiando(p)} style={botonFila(false)}>
                      Cambiar permiso
                    </button>
                    <button type="button" data-quitar-del-viaje onClick={() => setQuitando(p)} style={botonFila(true)}>
                      Quitar del viaje
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
            {error}
          </p>
        )}
        {esAdmin ? (
          <button type="button" data-invitar-a-alguien onClick={invitar} style={{ height: 50, borderRadius: 999, border: '1px dashed rgba(28,34,48,.3)', background: 'transparent', font: "600 14.5px 'Geist'", color: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1, marginTop: -2 }}>
              +
            </span>
            Invitar a alguien
          </button>
        ) : (
          rol !== 'admin' && (
            <button type="button" data-salir-del-viaje onClick={() => setSaliendo(true)} style={{ height: 50, borderRadius: 999, border: '1px solid rgba(180,40,40,.35)', background: 'transparent', font: "600 14.5px 'Geist'", color: 'rgb(var(--accent-red))', cursor: 'pointer' }}>
              Salir del viaje
            </button>
          )
        )}
      </Hoja>

      {cambiando && (
        <HojaPermiso
          persona={cambiando}
          alCerrar={() => setCambiando(null)}
          alGuardar={async (permiso) => {
            const fallo = await cambiarPermiso(tripId, cambiando.id, permiso)
            if (fallo) return fallo
            await cargar(tripId)
            setCambiando(null)
            setAbierto(null)
            return null
          }}
        />
      )}
      {quitando && (
        <HojaQuitar
          persona={quitando}
          tripId={tripId}
          destino={route.destination}
          personasDelPase={gente}
          alCerrar={() => setQuitando(null)}
          alQuitar={async () => {
            const fallo = await quitarDelViaje(tripId, quitando.id)
            if (fallo) return fallo
            await cargar(tripId)
            setQuitando(null)
            setAbierto(null)
            return null
          }}
        />
      )}
      {saliendo && (
        <HojaSalir
          destino={route.destination}
          alCerrar={() => setSaliendo(false)}
          alSalir={async () => {
            const fallo = await salirDelViaje(tripId)
            if (fallo) return fallo
            setSaliendo(false)
            cerrar()
            dejarDeVerElViaje(tripId)
            return null
          }}
          alFallar={setError}
        />
      )}
    </>
  )
}

const botonFila = (peligro: boolean) =>
  ({
    height: 38,
    padding: '0 14px',
    borderRadius: 999,
    border: `1px solid ${peligro ? 'rgba(180,40,40,.35)' : 'rgba(28,34,48,.2)'}`,
    background: 'transparent',
    color: peligro ? 'rgb(var(--accent-red))' : '#1C2230',
    font: "600 13px 'Geist'",
    cursor: 'pointer',
  }) as const

/** 03 · «Permiso de Ana»: los tres permisos, cada uno con su línea; «Administrador» en gris con el candado y «Solo Eric»; el elegido en azul oscuro con su ✓; [Guardar permiso]. */
export function HojaPermiso({ persona, alCerrar, alGuardar, nombreAdmin = 'el administrador' }: { persona: Persona; alCerrar: () => void; alGuardar: (permiso: Exclude<Permiso, 'admin'>) => Promise<string | null>; nombreAdmin?: string }) {
  const actual: Exclude<Permiso, 'admin'> = persona.permiso === 'editar' ? 'editar' : 'recomendar'
  const [elegido, setElegido] = useState<Exclude<Permiso, 'admin'>>(actual)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const admin = useViajeCompartido((s) => s.gente.find((p) => p.esAdmin))
  const solo = nombreDe(admin) || nombreAdmin
  const guardar = async () => {
    setOcupado(true)
    const fallo = await alGuardar(elegido)
    setOcupado(false)
    if (fallo) setError(fallo)
  }
  const opcion = (permiso: Exclude<Permiso, 'admin'>) => {
    const marcado = elegido === permiso
    return (
      <button
        key={permiso}
        type="button"
        data-opcion-permiso={permiso}
        aria-pressed={marcado}
        onClick={() => setElegido(permiso)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '13px 14px', borderRadius: 16, border: marcado ? '1px solid #1C2230' : '1px solid rgba(28,34,48,.14)', background: marcado ? '#1C2230' : '#fff', color: marcado ? '#FFFDF8' : '#1C2230', cursor: 'pointer' }}
      >
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: "600 15px 'Geist'" }}>{textoDelPermiso[permiso]}</span>
          <span style={{ font: "400 12.5px/1.4 'Geist'", opacity: marcado ? 0.8 : 0.6 }}>{lineaDelPermiso[permiso]}</span>
        </span>
        {marcado && (
          <span style={{ color: '#F3D59A', display: 'flex' }}>
            <Icono nombre="hecho" size={18} grosor={2.4} />
          </span>
        )}
      </button>
    )
  }
  return (
    <Hoja onCerrar={alCerrar} titulo={`Permiso de ${nombreOInicial(persona)}`} datos="permiso-de" z={95}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div data-opcion-permiso="admin" aria-disabled="true" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, border: '1px solid rgba(28,34,48,.08)', background: 'rgba(28,34,48,.04)', color: 'rgba(28,34,48,.45)' }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: "600 15px 'Geist'" }}>{textoDelPermiso.admin}</span>
            <span style={{ font: "400 12.5px/1.4 'Geist'" }}>{lineaDelPermiso.admin}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: "600 10px 'Geist Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>
            <Icono nombre="candado" size={13} />
            Solo {solo}
          </span>
        </div>
        {opcion('editar')}
        {opcion('recomendar')}
      </div>
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
          {error}
        </p>
      )}
      <BotonHoja tipo="principal" onClick={() => void guardar()} disabled={ocupado || elegido === actual} datos="guardar-permiso">
        Guardar permiso
      </BotonHoja>
    </Hoja>
  )
}

/** 04 · «¿Quitar a Luis del viaje a Roma?»: si tenía plaza del pase, el recuadro con su plaza vacía y «Vuelve a ti»; [Quitar a Luis] en rojo y [Cancelar]. */
export function HojaQuitar({ persona, tripId, destino, personasDelPase, alCerrar, alQuitar }: { persona: Persona; tripId: string; destino: string; personasDelPase: Persona[]; alCerrar: () => void; alQuitar: () => Promise<string | null> }) {
  const [info, setInfo] = useState<InfoQuitar | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void infoQuitar(tripId, persona.id).then((i) => vivo && setInfo(i))
    return () => {
      vivo = false
    }
  }, [tripId, persona.id])
  const nombre = nombreOInicial(persona)
  const plaza = info?.plaza ?? null
  const quitar = async () => {
    setOcupado(true)
    const fallo = await alQuitar()
    setOcupado(false)
    if (fallo) setError(fallo)
  }
  return (
    <Hoja onCerrar={alCerrar} titulo={`¿Quitar a ${nombre} del viaje a ${destino}?`} datos="quitar-del-viaje" z={95}>
      <span style={{ font: "400 13.5px/1.5 'Geist'", color: 'rgba(28,34,48,.65)' }}>Dejará de ver el viaje enseguida. Lo que ya ha ganado se lo queda.</span>
      {plaza && (
        <div data-plaza-del-pase style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: '#F5EFE4' }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Plaza del pase {plaza.tipo === 'grupo' ? 'Grupo' : 'Dúo'}</span>
            <span style={{ font: "600 15px 'Geist'" }}>
              {plaza.usos_usados} de {plaza.usos_max} usadas
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {personasDelPase.slice(0, plaza.usos_max).map((p, i) => (
              <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -8, opacity: p.id === persona.id ? 0.35 : 1 }}>
                <CaraDePersona persona={p} tam={26} tono={i} borde="#F5EFE4" />
              </span>
            ))}
          </span>
          <span data-plaza-vuelve style={{ font: "600 12.5px 'Geist'", color: '#6B4E0E' }}>→ Vuelve a ti</span>
        </div>
      )}
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
          {error}
        </p>
      )}
      <button type="button" data-confirmar-quitar disabled={ocupado} onClick={() => void quitar()} style={{ height: 54, borderRadius: 999, border: 'none', background: 'rgb(var(--accent-red))', color: '#fff', font: "700 15px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
        Quitar a {nombre}
      </button>
      <BotonHoja tipo="secundario" onClick={alCerrar} datos="cancelar-quitar">
        Cancelar
      </BotonHoja>
    </Hoja>
  )
}

/** 05 · [Salir del viaje], con su confirmación: pasa lo mismo que si te quitaran (la plaza del pase vuelve a quien la compró). */
export function HojaSalir({ destino, alCerrar, alSalir, alFallar }: { destino: string; alCerrar: () => void; alSalir: () => Promise<string | null>; alFallar: (texto: string) => void }) {
  const [ocupado, setOcupado] = useState(false)
  const salir = async () => {
    setOcupado(true)
    const fallo = await alSalir()
    setOcupado(false)
    if (fallo) {
      alFallar(fallo)
      alCerrar()
    }
  }
  return (
    <Hoja onCerrar={alCerrar} titulo={`¿Salir del viaje a ${destino}?`} datos="salir-del-viaje" z={95}>
      <span style={{ font: "400 13.5px/1.5 'Geist'", color: 'rgba(28,34,48,.65)' }}>Dejarás de ver el viaje. Lo que ya has ganado se queda contigo.</span>
      <button type="button" data-confirmar-salir disabled={ocupado} onClick={() => void salir()} style={{ height: 54, borderRadius: 999, border: 'none', background: 'rgb(var(--accent-red))', color: '#fff', font: "700 15px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
        Salir del viaje
      </button>
      <BotonHoja tipo="secundario" onClick={alCerrar} datos="cancelar-salir">
        Cancelar
      </BotonHoja>
    </Hoja>
  )
}
