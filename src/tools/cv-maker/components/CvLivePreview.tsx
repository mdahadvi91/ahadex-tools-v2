/**
 * Live interactive A4 HTML resume preview styled faithfully to the selected CvTemplate.
 */

import { extractInitials } from '../engine';
import type { CvFormData, CvTemplate } from '../types';

interface CvLivePreviewProps {
  readonly data: CvFormData;
  readonly template: CvTemplate;
}

function SectionHeading({
  title,
  template,
  inverted = false,
}: {
  title: string;
  template: CvTemplate;
  inverted?: boolean;
}) {
  const color = inverted ? template.sidebarTextColor : template.primaryColor;
  const accent = template.accentColor;

  if (template.sectionStyle === 'pill') {
    return (
      <h3
        className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: inverted ? 'rgba(255,255,255,0.16)' : `${accent}1a`,
          color: inverted ? template.sidebarTextColor : template.primaryColor,
        }}
      >
        {title}
      </h3>
    );
  }

  if (template.sectionStyle === 'bar') {
    return (
      <h3
        className="mb-2 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        <span className="h-3 w-1 rounded-full" style={{ backgroundColor: accent }} />
        <span>{title}</span>
      </h3>
    );
  }

  if (template.sectionStyle === 'dot') {
    return (
      <h3
        className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
        <span>{title}</span>
      </h3>
    );
  }

  return (
    <h3
      className="mb-2 border-b pb-1 text-[10.5px] font-bold uppercase tracking-wider"
      style={{
        color,
        borderColor: inverted ? 'rgba(255,255,255,0.28)' : `${accent}66`,
      }}
    >
      {title}
    </h3>
  );
}

function AvatarBox({
  data,
  template,
  darkBg = false,
}: {
  data: CvFormData;
  template: CvTemplate;
  darkBg?: boolean;
}) {
  const radius =
    template.photoShape === 'circle'
      ? 'rounded-full'
      : template.photoShape === 'rounded'
        ? 'rounded-xl'
        : 'rounded-sm';

  if (data.personal.photoDataUrl) {
    return (
      <img
        src={data.personal.photoDataUrl}
        alt={`${data.personal.fullName || 'Applicant'} portrait`}
        className={`h-16 w-16 flex-none border-2 object-cover ${radius}`}
        style={{ borderColor: template.accentColor }}
      />
    );
  }

  if (template.layout === 'monogram-corner') {
    return (
      <div
        className={`flex h-14 w-14 flex-none items-center justify-center font-display text-lg font-extrabold text-white ${radius}`}
        style={{ backgroundColor: template.primaryColor }}
      >
        {extractInitials(data.personal.fullName)}
      </div>
    );
  }

  if (darkBg) {
    return (
      <div
        className={`flex h-14 w-14 flex-none items-center justify-center border font-display text-base font-bold ${radius}`}
        style={{
          borderColor: 'rgba(255,255,255,0.38)',
          backgroundColor: 'rgba(255,255,255,0.12)',
          color: '#ffffff',
        }}
      >
        {extractInitials(data.personal.fullName)}
      </div>
    );
  }

  return null;
}

