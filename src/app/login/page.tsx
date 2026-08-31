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
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useMetrologyStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth Sign In with Email & Password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      const userMeta = user?.user_metadata || {};

      // 2. Fetch profile role from Supabase profiles table
      let role: UserRole = (userMeta.role as UserRole) || 'APPLICANT';
      let fullName = userMeta.full_name || email.split('@')[0];

      if (user?.id) {
        const profile = await fetchUserProfile(user.id);
        if (profile) {
          if (profile.role) role = profile.role as UserRole;
          if (profile.full_name) fullName = profile.full_name;
        }
      }

      // 3. Set store current user
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

      // 4. Automatically redirect according to statutory role
      const targetPath = getRedirectPathForRole(role);
      router.push(targetPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
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
          New stakeholder?{' '}
          <Link href="/signup" className="font-bold text-[#002B49] hover:underline">
            Register Account →
          </Link>
        </div>
      </header>

      {/* Main Login Container */}
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
                <span>Single Sign-On Authentication</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Stakeholder Sign In
              </h1>
              <p className="text-xs text-slate-300">
                Access your Legal Metrology inspection and verification dashboard
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    href="/otp-login"
                    className="text-[11px] font-semibold text-indigo-900 hover:underline"
                  >
                    Forgot Password / Login with OTP?
                  </Link>
                </div>
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

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#002B49] hover:bg-[#003B66] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard →'}</span>
                </button>
              </div>
            </form>

            {/* Quick OTP Magic Link Option */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-600">Prefer passwordless authentication?</p>
              <Link
                href="/otp-login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002B49] hover:underline"
              >
                <span>Request One-Time Password (OTP) Magic Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bottom Links */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-800">
                ← Return to Home
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
