import React, { useState } from 'react';
import { Trash2, CheckCircle2, Play, AlertOctagon, HardDrive, RefreshCw, ShieldAlert } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function TamperLab({ claims, onRefreshData, API_URL }) {
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [tamperTonnage, setTamperTonnage] = useState('');
  const [tampering, setTampering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyReport, setVerifyReport] = useState(null);
  const [sigTamperReport, setSigTamperReport] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [tamperMode, setTamperMode] = useState('data'); // 'data' | 'signature'

  const activeClaims = claims.filter(c => c.status === 'active' || c.status === 'disputed');
  const selectedClaim = claims.find(c => c.claimId === selectedClaimId);

  const handleTamper = async () => {
    if (!selectedClaimId || !tamperTonnage) return;
    setTampering(true);
    setVerifyReport(null);
    setSigTamperReport(null);
    setStatusMsg('');

    try {
      const response = await fetch(`${API_URL}/claims/${selectedClaimId}/tamper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tonnage: Number(tamperTonnage) })
      });

      if (response.ok) {
        setStatusMsg(`SUCCESS: Mutated ${selectedClaimId} database row. Tonnage updated in DB to ${tamperTonnage} tons.`);
        onRefreshData();
      } else {
        const err = await response.json();
        setStatusMsg(`ERROR: ${err.error || 'Failed to tamper database'}`);
      }
    } catch (e) {
      setStatusMsg(`ERROR: Connection failed: ${e.message}`);
    } finally {
      setTampering(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedClaimId) return;
    setVerifying(true);
    setVerifyReport(null);
    setSigTamperReport(null);

    try {
      const response = await fetch(`${API_URL}/claims/${selectedClaimId}/verify`);
      if (response.ok) {
        const report = await response.json();
        setVerifyReport(report);
      } else {
        setStatusMsg("ERROR: Audit verification endpoint failed.");
      }
    } catch (e) {
      setStatusMsg(`ERROR: Connection failed: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySignatureTamper = async () => {
    if (!selectedClaimId) return;
    setVerifying(true);
    setVerifyReport(null);
    setSigTamperReport(null);
    setStatusMsg('');

    try {
      const response = await fetch(`${API_URL}/claims/${selectedClaimId}/verify-tampered-signature-simulation`);
      if (response.ok) {
        const report = await response.json();
        setSigTamperReport(report);
      } else {
        setStatusMsg("ERROR: Signature simulation endpoint failed.");
      }
    } catch (e) {
      setStatusMsg(`ERROR: Connection failed: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectClaim = (id) => {
    setSelectedClaimId(id);
    const claim = claims.find(c => c.claimId === id);
    if (claim) {
      setTamperTonnage(claim.tonnage);
    } else {
      setTamperTonnage('');
    }
    setVerifyReport(null);
    setSigTamperReport(null);
    setStatusMsg('');
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 h-full flex flex-col">
      <div className="border-b border-[#EAF2FC] pb-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-sans text-[#172A63] flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-[#7A1028]" />
              Interactive Tamper Simulation Lab
            </h2>
            <p className="text-xs text-[#5E6B8A] mt-0.5 font-sans">
              Simulate direct database tampering or signature forgery to verify ecrecover mismatch detection.
            </p>
          </div>

          {/* Toggle Mode */}
          <div className="flex bg-[#FAF9F7] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold shrink-0 gap-1">
            <button
              onClick={() => { setTamperMode('data'); setVerifyReport(null); setSigTamperReport(null); setStatusMsg(''); }}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                tamperMode === 'data' ? 'bg-[#7A1028] text-white shadow-sm font-bold' : 'text-[#5E6B8A] hover:text-[#172A63]'
              }`}
            >
              Tamper Data
            </button>
            <button
              onClick={() => { setTamperMode('signature'); setVerifyReport(null); setSigTamperReport(null); setStatusMsg(''); }}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                tamperMode === 'signature' ? 'bg-[#7A1028] text-white shadow-sm font-bold' : 'text-[#5E6B8A] hover:text-[#172A63]'
              }`}
            >
              Tamper Signature
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Step 1: Select Claim */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#5E6B8A] uppercase tracking-wider block font-sans">
            Step 1: Choose Target Claim to Audit / Tamper
          </label>
          <select
            value={selectedClaimId}
            onChange={(e) => handleSelectClaim(e.target.value)}
            className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-4 py-2.5 text-xs font-sans cursor-pointer"
          >
            <option value="">-- Select an active claim to audit/tamper --</option>
            {activeClaims.map(c => (
              <option key={c.claimId} value={c.claimId}>
                {c.claimId} - {c.projectName} ({Number(c.tonnage).toLocaleString()} tCO2e)
              </option>
            ))}
          </select>
        </div>

        {selectedClaim && (
          <>
            {/* Step 2: Mutate Row or Setup Sig Tamper */}
            {tamperMode === 'data' ? (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAF9F7] space-y-3">
                <label className="text-xs font-bold text-[#172A63] block font-sans">
                  Step 2: Simulate Direct Database Tampering (Bypassing Signatures)
                </label>
                <p className="text-xs text-[#5E6B8A] font-sans">
                  This updates the database record directly (representing an insider attack or unauthorized database write).
                </p>
                
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="New Tonnage"
                    value={tamperTonnage}
                    onChange={(e) => setTamperTonnage(e.target.value)}
                    className="flex-1 bg-white border border-[#E2E8F0] rounded-xl text-[#172A63] focus:outline-none focus:border-[#7A1028] px-3.5 py-2 text-xs font-mono"
                  />
                  <button
                    onClick={handleTamper}
                    disabled={tampering}
                    className="px-4 py-2 rounded-xl bg-[#7A1028] hover:bg-[#5E0B1D] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {tampering ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
                    Mutate Data
                  </button>
                </div>
                
                {statusMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-mono break-all ${
                    statusMsg.startsWith('SUCCESS') 
                      ? 'bg-[#EAF2FC] text-[#1677E8] border border-[#1677E8]/20' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {statusMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAF9F7] space-y-3">
                <label className="text-xs font-bold text-[#172A63] block font-sans">
                  Step 2: Simulate Signature Forgery / Author Tampering (Signature Corruption)
                </label>
                <p className="text-xs text-[#5E6B8A] font-sans leading-relaxed">
                  Modifying even a single byte of the signature will cause <strong>ecrecover</strong> to derive a completely different public key address, instantly flagging forgery.
                </p>
                
                <div className="text-xs font-mono bg-white p-3 rounded-xl border border-[#E2E8F0] space-y-1.5">
                  <div className="truncate"><span className="text-[#5E6B8A]">Stored Publisher:</span> <span className="text-[#172A63] font-bold select-all">{selectedClaim.orgId}</span></div>
                  <div className="truncate"><span className="text-[#5E6B8A]">Original Signature:</span> <span className="text-[#5E6B8A] select-all">{selectedClaim.signature}</span></div>
                </div>
              </div>
            )}

            {/* Step 3: Run Verification */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#5E6B8A] uppercase tracking-wider block font-sans">
                  Step 3: Run Integrity Audit
                </label>
                {tamperMode === 'data' ? (
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="btn-maroon text-xs font-semibold px-4 py-2"
                  >
                    {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Run Cryptographic Audit
                  </button>
                ) : (
                  <button
                    onClick={handleVerifySignatureTamper}
                    disabled={verifying}
                    className="btn-maroon text-xs font-semibold px-4 py-2"
                  >
                    {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    Simulate Signature Audit
                  </button>
                )}
              </div>

              {/* Verify Result Display */}
              {tamperMode === 'data' && verifyReport && (
                <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  verifyReport.isValid 
                    ? 'border-[#1677E8]/30 bg-[#EAF2FC]/30' 
                    : 'border-red-300 bg-red-50/40'
                }`}>
                  {/* Alert Header */}
                  <div className={`px-4 py-3 flex items-center justify-between gap-2 border-b text-sm font-bold ${
                    verifyReport.isValid 
                      ? 'bg-[#EAF2FC] border-[#1677E8]/20 text-[#1677E8]' 
                      : 'bg-red-100/70 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {verifyReport.isValid ? (
                        <>
                          <CheckCircle2 className="h-4.5 w-4.5" />
                          AUDIT PASS: Claims Integrity Verified
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="h-4.5 w-4.5" />
                          AUDIT FAIL: Cryptographic Tampering Detected!
                        </>
                      )}
                    </div>
                    <MockWarningBadge anchored={verifyReport.anchored} mode={verifyReport.blockchainMode} liveVerification={verifyReport.liveVerification} />
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Hashes Audit Table */}
                    <div className="grid grid-cols-3 gap-2 text-center border-b border-[#E2E8F0] pb-3">
                      <div>
                        <span className="text-[10px] text-[#5E6B8A] uppercase font-bold block font-sans">Stored Hash</span>
                        <div className="text-xs font-mono mt-1 text-[#172A63] truncate px-1">
                          {verifyReport.chain[verifyReport.chain.length - 1].dbHash.substring(0, 10)}...
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5E6B8A] uppercase font-bold block font-sans">Recomputed Hash</span>
                        <div className={`text-xs font-mono mt-1 truncate px-1 font-bold ${
                          verifyReport.signatureVerified ? 'text-[#172A63]' : 'text-red-700'
                        }`}>
                          {verifyReport.recomputedHash.substring(0, 10)}...
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5E6B8A] uppercase font-bold block font-sans">On-Chain Anchor</span>
                        <div className={`text-xs font-mono mt-1 truncate px-1 font-bold ${
                          verifyReport.anchorVerified ? 'text-[#1677E8]' : 'text-red-700'
                        }`}>
                          {verifyReport.anchoredHash ? `${verifyReport.anchoredHash.substring(0, 10)}...` : 'None'}
                        </div>
                      </div>
                    </div>

                    {/* Detailed checks list */}
                    <div className="space-y-2 text-xs font-sans">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#5E6B8A]">Signature Verification:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          verifyReport.signatureVerified ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                        }`}>
                          {verifyReport.signatureVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#5E6B8A]">On-Chain Anchor Verification:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          verifyReport.anchorVerified ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                        }`}>
                          {verifyReport.anchorVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#5E6B8A]">History Chain Consistency:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          verifyReport.chainVerified ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                        }`}>
                          {verifyReport.chainVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    {/* Audit Log / Error Messages */}
                    {verifyReport.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-red-800 block mb-1 font-sans">Diagnostic Log:</span>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-red-700 font-mono">
                          {verifyReport.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signature Tamper Result Display */}
              {tamperMode === 'signature' && sigTamperReport && (
                <div className="border border-red-300 bg-red-50/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-red-200 text-sm font-bold bg-red-100 text-red-800">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-4.5 w-4.5" />
                      AUDIT FAIL: Signature Forgery Mismatch!
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-red-200 pb-3">
                      <div>
                        <span className="text-[10px] text-[#5E6B8A] uppercase font-bold block font-sans">Stored Signer</span>
                        <div className="text-[#172A63] truncate mt-1 select-all font-bold" title={sigTamperReport.storedOrgAddress}>
                          {sigTamperReport.storedOrgAddress}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5E6B8A] uppercase font-bold block font-sans">Recovered Signer (Tampered)</span>
                        <div className="text-red-700 font-bold truncate mt-1 select-all" title={sigTamperReport.recoveredOrgAddress}>
                          {sigTamperReport.recoveredOrgAddress}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono space-y-2">
                      <div>
                        <span className="text-[#5E6B8A]">Original Signature:</span>
                        <div className="text-[#172A63] truncate bg-white p-2 rounded-lg border border-[#E2E8F0] select-all mt-1">{sigTamperReport.originalSignature}</div>
                      </div>
                      <div>
                        <span className="text-[#5E6B8A]">Tampered Signature:</span>
                        <div className="text-red-700 font-bold truncate bg-white p-2 rounded-lg border border-red-200 select-all mt-1">{sigTamperReport.tamperedSignature}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-red-100/60 border border-red-200 rounded-xl text-xs text-red-800 font-sans space-y-1.5 leading-relaxed">
                      <p className="font-bold uppercase tracking-wider text-red-900 text-[10px]">✗ Live Signature Audit Rejected</p>
                      <p>
                        Because the signature was tampered, the dynamic Ethereum signer recovery derived address <strong>{sigTamperReport.recoveredOrgAddress.substring(0, 12)}...</strong>, which does not match the stored publisher's address <strong>{sigTamperReport.storedOrgAddress.substring(0, 12)}...</strong>. 
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
