/**
 * Interactive step-by-step CV Maker workspace.
 * Supports 30 distinct templates, 12 profession starters, optional portrait photos,
 * full section editing (summary, jobs, multiple schools/degrees, skills),
 * live A4 preview, and local client-side vector PDF export.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { triggerBlobDownload } from '../../lib/download-blob';
import { formatBytes } from '../../lib/format-bytes';
import { validateSingleFile } from '../../platform/security/file-policy';
import CvLivePreview from './components/CvLivePreview';
import TemplateThumbnail from './components/TemplateThumbnail';
import {
  BLANK_PROFESSION_PRESET,
  PROFESSION_PRESETS,
  createCvFormFromPreset,
  getProfessionPresetById,
} from './data/professions';
import { CV_TEMPLATES, getTemplateById } from './data/templates';
import {
  MAX_EDUCATION_ITEMS,
  MAX_EXPERIENCE_ITEMS,
  MAX_SKILLS_COUNT,
  buildSafePdfFilename,
  generateCvPdf,
  validateCvFormData,
  validateProfilePhotoFile,
} from './engine';
import type {
  CvEducationItem,
  CvExperienceItem,
  CvFormData,
  CvTemplateCategory,
  CvWizardStepId,
} from './types';

interface StepDefinition {
  readonly id: CvWizardStepId;
  readonly number: number;
  readonly label: string;
}

const STEPS: readonly StepDefinition[] = [
  { id: 'template', number: 1, label: 'Template' },
  { id: 'profession', number: 2, label: 'Profession' },
  { id: 'personal', number: 3, label: 'Personal & Photo' },
  { id: 'summary', number: 4, label: 'Summary' },
  { id: 'experience', number: 5, label: 'Experience' },
  { id: 'education', number: 6, label: 'Education' },
  { id: 'skills', number: 7, label: 'Skills' },
  { id: 'preview', number: 8, label: 'Preview & PDF' },
];

const TEMPLATE_CATEGORIES: readonly { id: CvTemplateCategory; label: string }[] = [
  { id: 'all', label: 'All (30)' },
  { id: 'ats', label: 'ATS & Corporate' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'creative', label: 'Creative' },
  { id: 'technical', label: 'Technical' },
  { id: 'minimal', label: 'Minimal' },
];

async function normalizePhotoToJpeg(file: File): Promise<{
  bytes: Uint8Array;
  dataUrl: string;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxDim = 360;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(64, Math.round(bitmap.width * scale));
    const height = Math.max(64, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize canvas context for portrait photo.');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Could not encode portrait photo.'))),
        'image/jpeg',
        0.9,
      );
    });
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return { bytes, dataUrl };
  } finally {
    bitmap.close();
  }
}

export default function Tool() {
  const [activeStep, setActiveStep] = useState<CvWizardStepId>('template');
  const [templateCategory, setTemplateCategory] = useState<CvTemplateCategory>('all');
  const [formData, setFormData] = useState<CvFormData>(() =>
    createCvFormFromPreset('software-engineer', 'obsidian-rail'),
  );
  const [photoBytes, setPhotoBytes] = useState<Uint8Array | undefined>(undefined);
  const [customFilename, setCustomFilename] = useState<string>('');
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<{
    fileName: string;
    pageCount: number;
    outputSize: number;
    durationMs: number;
  } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = useMemo(() => getTemplateById(formData.templateId), [formData.templateId]);
  const activePreset = useMemo(
    () => getProfessionPresetById(formData.professionId),
    [formData.professionId],
  );

  const filteredTemplates = useMemo(() => {
    if (templateCategory === 'all') return CV_TEMPLATES;
    return CV_TEMPLATES.filter((t) => t.category === templateCategory);
  }, [templateCategory]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);

  const goToNextStep = useCallback(() => {
    setErrorMessage(null);
    const next = STEPS[currentStepIndex + 1];
    if (next) setActiveStep(next.id);
  }, [currentStepIndex]);

  const goToPrevStep = useCallback(() => {
    setErrorMessage(null);
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setActiveStep(prev.id);
  }, [currentStepIndex]);

  const selectTemplate = useCallback((templateId: string) => {
    setFormData((prev) => ({ ...prev, templateId }));
    setExportStatus(null);
  }, []);

  const selectProfession = useCallback((professionId: string) => {
    const fresh = createCvFormFromPreset(professionId);
    setFormData((prev) => {
      const hasCustomName =
        prev.personal.fullName.trim().length > 0 && prev.personal.fullName !== 'Alex Morgan';
      const hasCustomEmail =
        prev.personal.email.trim().length > 0 && prev.personal.email !== 'alex.morgan@example.com';

      return {
        ...fresh,
        templateId: prev.templateId,
        personal: {
          ...fresh.personal,
          fullName: hasCustomName ? prev.personal.fullName : fresh.personal.fullName,
          email: hasCustomEmail ? prev.personal.email : fresh.personal.email,
          phone:
            prev.personal.phone !== '+1 (555) 234-8910'
              ? prev.personal.phone
              : fresh.personal.phone,
          website:
            prev.personal.website !== 'linkedin.com/in/alex-morgan'
              ? prev.personal.website
              : fresh.personal.website,
          photoDataUrl: prev.personal.photoDataUrl,
        },
      };
    });
    setExportStatus(null);
    setErrorMessage(null);
  }, []);

  const handlePhotoUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const policyCheck = validateSingleFile(file, 'image');
    if (!policyCheck.ok) {
      setErrorMessage(policyCheck.violations[0]?.message ?? 'Invalid photo file.');
      return;
    }
    const check = validateProfilePhotoFile(file);
    if (!check.valid) {
      setErrorMessage(check.reason ?? 'Invalid photo file.');
      return;
    }
    try {
      setErrorMessage(null);
      const { bytes, dataUrl } = await normalizePhotoToJpeg(file);
      setPhotoBytes(bytes);
      setFormData((prev) => ({
        ...prev,
        personal: { ...prev.personal, photoDataUrl: dataUrl },
      }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not process portrait photo.');
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhotoBytes(undefined);
    setFormData((prev) => ({
      ...prev,
      personal: { ...prev.personal, photoDataUrl: null },
    }));
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }, []);

  const updateExperience = useCallback((id: string, patch: Partial<CvExperienceItem>) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => (exp.id === id ? { ...exp, ...patch } : exp)),
    }));
  }, []);

  const addExperience = useCallback(() => {
    setFormData((prev) => {
      if (prev.experiences.length >= MAX_EXPERIENCE_ITEMS) return prev;
      const nextItem: CvExperienceItem = {
        id: `exp-custom-${Date.now()}-${prev.experiences.length + 1}`,
        role: '',
        company: '',
        location: '',
        startDate: '',
        endDate: 'Present',
        highlights: [''],
      };
      return { ...prev, experiences: [...prev.experiences, nextItem] };
    });
  }, []);

  const removeExperience = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  }, []);

  const updateExperienceBullet = useCallback((expId: string, bulletIndex: number, text: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        const nextHighlights = [...exp.highlights];
        nextHighlights[bulletIndex] = text;
        return { ...exp, highlights: nextHighlights };
      }),
    }));
  }, []);

  const addExperienceBullet = useCallback((expId: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId ? { ...exp, highlights: [...exp.highlights, ''] } : exp,
      ),
    }));
  }, []);

  const removeExperienceBullet = useCallback((expId: string, bulletIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId
          ? { ...exp, highlights: exp.highlights.filter((_, i) => i !== bulletIndex) }
          : exp,
      ),
    }));
  }, []);

  const updateEducation = useCallback((id: string, patch: Partial<CvEducationItem>) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.map((edu) => (edu.id === id ? { ...edu, ...patch } : edu)),
    }));
  }, []);

  const addEducation = useCallback(() => {
    setFormData((prev) => {
      if (prev.educations.length >= MAX_EDUCATION_ITEMS) return prev;
      const nextEdu: CvEducationItem = {
        id: `edu-custom-${Date.now()}-${prev.educations.length + 1}`,
        degree: '',
        school: '',
        location: '',
        graduationYear: '',
        details: '',
      };
      return { ...prev, educations: [...prev.educations, nextEdu] };
    });
  }, []);

  const removeEducation = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      educations: prev.educations.filter((edu) => edu.id !== id),
    }));
  }, []);

  const handleAddSkill = useCallback(() => {
    const clean = newSkill.trim();
    if (!clean) return;
    setFormData((prev) => {
      if (prev.skills.length >= MAX_SKILLS_COUNT) return prev;
      if (prev.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) return prev;
      return { ...prev, skills: [...prev.skills, clean] };
    });
    setNewSkill('');
  }, [newSkill]);

  const handleRemoveSkill = useCallback((skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }, []);

  const handleAddLanguage = useCallback(() => {
    const clean = newLanguage.trim();
    if (!clean) return;
    setFormData((prev) => {
      if (prev.languages.includes(clean)) return prev;
      return { ...prev, languages: [...prev.languages, clean] };
    });
    setNewLanguage('');
  }, [newLanguage]);

  const handleRemoveLanguage = useCallback((lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
    }));
  }, []);

  const handleAddCertification = useCallback(() => {
    const clean = newCertification.trim();
    if (!clean) return;
    setFormData((prev) => {
      if (prev.certifications.includes(clean)) return prev;
      return { ...prev, certifications: [...prev.certifications, clean] };
    });
    setNewCertification('');
  }, [newCertification]);

  const handleRemoveCertification = useCallback((cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const validation = validateCvFormData(formData);
    if (!validation.valid) {
      setErrorMessage(validation.reason ?? 'Please check your CV details before exporting.');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const result = await generateCvPdf({
        data: formData,
        template: activeTemplate,
        photoBytes,
        photoMime: photoBytes ? 'image/jpeg' : undefined,
      });

      const resolvedName = customFilename.trim()
        ? customFilename.trim().toLowerCase().endsWith('.pdf')
          ? customFilename.trim()
          : `${customFilename.trim()}.pdf`
        : buildSafePdfFilename(formData.personal.fullName);

      const blob = new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' });
      triggerBlobDownload(blob, resolvedName);
      setExportStatus({
        fileName: resolvedName,
        pageCount: result.pageCount,
        outputSize: result.outputSize,
        durationMs: result.durationMs,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'PDF generation failed unexpectedly.');
    } finally {
      setIsExporting(false);
    }
  }, [activeTemplate, customFilename, formData, photoBytes]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Guided Stepper Bar */}
      <nav aria-label="CV builder steps" className="mb-6 overflow-x-auto pb-2">
        <ol className="flex min-w-max items-center gap-2">
          {STEPS.map((step) => {
            const isCurrent = step.id === activeStep;
            const isVisited = step.number < currentStepIndex + 1;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setActiveStep(step.id);
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                      : isVisited
                        ? 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100'
                        : 'border-[#e6e2d8] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono tabular-nums">{step.number}.</span>
                  <span>{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      {/* Main Step Workspace Card */}
      <div className="rounded-2xl border border-[#e6e2d8] bg-[#faf8f5] p-5 shadow-xs sm:p-7">
        {/* STEP 1: 30 TEMPLATES */}
        {activeStep === 'template' && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  1. Choose a CV Template (30 Unique Designs)
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Selected: <strong className="text-slate-900">{activeTemplate.name}</strong> —{' '}
                  {activeTemplate.tagline}
                </p>
              </div>
              <button
                type="button"
                onClick={goToNextStep}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Next: Choose Profession →
              </button>
            </div>

            <div
              className="mt-5 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Template categories"
            >
              {TEMPLATE_CATEGORIES.map((cat) => {
                const isActive = templateCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setTemplateCategory(cat.id)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-[#e6e2d8] bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {filteredTemplates.map((template) => {
                const isSelected = template.id === formData.templateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    data-testid="cv-template-card"
                    aria-pressed={isSelected}
                    onClick={() => selectTemplate(template.id)}
                    className={`group flex flex-col rounded-xl border bg-white p-3 text-left transition-all ${
                      isSelected
                        ? 'border-brand-600 ring-2 ring-brand-600/25 shadow-sm'
                        : 'border-[#e6e2d8] hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <TemplateThumbnail template={template} />
                    <div className="mt-2.5 flex items-start justify-between gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{template.name}</span>
                      <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {template.badge}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-600">
                      {template.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PROFESSION PRESETS */}
        {activeStep === 'profession' && (
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              2. Choose Your Target Profession
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Picking a profession pre-fills a tailored summary, work experience bullets, degree,
              and core skills that you can freely edit in the next steps.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...PROFESSION_PRESETS, BLANK_PROFESSION_PRESET].map((preset) => {
                const isSelected = formData.professionId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid="cv-profession-card"
                    aria-pressed={isSelected}
                    onClick={() => selectProfession(preset.id)}
                    className={`rounded-xl border bg-white p-4 text-left transition-all ${
                      isSelected
                        ? 'border-brand-600 ring-2 ring-brand-600/25 shadow-sm'
                        : 'border-[#e6e2d8] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                        {preset.categoryLabel}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-base font-bold text-slate-900">{preset.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {preset.shortHint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: PERSONAL DETAILS & OPTIONAL PHOTO */}
        {activeStep === 'personal' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  3. Personal Details & Portrait Photo
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter your contact details and optionally attach a local portrait photo.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cv-full-name"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Full Name
                  </label>
                  <input
                    id="cv-full-name"
                    type="text"
                    value={formData.personal.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, fullName: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Alex Morgan"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cv-headline"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Professional Headline
                  </label>
                  <input
                    id="cv-headline"
                    type="text"
                    value={formData.personal.headline}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, headline: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div>
                  <label htmlFor="cv-email" className="block text-sm font-semibold text-slate-800">
                    Email Address
                  </label>
                  <input
                    id="cv-email"
                    type="email"
                    value={formData.personal.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, email: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="cv-phone" className="block text-sm font-semibold text-slate-800">
                    Phone Number
                  </label>
                  <input
                    id="cv-phone"
                    type="tel"
                    value={formData.personal.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, phone: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cv-location"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    City & Country
                  </label>
                  <input
                    id="cv-location"
                    type="text"
                    value={formData.personal.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, location: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cv-website"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    LinkedIn or Portfolio URL
                  </label>
                  <input
                    id="cv-website"
                    type="text"
                    value={formData.personal.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, website: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e6e2d8] bg-white p-5">
              <p className="text-sm font-bold text-slate-900">Portrait Photo (Optional)</p>
              <p className="mt-1 text-xs text-slate-600">
                Processed locally in your browser (JPG, PNG, or WebP up to 10 MB).
              </p>
              <div className="mt-4 flex flex-col items-center gap-3">
                {formData.personal.photoDataUrl ? (
                  <img
                    src={formData.personal.photoDataUrl}
                    alt="Uploaded portrait preview"
                    className="h-28 w-28 rounded-full border-2 border-brand-600 object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-medium text-slate-600">
                    No photo
                  </div>
                )}

                <label
                  htmlFor="cv-photo-input"
                  className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Choose Portrait Photo
                </label>
                <input
                  id="cv-photo-input"
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="sr-only"
                />

                {formData.personal.photoDataUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="text-xs font-semibold text-red-700 hover:underline"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY */}
        {activeStep === 'summary' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  4. Professional Summary
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pre-filled for <strong>{activePreset.title}</strong>. Edit freely, append an
                  achievement idea below, or clear and write from scratch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, summary: activePreset.summary }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset to {activePreset.title} starter
              </button>
            </div>

            <div>
              <label
                htmlFor="cv-summary-textarea"
                className="block text-sm font-semibold text-slate-800"
              >
                Summary Statement
              </label>
              <textarea
                id="cv-summary-textarea"
                rows={5}
                value={formData.summary}
                onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900"
                placeholder="Summarize your core experience, domain focus, and key results..."
              />
            </div>

            {activePreset.summarySnippets.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Quick achievement snippets (click to append)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activePreset.summarySnippets.map((snippet) => (
                    <button
                      key={snippet}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          summary: prev.summary.trim()
                            ? `${prev.summary.trim()} ${snippet}`
                            : snippet,
                        }))
                      }
                      className="rounded-lg border border-[#e6e2d8] bg-white px-3 py-1.5 text-left text-xs text-slate-700 hover:border-brand-600 hover:text-brand-700"
                    >
                      + {snippet}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: WORK EXPERIENCE */}
        {activeStep === 'experience' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  5. Work Experience
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update demo positions, add new roles, or delete entries and individual bullets.
                </p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                disabled={formData.experiences.length >= MAX_EXPERIENCE_ITEMS}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                + Add Work Experience
              </button>
            </div>

            {formData.experiences.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                No work experience added yet. Click &ldquo;+ Add Work Experience&rdquo; above if
                applicable.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.experiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-[#e6e2d8] bg-white p-5 shadow-xs"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Role #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="text-xs font-semibold text-red-700 hover:underline"
                      >
                        Delete role
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label
                          htmlFor={`exp-role-${exp.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Job Title
                        </label>
                        <input
                          id={`exp-role-${exp.id}`}
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`exp-company-${exp.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Company / Organization
                        </label>
                        <input
                          id={`exp-company-${exp.id}`}
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`exp-location-${exp.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Location
                        </label>
                        <input
                          id={`exp-location-${exp.id}`}
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`exp-start-${exp.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Start Date
                        </label>
                        <input
                          id={`exp-start-${exp.id}`}
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                          placeholder="Jan 2022"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`exp-end-${exp.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          End Date
                        </label>
                        <input
                          id={`exp-end-${exp.id}`}
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                          placeholder="Present"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Key Achievements & Responsibilities
                        </span>
                        <button
                          type="button"
                          onClick={() => addExperienceBullet(exp.id)}
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          + Add bullet
                        </button>
                      </div>
                      {exp.highlights.map((bullet, bIdx) => (
                        <div key={`${exp.id}-bullet-${bIdx}`} className="flex items-center gap-2">
                          <label htmlFor={`exp-b-${exp.id}-${bIdx}`} className="sr-only">
                            Achievement bullet {bIdx + 1}
                          </label>
                          <input
                            id={`exp-b-${exp.id}-${bIdx}`}
                            type="text"
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                            placeholder="Quantify impact or project outcome..."
                          />
                          <button
                            type="button"
                            onClick={() => removeExperienceBullet(exp.id, bIdx)}
                            aria-label={`Remove bullet ${bIdx + 1}`}
                            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: EDUCATION & SCHOOLS */}
        {activeStep === 'education' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  6. Education, Schools & Degrees
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add one or multiple universities, colleges, high schools, or diploma programs.
                </p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                disabled={formData.educations.length >= MAX_EDUCATION_ITEMS}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                + Add School / Degree
              </button>
            </div>

            {formData.educations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                No schools added yet. Click &ldquo;+ Add School / Degree&rdquo; above to add an
                education entry.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.educations.map((edu, index) => (
                  <div
                    key={edu.id}
                    data-testid="cv-education-card"
                    className="rounded-xl border border-[#e6e2d8] bg-white p-5 shadow-xs"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        School / Degree #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="text-xs font-semibold text-red-700 hover:underline"
                      >
                        Delete school
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`edu-degree-${edu.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Degree / Diploma / Certificate
                        </label>
                        <input
                          id={`edu-degree-${edu.id}`}
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                          placeholder="B.Sc. in Computer Science"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edu-school-${edu.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          School / University Name
                        </label>
                        <input
                          id={`edu-school-${edu.id}`}
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                          placeholder="University of Leeds"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edu-location-${edu.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Location
                        </label>
                        <input
                          id={`edu-location-${edu.id}`}
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`edu-year-${edu.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Graduation Year
                        </label>
                        <input
                          id={`edu-year-${edu.id}`}
                          type="text"
                          value={edu.graduationYear}
                          onChange={(e) =>
                            updateEducation(edu.id, { graduationYear: e.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                          placeholder="2024"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`edu-details-${edu.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Honors, Major, or Coursework (Optional)
                        </label>
                        <input
                          id={`edu-details-${edu.id}`}
                          type="text"
                          value={edu.details}
                          onChange={(e) => updateEducation(edu.id, { details: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 7: SKILLS, LANGUAGES & CERTIFICATIONS */}
        {activeStep === 'skills' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                7. Skills, Languages & Certifications
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Keep skills focused and relevant to your target role.
              </p>
            </div>

            <div className="rounded-xl border border-[#e6e2d8] bg-white p-5">
              <label htmlFor="cv-new-skill" className="block text-sm font-semibold text-slate-900">
                Core Skills ({formData.skills.length}/{MAX_SKILLS_COUNT})
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="cv-new-skill"
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g., Data Modeling, Public Speaking, TypeScript"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Add Skill
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="font-bold text-slate-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#e6e2d8] bg-white p-5">
                <label
                  htmlFor="cv-new-language"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Languages
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="cv-new-language"
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLanguage();
                      }
                    }}
                    placeholder="e.g., English (Fluent)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddLanguage}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                    >
                      <span>{lang}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang)}
                        aria-label={`Remove ${lang}`}
                        className="font-bold text-slate-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#e6e2d8] bg-white p-5">
                <label htmlFor="cv-new-cert" className="block text-sm font-semibold text-slate-900">
                  Certifications & Licenses
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="cv-new-cert"
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCertification();
                      }
                    }}
                    placeholder="e.g., PMP, AWS Certified Solutions Architect"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800"
                    >
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert)}
                        aria-label={`Remove ${cert}`}
                        className="font-bold text-slate-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: LIVE PREVIEW & PDF DOWNLOAD */}
        {activeStep === 'preview' && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  8. Preview & Download PDF
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Switch templates anytime without losing your edits, then export a vector A4 PDF
                  directly in your browser.
                </p>
              </div>

              <div className="rounded-xl border border-[#e6e2d8] bg-white p-4 space-y-3">
                <div>
                  <label
                    htmlFor="cv-quick-template"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Active CV Template (30 styles)
                  </label>
                  <select
                    id="cv-quick-template"
                    value={formData.templateId}
                    onChange={(e) => selectTemplate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {CV_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cv-output-filename"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Output PDF Filename (Optional)
                  </label>
                  <input
                    id="cv-output-filename"
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder={buildSafePdfFilename(formData.personal.fullName)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-brand-700 disabled:opacity-60"
                >
                  {isExporting ? 'Generating Vector PDF...' : 'Download CV as PDF'}
                </button>

                {exportStatus && (
                  <div
                    role="status"
                    className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900"
                  >
                    <p className="font-bold">PDF ready: {exportStatus.fileName}</p>
                    <p className="mt-0.5">
                      {exportStatus.pageCount} {exportStatus.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                      {formatBytes(exportStatus.outputSize)} · built locally in{' '}
                      {exportStatus.durationMs} ms
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <CvLivePreview data={formData} template={activeTemplate} />
            </div>
          </div>
        )}

        {/* Bottom Step Navigation Footer */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e2d8] pt-5">
          <button
            type="button"
            onClick={goToPrevStep}
            disabled={currentStepIndex <= 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            ← Back
          </button>

          <span className="text-xs font-medium text-slate-600 tabular-nums">
            Step {currentStepIndex + 1} of {STEPS.length} · Template: {activeTemplate.name}
          </span>

          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Next: {STEPS[currentStepIndex + 1].label} →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isExporting ? 'Generating...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
