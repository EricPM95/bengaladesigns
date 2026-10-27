// Entrada que empaqueta la prueba de la 6y4 punto 15 (scripts/destino/pruebaFase6y4_perfil.mjs): el Perfil (único, Tanda 10N4), la tarjeta de cada viaje, las cifras, el álbum sin filtros
// y el efecto «la foto vuela al Perfil», para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PerfilSheet } from '../../src/components/layout/PerfilSheet'
import { TarjetaRecuerdos } from '../../src/components/route/fotos/TarjetaRecuerdos'
import CuerpoConLogros from '../../src/components/logros/pantallas/perfil/CuerpoConLogros'
import { TarjetaDeViaje } from '../../src/components/logros/pantallas/perfil/TarjetaDeViaje'
import { CuadriculaDeFotos, AlbumDeViaje, ordenDelAlbum } from '../../src/components/perfil/AlbumDeViaje'
import { cifrasDelPerfil, diaParaFotoSuelta, plural, resumenDeViaje, textoDeFotos, viajesDelPerfil } from '../../src/lib/viajesPerfil'
import * as fotoVuela from '../../src/lib/fotoVuela'
import { usePerfilUi } from '../../src/store/usePerfilUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useSyncStore } from '../../src/store/useSyncStore'

export {
  createElement,
  renderToStaticMarkup,
  PerfilSheet,
  CuerpoConLogros,
  TarjetaDeViaje,
  CuadriculaDeFotos,
  AlbumDeViaje,
  ordenDelAlbum,
  diaParaFotoSuelta,
  TarjetaRecuerdos,
  cifrasDelPerfil,
  plural,
  resumenDeViaje,
  textoDeFotos,
  viajesDelPerfil,
  fotoVuela,
  usePerfilUi,
  useRouteStore,
  useSyncStore,
}
