/**
 * Miniature architectural preview card for each of the 30 CV templates.
 * Visually reflects the exact layout archetype, color system, photo frame, and section accents.
 */

import type { CvTemplate } from '../types';

interface TemplateThumbnailProps {
  readonly template: CvTemplate;
}

function PhotoPlaceholder({
  template,
  darkBg = false,
}: {
  template: CvTemplate;
  darkBg?: boolean;
}) {
  const radius =
    template.photoShape === 'circle'
      ? 'rounded-full'
      : template.photoShape === 'rounded'
        ? 'rounded-md'
        : 'rounded-none';

  return (
    <div
      className={`flex h-7 w-7 items-center justify-center border ${radius}`}
      style={{
        borderColor: darkBg ? 'rgba(255,255,255,0.45)' : template.accentColor,
        backgroundColor: darkBg ? 'rgba(255,255,255,0.16)' : `${template.accentColor}22`,
      }}
      aria-hidden="true"
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: darkBg ? '#ffffff' : template.primaryColor, opacity: 0.7 }}
      />
    </div>
  );
}

function BarLines({
  count = 3,
  color = '#cbd5e1',
  accent,
}: {
  count?: number;
  color?: string;
  accent?: string;
}) {
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-9/12'];
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`h-1 rounded-full ${widths[idx % widths.length]}`}
          style={{
            backgroundColor: idx === 0 && accent ? accent : color,
            opacity: idx === 0 && accent ? 0.85 : 0.75,
          }}
        />
      ))}
    </div>
  );
}

