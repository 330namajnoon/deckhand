// Códigos/nombres de error de undici (fetch) que indican un corte de red
// puntual hablando con GitLab, no un problema real de la petición.
const TRANSIENT_CODES = ["UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"];

const isTransientError = (error) =>
  error instanceof TypeError &&
  error.message === "fetch failed" &&
  (TRANSIENT_CODES.includes(error.cause?.code) || TRANSIENT_CODES.includes(error.cause?.name));

/**
 * Ejecuta `fn` reintentando si falla por un corte de red puntual hablando con
 * GitLab (timeout de conexión, conexión rechazada, etc.). Cualquier otro
 * error (404, permisos, validación...) se relanza al momento, sin reintentar.
 *
 * @param {() => Promise<T>} fn - Función a ejecutar.
 * @param {{ attempts?: number, delayMs?: number }} [options] - `attempts` es
 *     el número total de intentos (por defecto 4); `delayMs` la espera entre
 *     intentos (por defecto 3000ms).
 * @returns {Promise<T>}
 * @template T
 */
async function retryTransient(fn, { attempts = 4, delayMs = 3000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isTransientError(error)) throw error;
      if (attempt >= attempts) {
        // "fetch failed" a secas no dice nada de la causa real: casi siempre es
        // que el servidor de deckhand no tiene conectividad (VPN caída, DNS,
        // etc.) con GITLAB_HOST, no un problema transitorio de verdad.
        throw new Error(
          `No se ha podido contactar con GitLab (${process.env.GITLAB_HOST ?? "GITLAB_HOST"}) tras ${attempts} intentos — revisa la VPN/conectividad del servidor de deckhand. Causa: ${error.cause?.code ?? error.cause?.name}`,
          { cause: error }
        );
      }
      console.warn(`⚠️  Corte de red hablando con GitLab, reintento ${attempt}/${attempts - 1}: ${error.cause?.code ?? error.cause?.name}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = retryTransient;
