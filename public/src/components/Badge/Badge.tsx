import * as Styles from './styles';

// Pastilla de estado de un deploy: colorea según el estado que muestra.
const Badge = ({ status }: { status: string }) => <Styles.Badge $status={status}>{status}</Styles.Badge>;

export default Badge;
