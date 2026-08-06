# asystent

Asistente en Node.js para automatizar flujos de trabajo de GitLab: creación de
ramas, lanzamiento de pipelines y creación e instalación de entornos de tarea.

Consta de dos partes:

- **Backend** (raíz del repo): servidor Node.js CommonJS (`server.js`) sobre
  `sm-express-server`, con una API REST que orquesta las utilidades de `utils/`
  y persiste los deploys en `database/deploys.json`.
- **Frontend** (`public/`): SPA en React 19 + TypeScript + Vite +
  styled-components para lanzar y monitorizar deploys. El build de producción
  (`public/dist`) lo sirve el backend bajo `/dist`.

## Requisitos

- Node.js 20+
- Yarn 4 (`nodeLinker: node-modules`, no PnP)
- `expect` y `ssh` disponibles en el sistema (automatización SSH de los entornos)
- Una instancia de GitLab autoalojada y un Personal Access Token con scope `api`

## Instalación

```bash
yarn install            # backend (raíz)
cd public && yarn install   # frontend
```

Crea el fichero de deploys vacío la primera vez:

```bash
cp database/deploys.example.json database/deploys.json
```

## Configuración

Las variables de entorno están documentadas en [.env.example](.env.example).
El proyecto **no** carga ficheros `.env` automáticamente: expórtalas en el shell
o defínelas en el `env` de `ecosystem.config.js` (pm2).

| Variable | Descripción |
|---|---|
| `GITLAB_HOST` | URL de la instancia de GitLab |
| `GITLAB_TOKEN` | Personal Access Token con scope `api` |
| `ENTORNO_NEW_PASSWORD` | Contraseña nueva para el cambio forzado en el primer login SSH |
| `PORT` | Puerto del backend (por defecto `4000`) |

En el frontend, `VITE_API_URL` permite apuntar a un backend distinto de
`http://localhost:4000` durante el desarrollo.

## Uso

```bash
# Backend (raíz)
yarn start                 # node server.js → http://localhost:4000

# Frontend (desde public/)
yarn dev                   # servidor de desarrollo de Vite
yarn build                 # tsc -b && vite build → public/dist
yarn lint                  # eslint .
```

Comprobación rápida de conectividad con GitLab:

```bash
yarn node -e "require('./gitlab/index.js').Users.showCurrentUser().then(u => console.log(u.username))"
```

En producción se ejecuta con pm2 mediante `ecosystem.config.js` (no versionado:
contiene los secretos).

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

`database/deploys.json`, `database/errors.log` y `ecosystem.config.js` no se
versionan: contienen credenciales SSH, direcciones y datos de infraestructura
de los entornos.
