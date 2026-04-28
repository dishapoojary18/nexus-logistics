import { Shipment, Disruption, Coordinate } from '../types';

const CITIES: Record<string, Coordinate> = {
  'Shanghai': { lat: 31.2304, lng: 121.4737 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Rotterdam': { lat: 51.9225, lng: 4.47917 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Hamburg': { lat: 53.5511, lng: 9.9937 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
};

const CITY_NAMES = Object.keys(CITIES);

export class SimulationEngine {
  private shipments: Shipment[] = [];
  private disruptions: Disruption[] = [];

  constructor() {
    this.generateInitialShipments();
  }

  private generateInitialShipments() {
    for (let i = 0; i < 15; i++) {
      this.shipments.push(this.createRandomShipment(`SHP-${1000 + i}`));
    }
  }

  private createRandomShipment(id: string): Shipment {
    const originName = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
    let destName = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
    while (destName === originName) {
      destName = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
    }

    const origin = CITIES[originName];
    const destination = CITIES[destName];

    return {
      id,
      name: `${originName} to ${destName} Freight`,
      origin: originName,
      destination: destName,
      status: 'In Transit',
      priority: Math.random() > 0.8 ? 'Emergency' : (Math.random() > 0.5 ? 'Priority' : 'Routine'),
      originPos: { ...origin },
      currentPos: { ...origin },
      destinationPos: { ...destination },
      progress: Math.random() * 50, // Start somewhere in the first half
      eta: new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 5).toISOString(),
      lastUpdate: new Date().toISOString(),
      history: [{
        status: 'In Transit',
        location: { ...origin },
        timestamp: new Date().toISOString()
      }]
    };
  }

  private recordHistory(shipment: Shipment): Shipment {
    const lastHistory = shipment.history[shipment.history.length - 1];
    if (lastHistory && lastHistory.status === shipment.status) {
      return shipment;
    }

    const newHistory = [...shipment.history, {
      status: shipment.status,
      location: { ...shipment.currentPos },
      timestamp: new Date().toISOString()
    }].slice(-10); // Keep last 10 entries

    return { ...shipment, history: newHistory };
  }

  public update() {
    // 1. Move shipments
    this.shipments = this.shipments.map(s => {
      if (s.status === 'Delivered') return s;

      const newProgress = s.progress + 0.1 * (s.status === 'Delayed' ? 0.3 : 1);
      
      if (newProgress >= 100) {
        return this.recordHistory({ ...s, progress: 100, status: 'Delivered' as const, lastUpdate: new Date().toISOString() });
      }

      // Linear interpolation for currentPos
      const lat = s.currentPos.lat + (s.destinationPos.lat - s.currentPos.lat) * 0.001;
      const lng = s.currentPos.lng + (s.destinationPos.lng - s.currentPos.lng) * 0.001;

      return {
        ...s,
        progress: newProgress,
        currentPos: { lat, lng },
        lastUpdate: new Date().toISOString()
      };
    });

    // 2. Occasionally spawn disruptions
    if (Math.random() > 0.98 && this.disruptions.length < 5) {
      this.spawnDisruption();
    }

    // 3. Clear old disruptions
    if (Math.random() > 0.99 && this.disruptions.length > 0) {
      this.disruptions.shift();
    }

    // 4. Update affected status
    this.checkDisruptions();

    // 5. record history if status changed
    this.shipments = this.shipments.map(s => this.recordHistory(s));
  }

  private spawnDisruption() {
    const types: any[] = ['Weather', 'Traffic', 'Port Closure', 'Customs'];
    const type = types[Math.floor(Math.random() * types.length)];
    const location = CITIES[CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)]];
    
    this.disruptions.push({
      id: `DIS-${Math.floor(Math.random() * 10000)}`,
      type,
      severity: Math.random() > 0.7 ? 'High' : 'Medium',
      location: { 
        lat: location.lat + (Math.random() - 0.5) * 2,
        lng: location.lng + (Math.random() - 0.5) * 2
      },
      radius: 300 + Math.random() * 500,
      description: `Sudden ${type} anomaly detected near transit corridor.`,
      timestamp: new Date().toISOString()
    });
  }

  private checkDisruptions() {
    this.shipments = this.shipments.map(s => {
      let affected = false;
      let disId = undefined;

      for (const d of this.disruptions) {
        const dist = this.getDistance(s.currentPos, d.location);
        if (dist < d.radius) {
          affected = true;
          disId = d.id;
          break;
        }
      }

      if (affected && s.status !== 'Delayed' && s.status !== 'Rerouting' && s.status !== 'Delivered') {
        return { ...s, status: 'Delayed', affectedBy: disId };
      } else if (!affected && s.status === 'Delayed') {
        return { ...s, status: 'In Transit', affectedBy: undefined };
      }
      return s;
    });
  }

  private getDistance(p1: Coordinate, p2: Coordinate): number {
    // Simple Euclidean distance for simulation purposes (scaled roughly to "km-ish")
    const dx = (p1.lat - p2.lat) * 111;
    const dy = (p1.lng - p2.lng) * 111;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public getState() {
    return {
      shipments: this.shipments,
      disruptions: this.disruptions
    };
  }

  public applyOptimization(shipmentId: string, newEta: string) {
    this.shipments = this.shipments.map(s => 
      s.id === shipmentId ? { ...s, status: 'Rerouting', eta: newEta } : s
    );
  }

  public applyPrediction(shipmentId: string, predictedEta: string, analysis: string) {
    this.shipments = this.shipments.map(s => 
      s.id === shipmentId ? { ...s, predictedEta, predictionAnalysis: analysis } : s
    );
  }
}
