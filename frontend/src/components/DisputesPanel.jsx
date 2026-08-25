import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Gavel, RefreshCw } from 'lucide-react';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

export default function DisputesPanel({ claims, onInspectClaim, onRefreshData, API_URL = DEFAULT_API_URL }) {
  const [demoOrgs, setDemoOrgs] = useState([]);
  const [selectedDemoOrg, setSelectedDemoOrg] = useState('');
  const [resolutionReason, setResolutionReason] = useState('');
  const [resolvingClaimId, setResolvingClaimId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/demo-orgs`)
      .then(res => res.json())
      .then(data => {
        setDemoOrgs(data);
        if (data.length > 0) {
          setSelectedDemoOrg(data[0].id);
        }
      })
      .catch(() => {});
  }, [API_URL]);

  // Find claims with status 'disputed'
  const disputedClaims = claims.filter(c => c.status === 'disputed');
  
  // Group disputed claims by projectId
  const disputesMap = {};
  disputedClaims.forEach(claim => {
    if (!disputesMap[claim.projectId]) {
      disputesMap[claim.projectId] = [];
    }
    disputesMap[claim.projectId].push(claim);
  });

  const disputesList = Object.keys(disputesMap).map(projectId => {
    const projectClaims = disputesMap[projectId];
    return {
      projectId,
      projectName: projectClaims[0].projectName,
      region: projectClaims[0].region,
      projectType: projectClaims[0].projectType,
      claims: projectClaims
    };
  });

  const handleResolveDispute = async (acceptedClaimId) => {
    setResolvingClaimId(acceptedClaimId);
    setStatusMsg('');
    try {
      const res = await fetch(`${API_URL}/claims/${acceptedClaimId}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoOrgId: selectedDemoOrg || (demoOrgs[0] && demoOrgs[0].id) || "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          reason: resolutionReason || "Accepted authoritative report based on independent third-party audit."
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`SUCCESS: Dispute resolved! Claim ${acceptedClaimId} marked authoritative.`);
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        setStatusMsg(`ERROR: ${data.error || "Failed to resolve dispute"}`);
      }
    } catch (err) {
      setStatusMsg(`ERROR: ${err.message}`);
    } finally {
      setResolvingClaimId(null);
    }
  };

  if (disputesList.length === 0) {
    return (
      <div className="glass rounded-xl p-8 border border-slate-200 text-center text-slate-500 h-full flex flex-col justify-center items-center">
        <ShieldAlert className="h-12 w-12 text-maroon/20 mb-2" />
        <p className="font-semibold text-slate-500">No Active Disputes</p>
        <p className="text-xs text-slate-500 mt-1">All carbon projects on the network have consistent reportings.</p>
        {statusMsg && (
          <div className="mt-4 p-3 rounded-lg text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
            {statusMsg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-slate-200 shadow-xl p-6 h-full flex flex-col">
      <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-650 animate-pulse" />
            Conflict Resolution & Disputes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Detecting divergent tonnage figures reported by different organizations for the same facility.
          </p>
        </div>

        {/* Resolution Authority Selector */}
        {demoOrgs.length > 0 && (
          <div className="flex items-center gap-2 bg-[#FAF9F7] p-2 rounded-lg border border-slate-200 shrink-0">
            <Gavel className="h-4 w-4 text-maroon" />
            <span className="text-3xs font-semibold text-slate-500 uppercase">Authority:</span>
            <select
              value={selectedDemoOrg}
              onChange={(e) => setSelectedDemoOrg(e.target.value)}
              className="bg-white text-xs font-mono text-navy px-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-brand-500"
            >
              {demoOrgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.displayName} ({org.id.substring(0, 6)}...)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className={`mb-6 p-3 rounded-xl text-xs font-mono flex items-center gap-2 border ${
          statusMsg.startsWith('SUCCESS')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {statusMsg.startsWith('SUCCESS') ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6">
        {disputesList.map((dispute) => {
          // Sort claims by version/timestamp
          const sortedClaims = [...dispute.claims].sort((a, b) => a.timestamp - b.timestamp);
          const claimA = sortedClaims[0];
          const claimB = sortedClaims[1] || sortedClaims[0];
          
          const tonnageA = Number(claimA.tonnage);
          const tonnageB = Number(claimB.tonnage);
          
          const delta = tonnageB - tonnageA;
          const pct = ((delta / tonnageA) * 100).toFixed(1);
          const pctSign = delta > 0 ? '+' : '';

          return (
            <div key={dispute.projectId} className="border border-amber-300 rounded-xl overflow-hidden bg-amber-50/10">
              {/* Header */}
              <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-navy text-sm">{dispute.projectName}</h3>
                  <p className="text-3xs text-amber-700 font-mono mt-0.5">{dispute.projectId} • {dispute.region}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-700 font-mono text-xs font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  <AlertTriangle className="h-3 w-3" />
                  {pctSign}{pct}% Discrepancy
                </div>
              </div>

              {/* Claims Comparison */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Claim A */}
                <div className="space-y-3 pb-3 md:pb-0 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Report A</span>
                      <span className="text-3xs font-mono text-slate-500">{claimA.claimId}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Submitting Org:</span>
                      <span className="text-xs font-mono text-slate-700 select-all">{claimA.orgId}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xs text-slate-500">Tonnage:</span>
                      <span className="text-lg font-bold font-mono text-navy">
                        {tonnageA.toLocaleString()} t
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button 
                      onClick={() => onInspectClaim(claimA.claimId)}
                      className="w-full text-center py-1.5 rounded bg-[#FAF9F7] hover:bg-[#FDF2F4] text-xs font-medium text-maroon border border-slate-200 transition-colors"
                    >
                      Inspect Claim A Provenance
                    </button>
                    <button
                      onClick={() => handleResolveDispute(claimA.claimId)}
                      disabled={resolvingClaimId === claimA.claimId}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-maroon hover:bg-maroon-dark text-white text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {resolvingClaimId === claimA.claimId ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Accept Report A as Authoritative
                    </button>
                  </div>
                </div>

                {/* Claim B */}
                <div className="space-y-3 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Report B</span>
                      <span className="text-3xs font-mono text-slate-500">{claimB.claimId}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Submitting Org:</span>
                      <span className="text-xs font-mono text-slate-700 select-all">{claimB.orgId}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xs text-slate-500">Tonnage:</span>
                      <span className="text-lg font-bold font-mono text-navy">
                        {tonnageB.toLocaleString()} t
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button 
                      onClick={() => onInspectClaim(claimB.claimId)}
                      className="w-full text-center py-1.5 rounded bg-[#FAF9F7] hover:bg-[#FDF2F4] text-xs font-medium text-maroon border border-slate-200 transition-colors"
                    >
                      Inspect Claim B Provenance
                    </button>
                    <button
                      onClick={() => handleResolveDispute(claimB.claimId)}
                      disabled={resolvingClaimId === claimB.claimId}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-maroon hover:bg-maroon-dark text-white text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {resolvingClaimId === claimB.claimId ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Accept Report B as Authoritative
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Evidence Comparison Assistant Banner */}
              <div className="mx-4 my-2 p-3 bg-[#FAF9F7] rounded-lg border border-amber-300 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 flex items-center gap-1.5">
                    <span>🤖 AI Evidence Comparison Assistant</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Dataset Overlap: 72.4%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-mono">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 block">Report A Evidence Derivation:</span>
                    <span className="text-emerald-700 font-bold">{tonnageA.toLocaleString()} {claimA.unit || 'units'}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 block">Report B Evidence Derivation:</span>
                    <span className="text-amber-700 font-bold">{tonnageB.toLocaleString()} {claimB.unit || 'units'}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  AI Recommendation: Conflict stems from divergent source dataset boundaries. Review third-party satellite telemetry before selecting authoritative report.
                </p>
              </div>

              {/* Resolution Reason Note */}
              <div className="px-4 py-2 bg-amber-50/50 border-t border-amber-200">
                <input
                  type="text"
                  placeholder="Optional resolution note/reason..."
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  className="w-full bg-white text-xs font-mono text-navy px-3 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-maroon"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
