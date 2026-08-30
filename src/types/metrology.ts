// Legal Metrology Domain Types - Compliance with Legal Metrology Act, 2009 & General Rules, 2011

export type UserRole = 'APPLICANT' | 'LMO' | 'GATC' | 'ADMIN' | 'PUBLIC';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  businessName?: string;
  businessType?: 'RETAIL' | 'MANUFACTURING' | 'HEALTHCARE' | 'LOGISTICS' | 'LABORATORY' | 'AGRICULTURE';
  gstin?: string;
  address: string;
  district: string;
  state: string;
  pinCode: string;
  designation?: string; // For LMO / Admin
  jurisdictionId?: string; // For LMO / GATC
  gatcAccreditationNumber?: string; // For GATC
  gatcValidUntil?: string;
  avatarUrl?: string;
}

export type AccuracyClass = 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IV';

export type InstrumentCategory = 
  | 'NON_AUTOMATIC_WEIGHING'
  | 'AUTOMATIC_WEIGHING'
  | 'WEIGHBRIDGE'
  | 'FUEL_DISPENSER'
  | 'FLOW_METER'
  | 'ELECTRONIC_COUNTER_SCALE'
  | 'PRECISION_LAB_BALANCE'
  | 'PLATFORM_SCALE';

export type InstrumentStatus = 
  | 'ACTIVE_VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'SCHEDULED'
  | 'DEFICIENT'
  | 'EXPIRED'
  | 'DECOMMISSIONED';

export interface Instrument {
  id: string;
  ownerId: string;
  ownerName: string;
  businessName: string;
  category: InstrumentCategory;
  categoryName: string;
  accuracyClass: AccuracyClass;
  make: string;
  model: string;
  serialNumber: string;
  maxCapacity: string; // e.g., "30 kg", "50 Tonnes", "500 g"
  minCapacity: string; // e.g., "100 g", "1 Tonne", "10 mg"
  verificationScaleInterval: string; // 'e', e.g., "5 g", "10 kg", "0.1 mg"
  installationAddress: string;
  district: string;
  state: string;
  pinCode: string;
  geoLat?: number;
  geoLng?: number;
  status: InstrumentStatus;
  lastVerifiedDate?: string;
  currentCertificateId?: string;
  currentCertificateNumber?: string;
  expiryDate?: string;
  daysToExpiry?: number;
  createdAt: string;
}

export type ApplicationType = 
  | 'INITIAL_VERIFICATION'
  | 'PERIODIC_REVERIFICATION'
  | 'VERIFICATION_AFTER_REPAIR';

export type ApplicationStatus = 
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'INSPECTION_IN_PROGRESS'
  | 'APPROVED'
  | 'DEFICIENCY_ISSUED'
  | 'RECTIFIED'
  | 'REJECTED';

export interface Application {
  id: string;
  applicationNumber: string; // e.g. DOCA-APP-2026-0812
  instrumentId: string;
  instrument: Instrument;
  applicantId: string;
  applicant: UserProfile;
  applicationType: ApplicationType;
  jurisdictionId: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedOfficerRole?: 'LMO' | 'GATC';
  assignedAgencyName?: string;
  status: ApplicationStatus;
  submittedAt: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  completedAt?: string;
  rejectionReason?: string;
  remarks?: string;
  feePaidAmount?: number;
  paymentRefNumber?: string;
}

export interface CalibrationObservation {
  testLoad: string; // e.g. "Zero", "15 kg", "30 kg"
  standardWeight: number; // in kg or g
  observedReading: number; // in kg or g
  error: number; // observedReading - standardWeight
  maxPermissibleError: number; // MPE as per rules (e.g. +/- 5g)
  isWithinLimits: boolean;
}

export interface InspectionRecord {
  id: string;
  applicationId: string;
  applicationNumber: string;
  instrumentId: string;
  officerId: string;
  officerName: string;
  officerRole: 'LMO' | 'GATC';
  inspectionDate: string;
  inspectionLocation: string;
  geoLat: number;
  geoLng: number;
  visualInspectionPassed: boolean;
  sealingIntegrityPassed: boolean;
  eccentricityTestPassed: boolean;
  repeatabilityTestPassed: boolean;
  calibrationObservations: CalibrationObservation[];
  overallCalibrationPassed: boolean;
  physicalSealNumber: string;
  photoUrls: {
    instrumentPhoto?: string;
    displayReadingPhoto?: string;
    physicalSealPhoto?: string;
  };
  outcome: 'PASS' | 'FAIL';
  officerNotes: string;
  certificateId?: string;
  deficiencyMemoId?: string;
  isOfflineSync?: boolean;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string; // e.g. IND-LM-2026-98421
  applicationId: string;
  applicationNumber: string;
  instrumentId: string;
  instrument: Instrument;
  ownerId: string;
  ownerName: string;
  businessName: string;
  issuedByOfficerId: string;
  issuedByOfficerName: string;
  issuingAuthority: string; // e.g., "Office of the Assistant Controller, Legal Metrology, South District, Delhi"
  issueDate: string;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED';
  physicalSealNumber: string;
  digitalSignatureHash: string;
  qrPayload: string;
  verificationUrl: string;
  statutoryRuleReference: string; // "Rule 14 of the Legal Metrology (General) Rules, 2011, Schedule IX"
}

export interface DeficiencyMemo {
  id: string;
  memoNumber: string; // e.g. DOCA-DEF-2026-1049
  applicationId: string;
  applicationNumber: string;
  instrumentId: string;
  instrumentName: string;
  ownerId: string;
  ownerName: string;
  businessName: string;
  officerId: string;
  officerName: string;
  issuedDate: string;
  cureDeadline: string; // e.g. 14 days from issue
  reasons: string[];
  observedDiscrepancy: string;
  requiredRectification: string;
  status: 'OPEN' | 'RECTIFIED' | 'EXPIRED';
  rectificationNotes?: string;
  rectificationProofPhoto?: string;
  reInspectionRequested?: boolean;
}

export interface Jurisdiction {
  id: string;
  state: string;
  district: string;
  zone: string;
  pinCodes: string[];
  assignedLmoId: string;
  assignedLmoName: string;
  assignedGatcId?: string;
  assignedGatcName?: string;
  officeAddress: string;
  contactEmail: string;
  contactPhone: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: 'REGISTRATION' | 'APPLICATION_SUBMITTED' | 'SCHEDULED' | 'INSPECTION_RECORDED' | 'CERTIFICATE_ISSUED' | 'DEFICIENCY_ISSUED' | 'CERTIFICATE_REVOKED' | 'JURISDICTION_MODIFIED' | 'PUBLIC_VERIFICATION_LOOKUP';
  entityType: 'USER' | 'INSTRUMENT' | 'APPLICATION' | 'INSPECTION' | 'CERTIFICATE' | 'DEFICIENCY_MEMO';
  entityId: string;
  details: string;
  ipAddress: string;
  metadata?: Record<string, any>;
}

export interface RenewalAlert {
  id: string;
  instrumentId: string;
  instrumentName: string;
  ownerId: string;
  certificateNumber: string;
  expiryDate: string;
  daysRemaining: number;
  alertType: '90_DAYS' | '30_DAYS' | '7_DAYS' | 'EXPIRED';
  sentAt: string;
  status: 'SENT' | 'SEEN' | 'RENEWED';
}
