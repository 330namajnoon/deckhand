import type { ReactNode } from 'react';
import * as Styles from './styles';

type Props = {
	title: string;
	maxWidth?: string;
	children: ReactNode;
};

const Page = ({ title, maxWidth = "100%", children }: Props) => (
	<Styles.Container $maxWidth={maxWidth}>
		<Styles.Title>{title}</Styles.Title>
		{children}
	</Styles.Container>
);

export default Page;
