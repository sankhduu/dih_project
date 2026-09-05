'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  supabase,
  normalizeUserRole,
  fetchUserProfile,
  syncUserProfileToSupabase,
} from '@/lib/supabase-client';
import { useMetrologyStore } from '@/lib/store';
import { MOCK_USERS } from '@/lib/mock-data';
import {
  Scale,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  Zap,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';

// Demo Credentials Configuration for Hackathon presentations
const DEMO_CREDENTIALS = {
  TRADER: {
    label: 'Demo Trader',
    role: 'Trader' as const,
    email: 'trader@demo.com',
    password: 'password123',
    name: 'Ramesh Kumar (Trader)',
    description: 'Commercial Enterprise / Shop Owner',
    targetRoute: '/trader/dashboard',
    mockUser: MOCK_USERS[0],
  },
  LMO: {
    label: 'Demo LMO',
    role: 'LMO Officer' as const,
    email: 'lmo@demo.com',
    password: 'password123',
    name: 'Shri Rajesh Varma (LMO)',
    description: 'Senior Legal Metrology Officer',
    targetRoute: '/admin/traders',
    mockUser: MOCK_USERS[2],
  },
  GATC: {
    label: 'Demo GATC',
    role: 'GATC' as const,
    email: 'gatc@demo.com',
    password: 'password123',
    name: 'National Test Lab (GATC)',
    description: 'Govt. Approved Testing Centre',
    targetRoute: '/gatc/dashboard',
    mockUser: MOCK_USERS[3],
  },
};

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser } = useMetrologyStore();

  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup Form States
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupRole, setSignupRole] = useState<'Trader' | 'LMO Officer' | 'GATC'>('Trader');

  // Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<{
    fullName: string;
    role: string;
    targetPath: string;
  } | null>(null);

  // Sync mode from URL query parameters (e.g., /login?mode=signup)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setAuthMode('signup');
    } else if (modeParam === 'login') {
      setAuthMode('login');
    }
  }, [searchParams]);

  // Hackathon Demo Auto-Fill Function
  const handleAutoFillDemo = (key: keyof typeof DEMO_CREDENTIALS) => {
    const demo = DEMO_CREDENTIALS[key];
    setAuthMode('login');
    setLoginEmail(demo.email);
    setLoginPassword(demo.password);
    setErrorMsg('');
    setDemoNotice(`Loaded ${demo.label} (${demo.role}) credentials! Click 'Sign In' or hit 1-Click Launch.`);

    setTimeout(() => {
      setDemoNotice(null);
    }, 4000);
  };

  // Instant 1-Click Demo Login for Hackathon presentations
  const handleDirectDemoLogin = async (key: keyof typeof DEMO_CREDENTIALS) => {
    const demo = DEMO_CREDENTIALS[key];
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Try Supabase Auth
      try {
        await supabase.auth.signInWithPassword({
          email: demo.email,
          password: demo.password,
        });
      } catch {
        // Fallback gracefully for demo purposes
      }

      // 2. Set Local User Store Session
      const normalized = normalizeUserRole(demo.role);
      setCurrentUser({
        ...demo.mockUser,
        fullName: demo.name,
        email: demo.email,
        role: normalized.storeRole,
      });

      // 3. Navigate directly to the required statutory dashboard
      router.push(demo.targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error during demo sign in';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  // Handle User Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !loginPassword) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      let roleString = '';
      let userName = cleanEmail.split('@')[0];
      let authUserUUID = `usr_${Date.now()}`;

      // Check if this matches a Demo Account
      const isDemoTrader = cleanEmail === DEMO_CREDENTIALS.TRADER.email;
      const isDemoLMO = cleanEmail === DEMO_CREDENTIALS.LMO.email;
      const isDemoGATC = cleanEmail === DEMO_CREDENTIALS.GATC.email;

      if (isDemoTrader || isDemoLMO || isDemoGATC) {
        const demoConfig = isDemoTrader
          ? DEMO_CREDENTIALS.TRADER
          : isDemoLMO
          ? DEMO_CREDENTIALS.LMO
          : DEMO_CREDENTIALS.GATC;

        // Try Supabase sign in if available
        try {
          const { data } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: loginPassword,
          });
          if (data?.user) {
            authUserUUID = data.user.id;
          }
        } catch {
          // graceful fallback
        }

        const normalized = normalizeUserRole(demoConfig.role);
        setCurrentUser({
          ...demoConfig.mockUser,
          id: authUserUUID,
          fullName: demoConfig.name,
          email: cleanEmail,
          role: normalized.storeRole,
        });

        router.push(demoConfig.targetRoute);
        return;
      }

      // 1. Supabase Auth Sign In with Email & Password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (user) {
        authUserUUID = user.id;
        const meta = user.user_metadata || {};
        if (meta.role) roleString = meta.role;
        if (meta.full_name) userName = meta.full_name;

        // 2. Query 'profiles' table for any statutory profile role override
        const profile = await fetchUserProfile(user.id);
        if (profile) {
          if (profile.role) roleString = String(profile.role);
          if (profile.full_name) userName = profile.full_name;
        }
      }

      // 3. Determine role & target route
      const roleResolution = normalizeUserRole(roleString);

      // 4. Update Application State Store
      setCurrentUser({
        id: authUserUUID,
        fullName: userName,
        email: cleanEmail,
        mobile: '+91 98765 43210',
        role: roleResolution.storeRole,
        businessName: roleResolution.storeRole === 'APPLICANT' ? 'Registered Enterprise' : undefined,
        designation: roleResolution.storeRole === 'LMO' ? 'Legal Metrology Officer' : undefined,
        address: 'National Capital Region',
        district: 'South Delhi',
        state: 'Delhi (NCT)',
        pinCode: '110001',
      });

      // 5. Navigate to appropriate role page
      router.push(roleResolution.redirectPath);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please check your email and password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle User Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = signupFullName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: cleanName,
            role: signupRole,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      const user = authData.user;
      const userId = user?.id || `usr_${Date.now()}`;

      // 2. Sync profile to Supabase 'profiles' table
      await syncUserProfileToSupabase({
        id: userId,
        full_name: cleanName,
        role: signupRole,
        email: cleanEmail,
      });

      // 3. Update local store
      const roleResolution = normalizeUserRole(signupRole);
      setCurrentUser({
        id: userId,
        fullName: cleanName,
        email: cleanEmail,
        mobile: '+91 98765 43210',
        role: roleResolution.storeRole,
        businessName: signupRole === 'Trader' ? 'Registered Commercial Trader' : undefined,
        designation: signupRole === 'LMO Officer' ? 'Legal Metrology Officer' : undefined,
        address: 'National Capital Region',
        district: 'South Delhi',
        state: 'Delhi (NCT)',
        pinCode: '110001',
      });

      // If user got an immediate session, redirect or show success modal
      setRegisteredSuccess({
        fullName: cleanName,
        role: signupRole,
        targetPath: roleResolution.redirectPath,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#002B49] text-white flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-extrabold text-base text-[#002B49] tracking-tight">
              e-Māpan <span className="text-amber-600 font-semibold">2.0</span>
            </span>
            <span className="text-[10px] block text-slate-500 font-medium -mt-0.5">
              Department of Consumer Affairs (DoCA) • Legal Metrology
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/verify/LMO-2026-10001"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public Certificate Verification</span>
          </Link>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#002B49] text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <ShieldCheck className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Statutory Metrology Auth Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {authMode === 'login' ? 'Stakeholder Sign In' : 'Create New Account'}
              </h1>
              <p className="text-xs text-slate-300">
                {authMode === 'login'
                  ? 'Access your verification dashboard, inspection queue, and digital certificates'
                  : 'Register as Trader, LMO Officer, or Govt. Approved Test Centre (GATC)'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="relative z-10 mt-6 grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-white/10 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-white text-[#002B49] shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signup'
                    ? 'bg-white text-[#002B49] shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign Up (Register)</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Demo Credential Loaded Notification */}
            {demoNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
                <Zap className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{demoNotice}</span>
              </div>
            )}

            {/* ----------------- LOGIN VIEW ----------------- */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
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
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="trader@demo.com or officer@doca.gov.in"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <Link
                      href="/otp-login"
                      className="text-[11px] font-semibold text-indigo-900 hover:underline"
                    >
                      Login with OTP / Magic Link?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
            ) : (
              /* ----------------- SIGNUP VIEW ----------------- */
              <form onSubmit={handleSignup} className="space-y-4">
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
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
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
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
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
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Stakeholder Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <select
                      value={signupRole}
                      onChange={(e) =>
                        setSignupRole(e.target.value as 'Trader' | 'LMO Officer' | 'GATC')
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#002B49] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Trader">Trader (Commercial Enterprise / Shop Owner)</option>
                      <option value="LMO Officer">LMO Officer (Legal Metrology Inspector)</option>
                      <option value="GATC">GATC (Govt. Approved Test Centre Lab)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Directs to statutory dashboard: {signupRole === 'Trader' ? '/trader/dashboard' : signupRole === 'LMO Officer' ? '/admin/traders' : '/gatc/dashboard'}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#002B49] hover:bg-[#003B66] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>{loading ? 'Registering Account...' : 'Complete Sign Up & Enter Dashboard →'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ----------------- HACKATHON DEMO FEATURE SECTION ----------------- */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#002B49] text-white shadow-md border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black tracking-wide uppercase text-amber-300">
                    Hackathon 1-Click Demo Logins
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  Jury / Live Demo
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click to instantly auto-fill test credentials and jump directly into each stakeholder&apos;s live statutory portal:
              </p>

              {/* 3 Hackathon Demo Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* Demo Trader Button */}
                <button
                  type="button"
                  onClick={() => handleAutoFillDemo('TRADER')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>Demo Trader</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200">
                      Auto-fill
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono truncate">
                    trader@demo.com
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    → /trader/dashboard
                  </div>
                </button>

                {/* Demo LMO Button */}
                <button
                  type="button"
                  onClick={() => handleAutoFillDemo('LMO')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      <span>Demo LMO</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-400/20 text-blue-200">
                      Auto-fill
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono truncate">
                    lmo@demo.com
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    → /admin/traders
                  </div>
                </button>

                {/* Demo GATC Button */}
                <button
                  type="button"
                  onClick={() => handleAutoFillDemo('GATC')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Demo GATC</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-200">
                      Auto-fill
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono truncate">
                    gatc@demo.com
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    → /gatc/dashboard
                  </div>
                </button>
              </div>

              {/* Instant 1-Click Launch Bar for Presenter */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">⚡ Instant 1-Click Launch:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin('TRADER')}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Launch Trader
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin('LMO')}
                    className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Launch LMO
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDemoLogin('GATC')}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Launch GATC
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-800 font-medium">
                ← Return to Platform Overview
              </Link>
              <Link
                href="/otp-login"
                className="text-[#002B49] font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Passwordless OTP Link</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Registration Success Modal */}
      {registeredSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Registration Complete!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Welcome, <strong className="text-slate-900">{registeredSuccess.fullName}</strong>. Your account has been registered as{' '}
              <strong className="text-[#002B49]">{registeredSuccess.role}</strong>.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push(registeredSuccess.targetPath);
              }}
              className="w-full py-3 bg-[#002B49] hover:bg-[#003B66] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Continue to {registeredSuccess.role} Dashboard →
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-xs font-bold text-slate-500">Loading e-Māpan Auth...</div>
        </div>
      }
    >
      <AuthFormContent />
    </Suspense>
  );
}

