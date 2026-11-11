/**
 * Registry types for tasks and groups.
 */

import type { TaskDefinition } from '../utils/task-runner';

export type GroupName =
  | 'seo'
  | 'content'
  | 'geo'
  | 'schema'
  | 'assets'
  | 'indexing'
  | 'growth'
  | 'quality'
  | 'architecture'
  | 'security'
  | 'privacy'
  | 'accessibility'
  | 'performance'
  | 'analytics'
  | 'i18n'
  | 'adsense'
  | 'production';

export interface GroupRegistry {
  name: GroupName;
  description: string;
  tasks: readonly TaskDefinition[];
}

export type TaskRegistry = Readonly<{
  [G in GroupName]: GroupRegistry;
}>;

export interface OrchestratorResult {
  executedGroups: GroupName[];
  totalTasks: number;
  totalErrors: number;
  totalWarnings: number;
  durationMs: number;
  ok: boolean;
}
