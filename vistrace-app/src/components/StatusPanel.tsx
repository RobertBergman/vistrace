import React from 'react';
import { TraceRoute } from '../types/traceroute';
import { Activity, Globe, Zap } from 'lucide-react';

interface StatusPanelProps {
  trace: TraceRoute | null;
  systemInfo: {
    activeTraces: number;
    totalTraces: number;
    uptime: number;
  };
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ trace, systemInfo }) => {
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running':
        return 'text-terminal-cyan';
      case 'completed':
        return 'text-terminal-text';
      case 'failed':
        return 'text-terminal-red';
      case 'timeout':
        return 'text-terminal-yellow';
      default:
        return 'text-terminal-gray';
    }
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = (endTime.getTime() - start.getTime()) / 1000;
    return `${duration.toFixed(1)}s`;
  };

  return (
    <div className="bg-terminal-bg border border-terminal-gray rounded-lg">
      <div className="bg-terminal-bg-secondary px-4 py-2 border-b border-terminal-gray">
        <h3 className="text-terminal-white font-mono text-sm flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          System Status
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* System Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-terminal-gray text-xs font-mono uppercase tracking-wide">
              System
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-terminal-white">Active Traces:</span>
                <span className="text-terminal-cyan">{systemInfo.activeTraces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-white">Total Traces:</span>
                <span className="text-terminal-text">{systemInfo.totalTraces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-white">Uptime:</span>
                <span className="text-terminal-text">{formatUptime(systemInfo.uptime)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-terminal-gray text-xs font-mono uppercase tracking-wide">
              Current Trace
            </div>
            {trace ? (
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-terminal-white">Status:</span>
                  <span className={getStatusColor(trace.status)}>{trace.status.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Destination:</span>
                  <span className="text-terminal-cyan">{trace.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Duration:</span>
                  <span className="text-terminal-text">{formatDuration(trace.startTime, trace.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Hops:</span>
                  <span className="text-terminal-text">{trace.hops.length}/{trace.maxHops}</span>
                </div>
              </div>
            ) : (
              <div className="text-terminal-gray text-sm font-mono">No active trace</div>
            )}
          </div>
        </div>

        {/* Network Statistics */}
        {trace && trace.hops.length > 0 && (
          <div className="border-t border-terminal-gray pt-4">
            <div className="text-terminal-gray text-xs font-mono uppercase tracking-wide mb-2">
              Network Statistics
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-terminal-white">Avg Latency:</span>
                  <span className="text-terminal-yellow">
                    {(trace.hops.reduce((sum, hop) => sum + hop.averageTime, 0) / trace.hops.length).toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Min Latency:</span>
                  <span className="text-terminal-text">
                    {Math.min(...trace.hops.map(hop => hop.minTime)).toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Max Latency:</span>
                  <span className="text-terminal-red">
                    {Math.max(...trace.hops.map(hop => hop.maxTime)).toFixed(1)}ms
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-terminal-white">Packet Loss:</span>
                  <span className={trace.hops.some(hop => hop.packetLoss > 0) ? 'text-terminal-red' : 'text-terminal-text'}>
                    {(trace.hops.reduce((sum, hop) => sum + hop.packetLoss, 0) / trace.hops.length).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Successful:</span>
                  <span className="text-terminal-text">{trace.successfulPackets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-white">Total Packets:</span>
                  <span className="text-terminal-text">{trace.totalPackets}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time indicators */}
        <div className="border-t border-terminal-gray pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${trace?.status === 'running' ? 'bg-terminal-text animate-pulse' : 'bg-terminal-gray'}`}></div>
                <span className="text-terminal-white text-xs font-mono">NETWORK</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-terminal-yellow" />
                <span className="text-terminal-white text-xs font-mono">ACTIVE</span>
              </div>
            </div>
            <div className="text-terminal-gray text-xs font-mono">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Geographic info if available */}
        {trace && trace.hops.some(hop => hop.location?.city) && (
          <div className="border-t border-terminal-gray pt-4">
            <div className="text-terminal-gray text-xs font-mono uppercase tracking-wide mb-2 flex items-center">
              <Globe className="w-3 h-3 mr-2" />
              Geographic Path
            </div>
            <div className="space-y-1">
              {trace.hops
                .filter(hop => hop.location?.city)
                .map((hop, index) => (
                  <div key={hop.hopNumber} className="text-sm font-mono flex items-center">
                    <span className="text-terminal-cyan mr-2">{index + 1}.</span>
                    <span className="text-terminal-white">
                      {hop.location?.city}
                      {hop.location?.country && `, ${hop.location.country}`}
                    </span>
                    <span className="text-terminal-gray ml-auto">
                      {hop.averageTime.toFixed(1)}ms
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
