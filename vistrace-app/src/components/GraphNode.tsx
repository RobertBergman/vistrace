import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HopData } from '../types/traceroute';
import { MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Define a type for the data prop that our custom node will receive
export interface GraphNodeData extends HopData {
  isTarget?: boolean;
  status?: 'completed' | 'timeout' | 'error' | 'warning' | 'unknown'; // Derived status for coloring
  label?: string; // Display label for the node
}

const GraphNode: React.FC<NodeProps<GraphNodeData>> = ({ data, selected }) => {
  const getNodeColor = () => {
    if (data.isTarget) return 'bg-yellow-400 border-yellow-600'; // Target node
    if (data.ipAddress === '*') return 'bg-red-400 border-red-600'; // Timeout
    if (data.packetLoss > 50) return 'bg-red-400 border-red-600'; // High packet loss
    if (data.packetLoss > 0 || data.averageTime > 150) return 'bg-orange-400 border-orange-600'; // Some loss or high latency
    if (data.averageTime < 0) return 'bg-gray-400 border-gray-600'; // No response / placeholder
    return 'bg-green-400 border-green-600'; // Good hop
  };

  const nodeSize = data.isTarget ? 'w-12 h-12' : 'w-8 h-8';
  const labelText = data.label || data.hostname || data.ipAddress;

  return (
    <>
      <div
        className={`group relative ${nodeSize} rounded-full ${getNodeColor()} flex items-center justify-center text-white text-xs font-semibold shadow-md ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      >
        {/* Node visual representation (e.g., an icon or number if needed) */}
        {/* For simplicity, we'll keep it a plain circle for now */}
        {/* {data.hopNumber} */}

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 w-72 p-3 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 left-1/2 -translate-x-1/2">
          <div className="font-bold text-sm mb-2 break-all">
            {data.hostname || 'N/A'} ({data.ipAddress})
          </div>
          <div className="text-xs space-y-1">
            <p><strong>Packets:</strong> {data.packets?.length || 0} sent</p>
            <p><strong>Loss:</strong> {data.packetLoss.toFixed(1)}%</p>
            <p><strong>Best:</strong> {data.minTime >= 0 ? `${data.minTime.toFixed(2)} ms` : 'N/A'}</p>
            <p><strong>Avg:</strong> {data.averageTime >= 0 ? `${data.averageTime.toFixed(2)} ms` : 'N/A'}</p>
            <p><strong>Worst:</strong> {data.maxTime >= 0 ? `${data.maxTime.toFixed(2)} ms` : 'N/A'}</p>
            {data.location?.city && (
              <p className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                <strong>Location:</strong> {data.location.city}, {data.location.country}
              </p>
            )}
            {data.location?.isp && (
              <p><strong>ISP:</strong> {data.location.isp}</p>
            )}
            {data.ipAddress === '*' && (
              <p className="text-red-600 font-semibold">Request timeout.</p>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-3 h-3 bg-white transform rotate-45"></div> {/* Tooltip arrow */}
        </div>
      </div>
      {/* Display label below the node */}
      {labelText && !data.isTarget && (
         <div className="text-center text-xs text-gray-600 mt-1 w-24 truncate" title={labelText}>
           {labelText}
         </div>
      )}
      {data.isTarget && (
        <div className="text-center text-sm font-semibold text-gray-800 mt-2 w-32 truncate" title={labelText}>
          {labelText}
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </>
  );
};

export default memo(GraphNode);
