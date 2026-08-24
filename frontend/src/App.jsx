import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, RefreshCw, GitCommit, ShieldAlert, FlaskConical, LayoutDashboard } from 'lucide-react';
import DashboardStats from './components/DashboardStats';
import ClaimsDirectory from './components/ClaimsDirectory';
import ClaimTimeline from './components/ClaimTimeline';
import DisputesPanel from './components/DisputesPanel';
import TamperLab from './components/TamperLab';

const API_URL = "http://localhost:5000/api";

export default function App() {
  const [claims, setClaims] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [activeTab, setActiveTab] = useState('directory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockchainConnected, setBlockchainConnected] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch claims, disputes, and status in parallel
      const [claimsRes, disputesRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/claims`),
        fetch(`${API_URL}/disputes`),
        fetch(`${API_URL}/status`).catch(() => null)
      ]);

      if (!claimsRes.ok || !disputesRes.ok) {
        throw new Error("Failed to fetch data from backend API.");
      }

      const claimsData = await claimsRes.json();
      const disputesData = await disputesRes.json();
      
      let isConnected = false;
      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json();
        isConnected = !!statusData.blockchainConnected;
      }
      setBlockchainConnected(isConnected);

      setClaims(claimsData);
      setDisputes(disputesData);

      // Auto-select first claim if none selected and claims exist
      if (claimsData.length > 0 && !selectedClaimId) {
        setSelectedClaimId(claimsData[0].claimId);
      }
    } catch (err) {
      console.error("Error loading network data:", err);
      setError("Backend server is not running or unreachable. Please run 'npm start' in the backend first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectClaim = (claimId) => {
    setSelectedClaimId(claimId);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              GreenProof
              <span className="text-4xs font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                PROVENANCE NETWORK
              </span>
            </h1>
            <p className="text-3xs text-slate-400 font-mono mt-0.5">Decentralized Environmental Data Integrity Network</p>
          </div>
        </div>

        {/* Network status and refresh */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${blockchainConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-slate-300 font-medium font-mono">
              Local Node: {blockchainConnected ? 'Connected' : 'Disconnected (Mock Mode)'}
            </span>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-slate-200 border border-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="m-6 p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-slate-300 text-sm flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-white">API Connection Error</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Statistics Cards */}
        <DashboardStats claims={claims} disputes={disputes} />

        {/* Layout Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left / Center Panels: View Selector */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tabs Navigation */}
            <div className="flex bg-dark-800 p-1 rounded-xl border border-white/5 select-none self-start">
              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'directory' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="h-4 w-4" />
                Claims Directory
              </button>
              <button
                onClick={() => setActiveTab('disputes')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  activeTab === 'disputes' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                Disputes
                {disputes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-dark-900 rounded-full h-4 w-4 flex items-center justify-center text-3xs font-bold font-mono">
                    {disputes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('tamper')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'tamper' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FlaskConical className="h-4 w-4" />
                Tamper Lab
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-[500px]">
              {activeTab === 'directory' && (
                <ClaimsDirectory 
                  claims={claims} 
                  onSelectClaim={handleSelectClaim} 
                  selectedClaimId={selectedClaimId} 
                />
              )}
              {activeTab === 'disputes' && (
                <DisputesPanel 
                  claims={claims} 
                  onInspectClaim={(id) => {
                    handleSelectClaim(id);
                    setActiveTab('directory');
                  }} 
                />
              )}
              {activeTab === 'tamper' && (
                <TamperLab 
                  claims={claims} 
                  onRefreshData={fetchData} 
                  API_URL={API_URL} 
                />
              )}
            </div>
          </div>

          {/* Right Panel: Ancestry timeline (Always Visible) */}
          <div className="lg:col-span-1 min-h-[500px]">
            <ClaimTimeline 
              claimId={selectedClaimId} 
              claims={claims} 
              API_URL={API_URL} 
            />
          </div>
        </div>
      </main>

      <footer className="mt-auto py-6 px-6 border-t border-white/5 text-center text-3xs text-slate-500 font-mono">
        &copy; {new Date().getFullYear()} GreenProof Environmental Provenance Network. Cryptographically Secured via ECDSA & Blockchain Anchor hashes.
      </footer>
    </div>
  );
}
