// Neural Flock Enterprise - Flocking Engine
// Boids algorithm with quantum-inspired optimization

import type { Vehicle, Position, VehicleType } from '@/types';
import { VEHICLE_TYPES } from '@/types';
import { PhysicsEngine } from './PhysicsEngine';

interface FlockingWeights {
  cohesion: number;
  alignment: number;
  separation: number;
}

interface NeighborInfo {
  vehicle: Vehicle;
  distance: number;
  relativeVelocity: { vx: number; vy: number };
}

export class FlockingEngine {
  private physics: PhysicsEngine;
  private spatialGrid: Map<string, Vehicle[]> = new Map();
  private gridSize: number = 10; // Grid cell size in simulation units

  constructor(physics: PhysicsEngine) {
    this.physics = physics;
  }

  // Build spatial grid for efficient neighbor queries (O(n) vs O(n²))
  buildSpatialGrid(vehicles: Vehicle[]): void {
    this.spatialGrid.clear();
    
    for (const vehicle of vehicles) {
      const gridKey = this.getGridKey(vehicle.position);
      if (!this.spatialGrid.has(gridKey)) {
        this.spatialGrid.set(gridKey, []);
      }
      this.spatialGrid.get(gridKey)!.push(vehicle);
    }
  }

  private getGridKey(position: Position): string {
    const gx = Math.floor(position.x / this.gridSize);
    const gy = Math.floor(position.y / this.gridSize);
    return `${gx},${gy}`;
  }

