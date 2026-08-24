import React, { useState } from 'react';
import { GitCommit, Search, CheckCircle2, AlertOctagon, ArrowLeft, ArrowRight, Loader2, Key } from 'lucide-react';

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
    <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 h-full flex flex-col justify-between min-h-[500px]">
      <div>
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-[#EAF2FC] pb-4 mb-4">
          <h2 className="text-xl font-bold font-sans text-[#172A63] flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-[#7A1028]" />
            Update Registered Claim
          </h2>
          <div className="flex items-center gap-2 text-xs font-sans text-[#5E6B8A]">
            <span className={step === 1 ? "text-[#7A1028] font-bold" : ""}>1. Target</span>
            <span>&bull;</span>
            <span className={step === 2 ? "text-[#7A1028] font-bold" : ""}>2. Diff Review</span>
            <span>&bull;</span>
            <span className={step === 3 ? "text-[#7A1028] font-bold" : ""}>3. Verification</span>
          </div>
        </div>

        {/* STEP 1: Search and Pick Claim */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-[#5E6B8A] font-sans leading-relaxed">
              Search the environmental registry and choose which active or disputed claim requires correction.
            </p>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E6B8A]/60" />
              <input
                type="text"
                placeholder="Search by Claim ID, Project Name, or Region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clean-search w-full text-xs pl-9 pr-4 py-2"
              />
            </div>

            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-[240px] overflow-y-auto bg-[#FAF9F7] divide-y divide-[#EAF2FC]">
              {correctableClaims.length === 0 ? (
                <div className="p-6 text-center text-[#5E6B8A] text-xs font-sans">
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
                        isChosen 
                          ? 'bg-[#FDF2F4] border-l-4 border-[#7A1028] font-semibold text-[#172A63]' 
                          : 'text-[#5E6B8A] hover:bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-[#7A1028] font-bold">{c.claimId}</span>
                        <div className="font-semibold text-[#172A63]">{c.projectName}</div>
                        <div className="text-[#5E6B8A] text-[11px] font-mono">{c.orgId.substring(0, 16)}...</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[#172A63] font-bold">{Number(c.tonnage).toLocaleString()} t</div>
                        <span className="bg-white border border-[#E2E8F0] px-2 py-0.5 rounded text-[10px] text-[#5E6B8A] font-mono">v{c.version}</span>
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
                className="btn-maroon text-xs font-semibold px-5 py-2 disabled:opacity-50"
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
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-sans">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Locked fields summary */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF9F7] p-3.5 rounded-xl border border-[#E2E8F0] font-sans">
              <div>
                <span className="text-[#5E6B8A] text-[10px] uppercase font-bold block">Project Name:</span>
                <span className="text-[#172A63] font-bold truncate block mt-0.5">{selectedClaim.projectName}</span>
              </div>
              <div>
                <span className="text-[#5E6B8A] text-[10px] uppercase font-bold block">Methodology:</span>
                <span className="text-[#172A63] font-bold truncate block mt-0.5">{selectedClaim.projectType}</span>
              </div>
              <div className="col-span-2 border-t border-[#EAF2FC] pt-2 mt-1">
                <span className="text-[#5E6B8A] text-[10px] uppercase font-bold block">Submitting Org (Address Key):</span>
                <span className="text-[#172A63] text-xs font-mono flex items-center gap-1 mt-0.5">
                  <Key className="h-3 w-3 text-[#1677E8] shrink-0" />
                  {selectedClaim.orgId}
                </span>
              </div>
            </div>

            {/* Side by side diff comparison */}
            <div>
              <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-2 text-center font-sans">
                Tonnage Difference Comparison
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <span className="text-[#5E6B8A] font-bold uppercase tracking-wider text-[10px] font-sans">Before (v{selectedClaim.version})</span>
                  <div className="text-2xl font-bold font-mono text-[#172A63]">
                    {Number(selectedClaim.tonnage).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-[#5E6B8A] block font-sans">tCO2e Registered</span>
                </div>

                {/* AFTER */}
                <div className="p-4 bg-[#EAF2FC] border border-[#1677E8]/25 rounded-xl text-center space-y-1">
                  <span className="text-[#1677E8] font-bold uppercase tracking-wider text-[10px] font-sans">After (v{selectedClaim.version + 1})</span>
                  <input
                    type="number"
                    value={newTonnage}
                    onChange={(e) => setNewTonnage(e.target.value)}
                    required
                    placeholder="New Tonnage"
                    className="w-full bg-white border border-[#1677E8]/30 rounded-lg px-2 py-1 text-sm text-center text-[#172A63] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1677E8]"
                  />
                  <span className="text-[11px] text-[#1677E8] block font-sans">tCO2e Proposed</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleBackToStep1}
                className="btn-outline-maroon text-xs font-semibold px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn-maroon text-xs font-semibold px-5 py-2 disabled:opacity-50"
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1677E8]" />
                <p className="text-xs text-[#5E6B8A] font-mono">Running cryptographic verification chain checks...</p>
              </div>
            ) : verifyReport ? (
              <div className="space-y-4">
                <div className={`p-4 border rounded-xl ${
                  verifyReport.isValid 
                    ? 'border-[#1677E8]/20 bg-[#EAF2FC] text-[#172A63]' 
                    : 'border-red-200 bg-red-50 text-red-800'
                } flex items-center gap-3`}>
                  <CheckCircle2 className="h-6 w-6 text-[#1677E8] shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-[#172A63]">
                      {verifyReport.isValid ? "Audit Verified: Correction Validated" : "Audit Rejected: Validation Failed"}
                    </h3>
                    <p className="text-[11px] text-[#5E6B8A] mt-0.5 font-mono">
                      Claim ID: {newClaimId}
                    </p>
                  </div>
                </div>

                {/* 4-point Checklist */}
                <div className="space-y-2 text-xs font-sans">
                  {/* Check 1 */}
                  <div className="flex justify-between items-center p-2.5 border border-[#E2E8F0] bg-[#FAF9F7] rounded-xl">
                    <span className="text-[#5E6B8A]">1. Payload Hash Recomputed:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      getHashRecomputeStatus() ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                    }`}>
                      {getHashRecomputeStatus() ? 'PASS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Check 2 */}
                  <div className="flex justify-between items-center p-2.5 border border-[#E2E8F0] bg-[#FAF9F7] rounded-xl">
                    <span className="text-[#5E6B8A]">2. ECDSA Signature Re-checked:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      verifyReport.signatureVerified ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                    }`}>
                      {verifyReport.signatureVerified ? 'PASS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Check 3 */}
                  <div className="flex justify-between items-center p-2.5 border border-[#E2E8F0] bg-[#FAF9F7] rounded-xl">
                    <span className="text-[#5E6B8A]">3. On-Chain Anchor Re-derived:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      verifyReport.anchorVerified ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                    }`}>
                      {verifyReport.anchorVerified ? 'PASS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Check 4 */}
                  <div className="flex justify-between items-center p-2.5 border border-[#E2E8F0] bg-[#FAF9F7] rounded-xl">
                    <span className="text-[#5E6B8A]">4. Parent History Chain Walked:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      verifyReport.chainVerified ? 'bg-[#EAF2FC] text-[#1677E8]' : 'bg-red-100 text-red-700'
                    }`}>
                      {verifyReport.chainVerified ? 'PASS' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSuccessSubmit(newClaimId)}
                  className="w-full btn-maroon text-xs font-semibold py-3 flex items-center justify-center gap-1.5 mt-4"
                >
                  Inspect in Claims Directory
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-[#5E6B8A] text-xs font-sans">
                Verification failed to execute or fetch.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
