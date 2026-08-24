import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MockWarningBadge({ anchored, mode }) {
  // If explicitly anchored on-chain, don't show the warning badge
  if (anchored === true && mode === "on-chain") return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-3xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
      <AlertTriangle className="h-3 w-3 text-amber-500" />
      Not chain-anchored — degraded mode
    </span>
  );
}
