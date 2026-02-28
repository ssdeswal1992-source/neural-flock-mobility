// Neural Flock Enterprise - Main Application

import { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'sonner';
import { Play, BarChart3, Map, Info, Car, Cloud, TrendingUp } from 'lucide-react';

import { SimulationEngine } from '@/engine/SimulationEngine';
import { NetworkEngine } from '@/engine/NetworkEngine';
import { ControlPanel } from '@/components/simulation/ControlPanel';
import { SimulationCanvas } from '@/components/simulation/SimulationCanvas';
import { NetworkView } from '@/components/simulation/NetworkView';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { MetricsChart } from '@/components/dashboard/MetricsChart';

import type { SimulationConfig, Vehicle, SimulationMetrics, SimulationResult, Obstacle } from '@/types';

import './App.css';

const DEFAULT_CONFIG: SimulationConfig = {
  vehicleCount: 80,
  duration: 30,
  enableFlocking: true,
  enableQuantum: false,
  scenario: 'bangalore',
  weather: 'clear',
  fleetMix: { sedan: 25, bike: 20, auto: 15, truck: 12, bus: 8 },
  flockingParams: { cohesionWeight: 1, alignmentWeight: 0.8, separationWeight: 1.2, perceptionRadius: 35 },
  obstacles: [],
};

function App() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SimulationMetrics | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('simulator');
  const [obstacles] = useState<Obstacle[]>([]);
  const [networkStats, setNetworkStats] = useState({ nodes: 0, edges: 0, totalLength: 0, entryPoints: 0 });
  const [hasError, setHasError] = useState(false);

  const simulationRef = useRef<SimulationEngine | null>(null);
  const networkRef = useRef<NetworkEngine | null>(null);
  const metricsBufferRef = useRef<SimulationMetrics[]>([]);

  // Initialize network on mount
  useEffect(() => {
    if (!networkRef.current) {
      try {
        networkRef.current = new NetworkEngine();
        networkRef.current.generateUrbanNetwork(80, 60, 8);
        setNetworkStats(networkRef.current.getStats());
      } catch (e) {
        console.error('Failed to initialize network:', e);
        toast.error('Failed to initialize network');
      }
    }
  }, []);

  // Batch metrics updates
  useEffect(() => {
    if (metricsBufferRef.current.length > 0) {
      const interval = setInterval(() => {
        if (metricsBufferRef.current.length > 0) {
          setMetrics(prev => {
            const newMetrics = [...prev, ...metricsBufferRef.current];
            metricsBufferRef.current = [];
            if (newMetrics.length > 200) {
              return newMetrics.slice(-150);
            }
            return newMetrics;
          });
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = useCallback((updatedVehicles: Vehicle[], newMetrics: SimulationMetrics) => {
    try {
      // Limit vehicle array size for performance
      setVehicles(updatedVehicles.slice(0, 100));
      setCurrentMetrics(newMetrics);
      metricsBufferRef.current.push(newMetrics);
    } catch (e) {
      console.error('Update error:', e);
    }
  }, []);

  const handleComplete = useCallback((result: SimulationResult) => {
    try {
      setSimulationResult(result);
      setIsRunning(false);
      toast.success('Simulation Complete!', {
        description: `+${result.comparison.improvement.toFixed(1)}% improvement`
      });
    } catch (e) {
      console.error('Complete error:', e);
      setIsRunning(false);
    }
  }, []);

  const handleStart = useCallback(() => {
    if (!networkRef.current) {
      toast.error('Network not ready');
      return;
    }

    try {
      // Stop any existing simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      // Reset state
      setHasError(false);
      setMetrics([]);
      metricsBufferRef.current = [];
      setSimulationResult(null);
      setVehicles([]);
      setIsRunning(true);

      // Create and start new simulation
      simulationRef.current = new SimulationEngine(config, networkRef.current);
      simulationRef.current.start(handleUpdate, handleComplete);

      toast.info('Simulation Started');
    } catch (e) {
      console.error('Start error:', e);
      toast.error('Failed to start simulation');
      setIsRunning(false);
      setHasError(true);
    }
  }, [config, handleUpdate, handleComplete]);

  const handleStop = useCallback(() => {
    try {
      simulationRef.current?.stop();
      setIsRunning(false);
      toast.info('Simulation Stopped');
    } catch (e) {
      console.error('Stop error:', e);
    }
  }, []);

  const handleReset = useCallback(() => {
    try {
      simulationRef.current?.stop();
      setVehicles([]);
      setMetrics([]);
      metricsBufferRef.current = [];
      setCurrentMetrics(null);
      setSimulationResult(null);
      setIsRunning(false);
      setHasError(false);
    } catch (e) {
      console.error('Reset error:', e);
    }
  }, []);

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white"
          >
            Reset Simulator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <Toaster position="top-right" theme="dark" />

      <header className="bg-[#0f172a] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-600 rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Neural Flock</h1>
                <p className="text-xs text-white/60">Enterprise Mobility Simulator</p>
              </div>
            </div>
            {simulationResult && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  +{simulationResult.comparison.improvement.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-white/5 border border-white/10 mb-6">
            <TabsTrigger
              value="simulator"
              className="text-white/70 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Play className="w-4 h-4 mr-2" />Simulator
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-white/70 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />Results
            </TabsTrigger>
            <TabsTrigger
              value="network"
              className="text-white/70 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Map className="w-4 h-4 mr-2" />Network
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="text-white/70 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Info className="w-4 h-4 mr-2" />About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ControlPanel
                  config={config}
                  onConfigChange={setConfig}
                  onStart={handleStart}
                  onStop={handleStop}
                  onReset={handleReset}
                  isRunning={isRunning}
                />
              </div>

              <div className="lg:col-span-2">
                <Card className="bg-[#0f172a] border border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <Map className="w-4 h-4 text-violet-400" />Live Simulation
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          <Cloud className="w-3 h-3 mr-1" />{config.weather}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          {vehicles.length} vehicles
                        </Badge>
                        {isRunning && (
                          <Badge className="text-xs bg-emerald-500 text-white animate-pulse">
                            LIVE
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="aspect-video bg-[#020617] rounded-lg overflow-hidden border border-white/5">
                      <SimulationCanvas
                        vehicles={vehicles}
                        network={networkRef.current?.getNetwork() || { nodes: [], edges: [], bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 } }}
                        obstacles={obstacles}
                        weather={config.weather}
                        scale={8}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsPanel
                metrics={currentMetrics}
                roi={simulationResult?.roi || null}
                isRunning={isRunning}
                comparison={simulationResult?.comparison || null}
              />
              <MetricsChart metrics={metrics} />
            </div>
          </TabsContent>

          <TabsContent value="results">
            {simulationResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricsPanel
                  metrics={simulationResult.finalMetrics}
                  roi={simulationResult.roi}
                  isRunning={false}
                  comparison={simulationResult.comparison}
                />
                <MetricsChart metrics={simulationResult.metrics} />
              </div>
            ) : (
              <Card className="bg-[#0f172a] border border-white/10 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Results Yet</h3>
                <button
                  onClick={() => setActiveTab('simulator')}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white"
                >
                  Go to Simulator
                </button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="network">
            <NetworkView
              network={networkRef.current?.getNetwork() || { nodes: [], edges: [], bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 } }}
              stats={networkStats}
            />
          </TabsContent>

          <TabsContent value="about">
            <Card className="bg-[#0f172a] border border-white/10 p-8">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Neural Flock Mobility Simulator
                </h2>
                <p className="text-white/60 mb-8">
                  Enterprise-grade traffic optimization using quantum-inspired flocking AI.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['React', 'TypeScript', 'Tailwind', 'FastAPI', 'WebSockets', 'NetworkX'].map(tech => (
                    <Badge key={tech} className="bg-white/10 text-white py-2">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
