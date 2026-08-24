import React, { useState, useEffect } from 'react';
import { FilePlus, Info, CheckCircle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function SubmitClaimForm({ claims, onSuccessSubmit, API_URL }) {
  const [orgs, setOrgs] = useState([]);
  
  // Form fields
  const [submissionType, setSubmissionType] = useState('initial'); // 'initial' | '__dispute__'
  const [targetProjectId, setTargetProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [region, setRegion] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [methodology, setMethodology] = useState('REDD+ / Forestry');
  const [demoOrgId, setDemoOrgId] = useState('');

  // States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // Available methodologies
  const methodologies = [
    'REDD+ / Forestry',
    'Methane Avoidance',
    'Energy Efficiency',
    'Wind',
    'Solar',
    'Water Purification',
    'Blue Carbon',
    'Agroforestry',
    'Hydropower'
  ];

  // Load demo orgs on mount
  useEffect(() => {
    fetch(`${API_URL}/demo-orgs`)
      .then(res => res.json())
      .then(data => {
        const orgList = data.value || data;
        setOrgs(orgList);
        if (orgList.length > 0) {
          setDemoOrgId(orgList[0].id);
        }
      })
      .catch(err => {
        console.error("Error loading demo orgs:", err);
        setError("Could not load demo organizations from backend.");
      });
  }, [API_URL]);

  // Deduplicate claims by projectId to get the list of existing projects
  const uniqueProjects = [];
  const projectIds = new Set();
  claims.forEach(c => {
    if (!projectIds.has(c.projectId)) {
      projectIds.add(c.projectId);
      uniqueProjects.push(c);
    }
  });

  // Populate/lock fields when target project changes in dispute mode
  useEffect(() => {
    if (submissionType === '__dispute__' && targetProjectId) {
      const proj = claims.find(c => c.projectId === targetProjectId);
      if (proj) {
        setProjectName(proj.projectName);
        setRegion(proj.region);
        setMethodology(proj.projectType);
      }
    } else if (submissionType === 'initial') {
      setProjectName('');
      setRegion('');
      setMethodology('REDD+ / Forestry');
    }
  }, [submissionType, targetProjectId, claims]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submissionType === '__dispute__' && !targetProjectId) {
      setError("Please select a target project to dispute.");
      return;
    }

    if (!projectName || !region || !tonnage || !demoOrgId) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitResult(null);

    const payload = {
      projectName,
      region,
      tonnage: Number(tonnage),
      methodology,
      demoOrgId,
      parentClaimId: null,
      targetProjectId: submissionType === '__dispute__' ? targetProjectId : null
    };

    try {
      const response = await fetch(`${API_URL}/claims/submit-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitResult(data);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitResult) {
    return (
      <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 text-[#172A63]">
        <div className="flex items-center gap-3 text-[#1677E8] border-b border-[#EAF2FC] pb-4 mb-4">
          <CheckCircle className="h-6 w-6" />
          <h2 className="text-xl font-bold font-sans text-[#172A63]">Claim Anchored Successfully</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#EAF2FC] border border-[#1677E8]/20 rounded-xl space-y-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-[#5E6B8A] font-mono">Claim ID: <strong className="text-[#7A1028]">{submitResult.claimId}</strong></span>
              <MockWarningBadge anchored={submitResult.anchored} mode={submitResult.blockchainMode} />
            </div>
            <p className="text-sm font-semibold text-[#172A63] mt-1">{submitResult.projectName} ({submitResult.projectId})</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#5E6B8A] block">Submitting Org:</span>
              <span className="text-[#172A63] select-all block mt-0.5 font-bold">{submitResult.orgId}</span>
            </div>
            <div>
              <span className="text-[#5E6B8A] block">Tonnage Volume:</span>
              <span className="text-[#172A63] block font-bold mt-0.5">{Number(submitResult.tonnage).toLocaleString()} tCO2e</span>
            </div>
          </div>

          <div className="text-xs font-mono border-t border-[#EAF2FC] pt-4 space-y-2">
            <div>
              <span className="text-[#5E6B8A]">Data Hash (SHA-256):</span>
              <span className="text-[#172A63] block select-all bg-[#FAF9F7] p-2 rounded-lg border border-[#E2E8F0] mt-1 truncate">
                {submitResult.hash}
              </span>
            </div>
            <div>
              <span className="text-[#5E6B8A]">Transaction Hash (EVM):</span>
              <span className="text-[#172A63] block select-all bg-[#FAF9F7] p-2 rounded-lg border border-[#E2E8F0] mt-1 truncate">
                {submitResult.txHash}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSuccessSubmit(submitResult.claimId)}
            className="w-full flex items-center justify-center gap-2 mt-4 btn-maroon text-xs font-semibold py-3"
          >
            Inspect in Claims Directory
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 flex flex-col h-full justify-between">
      <div>
        <h2 className="text-xl font-bold font-sans text-[#172A63] flex items-center gap-2 border-b border-[#EAF2FC] pb-4 mb-4">
          <FilePlus className="h-5 w-5 text-[#7A1028]" />
          Register Environmental Claim
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-sans">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submission Type Option */}
          <div>
            <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
              Submission Type
            </label>
            <select
              value={submissionType}
              onChange={(e) => {
                setSubmissionType(e.target.value);
                setTargetProjectId('');
              }}
              className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans cursor-pointer"
            >
              <option value="initial">Initial Registry Entry (New Project)</option>
              <option value="__dispute__">Independent Claim on Existing Project (Dispute Test)</option>
            </select>
          </div>

          {/* Target Project Select (Visible only for dispute testing) */}
          {submissionType === '__dispute__' && (
            <div>
              <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
                Target Project to Dispute
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans cursor-pointer"
                required
              >
                <option value="">-- Choose Existing Project --</option>
                {uniqueProjects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName} ({p.projectId} - {p.region})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={submissionType === '__dispute__'}
                placeholder="e.g. Amazon Conservation"
                className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] placeholder:text-[#5E6B8A]/50 focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans disabled:opacity-60"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
                Region / Country
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={submissionType === '__dispute__'}
                placeholder="e.g. Brazil"
                className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] placeholder:text-[#5E6B8A]/50 focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans disabled:opacity-60"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
                Tonnage (tCO2e Volume)
              </label>
              <input
                type="number"
                value={tonnage}
                onChange={(e) => setTonnage(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] placeholder:text-[#5E6B8A]/50 focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
                Methodology / Sector
              </label>
              <select
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                disabled={submissionType === '__dispute__'}
                className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans cursor-pointer disabled:opacity-60"
              >
                {methodologies.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Org keys mapping selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider mb-1 font-sans">
              Submit As (Authorized Organization)
            </label>
            <select
              value={demoOrgId}
              onChange={(e) => setDemoOrgId(e.target.value)}
              className="w-full bg-[#FAF9F7] border border-[#E2E8F0] text-[#172A63] focus:outline-none focus:border-[#7A1028] focus:ring-1 focus:ring-[#7A1028] rounded-xl px-3.5 py-2 text-xs font-sans cursor-pointer"
            >
              {orgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.displayName} ({org.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-[#EAF2FC]/60 border border-[#1677E8]/20 rounded-xl flex items-start gap-2 text-xs text-[#172A63] font-sans">
            <Info className="h-4 w-4 text-[#1677E8] shrink-0 mt-0.5" />
            <p>
              GreenProof canonicalizes and hashes parameters with SHA-256, signs them locally using ECDSA keys, and anchors proof records on the blockchain smart contract.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-maroon text-xs font-semibold py-3 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing & Anchoring...
              </>
            ) : (
              "Submit to Network"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
