# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"deckhand" is a Node.js assistant for automating GitLab workflows (pipelines, branches, environment creation/installation). It has these parts:

- **Backend** (repo root): CommonJS Node.js server (`server.js`) built on `sm-express-server`, exposing a REST API that orchestrates the utilities in `utils/` and persists deploys in a SQLite `deploys` table using Node's built-in `node:sqlite` (`database/client.js`), no external database server.
- **MCP server** (`mcpServer/`): mounted on the same Express app at `POST /mcp`, exposes the same deploy/repository operations as MCP tools for AI agents, authenticated with a Bearer JWT verified against an external auth-server (see "MCP server" below).
- **Claude Code plugin** (`.claude-plugin/`): the same MCP tools served over stdio (`mcpServer/stdio.js`, bundled into `bundle/server.js`) so anyone can install deckhand with `/plugin install` — see "Plugin" below. Skills and agents will be added at the plugin root (`skills/`, `agents/`).

## Package manager

Yarn 4 with `nodeLinker: node-modules` (see `.yarnrc.yml`; not PnP). Install with `yarn install`, add packages with `yarn add <pkg>`.

## Commands

```bash
# Backend (repo root)
yarn start                 # node server.js (port 4000, or $PORT)

# Plugin (repo root)
yarn build:plugin          # bundle mcpServer/stdio.js → bundle/server.js (commit it after every MCP/utils change)
yarn mcp                   # run the stdio MCP server from source (reads the root .env)
yarn encrypt:private       # encrypt the plaintext skills/agents/commands into private.enc (commit it after every change)
claude plugin validate .   # validate plugin.json + marketplace.json

# Quick GitLab connectivity check
yarn node -e "require('./gitlab/index.js').Users.showCurrentUser().then(u => console.log(u.username))"
```

Secrets live in a root `.env` (gitignored; `.env.example` is the template): `GITLAB_HOST`, `GITLAB_TOKEN`, `ENTORNO_NEW_PASSWORD`, `ENTORNO_NEW_PASSWORD_CRM` (optional), `PORT`, `DECKHAND_HOME` (optional), `MCP_PUBLIC_URL`, and the `MCP_AUTH_*` vars (see "MCP server" below). Both entry points (`server.js`, `main.js`) call `require('dotenv').config()` on their first line — it must run before any local `require`, since `gitlab/index.js` reads the env at import time. Never commit the `.env` or copy its values elsewhere.

