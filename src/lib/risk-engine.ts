import crypto from 'crypto';

export interface ConsumerComplaint {
  id: string;
  license_number: string;
  complaint_category: string;
  description: string;
  observed_discrepancy: string;
  contact_number: string;
  email?: string;
  status: string;
  reported_at: string;
}

export interface RiskBreakdown {
  instrument: number;
  overdue: number;
  history: number;
  complaints: number;
}

export interface RiskScoreResult {
  score: number;
  tier: 'LOW' | 'MODERATE' | 'CRITICAL';
  breakdown: RiskBreakdown;
  complaintCount: number;
}

// Global in-memory complaints store for runtime sessions
const globalComplaintsStore = new Map<string, ConsumerComplaint[]>();

// Seed realistic complaints for demonstrations
globalComplaintsStore.set('LMO/2026/10008', [
  {
    id: 'DOCA-CMP-2026-1081',
    license_number: 'LMO/2026/10008',
    complaint_category: 'Short-Weighing / Under-Dispensing',
    description: 'Fuel dispenser nozzle #2 suspected of delivering ~180ml short on 5L test can.',
    observed_discrepancy: '180ml short per 5L',
    contact_number: '+91 98112 00412',
    status: 'ACTIVE',
    reported_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
]);

globalComplaintsStore.set('LMO/2026/10005', [
  {
    id: 'DOCA-CMP-2026-1052',
    license_number: 'LMO/2026/10005',
    complaint_category: 'Broken / Missing Lead Seal',
    description: 'Lead verification seal wire severed on 500kg platform scale in grain yard.',
    observed_discrepancy: 'Severed calibration wire',
    contact_number: '+91 98765 43210',
    status: 'ACTIVE',
    reported_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
]);

export function getComplaintsForLicense(licenseNumber: string): ConsumerComplaint[] {
  const cleanLic = (licenseNumber || '').trim();
  return globalComplaintsStore.get(cleanLic) || [];
}

export function addComplaint(complaint: ConsumerComplaint): void {
  const cleanLic = complaint.license_number.trim();
  const existing = globalComplaintsStore.get(cleanLic) || [];
  existing.push(complaint);
  globalComplaintsStore.set(cleanLic, existing);
}

/**
 * Calculates Statutory Risk Index (SRI) (0-100 score).
 */
export function calculateTraderRiskScore(trader: {
  instrument_type?: string;
  inspection_status?: string;
  status?: string;
  has_failed_history?: boolean;
  reinspection_required?: boolean;
  license_number?: string;
}): RiskScoreResult {
  const breakdown: RiskBreakdown = {
    instrument: 0,
    overdue: 0,
    history: 0,
    complaints: 0,
  };

  const inst = (trader.instrument_type || '').toLowerCase();
  if (inst.includes('weighbridge') || inst.includes('truck')) {
    breakdown.instrument = 30;
  } else if (
    inst.includes('fuel') ||
    inst.includes('petrol') ||
    inst.includes('diesel') ||
    inst.includes('dispenser')
  ) {
    breakdown.instrument = 28;
  } else if (
    inst.includes('gold') ||
    inst.includes('precision') ||
    inst.includes('analytical') ||
    inst.includes('jewel')
  ) {
    breakdown.instrument = 24;
  } else if (inst.includes('platform') || inst.includes('mandi') || inst.includes('grain')) {
    breakdown.instrument = 20;
  } else if (inst.includes('counter') || inst.includes('grocery') || inst.includes('retail')) {
    breakdown.instrument = 12;
  } else {
    breakdown.instrument = 15;
  }

  const status = (trader.inspection_status || trader.status || '').toLowerCase();
  if (status === 'overdue') {
    breakdown.overdue = 30;
  } else if (status.includes('pending')) {
    breakdown.overdue = 25;
  } else if (status.includes('scheduled')) {
    breakdown.overdue = 15;
  } else if (status.includes('failed')) {
    breakdown.overdue = 20;
  } else {
    // Passed / Approved / Verified
    breakdown.overdue = 5;
  }

  if (status.includes('failed') || trader.has_failed_history) {
    breakdown.history = 20;
  } else if (trader.reinspection_required) {
    breakdown.history = 15;
  } else {
    breakdown.history = 0;
  }

  const complaints = trader.license_number ? getComplaintsForLicense(trader.license_number) : [];
  const complaintCount = complaints.length;
  // +10 pts per active complaint, capped at 20
  breakdown.complaints = Math.min(20, complaintCount * 10);

  let score = breakdown.instrument + breakdown.overdue + breakdown.history + breakdown.complaints;
  score = Math.max(0, Math.min(100, score));

  let tier: 'LOW' | 'MODERATE' | 'CRITICAL' = 'LOW';
  if (score >= 70) {
    tier = 'CRITICAL';
  } else if (score >= 40) {
    tier = 'MODERATE';
  }

  return {
    score,
    tier,
    breakdown,
    complaintCount,
  };
}

export function getCanonicalSealInfo(licenseNumber: string) {
  const cleanLic = (licenseNumber || '').trim();
  const canonicalSeal = `SEAL-${cleanLic.replace(/\//g, '-')}-IND`;
  const sealHash = crypto
    .createHash('sha256')
    .update(`${canonicalSeal}|DOCA_METROLOGY_STATUTORY_SECRET_2026`)
    .digest('hex');
  return { canonicalSeal, sealHash };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enrichTraderWithRisk(trader: any): any {
  const riskInfo = calculateTraderRiskScore(trader);
  const sealInfo = getCanonicalSealInfo(trader.license_number);
  return {
    ...trader,
    risk_score: riskInfo.score,
    risk_tier: riskInfo.tier,
    risk_breakdown: riskInfo.breakdown,
    complaints_count: riskInfo.complaintCount,
    canonical_seal_number: sealInfo.canonicalSeal,
    seal_hash: sealInfo.sealHash,
  };
}
