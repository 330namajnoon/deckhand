import styled from "styled-components";

export const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #fafafa;
	color: #111827;
	color-scheme: light;
	text-align: left;

	code {
		padding: 0;
		background: none;
		font-size: 0.85rem;
	}
`;

export const Breadcrumb = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.9rem;

	button {
		border: none;
		background: none;
		padding: 0;
		font-size: inherit;
		color: #2563eb;
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}

		&:disabled {
			color: #6b7280;
			cursor: default;
			text-decoration: none;
		}
	}
`;

export const Tree = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	max-height: 14rem;
	overflow-y: auto;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	background: white;
`;

export const TreeItem = styled.li`
	display: flex;
	align-items: center;
`;

export const EntryButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
	padding: 0.35rem 0.75rem;
	border: none;
	background: none;
	font-size: 0.9rem;
	text-align: left;
	color: inherit;
	cursor: pointer;

	&:hover {
		background: #f3f4f6;
	}

	&:disabled {
		color: #9ca3af;
		cursor: default;
	}
`;

export const EntryActions = styled.div`
	display: flex;
	gap: 0.25rem;
	padding-right: 0.5rem;
	flex-shrink: 0;
`;

export const ModifiedTag = styled.span`
	margin-left: auto;
	font-size: 0.75rem;
	font-weight: 600;
	color: #b45309;
`;

export const EditorHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-top: 0.5rem;

	code {
		font-size: 0.85rem;
	}
`;

export const EditorActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-left: auto;
`;

export const EditorBox = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	overflow: hidden;
	/* Neutraliza los estilos globales de index.css (#root centra el texto y
	   code lleva padding/fondo propios), que rompen el render de CodeMirror. */
	text-align: left;

	.cm-editor {
		font-size: 0.85rem;
		max-height: 32rem;
		background: white;
	}

	.cm-scroller {
		overflow: auto;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		line-height: 1.5;
	}
`;

export const Changes = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin-top: 0.5rem;
	font-size: 0.9rem;
`;

export const Change = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;

	code {
		font-size: 0.85rem;
	}
`;
