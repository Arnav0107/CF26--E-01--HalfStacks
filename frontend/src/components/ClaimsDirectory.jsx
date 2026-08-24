import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import MockWarningBadge from './MockWarningBadge';

export default function ClaimsDirectory({ claims, onSelectClaim, selectedClaimId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      <div className="p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-500" />
            Environmental Claims Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying citable claims registered on the environmental data network.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-60">
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
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="active">Active Only</option>
              <option value="disputed">Disputed Only</option>
              <option value="superseded">Superseded Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid/Table */}
      <div className="flex-1 overflow-y-auto max-h-[500px]">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <HelpCircle className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p>No claims found matching filters.</p>
          </div>
        ) : (
          <div className="min-w-full divide-y divide-white/5">
            <table className="min-w-full divide-y divide-white/5 text-left">
              <thead className="bg-dark-800/40 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-3">Claim ID</th>
                  <th className="px-6 py-3">Project ID / Name</th>
                  <th className="px-6 py-3">Region</th>
                  <th className="px-6 py-3 text-right">Tonnage</th>
                  <th className="px-6 py-3 text-center">Version</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right"></th>
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
                      <td className="px-6 py-4 font-mono text-xs text-brand-500 font-semibold">
                        {claim.claimId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100">{claim.projectName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{claim.projectId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-200">{claim.region}</div>
                        <div className="text-xs text-slate-400">{claim.projectType}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-100">
                        {Number(claim.tonnage).toLocaleString()} t
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-dark-700 text-slate-300 px-2 py-0.5 rounded text-xs font-mono">
                          v{claim.version}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(claim)}
                          <MockWarningBadge anchored={claim.anchored} mode={claim.blockchainMode} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isSelected ? 'transform translate-x-1 text-brand-500' : ''}`} />
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
