import { useState } from 'react';
import { apiRequest } from '../../api';
import { API_ROUTES } from '../../constants';
import type { Deploy } from '../../types';
import Badge from '../Badge';
import Button from '../Button';
import * as Styles from './styles';

type Action = 'open' | 'redeploy' | 'delete';

type Props = {
	deploy: Deploy;
	onUpdated: (deploy: Deploy) => void;
	onDeleted: (id: string) => void;
};

// Fila de un deploy en el listado, con sus acciones (abrir en VS Code,
// redesplegar, borrar). Cada fila gestiona el loading y error de su acción.
const DeployItem = ({ deploy, onUpdated, onDeleted }: Props) => {
	const [action, setAction] = useState<Action | null>(null);
	const [error, setError] = useState<string | null>(null);

	const run = async (type: Action, request: () => Promise<void>) => {
		setAction(type);
		setError(null);

		try {
			await request();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
		} finally {
			setAction(null);
		}
	};

	const openInVscode = () =>
		run('open', async () => {
			await apiRequest(API_ROUTES.openVscode(deploy.id), { method: 'POST' });
		});

	const redeploy = () =>
		run('redeploy', async () => {
			const updated = await apiRequest<Partial<Deploy>>(API_ROUTES.redeploy(deploy.id), { method: 'POST' });
			onUpdated({ ...deploy, ...updated });
		});

	const remove = () => {
		if (!window.confirm(`¿Borrar el deploy ${deploy.branchName} · ${deploy.projectName} y su rama?`)) return;

		run('delete', async () => {
			await apiRequest(API_ROUTES.deployById(deploy.id), { method: 'DELETE' });
			onDeleted(deploy.id);
		});
	};

	const busy = action !== null;

	return (
		<Styles.Item>
			<Styles.ItemInfo>
				<Styles.ItemTitle>
					{deploy.branchName} · {deploy.projectName}
				</Styles.ItemTitle>
				<Styles.ItemMeta>
					{new Date(deploy.createdAt).toLocaleString()} · desde {deploy.ref}
					{deploy.url && (
						<>
							{' · '}
							<a href={deploy.url} target="_blank" rel="noreferrer">
								{deploy.url}
							</a>
						</>
					)}
				</Styles.ItemMeta>
				{deploy.servidorSsh && (
					<Styles.ItemMeta>
						usuario {deploy.usuarioSsh} · host {deploy.servidorSsh} · puerto {deploy.puertoSsh}
					</Styles.ItemMeta>
				)}
				<Styles.ItemMeta>
					Rama {deploy.entornoName}
				</Styles.ItemMeta>
				{deploy.status === 'error' && deploy.error && <Styles.ItemMeta>❌ {deploy.error}</Styles.ItemMeta>}
				{error && <Styles.ItemError>❌ {error}</Styles.ItemError>}
			</Styles.ItemInfo>
			<Styles.ItemActions>
				{deploy.status === 'listo' && (
					<Button small onClick={openInVscode} disabled={busy}>
						{action === 'open' ? 'Abriendo...' : 'Abrir en VS Code'}
					</Button>
				)}
				{deploy.entornoName && ['listo', 'error'].includes(deploy.status) && (
					<Button small variant="warning" onClick={redeploy} disabled={busy}>
						{action === 'redeploy' ? 'Redesplegando...' : 'Redesplegar'}
					</Button>
				)}
				<Button small variant="danger" onClick={remove} disabled={busy}>
					{action === 'delete' ? 'Borrando...' : 'Borrar'}
				</Button>
				<Badge status={deploy.status} />
			</Styles.ItemActions>
		</Styles.Item>
	);
};

export default DeployItem;
