'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, syncUserProfileToSupabase, getRedirectPathForRole } from '@/lib/supabase-client';
import { useMetrologyStore } from '@/lib/store';
import { UserRole } from '@/types/metrology';
import {
  Scale,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { setCurrentUser } = useMetrologyStore();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Trader' | 'LMO Officer' | 'GATC'>('Trader');

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{
    fullName: string;
    email: string;
    role: string;
    isEmailConfirmationRequired?: boolean;
  } | null>(null);

  // Validate 12-digit Aadhaar (optional, digits only)
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // keep only numbers
    if (rawValue.length <= 12) {
      setAadhaarNumber(rawValue);
    }
  };

  const isAadhaarValid = aadhaarNumber.length === 0 || /^\d{12}$/.test(aadhaarNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full official name.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            aadhaar_number: aadhaarNumber || '123456789012',
            role: selectedRole,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      const user = authData.user;
      const userId = user?.id || `usr_${Date.now()}`;

      // 2. Insert into public profiles table linked to auth UUID
      await syncUserProfileToSupabase({
        id: userId,
        full_name: fullName.trim(),
        aadhaar_number: aadhaarNumber || '123456789012',
        role: selectedRole,
        email: email.trim(),
      });

      // 3. Update local app store session
      const normalizedRole: UserRole =
        selectedRole === 'Trader' ? 'APPLICANT' : selectedRole === 'LMO Officer' ? 'LMO' : 'GATC';

      setCurrentUser({
        id: userId,
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: '+91 98765 43210',
        role: normalizedRole,
        businessName: selectedRole === 'Trader' ? 'Registered Enterprise' : undefined,
        designation: selectedRole === 'LMO Officer' ? 'Legal Metrology Officer' : undefined,
        address: 'National Capital Region',
        district: 'South Delhi',
        state: 'Delhi (NCT)',
        pinCode: '110001',
      });

      const needsConfirmation = !authData.session && user?.identities?.length !== 0;

      setSuccessData({
        fullName: fullName.trim(),
        email: email.trim(),
        role: selectedRole,
        isEmailConfirmationRequired: needsConfirmation,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during registration.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Government Tricolor Top Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-[#FFFFFF]"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Top Simple Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#002B49] text-white flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-extrabold text-base text-[#002B49] tracking-tight">
              e-Māpan <span className="text-amber-600 font-semibold">2.0</span>
            </span>
            <span className="text-[10px] block text-slate-500 font-medium -mt-0.5">
              Department of Consumer Affairs (DoCA)
            </span>
          </div>
        </Link>

        <div className="text-xs text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#002B49] hover:underline">
            Sign In →
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#002B49] text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <ShieldCheck className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                <Sparkles className="w-3 h-3" />
                <span>Single Sign-On Portal</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Create Stakeholder Account
              </h1>
              <p className="text-xs text-slate-300">
                Register for Legal Metrology Verification, Stamping & Inspection Portal
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Official Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar or Insp. Priya Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.in or officer@doca.gov.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password (min 6 characters) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 12-Digit Aadhaar Number with Regex Validation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    12-Digit Aadhaar Number (UIDAI) <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isAadhaarValid
                        ? 'text-emerald-600'
                        : aadhaarNumber.length > 0
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {aadhaarNumber.length}/12 digits
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    maxLength={12}
                    placeholder="Enter 12 digits (e.g. 542189012345)"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                      isAadhaarValid
                        ? 'border-emerald-400 focus:ring-emerald-500'
                        : 'border-slate-200 focus:ring-[#002B49]'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Validated against UIDAI format (12 numeric digits without spaces or hyphens).
                </p>
              </div>

              {/* Stakeholder Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Stakeholder Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as 'Trader' | 'LMO Officer' | 'GATC')
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Trader">Trader / Commercial Enterprise Owner</option>
                    <option value="LMO Officer">LMO Officer (Legal Metrology Inspector)</option>
                    <option value="GATC">Govt. Approved Test Centre (GATC)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#002B49] hover:bg-[#003B66] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'Creating Account...' : 'Complete Registration & Sign Up →'}</span>
                </button>
              </div>
            </form>

            {/* Bottom Links */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <Link href="/otp-login" className="text-slate-600 hover:text-[#002B49] font-medium">
                Login with OTP (Magic Link)
              </Link>
              <Link href="/login" className="text-[#002B49] font-bold hover:underline">
                Existing User? Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Registration Successful!</h3>
            <p className="text-xs text-slate-500">
              Welcome, <strong className="text-slate-800">{successData.fullName}</strong>. Your profile has been linked to the Legal Metrology database as{' '}
              <strong className="text-[#002B49]">{successData.role}</strong>.
            </p>

            {successData.isEmailConfirmationRequired && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs text-left">
                <strong>Note:</strong> If email verification is enabled on your Supabase project, please check your inbox ({successData.email}) to confirm your address.
              </div>
            )}

            <button
              onClick={() => {
                const targetPath = getRedirectPathForRole(successData.role);
                router.push(targetPath);
              }}
              className="w-full py-3 bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Continue to {successData.role === 'LMO' ? 'Officer Queue' : successData.role === 'GATC' ? 'GATC Dashboard' : 'Trader Dashboard'} →
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution • Legal Metrology (e-Māpan 2.0)
      </footer>
    </div>
  );
}
