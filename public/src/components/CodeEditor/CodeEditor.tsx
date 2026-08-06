import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { php } from '@codemirror/lang-php';
import { yaml } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { apiRequest } from '../../api';
import { API_ROUTES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import Button from '../Button';
import ErrorBox from '../ErrorBox';
import { Spinner } from '../Loading';
import type { EditAction, RepositoryFile, TreeEntry } from '../../types';
import * as Styles from './styles';

type CodeEditorProps = {
	repoId: number;
	repoRef: string;
	actions: EditAction[];
	onActionsChange: (actions: EditAction[]) => void;
	disabled?: boolean;
};

// Fichero abierto en el editor: contenido original (el de GitLab) y el que
// se está editando, para saber si hay cambios sin guardar.
type OpenFile = {
	path: string;
	original: string;
	content: string;
};

// Extensión de CodeMirror según la extensión del fichero; texto plano si no
// hay lenguaje conocido.
const languageFor = (path: string) => {
	const ext = path.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'php':
			return [php()];
		case 'yaml':
		case 'yml':
			return [yaml()];
		case 'json':
			return [json()];
		case 'js':
		case 'jsx':
		case 'ts':
		case 'tsx':
			return [javascript({ typescript: ext === 'ts' || ext === 'tsx', jsx: ext === 'jsx' || ext === 'tsx' })];
		default:
			return [];
	}
};

// Entrada del árbol con su ruta completa (name/path vienen relativos a la
// carpeta listada cuando se pide recursive, path ya es la ruta completa).
const fetchBlobsUnder = async (repoId: number, repoRef: string, entryPath: string) => {
	const entries = await apiRequest<TreeEntry[]>(API_ROUTES.repositoryTree(repoId, repoRef, entryPath, true));
	return entries.filter((e) => e.type === 'blob');
};

