import { useCallback, useEffect, useState, type SetStateAction } from 'react';
import { apiRequest } from '../api';
import Loading from '../components/Loading';

// El resultado guarda la url a la que pertenece: si la url del hook cambia,
// el resultado anterior deja de valer y se vuelve al estado de carga sin
// necesidad de resetear nada dentro del efecto.
type FetchState<T> = { url: string; data?: T; error?: string };

// Hook para peticiones GET: gestiona data, loading y error. Si url es null no
// se lanza la petición (útil para fetchs condicionales, como las ramas de un
// repo aún sin seleccionar). Devuelve también:
// - loader: spinner inline listo para pintar mientras loading (null si no).
// - setData: para actualizar la lista en local tras una mutación (borrar,
//   redesplegar...).
export const useFetch = <T,>(url: string | null) => {
	const [state, setState] = useState<FetchState<T> | null>(null);

	useEffect(() => {
		if (url === null) return;

		let cancelled = false;

		(async () => {
			try {
				const data = await apiRequest<T>(url);
				if (!cancelled) setState({ url, data });
			} catch (err) {
				if (!cancelled) setState({ url, error: err instanceof Error ? err.message : 'Error desconocido' });
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [url]);

	const setData = useCallback(
		(action: SetStateAction<T | null>) => {
			setState((prev) => {
				if (url === null) return prev;
				const prevData = prev !== null && prev.url === url ? prev.data ?? null : null;
				const data = typeof action === 'function' ? (action as (p: T | null) => T | null)(prevData) : action;
				return { url, data: data ?? undefined };
			});
		},
		[url]
	);

	const current = state !== null && state.url === url ? state : null;
	const loading = url !== null && current === null;

	return {
		data: current?.data ?? null,
		error: current?.error ?? null,
		loading,
		loader: loading ? <Loading inline /> : null,
		setData,
	};
};
