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
          Register Environmental Claim
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submission Type Option */}
          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Submission Type
            </label>
            <select
              value={submissionType}
              onChange={(e) => {
                setSubmissionType(e.target.value);
                setTargetProjectId('');
              }}
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="initial">Initial Registry Entry (New Project)</option>
              <option value="__dispute__">Independent Claim on Existing Project (Dispute Test)</option>
            </select>
          </div>

          {/* Target Project Select (Visible only for dispute testing) */}
          {submissionType === '__dispute__' && (
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target Project to Dispute
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
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
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={submissionType === '__dispute__'}
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
                disabled={submissionType === '__dispute__'}
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
                disabled={submissionType === '__dispute__'}
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
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {orgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.displayName} ({org.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
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
