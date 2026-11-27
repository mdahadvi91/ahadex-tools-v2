import { useState } from 'react';

interface ShareToolCardProps {
  readonly title: string;
  readonly path: string;
  readonly summary: string;
}

const ORIGIN = 'https://ahadex.online';

function normalizeShareUrl(routePath: string): string {
  if (routePath === '/') return `${ORIGIN}/`;
  return `${ORIGIN}/${routePath.replace(/^\/+|\/+$/g, '')}/`;
}

export default function ShareToolCard({ title, path, summary }: ShareToolCardProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = normalizeShareUrl(path);
  const shareText = `${title} on AHADEX Tools — ${summary}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `${title} — AHADEX Tools`,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // User dismissed native share sheet.
    }
  };

  const channels = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      ariaLabel: `Share ${title} on WhatsApp`,
    },
    {
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      ariaLabel: `Share ${title} on X / Twitter`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      ariaLabel: `Share ${title} on LinkedIn`,
    },
    {
      label: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(
        `${title} — Free Zero-Upload Browser Tool`,
      )}`,
      ariaLabel: `Share ${title} on Reddit`,
    },
  ];

  return (
    <section
      aria-label={`Share ${title}`}
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold text-slate-900">
            Find this useful? Share {title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Free, watermark-free, and 100% browser-based — share a direct link with teammates or
            friends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-brand-700"
            >
              Share
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-100"
          >
            {copied ? 'Link Copied' : 'Copy Link'}
          </button>

          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={channel.ariaLabel}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:border-slate-300 hover:text-brand-700"
            >
              {channel.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
