'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { MapPin, Building, ShieldCheck, Plus, UserCheck, Phone, Mail } from 'lucide-react';

export function JurisdictionManager() {
  const { jurisdictions } = useMetrologyStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Jurisdiction & Officer Master Mapping</h2>
          <p className="text-xs text-slate-500">
            Define administrative districts, zones, and PIN code clusters mapped to State LMOs and GATCs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jurisdictions.map((jur) => (
          <div
            key={jur.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {jur.id}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">{jur.district}</h3>
                <div className="text-xs text-slate-500 font-medium">{jur.state} • {jur.zone}</div>
              </div>
              <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                <MapPin className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Legal Metrology Officer</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {jur.assignedLmoName}
                </span>
              </div>

              {jur.assignedGatcName && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned GATC Centre</span>
                  <span className="font-semibold text-amber-900">{jur.assignedGatcName}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Office Address</span>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{jur.officeAddress}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Mapped PIN Codes ({jur.pinCodes.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {jur.pinCodes.map((pin) => (
                    <span
                      key={pin}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200"
                    >
                      {pin}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {jur.contactEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {jur.contactPhone}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
