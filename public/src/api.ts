// Wrapper de fetch para la API: parsea el body como JSON y, si la respuesta
// no es ok, lanza un Error con el mensaje del backend (body.error) o con el
// código de estado.
export const apiRequest = async <T = unknown>(url: string, options?: RequestInit): Promise<T> => {
	const res = await fetch(url, options);
	const body = await res.json().catch(() => null);

	if (!res.ok) {
		throw new Error(body?.error ?? `El servidor ha respondido ${res.status}`);
	}

	return body as T;
};
