# Plantillas de los correos de Supabase (JUTRIP, V32)

Dónde se pegan: **Supabase › Authentication › Emails › Templates** (en cada plantilla: «Subject» y el cuerpo en «Message body», que es HTML). Se pegan a mano; la app no las toca.

**Qué correos manda la app, de verdad** (solo estos; no hay más):

| Cuándo | Plantilla de Supabase | Por qué |
|---|---|---|
| Entrar con el correo (una persona que ya tiene cuenta) | **Magic Link** | La app usa `signInWithOtp`: manda un código de 6 cifras (y un enlace, que sirve en el mismo móvil). |
| Entrar con el correo la primera vez (cuenta nueva) | **Confirm signup** | `signInWithOtp` con `shouldCreateUser`: para una cuenta nueva Supabase usa esta plantilla. |
| Añadir el correo a una cuenta que ya existía (la de invitado) | **Change Email Address** | `updateUser({ email })`. |

«Invite user», «Reset password» y «Reauthentication» **no se usan** (la app no tiene contraseñas ni invitaciones por correo de Supabase): no hace falta tocarlas.

Variables de Supabase que usan las plantillas: `{{ .Token }}` (el código de 6 cifras), `{{ .ConfirmationURL }}` (el enlace), `{{ .NewEmail }}` (solo en el cambio de correo). Los correos salen como «Jutrip <no-reply@jutrip.app>» (ya configurado con Resend).

Para que el código se vea bien grande y funcione en cualquier aplicación de correo, el HTML usa solo tablas y estilos en línea (sin imágenes ni fuentes de fuera). Colores de la marca: crema `#F6EFE0`, tinta `#1C2230`, oro `#BE9440`.

---

## 1. Magic Link (el código de entrada)

**Subject:** `Tu código para entrar en Jutrip: {{ .Token }}`

```html
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F6EFE0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EFE0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#FFFDF8;border-radius:20px;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;color:#1C2230;">
            <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:.08em;padding-bottom:20px;">JUTRIP</td></tr>
            <tr><td style="font-size:17px;line-height:1.5;padding-bottom:18px;">Este es tu código para entrar en Jutrip:</td></tr>
            <tr>
              <td align="center" style="padding:6px 0 22px;">
                <div style="display:inline-block;background:#F6EFE0;border:1px solid #D8BE84;border-radius:14px;padding:16px 26px;font-family:'Courier New',monospace;font-size:38px;font-weight:700;letter-spacing:.25em;color:#1C2230;">{{ .Token }}</div>
              </td>
            </tr>
            <tr><td style="font-size:15px;line-height:1.5;color:#4A5160;padding-bottom:18px;">Escríbelo en la app. Si abriste Jutrip en este mismo móvil, también puedes entrar con un toque:</td></tr>
            <tr>
              <td align="center" style="padding-bottom:22px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BE9440;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:16px;border-radius:14px;padding:14px 26px;">Entrar en Jutrip</a>
              </td>
            </tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#7A7F8C;">El código dura poco tiempo. Si tú no has pedido entrar, ignora este correo: no pasa nada.</td></tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#7A7F8C;padding-top:14px;">¿Dudas? Escribe a soporte@jutrip.app</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## 2. Confirm signup (la primera vez)

**Subject:** `Bienvenido a Jutrip: tu código es {{ .Token }}`

```html
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F6EFE0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EFE0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#FFFDF8;border-radius:20px;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;color:#1C2230;">
            <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:.08em;padding-bottom:20px;">JUTRIP</td></tr>
            <tr><td style="font-size:17px;line-height:1.5;padding-bottom:18px;">¡Bienvenido a Jutrip! Para crear tu cuenta, escribe este código en la app:</td></tr>
            <tr>
              <td align="center" style="padding:6px 0 22px;">
                <div style="display:inline-block;background:#F6EFE0;border:1px solid #D8BE84;border-radius:14px;padding:16px 26px;font-family:'Courier New',monospace;font-size:38px;font-weight:700;letter-spacing:.25em;color:#1C2230;">{{ .Token }}</div>
              </td>
            </tr>
            <tr><td style="font-size:15px;line-height:1.5;color:#4A5160;padding-bottom:18px;">Si abriste Jutrip en este mismo móvil, también puedes confirmar con un toque:</td></tr>
            <tr>
              <td align="center" style="padding-bottom:22px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BE9440;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:16px;border-radius:14px;padding:14px 26px;">Crear mi cuenta</a>
              </td>
            </tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#7A7F8C;">Si tú no has pedido esto, ignora este correo: no se crea nada.</td></tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#7A7F8C;padding-top:14px;">¿Dudas? Escribe a soporte@jutrip.app</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## 3. Change Email Address (añadir tu correo a la cuenta)

**Subject:** `Confirma tu correo en Jutrip`

```html
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F6EFE0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EFE0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#FFFDF8;border-radius:20px;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;color:#1C2230;">
            <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:.08em;padding-bottom:20px;">JUTRIP</td></tr>
            <tr><td style="font-size:17px;line-height:1.5;padding-bottom:18px;">Para guardar tus viajes con el correo <b>{{ .NewEmail }}</b>, confírmalo con este botón:</td></tr>
            <tr>
              <td align="center" style="padding-bottom:22px;">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BE9440;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:16px;border-radius:14px;padding:14px 26px;">Confirmar mi correo</a>
              </td>
            </tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#7A7F8C;">Si tú no has pedido esto, ignora este correo: no cambia nada.</td></tr>
            <tr><td style="font-size:13px;line-height:1.5;color:#7A7F8C;padding-top:14px;">¿Dudas? Escribe a soporte@jutrip.app</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Cómo comprobar que ha ido bien

1. Pega cada plantilla y pulsa **Save**.
2. En la app (ya en jutrip.app), «Entrar con mi email» con un correo tuyo: tiene que llegar «Tu código para entrar en Jutrip: 123456», con el código bien grande, desde «Jutrip <no-reply@jutrip.app>».
3. Escribe el código en la app: entras.
4. (La plantilla «Confirm signup» se ve con un correo que nunca haya entrado; la de cambio de correo, al añadir el correo a una cuenta de invitado.)
