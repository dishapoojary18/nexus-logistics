import { useState } from 'react';
import { Shipment } from '../types';
import { Package, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp, Clock, Search, X, Brain, Zap, ChevronDown, ChevronUp, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShipmentListProps {
  shipments: Shipment[];
  selectedId?: string;
  onSelect: (shipment: Shipment) => void;
}

export default function ShipmentList({ shipments, selectedId, onSelect }: ShipmentListProps) {
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const filteredShipments = shipments.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (s: Shipment) => {
    if (selectedId !== s.id) {
      setShowHistory(false);
    }
    onSelect(s);
  };

  return (
    <div id="shipment-list-container" className="flex flex-col h-full bg-[#0f1115] border-r border-slate-800 w-80 shrink-0">
      <div className="p-4 border-b border-slate-800 bg-[#13161c]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Freight</h2>
          <span className="text-[10px] font-mono text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full ring-1 ring-sky-500/20">
            {shipments.length} UNIT
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text"
            placeholder="Track Unit ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-slate-800 rounded-md py-2 pl-9 pr-9 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all text-slate-200 placeholder:text-slate-600"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {filteredShipments.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[10px] text-slate-600 font-mono">No matching transits found</p>
          </div>
        )}
        {filteredShipments.map((s) => (
          <motion.div
            key={s.id}
            id={`shipment-card-${s.id}`}
            layout
            onClick={() => handleSelect(s)}
            className={`
              p-4 border-b border-slate-800/50 cursor-pointer transition-all border-l-2
              ${selectedId === s.id ? 'bg-slate-800/30 border-l-sky-500' : 'hover:bg-slate-800/20 border-l-transparent'}
              ${s.status === 'Delayed' ? 'bg-red-500/5' : ''}
              ${s.status === 'Rerouting' ? 'bg-green-500/5' : ''}
            `}
          >
            <div className="flex justify-between mb-2">
              <span className={`text-[10px] font-mono font-bold ${s.priority === 'Emergency' ? 'text-red-400' : s.priority === 'Priority' ? 'text-amber-400' : 'text-slate-500'}`}>
                {s.id}
              </span>
              <span className="text-[10px] font-mono uppercase opacity-50 px-1 bg-slate-800 rounded">
                {s.priority}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-medium truncate flex-1">{s.origin}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-[11px] font-medium truncate flex-1 text-right">{s.destination}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.progress}%` }}
                    className={`h-full ${s.status === 'Delayed' ? 'bg-red-500' : s.status === 'Rerouting' ? 'bg-green-500' : 'bg-sky-500'}`}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{Math.floor(s.progress)}%</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  {s.status === 'Delayed' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  ) : s.status === 'Rerouting' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  ) : s.status === 'Delivered' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${s.status === 'Delayed' ? 'text-red-500' : s.status === 'Rerouting' ? 'text-green-500' : 'text-slate-400'}`}>
                    {s.status}
                  </span>
               </div>
               <div className="flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-mono">
                      {new Date(s.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                    </span>
                 </div>
                 {s.predictedEta && (
                   <div className="flex items-center gap-1 text-sky-400">
                      <Zap className="w-3 h-3" />
                      <span className="text-[9px] font-mono font-bold">
                        {s.predictedEta}
                      </span>
                   </div>
                 )}
               </div>
            </div>

            {s.predictionAnalysis && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-slate-800/50"
              >
                <div className="flex gap-2">
                  <Brain className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-400 leading-relaxed italic">
                    {s.predictionAnalysis}
                  </p>
                </div>
              </motion.div>
            )}

            {selectedId === s.id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-slate-500 mb-1 tracking-tighter">Current Vector</span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {s.currentPos.lat.toFixed(4)}N
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {s.currentPos.lng.toFixed(4)}E
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-slate-500 mb-1 tracking-tighter">Last Telemetry</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(s.lastUpdate).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </div>
                </div>

                <div className="bg-black/40 rounded p-2 border border-slate-800/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter">Logistics Protocol</span>
                    <span className={`text-[8px] font-bold px-1 rounded ${s.priority === 'Emergency' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'}`}>
                      {s.priority === 'Emergency' ? 'CRITICAL_PATH' : 'STANDARD_OPS'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Unit is following {s.priority.toLowerCase()} transit algorithms via established maritime corridors.
                  </p>
                </div>

                <div className="mt-2 text-left">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHistory(!showHistory);
                    }}
                    className="w-full flex items-center justify-between text-[8px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors py-2 border-b border-slate-800/50"
                  >
                    <div className="flex items-center gap-1.5">
                      <History className="w-3 h-3" />
                      <span>Transit Logs ({s.history.length})</span>
                    </div>
                    {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 relative pl-3 mt-4 before:content-[''] before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-[1px] before:bg-slate-800">
                          {s.history.slice().reverse().map((event, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[11px] top-1 w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-900" />
                              <div className="flex justify-between items-start">
                                <span className={`text-[9px] font-bold ${event.status === 'Delayed' ? 'text-red-500' : event.status === 'Rerouting' ? 'text-green-500' : 'text-sky-500'}`}>
                                  {event.status}
                                </span>
                                <span className="text-[8px] font-mono text-slate-600">
                                  {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[8px] text-slate-500 font-mono">
                                {event.location.lat.toFixed(2)}N, {event.location.lng.toFixed(2)}E
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
