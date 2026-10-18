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
import { HojaDeCompra } from '../../src/components/pase/HojaDeCompra'
import { HojaInvitar } from '../../src/components/pase/HojaInvitar'
import { HojaDosViajes } from '../../src/components/pase/HojaDosViajes'
import { TarjetaPaseReservas } from '../../src/components/pase/TarjetaPaseReservas'
import { PagoHost } from '../../src/components/pase/PagoHost'
import { eur, filasDeCompra, limitesDelGrupo, totalDe, textoDeCompartirPase, nombreDelTipo, pagoDeLaDireccion } from '../../src/lib/pagoPase'
import { parejasQueSePisan, rangoEnPalabras } from '../../src/lib/viajesQueSePisan'

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
  pintaCompra: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HojaDeCompra, { onCerrar: () => undefined, ...props } as never)),
  pintaInvitar: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HojaInvitar, { onCerrar: () => undefined, ...props } as never)),
  pintaDosViajes: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HojaDosViajes, { elegir: async () => null, onCerrar: () => undefined, ...props } as never)),
  pintaP1: (props: Record<string, unknown>) => renderToStaticMarkup(createElement(TarjetaPaseReservas, props as never)),
  pintaPagoHost: () => renderToStaticMarkup(createElement(PagoHost)),
  pintaTextoPase: (texto: string) => renderToStaticMarkup(createElement(TextoConPase, { texto })),
}
