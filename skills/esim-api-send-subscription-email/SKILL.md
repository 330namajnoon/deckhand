---
name: esim-api-send-subscription-email
description: Envia (o reenvia) el email de suscripcion eSIM (alta nueva/duplicado) de esim-api con datos falsos, directo al mailer, sin pasar por clientId/packageId ni por el sistema externo Voice/RDSDB. Usar cuando el usuario pida "envia el email", "manda otra vez el email", "prueba la plantilla de eSIM" en el contexto del entorno de esim-api.
---

# Enviar email de suscripcion eSIM (QA, sin tocar el flujo real)

Ejecuta estos comandos tal cual, en este orden, sin explorar el codigo del
proyecto ni leer plantillas salvo que el usuario pida cambiar algo. Objetivo:
minimo numero de tool calls / tokens.

## Parametros (pedir solo si faltan)

- `EMAIL`: destinatario (p.ej. sina.majnoonhjk@gmail.com)
- `ACTIVATION_TYPE`: `new` | `duplicate` | `express_duplicate` (por defecto `new`)
- `SSH_HOST`/`SSH_PORT`: entorno remoto (por defecto lo ultimo usado en la
  conversacion; si no hay contexto, preguntar). Ejemplo previo:
  `root@app-sw-242.digimobil.local` puerto `32075`.
- `REMOTE_PATH`: ruta del proyecto en el entorno (ejemplo previo:
  `/var/www/esim-api-entornostore6042esimapi`).

## Pasos

Ejecutar en un solo bloque bash cuando sea posible (menos tool calls):

```bash
ssh -p SSH_PORT SSH_HOST "mkdir -p REMOTE_PATH/src/App/Command"

scp -P SSH_PORT \
  "/Users/sinamajnoon/Documents/digiProjects/asystent/.claude/skills/esim-api-send-subscription-email/QaSendSubscriptionEmailCommand.php" \
  SSH_HOST:REMOTE_PATH/src/App/Command/QaSendSubscriptionEmailCommand.php
```

> Nota: el fichero PHP ya existe en este repo (asystent), junto a este
> SKILL.md. No lo regeneres con Write/Edit; solo copialo con scp.

```bash
ssh -p SSH_PORT SSH_HOST "cd REMOTE_PATH && composer dump-autoload -q && php bin/console app:qa:send-subscription-email EMAIL ACTIVATION_TYPE"
```

```bash
ssh -p SSH_PORT SSH_HOST "rm -f REMOTE_PATH/src/App/Command/QaSendSubscriptionEmailCommand.php && rmdir REMOTE_PATH/src/App/Command 2>/dev/null; cd REMOTE_PATH && composer dump-autoload -q"
```

## Reglas

- El comando PHP (`QaSendSubscriptionEmailCommand.php`) es SIEMPRE temporal:
  se sube antes de enviar y se borra despues, en la misma tarea. Nunca debe
  quedar commiteado ni sin borrar en el entorno.
- No hacer `git commit`/`git push` de nada como parte de este skill.
- No modificar `ApiKeyAuthenticator` ni ningun fichero de seguridad para esto:
  este flujo ya evita la autenticacion HTTP porque llama al mailer
  directamente via consola, sin pasar por el endpoint API.
- Si el usuario solo dice "envia otra vez el email" sin mas datos, reutilizar
  el ultimo `EMAIL`, `ACTIVATION_TYPE`, `SSH_HOST`/`SSH_PORT` y `REMOTE_PATH`
  usados en la conversacion — no volver a preguntar.
- Si falla porque la plantilla usa variables nuevas (p.ej. `phoneNumber`,
  `pin`, `puk`), el comando ya las rellena con valores dummy
  (`600000000`, `1234`, `12345678`); no hace falta tocar nada salvo que
  cambie el nombre de las propiedades en `Subscription.php`.
