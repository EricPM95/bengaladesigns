// Entrada que empaqueta la prueba de la 6z6 parte B (scripts/destino/pruebaTanda6z6b.mjs): el Perfil con el mapa de mis viajes, la ficha y el álbum, la tarjeta «Guarda tus recuerdos» de RUTA
// y el botón de foto de la parada, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PerfilSheet } from '../../src/components/layout/PerfilSheet'
import CuerpoConLogros from '../../src/components/logros/pantallas/perfil/CuerpoConLogros'
import { RouteOverview } from '../../src/components/route/RouteOverview'
import { TarjetaRecuerdos, TarjetaRecuerdosEnRuta, ultimasTresFotos, verTarjetaRecuerdosEnRuta } from '../../src/components/route/fotos/TarjetaRecuerdos'
import { BotonFotoParada } from '../../src/components/route/fotos/BotonFotoParada'
import { etiquetaAnadirFoto } from '../../src/components/perfil/AlbumDeViaje'
import { limiteDeFotos, modoDeFoto, fotosDelSitio } from '../../src/lib/fotosViaje'
import { agruparFotos, plural, cifrasDelPerfil, textoDeFotos, ordenarViajes, resumenDeViaje, viajePorId, viajesDelPerfil } from '../../src/lib/viajesPerfil'
import { usePerfilUi } from '../../src/store/usePerfilUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useSyncStore } from '../../src/store/useSyncStore'

export {
  createElement,
  renderToStaticMarkup,
  PerfilSheet,
  CuerpoConLogros,
  RouteOverview,
  TarjetaRecuerdos,
  TarjetaRecuerdosEnRuta,
  ultimasTresFotos,
  verTarjetaRecuerdosEnRuta,
  BotonFotoParada,
  etiquetaAnadirFoto,
  limiteDeFotos,
  modoDeFoto,
  fotosDelSitio,
  agruparFotos,
  plural,
  cifrasDelPerfil,
  textoDeFotos,
  ordenarViajes,
  resumenDeViaje,
  viajePorId,
  viajesDelPerfil,
  usePerfilUi,
  useRouteStore,
  useSyncStore,
}
