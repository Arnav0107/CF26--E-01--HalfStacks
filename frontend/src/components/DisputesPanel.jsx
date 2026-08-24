import React from 'react';
import { ShieldAlert, Users, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DisputesPanel({ claims, onInspectClaim }) {
  // Find projects that have disputes (claims with status 'disputed')
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

  if (disputesList.length === 0) {
    return (
      <div className="glass rounded-xl p-8 border border-white/5 text-center text-slate-500 h-full flex flex-col justify-center items-center">
        <ShieldAlert className="h-12 w-12 text-emerald-500/30 mb-2" />
        <p className="font-semibold text-slate-400">No Active Disputes</p>
        <p className="text-xs text-slate-500 mt-1">All carbon projects on the network have consistent reportings.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-white/5 shadow-xl p-6 h-full flex flex-col">
      <div className="border-b border-white/5 pb-4 mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500 animate-pulse" />
          Conflict Resolution & Disputes
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Detecting divergent tonnage figures reported by different organizations for the same facility.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {disputesList.map((dispute) => {
          // Sort claims by version/timestamp
          const sortedClaims = [...dispute.claims].sort((a, b) => a.timestamp - b.timestamp);
          const claimA = sortedClaims[0];
          const claimB = sortedClaims[1] || sortedClaims[0]; // fallback if only 1 claim (though backend groups >1)
          
          const tonnageA = Number(claimA.tonnage);
          const tonnageB = Number(claimB.tonnage);
          
          const delta = tonnageB - tonnageA;
          const pct = ((delta / tonnageA) * 100).toFixed(1);
          const pctSign = delta > 0 ? '+' : '';

          return (
            <div key={dispute.projectId} className="border border-amber-500/20 rounded-xl overflow-hidden bg-amber-500/5">
              {/* Header */}
              <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{dispute.projectName}</h3>
                  <p className="text-3xs text-amber-300 font-mono mt-0.5">{dispute.projectId} • {dispute.region}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-mono text-xs font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  {pctSign}{pct}% Discrepancy
                </div>
              </div>

              {/* Claims Comparison */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {/* Claim A */}
                <div className="space-y-3 pb-3 md:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Report A</span>
                    <span className="text-3xs font-mono text-slate-500">{claimA.claimId}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">Submitting Org:</span>
                    <span className="text-xs font-mono text-slate-300 select-all">{claimA.orgId}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xs text-slate-500">Tonnage:</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {tonnageA.toLocaleString()} t
                    </span>
                  </div>
                  <button 
                    onClick={() => onInspectClaim(claimA.claimId)}
                    className="w-full text-center py-1.5 rounded bg-dark-700 hover:bg-dark-600 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Inspect Claim A Provenance
                  </button>
                </div>

                {/* Claim B */}
                <div className="space-y-3 pt-3 md:pt-0 md:pl-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Report B</span>
                    <span className="text-3xs font-mono text-slate-500">{claimB.claimId}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">Submitting Org:</span>
                    <span className="text-xs font-mono text-slate-300 select-all">{claimB.orgId}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xs text-slate-500">Tonnage:</span>
                    <span className="text-lg font-bold font-mono text-white">
                      {tonnageB.toLocaleString()} t
                    </span>
                  </div>
                  <button 
                    onClick={() => onInspectClaim(claimB.claimId)}
                    className="w-full text-center py-1.5 rounded bg-dark-700 hover:bg-dark-600 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Inspect Claim B Provenance
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
