// Neural Flock Enterprise - Control Panel

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, RotateCcw, MapPin, Cloud, Car, Bike, Truck, Bus, Zap, Atom } from 'lucide-react';
import type { SimulationConfig, VehicleType } from '@/types';

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onConfigChange,
  onStart,
  onStop,
  onReset,
  isRunning,
}) => {
  const updateFleetMix = (type: VehicleType, count: number) => {
    onConfigChange({ ...config, fleetMix: { ...config.fleetMix, [type]: count } });
  };

  const totalVehicles = Object.values(config.fleetMix).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <Card className="bg-[#0f172a] border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-400" />Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={config.scenario} onValueChange={(v) => onConfigChange({ ...config, scenario: v as any })}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1b4b] border-white/20">
              {['bangalore', 'delhi', 'mumbai', 'hyderabad'].map(city => (
                <SelectItem key={city} value={city} className="text-white capitalize">{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between">
            <Label className="text-white/70 flex items-center gap-2"><Cloud className="w-4 h-4" />Weather</Label>
            <Select value={config.weather} onValueChange={(v) => onConfigChange({ ...config, weather: v as any })}>
              <SelectTrigger className="w-28 bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1b4b] border-white/20">
                <SelectItem value="clear" className="text-white">Clear</SelectItem>
                <SelectItem value="rain" className="text-white">Rain</SelectItem>
                <SelectItem value="fog" className="text-white">Fog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0f172a] border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-violet-400" />Fleet Mix <Badge className="ml-auto bg-white/10">{totalVehicles}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FleetSlider icon={<Car className="w-4 h-4 text-blue-400" />} label="Sedans" value={config.fleetMix.sedan} onChange={(v) => updateFleetMix('sedan', v)} />
          <FleetSlider icon={<Bike className="w-4 h-4 text-emerald-400" />} label="Bikes" value={config.fleetMix.bike} onChange={(v) => updateFleetMix('bike', v)} />
          <FleetSlider icon={<span className="text-amber-400">🛺</span>} label="Autos" value={config.fleetMix.auto} onChange={(v) => updateFleetMix('auto', v)} />
          <FleetSlider icon={<Truck className="w-4 h-4 text-indigo-400" />} label="Trucks" value={config.fleetMix.truck} onChange={(v) => updateFleetMix('truck', v)} />
          <FleetSlider icon={<Bus className="w-4 h-4 text-purple-400" />} label="Buses" value={config.fleetMix.bus} onChange={(v) => updateFleetMix('bus', v)} />
        </CardContent>
      </Card>

      <Card className="bg-[#0f172a] border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />Flocking Params
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParamSlider label="Cohesion" value={config.flockingParams.cohesionWeight} max={3} onChange={(v) => onConfigChange({ ...config, flockingParams: { ...config.flockingParams, cohesionWeight: v } })} />
          <ParamSlider label="Alignment" value={config.flockingParams.alignmentWeight} max={3} onChange={(v) => onConfigChange({ ...config, flockingParams: { ...config.flockingParams, alignmentWeight: v } })} />
          <ParamSlider label="Separation" value={config.flockingParams.separationWeight} max={3} onChange={(v) => onConfigChange({ ...config, flockingParams: { ...config.flockingParams, separationWeight: v } })} />
          <ParamSlider label="Perception (m)" value={config.flockingParams.perceptionRadius} max={80} step={5} onChange={(v) => onConfigChange({ ...config, flockingParams: { ...config.flockingParams, perceptionRadius: v } })} />
        </CardContent>
      </Card>

      <Card className="bg-[#0f172a] border border-white/10">
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /><Label className="text-white">Flocking AI</Label></div>
            <Switch checked={config.enableFlocking} onCheckedChange={(v) => onConfigChange({ ...config, enableFlocking: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Atom className="w-4 h-4 text-fuchsia-400" /><Label className="text-white">Quantum</Label></div>
            <Switch checked={config.enableQuantum} onCheckedChange={(v) => onConfigChange({ ...config, enableQuantum: v })} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={onStart} disabled={isRunning} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Play className="w-4 h-4 mr-1" />Start
        </Button>
        <Button onClick={onStop} disabled={!isRunning} className="bg-red-500 hover:bg-red-600 text-white">
          <Square className="w-4 h-4 mr-1" />Stop
        </Button>
        <Button onClick={onReset} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <RotateCcw className="w-4 h-4 mr-1" />Reset
        </Button>
      </div>
    </div>
  );
};

interface FleetSliderProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const FleetSlider: React.FC<FleetSliderProps> = ({ icon, label, value, onChange }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<span className="text-sm text-white/70">{label}</span></div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={50} step={5} />
  </div>
);

interface ParamSliderProps {
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const ParamSlider: React.FC<ParamSliderProps> = ({ label, value, max, step = 0.1, onChange }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm font-semibold text-white">{value.toFixed(step < 1 ? 1 : 0)}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={max} step={step} />
  </div>
);

export default ControlPanel;
