import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../../api';
import { API_ROUTES, MAX_SUGGESTIONS, POLL_INTERVAL } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { requestNotificationPermission, sendNotification } from '../../notifications';
import { Button, CheckboxField, CodeEditor, DeployResult, DeploySteps, ErrorBox, Field, Form, Input, Page, Select } from '../../components';
import type { Deploy as DeployData, EditAction, EntornoType, Repository } from '../../types';

const Deploy = () => {
	const [branchName, setBranchName] = useState('');
	const [projectName, setProjectName] = useState('');
	const [ref, setRef] = useState('dev');
	const [type, setType] = useState<EntornoType>('entorno');
	const [entornoSync, setEntornoSync] = useState('');
	const [messenger, setMessenger] = useState(false);
	const [editCode, setEditCode] = useState(false);
	// Los cambios de código guardan a qué repo/rama pertenecen: si cambia
	// cualquiera de los dos, dejan de valer (eran de otro árbol) y se descartan.
	const [editState, setEditState] = useState<{ key: string; actions: EditAction[] }>({ key: '', actions: [] });
	const [deploy, setDeploy] = useState<DeployData | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const inProgress = deploy !== null && deploy.status !== 'listo' && deploy.status !== 'error';
	const disabled = inProgress || submitting;

	// Deploys finalizados entre los que se puede elegir el entorno con el que
	// sincronizar. Se cargan una vez al entrar en la página; si fallan, el
	// campo simplemente queda sin sugerencias.
	const { data: allDeploys, loader: deploysLoader } = useFetch<DeployData[]>(API_ROUTES.deploys);
	const finishedDeploys = (allDeploys ?? []).filter((d) => d.status === 'listo' && d.url && d.entornoName);

	// Repositorios de GitLab entre los que elegir el proyecto a desplegar.
	const { data: repositoriesData, loader: repositoriesLoader } = useFetch<Repository[]>(API_ROUTES.repositories);
	const repositories = repositoriesData ?? [];

	// El nombre de un repo no es único (puede haber varios con el mismo nombre
	// en namespaces distintos), así que lo escrito se resuelve contra la ruta
	// completa (pathWithNamespace), que sí es única, para sacar el id real.
	const selectedRepo = repositories.find((r) => r.pathWithNamespace === projectName);
	const selectedRepoId = selectedRepo?.id;
	const { data: branchesData, loader: branchesLoader } = useFetch<string[]>(
		selectedRepoId !== undefined ? API_ROUTES.repositoryBranches(selectedRepoId) : null
	);
	const branches = branchesData ?? [];

	// Solo se pintan las primeras sugerencias que casan con lo escrito.
	const repositoryOptions = repositories
		.filter(
			(r) =>
				r.name.toLowerCase().includes(projectName.toLowerCase()) ||
				r.pathWithNamespace.toLowerCase().includes(projectName.toLowerCase())
		)
		.slice(0, MAX_SUGGESTIONS);

	const branchOptions = branches.filter((b) => b.toLowerCase().includes(ref.toLowerCase())).slice(0, MAX_SUGGESTIONS);

	// Clave del árbol que se está editando; los cambios guardados solo cuentan
	// si pertenecen a esta combinación de repo y rama.
	const editorKey = `${selectedRepoId}-${ref}`;
	const editActions = editState.key === editorKey ? editState.actions : [];
	const setEditActions = (actions: EditAction[]) => setEditState({ key: editorKey, actions });

// Mientras el deploy está en curso se consulta su estado periódicamente.
	useEffect(() => {
		if (!deploy || !inProgress) return;

		const interval = setInterval(async () => {
			try {
				const updated = await apiRequest<DeployData>(API_ROUTES.deployById(deploy.id));
				setDeploy(updated);

				// El efecto solo corre mientras el deploy está en curso, así que
				// ver "listo" aquí significa que acaba de terminar: se notifica
				// una sola vez (al actualizar el estado, el polling se para).
				if (updated.status === 'listo') {
					const entorno = updated.entornoName ?? updated.branchName;
					sendNotification('Entorno desplegado', `${entorno} ya está listo${updated.url ? `: ${updated.url}` : ''}`);
				}
			} catch {
				// el backend puede estar ocupado; se reintenta en el siguiente tick
			}
		}, POLL_INTERVAL);

		return () => clearInterval(interval);
	}, [deploy, inProgress]);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitError(null);

		if (selectedRepoId === undefined) {
			setSubmitError('Selecciona un repositorio de la lista de sugerencias');
			return;
		}

		setDeploy(null);
		setSubmitting(true);

		// El permiso de notificaciones hay que pedirlo desde un gesto del
		// usuario; el submit del formulario es el momento natural.
		requestNotificationPermission();

		// El campo de sincronización acepta el nombre de un entorno de la lista
		// o una url escrita a mano; en ambos casos al backend se le manda la url.
		const selected = finishedDeploys.find((d) => d.entornoName === entornoSync || d.url === entornoSync);
		const entornoUrl = selected?.url ?? (entornoSync.trim() || undefined);

		try {
			const created = await apiRequest<DeployData>(API_ROUTES.deploy, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					branchName,
					projectId: selectedRepoId,
					projectName: selectedRepo?.name ?? projectName,
					ref,
					type,
					entornoUrl,
					messenger,
					editActions,
				}),
			});

			setDeploy(created);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Page title="Desplegar entorno">
			<Form onSubmit={handleSubmit}>
				<Field>
					Tarea
					<Input
						value={branchName}
						onChange={(e) => setBranchName(e.target.value)}
						placeholder="STORE-2080"
						required
						disabled={disabled}
					/>
				</Field>

				<Field>
					<span>Repositorio {repositoriesLoader}</span>
					<Input
						list="repositorios"
						value={projectName}
						onChange={(e) => setProjectName(e.target.value)}
						placeholder="Escribe para buscar un repositorio..."
						required
						disabled={disabled}
					/>
					<datalist id="repositorios">
						{repositoryOptions.map((r) => (
							<option key={r.id} value={r.pathWithNamespace}>
								{r.name}
							</option>
						))}
					</datalist>
				</Field>

				<Field>
					Tipo de entorno
					<Select value={type} onChange={(e) => setType(e.target.value as EntornoType)} disabled={disabled}>
						<option value="entorno">Entorno (con instalación)</option>
						<option value="test">Test (solo desplegar)</option>
					</Select>
				</Field>

				<CheckboxField>
					<input
						type="checkbox"
						checked={messenger}
						onChange={(e) => setMessenger(e.target.checked)}
						disabled={disabled}
					/>
					Habilitar messenger (solo store-api-es / store-api-pt)
				</CheckboxField>

				<Field>
					<span>Sincronizar con entorno (opcional) {deploysLoader}</span>
					<Input
						list="entornos-finalizados"
						value={entornoSync}
						onChange={(e) => setEntornoSync(e.target.value)}
						placeholder="Escribe para buscar un deploy finalizado..."
						disabled={disabled}
					/>
					<datalist id="entornos-finalizados">
						{finishedDeploys.map((d) => (
							<option key={d.id} value={d.entornoName}>
								{`${d.projectName} · ${d.branchName} · ${d.url}`}
							</option>
						))}
					</datalist>
				</Field>

				<Field>
					<span>Rama de origen {branchesLoader}</span>
					<Input
						list="ramas"
						value={ref}
						onChange={(e) => setRef(e.target.value)}
						placeholder="dev"
						required
						disabled={disabled}
					/>
					<datalist id="ramas">
						{branchOptions.map((b) => (
							<option key={b} value={b} />
						))}
					</datalist>
				</Field>

				<CheckboxField>
					<input
						type="checkbox"
						checked={editCode}
						onChange={(e) => setEditCode(e.target.checked)}
						disabled={disabled || selectedRepoId === undefined}
					/>
					Editar código antes del deploy
					{editActions.length > 0 && ` (${editActions.length} fichero${editActions.length === 1 ? '' : 's'} modificado${editActions.length === 1 ? '' : 's'})`}
				</CheckboxField>

				{editCode && selectedRepoId !== undefined && (
					<CodeEditor
						key={editorKey}
						repoId={selectedRepoId}
						repoRef={ref}
						actions={editActions}
						onActionsChange={setEditActions}
						disabled={disabled}
					/>
				)}

				<Button type="submit" disabled={disabled}>
					{disabled ? 'Desplegando...' : 'Desplegar'}
				</Button>
			</Form>

			{submitError && <ErrorBox>{submitError}</ErrorBox>}

			{deploy && (
				<>
					<DeploySteps deploy={deploy} />

					{deploy.status === 'error' && (
						<ErrorBox>
							<strong>El despliegue ha fallado:</strong> {deploy.error ?? 'error desconocido'}
						</ErrorBox>
					)}

					{deploy.status === 'listo' && <DeployResult deploy={deploy} />}
				</>
			)}
		</Page>
	);
};

export default Deploy;
