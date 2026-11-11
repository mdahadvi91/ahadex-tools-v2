/**
 * Application root. Layout wraps routes with Header and Footer.
 */

import { useRoutes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { buildRoutes } from './router/routes';

export default function App() {
  const routes = useRoutes(buildRoutes());
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">{routes}</main>
      <Footer />
    </div>
  );
}
