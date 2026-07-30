# spyle-mail-server

API simple para el despacho de emails de notificación, usada como servicio compartido por varios proyectos. Envía a través de Resend usando `noreply@spyle.com.ar` como remitente único.

## Configuración

Variables requeridas en `.env`:

| Variable | Descripción |
|---|---|
| `SMTP_HOST` | Host SMTP del proveedor (`smtp.resend.com`) |
| `SMTP_PORT` | Puerto SMTP (`465`) |
| `SMTP_USER` | Usuario SMTP (`resend`) |
| `SMTP_PASS` | API key de Resend |
| `EMAIL_FROM` | Dirección remitente, debe pertenecer a un dominio verificado en Resend (`noreply@spyle.com.ar`) |
| `PORT` | Puerto donde escucha el servidor |
| `WHITELIST` | Lista de destinatarios (`toClient`) autorizados a recibir mails, separados por coma |
| `ALLOWED_ORIGINS` | Lista de orígenes (front-ends) autorizados a consumir la API, separados por coma |

## Levantar el servidor

```bash
npm install
node server-mail.js
```

## Endpoint

### `POST /api/send-email`

Restricciones:
- El header `Origin` (o `Referer`) del request debe estar en `ALLOWED_ORIGINS`.
- El campo `toClient` debe estar en `WHITELIST`.
- Rate limit: 10 requests cada 15 minutos por IP.

**Body (JSON):**

| Campo | Tipo | Descripción |
|---|---|---|
| `toClient` | string | Email destinatario final. Debe estar en `WHITELIST`. |
| `email` | string | Email de contacto de quien origina el mensaje (se incluye en el cuerpo del mail). |
| `motivo` | string | Asunto del mail. |
| `mensaje` | string | Cuerpo del mensaje. |

**Respuesta exitosa (200):**
```json
{ "message": "Correo enviado con éxito" }
```

**Errores:**
- `400` — falta algún campo obligatorio, o `toClient` no está en la whitelist.
- `403` — origen no autorizado.
- `500` — falló el envío del mail.

## Ejemplo con cURL

```bash
curl -X POST https://vps-4768993-x.dattaweb.com/api/send-email \
  -H "Content-Type: application/json" \
  -H "Origin: https://spyle.com.ar" \
  -d '{
    "toClient": "spylesolutions@gmail.com",
    "email": "cliente@ejemplo.com",
    "motivo": "Nuevo contacto desde la web",
    "mensaje": "Hola, quisiera más información sobre sus servicios."
  }'
```

### Probar en local

```bash
curl -X POST http://localhost:5000/api/send-email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5000" \
  -d '{
    "toClient": "spylesolutions@gmail.com",
    "email": "cliente@ejemplo.com",
    "motivo": "Prueba local",
    "mensaje": "Mensaje de prueba desde localhost."
  }'
```

## Sumar un nuevo proyecto consumidor

1. Agregar el origen del nuevo front-end a `ALLOWED_ORIGINS` en `.env`.
2. Agregar los emails destinatarios que ese proyecto vaya a usar a `WHITELIST`.
3. Reiniciar el servidor para que tome los cambios.
