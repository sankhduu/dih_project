import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RotateCw,
  FileCheck,
} from 'lucide-react';
import { ApplicationStatus, InstrumentStatus } from '@/types/metrology';

interface StatusBadgeProps {
  status: ApplicationStatus | InstrumentStatus | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'OPEN' | 'RECTIFIED';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'ACTIVE_VERIFIED':
    case 'APPROVED':
    case 'ACTIVE':
    case 'RECTIFIED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      if (status === 'ACTIVE_VERIFIED') label = 'Verified & Active';
      if (status === 'ACTIVE') label = 'Active Valid';
      break;

    case 'SUBMITTED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = Clock;
      label = 'Submitted';
      break;

    case 'ASSIGNED':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = FileCheck;
      label = 'Officer Assigned';
      break;

    case 'SCHEDULED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      label = 'Inspection Scheduled';
      break;

    case 'INSPECTION_IN_PROGRESS':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      Icon = RotateCw;
      label = 'Inspection in Progress';
      break;

    case 'PENDING_VERIFICATION':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      Icon = Clock;
      label = 'Pending Verification';
      break;

    case 'DEFICIENT':
    case 'DEFICIENCY_ISSUED':
    case 'OPEN':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertTriangle;
      if (status === 'DEFICIENCY_ISSUED') label = 'Deficiency Issued';
      if (status === 'DEFICIENT') label = 'Deficient / Non-compliant';
      break;

    case 'EXPIRED':
      colorClasses = 'bg-red-50 text-red-700 border-red-200';
      Icon = XCircle;
      label = 'Lapsed / Expired';
      break;

    case 'REVOKED':
    case 'REJECTED':
      colorClasses = 'bg-zinc-100 text-zinc-800 border-zinc-300';
      Icon = XCircle;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs ${sizeClasses} ${colorClasses} tracking-tight`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
}
