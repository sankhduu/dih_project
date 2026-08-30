'use client';

import React, { useState } from 'react';
import { useMetrologyStore } from '@/lib/store';
import { AccuracyClass, InstrumentCategory } from '@/types/metrology';
import { X, Plus, Scale, MapPin, CheckCircle, Info } from 'lucide-react';

interface InstrumentRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InstrumentRegisterModal({ isOpen, onClose, onSuccess }: InstrumentRegisterModalProps) {
  const { registerInstrument, currentUser } = useMetrologyStore();

  const [category, setCategory] = useState<InstrumentCategory>('ELECTRONIC_COUNTER_SCALE');
  const [accuracyClass, setAccuracyClass] = useState<AccuracyClass>('CLASS_III');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('30 kg');
  const [minCapacity, setMinCapacity] = useState('100 g');
  const [verificationScaleInterval, setVerificationScaleInterval] = useState('5 g');
  const [installationAddress, setInstallationAddress] = useState(currentUser.address || '');
  const [district, setDistrict] = useState(currentUser.district || 'South Delhi');
  const [pinCode, setPinCode] = useState(currentUser.pinCode || '110016');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryLabels: Record<InstrumentCategory, string> = {
      ELECTRONIC_COUNTER_SCALE: 'Electronic Counter Scale (Commercial)',
      PLATFORM_SCALE: 'Platform Weighing Scale',
      PRECISION_LAB_BALANCE: 'Precision Analytical Lab Balance',
      WEIGHBRIDGE: 'Heavy Industrial Weighbridge',
      NON_AUTOMATIC_WEIGHING: 'Non-Automatic Weighing Instrument',
      AUTOMATIC_WEIGHING: 'Automatic Gravimetric Filling Scale',
      FUEL_DISPENSER: 'Motor Fuel Dispenser (Petrol/Diesel/CNG)',
      FLOW_METER: 'Industrial Flow Meter',
    };

    registerInstrument({
      category,
      categoryName: categoryLabels[category],
      accuracyClass,
      make,
      model,
      serialNumber,
      maxCapacity,
      minCapacity,
      verificationScaleInterval,
      installationAddress,
      district,
      state: currentUser.state || 'Delhi (NCT)',
      pinCode,
      geoLat: 28.5494,
      geoLng: 77.2001,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-[#002B49] text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Register Weighing / Measuring Instrument</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-slate-800">
          {/* Category & Accuracy Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instrument Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InstrumentCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ELECTRONIC_COUNTER_SCALE">Electronic Counter Scale (Commercial)</option>
                <option value="PLATFORM_SCALE">Platform Weighing Scale</option>
                <option value="PRECISION_LAB_BALANCE">Precision Analytical Lab Balance</option>
                <option value="WEIGHBRIDGE">Heavy Industrial Weighbridge</option>
                <option value="NON_AUTOMATIC_WEIGHING">General Non-Automatic Weighing Scale</option>
                <option value="FUEL_DISPENSER">Fuel Dispenser (Petrol/Diesel)</option>
                <option value="AUTOMATIC_WEIGHING">Automatic Weighing System</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Statutory Accuracy Class *</label>
              <select
                value={accuracyClass}
                onChange={(e) => setAccuracyClass(e.target.value as AccuracyClass)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="CLASS_III">Class III — Medium Accuracy (Commercial & Retail)</option>
                <option value="CLASS_II">Class II — High Accuracy (Jewellery / Bullion)</option>
                <option value="CLASS_I">Class I — Special Precision (Laboratories)</option>
                <option value="CLASS_IV">Class IV — Ordinary Accuracy (Bulk materials)</option>
              </select>
            </div>
          </div>

          {/* Make, Model & Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Manufacturer / Make *</label>
              <input
                type="text"
                required
                placeholder="e.g. Essae, Avery, Mettler"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Model Name / Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. DS-215 POS"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instrument Serial No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. ESS-2026-9901"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Capacities & Interval 'e' */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Capacity (Max) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 30 kg, 50 Tonnes"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Min Capacity (Min) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 100 g, 200 kg"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Scale Interval (e / d) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 5 g, 10 kg, 0.1 mg"
                value={verificationScaleInterval}
                onChange={(e) => setVerificationScaleInterval(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Installation Location & PIN Code */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-700">Installation Address & Jurisdiction Pin Code *</label>
            <input
              type="text"
              required
              placeholder="Full shop / premises address"
              value={installationAddress}
              onChange={(e) => setInstallationAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-600 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">PIN Code (Auto Routes to LMO)</label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#002B49] hover:bg-[#003B66] text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register Instrument</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
