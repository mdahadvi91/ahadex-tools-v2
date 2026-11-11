/**
 * Application root. Wires router into the app.
 */

import { useRoutes } from 'react-router-dom';
import { buildRoutes } from './router/routes';

export default function App() {
  return useRoutes(buildRoutes());
}