export default function TemplateThumbnail({ template }: TemplateThumbnailProps) {
  const isSerif = template.fontStyle === 'serif';
  const headingFont = isSerif ? 'font-serif' : 'font-sans';

  return (
    <div
      className="cv-maker-thumb-paper relative w-full overflow-hidden rounded-lg border border-slate-200 shadow-xs transition-transform duration-200 group-hover:scale-[1.01]"
      style={{ backgroundColor: template.surfaceColor }}
      aria-hidden="true"
    >
      {template.layout === 'left-sidebar' && (
        <div className="grid h-full grid-cols-[34%_66%]">
          <div
            className="flex flex-col gap-2 p-2.5"
            style={{ backgroundColor: template.sidebarColor, color: template.sidebarTextColor }}
          >
            <PhotoPlaceholder template={template} darkBg />
            <div className="h-1.5 w-4/5 rounded-full bg-white/80" />
            <div className="h-1 w-3/5 rounded-full bg-white/50" />
            <div className="mt-1 space-y-1">
              <div
                className="h-1 w-1/2 rounded-full"
                style={{ backgroundColor: template.accentColor }}
              />
              <div className="h-1 w-full rounded-full bg-white/40" />
              <div className="h-1 w-5/6 rounded-full bg-white/40" />
            </div>
            <div className="mt-auto flex flex-wrap gap-1">
              <span className="h-2 w-5 rounded-xs bg-white/25" />
              <span className="h-2 w-6 rounded-xs bg-white/25" />
              <span className="h-2 w-4 rounded-xs bg-white/25" />
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2.5">
            <div
              className={`text-[9px] font-bold leading-tight ${headingFont}`}
              style={{ color: template.primaryColor }}
            >
              ALEXANDER M.
            </div>
            <div
              className="h-0.5 w-8 rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
            <BarLines count={3} />
            <div
              className="mt-0.5 h-1.5 w-1/3 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={3} accent={template.accentColor} />
            <div
              className="mt-0.5 h-1.5 w-1/3 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={2} />
          </div>
        </div>
      )}

      {template.layout === 'right-sidebar' && (
        <div className="grid h-full grid-cols-[65%_35%]">
          <div className="flex flex-col gap-2 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div
                  className={`text-[9px] font-bold leading-tight ${headingFont}`}
                  style={{ color: template.primaryColor }}
                >
                  CLAIRE VANCE
                </div>
                <div
                  className="mt-0.5 h-1 w-12 rounded-full"
                  style={{ backgroundColor: template.accentColor }}
                />
              </div>
            </div>
            <BarLines count={3} />
            <div
              className="mt-0.5 h-1.5 w-2/5 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={3} accent={template.accentColor} />
            <div
              className="mt-0.5 h-1.5 w-2/5 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={2} />
          </div>
          <div
            className="flex flex-col gap-2 p-2.5"
            style={{ backgroundColor: template.sidebarColor, color: template.sidebarTextColor }}
          >
            <PhotoPlaceholder
              template={template}
              darkBg={
                template.sidebarTextColor.startsWith('#f') ||
                template.sidebarTextColor.startsWith('#e')
              }
            />
            <div
              className="h-1 w-2/3 rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
            <BarLines count={3} color={template.sidebarTextColor} />
            <div className="mt-auto space-y-1">
              <div
                className="h-1.5 w-full rounded-xs opacity-30"
                style={{ backgroundColor: template.sidebarTextColor }}
              />
              <div
                className="h-1.5 w-4/5 rounded-xs opacity-30"
                style={{ backgroundColor: template.sidebarTextColor }}
              />
            </div>
          </div>
        </div>
      )}

      {template.layout === 'split-banner' && (
        <div className="flex h-full flex-col">
          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{ backgroundColor: template.primaryColor }}
          >
            <div className="space-y-1">
              <div className={`text-[9px] font-bold leading-none text-white ${headingFont}`}>
                JORDAN REID
              </div>
              <div
                className="h-1 w-14 rounded-full"
                style={{ backgroundColor: template.accentColor }}
              />
            </div>
            <PhotoPlaceholder template={template} darkBg />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2.5">
            <div
              className="h-1.5 w-1/3 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={2} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1.5">
                <div
                  className="h-1.5 w-2/3 rounded-full"
                  style={{ backgroundColor: template.accentColor }}
                />
                <BarLines count={3} />
              </div>
              <div className="space-y-1.5">
                <div
                  className="h-1.5 w-2/3 rounded-full"
                  style={{ backgroundColor: template.accentColor }}
                />
                <BarLines count={3} />
              </div>
            </div>
          </div>
        </div>
      )}

      {template.layout === 'timeline' && (
        <div className="flex h-full flex-col gap-2 p-3">
          <div
            className="flex items-center justify-between border-b pb-2"
            style={{ borderColor: `${template.accentColor}44` }}
          >
            <div>
              <div
                className={`text-[9px] font-bold ${headingFont}`}
                style={{ color: template.primaryColor }}
              >
                ZURICH PROFILE
              </div>
              <div
                className="mt-1 h-1 w-16 rounded-full"
                style={{ backgroundColor: template.accentColor }}
              />
            </div>
            <PhotoPlaceholder template={template} />
          </div>
          <div className="relative flex-1 space-y-2.5 pl-3">
            <div
              className="absolute bottom-1 left-1 top-1 w-0.5 rounded-full"
              style={{ backgroundColor: `${template.accentColor}55` }}
            />
            {[0, 1, 2].map((node) => (
              <div key={node} className="relative space-y-1">
                <span
                  className="absolute -left-[10px] top-0.5 h-2 w-2 rounded-full border border-white"
                  style={{ backgroundColor: template.accentColor }}
                />
                <div
                  className="h-1.5 w-1/2 rounded-full"
                  style={{ backgroundColor: template.primaryColor }}
                />
                <BarLines count={2} />
              </div>
            ))}
          </div>
        </div>
      )}

      {template.layout === 'minimal-swiss' && (
        <div className="flex h-full flex-col gap-2.5 p-3">
          <div className="border-t-4 pt-2" style={{ borderColor: template.primaryColor }}>
            <div
              className={`text-[9px] font-extrabold tracking-tight ${headingFont}`}
              style={{ color: template.primaryColor }}
            >
              HELVETICA GRID
            </div>
            <div
              className="mt-0.5 h-1 w-10 rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
          </div>
          <div className="grid grid-cols-[30%_70%] gap-2">
            <div
              className="h-1.5 w-full rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
            <BarLines count={2} />
          </div>
          <div className="grid grid-cols-[30%_70%] gap-2">
            <div
              className="h-1.5 w-4/5 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={3} />
          </div>
          <div className="grid grid-cols-[30%_70%] gap-2">
            <div
              className="h-1.5 w-4/5 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
            />
            <BarLines count={2} />
          </div>
        </div>
      )}

      {template.layout === 'boxed-grid' && (
        <div className="flex h-full flex-col gap-2 p-2.5">
          <div
            className="flex items-center justify-between rounded-md p-2"
            style={{ backgroundColor: template.sidebarColor }}
          >
            <div className="space-y-1">
              <div
                className={`text-[8.5px] font-bold ${headingFont}`}
                style={{ color: template.primaryColor }}
              >
                BENTO CARD CV
              </div>
              <div
                className="h-1 w-12 rounded-full"
                style={{ backgroundColor: template.accentColor }}
              />
            </div>
            <PhotoPlaceholder template={template} />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            <div className="rounded-md border border-slate-200 bg-white p-1.5">
              <div
                className="mb-1 h-1.5 w-2/3 rounded-full"
                style={{ backgroundColor: template.primaryColor }}
              />
              <BarLines count={3} />
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-1.5">
              <div
                className="mb-1 h-1.5 w-2/3 rounded-full"
                style={{ backgroundColor: template.accentColor }}
              />
              <BarLines count={3} />
            </div>
            <div className="col-span-2 rounded-md border border-slate-200 bg-white p-1.5">
              <div
                className="mb-1 h-1.5 w-1/3 rounded-full"
                style={{ backgroundColor: template.primaryColor }}
              />
              <BarLines count={2} />
            </div>
          </div>
        </div>
      )}

      {template.layout === 'editorial-serif' && (
        <div className="flex h-full flex-col gap-2 p-3 text-center">
          <div className="mx-auto">
            <div
              className={`font-serif text-[9.5px] font-bold tracking-wide ${headingFont}`}
              style={{ color: template.primaryColor }}
            >
              OXFORD SCHOLAR
            </div>
            <div
              className="mx-auto mt-1 h-0.5 w-14"
              style={{ backgroundColor: template.accentColor }}
            />
          </div>
          <div className="space-y-2 text-left">
            <div
              className="border-b pb-0.5 text-[7px] font-bold uppercase tracking-wider"
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
            >
              Summary
            </div>
            <BarLines count={2} />
            <div
              className="border-b pb-0.5 text-[7px] font-bold uppercase tracking-wider"
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
            >
              Experience
            </div>
            <BarLines count={3} />
            <div
              className="border-b pb-0.5 text-[7px] font-bold uppercase tracking-wider"
              style={{ borderColor: template.primaryColor, color: template.primaryColor }}
            >
              Education
            </div>
            <BarLines count={2} />
          </div>
        </div>
      )}

      {template.layout === 'monogram-corner' && (
        <div className="flex h-full flex-col gap-2 p-2.5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 flex-none items-center justify-center rounded-md font-display text-[10px] font-extrabold text-white"
              style={{ backgroundColor: template.primaryColor }}
            >
              AM
            </div>
            <div className="flex-1 space-y-1">
              <div
                className="h-2 w-4/5 rounded-full"
                style={{ backgroundColor: template.primaryColor }}
              />
              <div
                className="h-1 w-3/5 rounded-full"
                style={{ backgroundColor: template.accentColor }}
              />
            </div>
          </div>
          <div className="h-0.5 w-full" style={{ backgroundColor: `${template.accentColor}44` }} />
          <BarLines count={2} />
          <div
            className="h-1.5 w-2/5 rounded-full"
            style={{ backgroundColor: template.primaryColor }}
          />
          <BarLines count={3} accent={template.accentColor} />
          <div className="mt-auto flex gap-1">
            <span
              className="h-2 w-6 rounded-full"
              style={{ backgroundColor: `${template.accentColor}30` }}
            />
            <span
              className="h-2 w-7 rounded-full"
              style={{ backgroundColor: `${template.accentColor}30` }}
            />
          </div>
        </div>
      )}

      {template.layout === 'compact-dense' && (
        <div className="flex h-full flex-col gap-1.5 p-2.5">
          <div
            className="flex items-center justify-between border-b-2 pb-1"
            style={{ borderColor: template.primaryColor }}
          >
            <div className="text-[8.5px] font-bold" style={{ color: template.primaryColor }}>
              COMPACT ATS PRO
            </div>
            <div
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
          </div>
          <BarLines count={2} />
          <div className="grid grid-cols-2 gap-1.5">
            <BarLines count={3} accent={template.primaryColor} />
            <BarLines count={3} accent={template.accentColor} />
          </div>
          <div
            className="h-1 w-1/3 rounded-full"
            style={{ backgroundColor: template.primaryColor }}
          />
          <BarLines count={3} />
        </div>
      )}

      {template.layout === 'classic-top' && (
        <div className="flex h-full flex-col gap-2 p-3">
          <div
            className="flex items-center justify-between border-b pb-1.5"
            style={{ borderColor: template.primaryColor }}
          >
            <div className="space-y-1">
              <div
                className={`text-[9px] font-bold ${headingFont}`}
                style={{ color: template.primaryColor }}
              >
                CLASSIC EXECUTIVE
              </div>
              <div className="h-1 w-16 rounded-full bg-slate-300" />
            </div>
            <PhotoPlaceholder template={template} />
          </div>
          <BarLines count={2} />
          <div
            className="h-1.5 w-1/3 rounded-full"
            style={{ backgroundColor: template.primaryColor }}
          />
          <BarLines count={3} />
          <div
            className="h-1.5 w-1/3 rounded-full"
            style={{ backgroundColor: template.primaryColor }}
          />
          <BarLines count={2} />
        </div>
      )}
    </div>
  );
}
