/**
 * Authoritative TypeScript contracts for AHADEX Tools.
 * Supports independent filesystem-discovered tool modules,
 * SEO metadata, Schema.org JSON-LD, content quality metadata,
 * and build-time validation reporting.
 */

import type { ComponentType } from 'react';

export type ToolStatus = 'draft' | 'live' | 'deprecated';

export type ToolCategory = 'image' | 'pdf' | 'document' | 'utility';

export interface ToolBreadcrumbItem {
  readonly name: string;
  readonly path: string;
}

export interface ToolFaqItem {
  readonly question: string;
  readonly answer: string;
}

export interface ToolHowToStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
}

export interface ToolMetadata {
  readonly slug: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly category: ToolCategory;
  readonly canonical: string;
  readonly status: ToolStatus;
  readonly indexable: boolean;
  readonly sitemap: boolean;
  readonly launchOrder: number;
  readonly featured?: boolean;
  readonly requiresConsent?: boolean;
  readonly supportedFormats?: readonly string[];
  readonly iconPath?: string;
  readonly ogImagePath?: string;
}

export interface ToolSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly canonicalPath: string;
  readonly canonicalUrl: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
  readonly ogImage: string;
  readonly ogImageAlt: string;
  readonly ogType: 'website' | 'article';
  readonly twitterCard: 'summary' | 'summary_large_image';
  readonly robots: string;
  readonly noIndex: boolean;
}

export interface ToolContentConfig {
  readonly h1: string;
  readonly tagline: string;
  readonly directAnswer: string;
  readonly overview: string;
  readonly howItWorks: readonly string[];
  readonly howToSteps: readonly ToolHowToStep[];
  readonly features: readonly string[];
  readonly benefits: readonly string[];
  readonly limitations: readonly string[];
  readonly privacyNote: string;
  readonly useCases: readonly string[];
  readonly supportedFormats: readonly string[];
  readonly relatedToolSlugs: readonly string[];
}

export interface ToolModuleExports {
  readonly metadata?: ToolMetadata;
  readonly manifest?: {
    readonly slug: string;
    readonly path: string;
    readonly title: string;
    readonly description: string;
    readonly indexable: boolean;
    readonly sitemap: boolean;
    readonly status: ToolStatus;
    readonly launchOrder: number;
    readonly requiresConsent: boolean;
  };
  readonly default: ComponentType;
}

export type ValidationSeverity = 'critical' | 'warning' | 'info';

export type ValidationStatus = 'PASS' | 'FAIL' | 'WARN' | 'NOT_RUN' | 'BLOCKED';

export interface ValidationIssue {
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly target?: string;
  readonly hint?: string;
}

export interface ValidationReport {
  readonly validator: string;
  readonly status: ValidationStatus;
  readonly timestamp: string;
  readonly checkedCount: number;
  readonly issues: readonly ValidationIssue[];
}
