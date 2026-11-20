import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { pedir, type UsuarioFicha, type UsuariosLista, type UsuariosResumen } from './api'
import { parametrosDePeriodo, SelectorDePeriodo, usePeriodo } from './periodo'
import { Ficha } from './usuarios/Ficha'
import { useTituloDelPanel } from './tituloDelPanel'
import { consultaDeFiltros, FILTROS_INICIALES, Lista, type FiltrosDeLista } from './usuarios/Lista'
import { Resumen } from './usuarios/Resumen'

/**
 * (V35A, Design P6 / P6c / M3 / M8) USUARIOS: el selector de periodo, los bloques de arriba (`usuarios/Resumen.tsx`), la lista (`usuarios/Lista.tsx`) y la ficha de una persona (`usuarios/Ficha.tsx`).
 * La ficha se abre también por dirección: `/admin/usuarios?ficha=<id>` (así enlazan las demás pantallas; `enlaceAFicha(id)` de `api.ts`). «‹ Volver a la lista» conserva los filtros y el periodo (viven aquí, no en la lista).
 * Solo administradores y SOLO LECTURA: sin exportar; nunca datos de tarjeta ni contraseñas.
 */
const fichaDeLaDireccion = (): string | null => {
  try {
    return new URLSearchParams(window.location.search).get('ficha') || null
  } catch {
    return null
  }
}
const ponerFichaEnLaDireccion = (id: string | null): void => {
  try {
    const p = new URLSearchParams(window.location.search)
    if (id) p.set('ficha', id)
    else p.delete('ficha')
    const resto = p.toString()
    window.history.pushState(null, '', `/admin/usuarios${resto ? `?${resto}` : ''}`)
  } catch {
    /* sin historial */
  }
}

export function Usuarios({ movil }: { movil: boolean }): ReactNode {
  const periodo = usePeriodo()
  const [filtros, setFiltros] = useState<FiltrosDeLista>(FILTROS_INICIALES)
  const [resumen, setResumen] = useState<UsuariosResumen | null | undefined>(undefined)
  const [lista, setLista] = useState<UsuariosLista | null>(null)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [fichaId, setFichaId] = useState<string | null>(fichaDeLaDireccion)
  const [ficha, setFicha] = useState<UsuarioFicha | null | undefined>(undefined)
  const peticion = useRef(0)
  const poner = useCallback((p: Partial<FiltrosDeLista>) => setFiltros((f) => ({ ...f, ...p })), [])

  // El resumen de arriba: cambia con el periodo.
  const parametros = parametrosDePeriodo(periodo)
  useEffect(() => {
    let vigente = true
    setResumen(undefined)
    void pedir<UsuariosResumen>(`/api/admin/usuarios/totales?${parametros}`).then((r) => vigente && setResumen(r))
    return () => {
      vigente = false
    }
  }, [parametros])

  // La lista: espera un instante a que termines de escribir (no se pide a cada letra).
  const consulta = consultaDeFiltros(filtros)
  useEffect(() => {
    const n = ++peticion.current
    setCargandoLista(true)
    const t = window.setTimeout(() => {
      void pedir<UsuariosLista>(`/api/admin/usuarios?${consulta}`).then((r) => {
        if (n === peticion.current) {
          setLista(r)
          setCargandoLista(false)
        }
      })
    }, 250)
    return () => window.clearTimeout(t)
  }, [consulta])

  // La ficha: por la dirección (`?ficha=`), también al volver atrás en el navegador.
  useEffect(() => {
    const f = () => setFichaId(fichaDeLaDireccion())
    window.addEventListener('popstate', f)
    return () => window.removeEventListener('popstate', f)
  }, [])
  useEffect(() => {
    if (!fichaId) {
      setFicha(undefined)
      return undefined
    }
    let vigente = true
    setFicha(undefined)
    void pedir<UsuarioFicha>(`/api/admin/usuarios/${encodeURIComponent(fichaId)}`).then((r) => vigente && setFicha(r))
    return () => {
      vigente = false
    }
  }, [fichaId])

  const abrir = (id: string) => {
    ponerFichaEnLaDireccion(id)
    setFichaId(id)
    try {
      window.scrollTo({ top: 0 })
    } catch {
      /* nada */
    }
  }
  const volver = () => {
    ponerFichaEnLaDireccion(null)
    setFichaId(null)
  }

  // (V35A) Como en Design P6c: con la ficha abierta, el título grande de la pantalla es el nombre de la persona.
  const ponerTitulo = useTituloDelPanel((x) => x.poner)
  useEffect(() => {
    ponerTitulo(fichaId && ficha ? (ficha.usuario.nombre || ficha.usuario.email || null) : null)
    return () => ponerTitulo(null)
  }, [fichaId, ficha, ponerTitulo])
  if (fichaId) {
    return (
      <div data-usuarios data-vista="ficha" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
        {ficha === undefined && <p style={{ margin: 0, font: "400 14px 'Geist'" }}>Cargando…</p>}
        {ficha === null && (
          <>
            <button type="button" data-volver onClick={volver} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "600 13.5px 'Geist'", cursor: 'pointer' }}>‹ Volver a la lista</button>
            <p data-sin-ficha style={{ margin: 0, font: "400 14px 'Geist'" }}>No hemos encontrado a esa persona.</p>
          </>
        )}
        {ficha && <Ficha f={ficha} movil={movil} volver={volver} />}
      </div>
    )
  }
  return (
    <div data-usuarios data-vista="lista" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
      <SelectorDePeriodo movil={movil} />
      {resumen === undefined && <p style={{ margin: 0, font: "400 14px 'Geist'" }}>Cargando…</p>}
      {resumen === null && <p data-sin-resumen style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>No hemos podido cargar las cifras.</p>}
      {resumen && <Resumen r={resumen} movil={movil} />}
      <Lista f={filtros} poner={poner} lista={lista} abrir={abrir} movil={movil} cargando={cargandoLista} />
    </div>
  )
}
