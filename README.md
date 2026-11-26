# deckhand

Asistente en Node.js para automatizar flujos de trabajo de GitLab: creación de
ramas, lanzamiento de pipelines y creación e instalación de entornos de tarea.

Consta de dos partes:

- **Backend** (raíz del repo): servidor Node.js CommonJS (`server.js`) sobre
  `sm-express-server`, con una API REST que orquesta las utilidades de `utils/`
  y persiste los deploys en un fichero SQLite (`~/.deckhand/deckhand.db`).
- **Plugin de Claude Code** (`.claude-plugin/`): servidor MCP por stdio empaquetado en `bundle/server.js`, con las mismas operaciones como tools.

## Instalar como plugin de Claude Code

```
/plugin marketplace add 330namajnoon/deckhand
/plugin install deckhand@deckhand
```

Después, ejecuta `/deckhand:settings`: abre en el navegador un panel local
donde se meten (y se cambian cuando haga falta) la URL de GitLab, el token
(scope `api`) y la contraseña nueva de los entornos. Se guardan en
`~/.deckhand/config.json` con permisos 600 y se aplican al momento, sin
reiniciar. El panel solo escucha en 127.0.0.1, con un token aleatorio en la
URL, y se cierra tras 30 minutos sin uso.

No hace falta `yarn install` ni base de datos: el plugin arranca
`bundle/server.js` con Node 22.13+ y guarda los deploys en
`~/.deckhand/deckhand.db`. Funciona en Windows, macOS y Linux sin más
binarios: el SSH va por `ssh2`. Para abrir entornos en VS Code hace falta
VS Code con la extensión Remote-SSH.

### Skills y agentes cifrados

El plugin trae skills (y, si los hay, agentes y comandos) cifrados en
`private.enc` (AES-256-GCM con clave derivada por scrypt). Si tienes la
contraseña, métela en "Contraseña de los skills y agentes" del panel: se
descifran al momento dentro de la carpeta del plugin y, como la contraseña
queda guardada, se vuelven a descifrar solos cuando el plugin se actualiza.
Después ejecuta `/reload-plugins` (o reinicia Claude Code) para cargarlos.
Sin la contraseña el plugin funciona igual, solo que sin esos skills.

Para mantenerlos: los ficheros en claro viven en `skills/<nombre>/`,
`agents/` y `commands/` (gitignored, salvo `skills/README.md` y
`commands/settings.md`), y `yarn encrypt:private` los cifra en `private.enc`
con `PRIVATE_CONTENT_PASSWORD` del `.env`.

### Trabajar dentro de los entornos

Las tools `remote_*` dan al agente acceso por SSH al entorno de un deploy en
estado `listo`: `remote_exec` (comandos), `remote_read_file`,
`remote_write_file`, `remote_edit_file`, `remote_list_dir` y
`remote_db_query`. Las rutas relativas cuelgan de la raíz del proyecto. La
conexión se abre con la contraseña nueva de los entornos y se reutiliza
durante 5 minutos sin uso.

Claude Code solo carga el `CLAUDE.md` y el `.claude/` de tu carpeta local,
no los del entorno. `remote_load_context` los trae: el contenido de los
`CLAUDE.md` del entorno (con sus imports `@ruta`), las reglas de
`.claude/rules`, los `CLAUDE.md` de subcarpetas, el índice de skills,
agentes y comandos de `.claude/` y `.claude/settings.json`. Si el agente
toca un entorno con instrucciones propias sin haberlas cargado, la primera
tool `remote_*` se lo recuerda.

Lo que pueden hacer lo limita una política que se edita en el mismo panel
(`~/.deckhand/policy.json`):

- **Base de datos**: sin acceso (por defecto), solo lectura (`remote_db_query`
  acepta solo SELECT/SHOW/EXPLAIN/DESCRIBE, dentro de una transacción READ
  ONLY) o acceso completo. Salvo en acceso completo, `remote_exec` bloquea los
  clientes de base de datos y los comandos de Doctrine que la tocan.
- **Comandos prohibidos**: expresiones regulares contra el comando completo.
- **Rutas protegidas**: globs donde no se puede escribir.

Es una red contra errores del agente, no una barrera de seguridad: el agente
entra como root y un comando puede esquivar cualquier patrón. Todas las
llamadas, también las bloqueadas, quedan en la tabla `remote_actions` (tool
`list_remote_actions`).

Tras cambiar el código del servidor MCP hay que regenerar el bundle y
versionarlo, que es lo que se instala:

```bash
yarn build:plugin
```

## Requisitos (servidor web)

- Node.js 22.13+ (usa el SQLite integrado, `node:sqlite`; no hace falta instalar ninguna base de datos)
- Yarn 4 (`nodeLinker: node-modules`, no PnP)
- Una instancia de GitLab autoalojada y un Personal Access Token con scope `api`

## Instalación

```bash
yarn install
```

La base de datos SQLite y su tabla se crean solas en el primer arranque.

## Configuración

Copia la plantilla y rellena los valores:

```bash
cp .env.example .env
```

El `.env` de la raíz es la única fuente de secretos. Lo cargan tanto `server.js`
y `main.js` (vía `dotenv`) como `ecosystem.config.js`, así que sirve igual para
`yarn start` que para pm2. No se versiona.

| Variable | Descripción |
|---|---|
| `GITLAB_HOST` | URL de la instancia de GitLab |
| `GITLAB_TOKEN` | Personal Access Token con scope `api` |
| `ENTORNO_NEW_PASSWORD` | Contraseña nueva para el cambio forzado en el primer login SSH |
| `ENTORNO_NEW_PASSWORD_CRM` | Opcional: la misma para los entornos de CRM (su política de contraseñas es más estricta) |
| `PORT` | Puerto del backend (por defecto `4000`) |
| `DECKHAND_HOME` | Opcional: carpeta de datos con `deckhand.db` y `errors.log` (por defecto `~/.deckhand`) |

## Uso

```bash
yarn start                 # node server.js → http://localhost:4000
```

Comprobación rápida de conectividad con GitLab:

```bash
yarn node -e "require('./gitlab/index.js').Users.showCurrentUser().then(u => console.log(u.username))"
```

En producción se ejecuta con pm2:

```bash
pm2 start ecosystem.config.js
pm2 reload ecosystem.config.js --update-env   # tras editar el .env
```

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/repositories` | Lista de repositorios |
| GET | `/repositories/:id/branches` | Ramas de un repositorio |
| GET | `/repositories/:id/tree?ref&path` | Árbol de ficheros de un repositorio |
| GET | `/repositories/:id/file?ref&path` | Contenido de un fichero |
| GET | `/deploys` | Lista de deploys |
| GET | `/deploys/:id` | Detalle de un deploy |
| DELETE | `/deploys/:id` | Elimina un deploy |
| POST | `/deploys/:id/open-vscode` | Abre el entorno en VS Code (Remote-SSH) |
| POST | `/deploys/:id/redeploy` | Vuelve a desplegar el entorno |
| POST | `/deploy` | Crea un entorno nuevo |

## Estructura

Ver [CLAUDE.md](CLAUDE.md) para el detalle de la estructura de carpetas y las
convenciones del proyecto (una función por fichero re-exportada desde el
`index` de su carpeta, etc.).

## Aviso

`.env` no se versiona, y la base de datos y `errors.log` viven fuera del repo (`~/.deckhand`):
contienen el token de GitLab, credenciales SSH, direcciones y datos de
infraestructura de los entornos.
