import type { Deploy, DeployStatus } from '../../types';
import { Spinner } from '../Loading';
import * as Styles from './styles';

const STEPS: { status: DeployStatus; label: string }[] = [
	{ status: 'creando', label: 'Creando entorno (rama + pipeline)' },
	{ status: 'instalando', label: 'Instalando entorno' },
	{ status: 'listo', label: 'Entorno listo' },
];

// Los entornos de tipo test no se instalan: solo se crean y despliegan.
const TEST_STEPS: { status: DeployStatus; label: string }[] = [
	{ status: 'creando', label: 'Creando entorno de test (rama + pipeline)' },
	{ status: 'listo', label: 'Entorno listo' },
];

const stepState = (stepIndex: number, deploy: Deploy) => {
	const steps = deploy.type === 'test' ? TEST_STEPS : STEPS;

	// Si falló, el paso en curso era "instalando" si createEntorno ya había
	// terminado (el deploy tiene entornoName), o "creando" si no. Los test
	// no tienen paso de instalación, así que siempre fallan en "creando".
	const currentIndex =
		deploy.status === 'error'
			? deploy.entornoName && deploy.type !== 'test'
				? 1
				: 0
			: steps.findIndex((s) => s.status === deploy.status);

	if (stepIndex < currentIndex) return 'done';
	if (stepIndex > currentIndex) return 'pending';
	if (deploy.status === 'error') return 'error';
	return deploy.status === 'listo' ? 'done' : 'active';
};

// Lista de pasos del despliegue con el estado de cada uno.
const DeploySteps = ({ deploy }: { deploy: Deploy }) => (
	<Styles.Steps>
		{(deploy.type === 'test' ? TEST_STEPS : STEPS).map((step, index) => {
			const state = stepState(index, deploy);
			return (
				<Styles.Step key={step.status} $state={state}>
					{state === 'done' && '✅'}
					{state === 'active' && <Spinner />}
					{state === 'error' && '❌'}
					{state === 'pending' && '·'}
					{step.label}
				</Styles.Step>
			);
		})}
	</Styles.Steps>
);

export default DeploySteps;
