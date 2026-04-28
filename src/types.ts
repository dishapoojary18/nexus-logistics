
export type ShipmentStatus = 'In Transit' | 'Delayed' | 'Rerouting' | 'Delivered' | 'Pending';
export type DisruptionType = 'Weather' | 'Traffic' | 'Port Closure' | 'Customs' | 'Infrastructure';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface HistoryEvent {
  status: ShipmentStatus;
  location: Coordinate;
  timestamp: string;
}

export interface Shipment {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  priority: 'Routine' | 'Priority' | 'Emergency';
  originPos: Coordinate;
  currentPos: Coordinate;
  destinationPos: Coordinate;
  progress: number; // 0 to 100
  eta: string;
  predictedEta?: string;
  predictionAnalysis?: string;
  lastUpdate: string;
  affectedBy?: string; // ID of disruption
  history: HistoryEvent[];
}

export interface Disruption {
  id: string;
  type: DisruptionType;
  severity: Severity;
  location: Coordinate;
  radius: number; // in km
  description: string;
  timestamp: string;
}

export interface OptimizationSuggestion {
  id: string;
  shipmentId: string;
  originalEta: string;
  newEta: string;
  reason: string;
  newRouteSummary: string;
}
