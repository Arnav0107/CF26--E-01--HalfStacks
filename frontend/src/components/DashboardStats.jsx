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
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
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
      color: (inconsistenciesCount > 0 || anomaliesCount > 0) ? 'text-amber-400' : 'text-slate-400',
      bgColor: (inconsistenciesCount > 0 || anomaliesCount > 0) ? 'bg-amber-500/10' : 'bg-slate-500/10'
    },
    {
      name: 'Active Disputes',
      value: activeDisputes,
      subtext: activeDisputes > 0 ? 'Requires authority resolution' : 'No conflicting claims',
      icon: Award,
      color: activeDisputes > 0 ? 'text-rose-500 animate-pulse' : 'text-purple-500',
      bgColor: activeDisputes > 0 ? 'bg-rose-500/10' : 'bg-purple-500/10'
    }
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass rounded-xl p-5 border border-white/5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.name}</p>
              <h3 className="text-xl font-bold text-white mt-1">{stat.value}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{stat.subtext}</p>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Domain Quick Filters Banner */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 glass rounded-lg border border-white/5 text-xs text-slate-300">
        <span className="font-semibold text-slate-400 uppercase tracking-wider mr-2">Tracked Domains:</span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">🌱 Carbon ({domainCounts['carbon'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 font-medium">💧 Water ({domainCounts['water'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">💨 Air Quality ({domainCounts['air'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-medium">♻️ Waste ({domainCounts['waste'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">🌲 Forest ({domainCounts['forest'] || 0})</span>
        <span className="px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">⚡ Energy ({domainCounts['energy'] || 0})</span>
      </div>
    </div>
  );
}
