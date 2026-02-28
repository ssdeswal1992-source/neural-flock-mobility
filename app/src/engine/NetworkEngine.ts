// Neural Flock Enterprise - Traffic Network Engine

import type { TrafficNetwork, RoadNode, RoadEdge } from '@/types';

export class NetworkEngine {
  private network: TrafficNetwork = { nodes: [], edges: [], bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 } };
  private nodeMap: Map<string, RoadNode> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();

  generateUrbanNetwork(width: number = 80, height: number = 60, gridSize: number = 8): TrafficNetwork {
    this.network = {
      nodes: [],
      edges: [],
      bounds: { minLat: 0, maxLat: height, minLng: 0, maxLng: width },
    };

    const nodesX = Math.floor(width / gridSize);
    const nodesY = Math.floor(height / gridSize);

    // Create grid nodes
    for (let y = 0; y <= nodesY; y++) {
      for (let x = 0; x <= nodesX; x++) {
        const isBorder = x === 0 || x === nodesX || y === 0 || y === nodesY;
        const node: RoadNode = {
          id: `n_${x}_${y}`,
          position: { x: x * gridSize, y: y * gridSize },
          type: isBorder ? ((x + y) % 2 === 0 ? 'entry' : 'exit') : 'intersection',
        };

        // Add traffic lights to some intersections
        if (!isBorder && Math.random() < 0.15) {
          node.trafficLight = {
            state: 'green',
            timer: 0,
            cycleDuration: 30 + Math.floor(Math.random() * 20),
          };
        }

        this.network.nodes.push(node);
        this.nodeMap.set(node.id, node);
      }
    }

    // Create horizontal edges
    for (let y = 0; y <= nodesY; y++) {
      for (let x = 0; x < nodesX; x++) {
        this.createEdge(`n_${x}_${y}`, `n_${x + 1}_${y}`);
      }
    }

    // Create vertical edges
    for (let x = 0; x <= nodesX; x++) {
      for (let y = 0; y < nodesY; y++) {
        this.createEdge(`n_${x}_${y}`, `n_${x}_${y + 1}`);
      }
    }

    // Add some diagonal edges for connectivity
    for (let y = 0; y < nodesY; y++) {
      for (let x = 0; x < nodesX; x++) {
        if (Math.random() < 0.2) {
          this.createEdge(`n_${x}_${y}`, `n_${x + 1}_${y + 1}`);
        }
      }
    }

    this.buildAdjacencyList();
    return this.network;
  }

  private createEdge(fromId: string, toId: string): void {
    const from = this.nodeMap.get(fromId);
    const to = this.nodeMap.get(toId);
    if (!from || !to) return;

    const length = Math.sqrt(
      Math.pow(to.position.x - from.position.x, 2) +
      Math.pow(to.position.y - from.position.y, 2)
    );

    const edge: RoadEdge = {
      id: `e_${fromId}_${toId}`,
      from: fromId,
      to: toId,
      lanes: 2,
      maxSpeed: 50,
      length,
      oneWay: false,
      roadType: 'arterial',
    };

    this.network.edges.push(edge);
  }

  private buildAdjacencyList(): void {
    this.adjacencyList.clear();
    
    for (const node of this.network.nodes) {
      this.adjacencyList.set(node.id, []);
    }

    for (const edge of this.network.edges) {
      const neighbors = this.adjacencyList.get(edge.from) || [];
      if (!neighbors.includes(edge.to)) {
        neighbors.push(edge.to);
        this.adjacencyList.set(edge.from, neighbors);
      }
    }
  }

  // BFS shortest path
  findShortestPath(fromId: string, toId: string): string[] | null {
    if (!this.nodeMap.has(fromId) || !this.nodeMap.has(toId)) return null;
    if (fromId === toId) return [fromId];

    const queue: { nodeId: string; path: string[] }[] = [{ nodeId: fromId, path: [fromId] }];
    const visited = new Set<string>([fromId]);

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      const neighbors = this.adjacencyList.get(nodeId) || [];

      for (const neighbor of neighbors) {
        if (neighbor === toId) return [...path, neighbor];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  getRandomEntryNode(): RoadNode | null {
    const entries = this.network.nodes.filter(n => n.type === 'entry');
    if (entries.length === 0) return this.network.nodes[0] || null;
    return entries[Math.floor(Math.random() * entries.length)];
  }

  getRandomExitNode(excludeId: string): RoadNode | null {
    const exits = this.network.nodes.filter(n => n.type === 'exit' && n.id !== excludeId);
    if (exits.length === 0) {
      const others = this.network.nodes.filter(n => n.id !== excludeId);
      return others[Math.floor(Math.random() * others.length)] || null;
    }
    return exits[Math.floor(Math.random() * exits.length)];
  }

  getStats(): { nodes: number; edges: number; totalLength: number; entryPoints: number } {
    return {
      nodes: this.network.nodes.length,
      edges: this.network.edges.length,
      totalLength: this.network.edges.reduce((sum, e) => sum + e.length, 0),
      entryPoints: this.network.nodes.filter(n => n.type === 'entry').length,
    };
  }

  getNetwork(): TrafficNetwork {
    return this.network;
  }

  getNode(id: string): RoadNode | undefined {
    return this.nodeMap.get(id);
  }
}
