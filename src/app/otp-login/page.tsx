'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getRedirectPathForRole, fetchUserProfile } from '@/lib/supabase-client';
import { useMetrologyStore } from '@/lib/store';
import { UserRole } from '@/types/metrology';
import {
  Scale,
  ShieldCheck,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function OtpLoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useMetrologyStore();

  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP'>('REQUEST_OTP');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      setStep('VERIFY_OTP');
      setSuccessMsg(`One-Time Password (OTP) / Magic Link has been dispatched to ${email.trim()}. Please enter the 6-digit code below or click the link in your email.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Please check your email and try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit token
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpToken.trim()) {
      setErrorMsg('Please enter the 6-digit OTP code received in your email.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpToken.trim(),
        type: 'email',
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      const userMeta = user?.user_metadata || {};

      let role: UserRole = (userMeta.role as UserRole) || 'APPLICANT';
      let fullName = userMeta.full_name || email.split('@')[0];

      if (user?.id) {
        const profile = await fetchUserProfile(user.id);
        if (profile) {
          if (profile.role) role = profile.role as UserRole;
          if (profile.full_name) fullName = profile.full_name;
        }
      }

      setCurrentUser({
        id: user?.id || `usr_${Date.now()}`,
        fullName: fullName,
        email: email.trim(),
        mobile: '+91 98765 43210',
        role: role,
        businessName: role === 'APPLICANT' ? 'Registered Enterprise' : undefined,
        designation: role === 'LMO' ? 'Legal Metrology Officer' : undefined,
        address: 'National Capital Region',
        district: 'South Delhi',
        state: 'Delhi',
        pinCode: '110001',
      });

      const targetPath = getRedirectPathForRole(role);
      router.push(targetPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP token. Please try again.';
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

      {/* Top Header */}
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
          Prefer password login?{' '}
          <Link href="/login" className="font-bold text-[#002B49] hover:underline">
            Password Sign In →
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#002B49] text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <ShieldCheck className="w-40 h-40 text-white" />
            </div>

            <div className="relative z-10 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                <Sparkles className="w-3 h-3" />
                <span>Passwordless Authentication</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                One-Time Password (OTP) Login
              </h1>
              <p className="text-xs text-slate-300">
                Receive a secure 6-digit login token or instant magic link via Supabase Auth
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-4">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {step === 'REQUEST_OTP' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Enter Registered Email Address <span className="text-rose-500">*</span>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#002B49] hover:bg-[#003B66] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'Sending OTP...' : 'Send One-Time Password →'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Enter 6-Digit OTP Token <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep('REQUEST_OTP')}
                      className="text-[11px] font-semibold text-slate-500 hover:text-[#002B49] underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.trim())}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#002B49] hover:bg-[#003B66] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'Verifying...' : 'Verify OTP & Log In →'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="text-xs text-indigo-900 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP Code</span>
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Links */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                ← Back to Password Login
              </Link>
              <Link href="/signup" className="text-[#002B49] font-bold hover:underline">
                Create New Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution • Legal Metrology (e-Māpan 2.0)
      </footer>
    </div>
  );
}
