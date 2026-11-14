/**
 * Image Resizer page. Composes hero, tool widget, and content.
 */

import Hero from './Hero';
import Tool from './Tool';
import Content from './Content';

export default function Page() {
  return (
    <div className="bg-white">
      <Hero />
      <Tool />
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <Content />
      </div>
    </div>
  );
}
