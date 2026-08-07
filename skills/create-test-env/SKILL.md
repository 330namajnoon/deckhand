---
name: create-test-env
description: Crea un entorno de test de un frontend de store (España o Portugal) a partir de la rama de la tarea, siguiendo el flujo rama `test...` → carpeta de env → `yarn build` → commit "deploy test" → push. Usar cuando el usuario diga "hazme un entorno de test de ...", "crea un test del store v2 es", "sácame un entorno de test de la STORE-XXXX", "despliega un test del front de portugal". No usar para entornos de deckhand de backend/API (esos son `entorno*`, se crean con la tool `create_deploy`), ni para abrir entornos en VS Code (eso es open-deploy-vscode), ni para apuntar un front local a un backend (eso es point-front-to-env).
---

# Crear un entorno de test de un frontend de store

Un "entorno de test" de los fronts de store **no es un deploy de deckhand**: es una rama con un nombre concreto, una carpeta de configuración en `envs/` con ese mismo nombre y el build compilado commiteado. El pipeline de GitLab la publica en una URL fija derivada del nombre de la rama.

Es distinto de un "entorno" de deckhand (`entorno<tarea><repo>`, puerto 12443), que sí se crea con la tool MCP `create_deploy`.

## Repos cubiertos

Raíz de proyectos: `/Users/sinamajnoon/Documents/digiProjects`

| Repo | País | Dónde están los envs | Nombre del fichero | Script `test:env` |
|---|---|---|---|---|
| `store-frontend-v2-es` | ES | `<workspace>/envs/` en `checkout`, `coverage`, `client-finder`, `configurator`, `signature` | `environment.js` | **Sí** |
| `store-frontend-v2-pt` | PT | `<workspace>/envs/` en `checkout`, `coverage` | `environment.js` | No |
| `store-frontend-es` (v1) | ES | `envs/` en la raíz | `enviroment.js` (sin la segunda `n`, es así en el repo) | No |
| `store-frontend-pt` (v1) | PT | `envs/` en la raíz | `enviroment.js` | No |

Antes de asumir la tabla, **verifica la estructura real** del repo (`ls */envs` o `ls envs`): los workspaces cambian con el tiempo. Los workspaces de verdad son los que declara el `package.json` raíz.

## Flujo

### 1. Resolver repo y rama padre

- Traduce el nombre coloquial ("store v2 de España", "el front v1 de portugal") al directorio real. Si es ambiguo, pregunta.
- La rama padre es **la rama actual del repo** (`git rev-parse --abbrev-ref HEAD`), normalmente la de la tarea (`STORE-6063`). Confírmasela al usuario si no la ha dicho él.
- Comprueba que el working tree está limpio antes de empezar. Si hay cambios sin commitear, enséñaselos y pregunta cómo proceder (no asumas que hay que commitearlos aparte). Un caso frecuente y benigno: el puntero de un submódulo (`store-toolkit-es`/`-pt`) queda modificado porque la rama padre avanzó — si el commit al que apunta ya está pusheado en el remoto, es razonable seguir y dejar que entre en el commit `deploy test`; pregúntalo igualmente, no lo decidas por tu cuenta.

### 2. Nombre del entorno

```
test + <rama padre en minúsculas y sin caracteres especiales> + <alias corto del repo>
```

Usa **siempre el alias corto** como parte de proyecto, no el nombre completo del repo — con el límite real (ver abajo) el nombre completo casi nunca cabe:

| Repo | Alias corto |
|---|---|
| `store-frontend-v2-es` | `frontv2es` |
| `store-frontend-v2-pt` | `frontv2pt` |
| `store-frontend-es` | `frontes` |
| `store-frontend-pt` | `frontpt` |

`STORE-6063` + `store-frontend-v2-es` → **`teststore6063frontv2es`** (22 caracteres).

Quita todo lo que no sea alfanumérico (`-`, `_`, `.`, `*`, `+`, `/`…) y pasa a minúsculas. Este nombre es a la vez el de la rama, el de la carpeta de env y el que forma la URL: los tres tienen que coincidir exactamente.

**Límite: 25 caracteres.** No es un límite de etiqueta DNS (eso permitiría hasta 63; lo comprobó el usuario y corrigió esta guía) — trátalo como un límite duro igualmente. Cuenta los caracteres antes de crear nada; con el alias corto normalmente hay margen (~20-24 para tareas de 4 dígitos), pero tareas con nombre más largo pueden agotarlo.

En el histórico del repo hay ramas viejas que usaban el nombre completo del proyecto y se pasaban de 25 (p. ej. `teststore6063storefrontendv2es`, 31 caracteres) — son de antes de conocer este límite, no las tomes como referencia válida; las ramas recientes (`teststore6067frontv2es`, `teststore6068frontv2es`...) ya siguen el patrón corto.

Si aun con el alias corto se pasa de 25, dile al usuario el nombre que sale y su longitud, y pídele cómo quiere recortarlo en vez de inventarte una abreviatura.

Antes de crear la rama, comprueba también si ya existe una con ese nombre exacto (`git branch -a | grep <nombre>`): si existe, no es un entorno nuevo, es un redespliegue (ver más abajo) — probablemente ya se creó antes para esta misma tarea, incluso con el nombre largo antiguo si es de antes de este límite.

### 3. Crear la rama

```bash
git checkout -b <nombre-entorno>
```

### 4. Crear las carpetas de entorno

**En `store-frontend-v2-es`** hay script propio (`store-toolkit-es/scripts/test-env.mjs`), es el camino oficial:

