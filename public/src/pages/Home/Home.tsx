import { Link } from 'react-router-dom';
import { Page } from '../../components';

const Home = () => (
	<Page title="Welcome to the Home Page">
		<p>This is the home page of our application.</p>
		<Link to="/deploy">Desplegar un entorno</Link>
		<br />
		<Link to="/deploys">Ver deploys</Link>
	</Page>
);

export default Home;
