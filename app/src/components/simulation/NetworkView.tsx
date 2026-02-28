// Neural Flock Enterprise - Network Visualization
// Interactive view of road network with OSM/SUMO import

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Map, 
  Upload, 
  Download, 
  Globe, 
  TrafficCone,
  Navigation,
  Layers,
  Radio,
  Activity
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { TrafficNetwork } from '@/types';

interface NetworkViewProps {
  network: TrafficNetwork;
  stats: { nodes: number; edges: number; totalLength: number; entryPoints: number };
}

// City configurations with distinct colors for visibility
const CITIES = [
  { name: 'Bangalore', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-100' },
  { name: 'Delhi', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-100' },
  { name: 'Mumbai', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-100' },
  { name: 'Hyderabad', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-100' },
  { name: 'Chennai', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-100' },
  { name: 'Pune', color: 'from-pink-500 to-pink-600', bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-100' },
];

export const NetworkView: React.FC<NetworkViewProps> = ({ network, stats }) => {
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('Bangalore');
  const [gpsStreamEnabled, setGpsStreamEnabled] = useState(false);
  const [gpsData, setGpsData] = useState<{ vehicles: number; lastUpdate: string } | null>(null);

  const handleOSMImport = async (city: string) => {
    setImporting(true);
    setSelectedCity(city);
    setImportMessage(`Importing ${city} from OpenStreetMap...`);
    
    // Simulated import
    const result = await apiService.importOSM([77.5, 12.9, 77.7, 13.1], city);
    
    setImportMessage(result.message);
    setImporting(false);
    
    setTimeout(() => setImportMessage(null), 3000);
  };

  const toggleGPSStream = () => {
    if (!gpsStreamEnabled) {
      setGpsStreamEnabled(true);
      // Simulate GPS data updates
      const interval = setInterval(() => {
        setGpsData({
          vehicles: Math.floor(Math.random() * 5000) + 8000,
          lastUpdate: new Date().toLocaleTimeString()
        });
      }, 2000);
      
      // Stop after 30 seconds for demo
      setTimeout(() => {
        clearInterval(interval);
        setGpsStreamEnabled(false);
        setGpsData(null);
      }, 30000);
    } else {
      setGpsStreamEnabled(false);
      setGpsData(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          icon={<Navigation className="w-5 h-5 text-blue-400" />}
          label="Network Nodes"
          value={stats.nodes.toString()}
        />
        <StatCard 
          icon={<Navigation className="w-5 h-5 text-emerald-400" />}
          label="Road Segments"
          value={stats.edges.toString()}
        />
        <StatCard 
          icon={<Layers className="w-5 h-5 text-amber-400" />}
          label="Total Length"
          value={`${(stats.totalLength / 1000).toFixed(1)} km`}
        />
        <StatCard 
          icon={<TrafficCone className="w-5 h-5 text-purple-400" />}
          label="Entry Points"
          value={stats.entryPoints.toString()}
        />
      </div>

      {/* GPS Stream Demo Toggle */}
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400" />
            Live Ola GPS Stream Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch 
                checked={gpsStreamEnabled} 
                onCheckedChange={toggleGPSStream}
                className="data-[state=checked]:bg-rose-500"
              />
              <div>
                <p className="text-sm text-white">
                  {gpsStreamEnabled ? 'Streaming Live GPS Data' : 'Enable Live GPS Stream'}
                </p>
                <p className="text-xs text-white/50">
                  {gpsStreamEnabled ? 'Receiving real-time vehicle positions' : 'Simulate Ola fleet GPS feed'}
                </p>
              </div>
            </div>
            {gpsStreamEnabled && gpsData && (
              <div className="flex items-center gap-4">
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{gpsData.vehicles.toLocaleString()}</p>
                  <p className="text-xs text-white/50">Active Vehicles</p>
                </div>
              </div>
            )}
          </div>
          {gpsStreamEnabled && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Last Update:</span>
                <span className="text-white font-mono">{gpsData?.lastUpdate || '--:--:--'}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-white/70">Data Source:</span>
                <span className="text-rose-300">Ola Fleet API (Mock)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Options */}
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" />
            Import Real Traffic Data
            {selectedCity && (
              <Badge className="ml-2 bg-violet-500/20 text-violet-300 border-violet-500/30">
                {selectedCity}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="osm" className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-800/50 border border-white/10 p-1 rounded-lg">
              <TabsTrigger value="osm" className="text-xs text-white/70 data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md bg-transparent">OpenStreetMap</TabsTrigger>
              <TabsTrigger value="sumo" className="text-xs text-white/70 data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-md bg-transparent">SUMO XML</TabsTrigger>
            </TabsList>

            <TabsContent value="osm" className="mt-4 space-y-4">
              <p className="text-sm text-white/50">
                Import real road networks from OpenStreetMap for major Indian cities.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CITIES.map((city) => (
                  <Button
                    key={city.name}
                    variant="outline"
                    size="sm"
                    className={`bg-gradient-to-r ${city.color} ${city.bg} ${city.border} ${city.text} border hover:opacity-90 text-xs font-medium`}
                    onClick={() => handleOSMImport(city.name)}
                    disabled={importing}
                  >
                    <Map className="w-3 h-3 mr-1" />
                    {city.name}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sumo" className="mt-4 space-y-4">
              <p className="text-sm text-white/50">
                Upload SUMO network files (.net.xml) and route files (.rou.xml).
              </p>
              <div className="flex gap-2">
                <Button className="bg-slate-700/80 border border-white/20 text-white hover:bg-slate-600 flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload .net.xml
                </Button>
                <Button className="bg-slate-700/80 border border-white/20 text-white hover:bg-slate-600 flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload .rou.xml
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {importMessage && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">
              {importMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/80">Network Topology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-[#020617] rounded-xl relative overflow-hidden border border-white/5">
            {/* Simplified network visualization */}
            <svg viewBox="0 0 100 75" className="w-full h-full">
              {/* Background */}
              <rect width="100" height="75" fill="#020617" />
              
              {/* Grid */}
              {[...Array(10)].map((_, i) => (
                <g key={i}>
                  <line x1={i * 10} y1="0" x2={i * 10} y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.2" />
                  <line x1="0" y1={i * 7.5} x2="100" y2={i * 7.5} stroke="rgba(255,255,255,0.03)" strokeWidth="0.2" />
                </g>
              ))}

              {/* Roads */}
              {network.edges.slice(0, 50).map((edge, i) => {
                const from = network.nodes.find(n => n.id === edge.from);
                const to = network.nodes.find(n => n.id === edge.to);
                if (!from || !to) return null;

                const scale = 0.8;
                const offsetX = 10;
                const offsetY = 5;

                return (
                  <line
                    key={i}
                    x1={from.position.x * scale + offsetX}
                    y1={from.position.y * scale + offsetY}
                    x2={to.position.x * scale + offsetX}
                    y2={to.position.y * scale + offsetY}
                    stroke={edge.roadType === 'highway' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={edge.roadType === 'highway' ? 0.8 : 0.4}
                  />
                );
              })}

              {/* Nodes */}
              {network.nodes.slice(0, 30).map((node, i) => {
                const scale = 0.8;
                const offsetX = 10;
                const offsetY = 5;

                let color = 'rgba(255,255,255,0.3)';
                if (node.type === 'entry') color = '#10b981';
                if (node.type === 'exit') color = '#ef4444';
                if (node.type === 'traffic_light') color = '#f59e0b';

                return (
                  <circle
                    key={i}
                    cx={node.position.x * scale + offsetX}
                    cy={node.position.y * scale + offsetY}
                    r={node.type === 'intersection' ? 0.7 : 1}
                    fill={color}
                  />
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-[#020617]/95 backdrop-blur p-3 rounded-lg border border-white/10 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <span className="text-white/60">Entry</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                <span className="text-white/60">Exit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                <span className="text-white/60">Traffic Light</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/80">Export Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button size="sm" className="bg-slate-700/80 border border-white/20 text-white hover:bg-slate-600 flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export as SUMO
            </Button>
            <Button size="sm" className="bg-slate-700/80 border border-white/20 text-white hover:bg-slate-600 flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export as GeoJSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => (
  <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-lg hover:shadow-xl transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <div>
          <p className="text-xs text-white/50">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default NetworkView;
