/**
 * Dependency resolver for validator groups. Builds a topological
 * order from a dependency map and detects cycles.
 */

export type GroupDependencies = Readonly<Record<string, readonly string[]>>;

export interface ResolveResult {
  order: string[];
  cycles: string[][];
}

export function resolveOrder(deps: GroupDependencies): ResolveResult {
  const nodes = Object.keys(deps);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];
  const cycles: string[][] = [];

  function visit(node: string, path: string[]): void {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) {
        cycles.push([...path.slice(cycleStart), node]);
      }
      return;
    }

    visiting.add(node);
    const children = deps[node] ?? [];
    for (const child of children) {
      if (!(child in deps)) {
        throw new Error(
          `Unknown dependency "${child}" referenced by "${node}". ` +
            `Known groups: ${nodes.join(', ')}`,
        );
      }
      visit(child, [...path, node]);
    }
    visiting.delete(node);
    visited.add(node);
    order.push(node);
  }

  for (const node of nodes) {
    visit(node, []);
  }

  return { order, cycles };
}

export function detectCycles(deps: GroupDependencies): string[][] {
  return resolveOrder(deps).cycles;
}

export function groupRoots(deps: GroupDependencies): string[] {
  return Object.entries(deps)
    .filter(([, children]) => children.length === 0)
    .map(([name]) => name);
}

export function groupLeaves(deps: GroupDependencies): string[] {
  const referenced = new Set<string>();
  for (const children of Object.values(deps)) {
    for (const child of children) referenced.add(child);
  }
  return Object.keys(deps).filter((node) => !referenced.has(node));
}
