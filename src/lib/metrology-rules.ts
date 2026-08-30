import { AccuracyClass, InstrumentCategory } from '@/types/metrology';

/**
 * Maximum Permissible Errors (MPE) on Verification as per
 * Legal Metrology (General) Rules, 2011 (Seventh Schedule).
 */

export interface MPELimit {
  minLoadPercentage: number;
  maxLoadPercentage: number;
  mpeMultiplesOfE: number; // e.g. +/- 0.5e, +/- 1.0e, +/- 1.5e
}

export function getMPELimitsForClass(accuracyClass: AccuracyClass): MPELimit[] {
  switch (accuracyClass) {
    case 'CLASS_I': // Special Precision (e.g. Lab Balance)
      return [
        { minLoadPercentage: 0, maxLoadPercentage: 50000, mpeMultiplesOfE: 0.5 },
        { minLoadPercentage: 50000, maxLoadPercentage: 200000, mpeMultiplesOfE: 1.0 },
        { minLoadPercentage: 200000, maxLoadPercentage: 1000000, mpeMultiplesOfE: 1.5 },
      ];
    case 'CLASS_II': // High Precision (e.g. Gold/Jewellery Scale)
      return [
        { minLoadPercentage: 0, maxLoadPercentage: 5000, mpeMultiplesOfE: 0.5 },
        { minLoadPercentage: 5000, maxLoadPercentage: 20000, mpeMultiplesOfE: 1.0 },
        { minLoadPercentage: 20000, maxLoadPercentage: 100000, mpeMultiplesOfE: 1.5 },
      ];
    case 'CLASS_III': // Medium Precision (Commercial Counter Scale, Platform, Weighbridge)
    default:
      return [
        { minLoadPercentage: 0, maxLoadPercentage: 500, mpeMultiplesOfE: 0.5 },
        { minLoadPercentage: 500, maxLoadPercentage: 2000, mpeMultiplesOfE: 1.0 },
        { minLoadPercentage: 2000, maxLoadPercentage: 10000, mpeMultiplesOfE: 1.5 },
      ];
    case 'CLASS_IV': // Ordinary Precision
      return [
        { minLoadPercentage: 0, maxLoadPercentage: 50, mpeMultiplesOfE: 0.5 },
        { minLoadPercentage: 50, maxLoadPercentage: 200, mpeMultiplesOfE: 1.0 },
        { minLoadPercentage: 200, maxLoadPercentage: 1000, mpeMultiplesOfE: 1.5 },
      ];
  }
}

/**
 * Calculate Maximum Permissible Error (in same unit as test weight)
 */
export function calculateMPE(
  standardWeight: number,
  accuracyClass: AccuracyClass,
  scaleIntervalValue: number // 'e' value in the same unit
): number {
  if (scaleIntervalValue <= 0) scaleIntervalValue = 1;
  const loadInE = standardWeight / scaleIntervalValue;

  if (accuracyClass === 'CLASS_I') {
    if (loadInE <= 50000) return 0.5 * scaleIntervalValue;
    if (loadInE <= 200000) return 1.0 * scaleIntervalValue;
    return 1.5 * scaleIntervalValue;
  } else if (accuracyClass === 'CLASS_II') {
    if (loadInE <= 5000) return 0.5 * scaleIntervalValue;
    if (loadInE <= 20000) return 1.0 * scaleIntervalValue;
    return 1.5 * scaleIntervalValue;
  } else if (accuracyClass === 'CLASS_III') {
    if (loadInE <= 500) return 0.5 * scaleIntervalValue;
    if (loadInE <= 2000) return 1.0 * scaleIntervalValue;
    return 1.5 * scaleIntervalValue;
  } else {
    if (loadInE <= 50) return 0.5 * scaleIntervalValue;
    if (loadInE <= 200) return 1.0 * scaleIntervalValue;
    return 1.5 * scaleIntervalValue;
  }
}

/**
 * Standard validity period under Legal Metrology Rules (in years)
 */
export function getValidityPeriodYears(category: InstrumentCategory): number {
  switch (category) {
    case 'WEIGHBRIDGE':
    case 'FUEL_DISPENSER':
    case 'FLOW_METER':
    case 'AUTOMATIC_WEIGHING':
      return 1; // 12 months for heavy commercial & fuel
    case 'PRECISION_LAB_BALANCE':
    case 'ELECTRONIC_COUNTER_SCALE':
    case 'NON_AUTOMATIC_WEIGHING':
    case 'PLATFORM_SCALE':
    default:
      return 1; // Standard annual re-verification in most states (24 months for some class I/II)
  }
}

export function generateCertificateNumber(stateCode: string = 'DL'): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `IND-LM-${stateCode}-${year}-${randomNum}`;
}

export function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DOCA-APP-${year}-${randomNum}`;
}

export function generateDeficiencyMemoNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DOCA-DEF-${year}-${randomNum}`;
}
