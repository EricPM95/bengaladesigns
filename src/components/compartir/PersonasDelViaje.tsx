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
import { HojaOpciones, ICONOS_OPCION, OpcionTarjeta } from '../ui/HojaOpciones'
import { CaraDePersona } from './CarasDelViaje'
import { abrirHojaInvitar } from './abrirInvitar'

/** La etiqueta de cada permiso (Administrador en azul oscuro, Editar en dorado claro, Recomendar en gris), como en `Piezas/Hojas Opciones` 03. */
export function EtiquetaPermiso({ permiso }: { permiso: Permiso }) {
  const estilo = {
    admin: { background: '#1C2230', color: '#F3D59A' },
    editar: { background: '#F3E3B2', color: '#6E5018' },
    recomendar: { background: '#ECEBE7', color: 'rgba(28,34,48,.62)' },
  }[permiso]
  return (
    <span data-etiqueta-permiso={permiso} style={{ ...estilo, height: 30, padding: '0 13px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', font: "600 13px 'Geist'", whiteSpace: 'nowrap', flex: 'none' }}>
      {textoDelPermiso[permiso]}
    </span>
  )
}

const nombreOInicial = (p: Persona) => nombreDe(p) || inicialDe(p)

/**
 * «PERSONAS DEL VIAJE» (Tanda 10N §4a, pantallas 02 a 05 de `Piezas/Viaje Compartido`).
 *   · El administrador (02): cada persona con su permiso; al tocar a alguien sale su hoja con «Cambiar permiso» y «Quitar del viaje»; abajo «Añadir a alguien · Con un enlace o un código» (Tanda 10N4).
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
  const personaAbierta = gente.find((p) => p.id === abierto) ?? null
  const invitar = () => {
    cerrar()
    void abrirHojaInvitar(route, tripId)
  }

  return (
    <>
      {/* (Tanda 10N4 §3) «Hojas Opciones» 03: la lista de personas, cada una con su permiso; al tocar a alguien sale SU hoja (04) con «Cambiar permiso» y «Quitar del viaje»; abajo «Añadir a alguien». */}
      <HojaOpciones
        onCerrar={cerrar}
        titulo="Personas del viaje"
        etiqueta={etiqueta}
        datos="personas-del-viaje"
        z={93}
        cabecera={
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gente.map((p, i) => {
              const mio = p.esYo === true
              const puedeTocar = esAdmin && !mio
              return (
                <button
                  key={p.id}
                  type="button"
                  role="listitem"
                  data-persona-fila={p.id}
                  disabled={!puedeTocar}
                  onClick={() => setAbierto(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '8px 10px', borderRadius: 20, border: '1px solid transparent', background: 'transparent', textAlign: 'left', cursor: puedeTocar ? 'pointer' : 'default', color: '#1C2230' }}
                >
                  <CaraDePersona persona={p} tam={52} tono={i} foto={p.foto ? (fotos[p.foto] ?? null) : null} borde="#FDFBF4" />
                  <span style={{ flex: 1, minWidth: 0, font: "600 17px 'Geist'" }}>
                    {nombreOInicial(p)}
                    {mio && <span style={{ fontWeight: 400, color: 'rgba(28,34,48,.5)' }}> · Tú</span>}
                  </span>
                  <EtiquetaPermiso permiso={permisoDe(p)} />
                  {puedeTocar && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.4)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        }
      >
        {error && (
          <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
            {error}
          </p>
        )}
        {esAdmin ? (
          <OpcionTarjeta discontinua icono={ICONOS_OPCION.mas} titulo="Añadir a alguien" linea="Con un enlace o un código" onClick={invitar} atributos={{ 'data-invitar-a-alguien': '' }} />
        ) : (
          rol !== 'admin' && <OpcionTarjeta peligro icono={ICONOS_OPCION.salir} titulo="Salir del viaje" linea="Dejas de ver el viaje. Lo que ganaste se queda contigo" onClick={() => setSaliendo(true)} atributos={{ 'data-salir-del-viaje': '' }} />
        )}
      </HojaOpciones>

      {/* 04 · Al tocar a una persona. */}
      {abierto && personaAbierta && esAdmin && (
        <HojaOpciones onCerrar={() => setAbierto(null)} etiqueta={`Personas del viaje · ${textoDelPermiso[permisoDe(personaAbierta)]}`} titulo={nombreOInicial(personaAbierta)} datos="persona-del-viaje" z={94}>
          <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.llave} titulo="Cambiar permiso" linea="Editar o Recomendar" flecha onClick={() => setCambiando(personaAbierta)} atributos={{ 'data-cambiar-permiso': '' }} />
          <OpcionTarjeta peligro icono={ICONOS_OPCION.salir} titulo="Quitar del viaje" linea="Pierde el acceso y su plaza del pase vuelve a ti" onClick={() => setQuitando(personaAbierta)} atributos={{ 'data-quitar-del-viaje': '' }} />
        </HojaOpciones>
      )}

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

/** «Permiso de Ana» con el formato de tarjetas (Tanda 10N4 §3 y §4): «Administrador» en gris con el candado y «Solo Eric»; «Editar · Cambia la ruta.» y «Recomendar · Propone cambios.», la elegida con el estilo de elegir (azul oscuro); [Guardar permiso]. */
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
  const opcion = (permiso: Exclude<Permiso, 'admin'>, tono: 'arena' | 'azul', icono: string) => {
    const marcado = elegido === permiso
    return (
      <OpcionTarjeta
        key={permiso}
        tono={tono}
        icono={icono}
        titulo={textoDelPermiso[permiso]}
        linea={lineaDelPermiso[permiso]}
        elegida={marcado}
        onClick={() => setElegido(permiso)}
        atributos={{ 'data-opcion-permiso': permiso }}
        derecha={
          marcado ? (
            <span style={{ color: '#F3D59A', display: 'flex' }}>
              <Icono nombre="hecho" size={18} grosor={2.4} />
            </span>
          ) : undefined
        }
      />
    )
  }
  return (
    <HojaOpciones onCerrar={alCerrar} etiqueta="Personas del viaje" titulo={`Permiso de ${nombreOInicial(persona)}`} datos="permiso-de" z={95}>
      <OpcionTarjeta
        deshabilitada
        icono={ICONOS_OPCION.candado}
        titulo={textoDelPermiso.admin}
        atributos={{ 'data-opcion-permiso': 'admin', 'aria-disabled': 'true' }}
        derecha={<span style={{ font: "600 12px 'Geist'", color: 'rgba(28,34,48,.7)', whiteSpace: 'nowrap' }}>Solo {solo}</span>}
      />
      {opcion('editar', 'arena', 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3')}
      {opcion('recomendar', 'azul', 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z')}
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
          {error}
        </p>
      )}
      <BotonHoja tipo="principal" onClick={() => void guardar()} disabled={ocupado || elegido === actual} datos="guardar-permiso">
        Guardar permiso
      </BotonHoja>
    </HojaOpciones>
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