  // Get neighbors using spatial grid (much faster than brute force)
  private getNeighbors(vehicle: Vehicle, radius: number): NeighborInfo[] {
    const neighbors: NeighborInfo[] = [];
    const gridRadius = Math.ceil(radius / this.gridSize);
    
    const centerGx = Math.floor(vehicle.position.x / this.gridSize);
    const centerGy = Math.floor(vehicle.position.y / this.gridSize);
    
    // Check surrounding grid cells
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        const gridKey = `${centerGx + dx},${centerGy + dy}`;
        const cell = this.spatialGrid.get(gridKey);
        
        if (cell) {
          for (const other of cell) {
            if (other.id === vehicle.id) continue;
            
            const distance = PhysicsEngine.distance(vehicle.position, other.position);
            if (distance <= radius && distance > 0) {
              neighbors.push({
                vehicle: other,
                distance,
                relativeVelocity: {
                  vx: other.velocity.vx - vehicle.velocity.vx,
                  vy: other.velocity.vy - vehicle.velocity.vy,
                },
              });
            }
          }
        }
      }
    }
    
    return neighbors;
  }

  // Apply flocking rules to a vehicle
  applyFlocking(
    vehicle: Vehicle,
    allVehicles: Vehicle[],
    weights: FlockingWeights,
    perceptionRadius: number
  ): { desiredVelocity: { vx: number; vy: number }; desiredSpeed: number } {
    // Build spatial grid if needed (call once per frame)
    if (this.spatialGrid.size === 0) {
      this.buildSpatialGrid(allVehicles);
    }

    const neighbors = this.getNeighbors(vehicle, perceptionRadius);
    
    // Adjust perception radius based on vehicle type behavior
    const typeConfig = VEHICLE_TYPES[vehicle.type];
    const adjustedRadius = this.adjustPerceptionRadius(vehicle.type, perceptionRadius);
    
    // Filter neighbors by adjusted radius
    const filteredNeighbors = neighbors.filter(n => n.distance <= adjustedRadius);

    // Calculate flocking forces
    const cohesion = this.calculateCohesion(vehicle, filteredNeighbors);
    const alignment = this.calculateAlignment(vehicle, filteredNeighbors);
    const separation = this.calculateSeparation(vehicle, filteredNeighbors);

    // Apply vehicle-type-specific weights
    const typeWeights = this.getTypeWeights(vehicle.type, weights);

    // Combine forces
    let desiredVx = vehicle.velocity.vx;
    let desiredVy = vehicle.velocity.vy;

    if (filteredNeighbors.length > 0) {
      desiredVx += cohesion.vx * typeWeights.cohesion +
                   alignment.vx * typeWeights.alignment +
                   separation.vx * typeWeights.separation;
      
      desiredVy += cohesion.vy * typeWeights.cohesion +
                   alignment.vy * typeWeights.alignment +
                   separation.vy * typeWeights.separation;
    }

    // Calculate desired speed and heading
    const desiredSpeed = Math.sqrt(desiredVx * desiredVx + desiredVy * desiredVy);
    // const desiredHeading = Math.atan2(desiredVy, desiredVx);

    return {
      desiredVelocity: { vx: desiredVx, vy: desiredVy },
      desiredSpeed: Math.min(desiredSpeed, this.physics.kmhToUnits(typeConfig.physics.maxSpeed)),
    };
  }

  // Cohesion: steer towards average position of neighbors
  private calculateCohesion(vehicle: Vehicle, neighbors: NeighborInfo[]): { vx: number; vy: number } {
    if (neighbors.length === 0) return { vx: 0, vy: 0 };

    let avgX = 0;
    let avgY = 0;

    for (const neighbor of neighbors) {
      avgX += neighbor.vehicle.position.x;
      avgY += neighbor.vehicle.position.y;
    }

    avgX /= neighbors.length;
    avgY /= neighbors.length;

    // Steer towards center
    const dx = avgX - vehicle.position.x;
    const dy = avgY - vehicle.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.001) return { vx: 0, vy: 0 };

    // Normalize and scale
    const maxSpeed = this.physics.kmhToUnits(VEHICLE_TYPES[vehicle.type].physics.maxSpeed);
    return {
      vx: (dx / distance) * maxSpeed * 0.1,
      vy: (dy / distance) * maxSpeed * 0.1,
    };
  }

  // Alignment: match velocity with neighbors
  private calculateAlignment(vehicle: Vehicle, neighbors: NeighborInfo[]): { vx: number; vy: number } {
    if (neighbors.length === 0) return { vx: 0, vy: 0 };

    let avgVx = 0;
    let avgVy = 0;

    for (const neighbor of neighbors) {
      avgVx += neighbor.vehicle.velocity.vx;
      avgVy += neighbor.vehicle.velocity.vy;
    }

    avgVx /= neighbors.length;
    avgVy /= neighbors.length;

    // Steer towards average velocity
    return {
      vx: (avgVx - vehicle.velocity.vx) * 0.1,
      vy: (avgVy - vehicle.velocity.vy) * 0.1,
    };
  }

  // Separation: avoid crowding neighbors
  private calculateSeparation(vehicle: Vehicle, neighbors: NeighborInfo[]): { vx: number; vy: number } {
    if (neighbors.length === 0) return { vx: 0, vy: 0 };

    let sepX = 0;
    let sepY = 0;

    for (const neighbor of neighbors) {
      const dx = vehicle.position.x - neighbor.vehicle.position.x;
      const dy = vehicle.position.y - neighbor.vehicle.position.y;
      const distance = neighbor.distance;

      if (distance < 0.001) continue;

      // Weight by inverse distance (closer = stronger repulsion)
      const minSeparation = this.getMinSeparation(vehicle.type, neighbor.vehicle.type);
      
      if (distance < minSeparation) {
        const force = (minSeparation - distance) / minSeparation;
        sepX += (dx / distance) * force;
        sepY += (dy / distance) * force;
      }
    }

    return {
      vx: sepX * 2,
      vy: sepY * 2,
    };
  }

  // Get minimum separation distance based on vehicle types
  private getMinSeparation(type1: VehicleType, type2: VehicleType): number {
    const dims1 = VEHICLE_TYPES[type1].physics;
    const dims2 = VEHICLE_TYPES[type2].physics;
    
    // Minimum separation = sum of vehicle lengths + safety margin
    return (dims1.length + dims2.length) / this.physics['scale'] + 1;
  }

  // Adjust perception radius based on vehicle type behavior
  private adjustPerceptionRadius(type: VehicleType, baseRadius: number): number {
    const behavior = VEHICLE_TYPES[type].flockingBehavior;
    
    switch (behavior) {
      case 'aggressive': return baseRadius * 0.7; // Bikes: shorter range, more reactive
      case 'conservative': return baseRadius * 1.3; // Trucks/buses: longer range, more cautious
      default: return baseRadius;
    }
  }

  // Get type-specific flocking weights
  private getTypeWeights(type: VehicleType, baseWeights: FlockingWeights): FlockingWeights {
    const behavior = VEHICLE_TYPES[type].flockingBehavior;
    
    switch (behavior) {
      case 'aggressive': // Bikes
        return {
          cohesion: baseWeights.cohesion * 0.8,
          alignment: baseWeights.alignment * 0.6,
          separation: baseWeights.separation * 1.5,
        };
      case 'conservative': // Trucks, buses, autos
        return {
          cohesion: baseWeights.cohesion * 1.2,
          alignment: baseWeights.alignment * 1.3,
          separation: baseWeights.separation * 1.2,
        };
      default: // Sedans
        return baseWeights;
    }
  }

  // Clear spatial grid (call at end of each frame)
  clearSpatialGrid(): void {
    this.spatialGrid.clear();
  }
}

