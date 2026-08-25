import React, { useEffect, useState } from 'react';
import { GitBranch, Clock, Key, ShieldAlert, FileSignature, CheckCircle2, Loader2 } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function ClaimTimeline({ claimId, claims, API_URL }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [signerVerification, setSignerVerification] = useState({});

  const handleVerifySigner = async (targetClaimId) => {
    setSignerVerification(prev => ({
      ...prev,
      [targetClaimId]: { loading: true }
    }));

    try {
      const res = await fetch(`${API_URL}/claims/${targetClaimId}/verify-signer`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify signer");
      
      setSignerVerification(prev => ({
        ...prev,
        [targetClaimId]: {
          rawSignature: data.rawSignature,
          dataHash: data.dataHash,
          storedOrgAddress: data.storedOrgAddress,
          recoveredOrgAddress: data.recoveredOrgAddress,
          signatureValid: data.signatureValid,
          loading: false
        }
      }));
    } catch (err) {
      console.error(err);
      setSignerVerification(prev => ({
        ...prev,
        [targetClaimId]: {
          rawSignature: "Error",
          dataHash: "Error",
          storedOrgAddress: "Error",
          recoveredOrgAddress: err.message,
          signatureValid: false,
          loading: false
        }
      }));
    }
  };

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    setAuditReport(null);

    fetch(`${API_URL}/claims/${claimId}/verify`)
      .then(res => res.json())
      .then(data => {
        setAuditReport(data);
        if (data.chain) {
          setTimeline(data.chain);
        } else {
          buildLocalTimeline();
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch verify path, building local fallback:", err);
        buildLocalTimeline();
        setLoading(false);
      });
  }, [claimId, claims]);

  const buildLocalTimeline = () => {
    const chain = [];
    let curr = claims.find(c => c.claimId === claimId);
    while (curr) {
      chain.unshift(curr);
      if (!curr.parentClaimId) break;
      curr = claims.find(c => c.claimId === curr.parentClaimId);
    }
    setTimeline(chain);
  };

  if (!claimId) {
    return (
      <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-8 text-center text-[#5E6B8A] h-full flex flex-col justify-center items-center">
        <GitBranch className="h-10 w-10 text-[#8DB7F5] mb-2" />
        <p className="font-semibold text-[#172A63]">No Claim Selected</p>
        <p className="text-xs text-[#5E6B8A] mt-1">Select a claim from the directory to inspect its cryptographic provenance.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#EAF2FC] pb-4 mb-5">
        <h2 className="text-lg font-bold font-sans text-[#172A63] flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-[#1677E8]" />
          Provenance Ancestry Chain
        </h2>
        <p className="text-xs text-[#5E6B8A] mt-0.5 font-sans">
          Historical revision graph with cryptographic signer verification.
        </p>

        {/* Global Audit Status Banner */}
        {auditReport && (
          <div className={`mt-3.5 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            auditReport.isValid 
              ? 'bg-[#EAF2FC] border-[#1677E8]/25 text-[#172A63]' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${auditReport.isValid ? 'text-[#1677E8]' : 'text-red-600'}`} />
              <span className="font-semibold font-sans">
                {auditReport.isValid ? "Cryptographic Chain Verified" : "Chain Integrity Tampered"}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#1677E8]">
              {timeline.length} {timeline.length === 1 ? 'Node' : 'Nodes'}
            </span>
          </div>
        )}
      </div>

      {/* Timeline nodes */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {loading ? (
          <div className="p-8 text-center text-[#5E6B8A]">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1677E8] mb-2" />
            <span className="text-xs font-mono">Tracing blockchain signatures...</span>
          </div>
        ) : timeline.length === 0 ? (
          <div className="p-4 text-xs text-[#5E6B8A] font-mono">No ancestry records found.</div>
        ) : (
          timeline.map((node, index) => {
            const isTarget = node.claimId === claimId;
            const isRoot = index === 0;
            const signerInfo = signerVerification[node.claimId];

            return (
              <div key={node.claimId} className="relative pl-6">
                {/* Vertical connecting line */}
                {index !== timeline.length - 1 && (
                  <div className="absolute left-[9px] top-6 bottom-[-24px] w-[2px] bg-[#E2E8F0]" />
                )}

                {/* Node dot icon */}
                <div className={`absolute left-0 top-1.5 w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                  isTarget 
                    ? 'border-[#7A1028] bg-[#FDF2F4] text-[#7A1028]' 
                    : 'border-[#1677E8] bg-[#EAF2FC] text-[#1677E8]'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isTarget ? 'bg-[#7A1028]' : 'bg-[#1677E8]'}`} />
                </div>

                {/* Node Card Content */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isTarget 
                    ? 'bg-[#FDF2F4]/60 border-[#7A1028]/25 shadow-sm' 
                    : 'bg-white border-[#E2E8F0]'
                }`}>
                  {/* Card Title & Version */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#7A1028]">{node.claimId}</span>
                      <span className="bg-[#FAF9F7] border border-[#E2E8F0] px-2 py-0.5 rounded text-[10px] text-[#172A63] font-mono font-bold">
                        v{node.version}
                      </span>
                      {isRoot && (
                        <span className="bg-[#EAF2FC] text-[#1677E8] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                          Root
                        </span>
                      )}
                    </div>
                    <MockWarningBadge anchored={node.anchored} mode={node.blockchainMode} />
                  </div>

                  {/* Node Metadata Grid */}
                  <div className="space-y-1.5 text-xs text-[#5E6B8A]">
                    <div className="flex justify-between">
                      <span>Reported Volume:</span>
                      <span className="font-mono font-bold text-[#172A63]">{Number(node.tonnage).toLocaleString()} tCO2e</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Publisher:</span>
                      <span className="font-mono text-[11px] text-[#172A63] truncate max-w-[150px]" title={node.orgId}>
                        {node.orgId}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Anchored At:</span>
                      <span className="font-mono text-[11px] text-[#5E6B8A]">
                        {new Date(node.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#EAF2FC]">
                      <span className="text-[10px] uppercase font-bold text-[#5E6B8A] block mb-0.5">Payload Hash (SHA-256)</span>
                      <span className="font-mono text-[10px] text-[#172A63] select-all bg-[#FAF9F7] p-1.5 rounded border border-[#E2E8F0] block truncate">
                        {node.hash}
                      </span>
                    </div>
                  </div>

                  {/* Signer Verify Accordion Action */}
                  <div className="mt-3 pt-2 border-t border-[#EAF2FC] flex items-center justify-between">
                    <button
                      onClick={() => handleVerifySigner(node.claimId)}
                      disabled={signerInfo?.loading}
                      className="text-xs font-semibold font-sans text-[#1677E8] hover:text-[#125EC0] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      {signerInfo ? "Re-verify ECDSA Signer" : "Verify Cryptographic Signer"}
                    </button>
                  </div>

                  {/* Signer Verification Details Box */}
                  {signerInfo && (
                    <div className="mt-3 p-3 bg-[#FAF9F7] border border-[#E2E8F0] rounded-lg text-xs font-mono space-y-1.5">
                      {signerInfo.loading ? (
                        <div className="flex items-center gap-2 text-[#5E6B8A]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1677E8]" />
                          <span>Recovering address from signature bytes...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#5E6B8A] uppercase">Recovered Signer:</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                              signerInfo.signatureValid ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-50 text-red-700'
                            }`}>
                              {signerInfo.signatureValid ? "VALID" : "INVALID / FORGED"}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#172A63] select-all break-all bg-white p-1 rounded border border-[#E2E8F0]">
                            {signerInfo.recoveredOrgAddress}
                          </div>
                          <div className="text-[10px] text-[#5E6B8A]">
                            Stored Signer: <span className="text-[#172A63]">{signerInfo.storedOrgAddress.substring(0, 16)}...</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
