// Neural Flock Enterprise - Time Series Charts
// Real-time visualization of simulation metrics

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import type { SimulationMetrics } from '@/types';

interface MetricsChartProps {
  metrics: SimulationMetrics[];
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ metrics }) => {
  if (metrics.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
        <CardContent className="p-8 text-center">
          <p className="text-white/50">Run simulation to see metric trends</p>
        </CardContent>
      </Card>
    );
  }

  // Format data for charts
  const chartData = metrics.map((m) => ({
    time: m.timestamp.toFixed(1),
    speed: m.averageSpeed,
    congestion: m.congestionLevel * 100,
    throughput: m.throughput,
    idleTime: m.idleTimePercentage,
    fuel: m.fuelConsumed,
    emissions: m.emissions,
  }));

  return (
    <Card className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-white">Metric Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="speed" className="w-full">
          <TabsList className="grid grid-cols-4 bg-white/5 border border-white/10 p-1 rounded-lg">
            <TabsTrigger value="speed" className="text-xs text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Speed & Flow</TabsTrigger>
            <TabsTrigger value="congestion" className="text-xs text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Congestion</TabsTrigger>
            <TabsTrigger value="efficiency" className="text-xs text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Efficiency</TabsTrigger>
            <TabsTrigger value="environment" className="text-xs text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md">Environment</TabsTrigger>
          </TabsList>

          <TabsContent value="speed" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11}
                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    name="Avg Speed (km/h)" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="throughput" 
                    name="Throughput (veh/hr)" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="congestion" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11}
                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Area 
                    type="monotone" 
                    dataKey="congestion" 
                    name="Congestion %" 
                    stroke="#ef4444" 
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="idleTime" 
                    name="Idle Time %" 
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11}
                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="throughput" 
                    name="Throughput (veh/hr)" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    name="Avg Speed (km/h)" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="environment" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11}
                    tick={{ fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                  <Area 
                    type="monotone" 
                    dataKey="fuel" 
                    name="Fuel (L)" 
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="emissions" 
                    name="CO₂ (kg)" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MetricsChart;
