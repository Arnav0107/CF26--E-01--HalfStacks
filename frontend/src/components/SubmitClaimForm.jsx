import React, { useState, useEffect } from 'react';
import { FilePlus, Info, CheckCircle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function SubmitClaimForm({ claims, onSuccessSubmit, API_URL }) {
  const [orgs, setOrgs] = useState([]);
  
  // Form fields
  const [submissionType, setSubmissionType] = useState('initial'); // 'initial' | '__dispute__'
  const [environmentalDomain, setEnvironmentalDomain] = useState('carbon');
  const [metric, setMetric] = useState('CO2 emissions');
  const [unit, setUnit] = useState('tonnes CO2e');
  const [period, setPeriod] = useState('2025');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [region, setRegion] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [methodology, setMethodology] = useState('REDD+ / Forestry');
  const [demoOrgId, setDemoOrgId] = useState('');

  // AI Extraction Tool State
  const [showExtractorModal, setShowExtractorModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [extractedCandidates, setExtractedCandidates] = useState([]);
  const [extracting, setExtracting] = useState(false);

  // Available domain metrics mapping
  const domainMetrics = {
    carbon: [
      { metric: 'CO2 emissions', unit: 'tonnes CO2e' },
      { metric: 'CH4 emissions', unit: 'tonnes CH4' },
      { metric: 'GHG reduction', unit: '% reduction' }
    ],
    water: [
      { metric: 'Water consumption', unit: 'million litres' },
      { metric: 'Water withdrawal', unit: 'm3' },
      { metric: 'Water recycling', unit: '%' }
    ],
    air: [
      { metric: 'PM2.5 particulate', unit: 'µg/m³' },
      { metric: 'PM10 index', unit: 'µg/m³' },
      { metric: 'NO2 concentration', unit: 'ppb' }
    ],
    waste: [
      { metric: 'Recycled waste ratio', unit: '%' },
      { metric: 'Landfilled waste', unit: 'tonnes' },
      { metric: 'Hazardous waste diverted', unit: 'tonnes' }
    ],
    forest: [
      { metric: 'Forest area protected', unit: 'hectares' },
      { metric: 'Afforestation canopy', unit: 'hectares' },
      { metric: 'Deforestation rate', unit: '% reduction' }
    ],
    energy: [
      { metric: 'Renewable energy share', unit: '%' },
      { metric: 'Solar capacity generated', unit: 'MWh' },
      { metric: 'Energy intensity', unit: 'kWh / unit' }
    ]
  };

  // Update metric/unit when domain changes
  useEffect(() => {
    const defaultPairs = domainMetrics[environmentalDomain] || domainMetrics['carbon'];
    setMetric(defaultPairs[0].metric);
    setUnit(defaultPairs[0].unit);
  }, [environmentalDomain]);

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
      });
  }, [API_URL]);

  // Handle AI Text/PDF Extraction
  const handleExtractClaims = async () => {
    if (!reportText.trim()) return;
    setExtracting(true);
    try {
      const res = await fetch(`${API_URL}/ai/extract-claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reportText })
      });
      const data = await res.json();
      setExtractedCandidates(data.candidates || []);
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setExtracting(false);
    }
  };

  const applyExtractedCandidate = (cand) => {
    setEnvironmentalDomain(cand.domain || 'carbon');
    setMetric(cand.metric || 'CO2 emissions');
    setTonnage(String(cand.value));
    setUnit(cand.unit || 'tonnes CO2e');
    setPeriod(cand.period || '2025');
    setProjectName(`Extracted: ${cand.metric} Claim`);
    setRegion('Global Operations');
    setShowExtractorModal(false);
  };

  // Oracle Ingestion Source Switcher
  const [sourceType, setSourceType] = useState('MANUAL_UPLOAD'); // 'MANUAL_UPLOAD' | 'IOT_SENSOR' | 'SATELLITE_ORACLE'
  const [deviceId, setDeviceId] = useState('IOT-SMARTMETER-9901');
  const [stacUrl, setStacUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSubmitResult(null);

    let oracleMetadata = null;
    if (sourceType === 'IOT_SENSOR') {
      oracleMetadata = {
        deviceId,
        oraclePublicKey: demoOrgId,
        telemetryTimestamp: new Date().toISOString(),
        verified: true,
        reading: Number(tonnage),
        unit
      };
    } else if (sourceType === 'SATELLITE_ORACLE') {
      oracleMetadata = {
        stacItemUrl: stacUrl || `https://earth-observation.copernicus.eu/stac/collections/sentinel-2-l2a/items/S2B_LIVE_${Date.now()}`,
        provider: "Copernicus Sentinel-2 STAC",
        oraclePublicKey: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        verified: true,
        spatialResolution: "10m",
        spectralNdvi: 0.785
      };
    }

    const payload = {
      environmentalDomain,
      metric,
      unit,
      period,
      value: Number(tonnage),
      projectName,
      region,
      tonnage: Number(tonnage),
      methodology,
      demoOrgId,
      parentClaimId: null,
      targetProjectId: submissionType === '__dispute__' ? targetProjectId : null,
      sourceType,
      oracleMetadata
    };

    try {
      const response = await fetch(`${API_URL}/claims/submit-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed");
      setSubmitResult(data);
      if (onSuccessSubmit) onSuccessSubmit(data.claimId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-xl border border-slate-200 shadow-xl p-6 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-brand-500" />
            Register Environmental Claim
          </h2>

          <button
            type="button"
            onClick={() => setShowExtractorModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#FDF2F4] hover:bg-[#FCE7EB] text-maroon text-xs font-semibold border border-maroon/20 transition flex items-center gap-1.5"
          >
            <span>🤖 Extract from PDF/Report</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ingestion Source Switcher */}
        <div className="mb-4 bg-[#FAF9F7] p-1.5 rounded-xl border border-slate-200 flex gap-1">
          <button
            type="button"
            onClick={() => setSourceType('MANUAL_UPLOAD')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${sourceType === 'MANUAL_UPLOAD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-navy'}`}
          >
            📁 Manual Upload
          </button>
          <button
            type="button"
            onClick={() => setSourceType('IOT_SENSOR')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${sourceType === 'IOT_SENSOR' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm' : 'text-slate-500 hover:text-navy'}`}
          >
            ⚡ IoT Smart Meter
          </button>
          <button
            type="button"
            onClick={() => setSourceType('SATELLITE_ORACLE')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${sourceType === 'SATELLITE_ORACLE' ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' : 'text-slate-500 hover:text-navy'}`}
          >
            🛰️ Sentinel Satellite
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Domain & Metric Selection */}
          <div className="grid grid-cols-2 gap-4 bg-[#FAF9F7] p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Environmental Domain
              </label>
              <select
                value={environmentalDomain}
                onChange={(e) => setEnvironmentalDomain(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-emerald-700 font-bold focus:outline-none focus:border-brand-500 cursor-pointer capitalize"
              >
                <option value="carbon">🌱 Carbon / GHG Emissions</option>
                <option value="water">💧 Water Consumption & Pollution</option>
                <option value="air">💨 Air Quality & PM2.5</option>
                <option value="waste">♻️ Waste & Recycling</option>
                <option value="forest">🌲 Deforestation & Forest Cover</option>
                <option value="energy">⚡ Renewable Energy & Efficiency</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Metric & Unit
              </label>
              <select
                value={metric}
                onChange={(e) => {
                  setMetric(e.target.value);
                  const selectedPair = (domainMetrics[environmentalDomain] || []).find(m => m.metric === e.target.value);
                  if (selectedPair) setUnit(selectedPair.unit);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-navy focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {(domainMetrics[environmentalDomain] || domainMetrics['carbon']).map(m => (
                  <option key={m.metric} value={m.metric}>
                    {m.metric} ({m.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value, Unit, Period */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Value
              </label>
              <input
                type="number"
                value={tonnage}
                onChange={(e) => setTonnage(e.target.value)}
                placeholder="e.g. 4000"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-navy placeholder-slate-400 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Period
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-navy focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Amazon Water Sequestration"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-navy placeholder-slate-400 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Region / Country
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Rwanda"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-navy placeholder-slate-400 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          {/* Org keys mapping selector */}
          <div>
            <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Submit As (Authorized Organization)
            </label>
            <select
              value={demoOrgId}
              onChange={(e) => setDemoOrgId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-navy focus:outline-none focus:border-brand-500"
            >
              {orgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.displayName} ({org.id.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-maroon hover:bg-maroon-dark disabled:opacity-50 text-white rounded-lg py-2.5 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Signing & Anchoring Multi-Domain Claim...
              </>
            ) : (
              "Anchor Environmental Claim"
            )}
          </button>
        </form>

        {/* AI PDF / Sustainability Report Extractor Modal */}
        {showExtractorModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🤖 AI Sustainability Report Claim Extractor</span>
                </h3>
                <button onClick={() => setShowExtractorModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <p className="text-xs text-slate-400">
                Paste text from your sustainability report or PDF. The AI NLP parser will extract structured candidate claims for your approval before cryptographic registration.
              </p>

              <textarea
                rows={4}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="e.g. 'We reduced our carbon emissions by 40%. Water consumption decreased by 25%. 85% of operational waste was recycled.'"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleExtractClaims}
                  disabled={extracting || !reportText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                >
                  {extracting ? "Extracting Claims..." : "Extract Candidate Claims"}
                </button>
              </div>

              {extractedCandidates.length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <span className="text-xs font-bold text-emerald-400">Extracted {extractedCandidates.length} Claim Candidate(s):</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {extractedCandidates.map((cand, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-white/5 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-bold text-white capitalize">{cand.domain}</span>: {cand.metric} = <strong className="text-emerald-300">{cand.value} {cand.unit}</strong>
                          <p className="text-[11px] text-slate-400 italic font-serif mt-0.5 font-mono">"{cand.statement}"</p>
                        </div>
                        <button
                          onClick={() => applyExtractedCandidate(cand)}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold text-[11px] rounded hover:bg-emerald-400 transition"
                        >
                          Use Claim
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
