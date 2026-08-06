# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"asystent" is a Node.js assistant for automating GitLab workflows (pipelines, branches, environment creation/installation). It has two parts:

- **Backend** (repo root): CommonJS Node.js server (`server.js`) built on `sm-express-server`, exposing a REST API that orchestrates the utilities in `utils/` and persists deploys in `database/deploys.json`.
- **Frontend** (`public/`): React 19 + TypeScript + Vite + styled-components SPA (react-router) to launch and monitor deploys. The production build (`public/dist`) is served by the backend under `/dist`.

## Package manager

Both root and `public/` use Yarn 4 with `nodeLinker: node-modules` (see `.yarnrc.yml`; not PnP). Install with `yarn install`, add packages with `yarn add <pkg>`. Each part has its own `package.json`/`yarn.lock`.

## Commands

```bash
# Backend (repo root)
yarn start                 # node server.js (port 4000, or $PORT)

# Frontend (from public/)
yarn dev                   # Vite dev server (calls API at http://localhost:4000)
yarn build                 # tsc -b && vite build → public/dist
yarn lint                  # eslint .

# Quick GitLab connectivity check
yarn node -e "require('./gitlab/index.js').Users.showCurrentUser().then(u => console.log(u.username))"
```

In production the app runs under pm2 via `ecosystem.config.js` (gitignored — contains `GITLAB_TOKEN`, `ENTORNO_NEW_PASSWORD` and other secrets; never commit it or copy its values elsewhere).

## Project structure

```
server.js          — starts sm-express-server on :4000, mounts router and serves public/dist under /dist (with index.html fallback for react-router); logs unhandledRejection/uncaughtException via logError
router/index.js    — declares the REST routes, delegating to controllers/ (each wrapped with router/withErrorLogging.js: logs the error and responds 500)
controllers/       — one controller per endpoint, re-exported from controllers/index.js
main.js            — legacy CLI-style entry point; orchestrates utils directly
gitlab/index.js    — configured @gitbeaker/rest client
utils/             — one function per file, re-exported from utils/index.js
database/deploys.json — JSON persistence of deploys (read/written by save/update/removeDeploy)
database/errors.log   — backend error log (one JSON line per error, written by utils/logError.js; gitignored)
ecosystem.config.js   — pm2 config + env secrets (gitignored)
scripts/           — (empty for now)
public/            — frontend (see below)
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

### utils/

```
findRepository.js      — finds a GitLab project by name, returns id/branches/urls
listRepositories.js    — lists GitLab projects
listBranches.js        — lists branches of a project
listRepositoryTree.js  — lists files/folders of a repo path (for the code editor)
getRepositoryFile.js   — fetches a repo file's content decoded as utf8
listPipelines.js       — lists pipelines of a project
listPipelineStages.js  — lists jobs/stages of a pipeline
createPipeline.js      — triggers a pipeline for a ref
waitForStage.js        — polls a pipeline until a stage/job reaches a state
getJobLog.js           — fetches a job's log (trace)
createBranch.js        — creates a branch in a repo
deleteBranch.js        — deletes a branch from a repo
createBranchWithCommit.js — creates a branch whose first commit applies a set of file actions (single pipeline)
syncEntornoEnv.js      — builds the commit action pointing envs/.env.entorno (API_MONO_URL, STORE_API_URL) at another entorno's url
enableMessenger.js     — builds the commit actions enabling messenger (supervisor conf + _s suffix on ent_* transports in messenger.yaml)
duplicateTestEnvFolder.js — builds the commit actions duplicating every envs/template-branches-test folder as envs/<branch> for store-frontend-v2-* test entornos (monorepos: one per app, e.g. checkout/ and coverage/), pointing environment.js's window.env_target at the synced entorno's url, if any
createEntorno.js       — creates a task environment (branch + pipeline + log parsing)
parseEntornoLog.js     — parses environment data (e.g. SSH string) from a job log
installEntorno.js      — installs the created environment via SSH/expect
loginEntorno.js        — first SSH login, resolves the forced password change (uses ENTORNO_NEW_PASSWORD)
redeployEntorno.js     — re-runs the deploy of an existing entorno
runExpect.js           — helper to run expect scripts (SSH automation)
openRemoteVscode.js    — opens the entorno remotely in VS Code
logError.js            — appends an error entry (timestamp, context, message, stack, details) to database/errors.log; never throws
saveDeploy.js          — appends a deploy record to database/deploys.json
updateDeploy.js        — updates a deploy record in database/deploys.json
removeDeploy.js        — removes a deploy record from database/deploys.json
```

## Frontend structure (public/src)

```
main.tsx           — React entry point
App.tsx            — routes: / (Home), /deploy (Deploy), /deploys (Deploys)
constants.ts       — app constants: API_URL, API_ROUTES (all backend routes; parametrized ones are functions, e.g. API_ROUTES.redeploy(id)), POLL_INTERVAL, MAX_SUGGESTIONS
types.ts           — shared types: Deploy, DeployStatus, EntornoType, Repository
api.ts             — apiRequest<T>(url, options): fetch wrapper that parses JSON and throws Error with the backend's body.error message
hooks/
  useFetch.tsx     — GET hook: { data, error, loading, loader, setData }. url: null skips the fetch (conditional fetches); loader is a ready-to-render inline <Loading /> spinner while loading; setData allows local updates after mutations
components/        — shared components, re-exported from components/index.ts
  Page/            — page layout: container (maxWidth prop) + h1 title
  Loading/         — fetch loading indicator; block mode ("Cargando...") or inline mode (small spinner next to a field label); also exports Spinner
  ErrorBox/        — red error box
  Button/          — button with variant (primary | danger | warning) and small props
  Badge/           — status pill colored by deploy status
  Form/            — styled form controls: Form, Field, Input, Select, CheckboxField
  DeploySteps/     — deploy progress steps (creando → instalando → listo) with per-step state; test entornos skip the install step
  DeployResult/    — result box for a finished deploy (entorno, url, SSH string, expiry)
  DeployItem/      — row in the deploys list with its actions (open in VS Code, redeploy, delete); each row manages its own loading/error state
  CodeEditor/      — in-page code editor (CodeMirror 6): browses the repo tree, edits files and accumulates the saved changes as GitLab commit actions (EditAction[]) that the deploy applies in the branch's first commit
pages/             — one folder per route
  Home/            — links to the other pages
  Deploy/          — deploy form (repo/branch/entorno datalists fed by useFetch), polls the deploy status every POLL_INTERVAL while in progress
  Deploys/         — searchable list of deploys
```

## Architecture & conventions

- `gitlab/index.js` — exports a configured `@gitbeaker/rest` client (`Gitlab` instance) pointing at the self-hosted instance given by `GITLAB_HOST`. Import it with `require('./gitlab')` and call the API surface directly (e.g. `api.Users.showCurrentUser()`). Do not import the deprecated `@gitbeaker/node` package name.
- Backend is CommonJS (`require`/`module.exports`); frontend is TypeScript ESM.
- "One thing per file, re-exported from the folder's `index`" applies everywhere: `utils/`, `controllers/`, and front `components/`/`pages/`.
- Front components/pages follow the folder convention: `Name/Name.tsx` + `Name/styles.ts` (styled-components, transient `$props` for style-only props) + `Name/index.ts`.
- All backend URLs used by the front live in `constants.ts` (`API_ROUTES`) — never hardcode fetch URLs in components/pages; do fetches via `apiRequest` or `useFetch` so loading/error handling stays consistent.
