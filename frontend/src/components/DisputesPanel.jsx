import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DisputesPanel({ claims, onInspectClaim }) {
  // Group claims by projectId to find disputes (multiple claims for same projectId that aren't parent-child linked or have conflicting numbers)
  const projectGroups = claims.reduce((acc, claim) => {
    if (!acc[claim.projectId]) acc[claim.projectId] = [];
    acc[claim.projectId].push(claim);
    return acc;
  }, {});

  const disputesList = Object.entries(projectGroups)
    .filter(([_, group]) => {
      if (group.length <= 1) return false;
      const uniqueOrgs = new Set(group.map(c => c.orgId));
      const hasDisputedStatus = group.some(c => c.status === 'disputed');
      return uniqueOrgs.size > 1 || hasDisputedStatus;
    })
    .map(([projectId, group]) => ({
      projectId,
      projectName: group[0].projectName,
      region: group[0].region,
      claims: group
    }));

  if (disputesList.length === 0) {
    return (
      <div className="bg-white/95 rounded-2xl p-8 border border-[#E2E8F0] shadow-clean text-center text-[#5E6B8A] h-full flex flex-col justify-center items-center">
        <ShieldAlert className="h-12 w-12 text-[#1677E8]/30 mb-2" />
        <p className="font-semibold text-[#172A63]">No Active Disputes Detected</p>
        <p className="text-xs text-[#5E6B8A] mt-1 font-sans">All carbon projects on the network have consistent verified reporting.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 h-full flex flex-col">
      <div className="border-b border-[#EAF2FC] pb-4 mb-6">
        <h2 className="text-xl font-bold font-sans text-[#172A63] flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500 animate-pulse" />
          Conflict Resolution & Discrepancies
        </h2>
        <p className="text-xs text-[#5E6B8A] mt-0.5 font-sans">
          Automated detection of divergent tonnage figures reported by multiple authorized organizations for the same facility.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {disputesList.map((dispute) => {
          const sortedClaims = [...dispute.claims].sort((a, b) => a.timestamp - b.timestamp);
          const claimA = sortedClaims[0];
          const claimB = sortedClaims[1] || sortedClaims[0];
          
          const tonnageA = Number(claimA.tonnage);
          const tonnageB = Number(claimB.tonnage);
          
          const delta = tonnageB - tonnageA;
          const pct = ((delta / tonnageA) * 100).toFixed(1);
          const pctSign = delta > 0 ? '+' : '';

          return (
            <div key={dispute.projectId} className="border border-amber-200/80 rounded-2xl overflow-hidden bg-amber-50/30">
              {/* Dispute Header */}
              <div className="bg-amber-50 px-5 py-3.5 border-b border-amber-200/80 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-[#172A63] text-sm">{dispute.projectName}</h3>
                  <p className="text-[11px] text-amber-800 font-mono mt-0.5">{dispute.projectId} • {dispute.region}</p>
                </div>
                <div className="flex items-center gap-1.5 text-amber-900 font-mono text-xs font-bold bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                  {pctSign}{pct}% Discrepancy Flagged
                </div>
              </div>

              {/* Claims Side-by-Side Comparison */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 divide-y md:divide-y-0 md:divide-x divide-amber-200/60">
                {/* Claim A */}
                <div className="space-y-3 pb-3 md:pb-0 font-sans">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider">Report A</span>
                    <span className="text-xs font-mono font-bold text-[#7A1028]">{claimA.claimId}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5E6B8A] block">Submitting Org:</span>
                    <span className="text-xs font-mono text-[#172A63] select-all block mt-0.5">{claimA.orgId}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#5E6B8A]">Volume:</span>
                    <span className="text-lg font-bold font-mono text-[#172A63]">
                      {tonnageA.toLocaleString()} tCO2e
                    </span>
                  </div>
                  <button 
                    onClick={() => onInspectClaim(claimA.claimId)}
                    className="w-full text-center py-2 rounded-xl bg-white hover:bg-[#FDF2F4] border border-[#E2E8F0] hover:border-[#7A1028]/40 text-xs font-semibold text-[#7A1028] transition-all flex items-center justify-center gap-1.5"
                  >
                    Inspect Report A Provenance
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Claim B */}
                <div className="space-y-3 pt-3 md:pt-0 md:pl-5 font-sans">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider">Report B</span>
                    <span className="text-xs font-mono font-bold text-[#7A1028]">{claimB.claimId}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#5E6B8A] block">Submitting Org:</span>
                    <span className="text-xs font-mono text-[#172A63] select-all block mt-0.5">{claimB.orgId}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#5E6B8A]">Volume:</span>
                    <span className="text-lg font-bold font-mono text-[#172A63]">
                      {tonnageB.toLocaleString()} tCO2e
                    </span>
                  </div>
                  <button 
                    onClick={() => onInspectClaim(claimB.claimId)}
                    className="w-full text-center py-2 rounded-xl bg-white hover:bg-[#FDF2F4] border border-[#E2E8F0] hover:border-[#7A1028]/40 text-xs font-semibold text-[#7A1028] transition-all flex items-center justify-center gap-1.5"
                  >
                    Inspect Report B Provenance
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
