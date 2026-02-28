// Neural Flock Enterprise - Real-time Metrics Dashboard
// Streamlit-style metrics panel with live charts

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  Fuel, 
  Wind, 
  TrendingUp, 
  TrendingDown,
  Timer,
  Gauge,
  Zap
} from 'lucide-react';
import type { SimulationMetrics, ROIMetrics } from '@/types';

interface MetricsPanelProps {
  metrics: SimulationMetrics | null;
  roi: ROIMetrics | null;
  isRunning: boolean;
  comparison?: {
    withFlocking: SimulationMetrics;
    withoutFlocking: SimulationMetrics;
    improvement: number;
  } | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  roi,
  isRunning,
  comparison,
}) => {
  if (!metrics) {
    return (
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardContent className="p-8 text-center">
          <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Start a simulation to see real-time metrics</p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number, decimals: number = 1) => 
    num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div className="space-y-4">
      {/* Live Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Live Metrics
        </h3>
        <Badge 
          variant={isRunning ? 'default' : 'secondary'}
          className={isRunning ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse' : 'bg-white/10 text-white/70 border-white/20'}
        >
          {isRunning ? 'RUNNING' : 'STOPPED'}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Gauge className="w-5 h-5 text-blue-400" />}
          label="Avg Speed"
          value={`${formatNumber(metrics.averageSpeed)} km/h`}
          trend={comparison ? ((metrics.averageSpeed - comparison.withoutFlocking.averageSpeed) / comparison.withoutFlocking.averageSpeed * 100) : null}
        />
        <MetricCard
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          label="Avg Wait Time"
          value={`${formatNumber(metrics.averageWaitTime)} s`}
          trend={comparison ? ((comparison.withoutFlocking.averageWaitTime - metrics.averageWaitTime) / comparison.withoutFlocking.averageWaitTime * 100) : null}
          inverseTrend
        />
        <MetricCard
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          label="Active Vehicles"
          value={formatNumber(metrics.activeVehicles, 0)}
        />
        <MetricCard
          icon={<Timer className="w-5 h-5 text-purple-400" />}
          label="Idle Time %"
          value={`${formatNumber(metrics.idleTimePercentage)}%`}
          trend={comparison ? ((comparison.withoutFlocking.idleTimePercentage - metrics.idleTimePercentage) / comparison.withoutFlocking.idleTimePercentage * 100) : null}
          inverseTrend
        />
      </div>

      {/* Congestion & Throughput */}
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/80">Congestion Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.congestionLevel < 0.3 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                  metrics.congestionLevel < 0.6 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                  'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${metrics.congestionLevel * 100}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${
              metrics.congestionLevel < 0.3 ? 'text-emerald-400' :
              metrics.congestionLevel < 0.6 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {(metrics.congestionLevel * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-white/50">
            <span>Throughput: <span className="text-white/70">{formatNumber(metrics.throughput, 0)} veh/hr</span></span>
            <span>Total Distance: <span className="text-white/70">{(metrics.totalDistance / 1000).toFixed(1)} km</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <Fuel className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Fuel Consumed</p>
                <p className="text-lg font-bold text-white">{formatNumber(metrics.fuelConsumed, 2)} L</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                <Wind className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">CO₂ Emissions</p>
                <p className="text-lg font-bold text-white">{formatNumber(metrics.emissions, 1)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Metrics */}
      {roi && (
        <Card className="bg-gradient-to-br from-emerald-900/40 via-[#0f172a] to-[#1e1b4b] border border-emerald-500/30 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Projected Annual Savings (10K Fleet)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Fuel Savings</span>
              <span className="text-xl font-bold text-emerald-400">
                ₹{(roi.fuelSavingsINR / 100000).toFixed(2)}L
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Total Annual Savings</span>
              <span className="text-2xl font-bold text-emerald-400">
                ₹{(roi.projectedAnnualSavingsINR / 10000000).toFixed(1)}Cr
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-500/20">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-white/50">ETA Improvement</p>
                <p className="text-lg font-bold text-emerald-300">{roi.etaImprovementPercent.toFixed(1)}%</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-white/50">Fleet Efficiency</p>
                <p className="text-lg font-bold text-emerald-300">{roi.fleetEfficiencyGain.toFixed(1)}%</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-white/50">CO₂ Reduced</p>
                <p className="text-lg font-bold text-emerald-300">{(roi.emissionsReducedKg / 1000).toFixed(1)}t</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison */}
      {comparison && (
        <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Flocking vs Traditional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Flow Improvement</span>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                +{comparison.improvement.toFixed(1)}%
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  With Flocking AI
                </p>
                <p className="text-white text-lg font-semibold">{comparison.withFlocking.averageSpeed.toFixed(1)} km/h avg</p>
                <p className="text-white/50 text-sm">{comparison.withFlocking.idleTimePercentage.toFixed(1)}% idle</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/60 font-medium mb-2">Traditional</p>
                <p className="text-white text-lg font-semibold">{comparison.withoutFlocking.averageSpeed.toFixed(1)} km/h avg</p>
                <p className="text-white/50 text-sm">{comparison.withoutFlocking.idleTimePercentage.toFixed(1)}% idle</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number | null;
  inverseTrend?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, trend, inverseTrend }) => {
  const isPositive = inverseTrend 
    ? (trend || 0) > 0 
    : (trend || 0) > 0;

  return (
    <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
          {trend !== null && trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-white/50">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsPanel;
