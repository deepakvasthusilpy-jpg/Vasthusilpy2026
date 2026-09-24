import React from "react";
import { Building2, ShieldCheck, Award, CheckCircle, FileCheck, Users, BarChart, ArrowUpRight } from "lucide-react";

interface CorporateExecutiveShowcaseProps {
  onRequestConsultation?: () => void;
}

export const CorporateExecutiveShowcase: React.FC<CorporateExecutiveShowcaseProps> = ({
  onRequestConsultation
}) => {
  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/50 border border-slate-200 p-6 md:p-8 overflow-hidden shadow-xl text-slate-900">
      {/* Subtle Corporate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,64,175,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,64,175,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative Brand Watermark Ribbon */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Corporate Brand Trust & Executive Assurance */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-xs font-semibold">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>INSTITUTIONAL & CORPORATE ENGINEERING</span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Trustworthy, Reliable & <span className="text-blue-700">Precision Architectural Solutions</span>
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            Delivering gold-standard civil engineering, structural valuation, and traditional Vasthu Vidya compliance backed by rigorous quality benchmarks and transparent cost governance.
          </p>

          {/* Key Enterprise Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">100% Verified</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                KPBR & KMBR statutory compliance certification.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">25+ Years</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Heritage of structural integrity across Kerala.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">SLA Guaranteed</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Timely deliverable milestones and audit accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Executive Corporate Metrics & Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900">EXECUTIVE METRICS</span>
              <p className="text-[11px] text-slate-500">Q3 Audit & Project Performance</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-xs">
              AAA Rating
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Client Approval Rate</span>
                <span className="font-bold text-blue-900">99.4%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: "99.4%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Structural Estimate Precision</span>
                <span className="font-bold text-blue-900">98.9%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 rounded-full" style={{ width: "98.9%" }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Head Consultant: Deepak C</span>
            <span className="font-bold text-blue-700">Vasthusilpy Group</span>
          </div>
        </div>
      </div>
    </div>
  );
};
