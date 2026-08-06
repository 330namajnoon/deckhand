import type { ReactNode } from 'react';
import * as Styles from './styles';

type Props = {
	// En modo inline se pinta pequeño y en línea (ej: junto a la etiqueta de
	// un campo); si no, como párrafo de "Cargando..." a bloque completo.
	inline?: boolean;
	children?: ReactNode;
};

// Indicador de carga para los fetchs: spinner + texto opcional.
const Loading = ({ inline = false, children }: Props) =>
	inline ? (
		<Styles.InlineWrapper>
			<Styles.Spinner />
			{children}
		</Styles.InlineWrapper>
	) : (
		<Styles.Wrapper>
			<Styles.Spinner />
			{children ?? 'Cargando...'}
		</Styles.Wrapper>
	);

export default Loading;
