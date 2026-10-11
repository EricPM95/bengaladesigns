// Entrada que empaqueta la prueba de la 6y4 punto 15 (scripts/destino/pruebaFase6y4_perfil.mjs): el Perfil con el diseño nuevo, la fila de cada viaje, la bandera de RUTA, las cifras, el álbum sin filtros
// y el efecto «la foto vuela al Perfil», para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PerfilSheet } from '../../src/components/layout/PerfilSheet'
import { RouteOverview } from '../../src/components/route/RouteOverview'
import { TarjetaRecuerdos } from '../../src/components/route/fotos/TarjetaRecuerdos'
import { FilaDeViaje } from '../../src/components/perfil/FilaDeViaje'
import { CifrasDelMapa } from '../../src/components/perfil/CifrasDelMapa'
import { CuadriculaDeFotos, AlbumDeViaje, ordenDelAlbum } from '../../src/components/perfil/AlbumDeViaje'
import { flagStripesGradient } from '../../src/lib/flagColors'
import { chinchetasDeViajes, cifrasDelPerfil, diaParaFotoSuelta, plural, resumenDeViaje, textoDeFotos, viajesDelPerfil, CAJA_MAPA_VIAJES } from '../../src/lib/viajesPerfil'
import * as fotoVuela from '../../src/lib/fotoVuela'
import { usePerfilUi } from '../../src/store/usePerfilUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useSyncStore } from '../../src/store/useSyncStore'

export {
  createElement,
  renderToStaticMarkup,
  PerfilSheet,
  RouteOverview,
  FilaDeViaje,
  CifrasDelMapa,
  CuadriculaDeFotos,
  AlbumDeViaje,
  ordenDelAlbum,
  diaParaFotoSuelta,
  TarjetaRecuerdos,
  flagStripesGradient,
  chinchetasDeViajes,
  cifrasDelPerfil,
  plural,
  resumenDeViaje,
  textoDeFotos,
  viajesDelPerfil,
  CAJA_MAPA_VIAJES,
  fotoVuela,
  usePerfilUi,
  useRouteStore,
  useSyncStore,
}
