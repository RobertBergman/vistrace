import React, { useState } from 'react';
import { TracerouteOptions } from '../types/traceroute';
import { Play, Square, Settings, Database } from 'lucide-react';

interface TracerouteControlProps {
  onStartTrace: (destination: string, options: Partial<TracerouteOptions>) => void;
  onStopTrace: (traceId: string) => void;
  activeTraces: string[];
  onShowSettings: () => void;
  onShowDatabase: () => void;
  isDbConnected: boolean;
}

export const TracerouteControl: React.FC<TracerouteControlProps> = ({
  onStartTrace,
  onStopTrace,
  activeTraces,
  onShowSettings,
  onShowDatabase,
  isDbConnected
}) => {
  const [destination, setDestination] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<Partial<TracerouteOptions>>({
    maxHops: 30,
    packetSize: 64,
    timeout: 5000,
    queries: 3,
    useIPv6: false,
    dontFragment: true,
    packetType: 'icmp'
  });

  const handleStartTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      onStartTrace(destination.trim(), options);
      setDestination('');
    }
  };

  const handleStopAll = () => {
    activeTraces.forEach(traceId => onStopTrace(traceId));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Traceroute Control</h2>
        <div className="flex gap-2">
          <button
            onClick={onShowSettings}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onShowDatabase}
            className={`p-2 rounded ${
              isDbConnected 
                ? 'text-network-success hover:bg-green-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={isDbConnected ? 'Database Connected' : 'Database Settings'}
          >
            <Database className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleStartTrace} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter hostname or IP address (e.g., google.com, 8.8.8.8)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!destination.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Trace
          </button>
        </div>

        {activeTraces.length > 0 && (
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
            <span className="text-sm text-blue-700">
              {activeTraces.length} active trace{activeTraces.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={handleStopAll}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
            >
              <Square className="w-3 h-3" />
              Stop All
            </button>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Hops
              </label>
              <input
                type="number"
                min="1"
                max="255"
                value={options.maxHops}
                onChange={(e) => setOptions({ ...options, maxHops: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packet Size (bytes)
              </label>
              <input
                type="number"
                min="28"
                max="65507"
                value={options.packetSize}
                onChange={(e) => setOptions({ ...options, packetSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                value={options.timeout}
                onChange={(e) => setOptions({ ...options, timeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Queries per Hop
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={options.queries}
                onChange={(e) => setOptions({ ...options, queries: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packet Type
              </label>
              <select
                value={options.packetType}
                onChange={(e) => setOptions({ ...options, packetType: e.target.value as 'icmp' | 'udp' | 'tcp' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="icmp">ICMP</option>
                <option value="udp">UDP</option>
                <option value="tcp">TCP</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.useIPv6}
                  onChange={(e) => setOptions({ ...options, useIPv6: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Use IPv6</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.dontFragment}
                  onChange={(e) => setOptions({ ...options, dontFragment: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Don't Fragment</span>
              </label>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};