In production the app runs under pm2 via `ecosystem.config.js` (versioned, no secrets inside — it loads the same `.env` with dotenv and passes it as pm2's `env`). After editing `.env`, apply it with `pm2 reload ecosystem.config.js --update-env`.

## Database (SQLite)

Deploys live in a single SQLite file, `deckhand.db` inside the data dir (`database/dataDir.js`: `DECKHAND_HOME`, default `~/.deckhand`, also home of `errors.log`). It sits outside the repo on purpose so it survives reinstalls/updates when deckhand is distributed as a Claude plugin, and there's no database server or Docker container to run. It uses Node's built-in `node:sqlite` (requires Node 22.13+, see `engines` in `package.json`; Node prints an `ExperimentalWarning` on startup, which is harmless) — no native modules, no ORM, no generated client, no postinstall step.

- `database/client.js` — the singleton `DatabaseSync`. The data dir is created by `database/dataDir.js`; enables WAL + `busy_timeout`, and runs `database/migrate.js` on open. Import it with `require("../database/client")` and reuse it — never open a second connection.
- `database/migrate.js` — ordered list of SQL migrations; `PRAGMA user_version` stores how many have been applied, and the pending ones run in a transaction on every startup. To change the schema, append a new entry — never edit one that has already shipped.
- `database/deployRow.js` — single `deploys` table mirroring the old `database/deploys.json` record shape 1:1. SQLite has no booleans/dates/JSON, so `toRow` stores `messenger` as 0/1, `createdAt` as an ISO string and `project` (the cached GitLab project data `findRepository` returns) as JSON text, and `fromRow` converts them back. `toRow` drops unknown keys and turns `undefined` into `null`.
- `remote_actions` (migration 2) — audit log of every `remote_*` tool call, including the ones the policy blocked (`utils/logRemoteAction.js`, `utils/listRemoteActions.js`). No FK to `deploys`, so the log survives deleting the deploy.
- `utils/*Deploy*.js` keep their async signatures, so services/controllers/MCP tools didn't change.
- `scripts/migrateDeploysJsonToDb.js` — one-off, idempotent import of a historical `database/deploys.json` into the SQLite table.

## Project structure

```
server.js          — starts sm-express-server on :4000, mounts router, mounts the MCP server under /mcp; logs unhandledRejection/uncaughtException via logError
router/index.js    — declares the REST routes, delegating to controllers/ (each wrapped with router/withErrorLogging.js: logs the error and responds 500)
controllers/       — one controller per endpoint, re-exported from controllers/index.js; the 4 that wrap non-trivial deploy operations (deployEntornoController, deleteDeployController, openVscodeController, redeployEntornoController) are thin callers of services/
services/          — shared business logic for the 4 non-trivial deploy operations (create/delete/redeploy/open-vscode), called by both controllers/ (REST) and mcpServer/tools/ (MCP) so the two surfaces never diverge; re-exported from services/index.js; throw utils/HttpError.js on expected failures (404/409/400/502)
mcpServer/         — MCP server exposing deckhand's operations as tools for AI agents (see "MCP server" below); named mcpServer/ rather than mcp/ so its directory name doesn't collide with the /mcp route if a static folder is ever served (see server.js); includes wellKnown.js (OAuth Protected Resource Metadata)
main.js            — legacy CLI-style entry point; orchestrates utils directly
gitlab/index.js    — configured @gitbeaker/rest client
utils/             — one function per file, re-exported from utils/index.js
database/client.js    — singleton node:sqlite DatabaseSync (see "Database" above)
database/migrate.js   — schema migrations, applied on open, versioned with PRAGMA user_version
database/deployRow.js — deploy object ⇄ SQLite row conversion (COLUMNS, toRow, fromRow)
database/deploys.json — historical JSON backup, no longer read/written by the app (gitignored)
database/dataDir.js   — data dir (DECKHAND_HOME, default ~/.deckhand) holding deckhand.db and errors.log (one JSON line per error, written by utils/logError.js)
ecosystem.config.js   — pm2 config; reads the root .env with dotenv (versioned, holds no secrets)
.env                  — secrets: GITLAB_HOST/TOKEN, ENTORNO_NEW_PASSWORD, PORT, DECKHAND_HOME (gitignored; see .env.example)
scripts/migrateDeploysJsonToDb.js — one-off deploys.json → SQLite import (see "Database" above)
skills/            — Claude Code skills (one `<name>/SKILL.md` per skill) useful for this project, exposed via the MCP tools list_skills/get_skill so an agent that connects to deckhand can discover and install them; see skills/README.md for the format. Gitignored except README.md: published encrypted in private.enc (see "Private content")
privateContent/    — encryption/decryption of the private skills/agents/commands (private.enc); see "Private content"
private.enc        — the encrypted private content (versioned, generated by `yarn encrypt:private`)
.claude-plugin/    — plugin.json (userConfig + stdio mcpServers) and marketplace.json (this repo is its own marketplace)
mcpServer/stdio.js — stdio entry point of the plugin's MCP server
settings/          — user-editable settings (config.json in the data dir, .env fallback); see "Settings & admin panel"
remote/            — SSH/SFTP access to an entorno for the remote_* MCP tools (ssh2 connection pool, exec, sftp, audit wrapper); see "Remote tools"
policy/            — what the remote_* tools may do (policy.json in the data dir, editable in the admin panel); see "Remote tools"
adminPanel/        — local settings web panel served by the open_settings MCP tool
commands/          — plugin slash commands (/deckhand:settings)
bundle/server.js   — esbuild bundle of mcpServer/stdio.js (generated by `yarn build:plugin`, versioned: it's what the plugin runs)
scripts/buildPlugin.js — esbuild config for the bundle
```

### API routes (router/index.js)

| Method | Route | Controller |
|---|---|---|
| GET | `/repositories` | getRepositoriesController |
| GET | `/repositories/:id/branches` | getBranchesController |
| GET | `/repositories/:id/tree?ref&path` | getRepositoryTreeController |
| GET | `/repositories/:id/file?ref&path` | getRepositoryFileController |
| GET | `/deploys` | getDeploysControllers |
| GET | `/deploys/:id` | getDeployController |
| DELETE | `/deploys/:id` | deleteDeployController |
| POST | `/deploys/:id/open-vscode` | openVscodeController |
| POST | `/deploys/:id/redeploy` | redeployEntornoController |
| POST | `/deploy` | deployEntornoController |

## MCP server (mcpServer/)

`mcpServer/` mounts a [Model Context Protocol](https://modelcontextprotocol.io) server on the same Express app (`server.app`) at `POST /mcp`, mirroring the REST API above as tools so AI agents can drive deckhand. Uses `@modelcontextprotocol/sdk`'s `StreamableHTTPServerTransport` in stateless mode (`sessionIdGenerator: undefined`): a fresh `McpServer` + transport is built per request (`mcpServer/server.js`, `mcpServer/router.js`), so every call is authenticated independently and there's no session state to keep in sync across pm2/processes.

Deckhand is only the **resource server** here — the auth-server (a separate project, `../auth-server`, an `oidc-provider`-based OAuth 2.1/OIDC server at `https://auth.sinul.es`) is the authorization server. This is what makes an AI agent able to "connect to deckhand" the same way one connects to a Gmail/Vercel MCP connector — open a browser, log in and authorize on the auth-server, get redirected back with credentials — without deckhand or its operator having to hand-register every possible agent as a static OAuth client:

- `mcpServer/wellKnown.js` — serves Protected Resource Metadata (RFC 9728) at `GET /.well-known/oauth-protected-resource/mcp` (and aliased at the `.well-known` root), built from `MCP_PUBLIC_URL`/`MCP_AUTH_ISSUER`/`MCP_AUTH_REQUIRED_SCOPES`. This is the discovery document an MCP client reads to learn which authorization server to use — deckhand never serves `/.well-known/oauth-authorization-server` itself (that metadata legitimately lives on the auth-server's own origin, not deckhand's).
- `mcpServer/auth/` — Bearer JWT auth, applied as router-level middleware before any tool runs. `tokenVerifier.js` verifies the token (signature via JWKS or a static `MCP_AUTH_PUBLIC_KEY`, plus issuer/audience/algorithm) against the external auth-server and maps its claims to the SDK's `AuthInfo` shape; claim names are confirmed against the real auth-server (`oidc-provider`'s JWT access token format): always `client_id` (never `azp`), `scope` as a space-separated string. `jwksClient.js` is a singleton `jwks-rsa` client (same "build once from env, reuse" pattern as `gitlab/index.js`); `index.js` wires both into the SDK's own `requireBearerAuth` middleware, passing `resourceMetadataUrl` so a 401 without a token includes a `WWW-Authenticate: Bearer resource_metadata="..."` header pointing at `wellKnown.js` — this is the actual thread MCP clients pull to auto-discover the auth-server, no manual client configuration needed.
- On the auth-server side, agents self-register via Dynamic Client Registration (`features.registration` in `../auth-server/packages/api/src/config/provider.ts`) instead of being added by hand to `config/clients.ts` — see that repo's CLAUDE.md. `resourceIndicators.getResourceServerInfo` there recognizes deckhand's resource URL (`DECKHAND_RESOURCE_URL` / `MCP_AUTH_AUDIENCE`, must match on both sides) and mints JWT access tokens scoped to it.
- `mcpServer/tools/` — one tool per file (zod `inputSchema`, `handler`), re-exported from `mcpServer/tools/index.js`, registered by `mcpServer/registerTools.js`. The 13 read-only/simple tools (including `get_repo_catalog`, `list_active_deploys`, `list_pipelines`, `get_pipeline_jobs`, `list_skills`, `get_skill` and `search_repository`) call `utils/*` directly (same as their REST controllers); `delete_deploy`, `redeploy_entorno`, `create_deploy` call the shared `services/*` (see "Project structure" above) so behavior can't drift from the REST endpoints. Every tool's zod fields carry a `.describe()` explaining what deckhand does with that input (e.g. `entornoUrl`'s chaining semantics, `type`'s effect, branch-naming convention) — an outdated or missing description makes an agent guess wrong with full confidence, so keep it in sync when the underlying behavior changes.
- `get_repo_catalog` (`mcpServer/tools/getRepoCatalog.js` → `utils/getRepoCatalog.js`) classifies `listRepositories()`'s repos by `pais` (`es`/`pt`, from the name's `-es`/`-pt` suffix) and `rol` (`api`/`backend`/`frontend`), reusing the same `utils/repoRoles.js` name lists (`SYNC_ENV_PROJECTS`/`FRONTEND_TEST_PROJECTS`/`MESSENGER_PROJECTS`) that `createEntorno.js` uses to decide behavior — single source of truth, so the catalog can't drift from what actually happens on deploy. Lets an agent resolve "the `store-api` for `pt`" to a `projectId` without reading past deploys to reverse-engineer which id is which country/role.
- `list_deploys` (both REST and MCP) takes optional `branchName`/`projectName` (partial match), `status` (exact) and `limit` filters via `utils/listDeploys.js`; the MCP tool additionally defaults to a `compact` shape (`id`/`branchName`/`projectName`/`status`/`url` only) since the full unfiltered list can be tens of thousands of characters and blow an agent's context.
- `list_active_deploys` (MCP-only, no REST equivalent) is `list_deploys` narrowed to in-progress deploys (`status` in `creando`/`instalando`, via `utils/listActiveDeploys.js`), so an agent can check for an already-running deploy on a repo/branch before calling `create_deploy`, or follow up on in-flight ones, without filtering the full list itself. Same optional `branchName`/`projectName`/`limit` filters and `compact` default as `list_deploys`.
- `list_pipelines` and `get_pipeline_jobs` (MCP-only, no REST equivalent) wrap `utils/listPipelines.js`/`utils/listPipelineStages.js` directly, exposing the raw GitLab pipeline/job state — as opposed to `list_deploys`/`get_deploy`/`list_active_deploys`, which only reflect deckhand's own `deploys` row. Same mechanism `createEntorno.js`'s `waitForStage.js` polls internally to decide when a deploy is done: `list_pipelines` finds the pipeline for a ref, `get_pipeline_jobs` returns its stages/jobs so an agent can check the `deploy_workers` stage's status directly against GitLab instead of (or in addition to) deckhand's DB status.
- `list_skills` and `get_skill` (MCP-only, no REST equivalent) expose the `skills/` folder (see "Project structure" above) via `utils/listSkills.js`/`utils/getSkill.js`. `utils/readSkillFile.js` (a minimal frontmatter parser, no YAML dependency — just flat `key: value` lines) reads each skill's `SKILL.md` for `list_skills`'s `name`/`description` and to validate a skill exists. `get_skill` returns the whole `skills/<name>/` folder — not just `SKILL.md`, since a skill can ship scripts/references/assets alongside it — zipped with `adm-zip` (`name` as the zip's root folder) and sent back as an MCP `resource` content block (`mcpServer/toolResult.js`'s `resourceResult`, base64 `blob` + `application/zip` `mimeType`), so an agent connecting to deckhand can install it by unzipping straight into `.claude/skills/`.
- `mcpServer/withToolErrorLogging.js` — wraps every tool handler: on success returns its result as-is; on a thrown error, logs via `utils/logError.js` (unless `error.alreadyLogged`, e.g. a `services/*` `HttpError`) and returns `{isError: true, content: [...]}` — the MCP-native way to surface a failed call to the agent, mirroring what `router/withErrorLogging.js` does for REST.
- `create_deploy` and `redeploy_entorno` keep the REST API's fire-and-forget shape: the tool returns immediately once the deploy row is created/updated, with a note telling the agent to poll `get_deploy` until the status is `listo`/`error`. Unlike the REST controllers, they call `services/createDeploy`/`services/redeployEntorno` with `remoteInstall: false`: the initial SSH login (forced password change), copying the SSH key and opening VS Code all require running commands on a real machine, and that must be the MCP caller's machine, not the box deckhand's server runs on — so for `remoteInstall: false` the deploy is marked `listo` as soon as the entorno itself exists (branch + pipeline + SSH access), skipping the `instalando` status and `installEntorno`. The forced password change then happens lazily: the first `remote_*` call or `open_vscode` runs `loginEntorno`.
- `open_vscode` calls `services/openVscode`: `loginEntorno` (forced password change, if pending) and then `openRemoteVscode`, which opens a `vscode://vscode-remote/ssh-remote+user@host:port/path` URL through `utils/openInBrowser.js` instead of spawning `code` (not always in the PATH, and `code.cmd` on Windows). With the plugin this runs on the user's own machine.
- New `.env` vars (see `.env.example`): `MCP_PUBLIC_URL` (deckhand's own public URL, used to build the metadata above), `MCP_AUTH_ISSUER`, `MCP_AUTH_AUDIENCE`, `MCP_AUTH_JWKS_URI` (or `MCP_AUTH_PUBLIC_KEY` as a static-key fallback), `MCP_AUTH_ALGORITHMS`, `MCP_AUTH_REQUIRED_SCOPES`.

### Remote tools (remote/, policy/)

- `remote_load_context`, `remote_exec`, `remote_read_file`, `remote_write_file`, `remote_edit_file`, `remote_list_dir`, `remote_db_query` work inside the entorno of a deploy (`type` entorno, status `listo`); relative paths resolve against `rutaRaiz`. `list_remote_actions` reads the audit table. Tools carry MCP `annotations` (`readOnlyHint`/`destructiveHint`), passed through by `registerTools.js`.
- `remote/getConnection.js` — pool of `ssh2` connections (one per deploy+host+port, closed after 5 min idle) with an SFTP session each. Authenticates with `utils/getEntornoPassword.js`'s password; on an auth failure it runs `loginEntorno` (forced password change) and retries. Host keys aren't checked (entornos get a new one on every redeploy).
- `remote/runRemoteAction.js` — common skeleton of every remote tool: loads deploy + policy, runs the action, writes the `remote_actions` row (allowed/blocked/error, exit code, duration). `block(reason)` throws a 403 `HttpError`.
- `policy/` — `policy.json` in the data dir (`DEFAULT_POLICY` in `defaults.js` when missing; a broken file throws instead of silently falling back). `database`: `deny` | `readonly` | `allow`; `commandDenyPatterns` (regex vs the full command); `writeDenyPaths` (globs: no "/" → basename, leading "/" → absolute path, otherwise relative to `rutaRaiz`); `databaseConnection` (env files + variable `remote_db_query` reads the MySQL URL from). DB client/Doctrine patterns (`DATABASE_COMMAND_PATTERNS`) aren't user-editable: they're governed by `database`. In `readonly`, `remote_db_query` runs the query inside `START TRANSACTION READ ONLY` with the server's own `mysql` client, so MySQL itself rejects writes.
- The policy is a guard against an honest agent's mistakes, not a security boundary (the agent is root on the box). Tool descriptions tell the agent not to work around a block.
- `remote_load_context` gives the agent the entorno's own Claude Code context, which Claude Code never loads (it only reads the local folder's): `remote/loadEntornoContext.js` discovers everything in one `remote_exec`-style script (`~/.claude/CLAUDE.md`, ancestor `CLAUDE.md`/`CLAUDE.local.md`, the root `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md`, `.claude/rules`, `.claude/skills/*/SKILL.md`, `.claude/agents`, `.claude/commands`, `.claude/settings.json` — following symlinks under `.claude/` with `find -L`, as Claude Code does, since shared skills are often linked from another folder — and nested `CLAUDE.md` pruning `vendor`/`node_modules`/...), reads them over SFTP, resolves `@path` imports (`findImports.js`, outside code, max depth 4) and caps the inlined text at 200 KB. Skills/agents/commands only go as an index (`parseFrontmatter.js`: name/description), nested `CLAUDE.md` only as paths: the agent reads them on demand, like Claude Code does. `formatEntornoContext.js` turns it into markdown with instructions on how to apply each part.
- `mcpServer/withEntornoContextNotice.js` wraps every other `remote_*` tool (see `registerTools.js`): the first call on a deploy that has `CLAUDE.md`/`.claude` and hasn't run `remote_load_context` gets a notice prepended telling the agent to call it. State lives in `remote/entornoContextNotice.js`, per process and per deploy+host+port (a redeploy counts as new); shown once.
- The `work-in-entorno` skill (private, encrypted in `private.enc`) tells the agent how to apply that context: entorno instructions override the local project's inside the entorno, remote skills are followed by translating their steps to `remote_*`, remote agents become a subagent with the agent's body as prompt.

