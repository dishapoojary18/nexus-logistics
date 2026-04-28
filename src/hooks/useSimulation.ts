import { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from '../services/simulationEngine';
import { Shipment, Disruption } from '../types';

export function useSimulation() {
  const engineRef = useRef<SimulationEngine | null>(null);
  const [state, setState] = useState<{
    shipments: Shipment[];
    disruptions: Disruption[];
  }>({
    shipments: [],
    disruptions: []
  });

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SimulationEngine();
    }

    const interval = setInterval(() => {
      engineRef.current?.update();
      setState(engineRef.current?.getState() || { shipments: [], disruptions: [] });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const applyOptimization = (shipmentId: string, newEta: string) => {
    engineRef.current?.applyOptimization(shipmentId, newEta);
    setState(engineRef.current?.getState() || { shipments: [], disruptions: [] });
  };

  const applyPrediction = (shipmentId: string, predictedEta: string, analysis: string) => {
    engineRef.current?.applyPrediction(shipmentId, predictedEta, analysis);
    setState(engineRef.current?.getState() || { shipments: [], disruptions: [] });
  };

  return { ...state, applyOptimization, applyPrediction };
}
