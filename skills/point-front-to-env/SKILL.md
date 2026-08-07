---
name: point-front-to-env
description: Apunta un frontend local (p. ej. "store v2 de España", "store-frontend-v2-es") al backend de un entorno de deckhand identificado por su tarea/rama (p. ej. STORE-2025), reescribiendo el target del entorno en el repo. Usar cuando el usuario diga "apunta X a Y", "apúntame el front de ... al entorno de ...", "cambia el backend del store v2 a la tarea ...", "que el front apunte a STORE-XXXX". No usar para abrir entornos en VS Code (eso es open-deploy-vscode) ni para crear o redesplegar entornos.
---

# Apuntar un frontend al backend de un entorno

Dado un **nombre de proyecto** (el frontend local que hay que reconfigurar) y un **nombre de entorno** (la tarea/rama del deploy de deckhand al que debe apuntar), reescribe el target de backend en el repo del frontend.

## Por qué existe este skill

Hacerlo a mano implica: traducir el nombre coloquial del proyecto al directorio real, listar todos los deploys de deckhand, elegir el backend correcto de esa tarea (hay varios proyectos por tarea: `store-backend-*`, `store-api-*`, `esim-api`...), descartar los que están en `error`, averiguar qué mecanismo usa ese repo para fijar el target, y aplicarlo. Este skill encadena todo eso.

## Flujo

1. **Identifica proyecto y entorno** a partir de lo que pide el usuario.
   - **Proyecto**: nombre libre ("store v2 de España", "el front v2 es", "store frontend v2 pt"). Resuélvelo a un directorio real dentro de `/Users/sinamajnoon/Documents/digiProjects` (lista el directorio; matching flexible ignorando espacios vs guiones y mayúsculas). Si es ambiguo entre varios repos, pregunta en vez de adivinar.
   - **Entorno**: la tarea/rama, tipo `STORE-2025`. Normalízalo a mayúsculas con guion (`store2025` → `STORE-2025`).

2. **Lista los deploys** con la tool MCP `list_deploys` (servidor deckhand). Es una lectura, no pidas permiso.

3. **Elige el deploy de backend** entre los que tengan ese `branchName`:
   - Por defecto, el **backend del mismo país que el frontend**: front `*-es` → `store-backend-es`; front `*-pt` → `store-backend-pt`.
   - Si el usuario pide explícitamente otro (`api`, `esim-api`...), usa ese.
   - Descarta los de `status: "error"` y quédate con `status: "listo"`. Si hay varios en `"listo"`, o ninguno encaja, muéstrale las opciones y pregunta.
   - Si la tarea no tiene ningún deploy de backend, dilo claramente — crear entornos queda fuera de este skill.

4. **Toma la URL del deploy** y **quítale la barra final**: los ficheros de entorno guardan el target sin `/` al final (`https://entornostore2025storebackendes.sw.digimobil.es:12443`).

5. **Aplica el cambio** en el repo del frontend, según lo que soporte:

   - **Si el `package.json` raíz tiene el script `publish:env`** (caso de `store-frontend-v2-es`), úsalo — es el camino oficial del repo:
     ```
     yarn publish:env --target <url-sin-barra-final>
     ```
     Antes, lanza el mismo comando con `--dry-run` para ver qué workspaces va a tocar, y enseña ese resultado. Ojo: `publish:env` reescribe `window.env_target` en el `public/environment.js` de **todos** los workspaces de app, no solo los "v2" — no se puede filtrar. Es lo correcto igualmente, porque el dev server de `checkout` hace proxy hacia las apps v1 y deben hablar con el mismo backend. Menciónaselo al usuario en el resumen.

   - **Si no existe ese script**, busca el mecanismo real antes de tocar nada: `public/environment.js` con `window.env_target`, ficheros `.env*` con variables tipo `VITE_*_URL` / `*_BACKEND_*`, o `envs/<entorno>/environment.js`. Lee el valor actual, edítalo respetando el formato existente, y di exactamente qué ficheros cambiaste.

6. **Antes de escribir, muestra el target actual** (`grep` de `env_target` o de la variable equivalente) para que quede constancia de a qué apuntaba antes. Después del cambio no hace falta releer los ficheros.

7. **Resume al usuario**: proyecto resuelto, deploy elegido (rama, `projectName`, `status`), URL nueva, target anterior, ficheros/workspaces afectados, y el recordatorio de recargar el navegador o reiniciar el dev server para que se recoja el nuevo `environment.js`.

## Qué no hacer

- No arranques ni reinicies el dev server por tu cuenta; solo avisa de que hace falta.
- No hagas commit ni push del cambio — es configuración local de trabajo. Solo si el usuario lo pide.
- No crees, redespliegues ni borres entornos de deckhand.
- No apuntes a un deploy con `status: "error"` ni a una URL `null`.
