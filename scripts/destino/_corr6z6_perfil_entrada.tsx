// Entrada que empaqueta la prueba del Perfil a pantalla completa y la bombilla de tips (scripts/destino/pruebaCorr6z6_perfil.mjs), para pintarlo en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PerfilSheet } from '../../src/components/layout/PerfilSheet'
import CuerpoConLogros from '../../src/components/logros/pantallas/perfil/CuerpoConLogros'
import { viajesDelPerfil } from '../../src/lib/viajesPerfil'
import { usePerfilUi } from '../../src/store/usePerfilUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useSyncStore } from '../../src/store/useSyncStore'

export {
  createElement,
  renderToStaticMarkup,
  PerfilSheet,
  CuerpoConLogros,
  viajesDelPerfil,
  usePerfilUi,
  useRouteStore,
  useSyncStore,
}
