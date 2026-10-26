// Entrada que empaqueta la prueba de las cuentas, parte 3 (scripts/destino/pruebaCuentas3.mjs): lo del navegador que se puede probar en Node.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { calcularCuentasActivas } from '../../src/lib/cuentas'
import { esperaRestante, textoDeEspera, enlaceDeCorreo, emailResumido, ESPERA_REENVIO_MS } from '../../src/lib/entrarCuenta'
import { marca } from '../../src/lib/marca'
import { titularDeInvitacion, textoDeInvitacionNoValida, guardarInvitacionPendiente, invitacionPendiente, aceptarInvitacionPendiente, invitacionAceptada, olvidarInvitacionPendiente } from '../../src/lib/invitaciones'
import { APARTADOS_DE_PRIVACIDAD, SERVICIOS_DE_FUERA } from '../../src/lib/privacidad'
import { EntrarCuenta } from '../../src/components/cuenta/EntrarCuenta'
import { InvitacionRecibida, lineaDelViaje } from '../../src/components/cuenta/InvitacionRecibida'
import { PuertaDeCuenta } from '../../src/components/cuenta/PuertaDeCuenta'
import { PrivacidadScreen } from '../../src/components/cuenta/PrivacidadScreen'
import { TextoConPase } from '../../src/components/cuenta/TextoConPase'
import { hojaCuantosSois } from '../../src/lib/precioPelicula'
import { HojaInvitar } from '../../src/components/pase/HojaInvitar'
import { HojaDosViajes } from '../../src/components/pase/HojaDosViajes'
import { TarjetaPaseReservas } from '../../src/components/pase/TarjetaPaseReservas'
import { PagoHost } from '../../src/components/pase/PagoHost'
import { eur, filasDeCompra, limitesDelGrupo, totalDe, textoDeCompartirPase, nombreDelTipo, pagoDeLaDireccion } from '../../src/lib/pagoPase'
import { parejasQueSePisan, rangoEnPalabras } from '../../src/lib/viajesQueSePisan'
import { lineasDeCambio, lineasDelDia, cambiosDeLaPropuesta, construirRecomendacion, deshacerCambio, etiquetaDeDia, textoDeCuantos, titularDeRecomendacion, textoEnviarA, textoEsperandoA, textoMandadoA, textoDelCambio, sinCambios, cambiosDeUnaRecomendacion } from '../../src/lib/propuesta'
import { resolverRecomendacion, vistaPrevia } from '../../src/lib/aplicarRecomendacion'
import { haceCuanto, avisoDeLaDireccion } from '../../src/lib/avisos'
import { tocaPedirPermiso } from '../../src/lib/permisoAvisos'
import { ListaDeAvisos } from '../../src/components/avisos/ListaDeAvisos'
import { textoDelAviso, textoDelPush, quienDelAviso } from '../../shared/avisos/textos.js'
import { textoDeComoEntra, textoDeMisPases, etiquetaDelPase, estadoDelPase, fechaDeCompra, rangoDelViaje, filasDelPase, personasDelPase } from '../../src/lib/ajustes'
import { nombreDePila, nombreParaMostrar, inicialDeNombre, fotoParaMostrar, renovarEnMs, CADUCA_FOTO_S, rutaNuevaDeFoto, PASOS_DE_FOTO_DE_PERFIL, OBJETIVO_BYTES_FOTO_PERFIL } from '../../src/lib/miPerfil'
import { enlaceDeAmigo, codigoDeAmigoDeLaDireccion } from '../../src/lib/invitaciones'
import { estadoDeSesion } from '../../src/lib/cuentas'
import { AjustesScreen } from '../../src/components/ajustes/AjustesScreen'
import { MisPases } from '../../src/components/ajustes/MisPases'
import { Avatar } from '../../src/components/ajustes/Avatar'
import { useMiPerfil } from '../../src/store/useMiPerfil'
import { CambioParada } from '../../src/components/propuesta/CambioParada'
import { HojaVerPropuesta, FilaDeCambio } from '../../src/components/propuesta/HojaVerPropuesta'
import { HojaRecomendacion, BloqueDeDia, plegarLineas } from '../../src/components/propuesta/HojaRecomendacion'
import { HojaComoTeLlamas } from '../../src/components/ajustes/HojaComoTeLlamas'
import { hayQuePedirNombre } from '../../src/store/usePedirNombre'
import { esEntornoDePrueba } from '../../src/lib/recomendaciones'
import { PropuestaEnviada } from '../../src/components/propuesta/PropuestaEnviada'
import { MenuInvitadoParada } from '../../src/components/propuesta/MenusDelInvitado'
import { diasConRecomendacion } from '../../src/components/propuesta/EtiquetaRecomendacion'
import { useRouteStore } from '../../src/store/useRouteStore'
import { usePropuestaStore } from '../../src/store/usePropuestaStore'
import { useViajeCompartido, nombreDe, inicialDe } from '../../src/store/useViajeCompartido'

