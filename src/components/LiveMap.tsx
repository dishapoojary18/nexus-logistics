import { useEffect, useRef } from 'react';
import { Shipment, Disruption } from '../types';

interface LiveMapProps {
  shipments: Shipment[];
  disruptions: Disruption[];
  selectedShipmentId?: string;
  onShipmentClick: (shipment: Shipment) => void;
}

export default function LiveMap({ shipments, disruptions, selectedShipmentId, onShipmentClick }: LiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x <= canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const worldToCanvas = (lat: number, lng: number) => {
        // Map lat -90 to 90 -> height to 0
        // Map lng -180 to 180 -> 0 to width
        const x = ((lng + 180) / 360) * canvas.width;
        const y = (1 - (lat + 90) / 180) * canvas.height;
        return { x, y };
      };

      // Draw Disruption Zones
      disruptions.forEach(d => {
        const { x, y } = worldToCanvas(d.location.lat, d.location.lng);
        const radius = (d.radius / 20000) * canvas.width; // rough scaling

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const color = d.severity === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)';
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = d.severity === 'High' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.4)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Shipments
      shipments.forEach(s => {
        const isSelected = s.id === selectedShipmentId;
        const origin = worldToCanvas(s.originPos?.lat || s.currentPos.lat, s.originPos?.lng || s.currentPos.lng);
        const current = worldToCanvas(s.currentPos.lat, s.currentPos.lng);
        const dest = worldToCanvas(s.destinationPos.lat, s.destinationPos.lng);

        // 1. Draw traversed path (Origin -> Current)
        ctx.strokeStyle = isSelected ? 'rgba(14, 165, 233, 0.4)' : 'rgba(71, 85, 105, 0.15)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();

        // 2. Draw remaining path (Current -> Destination)
        ctx.strokeStyle = isSelected ? 'rgba(14, 165, 233, 0.8)' : 'rgba(71, 85, 105, 0.3)';
        ctx.setLineDash(isSelected ? [] : [4, 4]); // Solid for selected remaining, dashed for others
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(dest.x, dest.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for origin/dest if selected
        if (isSelected) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '8px JetBrains Mono';
          ctx.fillText(`ORIGIN: ${s.origin}`, origin.x + 5, origin.y - 5);
          ctx.fillText(`DEST: ${s.destination}`, dest.x + 5, dest.y - 5);
          
          // Small markers for origin/dest
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(origin.x, origin.y, 2, 0, Math.PI * 2);
          ctx.arc(dest.x, dest.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Ship icon
        const x = current.x;
        const y = current.y;
        const color = s.status === 'Delayed' ? '#ef4444' : s.status === 'Rerouting' ? '#22c55e' : '#0ea5e9';
        
        if (isSelected) {
          // Pulse effect for selected
          const pulse = Math.sin(Date.now() / 200) * 4 + 8;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.fillStyle = color + '44';
          ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = isSelected ? 15 : 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label for emergency or selected
        if (s.priority === 'Emergency' || isSelected) {
          ctx.fillStyle = isSelected ? '#fff' : '#cbd5e1';
          ctx.font = isSelected ? 'bold 11px JetBrains Mono' : '10px JetBrains Mono';
          ctx.fillText(s.id, x + 10, y - 5);
          
          if (isSelected) {
            ctx.font = '9px JetBrains Mono';
            ctx.fillStyle = s.status === 'Delayed' ? '#f87171' : s.status === 'Rerouting' ? '#4ade80' : '#7dd3fc';
            ctx.fillText(`${s.status} | ETA: ${new Date(s.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`, x + 10, y + 8);
          }
        }
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [shipments, disruptions, selectedShipmentId]);

  return (
    <div id="live-map-container" ref={containerRef} className="w-full h-full bg-[#0a0a0a] relative overflow-hidden ring-1 ring-slate-800 rounded-lg">
      <canvas id="live-map-canvas" ref={canvasRef} className="block" />
      <div className="absolute top-4 left-4 p-3 bg-black/60 backdrop-blur-md border border-slate-700/50 rounded flex flex-col gap-1 z-10">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Global Network Nexus</h3>
        <div className="flex items-center gap-4 text-[9px] font-mono">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500"></span> ACTIVE</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> DISRUPTED</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> OPTIMIZED</div>
        </div>
      </div>
    </div>
  );
}
