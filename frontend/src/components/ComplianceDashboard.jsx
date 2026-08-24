import React, { useState, useEffect } from 'react';
import { Award, Download, ShieldCheck, CheckCircle2, AlertCircle, FileCheck, Layers, PieChart, Sparkles, FileText, ArrowUpRight } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

export default function ComplianceDashboard({ claims }) {
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/compliance/summary`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Failed to load compliance summary:", err));
  }, [claims]);

  const handleExportPackage = async () => {
    setExporting(true);
    setExportSuccess(false);
    try {
      const res = await fetch(`${API_URL}/compliance/generate-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportingYear: 2025 })
      });
      const pkgData = await res.json();

      // Trigger browser JSON download
      const blob = new Blob([JSON.stringify(pkgData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GreenProof-Audit-Package-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to export compliance package:", err);
    } finally {
      setExporting(false);
    }
  };

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5 text-maroon animate-spin" /> Evaluating Regulatory Disclosures & CSRD Frameworks...
      </div>
    );
  }

  const { scopeTotals, csrdBreakdown, overallAuditReadinessScore, totalVerifiedClaims, oracleCoveragePercent } = summary;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FAF9F7] via-white to-[#FAF9F7] border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#FDF2F4] border border-maroon/20 text-maroon rounded-xl">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-navy flex items-center gap-2">
                AI Regulatory Compliance Agent
              </h2>
              <p className="text-xs text-slate-500">GHG Protocol Scopes 1–3 & EU CSRD / ESRS E1–E5 Standards Mapping</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto">
          <button
            onClick={handleExportPackage}
            disabled={exporting}
            className="w-full md:w-auto px-6 py-3 bg-maroon hover:bg-maroon-dark text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Compiling Audit Bundle...' : 'Export Audit-Ready Package'}</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between animate-in zoom-in duration-200">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Compliance Package Exported! Downloaded verified JSON audit bundle with on-chain cryptographic proofs.
          </span>
        </div>
      )}

      {/* Audit Readiness Score & Key KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Audit Readiness Score</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{overallAuditReadinessScore}%</span>
            <span className="text-xs text-emerald-700 font-medium">Compliance Pass</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallAuditReadinessScore}%` }}></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Verified Claims</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-navy">{totalVerifiedClaims}</span>
            <span className="text-xs text-slate-500">Claims Audited</span>
          </div>
          <span className="text-xs text-slate-600 block">Active & Resolved Evidence</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Oracle Automation</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-cyan-600">{oracleCoveragePercent}%</span>
            <span className="text-xs text-cyan-700 font-medium">Zero-Human</span>
          </div>
          <span className="text-xs text-slate-600 block">IoT Meter & Satellite Ingest</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">EU CSRD Standard</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-indigo-600">ESRS E1–E5</span>
          </div>
          <span className="text-xs text-slate-600 block">5 Environmental Modules</span>
        </div>
      </div>

      {/* GHG Protocol Scopes 1-3 Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-navy flex items-center gap-2">
          <Layers className="w-5 h-5 text-maroon" /> GHG Protocol Scopes 1–3 Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Scope 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-maroon/40 transition-all shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-extrabold uppercase">
                Scope 1
              </span>
              <span className="text-xs text-slate-500">{scopeTotals['Scope 1'].count} Claims</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Direct Operational Emissions</span>
              <span className="text-2xl font-bold text-navy">{scopeTotals['Scope 1'].totalValue.toLocaleString()}</span>
              <span className="text-xs text-slate-600 block mt-1">Direct fuel combustion, on-site carbon removal & forestry direct.</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Disclosure Readiness</span>
              <span className="font-bold text-emerald-600">96%</span>
            </div>
          </div>

          {/* Scope 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500/40 transition-all shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-cyan-50 text-cyan-600 border border-cyan-200 rounded-lg text-xs font-extrabold uppercase">
                Scope 2
              </span>
              <span className="text-xs text-slate-500">{scopeTotals['Scope 2'].count} Claims</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Purchased Energy & Power</span>
              <span className="text-2xl font-bold text-navy">{scopeTotals['Scope 2'].totalValue.toLocaleString()}</span>
              <span className="text-xs text-slate-600 block mt-1">Purchased electricity, wind/solar power generation & heating/cooling.</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Disclosure Readiness</span>
              <span className="font-bold text-cyan-600">94%</span>
            </div>
          </div>

          {/* Scope 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500/40 transition-all shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-extrabold uppercase">
                Scope 3
              </span>
              <span className="text-xs text-slate-500">{scopeTotals['Scope 3'].count} Claims</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Value Chain & Waste Emissions</span>
              <span className="text-2xl font-bold text-navy">{scopeTotals['Scope 3'].totalValue.toLocaleString()}</span>
              <span className="text-xs text-slate-600 block mt-1">Waste diversion, water recycling, supply chain & product lifecycle.</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Disclosure Readiness</span>
              <span className="font-bold text-indigo-600">91%</span>
            </div>
          </div>

        </div>
      </div>

      {/* EU CSRD / ESRS E1-E5 Readiness Bars */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-navy flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-600" /> EU CSRD / ESRS Standards Readiness
        </h3>

        <div className="space-y-5">
          {Object.entries(csrdBreakdown).map(([code, std]) => (
            <div key={code} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md">
                    {code}
                  </span>
                  <span className="font-semibold text-navy">{std.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-500">{std.count} Evidence Items</span>
                  <span className="font-bold text-emerald-600">{std.completion}% Verified</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${std.completion}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
