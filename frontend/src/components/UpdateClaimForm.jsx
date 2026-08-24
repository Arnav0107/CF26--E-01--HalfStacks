import React, { useState, useEffect } from 'react';
import { GitCommit, Search, CheckCircle2, AlertOctagon, ArrowLeft, ArrowRight, Loader2, Key } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function UpdateClaimForm({ claims, onSuccessSubmit, API_URL }) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection & Forms
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [newTonnage, setNewTonnage] = useState('');
  
  // Submission & Verification States
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [newClaimId, setNewClaimId] = useState(null);
  const [verifyReport, setVerifyReport] = useState(null);

  // Step 1: Filter correctable active/disputed claims
  const correctableClaims = claims.filter(c => 
    (c.status === 'active' || c.status === 'disputed') &&
    (
      c.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.projectId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSelectClaim = (claim) => {
    setSelectedClaim(claim);
    setSubmitError(null);
    // Suggest the old tonnage initially + a small change or let user fill it
    setNewTonnage(claim.tonnage);
  };

  const handleNextToStep2 = () => {
    if (selectedClaim) {
      setSubmitError(null);
      setStep(2);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSubmitError(null);
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedClaim || !newTonnage) {
      setSubmitError("Please specify a new tonnage volume.");
      return;
    }

    if (Number(newTonnage) === Number(selectedClaim.tonnage)) {
      setSubmitError("New tonnage must be different from the current tonnage.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      projectName: selectedClaim.projectName,
      region: selectedClaim.region,
      tonnage: Number(newTonnage),
      methodology: selectedClaim.projectType,
      demoOrgId: selectedClaim.orgId,
      parentClaimId: selectedClaim.claimId
    };

    try {
      const response = await fetch(`${API_URL}/claims/submit-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Correction submission failed");
      }

      setNewClaimId(data.claimId);
      setStep(3);
      
      // Immediately run the verify check
      await runVerification(data.claimId);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const runVerification = async (targetId) => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/claims/${targetId}/verify`);
      const data = await res.json();
      setVerifyReport(data);
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  // Helper to check target claim dbHashMatches
  const getHashRecomputeStatus = () => {
    if (!verifyReport || !verifyReport.chain) return false;
    const info = verifyReport.chain.find(c => c.claimId === newClaimId);
    if (!info) return false;
    return info.dbHash === info.recomputedHash;
  };

  return (
    <div className="glass bg-white rounded-xl border border-slate-200 shadow p-6 h-full flex flex-col justify-between min-h-[500px]">
      <div>
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-brand-500" />
            Update Registered Claim
          </h2>
          <div className="flex items-center gap-1.5 text-3xs font-mono text-slate-600">
            <span className={step === 1 ? "text-brand-500 font-bold" : ""}>1. Select Target</span>
            <span>&bull;</span>
            <span className={step === 2 ? "text-brand-500 font-bold" : ""}>2. Diff Review</span>
            <span>&bull;</span>
            <span className={step === 3 ? "text-brand-500 font-bold" : ""}>3. Verification Result</span>
          </div>
        </div>

        {/* STEP 1: Search and Pick Claim */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Search the environmental registry and choose which active or disputed claim requires correction.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Claim ID, Project Name, or Region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FAF9F7] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-navy placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[220px] overflow-y-auto bg-white divide-y divide-slate-100">
              {correctableClaims.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No active or disputed claims match the search query.
                </div>
              ) : (
                correctableClaims.map(c => {
                  const isChosen = selectedClaim?.claimId === c.claimId;
                  return (
                    <div
                      key={c.claimId}
                      onClick={() => handleSelectClaim(c)}
                      className={`p-3 text-xs flex justify-between items-center cursor-pointer transition-all ${
                        isChosen ? 'bg-maroon/5 border-l-2 border-maroon text-navy' : 'text-slate-500 hover:bg-[#FAF9F7]'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-maroon font-bold">{c.claimId}</span>
                        <div className="font-bold text-navy">{c.projectName}</div>
                        <div className="text-slate-500 text-3xs font-mono">{c.orgId.substring(0, 16)}...</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-navy font-semibold">{Number(c.tonnage).toLocaleString()} t</div>
                        <span className="bg-[#FAF9F7] px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono">v{c.version}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextToStep2}
                disabled={!selectedClaim}
                className="bg-maroon hover:bg-maroon-dark text-white rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                Next: Diff Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Before/After Diff View */}
        {step === 2 && selectedClaim && (
          <form onSubmit={handleSubmitCorrection} className="space-y-4">
            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-2xs flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Locked fields summary */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF9F7] p-3 rounded-lg border border-slate-200 font-mono">
              <div>
                <span className="text-slate-500 text-3xs uppercase block">Project Name:</span>
                <span className="text-navy font-semibold truncate block">{selectedClaim.projectName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-3xs uppercase block">Methodology:</span>
                <span className="text-navy font-semibold truncate block">{selectedClaim.projectType}</span>
              </div>
              <div className="col-span-2 border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500 text-3xs uppercase block">Submitting Organization (Address Key):</span>
                <span className="text-slate-700 text-3xs flex items-center gap-1">
                  <Key className="h-3 w-3 text-maroon shrink-0" />
                  {selectedClaim.orgId}
                </span>
              </div>
            </div>

            {/* Side by side diff comparison */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Tonnage Difference Comparison
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center space-y-1">
                  <span className="text-red-600 font-bold uppercase tracking-wider text-[10px]">Before (v{selectedClaim.version})</span>
                  <div className="text-xl font-bold font-mono text-slate-750">
                    {Number(selectedClaim.tonnage).toLocaleString()}
                  </div>
                  <span className="text-3xs text-slate-500 block">tCO2e Registered</span>
                </div>

                {/* AFTER */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center space-y-1">
                  <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">After (v{selectedClaim.version + 1})</span>
                  <input
                    type="number"
                    value={newTonnage}
                    onChange={(e) => setNewTonnage(e.target.value)}
                    required
                    placeholder="New Tonnage"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-center text-navy placeholder-slate-400 focus:outline-none focus:border-maroon font-mono font-bold"
                  />
                  <span className="text-3xs text-slate-500 block">tCO2e Proposed</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleBackToStep1}
                className="border border-slate-200 hover:bg-[#FDF2F4] text-maroon rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="bg-maroon hover:bg-maroon-dark text-white rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing Correction...
                  </>
                ) : (
                  <>
                    <GitCommit className="h-4 w-4" />
                    Submit Correction
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Live Verification Result Panel */}
        {step === 3 && (
          <div className="space-y-4">
            {verifying ? (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-maroon" />
                <p className="text-xs text-slate-500 font-mono">Running cryptographic verification chain checks...</p>
              </div>
            ) : verifyReport ? (
              <div className="space-y-4">
                <div className={`p-4 border rounded-lg ${
                  verifyReport.isValid 
                    ? 'border-emerald-250 bg-emerald-50 text-emerald-700' 
                    : 'border-red-200 bg-red-50 text-red-700'
                } flex items-center gap-3`}>
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold">
                      {verifyReport.isValid ? "Audit Verified: Correction Validated" : "Audit Rejected: Validation Failed"}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Claim ID: {newClaimId}
                    </p>
                  </div>
                </div>

                {/* 4-point Checklist */}
                <div className="space-y-2 text-2xs font-mono">
                  {/* Check 1 */}
                  <div className="flex justify-between items-center p-2 border border-slate-200 bg-[#FAF9F7] rounded">
                    <span className="text-slate-500">1. Payload Hash Recomputed:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      getHashRecomputeStatus() ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {getHashRecomputeStatus() ? 'PASS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Check 2 */}
                  <div className="flex justify-between items-center p-2 border border-slate-200 bg-[#FAF9F7] rounded">
                    <span className="text-slate-500">2. ECDSA Signature Re-checked:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      verifyReport.signatureVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {verifyReport.signatureVerified ? 'PASS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Check 3 */}
                  <div className="flex justify-between items-center p-2 border border-slate-200 bg-[#FAF9F7] rounded">
                    <span className="text-slate-500">3. On-Chain Anchor Re-derived:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      verifyReport.anchorVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {verifyReport.anchorVerified ? 'PASS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Check 4 */}
                  <div className="flex justify-between items-center p-2 border border-slate-200 bg-[#FAF9F7] rounded">
                    <span className="text-slate-500">4. Parent History Chain Walked:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      verifyReport.chainVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {verifyReport.chainVerified ? 'PASS' : 'FAILED'}
                    </span>
                  </div>
                </div>

                {/* Diagnostic Log */}
                {verifyReport.errors && verifyReport.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-3xs font-mono text-red-700">
                    <span className="font-bold block mb-1 uppercase text-red-700">Diagnostics:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {verifyReport.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => onSuccessSubmit(newClaimId)}
                  className="w-full bg-maroon hover:bg-maroon-dark text-white rounded-lg py-2.5 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  Inspect in Claims Directory
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                Verification failed to execute or fetch.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
