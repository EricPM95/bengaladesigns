// Entrada que empaqueta la prueba de las cuentas, parte 1 (scripts/destino/pruebaCuentas1.mjs): lo del navegador que se puede probar en Node.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { calcularCuentasActivas, estadoDeSesion, esAnonimo } from '../../src/lib/cuentas'
import { leerDatosDeFoto } from '../../src/lib/exifFoto'
import { quitarMetadatosJpeg, pasosDeCompresion, nombreDeArchivo, OBJETIVO_BYTES, LADO_MAXIMO_PX, LADO_MINIMO_PX, CALIDAD_JPEG, CALIDAD_MINIMA } from '../../src/lib/fotosViaje'
import { vistosDeLaRuta } from '../../src/lib/vistosApi'
import { APARTADOS_DE_PRIVACIDAD, SERVICIOS_DE_FUERA, TEXTO_PENDIENTE } from '../../src/lib/privacidad'
import { PuertaDeCuenta } from '../../src/components/cuenta/PuertaDeCuenta'
import { CuentaEnPerfil } from '../../src/components/cuenta/CuentaEnPerfil'
import { PrivacidadScreen } from '../../src/components/cuenta/PrivacidadScreen'
import { EntrarProvisional } from '../../src/components/cuenta/EntrarProvisional'
import { VistosPorPersona } from '../../src/components/cuenta/VistosPorPersona'
import { comprobarEncaje, ordenTrasMover, indiceTrasParada, textoDeRecomendacion } from '../../src/lib/aplicarRecomendacion'
import { conVistosDe, cambiosDeVistos } from '../../src/lib/vistosPorPersona'
import { normalizarCodigo, enlaceDeInvitacion, codigoDeLaDireccion, textoDeInvitacionNoValida } from '../../src/lib/invitaciones'
import { useRouteStore } from '../../src/store/useRouteStore'

export const M = {
  calcularCuentasActivas,
  estadoDeSesion,
  esAnonimo,
  leerDatosDeFoto,
  quitarMetadatosJpeg,
  pasosDeCompresion,
  nombreDeArchivo,
  OBJETIVO_BYTES,
  LADO_MAXIMO_PX,
  LADO_MINIMO_PX,
  CALIDAD_JPEG,
  CALIDAD_MINIMA,
  vistosDeLaRuta,
  APARTADOS_DE_PRIVACIDAD,
  SERVICIOS_DE_FUERA,
  TEXTO_PENDIENTE,
  pintaPuerta: () => renderToStaticMarkup(createElement(PuertaDeCuenta)),
  pintaCuentaEnPerfil: () => renderToStaticMarkup(createElement(CuentaEnPerfil)),
  pintaPrivacidad: () => renderToStaticMarkup(createElement(PrivacidadScreen, { onVolver: () => undefined })),
  comprobarEncaje,
  ordenTrasMover,
  indiceTrasParada,
  textoDeRecomendacion,
  conVistosDe,
  cambiosDeVistos,
  normalizarCodigo,
  enlaceDeInvitacion,
  codigoDeLaDireccion,
  textoDeInvitacionNoValida,
  useRouteStore,
  pintaVistos: () => renderToStaticMarkup(createElement(VistosPorPersona)),
  pintaEntrar: () => renderToStaticMarkup(createElement(EntrarProvisional, { onSaltar: () => undefined })),
}
