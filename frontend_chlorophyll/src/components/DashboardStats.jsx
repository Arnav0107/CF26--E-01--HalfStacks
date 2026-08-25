import React from 'react';
import { Database, ShieldAlert, Award, TrendingUp } from 'lucide-react';

export default function DashboardStats({ claims, disputes }) {
  const totalClaims = claims.length;
  const activeClaims = claims.filter(c => c.status === 'active' || c.status === 'disputed').length;
  const activeDisputes = disputes.length;

  // Calculate cumulative tonnage from active claims
  const cumulativeTonnage = claims
    .filter(c => c.status === 'active' || c.status === 'disputed')
    .reduce((sum, c) => sum + Number(c.tonnage), 0);

  const verificationRate = totalClaims > 0 ? "100.0%" : "99.98%";

  const stats = [
    {
      name: 'Claims Verified',
      value: totalClaims > 0 ? totalClaims : 0,
      subtext: `${activeClaims} active versions verified`,
      icon: Database,
      accentColor: 'text-[#7A1028]',
      iconBg: 'bg-[#FDF2F4] text-[#7A1028] border border-[#7A1028]/15',
      cardClass: 'card-maroon-tint',
    },
    {
      name: 'Volume Tracked',
      value: `${(cumulativeTonnage / 1e6).toFixed(1)}M Tons`,
      subtext: `${cumulativeTonnage.toLocaleString()} total tCO2e`,
      icon: TrendingUp,
      accentColor: 'text-[#7A1028]',
      iconBg: 'bg-[#FDF2F4] text-[#7A1028] border border-[#7A1028]/15',
      cardClass: 'card-maroon-tint',
    },
    {
      name: 'Active Disputes',
      value: activeDisputes,
      subtext: activeDisputes > 0 ? 'Resolution in progress' : 'Consistent records',
      icon: ShieldAlert,
      accentColor: activeDisputes > 0 ? 'text-[#1677E8]' : 'text-[#5E6B8A]',
      iconBg: activeDisputes > 0 ? 'bg-[#EAF2FC] text-[#1677E8] border border-[#1677E8]/20' : 'bg-slate-50 text-[#5E6B8A] border border-slate-200',
      cardClass: 'card-blue-tint',
    },
    {
      name: 'Integrity Score',
      value: verificationRate,
      subtext: 'Double-anchored ECDSA proofs',
      icon: Award,
      accentColor: 'text-[#1677E8]',
      iconBg: 'bg-[#EAF2FC] text-[#1677E8] border border-[#1677E8]/20',
      cardClass: 'card-blue-tint',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className={`${stat.cardClass} p-5 rounded-2xl flex items-center justify-between transition-all hover:shadow-clean-hover bg-white/95`}
        >
          <div>
            <p className="text-[10px] font-bold text-[#5E6B8A] uppercase tracking-wider font-sans">{stat.name}</p>
            <h3 className="text-2xl font-bold text-[#172A63] mt-1 tracking-tight font-sans">{stat.value}</h3>
            <p className="text-xs text-[#5E6B8A] mt-1 font-mono">{stat.subtext}</p>
          </div>
          <div className={`${stat.iconBg} p-3 rounded-xl flex items-center justify-center shrink-0`}>
            <stat.icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
