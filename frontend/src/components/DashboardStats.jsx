import React from 'react';
import { Database, ShieldAlert, Award, TrendingUp } from 'lucide-react';

export default function DashboardStats({ claims, disputes }) {
  const totalClaims = claims.length;
  const activeClaims = claims.filter(c => c.status === 'active' || c.status === 'disputed').length;
  const activeDisputes = disputes.length;

  const inconsistenciesCount = claims.filter(c => c.consistencyResult && (c.consistencyResult.status === 'INCONSISTENT' || c.consistencyResult.status === 'REQUIRES_REVIEW')).length;
  const anomaliesCount = claims.filter(c => c.anomalyResult && c.anomalyResult.isAnomalous).length;

  // Domain counts breakdown
  const domainCounts = claims.reduce((acc, c) => {
    const d = c.environmentalDomain || 'carbon';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      name: 'Total Claims Anchored',
      value: totalClaims,
      subtext: `${activeClaims} active versions`,
      icon: Database,
      color: 'text-maroon',
      bgColor: 'bg-maroon/10'
    },
    {
      name: 'Environmental Domains',
      value: Object.keys(domainCounts).length || 1,
      subtext: `${domainCounts['carbon'] || 0} Carbon, ${domainCounts['water'] || 0} Water, ${domainCounts['air'] || 0} Air, ${domainCounts['waste'] || 0} Waste`,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      name: 'AI Evidence Alerts',
      value: `${inconsistenciesCount} Var / ${anomaliesCount} Anom`,
      subtext: inconsistenciesCount > 0 ? 'AI detected claim variances' : 'All evidence consistent',
      icon: ShieldAlert,
      color: (inconsistenciesCount > 0 || anomaliesCount > 0) ? 'text-amber-500' : 'text-slate-500',
      bgColor: (inconsistenciesCount > 0 || anomaliesCount > 0) ? 'bg-amber-50' : 'bg-slate-105'
    },
    {
      name: 'Active Disputes',
      value: activeDisputes,
      subtext: activeDisputes > 0 ? 'Requires authority resolution' : 'No conflicting claims',
      icon: Award,
      color: activeDisputes > 0 ? 'text-rose-600 animate-pulse' : 'text-purple-600',
      bgColor: activeDisputes > 0 ? 'bg-rose-50' : 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass bg-white rounded-xl p-5 border border-slate-200 shadow flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{stat.name}</p>
              <h3 className="text-2xl font-black text-navy mt-1">{stat.value}</h3>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{stat.subtext}</p>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Domain Quick Filters Banner */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 glass rounded-lg border border-slate-200 text-xs text-navy bg-white shadow-sm">
        <span className="font-bold text-navy uppercase tracking-wider mr-2">Tracked Domains:</span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">🌱 Carbon ({domainCounts['carbon'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">💧 Water ({domainCounts['water'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200">💨 Air Quality ({domainCounts['air'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">♻️ Waste ({domainCounts['waste'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-800 font-semibold border border-green-200">🌲 Forest ({domainCounts['forest'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-800 font-semibold border border-yellow-200">⚡ Energy ({domainCounts['energy'] || 0})</span>
      </div>
    </div>
  );
}
