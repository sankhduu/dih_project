import React from 'react';
import { Scale } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mandate */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Scale className="w-5 h-5 text-amber-500" />
              <span>Department of Consumer Affairs — Legal Metrology Division</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              National Online Verification & Certification Portal developed under the provisions of the{' '}
              <span className="text-slate-200 font-medium">Legal Metrology Act, 2009</span> and the{' '}
              <span className="text-slate-200 font-medium">Legal Metrology (General) Rules, 2011</span>. Providing digital trust, transparency, and consumer protection across weighing and measuring instruments in commercial and industrial trade.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2">
              <span>National Informatics Centre (NIC) Cloud</span>
              <span>•</span>
              <span>GIGW & WCAG 2.1 AA Compliant</span>
              <span>•</span>
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* Statutory Links */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">Statutory Framework</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Legal Metrology Act, 2009</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Legal Metrology (General) Rules, 2011</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Packaged Commodities Rules, 2011</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">GATC Empanelment Guidelines</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Schedule IX Certificate Formats</a></li>
            </ul>
          </div>

          {/* Citizen Helpline & Assistance */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">National Consumer Helpline</h4>
            <p className="text-slate-300 font-bold text-sm text-amber-400">1800-11-4000 / 1915</p>
            <p className="text-slate-400 text-[11px]">Toll-Free National Helpline (National Consumer Helpline Portal - NCH)</p>
            <div className="pt-2 text-[11px]">
              <p className="text-slate-300">Technical Support Desk:</p>
              <p className="text-slate-400">helpdesk-metrology@doca.gov.in</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Hyperlinking Policy</a>
            <a href="#" className="hover:underline">Security Audit Certificate</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
