/**
 * Home page. Lists available tools.
 */

import { Link } from 'react-router-dom';
import { getToolRoutes } from '../router/route-registry';
import { getSiteConfig } from '../config/site';

export default function Home() {
  const site = getSiteConfig();
  const tools = getToolRoutes();

  return (
    <main>
      <h1>{site.name}</h1>
      <p>{site.description}</p>
      <h2>Tools</h2>
      <ul>
        {tools.map((tool) => (
          <li key={tool.path}>
            <Link to={tool.path}>{tool.meta.title}</Link>
            <p>{tool.meta.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
