import React, { useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle2, RotateCcw, Play, AlertOctagon, HelpCircle, HardDrive, RefreshCw } from 'lucide-react';
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
    <div className="glass bg-white rounded-xl border border-slate-200 shadow p-6 h-full flex flex-col">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Interactive Tamper Lab
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Simulate direct database tampering or signature forgery and observe how ecrecover dynamic derivation instantly flags authorship mismatch.
            </p>
          </div>

          {/* Toggle Mode */}
          <div className="flex bg-[#FAF9F7] p-1 rounded-lg border border-slate-200 text-2xs font-semibold shrink-0">
            <button
              onClick={() => { setTamperMode('data'); setVerifyReport(null); setSigTamperReport(null); setStatusMsg(''); }}
              className={`px-3 py-1.5 rounded transition-all font-bold ${
                tamperMode === 'data' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Tamper Data
            </button>
            <button
              onClick={() => { setTamperMode('signature'); setVerifyReport(null); setSigTamperReport(null); setStatusMsg(''); }}
              className={`px-3 py-1.5 rounded transition-all font-bold ${
                tamperMode === 'signature' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 'text-slate-600 hover:text-navy'
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
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Step 1: Choose Target Claim
          </label>
          <select
            value={selectedClaimId}
            onChange={(e) => handleSelectClaim(e.target.value)}
            className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="">-- Select an active claim to audit/tamper --</option>
            {activeClaims.map(c => (
              <option key={c.claimId} value={c.claimId}>
                {c.claimId} - {c.projectName} ({Number(c.tonnage).toLocaleString()} t)
              </option>
            ))}
          </select>
        </div>

        {selectedClaim && (
          <>
            {/* Step 2: Mutate Row or Setup Sig Tamper */}
            {tamperMode === 'data' ? (
              <div className="p-4 rounded-xl border border-white/5 bg-dark-800/40 space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Step 2: Simulate Direct Database Tampering (Bypassing Signature Checks)
                </label>
                <p className="text-2xs text-slate-500">
                  This updates the database record directly (representing an insider attack or server vulnerability).
                </p>
                
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="New Tonnage"
                    value={tamperTonnage}
                    onChange={(e) => setTamperTonnage(e.target.value)}
                    className="flex-1 bg-dark-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    onClick={handleTamper}
                    disabled={tampering}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {tampering ? <RefreshCw className="h-3 w-3 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
                    Mutate Data
                  </button>
                </div>
                
                {statusMsg && (
                  <div className={`p-2.5 rounded text-2xs font-mono break-all ${
                    statusMsg.startsWith('SUCCESS') 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/25'
                  }`}>
                    {statusMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-white/5 bg-dark-800/40 space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Step 2: Simulate Signature Forgery / Author Tampering (Signature Corruption)
                </label>
                <p className="text-2xs text-slate-500 leading-relaxed">
                  This simulates an attacker changing the signature values to forge authorization. Because the publisher's address is dynamically derived using <strong>ecrecover</strong>, modifying even a single byte of the signature recovers a completely wrong signer address.
                </p>
                
                <div className="text-3xs font-mono bg-dark-900/50 p-2.5 rounded border border-white/5 space-y-1.5">
                  <div className="truncate"><span className="text-slate-500">Stored Publisher:</span> <span className="text-slate-300 select-all">{selectedClaim.orgId}</span></div>
                  <div className="truncate"><span className="text-slate-500">Original Signature:</span> <span className="text-slate-400 select-all">{selectedClaim.signature}</span></div>
                </div>
              </div>
            )}

            {/* Step 3: Run Verification */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Step 3: Run Integrity Audit
                </label>
                {tamperMode === 'data' ? (
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="px-4 py-2 rounded-lg bg-maroon hover:bg-maroon-dark text-xs font-bold text-white transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Run Cryptographic Audit
                  </button>
                ) : (
                  <button
                    onClick={handleVerifySignatureTamper}
                    disabled={verifying}
                    className="px-4 py-2 rounded-lg bg-red-650 hover:bg-red-700 text-xs font-bold text-white transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    Simulate Signature Audit
                  </button>
                )}
              </div>

              {/* Verify Result Display */}
              {tamperMode === 'data' && verifyReport && (
                <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                  verifyReport.isValid 
                    ? 'border-emerald-200 bg-emerald-50' 
                    : 'border-red-200 bg-red-50 animate-pulse-slow'
                }`}>
                  {/* Alert Header */}
                  <div className={`px-4 py-3 flex items-center justify-between gap-2 border-b text-sm font-bold ${
                    verifyReport.isValid 
                      ? 'bg-[#FAF9F7] border-emerald-250 text-emerald-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
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
                    <div className="grid grid-cols-3 gap-2 text-center border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">Stored Hash</span>
                        <div className="text-2xs font-mono mt-1 text-slate-700 truncate px-1">
                          {verifyReport.chain[verifyReport.chain.length - 1].dbHash.substring(0, 10)}...
                        </div>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">Recomputed Hash</span>
                        <div className={`text-2xs font-mono mt-1 truncate px-1 font-bold ${
                          verifyReport.signatureVerified ? 'text-slate-700' : 'text-red-700'
                        }`}>
                          {verifyReport.recomputedHash.substring(0, 10)}...
                        </div>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">On-Chain Anchor</span>
                        <div className={`text-2xs font-mono mt-1 truncate px-1 font-bold ${
                          verifyReport.anchorVerified ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {verifyReport.anchoredHash ? `${verifyReport.anchoredHash.substring(0, 10)}...` : 'None'}
                        </div>
                      </div>
                    </div>

                    {/* Detailed checks list */}
                    <div className="space-y-2 text-2xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Signature Verification:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          verifyReport.signatureVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {verifyReport.signatureVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">On-Chain Anchor Verification:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          verifyReport.anchorVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {verifyReport.anchorVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">History Chain Consistency:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          verifyReport.chainVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {verifyReport.chainVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    {/* Audit Log / Error Messages */}
                    {verifyReport.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <span className="text-3xs uppercase font-bold text-red-700 block mb-1">Diagnostic Log:</span>
                        <ul className="list-disc pl-4 space-y-1 text-2xs text-red-700 font-mono">
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
                <div className="border border-red-200 bg-red-50 rounded-xl overflow-hidden animate-pulse-slow">
                  <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-red-250 text-sm font-bold bg-[#FAF9F7] text-red-750">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertOctagon className="h-4.5 w-4.5" />
                      AUDIT FAIL: Signature Forgery Mismatch!
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">Stored Signer</span>
                        <div className="text-navy truncate mt-1 select-all" title={sigTamperReport.storedOrgAddress}>
                          {sigTamperReport.storedOrgAddress}
                        </div>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">Recovered Signer (Tampered)</span>
                        <div className="text-red-700 font-bold truncate mt-1 select-all" title={sigTamperReport.recoveredOrgAddress}>
                          {sigTamperReport.recoveredOrgAddress}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono space-y-2">
                      <div>
                        <span className="text-slate-500">Original Signature:</span>
                        <div className="text-slate-700 truncate bg-white p-2 rounded border border-slate-200 select-all mt-1">{sigTamperReport.originalSignature}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Tampered Signature:</span>
                        <div className="text-red-700 font-bold truncate bg-white p-2 rounded border border-red-200 select-all mt-1">{sigTamperReport.tamperedSignature}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-2xs text-red-700 font-mono space-y-1.5 leading-relaxed">
                      <p className="font-bold uppercase tracking-wider text-red-750 text-[10px]">✗ Live Signature Audit Rejected</p>
                      <p>
                        Because the signature was tampered, the dynamic Ethereum signer recovery derived address <strong>{sigTamperReport.recoveredOrgAddress.substring(0, 12)}...</strong>, which does not match the stored publisher's address <strong>{sigTamperReport.storedOrgAddress.substring(0, 12)}...</strong>. 
                      </p>
                      <p className="italic text-slate-500 mt-1">
                        This cryptographically proves that a claim's authorship cannot be forged as another organization without their private key.
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
