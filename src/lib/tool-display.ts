/**
 * Shared display utilities for formatting tool labels, detecting categories,
 * and mapping consistent icon kinds across Navigation, Sidebar, Grid, and Cards.
 */

import type { AppRoute } from '../router/route-types';

export type DisplayToolCategory = 'image' | 'pdf' | 'utility';

export type ToolVisualKind = 'compress' | 'resize' | 'merge' | 'split' | 'image' | 'pdf';

export function getShortToolName(title: string): string {
  const withoutSuffix = title.split(' - ')[0] ?? title;
  return withoutSuffix.replace(/^Free\s+/i, '').trim();
}

export function detectToolCategory(route: AppRoute): DisplayToolCategory {
  const pathLower = route.path.toLowerCase();
  const titleLower = route.meta.title.toLowerCase();
  if (
    pathLower.includes('pdf') ||
    pathLower.includes('merge-') ||
    pathLower.includes('split-') ||
    titleLower.includes('pdf')
  ) {
    return 'pdf';
  }
  if (
    pathLower.includes('image') ||
    titleLower.includes('image') ||
    titleLower.includes('jpg') ||
    titleLower.includes('png')
  ) {
    return 'image';
  }
  return 'utility';
}

export function detectToolVisualKind(route: AppRoute): ToolVisualKind {
  const combined = `${route.path} ${route.meta.title}`.toLowerCase();
  if (combined.includes('merge')) return 'merge';
  if (combined.includes('split')) return 'split';
  if (combined.includes('resiz')) return 'resize';
  if (combined.includes('compress') && combined.includes('pdf')) return 'pdf';
  if (combined.includes('compress')) return 'compress';
  if (combined.includes('pdf')) return 'pdf';
  return 'image';
}

export function getCategoryLabel(category: DisplayToolCategory): string {
  switch (category) {
    case 'image':
      return 'Image Tool';
    case 'pdf':
      return 'PDF Tool';
    default:
      return 'Browser Utility';
  }
}
