import { Route, Routes } from 'react-router-dom';
import { toolRoutes } from '../router/route-registry';
import MainLayout from '../components/layout/MainLayout';
import Home from '../pages/Home';
import About from '../pages/About';
import Contact from '../pages/Contact';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';
import Disclaimer from '../pages/Disclaimer';
import CookiePolicy from '../pages/CookiePolicy';
import NotFound from '../pages/NotFound';

export function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        {toolRoutes.map((route) => {
          const Component = route.Component;
          return <Route key={route.path} path={route.path} element={<Component />} />;
        })}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