export const M = {
  calcularCuentasActivas,
  esperaRestante,
  textoDeEspera,
  enlaceDeCorreo,
  emailResumido,
  ESPERA_REENVIO_MS,
  marca,
  titularDeInvitacion,
  textoDeInvitacionNoValida,
  guardarInvitacionPendiente,
  invitacionPendiente,
  aceptarInvitacionPendiente,
  invitacionAceptada,
  olvidarInvitacionPendiente,
  APARTADOS_DE_PRIVACIDAD,
  SERVICIOS_DE_FUERA,
  lineaDelViaje,
  pintaEntrar: (props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(EntrarCuenta, props)),
  pintaPuerta: () => renderToStaticMarkup(createElement(PuertaDeCuenta)),
  pintaPrivacidad: () => renderToStaticMarkup(createElement(PrivacidadScreen, { onVolver: () => undefined })),
  pintaInvitacion: (vista: Record<string, unknown>) => renderToStaticMarkup(createElement(InvitacionRecibida, { vista, onUnirme: () => undefined, onSeguir: () => undefined } as never)),
  eur,
  filasDeCompra,
  limitesDelGrupo,
  totalDe,
  textoDeCompartirPase,
  nombreDelTipo,
  pagoDeLaDireccion,
  parejasQueSePisan,
  rangoEnPalabras,
  hojaCuantosSois,
  pintaInvitar: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HojaInvitar, { onCerrar: () => undefined, ...props } as never)),
  pintaDosViajes: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HojaDosViajes, { elegir: async () => null, onCerrar: () => undefined, ...props } as never)),
  pintaP1: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(TarjetaPaseReservas, props as never)),
  lineasDeCambio,
  lineasDelDia,
  cambiosDeLaPropuesta,
  construirRecomendacion,
  deshacerCambio,
  etiquetaDeDia,
  textoDeCuantos,
  titularDeRecomendacion,
  textoEnviarA,
  textoEsperandoA,
  textoMandadoA,
  plegarLineas,
  nombreDe,
  inicialDe,
  hayQuePedirNombre,
  esEntornoDePrueba,
  pintaComoTeLlamas: () => renderToStaticMarkup(createElement(HojaComoTeLlamas)),
  pintaListaPlegada: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(BloqueDeDia, props as never)),
  textoDelCambio,
  sinCambios,
  cambiosDeUnaRecomendacion,
  resolverRecomendacion,
  vistaPrevia,
  diasConRecomendacion,
  useRouteStore,
  usePropuestaStore,
  useViajeCompartido,
  pintaCambioParada: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(CambioParada, props as never)),
  pintaFilaDeCambio: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(FilaDeCambio, props as never)),
  pintaVerPropuesta: (props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(HojaVerPropuesta, props as never)),
  pintaR2: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HojaRecomendacion, { onCerrar: () => undefined, ...props } as never)),
  pintaEnviada: (nombre: string) => renderToStaticMarkup(createElement(PropuestaEnviada, { nombre, onVolver: () => undefined })),
  pintaMenuParada: () => renderToStaticMarkup(createElement(MenuInvitadoParada, { nombre: 'Coliseo', ciudad: 'Roma', onVerFicha: () => undefined })),
  haceCuanto,
  avisoDeLaDireccion,
  tocaPedirPermiso,
  textoDelAviso,
  textoDelPush,
  quienDelAviso,
  pintaListaDeAvisos: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(ListaDeAvisos, props as never)),
  textoDeComoEntra,
  textoDeMisPases,
  etiquetaDelPase,
  estadoDelPase,
  fechaDeCompra,
  rangoDelViaje,
  filasDelPase,
  personasDelPase,
  nombreDePila,
  nombreParaMostrar,
  inicialDeNombre,
  fotoParaMostrar,
  renovarEnMs,
  CADUCA_FOTO_S,
  rutaNuevaDeFoto,
  PASOS_DE_FOTO_DE_PERFIL,
  OBJETIVO_BYTES_FOTO_PERFIL,
  enlaceDeAmigo,
  codigoDeAmigoDeLaDireccion,
  estadoDeSesion,
  useMiPerfil,
  pintaAjustes: (props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(AjustesScreen, { onVolver: () => undefined, ...props } as never)),
  pintaMisPases: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(MisPases, { onVolver: () => undefined, ...props } as never)),
  pintaAvatar: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(Avatar, props as never)),
  pintaPagoHost: () => renderToStaticMarkup(createElement(PagoHost)),
  pintaTextoPase: (texto: string) => renderToStaticMarkup(createElement(TextoConPase, { texto })),
}