// Quantum-inspired optimization for flocking parameters
export class QuantumOptimizer {
  private nQubits: number = 4;
  private coherenceMatrix: number[][] = [];

  constructor(nQubits: number = 4) {
    this.nQubits = nQubits;
    this.initializeCoherenceMatrix();
  }

  private initializeCoherenceMatrix(): void {
    this.coherenceMatrix = [];
    for (let i = 0; i < this.nQubits; i++) {
      this.coherenceMatrix[i] = [];
      for (let j = 0; j < this.nQubits; j++) {
        this.coherenceMatrix[i][j] = i === j ? 1 : Math.random() * 0.3;
      }
    }
  }

  // Simulate quantum interference for parameter optimization
  optimizeParameters(
    baseWeights: FlockingWeights,
    trafficDensity: number,
    averageSpeed: number
  ): FlockingWeights {
    // Create quantum state vector (simulated)
    const stateVector = this.createQuantumState(trafficDensity, averageSpeed);
    
    // Apply interference pattern
    const interference = this.applyInterference(stateVector);
    
    // Map interference to parameter adjustments
    const optimized: FlockingWeights = {
      cohesion: baseWeights.cohesion * (1 + interference[0] * 0.3),
      alignment: baseWeights.alignment * (1 + interference[1] * 0.3),
      separation: baseWeights.separation * (1 + interference[2] * 0.3),
    };

    // Clamp values
    return {
      cohesion: Math.max(0.5, Math.min(3, optimized.cohesion)),
      alignment: Math.max(0.5, Math.min(3, optimized.alignment)),
      separation: Math.max(0.5, Math.min(3, optimized.separation)),
    };
  }

  private createQuantumState(trafficDensity: number, averageSpeed: number): number[] {
    // Encode traffic conditions into quantum state
    const normalizedDensity = Math.min(1, trafficDensity / 100);
    const normalizedSpeed = Math.min(1, averageSpeed / 60);
    
    return [
      normalizedDensity,
      normalizedSpeed,
      1 - normalizedDensity,
      1 - normalizedSpeed,
    ];
  }

  private applyInterference(stateVector: number[]): number[] {
    // Simulate quantum interference using coherence matrix
    const result: number[] = new Array(this.nQubits).fill(0);
    
    for (let i = 0; i < this.nQubits; i++) {
      for (let j = 0; j < this.nQubits; j++) {
        result[i] += this.coherenceMatrix[i][j] * stateVector[j];
      }
    }
    
    // Normalize and apply phase
    return result.map((v, i) => Math.sin(v * Math.PI + i * Math.PI / 4) * 0.5);
  }

  // Update coherence based on simulation results (learning)
  updateCoherence(metrics: { flow: number; congestion: number }): void {
    const feedback = metrics.flow / (metrics.congestion + 1);
    
    for (let i = 0; i < this.nQubits; i++) {
      for (let j = i + 1; j < this.nQubits; j++) {
        this.coherenceMatrix[i][j] += (feedback - 0.5) * 0.01;
        this.coherenceMatrix[i][j] = Math.max(0, Math.min(1, this.coherenceMatrix[i][j]));
        this.coherenceMatrix[j][i] = this.coherenceMatrix[i][j];
      }
    }
  }
}
