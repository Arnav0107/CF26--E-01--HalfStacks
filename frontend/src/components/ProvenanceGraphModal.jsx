import React, { useState, useEffect } from 'react';
import { X, Network, CheckCircle, AlertTriangle, Cpu, ShieldCheck, Database, FileText } from 'lucide-react';

export default function ProvenanceGraphModal({ claim, API_URL, onClose }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!claim) return;
    setLoading(true);
    fetch(`${API_URL || 'http://localhost:5000'}/api/claims/${claim.claimId}/provenance-graph`)
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[2] || data.nodes[0]); // default select claim or source
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load provenance graph:", err);
        setLoading(false);
      });
  }, [claim, API_URL]);

  if (!claim) return null;

  const getNodeIcon = (type) => {
    switch (type) {
      case 'SOURCE_DATA': return <Database className="h-5 w-5 text-cyan-400" />;
      case 'AI_RESULT': return <Cpu className="h-5 w-5 text-amber-400" />;
      case 'CLAIM': return <FileText className="h-5 w-5 text-emerald-400" />;
      case 'VERIFICATION': return <ShieldCheck className="h-5 w-5 text-purple-400" />;
      case 'CORRECTION': return <CheckCircle className="h-5 w-5 text-blue-400" />;
      default: return <Network className="h-5 w-5 text-slate-400" />;
    }
  };

  const getNodeColor = (type, isSelected) => {
    const base = isSelected ? "ring-2 ring-emerald-400 scale-105" : "";
    switch (type) {
      case 'SOURCE_DATA': return `bg-cyan-500/15 border-cyan-500/30 text-cyan-200 ${base}`;
      case 'AI_RESULT': return `bg-amber-500/15 border-amber-500/30 text-amber-200 ${base}`;
      case 'CLAIM': return `bg-emerald-500/15 border-emerald-500/30 text-emerald-200 ${base}`;
      case 'VERIFICATION': return `bg-purple-500/15 border-purple-500/30 text-purple-200 ${base}`;
      case 'CORRECTION': return `bg-blue-500/15 border-blue-500/30 text-blue-200 ${base}`;
      default: return `bg-slate-500/15 border-slate-500/30 text-slate-200 ${base}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
              <Network className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Evidence Lineage & Provenance Graph
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {claim.claimId}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic DAG visualization connecting raw environmental data → AI verification → EVM on-chain anchor
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse">
            Constructing cryptographic lineage DAG...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Visual Node Graph Flow */}
            <div className="md:col-span-2 bg-slate-950/80 rounded-xl p-5 border border-white/5 overflow-y-auto flex flex-col space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cryptographic Pipeline Lineage Flow:
              </span>

              {graphData?.nodes?.map((node, index) => (
                <React.Fragment key={node.id}>
                  {/* Node Card */}
                  <div
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${getNodeColor(node.type, selectedNode?.id === node.id)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-black/40">
                        {getNodeIcon(node.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-black/30 text-white">
                            {node.type}
                          </span>
                          <span className="text-sm font-semibold text-white">{node.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          ID: {node.id}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-300 underline">Details →</span>
                  </div>

                  {/* Connecting Edge Arrow */}
                  {index < graphData.nodes.length - 1 && (
                    <div className="flex justify-center items-center py-1">
                      <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1 rounded-full text-[10px] text-slate-400 font-mono border border-white/5">
                        <span>↓</span>
                        <span>{graphData.edges[index]?.label || 'TRANSFORMS_TO'}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Selected Node Details Side Inspector */}
            <div className="bg-slate-950/90 rounded-xl p-5 border border-white/5 overflow-y-auto flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 mb-3 flex items-center gap-2">
                  <span>Inspector Details</span>
                  {selectedNode && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {selectedNode.type}
                    </span>
                  )}
                </h3>

                {selectedNode ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-mono">Node Label:</span>
                      <span className="text-white font-medium">{selectedNode.label}</span>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-2">
                      <span className="text-slate-400 block font-mono">Metadata Attributes:</span>
                      {Object.entries(selectedNode.metadata || {}).map(([key, val]) => (
                        <div key={key} className="bg-slate-900/90 p-2 rounded border border-white/5 flex flex-col">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{key}</span>
                          <span className="font-mono text-emerald-300 break-all">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Select any node in the left graph to inspect cryptographic provenance metadata.</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-center">
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition shadow-lg"
                >
                  Close Provenance Visualizer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
