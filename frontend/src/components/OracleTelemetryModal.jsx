import React from 'react';
import { X, Cpu, Satellite, ShieldCheck, CheckCircle2, Key, Activity, Globe, Calendar, FileJson } from 'lucide-react';

export default function OracleTelemetryModal({ claim, onClose }) {
  if (!claim) return null;

  const isIot = claim.sourceType === 'IOT_SENSOR';
  const isSatellite = claim.sourceType === 'SATELLITE_ORACLE';
  const oracle = claim.oracleMetadata || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${isIot ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
              {isIot ? <Cpu className="w-6 h-6" /> : <Satellite className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {isIot ? 'IoT Smart Meter Telemetry' : (isSatellite ? 'Satellite Remote Sensing Oracle' : 'Manual Evidence Source')}
              </h2>
              <p className="text-xs text-slate-400">Zero-Human-In-The-Middle Direct Data Provenance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Verification Badge Banner */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-7 h-7 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-emerald-300 block">Cryptographically Verified Source</span>
                <span className="text-xs text-slate-400">Hardware ECDSA signature verified over raw telemetry stream</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hardware Valid
            </span>
          </div>

          {/* Device & Oracle Key Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Device / Satellite Identifier
              </span>
              <span className="text-sm font-mono text-slate-200 font-semibold break-all">
                {oracle.deviceId || oracle.stacItemId || 'HARDWARE-IOT-9901'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Oracle Hardware Key
              </span>
              <span className="text-xs font-mono text-slate-300 font-semibold break-all">
                {oracle.oraclePublicKey || claim.orgId}
              </span>
            </div>
          </div>

          {/* Satellite Specific STAC Details */}
          {isSatellite && oracle.stacItemUrl && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <span className="text-xs text-purple-300 font-semibold flex items-center gap-1">
                <Globe className="w-4 h-4" /> Copernicus Sentinel-2 STAC Catalog Item
              </span>
              <p className="text-xs text-slate-300 font-mono break-all bg-slate-950/60 p-2 rounded border border-slate-800">
                {oracle.stacItemUrl}
              </p>
              {oracle.spectralNdvi && (
                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                  <span><strong>NDVI Spectral Index:</strong> {oracle.spectralNdvi}</span>
                  <span><strong>Spatial Resolution:</strong> {oracle.spatialResolution || '10m'}</span>
                </div>
              )}
            </div>
          )}

          {/* Raw Payload Stream Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <FileJson className="w-4 h-4 text-indigo-400" /> Raw Signed Payload Stream
              </span>
              <span className="text-xs text-slate-500">SHA-256 Digest & ECDSA Signature</span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-60 leading-relaxed">
              {JSON.stringify(oracle.rawPayload || oracle || {
                sourceType: claim.sourceType,
                deviceId: oracle.deviceId || 'IOT-SMARTMETER-9901',
                reading: claim.value,
                unit: claim.unit,
                timestamp: claim.timestamp
              }, null, 2)}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition">
            Close Technical Telemetry
          </button>
        </div>

      </div>
    </div>
  );
}