### Plugin (stdio)

- `.claude-plugin/plugin.json` declares an inline `mcpServers.deckhand` entry that runs `node ${CLAUDE_PLUGIN_ROOT}/mcpServer/launch.js`. No `userConfig`: GitLab host/token and the entorno password are set in the admin panel (see "Settings & admin panel" below). No OAuth/auth-server here: the server is a local child process of Claude Code. `commands/settings.md` is the `/deckhand:settings` command (calls the `open_settings` tool). `.claude-plugin/marketplace.json` lists the repo root (`"source": "./"`) so `/plugin marketplace add 330namajnoon/deckhand` works.
- The plugin is installed by copying the repo, without `yarn install`, so it can only run the self-contained `bundle/server.js`. Rebuild it with `yarn build:plugin` whenever `mcpServer/`, `services/`, `utils/`, `database/`, `settings/`, `adminPanel/`, `remote/`, `policy/`, `privateContent/` or `gitlab/` change. `plugin.json` has no `version` on purpose: Claude Code then uses the git commit SHA, so every push is a new version and users with auto-update on (see README) get it without anyone bumping a number. Don't add one back — a pinned `version` keeps everybody on the cached copy until the string changes.
- `mcpServer/launch.js` is the plugin's entry point, not part of the bundle: Claude Code starts it with whatever `node` is first in its PATH (often an old nvm version), while the bundle needs Node >= 22.13 for `node:sqlite`. If the current Node is new enough it just `require`s `bundle/server.js`; otherwise it looks for the newest valid Node (`DECKHAND_NODE`, PATH, nvm/nvm-windows, Volta, fnm, asdf, Homebrew/Program Files, with the Windows layouts where `node.exe` sits at the version root) and spawns the bundle with it, stdio inherited and signals forwarded. Keep it dependency-free and Node-18-compatible, and write only to stderr.
- **stdout is the MCP channel.** `mcpServer/stdio.js` gives the transport its own reference to the real stdout and redirects `process.stdout.write`/`console.log`/`console.info` to stderr, so the existing `console.log`s and `waitForStage`'s spinner can't corrupt the protocol. Child processes must not inherit stdio either: spawn with `stdio: "ignore"` or `["ignore", "pipe", "pipe"]` (see `openInBrowser.js`). Keep that for any new `spawn`.
- **Cross-platform (Windows/macOS/Linux).** The plugin must not depend on system binaries beyond Node: SSH goes through `ssh2` (no `expect`, no `ssh` CLI), remote paths use `path.posix`, local paths `os.homedir()`/`path.join`. The only optional binary is `ssh-keygen` (clearing `known_hosts` for VS Code's Remote-SSH; errors ignored).
- `mcpServer/stdio.js` loads dotenv only from the repo-root `.env` (dev), never from the cwd — under the plugin the cwd is the user's project.

### Settings & admin panel

- `settings/` — the user-editable settings. `definitions.js` lists them (`GITLAB_HOST`, `GITLAB_TOKEN`, `ENTORNO_NEW_PASSWORD`, `ENTORNO_NEW_PASSWORD_CRM`; key, label, description, `sensitive`, `required`) — add an entry there and the panel shows it. They're stored in `<data dir>/config.json` (`configFile.js`, written atomically with mode 600 by `saveSettings.js`). `getSetting(key)` reads the file on every call and falls back to `process.env[key]` (the web server's `.env`), so panel changes apply without restarting. Read these settings through `getSetting`, never `process.env`. `describeSettings()` is what the panel gets: sensitive values are never sent, only `isSet` and `source` (`panel`/`env`). An empty sensitive field on save means "unchanged"; clearing goes through `clear`.
- `gitlab/index.js` exports a `Proxy` over a lazily built `Gitlab` client that's rebuilt when host/token change; it throws a "configure it in /deckhand:settings" error on use (not on import) if they're missing, so the MCP server always starts.
- `adminPanel/startAdminPanel.js` — plain `http` server on `127.0.0.1:<random port>`, started once per process by the `open_settings` MCP tool (`utils/openInBrowser.js` opens it). Every route lives under a random 48-hex-char token path; requests with a different `Host` header get 403 (DNS rebinding), POSTs must be `application/json`. Routes: `GET /` (page from `renderPage.js`, an inline string so it gets bundled — escape `\n` as `\\n` in its client script), `GET|POST /api/settings`, `GET|POST /api/policy` (remote tools policy), `POST /api/test` (calls `Users.showCurrentUser()` with the saved settings). Closes after 30 min idle; `unref`'d so it never keeps the process alive. The web server's HTTP MCP also exposes `open_settings`, but there it would open a browser on the server machine — it's meant for the plugin.

