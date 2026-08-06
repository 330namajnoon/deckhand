import { useMemo, useState } from 'react';
import { API_ROUTES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { DeployItem, ErrorBox, Loading, Page } from '../../components';
import type { Deploy } from '../../types';
import * as Styles from './styles';

const Deploys = () => {
	const [search, setSearch] = useState('');
	const { data: deploys, setData: setDeploys, loading, error } = useFetch<Deploy[]>(API_ROUTES.deploys);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return deploys ?? [];

		return (deploys ?? []).filter((deploy) =>
			[deploy.branchName, deploy.projectName, deploy.ref, deploy.status, deploy.entornoName, deploy.url]
				.filter(Boolean)
				.some((field) => field!.toLowerCase().includes(term))
		);
	}, [deploys, search]);

	return (
		<Page title="Deploys" maxWidth={"100%"}>
			<Styles.SearchInput
				type="search"
				placeholder="Buscar por tarea, repositorio, estado..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			{error && <ErrorBox>{error}</ErrorBox>}

			{loading && <Loading>Cargando deploys...</Loading>}

			{!loading && !error && filtered.length === 0 && (
				<Styles.Empty>
					{(deploys ?? []).length === 0 ? 'Todavía no hay ningún deploy.' : 'Ningún deploy coincide con la búsqueda.'}
				</Styles.Empty>
			)}

			<Styles.List>
				{filtered.map((deploy) => (
					<DeployItem
						key={deploy.id}
						deploy={deploy}
						onUpdated={(updated) => setDeploys((prev) => (prev ?? []).map((d) => (d.id === updated.id ? updated : d)))}
						onDeleted={(id) => setDeploys((prev) => (prev ?? []).filter((d) => d.id !== id))}
					/>
				))}
			</Styles.List>
		</Page>
	);
};

export default Deploys;
