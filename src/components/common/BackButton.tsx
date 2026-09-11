'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  label?: string;
  showLabel?: boolean;
  variant?: 'default' | 'header' | 'icon' | 'dark';
}

export function BackButton({
  className,
  label = 'Back',
  showLabel = true,
  variant = 'default',
}: BackButtonProps) {
  const router = useRouter();

  let defaultStyles = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs';
  if (variant === 'header' || variant === 'dark') {
    defaultStyles += ' bg-white/15 hover:bg-white/25 text-white border border-white/20';
  } else if (variant === 'icon') {
    defaultStyles = 'w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer';
  } else {
    defaultStyles += ' bg-slate-100 hover:bg-slate-200 text-slate-700';
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={className ? `${defaultStyles} ${className}` : defaultStyles}
      title="Go Back"
    >
      <ArrowLeft className="w-4 h-4" />
      {variant !== 'icon' && showLabel && label && <span>{label}</span>}
    </button>
  );
}

export default BackButton;
