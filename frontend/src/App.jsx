import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, GitCommit, ShieldAlert, FlaskConical, PlusCircle, Search, ArrowLeft, Award, HelpCircle } from 'lucide-react';
import HeroJellyfishVisual from './components/HeroJellyfishVisual';
import DashboardStats from './components/DashboardStats';
import ClaimsDirectory from './components/ClaimsDirectory';
import ClaimTimeline from './components/ClaimTimeline';
import DisputesPanel from './components/DisputesPanel';
import TamperLab from './components/TamperLab';
import SubmitClaimForm from './components/SubmitClaimForm';
import UpdateClaimForm from './components/UpdateClaimForm';
import ProvenanceGraphModal from './components/ProvenanceGraphModal';
import ComplianceDashboard from './components/ComplianceDashboard';
import OracleTelemetryModal from './components/OracleTelemetryModal';

const API_URL = "http://localhost:5000/api";

/* ─── Brand Icon Logo ────────────────────────────────────────── */
function ChlorophyllLogo({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="5.5" stroke="#7A1028" strokeWidth="2.5" />
      {/* 8 radiating notches matching the reference logo */}
      <path d="M12 2V4.5M12 19.5V22M2 12H4.5M19.5 12H22M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93" stroke="#7A1028" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Blue Circle Check Icon ─────────────────────────────────── */
function BlueCheck() {
  return (
    <div className="w-4 h-4 rounded-full bg-[#1677E8] flex items-center justify-center shrink-0 shadow-sm">
      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2.5 6 5 8.5 9.5 3.5" />
      </svg>
    </div>
  );
}

/* ─── Landing Page View ──────────────────────────────────────── */
function LandingPage({ claims, disputes, onEnterDashboard, blockchainConnected }) {
  const displayClaimsCount = claims.length > 0 ? claims.length.toString() : "0";
  const totalTonnage = claims.reduce((s, c) => s + (Number(c.tonnage) || 0), 0);
  const displayTonnage = totalTonnage > 0 
    ? (totalTonnage / 1_000_000).toFixed(1) + "M"
    : "0M";
  const displayDisputes = disputes.length > 0 ? disputes.length.toString() : "0";

  return (
    <div className="min-h-screen flex flex-col relative" style={{overflowX: 'clip'}}>
      {/* TOP NAVIGATION BAR */}
      <header className="relative z-50 flex items-center justify-between px-6 sm:px-12 py-5 max-w-[1440px] mx-auto w-full">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onEnterDashboard}>
          <ChlorophyllLogo className="w-6 h-6 shrink-0" />
          <span className="font-brand italic text-[#7A1028] text-2xl font-semibold tracking-wider">
            CHLOROPHYLL
          </span>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-9">
          {['Emissions', 'Reports', 'Energy', 'Datasets'].map((link) => (
            <button
              key={link}
              onClick={onEnterDashboard}
              className="nav-clean-link text-sm font-medium"
            >
              {link}
            </button>
          ))}
        </nav>

        {/* Right: Search + Connect */}
        <div className="flex items-center gap-3.5">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E6B8A]/60" />
            <input
              type="text"
              placeholder="Search data..."
              className="clean-search w-48 text-xs font-normal"
            />
          </div>
          <button
            onClick={onEnterDashboard}
            className="btn-maroon text-xs font-semibold px-6 py-2 tracking-wide"
          >
            Connect
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 sm:px-12 pt-4 pb-12 flex flex-col gap-10" style={{overflow: 'visible'}}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start" style={{overflow: 'visible'}}>
          
          {/* Left Column: Metrics, Main Title, CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center pr-0 lg:pr-6">
            
            {/* Top Row: 2 KPI Cards */}
            <div className="grid grid-cols-2 gap-4 max-w-[480px]">
              <div className="card-maroon-tint rounded-2xl p-5 transition-all hover:shadow-clean-hover">
                <span className="block text-[10px] font-bold text-[#7A1028] uppercase tracking-wider font-sans">
                  CLAIMS VERIFIED
                </span>
                <span className="block text-3xl sm:text-4xl font-normal text-[#172A63] mt-2 font-sans">
                  {displayClaimsCount}
                </span>
              </div>

              <div className="card-maroon-tint rounded-2xl p-5 transition-all hover:shadow-clean-hover">
                <span className="block text-[10px] font-bold text-[#7A1028] uppercase tracking-wider font-sans">
                  VOLUME TRACKED
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-semibold text-[#172A63] font-sans tracking-tight">
                    {displayTonnage}
                  </span>
                  <span className="text-sm font-medium text-[#172A63]">Tons</span>
                </div>
              </div>
            </div>

            {/* Middle: Giant Editorial Title */}
            <div className="mt-8 mb-6">
              <h1 className="font-brand italic font-semibold text-[#7A1028] tracking-[0.02em] leading-none text-6xl sm:text-7xl md:text-8xl select-none">
                CHLOROPHYLL
              </h1>
              <p className="text-[#5E6B8A] font-body text-base sm:text-lg mt-3.5 font-normal tracking-normal">
                Decentralized Environmental Data Provenance
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <button
                onClick={onEnterDashboard}
                className="btn-maroon text-xs font-semibold px-7 py-3"
              >
                Explore Network
              </button>
              <button
                onClick={onEnterDashboard}
                className="btn-outline-maroon text-xs font-semibold px-7 py-3"
              >
                View Documentation
              </button>
            </div>

            {/* Bottom Row: 2 KPI Cards (Active Disputes + Integrity Score) */}
            <div className="grid grid-cols-2 gap-4 max-w-[480px] mt-8">
              <div className="card-blue-tint rounded-2xl p-5 transition-all hover:shadow-clean-hover">
                <span className="block text-[10px] font-bold text-[#1677E8] uppercase tracking-wider font-sans">
                  ACTIVE DISPUTES
                </span>
                <span className="block text-3xl sm:text-4xl font-normal text-[#172A63] mt-2 font-sans">
                  {displayDisputes}
                </span>
              </div>

              <div className="card-blue-tint rounded-2xl p-5 transition-all hover:shadow-clean-hover">
                <span className="block text-[10px] font-bold text-[#1677E8] uppercase tracking-wider font-sans">
                  INTEGRITY SCORE
                </span>
                <span className="block text-3xl sm:text-4xl font-normal text-[#172A63] mt-2 font-sans">
                  99.98%
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Jellyfish */}
          <div
            className="lg:col-span-6 relative"
            style={{
              minHeight: '520px',
              overflow: 'visible',
            }}
          >
            <HeroJellyfishVisual />
          </div>

        </div>

        {/* REAL-TIME AUTHENTICITY & DATA PACKET SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-4">
          
          <div className="lg:col-span-4 bg-white/95 rounded-2xl p-7 border border-[#8DB7F5]/30 shadow-clean flex flex-col justify-between">
            <div>
              <h2 className="font-brand font-bold text-2xl sm:text-3xl text-[#7A1028] mb-3.5 tracking-tight">
                Real-time Authenticity
              </h2>
              <p className="text-[#5E6B8A] text-sm leading-relaxed font-body">
                Every data point entering the Benthic network is subjected to rigorous
                cryptographic verification. Ensure the history and integrity of environmental
                claims before they are finalized.
              </p>
            </div>
            <div className="mt-8">
              <div className="w-12 h-0.5 bg-[#7A1028] rounded-full" />
            </div>
          </div>

          <div className="lg:col-span-8 bg-white/95 rounded-2xl p-7 border border-[#8DB7F5]/30 shadow-clean flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#EAF2FC]">
              <span className="font-sans font-bold text-xs tracking-wider text-[#1677E8] uppercase">
                DATA PACKET #8G2-A
              </span>
              <span className="font-sans font-semibold text-xs text-[#1677E8]">
                0.4s ago
              </span>
            </div>

            <div className="divide-y divide-[#EAF2FC] text-sm font-sans font-medium text-[#172A63]">
              <div className="py-3.5 flex items-center justify-between">
                <span>Source Signature</span>
                <BlueCheck />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span>Historical Continuity</span>
                <BlueCheck />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span>Cryptographic Hash</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#172A63]">0x7f...3a9b</span>
                  <BlueCheck />
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span>Timestamp</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#172A63]">2025-06-15 12:00:00 UTC</span>
                  <BlueCheck />
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <span>Network Validation</span>
                <BlueCheck />
              </div>
            </div>
          </div>

        </section>
      </main>

      <footer className="mt-auto py-6 px-6 sm:px-12 border-t border-[#E5E7EB]/80 max-w-[1440px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#5E6B8A]">
        <div className="flex items-center gap-2">
          <ChlorophyllLogo className="w-4 h-4 shrink-0" />
          <span className="font-brand italic text-[#7A1028] font-semibold text-sm">CHLOROPHYLL</span>
        </div>
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} Benthic Provenance Network. All records verified on-chain.
        </p>
        <div className="flex items-center gap-5">
          <span className="hover:text-[#7A1028] cursor-pointer transition-colors">Privacy Protocol</span>
          <span className="hover:text-[#7A1028] cursor-pointer transition-colors">Node Status</span>
          <span className="hover:text-[#7A1028] cursor-pointer transition-colors">API Docs</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Dashboard View (Network Explorer & Verification Console) ─── */
function DashboardView({ 
  claims, 
  disputes, 
  loading, 
  error, 
  blockchainConnected, 
  contractFound, 
  fetchData, 
  onGoHome,
  selectedClaimId,
  setSelectedClaimId,
  setGraphClaimModal,
  setOracleModalClaim,
  activeTab,
  setActiveTab
}) {

  useEffect(() => {
    if (claims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(claims[0].claimId);
    }
  }, [claims, selectedClaimId, setSelectedClaimId]);

  const handleSelectClaim = (claimId) => setSelectedClaimId(claimId);

  const tabs = [
    { id: 'directory', icon: <Database className="h-4 w-4" />, label: 'Claims Directory' },
    { id: 'disputes', icon: <ShieldAlert className="h-4 w-4" />, label: 'Disputes', badge: disputes.length },
    { id: 'tamper', icon: <FlaskConical className="h-4 w-4" />, label: 'Tamper Lab' },
    { id: 'compliance', icon: <Award className="h-4 w-4" />, label: 'Regulatory Compliance' },
    { id: 'submit', icon: <PlusCircle className="h-4 w-4" />, label: 'Submit Claim' },
    { id: 'update', icon: <GitCommit className="h-4 w-4" />, label: 'Update Claim' },
  ];

  return (
    <div className="theme-light min-h-screen flex flex-col bg-[#FAF9F7] text-navy">
      {/* Dashboard Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] px-6 sm:px-12 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2.5 group">
            <ArrowLeft className="h-4 w-4 text-[#5E6B8A] group-hover:text-[#7A1028] transition-colors" />
            <ChlorophyllLogo className="w-5 h-5 shrink-0" />
            <span className="font-brand italic text-[#7A1028] text-xl font-bold tracking-wide">
              CHLOROPHYLL
            </span>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${blockchainConnected && contractFound ? 'bg-[#1677E8] animate-ping' : 'bg-amber-500 animate-pulse'}`} />
              <span className="font-mono text-[11px] text-[#5E6B8A] font-semibold">
                {blockchainConnected && contractFound ? 'Node Connected (On-Chain)' : 'Local JSON Store (Mock Mode)'}
              </span>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="btn-outline-maroon text-xs font-semibold px-4 py-1.5 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-12 mt-4">
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-50 text-sm flex items-center gap-3 text-red-800">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold font-sans">API Connection Notice</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Main Area */}
      <main className="flex-1 p-6 sm:px-12 max-w-[1440px] w-full mx-auto flex flex-col gap-6">
        <DashboardStats claims={claims} disputes={disputes} />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Left / Center Panels */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tab Bar */}
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm self-start">
              {tabs.map(({ id, icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === id
                      ? 'bg-[#7A1028] text-white shadow-sm font-semibold'
                      : 'text-[#5E6B8A] hover:text-[#7A1028] hover:bg-[#FDF2F4]'
                  }`}
                >
                  {icon}
                  {label}
                  {badge > 0 && (
                    <span className="ml-1 bg-[#1677E8] text-white rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold font-mono">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content Container */}
            <div className="flex-1 min-h-[520px]">
              {activeTab === 'directory' && (
                <ClaimsDirectory
                  claims={claims}
                  onSelectClaim={handleSelectClaim}
                  selectedClaimId={selectedClaimId}
                  onViewProvenanceGraph={(claim) => setGraphClaimModal(claim)}
                  onViewOracleModal={(claim) => setOracleModalClaim(claim)}
                />
              )}
              {activeTab === 'compliance' && (
                <ComplianceDashboard claims={claims} />
              )}
              {activeTab === 'disputes' && (
                <DisputesPanel
                  claims={claims}
                  onInspectClaim={(id) => {
                    handleSelectClaim(id);
                    setActiveTab('directory');
                  }}
                  onRefreshData={fetchData}
                  API_URL={API_URL}
                />
              )}
              {activeTab === 'tamper' && (
                <TamperLab
                  claims={claims}
                  onRefreshData={fetchData}
                  API_URL={API_URL}
                />
              )}
              {activeTab === 'submit' && (
                <SubmitClaimForm
                  claims={claims}
                  onSuccessSubmit={(id) => {
                    fetchData();
                    setSelectedClaimId(id);
                    setActiveTab('directory');
                  }}
                  API_URL={API_URL}
                />
              )}
              {activeTab === 'update' && (
                <UpdateClaimForm
                  claims={claims}
                  onSuccessSubmit={(id) => {
                    fetchData();
                    setSelectedClaimId(id);
                    setActiveTab('directory');
                  }}
                  API_URL={API_URL}
                />
              )}
            </div>
          </div>

          {/* Right Panel: Ancestry & Signature Verification Timeline */}
          <div className="lg:col-span-1 min-h-[520px]">
            <ClaimTimeline
              claimId={selectedClaimId}
              claims={claims}
              API_URL={API_URL}
              onViewProvenanceGraph={(claim) => setGraphClaimModal(claim)}
            />
          </div>
        </div>
      </main>

      <footer className="py-6 px-6 sm:px-12 border-t border-[#E5E7EB] text-center font-mono text-[11px] text-[#5E6B8A]">
        © {new Date().getFullYear()} Benthic Provenance Network • Cryptographically Secured via ECDSA Signature Anchors.
      </footer>
    </div>
  );
}

/* ─── Root App Component ─────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'
  const [claims, setClaims] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [activeTab, setActiveTab] = useState('directory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockchainConnected, setBlockchainConnected] = useState(false);
  const [contractFound, setContractFound] = useState(false);
  const [graphClaimModal, setGraphClaimModal] = useState(null);
  const [oracleModalClaim, setOracleModalClaim] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [claimsRes, disputesRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/claims`),
        fetch(`${API_URL}/disputes`),
        fetch(`${API_URL}/status`).catch(() => null),
      ]);
      if (!claimsRes.ok || !disputesRes.ok) {
        throw new Error('Failed to fetch data from backend API.');
      }
      const claimsData = await claimsRes.json();
      const disputesData = await disputesRes.json();
      if (statusRes && statusRes.ok) {
        const s = await statusRes.json();
        setBlockchainConnected(!!s.blockchainConnected);
        setContractFound(!!s.contractFound);
      }
      setClaims(claimsData);
      setDisputes(disputesData);
    } catch (err) {
      console.error(err);
      setError("Backend server is not running or unreachable. Please run 'npm start' in the backend first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (view === 'landing') {
    return (
      <LandingPage
        claims={claims}
        disputes={disputes}
        blockchainConnected={blockchainConnected}
        onEnterDashboard={() => setView('dashboard')}
      />
    );
  }

  return (
    <>
      <DashboardView
        claims={claims}
        disputes={disputes}
        loading={loading}
        error={error}
        blockchainConnected={blockchainConnected}
        contractFound={contractFound}
        fetchData={fetchData}
        onGoHome={() => setView('landing')}
        selectedClaimId={selectedClaimId}
        setSelectedClaimId={setSelectedClaimId}
        setGraphClaimModal={setGraphClaimModal}
        setOracleModalClaim={setOracleModalClaim}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Provenance Lineage Graph Modal */}
      {graphClaimModal && (
        <ProvenanceGraphModal
          claim={graphClaimModal}
          API_URL={API_URL}
          onClose={() => setGraphClaimModal(null)}
        />
      )}

      {/* Oracle Telemetry Verification Modal */}
      {oracleModalClaim && (
        <OracleTelemetryModal
          claim={oracleModalClaim}
          onClose={() => setOracleModalClaim(null)}
        />
      )}
    </>
  );
}
