// Neural Flock Enterprise - API Service
// FastAPI backend integration with REST/WebSocket support

import type { 
  APISimulationRequest, 
  APISimulationResponse, 
  SimulationResult,
  LiveVehicleUpdate,
  GPSStreamConfig 
} from '@/types';

// Simulated API backend (in production, this connects to FastAPI server)
export class APIService {
  // private _baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private onVehicleUpdate: ((update: LiveVehicleUpdate) => void) | null = null;
  private simulationQueue: Map<string, APISimulationResponse> = new Map();

  constructor(_baseUrl: string = 'http://localhost:8000') {
    // this._baseUrl = baseUrl;
  }

  // Start a new simulation via API
  async startSimulation(_request: APISimulationRequest): Promise<APISimulationResponse> {
    // Simulated API call - in production: POST /api/v1/simulations
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response: APISimulationResponse = {
      simulationId,
      status: 'queued',
      progress: 0,
    };

    this.simulationQueue.set(simulationId, response);

    // Simulate async processing
    setTimeout(() => {
      this.updateSimulationStatus(simulationId, 'running', 10);
    }, 500);

    return response;
  }

  // Get simulation status
  async getSimulationStatus(simulationId: string): Promise<APISimulationResponse> {
    return this.simulationQueue.get(simulationId) || {
      simulationId,
      status: 'failed',
      progress: 0,
      error: 'Simulation not found',
    };
  }

  // Get simulation results
  async getSimulationResults(simulationId: string): Promise<SimulationResult | null> {
    const status = this.simulationQueue.get(simulationId);
    return status?.result || null;
  }

  // Stream live vehicle updates via WebSocket
  connectWebSocket(
    onVehicleUpdate: (update: LiveVehicleUpdate) => void,
    _onError?: (error: Event) => void
  ): void {
    this.onVehicleUpdate = onVehicleUpdate;
    
    // Simulated WebSocket - in production: wss://api.neuralflock.io/ws/vehicles
    // this.wsConnection = new WebSocket(`${this._baseUrl.replace('http', 'ws')}/ws/vehicles`);
    
    // For demo, simulate vehicle updates
    this.simulateVehicleUpdates();
  }

  private simulateVehicleUpdates(): void {
    // const vehicleTypes = ['sedan', 'bike', 'auto', 'truck', 'bus'] as const;
    
    setInterval(() => {
      if (this.onVehicleUpdate) {
        const update: LiveVehicleUpdate = {
          vehicleId: `vehicle_${Math.floor(Math.random() * 1000)}`,
          timestamp: Date.now(),
          position: {
            x: Math.random() * 100,
            y: Math.random() * 100,
          },
          velocity: {
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            speed: Math.random() * 30,
            heading: Math.random() * Math.PI * 2,
          },
          state: Math.random() > 0.3 ? 'moving' : 'stopped',
        };
        this.onVehicleUpdate(update);
      }
    }, 100);
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Send GPS batch update (for Kafka integration)
  async sendGPSBatch(updates: LiveVehicleUpdate[]): Promise<boolean> {
    // Simulated Kafka producer - in production: POST /api/v1/gps/batch
    console.log(`Sending ${updates.length} GPS updates to Kafka`);
    return true;
  }

  // Configure GPS stream
  async configureGPSStream(config: GPSStreamConfig): Promise<boolean> {
    // Simulated configuration - in production: POST /api/v1/gps/config
    console.log('Configuring GPS stream:', config);
    return true;
  }

  // Get fleet statistics
  async getFleetStats(_fleetId: string): Promise<{
    totalVehicles: number;
    activeVehicles: number;
    averageSpeed: number;
    congestionHotspots: { x: number; y: number; severity: number }[];
  }> {
    // Simulated fleet stats - in production: GET /api/v1/fleets/{fleetId}/stats
    return {
      totalVehicles: 10000,
      activeVehicles: 8750,
      averageSpeed: 24.5,
      congestionHotspots: [
        { x: 25, y: 30, severity: 0.8 },
        { x: 60, y: 45, severity: 0.6 },
        { x: 80, y: 20, severity: 0.4 },
      ],
    };
  }

  // Import OSM data
  async importOSM(_bbox: [number, number, number, number], city: string): Promise<{
    success: boolean;
    nodesImported: number;
    edgesImported: number;
    message: string;
  }> {
    // Simulated OSM import - in production: POST /api/v1/networks/osm
    return {
      success: true,
      nodesImported: 2500,
      edgesImported: 4800,
      message: `Successfully imported ${city} road network from OpenStreetMap`,
    };
  }

  // Import SUMO network
  async importSUMO(_netFile: string, rouFile?: string): Promise<{
    success: boolean;
    nodesImported: number;
    edgesImported: number;
    routesImported: number;
    message: string;
  }> {
    // Simulated SUMO import - in production: POST /api/v1/networks/sumo
    return {
      success: true,
      nodesImported: 1800,
      edgesImported: 3200,
      routesImported: rouFile ? 500 : 0,
      message: 'Successfully imported SUMO network',
    };
  }

  // Get available cities
  async getAvailableCities(): Promise<{ id: string; name: string; bounds: [number, number, number, number] }[]> {
    return [
      { id: 'bangalore', name: 'Bangalore', bounds: [77.5, 12.9, 77.7, 13.1] },
      { id: 'delhi', name: 'Delhi NCR', bounds: [77.0, 28.5, 77.4, 28.8] },
      { id: 'mumbai', name: 'Mumbai', bounds: [72.8, 19.0, 73.0, 19.3] },
      { id: 'hyderabad', name: 'Hyderabad', bounds: [78.4, 17.3, 78.6, 17.5] },
      { id: 'chennai', name: 'Chennai', bounds: [80.2, 13.0, 80.3, 13.1] },
      { id: 'pune', name: 'Pune', bounds: [73.8, 18.5, 74.0, 18.6] },
    ];
  }

  private updateSimulationStatus(
    simulationId: string, 
    status: APISimulationResponse['status'],
    progress: number
  ): void {
    const sim = this.simulationQueue.get(simulationId);
    if (sim) {
      sim.status = status;
      sim.progress = progress;
    }
  }
}

// Singleton instance
export const apiService = new APIService();
