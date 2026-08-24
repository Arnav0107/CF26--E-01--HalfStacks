import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function MockWarningBadge({ anchored, mode, liveVerification }) {
  // 1. If the claim was never anchored on-chain (degraded at write time)
  if (anchored !== true || mode !== "on-chain") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-3xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
        <AlertTriangle className="h-3 w-3 text-amber-600" />
        Not chain-anchored — degraded mode
      </span>
    );
  }

  // 2. If it WAS anchored on-chain, but live recheck fails due to network outage
  if (liveVerification === "unavailable") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-3xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <Info className="h-3 w-3 text-slate-500" />
        Chain offline — cached proof verified
      </span>
    );
  }

  // 3. Otherwise, healthy on-chain state, no badge needed
  return null;
}
