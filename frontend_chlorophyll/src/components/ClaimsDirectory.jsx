import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FC] text-[#1677E8] border border-[#1677E8]/20">
            Active
          </span>
        );
      case 'superseded':
        const nextClaim = claims.find(c => c.parentClaimId === claim.claimId);
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#5E6B8A] border border-slate-200">
              Superseded
            </span>
            {nextClaim && (
              <span className="text-[10px] text-[#5E6B8A] font-mono font-medium">
                → v{nextClaim.version}
              </span>
            )}
          </div>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            Disputed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-clean p-6 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAF2FC]">
        <div>
          <h2 className="text-xl font-bold font-sans text-[#172A63] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1677E8]" />
            Environmental Claims Directory
          </h2>
          <p className="text-xs text-[#5E6B8A] font-sans mt-0.5">
            Immutable registry of verified carbon offset claims and audit trails.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5E6B8A]/60" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="clean-search w-52 text-xs py-1.5 pl-8 pr-3"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5 bg-[#FAF9F7] px-2.5 py-1.5 rounded-full border border-[#E2E8F0]">
            <Filter className="h-3 w-3 text-[#5E6B8A]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[#172A63] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Records</option>
              <option value="active">Active Only</option>
              <option value="disputed">Disputed</option>
              <option value="superseded">Superseded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="flex-1 overflow-x-auto mt-4">
        {filteredClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-[#5E6B8A]">
            <FileText className="h-10 w-10 text-[#8DB7F5] mb-2" />
            <p className="font-semibold text-[#172A63] text-sm">No claims match the filter criteria</p>
            <p className="text-xs text-[#5E6B8A] mt-1">Try resetting the search terms or status filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAF2FC] text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider font-sans">
                <th className="py-3 px-3">Claim ID</th>
                <th className="py-3 px-3">Project & Region</th>
                <th className="py-3 px-3">Volume (tCO2e)</th>
                <th className="py-3 px-3">Submitting Org</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FC]">
              {filteredClaims.map((claim) => {
                const isSelected = selectedClaimId === claim.claimId;
                return (
                  <tr
                    key={claim.claimId}
                    onClick={() => onSelectClaim(claim.claimId)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FDF2F4] border-l-4 border-[#7A1028]'
                        : 'hover:bg-[#FAF9F7]'
                    }`}
                  >
                    {/* Claim ID */}
                    <td className="py-3.5 px-3 font-mono font-semibold text-[#7A1028]">
                      {claim.claimId}
                      <span className="block text-[10px] text-[#5E6B8A] font-mono mt-0.5">
                        v{claim.version} • {new Date(claim.timestamp).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Project & Region */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#172A63]">{claim.projectName}</div>
                      <div className="text-[11px] text-[#5E6B8A]">{claim.projectId} • {claim.region}</div>
                    </td>

                    {/* Volume */}
                    <td className="py-3.5 px-3 font-mono font-bold text-[#172A63]">
                      {Number(claim.tonnage).toLocaleString()} t
                    </td>

                    {/* Submitting Org */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-[#5E6B8A]">
                      <span className="truncate block max-w-[140px]" title={claim.orgId}>
                        {claim.orgId}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(claim)}
                        <MockWarningBadge anchored={claim.anchored} mode={claim.blockchainMode} />
                      </div>
                    </td>

                    {/* Inspect Link */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClaim(claim.claimId);
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-[#7A1028] text-white border-[#7A1028]'
                            : 'bg-white hover:bg-[#FDF2F4] text-[#7A1028] border-[#E2E8F0]'
                        }`}
                        title="View Provenance Audit Trail"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
