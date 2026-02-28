// Neural Flock Enterprise - Simulation Canvas

import React, { useRef, useEffect } from 'react';
import type { Vehicle, TrafficNetwork, Obstacle } from '@/types';
import { VEHICLE_TYPES } from '@/types';

interface SimulationCanvasProps {
  vehicles: Vehicle[];
  network: TrafficNetwork;
  obstacles: Obstacle[];
  weather: 'clear' | 'rain' | 'fog';
  scale?: number;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  vehicles,
  network,
  obstacles,
  weather,
  scale = 8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 800;
  const height = 450;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Weather overlay
    if (weather !== 'clear') {
      ctx.fillStyle = weather === 'rain' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(148, 163, 184, 0.25)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw network edges (roads)
    if (network.edges && network.edges.length > 0) {
      for (const edge of network.edges) {
        const from = network.nodes.find(n => n.id === edge.from);
        const to = network.nodes.find(n => n.id === edge.to);
        if (!from || !to) continue;

        const x1 = from.position.x * scale;
        const y1 = from.position.y * scale;
        const x2 = to.position.x * scale;
        const y2 = to.position.y * scale;

        ctx.strokeStyle = edge.roadType === 'highway' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = edge.roadType === 'highway' ? 4 : 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Lane markings
        if (edge.lanes > 1) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Draw network nodes (intersections)
    if (network.nodes && network.nodes.length > 0) {
      for (const node of network.nodes) {
        const x = node.position.x * scale;
        const y = node.position.y * scale;

        let color = 'rgba(255,255,255,0.3)';
        let radius = 3;

        if (node.type === 'entry') { color = '#10b981'; radius = 5; }
        else if (node.type === 'exit') { color = '#ef4444'; radius = 5; }
        else if (node.type === 'traffic_light') {
          color = node.trafficLight?.state === 'green' ? '#10b981' :
                  node.trafficLight?.state === 'yellow' ? '#f59e0b' : '#ef4444';
          radius = 6;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw obstacles
    for (const obs of obstacles) {
      const x = obs.position.x * scale;
      const y = obs.position.y * scale;
      const r = obs.radius * scale;

      ctx.fillStyle = obs.type === 'accident' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = obs.type === 'accident' ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw vehicles
    for (const v of vehicles) {
      if (!v || !v.position) continue;
      const x = v.position.x * scale;
      const y = v.position.y * scale;
      const config = VEHICLE_TYPES[v.type];
      if (!config) continue;

      // Vehicle size based on type
      const len = Math.max(6, config.physics.length * scale * 0.2);
      const wid = Math.max(3, config.physics.width * scale * 0.2);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(v.velocity.heading || 0);

      // Vehicle body with glow
      ctx.fillStyle = config.color;
      ctx.shadowColor = config.color;
      ctx.shadowBlur = 6;

      // Draw as simple rectangle (no roundRect for compatibility)
      ctx.fillRect(-len/2, -wid/2, len, wid);

      ctx.shadowBlur = 0;

      // Headlight
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(len/2 - 1, -wid/3);
      ctx.lineTo(len/2, 0);
      ctx.lineTo(len/2 - 1, wid/3);
      ctx.fill();

      ctx.restore();
    }

    // Draw legend
    ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
    ctx.fillRect(8, 8, 110, 95);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 110, 95);

    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    [
      { c: '#3b82f6', l: 'Sedan' },
      { c: '#10b981', l: 'Bike' },
      { c: '#f59e0b', l: 'Auto' },
      { c: '#6366f1', l: 'Truck' },
      { c: '#8b5cf6', l: 'Bus' },
    ].forEach((item, i) => {
      ctx.fillStyle = item.c;
      ctx.fillRect(14, 18 + i * 16, 12, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(item.l, 30, 25 + i * 16);
    });

  }, [vehicles, network, obstacles, weather, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
      style={{ background: '#020617' }}
    />
  );
};

export default SimulationCanvas;
