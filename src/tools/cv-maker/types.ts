/**
 * Domain types for the privacy-first AHADEX CV Maker tool.
 */

export type CvTemplateLayout =
  | 'left-sidebar'
  | 'right-sidebar'
  | 'classic-top'
  | 'split-banner'
  | 'timeline'
  | 'minimal-swiss'
  | 'boxed-grid'
  | 'compact-dense'
  | 'editorial-serif'
  | 'monogram-corner';

export type CvTemplateCategory = 'all' | 'ats' | 'sidebar' | 'creative' | 'technical' | 'minimal';

export type CvFontStyle = 'sans' | 'serif' | 'mono-accent';

export type CvPhotoShape = 'circle' | 'rounded' | 'square';

export type CvSectionStyle = 'rule' | 'pill' | 'bar' | 'dot';

export interface CvTemplate {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly category: Exclude<CvTemplateCategory, 'all'>;
  readonly layout: CvTemplateLayout;
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly surfaceColor: string;
  readonly sidebarColor: string;
  readonly sidebarTextColor: string;
  readonly fontStyle: CvFontStyle;
  readonly photoShape: CvPhotoShape;
  readonly sectionStyle: CvSectionStyle;
  readonly badge: string;
}

export interface CvPersonalDetails {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  photoDataUrl: string | null;
}

export interface CvExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface CvEducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  graduationYear: string;
  details: string;
}

export interface CvFormData {
  templateId: string;
  professionId: string;
  personal: CvPersonalDetails;
  summary: string;
  experiences: CvExperienceItem[];
  educations: CvEducationItem[];
  skills: string[];
  languages: string[];
  certifications: string[];
}

export interface ProfessionPreset {
  readonly id: string;
  readonly title: string;
  readonly categoryLabel: string;
  readonly shortHint: string;
  readonly headline: string;
  readonly summary: string;
  readonly summarySnippets: readonly string[];
  readonly experiences: readonly Omit<CvExperienceItem, 'id'>[];
  readonly educations: readonly Omit<CvEducationItem, 'id'>[];
  readonly skills: readonly string[];
  readonly languages: readonly string[];
  readonly certifications: readonly string[];
}

export type CvWizardStepId =
  | 'template'
  | 'profession'
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'preview';

export interface CvValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

export interface CvPdfBuildInput {
  readonly data: CvFormData;
  readonly template: CvTemplate;
  readonly photoBytes?: Uint8Array;
  readonly photoMime?: 'image/jpeg' | 'image/png';
}

export interface CvPdfBuildResult {
  readonly bytes: Uint8Array;
  readonly pageCount: number;
  readonly outputSize: number;
  readonly durationMs: number;
}
