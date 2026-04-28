import { Disruption } from '../types';
import { AlertTriangle, MapPin, Zap } from 'lucide-react';

interface DisruptionFeedProps {
  disruptions: Disruption[];
}

export default function DisruptionFeed({ disruptions }: DisruptionFeedProps) {
  return (
    <div id="disruption-feed" className="flex flex-col gap-2 p-4 bg-[#13161c] border-l border-slate-800 w-72 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Anomalies</h2>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
        {disruptions.length === 0 && (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded">
            <span className="text-[10px] text-slate-600 font-mono italic">No active corridor anomalies</span>
          </div>
        )}
        
        {disruptions.map(d => (
          <div key={d.id} className="p-3 bg-red-950/20 border border-red-900/30 rounded relative group transition-all hover:border-red-500/30">
             <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">{d.type}</span>
                <span className="text-[9px] text-slate-500 font-mono">{d.id}</span>
             </div>
             <p className="text-[11px] text-slate-300 leading-tight mb-2">{d.description}</p>
             <div className="flex items-center gap-3 text-slate-500">
               <div className="flex items-center gap-1">
                 <MapPin className="w-3 h-3" />
                 <span className="text-[9px] font-mono">{d.location.lat.toFixed(1)}, {d.location.lng.toFixed(1)}</span>
               </div>
               <div className="flex items-center gap-1">
                 <Zap className="w-3 h-3 text-amber-500" />
                 <span className="text-[9px] font-mono uppercase">{d.severity}</span>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
