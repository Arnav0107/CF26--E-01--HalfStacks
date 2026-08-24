import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function ClaimsDirectory({ claims, onSelectClaim, selectedClaimId, onViewProvenanceGraph, onViewOracleModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      claim.status === statusFilter;

    const matchesDomain =
      domainFilter === 'all' ||
      (claim.environmentalDomain || 'carbon').toLowerCase() === domainFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesDomain;
  });

  const getDomainBadge = (domain) => {
    const d = (domain || 'carbon').toLowerCase();
    switch (d) {
      case 'water': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">💧 WATER</span>;
      case 'air': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">💨 AIR</span>;
      case 'waste': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">♻️ WASTE</span>;
      case 'forest': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">🌲 FOREST</span>;
      case 'energy': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">⚡ ENERGY</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🌱 CARBON</span>;
    }
  };

  const getAIConsistencyBadge = (claim) => {
    const res = claim.consistencyResult;
    if (!res) return null;
    if (res.status === 'SUPPORTED') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ AI Validated</span>;
    } else if (res.status === 'INCONSISTENT') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">⚠️ AI Inconsistent</span>;
    } else if (res.status === 'REQUIRES_REVIEW') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠️ AI Variance</span>;
    }
    return null;
  };

  const getStatusBadge = (claim) => {
    const status = claim.status;
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            Active
          </span>
        );
      case 'superseded':
        const nextClaim = claims.find(c => c.parentClaimId === claim.claimId);
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/25">
              Superseded
            </span>
            {nextClaim && (
              <span className="text-[10px] text-slate-500 font-mono font-semibold italic">
                → superseded by v{nextClaim.version}
              </span>
            )}
          </div>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
            Disputed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/25">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="glass rounded-xl border border-white/5 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-white/5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" />
              Multi-Domain Environmental Evidence Directory
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Displaying citable claims registered on the environmental data network.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-52">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search project, ID, claim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-slate-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All States</option>
                <option value="active">Active Only</option>
                <option value="disputed">Disputed Only</option>
                <option value="superseded">Superseded Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Environmental Domain Filter Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Domain Filter:</span>
          {['all', 'carbon', 'water', 'air', 'waste', 'forest', 'energy'].map(dom => (
            <button
              key={dom}
              onClick={() => setDomainFilter(dom)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                domainFilter === dom
                  ? 'bg-emerald-500 text-white font-bold shadow-md'
                  : 'bg-dark-800 text-slate-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid/Table */}
      <div className="flex-1 overflow-y-auto max-h-[500px]">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <HelpCircle className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p>No environmental claims found matching active filters.</p>
          </div>
        ) : (
          <div className="min-w-full divide-y divide-white/5">
            <table className="min-w-full divide-y divide-white/5 text-left">
              <thead className="bg-dark-800/40 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-3">Domain</th>
                  <th className="px-6 py-3">Claim ID</th>
                  <th className="px-6 py-3">Project & Metric</th>
                  <th className="px-6 py-3 text-right">Value & Unit</th>
                  <th className="px-6 py-3 text-center">AI Analysis</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Lineage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {filteredClaims.map((claim) => {
                  const isSelected = selectedClaimId === claim.claimId;
                  return (
                    <tr 
                      key={claim.claimId}
                      onClick={() => onSelectClaim(claim.claimId)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? 'bg-brand-500/10 border-l-2 border-brand-500' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-6 py-4">
                        {getDomainBadge(claim.environmentalDomain)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-brand-500 font-semibold">
                        <div>{claim.claimId}</div>
                        {claim.sourceType === 'IOT_SENSOR' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (onViewOracleModal) onViewOracleModal(claim); }}
                            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1"
                          >
                            ⚡ IoT Sensor
                          </button>
                        )}
                        {claim.sourceType === 'SATELLITE_ORACLE' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (onViewOracleModal) onViewOracleModal(claim); }}
                            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition flex items-center gap-1"
                          >
                            🛰️ Satellite Oracle
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100">{claim.projectName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{claim.projectId} • {claim.metric || 'CO2 emissions'}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-100">
                        {Number(claim.value !== undefined ? claim.value : claim.tonnage).toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal ml-1">{claim.unit || 'tonnes CO2e'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getAIConsistencyBadge(claim)}
                          {claim.anomalyResult?.isAnomalous && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">🔴 Outlier Flagged</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(claim)}
                          <MockWarningBadge anchored={claim.anchored} mode={claim.blockchainMode} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClaim(claim.claimId);
                            if (onViewProvenanceGraph) onViewProvenanceGraph(claim);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-400 border border-emerald-500/30 transition"
                        >
                          Graph →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
