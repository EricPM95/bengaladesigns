// Entrada que empaqueta la prueba de la 6z6 parte B (scripts/destino/pruebaTanda6z6b.mjs): el Perfil con el mapa de mis viajes, la ficha y el álbum, la tarjeta «Guarda tus recuerdos» de RUTA
// y el botón de foto de la parada, para pintarlos en el servidor.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PerfilSheet } from '../../src/components/layout/PerfilSheet'
import { RouteOverview } from '../../src/components/route/RouteOverview'
import { TarjetaRecuerdos, TarjetaRecuerdosEnRuta, verTarjetaRecuerdosEnRuta } from '../../src/components/route/fotos/TarjetaRecuerdos'
import { BotonFotoParada } from '../../src/components/route/fotos/BotonFotoParada'
import { etiquetaAnadirFoto } from '../../src/components/perfil/AlbumDeViaje'
import { limiteDeFotos, modoDeFoto, fotosDelSitio } from '../../src/lib/fotosViaje'
import { agruparFotos, chinchetasDeViajes, ordenarViajes, resumenDeViaje, viajePorId, viajesDelPerfil, PROYECCION_MAPA_VIAJES } from '../../src/lib/viajesPerfil'
import { usePerfilUi } from '../../src/store/usePerfilUi'
import { useRouteStore } from '../../src/store/useRouteStore'
import { useSyncStore } from '../../src/store/useSyncStore'

export {
  createElement,
  renderToStaticMarkup,
  PerfilSheet,
  RouteOverview,
  TarjetaRecuerdos,
  TarjetaRecuerdosEnRuta,
  verTarjetaRecuerdosEnRuta,
  BotonFotoParada,
  etiquetaAnadirFoto,
  limiteDeFotos,
  modoDeFoto,
  fotosDelSitio,
  agruparFotos,
  chinchetasDeViajes,
  ordenarViajes,
  resumenDeViaje,
  viajePorId,
  viajesDelPerfil,
  PROYECCION_MAPA_VIAJES,
  usePerfilUi,
  useRouteStore,
  useSyncStore,
}
