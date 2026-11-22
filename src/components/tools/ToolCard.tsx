import { Link } from 'react-router-dom';
import type { AppRoute } from '../../router/route-types';

interface ToolCardProps {
  route: AppRoute;
  variant?: 'default' | 'compact';
}

// ছোট নাম তৈরি করার হেল্পার (যেমন: "Free Image Compressor - Compress JPG..." থেকে শুধু "Image Compressor" নিবে)
function getShortTitle(title: string): string {
  const parts = title.split('-');
  if (parts.length > 1) {
    return parts[1].replace('Compress', '').replace('Resize', '').replace('Merge', '').replace('Split', '').trim() || parts[0].replace('Free ', '').trim();
  }
  return title.replace('Free ', '').trim();
}

export default function ToolCard({ route, variant = 'default' }: ToolCardProps) {
  const isCompact = variant === 'compact';
  const shortTitle = getShortTitle(route.meta.title);

  // টুলের নাম অনুযায়ী সুন্দর রঙ ও ইমোজি আইকন
  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('image')) return { emoji: '🖼️', bg: 'bg-blue-100', text: 'text-blue-600' };
    if (title.toLowerCase().includes('pdf')) return { emoji: '📄', bg: 'bg-red-100', text: 'text-red-600' };
    return { emoji: '⚙️', bg: 'bg-slate-100', text: 'text-slate-600' };
  };

  const icon = getIcon(shortTitle);

  return (
    <Link
      to={route.path}
      className={`group flex flex-col rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-900 hover:shadow-md ${
        isCompact ? 'p-4' : 'p-5'
      }`}
    >
      <div className={`flex items-center justify-center rounded-lg ${icon.bg} ${isCompact ? 'h-10 w-10 text-lg' : 'h-12 w-12 text-2xl'}`}>
        {icon.emoji}
      </div>
      <h3 className={`mt-3 font-semibold text-slate-900 group-hover:text-slate-700 ${isCompact ? 'text-sm' : 'text-base'}`}>
        {shortTitle}
      </h3>
      <p className={`mt-1.5 leading-relaxed text-slate-500 ${isCompact ? 'text-xs line-clamp-2' : 'text-xs line-clamp-3'}`}>
        {route.meta.description}
      </p>
      <span className="mt-auto pt-4 inline-block text-xs font-medium text-slate-900 group-hover:underline">
        Use Tool →
      </span>
    </Link>
  );
}