// Editor de código sobre un repo/rama de GitLab: navega el árbol de ficheros,
// abre ficheros en CodeMirror y acumula los cambios guardados como acciones
// de commit (EditAction) que el deploy aplicará en el primer commit de la rama.
// También permite renombrar y duplicar ficheros/carpetas enteras: se resuelven
// como acciones "move" (renombrar) o "create" (duplicar) sobre cada fichero.
const CodeEditor = ({ repoId, repoRef, actions, onActionsChange, disabled = false }: CodeEditorProps) => {
	const [path, setPath] = useState('');
	const [openFile, setOpenFile] = useState<OpenFile | null>(null);
	const [loadingFile, setLoadingFile] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);
	// Ruta del fichero/carpeta sobre el que hay una operación de renombrar o
	// duplicar en curso (deshabilita el árbol mientras se resuelve).
	const [busyEntryPath, setBusyEntryPath] = useState<string | null>(null);
	const [entryError, setEntryError] = useState<string | null>(null);

	const { data: entries, error: treeError, loader: treeLoader } = useFetch<TreeEntry[]>(
		API_ROUTES.repositoryTree(repoId, repoRef, path)
	);

	// Migas de pan de la ruta actual: raíz + una entrada por carpeta.
	const crumbs = path === '' ? [] : path.split('/');

	const extensions = useMemo(() => (openFile ? languageFor(openFile.path) : []), [openFile]);

	// Al renombrar, el fichero original se guarda como acción "move" cuyo
	// filePath es la ruta NUEVA: para marcar el original en el árbol (que
	// sigue viéndose con su nombre viejo hasta el commit) hay que mirar
	// también el previousPath.
	const actionFor = (filePath: string) =>
		actions.find((a) => a.filePath === filePath || (a.action === 'move' && a.previousPath === filePath));
	const savedAction = openFile ? actionFor(openFile.path) : undefined;
	const savedActionContent = savedAction && 'content' in savedAction ? savedAction.content : undefined;
	const dirty = openFile !== null && openFile.content !== (savedActionContent ?? openFile.original);

	// Contenido actual de un fichero del repo: el de un cambio pendiente si lo
	// hay (incluida la copia de origen de un "move" sin contenido propio), o
	// si no, el original en GitLab.
	const resolveContent = async (filePath: string, currentActions: EditAction[]): Promise<string> => {
		const pending = currentActions.find((a) => a.filePath === filePath);
		if (pending?.action === 'delete') {
			throw new Error(`"${filePath}" está marcado para borrar, no se puede duplicar`);
		}
		if (pending && 'content' in pending && typeof pending.content === 'string') {
			return pending.content;
		}
		const sourcePath = pending?.action === 'move' ? pending.previousPath : filePath;
		const file = await apiRequest<RepositoryFile>(API_ROUTES.repositoryFile(repoId, repoRef, sourcePath));
		return file.content;
	};

	// Aplica el renombrado de un fichero sobre el array de acciones: si el
	// fichero era una creación local (todavía no existe en GitLab) simplemente
	// se le cambia la ruta; si no, se sustituye por una acción "move".
	const applyRename = (currentActions: EditAction[], oldPath: string, newPath: string): EditAction[] => {
		const existingIndex = currentActions.findIndex((a) => a.filePath === oldPath);
		const existing = existingIndex !== -1 ? currentActions[existingIndex] : undefined;

		if (existing?.action === 'delete') return currentActions;

		if (existing?.action === 'create') {
			const next = [...currentActions];
			next[existingIndex] = { ...existing, filePath: newPath };
			return next;
		}

		const rest = existing ? currentActions.filter((_, i) => i !== existingIndex) : currentActions;
		const content = existing && 'content' in existing ? existing.content : undefined;
		return [...rest, { action: 'move', filePath: newPath, previousPath: oldPath, ...(content !== undefined ? { content } : {}) }];
	};

	const newPathFor = (entryPath: string, newName: string) => {
		const parentPath = entryPath.includes('/') ? entryPath.slice(0, entryPath.lastIndexOf('/')) : '';
		return parentPath ? `${parentPath}/${newName}` : newName;
	};

	const renameEntry = async (entry: TreeEntry) => {
		const newName = window.prompt(`Nuevo nombre para "${entry.name}"`, entry.name)?.trim();
		if (!newName || newName === entry.name) return;

		const newPath = newPathFor(entry.path, newName);

		setEntryError(null);
		setBusyEntryPath(entry.path);
		try {
			let nextActions = actions;

			if (entry.type === 'blob') {
				nextActions = applyRename(nextActions, entry.path, newPath);
			} else {
				const children = await fetchBlobsUnder(repoId, repoRef, entry.path);
				for (const child of children) {
					const rel = child.path.slice(entry.path.length);
					nextActions = applyRename(nextActions, child.path, `${newPath}${rel}`);
				}
			}

			onActionsChange(nextActions);

			if (openFile && (openFile.path === entry.path || openFile.path.startsWith(`${entry.path}/`))) {
				setOpenFile({ ...openFile, path: `${newPath}${openFile.path.slice(entry.path.length)}` });
			}
		} catch (error) {
			setEntryError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setBusyEntryPath(null);
		}
	};

	const duplicateEntry = async (entry: TreeEntry) => {
		const defaultName = entry.type === 'tree' ? `${entry.name}-copia` : entry.name;
		const newName = window.prompt(`Nombre para la copia de "${entry.name}"`, defaultName)?.trim();
		if (!newName) return;

		const newPath = newPathFor(entry.path, newName);

		setEntryError(null);
		setBusyEntryPath(entry.path);
		try {
			let nextActions = actions;

			const copyFile = async (sourcePath: string, targetPath: string) => {
				const content = await resolveContent(sourcePath, nextActions);
				nextActions = [...nextActions.filter((a) => a.filePath !== targetPath), { action: 'create', filePath: targetPath, content }];
			};

			if (entry.type === 'blob') {
				await copyFile(entry.path, newPath);
			} else {
				const children = await fetchBlobsUnder(repoId, repoRef, entry.path);
				if (children.length === 0) throw new Error('La carpeta está vacía');
				for (const child of children) {
					const rel = child.path.slice(entry.path.length);
					await copyFile(child.path, `${newPath}${rel}`);
				}
			}

			onActionsChange(nextActions);
		} catch (error) {
			setEntryError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setBusyEntryPath(null);
		}
	};

	const openBlob = async (filePath: string) => {
		setFileError(null);
		setLoadingFile(true);
		try {
			const file = await apiRequest<RepositoryFile>(API_ROUTES.repositoryFile(repoId, repoRef, filePath));
			// Si el fichero ya tiene un cambio guardado, se sigue editando sobre él.
			const saved = actionFor(filePath);
			const savedContent = saved && 'content' in saved && typeof saved.content === 'string' ? saved.content : undefined;
			setOpenFile({ path: filePath, original: file.content, content: savedContent ?? file.content });
		} catch (error) {
			setFileError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setLoadingFile(false);
		}
	};

	// Guarda el cambio del fichero abierto como acción de commit; si el
	// contenido vuelve a ser el original, el cambio se descarta.
	const saveChange = () => {
		if (!openFile) return;
		const rest = actions.filter((a) => a.filePath !== openFile.path);
		onActionsChange(
			openFile.content === openFile.original
				? rest
				: [...rest, { action: 'update', filePath: openFile.path, content: openFile.content }]
		);
	};

	const discardChange = (filePath: string) => {
		onActionsChange(actions.filter((a) => a.filePath !== filePath));
		if (openFile?.path === filePath) {
			setOpenFile({ ...openFile, content: openFile.original });
		}
	};

	return (
		<Styles.Container>
			<Styles.Breadcrumb>
				<button type="button" onClick={() => setPath('')} disabled={path === ''}>
					{'/'}
				</button>
				{crumbs.map((crumb, i) => {
					const crumbPath = crumbs.slice(0, i + 1).join('/');
					return (
						<span key={crumbPath}>
							<button type="button" onClick={() => setPath(crumbPath)} disabled={crumbPath === path}>
								{crumb}
							</button>
							{i < crumbs.length - 1 && ' / '}
						</span>
					);
				})}
				{treeLoader}
			</Styles.Breadcrumb>

			{treeError && <ErrorBox>{treeError}</ErrorBox>}

			<Styles.Tree>
				{(entries ?? []).map((entry) => {
					const entryBusy = busyEntryPath !== null;
					return (
						<Styles.TreeItem key={entry.path}>
							<Styles.EntryButton
								type="button"
								disabled={loadingFile || entryBusy}
								onClick={() => (entry.type === 'tree' ? setPath(entry.path) : openBlob(entry.path))}
							>
								{entry.type === 'tree' ? '📁' : '📄'} {entry.name}
								{actionFor(entry.path) && <Styles.ModifiedTag>modificado</Styles.ModifiedTag>}
							</Styles.EntryButton>
							<Styles.EntryActions>
								<Button
									type="button"
									small
									title={`Renombrar ${entry.name}`}
									onClick={() => renameEntry(entry)}
									disabled={disabled || loadingFile || entryBusy}
								>
									{busyEntryPath === entry.path ? '…' : '✏️'}
								</Button>
								<Button
									type="button"
									small
									title={`Duplicar ${entry.name}`}
									onClick={() => duplicateEntry(entry)}
									disabled={disabled || loadingFile || entryBusy}
								>
									⧉
								</Button>
							</Styles.EntryActions>
						</Styles.TreeItem>
					);
				})}
			</Styles.Tree>

			{entryError && <ErrorBox>{entryError}</ErrorBox>}

			{fileError && <ErrorBox>{fileError}</ErrorBox>}

			{loadingFile && <Spinner />}

			{openFile && !loadingFile && (
				<>
					<Styles.EditorHeader>
						<code>{openFile.path}</code>
						<Styles.EditorActions>
							<Button type="button" small variant="warning" onClick={saveChange} disabled={disabled || !dirty}>
								{dirty ? 'Guardar cambio' : 'Sin cambios'}
							</Button>
							<Button type="button" small onClick={() => setOpenFile(null)} disabled={disabled}>
								Cerrar
							</Button>
						</Styles.EditorActions>
					</Styles.EditorHeader>
					<Styles.EditorBox>
						<CodeMirror
							value={openFile.content}
							extensions={extensions}
							editable={!disabled}
							onChange={(value) => setOpenFile({ ...openFile, content: value })}
						/>
					</Styles.EditorBox>
				</>
			)}

			{actions.length > 0 && (
				<Styles.Changes>
					<strong>Ficheros modificados ({actions.length}):</strong>
					{actions.map((a) => (
						<Styles.Change key={a.filePath}>
							<code>
								{a.action === 'move' ? `${a.previousPath} → ${a.filePath}` : a.filePath}
								{a.action === 'create' && ' (nuevo)'}
							</code>
							<Button type="button" small variant="danger" onClick={() => discardChange(a.filePath)} disabled={disabled}>
								Descartar
							</Button>
						</Styles.Change>
					))}
				</Styles.Changes>
			)}
		</Styles.Container>
	);
};

export default CodeEditor;
