/**
 * Route definitions for React Router. Combines static routes with
 * tool routes from route-registry.ts.
 */

import type { RouteObject } from 'react-router-dom';
import { getToolRoutes } from './route-registry';

function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h1>AHADEX Tools</h1>
      <p>Privacy-first browser-based file tools.</p>
    </div>
  );
}

function ToolsIndex() {
  return (
    <div>
      <h1>All Tools</h1>
    </div>
  );
}

export function buildRoutes(): RouteObject[] {
  const staticRoutes: RouteObject[] = [
    { path: '/', element: <Home /> },
    { path: '/tools', element: <ToolsIndex /> },
    { path: '*', element: <NotFound /> },
  ];

  const toolRoutes: RouteObject[] = getToolRoutes().map((route) => ({
    path: route.path,
    element: <route.Component />,
  }));

  return [...staticRoutes, ...toolRoutes];
}
