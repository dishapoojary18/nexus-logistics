import { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import ShipmentList from './components/ShipmentList';
import LiveMap from './components/LiveMap';
import DisruptionFeed from './components/DisruptionFeed';
import OptimizationFeed from './components/OptimizationFeed';
import { Box, Shield, Activity, Globe, Info, Zap, Brain, Loader2 } from 'lucide-react';
import { Shipment } from './types';
import { getETAPrediction } from './services/aiOptimizer';

export default function App() {
  const { shipments, disruptions, applyOptimization, applyPrediction } = useSimulation();
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || null;

  const handlePredict = async () => {
    if (!selectedShipment) return;
    setIsPredicting(true);
    const prediction = await getETAPrediction(selectedShipment, disruptions);
    if (prediction) {
      applyPrediction(selectedShipment.id, prediction.predictedEta, prediction.analysis);
    }
    setIsPredicting(false);
  };

  const emergencyCount = shipments.filter(s => s.priority === 'Emergency').length;
  const delayedCount = shipments.filter(s => s.status === 'Delayed').length;

  return (
    <div id="nexus-app-shell" className="flex flex-col h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-sky-500/30 overflow-hidden">
      {/* Header Bar */}
      <header id="nexus-header" className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f1115] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded flex items-center justify-center shadow-lg shadow-sky-600/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">Nexus <span className="text-sky-500">Logistics</span></h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-4 border-l border-slate-800 pl-6 h-6">
             <div className="flex items-center gap-2 text-xs font-bold text-sky-500">
               <Activity className="w-3.5 h-3.5" />
               <span className="uppercase tracking-widest">Global Status</span>
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
               <Globe className="w-3.5 h-3.5" />
               <span className="uppercase tracking-widest">Fleet Metrics</span>
             </div>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Network Resilience</span>
              <span className="text-xs font-mono font-bold text-green-500">98.4%</span>
            </div>
            <div className="flex flex-col items-end border-l border-slate-800 pl-4">
              <span className="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Active Disruptions</span>
              <span className={`text-xs font-mono font-bold ${disruptions.length > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {disruptions.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold text-slate-400">SYS_V2.4_LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Control Surface */}
      <main id="nexus-workspace" className="flex flex-1 overflow-hidden">
        {/* Sidebar: Shipment Inventory */}
        <ShipmentList 
          shipments={shipments} 
          selectedId={selectedShipment?.id}
          onSelect={(s) => setSelectedShipmentId(s.id)} 
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-slate-900/20">
          
          {/* Top Metric Bar */}
          <div className="h-12 border-b border-slate-800/50 bg-[#0f1115]/50 backdrop-blur flex items-center px-4 justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Emergency Response:</span>
                <span className="text-xs font-mono text-red-500 font-bold">{emergencyCount} ACTIVE</span>
              </div>
              <div className="w-px h-4 bg-slate-800"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Transit Delay:</span>
                <span className="text-xs font-mono text-amber-500 font-bold">{delayedCount} UNITS</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button className="text-[10px] uppercase font-bold text-slate-500 hover:text-white flex items-center gap-1">
                 <Info className="w-3 h-3" />
                 Context
               </button>
            </div>
          </div>

          {/* Map Viewport Area */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
             <div className="flex-1 relative">
                <LiveMap 
                  shipments={shipments} 
                  disruptions={disruptions} 
                  selectedShipmentId={selectedShipment?.id}
                  onShipmentClick={(s) => setSelectedShipmentId(s.id)}
                />

                {/* AI Suggestions Overlay */}
                <OptimizationFeed 
                  shipments={shipments} 
                  disruptions={disruptions} 
                  onApply={applyOptimization}
                />
             </div>
             
             {/* Bottom Info Bar / Selected Detail */}
             {selectedShipment && (
               <div id="shipment-detail-bar" className="h-24 bg-[#13161c] border border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center">
                       <Box className="w-6 h-6 text-sky-500" />
                    </div>
                    <div className="max-w-xs">
                       <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold truncate">{selectedShipment.name}</h4>
                          <span className="text-[10px] font-mono bg-slate-800 px-1 rounded text-slate-400">{selectedShipment.id}</span>
                       </div>
                       <p className="text-[10px] text-slate-500 font-mono mt-1">
                         COORDS: {selectedShipment.currentPos.lat.toFixed(4)}, {selectedShipment.currentPos.lng.toFixed(4)} 
                       </p>
                       {selectedShipment.predictionAnalysis && (
                         <div className="flex items-center gap-1.5 mt-1">
                           <Brain className="w-3 h-3 text-sky-400" />
                           <p className="text-[9px] text-sky-400 font-mono italic truncate">{selectedShipment.predictionAnalysis}</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="flex gap-8 px-6 border-l border-slate-800">
                    <div className="flex flex-col">
                       <span className="text-[9px] uppercase font-bold text-slate-500">Origin</span>
                       <span className="text-xs font-bold">{selectedShipment.origin}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] uppercase font-bold text-slate-500">Destination</span>
                       <span className="text-xs font-bold">{selectedShipment.destination}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] uppercase font-bold text-slate-500">Schedule ETA</span>
                       <span className="text-xs font-mono text-slate-400 line-through decoration-slate-600">{new Date(selectedShipment.eta).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex flex-col relative">
                       <span className="text-[9px] uppercase font-bold text-sky-500 flex items-center gap-1">
                         <Zap className="w-2.5 h-2.5" />
                         AI Predicted
                       </span>
                       <span className="text-xs font-mono text-sky-400 font-bold">
                         {selectedShipment.predictedEta ? selectedShipment.predictedEta : 'UNAVAILABLE'}
                       </span>
                    </div>
                 </div>

                 <button
                   id="predict-eta-btn"
                   disabled={isPredicting}
                   onClick={handlePredict}
                   className="flex flex-col items-center justify-center gap-1 px-4 h-full bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/30 rounded-md transition-all group"
                 >
                   {isPredicting ? (
                     <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                   ) : (
                     <Brain className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                   )}
                   <span className="text-[9px] font-bold uppercase tracking-tighter text-sky-400">Generate Forecast</span>
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Right Sidebar: Anomalies */}
        <DisruptionFeed disruptions={disruptions} />
      </main>

      {/* Status Footer */}
      <footer id="nexus-footer" className="h-8 bg-[#0a0a0a] border-t border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <span className="text-[9px] font-mono text-slate-600">NEXUS SECURE CORE // ACTIVE</span>
           <span className="text-[9px] font-mono text-slate-600">ENCRYPTION: AES-256</span>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-[9px] font-mono text-slate-600">LATENCY: 14ms</span>
           <span className="text-[9px] font-mono text-slate-600 uppercase">{new Date().toDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
