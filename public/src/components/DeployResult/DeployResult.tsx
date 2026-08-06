import type { Deploy } from '../../types';
import * as Styles from './styles';

// Datos del entorno una vez el deploy está listo (url, conexión SSH...).
const DeployResult = ({ deploy }: { deploy: Deploy }) => (
	<Styles.ResultBox>
		<p>
			<strong>Entorno:</strong> {deploy.entornoName}
		</p>
		{deploy.url && (
			<p>
				<strong>URL:</strong>{' '}
				<a href={deploy.url} target="_blank" rel="noreferrer">
					{deploy.url}
				</a>
			</p>
		)}
		{deploy.cadenaConexionSsh && (
			<>
				<strong>Conexión SSH:</strong>
				<Styles.Code>{deploy.cadenaConexionSsh}</Styles.Code>
			</>
		)}
		{deploy.fechaCaducidad && (
			<p>
				<strong>Caduca:</strong> {deploy.fechaCaducidad}
			</p>
		)}
	</Styles.ResultBox>
);

export default DeployResult;
