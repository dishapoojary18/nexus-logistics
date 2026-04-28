import { useEffect, useState } from 'react';
import { Shipment, Disruption, OptimizationSuggestion } from '../types';
import { getOptimizationSuggestion } from '../services/aiOptimizer';
import { Brain, ArrowUpRight, Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OptimizationFeedProps {
  shipments: Shipment[];
  disruptions: Disruption[];
  onApply: (shipmentId: string, newEta: string) => void;
}

export default function OptimizationFeed({ shipments, disruptions, onApply }: OptimizationFeedProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Look for shipments that are "Delayed" but don't have a suggestion yet
    shipments.forEach(async (s) => {
      if (s.status === 'Delayed' && s.affectedBy && !suggestions.find(suggest => suggest.shipmentId === s.id) && !processingIds.has(s.id)) {
        setProcessingIds(prev => new Set(prev).add(s.id));
        
        const disruption = disruptions.find(d => d.id === s.affectedBy);
        if (disruption) {
          const suggestion = await getOptimizationSuggestion(s, disruption);
          if (suggestion) {
            setSuggestions(prev => [...prev, suggestion]);
          }
        }
        setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(s.id);
          return next;
        });
      }
    });

    // Remove suggestions for shipments that are no longer delayed or rerouting
    setSuggestions(prev => prev.filter(suggest => {
      const s = shipments.find(sh => sh.id === suggest.shipmentId);
      return s && (s.status === 'Delayed');
    }));
  }, [shipments, disruptions]);

  const handleApply = (s: OptimizationSuggestion) => {
    onApply(s.shipmentId, s.newEta);
    setSuggestions(prev => prev.filter(item => item.id !== s.id));
  };

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div id="optimization-container" className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] z-20 pointer-events-none">
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-[#1e1e1e]/90 backdrop-blur-xl border border-sky-500/30 rounded-xl p-5 shadow-2xl pointer-events-auto ring-4 ring-black/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center border border-sky-500/30">
                  <Brain className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                   <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-mono">Neural Logistics Advisor</h3>
                   <p className="text-[10px] text-slate-500 font-mono">{suggestions.length} REROUTE VECTORS AVAILABLE</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            </div>

            <div className="flex flex-col gap-3">
              {suggestions.map((s) => (
                <motion.div 
                  key={s.id}
                  layout
                  className="bg-black/40 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-300">{s.shipmentId}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-600" />
                        <span className="text-[11px] font-bold text-white">Dynamic Reroute Suggestion</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-[400px]">
                        {s.reason}
                      </p>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] block text-slate-500 font-mono uppercase mb-1">ETA Adjustment</span>
                       <span className="text-xs font-mono font-bold text-green-400">{s.newEta}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                     <span className="text-[10px] text-slate-500 italic font-medium">AI Recommendation: {s.newRouteSummary}</span>
                     <div className="flex gap-2">
                        <button 
                          id={`dismiss-opt-${s.id}`}
                          onClick={() => handleDismiss(s.id)}
                          className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button 
                          id={`apply-opt-${s.id}`}
                          onClick={() => handleApply(s)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-all shadow-lg shadow-sky-900/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase">Execute Reroute</span>
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