### Private content (privateContent/)

- The repo is public, so the plugin's skills, agents and commands ship encrypted in `private.enc`: a zip of every file under `skills/`, `agents/` and `commands/` except `PUBLIC_FILES` (`skills/README.md`, `commands/settings.md`, see `privateContent/paths.js`), encrypted with AES-256-GCM and a scrypt-derived key (`cipher.js`; params and salt in the header, which is also the AAD). The plaintext files are gitignored and only exist on the author's machine (or after decrypting).
- `yarn encrypt:private` (`scripts/encryptPrivate.js`) reads `PRIVATE_CONTENT_PASSWORD` from the root `.env` (min 32 chars), writes `private.enc` and the marker. Run it after creating/changing a private skill, then commit `private.enc` (no bundle rebuild: skills aren't bundled). After an update the new plugin folder starts without the decrypted files: the MCP decrypts them on startup, but Claude Code has already scanned `skills/` by then, so they show up one `/reload-plugins` later.
- `PRIVATE_CONTENT_PASSWORD` is also a sensitive setting in the admin panel. Saving it there first runs `unlockPrivateContent` (a wrong password → 400 and nothing is saved), which extracts the zip into the plugin root (only paths inside the content dirs, never over a public file) and writes `.private-unlocked.json` (gitignored: hash of `private.enc` + extracted files, so stale files from an older version get removed).
- A plugin update lands in a new folder, so `ensurePrivateContent` runs on startup (`mcpServer/stdio.js` and `server.js`): if `private.enc`'s hash doesn't match the marker and the password is saved, it decrypts again. Claude Code only picks the new skills up after `/reload-plugins` or a restart.
- In the dev repo, pulling a new `private.enc` and restarting overwrites the local plaintext with its content; re-encrypt before pulling if you have unencrypted changes.

### Infrastructure

`https://deckhand.sinul.es` lives in its own `server{}` block (subdomain, not a path under `sinul.es` — the API assumes root-relative routes) inside `/etc/nginx/sites-available/my_projects`, proxying to `localhost:4200` (`PORT` in `.env`). Reference copy versioned in `infra/nginx/deckhand.sinul.es.conf`, same pattern as `../auth-server/infra/nginx/auth.sinul.es.conf`. Certificate managed by certbot.

### utils/

```
findRepository.js      — finds a GitLab project by name, returns id/branches/urls
listRepositories.js    — lists GitLab projects
getRepoCatalog.js      — listRepositories() annotated with pais/rol (see repoRoles.js), for the MCP get_repo_catalog tool
repoRoles.js           — SYNC_ENV_PROJECTS/FRONTEND_TEST_PROJECTS/MESSENGER_PROJECTS name lists; single source of truth shared by createEntorno.js (behavior) and getRepoCatalog.js (classification)
readSkillFile.js       — reads skills/<name>/SKILL.md and parses its minimal name/description frontmatter; shared by listSkills.js and getSkill.js
listSkills.js          — lists the skills/ subfolders with name/description, for the MCP list_skills tool
getSkill.js            — returns one skill's raw SKILL.md content by name (404 via HttpError if missing), for the MCP get_skill tool
listBranches.js        — lists branches of a project
listRepositoryTree.js  — lists files/folders of a repo path
getRepositoryFile.js   — fetches a repo file's content decoded as utf8
searchRepository.js    — greps a repo's default branch for a text/term via GitLab's blobs search (Search.all), for the MCP search_repository tool
listPipelines.js       — lists pipelines of a project
listPipelineStages.js  — lists jobs/stages of a pipeline
createPipeline.js      — triggers a pipeline for a ref
waitForStage.js        — polls a pipeline until a stage/job reaches a state; on failed/canceled, fetches the failing job's log (tail, via getJobLog.js) and its webUrl (plus the pipeline's, if passed in) into the thrown error, so the error string is enough to diagnose the cause without opening GitLab
getJobLog.js           — fetches a job's log (trace)
HttpError.js           — Error subclass with a `status` and `alreadyLogged`; thrown by services/ and mapped back to a response by controllers/ (res.status) and mcpServer/ tools (isError result)
createBranch.js        — creates a branch in a repo
deleteBranch.js        — deletes a branch from a repo
createBranchWithCommit.js — creates a branch whose first commit applies a set of file actions (single pipeline)
syncEntornoEnv.js      — builds the commit action pointing envs/.env.entorno (API_MONO_URL, STORE_API_URL) at another entorno's url
enableMessenger.js     — builds the commit actions enabling messenger (supervisor conf + _s suffix on ent_* transports in messenger.yaml)
duplicateTestEnvFolder.js — builds the commit actions duplicating every envs/template-branches-test folder as envs/<branch> for store-frontend-v2-* test entornos (monorepos: one per app, e.g. checkout/ and coverage/), pointing environment.js's window.env_target at the synced entorno's url, if any
createEntorno.js       — creates a task environment (branch + pipeline + log parsing)
parseEntornoLog.js     — parses environment data (e.g. SSH string) from a job log
installEntorno.js      — installs the created environment: first SSH login (loginEntorno), then copySshKeyToEntorno; a failed key copy is logged but doesn't fail the install
copySshKeyToEntorno.js — copies the local ~/.ssh/id_ed25519 to the entorno's ~/.ssh/id_rsa (mode 600) over ssh2 SFTP with the NEW password, and checks the size, so git push/pull work from the entorno
loginEntorno.js        — first SSH login, resolves the forced password change: clears known_hosts (for VS Code's Remote-SSH), skips everything if the new password already works, otherwise runs changeEntornoPassword and verifies with checkEntornoLogin
changeEntornoPassword.js — forced password change over ssh2 (no expect): shell with a pty answering the "current"/"New"/"Retype new" prompts ("Retype new" checked first), also via keyboard-interactive/PAM; rejects with code BAD_PASSWORD (pam_pwquality) or STUCK (60s timeout)
getEntornoPassword.js  — new password for an entorno: ENTORNO_NEW_PASSWORD_CRM for CRM projects (if set), ENTORNO_NEW_PASSWORD otherwise
checkEntornoLogin.js   — ssh2 login + `echo` without TTY: the only reliable proof the forced password change happened
redeployEntorno.js     — re-runs the deploy of an existing entorno
openRemoteVscode.js    — opens the entorno in VS Code (Remote-SSH) through a vscode:// URL
openInBrowser.js       — opens a URL in the system browser (open / xdg-open / start), without inheriting stdio
logRemoteAction.js     — writes a remote_actions audit row (SQLite); never throws
listRemoteActions.js   — latest remote_actions rows, optionally by deploy (SQLite)
logError.js            — appends an error entry (timestamp, context, message, stack, details) to errors.log in the data dir; never throws
saveDeploy.js          — creates a deploy row (SQLite)
updateDeploy.js        — updates a deploy row by id (SQLite); keys set to `undefined` are written as `null` (clears the field, matching the old JSON-spread behavior)
removeDeploy.js        — deletes a deploy row by id (SQLite)
getDeploy.js            — fetches one deploy row by id (SQLite)
listDeploys.js          — fetches deploy rows, most recent first (SQLite); optional { branchName, projectName, status (value or list), limit } filters
findActiveDeploy.js     — finds an in-progress deploy ("creando"/"instalando") for the same repo/task/type (SQLite)
listActiveDeploys.js    — lists in-progress deploys ("creando"/"instalando"), most recent first, via listDeploys; optional { branchName, projectName, limit } filters, for the MCP list_active_deploys tool
```

## Architecture & conventions

- `gitlab/index.js` — exports a `@gitbeaker/rest` client (lazy `Proxy`, see "Settings & admin panel") pointing at the self-hosted instance given by the `GITLAB_HOST` setting. Import it with `require('./gitlab')` and call the API surface directly (e.g. `api.Users.showCurrentUser()`). Do not import the deprecated `@gitbeaker/node` package name.
- The code is CommonJS (`require`/`module.exports`).
- "One thing per file, re-exported from the folder's `index`" applies everywhere: `utils/`, `controllers/`, `services/`, `mcpServer/tools/`.
- Business logic shared between the REST API and the MCP server lives in `services/`, not duplicated in `controllers/`/`mcpServer/tools/`. Only add a new `services/*` file when a second surface (MCP, a future CLI, etc.) needs the same non-trivial logic a controller already has — trivial single-`utils/*`-call controllers don't need one.
