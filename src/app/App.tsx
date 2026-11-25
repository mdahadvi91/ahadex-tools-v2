import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { STATIC_PAGE_ROUTES } from '../config/static-routes';
import MainLayout from '../components/layout/MainLayout';
import About from '../pages/About';
import Contact from '../pages/Contact';
import CookiePolicy from '../pages/CookiePolicy';
import Disclaimer from '../pages/Disclaimer';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';
import { applyRouteSeo } from '../platform/seo';
import { toolRoutes } from '../router/route-registry';

function RouteHeadSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalized = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}/`;
    const matchedTool = toolRoutes.find((r) => r.path === normalized);
    if (matchedTool) {
      applyRouteSeo(matchedTool.meta);
      return;
    }

    const matchedStatic = STATIC_PAGE_ROUTES.find((r) => r.path === normalized);
    if (matchedStatic) {
      applyRouteSeo({
        path: matchedStatic.path,
        title: matchedStatic.title,
        description: matchedStatic.description,
        indexable: matchedStatic.indexable,
        sitemap: matchedStatic.sitemap,
      });
    }
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <MainLayout>
      <RouteHeadSync />
      <Routes>
        <Route path="/" element={<Home />} />
        {toolRoutes.flatMap((route) => {
          const Component = route.Component;
          const withoutTrailing = route.path.replace(/\/$/, '');
          const slug = withoutTrailing.replace(/^\//, '');
          const routes = [<Route key={route.path} path={route.path} element={<Component />} />];
          if (withoutTrailing && withoutTrailing !== route.path) {
            routes.push(
              <Route key={withoutTrailing} path={withoutTrailing} element={<Component />} />,
            );
          }
          if (slug) {
            routes.push(
              <Route
                key={`legacy-tool-${slug}`}
                path={`/tool/${slug}`}
                element={<Navigate to={route.path} replace />}
              />,
              <Route
                key={`legacy-tool-${slug}-slash`}
                path={`/tool/${slug}/`}
                element={<Navigate to={route.path} replace />}
              />,
            );
          }
          return routes;
        })}
        <Route path="/about" element={<About />} />
        <Route path="/about/" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contact/" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms/" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/disclaimer/" element={<Disclaimer />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/cookie-policy/" element={<CookiePolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
