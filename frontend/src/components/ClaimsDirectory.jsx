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
      case 'water': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">💧 WATER</span>;
      case 'air': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 whitespace-nowrap">💨 AIR</span>;
      case 'waste': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">♻️ WASTE</span>;
      case 'forest': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-800 border border-green-200 whitespace-nowrap">🌲 FOREST</span>;
      case 'energy': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200 whitespace-nowrap">⚡ ENERGY</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">🌱 CARBON</span>;
    }
  };

  const getAIConsistencyBadge = (claim) => {
    const res = claim.consistencyResult;
    if (!res) return null;
    if (res.status === 'SUPPORTED') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-850 border border-emerald-250 whitespace-nowrap">✓ AI Validated</span>;
    } else if (res.status === 'INCONSISTENT') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-800 border border-red-200 whitespace-nowrap animate-pulse">⚠️ AI Inconsistent</span>;
    } else if (res.status === 'REQUIRES_REVIEW') {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">⚠️ AI Variance</span>;
    }
    return null;
  };

  const getStatusBadge = (claim) => {
    const status = claim.status;
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            Active
          </span>
        );
      case 'superseded':
        const nextClaim = claims.find(c => c.parentClaimId === claim.claimId);
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
              Superseded
            </span>
            {nextClaim && (
              <span className="text-[10px] text-slate-600 font-mono font-semibold italic whitespace-nowrap">
                → superseded by v{nextClaim.version}
              </span>
            )}
          </div>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap animate-pulse">
            Disputed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="glass rounded-xl border border-slate-200 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" />
              Multi-Domain Environmental Evidence Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
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
                className="w-full bg-[#FAF9F7] border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-navy placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center bg-[#FAF9F7] border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-slate-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-navy focus:outline-none cursor-pointer text-xs font-semibold"
              >
                <option value="all" className="bg-white text-navy">All States</option>
                <option value="active" className="bg-white text-navy">Active Only</option>
                <option value="disputed" className="bg-white text-navy">Disputed Only</option>
                <option value="superseded" className="bg-white text-navy">Superseded Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Environmental Domain Filter Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-bold mr-1 text-[11px]">Domain Filter:</span>
          {['all', 'carbon', 'water', 'air', 'waste', 'forest', 'energy'].map(dom => (
            <button
              key={dom}
              onClick={() => setDomainFilter(dom)}
              className={`px-3 py-1 rounded-lg capitalize font-semibold transition ${
                domainFilter === dom
                  ? 'bg-maroon text-white font-bold shadow-md'
                  : 'bg-[#FAF9F7] text-slate-700 hover:text-maroon hover:bg-[#FDF2F4] border border-slate-200'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid/Table */}
      <div className="flex-1 overflow-auto max-h-[500px] w-full border border-slate-200 rounded-xl bg-white shadow-sm">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <HelpCircle className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p>No environmental claims found matching active filters.</p>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full divide-y divide-slate-200 text-left table-fixed">
              <thead className="bg-[#FAF9F7] text-xs font-bold text-navy uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 w-[100px] min-w-[100px]">Domain</th>
                  <th className="px-6 py-3 w-[140px] min-w-[140px]">Claim ID</th>
                  <th className="px-6 py-3 w-[300px] min-w-[300px]">Project & Metric</th>
                  <th className="px-6 py-3 text-right w-[140px] min-w-[140px]">Value & Unit</th>
                  <th className="px-6 py-3 text-center w-[150px] min-w-[150px]">AI Analysis</th>
                  <th className="px-6 py-3 w-[170px] min-w-[170px]">Status</th>
                  <th className="px-6 py-3 text-right w-[100px] min-w-[100px]">Lineage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredClaims.map((claim) => {
                  const isSelected = selectedClaimId === claim.claimId;
                  return (
                    <tr 
                      key={claim.claimId}
                      onClick={() => onSelectClaim(claim.claimId)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? 'bg-maroon/5 border-l-2 border-maroon' 
                          : 'hover:bg-[#FAF9F7]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        {getDomainBadge(claim.environmentalDomain)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-maroon font-semibold">
                        <div>{claim.claimId}</div>
                        {claim.sourceType === 'IOT_SENSOR' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (onViewOracleModal) onViewOracleModal(claim); }}
                            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 transition flex items-center gap-1"
                          >
                            ⚡ IoT Sensor
                          </button>
                        )}
                        {claim.sourceType === 'SATELLITE_ORACLE' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (onViewOracleModal) onViewOracleModal(claim); }}
                            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition flex items-center gap-1"
                          >
                            🛰️ Satellite Oracle
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy">{claim.projectName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{claim.projectId} • {claim.metric || 'CO2 emissions'}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-navy">
                        {Number(claim.value !== undefined ? claim.value : claim.tonnage).toLocaleString()}
                        <span className="text-xs text-slate-500 font-normal ml-1">{claim.unit || 'tonnes CO2e'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getAIConsistencyBadge(claim)}
                          {claim.anomalyResult?.isAnomalous && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🔴 Outlier Flagged</span>
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
                          className="px-2.5 py-1 rounded bg-[#FDF2F4] hover:bg-[#FCE7EB] text-maroon border border-maroon/20 text-xs font-mono transition"
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
