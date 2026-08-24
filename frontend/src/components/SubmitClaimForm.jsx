import React, { useState, useEffect } from 'react';
import { FilePlus, Info, CheckCircle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function SubmitClaimForm({ claims, onSuccessSubmit, API_URL }) {
  const [orgs, setOrgs] = useState([]);
  
  // Form fields
  const [projectName, setProjectName] = useState('');
  const [region, setRegion] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [methodology, setMethodology] = useState('REDD+ / Forestry');
  const [demoOrgId, setDemoOrgId] = useState('');
  const [parentClaimId, setParentClaimId] = useState('');

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
        // Handle array wrapper if present
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

  // Handle parent claim selection (locking details to enforce correction integrity)
  useEffect(() => {
    if (parentClaimId) {
      const parent = claims.find(c => c.claimId === parentClaimId);
      if (parent) {
        setProjectName(parent.projectName);
        setRegion(parent.region);
        setMethodology(parent.projectType);
        setDemoOrgId(parent.orgId); // Corrections must be submitted by the same organization
      }
    } else {
      setProjectName('');
      setRegion('');
      setMethodology('REDD+ / Forestry');
      if (orgs.length > 0) {
        setDemoOrgId(orgs[0].id);
      }
    }
  }, [parentClaimId, claims, orgs]);

  // Filter list of claims available for correction (only active/disputed claims can be corrected)
  const correctableClaims = claims.filter(c => c.status === 'active' || c.status === 'disputed');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      parentClaimId: parentClaimId || null
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
      <div className="glass rounded-xl border border-white/5 shadow-xl p-6 text-slate-300">
        <div className="flex items-center gap-3 text-emerald-400 border-b border-white/5 pb-4 mb-4">
          <CheckCircle className="h-6 w-6" />
          <h2 className="text-lg font-bold text-white">Claim Anchored Successfully</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/25 rounded-lg space-y-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-mono">Claim ID: <strong className="text-white">{submitResult.claimId}</strong></span>
              <MockWarningBadge anchored={submitResult.anchored} mode={submitResult.blockchainMode} />
            </div>
            <p className="text-sm font-semibold text-white mt-1">{submitResult.projectName} ({submitResult.projectId})</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Submitting Org:</span>
              <span className="text-slate-300 select-all block mt-0.5">{submitResult.orgId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tonnage Volume:</span>
              <span className="text-white block font-bold mt-0.5">{Number(submitResult.tonnage).toLocaleString()} tCO2e</span>
            </div>
          </div>

          <div className="text-xs font-mono border-t border-white/5 pt-4 space-y-2">
            <div>
              <span className="text-slate-500">Data Hash (SHA-256):</span>
              <span className="text-slate-300 block select-all bg-dark-900/50 p-2 rounded border border-white/5 mt-1 truncate">
                {submitResult.hash}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Transaction Hash (EVM):</span>
              <span className="text-slate-300 block select-all bg-dark-900/50 p-2 rounded border border-white/5 mt-1 truncate">
                {submitResult.txHash}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSuccessSubmit(submitResult.claimId)}
            className="w-full flex items-center justify-center gap-2 mt-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 font-bold transition-all"
          >
            Inspect in Claims Directory
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-white/5 shadow-xl p-6 flex flex-col h-full justify-between">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
          <FilePlus className="h-5 w-5 text-brand-500" />
          Submit Environmental Claim
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Correction Option */}
          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Submission Type
            </label>
            <select
              value={parentClaimId}
              onChange={(e) => setParentClaimId(e.target.value)}
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Initial Registry Entry (New Project)</option>
              {correctableClaims.map(c => (
                <option key={c.claimId} value={c.claimId}>
                  Correction to {c.projectName} ({c.claimId} - v{c.version})
                </option>
              ))}
            </select>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={!!parentClaimId}
                placeholder="e.g. Amazon Rainforest Conservation"
                className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 disabled:opacity-55"
                required
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Region / Country
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={!!parentClaimId}
                placeholder="e.g. Brazil"
                className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 disabled:opacity-55"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tonnage (tCO2e Volume)
              </label>
              <input
                type="number"
                value={tonnage}
                onChange={(e) => setTonnage(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Methodology / Sector
              </label>
              <select
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                disabled={!!parentClaimId}
                className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 disabled:opacity-55"
              >
                {methodologies.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Org keys mapping selector */}
          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Submit As (Authorized Organization)
            </label>
            <select
              value={demoOrgId}
              onChange={(e) => setDemoOrgId(e.target.value)}
              disabled={!!parentClaimId} // corrections must preserve original submitting address
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 disabled:opacity-55"
            >
              {orgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.displayName} ({org.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
            {parentClaimId && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                * Locked to original publisher to enforce correction rights.
              </span>
            )}
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-start gap-2 text-3xs text-slate-400 font-mono">
            <Info className="h-4.5 w-4.5 text-brand-500 shrink-0 mt-0.5" />
            <p>
              Under the hood, GreenProof will deterministically sort the parameters, hash the canonical representation with SHA-256, sign it locally using ECDSA keys, and anchor it on the Ethereum smart contract.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg py-2.5 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
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
