import React, { useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { TraceRoute, HopData } from '../types/traceroute';
import GraphNode, { GraphNodeData } from './GraphNode';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TracerouteVisualizationProps {
  traces: TraceRoute[];
  selectedTraceId?: string;
  showDetails: boolean;
  onToggleDetails: () => void;
}

const nodeTypes = {
  custom: GraphNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 150;
const NODE_HEIGHT = 100;

// Generate a unique color for each trace
const getTraceColor = (traceId: string, traceIndex: number): string => {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6366f1', // indigo
  ];
  return colors[traceIndex % colors.length];
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    node.position = {
      x: nodeWithPosition.x - NODE_WIDTH / 2,
      y: nodeWithPosition.y - NODE_HEIGHT / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export const TracerouteVisualization: React.FC<TracerouteVisualizationProps> = ({
  traces,
  selectedTraceId,
  showDetails,
  onToggleDetails
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  useEffect(() => {
    if (!traces || traces.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Filter to only include traces that have hops
    const validTraces = traces.filter(trace => trace.hops && trace.hops.length > 0);
    if (validTraces.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const nodeMap = new Map<string, Node<GraphNodeData>>();
    const edgeMap = new Map<string, Edge>();
    
    // Start node - common for all traces
    const startNodeId = 'start_node';
    nodeMap.set(startNodeId, {
      id: startNodeId,
      type: 'input',
      data: { label: 'You', hopNumber: 0 } as any,
      position: { x: 0, y: 0 },
      style: { 
        width: 60, 
        height: 40, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '12px', 
        backgroundColor: '#e0e0e0', 
        borderColor: '#bdbdbd' 
      }
    });

    // Process each trace
    validTraces.forEach((trace, traceIndex) => {
      const traceColor = getTraceColor(trace.id, traceIndex);
      const isSelected = selectedTraceId === trace.id;
      const isRunning = trace.status === 'running';
      
      let prevNodeId = startNodeId;

      // Process each hop in the trace
      trace.hops.forEach((hop, hopIndex) => {
        // Create a unique node ID based on IP address
        const nodeId = `node_${hop.ipAddress.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // If this node doesn't exist yet, create it
        if (!nodeMap.has(nodeId)) {
          const nodeData: GraphNodeData = {
            ...hop,
            isTarget: false,
            label: hop.hostname || hop.ipAddress,
          };
          
          nodeMap.set(nodeId, {
            id: nodeId,
            type: 'custom',
            data: nodeData,
            position: { x: 0, y: 0 },
            style: {
              border: isSelected ? `3px solid ${traceColor}` : '1px solid #d1d5db',
              opacity: selectedTraceId && !isSelected ? 0.6 : 1.0,
            }
          });
        } else {
          // Node exists, update its styling based on selection
          const existingNode = nodeMap.get(nodeId)!;
          existingNode.style = {
            ...existingNode.style,
            border: isSelected ? `3px solid ${traceColor}` : existingNode.style?.border || '1px solid #d1d5db',
            opacity: selectedTraceId && !isSelected ? 0.6 : 1.0,
          };
        }

        // Create edge from previous node to current node
        const edgeId = `${trace.id}_edge_${prevNodeId}_${nodeId}`;
        if (!edgeMap.has(edgeId)) {
          const hasIssues = hop.ipAddress === '*' || hop.packetLoss > 0;
          const edgeColor = hasIssues ? '#f87171' : traceColor;
          
          edgeMap.set(edgeId, {
            id: edgeId,
            source: prevNodeId,
            target: nodeId,
            animated: isRunning && hopIndex === trace.hops.length - 1,
            style: { 
              stroke: edgeColor,
              strokeWidth: isSelected ? 3 : 2,
              opacity: selectedTraceId && !isSelected ? 0.3 : 1.0,
            },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: edgeColor 
            },
            label: traces.length > 1 ? trace.destination : undefined,
            labelStyle: { 
              fontSize: '10px', 
              color: traceColor,
              fontWeight: isSelected ? 'bold' : 'normal',
            },
          });
        }

        prevNodeId = nodeId;
      });

      // Add destination node if it's different from the last hop
      const lastHop = trace.hops[trace.hops.length - 1];
      const destinationNodeId = `dest_${trace.destination.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      if (lastHop && lastHop.ipAddress !== trace.destination) {
        if (!nodeMap.has(destinationNodeId)) {
          const destNodeData: GraphNodeData = {
            hopNumber: trace.hops.length + 1,
            ipAddress: trace.destination,
            hostname: trace.destination,
            packets: [],
            averageTime: -1,
            minTime: -1,
            maxTime: -1,
            packetLoss: 0,
            isTarget: true,
            label: trace.destination,
          };

          nodeMap.set(destinationNodeId, {
            id: destinationNodeId,
            type: 'custom',
            data: destNodeData,
            position: { x: 0, y: 0 },
            style: {
              border: isSelected ? `3px solid ${traceColor}` : '1px solid #d1d5db',
              opacity: selectedTraceId && !isSelected ? 0.6 : 1.0,
            }
          });
        }

        // Edge to destination
        const destEdgeId = `${trace.id}_edge_${prevNodeId}_${destinationNodeId}`;
        if (!edgeMap.has(destEdgeId)) {
          edgeMap.set(destEdgeId, {
            id: destEdgeId,
            source: prevNodeId,
            target: destinationNodeId,
            animated: isRunning,
            style: { 
              stroke: traceColor,
              strokeWidth: isSelected ? 3 : 2,
              opacity: selectedTraceId && !isSelected ? 0.3 : 1.0,
            },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: traceColor 
            },
          });
        }
      }
    });

    const newNodes = Array.from(nodeMap.values());
    const newEdges = Array.from(edgeMap.values());
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

  }, [traces, selectedTraceId, setNodes, setEdges]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-500';
      case 'failed': return 'text-red-600';
      case 'timeout': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed': case 'timeout': return <AlertTriangle className="w-4 h-4" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const selectedTrace = traces.find(t => t.id === selectedTraceId);
  const displayTitle = traces.length === 1 
    ? `Traceroute to ${traces[0].destination}`
    : selectedTrace 
      ? `Traceroute to ${selectedTrace.destination}`
      : `Network Topology (${traces.length} traces)`;

  return (
    <div className="bg-white rounded-lg shadow-lg p-1 mb-4" style={{ height: 500 }}>
      <div className="flex justify-between items-start mb-2 p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {selectedTrace && (
              <>
                <span className={`flex items-center gap-1 ${getStatusColor(selectedTrace.status)}`}>
                  {getStatusIcon(selectedTrace.status)}
                  {selectedTrace.status}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedTrace.startTime).toLocaleString()}
                </span>
                <span>
                  {selectedTrace.hops.length} hops
                </span>
              </>
            )}
            {!selectedTrace && traces.length > 1 && (
              <span>
                {traces.length} active traces
              </span>
            )}
          </div>
          {traces.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {traces.map((trace, index) => (
                <div key={trace.id} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getTraceColor(trace.id, index) }}
                  />
                  <span className={selectedTraceId === trace.id ? 'font-semibold' : ''}>
                    {trace.destination}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onToggleDetails}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
      >
        <Controls />
        <Background gap={16} color="#e0e0e0" />
      </ReactFlow>
    </div>
  );
};
