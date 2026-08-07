---
name: open-deploy-vscode
description: Abre en VS Code (Remote-SSH) el entorno de deckhand de una tarea/proyecto concretos, buscando el deploy correspondiente por nombre de tarea (rama, ej. STORE-6042) y nombre de proyecto/repo (ej. "esim api", "esim-api", "store backend"). Usar siempre que el usuario pida "ábreme el VS Code de...", "abre el entorno de...", "levántame el entorno de la tarea X", o mencione abrir/levantar un proyecto o repo concreto en un editor a partir de un nombre de tarea. No usar para crear o redesplegar entornos nuevos, solo para abrir uno que ya existe.
---

# Abrir entorno de deckhand en VS Code

Dado un nombre de tarea (rama) y un nombre de proyecto, localiza el deploy correspondiente en deckhand y abre su carpeta remota en VS Code vía Remote-SSH.

## Por qué existe este skill

Abrir un entorno a mano implica: listar todos los deploys, hacer matching flexible del nombre de proyecto que da el usuario (que casi nunca coincide literalmente con el `projectName` interno, p. ej. dice "esim api" y el campo real es `esim-api`), filtrar por tarea, comprobar el `status`, y solo entonces lanzar `open_vscode` y traducir su respuesta en un comando `code --folder-uri`. Este skill automatiza esa cadena para no repetirla cada vez.

## Flujo

1. **Identifica tarea y proyecto** a partir de lo que pide el usuario. La tarea suele ser un ticket tipo `STORE-6042` (puede venir en minúsculas o sin guion, normalízalo a mayúsculas con guion: `store6042` → `STORE-6042`). El proyecto es un nombre libre ("esim api", "backend de store", "store api pt"...).

2. **Lista los deploys** con la tool MCP `list_deploys` (servidor deckhand). No hace falta pedir permiso, es una lectura.

3. **Filtra por tarea**: compara `branchName` contra el nombre de tarea normalizado (coincidencia exacta, insensible a mayúsculas). Ten en cuenta que puede haber variantes de la misma tarea con sufijo, como `STORE-6042` y `STORE-6042-S` — trátalas como candidatos distintos, no las fusiones automáticamente.

4. **Filtra por proyecto** entre los que coincidieron por tarea, haciendo matching flexible contra `projectName`: ignora espacios vs guiones, mayúsculas/minúsculas, y permite coincidencia parcial razonable (p. ej. "esim api" → `esim-api`; "backend store es" → `store-backend-es`). Si el nombre de proyecto que da el usuario es ambiguo entre varios `projectName` distintos (p. ej. dice solo "store" y hay `store-api-es`, `store-backend-es`, `store-frontend-v2-es`...), no adivines: pregunta al usuario cuál quiere, listando las opciones encontradas.

5. **Evalúa el resultado del filtrado**:
   - **Cero coincidencias**: no inventes nada. Enseña al usuario los deploys que más se parecen (mismo proyecto con otra tarea, o misma tarea con otro proyecto) para que confirme si quiere alguno de esos, o si el entorno simplemente no existe y hay que crearlo (eso queda fuera de este skill — coméntaselo).
   - **Varias coincidencias** (p. ej. mismo proyecto y tarea pero varios deploys por reintentos con `status: "error"`, o una tarea con sufijo `-S`): prioriza el que tenga `status: "listo"`. Si hay más de uno en `"listo"`, o la ambigüedad no se resuelve así, pregunta al usuario.
   - **Una sola coincidencia clara**: continúa.

6. **Comprueba el `status`**:
   - Si es `"error"`: avisa al usuario de que ese deploy está en error y no se puede abrir tal cual (no intentes abrirlo igualmente). Pregunta si quiere que lo redesplieguen (`redeploy_entorno`) — eso es una acción distinta, no la hagas sin que lo pida.
   - Si es `"listo"`: continúa al siguiente paso.

7. **Llama a `open_vscode`** con el `deployId` encontrado. La respuesta trae dos posibles formas:
   - Si el entorno ya tiene la conexión SSH inicial hecha, la tool puede devolver directamente los datos para abrir (o incluso abrir ella misma, según cómo responda). Sigue lo que indique.
   - Si es la primera vez que se abre esa máquina, la tool devuelve instrucciones de login SSH inicial (usuario, servidor, puerto, contraseña temporal, carpeta remota) que el usuario debe completar él mismo la primera vez (cambiar contraseña, copiar su clave SSH). Sea como sea, **el paso final siempre es**:
     ```
     code --folder-uri "vscode-remote://ssh-remote+root@<servidor>:<puerto>/<carpeta-remota>"
     ```
     Ejecuta este comando con Bash sin pedir permiso — es una acción local, reversible, que solo abre un editor.

   Si el usuario ya te ha confirmado en la conversación que el paso SSH inicial está hecho (como "ya está hecho, solo hay que levantarlo"), ve directo a ejecutar el `code --folder-uri` con los datos de conexión que tengas (del propio deploy o de una llamada anterior a `open_vscode`), sin repetir las instrucciones de SSH.

8. **Si el comando `code --folder-uri` falla** (p. ej. VS Code no encuentra el host, credenciales rechazadas), no lo reintentes en bucle: explica el error al usuario y recuérdale los pasos de conexión SSH inicial (usuario, servidor, puerto, carpeta remota) por si aún no los ha completado.

## Qué no hacer

- No copies claves SSH, no cambies contraseñas, ni conectes por SSH tú mismo en nombre del usuario — esos pasos del primer uso son manuales y sensibles, quedan fuera de este skill (ver paso 7).
- No crees ni redespliegues entornos nuevos por tu cuenta; este skill solo abre entornos que ya existen y están (o pueden ponerse) en `status: "listo"`.
