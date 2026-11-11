/**
 * Route type definitions.
 */

import type { ComponentType } from 'react';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  sitemap: boolean;
}

export interface AppRoute {
  path: string;
  Component: ComponentType;
  meta: RouteMeta;
}
