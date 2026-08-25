import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function MockWarningBadge({ anchored, mode, liveVerification }) {
  // 1. If the claim was never anchored on-chain (degraded at write time)
  if (anchored !== true || mode !== "on-chain") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="h-3 w-3 text-amber-600" />
        Mock mode proof
      </span>
    );
  }

  // 2. If it WAS anchored on-chain, but live recheck fails due to network outage
  if (liveVerification === "unavailable") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-[#5E6B8A] border border-slate-200">
        <Info className="h-3 w-3 text-[#5E6B8A]" />
        Chain offline — cached proof verified
      </span>
    );
  }

  // 3. Otherwise, healthy on-chain state, no badge needed
  return null;
}
