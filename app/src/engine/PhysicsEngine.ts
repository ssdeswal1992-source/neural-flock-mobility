// Neural Flock Enterprise - Physics Engine
// Realistic vehicle dynamics with acceleration, braking, turning radius

import type { Vehicle, Position, VehicleType } from '@/types';
import { VEHICLE_TYPES } from '@/types';

export class PhysicsEngine {
  private timeStep: number = 0.1; // 100ms simulation step
  private scale: number = 10; // 1 unit = 10 meters

  constructor(timeStep: number = 0.1) {
    this.timeStep = timeStep;
  }

  // Convert km/h to simulation units
  kmhToUnits(kmh: number): number {
    return (kmh * 1000 / 3600) / this.scale;
  }

  // Convert simulation units to km/h
  unitsToKmh(units: number): number {
    return units * this.scale * 3.6;
  }

  // Apply realistic acceleration with physics constraints
  applyAcceleration(
    vehicle: Vehicle,
    desiredSpeed: number,
    targetHeading: number
  ): void {
    const physics = VEHICLE_TYPES[vehicle.type].physics;
    const currentSpeed = vehicle.velocity.speed;
    const speedDiff = desiredSpeed - currentSpeed;

    // Calculate maximum acceleration based on current speed and physics
    const maxAccel = this.calculateMaxAcceleration(vehicle, currentSpeed);
    const maxBrake = physics.maxBraking * this.timeStep / this.scale;

    let acceleration = 0;

    if (speedDiff > 0) {
      // Accelerating
      acceleration = Math.min(speedDiff, maxAccel);
      vehicle.state = 'accelerating';
    } else if (speedDiff < 0) {
      // Braking
      acceleration = Math.max(speedDiff, -maxBrake);
      vehicle.state = 'braking';
    } else {
      vehicle.state = 'moving';
    }

    // Apply acceleration to velocity
    const newSpeed = Math.max(0, currentSpeed + acceleration);
    const clampedSpeed = Math.min(newSpeed, this.kmhToUnits(physics.maxSpeed));

    // Smooth heading change based on turning radius
    const headingDiff = this.normalizeAngle(targetHeading - vehicle.velocity.heading);
    const maxTurnRate = this.calculateMaxTurnRate(vehicle, clampedSpeed);
    const actualHeadingDiff = Math.max(-maxTurnRate, Math.min(maxTurnRate, headingDiff));
    const newHeading = vehicle.velocity.heading + actualHeadingDiff;

    // Update velocity
    vehicle.velocity.speed = clampedSpeed;
    vehicle.velocity.heading = newHeading;
    vehicle.velocity.vx = Math.cos(newHeading) * clampedSpeed;
    vehicle.velocity.vy = Math.sin(newHeading) * clampedSpeed;

    // Update acceleration tracking
    vehicle.acceleration.ax = (vehicle.velocity.vx - Math.cos(vehicle.velocity.heading) * currentSpeed) / this.timeStep;
    vehicle.acceleration.ay = (vehicle.velocity.vy - Math.sin(vehicle.velocity.heading) * currentSpeed) / this.timeStep;

    // Update fuel consumption
    this.updateFuelConsumption(vehicle, Math.abs(acceleration));
  }

  // Calculate maximum acceleration considering speed and vehicle type
  private calculateMaxAcceleration(vehicle: Vehicle, speed: number): number {
    const physics = VEHICLE_TYPES[vehicle.type].physics;
    
    // Acceleration decreases at higher speeds due to drag
    const dragForce = 0.5 * 1.225 * physics.dragCoefficient * 2.5 * Math.pow(speed * this.scale, 2);
    const maxForce = physics.mass * physics.maxAcceleration;
    const availableForce = Math.max(0, maxForce - dragForce);
    
    return (availableForce / physics.mass) * this.timeStep / this.scale;
  }

  // Calculate maximum turn rate based on speed and turning radius
  private calculateMaxTurnRate(vehicle: Vehicle, speed: number): number {
    const physics = VEHICLE_TYPES[vehicle.type].physics;
    
    // Maximum turn rate = speed / turning_radius (centripetal constraint)
    // At low speeds, can turn faster; at high speeds, limited by physics
    const maxLateralAccel = 4.0; // m/s² (comfort limit)
    const speedMs = speed * this.scale;
    
    if (speedMs < 0.1) return Math.PI / 4; // Can turn quickly when stopped/slow
    
    const maxTurnRateFromLateral = maxLateralAccel / speedMs;
    const maxTurnRateFromRadius = speedMs / physics.turningRadius;
    
    return Math.min(maxTurnRateFromLateral, maxTurnRateFromRadius) * this.timeStep;
  }