```bash
yarn test:env create <nombre-entorno>          # copia envs/develop → envs/<nombre> en los 5 workspaces
yarn test:env target <nombre-entorno> <url>    # reescribe window.env_target
yarn test:env prepare <nombre-entorno> <url>   # las dos cosas
```

Todos aceptan `--dry-run`.

**En los otros tres repos** no existe el script: copia la carpeta a mano en cada sitio donde haya un `envs/`:

```bash
cp -R <ruta>/envs/template-branches-test <ruta>/envs/<nombre-entorno>
```

Usa `template-branches-test` como origen y **compárala antes con `develop`**: no siempre coinciden (en `store-frontend-pt` la plantilla apunta a `loja-backend-dev` y `develop` a otro sitio). Si la diferencia no es obvia, enséñale ambas al usuario y que elija.

### 5. Ajustar el `target`

En el `environment.js` / `enviroment.js` de la carpeta recién creada, `window.env_target` es el backend al que apunta el entorno.

- Por defecto queda el de dev (`https://store-backend-dev.digimobil.es:8443` en ES, el equivalente `loja-backend-dev` en PT). **Si el usuario no menciona un entorno de backend propio, se deja tal cual.**
- Si el usuario dice que tiene entorno de backend para esa tarea, búscalo con la tool MCP `list_deploys` filtrando por `branchName`, coge el de `store-backend-<país>` con `status: "listo"`, y mete su URL **sin la barra final** (`https://entornostore6042storebackendes.sw.digimobil.es:12443`).
- Respeta el formato del fichero: los v2 usan comillas dobles y `;`, los v1 comillas simples y sin `;`.

Enséñale el `env_target` resultante antes de seguir.

### 6. Build

```bash
yarn build
```

Tarda 1–2 minutos en los v2 (compila los 5 workspaces). **Espera a que termine y comprueba que no ha fallado** antes de commitear — el `build/` compilado va dentro del commit, así que un build a medias despliega un entorno roto.

### 7. Commit y push

```bash
git add -A
git commit -m "deploy test"
git push -u origin <nombre-entorno>
```

El mensaje es literalmente `deploy test`, sin ticket ni prefijo (es la convención de estas ramas; no aplica el skill de commit-message).

El commit debe llevar: la carpeta `envs/<nombre-entorno>` de cada workspace, el `build/` regenerado, y — en `store-frontend-v2-es` / `store-frontend-v2-pt` — el puntero del submódulo `store-toolkit-*` si apunta a un commit distinto del commiteado en la rama padre. Verifica en ese caso que el commit del submódulo **está pusheado** (`git -C store-toolkit-xx branch -r --contains <sha>`); si no lo está, el pipeline no podrá resolverlo: avisa al usuario antes de pushear.

### 8. Verificar el despliegue

El push dispara el pipeline de GitLab. El entorno está listo cuando **todos los jobs del pipeline están en verde**.

- **Con deckhand**: las tools MCP `list_pipelines` (filtrando por `ref: <nombre-entorno>`) y `get_pipeline_jobs` permiten ver el pipeline de la rama y el estado de cada job. Sondéalas hasta que todos los jobs estén terminados correctamente — en particular el stage `deploy_workers`, que es el que marca el entorno como listo.
  - Ambas piden `repositoryId`. `list_repositories` devuelve un listado completo que puede superar el límite de tokens de una tool call; si pasa, lee el fichero que vuelca el error con `grep -i "<nombre-del-repo>"` en vez de intentar leerlo entero. Ids ya vistos: `store-frontend-v2-es` → `2613`.
  - Para sondear el estado no uses `sleep` en Bash (está bloqueado como espera artificial): llama a `get_pipeline_jobs` otra vez directamente, sin más; la propia latencia de red entre llamadas ya da tiempo suficiente entre sondeos.
- Ojo: `list_deploys` / `get_deploy` **no** sirven aquí. Deckhand solo lista los deploys que ha creado él; una rama de test creada a mano con este flujo no aparece.
- Comprobación final por URL (200 = publicado):

  | País | URL |
  |---|---|
  | España | `https://<nombre-entorno>.sw.digimobil.es:11443` |
  | Portugal | `https://<nombre-entorno>.sw.digi.pt:11443` |

  En los v2 el path base es el de cada app (`/tienda/checkout/`, `/cobertura`, `/tienda/configurador`, `/tienda/buscador-cliente`, `/tienda/firma`). Un 404 mientras el pipeline sigue corriendo es normal.

- Si el pipeline falla, di qué job ha fallado y por qué; no relances nada por tu cuenta.

### 9. Resumen al usuario

Repo, rama padre, nombre del entorno, `env_target` aplicado, workspaces con env creado, resultado del build, hash del commit, y la URL del entorno con su estado.

## Redesplegar un entorno ya existente

Si la rama de test ya existe (el usuario ha seguido trabajando en la tarea), no se crea otra: se hace `git checkout <rama-test>`, se mergea la rama padre, `yarn build`, y otro commit `deploy test` + push. En el histórico de estas ramas hay varios "deploy test" seguidos, es lo normal.

## Qué no hacer

- No crees el entorno con `create_deploy` de deckhand salvo que el usuario lo pida: `create_deploy` con `type: "test"` es un camino alternativo que genera él la rama y el nombre, y no encaja con este flujo manual (que commitea el build local).
- No cambies el `env_target` a un entorno de backend por iniciativa propia: solo si el usuario lo pide.
- No toques `envs/develop`, `envs/preprod`, `envs/release` ni `envs/template-branches-test`.
- No mergees la rama de test a `dev` ni abras merge request: estas ramas no se integran.
- No borres ramas de test antiguas por tu cuenta.
