// Errores de undici que indican un corte de red puntual con GitLab.
const TRANSIENT_CODES = ["UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"];

const isTransientError = (error) =>
  error instanceof TypeError &&
  error.message === "fetch failed" &&
  (TRANSIENT_CODES.includes(error.cause?.code) || TRANSIENT_CODES.includes(error.cause?.name));

async function retryTransient(fn, { attempts = 4, delayMs = 3000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isTransientError(error)) throw error;
      if (attempt >= attempts) {
        // "fetch failed" suele ser falta de conectividad con GITLAB_HOST (VPN, DNS), no algo transitorio.
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
