import React, { useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle2, RotateCcw, Play, AlertOctagon, HelpCircle, HardDrive, RefreshCw } from 'lucide-react';

export default function TamperLab({ claims, onRefreshData, API_URL }) {
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [tamperTonnage, setTamperTonnage] = useState('');
  const [tampering, setTampering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyReport, setVerifyReport] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const activeClaims = claims.filter(c => c.status === 'active' || c.status === 'disputed');

  const selectedClaim = claims.find(c => c.claimId === selectedClaimId);

  const handleTamper = async () => {
    if (!selectedClaimId || !tamperTonnage) return;
    setTampering(true);
    setVerifyReport(null);
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

  const handleSelectClaim = (id) => {
    setSelectedClaimId(id);
    const claim = claims.find(c => c.claimId === id);
    if (claim) {
      setTamperTonnage(claim.tonnage);
    } else {
      setTamperTonnage('');
    }
    setVerifyReport(null);
    setStatusMsg('');
  };

  return (
    <div className="glass rounded-xl border border-white/5 shadow-xl p-6 h-full flex flex-col">
      <div className="border-b border-white/5 pb-4 mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          Interactive Tamper Lab
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate direct database tampering and observe how green verification audits instantly flag the mismatch.
        </p>
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
            {/* Step 2: Mutate Row */}
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

            {/* Step 3: Run Verification */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Step 3: Run Integrity Audit
                </label>
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white transition-all shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {verifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Run Cryptographic Audit
                </button>
              </div>

              {/* Verify Result Display */}
              {verifyReport && (
                <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                  verifyReport.isValid 
                    ? 'border-emerald-500/25 bg-emerald-500/5' 
                    : 'border-red-500/25 bg-red-500/5 animate-pulse-slow'
                }`}>
                  {/* Alert Header */}
                  <div className={`px-4 py-3 flex items-center gap-2 border-b text-sm font-bold ${
                    verifyReport.isValid 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
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

                  <div className="p-4 space-y-4">
                    {/* Hashes Audit Table */}
                    <div className="grid grid-cols-3 gap-2 text-center border-b border-white/5 pb-3">
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">Stored Hash</span>
                        <div className="text-2xs font-mono mt-1 text-slate-400 truncate px-1">
                          {verifyReport.chain[verifyReport.chain.length - 1].dbHash.substring(0, 10)}...
                        </div>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">Recomputed Hash</span>
                        <div className={`text-2xs font-mono mt-1 truncate px-1 font-bold ${
                          verifyReport.signatureVerified ? 'text-slate-400' : 'text-red-400'
                        }`}>
                          {verifyReport.recomputedHash.substring(0, 10)}...
                        </div>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 uppercase font-semibold">On-Chain Anchor</span>
                        <div className={`text-2xs font-mono mt-1 truncate px-1 font-bold ${
                          verifyReport.anchorVerified ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {verifyReport.anchoredHash ? `${verifyReport.anchoredHash.substring(0, 10)}...` : 'None'}
                        </div>
                      </div>
                    </div>

                    {/* Detailed checks list */}
                    <div className="space-y-2 text-2xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Signature Verification:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          verifyReport.signatureVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {verifyReport.signatureVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">On-Chain Anchor Verification:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          verifyReport.anchorVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {verifyReport.anchorVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">History Chain Consistency:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          verifyReport.chainVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {verifyReport.chainVerified ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    {/* Audit Log / Error Messages */}
                    {verifyReport.errors.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3">
                        <span className="text-3xs uppercase font-bold text-red-400 block mb-1">Diagnostic Log:</span>
                        <ul className="list-disc pl-4 space-y-1 text-2xs text-red-300 font-mono">
                          {verifyReport.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
