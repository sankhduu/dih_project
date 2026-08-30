'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  Instrument,
  Application,
  Certificate,
  DeficiencyMemo,
  Jurisdiction,
  AuditLogEntry,
  RenewalAlert,
  InspectionRecord,
} from '@/types/metrology';
import {
  MOCK_USERS,
  MOCK_INSTRUMENTS,
  MOCK_APPLICATIONS,
  MOCK_CERTIFICATES,
  MOCK_DEFICIENCY_MEMOS,
  MOCK_JURISDICTIONS,
  MOCK_AUDIT_LOGS,
  MOCK_RENEWAL_ALERTS,
} from './mock-data';
import {
  generateApplicationNumber,
  generateCertificateNumber,
  generateDeficiencyMemoNumber,
  getValidityPeriodYears,
} from './metrology-rules';
import { generateCertificateHash } from './crypto-utils';

interface MetrologyStoreContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: UserProfile[];

  // Data Collections
  instruments: Instrument[];
  applications: Application[];
  certificates: Certificate[];
  deficiencyMemos: DeficiencyMemo[];
  jurisdictions: Jurisdiction[];
  auditLogs: AuditLogEntry[];
  renewalAlerts: RenewalAlert[];
  offlineDrafts: InspectionRecord[];
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;

  // Actions
  registerInstrument: (data: Partial<Instrument>) => Instrument;
  submitApplication: (data: {
    instrumentId: string;
    applicationType: Application['applicationType'];
    remarks?: string;
  }) => Application;
  scheduleInspection: (applicationId: string, date: string, timeSlot: string) => void;
  recordInspectionAndIssueCertificate: (inspection: Omit<InspectionRecord, 'id' | 'createdAt'>) => {
    inspection: InspectionRecord;
    certificate?: Certificate;
    deficiencyMemo?: DeficiencyMemo;
  };
  resolveDeficiencyMemo: (memoId: string, notes: string, proofUrl?: string) => void;
  syncOfflineDrafts: () => void;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress'>) => void;
  verifyCertificatePublicly: (query: string) => Certificate | null;
  resetToDefaultData: () => void;
}

const MetrologyStoreContext = createContext<MetrologyStoreContextType | undefined>(undefined);