  // Update fuel consumption based on acceleration and speed
  private updateFuelConsumption(vehicle: Vehicle, acceleration: number): number {
    const speedKmh = this.unitsToKmh(vehicle.velocity.speed);
    
    // Base consumption: higher for trucks/buses
    let baseConsumption = 0;
    switch (vehicle.type) {
      case 'bike': baseConsumption = 0.02; break;
      case 'auto': baseConsumption = 0.04; break;
      case 'sedan': baseConsumption = 0.08; break;
      case 'bus': baseConsumption = 0.25; break;
      case 'truck': baseConsumption = 0.35; break;
    }
    
    // Speed factor: optimal around 50-60 km/h
    const speedFactor = 0.5 + 0.5 * Math.pow(speedKmh / 60, 2);
    
    // Acceleration penalty
    const accelFactor = 1 + acceleration * 10;
    
    // Idle consumption
    const idleFactor = vehicle.state === 'stopped' ? 0.1 : 1;
    
    const consumption = baseConsumption * speedFactor * accelFactor * idleFactor * this.timeStep;
    vehicle.fuelConsumed += consumption;
    
    return consumption;
  }

  // Apply braking to stop at a target position
  applyBraking(vehicle: Vehicle, stopDistance: number): boolean {
    const physics = VEHICLE_TYPES[vehicle.type].physics;
    const currentSpeed = vehicle.velocity.speed;
    
    // Calculate braking distance needed
    const speedMs = currentSpeed * this.scale;
    const brakingDistance = (speedMs * speedMs) / (2 * physics.maxBraking);
    
    if (brakingDistance >= stopDistance - 2) { // 2m safety margin
      // Need to brake
      const brakeAccel = -physics.maxBraking * this.timeStep / this.scale;
      const newSpeed = Math.max(0, currentSpeed + brakeAccel);
      
      vehicle.velocity.speed = newSpeed;
      vehicle.velocity.vx = Math.cos(vehicle.velocity.heading) * newSpeed;
      vehicle.velocity.vy = Math.sin(vehicle.velocity.heading) * newSpeed;
      vehicle.state = 'braking';
      
      return newSpeed <= 0.01; // Returns true if stopped
    }
    
    return false;
  }

  // Update vehicle position based on velocity
  updatePosition(vehicle: Vehicle): void {
    vehicle.position.x += vehicle.velocity.vx * this.timeStep;
    vehicle.position.y += vehicle.velocity.vy * this.timeStep;
    vehicle.distanceTraveled += vehicle.velocity.speed * this.timeStep * this.scale;
  }

  // Check if vehicle can make a turn given the turning radius
  canMakeTurn(vehicle: Vehicle, _turnAngle: number, roadWidth: number): boolean {
    const physics = VEHICLE_TYPES[vehicle.type].physics;
    const requiredRadius = physics.turningRadius;
    const availableRadius = roadWidth * 2; // Approximate
    
    return requiredRadius <= availableRadius;
  }

  // Apply weather effects to physics
  applyWeatherEffects(
    vehicle: Vehicle,
    friction: number,
    _visibility: number
  ): void {
    const physics = VEHICLE_TYPES[vehicle.type].physics;
    
    // Reduce max speed in bad weather
    const weatherSpeedLimit = physics.maxSpeed * friction;
    vehicle.targetSpeed = Math.min(vehicle.targetSpeed, weatherSpeedLimit);
    
    // Reduce acceleration/braking in bad weather (applied in physics calculations)
    // const effectiveAccel = physics.maxAcceleration * friction;
    // const effectiveBraking = physics.maxBraking * friction;
  }

  // Normalize angle to [-PI, PI]
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  // Calculate distance between two positions
  static distance(p1: Position, p2: Position): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // Calculate heading from p1 to p2
  static heading(p1: Position, p2: Position): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  // Get vehicle dimensions
  static getVehicleDimensions(type: VehicleType): { length: number; width: number } {
    const physics = VEHICLE_TYPES[type].physics;
    return { length: physics.length, width: physics.width };
  }
}