export default function CvLivePreview({ data, template }: CvLivePreviewProps) {
  const fontClass =
    template.fontStyle === 'serif'
      ? 'font-serif'
      : template.fontStyle === 'mono-accent'
        ? 'font-sans'
        : 'font-sans';

  const contactItems = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.website,
  ]
    .map((v) => v.trim())
    .filter(Boolean);

  const isSidebarLayout = template.layout === 'left-sidebar' || template.layout === 'right-sidebar';
  const sidebarIsDark =
    template.sidebarTextColor.toLowerCase().startsWith('#f') ||
    template.sidebarTextColor.toLowerCase().startsWith('#e');

  const sidebarContent = (
    <aside
      className="flex flex-col gap-5 p-5"
      style={{ backgroundColor: template.sidebarColor, color: template.sidebarTextColor }}
    >
      <div className="flex flex-col items-start gap-3">
        <AvatarBox data={data} template={template} darkBg={sidebarIsDark} />
        <div>
          <p className="text-base font-extrabold leading-tight">
            {data.personal.fullName || 'Your Full Name'}
          </p>
          {data.personal.headline && (
            <p className="mt-1 text-[11px] font-medium opacity-85">{data.personal.headline}</p>
          )}
        </div>
      </div>

      {contactItems.length > 0 && (
        <div>
          <SectionHeading title="Contact" template={template} inverted={sidebarIsDark} />
          <ul className="space-y-1 text-[10.5px] opacity-90">
            {contactItems.map((item) => (
              <li key={item} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.skills.length > 0 && (
        <div>
          <SectionHeading title="Skills" template={template} inverted={sidebarIsDark} />
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-sm px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: sidebarIsDark ? 'rgba(255,255,255,0.14)' : '#ffffff',
                  color: template.sidebarTextColor,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.languages.length > 0 && (
        <div>
          <SectionHeading title="Languages" template={template} inverted={sidebarIsDark} />
          <ul className="space-y-1 text-[10.5px] opacity-90">
            {data.languages.map((lang) => (
              <li key={lang}>{lang}</li>
            ))}
          </ul>
        </div>
      )}

      {data.certifications.length > 0 && (
        <div>
          <SectionHeading title="Certifications" template={template} inverted={sidebarIsDark} />
          <ul className="space-y-1 text-[10.5px] opacity-90">
            {data.certifications.map((cert) => (
              <li key={cert}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );

  const mainSections = (
    <div className="space-y-4">
      {data.summary.trim() && (
        <section>
          <SectionHeading title="Professional Summary" template={template} />
          <p className="text-[11px] leading-relaxed text-slate-700">{data.summary}</p>
        </section>
      )}

      {data.experiences.length > 0 && (
        <section>
          <SectionHeading title="Work Experience" template={template} />
          <div
            className={
              template.layout === 'timeline'
                ? 'relative space-y-3.5 border-l-2 pl-4'
                : 'space-y-3.5'
            }
            style={
              template.layout === 'timeline'
                ? { borderColor: `${template.accentColor}55` }
                : undefined
            }
          >
            {data.experiences.map((exp) => (
              <div key={exp.id} className="relative">
                {template.layout === 'timeline' && (
                  <span
                    className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: template.accentColor }}
                  />
                )}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[11.5px] font-bold text-slate-900">
                    {exp.role || 'Role Title'}
                    {exp.company ? ` — ${exp.company}` : ''}
                  </p>
                  <span className="text-[10px] font-medium text-slate-600">
                    {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {exp.location && <p className="text-[10px] text-slate-600">{exp.location}</p>}
                {exp.highlights.filter((h) => h.trim()).length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10.5px] leading-snug text-slate-700">
                    {exp.highlights
                      .filter((h) => h.trim())
                      .map((bullet, idx) => (
                        <li key={`${exp.id}-b-${idx}`}>{bullet}</li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.educations.length > 0 && (
        <section>
          <SectionHeading title="Education" template={template} />
          <div className="space-y-2.5">
            {data.educations.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[11.5px] font-bold text-slate-900">
                    {edu.degree || 'Degree'}
                    {edu.school ? ` · ${edu.school}` : ''}
                  </p>
                  <span className="text-[10px] font-medium text-slate-600">
                    {edu.graduationYear}
                  </span>
                </div>
                {(edu.location || edu.details) && (
                  <p className="text-[10.5px] text-slate-700">
                    {[edu.location, edu.details].filter(Boolean).join(' — ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!isSidebarLayout && data.skills.length > 0 && (
        <section>
          <SectionHeading title="Core Skills" template={template} />
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-sm border px-2 py-0.5 text-[10px] font-medium"
                style={{
                  borderColor: `${template.accentColor}44`,
                  backgroundColor: `${template.accentColor}10`,
                  color: template.primaryColor,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {!isSidebarLayout && (data.languages.length > 0 || data.certifications.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.languages.length > 0 && (
            <section>
              <SectionHeading title="Languages" template={template} />
              <p className="text-[10.5px] text-slate-700">{data.languages.join(' · ')}</p>
            </section>
          )}
          {data.certifications.length > 0 && (
            <section>
              <SectionHeading title="Certifications" template={template} />
              <p className="text-[10.5px] text-slate-700">{data.certifications.join(' · ')}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      data-testid="cv-live-preview"
      className={`cv-maker-paper mx-auto w-full max-w-[660px] overflow-hidden rounded-xl border border-slate-300 shadow-sm ${fontClass}`}
      style={{ backgroundColor: template.surfaceColor }}
    >
      {template.layout === 'left-sidebar' && (
        <div className="grid min-h-full grid-cols-[33%_67%]">
          {sidebarContent}
          <div className="p-6">{mainSections}</div>
        </div>
      )}

      {template.layout === 'right-sidebar' && (
        <div className="grid min-h-full grid-cols-[67%_33%]">
          <div className="p-6">{mainSections}</div>
          {sidebarContent}
        </div>
      )}

      {template.layout === 'split-banner' && (
        <div className="flex min-h-full flex-col">
          <header
            className="flex items-center justify-between gap-4 px-6 py-5 text-white"
            style={{ backgroundColor: template.primaryColor }}
          >
            <div>
              <p className="text-xl font-extrabold tracking-tight">
                {data.personal.fullName || 'Your Full Name'}
              </p>
              {data.personal.headline && (
                <p className="mt-1 text-xs font-medium opacity-90">{data.personal.headline}</p>
              )}
              {contactItems.length > 0 && (
                <p className="mt-2 text-[10.5px] opacity-85">{contactItems.join(' | ')}</p>
              )}
            </div>
            <AvatarBox data={data} template={template} darkBg />
          </header>
          <div className="p-6">{mainSections}</div>
        </div>
      )}

      {!isSidebarLayout && template.layout !== 'split-banner' && (
        <div className="p-6">
          <header
            className={`mb-5 flex items-center justify-between gap-4 pb-4 ${
              template.layout === 'editorial-serif' ? 'flex-col text-center' : ''
            }`}
            style={{
              borderBottom: `2px solid ${template.primaryColor}`,
            }}
          >
            <div
              className={
                template.layout === 'monogram-corner' ? 'flex items-center gap-3.5' : undefined
              }
            >
              {template.layout === 'monogram-corner' && (
                <AvatarBox data={data} template={template} />
              )}
              <div>
                <p
                  className="text-xl font-extrabold tracking-tight"
                  style={{ color: template.primaryColor }}
                >
                  {data.personal.fullName || 'Your Full Name'}
                </p>
                {data.personal.headline && (
                  <p
                    className="mt-0.5 text-xs font-semibold"
                    style={{ color: template.accentColor }}
                  >
                    {data.personal.headline}
                  </p>
                )}
                {contactItems.length > 0 && (
                  <p className="mt-1.5 text-[10.5px] text-slate-600">{contactItems.join(' · ')}</p>
                )}
              </div>
            </div>
            {template.layout !== 'monogram-corner' && data.personal.photoDataUrl && (
              <AvatarBox data={data} template={template} />
            )}
          </header>
          {mainSections}
        </div>
      )}
    </div>
  );
}
