// Neural Flock Enterprise - Type Definitions
// Ola/Uber Pilot-Ready Traffic Simulator

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
  speed: number;
  heading: number;
}

export interface VehiclePhysics {
  maxSpeed: number;        // km/h
  maxAcceleration: number; // m/s²
  maxBraking: number;      // m/s²
  turningRadius: number;   // meters
  length: number;          // meters
  width: number;           // meters
  mass: number;            // kg
  dragCoefficient: number;
}

export type VehicleType = 'sedan' | 'bike' | 'auto' | 'truck' | 'bus';

export interface VehicleTypeConfig {
  type: VehicleType;
  physics: VehiclePhysics;
  color: string;
  icon: string;
  flockingBehavior: 'aggressive' | 'normal' | 'conservative';
}

export const VEHICLE_TYPES: Record<VehicleType, VehicleTypeConfig> = {
  sedan: {
    type: 'sedan',
    physics: {
      maxSpeed: 60,
      maxAcceleration: 2.5,
      maxBraking: 6.0,
      turningRadius: 5.5,
      length: 4.5,
      width: 1.8,
      mass: 1500,
      dragCoefficient: 0.3,
    },
    color: '#3B82F6',
    icon: '🚗',
    flockingBehavior: 'normal',
  },
  bike: {
    type: 'bike',
    physics: {
      maxSpeed: 40,
      maxAcceleration: 4.0,
      maxBraking: 8.0,
      turningRadius: 2.5,
      length: 2.0,
      width: 0.8,
      mass: 200,
      dragCoefficient: 0.6,
    },
    color: '#10B981',
    icon: '🏍️',
    flockingBehavior: 'aggressive',
  },
  auto: {
    type: 'auto',
    physics: {
      maxSpeed: 45,
      maxAcceleration: 1.8,
      maxBraking: 4.5,
      turningRadius: 4.0,
      length: 3.2,
      width: 1.4,
      mass: 800,
      dragCoefficient: 0.5,
    },
    color: '#F59E0B',
    icon: '🛺',
    flockingBehavior: 'conservative',
  },
  truck: {
    type: 'truck',
    physics: {
      maxSpeed: 50,
      maxAcceleration: 1.0,
      maxBraking: 3.5,
      turningRadius: 12.0,
      length: 12.0,
      width: 2.5,
      mass: 15000,
      dragCoefficient: 0.7,
    },
    color: '#6366F1',
    icon: '🚛',
    flockingBehavior: 'conservative',
  },
  bus: {
    type: 'bus',
    physics: {
      maxSpeed: 45,
      maxAcceleration: 0.8,
      maxBraking: 3.0,
      turningRadius: 11.0,
      length: 10.0,
      width: 2.5,
      mass: 12000,
      dragCoefficient: 0.65,
    },
    color: '#8B5CF6',
    icon: '🚌',
    flockingBehavior: 'conservative',
  },
};

export interface Vehicle {
  id: string;
  type: VehicleType;
  position: Position;
  velocity: Velocity;
  acceleration: { ax: number; ay: number };
  targetSpeed: number;
  route: string[];
  currentEdgeIndex: number;
  flockingParams: {
    cohesionWeight: number;
    alignmentWeight: number;
    separationWeight: number;
    perceptionRadius: number;
  };
  state: 'moving' | 'stopped' | 'braking' | 'accelerating' | 'waiting';
  waitTime: number;
  fuelConsumed: number;
  distanceTraveled: number;
  eta: number;
}

export interface RoadNode {
  id: string;
  position: Position;
  type: 'intersection' | 'entry' | 'exit' | 'traffic_light';
  trafficLight?: {
    state: 'red' | 'yellow' | 'green';
    timer: number;
    cycleDuration: number;
  };
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  lanes: number;
  maxSpeed: number;
  length: number;
  oneWay: boolean;
  roadType: 'highway' | 'arterial' | 'residential';
}

export interface TrafficNetwork {
  nodes: RoadNode[];
  edges: RoadEdge[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  osmData?: any;
}

export interface SimulationConfig {
  vehicleCount: number;
  duration: number;
  enableFlocking: boolean;
  enableQuantum: boolean;
  scenario: 'bangalore' | 'delhi' | 'mumbai' | 'hyderabad' | 'custom';
  weather: 'clear' | 'rain' | 'fog';
  fleetMix: Record<VehicleType, number>;
  flockingParams: {
    cohesionWeight: number;
    alignmentWeight: number;
    separationWeight: number;
    perceptionRadius: number;
  };
  obstacles: Obstacle[];
}

export interface Obstacle {
  id: string;
  type: 'accident' | 'construction' | 'pedestrian' | 'pothole';
  position: Position;
  radius: number;
  duration: number;
  severity: 'low' | 'medium' | 'high';
}

export interface SimulationMetrics {
  timestamp: number;
  activeVehicles: number;
  averageSpeed: number;
  averageWaitTime: number;
  totalDistance: number;
  fuelConsumed: number;
  emissions: number;
  throughput: number;
  congestionLevel: number;
  idleTimePercentage: number;
}

export interface ROIMetrics {
  fuelSavingsLiters: number;
  fuelSavingsINR: number;
  timeSavingsHours: number;
  emissionsReducedKg: number;
  etaImprovementPercent: number;
  fleetEfficiencyGain: number;
  projectedAnnualSavingsINR: number;
}

export interface SimulationResult {
  id: string;
  config: SimulationConfig;
  startTime: number;
  endTime: number;
  metrics: SimulationMetrics[];
  finalMetrics: SimulationMetrics;
  roi: ROIMetrics;
  comparison: {
    withFlocking: SimulationMetrics;
    withoutFlocking: SimulationMetrics;
    improvement: number;
  };
  vehiclePaths: Map<string, Position[]>;
}

export interface OSMImportConfig {
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  city: string;
  simplify: boolean;
  maxNodes: number;
}

export interface SUMOImportConfig {
  netFile: string;
  rouFile?: string;
}

export interface GPSStreamConfig {
  enabled: boolean;
  endpoint: string;
  protocol: 'kafka' | 'websocket' | 'rest';
  authToken?: string;
  batchSize: number;
  flushInterval: number;
}

export interface QuantumConfig {
  enabled: boolean;
  nQubits: number;
  nLayers: number;
  optimizationSteps: number;
  coherenceTime: number;
}

export interface APISimulationRequest {
  config: SimulationConfig;
  network?: TrafficNetwork;
  quantum?: QuantumConfig;
}

export interface APISimulationResponse {
  simulationId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: SimulationResult;
  error?: string;
}

export interface LiveVehicleUpdate {
  vehicleId: string;
  timestamp: number;
  position: Position;
  velocity: Velocity;
  state: Vehicle['state'];
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'fog';
  visibility: number; // meters
  friction: number; // 0-1 multiplier
  flowReduction: number; // percentage
}

export const WEATHER_CONDITIONS: Record<string, WeatherCondition> = {
  clear: { type: 'clear', visibility: 1000, friction: 1.0, flowReduction: 0 },
  rain: { type: 'rain', visibility: 300, friction: 0.7, flowReduction: 20 },
  fog: { type: 'fog', visibility: 100, friction: 0.85, flowReduction: 35 },
};