export function MetrologyStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]); // Default to Applicant Ramesh
  const [instruments, setInstruments] = useState<Instrument[]>(MOCK_INSTRUMENTS);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [certificates, setCertificates] = useState<Certificate[]>(MOCK_CERTIFICATES);
  const [deficiencyMemos, setDeficiencyMemos] = useState<DeficiencyMemo[]>(MOCK_DEFICIENCY_MEMOS);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>(MOCK_JURISDICTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [renewalAlerts, setRenewalAlerts] = useState<RenewalAlert[]>(MOCK_RENEWAL_ALERTS);
  const [offlineDrafts, setOfflineDrafts] = useState<InspectionRecord[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('eMaap_currentUser');
      const savedInst = localStorage.getItem('eMaap_instruments');
      const savedApps = localStorage.getItem('eMaap_applications');
      const savedCerts = localStorage.getItem('eMaap_certificates');
      const savedMemos = localStorage.getItem('eMaap_memos');
      const savedLogs = localStorage.getItem('eMaap_auditLogs');
      const savedDrafts = localStorage.getItem('eMaap_offlineDrafts');

      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      if (savedInst) setInstruments(JSON.parse(savedInst));
      if (savedApps) setApplications(JSON.parse(savedApps));
      if (savedCerts) setCertificates(JSON.parse(savedCerts));
      if (savedMemos) setDeficiencyMemos(JSON.parse(savedMemos));
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
      if (savedDrafts) setOfflineDrafts(JSON.parse(savedDrafts));
    } catch (e) {
      console.warn('LocalStorage error, using seed defaults', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state updates
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('eMaap_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('eMaap_instruments', JSON.stringify(instruments));
      localStorage.setItem('eMaap_applications', JSON.stringify(applications));
      localStorage.setItem('eMaap_certificates', JSON.stringify(certificates));
      localStorage.setItem('eMaap_memos', JSON.stringify(deficiencyMemos));
      localStorage.setItem('eMaap_auditLogs', JSON.stringify(auditLogs));
      localStorage.setItem('eMaap_offlineDrafts', JSON.stringify(offlineDrafts));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }, [currentUser, instruments, applications, certificates, deficiencyMemos, auditLogs, offlineDrafts, isLoaded]);

  const switchRole = (role: UserRole) => {
    const targetUser = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    setCurrentUser(targetUser);
    addAuditLog({
      actorId: targetUser.id,
      actorName: targetUser.fullName,
      actorRole: role,
      action: 'REGISTRATION',
      entityType: 'USER',
      entityId: targetUser.id,
      details: `Switched active session to persona ${targetUser.fullName} (${role})`,
    });
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress'>) => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '164.100.24.89 (National NIC Gateway)',
      ...entry,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const registerInstrument = (data: Partial<Instrument>): Instrument => {
    const newInstrument: Instrument = {
      id: `INST-${Date.now()}`,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      businessName: currentUser.businessName || 'Trading Enterprise',
      category: data.category || 'ELECTRONIC_COUNTER_SCALE',
      categoryName: data.categoryName || 'Commercial Weighing Instrument',
      accuracyClass: data.accuracyClass || 'CLASS_III',
      make: data.make || 'Standard Metrology Inc.',
      model: data.model || 'Model-2026',
      serialNumber: data.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      maxCapacity: data.maxCapacity || '30 kg',
      minCapacity: data.minCapacity || '100 g',
      verificationScaleInterval: data.verificationScaleInterval || '5 g',
      installationAddress: data.installationAddress || currentUser.address,
      district: data.district || currentUser.district,
      state: data.state || currentUser.state,
      pinCode: data.pinCode || currentUser.pinCode,
      geoLat: data.geoLat || 28.5494,
      geoLng: data.geoLng || 77.2001,
      status: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setInstruments((prev) => [newInstrument, ...prev]);

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'REGISTRATION',
      entityType: 'INSTRUMENT',
      entityId: newInstrument.id,
      details: `Registered new instrument ${newInstrument.categoryName} (SN: ${newInstrument.serialNumber})`,
    });

    return newInstrument;
  };

  const submitApplication = (data: {
    instrumentId: string;
    applicationType: Application['applicationType'];
    remarks?: string;
  }): Application => {
    const targetInst = instruments.find((i) => i.id === data.instrumentId);
    if (!targetInst) throw new Error('Instrument not found');

    // Auto-route by PIN code to jurisdiction
    const matchedJur = jurisdictions.find((j) => j.pinCodes.includes(targetInst.pinCode)) || jurisdictions[0];

    const newApp: Application = {
      id: `APP-${Date.now()}`,
      applicationNumber: generateApplicationNumber(),
      instrumentId: targetInst.id,
      instrument: targetInst,
      applicantId: currentUser.id,
      applicant: currentUser,
      applicationType: data.applicationType,
      jurisdictionId: matchedJur.id,
      assignedOfficerId: matchedJur.assignedLmoId,
      assignedOfficerName: matchedJur.assignedLmoName,
      assignedOfficerRole: 'LMO',
      assignedAgencyName: matchedJur.officeAddress,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      remarks: data.remarks,
      feePaidAmount: data.applicationType === 'INITIAL_VERIFICATION' ? 500 : 350,
      paymentRefNumber: `PAY-DOCA-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setApplications((prev) => [newApp, ...prev]);

    // Update instrument status
    setInstruments((prev) =>
      prev.map((inst) =>
        inst.id === targetInst.id ? { ...inst, status: 'PENDING_VERIFICATION' } : inst
      )
    );

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: newApp.id,
      details: `Submitted ${data.applicationType} application (${newApp.applicationNumber}) for ${targetInst.categoryName}`,
    });

    return newApp;
  };

  const scheduleInspection = (applicationId: string, date: string, timeSlot: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          return {
            ...app,
            status: 'SCHEDULED',
            scheduledDate: date,
            scheduledTimeSlot: timeSlot,
          };
        }
        return app;
      })
    );

    const app = applications.find((a) => a.id === applicationId);
    if (app) {
      setInstruments((prev) =>
        prev.map((inst) =>
          inst.id === app.instrumentId ? { ...inst, status: 'SCHEDULED' } : inst
        )
      );

      addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        action: 'SCHEDULED',
        entityType: 'APPLICATION',
        entityId: applicationId,
        details: `Scheduled field inspection for ${date} (${timeSlot})`,
      });
    }
  };

  const recordInspectionAndIssueCertificate = (
    inspectionData: Omit<InspectionRecord, 'id' | 'createdAt'>
  ) => {
    const inspectionId = `INSP-${Date.now()}`;
    const newInspection: InspectionRecord = {
      ...inspectionData,
      id: inspectionId,
      createdAt: new Date().toISOString(),
      isOfflineSync: isOfflineMode,
    };

    // If in offline mode, add to drafts and return
    if (isOfflineMode) {
      setOfflineDrafts((prev) => [newInspection, ...prev]);
      return { inspection: newInspection };
    }

    const app = applications.find((a) => a.id === inspectionData.applicationId);
    const targetInst = instruments.find((i) => i.id === inspectionData.instrumentId);

    if (inspectionData.outcome === 'PASS') {
      const today = new Date().toISOString().split('T')[0];
      const validYears = targetInst ? getValidityPeriodYears(targetInst.category) : 1;
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + validYears);
      const validUntil = expiry.toISOString().split('T')[0];

      const certNumber = generateCertificateNumber('DL');
      const hash = generateCertificateHash({
        certificateNumber: certNumber,
        instrumentSerialNumber: targetInst?.serialNumber || 'SN-UNKNOWN',
        maxCapacity: targetInst?.maxCapacity || '30kg',
        issueDate: today,
        validUntil: validUntil,
        officerId: inspectionData.officerId,
        physicalSealNumber: inspectionData.physicalSealNumber,
      });

      const newCert: Certificate = {
        id: `CERT-${Date.now()}`,
        certificateNumber: certNumber,
        applicationId: inspectionData.applicationId,
        applicationNumber: inspectionData.applicationNumber,
        instrumentId: inspectionData.instrumentId,
        instrument: targetInst || (MOCK_INSTRUMENTS[0]),
        ownerId: targetInst?.ownerId || 'USR-APP-001',
        ownerName: targetInst?.ownerName || 'Commercial Owner',
        businessName: targetInst?.businessName || 'Business Enterprise',
        issuedByOfficerId: inspectionData.officerId,
        issuedByOfficerName: inspectionData.officerName,
        issuingAuthority: `Office of the Legal Metrology Officer, ${targetInst?.district || 'Central District'}, ${targetInst?.state || 'Delhi'}`,
        issueDate: today,
        validFrom: today,
        validUntil: validUntil,
        status: 'ACTIVE',
        physicalSealNumber: inspectionData.physicalSealNumber,
        digitalSignatureHash: hash,
        qrPayload: `https://doca.gov.in/verify/${certNumber}`,
        verificationUrl: `/verify/${certNumber}`,
        statutoryRuleReference: 'Rule 14 of the Legal Metrology (General) Rules, 2011, Schedule IX (Form V)',
      };

      setCertificates((prev) => [newCert, ...prev]);

      // Update Application & Instrument
      setApplications((prev) =>
        prev.map((a) =>
          a.id === inspectionData.applicationId
            ? { ...a, status: 'APPROVED', completedAt: new Date().toISOString() }
            : a
        )
      );

      setInstruments((prev) =>
        prev.map((inst) =>
          inst.id === inspectionData.instrumentId
            ? {
                ...inst,
                status: 'ACTIVE_VERIFIED',
                lastVerifiedDate: today,
                currentCertificateId: newCert.id,
                currentCertificateNumber: newCert.certificateNumber,
                expiryDate: validUntil,
                daysToExpiry: validYears * 365,
              }
            : inst
        )
      );

      addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        action: 'CERTIFICATE_ISSUED',
        entityType: 'CERTIFICATE',
        entityId: newCert.id,
        details: `Passed inspection & issued Certificate ${certNumber} (Physical Seal: ${inspectionData.physicalSealNumber})`,
      });

      return { inspection: newInspection, certificate: newCert };
    } else {
      // Issue Deficiency Memo on FAIL
      const memoNumber = generateDeficiencyMemoNumber();
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14); // 14 days cure window
      const cureDeadline = deadline.toISOString().split('T')[0];

      const newMemo: DeficiencyMemo = {
        id: `DEF-${Date.now()}`,
        memoNumber: memoNumber,
        applicationId: inspectionData.applicationId,
        applicationNumber: inspectionData.applicationNumber,
        instrumentId: inspectionData.instrumentId,
        instrumentName: targetInst?.categoryName || 'Weighing Instrument',
        ownerId: targetInst?.ownerId || 'USR-APP-001',
        ownerName: targetInst?.ownerName || 'Commercial Owner',
        businessName: targetInst?.businessName || 'Business Enterprise',
        officerId: inspectionData.officerId,
        officerName: inspectionData.officerName,
        issuedDate: new Date().toISOString().split('T')[0],
        cureDeadline: cureDeadline,
        reasons: [
          'Observed errors exceed Maximum Permissible Error (MPE) tolerances under Schedule VII.',
          'Physical lead/hologram security seal tampered or missing.',
        ],
        observedDiscrepancy: inspectionData.officerNotes || 'Significant calibration deviation observed under standard test weights.',
        requiredRectification: 'Rectify calibration through an authorized Legal Metrology repairer and resubmit verification application within 14 calendar days.',
        status: 'OPEN',
      };

      setDeficiencyMemos((prev) => [newMemo, ...prev]);

      setApplications((prev) =>
        prev.map((a) =>
          a.id === inspectionData.applicationId
            ? { ...a, status: 'DEFICIENCY_ISSUED', completedAt: new Date().toISOString(), remarks: newMemo.observedDiscrepancy }
            : a
        )
      );

      setInstruments((prev) =>
        prev.map((inst) =>
          inst.id === inspectionData.instrumentId ? { ...inst, status: 'DEFICIENT' } : inst
        )
      );

      addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        action: 'DEFICIENCY_ISSUED',
        entityType: 'DEFICIENCY_MEMO',
        entityId: newMemo.id,
        details: `Issued Deficiency Memo ${memoNumber} due to failed calibration check`,
      });

      return { inspection: newInspection, deficiencyMemo: newMemo };
    }
  };

  const resolveDeficiencyMemo = (memoId: string, notes: string, proofUrl?: string) => {
    setDeficiencyMemos((prev) =>
      prev.map((m) =>
        m.id === memoId
          ? {
              ...m,
              status: 'RECTIFIED',
              rectificationNotes: notes,
              rectificationProofPhoto: proofUrl,
              reInspectionRequested: true,
            }
          : m
      )
    );

    const memo = deficiencyMemos.find((m) => m.id === memoId);
    if (memo) {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === memo.applicationId ? { ...a, status: 'RECTIFIED', remarks: `Rectification submitted: ${notes}` } : a
        )
      );

      addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'DEFICIENCY_MEMO',
        entityId: memoId,
        details: `Submitted rectification proof for Deficiency Memo ${memo.memoNumber}`,
      });
    }
  };

  const syncOfflineDrafts = () => {
    if (offlineDrafts.length === 0) return;
    offlineDrafts.forEach((draft) => {
      recordInspectionAndIssueCertificate(draft);
    });
    setOfflineDrafts([]);
    setIsOfflineMode(false);
  };

  const verifyCertificatePublicly = (query: string): Certificate | null => {
    const cleanQuery = query.trim().toUpperCase();
    const cert = certificates.find(
      (c) =>
        c.certificateNumber.toUpperCase() === cleanQuery ||
        c.id.toUpperCase() === cleanQuery ||
        c.instrument.serialNumber.toUpperCase() === cleanQuery
    );

    addAuditLog({
      actorId: 'ANONYMOUS_PUBLIC',
      actorName: 'Citizen / Consumer Verification Lookup',
      actorRole: 'PUBLIC',
      action: 'PUBLIC_VERIFICATION_LOOKUP',
      entityType: 'CERTIFICATE',
      entityId: cleanQuery,
      details: cert
        ? `Public QR/Cert lookup successful: ${cert.certificateNumber} (${cert.status})`
        : `Public lookup attempted for query '${cleanQuery}' - NOT FOUND`,
    });

    return cert || null;
  };

  const resetToDefaultData = () => {
    setCurrentUser(MOCK_USERS[0]);
    setInstruments(MOCK_INSTRUMENTS);
    setApplications(MOCK_APPLICATIONS);
    setCertificates(MOCK_CERTIFICATES);
    setDeficiencyMemos(MOCK_DEFICIENCY_MEMOS);
    setJurisdictions(MOCK_JURISDICTIONS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setRenewalAlerts(MOCK_RENEWAL_ALERTS);
    setOfflineDrafts([]);
    localStorage.clear();
  };

  return (
    <MetrologyStoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        availableUsers: MOCK_USERS,
        instruments,
        applications,
        certificates,
        deficiencyMemos,
        jurisdictions,
        auditLogs,
        renewalAlerts,
        offlineDrafts,
        isOfflineMode,
        setIsOfflineMode,
        registerInstrument,
        submitApplication,
        scheduleInspection,
        recordInspectionAndIssueCertificate,
        resolveDeficiencyMemo,
        syncOfflineDrafts,
        addAuditLog,
        verifyCertificatePublicly,
        resetToDefaultData,
      }}
    >
      {children}
    </MetrologyStoreContext.Provider>
  );
}

export function useMetrologyStore() {
  const context = useContext(MetrologyStoreContext);
  if (!context) {
    throw new Error('useMetrologyStore must be used within a MetrologyStoreProvider');
  }
  return context;
}
