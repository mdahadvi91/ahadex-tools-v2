/**
 * Route definitions for React Router. Combines static routes with
 * tool routes from route-registry.ts.
 */

import type { RouteObject } from 'react-router-dom';
import Home from '../pages/Home';
import Tools from '../pages/Tools';
import About from '../pages/About';
import Contact from '../pages/Contact';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';
import Disclaimer from '../pages/Disclaimer';
import CookiePolicy from '../pages/CookiePolicy';
import NotFound from '../pages/NotFound';
import { getToolRoutes } from './route-registry';

export function buildRoutes(): RouteObject[] {
  const staticRoutes: RouteObject[] = [
    { path: '/', element: <Home /> },
    { path: '/tools', element: <Tools /> },
    { path: '/about', element: <About /> },
    { path: '/contact', element: <Contact /> },
    { path: '/privacy', element: <PrivacyPolicy /> },
    { path: '/terms', element: <Terms /> },
    { path: '/disclaimer', element: <Disclaimer /> },
    { path: '/cookies', element: <CookiePolicy /> },
    { path: '*', element: <NotFound /> },
  ];

  const toolRoutes: RouteObject[] = getToolRoutes().map((route) => ({
    path: route.path,
    element: <route.Component />,
  }));

  return [...staticRoutes, ...toolRoutes];
}
