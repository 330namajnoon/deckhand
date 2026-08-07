// Repos por rol, según la convención de nombres store-<rol>-<pais> (o
// store-frontend-v2-<pais> para el frontend). Fuente única de esta
// clasificación: createEntorno.js decide con ella qué comportamiento aplicar
// (sync de entornoUrl, duplicar carpeta de test, habilitar messenger) y
// getRepoCatalog.js la reexpone para que un caller (agente MCP incluido) no
// tenga que adivinarla leyendo deploys ajenos.

// Proyectos cuyo envs/.env.entorno se sincroniza (API_MONO_URL y
// STORE_API_URL) cuando se despliega apuntando a otro entorno.
const SYNC_ENV_PROJECTS = ["store-backend-pt", "store-backend-es"];

// Frontends que en los entornos de tipo test cargan su configuración desde
// envs/<rama>: la rama se crea duplicando envs/template-branches-test con el
// nombre de la rama y, si hay entorno con el que sincronizar, apuntando el
// window.env_target de environment.js a su url.
const FRONTEND_TEST_PROJECTS = ["store-frontend-v2-es", "store-frontend-v2-pt"];

// Proyectos en los que se puede habilitar el messenger (supervisor +
// transports del bloque when@entorno de messenger.yaml).
const MESSENGER_PROJECTS = ["store-api-es", "store-api-pt"];

module.exports = { SYNC_ENV_PROJECTS, FRONTEND_TEST_PROJECTS, MESSENGER_PROJECTS };
