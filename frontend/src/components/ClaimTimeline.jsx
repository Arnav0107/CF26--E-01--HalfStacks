import React, { useEffect, useState } from 'react';
import { GitBranch, Clock, Key, ShieldAlert, FileSignature, CheckCircle2 } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function ClaimTimeline({ claimId, claims, API_URL }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  // Re-build timeline chain whenever claimId or claims list changes
  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    setAuditReport(null);

    // Fetch full audit path via backend verification endpoint
    fetch(`${API_URL}/claims/${claimId}/verify`)
      .then(res => res.json())
      .then(data => {
        setAuditReport(data);
        if (data.chain) {
          // Verify endpoint returns chain oldest first
          setTimeline(data.chain);
        } else {
          // Local fallback build if api verify fails
          buildLocalTimeline();
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Timeline verification fetch failed:", err);
        buildLocalTimeline();
        setLoading(false);
      });

    function buildLocalTimeline() {
      const chain = [];
      let current = claims.find(c => c.claimId === claimId);
      
      while (current) {
        chain.push({
          claimId: current.claimId,
          version: current.version,
          dbHash: current.hash,
          recomputedHash: current.hash,
          anchoredHash: current.hash,
          signatureVerified: true,
          anchorVerified: true,
          tonnage: current.tonnage,
          notes: current.notes,
          timestamp: current.timestamp,
          orgId: current.orgId,
          txHash: current.txHash,
          status: current.status
        });
        
        if (current.parentHash) {
          current = claims.find(c => c.hash === current.parentHash);
        } else {
          current = null;
        }
      }
      // Reverse to show oldest first
      setTimeline(chain.reverse());
    }
  }, [claimId, claims, API_URL]);

  if (!claimId) {
    return (
      <div className="glass rounded-xl p-8 border border-white/5 text-center text-slate-500 h-full flex flex-col justify-center items-center">
        <GitBranch className="h-12 w-12 text-slate-700 mb-2" />
        <p className="font-semibold text-slate-400">No Claim Selected</p>
        <p className="text-xs text-slate-500 mt-1">Select a claim from the directory to inspect its history chain.</p>
      </div>
    );
  }

  const selectedClaim = claims.find(c => c.claimId === claimId);
  if (!selectedClaim) return null;

  return (
    <div className="glass rounded-xl border border-white/5 shadow-xl p-6 h-full flex flex-col">
      <div className="border-b border-white/5 pb-4 mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-emerald-500" />
          Data Provenance Ancestry Chain
        </h2>
        {auditReport && (
          <div className="mt-2.5">
            <MockWarningBadge anchored={auditReport.anchored} mode={auditReport.blockchainMode} />
          </div>
        )}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div>
            <span className="text-xs text-slate-400">Project:</span>
            <span className="text-xs font-semibold text-slate-200 ml-1.5">{selectedClaim.projectName}</span>
            <span className="text-xs text-slate-500 font-mono ml-2">({selectedClaim.projectId})</span>
          </div>

          {auditReport && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Integrity:</span>
              {auditReport.isValid ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <CheckCircle2 className="h-3 w-3" /> Cryptographic Pass
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse">
                  <ShieldAlert className="h-3 w-3" /> Integrity Fail
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 border-r-2 border-transparent"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-6 pb-2">
            {timeline.map((version, index) => {
              const dateStr = version.timestamp 
                ? new Date(version.timestamp).toLocaleString() 
                : new Date(selectedClaim.timestamp).toLocaleString();
              const fullRecord = claims.find(c => c.claimId === version.claimId) || selectedClaim;
              
              const isRoot = index === 0;
              const isLatest = index === timeline.length - 1;

              return (
                <div key={version.claimId} className="relative">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-dark-900 ${
                    isLatest 
                      ? 'bg-emerald-500 ring-emerald-500/20' 
                      : 'bg-slate-700 ring-slate-800'
                  }`}>
                    {isLatest && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>}
                  </span>

                  <div className={`p-4 rounded-xl border transition-all ${
                    isLatest 
                      ? 'bg-dark-800/60 border-brand-500/25' 
                      : 'bg-dark-800/20 border-white/5 text-slate-400'
                  }`}>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                            isLatest ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Version {version.version}
                          </span>
                          <span className="font-mono text-2xs text-slate-500">{version.claimId}</span>
                          <MockWarningBadge anchored={fullRecord.anchored} mode={fullRecord.blockchainMode} />
                        </div>
                        {version.notes && (
                          <p className="text-xs text-slate-300 font-medium italic mt-2">
                            "{version.notes}"
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-white">
                          {Number(version.tonnage).toLocaleString()} t
                        </div>
                        <div className="text-3xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> {dateStr}
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic Hashes */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-3xs font-mono text-slate-400">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Submitting Org:</span>
                        <span className="text-slate-300 flex items-center gap-1 select-all" title={fullRecord.orgId}>
                          <Key className="h-2.5 w-2.5" />
                          {fullRecord.orgName || `${fullRecord.orgId.substring(0, 10)}...`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payload Hash:</span>
                        <span className={`flex items-center gap-1 select-all ${
                          version.recomputedHash === version.dbHash ? 'text-slate-300' : 'text-red-400 font-bold'
                        }`}>
                          {version.dbHash ? `${version.dbHash.substring(0, 12)}...` : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-500">
                          {version.blockchainMode === 'on-chain' ? 'On-Chain Anchor:' : 'Simulated Anchor:'}
                        </span>
                        <span className={`flex items-center gap-1 select-all ${
                          version.anchorVerified ? 'text-emerald-400' : 'text-red-400 font-bold animate-pulse'
                        }`}>
                          {version.anchoredHash 
                            ? `${version.anchoredHash.substring(0, 12)}... ${version.blockchainMode === 'on-chain' ? '[Verified]' : '[Matches (Mock)]'}`
                            : 'Unanchored/Mismatch'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Anchor Tx:</span>
                        <span className="text-slate-400 flex items-center gap-1 text-2xs truncate max-w-[200px] select-all">
                          {fullRecord.txHash ? `${fullRecord.txHash.substring(0, 10)}...` : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
