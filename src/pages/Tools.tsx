/**
 * Tools index page. Lists all live tools.
 */

import { Link } from 'react-router-dom';
import { getToolRoutes } from '../router/route-registry';

export default function Tools() {
  const tools = getToolRoutes();

  return (
    <main>
      <h1>All Tools</h1>
      {tools.length === 0 ? (
        <p>No tools available yet.</p>
      ) : (
        <ul>
          {tools.map((tool) => (
            <li key={tool.path}>
              <Link to={tool.path}>{tool.meta.title}</Link>
              <p>{tool.meta.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
